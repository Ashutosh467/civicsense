import express from "express";
import {
  createOfficer,
  getAllOfficers,
  updateOfficerLocation,
  autoAssignComplaint,
  resolveComplaint,
  getOfficerComplaints,
} from "../controllers/officer.controller.js";

import {
  officerSignup,
  officerLogin,
  approveOfficer,
  getPendingOfficers,
} from "../controllers/officerAuth.controller.js";
import { softDeleteOfficer } from "../controllers/officerDelete.controller.js";
import {
  protectOfficer,
  protectAdmin,
  ownsResourceOrAdmin,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// --- ADMIN ONLY ---
router.post("/", protectAdmin, createOfficer);
router.get("/", protectAdmin, getAllOfficers);
router.post("/:complaintId/auto-assign", protectAdmin, autoAssignComplaint);

// --- OFFICER ONLY (own resource) ---
router.patch(
  "/:officerId/location",
  protectOfficer,
  ownsResourceOrAdmin("officerId"),
  updateOfficerLocation,
);
router.get(
  "/:officerId/complaints",
  protectOfficer,
  ownsResourceOrAdmin("officerId"),
  getOfficerComplaints,
);
router.patch("/:complaintId/resolve", protectOfficer, resolveComplaint);

// --- PUBLIC (unchanged) ---
router.post("/auth/signup", officerSignup);
router.post("/auth/login", officerLogin);

// --- ADMIN ONLY ---
router.patch("/:officerId/approve", protectAdmin, approveOfficer);
router.get("/auth/pending", protectAdmin, getPendingOfficers);
router.patch("/:officerId/archive", protectAdmin, softDeleteOfficer);

export default router;
