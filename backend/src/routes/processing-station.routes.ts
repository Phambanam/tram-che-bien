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

// Routes for admin only
router.post("/", authorize("admin"), createProcessingStationItem)
router.patch("/:id", authorize("admin"), updateProcessingStationItem)
router.delete("/:id", authorize("admin"), deleteProcessingStationItem)
router.post("/update-expiry", authorize("admin"), updateExpiryStatus)

export default router
