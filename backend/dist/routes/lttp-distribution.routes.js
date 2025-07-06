"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const express_validator_1 = require("express-validator");
const lttp_distribution_model_1 = require("../models/lttp-distribution.model");
const lttp_item_model_1 = require("../models/lttp-item.model");
const unit_model_1 = require("../models/unit.model");
const express_validator_2 = require("express-validator");
const date_fns_1 = require("date-fns");
const router = (0, express_1.Router)();
// Get distributions by date
router.get('/', auth_middleware_1.protect, async (req, res) => {
    try {
        const { date = new Date().toISOString().split('T')[0] } = req.query;
        const targetDate = new Date(date);
        const distributions = await lttp_distribution_model_1.LTTPDistribution.find({
            date: {
                $gte: (0, date_fns_1.startOfDay)(targetDate),
                $lte: (0, date_fns_1.endOfDay)(targetDate)
            }
        })
            .populate('lttpItemId', 'name category unit unitPrice')
            .populate('unit1.unitId unit2.unitId unit3.unitId ceremonyUnit.unitId', 'name code personnel')
            .populate('createdBy approvalFlow.approvedBy', 'name rank')
            .sort({ createdAt: -1 });
        res.json({
            success: true,
            data: distributions,
            date: targetDate
        });
    }
    catch (error) {
        console.error('Error fetching distributions:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu phân bổ',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get distribution by ID
router.get('/:id', auth_middleware_1.protect, (0, express_validator_1.param)('id').isMongoId(), async (req, res) => {
    try {
        const { id } = req.params;
        const distribution = await lttp_distribution_model_1.LTTPDistribution.findById(id)
            .populate('lttpItemId', 'name category unit unitPrice')
            .populate('unit1.unitId unit2.unitId unit3.unitId ceremonyUnit.unitId', 'name code personnel commander contact')
            .populate('createdBy updatedBy approvalFlow.approvedBy approvalFlow.rejectedBy', 'name rank email');
        if (!distribution) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phân bổ'
            });
        }
        res.json({
            success: true,
            data: distribution
        });
    }
    catch (error) {
        console.error('Error fetching distribution:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin phân bổ',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Create new distribution
router.post('/', auth_middleware_1.protect, [
    (0, express_validator_1.body)('date').isISO8601().withMessage('Ngày không hợp lệ'),
    (0, express_validator_1.body)('lttpItemId').isMongoId().withMessage('ID mặt hàng không hợp lệ'),
    (0, express_validator_1.body)('totalSuggestedQuantity').isNumeric().withMessage('Số lượng đề nghị phải là số'),
    (0, express_validator_1.body)('unit1.suggestedQuantity').optional().isNumeric(),
    (0, express_validator_1.body)('unit2.suggestedQuantity').optional().isNumeric(),
    (0, express_validator_1.body)('unit3.suggestedQuantity').optional().isNumeric(),
    (0, express_validator_1.body)('ceremonyUnit.suggestedQuantity').optional().isNumeric()
], async (req, res) => {
    try {
        const errors = (0, express_validator_2.validationResult)(req);
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
        // Check if distribution already exists for this date and item
        const existingDistribution = await lttp_distribution_model_1.LTTPDistribution.findOne({
            date: {
                $gte: (0, date_fns_1.startOfDay)(targetDate),
                $lte: (0, date_fns_1.endOfDay)(targetDate)
            },
            lttpItemId
        });
        if (existingDistribution) {
            return res.status(409).json({
                success: false,
                message: 'Đã có phân bổ cho mặt hàng này trong ngày'
            });
        }
        // Get all units for validation
        const units = await unit_model_1.Unit.find({ isActive: true }).limit(4);
        if (units.length < 4) {
            return res.status(400).json({
                success: false,
                message: 'Chưa đủ đơn vị để phân bổ'
            });
        }
        const distributionData = {
            ...req.body,
            date: targetDate,
            unit1: {
                ...req.body.unit1,
                unitId: units.find(u => u.code === 'TD1')?._id || units[0]._id,
                personnelCount: units.find(u => u.code === 'TD1')?.personnel || units[0].personnel
            },
            unit2: {
                ...req.body.unit2,
                unitId: units.find(u => u.code === 'TD2')?._id || units[1]._id,
                personnelCount: units.find(u => u.code === 'TD2')?.personnel || units[1].personnel
            },
            unit3: {
                ...req.body.unit3,
                unitId: units.find(u => u.code === 'TD3')?._id || units[2]._id,
                personnelCount: units.find(u => u.code === 'TD3')?.personnel || units[2].personnel
            },
            ceremonyUnit: {
                ...req.body.ceremonyUnit,
                unitId: units.find(u => u.code === 'LDH')?._id || units[3]._id,
                personnelCount: units.find(u => u.code === 'LDH')?.personnel || units[3].personnel
            },
            approvalFlow: {
                requestedBy: req.user.id,
                requestedAt: new Date()
            },
            createdBy: req.user.id
        };
        const distribution = new lttp_distribution_model_1.LTTPDistribution(distributionData);
        await distribution.save();
        await distribution.populate('lttpItemId', 'name category unit unitPrice');
        res.status(201).json({
            success: true,
            message: 'Tạo phân bổ thành công',
            data: distribution
        });
    }
    catch (error) {
        console.error('Error creating distribution:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo phân bổ',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Update distribution
router.put('/:id', auth_middleware_1.protect, (0, express_validator_1.param)('id').isMongoId(), async (req, res) => {
    try {
        const { id } = req.params;
        const distribution = await lttp_distribution_model_1.LTTPDistribution.findByIdAndUpdate(id, {
            ...req.body,
            updatedBy: req.user.id
        }, { new: true, runValidators: true }).populate('lttpItemId', 'name category unit unitPrice');
        if (!distribution) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phân bổ'
            });
        }
        res.json({
            success: true,
            message: 'Cập nhật phân bổ thành công',
            data: distribution
        });
    }
    catch (error) {
        console.error('Error updating distribution:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật phân bổ',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Approve distribution
router.patch('/:id/approve', auth_middleware_1.protect, [
    (0, express_validator_1.param)('id').isMongoId(),
    (0, express_validator_1.body)('approvalNotes').optional().isString()
], async (req, res) => {
    try {
        const { id } = req.params;
        const { approvalNotes } = req.body;
        const distribution = await lttp_distribution_model_1.LTTPDistribution.findById(id);
        if (!distribution) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phân bổ'
            });
        }
        if (distribution.overallStatus !== 'draft' && distribution.overallStatus !== 'pending_approval') {
            return res.status(400).json({
                success: false,
                message: 'Phân bổ không thể phê duyệt ở trạng thái hiện tại'
            });
        }
        distribution.overallStatus = 'approved';
        distribution.approvalFlow.approvedBy = req.user.id;
        distribution.approvalFlow.approvedAt = new Date();
        distribution.approvalFlow.approvalNotes = approvalNotes || '';
        distribution.updatedBy = req.user.id;
        await distribution.save();
        res.json({
            success: true,
            message: 'Phê duyệt phân bổ thành công',
            data: distribution
        });
    }
    catch (error) {
        console.error('Error approving distribution:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi phê duyệt phân bổ',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Reject distribution
router.patch('/:id/reject', auth_middleware_1.protect, [
    (0, express_validator_1.param)('id').isMongoId(),
    (0, express_validator_1.body)('rejectionReason').notEmpty().withMessage('Cần cung cấp lý do từ chối')
], async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;
        const distribution = await lttp_distribution_model_1.LTTPDistribution.findById(id);
        if (!distribution) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phân bổ'
            });
        }
        distribution.overallStatus = 'cancelled';
        distribution.approvalFlow.rejectedBy = req.user.id;
        distribution.approvalFlow.rejectedAt = new Date();
        distribution.approvalFlow.rejectionReason = rejectionReason;
        distribution.updatedBy = req.user.id;
        await distribution.save();
        res.json({
            success: true,
            message: 'Từ chối phân bổ thành công',
            data: distribution
        });
    }
    catch (error) {
        console.error('Error rejecting distribution:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi từ chối phân bổ',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Mark unit as distributed
router.patch('/:id/units/:unitName/distribute', auth_middleware_1.protect, [
    (0, express_validator_1.param)('id').isMongoId(),
    (0, express_validator_1.param)('unitName').isIn(['unit1', 'unit2', 'unit3', 'ceremonyUnit']),
    (0, express_validator_1.body)('actualQuantity').isNumeric().withMessage('Số lượng thực xuất phải là số'),
    (0, express_validator_1.body)('receivedBy').optional().isMongoId()
], async (req, res) => {
    try {
        const { id, unitName } = req.params;
        const { actualQuantity, receivedBy } = req.body;
        const distribution = await lttp_distribution_model_1.LTTPDistribution.findById(id);
        if (!distribution) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phân bổ'
            });
        }
        if (distribution.overallStatus !== 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Phân bổ chưa được phê duyệt'
            });
        }
        const unit = distribution[unitName];
        if (!unit) {
            return res.status(400).json({
                success: false,
                message: 'Đơn vị không hợp lệ'
            });
        }
        // Get LTTP item for price calculation
        const lttpItem = await lttp_item_model_1.LTTPItem.findById(distribution.lttpItemId);
        unit.actualQuantity = actualQuantity;
        unit.amount = actualQuantity * (lttpItem?.unitPrice || 0);
        unit.status = 'distributed';
        unit.distributedAt = new Date();
        unit.distributedBy = req.user.id;
        unit.receivedBy = receivedBy || req.user.id;
        distribution.updatedBy = req.user.id;
        await distribution.save();
        res.json({
            success: true,
            message: 'Cập nhật phân phối thành công',
            data: distribution
        });
    }
    catch (error) {
        console.error('Error updating unit distribution:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật phân phối',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get distribution summary
router.get('/summary/daily', auth_middleware_1.protect, async (req, res) => {
    try {
        const { date = new Date().toISOString().split('T')[0] } = req.query;
        const targetDate = new Date(date);
        const summary = await lttp_distribution_model_1.LTTPDistribution.aggregate([
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
                    totalSuggested: { $sum: '$totalSuggestedQuantity' },
                    totalActual: { $sum: '$totalActualQuantity' },
                    totalAmount: { $sum: '$totalAmount' },
                    completedDistributions: {
                        $sum: {
                            $cond: [
                                { $eq: ['$overallStatus', 'completed'] },
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
            totalSuggested: summary.reduce((sum, cat) => sum + cat.totalSuggested, 0),
            totalActual: summary.reduce((sum, cat) => sum + cat.totalActual, 0),
            totalAmount: summary.reduce((sum, cat) => sum + cat.totalAmount, 0),
            completedDistributions: summary.reduce((sum, cat) => sum + cat.completedDistributions, 0),
            efficiency: summary.reduce((sum, cat) => sum + cat.totalSuggested, 0) > 0
                ? (summary.reduce((sum, cat) => sum + cat.totalActual, 0) / summary.reduce((sum, cat) => sum + cat.totalSuggested, 0)) * 100
                : 0
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
        console.error('Error fetching distribution summary:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy tổng quan phân bổ',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Delete distribution
router.delete('/:id', auth_middleware_1.protect, (0, express_validator_1.param)('id').isMongoId(), async (req, res) => {
    try {
        const { id } = req.params;
        const distribution = await lttp_distribution_model_1.LTTPDistribution.findById(id);
        if (!distribution) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phân bổ'
            });
        }
        if (distribution.overallStatus === 'in_progress' || distribution.overallStatus === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa phân bổ đã bắt đầu hoặc hoàn thành'
            });
        }
        await lttp_distribution_model_1.LTTPDistribution.findByIdAndDelete(id);
        res.json({
            success: true,
            message: 'Xóa phân bổ thành công'
        });
    }
    catch (error) {
        console.error('Error deleting distribution:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa phân bổ',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
