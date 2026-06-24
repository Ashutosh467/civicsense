import Complaint from "../models/complaint.model.js";
import Officer from "../models/officer.model.js";
import { getIO } from "../sockets/socket.js";
import { processComplaint } from "../services/aiService.js";
import axios from "axios";
import { assignComplaintToOfficer } from "../services/assignService.js";
import { checkAndTrackSpam } from "../services/spamCheck.js"; // ADDED: wire up caller trust tracking

/*
=============================
CREATE COMPLAINT
=============================
*/
export const createComplaint = async (req, res) => {
  try {
    const {
      callerNo = "Unknown",
      issueType = "General",
      location = "Unknown",
      emotion = "neutral",
    } = req.body;
    let urgency = req.body.urgency || "low";

    // 1. DUPLICATE CHECK
    const recentSimilar = await Complaint.find({
      location,
      issueType,
      time: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    const isDuplicate = recentSimilar.length >= 2;
    const clusterSize = recentSimilar.length + 1;

    // 2. USE INCOMING FIELDS FIRST (from main AI service)
    // Only call local AI if fields are missing
    const hasAIData =
      req.body.department && req.body.summary && req.body.translatedIssue;

    let aiResult = {
      department: req.body.department,
      summary: req.body.summary,
      detectedLanguage: req.body.detectedLanguage || "English",
      isEnglish: req.body.isEnglish !== undefined ? req.body.isEnglish : true,
      translatedIssue: req.body.translatedIssue || issueType,
      translatedLocation: req.body.translatedLocation || location,
      urgencyOverride: null,
    };

    // Only call local AI if main AI service didn't provide data
    if (!hasAIData) {
      console.log("⚠️ No AI data in request — calling local AI");
      const localAI = await processComplaint(issueType, location, callerNo);
      aiResult = { ...localAI };
    }

    // 3. FINAL URGENCY
    if (isDuplicate) urgency = "high";
    if (aiResult.urgencyOverride === "HIGH") urgency = "high";

    // ADDED: actually run caller trust/spam tracking (was previously defined but never called)
    let spamResult = { isSpam: false, blacklisted: false };
    if (callerNo && callerNo !== "Unknown") {
      try {
        spamResult = await checkAndTrackSpam(callerNo);
      } catch (err) {
        console.error("checkAndTrackSpam error:", err.message);
      }
    }
    if (spamResult.isSpam) urgency = "low"; // ADDED: de-prioritize likely-spam callers

    // 4. SAVE with all fields
    const urgencyScore = req.body.urgencyScore || 5;
    const deadlineHours = req.body.deadlineHours || 72;
    const deadline = req.body.deadline
      ? new Date(req.body.deadline)
      : new Date(Date.now() + deadlineHours * 60 * 60 * 1000);

    const newComplaint = await Complaint.create({
      callerNo,
      issueType,
      issue: aiResult.translatedIssue || issueType,
      location,
      urgency,
      emotion,
      status: "pending",
      summary: aiResult.summary,
      department: aiResult.department || "Municipal Services",
      detectedLanguage: aiResult.detectedLanguage,
      isEnglish: aiResult.isEnglish,
      translatedIssue: aiResult.translatedIssue,
      translatedLocation: aiResult.translatedLocation,
      isDuplicate,
      clusterSize,
      urgencyScore,
      deadlineHours,
      deadline,
      deadlineStatus: "active",
      audioEmotionScore: req.body.audioEmotionScore || 0,
      audioOverride: req.body.audioOverride || false,
      // ADDED: use the real tracked trust score instead of a hardcoded default
      trustScoreAtTime:
        spamResult.trustScore ?? req.body.trustScoreAtTime ?? 50,
      isSpamFlagged: spamResult.isSpam || false, // ADDED
      callerBlacklisted: spamResult.blacklisted || false, // ADDED
    });

    try {
      getIO().emit("newComplaint", newComplaint.toJSON());
    } catch (e) {
      console.error("Socket error on emit:", e.message);
    }

    // After newComplaint is created, call Twilio service
    if (newComplaint.callerNo && newComplaint.callerNo !== "Unknown") {
      axios
        .post(
          `${process.env.TWILIO_SERVICE_URL}/sms/complaint-received`,
          { toNumber: newComplaint.callerNo, complaintId: newComplaint._id },
          { headers: { "x-internal-key": process.env.INTERNAL_SECRET } },
        )
        .catch((err) => console.error("SMS service error:", err.message));
    }

    // Auto assign complaint to best officer
    setTimeout(async () => {
      const assignResult = await assignComplaintToOfficer(newComplaint._id);
      if (!assignResult.success) {
        console.log(
          "⚠️ Auto assign pending — no officer available yet for:",
          newComplaint._id,
        );
      }
    }, 1000);

    res.status(201).json({
      message: "Complaint created successfully",
      id: newComplaint.id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/*
=============================
GET ALL COMPLAINTS
=============================
*/
export const getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ isArchived: { $ne: true } }).sort(
      { time: -1 },
    );
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/*
=============================
GET SINGLE COMPLAINT ⭐
=============================
*/
export const getSingleComplaint = async (req, res) => {
  try {
    const doc = await Complaint.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/*
=============================
UPDATE STATUS
=============================
*/
export const updateComplaintStatus = async (req, res) => {
  try {
    const allowedStatus = ["pending", "in_progress", "resolved"];

    if (!allowedStatus.includes(req.body.status)) {
      return res.status(400).json({
        message: "Invalid status value",
      });
    }

    await Complaint.findByIdAndUpdate(req.params.id, {
      status: req.body.status,
    });

    res.json({ message: "Status updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/*
=============================
GET COMPLAINT BY PHONE
=============================
*/
export const getComplaintByPhone = async (req, res) => {
  try {
    const phone = decodeURIComponent(req.params.phone);
    const complaint = await Complaint.findOne({
      callerNo: phone,
      status: "resolved",
      citizenConfirmed: null,
    }).sort({ resolvedAt: -1 });

    if (!complaint) {
      return res.status(404).json({ message: "No pending confirmation found" });
    }

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/*
=============================
SOFT DELETE COMPLAINT
=============================
*/
export const softDeleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint)
      return res.status(404).json({ message: "Complaint not found" });
    complaint.isArchived = true;
    await complaint.save();
    res.json({ message: "Complaint archived successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/*
=============================
CONFIRM COMPLAINT
=============================
*/
export const confirmComplaint = async (req, res) => {
  try {
    const { citizenConfirmed } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (citizenConfirmed === true) {
      complaint.citizenConfirmed = true;
      // status stays "resolved"
      await complaint.save();
    } else if (citizenConfirmed === false) {
      complaint.citizenConfirmed = false;
      // If officer submitted photo proof, mark as disputed instead of reopening
      if (complaint.resolutionPhoto && complaint.resolutionPhoto.length > 0) {
        complaint.status = "disputed";
        complaint.disputeReason =
          "Citizen rejected resolution but photo proof exists";
      } else {
        // No photo proof — reopen legitimately
        complaint.status = "in_progress";
      }
      await complaint.save();

      try {
        getIO().emit("complaintReopened", complaint.toJSON());
      } catch (e) {
        console.error("Socket error on emit:", e.message);
      }
    }

    res.json({ message: "Confirmed", status: complaint.status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/*
=============================
GET RESOLVED COMPLAINTS REPORT
(split into on-time vs escalated, with officer names attached)
=============================
*/
export const getResolvedComplaintsReport = async (req, res) => {
  try {
    const { from, to } = req.query;

    const filter = {
      status: "resolved",
      isArchived: { $ne: true },
    };

    if (from || to) {
      filter.resolvedAt = {};
      if (from) filter.resolvedAt.$gte = new Date(from);
      if (to) {
        // include the entire "to" day, not just midnight
        const toEnd = new Date(to);
        toEnd.setHours(23, 59, 59, 999);
        filter.resolvedAt.$lte = toEnd;
      }
    }

    const complaints = await Complaint.find(filter).sort({ resolvedAt: -1 });

    // Collect every officerId we need a name for (both current + escalatedFrom)
    const officerIds = new Set();
    complaints.forEach((c) => {
      if (c.assignedTo) officerIds.add(c.assignedTo);
      if (c.escalatedFromOfficer) officerIds.add(c.escalatedFromOfficer);
    });

    const officers = await Officer.find({
      officerId: { $in: Array.from(officerIds) },
    });
    const officerNameMap = {};
    officers.forEach((o) => {
      officerNameMap[o.officerId] = o.name;
    });

    const shapeComplaint = (c) => ({
      id: c.id,
      callerNo: c.callerNo,
      issue: c.translatedIssue || c.issueType,
      department: c.department,
      location: c.translatedLocation || c.location,
      resolvedAt: c.resolvedAt,
      resolvedByOfficerId: c.assignedTo,
      resolvedByOfficerName: officerNameMap[c.assignedTo] || "Unknown",
    });

    const resolvedOnTime = [];
    const resolvedAfterEscalation = [];

    complaints.forEach((c) => {
      if (c.escalatedFromOfficer) {
        resolvedAfterEscalation.push({
          ...shapeComplaint(c),
          escalatedFromOfficerId: c.escalatedFromOfficer,
          escalatedFromOfficerName:
            officerNameMap[c.escalatedFromOfficer] || "Unknown",
        });
      } else {
        resolvedOnTime.push(shapeComplaint(c));
      }
    });

    res.json({ resolvedOnTime, resolvedAfterEscalation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
