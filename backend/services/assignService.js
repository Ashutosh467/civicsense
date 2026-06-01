import Complaint from "../models/complaint.model.js";
import Officer from "../models/officer.model.js";
import { getIO } from "../sockets/socket.js";
import axios from "axios";

const URGENCY_THRESHOLDS = {
  "Fire Department": 6,
  "Law & Order": 6,
  "Health": 6,
  "Water & Sanitation": 7,
  "Electricity": 7,
  "Roads & Infrastructure": 8,
  "Municipal Services": 9,
};

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
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

async function geocodeLocation(locationText) {
  try {
    const query = encodeURIComponent(locationText + ", Bihar, India");
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      {
        headers: { "User-Agent": "CivicCall/1.0" },
        timeout: 5000,
      }
    );
    if (response.data && response.data.length > 0) {
      const { lat, lon } = response.data[0];
      return { lat: parseFloat(lat), lng: parseFloat(lon) };
    }
    return null;
  } catch (err) {
    console.error("Geocoding failed:", err.message);
    return null;
  }
}

function isHighUrgency(complaint) {
  const threshold = URGENCY_THRESHOLDS[complaint.department] || 7;
  return (complaint.urgencyScore || 5) >= threshold;
}

// ================================
// IMPROVED TEXT MATCHING
// Checks if officer area matches complaint location
// ================================
function textAreaMatch(officerArea, complaintLocation) {
  if (!officerArea || !complaintLocation) return false;
  
  const area = officerArea.toLowerCase().trim();
  const loc = complaintLocation.toLowerCase().trim();
  
  // Extract all keywords from both
  const areaWords = area.split(/[\s,]+/).filter(w => w.length > 2);
  const locWords = loc.split(/[\s,]+/).filter(w => w.length > 2);
  
  // Check if any word matches
  for (const word of areaWords) {
    if (locWords.includes(word)) return true;
    if (loc.includes(word)) return true;
  }
  for (const word of locWords) {
    if (area.includes(word)) return true;
  }
  
  return false;
}

function getDistance(officer, complaintCoords) {
  if (
    !complaintCoords ||
    !officer.currentLocation?.lat ||
    !officer.currentLocation?.lng
  ) return null;
  return haversineDistance(
    complaintCoords.lat,
    complaintCoords.lng,
    officer.currentLocation.lat,
    officer.currentLocation.lng
  );
}

function findBestOfficer(officers, complaintCoords, complaint) {
  let best = null;
  let bestScore = -Infinity;

  for (const officer of officers) {
    let score = 0;
    const distance = getDistance(officer, complaintCoords);

    if (distance !== null) {
      score += Math.max(0, 100 - distance * 2);
    } else {
      // No GPS - use text match bonus
      const isMatch = textAreaMatch(
        officer.area,
        complaint.translatedLocation || complaint.location
      );
      score += isMatch ? 60 : 20;
    }

    if (isHighUrgency(complaint)) {
      score += (officer.trustScore || 70) * 0.2;
    }

    score -= officer.activeComplaintsCount * 15;
    if (!officer.currentLocation?.lat) score -= 10;

    console.log(
      `Officer ${officer.name} (${officer.department}): score=${score.toFixed(0)}, distance=${distance ? distance.toFixed(1) + "km" : "no GPS"}, area=${officer.area}`
    );

    if (score > bestScore) {
      bestScore = score;
      best = officer;
    }
  }
  return best;
}

async function assignToOfficer(complaint, officer) {
  complaint.assignedTo = officer.officerId;
  complaint.assignedAt = new Date();
  complaint.status = "assigned";
  await complaint.save();

  officer.activeComplaintsCount += 1;
  await officer.save();

  try {
    const io = getIO();
    io.emit("complaintAssigned", {
      complaintId: complaint._id,
      officerId: officer.officerId,
      officerName: officer.name,
    });
    io.to(officer.officerId).emit("newAssignment", {
      complaintId: complaint._id,
    });
  } catch (e) {
    console.error("Socket error:", e.message);
  }

  if (officer.phone) {
    axios.post(
      `${process.env.TWILIO_SERVICE_URL}/sms/officer-assigned`,
      {
        officerPhone: officer.phone,
        officerName: officer.name,
        issueType: complaint.translatedIssue || complaint.issueType,
        location: complaint.translatedLocation || complaint.location,
        officerId: officer.officerId,
      },
      { headers: { "x-internal-key": process.env.INTERNAL_SECRET } }
    ).catch(err => console.error("SMS error:", err.message));
  }

  console.log(`✅ Assigned complaint ${complaint._id} to ${officer.name} (${officer.department}, ${officer.area})`);
  return { success: true, officerId: officer.officerId, officerName: officer.name };
}

export const assignComplaintToOfficer = async (complaintId) => {
  try {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return { success: false, reason: "Complaint not found" };

    if (["assigned", "in_progress", "resolved", "escalated"].includes(complaint.status)) {
      return { success: false, reason: "Already assigned or escalated" };
    }

    const highUrgency = isHighUrgency(complaint);
    const dept = complaint.department;
    const complaintLoc = complaint.translatedLocation || complaint.location;

    console.log(`\n🔍 Assigning: "${dept}" at "${complaintLoc}" | High urgency: ${highUrgency}`);

    // Geocode complaint location
    const complaintCoords = await geocodeLocation(complaintLoc);
    console.log(`📍 Coords: ${complaintCoords ? `${complaintCoords.lat}, ${complaintCoords.lng}` : "not found"}`);

    const allOfficers = await Officer.find({
      isAvailable: true,
      isArchived: { $ne: true },
      approvalStatus: "approved",
    });

    if (allOfficers.length === 0) {
      return { success: false, reason: "No officers available" };
    }

    const deptOfficers = allOfficers.filter(o => o.department === dept);
    const policeOfficers = allOfficers.filter(o =>
      o.department === "Law & Order" || o.department === "Police"
    );

    console.log(`Found ${deptOfficers.length} officers for ${dept}`);

    // ─── LEVEL 1: Same dept + same area (GPS 5km OR text match) ───
    console.log("→ Level 1: Same dept, same area");
    const level1 = deptOfficers.filter(o => {
      const d = getDistance(o, complaintCoords);
      if (d !== null) return d <= 5;
      return textAreaMatch(o.area, complaintLoc);
    });
    console.log(`   Level 1 candidates: ${level1.map(o => o.name).join(", ") || "none"}`);
    if (level1.length > 0) {
      const best = findBestOfficer(level1, complaintCoords, complaint);
      if (best) return await assignToOfficer(complaint, best);
    }

    // ─── LEVEL 2: Same dept + within 20km GPS ───
    console.log("→ Level 2: Same dept, within 20km GPS");
    const level2 = deptOfficers.filter(o => {
      const d = getDistance(o, complaintCoords);
      return d !== null && d <= 20;
    });
    console.log(`   Level 2 candidates: ${level2.map(o => o.name).join(", ") || "none"}`);
    if (level2.length > 0) {
      const best = findBestOfficer(level2, complaintCoords, complaint);
      if (best) return await assignToOfficer(complaint, best);
    }

    // ─── LEVEL 3: Same dept + within 60km (LOW/MEDIUM only) ───
    if (!highUrgency) {
      console.log("→ Level 3: Same dept, within 60km");
      const level3GPS = deptOfficers.filter(o => {
        const d = getDistance(o, complaintCoords);
        return d !== null && d <= 60;
      });
      if (level3GPS.length > 0) {
        const best = findBestOfficer(level3GPS, complaintCoords, complaint);
        if (best) return await assignToOfficer(complaint, best);
      }
      // No GPS officers at level 3
      const level3NoGPS = deptOfficers.filter(o => !o.currentLocation?.lat);
      console.log(`   Level 3 no-GPS candidates: ${level3NoGPS.map(o => o.name).join(", ") || "none"}`);
      if (level3NoGPS.length > 0) {
        const best = findBestOfficer(level3NoGPS, complaintCoords, complaint);
        if (best) return await assignToOfficer(complaint, best);
      }
    } else {
      console.log("→ Level 3: SKIPPED (high urgency)");
    }

    // ─── LEVEL 4: Police officer same area ───
    console.log("→ Level 4: Police fallback");
    const level4 = policeOfficers.filter(o => {
      const d = getDistance(o, complaintCoords);
      if (d !== null) return d <= 10;
      return textAreaMatch(o.area, complaintLoc);
    });
    console.log(`   Level 4 candidates: ${level4.map(o => o.name).join(", ") || "none"}`);
    if (level4.length > 0) {
      const best = findBestOfficer(level4, complaintCoords, complaint);
      if (best) return await assignToOfficer(complaint, best);
    }

    // ─── LEVEL 5: Any nearest available officer ───
    console.log("→ Level 5: Any nearest officer");
    const best = findBestOfficer(allOfficers, complaintCoords, complaint);
    if (best) return await assignToOfficer(complaint, best);

    // ─── LEVEL 6: No officer — alert admin ───
    console.log("→ Level 6: No officer found");
    try {
      getIO().emit("noOfficerAvailable", {
        complaintId: complaint._id,
        department: dept,
        location: complaintLoc,
        message: `No ${dept} officer available for ${complaintLoc}`,
      });
    } catch (e) {
      console.error("Socket error:", e.message);
    }

    return { success: false, reason: "No officer available - admin alerted" };

  } catch (error) {
    console.error("Auto assign error:", error.message);
    return { success: false, reason: error.message };
  }
};
