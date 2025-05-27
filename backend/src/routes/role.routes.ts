import express from "express"
import { getRoles, getUsersByRole, updateUserRole } from "../controllers/role.controller"
import { protect, authorize } from "../middleware/auth.middleware"

const router = express.Router()

// All routes are protected and admin-only
router.use(protect, authorize("admin"))

router.get("/", getRoles)
router.get("/:roleId/users", getUsersByRole)
router.patch("/users/:id", updateUserRole)

export default router
