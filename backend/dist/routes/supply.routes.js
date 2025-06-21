"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supply_controller_1 = require("../controllers/supply.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// All routes are protected
router.use(auth_middleware_1.protect);
// Export route (should be before /:id routes)
router.get("/export", supply_controller_1.exportSuppliesExcel);
// Routes for all authenticated users
router.get("/", supply_controller_1.getSupplies);
router.get("/categories", supply_controller_1.getFoodCategories);
router.get("/products/:categoryId", supply_controller_1.getFoodProducts);
router.get("/:id", supply_controller_1.getSupplyById);
// Routes for unit assistants and admin
router.post("/", (0, auth_middleware_1.authorize)("unitAssistant", "admin"), supply_controller_1.createSupply);
router.patch("/:id", supply_controller_1.updateSupply); // Permission check inside controller
// Routes for brigade assistants and admin
router.patch("/:id/approve", (0, auth_middleware_1.authorize)("brigadeAssistant", "admin"), supply_controller_1.approveSupply);
router.patch("/:id/reject", (0, auth_middleware_1.authorize)("brigadeAssistant", "admin"), supply_controller_1.rejectSupply);
// Routes for station manager to receive supplies
router.patch("/:id/receive", (0, auth_middleware_1.authorize)("stationManager", "admin"), supply_controller_1.receiveSupply);
// Routes for unit assistants and admin
router.delete("/:id", supply_controller_1.deleteSupply); // Permission check inside controller
exports.default = router;
