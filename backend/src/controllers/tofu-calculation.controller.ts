import type { Request, Response } from "express"
import { ObjectId } from "mongodb"
import { getDb } from "../config/database"

interface TofuRequirement {
  lttpId: string
  lttpName: string
  quantityPerServing: number
  unit: string
  dishName: string
  mealType: string
}

interface UnitTofuCalculation {
  unitId: string
  unitName: string
  personnel: number
  totalTofuRequired: number
  requirementsByMeal: {
    morning: TofuRequirement[]
    noon: TofuRequirement[]
    evening: TofuRequirement[]
  }
  totalByMeal: {
    morning: number
    noon: number
    evening: number
  }
}

interface TofuCalculationResult {
  date: string
  totalTofuRequired: number
  totalPersonnel: number
  units: UnitTofuCalculation[]
  dishesUsingTofu: {
    dishName: string
    mealType: string
    tofuIngredients: TofuRequirement[]
  }[]
  summary: {
    totalDishesUsingTofu: number
    averageTofuPerPerson: number
    recommendedSoybeanInput: number // Ước tính đậu tương cần để làm đủ đậu phụ
  }
}

// @desc    Calculate tofu requirements from menu and unit personnel
// @route   GET /api/tofu-calculation/requirements
// @access  Private
export const calculateTofuRequirements = async (req: Request, res: Response) => {
  try {
    const { date, week, year, unitIds } = req.query

    if (!date && (!week || !year)) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp ngày hoặc tuần/năm"
      })
    }

    const db = await getDb()

    let targetDate: string
    let dailyMenus: any[] = []

    if (date) {
      // Calculate for specific date
      targetDate = date as string
      
      // Find menu containing this date
      const selectedDate = new Date(targetDate)
      const menu = await db.collection("menus").findOne({
        startDate: { $lte: selectedDate },
        endDate: { $gte: selectedDate }
      })

      if (!menu) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thực đơn cho ngày này"
        })
      }

      // Get daily menu for this date
      const dailyMenu = await db.collection("dailyMenus").findOne({
        menuId: menu._id,
        date: selectedDate
      })

      if (dailyMenu) {
        dailyMenus = [dailyMenu]
      }
    } else {
      // Calculate for week
      const weekNum = parseInt(week as string)
      const yearNum = parseInt(year as string)
      
      const menu = await db.collection("menus").findOne({
        week: weekNum,
        year: yearNum
      })

      if (!menu) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thực đơn cho tuần này"
        })
      }

      // Get all daily menus for this week
      dailyMenus = await db.collection("dailyMenus")
        .find({ menuId: menu._id })
        .sort({ date: 1 })
        .toArray()

      // For week calculation, use the first date or current date
      targetDate = dailyMenus.length > 0 
        ? dailyMenus[0].date instanceof Date 
          ? dailyMenus[0].date.toISOString().split('T')[0]
          : dailyMenus[0].date
        : new Date().toISOString().split('T')[0]
    }

    if (dailyMenus.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không có dữ liệu thực đơn cho thời gian này"
      })
    }

    // Get all units
    let units: any[] = []
    if (unitIds) {
      const unitIdArray = Array.isArray(unitIds) ? unitIds : [unitIds]
      const validUnitIds = unitIdArray.filter(id => ObjectId.isValid(id as string))
      units = await db.collection("units")
        .find({ _id: { $in: validUnitIds.map(id => new ObjectId(id as string)) } })
        .toArray()
    } else {
      units = await db.collection("units").find({ status: "active" }).toArray()
    }

    // Get personnel data for target date
    const personnelData = await db.collection("unitPersonnelDaily")
      .find({ date: targetDate })
      .toArray()

    const personnelMap = new Map()
    personnelData.forEach(p => {
      personnelMap.set(p.unitId.toString(), p.personnel)
    })

    const result: TofuCalculationResult = {
      date: targetDate,
      totalTofuRequired: 0,
      totalPersonnel: 0,
      units: [],
      dishesUsingTofu: [],
      summary: {
        totalDishesUsingTofu: 0,
        averageTofuPerPerson: 0,
        recommendedSoybeanInput: 0
      }
    }

    const tofuDishes = new Set<string>()

    // Process each daily menu
    for (const dailyMenu of dailyMenus) {
      // Get meals for this daily menu
      const meals = await db.collection("meals")
        .aggregate([
          { $match: { dailyMenuId: dailyMenu._id } },
          {
            $lookup: {
              from: "dishes",
              localField: "dishes",
              foreignField: "_id",
              as: "dishDetails"
            }
          }
        ])
        .toArray()

      // Find dishes containing tofu
      for (const meal of meals) {
        if (meal.dishDetails && Array.isArray(meal.dishDetails)) {
          for (const dish of meal.dishDetails) {
            if (dish.ingredients && Array.isArray(dish.ingredients)) {
              const tofuIngredients = dish.ingredients.filter((ing: any) => 
                ing.lttpName.toLowerCase().includes('đậu phụ') || 
                ing.lttpName.toLowerCase().includes('tofu')
              )

              if (tofuIngredients.length > 0) {
                tofuDishes.add(dish.name)
                
                const dishInfo = {
                  dishName: dish.name,
                  mealType: meal.type,
                  tofuIngredients: tofuIngredients.map((ing: any) => ({
                    lttpId: ing.lttpId,
                    lttpName: ing.lttpName,
                    quantityPerServing: ing.quantity / (dish.servings || 1),
                    unit: ing.unit,
                    dishName: dish.name,
                    mealType: meal.type
                  }))
                }

                // Check if this dish is already in the result
                const existingDish = result.dishesUsingTofu.find(d => 
                  d.dishName === dish.name && d.mealType === meal.type
                )
                
                if (!existingDish) {
                  result.dishesUsingTofu.push(dishInfo)
                }
              }
            }
          }
        }
      }
    }

    // Calculate tofu requirements for each unit
    for (const unit of units) {
      const unitPersonnel = personnelMap.get(unit._id.toString()) || unit.personnel || 0
      
      const unitCalculation: UnitTofuCalculation = {
        unitId: unit._id.toString(),
        unitName: unit.name,
        personnel: unitPersonnel,
        totalTofuRequired: 0,
        requirementsByMeal: {
          morning: [],
          noon: [],
          evening: []
        },
        totalByMeal: {
          morning: 0,
          noon: 0,
          evening: 0
        }
      }

      // Calculate requirements for each meal and dish
      for (const dishInfo of result.dishesUsingTofu) {
        for (const tofuIngredient of dishInfo.tofuIngredients) {
          const totalRequired = tofuIngredient.quantityPerServing * unitPersonnel
          
          const requirement: TofuRequirement = {
            ...tofuIngredient,
            quantityPerServing: totalRequired
          }

          unitCalculation.requirementsByMeal[dishInfo.mealType as keyof typeof unitCalculation.requirementsByMeal].push(requirement)
          unitCalculation.totalByMeal[dishInfo.mealType as keyof typeof unitCalculation.totalByMeal] += totalRequired
          unitCalculation.totalTofuRequired += totalRequired
        }
      }

      result.units.push(unitCalculation)
      result.totalTofuRequired += unitCalculation.totalTofuRequired
      result.totalPersonnel += unitPersonnel
    }

    // Calculate summary
    result.summary.totalDishesUsingTofu = tofuDishes.size
    result.summary.averageTofuPerPerson = result.totalPersonnel > 0 
      ? result.totalTofuRequired / result.totalPersonnel 
      : 0

    // Estimate soybean input needed (typical conversion rate: 1kg soybean → ~2.5kg tofu)
    result.summary.recommendedSoybeanInput = result.totalTofuRequired / 2.5

    res.status(200).json({
      success: true,
      data: result
    })
    
  } catch (error) {
    console.error("Error calculating tofu requirements:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi tính toán yêu cầu đậu phụ"
    })
  }
}

// @desc    Calculate tofu requirements for a specific week with daily breakdown
// @route   GET /api/tofu-calculation/weekly-requirements
// @access  Private
export const calculateWeeklyTofuRequirements = async (req: Request, res: Response) => {
  try {
    const { week, year, unitIds } = req.query

    if (!week || !year) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp tuần và năm"
      })
    }

    const db = await getDb()
    
    const weekNum = parseInt(week as string)
    const yearNum = parseInt(year as string)

    // Get menu for the week
    const menu = await db.collection("menus").findOne({
      week: weekNum,
      year: yearNum
    })

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thực đơn cho tuần này"
      })
    }

    // Get all daily menus for this week
    const dailyMenus = await db.collection("dailyMenus")
      .find({ menuId: menu._id })
      .sort({ date: 1 })
      .toArray()

    if (dailyMenus.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không có dữ liệu thực đơn hàng ngày cho tuần này"
      })
    }

    const weeklyResults: { [date: string]: any } = {}
    let totalWeeklyTofu = 0
    let totalWeeklyPersonnel = 0

    // Process each day manually since we can't call the other function easily
    for (const dailyMenu of dailyMenus) {
      const dateStr = dailyMenu.date instanceof Date 
        ? dailyMenu.date.toISOString().split('T')[0]
        : dailyMenu.date

      // Calculate tofu requirements for this specific day
      try {
        const dailyResult = await calculateDailyTofuForDate(db, dateStr, unitIds)
        weeklyResults[dateStr] = dailyResult
        totalWeeklyTofu += dailyResult.totalTofuRequired
        totalWeeklyPersonnel += dailyResult.totalPersonnel
      } catch (error) {
        console.error(`Error calculating tofu for date ${dateStr}:`, error)
        weeklyResults[dateStr] = {
          date: dateStr,
          totalTofuRequired: 0,
          totalPersonnel: 0,
          units: [],
          dishesUsingTofu: [],
          error: "Không thể tính toán cho ngày này"
        }
      }
    }

    const weeklyAverage = {
      averageDailyTofu: Object.keys(weeklyResults).length > 0 
        ? totalWeeklyTofu / Object.keys(weeklyResults).length 
        : 0,
      averageTofuPerPerson: totalWeeklyPersonnel > 0 
        ? totalWeeklyTofu / totalWeeklyPersonnel 
        : 0,
      totalWeeklyTofu,
      estimatedWeeklySoybean: totalWeeklyTofu / 2.5
    }

    res.status(200).json({
      success: true,
      data: {
        week: weekNum,
        year: yearNum,
        dailyResults: weeklyResults,
        weeklyTotals: {
          totalTofuRequired: totalWeeklyTofu,
          totalPersonnelDays: totalWeeklyPersonnel,
          ...weeklyAverage
        }
      }
    })

  } catch (error) {
    console.error("Error calculating weekly tofu requirements:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi tính toán yêu cầu đậu phụ hàng tuần"
    })
  }
}

// Helper function to calculate tofu for a specific date
async function calculateDailyTofuForDate(db: any, targetDate: string, unitIds?: any): Promise<TofuCalculationResult> {
  // Find menu containing this date
  const selectedDate = new Date(targetDate)
  const menu = await db.collection("menus").findOne({
    startDate: { $lte: selectedDate },
    endDate: { $gte: selectedDate }
  })

  if (!menu) {
    throw new Error("Không tìm thấy thực đơn cho ngày này")
  }

  // Get daily menu for this date
  const dailyMenu = await db.collection("dailyMenus").findOne({
    menuId: menu._id,
    date: selectedDate
  })

  if (!dailyMenu) {
    throw new Error("Không có thực đơn cho ngày này")
  }

  // Get all units
  let units: any[] = []
  if (unitIds) {
    const unitIdArray = Array.isArray(unitIds) ? unitIds : [unitIds]
    const validUnitIds = unitIdArray.filter(id => ObjectId.isValid(id as string))
    units = await db.collection("units")
      .find({ _id: { $in: validUnitIds.map(id => new ObjectId(id as string)) } })
      .toArray()
  } else {
    units = await db.collection("units").find({ status: "active" }).toArray()
  }

  // Get personnel data for target date
  const personnelData = await db.collection("unitPersonnelDaily")
    .find({ date: targetDate })
    .toArray()

  const personnelMap = new Map()
  personnelData.forEach(p => {
    personnelMap.set(p.unitId.toString(), p.personnel)
  })

  const result: TofuCalculationResult = {
    date: targetDate,
    totalTofuRequired: 0,
    totalPersonnel: 0,
    units: [],
    dishesUsingTofu: [],
    summary: {
      totalDishesUsingTofu: 0,
      averageTofuPerPerson: 0,
      recommendedSoybeanInput: 0
    }
  }

  const tofuDishes = new Set<string>()

  // Get meals for this daily menu
  const meals = await db.collection("meals")
    .aggregate([
      { $match: { dailyMenuId: dailyMenu._id } },
      {
        $lookup: {
          from: "dishes",
          localField: "dishes",
          foreignField: "_id",
          as: "dishDetails"
        }
      }
    ])
    .toArray()

  // Find dishes containing tofu
  for (const meal of meals) {
    if (meal.dishDetails && Array.isArray(meal.dishDetails)) {
      for (const dish of meal.dishDetails) {
        if (dish.ingredients && Array.isArray(dish.ingredients)) {
          const tofuIngredients = dish.ingredients.filter((ing: any) => 
            ing.lttpName.toLowerCase().includes('đậu phụ') || 
            ing.lttpName.toLowerCase().includes('tofu')
          )

          if (tofuIngredients.length > 0) {
            tofuDishes.add(dish.name)
            
            const dishInfo = {
              dishName: dish.name,
              mealType: meal.type,
              tofuIngredients: tofuIngredients.map((ing: any) => ({
                lttpId: ing.lttpId,
                lttpName: ing.lttpName,
                quantityPerServing: ing.quantity / (dish.servings || 1),
                unit: ing.unit,
                dishName: dish.name,
                mealType: meal.type
              }))
            }

            const existingDish = result.dishesUsingTofu.find(d => 
              d.dishName === dish.name && d.mealType === meal.type
            )
            
            if (!existingDish) {
              result.dishesUsingTofu.push(dishInfo)
            }
          }
        }
      }
    }
  }

  // Calculate tofu requirements for each unit
  for (const unit of units) {
    const unitPersonnel = personnelMap.get(unit._id.toString()) || unit.personnel || 0
    
    const unitCalculation: UnitTofuCalculation = {
      unitId: unit._id.toString(),
      unitName: unit.name,
      personnel: unitPersonnel,
      totalTofuRequired: 0,
      requirementsByMeal: {
        morning: [],
        noon: [],
        evening: []
      },
      totalByMeal: {
        morning: 0,
        noon: 0,
        evening: 0
      }
    }

    // Calculate requirements for each meal and dish
    for (const dishInfo of result.dishesUsingTofu) {
      for (const tofuIngredient of dishInfo.tofuIngredients) {
        const totalRequired = tofuIngredient.quantityPerServing * unitPersonnel
        
        const requirement: TofuRequirement = {
          ...tofuIngredient,
          quantityPerServing: totalRequired
        }

        unitCalculation.requirementsByMeal[dishInfo.mealType as keyof typeof unitCalculation.requirementsByMeal].push(requirement)
        unitCalculation.totalByMeal[dishInfo.mealType as keyof typeof unitCalculation.totalByMeal] += totalRequired
        unitCalculation.totalTofuRequired += totalRequired
      }
    }

    result.units.push(unitCalculation)
    result.totalTofuRequired += unitCalculation.totalTofuRequired
    result.totalPersonnel += unitPersonnel
  }

  // Calculate summary
  result.summary.totalDishesUsingTofu = tofuDishes.size
  result.summary.averageTofuPerPerson = result.totalPersonnel > 0 
    ? result.totalTofuRequired / result.totalPersonnel 
    : 0

  result.summary.recommendedSoybeanInput = result.totalTofuRequired / 2.5

  return result
}

// @desc    Get tofu usage statistics
// @route   GET /api/tofu-calculation/statistics
// @access  Private
export const getTofuUsageStatistics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp ngày bắt đầu và kết thúc"
      })
    }

    const db = await getDb()

    // Get all dishes that use tofu
    const tofuDishes = await db.collection("dishes")
      .find({
        "ingredients.lttpName": { 
          $regex: /đậu phụ|tofu/i 
        }
      })
      .toArray()

    // Get processing station tofu data
    const tofuProcessingData = await db.collection("dailyTofuProcessing")
      .find({
        date: {
          $gte: startDate,
          $lte: endDate
        }
      })
      .sort({ date: 1 })
      .toArray()

    const totalProcessedTofu = tofuProcessingData.reduce((sum, data) => 
      sum + (data.tofuInput || 0), 0
    )

    const totalSoybeanUsed = tofuProcessingData.reduce((sum, data) => 
      sum + (data.soybeanInput || 0), 0
    )

    const conversionRate = totalSoybeanUsed > 0 ? totalProcessedTofu / totalSoybeanUsed : 2.5

    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        tofuDishes: tofuDishes.map(dish => ({
          _id: dish._id.toString(),
          name: dish.name,
          category: dish.category,
          tofuIngredients: dish.ingredients.filter((ing: any) => 
            ing.lttpName.toLowerCase().includes('đậu phụ') || 
            ing.lttpName.toLowerCase().includes('tofu')
          )
        })),
        processing: {
          totalDays: tofuProcessingData.length,
          totalSoybeanInput: totalSoybeanUsed,
          totalTofuOutput: totalProcessedTofu,
          averageConversionRate: conversionRate,
          dailyData: tofuProcessingData
        },
        summary: {
          dishesWithTofu: tofuDishes.length,
          averageDailyTofuProduction: tofuProcessingData.length > 0 
            ? totalProcessedTofu / tofuProcessingData.length 
            : 0
        }
      }
    })

  } catch (error) {
    console.error("Error getting tofu usage statistics:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy thống kê sử dụng đậu phụ"
    })
  }
} 