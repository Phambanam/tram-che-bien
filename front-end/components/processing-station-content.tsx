"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Badge } from "@/components/ui/badge"
import { FileDown, Plus, Filter, AlertTriangle } from "lucide-react"

export function ProcessingStationContent() {
  const [activeTab, setActiveTab] = useState("tofu")

  // Sample data for demonstration
  const processingItems = {
    tofu: [
      {
        id: 1,
        unit: "Tiểu đoàn 1",
        category: "Các loại hạt",
        product: "Đậu nành",
        standardAmount: "1000g/1kg đậu phụ",
        supplyQuantity: 50,
        processingDate: "2025-05-20",
        useDate: "2025-05-22",
        note: "Cần sử dụng trong 2 ngày",
      },
      {
        id: 2,
        unit: "Lữ đoàn bộ",
        category: "Các loại hạt",
        product: "Đậu nành",
        standardAmount: "1000g/1kg đậu phụ",
        supplyQuantity: 30,
        processingDate: "2025-05-21",
        useDate: "2025-05-23",
        note: "",
      },
    ],
    sausage: [
      {
        id: 1,
        unit: "Tiểu đoàn 2",
        category: "Gia súc",
        product: "Thịt lợn",
        standardAmount: "800g/1kg giò",
        supplyQuantity: 40,
        processingDate: "2025-05-20",
        useDate: "2025-05-25",
        note: "Đã qua kiểm định",
      },
    ],
    sprouts: [
      {
        id: 1,
        unit: "Tiểu đoàn 3",
        category: "Các loại hạt",
        product: "Đậu xanh",
        standardAmount: "200g/1kg giá",
        supplyQuantity: 20,
        processingDate: "2025-05-19",
        useDate: "2025-05-21",
        note: "",
      },
    ],
    pickled: [
      {
        id: 1,
        unit: "Tiểu đoàn 1",
        category: "Rau củ quả",
        product: "Cải bắp",
        standardAmount: "1kg/1kg dưa muối",
        supplyQuantity: 60,
        processingDate: "2025-05-18",
        useDate: "2025-05-30",
        note: "Muối nén 12 ngày",
      },
    ],
    slaughter: [
      {
        id: 1,
        unit: "Lữ đoàn bộ",
        category: "Gia cầm",
        product: "Gà",
        standardAmount: "1 con/4 người",
        supplyQuantity: 20,
        processingDate: "2025-05-22",
        useDate: "2025-05-22",
        note: "Cần chế biến ngay trong ngày",
      },
    ],
  }

  // Sample data for LTTP (Food management)
  const foodItems = [
    {
      id: 1,
      category: "Lương thực",
      product: "Gạo tẻ",
      newInput: {
        quantity: 500000,
        entryDate: "2025-05-15",
        expiryDate: "2025-08-15",
        status: "Chưa hết hạn",
      },
      stationInventory: {
        quantity: 200000,
        entryDate: "2025-04-10",
        expiryDate: "2025-07-10",
        status: "Chưa hết hạn",
      },
      total: {
        nonExpired: 700000,
        expired: 0,
      },
      note: "",
    },
    {
      id: 2,
      category: "Gia vị",
      product: "Muối",
      newInput: {
        quantity: 50000,
        entryDate: "2025-05-10",
        expiryDate: "2026-05-10",
        status: "Chưa hết hạn",
      },
      stationInventory: {
        quantity: 20000,
        entryDate: "2025-03-15",
        expiryDate: "2026-03-15",
        status: "Chưa hết hạn",
      },
      total: {
        nonExpired: 70000,
        expired: 0,
      },
      note: "",
    },
    {
      id: 3,
      category: "Rau củ quả",
      product: "Cà chua",
      newInput: {
        quantity: 30000,
        entryDate: "2025-05-20",
        expiryDate: "2025-05-25",
        status: "Chưa hết hạn",
      },
      stationInventory: {
        quantity: 5000,
        entryDate: "2025-05-18",
        expiryDate: "2025-05-22",
        status: "Chưa hết hạn",
      },
      total: {
        nonExpired: 35000,
        expired: 0,
      },
      note: "Cần sử dụng sớm",
    },
    {
      id: 4,
      category: "Gia súc",
      product: "Thịt lợn",
      newInput: {
        quantity: 40000,
        entryDate: "2025-05-21",
        expiryDate: "2025-05-24",
        status: "Chưa hết hạn",
      },
      stationInventory: {
        quantity: 10000,
        entryDate: "2025-05-19",
        expiryDate: "2025-05-22",
        status: "Chưa hết hạn",
      },
      total: {
        nonExpired: 50000,
        expired: 0,
      },
      note: "Bảo quản lạnh",
    },
  ]

  // Function to render the processing table for the first 5 tabs
  const renderProcessingTable = (tabKey) => {
    const items = processingItems[tabKey] || []

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">STT</TableHead>
            <TableHead>Đơn vị</TableHead>
            <TableHead>Phân loại</TableHead>
            <TableHead>Tên sản phẩm</TableHead>
            <TableHead>Định mức</TableHead>
            <TableHead>Số lượng cung cấp (kg)</TableHead>
            <TableHead>Ngày chế biến</TableHead>
            <TableHead>Ngày sử dụng</TableHead>
            <TableHead>Ghi chú</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length > 0 ? (
            items.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.product}</TableCell>
                <TableCell>{item.standardAmount}</TableCell>
                <TableCell>{item.supplyQuantity}</TableCell>
                <TableCell>{item.processingDate}</TableCell>
                <TableCell>{item.useDate}</TableCell>
                <TableCell>{item.note}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                      Sửa
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-500">
                      Xóa
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={10} className="text-center">
                Không có dữ liệu
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    )
  }

  // Function to render the LTTP table
  const renderFoodTable = () => {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">STT</TableHead>
            <TableHead>Phân loại</TableHead>
            <TableHead>Tên sản phẩm</TableHead>
            <TableHead>
              <div className="text-center">Nhập mới</div>
              <div className="grid grid-cols-4 text-xs mt-1">
                <div>Số lượng (g)</div>
                <div>Ngày nhập</div>
                <div>Hạn sử dụng</div>
                <div>Trạng thái</div>
              </div>
            </TableHead>
            <TableHead>
              <div className="text-center">Tồn trạm</div>
              <div className="grid grid-cols-4 text-xs mt-1">
                <div>Số lượng (g)</div>
                <div>Ngày nhập</div>
                <div>Hạn sử dụng</div>
                <div>Trạng thái</div>
              </div>
            </TableHead>
            <TableHead>
              <div className="text-center">Tổng</div>
              <div className="grid grid-cols-2 text-xs mt-1">
                <div>Chưa hết hạn</div>
                <div>Đã hết hạn</div>
              </div>
            </TableHead>
            <TableHead>Ghi chú</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {foodItems.map((item, index) => (
            <TableRow key={item.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{item.category}</TableCell>
              <TableCell>{item.product}</TableCell>
              <TableCell>
                <div className="grid grid-cols-4 gap-1">
                  <div>{item.newInput.quantity.toLocaleString()}</div>
                  <div>{item.newInput.entryDate}</div>
                  <div>{item.newInput.expiryDate}</div>
                  <div>
                    <Badge variant={item.newInput.status === "Chưa hết hạn" ? "success" : "destructive"}>
                      {item.newInput.status}
                    </Badge>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="grid grid-cols-4 gap-1">
                  <div>{item.stationInventory.quantity.toLocaleString()}</div>
                  <div>{item.stationInventory.entryDate}</div>
                  <div>{item.stationInventory.expiryDate}</div>
                  <div>
                    <Badge variant={item.stationInventory.status === "Chưa hết hạn" ? "success" : "destructive"}>
                      {item.stationInventory.status}
                    </Badge>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="grid grid-cols-2 gap-1">
                  <div className="text-green-600">{item.total.nonExpired.toLocaleString()}</div>
                  <div className="text-red-600">{item.total.expired.toLocaleString()}</div>
                </div>
              </TableCell>
              <TableCell>{item.note}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm">
                    Sửa
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-500">
                    Xóa
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  // Function to render the filter section for each tab
  const renderFilterSection = (tabKey) => {
    return (
      <div className="flex flex-wrap gap-2 mb-4">
        <Select defaultValue="all-units">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Đơn vị" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-units">Tất cả đơn vị</SelectItem>
            <SelectItem value="lu-doan-bo">Lữ đoàn bộ</SelectItem>
            <SelectItem value="tieu-doan-1">Tiểu đoàn 1</SelectItem>
            <SelectItem value="tieu-doan-2">Tiểu đoàn 2</SelectItem>
            <SelectItem value="tieu-doan-3">Tiểu đoàn 3</SelectItem>
            <SelectItem value="don-vi-ngoai">Đơn vị ngoài</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="all-categories">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Phân loại" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-categories">Tất cả phân loại</SelectItem>
            <SelectItem value="luong-thuc">Lương thực</SelectItem>
            <SelectItem value="rau-cu-qua">Rau củ quả</SelectItem>
            <SelectItem value="gia-suc">Gia súc</SelectItem>
            <SelectItem value="gia-cam">Gia cầm</SelectItem>
            <SelectItem value="hai-san">Hải sản</SelectItem>
            <SelectItem value="gia-vi">Gia vị</SelectItem>
            <SelectItem value="trung">Trứng</SelectItem>
            <SelectItem value="sua-tuoi">Sữa tươi</SelectItem>
            <SelectItem value="cac-loai-hat">Các loại hạt</SelectItem>
            <SelectItem value="trai-cay">Trái cây</SelectItem>
            <SelectItem value="chat-dot">Chất đốt</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <DatePicker placeholder="Từ ngày" />
          <span>-</span>
          <DatePicker placeholder="Đến ngày" />
        </div>

        <Button variant="outline" className="gap-1">
          <Filter className="h-4 w-4" />
          Lọc
        </Button>

        <Button variant="outline" className="gap-1 ml-auto">
          <FileDown className="h-4 w-4" />
          Xuất Excel
        </Button>

        <Button className="gap-1">
          <Plus className="h-4 w-4" />
          Thêm mới
        </Button>
      </div>
    )
  }

  // Function to render the calculation section
  const renderCalculationSection = () => {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Tính toán định mức</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Số người ăn</label>
              <Input type="number" placeholder="Nhập số người ăn" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sản phẩm</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn sản phẩm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dau-phu">Đậu phụ</SelectItem>
                  <SelectItem value="gio-cha">Giò chả</SelectItem>
                  <SelectItem value="gia-do">Giá đỗ</SelectItem>
                  <SelectItem value="dua-muoi">Dưa muối</SelectItem>
                  <SelectItem value="thit-ga">Thịt gà</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full">Tính toán</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nguyên liệu cần thiết</label>
              <div className="p-2 border rounded-md bg-gray-50">
                <p>Đậu nành: 50kg</p>
                <p>Nước: 150 lít</p>
                <p>Chất đông tụ: 500g</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Thành phẩm dự kiến</label>
              <div className="p-2 border rounded-md bg-gray-50">
                <p>Đậu phụ: 50kg</p>
                <p>Phục vụ: 500 người</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cảnh báo</label>
              <div className="p-2 border rounded-md bg-yellow-50 flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <p>Lượng đậu nành trong kho chỉ còn 40kg, cần nhập thêm 10kg</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Function to render the standard amount management section
  const renderStandardAmountSection = () => {
    return (
      <Card className="mb-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Định mức tiêu chuẩn</CardTitle>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Thêm định mức
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>STT</TableHead>
                <TableHead>Loại thực phẩm</TableHead>
                <TableHead>Định mức cơ bản</TableHead>
                <TableHead>Đơn vị tính</TableHead>
                <TableHead>Đối tượng áp dụng</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { id: 1, food: "Gạo", amount: 500, unit: "g/người/ngày", target: "Tất cả" },
                { id: 2, food: "Thịt", amount: 150, unit: "g/người/ngày", target: "Tất cả" },
                { id: 3, food: "Rau", amount: 300, unit: "g/người/ngày", target: "Tất cả" },
                { id: 4, food: "Đậu phụ", amount: 100, unit: "g/người/ngày", target: "Tất cả" },
                { id: 5, food: "Dầu mỡ", amount: 30, unit: "g/người/ngày", target: "Tất cả" },
              ].map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.food}</TableCell>
                  <TableCell>{item.amount}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{item.target}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        Sửa
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-500">
                        Xóa
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#b45f06]">TRẠM CHẾ BIẾN</h2>

        {/* Calculation section */}
        {renderCalculationSection()}

        {/* Standard amount section */}
        {renderStandardAmountSection()}

        <Tabs defaultValue="tofu" className="space-y-4" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6">
            <TabsTrigger value="tofu">Đậu phụ</TabsTrigger>
            <TabsTrigger value="sausage">Giò chả</TabsTrigger>
            <TabsTrigger value="sprouts">Ngâm ủ giá đỗ</TabsTrigger>
            <TabsTrigger value="pickled">Muối nén rau củ quả</TabsTrigger>
            <TabsTrigger value="slaughter">Giết mổ</TabsTrigger>
            <TabsTrigger value="food">Quản lý LTTP</TabsTrigger>
          </TabsList>

          {/* Tofu tab */}
          <TabsContent value="tofu" className="space-y-4">
            {renderFilterSection("tofu")}
            <Card>
              <CardHeader>
                <CardTitle>Quản lý chế biến đậu phụ</CardTitle>
              </CardHeader>
              <CardContent>{renderProcessingTable("tofu")}</CardContent>
            </Card>
          </TabsContent>

          {/* Sausage tab */}
          <TabsContent value="sausage" className="space-y-4">
            {renderFilterSection("sausage")}
            <Card>
              <CardHeader>
                <CardTitle>Quản lý chế biến giò chả</CardTitle>
              </CardHeader>
              <CardContent>{renderProcessingTable("sausage")}</CardContent>
            </Card>
          </TabsContent>

          {/* Sprouts tab */}
          <TabsContent value="sprouts" className="space-y-4">
            {renderFilterSection("sprouts")}
            <Card>
              <CardHeader>
                <CardTitle>Quản lý ngâm ủ giá đỗ</CardTitle>
              </CardHeader>
              <CardContent>{renderProcessingTable("sprouts")}</CardContent>
            </Card>
          </TabsContent>

          {/* Pickled tab */}
          <TabsContent value="pickled" className="space-y-4">
            {renderFilterSection("pickled")}
            <Card>
              <CardHeader>
                <CardTitle>Quản lý muối nén rau củ quả</CardTitle>
              </CardHeader>
              <CardContent>{renderProcessingTable("pickled")}</CardContent>
            </Card>
          </TabsContent>

          {/* Slaughter tab */}
          <TabsContent value="slaughter" className="space-y-4">
            {renderFilterSection("slaughter")}
            <Card>
              <CardHeader>
                <CardTitle>Quản lý giết mổ gia súc, gia cầm, hải sản</CardTitle>
              </CardHeader>
              <CardContent>{renderProcessingTable("slaughter")}</CardContent>
            </Card>
          </TabsContent>

          {/* Food management tab */}
          <TabsContent value="food" className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <Select defaultValue="all-categories">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Phân loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-categories">Tất cả phân loại</SelectItem>
                  <SelectItem value="luong-thuc">Lương thực</SelectItem>
                  <SelectItem value="rau-cu-qua">Rau củ quả</SelectItem>
                  <SelectItem value="gia-suc">Gia súc</SelectItem>
                  <SelectItem value="gia-cam">Gia cầm</SelectItem>
                  <SelectItem value="hai-san">Hải sản</SelectItem>
                  <SelectItem value="gia-vi">Gia vị</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <DatePicker placeholder="Từ ngày" />
                <span>-</span>
                <DatePicker placeholder="Đến ngày" />
              </div>

              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="non-expired">Chưa hết hạn</SelectItem>
                  <SelectItem value="expired">Đã hết hạn</SelectItem>
                  <SelectItem value="near-expiry">Sắp hết hạn</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="gap-1">
                <Filter className="h-4 w-4" />
                Lọc
              </Button>

              <Button variant="outline" className="gap-1 ml-auto">
                <FileDown className="h-4 w-4" />
                Xuất Excel
              </Button>

              <Button className="gap-1">
                <Plus className="h-4 w-4" />
                Nhập mới
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quản lý lương thực thực phẩm (LTTP)</CardTitle>
              </CardHeader>
              <CardContent>{renderFoodTable()}</CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reports section */}
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">Báo cáo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Báo cáo nguyên liệu đã sử dụng</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <FileDown className="h-4 w-4 mr-2" />
                  Xuất báo cáo
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Báo cáo thành phẩm đã chế biến</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <FileDown className="h-4 w-4 mr-2" />
                  Xuất báo cáo
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Báo cáo tình trạng tồn kho</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <FileDown className="h-4 w-4 mr-2" />
                  Xuất báo cáo
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Báo cáo phân phối thực phẩm</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <FileDown className="h-4 w-4 mr-2" />
                  Xuất báo cáo
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
