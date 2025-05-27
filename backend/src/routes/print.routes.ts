import express from "express"
import { printSupplies, printUnitReport, printCategoryReport } from "../controllers/print.controller"
import { protect, authorize } from "../middleware/auth.middleware"

const router = express.Router()

// All routes are protected
router.use(protect)

// Route for all authenticated users (tailored based on user role)
router.get("/supplies", printSupplies)

// Routes for admin, brigade assistant, and commander
router.get("/reports/by-unit", authorize("admin", "brigadeAssistant", "commander"), printUnitReport)
router.get("/reports/by-category", authorize("admin", "brigadeAssistant", "commander"), printCategoryReport)

export default router
