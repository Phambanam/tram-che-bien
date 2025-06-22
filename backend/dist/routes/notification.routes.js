"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notification_controller_1 = require("../controllers/notification.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// All routes are protected
router.use(auth_middleware_1.protect);
// Routes for all authenticated users
router.get("/", notification_controller_1.getUserNotifications);
router.patch("/:id/read", notification_controller_1.markAsRead);
router.patch("/mark-all-read", notification_controller_1.markAllNotificationsAsRead);
router.get("/preferences", notification_controller_1.getNotificationPreferences);
router.patch("/preferences", notification_controller_1.updateNotificationPreferences);
// Routes for admin and brigade assistant
router.post("/send", (0, auth_middleware_1.authorize)("admin", "brigadeAssistant"), notification_controller_1.sendNotification);
exports.default = router;
