import express from "express"
import {
  getAllContent,
  getContentById,
  createContent,
  updateContent,
  deleteContent,
} from "../controllers/content.controller"
import { protect, authorize } from "../middleware/auth.middleware"

const router = express.Router()

// Public routes
router.get("/", getAllContent)
router.get("/:id", getContentById)

// Protected routes
router.use(protect)

// Routes for admin only
router.post("/", authorize("admin"), createContent)
router.patch("/:id", authorize("admin"), updateContent)
router.delete("/:id", authorize("admin"), deleteContent)

export default router
