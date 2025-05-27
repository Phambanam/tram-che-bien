import express from "express"
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  sendNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
} from "../controllers/notification.controller"
import { protect, authorize } from "../middleware/auth.middleware"

const router = express.Router()

// All routes are protected
router.use(protect)

// Routes for all authenticated users
router.get("/", getUserNotifications)
router.patch("/:id/read", markNotificationAsRead)
router.patch("/mark-all-read", markAllNotificationsAsRead)
router.get("/preferences", getNotificationPreferences)
router.patch("/preferences", updateNotificationPreferences)

// Routes for admin and brigade assistant
router.post("/send", authorize("admin", "brigadeAssistant"), sendNotification)

export default router
