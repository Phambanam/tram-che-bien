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

// Public routes (no authentication required for development)
router.get("/", getDailyRations)
router.get("/total-cost", getTotalDailyCost)
router.get("/by-category/:category", getDailyRationsByCategory)
router.get("/:id", getDailyRationById)
router.post("/", createDailyRation)  // Temporarily public for development
router.patch("/:id", updateDailyRation)  // Temporarily public for development

// Protected routes (require authentication)
router.use(protect)

// Admin only routes (keep delete protected for safety)
router.delete("/:id", authorize("admin"), deleteDailyRation)

export default router 