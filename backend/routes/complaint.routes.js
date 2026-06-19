import express from "express";
import {
  createComplaint,
  getComplaints,
  getSingleComplaint,
  updateComplaintStatus,
  getComplaintByPhone,
  confirmComplaint,
  softDeleteComplaint,
} from "../controllers/complaint.controller.js";
import { checkAndTrackSpam } from "../services/spamCheck.js";

const router = express.Router();

router.post("/", createComplaint);
router.get("/", getComplaints);
router.get("/:id", getSingleComplaint); // ⭐ NEW
router.patch("/:id/status", updateComplaintStatus);
router.get("/by-phone/:phone", getComplaintByPhone);
router.patch("/:id/confirm", confirmComplaint);

router.patch("/:id/archive", softDeleteComplaint);
router.post("/internal/spam-check", async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "Missing phone" });

  const result = await checkAndTrackSpam(phone);
  res.json(result);
});
export default router;
