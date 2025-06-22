"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const daily_ration_controller_1 = require("../controllers/daily-ration.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public routes (no authentication required for development)
router.get("/", daily_ration_controller_1.getDailyRations);
router.get("/total-cost", daily_ration_controller_1.getTotalDailyCost);
router.get("/by-category/:category", daily_ration_controller_1.getDailyRationsByCategory);
router.get("/:id", daily_ration_controller_1.getDailyRationById);
router.post("/", daily_ration_controller_1.createDailyRation); // Temporarily public for development
router.patch("/:id", daily_ration_controller_1.updateDailyRation); // Temporarily public for development
router.delete("/:id", daily_ration_controller_1.deleteDailyRation); // Temporarily public for development
// Protected routes (require authentication)
router.use(auth_middleware_1.protect);
// Admin only routes (keep delete protected for safety)
router.delete("/:id", (0, auth_middleware_1.authorize)("admin"), daily_ration_controller_1.deleteDailyRation);
exports.default = router;
