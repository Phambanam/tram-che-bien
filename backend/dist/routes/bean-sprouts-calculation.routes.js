"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bean_sprouts_calculation_controller_1 = require("../controllers/bean-sprouts-calculation.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Protected routes
router.use(auth_middleware_1.protect);
// Bean sprouts calculation routes
router.get("/requirements", bean_sprouts_calculation_controller_1.calculateBeanSproutsRequirements);
router.get("/weekly-requirements", bean_sprouts_calculation_controller_1.calculateWeeklyBeanSproutsRequirements);
router.get("/statistics", bean_sprouts_calculation_controller_1.getBeanSproutsUsageStatistics);
router.get("/weekly-tracking", bean_sprouts_calculation_controller_1.getWeeklyBeanSproutsTracking);
router.get("/monthly-summary", bean_sprouts_calculation_controller_1.getMonthlyBeanSproutsSummary);
// Bean sprouts processing station routes
router.post("/daily-processing", bean_sprouts_calculation_controller_1.updateDailyBeanSproutsProcessing);
router.get("/daily-processing", bean_sprouts_calculation_controller_1.getDailyBeanSproutsProcessing);
exports.default = router;
