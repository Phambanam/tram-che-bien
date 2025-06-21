import express from "express"
import {
  getProcessingStationItems,
  getProcessingStationItemById,
  createProcessingStationItem,
  updateProcessingStationItem,
  deleteProcessingStationItem,
  getFoodInventory,
  updateExpiryStatus,
} from "../controllers/processing-station.controller"
import { protect, authorize } from "../middleware/auth.middleware"

const router = express.Router()

// Protected routes
router.use(protect)

// Routes for all authenticated users
router.get("/", getProcessingStationItems)
router.get("/food-inventory", getFoodInventory)
router.get("/:id", getProcessingStationItemById)

// Routes for admin and station manager
router.post("/", authorize("admin", "stationManager"), createProcessingStationItem)
router.patch("/:id", authorize("admin", "stationManager"), updateProcessingStationItem)
router.delete("/:id", authorize("admin"), deleteProcessingStationItem) // Only admin can delete
router.post("/update-expiry", authorize("admin"), updateExpiryStatus) // Only admin can update expiry

export default router
