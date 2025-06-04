import { Router } from "express"
import {
  getMenuSuggestions,
  getInventoryAlerts,
  generateDailyMenuPlan,
  getMenuPlanningOverview,
  getDailyIngredientSummaries,
  createSupplyOutputsFromIngredients,
} from "../controllers/menu-planning.controller"
// import { protect } from "../middleware/auth.middleware" // Temporarily disabled for development

const router = Router()

// Apply auth middleware to all routes (temporarily disabled for development)
// router.use(protect)

// @route   GET /api/menu-planning/suggestions
// @desc    Get smart menu suggestions based on inventory and expiry
// @access  Public (temporarily for development)
router.get("/suggestions", getMenuSuggestions)

// @route   GET /api/menu-planning/alerts
// @desc    Get inventory alerts for expiring/expired items
// @access  Public (temporarily for development)
router.get("/alerts", getInventoryAlerts)

// @route   POST /api/menu-planning/daily-plan
// @desc    Generate daily menu plan for specific date
// @access  Public (temporarily for development)
router.post("/daily-plan", generateDailyMenuPlan)

// @route   GET /api/menu-planning/overview
// @desc    Get comprehensive menu planning overview data
// @access  Public (temporarily for development)
router.get("/overview", getMenuPlanningOverview)

// @route   GET /api/menu-planning/ingredient-summaries
// @desc    Get daily ingredient summaries for menu planning
// @access  Public (temporarily for development)
router.get("/ingredient-summaries", getDailyIngredientSummaries)

// @route   POST /api/menu-planning/create-supply-outputs
// @desc    Auto create supply outputs from ingredient summaries
// @access  Public (temporarily for development)
router.post("/create-supply-outputs", createSupplyOutputsFromIngredients)

export default router 