import { Router } from "express"
import { 
  getDailyRations, 
  createDailyRation, 
  getDailyRationById, 
  updateDailyRation, 
  deleteDailyRation,
  getDailyRationsByCategory,
  getTotalDailyCost
} from "../controllers/daily-ration.controller"
import { protect, authorize } from "../middleware/auth.middleware"

const router = Router()

// Public routes (no authentication required)
router.get("/", getDailyRations)
router.get("/total-cost", getTotalDailyCost)
router.get("/by-category/:category", getDailyRationsByCategory)
router.get("/:id", getDailyRationById)

// Protected routes (require authentication)
router.use(protect)

// Protected routes (Admin, Brigade Assistant)
router.post("/", authorize("admin", "brigade_assistant"), createDailyRation)
router.patch("/:id", authorize("admin", "brigade_assistant"), updateDailyRation)

// Admin only routes
router.delete("/:id", authorize("admin"), deleteDailyRation)

export default router 