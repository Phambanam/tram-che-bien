import type { Request, Response } from "express"
import { ObjectId } from "mongodb"
import { getDb } from "../config/database"
import { AppError } from "../middleware/error.middleware"

// @desc    Get all supply outputs
// @route   GET /api/supply-outputs
// @access  Private
export const getAllSupplyOutputs = async (req: Request, res: Response) => {
  try {
    const { receivingUnit, productId, startDate, endDate } = req.query

    const db = await getDb()

    let query = {}

    if (receivingUnit && ObjectId.isValid(receivingUnit as string)) {
      query = { ...query, receivingUnit: new ObjectId(receivingUnit as string) }
    }

    if (productId && ObjectId.isValid(productId as string)) {
      query = { ...query, productId: new ObjectId(productId as string) }
    }

    if (startDate || endDate) {
      query = { ...query, outputDate: {} }
      if (startDate) {
        query.outputDate = { ...query.outputDate, $gte: new Date(startDate as string) }
      }
      if (endDate) {
        query.outputDate = { ...query.outputDate, $lte: new Date(endDate as string) }
      }
    }

    // Get supply outputs with related information
    const supplyOutputs = await db
      .collection("supplyOutputs")
      .aggregate([
        {
          $match: query,
        },
        {
          $lookup: {
            from: "units",
            localField: "receivingUnit",
            foreignField: "_id",
            as: "unitInfo",
          },
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
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "createdByInfo",
          },
        },
        {
          $unwind: "$unitInfo",
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
            receivingUnit: {
              id: { $toString: "$receivingUnit" },
              name: "$unitInfo.name",
            },
            product: {
              id: { $toString: "$productId" },
              name: "$productInfo.name",
              category: {
                id: { $toString: "$categoryInfo._id" },
                name: "$categoryInfo.name",
              },
            },
            quantity: 1,
            outputDate: 1,
            receiver: 1,
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
            createdAt: 1,
            updatedAt: 1,
          },
        },
        {
          $sort: { outputDate: -1 },
        },
      ])
      .toArray()

    res.status(200).json({
      success: true,
      count: supplyOutputs.length,
      data: supplyOutputs,
    })
  } catch (error) {
    console.error("Error fetching supply outputs:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy danh sách nguồn xuất"
    })
  }
}

// @desc    Get supply output by ID
// @route   GET /api/supply-outputs/:id
// @access  Private
export const getSupplyOutputById = async (req: Request, res: Response) => {
  try {
    const outputId = req.params.id

    // Validate ObjectId
    if (!ObjectId.isValid(outputId)) {
      return res.status(400).json({
        success: false,
        message: "ID nguồn xuất không hợp lệ"
      })
    }

    const db = await getDb()

    // Get supply output with related information
    const supplyOutput = await db
      .collection("supplyOutputs")
      .aggregate([
        {
          $match: { _id: new ObjectId(outputId) },
        },
        {
          $lookup: {
            from: "units",
            localField: "receivingUnit",
            foreignField: "_id",
            as: "unitInfo",
          },
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
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "createdByInfo",
          },
        },
        {
          $unwind: "$unitInfo",
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
            receivingUnit: {
              id: { $toString: "$receivingUnit" },
              name: "$unitInfo.name",
            },
            product: {
              id: { $toString: "$productId" },
              name: "$productInfo.name",
              category: {
                id: { $toString: "$categoryInfo._id" },
                name: "$categoryInfo.name",
              },
            },
            quantity: 1,
            outputDate: 1,
            receiver: 1,
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
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ])
      .toArray()

    if (!supplyOutput || supplyOutput.length === 0) {
      return res.status(404).json({
        success: false,
      throw new AppError("Không tìm thấy nguồn xuất", 404)
    }

    res.status(200).json({
      success: true,
      data: supplyOutput[0],
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error fetching supply output:", error)
    throw new AppError("Đã xảy ra lỗi khi lấy thông tin nguồn xuất", 500)
  }
}

// @desc    Create new supply output
// @route   POST /api/supply-outputs
// @access  Private (Admin only)
export const createSupplyOutput = async (req: Request, res: Response) => {
  try {
    const { receivingUnit, productId, quantity, outputDate, receiver, note } = req.body

    // Validate input
    if (!receivingUnit || !productId || !quantity || !outputDate || !receiver) {
      throw new AppError("Vui lòng điền đầy đủ thông tin", 400)
    }

    // Validate ObjectIds
    if (!ObjectId.isValid(receivingUnit) || !ObjectId.isValid(productId)) {
      throw new AppError("ID đơn vị hoặc sản phẩm không hợp lệ", 400)
    }

    const db = await getDb()

    // Check if unit exists
    const unitExists = await db.collection("units").findOne({ _id: new ObjectId(receivingUnit) })
    if (!unitExists) {
      throw new AppError("Đơn vị không tồn tại", 400)
    }

    // Check if product exists
    const productExists = await db.collection("products").findOne({ _id: new ObjectId(productId) })
    if (!productExists) {
      throw new AppError("Sản phẩm không tồn tại", 400)
    }

    // Check if there is enough inventory
    const inventory = await db
      .collection("processingStation")
      .aggregate([
        {
          $match: {
            type: "food",
            productId: new ObjectId(productId),
            nonExpiredQuantity: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: "$productId",
            totalNonExpired: { $sum: "$nonExpiredQuantity" },
          },
        },
      ])
      .toArray()

    const availableQuantity = inventory.length > 0 ? inventory[0].totalNonExpired : 0

    if (availableQuantity < quantity) {
      throw new AppError(`Không đủ số lượng trong kho. Hiện có ${availableQuantity}kg, cần xuất ${quantity}kg`, 400)
    }

    // Create new supply output
    const result = await db.collection("supplyOutputs").insertOne({
      receivingUnit: new ObjectId(receivingUnit),
      productId: new ObjectId(productId),
      quantity: Number(quantity),
      outputDate: new Date(outputDate),
      receiver,
      status: "completed",
      note: note || "",
      createdBy: new ObjectId(req.user!.id),
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Update inventory (reduce from non-expired items)
    let remainingQuantity = Number(quantity)
    const inventoryItems = await db
      .collection("processingStation")
      .find({
        type: "food",
        productId: new ObjectId(productId),
        nonExpiredQuantity: { $gt: 0 },
      })
      .sort({ expiryDate: 1 }) // Use oldest items first
      .toArray()

    for (const item of inventoryItems) {
      if (remainingQuantity <= 0) break

      const reduceAmount = Math.min(item.nonExpiredQuantity, remainingQuantity)
      remainingQuantity -= reduceAmount

      await db.collection("processingStation").updateOne(
        { _id: item._id },
        {
          $inc: { nonExpiredQuantity: -reduceAmount, quantity: -reduceAmount },
          $set: { updatedAt: new Date() },
        },
      )
    }

    res.status(201).json({
      success: true,
      message: "Thêm nguồn xuất thành công",
      supplyOutputId: result.insertedId.toString(),
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error creating supply output:", error)
    throw new AppError("Đã xảy ra lỗi khi thêm nguồn xuất", 500)
  }
}

// @desc    Update supply output
// @route   PATCH /api/supply-outputs/:id
// @access  Private (Admin only)
export const updateSupplyOutput = async (req: Request, res: Response) => {
  try {
    const outputId = req.params.id
    const { receivingUnit, productId, quantity, outputDate, receiver, status, note } = req.body

    // Validate ObjectId
    if (!ObjectId.isValid(outputId)) {
      throw new AppError("ID nguồn xuất không hợp lệ", 400)
    }

    // Validate input
    if (!receivingUnit || !productId || !quantity || !outputDate || !receiver) {
      throw new AppError("Vui lòng điền đầy đủ thông tin", 400)
    }

    // Validate ObjectIds
    if (!ObjectId.isValid(receivingUnit) || !ObjectId.isValid(productId)) {
      throw new AppError("ID đơn vị hoặc sản phẩm không hợp lệ", 400)
    }

    const db = await getDb()

    // Get current supply output
    const currentOutput = await db.collection("supplyOutputs").findOne({ _id: new ObjectId(outputId) })

    if (!currentOutput) {
      throw new AppError("Không tìm thấy nguồn xuất", 404)
    }

    // Check if unit exists
    const unitExists = await db.collection("units").findOne({ _id: new ObjectId(receivingUnit) })
    if (!unitExists) {
      throw new AppError("Đơn vị không tồn tại", 400)
    }

    // Check if product exists
    const productExists = await db.collection("products").findOne({ _id: new ObjectId(productId) })
    if (!productExists) {
      throw new AppError("Sản phẩm không tồn tại", 400)
    }

    // If product or quantity changed, check inventory and update
    if (productId !== currentOutput.productId.toString() || Number(quantity) !== currentOutput.quantity) {
      // Return previous quantity to inventory
      await db.collection("processingStation").updateOne(
        {
          type: "food",
          productId: currentOutput.productId,
          expiryDate: { $gt: new Date() },
        },
        {
          $inc: { nonExpiredQuantity: currentOutput.quantity, quantity: currentOutput.quantity },
          $set: { updatedAt: new Date() },
        },
      )

      // Check if there is enough inventory for new product/quantity
      const inventory = await db
        .collection("processingStation")
        .aggregate([
          {
            $match: {
              type: "food",
              productId: new ObjectId(productId),
              nonExpiredQuantity: { $gt: 0 },
            },
          },
          {
            $group: {
              _id: "$productId",
              totalNonExpired: { $sum: "$nonExpiredQuantity" },
            },
          },
        ])
        .toArray()

      const availableQuantity = inventory.length > 0 ? inventory[0].totalNonExpired : 0

      if (availableQuantity < Number(quantity)) {
        throw new AppError(`Không đủ số lượng trong kho. Hiện có ${availableQuantity}kg, cần xuất ${quantity}kg`, 400)
      }

      // Update inventory with new quantity
      let remainingQuantity = Number(quantity)
      const inventoryItems = await db
        .collection("processingStation")
        .find({
          type: "food",
          productId: new ObjectId(productId),
          nonExpiredQuantity: { $gt: 0 },
        })
        .sort({ expiryDate: 1 }) // Use oldest items first
        .toArray()

      for (const item of inventoryItems) {
        if (remainingQuantity <= 0) break

        const reduceAmount = Math.min(item.nonExpiredQuantity, remainingQuantity)
        remainingQuantity -= reduceAmount

        await db.collection("processingStation").updateOne(
          { _id: item._id },
          {
            $inc: { nonExpiredQuantity: -reduceAmount, quantity: -reduceAmount },
            $set: { updatedAt: new Date() },
          },
        )
      }
    }

    // Update supply output
    const result = await db.collection("supplyOutputs").updateOne(
      { _id: new ObjectId(outputId) },
      {
        $set: {
          receivingUnit: new ObjectId(receivingUnit),
          productId: new ObjectId(productId),
          quantity: Number(quantity),
          outputDate: new Date(outputDate),
          receiver,
          status: status || "completed",
          note: note || "",
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      throw new AppError("Không tìm thấy nguồn xuất", 404)
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật nguồn xuất thành công",
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error updating supply output:", error)
    throw new AppError("Đã xảy ra lỗi khi cập nhật nguồn xuất", 500)
  }
}

// @desc    Delete supply output
// @route   DELETE /api/supply-outputs/:id
// @access  Private (Admin only)
export const deleteSupplyOutput = async (req: Request, res: Response) => {
  try {
    const outputId = req.params.id

    // Validate ObjectId
    if (!ObjectId.isValid(outputId)) {
      throw new AppError("ID nguồn xuất không hợp lệ", 400)
    }

    const db = await getDb()

    // Get current supply output
    const currentOutput = await db.collection("supplyOutputs").findOne({ _id: new ObjectId(outputId) })

    if (!currentOutput) {
      throw new AppError("Không tìm thấy nguồn xuất", 404)
    }

    // Return quantity to inventory
    await db.collection("processingStation").updateOne(
      {
        type: "food",
        productId: currentOutput.productId,
        expiryDate: { $gt: new Date() },
      },
      {
        $inc: { nonExpiredQuantity: currentOutput.quantity, quantity: currentOutput.quantity },
        $set: { updatedAt: new Date() },
      },
    )

    // Delete supply output
    const result = await db.collection("supplyOutputs").deleteOne({ _id: new ObjectId(outputId) })

    if (result.deletedCount === 0) {
      throw new AppError("Không tìm thấy nguồn xuất", 404)
    }

    res.status(200).json({
      success: true,
      message: "Xóa nguồn xuất thành công",
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error deleting supply output:", error)
    throw new AppError("Đã xảy ra lỗi khi xóa nguồn xuất", 500)
  }
}
