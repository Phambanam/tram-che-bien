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
// import { protect, authorize } from "../middleware/auth.middleware" // Temporarily disabled for development

const router = express.Router()

// Protected routes (temporarily disabled for development)
// router.use(protect)

// Routes for all authenticated users
router.get("/", getAllMenus)
router.get("/:id", getMenuById)

// Routes for admin only (temporarily public for development)
router.post("/", createMenu)
router.patch("/:id", updateMenu)
router.delete("/:id", deleteMenu)

// Daily menu routes
router.post("/:id/daily-menus", createDailyMenu)
router.patch("/daily-menus/:id", updateDailyMenu)
router.delete("/daily-menus/:id", deleteDailyMenu)
router.post("/daily-menus/:id/copy", copyDailyMenu)

// Meal routes
router.patch("/meals/:id", updateMealDishes)
router.post("/meals/:id/dishes", addDishToMeal)
router.delete("/meals/:id/dishes/:dishId", removeDishFromMeal)

export default router
