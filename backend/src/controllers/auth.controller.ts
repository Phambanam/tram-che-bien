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
    const { fullName, username, password, rank, position, unit, role } = req.body

    // Validate input
    if (!fullName || !username || !password || !rank || !position || !unit || !role) {
      throw new AppError("Vui lòng điền đầy đủ thông tin", 400)
    }

    const db = await getDb()

    // Check if username already exists
    const existingUser = await db.collection("users").findOne({ username })
    if (existingUser) {
      throw new AppError("Tên đăng nhập đã tồn tại", 400)
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
      username,
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
    const { username, password } = req.body
    console.log(username, password)
    // Validate input
    if (!username || !password) {
      throw new AppError("Vui lòng nhập tên đăng nhập và mật khẩu", 400)
    }

    const db = await getDb()

    // Find user
    const user = await db.collection("users").findOne({ username })

    if (!user) {
      throw new AppError("Tên đăng nhập hoặc mật khẩu không chính xác", 401)
    }

    // Check if user is active
    if (user.status !== "active") {
      throw new AppError("Tài khoản chưa được kích hoạt hoặc đã bị khóa", 401)
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password)

    if (!isPasswordValid) {
      throw new AppError("Tên đăng nhập hoặc mật khẩu không chính xác", 401)
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
        username: user.username,
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
    const db = await getDb()

    // Get user from database with unit information
    const user = await db
      .collection("users")
      .aggregate([
        {
          $match: { _id: new ObjectId(req.user!.id) },
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
      .toArray()

    if (!user || user.length === 0) {
      throw new AppError("Không tìm thấy thông tin người dùng", 404)
    }

    res.status(200).json({
      success: true,
      data: {
        id: user[0]._id.toString(),
        fullName: user[0].fullName,
        username: user[0].username,
        rank: user[0].rank,
        position: user[0].position,
        role: user[0].role,
        unit: {
          id: user[0].unit.toString(),
          name: user[0].unitInfo.name,
        },
        status: user[0].status,
      },
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Get profile error:", error)
    throw new AppError("Đã xảy ra lỗi khi lấy thông tin người dùng", 500)
  }
}
