"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const menu_planning_controller_1 = require("../controllers/menu-planning.controller");
// import { protect } from "../middleware/auth.middleware" // Temporarily disabled for development
const router = (0, express_1.Router)();
// Apply auth middleware to all routes (temporarily disabled for development)
// router.use(protect)
// @route   GET /api/menu-planning/suggestions
// @desc    Get smart menu suggestions based on inventory and expiry
// @access  Public (temporarily for development)
router.get("/suggestions", menu_planning_controller_1.getMenuSuggestions);
// @route   GET /api/menu-planning/alerts
// @desc    Get inventory alerts for expiring/expired items
// @access  Public (temporarily for development)
router.get("/alerts", menu_planning_controller_1.getInventoryAlerts);
// @route   POST /api/menu-planning/daily-plan
// @desc    Generate daily menu plan for specific date
// @access  Public (temporarily for development)
router.post("/daily-plan", menu_planning_controller_1.generateDailyMenuPlan);
// @route   GET /api/menu-planning/overview
// @desc    Get comprehensive menu planning overview data
// @access  Public (temporarily for development)
router.get("/overview", menu_planning_controller_1.getMenuPlanningOverview);
// @route   GET /api/menu-planning/ingredient-summaries
// @desc    Get daily ingredient summaries for menu planning
// @access  Public (temporarily for development)
router.get("/ingredient-summaries", menu_planning_controller_1.getDailyIngredientSummaries);
exports.default = router;
