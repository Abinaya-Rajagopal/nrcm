
import json
import base64
import os
import urllib.request

def run_full_research_test():
    url = "http://localhost:8000/api/v1/analyze"
    
    # Path to a real demo image
    image_path = os.path.join(os.path.dirname(__file__), "demo_assets", "wound_images", "primary", "demo_01.jpg")
    
    with open(image_path, "rb") as f:
        img_base64 = base64.b64encode(f.read()).decode('utf-8')
    
    # Full Research Payload: Image + Contextual Adjustments
    payload = {
        "image_base64": img_base64,
        "use_demo_image": False,
        "metadata": {
            "is_smoker": True,
            "has_diabetes": True,
            "has_reference_object": True,
            "surgery_type": "Orthopedic Post-Op",
            "age": 65
        }
    }
    
    print(f"--- STARTING FULL RESEARCH TEST ---")
    print(f"Image Source: {image_path}")
    print(f"Adjustments: Smoker, Diabetes, Reference Coin, Age 45")
    
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
    
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            
            print("\n✅ API Response Received")
            print(f"Analysis ID: {data['metadata']['analysis_id']}")
            print(f"Captured At: {data['metadata']['captured_at']}")
            
            print("\n[Layer A: GROUND TRUTH MEASUREMENT]")
            m = data['measurement']
            print(f"  Real Area: {m['area_cm2']} cm2")
            print(f"  Deviation: {m['deviation_cm2']} cm2")
            print(f"  Trajectory (Actual): {m['trajectory']['actual']}")
            print(f"  Trajectory (Expected): {m['trajectory']['expected']}")
            print(f"  Risk Level: {m['risk_level']}")
            alert = m.get("alert_reason")
            if alert:
                print("  Alert:", alert)
            
            print("\n[Layer B: RESEARCH SIMULATION]")
            s = data.get('simulation')
            if s:
                print(f"  Assumptions: {s['assumptions_used']}")
                print(f"  Simulated Reference Curve: {s['reference_curve']}")
                print(f"  Visual Extrapolation: {s['extrapolated_curve']}")
                print(f"  Simulated Area: {s['simulated_area_cm2']} cm2")
            else:
                print("  Simulation: DISABLED")
            
            print("\n[Research Context]")
            print(f"  Limitations: {data['limitations']}")
            print(f"  Observation Count: {data['metadata']['observation_count']}")
            print(f"  Demo Mode: {data['flags']['demo_mode']}")
            
    except Exception as e:
        print(f"\n❌ Test Failed: {str(e)}")

if __name__ == "__main__":
    run_full_research_test()
