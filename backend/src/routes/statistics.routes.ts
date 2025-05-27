import express from "express"
import {
  getStatisticsOverview,
  getSupplyTrends,
  getCategoryDistribution,
  getUnitPerformance,
} from "../controllers/statistics.controller"
import { protect, authorize } from "../middleware/auth.middleware"

const router = express.Router()

// All routes are protected
router.use(protect)

// Routes for admin, brigade assistant, and commander
router.get("/overview", authorize("admin", "brigadeAssistant", "commander"), getStatisticsOverview)
router.get("/trends", authorize("admin", "brigadeAssistant", "commander"), getSupplyTrends)
router.get("/distribution", authorize("admin", "brigadeAssistant", "commander"), getCategoryDistribution)
router.get("/performance", authorize("admin", "brigadeAssistant", "commander"), getUnitPerformance)

export default router
