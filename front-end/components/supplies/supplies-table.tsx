"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Eye, Edit, Trash2, CheckCircle, XCircle } from "lucide-react"
import { suppliesApi } from "@/lib/api-client"
import { SupplySource } from "@/types"

interface SuppliesTableProps {
  filters?: {
    unit?: string
    category?: string
    status?: string
    product?: string
    fromDate?: string
    toDate?: string
    stationEntryFromDate?: string
    stationEntryToDate?: string
    createdFromDate?: string
    createdToDate?: string
  }
}

export function SuppliesTable({ filters = {} }: SuppliesTableProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [supplies, setSupplies] = useState<SupplySource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedSupply, setSelectedSupply] = useState<SupplySource | null>(null)
  const [stationEntryDate, setStationEntryDate] = useState("")
  const [requiredQuantity, setRequiredQuantity] = useState("")
  const [actualQuantity, setActualQuantity] = useState("")
  const [price, setPrice] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [note, setNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchSupplies = async () => {
      try {
        setLoading(true)
        setError(null)

        const data = await suppliesApi.getSupplies(filters)
        console.log("Fetched supplies with filters:", filters, data)
        setSupplies(data)
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
      }
    }

    if (session) {
      fetchSupplies()
    }
  }, [session, toast, filters])

  const handleApprove = (supply: SupplySource) => {
    setSelectedSupply(supply)
    setStationEntryDate(new Date().toISOString().split("T")[0])
    setRequiredQuantity(supply.supplyQuantity.toString())
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
        expiryDate,
        note,
      }

      console.log("Approving supply:", approvalData)

      await suppliesApi.updateSupply(selectedSupply.id, approvalData)

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
              receivedQuantity: Number(actualQuantity),
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

  const handleEdit = (supply: SupplySource) => {
    router.push(`/dashboard/supplies/edit/${supply.id}`)
  }

  const handleView = (supply: SupplySource) => {
    setSelectedSupply(supply)
    setViewDialogOpen(true)
  }

  const handleDelete = (supply: SupplySource) => {
    setSelectedSupply(supply)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedSupply) return

    try {
      setIsSubmitting(true)

      await suppliesApi.deleteSupply(selectedSupply.id)

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
    if (session?.user.role === "unitAssistant") {
      return supply.unit._id === session.user.unit
    }
    return true
  })

  if (loading) {
    return <div className="text-center py-4">Đang tải...</div>
  }

  if (error) {
    return (
      <div className="text-center py-4 text-destructive">
        <XCircle className="h-8 w-8 mx-auto mb-2" />
        <p>Lỗi: {error}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.refresh()}>
          Thử lại
        </Button>
      </div>
    )
  }

  if (filteredSupplies.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Không có dữ liệu nguồn nhập</p>
        {(session?.user.role === "unitAssistant" || session?.user.role === "admin") && (
          <Button className="mt-4" onClick={() => router.push("/dashboard/supplies/new")}>
            Thêm nguồn nhập mới
          </Button>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>STT</TableHead>
              <TableHead>Tên đơn vị</TableHead>
              <TableHead>Phân loại</TableHead>
              <TableHead>Tên LTTP-Chất đốt</TableHead>
              <TableHead>Đơn vị tính</TableHead>
              <TableHead>Số lượng dự kiến</TableHead>
              <TableHead>Ngày thu hoạch dự kiến</TableHead>
              <TableHead>Số lượng nhập yêu cầu</TableHead>
              <TableHead>Số lượng nhập thực tế</TableHead>
              <TableHead>Giá tiền</TableHead>
              <TableHead>Thành tiền</TableHead>
              <TableHead>Ngày nhập trạm</TableHead>
              <TableHead>Hạn sử dụng</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ghi chú</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSupplies.map((supply, index) => (
              <TableRow key={supply.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{supply.unit.name}</TableCell>
                <TableCell>{supply.category.name}</TableCell>
                <TableCell>{supply.product.name}</TableCell>
                <TableCell>{supply.product.unit}</TableCell>
                <TableCell>{supply.supplyQuantity}</TableCell>
                <TableCell>{formatDate(supply.expectedHarvestDate)}</TableCell>
                <TableCell>{supply.requiredQuantity || "-"}</TableCell>
                <TableCell>{supply.actualQuantity || "-"}</TableCell>
                <TableCell>{formatCurrency(supply.price)}</TableCell>
                <TableCell>{formatCurrency(supply.totalPrice)}</TableCell>
                <TableCell>{supply.stationEntryDate ? formatDate(supply.stationEntryDate) : "-"}</TableCell>
                <TableCell>{formatDate(supply.expiryDate)}</TableCell>
                <TableCell>
                  <Badge variant={supply.status === "approved" ? "success" : "outline"}>
                    {getStatusName(supply.status)}
                  </Badge>
                </TableCell>
                <TableCell>{supply.note || "-"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleView(supply)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {session?.user && (session.user as any).role === "brigadeAssistant" && supply.status === "pending" && (
                      <Button variant="outline" size="sm" onClick={() => handleApprove(supply)}>
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    {session?.user && 
                     ((session.user as any).role === "unitAssistant" && (session.user as any).unit?.id === supply.unit._id) ||
                     (session.user as any).role === "admin" && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(supply)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(supply)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog phê duyệt nguồn nhập */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Phê duyệt nguồn nhập</DialogTitle>
            <DialogDescription>
              Nhập thông tin phê duyệt cho nguồn nhập {selectedSupply?.product.name} từ {selectedSupply?.unit.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stationEntryDate" className="text-right">
                Ngày nhập trạm
              </Label>
              <Input
                id="stationEntryDate"
                type="date"
                value={stationEntryDate}
                onChange={(e) => setStationEntryDate(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="requiredQuantity" className="text-right">
                Số lượng nhập yêu cầu
              </Label>
              <Input
                id="requiredQuantity"
                type="number"
                value={requiredQuantity}
                onChange={(e) => setRequiredQuantity(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="actualQuantity" className="text-right">
                Số lượng nhập thực tế
              </Label>
              <Input
                id="actualQuantity"
                type="number"
                value={actualQuantity}
                onChange={(e) => setActualQuantity(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Giá tiền (VND)
              </Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expiryDate" className="text-right">
                Hạn sử dụng
              </Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="note" className="text-right">
                Ghi chú
              </Label>
              <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" onClick={handleApproveConfirm} disabled={isSubmitting}>
              {isSubmitting ? "Đang xử lý..." : "Phê duyệt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog xem chi tiết nguồn nhập */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Chi tiết nguồn nhập</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về nguồn nhập {selectedSupply?.product.name} từ {selectedSupply?.unit.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Đơn vị:</Label>
              <div className="col-span-3">{selectedSupply?.unit.name}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Phân loại:</Label>
              <div className="col-span-3">{selectedSupply?.category.name}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Sản phẩm:</Label>
              <div className="col-span-3">{selectedSupply?.product.name}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Số lượng dự kiến:</Label>
              <div className="col-span-3">
                {selectedSupply?.supplyQuantity} {selectedSupply?.product.unit}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Ngày thu hoạch dự kiến:</Label>
              <div className="col-span-3">{selectedSupply && formatDate(selectedSupply.expectedHarvestDate)}</div>
            </div>
            {selectedSupply?.status === "approved" && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-medium">Ngày nhập trạm:</Label>
                  <div className="col-span-3">{selectedSupply && formatDate(selectedSupply.stationEntryDate)}</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-medium">Số lượng yêu cầu:</Label>
                  <div className="col-span-3">
                    {selectedSupply?.requiredQuantity} {selectedSupply?.product.unit}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-medium">Số lượng thực tế:</Label>
                  <div className="col-span-3">
                    {selectedSupply?.actualQuantity} {selectedSupply?.product.unit}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-medium">Giá tiền:</Label>
                  <div className="col-span-3">{formatCurrency(selectedSupply?.price)}</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-medium">Thành tiền:</Label>
                  <div className="col-span-3">{formatCurrency(selectedSupply?.totalPrice)}</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-medium">Hạn sử dụng:</Label>
                  <div className="col-span-3">{selectedSupply && formatDate(selectedSupply.expiryDate)}</div>
                </div>
              </>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Trạng thái:</Label>
              <div className="col-span-3">
                <Badge variant={selectedSupply?.status === "approved" ? "success" : "outline"}>
                  {selectedSupply && getStatusName(selectedSupply.status)}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Ghi chú:</Label>
              <div className="col-span-3">{selectedSupply?.note || "-"}</div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setViewDialogOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog xóa nguồn nhập */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Xóa nguồn nhập</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa nguồn nhập {selectedSupply?.product.name} từ {selectedSupply?.unit.name}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isSubmitting}>
              {isSubmitting ? "Đang xử lý..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
