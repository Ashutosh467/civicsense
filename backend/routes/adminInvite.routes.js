import express from "express";
import {
  createInvite,
  getInvites,
  acceptInvite,
} from "../controllers/adminInvite.controller.js";
import { protectSuperAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protectSuperAdmin, createInvite);
router.get("/", protectSuperAdmin, getInvites);
router.post("/accept", acceptInvite);

export default router;

