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

# ============================================================
# 1. SOZLAMALAR
# ============================================================
YOLO_MODEL_PATH      = 'yolov8n.pt'
POSE_MODEL_PATH      = 'pose_landmarker_full.task'
BACKEND_CREATE_URL   = "http://127.0.0.1:8000/api/security/alerts/"
BACKEND_VERIFY_URL   = "http://127.0.0.1:8000/api/security/check/"

# YOLO class ID lari — ishlab chiqarish uchun: pul (cash) custom model kerak
# Test uchun: 67=telefon, 26=sumka, 0=odam
TRIGGER_CLASSES      = [67, 26]
CONFIDENCE_THRESHOLD = 0.4

COOLDOWN_PERIOD      = 300   # 5 daqiqa — qayta alert bermaslik
VERIFY_INTERVAL      = 30    # Backend tekshiruv oralig'i (soniya)

# ============================================================
# 2. VIDEO BUFFER SOZLAMALARI
# ============================================================
FPS            = 20
PRE_SECONDS    = 5    # Voqeadan OLDIN necha soniya saqlash
POST_SECONDS   = 5    # Voqeadan KEYIN necha soniya yozib davom etish
BUFFER_SIZE    = (PRE_SECONDS + POST_SECONDS) * FPS

frame_buffer   = collections.deque(maxlen=BUFFER_SIZE)

# ============================================================
# 3. MODELLARNI YUKLASH
# ============================================================
try:
    yolo_model = YOLO(YOLO_MODEL_PATH)
    print("✅ YOLOv8 modeli yuklandi.")
except Exception as e:
    print(f"❌ YOLO yuklanmadi: {e}")
    exit()

try:
    base_options = python.BaseOptions(model_asset_path=POSE_MODEL_PATH)
    options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.VIDEO,
        num_poses=2,
        min_pose_detection_confidence=0.5,
        min_pose_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )
    landmarker = vision.PoseLandmarker.create_from_options(options)
    print("✅ MediaPipe Pose Landmarker yuklandi.")
except Exception as e:
    print(f"❌ MediaPipe yuklanmadi: {e}")
    exit()

print("✅ Barcha modellar tayyor. Kamera ochilmoqda...")

# ============================================================
# 4. VIDEO YOZISH VA BACKENDGA YUBORISH
# ============================================================

def get_working_fourcc():
    """
    Turli platformalarda ishlaydi.
    Linux: mp4v, Windows: H264 yoki XVID, Mac: avc1
    """
    candidates = [
        ('avc1', '.mp4'),
        ('H264', '.mp4'),
        ('mp4v', '.mp4'),
        ('XVID', '.avi'),
    ]
    return candidates   # hammasini ketma-ket sinab ko'ramiz

def write_video_to_file(frames, fps, output_path):
    """
    Kadrlar ro'yxatini faylga yozadi.
    Agar birinchi codec ishlamasa, keyingisini sinaydi.
    """
    if not frames:
        print("⚠️  Yoziladigan kadr yo'q.")
        return False

    h, w = frames[0].shape[:2]
    candidates = get_working_fourcc()

    for fourcc_str, ext in candidates:
        # output_path extensionini almashtirish
        base = os.path.splitext(output_path)[0]
        actual_path = base + ext

        fourcc = cv2.VideoWriter_fourcc(*fourcc_str)
        writer = cv2.VideoWriter(actual_path, fourcc, fps, (w, h))

        if not writer.isOpened():
            writer.release()
            continue

        for f in frames:
            writer.write(f)
        writer.release()

        # Fayl hajmi tekshiruvi — 0 byte bo'lsa codec ishlamagan
        if os.path.exists(actual_path) and os.path.getsize(actual_path) > 1000:
            print(f"✅ Video yozildi: {actual_path}  "
                  f"({len(frames)} kadr, codec={fourcc_str})")
            return actual_path

        # Muvaffaqiyatsiz bo'lsa faylni o'chirish
        if os.path.exists(actual_path):
            os.remove(actual_path)

    print("❌ Hech qaysi codec bilan video yozib bo'lmadi.")
    return False


def send_video_to_backend(video_path, extra_data=None, max_retries=3):
    """
    Videoni Django backendga multipart/form-data orqali yuboradi.
    Muvaffaqiyatsiz bo'lsa max_retries marta qayta urinadi.
    """
    if not video_path or not os.path.exists(video_path):
        print("❌ Yuborish uchun video fayl topilmadi.")
        return False

    file_size = os.path.getsize(video_path)
    print(f"📤 Video yuborilmoqda: {video_path}  ({file_size / 1024:.1f} KB)")

    for attempt in range(1, max_retries + 1):
        try:
            with open(video_path, 'rb') as f:
                # Django backend qabul qiladigan format:
                # POST request — multipart/form-data
                files = {
                    'video_clip': (
                        os.path.basename(video_path),
                        f,
                        'video/mp4'   # Content-Type
                    )
                }
                data = extra_data or {
                    'alert_type': 'cash_exchange',
                    'confidence':  'high',
                    'timestamp':   str(int(time.time())),
                }
                response = requests.post(
                    BACKEND_CREATE_URL,
                    files=files,
                    data=data,
                    timeout=60   # katta video uchun 60 soniya
                )

            if response.status_code in (200, 201):
                print(f"🚀 Backend qabul qildi! "
                      f"Status: {response.status_code}  "
                      f"Javob: {response.text[:200]}")
                return True
            else:
                print(f"⚠️  Backend xato qaytardi "
                      f"({attempt}/{max_retries}): "
                      f"Status={response.status_code}  "
                      f"Javob={response.text[:200]}")

        except requests.exceptions.ConnectionError:
            print(f"❌ Backend bilan aloqa yo'q "
                  f"({attempt}/{max_retries}). "
                  f"URL: {BACKEND_CREATE_URL}")
        except requests.exceptions.Timeout:
            print(f"⏱️  Timeout ({attempt}/{max_retries}). "
                  f"Video juda katta yoki server sekin.")
        except Exception as e:
            print(f"❌ Kutilmagan xato ({attempt}/{max_retries}): {e}")

        if attempt < max_retries:
            time.sleep(2 * attempt)   # 2s, 4s, ...

    print("❌ Video backendga yuborib bo'lmadi.")
    return False


def save_and_send_async(frames_snapshot, fps):
    """
    Video yozish va yuborishni alohida thread'da bajaradi —
    asosiy kamera siklini bloklamaydi.
    """
    def _worker():
        # Vaqtinchalik fayl — tizim temp papkasida
        tmp_fd, tmp_path = tempfile.mkstemp(
            prefix=f"alert_{int(time.time())}_",
            suffix='.mp4'
        )
        os.close(tmp_fd)   # VideoWriter o'zi ochadi

        try:
            actual_path = write_video_to_file(frames_snapshot, fps, tmp_path)
            if actual_path:
                send_video_to_backend(actual_path)
        finally:
            # Vaqtinchalik fayllarni tozalash
            for p in [tmp_path, actual_path if 'actual_path' in dir() else None]:
                if p and os.path.exists(p):
                    try:
                        os.remove(p)
                    except Exception:
                        pass

    t = threading.Thread(target=_worker, daemon=True)
    t.start()

# ============================================================
# 5. POSE / QO'L YAQINLIGI ANIQLASH
# ============================================================

# MediaPipe Pose landmark indekslari — QO'L / BILAK
# https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
WRIST_LEFT   = 15   # chap bilek
WRIST_RIGHT  = 16   # o'ng bilek
PINKY_LEFT   = 17
INDEX_LEFT   = 19
THUMB_LEFT   = 21
PINKY_RIGHT  = 18
INDEX_RIGHT  = 20
THUMB_RIGHT  = 22

HAND_LANDMARKS = [
    WRIST_LEFT, WRIST_RIGHT,
    PINKY_LEFT, PINKY_RIGHT,
    INDEX_LEFT, INDEX_RIGHT,
    THUMB_LEFT, THUMB_RIGHT,
]


def get_hand_points(pose_landmarks, frame_shape):
    """
    Bir kishi uchun qo'l nuqtalarini piksel koordinatasiga aylantiradi.
    """
    fh, fw = frame_shape[:2]
    points = []
    for idx in HAND_LANDMARKS:
        if idx < len(pose_landmarks):
            lm = pose_landmarks[idx]
            # visibility tekshiruvi — ko'rinmayotgan nuqtalarni o'tkazib yuborish
            if hasattr(lm, 'visibility') and lm.visibility < 0.3:
                continue
            points.append((int(lm.x * fw), int(lm.y * fh)))
    return points


def is_hand_in_box(hand_points, box):
    """
    Qo'l nuqtalaridan birortasi bounding box ichidami?
    """
    x1, y1, x2, y2 = box
    # Box'ni biroz kengaytirish (margin)
    margin = 20
    x1m, y1m = x1 - margin, y1 - margin
    x2m, y2m = x2 + margin, y2 + margin
    for (cx, cy) in hand_points:
        if x1m <= cx <= x2m and y1m <= cy <= y2m:
            return True
    return False


def hands_distance(points_a, points_b):
    """
    Ikki kishi qo'llari orasidagi minimal masofa (piksel).
    """
    if not points_a or not points_b:
        return float('inf')
    min_dist = float('inf')
    for (ax, ay) in points_a:
        for (bx, by) in points_b:
            d = ((ax - bx) ** 2 + (ay - by) ** 2) ** 0.5
            if d < min_dist:
                min_dist = d
    return min_dist

# ============================================================
# 6. ASOSIY SIKL
# ============================================================

def main():
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("❌ Kamera ochilmadi.")
        return

    # Haqiqiy FPS ni o'lchash
    cap.set(cv2.CAP_PROP_FPS, FPS)
    actual_fps = cap.get(cv2.CAP_PROP_FPS) or FPS
    print(f"📷 Kamera FPS: {actual_fps}")

    last_alert_time  = 0
    last_verify_time = 0

    # POST-event kadrlarini yozib olish uchun
    post_recording        = False
    post_frames_remaining = 0
    alert_frames_snapshot = []

    print("🟢 Monitoring boshlandi. Chiqish uchun 'q' bosing.\n")

    while cap.isOpened():
        success, frame = cap.read()
        if not success:
            print("⚠️  Kameradan kadr olinmadi.")
            time.sleep(0.05)
            continue

        frame = cv2.flip(frame, 1)
        current_time = time.time()

        # --- Buffer'ga yozish ---
        frame_buffer.append(frame.copy())

        # --- POST-event yozuvi davom etayotgan bo'lsa ---
        if post_recording:
            alert_frames_snapshot.append(frame.copy())
            post_frames_remaining -= 1
            cv2.putText(frame, f"⏺ REC ({post_frames_remaining})",
                        (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            if post_frames_remaining <= 0:
                post_recording = False
                print(f"💾 Jami {len(alert_frames_snapshot)} kadr saqlandi. "
                      f"Yuborish boshlanyapti...")
                save_and_send_async(alert_frames_snapshot.copy(), int(actual_fps))
                alert_frames_snapshot = []

        # --- YOLO: Obyekt aniqlash ---
        yolo_results = yolo_model(frame, verbose=False)
        detected_boxes = []
        for result in yolo_results:
            for box in result.boxes:
                cls_id = int(box.cls[0])
                conf   = float(box.conf[0])
                if cls_id in TRIGGER_CLASSES and conf > CONFIDENCE_THRESHOLD:
                    coords = list(map(int, box.xyxy[0]))
                    detected_boxes.append((coords, conf, cls_id))
                    # Qizil ramka
                    cv2.rectangle(frame,
                                  (coords[0], coords[1]),
                                  (coords[2], coords[3]),
                                  (0, 0, 255), 2)
                    cv2.putText(frame,
                                f"cls:{cls_id} {conf:.2f}",
                                (coords[0], coords[1] - 8),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)

        # --- MediaPipe: Skelet aniqlash ---
        rgb_frame  = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image   = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        ts_ms      = int(current_time * 1000)
        pose_result = landmarker.detect_for_video(mp_image, ts_ms)

        # Har bir kishi uchun qo'l nuqtalarini olish
        all_hand_points = []
        if pose_result.pose_landmarks:
            for pose_lms in pose_result.pose_landmarks:
                pts = get_hand_points(pose_lms, frame.shape)
                all_hand_points.append(pts)
                # Qo'l nuqtalarini ko'k doira bilan ko'rsatish (debug)
                for (cx, cy) in pts:
                    cv2.circle(frame, (cx, cy), 5, (255, 100, 0), -1)

        # --- Uzatish mantiqini tekshirish ---
        alert_triggered = False

        for (box, conf, cls_id) in detected_boxes:

            # Usul 1: Obyekt atrofida kamida 2 kishining qo'li bor
            hands_in_box = [
                pts for pts in all_hand_points
                if is_hand_in_box(pts, box)
            ]
            if len(hands_in_box) >= 2:
                alert_triggered = True
                cv2.rectangle(frame,
                              (box[0], box[1]), (box[2], box[3]),
                              (0, 255, 0), 3)
                cv2.putText(frame, "✅ UZATISH ANIQLANDI!",
                            (box[0], box[1] - 15),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

        # Usul 2: Ikki kishi qo'llari bir-biriga yaqin (ob'ektsiz uzatish)
        if len(all_hand_points) >= 2 and not alert_triggered:
            dist = hands_distance(all_hand_points[0], all_hand_points[1])
            if dist < 80:   # 80 pikseldan yaqin = qo'l-qo'l kontakt
                alert_triggered = True
                cv2.putText(frame, f"✅ QO'L KONTAKT! ({dist:.0f}px)",
                            (10, 70),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 100), 2)

        # --- Alert ishga tushirish ---
        if alert_triggered and (current_time - last_alert_time > COOLDOWN_PERIOD):
            if not post_recording:
                print(f"\n🚨 UZATISH ANIQLANDI! Video yozilmoqda...")
                last_alert_time = current_time

                # Pre-event kadrlar (buffer'dan)
                alert_frames_snapshot = list(frame_buffer)

                # Post-event yozuvini boshlash
                post_recording        = True
                post_frames_remaining = int(POST_SECONDS * actual_fps)

        # --- Cooldown holati ko'rsatish ---
        remaining_cooldown = COOLDOWN_PERIOD - (current_time - last_alert_time)
        if remaining_cooldown > 0 and last_alert_time > 0:
            cd_text = f"⏳ Cooldown: {remaining_cooldown:.0f}s"
            cv2.putText(frame, cd_text, (10, frame.shape[0] - 15),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (200, 200, 0), 1)

        # --- Odamlar soni ko'rsatish ---
        person_count = len(pose_result.pose_landmarks) if pose_result.pose_landmarks else 0
        cv2.putText(frame, f"Odamlar: {person_count}",
                    (10, frame.shape[0] - 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (200, 200, 200), 1)

        # --- Backend tekshiruvi (payment confirmed?) ---
        if current_time - last_verify_time > VERIFY_INTERVAL:
            def _check():
                try:
                    r = requests.get(BACKEND_VERIFY_URL, timeout=5)
                    print(f"🔍 Backend check: {r.status_code}")
                except Exception:
                    pass
            threading.Thread(target=_check, daemon=True).start()
            last_verify_time = current_time

        # --- Oynani ko'rsatish ---
        cv2.imshow("🏨 Hotel Security Monitor", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            print("\n🛑 Foydalanuvchi tomonidan to'xtatildi.")
            break

    cap.release()
    landmarker.close()
    cv2.destroyAllWindows()
    print("✅ Dastur yopildi.")


if __name__ == "__main__":
    main()