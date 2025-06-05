import express from "express"
import { 
  getUnits, 
  createUnit, 
  getUnitById, 
  updateUnit, 
  deleteUnit, 
  updateUnitPersonnel,
  updateTotalPersonnel,
  getTotalPersonnel,
  updateDailyDining,
  getDailyDining
} from "../controllers/unit.controller"
import { protect, authorize } from "../middleware/auth.middleware"

const router = express.Router()

/**
 * @swagger
 * /api/units:
 *   get:
 *     tags:
 *       - Units
 *     summary: Get all units
 *     description: Retrieve a list of all military units
 *     responses:
 *       200:
 *         description: List of units
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   location:
 *                     type: string
 *                   type:
 *                     type: string
 */
// Public routes (no authentication required)
router.get("/", getUnits)

/**
 * @swagger
 * /api/units/{id}:
 *   get:
 *     tags:
 *       - Units
 *     summary: Get unit by ID
 *     description: Retrieve a single unit by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unit ID
 *     responses:
 *       200:
 *         description: Unit details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 location:
 *                   type: string
 *                 type:
 *                   type: string
 *       404:
 *         description: Unit not found
 */
router.get("/:id", getUnitById)

// Protected routes (require authentication)
router.use(protect)

// Update unit personnel only (allows unit assistant for own unit) - Must be before other /:id routes
router.patch("/:id/personnel", updateUnitPersonnel)

// Total personnel routes - Must be before /:id routes to avoid conflicts
router.patch("/total-personnel", updateTotalPersonnel)
router.get("/total-personnel/:date", getTotalPersonnel)

// Daily dining routes - Must be before /:id routes to avoid conflicts
router.patch("/daily-dining", updateDailyDining)
router.get("/daily-dining/:date", getDailyDining)

/**
 * @swagger
 * /api/units:
 *   post:
 *     tags:
 *       - Units
 *     summary: Create new unit
 *     description: Create a new military unit (Admin and Brigade Assistant only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - location
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Unit created successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.post("/", authorize("admin", "brigadeAssistant"), createUnit)

/**
 * @swagger
 * /api/units/{id}:
 *   patch:
 *     tags:
 *       - Units
 *     summary: Update unit
 *     description: Update unit details (Admin and Brigade Assistant only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unit ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       200:
 *         description: Unit updated successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Unit not found
 */
router.patch("/:id", authorize("admin", "brigadeAssistant"), updateUnit)

/**
 * @swagger
 * /api/units/{id}:
 *   delete:
 *     tags:
 *       - Units
 *     summary: Delete unit
 *     description: Delete a unit (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unit ID
 *     responses:
 *       200:
 *         description: Unit deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Unit not found
 */
router.delete("/:id", authorize("admin"), deleteUnit)

export default router
