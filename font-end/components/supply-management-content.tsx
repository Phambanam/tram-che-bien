"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Search, FileDown, FileUp } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

export function SupplyManagementContent() {
  const [date, setDate] = useState<Date>()

  const supplies = [
    { id: 1, name: "Gạo tẻ", unit: "kg", quantity: 500, supplier: "Công ty A", date: "15/05/2023", status: "Đã nhập" },
    {
      id: 2,
      name: "Thịt lợn",
      unit: "kg",
      quantity: 200,
      supplier: "Công ty B",
      date: "16/05/2023",
      status: "Đã nhập",
    },
    {
      id: 3,
      name: "Rau xanh",
      unit: "kg",
      quantity: 150,
      supplier: "Công ty C",
      date: "17/05/2023",
      status: "Đã nhập",
    },
    {
      id: 4,
      name: "Cá biển",
      unit: "kg",
      quantity: 100,
      supplier: "Công ty D",
      date: "18/05/2023",
      status: "Chờ duyệt",
    },
    {
      id: 5,
      name: "Trứng gà",
      unit: "quả",
      quantity: 1000,
      supplier: "Công ty E",
      date: "19/05/2023",
      status: "Chờ duyệt",
    },
  ]

  return (
    <div className="container">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#b45f06]">QUẢN LÝ NGUỒN NHẬP</h2>

        <Tabs defaultValue="list" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Danh sách nguồn nhập</TabsTrigger>
            <TabsTrigger value="add">Thêm nguồn nhập mới</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2 items-center">
                <Input placeholder="Tìm kiếm..." className="w-64" />
                <Button variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
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

            <Card>
              <CardHeader>
                <CardTitle>Danh sách nguồn nhập</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>STT</TableHead>
                      <TableHead>Tên hàng</TableHead>
                      <TableHead>Đơn vị</TableHead>
                      <TableHead>Số lượng</TableHead>
                      <TableHead>Nhà cung cấp</TableHead>
                      <TableHead>Ngày nhập</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplies.map((supply, index) => (
                      <TableRow key={supply.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{supply.name}</TableCell>
                        <TableCell>{supply.unit}</TableCell>
                        <TableCell>{supply.quantity}</TableCell>
                        <TableCell>{supply.supplier}</TableCell>
                        <TableCell>{supply.date}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              supply.status === "Đã nhập"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {supply.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              Xem
                            </Button>
                            <Button variant="outline" size="sm">
                              Sửa
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle>Thêm nguồn nhập mới</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="font-medium">
                        Tên hàng
                      </label>
                      <Input id="name" placeholder="Nhập tên hàng" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="unit" className="font-medium">
                        Đơn vị
                      </label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn đơn vị" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">Kilogram (kg)</SelectItem>
                          <SelectItem value="g">Gram (g)</SelectItem>
                          <SelectItem value="l">Lít (l)</SelectItem>
                          <SelectItem value="qua">Quả</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="quantity" className="font-medium">
                        Số lượng
                      </label>
                      <Input id="quantity" type="number" placeholder="Nhập số lượng" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="supplier" className="font-medium">
                        Nhà cung cấp
                      </label>
                      <Input id="supplier" placeholder="Nhập nhà cung cấp" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="date" className="font-medium">
                        Ngày nhập
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP", { locale: vi }) : "Chọn ngày"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="status" className="font-medium">
                        Trạng thái
                      </label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Chờ duyệt</SelectItem>
                          <SelectItem value="approved">Đã nhập</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="notes" className="font-medium">
                      Ghi chú
                    </label>
                    <textarea
                      id="notes"
                      className="w-full min-h-[100px] p-2 border border-gray-300 rounded-md"
                      placeholder="Nhập ghi chú (nếu có)"
                    ></textarea>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline">Hủy</Button>
                    <Button>Lưu</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
