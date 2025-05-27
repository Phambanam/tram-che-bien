import type { Request, Response } from "express"
import { ObjectId } from "mongodb"
import { getDb } from "../config/database"
import { AppError } from "../middleware/error.middleware"

// @desc    Get all supplies
// @route   GET /api/supplies
// @access  Private
export const getSupplies = async (req: Request, res: Response) => {
  try {
    const { unit, category, status, fromDate, toDate } = req.query

    const db = await getDb()

    // Build query based on role and filters
    const query: any = {}

    // Unit assistants can only see their own unit's supplies
    if (req.user!.role === "unitAssistant") {
      query.unit = new ObjectId(req.user!.unit)
    }
    // Filter by unit if specified
    else if (unit && ObjectId.isValid(unit as string)) {
      query.unit = new ObjectId(unit as string)
    }

    // Filter by category if specified
    if (category && ObjectId.isValid(category as string)) {
      query.category = new ObjectId(category as string)
    }

    // Filter by status if specified
    if (status) {
      query.status = status
    }

    // Filter by harvest date range if specified
    if (fromDate || toDate) {
      query.harvestDate = {}
      if (fromDate) {
        query.harvestDate.$gte = new Date(fromDate as string)
      }
      if (toDate) {
        query.harvestDate.$lte = new Date(toDate as string)
      }
    }

    // Get supplies with related information
    const supplies = await db
      .collection("supplies")
      .aggregate([
        {
          $match: query,
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
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "categoryInfo",
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "product",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "createdByInfo",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "approvedBy",
            foreignField: "_id",
            as: "approvedByInfo",
          },
        },
        {
          $unwind: "$unitInfo",
        },
        {
          $unwind: "$categoryInfo",
        },
        {
          $unwind: "$productInfo",
        },
        {
          $unwind: {
            path: "$createdByInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: "$approvedByInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            id: { $toString: "$_id" },
            unit: {
              _id: { $toString: "$unit" },
              name: "$unitInfo.name",
            },
            category: {
              _id: { $toString: "$category" },
              name: "$categoryInfo.name",
            },
            product: {
              _id: { $toString: "$product" },
              name: "$productInfo.name",
            },
            quantity: 1,
            harvestDate: 1,
            stationEntryDate: 1,
            receivedQuantity: 1,
            status: 1,
            note: 1,
            createdBy: {
              $cond: [
                { $ifNull: ["$createdByInfo", false] },
                {
                  id: { $toString: "$createdBy" },
                  name: "$createdByInfo.fullName",
                },
                null,
              ],
            },
            approvedBy: {
              $cond: [
                { $ifNull: ["$approvedByInfo", false] },
                {
                  id: { $toString: "$approvedBy" },
                  name: "$approvedByInfo.fullName",
                },
                null,
              ],
            },
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ])
      .toArray()

    res.status(200).json({
      success: true,
      count: supplies.length,
      data: supplies,
    })
  } catch (error) {
    console.error("Error fetching supplies:", error)
    throw new AppError("Đã xảy ra lỗi khi lấy danh sách nguồn nhập", 500)
  }
}

// @desc    Create new supply
// @route   POST /api/supplies
// @access  Private (Unit Assistant, Admin)
export const createSupply = async (req: Request, res: Response) => {
  try {
    const { category, product, quantity, harvestDate, note } = req.body

    // Validate input
    if (!category || !product || !quantity || !harvestDate) {
      throw new AppError("Vui lòng điền đầy đủ thông tin", 400)
    }

    // Validate ObjectIds
    if (!ObjectId.isValid(category) || !ObjectId.isValid(product)) {
      throw new AppError("ID phân loại hoặc sản phẩm không hợp lệ", 400)
    }

    const db = await getDb()

    // Check if category exists
    const categoryExists = await db.collection("categories").findOne({ _id: new ObjectId(category) })
    if (!categoryExists) {
      throw new AppError("Phân loại không tồn tại", 400)
    }

    // Check if product exists
    const productExists = await db.collection("products").findOne({ _id: new ObjectId(product) })
    if (!productExists) {
      throw new AppError("Sản phẩm không tồn tại", 400)
    }

    // Determine unit based on role
    let unitId = null
    if (req.user!.role === "unitAssistant") {
      unitId = new ObjectId(req.user!.unit)
    } else if (req.user!.role === "admin") {
      // Admin needs to specify unit
      const { unit } = req.body
      if (!unit || !ObjectId.isValid(unit)) {
        throw new AppError("Vui lòng chọn đơn vị", 400)
      }
      unitId = new ObjectId(unit)
    }

    // Create new supply
    const result = await db.collection("supplies").insertOne({
      unit: unitId,
      category: new ObjectId(category),
      product: new ObjectId(product),
      quantity: Number(quantity),
      harvestDate: new Date(harvestDate),
      stationEntryDate: null,
      receivedQuantity: null,
      status: "pending",
      note: note || "",
      createdBy: new ObjectId(req.user!.id),
      approvedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    res.status(201).json({
      success: true,
      message: "Thêm nguồn nhập thành công",
      supplyId: result.insertedId.toString(),
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error creating supply:", error)
    throw new AppError("Đã xảy ra lỗi khi thêm nguồn nhập", 500)
  }
}

// @desc    Get supply by ID
// @route   GET /api/supplies/:id
// @access  Private
export const getSupplyById = async (req: Request, res: Response) => {
  try {
    const supplyId = req.params.id

    // Validate ObjectId
    if (!ObjectId.isValid(supplyId)) {
      throw new AppError("ID nguồn nhập không hợp lệ", 400)
    }

    const db = await getDb()

    // Get supply with related information
    const supply = await db
      .collection("supplies")
      .aggregate([
        {
          $match: { _id: new ObjectId(supplyId) },
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
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "categoryInfo",
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "product",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "createdByInfo",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "approvedBy",
            foreignField: "_id",
            as: "approvedByInfo",
          },
        },
        {
          $unwind: "$unitInfo",
        },
        {
          $unwind: "$categoryInfo",
        },
        {
          $unwind: "$productInfo",
        },
        {
          $unwind: {
            path: "$createdByInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: "$approvedByInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            id: { $toString: "$_id" },
            unit: {
              _id: { $toString: "$unit" },
              name: "$unitInfo.name",
            },
            category: {
              _id: { $toString: "$category" },
              name: "$categoryInfo.name",
            },
            product: {
              _id: { $toString: "$product" },
              name: "$productInfo.name",
            },
            quantity: 1,
            harvestDate: 1,
            stationEntryDate: 1,
            receivedQuantity: 1,
            status: 1,
            note: 1,
            createdBy: {
              $cond: [
                { $ifNull: ["$createdByInfo", false] },
                {
                  id: { $toString: "$createdBy" },
                  name: "$createdByInfo.fullName",
                },
                null,
              ],
            },
            approvedBy: {
              $cond: [
                { $ifNull: ["$approvedByInfo", false] },
                {
                  id: { $toString: "$approvedBy" },
                  name: "$approvedByInfo.fullName",
                },
                null,
              ],
            },
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ])
      .toArray()

    if (!supply || supply.length === 0) {
      throw new AppError("Không tìm thấy nguồn nhập", 404)
    }

    // Check if user has access to this supply
    if (req.user!.role === "unitAssistant" && supply[0].unit._id !== req.user!.unit) {
      throw new AppError("Bạn không có quyền xem nguồn nhập này", 403)
    }

    res.status(200).json({
      success: true,
      data: supply[0],
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error fetching supply:", error)
    throw new AppError("Đã xảy ra lỗi khi lấy thông tin nguồn nhập", 500)
  }
}

// @desc    Update supply
// @route   PATCH /api/supplies/:id
// @access  Private (Unit Assistant for own supplies, Admin for all)
export const updateSupply = async (req: Request, res: Response) => {
  try {
    const supplyId = req.params.id

    // Validate ObjectId
    if (!ObjectId.isValid(supplyId)) {
      throw new AppError("ID nguồn nhập không hợp lệ", 400)
    }

    const db = await getDb()

    // Get current supply
    const currentSupply = await db.collection("supplies").findOne({ _id: new ObjectId(supplyId) })

    if (!currentSupply) {
      throw new AppError("Không tìm thấy nguồn nhập", 404)
    }

    // Check permissions based on role and supply status
    if (req.user!.role === "unitAssistant") {
      // Unit assistants can only update their own supplies in pending status
      if (currentSupply.unit.toString() !== req.user!.unit) {
        throw new AppError("Bạn không có quyền cập nhật nguồn nhập này", 403)
      }

      if (currentSupply.status !== "pending") {
        throw new AppError("Chỉ có thể chỉnh sửa nguồn nhập ở trạng thái chờ phê duyệt", 400)
      }

      const { category, product, quantity, harvestDate, note } = req.body

      // Validate input
      if (!category || !product || !quantity || !harvestDate) {
        throw new AppError("Vui lòng điền đầy đủ thông tin", 400)
      }

      // Update supply
      const result = await db.collection("supplies").updateOne(
        { _id: new ObjectId(supplyId) },
        {
          $set: {
            category: new ObjectId(category),
            product: new ObjectId(product),
            quantity: Number(quantity),
            harvestDate: new Date(harvestDate),
            note: note || "",
            updatedAt: new Date(),
          },
        },
      )

      if (result.modifiedCount === 0) {
        throw new AppError("Không có thay đổi nào được thực hiện", 400)
      }

      res.status(200).json({
        success: true,
        message: "Cập nhật nguồn nhập thành công",
      })
    } else if (req.user!.role === "admin") {
      // Admin can update any supply
      const { category, product, quantity, harvestDate, note, status } = req.body

      const updateData: any = {
        updatedAt: new Date(),
      }

      if (category) updateData.category = new ObjectId(category)
      if (product) updateData.product = new ObjectId(product)
      if (quantity) updateData.quantity = Number(quantity)
      if (harvestDate) updateData.harvestDate = new Date(harvestDate)
      if (note !== undefined) updateData.note = note
      if (status) updateData.status = status

      const result = await db.collection("supplies").updateOne({ _id: new ObjectId(supplyId) }, { $set: updateData })

      if (result.modifiedCount === 0) {
        throw new AppError("Không có thay đổi nào được thực hiện", 400)
      }

      res.status(200).json({
        success: true,
        message: "Cập nhật nguồn nhập thành công",
      })
    } else {
      throw new AppError("Bạn không có quyền cập nhật nguồn nhập", 403)
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error updating supply:", error)
    throw new AppError("Đã xảy ra lỗi khi cập nhật nguồn nhập", 500)
  }
}

// @desc    Approve supply
// @route   PATCH /api/supplies/:id/approve
// @access  Private (Brigade Assistant, Admin)
export const approveSupply = async (req: Request, res: Response) => {
  try {
    const supplyId = req.params.id
    const { stationEntryDate, receivedQuantity, note } = req.body

    // Validate ObjectId
    if (!ObjectId.isValid(supplyId)) {
      throw new AppError("ID nguồn nhập không hợp lệ", 400)
    }

    // Validate input
    if (!stationEntryDate || receivedQuantity === undefined) {
      throw new AppError("Vui lòng điền đầy đủ thông tin ngày nhập trạm và số lượng nhận", 400)
    }

    const db = await getDb()

    // Get current supply
    const currentSupply = await db.collection("supplies").findOne({ _id: new ObjectId(supplyId) })

    if (!currentSupply) {
      throw new AppError("Không tìm thấy nguồn nhập", 404)
    }

    if (currentSupply.status !== "pending") {
      throw new AppError("Chỉ có thể phê duyệt nguồn nhập ở trạng thái chờ phê duyệt", 400)
    }

    // Update supply with approval information
    const result = await db.collection("supplies").updateOne(
      { _id: new ObjectId(supplyId) },
      {
        $set: {
          stationEntryDate: new Date(stationEntryDate),
          receivedQuantity: Number(receivedQuantity),
          note: note || currentSupply.note,
          status: "approved",
          approvedBy: new ObjectId(req.user!.id),
          updatedAt: new Date(),
        },
      },
    )

    if (result.modifiedCount === 0) {
      throw new AppError("Không có thay đổi nào được thực hiện", 400)
    }

    res.status(200).json({
      success: true,
      message: "Phê duyệt nguồn nhập thành công",
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error approving supply:", error)
    throw new AppError("Đã xảy ra lỗi khi phê duyệt nguồn nhập", 500)
  }
}

// @desc    Delete supply (soft delete)
// @route   DELETE /api/supplies/:id
// @access  Private (Unit Assistant for own supplies, Admin for all)
export const deleteSupply = async (req: Request, res: Response) => {
  try {
    const supplyId = req.params.id

    // Validate ObjectId
    if (!ObjectId.isValid(supplyId)) {
      throw new AppError("ID nguồn nhập không hợp lệ", 400)
    }

    const db = await getDb()

    // Get current supply
    const currentSupply = await db.collection("supplies").findOne({ _id: new ObjectId(supplyId) })

    if (!currentSupply) {
      throw new AppError("Không tìm thấy nguồn nhập", 404)
    }

    // Check permissions
    if (req.user!.role === "unitAssistant") {
      // Unit assistants can only delete their own supplies in pending status
      if (currentSupply.unit.toString() !== req.user!.unit) {
        throw new AppError("Bạn không có quyền xóa nguồn nhập này", 403)
      }

      if (currentSupply.status !== "pending") {
        throw new AppError("Chỉ có thể xóa nguồn nhập ở trạng thái chờ phê duyệt", 400)
      }
    } else if (req.user!.role !== "admin") {
      throw new AppError("Bạn không có quyền xóa nguồn nhập", 403)
    }

    // Soft delete by changing status
    const result = await db.collection("supplies").updateOne(
      { _id: new ObjectId(supplyId) },
      {
        $set: {
          status: "deleted",
          updatedAt: new Date(),
        },
      },
    )

    if (result.modifiedCount === 0) {
      throw new AppError("Không có thay đổi nào được thực hiện", 400)
    }

    res.status(200).json({
      success: true,
      message: "Xóa nguồn nhập thành công",
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error deleting supply:", error)
    throw new AppError("Đã xảy ra lỗi khi xóa nguồn nhập", 500)
  }
}
