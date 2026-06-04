"""
Tuya Message Queue Consumer
Ishlatish: python tuya_listener.py
"""
import os
import json
import django
import sys
import time
import logging

logging.basicConfig(level=logging.WARNING)

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from tuya_connector import TuyaOpenPulsar, TuyaCloudPulsarTopic

CLIENT_ID     = os.getenv("TUYA_CLIENT_ID")
CLIENT_SECRET = os.getenv("TUYA_CLIENT_SECRET")
WS_ENDPOINT   = "wss://mqe.tuyaeu.com:8285/"

# ============================================================
# XABAR HANDLER
# ============================================================

def handle_tuya_message(msg):
    try:
        if isinstance(msg, bytes):
            msg = msg.decode('utf-8')

        raw = json.loads(msg)

        data = (
            raw.get("payload", {}).get("data")
            or raw.get("data")
            or raw
        )

        if not data:
            print(f"⚠️  Noma'lum xabar formati: {raw}")
            return

        biz_code = data.get("bizCode", "")
        biz_data = data.get("bizData", {})

        if biz_code != "devicePropertyMessage":
            return

        device_id  = biz_data.get("devId", "")
        properties = biz_data.get("properties", [])

        print(f"\n{'='*50}")
        print(f"📨 Device: {device_id}")

        for prop in properties:
            code  = prop.get("code")
            value = prop.get("value")

            if code == "doorcontact_state":
                is_open = bool(value)
                print(f"🚪 Eshik: {'🔴 OCHIQ' if is_open else '🟢 YOPIQ'}")
                handle_door_event(device_id, is_open)
                return

        print(f"📊 Properties: {properties}")
        print(f"{'='*50}")

    except Exception as e:
        print(f"❌ Xato: {e}")
        import traceback
        traceback.print_exc()


# ============================================================
# CRM TEKSHIRUV
# ============================================================

def handle_door_event(device_id, is_open):
    from django.utils import timezone
    from datetime import timedelta
    from api.models import Room, Payment, SecurityAlert

    now = timezone.now()

    # Eshik YOPILDI
    if not is_open:
        try:
            room = Room.objects.get(tuya_device_id=device_id)
            room.door_status = 'closed'
            room.door_last_updated = now
            room.save(update_fields=['door_status', 'door_last_updated'])
            print(f"💾 {room.number}-xona: YOPIQ → saqlandi.")
        except Room.DoesNotExist:
            print(f"⚠️  Device '{device_id}' xonaga biriktirilmagan!")
        print(f"{'='*50}")
        return

    # Eshik OCHILDI
    try:
        room = Room.objects.get(tuya_device_id=device_id)
    except Room.DoesNotExist:
        print(f"⚠️  Device '{device_id}' xonaga biriktirilmagan!")
        print(f"{'='*50}")
        return

    room.door_status = 'open'
    room.door_last_updated = now
    room.save(update_fields=['door_status', 'door_last_updated'])
    print(f"💾 {room.number}-xona: OCHIQ → saqlandi. | CRM: {room.status}")

    risk_score = 0
    reasons    = []

    if room.status == 'available':
        risk_score += 80
        reasons.append(f"Bo'sh xona ({room.number}) ochildi!")

    elif room.status == 'occupied':
        recent_payment = Payment.objects.filter(
            check_in__room=room,
            created_at__gte=now - timedelta(minutes=10)
        ).first()
        if not recent_payment:
            risk_score += 55
            reasons.append(f"Xona {room.number} ochildi, to'lov topilmadi!")
        else:
            print(f"✅ To'lov topildi — normal holat.")
            print(f"{'='*50}")
            return

    elif room.status == 'dirty':
        risk_score += 20
        reasons.append("Tozalanmoqda xona ochildi.")

    print(f"⚖️  Risk: {risk_score}/100 | {', '.join(reasons)}")

    if risk_score >= 50:
        alert = SecurityAlert.objects.create(
            status='pending',
            detected_at=now,
            alert_type='unauthorized_door',
            room=room,
            risk_score=risk_score,
        )
        print(f"🚨 ALERT #{alert.id} yaratildi! Xona: {room.number}")
    elif risk_score >= 20:
        print(f"⚠️  Past risk — log qilindi.")
    else:
        print(f"✅ Normal holat.")

    print(f"{'='*50}")


# ============================================================
# ASOSIY
# ============================================================

def start_listener():
    print("=" * 60)
    print("   🏨 Hotel CRM — Tuya Door Sensor Listener")
    print("=" * 60)

    if not CLIENT_ID or not CLIENT_SECRET:
        print("❌ TUYA_CLIENT_ID yoki TUYA_CLIENT_SECRET yo'q!")
        sys.exit(1)

    print(f"\n⚙️  Client ID  : {CLIENT_ID[:8]}...")
    print(f"   WS Endpoint: {WS_ENDPOINT}")
    print(f"\n🔌 Tuya ga ulanmoqda...")

    retry_count = 0

    while True:
        try:
            open_pulsar = TuyaOpenPulsar(
                access_id=CLIENT_ID,
                access_secret=CLIENT_SECRET,
                ws_endpoint=WS_ENDPOINT,
                topic=TuyaCloudPulsarTopic.PROD,  # ✅ PROD — real sensorlar
            )

            open_pulsar.add_message_listener(handle_tuya_message)
            open_pulsar.start()

            retry_count = 0
            print("✅ Ulandi! Sensorlar kutilmoqda...\n")

            while True:
                time.sleep(1)

        except KeyboardInterrupt:
            print("\n🛑 Listener to'xtatildi.")
            try:
                open_pulsar.stop()
            except Exception:
                pass
            break

        except Exception as e:
            retry_count += 1
            wait = min(30, retry_count * 5)  # max 30 soniya kutish
            print(f"❌ Xato: {e}")
            print(f"🔄 {wait} soniyadan keyin qayta ulanish... ({retry_count}-urinish)")
            time.sleep(wait)


if __name__ == "__main__":
    start_listener()