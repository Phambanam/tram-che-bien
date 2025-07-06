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
  poultryMeatBegin: number
  poultryMeatEnd: number
  livePoultryPrice: number
  poultryMeatPrice: number
  note: string
}

interface MonthlyPoultrySummary {
  month: string
  year: number
  monthNumber: number
  totalLivePoultryInput: number
  totalPoultryMeatOutput: number
  totalPoultryMeatActualOutput: number
  processingEfficiency: number
  poultryMeatBegin: number
  poultryMeatEnd: number
  avgLivePoultryPrice: number
  avgPoultryMeatPrice: number
  totalRevenue: number
  poultryCost: number
  otherCosts: number
  netProfit: number
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

      console.log('Weekly API Response:', response)

      if (response.success && response.data && response.data.dailyData) {
        console.log('Setting weekly data:', response.data.dailyData)
        setWeeklyPoultryTracking(response.data.dailyData)
        
        // Show info message if no data
        if (response.data.hasData === false) {
          toast({
            title: "ℹ️ Thông tin",
            description: response.data.message || "Chưa có dữ liệu cho tuần này",
            variant: "default"
          })
        }
      } else {
        console.log('No weekly data found')
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

      console.log('Monthly API Response:', response)

      if (response.success && response.data && response.data.monthlySummaries) {
        console.log('Setting monthly data:', response.data.monthlySummaries)
        setMonthlyPoultrySummary(response.data.monthlySummaries)
        
        // Show info message if no data
        if (response.data.hasData === false) {
          toast({
            title: "ℹ️ Thông tin",
            description: response.data.message || "Chưa có dữ liệu cho tháng này",
            variant: "default"
          })
        }
      } else {
        console.log('No monthly data found')
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
        poultryMeatActualOutput: dailyPoultryProcessing.poultryMeatActualOutput,
        poultryMeatRemaining: dailyPoultryProcessing.poultryMeatRemaining,
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
                          
                          // SỬA: Tính lãi dựa trên lượng sản xuất trong ngày (output) không phải actualOutput
                          const currentPoultryMeatOutput = editingDailyData ? dailyUpdateData.poultryMeatOutput : dailyPoultryProcessing.poultryMeatOutput
                          const currentLivePoultryInput = editingDailyData ? dailyUpdateData.livePoultryInput : dailyPoultryProcessing.livePoultryInput
                          
                          if (currentPoultryMeatPrice === 0 || currentLivePoultryPrice === 0) {
                            return (
                              <span className="text-gray-500 text-xl">
                                Chưa có giá
                              </span>
                            )
                          }
                          
                          // Revenue = Lượng sản xuất trong ngày × Giá (không tính tồn kho)
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
                          
                          // SỬA: Tính revenue dựa trên lượng sản xuất trong ngày
                          const currentPoultryMeatOutput = editingDailyData ? dailyUpdateData.poultryMeatOutput : dailyPoultryProcessing.poultryMeatOutput
                          const currentLivePoultryInput = editingDailyData ? dailyUpdateData.livePoultryInput : dailyPoultryProcessing.livePoultryInput
                          
                          if (currentPoultryMeatPrice && currentLivePoultryPrice) {
                            const revenue = currentPoultryMeatOutput * currentPoultryMeatPrice // Lượng sản xuất trong ngày
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
              {/* Show message if no data */}
              {weeklyPoultryTracking.every(day => day.livePoultryInput === 0 && day.poultryMeatOutput === 0) && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        <strong>Chưa có dữ liệu cho tuần {selectedWeek}/{selectedYear}</strong>
                        <br />
                        Vui lòng nhập dữ liệu chế biến gia cầm hàng ngày trong tab "Theo ngày" trước khi xem thống kê tuần.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-black">
                  <thead>
                    <tr>
                      <th className="border border-black p-2 text-center">Ngày</th>
                      <th className="border border-black p-2 text-center">Thịt gia cầm thu (kg)</th>
                      <th className="border border-black p-2 text-center">Thành tiền (1.000đ)</th>
                      <th className="border border-black p-2 text-center">Gia cầm sống chi (kg)</th>
                      <th className="border border-black p-2 text-center">Thành tiền (1.000đ)</th>
                      <th className="border border-black p-2 text-center">Lãi (1.000đ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Generate 7 days for the selected week */}
                    {(() => {
                      // Helper to get all days in week (Mon-Sun)
                      const getWeekDates = (week: number, year: number) => {
                        const simple = new Date(year, 0, 1 + (week - 1) * 7)
                        const dow = simple.getDay()
                        const monday = new Date(simple)
                        monday.setDate(simple.getDate() - ((dow + 6) % 7))
                        return Array.from({ length: 7 }, (_, i) => {
                          const d = new Date(monday)
                          d.setDate(monday.getDate() + i)
                          return d
                        })
                      }
                      const weekDates = getWeekDates(selectedWeek, selectedYear)
                      // Map backend data by date string
                      const dataByDate = Object.fromEntries(
                        weeklyPoultryTracking.map(day => [format(new Date(day.date), "yyyy-MM-dd"), day])
                      )
                      return weekDates.map((date, idx) => {
                        const dateStr = format(date, "yyyy-MM-dd")
                        const dayData = dataByDate[dateStr] || {
                          date: dateStr,
                          livePoultryInput: 0,
                          poultryMeatOutput: 0,
                          poultryMeatActualOutput: 0,
                          poultryMeatBegin: 0,
                          poultryMeatEnd: 0,
                          livePoultryPrice: 60000,
                          poultryMeatPrice: 150000,
                          note: ""
                        }
                        
                        // SỬA: Tính lãi dựa trên thu/chi trong ngày (không tính tồn kho)
                        const meatOutputKg = dayData.poultryMeatOutput || 0 // Lượng sản xuất trong ngày
                        const meatActualKg = dayData.poultryMeatActualOutput || 0 // Lượng thực tế đã bán
                        // Thu trong ngày = lượng sản xuất × giá (để tính lãi)
                        const meatRevenueForProfit = Math.round((meatOutputKg * (dayData.poultryMeatPrice || 150000)) / 1000)
                        // Hiển thị "Thu" = Thu + Tồn kho (chỉ để hiển thị)
                        const meatMoney = Math.round((meatActualKg * (dayData.poultryMeatPrice || 150000)) / 1000)
                        // Chi phí gia cầm sống
                        const inputKg = dayData.livePoultryInput || 0
                        const inputMoney = Math.round((inputKg * (dayData.livePoultryPrice || 60000)) / 1000)
                        // Lãi = Thu trong ngày - Chi trong ngày (không tính tồn kho)
                        const profit = meatRevenueForProfit - inputMoney

                        return (
                          <tr key={dateStr}>
                            <td className="border border-black p-2 text-center font-medium">
                              {format(date, "dd/MM")}
                            </td>
                            <td className="border border-black p-1 text-center">{meatOutputKg.toLocaleString()}</td>
                            <td className="border border-black p-1 text-center">{meatRevenueForProfit.toLocaleString()}</td>
                            <td className="border border-black p-1 text-center">{inputKg.toLocaleString()}</td>
                            <td className="border border-black p-1 text-center">{inputMoney.toLocaleString()}</td>
                            <td className={`border border-black p-1 text-center font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {profit >= 0 ? '+' : ''}{profit.toLocaleString()}
                            </td>
                          </tr>
                        )
                      })
                    })()}
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
                <Calendar className="h-5 w-5" />
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
              {/* Show message if no data */}
              {monthlyPoultrySummary.every(month => month.totalLivePoultryInput === 0 && month.totalPoultryMeatOutput === 0) && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        <strong>Chưa có dữ liệu cho các tháng gần đây</strong>
                        <br />
                        Vui lòng nhập dữ liệu chế biến gia cầm hàng ngày trong tab "Theo ngày" trước khi xem thống kê tháng.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-black">
                  <thead>
                    <tr>
                      <th className="border border-black p-2 text-center">Tháng</th>
                      <th className="border border-black p-2 text-center">Thịt gia cầm thu (kg)</th>
                      <th className="border border-black p-2 text-center">Thành tiền (1.000đ)</th>
                      <th className="border border-black p-2 text-center">Gia cầm sống chi (kg)</th>
                      <th className="border border-black p-2 text-center">Thành tiền (1.000đ)</th>
                      <th className="border border-black p-2 text-center">Lãi (1.000đ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Hiển thị 12 tháng trong năm, nếu thiếu thì dòng 0 */}
                    {(() => {
                      const months = Array.from({ length: 12 }, (_, i) => i + 1)
                      const dataByMonth = Object.fromEntries(
                        monthlyPoultrySummary.map(m => [m.monthNumber, m])
                      )
                      return months.map(monthNum => {
                        const m = dataByMonth[monthNum] || {
                          month: `${monthNum}/${selectedMonthYear}`,
                          totalLivePoultryInput: 0,
                          totalPoultryMeatOutput: 0,
                          totalPoultryMeatActualOutput: 0,
                          processingEfficiency: 0,
                          poultryMeatBegin: 0,
                          poultryMeatEnd: 0,
                          avgLivePoultryPrice: 60000,
                          avgPoultryMeatPrice: 150000,
                          totalRevenue: 0,
                          poultryCost: 0,
                          otherCosts: 0,
                          netProfit: 0
                        }
                        
                        // Thịt gia cầm thu (kg)
                        const meatKg = m.totalPoultryMeatOutput || 0
                        // Thành tiền (1.000đ)
                        const meatMoney = m.totalRevenue || 0
                        // Chi phí gia cầm sống
                        const inputKg = m.totalLivePoultryInput || 0
                        const inputMoney = m.poultryCost || 0
                        const profit = m.netProfit || 0

                        return (
                          <tr key={monthNum}>
                            <td className="border border-black p-2 text-center font-medium">{m.month}</td>
                            <td className="border border-black p-1 text-center">{meatKg.toLocaleString()}</td>
                            <td className="border border-black p-1 text-center">{meatMoney.toLocaleString()}</td>
                            <td className="border border-black p-1 text-center">{inputKg.toLocaleString()}</td>
                            <td className="border border-black p-1 text-center">{inputMoney.toLocaleString()}</td>
                            <td className={`border border-black p-1 text-center font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {profit >= 0 ? '+' : ''}{profit.toLocaleString()}
                            </td>
                          </tr>
                        )
                      })
                    })()}
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