import express from "express"
import {
  calculateTofuRequirements,
  calculateWeeklyTofuRequirements,
  getTofuUsageStatistics
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

export default router 