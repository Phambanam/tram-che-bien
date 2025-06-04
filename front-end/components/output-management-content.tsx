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
import { format, startOfWeek, addDays, isSameDay, getWeek, getYear } from "date-fns"
import { vi } from "date-fns/locale"
import { useToast } from "@/components/ui/use-toast"
import { unitsApi, dailyRationsApi, categoriesApi, menuPlanningApi } from "@/lib/api-client"
import { useAuth } from "@/components/auth/auth-provider"

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
  categoryId: string
  categoryName: string
  quantityPerPerson: number // Always 1
  unit: string
  pricePerUnit: number
  totalCostPerPerson: number
  notes?: string
}

interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  itemCount?: number
}

// New interface for ingredient summaries
interface IngredientSummary {
  lttpId: string
  lttpName: string
  unit: string
  totalQuantity: number
  category: string
  usedInDishes: string[]
}

interface DailyIngredientSummary {
  date: string
  dayName: string
  mealCount: number
  ingredients: (IngredientSummary & { stt: number })[]
  totalIngredientTypes: number
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
  // Additional fields for ingredient summaries
  sourceDate?: string
  dayName?: string
  usedInDishes?: string[]
  baseTotalQuantity?: number
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
  const [totalPersonnelInput, setTotalPersonnelInput] = useState<number>(0) // Tổng số người ăn do TLT nhập
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isEditTotalPersonnelDialogOpen, setIsEditTotalPersonnelDialogOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<{ unitId: string; unitName: string; personnel: number } | null>(null)
  const [newPersonnelCount, setNewPersonnelCount] = useState<number>(0)
  const [newTotalPersonnelCount, setNewTotalPersonnelCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  
  // New state for ingredient summaries
  const [ingredientSummaries, setIngredientSummaries] = useState<DailyIngredientSummary[]>([])
  const [loadingIngredients, setLoadingIngredients] = useState(false)
  const [dataSource, setDataSource] = useState<"ingredients" | "dailyrations">("ingredients")
  
  // AI Assistant states
  // const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false)
  // const [aiFormData, setAIFormData] = useState({
  //   foodName: "",
  //   category: "",
  //   unit: "kg",
  //   quantityPerPerson: 0,
  //   pricePerUnit: 0,
  //   notes: ""
  // })
  const [aiSuggestions, setAISuggestions] = useState<string[]>([])
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false)
  
  const { toast } = useToast()
  const { user } = useAuth()

  // Filter units based on user role
  const getVisibleUnits = () => {
    if (!user) return []
    
    // Admin and brigade assistant can see all units
    if (user.role === 'admin' || user.role === 'brigadeAssistant') {
      return units
    }
    
    // Unit assistant can only see their own unit
    if (user.role === 'unitAssistant' && user.unit) {
      return units.filter(unit => unit._id === user.unit?.id)
    }
    
    // Commander can see all units (read-only)
    if (user.role === 'commander') {
      return units
    }
    
    return []
  }

  // Check if user can edit personnel for a specific unit
  const canEditUnitPersonnel = (unitId: string) => {
    if (!user) return false
    
    // Admin and brigade assistant can edit all units
    if (user.role === 'admin' || user.role === 'brigadeAssistant') {
      return true
    }
    
    // Unit assistant can only edit their own unit
    if (user.role === 'unitAssistant' && user.unit) {
      return unitId === user.unit.id
    }
    
    // Commander cannot edit
    return false
  }

  const visibleUnits = getVisibleUnits()

  // Get week days starting from Monday
  const getWeekDays = (date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 }) // Monday = 1
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }

  const weekDays = getWeekDays(selectedDate)
  const dayNames = ["Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy", "Chủ nhật"]

  // Fetch ingredient summaries from menu planning API
  const fetchIngredientSummaries = async () => {
    try {
      setLoadingIngredients(true)
      
      const params: any = {
        week: getWeek(selectedDate, { locale: vi }),
        year: getYear(selectedDate),
        showAllDays: selectedView === "week"
      }
      
      if (selectedView === "day") {
        params.date = format(selectedDate, "yyyy-MM-dd")
      }
      
      const response = await menuPlanningApi.getDailyIngredientSummaries(params)
      console.log("Ingredient summaries for supply output:", response)
      
      if (response.success) {
        setIngredientSummaries(response.data || [])
        return response.data || []
      } else {
        setIngredientSummaries([])
        return []
      }
    } catch (error) {
      console.error("Error fetching ingredient summaries:", error)
      setIngredientSummaries([])
      return []
    } finally {
      setLoadingIngredients(false)
    }
  }

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

      // Load total personnel for current date if day view
      if (selectedView === "day") {
        try {
          const totalPersonnelResponse = await unitsApi.getTotalPersonnel(format(selectedDate, "yyyy-MM-dd"))
          if (totalPersonnelResponse.success && totalPersonnelResponse.data.exists) {
            setTotalPersonnelInput(totalPersonnelResponse.data.totalPersonnel)
          }
        } catch (error) {
          console.log("No total personnel data for current date")
        }
      }

      // Fetch daily rations (for fallback)
      const dailyRationsResponse = await dailyRationsApi.getDailyRations()
      const dailyRationsData = Array.isArray(dailyRationsResponse) ? dailyRationsResponse : (dailyRationsResponse as any).data || []
      setDailyRations(dailyRationsData)

      // Fetch categories
      const categoriesResponse = await categoriesApi.getCategories()
      const categoriesData = Array.isArray(categoriesResponse) ? categoriesResponse : (categoriesResponse as any).data || []
      setCategories(categoriesData)

      // Fetch ingredient summaries and generate supply output data
      const ingredientData = await fetchIngredientSummaries()
      
      if (ingredientData.length > 0) {
        setDataSource("ingredients")
        // Call generateSupplyOutputFromIngredients after units state is updated
        setTimeout(() => {
          generateSupplyOutputFromIngredients(ingredientData, getVisibleUnits(), personnelData)
        }, 0)
      } else {
        // Fallback to daily rations if no ingredient data
        setDataSource("dailyrations")
        setTimeout(() => {
          generateSupplyOutputData(dailyRationsData, getVisibleUnits(), personnelData, selectedDate, selectedView)
        }, 0)
        toast({
          title: "Thông báo",
          description: "Không có dữ liệu thực đơn. Hiển thị dữ liệu định mức cơ bản.",
          variant: "default",
        })
      }

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

  // Generate supply output data from ingredient summaries
  const generateSupplyOutputFromIngredients = (ingredientData: DailyIngredientSummary[], unitsData: Unit[], personnelData: UnitPersonnelData) => {
    const outputData: SupplyOutputData[] = []
    
    // Filter ingredient data based on selected view and date
    let filteredIngredientData = ingredientData
    
    if (selectedView === "day") {
      // For day view, only show ingredients for the selected date
      const selectedDateStr = format(selectedDate, "yyyy-MM-dd")
      filteredIngredientData = ingredientData.filter(dailySummary => dailySummary.date === selectedDateStr)
    }
    // For week view, show all available days
    
    filteredIngredientData.forEach((dailySummary) => {
      dailySummary.ingredients.forEach((ingredient) => {
        const unitRequirements: { [unitId: string]: { personnel: number; requirement: number } } = {}
        let totalAmount = ingredient.totalQuantity
        
        // Calculate requirements per unit based on their personnel
        unitsData.forEach((unit) => {
          const personnel = personnelData[unit._id] || 0
          const totalPeople = totalPersonnelInput > 0 ? totalPersonnelInput : unitsData.reduce((sum, u) => sum + (personnelData[u._id] || 0), 0)
          
          // Distribute total quantity proportionally based on unit size
          const proportionalRequirement = totalPeople > 0 
            ? (ingredient.totalQuantity * personnel) / totalPeople 
            : 0
          
          unitRequirements[unit._id] = {
            personnel,
            requirement: proportionalRequirement
          }
        })

        // Estimate price per unit (using default daily ration prices as reference)
        const defaultPrice = 15000 // Default price per kg if no match found
        const matchingRation = dailyRations.find(ration => 
          ration.name.toLowerCase().includes(ingredient.lttpName.toLowerCase()) ||
          ingredient.lttpName.toLowerCase().includes(ration.name.toLowerCase())
        )
        const pricePerUnit = matchingRation?.pricePerUnit || defaultPrice
        
        const totalCost = totalAmount * pricePerUnit
        
        // For day view, don't show date in name since it's obvious
        // For week view, show date for clarity
        const displayName = selectedView === "day" 
          ? ingredient.lttpName
          : `${ingredient.lttpName} (${dailySummary.dayName} - ${format(new Date(dailySummary.date), "dd/MM/yyyy")})`
        
        // Use input total personnel or calculated total
        const effectiveTotalPersonnel = totalPersonnelInput > 0 ? totalPersonnelInput : unitsData.reduce((sum, u) => sum + (personnelData[u._id] || 0), 0)
        
        outputData.push({
          id: `${dailySummary.date}-${ingredient.lttpId}`,
          foodName: displayName,
          category: ingredient.category,
          unit: ingredient.unit,
          quantityPerPerson: effectiveTotalPersonnel > 0 ? ingredient.totalQuantity / effectiveTotalPersonnel : 0,
          pricePerUnit,
          units: unitRequirements,
          totalPersonnel: effectiveTotalPersonnel,
          totalCost,
          totalAmount,
          sourceDate: dailySummary.date,
          dayName: dailySummary.dayName,
          usedInDishes: ingredient.usedInDishes,
          baseTotalQuantity: ingredient.totalQuantity
        })
      })
    })
    
    // Sort by date then by ingredient name
    outputData.sort((a, b) => {
      if (a.sourceDate !== b.sourceDate) {
        return (a.sourceDate || "").localeCompare(b.sourceDate || "")
      }
      return a.foodName.localeCompare(b.foodName)
    })
    
    setSupplyData(outputData)
  }

  // Generate supply output data based on daily rations and units (FALLBACK)
  const generateSupplyOutputData = (rations: DailyRation[], unitsData: Unit[], personnelData: UnitPersonnelData, selectedDate?: Date, selectedView?: "day" | "week") => {
    // Simulate day-specific data variations
    const dateModifier = selectedDate ? selectedDate.getDay() : 1 // Monday = 1, Sunday = 0
    const isWeekView = selectedView === "week"
    
    const outputData: SupplyOutputData[] = rations.map((ration, index) => {
      const unitRequirements: { [unitId: string]: { personnel: number; requirement: number } } = {}
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

      visibleUnits.forEach((unit) => {
        const personnel = personnelData[unit._id] || 0
        const baseRequirement = personnel * ration.quantityPerPerson
        const adjustedRequirement = baseRequirement * dayMultiplier
        
        unitRequirements[unit._id] = {
          personnel,
          requirement: adjustedRequirement
        }
        
        totalAmount += adjustedRequirement
      })

      const totalCost = totalAmount * ration.pricePerUnit
      
      // Use input total personnel or calculated total
      const effectiveTotalPersonnel = totalPersonnelInput > 0 ? totalPersonnelInput : visibleUnits.reduce((sum, unit) => sum + (personnelData[unit._id] || 0), 0)

      return {
        id: ration._id,
        foodName: ration.name,
        category: ration.categoryName,
        unit: ration.unit,
        quantityPerPerson: ration.quantityPerPerson * dayMultiplier,
        pricePerUnit: ration.pricePerUnit,
        units: unitRequirements,
        totalPersonnel: effectiveTotalPersonnel,
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
  const handleDateSelect = async (date: Date, view: "day" | "week") => {
    setSelectedDate(date)
    setSelectedView(view)
    setIsLoading(true)
    
    try {
      // Fetch ingredient summaries for the new date/view
      const params: any = {
        week: getWeek(date, { locale: vi }),
        year: getYear(date),
        showAllDays: view === "week"
      }
      
      if (view === "day") {
        params.date = format(date, "yyyy-MM-dd")
      }
      
      const ingredientResponse = await menuPlanningApi.getDailyIngredientSummaries(params)
      const ingredientData = ingredientResponse.success ? (ingredientResponse.data || []) : []
      setIngredientSummaries(ingredientData)
      
      // Load total personnel for the selected date
      if (view === "day") {
        try {
          const totalPersonnelResponse = await unitsApi.getTotalPersonnel(format(date, "yyyy-MM-dd"))
          if (totalPersonnelResponse.success && totalPersonnelResponse.data.exists) {
            setTotalPersonnelInput(totalPersonnelResponse.data.totalPersonnel)
          } else {
            setTotalPersonnelInput(0) // Reset if no data for this date
          }
        } catch (error) {
          console.log("No total personnel data for this date")
          setTotalPersonnelInput(0)
        }
      } else {
        setTotalPersonnelInput(0) // Reset for week view
      }
      
      // Generate supply output data
      if (ingredientData.length > 0) {
        setDataSource("ingredients")
        generateSupplyOutputFromIngredients(ingredientData, visibleUnits, unitPersonnel)
      } else {
        setDataSource("dailyrations")
        generateSupplyOutputData(dailyRations, visibleUnits, unitPersonnel, date, view)
        if (view === "day") {
          toast({
            title: "Thông báo",
            description: "Không có dữ liệu thực đơn cho ngày này. Hiển thị dữ liệu định mức cơ bản.",
            variant: "default",
          })
        }
      }
    } catch (error) {
      console.error("Error loading data for selected date:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu cho ngày được chọn",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle personnel count edit
  const handleEditPersonnel = (unitId: string, unitName: string, currentPersonnel: number) => {
    setEditingUnit({ unitId, unitName, personnel: currentPersonnel })
    setNewPersonnelCount(currentPersonnel)
    setIsEditDialogOpen(true)
  }

  // Save personnel count changes
  const handleSavePersonnelCount = async () => {
    if (editingUnit) {
      try {
        // Call API to update unit personnel in backend
        await unitsApi.updateUnitPersonnel(editingUnit.unitId, newPersonnelCount)

        const updatedPersonnel = { ...unitPersonnel }
        updatedPersonnel[editingUnit.unitId] = newPersonnelCount

        setUnitPersonnel(updatedPersonnel)
        
        // Regenerate supply data with new personnel counts
        if (dataSource === "ingredients" && ingredientSummaries.length > 0) {
          generateSupplyOutputFromIngredients(ingredientSummaries, visibleUnits, updatedPersonnel)
        } else {
          generateSupplyOutputData(dailyRations, visibleUnits, updatedPersonnel, selectedDate, selectedView)
        }
        
        toast({
          title: "Thành công",
          description: `Đã cập nhật số người ăn cho ${editingUnit.unitName} thành ${newPersonnelCount}`,
        })
      } catch (error) {
        console.error("Error updating unit personnel:", error)
        toast({
          title: "Lỗi",
          description: "Không thể cập nhật số người ăn. Vui lòng thử lại.",
          variant: "destructive",
        })
        return // Don't close dialog if there's an error
      }
    }
    setIsEditDialogOpen(false)
    setEditingUnit(null)
  }

  // Handle total personnel edit
  const handleEditTotalPersonnel = () => {
    const currentTotal = totalPersonnelInput > 0 ? totalPersonnelInput : visibleUnits.reduce((sum, unit) => sum + (unitPersonnel[unit._id] || 0), 0)
    setNewTotalPersonnelCount(currentTotal)
    setIsEditTotalPersonnelDialogOpen(true)
  }

  // Save total personnel count changes
  const handleSaveTotalPersonnelCount = async () => {
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd")
      
      // Save to backend
      await unitsApi.updateTotalPersonnel(dateStr, newTotalPersonnelCount)
      
      // Update frontend state
      setTotalPersonnelInput(newTotalPersonnelCount)
      
      // Regenerate supply data with new total personnel count
      if (dataSource === "ingredients" && ingredientSummaries.length > 0) {
        generateSupplyOutputFromIngredients(ingredientSummaries, visibleUnits, unitPersonnel)
      } else {
        generateSupplyOutputData(dailyRations, visibleUnits, unitPersonnel, selectedDate, selectedView)
      }
      
      toast({
        title: "Thành công",
        description: `Đã cập nhật tổng số người ăn thành ${newTotalPersonnelCount} cho ngày ${format(selectedDate, "dd/MM/yyyy")}`,
      })
      
      setIsEditTotalPersonnelDialogOpen(false)
    } catch (error) {
      console.error("Error saving total personnel:", error)
      toast({
        title: "Lỗi",
        description: "Không thể lưu tổng số người ăn. Vui lòng thử lại.",
        variant: "destructive",
      })
    }
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
              <div>
                <CardTitle>
                  📊 Bảng chính - {selectedView === "week" ? "Tổng cả tuần" : `${dayNames[weekDays.findIndex(day => isSameDay(day, selectedDate))]}`}
                </CardTitle>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant={dataSource === "ingredients" ? "default" : "secondary"} className="text-xs">
                    {dataSource === "ingredients" ? "📋 Từ thực đơn" : "📝 Từ định mức"}
                  </Badge>
                  {dataSource === "ingredients" && (
                    <span className="text-xs text-gray-600">
                      {loadingIngredients ? "Đang tải..." : 
                        selectedView === "day" 
                          ? `${supplyData.length} nguyên liệu cho ngày được chọn`
                          : `${ingredientSummaries.length} ngày có thực đơn`
                      }
                    </span>
                  )}
                  {dataSource === "ingredients" && selectedView === "day" && (
                    <span className="text-xs text-blue-600 font-medium">
                      📅 {format(selectedDate, "dd/MM/yyyy")}
                    </span>
                  )}
                  {dataSource === "ingredients" && selectedView === "week" && (
                    <span className="text-xs text-green-600 font-medium">
                      📅 Tuần {getWeek(selectedDate, { locale: vi })}/{getYear(selectedDate)}
                    </span>
                  )}
                  {user && user.role === 'unitAssistant' && (
                    <span className="text-xs text-blue-600 font-medium">
                      👤 Hiển thị dữ liệu của: {user.unit?.name || 'đơn vị của bạn'}
                    </span>
                  )}
                </div>
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
              </CardHeader>
              <CardContent>
            <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                    <TableHead className="w-12">STT</TableHead>
                    <TableHead className="min-w-[200px]">
                      {dataSource === "ingredients" ? "Nguyên liệu" : "Tên thực phẩm"}
                    </TableHead>
                    <TableHead>Phân loại</TableHead>
                    <TableHead>ĐVT</TableHead>
                    <TableHead className="min-w-[120px]">Định lượng</TableHead>
                    {dataSource === "ingredients" && (
                      <TableHead className="min-w-[150px]">Dùng trong món</TableHead>
                    )}
                    {visibleUnits.map((unit) => (
                      <TableHead key={`${unit._id}-personnel`} className="text-center bg-blue-50">
                        <div className="flex flex-col">
                          <span className="font-medium">{unit.name}</span>
                          <span className="text-xs text-gray-500">Số người ăn</span>
                        </div>
                      </TableHead>
                    ))}
                    {visibleUnits.map((unit) => (
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
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{item.foodName}</span>
                          {dataSource === "ingredients" && selectedView === "week" && item.sourceDate && (
                            <span className="text-xs text-blue-600">
                              {format(new Date(item.sourceDate), "dd/MM")} - {item.dayName}
                            </span>
                          )}
                        </div>
                      </TableCell>
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
                        <TableCell>
                        <div className="flex flex-col items-center">
                          <span className="font-medium">
                            {item.quantityPerPerson.toFixed(3)}/người
                          </span>
                          {dataSource === "ingredients" && item.baseTotalQuantity && (
                            <span className="text-xs text-gray-600">
                              Tổng: {item.baseTotalQuantity.toFixed(1)} {item.unit}
                            </span>
                          )}
                        </div>
                        </TableCell>
                      {dataSource === "ingredients" && (
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {item.usedInDishes && item.usedInDishes.map((dish, dishIndex) => (
                              <Badge key={dishIndex} variant="outline" className="text-xs">
                                {dish}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      )}
                      
                      {/* Personnel columns */}
                      {visibleUnits.map((unit) => (
                        <TableCell key={`${unit._id}-personnel`} className="text-center bg-blue-50">
                          {canEditUnitPersonnel(unit._id) ? (
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
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{unitPersonnel[unit._id] || 0}</span>
                          </div>
                          )}
                        </TableCell>
                      ))}
                      
                      {/* Requirement columns */}
                      {visibleUnits.map((unit) => (
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
                    <TableCell colSpan={dataSource === "ingredients" ? 6 : 5} className="text-center">TỔNG CỘNG</TableCell>
                    {visibleUnits.map((unit) => (
                      <TableCell key={`${unit._id}-total-personnel`} className="text-center bg-blue-100">
                        {unitPersonnel[unit._id] || 0}
                      </TableCell>
                    ))}
                    {visibleUnits.map((unit) => (
                      <TableCell key={`${unit._id}-total-requirement`} className="text-center bg-green-100">
                        {supplyData.reduce((sum, item) => sum + (item.units[unit._id]?.requirement || 0), 0).toFixed(3)}
                      </TableCell>
                    ))}
                    <TableCell className="text-center bg-yellow-100">
                      {totalPersonnelInput > 0 ? totalPersonnelInput : visibleUnits.reduce((sum, unit) => sum + (unitPersonnel[unit._id] || 0), 0)}
                      {(user?.role === 'admin' || user?.role === 'brigadeAssistant' || user?.role === 'unitAssistant') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 h-auto p-1 hover:bg-yellow-200"
                          onClick={handleEditTotalPersonnel}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
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
              {dataSource === "ingredients" ? (
                <>
                  <p>
                    <strong>📋 Dữ liệu từ thực đơn:</strong> Tên nguyên liệu hiển thị theo thực đơn đã lập. 
                    {selectedView === "day" ? 
                      `Hiển thị nguyên liệu cho ngày ${format(selectedDate, "dd/MM/yyyy")} đã chọn.` :
                      "Hiển thị nguyên liệu cho tất cả ngày trong tuần có thực đơn."
                    }
                  </p>
                  <p>
                    <strong>📊 Định lượng:</strong> Hiển thị cả định lượng trên người (kg/người) và tổng số lượng cần chuẩn bị. 
                    Số lượng được tính toán từ các món ăn trong thực đơn và số người ăn thực tế.
                  </p>
                  <p>
                    <strong>🍽️ Món ăn sử dụng:</strong> Hiển thị các món ăn trong thực đơn có sử dụng nguyên liệu này.
                    Giúp đầu bếp biết được nguyên liệu sẽ dùng cho món nào.
                  </p>
                  <p>
                    <strong>⚡ Tự động cập nhật:</strong> Dữ liệu được cập nhật tự động từ thực đơn đã lập. 
                    Khi thay đổi thực đơn, danh sách nguyên liệu sẽ được điều chỉnh tương ứng.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>Chú ý:</strong> Hiển thị dữ liệu định mức cơ bản do chưa có thực đơn cho thời gian được chọn. 
                    Vui lòng lập thực đơn để có dữ liệu nguyên liệu chính xác.
                  </p>
                  <p>
                    <strong>Định mức:</strong> Áp dụng mức ăn 65.000đ/người/ngày với phân loại không vượt quá định mức theo quy định.
                  </p>
                </>
              )}
              <p>
                Từ số lượng người ăn của từng đơn vị, nhu cầu sẽ bằng định lượng nhân với số người và đây cũng là số lượng cấp cho các đơn vị 
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

        {/* Edit Total Personnel Dialog */}
        <Dialog open={isEditTotalPersonnelDialogOpen} onOpenChange={setIsEditTotalPersonnelDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chỉnh sửa tổng số người ăn</DialogTitle>
              <DialogDescription>
                Cập nhật tổng số người ăn cho tất cả đơn vị
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tổng số người ăn:</label>
                <Input
                  type="number"
                  value={newTotalPersonnelCount}
                  onChange={(e) => setNewTotalPersonnelCount(parseInt(e.target.value) || 0)}
                  min="0"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tổng hiện tại từ các đơn vị: {visibleUnits.reduce((sum, unit) => sum + (unitPersonnel[unit._id] || 0), 0)} người
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditTotalPersonnelDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSaveTotalPersonnelCount}>
                Lưu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
