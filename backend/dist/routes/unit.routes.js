"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const unit_controller_1 = require("../controllers/unit.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
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
router.get("/", unit_controller_1.getUnits);
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
router.get("/:id", unit_controller_1.getUnitById);
// Protected routes (require authentication)
router.use(auth_middleware_1.protect);
// Update unit personnel only (allows unit assistant for own unit) - Must be before other /:id routes
router.patch("/:id/personnel", unit_controller_1.updateUnitPersonnel);
// Total personnel routes - Must be before /:id routes to avoid conflicts
router.patch("/total-personnel", unit_controller_1.updateTotalPersonnel);
router.get("/total-personnel/:date", unit_controller_1.getTotalPersonnel);
// Daily dining routes - Must be before /:id routes to avoid conflicts
router.patch("/daily-dining", unit_controller_1.updateDailyDining);
router.get("/daily-dining/:date", unit_controller_1.getDailyDining);
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
router.post("/", (0, auth_middleware_1.authorize)("admin", "brigadeAssistant", "stationManager"), unit_controller_1.createUnit);
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
router.patch("/:id", (0, auth_middleware_1.authorize)("admin", "brigadeAssistant", "stationManager"), unit_controller_1.updateUnit);
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
router.delete("/:id", (0, auth_middleware_1.authorize)("admin"), unit_controller_1.deleteUnit);
exports.default = router;
