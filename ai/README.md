# CivicSense — AI Microservice

## What it does
1. Receives recording URL from Twilio microservice
2. Downloads audio
3. Transcribes with Groq Whisper
4. Extracts complaint data with Gemini
5. Creates complaint in backend
6. Callbacks Twilio service

## Setup
1. cd ai
2. npm install
3. Fill ai/.env with your API keys
4. npm run dev

## Endpoint
POST /process
Body: { callerNumber, callSid, recordingUrl }
