import type { Request, Response } from "express"
import { ObjectId } from "mongodb"
import { getDb } from "../config/database"
import { AppError } from "../middleware/error.middleware"

// @desc    Get all units
// @route   GET /api/units
// @access  Public
export const getUnits = async (req: Request, res: Response) => {
  try {
    const db = await getDb()

    const units = await db.collection("units").find().toArray()

    // Transform data for response
    const transformedUnits = units.map((unit) => ({
      _id: unit._id.toString(),
      name: unit.name,
      description: unit.description,
      createdAt: unit.createdAt,
      updatedAt: unit.updatedAt,
    }))

    res.status(200).json({
      success: true,
      count: transformedUnits.length,
      data: transformedUnits,
    })
  } catch (error) {
    console.error("Error fetching units:", error)
    throw new AppError("Đã xảy ra lỗi khi lấy danh sách đơn vị", 500)
  }
}

// @desc    Create new unit
// @route   POST /api/units
// @access  Private (Admin, Brigade Assistant)
export const createUnit = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body

    // Validate input
    if (!name) {
      throw new AppError("Tên đơn vị không được để trống", 400)
    }

    const db = await getDb()

    // Check if unit already exists
    const existingUnit = await db.collection("units").findOne({ name })
    if (existingUnit) {
      throw new AppError("Đơn vị đã tồn tại", 400)
    }

    // Create new unit
    const result = await db.collection("units").insertOne({
      name,
      description: description || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    res.status(201).json({
      success: true,
      message: "Thêm đơn vị thành công",
      unitId: result.insertedId.toString(),
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error creating unit:", error)
    throw new AppError("Đã xảy ra lỗi khi thêm đơn vị", 500)
  }
}

// @desc    Get unit by ID
// @route   GET /api/units/:id
// @access  Private
export const getUnitById = async (req: Request, res: Response) => {
  try {
    const unitId = req.params.id

    // Validate ObjectId
    if (!ObjectId.isValid(unitId)) {
      throw new AppError("ID đơn vị không hợp lệ", 400)
    }

    const db = await getDb()

    const unit = await db.collection("units").findOne({ _id: new ObjectId(unitId) })

    if (!unit) {
      throw new AppError("Không tìm thấy đơn vị", 404)
    }

    // Transform data for response
    const transformedUnit = {
      _id: unit._id.toString(),
      name: unit.name,
      description: unit.description,
      createdAt: unit.createdAt,
      updatedAt: unit.updatedAt,
    }

    res.status(200).json({
      success: true,
      data: transformedUnit,
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error fetching unit:", error)
    throw new AppError("Đã xảy ra lỗi khi lấy thông tin đơn vị", 500)
  }
}

// @desc    Update unit
// @route   PATCH /api/units/:id
// @access  Private (Admin, Brigade Assistant)
export const updateUnit = async (req: Request, res: Response) => {
  try {
    const unitId = req.params.id
    const { name, description } = req.body

    // Validate ObjectId
    if (!ObjectId.isValid(unitId)) {
      throw new AppError("ID đơn vị không hợp lệ", 400)
    }

    // Validate input
    if (!name) {
      throw new AppError("Tên đơn vị không được để trống", 400)
    }

    const db = await getDb()

    // Check if unit with the same name already exists (excluding current unit)
    const existingUnit = await db.collection("units").findOne({
      _id: { $ne: new ObjectId(unitId) },
      name,
    })

    if (existingUnit) {
      throw new AppError("Đơn vị với tên này đã tồn tại", 400)
    }

    const result = await db.collection("units").updateOne(
      { _id: new ObjectId(unitId) },
      {
        $set: {
          name,
          description: description || "",
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      throw new AppError("Không tìm thấy đơn vị", 404)
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật đơn vị thành công",
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error updating unit:", error)
    throw new AppError("Đã xảy ra lỗi khi cập nhật đơn vị", 500)
  }
}

// @desc    Delete unit
// @route   DELETE /api/units/:id
// @access  Private (Admin)
export const deleteUnit = async (req: Request, res: Response) => {
  try {
    const unitId = req.params.id

    // Validate ObjectId
    if (!ObjectId.isValid(unitId)) {
      throw new AppError("ID đơn vị không hợp lệ", 400)
    }

    const db = await getDb()

    // Check if unit is being used by any user
    const userWithUnit = await db.collection("users").findOne({ unit: new ObjectId(unitId) })
    if (userWithUnit) {
      throw new AppError("Không thể xóa đơn vị đang được sử dụng bởi người dùng", 400)
    }

    // Check if unit is being used by any supply
    const supplyWithUnit = await db.collection("supplies").findOne({ unit: new ObjectId(unitId) })
    if (supplyWithUnit) {
      throw new AppError("Không thể xóa đơn vị đang được sử dụng trong nguồn nhập", 400)
    }

    const result = await db.collection("units").deleteOne({ _id: new ObjectId(unitId) })

    if (result.deletedCount === 0) {
      throw new AppError("Không tìm thấy đơn vị", 404)
    }

    res.status(200).json({
      success: true,
      message: "Xóa đơn vị thành công",
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error deleting unit:", error)
    throw new AppError("Đã xảy ra lỗi khi xóa đơn vị", 500)
  }
}
