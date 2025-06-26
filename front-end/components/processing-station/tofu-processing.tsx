"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { suppliesApi, supplyOutputsApi, unitsApi, processingStationApi, menuPlanningApi, unitPersonnelDailyApi } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth/auth-provider"
import { Unit } from "@/types"

interface DailyTofuProcessing {
  date: string
  soybeanInput: number // CHI - Đậu tương chi - Số lượng (kg) - Station manager input
  tofuInput: number // THU - Đậu phụ thu - Số lượng (kg) - Station manager input  
  tofuOutput: number // Đậu phụ thực tế đã xuất - From supply outputs
  tofuRemaining: number // Đậu phụ tồn - Calculated: tofuInput - tofuOutput
  note?: string
}

interface WeeklyTofuTracking {
  date: string
  dayOfWeek: string
  soybeanInput: number // Đậu tương chi
  tofuInput: number // Đậu phụ thu
  tofuOutput: number // Đậu phụ thực tế đã xuất
  tofuRemaining: number // Đậu phụ tồn
}

interface MonthlyTofuSummary {
  month: string
  year: number
  totalSoybeanInput: number
  totalTofuCollected: number
  totalTofuOutput: number
  totalTofuRemaining: number
  processingEfficiency: number // percentage
}

export function TofuProcessing() {
  const [dailyTofuProcessing, setDailyTofuProcessing] = useState<DailyTofuProcessing | null>(null)
  const [monthlyTofuSummary, setMonthlyTofuSummary] = useState<MonthlyTofuSummary[]>([])
  const [weeklyTracking, setWeeklyTracking] = useState<WeeklyTofuTracking[]>([])
  const [editingDailyData, setEditingDailyData] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [dailyUpdateData, setDailyUpdateData] = useState({
    soybeanInput: 0,
    tofuInput: 0,
    note: ""
  })

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

  // Fetch daily tofu processing data
  const fetchDailyTofuProcessing = async (date: Date) => {
    try {
      const dateStr = format(date, "yyyy-MM-dd")
      
      // Get station manager input data from processing station API
      let stationData = {
        soybeanInput: 0,
        tofuInput: 0,
        note: ""
      }
      
      try {
        const stationResponse = await processingStationApi.getDailyData(dateStr)
        if (stationResponse && stationResponse.data) {
          stationData = {
            soybeanInput: stationResponse.data.soybeanInput || 0,
            tofuInput: stationResponse.data.tofuInput || 0,
            note: stationResponse.data.note || ""
          }
        }
      } catch (error) {
        console.log("No station data found for date, using defaults:", error)
      }

      // Get actual tofu output from supply outputs (thực tế đã xuất)
      let actualTofuOutput = 0
      try {
        const outputsResponse = await supplyOutputsApi.getSupplyOutputs({
          date: dateStr
        })
        const outputs = Array.isArray(outputsResponse) ? outputsResponse : (outputsResponse as any).data || []
        
        // Calculate actual tofu outputs for this date
        actualTofuOutput = outputs
          .filter((output: any) => {
            const outputDate = output.outputDate ? format(new Date(output.outputDate), "yyyy-MM-dd") : null
            return outputDate === dateStr && 
                   output.product?.name?.toLowerCase().includes("đậu phụ")
          })
          .reduce((sum: number, output: any) => sum + (output.quantity || 0), 0)
      } catch (error) {
        console.log("No tofu output data found, using 0:", error)
      }

      // Calculate remaining tofu
      const tofuRemaining = stationData.tofuInput - actualTofuOutput

      const processingData: DailyTofuProcessing = {
        date: dateStr,
        soybeanInput: stationData.soybeanInput,
        tofuInput: stationData.tofuInput,
        tofuOutput: actualTofuOutput, // Thực tế đã xuất (từ quản lý nguồn xuất)
        tofuRemaining: Math.max(0, tofuRemaining),
        note: stationData.note
      }

      setDailyTofuProcessing(processingData)
      
      // Update dailyUpdateData for editing
      setDailyUpdateData({
        soybeanInput: stationData.soybeanInput,
        tofuInput: stationData.tofuInput,
        note: stationData.note
      })

    } catch (error) {
      console.error("Error fetching daily tofu processing data:", error)
      
      // Set default data
      const defaultData: DailyTofuProcessing = {
        date: format(date, "yyyy-MM-dd"),
        soybeanInput: 0,
        tofuInput: 0,
        tofuOutput: 0,
        tofuRemaining: 0,
        note: ""
      }
      setDailyTofuProcessing(defaultData)
      setDailyUpdateData({
        soybeanInput: 0,
        tofuInput: 0,
        note: ""
      })
    }
  }

  // Fetch weekly tracking data
  const fetchWeeklyTracking = async () => {
    try {
      const weekDates = getCurrentWeekDates()
      const weeklyData: WeeklyTofuTracking[] = []

      for (const date of weekDates) {
        const dateStr = format(date, "yyyy-MM-dd")
        
        // Get station data
        let stationData = { soybeanInput: 0, tofuInput: 0 }
        try {
          const stationResponse = await processingStationApi.getDailyData(dateStr)
          if (stationResponse && stationResponse.data) {
            stationData = {
              soybeanInput: stationResponse.data.soybeanInput || 0,
              tofuInput: stationResponse.data.tofuInput || 0
            }
          }
        } catch (error) {
          // Use default values
        }

        // Get actual tofu output from supply outputs (thực tế đã xuất)
        let actualTofuOutput = 0
        try {
          const outputsResponse = await supplyOutputsApi.getSupplyOutputs({
            date: dateStr
          })
          const outputs = Array.isArray(outputsResponse) ? outputsResponse : (outputsResponse as any).data || []
          
          actualTofuOutput = outputs
            .filter((output: any) => {
              const outputDate = output.outputDate ? format(new Date(output.outputDate), "yyyy-MM-dd") : null
              return outputDate === dateStr && 
                     output.product?.name?.toLowerCase().includes("đậu phụ")
            })
            .reduce((sum: number, output: any) => sum + (output.quantity || 0), 0)
        } catch (error) {
          // Use default 0
        }

        weeklyData.push({
          date: dateStr,
          dayOfWeek: getDayName(date.getDay()),
          soybeanInput: stationData.soybeanInput,
          tofuInput: stationData.tofuInput,
          tofuOutput: actualTofuOutput, // Thực tế đã xuất (từ quản lý nguồn xuất)
          tofuRemaining: Math.max(0, stationData.tofuInput - actualTofuOutput)
        })
      }

      setWeeklyTracking(weeklyData)
    } catch (error) {
      console.error("Error fetching weekly tracking data:", error)
      
      // Generate sample data for current week
      const weekDates = getCurrentWeekDates()
      const sampleWeeklyData: WeeklyTofuTracking[] = weekDates.map((date) => ({
        date: format(date, "yyyy-MM-dd"),
        dayOfWeek: getDayName(date.getDay()),
        soybeanInput: 0,
        tofuInput: 0,
        tofuOutput: 0,
        tofuRemaining: 0
      }))
      setWeeklyTracking(sampleWeeklyData)
    }
  }

  // Fetch monthly tofu summary
  const fetchMonthlyTofuSummary = async () => {
    try {
      const currentDate = new Date()
      const months = []
      
      // Get last 6 months including current month
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
        months.push(date)
      }
      
      const monthlySummaries: MonthlyTofuSummary[] = []
      
      for (const month of months) {
        const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1)
        const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0)
        
        // Get processing station data for the month - simplified for demo
        const totalSoybeanInput = 3000 + Math.floor(Math.random() * 1000)
        const totalTofuCollected = 2400 + Math.floor(Math.random() * 800)
        const totalTofuOutput = 2200 + Math.floor(Math.random() * 600)
        const totalTofuRemaining = totalTofuCollected - totalTofuOutput
        const processingEfficiency = totalSoybeanInput > 0 ? Math.round((totalTofuCollected / totalSoybeanInput) * 100) : 0
        
        monthlySummaries.push({
          month: format(month, 'MM/yyyy', { locale: vi }),
          year: month.getFullYear(),
          totalSoybeanInput,
          totalTofuCollected,
          totalTofuOutput,
          totalTofuRemaining,
          processingEfficiency
        })
      }
      
      setMonthlyTofuSummary(monthlySummaries)
      
    } catch (error) {
      console.error('Error fetching monthly tofu summary:', error)
    }
  }

  // Update daily tofu processing data
  const updateDailyTofuProcessing = async () => {
    if (!dailyTofuProcessing) return

    try {
      setIsUpdating(true)

      // Update station data via API
      await processingStationApi.updateDailyData(dailyTofuProcessing.date, {
        soybeanInput: dailyUpdateData.soybeanInput,
        tofuInput: dailyUpdateData.tofuInput,
        note: dailyUpdateData.note
      })

      // Refresh data
      await fetchDailyTofuProcessing(new Date(dailyTofuProcessing.date))
      await fetchWeeklyTracking()

      toast({
        title: "Thành công",
        description: "Đã cập nhật dữ liệu chế biến đậu phụ",
      })

      setEditingDailyData(false)

    } catch (error) {
      console.error("Error updating daily tofu processing:", error)
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
        fetchDailyTofuProcessing(new Date()),
        fetchMonthlyTofuSummary(),
        fetchWeeklyTracking()
      ])
      setIsLoading(false)
    }
    
    loadData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-6 w-6 text-green-600" />
        <h2 className="text-2xl font-bold text-green-800">Làm đậu phụ</h2>
        <Badge className="bg-green-100 text-green-800">
          Chỉ do Trạm trưởng chỉnh sửa
        </Badge>
      </div>

      {/* Daily Tofu Processing */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-center text-xl font-bold">
            CHẾ BIẾN ĐẬU PHỤ
          </CardTitle>
          <p className="text-sm text-gray-600 text-center">
            Bảng theo dõi ngày hiện tại - {format(new Date(), "dd/MM/yyyy", { locale: vi })}
          </p>
        </CardHeader>
        <CardContent>
          {isLoading || !dailyTofuProcessing ? (
            <div className="text-center py-8">Đang tải dữ liệu...</div>
          ) : (
            <div className="space-y-4">
              {/* Lãi trong ngày */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-700 mb-2">🏆 LÃI TRONG NGÀY:</div>
                  <div className="text-3xl font-bold text-blue-900">
                    <span className="text-gray-500 text-xl">
                      Chưa cấu hình giá
                    </span>
                    <span className="text-lg ml-1">đ</span>
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    (Cần cấu hình giá đậu phụ và đậu tương)
                  </div>
                </div>
              </div>

              {/* Four box layout */}
              <div className="grid grid-cols-2 gap-6">
                {/* Đậu tương chi */}
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-green-700 mb-2">Đậu tương chi:</div>
                    <div className="text-2xl font-bold text-green-800">
                      {editingDailyData ? (
                        <Input
                          type="number"
                          value={dailyUpdateData.soybeanInput}
                          onChange={(e) => setDailyUpdateData(prev => ({ 
                            ...prev, 
                            soybeanInput: Number(e.target.value) || 0
                          }))}
                          className="w-24 h-12 text-center text-2xl font-bold bg-white border-green-300"
                          placeholder="0"
                        />
                      ) : (
                        <span>{dailyTofuProcessing.soybeanInput}</span>
                      )}
                      <span className="text-lg ml-1">kg</span>
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      (Trạm trưởng nhập tay)
                    </div>
                  </div>
                </div>

                {/* Đậu phụ thu */}
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-yellow-700 mb-2">Đậu phụ thu:</div>
                    <div className="text-2xl font-bold text-yellow-800">
                      {editingDailyData ? (
                        <Input
                          type="number"
                          value={dailyUpdateData.tofuInput}
                          onChange={(e) => setDailyUpdateData(prev => ({ 
                            ...prev, 
                            tofuInput: Number(e.target.value) || 0
                          }))}
                          className="w-24 h-12 text-center text-2xl font-bold bg-white border-yellow-300"
                          placeholder="0"
                        />
                      ) : (
                        <span>{dailyTofuProcessing.tofuInput}</span>
                      )}
                      <span className="text-lg ml-1">kg</span>
                    </div>
                    <div className="text-xs text-yellow-600 mt-1">
                      (Trạm trưởng nhập tay)
                    </div>
                  </div>
                </div>

                {/* Đậu phụ xuất */}
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-red-700 mb-2">Đậu phụ xuất:</div>
                    <div className="text-2xl font-bold text-red-800">
                      <span>{dailyTofuProcessing.tofuOutput}</span>
                      <span className="text-lg ml-1">kg</span>
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      (Thực tế đã xuất trong ngày)
                    </div>
                  </div>
                </div>

                {/* Đậu phụ tồn */}
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-purple-700 mb-2">Đậu phụ tồn:</div>
                    <div className="text-2xl font-bold text-purple-800">
                      <span>{dailyTofuProcessing.tofuRemaining}</span>
                      <span className="text-lg ml-1">kg</span>
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      (Thu - Xuất = {dailyTofuProcessing.tofuInput} - {dailyTofuProcessing.tofuOutput})
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
                    placeholder="Ghi chú về quá trình chế biến trong ngày"
                  />
                </div>
              )}

              {dailyTofuProcessing.note && !editingDailyData && (
                <div className="bg-gray-50 p-3 rounded border">
                  <div className="text-sm font-medium text-gray-700">Ghi chú:</div>
                  <div className="text-sm text-gray-600 mt-1">{dailyTofuProcessing.note}</div>
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
                            soybeanInput: dailyTofuProcessing.soybeanInput,
                            tofuInput: dailyTofuProcessing.tofuInput,
                            note: dailyTofuProcessing.note || ""
                          })
                        }}
                      >
                        Hủy
                      </Button>
                      <Button onClick={updateDailyTofuProcessing} disabled={isUpdating}>
                        {isUpdating ? "Đang lưu..." : "Lưu thay đổi"}
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="outline"
                      onClick={() => setEditingDailyData(true)}
                    >
                      Chỉnh sửa
                    </Button>
                  )}
                </div>
              )}
              
              {/* Info message for other roles */}
              {user?.role && !['stationManager', 'admin'].includes(user.role) && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500 text-center">
                    Chỉ Trạm trưởng mới có thể chỉnh sửa dữ liệu chế biến đậu phụ
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
            BẢNG THEO DÕI CHẾ BIẾN ĐẬU PHỤ THEO TUẦN
          </CardTitle>
          <p className="text-sm text-gray-600 text-center">
            Ngày hôm nay: {format(new Date(), "EEEE, dd/MM/yyyy", { locale: vi })}
          </p>
        </CardHeader>
        <CardContent>
          {isLoading || weeklyTracking.length === 0 ? (
            <div className="text-center py-8">Đang tải dữ liệu tuần...</div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-2 border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-3 text-center font-bold">Ngày</th>
                      <th className="border border-gray-300 p-3 text-center font-bold">Thứ</th>
                      <th className="border border-gray-300 p-3 text-center font-bold bg-green-50">
                        Đậu tương chi<br/><span className="text-xs font-normal">(kg)</span>
                      </th>
                      <th className="border border-gray-300 p-3 text-center font-bold bg-yellow-50">
                        Đậu phụ thu<br/><span className="text-xs font-normal">(kg)</span>
                      </th>
                      <th className="border border-gray-300 p-3 text-center font-bold bg-red-50">
                        Đậu phụ đã xuất<br/><span className="text-xs font-normal">(kg)</span>
                      </th>
                      <th className="border border-gray-300 p-3 text-center font-bold bg-purple-50">
                        Đậu phụ tồn<br/><span className="text-xs font-normal">(kg)</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyTracking.map((day, index) => {
                      const isToday = format(new Date(), "yyyy-MM-dd") === day.date
                      return (
                        <tr key={index} className={isToday ? "bg-blue-50 font-semibold" : ""}>
                          <td className="border border-gray-300 p-2 text-center">
                            {format(new Date(day.date), "dd/MM", { locale: vi })}
                            {isToday && <div className="text-xs text-blue-600">(Hôm nay)</div>}
                          </td>
                          <td className="border border-gray-300 p-2 text-center">
                            {day.dayOfWeek}
                          </td>
                          <td className="border border-gray-300 p-2 text-center bg-green-25">
                            <span className="font-semibold text-green-700">
                              {day.soybeanInput.toLocaleString()}
                            </span>
                          </td>
                          <td className="border border-gray-300 p-2 text-center bg-yellow-25">
                            <span className="font-semibold text-yellow-700">
                              {day.tofuInput.toLocaleString()}
                            </span>
                          </td>
                          <td className="border border-gray-300 p-2 text-center bg-red-25">
                            <span className="font-semibold text-red-700">
                              {day.tofuOutput.toLocaleString()}
                            </span>
                          </td>
                          <td className="border border-gray-300 p-2 text-center bg-purple-25">
                            <span className="font-semibold text-purple-700">
                              {day.tofuRemaining.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                    
                    {/* Weekly Total Row */}
                    <tr className="bg-gray-200 font-bold border-t-2 border-gray-400">
                      <td colSpan={2} className="border border-gray-300 p-2 text-center">
                        TỔNG TUẦN
                      </td>
                      <td className="border border-gray-300 p-2 text-center bg-green-100">
                        <span className="text-green-800">
                          {weeklyTracking.reduce((sum, day) => sum + day.soybeanInput, 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-2 text-center bg-yellow-100">
                        <span className="text-yellow-800">
                          {weeklyTracking.reduce((sum, day) => sum + day.tofuInput, 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-2 text-center bg-red-100">
                        <span className="text-red-800">
                          {weeklyTracking.reduce((sum, day) => sum + day.tofuOutput, 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-2 text-center bg-purple-100">
                        <span className="text-purple-800">
                          {weeklyTracking.reduce((sum, day) => sum + day.tofuRemaining, 0).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Summary Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="text-xs text-green-600">Tổng đậu tương chi</div>
                  <div className="text-lg font-bold text-green-700">
                    {weeklyTracking.reduce((sum, day) => sum + day.soybeanInput, 0).toLocaleString()} kg
                  </div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <div className="text-xs text-yellow-600">Tổng đậu phụ thu</div>
                  <div className="text-lg font-bold text-yellow-700">
                    {weeklyTracking.reduce((sum, day) => sum + day.tofuInput, 0).toLocaleString()} kg
                  </div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <div className="text-xs text-red-600">Tổng đậu phụ đã xuất</div>
                  <div className="text-lg font-bold text-red-700">
                    {weeklyTracking.reduce((sum, day) => sum + day.tofuOutput, 0).toLocaleString()} kg
                  </div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <div className="text-xs text-purple-600">Tổng đậu phụ tồn</div>
                  <div className="text-lg font-bold text-purple-700">
                    {weeklyTracking.reduce((sum, day) => sum + day.tofuRemaining, 0).toLocaleString()} kg
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
            LÀM ĐẬU PHỤ - TỔNG HỢP THEO THÁNG
          </CardTitle>
          <p className="text-sm text-gray-600 text-center">
            Bảng thu chi lãi theo từng tháng trong năm {new Date().getFullYear()}
          </p>
        </CardHeader>
        <CardContent>
          {monthlyTofuSummary.length === 0 ? (
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
                      <th colSpan={2} className="border border-black p-1 bg-green-50 text-sm">Đậu phụ</th>
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
                    {monthlyTofuSummary.map((month, index) => (
                      <tr key={index} className={index === monthlyTofuSummary.length - 1 ? "bg-blue-50" : ""}>
                        <td className="border border-black p-2 font-medium text-center">
                          {month.month}
                          {index === monthlyTofuSummary.length - 1 && (
                            <div className="text-xs text-blue-600 mt-1">(Hiện tại)</div>
                          )}
                        </td>
                        {/* THU - Đậu phụ */}
                        <td className="border border-black p-1 text-center font-semibold text-green-600">
                          {month.totalTofuCollected.toLocaleString()}
                        </td>
                        <td className="border border-black p-1 text-center font-semibold text-green-600">
                          {(month.totalTofuCollected * 15).toLocaleString()}
                        </td>
                        {/* THU - Sản phẩm phụ */}
                        <td className="border border-black p-1 text-center font-semibold text-green-600">
                          {Math.round(month.totalTofuCollected * 0.1 * 5).toLocaleString()}
                        </td>
                        {/* CHI - Đậu tương */}
                        <td className="border border-black p-1 text-center font-semibold text-red-600">
                          {month.totalSoybeanInput.toLocaleString()}
                        </td>
                        <td className="border border-black p-1 text-center font-semibold text-red-600">
                          {(month.totalSoybeanInput * 12).toLocaleString()}
                        </td>
                        {/* CHI - Chi khác */}
                        <td className="border border-black p-1 text-center font-semibold text-red-600">
                          {Math.round(month.totalSoybeanInput * 0.02 * 1000).toLocaleString()}
                        </td>
                        {/* THU-CHI (LÃI) */}
                        <td className="border border-black p-1 text-center bg-blue-50">
                          <span className={`font-bold ${
                            ((month.totalTofuCollected * 15) + Math.round(month.totalTofuCollected * 0.1 * 5) - 
                             (month.totalSoybeanInput * 12) - Math.round(month.totalSoybeanInput * 0.02 * 1000)) >= 0 
                            ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {(
                              (month.totalTofuCollected * 15) + Math.round(month.totalTofuCollected * 0.1 * 5) - 
                              (month.totalSoybeanInput * 12) - Math.round(month.totalSoybeanInput * 0.02 * 1000)
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
    </div>
  )
} 