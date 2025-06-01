import express from "express"
import {
  getSupplies,
  createSupply,
  getSupplyById,
  updateSupply,
  deleteSupply,
  approveSupply,
  rejectSupply,
  getFoodCategories,
  getFoodProducts,
} from "../controllers/supply.controller"
import { protect, authorize } from "../middleware/auth.middleware"

const router = express.Router()

// All routes are protected
router.use(protect)

// Routes for all authenticated users
router.get("/", getSupplies)
router.get("/categories", getFoodCategories)
router.get("/products/:categoryId", getFoodProducts)
router.get("/:id", getSupplyById)

// Routes for unit assistants and admin
router.post("/", authorize("unitAssistant", "admin"), createSupply)
router.patch("/:id", updateSupply) // Permission check inside controller

// Routes for brigade assistants and admin
router.patch("/:id/approve", authorize("brigadeAssistant", "admin"), approveSupply)
router.patch("/:id/reject", authorize("brigadeAssistant", "admin"), rejectSupply)

// Routes for unit assistants and admin
router.delete("/:id", deleteSupply) // Permission check inside controller

export default router
