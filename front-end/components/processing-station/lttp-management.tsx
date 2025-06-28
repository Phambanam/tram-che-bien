"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Package, Plus, Save, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
  
  // States
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [lttpItems, setLttpItems] = useState<LTTPItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

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

  useEffect(() => {
    setLttpItems(sampleLttpItems)
  }, [selectedDate])

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

  const handleSave = () => {
    toast({
      title: "✅ Thành công",
      description: "Đã lưu dữ liệu LTTP",
    })
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
            <CardTitle className="text-lg">Bảng theo dõi LTTP - {format(selectedDate, "dd/MM/yyyy", { locale: vi })}</CardTitle>
            <div className="flex gap-2">
              <DatePicker 
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                placeholder="Chọn ngày"
              />
              <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
                <Save className="w-4 h-4 mr-2" />
                Lưu
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                      <Input
                        type="number"
                        value={item.todayInputQuantity}
                        onChange={(e) => handleInputChange(item.id, 'todayInputQuantity', Number(e.target.value))}
                        className="w-16 h-8 text-xs text-center"
                      />
                    </TableCell>
                    <TableCell className="text-right border-r">{formatCurrency(item.todayInputAmount)}</TableCell>
                    
                    {/* Xuất */}
                    <TableCell className="p-1">
                      <Input
                        type="number"
                        value={item.todayOutputQuantity}
                        onChange={(e) => handleInputChange(item.id, 'todayOutputQuantity', Number(e.target.value))}
                        className="w-16 h-8 text-xs text-center"
                      />
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(item.todayOutputAmount)}</TableCell>
                    <TableCell className="p-1 border-r">
                      <Input
                        type="date"
                        value={item.todayOutputExpiry}
                        onChange={(e) => handleInputChange(item.id, 'todayOutputExpiry', e.target.value)}
                        className="w-24 h-8 text-xs"
                      />
                    </TableCell>
                    
                    {/* Tồn cuối ngày */}
                    <TableCell className="text-right font-semibold">{formatCurrency(item.endDayAmount)}</TableCell>
                    <TableCell className="text-center border-r text-xs">{item.endDayExpiry}</TableCell>
                    
                    {/* Trạng thái */}
                    <TableCell className="text-center">
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

          {/* Notes */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Ghi chú:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Số liệu dã thông qua chế biến: Lý tự phận, Thực xuất trong gì nguồn xuất</li>
              <li>• Số sánh với ngày hiện tại để báo: Chưa hết hạn, Sắp hết hạn (trước 3 ngày), Hết hạn</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 