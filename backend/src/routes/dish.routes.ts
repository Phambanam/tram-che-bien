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
import { protect, authorize } from "../middleware/auth.middleware"

const router = Router()

// Public routes (with auth)
router.get("/", protect, getDishes)
router.get("/:id", protect, getDishById)
router.get("/by-ingredient/:lttpId", protect, getDishesByIngredient)
router.get("/by-main-lttp/:lttpId", protect, getDishesByMainLTTP)

// Protected routes (Admin, Brigade Assistant)
router.post("/", protect, authorize("admin", "brigade_assistant", "brigadeAssistant"), createDish)
router.patch("/:id", protect, authorize("admin", "brigade_assistant", "brigadeAssistant"), updateDish)

// Admin only routes
router.delete("/:id", protect, authorize("admin"), deleteDish)

export default router
