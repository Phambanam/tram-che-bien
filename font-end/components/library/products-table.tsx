"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Pencil, Trash } from "lucide-react"

// Mock data
const products = [
  { id: 1, name: "Rau muống", category: "Rau", unit: "kg" },
  { id: 2, name: "Rau cải", category: "Rau", unit: "kg" },
  { id: 3, name: "Lợn", category: "Gia súc", unit: "kg" },
  { id: 4, name: "Gà", category: "Gia cầm", unit: "kg" },
  { id: 5, name: "Cá chép", category: "Hải sản", unit: "kg" },
  { id: 6, name: "Hành", category: "Gia vị", unit: "kg" },
]

export function ProductsTable() {
  const { toast } = useToast()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [productName, setProductName] = useState("")
  const [productCategory, setProductCategory] = useState("")
  const [productUnit, setProductUnit] = useState("kg")

  const handleAdd = () => {
    setProductName("")
    setProductCategory("")
    setProductUnit("kg")
    setIsAddDialogOpen(true)
  }

  const handleAddConfirm = () => {
    toast({
      title: "Thêm mới thành công",
      description: `Đã thêm mới sản phẩm ${productName}`,
    })
    setIsAddDialogOpen(false)
  }

  const handleEdit = (product: any) => {
    setSelectedProduct(product)
    setProductName(product.name)
    setProductCategory(product.category)
    setProductUnit(product.unit)
    setIsEditDialogOpen(true)
  }

  const handleEditConfirm = () => {
    toast({
      title: "Cập nhật thành công",
      description: `Đã cập nhật thông tin sản phẩm ${productName}`,
    })
    setIsEditDialogOpen(false)
  }

  const handleDelete = (product: any) => {
    setSelectedProduct(product)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    toast({
      title: "Xóa thành công",
      description: `Đã xóa sản phẩm ${selectedProduct.name}`,
    })
    setIsDeleteDialogOpen(false)
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm sản phẩm
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>STT</TableHead>
            <TableHead>Tên sản phẩm</TableHead>
            <TableHead>Phân loại</TableHead>
            <TableHead>Đơn vị tính</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>{product.id}</TableCell>
              <TableCell>{product.name}</TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell>{product.unit}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(product)}>
                  <Trash className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Thêm sản phẩm mới</DialogTitle>
            <DialogDescription>Nhập thông tin sản phẩm mới</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Tên sản phẩm
              </Label>
              <Input
                id="name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Phân loại
              </Label>
              <Select value={productCategory} onValueChange={setProductCategory}>
                <SelectTrigger id="category" className="col-span-3">
                  <SelectValue placeholder="Chọn phân loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rau">Rau</SelectItem>
                  <SelectItem value="Gia súc">Gia súc</SelectItem>
                  <SelectItem value="Gia cầm">Gia cầm</SelectItem>
                  <SelectItem value="Hải sản">Hải sản</SelectItem>
                  <SelectItem value="Gia vị">Gia vị</SelectItem>
                  <SelectItem value="Khác">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="unit" className="text-right">
                Đơn vị tính
              </Label>
              <Select value={productUnit} onValueChange={setProductUnit}>
                <SelectTrigger id="unit" className="col-span-3">
                  <SelectValue placeholder="Chọn đơn vị tính" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="con">con</SelectItem>
                  <SelectItem value="quả">quả</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleAddConfirm}>Thêm mới</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa sản phẩm</DialogTitle>
            <DialogDescription>Chỉnh sửa thông tin sản phẩm</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Tên sản phẩm
              </Label>
              <Input
                id="edit-name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-category" className="text-right">
                Phân loại
              </Label>
              <Select value={productCategory} onValueChange={setProductCategory}>
                <SelectTrigger id="edit-category" className="col-span-3">
                  <SelectValue placeholder="Chọn phân loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rau">Rau</SelectItem>
                  <SelectItem value="Gia súc">Gia súc</SelectItem>
                  <SelectItem value="Gia cầm">Gia cầm</SelectItem>
                  <SelectItem value="Hải sản">Hải sản</SelectItem>
                  <SelectItem value="Gia vị">Gia vị</SelectItem>
                  <SelectItem value="Khác">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-unit" className="text-right">
                Đơn vị tính
              </Label>
              <Select value={productUnit} onValueChange={setProductUnit}>
                <SelectTrigger id="edit-unit" className="col-span-3">
                  <SelectValue placeholder="Chọn đơn vị tính" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="con">con</SelectItem>
                  <SelectItem value="quả">quả</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleEditConfirm}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Xóa sản phẩm</DialogTitle>
            <DialogDescription>Bạn có chắc chắn muốn xóa sản phẩm {selectedProduct?.name}?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
