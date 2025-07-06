"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const menu_controller_1 = require("../controllers/menu.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// Protected routes
router.use(auth_middleware_1.protect);
// Routes for all authenticated users (everyone can view menus)
router.get("/", menu_controller_1.getAllMenus);
router.get("/:id", menu_controller_1.getMenuById);
// Routes for brigade assistant only (only brigade assistant can create/update/delete menus)
router.post("/", (0, auth_middleware_1.authorize)("brigadeAssistant"), menu_controller_1.createMenu);
router.patch("/:id", (0, auth_middleware_1.authorize)("brigadeAssistant"), menu_controller_1.updateMenu);
router.delete("/:id", (0, auth_middleware_1.authorize)("brigadeAssistant"), menu_controller_1.deleteMenu);
// Daily menu routes (only brigade assistant can manage)
router.post("/:id/daily-menus", (0, auth_middleware_1.authorize)("brigadeAssistant"), menu_controller_1.createDailyMenu);
router.patch("/daily-menus/:id", (0, auth_middleware_1.authorize)("brigadeAssistant"), menu_controller_1.updateDailyMenu);
router.delete("/daily-menus/:id", (0, auth_middleware_1.authorize)("brigadeAssistant"), menu_controller_1.deleteDailyMenu);
router.post("/daily-menus/:id/copy", (0, auth_middleware_1.authorize)("brigadeAssistant"), menu_controller_1.copyDailyMenu);
// Daily menu approval routes (only commander and admin can approve/reject)
router.post("/daily-menus/:id/approve", (0, auth_middleware_1.authorize)("commander", "admin"), menu_controller_1.approveDailyMenu);
router.post("/daily-menus/:id/reject", (0, auth_middleware_1.authorize)("commander", "admin"), menu_controller_1.rejectDailyMenu);
// Meal routes (only brigade assistant can manage)
router.patch("/meals/:id", (0, auth_middleware_1.authorize)("brigadeAssistant"), menu_controller_1.updateMealDishes);
router.post("/meals/:id/dishes", (0, auth_middleware_1.authorize)("brigadeAssistant"), menu_controller_1.addDishToMeal);
router.delete("/meals/:id/dishes/:dishId", (0, auth_middleware_1.authorize)("brigadeAssistant"), menu_controller_1.removeDishFromMeal);
exports.default = router;
