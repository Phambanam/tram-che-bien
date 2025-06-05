import { Router } from "express"
import { 
  getDishes, 
  createDish, 
  getDishById, 
  updateDish, 
  deleteDish,
  getDishesByIngredient,
  getDishesByMainLTTP
} from "../controllers/dish.controller"
// import { protect, authorize } from "../middleware/auth.middleware" // Temporarily disabled for development

const router = Router()

// Public routes (temporarily without auth for development)
router.get("/", getDishes)
router.get("/:id", getDishById)
router.get("/by-ingredient/:lttpId", getDishesByIngredient)
router.get("/by-main-lttp/:lttpId", getDishesByMainLTTP)

// Protected routes (temporarily public for development)
router.post("/", createDish)
router.patch("/:id", updateDish)

// Admin only routes (temporarily public for development)
router.delete("/:id", deleteDish)

export default router
