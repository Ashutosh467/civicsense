import express from "express";
import { getResolvedComplaintsReport } from "../controllers/complaint.controller.js";
import { getOfficerRosterReport } from "../controllers/officerInvite.controller.js";
import { protectAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/complaints", protectAdmin, getResolvedComplaintsReport);
router.get("/officers", protectAdmin, getOfficerRosterReport);

export default router;
