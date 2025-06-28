"use client"

import React, { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Beef, Calendar, TrendingUp } from "lucide-react"
import { format, getWeek } from "date-fns"
import { vi } from "date-fns/locale"
import { useAuth } from "@/components/auth/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { processingStationApi } from "@/lib/api-client"

interface DailyLivestockProcessing {
  date: string
  liveAnimalsInput: number // CHI - Lợn sống chi
  meatOutput: number // THU - Thịt thu được
  actualMeatOutput: number // Thịt thực tế đã xuất
  meatRemaining: number // Thịt tồn
  note?: string
  // Price fields
  liveAnimalPrice?: number
  meatPrice?: number
}

interface WeeklyLivestockTracking {
  date: string
  dayOfWeek: string
  liveAnimalsInput: number
  meatOutput: number
  actualMeatOutput: number
  meatRemaining: number
  liveAnimalPrice: number
  meatPrice: number
}

interface MonthlyLivestockSummary {
  month: string
  year: number
  monthNumber: number
  totalLiveAnimalsInput: number
  totalMeatOutput: number
  totalActualMeatOutput: number
  totalMeatRemaining: number
  processingEfficiency: number
  meatRevenue: number
  livestockCost: number
  otherCosts: number
  netProfit: number
}

export function LivestockProcessing() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [isLoading, setIsLoading] = useState(true)
  const [dailyLivestockProcessing, setDailyLivestockProcessing] = useState<DailyLivestockProcessing>({
    date: format(new Date(), "yyyy-MM-dd"),
    liveAnimalsInput: 0,
    meatOutput: 0,
    actualMeatOutput: 0,
    meatRemaining: 0,
    note: "",
    liveAnimalPrice: 0,
    meatPrice: 0
  })
  
  const [editingDailyData, setEditingDailyData] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [dailyUpdateData, setDailyUpdateData] = useState({
    liveAnimalsInput: 0,
    meatOutput: 0,
    note: "",
    liveAnimalPrice: 0,
    meatPrice: 0
  })

  // Weekly and Monthly tracking states
  const [weeklyLivestockTracking, setWeeklyLivestockTracking] = useState<WeeklyLivestockTracking[]>([])
  const [monthlyLivestockSummary, setMonthlyLivestockSummary] = useState<MonthlyLivestockSummary[]>([])

  // Helper function to get current week of year using date-fns
  const getCurrentWeekOfYear = (date: Date = new Date()) => {
    return getWeek(date, { weekStartsOn: 1 }) // ISO week (starts on Monday)
  }

  // Filter states
  const [selectedWeek, setSelectedWeek] = useState(() => getCurrentWeekOfYear())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedMonthYear, setSelectedMonthYear] = useState(new Date().getFullYear())

  // Fetch daily livestock processing data with carry over
  const fetchDailyLivestockProcessing = async (date: Date) => {
    try {
      const dateStr = format(date, "yyyy-MM-dd")
      const previousDate = new Date(date)
      previousDate.setDate(date.getDate() - 1)
      const previousDateStr = format(previousDate, "yyyy-MM-dd")
      
      // Get station manager input data
      let stationData = {
        liveAnimalsInput: 0,
        meatOutput: 0,
        note: "",
        liveAnimalPrice: 0,
        meatPrice: 0
      }
      
      // Get carry over from previous day
      let carryOverAmount = 0
      let carryOverNote = ""
      
      try {
        console.log(`🔄 Checking livestock carry over from ${previousDateStr} to ${dateStr}`)
        const previousStationResponse = await processingStationApi.getDailyData(previousDateStr)
        if (previousStationResponse && previousStationResponse.data) {
          const previousMeatOutput = previousStationResponse.data.meatOutput || 0
          const previousActualMeatOutput = previousStationResponse.data.actualMeatOutput || 0
          carryOverAmount = Math.max(0, previousMeatOutput - previousActualMeatOutput)
          
          if (carryOverAmount > 0) {
            carryOverNote = `\n📦 Chuyển từ ${format(previousDate, "dd/MM/yyyy")}: +${carryOverAmount}kg thịt lợn`
            console.log(`✅ Livestock carry over found: ${carryOverAmount}kg from ${previousDateStr}`)
          }
        }
      } catch (error) {
        console.log("No livestock carry over data from previous day:", error)
      }

      try {
        const stationResponse = await processingStationApi.getDailyData(dateStr)
        if (stationResponse && stationResponse.data) {
          stationData = {
            liveAnimalsInput: stationResponse.data.liveAnimalsInput || 0,
            meatOutput: (stationResponse.data.meatOutput || 0) + carryOverAmount, // Add carry over
            note: (stationResponse.data.note || "") + carryOverNote, // Add carry over note
            liveAnimalPrice: stationResponse.data.liveAnimalPrice || 0,
            meatPrice: stationResponse.data.meatPrice || 0
          }
        } else if (carryOverAmount > 0) {
          // If no current data but have carry over, apply it to defaults
          stationData.meatOutput = carryOverAmount
          stationData.note = carryOverNote.trim()
        }
      } catch (error) {
        console.log("No station data found for date, using defaults:", error)
        // Still apply carry over to defaults if available
        if (carryOverAmount > 0) {
          stationData.meatOutput = carryOverAmount
          stationData.note = carryOverNote.trim()
        }
      }

      // Calculate actual meat output (placeholder - would normally come from API)
      const actualMeatOutput = 0 // TODO: Get from supply outputs API
      
      const processedData: DailyLivestockProcessing = {
        date: dateStr,
        liveAnimalsInput: stationData.liveAnimalsInput,
        meatOutput: stationData.meatOutput,
        actualMeatOutput: actualMeatOutput,
        meatRemaining: Math.max(0, stationData.meatOutput - actualMeatOutput),
        note: stationData.note,
        liveAnimalPrice: stationData.liveAnimalPrice,
        meatPrice: stationData.meatPrice
      }

      setDailyLivestockProcessing(processedData)
      setDailyUpdateData({
        liveAnimalsInput: processedData.liveAnimalsInput,
        meatOutput: processedData.meatOutput,
        note: processedData.note || "",
        liveAnimalPrice: processedData.liveAnimalPrice || 0,
        meatPrice: processedData.meatPrice || 0
      })
    } catch (error) {
      console.error("Error fetching daily livestock processing:", error)
      toast({
        title: "❌ Lỗi",
        description: "Không thể tải dữ liệu chế biến thịt lợn",
        variant: "destructive"
      })
    }
  }

  // Fetch weekly livestock tracking data
  const fetchWeeklyLivestockTracking = async () => {
    try {
      const response = await processingStationApi.getWeeklyLivestockTracking({
        week: selectedWeek,
        year: selectedYear
      })

      if (response.success && response.data) {
        setWeeklyLivestockTracking(response.data.dailyData)
      }
    } catch (error) {
      console.error("Error fetching weekly livestock tracking:", error)
      toast({
        title: "❌ Lỗi",
        description: "Không thể tải dữ liệu theo tuần",
        variant: "destructive"
      })
    }
  }

  // Fetch monthly livestock summary data
  const fetchMonthlyLivestockSummary = async () => {
    try {
      const response = await processingStationApi.getMonthlyLivestockSummary({
        month: selectedMonth,
        year: selectedMonthYear,
        monthCount: 6
      })

      if (response.success && response.data) {
        setMonthlyLivestockSummary(response.data.monthlySummaries)
      }
    } catch (error) {
      console.error("Error fetching monthly livestock summary:", error)
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
      await fetchDailyLivestockProcessing(new Date())
      setIsLoading(false)
    }
    loadData()
  }, [])

  // Load weekly data when week/year changes
  useEffect(() => {
    fetchWeeklyLivestockTracking()
  }, [selectedWeek, selectedYear])

  // Load monthly data when month/year changes
  useEffect(() => {
    fetchMonthlyLivestockSummary()
  }, [selectedMonth, selectedMonthYear])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Beef className="h-6 w-6 text-red-600" />
        <h2 className="text-2xl font-bold text-red-800">Giết mổ lợn</h2>
        <Badge className="bg-red-100 text-red-800">
          Quản lý phân phối thịt lợn
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

      <Card>
        <CardHeader>
          <CardTitle>Bảng tổng hợp giết mổ và phân phối thịt lợn</CardTitle>
          <p className="text-sm text-gray-600">
            Theo dõi nhập - xuất - tồn thịt và sản phẩm gia súc cho các đơn vị - {format(new Date(), "dd/MM/yyyy", { locale: vi })}
          </p>
        </CardHeader>
        <CardContent>
          {isLoading || !dailyLivestockProcessing ? (
            <div className="text-center py-8">Đang tải dữ liệu...</div>
          ) : (
            <div className="space-y-4">
              {/* Lãi trong ngày */}
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-red-700 mb-2">
                    🏆 LÃI TRONG NGÀY:
                    {editingDailyData && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full ml-2">
                        Live
                      </span>
                    )}
                  </div>
                  <div className="text-3xl font-bold text-red-900">
                    {(() => {
                      const currentMeatPrice = editingDailyData ? 
                        dailyUpdateData.meatPrice || 0 :
                        dailyLivestockProcessing.meatPrice || 0
                      
                      const currentLiveAnimalPrice = editingDailyData ? 
                        dailyUpdateData.liveAnimalPrice || 0 :
                        dailyLivestockProcessing.liveAnimalPrice || 0
                      
                      const currentMeatOutput = editingDailyData ? dailyUpdateData.meatOutput : dailyLivestockProcessing.meatOutput
                      const currentLiveAnimalsInput = editingDailyData ? dailyUpdateData.liveAnimalsInput : dailyLivestockProcessing.liveAnimalsInput
                      
                      if (currentMeatPrice === 0 || currentLiveAnimalPrice === 0) {
                        return (
                          <span className="text-gray-500 text-xl">
                            Chưa có giá
                          </span>
                        )
                      }
                      
                      const meatRevenue = currentMeatOutput * currentMeatPrice
                      const livestockCost = currentLiveAnimalsInput * currentLiveAnimalPrice
                      const dailyProfit = meatRevenue - livestockCost
                      
                      return (
                        <span className={dailyProfit >= 0 ? "text-green-600" : "text-red-600"}>
                          {dailyProfit >= 0 ? "+" : ""}{dailyProfit.toLocaleString('vi-VN')}
                        </span>
                      )
                    })()}
                    <span className="text-lg ml-1">đ</span>
                  </div>
                  <div className="text-xs text-red-600 mt-1">
                    {(() => {
                      const currentMeatPrice = editingDailyData ? 
                        dailyUpdateData.meatPrice || 0 :
                        dailyLivestockProcessing.meatPrice || 0
                      
                      const currentLiveAnimalPrice = editingDailyData ? 
                        dailyUpdateData.liveAnimalPrice || 0 :
                        dailyLivestockProcessing.liveAnimalPrice || 0
                      
                      const currentMeatOutput = editingDailyData ? dailyUpdateData.meatOutput : dailyLivestockProcessing.meatOutput
                      const currentLiveAnimalsInput = editingDailyData ? dailyUpdateData.liveAnimalsInput : dailyLivestockProcessing.liveAnimalsInput
                      
                      if (currentMeatPrice && currentLiveAnimalPrice) {
                        const revenue = currentMeatOutput * currentMeatPrice
                        const cost = currentLiveAnimalsInput * currentLiveAnimalPrice
                        return (
                          <>Thu: {revenue.toLocaleString('vi-VN')}đ - Chi: {cost.toLocaleString('vi-VN')}đ{editingDailyData && " (Real-time)"}</>
                        )
                      }
                      return "Cần nhập đầy đủ giá lợn sống và thịt lợn"
                    })()}
                  </div>
                </div>
              </div>

              {/* Carry over info section */}
              {dailyLivestockProcessing?.note?.includes("📦 Chuyển từ") && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                  <div className="flex items-center">
                    <div className="text-blue-800 text-sm">
                      <strong>🔄 Chuyển kho từ ngày trước:</strong>
                      {dailyLivestockProcessing.note.split("📦 Chuyển từ")[1]?.split("\n")[0] || ""}
                    </div>
                  </div>
                </div>
              )}

              {/* Four box layout */}
              <div className="grid grid-cols-2 gap-6">
                {/* Lợn sống chi */}
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-orange-700 mb-2">Lợn sống chi:</div>
                    <div className="text-2xl font-bold text-orange-800">
                      <span>{dailyLivestockProcessing.liveAnimalsInput}</span>
                      <span className="text-lg ml-1">con</span>
                    </div>
                    <div className="text-xs text-orange-600 mt-1">
                      (Trạm trưởng nhập tay)
                    </div>
                  </div>
                </div>

                {/* Thịt thu */}
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-green-700 mb-2">Thịt thu:</div>
                    <div className="text-2xl font-bold text-green-800">
                      <span>{dailyLivestockProcessing.meatOutput}</span>
                      <span className="text-lg ml-1">kg</span>
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      (Trạm trưởng nhập tay)
                    </div>
                  </div>
                </div>

                {/* Thịt xuất */}
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-red-700 mb-2">Thịt xuất:</div>
                    <div className="text-2xl font-bold text-red-800">
                      <span>{dailyLivestockProcessing.actualMeatOutput}</span>
                      <span className="text-lg ml-1">kg</span>
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      (Kế hoạch xuất từ đăng ký người ăn)
                    </div>
                  </div>
                </div>

                {/* Thịt tồn */}
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-purple-700 mb-2">Thịt tồn:</div>
                    <div className="text-2xl font-bold text-purple-800">
                      <span>{dailyLivestockProcessing.meatRemaining}</span>
                      <span className="text-lg ml-1">kg</span>
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      (Thu - Xuất = {dailyLivestockProcessing.meatOutput} - {dailyLivestockProcessing.actualMeatOutput})
                    </div>
                  </div>
                </div>
              </div>

              {/* Info message */}
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 text-center">
                  Dữ liệu thực tế từ API. Chức năng chỉnh sửa và phân phối thịt đang được phát triển.
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
                Theo dõi giết mổ lợn theo tuần
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
                    <TableHead>Ngày</TableHead>
                    <TableHead>Thứ</TableHead>
                    <TableHead>Lợn sống chi (con)</TableHead>
                    <TableHead>Thịt thu (kg)</TableHead>
                    <TableHead>Thịt xuất (kg)</TableHead>
                    <TableHead>Thịt tồn (kg)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weeklyLivestockTracking.length > 0 ? (
                    weeklyLivestockTracking.map((day) => (
                      <TableRow key={day.date}>
                        <TableCell>{format(new Date(day.date), "dd/MM")}</TableCell>
                        <TableCell>{day.dayOfWeek}</TableCell>
                        <TableCell>{day.liveAnimalsInput}</TableCell>
                        <TableCell>{day.meatOutput}</TableCell>
                        <TableCell>{day.actualMeatOutput}</TableCell>
                        <TableCell>{day.meatRemaining}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500">
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
                Tổng hợp giết mổ lợn theo tháng
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
                    <TableHead>Tháng</TableHead>
                    <TableHead>Lợn sống (con)</TableHead>
                    <TableHead>Thịt thu (kg)</TableHead>
                    <TableHead>Thịt xuất (kg)</TableHead>
                    <TableHead>Hiệu suất (%)</TableHead>
                    <TableHead>Lãi ròng (đ)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyLivestockSummary.length > 0 ? (
                    monthlyLivestockSummary.map((month) => (
                      <TableRow key={month.month}>
                        <TableCell>{month.month}</TableCell>
                        <TableCell>{month.totalLiveAnimalsInput}</TableCell>
                        <TableCell>{month.totalMeatOutput}</TableCell>
                        <TableCell>{month.totalActualMeatOutput}</TableCell>
                        <TableCell>{month.processingEfficiency}%</TableCell>
                        <TableCell className={month.netProfit >= 0 ? "text-green-600" : "text-red-600"}>
                          {month.netProfit >= 0 ? "+" : ""}{month.netProfit.toLocaleString('vi-VN')}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500">
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