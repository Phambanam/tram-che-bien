import type { Request, Response } from "express"
import { ObjectId } from "mongodb"
import { getDb } from "../config/database"
import { AppError } from "../middleware/error.middleware"

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin, Brigade Assistant)
export const getUsers = async (req: Request, res: Response) => {
  try {
    const db = await getDb()
    
    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const skip = (page - 1) * limit
    
    // Get total count for pagination
    const totalCount = await db.collection("users").countDocuments()
    
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
      .toArray()

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
    }))

    res.status(200).json({
      success: true,
      count: transformedUsers.length,
      totalCount: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      data: transformedUsers,
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    throw new AppError("Đã xảy ra lỗi khi lấy danh sách người dùng", 500)
  }
}

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Admin, Brigade Assistant)
export const getUserById = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id

    // Validate ObjectId
    if (!ObjectId.isValid(userId)) {
      throw new AppError("ID người dùng không hợp lệ", 400)
    }

    const db = await getDb()

    // Get user with unit information
    const user = await db
      .collection("users")
      .aggregate([
        {
          $match: { _id: new ObjectId(userId) },
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
      throw new AppError("Không tìm thấy người dùng", 404)
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
    }

    res.status(200).json({
      success: true,
      data: transformedUser,
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error fetching user:", error)
    throw new AppError("Đã xảy ra lỗi khi lấy thông tin người dùng", 500)
  }
}

// @desc    Update user
// @route   PATCH /api/users/:id
// @access  Private (Admin)
export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id
    const { status, role } = req.body

    // Validate ObjectId
    if (!ObjectId.isValid(userId)) {
      throw new AppError("ID người dùng không hợp lệ", 400)
    }

    const db = await getDb()

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (status) {
      updateData.status = status
    }

    if (role) {
      updateData.role = role
    }

    const result = await db.collection("users").updateOne({ _id: new ObjectId(userId) }, { $set: updateData })

    if (result.matchedCount === 0) {
      throw new AppError("Không tìm thấy người dùng", 404)
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật thông tin người dùng thành công",
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error updating user:", error)
    throw new AppError("Đã xảy ra lỗi khi cập nhật thông tin người dùng", 500)
  }
}

// @desc    Delete user (soft delete)
// @route   DELETE /api/users/:id
// @access  Private (Admin)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id

    // Validate ObjectId
    if (!ObjectId.isValid(userId)) {
      throw new AppError("ID người dùng không hợp lệ", 400)
    }

    const db = await getDb()

    // Soft delete by changing status
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          status: "deleted",
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      throw new AppError("Không tìm thấy người dùng", 404)
    }

    res.status(200).json({
      success: true,
      message: "Xóa người dùng thành công",
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error deleting user:", error)
    throw new AppError("Đã xảy ra lỗi khi xóa người dùng", 500)
  }
}
