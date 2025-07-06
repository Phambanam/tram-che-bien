"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserRole = exports.getUsersByRole = exports.getRoles = void 0;
const mongodb_1 = require("mongodb");
const database_1 = require("../config/database");
const notification_controller_1 = require("./notification.controller");
// @desc    Get all roles
// @route   GET /api/roles
// @access  Private (Admin)
const getRoles = async (req, res) => {
    try {
        const db = await (0, database_1.getDb)();
        // Define available roles and their permissions
        const roles = [
            {
                id: "admin",
                name: "Quản trị viên",
                permissions: [
                    "manage_users",
                    "manage_units",
                    "manage_categories",
                    "manage_products",
                    "manage_supplies",
                    "view_reports",
                    "send_notifications",
                    "approve_supplies",
                    "delete_any_supply",
                ],
                description: "Quyền cao nhất trong hệ thống, có thể truy cập và quản lý mọi tính năng.",
            },
            {
                id: "brigadeAssistant",
                name: "Trợ lý Lữ đoàn",
                permissions: ["manage_categories", "manage_products", "view_reports", "send_notifications", "approve_supplies"],
                description: "Có thể phê duyệt nguồn nhập, quản lý danh mục và sản phẩm, xem báo cáo.",
            },
            {
                id: "unitAssistant",
                name: "Trợ lý Đơn vị",
                permissions: ["create_supplies", "edit_own_supplies", "delete_own_supplies", "view_own_supplies"],
                description: "Có thể tạo và quản lý nguồn nhập của đơn vị mình.",
            },
            {
                id: "commander",
                name: "Chỉ huy",
                permissions: ["view_reports", "view_statistics", "view_supplies"],
                description: "Có thể xem báo cáo, thống kê và nguồn nhập.",
            },
            {
                id: "stationManager",
                name: "Trạm trưởng trạm chế biến",
                permissions: ["manage_categories", "manage_products", "view_reports", "send_notifications", "approve_supplies"],
                description: "Có thể phê duyệt nguồn nhập, quản lý danh mục và sản phẩm, xem báo cáo. Không được chỉnh sửa thực đơn.",
            },
        ];
        // Get users count for each role
        const userCounts = await Promise.all(roles.map(async (role) => {
            const count = await db.collection("users").countDocuments({ role: role.id });
            return {
                roleId: role.id,
                count,
            };
        }));
        // Combine roles with user counts
        const rolesWithCounts = roles.map((role) => {
            const countInfo = userCounts.find((count) => count.roleId === role.id);
            return {
                ...role,
                userCount: countInfo ? countInfo.count : 0,
            };
        });
        res.status(200).json({
            success: true,
            count: roles.length,
            data: rolesWithCounts,
        });
    }
    catch (error) {
        console.error("Error fetching roles:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi lấy danh sách vai trò"
        });
    }
};
exports.getRoles = getRoles;
// @desc    Get users by role
// @route   GET /api/roles/:roleId/users
// @access  Private (Admin)
const getUsersByRole = async (req, res) => {
    try {
        const { roleId } = req.params;
        // Validate role ID
        const validRoles = ["admin", "brigadeAssistant", "unitAssistant", "commander", "stationManager"];
        if (!validRoles.includes(roleId)) {
            return res.status(400).json({
                success: false,
                message: "Vai trò không hợp lệ"
            });
        }
        const db = await (0, database_1.getDb)();
        // Get users with this role
        const users = await db.collection("users").find({ role: roleId }).sort({ fullName: 1 }).toArray();
        // Transform data for response
        const transformedUsers = users.map((user) => ({
            _id: user._id.toString(),
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            unit: user.unit ? user.unit.toString() : null,
            status: user.status,
            createdAt: user.createdAt,
        }));
        res.status(200).json({
            success: true,
            count: transformedUsers.length,
            data: transformedUsers,
        });
    }
    catch (error) {
        console.error("Error fetching users by role:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi lấy danh sách người dùng theo vai trò"
        });
    }
};
exports.getUsersByRole = getUsersByRole;
// @desc    Update user role
// @route   PATCH /api/roles/users/:id
// @access  Private (Admin)
const updateUserRole = async (req, res) => {
    try {
        const userId = req.params.id;
        const { role, unit } = req.body;
        // Validate user ID
        if (!mongodb_1.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "ID người dùng không hợp lệ"
            });
        }
        // Validate role
        const validRoles = ["admin", "brigadeAssistant", "unitAssistant", "commander", "stationManager"];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Vai trò không hợp lệ"
            });
        }
        const db = await (0, database_1.getDb)();
        // Get current user data
        const currentUser = await db.collection("users").findOne({ _id: new mongodb_1.ObjectId(userId) });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng"
            });
        }
        // Validate unit for unit assistant
        let unitId = null;
        if (role === "unitAssistant") {
            if (!unit || !mongodb_1.ObjectId.isValid(unit)) {
                return res.status(400).json({
                    success: false,
                    message: "Vui lòng chọn đơn vị cho trợ lý đơn vị"
                });
            }
            // Check if unit exists
            const unitExists = await db.collection("units").findOne({ _id: new mongodb_1.ObjectId(unit) });
            if (!unitExists) {
                return res.status(400).json({
                    success: false,
                    message: "Đơn vị không tồn tại"
                });
            }
            unitId = new mongodb_1.ObjectId(unit);
        }
        // Update user role
        const updateData = {
            role,
            updatedAt: new Date(),
        };
        // Set unit if provided or clear it if not needed for this role
        if (unitId) {
            updateData.unit = unitId;
        }
        else if (role !== "unitAssistant" && currentUser.unit) {
            updateData.$unset = { unit: "" };
        }
        await db.collection("users").updateOne({ _id: new mongodb_1.ObjectId(userId) }, { $set: updateData });
        // Add notification for the user
        await (0, notification_controller_1.createNotification)(db, userId, "role_changed", "Vai trò của bạn đã được thay đổi", `Vai trò của bạn đã được cập nhật thành ${getVietnameseRoleName(role)}. Đăng nhập lại để truy cập các tính năng mới.`, { newRole: role });
        res.status(200).json({
            success: true,
            message: "Cập nhật vai trò người dùng thành công",
        });
    }
    catch (error) {
        console.error("Error updating user role:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi cập nhật vai trò người dùng"
        });
    }
};
exports.updateUserRole = updateUserRole;
// Helper function to get Vietnamese role name
function getVietnameseRoleName(role) {
    switch (role) {
        case "admin":
            return "Quản trị viên";
        case "brigadeAssistant":
            return "Trợ lý Lữ đoàn";
        case "unitAssistant":
            return "Trợ lý Đơn vị";
        case "commander":
            return "Chỉ huy";
        case "stationManager":
            return "Trạm trưởng trạm chế biến";
        default:
            return role;
    }
}
