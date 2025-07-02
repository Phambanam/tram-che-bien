"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LTTPInventoryController = void 0;
const lttp_inventory_model_1 = require("../models/lttp-inventory.model");
const lttp_item_model_1 = require("../models/lttp-item.model");
const express_validator_1 = require("express-validator");
const date_fns_1 = require("date-fns");
class LTTPInventoryController {
    // Get inventory for a specific date
    static async getInventoryByDate(req, res) {
        try {
            const { date = new Date().toISOString().split('T')[0] } = req.query;
            const targetDate = new Date(date);
            const inventories = await lttp_inventory_model_1.LTTPInventory.find({
                date: {
                    $gte: (0, date_fns_1.startOfDay)(targetDate),
                    $lte: (0, date_fns_1.endOfDay)(targetDate)
                }
            })
                .populate('lttpItemId', 'name category unit unitPrice')
                .populate('createdBy updatedBy', 'name email')
                .sort({ 'lttpItemId.category': 1, 'lttpItemId.name': 1 });
            res.json({
                success: true,
                data: inventories,
                date: targetDate
            });
        }
        catch (error) {
            console.error('Error fetching inventory:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy dữ liệu tồn kho',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    // Get inventory for date range
    static async getInventoryByDateRange(req, res) {
        try {
            const { startDate, endDate, lttpItemId } = req.query;
            if (!startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Cần cung cấp ngày bắt đầu và ngày kết thúc'
                });
            }
            const filter = {
                date: {
                    $gte: (0, date_fns_1.startOfDay)(new Date(startDate)),
                    $lte: (0, date_fns_1.endOfDay)(new Date(endDate))
                }
            };
            if (lttpItemId) {
                filter.lttpItemId = lttpItemId;
            }
            const inventories = await lttp_inventory_model_1.LTTPInventory.find(filter)
                .populate('lttpItemId', 'name category unit unitPrice')
                .populate('createdBy updatedBy', 'name email')
                .sort({ date: 1, 'lttpItemId.name': 1 });
            res.json({
                success: true,
                data: inventories
            });
        }
        catch (error) {
            console.error('Error fetching inventory range:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy dữ liệu tồn kho theo khoảng thời gian',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    // Create or update inventory for a specific item and date
    static async createOrUpdateInventory(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Dữ liệu không hợp lệ',
                    errors: errors.array()
                });
            }
            const { date, lttpItemId } = req.body;
            const targetDate = new Date(date);
            // Check if LTTP item exists
            const lttpItem = await lttp_item_model_1.LTTPItem.findById(lttpItemId);
            if (!lttpItem) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy mặt hàng LTTP'
                });
            }
            // Find existing inventory or create new one
            let inventory = await lttp_inventory_model_1.LTTPInventory.findOne({
                date: {
                    $gte: (0, date_fns_1.startOfDay)(targetDate),
                    $lte: (0, date_fns_1.endOfDay)(targetDate)
                },
                lttpItemId
            });
            if (inventory) {
                // Update existing inventory
                Object.assign(inventory, {
                    ...req.body,
                    updatedBy: req.user.id
                });
                await inventory.save();
            }
            else {
                // Create new inventory
                inventory = new lttp_inventory_model_1.LTTPInventory({
                    ...req.body,
                    date: targetDate,
                    createdBy: req.user.id
                });
                await inventory.save();
            }
            // Auto-calculate carry over for next day
            await LTTPInventoryController.updateNextDayCarryOver(lttpItemId, targetDate, inventory.endOfDay.quantity, inventory.endOfDay.expiryDate);
            await inventory.populate('lttpItemId', 'name category unit unitPrice');
            res.json({
                success: true,
                message: inventory.isNew ? 'Tạo dữ liệu tồn kho thành công' : 'Cập nhật dữ liệu tồn kho thành công',
                data: inventory
            });
        }
        catch (error) {
            console.error('Error creating/updating inventory:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tạo/cập nhật dữ liệu tồn kho',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    // Auto-initialize inventory for a date
    static async initializeInventoryForDate(req, res) {
        try {
            const { date = new Date().toISOString().split('T')[0] } = req.body;
            const targetDate = new Date(date);
            const previousDate = (0, date_fns_1.subDays)(targetDate, 1);
            // Get all active LTTP items
            const lttpItems = await lttp_item_model_1.LTTPItem.find({ isActive: true });
            const initializedItems = [];
            for (const item of lttpItems) {
                // Check if inventory already exists for this date
                const existingInventory = await lttp_inventory_model_1.LTTPInventory.findOne({
                    date: {
                        $gte: (0, date_fns_1.startOfDay)(targetDate),
                        $lte: (0, date_fns_1.endOfDay)(targetDate)
                    },
                    lttpItemId: item._id
                });
                if (!existingInventory) {
                    // Get previous day's inventory for carry over
                    const previousInventory = await lttp_inventory_model_1.LTTPInventory.findOne({
                        date: {
                            $gte: (0, date_fns_1.startOfDay)(previousDate),
                            $lte: (0, date_fns_1.endOfDay)(previousDate)
                        },
                        lttpItemId: item._id
                    });
                    const carryOver = previousInventory ? {
                        quantity: previousInventory.endOfDay.quantity,
                        amount: previousInventory.endOfDay.amount,
                        expiryDate: previousInventory.endOfDay.expiryDate
                    } : { quantity: 0, amount: 0 };
                    const inventory = new lttp_inventory_model_1.LTTPInventory({
                        date: targetDate,
                        lttpItemId: item._id,
                        previousDay: carryOver,
                        createdBy: req.user.id
                    });
                    await inventory.save();
                    initializedItems.push(inventory);
                }
            }
            res.json({
                success: true,
                message: `Khởi tạo thành công ${initializedItems.length} mặt hàng cho ngày ${targetDate.toLocaleDateString('vi-VN')}`,
                data: initializedItems.length
            });
        }
        catch (error) {
            console.error('Error initializing inventory:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi khởi tạo dữ liệu tồn kho',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    // Get items with expiry alerts
    static async getExpiryAlerts(req, res) {
        try {
            const { days = 7 } = req.query;
            const alertDate = (0, date_fns_1.addDays)(new Date(), Number(days));
            const itemsNearExpiry = await lttp_inventory_model_1.LTTPInventory.find({
                'endOfDay.expiryDate': { $lte: alertDate },
                'endOfDay.quantity': { $gt: 0 },
                status: { $in: ['Sắp hết hạn', 'Hết hạn'] }
            })
                .populate('lttpItemId', 'name category unit')
                .sort({ 'endOfDay.expiryDate': 1 });
            res.json({
                success: true,
                data: itemsNearExpiry,
                alertDate
            });
        }
        catch (error) {
            console.error('Error fetching expiry alerts:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy cảnh báo hết hạn',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    // Get inventory summary
    static async getInventorySummary(req, res) {
        try {
            const { date = new Date().toISOString().split('T')[0] } = req.query;
            const targetDate = new Date(date);
            const summary = await lttp_inventory_model_1.LTTPInventory.aggregate([
                {
                    $match: {
                        date: {
                            $gte: (0, date_fns_1.startOfDay)(targetDate),
                            $lte: (0, date_fns_1.endOfDay)(targetDate)
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'lttpitems',
                        localField: 'lttpItemId',
                        foreignField: '_id',
                        as: 'lttpItem'
                    }
                },
                {
                    $unwind: '$lttpItem'
                },
                {
                    $group: {
                        _id: '$lttpItem.category',
                        totalItems: { $sum: 1 },
                        totalInputAmount: { $sum: '$input.amount' },
                        totalOutputAmount: { $sum: '$output.amount' },
                        totalEndAmount: { $sum: '$endOfDay.amount' },
                        itemsNearExpiry: {
                            $sum: {
                                $cond: [
                                    { $in: ['$status', ['Sắp hết hạn', 'Hết hạn']] },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ]);
            const totalSummary = {
                totalCategories: summary.length,
                totalItems: summary.reduce((sum, cat) => sum + cat.totalItems, 0),
                totalInputAmount: summary.reduce((sum, cat) => sum + cat.totalInputAmount, 0),
                totalOutputAmount: summary.reduce((sum, cat) => sum + cat.totalOutputAmount, 0),
                totalEndAmount: summary.reduce((sum, cat) => sum + cat.totalEndAmount, 0),
                totalItemsNearExpiry: summary.reduce((sum, cat) => sum + cat.itemsNearExpiry, 0)
            };
            res.json({
                success: true,
                data: {
                    byCategory: summary,
                    total: totalSummary,
                    date: targetDate
                }
            });
        }
        catch (error) {
            console.error('Error fetching inventory summary:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy tổng quan tồn kho',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    // Update next day carry over
    static async updateNextDayCarryOver(lttpItemId, currentDate, quantity, expiryDate) {
        try {
            const nextDate = (0, date_fns_1.addDays)(currentDate, 1);
            const nextDayInventory = await lttp_inventory_model_1.LTTPInventory.findOne({
                date: {
                    $gte: (0, date_fns_1.startOfDay)(nextDate),
                    $lte: (0, date_fns_1.endOfDay)(nextDate)
                },
                lttpItemId
            });
            if (nextDayInventory) {
                const lttpItem = await lttp_item_model_1.LTTPItem.findById(lttpItemId);
                const amount = lttpItem ? quantity * lttpItem.unitPrice : 0;
                nextDayInventory.previousDay = {
                    quantity,
                    amount,
                    expiryDate
                };
                await nextDayInventory.save();
            }
        }
        catch (error) {
            console.error('Error updating next day carry over:', error);
        }
    }
    // Generate quality check report
    static async generateQualityReport(req, res) {
        try {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Cần cung cấp ngày bắt đầu và ngày kết thúc'
                });
            }
            const qualityReport = await lttp_inventory_model_1.LTTPInventory.aggregate([
                {
                    $match: {
                        date: {
                            $gte: new Date(startDate),
                            $lte: new Date(endDate)
                        },
                        'qualityCheck.checked': true
                    }
                },
                {
                    $lookup: {
                        from: 'lttpitems',
                        localField: 'lttpItemId',
                        foreignField: '_id',
                        as: 'lttpItem'
                    }
                },
                {
                    $unwind: '$lttpItem'
                },
                {
                    $group: {
                        _id: {
                            category: '$lttpItem.category',
                            condition: '$qualityCheck.condition'
                        },
                        count: { $sum: 1 },
                        items: {
                            $push: {
                                name: '$lttpItem.name',
                                date: '$date',
                                rating: '$qualityCheck.qualityRating',
                                notes: '$qualityCheck.qualityNotes'
                            }
                        }
                    }
                }
            ]);
            res.json({
                success: true,
                data: qualityReport
            });
        }
        catch (error) {
            console.error('Error generating quality report:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tạo báo cáo chất lượng',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
exports.LTTPInventoryController = LTTPInventoryController;
