import Complaint from "../models/complaint.model.js";
import Officer from "../models/officer.model.js";
import { getIO } from "../sockets/socket.js";
import axios from "axios";

// ================================
// URGENCY THRESHOLDS PER DEPARTMENT
// ================================
const URGENCY_THRESHOLDS = {
  "Fire Department": 6,
  "Law & Order": 6,
  "Health": 6,
  "Water & Sanitation": 7,
  "Electricity": 7,
  "Roads & Infrastructure": 8,
  "Municipal Services": 9,
};

// ================================
// HAVERSINE DISTANCE FORMULA
// Returns distance in KM
// ================================
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

// ================================
// GEOCODE LOCATION TEXT TO LAT/LNG
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
      }
    );
    if (response.data && response.data.length > 0) {
      const { lat, lon } = response.data[0];
      console.log(`Geocoded "${locationText}" to ${lat}, ${lon}`);
      return { lat: parseFloat(lat), lng: parseFloat(lon) };
    }
    return null;
  } catch (err) {
    console.error("Geocoding failed:", err.message);
    return null;
  }
}

// ================================
// CHECK IF URGENCY IS HIGH
// ================================
function isHighUrgency(complaint) {
  const threshold = URGENCY_THRESHOLDS[complaint.department] || 7;
  return (complaint.urgencyScore || 5) >= threshold;
}

// ================================
// GET DISTANCE BETWEEN OFFICER AND COMPLAINT
// ================================
function getDistance(officer, complaintCoords) {
  if (
    !complaintCoords ||
    !officer.currentLocation?.lat ||
    !officer.currentLocation?.lng
  ) {
    return null;
  }
  return haversineDistance(
    complaintCoords.lat,
    complaintCoords.lng,
    officer.currentLocation.lat,
    officer.currentLocation.lng
  );
}

// ================================
// FIND BEST OFFICER FROM LIST
// ================================
function findBestOfficer(officers, complaintCoords, complaint) {
  let best = null;
  let bestScore = -Infinity;

  for (const officer of officers) {
    let score = 0;
    const distance = getDistance(officer, complaintCoords);

    if (distance !== null) {
      // Closer = higher score
      score += Math.max(0, 100 - distance * 2);
    } else {
      // No GPS - neutral score
      score += 40;
    }

    // Trust score bonus for high urgency
    if (isHighUrgency(complaint)) {
      score += (officer.trustScore || 70) * 0.2;
    }

    // Penalize overloaded officers
    score -= officer.activeComplaintsCount * 15;

    // Penalize no GPS
    if (!officer.currentLocation?.lat) score -= 20;

    console.log(`Officer ${officer.name}: score=${score.toFixed(0)}, distance=${distance ? distance.toFixed(1) + "km" : "no GPS"}`);

    if (score > bestScore) {
      bestScore = score;
      best = officer;
    }
  }
  return best;
}

// ================================
// NOTIFY OFFICER AND UPDATE
// ================================
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

  console.log(`✅ Assigned complaint ${complaint._id} to ${officer.name}`);
  return { success: true, officerId: officer.officerId, officerName: officer.name };
}

// ================================
// MAIN AUTO ASSIGN FUNCTION
// ================================
export const assignComplaintToOfficer = async (complaintId) => {
  try {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return { success: false, reason: "Complaint not found" };

    if (["assigned", "in_progress", "resolved"].includes(complaint.status)) {
      return { success: false, reason: "Already assigned" };
    }

    const highUrgency = isHighUrgency(complaint);
    const dept = complaint.department;
    console.log(`\n🔍 Assigning complaint: ${dept} | High urgency: ${highUrgency}`);

    // Geocode complaint location
    const complaintCoords = await geocodeLocation(
      complaint.translatedLocation || complaint.location
    );

    // Get ALL available officers
    const allOfficers = await Officer.find({
      isAvailable: true,
      isArchived: { $ne: true },
      approvalStatus: "approved",
    });

    if (allOfficers.length === 0) {
      console.log("⚠️ No officers available at all");
      return { success: false, reason: "No officers available" };
    }

    // Split by department
    const deptOfficers = allOfficers.filter(o => o.department === dept);
    const policeOfficers = allOfficers.filter(o =>
      o.department === "Law & Order" || o.department === "Police"
    );

    // ─── LEVEL 1: Same dept + same area (within 5km) ───
    console.log("→ Level 1: Same dept, same area (5km)");
    const level1 = deptOfficers.filter(o => {
      const d = getDistance(o, complaintCoords);
      if (d !== null) return d <= 5;
      // text matching fallback
      const area = (o.area || "").toLowerCase();
      const loc = (complaint.translatedLocation || complaint.location || "").toLowerCase();
      return loc.includes(area) || area.includes(loc.split(",")[0]);
    });
    if (level1.length > 0) {
      const best = findBestOfficer(level1, complaintCoords, complaint);
      if (best) return await assignToOfficer(complaint, best);
    }

    // ─── LEVEL 2: Same dept + within 20km ───
    console.log("→ Level 2: Same dept, within 20km");
    const level2 = deptOfficers.filter(o => {
      const d = getDistance(o, complaintCoords);
      return d !== null && d <= 20;
    });
    if (level2.length > 0) {
      const best = findBestOfficer(level2, complaintCoords, complaint);
      if (best) return await assignToOfficer(complaint, best);
    }

    // ─── LEVEL 3: Same dept + within 60km (LOW/MEDIUM only) ───
    if (!highUrgency) {
      console.log("→ Level 3: Same dept, within 60km (low/medium urgency)");
      const level3 = deptOfficers.filter(o => {
        const d = getDistance(o, complaintCoords);
        return d !== null && d <= 60;
      });
      if (level3.length > 0) {
        const best = findBestOfficer(level3, complaintCoords, complaint);
        if (best) return await assignToOfficer(complaint, best);
      }

      // Also try dept officers with no GPS at level 3
      const level3NoGPS = deptOfficers.filter(o => !o.currentLocation?.lat);
      if (level3NoGPS.length > 0) {
        const best = findBestOfficer(level3NoGPS, complaintCoords, complaint);
        if (best) return await assignToOfficer(complaint, best);
      }
    } else {
      console.log("→ Level 3: SKIPPED (high urgency)");
    }

    // ─── LEVEL 4: Police officer in same area ───
    console.log("→ Level 4: Police fallback in same area");
    const level4 = policeOfficers.filter(o => {
      const d = getDistance(o, complaintCoords);
      if (d !== null) return d <= 10;
      const area = (o.area || "").toLowerCase();
      const loc = (complaint.translatedLocation || complaint.location || "").toLowerCase();
      return loc.includes(area) || area.includes(loc.split(",")[0]);
    });
    if (level4.length > 0) {
      const best = findBestOfficer(level4, complaintCoords, complaint);
      if (best) return await assignToOfficer(complaint, best);
    }

    // ─── LEVEL 5: Any nearest available officer ───
    console.log("→ Level 5: Any nearest officer");
    const best = findBestOfficer(allOfficers, complaintCoords, complaint);
    if (best) return await assignToOfficer(complaint, best);

    // ─── LEVEL 6: Escalate to admin ───
    console.log("→ Level 6: No officer found - escalating to admin");
    try {
      getIO().emit("noOfficerAvailable", {
        complaintId: complaint._id,
        department: dept,
        location: complaint.translatedLocation || complaint.location,
        urgencyScore: complaint.urgencyScore,
        message: `No ${dept} officer available for complaint in ${complaint.location}`,
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
