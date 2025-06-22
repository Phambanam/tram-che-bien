"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const report_controller_1 = require("../controllers/report.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// All routes are protected
router.use(auth_middleware_1.protect);
// Routes for admin, brigade assistant, station manager, and commander
router.get("/by-unit", (0, auth_middleware_1.authorize)("admin", "brigadeAssistant", "stationManager", "commander"), report_controller_1.getReportByUnit);
router.get("/by-category", (0, auth_middleware_1.authorize)("admin", "brigadeAssistant", "stationManager", "commander"), report_controller_1.getReportByCategory);
router.get("/detailed", (0, auth_middleware_1.authorize)("admin", "brigadeAssistant", "stationManager", "commander"), report_controller_1.getDetailedReport);
exports.default = router;
