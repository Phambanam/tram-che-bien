"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CalendarIcon, Search, FileDown, FileUp, Users, Calculator, Edit } from "lucide-react"
import { format, startOfWeek, addDays, isSameDay } from "date-fns"
import { vi } from "date-fns/locale"
import { useToast } from "@/components/ui/use-toast"
import { unitsApi, dailyRationsApi, categoriesApi } from "@/lib/api-client"

interface Unit {
  _id: string
  name: string
  code?: string
  personnel?: number
  commander?: string
  contact?: string
  description?: string
}

interface DailyRation {
  _id: string
  name: string
  lttpId: string
  lttpName: string
  quantityPerPerson: number
  unit: string
  pricePerUnit: number
  totalCostPerPerson: number
  category: string
  notes?: string
}

interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  itemCount?: number
}

interface SupplyOutputData {
  id: string
  foodName: string
  category: string
  unit: string
  quantityPerPerson: number
  pricePerUnit: number
  units: {
    [unitId: string]: {
      personnel: number
      requirement: number
    }
  }
  totalPersonnel: number
  totalCost: number
  totalAmount: number
}

interface UnitPersonnelData {
  [unitId: string]: number
}

export function OutputManagementContent() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedView, setSelectedView] = useState<"day" | "week">("day")
  const [units, setUnits] = useState<Unit[]>([])
  const [dailyRations, setDailyRations] = useState<DailyRation[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [supplyData, setSupplyData] = useState<SupplyOutputData[]>([])
  const [unitPersonnel, setUnitPersonnel] = useState<UnitPersonnelData>({})
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<{ unitId: string; unitName: string; personnel: number } | null>(null)
  const [newPersonnelCount, setNewPersonnelCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Get week days starting from Monday
  const getWeekDays = (date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 }) // Monday = 1
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }

  const weekDays = getWeekDays(selectedDate)
  const dayNames = ["Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy", "Chủ nhật"]

  // Fetch data from APIs
  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch units
      const unitsResponse = await unitsApi.getUnits()
      const unitsData = Array.isArray(unitsResponse) ? unitsResponse : (unitsResponse as any).data || []
      setUnits(unitsData)

      // Initialize unit personnel data
      const personnelData: UnitPersonnelData = {}
      unitsData.forEach((unit: Unit) => {
        personnelData[unit._id] = unit.personnel || 0
      })
      setUnitPersonnel(personnelData)

      // Fetch daily rations
      const dailyRationsResponse = await dailyRationsApi.getDailyRations()
      const dailyRationsData = Array.isArray(dailyRationsResponse) ? dailyRationsResponse : (dailyRationsResponse as any).data || []
      setDailyRations(dailyRationsData)

      // Fetch categories
      const categoriesResponse = await categoriesApi.getCategories()
      const categoriesData = Array.isArray(categoriesResponse) ? categoriesResponse : (categoriesResponse as any).data || []
      setCategories(categoriesData)

      // Generate supply output data
      generateSupplyOutputData(dailyRationsData, unitsData, personnelData)

    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Generate supply output data based on daily rations and units
  const generateSupplyOutputData = (rations: DailyRation[], unitsData: Unit[], personnelData: UnitPersonnelData) => {
    const outputData: SupplyOutputData[] = rations.map((ration, index) => {
      const unitRequirements: { [unitId: string]: { personnel: number; requirement: number } } = {}
      let totalPersonnel = 0
      let totalAmount = 0

      unitsData.forEach((unit) => {
        const personnel = personnelData[unit._id] || 0
        const requirement = personnel * ration.quantityPerPerson
        
        unitRequirements[unit._id] = {
          personnel,
          requirement
        }
        
        totalPersonnel += personnel
        totalAmount += requirement
      })

      const totalCost = totalAmount * ration.pricePerUnit

      return {
        id: ration._id,
        foodName: ration.lttpName || ration.name,
        category: ration.category,
        unit: ration.unit,
        quantityPerPerson: ration.quantityPerPerson,
        pricePerUnit: ration.pricePerUnit,
        units: unitRequirements,
        totalPersonnel,
        totalCost,
        totalAmount
      }
    })

    setSupplyData(outputData)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Handle day/week selection
  const handleDateSelect = (date: Date, view: "day" | "week") => {
    setSelectedDate(date)
    setSelectedView(view)
  }

  // Handle personnel count edit
  const handleEditPersonnel = (unitId: string, unitName: string, currentPersonnel: number) => {
    setEditingUnit({ unitId, unitName, personnel: currentPersonnel })
    setNewPersonnelCount(currentPersonnel)
    setIsEditDialogOpen(true)
  }

  // Save personnel count changes
  const handleSavePersonnelCount = () => {
    if (editingUnit) {
      const updatedPersonnel = { ...unitPersonnel }
      updatedPersonnel[editingUnit.unitId] = newPersonnelCount

      setUnitPersonnel(updatedPersonnel)
      
      // Regenerate supply data with new personnel counts
      generateSupplyOutputData(dailyRations, units, updatedPersonnel)
      
      toast({
        title: "Thành công",
        description: `Đã cập nhật số người ăn cho ${editingUnit.unitName}`,
      })
    }
    setIsEditDialogOpen(false)
    setEditingUnit(null)
  }

  // Calculate category totals to check limits
  const getCategoryTotals = () => {
    const categoryTotals: { [category: string]: { total: number; limit: number } } = {}
    
    // Define category limits (example: 400g for vegetables per person per day)
    const categoryLimits: { [category: string]: number } = {
      "Rau củ quả": 0.4, // 400g per person
      "Thịt": 0.2, // 200g per person
      "Hải sản": 0.15, // 150g per person
      "Lương thực": 0.6, // 600g per person
      "Gia vị": 0.05, // 50g per person
      "Chất đốt": 0.002 // 2g per person (for gas calculation)
    }

    supplyData.forEach((item) => {
      if (!categoryTotals[item.category]) {
        categoryTotals[item.category] = {
          total: 0,
          limit: categoryLimits[item.category] || 1
        }
      }
      categoryTotals[item.category].total += item.quantityPerPerson
    })

    return categoryTotals
  }

  const categoryTotals = getCategoryTotals()

  if (isLoading) {
    return (
      <div className="container">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b45f06] mx-auto mb-4"></div>
              <p>Đang tải dữ liệu...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#b45f06]">QUẢN LÝ NGUỒN XUẤT</h2>

        {/* Weekly Calendar Header */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center">📆 Dòng ngày trong tuần</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-8 gap-2">
              {/* Individual Days */}
              {weekDays.map((day, index) => (
                <Button
                  key={day.toISOString()}
                  variant={isSameDay(day, selectedDate) && selectedView === "day" ? "default" : "outline"}
                  className="flex flex-col items-center p-4 h-auto"
                  onClick={() => handleDateSelect(day, "day")}
                >
                  <span className="text-sm font-medium">{dayNames[index]}</span>
                  <span className="text-xs text-gray-500">{format(day, "dd/MM")}</span>
                </Button>
              ))}
              
              {/* Whole Week Button */}
              <Button
                variant={selectedView === "week" ? "default" : "outline"}
                className="flex flex-col items-center p-4 h-auto"
                onClick={() => handleDateSelect(selectedDate, "week")}
              >
                <span className="text-sm font-medium">Tổng cả tuần</span>
                <span className="text-xs text-gray-500">
                  {format(weekDays[0], "dd/MM")} - {format(weekDays[6], "dd/MM")}
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Supply Output Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                📊 Bảng chính - {selectedView === "week" ? "Tổng cả tuần" : `${dayNames[weekDays.findIndex(day => isSameDay(day, selectedDate))]}`}
              </CardTitle>
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
              </CardHeader>
              <CardContent>
            <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                    <TableHead className="w-12">STT</TableHead>
                    <TableHead className="min-w-[150px]">Tên thực phẩm</TableHead>
                    <TableHead>Phân loại</TableHead>
                    <TableHead>ĐVT</TableHead>
                    <TableHead>Định lượng</TableHead>
                    {units.map((unit) => (
                      <TableHead key={`${unit._id}-personnel`} className="text-center bg-blue-50">
                        <div className="flex flex-col">
                          <span className="font-medium">{unit.name}</span>
                          <span className="text-xs text-gray-500">Số người ăn</span>
                        </div>
                      </TableHead>
                    ))}
                    {units.map((unit) => (
                      <TableHead key={`${unit._id}-requirement`} className="text-center bg-green-50">
                        <div className="flex flex-col">
                          <span className="font-medium">{unit.name}</span>
                          <span className="text-xs text-gray-500">Nhu cầu</span>
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-center bg-yellow-50">Tổng - Số người ăn</TableHead>
                    <TableHead className="text-center bg-orange-50">Tổng - Giá thành</TableHead>
                    <TableHead className="text-center bg-red-50">Tổng - Thành tiền</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {supplyData.map((item, index) => (
                    <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{item.foodName}</TableCell>
                        <TableCell>
                        <Badge variant="outline" className={
                          categoryTotals[item.category] && 
                          categoryTotals[item.category].total > categoryTotals[item.category].limit
                            ? "border-red-500 text-red-700"
                            : "border-green-500 text-green-700"
                        }>
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell className="text-center">
                        {item.quantityPerPerson.toFixed(3)}
                      </TableCell>
                      
                      {/* Personnel columns */}
                      {units.map((unit) => (
                        <TableCell key={`${unit._id}-personnel`} className="text-center bg-blue-50">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1 hover:bg-blue-100"
                            onClick={() => handleEditPersonnel(unit._id, unit.name, unitPersonnel[unit._id] || 0)}
                          >
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{unitPersonnel[unit._id] || 0}</span>
                              <Edit className="h-3 w-3" />
                            </div>
                          </Button>
                        </TableCell>
                      ))}
                      
                      {/* Requirement columns */}
                      {units.map((unit) => (
                        <TableCell key={`${unit._id}-requirement`} className="text-center bg-green-50">
                          {item.units[unit._id]?.requirement.toFixed(3) || "0.000"}
                        </TableCell>
                      ))}
                      
                      <TableCell className="text-center bg-yellow-50 font-medium">
                        {item.totalPersonnel}
                      </TableCell>
                      <TableCell className="text-center bg-orange-50">
                        {item.pricePerUnit.toLocaleString()} đ/{item.unit}
                      </TableCell>
                      <TableCell className="text-center bg-red-50 font-medium">
                        {item.totalCost.toLocaleString()} đ
                        </TableCell>
                      </TableRow>
                  ))}
                  
                  {/* Total Row */}
                  <TableRow className="bg-gray-100 font-bold">
                    <TableCell colSpan={5} className="text-center">TỔNG CỘNG</TableCell>
                    {units.map((unit) => (
                      <TableCell key={`${unit._id}-total-personnel`} className="text-center bg-blue-100">
                        {unitPersonnel[unit._id] || 0}
                      </TableCell>
                    ))}
                    {units.map((unit) => (
                      <TableCell key={`${unit._id}-total-requirement`} className="text-center bg-green-100">
                        {supplyData.reduce((sum, item) => sum + (item.units[unit._id]?.requirement || 0), 0).toFixed(3)}
                      </TableCell>
                    ))}
                    <TableCell className="text-center bg-yellow-100">
                      {supplyData.reduce((sum, item) => sum + item.totalPersonnel, 0)}
                    </TableCell>
                    <TableCell className="text-center bg-orange-100">-</TableCell>
                    <TableCell className="text-center bg-red-100">
                      {supplyData.reduce((sum, item) => sum + item.totalCost, 0).toLocaleString()} đ
                    </TableCell>
                  </TableRow>
                  </TableBody>
                </Table>
            </div>
              </CardContent>
            </Card>

        {/* Notes Section */}
        <Card className="mt-6">
              <CardHeader>
            <CardTitle>📝 Chú thích</CardTitle>
              </CardHeader>
              <CardContent>
            <div className="space-y-3 text-sm">
              <p>
                <strong>Chú ý:</strong> Từ khi lên thực đơn các món từng bữa thì phần nhu cầu sử dụng sẽ xuất hiện tên thực phẩm theo thực đơn món 
                (mỗi món sẽ có dữ liệu cụ thể từng thực phẩm). Phần Định lượng đã nhập sẵn từ dữ liệu theo từng mức ăn, 
                hiện tại áp dụng mức ăn 65.000đ sao cho phân loại không được vượt quá định mức.
              </p>
              <p>
                <strong>Ví dụ:</strong> trường hợp có 2 hay nhiều thực phẩm có cùng chung phân loại như trong ngày có cà chua, cà rốt, khoai tây 
                thuộc phân loại RAU CỦ QUẢ 400G/NGƯỜI/NGÀY thì tổng số lượng của 3 loại này không vượt quá 400g.
              </p>
              <p>
                Từ số lượng người ăn của từng đơn vị nhu cầu sẽ bằng định lượng nhân với số người và đây cũng là số lượng cấp cho các đơn vị 
                để các đơn vị chế biến nấu ăn theo thực đơn.
              </p>
              
              {/* Category Limits Status */}
              <div className="mt-4">
                <h4 className="font-medium mb-2">Trạng thái định mức theo phân loại:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(categoryTotals).map(([category, data]) => (
                    <div key={category} className="flex items-center gap-2">
                      <Badge variant={data.total > data.limit ? "destructive" : "default"}>
                        {category}
                      </Badge>
                      <span className="text-xs">
                        {(data.total * 1000).toFixed(0)}g/{(data.limit * 1000).toFixed(0)}g
                      </span>
                      {data.total > data.limit && (
                        <span className="text-xs text-red-600">Vượt mức!</span>
                      )}
                    </div>
                  ))}
                    </div>
                  </div>
                  </div>
              </CardContent>
            </Card>

        {/* Edit Personnel Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chỉnh sửa số người ăn</DialogTitle>
              <DialogDescription>
                Cập nhật số người ăn cho {editingUnit?.unitName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Số người ăn hiện tại:</label>
                <Input
                  type="number"
                  value={newPersonnelCount}
                  onChange={(e) => setNewPersonnelCount(parseInt(e.target.value) || 0)}
                  min="0"
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSavePersonnelCount}>
                Lưu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
