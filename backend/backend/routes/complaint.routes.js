import express from "express";
import {
  createComplaint,
  getComplaints,
  getSingleComplaint,
  updateComplaintStatus,
} from "../controllers/complaint.controller.js";

const router = express.Router();

router.post("/", createComplaint);
router.get("/", getComplaints);
router.get("/:id", getSingleComplaint); // ⭐ NEW
router.patch("/:id/status", updateComplaintStatus);

export default router;
