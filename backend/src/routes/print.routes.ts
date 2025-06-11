import express from "express"
import { printSupplies, printUnitReport, printCategoryReport } from "../controllers/print.controller"
import { protect, authorize } from "../middleware/auth.middleware"

const router = express.Router()

// All routes are protected
router.use(protect)

// Route for all authenticated users (tailored based on user role)
router.get("/supplies", printSupplies)

// Routes for admin, brigade assistant, station manager, and commander
router.get("/reports/by-unit", authorize("admin", "brigadeAssistant", "stationManager", "commander"), printUnitReport)
router.get("/reports/by-category", authorize("admin", "brigadeAssistant", "stationManager", "commander"), printCategoryReport)

export default router
