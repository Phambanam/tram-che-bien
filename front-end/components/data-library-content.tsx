"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, FileDown, FileUp } from "lucide-react"

export function DataLibraryContent() {
  return (
    <div className="container">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#b45f06]">THƯ VIỆN DỮ LIỆU</h2>

        <Tabs defaultValue="units" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="units">Đơn vị</TabsTrigger>
            <TabsTrigger value="products">Sản phẩm</TabsTrigger>
            <TabsTrigger value="suppliers">Nhà cung cấp</TabsTrigger>
            <TabsTrigger value="documents">Tài liệu</TabsTrigger>
          </TabsList>

          <TabsContent value="units" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2 items-center">
                <Input placeholder="Tìm kiếm đơn vị..." className="w-64" />
                <Button variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Thêm đơn vị
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Danh sách đơn vị</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>STT</TableHead>
                      <TableHead>Mã đơn vị</TableHead>
                      <TableHead>Tên đơn vị</TableHead>
                      <TableHead>Quân số</TableHead>
                      <TableHead>Chỉ huy</TableHead>
                      <TableHead>Liên hệ</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        id: 1,
                        code: "DD01",
                        name: "Đại đội 1",
                        personnel: 120,
                        commander: "Đại úy Nguyễn Văn A",
                        contact: "0987654321",
                      },
                      {
                        id: 2,
                        code: "DD02",
                        name: "Đại đội 2",
                        personnel: 115,
                        commander: "Đại úy Trần Văn B",
                        contact: "0987654322",
                      },
                      {
                        id: 3,
                        code: "DD03",
                        name: "Đại đội 3",
                        personnel: 118,
                        commander: "Đại úy Lê Văn C",
                        contact: "0987654323",
                      },
                      {
                        id: 4,
                        code: "DD04",
                        name: "Đại đội 4",
                        personnel: 122,
                        commander: "Đại úy Phạm Văn D",
                        contact: "0987654324",
                      },
                      {
                        id: 5,
                        code: "DD05",
                        name: "Đại đội 5",
                        personnel: 110,
                        commander: "Đại úy Hoàng Văn E",
                        contact: "0987654325",
                      },
                    ].map((unit, index) => (
                      <TableRow key={unit.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{unit.code}</TableCell>
                        <TableCell className="font-medium">{unit.name}</TableCell>
                        <TableCell>{unit.personnel}</TableCell>
                        <TableCell>{unit.commander}</TableCell>
                        <TableCell>{unit.contact}</TableCell>
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

          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2 items-center">
                <Input placeholder="Tìm kiếm sản phẩm..." className="w-64" />
                <Button variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex items-center gap-2">
                  <FileDown className="h-4 w-4" />
                  Xuất Excel
                </Button>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Thêm sản phẩm
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Danh sách sản phẩm</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>STT</TableHead>
                      <TableHead>Mã sản phẩm</TableHead>
                      <TableHead>Tên sản phẩm</TableHead>
                      <TableHead>Đơn vị</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Tồn kho</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { id: 1, code: "SP001", name: "Gạo tẻ", unit: "kg", category: "Lương thực", stock: 450 },
                      { id: 2, code: "SP002", name: "Thịt lợn", unit: "kg", category: "Thực phẩm", stock: 180 },
                      { id: 3, code: "SP003", name: "Rau xanh", unit: "kg", category: "Thực phẩm", stock: 135 },
                      { id: 4, code: "SP004", name: "Cá biển", unit: "kg", category: "Thực phẩm", stock: 90 },
                      { id: 5, code: "SP005", name: "Trứng gà", unit: "quả", category: "Thực phẩm", stock: 900 },
                    ].map((product, index) => (
                      <TableRow key={product.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{product.code}</TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.unit}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>{product.stock}</TableCell>
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

          <TabsContent value="suppliers" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2 items-center">
                <Input placeholder="Tìm kiếm nhà cung cấp..." className="w-64" />
                <Button variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Thêm nhà cung cấp
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Danh sách nhà cung cấp</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>STT</TableHead>
                      <TableHead>Mã NCC</TableHead>
                      <TableHead>Tên nhà cung cấp</TableHead>
                      <TableHead>Địa chỉ</TableHead>
                      <TableHead>Liên hệ</TableHead>
                      <TableHead>Loại hàng</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        id: 1,
                        code: "NCC001",
                        name: "Công ty A",
                        address: "123 Đường A, Quận 1, TP.HCM",
                        contact: "0987654321",
                        category: "Lương thực",
                      },
                      {
                        id: 2,
                        code: "NCC002",
                        name: "Công ty B",
                        address: "456 Đường B, Quận 2, TP.HCM",
                        contact: "0987654322",
                        category: "Thực phẩm",
                      },
                      {
                        id: 3,
                        code: "NCC003",
                        name: "Công ty C",
                        address: "789 Đường C, Quận 3, TP.HCM",
                        contact: "0987654323",
                        category: "Rau củ",
                      },
                      {
                        id: 4,
                        code: "NCC004",
                        name: "Công ty D",
                        address: "101 Đường D, Quận 4, TP.HCM",
                        contact: "0987654324",
                        category: "Thủy sản",
                      },
                      {
                        id: 5,
                        code: "NCC005",
                        name: "Công ty E",
                        address: "202 Đường E, Quận 5, TP.HCM",
                        contact: "0987654325",
                        category: "Gia cầm",
                      },
                    ].map((supplier, index) => (
                      <TableRow key={supplier.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{supplier.code}</TableCell>
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell>{supplier.address}</TableCell>
                        <TableCell>{supplier.contact}</TableCell>
                        <TableCell>{supplier.category}</TableCell>
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

          <TabsContent value="documents" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2 items-center">
                <Input placeholder="Tìm kiếm tài liệu..." className="w-64" />
                <Button variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex items-center gap-2">
                  <FileUp className="h-4 w-4" />
                  Tải lên tài liệu
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Danh sách tài liệu</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>STT</TableHead>
                      <TableHead>Tên tài liệu</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead>Người tạo</TableHead>
                      <TableHead>Kích thước</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        id: 1,
                        name: "Quy trình nhập kho",
                        type: "PDF",
                        date: "15/01/2023",
                        creator: "Đại tá Tạ Duy Đình",
                        size: "2.5 MB",
                      },
                      {
                        id: 2,
                        name: "Quy trình xuất kho",
                        type: "PDF",
                        date: "16/01/2023",
                        creator: "Đại tá Tạ Duy Đình",
                        size: "2.3 MB",
                      },
                      {
                        id: 3,
                        name: "Tiêu chuẩn dinh dưỡng",
                        type: "DOCX",
                        date: "20/02/2023",
                        creator: "Thượng tá Nguyễn Văn Thành",
                        size: "1.8 MB",
                      },
                      {
                        id: 4,
                        name: "Báo cáo tổng kết quý 1",
                        type: "XLSX",
                        date: "05/04/2023",
                        creator: "Trung tá Nguyễn Văn Thành",
                        size: "3.2 MB",
                      },
                      {
                        id: 5,
                        name: "Hướng dẫn sử dụng phần mềm",
                        type: "PDF",
                        date: "10/05/2023",
                        creator: "Thiếu tá Đào Trung Lợi",
                        size: "4.5 MB",
                      },
                    ].map((doc, index) => (
                      <TableRow key={doc.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{doc.name}</TableCell>
                        <TableCell>{doc.type}</TableCell>
                        <TableCell>{doc.date}</TableCell>
                        <TableCell>{doc.creator}</TableCell>
                        <TableCell>{doc.size}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              Xem
                            </Button>
                            <Button variant="outline" size="sm">
                              Tải xuống
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
        </Tabs>
      </div>
    </div>
  )
}
