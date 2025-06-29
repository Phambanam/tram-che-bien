"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sprout, Calendar, TrendingUp } from "lucide-react"
import { format, getWeek } from "date-fns"
import { vi } from "date-fns/locale"
import { suppliesApi, supplyOutputsApi, unitsApi, processingStationApi, menuPlanningApi, unitPersonnelDailyApi, beanSproutsCalculationApi } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth/auth-provider"
import { Unit } from "@/types"

interface DailyBeanSproutsProcessing {
  date: string
  soybeansInput: number // CHI - Đậu tương chi - Số lượng (kg) - Station manager input
  beanSproutsInput: number // THU - Giá đỗ thu - Số lượng (kg) - Station manager input  
  beanSproutsOutput: number // Giá đỗ thực tế đã xuất - From supply outputs
  beanSproutsRemaining: number // Giá đỗ tồn - Calculated: beanSproutsInput - beanSproutsOutput
  note?: string
  // Price fields
  soybeansPrice?: number // Giá đậu tương VND/kg
  beanSproutsPrice?: number // Giá giá đỗ VND/kg
  soybeansPriceFromSupply?: boolean // Giá từ quản lý nguồn xuất hay nhập tay
  beanSproutsPriceFromSupply?: boolean // Giá từ quản lý nguồn xuất hay nhập tay
  // By-products fields
  byProductQuantity?: number // Sản phẩm phụ (kg) - Station manager input
  byProductPrice?: number // Giá sản phẩm phụ VND/kg
  otherCosts?: number // Chi phí khác (VND) - Station manager input
}

interface WeeklyBeanSproutsTracking {
  date: string
  dayOfWeek: string
  soybeansInput: number // Đậu tương chi
  beanSproutsInput: number // Giá đỗ thu
  beanSproutsOutput: number // Giá đỗ thực tế đã xuất
  beanSproutsRemaining: number // Giá đỗ tồn
  // Financial calculation fields
  byProductQuantity: number // Sản phẩm phụ (kg)
  byProductPrice: number // Giá sản phẩm phụ VND/kg
  soybeansPrice: number // Giá đậu tương VND/kg
  beanSproutsPrice: number // Giá giá đỗ VND/kg
  otherCosts: number // Chi phí khác (VND)
}

interface MonthlyBeanSproutsSummary {
  month: string
  year: number
  totalSoybeansInput: number
  totalBeanSproutsCollected: number
  totalBeanSproutsOutput: number
  totalBeanSproutsRemaining: number
  processingEfficiency: number // percentage
}

export function BeanSproutsProcessing() {
  // ✨ UPDATED: Now uses new Bean Sprouts Calculation API instead of complex ingredient analysis
  // The new API /api/bean-sprouts-calculation/requirements provides accurate bean sprouts requirements
  // based on menu data and unit personnel, replacing manual calculation logic
  
  const [dailyBeanSproutsProcessing, setDailyBeanSproutsProcessing] = useState<DailyBeanSproutsProcessing | null>(null)
  const [monthlyBeanSproutsSummary, setMonthlyBeanSproutsSummary] = useState<MonthlyBeanSproutsSummary[]>([])
  const [weeklyTracking, setWeeklyTracking] = useState<WeeklyBeanSproutsTracking[]>([])
  const [editingDailyData, setEditingDailyData] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [dailyUpdateData, setDailyUpdateData] = useState<{
    soybeansInput: number
    beanSproutsInput: number
    note: string
    soybeansPrice: number
    beanSproutsPrice: number
  }>({
    soybeansInput: 0,
    beanSproutsInput: 0,
    note: "",
    soybeansPrice: 0,
    beanSproutsPrice: 0
  })
  
  // API test states (previously detection test)
  const [detectionResult, setDetectionResult] = useState<any>(null)
  const [testDate, setTestDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [isTestingDetection, setIsTestingDetection] = useState(false)

  // Helper function to get current week of year using date-fns
  const getCurrentWeekOfYear = (date: Date = new Date()) => {
    return getWeek(date, { weekStartsOn: 1 }) // ISO week (starts on Monday)
  }

  // Filter states
  const [selectedWeek, setSelectedWeek] = useState(() => getCurrentWeekOfYear())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedMonthYear, setSelectedMonthYear] = useState(new Date().getFullYear())

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
      let soybeansPrice = null
      let beanSproutsPrice = null
      let soybeansPriceFromSupply = false
      let beanSproutsPriceFromSupply = false

      // Get supplies data to check for soybeans and bean sprouts prices
      const suppliesResponse = await suppliesApi.getSupplies({
        status: 'approved'
      })
      
      const supplies = Array.isArray(suppliesResponse) ? suppliesResponse : (suppliesResponse as any).data || []

      // Look for soybeans (đậu tương) in supplies
      const soybeansSupply = supplies.find((supply: any) => 
        supply.product?.name?.toLowerCase().includes("đậu") && 
        (supply.product?.name?.toLowerCase().includes("tương") || 
         supply.product?.name?.toLowerCase().includes("đậu tương")) &&
        supply.unitPrice
      )

      if (soybeansSupply && soybeansSupply.unitPrice) {
        soybeansPrice = soybeansSupply.unitPrice
        soybeansPriceFromSupply = true
      }

      // Look for bean sprouts (giá đỗ) in supplies 
      const beanSproutsSupply = supplies.find((supply: any) => 
        supply.product?.name?.toLowerCase().includes("giá đỗ") &&
        supply.unitPrice
      )

      if (beanSproutsSupply && beanSproutsSupply.unitPrice) {
        beanSproutsPrice = beanSproutsSupply.unitPrice
        beanSproutsPriceFromSupply = true
      }

      return {
        soybeansPrice,
        beanSproutsPrice,
        soybeansPriceFromSupply,
        beanSproutsPriceFromSupply
      }
    } catch (error) {
      console.log("Error fetching prices from supply:", error)
      return {
        soybeansPrice: null,
        beanSproutsPrice: null,
        soybeansPriceFromSupply: false,
        beanSproutsPriceFromSupply: false
      }
    }
  }

  // Improved function to check for bean sprouts ingredients with better pattern matching
  const findBeanSproutsInIngredients = (ingredients: any[]) => {
    // Multiple patterns to match bean sprouts-related ingredients
    const beanSproutsPatterns = [
      /giá\s*đỗ/i,           // "giá đỗ", "giá  đỗ"
      /bean\s*sprouts/i,     // "bean sprouts", "BEAN SPROUTS"
      /gia\s*do/i,           // "gia do" (no diacritics)
      /giá\s*đậu/i,          // "giá đậu" (alternative name)
    ]
    
    return ingredients.filter(ingredient => {
      const name = ingredient.lttpName || ""
      return beanSproutsPatterns.some(pattern => pattern.test(name))
    })
  }

  // Simplified bean sprouts calculation using new API
  const calculateBeanSproutsOutputFromAPI = async (dateStr: string) => {
    try {
      console.log("🚀 Using new bean sprouts calculation API for:", dateStr)
      
      const response = await beanSproutsCalculationApi.getBeanSproutsRequirements({
        date: dateStr
      })
      
      if (!response.success || !response.data) {
        console.log("❌ No bean sprouts calculation data available")
        return 0
      }
      
      const totalBeanSproutsRequiredGrams = response.data.totalBeanSproutsRequired || 0
      const totalBeanSproutsRequiredKg = totalBeanSproutsRequiredGrams / 1000 // Convert grams to kg
      
      console.log("✅ API bean sprouts calculation result:", {
        date: dateStr,
        totalBeanSproutsRequiredGrams,
        totalBeanSproutsRequiredKg,
        totalPersonnel: response.data.totalPersonnel,
        dishesUsingBeanSprouts: response.data.dishesUsingBeanSprouts?.length || 0,
        summary: response.data.summary
      })
      
      return totalBeanSproutsRequiredKg
      
    } catch (error) {
      console.error("❌ Error calling bean sprouts calculation API:", error)
      return 0
    }
  }

  // Fetch daily bean sprouts processing data
  const fetchDailyBeanSproutsProcessing = async (date: Date) => {
    try {
      const dateStr = format(date, "yyyy-MM-dd")
      const previousDate = new Date(date)
      previousDate.setDate(date.getDate() - 1)
      const previousDateStr = format(previousDate, "yyyy-MM-dd")
      
      // Get station manager input data from processing station API
      let stationData = {
        soybeansInput: 0,
        beanSproutsInput: 0,
        note: "",
        soybeansPrice: 0,
        beanSproutsPrice: 0
      }
      
      // Get carry over from previous day
      let carryOverAmount = 0
      let carryOverNote = ""
      
      try {
        console.log(`🔄 Checking bean sprouts carry over from ${previousDateStr} to ${dateStr}`)
        const previousStationResponse = await processingStationApi.getDailyData(previousDateStr)
        if (previousStationResponse && previousStationResponse.data) {
          const previousBeanSproutsInput = previousStationResponse.data.beanSproutsInput || 0
          const previousBeanSproutsOutput = previousStationResponse.data.beanSproutsOutput || 0
          carryOverAmount = Math.max(0, previousBeanSproutsInput - previousBeanSproutsOutput)
          
          if (carryOverAmount > 0) {
            carryOverNote = `\n📦 Chuyển từ ${format(previousDate, "dd/MM/yyyy")}: +${carryOverAmount}kg giá đỗ`
            console.log(`✅ Bean sprouts carry over found: ${carryOverAmount}kg from ${previousDateStr}`)
          }
        }
      } catch (error) {
        console.log("No bean sprouts carry over data from previous day:", error)
      }
      
      try {
        const stationResponse = await processingStationApi.getDailyData(dateStr)
        if (stationResponse && stationResponse.data) {
          stationData = {
            soybeansInput: stationResponse.data.soybeansInput || 0,
            beanSproutsInput: (stationResponse.data.beanSproutsInput || 0) + carryOverAmount, // Add carry over
            note: (stationResponse.data.note || "") + carryOverNote, // Add carry over note
            soybeansPrice: stationResponse.data.soybeansPrice || 0,
            beanSproutsPrice: stationResponse.data.beanSproutsPrice || 0
          }
        } else if (carryOverAmount > 0) {
          // If no current data but have carry over, apply it to defaults
          stationData.beanSproutsInput = carryOverAmount
          stationData.note = carryOverNote.trim()
        }
      } catch (error) {
        console.log("No station data found for date, using defaults:", error)
        // Still apply carry over to defaults if available
        if (carryOverAmount > 0) {
          stationData.beanSproutsInput = carryOverAmount
          stationData.note = carryOverNote.trim()
        }
      }

      // Get prices from supply management
      const priceData = await fetchPricesFromSupply(dateStr)

      // Use supply prices if available, otherwise use station manager input
      const finalSoybeansPrice = priceData.soybeansPriceFromSupply ? priceData.soybeansPrice : stationData.soybeansPrice
      const finalBeanSproutsPrice = priceData.beanSproutsPriceFromSupply ? priceData.beanSproutsPrice : stationData.beanSproutsPrice

      // Get bean sprouts output requirement using new API (primary method) or fallback to supply outputs
      let plannedBeanSproutsOutput = 0
      try {
        console.log("🚀 Using Bean Sprouts Calculation API for date:", dateStr)
        
        // Primary method: Use new Bean Sprouts Calculation API
        plannedBeanSproutsOutput = await calculateBeanSproutsOutputFromAPI(dateStr)
        
        // Fallback method: If API returns 0, try to get from supply outputs (legacy)
        if (plannedBeanSproutsOutput === 0) {
          console.log("🔍 API returned 0, trying fallback to supply outputs...")
          const outputsResponse = await supplyOutputsApi.getSupplyOutputs({
            startDate: dateStr,
            endDate: dateStr
          })
          const outputs = Array.isArray(outputsResponse) ? outputsResponse : (outputsResponse as any).data || []
          
          // Calculate planned bean sprouts outputs for this date (type: "planned")
          const filteredOutputs = outputs.filter((output: any) => {
            const outputDate = output.outputDate ? format(new Date(output.outputDate), "yyyy-MM-dd") : null
            const dateMatch = outputDate === dateStr
            const isPlanned = output.type === "planned"
            
            // Check both product name and sourceIngredient name
            const productName = (output.product?.name || "").toLowerCase()
            const ingredientName = (output.sourceIngredient?.lttpName || "").toLowerCase()
            const nameMatch = productName.includes("giá đỗ") || productName.includes("bean sprouts") ||
                             ingredientName.includes("giá đỗ") || ingredientName.includes("bean sprouts")
            
            return dateMatch && isPlanned && nameMatch
          })
          
          plannedBeanSproutsOutput = filteredOutputs.reduce((sum: number, output: any) => sum + (output.quantity || 0), 0)
          
          console.log("🔄 Fallback result:", {
            filteredCount: filteredOutputs.length,
            fallbackBeanSproutsOutput: plannedBeanSproutsOutput
          })
        }
        
      } catch (error) {
        console.log("❌ Error getting bean sprouts output data:", error)
      }

      // Calculate remaining bean sprouts
      const beanSproutsRemaining = stationData.beanSproutsInput - plannedBeanSproutsOutput

      const processingData: DailyBeanSproutsProcessing = {
        date: dateStr,
        soybeansInput: stationData.soybeansInput,
        beanSproutsInput: stationData.beanSproutsInput,
        beanSproutsOutput: plannedBeanSproutsOutput, // Kế hoạch xuất (từ quản lý nguồn xuất - đăng ký người ăn)
        beanSproutsRemaining: Math.max(0, beanSproutsRemaining),
        note: stationData.note,
        soybeansPrice: finalSoybeansPrice || 0,
        beanSproutsPrice: finalBeanSproutsPrice || 0,
        soybeansPriceFromSupply: priceData.soybeansPriceFromSupply,
        beanSproutsPriceFromSupply: priceData.beanSproutsPriceFromSupply
      }

      setDailyBeanSproutsProcessing(processingData)
      
      // Update dailyUpdateData for editing
      setDailyUpdateData({
        soybeansInput: stationData.soybeansInput,
        beanSproutsInput: stationData.beanSproutsInput,
        note: stationData.note,
        soybeansPrice: finalSoybeansPrice || 0,
        beanSproutsPrice: finalBeanSproutsPrice || 0
      })

    } catch (error) {
      console.error("Error fetching daily bean sprouts processing data:", error)
      
      // Set default data
      const defaultData: DailyBeanSproutsProcessing = {
        date: format(date, "yyyy-MM-dd"),
        soybeansInput: 0,
        beanSproutsInput: 0,
        beanSproutsOutput: 0,
        beanSproutsRemaining: 0,
        note: "",
        soybeansPrice: 0,
        beanSproutsPrice: 0,
        soybeansPriceFromSupply: false,
        beanSproutsPriceFromSupply: false
      }
      setDailyBeanSproutsProcessing(defaultData)
      setDailyUpdateData({
        soybeansInput: 0,
        beanSproutsInput: 0,
        note: "",
        soybeansPrice: 0,
        beanSproutsPrice: 0
      })
    }
  }

  // Fetch weekly tracking data using API
  const fetchWeeklyTracking = async (week?: number, year?: number) => {
    const targetWeek = week || selectedWeek
    const targetYear = year || selectedYear
    
    try {
      console.log(`🚀 Fetching weekly bean sprouts tracking data via API for week ${targetWeek}/${targetYear}`)
      
      const response = await beanSproutsCalculationApi.getWeeklyBeanSproutsTracking({
        week: targetWeek,
        year: targetYear
      })

      if (response.success && response.data) {
        const apiData = response.data.dailyData
        
        const weeklyData: WeeklyBeanSproutsTracking[] = apiData.map((day: any) => ({
          date: day.date,
          dayOfWeek: day.dayOfWeek,
          soybeansInput: day.soybeansInput,
          beanSproutsInput: day.beanSproutsInput,
          beanSproutsOutput: day.beanSproutsOutput,
          beanSproutsRemaining: day.beanSproutsRemaining,
          byProductQuantity: day.byProductQuantity || 0,
          byProductPrice: day.byProductPrice || 3000,
          soybeansPrice: day.soybeansPrice || 15000,
          beanSproutsPrice: day.beanSproutsPrice || 8000,
          otherCosts: day.otherCosts || 0
        }))

        setWeeklyTracking(weeklyData)
        
        console.log(`✅ Weekly bean sprouts tracking data loaded:`, {
          week: targetWeek,
          year: targetYear,
          totalDays: weeklyData.length,
          totals: response.data.totals
        })
      } else {
        throw new Error("API response không hợp lệ")
      }
    } catch (error) {
      console.error("❌ Error fetching weekly bean sprouts tracking data via API:", error)
      
      // Fallback: Generate sample data for current week
      const weekDates = getCurrentWeekDates()
      const sampleWeeklyData: WeeklyBeanSproutsTracking[] = weekDates.map((date) => ({
        date: format(date, "yyyy-MM-dd"),
        dayOfWeek: getDayName(date.getDay()),
        soybeansInput: 0,
        beanSproutsInput: 0,
        beanSproutsOutput: 0,
        beanSproutsRemaining: 0,
        byProductQuantity: 0,
        byProductPrice: 3000,
        soybeansPrice: 15000,
        beanSproutsPrice: 8000,
        otherCosts: 0
      }))
      setWeeklyTracking(sampleWeeklyData)
      
      toast({
        title: "Lỗi",
        description: `Không thể lấy dữ liệu tuần ${targetWeek}/${targetYear}. Hiển thị dữ liệu mặc định.`,
        variant: "destructive",
      })
    }
  }

  // Fetch monthly bean sprouts summary using API
  const fetchMonthlyBeanSproutsSummary = async (month?: number, year?: number, monthCount: number = 6) => {
    const targetMonth = month || selectedMonth
    const targetYear = year || selectedMonthYear
    
    try {
      console.log(`🚀 Fetching monthly bean sprouts summary via API for ${targetMonth}/${targetYear}`)
      
      const response = await beanSproutsCalculationApi.getMonthlyBeanSproutsSummary({
        month: targetMonth,
        year: targetYear,
        monthCount
      })

      if (response.success && response.data) {
        const apiData = response.data.monthlySummaries
        
        const monthlySummaries: MonthlyBeanSproutsSummary[] = apiData.map((monthData: any) => ({
          month: monthData.month,
          year: monthData.year,
          totalSoybeansInput: monthData.totalSoybeansInput,
          totalBeanSproutsCollected: monthData.totalBeanSproutsCollected,
          totalBeanSproutsOutput: monthData.totalBeanSproutsOutput,
          totalBeanSproutsRemaining: monthData.totalBeanSproutsRemaining,
          processingEfficiency: monthData.processingEfficiency
        }))
        
        setMonthlyBeanSproutsSummary(monthlySummaries)
        
        console.log(`✅ Monthly bean sprouts summary data loaded:`, {
          targetMonth,
          targetYear,
          monthCount,
          summariesCount: monthlySummaries.length
        })
      } else {
        throw new Error("API response không hợp lệ")
      }
      
    } catch (error) {
      console.error('❌ Error fetching monthly bean sprouts summary via API:', error)
      
      // Fallback: Generate sample data 
      const currentDate = new Date()
      const months = []
      
      for (let i = monthCount - 1; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
        months.push(date)
      }
      
      const fallbackSummaries: MonthlyBeanSproutsSummary[] = months.map(month => {
        const totalSoybeansInput = 1000 + Math.floor(Math.random() * 400)
        const totalBeanSproutsCollected = Math.round(totalSoybeansInput * (2.8 + Math.random() * 0.4))
        const totalBeanSproutsOutput = Math.round(totalBeanSproutsCollected * (0.85 + Math.random() * 0.1))
        
        return {
          month: format(month, 'MM/yyyy', { locale: vi }),
          year: month.getFullYear(),
          totalSoybeansInput,
          totalBeanSproutsCollected,
          totalBeanSproutsOutput,
          totalBeanSproutsRemaining: totalBeanSproutsCollected - totalBeanSproutsOutput,
          processingEfficiency: totalSoybeansInput > 0 ? Math.round((totalBeanSproutsCollected / totalSoybeansInput) * 100) : 90
        }
      })
      
      setMonthlyBeanSproutsSummary(fallbackSummaries)
      
      toast({
        title: "Lỗi",
        description: `Không thể lấy dữ liệu tháng ${targetMonth}/${targetYear}. Hiển thị dữ liệu mặc định.`,
        variant: "destructive",
      })
    }
  }

  // Update daily bean sprouts processing data
  const updateDailyBeanSproutsProcessing = async () => {
    if (!dailyBeanSproutsProcessing) return

    try {
      setIsUpdating(true)

      // Update station data via API
      await processingStationApi.updateDailyData(dailyBeanSproutsProcessing.date, {
        soybeansInput: dailyUpdateData.soybeansInput,
        beanSproutsInput: dailyUpdateData.beanSproutsInput,
        note: dailyUpdateData.note,
        soybeansPrice: dailyUpdateData.soybeansPrice,
        beanSproutsPrice: dailyUpdateData.beanSproutsPrice,
        // Set default values for fields only editable in weekly/monthly views
        byProductQuantity: 0, // Default: no by-products in daily view
        byProductPrice: 3000, // Default price when by-products are added later
        otherCosts: 0 // Default: no other costs in daily view
      })

      // Refresh data
      await fetchDailyBeanSproutsProcessing(new Date(dailyBeanSproutsProcessing.date))
      await fetchWeeklyTracking()

      toast({
        title: "Thành công",
        description: "Đã cập nhật dữ liệu chế biến giá đỗ",
      })

      setEditingDailyData(false)

    } catch (error) {
      console.error("Error updating daily bean sprouts processing:", error)
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
        fetchDailyBeanSproutsProcessing(new Date()),
        fetchMonthlyBeanSproutsSummary(),
        fetchWeeklyTracking()
      ])
      setIsLoading(false)
    }
    
    loadData()
  }, [])

  // Test detection with custom date using new API
  const testBeanSproutsDetection = async (targetDate?: string) => {
    setIsTestingDetection(true)
    try {
      const dateToTest = targetDate || testDate
      console.log("🧪 Testing bean sprouts detection using API for date:", dateToTest)
      
      // Use new API for testing
      const apiResponse = await beanSproutsCalculationApi.getBeanSproutsRequirements({
        date: dateToTest
      })
      
      let result: any
      if (apiResponse.success && apiResponse.data) {
        result = {
          found: true,
          totalBeanSproutsRequired: apiResponse.data.totalBeanSproutsRequired,
          totalPersonnel: apiResponse.data.totalPersonnel,
          dishesUsingBeanSprouts: apiResponse.data.dishesUsingBeanSprouts,
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
          `Tìm thấy ${result.dishesUsingBeanSprouts?.length || 0} món có giá đỗ. Cần xuất: ${result.totalBeanSproutsRequired?.toFixed(2) || 0} kg` :
          `Không tìm thấy giá đỗ: ${result.reason}`,
        variant: result.found ? "default" : "destructive"
      })
      
      // If found bean sprouts for today, refresh the daily data
      if (result.found && dateToTest === format(new Date(), "yyyy-MM-dd")) {
        console.log("🔄 Refreshing daily data with new API results...")
        await fetchDailyBeanSproutsProcessing(new Date())
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
        <Sprout className="h-6 w-6 text-green-600" />
        <h2 className="text-2xl font-bold text-green-800">Làm giá đỗ</h2>
        <Badge className="bg-green-100 text-green-800">
          Chỉ do Trạm trưởng chỉnh sửa
        </Badge>
      </div>

      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Theo ngày
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Theo tuần
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Theo tháng
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          {/* Daily Bean Sprouts Processing */}
          <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-center text-xl font-bold">
            CHẾ BIẾN GIÁ ĐỖ
          </CardTitle>
          <p className="text-sm text-gray-600 text-center">
            Bảng theo dõi ngày hiện tại - {format(new Date(), "dd/MM/yyyy", { locale: vi })}
          </p>
        </CardHeader>
        <CardContent>
          {isLoading || !dailyBeanSproutsProcessing ? (
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
                      const currentBeanSproutsPrice = editingDailyData ? 
                        (dailyBeanSproutsProcessing.beanSproutsPriceFromSupply ? dailyBeanSproutsProcessing.beanSproutsPrice : dailyUpdateData.beanSproutsPrice) || 0 :
                        dailyBeanSproutsProcessing.beanSproutsPrice || 0
                      
                      const currentSoybeansPrice = editingDailyData ? 
                        (dailyBeanSproutsProcessing.soybeansPriceFromSupply ? dailyBeanSproutsProcessing.soybeansPrice : dailyUpdateData.soybeansPrice) || 0 :
                        dailyBeanSproutsProcessing.soybeansPrice || 0
                      
                      const currentBeanSproutsInput = editingDailyData ? dailyUpdateData.beanSproutsInput : dailyBeanSproutsProcessing.beanSproutsInput
                      const currentSoybeansInput = editingDailyData ? dailyUpdateData.soybeansInput : dailyBeanSproutsProcessing.soybeansInput
                      
                      if (currentBeanSproutsPrice === 0 || currentSoybeansPrice === 0) {
                        return (
                          <span className="text-gray-500 text-xl">
                            Chưa có giá
                          </span>
                        )
                      }
                      
                      const beanSproutsRevenue = currentBeanSproutsInput * currentBeanSproutsPrice
                      const soybeansCost = currentSoybeansInput * currentSoybeansPrice
                      const dailyProfit = beanSproutsRevenue - soybeansCost
                      
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
                      const currentBeanSproutsPrice = editingDailyData ? 
                        (dailyBeanSproutsProcessing.beanSproutsPriceFromSupply ? dailyBeanSproutsProcessing.beanSproutsPrice : dailyUpdateData.beanSproutsPrice) || 0 :
                        dailyBeanSproutsProcessing.beanSproutsPrice || 0
                      
                      const currentSoybeansPrice = editingDailyData ? 
                        (dailyBeanSproutsProcessing.soybeansPriceFromSupply ? dailyBeanSproutsProcessing.soybeansPrice : dailyUpdateData.soybeansPrice) || 0 :
                        dailyBeanSproutsProcessing.soybeansPrice || 0
                      
                      const currentBeanSproutsInput = editingDailyData ? dailyUpdateData.beanSproutsInput : dailyBeanSproutsProcessing.beanSproutsInput
                      const currentSoybeansInput = editingDailyData ? dailyUpdateData.soybeansInput : dailyBeanSproutsProcessing.soybeansInput
                      
                      if (currentBeanSproutsPrice && currentSoybeansPrice) {
                        const revenue = currentBeanSproutsInput * currentBeanSproutsPrice
                        const cost = currentSoybeansInput * currentSoybeansPrice
                        return (
                          <>Thu: {revenue.toLocaleString('vi-VN')}đ - Chi: {cost.toLocaleString('vi-VN')}đ{editingDailyData && " (Real-time)"}</>
                        )
                      }
                      return "Cần nhập đầy đủ giá giá đỗ và đậu tương"
                    })()}
                  </div>
                </div>
              </div>

              {/* Carry over info section */}
              {dailyBeanSproutsProcessing?.note?.includes("📦 Chuyển từ") && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                  <div className="flex items-center">
                    <div className="text-blue-800 text-sm">
                      <strong>🔄 Chuyển kho từ ngày trước:</strong>
                      {dailyBeanSproutsProcessing.note.split("📦 Chuyển từ")[1]?.split("\n")[0] || ""}
                    </div>
                  </div>
                </div>
              )}

              {/* Four box layout */}
              <div className="grid grid-cols-2 gap-6">
                {/* Đậu tương chi */}
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-yellow-700 mb-2">Đậu tương chi:</div>
                    <div className="text-2xl font-bold text-yellow-800">
                      {editingDailyData ? (
                        <Input
                          type="number"
                          value={dailyUpdateData.soybeansInput}
                          onChange={(e) => setDailyUpdateData(prev => ({ 
                            ...prev, 
                            soybeansInput: Number(e.target.value) || 0
                          }))}
                          className="w-24 h-12 text-center text-2xl font-bold bg-white border-yellow-300"
                          placeholder="0"
                        />
                      ) : (
                        <span>{dailyBeanSproutsProcessing.soybeansInput}</span>
                      )}
                      <span className="text-lg ml-1">kg</span>
                    </div>
                    <div className="text-xs text-yellow-600 mt-1">
                      (Trạm trưởng nhập tay)
                    </div>
                  </div>
                </div>

                {/* Giá đỗ thu */}
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-green-700 mb-2">Giá đỗ thu:</div>
                    <div className="text-2xl font-bold text-green-800">
                      {editingDailyData ? (
                        <Input
                          type="number"
                          value={dailyUpdateData.beanSproutsInput}
                          onChange={(e) => setDailyUpdateData(prev => ({ 
                            ...prev, 
                            beanSproutsInput: Number(e.target.value) || 0
                          }))}
                          className="w-24 h-12 text-center text-2xl font-bold bg-white border-green-300"
                          placeholder="0"
                        />
                      ) : (
                        <span>{dailyBeanSproutsProcessing.beanSproutsInput}</span>
                      )}
                      <span className="text-lg ml-1">kg</span>
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      (Trạm trưởng nhập tay)
                    </div>
                  </div>
                </div>

                {/* Giá đỗ xuất */}
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-red-700 mb-2">Giá đỗ xuất:</div>
                    <div className="text-2xl font-bold text-red-800">
                      <span>{dailyBeanSproutsProcessing.beanSproutsOutput}</span>
                      <span className="text-lg ml-1">kg</span>
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      (Kế hoạch xuất từ đăng ký người ăn)
                    </div>
                  </div>
                </div>

                {/* Giá đỗ tồn */}
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-purple-700 mb-2">Giá đỗ tồn:</div>
                    <div className="text-2xl font-bold text-purple-800">
                      <span>{dailyBeanSproutsProcessing.beanSproutsRemaining}</span>
                      <span className="text-lg ml-1">kg</span>
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      (Thu - Xuất = {dailyBeanSproutsProcessing.beanSproutsInput} - {dailyBeanSproutsProcessing.beanSproutsOutput})
                    </div>
                  </div>
                </div>
              </div>

              {/* Price section - 2 boxes for soybeans and bean sprouts prices */}
              <div className="grid grid-cols-2 gap-6 mt-6">
                {/* Giá đậu tương */}
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-orange-700 mb-2">Giá đậu tương:</div>
                    <div className="text-xl font-bold text-orange-800">
                      {editingDailyData && !dailyBeanSproutsProcessing.soybeansPriceFromSupply ? (
                        <Input
                          type="number"
                          value={dailyUpdateData.soybeansPrice}
                          onChange={(e) => setDailyUpdateData(prev => ({ 
                            ...prev, 
                            soybeansPrice: Number(e.target.value) || 0
                          }))}
                          className="w-32 h-10 text-center text-xl font-bold bg-white border-orange-300"
                          placeholder="0"
                        />
                      ) : (
                        <span>{(dailyBeanSproutsProcessing.soybeansPrice || 0).toLocaleString('vi-VN')}</span>
                      )}
                      <span className="text-sm ml-1">đ/kg</span>
                    </div>
                    <div className="text-xs text-orange-600 mt-1">
                      {dailyBeanSproutsProcessing.soybeansPriceFromSupply ? (
                        "(Từ quản lý nguồn xuất)"
                      ) : (
                        "(Trạm trưởng nhập tay)"
                      )}
                    </div>
                    {dailyBeanSproutsProcessing.soybeansPriceFromSupply && (
                      <div className="text-xs text-orange-500 mt-1">
                        🔒 Không thể chỉnh sửa
                      </div>
                    )}
                  </div>
                </div>

                {/* Giá giá đỗ */}
                <div className="bg-cyan-50 border-2 border-cyan-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-cyan-700 mb-2">Giá giá đỗ:</div>
                    <div className="text-xl font-bold text-cyan-800">
                      {editingDailyData && !dailyBeanSproutsProcessing.beanSproutsPriceFromSupply ? (
                        <Input
                          type="number"
                          value={dailyUpdateData.beanSproutsPrice}
                          onChange={(e) => setDailyUpdateData(prev => ({ 
                            ...prev, 
                            beanSproutsPrice: Number(e.target.value) || 0
                          }))}
                          className="w-32 h-10 text-center text-xl font-bold bg-white border-cyan-300"
                          placeholder="0"
                        />
                      ) : (
                        <span>{(dailyBeanSproutsProcessing.beanSproutsPrice || 0).toLocaleString('vi-VN')}</span>
                      )}
                      <span className="text-sm ml-1">đ/kg</span>
                    </div>
                    <div className="text-xs text-cyan-600 mt-1">
                      {dailyBeanSproutsProcessing.beanSproutsPriceFromSupply ? (
                        "(Từ quản lý nguồn xuất)"
                      ) : (
                        "(Trạm trưởng nhập tay)"
                      )}
                    </div>
                    {dailyBeanSproutsProcessing.beanSproutsPriceFromSupply && (
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

              {dailyBeanSproutsProcessing.note && !editingDailyData && (
                <div className="bg-gray-50 p-3 rounded border">
                  <div className="text-sm font-medium text-gray-700">Ghi chú:</div>
                  <div className="text-sm text-gray-600 mt-1">{dailyBeanSproutsProcessing.note}</div>
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
                            soybeansInput: dailyBeanSproutsProcessing.soybeansInput,
                            beanSproutsInput: dailyBeanSproutsProcessing.beanSproutsInput,
                            note: dailyBeanSproutsProcessing.note || "",
                            soybeansPrice: dailyBeanSproutsProcessing.soybeansPrice || 0,
                            beanSproutsPrice: dailyBeanSproutsProcessing.beanSproutsPrice || 0
                          })
                        }}
                      >
                        Hủy
                      </Button>
                      <Button onClick={updateDailyBeanSproutsProcessing} disabled={isUpdating}>
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
                        onClick={() => testBeanSproutsDetection()}
                        disabled={isTestingDetection}
                        className="bg-purple-100 text-purple-700 hover:bg-purple-200"
                      >
                        {isTestingDetection ? "🔄 Đang test..." : "🚀 Test Giá Đỗ API"}
                      </Button>
                    </>
                  )}
                </div>
              )}
              
              {/* Info message for other roles */}
              {user?.role && !['stationManager', 'admin'].includes(user.role) && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500 text-center">
                    Chỉ Trạm trưởng mới có thể chỉnh sửa dữ liệu chế biến giá đỗ
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="weekly">
          {/* Weekly Tracking Table */}
          <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-center text-xl font-bold">
            BẢNG THEO DÕI CHẾ BIẾN GIÁ ĐỖ THEO TUẦN
          </CardTitle>
          <p className="text-sm text-gray-600 text-center">
            Ngày hôm nay: {format(new Date(), "EEEE, dd/MM/yyyy", { locale: vi })}
          </p>
          
          {/* Week Filter */}
          <div className="flex items-center justify-center gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Tuần:</label>
              <select
                value={selectedWeek}
                onChange={(e) => {
                  const newWeek = parseInt(e.target.value)
                  setSelectedWeek(newWeek)
                  fetchWeeklyTracking(newWeek, selectedYear)
                }}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                {Array.from({ length: 53 }, (_, i) => i + 1).map((week) => (
                  <option key={week} value={week}>
                    Tuần {week}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Năm:</label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  const newYear = parseInt(e.target.value)
                  setSelectedYear(newYear)
                  fetchWeeklyTracking(selectedWeek, newYear)
                }}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                {Array.from({ length: 11 }, (_, i) => 2020 + i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const now = new Date()
                const currentWeek = getCurrentWeekOfYear(now)
                const currentYear = now.getFullYear()
                
                console.log(`🔄 Reset to current week: ${currentWeek}/${currentYear}`)
                
                setSelectedWeek(currentWeek)
                setSelectedYear(currentYear)
                fetchWeeklyTracking(currentWeek, currentYear)
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              📅 Tuần hiện tại (Tuần {getCurrentWeekOfYear()})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading || weeklyTracking.length === 0 ? (
            <div className="text-center py-8">Đang tải dữ liệu tuần...</div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-2 border-black">
                  <thead>
                    <tr>
                      <th rowSpan={3} className="border border-black p-2 bg-gray-100 font-bold">NGÀY</th>
                      <th rowSpan={3} className="border border-black p-2 bg-gray-100 font-bold">THỨ</th>
                      <th colSpan={3} className="border border-black p-2 bg-green-100 font-bold">THU</th>
                      <th colSpan={3} className="border border-black p-2 bg-red-100 font-bold">CHI</th>
                      <th rowSpan={3} className="border border-black p-2 bg-blue-100 font-bold">THU-<br/>CHI<br/>(LÃI)</th>
                    </tr>
                    <tr>
                      <th colSpan={2} className="border border-black p-1 bg-green-50 text-sm">Giá đỗ</th>
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
                    {weeklyTracking.map((day, index) => {
                      const isToday = format(new Date(), "yyyy-MM-dd") === day.date
                      
                      // Financial calculations for this day
                      const beanSproutsRevenue = (day.beanSproutsInput * day.beanSproutsPrice) / 1000 // Convert to thousands
                      const byProductRevenue = (day.byProductQuantity * day.byProductPrice) / 1000 // Convert to thousands
                      const soybeansCost = (day.soybeansInput * day.soybeansPrice) / 1000 // Convert to thousands
                      const otherCosts = day.otherCosts / 1000 // Convert to thousands
                      const dailyProfit = beanSproutsRevenue + byProductRevenue - soybeansCost - otherCosts
                      
                      return (
                        <tr key={index} className={isToday ? "bg-blue-50" : ""}>
                          <td className="border border-black p-2 text-center font-medium">
                            {format(new Date(day.date), "dd/MM", { locale: vi })}
                            {isToday && <div className="text-xs text-blue-600 mt-1">(Hôm nay)</div>}
                          </td>
                          <td className="border border-black p-2 text-center font-medium">
                            {day.dayOfWeek}
                          </td>
                          {/* THU - Giá đỗ */}
                          <td className="border border-black p-1 text-center font-semibold text-green-600">
                            {day.beanSproutsInput.toLocaleString()}
                          </td>
                          <td className="border border-black p-1 text-center font-semibold text-green-600">
                            {beanSproutsRevenue.toFixed(0)}
                          </td>
                          {/* THU - Sản phẩm phụ */}
                          <td className="border border-black p-1 text-center font-semibold text-green-600">
                            {byProductRevenue.toFixed(0)}
                          </td>
                          {/* CHI - Đậu tương */}
                          <td className="border border-black p-1 text-center font-semibold text-red-600">
                            {day.soybeansInput.toLocaleString()}
                          </td>
                          <td className="border border-black p-1 text-center font-semibold text-red-600">
                            {soybeansCost.toFixed(0)}
                          </td>
                          {/* CHI - Chi khác */}
                          <td className="border border-black p-1 text-center font-semibold text-red-600">
                            {otherCosts.toFixed(0)}
                          </td>
                          {/* THU-CHI (LÃI) */}
                          <td className="border border-black p-1 text-center bg-blue-50">
                            <span className={`font-bold ${
                              dailyProfit >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {dailyProfit.toFixed(0)}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                    
                    {/* Weekly Total Row */}
                    <tr className="bg-gray-200 font-bold border-t-2 border-gray-400">
                      <td colSpan={2} className="border border-black p-2 text-center">
                        TỔNG TUẦN
                      </td>
                      <td className="border border-black p-1 text-center bg-green-100">
                        <span className="text-green-800">
                          {weeklyTracking.reduce((sum, day) => sum + day.beanSproutsInput, 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="border border-black p-1 text-center bg-green-100">
                        <span className="text-green-800">
                          {weeklyTracking.reduce((sum, day) => sum + (day.beanSproutsInput * day.beanSproutsPrice / 1000), 0).toFixed(0)}
                        </span>
                      </td>
                      <td className="border border-black p-1 text-center bg-green-100">
                        <span className="text-green-800">
                          {weeklyTracking.reduce((sum, day) => sum + (day.byProductQuantity * day.byProductPrice / 1000), 0).toFixed(0)}
                        </span>
                      </td>
                      <td className="border border-black p-1 text-center bg-red-100">
                        <span className="text-red-800">
                          {weeklyTracking.reduce((sum, day) => sum + day.soybeansInput, 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="border border-black p-1 text-center bg-red-100">
                        <span className="text-red-800">
                          {weeklyTracking.reduce((sum, day) => sum + (day.soybeansInput * day.soybeansPrice / 1000), 0).toFixed(0)}
                        </span>
                      </td>
                      <td className="border border-black p-1 text-center bg-red-100">
                        <span className="text-red-800">
                          {weeklyTracking.reduce((sum, day) => sum + (day.otherCosts / 1000), 0).toFixed(0)}
                        </span>
                      </td>
                      <td className="border border-black p-1 text-center bg-blue-100">
                        <span className={`font-bold ${
                          weeklyTracking.reduce((sum, day) => {
                            const beanSproutsRev = (day.beanSproutsInput * day.beanSproutsPrice / 1000)
                            const byProductRev = (day.byProductQuantity * day.byProductPrice / 1000)
                            const soybeansCost = (day.soybeansInput * day.soybeansPrice / 1000)
                            const otherCost = (day.otherCosts / 1000)
                            return sum + (beanSproutsRev + byProductRev - soybeansCost - otherCost)
                          }, 0) >= 0 ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {weeklyTracking.reduce((sum, day) => {
                            const beanSproutsRev = (day.beanSproutsInput * day.beanSproutsPrice / 1000)
                            const byProductRev = (day.byProductQuantity * day.byProductPrice / 1000)
                            const soybeansCost = (day.soybeansInput * day.soybeansPrice / 1000)
                            const otherCost = (day.otherCosts / 1000)
                            return sum + (beanSproutsRev + byProductRev - soybeansCost - otherCost)
                          }, 0).toFixed(0)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Financial Summary Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="text-xs text-green-600">Tổng THU (1.000đ)</div>
                  <div className="text-lg font-bold text-green-700">
                    {weeklyTracking.reduce((sum, day) => {
                      const beanSproutsRev = (day.beanSproutsInput * day.beanSproutsPrice / 1000)
                      const byProductRev = (day.byProductQuantity * day.byProductPrice / 1000)
                      return sum + beanSproutsRev + byProductRev
                    }, 0).toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Giá đỗ + Sản phẩm phụ
                  </div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <div className="text-xs text-red-600">Tổng CHI (1.000đ)</div>
                  <div className="text-lg font-bold text-red-700">
                    {weeklyTracking.reduce((sum, day) => {
                      const soybeansCost = (day.soybeansInput * day.soybeansPrice / 1000)
                      const otherCosts = (day.otherCosts / 1000)
                      return sum + soybeansCost + otherCosts
                    }, 0).toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Đậu tương + Chi khác
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="text-xs text-blue-600">LÃI/LỖ (1.000đ)</div>
                  <div className={`text-lg font-bold ${
                    weeklyTracking.reduce((sum, day) => {
                      const beanSproutsRev = (day.beanSproutsInput * day.beanSproutsPrice / 1000)
                      const byProductRev = (day.byProductQuantity * day.byProductPrice / 1000)
                      const soybeansCost = (day.soybeansInput * day.soybeansPrice / 1000)
                      const otherCost = (day.otherCosts / 1000)
                      return sum + (beanSproutsRev + byProductRev - soybeansCost - otherCost)
                    }, 0) >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {weeklyTracking.reduce((sum, day) => {
                      const beanSproutsRev = (day.beanSproutsInput * day.beanSproutsPrice / 1000)
                      const byProductRev = (day.byProductQuantity * day.byProductPrice / 1000)
                      const soybeansCost = (day.soybeansInput * day.soybeansPrice / 1000)
                      const otherCost = (day.otherCosts / 1000)
                      return sum + (beanSproutsRev + byProductRev - soybeansCost - otherCost)
                    }, 0).toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Thu - Chi
                  </div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <div className="text-xs text-yellow-600">Hiệu suất (%)</div>
                  <div className="text-lg font-bold text-yellow-700">
                    {weeklyTracking.length > 0 ? (
                      weeklyTracking.reduce((sum, day) => {
                        return sum + (day.soybeansInput > 0 ? (day.beanSproutsInput / day.soybeansInput) * 100 : 0)
                      }, 0) / weeklyTracking.filter(day => day.soybeansInput > 0).length
                    ).toFixed(1) : '0'}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Tỷ lệ đậu tương → giá đỗ
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="monthly">
          {/* Monthly Summary */}
          <Card>
        <CardHeader>
          <CardTitle className="text-center text-xl font-bold">
            LÀM GIÁ ĐỖ - TỔNG HỢP THEO THÁNG
          </CardTitle>
          <p className="text-sm text-gray-600 text-center">
            Bảng thu chi lãi theo từng tháng trong năm {new Date().getFullYear()}
          </p>
          
          {/* Month Filter */}
          <div className="flex items-center justify-center gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Tháng kết thúc:</label>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  const newMonth = parseInt(e.target.value)
                  setSelectedMonth(newMonth)
                  fetchMonthlyBeanSproutsSummary(newMonth, selectedMonthYear)
                }}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>
                    Tháng {month}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Năm:</label>
              <select
                value={selectedMonthYear}
                onChange={(e) => {
                  const newYear = parseInt(e.target.value)
                  setSelectedMonthYear(newYear)
                  fetchMonthlyBeanSproutsSummary(selectedMonth, newYear)
                }}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                {Array.from({ length: 11 }, (_, i) => 2020 + i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const now = new Date()
                const currentMonth = now.getMonth() + 1
                const currentYear = now.getFullYear()
                setSelectedMonth(currentMonth)
                setSelectedMonthYear(currentYear)
                fetchMonthlyBeanSproutsSummary(currentMonth, currentYear)
              }}
              className="text-green-600 hover:text-green-800"
            >
              📊 Tháng hiện tại
            </Button>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Hiển thị:</label>
              <select
                defaultValue="6"
                onChange={(e) => {
                  const monthCount = parseInt(e.target.value)
                  fetchMonthlyBeanSproutsSummary(selectedMonth, selectedMonthYear, monthCount)
                }}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="3">3 tháng</option>
                <option value="6">6 tháng</option>
                <option value="12">12 tháng</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {monthlyBeanSproutsSummary.length === 0 ? (
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
                      <th colSpan={2} className="border border-black p-1 bg-green-50 text-sm">Giá đỗ</th>
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
                    {monthlyBeanSproutsSummary.map((month, index) => (
                      <tr key={index} className={index === monthlyBeanSproutsSummary.length - 1 ? "bg-blue-50" : ""}>
                        <td className="border border-black p-2 font-medium text-center">
                          {month.month}
                          {index === monthlyBeanSproutsSummary.length - 1 && (
                            <div className="text-xs text-blue-600 mt-1">(Hiện tại)</div>
                          )}
                        </td>
                        {/* THU - Giá đỗ */}
                        <td className="border border-black p-1 text-center font-semibold text-green-600">
                          {month.totalBeanSproutsCollected.toLocaleString()}
                        </td>
                        <td className="border border-black p-1 text-center font-semibold text-green-600">
                          {(month.totalBeanSproutsCollected * 8).toLocaleString()}
                        </td>
                        {/* THU - Sản phẩm phụ */}
                        <td className="border border-black p-1 text-center font-semibold text-green-600">
                          {Math.round(month.totalBeanSproutsCollected * 0.05 * 3).toLocaleString()}
                        </td>
                        {/* CHI - Đậu tương */}
                        <td className="border border-black p-1 text-center font-semibold text-red-600">
                          {month.totalSoybeansInput.toLocaleString()}
                        </td>
                        <td className="border border-black p-1 text-center font-semibold text-red-600">
                          {(month.totalSoybeansInput * 15).toLocaleString()}
                        </td>
                        {/* CHI - Chi khác */}
                        <td className="border border-black p-1 text-center font-semibold text-red-600">
                          {Math.round(month.totalSoybeansInput * 0.02 * 1000).toLocaleString()}
                        </td>
                        {/* THU-CHI (LÃI) */}
                        <td className="border border-black p-1 text-center bg-blue-50">
                          <span className={`font-bold ${
                            ((month.totalBeanSproutsCollected * 8) + Math.round(month.totalBeanSproutsCollected * 0.05 * 3) - 
                             (month.totalSoybeansInput * 15) - Math.round(month.totalSoybeansInput * 0.02 * 1000)) >= 0 
                            ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {(
                              (month.totalBeanSproutsCollected * 8) + Math.round(month.totalBeanSproutsCollected * 0.05 * 3) - 
                              (month.totalSoybeansInput * 15) - Math.round(month.totalSoybeansInput * 0.02 * 1000)
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
        </TabsContent>
      </Tabs>

      {/* Detection Test Results */}
      {detectionResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-center text-xl font-bold">
              🚀 KẾT QUẢ TEST API TÍNH TOÁN GIÁ ĐỖ
            </CardTitle>
            <p className="text-sm text-gray-600 text-center">
              Ngày test: {testDate} • {detectionResult.found ? "✅ Có giá đỗ" : "❌ Không có giá đỗ"}
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
                  onClick={() => testBeanSproutsDetection(testDate)}
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
                      <div className="text-sm text-green-600 mb-1">Số món có giá đỗ</div>
                      <div className="text-2xl font-bold text-green-700">
                        {detectionResult.dishesUsingBeanSprouts?.length || 0}
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
                        {detectionResult.totalBeanSproutsRequired?.toFixed(2) || 0}
                      </div>
                    </div>
                  </div>

                  {/* Dishes Using Bean Sprouts */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-3">Món ăn sử dụng giá đỗ:</h4>
                    <div className="space-y-2">
                      {detectionResult.dishesUsingBeanSprouts?.map((dish: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div>
                            <span className="font-medium">{dish.dishName}</span>
                            <div className="text-xs text-gray-600">
                              Bữa: {dish.mealType === 'morning' ? 'Sáng' : dish.mealType === 'noon' ? 'Trưa' : 'Tối'} | 
                              Nguyên liệu: {dish.beanSproutsIngredients?.map((ing: any) => ing.lttpName).join(", ")}
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
                              <div className="font-medium">{unit.totalBeanSproutsRequired?.toFixed(2)} kg</div>
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
                        <div>Tổng món ăn có giá đỗ: <strong>{detectionResult.summary.totalDishesUsingBeanSprouts}</strong></div>
                        <div>Trung bình giá đỗ/người: <strong>{detectionResult.summary.averageBeanSproutsPerPerson?.toFixed(3)} kg</strong></div>
                        <div>Ước tính đậu tương cần: <strong>{detectionResult.summary.recommendedSoybeansInput?.toFixed(2)} kg</strong></div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">😔</div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Không tìm thấy giá đỗ</h3>
                  <p className="text-gray-600">
                    Lý do: <span className="font-medium">{detectionResult.reason}</span>
                  </p>
                  <div className="mt-4 text-sm text-gray-500">
                    Có thể thực đơn ngày này không có món nào sử dụng giá đỗ, hoặc chưa có thực đơn được lập.
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