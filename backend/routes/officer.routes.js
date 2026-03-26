import express from "express";
import {
  createOfficer,
  getAllOfficers,
  updateOfficerLocation,
  autoAssignComplaint,
  resolveComplaint,
  getOfficerComplaints
} from "../controllers/officer.controller.js";

import {
  officerSignup,
  officerLogin,
  approveOfficer,
  getPendingOfficers
} from "../controllers/officerAuth.controller.js";
import { softDeleteOfficer } from "../controllers/officerDelete.controller.js";

const router = express.Router();

router.post("/", createOfficer);
router.get("/", getAllOfficers);
router.patch("/:officerId/location", updateOfficerLocation);
router.post("/:complaintId/auto-assign", autoAssignComplaint);
router.patch("/:complaintId/resolve", resolveComplaint);
router.get("/:officerId/complaints", getOfficerComplaints);

router.post("/auth/signup", officerSignup);
router.post("/auth/login", officerLogin);
router.patch("/:officerId/approve", approveOfficer);
router.get("/auth/pending", getPendingOfficers);

router.patch("/:officerId/archive", softDeleteOfficer);

export default router;
