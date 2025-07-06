import { Request, Response } from 'express'
import { LTTPItem } from '../models/lttp-item.model'
import { validationResult } from 'express-validator'

export class LTTPItemController {
  // Get all LTTP items
  static async getAllItems(req: Request, res: Response) {
    try {
      const { category, isActive = true, search, page = 1, limit = 50 } = req.query
      
      const filter: any = {}
      if (category) filter.category = category
      if (isActive !== undefined) filter.isActive = isActive === 'true'
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      }
      
      const items = await LTTPItem.find(filter)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .sort({ category: 1, name: 1 })
        .limit(Number(limit) * 1)
        .skip((Number(page) - 1) * Number(limit))
      
      const total = await LTTPItem.countDocuments(filter)
      
      res.json({
        success: true,
        data: items,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total
        }
      })
    } catch (error) {
      console.error('Error fetching LTTP items:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách LTTP',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  // Get item by ID
  static async getItemById(req: Request, res: Response) {
    try {
      const { id } = req.params
      
      const item = await LTTPItem.findById(id)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
      
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy mặt hàng LTTP'
        })
      }
      
      res.json({
        success: true,
        data: item
      })
    } catch (error) {
      console.error('Error fetching LTTP item:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin LTTP',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  // Create new item
  static async createItem(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: errors.array()
        })
      }
      
      const itemData = {
        ...req.body,
        createdBy: (req as any).user.id
      }
      
      const item = new LTTPItem(itemData)
      await item.save()
      
      await item.populate('createdBy', 'name email')
      
      res.status(201).json({
        success: true,
        message: 'Tạo mặt hàng LTTP thành công',
        data: item
      })
    } catch (error) {
      console.error('Error creating LTTP item:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo mặt hàng LTTP',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  // Update item
  static async updateItem(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: errors.array()
        })
      }
      
      const { id } = req.params
      const updateData = {
        ...req.body,
        updatedBy: (req as any).user.id
      }
      
      const item = await LTTPItem.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('createdBy updatedBy', 'name email')
      
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy mặt hàng LTTP'
        })
      }
      
      res.json({
        success: true,
        message: 'Cập nhật mặt hàng LTTP thành công',
        data: item
      })
    } catch (error) {
      console.error('Error updating LTTP item:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật mặt hàng LTTP',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  // Delete item (soft delete)
  static async deleteItem(req: Request, res: Response) {
    try {
      const { id } = req.params
      
      const item = await LTTPItem.findByIdAndUpdate(
        id,
        { 
          isActive: false,
          updatedBy: (req as any).user.id
        },
        { new: true }
      )
      
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy mặt hàng LTTP'
        })
      }
      
      res.json({
        success: true,
        message: 'Xóa mặt hàng LTTP thành công'
      })
    } catch (error) {
      console.error('Error deleting LTTP item:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa mặt hàng LTTP',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  // Get categories
  static async getCategories(req: Request, res: Response) {
    try {
      const categories = await LTTPItem.distinct('category')
      
      res.json({
        success: true,
        data: categories
      })
    } catch (error) {
      console.error('Error fetching categories:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách phân loại',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  // Get units
  static async getUnits(req: Request, res: Response) {
    try {
      const units = await LTTPItem.distinct('unit')
      
      res.json({
        success: true,
        data: units
      })
    } catch (error) {
      console.error('Error fetching units:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách đơn vị tính',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  // Update price
  static async updatePrice(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { unitPrice } = req.body
      
      if (!unitPrice || unitPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'Giá không hợp lệ'
        })
      }
      
      const item = await LTTPItem.findByIdAndUpdate(
        id,
        { 
          unitPrice,
          lastUpdatedPrice: new Date(),
          updatedBy: (req as any).user.id
        },
        { new: true }
      )
      
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy mặt hàng LTTP'
        })
      }
      
      res.json({
        success: true,
        message: 'Cập nhật giá thành công',
        data: item
      })
    } catch (error) {
      console.error('Error updating price:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật giá',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  // Bulk import
  static async bulkImport(req: Request, res: Response) {
    try {
      const { items } = req.body
      
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu nhập không hợp lệ'
        })
      }
      
      const createdItems = []
      const errors = []
      
      for (let i = 0; i < items.length; i++) {
        try {
          const itemData = {
            ...items[i],
            createdBy: (req as any).user.id
          }
          
          const item = new LTTPItem(itemData)
          await item.save()
          createdItems.push(item)
        } catch (error) {
          errors.push({
            index: i + 1,
            data: items[i],
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
      
      res.json({
        success: true,
        message: `Nhập thành công ${createdItems.length}/${items.length} mặt hàng`,
        data: {
          created: createdItems.length,
          total: items.length,
          errors
        }
      })
    } catch (error) {
      console.error('Error bulk importing:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi nhập hàng loạt',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
} 