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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CalendarIcon, FileDown, Plus, Printer, Copy, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { format, addDays, startOfWeek, endOfWeek, getWeek, getYear, parseISO } from "date-fns"
import { vi } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"

export function MenuReportContent() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedWeek, setSelectedWeek] = useState<number>(getWeek(new Date(), { locale: vi }))
  const [selectedYear, setSelectedYear] = useState<number>(getYear(new Date()))
  const [isAddDishDialogOpen, setIsAddDishDialogOpen] = useState(false)
  const [isEditDishDialogOpen, setIsEditDishDialogOpen] = useState(false)
  const [isCopyMenuDialogOpen, setIsCopyMenuDialogOpen] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState<string>("morning")
  const [selectedDishId, setSelectedDishId] = useState<number | null>(null)

  // Calculate week start and end dates
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })

  // Generate days of the week
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Sample data for menu items
  const menuItems = [
    {
      id: 1,
      date: "2025-06-09",
      day: "Thứ Hai",
      peopleCount: 450,
      meals: {
        morning: ["Phở bò", "Bánh mì", "Sữa tươi"],
        noon: ["Cơm trắng", "Thịt kho", "Canh cải", "Rau xào"],
        evening: ["Cơm trắng", "Cá kho", "Canh rau", "Dưa chua"],
      },
      status: "approved",
    },
    {
      id: 2,
      date: "2025-06-10",
      day: "Thứ Ba",
      peopleCount: 445,
      meals: {
        morning: ["Bún bò", "Bánh ngọt", "Sữa tươi"],
        noon: ["Cơm trắng", "Sườn xào", "Canh chua", "Rau muống xào"],
        evening: ["Cơm trắng", "Thịt gà kho", "Canh bí", "Dưa leo"],
      },
      status: "approved",
    },
    {
      id: 3,
      date: "2025-06-11",
      day: "Thứ Tư",
      peopleCount: 448,
      meals: {
        morning: ["Cháo thịt", "Quẩy", "Sữa đậu nành"],
        noon: ["Cơm trắng", "Thịt bò xào", "Canh cà chua", "Rau luộc"],
        evening: ["Cơm trắng", "Cá rán", "Canh cải", "Dưa muối"],
      },
      status: "pending",
    },
    {
      id: 4,
      date: "2025-06-12",
      day: "Thứ Năm",
      peopleCount: 450,
      meals: {
        morning: ["Bánh cuốn", "Chả lụa", "Sữa tươi"],
        noon: ["Cơm trắng", "Thịt lợn kho", "Canh bí đao", "Rau muống xào"],
        evening: ["Cơm trắng", "Trứng rán", "Canh chua", "Dưa chuột"],
      },
      status: "pending",
    },
    {
      id: 5,
      date: "2025-06-13",
      day: "Thứ Sáu",
      peopleCount: 442,
      meals: {
        morning: ["Xôi thịt", "Chả", "Sữa đậu nành"],
        noon: ["Cơm trắng", "Gà rán", "Canh rau", "Rau xào"],
        evening: ["Cơm trắng", "Thịt kho", "Canh chua", "Dưa muối"],
      },
      status: "pending",
    },
    {
      id: 6,
      date: "2025-06-14",
      day: "Thứ Bảy",
      peopleCount: 380,
      meals: {
        morning: ["Bún chả", "Nem rán", "Sữa tươi"],
        noon: ["Cơm trắng", "Thịt rang", "Canh cải", "Rau luộc"],
        evening: ["Cơm trắng", "Cá kho", "Canh bí", "Dưa chua"],
      },
      status: "pending",
    },
    {
      id: 7,
      date: "2025-06-15",
      day: "Chủ Nhật",
      peopleCount: 375,
      meals: {
        morning: ["Phở gà", "Bánh ngọt", "Sữa tươi"],
        noon: ["Cơm trắng", "Thịt bò xào", "Canh chua", "Rau muống"],
        evening: ["Cơm trắng", "Thịt kho", "Canh rau", "Dưa leo"],
      },
      status: "pending",
    },
  ]

  // Function to navigate to previous week
  const goToPreviousWeek = () => {
    const newDate = addDays(selectedDate, -7)
    setSelectedDate(newDate)
    setSelectedWeek(getWeek(newDate, { locale: vi }))
    setSelectedYear(getYear(newDate))
  }

  // Function to navigate to next week
  const goToNextWeek = () => {
    const newDate = addDays(selectedDate, 7)
    setSelectedDate(newDate)
    setSelectedWeek(getWeek(newDate, { locale: vi }))
    setSelectedYear(getYear(newDate))
  }

  // Function to handle dish edit
  const handleEditDish = (id: number, meal: string) => {
    setSelectedDishId(id)
    setSelectedMeal(meal)
    setIsEditDishDialogOpen(true)
  }

  // Function to handle dish deletion
  const handleDeleteDish = (id: number, meal: string, dishIndex: number) => {
    // In a real application, this would call an API to delete the dish
    console.log(`Deleting dish ${dishIndex} from meal ${meal} for menu item ${id}`)
  }

  // Function to handle copying menu
  const handleCopyMenu = (sourceId: number, targetDate: string) => {
    // In a real application, this would call an API to copy the menu
    console.log(`Copying menu from ID ${sourceId} to date ${targetDate}`)
    setIsCopyMenuDialogOpen(false)
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#b45f06]">BÁO CÁO THỰC ĐƠN TUẦN</h2>

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-lg font-medium">
              Tuần {selectedWeek}, {selectedYear}: {format(weekStart, "dd/MM/yyyy", { locale: vi })} -{" "}
              {format(weekEnd, "dd/MM/yyyy", { locale: vi })}
            </div>
            <Button variant="outline" size="icon" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              In thực đơn
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <FileDown className="h-4 w-4" />
              Xuất Excel
            </Button>
          </div>
        </div>

        <Tabs defaultValue="weekly" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weekly">Thực đơn tuần</TabsTrigger>
            <TabsTrigger value="daily">Thực đơn ngày</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  Thực đơn tuần {selectedWeek}, {selectedYear}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Ngày</TableHead>
                        <TableHead className="w-[100px]">Số người ăn</TableHead>
                        <TableHead className="w-[250px]">Buổi sáng</TableHead>
                        <TableHead className="w-[250px]">Buổi trưa</TableHead>
                        <TableHead className="w-[250px]">Buổi chiều</TableHead>
                        <TableHead className="w-[120px]">Trạng thái</TableHead>
                        <TableHead className="w-[150px]">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {menuItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.day}
                            <br />
                            <span className="text-xs text-gray-500">{format(parseISO(item.date), "dd/MM/yyyy")}</span>
                          </TableCell>
                          <TableCell>{item.peopleCount}</TableCell>
                          <TableCell>
                            <ul className="list-disc pl-5">
                              {item.meals.morning.map((dish, index) => (
                                <li key={index} className="text-sm">
                                  {dish}
                                </li>
                              ))}
                            </ul>
                          </TableCell>
                          <TableCell>
                            <ul className="list-disc pl-5">
                              {item.meals.noon.map((dish, index) => (
                                <li key={index} className="text-sm">
                                  {dish}
                                </li>
                              ))}
                            </ul>
                          </TableCell>
                          <TableCell>
                            <ul className="list-disc pl-5">
                              {item.meals.evening.map((dish, index) => (
                                <li key={index} className="text-sm">
                                  {dish}
                                </li>
                              ))}
                            </ul>
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.status === "approved" ? "success" : "outline"}>
                              {item.status === "approved" ? "Đã duyệt" : "Chờ duyệt"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm" onClick={() => setIsCopyMenuDialogOpen(true)}>
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="daily" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2 items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedDate, "PPP", { locale: vi })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex gap-2">
                <Button className="flex items-center gap-2" onClick={() => setIsAddDishDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Thêm món ăn
                </Button>
              </div>
            </div>

            {menuItems
              .filter((item) => item.date === format(selectedDate, "yyyy-MM-dd"))
              .map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>
                        Thực đơn ngày {format(parseISO(item.date), "dd/MM/yyyy")} ({item.day})
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.status === "approved" ? "success" : "outline"}>
                          {item.status === "approved" ? "Đã duyệt" : "Chờ duyệt"}
                        </Badge>
                        <div className="text-sm font-medium">
                          Số người ăn: <span className="font-bold">{item.peopleCount}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold">Buổi sáng</h3>
                          <Button variant="outline" size="sm" onClick={() => setIsAddDishDialogOpen(true)}>
                            <Plus className="h-3.5 w-3.5 mr-1" /> Thêm
                          </Button>
                        </div>
                        <ul className="space-y-2">
                          {item.meals.morning.map((dish, index) => (
                            <li key={index} className="flex justify-between items-center p-2 border rounded-md">
                              <span>{dish}</span>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => handleEditDish(item.id, "morning")}>
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteDish(item.id, "morning", index)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold">Buổi trưa</h3>
                          <Button variant="outline" size="sm" onClick={() => setIsAddDishDialogOpen(true)}>
                            <Plus className="h-3.5 w-3.5 mr-1" /> Thêm
                          </Button>
                        </div>
                        <ul className="space-y-2">
                          {item.meals.noon.map((dish, index) => (
                            <li key={index} className="flex justify-between items-center p-2 border rounded-md">
                              <span>{dish}</span>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => handleEditDish(item.id, "noon")}>
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteDish(item.id, "noon", index)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold">Buổi chiều</h3>
                          <Button variant="outline" size="sm" onClick={() => setIsAddDishDialogOpen(true)}>
                            <Plus className="h-3.5 w-3.5 mr-1" /> Thêm
                          </Button>
                        </div>
                        <ul className="space-y-2">
                          {item.meals.evening.map((dish, index) => (
                            <li key={index} className="flex justify-between items-center p-2 border rounded-md">
                              <span>{dish}</span>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => handleEditDish(item.id, "evening")}>
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteDish(item.id, "evening", index)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

            {menuItems.filter((item) => item.date === format(selectedDate, "yyyy-MM-dd")).length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <p className="text-gray-500 mb-4">Không có thực đơn cho ngày này</p>
                  <Button>Tạo thực đơn mới</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialog for adding a new dish */}
        <Dialog open={isAddDishDialogOpen} onOpenChange={setIsAddDishDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm món ăn mới</DialogTitle>
              <DialogDescription>
                Thêm món ăn vào thực đơn ngày {selectedDate && format(selectedDate, "dd/MM/yyyy", { locale: vi })}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="meal-type" className="text-right">
                  Buổi ăn
                </Label>
                <Select defaultValue="morning">
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Chọn buổi ăn" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Buổi sáng</SelectItem>
                    <SelectItem value="noon">Buổi trưa</SelectItem>
                    <SelectItem value="evening">Buổi chiều</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dish-name" className="text-right">
                  Tên món ăn
                </Label>
                <Input id="dish-name" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dish-description" className="text-right">
                  Mô tả
                </Label>
                <Textarea id="dish-description" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDishDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit">Lưu</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog for editing a dish */}
        <Dialog open={isEditDishDialogOpen} onOpenChange={setIsEditDishDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chỉnh sửa món ăn</DialogTitle>
              <DialogDescription>Chỉnh sửa món ăn trong thực đơn</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-meal-type" className="text-right">
                  Buổi ăn
                </Label>
                <Select defaultValue={selectedMeal}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Chọn buổi ăn" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Buổi sáng</SelectItem>
                    <SelectItem value="noon">Buổi trưa</SelectItem>
                    <SelectItem value="evening">Buổi chiều</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-dish-name" className="text-right">
                  Tên món ăn
                </Label>
                <Input id="edit-dish-name" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-dish-description" className="text-right">
                  Mô tả
                </Label>
                <Textarea id="edit-dish-description" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDishDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit">Lưu thay đổi</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog for copying menu */}
        <Dialog open={isCopyMenuDialogOpen} onOpenChange={setIsCopyMenuDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sao chép thực đơn</DialogTitle>
              <DialogDescription>Sao chép thực đơn từ một ngày sang ngày khác</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="source-date" className="text-right">
                  Từ ngày
                </Label>
                <div className="col-span-3">
                  <Select defaultValue="1">
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn ngày nguồn" />
                    </SelectTrigger>
                    <SelectContent>
                      {menuItems.map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.day} ({format(parseISO(item.date), "dd/MM/yyyy")})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="target-date" className="text-right">
                  Đến ngày
                </Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP", { locale: vi }) : "Chọn ngày"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="copy-options" className="text-right">
                  Tùy chọn
                </Label>
                <div className="col-span-3 flex flex-col gap-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="copy-morning" className="rounded" defaultChecked />
                    <Label htmlFor="copy-morning">Sao chép buổi sáng</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="copy-noon" className="rounded" defaultChecked />
                    <Label htmlFor="copy-noon">Sao chép buổi trưa</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="copy-evening" className="rounded" defaultChecked />
                    <Label htmlFor="copy-evening">Sao chép buổi chiều</Label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCopyMenuDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" onClick={() => handleCopyMenu(1, format(selectedDate, "yyyy-MM-dd"))}>
                Sao chép
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
