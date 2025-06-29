import { Request, Response } from 'express'
import { LTTPInventory } from '../models/lttp-inventory.model'
import { LTTPItem } from '../models/lttp-item.model'
import { validationResult } from 'express-validator'
import { startOfDay, endOfDay, subDays, addDays } from 'date-fns'

export class LTTPInventoryController {
  // Get inventory for a specific date
  static async getInventoryByDate(req: Request, res: Response) {
    try {
      const { date = new Date().toISOString().split('T')[0] } = req.query
      const targetDate = new Date(date as string)
      
      const inventories = await LTTPInventory.find({
        date: {
          $gte: startOfDay(targetDate),
          $lte: endOfDay(targetDate)
        }
      })
      .populate('lttpItemId', 'name category unit unitPrice')
      .populate('createdBy updatedBy', 'name email')
      .sort({ 'lttpItemId.category': 1, 'lttpItemId.name': 1 })
      
      res.json({
        success: true,
        data: inventories,
        date: targetDate
      })
    } catch (error) {
      console.error('Error fetching inventory:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy dữ liệu tồn kho',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  // Get inventory for date range
  static async getInventoryByDateRange(req: Request, res: Response) {
    try {
      const { startDate, endDate, lttpItemId } = req.query
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Cần cung cấp ngày bắt đầu và ngày kết thúc'
        })
      }
      
      const filter: any = {
        date: {
          $gte: startOfDay(new Date(startDate as string)),
          $lte: endOfDay(new Date(endDate as string))
        }
      }
      
      if (lttpItemId) {
        filter.lttpItemId = lttpItemId
      }
      
      const inventories = await LTTPInventory.find(filter)
        .populate('lttpItemId', 'name category unit unitPrice')
        .populate('createdBy updatedBy', 'name email')
        .sort({ date: 1, 'lttpItemId.name': 1 })
      
      res.json({
        success: true,
        data: inventories
      })
    } catch (error) {
      console.error('Error fetching inventory range:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy dữ liệu tồn kho theo khoảng thời gian',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  // Create or update inventory for a specific item and date
  static async createOrUpdateInventory(req: Request, res: Response) {
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
      
      // Find existing inventory or create new one
      let inventory = await LTTPInventory.findOne({
        date: {
          $gte: startOfDay(targetDate),
          $lte: endOfDay(targetDate)
        },
        lttpItemId
      })
      
      if (inventory) {
        // Update existing inventory
        Object.assign(inventory, {
          ...req.body,
          updatedBy: (req as any).user.id
        })
        await inventory.save()
      } else {
        // Create new inventory
        inventory = new LTTPInventory({
          ...req.body,
          date: targetDate,
          createdBy: (req as any).user.id
        })
        await inventory.save()
      }
      
      // Auto-calculate carry over for next day
      await LTTPInventoryController.updateNextDayCarryOver(lttpItemId, targetDate, inventory.endOfDay.quantity, inventory.endOfDay.expiryDate)
      
      await inventory.populate('lttpItemId', 'name category unit unitPrice')
      
      res.json({
        success: true,
        message: inventory.isNew ? 'Tạo dữ liệu tồn kho thành công' : 'Cập nhật dữ liệu tồn kho thành công',
        data: inventory
      })
    } catch (error) {
      console.error('Error creating/updating inventory:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo/cập nhật dữ liệu tồn kho',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  // Auto-initialize inventory for a date
  static async initializeInventoryForDate(req: Request, res: Response) {
    try {
      const { date = new Date().toISOString().split('T')[0] } = req.body
      const targetDate = new Date(date)
      const previousDate = subDays(targetDate, 1)
      
      // Get all active LTTP items
      const lttpItems = await LTTPItem.find({ isActive: true })
      
      const initializedItems = []
      
      for (const item of lttpItems) {
        // Check if inventory already exists for this date
        const existingInventory = await LTTPInventory.findOne({
          date: {
            $gte: startOfDay(targetDate),
            $lte: endOfDay(targetDate)
          },
          lttpItemId: item._id
        })
        
        if (!existingInventory) {
          // Get previous day's inventory for carry over
          const previousInventory = await LTTPInventory.findOne({
            date: {
              $gte: startOfDay(previousDate),
              $lte: endOfDay(previousDate)
            },
            lttpItemId: item._id
          })
          
          const carryOver = previousInventory ? {
            quantity: previousInventory.endOfDay.quantity,
            amount: previousInventory.endOfDay.amount,
            expiryDate: previousInventory.endOfDay.expiryDate
          } : { quantity: 0, amount: 0 }
          
          const inventory = new LTTPInventory({
            date: targetDate,
            lttpItemId: item._id,
            previousDay: carryOver,
            createdBy: (req as any).user.id
          })
          
          await inventory.save()
          initializedItems.push(inventory)
        }
      }
      
      res.json({
        success: true,
        message: `Khởi tạo thành công ${initializedItems.length} mặt hàng cho ngày ${targetDate.toLocaleDateString('vi-VN')}`,
        data: initializedItems.length
      })
    } catch (error) {
      console.error('Error initializing inventory:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi khởi tạo dữ liệu tồn kho',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  // Get items with expiry alerts
  static async getExpiryAlerts(req: Request, res: Response) {
    try {
      const { days = 7 } = req.query
      const alertDate = addDays(new Date(), Number(days))
      
      const itemsNearExpiry = await LTTPInventory.find({
        'endOfDay.expiryDate': { $lte: alertDate },
        'endOfDay.quantity': { $gt: 0 },
        status: { $in: ['Sắp hết hạn', 'Hết hạn'] }
      })
      .populate('lttpItemId', 'name category unit')
      .sort({ 'endOfDay.expiryDate': 1 })
      
      res.json({
        success: true,
        data: itemsNearExpiry,
        alertDate
      })
    } catch (error) {
      console.error('Error fetching expiry alerts:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy cảnh báo hết hạn',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  // Get inventory summary
  static async getInventorySummary(req: Request, res: Response) {
    try {
      const { date = new Date().toISOString().split('T')[0] } = req.query
      const targetDate = new Date(date as string)
      
      const summary = await LTTPInventory.aggregate([
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
      ])
      
      const totalSummary = {
        totalCategories: summary.length,
        totalItems: summary.reduce((sum, cat) => sum + cat.totalItems, 0),
        totalInputAmount: summary.reduce((sum, cat) => sum + cat.totalInputAmount, 0),
        totalOutputAmount: summary.reduce((sum, cat) => sum + cat.totalOutputAmount, 0),
        totalEndAmount: summary.reduce((sum, cat) => sum + cat.totalEndAmount, 0),
        totalItemsNearExpiry: summary.reduce((sum, cat) => sum + cat.itemsNearExpiry, 0)
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
      console.error('Error fetching inventory summary:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy tổng quan tồn kho',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  // Update next day carry over
  static async updateNextDayCarryOver(lttpItemId: string, currentDate: Date, quantity: number, expiryDate?: Date) {
    try {
      const nextDate = addDays(currentDate, 1)
      
      const nextDayInventory = await LTTPInventory.findOne({
        date: {
          $gte: startOfDay(nextDate),
          $lte: endOfDay(nextDate)
        },
        lttpItemId
      })
      
      if (nextDayInventory) {
        const lttpItem = await LTTPItem.findById(lttpItemId)
        const amount = lttpItem ? quantity * lttpItem.unitPrice : 0
        
        nextDayInventory.previousDay = {
          quantity,
          amount,
          expiryDate
        }
        await nextDayInventory.save()
      }
    } catch (error) {
      console.error('Error updating next day carry over:', error)
    }
  }
  
  // Generate quality check report
  static async generateQualityReport(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Cần cung cấp ngày bắt đầu và ngày kết thúc'
        })
      }
      
      const qualityReport = await LTTPInventory.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(startDate as string),
              $lte: new Date(endDate as string)
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
      ])
      
      res.json({
        success: true,
        data: qualityReport
      })
    } catch (error) {
      console.error('Error generating quality report:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo báo cáo chất lượng',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
} 