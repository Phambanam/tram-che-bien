import { Router } from 'express'
import { protect } from '../middleware/auth.middleware'
import { body, param, query } from 'express-validator'
import { Request, Response } from 'express'
import { LTTPDistribution } from '../models/lttp-distribution.model'
import { LTTPItem } from '../models/lttp-item.model'
import { Unit } from '../models/unit.model'
import { validationResult } from 'express-validator'
import { startOfDay, endOfDay } from 'date-fns'

const router = Router()

// Get distributions by date
router.get('/', protect, async (req: Request, res: Response) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query
    const targetDate = new Date(date as string)
    
    const distributions = await LTTPDistribution.find({
      date: {
        $gte: startOfDay(targetDate),
        $lte: endOfDay(targetDate)
      }
    })
    .populate('lttpItemId', 'name category unit unitPrice')
    .populate('unit1.unitId unit2.unitId unit3.unitId ceremonyUnit.unitId', 'name code personnel')
    .populate('createdBy approvalFlow.approvedBy', 'name rank')
    .sort({ createdAt: -1 })
    
    res.json({
      success: true,
      data: distributions,
      date: targetDate
    })
  } catch (error) {
    console.error('Error fetching distributions:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy dữ liệu phân bổ',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get distribution by ID
router.get('/:id', protect, param('id').isMongoId(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    const distribution = await LTTPDistribution.findById(id)
      .populate('lttpItemId', 'name category unit unitPrice')
      .populate('unit1.unitId unit2.unitId unit3.unitId ceremonyUnit.unitId', 'name code personnel commander contact')
      .populate('createdBy updatedBy approvalFlow.approvedBy approvalFlow.rejectedBy', 'name rank email')
    
    if (!distribution) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phân bổ'
      })
    }
    
    res.json({
      success: true,
      data: distribution
    })
  } catch (error) {
    console.error('Error fetching distribution:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin phân bổ',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Create new distribution
router.post('/', 
  protect,
  [
    body('date').isISO8601().withMessage('Ngày không hợp lệ'),
    body('lttpItemId').isMongoId().withMessage('ID mặt hàng không hợp lệ'),
    body('totalSuggestedQuantity').isNumeric().withMessage('Số lượng đề nghị phải là số'),
    body('unit1.suggestedQuantity').optional().isNumeric(),
    body('unit2.suggestedQuantity').optional().isNumeric(),
    body('unit3.suggestedQuantity').optional().isNumeric(),
    body('ceremonyUnit.suggestedQuantity').optional().isNumeric()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: errors.array()
        })
      }
      
      const { date, lttpItemId } = req.body
      const targetDate = new Date(date)
      
      // Check if LTTP item exists
      const lttpItem = await LTTPItem.findById(lttpItemId)
      if (!lttpItem) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy mặt hàng LTTP'
        })
      }
      
      // Check if distribution already exists for this date and item
      const existingDistribution = await LTTPDistribution.findOne({
        date: {
          $gte: startOfDay(targetDate),
          $lte: endOfDay(targetDate)
        },
        lttpItemId
      })
      
      if (existingDistribution) {
        return res.status(409).json({
          success: false,
          message: 'Đã có phân bổ cho mặt hàng này trong ngày'
        })
      }
      
      // Get all units for validation
      const units = await Unit.find({ isActive: true }).limit(4)
      if (units.length < 4) {
        return res.status(400).json({
          success: false,
          message: 'Chưa đủ đơn vị để phân bổ'
        })
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
          requestedBy: (req as any).user.id,
          requestedAt: new Date()
        },
        createdBy: (req as any).user.id
      }
      
      const distribution = new LTTPDistribution(distributionData)
      await distribution.save()
      
      await distribution.populate('lttpItemId', 'name category unit unitPrice')
      
      res.status(201).json({
        success: true,
        message: 'Tạo phân bổ thành công',
        data: distribution
      })
    } catch (error) {
      console.error('Error creating distribution:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo phân bổ',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

// Update distribution
router.put('/:id',
  protect,
  param('id').isMongoId(),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      
      const distribution = await LTTPDistribution.findByIdAndUpdate(
        id,
        { 
          ...req.body,
          updatedBy: (req as any).user.id 
        },
        { new: true, runValidators: true }
      ).populate('lttpItemId', 'name category unit unitPrice')
      
      if (!distribution) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy phân bổ'
        })
      }
      
      res.json({
        success: true,
        message: 'Cập nhật phân bổ thành công',
        data: distribution
      })
    } catch (error) {
      console.error('Error updating distribution:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật phân bổ',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

// Approve distribution
router.patch('/:id/approve',
  protect,
  [
    param('id').isMongoId(),
    body('approvalNotes').optional().isString()
  ],
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const { approvalNotes } = req.body
      
      const distribution = await LTTPDistribution.findById(id)
      if (!distribution) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy phân bổ'
        })
      }
      
      if (distribution.overallStatus !== 'draft' && distribution.overallStatus !== 'pending_approval') {
        return res.status(400).json({
          success: false,
          message: 'Phân bổ không thể phê duyệt ở trạng thái hiện tại'
        })
      }
      
      distribution.overallStatus = 'approved'
      distribution.approvalFlow.approvedBy = (req as any).user.id
      distribution.approvalFlow.approvedAt = new Date()
      distribution.approvalFlow.approvalNotes = approvalNotes || ''
      distribution.updatedBy = (req as any).user.id
      
      await distribution.save()
      
      res.json({
        success: true,
        message: 'Phê duyệt phân bổ thành công',
        data: distribution
      })
    } catch (error) {
      console.error('Error approving distribution:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi phê duyệt phân bổ',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

// Reject distribution
router.patch('/:id/reject',
  protect,
  [
    param('id').isMongoId(),
    body('rejectionReason').notEmpty().withMessage('Cần cung cấp lý do từ chối')
  ],
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const { rejectionReason } = req.body
      
      const distribution = await LTTPDistribution.findById(id)
      if (!distribution) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy phân bổ'
        })
      }
      
      distribution.overallStatus = 'cancelled'
      distribution.approvalFlow.rejectedBy = (req as any).user.id
      distribution.approvalFlow.rejectedAt = new Date()
      distribution.approvalFlow.rejectionReason = rejectionReason
      distribution.updatedBy = (req as any).user.id
      
      await distribution.save()
      
      res.json({
        success: true,
        message: 'Từ chối phân bổ thành công',
        data: distribution
      })
    } catch (error) {
      console.error('Error rejecting distribution:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi từ chối phân bổ',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

// Mark unit as distributed
router.patch('/:id/units/:unitName/distribute',
  protect,
  [
    param('id').isMongoId(),
    param('unitName').isIn(['unit1', 'unit2', 'unit3', 'ceremonyUnit']),
    body('actualQuantity').isNumeric().withMessage('Số lượng thực xuất phải là số'),
    body('receivedBy').optional().isMongoId()
  ],
  async (req: Request, res: Response) => {
    try {
      const { id, unitName } = req.params
      const { actualQuantity, receivedBy } = req.body
      
      const distribution = await LTTPDistribution.findById(id)
      if (!distribution) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy phân bổ'
        })
      }
      
      if (distribution.overallStatus !== 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Phân bổ chưa được phê duyệt'
        })
      }
      
      const unit = distribution[unitName as keyof typeof distribution] as any
      if (!unit) {
        return res.status(400).json({
          success: false,
          message: 'Đơn vị không hợp lệ'
        })
      }
      
      // Get LTTP item for price calculation
      const lttpItem = await LTTPItem.findById(distribution.lttpItemId)
      
      unit.actualQuantity = actualQuantity
      unit.amount = actualQuantity * (lttpItem?.unitPrice || 0)
      unit.status = 'distributed'
      unit.distributedAt = new Date()
      unit.distributedBy = (req as any).user.id
      unit.receivedBy = receivedBy || (req as any).user.id
      
      distribution.updatedBy = (req as any).user.id
      
      await distribution.save()
      
      res.json({
        success: true,
        message: 'Cập nhật phân phối thành công',
        data: distribution
      })
    } catch (error) {
      console.error('Error updating unit distribution:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật phân phối',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

// Get distribution summary
router.get('/summary/daily', protect, async (req: Request, res: Response) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query
    const targetDate = new Date(date as string)
    
    const summary = await LTTPDistribution.aggregate([
      {
        $match: {
          date: {
            $gte: startOfDay(targetDate),
            $lte: endOfDay(targetDate)
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
    ])
    
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
    }
    
    res.json({
      success: true,
      data: {
        byCategory: summary,
        total: totalSummary,
        date: targetDate
      }
    })
  } catch (error) {
    console.error('Error fetching distribution summary:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy tổng quan phân bổ',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Delete distribution
router.delete('/:id', protect, param('id').isMongoId(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    const distribution = await LTTPDistribution.findById(id)
    if (!distribution) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phân bổ'
      })
    }
    
    if (distribution.overallStatus === 'in_progress' || distribution.overallStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa phân bổ đã bắt đầu hoặc hoàn thành'
      })
    }
    
    await LTTPDistribution.findByIdAndDelete(id)
    
    res.json({
      success: true,
      message: 'Xóa phân bổ thành công'
    })
  } catch (error) {
    console.error('Error deleting distribution:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa phân bổ',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router 