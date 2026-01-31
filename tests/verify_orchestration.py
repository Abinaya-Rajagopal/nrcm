import httpx
import sys

def test_analyze():
    url = "http://127.0.0.1:8000/api/v1/analyze"
    payload = {
        "image_base64": "test_data",
        "use_demo_image": True
    }
    
    try:
        print(f"Testing {url}...")
        response = httpx.post(url, json=payload)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Success! Response received.")
            print(f"Risk Level: {data.get('risk_level')}")
            print(f"Area: {data.get('area_cm2')}")
            print(f"Trajectory Expected: {data.get('trajectory', {}).get('expected')}")
        else:
            print(f"❌ Failed. Status Code: {response.status_code}")
            print(f"Detail: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_analyze()
