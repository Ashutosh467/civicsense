import requests
import os
from dotenv import load_dotenv

load_dotenv()

BACKEND_URL = os.getenv("BACKEND_URL")

def send_complaint(complaint_data):
    """Send complaint to backend API"""
    try:
        response = requests.post(
            BACKEND_URL,
            json=complaint_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            print(f"✅ Complaint sent successfully!")
            return True
        else:
            print(f"❌ Backend error: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"⚠️ Backend not running — saving locally!")
        save_locally(complaint_data)
        return False
        
    except Exception as e:
        print(f"❌ Sender Error: {e}")
        return False

def save_locally(complaint_data):
    """Save complaint locally if backend is down"""
    import json
    with open("complaints_backup.json", "a") as f:
        f.write(json.dumps(complaint_data) + "\n")
    print(f"✅ Saved locally to complaints_backup.json")