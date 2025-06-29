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

  // Generate sample data for the month
  const generateSampleData = (month: number, year: number): MonthlyRevenuePlan => {
    const daysInMonth = getDaysInMonth(new Date(year, month - 1))
    const dailySummaries: DailyRevenueSummary[] = []
    
    let totalTofuProfit = 0
    let totalSausageProfit = 0
    let totalSproutsProfit = 0
    let totalSaltProfit = 0
    let totalLivestockProfit = 0
    let totalPoultryProfit = 0
    let grandTotal = 0

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day)
      const dateStr = format(date, "yyyy-MM-dd")
      
      // Generate random profit data (sample data)
      const tofuProfit = Math.floor(Math.random() * 50000) + 10000 // 10k-60k
      const sausageProfit = Math.floor(Math.random() * 40000) + 8000 // 8k-48k  
      const sproutsProfit = Math.floor(Math.random() * 30000) + 5000 // 5k-35k
      const saltProfit = Math.floor(Math.random() * 20000) + 3000 // 3k-23k
      const livestockProfit = Math.floor(Math.random() * 80000) + 20000 // 20k-100k
      const poultryProfit = Math.floor(Math.random() * 60000) + 15000 // 15k-75k
      
      const totalProfit = tofuProfit + sausageProfit + sproutsProfit + saltProfit + livestockProfit + poultryProfit

      dailySummaries.push({
        date: dateStr,
        dayNumber: day,
        tofuProfit,
        sausageProfit,
        sproutsProfit,
        saltProfit,
        livestockProfit,
        poultryProfit,
        totalProfit
      })

      // Add to monthly totals
      totalTofuProfit += tofuProfit
      totalSausageProfit += sausageProfit
      totalSproutsProfit += sproutsProfit
      totalSaltProfit += saltProfit
      totalLivestockProfit += livestockProfit
      totalPoultryProfit += poultryProfit
      grandTotal += totalProfit
    }

    return {
      month,
      year,
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
  }

  // Fetch revenue planning data
  const fetchRevenuePlanningData = async () => {
    try {
      setIsLoading(true)
      
      // Generate sample data - in real app this would be API call
      const data = generateSampleData(selectedMonth, selectedYear)
      setMonthlyRevenuePlan(data)
      
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
            {user && (user.role === "admin" || user.role === "stationManager") && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                Dữ liệu được tự động tính toán
              </Badge>
            )}
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
          
          {/* Info message for different roles */}
          <div className="pt-4 border-t mt-4">
            {user && (user.role === "admin" || user.role === "stationManager") ? (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-700 text-center">
                  📊 Dữ liệu hoạch toán thu chi được tự động tính toán từ các module chế biến. 
                  Trạm trưởng có thể xem và theo dõi hiệu suất kinh doanh.
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-700 text-center">
                  ⚠️ Chỉ trạm trưởng mới có thể xem đầy đủ dữ liệu hoạch toán thu chi
                </p>
              </div>
            )}
            <p className="text-sm text-gray-500 text-center mt-2">
              Dữ liệu mẫu cho hoạch toán thu chi. Sẽ được tích hợp với dữ liệu thực từ các module.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 