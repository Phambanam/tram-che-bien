import type { Request, Response } from "express"
import { ObjectId } from "mongodb"
import { getDb } from "../config/database"
import { AppError } from "../middleware/error.middleware"

// @desc    Get all supply outputs
// @route   GET /api/supply-outputs
// @access  Private
export const getAllSupplyOutputs = async (req: Request, res: Response) => {
  try {
    const { receivingUnit, productId, startDate, endDate, type, week, year } = req.query

    const db = await getDb()

    let query: any = {}

    if (receivingUnit && ObjectId.isValid(receivingUnit as string)) {
      query.receivingUnit = new ObjectId(receivingUnit as string)
    }

    if (productId && ObjectId.isValid(productId as string)) {
      query.productId = new ObjectId(productId as string)
    }

    if (startDate || endDate) {
      query.outputDate = {}
      if (startDate) {
        query.outputDate.$gte = new Date(startDate as string)
      }
      if (endDate) {
        // If endDate is just a date (YYYY-MM-DD), set it to end of day
        const endDateStr = endDate as string
        let endDateObj: Date
        
        if (endDateStr.length === 10 && !endDateStr.includes('T')) {
          // Date format like "2025-06-30", set to end of day
          endDateObj = new Date(endDateStr + 'T23:59:59.999Z')
        } else {
          // Already has time component
          endDateObj = new Date(endDateStr)
        }
        
        query.outputDate.$lte = endDateObj
      }
    }

    // Filter by type (planned or actual)
    if (type) {
      query.type = type
    }

    // Filter by planning week/year
    if (week && year) {
      query.planningWeek = Number(week)
      query.planningYear = Number(year)
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
          $unwind: {
            path: "$categoryInfo",
            preserveNullAndEmptyArrays: true,
          },
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
                name: { $ifNull: ["$categoryInfo.name", "Không xác định"] },
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
          $unwind: {
            path: "$categoryInfo",
            preserveNullAndEmptyArrays: true,
          },
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
                name: { $ifNull: ["$categoryInfo.name", "Không xác định"] },
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
        message: "Không tìm thấy nguồn xuất"
      })
    }

    res.status(200).json({
      success: true,
      data: supplyOutput[0],
    })
  } catch (error) {
    console.error("Error fetching supply output:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy thông tin nguồn xuất"
    })
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
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin"
      })
    }

    // Validate ObjectIds
    if (!ObjectId.isValid(receivingUnit) || !ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "ID đơn vị hoặc sản phẩm không hợp lệ"
      })
    }

    const db = await getDb()

    // Check if unit exists
    const unitExists = await db.collection("units").findOne({ _id: new ObjectId(receivingUnit) })
    if (!unitExists) {
      return res.status(400).json({
        success: false,
        message: "Đơn vị không tồn tại"
      })
    }

    // Check if product exists
    const productExists = await db.collection("products").findOne({ _id: new ObjectId(productId) })
    if (!productExists) {
      return res.status(400).json({
        success: false,
        message: "Sản phẩm không tồn tại"
      })
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
      return res.status(400).json({
        success: false,
        message: `Không đủ số lượng trong kho. Hiện có ${availableQuantity}kg, cần xuất ${quantity}kg`
      })
    }

    // Create new supply output
    const result = await db.collection("supplyOutputs").insertOne({
      type: "actual", // Mark as actual output (vs planned)
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
    console.error("Error creating supply output:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi thêm nguồn xuất"
    })
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
      return res.status(400).json({
        success: false,
        message: "ID nguồn xuất không hợp lệ"
      })
    }

    // Validate input
    if (!receivingUnit || !productId || !quantity || !outputDate || !receiver) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin"
      })
    }

    // Validate ObjectIds
    if (!ObjectId.isValid(receivingUnit) || !ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "ID đơn vị hoặc sản phẩm không hợp lệ"
      })
    }

    const db = await getDb()

    // Get current supply output
    const currentOutput = await db.collection("supplyOutputs").findOne({ _id: new ObjectId(outputId) })

    if (!currentOutput) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nguồn xuất"
      })
    }

    // Check if unit exists
    const unitExists = await db.collection("units").findOne({ _id: new ObjectId(receivingUnit) })
    if (!unitExists) {
      return res.status(400).json({
        success: false,
        message: "Đơn vị không tồn tại"
      })
    }

    // Check if product exists
    const productExists = await db.collection("products").findOne({ _id: new ObjectId(productId) })
    if (!productExists) {
      return res.status(400).json({
        success: false,
        message: "Sản phẩm không tồn tại"
      })
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
        return res.status(400).json({
          success: false,
          message: `Không đủ số lượng trong kho. Hiện có ${availableQuantity}kg, cần xuất ${quantity}kg`
        })
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
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nguồn xuất"
      })
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật nguồn xuất thành công",
    })
  } catch (error) {
    console.error("Error updating supply output:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật nguồn xuất"
    })
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
      return res.status(400).json({
        success: false,
        message: "ID nguồn xuất không hợp lệ"
      })
    }

    const db = await getDb()

    // Get current supply output
    const currentOutput = await db.collection("supplyOutputs").findOne({ _id: new ObjectId(outputId) })

    if (!currentOutput) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nguồn xuất"
      })
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
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nguồn xuất"
      })
    }

    res.status(200).json({
      success: true,
      message: "Xóa nguồn xuất thành công",
    })
  } catch (error) {
    console.error("Error deleting supply output:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi xóa nguồn xuất"
    })
  }
}

// @desc    Generate and save planned supply outputs from menu planning
// @route   POST /api/supply-outputs/generate-planned
// @access  Private (Brigade Assistant only)
export const generatePlannedOutputs = async (req: Request, res: Response) => {
  try {
    const { week, year, overwriteExisting = false } = req.body

    if (!week || !year) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp tuần và năm"
      })
    }

    const db = await getDb()

    // Get menu planning data for the week
    const menuPlanningResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:5001'}/api/menu-planning/ingredient-summaries?week=${week}&year=${year}&showAllDays=true`)
    const menuData = await menuPlanningResponse.json()

    if (!menuData.success || !menuData.data || menuData.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không có dữ liệu thực đơn cho tuần này"
      })
    }

    // Get units and their personnel data
    const units = await db.collection("units").find({}).toArray()
    const unitsPersonnel = {}
    
    for (const unit of units) {
      unitsPersonnel[unit._id.toString()] = unit.personnel || 100 // Default 100 if not set
    }

    // Get personnel by day data
    const startDate = new Date(year, 0, 1 + (week - 1) * 7)
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 6)
    
    const personnelByDayResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:5001'}/api/unit-personnel-daily/week?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`)
    let personnelByDay = {}
    
    try {
      const personnelData = await personnelByDayResponse.json()
      if (personnelData.success) {
        personnelByDay = personnelData.data
      }
    } catch (e) {
      console.log("Using default personnel data")
    }

    const plannedOutputs = []

    // Process each day's ingredients
    for (const dailySummary of menuData.data) {
      const dayPersonnelData = personnelByDay[dailySummary.date] || {}
      
      for (const ingredient of dailySummary.ingredients) {
        // Find matching product in database
        const product = await db.collection("products").findOne({
          $or: [
            { name: { $regex: ingredient.lttpName, $options: 'i' } },
            { lttpId: ingredient.lttpId }
          ]
        })

        if (!product) {
          console.log(`Product not found for ingredient: ${ingredient.lttpName}`)
          continue
        }

        // Calculate requirements for each unit
        for (const unit of units) {
          const unitPersonnel = dayPersonnelData[unit._id.toString()] || unitsPersonnel[unit._id.toString()]
          
          if (unitPersonnel > 0) {
            // Calculate requirement: (personnel * quantity per 100 people) / 100
            const plannedQuantity = (unitPersonnel * ingredient.totalQuantity) / 100

            if (plannedQuantity > 0) {
              // Check if planned output already exists for this combination
              const existingPlanned = await db.collection("supplyOutputs").findOne({
                type: "planned",
                receivingUnit: unit._id,
                productId: product._id,
                outputDate: new Date(dailySummary.date),
                planningWeek: week,
                planningYear: year
              })

              if (existingPlanned && !overwriteExisting) {
                continue // Skip if already exists and not overwriting
              }

              const plannedOutput = {
                type: "planned", // New field to distinguish from actual outputs
                receivingUnit: unit._id,
                productId: product._id,
                quantity: Number(plannedQuantity.toFixed(2)),
                outputDate: new Date(dailySummary.date),
                receiver: `${unit.name} - Kế hoạch`,
                status: "planned",
                note: `Tự động tạo từ thực đơn tuần ${week}/${year}. Dùng trong: ${ingredient.usedInDishes.join(', ')}`,
                planningWeek: week,
                planningYear: year,
                planningSource: "menu", // Could be "menu" or "rations"
                sourceIngredient: {
                  lttpId: ingredient.lttpId,
                  lttpName: ingredient.lttpName,
                  category: ingredient.category,
                  usedInDishes: ingredient.usedInDishes
                },
                unitPersonnel: unitPersonnel,
                createdBy: new ObjectId(req.user!.id),
                createdAt: new Date(),
                updatedAt: new Date(),
              }

              if (existingPlanned && overwriteExisting) {
                // Update existing
                await db.collection("supplyOutputs").updateOne(
                  { _id: existingPlanned._id },
                  {
                    $set: {
                      ...plannedOutput,
                      updatedAt: new Date()
                    }
                  }
                )
              } else {
                // Insert new
                plannedOutputs.push(plannedOutput)
              }
            }
          }
        }
      }
    }

    // Bulk insert new planned outputs
    if (plannedOutputs.length > 0) {
      await db.collection("supplyOutputs").insertMany(plannedOutputs)
    }

    res.status(201).json({
      success: true,
      message: `Đã tạo ${plannedOutputs.length} kế hoạch xuất cho tuần ${week}/${year}`,
      data: {
        createdCount: plannedOutputs.length,
        week,
        year,
        days: menuData.data.length
      }
    })

  } catch (error) {
    console.error("Error generating planned outputs:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi tạo kế hoạch xuất"
    })
  }
}

// @desc    Get planned vs actual comparison
// @route   GET /api/supply-outputs/planned-vs-actual
// @access  Private
export const getPlannedVsActual = async (req: Request, res: Response) => {
  try {
    const { week, year, unitId, productId } = req.query

    if (!week || !year) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp tuần và năm"
      })
    }

    const db = await getDb()

    let matchQuery: any = {
      planningWeek: Number(week),
      planningYear: Number(year)
    }

    if (unitId && ObjectId.isValid(unitId as string)) {
      matchQuery.receivingUnit = new ObjectId(unitId as string)
    }

    if (productId && ObjectId.isValid(productId as string)) {
      matchQuery.productId = new ObjectId(productId as string)
    }

    // Get planned and actual outputs
    const comparison = await db
      .collection("supplyOutputs")
      .aggregate([
        {
          $match: matchQuery
        },
        {
          $lookup: {
            from: "units",
            localField: "receivingUnit",
            foreignField: "_id",
            as: "unitInfo"
          }
        },
        {
          $lookup: {
            from: "products",
            localField: "productId", 
            foreignField: "_id",
            as: "productInfo"
          }
        },
        {
          $unwind: "$unitInfo"
        },
        {
          $unwind: "$productInfo"
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$outputDate" } },
              unitId: "$receivingUnit",
              unitName: "$unitInfo.name",
              productId: "$productId",
              productName: "$productInfo.name"
            },
            plannedQuantity: {
              $sum: {
                $cond: [{ $eq: ["$type", "planned"] }, "$quantity", 0]
              }
            },
            actualQuantity: {
              $sum: {
                $cond: [{ $eq: ["$type", "actual"] }, "$quantity", 0]
              }
            },
            plannedCount: {
              $sum: {
                $cond: [{ $eq: ["$type", "planned"] }, 1, 0]
              }
            },
            actualCount: {
              $sum: {
                $cond: [{ $eq: ["$type", "actual"] }, 1, 0]
              }
            }
          }
        },
        {
          $project: {
            date: "$_id.date",
            unit: {
              id: { $toString: "$_id.unitId" },
              name: "$_id.unitName"
            },
            product: {
              id: { $toString: "$_id.productId" },
              name: "$_id.productName"
            },
            plannedQuantity: 1,
            actualQuantity: 1,
            variance: { $subtract: ["$actualQuantity", "$plannedQuantity"] },
            variancePercent: {
              $cond: [
                { $gt: ["$plannedQuantity", 0] },
                { 
                  $multiply: [
                    { $divide: [{ $subtract: ["$actualQuantity", "$plannedQuantity"] }, "$plannedQuantity"] },
                    100
                  ]
                },
                null
              ]
            },
            hasPlanned: { $gt: ["$plannedCount", 0] },
            hasActual: { $gt: ["$actualCount", 0] }
          }
        },
        {
          $sort: { date: 1, "unit.name": 1, "product.name": 1 }
        }
      ])
      .toArray()

    res.status(200).json({
      success: true,
      data: comparison,
      summary: {
        totalItems: comparison.length,
        withPlanned: comparison.filter(item => item.hasPlanned).length,
        withActual: comparison.filter(item => item.hasActual).length,
        withBoth: comparison.filter(item => item.hasPlanned && item.hasActual).length
      }
    })

  } catch (error) {
    console.error("Error getting planned vs actual:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy dữ liệu so sánh"
    })
  }
}

// @desc    Update planned supply output
// @route   PATCH /api/supply-outputs/planned/:id
// @access  Private (Brigade Assistant only)
export const updatePlannedOutput = async (req: Request, res: Response) => {
  try {
    const outputId = req.params.id
    const { quantity, note, status } = req.body

    if (!ObjectId.isValid(outputId)) {
      return res.status(400).json({
        success: false,
        message: "ID không hợp lệ"
      })
    }

    const db = await getDb()

    // Find planned output
    const plannedOutput = await db.collection("supplyOutputs").findOne({
      _id: new ObjectId(outputId),
      type: "planned"
    })

    if (!plannedOutput) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy kế hoạch xuất"
      })
    }

    // Update planned output
    const updateData: any = {
      updatedAt: new Date(),
      updatedBy: new ObjectId(req.user!.id)
    }

    if (quantity !== undefined) {
      updateData.quantity = Number(quantity)
    }

    if (note !== undefined) {
      updateData.note = note
    }

    if (status !== undefined) {
      updateData.status = status
    }

    await db.collection("supplyOutputs").updateOne(
      { _id: new ObjectId(outputId) },
      { $set: updateData }
    )

    res.status(200).json({
      success: true,
      message: "Cập nhật kế hoạch xuất thành công"
    })

  } catch (error) {
    console.error("Error updating planned output:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật kế hoạch xuất"
    })
  }
}
