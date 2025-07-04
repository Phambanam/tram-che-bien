import { Router } from "express"
import { 
  getDailyPoultryData,
  updateDailyPoultryData,
  getWeeklyPoultryTracking,
  getMonthlyPoultrySummary,
  getWeeklyPoultryProcessing,
  getDailyPoultryProcessing,
  updateDailyPoultryProcessing,
  getPoultryStats
} from "../controllers/poultry-processing.controller"
import { protect, authorize } from "../middleware/auth.middleware"

const router = Router()

// Public routes (temporarily for development)
router.get("/daily/:date", getDailyPoultryData)
router.get("/weekly", getWeeklyPoultryTracking)
router.get("/monthly", getMonthlyPoultrySummary)

// Protected routes
router.use(protect)

// Station manager & admin only routes
router.patch("/daily/:date", authorize(["admin", "stationManager"]), updateDailyPoultryData)

// Get weekly poultry processing data
router.get("/weekly", getWeeklyPoultryProcessing)

// Get daily poultry processing data
router.get("/daily/:date", getDailyPoultryProcessing)

// Update daily poultry processing data
router.patch("/daily/:date", updateDailyPoultryProcessing)

// Get poultry processing statistics
router.get("/stats", getPoultryStats)

export default router