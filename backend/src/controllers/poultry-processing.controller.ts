import { Request, Response } from "express"
import { ObjectId } from "mongodb"
import { getDb } from "../config/database"

interface PoultryProcessing {
  date: string
  dayOfWeek: string
  livePoultryInput: number
  poultryMeatOutput: number 
  poultryMeatActualOutput: number
  poultryMeatRemaining: number
  carryOverAmount: number
  livePoultryPrice: number
  poultryMeatPrice: number
}

// @desc    Get weekly poultry processing data
// @route   GET /api/poultry-processing/weekly
// @access  Private
export const getWeeklyPoultryProcessing = async (req: Request, res: Response) => {
  try {
    const { week, year } = req.query
    const db = await getDb()

    const weekStart = new Date(Number(year), 0, 1 + (Number(week) - 1) * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    // Format dates for query
    const startDate = weekStart.toISOString().split('T')[0]
    const endDate = weekEnd.toISOString().split('T')[0]

    // Find previous day's remaining amount
    const previousDay = new Date(weekStart)
    previousDay.setDate(previousDay.getDate() - 1)
    const previousDayStr = previousDay.toISOString().split('T')[0]
    
    const previousRecord = await db.collection("poultryProcessing")
      .findOne({ date: previousDayStr })

    const previousRemaining = previousRecord?.poultryMeatRemaining || 0

    // Get week data
    const weeklyData = await db.collection("poultryProcessing")
      .find({
        date: {
          $gte: startDate,
          $lte: endDate
        }
      })
      .sort({ date: 1 })
      .toArray()

    // Transform data and add carry over
    const dailyData = weeklyData.map((record, index) => {
      const date = new Date(record.date)
      const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']
      
      let carryOverAmount = 0
      if (index === 0) {
        carryOverAmount = previousRemaining
      } else {
        carryOverAmount = weeklyData[index - 1].poultryMeatRemaining || 0
      }

      return {
        date: record.date,
        dayOfWeek: dayNames[date.getDay()],
        livePoultryInput: record.livePoultryInput || 0,
        poultryMeatOutput: record.poultryMeatOutput || 0,
        poultryMeatActualOutput: record.poultryMeatActualOutput || 0,
        poultryMeatRemaining: (carryOverAmount + (record.poultryMeatOutput || 0)) - (record.poultryMeatActualOutput || 0),
        carryOverAmount,
        livePoultryPrice: record.livePoultryPrice || 0,
        poultryMeatPrice: record.poultryMeatPrice || 0
      }
    })

    res.status(200).json({
      success: true,
      data: {
        startDate,
        endDate,
        dailyData
      }
    })

  } catch (error) {
    console.error("Error getting weekly poultry processing:", error)
    res.status(500).json({
      success: false,
      message: "Không thể lấy dữ liệu chế biến gia cầm theo tuần"
    })
  }
}

// @desc    Get daily poultry processing data
// @route   GET /api/poultry-processing/daily/:date
// @access  Private
export const getDailyPoultryProcessing = async (req: Request, res: Response) => {
  try {
    const { date } = req.params
    const db = await getDb()

    const dailyData = await db.collection("poultryProcessing")
      .findOne({ date })

    if (!dailyData) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dữ liệu cho ngày này"
      })
    }

    // Get previous day's remaining amount
    const previousDay = new Date(date)
    previousDay.setDate(previousDay.getDate() - 1)
    const previousDayStr = previousDay.toISOString().split('T')[0]
    
    const previousRecord = await db.collection("poultryProcessing")
      .findOne({ date: previousDayStr })

    const carryOverAmount = previousRecord?.poultryMeatRemaining || 0
    const poultryMeatRemaining = (carryOverAmount + (dailyData.poultryMeatOutput || 0)) - (dailyData.poultryMeatActualOutput || 0)

    res.status(200).json({
      success: true,
      data: {
        ...dailyData,
        carryOverAmount,
        poultryMeatRemaining
      }
    })

  } catch (error) {
    console.error("Error getting daily poultry processing:", error)
    res.status(500).json({
      success: false, 
      message: "Không thể lấy dữ liệu chế biến gia cầm theo ngày"
    })
  }
}

// @desc    Update daily poultry processing data
// @route   PATCH /api/poultry-processing/daily/:date
// @access  Private 
export const updateDailyPoultryProcessing = async (req: Request, res: Response) => {
  try {
    const { date } = req.params
    const {
      livePoultryInput,
      poultryMeatOutput,
      poultryMeatActualOutput,
      livePoultryPrice,
      poultryMeatPrice
    } = req.body

    const db = await getDb()

    // Get previous day's remaining amount to calculate new remaining
    const previousDay = new Date(date)
    previousDay.setDate(previousDay.getDate() - 1)
    const previousDayStr = previousDay.toISOString().split('T')[0]
    
    const previousRecord = await db.collection("poultryProcessing")
      .findOne({ date: previousDayStr })

    const carryOverAmount = previousRecord?.poultryMeatRemaining || 0
    const poultryMeatRemaining = (carryOverAmount + (poultryMeatOutput || 0)) - (poultryMeatActualOutput || 0)

    // Update or insert record
    const result = await db.collection("poultryProcessing")
      .updateOne(
        { date },
        {
          $set: {
            livePoultryInput,
            poultryMeatOutput,
            poultryMeatActualOutput,
            poultryMeatRemaining,
            livePoultryPrice,
            poultryMeatPrice,
            updatedAt: new Date()
          },
          $setOnInsert: {
            createdAt: new Date()
          }
        },
        { upsert: true }
      )

    res.status(200).json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        upsertedCount: result.upsertedCount
      }
    })

  } catch (error) {
    console.error("Error updating poultry processing:", error)
    res.status(500).json({
      success: false,
      message: "Không thể cập nhật dữ liệu chế biến gia cầm"
    })
  }
}

// @desc    Get poultry processing statistics
// @route   GET /api/poultry-processing/stats
// @access  Private
export const getPoultryStats = async (req: Request, res: Response) => {
  try {
    const db = await getDb()

    const stats = await db.collection("poultryProcessing")
      .aggregate([
        {
          $group: {
            _id: null,
            totalLivePoultryInput: { $sum: "$livePoultryInput" },
            totalPoultryMeatOutput: { $sum: "$poultryMeatOutput" },
            totalPoultryMeatActualOutput: { $sum: "$poultryMeatActualOutput" },
            averageLivePoultryPrice: { $avg: "$livePoultryPrice" },
            averagePoultryMeatPrice: { $avg: "$poultryMeatPrice" }
          }
        }
      ])
      .toArray()

    res.status(200).json({
      success: true,
      data: stats[0] || {
        totalLivePoultryInput: 0,
        totalPoultryMeatOutput: 0,
        totalPoultryMeatActualOutput: 0,
        averageLivePoultryPrice: 0,
        averagePoultryMeatPrice: 0
      }
    })

  } catch (error) {
    console.error("Error getting poultry stats:", error)
    res.status(500).json({
      success: false,
      message: "Không thể lấy thống kê chế biến gia cầm"
    })
  }
}