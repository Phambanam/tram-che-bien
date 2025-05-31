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
const units = [
  { id: 1, name: "Tiểu đoàn 1", code: "TD1" },
  { id: 2, name: "Tiểu đoàn 2", code: "TD2" },
  { id: 3, name: "Tiểu đoàn 3", code: "TD3" },
  { id: 4, name: "Lữ đoàn bộ", code: "LDB" },
]

export function UnitsTable() {
  const { toast } = useToast()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<any>(null)
  const [unitName, setUnitName] = useState("")
  const [unitCode, setUnitCode] = useState("")

  const handleAdd = () => {
    setUnitName("")
    setUnitCode("")
    setIsAddDialogOpen(true)
  }

  const handleAddConfirm = () => {
    toast({
      title: "Thêm mới thành công",
      description: `Đã thêm mới đơn vị ${unitName}`,
    })
    setIsAddDialogOpen(false)
  }

  const handleEdit = (unit: any) => {
    setSelectedUnit(unit)
    setUnitName(unit.name)
    setUnitCode(unit.code)
    setIsEditDialogOpen(true)
  }

  const handleEditConfirm = () => {
    toast({
      title: "Cập nhật thành công",
      description: `Đã cập nhật thông tin đơn vị ${unitName}`,
    })
    setIsEditDialogOpen(false)
  }

  const handleDelete = (unit: any) => {
    setSelectedUnit(unit)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    toast({
      title: "Xóa thành công",
      description: `Đã xóa đơn vị ${selectedUnit.name}`,
    })
    setIsDeleteDialogOpen(false)
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm đơn vị
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>STT</TableHead>
            <TableHead>Tên đơn vị</TableHead>
            <TableHead>Mã đơn vị</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {units.map((unit) => (
            <TableRow key={unit.id}>
              <TableCell>{unit.id}</TableCell>
              <TableCell>{unit.name}</TableCell>
              <TableCell>{unit.code}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(unit)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(unit)}>
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
            <DialogTitle>Thêm đơn vị mới</DialogTitle>
            <DialogDescription>Nhập thông tin đơn vị mới</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Tên đơn vị
              </Label>
              <Input id="name" value={unitName} onChange={(e) => setUnitName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                Mã đơn vị
              </Label>
              <Input id="code" value={unitCode} onChange={(e) => setUnitCode(e.target.value)} className="col-span-3" />
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
            <DialogTitle>Chỉnh sửa đơn vị</DialogTitle>
            <DialogDescription>Chỉnh sửa thông tin đơn vị</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Tên đơn vị
              </Label>
              <Input
                id="edit-name"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-code" className="text-right">
                Mã đơn vị
              </Label>
              <Input
                id="edit-code"
                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value)}
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
            <DialogTitle>Xóa đơn vị</DialogTitle>
            <DialogDescription>Bạn có chắc chắn muốn xóa đơn vị {selectedUnit?.name}?</DialogDescription>
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
