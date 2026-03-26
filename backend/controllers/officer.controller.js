import Officer from "../models/officer.model.js";
import Complaint from "../models/complaint.model.js";
import { getIO } from "../sockets/socket.js";
import axios from "axios";

// 1. POST creates a new officer
export const createOfficer = async (req, res) => {
  try {
    const { name, area, department, phone } = req.body;
    const officerId = "officer_" + Date.now();

    const newOfficer = await Officer.create({
      officerId,
      name,
      area,
      department,
      phone
    });

    res.status(201).json(newOfficer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. GET returns all officers sorted by activeComplaintsCount ascending
export const getAllOfficers = async (req, res) => {
  try {
    const officers = await Officer.find({ isArchived: { $ne: true } }).sort({ activeComplaintsCount: 1 });
    res.json(officers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. PATCH updateOfficerLocation
export const updateOfficerLocation = async (req, res) => {
  try {
    const { officerId } = req.params;
    const { lat, lng } = req.body;

    const officer = await Officer.findOneAndUpdate(
      { officerId },
      { 
        currentLocation: { lat, lng },
        lastSeen: Date.now()
      },
      { new: true }
    );

    if (!officer) return res.status(404).json({ message: "Officer not found" });

    res.json(officer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. POST autoAssignComplaint
export const autoAssignComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const complaint = await Complaint.findById(complaintId);

    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    if (complaint.status === "assigned" || complaint.status === "in_progress" || complaint.status === "resolved") {
      return res.status(400).json({ message: "Complaint already assigned or resolved" });
    }

    const availableOfficers = await Officer.find({ isAvailable: true });

    if (availableOfficers.length === 0) {
      return res.status(400).json({ message: "No available officers" });
    }

    let bestOfficer = null;
    let highestScore = -Infinity;

    for (const officer of availableOfficers) {
      let score = 0;

      if (officer.department === complaint.department) {
        score += 50;
      }

      const cLoc = (complaint.translatedLocation || complaint.location || "").toLowerCase();
      if (officer.area && cLoc.includes(officer.area.toLowerCase())) {
        score += 30;
      }

      score -= (officer.activeComplaintsCount * 10);

      if (score > highestScore) {
        highestScore = score;
        bestOfficer = officer;
      }
    }

    if (!bestOfficer) bestOfficer = availableOfficers[0];

    // Update complaint
    complaint.assignedTo = bestOfficer.officerId;
    complaint.assignedAt = new Date();
    complaint.status = "assigned";
    await complaint.save();

    // Update officer
    bestOfficer.activeComplaintsCount += 1;
    await bestOfficer.save();

    const io = getIO();
    io.emit("complaintAssigned", {
      complaintId: complaint._id || complaint.id,
      officerId: bestOfficer.officerId,
      officerName: bestOfficer.name
    });

    io.to(bestOfficer.officerId).emit("newAssignment", {
      complaintId: complaint._id || complaint.id
    });

    if (bestOfficer.phone) {
      axios.post(
        `${process.env.TWILIO_SERVICE_URL}/sms/officer-assigned`,
        {
          officerPhone: bestOfficer.phone,
          officerName: bestOfficer.name,
          issueType: complaint.translatedIssue || complaint.issueType,
          location: complaint.translatedLocation || complaint.location,
          officerId: bestOfficer.officerId
        },
        { headers: { "x-internal-key": process.env.INTERNAL_SECRET } }
      ).catch(err => console.error("Officer SMS error:", err.message));
    }

    res.json({
      message: "Assigned",
      officerId: bestOfficer.officerId,
      officerName: bestOfficer.name
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5. PATCH resolveComplaint
export const resolveComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { officerId, resolutionNote, resolutionPhoto } = req.body;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    complaint.status = "resolved";
    complaint.resolvedAt = new Date();
    complaint.resolutionNote = resolutionNote || "";
    if (resolutionPhoto) complaint.resolutionPhoto = resolutionPhoto;

    await complaint.save();

    const officer = await Officer.findOne({ officerId });
    if (officer) {
      officer.activeComplaintsCount = Math.max(0, officer.activeComplaintsCount - 1);
      await officer.save();
    }

    const io = getIO();
    io.emit("complaintResolved", complaint.toJSON());

    if (complaint.callerNo && complaint.callerNo !== "Unknown") {
      axios.post(
        `${process.env.TWILIO_SERVICE_URL}/sms/complaint-resolved`,
        { toNumber: complaint.callerNo, complaintId: complaint._id },
        { headers: { "x-internal-key": process.env.INTERNAL_SECRET } }
      ).catch(err => console.error("Resolved SMS error:", err.message));
    }

    res.json({ message: "Resolved successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 6. GET getOfficerComplaints
export const getOfficerComplaints = async (req, res) => {
  try {
    const { officerId } = req.params;
    const complaints = await Complaint.find({ assignedTo: officerId }).sort({ time: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
