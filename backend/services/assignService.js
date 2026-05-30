import Complaint from "../models/complaint.model.js";
import Officer from "../models/officer.model.js";
import { getIO } from "../sockets/socket.js";
import axios from "axios";

// ================================
// HAVERSINE DISTANCE FORMULA
// Returns distance in KM between two GPS points
// ================================
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ================================
// GEOCODE LOCATION TEXT TO LAT/LNG
// Uses OpenStreetMap Nominatim (free, no key needed)
// ================================
async function geocodeLocation(locationText) {
  try {
    const query = encodeURIComponent(locationText + ", India");
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "CivicCall/1.0 (civic complaint management system)",
        },
        timeout: 5000,
      },
    );

    if (response.data && response.data.length > 0) {
      const { lat, lon } = response.data[0];
      console.log(`📍 Geocoded "${locationText}" → ${lat}, ${lon}`);
      return { lat: parseFloat(lat), lng: parseFloat(lon) };
    }

    console.log(`⚠️ Could not geocode: ${locationText}`);
    return null;
  } catch (err) {
    console.error("Geocoding failed:", err.message);
    return null;
  }
}

// ================================
// MAIN AUTO ASSIGN FUNCTION
// ================================
export const assignComplaintToOfficer = async (complaintId) => {
  try {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      console.error("Auto assign - complaint not found:", complaintId);
      return { success: false, reason: "Complaint not found" };
    }

    // Skip if already assigned
    if (["assigned", "in_progress", "resolved"].includes(complaint.status)) {
      return { success: false, reason: "Already assigned" };
    }

    // Find available officers of matching department
    const availableOfficers = await Officer.find({
      isAvailable: true,
      isArchived: { $ne: true },
      approvalStatus: "approved",
      department: complaint.department,
    });

    // If no matching department officer, get any available officer
    const fallbackOfficers =
      availableOfficers.length === 0
        ? await Officer.find({
            isAvailable: true,
            isArchived: { $ne: true },
            approvalStatus: "approved",
          })
        : [];

    const officers =
      availableOfficers.length > 0 ? availableOfficers : fallbackOfficers;

    if (officers.length === 0) {
      console.log("⚠️ No available officers for complaint:", complaintId);
      return { success: false, reason: "No available officers" };
    }

    // Geocode complaint location
    const complaintLocation =
      complaint.translatedLocation || complaint.location;
    const complaintCoords = await geocodeLocation(complaintLocation);

    // Score each officer
    let bestOfficer = null;
    let bestScore = -Infinity;

    for (const officer of officers) {
      let score = 0;

      // Department match bonus
      if (officer.department === complaint.department) score += 100;

      // Distance scoring - only if both have GPS
      if (
        complaintCoords &&
        officer.currentLocation?.lat &&
        officer.currentLocation?.lng
      ) {
        const distance = haversineDistance(
          complaintCoords.lat,
          complaintCoords.lng,
          officer.currentLocation.lat,
          officer.currentLocation.lng,
        );

        // Closer = higher score
        // Max 80 points for distance (0km = 80pts, 10km = 30pts, 20km+ = 0pts)
        const distanceScore = Math.max(0, 80 - distance * 4);
        score += distanceScore;

        console.log(
          `Officer ${officer.name}: distance=${distance.toFixed(2)}km, distanceScore=${distanceScore.toFixed(0)}`,
        );
      } else {
        // No GPS - give neutral distance score
        score += 40;
        console.log(`Officer ${officer.name}: no GPS data, neutral score`);
      }

      // Trust score bonus - high urgency goes to trusted officers
      if (complaint.urgencyScore >= 7) {
        score += (officer.trustScore || 70) * 0.2;
      }

      // Penalize overloaded officers
      score -= officer.activeComplaintsCount * 15;

      // Penalize officers with no GPS - prefer officers sharing location
      if (!officer.currentLocation?.lat) score -= 20;

      console.log(`Officer ${officer.name}: total score=${score.toFixed(0)}`);

      if (score > bestScore) {
        bestScore = score;
        bestOfficer = officer;
      }
    }

    if (!bestOfficer) bestOfficer = officers[0];

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
      axios
        .post(
          `${process.env.TWILIO_SERVICE_URL}/sms/officer-assigned`,
          {
            officerPhone: bestOfficer.phone,
            officerName: bestOfficer.name,
            issueType: complaint.translatedIssue || complaint.issueType,
            location: complaint.translatedLocation || complaint.location,
            officerId: bestOfficer.officerId,
          },
          { headers: { "x-internal-key": process.env.INTERNAL_SECRET } },
        )
        .catch((err) => console.error("Officer SMS error:", err.message));
    }

    console.log(
      `✅ Auto assigned complaint ${complaintId} to officer ${bestOfficer.name} (score: ${bestScore.toFixed(0)})`,
    );
    return {
      success: true,
      officerId: bestOfficer.officerId,
      officerName: bestOfficer.name,
    };
  } catch (error) {
    console.error("Auto assign error:", error.message);
    return { success: false, reason: error.message };
  }
};
