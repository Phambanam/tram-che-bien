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
router.get("/:id", getSupplyOutputById)

// Routes for unit assistants (for output requests)
router.post("/request", authorize("unitAssistant"), createSupplyOutputRequest)

// Routes for brigade assistant (for planned outputs and request management)
router.get("/inventory-summary", authorize("brigadeAssistant"), getInventorySummary)
router.post("/generate-planned", authorize("brigadeAssistant"), generatePlannedOutputs)
router.patch("/planned/:id", authorize("brigadeAssistant"), updatePlannedOutput)
router.patch("/requests/:id/approve", authorize("brigadeAssistant"), approveSupplyOutputRequest)
router.patch("/requests/:id/reject", authorize("brigadeAssistant"), rejectSupplyOutputRequest)

// Routes for admin/station manager (for actual outputs)
router.post("/", authorize("admin", "stationManager"), createSupplyOutput)
router.patch("/:id", authorize("admin", "stationManager"), updateSupplyOutput)
router.delete("/:id", authorize("admin", "stationManager"), deleteSupplyOutput)

export default router
