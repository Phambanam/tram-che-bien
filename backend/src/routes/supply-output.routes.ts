import express from "express"
import {
  getAllSupplyOutputs,
  getSupplyOutputById,
  createSupplyOutput,
  updateSupplyOutput,
  deleteSupplyOutput,
  generatePlannedOutputs,
  getPlannedVsActual,
  updatePlannedOutput,
  createSupplyOutputRequest,
  getSupplyOutputRequests,
  getInventorySummary,
  approveSupplyOutputRequest,
  rejectSupplyOutputRequest,
} from "../controllers/supply-output.controller"
import { protect, authorize } from "../middleware/auth.middleware"

const router = express.Router()

// Protected routes
router.use(protect)

// Routes for all authenticated users
router.get("/", getAllSupplyOutputs)
router.get("/planned-vs-actual", getPlannedVsActual)

// Routes for unit assistants (for output requests) - MUST be before /:id route
router.post("/request", authorize("unitAssistant"), createSupplyOutputRequest)
router.get("/requests", authorize("unitAssistant", "brigadeAssistant", "admin"), getSupplyOutputRequests)

// Routes for brigade assistant (for planned outputs and request management) - MUST be before /:id route
router.get("/inventory-summary", authorize("brigadeAssistant"), getInventorySummary)

// Route with parameter - MUST be after specific routes
router.get("/:id", getSupplyOutputById)
router.post("/generate-planned", authorize("brigadeAssistant"), generatePlannedOutputs)
router.patch("/planned/:id", authorize("brigadeAssistant"), updatePlannedOutput)
router.patch("/requests/:id/approve", authorize("brigadeAssistant"), approveSupplyOutputRequest)
router.patch("/requests/:id/reject", authorize("brigadeAssistant"), rejectSupplyOutputRequest)

// Routes for admin/station manager (for actual outputs)
router.post("/", authorize("admin", "stationManager"), createSupplyOutput)
router.patch("/:id", authorize("admin", "stationManager"), updateSupplyOutput)
router.delete("/:id", authorize("admin", "stationManager"), deleteSupplyOutput)

export default router
