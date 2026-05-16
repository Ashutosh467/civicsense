import express from "express";
import {
  getCallerTrust,
  updateCallerTrust,
  blacklistCaller,
  trackComplaint,
} from "../controllers/callerTrust.controller.js";

const router = express.Router();

router.get("/:phone", getCallerTrust);
router.patch("/:phone/update", updateCallerTrust);
router.patch("/:phone/blacklist", blacklistCaller);
router.post("/:phone/track", trackComplaint);

export default router;
