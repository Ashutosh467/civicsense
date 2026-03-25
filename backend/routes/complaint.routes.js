import express from "express";
import {
  createComplaint,
  getComplaints,
  getSingleComplaint,
  updateComplaintStatus,
  getComplaintByPhone,
  confirmComplaint
} from "../controllers/complaint.controller.js";

const router = express.Router();

router.post("/", createComplaint);
router.get("/", getComplaints);
router.get("/:id", getSingleComplaint); // ⭐ NEW
router.patch("/:id/status", updateComplaintStatus);
router.get("/by-phone/:phone", getComplaintByPhone);
router.patch("/:id/confirm", confirmComplaint);

export default router;
