"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnitPerformance = exports.getCategoryDistribution = exports.getSupplyTrends = exports.getStatisticsOverview = void 0;
const mongodb_1 = require("mongodb");
const database_1 = require("../config/database");
// @desc    Get statistics overview
// @route   GET /api/statistics/overview
// @access  Private (Admin, Brigade Assistant, Commander)
const getStatisticsOverview = async (req, res) => {
    try {
        const db = await (0, database_1.getDb)();
        // Get counts for different collections
        const unitsCount = await db.collection("units").countDocuments();
        const categoriesCount = await db.collection("categories").countDocuments();
        const productsCount = await db.collection("products").countDocuments();
        const totalSupplies = await db.collection("supplies").countDocuments();
        const approvedSupplies = await db.collection("supplies").countDocuments({ status: "approved" });
        const pendingSupplies = await db.collection("supplies").countDocuments({ status: "pending" });
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
            .toArray();
        const quantityStats = supplyAggregation.length > 0
            ? {
                totalSupplied: supplyAggregation[0].totalSupplied,
                totalReceived: supplyAggregation[0].totalReceived,
            }
            : {
                totalSupplied: 0,
                totalReceived: 0,
            };
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
                percentReceived: quantityStats.totalSupplied > 0 ? (quantityStats.totalReceived / quantityStats.totalSupplied) * 100 : 0,
            },
        });
    }
    catch (error) {
        console.error("Error fetching statistics overview:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi lấy tổng quan thống kê"
        });
    }
};
exports.getStatisticsOverview = getStatisticsOverview;
// @desc    Get supply trends over time
// @route   GET /api/statistics/trends
// @access  Private (Admin, Brigade Assistant, Commander)
const getSupplyTrends = async (req, res) => {
    try {
        const { period = "month", unit, category, limit = 12 } = req.query;
        const db = await (0, database_1.getDb)();
        // Build match filter
        const matchFilter = { status: "approved" };
        // Add unit filter if specified
        if (unit && mongodb_1.ObjectId.isValid(unit)) {
            matchFilter.unit = new mongodb_1.ObjectId(unit);
        }
        // Add category filter if specified
        if (category && mongodb_1.ObjectId.isValid(category)) {
            matchFilter.category = new mongodb_1.ObjectId(category);
        }
        // Determine grouping format based on period
        let dateFormat;
        let sortField;
        switch (period) {
            case "day":
                dateFormat = {
                    year: { $year: "$harvestDate" },
                    month: { $month: "$harvestDate" },
                    day: { $dayOfMonth: "$harvestDate" },
                };
                sortField = "day";
                break;
            case "week":
                dateFormat = {
                    year: { $year: "$harvestDate" },
                    week: { $week: "$harvestDate" },
                };
                sortField = "week";
                break;
            case "year":
                dateFormat = {
                    year: { $year: "$harvestDate" },
                };
                sortField = "year";
                break;
            case "month":
            default:
                dateFormat = {
                    year: { $year: "$harvestDate" },
                    month: { $month: "$harvestDate" },
                };
                sortField = "month";
                break;
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
            .toArray();
        // Format response based on period
        const formattedTrends = trends.map((trend) => {
            let label = "";
            switch (period) {
                case "day":
                    label = `${trend.period.day}/${trend.period.month}/${trend.period.year}`;
                    break;
                case "week":
                    label = `Tuần ${trend.period.week}/${trend.period.year}`;
                    break;
                case "year":
                    label = `Năm ${trend.period.year}`;
                    break;
                case "month":
                default:
                    label = `${trend.period.month}/${trend.period.year}`;
                    break;
            }
            return {
                ...trend,
                label,
            };
        });
        res.status(200).json({
            success: true,
            data: formattedTrends,
        });
    }
    catch (error) {
        console.error("Error fetching supply trends:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi lấy xu hướng nguồn nhập"
        });
    }
};
exports.getSupplyTrends = getSupplyTrends;
// @desc    Get category distribution
// @route   GET /api/statistics/distribution
// @access  Private (Admin, Brigade Assistant, Commander)
const getCategoryDistribution = async (req, res) => {
    try {
        const { unit, fromDate, toDate } = req.query;
        const db = await (0, database_1.getDb)();
        // Build match filter
        const matchFilter = { status: "approved" };
        // Add unit filter if specified
        if (unit && mongodb_1.ObjectId.isValid(unit)) {
            matchFilter.unit = new mongodb_1.ObjectId(unit);
        }
        // Add date filter if specified
        if (fromDate || toDate) {
            matchFilter.harvestDate = {};
            if (fromDate) {
                matchFilter.harvestDate.$gte = new Date(fromDate);
            }
            if (toDate) {
                matchFilter.harvestDate.$lte = new Date(toDate);
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
            .toArray();
        // Calculate total values
        const totals = distribution.reduce((acc, item) => {
            acc.count += item.count;
            acc.totalSupplied += item.totalSupplied;
            acc.totalReceived += item.totalReceived;
            return acc;
        }, { count: 0, totalSupplied: 0, totalReceived: 0 });
        // Calculate percentages
        const distributionWithPercentage = distribution.map((item) => ({
            ...item,
            percentage: totals.totalSupplied > 0 ? (item.totalSupplied / totals.totalSupplied) * 100 : 0,
        }));
        res.status(200).json({
            success: true,
            data: {
                distribution: distributionWithPercentage,
                totals: {
                    ...totals,
                    percentReceived: totals.totalSupplied > 0 ? (totals.totalReceived / totals.totalSupplied) * 100 : 0,
                },
            },
        });
    }
    catch (error) {
        console.error("Error fetching category distribution:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi lấy phân bố theo phân loại"
        });
    }
};
exports.getCategoryDistribution = getCategoryDistribution;
// @desc    Get unit performance metrics
// @route   GET /api/statistics/performance
// @access  Private (Admin, Brigade Assistant, Commander)
const getUnitPerformance = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        const db = await (0, database_1.getDb)();
        // Build match filter
        const matchFilter = { status: "approved" };
        // Add date filter if specified
        if (fromDate || toDate) {
            matchFilter.harvestDate = {};
            if (fromDate) {
                matchFilter.harvestDate.$gte = new Date(fromDate);
            }
            if (toDate) {
                matchFilter.harvestDate.$lte = new Date(toDate);
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
            .toArray();
        res.status(200).json({
            success: true,
            data: performance,
        });
    }
    catch (error) {
        console.error("Error fetching unit performance:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi lấy hiệu quả đơn vị"
        });
    }
};
exports.getUnitPerformance = getUnitPerformance;
