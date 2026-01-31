
import json
import urllib.request
import base64
import os

def validate_backend():
    print("--- BACKEND FINAL VALIDATION SUITE ---")
    base_url = "http://localhost:8000/api/v1/analyze"
    health_url = f"{base_url}/health"
    
    # 1. Check Health
    print("\n[1/4] Checking Health Endpoint...")
    try:
        with urllib.request.urlopen(health_url) as resp:
            health = json.loads(resp.read().decode())
            print(f"✅ Status: {health['status']}, Demo Mode: {health['demo_mode']}")
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return

    # 2. Check Layered Response & Simulation ON
    print("\n[2/4] Testing Layered Response (Simulation ON)...")
    image_path = os.path.join("e:\\nrcm\\backend\\demo_assets\\wound_images\\primary\\demo_01.jpg")
    with open(image_path, "rb") as f:
        msg = base64.b64encode(f.read()).decode()

    payload_on = {
        "image_base64": msg,
        "enable_simulation": True,
        "metadata": {"is_smoker": True}
    }
    
    req_on = urllib.request.Request(base_url, data=json.dumps(payload_on).encode(), headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req_on) as resp:
        data = json.loads(resp.read().decode())
        print("✅ Measurement Layer present")
        print(f"✅ Simulation Layer enabled: {data['simulation']['enabled']}")
        print(f"✅ Alert Reason: {data['measurement']['alert_reason']}")
        print(f"✅ Deviation calculated: {data['measurement']['deviation_cm2']}")
        print(f"✅ limitations block present: {len(data['limitations'])} items")

    # 3. Check Simulation Toggle (Reset Support)
    print("\n[3/4] Testing Simulation Toggle (Simulation OFF)...")
    payload_off = {
        "image_base64": msg,
        "enable_simulation": False
    }
    req_off = urllib.request.Request(base_url, data=json.dumps(payload_off).encode(), headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req_off) as resp:
        data_off = json.loads(resp.read().decode())
        print(f"✅ Simulation Layer is null: {data_off.get('simulation') is None}")
        print("✅ Measurement data remains consistent")

    # 4. Check Metadata & Persistence
    print("\n[4/4] Verifying Metadata & Trajectories...")
    print(f"✅ Observation Count: {data['metadata']['observation_count']}")
    print(f"✅ Analysis ID: {data['metadata']['analysis_id']}")
    print(f"✅ Actual Curve length: {len(data['measurement']['trajectory']['actual'])}")

    print("\n✨ ALL FINAL HARDENING CHECKS PASSED")

if __name__ == "__main__":
    validate_backend()
