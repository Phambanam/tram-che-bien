"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const menu_controller_1 = require("../controllers/menu.controller");
// import { protect, authorize } from "../middleware/auth.middleware" // Temporarily disabled for development
const router = express_1.default.Router();
// Protected routes (temporarily disabled for development)
// router.use(protect)
// Routes for all authenticated users
router.get("/", menu_controller_1.getAllMenus);
router.get("/:id", menu_controller_1.getMenuById);
// Routes for admin only (temporarily public for development)
router.post("/", menu_controller_1.createMenu);
router.patch("/:id", menu_controller_1.updateMenu);
router.delete("/:id", menu_controller_1.deleteMenu);
// Daily menu routes
router.post("/:id/daily-menus", menu_controller_1.createDailyMenu);
router.patch("/daily-menus/:id", menu_controller_1.updateDailyMenu);
router.delete("/daily-menus/:id", menu_controller_1.deleteDailyMenu);
router.post("/daily-menus/:id/copy", menu_controller_1.copyDailyMenu);
// Meal routes
router.patch("/meals/:id", menu_controller_1.updateMealDishes);
router.post("/meals/:id/dishes", menu_controller_1.addDishToMeal);
router.delete("/meals/:id/dishes/:dishId", menu_controller_1.removeDishFromMeal);
exports.default = router;
