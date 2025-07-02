"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bean_sprouts_calculation_controller_1 = require("../controllers/bean-sprouts-calculation.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// Protected routes
router.use(auth_middleware_1.protect);
// Get bean sprouts requirements for a specific date or week
router.get("/requirements", bean_sprouts_calculation_controller_1.calculateBeanSproutsRequirements);
// Get weekly bean sprouts requirements with daily breakdown
router.get("/weekly-requirements", bean_sprouts_calculation_controller_1.calculateWeeklyBeanSproutsRequirements);
// Get bean sprouts usage statistics
router.get("/statistics", bean_sprouts_calculation_controller_1.getBeanSproutsUsageStatistics);
// Get weekly bean sprouts tracking data (for frontend weekly table)
router.get("/weekly-tracking", bean_sprouts_calculation_controller_1.getWeeklyBeanSproutsTracking);
// Get monthly bean sprouts summary (for frontend monthly table)
router.get("/monthly-summary", bean_sprouts_calculation_controller_1.getMonthlyBeanSproutsSummary);
exports.default = router;
