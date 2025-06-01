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

// Routes for all authenticated users
router.get("/", getAllMenus)
router.get("/:id", getMenuById)

// Routes for admin only
router.post("/", authorize("admin", "brigadeAssistant"), createMenu)
router.patch("/:id", authorize("admin", "brigadeAssistant"), updateMenu)
router.delete("/:id", authorize("admin", "brigadeAssistant"), deleteMenu)

// Daily menu routes
router.post("/:id/daily-menus", authorize("admin", "brigadeAssistant"), createDailyMenu)
router.patch("/daily-menus/:id", authorize("admin", "brigadeAssistant"), updateDailyMenu)
router.delete("/daily-menus/:id", authorize("admin", "brigadeAssistant"), deleteDailyMenu)
router.post("/daily-menus/:id/copy", authorize("admin", "brigadeAssistant"), copyDailyMenu)

// Meal routes
router.patch("/meals/:id", authorize("admin", "brigadeAssistant"), updateMealDishes)
router.post("/meals/:id/dishes", authorize("admin", "brigadeAssistant"), addDishToMeal)
router.delete("/meals/:id/dishes/:dishId", authorize("admin", "brigadeAssistant"), removeDishFromMeal)

export default router
