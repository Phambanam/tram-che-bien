"use client"

import React, { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Beef } from "lucide-react"
import { format } from "date-fns"
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

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await fetchDailyLivestockProcessing(new Date())
      setIsLoading(false)
    }
    loadData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Beef className="h-6 w-6 text-red-600" />
        <h2 className="text-2xl font-bold text-red-800">Giết mổ lợn</h2>
        <Badge className="bg-red-100 text-red-800">
          Quản lý phân phối thịt lợn
        </Badge>
      </div>

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
                  Chức năng giết mổ lợn đang được phát triển. Hiện tại chỉ hiển thị giao diện mẫu với tính năng chuyển kho.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 