import express from "express";
import {
  createComplaint,
  getComplaints,
  getSingleComplaint,
  updateComplaintStatus,
  getComplaintByPhone,
  confirmComplaint,
  softDeleteComplaint
} from "../controllers/complaint.controller.js";

const router = express.Router();

router.post("/", createComplaint);
router.get("/", getComplaints);
router.get("/:id", getSingleComplaint); // ⭐ NEW
router.patch("/:id/status", updateComplaintStatus);
router.get("/by-phone/:phone", getComplaintByPhone);
router.patch("/:id/confirm", confirmComplaint);

router.patch("/:id/archive", softDeleteComplaint);
export default router;
