require("dotenv").config();
const express = require("express");
const axios = require("axios");
const Groq = require("groq-sdk");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const FormData = require("form-data");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
    // STEP 1: Download audio
    console.log("⬇️ Downloading audio...");
    const audioResponse = await axios.get(recordingUrl, {
      responseType: "arraybuffer",
      auth: {
        username: process.env.TWILIO_ACCOUNT_SID || "placeholder",
        password: process.env.TWILIO_AUTH_TOKEN || "placeholder",
      },
    });
    const audioBuffer = Buffer.from(audioResponse.data);
    console.log("✅ Audio downloaded, size:", audioBuffer.length);

    // STEP 2: Transcribe with Groq Whisper
    console.log("🧠 Transcribing with Groq Whisper...");
    const formData = new FormData();
    formData.append("file", audioBuffer, {
      filename: "audio.mp3",
      contentType: "audio/mp3",
    });
    formData.append("model", "whisper-large-v3");
    formData.append("response_format", "json");

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

    // STEP 3: Extract structured data with Gemini
    console.log("🤖 Extracting complaint data with Gemini...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are an AI assistant for CivicSense, a civic complaint management system in India.

A citizen called and said: "${transcript}"

Extract the following information and respond ONLY with a valid JSON object, no explanation, no markdown:

{
  "issueType": "short label in English only - like Pothole, Water Supply, Garbage, Street Light, Sewage, Noise, Other",
  "location": "exact location mentioned or Unknown",
  "urgency": "low or medium or high",
  "emotion": "neutral or angry or distressed or calm or frustrated",
  "summary": "one sentence summary of the complaint in English only",
  "department": "Municipal Corporation or Water Department or Electricity Board or Public Works Department or Police or Other",
  "detectedLanguage": "English or Hindi or Punjabi or Tamil or Telugu or Other",
  "isEnglish": true or false,
  "translatedIssue": "MUST be in English Roman script only - if Hindi say सड़क पर गड्ढा write Pothole, if Punjabi translate to English",
  "translatedLocation": "MUST be in English Roman script only - if Hindi say सेक्टर 12 चंडीगढ़ write Sector 12 Chandigarh, never use Devanagari script"
}

Rules:
- urgency is high if: safety risk, flooding, no water for 24h+, major road damage, medical emergency
- urgency is medium if: recurring issue, multiple people affected
- urgency is low if: minor inconvenience, aesthetic issue
- emotion is angry/distressed if citizen sounds frustrated or urgent
- translatedIssue and translatedLocation MUST ALWAYS be written in English Roman script, NEVER in Devanagari, Gurmukhi, or any other non-Latin script
- Even if the citizen spoke in Hindi or Punjabi, translatedIssue and translatedLocation must be their English equivalents
- Always respond with valid JSON only
`;

    const geminiResult = await model.generateContent(prompt);
    const geminiText = geminiResult.response.text();

    // Clean and parse JSON
    const cleanJson = geminiText.replace(/```json|```/g, "").trim();
    const extracted = JSON.parse(cleanJson);
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

    // STEP 5: Callback Twilio service with complaintId
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
