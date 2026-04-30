import cv2
import requests
import time
import numpy as np
import mediapipe as mp
import collections
import os
from ultralytics import YOLO
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# --- 1. SOZLAMALAR ---
YOLO_MODEL_PATH = 'yolov8n.pt'
POSE_MODEL_PATH = 'pose_landmarker_full.task'
BACKEND_CREATE_URL = "http://127.0.0.1:8000/api/security/alerts/"
BACKEND_VERIFY_URL = "http://127.0.0.1:8000/api/security/check/"

TRIGGER_CLASSES = [67, 26] # Test uchun: 67-telefon, 26-sumka
CONFIDENCE_THRESHOLD = 0.4
COOLDOWN_PERIOD = 300      # 5 minut (qayta-qayta alert bermaslik uchun)
VERIFY_INTERVAL = 30       # Backend tekshiruvi oralig'i

# --- 2. VIDEO BUFFER VA FPS ---
FPS = 20                   # Veb-kamera uchun o'rtacha FPS
BUFFER_SECONDS = 10        # Voqeadan oldingi va keyingi jami vaqt
BUFFER_SIZE = BUFFER_SECONDS * FPS
frame_buffer = collections.deque(maxlen=BUFFER_SIZE)

# --- 3. MODELLARNI YUKLASH ---
try:
    yolo_model = YOLO(YOLO_MODEL_PATH)
    base_options = python.BaseOptions(model_asset_path=POSE_MODEL_PATH)
    options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.VIDEO,
        num_poses=2
    )
    landmarker = vision.PoseLandmarker.create_from_options(options)
    print("✅ Modellar va kamera tayyor.")
except Exception as e:
    print(f"❌ Yuklashda xato: {e}")
    exit()

# --- 4. YORDAMCHI FUNKSIYALAR ---
def save_and_send_video(frames):
    """Xotiradagi kadrlardan video yasab Django'ga yuboradi"""
    if not frames: return
    
    temp_filename = f"alert_{int(time.time())}.mp4"
    h, w, _ = frames[0].shape
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(temp_filename, fourcc, FPS, (w, h))
    
    for f in frames:
        out.write(f)
    out.release()
    
    try:
        with open(temp_filename, 'rb') as f:
            files = {'video_clip': f}
            response = requests.post(BACKEND_CREATE_URL, files=files, timeout=30)
            if response.status_code == 201:
                print(f"🚀 Isbot videosi backendga yuborildi!")
    except Exception as e:
        print(f"❌ Video yuborishda xato: {e}")
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

def is_hand_near_object(hand_landmarks, obj_box, frame_shape):
    """Qo'l nuqtalari obyekt ramkasi ichidami?"""
    fh, fw = frame_shape[:2]
    x1, y1, x2, y2 = obj_box
    # Bilak va barmoq uchlari nuqtalari
    hand_points = [15, 16, 17, 18, 19, 20, 21, 22] 
    for idx in hand_points:
        if idx < len(hand_landmarks):
            lm = hand_landmarks[idx]
            cx, cy = int(lm.x * fw), int(lm.y * fh)
            if x1 <= cx <= x2 and y1 <= cy <= y2:
                return True
    return False

# --- 5. ASOSIY SIKL ---
cap = cv2.VideoCapture(0) # Kompyuter kamerasidan foydalanish
last_alert_time = 0
last_verify_time = 0
prev_time = 0

while cap.isOpened():
    success, frame = cap.read()
    if not success: break
    
    frame = cv2.flip(frame, 1) # Oyna effekti
    frame_buffer.append(frame.copy()) # Har bir kadrni xotiraga yozish
    
    current_time = time.time()
    
    # YOLO: Obyektni topish
    yolo_results = yolo_model(frame, verbose=False)
    money_boxes = []
    for result in yolo_results:
        for box in result.boxes:
            if int(box.cls[0]) in TRIGGER_CLASSES and float(box.conf[0]) > CONFIDENCE_THRESHOLD:
                money_boxes.append(list(map(int, box.xyxy[0])))

    # MediaPipe: Skeletni topish
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
    timestamp_ms = int(current_time * 1000)
    pose_result = landmarker.detect_for_video(mp_image, timestamp_ms)

    # Hand-to-Hand mantiqi
    alert_triggered_now = False
    for m_box in money_boxes:
        hands_in_box = 0
        if pose_result.pose_landmarks:
            for pose in pose_result.pose_landmarks:
                if is_hand_near_object(pose, m_box, frame.shape):
                    hands_in_box += 1
            
            # Agar ramka ichida kamida 2 kishining qo'li bo'lsa
            if hands_in_box >= 2:
                alert_triggered_now = True
                cv2.rectangle(frame, (m_box[0], m_box[1]), (m_box[2], m_box[3]), (0, 255, 0), 3)
                cv2.putText(frame, "UZATISH!", (m_box[0], m_box[1]-10), 2, 0.8, (0,255,0), 2)
            else:
                cv2.rectangle(frame, (m_box[0], m_box[1]), (m_box[2], m_box[3]), (0, 0, 255), 2)

    # Alert yuz berganda video yuborish
    if alert_triggered_now and (current_time - last_alert_time > COOLDOWN_PERIOD):
        print("🚨 Alert! Video yozilmoqda...")
        save_and_send_video(list(frame_buffer))
        last_alert_time = current_time

    # Backendni tekshirib turish (Payment bilan solishtirish uchun)
    if current_time - last_verify_time > VERIFY_INTERVAL:
        try:
            requests.get(BACKEND_VERIFY_URL, timeout=5)
            last_verify_time = current_time
        except: pass

    # Ko'rsatish
    cv2.imshow("Hand-to-Hand Security Monitor", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'): break

cap.release()
landmarker.close()
cv2.destroyAllWindows()