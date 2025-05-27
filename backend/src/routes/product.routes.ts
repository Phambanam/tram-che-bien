import express from "express"
import {
  getProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller"
import { protect, authorize } from "../middleware/auth.middleware"

const router = express.Router()

// Public routes
router.get("/", getProducts)

// Protected routes
router.use(protect)

// Routes for admin and brigade assistant
router.post("/", authorize("admin", "brigadeAssistant"), createProduct)
router.get("/:id", getProductById)
router.patch("/:id", authorize("admin", "brigadeAssistant"), updateProduct)

// Routes for admin only
router.delete("/:id", authorize("admin"), deleteProduct)

export default router
