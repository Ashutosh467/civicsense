require("dotenv").config();
const express = require("express");
const axios = require("axios");
const Groq = require("groq-sdk");
// Gemini removed — using Groq LLaMA for extraction
const FormData = require("form-data");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
// genAI removed

// ================================
// HEALTH CHECK
// ================================
app.get("/health", (req, res) => {
  res.json({ status: "AI Service Running ✅" });
});

// ================================
// MAIN ENDPOINT — receives from twilio/server.js
// ================================
app.post("/process", async (req, res) => {
  const { callerNumber, callSid, recordingUrl } = req.body;

  if (!recordingUrl || !callSid) {
    return res.status(400).json({ error: "Missing recordingUrl or callSid" });
  }

  console.log("🎙️ Received recording for:", callerNumber);
  console.log("🔗 Recording URL:", recordingUrl);

  // Respond immediately so Twilio doesn't timeout
  res.json({ message: "Processing started" });

  try {
    // STEP 1: Wait for Twilio to finish processing the recording
    console.log("⏳ Waiting 6 seconds for Twilio to finish recording...");
    await new Promise((resolve) => setTimeout(resolve, 6000));

    // STEP 1: Download audio
    console.log("⬇️ Downloading audio...");
    let audioBuffer;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const audioResponse = await axios.get(recordingUrl, {
          responseType: "arraybuffer",
          auth: {
            username: process.env.TWILIO_ACCOUNT_SID || "placeholder",
            password: process.env.TWILIO_AUTH_TOKEN || "placeholder",
          },
          timeout: 15000,
        });
        audioBuffer = Buffer.from(audioResponse.data);
        console.log(
          `✅ Audio downloaded on attempt ${attempt}, size:`,
          audioBuffer.length,
        );
        break;
      } catch (dlErr) {
        console.log(`⚠️ Download attempt ${attempt} failed:`, dlErr.message);
        if (attempt < 3) await new Promise((r) => setTimeout(r, 3000));
        else throw dlErr;
      }
    }

    // STEP 2: Transcribe with Groq Whisper
    console.log("🧠 Transcribing with Groq Whisper...");
    const formData = new FormData();
    formData.append("file", audioBuffer, {
      filename: "audio.mp3",
      contentType: "audio/mp3",
    });
    formData.append("model", "whisper-large-v3");
    formData.append("response_format", "json");
    formData.append("language", "hi");

    const transcriptionResponse = await axios.post(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
      },
    );

    const transcript = transcriptionResponse.data.text;
    console.log("✅ Transcript:", transcript);

    // STEP 3: Extract complaint data with Groq LLaMA
    console.log("🤖 Extracting complaint data with Groq LLaMA...");

    const prompt = `
You are an AI assistant for CivicSense, a civic complaint management system in India.

A citizen called a government helpline and said the following (may be in Hindi, Punjabi, Tamil, or English):

TRANSCRIPT: "${transcript}"

Your job is to carefully read the ENTIRE transcript above and extract ALL details the citizen mentioned. Do NOT use default values. Do NOT make up data. Extract ONLY what is actually said in the transcript.

Respond ONLY with a valid JSON object, no explanation, no markdown, no code block:

{
  "issueType": "The actual civic issue mentioned — e.g. Stray Dogs, Pothole, Water Supply, Garbage Collection, Street Light, Sewage, Noise Pollution, Road Damage, Electricity, Animal Attack — derive this from what the citizen actually said",
  "location": "The exact place the citizen mentioned — extract area name, sector, phase, colony, city — e.g. Kharar Phase 2, Sector 15 Chandigarh, Anna Nagar Chennai — if truly not mentioned write Unknown",
  "urgency": "high if: physical attack happened, safety risk to life, medical emergency, no water 24h+, major flooding — medium if: recurring issue, children affected, multiple people affected — low if: minor aesthetic issue",
  "emotion": "angry if citizen is angry or using strong words — distressed if citizen sounds scared or pleading — frustrated if citizen says this keeps happening — neutral if calm — derive from tone of transcript",
  "summary": "One clear English sentence summarizing exactly what the citizen reported, including the location and what happened",
  "department": "Choose the most relevant: Municipal Corporation for roads/garbage/stray animals — Water Department for water supply — Electricity Board for power — Police for crime/safety — Public Works Department for major roads — Other",
  "detectedLanguage": "Hindi or Punjabi or Tamil or Telugu or English — detect from the transcript",
  "isEnglish": true if transcript is in English, false otherwise,
  "translatedIssue": "English translation of the issue type — MUST be Roman script English ONLY — e.g. Stray Dog Attack, Pothole, Water Shortage — NEVER use Devanagari or any non-Latin script",
  "translatedLocation": "English translation of the location — MUST be Roman script English ONLY — e.g. Kharar Phase 2, Sector 12 Chandigarh — NEVER use Devanagari or any non-Latin script"
}

CRITICAL RULES:
- Read the full transcript carefully before extracting anything
- issueType MUST reflect what the citizen actually complained about — do NOT default to Water Supply
- location MUST be extracted from what the citizen said — do NOT default to Near our house
- If citizen mentions a dog attack, urgency is HIGH and issueType is Stray Dog Attack
- If citizen mentions children or family affected, urgency is at least MEDIUM
- translatedIssue and translatedLocation MUST be in English Roman script ONLY — NEVER Devanagari, Gurmukhi, or Tamil script
- summary must include the actual location and actual issue
- Always respond with ONLY the JSON object, nothing else
`;

    const llmResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 1000,
    });
    const rawText = llmResponse.choices[0].message.content;

    // Clean and parse JSON
    const cleanedText = rawText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const extracted = JSON.parse(cleanedText);
    console.log("✅ Extracted:", extracted);

    // STEP 4: Send to backend to create complaint
    console.log("📤 Sending to backend...");
    const complaintPayload = {
      callerNo: callerNumber || "Unknown",
      issueType: extracted.issueType || "General",
      location: extracted.location || "Unknown",
      urgency: extracted.urgency || "low",
      emotion: extracted.emotion || "neutral",
      summary: extracted.summary || "",
      department: extracted.department || "Municipal Corporation",
      detectedLanguage: extracted.detectedLanguage || "English",
      isEnglish: extracted.isEnglish !== false,
      translatedIssue: extracted.translatedIssue || extracted.issueType || "",
      translatedLocation:
        extracted.translatedLocation || extracted.location || "",
    };

    const backendResponse = await axios.post(
      `${process.env.BACKEND_URL}/api/complaint`,
      complaintPayload,
    );

    const complaintId = backendResponse.data.id;
    console.log("✅ Complaint created:", complaintId);

    // STEP 5: Send SMS to citizen
    // STEP 5: Send SMS to citizen
    // STEP 5: Send SMS to citizen
    console.log("📱 Sending SMS to citizen...");
    try {
      const smsRes = await axios.post(
        `${process.env.TWILIO_SERVICE_URL}/sms/complaint-received`,
        { toNumber: callerNumber, complaintId },
        { headers: { "x-internal-key": process.env.INTERNAL_SECRET } },
      );
      console.log("✅ Citizen SMS sent:", JSON.stringify(smsRes.data));
    } catch (smsErr) {
      console.error(
        "❌ SMS to citizen failed:",
        smsErr.response?.status,
        smsErr.response?.data || smsErr.message,
      );
    }

    // STEP 6: Callback Twilio service with complaintId
    console.log("🔔 Sending callback to Twilio service...");
    await axios
      .post(`${process.env.TWILIO_SERVICE_URL}/ai-response`, {
        callSid,
        status: "processed",
        complaintId,
      })
      .catch((err) => console.error("Callback error:", err.message));

    console.log("🎉 Full pipeline complete for callSid:", callSid);
  } catch (err) {
    console.error("❌ AI Pipeline Error:", err.message);

    // Even on error, try to create a fallback complaint
    try {
      await axios.post(`${process.env.BACKEND_URL}/api/complaint`, {
        callerNo: callerNumber || "Unknown",
        issueType: "General",
        location: "Unknown",
        urgency: "low",
        emotion: "neutral",
        summary: "Complaint received but could not be fully processed",
        department: "Municipal Corporation",
      });
      console.log("⚠️ Fallback complaint created");
    } catch (fallbackErr) {
      console.error("❌ Fallback also failed:", fallbackErr.message);
    }
  }
});

// ================================
// START SERVER
// ================================
app.listen(PORT, () => {
  console.log(`🤖 AI Service listening on port ${PORT}`);
});
