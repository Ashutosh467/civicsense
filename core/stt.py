import os
from dotenv import load_dotenv

load_dotenv()

def speech_to_text(audio_file_path):
    """Convert audio file to text — Whisper integration pending"""
    try:
        # Simulation mode — real Whisper baad mein add karenge
        print(f"✅ Audio file received: {audio_file_path}")
        return None
    
    except Exception as e:
        print(f"❌ STT Error: {e}")
        return None
    