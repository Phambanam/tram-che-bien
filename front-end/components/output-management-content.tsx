"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Save, FileDown, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"

interface SupplyOutput {
  id: string
  receivingUnit: {
    id: string
    name: string
  }
  product: {
    id: string
    name: string
    category: {
      id: string
      name: string
    }
  }
  quantity: number
  outputDate: string
  receiver: string
  status: string
  note: string
  createdBy?: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

export function OutputManagementContent() {
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [supplyOutputs, setSupplyOutputs] = useState<SupplyOutput[]>([])
  const [loading, setLoading] = useState(false)

  const fetchSupplyOutputs = async () => {
    setLoading(true)
    try {
      const startDate = format(selectedDate, "yyyy-MM-dd")
      const endDate = format(selectedDate, "yyyy-MM-dd")
      
      const response = await apiClient.supplyOutputs.getAll({
        startDate,
        endDate
      })
      
      if (response.success) {
        setSupplyOutputs(response.data)
        toast({
          title: "✅ Thành công",
          description: `Tải được ${response.data.length} bản ghi xuất kho`,
        })
      } else {
        setSupplyOutputs([])
        toast({
          title: "⚠️ Thông báo",
          description: "Không có dữ liệu xuất kho cho ngày đã chọn",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching supply outputs:', error)
      setSupplyOutputs([])
      toast({
        title: "❌ Lỗi",
        description: "Không thể tải dữ liệu xuất kho",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSupplyOutputs()
  }, [selectedDate])

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: vi })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Hoàn thành"
      case "pending":
        return "Chờ xử lý"
      case "cancelled":
        return "Đã hủy"
      default:
        return status
    }
  }

  const totalQuantity = supplyOutputs.reduce((sum, output) => sum + output.quantity, 0)

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
              <CardTitle className="text-lg">Danh sách xuất kho - {format(selectedDate, "dd/MM/yyyy", { locale: vi })}</CardTitle>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={format(selectedDate, "yyyy-MM-dd")}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
                <Button onClick={fetchSupplyOutputs} disabled={loading} className="bg-orange-600 hover:bg-orange-700">
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Làm mới
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <FileDown className="h-4 w-4" />
                  Xuất Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                <span>Đang tải dữ liệu...</span>
              </div>
            ) : supplyOutputs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Không có dữ liệu xuất kho cho ngày {format(selectedDate, "dd/MM/yyyy", { locale: vi })}</p>
                <p className="text-sm mt-2">Thử chọn ngày khác hoặc kiểm tra dữ liệu trong hệ thống</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="border">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center border-r bg-gray-100 w-12">STT</TableHead>
                      <TableHead className="text-center border-r bg-gray-100">Sản phẩm</TableHead>
                      <TableHead className="text-center border-r bg-gray-100">Danh mục</TableHead>
                      <TableHead className="text-center border-r bg-gray-100">Đơn vị nhận</TableHead>
                      <TableHead className="text-center border-r bg-gray-100">Số lượng</TableHead>
                      <TableHead className="text-center border-r bg-gray-100">Người nhận</TableHead>
                      <TableHead className="text-center border-r bg-gray-100">Trạng thái</TableHead>
                      <TableHead className="text-center border-r bg-gray-100">Ngày xuất</TableHead>
                      <TableHead className="text-center border-r bg-gray-100">Ghi chú</TableHead>
                      <TableHead className="text-center bg-gray-100">Người tạo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplyOutputs.map((output, index) => (
                      <TableRow key={output.id} className="border-b">
                        <TableCell className="text-center border-r font-medium">{index + 1}</TableCell>
                        <TableCell className="border-r font-medium">{output.product.name}</TableCell>
                        <TableCell className="text-center border-r">{output.product.category.name}</TableCell>
                        <TableCell className="border-r">{output.receivingUnit.name}</TableCell>
                        <TableCell className="text-center border-r font-semibold">{output.quantity} kg</TableCell>
                        <TableCell className="border-r">{output.receiver}</TableCell>
                        <TableCell className="text-center border-r">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(output.status)}`}>
                            {getStatusText(output.status)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center border-r text-sm">{formatDate(output.outputDate)}</TableCell>
                        <TableCell className="border-r text-sm">{output.note || '-'}</TableCell>
                        <TableCell className="text-sm">{output.createdBy?.name || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-center">
              <div className="text-sm font-medium text-blue-700 mb-1">Tổng phiếu xuất</div>
              <div className="text-2xl font-bold text-blue-800">{supplyOutputs.length}</div>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-center">
              <div className="text-sm font-medium text-green-700 mb-1">Tổng khối lượng</div>
              <div className="text-xl font-bold text-green-800">{totalQuantity.toFixed(1)} kg</div>
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-center">
              <div className="text-sm font-medium text-orange-700 mb-1">Hoàn thành</div>
              <div className="text-xl font-bold text-orange-800">{supplyOutputs.filter(o => o.status === 'completed').length}</div>
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-center">
              <div className="text-sm font-medium text-red-700 mb-1">Chờ xử lý</div>
              <div className="text-lg font-bold text-red-800">{supplyOutputs.filter(o => o.status === 'pending').length}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">Ghi chú:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Hiển thị danh sách các phiếu xuất kho theo ngày được chọn</li>
            <li>• Dữ liệu được lấy từ hệ thống quản lý kho và cập nhật theo thời gian thực</li>
            <li>• Trạng thái: Hoàn thành (đã xuất), Chờ xử lý (đang chờ duyệt), Đã hủy</li>
            <li>• Có thể chọn ngày khác để xem dữ liệu xuất kho tương ứng</li>
            <li>• Dữ liệu hiện có từ ngày 16/06/2025 đến 29/06/2025</li>
          </ul>
        </div>
      </div>
    </div>
  )
}