"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const processing_station_controller_1 = require("../controllers/processing-station.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// Protected routes
router.use(auth_middleware_1.protect);
// Routes for all authenticated users
router.get("/", processing_station_controller_1.getProcessingStationItems);
router.get("/food-inventory", processing_station_controller_1.getFoodInventory);
router.get("/:id", processing_station_controller_1.getProcessingStationItemById);
// Routes for admin and station manager
router.post("/", (0, auth_middleware_1.authorize)("admin", "stationManager"), processing_station_controller_1.createProcessingStationItem);
router.patch("/:id", (0, auth_middleware_1.authorize)("admin", "stationManager"), processing_station_controller_1.updateProcessingStationItem);
router.delete("/:id", (0, auth_middleware_1.authorize)("admin"), processing_station_controller_1.deleteProcessingStationItem); // Only admin can delete
router.post("/update-expiry", (0, auth_middleware_1.authorize)("admin"), processing_station_controller_1.updateExpiryStatus); // Only admin can update expiry
exports.default = router;
