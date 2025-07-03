"use client"

import React, { useState, useEffect } from "react"
import { format, getWeek } from "date-fns"
import { vi } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bird, Calendar, TrendingUp } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { processingStationApi } from "@/lib/api-client"

interface DailyPoultryProcessing {
  date: string
  livePoultryInput: number // CHI - Gia cầm sống chi (kg)
  // Thịt gia cầm
  poultryMeatOutput: number // THU - Thịt gia cầm thu (kg)
  poultryMeatActualOutput: number // Thịt gia cầm thực tế đã xuất (kg)
  poultryMeatRemaining: number // Thịt gia cầm tồn (kg)
  
  note?: string
  // Price fields
  livePoultryPrice?: number // Giá gia cầm sống VND/kg
  poultryMeatPrice?: number // Giá thịt gia cầm VND/kg
}

interface WeeklyPoultryTracking {
  date: string
  dayOfWeek: string
  livePoultryInput: number
  poultryMeatOutput: number
  poultryMeatActualOutput: number
  poultryMeatRemaining: number
  livePoultryPrice: number
  poultryMeatPrice: number
  // Financial calculations
  revenue: number // Thu từ thịt gia cầm
  cost: number // Chi gia cầm sống
  otherCosts: number // Chi khác
  totalCost: number // Tổng chi
  profit: number // Lãi (Thu - Chi)
}

interface MonthlyPoultrySummary {
  month: string
  year: number
  monthNumber: number
  totalLivePoultryInput: number
  totalWholeChickenOutput?: number
  totalWholeChickenActualOutput?: number
  totalChickenPartsOutput?: number
  totalChickenPartsActualOutput?: number
  processingEfficiency: number
  totalRevenue: number
  poultryCost: number
  otherCosts: number
  netProfit: number
  wholeChickenBegin?: number
  wholeChickenEnd?: number
  chickenPartsBegin?: number
  chickenPartsEnd?: number
}

export function PoultryProcessing() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  // States
  const [isLoading, setIsLoading] = useState(true)
  const [dailyPoultryProcessing, setDailyPoultryProcessing] = useState<DailyPoultryProcessing>({
    date: format(new Date(), "yyyy-MM-dd"),
    livePoultryInput: 0,
    poultryMeatOutput: 0,
    poultryMeatActualOutput: 0,
    poultryMeatRemaining: 0,
    note: "",
    livePoultryPrice: 60000,
    poultryMeatPrice: 150000
  })
  
  const [editingDailyData, setEditingDailyData] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [dailyUpdateData, setDailyUpdateData] = useState({
    livePoultryInput: 0,
    poultryMeatOutput: 0,
    note: "",
    livePoultryPrice: 60000,
    poultryMeatPrice: 150000
  })

  const [weeklyPoultryTracking, setWeeklyPoultryTracking] = useState<WeeklyPoultryTracking[]>([])
  const [monthlyPoultrySummary, setMonthlyPoultrySummary] = useState<MonthlyPoultrySummary[]>([])
  
  // Helper function to get current week of year using date-fns
  const getCurrentWeekOfYear = (date: Date = new Date()) => {
    return getWeek(date, { weekStartsOn: 1 }) // ISO week (starts on Monday)
  }

  // Date selections
  const [selectedWeek, setSelectedWeek] = useState(() => getCurrentWeekOfYear())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedMonthYear, setSelectedMonthYear] = useState(new Date().getFullYear())

  // Fetch daily poultry processing data with carry over
  const fetchDailyPoultryProcessing = async (date: Date) => {
    try {
      const dateStr = format(date, "yyyy-MM-dd")
      const previousDate = new Date(date)
      previousDate.setDate(date.getDate() - 1)
      const previousDateStr = format(previousDate, "yyyy-MM-dd")
      
      // Get station manager input data
      let stationData = {
        livePoultryInput: 0,
        poultryMeatOutput: 0,
        note: "",
        livePoultryPrice: 60000,
        poultryMeatPrice: 150000
      }
      
      // Get carry over from previous day
      let carryOverAmount = 0
      let carryOverNote = ""
      
      try {
        console.log(`🔄 Checking poultry carry over from ${previousDateStr} to ${dateStr}`)
        const previousStationResponse = await processingStationApi.getDailyPoultryData(previousDateStr)
        console.log('🔍 Previous Poultry API Response:', previousStationResponse)
        
        // Fix nested structure access
        const previousData = previousStationResponse?.data?.data || previousStationResponse?.data || {}
        console.log('🔍 Previous Poultry Data Extracted:', previousData)
        
        if (previousData && Object.keys(previousData).length > 0) {
          const previousPoultryMeatOutput = previousData.poultryMeatOutput || 0
          const previousPoultryMeatActualOutput = previousData.poultryMeatActualOutput || 0
          
          // Calculate carry over for poultry meat
          carryOverAmount = Math.max(0, previousPoultryMeatOutput - previousPoultryMeatActualOutput)
          
          console.log(`🔍 Carry over calculation: Thịt gia cầm: ${previousPoultryMeatOutput} - ${previousPoultryMeatActualOutput} = ${carryOverAmount}kg`)
          
          if (carryOverAmount > 0) {
            carryOverNote = `\n📦 Chuyển từ ${format(previousDate, "dd/MM/yyyy")}: +${carryOverAmount}kg thịt gia cầm`
            console.log(`✅ Poultry carry over found: ${carryOverAmount}kg from ${previousDateStr}`)
          } else {
            console.log(`❌ No carry over: ${carryOverAmount}kg (≤ 0)`)
          }
        } else {
          console.log('❌ No previous day data found for carry over')
        }
      } catch (error) {
        console.log("No poultry carry over data from previous day:", error)
      }

      try {
        const stationResponse = await processingStationApi.getDailyPoultryData(dateStr)
        console.log('🔍 Current day Poultry API Response:', stationResponse)
        
        // Fix nested structure access for current day
        const currentData = stationResponse?.data?.data || stationResponse?.data || {}
        console.log('🔍 Current Poultry Data Extracted:', currentData)
        
        if (currentData && Object.keys(currentData).length > 0) {
          stationData = {
            livePoultryInput: currentData.livePoultryInput || 0,
            poultryMeatOutput: (currentData.poultryMeatOutput || 0) + carryOverAmount, // Add carry over
            note: (currentData.note || "") + carryOverNote, // Add carry over note
            livePoultryPrice: currentData.livePoultryPrice || 60000,
            poultryMeatPrice: currentData.poultryMeatPrice || 150000
          }
          console.log('🔍 Station data with carry over:', stationData)
        } else if (carryOverAmount > 0) {
          // If no current data but have carry over, apply it to defaults
          stationData.poultryMeatOutput = carryOverAmount
          stationData.note = carryOverNote.trim()
        }
      } catch (error) {
        console.log("No station data found for date, using defaults:", error)
        // Still apply carry over to defaults if available
        if (carryOverAmount > 0) {
          stationData.poultryMeatOutput = carryOverAmount
          stationData.note = carryOverNote.trim()
        }
      }

      // Calculate poultry meat actual output (placeholder - would normally come from API)
      const poultryMeatActualOutput = 0 // TODO: Get from supply outputs API
      
      const processedData: DailyPoultryProcessing = {
        date: dateStr,
        livePoultryInput: stationData.livePoultryInput,
        poultryMeatOutput: stationData.poultryMeatOutput,
        poultryMeatActualOutput: poultryMeatActualOutput,
        poultryMeatRemaining: Math.max(0, stationData.poultryMeatOutput - poultryMeatActualOutput),
        note: stationData.note,
        livePoultryPrice: stationData.livePoultryPrice,
        poultryMeatPrice: stationData.poultryMeatPrice
      }

      setDailyPoultryProcessing(processedData)
      setDailyUpdateData({
        livePoultryInput: processedData.livePoultryInput,
        poultryMeatOutput: processedData.poultryMeatOutput,
        note: processedData.note || "",
        livePoultryPrice: processedData.livePoultryPrice || 60000,
        poultryMeatPrice: processedData.poultryMeatPrice || 150000
      })
    } catch (error) {
      console.error("Error fetching daily poultry processing:", error)
      toast({
        title: "❌ Lỗi",
        description: "Không thể tải dữ liệu chế biến gia cầm",
        variant: "destructive"
      })
    }
  }

  // Fetch weekly poultry tracking data
  const fetchWeeklyPoultryTracking = async () => {
    try {
      const response = await processingStationApi.getWeeklyPoultryTracking({
        week: selectedWeek,
        year: selectedYear
      })

      if (response.success && response.data && response.data.dailyData) {
        setWeeklyPoultryTracking(response.data.dailyData)
      } else {
        setWeeklyPoultryTracking([])
      }
    } catch (error) {
      console.error("Error fetching weekly poultry tracking:", error)
      setWeeklyPoultryTracking([])
      toast({
        title: "❌ Lỗi",
        description: "Không thể tải dữ liệu theo tuần",
        variant: "destructive"
      })
    }
  }

  // Fetch monthly poultry summary data  
  const fetchMonthlyPoultrySummary = async () => {
    try {
      const response = await processingStationApi.getMonthlyPoultrySummary({
        month: selectedMonth,
        year: selectedMonthYear,
        monthCount: 6
      })

      if (response.success && response.data && response.data.monthlySummaries) {
        setMonthlyPoultrySummary(response.data.monthlySummaries)
      } else {
        setMonthlyPoultrySummary([])
      }
    } catch (error) {
      console.error("Error fetching monthly poultry summary:", error)
      setMonthlyPoultrySummary([])
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
      await fetchDailyPoultryProcessing(new Date())
      setIsLoading(false)
    }
    loadData()
  }, [])

  // Load weekly data when week/year changes
  useEffect(() => {
    fetchWeeklyPoultryTracking()
  }, [selectedWeek, selectedYear])

  // Load monthly data when month/year changes
  useEffect(() => {
    fetchMonthlyPoultrySummary()
  }, [selectedMonth, selectedMonthYear])

  // Update daily poultry processing data
  const updateDailyPoultryProcessing = async () => {
    if (!dailyPoultryProcessing) return

    try {
      setIsUpdating(true)

      // Update station data via API
      await processingStationApi.updateDailyPoultryData(dailyPoultryProcessing.date, {
        livePoultryInput: dailyUpdateData.livePoultryInput,
        poultryMeatOutput: dailyUpdateData.poultryMeatOutput,
        note: dailyUpdateData.note,
        livePoultryPrice: dailyUpdateData.livePoultryPrice,
        poultryMeatPrice: dailyUpdateData.poultryMeatPrice
      })

      // Refresh all data to update weekly and monthly views
      await fetchDailyPoultryProcessing(new Date(dailyPoultryProcessing.date))
      await fetchWeeklyPoultryTracking()
      await fetchMonthlyPoultrySummary()

      toast({
        title: "✅ Thành công",
        description: "Đã cập nhật dữ liệu chế biến gia cầm và làm mới tất cả tab",
      })

      setEditingDailyData(false)

    } catch (error) {
      console.error("Error updating daily poultry processing:", error)
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
        <Bird className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-blue-800">Gia cầm hải sản</h2>
        <Badge className="bg-blue-100 text-blue-800">
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
          {/* Daily Poultry Processing */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-center text-xl font-bold">
                CHẾ BIẾN GIA CẦM HẢI SẢN
              </CardTitle>
              <p className="text-sm text-gray-600 text-center">
                Bảng theo dõi ngày hiện tại - {new Date().toLocaleDateString('vi-VN')}
              </p>
            </CardHeader>
            <CardContent>
              {isLoading || !dailyPoultryProcessing ? (
                <div className="text-center py-8">Đang tải dữ liệu...</div>
              ) : (
                <div className="space-y-4">
                  {/* Lãi trong ngày */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-lg p-4">
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
                          const currentPoultryMeatPrice = editingDailyData ? 
                            dailyUpdateData.poultryMeatPrice || 0 :
                            dailyPoultryProcessing.poultryMeatPrice || 0
                          
                          const currentLivePoultryPrice = editingDailyData ? 
                            dailyUpdateData.livePoultryPrice || 0 :
                            dailyPoultryProcessing.livePoultryPrice || 0
                          
                          const currentPoultryMeatOutput = editingDailyData ? dailyUpdateData.poultryMeatOutput : dailyPoultryProcessing.poultryMeatOutput
                          const currentLivePoultryInput = editingDailyData ? dailyUpdateData.livePoultryInput : dailyPoultryProcessing.livePoultryInput
                          
                          if (currentPoultryMeatPrice === 0 || currentLivePoultryPrice === 0) {
                            return (
                              <span className="text-gray-500 text-xl">
                                Chưa có giá
                              </span>
                            )
                          }
                          
                          const revenue = currentPoultryMeatOutput * currentPoultryMeatPrice
                          const cost = currentLivePoultryInput * currentLivePoultryPrice
                          const dailyProfit = revenue - cost
                          
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
                          const currentPoultryMeatPrice = editingDailyData ? 
                            dailyUpdateData.poultryMeatPrice || 0 :
                            dailyPoultryProcessing.poultryMeatPrice || 0
                          
                          const currentLivePoultryPrice = editingDailyData ? 
                            dailyUpdateData.livePoultryPrice || 0 :
                            dailyPoultryProcessing.livePoultryPrice || 0
                          
                          const currentPoultryMeatOutput = editingDailyData ? dailyUpdateData.poultryMeatOutput : dailyPoultryProcessing.poultryMeatOutput
                          const currentLivePoultryInput = editingDailyData ? dailyUpdateData.livePoultryInput : dailyPoultryProcessing.livePoultryInput
                          
                          if (currentPoultryMeatPrice && currentLivePoultryPrice) {
                            const revenue = currentPoultryMeatOutput * currentPoultryMeatPrice
                            const cost = currentLivePoultryInput * currentLivePoultryPrice
                            return (
                              <>Thu: {revenue.toLocaleString('vi-VN')}đ - Chi: {cost.toLocaleString('vi-VN')}đ{editingDailyData && " (Real-time)"}</>
                            )
                          }
                          return "Cần nhập đầy đủ giá gia cầm sống và thịt gia cầm"
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Carry over info section */}
                  {dailyPoultryProcessing?.note?.includes("📦 Chuyển từ") && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                      <div className="flex items-center">
                        <div className="text-blue-800 text-sm">
                          <strong>🔄 Chuyển kho từ ngày trước:</strong>
                          {dailyPoultryProcessing.note.split("📦 Chuyển từ")[1]?.split("\n")[0] || ""}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Layout giống đậu phụ */}
                  <div className="space-y-6">
                    {/* Gia cầm sống chi - Input */}
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-green-700 mb-2">Gia cầm sống chi:</div>
                        <div className="text-3xl font-bold text-green-800">
                          {editingDailyData ? (
                            <Input
                              type="number"
                              value={dailyUpdateData.livePoultryInput}
                              onChange={(e) => setDailyUpdateData(prev => ({ 
                                ...prev, 
                                livePoultryInput: Number(e.target.value) || 0
                              }))}
                              className="w-24 h-12 text-center text-3xl font-bold bg-white border-green-300"
                              placeholder="0"
                            />
                          ) : (
                            <span>{dailyPoultryProcessing.livePoultryInput}</span>
                          )}
                          <span className="text-xl ml-1">kg</span>
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          (Trạm trưởng nhập tay)
                        </div>
                      </div>
                    </div>

                    {/* Grid layout cho thịt gia cầm */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <div className="text-center">
                          <div className="text-sm font-medium text-blue-700 mb-1">Thịt gia cầm thu:</div>
                          <div className="text-lg font-bold text-blue-800">
                            {editingDailyData ? (
                              <Input
                                type="number"
                                value={dailyUpdateData.poultryMeatOutput}
                                onChange={(e) => setDailyUpdateData(prev => ({ 
                                  ...prev, 
                                  poultryMeatOutput: Number(e.target.value) || 0
                                }))}
                                className="w-16 h-8 text-center text-lg font-bold bg-white border-blue-300"
                                placeholder="0"
                              />
                            ) : (
                              <span>{dailyPoultryProcessing.poultryMeatOutput}</span>
                            )}
                            <span className="text-sm ml-1">kg</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <div className="text-center">
                          <div className="text-sm font-medium text-blue-700 mb-1">Thịt gia cầm xuất:</div>
                          <div className="text-lg font-bold text-blue-800">
                            <span>{dailyPoultryProcessing.poultryMeatActualOutput}</span>
                            <span className="text-sm ml-1">kg</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <div className="text-center">
                          <div className="text-sm font-medium text-red-700 mb-1">Thịt gia cầm tồn:</div>
                          <div className="text-lg font-bold text-red-800">
                            <span>{dailyPoultryProcessing.poultryMeatRemaining}</span>
                            <span className="text-sm ml-1">kg</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price section - 2 boxes for prices */}
                  <div className="grid grid-cols-2 gap-6 mt-6">
                    {/* Giá gia cầm sống */}
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-green-700 mb-2">Giá gia cầm sống:</div>
                        <div className="text-xl font-bold text-green-800">
                          {editingDailyData ? (
                            <Input
                              type="number"
                              value={dailyUpdateData.livePoultryPrice}
                              onChange={(e) => setDailyUpdateData(prev => ({ 
                                ...prev, 
                                livePoultryPrice: Number(e.target.value) || 0
                              }))}
                              className="w-32 h-10 text-center text-xl font-bold bg-white border-green-300"
                              placeholder="0"
                            />
                          ) : (
                            <span>{(dailyPoultryProcessing.livePoultryPrice || 0).toLocaleString('vi-VN')}</span>
                          )}
                          <span className="text-sm ml-1">đ/kg</span>
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          (Trạm trưởng nhập tay)
                        </div>
                      </div>
                    </div>

                    {/* Giá thịt gia cầm */}
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-blue-700 mb-2">Giá thịt gia cầm:</div>
                        <div className="text-xl font-bold text-blue-800">
                          {editingDailyData ? (
                            <Input
                              type="number"
                              value={dailyUpdateData.poultryMeatPrice}
                              onChange={(e) => setDailyUpdateData(prev => ({ 
                                ...prev, 
                                poultryMeatPrice: Number(e.target.value) || 0
                              }))}
                              className="w-32 h-10 text-center text-xl font-bold bg-white border-blue-300"
                              placeholder="0"
                            />
                          ) : (
                            <span>{(dailyPoultryProcessing.poultryMeatPrice || 0).toLocaleString('vi-VN')}</span>
                          )}
                          <span className="text-sm ml-1">đ/kg</span>
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
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
                        placeholder="Ghi chú về quá trình chế biến gia cầm trong ngày"
                      />
                    </div>
                  )}

                  {dailyPoultryProcessing.note && !editingDailyData && (
                    <div className="bg-gray-50 p-3 rounded border">
                      <div className="text-sm font-medium text-gray-700">Ghi chú:</div>
                      <div className="text-sm text-gray-600 mt-1">{dailyPoultryProcessing.note}</div>
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
                            onClick={updateDailyPoultryProcessing}
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
                                livePoultryInput: dailyPoultryProcessing.livePoultryInput,
                                poultryMeatOutput: dailyPoultryProcessing.poultryMeatOutput,
                                note: dailyPoultryProcessing.note || "",
                                livePoultryPrice: dailyPoultryProcessing.livePoultryPrice || 60000,
                                poultryMeatPrice: dailyPoultryProcessing.poultryMeatPrice || 150000
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
                Theo dõi gia cầm theo tuần
              </CardTitle>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Tuần:</label>
                  <Input
                    type="number"
                    min={1}
                    max={53}
                    value={selectedWeek}
                    onChange={e => setSelectedWeek(Number(e.target.value))}
                    className="w-20"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Năm:</label>
                  <Input
                    type="number"
                    min={2020}
                    max={2030}
                    value={selectedYear}
                    onChange={e => setSelectedYear(Number(e.target.value))}
                    className="w-24"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="border">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center align-middle border-r bg-gray-100">NGÀY</TableHead>
                      <TableHead className="text-center align-middle border-r bg-blue-100">Gia cầm sống chi (kg)</TableHead>
                      <TableHead className="text-center align-middle border-r bg-blue-100">Thịt gia cầm thu (kg)</TableHead>
                      <TableHead className="text-center align-middle border-r bg-blue-100">Thịt gia cầm xuất (kg)</TableHead>
                      <TableHead className="text-center align-middle border-r bg-blue-100">Thịt gia cầm tồn (kg)</TableHead>
                      <TableHead className="text-center align-middle border-r bg-blue-100">Giá gia cầm sống (đ/kg)</TableHead>
                      <TableHead className="text-center align-middle border-r bg-blue-100">Giá thịt gia cầm (đ/kg)</TableHead>
                      <TableHead className="text-center align-middle border-r bg-green-100">Lãi (1.000đ)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weeklyPoultryTracking && weeklyPoultryTracking.length > 0 ? (
                      weeklyPoultryTracking.map((day) => {
                        const livePoultryInput = Number(day.livePoultryInput) || 0
                        const poultryMeatOutput = Number(day.poultryMeatOutput) || 0
                        const poultryMeatActualOutput = Number(day.poultryMeatActualOutput) || 0
                        const poultryMeatRemaining = Number(day.poultryMeatRemaining) || 0
                        const livePoultryPrice = Number(day.livePoultryPrice) || 60000
                        const poultryMeatPrice = Number(day.poultryMeatPrice) || 150000
                        // Doanh thu = xuất * giá thịt
                        const revenue = (poultryMeatActualOutput * poultryMeatPrice) / 1000
                        // Chi phí = nhập * giá sống
                        const cost = (livePoultryInput * livePoultryPrice) / 1000
                        const profit = revenue - cost
                        return (
                          <TableRow key={day.date} className="border-b">
                            <TableCell className="text-center border-r font-medium">{format(new Date(day.date), "dd/MM")}</TableCell>
                            <TableCell className="text-center text-sm">{livePoultryInput}</TableCell>
                            <TableCell className="text-center text-sm">{poultryMeatOutput}</TableCell>
                            <TableCell className="text-center text-sm">{poultryMeatActualOutput}</TableCell>
                            <TableCell className="text-center text-sm">{poultryMeatRemaining}</TableCell>
                            <TableCell className="text-center text-sm">{livePoultryPrice.toLocaleString('vi-VN')}</TableCell>
                            <TableCell className="text-center text-sm">{poultryMeatPrice.toLocaleString('vi-VN')}</TableCell>
                            <TableCell className="text-center font-semibold">
                              <span className={profit >= 0 ? "text-green-600" : "text-red-600"}>
                                {profit >= 0 ? "+" : ""}{profit.toFixed(0)}
                              </span>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                          Không có dữ liệu cho tuần đã chọn
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Tổng hợp gia cầm theo tháng
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
                <Table className="border">
                  <TableHeader>
                    <TableRow>
                      <TableHead rowSpan={3} className="text-center align-middle border-r bg-gray-100">THÁNG</TableHead>
                      <TableHead rowSpan={2} className="text-center align-middle border-r bg-blue-100">THU</TableHead>
                      <TableHead colSpan={4} className="text-center border-r bg-blue-50">GÀ NGUYÊN CON</TableHead>
                      <TableHead colSpan={4} className="text-center border-r bg-blue-50">GÀ CẮT KHÚC</TableHead>
                      <TableHead rowSpan={2} className="text-center align-middle border-r bg-red-100">CHI</TableHead>
                      <TableHead colSpan={4} className="text-center border-r bg-red-50">TRONG ĐÓ</TableHead>
                      <TableHead rowSpan={3} className="text-center align-middle bg-green-100">THU-CHI<br/>(LÃI)</TableHead>
                    </TableRow>
                    <TableRow>
                      <TableHead colSpan={2} className="text-center border-r bg-blue-50">Tồn đầu</TableHead>
                      <TableHead colSpan={2} className="text-center border-r bg-blue-50">Tồn cuối</TableHead>
                      <TableHead colSpan={2} className="text-center border-r bg-blue-50">Tồn đầu</TableHead>
                      <TableHead colSpan={2} className="text-center border-r bg-blue-50">Tồn cuối</TableHead>
                      <TableHead colSpan={2} className="text-center border-r bg-red-50">Gia cầm sống</TableHead>
                      <TableHead colSpan={2} className="text-center border-r bg-red-50">Chi khác</TableHead>
                    </TableRow>
                    <TableRow>
                      <TableHead className="text-center bg-blue-50">SL</TableHead>
                      <TableHead className="text-center bg-blue-50">SL</TableHead>
                      <TableHead className="text-center bg-blue-50">SL</TableHead>
                      <TableHead className="text-center bg-blue-50">SL</TableHead>
                      <TableHead className="text-center bg-blue-50">SL</TableHead>
                      <TableHead className="text-center bg-blue-50">SL</TableHead>
                      <TableHead className="text-center bg-blue-50">SL</TableHead>
                      <TableHead className="text-center bg-blue-50">SL</TableHead>
                      <TableHead className="text-center bg-red-50">Số lượng</TableHead>
                      <TableHead className="text-center border-r bg-red-50">Thành tiền</TableHead>
                      <TableHead className="text-center bg-red-50">Số lượng</TableHead>
                      <TableHead className="text-center border-r bg-red-50">Thành tiền</TableHead>
                      <TableHead className="text-center bg-green-100">(1.000đ)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyPoultrySummary && monthlyPoultrySummary.length > 0 ? (
                      monthlyPoultrySummary.map((month) => {
                        // Calculate financial values (assuming default prices if not provided)
                        const poultryMeatPrice = 150000 // Default price per kg
                        const livePoultryPrice = 60000 // Default price per kg

                        const poultryMeatRevenue = (month.totalWholeChickenActualOutput ?? 0 + month.totalChickenPartsActualOutput ?? 0 * poultryMeatPrice) / 1000
                        const otherRevenue = 0 // Chi khác thu
                        const totalRevenue = poultryMeatRevenue + otherRevenue
                        
                        const livePoultryCost = (month.totalLivePoultryInput * livePoultryPrice) / 1000
                        const otherCosts = Math.round(month.totalLivePoultryInput * 0.5) // 500 VND chi khác per kg
                        const totalCost = livePoultryCost + otherCosts
                        
                        const profit = totalRevenue - totalCost

                        return (
                          <TableRow key={month.month} className="border-b">
                            <TableCell className="text-center border-r font-medium">{month.month}</TableCell>
                            <TableCell className="text-center border-r font-semibold text-blue-700">{month.totalRevenue?.toFixed(0)}</TableCell>
                            {/* GÀ NGUYÊN CON */}
                            <TableCell className="text-center text-sm">{month.wholeChickenBegin ?? 0}</TableCell>
                            <TableCell className="text-center text-sm">{month.wholeChickenEnd ?? 0}</TableCell>
                            {/* GÀ CẮT KHÚC */}
                            <TableCell className="text-center text-sm">{month.chickenPartsBegin ?? 0}</TableCell>
                            <TableCell className="text-center text-sm">{month.chickenPartsEnd ?? 0}</TableCell>
                            {/* Thịt gia cầm */}
                            <TableCell className="text-center text-sm">{(month.totalWholeChickenActualOutput ?? 0) + (month.totalChickenPartsActualOutput ?? 0)}</TableCell>
                            <TableCell className="text-center text-sm">{poultryMeatRevenue.toFixed(0)}</TableCell>
                            {/* Chi khác THU */}
                            <TableCell className="text-center text-sm">0</TableCell>
                            <TableCell className="text-center border-r text-sm">0</TableCell>
                            {/* Tổng chi */}
                            <TableCell className="text-center border-r font-semibold text-red-700">{totalCost.toFixed(0)}</TableCell>
                            {/* Gia cầm sống */}
                            <TableCell className="text-center text-sm">{month.totalLivePoultryInput}</TableCell>
                            <TableCell className="text-center text-sm">{livePoultryCost.toFixed(0)}</TableCell>
                            {/* Chi khác CHI */}
                            <TableCell className="text-center text-sm">{Math.round(month.totalLivePoultryInput * 0.05)}</TableCell>
                            <TableCell className="text-center border-r text-sm">{otherCosts.toFixed(0)}</TableCell>
                            {/* Lãi */}
                            <TableCell className="text-center font-semibold">
                              <span className={profit >= 0 ? "text-green-600" : "text-red-600"}>
                                {profit >= 0 ? "+" : ""}{profit.toFixed(0)}
                              </span>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center text-gray-500 py-8">
                          Không có dữ liệu cho tháng đã chọn
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 