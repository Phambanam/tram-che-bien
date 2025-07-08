"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Package, Save, FileDown, RefreshCw, Plus, AlertCircle, Check, X } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { apiClient, productsApi } from "@/lib/api-client"
import { useAuth } from "@/components/auth/auth-provider"
import { SupplyOutputRequest, SupplyOutputRequestFormData, Product } from "@/types"

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
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [supplyOutputs, setSupplyOutputs] = useState<SupplyOutput[]>([])
  const [outputRequests, setOutputRequests] = useState<SupplyOutputRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("outputs")
  
  // Inventory state
  const [inventoryData, setInventoryData] = useState<{[productId: string]: number}>({})
  
  // Approval dialog state
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [requestToApprove, setRequestToApprove] = useState<SupplyOutputRequest | null>(null)
  const [approvalQuantity, setApprovalQuantity] = useState<number>(0)
  
  // Request form state
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [requestFormData, setRequestFormData] = useState<SupplyOutputRequestFormData>({
    productId: "",
    quantity: 0,
    requestDate: format(new Date(), "yyyy-MM-dd"),
    priority: "normal",
    reason: "",
    note: ""
  })

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

  const fetchOutputRequests = async () => {
    setRequestsLoading(true)
    try {
      const response = await apiClient.supplyOutputs.getOutputRequests()
      
      if (response.success) {
        setOutputRequests(response.data)
        // Fetch inventory for each unique product
        if (user?.role === "brigadeAssistant") {
          fetchInventoryForProducts(response.data)
        }
      } else {
        setOutputRequests([])
      }
    } catch (error) {
      console.error('Error fetching output requests:', error)
      setOutputRequests([])
      toast({
        title: "❌ Lỗi",
        description: "Không thể tải danh sách yêu cầu xuất kho",
        variant: "destructive"
      })
    } finally {
      setRequestsLoading(false)
    }
  }

  const fetchInventoryForProducts = async (requests: SupplyOutputRequest[]) => {
    try {
      // TODO: Implement proper inventory fetching
      // For now, set dummy data to show UI structure
      const inventoryMap: {[productId: string]: number} = {}
      requests.forEach(request => {
        inventoryMap[request.product.id] = Math.floor(Math.random() * 100) // Dummy data
      })
      setInventoryData(inventoryMap)
    } catch (error) {
      console.error('Error fetching inventory data:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await productsApi.getProducts()
      
      if (Array.isArray(response)) {
        setProducts(response)
      } else if (response && 'success' in response && response.success && response.data) {
        setProducts(response.data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const handleCreateRequest = async () => {
    if (!requestFormData.productId || !requestFormData.quantity || !requestFormData.reason) {
      toast({
        title: "❌ Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive"
      })
      return
    }

    setIsSubmittingRequest(true)
    try {
      const response = await apiClient.supplyOutputs.createSupplyOutputRequest(requestFormData)
      
      if (response.success) {
        toast({
          title: "✅ Thành công",
          description: "Tạo yêu cầu xuất kho thành công",
        })
        setIsRequestDialogOpen(false)
        setRequestFormData({
          productId: "",
          quantity: 0,
          requestDate: format(new Date(), "yyyy-MM-dd"),
          priority: "normal",
          reason: "",
          note: ""
        })
        fetchOutputRequests() // Refresh the requests list
      } else {
        toast({
          title: "❌ Lỗi",
          description: response.message || "Không thể tạo yêu cầu xuất kho",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating output request:', error)
      toast({
        title: "❌ Lỗi",
        description: "Đã xảy ra lỗi khi tạo yêu cầu",
        variant: "destructive"
      })
    } finally {
      setIsSubmittingRequest(false)
    }
  }

  const openApprovalDialog = (request: SupplyOutputRequest) => {
    setRequestToApprove(request)
    setApprovalQuantity(request.quantity)
    setApprovalDialogOpen(true)
  }

  const handleApproveRequest = async () => {
    if (!requestToApprove) return
    
    try {
      const response = await apiClient.supplyOutputs.approveSupplyOutputRequest(requestToApprove.id, {
        approvedQuantity: approvalQuantity,
        plannedOutputDate: format(new Date(), "yyyy-MM-dd"),
        note: `Đã phê duyệt ${approvalQuantity}kg bởi trợ lý lữ đoàn`
      })
      
      if (response.success) {
        toast({
          title: "✅ Thành công",
          description: `Phê duyệt yêu cầu thành công - Số lượng: ${approvalQuantity}kg`,
        })
        setApprovalDialogOpen(false)
        setRequestToApprove(null)
        fetchOutputRequests() // Refresh the requests list
        fetchSupplyOutputs() // Refresh outputs list to show new planned output
      } else {
        toast({
          title: "❌ Lỗi",
          description: response.message || "Không thể phê duyệt yêu cầu",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error approving request:', error)
      const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi khi phê duyệt yêu cầu"
      toast({
        title: "❌ Lỗi",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const handleRejectRequest = async (requestId: string, reason: string) => {
    try {
      const response = await apiClient.supplyOutputs.rejectSupplyOutputRequest(requestId, { rejectionReason: reason })
      
      if (response.success) {
        toast({
          title: "✅ Thành công",
          description: "Từ chối yêu cầu thành công",
        })
        fetchOutputRequests() // Refresh the requests list
      } else {
        toast({
          title: "❌ Lỗi",
          description: response.message || "Không thể từ chối yêu cầu",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
      toast({
        title: "❌ Lỗi",
        description: "Đã xảy ra lỗi khi từ chối yêu cầu",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    fetchSupplyOutputs()
    if (user?.role === "unitAssistant" || user?.role === "brigadeAssistant") {
      fetchOutputRequests()
    }
    if (user?.role === "unitAssistant" || user?.role === "brigadeAssistant") {
      fetchProducts()
    }
  }, [selectedDate, user])

  useEffect(() => {
    fetchProducts()
  }, [])

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

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRequestStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Đã duyệt"
      case "pending":
        return "Chờ duyệt"
      case "rejected":
        return "Từ chối"
      default:
        return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800"
      case "urgent":
        return "bg-orange-100 text-orange-800"
      case "normal":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "critical":
        return "Khẩn cấp"
      case "urgent":
        return "Gấp"
      case "normal":
        return "Bình thường"
      default:
        return priority
    }
  }

  const totalQuantity = supplyOutputs.reduce((sum, output) => sum + output.quantity, 0)

  return (
    <div className="w-full p-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-orange-600" />
            <h2 className="text-2xl font-bold text-orange-800">Quản lý nguồn xuất</h2>
          </div>
          
          {user?.role === "unitAssistant" && (
            <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo yêu cầu xuất kho
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Tạo yêu cầu xuất kho</DialogTitle>
                  <DialogDescription>
                    Điền thông tin để tạo yêu cầu xuất kho từ đơn vị của bạn
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="product" className="text-right">
                      Sản phẩm *
                    </Label>
                    <Select
                      value={requestFormData.productId}
                      onValueChange={(value) => 
                        setRequestFormData({ ...requestFormData, productId: value })
                      }
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Chọn sản phẩm" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product._id} value={product._id}>
                            {product.name} ({product.category.name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quantity" className="text-right">
                      Số lượng *
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={requestFormData.quantity}
                      onChange={(e) => 
                        setRequestFormData({ ...requestFormData, quantity: parseInt(e.target.value) || 0 })
                      }
                      className="col-span-3"
                      placeholder="Nhập số lượng"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="requestDate" className="text-right">
                      Ngày cần *
                    </Label>
                    <Input
                      id="requestDate"
                      type="date"
                      value={requestFormData.requestDate}
                      onChange={(e) => 
                        setRequestFormData({ ...requestFormData, requestDate: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="priority" className="text-right">
                      Mức độ ưu tiên
                    </Label>
                    <Select
                      value={requestFormData.priority}
                      onValueChange={(value: "normal" | "urgent" | "critical") => 
                        setRequestFormData({ ...requestFormData, priority: value })
                      }
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Bình thường</SelectItem>
                        <SelectItem value="urgent">Gấp</SelectItem>
                        <SelectItem value="critical">Khẩn cấp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="reason" className="text-right">
                      Lý do *
                    </Label>
                    <Textarea
                      id="reason"
                      value={requestFormData.reason}
                      onChange={(e) => 
                        setRequestFormData({ ...requestFormData, reason: e.target.value })
                      }
                      className="col-span-3"
                      placeholder="Nhập lý do yêu cầu xuất kho"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="note" className="text-right">
                      Ghi chú
                    </Label>
                    <Textarea
                      id="note"
                      value={requestFormData.note}
                      onChange={(e) => 
                        setRequestFormData({ ...requestFormData, note: e.target.value })
                      }
                      className="col-span-3"
                      placeholder="Ghi chú thêm (không bắt buộc)"
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsRequestDialogOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button 
                    type="submit" 
                    onClick={handleCreateRequest}
                    disabled={isSubmittingRequest}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmittingRequest ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      "Tạo yêu cầu"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${(user?.role === "unitAssistant" || user?.role === "brigadeAssistant") ? "grid-cols-2" : "grid-cols-1"}`}>
            <TabsTrigger value="outputs">Danh sách xuất kho</TabsTrigger>
            {user?.role === "unitAssistant" && (
              <TabsTrigger value="requests">Yêu cầu của tôi</TabsTrigger>
            )}
            {user?.role === "brigadeAssistant" && (
              <TabsTrigger value="requests">Quản lý yêu cầu</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="outputs">
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
          </TabsContent>

          {user?.role === "unitAssistant" && (
            <TabsContent value="requests">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Yêu cầu xuất kho của tôi</CardTitle>
                    <Button onClick={fetchOutputRequests} disabled={requestsLoading} variant="outline">
                      <RefreshCw className={`w-4 h-4 mr-2 ${requestsLoading ? 'animate-spin' : ''}`} />
                      Làm mới
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {requestsLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                      <span>Đang tải dữ liệu...</span>
                    </div>
                  ) : outputRequests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Bạn chưa có yêu cầu xuất kho nào</p>
                      <p className="text-sm mt-2">Nhấn nút "Tạo yêu cầu xuất kho" để tạo yêu cầu mới</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table className="border">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-center border-r bg-gray-100 w-12">STT</TableHead>
                            <TableHead className="text-center border-r bg-gray-100">Sản phẩm</TableHead>
                            <TableHead className="text-center border-r bg-gray-100">Danh mục</TableHead>
                            <TableHead className="text-center border-r bg-gray-100">Số lượng</TableHead>
                            <TableHead className="text-center border-r bg-gray-100">Ngày cần</TableHead>
                            <TableHead className="text-center border-r bg-gray-100">Ưu tiên</TableHead>
                            <TableHead className="text-center border-r bg-gray-100">Trạng thái</TableHead>
                            <TableHead className="text-center border-r bg-gray-100">Lý do</TableHead>
                            <TableHead className="text-center border-r bg-gray-100">Ghi chú</TableHead>
                            <TableHead className="text-center bg-gray-100">Ngày tạo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {outputRequests.map((request, index) => (
                            <TableRow key={request.id} className="border-b">
                              <TableCell className="text-center border-r font-medium">{index + 1}</TableCell>
                              <TableCell className="border-r font-medium">{request.product.name}</TableCell>
                              <TableCell className="text-center border-r">{request.product.category.name}</TableCell>
                              <TableCell className="text-center border-r font-semibold">{request.quantity} kg</TableCell>
                              <TableCell className="text-center border-r text-sm">{format(new Date(request.requestDate), "dd/MM/yyyy", { locale: vi })}</TableCell>
                              <TableCell className="text-center border-r">
                                <Badge className={getPriorityColor(request.priority)}>
                                  {getPriorityText(request.priority)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center border-r">
                                <Badge className={getRequestStatusColor(request.status)}>
                                  {getRequestStatusText(request.status)}
                                </Badge>
                              </TableCell>
                              <TableCell className="border-r text-sm max-w-[200px] truncate" title={request.reason}>
                                {request.reason}
                              </TableCell>
                              <TableCell className="border-r text-sm">{request.note || '-'}</TableCell>
                              <TableCell className="text-center text-sm">{formatDate(request.createdAt)}</TableCell>
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
                    <div className="text-sm font-medium text-blue-700 mb-1">Tổng yêu cầu</div>
                    <div className="text-2xl font-bold text-blue-800">{outputRequests.length}</div>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-yellow-700 mb-1">Chờ duyệt</div>
                    <div className="text-xl font-bold text-yellow-800">{outputRequests.filter(r => r.status === 'pending').length}</div>
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-green-700 mb-1">Đã duyệt</div>
                    <div className="text-xl font-bold text-green-800">{outputRequests.filter(r => r.status === 'approved').length}</div>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-red-700 mb-1">Từ chối</div>
                    <div className="text-lg font-bold text-red-800">{outputRequests.filter(r => r.status === 'rejected').length}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Hướng dẫn:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Nhấn "Tạo yêu cầu xuất kho" để tạo yêu cầu mới</li>
                  <li>• Yêu cầu được gửi đến trợ lý lữ đoàn để xem xét và duyệt</li>
                  <li>• Mức độ ưu tiên: Bình thường → Gấp → Khẩn cấp</li>
                  <li>• Sau khi được duyệt, yêu cầu sẽ chuyển thành kế hoạch xuất kho</li>
                  <li>• Bạn có thể theo dõi trạng thái yêu cầu trong tab này</li>
                </ul>
              </div>
            </TabsContent>
          )}

          {user?.role === "brigadeAssistant" && (
            <TabsContent value="requests">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Quản lý yêu cầu xuất kho</CardTitle>
                    <Button onClick={fetchOutputRequests} disabled={requestsLoading} variant="outline">
                      <RefreshCw className={`w-4 h-4 mr-2 ${requestsLoading ? 'animate-spin' : ''}`} />
                      Làm mới
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {requestsLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                      <span>Đang tải dữ liệu...</span>
                    </div>
                  ) : outputRequests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Không có yêu cầu xuất kho nào</p>
                      <p className="text-sm mt-2">Các yêu cầu từ đơn vị sẽ hiển thị ở đây</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table className="border">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-center border-r bg-gray-100 w-12">STT</TableHead>
                            <TableHead className="text-center border-r bg-gray-100">Sản phẩm</TableHead>
                            <TableHead className="text-center border-r bg-gray-100">Danh mục</TableHead>
                            <TableHead className="text-center border-r bg-gray-100">Đơn vị yêu cầu</TableHead>
                            <TableHead className="text-center border-r bg-gray-100">Số lượng yêu cầu</TableHead>
                            <TableHead className="text-center border-r bg-gray-100">Tồn kho</TableHead>
                            <TableHead className="text-center border-r bg-gray-100">Ngày cần</TableHead>
                            <TableHead className="text-center border-r bg-gray-100">Ưu tiên</TableHead>
                            <TableHead className="text-center border-r bg-gray-100">Trạng thái</TableHead>
                            <TableHead className="text-center border-r bg-gray-100">Lý do</TableHead>
                            <TableHead className="text-center border-r bg-gray-100">Ngày tạo</TableHead>
                            <TableHead className="text-center bg-gray-100">Thao tác</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {outputRequests.map((request, index) => (
                            <TableRow key={request.id} className="border-b">
                              <TableCell className="text-center border-r font-medium">{index + 1}</TableCell>
                              <TableCell className="border-r font-medium">{request.product.name}</TableCell>
                              <TableCell className="text-center border-r">{request.product.category.name}</TableCell>
                              <TableCell className="border-r">{request.requestingUnit?.name || 'N/A'}</TableCell>
                              <TableCell className="text-center border-r font-semibold">{request.quantity} kg</TableCell>
                              <TableCell className="text-center border-r">
                                <span className={`font-semibold ${
                                  (inventoryData[request.product.id] || 0) >= request.quantity 
                                    ? 'text-green-600' 
                                    : 'text-red-600'
                                }`}>
                                  {inventoryData[request.product.id] || 0} kg
                                </span>
                              </TableCell>
                              <TableCell className="text-center border-r text-sm">{format(new Date(request.requestDate), "dd/MM/yyyy", { locale: vi })}</TableCell>
                              <TableCell className="text-center border-r">
                                <Badge className={getPriorityColor(request.priority)}>
                                  {getPriorityText(request.priority)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center border-r">
                                <Badge className={getRequestStatusColor(request.status)}>
                                  {getRequestStatusText(request.status)}
                                </Badge>
                              </TableCell>
                              <TableCell className="border-r text-sm max-w-[200px] truncate" title={request.reason}>
                                {request.reason}
                              </TableCell>
                              <TableCell className="text-center border-r text-sm">{formatDate(request.createdAt)}</TableCell>
                              <TableCell className="text-center">
                                {request.status === 'pending' && (
                                  <div className="flex gap-1">
                                    <Button 
                                      size="sm" 
                                      className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 text-xs"
                                      onClick={() => openApprovalDialog(request)}
                                    >
                                      <Check className="w-3 h-3 mr-1" />
                                      Duyệt
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="destructive"
                                      className="px-2 py-1 text-xs"
                                      onClick={() => handleRejectRequest(request.id, "Không đủ tồn kho")}
                                    >
                                      <X className="w-3 h-3 mr-1" />
                                      Từ chối
                                    </Button>
                                  </div>
                                )}
                                {request.status !== 'pending' && (
                                  <span className="text-xs text-gray-500">Đã xử lý</span>
                                )}
                              </TableCell>
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
                    <div className="text-sm font-medium text-blue-700 mb-1">Tổng yêu cầu</div>
                    <div className="text-2xl font-bold text-blue-800">{outputRequests.length}</div>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-yellow-700 mb-1">Chờ duyệt</div>
                    <div className="text-xl font-bold text-yellow-800">{outputRequests.filter(r => r.status === 'pending').length}</div>
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-green-700 mb-1">Đã duyệt</div>
                    <div className="text-xl font-bold text-green-800">{outputRequests.filter(r => r.status === 'approved').length}</div>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-red-700 mb-1">Từ chối</div>
                    <div className="text-lg font-bold text-red-800">{outputRequests.filter(r => r.status === 'rejected').length}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Hướng dẫn quản lý yêu cầu:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Xem xét tất cả yêu cầu xuất kho từ các đơn vị</li>
                  <li>• Kiểm tra tồn kho trước khi phê duyệt yêu cầu</li>
                  <li>• Nhấn "Duyệt" để chấp nhận và tạo kế hoạch xuất kho</li>
                  <li>• Nhấn "Từ chối" nếu không đủ điều kiện hoặc tồn kho</li>
                  <li>• Các yêu cầu đã duyệt sẽ xuất hiện trong "Danh sách xuất kho"</li>
                </ul>
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Approval Dialog */}
        <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Phê duyệt yêu cầu xuất kho</DialogTitle>
              <DialogDescription>
                Xác nhận số lượng phê duyệt cho yêu cầu từ {requestToApprove?.requestingUnit?.name}
              </DialogDescription>
            </DialogHeader>
            {requestToApprove && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-medium">Sản phẩm:</Label>
                  <div className="col-span-3 font-medium">{requestToApprove.product.name}</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-medium">Số lượng yêu cầu:</Label>
                  <div className="col-span-3">{requestToApprove.quantity} kg</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-medium">Tồn kho hiện tại:</Label>
                  <div className={`col-span-3 font-semibold ${
                    (inventoryData[requestToApprove.product.id] || 0) >= requestToApprove.quantity 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {inventoryData[requestToApprove.product.id] || 0} kg
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="approvalQuantity" className="text-right font-medium">
                    Số lượng phê duyệt *
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="approvalQuantity"
                      type="number"
                      min="1"
                      max={inventoryData[requestToApprove.product.id] || 0}
                      value={approvalQuantity}
                      onChange={(e) => setApprovalQuantity(parseInt(e.target.value) || 0)}
                      className="w-full"
                      placeholder="Nhập số lượng phê duyệt"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Tối đa: {inventoryData[requestToApprove.product.id] || 0} kg
                    </p>
                  </div>
                </div>
                {approvalQuantity > (inventoryData[requestToApprove.product.id] || 0) && (
                  <div className="col-span-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                    ⚠️ Số lượng phê duyệt vượt quá tồn kho hiện có
                  </div>
                )}
                {approvalQuantity < requestToApprove.quantity && (
                  <div className="col-span-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded text-sm">
                    ℹ️ Phê duyệt một phần ({approvalQuantity}/{requestToApprove.quantity} kg)
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setApprovalDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button 
                type="submit" 
                onClick={handleApproveRequest}
                disabled={!approvalQuantity || approvalQuantity > (inventoryData[requestToApprove?.product.id || ''] || 0)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Phê duyệt {approvalQuantity} kg
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}