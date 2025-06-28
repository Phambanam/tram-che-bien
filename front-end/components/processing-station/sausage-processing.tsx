"use client"

import React, { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Utensils } from "lucide-react"
import { format } from "date-fns"
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
  note?: string
  // Price fields
  leanMeatPrice?: number
  fatMeatPrice?: number
  sausagePrice?: number
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
    note: "",
    leanMeatPrice: 0,
    fatMeatPrice: 0,
    sausagePrice: 0
  })
  
  const [editingDailyData, setEditingDailyData] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [dailyUpdateData, setDailyUpdateData] = useState({
    leanMeatInput: 0,
    fatMeatInput: 0,
    sausageInput: 0,
    note: "",
    leanMeatPrice: 0,
    fatMeatPrice: 0,
    sausagePrice: 0
  })

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
        note: stationData.note,
        leanMeatPrice: stationData.leanMeatPrice,
        fatMeatPrice: stationData.fatMeatPrice,
        sausagePrice: stationData.sausagePrice
      }

      setDailySausageProcessing(processedData)
      setDailyUpdateData({
        leanMeatInput: processedData.leanMeatInput,
        fatMeatInput: processedData.fatMeatInput,
        sausageInput: processedData.sausageInput,
        note: processedData.note || "",
        leanMeatPrice: processedData.leanMeatPrice || 0,
        fatMeatPrice: processedData.fatMeatPrice || 0,
        sausagePrice: processedData.sausagePrice || 0
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

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await fetchDailySausageProcessing(new Date())
      setIsLoading(false)
    }
    loadData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Utensils className="h-6 w-6 text-orange-600" />
        <h2 className="text-2xl font-bold text-orange-800">Làm giò chả</h2>
        <Badge className="bg-orange-100 text-orange-800">
          Chỉ do Trạm trưởng chỉnh sửa
        </Badge>
      </div>

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
                        <span>0</span>
                        <span className="text-sm ml-1">kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Thịt mỡ chi */}
                  <div className="bg-orange-50 border border-orange-200 rounded p-3">
                    <div className="text-center">
                      <div className="text-sm font-medium text-orange-700 mb-1">Thịt mỡ chi:</div>
                      <div className="text-lg font-bold text-orange-800">
                        <span>0</span>
                        <span className="text-sm ml-1">kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Giò lụa thu */}
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <div className="text-center">
                      <div className="text-sm font-medium text-blue-700 mb-1">Giò lụa thu:</div>
                      <div className="text-lg font-bold text-blue-800">
                        <span>0</span>
                        <span className="text-sm ml-1">kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Giò lụa tồn */}
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <div className="text-center">
                      <div className="text-sm font-medium text-red-700 mb-1">Giò lụa tồn:</div>
                      <div className="text-lg font-bold text-red-800">
                        <span>0</span>
                        <span className="text-sm ml-1">kg</span>
                      </div>
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
                        <span>0</span>
                        <span className="text-sm ml-1">kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Chả quế xuất */}
                  <div className="bg-amber-50 border border-amber-200 rounded p-3">
                    <div className="text-center">
                      <div className="text-sm font-medium text-amber-700 mb-1">Chả quế xuất:</div>
                      <div className="text-lg font-bold text-amber-800">
                        <span>0</span>
                        <span className="text-sm ml-1">kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Chả quế tồn */}
                  <div className="bg-purple-50 border border-purple-200 rounded p-3 col-span-2">
                    <div className="text-center">
                      <div className="text-sm font-medium text-purple-700 mb-1">Chả quế tồn:</div>
                      <div className="text-lg font-bold text-purple-800">
                        <span>0</span>
                        <span className="text-sm ml-1">kg</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Info message */}
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500 text-center">
                Chức năng làm giò chả đang được phát triển. Hiện tại chỉ hiển thị giao diện mẫu.
              </p>
            </div>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 