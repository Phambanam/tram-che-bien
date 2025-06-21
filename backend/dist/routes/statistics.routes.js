"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const statistics_controller_1 = require("../controllers/statistics.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// All routes are protected
router.use(auth_middleware_1.protect);
// Routes for admin, brigade assistant, station manager, and commander
router.get("/overview", (0, auth_middleware_1.authorize)("admin", "brigadeAssistant", "stationManager", "commander"), statistics_controller_1.getStatisticsOverview);
router.get("/trends", (0, auth_middleware_1.authorize)("admin", "brigadeAssistant", "stationManager", "commander"), statistics_controller_1.getSupplyTrends);
router.get("/distribution", (0, auth_middleware_1.authorize)("admin", "brigadeAssistant", "stationManager", "commander"), statistics_controller_1.getCategoryDistribution);
router.get("/performance", (0, auth_middleware_1.authorize)("admin", "brigadeAssistant", "stationManager", "commander"), statistics_controller_1.getUnitPerformance);
exports.default = router;
