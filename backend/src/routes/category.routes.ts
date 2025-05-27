import express from "express"
import {
  getCategories,
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller"
import { protect, authorize } from "../middleware/auth.middleware"

const router = express.Router()

// Public routes
router.get("/", getCategories)

// Protected routes
router.use(protect)

// Routes for admin and brigade assistant
router.post("/", authorize("admin", "brigadeAssistant"), createCategory)
router.get("/:id", getCategoryById)
router.patch("/:id", authorize("admin", "brigadeAssistant"), updateCategory)

// Routes for admin only
router.delete("/:id", authorize("admin"), deleteCategory)

export default router
