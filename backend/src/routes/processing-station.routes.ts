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
  getDailySausageData,
  updateDailySausageData,
  getWeeklySausageTracking,
  getMonthlySausageSummary,
  getWeeklyLivestockTracking,
  getMonthlyLivestockSummary,
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
router.get("/sausage/:date", getDailySausageData)
router.get("/sausage/weekly-tracking", getWeeklySausageTracking)
router.get("/sausage/monthly-summary", getMonthlySausageSummary)
router.get("/livestock/weekly-tracking", getWeeklyLivestockTracking)
router.get("/livestock/monthly-summary", getMonthlyLivestockSummary)
router.get("/:id", getProcessingStationItemById)

// Routes for admin and station manager
router.post("/", authorize("admin", "stationManager"), createProcessingStationItem)
router.patch("/daily/:date", authorize("admin", "stationManager"), updateDailyTofuData)
router.patch("/sausage/:date", authorize("admin", "stationManager"), updateDailySausageData)
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
router.get('/station/lttp/:date', authorize("admin", "stationManager"), getLttpData)
router.post('/station/lttp/:date', authorize("admin", "stationManager"), updateLttpData)

export default router
