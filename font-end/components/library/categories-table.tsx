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
import { useToast } from "@/components/ui/use-toast"
import { Plus, Pencil, Trash } from "lucide-react"

// Mock data
const categories = [
  { id: 1, name: "Rau", code: "RAU" },
  { id: 2, name: "Gia súc", code: "GS" },
  { id: 3, name: "Gia cầm", code: "GC" },
  { id: 4, name: "Hải sản", code: "HS" },
  { id: 5, name: "Gia vị", code: "GV" },
  { id: 6, name: "Khác", code: "KHAC" },
]

export function CategoriesTable() {
  const { toast } = useToast()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [categoryName, setCategoryName] = useState("")
  const [categoryCode, setCategoryCode] = useState("")

  const handleAdd = () => {
    setCategoryName("")
    setCategoryCode("")
    setIsAddDialogOpen(true)
  }

  const handleAddConfirm = () => {
    toast({
      title: "Thêm mới thành công",
      description: `Đã thêm mới phân loại ${categoryName}`,
    })
    setIsAddDialogOpen(false)
  }

  const handleEdit = (category: any) => {
    setSelectedCategory(category)
    setCategoryName(category.name)
    setCategoryCode(category.code)
    setIsEditDialogOpen(true)
  }

  const handleEditConfirm = () => {
    toast({
      title: "Cập nhật thành công",
      description: `Đã cập nhật thông tin phân loại ${categoryName}`,
    })
    setIsEditDialogOpen(false)
  }

  const handleDelete = (category: any) => {
    setSelectedCategory(category)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    toast({
      title: "Xóa thành công",
      description: `Đã xóa phân loại ${selectedCategory.name}`,
    })
    setIsDeleteDialogOpen(false)
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm phân loại
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>STT</TableHead>
            <TableHead>Tên phân loại</TableHead>
            <TableHead>Mã phân loại</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell>{category.id}</TableCell>
              <TableCell>{category.name}</TableCell>
              <TableCell>{category.code}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(category)}>
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
            <DialogTitle>Thêm phân loại mới</DialogTitle>
            <DialogDescription>Nhập thông tin phân loại mới</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Tên phân loại
              </Label>
              <Input
                id="name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                Mã phân loại
              </Label>
              <Input
                id="code"
                value={categoryCode}
                onChange={(e) => setCategoryCode(e.target.value)}
                className="col-span-3"
              />
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
            <DialogTitle>Chỉnh sửa phân loại</DialogTitle>
            <DialogDescription>Chỉnh sửa thông tin phân loại</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Tên phân loại
              </Label>
              <Input
                id="edit-name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-code" className="text-right">
                Mã phân loại
              </Label>
              <Input
                id="edit-code"
                value={categoryCode}
                onChange={(e) => setCategoryCode(e.target.value)}
                className="col-span-3"
              />
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
            <DialogTitle>Xóa phân loại</DialogTitle>
            <DialogDescription>Bạn có chắc chắn muốn xóa phân loại {selectedCategory?.name}?</DialogDescription>
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
