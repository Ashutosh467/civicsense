import express from "express";
import {
  createOfficerInvite,
  getOfficerInvites,
  acceptOfficerInvite,
} from "../controllers/officerInvite.controller.js";
import { protectAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

// ADMIN ONLY — generate a new officer invite link
router.post("/", protectAdmin, createOfficerInvite);

// ADMIN ONLY — view all officer invites sent so far
router.get("/", protectAdmin, getOfficerInvites);

// PUBLIC, but requires a valid token in the request body.
// This is how an admin-created officer actually gets login credentials.
router.post("/accept", acceptOfficerInvite);

export default router;
