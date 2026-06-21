require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");
const axios = require("axios");

const {
  sendComplaintReceivedSMS,
  sendComplaintResolvedSMS,
  sendOfficerAssignedSMS,
  sendOfficerInviteSMS,
  checkBalance,
} = require("./smsService");

const { handleSMSReply } = require("./webhookHandler");

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
    const url = "https://civicsense-twilio.onrender.com" + req.originalUrl;
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

app.get("/health/sms", async (req, res) => {
  const result = await checkBalance();
  const status = result.balance < 10 ? "low" : "ok";
  res.json({
    status,
    balance: result.balance,
    warning:
      result.balance < 10 ? "Fast2SMS balance is low — SMS may fail" : null,
  });
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
      "Welcome to CivicCall. After the beep, please describe your complaint.",
    );

    twiml.record({
      maxLength: 120,
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
app.post("/recording-complete", validateTwilioRequest, async (req, res) => {
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

    const spamCheck = await axios
      .post(
        `${process.env.MAIN_BACKEND_URL}/api/complaint/internal/spam-check`,
        { phone: req.body.From },
        { headers: { "x-internal-key": process.env.INTERNAL_SECRET } },
      )
      .then((r) => r.data)
      .catch((err) => {
        console.error("Spam check failed, allowing through:", err.message);
        return { isSpam: false, blacklisted: false };
      });

    if (spamCheck.blacklisted) {
      console.log("🚫 Blacklisted caller blocked:", req.body.From);
      twiml.say(
        "Your number has been restricted due to repeated false reports. Please contact support.",
      );
      res.type("text/xml");
      return res.send(twiml.toString());
    }

    if (spamCheck.isSpam) {
      console.log("🚫 Spam blocked (rate limit):", req.body.From);
      twiml.say(
        "You have reached the limit of complaints for this hour. Please try again later.",
      );
      res.type("text/xml");
      return res.send(twiml.toString());
    }

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
 * SMS INTERNAL ROUTES
 */
app.post("/sms/complaint-received", async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const { toNumber, complaintId } = req.body;
  if (!toNumber || !complaintId) {
    return res.status(400).json({ error: "Missing toNumber or complaintId" });
  }
  const result = await sendComplaintReceivedSMS(toNumber, complaintId);
  res.status(result.success ? 200 : 500).json(result);
});

app.post("/sms/complaint-resolved", async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const { toNumber, complaintId } = req.body;
  if (!toNumber || !complaintId) {
    return res.status(400).json({ error: "Missing toNumber or complaintId" });
  }
  const result = await sendComplaintResolvedSMS(toNumber, complaintId);
  res.status(result.success ? 200 : 500).json(result);
});

app.post("/sms/officer-escalated", async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const { officerPhone, officerName, issueType, location } = req.body;
  const message = `CivicCall ESCALATION ALERT: Hi ${officerName}, complaint "${issueType}" at ${location} has been escalated to admin due to no action. Please resolve immediately.`;
  try {
    const result = await sendSMS(officerPhone, message);
    res.status(200).json({ success: true, result });
  } catch (err) {
    console.error("❌ Escalation SMS failed:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/sms/officer-reminder", async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const {
    officerPhone,
    officerName,
    issueType,
    location,
    hoursRemaining,
    reminderType,
  } = req.body;
  let message;
  if (reminderType === "30percent") {
    message = `CivicCall Reminder: Hi ${officerName}, complaint ${issueType} at ${location} needs attention. ${hoursRemaining} hours remaining.`;
  } else if (reminderType === "60percent") {
    message = `CivicCall WARNING: Hi ${officerName}, complaint ${issueType} at ${location} is critical. Only ${hoursRemaining} hours left. Admin notified.`;
  }
  try {
    const result = await sendSMS(officerPhone, message);
    res.status(200).json({ success: true, result });
  } catch (err) {
    console.error("❌ Reminder SMS failed:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/sms/officer-invite", async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const { officerPhone, officerName, inviteLink } = req.body;
  if (!officerPhone || !officerName || !inviteLink) {
    return res
      .status(400)
      .json({ error: "Missing officerPhone, officerName, or inviteLink" });
  }
  const result = await sendOfficerInviteSMS(
    officerPhone,
    officerName,
    inviteLink,
  );
  res.status(result.success ? 200 : 500).json(result);
});

/**
 * SMS WEBHOOK
 */

app.post("/sms/officer-reminder", async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const {
    officerPhone,
    officerName,
    issueType,
    location,
    hoursRemaining,
    reminderType,
  } = req.body;
  let message;
  if (reminderType === "30percent") {
    message =
      "CivicCall Reminder: Hi " +
      officerName +
      ", complaint " +
      issueType +
      " at " +
      location +
      " needs attention. " +
      hoursRemaining +
      " hours remaining.";
  } else if (reminderType === "60percent") {
    message =
      "CivicCall WARNING: Hi " +
      officerName +
      ", complaint " +
      issueType +
      " at " +
      location +
      " is critical. Only " +
      hoursRemaining +
      " hours left. Admin notified.";
  }
  const result = await sendSMS(officerPhone, message);
  res.json(result);
});

app.post("/sms/reply", validateTwilioRequest, handleSMSReply);

/**
 * START SERVER
 */
app.listen(PORT, () => {
  console.log(`Calling Service listening on port ${PORT}`);
});
