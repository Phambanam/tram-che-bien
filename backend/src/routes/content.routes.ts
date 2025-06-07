import express from "express"
import {
  getAllContent,
  getContentById,
  createContent,
  updateContent,
  deleteContent,
} from "../controllers/content.controller"
import { protect, authorize } from "../middleware/auth.middleware"

const router = express.Router()

/**
 * @swagger
 * /api/content:
 *   get:
 *     summary: Get all content
 *     tags: [Content]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Content type filter (article, image, video)
 *     responses:
 *       200:
 *         description: List of content items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Content'
 */
router.get("/", getAllContent)

/**
 * @swagger
 * /api/content/{id}:
 *   get:
 *     summary: Get content by ID
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Content ID
 *     responses:
 *       200:
 *         description: Content details
 *       404:
 *         description: Content not found
 */
router.get("/:id", getContentById)

// Protected routes
router.use(protect)

/**
 * @swagger
 * /api/content:
 *   post:
 *     summary: Create new content
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, type]
 *             properties:
 *               title:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [article, image, video]
 *               content:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               videoUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Content created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post("/", authorize("admin", "brigadeAssistant"), createContent)

/**
 * @swagger
 * /api/content/{id}:
 *   patch:
 *     summary: Update content
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               type:
 *                 type: string
 *               content:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               videoUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Content updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Content not found
 */
router.patch("/:id", authorize("admin", "brigadeAssistant"), updateContent)

/**
 * @swagger
 * /api/content/{id}:
 *   delete:
 *     summary: Delete content
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Content not found
 */
router.delete("/:id", authorize("admin", "brigadeAssistant"), deleteContent)

/**
 * @swagger
 * components:
 *   schemas:
 *     Content:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Content ID
 *         title:
 *           type: string
 *           description: Content title
 *         type:
 *           type: string
 *           enum: [article, image, video]
 *           description: Content type
 *         content:
 *           type: string
 *           description: Article text content
 *         imageUrl:
 *           type: string
 *           description: URL to image
 *         videoUrl:
 *           type: string
 *           description: URL to video
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation date
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update date
 */

export default router
