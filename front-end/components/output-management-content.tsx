"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CalendarIcon, Search, FileDown, FileUp, Users, Calculator, Edit, Plus, Bot, Sparkles } from "lucide-react"
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
  
  // AI Assistant states
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false)
  const [aiFormData, setAIFormData] = useState({
    foodName: "",
    category: "",
    unit: "kg",
    quantityPerPerson: 0,
    pricePerUnit: 0,
    notes: ""
  })
  const [aiSuggestions, setAISuggestions] = useState<string[]>([])
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false)
  
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
      generateSupplyOutputData(dailyRationsData, unitsData, personnelData, selectedDate, selectedView)

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
  const generateSupplyOutputData = (rations: DailyRation[], unitsData: Unit[], personnelData: UnitPersonnelData, selectedDate?: Date, selectedView?: "day" | "week") => {
    // Simulate day-specific data variations
    const dateModifier = selectedDate ? selectedDate.getDay() : 1 // Monday = 1, Sunday = 0
    const isWeekView = selectedView === "week"
    
    const outputData: SupplyOutputData[] = rations.map((ration, index) => {
      const unitRequirements: { [unitId: string]: { personnel: number; requirement: number } } = {}
      let totalPersonnel = 0
      let totalAmount = 0

      // Apply day-specific variations to simulate different daily requirements
      let dayMultiplier = 1
      if (!isWeekView) {
        // Different multipliers for different days of the week
        switch (dateModifier) {
          case 1: // Monday
            dayMultiplier = 1.1; break
          case 2: // Tuesday  
            dayMultiplier = 0.9; break
          case 3: // Wednesday
            dayMultiplier = 1.0; break
          case 4: // Thursday
            dayMultiplier = 1.2; break
          case 5: // Friday
            dayMultiplier = 0.8; break
          case 6: // Saturday
            dayMultiplier = 1.3; break
          case 0: // Sunday
            dayMultiplier = 0.7; break
        }
      } else {
        // Week view shows average
        dayMultiplier = 1.0
      }

      unitsData.forEach((unit) => {
        const personnel = personnelData[unit._id] || 0
        const baseRequirement = personnel * ration.quantityPerPerson
        const adjustedRequirement = baseRequirement * dayMultiplier
        
        unitRequirements[unit._id] = {
          personnel,
          requirement: adjustedRequirement
        }
        
        totalPersonnel += personnel
        totalAmount += adjustedRequirement
      })

      const totalCost = totalAmount * ration.pricePerUnit

      return {
        id: ration._id,
        foodName: ration.lttpName || ration.name,
        category: ration.category,
        unit: ration.unit,
        quantityPerPerson: ration.quantityPerPerson * dayMultiplier,
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
    // Regenerate data for the new selection
    generateSupplyOutputData(dailyRations, units, unitPersonnel, date, view)
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
      generateSupplyOutputData(dailyRations, units, updatedPersonnel, selectedDate, selectedView)
      
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

  // AI Assistant functions
  const generateAISuggestions = async () => {
    setIsGeneratingSuggestions(true)
    
    // Mock AI suggestions based on common military rations
    const suggestions = [
      "Dựa trên mức ăn 65,000đ/người/ngày, gợi ý thêm gạo tẻ với định lượng 0.6kg/người",
      "Khuyến nghị bổ sung thịt heo với định lượng 0.15kg/người để đảm bảo protein",
      "Nên thêm rau củ quả (cà chua) với định lượng 0.1kg/người cho vitamin",
      "Gợi ý thêm dầu ăn với định lượng 0.03kg/người cho năng lượng",
      "Khuyến nghị bổ sung gia vị (muối) với định lượng 0.01kg/người"
    ]
    
    // Simulate API delay
    setTimeout(() => {
      setAISuggestions(suggestions)
      setIsGeneratingSuggestions(false)
    }, 1500)
  }

  const handleAISuggestionSelect = (suggestion: string) => {
    // Parse suggestion to fill form data
    if (suggestion.includes("gạo tẻ")) {
      setAIFormData({
        foodName: "Gạo tẻ",
        category: "Lương thực",
        unit: "kg",
        quantityPerPerson: 0.6,
        pricePerUnit: 25000,
        notes: "Nguồn cung cấp năng lượng chính"
      })
    } else if (suggestion.includes("thịt heo")) {
      setAIFormData({
        foodName: "Thịt heo",
        category: "Thịt",
        unit: "kg", 
        quantityPerPerson: 0.15,
        pricePerUnit: 180000,
        notes: "Nguồn protein chính"
      })
    } else if (suggestion.includes("cà chua")) {
      setAIFormData({
        foodName: "Cà chua",
        category: "Rau củ quả",
        unit: "kg",
        quantityPerPerson: 0.1,
        pricePerUnit: 15000,
        notes: "Bổ sung vitamin C"
      })
    } else if (suggestion.includes("dầu ăn")) {
      setAIFormData({
        foodName: "Dầu ăn",
        category: "Gia vị",
        unit: "lít",
        quantityPerPerson: 0.03,
        pricePerUnit: 35000,
        notes: "Chất béo thiết yếu"
      })
    } else if (suggestion.includes("muối")) {
      setAIFormData({
        foodName: "Muối",
        category: "Gia vị", 
        unit: "kg",
        quantityPerPerson: 0.01,
        pricePerUnit: 8000,
        notes: "Gia vị cơ bản"
      })
    }
  }

  const handleAddNewSupplyItem = async () => {
    try {
      // Create new daily ration item
      const newRationData = {
        name: aiFormData.foodName,
        lttpName: aiFormData.foodName,
        quantityPerPerson: aiFormData.quantityPerPerson,
        unit: aiFormData.unit,
        pricePerUnit: aiFormData.pricePerUnit,
        totalCostPerPerson: aiFormData.quantityPerPerson * aiFormData.pricePerUnit,
        category: aiFormData.category,
        notes: aiFormData.notes
      }

      // Add to API (commented out for now as we don't have the endpoint)
      // await dailyRationsApi.createDailyRation(newRationData)
      
      // Add to local state for demonstration
      const newRation: DailyRation = {
        _id: `temp-${Date.now()}`,
        lttpId: `lttp-${Date.now()}`,
        ...newRationData
      }

      const updatedRations = [...dailyRations, newRation]
      setDailyRations(updatedRations)
      
      // Regenerate supply data
      generateSupplyOutputData(updatedRations, units, unitPersonnel, selectedDate, selectedView)
      
      toast({
        title: "Thành công",
        description: `Đã thêm ${aiFormData.foodName} vào nguồn xuất`,
      })
      
      // Reset form
      setAIFormData({
        foodName: "",
        category: "",
        unit: "kg",
        quantityPerPerson: 0,
        pricePerUnit: 0,
        notes: ""
      })
      setAISuggestions([])
      setIsAIAssistantOpen(false)
      
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể thêm nguồn xuất mới",
        variant: "destructive",
      })
    }
  }

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
                <Button
                  onClick={() => setIsAIAssistantOpen(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                >
                  <Bot className="h-4 w-4" />
                  <Sparkles className="h-3 w-3" />
                  Trợ lý AI thêm nguồn xuất
                </Button>
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

        {/* AI Assistant Dialog */}
        <Dialog open={isAIAssistantOpen} onOpenChange={setIsAIAssistantOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-purple-500" />
                <Sparkles className="h-4 w-4 text-blue-500" />
                Trợ lý AI - Thêm nguồn xuất mới
              </DialogTitle>
              <DialogDescription>
                Trợ lý AI sẽ giúp bạn tạo nguồn xuất mới dựa trên kinh nghiệm quân đội và định mức ăn 65,000đ/người/ngày
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* AI Suggestions Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">🤖 Gợi ý từ AI</h3>
                  <Button 
                    onClick={generateAISuggestions}
                    disabled={isGeneratingSuggestions}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {isGeneratingSuggestions ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                        Đang phân tích...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Tạo gợi ý AI
                      </>
                    )}
                  </Button>
                </div>
                
                {aiSuggestions.length > 0 && (
                  <div className="grid gap-3">
                    {aiSuggestions.map((suggestion, index) => (
                      <div 
                        key={index}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
                        onClick={() => handleAISuggestionSelect(suggestion)}
                      >
                        <div className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5">#{index + 1}</Badge>
                          <p className="text-sm">{suggestion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Manual Form Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">✍️ Nhập thủ công</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="foodName">Tên thực phẩm *</Label>
                    <Input
                      id="foodName"
                      value={aiFormData.foodName}
                      onChange={(e) => setAIFormData({ ...aiFormData, foodName: e.target.value })}
                      placeholder="VD: Gạo tẻ, Thịt heo..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Phân loại *</Label>
                    <Select
                      value={aiFormData.category}
                      onValueChange={(value) => setAIFormData({ ...aiFormData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn phân loại" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Lương thực">Lương thực</SelectItem>
                        <SelectItem value="Thịt">Thịt</SelectItem>
                        <SelectItem value="Hải sản">Hải sản</SelectItem>
                        <SelectItem value="Rau củ quả">Rau củ quả</SelectItem>
                        <SelectItem value="Gia vị">Gia vị</SelectItem>
                        <SelectItem value="Chất đốt">Chất đốt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="unit">Đơn vị tính *</Label>
                    <Select
                      value={aiFormData.unit}
                      onValueChange={(value) => setAIFormData({ ...aiFormData, unit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="gam">gam</SelectItem>
                        <SelectItem value="lít">lít</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="bình">bình</SelectItem>
                        <SelectItem value="hộp">hộp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="quantityPerPerson">Định lượng/người *</Label>
                    <Input
                      id="quantityPerPerson"
                      type="number"
                      step="0.001"
                      value={aiFormData.quantityPerPerson}
                      onChange={(e) => setAIFormData({ ...aiFormData, quantityPerPerson: parseFloat(e.target.value) || 0 })}
                      placeholder="0.000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pricePerUnit">Giá/đơn vị (VNĐ) *</Label>
                    <Input
                      id="pricePerUnit"
                      type="number"
                      value={aiFormData.pricePerUnit}
                      onChange={(e) => setAIFormData({ ...aiFormData, pricePerUnit: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Ghi chú</Label>
                    <Textarea
                      id="notes"
                      value={aiFormData.notes}
                      onChange={(e) => setAIFormData({ ...aiFormData, notes: e.target.value })}
                      placeholder="Mô tả thêm về thực phẩm..."
                      rows={3}
                    />
                  </div>
                </div>
                
                {/* Cost Preview */}
                {aiFormData.quantityPerPerson > 0 && aiFormData.pricePerUnit > 0 && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">💰 Dự tính chi phí</h4>
                    <div className="text-sm text-green-700">
                      <p>Chi phí/người/ngày: <strong>{(aiFormData.quantityPerPerson * aiFormData.pricePerUnit).toLocaleString()}đ</strong></p>
                      <p>Phần trăm so với mức ăn 65,000đ: <strong>{((aiFormData.quantityPerPerson * aiFormData.pricePerUnit / 65000) * 100).toFixed(1)}%</strong></p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setIsAIAssistantOpen(false)}>
                Hủy
              </Button>
              <Button 
                onClick={handleAddNewSupplyItem}
                disabled={!aiFormData.foodName || !aiFormData.category || aiFormData.quantityPerPerson <= 0 || aiFormData.pricePerUnit <= 0}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm nguồn xuất
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
