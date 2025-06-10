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
      code: unit.code,
      personnel: unit.personnel,
      commander: unit.commander,
      contact: unit.contact,
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
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy danh sách đơn vị"
    })
  }
}

// @desc    Create new unit
// @route   POST /api/units
// @access  Private (Admin, Brigade Assistant)
export const createUnit = async (req: Request, res: Response) => {
  try {
    const { name, code, personnel, commander, contact, description } = req.body

    // Validate input
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Tên đơn vị không được để trống"
      })
    }

    const db = await getDb()

    // Check if unit already exists by name or code
    const existingUnit = await db.collection("units").findOne({
      $or: [
        { name },
        ...(code ? [{ code }] : [])
      ]
    })
    if (existingUnit) {
      return res.status(400).json({
        success: false,
        message: "Đơn vị đã tồn tại"
      })
    }

    // Create new unit
    const result = await db.collection("units").insertOne({
      name,
      code: code || "",
      personnel: personnel || 0,
      commander: commander || "",
      contact: contact || "",
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
    console.error("Error creating unit:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi thêm đơn vị"
    })
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
      return res.status(400).json({
        success: false,
        message: "ID đơn vị không hợp lệ"
      })
    }

    const db = await getDb()

    const unit = await db.collection("units").findOne({ _id: new ObjectId(unitId) })

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn vị"
      })
    }

    // Transform data for response
    const transformedUnit = {
      _id: unit._id.toString(),
      name: unit.name,
      code: unit.code,
      personnel: unit.personnel,
      commander: unit.commander,
      contact: unit.contact,
      description: unit.description,
      createdAt: unit.createdAt,
      updatedAt: unit.updatedAt,
    }

    res.status(200).json({
      success: true,
      data: transformedUnit,
    })
  } catch (error) {
    console.error("Error fetching unit:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy thông tin đơn vị"
    })
  }
}

// @desc    Update unit
// @route   PATCH /api/units/:id
// @access  Private (Admin, Brigade Assistant)
export const updateUnit = async (req: Request, res: Response) => {
  try {
    const unitId = req.params.id
    const { name, code, personnel, commander, contact, description } = req.body

    // Validate ObjectId
    if (!ObjectId.isValid(unitId)) {
      return res.status(400).json({
        success: false,
        message: "ID đơn vị không hợp lệ"
      })
    }

    // Validate input
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Tên đơn vị không được để trống"
      })
    }

    const db = await getDb()

    // Check if unit with the same name or code already exists (excluding current unit)
    const existingUnit = await db.collection("units").findOne({
      _id: { $ne: new ObjectId(unitId) },
      $or: [
        { name },
        ...(code ? [{ code }] : [])
      ]
    })

    if (existingUnit) {
      return res.status(400).json({
        success: false,
        message: "Đơn vị với tên hoặc mã này đã tồn tại"
      })
    }

    const result = await db.collection("units").updateOne(
      { _id: new ObjectId(unitId) },
      {
        $set: {
          name,
          code: code || "",
          personnel: personnel || 0,
          commander: commander || "",
          contact: contact || "",
          description: description || "",
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn vị"
      })
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật đơn vị thành công",
    })
  } catch (error) {
    console.error("Error updating unit:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật đơn vị"
    })
  }
}

// @desc    Delete unit
// @route   DELETE /api/units/:id
// @access  Private (Admin, Brigade Assistant)
export const deleteUnit = async (req: Request, res: Response) => {
  try {
    const unitId = req.params.id

    // Validate ObjectId
    if (!ObjectId.isValid(unitId)) {
      return res.status(400).json({
        success: false,
        message: "ID đơn vị không hợp lệ"
      })
    }

    const db = await getDb()

    // Check if unit is being used by any user
    const userWithUnit = await db.collection("users").findOne({ unit: new ObjectId(unitId) })
    if (userWithUnit) {
      return res.status(400).json({
        success: false,
        message: "Không thể xóa đơn vị đang được sử dụng bởi người dùng"
      })
    }

    // Check if unit is being used by any supply
    const supplyWithUnit = await db.collection("supplies").findOne({ unit: new ObjectId(unitId) })
    if (supplyWithUnit) {
      return res.status(400).json({
        success: false,
        message: "Không thể xóa đơn vị đang được sử dụng trong nguồn nhập"
      })
    }

    const result = await db.collection("units").deleteOne({ _id: new ObjectId(unitId) })

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn vị"
      })
    }

    res.status(200).json({
      success: true,
      message: "Xóa đơn vị thành công",
    })
  } catch (error) {
    console.error("Error deleting unit:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi xóa đơn vị"
    })
  }
}

// @desc    Update unit personnel only
// @route   PATCH /api/units/:id/personnel
// @access  Private (Admin, Brigade Assistant, Unit Assistant for own unit)
export const updateUnitPersonnel = async (req: Request, res: Response) => {
  try {
    const unitId = req.params.id
    const { personnel } = req.body

    // Validate ObjectId
    if (!ObjectId.isValid(unitId)) {
      throw new AppError("ID đơn vị không hợp lệ", 400)
    }

    // Validate personnel
    if (personnel === undefined || personnel === null || personnel < 0) {
      throw new AppError("Số người ăn không hợp lệ", 400)
    }

    const db = await getDb()

    // Check if unit exists
    const unit = await db.collection("units").findOne({ _id: new ObjectId(unitId) })
    if (!unit) {
      throw new AppError("Không tìm thấy đơn vị", 404)
    }

    // Check authorization for unit assistant
    if (req.user?.role === "unitAssistant") {
      // Unit assistant can only update their own unit
      if (req.user.unit !== unitId) {
        throw new AppError("Bạn chỉ có thể cập nhật số người ăn của đơn vị mình", 403)
      }
    }

    const result = await db.collection("units").updateOne(
      { _id: new ObjectId(unitId) },
      {
        $set: {
          personnel: Number(personnel),
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      throw new AppError("Không tìm thấy đơn vị", 404)
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật số người ăn thành công",
      data: {
        unitId,
        personnel: Number(personnel)
      }
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error updating unit personnel:", error)
    throw new AppError("Đã xảy ra lỗi khi cập nhật số người ăn", 500)
  }
}

// @desc    Update total personnel count for a specific date
// @route   PATCH /api/units/total-personnel
// @access  Private (Admin, Brigade Assistant, Unit Assistant)
export const updateTotalPersonnel = async (req: Request, res: Response) => {
  try {
    const { date, totalPersonnel } = req.body

    // Validate input
    if (!date || totalPersonnel === undefined || totalPersonnel === null || totalPersonnel < 0) {
      throw new AppError("Ngày và tổng số người ăn là bắt buộc", 400)
    }

    const db = await getDb()

    // Check authorization
    if (!['admin', 'brigadeAssistant', 'unitAssistant'].includes(req.user?.role || '')) {
      throw new AppError("Bạn không có quyền cập nhật tổng số người ăn", 403)
    }

    // Update or create total personnel record
    const result = await db.collection("totalPersonnel").updateOne(
      { date: date },
      {
        $set: {
          totalPersonnel: Number(totalPersonnel),
          updatedAt: new Date(),
          updatedBy: req.user?.id || 'unknown'
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    )

    res.status(200).json({
      success: true,
      message: "Cập nhật tổng số người ăn thành công",
      data: {
        date,
        totalPersonnel: Number(totalPersonnel),
        isNew: result.upsertedCount > 0
      }
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error updating total personnel:", error)
    throw new AppError("Đã xảy ra lỗi khi cập nhật tổng số người ăn", 500)
  }
}

// @desc    Get total personnel count for a specific date
// @route   GET /api/units/total-personnel/:date
// @access  Private
export const getTotalPersonnel = async (req: Request, res: Response) => {
  try {
    const { date } = req.params

    if (!date) {
      throw new AppError("Ngày là bắt buộc", 400)
    }

    const db = await getDb()

    const record = await db.collection("totalPersonnel").findOne({ date })

    res.status(200).json({
      success: true,
      data: {
        date,
        totalPersonnel: record?.totalPersonnel || 0,
        exists: !!record
      }
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error getting total personnel:", error)
    throw new AppError("Đã xảy ra lỗi khi lấy tổng số người ăn", 500)
  }
}

// @desc    Update daily dining count for a specific unit and date
// @route   PATCH /api/units/daily-dining
// @access  Private (Admin, Brigade Assistant, Unit Assistant for own unit)
export const updateDailyDining = async (req: Request, res: Response) => {
  try {
    const { unitId, date, diningCount } = req.body

    // Validate input
    if (!unitId || !date || diningCount === undefined || diningCount === null || diningCount < 0) {
      throw new AppError("ID đơn vị, ngày và số người ăn cơm là bắt buộc", 400)
    }

    const db = await getDb()

    // Check if unit exists
    const unit = await db.collection("units").findOne({ _id: new ObjectId(unitId) })
    if (!unit) {
      throw new AppError("Không tìm thấy đơn vị", 404)
    }

    // Check authorization for unit assistant
    if (req.user?.role === "unitAssistant") {
      // Unit assistant can only update their own unit
      if (req.user.unit !== unitId) {
        throw new AppError("Bạn chỉ có thể cập nhật số người ăn cơm của đơn vị mình", 403)
      }
    }

    // Update or create daily dining record
    const result = await db.collection("dailyDining").updateOne(
      { unitId: new ObjectId(unitId), date: date },
      {
        $set: {
          diningCount: Number(diningCount),
          updatedAt: new Date(),
          updatedBy: req.user?.id || 'unknown'
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    )

    res.status(200).json({
      success: true,
      message: "Cập nhật số người ăn cơm thành công",
      data: {
        unitId,
        date,
        diningCount: Number(diningCount),
        isNew: result.upsertedCount > 0
      }
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error updating daily dining:", error)
    throw new AppError("Đã xảy ra lỗi khi cập nhật số người ăn cơm", 500)
  }
}

// @desc    Get daily dining count for all units on a specific date
// @route   GET /api/units/daily-dining/:date
// @access  Private
export const getDailyDining = async (req: Request, res: Response) => {
  try {
    const { date } = req.params

    if (!date) {
      throw new AppError("Ngày là bắt buộc", 400)
    }

    const db = await getDb()

    // Get all daily dining records for this date
    const records = await db.collection("dailyDining").find({ date }).toArray()

    // Transform to unitId -> diningCount mapping
    const diningData: { [unitId: string]: number } = {}
    records.forEach(record => {
      diningData[record.unitId.toString()] = record.diningCount || 0
    })

    res.status(200).json({
      success: true,
      data: {
        date,
        diningData
      }
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error getting daily dining:", error)
    throw new AppError("Đã xảy ra lỗi khi lấy dữ liệu số người ăn cơm", 500)
  }
}
