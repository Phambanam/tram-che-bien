import { Router } from "express"
import {
  calculateBeanSproutsRequirements,
  calculateWeeklyBeanSproutsRequirements,
  getBeanSproutsUsageStatistics,
  getWeeklyBeanSproutsTracking,
  getMonthlyBeanSproutsSummary,
  updateDailyBeanSproutsProcessing,
  getDailyBeanSproutsProcessing
} from "../controllers/bean-sprouts-calculation.controller"
import { protect, authorize } from "../middleware/auth.middleware"

const router = Router()

// Protected routes
router.use(protect)

// Bean sprouts calculation routes
router.get("/requirements", calculateBeanSproutsRequirements)
router.get("/weekly-requirements", calculateWeeklyBeanSproutsRequirements)
router.get("/statistics", getBeanSproutsUsageStatistics)
router.get("/weekly-tracking", getWeeklyBeanSproutsTracking)
router.get("/monthly-summary", getMonthlyBeanSproutsSummary)

// Bean sprouts processing station routes
router.post("/daily-processing", updateDailyBeanSproutsProcessing)
router.get("/daily-processing", getDailyBeanSproutsProcessing)

export default router 