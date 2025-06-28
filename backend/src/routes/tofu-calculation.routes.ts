import express from "express"
import {
  calculateTofuRequirements,
  calculateWeeklyTofuRequirements,
  getTofuUsageStatistics,
  getWeeklyTofuTracking,
  getMonthlyTofuSummary
} from "../controllers/tofu-calculation.controller"
import { protect, authorize } from "../middleware/auth.middleware"

const router = express.Router()

// Protected routes
router.use(protect)

// Get tofu requirements for a specific date or week
router.get("/requirements", calculateTofuRequirements)

// Get weekly tofu requirements with daily breakdown
router.get("/weekly-requirements", calculateWeeklyTofuRequirements)

// Get tofu usage statistics
router.get("/statistics", getTofuUsageStatistics)

// Get weekly tofu tracking data (for frontend weekly table)
router.get("/weekly-tracking", getWeeklyTofuTracking)

// Get monthly tofu summary (for frontend monthly table)
router.get("/monthly-summary", getMonthlyTofuSummary)

export default router 