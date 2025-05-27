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
router.post("/", authorize("admin"), createMenu)
router.patch("/:id", authorize("admin"), updateMenu)
router.delete("/:id", authorize("admin"), deleteMenu)

// Daily menu routes
router.post("/:id/daily-menus", authorize("admin"), createDailyMenu)
router.patch("/daily-menus/:id", authorize("admin"), updateDailyMenu)
router.delete("/daily-menus/:id", authorize("admin"), deleteDailyMenu)
router.post("/daily-menus/:id/copy", authorize("admin"), copyDailyMenu)

// Meal routes
router.patch("/meals/:id", authorize("admin"), updateMealDishes)

export default router
