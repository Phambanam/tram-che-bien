import type { Request, Response } from "express"
import { ObjectId } from "mongodb"
import { getDb } from "../config/database"
import { AppError } from "../middleware/error.middleware"

// @desc    Get processing station items
// @route   GET /api/processing-station
// @access  Private
export const getProcessingStationItems = async (req: Request, res: Response) => {
  try {
    const { type, productId, status } = req.query

    const db = await getDb()

    let query = {}
    if (type) {
      query = { ...query, type }
    }
    if (productId && ObjectId.isValid(productId as string)) {
      query = { ...query, productId: new ObjectId(productId as string) }
    }
    if (status) {
      query = { ...query, status }
    }

    // Get processing station items with product information
    const items = await db
      .collection("processingStation")
      .aggregate([
        {
          $match: query,
        },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        {
          $unwind: "$productInfo",
        },
        {
          $lookup: {
            from: "productCategories",
            localField: "productInfo.category",
            foreignField: "_id",
            as: "categoryInfo",
          },
        },
        {
          $unwind: "$categoryInfo",
        },
        {
          $project: {
            id: { $toString: "$_id" },
            type: 1,
            product: {
              id: { $toString: "$productId" },
              name: "$productInfo.name",
              category: {
                id: { $toString: "$productInfo.category" },
                name: "$categoryInfo.name",
              },
            },
            processingDate: 1,
            useDate: 1,
            expiryDate: 1,
            quantity: 1,
            status: 1,
            nonExpiredQuantity: 1,
            expiredQuantity: 1,
            note: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ])
      .toArray()

    res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    })
  } catch (error) {
    console.error("Error fetching processing station items:", error)
    throw new AppError("Đã xảy ra lỗi khi lấy danh sách trạm chế biến", 500)
  }
}

// @desc    Get processing station item by ID
// @route   GET /api/processing-station/:id
// @access  Private
export const getProcessingStationItemById = async (req: Request, res: Response) => {
  try {
    const itemId = req.params.id

    // Validate ObjectId
    if (!ObjectId.isValid(itemId)) {
      throw new AppError("ID không hợp lệ", 400)
    }

    const db = await getDb()

    // Get processing station item with product information
    const item = await db
      .collection("processingStation")
      .aggregate([
        {
          $match: { _id: new ObjectId(itemId) },
        },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        {
          $unwind: "$productInfo",
        },
        {
          $lookup: {
            from: "productCategories",
            localField: "productInfo.category",
            foreignField: "_id",
            as: "categoryInfo",
          },
        },
        {
          $unwind: "$categoryInfo",
        },
        {
          $project: {
            id: { $toString: "$_id" },
            type: 1,
            product: {
              id: { $toString: "$productId" },
              name: "$productInfo.name",
              category: {
                id: { $toString: "$productInfo.category" },
                name: "$categoryInfo.name",
              },
            },
            processingDate: 1,
            useDate: 1,
            expiryDate: 1,
            quantity: 1,
            status: 1,
            nonExpiredQuantity: 1,
            expiredQuantity: 1,
            note: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ])
      .toArray()

    if (!item || item.length === 0) {
      throw new AppError("Không tìm thấy thông tin", 404)
    }

    res.status(200).json({
      success: true,
      data: item[0],
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error fetching processing station item:", error)
    throw new AppError("Đã xảy ra lỗi khi lấy thông tin trạm chế biến", 500)
  }
}

// @desc    Create processing station item
// @route   POST /api/processing-station
// @access  Private (Admin only)
export const createProcessingStationItem = async (req: Request, res: Response) => {
  try {
    const { type, productId, processingDate, useDate, expiryDate, quantity, note } = req.body

    // Validate input
    if (!type || !productId || !processingDate || !useDate || !expiryDate || !quantity) {
      throw new AppError("Vui lòng điền đầy đủ thông tin", 400)
    }

    // Validate type
    const validTypes = ["tofu", "sausage", "sprouts", "pickled", "slaughter", "food"]
    if (!validTypes.includes(type)) {
      throw new AppError("Loại không hợp lệ", 400)
    }

    // Validate ObjectId
    if (!ObjectId.isValid(productId)) {
      throw new AppError("ID sản phẩm không hợp lệ", 400)
    }

    const db = await getDb()

    // Check if product exists
    const product = await db.collection("products").findOne({ _id: new ObjectId(productId) })
    if (!product) {
      throw new AppError("Không tìm thấy sản phẩm", 404)
    }

    // Calculate non-expired and expired quantities
    const now = new Date()
    const expiryDateObj = new Date(expiryDate)
    const nonExpiredQuantity = expiryDateObj > now ? quantity : 0
    const expiredQuantity = expiryDateObj <= now ? quantity : 0

    // Create processing station item
    const result = await db.collection("processingStation").insertOne({
      type,
      productId: new ObjectId(productId),
      processingDate: new Date(processingDate),
      useDate: new Date(useDate),
      expiryDate: new Date(expiryDate),
      quantity,
      status: "active",
      nonExpiredQuantity,
      expiredQuantity,
      note: note || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    res.status(201).json({
      success: true,
      message: "Thêm thông tin trạm chế biến thành công",
      itemId: result.insertedId.toString(),
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error creating processing station item:", error)
    throw new AppError("Đã xảy ra lỗi khi thêm thông tin trạm chế biến", 500)
  }
}

// @desc    Update processing station item
// @route   PATCH /api/processing-station/:id
// @access  Private (Admin only)
export const updateProcessingStationItem = async (req: Request, res: Response) => {
  try {
    const itemId = req.params.id
    const { type, productId, processingDate, useDate, expiryDate, quantity, status, note } = req.body

    // Validate ObjectId
    if (!ObjectId.isValid(itemId)) {
      throw new AppError("ID không hợp lệ", 400)
    }

    // Validate input
    if (!type || !productId || !processingDate || !useDate || !expiryDate || !quantity) {
      throw new AppError("Vui lòng điền đầy đủ thông tin", 400)
    }

    // Validate type
    const validTypes = ["tofu", "sausage", "sprouts", "pickled", "slaughter", "food"]
    if (!validTypes.includes(type)) {
      throw new AppError("Loại không hợp lệ", 400)
    }

    // Validate ObjectId
    if (!ObjectId.isValid(productId)) {
      throw new AppError("ID sản phẩm không hợp lệ", 400)
    }

    const db = await getDb()

    // Check if product exists
    const product = await db.collection("products").findOneOne({ _id: new ObjectId(productId) })
    if (!product) {
      throw new AppError("Không tìm thấy sản phẩm", 404)
    }

    // Calculate non-expired and expired quantities
    const now = new Date()
    const expiryDateObj = new Date(expiryDate)
    const nonExpiredQuantity = expiryDateObj > now ? quantity : 0
    const expiredQuantity = expiryDateObj <= now ? quantity : 0

    // Update processing station item
    const result = await db.collection("processingStation").updateOne(
      { _id: new ObjectId(itemId) },
      {
        $set: {
          type,
          productId: new ObjectId(productId),
          processingDate: new Date(processingDate),
          useDate: new Date(useDate),
          expiryDate: new Date(expiryDate),
          quantity,
          status: status || "active",
          nonExpiredQuantity,
          expiredQuantity,
          note: note || "",
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      throw new AppError("Không tìm thấy thông tin", 404)
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật thông tin trạm chế biến thành công",
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error updating processing station item:", error)
    throw new AppError("Đã xảy ra lỗi khi cập nhật thông tin trạm chế biến", 500)
  }
}

// @desc    Delete processing station item
// @route   DELETE /api/processing-station/:id
// @access  Private (Admin only)
export const deleteProcessingStationItem = async (req: Request, res: Response) => {
  try {
    const itemId = req.params.id

    // Validate ObjectId
    if (!ObjectId.isValid(itemId)) {
      throw new AppError("ID không hợp lệ", 400)
    }

    const db = await getDb()

    // Delete processing station item
    const result = await db.collection("processingStation").deleteOne({ _id: new ObjectId(itemId) })

    if (result.deletedCount === 0) {
      throw new AppError("Không tìm thấy thông tin", 404)
    }

    res.status(200).json({
      success: true,
      message: "Xóa thông tin trạm chế biến thành công",
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error deleting processing station item:", error)
    throw new AppError("Đã xảy ra lỗi khi xóa thông tin trạm chế biến", 500)
  }
}

// @desc    Get food inventory
// @route   GET /api/processing-station/food-inventory
// @access  Private
export const getFoodInventory = async (req: Request, res: Response) => {
  try {
    const db = await getDb()

    // Get food inventory with product information
    const inventory = await db
      .collection("processingStation")
      .aggregate([
        {
          $match: { type: "food" },
        },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        {
          $unwind: "$productInfo",
        },
        {
          $lookup: {
            from: "productCategories",
            localField: "productInfo.category",
            foreignField: "_id",
            as: "categoryInfo",
          },
        },
        {
          $unwind: "$categoryInfo",
        },
        {
          $project: {
            id: { $toString: "$_id" },
            product: {
              id: { $toString: "$productId" },
              name: "$productInfo.name",
              category: {
                id: { $toString: "$productInfo.category" },
                name: "$categoryInfo.name",
              },
            },
            processingDate: 1,
            useDate: 1,
            expiryDate: 1,
            quantity: 1,
            status: 1,
            nonExpiredQuantity: 1,
            expiredQuantity: 1,
            note: 1,
          },
        },
        {
          $group: {
            _id: "$product.id",
            product: { $first: "$product" },
            totalQuantity: { $sum: "$quantity" },
            nonExpiredQuantity: { $sum: "$nonExpiredQuantity" },
            expiredQuantity: { $sum: "$expiredQuantity" },
            items: {
              $push: {
                id: "$id",
                processingDate: "$processingDate",
                useDate: "$useDate",
                expiryDate: "$expiryDate",
                quantity: "$quantity",
                status: "$status",
                nonExpiredQuantity: "$nonExpiredQuantity",
                expiredQuantity: "$expiredQuantity",
                note: "$note",
              },
            },
          },
        },
        {
          $sort: { "product.category.name": 1, "product.name": 1 },
        },
      ])
      .toArray()

    res.status(200).json({
      success: true,
      count: inventory.length,
      data: inventory,
    })
  } catch (error) {
    console.error("Error fetching food inventory:", error)
    throw new AppError("Đã xảy ra lỗi khi lấy danh sách tồn kho thực phẩm", 500)
  }
}

// @desc    Update food inventory expiry status
// @route   POST /api/processing-station/update-expiry
// @access  Private (Admin only)
export const updateExpiryStatus = async (req: Request, res: Response) => {
  try {
    const db = await getDb()

    const now = new Date()

    // Update expiry status for all items
    const result = await db.collection("processingStation").updateMany({}, [
      {
        $set: {
          nonExpiredQuantity: {
            $cond: [{ $gt: ["$expiryDate", now] }, "$quantity", 0],
          },
          expiredQuantity: {
            $cond: [{ $lte: ["$expiryDate", now] }, "$quantity", 0],
          },
          updatedAt: now,
        },
      },
    ])

    res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái hạn sử dụng thành công",
      count: result.modifiedCount,
    })
  } catch (error) {
    console.error("Error updating expiry status:", error)
    throw new AppError("Đã xảy ra lỗi khi cập nhật trạng thái hạn sử dụng", 500)
  }
}
