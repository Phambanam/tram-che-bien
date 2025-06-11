import type { Request, Response } from "express"
import { ObjectId } from "mongodb"
import { getDb } from "../config/database"
import { hashPassword, comparePassword, generateToken } from "../utils/auth.utils"
import { AppError } from "../middleware/error.middleware"

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response) => {
  try {
    const { fullName, phoneNumber, password, rank, position, unit, role } = req.body

    // Validate input
    if (!fullName || !phoneNumber || !password || !rank || !position || !unit || !role) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin"
      })
    }

    // Validate phone number format (Vietnam phone number)
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại không hợp lệ"
      })
    }

    const db = await getDb()

    // Check if phone number already exists
    const existingUser = await db.collection("users").findOne({ phoneNumber })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại đã được đăng ký"
      })
    }

    // Validate unit exists
    if (!ObjectId.isValid(unit)) {
      return res.status(400).json({
        success: false,
        message: "Đơn vị không hợp lệ"
      })
    }

    const unitExists = await db.collection("units").findOne({ _id: new ObjectId(unit) })
    if (!unitExists) {
      return res.status(400).json({
        success: false,
        message: "Đơn vị không tồn tại"
      })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create new user
    const result = await db.collection("users").insertOne({
      phoneNumber,
      password: hashedPassword,
      fullName,
      rank,
      position,
      unit: new ObjectId(unit),
      role,
      status: "pending", // New users are pending until approved by admin
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công, vui lòng chờ phê duyệt",
      userId: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("Registration error:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi đăng ký"
    })
  }
}

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response) => {
  try {
    const { phoneNumber, password } = req.body
    console.log(req.body)
    console.log(phoneNumber, password)
    // Validate input
    if (!phoneNumber || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập số điện thoại và mật khẩu"
      })
    }

    // Validate phone number format
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại không hợp lệ"
      })
    }

    const db = await getDb()

    // Find user by phone number
    const user = await db.collection("users").findOne({ phoneNumber })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Số điện thoại hoặc mật khẩu không chính xác"
      })
    }

    // Check if user is active
    if (user.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Tài khoản chưa được kích hoạt"
      })
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Số điện thoại hoặc mật khẩu không chính xác"
      })
    }

    // Generate token
    const token = generateToken(user._id.toString())

    // Get unit info
    const unitInfo = await db.collection("units").findOne({ _id: user.unit })

    const userData = {
      id: user._id.toString(),
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      role: user.role,
      unit: {
        id: user.unit.toString(),
        name: unitInfo ? unitInfo.name : "Unknown",
      },
    }

    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      data: {
        token,
        user: userData
      }
    })
  } catch (error) {
    console.error("Login error:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi đăng nhập"
    })
  }
}

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      })
    }

    const db = await getDb()

    // Get user data
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      })
    }

    // Get unit data if user has a unit
    let unitData = null
    if (user.unit) {
      unitData = await db.collection("units").findOne({ _id: new ObjectId(user.unit) })
    }

    // Debug logging
    console.log("User role from database:", user.role)
    console.log("User data:", {
      id: user._id.toString(),
      username: user.username,
      role: user.role,
      unit: user.unit
    })

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
    }

    res.status(200).json({
      success: true,
      data: userData,
    })
  } catch (error) {
    console.error("Get profile error:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy thông tin người dùng"
    })
  }
}
