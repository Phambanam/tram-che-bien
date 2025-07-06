"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNotificationPreferences = exports.getNotificationPreferences = exports.sendNotification = exports.createNotification = exports.markAllNotificationsAsRead = exports.markAsRead = exports.getUserNotifications = void 0;
const mongodb_1 = require("mongodb");
const database_1 = require("../config/database");
// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getUserNotifications = async (req, res) => {
    try {
        const { limit = 20, offset = 0, read } = req.query;
        const db = await (0, database_1.getDb)();
        // Build query filters
        const query = {
            recipient: new mongodb_1.ObjectId(req.user.id),
        };
        if (read !== undefined) {
            query.read = read === "true";
        }
        // Get user notifications with pagination
        const notifications = await db
            .collection("notifications")
            .find(query)
            .sort({ createdAt: -1 })
            .skip(Number(offset))
            .limit(Number(limit))
            .toArray();
        // Transform data for response
        const transformedNotifications = notifications.map((notification) => ({
            _id: notification._id.toString(),
            type: notification.type,
            title: notification.title,
            message: notification.message,
            read: notification.read,
            data: notification.data,
            createdAt: notification.createdAt,
        }));
        // Get total count
        const totalCount = await db.collection("notifications").countDocuments(query);
        // Get unread count
        const unreadCount = await db.collection("notifications").countDocuments({
            recipient: new mongodb_1.ObjectId(req.user.id),
            read: false,
        });
        res.status(200).json({
            success: true,
            count: transformedNotifications.length,
            totalCount,
            unreadCount,
            data: transformedNotifications,
        });
    }
    catch (error) {
        console.error("Error fetching user notifications:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi lấy thông báo người dùng"
        });
    }
};
exports.getUserNotifications = getUserNotifications;
// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user.userId;
        // Validate ObjectId
        if (!mongodb_1.ObjectId.isValid(notificationId)) {
            return res.status(400).json({
                success: false,
                message: "ID thông báo không hợp lệ"
            });
        }
        const db = await (0, database_1.getDb)();
        // Check if notification exists and belongs to user
        const notification = await db.collection("notifications").findOne({ _id: new mongodb_1.ObjectId(notificationId) });
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thông báo"
            });
        }
        if (notification.recipientId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền truy cập thông báo này"
            });
        }
        // Update notification status
        const result = await db.collection("notifications").updateOne({ _id: new mongodb_1.ObjectId(notificationId) }, { $set: { isRead: true, readAt: new Date() } });
        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thông báo"
            });
        }
        res.status(200).json({
            success: true,
            message: "Đánh dấu thông báo đã đọc thành công",
        });
    }
    catch (error) {
        console.error("Error marking notification as read:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi đánh dấu thông báo đã đọc"
        });
    }
};
exports.markAsRead = markAsRead;
// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/mark-all-read
// @access  Private
const markAllNotificationsAsRead = async (req, res) => {
    try {
        const db = await (0, database_1.getDb)();
        // Mark all unread notifications as read
        const result = await db
            .collection("notifications")
            .updateMany({ recipient: new mongodb_1.ObjectId(req.user.id), read: false }, { $set: { read: true, updatedAt: new Date() } });
        res.status(200).json({
            success: true,
            message: "Đánh dấu tất cả thông báo đã đọc thành công",
            count: result.modifiedCount,
        });
    }
    catch (error) {
        console.error("Error marking all notifications as read:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi đánh dấu tất cả thông báo đã đọc"
        });
    }
};
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
// @desc    Create a notification (internal function)
// @access  Internal
const createNotification = async (db, recipientId, type, title, message, data = {}) => {
    try {
        // Validate recipient ID
        if (!mongodb_1.ObjectId.isValid(recipientId)) {
            console.error("Invalid recipient ID for notification", recipientId);
            return null;
        }
        // Create notification
        const notificationData = {
            recipient: new mongodb_1.ObjectId(recipientId),
            type,
            title,
            message,
            data,
            read: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const result = await db.collection("notifications").insertOne(notificationData);
        return result.insertedId;
    }
    catch (error) {
        console.error("Error creating notification:", error);
        return null;
    }
};
exports.createNotification = createNotification;
// @desc    Send a notification to a user
// @route   POST /api/notifications/send
// @access  Private (Admin, Brigade Assistant)
const sendNotification = async (req, res) => {
    try {
        const { recipientId, type, title, message, data } = req.body;
        // Validate input
        if (!recipientId || !title || !message) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng điền đầy đủ thông tin người nhận, tiêu đề và nội dung thông báo"
            });
        }
        // Validate recipient ID
        if (!mongodb_1.ObjectId.isValid(recipientId)) {
            return res.status(400).json({
                success: false,
                message: "ID người nhận không hợp lệ"
            });
        }
        const db = await (0, database_1.getDb)();
        // Check if recipient exists
        const recipient = await db.collection("users").findOne({ _id: new mongodb_1.ObjectId(recipientId) });
        if (!recipient) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng nhận thông báo"
            });
        }
        // Create notification
        const notificationId = await (0, exports.createNotification)(db, recipientId, type || "manual", title, message, data || {});
        if (!notificationId) {
            return res.status(500).json({
                success: false,
                message: "Đã xảy ra lỗi khi tạo thông báo"
            });
        }
        res.status(201).json({
            success: true,
            message: "Gửi thông báo thành công",
            notificationId: notificationId.toString(),
        });
    }
    catch (error) {
        console.error("Error sending notification:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi gửi thông báo"
        });
    }
};
exports.sendNotification = sendNotification;
// @desc    Get notification preferences
// @route   GET /api/notifications/preferences
// @access  Private
const getNotificationPreferences = async (req, res) => {
    try {
        const db = await (0, database_1.getDb)();
        // Get user notification preferences
        const preferences = await db.collection("notificationPreferences").findOne({
            userId: new mongodb_1.ObjectId(req.user.id),
        });
        // Return default preferences if none exist
        if (!preferences) {
            return res.status(200).json({
                success: true,
                data: {
                    email: true,
                    browser: true,
                    supplyApproved: true,
                    supplyRejected: true,
                    newSupplyAdded: true,
                    userApproved: true,
                    systemUpdates: true,
                },
            });
        }
        // Transform data for response
        const transformedPreferences = {
            ...preferences,
            _id: preferences._id.toString(),
            userId: preferences.userId.toString(),
        };
        res.status(200).json({
            success: true,
            data: transformedPreferences,
        });
    }
    catch (error) {
        console.error("Error fetching notification preferences:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi lấy tùy chọn thông báo"
        });
    }
};
exports.getNotificationPreferences = getNotificationPreferences;
// @desc    Update notification preferences
// @route   PUT /api/notifications/preferences
// @access  Private
const updateNotificationPreferences = async (req, res) => {
    try {
        const { email, browser, supplyApproved, supplyRejected, newSupplyAdded, userApproved, systemUpdates } = req.body;
        const db = await (0, database_1.getDb)();
        // Update fields only if they are provided
        const updateData = { updatedAt: new Date() };
        if (email !== undefined)
            updateData.email = Boolean(email);
        if (browser !== undefined)
            updateData.browser = Boolean(browser);
        if (supplyApproved !== undefined)
            updateData.supplyApproved = Boolean(supplyApproved);
        if (supplyRejected !== undefined)
            updateData.supplyRejected = Boolean(supplyRejected);
        if (newSupplyAdded !== undefined)
            updateData.newSupplyAdded = Boolean(newSupplyAdded);
        if (userApproved !== undefined)
            updateData.userApproved = Boolean(userApproved);
        if (systemUpdates !== undefined)
            updateData.systemUpdates = Boolean(systemUpdates);
        // Use upsert to create preferences if they don't exist
        const result = await db
            .collection("notificationPreferences")
            .updateOne({ userId: new mongodb_1.ObjectId(req.user.id) }, { $set: updateData }, { upsert: true });
        res.status(200).json({
            success: true,
            message: "Cập nhật tùy chọn thông báo thành công",
            updated: result.modifiedCount > 0,
            created: result.upsertedCount > 0,
        });
    }
    catch (error) {
        console.error("Error updating notification preferences:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi cập nhật tùy chọn thông báo"
        });
    }
};
exports.updateNotificationPreferences = updateNotificationPreferences;
// Export for use in other controllers
