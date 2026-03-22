require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");
const axios = require("axios");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const PORT = process.env.PORT || 4000;

const activeRecordings = new Map();
const processedCalls = new Set();

/**
 * ✅ TWILIO SIGNATURE VALIDATION MIDDLEWARE
 */
function validateTwilioRequest(req, res, next) {
  try {
    const signature = req.headers["x-twilio-signature"];

    const url = process.env.PUBLIC_URL + req.originalUrl;

    const isValid = twilio.validateRequest(
      process.env.TWILIO_AUTH_TOKEN,
      signature,
      url,
      req.body,
    );

    if (!isValid) {
      console.log("❌ Invalid Twilio Request Blocked");
      return res.status(403).send("Forbidden");
    }

    next();
  } catch (err) {
    console.error("Signature validation error:", err);
    res.status(403).send("Forbidden");
  }
}

/**
 * HEALTH CHECK
 */
app.get("/health", (req, res) => {
  res.send("Calling Service Running ✅");
});

/**
 * INCOMING CALL (SECURED)
 */
app.post("/voice", validateTwilioRequest, (req, res) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  try {
    console.log("📞 Incoming Call:", req.body.From);

    twiml.say(
      { voice: "alice" },
      "Welcome to Civic Sense. After the beep, please describe your complaint.",
    );

    twiml.record({
      maxLength: 60,
      timeout: 5,
      playBeep: true,
      action: "/recording-complete",
      method: "POST",
    });
  } catch (err) {
    console.error(err);
    twiml.say("Technical issue occurred. Please try again later.");
  }

  res.type("text/xml");
  res.send(twiml.toString());
});

/**
 * RECORDING COMPLETE (SECURED)
 */
app.post("/recording-complete", validateTwilioRequest, (req, res) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  try {
    const callSid = req.body.CallSid;

    if (processedCalls.has(callSid)) {
      return res.sendStatus(200);
    }

    processedCalls.add(callSid);

    const recordingData = {
      callerNumber: req.body.From,
      callSid,
      recordingSid: req.body.RecordingSid,
      recordingUrl: req.body.RecordingUrl + ".mp3",
      timestamp: new Date().toISOString(),
      status: "pending",
    };

    activeRecordings.set(callSid, recordingData);

    axios
      .post(process.env.AI_MODULE_URL, recordingData)
      .then(() => console.log("🤖 Sent to AI"))
      .catch((err) => console.error("AI unavailable:", err.message));

    twiml.say(
      "Thank you. Your complaint has been recorded and will be processed shortly.",
    );
  } catch (err) {
    console.error(err);
    twiml.say("We could not capture your complaint. Please call again.");
  }

  res.type("text/xml");
  res.send(twiml.toString());
});

/**
 * AI CALLBACK
 */
app.post("/ai-response", (req, res) => {
  try {
    const { callSid, status, complaintId } = req.body;

    if (!activeRecordings.has(callSid)) {
      return res.status(404).send("Unknown callSid");
    }

    const record = activeRecordings.get(callSid);

    record.status = status;
    record.complaintId = complaintId;
    record.processedAt = new Date().toISOString();

    activeRecordings.set(callSid, record);

    console.log("✅ AI Updated:", record);

    res.send({ message: "AI response stored" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

/**
 * START SERVER
 */
app.listen(PORT, () => {
  console.log(`Calling Service listening on port ${PORT}`);
});
