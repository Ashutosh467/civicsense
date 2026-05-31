require("dotenv").config();
const express = require("express");
const axios = require("axios");
const Groq = require("groq-sdk");
const FormData = require("form-data");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ================================
// HEALTH CHECK
// ================================
app.get("/health", (req, res) => {
  res.json({ status: "AI Service Running ✅" });
});

// ================================
// HELPER — Get or Create Caller Trust
// ================================
async function getCallerTrust(callerNumber) {
  try {
    const res = await axios.get(
      `${process.env.BACKEND_URL}/api/caller-trust/${encodeURIComponent(callerNumber)}`,
    );
    return res.data;
  } catch {
    return { trustScore: 50, trustLevel: "medium", blacklisted: false };
  }
}

// ================================
// PRE LAYER — Audio Emotion Analysis
// ================================
async function analyzeAudioEmotion(transcript) {
  try {
    const prompt = `
You are analyzing a civic complaint call transcript for emotional distress signals.

TRANSCRIPT: "${transcript}"

Analyze and return ONLY a JSON object:
{
  "panicLevel": <0-10, how panicked does the caller sound>,
  "cryingDetected": <true/false>,
  "fearDetected": <true/false>,
  "urgentWords": <true/false, words like help, fire, dying, bachao, aag, emergency>,
  "lifeThreateningKeywords": <true/false, mentions of fire/flood/attack/collapse/gas leak>,
  "emotionScore": <0-10 overall distress score>,
  "reasoning": "<one line why you gave this score>"
}

Rules:
- Panicked speech, broken sentences = high panic level
- Words like bachao, help, aag, fire, mar jayenge, flood = life threatening keywords
- Crying, trembling described in text = crying detected
- Score 8+ means override everything and treat as emergency
`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 300,
    });

    const raw = response.choices[0].message.content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    return JSON.parse(raw);
  } catch (err) {
    console.error("Audio emotion analysis failed:", err.message);
    return { emotionScore: 5, panicLevel: 5, lifeThreateningKeywords: false };
  }
}

// ================================
// LAYER 1 — 4 Dimension AI Scoring
// ================================
async function scoreComplaint(transcript, extracted) {
  try {
    const prompt = `
You are an AI urgency scorer for a civic complaint system in India.

COMPLAINT DETAILS:
- Issue: ${extracted.issueType}
- Location: ${extracted.location}
- Summary: ${extracted.summary}
- Transcript: "${transcript}"

Score this complaint on 4 dimensions from 0-10:

1. LIFE RISK (0-10): Is there immediate danger to human life?
   10 = people dying/trapped, 7 = possible injuries, 4 = indirect risk, 1 = no risk

2. SPREAD RATE (0-10): How fast is situation getting worse?
   10 = spreading every minute (fire/flood), 5 = hours, 2 = days, 1 = stable

3. IMPACT SCALE (0-10): How many people affected?
   10 = entire area/city, 7 = colony/sector, 4 = street, 1 = single house

4. INFRASTRUCTURE RISK (0-10): Critical infrastructure at risk?
   10 = hospital/school/main road, 5 = local road/park, 1 = minor

Also give:
- confidence: 0-100 (how sure are you about this scoring)
- reasoning: one line explanation

Final score formula: (lifeRisk*0.4) + (spreadRate*0.3) + (impactScale*0.2) + (infraRisk*0.1)

Return ONLY JSON:
{
  "lifeRisk": <0-10>,
  "spreadRate": <0-10>,
  "impactScale": <0-10>,
  "infraRisk": <0-10>,
  "finalScore": <0-10>,
  "confidence": <0-100>,
  "reasoning": "<one line>"
}
`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 300,
    });

    const raw = response.choices[0].message.content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    return JSON.parse(raw);
  } catch (err) {
    console.error("Scoring failed:", err.message);
    return { finalScore: 5, confidence: 50, reasoning: "Default score" };
  }
}

// ================================
// LAYER 2 — Confidence + Safety Check
// ================================
function applyConfidenceCheck(score, confidence, audioEmotion, trustLevel) {
  let finalScore = score;
  let deadlineHours;
  let audioOverride = false;

  // GOLDEN RULE — if panic detected, override everything
  if (
    audioEmotion.emotionScore >= 8 ||
    audioEmotion.panicLevel >= 8 ||
    audioEmotion.lifeThreateningKeywords === true
  ) {
    finalScore = Math.max(finalScore, 8.5);
    audioOverride = true;
    console.log("🚨 Audio override triggered — emergency detected");
  }

  // Apply trust level multiplier
  if (trustLevel === "low") {
    finalScore = finalScore * 0.7; // reduce score for low trust callers
    console.log("⚠️ Low trust caller — score reduced");
  }

  // Apply confidence check
  if (confidence < 70 && !audioOverride) {
    finalScore = finalScore * 0.8; // reduce if AI unsure
    console.log("⚠️ Low confidence — score reduced, admin will be notified");
  }

  // Calculate deadline based on final score
  if (finalScore >= 9) deadlineHours = 1;
  else if (finalScore >= 8) deadlineHours = 3;
  else if (finalScore >= 7) deadlineHours = 6;
  else if (finalScore >= 6) deadlineHours = 12;
  else if (finalScore >= 5) deadlineHours = 24;
  else if (finalScore >= 4) deadlineHours = 48;
  else if (finalScore >= 3) deadlineHours = 72;
  else deadlineHours = 96;

  // If low confidence and no audio override — halve deadline to be safe
  if (confidence < 70 && !audioOverride) {
    deadlineHours = Math.max(1, Math.floor(deadlineHours * 0.5));
  }

  return { finalScore, deadlineHours, audioOverride };
}

// ================================
// MAIN ENDPOINT
// ================================
app.post("/process", async (req, res) => {
  const { callerNumber, callSid, recordingUrl } = req.body;

  if (!recordingUrl || !callSid) {
    return res.status(400).json({ error: "Missing recordingUrl or callSid" });
  }

  console.log("🎙️ Received recording for:", callerNumber);
  res.json({ message: "Processing started" });

  try {
    // STEP 1 — Wait for Twilio
    console.log("⏳ Waiting 6 seconds for Twilio...");
    await new Promise((resolve) => setTimeout(resolve, 6000));

    // STEP 2 — Check caller trust
    console.log("🔍 Checking caller trust...");
    const callerTrust = await getCallerTrust(callerNumber);

    if (callerTrust.blacklisted) {
      console.log("🚫 Blacklisted caller — rejecting:", callerNumber);
      return;
    }

    if (callerTrust.isSpamming) {
      console.log("🚫 Spam detected — too many calls:", callerNumber);
      return;
    }

    // STEP 3 — Download audio
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
          `✅ Audio downloaded attempt ${attempt}, size:`,
          audioBuffer.length,
        );
        break;
      } catch (dlErr) {
        console.log(`⚠️ Download attempt ${attempt} failed:`, dlErr.message);
        if (attempt < 3) await new Promise((r) => setTimeout(r, 3000));
        else throw dlErr;
      }
    }

    // STEP 4 — Transcribe
    console.log("🧠 Transcribing...");
    const formData = new FormData();
    formData.append("file", audioBuffer, {
      filename: "audio.mp3",
      contentType: "audio/mp3",
    });
    formData.append("model", "whisper-large-v3");
    formData.append("response_format", "json");
    formData.append("language", "");

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

    // STEP 5 — PRE LAYER: Audio emotion analysis
    console.log("🎭 Analyzing audio emotion...");
    const audioEmotion = await analyzeAudioEmotion(transcript);
    console.log("✅ Audio emotion:", audioEmotion);

    // STEP 6 — Extract complaint data
    console.log("🤖 Extracting complaint data...");
    const extractionPrompt = `
You are an AI assistant for CivicCall, a civic complaint management system in India.

A citizen called a government helpline and said:
TRANSCRIPT: "${transcript}"

Extract ALL details. Do NOT use defaults. Do NOT make up data.

Return ONLY valid JSON:
{
  "issueType": "actual civic issue mentioned",
  "location": "exact place mentioned or Unknown",
  "urgency": "high/medium/low based on content",
  "emotion": "angry/distressed/frustrated/neutral",
  "summary": "one clear English sentence with location and issue",
  "department": "Choose ONLY from these 7 departments — Fire Department (for building fire, vehicle fire, gas leak, explosion, rescue, forest fire), Law & Order (for theft, robbery, murder, harassment, riot, missing person, traffic accident, noise complaint), Roads & Infrastructure (for pothole, road damage, bridge repair, footpath broken, road blocked), Water & Sanitation (for no water supply, dirty water, pipeline burst, hand pump, sewage overflow, drain blocked), Electricity (for power cut, transformer blast, street light, low voltage, electric wire fallen), Health (for no doctor, no medicine, ambulance, dirty hospital, dead body, food poisoning), Municipal Services (for garbage, stray animals, encroachment, park maintenance, public toilet, tree fallen)",
  "detectedLanguage": "Hindi/Punjabi/Tamil/Telugu/English",
  "isEnglish": true or false,
  "translatedIssue": "English Roman script only",
  "translatedLocation": "English Roman script only"
}
`;

    const llmResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: extractionPrompt }],
      temperature: 0.1,
      max_tokens: 1000,
    });

    const rawText = llmResponse.choices[0].message.content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const extracted = JSON.parse(rawText);
    console.log("✅ Extracted:", extracted);

    // STEP 7 — LAYER 1: Score complaint
    console.log("📊 Scoring complaint...");
    const scoring = await scoreComplaint(transcript, extracted);
    console.log("✅ Scoring:", scoring);

    // STEP 8 — LAYER 2: Confidence + audio check
    console.log("🔒 Applying confidence and safety checks...");
    const { finalScore, deadlineHours, audioOverride } = applyConfidenceCheck(
      scoring.finalScore,
      scoring.confidence,
      audioEmotion,
      callerTrust.trustLevel || "medium",
    );

    const deadline = new Date(Date.now() + deadlineHours * 60 * 60 * 1000);
    console.log(
      `✅ Final score: ${finalScore}, Deadline: ${deadlineHours} hours`,
    );

    // STEP 9 — Send to backend
    console.log("📤 Sending to backend...");
    const complaintPayload = {
      callerNo: callerNumber || "Unknown",
      issueType: extracted.issueType || "General",
      location: extracted.location || "Unknown",
      urgency: extracted.urgency || "low",
      emotion: extracted.emotion || "neutral",
      summary: extracted.summary || "",
      department: extracted.department || "Municipal Services",
      detectedLanguage: extracted.detectedLanguage || "English",
      isEnglish: extracted.isEnglish !== false,
      translatedIssue: extracted.translatedIssue || extracted.issueType || "",
      translatedLocation:
        extracted.translatedLocation || extracted.location || "",
      // NEW fields
      urgencyScore: finalScore,
      aiConfidence: scoring.confidence,
      audioEmotionScore: audioEmotion.emotionScore || 0,
      audioOverride,
      deadlineHours,
      deadline,
      trustScoreAtTime: callerTrust.trustScore || 50,
    };

    const backendResponse = await axios.post(
      `${process.env.BACKEND_URL}/api/complaint`,
      complaintPayload,
    );

    const complaintId = backendResponse.data.id;
    console.log("✅ Complaint created:", complaintId);

    // STEP 10 — Notify admin if low confidence or audio override
    if (scoring.confidence < 70 || audioOverride) {
      console.log("🚨 Notifying admin — low confidence or emergency detected");
      await axios
        .post(`${process.env.BACKEND_URL}/api/admin/alert`, {
          complaintId,
          reason: audioOverride
            ? "Emergency detected via audio — immediate attention needed"
            : "Low AI confidence — manual review needed",
          urgencyScore: finalScore,
        })
        .catch((err) => console.error("Admin alert failed:", err.message));
    }

    // STEP 11 — SMS to citizen
    console.log("📱 Sending SMS to citizen...");
    try {
      await axios.post(
        `${process.env.TWILIO_SERVICE_URL}/sms/complaint-received`,
        { toNumber: callerNumber, complaintId },
        { headers: { "x-internal-key": process.env.INTERNAL_SECRET } },
      );
      console.log("✅ Citizen SMS sent");
    } catch (smsErr) {
      console.error("❌ SMS failed:", smsErr.message);
    }

    // STEP 12 — Callback Twilio
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
    try {
      await axios.post(`${process.env.BACKEND_URL}/api/complaint`, {
        callerNo: callerNumber || "Unknown",
        issueType: "General",
        location: "Unknown",
        urgency: "low",
        emotion: "neutral",
        summary: "Complaint received but could not be fully processed",
        department: "Municipal Services",
        deadlineHours: 24,
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      console.log("⚠️ Fallback complaint created");
    } catch (fallbackErr) {
      console.error("❌ Fallback failed:", fallbackErr.message);
    }
  }
});

// ================================
// START SERVER
// ================================
app.listen(PORT, () => {
  console.log(`🤖 AI Service listening on port ${PORT}`);
});
