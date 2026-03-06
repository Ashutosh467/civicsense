import os
from datetime import datetime
from core.stt import speech_to_text
from core.llm import extract_complaint
from core.sender import send_complaint

def process_complaint(audio_path=None, text_input=None, caller_no="Unknown"):
    print("\n🎙️ CivicSense AI Pipeline Starting...")
    print("="*50)
    
    if audio_path:
        print("\n📢 Converting Speech to Text...")
        text = speech_to_text(audio_path)
    elif text_input:
        print("\n📝 Using Text Input (Simulation Mode)...")
        text = text_input
    else:
        print("❌ No input provided!")
        return None
    
    if not text:
        print("❌ Could not process input!")
        return None
    
    print("\n🧠 AI Analyzing Complaint...")
    complaint = extract_complaint(text, caller_no)
    
    if not complaint:
        print("❌ Could not extract complaint!")
        return None
    
    complaint["time"] = datetime.now().isoformat()
    
    print("\n📤 Sending to Backend...")
    send_complaint(complaint)
    
    print("\n✅ Pipeline Complete!")
    print("="*50)
    print(f"Final JSON: {complaint}")
    return complaint

if __name__ == "__main__":
    process_complaint(
        text_input="Mera naam Raj hai, Sector 12 mein paani nahi aa raha 3 din se, bohot problem ho rahi hai",
        caller_no="+91-9876543210"
    )