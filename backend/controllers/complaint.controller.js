import Complaint from "../models/complaint.model.js";
import { getIO } from "../sockets/socket.js";
import { processComplaint } from "../services/aiService.js";
import axios from "axios";

/*
=============================
CREATE COMPLAINT
=============================
*/
export const createComplaint = async (req, res) => {
  try {
    const { callerNo = "Unknown", issueType = "General", location = "Unknown", emotion = "neutral" } = req.body;
    let urgency = req.body.urgency || "low";
    
    // 1. DUPLICATE CHECK
    const recentSimilar = await Complaint.find({
      location,
      issueType,
      time: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    const isDuplicate = recentSimilar.length >= 2;
    const clusterSize = recentSimilar.length + 1;

    // 2. CALL AI
    const aiResult = await processComplaint(issueType, location, callerNo);

    // 3. FINAL URGENCY
    if (isDuplicate) urgency = "high";
    if (aiResult.urgencyOverride === "HIGH") urgency = "high";

    // 4. SAVE with all fields
    const newComplaint = await Complaint.create({
      callerNo,
      issueType, // Original
      issue: aiResult.translatedIssue || issueType, // Translated (if not English)
      location, // Original
      urgency, // Final
      emotion,
      status: "pending",
      summary: aiResult.summary,
      department: aiResult.department,
      detectedLanguage: aiResult.detectedLanguage,
      isEnglish: aiResult.isEnglish,
      translatedIssue: aiResult.translatedIssue,
      translatedLocation: aiResult.translatedLocation,
      isDuplicate,
      clusterSize
    });

    try {
      getIO().emit("newComplaint", newComplaint.toJSON());
    } catch (e) {
      console.error("Socket error on emit:", e.message);
    }

    // After newComplaint is created, call Twilio service
    if (newComplaint.callerNo && newComplaint.callerNo !== "Unknown") {
      axios.post(
        `${process.env.TWILIO_SERVICE_URL}/sms/complaint-received`,
        { toNumber: newComplaint.callerNo, complaintId: newComplaint._id },
        { headers: { "x-internal-key": process.env.INTERNAL_SECRET } }
      ).catch(err => console.error("SMS service error:", err.message));
    }

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
    const complaints = await Complaint.find({}).sort({ time: -1 });
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

    await Complaint.findByIdAndUpdate(req.params.id, { status: req.body.status });

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
      citizenConfirmed: null
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
      complaint.status = "in_progress";
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
