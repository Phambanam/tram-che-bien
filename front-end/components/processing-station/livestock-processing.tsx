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
import { processingStationApi, supplyOutputsApi } from "@/lib/api-client"
import { SimpleTableHeader } from './improved-table-header'

interface DailyLivestockProcessing {
  date: string
  liveAnimalsInput: number // CHI - Lợn hơi chi (con)
  // Thịt nạc
  leanMeatOutput: number // THU - Thịt nạc thu (kg) - từ weekly tracking
  leanMeatActualOutput: number // Thịt nạc thực tế đã xuất (kg) - từ supply outputs
  leanMeatRemaining: number // Thịt nạc tồn (kg) - calculated
  // Xương xổ  
  boneOutput: number // THU - Xương xổ thu (kg) - từ weekly tracking
  boneActualOutput: number // Xương xổ thực tế đã xuất (kg) - từ supply outputs
  boneRemaining: number // Xương xổ tồn (kg) - calculated
  // Thịt xổ lọc
  groundMeatOutput: number // THU - Thịt xổ lọc thu (kg) - từ weekly tracking
  groundMeatActualOutput: number // Thịt xổ lọc thực tế đã xuất (kg) - từ supply outputs
  groundMeatRemaining: number // Thịt xổ lọc tồn (kg) - calculated
  // Lòng
  organsOutput: number // THU - Lòng thu (kg) - từ weekly tracking
  organsActualOutput: number // Lòng thực tế đã xuất (kg) - từ supply outputs
  organsRemaining: number // Lòng tồn (kg) - calculated
  
  note?: string
  // Price fields
  liveAnimalPrice?: number // Giá lợn hơi VND/con
  leanMeatPrice?: number // Giá thịt nạc VND/kg
  bonePrice?: number // Giá xương xổ VND/kg
  groundMeatPrice?: number // Giá thịt xổ lọc VND/kg
  organsPrice?: number // Giá lòng VND/kg
}

interface WeeklyLivestockTracking {
  date: string
  dayOfWeek: string
  liveAnimalsInput: number
  leanMeatOutput: number
  leanMeatActualOutput: number
  leanMeatRemaining: number
  boneOutput: number
  boneActualOutput: number
  boneRemaining: number
  groundMeatOutput: number
  groundMeatActualOutput: number
  groundMeatRemaining: number
  organsOutput: number
  organsActualOutput: number
  organsRemaining: number
  liveAnimalPrice: number
  leanMeatPrice: number
  bonePrice: number
  groundMeatPrice: number
  organsPrice: number
}

interface MonthlyLivestockSummary {
  month: string
  year: number
  monthNumber: number
  totalLiveAnimalsInput: number
  totalLeanMeatOutput: number
  totalLeanMeatActualOutput: number
  totalBoneOutput: number
  totalBoneActualOutput: number
  totalGroundMeatOutput: number
  totalGroundMeatActualOutput: number
  totalOrgansOutput: number
  totalOrgansActualOutput: number
  processingEfficiency: number
  totalRevenue: number
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
    leanMeatOutput: 0,
    leanMeatActualOutput: 0,
    leanMeatRemaining: 0,
    boneOutput: 0,
    boneActualOutput: 0,
    boneRemaining: 0,
    groundMeatOutput: 0,
    groundMeatActualOutput: 0,
    groundMeatRemaining: 0,
    organsOutput: 0,
    organsActualOutput: 0,
    organsRemaining: 0,
    note: "",
    liveAnimalPrice: 0,
    leanMeatPrice: 0,
    bonePrice: 0,
    groundMeatPrice: 0,
    organsPrice: 0
  })
  
  const [editingDailyData, setEditingDailyData] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [dailyUpdateData, setDailyUpdateData] = useState({
    liveAnimalsInput: 0,
    leanMeatOutput: 0,
    leanMeatActualOutput: 0,
    leanMeatRemaining: 0,
    boneOutput: 0,
    boneActualOutput: 0,
    boneRemaining: 0,
    groundMeatOutput: 0,
    groundMeatActualOutput: 0,
    groundMeatRemaining: 0,
    organsOutput: 0,
    organsActualOutput: 0,
    organsRemaining: 0,
    note: "",
    liveAnimalPrice: 0,
    leanMeatPrice: 0,
    bonePrice: 0,
    groundMeatPrice: 0,
    organsPrice: 0
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
        leanMeatOutput: 0,
        leanMeatActualOutput: 0,
        leanMeatRemaining: 0,
        boneOutput: 0,
        boneActualOutput: 0,
        boneRemaining: 0,
        groundMeatOutput: 0,
        groundMeatActualOutput: 0,
        groundMeatRemaining: 0,
        organsOutput: 0,
        organsActualOutput: 0,
        organsRemaining: 0,
        note: "",
        liveAnimalPrice: 0,
        leanMeatPrice: 0,
        bonePrice: 0,
        groundMeatPrice: 0,
        organsPrice: 0
      }
      
      // Get carry over from previous day
      let carryOverAmount = 0
      let carryOverNote = ""
      
      try {
        console.log(`🔄 Checking livestock carry over from ${previousDateStr} to ${dateStr}`)
                  const previousStationResponse = await processingStationApi.getDailyLivestockData(previousDateStr)
          if (previousStationResponse && previousStationResponse.data) {
            const previousLeanMeatOutput = previousStationResponse.data.leanMeatOutput || 0
            const previousLeanMeatActualOutput = previousStationResponse.data.leanMeatActualOutput || 0
            carryOverAmount = Math.max(0, previousLeanMeatOutput - previousLeanMeatActualOutput)
            
            if (carryOverAmount > 0) {
              carryOverNote = `\n📦 Chuyển từ ${format(previousDate, "dd/MM/yyyy")}: +${carryOverAmount}kg thịt nạc`
              console.log(`✅ Livestock carry over found: ${carryOverAmount}kg thịt nạc from ${previousDateStr}`)
            }
        }
      } catch (error) {
        console.log("No livestock carry over data from previous day:", error)
      }

      try {
        const stationResponse = await processingStationApi.getDailyLivestockData(dateStr)
        if (stationResponse && stationResponse.data) {
                      stationData = {
              liveAnimalsInput: stationResponse.data.liveAnimalsInput || 0,
              leanMeatOutput: (stationResponse.data.leanMeatOutput || 0) + carryOverAmount, // Add carry over to lean meat only
              leanMeatActualOutput: stationResponse.data.leanMeatActualOutput || 0,
              leanMeatRemaining: Math.max(0, (stationResponse.data.leanMeatOutput || 0) + carryOverAmount - (stationResponse.data.leanMeatActualOutput || 0)),
              boneOutput: stationResponse.data.boneOutput || 0,
              boneActualOutput: stationResponse.data.boneActualOutput || 0,
              boneRemaining: Math.max(0, (stationResponse.data.boneOutput || 0) - (stationResponse.data.boneActualOutput || 0)),
              groundMeatOutput: stationResponse.data.groundMeatOutput || 0,
              groundMeatActualOutput: stationResponse.data.groundMeatActualOutput || 0,
              groundMeatRemaining: Math.max(0, (stationResponse.data.groundMeatOutput || 0) - (stationResponse.data.groundMeatActualOutput || 0)),
              organsOutput: stationResponse.data.organsOutput || 0,
              organsActualOutput: stationResponse.data.organsActualOutput || 0,
              organsRemaining: Math.max(0, (stationResponse.data.organsOutput || 0) - (stationResponse.data.organsActualOutput || 0)),
              note: (stationResponse.data.note || "") + carryOverNote,
              liveAnimalPrice: stationResponse.data.liveAnimalPrice || 0,
              leanMeatPrice: stationResponse.data.leanMeatPrice || 0,
              bonePrice: stationResponse.data.bonePrice || 0,
              groundMeatPrice: stationResponse.data.groundMeatPrice || 0,
              organsPrice: stationResponse.data.organsPrice || 0
            }
                  } else if (carryOverAmount > 0) {
            // If no current data but have carry over, apply it to lean meat only
            stationData.leanMeatOutput = carryOverAmount
            stationData.leanMeatActualOutput = 0
            stationData.leanMeatRemaining = carryOverAmount
            stationData.note = carryOverNote.trim()
          }
      } catch (error) {
        console.log("No station data found for date, using defaults:", error)
        // Still apply carry over to lean meat only if available
        if (carryOverAmount > 0) {
          stationData.leanMeatOutput = carryOverAmount
          stationData.leanMeatActualOutput = 0
          stationData.leanMeatRemaining = carryOverAmount
          stationData.note = carryOverNote.trim()
        }
      }

      // Get actual output data from supply outputs API (planned outputs for the date)
      let actualOutputs = {
        leanMeat: 0,
        bone: 0,
        groundMeat: 0,
        organs: 0
      }
      
      try {
        console.log(`🔍 Getting livestock actual outputs from supply outputs for ${dateStr}`)
        
        // Get actual outputs from supply outputs (planned for this date)
        const outputsResponse = await supplyOutputsApi.getSupplyOutputs({
          startDate: dateStr,
          endDate: dateStr
        })
        const outputs = Array.isArray(outputsResponse) ? outputsResponse : (outputsResponse as any).data || []
        
        // Calculate actual outputs for livestock products
        const livestockOutputs = outputs.filter((output: any) => {
          const outputDate = output.outputDate ? format(new Date(output.outputDate), "yyyy-MM-dd") : null
          const dateMatch = outputDate === dateStr
          const isPlanned = output.type === "planned"
          
          const productName = (output.product?.name || "").toLowerCase()
          const isLivestockProduct = productName.includes("thịt") || 
                                   productName.includes("xương") || 
                                   productName.includes("lòng")
          
          return dateMatch && isPlanned && isLivestockProduct
        })
        
        // Sum up quantities by product type
        livestockOutputs.forEach((output: any) => {
          const productName = (output.product?.name || "").toLowerCase()
          const quantity = output.quantity || 0
          
          if (productName.includes("thịt nạc")) {
            actualOutputs.leanMeat += quantity
          } else if (productName.includes("xương")) {
            actualOutputs.bone += quantity
          } else if (productName.includes("xổ lọc")) {
            actualOutputs.groundMeat += quantity
          } else if (productName.includes("lòng")) {
            actualOutputs.organs += quantity
          } else if (productName.includes("thịt")) {
            // Generic thịt goes to lean meat
            actualOutputs.leanMeat += quantity
          }
        })
        
        console.log("📊 Livestock actual outputs from supply:", actualOutputs)
        
        // Update station data with actual outputs from supply
        if (stationData.leanMeatActualOutput === 0) {
          stationData.leanMeatActualOutput = actualOutputs.leanMeat
        }
        if (stationData.boneActualOutput === 0) {
          stationData.boneActualOutput = actualOutputs.bone
        }
        if (stationData.groundMeatActualOutput === 0) {
          stationData.groundMeatActualOutput = actualOutputs.groundMeat
        }
        if (stationData.organsActualOutput === 0) {
          stationData.organsActualOutput = actualOutputs.organs
        }
        
        // Recalculate remaining amounts
        stationData.leanMeatRemaining = Math.max(0, stationData.leanMeatOutput - stationData.leanMeatActualOutput)
        stationData.boneRemaining = Math.max(0, stationData.boneOutput - stationData.boneActualOutput)
        stationData.groundMeatRemaining = Math.max(0, stationData.groundMeatOutput - stationData.groundMeatActualOutput)
        stationData.organsRemaining = Math.max(0, stationData.organsOutput - stationData.organsActualOutput)
        
      } catch (error) {
        console.log("No livestock actual outputs found from supply outputs, using defaults:", error)
      }
      
      const processedData: DailyLivestockProcessing = {
        date: dateStr,
        liveAnimalsInput: stationData.liveAnimalsInput,
        leanMeatOutput: stationData.leanMeatOutput,
        leanMeatActualOutput: stationData.leanMeatActualOutput,
        leanMeatRemaining: stationData.leanMeatRemaining,
        boneOutput: stationData.boneOutput,
        boneActualOutput: stationData.boneActualOutput,
        boneRemaining: stationData.boneRemaining,
        groundMeatOutput: stationData.groundMeatOutput,
        groundMeatActualOutput: stationData.groundMeatActualOutput,
        groundMeatRemaining: stationData.groundMeatRemaining,
        organsOutput: stationData.organsOutput,
        organsActualOutput: stationData.organsActualOutput,
        organsRemaining: stationData.organsRemaining,
        note: stationData.note,
        liveAnimalPrice: stationData.liveAnimalPrice,
        leanMeatPrice: stationData.leanMeatPrice,
        bonePrice: stationData.bonePrice,
        groundMeatPrice: stationData.groundMeatPrice,
        organsPrice: stationData.organsPrice
      }

      setDailyLivestockProcessing(processedData)
      setDailyUpdateData({
        liveAnimalsInput: processedData.liveAnimalsInput,
        leanMeatOutput: processedData.leanMeatOutput,
        leanMeatActualOutput: processedData.leanMeatActualOutput,
        leanMeatRemaining: processedData.leanMeatRemaining,
        boneOutput: processedData.boneOutput,
        boneActualOutput: processedData.boneActualOutput,
        boneRemaining: processedData.boneRemaining,
        groundMeatOutput: processedData.groundMeatOutput,
        groundMeatActualOutput: processedData.groundMeatActualOutput,
        groundMeatRemaining: processedData.groundMeatRemaining,
        organsOutput: processedData.organsOutput,
        organsActualOutput: processedData.organsActualOutput,
        organsRemaining: processedData.organsRemaining,
        note: processedData.note || "",
        liveAnimalPrice: processedData.liveAnimalPrice || 0,
        leanMeatPrice: processedData.leanMeatPrice || 0,
        bonePrice: processedData.bonePrice || 0,
        groundMeatPrice: processedData.groundMeatPrice || 0,
        organsPrice: processedData.organsPrice || 0
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

      if (response.success && response.data && response.data.dailyData) {
        setWeeklyLivestockTracking(response.data.dailyData)
      } else {
        setWeeklyLivestockTracking([])
      }
    } catch (error) {
      console.error("Error fetching weekly livestock tracking:", error)
      setWeeklyLivestockTracking([])
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

      if (response.success && response.data && response.data.monthlySummaries) {
        setMonthlyLivestockSummary(response.data.monthlySummaries)
      } else {
        setMonthlyLivestockSummary([])
      }
    } catch (error) {
      console.error("Error fetching monthly livestock summary:", error)
      setMonthlyLivestockSummary([])
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

  // Update daily livestock processing data
  const updateDailyLivestockProcessing = async () => {
    if (!user || (user.role !== "admin" && user.role !== "stationManager")) {
      toast({
        title: "❌ Không có quyền",
        description: "Chỉ admin và trạm trưởng mới có thể chỉnh sửa dữ liệu",
        variant: "destructive"
      })
      return
    }

    setIsUpdating(true)
    try {
      const updateData = {
        date: dailyLivestockProcessing.date,
        liveAnimalsInput: dailyUpdateData.liveAnimalsInput,
        leanMeatOutput: dailyUpdateData.leanMeatOutput,
        leanMeatActualOutput: dailyUpdateData.leanMeatActualOutput,
        leanMeatRemaining: Math.max(0, dailyUpdateData.leanMeatOutput - dailyUpdateData.leanMeatActualOutput),
        boneOutput: dailyUpdateData.boneOutput,
        boneActualOutput: dailyUpdateData.boneActualOutput,
        boneRemaining: Math.max(0, dailyUpdateData.boneOutput - dailyUpdateData.boneActualOutput),
        groundMeatOutput: dailyUpdateData.groundMeatOutput,
        groundMeatActualOutput: dailyUpdateData.groundMeatActualOutput,
        groundMeatRemaining: Math.max(0, dailyUpdateData.groundMeatOutput - dailyUpdateData.groundMeatActualOutput),
        organsOutput: dailyUpdateData.organsOutput,
        organsActualOutput: dailyUpdateData.organsActualOutput,
        organsRemaining: Math.max(0, dailyUpdateData.organsOutput - dailyUpdateData.organsActualOutput),
        note: dailyUpdateData.note,
        liveAnimalPrice: dailyUpdateData.liveAnimalPrice,
        leanMeatPrice: dailyUpdateData.leanMeatPrice,
        bonePrice: dailyUpdateData.bonePrice,
        groundMeatPrice: dailyUpdateData.groundMeatPrice,
        organsPrice: dailyUpdateData.organsPrice
      }

      const response = await processingStationApi.updateDailyLivestockData(updateData)
      
      if (response.success) {
        toast({
          title: "✅ Thành công",
          description: "Đã cập nhật dữ liệu giết mổ lợn"
        })
        
        // Update local state
        setDailyLivestockProcessing(prev => ({
          ...prev,
          ...updateData
        }))
        
        setEditingDailyData(false)
        
        // Reload data to ensure consistency
        await fetchDailyLivestockProcessing(new Date(dailyLivestockProcessing.date))
      } else {
        throw new Error(response.message || "Không thể cập nhật dữ liệu")
      }
    } catch (error: any) {
      console.error("Error updating daily livestock processing:", error)
      toast({
        title: "❌ Lỗi",
        description: error.message || "Không thể cập nhật dữ liệu giết mổ lợn",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Beef className="h-6 w-6 text-red-600" />
        <h2 className="text-2xl font-bold text-red-800">Giết mổ lợn</h2>
        <Badge className="bg-red-100 text-red-800">
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
                      const currentLeanMeatPrice = editingDailyData ? 
                        dailyUpdateData.leanMeatPrice || 0 :
                        dailyLivestockProcessing.leanMeatPrice || 0
                      
                      const currentLiveAnimalPrice = editingDailyData ? 
                        dailyUpdateData.liveAnimalPrice || 0 :
                        dailyLivestockProcessing.liveAnimalPrice || 0
                      
                      const currentLeanMeatOutput = editingDailyData ? dailyUpdateData.leanMeatOutput : dailyLivestockProcessing.leanMeatOutput
                      const currentLiveAnimalsInput = editingDailyData ? dailyUpdateData.liveAnimalsInput : dailyLivestockProcessing.liveAnimalsInput
                      
                      if (currentLeanMeatPrice === 0 || currentLiveAnimalPrice === 0) {
                        return (
                          <span className="text-gray-500 text-xl">
                            Chưa có giá
                          </span>
                        )
                      }
                      
                      const leanMeatRevenue = currentLeanMeatOutput * currentLeanMeatPrice
                      const livestockCost = currentLiveAnimalsInput * currentLiveAnimalPrice
                      const dailyProfit = leanMeatRevenue - livestockCost
                      
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
                      const currentLeanMeatPrice = editingDailyData ? 
                        dailyUpdateData.leanMeatPrice || 0 :
                        dailyLivestockProcessing.leanMeatPrice || 0
                      
                      const currentLiveAnimalPrice = editingDailyData ? 
                        dailyUpdateData.liveAnimalPrice || 0 :
                        dailyLivestockProcessing.liveAnimalPrice || 0
                      
                      const currentLeanMeatOutput = editingDailyData ? dailyUpdateData.leanMeatOutput : dailyLivestockProcessing.leanMeatOutput
                      const currentLiveAnimalsInput = editingDailyData ? dailyUpdateData.liveAnimalsInput : dailyLivestockProcessing.liveAnimalsInput
                      
                      if (currentLeanMeatPrice && currentLiveAnimalPrice) {
                        const revenue = currentLeanMeatOutput * currentLeanMeatPrice
                        const cost = currentLiveAnimalsInput * currentLiveAnimalPrice
                        return (
                          <>Thu: {revenue.toLocaleString('vi-VN')}đ - Chi: {cost.toLocaleString('vi-VN')}đ{editingDailyData && " (Real-time)"}</>
                        )
                      }
                      return "Cần nhập đầy đủ giá thịt nạc và lợn hơi"
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

              

                {/* Layout giống hình: GIẾT MỔ LỢN */}
                <div className="space-y-6">
                  {/* Lợn hơi chi và giá */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-green-700 mb-2">Lợn hơi chi:</div>
                        <div className="text-3xl font-bold text-green-800">
                          {editingDailyData ? (
                            <Input
                              type="number"
                              value={dailyUpdateData.liveAnimalsInput}
                              onChange={(e) => setDailyUpdateData(prev => ({ 
                                ...prev, 
                                liveAnimalsInput: Number(e.target.value) || 0
                              }))}
                              className="w-20 h-12 text-center text-3xl font-bold bg-white border-green-300"
                              placeholder="0"
                            />
                          ) : (
                            <span>{dailyLivestockProcessing.liveAnimalsInput}</span>
                          )}
                          <span className="text-xl ml-1">con</span>
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          {editingDailyData ? "(Trạm trưởng chỉnh sửa)" : "(Số liệu từ bảng theo dõi tuần)"}
                        </div>
                      </div>
                    </div>

                    {/* Giá lợn hơi */}
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-red-700 mb-2">Giá lợn hơi:</div>
                        <div className="text-xl font-bold text-red-800">
                          {editingDailyData ? (
                            <Input
                              type="number"
                              value={dailyUpdateData.liveAnimalPrice}
                              onChange={(e) => setDailyUpdateData(prev => ({ 
                                ...prev, 
                                liveAnimalPrice: Number(e.target.value) || 0
                              }))}
                              className="w-32 h-10 text-center text-xl font-bold bg-white border-red-300"
                              placeholder="0"
                            />
                          ) : (
                            <span>{(dailyLivestockProcessing.liveAnimalPrice || 0).toLocaleString('vi-VN')}</span>
                          )}
                          <span className="text-sm ml-1">đ/con</span>
                        </div>
                        <div className="text-xs text-red-600 mt-1">
                          (Trạm trưởng nhập tay)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Grid layout cho các sản phẩm từ giết mổ lợn */}
                  <div className="space-y-4">
                    {/* Thịt nạc - Row 1 */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <div className="text-center">
                          <div className="text-sm font-medium text-yellow-700 mb-1">thịt nạc thu:</div>
                          <div className="text-lg font-bold text-yellow-800">
                            {editingDailyData ? (
                              <Input
                                type="number"
                                value={dailyUpdateData.leanMeatOutput}
                                onChange={(e) => setDailyUpdateData(prev => ({ 
                                  ...prev, 
                                  leanMeatOutput: Number(e.target.value) || 0
                                }))}
                                className="w-16 h-8 text-center text-lg font-bold bg-white border-yellow-300"
                                placeholder="0"
                              />
                            ) : (
                              <span>{dailyLivestockProcessing.leanMeatOutput}</span>
                            )}
                            <span className="text-sm ml-1">kg</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <div className="text-center">
                          <div className="text-sm font-medium text-yellow-700 mb-1">thịt nạc xuất:</div>
                          <div className="text-lg font-bold text-yellow-800">
                            {editingDailyData ? (
                              <Input
                                type="number"
                                value={dailyUpdateData.leanMeatActualOutput}
                                onChange={(e) => setDailyUpdateData(prev => ({ 
                                  ...prev, 
                                  leanMeatActualOutput: Number(e.target.value) || 0
                                }))}
                                className="w-16 h-8 text-center text-lg font-bold bg-white border-yellow-300"
                                placeholder="0"
                              />
                            ) : (
                              <span>{dailyLivestockProcessing.leanMeatActualOutput}</span>
                            )}
                            <span className="text-sm ml-1">kg</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <div className="text-center">
                          <div className="text-sm font-medium text-yellow-700 mb-1">thịt nạc tồn:</div>
                          <div className="text-lg font-bold text-yellow-800">
                            <span>{editingDailyData ? Math.max(0, dailyUpdateData.leanMeatOutput - dailyUpdateData.leanMeatActualOutput) : dailyLivestockProcessing.leanMeatRemaining}</span>
                            <span className="text-sm ml-1">kg</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-yellow-50 border-2 border-yellow-200 rounded p-3">
                        <div className="text-center">
                          <div className="text-sm font-medium text-yellow-700 mb-1">Giá thịt nạc:</div>
                          <div className="text-lg font-bold text-yellow-800">
                            {editingDailyData ? (
                              <Input
                                type="number"
                                value={dailyUpdateData.leanMeatPrice}
                                onChange={(e) => setDailyUpdateData(prev => ({ 
                                  ...prev, 
                                  leanMeatPrice: Number(e.target.value) || 0
                                }))}
                                className="w-20 h-8 text-center text-sm font-bold bg-white border-yellow-300"
                                placeholder="0"
                              />
                            ) : (
                              <span className="text-sm">{(dailyLivestockProcessing.leanMeatPrice || 0).toLocaleString('vi-VN')}</span>
                            )}
                            <span className="text-xs ml-1">đ/kg</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Xương xổ - Row 2 */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-pink-50 border border-pink-200 rounded p-3">
                        <div className="text-center">
                          <div className="text-sm font-medium text-pink-700 mb-1">Xương xổ thu:</div>
                          <div className="text-lg font-bold text-pink-800">
                            {editingDailyData ? (
                              <Input
                                type="number"
                                value={dailyUpdateData.boneOutput}
                                onChange={(e) => setDailyUpdateData(prev => ({ 
                                  ...prev, 
                                  boneOutput: Number(e.target.value) || 0
                                }))}
                                className="w-16 h-8 text-center text-lg font-bold bg-white border-pink-300"
                                placeholder="0"
                              />
                            ) : (
                              <span>{dailyLivestockProcessing.boneOutput}</span>
                            )}
                            <span className="text-sm ml-1">kg</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-pink-50 border border-pink-200 rounded p-3">
                        <div className="text-center">
                          <div className="text-sm font-medium text-pink-700 mb-1">Xương xổ xuất:</div>
                          <div className="text-lg font-bold text-pink-800">
                            {editingDailyData ? (
                              <Input
                                type="number"
                                value={dailyUpdateData.boneActualOutput}
                                onChange={(e) => setDailyUpdateData(prev => ({ 
                                  ...prev, 
                                  boneActualOutput: Number(e.target.value) || 0
                                }))}
                                className="w-16 h-8 text-center text-lg font-bold bg-white border-pink-300"
                                placeholder="0"
                              />
                            ) : (
                              <span>{dailyLivestockProcessing.boneActualOutput}</span>
                            )}
                            <span className="text-sm ml-1">kg</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-pink-50 border border-pink-200 rounded p-3">
                        <div className="text-center">
                          <div className="text-sm font-medium text-pink-700 mb-1">Xương xổ tồn:</div>
                          <div className="text-lg font-bold text-pink-800">
                            <span>{editingDailyData ? Math.max(0, dailyUpdateData.boneOutput - dailyUpdateData.boneActualOutput) : dailyLivestockProcessing.boneRemaining}</span>
                            <span className="text-sm ml-1">kg</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-pink-50 border-2 border-pink-200 rounded p-3">
                        <div className="text-center">
                          <div className="text-sm font-medium text-pink-700 mb-1">Giá xương xổ:</div>
                          <div className="text-lg font-bold text-pink-800">
                            {editingDailyData ? (
                              <Input
                                type="number"
                                value={dailyUpdateData.bonePrice}
                                onChange={(e) => setDailyUpdateData(prev => ({ 
                                  ...prev, 
                                  bonePrice: Number(e.target.value) || 0
                                }))}
                                className="w-20 h-8 text-center text-sm font-bold bg-white border-pink-300"
                                placeholder="0"
                              />
                            ) : (
                              <span className="text-sm">{(dailyLivestockProcessing.bonePrice || 0).toLocaleString('vi-VN')}</span>
                            )}
                            <span className="text-xs ml-1">đ/kg</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Thịt xổ lọc - Row 3 */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-cyan-50 border border-cyan-200 rounded p-3">
                        <div className="text-center">
                          <div className="text-sm font-medium text-cyan-700 mb-1">Thịt xổ lọc thu:</div>
                          <div className="text-lg font-bold text-cyan-800">
                            {editingDailyData ? (
                              <Input
                                type="number"
                                value={dailyUpdateData.groundMeatOutput}
                                onChange={(e) => setDailyUpdateData(prev => ({ 
                                  ...prev, 
                                  groundMeatOutput: Number(e.target.value) || 0
                                }))}
                                className="w-16 h-8 text-center text-lg font-bold bg-white border-cyan-300"
                                placeholder="0"
                              />
                            ) : (
                              <span>{dailyLivestockProcessing.groundMeatOutput}</span>
                            )}
                            <span className="text-sm ml-1">kg</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-cyan-50 border border-cyan-200 rounded p-3">
                        <div className="text-center">
                          <div className="text-sm font-medium text-cyan-700 mb-1">Thịt xổ lọc xuất:</div>
                          <div className="text-lg font-bold text-cyan-800">
                            {editingDailyData ? (
                              <Input
                                type="number"
                                value={dailyUpdateData.groundMeatActualOutput}
                                onChange={(e) => setDailyUpdateData(prev => ({ 
                                  ...prev, 
                                  groundMeatActualOutput: Number(e.target.value) || 0
                                }))}
                                className="w-16 h-8 text-center text-lg font-bold bg-white border-cyan-300"
                                placeholder="0"
                              />
                            ) : (
                              <span>{dailyLivestockProcessing.groundMeatActualOutput}</span>
                            )}
                            <span className="text-sm ml-1">kg</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-cyan-50 border border-cyan-200 rounded p-3">
                        <div className="text-center">
                          <div className="text-sm font-medium text-cyan-700 mb-1">Thịt xổ lọc tồn:</div>
                          <div className="text-lg font-bold text-cyan-800">
                            <span>{editingDailyData ? Math.max(0, dailyUpdateData.groundMeatOutput - dailyUpdateData.groundMeatActualOutput) : dailyLivestockProcessing.groundMeatRemaining}</span>
                            <span className="text-sm ml-1">kg</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-cyan-50 border-2 border-cyan-200 rounded p-3">
                        <div className="text-center">
                          <div className="text-sm font-medium text-cyan-700 mb-1">Giá thịt xổ lọc:</div>
                          <div className="text-lg font-bold text-cyan-800">
                            {editingDailyData ? (
                              <Input
                                type="number"
                                value={dailyUpdateData.groundMeatPrice}
                                onChange={(e) => setDailyUpdateData(prev => ({ 
                                  ...prev, 
                                  groundMeatPrice: Number(e.target.value) || 0
                                }))}
                                className="w-20 h-8 text-center text-sm font-bold bg-white border-cyan-300"
                                placeholder="0"
                              />
                            ) : (
                              <span className="text-sm">{(dailyLivestockProcessing.groundMeatPrice || 0).toLocaleString('vi-VN')}</span>
                            )}
                            <span className="text-xs ml-1">đ/kg</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Lòng - Row 4 */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-purple-50 border border-purple-200 rounded p-3">
                        <div className="text-center">
                          <div className="text-sm font-medium text-purple-700 mb-1">Lòng thu:</div>
                          <div className="text-lg font-bold text-purple-800">
                            {editingDailyData ? (
                              <Input
                                type="number"
                                value={dailyUpdateData.organsOutput}
                                onChange={(e) => setDailyUpdateData(prev => ({ 
                                  ...prev, 
                                  organsOutput: Number(e.target.value) || 0
                                }))}
                                className="w-16 h-8 text-center text-lg font-bold bg-white border-purple-300"
                                placeholder="0"
                              />
                            ) : (
                              <span>{dailyLivestockProcessing.organsOutput}</span>
                            )}
                            <span className="text-sm ml-1">kg</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded p-3">
                        <div className="text-center">
                          <div className="text-sm font-medium text-purple-700 mb-1">Lòng xuất:</div>
                          <div className="text-lg font-bold text-purple-800">
                            {editingDailyData ? (
                              <Input
                                type="number"
                                value={dailyUpdateData.organsActualOutput}
                                onChange={(e) => setDailyUpdateData(prev => ({ 
                                  ...prev, 
                                  organsActualOutput: Number(e.target.value) || 0
                                }))}
                                className="w-16 h-8 text-center text-lg font-bold bg-white border-purple-300"
                                placeholder="0"
                              />
                            ) : (
                              <span>{dailyLivestockProcessing.organsActualOutput}</span>
                            )}
                            <span className="text-sm ml-1">kg</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded p-3">
                        <div className="text-center">
                          <div className="text-sm font-medium text-purple-700 mb-1">Lòng tồn:</div>
                          <div className="text-lg font-bold text-purple-800">
                            <span>{editingDailyData ? Math.max(0, dailyUpdateData.organsOutput - dailyUpdateData.organsActualOutput) : dailyLivestockProcessing.organsRemaining}</span>
                            <span className="text-sm ml-1">kg</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-purple-50 border-2 border-purple-200 rounded p-3">
                        <div className="text-center">
                          <div className="text-sm font-medium text-purple-700 mb-1">Giá lòng:</div>
                          <div className="text-lg font-bold text-purple-800">
                            {editingDailyData ? (
                              <Input
                                type="number"
                                value={dailyUpdateData.organsPrice}
                                onChange={(e) => setDailyUpdateData(prev => ({ 
                                  ...prev, 
                                  organsPrice: Number(e.target.value) || 0
                                }))}
                                className="w-20 h-8 text-center text-sm font-bold bg-white border-purple-300"
                                placeholder="0"
                              />
                            ) : (
                              <span className="text-sm">{(dailyLivestockProcessing.organsPrice || 0).toLocaleString('vi-VN')}</span>
                            )}
                            <span className="text-xs ml-1">đ/kg</span>
                          </div>
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
                    placeholder="Ghi chú về quá trình giết mổ và phân phối thịt lợn trong ngày"
                  />
                </div>
              )}

              {dailyLivestockProcessing.note && !editingDailyData && (
                <div className="bg-gray-50 p-3 rounded border">
                  <div className="text-sm font-medium text-gray-700">Ghi chú:</div>
                  <div className="text-sm text-gray-600 mt-1">{dailyLivestockProcessing.note}</div>
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
                        onClick={updateDailyLivestockProcessing}
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
                            liveAnimalsInput: dailyLivestockProcessing.liveAnimalsInput,
                            leanMeatOutput: dailyLivestockProcessing.leanMeatOutput,
                            leanMeatActualOutput: dailyLivestockProcessing.leanMeatActualOutput,
                            leanMeatRemaining: dailyLivestockProcessing.leanMeatRemaining,
                            boneOutput: dailyLivestockProcessing.boneOutput,
                            boneActualOutput: dailyLivestockProcessing.boneActualOutput,
                            boneRemaining: dailyLivestockProcessing.boneRemaining,
                            groundMeatOutput: dailyLivestockProcessing.groundMeatOutput,
                            groundMeatActualOutput: dailyLivestockProcessing.groundMeatActualOutput,
                            groundMeatRemaining: dailyLivestockProcessing.groundMeatRemaining,
                            organsOutput: dailyLivestockProcessing.organsOutput,
                            organsActualOutput: dailyLivestockProcessing.organsActualOutput,
                            organsRemaining: dailyLivestockProcessing.organsRemaining,
                            note: dailyLivestockProcessing.note || "",
                            liveAnimalPrice: dailyLivestockProcessing.liveAnimalPrice || 0,
                            leanMeatPrice: dailyLivestockProcessing.leanMeatPrice || 0,
                            bonePrice: dailyLivestockProcessing.bonePrice || 0,
                            groundMeatPrice: dailyLivestockProcessing.groundMeatPrice || 0,
                            organsPrice: dailyLivestockProcessing.organsPrice || 0
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
                  Dữ liệu thực tế từ API. Trạm trưởng có thể chỉnh sửa dữ liệu ngày.
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
              <div className="overflow-x-auto">
                <Table className="border">
                  <TableHeader>
                    <TableRow>
                      <TableHead rowSpan={3} className="text-center align-middle border">NGÀY</TableHead>
                      <TableHead rowSpan={3} className="text-center align-middle border">TỔNG THU<br/>(1.000đ)</TableHead>
                      <TableHead colSpan={8} className="text-center border">THU</TableHead>  
                      <TableHead rowSpan={3} className="text-center align-middle border">TỔNG CHI<br/>(1.000đ)</TableHead>
                      <TableHead colSpan={2} className="text-center border">CHI</TableHead>
                      <TableHead rowSpan={3} className="text-center align-middle border">THU-CHI<br/>(LÃI)<br/>(1.000đ)</TableHead>
                    </TableRow>
                    <TableRow>
                      <TableHead colSpan={8} className="text-center border">TRONG ĐÓ</TableHead>
                      <TableHead colSpan={2} className="text-center border">TRONG ĐÓ</TableHead>
                    </TableRow> 
                    <TableRow>
                      <TableHead className="text-center border">Thịt xổ lọc<br/>Số lượng (kg)</TableHead>
                      <TableHead className="text-center border">Thành Tiền<br/>(1.000đ)</TableHead>
                      <TableHead className="text-center border">Thịt nạc<br/>Số lượng (kg)</TableHead>
                      <TableHead className="text-center border">Thành Tiền<br/>(1.000đ)</TableHead>
                      <TableHead className="text-center border">Xương xổ<br/>Số lượng (kg)</TableHead>
                      <TableHead className="text-center border">Thành Tiền<br/>(1.000đ)</TableHead>
                      <TableHead className="text-center border">Lòng<br/>Số lượng (kg)</TableHead>
                      <TableHead className="text-center border">Thành Tiền<br/>(1.000đ)</TableHead>
                      <TableHead className="text-center border">Lợn hơi<br/>Số lượng (con)</TableHead>
                      <TableHead className="text-center border">Thành Tiền<br/>(1.000đ)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weeklyLivestockTracking && weeklyLivestockTracking.length > 0 ? (
                      weeklyLivestockTracking.map((day) => {
                        // Calculate totals
                        const groundMeatRevenue = (day.groundMeatActualOutput * day.groundMeatPrice) / 1000
                        const leanMeatRevenue = (day.leanMeatActualOutput * day.leanMeatPrice) / 1000
                        const boneRevenue = (day.boneActualOutput * day.bonePrice) / 1000
                        const organsRevenue = (day.organsActualOutput * day.organsPrice) / 1000
                        const totalRevenue = groundMeatRevenue + leanMeatRevenue + boneRevenue + organsRevenue
                        const livestockCost = (day.liveAnimalsInput * day.liveAnimalPrice) / 1000
                        const totalCost = livestockCost
                        const profit = totalRevenue - totalCost

                        return (
                          <TableRow key={day.date} className="border-b">
                            <TableCell className="text-center border font-medium">{format(new Date(day.date), "dd/MM")}</TableCell>
                            <TableCell className="text-center border font-bold text-blue-700">
                              {totalRevenue.toFixed(0)}
                            </TableCell>
                            {/* THU - Thịt xổ lọc */}
                            <TableCell className="text-center border">{day.groundMeatActualOutput}</TableCell>
                            <TableCell className="text-center border">{groundMeatRevenue.toFixed(0)}</TableCell>
                            {/* THU - Thịt nạc */}
                            <TableCell className="text-center border">{day.leanMeatActualOutput}</TableCell>
                            <TableCell className="text-center border">{leanMeatRevenue.toFixed(0)}</TableCell>
                            {/* THU - Xương xổ */}
                            <TableCell className="text-center border">{day.boneActualOutput}</TableCell>
                            <TableCell className="text-center border">{boneRevenue.toFixed(0)}</TableCell>
                            {/* THU - Lòng */}
                            <TableCell className="text-center border">{day.organsActualOutput}</TableCell>
                            <TableCell className="text-center border">{organsRevenue.toFixed(0)}</TableCell>
                            {/* TỔNG CHI */}
                            <TableCell className="text-center border font-bold text-red-700">
                              {totalCost.toFixed(0)}
                            </TableCell>
                            {/* CHI - Lợn hơi */}
                            <TableCell className="text-center border">{day.liveAnimalsInput}</TableCell>
                            <TableCell className="text-center border">{livestockCost.toFixed(0)}</TableCell>
                            {/* THU-CHI (LÃI) */}
                            <TableCell className={`text-center border font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {profit >= 0 ? '+' : ''}{profit.toFixed(0)}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={14} className="text-center text-gray-500 py-8">
                          Không có dữ liệu cho tuần đã chọn
                        </TableCell>
                      </TableRow>
                    )}
                    
                    {/* Tổng cộng */}
                    {weeklyLivestockTracking && weeklyLivestockTracking.length > 0 && (
                      <TableRow className="bg-gradient-to-r from-gray-100 to-gray-200 font-semibold border-t-2">
                        <TableCell className="text-center border font-bold">📊 Tổng cộng</TableCell>
                        {/* TỔNG THU */}
                        <TableCell className="text-center border font-bold text-blue-700">
                          {weeklyLivestockTracking.reduce((sum, day) => {
                            const groundMeatRevenue = (day.groundMeatActualOutput * day.groundMeatPrice) / 1000
                            const leanMeatRevenue = (day.leanMeatActualOutput * day.leanMeatPrice) / 1000
                            const boneRevenue = (day.boneActualOutput * day.bonePrice) / 1000
                            const organsRevenue = (day.organsActualOutput * day.organsPrice) / 1000
                            return sum + groundMeatRevenue + leanMeatRevenue + boneRevenue + organsRevenue
                          }, 0).toFixed(0)}
                        </TableCell>
                        {/* THU - Thịt xổ lọc */}
                        <TableCell className="text-center border font-bold">
                          {weeklyLivestockTracking.reduce((sum, day) => sum + day.groundMeatActualOutput, 0)}
                        </TableCell>
                        <TableCell className="text-center border font-bold">
                          {weeklyLivestockTracking.reduce((sum, day) => sum + (day.groundMeatActualOutput * day.groundMeatPrice) / 1000, 0).toFixed(0)}
                        </TableCell>
                        {/* THU - Thịt nạc */}
                        <TableCell className="text-center border font-bold">
                          {weeklyLivestockTracking.reduce((sum, day) => sum + day.leanMeatActualOutput, 0)}
                        </TableCell>
                        <TableCell className="text-center border font-bold">
                          {weeklyLivestockTracking.reduce((sum, day) => sum + (day.leanMeatActualOutput * day.leanMeatPrice) / 1000, 0).toFixed(0)}
                        </TableCell>
                        {/* THU - Xương xổ */}
                        <TableCell className="text-center border font-bold">
                          {weeklyLivestockTracking.reduce((sum, day) => sum + day.boneActualOutput, 0)}
                        </TableCell>
                        <TableCell className="text-center border font-bold">
                          {weeklyLivestockTracking.reduce((sum, day) => sum + (day.boneActualOutput * day.bonePrice) / 1000, 0).toFixed(0)}
                        </TableCell>
                        {/* THU - Lòng */}
                        <TableCell className="text-center border font-bold">
                          {weeklyLivestockTracking.reduce((sum, day) => sum + day.organsActualOutput, 0)}
                        </TableCell>
                        <TableCell className="text-center border font-bold">
                          {weeklyLivestockTracking.reduce((sum, day) => sum + (day.organsActualOutput * day.organsPrice) / 1000, 0).toFixed(0)}
                        </TableCell>
                        {/* TỔNG CHI */}
                        <TableCell className="text-center border font-bold text-red-700">
                          {weeklyLivestockTracking.reduce((sum, day) => sum + (day.liveAnimalsInput * day.liveAnimalPrice) / 1000, 0).toFixed(0)}
                        </TableCell>
                        {/* CHI - Lợn hơi */}
                        <TableCell className="text-center border font-bold">
                          {weeklyLivestockTracking.reduce((sum, day) => sum + day.liveAnimalsInput, 0)}
                        </TableCell>
                        <TableCell className="text-center border font-bold">
                          {weeklyLivestockTracking.reduce((sum, day) => sum + (day.liveAnimalsInput * day.liveAnimalPrice) / 1000, 0).toFixed(0)}
                        </TableCell>
                        {/* THU-CHI (LÃI) */}
                        <TableCell className="text-center border font-bold">
                          {(() => {
                            const totalRevenue = weeklyLivestockTracking.reduce((sum, day) => {
                              const groundMeatRevenue = (day.groundMeatActualOutput * day.groundMeatPrice) / 1000
                              const leanMeatRevenue = (day.leanMeatActualOutput * day.leanMeatPrice) / 1000
                              const boneRevenue = (day.boneActualOutput * day.bonePrice) / 1000
                              const organsRevenue = (day.organsActualOutput * day.organsPrice) / 1000
                              return sum + groundMeatRevenue + leanMeatRevenue + boneRevenue + organsRevenue
                            }, 0)
                            const totalCost = weeklyLivestockTracking.reduce((sum, day) => sum + (day.liveAnimalsInput * day.liveAnimalPrice) / 1000, 0)
                            const profit = totalRevenue - totalCost
                            return (
                              <span className={profit >= 0 ? "text-green-600" : "text-red-600"}>
                                {profit >= 0 ? "+" : ""}{profit.toFixed(0)}
                              </span>
                            )
                          })()}
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
              <div className="overflow-x-auto">
                <Table className="border">
                  <TableHeader>
                    <TableRow>
                      <TableHead rowSpan={3} className="text-center align-middle border">THÁNG</TableHead>
                      <TableHead rowSpan={3} className="text-center align-middle border">TỔNG THU<br/>(1.000đ)</TableHead>
                      <TableHead colSpan={8} className="text-center border">THU</TableHead>  
                      <TableHead rowSpan={3} className="text-center align-middle border">TỔNG CHI<br/>(1.000đ)</TableHead>
                      <TableHead colSpan={2} className="text-center border">CHI</TableHead>
                      <TableHead rowSpan={3} className="text-center align-middle border">THU-CHI<br/>(LÃI)<br/>(1.000đ)</TableHead>
                    </TableRow>
                    <TableRow>
                      <TableHead colSpan={8} className="text-center border">TRONG ĐÓ</TableHead>
                      <TableHead colSpan={2} className="text-center border">TRONG ĐÓ</TableHead>
                    </TableRow> 
                    <TableRow>
                      <TableHead className="text-center border">Thịt xổ lọc<br/>Số lượng (kg)</TableHead>
                      <TableHead className="text-center border">Thành Tiền<br/>(1.000đ)</TableHead>
                      <TableHead className="text-center border">Thịt nạc<br/>Số lượng (kg)</TableHead>
                      <TableHead className="text-center border">Thành Tiền<br/>(1.000đ)</TableHead>
                      <TableHead className="text-center border">Xương xổ<br/>Số lượng (kg)</TableHead>
                      <TableHead className="text-center border">Thành Tiền<br/>(1.000đ)</TableHead>
                      <TableHead className="text-center border">Lòng<br/>Số lượng (kg)</TableHead>
                      <TableHead className="text-center border">Thành Tiền<br/>(1.000đ)</TableHead>
                      <TableHead className="text-center border">Lợn hơi<br/>Số lượng (con)</TableHead>
                      <TableHead className="text-center border">Thành Tiền<br/>(1.000đ)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyLivestockSummary && monthlyLivestockSummary.length > 0 ? (
                      monthlyLivestockSummary.map((month) => {
                        // Calculate revenue breakdown (thousands VND)
                        const groundMeatRevenue = Math.round((month.totalGroundMeatActualOutput * 80000) / 1000) // 80k per kg
                        const leanMeatRevenue = Math.round((month.totalLeanMeatActualOutput * 120000) / 1000) // 120k per kg
                        const boneRevenue = Math.round((month.totalBoneActualOutput * 30000) / 1000) // 30k per kg
                        const organsRevenue = Math.round((month.totalOrgansActualOutput * 50000) / 1000) // 50k per kg
                        const totalRevenue = groundMeatRevenue + leanMeatRevenue + boneRevenue + organsRevenue
                        const totalCost = Math.round((month.livestockCost + month.otherCosts) / 1000)
                        const profit = totalRevenue - totalCost
                        
                        return (
                          <TableRow key={month.month} className="border-b">
                            {/* THÁNG */}
                            <TableCell className="text-center border font-medium">{month.month}</TableCell>
                            {/* TỔNG THU */}
                            <TableCell className="text-center border font-bold text-blue-700">
                              {totalRevenue}
                            </TableCell>
                            {/* THU - Thịt xổ lọc */}
                            <TableCell className="text-center border">{month.totalGroundMeatActualOutput}</TableCell>
                            <TableCell className="text-center border">{groundMeatRevenue}</TableCell>
                            {/* THU - Thịt nạc */}
                            <TableCell className="text-center border">{month.totalLeanMeatActualOutput}</TableCell>
                            <TableCell className="text-center border">{leanMeatRevenue}</TableCell>
                            {/* THU - Xương xổ */}
                            <TableCell className="text-center border">{month.totalBoneActualOutput}</TableCell>
                            <TableCell className="text-center border">{boneRevenue}</TableCell>
                            {/* THU - Lòng */}
                            <TableCell className="text-center border">{month.totalOrgansActualOutput}</TableCell>
                            <TableCell className="text-center border">{organsRevenue}</TableCell>
                            {/* TỔNG CHI */}
                            <TableCell className="text-center border font-bold text-red-700">
                              {totalCost}
                            </TableCell>
                            {/* CHI - Lợn hơi */}
                            <TableCell className="text-center border">{month.totalLiveAnimalsInput}</TableCell>
                            <TableCell className="text-center border">{totalCost}</TableCell>
                            {/* THU-CHI (LÃI) */}
                            <TableCell className={`text-center border font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {profit >= 0 ? '+' : ''}{profit}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={14} className="text-center text-gray-500 py-8">
                          Không có dữ liệu cho tháng đã chọn
                        </TableCell>
                      </TableRow>
                    )}
                    
                    {/* Tổng cộng */}
                    {monthlyLivestockSummary && monthlyLivestockSummary.length > 0 && (
                      <TableRow className="bg-gradient-to-r from-gray-100 to-gray-200 font-semibold border-t-2">
                        {/* THÁNG */}
                        <TableCell className="text-center border font-bold">📊 Tổng cộng</TableCell>
                        {/* TỔNG THU */}
                        <TableCell className="text-center border font-bold text-blue-700">
                          {monthlyLivestockSummary.reduce((sum, month) => {
                            const groundMeatRevenue = Math.round((month.totalGroundMeatActualOutput * 80000) / 1000)
                            const leanMeatRevenue = Math.round((month.totalLeanMeatActualOutput * 120000) / 1000)
                            const boneRevenue = Math.round((month.totalBoneActualOutput * 30000) / 1000)
                            const organsRevenue = Math.round((month.totalOrgansActualOutput * 50000) / 1000)
                            return sum + groundMeatRevenue + leanMeatRevenue + boneRevenue + organsRevenue
                          }, 0)}
                        </TableCell>
                        {/* THU - Thịt xổ lọc */}
                        <TableCell className="text-center border font-bold">
                          {monthlyLivestockSummary.reduce((sum, month) => sum + month.totalGroundMeatActualOutput, 0)}
                        </TableCell>
                        <TableCell className="text-center border font-bold">
                          {monthlyLivestockSummary.reduce((sum, month) => sum + Math.round((month.totalGroundMeatActualOutput * 80000) / 1000), 0)}
                        </TableCell>
                        {/* THU - Thịt nạc */}
                        <TableCell className="text-center border font-bold">
                          {monthlyLivestockSummary.reduce((sum, month) => sum + month.totalLeanMeatActualOutput, 0)}
                        </TableCell>
                        <TableCell className="text-center border font-bold">
                          {monthlyLivestockSummary.reduce((sum, month) => sum + Math.round((month.totalLeanMeatActualOutput * 120000) / 1000), 0)}
                        </TableCell>
                        {/* THU - Xương xổ */}
                        <TableCell className="text-center border font-bold">
                          {monthlyLivestockSummary.reduce((sum, month) => sum + month.totalBoneActualOutput, 0)}
                        </TableCell>
                        <TableCell className="text-center border font-bold">
                          {monthlyLivestockSummary.reduce((sum, month) => sum + Math.round((month.totalBoneActualOutput * 30000) / 1000), 0)}
                        </TableCell>
                        {/* THU - Lòng */}
                        <TableCell className="text-center border font-bold">
                          {monthlyLivestockSummary.reduce((sum, month) => sum + month.totalOrgansActualOutput, 0)}
                        </TableCell>
                        <TableCell className="text-center border font-bold">
                          {monthlyLivestockSummary.reduce((sum, month) => sum + Math.round((month.totalOrgansActualOutput * 50000) / 1000), 0)}
                        </TableCell>
                        {/* TỔNG CHI */}
                        <TableCell className="text-center border font-bold text-red-700">
                          {monthlyLivestockSummary.reduce((sum, month) => sum + Math.round((month.livestockCost + month.otherCosts) / 1000), 0)}
                        </TableCell>
                        {/* CHI - Lợn hơi */}
                        <TableCell className="text-center border font-bold">
                          {monthlyLivestockSummary.reduce((sum, month) => sum + month.totalLiveAnimalsInput, 0)}
                        </TableCell>
                        <TableCell className="text-center border font-bold">
                          {monthlyLivestockSummary.reduce((sum, month) => sum + Math.round((month.livestockCost + month.otherCosts) / 1000), 0)}
                        </TableCell>
                        {/* THU-CHI (LÃI) */}
                        <TableCell className="text-center border font-bold">
                          {(() => {
                            const totalRevenue = monthlyLivestockSummary.reduce((sum, month) => {
                              const groundMeatRevenue = Math.round((month.totalGroundMeatActualOutput * 80000) / 1000)
                              const leanMeatRevenue = Math.round((month.totalLeanMeatActualOutput * 120000) / 1000)
                              const boneRevenue = Math.round((month.totalBoneActualOutput * 30000) / 1000)
                              const organsRevenue = Math.round((month.totalOrgansActualOutput * 50000) / 1000)
                              return sum + groundMeatRevenue + leanMeatRevenue + boneRevenue + organsRevenue
                            }, 0)
                            const totalCost = monthlyLivestockSummary.reduce((sum, month) => sum + Math.round((month.livestockCost + month.otherCosts) / 1000), 0)
                            const profit = totalRevenue - totalCost
                            return (
                              <span className={profit >= 0 ? "text-green-600" : "text-red-600"}>
                                {profit >= 0 ? "+" : ""}{profit}
                              </span>
                            )
                          })()}
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