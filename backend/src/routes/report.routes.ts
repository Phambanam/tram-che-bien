import express from "express"
import { getReportByUnit, getReportByCategory, getDetailedReport } from "../controllers/report.controller"
import { protect, authorize } from "../middleware/auth.middleware"

const router = express.Router()

// All routes are protected
router.use(protect)

// Routes for admin, brigade assistant, and commander
router.get("/by-unit", authorize("admin", "brigadeAssistant", "commander"), getReportByUnit)
router.get("/by-category", authorize("admin", "brigadeAssistant", "commander"), getReportByCategory)
router.get("/detailed", authorize("admin", "brigadeAssistant", "commander"), getDetailedReport)

export default router
