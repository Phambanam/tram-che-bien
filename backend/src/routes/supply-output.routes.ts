import express from "express"
import {
  getAllSupplyOutputs,
  getSupplyOutputById,
  createSupplyOutput,
  updateSupplyOutput,
  deleteSupplyOutput,
} from "../controllers/supply-output.controller"
import { protect, authorize } from "../middleware/auth.middleware"

const router = express.Router()

// Protected routes
router.use(protect)

// Routes for all authenticated users
router.get("/", getAllSupplyOutputs)
router.get("/:id", getSupplyOutputById)

// Routes for admin only
router.post("/", authorize("admin"), createSupplyOutput)
router.patch("/:id", authorize("admin"), updateSupplyOutput)
router.delete("/:id", authorize("admin"), deleteSupplyOutput)

export default router
