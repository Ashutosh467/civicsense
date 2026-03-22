import db from "../config/db.js";

/*
=============================
CREATE COMPLAINT
=============================
*/
export const createComplaint = async (req, res) => {
  try {
    const complaintData = {
      callerNo: req.body.callerNo || "Unknown",
      issueType: req.body.issueType || "General",
      location: req.body.location || "Unknown",
      urgency: req.body.urgency || "low",
      emotion: req.body.emotion || "neutral",
      summary: req.body.summary || "",
      status: "pending",
      time: new Date().toISOString(),
    };

    const docRef = await db.collection("complaints").add(complaintData);

    res.status(201).json({
      message: "Complaint created successfully",
      id: docRef.id,
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
    const snapshot = await db
      .collection("complaints")
      .orderBy("time", "desc")
      .get();

    const complaints = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

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
    const doc = await db.collection("complaints").doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    res.json({
      id: doc.id,
      ...doc.data(),
    });
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

    await db
      .collection("complaints")
      .doc(req.params.id)
      .update({ status: req.body.status });

    res.json({ message: "Status updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
