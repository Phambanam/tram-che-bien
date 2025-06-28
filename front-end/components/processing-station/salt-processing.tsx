"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Droplets } from "lucide-react"
import { format, getWeek } from "date-fns"
import { vi } from "date-fns/locale"
import { suppliesApi, supplyOutputsApi, unitsApi, processingStationApi, menuPlanningApi, unitPersonnelDailyApi, saltCalculationApi } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth/auth-provider"
import { Unit } from "@/types"

interface DailySaltProcessing {
  date: string
  vegetablesInput: number // CHI - Rau củ quả chi - Số lượng (kg) - Station manager input
  saltInput: number // THU - Dưa muối thu - Số lượng (kg) - Station manager input  
  saltOutput: number // Dưa muối thực tế đã xuất - From supply outputs
  saltRemaining: number // Dưa muối tồn - Calculated: saltInput - saltOutput
  note?: string
  // Price fields
  vegetablesPrice?: number // Giá rau củ quả VND/kg
  saltPrice?: number // Giá dưa muối VND/kg
  vegetablesPriceFromSupply?: boolean // Giá từ quản lý nguồn xuất hay nhập tay
  saltPriceFromSupply?: boolean // Giá từ quản lý nguồn xuất hay nhập tay
  // By-products fields
  byProductQuantity?: number // Sản phẩm phụ (kg) - Station manager input
  byProductPrice?: number // Giá sản phẩm phụ VND/kg
  otherCosts?: number // Chi phí khác (VND) - Station manager input
}

interface WeeklySaltTracking {
  date: string
  dayOfWeek: string
  vegetablesInput: number // Rau củ quả chi
  saltInput: number // Dưa muối thu
  saltOutput: number // Dưa muối thực tế đã xuất
  saltRemaining: number // Dưa muối tồn
  // Financial calculation fields
  byProductQuantity: number // Sản phẩm phụ (kg)
  byProductPrice: number // Giá sản phẩm phụ VND/kg
  vegetablesPrice: number // Giá rau củ quả VND/kg
  saltPrice: number // Giá dưa muối VND/kg
  otherCosts: number // Chi phí khác (VND)
}

interface MonthlySaltSummary {
  month: string
  year: number
  totalVegetablesInput: number
  totalSaltCollected: number
  totalSaltOutput: number
  totalSaltRemaining: number
  processingEfficiency: number // percentage
}

export function SaltProcessing() {
  // ✨ UPDATED: Now uses new Salt Calculation API instead of complex ingredient analysis
  // The new API /api/salt-calculation/requirements provides accurate salt requirements
  // based on menu data and unit personnel, replacing manual calculation logic
  
  const [dailySaltProcessing, setDailySaltProcessing] = useState<DailySaltProcessing | null>(null)
  const [monthlySaltSummary, setMonthlySaltSummary] = useState<MonthlySaltSummary[]>([])
  const [weeklyTracking, setWeeklyTracking] = useState<WeeklySaltTracking[]>([])
  const [editingDailyData, setEditingDailyData] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [dailyUpdateData, setDailyUpdateData] = useState<{
    vegetablesInput: number
    saltInput: number
    note: string
    vegetablesPrice: number
    saltPrice: number
  }>({
    vegetablesInput: 0,
    saltInput: 0,
    note: "",
    vegetablesPrice: 0,
    saltPrice: 0
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

  // Fetch prices from supply
  const fetchPricesFromSupply = async (date: string) => {
    try {
      let vegetablesPrice = null
      let saltPrice = null
      let vegetablesPriceFromSupply = false
      let saltPriceFromSupply = false

      // Get supplies data to check for vegetables and salt prices
      const suppliesResponse = await suppliesApi.getSupplies({
        status: 'approved'
      })
      
      const supplies = Array.isArray(suppliesResponse) ? suppliesResponse : (suppliesResponse as any).data || []

      // Look for vegetables (rau củ quả) in supplies
      const vegetablesSupply = supplies.find((supply: any) => 
        (supply.product?.name?.toLowerCase().includes("rau") || 
         supply.product?.name?.toLowerCase().includes("củ") || 
         supply.product?.name?.toLowerCase().includes("quả")) &&
        supply.unitPrice
      )

      if (vegetablesSupply && vegetablesSupply.unitPrice) {
        vegetablesPrice = vegetablesSupply.unitPrice
        vegetablesPriceFromSupply = true
      }

      // Look for salt/pickled vegetables (dưa muối) in supplies 
      const saltSupply = supplies.find((supply: any) => 
        (supply.product?.name?.toLowerCase().includes("dưa muối") ||
         supply.product?.name?.toLowerCase().includes("muối nén")) &&
        supply.unitPrice
      )

      if (saltSupply && saltSupply.unitPrice) {
        saltPrice = saltSupply.unitPrice
        saltPriceFromSupply = true
      }

      return {
        vegetablesPrice,
        saltPrice,
        vegetablesPriceFromSupply,
        saltPriceFromSupply
      }
    } catch (error) {
      console.log("Error fetching prices from supply:", error)
      return {
        vegetablesPrice: null,
        saltPrice: null,
        vegetablesPriceFromSupply: false,
        saltPriceFromSupply: false
      }
    }
  }

  // Improved function to check for salt ingredients with better pattern matching
  const findSaltInIngredients = (ingredients: any[]) => {
    // Multiple patterns to match salt-related ingredients
    const saltPatterns = [
      /dưa\s*muối/i,           // "dưa muối", "dưa  muối"
      /muối\s*nén/i,           // "muối nén"
      /dưa\s*chua/i,           // "dưa chua"
      /dưa\s*cải/i,            // "dưa cải" 
      /pickled/i               // "pickled"
    ]
    
    return ingredients.filter(ingredient => {
      const name = ingredient.lttpName || ""
      return saltPatterns.some(pattern => pattern.test(name))
    })
  }

  // Simplified salt calculation using new API
  const calculateSaltOutputFromAPI = async (dateStr: string) => {
    try {
      console.log("🚀 Using new salt calculation API for:", dateStr)
      
      const response = await saltCalculationApi.getSaltRequirements({
        date: dateStr
      })
      
      if (!response.success || !response.data) {
        console.log("❌ No salt calculation data available")
        return 0
      }
      
      const totalSaltRequiredGrams = response.data.totalSaltRequired || 0
      const totalSaltRequiredKg = totalSaltRequiredGrams / 1000 // Convert grams to kg
      
      console.log("✅ API salt calculation result:", {
        date: dateStr,
        totalSaltRequiredGrams,
        totalSaltRequiredKg,
        totalPersonnel: response.data.totalPersonnel,
        dishesUsingSalt: response.data.dishesUsingSalt?.length || 0,
        summary: response.data.summary
      })
      
      return totalSaltRequiredKg
      
    } catch (error) {
      console.error("❌ Error calling salt calculation API:", error)
      return 0
    }
  }

  // Fetch daily salt processing data
  const fetchDailySaltProcessing = async (date: Date) => {
    try {
      const dateStr = format(date, "yyyy-MM-dd")
      
      // Get station manager input data from processing station API
      let stationData = {
        vegetablesInput: 0,
        saltInput: 0,
        note: "",
        vegetablesPrice: 0,
        saltPrice: 0
      }
      
      try {
        const stationResponse = await processingStationApi.getDailyData(dateStr)
        if (stationResponse && stationResponse.data) {
          stationData = {
            vegetablesInput: stationResponse.data.vegetablesInput || 0,
            saltInput: stationResponse.data.saltInput || 0,
            note: stationResponse.data.note || "",
            vegetablesPrice: stationResponse.data.vegetablesPrice || 0,
            saltPrice: stationResponse.data.saltPrice || 0
          }
        }
      } catch (error) {
        console.log("No station data found for date, using defaults:", error)
      }

      // Get prices from supply management
      const priceData = await fetchPricesFromSupply(dateStr)

      // Use supply prices if available, otherwise use station manager input
      const finalVegetablesPrice = priceData.vegetablesPriceFromSupply ? priceData.vegetablesPrice : stationData.vegetablesPrice
      const finalSaltPrice = priceData.saltPriceFromSupply ? priceData.saltPrice : stationData.saltPrice

      // Get salt output requirement using new API (primary method) or fallback to supply outputs
      let plannedSaltOutput = 0
      try {
        console.log("🚀 Using Salt Calculation API for date:", dateStr)
        
        // Primary method: Use new Salt Calculation API
        plannedSaltOutput = await calculateSaltOutputFromAPI(dateStr)
        
        // Fallback method: If API returns 0, try to get from supply outputs (legacy)
        if (plannedSaltOutput === 0) {
          console.log("🔍 API returned 0, trying fallback to supply outputs...")
          const outputsResponse = await supplyOutputsApi.getSupplyOutputs({
            startDate: dateStr,
            endDate: dateStr
          })
          const outputs = Array.isArray(outputsResponse) ? outputsResponse : (outputsResponse as any).data || []
          
          // Calculate planned salt outputs for this date (type: "planned")
          const filteredOutputs = outputs.filter((output: any) => {
            const outputDate = output.outputDate ? format(new Date(output.outputDate), "yyyy-MM-dd") : null
            const dateMatch = outputDate === dateStr
            const isPlanned = output.type === "planned"
            
            // Check both product name and sourceIngredient name
            const productName = (output.product?.name || "").toLowerCase()
            const ingredientName = (output.sourceIngredient?.lttpName || "").toLowerCase()
            const nameMatch = productName.includes("dưa muối") || productName.includes("muối nén") ||
                             ingredientName.includes("dưa muối") || ingredientName.includes("muối nén")
            
            return dateMatch && isPlanned && nameMatch
          })
          
          plannedSaltOutput = filteredOutputs.reduce((sum: number, output: any) => sum + (output.quantity || 0), 0)
          
          console.log("🔄 Fallback result:", {
            filteredCount: filteredOutputs.length,
            fallbackSaltOutput: plannedSaltOutput
          })
        }
        
      } catch (error) {
        console.log("❌ Error getting salt output data:", error)
      }

      // Calculate remaining salt
      const saltRemaining = stationData.saltInput - plannedSaltOutput

      const processingData: DailySaltProcessing = {
        date: dateStr,
        vegetablesInput: stationData.vegetablesInput,
        saltInput: stationData.saltInput,
        saltOutput: plannedSaltOutput, // Kế hoạch xuất (từ quản lý nguồn xuất - đăng ký người ăn)
        saltRemaining: Math.max(0, saltRemaining),
        note: stationData.note,
        vegetablesPrice: finalVegetablesPrice || 0,
        saltPrice: finalSaltPrice || 0,
        vegetablesPriceFromSupply: priceData.vegetablesPriceFromSupply,
        saltPriceFromSupply: priceData.saltPriceFromSupply
      }

      setDailySaltProcessing(processingData)
      
      // Update dailyUpdateData for editing (get by-products and other costs from API response)
      try {
        const dailyApiResponse = await processingStationApi.getDailyData(dateStr)
        const apiData = dailyApiResponse?.data || {}
        
        setDailyUpdateData({
          vegetablesInput: stationData.vegetablesInput,
          saltInput: stationData.saltInput,
          note: stationData.note,
          vegetablesPrice: finalVegetablesPrice || 0,
          saltPrice: finalSaltPrice || 0
        })
      } catch (error) {
        console.log("Error loading by-products data, using defaults:", error)
        setDailyUpdateData({
          vegetablesInput: stationData.vegetablesInput,
          saltInput: stationData.saltInput,
          note: stationData.note,
          vegetablesPrice: finalVegetablesPrice || 0,
          saltPrice: finalSaltPrice || 0
        })
      }

    } catch (error) {
      console.error("Error fetching daily salt processing data:", error)
      
      // Set default data
      const defaultData: DailySaltProcessing = {
        date: format(date, "yyyy-MM-dd"),
        vegetablesInput: 0,
        saltInput: 0,
        saltOutput: 0,
        saltRemaining: 0,
        note: "",
        vegetablesPrice: 0,
        saltPrice: 0,
        vegetablesPriceFromSupply: false,
        saltPriceFromSupply: false
      }
      setDailySaltProcessing(defaultData)
      setDailyUpdateData({
        vegetablesInput: 0,
        saltInput: 0,
        note: "",
        vegetablesPrice: 0,
        saltPrice: 0
      })
    }
  }

  // Fetch weekly tracking data using API
  const fetchWeeklyTracking = async (week?: number, year?: number) => {
    const targetWeek = week || selectedWeek
    const targetYear = year || selectedYear
    
    try {
      console.log(`🚀 Fetching weekly tracking data via API for week ${targetWeek}/${targetYear}`)
      
      const response = await saltCalculationApi.getWeeklySaltTracking({
        week: targetWeek,
        year: targetYear
      })

      if (response.success && response.data) {
        const apiData = response.data.dailyData
        
        const weeklyData: WeeklySaltTracking[] = apiData.map((day: any) => ({
          date: day.date,
          dayOfWeek: day.dayOfWeek,
          vegetablesInput: day.vegetablesInput,
          saltInput: day.saltInput,
          saltOutput: day.saltOutput,
          saltRemaining: day.saltRemaining,
          byProductQuantity: day.byProductQuantity || 0,
          byProductPrice: day.byProductPrice || 2000,
          vegetablesPrice: day.vegetablesPrice || 8000,
          saltPrice: day.saltPrice || 12000,
          otherCosts: day.otherCosts || 0
        }))

        setWeeklyTracking(weeklyData)
        
        console.log(`✅ Weekly tracking data loaded:`, {
          week: targetWeek,
          year: targetYear,
          totalDays: weeklyData.length,
          totals: response.data.totals
        })
      } else {
        throw new Error("API response không hợp lệ")
      }
    } catch (error) {
      console.error("❌ Error fetching weekly tracking data via API:", error)
      
      // Fallback: Generate sample data for current week
      const weekDates = getCurrentWeekDates()
      const sampleWeeklyData: WeeklySaltTracking[] = weekDates.map((date) => ({
        date: format(date, "yyyy-MM-dd"),
        dayOfWeek: getDayName(date.getDay()),
        vegetablesInput: 0,
        saltInput: 0,
        saltOutput: 0,
        saltRemaining: 0,
        byProductQuantity: 0,
        byProductPrice: 2000,
        vegetablesPrice: 8000,
        saltPrice: 12000,
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

  // Fetch monthly salt summary using API
  const fetchMonthlySaltSummary = async (month?: number, year?: number, monthCount: number = 6) => {
    const targetMonth = month || selectedMonth
    const targetYear = year || selectedMonthYear
    
    try {
      console.log(`🚀 Fetching monthly summary via API for ${targetMonth}/${targetYear}`)
      
      const response = await saltCalculationApi.getMonthlySaltSummary({
        month: targetMonth,
        year: targetYear,
        monthCount
      })

      if (response.success && response.data) {
        const apiData = response.data.monthlySummaries
        
        const monthlySummaries: MonthlySaltSummary[] = apiData.map((monthData: any) => ({
          month: monthData.month,
          year: monthData.year,
          totalVegetablesInput: monthData.totalVegetablesInput,
          totalSaltCollected: monthData.totalSaltCollected,
          totalSaltOutput: monthData.totalSaltOutput,
          totalSaltRemaining: monthData.totalSaltRemaining,
          processingEfficiency: monthData.processingEfficiency
        }))
        
        setMonthlySaltSummary(monthlySummaries)
        
        console.log(`✅ Monthly summary data loaded:`, {
          targetMonth,
          targetYear,
          monthCount,
          summariesCount: monthlySummaries.length
        })
      } else {
        throw new Error("API response không hợp lệ")
      }
      
    } catch (error) {
      console.error('❌ Error fetching monthly salt summary via API:', error)
      
      // Fallback: Generate sample data 
      const currentDate = new Date()
      const months = []
      
      for (let i = monthCount - 1; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
        months.push(date)
      }
      
      const fallbackSummaries: MonthlySaltSummary[] = months.map(month => {
        const totalVegetablesInput = 2000 + Math.floor(Math.random() * 800)
        const totalSaltCollected = 1400 + Math.floor(Math.random() * 560)
        const totalSaltOutput = 1200 + Math.floor(Math.random() * 480)
        
        return {
          month: format(month, 'MM/yyyy', { locale: vi }),
          year: month.getFullYear(),
          totalVegetablesInput,
          totalSaltCollected,
          totalSaltOutput,
          totalSaltRemaining: totalSaltCollected - totalSaltOutput,
          processingEfficiency: totalVegetablesInput > 0 ? Math.round((totalSaltCollected / totalVegetablesInput) * 100) : 0
        }
      })
      
      setMonthlySaltSummary(fallbackSummaries)
      
      toast({
        title: "Lỗi",
        description: `Không thể lấy dữ liệu tháng ${targetMonth}/${targetYear}. Hiển thị dữ liệu mặc định.`,
        variant: "destructive",
      })
    }
  }

  // Update daily salt processing data
  const updateDailySaltProcessing = async () => {
    if (!dailySaltProcessing) return

    try {
      setIsUpdating(true)

      // Update station data via API (byProductQuantity, byProductPrice, otherCosts get default values since not edited in daily view)
      await processingStationApi.updateDailyData(dailySaltProcessing.date, {
        vegetablesInput: dailyUpdateData.vegetablesInput,
        saltInput: dailyUpdateData.saltInput,
        note: dailyUpdateData.note,
        vegetablesPrice: dailyUpdateData.vegetablesPrice,
        saltPrice: dailyUpdateData.saltPrice,
        // Set default values for fields only editable in weekly/monthly views
        byProductQuantity: 0, // Default: no by-products in daily view
        byProductPrice: 2000, // Default price when by-products are added later
        otherCosts: 0 // Default: no other costs in daily view
      })

      // Refresh data
      await fetchDailySaltProcessing(new Date(dailySaltProcessing.date))
      await fetchWeeklyTracking()

      toast({
        title: "Thành công",
        description: "Đã cập nhật dữ liệu chế biến dưa muối (bao gồm sản phẩm phụ và chi phí khác)",
      })

      setEditingDailyData(false)

    } catch (error) {
      console.error("Error updating daily salt processing:", error)
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi cập nhật dữ liệu",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Test detection with custom date using new API
  const testSaltDetection = async (targetDate?: string) => {
    setIsTestingDetection(true)
    try {
      const dateToTest = targetDate || testDate
      console.log("🧪 Testing salt detection using API for date:", dateToTest)
      
      // Use new API for testing
      const apiResponse = await saltCalculationApi.getSaltRequirements({
        date: dateToTest
      })
      
      let result: any
      if (apiResponse.success && apiResponse.data) {
        result = {
          found: true,
          totalSaltRequired: apiResponse.data.totalSaltRequired,
          totalPersonnel: apiResponse.data.totalPersonnel,
          dishesUsingSalt: apiResponse.data.dishesUsingSalt,
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
          `Tìm thấy ${result.dishesUsingSalt?.length || 0} món có dưa muối. Cần xuất: ${result.totalSaltRequired?.toFixed(2) || 0} kg` :
          `Không tìm thấy dưa muối: ${result.reason}`,
        variant: result.found ? "default" : "destructive"
      })
      
      // If found salt for today, refresh the daily data
      if (result.found && dateToTest === format(new Date(), "yyyy-MM-dd")) {
        console.log("🔄 Refreshing daily data with new API results...")
        await fetchDailySaltProcessing(new Date())
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

  // Load data when component mounts
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([
        fetchDailySaltProcessing(new Date()),
        fetchMonthlySaltSummary(),
        fetchWeeklyTracking()
      ])
      setIsLoading(false)
    }
    
    loadData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Droplets className="h-6 w-6 text-cyan-600" />
        <h2 className="text-2xl font-bold text-cyan-800">Làm dưa muối</h2>
        <Badge className="bg-cyan-100 text-cyan-800">
          Chỉ do Trạm trưởng chỉnh sửa
        </Badge>
      </div>

      {/* Daily Salt Processing */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-center text-xl font-bold">
            CHẾ BIẾN DƯA MUỐI
          </CardTitle>
          <p className="text-sm text-gray-600 text-center">
            Bảng theo dõi ngày hiện tại - {format(new Date(), "dd/MM/yyyy", { locale: vi })}
          </p>
        </CardHeader>
        <CardContent>
          {isLoading || !dailySaltProcessing ? (
            <div className="text-center py-8">Đang tải dữ liệu...</div>
          ) : (
            <div className="space-y-4">
              {/* Lãi trong ngày */}
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-300 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-cyan-700 mb-2">
                    🏆 LÃI TRONG NGÀY:
                    {editingDailyData && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full ml-2">
                        Live
                      </span>
                    )}
                  </div>
                  <div className="text-3xl font-bold text-cyan-900">
                    {(() => {
                      // Use real-time data from editing state if in edit mode, otherwise use saved data
                      const currentSaltPrice = editingDailyData ? 
                        (dailySaltProcessing.saltPriceFromSupply ? dailySaltProcessing.saltPrice : dailyUpdateData.saltPrice) || 0 :
                        dailySaltProcessing.saltPrice || 0
                      
                      const currentVegetablesPrice = editingDailyData ? 
                        (dailySaltProcessing.vegetablesPriceFromSupply ? dailySaltProcessing.vegetablesPrice : dailyUpdateData.vegetablesPrice) || 0 :
                        dailySaltProcessing.vegetablesPrice || 0
                      
                      const currentSaltInput = editingDailyData ? dailyUpdateData.saltInput : dailySaltProcessing.saltInput
                      const currentVegetablesInput = editingDailyData ? dailyUpdateData.vegetablesInput : dailySaltProcessing.vegetablesInput
                      
                      if (currentSaltPrice === 0 || currentVegetablesPrice === 0) {
                        return (
                          <span className="text-gray-500 text-xl">
                            Chưa có giá
                          </span>
                        )
                      }
                      
                      const saltRevenue = currentSaltInput * currentSaltPrice
                      const vegetablesCost = currentVegetablesInput * currentVegetablesPrice
                      const dailyProfit = saltRevenue - vegetablesCost
                      
                      return (
                        <span className={dailyProfit >= 0 ? "text-green-600" : "text-red-600"}>
                          {dailyProfit >= 0 ? "+" : ""}{dailyProfit.toLocaleString('vi-VN')}
                        </span>
                      )
                    })()}
                    <span className="text-lg ml-1">đ</span>
                  </div>
                  <div className="text-xs text-cyan-600 mt-1">
                    {(() => {
                      // Calculate breakdown using current values (real-time)
                      const currentSaltPrice = editingDailyData ? 
                        (dailySaltProcessing.saltPriceFromSupply ? dailySaltProcessing.saltPrice : dailyUpdateData.saltPrice) || 0 :
                        dailySaltProcessing.saltPrice || 0
                      
                      const currentVegetablesPrice = editingDailyData ? 
                        (dailySaltProcessing.vegetablesPriceFromSupply ? dailySaltProcessing.vegetablesPrice : dailyUpdateData.vegetablesPrice) || 0 :
                        dailySaltProcessing.vegetablesPrice || 0
                      
                      const currentSaltInput = editingDailyData ? dailyUpdateData.saltInput : dailySaltProcessing.saltInput
                      const currentVegetablesInput = editingDailyData ? dailyUpdateData.vegetablesInput : dailySaltProcessing.vegetablesInput
                      
                      if (currentSaltPrice && currentVegetablesPrice) {
                        const revenue = currentSaltInput * currentSaltPrice
                        const cost = currentVegetablesInput * currentVegetablesPrice
                        return (
                          <>Thu: {revenue.toLocaleString('vi-VN')}đ - Chi: {cost.toLocaleString('vi-VN')}đ{editingDailyData && " (Real-time)"}</>
                        )
                      }
                      return "Cần nhập đầy đủ giá dưa muối và rau củ quả"
                    })()}
                  </div>
                </div>
              </div>

              {/* Four box layout */}
              <div className="grid grid-cols-2 gap-6">
                {/* Rau củ quả chi */}
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-green-700 mb-2">Rau củ quả chi:</div>
                    <div className="text-2xl font-bold text-green-800">
                      {editingDailyData ? (
                        <Input
                          type="number"
                          value={dailyUpdateData.vegetablesInput}
                          onChange={(e) => setDailyUpdateData(prev => ({ 
                            ...prev, 
                            vegetablesInput: Number(e.target.value) || 0
                          }))}
                          className="w-24 h-12 text-center text-2xl font-bold bg-white border-green-300"
                          placeholder="0"
                        />
                      ) : (
                        <span>{dailySaltProcessing.vegetablesInput}</span>
                      )}
                      <span className="text-lg ml-1">kg</span>
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      (Trạm trưởng nhập tay)
                    </div>
                  </div>
                </div>

                {/* Dưa muối thu */}
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-yellow-700 mb-2">Dưa muối thu:</div>
                    <div className="text-2xl font-bold text-yellow-800">
                      {editingDailyData ? (
                        <Input
                          type="number"
                          value={dailyUpdateData.saltInput}
                          onChange={(e) => setDailyUpdateData(prev => ({ 
                            ...prev, 
                            saltInput: Number(e.target.value) || 0
                          }))}
                          className="w-24 h-12 text-center text-2xl font-bold bg-white border-yellow-300"
                          placeholder="0"
                        />
                      ) : (
                        <span>{dailySaltProcessing.saltInput}</span>
                      )}
                      <span className="text-lg ml-1">kg</span>
                    </div>
                    <div className="text-xs text-yellow-600 mt-1">
                      (Trạm trưởng nhập tay)
                    </div>
                  </div>
                </div>

                {/* Dưa muối xuất */}
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-red-700 mb-2">Dưa muối xuất:</div>
                    <div className="text-2xl font-bold text-red-800">
                      <span>{dailySaltProcessing.saltOutput}</span>
                      <span className="text-lg ml-1">kg</span>
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      (Kế hoạch xuất từ đăng ký người ăn)
                    </div>
                  </div>
                </div>

                {/* Dưa muối tồn */}
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-purple-700 mb-2">Dưa muối tồn:</div>
                    <div className="text-2xl font-bold text-purple-800">
                      <span>{dailySaltProcessing.saltRemaining}</span>
                      <span className="text-lg ml-1">kg</span>
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      (Thu - Xuất = {dailySaltProcessing.saltInput} - {dailySaltProcessing.saltOutput})
                    </div>
                  </div>
                </div>
              </div>

              {/* Price section - 2 boxes for vegetables and salt prices */}
              <div className="grid grid-cols-2 gap-6 mt-6">
                {/* Giá rau củ quả */}
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-orange-700 mb-2">Giá rau củ quả:</div>
                    <div className="text-xl font-bold text-orange-800">
                      {editingDailyData && !dailySaltProcessing.vegetablesPriceFromSupply ? (
                        <Input
                          type="number"
                          value={dailyUpdateData.vegetablesPrice}
                          onChange={(e) => setDailyUpdateData(prev => ({ 
                            ...prev, 
                            vegetablesPrice: Number(e.target.value) || 0
                          }))}
                          className="w-32 h-10 text-center text-xl font-bold bg-white border-orange-300"
                          placeholder="0"
                        />
                      ) : (
                        <span>{(dailySaltProcessing.vegetablesPrice || 0).toLocaleString('vi-VN')}</span>
                      )}
                      <span className="text-sm ml-1">đ/kg</span>
                    </div>
                    <div className="text-xs text-orange-600 mt-1">
                      {dailySaltProcessing.vegetablesPriceFromSupply ? (
                        "(Từ quản lý nguồn xuất)"
                      ) : (
                        "(Trạm trưởng nhập tay)"
                      )}
                    </div>
                    {dailySaltProcessing.vegetablesPriceFromSupply && (
                      <div className="text-xs text-orange-500 mt-1">
                        🔒 Không thể chỉnh sửa
                      </div>
                    )}
                  </div>
                </div>

                {/* Giá dưa muối */}
                <div className="bg-cyan-50 border-2 border-cyan-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-cyan-700 mb-2">Giá dưa muối:</div>
                    <div className="text-xl font-bold text-cyan-800">
                      {editingDailyData && !dailySaltProcessing.saltPriceFromSupply ? (
                        <Input
                          type="number"
                          value={dailyUpdateData.saltPrice}
                          onChange={(e) => setDailyUpdateData(prev => ({ 
                            ...prev, 
                            saltPrice: Number(e.target.value) || 0
                          }))}
                          className="w-32 h-10 text-center text-xl font-bold bg-white border-cyan-300"
                          placeholder="0"
                        />
                      ) : (
                        <span>{(dailySaltProcessing.saltPrice || 0).toLocaleString('vi-VN')}</span>
                      )}
                      <span className="text-sm ml-1">đ/kg</span>
                    </div>
                    <div className="text-xs text-cyan-600 mt-1">
                      {dailySaltProcessing.saltPriceFromSupply ? (
                        "(Từ quản lý nguồn xuất)"
                      ) : (
                        "(Trạm trưởng nhập tay)"
                      )}
                    </div>
                    {dailySaltProcessing.saltPriceFromSupply && (
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

              {dailySaltProcessing.note && !editingDailyData && (
                <div className="bg-gray-50 p-3 rounded border">
                  <div className="text-sm font-medium text-gray-700">Ghi chú:</div>
                  <div className="text-sm text-gray-600 mt-1">{dailySaltProcessing.note}</div>
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
                            vegetablesInput: dailySaltProcessing.vegetablesInput,
                            saltInput: dailySaltProcessing.saltInput,
                            note: dailySaltProcessing.note || "",
                            vegetablesPrice: dailySaltProcessing.vegetablesPrice || 0,
                            saltPrice: dailySaltProcessing.saltPrice || 0
                          })
                        }}
                      >
                        Hủy
                      </Button>
                      <Button onClick={updateDailySaltProcessing} disabled={isUpdating}>
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
                        onClick={() => testSaltDetection()}
                        disabled={isTestingDetection}
                        className="bg-purple-100 text-purple-700 hover:bg-purple-200"
                      >
                        {isTestingDetection ? "🔄 Đang test..." : "🚀 Test Salt API"}
                      </Button>
                    </>
                  )}
                </div>
              )}
              
              {/* Info message for other roles */}
              {user?.role && !['stationManager', 'admin'].includes(user.role) && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500 text-center">
                    Chỉ Trạm trưởng mới có thể chỉnh sửa dữ liệu chế biến dưa muối
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
            BẢNG THEO DÕI CHẾ BIẾN DƯA MUỐI THEO TUẦN
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
                      <th colSpan={2} className="border border-black p-1 bg-green-50 text-sm">Dưa muối</th>
                      <th rowSpan={2} className="border border-black p-1 bg-green-50 text-sm">Sản<br/>phẩm<br/>phụ<br/>(1.000đ)</th>
                      <th colSpan={2} className="border border-black p-1 bg-red-50 text-sm">Rau củ quả</th>
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
                      const saltRevenue = (day.saltInput * day.saltPrice) / 1000 // Convert to thousands
                      const byProductRevenue = (day.byProductQuantity * day.byProductPrice) / 1000 // Convert to thousands
                      const vegetablesCost = (day.vegetablesInput * day.vegetablesPrice) / 1000 // Convert to thousands
                      const otherCosts = day.otherCosts / 1000 // Convert to thousands
                      const dailyProfit = saltRevenue + byProductRevenue - vegetablesCost - otherCosts
                      
                      return (
                        <tr key={index} className={isToday ? "bg-blue-50" : ""}>
                          <td className="border border-black p-2 text-center font-medium">
                            {format(new Date(day.date), "dd/MM", { locale: vi })}
                            {isToday && <div className="text-xs text-blue-600 mt-1">(Hôm nay)</div>}
                          </td>
                          <td className="border border-black p-2 text-center font-medium">
                            {day.dayOfWeek}
                          </td>
                          {/* THU - Dưa muối */}
                          <td className="border border-black p-1 text-center font-semibold text-green-600">
                            {day.saltInput.toLocaleString()}
                          </td>
                          <td className="border border-black p-1 text-center font-semibold text-green-600">
                            {saltRevenue.toFixed(0)}
                          </td>
                          {/* THU - Sản phẩm phụ */}
                          <td className="border border-black p-1 text-center font-semibold text-green-600">
                            {byProductRevenue.toFixed(0)}
                          </td>
                          {/* CHI - Rau củ quả */}
                          <td className="border border-black p-1 text-center font-semibold text-red-600">
                            {day.vegetablesInput.toLocaleString()}
                          </td>
                          <td className="border border-black p-1 text-center font-semibold text-red-600">
                            {vegetablesCost.toFixed(0)}
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
                          {weeklyTracking.reduce((sum, day) => sum + day.saltInput, 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="border border-black p-1 text-center bg-green-100">
                        <span className="text-green-800">
                          {weeklyTracking.reduce((sum, day) => sum + (day.saltInput * day.saltPrice / 1000), 0).toFixed(0)}
                        </span>
                      </td>
                      <td className="border border-black p-1 text-center bg-green-100">
                        <span className="text-green-800">
                          {weeklyTracking.reduce((sum, day) => sum + (day.byProductQuantity * day.byProductPrice / 1000), 0).toFixed(0)}
                        </span>
                      </td>
                      <td className="border border-black p-1 text-center bg-red-100">
                        <span className="text-red-800">
                          {weeklyTracking.reduce((sum, day) => sum + day.vegetablesInput, 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="border border-black p-1 text-center bg-red-100">
                        <span className="text-red-800">
                          {weeklyTracking.reduce((sum, day) => sum + (day.vegetablesInput * day.vegetablesPrice / 1000), 0).toFixed(0)}
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
                            const saltRev = (day.saltInput * day.saltPrice / 1000)
                            const byProductRev = (day.byProductQuantity * day.byProductPrice / 1000)
                            const vegetablesCost = (day.vegetablesInput * day.vegetablesPrice / 1000)
                            const otherCost = (day.otherCosts / 1000)
                            return sum + (saltRev + byProductRev - vegetablesCost - otherCost)
                          }, 0) >= 0 ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {weeklyTracking.reduce((sum, day) => {
                            const saltRev = (day.saltInput * day.saltPrice / 1000)
                            const byProductRev = (day.byProductQuantity * day.byProductPrice / 1000)
                            const vegetablesCost = (day.vegetablesInput * day.vegetablesPrice / 1000)
                            const otherCost = (day.otherCosts / 1000)
                            return sum + (saltRev + byProductRev - vegetablesCost - otherCost)
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
                      const saltRev = (day.saltInput * day.saltPrice / 1000)
                      const byProductRev = (day.byProductQuantity * day.byProductPrice / 1000)
                      return sum + saltRev + byProductRev
                    }, 0).toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Dưa muối + Sản phẩm phụ
                  </div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <div className="text-xs text-red-600">Tổng CHI (1.000đ)</div>
                  <div className="text-lg font-bold text-red-700">
                    {weeklyTracking.reduce((sum, day) => {
                      const vegetablesCost = (day.vegetablesInput * day.vegetablesPrice / 1000)
                      const otherCosts = (day.otherCosts / 1000)
                      return sum + vegetablesCost + otherCosts
                    }, 0).toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Rau củ quả + Chi khác
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="text-xs text-blue-600">LÃI/LỖ (1.000đ)</div>
                  <div className={`text-lg font-bold ${
                    weeklyTracking.reduce((sum, day) => {
                      const saltRev = (day.saltInput * day.saltPrice / 1000)
                      const byProductRev = (day.byProductQuantity * day.byProductPrice / 1000)
                      const vegetablesCost = (day.vegetablesInput * day.vegetablesPrice / 1000)
                      const otherCost = (day.otherCosts / 1000)
                      return sum + (saltRev + byProductRev - vegetablesCost - otherCost)
                    }, 0) >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {weeklyTracking.reduce((sum, day) => {
                      const saltRev = (day.saltInput * day.saltPrice / 1000)
                      const byProductRev = (day.byProductQuantity * day.byProductPrice / 1000)
                      const vegetablesCost = (day.vegetablesInput * day.vegetablesPrice / 1000)
                      const otherCost = (day.otherCosts / 1000)
                      return sum + (saltRev + byProductRev - vegetablesCost - otherCost)
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
                        return sum + (day.vegetablesInput > 0 ? (day.saltInput / day.vegetablesInput) * 100 : 0)
                      }, 0) / weeklyTracking.filter(day => day.vegetablesInput > 0).length
                    ).toFixed(1) : '0'}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Tỷ lệ rau củ quả → dưa muối
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
            LÀM DƯA MUỐI - TỔNG HỢP THEO THÁNG
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
                  fetchMonthlySaltSummary(newMonth, selectedMonthYear)
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
                  fetchMonthlySaltSummary(selectedMonth, newYear)
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
                fetchMonthlySaltSummary(currentMonth, currentYear)
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
                  fetchMonthlySaltSummary(selectedMonth, selectedMonthYear, monthCount)
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
          {monthlySaltSummary.length === 0 ? (
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
                      <th colSpan={2} className="border border-black p-1 bg-green-50 text-sm">Dưa muối</th>
                      <th rowSpan={2} className="border border-black p-1 bg-green-50 text-sm">Sản<br/>phẩm<br/>phụ<br/>(1.000đ)</th>
                      <th colSpan={2} className="border border-black p-1 bg-red-50 text-sm">Rau củ quả</th>
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
                    {monthlySaltSummary.map((month, index) => (
                      <tr key={index} className={index === monthlySaltSummary.length - 1 ? "bg-blue-50" : ""}>
                        <td className="border border-black p-2 font-medium text-center">
                          {month.month}
                          {index === monthlySaltSummary.length - 1 && (
                            <div className="text-xs text-blue-600 mt-1">(Hiện tại)</div>
                          )}
                        </td>
                        {/* THU - Dưa muối */}
                        <td className="border border-black p-1 text-center font-semibold text-green-600">
                          {month.totalSaltCollected.toLocaleString()}
                        </td>
                        <td className="border border-black p-1 text-center font-semibold text-green-600">
                          {(month.totalSaltCollected * 12).toLocaleString()}
                        </td>
                        {/* THU - Sản phẩm phụ */}
                        <td className="border border-black p-1 text-center font-semibold text-green-600">
                          {Math.round(month.totalSaltCollected * 0.1 * 2).toLocaleString()}
                        </td>
                        {/* CHI - Rau củ quả */}
                        <td className="border border-black p-1 text-center font-semibold text-red-600">
                          {month.totalVegetablesInput.toLocaleString()}
                        </td>
                        <td className="border border-black p-1 text-center font-semibold text-red-600">
                          {(month.totalVegetablesInput * 8).toLocaleString()}
                        </td>
                        {/* CHI - Chi khác */}
                        <td className="border border-black p-1 text-center font-semibold text-red-600">
                          {Math.round(month.totalVegetablesInput * 0.02 * 1000).toLocaleString()}
                        </td>
                        {/* THU-CHI (LÃI) */}
                        <td className="border border-black p-1 text-center bg-blue-50">
                          <span className={`font-bold ${
                            ((month.totalSaltCollected * 12) + Math.round(month.totalSaltCollected * 0.1 * 2) - 
                             (month.totalVegetablesInput * 8) - Math.round(month.totalVegetablesInput * 0.02 * 1000)) >= 0 
                            ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {(
                              (month.totalSaltCollected * 12) + Math.round(month.totalSaltCollected * 0.1 * 2) - 
                              (month.totalVegetablesInput * 8) - Math.round(month.totalVegetablesInput * 0.02 * 1000)
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
              🚀 KẾT QUẢ TEST API TÍNH TOÁN DƯA MUỐI
            </CardTitle>
            <p className="text-sm text-gray-600 text-center">
              Ngày test: {testDate} • {detectionResult.found ? "✅ Có dưa muối" : "❌ Không có dưa muối"}
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
                  onClick={() => testSaltDetection(testDate)}
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
                      <div className="text-sm text-green-600 mb-1">Số món có dưa muối</div>
                      <div className="text-2xl font-bold text-green-700">
                        {detectionResult.dishesUsingSalt?.length || 0}
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
                        {detectionResult.totalSaltRequired?.toFixed(2) || 0}
                      </div>
                    </div>
                  </div>

                  {/* Dishes Using Salt */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-3">Món ăn sử dụng dưa muối:</h4>
                    <div className="space-y-2">
                      {detectionResult.dishesUsingSalt?.map((dish: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div>
                            <span className="font-medium">{dish.dishName}</span>
                            <div className="text-xs text-gray-600">
                              Bữa: {dish.mealType === 'morning' ? 'Sáng' : dish.mealType === 'noon' ? 'Trưa' : 'Tối'} | 
                              Nguyên liệu: {dish.saltIngredients?.map((ing: any) => ing.lttpName).join(", ")}
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
                              <div className="font-medium">{unit.totalSaltRequired?.toFixed(2)} kg</div>
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
                        <div>Tổng món ăn có dưa muối: <strong>{detectionResult.summary.totalDishesUsingSalt}</strong></div>
                        <div>Trung bình dưa muối/người: <strong>{detectionResult.summary.averageSaltPerPerson?.toFixed(3)} kg</strong></div>
                        <div>Ước tính rau củ quả cần: <strong>{detectionResult.summary.recommendedVegetablesInput?.toFixed(2)} kg</strong></div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">😔</div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Không tìm thấy dưa muối</h3>
                  <p className="text-gray-600">
                    Lý do: <span className="font-medium">{detectionResult.reason}</span>
                  </p>
                  <div className="mt-4 text-sm text-gray-500">
                    Có thể thực đơn ngày này không có món nào sử dụng dưa muối, hoặc chưa có thực đơn được lập.
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