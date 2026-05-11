import cv2
import requests
import time
import numpy as np
import mediapipe as mp
import collections
import os
import tempfile
import threading
from ultralytics import YOLO
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from shapely.geometry import Point as ShapelyPoint, Polygon

# ============================================================
# 1. SOZLAMALAR
# ============================================================
YOLO_MODEL_PATH      = 'yolov8n.pt'
POSE_MODEL_PATH      = 'pose_landmarker_full.task'
BACKEND_BASE         = "http://127.0.0.1:8000/api"
BACKEND_CREATE_URL   = f"{BACKEND_BASE}/security/alerts/"
BACKEND_ZONES_URL    = f"{BACKEND_BASE}/camera-zones/"

TRIGGER_CLASSES      = [67, 26] # 67: telefon, 26: sumka
CONFIDENCE_THRESHOLD = 0.4
COOLDOWN_PERIOD      = 300   
FPS                  = 20
PRE_SECONDS          = 5
POST_SECONDS         = 5
BUFFER_SIZE          = (PRE_SECONDS + POST_SECONDS) * FPS

frame_buffer = collections.deque(maxlen=BUFFER_SIZE)
camera_zones = []

# --- YANGI: Odamlar xotirasi uchun lug'at ---
# { person_idx: {"has_item": bool, "item_timer": timestamp, "hand_side": "left/right"} }
person_memory = collections.defaultdict(lambda: {"has_item": False, "last_seen": 0})

POSE_CONNECTIONS = [
    (11, 12), (11, 13), (13, 15), (12, 14), (14, 16),
    (11, 23), (12, 24), (23, 24),
    (23, 25), (24, 26), (25, 27), (26, 28)
]

# ============================================================
# 2. MODELLARNI YUKLASH
# ============================================================
try:
    yolo_model = YOLO(YOLO_MODEL_PATH)
    base_options = python.BaseOptions(model_asset_path=POSE_MODEL_PATH)
    options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.VIDEO,
        num_poses=4
    )
    landmarker = vision.PoseLandmarker.create_from_options(options)
    print("✅ Modellar yuklandi.")
except Exception as e:
    print(f"❌ Yuklashda xato: {e}")
    exit()

# ============================================================
# 3. YORDAMCHI FUNKSIYALAR
# ============================================================

def fetch_zones():
    global camera_zones
    try:
        response = requests.get(BACKEND_ZONES_URL, timeout=10)
        if response.status_code == 200:
            camera_zones = response.json()
            print(f"✅ {len(camera_zones)} ta zona yuklandi.")
    except:
        print("⚠️ Backenddan zonalarni olib bo'lmadi.")

def is_inside_zone(x, y, zone_coordinates):
    try:
        polygon = Polygon([(p['x'], p['y']) for p in zone_coordinates])
        return polygon.contains(ShapelyPoint(x, y))
    except: return False

def draw_manual_landmarks(frame, pose_landmarks_list, person_mem):
    h, w, _ = frame.shape
    for idx, pose_landmarks in enumerate(pose_landmarks_list):
        pts = {}
        for i, lm in enumerate(pose_landmarks):
            cx, cy = int(lm.x * w), int(lm.y * h)
            pts[i] = (cx, cy)
            cv2.circle(frame, (cx, cy), 3, (0, 255, 0), -1)

        for connection in POSE_CONNECTIONS:
            if connection[0] in pts and connection[1] in pts:
                cv2.line(frame, pts[connection[0]], pts[connection[1]], (255, 255, 255), 1)
        
        # Telefon borligini vizual ko'rsatish
        color = (0, 0, 255) if person_mem[idx]["has_item"] else (255, 255, 255)
        status = " (MOBILE DETECTED)" if person_mem[idx]["has_item"] else ""
        if 0 in pts:
            cv2.putText(frame, f"Person {idx+1}{status}", (pts[0][0], pts[0][1]-20), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

def save_and_send_async(frames_to_save, fps):
    def _worker():
        if not frames_to_save: return
        tmp_path = os.path.join(tempfile.gettempdir(), f"alert_{int(time.time())}.mp4")
        h, w = frames_to_save[0].shape[:2]
        fourcc = cv2.VideoWriter_fourcc(*'avc1')
        out = cv2.VideoWriter(tmp_path, fourcc, fps, (w, h))
        for f in frames_to_save: out.write(f)
        out.release()
        try:
            with open(tmp_path, 'rb') as f:
                requests.post(BACKEND_CREATE_URL, files={'video_clip': f}, timeout=60)
            print("🚀 Video isboti backendga yuborildi.")
        except Exception as e: print(f"❌ Xato: {e}")
        finally:
            if os.path.exists(tmp_path): os.remove(tmp_path)

    threading.Thread(target=_worker, daemon=True).start()

# ============================================================
# 4. ASOSIY SIKL
# ============================================================

def main():
    fetch_zones()
    cap = cv2.VideoCapture(0)
    last_alert_time = 0
    post_recording = False
    post_frames_remaining = 0
    alert_frames_snapshot = []

    print("🟢 Monitoring ishga tushdi...")

    while cap.isOpened():
        success, frame = cap.read()
        if not success: break

        frame = cv2.flip(frame, 1)
        current_time = time.time()
        h, w, _ = frame.shape
        
        # 1. MediaPipe Tahlili
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        pose_res = landmarker.detect_for_video(mp_image, int(current_time * 1000))
        
        # 2. YOLO: Ob'ektlar
        yolo_res = yolo_model(frame, verbose=False)
        item_boxes = []
        for r in yolo_res:
            for box in r.boxes:
                if int(box.cls[0]) in TRIGGER_CLASSES and float(box.conf[0]) > CONFIDENCE_THRESHOLD:
                    b = list(map(int, box.xyxy[0]))
                    item_boxes.append(b)
                    cv2.rectangle(frame, (b[0], b[1]), (b[2], b[3]), (0, 165, 255), 2) # To'q sariq: telefon

        # 3. Mantiqiy ishlov berish
        alert_triggered = False
        person_hands = [] # [(person_idx, left_hand, right_hand, hips_y)]

        if pose_res.pose_landmarks:
            for idx, pose in enumerate(pose_res.pose_landmarks):
                # Nuqtalar koordinatalari
                lw = (int(pose[15].x * w), int(pose[15].y * h)) # Chap bilak
                rw = (int(pose[16].x * w), int(pose[16].y * h)) # O'ng bilak
                hip_y = int(pose[23].y * h) # Bel chizig'i (cho'ntak darajasi)
                
                person_hands.append((idx, lw, rw, hip_y))

                # --- PERSISTENCE LOGIC (Xotirada saqlash) ---
                # Agar birorta telefon qutisi qo'llardan biriga yaqin bo'lsa, has_item = True
                for box in item_boxes:
                    bx, by = (box[0]+box[2])//2, (box[1]+box[3])//2
                    if np.hypot(bx-lw[0], by-lw[1]) < 70 or np.hypot(bx-rw[0], by-rw[1]) < 70:
                        person_memory[idx]["has_item"] = True
                        person_memory[idx]["last_seen"] = current_time

                # --- RESET LOGIC (Cho'ntakka solish) ---
                # Agar telefonli odam qo'lini belidan pastga tushirsa, telefon yo'qolgan deb hisoblaymiz
                if person_memory[idx]["has_item"]:
                    if lw[1] > hip_y + 30 and rw[1] > hip_y + 30:
                        person_memory[idx]["has_item"] = False # Cho'ntakka tushdi

            # Skeletni chizish
            draw_manual_landmarks(frame, pose_res.pose_landmarks, person_memory)

        # 4. TRANSFER DETECTION (Uzatishni aniqlash)
        # Ikki xil odam qo'llari bir-biriga yaqinlashsa va birida telefon bo'lsa
        for i in range(len(person_hands)):
            for j in range(i + 1, len(person_hands)):
                idx1, lw1, rw1, _ = person_hands[i]
                idx2, lw2, rw2, _ = person_hands[j]

                # Masofalar kombinatsiyasi
                dists = [
                    np.hypot(lw1[0]-lw2[0], lw1[1]-lw2[1]),
                    np.hypot(lw1[0]-rw2[0], lw1[1]-rw2[1]),
                    np.hypot(rw1[0]-lw2[0], rw1[1]-lw2[1]),
                    np.hypot(rw1[0]-rw2[0], rw1[1]-rw2[1])
                ]

                if min(dists) < 80: # Qo'llar kontaktda
                    # Agar birida telefon bo'lgan bo'lsa (Persistence tufayli ishlaydi)
                    if person_memory[idx1]["has_item"] or person_memory[idx2]["has_item"]:
                        # Kassa zonasi tekshiruvi
                        cx, cy = (lw1[0]+lw2[0])//2, (lw1[1]+lw2[1])//2
                        in_cashier = any(is_inside_zone(cx, cy, z['coordinates']) 
                                         for z in camera_zones if z['zone_type'] == 'cashier')
                        
                        if in_cashier:
                            alert_triggered = True
                            cv2.putText(frame, "!!! ITEM TRANSFER DETECTED !!!", (cx-100, cy-50), 
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 3)

        # 5. Zonalar chizmasi
        for zone in camera_zones:
            zone_pts = np.array([[p['x'], p['y']] for p in zone['coordinates']], np.int32).reshape((-1, 1, 2))
            color = (0, 255, 255) if zone['zone_type'] == 'cashier' else (255, 255, 0)
            cv2.polylines(frame, [zone_pts], True, color, 2)
            cv2.putText(frame, zone['name'], (zone_pts[0][0][0], zone_pts[0][0][1]-10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

        # 6. Buffer va Recording
        frame_buffer.append(frame.copy())

        if alert_triggered and (current_time - last_alert_time > COOLDOWN_PERIOD):
            if not post_recording:
                print("🚨 ALERT: Telefon/Pul uzatildi!")
                last_alert_time = current_time
                alert_frames_snapshot = list(frame_buffer)
                post_recording = True
                post_frames_remaining = POST_SECONDS * FPS

        if post_recording:
            alert_frames_snapshot.append(frame.copy())
            post_frames_remaining -= 1
            if post_frames_remaining <= 0:
                post_recording = False
                save_and_send_async(alert_frames_snapshot, FPS)
                alert_frames_snapshot = []

        cv2.imshow("Smart Hotel Security AI", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'): break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()