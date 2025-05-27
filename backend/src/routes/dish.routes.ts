import express from "express"
import { getAllDishes, getDishById, createDish, updateDish, deleteDish } from "../controllers/dish.controller"
import { protect, authorize } from "../middleware/auth.middleware"

const router = express.Router()

// Protected routes
router.use(protect)

// Routes for all authenticated users
router.get("/", getAllDishes)
router.get("/:id", getDishById)

// Routes for admin only
router.post("/", authorize("admin"), createDish)
router.patch("/:id", authorize("admin"), updateDish)
router.delete("/:id", authorize("admin"), deleteDish)

export default router
