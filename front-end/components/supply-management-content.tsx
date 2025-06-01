"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CalendarIcon, Search, FileDown, FileUp, Edit, Eye, Trash2, Check, X } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { suppliesApi, unitsApi, categoriesApi, productsApi } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth/auth-provider"
import { SupplySource, Unit, ProductCategory, SupplyFormData, Product } from "@/types"

export function SupplyManagementContent() {
  const [date, setDate] = useState<Date>()
  const [supplies, setSupplies] = useState<SupplySource[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("list")
  const { toast } = useToast()
  const { user } = useAuth()

  // Edit/Delete state
  const [editingSupply, setEditingSupply] = useState<SupplySource | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [supplyToDelete, setSupplyToDelete] = useState<SupplySource | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Approval state
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [supplyToApprove, setSupplyToApprove] = useState<SupplySource | null>(null)
  const [isApproving, setIsApproving] = useState(false)
  const [approvalData, setApprovalData] = useState({
    stationEntryDate: "",
    requestedQuantity: 0,
    actualQuantity: 0,
    unitPrice: 0,
    expiryDate: "",
    note: "",
  })

  // Form state
  const [formData, setFormData] = useState<SupplyFormData>({
    unit: "",
    category: "",
    product: "",
    supplyQuantity: 0,
    expectedHarvestDate: "",
    expiryDate: "",
    note: "",
  })

  // Debug logging for supplies state changes
  useEffect(() => {
    console.log("Supplies state changed:", supplies.length, "items")
    console.log("Supplies:", supplies)
  }, [supplies])

  // Debug logging for loading state changes
  useEffect(() => {
    console.log("Loading state changed:", isLoading)
  }, [isLoading])

  // Debug logging for active tab changes
  useEffect(() => {
    console.log("Active tab changed:", activeTab)
  }, [activeTab])

  const fetchSupplies = async () => {
    try {
      console.log("Fetching supplies...")
      setIsLoading(true)
      setError(null)

      const response = await suppliesApi.getSupplies()
      console.log("Raw API Response:", response) // Debug log
      
      // Handle different response formats
      if (Array.isArray(response)) {
        console.log("Response is array, setting supplies:", response.length, "items")
        setSupplies(response)
      } else if (response && Array.isArray((response as any).data)) {
        console.log("Response has data array, setting supplies:", (response as any).data.length, "items")
        setSupplies((response as any).data)
      } else {
        console.warn("Unexpected response format:", response)
        setSupplies([])
      }
      
      console.log("Supplies state updated")
    } catch (error) {
      console.error("Error fetching supplies:", error)
    
      if (error instanceof Error && error.message.includes("Failed to fetch")) {
        setError("Không thể kết nối đến server. Vui lòng kiểm tra xem backend đã được khởi động chưa.")
        toast({
          title: "Lỗi kết nối",
          description: "Backend server chưa được khởi động. Vui lòng khởi động server và thử lại.",
          variant: "destructive",
        })
      } else {
        setError("Không thể tải dữ liệu nguồn nhập. Vui lòng thử lại sau.")
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu từ server.",
          variant: "destructive",
        })
      }

      // Use fallback data
      setSupplies([])
    } finally {
      console.log("Fetch supplies completed")
      setIsLoading(false)
    }
  }

  const fetchUnits = async () => {
    try {
      const response = await unitsApi.getUnits()
      if (Array.isArray(response)) {
        setUnits(response)
      } else if (response && Array.isArray((response as any).data)) {
        setUnits((response as any).data)
      }
    } catch (error) {
      console.error("Error fetching units:", error)
      // Use fallback data
      setUnits([])
    }
  }

  const fetchCategories = async () => {
    try {
      // Try to get food categories from supplies API first (requires auth)
      const response = await suppliesApi.getFoodCategories()
      if (response && Array.isArray((response as any).data)) {
        setCategories((response as any).data)
        return
      }
    } catch (error) {
      console.error("Error fetching food categories, trying regular categories:", error)
    }
    
    try {
      // Fallback to regular categories API (public)
      const response = await categoriesApi.getCategories()
      if (response && !Array.isArray(response) && (response as any).success && Array.isArray((response as any).data)) {
        setCategories((response as any).data)
      } else if (Array.isArray(response)) {
        setCategories(response)
      }
    } catch (fallbackError) {
      console.error("Error fetching categories:", fallbackError)
      setCategories([])
    }
  }

  const fetchProductsByCategory = async (categoryId: string) => {
    try {
      // Try to get food products from supplies API first (requires auth)
      const response = await suppliesApi.getFoodProducts(categoryId)
      if (response && Array.isArray((response as any).data)) {
        setProducts((response as any).data)
        return
      }
    } catch (error) {
      console.error("Error fetching food products, trying regular products:", error)
    }
    
    try {
      // Fallback to regular products API (public)
      const response = await productsApi.getProducts(categoryId)
      if (response && !Array.isArray(response) && (response as any).success && Array.isArray((response as any).data)) {
        setProducts((response as any).data)
      } else if (Array.isArray(response)) {
        setProducts(response)
      }
    } catch (fallbackError) {
      console.error("Error fetching products:", fallbackError)
      setProducts([])
      toast({
        title: "Thông báo",
        description: "Không thể tải danh sách sản phẩm. Vui lòng đăng nhập để xem đầy đủ dữ liệu.",
        variant: "default",
      })
    }
  }

  useEffect(() => {
    fetchSupplies()
    // Only fetch units if user is admin (for unit selection)
    if (user?.role === "admin") {
      fetchUnits()
    }
    fetchCategories()
  }, [user])

  // Fetch products when category changes
  useEffect(() => {
    if (formData.category) {
      fetchProductsByCategory(formData.category)
    } else {
      setProducts([])
      // Reset product selection when category changes
      if (formData.product) {
        setFormData(prev => ({ ...prev, product: "" }))
      }
    }
  }, [formData.category])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!formData.category || !formData.product || !formData.supplyQuantity || !formData.expectedHarvestDate) {
        toast({
          title: "Lỗi",
          description: "Vui lòng điền đầy đủ thông tin bắt buộc",
          variant: "destructive",
        })
        return
      }

      console.log("Submitting form data:", formData)

      let response
      if (isEditing && editingSupply) {
        // Update existing supply
        response = await suppliesApi.updateSupply(editingSupply.id, formData)
      } else {
        // Create new supply
        response = await suppliesApi.createSupply(formData)
      }

      console.log("API response:", response)

      if (response.success) {
        toast({
          title: "Thành công",
          description: isEditing ? "Đã cập nhật nguồn nhập thành công!" : "Đã thêm nguồn nhập mới thành công! Trạng thái: Chờ phê duyệt",
        })

        // Reset form and editing state
        resetForm()
        
        console.log("Starting to refresh supplies list...")
        
        // Refresh supplies list
        await fetchSupplies()
        
        console.log("Supplies list refreshed")
        
        // Switch back to list tab
        setActiveTab("list")
      }
    } catch (error) {
      console.error("Error saving supply:", error)
      toast({
        title: "Lỗi kết nối",
        description: "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (supply: SupplySource) => {
    // Only unit assistants can edit supplies in pending status
    if (user?.role !== "unitAssistant" || supply.status !== "pending") {
      toast({
        title: "Không thể chỉnh sửa",
        description: "Chỉ có thể chỉnh sửa nguồn nhập ở trạng thái chờ phê duyệt",
        variant: "destructive",
          })
      return
    }

    setEditingSupply(supply)
    setIsEditing(true)
    
    // Populate form with existing data
    setFormData({
      unit: supply.unit?._id || "",
      category: supply.category?._id || "",
      product: supply.product?._id || "",
      supplyQuantity: supply.supplyQuantity || 0,
      expectedHarvestDate: supply.expectedHarvestDate ? format(new Date(supply.expectedHarvestDate), "yyyy-MM-dd") : "",
      expiryDate: supply.expiryDate ? format(new Date(supply.expiryDate), "yyyy-MM-dd") : "",
      note: supply.note || "",
    })

    // Set date for calendar
    if (supply.expectedHarvestDate) {
      setDate(new Date(supply.expectedHarvestDate))
    }

    // Switch to add tab (which will now be edit mode)
    setActiveTab("add")
  }

  const handleDelete = (supply: SupplySource) => {
    // Only unit assistants can delete supplies in pending status
    if (user?.role !== "unitAssistant" || supply.status !== "pending") {
      toast({
        title: "Không thể xóa",
        description: "Chỉ có thể xóa nguồn nhập ở trạng thái chờ phê duyệt",
        variant: "destructive",
      })
      return
    }

    setSupplyToDelete(supply)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!supplyToDelete) return

    setIsDeleting(true)
    try {
      const response = await suppliesApi.deleteSupply(supplyToDelete.id)
      
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đã xóa nguồn nhập thành công!",
        })
        
        // Refresh supplies list
        fetchSupplies()
      }
    } catch (error) {
      console.error("Error deleting supply:", error)
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra khi xóa nguồn nhập",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setSupplyToDelete(null)
    }
  }

  const handleApprove = (supply: SupplySource) => {
    // Only brigade assistants can approve supplies
    if (user?.role !== "brigadeAssistant") {
      toast({
        title: "Không có quyền",
        description: "Chỉ trợ lý lữ đoàn mới có thể phê duyệt nguồn nhập",
        variant: "destructive",
      })
      return
    }

    if (supply.status !== "pending") {
      toast({
        title: "Không thể phê duyệt",
        description: "Chỉ có thể phê duyệt nguồn nhập ở trạng thái chờ phê duyệt",
        variant: "destructive",
      })
      return
    }

    setSupplyToApprove(supply)
    setApprovalData({
      stationEntryDate: "",
      requestedQuantity: supply.supplyQuantity || 0,
      actualQuantity: supply.actualQuantity || 0,
      unitPrice: 0,
      expiryDate: "",
      note: supply.note || "",
    })
    setApprovalDialogOpen(true)
  }

  const confirmApproval = async () => {
    if (!supplyToApprove) return

    setIsApproving(true)
    try {
      const response = await suppliesApi.approveSupply(supplyToApprove.id, approvalData)
      
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đã phê duyệt nguồn nhập thành công! Thông tin đã được cập nhật vào hệ thống trạm chế biến",
        })
        
        // Refresh supplies list
        fetchSupplies()
      }
    } catch (error) {
      console.error("Error approving supply:", error)
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra khi phê duyệt nguồn nhập",
        variant: "destructive",
      })
    } finally {
      setIsApproving(false)
      setApprovalDialogOpen(false)
      setSupplyToApprove(null)
    }
  }

  const handleReject = async (supply: SupplySource) => {
    // Only brigade assistants can reject supplies
    if (user?.role !== "brigadeAssistant") {
      toast({
        title: "Không có quyền",
        description: "Chỉ trợ lý lữ đoàn mới có thể từ chối nguồn nhập",
        variant: "destructive",
      })
      return
    }

    if (supply.status !== "pending") {
      toast({
        title: "Không thể từ chối",
        description: "Chỉ có thể từ chối nguồn nhập ở trạng thái chờ phê duyệt",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await suppliesApi.rejectSupply(supply.id, { note: "Từ chối bởi trợ lý lữ đoàn" })
      
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đã từ chối nguồn nhập thành công!",
        })
        
        // Refresh supplies list
        fetchSupplies()
      }
    } catch (error) {
      console.error("Error rejecting supply:", error)
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra khi từ chối nguồn nhập",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      unit: "",
      category: "",
      product: "",
      supplyQuantity: 0,
      expectedHarvestDate: "",
      expiryDate: "",
      note: "",
    })
    setDate(undefined)
    setIsEditing(false)
    setEditingSupply(null)
    setProducts([])
    // Switch back to list tab after reset
    setActiveTab("list")
  }

  const handleInputChange = (field: keyof SupplyFormData, value: string | number | boolean) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Reset product when category changes
      if (field === 'category') {
        newData.product = ""
      }
      
      return newData
    })
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (selectedDate) {
      handleInputChange("expectedHarvestDate", format(selectedDate, "yyyy-MM-dd"))
    }
    }
    
  const filteredSupplies = supplies.filter((supply) => {
    const matchesSearch =
      (supply.product?.name && supply.product.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (supply.unit?.name && supply.unit.name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || supply.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "pending":
        return "Chờ phê duyệt"
      case "approved":
        return "Đã phê duyệt ✓"
      case "rejected":
        return "Đã từ chối"
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-green-100 text-green-800 font-semibold"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSelectedProduct = () => {
    return products.find(product => product._id === formData.product)
  }

  const canEditOrDelete = (supply: SupplySource) => {
    return user?.role === "unitAssistant" && supply.status === "pending"
  }

  const canApproveOrReject = (supply: SupplySource) => {
    return user?.role === "brigadeAssistant" && supply.status === "pending"
  }

  const canAddSupply = () => {
    return user?.role === "unitAssistant"
  }

  // Helper function to determine if additional columns should be shown
  const shouldShowAdditionalColumns = () => {
    return user?.role === "brigadeAssistant" || filteredSupplies.some(supply => supply.status === "approved")
  }

  // Helper function to determine if a specific supply's additional info should be shown
  const shouldShowSupplyDetails = (supply: SupplySource) => {
    return user?.role === "brigadeAssistant" || supply.status === "approved"
  }

  return (
    <div className="container">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#b45f06]">QUẢN LÝ NGUỒN NHẬP</h2>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Danh sách nguồn nhập</TabsTrigger>
            {canAddSupply() && (
              <TabsTrigger value="add">{isEditing ? "Chỉnh sửa nguồn nhập" : "Thêm nguồn nhập mới"}</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2 items-center">
                <Input 
                  placeholder="Tìm kiếm..." 
                  className="w-64" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="pending">Chờ duyệt</SelectItem>
                    <SelectItem value="approved">Đã nhập</SelectItem>
                    <SelectItem value="rejected">Từ chối</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex items-center gap-2">
                  <FileDown className="h-4 w-4" />
                  Xuất Excel
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <FileUp className="h-4 w-4" />
                  Nhập Excel
                </Button>
              </div>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

            <Card>
              <CardHeader>
                <CardTitle>Danh sách nguồn nhập ({filteredSupplies.length} mục)</CardTitle>
                {shouldShowAdditionalColumns() && user?.role !== "brigadeAssistant" && (
                  <p className="text-sm text-blue-600 mt-2">
                    💡 Thông tin chi tiết (số lượng, giá tiền, hạn sử dụng) chỉ hiển thị cho các nguồn nhập đã được phê duyệt
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">Đang tải dữ liệu...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>STT</TableHead>
                        <TableHead>Tên hàng</TableHead>
                        <TableHead>Đơn vị</TableHead>
                        <TableHead>Số lượng dự kiến</TableHead>
                        {shouldShowAdditionalColumns() && <TableHead>SL nhập yêu cầu</TableHead>}
                        {shouldShowAdditionalColumns() && <TableHead>SL nhập thực tế</TableHead>}
                        {shouldShowAdditionalColumns() && <TableHead>Đơn giá (VND)</TableHead>}
                        {shouldShowAdditionalColumns() && <TableHead>Thành tiền (VND)</TableHead>}
                        <TableHead>Ngày thu hoạch dự kiến</TableHead>
                        {shouldShowAdditionalColumns() && <TableHead>Hạn sử dụng</TableHead>}
                        {shouldShowAdditionalColumns() && <TableHead>Ngày nhập trạm</TableHead>}
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Người phê duyệt</TableHead>
                        <TableHead>Ngày tạo</TableHead>
                        <TableHead>Ghi chú</TableHead>
                        <TableHead>Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSupplies.map((supply, index) => (
                        <TableRow key={supply.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{supply.product?.name}</TableCell>
                          <TableCell>{supply.unit?.name}</TableCell>
                          <TableCell>{supply.supplyQuantity}</TableCell>
                          {shouldShowAdditionalColumns() && (
                            <TableCell>
                              {shouldShowSupplyDetails(supply) ? (supply.requestedQuantity || "Chưa có") : "Chưa phê duyệt"}
                            </TableCell>
                          )}
                          {shouldShowAdditionalColumns() && (
                            <TableCell>
                              {shouldShowSupplyDetails(supply) ? (supply.actualQuantity || "Chưa có") : "Chưa phê duyệt"}
                            </TableCell>
                          )}
                          {shouldShowAdditionalColumns() && (
                            <TableCell>
                              {shouldShowSupplyDetails(supply) ? (supply.unitPrice?.toLocaleString('vi-VN') || "Chưa có") : "Chưa phê duyệt"}
                            </TableCell>
                          )}
                          {shouldShowAdditionalColumns() && (
                            <TableCell>
                              {shouldShowSupplyDetails(supply) ? 
                                ((supply.actualQuantity && supply.unitPrice) ? (supply.actualQuantity * supply.unitPrice).toLocaleString('vi-VN') : "Chưa có") 
                                : "Chưa phê duyệt"}
                            </TableCell>
                          )}
                          <TableCell>{format(new Date(supply.expectedHarvestDate), "dd/MM/yyyy")}</TableCell>
                          {shouldShowAdditionalColumns() && (
                            <TableCell>
                              {shouldShowSupplyDetails(supply) ? 
                                (supply.expiryDate ? format(new Date(supply.expiryDate), "dd/MM/yyyy") : "Chưa có") 
                                : "Chưa phê duyệt"}
                            </TableCell>
                          )}
                          {shouldShowAdditionalColumns() && (
                            <TableCell>
                              {shouldShowSupplyDetails(supply) ? 
                                (supply.stationEntryDate ? format(new Date(supply.stationEntryDate), "dd/MM/yyyy") : "Chưa nhập trạm") 
                                : "Chưa phê duyệt"}
                            </TableCell>
                          )}
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(supply.status)}`}>
                              {getStatusDisplay(supply.status)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {supply.approvedBy && typeof supply.approvedBy === 'object' 
                              ? supply.approvedBy.name 
                              : supply.approvedBy || "Chưa phê duyệt"}
                          </TableCell>
                          <TableCell>{format(new Date(supply.createdAt), "dd/MM/yyyy")}</TableCell>
                          <TableCell>{supply.note}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {user?.role === "commander" ? (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  title="Xem chi tiết"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              ) : (
                                <>
                                  {canEditOrDelete(supply) && (
                                    <>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleEdit(supply)}
                                        title="Chỉnh sửa"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleDelete(supply)}
                                        title="Xóa"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                  {canApproveOrReject(supply) && (
                                    <>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleApprove(supply)}
                                        title="Phê duyệt"
                                        className="text-green-600 hover:text-green-700"
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleReject(supply)}
                                        title="Từ chối"
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {canAddSupply() && (
          <TabsContent value="add">
            <Card>
              <CardHeader>
                  <CardTitle>{isEditing ? "Chỉnh sửa nguồn nhập" : "Thêm nguồn nhập mới"}</CardTitle>
              </CardHeader>
              <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="category" className="font-medium">
                          Phân loại *
                      </label>
                        <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn phân loại" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                              <SelectItem key={`category-${category._id}`} value={category._id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="product" className="font-medium">
                          Tên LTTP - Chất đốt *
                      </label>
                        <Select 
                          value={formData.product} 
                          onValueChange={(value) => handleInputChange("product", value)}
                          disabled={!formData.category}
                        >
                        <SelectTrigger>
                            <SelectValue placeholder={formData.category ? "Chọn sản phẩm" : "Chọn phân loại trước"} />
                        </SelectTrigger>
                        <SelectContent>
                            {products
                              .filter(product => product._id && product._id.trim() !== "")
                              .map((product, index) => (
                            <SelectItem key={product._id} value={product._id}>
                                  {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                      <div className="space-y-2">
                        <label htmlFor="unit-display" className="font-medium">
                          Đơn vị tính
                        </label>
                        <Input
                          id="unit-display"
                          value={getSelectedProduct()?.unit || ""}
                          placeholder="Đơn vị tính sẽ hiển thị khi chọn sản phẩm"
                          disabled
                          className="bg-gray-50"
                        />
                      </div>

                    <div className="space-y-2">
                        <label htmlFor="supplyQuantity" className="font-medium">
                          Số lượng dự kiến *
                      </label>
                        <Input
                          id="supplyQuantity"
                          type="number"
                          placeholder="Nhập số lượng dự kiến"
                          value={formData.supplyQuantity || ""}
                          onChange={(e) => handleInputChange("supplyQuantity", Number.parseFloat(e.target.value) || 0)}
                          required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="expectedHarvestDate" className="font-medium">
                          Ngày thu hoạch dự kiến *
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP", { locale: vi }) : "Chọn ngày"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={date} onSelect={handleDateSelect} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>

                      <div className="space-y-2">
                        <label htmlFor="expiryDate" className="font-medium">
                          Hạn sử dụng
                        </label>
                        <Input
                          id="expiryDate"
                          type="date"
                          value={formData.expiryDate}
                          onChange={(e) => handleInputChange("expiryDate", e.target.value)}
                        />
                  </div>
                      
                      <div className="space-y-2 md:col-span-3">
                        <label htmlFor="note" className="font-medium">
                      Ghi chú
                    </label>
                    <textarea
                          id="note"
                      className="w-full min-h-[100px] p-2 border border-gray-300 rounded-md"
                      placeholder="Nhập ghi chú (nếu có)"
                          value={formData.note}
                          onChange={(e) => handleInputChange("note", e.target.value)}
                    ></textarea>
                      </div>
                  </div>
                  <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                      >
                        {isEditing ? "Hủy chỉnh sửa" : "Hủy"}
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Đang lưu..." : (isEditing ? "Cập nhật" : "Lưu")}
                      </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          )}
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận xóa</DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn xóa nguồn nhập "{supplyToDelete?.product?.name}" không? 
                Hành động này không thể hoàn tác.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Đang xóa..." : "Xóa"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Approval Dialog */}
        <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Phê duyệt nguồn nhập</DialogTitle>
              <DialogDescription>
                Điền thông tin phê duyệt cho "{supplyToApprove?.product?.name}"
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="approval-station-date" className="font-medium">
                  Ngày nhập trạm *
                </label>
                <Input
                  id="approval-station-date"
                  type="date"
                  value={approvalData.stationEntryDate}
                  onChange={(e) => setApprovalData(prev => ({ ...prev, stationEntryDate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="approval-requested-quantity" className="font-medium">
                  Số lượng nhập yêu cầu (kg) *
                </label>
                <Input
                  id="approval-requested-quantity"
                  type="number"
                  value={approvalData.requestedQuantity || ""}
                  onChange={(e) => setApprovalData(prev => ({ ...prev, requestedQuantity: Number(e.target.value) || 0 }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="approval-actual-quantity" className="font-medium">
                  Số lượng nhập thực tế (kg) *
                </label>
                <Input
                  id="approval-actual-quantity"
                  type="number"
                  value={approvalData.actualQuantity || ""}
                  onChange={(e) => setApprovalData(prev => ({ ...prev, actualQuantity: Number(e.target.value) || 0 }))}
                  required
                />
                <p className="text-sm text-gray-600">
                  Ví dụ: Yêu cầu 100kg nhưng cân thực tế là 110kg
                </p>
              </div>
              <div className="space-y-2">
                <label htmlFor="approval-unit-price" className="font-medium">
                  Đơn giá (VND/kg) *
                </label>
                <Input
                  id="approval-unit-price"
                  type="number"
                  value={approvalData.unitPrice || ""}
                  onChange={(e) => setApprovalData(prev => ({ ...prev, unitPrice: Number(e.target.value) || 0 }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="approval-expiry-date" className="font-medium">
                  Hạn sử dụng *
                </label>
                <Input
                  id="approval-expiry-date"
                  type="date"
                  value={approvalData.expiryDate}
                  onChange={(e) => setApprovalData(prev => ({ ...prev, expiryDate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="approval-total-price" className="font-medium">
                  Thành tiền (VND)
                </label>
                <Input
                  id="approval-total-price"
                  type="text"
                  value={((approvalData.actualQuantity || 0) * (approvalData.unitPrice || 0)).toLocaleString('vi-VN') + ' VND'}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-sm text-gray-600">
                  Tự động tính: {approvalData.actualQuantity || 0} kg × {(approvalData.unitPrice || 0).toLocaleString('vi-VN')} VND/kg
                </p>
              </div>
              <div className="space-y-2">
                <label htmlFor="approval-note" className="font-medium">
                  Ghi chú
                </label>
                <textarea
                  id="approval-note"
                  className="w-full min-h-[80px] p-2 border border-gray-300 rounded-md"
                  placeholder="Ghi chú phê duyệt (nếu có)"
                  value={approvalData.note}
                  onChange={(e) => setApprovalData(prev => ({ ...prev, note: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setApprovalDialogOpen(false)}
                disabled={isApproving}
              >
                Hủy
              </Button>
              <Button
                onClick={confirmApproval}
                disabled={isApproving || !approvalData.stationEntryDate || !approvalData.requestedQuantity || !approvalData.actualQuantity || !approvalData.unitPrice || !approvalData.expiryDate}
              >
                {isApproving ? "Đang phê duyệt..." : "Phê duyệt"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
