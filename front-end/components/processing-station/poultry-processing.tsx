"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bird, Calendar, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
}

interface MonthlyPoultrySummary {
  month: string
  year: number
  monthNumber: number
  totalLivePoultryInput: number
  totalPoultryMeatOutput: number
  totalPoultryMeatActualOutput: number
  processingEfficiency: number
  totalRevenue: number
  poultryCost: number
  otherCosts: number
  netProfit: number
}

export function PoultryProcessing() {
  const { toast } = useToast()
  
  // States
  const [isLoading, setIsLoading] = useState(false)
  const [dailyPoultryProcessing, setDailyPoultryProcessing] = useState<DailyPoultryProcessing | null>(null)
  const [weeklyPoultryTracking, setWeeklyPoultryTracking] = useState<WeeklyPoultryTracking[]>([])
  const [monthlyPoultrySummary, setMonthlyPoultrySummary] = useState<MonthlyPoultrySummary[]>([])
  
  // Date selections
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeekOfYear())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedMonthYear, setSelectedMonthYear] = useState(new Date().getFullYear())
  
  function getCurrentWeekOfYear(date: Date = new Date()) {
    const startDate = new Date(date.getFullYear(), 0, 1)
    const days = Math.floor((date.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
    return Math.ceil(days / 7)
  }

  // Fetch daily poultry processing data
  const fetchDailyPoultryProcessing = async (date: Date) => {
    try {
      setIsLoading(true)
      const dateStr = format(date, "yyyy-MM-dd")
      
      // Default data structure - sẽ được thay thế bằng API calls
      const defaultData: DailyPoultryProcessing = {
        date: dateStr,
        livePoultryInput: 50, // kg gia cầm sống
        poultryMeatOutput: 35, // kg thịt gia cầm thu được
        poultryMeatActualOutput: 30, // kg thịt thực tế đã xuất
        poultryMeatRemaining: 5, // kg thịt tồn
        note: "Dữ liệu mẫu cho gia cầm hải sản",
        livePoultryPrice: 60000, // 60k VND/kg
        poultryMeatPrice: 150000 // 150k VND/kg
      }
      
      setDailyPoultryProcessing(defaultData)
      
    } catch (error) {
      console.error("Error fetching daily poultry processing data:", error)
      toast({
        title: "❌ Lỗi",
        description: "Không thể tải dữ liệu chế biến gia cầm",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch weekly poultry tracking data
  const fetchWeeklyPoultryTracking = async () => {
    try {
      // Sample data - sẽ được thay thế bằng API
      const sampleWeeklyData: WeeklyPoultryTracking[] = [
        {
          date: "2025-01-13",
          dayOfWeek: "Thứ 2",
          livePoultryInput: 45,
          poultryMeatOutput: 32,
          poultryMeatActualOutput: 30,
          poultryMeatRemaining: 2,
          livePoultryPrice: 60000,
          poultryMeatPrice: 150000
        },
        {
          date: "2025-01-14", 
          dayOfWeek: "Thứ 3",
          livePoultryInput: 50,
          poultryMeatOutput: 35,
          poultryMeatActualOutput: 33,
          poultryMeatRemaining: 2,
          livePoultryPrice: 60000,
          poultryMeatPrice: 150000
        }
      ]
      
      setWeeklyPoultryTracking(sampleWeeklyData)
      
    } catch (error) {
      console.error("Error fetching weekly poultry tracking:", error)
      setWeeklyPoultryTracking([])
    }
  }

  // Fetch monthly poultry summary data  
  const fetchMonthlyPoultrySummary = async () => {
    try {
      // Sample data - sẽ được thay thế bằng API
      const sampleMonthlyData: MonthlyPoultrySummary[] = [
        {
          month: "01/2025",
          year: 2025,
          monthNumber: 1,
          totalLivePoultryInput: 1200,
          totalPoultryMeatOutput: 850,
          totalPoultryMeatActualOutput: 800,
          processingEfficiency: 67, // (850/1200)*100
          totalRevenue: 120000000, // 800kg * 150k
          poultryCost: 72000000, // 1200kg * 60k  
          otherCosts: 6000000, // 5% other costs
          netProfit: 42000000 // 120M - 72M - 6M
        }
      ]
      
      setMonthlyPoultrySummary(sampleMonthlyData)
      
    } catch (error) {
      console.error("Error fetching monthly poultry summary:", error)
      setMonthlyPoultrySummary([])
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

  useEffect(() => {
    fetchWeeklyPoultryTracking()
  }, [selectedWeek, selectedYear])

  useEffect(() => {
    fetchMonthlyPoultrySummary()
  }, [selectedMonth, selectedMonthYear])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Bird className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-blue-800">Gia cầm hải sản</h2>
        <Badge className="bg-blue-100 text-blue-800">
          Quản lý chế biến gia cầm
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
              <CardTitle>Bảng tổng hợp chế biến gia cầm hải sản</CardTitle>
              <p className="text-sm text-gray-600">
                Theo dõi nhập - xuất - tồn gia cầm cho các đơn vị - {format(new Date(), "dd/MM/yyyy", { locale: vi })}
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
                      </div>
                      <div className="text-3xl font-bold text-blue-900">
                        {(() => {
                          const revenue = dailyPoultryProcessing.poultryMeatActualOutput * (dailyPoultryProcessing.poultryMeatPrice || 0)
                          const cost = dailyPoultryProcessing.livePoultryInput * (dailyPoultryProcessing.livePoultryPrice || 0)
                          const profit = revenue - cost
                          
                          return (
                            <span className={profit >= 0 ? "text-green-600" : "text-red-600"}>
                              {profit >= 0 ? "+" : ""}{profit.toLocaleString('vi-VN')}
                            </span>
                          )
                        })()}
                        <span className="text-lg ml-1">đ</span>
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        Thu: {((dailyPoultryProcessing.poultryMeatActualOutput || 0) * (dailyPoultryProcessing.poultryMeatPrice || 0)).toLocaleString('vi-VN')}đ - 
                        Chi: {((dailyPoultryProcessing.livePoultryInput || 0) * (dailyPoultryProcessing.livePoultryPrice || 0)).toLocaleString('vi-VN')}đ
                      </div>
                    </div>
                  </div>

                  {/* Layout giống đậu phụ */}
                  <div className="space-y-6">
                    {/* Gia cầm sống chi - Input */}
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-green-700 mb-2">Gia cầm sống chi:</div>
                        <div className="text-3xl font-bold text-green-800">
                          <span>{dailyPoultryProcessing.livePoultryInput}</span>
                          <span className="text-xl ml-1">kg</span>
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          (Số liệu từ bảng theo dõi tuần)
                        </div>
                      </div>
                    </div>

                    {/* Grid layout cho thịt gia cầm */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <div className="text-center">
                          <div className="text-sm font-medium text-blue-700 mb-1">Thịt gia cầm thu:</div>
                          <div className="text-lg font-bold text-blue-800">
                            <span>{dailyPoultryProcessing.poultryMeatOutput}</span>
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
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <div className="text-center">
                          <div className="text-sm font-medium text-blue-700 mb-1">Thịt gia cầm tồn:</div>
                          <div className="text-lg font-bold text-blue-800">
                            <span>{dailyPoultryProcessing.poultryMeatRemaining}</span>
                            <span className="text-sm ml-1">kg</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info message */}
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-500 text-center">
                      Dữ liệu mẫu cho gia cầm hải sản. API đang được phát triển.
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
                <Table className="border">
                  <TableHeader>
                    <TableRow>
                      <TableHead rowSpan={2} className="text-center align-middle border-r bg-gray-100">NGÀY</TableHead>
                      <TableHead rowSpan={2} className="text-center align-middle border-r bg-blue-100">TỔNG<br/>THU<br/>(1.000đ)</TableHead>
                      <TableHead colSpan={3} className="text-center border-r bg-blue-50">THU - TRONG ĐÓ</TableHead>
                      <TableHead rowSpan={2} className="text-center align-middle border-r bg-red-100">TỔNG<br/>CHI<br/>(1.000đ)</TableHead>
                      <TableHead colSpan={3} className="text-center border-r bg-red-50">CHI - TRONG ĐÓ</TableHead>
                      <TableHead rowSpan={2} className="text-center align-middle bg-green-100">THU-CHI<br/>(LÃI)<br/>(1.000đ)</TableHead>
                    </TableRow>
                    <TableRow>
                      <TableHead className="text-center bg-blue-50 text-xs">Thịt gia cầm<br/>(kg)</TableHead>
                      <TableHead className="text-center bg-blue-50 text-xs">Thành tiền<br/>(1.000đ)</TableHead>
                      <TableHead className="text-center bg-blue-50 border-r text-xs">Chi khác<br/>(kg)</TableHead>
                      <TableHead className="text-center bg-red-50 text-xs">Gia cầm sống<br/>(kg)</TableHead>
                      <TableHead className="text-center bg-red-50 text-xs">Thành tiền<br/>(1.000đ)</TableHead>
                      <TableHead className="text-center bg-red-50 border-r text-xs">Chi khác<br/>(1.000đ)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weeklyPoultryTracking && weeklyPoultryTracking.length > 0 ? (
                      weeklyPoultryTracking.map((day) => {
                        const totalRevenue = day.poultryMeatActualOutput * day.poultryMeatPrice
                        const totalCost = day.livePoultryInput * day.livePoultryPrice
                        const otherCosts = Math.round(day.livePoultryInput * 1000) // 1000 VND other costs per kg
                        const totalExpense = totalCost + otherCosts
                        const profit = totalRevenue - totalExpense

                        return (
                          <TableRow key={day.date} className="border-b">
                            <TableCell className="text-center border-r font-medium">{format(new Date(day.date), "dd/MM")}</TableCell>
                            <TableCell className="text-center border-r font-semibold text-blue-700">{Math.round(totalRevenue / 1000)}</TableCell>
                            {/* Thịt gia cầm */}
                            <TableCell className="text-center text-sm">{day.poultryMeatActualOutput}</TableCell>
                            <TableCell className="text-center text-sm">{Math.round((day.poultryMeatActualOutput * day.poultryMeatPrice) / 1000)}</TableCell>
                            <TableCell className="text-center border-r text-sm">0</TableCell>
                            {/* Tổng chi */}
                            <TableCell className="text-center border-r font-semibold text-red-700">{Math.round(totalExpense / 1000)}</TableCell>
                            {/* Gia cầm sống */}
                            <TableCell className="text-center text-sm">{day.livePoultryInput}</TableCell>
                            <TableCell className="text-center text-sm">{Math.round(totalCost / 1000)}</TableCell>
                            <TableCell className="text-center border-r text-sm">{Math.round(otherCosts / 1000)}</TableCell>
                            {/* Lãi */}
                            <TableCell className="text-center font-semibold">
                              <span className={profit >= 0 ? "text-green-600" : "text-red-600"}>
                                {profit >= 0 ? "+" : ""}{Math.round(profit / 1000)}
                              </span>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-gray-500 py-8">
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
                      <TableHead rowSpan={2} className="text-center align-middle border-r bg-gray-100">THÁNG</TableHead>
                      <TableHead rowSpan={2} className="text-center align-middle border-r bg-blue-100">TỔNG<br/>THU<br/>(1.000đ)</TableHead>
                      <TableHead colSpan={3} className="text-center border-r bg-blue-50">THU - TRONG ĐÓ</TableHead>
                      <TableHead rowSpan={2} className="text-center align-middle border-r bg-red-100">TỔNG<br/>CHI<br/>(1.000đ)</TableHead>
                      <TableHead colSpan={3} className="text-center border-r bg-red-50">CHI - TRONG ĐÓ</TableHead>
                      <TableHead rowSpan={2} className="text-center align-middle bg-green-100">THU-CHI<br/>(LÃI)<br/>(1.000đ)</TableHead>
                    </TableRow>
                    <TableRow>
                      <TableHead className="text-center bg-blue-50 text-xs">Thịt gia cầm<br/>(kg)</TableHead>
                      <TableHead className="text-center bg-blue-50 text-xs">Thành tiền<br/>(1.000đ)</TableHead>
                      <TableHead className="text-center bg-blue-50 border-r text-xs">Chi khác<br/>(kg)</TableHead>
                      <TableHead className="text-center bg-red-50 text-xs">Gia cầm sống<br/>(kg)</TableHead>
                      <TableHead className="text-center bg-red-50 text-xs">Thành tiền<br/>(1.000đ)</TableHead>
                      <TableHead className="text-center bg-red-50 border-r text-xs">Chi khác<br/>(1.000đ)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyPoultrySummary && monthlyPoultrySummary.length > 0 ? (
                      monthlyPoultrySummary.map((month) => (
                        <TableRow key={month.month} className="border-b">
                          <TableCell className="text-center border-r font-medium">{month.month}</TableCell>
                          <TableCell className="text-center border-r font-semibold text-blue-700">{Math.round(month.totalRevenue / 1000)}</TableCell>
                          {/* Thịt gia cầm */}
                          <TableCell className="text-center text-sm">{month.totalPoultryMeatActualOutput}</TableCell>
                          <TableCell className="text-center text-sm">{Math.round((month.totalPoultryMeatActualOutput * 150000) / 1000)}</TableCell>
                          <TableCell className="text-center border-r text-sm">0</TableCell>
                          {/* Tổng chi */}
                          <TableCell className="text-center border-r font-semibold text-red-700">{Math.round((month.poultryCost + month.otherCosts) / 1000)}</TableCell>
                          {/* Gia cầm sống */}
                          <TableCell className="text-center text-sm">{month.totalLivePoultryInput}</TableCell>
                          <TableCell className="text-center text-sm">{Math.round(month.poultryCost / 1000)}</TableCell>
                          <TableCell className="text-center border-r text-sm">{Math.round(month.otherCosts / 1000)}</TableCell>
                          {/* Lãi */}
                          <TableCell className="text-center font-semibold">
                            <span className={month.netProfit >= 0 ? "text-green-600" : "text-red-600"}>
                              {month.netProfit >= 0 ? "+" : ""}{Math.round(month.netProfit / 1000)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-gray-500 py-8">
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