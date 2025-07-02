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
router.get("/daily/:date", processing_station_controller_1.getDailyTofuData);
// Weekly and monthly routes MUST come before :date routes to avoid parameter matching
router.get("/sausage/weekly-tracking", processing_station_controller_1.getWeeklySausageTracking);
router.get("/sausage/monthly-summary", processing_station_controller_1.getMonthlySausageSummary);
router.get("/livestock/weekly-tracking", processing_station_controller_1.getWeeklyLivestockTracking);
router.get("/livestock/monthly-summary", processing_station_controller_1.getMonthlyLivestockSummary);
router.get("/poultry/weekly-tracking", processing_station_controller_1.getWeeklyPoultryTracking);
router.get("/poultry/monthly-summary", processing_station_controller_1.getMonthlyPoultrySummary);
// Daily routes with :date param come after specific routes
router.get("/sausage/:date", processing_station_controller_1.getDailySausageData);
router.get("/poultry/:date", processing_station_controller_1.getDailyPoultryData);
router.get("/livestock/:date", processing_station_controller_1.getDailyLivestockData);
router.get("/:id", processing_station_controller_1.getProcessingStationItemById);
// Routes for admin and station manager
router.post("/", (0, auth_middleware_1.authorize)("admin", "stationManager"), processing_station_controller_1.createProcessingStationItem);
router.patch("/daily/:date", (0, auth_middleware_1.authorize)("admin", "stationManager"), processing_station_controller_1.updateDailyTofuData);
router.patch("/sausage/:date", (0, auth_middleware_1.authorize)("admin", "stationManager"), processing_station_controller_1.updateDailySausageData);
router.patch("/poultry/:date", (0, auth_middleware_1.authorize)("admin", "stationManager"), processing_station_controller_1.updateDailyPoultryData);
router.patch("/livestock/:date", (0, auth_middleware_1.authorize)("admin", "stationManager"), processing_station_controller_1.updateDailyLivestockData);
router.patch("/:id", (0, auth_middleware_1.authorize)("admin", "stationManager"), processing_station_controller_1.updateProcessingStationItem);
router.delete("/:id", (0, auth_middleware_1.authorize)("admin"), processing_station_controller_1.deleteProcessingStationItem); // Only admin can delete
router.post("/update-expiry", (0, auth_middleware_1.authorize)("admin"), processing_station_controller_1.updateExpiryStatus); // Only admin can update expiry
// Station manager editing routes
router.get('/station/daily/:date', (0, auth_middleware_1.authorize)("admin", "stationManager"), processing_station_controller_1.getDailyData);
router.post('/station/daily/:date', (0, auth_middleware_1.authorize)("admin", "stationManager"), processing_station_controller_1.updateDailyData);
// Weekly data routes  
router.get('/station/weekly/:week/:year', (0, auth_middleware_1.authorize)("admin", "stationManager"), processing_station_controller_1.getWeeklyData);
// Monthly data routes
router.get('/station/monthly/:month/:year', (0, auth_middleware_1.authorize)("admin", "stationManager"), processing_station_controller_1.getMonthlyData);
// LTTP management routes
router.get('/lttp/:date', (0, auth_middleware_1.authorize)("admin", "stationManager"), processing_station_controller_1.getLttpData);
router.post('/lttp/:date', (0, auth_middleware_1.authorize)("admin", "stationManager"), processing_station_controller_1.updateLttpData);
exports.default = router;
