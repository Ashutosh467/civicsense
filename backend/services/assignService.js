import Complaint from "../models/complaint.model.js";
import Officer from "../models/officer.model.js";
import { getIO } from "../sockets/socket.js";
import axios from "axios";

export const assignComplaintToOfficer = async (complaintId) => {
  try {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      console.error("Auto assign — complaint not found:", complaintId);
      return { success: false, reason: "Complaint not found" };
    }

    // Skip if already assigned
    if (["assigned", "in_progress", "resolved"].includes(complaint.status)) {
      return { success: false, reason: "Already assigned" };
    }

    // Find available officers
    const availableOfficers = await Officer.find({ 
      isAvailable: true,
      isArchived: { $ne: true }
    });

    if (availableOfficers.length === 0) {
      console.log("⚠️ No available officers for complaint:", complaintId);
      return { success: false, reason: "No available officers" };
    }

    // Score each officer
    let bestOfficer = null;
    let highestScore = -Infinity;

    for (const officer of availableOfficers) {
      let score = 0;

      // Department match — most important
      if (officer.department === complaint.department) score += 50;

      // Location match
      const cLoc = (complaint.translatedLocation || complaint.location || "").toLowerCase();
      if (officer.area && cLoc.includes(officer.area.toLowerCase())) score += 30;

      // Trust score bonus — high urgency goes to trusted officers
      if (complaint.urgencyScore >= 7) {
        score += (officer.trustScore || 70) * 0.3;
      }

      // Penalize overloaded officers
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

    // Socket events
    try {
      const io = getIO();
      io.emit("complaintAssigned", {
        complaintId: complaint._id || complaint.id,
        officerId: bestOfficer.officerId,
        officerName: bestOfficer.name,
      });
      io.to(bestOfficer.officerId).emit("newAssignment", {
        complaintId: complaint._id || complaint.id,
      });
    } catch (e) {
      console.error("Socket error on assign:", e.message);
    }

    // SMS to officer
    if (bestOfficer.phone) {
      axios.post(
        `${process.env.TWILIO_SERVICE_URL}/sms/officer-assigned`,
        {
          officerPhone: bestOfficer.phone,
          officerName: bestOfficer.name,
          issueType: complaint.translatedIssue || complaint.issueType,
          location: complaint.translatedLocation || complaint.location,
          officerId: bestOfficer.officerId,
        },
        { headers: { "x-internal-key": process.env.INTERNAL_SECRET } }
      ).catch(err => console.error("Officer SMS error:", err.message));
    }

    console.log(`✅ Auto assigned complaint ${complaintId} to officer ${bestOfficer.name}`);
    return { 
      success: true, 
      officerId: bestOfficer.officerId, 
      officerName: bestOfficer.name 
    };

  } catch (error) {
    console.error("Auto assign error:", error.message);
    return { success: false, reason: error.message };
  }
};

y

