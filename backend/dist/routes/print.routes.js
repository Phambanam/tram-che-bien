"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const print_controller_1 = require("../controllers/print.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// All routes are protected
router.use(auth_middleware_1.protect);
// Route for all authenticated users (tailored based on user role)
router.get("/supplies", print_controller_1.printSupplies);
// Routes for admin, brigade assistant, station manager, and commander
router.get("/reports/by-unit", (0, auth_middleware_1.authorize)("admin", "brigadeAssistant", "stationManager", "commander"), print_controller_1.printUnitReport);
router.get("/reports/by-category", (0, auth_middleware_1.authorize)("admin", "brigadeAssistant", "stationManager", "commander"), print_controller_1.printCategoryReport);
exports.default = router;
