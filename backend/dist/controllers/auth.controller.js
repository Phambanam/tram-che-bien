"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = void 0;
const mongodb_1 = require("mongodb");
const database_1 = require("../config/database");
const auth_utils_1 = require("../utils/auth.utils");
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const { fullName, phoneNumber, password, rank, position, unit, role } = req.body;
        // Validate input
        if (!fullName || !phoneNumber || !password || !rank || !position || !unit || !role) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng điền đầy đủ thông tin"
            });
        }
        // Validate phone number format (Vietnam phone number)
        const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
        if (!phoneRegex.test(phoneNumber)) {
            return res.status(400).json({
                success: false,
                message: "Số điện thoại không hợp lệ"
            });
        }
        const db = await (0, database_1.getDb)();
        // Check if phone number already exists
        const existingUser = await db.collection("users").findOne({ phoneNumber });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Số điện thoại đã được đăng ký"
            });
        }
        // Validate unit exists
        if (!mongodb_1.ObjectId.isValid(unit)) {
            return res.status(400).json({
                success: false,
                message: "Đơn vị không hợp lệ"
            });
        }
        const unitExists = await db.collection("units").findOne({ _id: new mongodb_1.ObjectId(unit) });
        if (!unitExists) {
            return res.status(400).json({
                success: false,
                message: "Đơn vị không tồn tại"
            });
        }
        // Hash password
        const hashedPassword = await (0, auth_utils_1.hashPassword)(password);
        // Create new user
        const result = await db.collection("users").insertOne({
            phoneNumber,
            password: hashedPassword,
            fullName,
            rank,
            position,
            unit: new mongodb_1.ObjectId(unit),
            role,
            status: "pending", // New users are pending until approved by admin
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        res.status(201).json({
            success: true,
            message: "Đăng ký thành công, vui lòng chờ phê duyệt",
            userId: result.insertedId.toString(),
        });
    }
    catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi đăng ký"
        });
    }
};
exports.register = register;
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { phoneNumber, password } = req.body;
        console.log(req.body);
        console.log(phoneNumber, password);
        // Validate input
        if (!phoneNumber || !password) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập số điện thoại và mật khẩu"
            });
        }
        // Validate phone number format
        const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
        if (!phoneRegex.test(phoneNumber)) {
            return res.status(400).json({
                success: false,
                message: "Số điện thoại không hợp lệ"
            });
        }
        const db = await (0, database_1.getDb)();
        // Find user by phone number
        const user = await db.collection("users").findOne({ phoneNumber });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Số điện thoại hoặc mật khẩu không chính xác"
            });
        }
        // Check if user is active
        if (user.status !== "active") {
            return res.status(401).json({
                success: false,
                message: "Tài khoản chưa được kích hoạt"
            });
        }
        // Verify password
        const isPasswordValid = await (0, auth_utils_1.comparePassword)(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Số điện thoại hoặc mật khẩu không chính xác"
            });
        }
        // Generate token
        const token = (0, auth_utils_1.generateToken)(user._id.toString());
        // Get unit info
        const unitInfo = await db.collection("units").findOne({ _id: user.unit });
        const userData = {
            id: user._id.toString(),
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            role: user.role,
            unit: {
                id: user.unit.toString(),
                name: unitInfo ? unitInfo.name : "Unknown",
            },
        };
        res.status(200).json({
            success: true,
            message: "Đăng nhập thành công",
            data: {
                token,
                user: userData
            }
        });
    }
    catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi đăng nhập"
        });
    }
};
exports.login = login;
// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }
        const db = await (0, database_1.getDb)();
        // Get user data
        const user = await db.collection("users").findOne({ _id: new mongodb_1.ObjectId(userId) });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        // Get unit data if user has a unit
        let unitData = null;
        if (user.unit) {
            unitData = await db.collection("units").findOne({ _id: new mongodb_1.ObjectId(user.unit) });
        }
        // Debug logging
        console.log("User role from database:", user.role);
        console.log("User data:", {
            id: user._id.toString(),
            username: user.username,
            role: user.role,
            unit: user.unit
        });
        const userData = {
            _id: user._id.toString(),
            phoneNumber: user.phoneNumber,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            unit: unitData ? {
                _id: unitData._id.toString(),
                name: unitData.name,
                code: unitData.code
            } : null,
            status: user.status,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
        res.status(200).json({
            success: true,
            data: userData,
        });
    }
    catch (error) {
        console.error("Get profile error:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi lấy thông tin người dùng"
        });
    }
};
exports.getMe = getMe;
