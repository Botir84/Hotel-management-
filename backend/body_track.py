import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from mediapipe.tasks.python.components.containers import landmark as landmark_module
import numpy as np
import time
import urllib.request
import os

# --- Model faylini yuklab olish ---
MODEL_PATH = "pose_landmarker_full.task"
MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task"

if not os.path.exists(MODEL_PATH):
    print("📥 Model yuklanmoqda...")
    urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
    print("✅ Model yuklandi!")

# --- Pose ulanishlari (skelet chiziqlar) ---
POSE_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 7),
    (0, 4), (4, 5), (5, 6), (6, 8),
    (9, 10),
    (11, 12), (11, 13), (13, 15), (15, 17), (15, 19), (15, 21), (17, 19),
    (12, 14), (14, 16), (16, 18), (16, 20), (16, 22), (18, 20),
    (11, 23), (12, 24), (23, 24),
    (23, 25), (25, 27), (27, 29), (27, 31), (29, 31),
    (24, 26), (26, 28), (28, 30), (28, 32), (30, 32),
]

def draw_landmarks(frame, result):
    if not result.pose_landmarks:
        return frame

    h, w = frame.shape[:2]

    for pose in result.pose_landmarks:
        # Nuqtalarni chizish
        for lm in pose:
            cx, cy = int(lm.x * w), int(lm.y * h)
            cv2.circle(frame, (cx, cy), 4, (0, 255, 255), -1)

        # Chiziqlarni chizish
        for (a, b) in POSE_CONNECTIONS:
            if a < len(pose) and b < len(pose):
                ax, ay = int(pose[a].x * w), int(pose[a].y * h)
                bx, by = int(pose[b].x * w), int(pose[b].y * h)
                cv2.line(frame, (ax, ay), (bx, by), (0, 200, 255), 2)

    return frame

# --- PoseLandmarker sozlash ---
base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
options = vision.PoseLandmarkerOptions(
    base_options=base_options,
    output_segmentation_masks=False,
    num_poses=1,
    min_pose_detection_confidence=0.5,
    min_pose_presence_confidence=0.5,
    min_tracking_confidence=0.5,
    running_mode=vision.RunningMode.VIDEO
)

landmarker = vision.PoseLandmarker.create_from_options(options)

# --- Kamera ---
cap = cv2.VideoCapture(0)
prev_time = 0

print("🚀 Body Tracking ishga tushdi. To'xtatish uchun 'q' ni bosing.")

while cap.isOpened():
    success, frame = cap.read()
    if not success:
        print("Kameradan tasvir olishda xatolik.")
        break

    frame = cv2.flip(frame, 1)

    # MediaPipe Image formatiga o'tkazish
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

    # Timestamp milliseconds
    timestamp_ms = int(time.time() * 1000)

    # Pose aniqlash
    result = landmarker.detect_for_video(mp_image, timestamp_ms)

    # Skeletni chizish
    frame = draw_landmarks(frame, result)

    # FPS
    curr_time = time.time()
    fps = 1 / (curr_time - prev_time) if prev_time else 0
    prev_time = curr_time
    cv2.putText(frame, f'FPS: {int(fps)}', (20, 50),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    cv2.imshow('AI Body Tracking (Skelet)', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
landmarker.close()
cv2.destroyAllWindows()