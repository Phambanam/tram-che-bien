import type { Request, Response } from "express"
import { ObjectId } from "mongodb"
import { getDb } from "../config/database"
import { AppError } from "../middleware/error.middleware"

// @desc    Get report by unit
// @route   GET /api/reports/by-unit
// @access  Private (Admin, Brigade Assistant, Commander)
export const getReportByUnit = async (req: Request, res: Response) => {
  try {
    const { fromDate, toDate } = req.query

    const db = await getDb()

    // Build date filter
    let dateFilter = {}
    if (fromDate || toDate) {
      dateFilter = {}
      if (fromDate) {
        dateFilter = { ...dateFilter, $gte: new Date(fromDate as string) }
      }
      if (toDate) {
        dateFilter = { ...dateFilter, $lte: new Date(toDate as string) }
      }
    }

    // Aggregate supplies by unit
    const reportByUnit = await db
      .collection("supplies")
      .aggregate([
        {
          $match: {
            status: "approved",
            ...(Object.keys(dateFilter).length > 0 ? { harvestDate: dateFilter } : {}),
          },
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
          $group: {
            _id: "$unit",
            unitName: { $first: "$unitInfo.name" },
            totalProducts: { $sum: 1 },
            totalSupplied: { $sum: "$quantity" },
            totalReceived: { $sum: "$receivedQuantity" },
          },
        },
        {
          $project: {
            _id: { $toString: "$_id" },
            unitName: 1,
            totalProducts: 1,
            totalSupplied: 1,
            totalReceived: 1,
            difference: { $subtract: ["$totalSupplied", "$totalReceived"] },
            percentReceived: {
              $cond: [
                { $eq: ["$totalSupplied", 0] },
                0,
                { $multiply: [{ $divide: ["$totalReceived", "$totalSupplied"] }, 100] },
              ],
            },
          },
        },
        {
          $sort: { unitName: 1 },
        },
      ])
      .toArray()

    // Calculate totals
    const totals = reportByUnit.reduce(
      (acc, unit) => {
        acc.totalProducts += unit.totalProducts
        acc.totalSupplied += unit.totalSupplied
        acc.totalReceived += unit.totalReceived
        return acc
      },
      { totalProducts: 0, totalSupplied: 0, totalReceived: 0 },
    )

    // Calculate overall percentage
    const overallPercentage = totals.totalSupplied > 0 ? (totals.totalReceived / totals.totalSupplied) * 100 : 0

    res.status(200).json({
      success: true,
      data: {
        units: reportByUnit,
        totals: {
          ...totals,
          difference: totals.totalSupplied - totals.totalReceived,
          percentReceived: overallPercentage,
        },
      },
    })
  } catch (error) {
    console.error("Error generating unit report:", error)
    throw new AppError("Đã xảy ra lỗi khi tạo báo cáo theo đơn vị", 500)
  }
}

// @desc    Get report by category
// @route   GET /api/reports/by-category
// @access  Private (Admin, Brigade Assistant, Commander)
export const getReportByCategory = async (req: Request, res: Response) => {
  try {
    const { unit, fromDate, toDate } = req.query

    const db = await getDb()

    // Build match filter
    const matchFilter: any = { status: "approved" }

    // Add unit filter if specified
    if (unit && ObjectId.isValid(unit as string)) {
      matchFilter.unit = new ObjectId(unit as string)
    }

    // Add date filter if specified
    if (fromDate || toDate) {
      matchFilter.harvestDate = {}
      if (fromDate) {
        matchFilter.harvestDate.$gte = new Date(fromDate as string)
      }
      if (toDate) {
        matchFilter.harvestDate.$lte = new Date(toDate as string)
      }
    }

    // Aggregate supplies by category
    const reportByCategory = await db
      .collection("supplies")
      .aggregate([
        {
          $match: matchFilter,
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
          $unwind: "$categoryInfo",
        },
        {
          $group: {
            _id: "$category",
            categoryName: { $first: "$categoryInfo.name" },
            totalProducts: { $sum: 1 },
            totalSupplied: { $sum: "$quantity" },
            totalReceived: { $sum: "$receivedQuantity" },
          },
        },
        {
          $project: {
            _id: { $toString: "$_id" },
            categoryName: 1,
            totalProducts: 1,
            totalSupplied: 1,
            totalReceived: 1,
            difference: { $subtract: ["$totalSupplied", "$totalReceived"] },
            percentReceived: {
              $cond: [
                { $eq: ["$totalSupplied", 0] },
                0,
                { $multiply: [{ $divide: ["$totalReceived", "$totalSupplied"] }, 100] },
              ],
            },
          },
        },
        {
          $sort: { categoryName: 1 },
        },
      ])
      .toArray()

    // Calculate totals
    const totals = reportByCategory.reduce(
      (acc, category) => {
        acc.totalProducts += category.totalProducts
        acc.totalSupplied += category.totalSupplied
        acc.totalReceived += category.totalReceived
        return acc
      },
      { totalProducts: 0, totalSupplied: 0, totalReceived: 0 },
    )

    // Calculate overall percentage
    const overallPercentage = totals.totalSupplied > 0 ? (totals.totalReceived / totals.totalSupplied) * 100 : 0

    res.status(200).json({
      success: true,
      data: {
        categories: reportByCategory,
        totals: {
          ...totals,
          difference: totals.totalSupplied - totals.totalReceived,
          percentReceived: overallPercentage,
        },
      },
    })
  } catch (error) {
    console.error("Error generating category report:", error)
    throw new AppError("Đã xảy ra lỗi khi tạo báo cáo theo phân loại", 500)
  }
}

// @desc    Get detailed report
// @route   GET /api/reports/detailed
// @access  Private (Admin, Brigade Assistant, Commander)
export const getDetailedReport = async (req: Request, res: Response) => {
  try {
    const { unit, category, status, fromDate, toDate } = req.query

    const db = await getDb()

    // Build match filter
    const matchFilter: any = {}

    // Add unit filter if specified
    if (unit && ObjectId.isValid(unit as string)) {
      matchFilter.unit = new ObjectId(unit as string)
    }

    // Add category filter if specified
    if (category && ObjectId.isValid(category as string)) {
      matchFilter.category = new ObjectId(category as string)
    }

    // Add status filter if specified
    if (status) {
      matchFilter.status = status
    } else {
      // Default to approved supplies
      matchFilter.status = "approved"
    }

    // Add date filter if specified
    if (fromDate || toDate) {
      matchFilter.harvestDate = {}
      if (fromDate) {
        matchFilter.harvestDate.$gte = new Date(fromDate as string)
      }
      if (toDate) {
        matchFilter.harvestDate.$lte = new Date(toDate as string)
      }
    }

    // Get detailed supplies
    const detailedReport = await db
      .collection("supplies")
      .aggregate([
        {
          $match: matchFilter,
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
          $unwind: "$unitInfo",
        },
        {
          $unwind: "$categoryInfo",
        },
        {
          $unwind: "$productInfo",
        },
        {
          $project: {
            _id: { $toString: "$_id" },
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
            createdAt: 1,
            updatedAt: 1,
          },
        },
        {
          $sort: { harvestDate: -1 },
        },
      ])
      .toArray()

    // Calculate totals
    const totals = detailedReport.reduce(
      (acc, supply) => {
        acc.totalSupplied += supply.quantity
        acc.totalReceived += supply.receivedQuantity || 0
        return acc
      },
      { totalSupplied: 0, totalReceived: 0 },
    )

    res.status(200).json({
      success: true,
      count: detailedReport.length,
      data: {
        supplies: detailedReport,
        totals: {
          ...totals,
          difference: totals.totalSupplied - totals.totalReceived,
          percentReceived: totals.totalSupplied > 0 ? (totals.totalReceived / totals.totalSupplied) * 100 : 0,
        },
      },
    })
  } catch (error) {
    console.error("Error generating detailed report:", error)
    throw new AppError("Đã xảy ra lỗi khi tạo báo cáo chi tiết", 500)
  }
}
