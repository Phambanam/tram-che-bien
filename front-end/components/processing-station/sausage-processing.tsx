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
        note: "",
        leanMeatPrice: 0,
        fatMeatPrice: 0,
        sausagePrice: 0
      }
      
      // Get carry over from previous day
      let carryOverAmount = 0
      let carryOverNote = ""
      
      try {
        console.log(`🔄 Checking sausage carry over from ${previousDateStr} to ${dateStr}`)
        const previousStationResponse = await processingStationApi.getDailyData(previousDateStr)
        if (previousStationResponse && previousStationResponse.data) {
          const previousSausageInput = previousStationResponse.data.sausageInput || 0
          const previousSausageOutput = previousStationResponse.data.sausageOutput || 0
          carryOverAmount = Math.max(0, previousSausageInput - previousSausageOutput)
          
          if (carryOverAmount > 0) {
            carryOverNote = `\n📦 Chuyển từ ${format(previousDate, "dd/MM/yyyy")}: +${carryOverAmount}kg giò chả`
            console.log(`✅ Sausage carry over found: ${carryOverAmount}kg from ${previousDateStr}`)
          }
        }
      } catch (error) {
        console.log("No sausage carry over data from previous day:", error)
      }

      try {
        const stationResponse = await processingStationApi.getDailyData(dateStr)
        if (stationResponse && stationResponse.data) {
          stationData = {
            leanMeatInput: stationResponse.data.leanMeatInput || 0,
            fatMeatInput: stationResponse.data.fatMeatInput || 0,
            sausageInput: (stationResponse.data.sausageInput || 0) + carryOverAmount, // Add carry over
            note: (stationResponse.data.note || "") + carryOverNote, // Add carry over note
            leanMeatPrice: stationResponse.data.leanMeatPrice || 0,
            fatMeatPrice: stationResponse.data.fatMeatPrice || 0,
            sausagePrice: stationResponse.data.sausagePrice || 0
          }
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
        chaQueInput: 0, // TODO: Get from API
        chaQueOutput: 0, // TODO: Get from API
        chaQueRemaining: 0, // TODO: Calculate
        note: stationData.note,
        leanMeatPrice: stationData.leanMeatPrice,
        fatMeatPrice: stationData.fatMeatPrice,
        sausagePrice: stationData.sausagePrice,
        chaQuePrice: 140000
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

      // Refresh data
      await fetchDailySausageProcessing(new Date(dailySausageProcessing.date))
      await fetchWeeklySausageTracking()

      toast({
        title: "✅ Thành công",
        description: "Đã cập nhật dữ liệu chế biến giò chả",
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
          Quản lý chế biến thịt lợn
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
                      
                      const currentLeanMeatPrice = editingDailyData ? 
                        dailyUpdateData.leanMeatPrice || 0 :
                        dailySausageProcessing.leanMeatPrice || 0
                        
                      const currentFatMeatPrice = editingDailyData ? 
                        dailyUpdateData.fatMeatPrice || 0 :
                        dailySausageProcessing.fatMeatPrice || 0
                      
                      const currentSausageInput = editingDailyData ? dailyUpdateData.sausageInput : dailySausageProcessing.sausageInput
                      const currentLeanMeatInput = editingDailyData ? dailyUpdateData.leanMeatInput : dailySausageProcessing.leanMeatInput
                      const currentFatMeatInput = editingDailyData ? dailyUpdateData.fatMeatInput : dailySausageProcessing.fatMeatInput
                      
                      if (currentSausagePrice === 0 || (currentLeanMeatPrice === 0 && currentFatMeatPrice === 0)) {
                        return (
                          <span className="text-gray-500 text-xl">
                            Chưa có giá
                          </span>
                        )
                      }
                      
                      const sausageRevenue = currentSausageInput * currentSausagePrice
                      const meatCost = (currentLeanMeatInput * currentLeanMeatPrice) + (currentFatMeatInput * currentFatMeatPrice)
                      const dailyProfit = sausageRevenue - meatCost
                      
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
                      
                      const currentLeanMeatPrice = editingDailyData ? 
                        dailyUpdateData.leanMeatPrice || 0 :
                        dailySausageProcessing.leanMeatPrice || 0
                        
                      const currentFatMeatPrice = editingDailyData ? 
                        dailyUpdateData.fatMeatPrice || 0 :
                        dailySausageProcessing.fatMeatPrice || 0
                      
                      const currentSausageInput = editingDailyData ? dailyUpdateData.sausageInput : dailySausageProcessing.sausageInput
                      const currentLeanMeatInput = editingDailyData ? dailyUpdateData.leanMeatInput : dailySausageProcessing.leanMeatInput
                      const currentFatMeatInput = editingDailyData ? dailyUpdateData.fatMeatInput : dailySausageProcessing.fatMeatInput
                      
                      if (currentSausagePrice && (currentLeanMeatPrice || currentFatMeatPrice)) {
                        const revenue = currentSausageInput * currentSausagePrice
                        const cost = (currentLeanMeatInput * currentLeanMeatPrice) + (currentFatMeatInput * currentFatMeatPrice)
                        return (
                          <>Thu: {revenue.toLocaleString('vi-VN')}đ - Chi: {cost.toLocaleString('vi-VN')}đ{editingDailyData && " (Real-time)"}</>
                        )
                      }
                      return "Cần nhập đầy đủ giá thịt và giò chả"
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
                        const currentLeanMeatInput = dailySausageProcessing.leanMeatInput || 0
                        const currentFatMeatInput = dailySausageProcessing.fatMeatInput || 0
                        const currentSausageInput = dailySausageProcessing.sausageInput || 0
                        const currentLeanMeatPrice = dailySausageProcessing.leanMeatPrice || 120000
                        const currentFatMeatPrice = dailySausageProcessing.fatMeatPrice || 80000
                        const currentSausagePrice = dailySausageProcessing.sausagePrice || 150000
                        
                        if (currentSausagePrice && (currentLeanMeatPrice || currentFatMeatPrice)) {
                          const revenue = currentSausageInput * currentSausagePrice
                          const cost = (currentLeanMeatInput * currentLeanMeatPrice) + (currentFatMeatInput * currentFatMeatPrice)
                          const profit = revenue - cost
                          return (
                            <span className={profit >= 0 ? "text-green-600" : "text-red-600"}>
                              {profit >= 0 ? "+" : ""}{profit.toLocaleString('vi-VN')}đ
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
                        const chaQueInput = dailySausageProcessing.chaQueInput || 0
                        const chaQuePrice = dailySausageProcessing.chaQuePrice || 140000
                        // Giả sử chi phí chả quế bằng 30% thịt nạc chi (dùng chung với giò lụa)
                        const chaQueCostRatio = 0.3 // 30% thịt nạc được dùng cho chả quế
                        const leanMeatForChaQue = (dailySausageProcessing.leanMeatInput || 0) * chaQueCostRatio
                        const leanMeatPrice = dailySausageProcessing.leanMeatPrice || 120000
                        const chaQueCost = leanMeatForChaQue * leanMeatPrice
                        
                        const revenue = chaQueInput * chaQuePrice
                        const profit = revenue - chaQueCost
                        
                        return (
                          <span className={profit >= 0 ? "text-green-600" : "text-red-600"}>
                            {profit >= 0 ? "+" : ""}{profit.toLocaleString('vi-VN')}đ
                          </span>
                        )
                      })()}
                    </div>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead rowSpan={2} className="text-center align-middle border">NGÀY</TableHead>
                    <TableHead rowSpan={2} className="text-center align-middle border">TỔNG THU<br/>(1.000đ)</TableHead>
                    <TableHead colSpan={4} className="text-center border">THU</TableHead>  
                    <TableHead rowSpan={2} className="text-center align-middle border">TỔNG CHI<br/>(1.000đ)</TableHead>
                    <TableHead colSpan={3} className="text-center border">CHI</TableHead>
                    <TableHead rowSpan={2} className="text-center align-middle border">THU-CHI<br/>(LÃI)<br/>(1.000đ)</TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead colSpan={2} className="text-center border">TRONG ĐÓ</TableHead>
                    <TableHead colSpan={2} className="text-center border">TRONG ĐÓ</TableHead>
                    <TableHead colSpan={3} className="text-center border">TRONG ĐÓ</TableHead>
                  </TableRow> 
                  <TableRow>
                    <TableHead className="text-center border"></TableHead>
                    <TableHead className="text-center border"></TableHead>
                    <TableHead className="text-center border">Giò lụa<br/>Số lượng (kg)</TableHead>
                    <TableHead className="text-center border">Thành Tiền<br/>(1.000đ)</TableHead>
                    <TableHead className="text-center border">Chả quế<br/>Số lượng (kg)</TableHead>
                    <TableHead className="text-center border">Thành Tiền<br/>(1.000đ)</TableHead>
                    <TableHead className="text-center border"></TableHead>
                    <TableHead className="text-center border">Thịt nạc<br/>Số lượng (kg)</TableHead>
                    <TableHead className="text-center border">Thành Tiền<br/>(1.000đ)</TableHead>
                    <TableHead className="text-center border">Thịt mỡ<br/>Số lượng (kg)</TableHead>
                    <TableHead className="text-center border">Thành Tiền<br/>(1.000đ)</TableHead>
                    <TableHead className="text-center border">Chi khác<br/>(1.000đ)</TableHead>
                    <TableHead className="text-center border"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weeklySausageTracking && weeklySausageTracking.length > 0 ? (
                    weeklySausageTracking.map((day) => {
                      // Calculate financial values
                      const sausageRevenue = (day.sausageInput * day.sausagePrice) / 1000
                      const chaQueRevenue = (day.chaQueInput * day.chaQuePrice) / 1000
                      const totalRevenue = sausageRevenue + chaQueRevenue
                      const leanMeatCost = (day.leanMeatInput * day.leanMeatPrice) / 1000
                      const fatMeatCost = (day.fatMeatInput * day.fatMeatPrice) / 1000
                      const otherCosts = 0 // Can be expanded later
                      const totalCost = leanMeatCost + fatMeatCost + otherCosts
                      const profit = totalRevenue - totalCost

                      return (
                        <TableRow key={day.date}>
                          <TableCell className="text-center border">{format(new Date(day.date), "dd/MM")}</TableCell>
                          <TableCell className="text-center border font-bold">
                            {totalRevenue.toFixed(0)}
                          </TableCell>
                          <TableCell className="text-center border">{day.sausageInput}</TableCell>
                          <TableCell className="text-center border">{sausageRevenue.toFixed(0)}</TableCell>
                          <TableCell className="text-center border">{day.chaQueInput}</TableCell>
                          <TableCell className="text-center border">{chaQueRevenue.toFixed(0)}</TableCell>
                          <TableCell className="text-center border font-bold">
                            {totalCost.toFixed(0)}
                          </TableCell>
                          <TableCell className="text-center border">{day.leanMeatInput}</TableCell>
                          <TableCell className="text-center border">{leanMeatCost.toFixed(0)}</TableCell>
                          <TableCell className="text-center border">{day.fatMeatInput}</TableCell>
                          <TableCell className="text-center border">{fatMeatCost.toFixed(0)}</TableCell>
                          <TableCell className="text-center border">{otherCosts.toFixed(0)}</TableCell>
                          <TableCell className={`text-center border font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {profit >= 0 ? '+' : ''}{profit.toFixed(0)}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={13} className="text-center text-gray-500">
                        Không có dữ liệu cho tuần đã chọn
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead rowSpan={2} className="text-center align-middle border">THÁNG</TableHead>
                    <TableHead rowSpan={2} className="text-center align-middle border">TỔNG THU<br/>(1.000đ)</TableHead>
                    <TableHead colSpan={4} className="text-center border">THU</TableHead>  
                    <TableHead rowSpan={2} className="text-center align-middle border">TỔNG CHI<br/>(1.000đ)</TableHead>
                    <TableHead colSpan={3} className="text-center border">CHI</TableHead>
                    <TableHead rowSpan={2} className="text-center align-middle border">THU-CHI<br/>(LÃI)<br/>(1.000đ)</TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead colSpan={2} className="text-center border">TRONG ĐÓ</TableHead>
                    <TableHead colSpan={2} className="text-center border">TRONG ĐÓ</TableHead>
                    <TableHead colSpan={3} className="text-center border">TRONG ĐÓ</TableHead>
                  </TableRow> 
                  <TableRow>
                    <TableHead className="text-center border"></TableHead>
                    <TableHead className="text-center border"></TableHead>
                    <TableHead className="text-center border">Giò lụa<br/>Số lượng (kg)</TableHead>
                    <TableHead className="text-center border">Thành Tiền<br/>(1.000đ)</TableHead>
                    <TableHead className="text-center border">Chả quế<br/>Số lượng (kg)</TableHead>
                    <TableHead className="text-center border">Thành Tiền<br/>(1.000đ)</TableHead>
                    <TableHead className="text-center border"></TableHead>
                    <TableHead className="text-center border">Thịt nạc<br/>Số lượng (kg)</TableHead>
                    <TableHead className="text-center border">Thành Tiền<br/>(1.000đ)</TableHead>
                    <TableHead className="text-center border">Thịt mỡ<br/>Số lượng (kg)</TableHead>
                    <TableHead className="text-center border">Thành Tiền<br/>(1.000đ)</TableHead>
                    <TableHead className="text-center border">Chi khác<br/>(1.000đ)</TableHead>
                    <TableHead className="text-center border"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
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
                      const otherCosts = month.otherCosts / 1000
                      const totalCost = leanMeatCost + fatMeatCost + otherCosts
                      const profit = totalRevenue - totalCost

                      return (
                        <TableRow key={month.month}>
                          <TableCell className="text-center border font-medium">{month.month}</TableCell>
                          <TableCell className="text-center border font-bold">
                            {totalRevenue.toFixed(0)}
                          </TableCell>
                          <TableCell className="text-center border">{month.totalSausageInput}</TableCell>
                          <TableCell className="text-center border">{sausageRevenue.toFixed(0)}</TableCell>
                          <TableCell className="text-center border">{month.totalChaQueInput}</TableCell>
                          <TableCell className="text-center border">{chaQueRevenue.toFixed(0)}</TableCell>
                          <TableCell className="text-center border font-bold">
                            {totalCost.toFixed(0)}
                          </TableCell>
                          <TableCell className="text-center border">{month.totalLeanMeatInput}</TableCell>
                          <TableCell className="text-center border">{leanMeatCost.toFixed(0)}</TableCell>
                          <TableCell className="text-center border">{month.totalFatMeatInput}</TableCell>
                          <TableCell className="text-center border">{fatMeatCost.toFixed(0)}</TableCell>
                          <TableCell className="text-center border">{otherCosts.toFixed(0)}</TableCell>
                          <TableCell className={`text-center border font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {profit >= 0 ? '+' : ''}{profit.toFixed(0)}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={13} className="text-center text-gray-500">
                        Không có dữ liệu cho tháng đã chọn
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 