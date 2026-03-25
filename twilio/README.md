# CivicSense — SMS Microservice (MSG91)

## Setup
1. Fill twilio/.env with your credentials
2. cd twilio && npm run dev

## Internal API (called by main backend)
All routes need header: x-internal-key: civicsense_internal_2024

POST /sms/complaint-received → { toNumber, complaintId }
POST /sms/complaint-resolved → { toNumber, complaintId }
POST /sms/officer-assigned   → { officerPhone, officerName, issueType, location, officerId }

## MSG91 Setup
- Auth Key: from MSG91 dashboard → API Keys
- Sender ID: CVSNSE
- Templates already created with IDs hardcoded in .env
