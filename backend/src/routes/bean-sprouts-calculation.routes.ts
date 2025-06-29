import express from "express"
import {
  calculateBeanSproutsRequirements,
  calculateWeeklyBeanSproutsRequirements,
  getBeanSproutsUsageStatistics,
  getWeeklyBeanSproutsTracking,
  getMonthlyBeanSproutsSummary
} from "../controllers/bean-sprouts-calculation.controller"
import { protect, authorize } from "../middleware/auth.middleware"

const router = express.Router()

// Protected routes
router.use(protect)

// Get bean sprouts requirements for a specific date or week
router.get("/requirements", calculateBeanSproutsRequirements)

// Get weekly bean sprouts requirements with daily breakdown
router.get("/weekly-requirements", calculateWeeklyBeanSproutsRequirements)

// Get bean sprouts usage statistics
router.get("/statistics", getBeanSproutsUsageStatistics)

// Get weekly bean sprouts tracking data (for frontend weekly table)
router.get("/weekly-tracking", getWeeklyBeanSproutsTracking)

// Get monthly bean sprouts summary (for frontend monthly table)
router.get("/monthly-summary", getMonthlyBeanSproutsSummary)

export default router 