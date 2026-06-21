import express from "express";
import {
  createInvite,
  getInvites,
  acceptInvite,
  getAdminList,
  setAdminActiveStatus,
} from "../controllers/adminInvite.controller.js";
import { protectSuperAdmin } from "../middleware/auth.middleware.js";
const router = express.Router();
router.post("/", protectSuperAdmin, createInvite);
router.get("/", protectSuperAdmin, getInvites);
router.post("/accept", acceptInvite);

// SUPERADMIN ONLY — list all admins, and deactivate/reactivate one
router.get("/admins", protectSuperAdmin, getAdminList);
router.patch("/admins/:id/status", protectSuperAdmin, setAdminActiveStatus);

export default router;
