"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getUserById = exports.getUsers = void 0;
const mongodb_1 = require("mongodb");
const database_1 = require("../config/database");
// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin, Brigade Assistant)
const getUsers = async (req, res) => {
    try {
        const db = await (0, database_1.getDb)();
        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Get total count for pagination
        const totalCount = await db.collection("users").countDocuments();
        // Get paginated users with unit information
        const users = await db
            .collection("users")
            .aggregate([
            {
                $lookup: {
                    from: "units",
                    localField: "unit",
                    foreignField: "_id",
                    as: "unitInfo",
                },
            },
            {
                $unwind: "$unitInfo",
            },
            {
                $project: {
                    password: 0, // Exclude password
                },
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            }
        ])
            .toArray();
        // Transform data for response
        const transformedUsers = users.map((user) => ({
            id: user._id.toString(),
            fullName: user.fullName,
            username: user.username,
            rank: user.rank,
            position: user.position,
            unit: {
                _id: user.unit.toString(),
                name: user.unitInfo.name,
            },
            role: user.role,
            status: user.status,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }));
        res.status(200).json({
            success: true,
            count: transformedUsers.length,
            totalCount: totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
            data: transformedUsers,
        });
    }
    catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi lấy danh sách người dùng"
        });
    }
};
exports.getUsers = getUsers;
// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Admin, Brigade Assistant)
const getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        // Validate ObjectId
        if (!mongodb_1.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "ID người dùng không hợp lệ"
            });
        }
        const db = await (0, database_1.getDb)();
        // Get user with unit information
        const user = await db
            .collection("users")
            .aggregate([
            {
                $match: { _id: new mongodb_1.ObjectId(userId) },
            },
            {
                $lookup: {
                    from: "units",
                    localField: "unit",
                    foreignField: "_id",
                    as: "unitInfo",
                },
            },
            {
                $unwind: "$unitInfo",
            },
            {
                $project: {
                    password: 0, // Exclude password
                },
            },
        ])
            .toArray();
        if (!user || user.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng"
            });
        }
        // Transform data for response
        const transformedUser = {
            id: user[0]._id.toString(),
            fullName: user[0].fullName,
            username: user[0].username,
            rank: user[0].rank,
            position: user[0].position,
            unit: {
                _id: user[0].unit.toString(),
                name: user[0].unitInfo.name,
            },
            role: user[0].role,
            status: user[0].status,
            createdAt: user[0].createdAt,
            updatedAt: user[0].updatedAt,
        };
        res.status(200).json({
            success: true,
            data: transformedUser,
        });
    }
    catch (error) {
        console.error("Error fetching user:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi lấy thông tin người dùng"
        });
    }
};
exports.getUserById = getUserById;
// @desc    Update user
// @route   PATCH /api/users/:id
// @access  Private (Admin)
const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { status, role } = req.body;
        // Validate ObjectId
        if (!mongodb_1.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "ID người dùng không hợp lệ"
            });
        }
        const db = await (0, database_1.getDb)();
        const updateData = {
            updatedAt: new Date(),
        };
        if (status) {
            updateData.status = status;
        }
        if (role) {
            updateData.role = role;
        }
        const result = await db.collection("users").updateOne({ _id: new mongodb_1.ObjectId(userId) }, { $set: updateData });
        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng"
            });
        }
        res.status(200).json({
            success: true,
            message: "Cập nhật thông tin người dùng thành công",
        });
    }
    catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi cập nhật thông tin người dùng"
        });
    }
};
exports.updateUser = updateUser;
// @desc    Delete user (soft delete)
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        // Validate ObjectId
        if (!mongodb_1.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "ID người dùng không hợp lệ"
            });
        }
        const db = await (0, database_1.getDb)();
        // Soft delete by changing status
        const result = await db.collection("users").updateOne({ _id: new mongodb_1.ObjectId(userId) }, {
            $set: {
                status: "deleted",
                updatedAt: new Date(),
            },
        });
        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng"
            });
        }
        res.status(200).json({
            success: true,
            message: "Xóa người dùng thành công",
        });
    }
    catch (error) {
        console.error("Error deleting user:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi xóa người dùng"
        });
    }
};
exports.deleteUser = deleteUser;
