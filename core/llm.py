import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def extract_complaint(text, caller_no="Unknown"):
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a civic complaint assistant for India. Extract complaint details and return ONLY this JSON format, nothing else: {\"callerNo\": \"\", \"issueType\": \"\", \"location\": \"\", \"urgency\": \"Low/Medium/High\", \"emotion\": \"Calm/Angry/Urgent\", \"summary\": \"\", \"status\": \"Pending\", \"time\": \"\"} Rules: Never guess missing fields, leave them empty. urgency: High if dangerous, Medium if inconvenient, Low if minor. emotion: detect from tone of text. summary: one line max."
                },
                {
                    "role": "user",
                    "content": f"Caller: {caller_no}\nComplaint: {text}"
                }
            ],
            temperature=0.1
        )

        result = response.choices[0].message.content
        complaint = json.loads(result)
        complaint["callerNo"] = caller_no
        print(f"✅ Complaint Extracted: {complaint}")
        return complaint

    except Exception as e:
        print(f"❌ LLM Error: {e}")
        return None