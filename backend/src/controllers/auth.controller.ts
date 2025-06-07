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
      throw new AppError("Vui lòng điền đầy đủ thông tin", 400)
    }

    // Validate phone number format (Vietnam phone number)
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/
    if (!phoneRegex.test(phoneNumber)) {
      throw new AppError("Số điện thoại không hợp lệ", 400)
    }

    const db = await getDb()

    // Check if phone number already exists
    const existingUser = await db.collection("users").findOne({ phoneNumber })
    if (existingUser) {
      throw new AppError("Số điện thoại đã được đăng ký", 400)
    }

    // Validate unit exists
    if (!ObjectId.isValid(unit)) {
      throw new AppError("Đơn vị không hợp lệ", 400)
    }

    const unitExists = await db.collection("units").findOne({ _id: new ObjectId(unit) })
    if (!unitExists) {
      throw new AppError("Đơn vị không tồn tại", 400)
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
    if (error instanceof AppError) {
      throw error
    }
    console.error("Registration error:", error)
    throw new AppError("Đã xảy ra lỗi khi đăng ký", 500)
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
      throw new AppError("Vui lòng nhập số điện thoại và mật khẩu", 400)
    }

    // Validate phone number format
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/
    if (!phoneRegex.test(phoneNumber)) {
      throw new AppError("Số điện thoại không hợp lệ", 400)
    }

    const db = await getDb()

    // Find user by phone number
    const user = await db.collection("users").findOne({ phoneNumber })

    if (!user) {
      throw new AppError("Số điện thoại hoặc mật khẩu không chính xác", 401)
    }

    // Check if user is active
    if (user.status !== "active") {
      throw new AppError("Tài khoản chưa được kích hoạt hoặc đã bị khóa", 401)
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password)

    if (!isPasswordValid) {
      throw new AppError("Số điện thoại hoặc mật khẩu không chính xác", 401)
    }

    // Generate token
    const token = generateToken(user._id.toString())

    // Get unit info
    const unitInfo = await db.collection("units").findOne({ _id: user.unit })

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        role: user.role,
        unit: {
          id: user.unit.toString(),
          name: unitInfo ? unitInfo.name : "Unknown",
        },
      },
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Login error:", error)
    throw new AppError("Đã xảy ra lỗi khi đăng nhập", 500)
  }
}

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      throw new AppError("User not authenticated", 401)
    }

    const db = await getDb()

    // Get user data
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })

    if (!user) {
      throw new AppError("User not found", 404)
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
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error fetching user profile:", error)
    throw new AppError("Đã xảy ra lỗi khi lấy thông tin người dùng", 500)
  }
}
