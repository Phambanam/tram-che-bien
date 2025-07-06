"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lttp_item_controller_1 = require("../controllers/lttp-item.controller");
const lttp_inventory_controller_1 = require("../controllers/lttp-inventory.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
// LTTP Items routes
router.get('/items', auth_middleware_1.protect, lttp_item_controller_1.LTTPItemController.getAllItems);
router.get('/items/categories', auth_middleware_1.protect, lttp_item_controller_1.LTTPItemController.getCategories);
router.get('/items/units', auth_middleware_1.protect, lttp_item_controller_1.LTTPItemController.getUnits);
router.get('/items/:id', auth_middleware_1.protect, (0, express_validator_1.param)('id').isMongoId(), lttp_item_controller_1.LTTPItemController.getItemById);
router.post('/items', auth_middleware_1.protect, [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Tên mặt hàng không được để trống'),
    (0, express_validator_1.body)('category').notEmpty().withMessage('Phân loại không được để trống'),
    (0, express_validator_1.body)('unit').notEmpty().withMessage('Đơn vị tính không được để trống'),
    (0, express_validator_1.body)('unitPrice').isNumeric().withMessage('Giá phải là số')
], lttp_item_controller_1.LTTPItemController.createItem);
router.put('/items/:id', auth_middleware_1.protect, [
    (0, express_validator_1.param)('id').isMongoId(),
    (0, express_validator_1.body)('name').optional().notEmpty(),
    (0, express_validator_1.body)('category').optional().notEmpty(),
    (0, express_validator_1.body)('unit').optional().notEmpty(),
    (0, express_validator_1.body)('unitPrice').optional().isNumeric()
], lttp_item_controller_1.LTTPItemController.updateItem);
router.delete('/items/:id', auth_middleware_1.protect, (0, express_validator_1.param)('id').isMongoId(), lttp_item_controller_1.LTTPItemController.deleteItem);
router.patch('/items/:id/price', auth_middleware_1.protect, [
    (0, express_validator_1.param)('id').isMongoId(),
    (0, express_validator_1.body)('unitPrice').isNumeric().withMessage('Giá phải là số')
], lttp_item_controller_1.LTTPItemController.updatePrice);
router.post('/items/bulk-import', auth_middleware_1.protect, lttp_item_controller_1.LTTPItemController.bulkImport);
// LTTP Inventory routes
router.get('/inventory', auth_middleware_1.protect, lttp_inventory_controller_1.LTTPInventoryController.getInventoryByDate);
router.get('/inventory/range', auth_middleware_1.protect, [
    (0, express_validator_1.query)('startDate').isISO8601().withMessage('Ngày bắt đầu không hợp lệ'),
    (0, express_validator_1.query)('endDate').isISO8601().withMessage('Ngày kết thúc không hợp lệ')
], lttp_inventory_controller_1.LTTPInventoryController.getInventoryByDateRange);
router.post('/inventory', auth_middleware_1.protect, [
    (0, express_validator_1.body)('date').isISO8601().withMessage('Ngày không hợp lệ'),
    (0, express_validator_1.body)('lttpItemId').isMongoId().withMessage('ID mặt hàng không hợp lệ'),
    (0, express_validator_1.body)('input.quantity').optional().isNumeric(),
    (0, express_validator_1.body)('output.quantity').optional().isNumeric()
], lttp_inventory_controller_1.LTTPInventoryController.createOrUpdateInventory);
router.post('/inventory/initialize', auth_middleware_1.protect, [
    (0, express_validator_1.body)('date').optional().isISO8601()
], lttp_inventory_controller_1.LTTPInventoryController.initializeInventoryForDate);
router.get('/inventory/expiry-alerts', auth_middleware_1.protect, lttp_inventory_controller_1.LTTPInventoryController.getExpiryAlerts);
router.get('/inventory/summary', auth_middleware_1.protect, lttp_inventory_controller_1.LTTPInventoryController.getInventorySummary);
router.get('/inventory/quality-report', auth_middleware_1.protect, [
    (0, express_validator_1.query)('startDate').isISO8601().withMessage('Ngày bắt đầu không hợp lệ'),
    (0, express_validator_1.query)('endDate').isISO8601().withMessage('Ngày kết thúc không hợp lệ')
], lttp_inventory_controller_1.LTTPInventoryController.generateQualityReport);
exports.default = router;
