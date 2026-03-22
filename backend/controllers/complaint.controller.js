import Complaint from "../models/complaint.model.js";
import { getIO } from "../sockets/socket.js";

/*
=============================
CREATE COMPLAINT
=============================
*/
export const createComplaint = async (req, res) => {
  try {
    const newComplaint = await Complaint.create({
      callerNo: req.body.callerNo || "Unknown",
      issueType: req.body.issueType || "General",
      location: req.body.location || "Unknown",
      urgency: req.body.urgency || "low",
      emotion: req.body.emotion || "neutral",
      summary: req.body.summary || "",
      status: "pending",
    });

    try {
      getIO().emit("newComplaint", newComplaint.toJSON());
    } catch (e) {
      console.error("Socket error on emit:", e.message);
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
