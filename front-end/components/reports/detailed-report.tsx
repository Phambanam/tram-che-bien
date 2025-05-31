"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Search, FileText, FileIcon as FilePdf } from "lucide-react"

// Mock data
const detailedData = [
  {
    id: 1,
    unit: "Tiểu đoàn 1",
    category: "Rau",
    product: "Rau muống",
    quantity: 50,
    harvestDate: "2025-05-15",
    receiveDate: "2025-05-20",
    receivedQuantity: 48,
    status: "Đã phê duyệt",
    note: "",
  },
  {
    id: 2,
    unit: "Tiểu đoàn 2",
    category: "Gia cầm",
    product: "Gà",
    quantity: 30,
    harvestDate: "2025-05-16",
    receiveDate: "",
    receivedQuantity: 0,
    status: "Chờ phê duyệt",
    note: "",
  },
  {
    id: 3,
    unit: "Tiểu đoàn 3",
    category: "Gia súc",
    product: "Lợn",
    quantity: 100,
    harvestDate: "2025-05-17",
    receiveDate: "2025-05-22",
    receivedQuantity: 95,
    status: "Đã phê duyệt",
    note: "Thiếu 5kg do vận chuyển",
  },
  {
    id: 4,
    unit: "Tiểu đoàn 1",
    category: "Hải sản",
    product: "Cá chép",
    quantity: 40,
    harvestDate: "2025-05-18",
    receiveDate: "",
    receivedQuantity: 0,
    status: "Chờ phê duyệt",
    note: "",
  },
  {
    id: 5,
    unit: "Tiểu đoàn 2",
    category: "Rau",
    product: "Rau cải",
    quantity: 45,
    harvestDate: "2025-05-19",
    receiveDate: "2025-05-24",
    receivedQuantity: 45,
    status: "Đã phê duyệt",
    note: "",
  },
]

export function DetailedReport() {
  const [unit, setUnit] = useState("all")
  const [category, setCategory] = useState("all")
  const [status, setStatus] = useState("all")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc báo cáo</CardTitle>
          <CardDescription>Lọc báo cáo theo các tiêu chí</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="unit">Đơn vị</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Chọn đơn vị" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả đơn vị</SelectItem>
                  <SelectItem value="tieu-doan-1">Tiểu đoàn 1</SelectItem>
                  <SelectItem value="tieu-doan-2">Tiểu đoàn 2</SelectItem>
                  <SelectItem value="tieu-doan-3">Tiểu đoàn 3</SelectItem>
                  <SelectItem value="lu-doan-bo">Lữ đoàn bộ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Phân loại</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Chọn phân loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả phân loại</SelectItem>
                  <SelectItem value="rau">Rau</SelectItem>
                  <SelectItem value="gia-suc">Gia súc</SelectItem>
                  <SelectItem value="gia-cam">Gia cầm</SelectItem>
                  <SelectItem value="hai-san">Hải sản</SelectItem>
                  <SelectItem value="gia-vi">Gia vị</SelectItem>
                  <SelectItem value="khac">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="pending">Chờ phê duyệt</SelectItem>
                  <SelectItem value="approved">Đã phê duyệt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="from-date">Từ ngày</Label>
              <Input id="from-date" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="to-date">Đến ngày</Label>
              <Input id="to-date" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button>
                <Search className="mr-2 h-4 w-4" />
                Lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Báo cáo chi tiết</CardTitle>
            <CardDescription>Thông tin chi tiết về tất cả nguồn nhập</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Xuất Excel
            </Button>
            <Button variant="outline" size="sm">
              <FilePdf className="mr-2 h-4 w-4" />
              Xuất PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>STT</TableHead>
                <TableHead>Đơn vị</TableHead>
                <TableHead>Phân loại</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Số lượng cung cấp (kg)</TableHead>
                <TableHead>Ngày thu hoạch</TableHead>
                <TableHead>Ngày nhập trạm</TableHead>
                <TableHead>Số lượng nhận (kg)</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ghi chú</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detailedData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.unit}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell>{row.product}</TableCell>
                  <TableCell>{row.quantity}</TableCell>
                  <TableCell>{row.harvestDate}</TableCell>
                  <TableCell>{row.receiveDate || "-"}</TableCell>
                  <TableCell>{row.receivedQuantity || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={row.status === "Đã phê duyệt" ? "success" : "outline"}>{row.status}</Badge>
                  </TableCell>
                  <TableCell>{row.note || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
