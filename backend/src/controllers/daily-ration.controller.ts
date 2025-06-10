import type { Request, Response } from "express"
import { ObjectId } from "mongodb"
import { getDb } from "../config/database"
import { AppError } from "../middleware/error.middleware"

// @desc    Get all daily rations
// @route   GET /api/daily-rations
// @access  Private
export const getDailyRations = async (req: Request, res: Response) => {
  try {
    const db = await getDb()
    
    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const skip = (page - 1) * limit
    
    // Filter parameters
    const { category } = req.query
    const filter: any = {}
    
    if (category) {
      filter.category = category
    }
    
    // Get total count for pagination
    const totalCount = await db.collection("dailyRations").countDocuments(filter)
    
    // Get daily rations with category info
    const dailyRations = await db
      .collection("dailyRations")
      .aggregate([
        {
          $match: filter
        },
        {
          $lookup: {
            from: "categories",
            let: { categoryId: { $toObjectId: "$categoryId" } },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$categoryId"] } } }
            ],
            as: "categoryInfo",
          },
        },
        {
          $sort: { name: 1 }
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
    const transformedRations = dailyRations.map((ration) => ({
      _id: ration._id.toString(),
      name: ration.name,
      categoryId: ration.categoryId,
      categoryName: ration.categoryName || (ration.categoryInfo[0]?.name || ""),
      quantityPerPerson: ration.quantityPerPerson,
      unit: ration.unit,
      pricePerUnit: ration.pricePerUnit,
      totalCostPerPerson: ration.totalCostPerPerson,
      notes: ration.notes,
      createdAt: ration.createdAt,
      updatedAt: ration.updatedAt,
    }))

    res.status(200).json({
      success: true,
      count: transformedRations.length,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      data: transformedRations,
    })
  } catch (error) {
    console.error("Error fetching daily rations:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy danh sách định lượng ăn"
    })
  }
}

// @desc    Create new daily ration
// @route   POST /api/daily-rations
// @access  Private (Admin, Brigade Assistant)
export const createDailyRation = async (req: Request, res: Response) => {
  try {
    const { name, categoryId, categoryName, quantityPerPerson, unit, pricePerUnit, notes } = req.body

    // Validate input
    if (!name || !categoryId || !quantityPerPerson || !unit || !pricePerUnit) {
      return res.status(400).json({
        success: false,
        message: "Các trường bắt buộc không được để trống"
      })
    }

    // Validate quantityPerPerson and pricePerUnit are positive numbers
    if (parseFloat(quantityPerPerson) <= 0 || parseFloat(pricePerUnit) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số lượng/người phải là số dương"
      })
    }

    const db = await getDb()

    // Check if daily ration already exists
    const existingRation = await db.collection("dailyRations").findOne({ name })
    if (existingRation) {
      return res.status(400).json({
        success: false,
        message: "Định lượng ăn đã tồn tại"
      })
    }

    // Validate category exists
    const categoryExists = await db.collection("categories").findOne({ _id: new ObjectId(categoryId) })
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: "Phân loại không tồn tại"
      })
    }

    // Create new daily ration with actual quantity per person
    const result = await db.collection("dailyRations").insertOne({
      name,
      categoryId,
      categoryName: categoryName || "",
      quantityPerPerson: parseFloat(quantityPerPerson),
      unit,
      pricePerUnit: parseFloat(pricePerUnit),
      totalCostPerPerson: parseFloat(quantityPerPerson) * parseFloat(pricePerUnit),
      notes: notes || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    res.status(201).json({
      success: true,
      message: "Thêm định lượng ăn thành công",
      rationId: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("Error creating daily ration:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi thêm định lượng ăn"
    })
  }
}

// @desc    Get daily ration by ID
// @route   GET /api/daily-rations/:id
// @access  Private
export const getDailyRationById = async (req: Request, res: Response) => {
  try {
    const rationId = req.params.id

    // Validate ObjectId
    if (!ObjectId.isValid(rationId)) {
      return res.status(400).json({
        success: false,
        message: "ID định lượng ăn không hợp lệ"
      })
    }

    const db = await getDb()

    const ration = await db.collection("dailyRations").findOne({ _id: new ObjectId(rationId) })

    if (!ration) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy định lượng ăn"
      })
    }

    // Transform data for response
    const transformedRation = {
      _id: ration._id.toString(),
      name: ration.name,
      categoryId: ration.categoryId,
      categoryName: ration.categoryName,
      quantityPerPerson: ration.quantityPerPerson,
      unit: ration.unit,
      pricePerUnit: ration.pricePerUnit,
      totalCostPerPerson: ration.totalCostPerPerson,
      notes: ration.notes,
      createdAt: ration.createdAt,
      updatedAt: ration.updatedAt,
    }

    res.status(200).json({
      success: true,
      data: transformedRation,
    })
  } catch (error) {
    console.error("Error fetching daily ration:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy thông tin định lượng ăn"
    })
  }
}

// @desc    Update daily ration
// @route   PATCH /api/daily-rations/:id
// @access  Private (Admin, Brigade Assistant)
export const updateDailyRation = async (req: Request, res: Response) => {
  try {
    const rationId = req.params.id
    const { name, categoryId, categoryName, quantityPerPerson, unit, pricePerUnit, notes } = req.body

    // Validate ObjectId
    if (!ObjectId.isValid(rationId)) {
      return res.status(400).json({
        success: false,
        message: "ID định lượng ăn không hợp lệ"
      })
    }

    // Validate input
    if (!name || !categoryId || !quantityPerPerson || !unit || !pricePerUnit) {
      return res.status(400).json({
        success: false,
        message: "Các trường bắt buộc không được để trống"
      })
    }

    // Validate quantityPerPerson and pricePerUnit are positive numbers
    if (parseFloat(quantityPerPerson) <= 0 || parseFloat(pricePerUnit) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số lượng/người phải là số dương"
      })
    }

    const db = await getDb()

    // Check if daily ration with the same name already exists (excluding current ration)
    const existingRation = await db.collection("dailyRations").findOne({
      _id: { $ne: new ObjectId(rationId) },
      name,
    })

    if (existingRation) {
      return res.status(400).json({
        success: false,
        message: "Định lượng ăn với tên này đã tồn tại"
      })
    }

    // Validate category exists if categoryId is provided
    const categoryExists = await db.collection("categories").findOne({ _id: new ObjectId(categoryId) })
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: "Phân loại không tồn tại"
      })
    }

    const result = await db.collection("dailyRations").updateOne(
      { _id: new ObjectId(rationId) },
      {
        $set: {
          name,
          categoryId,
          categoryName: categoryName || "",
          quantityPerPerson: parseFloat(quantityPerPerson),
          unit,
          pricePerUnit: parseFloat(pricePerUnit),
          totalCostPerPerson: parseFloat(quantityPerPerson) * parseFloat(pricePerUnit),
          notes: notes || "",
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy định lượng ăn"
      })
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật định lượng ăn thành công",
    })
  } catch (error) {
    console.error("Error updating daily ration:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật định lượng ăn"
    })
  }
}

// @desc    Delete daily ration
// @route   DELETE /api/daily-rations/:id
// @access  Private (Admin)
export const deleteDailyRation = async (req: Request, res: Response) => {
  try {
    const rationId = req.params.id

    // Validate ObjectId
    if (!ObjectId.isValid(rationId)) {
      return res.status(400).json({
        success: false,
        message: "ID định lượng ăn không hợp lệ"
      })
    }

    const db = await getDb()

    const result = await db.collection("dailyRations").deleteOne({ _id: new ObjectId(rationId) })

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy định lượng ăn"
      })
    }

    res.status(200).json({
      success: true,
      message: "Xóa định lượng ăn thành công",
    })
  } catch (error) {
    console.error("Error deleting daily ration:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi xóa định lượng ăn"
    })
  }
}

// @desc    Get daily rations by category
// @route   GET /api/daily-rations/by-category/:category
// @access  Private
export const getDailyRationsByCategory = async (req: Request, res: Response) => {
  try {
    const category = req.params.category

    const db = await getDb()

    const rations = await db
      .collection("dailyRations")
      .find({ categoryName: category })
      .sort({ name: 1 })
      .toArray()

    // Transform data for response
    const transformedRations = rations.map((ration) => ({
      _id: ration._id.toString(),
      name: ration.name,
      categoryId: ration.categoryId,
      categoryName: ration.categoryName,
      quantityPerPerson: ration.quantityPerPerson,
      unit: ration.unit,
      pricePerUnit: ration.pricePerUnit,
      totalCostPerPerson: ration.totalCostPerPerson,
      notes: ration.notes,
    }))

    res.status(200).json({
      success: true,
      count: transformedRations.length,
      data: transformedRations,
    })
  } catch (error) {
    console.error("Error fetching daily rations by category:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy danh sách định lượng ăn theo phân loại"
    })
  }
}

// @desc    Calculate total daily cost
// @route   GET /api/daily-rations/total-cost
// @access  Private
export const getTotalDailyCost = async (req: Request, res: Response) => {
  try {
    const db = await getDb()

    const result = await db
      .collection("dailyRations")
      .aggregate([
        {
          $group: {
            _id: null,
            totalCost: { $sum: "$totalCostPerPerson" },
            itemCount: { $sum: 1 }
          }
        }
      ])
      .toArray()

    const totalCost = result.length > 0 ? result[0].totalCost : 0
    const itemCount = result.length > 0 ? result[0].itemCount : 0

    res.status(200).json({
      success: true,
      data: {
        totalCostPerPerson: totalCost,
        itemCount,
        standardBudget: 65000, // VND per person per day
        budgetStatus: totalCost <= 65000 ? "within_budget" : "over_budget"
      },
    })
  } catch (error) {
    console.error("Error calculating total daily cost:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi tính tổng chi phí hàng ngày"
    })
  }
} 