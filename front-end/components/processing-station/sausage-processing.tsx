"use client"

import React, { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Utensils, Calendar, TrendingUp } from "lucide-react"
import { format, getWeek } from "date-fns"
import { vi } from "date-fns/locale"
import { useAuth } from "@/components/auth/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { processingStationApi } from "@/lib/api-client"

interface DailySausageProcessing {
  date: string
  leanMeatInput: number // CHI - Thịt nạc chi
  fatMeatInput: number // CHI - Thịt mỡ chi  
  sausageInput: number // THU - Giò chả thu
  sausageOutput: number // Giò chả thực tế đã xuất
  sausageRemaining: number // Giò chả tồn
  // Chả quế fields
  chaQueInput: number // THU - Chả quế thu
  chaQueOutput: number // Chả quế thực tế đã xuất  
  chaQueRemaining: number // Chả quế tồn
  note?: string
  // Price fields
  leanMeatPrice?: number
  fatMeatPrice?: number
  sausagePrice?: number
  chaQuePrice?: number
}

interface WeeklySausageTracking {
  date: string
  dayOfWeek: string
  leanMeatInput: number
  fatMeatInput: number
  sausageInput: number
  chaQueInput: number
  sausageOutput: number
  chaQueOutput: number
  sausageRemaining: number
  chaQueRemaining: number
  leanMeatPrice: number
  fatMeatPrice: number
  sausagePrice: number
  chaQuePrice: number
  // Financial calculations
  sausageRevenue: number // Thu từ giò lụa
  chaQueRevenue: number // Thu từ chả quế
  totalRevenue: number // Tổng thu
  meatCost: number // Chi thịt nạc + thịt mỡ
  otherCosts: number // Chi khác
  totalCost: number // Tổng chi
  profit: number // Lãi (Thu - Chi)
}

interface MonthlySausageSummary {
  month: string
  year: number
  monthNumber: number
  totalLeanMeatInput: number
  totalFatMeatInput: number
  totalSausageInput: number
  totalChaQueInput: number
  totalSausageOutput: number
  totalChaQueOutput: number
  totalSausageRemaining: number
  totalChaQueRemaining: number
  processingEfficiency: number
  sausageRevenue: number
  chaQueRevenue: number
  totalRevenue: number
  meatCost: number
  otherCosts: number
  totalCost: number
  netProfit: number
}

export function SausageProcessing() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [isLoading, setIsLoading] = useState(true)
  const [dailySausageProcessing, setDailySausageProcessing] = useState<DailySausageProcessing>({
    date: format(new Date(), "yyyy-MM-dd"),
    leanMeatInput: 0,
    fatMeatInput: 0,
    sausageInput: 0,
    sausageOutput: 0,
    sausageRemaining: 0,
    chaQueInput: 0,
    chaQueOutput: 0,
    chaQueRemaining: 0,
    note: "",
    leanMeatPrice: 0,
    fatMeatPrice: 0,
    sausagePrice: 0,
    chaQuePrice: 140000
  })
  
  const [editingDailyData, setEditingDailyData] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [dailyUpdateData, setDailyUpdateData] = useState({
    leanMeatInput: 0,
    fatMeatInput: 0,
    sausageInput: 0,
    chaQueInput: 0,
    note: "",
    leanMeatPrice: 0,
    fatMeatPrice: 0,
    sausagePrice: 0,
    chaQuePrice: 0
  })

  // Weekly and Monthly tracking states
  const [weeklySausageTracking, setWeeklySausageTracking] = useState<WeeklySausageTracking[]>([])
  const [monthlySausageSummary, setMonthlySausageSummary] = useState<MonthlySausageSummary[]>([])

  // Helper function to get current week of year using date-fns
  const getCurrentWeekOfYear = (date: Date = new Date()) => {
    return getWeek(date, { weekStartsOn: 1 }) // ISO week (starts on Monday)
  }

  // Filter states
  const [selectedWeek, setSelectedWeek] = useState(() => getCurrentWeekOfYear())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedMonthYear, setSelectedMonthYear] = useState(new Date().getFullYear())

  // Fetch daily sausage processing data with carry over
  const fetchDailySausageProcessing = async (date: Date) => {
    try {
      const dateStr = format(date, "yyyy-MM-dd")
      const previousDate = new Date(date)
      previousDate.setDate(date.getDate() - 1)
      const previousDateStr = format(previousDate, "yyyy-MM-dd")
      
      // Get station manager input data
      let stationData = {
        leanMeatInput: 0,
        fatMeatInput: 0,
        sausageInput: 0,
        chaQueInput: 0,
        note: "",
        leanMeatPrice: 0,
        fatMeatPrice: 0,
        sausagePrice: 0,
        chaQuePrice: 140000
      }
      
      // Get carry over from previous day
      let carryOverAmount = 0
      let carryOverNote = ""
      
      try {
        console.log(`🔄 Checking sausage carry over from ${previousDateStr} to ${dateStr}`)
        const previousStationResponse = await processingStationApi.getDailySausageData(previousDateStr)
        console.log('🔍 Previous Sausage API Response:', previousStationResponse)
        
        // Fix nested structure access
        const previousData = previousStationResponse?.data?.data || previousStationResponse?.data || {}
        console.log('🔍 Previous Sausage Data Extracted:', previousData)
        
        if (previousData && Object.keys(previousData).length > 0) {
          const previousSausageInput = previousData.sausageInput || 0
          const previousChaQueInput = previousData.chaQueInput || 0
          const previousSausageOutput = previousData.sausageOutput || 0
          const previousChaQueOutput = previousData.chaQueOutput || 0
          
          // Calculate carry over for both sausage and cha que
          const sausageCarryOver = Math.max(0, previousSausageInput - previousSausageOutput)
          const chaQueCarryOver = Math.max(0, previousChaQueInput - previousChaQueOutput)
          carryOverAmount = sausageCarryOver + chaQueCarryOver
          
          console.log(`🔍 Carry over calculation: Giò lụa: ${previousSausageInput} - ${previousSausageOutput} = ${sausageCarryOver}kg, Chả quế: ${previousChaQueInput} - ${previousChaQueOutput} = ${chaQueCarryOver}kg`)
          
          if (carryOverAmount > 0) {
            carryOverNote = `\n📦 Chuyển từ ${format(previousDate, "dd/MM/yyyy")}: `
            if (sausageCarryOver > 0) {
              carryOverNote += `+${sausageCarryOver}kg giò lụa`
            }
            if (chaQueCarryOver > 0) {
              if (sausageCarryOver > 0) carryOverNote += ", "
              carryOverNote += `+${chaQueCarryOver}kg chả quế`
            }
            console.log(`✅ Sausage carry over found: ${carryOverAmount}kg total from ${previousDateStr}`)
          } else {
            console.log(`❌ No carry over: ${carryOverAmount}kg (≤ 0)`)
          }
        } else {
          console.log('❌ No previous day data found for carry over')
        }
      } catch (error) {
        console.log("No sausage carry over data from previous day:", error)
      }

      try {
        const stationResponse = await processingStationApi.getDailySausageData(dateStr)
        console.log('🔍 Current day Sausage API Response:', stationResponse)
        
        // Fix nested structure access for current day
        const currentData = stationResponse?.data?.data || stationResponse?.data || {}
        console.log('🔍 Current Sausage Data Extracted:', currentData)
        
        if (currentData && Object.keys(currentData).length > 0) {
          stationData = {
            leanMeatInput: currentData.leanMeatInput || 0,
            fatMeatInput: currentData.fatMeatInput || 0,
            sausageInput: (currentData.sausageInput || 0) + carryOverAmount, // Add carry over
            chaQueInput: currentData.chaQueInput || 0,
            note: (currentData.note || "") + carryOverNote, // Add carry over note
            leanMeatPrice: currentData.leanMeatPrice || 0,
            fatMeatPrice: currentData.fatMeatPrice || 0,
            sausagePrice: currentData.sausagePrice || 0,
            chaQuePrice: currentData.chaQuePrice || 140000
          }
          console.log('🔍 Station data with carry over:', stationData)
        } else if (carryOverAmount > 0) {
          // If no current data but have carry over, apply it to defaults
          stationData.sausageInput = carryOverAmount
          stationData.note = carryOverNote.trim()
        }
      } catch (error) {
        console.log("No station data found for date, using defaults:", error)
        // Still apply carry over to defaults if available
        if (carryOverAmount > 0) {
          stationData.sausageInput = carryOverAmount
          stationData.note = carryOverNote.trim()
        }
      }

      // Calculate sausage output (placeholder - would normally come from API)
      const sausageOutput = 0 // TODO: Get from supply outputs API
      
      const processedData: DailySausageProcessing = {
        date: dateStr,
        leanMeatInput: stationData.leanMeatInput,
        fatMeatInput: stationData.fatMeatInput,
        sausageInput: stationData.sausageInput,
        sausageOutput: sausageOutput,
        sausageRemaining: Math.max(0, stationData.sausageInput - sausageOutput),
        chaQueInput: stationData.chaQueInput,
        chaQueOutput: 0, // TODO: Get from supply outputs API
        chaQueRemaining: Math.max(0, stationData.chaQueInput - 0), // TODO: Calculate with real output
        note: stationData.note,
        leanMeatPrice: stationData.leanMeatPrice,
        fatMeatPrice: stationData.fatMeatPrice,
        sausagePrice: stationData.sausagePrice,
        chaQuePrice: stationData.chaQuePrice
      }

      setDailySausageProcessing(processedData)
      setDailyUpdateData({
        leanMeatInput: processedData.leanMeatInput,
        fatMeatInput: processedData.fatMeatInput,
        sausageInput: processedData.sausageInput,
        chaQueInput: processedData.chaQueInput,
        note: processedData.note || "",
        leanMeatPrice: processedData.leanMeatPrice || 0,
        fatMeatPrice: processedData.fatMeatPrice || 0,
        sausagePrice: processedData.sausagePrice || 0,
        chaQuePrice: processedData.chaQuePrice || 140000
      })
    } catch (error) {
      console.error("Error fetching daily sausage processing:", error)
      toast({
        title: "❌ Lỗi",
        description: "Không thể tải dữ liệu chế biến giò chả",
        variant: "destructive"
      })
    }
  }

  // Fetch weekly sausage tracking data
  const fetchWeeklySausageTracking = async () => {
    try {
      const response = await processingStationApi.getWeeklySausageTracking({
        week: selectedWeek,
        year: selectedYear
      })

      if (response.success && response.data && response.data.dailyData) {
        setWeeklySausageTracking(response.data.dailyData)
      } else {
        setWeeklySausageTracking([])
      }
          } catch (error) {
        console.error("Error fetching weekly sausage tracking:", error)
        setWeeklySausageTracking([])
        toast({
          title: "❌ Lỗi",
          description: "Không thể tải dữ liệu theo tuần",
          variant: "destructive"
        })
      }
  }

  // Fetch monthly sausage summary data
  const fetchMonthlySausageSummary = async () => {
    try {
      const response = await processingStationApi.getMonthlySausageSummary({
        month: selectedMonth,
        year: selectedMonthYear,
        monthCount: 6
      })

      if (response.success && response.data && response.data.monthlySummaries) {
        setMonthlySausageSummary(response.data.monthlySummaries)
      } else {
        setMonthlySausageSummary([])
      }
          } catch (error) {
        console.error("Error fetching monthly sausage summary:", error)
        setMonthlySausageSummary([])
        toast({
          title: "❌ Lỗi", 
          description: "Không thể tải dữ liệu theo tháng",
          variant: "destructive"
        })
      }
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await fetchDailySausageProcessing(new Date())
      setIsLoading(false)
    }
    loadData()
  }, [])

  // Load weekly data when week/year changes
  useEffect(() => {
    fetchWeeklySausageTracking()
  }, [selectedWeek, selectedYear])

  // Load monthly data when month/year changes
  useEffect(() => {
    fetchMonthlySausageSummary()
  }, [selectedMonth, selectedMonthYear])

  // Update daily sausage processing data
  const updateDailySausageProcessing = async () => {
    if (!dailySausageProcessing) return

    try {
      setIsUpdating(true)

      // Update station data via API
      await processingStationApi.updateDailySausageData(dailySausageProcessing.date, {
        leanMeatInput: dailyUpdateData.leanMeatInput,
        fatMeatInput: dailyUpdateData.fatMeatInput,
        sausageInput: dailyUpdateData.sausageInput,
        chaQueInput: dailyUpdateData.chaQueInput,
        note: dailyUpdateData.note,
        leanMeatPrice: dailyUpdateData.leanMeatPrice,
        fatMeatPrice: dailyUpdateData.fatMeatPrice,
        sausagePrice: dailyUpdateData.sausagePrice,
        chaQuePrice: dailyUpdateData.chaQuePrice
      })

      // Refresh all data to update weekly and monthly views
      await fetchDailySausageProcessing(new Date(dailySausageProcessing.date))
      await fetchWeeklySausageTracking()
      await fetchMonthlySausageSummary()

      toast({
        title: "✅ Thành công",
        description: "Đã cập nhật dữ liệu chế biến giò chả và làm mới tất cả tab",
      })

      setEditingDailyData(false)

    } catch (error) {
      console.error("Error updating daily sausage processing:", error)
      toast({
        title: "❌ Lỗi",
        description: "Có lỗi xảy ra khi cập nhật dữ liệu",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Utensils className="h-6 w-6 text-orange-600" />
        <h2 className="text-2xl font-bold text-orange-800">Làm giò chả</h2>
        <Badge className="bg-orange-100 text-orange-800">
          Chỉ do trạm trưởng chỉnh sửa
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

      {/* Daily Sausage Processing */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-center text-xl font-bold">
            CHẾ BIẾN GIÒ CHẢ
          </CardTitle>
          <p className="text-sm text-gray-600 text-center">
            Bảng theo dõi ngày hiện tại - {new Date().toLocaleDateString('vi-VN')}
          </p>
        </CardHeader>
        <CardContent>
          {isLoading || !dailySausageProcessing ? (
            <div className="text-center py-8">Đang tải dữ liệu...</div>
          ) : (
            <div className="space-y-4">
              {/* Lãi trong ngày */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-700 mb-2">
                    🏆 LÃI TRONG NGÀY:
                    {editingDailyData && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full ml-2">
                        Live
                      </span>
                    )}
                  </div>
                  <div className="text-3xl font-bold text-orange-900">
                    {(() => {
                      const currentSausagePrice = editingDailyData ? 
                        dailyUpdateData.sausagePrice || 0 :
                        dailySausageProcessing.sausagePrice || 0
                      
                      const currentChaQuePrice = editingDailyData ? 
                        dailyUpdateData.chaQuePrice || 0 :
                        dailySausageProcessing.chaQuePrice || 0
                      
                      const currentLeanMeatPrice = editingDailyData ? 
                        dailyUpdateData.leanMeatPrice || 0 :
                        dailySausageProcessing.leanMeatPrice || 0
                        
                      const currentFatMeatPrice = editingDailyData ? 
                        dailyUpdateData.fatMeatPrice || 0 :
                        dailySausageProcessing.fatMeatPrice || 0
                      
                      const currentSausageInput = editingDailyData ? dailyUpdateData.sausageInput : dailySausageProcessing.sausageInput
                      const currentChaQueInput = editingDailyData ? dailyUpdateData.chaQueInput : dailySausageProcessing.chaQueInput
                      const currentLeanMeatInput = editingDailyData ? dailyUpdateData.leanMeatInput : dailySausageProcessing.leanMeatInput
                      const currentFatMeatInput = editingDailyData ? dailyUpdateData.fatMeatInput : dailySausageProcessing.fatMeatInput
                      
                      if ((currentSausagePrice === 0 && currentChaQuePrice === 0) || (currentLeanMeatPrice === 0 && currentFatMeatPrice === 0)) {
                        return (
                          <span className="text-gray-500 text-xl">
                            Chưa có giá
                          </span>
                        )
                      }
                      
                      const sausageRevenue = currentSausageInput * currentSausagePrice
                      const chaQueRevenue = currentChaQueInput * currentChaQuePrice
                      const totalRevenue = sausageRevenue + chaQueRevenue
                      const meatCost = (currentLeanMeatInput * currentLeanMeatPrice) + (currentFatMeatInput * currentFatMeatPrice)
                      const dailyProfit = totalRevenue - meatCost
                      
                      return (
                        <span className={dailyProfit >= 0 ? "text-green-600" : "text-red-600"}>
                          {dailyProfit >= 0 ? "+" : ""}{dailyProfit.toLocaleString('vi-VN')}
                        </span>
                      )
                    })()}
                    <span className="text-lg ml-1">đ</span>
                  </div>
                  <div className="text-xs text-orange-600 mt-1">
                    {(() => {
                      const currentSausagePrice = editingDailyData ? 
                        dailyUpdateData.sausagePrice || 0 :
                        dailySausageProcessing.sausagePrice || 0
                      
                      const currentChaQuePrice = editingDailyData ? 
                        dailyUpdateData.chaQuePrice || 0 :
                        dailySausageProcessing.chaQuePrice || 0
                      
                      const currentLeanMeatPrice = editingDailyData ? 
                        dailyUpdateData.leanMeatPrice || 0 :
                        dailySausageProcessing.leanMeatPrice || 0
                        
                      const currentFatMeatPrice = editingDailyData ? 
                        dailyUpdateData.fatMeatPrice || 0 :
                        dailySausageProcessing.fatMeatPrice || 0
                      
                      const currentSausageInput = editingDailyData ? dailyUpdateData.sausageInput : dailySausageProcessing.sausageInput
                      const currentChaQueInput = editingDailyData ? dailyUpdateData.chaQueInput : dailySausageProcessing.chaQueInput
                      const currentLeanMeatInput = editingDailyData ? dailyUpdateData.leanMeatInput : dailySausageProcessing.leanMeatInput
                      const currentFatMeatInput = editingDailyData ? dailyUpdateData.fatMeatInput : dailySausageProcessing.fatMeatInput
                      
                      if ((currentSausagePrice || currentChaQuePrice) && (currentLeanMeatPrice || currentFatMeatPrice)) {
                        const sausageRevenue = currentSausageInput * currentSausagePrice
                        const chaQueRevenue = currentChaQueInput * currentChaQuePrice
                        const totalRevenue = sausageRevenue + chaQueRevenue
                        const cost = (currentLeanMeatInput * currentLeanMeatPrice) + (currentFatMeatInput * currentFatMeatPrice)
                        return (
                          <>Thu: {totalRevenue.toLocaleString('vi-VN')}đ (Giò lụa: {sausageRevenue.toLocaleString('vi-VN')}đ + Chả quế: {chaQueRevenue.toLocaleString('vi-VN')}đ) - Chi: {cost.toLocaleString('vi-VN')}đ{editingDailyData && " (Real-time)"}</>
                        )
                      }
                      return "Cần nhập đầy đủ giá thịt, giò lụa và chả quế"
                    })()}
                  </div>
                </div>
              </div>

              {/* Carry over info section */}
              {dailySausageProcessing?.note?.includes("📦 Chuyển từ") && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                  <div className="flex items-center">
                    <div className="text-blue-800 text-sm">
                      <strong>🔄 Chuyển kho từ ngày trước:</strong>
                      {dailySausageProcessing.note.split("📦 Chuyển từ")[1]?.split("\n")[0] || ""}
                    </div>
                  </div>
                </div>
              )}

            {/* Two section layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Giò lụa section */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-blue-800 text-center mb-4">GIÒ LỤA</h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Thịt nạc chi */}
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <div className="text-center">
                      <div className="text-sm font-medium text-green-700 mb-1">Thịt nạc chi:</div>
                      <div className="text-lg font-bold text-green-800">
                        {editingDailyData ? (
                          <Input
                            type="number"
                            value={dailyUpdateData.leanMeatInput}
                            onChange={(e) => setDailyUpdateData(prev => ({ 
                              ...prev, 
                              leanMeatInput: Number(e.target.value) || 0
                            }))}
                            className="w-16 h-8 text-center text-lg font-bold bg-white border-green-300"
                            placeholder="0"
                          />
                        ) : (
                          <span>{dailySausageProcessing.leanMeatInput}</span>
                        )}
                        <span className="text-sm ml-1">kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Thịt mỡ chi */}
                  <div className="bg-orange-50 border border-orange-200 rounded p-3">
                    <div className="text-center">
                      <div className="text-sm font-medium text-orange-700 mb-1">Thịt mỡ chi:</div>
                      <div className="text-lg font-bold text-orange-800">
                        {editingDailyData ? (
                          <Input
                            type="number"
                            value={dailyUpdateData.fatMeatInput}
                            onChange={(e) => setDailyUpdateData(prev => ({ 
                              ...prev, 
                              fatMeatInput: Number(e.target.value) || 0
                            }))}
                            className="w-16 h-8 text-center text-lg font-bold bg-white border-orange-300"
                            placeholder="0"
                          />
                        ) : (
                          <span>{dailySausageProcessing.fatMeatInput}</span>
                        )}
                        <span className="text-sm ml-1">kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Giò lụa thu */}
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <div className="text-center">
                      <div className="text-sm font-medium text-blue-700 mb-1">Giò lụa thu:</div>
                      <div className="text-lg font-bold text-blue-800">
                        {editingDailyData ? (
                          <Input
                            type="number"
                            value={dailyUpdateData.sausageInput}
                            onChange={(e) => setDailyUpdateData(prev => ({ 
                              ...prev, 
                              sausageInput: Number(e.target.value) || 0
                            }))}
                            className="w-16 h-8 text-center text-lg font-bold bg-white border-blue-300"
                            placeholder="0"
                          />
                        ) : (
                          <span>{dailySausageProcessing.sausageInput}</span>
                        )}
                        <span className="text-sm ml-1">kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Giò lụa tồn */}
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <div className="text-center">
                      <div className="text-sm font-medium text-red-700 mb-1">Giò lụa tồn:</div>
                      <div className="text-lg font-bold text-red-800">
                        <span>{dailySausageProcessing.sausageRemaining}</span>
                        <span className="text-sm ml-1">kg</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lãi trong ngày làm Giò lụa */}
                <div className="mt-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-3">
                  <div className="text-center">
                    <div className="text-sm font-medium text-green-700 mb-1">Lãi trong ngày làm Giò lụa:</div>
                    <div className="text-lg font-bold text-green-800">
                      {(() => {
                        const currentLeanMeatInput = editingDailyData ? dailyUpdateData.leanMeatInput : dailySausageProcessing.leanMeatInput || 0
                        const currentFatMeatInput = editingDailyData ? dailyUpdateData.fatMeatInput : dailySausageProcessing.fatMeatInput || 0
                        const currentSausageInput = editingDailyData ? dailyUpdateData.sausageInput : dailySausageProcessing.sausageInput || 0
                        const currentLeanMeatPrice = editingDailyData ? dailyUpdateData.leanMeatPrice : dailySausageProcessing.leanMeatPrice || 120000
                        const currentFatMeatPrice = editingDailyData ? dailyUpdateData.fatMeatPrice : dailySausageProcessing.fatMeatPrice || 80000
                        const currentSausagePrice = editingDailyData ? dailyUpdateData.sausagePrice : dailySausageProcessing.sausagePrice || 150000
                        
                        if (currentSausagePrice && (currentLeanMeatPrice || currentFatMeatPrice)) {
                          const revenue = currentSausageInput * currentSausagePrice
                          const cost = (currentLeanMeatInput * currentLeanMeatPrice) + (currentFatMeatInput * currentFatMeatPrice)
                          const profit = revenue - cost
                          return (
                            <span className={profit >= 0 ? "text-green-600" : "text-red-600"}>
                              {profit >= 0 ? "+" : ""}{profit.toLocaleString('vi-VN')}đ
                              {editingDailyData && <span className="text-xs ml-2">(Real-time)</span>}
                            </span>
                          )
                        }
                        return "0đ"
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chả quế section */}
              <div className="bg-pink-50 border-2 border-pink-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-pink-800 text-center mb-4">CHẢ QUẾ</h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Chả quế thu */}
                  <div className="bg-pink-50 border border-pink-200 rounded p-3">
                    <div className="text-center">
                      <div className="text-sm font-medium text-pink-700 mb-1">Chả quế thu:</div>
                      <div className="text-lg font-bold text-pink-800">
                        {editingDailyData ? (
                          <Input
                            type="number"
                            value={dailyUpdateData.chaQueInput}
                            onChange={(e) => setDailyUpdateData(prev => ({ 
                              ...prev, 
                              chaQueInput: Number(e.target.value) || 0
                            }))}
                            className="w-16 h-8 text-center text-lg font-bold bg-white border-pink-300"
                            placeholder="0"
                          />
                        ) : (
                          <span>{dailySausageProcessing.chaQueInput}</span>
                        )}
                        <span className="text-sm ml-1">kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Chả quế xuất */}
                  <div className="bg-amber-50 border border-amber-200 rounded p-3">
                    <div className="text-center">
                      <div className="text-sm font-medium text-amber-700 mb-1">Chả quế xuất:</div>
                      <div className="text-lg font-bold text-amber-800">
                        <span>{dailySausageProcessing.chaQueOutput}</span>
                        <span className="text-sm ml-1">kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Chả quế tồn */}
                  <div className="bg-purple-50 border border-purple-200 rounded p-3 col-span-2">
                    <div className="text-center">
                      <div className="text-sm font-medium text-purple-700 mb-1">Chả quế tồn:</div>
                      <div className="text-lg font-bold text-purple-800">
                        <span>{dailySausageProcessing.chaQueRemaining}</span>
                        <span className="text-sm ml-1">kg</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lãi của chả quế */}
                <div className="mt-4 bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-300 rounded-lg p-3">
                  <div className="text-center">
                    <div className="text-sm font-medium text-pink-700 mb-1">Lãi của chả quế:</div>
                    <div className="text-lg font-bold text-pink-800">
                      {(() => {
                        const chaQueInput = editingDailyData ? dailyUpdateData.chaQueInput : dailySausageProcessing.chaQueInput || 0
                        const chaQuePrice = editingDailyData ? dailyUpdateData.chaQuePrice : dailySausageProcessing.chaQuePrice || 140000
                        // Giả sử chi phí chả quế bằng 30% thịt nạc chi (dùng chung với giò lụa)
                        const chaQueCostRatio = 0.3 // 30% thịt nạc được dùng cho chả quế
                        const leanMeatForChaQue = (editingDailyData ? dailyUpdateData.leanMeatInput : dailySausageProcessing.leanMeatInput || 0) * chaQueCostRatio
                        const leanMeatPrice = editingDailyData ? dailyUpdateData.leanMeatPrice : dailySausageProcessing.leanMeatPrice || 120000
                        const chaQueCost = leanMeatForChaQue * leanMeatPrice
                        
                        const revenue = chaQueInput * chaQuePrice
                        const profit = revenue - chaQueCost
                        
                        return (
                          <span className={profit >= 0 ? "text-green-600" : "text-red-600"}>
                            {profit >= 0 ? "+" : ""}{profit.toLocaleString('vi-VN')}đ
                            {editingDailyData && <span className="text-xs ml-2">(Real-time)</span>}
                          </span>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Price section - 4 boxes for prices */}
            <div className="grid grid-cols-2 gap-6 mt-6">
              {/* Giá thịt nạc */}
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-sm font-medium text-orange-700 mb-2">Giá thịt nạc:</div>
                  <div className="text-xl font-bold text-orange-800">
                    {editingDailyData ? (
                      <Input
                        type="number"
                        value={dailyUpdateData.leanMeatPrice}
                        onChange={(e) => setDailyUpdateData(prev => ({ 
                          ...prev, 
                          leanMeatPrice: Number(e.target.value) || 0
                        }))}
                        className="w-32 h-10 text-center text-xl font-bold bg-white border-orange-300"
                        placeholder="0"
                      />
                    ) : (
                      <span>{(dailySausageProcessing.leanMeatPrice || 0).toLocaleString('vi-VN')}</span>
                    )}
                    <span className="text-sm ml-1">đ/kg</span>
                  </div>
                  <div className="text-xs text-orange-600 mt-1">
                    (Trạm trưởng nhập tay)
                  </div>
                </div>
              </div>

              {/* Giá thịt mỡ */}
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-sm font-medium text-yellow-700 mb-2">Giá thịt mỡ:</div>
                  <div className="text-xl font-bold text-yellow-800">
                    {editingDailyData ? (
                      <Input
                        type="number"
                        value={dailyUpdateData.fatMeatPrice}
                        onChange={(e) => setDailyUpdateData(prev => ({ 
                          ...prev, 
                          fatMeatPrice: Number(e.target.value) || 0
                        }))}
                        className="w-32 h-10 text-center text-xl font-bold bg-white border-yellow-300"
                        placeholder="0"
                      />
                    ) : (
                      <span>{(dailySausageProcessing.fatMeatPrice || 0).toLocaleString('vi-VN')}</span>
                    )}
                    <span className="text-sm ml-1">đ/kg</span>
                  </div>
                  <div className="text-xs text-yellow-600 mt-1">
                    (Trạm trưởng nhập tay)
                  </div>
                </div>
              </div>

              {/* Giá giò lụa */}
              <div className="bg-cyan-50 border-2 border-cyan-200 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-sm font-medium text-cyan-700 mb-2">Giá giò lụa:</div>
                  <div className="text-xl font-bold text-cyan-800">
                    {editingDailyData ? (
                      <Input
                        type="number"
                        value={dailyUpdateData.sausagePrice}
                        onChange={(e) => setDailyUpdateData(prev => ({ 
                          ...prev, 
                          sausagePrice: Number(e.target.value) || 0
                        }))}
                        className="w-32 h-10 text-center text-xl font-bold bg-white border-cyan-300"
                        placeholder="0"
                      />
                    ) : (
                      <span>{(dailySausageProcessing.sausagePrice || 0).toLocaleString('vi-VN')}</span>
                    )}
                    <span className="text-sm ml-1">đ/kg</span>
                  </div>
                  <div className="text-xs text-cyan-600 mt-1">
                    (Trạm trưởng nhập tay)
                  </div>
                </div>
              </div>

              {/* Giá chả quế */}
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-sm font-medium text-purple-700 mb-2">Giá chả quế:</div>
                  <div className="text-xl font-bold text-purple-800">
                    {editingDailyData ? (
                      <Input
                        type="number"
                        value={dailyUpdateData.chaQuePrice}
                        onChange={(e) => setDailyUpdateData(prev => ({ 
                          ...prev, 
                          chaQuePrice: Number(e.target.value) || 0
                        }))}
                        className="w-32 h-10 text-center text-xl font-bold bg-white border-purple-300"
                        placeholder="0"
                      />
                    ) : (
                      <span>{(dailySausageProcessing.chaQuePrice || 0).toLocaleString('vi-VN')}</span>
                    )}
                    <span className="text-sm ml-1">đ/kg</span>
                  </div>
                  <div className="text-xs text-purple-600 mt-1">
                    (Trạm trưởng nhập tay)
                  </div>
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
                  placeholder="Ghi chú về quá trình chế biến giò chả trong ngày"
                />
              </div>
            )}

            {dailySausageProcessing.note && !editingDailyData && (
              <div className="bg-gray-50 p-3 rounded border">
                <div className="text-sm font-medium text-gray-700">Ghi chú:</div>
                <div className="text-sm text-gray-600 mt-1">{dailySausageProcessing.note}</div>
              </div>
            )}

            {/* Edit Controls for Station Manager */}
            {user && (user.role === "admin" || user.role === "stationManager") && (
              <div className="pt-4 border-t">
                {!editingDailyData ? (
                  <div className="flex justify-center">
                    <Button 
                      onClick={() => setEditingDailyData(true)}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      📝 Chỉnh sửa dữ liệu ngày
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-center gap-2">
                    <Button 
                      onClick={updateDailySausageProcessing}
                      disabled={isUpdating}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      {isUpdating ? "Đang lưu..." : "💾 Lưu thay đổi"}
                    </Button>
                    <Button 
                      onClick={() => {
                        setEditingDailyData(false)
                        // Reset form data
                        setDailyUpdateData({
                          leanMeatInput: dailySausageProcessing.leanMeatInput,
                          fatMeatInput: dailySausageProcessing.fatMeatInput,
                          sausageInput: dailySausageProcessing.sausageInput,
                          chaQueInput: dailySausageProcessing.chaQueInput,
                          note: dailySausageProcessing.note || "",
                          leanMeatPrice: dailySausageProcessing.leanMeatPrice || 0,
                          fatMeatPrice: dailySausageProcessing.fatMeatPrice || 0,
                          sausagePrice: dailySausageProcessing.sausagePrice || 0,
                          chaQuePrice: dailySausageProcessing.chaQuePrice || 140000
                        })
                      }}
                      variant="outline"
                      className="border-gray-300 text-gray-700"
                    >
                      ❌ Hủy
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Info message */}
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500 text-center">
                Dữ liệu thực tế từ API. StationManager có thể chỉnh sửa dữ liệu ngày.
              </p>
            </div>
          </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Theo dõi giò chả theo tuần
              </CardTitle>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Tuần:</label>
                  <Select
                    value={selectedWeek.toString()}
                    onValueChange={(value) => setSelectedWeek(parseInt(value))}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 53 }, (_, i) => i + 1).map((week) => (
                        <SelectItem key={week} value={week.toString()}>
                          {week}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Năm:</label>
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => setSelectedYear(parseInt(value))}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 11 }, (_, i) => 2020 + i).map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-2 border-black">
                  <thead>
                    <tr>
                      <th rowSpan={3} className="border border-black p-2 bg-gray-100 font-bold">NGÀY</th>
                      <th rowSpan={3} className="border border-black p-2 bg-blue-100 font-bold">THU<br/>(1.000đ)</th>
                      <th colSpan={5} className="border border-black p-2 bg-blue-50 font-bold">TRONG ĐÓ</th>
                      <th rowSpan={3} className="border border-black p-2 bg-red-100 font-bold">CHI<br/>(1.000đ)</th>
                      <th colSpan={5} className="border border-black p-2 bg-red-50 font-bold">TRONG ĐÓ</th>
                      <th rowSpan={3} className="border border-black p-2 bg-green-100 font-bold">THU-CHI<br/>(LÃI)<br/>(1.000đ)</th>
                    </tr>
                    <tr>
                      <th colSpan={2} className="border border-black p-1 bg-blue-50 text-sm">Giò lụa</th>
                      <th colSpan={2} className="border border-black p-1 bg-blue-50 text-sm">Chả quế</th>
                      <th rowSpan={2} className="border border-black p-1 bg-blue-50 text-sm">Chi khác<br/>(kg)</th>
                      <th colSpan={2} className="border border-black p-1 bg-red-50 text-sm">Thịt nạc</th>
                      <th colSpan={2} className="border border-black p-1 bg-red-50 text-sm">Thịt mỡ</th>
                      <th rowSpan={2} className="border border-black p-1 bg-red-50 text-sm">Chi khác<br/>(1.000đ)</th>
                    </tr>
                    <tr>
                      <th className="border border-black p-1 text-xs">Số lượng<br/>(kg)</th>
                      <th className="border border-black p-1 text-xs">Thành<br/>Tiền<br/>(1.000đ)</th>
                      <th className="border border-black p-1 text-xs">Số lượng<br/>(kg)</th>
                      <th className="border border-black p-1 text-xs">Thành<br/>Tiền<br/>(1.000đ)</th>
                      <th className="border border-black p-1 text-xs">Số lượng<br/>(kg)</th>
                      <th className="border border-black p-1 text-xs">Thành<br/>Tiền<br/>(1.000đ)</th>
                      <th className="border border-black p-1 text-xs">Số lượng<br/>(kg)</th>
                      <th className="border border-black p-1 text-xs">Thành<br/>Tiền<br/>(1.000đ)</th>
                    </tr>
                  </thead>
                                  <tbody>
                    {weeklySausageTracking && weeklySausageTracking.length > 0 ? (
                      weeklySausageTracking.map((day) => {
                        // Use pre-calculated financial values from backend (already in thousands VND)
                        const sausageRevenue = day.sausageRevenue || 0
                        const chaQueRevenue = day.chaQueRevenue || 0
                        const totalRevenue = day.totalRevenue || (sausageRevenue + chaQueRevenue)
                        const meatCost = day.meatCost || 0
                        const otherCosts = day.otherCosts || 0
                        const totalCost = day.totalCost || (meatCost + otherCosts)
                        const profit = day.profit || (totalRevenue - totalCost)

                        return (
                          <tr key={day.date} className="border-b">
                            <td className="border border-black p-2 text-center font-medium">
                              {format(new Date(day.date), "dd/MM")}
                            </td>
                            <td className="border border-black p-1 text-center font-semibold text-blue-700">
                              {totalRevenue.toFixed(0)}
                            </td>
                            {/* THU - Giò lụa */}
                            <td className="border border-black p-1 text-center">{day.sausageInput}</td>
                            <td className="border border-black p-1 text-center">{sausageRevenue.toFixed(0)}</td>
                            {/* THU - Chả quế */}
                            <td className="border border-black p-1 text-center">{day.chaQueInput}</td>
                            <td className="border border-black p-1 text-center">{chaQueRevenue.toFixed(0)}</td>
                            {/* THU - Chi khác */}
                            <td className="border border-black p-1 text-center">0</td>
                            {/* CHI */}
                            <td className="border border-black p-1 text-center font-semibold text-red-700">
                              {totalCost.toFixed(0)}
                            </td>
                            {/* CHI - Thịt nạc */}
                            <td className="border border-black p-1 text-center">{day.leanMeatInput}</td>
                            <td className="border border-black p-1 text-center">{((day.leanMeatInput * day.leanMeatPrice) / 1000).toFixed(0)}</td>
                            {/* CHI - Thịt mỡ */}
                            <td className="border border-black p-1 text-center">{day.fatMeatInput}</td>
                            <td className="border border-black p-1 text-center">{((day.fatMeatInput * day.fatMeatPrice) / 1000).toFixed(0)}</td>
                            {/* CHI - Chi khác */}
                            <td className="border border-black p-1 text-center">{otherCosts.toFixed(0)}</td>
                            {/* THU-CHI (LÃI) */}
                            <td className={`border border-black p-1 text-center font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {profit >= 0 ? '+' : ''}{profit.toFixed(0)}
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={14} className="border border-black p-2 text-center text-gray-500">
                          Không có dữ liệu cho tuần đã chọn
                        </td>
                      </tr>
                    )}
                    
                    {/* Weekly Total Row */}
                    {weeklySausageTracking && weeklySausageTracking.length > 0 && (
                      <tr className="bg-gray-200 font-bold border-t-2 border-gray-400">
                        <td colSpan={1} className="border border-black p-2 text-center">TỔNG TUẦN</td>
                        <td className="border border-black p-1 text-center bg-blue-100">
                          <span className="text-blue-800">
                            {weeklySausageTracking.reduce((sum, day) => {
                              return sum + (day.totalRevenue || 0)
                            }, 0).toFixed(0)}
                          </span>
                        </td>
                        {/* THU - Giò lụa */}
                        <td className="border border-black p-1 text-center bg-blue-100">
                          <span className="text-blue-800">
                            {weeklySausageTracking.reduce((sum, day) => sum + day.sausageInput, 0)}
                          </span>
                        </td>
                        <td className="border border-black p-1 text-center bg-blue-100">
                          <span className="text-blue-800">
                            {weeklySausageTracking.reduce((sum, day) => sum + (day.sausageRevenue || 0), 0).toFixed(0)}
                          </span>
                        </td>
                        {/* THU - Chả quế */}
                        <td className="border border-black p-1 text-center bg-blue-100">
                          <span className="text-blue-800">
                            {weeklySausageTracking.reduce((sum, day) => sum + day.chaQueInput, 0)}
                          </span>
                        </td>
                        <td className="border border-black p-1 text-center bg-blue-100">
                          <span className="text-blue-800">
                            {weeklySausageTracking.reduce((sum, day) => sum + (day.chaQueRevenue || 0), 0).toFixed(0)}
                          </span>
                        </td>
                        {/* THU - Chi khác */}
                        <td className="border border-black p-1 text-center bg-blue-100">
                          <span className="text-blue-800">0</span>
                        </td>
                        {/* CHI */}
                        <td className="border border-black p-1 text-center bg-red-100">
                          <span className="text-red-800">
                            {weeklySausageTracking.reduce((sum, day) => {
                              return sum + (day.totalCost || 0)
                            }, 0).toFixed(0)}
                          </span>
                        </td>
                        {/* CHI - Thịt nạc */}
                        <td className="border border-black p-1 text-center bg-red-100">
                          <span className="text-red-800">
                            {weeklySausageTracking.reduce((sum, day) => sum + day.leanMeatInput, 0)}
                          </span>
                        </td>
                        <td className="border border-black p-1 text-center bg-red-100">
                          <span className="text-red-800">
                            {weeklySausageTracking.reduce((sum, day) => sum + ((day.leanMeatInput * day.leanMeatPrice) / 1000), 0).toFixed(0)}
                          </span>
                        </td>
                        {/* CHI - Thịt mỡ */}
                        <td className="border border-black p-1 text-center bg-red-100">
                          <span className="text-red-800">
                            {weeklySausageTracking.reduce((sum, day) => sum + day.fatMeatInput, 0)}
                          </span>
                        </td>
                        <td className="border border-black p-1 text-center bg-red-100">
                          <span className="text-red-800">
                            {weeklySausageTracking.reduce((sum, day) => sum + ((day.fatMeatInput * day.fatMeatPrice) / 1000), 0).toFixed(0)}
                          </span>
                        </td>
                        {/* CHI - Chi khác */}
                        <td className="border border-black p-1 text-center bg-red-100">
                          <span className="text-red-800">
                            {weeklySausageTracking.reduce((sum, day) => sum + (day.otherCosts || 0), 0).toFixed(0)}
                          </span>
                        </td>
                        {/* THU-CHI (LÃI) */}
                        <td className="border border-black p-1 text-center bg-green-100">
                          <span className={`font-bold ${
                            weeklySausageTracking.reduce((sum, day) => {
                              return sum + (day.profit || 0)
                            }, 0) >= 0 ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {weeklySausageTracking.reduce((sum, day) => {
                              return sum + (day.profit || 0)
                            }, 0).toFixed(0)}
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Tổng hợp giò chả theo tháng
              </CardTitle>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Tháng:</label>
                  <Select
                    value={selectedMonth.toString()}
                    onValueChange={(value) => setSelectedMonth(parseInt(value))}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <SelectItem key={month} value={month.toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Năm:</label>
                  <Select
                    value={selectedMonthYear.toString()}
                    onValueChange={(value) => setSelectedMonthYear(parseInt(value))}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 11 }, (_, i) => 2020 + i).map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-2 border-black">
                  <thead>
                    <tr>
                      <th rowSpan={3} className="border border-black p-2 bg-gray-100 font-bold">THÁNG</th>
                      <th rowSpan={3} className="border border-black p-2 bg-blue-100 font-bold">THU<br/>(1.000đ)</th>
                      <th colSpan={5} className="border border-black p-2 bg-blue-50 font-bold">TRONG ĐÓ</th>
                      <th rowSpan={3} className="border border-black p-2 bg-red-100 font-bold">CHI<br/>(1.000đ)</th>
                      <th colSpan={5} className="border border-black p-2 bg-red-50 font-bold">TRONG ĐÓ</th>
                      <th rowSpan={3} className="border border-black p-2 bg-green-100 font-bold">THU-CHI<br/>(LÃI)<br/>(1.000đ)</th>
                    </tr>
                    <tr>
                      <th colSpan={2} className="border border-black p-1 bg-blue-50 text-sm">Giò lụa</th>
                      <th colSpan={2} className="border border-black p-1 bg-blue-50 text-sm">Chả quế</th>
                      <th rowSpan={2} className="border border-black p-1 bg-blue-50 text-sm">Chi khác<br/>(kg)</th>
                      <th colSpan={2} className="border border-black p-1 bg-red-50 text-sm">Thịt nạc</th>
                      <th colSpan={2} className="border border-black p-1 bg-red-50 text-sm">Thịt mỡ</th>
                      <th rowSpan={2} className="border border-black p-1 bg-red-50 text-sm">Chi khác<br/>(1.000đ)</th>
                    </tr>
                    <tr>
                      <th className="border border-black p-1 text-xs">Số lượng<br/>(kg)</th>
                      <th className="border border-black p-1 text-xs">Thành<br/>Tiền<br/>(1.000đ)</th>
                      <th className="border border-black p-1 text-xs">Số lượng<br/>(kg)</th>
                      <th className="border border-black p-1 text-xs">Thành<br/>Tiền<br/>(1.000đ)</th>
                      <th className="border border-black p-1 text-xs">Số lượng<br/>(kg)</th>
                      <th className="border border-black p-1 text-xs">Thành<br/>Tiền<br/>(1.000đ)</th>
                      <th className="border border-black p-1 text-xs">Số lượng<br/>(kg)</th>
                      <th className="border border-black p-1 text-xs">Thành<br/>Tiền<br/>(1.000đ)</th>
                    </tr>
                  </thead>
                                  <tbody>
                    {monthlySausageSummary && monthlySausageSummary.length > 0 ? (
                      monthlySausageSummary.map((month) => {
                        // Calculate financial values (assuming default prices if not provided)
                        const sausagePrice = 150000 // Default price per kg
                        const chaQuePrice = 140000 // Default price per kg
                        const leanMeatPrice = 120000 // Default price per kg
                        const fatMeatPrice = 80000 // Default price per kg

                        const sausageRevenue = (month.totalSausageInput * sausagePrice) / 1000
                        const chaQueRevenue = (month.totalChaQueInput * chaQuePrice) / 1000
                        const totalRevenue = sausageRevenue + chaQueRevenue
                        const leanMeatCost = (month.totalLeanMeatInput * leanMeatPrice) / 1000
                        const fatMeatCost = (month.totalFatMeatInput * fatMeatPrice) / 1000
                        const otherCostsInput = (month.totalLeanMeatInput + month.totalFatMeatInput) * 0.02 // 2% other costs
                        const otherCosts = otherCostsInput * 1000 / 1000 // Convert to thousands
                        const totalCost = leanMeatCost + fatMeatCost + otherCosts
                        const profit = totalRevenue - totalCost

                        return (
                          <tr key={month.month} className="border-b">
                            <td className="border border-black p-2 text-center font-medium">{month.month}</td>
                            <td className="border border-black p-1 text-center font-semibold text-blue-700">
                              {totalRevenue.toFixed(0)}
                            </td>
                            {/* THU - Giò lụa */}
                            <td className="border border-black p-1 text-center">{month.totalSausageInput}</td>
                            <td className="border border-black p-1 text-center">{sausageRevenue.toFixed(0)}</td>
                            {/* THU - Chả quế */}
                            <td className="border border-black p-1 text-center">{month.totalChaQueInput}</td>
                            <td className="border border-black p-1 text-center">{chaQueRevenue.toFixed(0)}</td>
                            {/* THU - Chi khác */}
                            <td className="border border-black p-1 text-center">0</td>
                            {/* CHI */}
                            <td className="border border-black p-1 text-center font-semibold text-red-700">
                              {totalCost.toFixed(0)}
                            </td>
                            {/* CHI - Thịt nạc */}
                            <td className="border border-black p-1 text-center">{month.totalLeanMeatInput}</td>
                            <td className="border border-black p-1 text-center">{leanMeatCost.toFixed(0)}</td>
                            {/* CHI - Thịt mỡ */}
                            <td className="border border-black p-1 text-center">{month.totalFatMeatInput}</td>
                            <td className="border border-black p-1 text-center">{fatMeatCost.toFixed(0)}</td>
                            {/* CHI - Chi khác */}
                            <td className="border border-black p-1 text-center">{otherCosts.toFixed(0)}</td>
                            {/* THU-CHI (LÃI) */}
                            <td className={`border border-black p-1 text-center font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {profit >= 0 ? '+' : ''}{profit.toFixed(0)}
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={14} className="border border-black p-2 text-center text-gray-500">
                          Không có dữ liệu cho tháng đã chọn
                        </td>
                      </tr>
                    )}
                    
                    {/* Monthly Total Row */}
                    {monthlySausageSummary && monthlySausageSummary.length > 0 && (
                      <tr className="bg-gray-200 font-bold border-t-2 border-gray-400">
                        <td colSpan={1} className="border border-black p-2 text-center">TỔNG CỘNG</td>
                        <td className="border border-black p-1 text-center bg-blue-100">
                          <span className="text-blue-800">
                            {monthlySausageSummary.reduce((sum, month) => {
                              const sausageRevenue = (month.totalSausageInput * 150000) / 1000
                              const chaQueRevenue = (month.totalChaQueInput * 140000) / 1000
                              return sum + sausageRevenue + chaQueRevenue
                            }, 0).toFixed(0)}
                          </span>
                        </td>
                        {/* THU - Giò lụa */}
                        <td className="border border-black p-1 text-center bg-blue-100">
                          <span className="text-blue-800">
                            {monthlySausageSummary.reduce((sum, month) => sum + month.totalSausageInput, 0)}
                          </span>
                        </td>
                        <td className="border border-black p-1 text-center bg-blue-100">
                          <span className="text-blue-800">
                            {monthlySausageSummary.reduce((sum, month) => sum + (month.totalSausageInput * 150000 / 1000), 0).toFixed(0)}
                          </span>
                        </td>
                        {/* THU - Chả quế */}
                        <td className="border border-black p-1 text-center bg-blue-100">
                          <span className="text-blue-800">
                            {monthlySausageSummary.reduce((sum, month) => sum + month.totalChaQueInput, 0)}
                          </span>
                        </td>
                        <td className="border border-black p-1 text-center bg-blue-100">
                          <span className="text-blue-800">
                            {monthlySausageSummary.reduce((sum, month) => sum + (month.totalChaQueInput * 140000 / 1000), 0).toFixed(0)}
                          </span>
                        </td>
                        {/* THU - Chi khác */}
                        <td className="border border-black p-1 text-center bg-blue-100">
                          <span className="text-blue-800">0</span>
                        </td>
                        {/* CHI */}
                        <td className="border border-black p-1 text-center bg-red-100">
                          <span className="text-red-800">
                            {monthlySausageSummary.reduce((sum, month) => {
                              const leanMeatCost = (month.totalLeanMeatInput * 120000) / 1000
                              const fatMeatCost = (month.totalFatMeatInput * 80000) / 1000
                              const otherCosts = (month.totalLeanMeatInput + month.totalFatMeatInput) * 0.02 * 1000 / 1000
                              return sum + leanMeatCost + fatMeatCost + otherCosts
                            }, 0).toFixed(0)}
                          </span>
                        </td>
                        {/* CHI - Thịt nạc */}
                        <td className="border border-black p-1 text-center bg-red-100">
                          <span className="text-red-800">
                            {monthlySausageSummary.reduce((sum, month) => sum + month.totalLeanMeatInput, 0)}
                          </span>
                        </td>
                        <td className="border border-black p-1 text-center bg-red-100">
                          <span className="text-red-800">
                            {monthlySausageSummary.reduce((sum, month) => sum + (month.totalLeanMeatInput * 120000 / 1000), 0).toFixed(0)}
                          </span>
                        </td>
                        {/* CHI - Thịt mỡ */}
                        <td className="border border-black p-1 text-center bg-red-100">
                          <span className="text-red-800">
                            {monthlySausageSummary.reduce((sum, month) => sum + month.totalFatMeatInput, 0)}
                          </span>
                        </td>
                        <td className="border border-black p-1 text-center bg-red-100">
                          <span className="text-red-800">
                            {monthlySausageSummary.reduce((sum, month) => sum + (month.totalFatMeatInput * 80000 / 1000), 0).toFixed(0)}
                          </span>
                        </td>
                        {/* CHI - Chi khác */}
                        <td className="border border-black p-1 text-center bg-red-100">
                          <span className="text-red-800">
                            {monthlySausageSummary.reduce((sum, month) => sum + ((month.totalLeanMeatInput + month.totalFatMeatInput) * 0.02 * 1000 / 1000), 0).toFixed(0)}
                          </span>
                        </td>
                        {/* THU-CHI (LÃI) */}
                        <td className="border border-black p-1 text-center bg-green-100">
                          <span className={`font-bold ${
                            monthlySausageSummary.reduce((sum, month) => {
                              const sausageRevenue = (month.totalSausageInput * 150000) / 1000
                              const chaQueRevenue = (month.totalChaQueInput * 140000) / 1000
                              const totalRevenue = sausageRevenue + chaQueRevenue
                              const leanMeatCost = (month.totalLeanMeatInput * 120000) / 1000
                              const fatMeatCost = (month.totalFatMeatInput * 80000) / 1000
                              const otherCosts = (month.totalLeanMeatInput + month.totalFatMeatInput) * 0.02 * 1000 / 1000
                              const totalCost = leanMeatCost + fatMeatCost + otherCosts
                              return sum + (totalRevenue - totalCost)
                            }, 0) >= 0 ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {monthlySausageSummary.reduce((sum, month) => {
                              const sausageRevenue = (month.totalSausageInput * 150000) / 1000
                              const chaQueRevenue = (month.totalChaQueInput * 140000) / 1000
                              const totalRevenue = sausageRevenue + chaQueRevenue
                              const leanMeatCost = (month.totalLeanMeatInput * 120000) / 1000
                              const fatMeatCost = (month.totalFatMeatInput * 80000) / 1000
                              const otherCosts = (month.totalLeanMeatInput + month.totalFatMeatInput) * 0.02 * 1000 / 1000
                              const totalCost = leanMeatCost + fatMeatCost + otherCosts
                              return sum + (totalRevenue - totalCost)
                            }, 0).toFixed(0)}
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 