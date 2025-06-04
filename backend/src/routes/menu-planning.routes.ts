import { Router } from "express"
import {
  getMenuSuggestions,
  getInventoryAlerts,
  generateDailyMenuPlan,
  getMenuPlanningOverview,
} from "../controllers/menu-planning.controller"
import { auth } from "../middleware/auth.middleware"

const router = Router()

// Apply auth middleware to all routes
router.use(auth)

// @route   GET /api/menu-planning/suggestions
// @desc    Get smart menu suggestions based on inventory and expiry
// @access  Private
router.get("/suggestions", getMenuSuggestions)

// @route   GET /api/menu-planning/alerts
// @desc    Get inventory alerts for expiring/expired items
// @access  Private
router.get("/alerts", getInventoryAlerts)

// @route   POST /api/menu-planning/daily-plan
// @desc    Generate daily menu plan for specific date
// @access  Private
router.post("/daily-plan", generateDailyMenuPlan)

// @route   GET /api/menu-planning/overview
// @desc    Get comprehensive menu planning overview data
// @access  Private
router.get("/overview", getMenuPlanningOverview)

export default router 