import express from "express"
import {
  getAllMenus,
  getMenuById,
  createMenu,
  updateMenu,
  deleteMenu,
  createDailyMenu,
  updateDailyMenu,
  deleteDailyMenu,
  updateMealDishes,
  addDishToMeal,
  removeDishFromMeal,
  copyDailyMenu,
} from "../controllers/menu.controller"
import { protect, authorize } from "../middleware/auth.middleware"

const router = express.Router()

// Protected routes
router.use(protect)

// Routes for all authenticated users (everyone can view menus)
router.get("/", getAllMenus)
router.get("/:id", getMenuById)

// Routes for brigade assistant only (only brigade assistant can create/update/delete menus)
router.post("/", authorize("brigadeAssistant"), createMenu)
router.patch("/:id", authorize("brigadeAssistant"), updateMenu)
router.delete("/:id", authorize("brigadeAssistant"), deleteMenu)

// Daily menu routes (only brigade assistant can manage)
router.post("/:id/daily-menus", authorize("brigadeAssistant"), createDailyMenu)
router.patch("/daily-menus/:id", authorize("brigadeAssistant"), updateDailyMenu)
router.delete("/daily-menus/:id", authorize("brigadeAssistant"), deleteDailyMenu)
router.post("/daily-menus/:id/copy", authorize("brigadeAssistant"), copyDailyMenu)

// Meal routes (only brigade assistant can manage)
router.patch("/meals/:id", authorize("brigadeAssistant"), updateMealDishes)
router.post("/meals/:id/dishes", authorize("brigadeAssistant"), addDishToMeal)
router.delete("/meals/:id/dishes/:dishId", authorize("brigadeAssistant"), removeDishFromMeal)

export default router
