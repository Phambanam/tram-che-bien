"use client"

import React, { useState, useEffect } from "react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Badge } from "@/components/ui/badge"
import { Package, Plus, Save, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth/auth-provider"
import { processingStationApi } from "@/lib/api-client"

interface LTTPItem {
  id: string
  category: string // Phân loại
  name: string // Tên LTTP
  unit: string // ĐVT
  unitPrice: number // Đơn giá
  quantity: number // Số lượng hiện tại
  
  // Ngày trước chuyển qua
  previousAmount: number // Thành tiền
  previousExpiry: string // Hạn sử dung
  
  // Nhập trong ngày
  todayInputQuantity: number // Số lượng nhập
  todayInputAmount: number // Thành tiền nhập
  
  // Xuất trong ngày
  todayOutputQuantity: number // Số lượng xuất
  todayOutputAmount: number // Thành tiền xuất
  todayOutputExpiry: string // Hạn sử dụng xuất
  
  // Tồn cuối ngày
  endDayAmount: number // Thành tiền tồn
  endDayExpiry: string // Hạn sử dụng tồn
  
  status: string // Trạng thái
}

export function LttpManagement() {
  const { toast } = useToast()
  const { user } = useAuth()
  
  // States
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [lttpItems, setLttpItems] = useState<LTTPItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Sample data
  const sampleLttpItems: LTTPItem[] = [
    {
      id: "1",
      category: "Thực phẩm",
      name: "Gạo tẻ",
      unit: "Kg",
      unitPrice: 20000,
      quantity: 100,
      previousAmount: 1800000,
      previousExpiry: "2025-02-15",
      todayInputQuantity: 50,
      todayInputAmount: 1000000,
      todayOutputQuantity: 30,
      todayOutputAmount: 600000,
      todayOutputExpiry: "2025-02-15",
      endDayAmount: 2400000,
      endDayExpiry: "2025-02-15",
      status: "Bình thường"
    },
    {
      id: "2", 
      category: "Thực phẩm",
      name: "Thịt heo",
      unit: "Kg",
      unitPrice: 160000,
      quantity: 25,
      previousAmount: 3200000,
      previousExpiry: "2025-01-15",
      todayInputQuantity: 15,
      todayInputAmount: 2400000,
      todayOutputQuantity: 20,
      todayOutputAmount: 3200000,
      todayOutputExpiry: "2025-01-15",
      endDayAmount: 3200000,
      endDayExpiry: "2025-02-01",
      status: "Sắp hết hạn"
    },
    {
      id: "3",
      category: "Gia vị",
      name: "Muối tinh",
      unit: "Kg", 
      unitPrice: 8000,
      quantity: 50,
      previousAmount: 360000,
      previousExpiry: "2025-12-31",
      todayInputQuantity: 20,
      todayInputAmount: 160000,
      todayOutputQuantity: 10,
      todayOutputAmount: 80000,
      todayOutputExpiry: "2025-12-31",
      endDayAmount: 480000,
      endDayExpiry: "2025-12-31",
      status: "Tốt"
    }
  ]

  // Fetch LTTP data for selected date
  const fetchLttpData = async (date: Date) => {
    try {
      setIsLoading(true)
      const dateStr = format(date, "yyyy-MM-dd")
      console.log("📡 Fetching LTTP data for date:", dateStr)
      
      const response = await processingStationApi.getLttpData(dateStr)
      
      if (response.success && response.data) {
        console.log("✅ API returned data:", response.data.length, "items")
        // Transform API data to frontend format
        const transformedData: LTTPItem[] = response.data.map((item: any, index: number) => ({
          id: item._id || item.id || index.toString(),
          category: item.category || "Chưa phân loại",
          name: item.name || "Chưa có tên",
          unit: item.unit || "Kg",
          unitPrice: item.unitPrice || 0,
          quantity: item.quantity || 0,
          previousAmount: item.previousAmount || 0,
          previousExpiry: item.previousExpiry || dateStr,
          todayInputQuantity: item.todayInputQuantity || 0,
          todayInputAmount: item.todayInputAmount || 0,
          todayOutputQuantity: item.todayOutputQuantity || 0,
          todayOutputAmount: item.todayOutputAmount || 0,
          todayOutputExpiry: item.todayOutputExpiry || dateStr,
          endDayAmount: item.endDayAmount || 0,
          endDayExpiry: item.endDayExpiry || dateStr,
          status: item.status || "Bình thường"
        }))
        
        console.log("🔄 Setting LTTP items:", transformedData.length, "items")
        setLttpItems(transformedData)
      } else {
        // No data found, use empty array or show sample data for first time
        console.log("❌ No LTTP data found for date:", dateStr)
        console.log("🔄 Using sample data as fallback")
        setLttpItems(sampleLttpItems)
        
        toast({
          title: "📝 Dữ liệu mẫu",
          description: `Không có dữ liệu cho ${dateStr}. Hiển thị dữ liệu mẫu.`,
          variant: "default"
        })
      }
    } catch (error) {
      console.error("Error fetching LTTP data:", error)
      
      // Show sample data as fallback
      setLttpItems(sampleLttpItems)
      
      toast({
        title: "⚠️ Không thể tải dữ liệu",
        description: "Hiển thị dữ liệu mẫu. Kiểm tra kết nối mạng.",
        variant: "default"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    console.log("🔄 LTTP useEffect triggered - selectedDate:", format(selectedDate, "yyyy-MM-dd"))
    fetchLttpData(selectedDate)
  }, [selectedDate])

  // Debug: Log when component mounts
  useEffect(() => {
    console.log("🚀 LttpManagement component mounted")
    return () => {
      console.log("🔽 LttpManagement component unmounted")
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount)
  }

  const handleInputChange = (id: string, field: keyof LTTPItem, value: string | number) => {
    setLttpItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }
        
        // Auto calculate amounts when quantity changes
        if (field === 'todayInputQuantity') {
          updatedItem.todayInputAmount = Number(value) * item.unitPrice
        }
        if (field === 'todayOutputQuantity') {
          updatedItem.todayOutputAmount = Number(value) * item.unitPrice
        }
        
        // Auto calculate end day amount
        const totalInput = updatedItem.previousAmount + updatedItem.todayInputAmount
        const totalOutput = updatedItem.todayOutputAmount
        updatedItem.endDayAmount = totalInput - totalOutput
        
        return updatedItem
      }
      return item
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Tốt":
        return "text-green-600 bg-green-50"
      case "Bình thường":
        return "text-blue-600 bg-blue-50"
      case "Sắp hết hạn":
        return "text-orange-600 bg-orange-50"
      case "Hết hạn":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const handleSave = async () => {
    if (!user || (user.role !== "admin" && user.role !== "stationManager")) {
      toast({
        title: "❌ Không có quyền",
        description: "Chỉ trạm trưởng mới có thể lưu dữ liệu LTTP",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSaving(true)
      
      const dateStr = format(selectedDate, "yyyy-MM-dd")
      
      // Transform frontend data to API format
      const itemsToSave = lttpItems.map(item => ({
        id: item.id,
        category: item.category,
        name: item.name,
        unit: item.unit,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        previousAmount: item.previousAmount,
        previousExpiry: item.previousExpiry,
        todayInputQuantity: item.todayInputQuantity,
        todayInputAmount: item.todayInputAmount,
        todayOutputQuantity: item.todayOutputQuantity,
        todayOutputAmount: item.todayOutputAmount,
        todayOutputExpiry: item.todayOutputExpiry,
        endDayAmount: item.endDayAmount,
        endDayExpiry: item.endDayExpiry,
        status: item.status
      }))
      
      const response = await processingStationApi.updateLttpData(dateStr, itemsToSave)
      
      if (response.success) {
        toast({
          title: "✅ Thành công", 
          description: "Đã lưu dữ liệu LTTP vào cơ sở dữ liệu",
        })
        
        // Refresh data to show latest from database
        await fetchLttpData(selectedDate)
        
        setIsEditing(false)
      } else {
        throw new Error(response.message || "Không thể lưu dữ liệu")
      }
    } catch (error: any) {
      console.error("Error saving LTTP data:", error)
      toast({
        title: "❌ Lỗi",
        description: error?.message || "Có lỗi xảy ra khi lưu dữ liệu",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-6 w-6 text-indigo-600" />
        <h2 className="text-2xl font-bold text-indigo-800">Quản lý LTTP từng ngày</h2>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg">Bảng theo dõi LTTP - {format(selectedDate, "dd/MM/yyyy", { locale: vi })}</CardTitle>
              {user && (user.role === "admin" || user.role === "stationManager") && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                  Chỉ do trạm trưởng chỉnh sửa
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <DatePicker 
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    console.log("📅 Date selected:", format(date, "yyyy-MM-dd"))
                    setSelectedDate(date)
                  }
                }}
                placeholder="Chọn ngày"
              />
              {user && (user.role === "admin" || user.role === "stationManager") && (
                <>
                  {!isEditing ? (
                    <Button 
                      onClick={() => setIsEditing(true)} 
                      variant="outline"
                      className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                    >
                      📝 Chỉnh sửa
                    </Button>
                  ) : (
                    <>
                      <Button 
                        onClick={() => setIsEditing(false)}
                        variant="outline"
                      >
                        ❌ Hủy
                      </Button>
                      <Button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? "Đang lưu..." : "Lưu"}
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải dữ liệu LTTP...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className="border text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead rowSpan={2} className="text-center align-middle border-r bg-gray-100 min-w-12">STT</TableHead>
                      <TableHead rowSpan={2} className="text-center align-middle border-r bg-gray-100 min-w-20">Phân loại</TableHead>
                      <TableHead rowSpan={2} className="text-center align-middle border-r bg-gray-100 min-w-32">Tên LTTP</TableHead>
                      <TableHead rowSpan={2} className="text-center align-middle border-r bg-gray-100 min-w-16">ĐVT</TableHead>
                      <TableHead rowSpan={2} className="text-center align-middle border-r bg-gray-100 min-w-20">Đơn giá</TableHead>
                      <TableHead rowSpan={2} className="text-center align-middle border-r bg-gray-100 min-w-16">Số lượng</TableHead>
                      
                      <TableHead colSpan={2} className="text-center border-r bg-blue-50">Ngày trước chuyển qua</TableHead>
                      <TableHead colSpan={2} className="text-center border-r bg-green-50">Nhập trong ngày</TableHead>
                      <TableHead colSpan={3} className="text-center border-r bg-red-50">Xuất</TableHead>
                      <TableHead colSpan={2} className="text-center border-r bg-yellow-50">Tồn cuối ngày</TableHead>
                      <TableHead rowSpan={2} className="text-center align-middle bg-purple-50 min-w-24">Trạng thái</TableHead>
                    </TableRow>
                    <TableRow>
                      {/* Ngày trước chuyển qua */}
                      <TableHead className="text-center bg-blue-50 text-xs min-w-20">Thành tiền</TableHead>
                      <TableHead className="text-center bg-blue-50 text-xs border-r min-w-20">Hạn sử dụng</TableHead>
                      
                      {/* Nhập trong ngày */}
                      <TableHead className="text-center bg-green-50 text-xs min-w-16">Số lượng</TableHead>
                      <TableHead className="text-center bg-green-50 text-xs border-r min-w-20">Thành tiền</TableHead>
                      
                      {/* Xuất */}
                      <TableHead className="text-center bg-red-50 text-xs min-w-16">Số lượng</TableHead>
                      <TableHead className="text-center bg-red-50 text-xs min-w-20">Thành tiền</TableHead>
                      <TableHead className="text-center bg-red-50 text-xs border-r min-w-20">Hạn sử dụng</TableHead>
                      
                      {/* Tồn cuối ngày */}
                      <TableHead className="text-center bg-yellow-50 text-xs min-w-20">Thành tiền</TableHead>
                      <TableHead className="text-center bg-yellow-50 text-xs border-r min-w-20">Hạn sử dụng</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lttpItems.map((item, index) => (
                      <TableRow key={item.id} className="border-b">
                        <TableCell className="text-center border-r font-medium">{index + 1}</TableCell>
                        <TableCell className="text-center border-r">{item.category}</TableCell>
                        <TableCell className="border-r">{item.name}</TableCell>
                        <TableCell className="text-center border-r">{item.unit}</TableCell>
                        <TableCell className="text-right border-r">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell className="text-center border-r">{item.quantity}</TableCell>
                        
                        {/* Ngày trước chuyển qua */}
                        <TableCell className="text-right">{formatCurrency(item.previousAmount)}</TableCell>
                        <TableCell className="text-center border-r text-xs">{item.previousExpiry}</TableCell>
                        
                        {/* Nhập trong ngày */}
                        <TableCell className="p-1">
                          {isEditing && user && (user.role === "admin" || user.role === "stationManager") ? (
                            <Input
                              type="number"
                              value={item.todayInputQuantity}
                              onChange={(e) => handleInputChange(item.id, 'todayInputQuantity', Number(e.target.value))}
                              className="w-16 h-8 text-xs text-center"
                            />
                          ) : (
                            <span className="text-center block">{item.todayInputQuantity}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right border-r">{formatCurrency(item.todayInputAmount)}</TableCell>
                        
                        {/* Xuất */}
                        <TableCell className="p-1">
                          {isEditing && user && (user.role === "admin" || user.role === "stationManager") ? (
                            <Input
                              type="number"
                              value={item.todayOutputQuantity}
                              onChange={(e) => handleInputChange(item.id, 'todayOutputQuantity', Number(e.target.value))}
                              className="w-16 h-8 text-xs text-center"
                            />
                          ) : (
                            <span className="text-center block">{item.todayOutputQuantity}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(item.todayOutputAmount)}</TableCell>
                        <TableCell className="p-1 border-r">
                          {isEditing && user && (user.role === "admin" || user.role === "stationManager") ? (
                            <Input
                              type="date"
                              value={item.todayOutputExpiry}
                              onChange={(e) => handleInputChange(item.id, 'todayOutputExpiry', e.target.value)}
                              className="w-24 h-8 text-xs"
                            />
                          ) : (
                            <span className="text-center block text-xs">{item.todayOutputExpiry}</span>
                          )}
                        </TableCell>
                        
                        {/* Tồn cuối ngày */}
                        <TableCell className="text-right font-semibold">{formatCurrency(item.endDayAmount)}</TableCell>
                        <TableCell className="text-center border-r text-xs">{item.endDayExpiry}</TableCell>
                        
                        {/* Trạng thái */}
                        <TableCell className="text-center">
                          {isEditing && user && (user.role === "admin" || user.role === "stationManager") ? (
                            <Select
                              value={item.status}
                              onValueChange={(value) => handleInputChange(item.id, 'status', value)}
                            >
                              <SelectTrigger className={`w-20 h-8 text-xs ${getStatusColor(item.status)}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Tốt">Tốt</SelectItem>
                                <SelectItem value="Bình thường">Bình thường</SelectItem>
                                <SelectItem value="Sắp hết hạn">Sắp hết hạn</SelectItem>
                                <SelectItem value="Hết hạn">Hết hạn</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className={`text-xs px-2 py-1 rounded ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Dòng tổng */}
                    <TableRow className="bg-gray-100 font-semibold border-t-2">
                      <TableCell className="text-center border-r" colSpan={6}>TỔNG CỘNG</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(lttpItems.reduce((sum, item) => sum + item.previousAmount, 0))}
                      </TableCell>
                      <TableCell className="border-r"></TableCell>
                      <TableCell className="text-center">
                        {lttpItems.reduce((sum, item) => sum + item.todayInputQuantity, 0)}
                      </TableCell>
                      <TableCell className="text-right border-r">
                        {formatCurrency(lttpItems.reduce((sum, item) => sum + item.todayInputAmount, 0))}
                      </TableCell>
                      <TableCell className="text-center">
                        {lttpItems.reduce((sum, item) => sum + item.todayOutputQuantity, 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(lttpItems.reduce((sum, item) => sum + item.todayOutputAmount, 0))}
                      </TableCell>
                      <TableCell className="border-r"></TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(lttpItems.reduce((sum, item) => sum + item.endDayAmount, 0))}
                      </TableCell>
                      <TableCell className="border-r"></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              
              {/* Statistics */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-blue-700 mb-1">Tổng giá trị tồn</div>
                    <div className="text-lg font-bold text-blue-800">
                      {formatCurrency(lttpItems.reduce((sum, item) => sum + item.endDayAmount, 0))} đ
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-green-700 mb-1">Tổng nhập hôm nay</div>
                    <div className="text-lg font-bold text-green-800">
                      {formatCurrency(lttpItems.reduce((sum, item) => sum + item.todayInputAmount, 0))} đ
                    </div>
                  </div>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-red-700 mb-1">Tổng xuất hôm nay</div>
                    <div className="text-lg font-bold text-red-800">
                      {formatCurrency(lttpItems.reduce((sum, item) => sum + item.todayOutputAmount, 0))} đ
                    </div>
                  </div>
                </div>
                
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-orange-700 mb-1">Mặt hàng sắp hết hạn</div>
                    <div className="text-lg font-bold text-orange-800">
                      {lttpItems.filter(item => item.status === "Sắp hết hạn").length} mặt hàng
                    </div>
                  </div>
                </div>
              </div>

              {/* Info message for non-authorized users */}
              {user?.role && !['stationManager', 'admin'].includes(user.role) && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700 text-center">
                    ⚠️ Chỉ trạm trưởng mới có thể chỉnh sửa dữ liệu LTTP
                  </p>
                </div>
              )}

              {/* Notes */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Ghi chú:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Số liệu dã thông qua chế biến: Lý tự phận, Thực xuất trong gì nguồn xuất</li>
                  <li>• Số sánh với ngày hiện tại để báo: Chưa hết hạn, Sắp hết hạn (trước 3 ngày), Hết hạn</li>
                  <li>• Chỉ trạm trưởng mới có thể chỉnh sửa và lưu dữ liệu</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 