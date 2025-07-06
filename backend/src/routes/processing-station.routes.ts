import express from "express"
import {
  getProcessingStationItems,
  getProcessingStationItemById,
  createProcessingStationItem,
  updateProcessingStationItem,
  deleteProcessingStationItem,
  getFoodInventory,
  updateExpiryStatus,
  getDailyTofuData,
  updateDailyTofuData,
  getDailySaltData,
  updateDailySaltData,
  getDailySausageData,
  updateDailySausageData,
  getDailyPoultryData,
  updateDailyPoultryData,
  getDailyLivestockData,
  updateDailyLivestockData,
  getWeeklySausageTracking,
  getMonthlySausageSummary,
  getWeeklyLivestockTracking,
  getMonthlyLivestockSummary,
  getWeeklyPoultryTracking,
  getMonthlyPoultrySummary,
  getDailyData,
  updateDailyData,
  getWeeklyData,
  getMonthlyData,
  getLttpData,
  updateLttpData,
} from "../controllers/processing-station.controller"
import { protect, authorize } from "../middleware/auth.middleware"

const router = express.Router()

// Protected routes
router.use(protect)

// Routes for all authenticated users
router.get("/", getProcessingStationItems)
router.get("/food-inventory", getFoodInventory)
router.get("/daily/:date", getDailyTofuData)
// Weekly and monthly routes MUST come before :date routes to avoid parameter matching
router.get("/sausage/weekly-tracking", getWeeklySausageTracking)
router.get("/sausage/monthly-summary", getMonthlySausageSummary)
router.get("/livestock/weekly-tracking", getWeeklyLivestockTracking)
router.get("/livestock/monthly-summary", getMonthlyLivestockSummary)
router.get("/poultry/weekly-tracking", getWeeklyPoultryTracking)
router.get("/poultry/monthly-summary", getMonthlyPoultrySummary)
// Daily routes with :date param come after specific routes
router.get("/salt/:date", getDailySaltData)
router.get("/sausage/:date", getDailySausageData)
router.get("/poultry/:date", getDailyPoultryData)
router.get("/livestock/:date", getDailyLivestockData)
router.get("/:id", getProcessingStationItemById)

// Routes for admin and station manager
router.post("/", authorize("admin", "stationManager"), createProcessingStationItem)
router.patch("/daily/:date", authorize("admin", "stationManager"), updateDailyTofuData)
router.patch("/salt/:date", authorize("admin", "stationManager"), updateDailySaltData)
router.patch("/sausage/:date", authorize("admin", "stationManager"), updateDailySausageData)
router.patch("/poultry/:date", authorize("admin", "stationManager"), updateDailyPoultryData)
router.patch("/livestock/:date", authorize("admin", "stationManager"), updateDailyLivestockData)
router.patch("/:id", authorize("admin", "stationManager"), updateProcessingStationItem)
router.delete("/:id", authorize("admin"), deleteProcessingStationItem) // Only admin can delete
router.post("/update-expiry", authorize("admin"), updateExpiryStatus) // Only admin can update expiry

// Station manager editing routes
router.get('/station/daily/:date', authorize("admin", "stationManager"), getDailyData)
router.post('/station/daily/:date', authorize("admin", "stationManager"), updateDailyData)

// Weekly data routes  
router.get('/station/weekly/:week/:year', authorize("admin", "stationManager"), getWeeklyData)

// Monthly data routes
router.get('/station/monthly/:month/:year', authorize("admin", "stationManager"), getMonthlyData)

// LTTP management routes
router.get('/lttp/:date', authorize("admin", "stationManager"), getLttpData)
router.post('/lttp/:date', authorize("admin", "stationManager"), updateLttpData)

export default router
