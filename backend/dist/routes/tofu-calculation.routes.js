"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tofu_calculation_controller_1 = require("../controllers/tofu-calculation.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// Protected routes
router.use(auth_middleware_1.protect);
// Get tofu requirements for a specific date or week
router.get("/requirements", tofu_calculation_controller_1.calculateTofuRequirements);
// Get weekly tofu requirements with daily breakdown
router.get("/weekly-requirements", tofu_calculation_controller_1.calculateWeeklyTofuRequirements);
// Get tofu usage statistics
router.get("/statistics", tofu_calculation_controller_1.getTofuUsageStatistics);
// Get weekly tofu tracking data (for frontend weekly table)
router.get("/weekly-tracking", tofu_calculation_controller_1.getWeeklyTofuTracking);
// Get monthly tofu summary (for frontend monthly table)
router.get("/monthly-summary", tofu_calculation_controller_1.getMonthlyTofuSummary);
exports.default = router;
