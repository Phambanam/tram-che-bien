"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Pagination } from "@/components/ui/pagination"
import { MoreHorizontal, Edit, Trash, CheckCircle, Eye, AlertCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

// Interfaces
interface Supply {
  id: string
  unit: {
    _id: string
    name: string
  }
  category: {
    _id: string
    name: string
  }
  product: {
    _id: string
    name: string
    unit: string
  }
  expectedQuantity: number
  expectedHarvestDate: string
  stationEntryDate: string | null
  requiredQuantity: number | null
  actualQuantity: number | null
  price: number | null
  totalPrice: number | null
  expiryDate: string | null
  status: string
  note: string
  createdBy?: {
    id: string
    name: string
  }
  approvedBy?: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

interface UserInfo {
  id: string
  name: string
  username: string
  role: string
  unit: string
}

export function SuppliesTable() {
  const router = useRouter()
  const { toast } = useToast()
  const [supplies, setSupplies] = useState<Supply[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null)
  const [stationEntryDate, setStationEntryDate] = useState("")
  const [requiredQuantity, setRequiredQuantity] = useState("")
  const [actualQuantity, setActualQuantity] = useState("")
  const [price, setPrice] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [note, setNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [limit] = useState(10)

  // Lấy thông tin người dùng từ JWT token
  useEffect(() => {
    const getUserInfoFromToken = () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) return null

        // Lấy payload từ JWT (phần giữa của token)
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        }).join(''))

        const payload = JSON.parse(jsonPayload)
        
        // Lấy thông tin người dùng từ payload
        setUserInfo({
          id: payload.id || payload.userId || payload.sub,
          name: payload.name || payload.fullName || "",
          username: payload.username || payload.email || "",
          role: payload.role || "",
          unit: payload.unit || "",
        })
        
        console.log("User info extracted from JWT:", payload)
      } catch (error) {
        console.error("Error extracting user info from token:", error)
        return null
      }
    }

    getUserInfoFromToken()
  }, [])

  useEffect(() => {
    const fetchSupplies = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
        setInitialized(true)
        return
      }
      
      try {
        setLoading(true)
        setError(null)

        console.log("Fetching supplies with JWT token")

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/supplies?page=${currentPage}&limit=${limit}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Không thể tải danh sách nguồn nhập")
        }

        const data = await response.json()
        console.log("Fetched supplies:", data)
        setSupplies(data.data || data)
        // Set pagination data if available
        if (data.pagination) {
          setTotalCount(data.pagination.totalCount || 0)
          setTotalPages(data.pagination.totalPages || 1)
        } else {
          setTotalCount(data.length || 0)
          setTotalPages(Math.ceil((data.length || 0) / limit) || 1)
        }
      } catch (error) {
        console.error("Error fetching supplies:", error)
        setError(error instanceof Error ? error.message : "Đã xảy ra lỗi khi tải danh sách nguồn nhập")
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi tải danh sách nguồn nhập",
        })
      } finally {
        setLoading(false)
        setInitialized(true)
      }
    }

    fetchSupplies()
  }, [toast, currentPage, limit])

  // Handle page change for pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleApprove = (supply: Supply) => {
    setSelectedSupply(supply)
    setStationEntryDate(new Date().toISOString().split("T")[0])
    setRequiredQuantity(supply.expectedQuantity.toString())
    setActualQuantity("")
    setPrice("")
    setExpiryDate("")
    setNote(supply.note || "")
    setApproveDialogOpen(true)
  }

  const handleApproveConfirm = async () => {
    if (!selectedSupply) return

    try {
      setIsSubmitting(true)

      const approvalData = {
        status: "approved",
        stationEntryDate,
        requiredQuantity: Number(requiredQuantity),
        actualQuantity: Number(actualQuantity),
        price: Number(price),
        totalPrice: Number(actualQuantity) * Number(price),
        expiryDate,
        note,
      }

      console.log("Approving supply:", approvalData)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/supplies/${selectedSupply.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(approvalData),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Đã xảy ra lỗi khi phê duyệt nguồn nhập")
      }

      toast({
        title: "Phê duyệt thành công",
        description: `Đã phê duyệt nguồn nhập ${selectedSupply.product.name} từ ${selectedSupply.unit.name}`,
      })

      // Cập nhật danh sách nguồn nhập
      setSupplies(
        supplies.map((supply) =>
          supply.id === selectedSupply.id
            ? {
              ...supply,
              status: "approved",
              stationEntryDate,
              requiredQuantity: Number(requiredQuantity),
              actualQuantity: Number(actualQuantity),
              price: Number(price),
              totalPrice: Number(actualQuantity) * Number(price),
              expiryDate,
              note,
            }
            : supply,
        ),
      )

      setApproveDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error approving supply:", error)
      toast({
        variant: "destructive",
        title: "Phê duyệt thất bại",
        description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi phê duyệt nguồn nhập",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (supply: Supply) => {
    router.push(`/dashboard/supplies/edit/${supply.id}`)
  }

  const handleView = (supply: Supply) => {
    setSelectedSupply(supply)
    setViewDialogOpen(true)
  }

  const handleDelete = (supply: Supply) => {
    setSelectedSupply(supply)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedSupply) return

    try {
      setIsSubmitting(true)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/supplies/${selectedSupply.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Đã xảy ra lỗi khi xóa nguồn nhập")
      }

      toast({
        title: "Xóa thành công",
        description: `Đã xóa nguồn nhập ${selectedSupply.product.name} từ ${selectedSupply.unit.name}`,
      })

      setSupplies(supplies.filter((supply) => supply.id !== selectedSupply.id))
      setDeleteDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error deleting supply:", error)
      toast({
        variant: "destructive",
        title: "Xóa thất bại",
        description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi xóa nguồn nhập",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusName = (status: string) => {
    switch (status) {
      case "approved":
        return "Đã phê duyệt"
      case "pending":
        return "Chờ phê duyệt"
      case "rejected":
        return "Đã từ chối"
      default:
        return status
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "success"
      case "pending":
        return "warning"
      case "rejected":
        return "destructive"
      default:
        return "outline"
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString("vi-VN")
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "-"
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  // Lọc nguồn nhập theo đơn vị nếu là trợ lý tiểu đoàn
  const filteredSupplies = supplies.filter((supply) => {
    if (userInfo?.role === "unitAssistant") {
      return supply.unit._id === userInfo.unit
    }
    return true
  })

  // Hiển thị loading
  if (loading) {
    return (
      <div className="text-center py-12 bg-white/50 rounded-lg shadow-sm border border-gray-100">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
      </div>
    )
  }

  // Hiển thị thông báo đăng nhập nếu không có token
  if (!localStorage.getItem("token")) {
    return (
      <div className="text-center py-12 bg-white/50 rounded-lg shadow-sm border border-gray-100">
        <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
        <p className="text-gray-600 font-medium mb-4">Vui lòng đăng nhập để xem danh sách nguồn nhập</p>
        <Button className="bg-primary hover:bg-primary/90" onClick={() => router.push("/login")}>
          Đăng nhập
        </Button>
      </div>
    )
  }

  // Hiển thị lỗi
  if (error) {
    return (
      <div className="text-center py-12 bg-white/50 rounded-lg shadow-sm border border-gray-100">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
        <p className="text-destructive font-medium mb-2">Lỗi</p>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button variant="outline" onClick={() => router.refresh()}>
          Thử lại
        </Button>
      </div>
    )
  }

  // Hiển thị khi không có dữ liệu
  if (initialized && filteredSupplies.length === 0) {
    return (
      <div className="text-center py-12 bg-white/50 rounded-lg shadow-sm border border-gray-100">
        <p className="text-gray-500 font-medium mb-4">Không có dữ liệu nguồn nhập</p>
        {(userInfo?.role === "unitAssistant" || userInfo?.role === "admin") && (
          <Button className="bg-primary hover:bg-primary/90" onClick={() => router.push("/dashboard/supplies/new")}>
            Thêm nguồn nhập mới
          </Button>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-12 font-semibold text-gray-700">STT</TableHead>
                <TableHead className="font-semibold text-gray-700">Đơn vị</TableHead>
                <TableHead className="font-semibold text-gray-700">Phân loại</TableHead>
                <TableHead className="font-semibold text-gray-700">Tên LTTP-Chất đốt</TableHead>
                <TableHead className="font-semibold text-gray-700">ĐVT</TableHead>
                <TableHead className="font-semibold text-gray-700">SL dự kiến</TableHead>
                <TableHead className="font-semibold text-gray-700">Ngày thu hoạch</TableHead>
                <TableHead className="font-semibold text-gray-700">SL yêu cầu</TableHead>
                <TableHead className="font-semibold text-gray-700">SL thực tế</TableHead>
                <TableHead className="font-semibold text-gray-700">Giá tiền</TableHead>
                <TableHead className="font-semibold text-gray-700">Thành tiền</TableHead>
                <TableHead className="font-semibold text-gray-700">Ngày nhập</TableHead>
                <TableHead className="font-semibold text-gray-700">Hạn SD</TableHead>
                <TableHead className="font-semibold text-gray-700">Trạng thái</TableHead>
                <TableHead className="font-semibold text-gray-700">Ghi chú</TableHead>
                <TableHead className="text-right w-20 font-semibold text-gray-700">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSupplies.map((supply, index) => (
                <TableRow key={supply.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <TableCell className="font-medium">{(currentPage - 1) * limit + index + 1}</TableCell>
                  <TableCell>{supply.unit.name}</TableCell>
                  <TableCell>{supply.category.name}</TableCell>
                  <TableCell className="font-medium text-gray-700">{supply.product.name}</TableCell>
                  <TableCell>{supply.product.unit}</TableCell>
                  <TableCell className="text-gray-700">{supply.expectedQuantity}</TableCell>
                  <TableCell>{formatDate(supply.expectedHarvestDate)}</TableCell>
                  <TableCell className="text-gray-700">{supply.requiredQuantity || "-"}</TableCell>
                  <TableCell className="text-gray-700">{supply.actualQuantity || "-"}</TableCell>
                  <TableCell>{formatCurrency(supply.price)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(supply.totalPrice)}</TableCell>
                  <TableCell>{formatDate(supply.stationEntryDate)}</TableCell>
                  <TableCell>{formatDate(supply.expiryDate)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(supply.status)} className={supply.status === "approved" ? "bg-green-100 text-green-800 hover:bg-green-200" : supply.status === "pending" ? "bg-amber-100 text-amber-800 hover:bg-amber-200" : "bg-red-100 text-red-800 hover:bg-red-200"}>
                      {getStatusName(supply.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate" title={supply.note || "-"}>{supply.note || "-"}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                          <span className="sr-only">Mở menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white shadow-lg border border-gray-100">
                        <DropdownMenuLabel className="text-gray-700">Thao tác</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {/* Chỉ huy chỉ có quyền xem */}
                        {userInfo?.role === "commander" && (
                          <DropdownMenuItem onClick={() => handleView(supply)} className="text-blue-600 hover:bg-blue-50 cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" />
                            Xem chi tiết
                          </DropdownMenuItem>
                        )}

                        {/* Trợ lý lữ đoàn có quyền phê duyệt */}
                        {userInfo?.role === "brigadeAssistant" && supply.status === "pending" && (
                          <DropdownMenuItem onClick={() => handleApprove(supply)} className="text-green-600 hover:bg-green-50 cursor-pointer">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Phê duyệt
                          </DropdownMenuItem>
                        )}

                        {/* Trợ lý lữ đoàn có quyền xem chi tiết nguồn nhập đã phê duyệt */}
                        {userInfo?.role === "brigadeAssistant" && supply.status === "approved" && (
                          <DropdownMenuItem onClick={() => handleView(supply)} className="text-blue-600 hover:bg-blue-50 cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" />
                            Xem chi tiết
                          </DropdownMenuItem>
                        )}

                        {/* Trợ lý tiểu đoàn có quyền chỉnh sửa và xóa nguồn nhập chờ phê duyệt */}
                        {userInfo?.role === "unitAssistant" &&
                          supply.status === "pending" &&
                          supply.unit._id === userInfo.unit && (
                            <>
                              <DropdownMenuItem onClick={() => handleEdit(supply)} className="text-amber-600 hover:bg-amber-50 cursor-pointer">
                                <Edit className="mr-2 h-4 w-4" />
                                Chỉnh sửa
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(supply)} className="text-red-600 hover:bg-red-50 cursor-pointer">
                                <Trash className="mr-2 h-4 w-4" />
                                Xóa
                              </DropdownMenuItem>
                            </>
                          )}

                        {/* Trợ lý tiểu đoàn có quyền xem chi tiết nguồn nhập đã phê duyệt */}
                        {userInfo?.role === "unitAssistant" &&
                          supply.status === "approved" &&
                          supply.unit._id === userInfo.unit && (
                            <DropdownMenuItem onClick={() => handleView(supply)} className="text-blue-600 hover:bg-blue-50 cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" />
                              Xem chi tiết
                            </DropdownMenuItem>
                          )}

                        {/* Admin có tất cả quyền */}
                        {userInfo?.role === "admin" && (
                          <>
                            {supply.status === "pending" && (
                              <>
                                <DropdownMenuItem onClick={() => handleApprove(supply)} className="text-green-600 hover:bg-green-50 cursor-pointer">
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Phê duyệt
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(supply)} className="text-amber-600 hover:bg-amber-50 cursor-pointer">
                                  <Edit className="mr-2 h-4 w-4" />
                                  Chỉnh sửa
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem onClick={() => handleView(supply)} className="text-blue-600 hover:bg-blue-50 cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(supply)} className="text-red-600 hover:bg-red-50 cursor-pointer">
                              <Trash className="mr-2 h-4 w-4" />
                              Xóa
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Section */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Hiển thị {filteredSupplies.length} trên tổng số {totalCount} mục
        </div>
        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Dialog phê duyệt nguồn nhập */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl text-gray-800">Phê duyệt nguồn nhập</DialogTitle>
            <DialogDescription className="text-gray-600">
              Nhập thông tin phê duyệt cho nguồn nhập <span className="font-medium">{selectedSupply?.product.name}</span> từ <span className="font-medium">{selectedSupply?.unit.name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stationEntryDate" className="text-right text-gray-700">
                Ngày nhập trạm <span className="text-red-500">*</span>
              </Label>
              <Input
                id="stationEntryDate"
                type="date"
                value={stationEntryDate}
                onChange={(e) => setStationEntryDate(e.target.value)}
                className="col-span-3 border-gray-300 focus:border-primary"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="requiredQuantity" className="text-right text-gray-700">
                SL nhập yêu cầu <span className="text-red-500">*</span>
              </Label>
              <Input
                id="requiredQuantity"
                type="number"
                value={requiredQuantity}
                onChange={(e) => setRequiredQuantity(e.target.value)}
                className="col-span-3 border-gray-300 focus:border-primary"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="actualQuantity" className="text-right text-gray-700">
                SL nhập thực tế <span className="text-red-500">*</span>
              </Label>
              <Input
                id="actualQuantity"
                type="number"
                value={actualQuantity}
                onChange={(e) => setActualQuantity(e.target.value)}
                className="col-span-3 border-gray-300 focus:border-primary"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right text-gray-700">
                Giá tiền (VNĐ/{selectedSupply?.product.unit}) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="col-span-3 border-gray-300 focus:border-primary"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expiryDate" className="text-right text-gray-700">
                Hạn sử dụng <span className="text-red-500">*</span>
              </Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="col-span-3 border-gray-300 focus:border-primary"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="note" className="text-right text-gray-700">
                Ghi chú
              </Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="col-span-3 border-gray-300 focus:border-primary min-h-[100px] resize-none"
              />
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setApproveDialogOpen(false)} className="border-gray-300">
              Hủy
            </Button>
            <Button 
              type="button" 
              onClick={handleApproveConfirm} 
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý
                </>
              ) : (
                "Phê duyệt"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog xác nhận xóa */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl text-gray-800">Xác nhận xóa</DialogTitle>
            <DialogDescription className="text-gray-600">
              Bạn có chắc chắn muốn xóa nguồn nhập <span className="font-medium">{selectedSupply?.product.name}</span> từ <span className="font-medium">{selectedSupply?.unit.name}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)} className="border-gray-300">
              Hủy
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteConfirm} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý
                </>
              ) : (
                "Xóa"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog xem chi tiết */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl text-gray-800">Chi tiết nguồn nhập</DialogTitle>
            <DialogDescription className="text-gray-600">
              Thông tin chi tiết về nguồn nhập <span className="font-medium">{selectedSupply?.product.name}</span> từ <span className="font-medium">{selectedSupply?.unit.name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium text-gray-700">Đơn vị:</Label>
              <div className="col-span-3 text-gray-800">{selectedSupply?.unit.name}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium text-gray-700">Phân loại:</Label>
              <div className="col-span-3 text-gray-800">{selectedSupply?.category.name}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium text-gray-700">Sản phẩm:</Label>
              <div className="col-span-3 text-gray-800">{selectedSupply?.product.name}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium text-gray-700">Đơn vị tính:</Label>
              <div className="col-span-3 text-gray-800">{selectedSupply?.product.unit}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium text-gray-700">Số lượng dự kiến:</Label>
              <div className="col-span-3 text-gray-800">
                {selectedSupply?.expectedQuantity} {selectedSupply?.product.unit}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium text-gray-700">Ngày thu hoạch:</Label>
              <div className="col-span-3 text-gray-800">{selectedSupply && formatDate(selectedSupply.expectedHarvestDate)}</div>
            </div>
            {selectedSupply?.status === "approved" && (
              <>
                <div className="border-t pt-3">
                  <h4 className="font-medium text-gray-700 mb-2">Thông tin phê duyệt</h4>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-medium text-gray-700">Ngày nhập trạm:</Label>
                  <div className="col-span-3 text-gray-800">{selectedSupply && formatDate(selectedSupply.stationEntryDate)}</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-medium text-gray-700">Số lượng yêu cầu:</Label>
                  <div className="col-span-3 text-gray-800">
                    {selectedSupply?.requiredQuantity} {selectedSupply?.product.unit}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-medium text-gray-700">Số lượng thực tế:</Label>
                  <div className="col-span-3 text-gray-800">
                    {selectedSupply?.actualQuantity} {selectedSupply?.product.unit}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-medium text-gray-700">Giá tiền:</Label>
                  <div className="col-span-3 text-gray-800">{formatCurrency(selectedSupply?.price)}</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-medium text-gray-700">Thành tiền:</Label>
                  <div className="col-span-3 text-gray-800 font-medium">{formatCurrency(selectedSupply?.totalPrice)}</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-medium text-gray-700">Hạn sử dụng:</Label>
                  <div className="col-span-3 text-gray-800">{selectedSupply && formatDate(selectedSupply.expiryDate)}</div>
                </div>
              </>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium text-gray-700">Trạng thái:</Label>
              <div className="col-span-3">
                <Badge 
                  variant={getStatusVariant(selectedSupply?.status || "")}
                  className={selectedSupply?.status === "approved" 
                    ? "bg-green-100 text-green-800" 
                    : selectedSupply?.status === "pending" 
                      ? "bg-amber-100 text-amber-800" 
                      : "bg-red-100 text-red-800"
                  }
                >
                  {selectedSupply && getStatusName(selectedSupply.status)}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium text-gray-700">Ghi chú:</Label>
              <div className="col-span-3 text-gray-800">{selectedSupply?.note || "-"}</div>
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button type="button" onClick={() => setViewDialogOpen(false)} className="bg-primary hover:bg-primary/90">
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {(userInfo?.role === "unitAssistant" || userInfo?.role === "admin") && (
        <Button className="mt-4 bg-primary hover:bg-primary/90" onClick={() => router.push("/dashboard/supplies/new")}>
          Thêm nguồn nhập mới
        </Button>
      )}
    </>
  );
}
