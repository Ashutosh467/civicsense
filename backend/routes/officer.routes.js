import express from "express";
import {
  createOfficer,
  getAllOfficers,
  updateOfficerLocation,
  autoAssignComplaint,
  resolveComplaint,
  getOfficerComplaints
} from "../controllers/officer.controller.js";

const router = express.Router();

router.post("/", createOfficer);
router.get("/", getAllOfficers);
router.patch("/:officerId/location", updateOfficerLocation);
router.post("/:complaintId/auto-assign", autoAssignComplaint);
router.patch("/:complaintId/resolve", resolveComplaint);
router.get("/:officerId/complaints", getOfficerComplaints);

export default router;
