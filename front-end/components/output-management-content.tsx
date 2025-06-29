"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Save, FileDown } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

interface LTTPDistributionItem {
  id: string
  category: string
  name: string
  unit: string
  unitPrice: number
  suggestedQuantity: number
  unit1SuggestedQty: number
  unit1ActualQty: number
  unit1Amount: number
  unit2SuggestedQty: number
  unit2ActualQty: number
  unit2Amount: number
  unit3SuggestedQty: number
  unit3ActualQty: number
  unit3Amount: number
  ceremonyUnitSuggestedQty: number
  ceremonyUnitActualQty: number
  ceremonyUnitAmount: number
  totalSuggestedQty: number
  totalActualQty: number
  totalAmount: number
}

export function OutputManagementContent() {
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [lttpItems, setLttpItems] = useState<LTTPDistributionItem[]>([])

  const sampleLttpItems: LTTPDistributionItem[] = [
    {
      id: "1",
      category: "Thực phẩm",
      name: "Gạo tẻ",
      unit: "Kg",
      unitPrice: 20000,
      suggestedQuantity: 50,
      unit1SuggestedQty: 15,
      unit1ActualQty: 15,
      unit1Amount: 300000,
      unit2SuggestedQty: 12,
      unit2ActualQty: 12,
      unit2Amount: 240000,
      unit3SuggestedQty: 18,
      unit3ActualQty: 17,
      unit3Amount: 340000,
      ceremonyUnitSuggestedQty: 5,
      ceremonyUnitActualQty: 6,
      ceremonyUnitAmount: 120000,
      totalSuggestedQty: 50,
      totalActualQty: 50,
      totalAmount: 1000000
    },
    {
      id: "2",
      category: "Thực phẩm", 
      name: "Thịt heo",
      unit: "Kg",
      unitPrice: 160000,
      suggestedQuantity: 30,
      unit1SuggestedQty: 10,
      unit1ActualQty: 10,
      unit1Amount: 1600000,
      unit2SuggestedQty: 8,
      unit2ActualQty: 8,
      unit2Amount: 1280000,
      unit3SuggestedQty: 9,
      unit3ActualQty: 9,
      unit3Amount: 1440000,
      ceremonyUnitSuggestedQty: 3,
      ceremonyUnitActualQty: 3,
      ceremonyUnitAmount: 480000,
      totalSuggestedQty: 30,
      totalActualQty: 30,
      totalAmount: 4800000
    }
  ]

  useEffect(() => {
    setLttpItems(sampleLttpItems)
  }, [selectedDate])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount)
  }

  const handleInputChange = (id: string, field: string, value: number) => {
    setLttpItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }
        if (field === 'unit1ActualQty') {
          updatedItem.unit1Amount = value * item.unitPrice
        }
        if (field === 'unit2ActualQty') {
          updatedItem.unit2Amount = value * item.unitPrice
        }
        if (field === 'unit3ActualQty') {
          updatedItem.unit3Amount = value * item.unitPrice
        }
        if (field === 'ceremonyUnitActualQty') {
          updatedItem.ceremonyUnitAmount = value * item.unitPrice
        }
        updatedItem.totalActualQty = updatedItem.unit1ActualQty + updatedItem.unit2ActualQty + 
                                   updatedItem.unit3ActualQty + updatedItem.ceremonyUnitActualQty
        updatedItem.totalAmount = updatedItem.unit1Amount + updatedItem.unit2Amount + 
                                updatedItem.unit3Amount + updatedItem.ceremonyUnitAmount
        return updatedItem
      }
      return item
    }))
  }

  const handleSave = () => {
    toast({
      title: "✅ Thành công",
      description: "Đã lưu dữ liệu phân bổ LTTP",
    })
  }

  const calculateTotals = () => {
    return lttpItems.reduce((totals, item) => ({
      totalSuggestedQty: totals.totalSuggestedQty + item.totalSuggestedQty,
      totalActualQty: totals.totalActualQty + item.totalActualQty,
      totalAmount: totals.totalAmount + item.totalAmount,
      unit1SuggestedQty: totals.unit1SuggestedQty + item.unit1SuggestedQty,
      unit1ActualQty: totals.unit1ActualQty + item.unit1ActualQty,
      unit1Amount: totals.unit1Amount + item.unit1Amount,
      unit2SuggestedQty: totals.unit2SuggestedQty + item.unit2SuggestedQty,
      unit2ActualQty: totals.unit2ActualQty + item.unit2ActualQty,
      unit2Amount: totals.unit2Amount + item.unit2Amount,
      unit3SuggestedQty: totals.unit3SuggestedQty + item.unit3SuggestedQty,
      unit3ActualQty: totals.unit3ActualQty + item.unit3ActualQty,
      unit3Amount: totals.unit3Amount + item.unit3Amount,
      ceremonyUnitSuggestedQty: totals.ceremonyUnitSuggestedQty + item.ceremonyUnitSuggestedQty,
      ceremonyUnitActualQty: totals.ceremonyUnitActualQty + item.ceremonyUnitActualQty,
      ceremonyUnitAmount: totals.ceremonyUnitAmount + item.ceremonyUnitAmount
    }), {
      totalSuggestedQty: 0,
      totalActualQty: 0,
      totalAmount: 0,
      unit1SuggestedQty: 0,
      unit1ActualQty: 0,
      unit1Amount: 0,
      unit2SuggestedQty: 0,
      unit2ActualQty: 0,
      unit2Amount: 0,
      unit3SuggestedQty: 0,
      unit3ActualQty: 0,
      unit3Amount: 0,
      ceremonyUnitSuggestedQty: 0,
      ceremonyUnitActualQty: 0,
      ceremonyUnitAmount: 0
    })
  }

  const totals = calculateTotals()

  return (
    <div className="w-full p-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <Package className="h-6 w-6 text-orange-600" />
          <h2 className="text-2xl font-bold text-orange-800">Quản lý nguồn xuất</h2>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Bảng phân bổ LTTP - {format(selectedDate, "dd/MM/yyyy", { locale: vi })}</CardTitle>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={format(selectedDate, "yyyy-MM-dd")}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
                <Button onClick={handleSave} className="bg-orange-600 hover:bg-orange-700">
                  <Save className="w-4 h-4 mr-2" />
                  Lưu
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <FileDown className="h-4 w-4" />
                  Xuất Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="border text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead rowSpan={2} className="text-center align-middle border-r bg-gray-100 w-12">STT</TableHead>
                    <TableHead rowSpan={2} className="text-center align-middle border-r bg-gray-100 w-24">PHÂN LOẠI</TableHead>
                    <TableHead rowSpan={2} className="text-center align-middle border-r bg-gray-100 w-32">TÊN LTTP</TableHead>
                    <TableHead rowSpan={2} className="text-center align-middle border-r bg-gray-100 w-16">ĐVT</TableHead>
                    <TableHead rowSpan={2} className="text-center align-middle border-r bg-gray-100 w-20">Đơn giá</TableHead>
                    <TableHead rowSpan={2} className="text-center align-middle border-r bg-gray-100 w-20">SL đề nghị</TableHead>
                    <TableHead colSpan={3} className="text-center border-r bg-blue-50">Thứ đoàn 1</TableHead>
                    <TableHead colSpan={3} className="text-center border-r bg-green-50">Thứ đoàn 2</TableHead>
                    <TableHead colSpan={3} className="text-center border-r bg-yellow-50">Thứ đoàn 3</TableHead>
                    <TableHead colSpan={3} className="text-center border-r bg-purple-50">Lễ đoàn hộ</TableHead>
                    <TableHead colSpan={3} className="text-center bg-red-50">Tổng</TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead className="text-center bg-blue-50 text-xs w-16">SL đề nghị</TableHead>
                    <TableHead className="text-center bg-blue-50 text-xs w-16">Thực xuất</TableHead>
                    <TableHead className="text-center bg-blue-50 text-xs border-r w-20">Thành tiền</TableHead>
                    <TableHead className="text-center bg-green-50 text-xs w-16">SL đề nghị</TableHead>
                    <TableHead className="text-center bg-green-50 text-xs w-16">Thực xuất</TableHead>
                    <TableHead className="text-center bg-green-50 text-xs border-r w-20">Thành tiền</TableHead>
                    <TableHead className="text-center bg-yellow-50 text-xs w-16">SL đề nghị</TableHead>
                    <TableHead className="text-center bg-yellow-50 text-xs w-16">Thực xuất</TableHead>
                    <TableHead className="text-center bg-yellow-50 text-xs border-r w-20">Thành tiền</TableHead>
                    <TableHead className="text-center bg-purple-50 text-xs w-16">SL đề nghị</TableHead>
                    <TableHead className="text-center bg-purple-50 text-xs w-16">Thực xuất</TableHead>
                    <TableHead className="text-center bg-purple-50 text-xs border-r w-20">Thành tiền</TableHead>
                    <TableHead className="text-center bg-red-50 text-xs w-16">SL đề nghị</TableHead>
                    <TableHead className="text-center bg-red-50 text-xs w-16">Thực xuất</TableHead>
                    <TableHead className="text-center bg-red-50 text-xs w-20">Thành tiền</TableHead>
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
                      <TableCell className="text-center border-r">{item.suggestedQuantity}</TableCell>
                      <TableCell className="text-center">{item.unit1SuggestedQty}</TableCell>
                      <TableCell className="p-1">
                        <Input
                          type="number"
                          value={item.unit1ActualQty}
                          onChange={(e) => handleInputChange(item.id, 'unit1ActualQty', Number(e.target.value))}
                          className="w-16 h-8 text-xs text-center"
                          step="0.1"
                        />
                      </TableCell>
                      <TableCell className="text-right border-r">{formatCurrency(item.unit1Amount)}</TableCell>
                      <TableCell className="text-center">{item.unit2SuggestedQty}</TableCell>
                      <TableCell className="p-1">
                        <Input
                          type="number"
                          value={item.unit2ActualQty}
                          onChange={(e) => handleInputChange(item.id, 'unit2ActualQty', Number(e.target.value))}
                          className="w-16 h-8 text-xs text-center"
                          step="0.1"
                        />
                      </TableCell>
                      <TableCell className="text-right border-r">{formatCurrency(item.unit2Amount)}</TableCell>
                      <TableCell className="text-center">{item.unit3SuggestedQty}</TableCell>
                      <TableCell className="p-1">
                        <Input
                          type="number"
                          value={item.unit3ActualQty}
                          onChange={(e) => handleInputChange(item.id, 'unit3ActualQty', Number(e.target.value))}
                          className="w-16 h-8 text-xs text-center"
                          step="0.1"
                        />
                      </TableCell>
                      <TableCell className="text-right border-r">{formatCurrency(item.unit3Amount)}</TableCell>
                      <TableCell className="text-center">{item.ceremonyUnitSuggestedQty}</TableCell>
                      <TableCell className="p-1">
                        <Input
                          type="number"
                          value={item.ceremonyUnitActualQty}
                          onChange={(e) => handleInputChange(item.id, 'ceremonyUnitActualQty', Number(e.target.value))}
                          className="w-16 h-8 text-xs text-center"
                          step="0.1"
                        />
                      </TableCell>
                      <TableCell className="text-right border-r">{formatCurrency(item.ceremonyUnitAmount)}</TableCell>
                      <TableCell className="text-center font-semibold">{item.totalSuggestedQty}</TableCell>
                      <TableCell className="text-center font-semibold">{item.totalActualQty}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(item.totalAmount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-gray-100 font-semibold border-t-2">
                    <TableCell className="text-center border-r" colSpan={5}>TỔNG CỘNG</TableCell>
                    <TableCell className="text-center border-r">{totals.totalSuggestedQty}</TableCell>
                    <TableCell className="text-center">{totals.unit1SuggestedQty}</TableCell>
                    <TableCell className="text-center">{totals.unit1ActualQty}</TableCell>
                    <TableCell className="text-right border-r">{formatCurrency(totals.unit1Amount)}</TableCell>
                    <TableCell className="text-center">{totals.unit2SuggestedQty}</TableCell>
                    <TableCell className="text-center">{totals.unit2ActualQty}</TableCell>
                    <TableCell className="text-right border-r">{formatCurrency(totals.unit2Amount)}</TableCell>
                    <TableCell className="text-center">{totals.unit3SuggestedQty}</TableCell>
                    <TableCell className="text-center">{totals.unit3ActualQty}</TableCell>
                    <TableCell className="text-right border-r">{formatCurrency(totals.unit3Amount)}</TableCell>
                    <TableCell className="text-center">{totals.ceremonyUnitSuggestedQty}</TableCell>
                    <TableCell className="text-center">{totals.ceremonyUnitActualQty}</TableCell>
                    <TableCell className="text-right border-r">{formatCurrency(totals.ceremonyUnitAmount)}</TableCell>
                    <TableCell className="text-center">{totals.totalSuggestedQty}</TableCell>
                    <TableCell className="text-center">{totals.totalActualQty}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totals.totalAmount)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-center">
              <div className="text-sm font-medium text-blue-700 mb-1">Tổng số mặt hàng</div>
              <div className="text-2xl font-bold text-blue-800">{lttpItems.length}</div>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-center">
              <div className="text-sm font-medium text-green-700 mb-1">Tổng đề nghị</div>
              <div className="text-xl font-bold text-green-800">{totals.totalSuggestedQty}</div>
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-center">
              <div className="text-sm font-medium text-orange-700 mb-1">Tổng thực xuất</div>
              <div className="text-xl font-bold text-orange-800">{totals.totalActualQty}</div>
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-center">
              <div className="text-sm font-medium text-red-700 mb-1">Tổng thành tiền</div>
              <div className="text-lg font-bold text-red-800">{formatCurrency(totals.totalAmount)} đ</div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">Ghi chú:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Hiển thị theo mẫu "Hiệu theo đơn LTTP từ thức đơn" của nguồn từ nguồn nhập</li>
            <li>• Thực xuất trong gì nguồn xuất</li>
            <li>• Lý tự phận - Thực xuất trong gì nguồn xuất</li>
            <li>• Số sánh với ngày hiện tại để báo: Chưa hết hạn, Sắp hết hạn (trước 3 ngày), Hết hạn</li>
          </ul>
        </div>
      </div>
    </div>
  )
}