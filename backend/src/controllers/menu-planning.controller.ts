import type { Request, Response } from "express"
import { ObjectId } from "mongodb"
import { getDb } from "../config/database"
import { AppError } from "../middleware/error.middleware"

// Helper function to format date without timezone issues
const formatDateToYMD = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Helper function to get Vietnamese day name
const getVietnameseDayName = (date: Date): string => {
  const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']
  return dayNames[date.getDay()]
}

// Interface definitions
interface IngredientAnalysis {
  lttpId: string
  lttpName: string
  requiredQuantity: number
  availableQuantity: number
  unit: string
  daysUntilExpiry: number
  status: "sufficient" | "insufficient" | "expiring_soon" | "expired"
}

interface MenuSuggestion {
  dishId: string
  dishName: string
  priority: "high" | "medium" | "low"
  reason: string
  ingredients: IngredientAnalysis[]
  estimatedCost: number
  suitableForUnits: string[]
}

interface InventoryAlert {
  productId: string
  productName: string
  currentStock: number
  daysUntilExpiry: number
  alertLevel: "critical" | "warning" | "info"
  recommendedAction: string
}

interface DailyMenuPlan {
  date: string
  totalPersonnel: number
  meals: {
    morning: MenuSuggestion[]
    noon: MenuSuggestion[]
    evening: MenuSuggestion[]
  }
  totalCost: number
  budgetStatus: "under" | "within" | "over"
}

// @desc    Get smart menu suggestions
// @route   GET /api/menu-planning/suggestions
// @access  Private
export const getMenuSuggestions = async (req: Request, res: Response) => {
  try {
    const db = await getDb()
    
    if (!db) {
      return res.status(500).json({
        success: false,
        message: "Không thể kết nối cơ sở dữ liệu"
      })
    }
    
    // Get all dishes with ingredients
    const dishes = await db.collection("dishes").find({}).toArray()
    
    // Get food inventory
    const inventory = await db
      .collection("processingStation")
      .aggregate([
        { $match: { type: "food" } },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        { $unwind: "$productInfo" },
        {
          $group: {
            _id: "$productId",
            product: { $first: "$productInfo" },
            totalQuantity: { $sum: "$quantity" },
            nonExpiredQuantity: { $sum: "$nonExpiredQuantity" },
            expiredQuantity: { $sum: "$expiredQuantity" },
            earliestExpiry: { $min: "$expiryDate" },
          },
        },
      ])
      .toArray()

    // Get daily rations for pricing
    const dailyRations = await db.collection("dailyRations").find({}).toArray()

    const suggestions: MenuSuggestion[] = []

    for (const dish of dishes) {
      if (!dish.ingredients || dish.ingredients.length === 0) continue

      let totalCost = 0
      let priority: "high" | "medium" | "low" = "low"
      const reasons: string[] = []

      const ingredientAnalysis = dish.ingredients.map((ingredient: any) => {
        const inventoryItem = inventory.find(
          (inv) => inv.product._id.toString() === ingredient.lttpId
        )
        
        const availableQuantity = inventoryItem?.nonExpiredQuantity || 0
        const expiredQuantity = inventoryItem?.expiredQuantity || 0
        
        // Calculate days until expiry
        let daysUntilExpiry = 30 // Default
        if (inventoryItem?.earliestExpiry) {
          const now = new Date()
          const expiryDate = new Date(inventoryItem.earliestExpiry)
          daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24))
        }

        let status: "sufficient" | "insufficient" | "expiring_soon" | "expired" = "insufficient"
        
        if (expiredQuantity > 0) {
          status = "expired"
          reasons.push(`${ingredient.lttpName} đã hết hạn`)
        } else if (daysUntilExpiry <= 3) {
          status = "expiring_soon"
          reasons.push(`${ingredient.lttpName} sắp hết hạn (${daysUntilExpiry} ngày)`)
          priority = "high"
        } else if (availableQuantity >= ingredient.quantity) {
          status = "sufficient"
        }

        // Calculate cost from daily rations
        const rationItem = dailyRations.find((r: any) =>
          r.name.toLowerCase().includes(ingredient.lttpName.toLowerCase())
        )
        const unitCost = rationItem?.pricePerUnit || 15000
        totalCost += ingredient.quantity * unitCost

        return {
          lttpId: ingredient.lttpId,
          lttpName: ingredient.lttpName,
          requiredQuantity: ingredient.quantity,
          availableQuantity,
          unit: ingredient.unit,
          daysUntilExpiry,
          status,
        }
      })

      // Determine if dish is feasible
      const insufficientIngredients = ingredientAnalysis.filter(
        (ing: IngredientAnalysis) => ing.status === "insufficient" || ing.status === "expired"
      )
      const expiringSoon = ingredientAnalysis.filter(
        (ing: IngredientAnalysis) => ing.status === "expiring_soon"
      )

      if (insufficientIngredients.length === 0) {
        if (expiringSoon.length > 0) {
          priority = "high"
          reasons.push("Sử dụng nguyên liệu sắp hết hạn")
        } else if (priority === "low") {
          priority = "medium"
        }

        // Get all units for suitability
        const units = await db.collection("units").find({}).toArray()

        suggestions.push({
          dishId: dish._id.toString(),
          dishName: dish.name,
          priority,
          reason: reasons.join(", ") || "Đủ nguyên liệu, phù hợp chế biến",
          ingredients: ingredientAnalysis,
          estimatedCost: totalCost,
          suitableForUnits: units.map((u) => u._id.toString()),
        })
      }
    }

    // Sort by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    suggestions.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])

    res.status(200).json({
      success: true,
      data: suggestions.slice(0, 20), // Top 20 suggestions
    })
  } catch (error) {
    console.error("Error getting menu suggestions:", error)
    return res.status(500).json({
      success: false,
      message: "Không thể kết nối cơ sở dữ liệu"
    })
  }
}

// @desc    Get inventory alerts
// @route   GET /api/menu-planning/alerts
// @access  Private
export const getInventoryAlerts = async (req: Request, res: Response) => {
  try {
    const db = await getDb()

    if (!db) {
      return res.status(500).json({
        success: false,
        message: "Không thể kết nối cơ sở dữ liệu"
      })
    }

    const inventory = await db
      .collection("processingStation")
      .aggregate([
        { $match: { type: "food" } },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        { $unwind: "$productInfo" },
        {
          $group: {
            _id: "$productId",
            product: { $first: "$productInfo" },
            totalQuantity: { $sum: "$quantity" },
            nonExpiredQuantity: { $sum: "$nonExpiredQuantity" },
            expiredQuantity: { $sum: "$expiredQuantity" },
            earliestExpiry: { $min: "$expiryDate" },
          },
        },
      ])
      .toArray()

    const alerts: InventoryAlert[] = []

    for (const item of inventory) {
      // Calculate days until expiry
      let daysUntilExpiry = 30
      if (item.earliestExpiry) {
        const now = new Date()
        const expiryDate = new Date(item.earliestExpiry)
        daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24))
      }

      let alertLevel: "critical" | "warning" | "info" = "info"
      let recommendedAction = ""

      if (item.expiredQuantity > 0) {
        alertLevel = "critical"
        recommendedAction = `Xử lý ${item.expiredQuantity}kg đã hết hạn ngay lập tức`
      } else if (daysUntilExpiry <= 3) {
        alertLevel = "critical"
        recommendedAction = `Ưu tiên sử dụng trong 3 ngày tới (${item.nonExpiredQuantity}kg)`
      } else if (daysUntilExpiry <= 7) {
        alertLevel = "warning"
        recommendedAction = `Lên kế hoạch sử dụng trong tuần (${item.nonExpiredQuantity}kg)`
      } else if (item.nonExpiredQuantity < 10) {
        alertLevel = "warning"
        recommendedAction = "Tồn kho thấp, cân nhắc nhập thêm"
      }

      if (alertLevel !== "info") {
        alerts.push({
          productId: item.product._id.toString(),
          productName: item.product.name,
          currentStock: item.nonExpiredQuantity,
          daysUntilExpiry,
          alertLevel,
          recommendedAction,
        })
      }
    }

    // Sort by alert level
    const alertOrder = { critical: 3, warning: 2, info: 1 }
    alerts.sort((a, b) => alertOrder[b.alertLevel] - alertOrder[a.alertLevel])

    res.status(200).json({
      success: true,
      data: alerts,
    })
  } catch (error) {
    console.error("Error getting inventory alerts:", error)
    return res.status(500).json({
      success: false,
      message: "Không thể kết nối cơ sở dữ liệu"
    })
  }
}

// @desc    Generate daily menu plan
// @route   POST /api/menu-planning/daily-plan
// @access  Private
export const generateDailyMenuPlan = async (req: Request, res: Response) => {
  try {
    const { date } = req.body

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Ngày lập thực đơn là bắt buộc"
      })
    }

    const db = await getDb()

    if (!db) {
      return res.status(500).json({
        success: false,
        message: "Không thể kết nối cơ sở dữ liệu"
      })
    }

    // Get menu suggestions
    const suggestionsResponse = await getMenuSuggestionsInternal()
    const suggestions = suggestionsResponse.data

    // Get total personnel from all units
    const units = await db.collection("units").find({}).toArray()
    const totalPersonnel = units.reduce((sum, unit) => sum + (unit.personnel || 0), 0)
    
    const dailyBudget = totalPersonnel * 65000 // 65,000 VND per person per day

    // Select dishes for each meal based on priority
    const highPriority = suggestions.filter((s: MenuSuggestion) => s.priority === "high").slice(0, 2)
    const mediumPriority = suggestions.filter((s: MenuSuggestion) => s.priority === "medium").slice(0, 3)
    const lowPriority = suggestions.filter((s: MenuSuggestion) => s.priority === "low").slice(0, 3)

    const morningMeals = [...highPriority.slice(0, 1), ...mediumPriority.slice(0, 1)]
    const noonMeals = [...highPriority.slice(1, 2), ...mediumPriority.slice(1, 3)]
    const eveningMeals = [...lowPriority.slice(0, 2)]

    const totalCost = [...morningMeals, ...noonMeals, ...eveningMeals]
      .reduce((sum, meal) => sum + (meal.estimatedCost * totalPersonnel), 0)

    let budgetStatus: "under" | "within" | "over" = "within"
    if (totalCost < dailyBudget * 0.8) budgetStatus = "under"
    else if (totalCost > dailyBudget) budgetStatus = "over"

    const dailyPlan: DailyMenuPlan = {
      date,
      totalPersonnel,
      meals: {
        morning: morningMeals,
        noon: noonMeals,
        evening: eveningMeals,
      },
      totalCost,
      budgetStatus,
    }

    res.status(200).json({
      success: true,
      data: dailyPlan,
    })
  } catch (error) {
    console.error("Error generating daily menu plan:", error)
    return res.status(500).json({
      success: false,
      message: "Không thể kết nối cơ sở dữ liệu"
    })
  }
}

// @desc    Get comprehensive menu planning data
// @route   GET /api/menu-planning/overview
// @access  Private
export const getMenuPlanningOverview = async (req: Request, res: Response) => {
  try {
    const db = await getDb()

    if (!db) {
      return res.status(500).json({
        success: false,
        message: "Không thể kết nối cơ sở dữ liệu"
      })
    }

    // Get all data in parallel
    const [suggestionsResponse, alertsResponse, units, inventory] = await Promise.all([
      getMenuSuggestionsInternal(),
      getInventoryAlertsInternal(),
      db.collection("units").find({}).toArray(),
      db.collection("processingStation")
        .aggregate([
          { $match: { type: "food" } },
          {
            $group: {
              _id: null,
              totalNonExpired: { $sum: "$nonExpiredQuantity" },
              totalExpired: { $sum: "$expiredQuantity" },
            },
          },
        ])
        .toArray(),
    ])

    const totalPersonnel = units.reduce((sum, unit) => sum + (unit.personnel || 0), 0)
    const totalInventory = inventory[0]?.totalNonExpired || 0
    const criticalAlerts = alertsResponse.data.filter((alert: InventoryAlert) => alert.alertLevel === "critical").length

    res.status(200).json({
      success: true,
      data: {
        totalPersonnel,
        totalInventory,
        criticalAlerts,
        totalSuggestions: suggestionsResponse.data.length,
        suggestions: suggestionsResponse.data,
        alerts: alertsResponse.data,
      },
    })
  } catch (error) {
    console.error("Error getting menu planning overview:", error)
    return res.status(500).json({
      success: false,
      message: "Không thể kết nối cơ sở dữ liệu"
    })
  }
}

// @desc    Get daily ingredient summaries for menu planning
// @route   GET /api/menu-planning/ingredient-summaries
// @access  Private
export const getDailyIngredientSummaries = async (req: Request, res: Response) => {
  try {
    const { week, year, date, showAllDays } = req.query
    const db = await getDb()

    if (!db) {
      return res.status(500).json({
        success: false,
        message: "Không thể kết nối cơ sở dữ liệu"
      })
    }

    let matchCriteria: any = {}

    if (week && year) {
      // Get menu by week and year
      matchCriteria = { 
        week: parseInt(week as string), 
        year: parseInt(year as string) 
      }
    } else if (date) {
      // Find menu that contains this specific date
      const selectedDate = new Date(date as string)
      const startOfWeekDate = new Date(selectedDate)
      startOfWeekDate.setDate(selectedDate.getDate() - selectedDate.getDay() + 1) // Monday
      const endOfWeekDate = new Date(startOfWeekDate)
      endOfWeekDate.setDate(startOfWeekDate.getDate() + 6) // Sunday

      matchCriteria = {
        startDate: { $lte: selectedDate },
        endDate: { $gte: selectedDate }
      }
    }

    // Get the menu
    const menu = await db.collection("menus").findOne(matchCriteria)

    if (!menu) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "Không tìm thấy thực đơn cho thời gian được chọn"
      })
    }

    // Get daily menus for this menu
    const dailyMenus = await db
      .collection("dailyMenus")
      .find({ menuId: menu._id })
      .sort({ date: 1 })
      .toArray()

    if (!dailyMenus || dailyMenus.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "Thực đơn không có dữ liệu ngày"
      })
    }

    // Calculate ingredient summaries for each day
    const dailyIngredientSummaries = []

    for (const dailyMenu of dailyMenus) {
      // Skip if not showing all days and date doesn't match
      const dailyMenuDate = new Date(dailyMenu.date)
      const dailyMenuDateStr = formatDateToYMD(dailyMenuDate)
      
      if (!showAllDays && date && dailyMenuDateStr !== date) {
        continue
      }

      const ingredientMap = new Map()

      // Get meals for this daily menu
      const meals = await db
        .collection("meals")
        .aggregate([
          {
            $match: { dailyMenuId: dailyMenu._id },
          },
          {
            $lookup: {
              from: "dishes",
              localField: "dishes",
              foreignField: "_id",
              as: "dishDetails",
            },
          },
        ])
        .toArray()

      // Process each meal of the day
      for (const meal of meals) {
        if (meal.dishDetails && Array.isArray(meal.dishDetails)) {
          for (const dish of meal.dishDetails) {
            if (dish.ingredients && Array.isArray(dish.ingredients)) {
              // Process each ingredient in the dish
              for (const ingredient of dish.ingredients) {
                const key = ingredient.lttpId
                const quantityForMealCount = (ingredient.quantity * dailyMenu.mealCount) / (dish.servings || 1)
                
                if (ingredientMap.has(key)) {
                  const existing = ingredientMap.get(key)
                  existing.totalQuantity += quantityForMealCount
                  if (!existing.usedInDishes.includes(dish.name)) {
                    existing.usedInDishes.push(dish.name)
                  }
                } else {
                  ingredientMap.set(key, {
                    lttpId: ingredient.lttpId,
                    lttpName: ingredient.lttpName,
                    unit: ingredient.unit,
                    totalQuantity: quantityForMealCount,
                    category: dish.category || 'Khác',
                    usedInDishes: [dish.name]
                  })
                }
              }
            }
          }
        }
      }

      // Convert map to array and sort by category then name
      const ingredients = Array.from(ingredientMap.values()).sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category)
        }
        return a.lttpName.localeCompare(b.lttpName)
      })

      // Add STT numbers
      const ingredientsWithSTT = ingredients.map((ingredient, index) => ({
        stt: index + 1,
        ...ingredient,
        usedInDishes: ingredient.usedInDishes // Keep as array, don't join to string
      }))

      dailyIngredientSummaries.push({
        date: dailyMenuDateStr,
        dayName: getVietnameseDayName(dailyMenuDate),
        mealCount: dailyMenu.mealCount,
        ingredients: ingredientsWithSTT,
        totalIngredientTypes: ingredients.length
      })
    }

    res.status(200).json({
      success: true,
      data: dailyIngredientSummaries
    })
  } catch (error) {
    console.error("Error getting daily ingredient summaries:", error)
    return res.status(500).json({
      success: false,
      message: "Không thể kết nối cơ sở dữ liệu"
    })
  }
}

// Internal helper functions
async function getMenuSuggestionsInternal() {
  const db = await getDb()
  
  if (!db) {
    throw new Error("Không thể kết nối cơ sở dữ liệu")
  }
  
  const dishes = await db.collection("dishes").find({}).toArray()
  const inventory = await db
    .collection("processingStation")
    .aggregate([
      { $match: { type: "food" } },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      {
        $group: {
          _id: "$productId",
          product: { $first: "$productInfo" },
          totalQuantity: { $sum: "$quantity" },
          nonExpiredQuantity: { $sum: "$nonExpiredQuantity" },
          expiredQuantity: { $sum: "$expiredQuantity" },
          earliestExpiry: { $min: "$expiryDate" },
        },
      },
    ])
    .toArray()

  const dailyRations = await db.collection("dailyRations").find({}).toArray()
  const suggestions: MenuSuggestion[] = []

  for (const dish of dishes) {
    if (!dish.ingredients || dish.ingredients.length === 0) continue

    let totalCost = 0
    let priority: "high" | "medium" | "low" = "low"
    const reasons: string[] = []

    const ingredientAnalysis = dish.ingredients.map((ingredient: any) => {
      const inventoryItem = inventory.find(
        (inv) => inv.product._id.toString() === ingredient.lttpId
      )
      
      const availableQuantity = inventoryItem?.nonExpiredQuantity || 0
      const expiredQuantity = inventoryItem?.expiredQuantity || 0
      
      let daysUntilExpiry = 30
      if (inventoryItem?.earliestExpiry) {
        const now = new Date()
        const expiryDate = new Date(inventoryItem.earliestExpiry)
        daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24))
      }

      let status: "sufficient" | "insufficient" | "expiring_soon" | "expired" = "insufficient"
      
      if (expiredQuantity > 0) {
        status = "expired"
        reasons.push(`${ingredient.lttpName} đã hết hạn`)
      } else if (daysUntilExpiry <= 3) {
        status = "expiring_soon"
        reasons.push(`${ingredient.lttpName} sắp hết hạn (${daysUntilExpiry} ngày)`)
        priority = "high"
      } else if (availableQuantity >= ingredient.quantity) {
        status = "sufficient"
      }

      const rationItem = dailyRations.find((r: any) =>
        r.name.toLowerCase().includes(ingredient.lttpName.toLowerCase())
      )
      const unitCost = rationItem?.pricePerUnit || 15000
      totalCost += ingredient.quantity * unitCost

      return {
        lttpId: ingredient.lttpId,
        lttpName: ingredient.lttpName,
        requiredQuantity: ingredient.quantity,
        availableQuantity,
        unit: ingredient.unit,
        daysUntilExpiry,
        status,
      }
    })

    const insufficientIngredients = ingredientAnalysis.filter(
      (ing: IngredientAnalysis) => ing.status === "insufficient" || ing.status === "expired"
    )
    const expiringSoon = ingredientAnalysis.filter(
      (ing: IngredientAnalysis) => ing.status === "expiring_soon"
    )

    if (insufficientIngredients.length === 0) {
      if (expiringSoon.length > 0) {
        priority = "high"
        reasons.push("Sử dụng nguyên liệu sắp hết hạn")
      } else if (priority === "low") {
        priority = "medium"
      }

      const units = await db.collection("units").find({}).toArray()

      suggestions.push({
        dishId: dish._id.toString(),
        dishName: dish.name,
        priority,
        reason: reasons.join(", ") || "Đủ nguyên liệu, phù hợp chế biến",
        ingredients: ingredientAnalysis,
        estimatedCost: totalCost,
        suitableForUnits: units.map((u) => u._id.toString()),
      })
    }
  }

  const priorityOrder = { high: 3, medium: 2, low: 1 }
  suggestions.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])

  return {
    success: true,
    data: suggestions.slice(0, 20),
  }
}

async function getInventoryAlertsInternal() {
  const db = await getDb()

  if (!db) {
    throw new Error("Không thể kết nối cơ sở dữ liệu")
  }

  const inventory = await db
    .collection("processingStation")
    .aggregate([
      { $match: { type: "food" } },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      {
        $group: {
          _id: "$productId",
          product: { $first: "$productInfo" },
          totalQuantity: { $sum: "$quantity" },
          nonExpiredQuantity: { $sum: "$nonExpiredQuantity" },
          expiredQuantity: { $sum: "$expiredQuantity" },
          earliestExpiry: { $min: "$expiryDate" },
        },
      },
    ])
    .toArray()

  const alerts: InventoryAlert[] = []

  for (const item of inventory) {
    let daysUntilExpiry = 30
    if (item.earliestExpiry) {
      const now = new Date()
      const expiryDate = new Date(item.earliestExpiry)
      daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24))
    }

    let alertLevel: "critical" | "warning" | "info" = "info"
    let recommendedAction = ""

    if (item.expiredQuantity > 0) {
      alertLevel = "critical"
      recommendedAction = `Xử lý ${item.expiredQuantity}kg đã hết hạn ngay lập tức`
    } else if (daysUntilExpiry <= 3) {
      alertLevel = "critical"
      recommendedAction = `Ưu tiên sử dụng trong 3 ngày tới (${item.nonExpiredQuantity}kg)`
    } else if (daysUntilExpiry <= 7) {
      alertLevel = "warning"
      recommendedAction = `Lên kế hoạch sử dụng trong tuần (${item.nonExpiredQuantity}kg)`
    } else if (item.nonExpiredQuantity < 10) {
      alertLevel = "warning"
      recommendedAction = "Tồn kho thấp, cân nhắc nhập thêm"
    }

    if (alertLevel !== "info") {
      alerts.push({
        productId: item.product._id.toString(),
        productName: item.product.name,
        currentStock: item.nonExpiredQuantity,
        daysUntilExpiry,
        alertLevel,
        recommendedAction,
      })
    }
  }

  const alertOrder = { critical: 3, warning: 2, info: 1 }
  alerts.sort((a, b) => alertOrder[b.alertLevel] - alertOrder[a.alertLevel])

  return {
    success: true,
    data: alerts,
  }
} 