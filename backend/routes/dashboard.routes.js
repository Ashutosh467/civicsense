import express from "express";
import {
  getDashboardSummary,
  getLocationInsights,
} from "../controllers/dashboard.controller.js";

const router = express.Router();

// top cards
router.get("/summary", getDashboardSummary);

// right panel insights
router.get("/location-insights", getLocationInsights);

export default router;
