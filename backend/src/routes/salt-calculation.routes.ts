import { Router } from "express"
import {
  calculateSaltRequirements,
  calculateWeeklySaltRequirements,
  getSaltUsageStatistics,
  getWeeklySaltTracking,
  getMonthlySaltSummary
} from "../controllers/salt-calculation.controller"
import { protect } from "../middleware/auth.middleware"

const router = Router()

// @route   GET /api/salt-calculation/requirements
// @desc    Calculate salt/pickled vegetables requirements
// @access  Private
router.get("/requirements", protect, calculateSaltRequirements)

// @route   GET /api/salt-calculation/weekly-requirements
// @desc    Calculate weekly salt/pickled vegetables requirements
// @access  Private
router.get("/weekly-requirements", protect, calculateWeeklySaltRequirements)

// @route   GET /api/salt-calculation/usage-statistics
// @desc    Get salt/pickled vegetables usage statistics
// @access  Private
router.get("/usage-statistics", protect, getSaltUsageStatistics)

// @route   GET /api/salt-calculation/weekly-tracking
// @desc    Get weekly salt processing tracking data
// @access  Private
router.get("/weekly-tracking", protect, getWeeklySaltTracking)

// @route   GET /api/salt-calculation/monthly-summary
// @desc    Get monthly salt processing summary
// @access  Private
router.get("/monthly-summary", protect, getMonthlySaltSummary)

export default router 