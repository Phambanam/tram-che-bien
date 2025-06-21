"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const unit_personnel_daily_controller_1 = require("../controllers/unit-personnel-daily.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// Get personnel data for a specific week
router.get('/week', auth_middleware_1.protect, unit_personnel_daily_controller_1.getPersonnelByWeek);
// Update personnel count for a specific unit on a specific date
router.put('/update', auth_middleware_1.protect, unit_personnel_daily_controller_1.updatePersonnelForDate);
// Batch update personnel for multiple units/dates
router.put('/batch-update', auth_middleware_1.protect, unit_personnel_daily_controller_1.batchUpdatePersonnel);
exports.default = router;
