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
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy danh sách trạm chế biến"
    })
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
      return res.status(400).json({
        success: false,
        message: "ID không hợp lệ"
      })
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
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin"
      })
    }

    res.status(200).json({
      success: true,
      data: item[0],
    })
  } catch (error) {
    console.error("Error fetching processing station item:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy thông tin trạm chế biến"
    })
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
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin"
      })
    }

    // Validate type
    const validTypes = ["tofu", "sausage", "sprouts", "pickled", "slaughter", "food"]
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Loại không hợp lệ"
      })
    }

    // Validate ObjectId
    if (!ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "ID sản phẩm không hợp lệ"
      })
    }

    const db = await getDb()

    // Check if product exists
    const product = await db.collection("products").findOne({ _id: new ObjectId(productId) })
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm"
      })
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
    console.error("Error creating processing station item:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi thêm thông tin trạm chế biến"
    })
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
      return res.status(400).json({
        success: false,
        message: "ID không hợp lệ"
      })
    }

    // Validate input
    if (!type || !productId || !processingDate || !useDate || !expiryDate || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin"
      })
    }

    // Validate type
    const validTypes = ["tofu", "sausage", "sprouts", "pickled", "slaughter", "food"]
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Loại không hợp lệ"
      })
    }

    // Validate ObjectId
    if (!ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "ID sản phẩm không hợp lệ"
      })
    }

    const db = await getDb()

    // Check if product exists
    const product = await db.collection("products").findOneOne({ _id: new ObjectId(productId) })
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm"
      })
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
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin"
      })
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật thông tin trạm chế biến thành công",
    })
  } catch (error) {
    console.error("Error updating processing station item:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật thông tin trạm chế biến"
    })
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
      return res.status(400).json({
        success: false,
        message: "ID không hợp lệ"
      })
    }

    const db = await getDb()

    // Delete processing station item
    const result = await db.collection("processingStation").deleteOne({ _id: new ObjectId(itemId) })

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin"
      })
    }

    res.status(200).json({
      success: true,
      message: "Xóa thông tin trạm chế biến thành công",
    })
  } catch (error) {
    console.error("Error deleting processing station item:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi xóa thông tin trạm chế biến"
    })
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
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy danh sách tồn kho thực phẩm"
    })
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
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật trạng thái hạn sử dụng"
    })
  }
}

// @desc    Get daily tofu processing data
// @route   GET /api/processing-station/daily/:date
// @access  Private
export const getDailyTofuData = async (req: Request, res: Response) => {
  try {
    const { date } = req.params
    const db = await getDb()

    // Get daily tofu processing data for the specific date
    const dailyData = await db.collection("dailyTofuProcessing").findOne({
      date: date
    })

    if (!dailyData) {
      // Return default data if not found
      return res.status(200).json({
        success: true,
        data: {
          date: date,
          soybeanInput: 0,
          tofuInput: 0,
          note: "",
          soybeanPrice: 0,
          tofuPrice: 0,
          byProductQuantity: 0,
          byProductPrice: 5000,
          otherCosts: 0
        }
      })
    }

    res.status(200).json({
      success: true,
      data: {
        date: dailyData.date,
        soybeanInput: dailyData.soybeanInput || 0,
        tofuInput: dailyData.tofuInput || 0,
        note: dailyData.note || "",
        soybeanPrice: dailyData.soybeanPrice || 0,
        tofuPrice: dailyData.tofuPrice || 0,
        byProductQuantity: dailyData.byProductQuantity || 0,
        byProductPrice: dailyData.byProductPrice || 5000,
        otherCosts: dailyData.otherCosts || 0
      }
    })
  } catch (error) {
    console.error("Error fetching daily tofu data:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy dữ liệu chế biến đậu phụ hàng ngày"
    })
  }
}

// @desc    Update daily tofu processing data
// @route   PATCH /api/processing-station/daily/:date
// @access  Private (Admin, StationManager)
export const updateDailyTofuData = async (req: Request, res: Response) => {
  try {
    const { date } = req.params
    const { 
      soybeanInput, 
      tofuInput, 
      note, 
      soybeanPrice, 
      tofuPrice,
      byProductQuantity,
      byProductPrice,
      otherCosts
    } = req.body
    const db = await getDb()

    // Validate input
    if (soybeanInput === undefined || tofuInput === undefined) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ số lượng đậu tương chi và đậu phụ thu"
      })
    }

    // Update or insert daily data
    const result = await db.collection("dailyTofuProcessing").updateOne(
      { date: date },
      {
        $set: {
          date: date,
          soybeanInput: Number(soybeanInput) || 0,
          tofuInput: Number(tofuInput) || 0,
          note: note || "",
          soybeanPrice: Number(soybeanPrice) || 0,
          tofuPrice: Number(tofuPrice) || 0,
          byProductQuantity: Number(byProductQuantity) || 0,
          byProductPrice: Number(byProductPrice) || 5000,
          otherCosts: Number(otherCosts) || 0,
          updatedAt: new Date(),
          updatedBy: req.user._id
        },
        $setOnInsert: {
          createdAt: new Date(),
          createdBy: req.user._id
        }
      },
      { upsert: true }
    )

    res.status(200).json({
      success: true,
      message: "Cập nhật dữ liệu chế biến đậu phụ thành công",
      data: {
        date: date,
        soybeanInput: Number(soybeanInput) || 0,
        tofuInput: Number(tofuInput) || 0,
        note: note || "",
        soybeanPrice: Number(soybeanPrice) || 0,
        tofuPrice: Number(tofuPrice) || 0,
        byProductQuantity: Number(byProductQuantity) || 0,
        byProductPrice: Number(byProductPrice) || 5000,
        otherCosts: Number(otherCosts) || 0
      }
    })
  } catch (error) {
    console.error("Error updating daily tofu data:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật dữ liệu chế biến đậu phụ"
    })
  }
}

// @desc    Get daily sausage processing data
// @route   GET /api/processing-station/sausage/:date
// @access  Private
export const getDailySausageData = async (req: Request, res: Response) => {
  try {
    const { date } = req.params
    const db = await getDb()

    // Get daily sausage processing data for the specific date
    const dailyData = await db.collection("dailySausageProcessing").findOne({
      date: date
    })

    if (!dailyData) {
      // Return default data if not found
      return res.status(200).json({
        success: true,
        data: {
          date: date,
          porkLeanInput: 0,
          porkFatInput: 0,
          sausageInput: 0,
          fishCakeInput: 0,
          note: ""
        }
      })
    }

    res.status(200).json({
      success: true,
      data: {
        date: dailyData.date,
        porkLeanInput: dailyData.porkLeanInput || 0,
        porkFatInput: dailyData.porkFatInput || 0,
        sausageInput: dailyData.sausageInput || 0,
        fishCakeInput: dailyData.fishCakeInput || 0,
        note: dailyData.note || ""
      }
    })
  } catch (error) {
    console.error("Error fetching daily sausage data:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy dữ liệu làm giò chả hàng ngày"
    })
  }
}

// @desc    Update daily sausage processing data
// @route   PATCH /api/processing-station/sausage/:date
// @access  Private (Admin, StationManager)
export const updateDailySausageData = async (req: Request, res: Response) => {
  try {
    const { date } = req.params
    const { porkLeanInput, porkFatInput, sausageInput, fishCakeInput, note } = req.body
    const db = await getDb()

    // Update or insert daily data
    const result = await db.collection("dailySausageProcessing").updateOne(
      { date: date },
      {
        $set: {
          date: date,
          porkLeanInput: Number(porkLeanInput) || 0,
          porkFatInput: Number(porkFatInput) || 0,
          sausageInput: Number(sausageInput) || 0,
          fishCakeInput: Number(fishCakeInput) || 0,
          note: note || "",
          updatedAt: new Date(),
          updatedBy: req.user._id
        },
        $setOnInsert: {
          createdAt: new Date(),
          createdBy: req.user._id
        }
      },
      { upsert: true }
    )

    res.status(200).json({
      success: true,
      message: "Cập nhật dữ liệu làm giò chả thành công",
      data: {
        date: date,
        porkLeanInput: Number(porkLeanInput) || 0,
        porkFatInput: Number(porkFatInput) || 0,
        sausageInput: Number(sausageInput) || 0,
        fishCakeInput: Number(fishCakeInput) || 0,
        note: note || ""
      }
    })
  } catch (error) {
    console.error("Error updating daily sausage data:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật dữ liệu làm giò chả"
    })
  }
}
