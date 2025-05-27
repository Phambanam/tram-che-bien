import type { Request, Response } from "express"
import { ObjectId } from "mongodb"
import { getDb } from "../config/database"
import { AppError } from "../middleware/error.middleware"

// @desc    Get statistics overview
// @route   GET /api/statistics/overview
// @access  Private (Admin, Brigade Assistant, Commander)
export const getStatisticsOverview = async (req: Request, res: Response) => {
  try {
    const db = await getDb()

    // Get counts for different collections
    const unitsCount = await db.collection("units").countDocuments()
    const categoriesCount = await db.collection("categories").countDocuments()
    const productsCount = await db.collection("products").countDocuments()
    const totalSupplies = await db.collection("supplies").countDocuments()
    const approvedSupplies = await db.collection("supplies").countDocuments({ status: "approved" })
    const pendingSupplies = await db.collection("supplies").countDocuments({ status: "pending" })

    // Get total quantities
    const supplyAggregation = await db
      .collection("supplies")
      .aggregate([
        {
          $match: { status: "approved" },
        },
        {
          $group: {
            _id: null,
            totalSupplied: { $sum: "$quantity" },
            totalReceived: { $sum: "$receivedQuantity" },
          },
        },
      ])
      .toArray()

    const quantityStats =
      supplyAggregation.length > 0
        ? {
            totalSupplied: supplyAggregation[0].totalSupplied,
            totalReceived: supplyAggregation[0].totalReceived,
          }
        : {
            totalSupplied: 0,
            totalReceived: 0,
          }

    res.status(200).json({
      success: true,
      data: {
        counts: {
          units: unitsCount,
          categories: categoriesCount,
          products: productsCount,
          supplies: {
            total: totalSupplies,
            approved: approvedSupplies,
            pending: pendingSupplies,
          },
        },
        quantities: quantityStats,
        percentReceived:
          quantityStats.totalSupplied > 0 ? (quantityStats.totalReceived / quantityStats.totalSupplied) * 100 : 0,
      },
    })
  } catch (error) {
    console.error("Error fetching statistics overview:", error)
    throw new AppError("Đã xảy ra lỗi khi lấy tổng quan thống kê", 500)
  }
}

// @desc    Get supply trends over time
// @route   GET /api/statistics/trends
// @access  Private (Admin, Brigade Assistant, Commander)
export const getSupplyTrends = async (req: Request, res: Response) => {
  try {
    const { period = "month", unit, category, limit = 12 } = req.query

    const db = await getDb()

    // Build match filter
    const matchFilter: any = { status: "approved" }

    // Add unit filter if specified
    if (unit && ObjectId.isValid(unit as string)) {
      matchFilter.unit = new ObjectId(unit as string)
    }

    // Add category filter if specified
    if (category && ObjectId.isValid(category as string)) {
      matchFilter.category = new ObjectId(category as string)
    }

    // Determine grouping format based on period
    let dateFormat: any
    let sortField: string

    switch (period) {
      case "day":
        dateFormat = {
          year: { $year: "$harvestDate" },
          month: { $month: "$harvestDate" },
          day: { $dayOfMonth: "$harvestDate" },
        }
        sortField = "day"
        break
      case "week":
        dateFormat = {
          year: { $year: "$harvestDate" },
          week: { $week: "$harvestDate" },
        }
        sortField = "week"
        break
      case "year":
        dateFormat = {
          year: { $year: "$harvestDate" },
        }
        sortField = "year"
        break
      case "month":
      default:
        dateFormat = {
          year: { $year: "$harvestDate" },
          month: { $month: "$harvestDate" },
        }
        sortField = "month"
        break
    }

    // Get supply trends
    const trends = await db
      .collection("supplies")
      .aggregate([
        {
          $match: matchFilter,
        },
        {
          $group: {
            _id: dateFormat,
            count: { $sum: 1 },
            totalSupplied: { $sum: "$quantity" },
            totalReceived: { $sum: "$receivedQuantity" },
          },
        },
        {
          $sort: { "_id.year": -1, [`_id.${sortField}`]: -1 },
        },
        {
          $limit: Number(limit),
        },
        {
          $project: {
            _id: 0,
            period: "$_id",
            count: 1,
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
          $sort: { "period.year": 1, [`period.${sortField}`]: 1 },
        },
      ])
      .toArray()

    // Format response based on period
    const formattedTrends = trends.map((trend) => {
      let label = ""
      switch (period) {
        case "day":
          label = `${trend.period.day}/${trend.period.month}/${trend.period.year}`
          break
        case "week":
          label = `Tuần ${trend.period.week}/${trend.period.year}`
          break
        case "year":
          label = `Năm ${trend.period.year}`
          break
        case "month":
        default:
          label = `${trend.period.month}/${trend.period.year}`
          break
      }

      return {
        ...trend,
        label,
      }
    })

    res.status(200).json({
      success: true,
      data: formattedTrends,
    })
  } catch (error) {
    console.error("Error fetching supply trends:", error)
    throw new AppError("Đã xảy ra lỗi khi lấy xu hướng nguồn nhập", 500)
  }
}

// @desc    Get category distribution
// @route   GET /api/statistics/distribution
// @access  Private (Admin, Brigade Assistant, Commander)
export const getCategoryDistribution = async (req: Request, res: Response) => {
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

    // Get category distribution
    const distribution = await db
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
            count: { $sum: 1 },
            totalSupplied: { $sum: "$quantity" },
            totalReceived: { $sum: "$receivedQuantity" },
          },
        },
        {
          $project: {
            _id: 0,
            categoryId: { $toString: "$_id" },
            categoryName: 1,
            count: 1,
            totalSupplied: 1,
            totalReceived: 1,
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
          $sort: { totalSupplied: -1 },
        },
      ])
      .toArray()

    // Calculate total values
    const totals = distribution.reduce(
      (acc, item) => {
        acc.count += item.count
        acc.totalSupplied += item.totalSupplied
        acc.totalReceived += item.totalReceived
        return acc
      },
      { count: 0, totalSupplied: 0, totalReceived: 0 },
    )

    // Calculate percentages
    const distributionWithPercentage = distribution.map((item) => ({
      ...item,
      percentage: totals.totalSupplied > 0 ? (item.totalSupplied / totals.totalSupplied) * 100 : 0,
    }))

    res.status(200).json({
      success: true,
      data: {
        distribution: distributionWithPercentage,
        totals: {
          ...totals,
          percentReceived: totals.totalSupplied > 0 ? (totals.totalReceived / totals.totalSupplied) * 100 : 0,
        },
      },
    })
  } catch (error) {
    console.error("Error fetching category distribution:", error)
    throw new AppError("Đã xảy ra lỗi khi lấy phân phối theo loại", 500)
  }
}

// @desc    Get unit performance metrics
// @route   GET /api/statistics/performance
// @access  Private (Admin, Brigade Assistant, Commander)
export const getUnitPerformance = async (req: Request, res: Response) => {
  try {
    const { fromDate, toDate } = req.query

    const db = await getDb()

    // Build match filter
    const matchFilter: any = { status: "approved" }

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

    // Get unit performance
    const performance = await db
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
          $unwind: "$unitInfo",
        },
        {
          $group: {
            _id: "$unit",
            unitName: { $first: "$unitInfo.name" },
            count: { $sum: 1 },
            totalSupplied: { $sum: "$quantity" },
            totalReceived: { $sum: "$receivedQuantity" },
            onTimeDelivery: {
              $sum: {
                $cond: [
                  {
                    $lte: [
                      { $subtract: ["$stationEntryDate", "$harvestDate"] },
                      86400000, // 24 hours in milliseconds
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            unitId: { $toString: "$_id" },
            unitName: 1,
            count: 1,
            totalSupplied: 1,
            totalReceived: 1,
            onTimeDeliveryCount: "$onTimeDelivery",
            onTimeDeliveryPercentage: {
              $cond: [{ $eq: ["$count", 0] }, 0, { $multiply: [{ $divide: ["$onTimeDelivery", "$count"] }, 100] }],
            },
            accuracyPercentage: {
              $cond: [
                { $eq: ["$totalSupplied", 0] },
                0,
                { $multiply: [{ $divide: ["$totalReceived", "$totalSupplied"] }, 100] },
              ],
            },
          },
        },
        {
          $sort: { accuracyPercentage: -1 },
        },
      ])
      .toArray()

    res.status(200).json({
      success: true,
      data: performance,
    })
  } catch (error) {
    console.error("Error fetching unit performance:", error)
    throw new AppError("Đã xảy ra lỗi khi lấy hiệu suất đơn vị", 500)
  }
}
