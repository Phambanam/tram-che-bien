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

export function OutputManagementContent() {
  const [date, setDate] = useState<Date>()

  const outputs = [
    {
      id: 1,
      date: "20/05/2023",
      product: "Gạo tẻ",
      unit: "kg",
      quantity: 50,
      destination: "Đại đội 1",
      status: "Đã xuất",
    },
    {
      id: 2,
      date: "20/05/2023",
      product: "Thịt lợn",
      unit: "kg",
      quantity: 20,
      destination: "Đại đội 2",
      status: "Đã xuất",
    },
    {
      id: 3,
      date: "21/05/2023",
      product: "Rau xanh",
      unit: "kg",
      quantity: 15,
      destination: "Đại đội 3",
      status: "Đã xuất",
    },
    {
      id: 4,
      date: "21/05/2023",
      product: "Cá biển",
      unit: "kg",
      quantity: 10,
      destination: "Đại đội 1",
      status: "Chờ xuất",
    },
    {
      id: 5,
      date: "22/05/2023",
      product: "Trứng gà",
      unit: "quả",
      quantity: 100,
      destination: "Đại đội 4",
      status: "Chờ xuất",
    },
  ]

  return (
    <div className="container">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#b45f06]">QUẢN LÝ NGUỒN XUẤT</h2>

        <Tabs defaultValue="list" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Danh sách xuất kho</TabsTrigger>
            <TabsTrigger value="add">Thêm phiếu xuất</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2 items-center">
                <Input placeholder="Tìm kiếm..." className="w-64" />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: vi }) : "Chọn ngày"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
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
                <CardTitle>Danh sách xuất kho</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>STT</TableHead>
                      <TableHead>Ngày xuất</TableHead>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>Đơn vị</TableHead>
                      <TableHead>Số lượng</TableHead>
                      <TableHead>Đơn vị nhận</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outputs.map((output, index) => (
                      <TableRow key={output.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{output.date}</TableCell>
                        <TableCell>{output.product}</TableCell>
                        <TableCell>{output.unit}</TableCell>
                        <TableCell>{output.quantity}</TableCell>
                        <TableCell>{output.destination}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              output.status === "Đã xuất"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {output.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              Chi tiết
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

          <TabsContent value="add" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Thêm phiếu xuất mới</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="product" className="font-medium">
                        Sản phẩm
                      </label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn sản phẩm" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rice">Gạo tẻ</SelectItem>
                          <SelectItem value="pork">Thịt lợn</SelectItem>
                          <SelectItem value="vegetable">Rau xanh</SelectItem>
                          <SelectItem value="fish">Cá biển</SelectItem>
                          <SelectItem value="egg">Trứng gà</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <label htmlFor="destination" className="font-medium">
                        Đơn vị nhận
                      </label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn đơn vị nhận" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unit1">Đại đội 1</SelectItem>
                          <SelectItem value="unit2">Đại đội 2</SelectItem>
                          <SelectItem value="unit3">Đại đội 3</SelectItem>
                          <SelectItem value="unit4">Đại đội 4</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="date" className="font-medium">
                        Ngày xuất
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
                          <SelectItem value="pending">Chờ xuất</SelectItem>
                          <SelectItem value="completed">Đã xuất</SelectItem>
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
