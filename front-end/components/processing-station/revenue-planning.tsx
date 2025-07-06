"use client"

import { useState, useEffect } from "react"
import { format, getDaysInMonth, startOfMonth, addDays } from "date-fns"
import { vi } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calculator, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth/auth-provider"
import { processingStationApi } from "@/lib/api-client"

interface DailyRevenueSummary {
  date: string
  dayNumber: number
  tofuProfit: number // Lãi đậu phụ
  sausageProfit: number // Lãi giò chả
  sproutsProfit: number // Lãi giá đỗ
  saltProfit: number // Lãi muối nén
  livestockProfit: number // Lãi giết mổ lợn
  poultryProfit: number // Lãi gia cầm
  totalProfit: number // Tổng lãi
}

interface MonthlyRevenuePlan {
  month: number
  year: number
  dailySummaries: DailyRevenueSummary[]
  monthlyTotals: {
    totalTofuProfit: number
    totalSausageProfit: number
    totalSproutsProfit: number
    totalSaltProfit: number
    totalLivestockProfit: number
    totalPoultryProfit: number
    grandTotal: number
  }
}

export function RevenuePlanning() {
  const { toast } = useToast()
  const { user } = useAuth()
  
  // States
  const [isLoading, setIsLoading] = useState(false)
  const [monthlyRevenuePlan, setMonthlyRevenuePlan] = useState<MonthlyRevenuePlan | null>(null)
  
  // Date selections
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Fetch daily profit data for a specific date
  const fetchDailyProfitData = async (date: string) => {
    try {
      const dailySummary: DailyRevenueSummary = {
        date,
        dayNumber: new Date(date).getDate(),
        tofuProfit: 0,
        sausageProfit: 0,
        sproutsProfit: 0,
        saltProfit: 0,
        livestockProfit: 0,
        poultryProfit: 0,
        totalProfit: 0
      }

      // Fetch tofu processing data
      try {
        const tofuResponse = await processingStationApi.getDailyData(date)
        if (tofuResponse.success && tofuResponse.data) {
          const tofuData = tofuResponse.data.data || tofuResponse.data
          const tofuRevenue = (tofuData.tofuOutput || 0) * (tofuData.tofuPrice || 15000)
          const tofuCost = (tofuData.soybeanInput || 0) * (tofuData.soybeanPrice || 12000)
          dailySummary.tofuProfit = tofuRevenue - tofuCost
        }
      } catch (error) {
        console.log(`No tofu data for ${date}`)
      }

      // Fetch sausage processing data
      try {
        const sausageResponse = await processingStationApi.getDailySausageData(date)
        if (sausageResponse.success && sausageResponse.data) {
          const sausageData = sausageResponse.data.data || sausageResponse.data
          const sausageRevenue = (sausageData.sausageInput || 0) * (sausageData.sausagePrice || 140000)
          const chaQueRevenue = (sausageData.chaQueInput || 0) * (sausageData.chaQuePrice || 140000)
          const meatCost = ((sausageData.leanMeatInput || 0) * (sausageData.leanMeatPrice || 120000)) + 
                          ((sausageData.fatMeatInput || 0) * (sausageData.fatMeatPrice || 80000))
          dailySummary.sausageProfit = (sausageRevenue + chaQueRevenue) - meatCost
        }
      } catch (error) {
        console.log(`No sausage data for ${date}`)
      }

      // Fetch salt processing data
      try {
        const saltResponse = await processingStationApi.getDailySaltData(date)
        if (saltResponse.success && saltResponse.data) {
          const saltData = saltResponse.data.data || saltResponse.data
          const saltRevenue = (saltData.saltOutput || 0) * (saltData.saltPrice || 8000)
          const saltCost = (saltData.saltInput || 0) * (saltData.saltPrice || 8000) * 0.3 // 30% cost
          dailySummary.saltProfit = saltRevenue - saltCost
        }
      } catch (error) {
        console.log(`No salt data for ${date}`)
      }

      // Fetch bean sprouts processing data
      try {
        const sproutsResponse = await processingStationApi.getDailyBeanSproutsData(date)
        if (sproutsResponse.success && sproutsResponse.data) {
          const sproutsData = sproutsResponse.data.data || sproutsResponse.data
          const sproutsRevenue = (sproutsData.beanSproutsOutput || 0) * (sproutsData.beanSproutsPrice || 12000)
          const sproutsCost = (sproutsData.mungBeanInput || 0) * (sproutsData.mungBeanPrice || 8000)
          dailySummary.sproutsProfit = sproutsRevenue - sproutsCost
        }
      } catch (error) {
        console.log(`No bean sprouts data for ${date}`)
      }

      // Fetch livestock processing data
      try {
        const livestockResponse = await processingStationApi.getDailyLivestockData(date)
        if (livestockResponse.success && livestockResponse.data) {
          const livestockData = livestockResponse.data.data || livestockResponse.data
          // SỬA: Tính lãi dựa trên lượng sản xuất (output) thay vì lượng thực tế xuất (actualOutput)
          const leanMeatRevenue = (livestockData.leanMeatOutput || 0) * (livestockData.leanMeatPrice || 160000)
          const boneRevenue = (livestockData.boneOutput || 0) * (livestockData.bonePrice || 40000)
          const groundMeatRevenue = (livestockData.groundMeatOutput || 0) * (livestockData.groundMeatPrice || 120000)
          const organsRevenue = (livestockData.organsOutput || 0) * (livestockData.organsPrice || 80000)
          const livestockCost = (livestockData.liveAnimalsInput || 0) * (livestockData.liveAnimalPrice || 70000)
          dailySummary.livestockProfit = (leanMeatRevenue + boneRevenue + groundMeatRevenue + organsRevenue) - livestockCost
        }
      } catch (error) {
        console.log(`No livestock data for ${date}`)
      }

      // Fetch poultry processing data
      try {
        const poultryResponse = await processingStationApi.getDailyPoultryData(date)
        if (poultryResponse.success && poultryResponse.data) {
          const poultryData = poultryResponse.data.data || poultryResponse.data
          // SỬA: Tính lãi dựa trên lượng sản xuất (output) thay vì lượng thực tế xuất (actualOutput)
          const poultryRevenue = (poultryData.poultryMeatOutput || 0) * (poultryData.poultryMeatPrice || 150000)
          const poultryCost = (poultryData.livePoultryInput || 0) * (poultryData.livePoultryPrice || 60000)
          dailySummary.poultryProfit = poultryRevenue - poultryCost
        }
      } catch (error) {
        console.log(`No poultry data for ${date}`)
      }

      // Calculate total profit
      dailySummary.totalProfit = dailySummary.tofuProfit + dailySummary.sausageProfit + 
                                dailySummary.sproutsProfit + dailySummary.saltProfit + 
                                dailySummary.livestockProfit + dailySummary.poultryProfit

      return dailySummary
    } catch (error) {
      console.error(`Error fetching daily profit data for ${date}:`, error)
      return null
    }
  }

  // Fetch revenue planning data
  const fetchRevenuePlanningData = async () => {
    try {
      setIsLoading(true)
      
      const daysInMonth = getDaysInMonth(new Date(selectedYear, selectedMonth - 1))
      const dailySummaries: DailyRevenueSummary[] = []
      
      let totalTofuProfit = 0
      let totalSausageProfit = 0
      let totalSproutsProfit = 0
      let totalSaltProfit = 0
      let totalLivestockProfit = 0
      let totalPoultryProfit = 0
      let grandTotal = 0

      // Fetch data for each day of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(selectedYear, selectedMonth - 1, day)
        const dateStr = format(date, "yyyy-MM-dd")
        
        const dailyData = await fetchDailyProfitData(dateStr)
        
        if (dailyData) {
          dailySummaries.push(dailyData)
          
          // Add to monthly totals
          totalTofuProfit += dailyData.tofuProfit
          totalSausageProfit += dailyData.sausageProfit
          totalSproutsProfit += dailyData.sproutsProfit
          totalSaltProfit += dailyData.saltProfit
          totalLivestockProfit += dailyData.livestockProfit
          totalPoultryProfit += dailyData.poultryProfit
          grandTotal += dailyData.totalProfit
        } else {
          // Add empty day if no data
          dailySummaries.push({
            date: dateStr,
            dayNumber: day,
            tofuProfit: 0,
            sausageProfit: 0,
            sproutsProfit: 0,
            saltProfit: 0,
            livestockProfit: 0,
            poultryProfit: 0,
            totalProfit: 0
          })
        }
      }

      const monthlyPlan: MonthlyRevenuePlan = {
        month: selectedMonth,
        year: selectedYear,
        dailySummaries,
        monthlyTotals: {
          totalTofuProfit,
          totalSausageProfit,
          totalSproutsProfit,
          totalSaltProfit,
          totalLivestockProfit,
          totalPoultryProfit,
          grandTotal
        }
      }

      setMonthlyRevenuePlan(monthlyPlan)
      
      // Show success message
      const daysWithData = dailySummaries.filter(day => day.totalProfit !== 0).length
      if (daysWithData > 0) {
        toast({
          title: "📊 Dữ liệu hoạch toán",
          description: `Đã tải dữ liệu từ ${daysWithData}/${daysInMonth} ngày trong tháng`,
          variant: "default"
        })
      } else {
        toast({
          title: "📝 Không có dữ liệu",
          description: "Không có dữ liệu chế biến cho tháng này",
          variant: "default"
        })
      }
      
    } catch (error) {
      console.error("Error fetching revenue planning data:", error)
      toast({
        title: "❌ Lỗi",
        description: "Không thể tải dữ liệu hoạch toán thu chi",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRevenuePlanningData()
  }, [selectedMonth, selectedYear])

  const formatCurrency = (amount: number) => {
    return Math.round(amount / 1000) // Convert to thousands
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="h-6 w-6 text-purple-600" />
        <h2 className="text-2xl font-bold text-purple-800">Hoạch toán thu chi</h2>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-center items-center gap-3 mb-4">
            <CardTitle className="text-center text-lg font-bold">
              TỔNG HỢP KẾT QUẢ THÁNG {selectedMonth.toString().padStart(2, '0')} NĂM {selectedYear}
            </CardTitle>
            
          </div>
          <div className="flex gap-4 justify-center">
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
          {isLoading || !monthlyRevenuePlan ? (
            <div className="text-center py-8">Đang tải dữ liệu...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="border">
                <TableHeader>
                  <TableRow>
                    <TableHead rowSpan={2} className="text-center align-middle border-r bg-gray-100 w-12">TT</TableHead>
                    <TableHead rowSpan={2} className="text-center align-middle border-r bg-gray-100 w-20">Ngày</TableHead>
                    <TableHead colSpan={6} className="text-center border-r bg-blue-50">THU-CHI (LÃI)</TableHead>
                    <TableHead rowSpan={2} className="text-center align-middle bg-green-100">TỔNG<br/>LÃI<br/>(1.000đ)</TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead className="text-center bg-green-50 text-xs">Đậu phụ<br/>(1.000đ)</TableHead>
                    <TableHead className="text-center bg-orange-50 text-xs">Giò chả<br/>(1.000đ)</TableHead>
                    <TableHead className="text-center bg-yellow-50 text-xs">Giá đỗ<br/>(1.000đ)</TableHead>
                    <TableHead className="text-center bg-blue-50 text-xs">Muối nén<br/>(1.000đ)</TableHead>
                    <TableHead className="text-center bg-red-50 text-xs">Giết mổ lợn<br/>(1.000đ)</TableHead>
                    <TableHead className="text-center bg-purple-50 border-r text-xs">Gia cầm<br/>(1.000đ)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyRevenuePlan.dailySummaries.map((day, index) => (
                    <TableRow key={day.date} className="border-b">
                      <TableCell className="text-center border-r font-medium">{index + 1}</TableCell>
                      <TableCell className="text-center border-r">{day.dayNumber}</TableCell>
                      {/* Đậu phụ */}
                      <TableCell className="text-center text-sm">
                        <span className={day.tofuProfit >= 0 ? "text-green-600" : "text-red-600"}>
                          {day.tofuProfit >= 0 ? "+" : ""}{formatCurrency(day.tofuProfit)}
                        </span>
                      </TableCell>
                      {/* Giò chả */}
                      <TableCell className="text-center text-sm">
                        <span className={day.sausageProfit >= 0 ? "text-green-600" : "text-red-600"}>
                          {day.sausageProfit >= 0 ? "+" : ""}{formatCurrency(day.sausageProfit)}
                        </span>
                      </TableCell>
                      {/* Giá đỗ */}
                      <TableCell className="text-center text-sm">
                        <span className={day.sproutsProfit >= 0 ? "text-green-600" : "text-red-600"}>
                          {day.sproutsProfit >= 0 ? "+" : ""}{formatCurrency(day.sproutsProfit)}
                        </span>
                      </TableCell>
                      {/* Muối nén */}
                      <TableCell className="text-center text-sm">
                        <span className={day.saltProfit >= 0 ? "text-green-600" : "text-red-600"}>
                          {day.saltProfit >= 0 ? "+" : ""}{formatCurrency(day.saltProfit)}
                        </span>
                      </TableCell>
                      {/* Giết mổ lợn */}
                      <TableCell className="text-center text-sm">
                        <span className={day.livestockProfit >= 0 ? "text-green-600" : "text-red-600"}>
                          {day.livestockProfit >= 0 ? "+" : ""}{formatCurrency(day.livestockProfit)}
                        </span>
                      </TableCell>
                      {/* Gia cầm */}
                      <TableCell className="text-center border-r text-sm">
                        <span className={day.poultryProfit >= 0 ? "text-green-600" : "text-red-600"}>
                          {day.poultryProfit >= 0 ? "+" : ""}{formatCurrency(day.poultryProfit)}
                        </span>
                      </TableCell>
                      {/* Tổng lãi */}
                      <TableCell className="text-center font-semibold">
                        <span className={day.totalProfit >= 0 ? "text-green-600" : "text-red-600"}>
                          {day.totalProfit >= 0 ? "+" : ""}{formatCurrency(day.totalProfit)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Tổng cộng */}
                  <TableRow className="bg-gray-100 font-semibold border-t-2">
                    <TableCell className="text-center border-r" colSpan={2}>Tổng</TableCell>
                    {/* Tổng đậu phụ */}
                    <TableCell className="text-center">
                      <span className={monthlyRevenuePlan.monthlyTotals.totalTofuProfit >= 0 ? "text-green-600" : "text-red-600"}>
                        {monthlyRevenuePlan.monthlyTotals.totalTofuProfit >= 0 ? "+" : ""}{formatCurrency(monthlyRevenuePlan.monthlyTotals.totalTofuProfit)}
                      </span>
                    </TableCell>
                    {/* Tổng giò chả */}
                    <TableCell className="text-center">
                      <span className={monthlyRevenuePlan.monthlyTotals.totalSausageProfit >= 0 ? "text-green-600" : "text-red-600"}>
                        {monthlyRevenuePlan.monthlyTotals.totalSausageProfit >= 0 ? "+" : ""}{formatCurrency(monthlyRevenuePlan.monthlyTotals.totalSausageProfit)}
                      </span>
                    </TableCell>
                    {/* Tổng giá đỗ */}
                    <TableCell className="text-center">
                      <span className={monthlyRevenuePlan.monthlyTotals.totalSproutsProfit >= 0 ? "text-green-600" : "text-red-600"}>
                        {monthlyRevenuePlan.monthlyTotals.totalSproutsProfit >= 0 ? "+" : ""}{formatCurrency(monthlyRevenuePlan.monthlyTotals.totalSproutsProfit)}
                      </span>
                    </TableCell>
                    {/* Tổng muối nén */}
                    <TableCell className="text-center">
                      <span className={monthlyRevenuePlan.monthlyTotals.totalSaltProfit >= 0 ? "text-green-600" : "text-red-600"}>
                        {monthlyRevenuePlan.monthlyTotals.totalSaltProfit >= 0 ? "+" : ""}{formatCurrency(monthlyRevenuePlan.monthlyTotals.totalSaltProfit)}
                      </span>
                    </TableCell>
                    {/* Tổng giết mổ lợn */}
                    <TableCell className="text-center">
                      <span className={monthlyRevenuePlan.monthlyTotals.totalLivestockProfit >= 0 ? "text-green-600" : "text-red-600"}>
                        {monthlyRevenuePlan.monthlyTotals.totalLivestockProfit >= 0 ? "+" : ""}{formatCurrency(monthlyRevenuePlan.monthlyTotals.totalLivestockProfit)}
                      </span>
                    </TableCell>
                    {/* Tổng gia cầm */}
                    <TableCell className="text-center border-r">
                      <span className={monthlyRevenuePlan.monthlyTotals.totalPoultryProfit >= 0 ? "text-green-600" : "text-red-600"}>
                        {monthlyRevenuePlan.monthlyTotals.totalPoultryProfit >= 0 ? "+" : ""}{formatCurrency(monthlyRevenuePlan.monthlyTotals.totalPoultryProfit)}
                      </span>
                    </TableCell>
                    {/* Tổng lãi */}
                    <TableCell className="text-center text-lg">
                      <span className={monthlyRevenuePlan.monthlyTotals.grandTotal >= 0 ? "text-green-600" : "text-red-600"}>
                        {monthlyRevenuePlan.monthlyTotals.grandTotal >= 0 ? "+" : ""}{formatCurrency(monthlyRevenuePlan.monthlyTotals.grandTotal)}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Summary cards */}
          {monthlyRevenuePlan && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-sm font-medium text-green-700 mb-1">Tổng lãi tháng</div>
                  <div className="text-xl font-bold text-green-800">
                    {formatCurrency(monthlyRevenuePlan.monthlyTotals.grandTotal)}k đ
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-sm font-medium text-blue-700 mb-1">Lãi TB/ngày</div>
                  <div className="text-xl font-bold text-blue-800">
                    {formatCurrency(monthlyRevenuePlan.monthlyTotals.grandTotal / monthlyRevenuePlan.dailySummaries.length)}k đ
                  </div>
                </div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-sm font-medium text-orange-700 mb-1">Module có lãi cao nhất</div>
                  <div className="text-sm font-bold text-orange-800">
                    {(() => {
                      const profits = [
                        { name: "Giết mổ lợn", value: monthlyRevenuePlan.monthlyTotals.totalLivestockProfit },
                        { name: "Gia cầm", value: monthlyRevenuePlan.monthlyTotals.totalPoultryProfit },
                        { name: "Đậu phụ", value: monthlyRevenuePlan.monthlyTotals.totalTofuProfit },
                        { name: "Giò chả", value: monthlyRevenuePlan.monthlyTotals.totalSausageProfit },
                        { name: "Giá đỗ", value: monthlyRevenuePlan.monthlyTotals.totalSproutsProfit },
                        { name: "Muối nén", value: monthlyRevenuePlan.monthlyTotals.totalSaltProfit }
                      ]
                      const highest = profits.reduce((max, current) => current.value > max.value ? current : max)
                      return highest.name
                    })()}
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-sm font-medium text-purple-700 mb-1">Số ngày có lãi</div>
                  <div className="text-xl font-bold text-purple-800">
                    {monthlyRevenuePlan.dailySummaries.filter(day => day.totalProfit > 0).length}/{monthlyRevenuePlan.dailySummaries.length}
                  </div>
                </div>
              </div>
            </div>
          )}
          

        </CardContent>
      </Card>
    </div>
  )
} 