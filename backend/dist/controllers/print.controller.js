"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printCategoryReport = exports.printUnitReport = exports.printSupplies = void 0;
const mongodb_1 = require("mongodb");
const database_1 = require("../config/database");
// @desc    Generate supply list for printing
// @route   GET /api/print/supplies
// @access  Private
const printSupplies = async (req, res) => {
    try {
        const { unit, category, status, fromDate, toDate } = req.query;
        const db = await (0, database_1.getDb)();
        // Build query based on role and filters
        const query = {};
        // Unit assistants can only see their own unit's supplies
        if (req.user.role === "unitAssistant") {
            query.unit = new mongodb_1.ObjectId(req.user.unit);
        }
        // Filter by unit if specified
        else if (unit && mongodb_1.ObjectId.isValid(unit)) {
            query.unit = new mongodb_1.ObjectId(unit);
        }
        // Filter by category if specified
        if (category && mongodb_1.ObjectId.isValid(category)) {
            query.category = new mongodb_1.ObjectId(category);
        }
        // Filter by status if specified
        if (status) {
            query.status = status;
        }
        // Filter by harvest date range if specified
        if (fromDate || toDate) {
            query.harvestDate = {};
            if (fromDate) {
                query.harvestDate.$gte = new Date(fromDate);
            }
            if (toDate) {
                query.harvestDate.$lte = new Date(toDate);
            }
        }
        // Get supplies with related information in a print-friendly format
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
                    unitName: "$unitInfo.name",
                    categoryName: "$categoryInfo.name",
                    productName: "$productInfo.name",
                    quantity: 1,
                    unit: "$productInfo.unit",
                    harvestDate: 1,
                    stationEntryDate: 1,
                    receivedQuantity: 1,
                    status: 1,
                    note: 1,
                },
            },
            {
                $sort: { harvestDate: -1 },
            },
        ])
            .toArray();
        // Format dates for better readability
        const formattedSupplies = supplies.map((supply) => ({
            ...supply,
            harvestDate: supply.harvestDate ? new Date(supply.harvestDate).toLocaleDateString("vi-VN") : "",
            stationEntryDate: supply.stationEntryDate ? new Date(supply.stationEntryDate).toLocaleDateString("vi-VN") : "",
            status: formatStatus(supply.status),
        }));
        // Calculate totals
        const totals = formattedSupplies.reduce((acc, supply) => {
            acc.totalSupplied += supply.quantity || 0;
            acc.totalReceived += supply.receivedQuantity || 0;
            return acc;
        }, { totalSupplied: 0, totalReceived: 0 });
        // Add report generation info
        const reportInfo = {
            generatedAt: new Date().toLocaleString("vi-VN"),
            generatedBy: req.user.fullName,
            title: "Danh sách nguồn nhập",
            filters: {
                unit: unit ? await getUnitName(db, unit) : "Tất cả",
                category: category ? await getCategoryName(db, category) : "Tất cả",
                status: status ? formatStatus(status) : "Tất cả",
                dateRange: fromDate || toDate
                    ? `${fromDate ? new Date(fromDate).toLocaleDateString("vi-VN") : ""} - ${toDate ? new Date(toDate).toLocaleDateString("vi-VN") : ""}`
                    : "Tất cả",
            },
        };
        res.status(200).json({
            success: true,
            data: {
                reportInfo,
                supplies: formattedSupplies,
                totals: {
                    ...totals,
                    difference: totals.totalSupplied - totals.totalReceived,
                },
            },
        });
    }
    catch (error) {
        console.error("Error generating printable supply list:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi tạo danh sách nguồn nhập để in"
        });
    }
};
exports.printSupplies = printSupplies;
// @desc    Generate unit report for printing
// @route   GET /api/print/reports/by-unit
// @access  Private (Admin, Brigade Assistant, Commander)
const printUnitReport = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        const db = await (0, database_1.getDb)();
        // Build date filter
        let dateFilter = {};
        if (fromDate || toDate) {
            dateFilter = {};
            if (fromDate) {
                dateFilter = { ...dateFilter, $gte: new Date(fromDate) };
            }
            if (toDate) {
                dateFilter = { ...dateFilter, $lte: new Date(toDate) };
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
            .toArray();
        // Calculate totals
        const totals = reportByUnit.reduce((acc, unit) => {
            acc.totalProducts += unit.totalProducts;
            acc.totalSupplied += unit.totalSupplied;
            acc.totalReceived += unit.totalReceived;
            return acc;
        }, { totalProducts: 0, totalSupplied: 0, totalReceived: 0 });
        // Calculate overall percentage
        const overallPercentage = totals.totalSupplied > 0 ? (totals.totalReceived / totals.totalSupplied) * 100 : 0;
        // Add report generation info
        const reportInfo = {
            generatedAt: new Date().toLocaleString("vi-VN"),
            generatedBy: req.user.fullName,
            title: "Báo cáo theo đơn vị",
            dateRange: fromDate || toDate
                ? `${fromDate ? new Date(fromDate).toLocaleDateString("vi-VN") : ""} - ${toDate ? new Date(toDate).toLocaleDateString("vi-VN") : ""}`
                : "Tất cả thời gian",
        };
        res.status(200).json({
            success: true,
            data: {
                reportInfo,
                units: reportByUnit,
                totals: {
                    ...totals,
                    difference: totals.totalSupplied - totals.totalReceived,
                    percentReceived: overallPercentage,
                },
            },
        });
    }
    catch (error) {
        console.error("Error generating unit report:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi tạo báo cáo theo đơn vị"
        });
    }
};
exports.printUnitReport = printUnitReport;
// @desc    Generate category report for printing
// @route   GET /api/print/reports/by-category
// @access  Private (Admin, Brigade Assistant, Commander)
const printCategoryReport = async (req, res) => {
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
            .toArray();
        // Calculate totals
        const totals = reportByCategory.reduce((acc, category) => {
            acc.totalProducts += category.totalProducts;
            acc.totalSupplied += category.totalSupplied;
            acc.totalReceived += category.totalReceived;
            return acc;
        }, { totalProducts: 0, totalSupplied: 0, totalReceived: 0 });
        // Add report generation info
        const reportInfo = {
            generatedAt: new Date().toLocaleString("vi-VN"),
            generatedBy: req.user.fullName,
            title: "Báo cáo theo phân loại",
            unit: unit ? await getUnitName(db, unit) : "Tất cả đơn vị",
            dateRange: fromDate || toDate
                ? `${fromDate ? new Date(fromDate).toLocaleDateString("vi-VN") : ""} - ${toDate ? new Date(toDate).toLocaleDateString("vi-VN") : ""}`
                : "Tất cả thời gian",
        };
        res.status(200).json({
            success: true,
            data: {
                reportInfo,
                categories: reportByCategory,
                totals: {
                    ...totals,
                    difference: totals.totalSupplied - totals.totalReceived,
                    percentReceived: totals.totalSupplied > 0 ? (totals.totalReceived / totals.totalSupplied) * 100 : 0,
                },
            },
        });
    }
    catch (error) {
        console.error("Error generating category report:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi tạo báo cáo theo phân loại"
        });
    }
};
exports.printCategoryReport = printCategoryReport;
// Helper function to format status
function formatStatus(status) {
    switch (status) {
        case "pending":
            return "Chờ phê duyệt";
        case "approved":
            return "Đã phê duyệt";
        case "rejected":
            return "Từ chối";
        case "deleted":
            return "Đã xóa";
        default:
            return status;
    }
}
// Helper function to get unit name
async function getUnitName(db, unitId) {
    if (!mongodb_1.ObjectId.isValid(unitId))
        return "Không xác định";
    const unit = await db.collection("units").findOne({ _id: new mongodb_1.ObjectId(unitId) });
    return unit ? unit.name : "Không xác định";
}
// Helper function to get category name
async function getCategoryName(db, categoryId) {
    if (!mongodb_1.ObjectId.isValid(categoryId))
        return "Không xác định";
    const category = await db.collection("categories").findOne({ _id: new mongodb_1.ObjectId(categoryId) });
    return category ? category.name : "Không xác định";
}
