import { Router } from 'express'
import { LTTPItemController } from '../controllers/lttp-item.controller'
import { LTTPInventoryController } from '../controllers/lttp-inventory.controller'
import { protect } from '../middleware/auth.middleware'
import { body, param, query } from 'express-validator'

const router = Router()

// LTTP Items routes
router.get('/items', protect, LTTPItemController.getAllItems)
router.get('/items/categories', protect, LTTPItemController.getCategories)
router.get('/items/units', protect, LTTPItemController.getUnits)
router.get('/items/:id', protect, param('id').isMongoId(), LTTPItemController.getItemById)

router.post('/items', 
  protect,
  [
    body('name').notEmpty().withMessage('Tên mặt hàng không được để trống'),
    body('category').notEmpty().withMessage('Phân loại không được để trống'),
    body('unit').notEmpty().withMessage('Đơn vị tính không được để trống'),
    body('unitPrice').isNumeric().withMessage('Giá phải là số')
  ],
  LTTPItemController.createItem
)

router.put('/items/:id',
  protect,
  [
    param('id').isMongoId(),
    body('name').optional().notEmpty(),
    body('category').optional().notEmpty(),
    body('unit').optional().notEmpty(),
    body('unitPrice').optional().isNumeric()
  ],
  LTTPItemController.updateItem
)

router.delete('/items/:id', protect, param('id').isMongoId(), LTTPItemController.deleteItem)

router.patch('/items/:id/price',
  protect,
  [
    param('id').isMongoId(),
    body('unitPrice').isNumeric().withMessage('Giá phải là số')
  ],
  LTTPItemController.updatePrice
)

router.post('/items/bulk-import', protect, LTTPItemController.bulkImport)

// LTTP Inventory routes
router.get('/inventory', protect, LTTPInventoryController.getInventoryByDate)

router.get('/inventory/range',
  protect,
  [
    query('startDate').isISO8601().withMessage('Ngày bắt đầu không hợp lệ'),
    query('endDate').isISO8601().withMessage('Ngày kết thúc không hợp lệ')
  ],
  LTTPInventoryController.getInventoryByDateRange
)

router.post('/inventory',
  protect,
  [
    body('date').isISO8601().withMessage('Ngày không hợp lệ'),
    body('lttpItemId').isMongoId().withMessage('ID mặt hàng không hợp lệ'),
    body('input.quantity').optional().isNumeric(),
    body('output.quantity').optional().isNumeric()
  ],
  LTTPInventoryController.createOrUpdateInventory
)

router.post('/inventory/initialize',
  protect,
  [
    body('date').optional().isISO8601()
  ],
  LTTPInventoryController.initializeInventoryForDate
)

router.get('/inventory/expiry-alerts', protect, LTTPInventoryController.getExpiryAlerts)

router.get('/inventory/summary', protect, LTTPInventoryController.getInventorySummary)

router.get('/inventory/quality-report',
  protect,
  [
    query('startDate').isISO8601().withMessage('Ngày bắt đầu không hợp lệ'),
    query('endDate').isISO8601().withMessage('Ngày kết thúc không hợp lệ')
  ],
  LTTPInventoryController.generateQualityReport
)

export default router 