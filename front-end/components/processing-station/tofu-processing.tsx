"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { suppliesApi, supplyOutputsApi, unitsApi, processingStationApi, menuPlanningApi, unitPersonnelDailyApi, tofuCalculationApi } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth/auth-provider"
import { Unit } from "@/types"

interface DailyTofuProcessing {
  date: string
  soybeanInput: number // CHI - Đậu tương chi - Số lượng (kg) - Station manager input
  tofuInput: number // THU - Đậu phụ thu - Số lượng (kg) - Station manager input  
  tofuOutput: number // Đậu phụ thực tế đã xuất - From supply outputs
  tofuRemaining: number // Đậu phụ tồn - Calculated: tofuInput - tofuOutput
  note?: string
  // Price fields
  soybeanPrice?: number // Giá đậu tương VND/kg
  tofuPrice?: number // Giá đậu phụ VND/kg
  soybeanPriceFromSupply?: boolean // Giá từ quản lý nguồn xuất hay nhập tay
  tofuPriceFromSupply?: boolean // Giá từ quản lý nguồn xuất hay nhập tay
}

interface WeeklyTofuTracking {
  date: string
  dayOfWeek: string
  soybeanInput: number // Đậu tương chi
  tofuInput: number // Đậu phụ thu
  tofuOutput: number // Đậu phụ thực tế đã xuất
  tofuRemaining: number // Đậu phụ tồn
}

interface MonthlyTofuSummary {
  month: string
  year: number
  totalSoybeanInput: number
  totalTofuCollected: number
  totalTofuOutput: number
  totalTofuRemaining: number
  processingEfficiency: number // percentage
}

export function TofuProcessing() {
  // ✨ UPDATED: Now uses new Tofu Calculation API instead of complex ingredient analysis
  // The new API /api/tofu-calculation/requirements provides accurate tofu requirements
  // based on menu data and unit personnel, replacing manual calculation logic
  
  const [dailyTofuProcessing, setDailyTofuProcessing] = useState<DailyTofuProcessing | null>(null)
  const [monthlyTofuSummary, setMonthlyTofuSummary] = useState<MonthlyTofuSummary[]>([])
  const [weeklyTracking, setWeeklyTracking] = useState<WeeklyTofuTracking[]>([])
  const [editingDailyData, setEditingDailyData] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [dailyUpdateData, setDailyUpdateData] = useState({
    soybeanInput: 0,
    tofuInput: 0,
    note: "",
    soybeanPrice: 0,
    tofuPrice: 0
  })
  
  // API test states (previously detection test)
  const [detectionResult, setDetectionResult] = useState<any>(null)
  const [testDate, setTestDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [isTestingDetection, setIsTestingDetection] = useState(false)

  const { toast } = useToast()
  const { user } = useAuth()

  // Get current week dates
  const getCurrentWeekDates = () => {
    const today = new Date()
    const currentDay = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1))
    
    const weekDates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      weekDates.push(date)
    }
    
    return weekDates
  }

  // Get day name in Vietnamese
  const getDayName = (dayIndex: number) => {
    const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"]
    return days[dayIndex]
  }

  // Fetch prices from supply management
  const fetchPricesFromSupply = async (date: string) => {
    try {
      let soybeanPrice = null
      let tofuPrice = null
      let soybeanPriceFromSupply = false
      let tofuPriceFromSupply = false

      // Get supplies data to check for soybean and tofu prices
      const suppliesResponse = await suppliesApi.getSupplies({
        status: 'approved'
      })
      
      const supplies = Array.isArray(suppliesResponse) ? suppliesResponse : (suppliesResponse as any).data || []

      // Look for soybean (đậu tương/đậu nành) in supplies
      const soybeanSupply = supplies.find((supply: any) => 
        supply.product?.name?.toLowerCase().includes("đậu") && 
        (supply.product?.name?.toLowerCase().includes("tương") || 
         supply.product?.name?.toLowerCase().includes("nành")) &&
        supply.unitPrice
      )

      if (soybeanSupply && soybeanSupply.unitPrice) {
        soybeanPrice = soybeanSupply.unitPrice
        soybeanPriceFromSupply = true
      }

      // Look for tofu (đậu phụ) in supplies 
      const tofuSupply = supplies.find((supply: any) => 
        supply.product?.name?.toLowerCase().includes("đậu phụ") &&
        supply.unitPrice
      )

      if (tofuSupply && tofuSupply.unitPrice) {
        tofuPrice = tofuSupply.unitPrice
        tofuPriceFromSupply = true
      }

      return {
        soybeanPrice,
        tofuPrice,
        soybeanPriceFromSupply,
        tofuPriceFromSupply
      }
    } catch (error) {
      console.log("Error fetching prices from supply:", error)
      return {
        soybeanPrice: null,
        tofuPrice: null,
        soybeanPriceFromSupply: false,
        tofuPriceFromSupply: false
      }
    }
  }

  // Improved function to check for tofu ingredients with better pattern matching
  const findTofuInIngredients = (ingredients: any[]) => {
    // Multiple patterns to match tofu-related ingredients
    const tofuPatterns = [
      /đậu\s*phụ/i,           // "đậu phụ", "đậu  phụ"
      /tofu/i,                // "tofu", "TOFU"
      /dau\s*phu/i,           // "dau phu" (no diacritics)
      /đậu\s*hũ/i,            // "đậu hũ" (alternative name)
      /tau\s*hu/i             // "tau hu" (Chinese-Vietnamese)
    ]
    
    return ingredients.filter(ingredient => {
      const name = ingredient.lttpName || ""
      return tofuPatterns.some(pattern => pattern.test(name))
    })
  }

  // Simplified tofu calculation using new API
  const calculateTofuOutputFromAPI = async (dateStr: string) => {
    try {
      console.log("🚀 Using new tofu calculation API for:", dateStr)
      
      const response = await tofuCalculationApi.getTofuRequirements({
        date: dateStr
      })
      
      if (!response.success || !response.data) {
        console.log("❌ No tofu calculation data available")
        return 0
      }
      
      const totalTofuRequired = response.data.totalTofuRequired || 0
      
      console.log("✅ API tofu calculation result:", {
        date: dateStr,
        totalTofuRequired,
        totalPersonnel: response.data.totalPersonnel,
        dishesUsingTofu: response.data.dishesUsingTofu?.length || 0,
        summary: response.data.summary
      })
      
      return totalTofuRequired
      
    } catch (error) {
      console.error("❌ Error calling tofu calculation API:", error)
      return 0
    }
  }

  // Fetch daily tofu processing data
  const fetchDailyTofuProcessing = async (date: Date) => {
    try {
      const dateStr = format(date, "yyyy-MM-dd")
      
      // Get station manager input data from processing station API
      let stationData = {
        soybeanInput: 0,
        tofuInput: 0,
        note: "",
        soybeanPrice: 0,
        tofuPrice: 0
      }
      
      try {
        const stationResponse = await processingStationApi.getDailyData(dateStr)
        if (stationResponse && stationResponse.data) {
          stationData = {
            soybeanInput: stationResponse.data.soybeanInput || 0,
            tofuInput: stationResponse.data.tofuInput || 0,
            note: stationResponse.data.note || "",
            soybeanPrice: stationResponse.data.soybeanPrice || 0,
            tofuPrice: stationResponse.data.tofuPrice || 0
          }
        }
      } catch (error) {
        console.log("No station data found for date, using defaults:", error)
      }

      // Get prices from supply management
      const priceData = await fetchPricesFromSupply(dateStr)

      // Use supply prices if available, otherwise use station manager input
      const finalSoybeanPrice = priceData.soybeanPriceFromSupply ? priceData.soybeanPrice : stationData.soybeanPrice
      const finalTofuPrice = priceData.tofuPriceFromSupply ? priceData.tofuPrice : stationData.tofuPrice

      // Get tofu output requirement using new API (primary method) or fallback to supply outputs
      let plannedTofuOutput = 0
      try {
        console.log("🚀 Using Tofu Calculation API for date:", dateStr)
        
        // Primary method: Use new Tofu Calculation API
        plannedTofuOutput = await calculateTofuOutputFromAPI(dateStr)
        
        // Fallback method: If API returns 0, try to get from supply outputs (legacy)
        if (plannedTofuOutput === 0) {
          console.log("🔍 API returned 0, trying fallback to supply outputs...")
          const outputsResponse = await supplyOutputsApi.getSupplyOutputs({
            startDate: dateStr,
            endDate: dateStr
          })
          const outputs = Array.isArray(outputsResponse) ? outputsResponse : (outputsResponse as any).data || []
          
          // Calculate planned tofu outputs for this date (type: "planned")
          const filteredOutputs = outputs.filter((output: any) => {
            const outputDate = output.outputDate ? format(new Date(output.outputDate), "yyyy-MM-dd") : null
            const dateMatch = outputDate === dateStr
            const isPlanned = output.type === "planned"
            
            // Check both product name and sourceIngredient name
            const productName = (output.product?.name || "").toLowerCase()
            const ingredientName = (output.sourceIngredient?.lttpName || "").toLowerCase()
            const nameMatch = productName.includes("đậu phụ") || productName.includes("tofu") ||
                             ingredientName.includes("đậu phụ") || ingredientName.includes("tofu")
            
            return dateMatch && isPlanned && nameMatch
          })
          
          plannedTofuOutput = filteredOutputs.reduce((sum: number, output: any) => sum + (output.quantity || 0), 0)
          
          console.log("🔄 Fallback result:", {
            filteredCount: filteredOutputs.length,
            fallbackTofuOutput: plannedTofuOutput
          })
        }
        
      } catch (error) {
        console.log("❌ Error getting tofu output data:", error)
      }

      // Calculate remaining tofu
      const tofuRemaining = stationData.tofuInput - plannedTofuOutput

      const processingData: DailyTofuProcessing = {
        date: dateStr,
        soybeanInput: stationData.soybeanInput,
        tofuInput: stationData.tofuInput,
        tofuOutput: plannedTofuOutput, // Kế hoạch xuất (từ quản lý nguồn xuất - đăng ký người ăn)
        tofuRemaining: Math.max(0, tofuRemaining),
        note: stationData.note,
        soybeanPrice: finalSoybeanPrice || 0,
        tofuPrice: finalTofuPrice || 0,
        soybeanPriceFromSupply: priceData.soybeanPriceFromSupply,
        tofuPriceFromSupply: priceData.tofuPriceFromSupply
      }

      setDailyTofuProcessing(processingData)
      
      // Update dailyUpdateData for editing
      setDailyUpdateData({
        soybeanInput: stationData.soybeanInput,
        tofuInput: stationData.tofuInput,
        note: stationData.note,
        soybeanPrice: finalSoybeanPrice || 0,
        tofuPrice: finalTofuPrice || 0
      })

    } catch (error) {
      console.error("Error fetching daily tofu processing data:", error)
      
      // Set default data
      const defaultData: DailyTofuProcessing = {
        date: format(date, "yyyy-MM-dd"),
        soybeanInput: 0,
        tofuInput: 0,
        tofuOutput: 0,
        tofuRemaining: 0,
        note: "",
        soybeanPrice: 0,
        tofuPrice: 0,
        soybeanPriceFromSupply: false,
        tofuPriceFromSupply: false
      }
      setDailyTofuProcessing(defaultData)
      setDailyUpdateData({
        soybeanInput: 0,
        tofuInput: 0,
        note: "",
        soybeanPrice: 0,
        tofuPrice: 0
      })
    }
  }

  // Fetch weekly tracking data
  const fetchWeeklyTracking = async () => {
    try {
      const weekDates = getCurrentWeekDates()
      const weeklyData: WeeklyTofuTracking[] = []

      for (const date of weekDates) {
        const dateStr = format(date, "yyyy-MM-dd")
        
        // Get station data
        let stationData = { soybeanInput: 0, tofuInput: 0 }
        try {
          const stationResponse = await processingStationApi.getDailyData(dateStr)
          if (stationResponse && stationResponse.data) {
            stationData = {
              soybeanInput: stationResponse.data.soybeanInput || 0,
              tofuInput: stationResponse.data.tofuInput || 0
            }
          }
        } catch (error) {
          // Use default values
        }

        // Get tofu output requirement using new API (primary method) for weekly tracking
        let plannedTofuOutput = 0
        try {
          console.log(`🚀 WEEKLY - Using Tofu API for ${dateStr}`)
          
          // Primary method: Use new Tofu Calculation API
          plannedTofuOutput = await calculateTofuOutputFromAPI(dateStr)
          
          // Fallback method: If API returns 0, try supply outputs (legacy)
          if (plannedTofuOutput === 0) {
            console.log(`🔍 WEEKLY - API returned 0 for ${dateStr}, trying fallback...`)
            const outputsResponse = await supplyOutputsApi.getSupplyOutputs({
              startDate: dateStr,
              endDate: dateStr
            })
            const outputs = Array.isArray(outputsResponse) ? outputsResponse : (outputsResponse as any).data || []
            
            plannedTofuOutput = outputs
              .filter((output: any) => {
                const outputDate = output.outputDate ? format(new Date(output.outputDate), "yyyy-MM-dd") : null
                const isPlanned = output.type === "planned"
                const productName = (output.product?.name || "").toLowerCase()
                const ingredientName = (output.sourceIngredient?.lttpName || "").toLowerCase()
                const nameMatch = productName.includes("đậu phụ") || ingredientName.includes("đậu phụ")
                
                return outputDate === dateStr && isPlanned && nameMatch
              })
              .reduce((sum: number, output: any) => sum + (output.quantity || 0), 0)
            
            console.log(`🔄 WEEKLY - Fallback result for ${dateStr}: ${plannedTofuOutput} kg`)
          }
        } catch (error) {
          console.log(`❌ WEEKLY - Error for ${dateStr}:`, error)
        }

        weeklyData.push({
          date: dateStr,
          dayOfWeek: getDayName(date.getDay()),
          soybeanInput: stationData.soybeanInput,
          tofuInput: stationData.tofuInput,
          tofuOutput: plannedTofuOutput, // Kế hoạch xuất (từ quản lý nguồn xuất - đăng ký người ăn)
          tofuRemaining: Math.max(0, stationData.tofuInput - plannedTofuOutput)
        })
      }

      setWeeklyTracking(weeklyData)
    } catch (error) {
      console.error("Error fetching weekly tracking data:", error)
      
      // Generate sample data for current week
      const weekDates = getCurrentWeekDates()
      const sampleWeeklyData: WeeklyTofuTracking[] = weekDates.map((date) => ({
        date: format(date, "yyyy-MM-dd"),
        dayOfWeek: getDayName(date.getDay()),
        soybeanInput: 0,
        tofuInput: 0,
        tofuOutput: 0,
        tofuRemaining: 0
      }))
      setWeeklyTracking(sampleWeeklyData)
    }
  }

  // Fetch monthly tofu summary
  const fetchMonthlyTofuSummary = async () => {
    try {
      const currentDate = new Date()
      const months = []
      
      // Get last 6 months including current month
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
        months.push(date)
      }
      
      const monthlySummaries: MonthlyTofuSummary[] = []
      
      for (const month of months) {
        const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1)
        const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0)
        
        // Get processing station data for the month - simplified for demo
        const totalSoybeanInput = 3000 + Math.floor(Math.random() * 1000)
        const totalTofuCollected = 2400 + Math.floor(Math.random() * 800)
        const totalTofuOutput = 2200 + Math.floor(Math.random() * 600)
        const totalTofuRemaining = totalTofuCollected - totalTofuOutput
        const processingEfficiency = totalSoybeanInput > 0 ? Math.round((totalTofuCollected / totalSoybeanInput) * 100) : 0
        
        monthlySummaries.push({
          month: format(month, 'MM/yyyy', { locale: vi }),
          year: month.getFullYear(),
          totalSoybeanInput,
          totalTofuCollected,
          totalTofuOutput,
          totalTofuRemaining,
          processingEfficiency
        })
      }
      
      setMonthlyTofuSummary(monthlySummaries)
      
    } catch (error) {
      console.error('Error fetching monthly tofu summary:', error)
    }
  }

  // Update daily tofu processing data
  const updateDailyTofuProcessing = async () => {
    if (!dailyTofuProcessing) return

    try {
      setIsUpdating(true)

      // Update station data via API (include price data)
      await processingStationApi.updateDailyData(dailyTofuProcessing.date, {
        soybeanInput: dailyUpdateData.soybeanInput,
        tofuInput: dailyUpdateData.tofuInput,
        note: dailyUpdateData.note,
        soybeanPrice: dailyUpdateData.soybeanPrice,
        tofuPrice: dailyUpdateData.tofuPrice
      })

      // Refresh data
      await fetchDailyTofuProcessing(new Date(dailyTofuProcessing.date))
      await fetchWeeklyTracking()

      toast({
        title: "Thành công",
        description: "Đã cập nhật dữ liệu chế biến đậu phụ",
      })

      setEditingDailyData(false)

    } catch (error) {
      console.error("Error updating daily tofu processing:", error)
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi cập nhật dữ liệu",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Load data when component mounts
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([
        fetchDailyTofuProcessing(new Date()),
        fetchMonthlyTofuSummary(),
        fetchWeeklyTracking()
      ])
      setIsLoading(false)
    }
    
    loadData()
  }, [])

  // EXAMPLE: Comprehensive function demonstrating how to use getDailyIngredientSummaries API
  // This shows the complete flow from API call to tofu detection and calculation
  const exampleTofuDetectionFlow = async (targetDate: string) => {
    console.log("📚 EXAMPLE: Complete tofu detection flow for date:", targetDate)
    
    try {
      // Step 1: Prepare API parameters
      const week = Math.ceil(new Date(targetDate).getDate() / 7)
      const year = new Date(targetDate).getFullYear()
      
      console.log("📚 Step 1: API Parameters:", { week, year, targetDate })
      
      // Step 2: Call the API to get ingredient summaries
      const response = await menuPlanningApi.getDailyIngredientSummaries({
        week: week,
        year: year,
        showAllDays: true // Get all days in the week
      })
      
      console.log("📚 Step 2: API Response:", {
        success: response.success,
        dataLength: response.data?.length || 0,
        message: response.message
      })
      
      if (!response.success || !response.data) {
        console.log("📚 ❌ No data available from API")
        return { found: false, reason: "No API data" }
      }
      
      // Step 3: Find data for specific date
      const dayData = response.data.find((day: any) => day.date === targetDate)
      
      console.log("📚 Step 3: Day Data Search:", {
        targetDate,
        foundDay: !!dayData,
        dayData: dayData ? {
          date: dayData.date,
          dayName: dayData.dayName,
          mealCount: dayData.mealCount,
          totalIngredients: dayData.ingredients.length
        } : null
      })
      
      if (!dayData) {
        console.log("📚 ❌ No menu data for specific date")
        return { found: false, reason: "No menu for date" }
      }
      
      // Step 4: Search for tofu ingredients
      console.log("📚 Step 4: Searching for tofu ingredients...")
      console.log("📚 All ingredients for the day:", 
        dayData.ingredients.map((ing: any) => ({
          name: ing.lttpName,
          quantity: ing.totalQuantity,
          unit: ing.unit,
          category: ing.category
        }))
      )
      
      // Method 1: Simple search (original method)
      const simpleTofuSearch = dayData.ingredients.find((ing: any) => 
        ing.lttpName?.toLowerCase().includes("đậu phụ") ||
        ing.lttpName?.toLowerCase().includes("tofu")
      )
      
      // Method 2: Advanced pattern matching (improved method)
      const advancedTofuSearch = findTofuInIngredients(dayData.ingredients)
      
      console.log("📚 Step 4 Results:", {
        simpleTofuFound: !!simpleTofuSearch,
        simpleTofuName: simpleTofuSearch?.lttpName,
        advancedTofuCount: advancedTofuSearch.length,
        advancedTofuNames: advancedTofuSearch.map(t => t.lttpName)
      })
      
      if (advancedTofuSearch.length === 0) {
        console.log("📚 ❌ No tofu ingredients found in menu")
        return { found: false, reason: "No tofu in menu" }
      }
      
      // Step 5: Calculate tofu requirements
      console.log("📚 Step 5: Calculating tofu requirements...")
      
      // Get personnel data for the date
      const personnelResponse = await unitPersonnelDailyApi.getPersonnelByWeek(targetDate, targetDate)
      const totalPersonnel = personnelResponse.success ? 
        Object.values(personnelResponse.data[targetDate] || {}).reduce((sum: number, count: any) => sum + count, 0) : 100
      
      // Calculate total tofu quantity needed
      const totalTofuQuantity = advancedTofuSearch.reduce((sum, ingredient) => 
        sum + (ingredient.totalQuantity || 0), 0
      )
      
      // Final calculation: (personnel * quantity per 100 people) / 100
      const finalTofuOutput = (totalPersonnel * totalTofuQuantity) / 100
      
      console.log("📚 Step 5: Final Calculation:", {
        totalPersonnel,
        totalTofuQuantityPer100: totalTofuQuantity,
        finalTofuOutputKg: finalTofuOutput,
        formula: `(${totalPersonnel} người × ${totalTofuQuantity} kg/100 người) ÷ 100 = ${finalTofuOutput} kg`
      })
      
      // Step 6: Detailed breakdown by ingredient
      console.log("📚 Step 6: Detailed Ingredient Breakdown:")
      advancedTofuSearch.forEach((ingredient, index) => {
        const ingredientOutput = (totalPersonnel * ingredient.totalQuantity) / 100
        console.log(`📚 Ingredient ${index + 1}:`, {
          name: ingredient.lttpName,
          quantityPer100: ingredient.totalQuantity,
          unit: ingredient.unit,
          category: ingredient.category,
          usedInDishes: ingredient.usedInDishes,
          calculatedOutputForThisIngredient: ingredientOutput
        })
      })
      
      return {
        found: true,
        ingredients: advancedTofuSearch,
        totalPersonnel,
        totalTofuQuantity,
        finalOutput: finalTofuOutput,
        breakdown: advancedTofuSearch.map(ing => ({
          name: ing.lttpName,
          output: (totalPersonnel * ing.totalQuantity) / 100,
          dishes: ing.usedInDishes
        }))
      }
      
    } catch (error) {
      console.error("📚 ❌ Example flow error:", error)
      return { found: false, reason: "Error occurred", error }
    }
  }

  // Usage example function (can be called for testing)
  const runTofuDetectionExample = async () => {
    const today = format(new Date(), "yyyy-MM-dd")
    console.log("🚀 Running tofu detection example for today:", today)
    const result = await exampleTofuDetectionFlow(today)
    console.log("🎯 Example Result:", result)
    return result
  }

  // Test detection with custom date using new API
  const testTofuDetection = async (targetDate?: string) => {
    setIsTestingDetection(true)
    try {
      const dateToTest = targetDate || testDate
      console.log("🧪 Testing tofu detection using API for date:", dateToTest)
      
      // Use new API for testing
      const apiResponse = await tofuCalculationApi.getTofuRequirements({
        date: dateToTest
      })
      
      let result: any
      if (apiResponse.success && apiResponse.data) {
        result = {
          found: true,
          totalTofuRequired: apiResponse.data.totalTofuRequired,
          totalPersonnel: apiResponse.data.totalPersonnel,
          dishesUsingTofu: apiResponse.data.dishesUsingTofu,
          units: apiResponse.data.units,
          summary: apiResponse.data.summary
        }
      } else {
        result = {
          found: false,
          reason: "Không có dữ liệu từ API"
        }
      }
      
      setDetectionResult(result)
      
      toast({
        title: "🧪 Test API Completed",
        description: result.found ? 
          `Tìm thấy ${result.dishesUsingTofu?.length || 0} món có đậu phụ. Cần xuất: ${result.totalTofuRequired?.toFixed(2) || 0} kg` :
          `Không tìm thấy đậu phụ: ${result.reason}`,
        variant: result.found ? "default" : "destructive"
      })
      
      // If found tofu for today, refresh the daily data
      if (result.found && dateToTest === format(new Date(), "yyyy-MM-dd")) {
        console.log("🔄 Refreshing daily data with new API results...")
        await fetchDailyTofuProcessing(new Date())
        await fetchWeeklyTracking()
      }
      
      return result
    } catch (error) {
      console.error("❌ API test error:", error)
      toast({
        title: "❌ Test Error",
        description: "Lỗi khi test API",
        variant: "destructive"
      })
    } finally {
      setIsTestingDetection(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-6 w-6 text-green-600" />
        <h2 className="text-2xl font-bold text-green-800">Làm đậu phụ</h2>
        <Badge className="bg-green-100 text-green-800">
          Chỉ do Trạm trưởng chỉnh sửa
        </Badge>
      </div>

      {/* Daily Tofu Processing */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-center text-xl font-bold">
            CHẾ BIẾN ĐẬU PHỤ
          </CardTitle>
          <p className="text-sm text-gray-600 text-center">
            Bảng theo dõi ngày hiện tại - {format(new Date(), "dd/MM/yyyy", { locale: vi })}
          </p>
        </CardHeader>
        <CardContent>
          {isLoading || !dailyTofuProcessing ? (
            <div className="text-center py-8">Đang tải dữ liệu...</div>
          ) : (
            <div className="space-y-4">
              {/* Lãi trong ngày */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-700 mb-2">
                    🏆 LÃI TRONG NGÀY:
                    {editingDailyData && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full ml-2">
                        Live
                      </span>
                    )}
                  </div>
                  <div className="text-3xl font-bold text-blue-900">
                    {(() => {
                      // Use real-time data from editing state if in edit mode, otherwise use saved data
                      const currentTofuPrice = editingDailyData ? 
                        (dailyTofuProcessing.tofuPriceFromSupply ? dailyTofuProcessing.tofuPrice : dailyUpdateData.tofuPrice) || 0 :
                        dailyTofuProcessing.tofuPrice || 0
                      
                      const currentSoybeanPrice = editingDailyData ? 
                        (dailyTofuProcessing.soybeanPriceFromSupply ? dailyTofuProcessing.soybeanPrice : dailyUpdateData.soybeanPrice) || 0 :
                        dailyTofuProcessing.soybeanPrice || 0
                      
                      const currentTofuInput = editingDailyData ? dailyUpdateData.tofuInput : dailyTofuProcessing.tofuInput
                      const currentSoybeanInput = editingDailyData ? dailyUpdateData.soybeanInput : dailyTofuProcessing.soybeanInput
                      
                      if (currentTofuPrice === 0 || currentSoybeanPrice === 0) {
                        return (
                          <span className="text-gray-500 text-xl">
                            Chưa có giá
                          </span>
                        )
                      }
                      
                      const tofuRevenue = currentTofuInput * currentTofuPrice
                      const soybeanCost = currentSoybeanInput * currentSoybeanPrice
                      const dailyProfit = tofuRevenue - soybeanCost
                      
                      return (
                        <span className={dailyProfit >= 0 ? "text-green-600" : "text-red-600"}>
                          {dailyProfit >= 0 ? "+" : ""}{dailyProfit.toLocaleString('vi-VN')}
                        </span>
                      )
                    })()}
                    <span className="text-lg ml-1">đ</span>
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {(() => {
                      // Calculate breakdown using current values (real-time)
                      const currentTofuPrice = editingDailyData ? 
                        (dailyTofuProcessing.tofuPriceFromSupply ? dailyTofuProcessing.tofuPrice : dailyUpdateData.tofuPrice) || 0 :
                        dailyTofuProcessing.tofuPrice || 0
                      
                      const currentSoybeanPrice = editingDailyData ? 
                        (dailyTofuProcessing.soybeanPriceFromSupply ? dailyTofuProcessing.soybeanPrice : dailyUpdateData.soybeanPrice) || 0 :
                        dailyTofuProcessing.soybeanPrice || 0
                      
                      const currentTofuInput = editingDailyData ? dailyUpdateData.tofuInput : dailyTofuProcessing.tofuInput
                      const currentSoybeanInput = editingDailyData ? dailyUpdateData.soybeanInput : dailyTofuProcessing.soybeanInput
                      
                      if (currentTofuPrice && currentSoybeanPrice) {
                        const revenue = currentTofuInput * currentTofuPrice
                        const cost = currentSoybeanInput * currentSoybeanPrice
                        return (
                          <>Thu: {revenue.toLocaleString('vi-VN')}đ - Chi: {cost.toLocaleString('vi-VN')}đ{editingDailyData && " (Real-time)"}</>
                        )
                      }
                      return "Cần nhập đầy đủ giá đậu phụ và đậu tương"
                    })()}
                  </div>
                </div>
              </div>

              {/* Four box layout */}
              <div className="grid grid-cols-2 gap-6">
                {/* Đậu tương chi */}
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-green-700 mb-2">Đậu tương chi:</div>
                    <div className="text-2xl font-bold text-green-800">
                      {editingDailyData ? (
                        <Input
                          type="number"
                          value={dailyUpdateData.soybeanInput}
                          onChange={(e) => setDailyUpdateData(prev => ({ 
                            ...prev, 
                            soybeanInput: Number(e.target.value) || 0
                          }))}
                          className="w-24 h-12 text-center text-2xl font-bold bg-white border-green-300"
                          placeholder="0"
                        />
                      ) : (
                        <span>{dailyTofuProcessing.soybeanInput}</span>
                      )}
                      <span className="text-lg ml-1">kg</span>
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      (Trạm trưởng nhập tay)
                    </div>
                  </div>
                </div>

                {/* Đậu phụ thu */}
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-yellow-700 mb-2">Đậu phụ thu:</div>
                    <div className="text-2xl font-bold text-yellow-800">
                      {editingDailyData ? (
                        <Input
                          type="number"
                          value={dailyUpdateData.tofuInput}
                          onChange={(e) => setDailyUpdateData(prev => ({ 
                            ...prev, 
                            tofuInput: Number(e.target.value) || 0
                          }))}
                          className="w-24 h-12 text-center text-2xl font-bold bg-white border-yellow-300"
                          placeholder="0"
                        />
                      ) : (
                        <span>{dailyTofuProcessing.tofuInput}</span>
                      )}
                      <span className="text-lg ml-1">kg</span>
                    </div>
                    <div className="text-xs text-yellow-600 mt-1">
                      (Trạm trưởng nhập tay)
                    </div>
                  </div>
                </div>

                {/* Đậu phụ xuất */}
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-red-700 mb-2">Đậu phụ xuất:</div>
                    <div className="text-2xl font-bold text-red-800">
                      <span>{dailyTofuProcessing.tofuOutput}</span>
                      <span className="text-lg ml-1">kg</span>
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      (Kế hoạch xuất từ đăng ký người ăn)
                    </div>
                  </div>
                </div>

                {/* Đậu phụ tồn */}
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-purple-700 mb-2">Đậu phụ tồn:</div>
                    <div className="text-2xl font-bold text-purple-800">
                      <span>{dailyTofuProcessing.tofuRemaining}</span>
                      <span className="text-lg ml-1">kg</span>
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      (Thu - Xuất = {dailyTofuProcessing.tofuInput} - {dailyTofuProcessing.tofuOutput})
                    </div>
                  </div>
                </div>
              </div>

              {/* Price section - 2 boxes for soybean and tofu prices */}
              <div className="grid grid-cols-2 gap-6 mt-6">
                {/* Giá đậu tương */}
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-orange-700 mb-2">Giá đậu tương:</div>
                    <div className="text-xl font-bold text-orange-800">
                      {editingDailyData && !dailyTofuProcessing.soybeanPriceFromSupply ? (
                        <Input
                          type="number"
                          value={dailyUpdateData.soybeanPrice}
                          onChange={(e) => setDailyUpdateData(prev => ({ 
                            ...prev, 
                            soybeanPrice: Number(e.target.value) || 0
                          }))}
                          className="w-32 h-10 text-center text-xl font-bold bg-white border-orange-300"
                          placeholder="0"
                        />
                      ) : (
                        <span>{(dailyTofuProcessing.soybeanPrice || 0).toLocaleString('vi-VN')}</span>
                      )}
                      <span className="text-sm ml-1">đ/kg</span>
                    </div>
                    <div className="text-xs text-orange-600 mt-1">
                      {dailyTofuProcessing.soybeanPriceFromSupply ? (
                        "(Từ quản lý nguồn xuất)"
                      ) : (
                        "(Trạm trưởng nhập tay)"
                      )}
                    </div>
                    {dailyTofuProcessing.soybeanPriceFromSupply && (
                      <div className="text-xs text-orange-500 mt-1">
                        🔒 Không thể chỉnh sửa
                      </div>
                    )}
                  </div>
                </div>

                {/* Giá đậu phụ */}
                <div className="bg-cyan-50 border-2 border-cyan-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-cyan-700 mb-2">Giá đậu phụ:</div>
                    <div className="text-xl font-bold text-cyan-800">
                      {editingDailyData && !dailyTofuProcessing.tofuPriceFromSupply ? (
                        <Input
                          type="number"
                          value={dailyUpdateData.tofuPrice}
                          onChange={(e) => setDailyUpdateData(prev => ({ 
                            ...prev, 
                            tofuPrice: Number(e.target.value) || 0
                          }))}
                          className="w-32 h-10 text-center text-xl font-bold bg-white border-cyan-300"
                          placeholder="0"
                        />
                      ) : (
                        <span>{(dailyTofuProcessing.tofuPrice || 0).toLocaleString('vi-VN')}</span>
                      )}
                      <span className="text-sm ml-1">đ/kg</span>
                    </div>
                    <div className="text-xs text-cyan-600 mt-1">
                      {dailyTofuProcessing.tofuPriceFromSupply ? (
                        "(Từ quản lý nguồn xuất)"
                      ) : (
                        "(Trạm trưởng nhập tay)"
                      )}
                    </div>
                    {dailyTofuProcessing.tofuPriceFromSupply && (
                      <div className="text-xs text-cyan-500 mt-1">
                        🔒 Không thể chỉnh sửa
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes section */}
              {editingDailyData && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Ghi chú:</label>
                  <textarea
                    value={dailyUpdateData.note}
                    onChange={(e) => setDailyUpdateData(prev => ({ ...prev, note: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    rows={2}
                    placeholder="Ghi chú về quá trình chế biến trong ngày"
                  />
                </div>
              )}

              {dailyTofuProcessing.note && !editingDailyData && (
                <div className="bg-gray-50 p-3 rounded border">
                  <div className="text-sm font-medium text-gray-700">Ghi chú:</div>
                  <div className="text-sm text-gray-600 mt-1">{dailyTofuProcessing.note}</div>
                </div>
              )}

              {/* Edit Controls for Station Manager */}
              {(user?.role === 'stationManager' || user?.role === 'admin') && (
                <div className="flex items-center justify-end gap-2 pt-4 border-t">
                  {editingDailyData ? (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setEditingDailyData(false)
                          setDailyUpdateData({
                            soybeanInput: dailyTofuProcessing.soybeanInput,
                            tofuInput: dailyTofuProcessing.tofuInput,
                            note: dailyTofuProcessing.note || "",
                            soybeanPrice: dailyTofuProcessing.soybeanPrice || 0,
                            tofuPrice: dailyTofuProcessing.tofuPrice || 0
                          })
                        }}
                      >
                        Hủy
                      </Button>
                      <Button onClick={updateDailyTofuProcessing} disabled={isUpdating}>
                        {isUpdating ? "Đang lưu..." : "Lưu thay đổi"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="outline"
                        onClick={() => setEditingDailyData(true)}
                      >
                        Chỉnh sửa
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => testTofuDetection()}
                        disabled={isTestingDetection}
                        className="bg-purple-100 text-purple-700 hover:bg-purple-200"
                      >
                        {isTestingDetection ? "🔄 Đang test..." : "🚀 Test Tofu API"}
                      </Button>
                    </>
                  )}
                </div>
              )}
              
              {/* Info message for other roles */}
              {user?.role && !['stationManager', 'admin'].includes(user.role) && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500 text-center">
                    Chỉ Trạm trưởng mới có thể chỉnh sửa dữ liệu chế biến đậu phụ
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Tracking Table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-center text-xl font-bold">
            BẢNG THEO DÕI CHẾ BIẾN ĐẬU PHỤ THEO TUẦN
          </CardTitle>
          <p className="text-sm text-gray-600 text-center">
            Ngày hôm nay: {format(new Date(), "EEEE, dd/MM/yyyy", { locale: vi })}
          </p>
        </CardHeader>
        <CardContent>
          {isLoading || weeklyTracking.length === 0 ? (
            <div className="text-center py-8">Đang tải dữ liệu tuần...</div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-2 border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-3 text-center font-bold">Ngày</th>
                      <th className="border border-gray-300 p-3 text-center font-bold">Thứ</th>
                      <th className="border border-gray-300 p-3 text-center font-bold bg-green-50">
                        Đậu tương chi<br/><span className="text-xs font-normal">(kg)</span>
                      </th>
                      <th className="border border-gray-300 p-3 text-center font-bold bg-yellow-50">
                        Đậu phụ thu<br/><span className="text-xs font-normal">(kg)</span>
                      </th>
                      <th className="border border-gray-300 p-3 text-center font-bold bg-red-50">
                        Đậu phụ đã xuất<br/><span className="text-xs font-normal">(kg)</span>
                      </th>
                      <th className="border border-gray-300 p-3 text-center font-bold bg-purple-50">
                        Đậu phụ tồn<br/><span className="text-xs font-normal">(kg)</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyTracking.map((day, index) => {
                      const isToday = format(new Date(), "yyyy-MM-dd") === day.date
                      return (
                        <tr key={index} className={isToday ? "bg-blue-50 font-semibold" : ""}>
                          <td className="border border-gray-300 p-2 text-center">
                            {format(new Date(day.date), "dd/MM", { locale: vi })}
                            {isToday && <div className="text-xs text-blue-600">(Hôm nay)</div>}
                          </td>
                          <td className="border border-gray-300 p-2 text-center">
                            {day.dayOfWeek}
                          </td>
                          <td className="border border-gray-300 p-2 text-center bg-green-25">
                            <span className="font-semibold text-green-700">
                              {day.soybeanInput.toLocaleString()}
                            </span>
                          </td>
                          <td className="border border-gray-300 p-2 text-center bg-yellow-25">
                            <span className="font-semibold text-yellow-700">
                              {day.tofuInput.toLocaleString()}
                            </span>
                          </td>
                          <td className="border border-gray-300 p-2 text-center bg-red-25">
                            <span className="font-semibold text-red-700">
                              {day.tofuOutput.toLocaleString()}
                            </span>
                          </td>
                          <td className="border border-gray-300 p-2 text-center bg-purple-25">
                            <span className="font-semibold text-purple-700">
                              {day.tofuRemaining.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                    
                    {/* Weekly Total Row */}
                    <tr className="bg-gray-200 font-bold border-t-2 border-gray-400">
                      <td colSpan={2} className="border border-gray-300 p-2 text-center">
                        TỔNG TUẦN
                      </td>
                      <td className="border border-gray-300 p-2 text-center bg-green-100">
                        <span className="text-green-800">
                          {weeklyTracking.reduce((sum, day) => sum + day.soybeanInput, 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-2 text-center bg-yellow-100">
                        <span className="text-yellow-800">
                          {weeklyTracking.reduce((sum, day) => sum + day.tofuInput, 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-2 text-center bg-red-100">
                        <span className="text-red-800">
                          {weeklyTracking.reduce((sum, day) => sum + day.tofuOutput, 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-2 text-center bg-purple-100">
                        <span className="text-purple-800">
                          {weeklyTracking.reduce((sum, day) => sum + day.tofuRemaining, 0).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Summary Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="text-xs text-green-600">Tổng đậu tương chi</div>
                  <div className="text-lg font-bold text-green-700">
                    {weeklyTracking.reduce((sum, day) => sum + day.soybeanInput, 0).toLocaleString()} kg
                  </div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <div className="text-xs text-yellow-600">Tổng đậu phụ thu</div>
                  <div className="text-lg font-bold text-yellow-700">
                    {weeklyTracking.reduce((sum, day) => sum + day.tofuInput, 0).toLocaleString()} kg
                  </div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <div className="text-xs text-red-600">Tổng đậu phụ đã xuất</div>
                  <div className="text-lg font-bold text-red-700">
                    {weeklyTracking.reduce((sum, day) => sum + day.tofuOutput, 0).toLocaleString()} kg
                  </div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <div className="text-xs text-purple-600">Tổng đậu phụ tồn</div>
                  <div className="text-lg font-bold text-purple-700">
                    {weeklyTracking.reduce((sum, day) => sum + day.tofuRemaining, 0).toLocaleString()} kg
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-xl font-bold">
            LÀM ĐẬU PHỤ - TỔNG HỢP THEO THÁNG
          </CardTitle>
          <p className="text-sm text-gray-600 text-center">
            Bảng thu chi lãi theo từng tháng trong năm {new Date().getFullYear()}
          </p>
        </CardHeader>
        <CardContent>
          {monthlyTofuSummary.length === 0 ? (
            <div className="text-center py-8">Đang tải dữ liệu tháng...</div>
          ) : (
            <div className="space-y-4">
              {/* Monthly Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-2 border-black">
                  <thead>
                    <tr>
                      <th rowSpan={3} className="border border-black p-2 bg-gray-100 font-bold">THÁNG</th>
                      <th colSpan={3} className="border border-black p-2 bg-green-100 font-bold">THU</th>
                      <th colSpan={3} className="border border-black p-2 bg-red-100 font-bold">CHI</th>
                      <th rowSpan={3} className="border border-black p-2 bg-blue-100 font-bold">THU-<br/>CHI<br/>(LÃI)</th>
                    </tr>
                    <tr>
                      <th colSpan={2} className="border border-black p-1 bg-green-50 text-sm">Đậu phụ</th>
                      <th rowSpan={2} className="border border-black p-1 bg-green-50 text-sm">Sản<br/>phẩm<br/>phụ<br/>(1.000đ)</th>
                      <th colSpan={2} className="border border-black p-1 bg-red-50 text-sm">Đậu tương</th>
                      <th rowSpan={2} className="border border-black p-1 bg-red-50 text-sm">Chi khác<br/>(1.000đ)</th>
                    </tr>
                    <tr>
                      <th className="border border-black p-1 text-xs">Số lượng<br/>(kg)</th>
                      <th className="border border-black p-1 text-xs">Thành<br/>Tiền<br/>(1.000đ)</th>
                      <th className="border border-black p-1 text-xs">Số lượng<br/>(kg)</th>
                      <th className="border border-black p-1 text-xs">Thành<br/>Tiền<br/>(1.000đ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyTofuSummary.map((month, index) => (
                      <tr key={index} className={index === monthlyTofuSummary.length - 1 ? "bg-blue-50" : ""}>
                        <td className="border border-black p-2 font-medium text-center">
                          {month.month}
                          {index === monthlyTofuSummary.length - 1 && (
                            <div className="text-xs text-blue-600 mt-1">(Hiện tại)</div>
                          )}
                        </td>
                        {/* THU - Đậu phụ */}
                        <td className="border border-black p-1 text-center font-semibold text-green-600">
                          {month.totalTofuCollected.toLocaleString()}
                        </td>
                        <td className="border border-black p-1 text-center font-semibold text-green-600">
                          {(month.totalTofuCollected * 15).toLocaleString()}
                        </td>
                        {/* THU - Sản phẩm phụ */}
                        <td className="border border-black p-1 text-center font-semibold text-green-600">
                          {Math.round(month.totalTofuCollected * 0.1 * 5).toLocaleString()}
                        </td>
                        {/* CHI - Đậu tương */}
                        <td className="border border-black p-1 text-center font-semibold text-red-600">
                          {month.totalSoybeanInput.toLocaleString()}
                        </td>
                        <td className="border border-black p-1 text-center font-semibold text-red-600">
                          {(month.totalSoybeanInput * 12).toLocaleString()}
                        </td>
                        {/* CHI - Chi khác */}
                        <td className="border border-black p-1 text-center font-semibold text-red-600">
                          {Math.round(month.totalSoybeanInput * 0.02 * 1000).toLocaleString()}
                        </td>
                        {/* THU-CHI (LÃI) */}
                        <td className="border border-black p-1 text-center bg-blue-50">
                          <span className={`font-bold ${
                            ((month.totalTofuCollected * 15) + Math.round(month.totalTofuCollected * 0.1 * 5) - 
                             (month.totalSoybeanInput * 12) - Math.round(month.totalSoybeanInput * 0.02 * 1000)) >= 0 
                            ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {(
                              (month.totalTofuCollected * 15) + Math.round(month.totalTofuCollected * 0.1 * 5) - 
                              (month.totalSoybeanInput * 12) - Math.round(month.totalSoybeanInput * 0.02 * 1000)
                            ).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detection Test Results */}
      {detectionResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-center text-xl font-bold">
              🚀 KẾT QUẢ TEST API TÍNH TOÁN ĐẬU PHỤ
            </CardTitle>
            <p className="text-sm text-gray-600 text-center">
              Ngày test: {testDate} • {detectionResult.found ? "✅ Có đậu phụ" : "❌ Không có đậu phụ"}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Test Date Selector */}
              <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg border">
                <label className="text-sm font-medium text-purple-700">Ngày test:</label>
                <Input
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  className="w-40"
                />
                <Button
                  onClick={() => testTofuDetection(testDate)}
                  disabled={isTestingDetection}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isTestingDetection ? "🔄 Đang test..." : "🧪 Test ngày này"}
                </Button>
              </div>

              {detectionResult.found ? (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="text-sm text-green-600 mb-1">Số món có đậu phụ</div>
                      <div className="text-2xl font-bold text-green-700">
                        {detectionResult.dishesUsingTofu?.length || 0}
                      </div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="text-sm text-blue-600 mb-1">Tổng số người ăn</div>
                      <div className="text-2xl font-bold text-blue-700">
                        {detectionResult.totalPersonnel || 0}
                      </div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <div className="text-sm text-orange-600 mb-1">Cần xuất (kg)</div>
                      <div className="text-2xl font-bold text-orange-700">
                        {detectionResult.totalTofuRequired?.toFixed(2) || 0}
                      </div>
                    </div>
                  </div>

                  {/* Dishes Using Tofu */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-3">Món ăn sử dụng đậu phụ:</h4>
                    <div className="space-y-2">
                      {detectionResult.dishesUsingTofu?.map((dish: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div>
                            <span className="font-medium">{dish.dishName}</span>
                            <div className="text-xs text-gray-600">
                              Bữa: {dish.mealType === 'morning' ? 'Sáng' : dish.mealType === 'noon' ? 'Trưa' : 'Tối'} | 
                              Nguyên liệu: {dish.tofuIngredients?.map((ing: any) => ing.lttpName).join(", ")}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Units Breakdown */}
                  {detectionResult.units && detectionResult.units.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-3">Chi tiết theo đơn vị:</h4>
                      <div className="space-y-2">
                        {detectionResult.units.map((unit: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                            <div>
                              <span className="font-medium">{unit.unitName}</span>
                              <div className="text-xs text-gray-600">
                                {unit.personnel} người
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{unit.totalTofuRequired?.toFixed(2)} kg</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary Statistics */}
                  {detectionResult.summary && (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <h4 className="font-medium text-yellow-800 mb-2">📊 Thống kê tổng hợp:</h4>
                      <div className="text-sm text-yellow-700 space-y-1">
                        <div>Tổng món ăn có đậu phụ: <strong>{detectionResult.summary.totalDishesUsingTofu}</strong></div>
                        <div>Trung bình đậu phụ/người: <strong>{detectionResult.summary.averageTofuPerPerson?.toFixed(3)} kg</strong></div>
                        <div>Ước tính đậu tương cần: <strong>{detectionResult.summary.recommendedSoybeanInput?.toFixed(2)} kg</strong></div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">😔</div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Không tìm thấy đậu phụ</h3>
                  <p className="text-gray-600">
                    Lý do: <span className="font-medium">{detectionResult.reason}</span>
                  </p>
                  <div className="mt-4 text-sm text-gray-500">
                    Có thể thực đơn ngày này không có món nào sử dụng đậu phụ, hoặc chưa có thực đơn được lập.
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 