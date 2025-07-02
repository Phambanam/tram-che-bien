"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const salt_calculation_controller_1 = require("../controllers/salt-calculation.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// @route   GET /api/salt-calculation/requirements
// @desc    Calculate salt/pickled vegetables requirements
// @access  Private
router.get("/requirements", auth_middleware_1.protect, salt_calculation_controller_1.calculateSaltRequirements);
// @route   GET /api/salt-calculation/weekly-requirements
// @desc    Calculate weekly salt/pickled vegetables requirements
// @access  Private
router.get("/weekly-requirements", auth_middleware_1.protect, salt_calculation_controller_1.calculateWeeklySaltRequirements);
// @route   GET /api/salt-calculation/usage-statistics
// @desc    Get salt/pickled vegetables usage statistics
// @access  Private
router.get("/usage-statistics", auth_middleware_1.protect, salt_calculation_controller_1.getSaltUsageStatistics);
// @route   GET /api/salt-calculation/weekly-tracking
// @desc    Get weekly salt processing tracking data
// @access  Private
router.get("/weekly-tracking", auth_middleware_1.protect, salt_calculation_controller_1.getWeeklySaltTracking);
// @route   GET /api/salt-calculation/monthly-summary
// @desc    Get monthly salt processing summary
// @access  Private
router.get("/monthly-summary", auth_middleware_1.protect, salt_calculation_controller_1.getMonthlySaltSummary);
exports.default = router;
