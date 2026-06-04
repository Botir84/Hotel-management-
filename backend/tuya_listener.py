"""
Tuya Door Sensor Listener
Alohida repo — API orqali backend bilan gaplashadi
"""
import os
import json
import time
import logging
import requests
from tuya_connector import TuyaOpenPulsar, TuyaCloudPulsarTopic

logging.basicConfig(level=logging.WARNING)

CLIENT_ID     = os.getenv("TUYA_CLIENT_ID")
CLIENT_SECRET = os.getenv("TUYA_CLIENT_SECRET")
API_BASE_URL  = os.getenv("API_BASE_URL", "https://api.sofahotel.uz/api")
API_SECRET    = os.getenv("LISTENER_SECRET")  # xavfsizlik uchun
WS_ENDPOINT   = "wss://mqe.tuyaeu.com:8285/"

# ============================================================
# XABAR HANDLER
# ============================================================

def handle_tuya_message(msg):
    try:
        if isinstance(msg, bytes):
            msg = msg.decode('utf-8')

        raw  = json.loads(msg)
        data = (
            raw.get("payload", {}).get("data")
            or raw.get("data")
            or raw
        )

        if not data:
            return

        biz_code = data.get("bizCode", "")
        biz_data = data.get("bizData", {})

        if biz_code != "devicePropertyMessage":
            return

        device_id  = biz_data.get("devId", "")
        properties = biz_data.get("properties", [])

        for prop in properties:
            if prop.get("code") == "doorcontact_state":
                is_open = bool(prop.get("value"))
                status  = "🔴 OCHIQ" if is_open else "🟢 YOPIQ"
                print(f"\n📨 Device: {device_id} | Eshik: {status}")

                # ✅ API ga yuborish
                send_door_event(device_id, is_open)
                return

    except Exception as e:
        print(f"❌ Xato: {e}")
        import traceback
        traceback.print_exc()


def send_door_event(device_id: str, is_open: bool):
    """Backend API ga eshik hodisasini yuboradi."""
    try:
        response = requests.post(
            f"{API_BASE_URL}/door-event/",
            json={
                "device_id": device_id,
                "is_open":   is_open,
            },
            headers={
                "X-Listener-Secret": API_SECRET or "",
                "Content-Type": "application/json",
            },
            timeout=10,
        )

        if response.status_code == 200:
            data = response.json()
            print(f"✅ API javob: {data.get('message', 'OK')}")
        else:
            print(f"⚠️  API xato: {response.status_code} — {response.text[:100]}")

    except requests.exceptions.ConnectionError:
        print(f"❌ API ga ulanib bo'lmadi: {API_BASE_URL}")
    except requests.exceptions.Timeout:
        print(f"❌ API timeout!")
    except Exception as e:
        print(f"❌ Send xato: {e}")


# ============================================================
# ASOSIY
# ============================================================

def start_listener():
    print("=" * 60)
    print("   🏨 Hotel CRM — Tuya Door Sensor Listener")
    print("=" * 60)

    if not CLIENT_ID or not CLIENT_SECRET:
        print("❌ TUYA_CLIENT_ID yoki TUYA_CLIENT_SECRET yo'q!")
        import sys; sys.exit(1)

    print(f"\n⚙️  Client ID  : {CLIENT_ID[:8]}...")
    print(f"   API URL    : {API_BASE_URL}")
    print(f"   WS         : {WS_ENDPOINT}")

    retry_count = 0

    while True:
        try:
            open_pulsar = TuyaOpenPulsar(
                access_id=CLIENT_ID,
                access_secret=CLIENT_SECRET,
                ws_endpoint=WS_ENDPOINT,
                topic=TuyaCloudPulsarTopic.TEST,
            )

            open_pulsar.add_message_listener(handle_tuya_message)
            open_pulsar.start()

            retry_count = 0
            print("\n✅ Ulandi! Sensorlar kutilmoqda...\n")

            while True:
                time.sleep(1)

        except KeyboardInterrupt:
            print("\n🛑 To'xtatildi.")
            try: open_pulsar.stop()
            except: pass
            break

        except Exception as e:
            retry_count += 1
            wait = min(30, retry_count * 5)
            print(f"❌ Xato: {e}")
            print(f"🔄 {wait}s dan keyin qayta ulanish ({retry_count}-urinish)...")
            time.sleep(wait)


if __name__ == "__main__":
    start_listener()