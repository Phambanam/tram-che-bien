"use client"

import { useState, useEffect } from "react"
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
import { useToast } from "@/hooks/use-toast"
import { menusApi, dishesApi } from "@/lib/api-client"
import { DishTooltip } from "@/components/dish-tooltip"

interface Dish {
  _id: string
  name: string
  description?: string
  mainLTTP?: {
    lttpId: string
    lttpName: string
    category: string
  }
  ingredients: any[]
  servings: number
  preparationTime?: number
  difficulty?: string
  category?: string
}

interface Meal {
  id: string
  type: "morning" | "noon" | "evening"
  dishes: Dish[]
}

interface DailyMenu {
  id: string
  date: string
  mealCount: number
  status: "pending" | "approved"
  meals: Meal[]
}

interface Menu {
  id: string
  week: number
  year: number
  startDate: string
  endDate: string
  status: string
  dailyMenus: DailyMenu[]
}

export function MenuReportContent() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedWeek, setSelectedWeek] = useState<number>(getWeek(new Date(), { locale: vi }))
  const [selectedYear, setSelectedYear] = useState<number>(getYear(new Date()))
  const [isAddDishDialogOpen, setIsAddDishDialogOpen] = useState(false)
  const [isEditDishDialogOpen, setIsEditDishDialogOpen] = useState(false)
  const [isCopyMenuDialogOpen, setIsCopyMenuDialogOpen] = useState(false)
  const [isCreateMenuDialogOpen, setIsCreateMenuDialogOpen] = useState(false)
  const [isCreateDailyMenuDialogOpen, setIsCreateDailyMenuDialogOpen] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState<string>("morning")
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null)
  const [selectedDailyMenuId, setSelectedDailyMenuId] = useState<string | null>(null)
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null)
  
  // Data states
  const [currentMenu, setCurrentMenu] = useState<Menu | null>(null)
  const [availableDishes, setAvailableDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(false)
  
  // Form states
  const [dishForm, setDishForm] = useState({
    dishId: "",
    mealType: "morning",
    notes: ""
  })
  
  const [dailyMenuForm, setDailyMenuForm] = useState({
    mealCount: 100,
    notes: "",
    meals: {
      morning: [] as string[],
      noon: [] as string[],
      evening: [] as string[]
    }
  })
  
  const { toast } = useToast()

  // Calculate week start and end dates
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })

  // Load menu data
  useEffect(() => {
    loadMenuData()
    loadAvailableDishes()
  }, [selectedWeek, selectedYear])

  const loadMenuData = async () => {
    try {
      setLoading(true)
      console.log("Loading menu data for week:", selectedWeek, "year:", selectedYear)
      
      const response = await menusApi.getMenus()
      console.log("Menus response:", response)
      
      // Find menu for current week/year
      const menus = Array.isArray(response) ? response : (response as any)?.data || []
      const menu = menus.find((m: any) => m.week === selectedWeek && m.year === selectedYear)
      
      console.log("Found menu for current week:", menu)
      
      if (menu) {
        // Get detailed menu with daily menus
        const detailedMenu = await menusApi.getMenuById(menu.id)
        console.log("Detailed menu:", detailedMenu.data)
        setCurrentMenu(detailedMenu.data)
      } else {
        console.log("No menu found for current week")
        setCurrentMenu(null)
      }
    } catch (error) {
      console.error("Error loading menu:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu thực đơn",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableDishes = async () => {
    try {
      const response = await dishesApi.getDishes()
      console.log("Available dishes loaded:", response)
      setAvailableDishes(response.data || [])
    } catch (error) {
      console.error("Error loading dishes:", error)
    }
  }

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

  // Create new menu for current week
  const handleCreateMenu = async () => {
    try {
      await menusApi.createMenu({
        week: selectedWeek,
        year: selectedYear,
        startDate: weekStart.toISOString(),
        endDate: weekEnd.toISOString()
      })
      
      toast({
        title: "Thành công",
        description: "Tạo thực đơn tuần mới thành công",
      })
      
      setIsCreateMenuDialogOpen(false)
      loadMenuData()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo thực đơn",
        variant: "destructive",
      })
    }
  }

  // Create new daily menu for selected date
  const handleCreateDailyMenu = async () => {
    if (!currentMenu) {
      toast({
        title: "Lỗi",
        description: "Vui lòng tạo thực đơn tuần trước",
        variant: "destructive",
      })
      return
    }

    try {
      // First create the daily menu
      const dailyMenuResponse = await menusApi.createDailyMenu(currentMenu.id, {
        date: format(selectedDate, "yyyy-MM-dd"),
        mealCount: dailyMenuForm.mealCount,
        notes: dailyMenuForm.notes
      })
      
      console.log("Daily menu created:", dailyMenuResponse)
      
      // Get the updated menu to find the newly created daily menu with meals
      const updatedMenuResponse = await menusApi.getMenuById(currentMenu.id)
      const updatedMenu = updatedMenuResponse.data
      
      const newDailyMenu = updatedMenu.dailyMenus.find((dm: any) => 
        dm.date === format(selectedDate, "yyyy-MM-dd")
      )
      
      console.log("Found new daily menu:", newDailyMenu)
      
      if (newDailyMenu) {
        // Add dishes to each meal sequentially to avoid race conditions
        const addDishPromises: Promise<any>[] = []
        
        // Add dishes to morning meal
        if (dailyMenuForm.meals.morning.length > 0) {
          const morningMeal = newDailyMenu.meals.find((m: any) => m.type === "morning")
          if (morningMeal) {
            console.log("Adding dishes to morning meal:", dailyMenuForm.meals.morning)
            for (const dishId of dailyMenuForm.meals.morning) {
              addDishPromises.push(
                menusApi.addDishToMeal(morningMeal.id, { dishId: dishId })
              )
            }
          }
        }
        
        // Add dishes to noon meal
        if (dailyMenuForm.meals.noon.length > 0) {
          const noonMeal = newDailyMenu.meals.find((m: any) => m.type === "noon")
          if (noonMeal) {
            console.log("Adding dishes to noon meal:", dailyMenuForm.meals.noon)
            for (const dishId of dailyMenuForm.meals.noon) {
              addDishPromises.push(
                menusApi.addDishToMeal(noonMeal.id, { dishId: dishId })
              )
            }
          }
        }
        
        // Add dishes to evening meal
        if (dailyMenuForm.meals.evening.length > 0) {
          const eveningMeal = newDailyMenu.meals.find((m: any) => m.type === "evening")
          if (eveningMeal) {
            console.log("Adding dishes to evening meal:", dailyMenuForm.meals.evening)
            for (const dishId of dailyMenuForm.meals.evening) {
              addDishPromises.push(
                menusApi.addDishToMeal(eveningMeal.id, { dishId: dishId })
              )
            }
          }
        }
        
        // Wait for all dish additions to complete
        if (addDishPromises.length > 0) {
          console.log("Waiting for all dishes to be added...")
          await Promise.all(addDishPromises)
          console.log("All dishes added successfully")
        }
      }
      
      toast({
        title: "Thành công",
        description: "Tạo thực đơn ngày mới thành công",
      })
      
      setIsCreateDailyMenuDialogOpen(false)
      setDailyMenuForm({ mealCount: 100, notes: "", meals: { morning: [], noon: [], evening: [] } })
      
      // Reload menu data after all operations are complete
      await loadMenuData()
    } catch (error: any) {
      console.error("Error creating daily menu:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo thực đơn ngày",
        variant: "destructive",
      })
    }
  }

  // Add dish to meal
  const handleAddDish = async () => {
    if (!dishForm.dishId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn món ăn",
        variant: "destructive",
      })
      return
    }

    // Find the correct meal ID based on current form state
    let mealId = selectedMealId
    if (selectedDailyMenuId) {
      const dailyMenu = currentMenu?.dailyMenus.find(dm => dm.id === selectedDailyMenuId)
      const meal = dailyMenu?.meals.find(m => m.type === dishForm.mealType)
      if (meal) {
        mealId = meal.id
      }
    }

    console.log("Debug - Add dish request:", {
      dishId: dishForm.dishId,
      mealType: dishForm.mealType,
      selectedMealId,
      finalMealId: mealId,
      selectedDailyMenuId
    })

    if (!mealId) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy buổi ăn. Vui lòng thử lại.",
        variant: "destructive",
      })
      return
    }

    try {
      await menusApi.addDishToMeal(mealId, {
        dishId: dishForm.dishId,
        notes: dishForm.notes
      })
      
      toast({
        title: "Thành công",
        description: "Thêm món ăn thành công",
      })
      
      setIsAddDishDialogOpen(false)
      setDishForm({ dishId: "", mealType: "morning", notes: "" })
      setSelectedDailyMenuId(null)
      setSelectedMealId(null)
      loadMenuData()
    } catch (error: any) {
      console.error("Error adding dish:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thêm món ăn",
        variant: "destructive",
      })
    }
  }

  // Remove dish from meal
  const handleRemoveDish = async (mealId: string, dishId: string) => {
    try {
      await menusApi.removeDishFromMeal(mealId, dishId)
      
      toast({
        title: "Thành công",
        description: "Xóa món ăn thành công",
      })
      
      loadMenuData()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa món ăn",
        variant: "destructive",
      })
    }
  }

  // Copy menu from one day to another
  const handleCopyMenu = async (sourceDailyMenuId: string, targetDate: string) => {
    try {
      await menusApi.copyDailyMenu(sourceDailyMenuId, {
        targetDate: targetDate,
        copyMorning: true,
        copyNoon: true,
        copyEvening: true
      })
      
      toast({
        title: "Thành công",
        description: "Sao chép thực đơn thành công",
      })
      
    setIsCopyMenuDialogOpen(false)
      loadMenuData()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể sao chép thực đơn",
        variant: "destructive",
      })
    }
  }

  // Open add dish dialog
  const openAddDishDialog = (dailyMenuId: string, mealType: string) => {
    // Find the meal ID for this daily menu and meal type
    const dailyMenu = currentMenu?.dailyMenus.find(dm => dm.id === dailyMenuId)
    const meal = dailyMenu?.meals.find(m => m.type === mealType)
    
    if (meal) {
      setSelectedDailyMenuId(dailyMenuId)
      setSelectedMealId(meal.id)
      setDishForm({ dishId: "", mealType, notes: "" })
      setIsAddDishDialogOpen(true)
    } else {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy buổi ăn",
        variant: "destructive",
      })
    }
  }

  // Open add dish dialog from general button (without specific meal)
  const openGeneralAddDishDialog = () => {
    // Find today's daily menu
    const todayMenu = currentMenu?.dailyMenus.find(dm => dm.date === format(selectedDate, "yyyy-MM-dd"))
    
    if (todayMenu) {
      // Default to morning meal
      const morningMeal = todayMenu.meals.find(m => m.type === "morning")
      if (morningMeal) {
        setSelectedDailyMenuId(todayMenu.id)
        setSelectedMealId(morningMeal.id)
        setDishForm({ dishId: "", mealType: "morning", notes: "" })
        setIsAddDishDialogOpen(true)
      } else {
        toast({
          title: "Lỗi",
          description: "Không tìm thấy thực đơn cho ngày này",
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "Lỗi",
        description: "Không có thực đơn cho ngày này. Vui lòng tạo thực đơn trước.",
        variant: "destructive",
      })
    }
  }

  // Get meal type label
  const getMealTypeLabel = (type: string) => {
    switch (type) {
      case "morning": return "Buổi sáng"
      case "noon": return "Buổi trưa"
      case "evening": return "Buổi chiều"
      default: return type
    }
  }

  // Handle dish selection for daily menu creation
  const handleDishSelection = (mealType: "morning" | "noon" | "evening", dishId: string, isSelected: boolean) => {
    setDailyMenuForm(prev => ({
      ...prev,
      meals: {
        ...prev.meals,
        [mealType]: isSelected 
          ? [...prev.meals[mealType], dishId]
          : prev.meals[mealType].filter(id => id !== dishId)
      }
    }))
  }

  // Check if dish is selected for a meal type
  const isDishSelected = (mealType: "morning" | "noon" | "evening", dishId: string) => {
    return dailyMenuForm.meals[mealType].includes(dishId)
  }

  // Select all dishes for a meal type
  const selectAllDishes = (mealType: "morning" | "noon" | "evening") => {
    setDailyMenuForm(prev => ({
      ...prev,
      meals: {
        ...prev.meals,
        [mealType]: availableDishes.map(dish => dish._id)
      }
    }))
  }

  // Clear all dishes for a meal type
  const clearAllDishes = (mealType: "morning" | "noon" | "evening") => {
    setDailyMenuForm(prev => ({
      ...prev,
      meals: {
        ...prev.meals,
        [mealType]: []
      }
    }))
  }

  // Handle meal type change in dish form
  const handleMealTypeChange = (newMealType: string) => {
    if (selectedDailyMenuId) {
      const dailyMenu = currentMenu?.dailyMenus.find(dm => dm.id === selectedDailyMenuId)
      const meal = dailyMenu?.meals.find(m => m.type === newMealType)
      if (meal) {
        setSelectedMealId(meal.id)
      }
    }
    setDishForm({...dishForm, mealType: newMealType})
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
            {!currentMenu && (
              <Button onClick={() => setIsCreateMenuDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo thực đơn tuần
              </Button>
            )}
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
                {loading ? (
                  <div className="text-center py-8">Đang tải dữ liệu...</div>
                ) : !currentMenu ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Chưa có thực đơn cho tuần này</p>
                    <Button onClick={() => setIsCreateMenuDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Tạo thực đơn tuần
                    </Button>
                  </div>
                ) : (
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
                        {currentMenu.dailyMenus.map((dailyMenu) => {
                          const morningMeal = dailyMenu.meals.find(m => m.type === "morning")
                          const noonMeal = dailyMenu.meals.find(m => m.type === "noon")
                          const eveningMeal = dailyMenu.meals.find(m => m.type === "evening")
                          
                          return (
                            <TableRow key={dailyMenu.id}>
                          <TableCell className="font-medium">
                                {format(parseISO(dailyMenu.date), "EEEE", { locale: vi })}
                            <br />
                                <span className="text-xs text-gray-500">
                                  {format(parseISO(dailyMenu.date), "dd/MM/yyyy")}
                                </span>
                          </TableCell>
                              <TableCell>{dailyMenu.mealCount}</TableCell>
                          <TableCell>
                            <ul className="list-disc pl-5">
                                  {morningMeal?.dishes.map((dish, index) => (
                                <li key={index} className="text-sm">
                                      <DishTooltip dish={dish}>
                                        <span className="cursor-help hover:text-blue-600 hover:underline">
                                          {dish.name}
                                        </span>
                                      </DishTooltip>
                                </li>
                              ))}
                            </ul>
                          </TableCell>
                          <TableCell>
                            <ul className="list-disc pl-5">
                                  {noonMeal?.dishes.map((dish, index) => (
                                <li key={index} className="text-sm">
                                      <DishTooltip dish={dish}>
                                        <span className="cursor-help hover:text-blue-600 hover:underline">
                                          {dish.name}
                                        </span>
                                      </DishTooltip>
                                </li>
                              ))}
                            </ul>
                          </TableCell>
                          <TableCell>
                            <ul className="list-disc pl-5">
                                  {eveningMeal?.dishes.map((dish, index) => (
                                <li key={index} className="text-sm">
                                      <DishTooltip dish={dish}>
                                        <span className="cursor-help hover:text-blue-600 hover:underline">
                                          {dish.name}
                                        </span>
                                      </DishTooltip>
                                </li>
                              ))}
                            </ul>
                          </TableCell>
                          <TableCell>
                                <Badge variant={dailyMenu.status === "approved" ? "success" : "outline"}>
                                  {dailyMenu.status === "approved" ? "Đã duyệt" : "Chờ duyệt"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm" onClick={() => setIsCopyMenuDialogOpen(true)}>
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                                  <Button variant="outline" size="sm" onClick={() => openAddDishDialog(dailyMenu.id, "morning")}>
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                          )
                        })}
                    </TableBody>
                  </Table>
                </div>
                )}
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
                <Button className="flex items-center gap-2" onClick={() => openGeneralAddDishDialog()}>
                  <Plus className="h-4 w-4" />
                  Thêm món ăn
                </Button>
              </div>
            </div>

            {currentMenu?.dailyMenus
              .filter((item) => {
                const selectedDateStr = format(selectedDate, "yyyy-MM-dd")
                console.log("Filtering daily menu:", {
                  itemDate: item.date,
                  selectedDateStr,
                  matches: item.date === selectedDateStr
                })
                return item.date === selectedDateStr
              })
              .map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>
                        Thực đơn ngày {format(parseISO(item.date), "dd/MM/yyyy")} ({item.date})
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.status === "approved" ? "success" : "outline"}>
                          {item.status === "approved" ? "Đã duyệt" : "Chờ duyệt"}
                        </Badge>
                        <div className="text-sm font-medium">
                          Số người ăn: <span className="font-bold">{item.mealCount}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {item.meals.map((meal) => (
                        <div key={meal.id} className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">{getMealTypeLabel(meal.type)}</h3>
                            <Button variant="outline" size="sm" onClick={() => openAddDishDialog(item.id, meal.type)}>
                            <Plus className="h-3.5 w-3.5 mr-1" /> Thêm
                          </Button>
                        </div>
                        <ul className="space-y-2">
                            {meal.dishes.map((dish, index) => (
                            <li key={index} className="flex justify-between items-center p-2 border rounded-md">
                                <DishTooltip dish={dish}>
                                  <span className="cursor-help hover:text-blue-600 hover:underline">
                                    {dish.name}
                                  </span>
                                </DishTooltip>
                              <div className="flex gap-1">
                                  <Button variant="ghost" size="sm" onClick={() => handleRemoveDish(meal.id, dish._id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

            {currentMenu?.dailyMenus.filter((item) => {
              const selectedDateStr = format(selectedDate, "yyyy-MM-dd")
              return item.date === selectedDateStr
            }).length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <p className="text-gray-500 mb-4">Không có thực đơn cho ngày này</p>
                  {currentMenu ? (
                    <Button onClick={() => setIsCreateDailyMenuDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Tạo thực đơn ngày
                    </Button>
                  ) : (
                    <Button onClick={() => setIsCreateMenuDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Tạo thực đơn tuần
                    </Button>
                  )}
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
                <Select value={dishForm.mealType} onValueChange={handleMealTypeChange}>
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
                <Label htmlFor="dish-select" className="text-right">
                  Chọn món ăn
                </Label>
                <Select value={dishForm.dishId} onValueChange={(value) => setDishForm({...dishForm, dishId: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Chọn món ăn từ thư viện" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDishes.map((dish) => (
                      <SelectItem key={dish._id} value={dish._id}>
                        {dish.name} {dish.mainLTTP && `(${dish.mainLTTP.lttpName})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dish-notes" className="text-right">
                  Ghi chú
                </Label>
                <Textarea 
                  id="dish-notes" 
                  className="col-span-3" 
                  value={dishForm.notes}
                  onChange={(e) => setDishForm({...dishForm, notes: e.target.value})}
                  placeholder="Ghi chú về món ăn (tùy chọn)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDishDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" onClick={handleAddDish}>
                Thêm món ăn
              </Button>
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
                      {currentMenu?.dailyMenus.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.date}
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
              <Button type="submit" onClick={() => handleCopyMenu(currentMenu?.dailyMenus[0].id || "", format(selectedDate, "yyyy-MM-dd"))}>
                Sao chép
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog for creating a new menu */}
        <Dialog open={isCreateMenuDialogOpen} onOpenChange={setIsCreateMenuDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo thực đơn tuần mới</DialogTitle>
              <DialogDescription>
                Tạo thực đơn tuần mới cho tuần {selectedWeek}, {selectedYear}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="start-date" className="text-right">
                  Ngày bắt đầu
                </Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {weekStart ? format(weekStart, "PPP", { locale: vi }) : "Chọn ngày"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={weekStart}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="end-date" className="text-right">
                  Ngày kết thúc
                </Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {weekEnd ? format(weekEnd, "PPP", { locale: vi }) : "Chọn ngày"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={weekEnd}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateMenuDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" onClick={handleCreateMenu}>
                Tạo thực đơn
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog for creating a new daily menu */}
        <Dialog open={isCreateDailyMenuDialogOpen} onOpenChange={setIsCreateDailyMenuDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo thực đơn ngày mới</DialogTitle>
              <DialogDescription>
                Tạo thực đơn cho ngày {selectedDate && format(selectedDate, "dd/MM/yyyy", { locale: vi })}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="daily-date" className="text-right">
                  Ngày
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
                <Label htmlFor="meal-count" className="text-right">
                  Số người ăn
                </Label>
                <Input 
                  id="meal-count" 
                  className="col-span-3" 
                  type="number"
                  value={dailyMenuForm.mealCount}
                  onChange={(e) => setDailyMenuForm({...dailyMenuForm, mealCount: parseInt(e.target.value) || 0})}
                  placeholder="Nhập số người ăn"
                />
              </div>
              
              {/* Meal Selection Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Chọn món ăn cho từng buổi</h3>
                
                {/* Morning Meal */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-orange-600">🌅 Buổi sáng</h4>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => selectAllDishes("morning")}>
                        Chọn tất cả
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => clearAllDishes("morning")}>
                        Bỏ chọn
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-3">
                    {availableDishes.map((dish) => (
                      <div key={`morning-${dish._id}`} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`morning-${dish._id}`}
                          checked={isDishSelected("morning", dish._id)}
                          onChange={(e) => handleDishSelection("morning", dish._id, e.target.checked)}
                          className="rounded"
                        />
                        <DishTooltip dish={dish}>
                          <Label htmlFor={`morning-${dish._id}`} className="text-sm cursor-pointer hover:text-blue-600">
                            {dish.name}
                          </Label>
                        </DishTooltip>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500">
                    Đã chọn: {dailyMenuForm.meals.morning.length} món
                  </div>
                </div>

                {/* Noon Meal */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-yellow-600">☀️ Buổi trưa</h4>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => selectAllDishes("noon")}>
                        Chọn tất cả
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => clearAllDishes("noon")}>
                        Bỏ chọn
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-3">
                    {availableDishes.map((dish) => (
                      <div key={`noon-${dish._id}`} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`noon-${dish._id}`}
                          checked={isDishSelected("noon", dish._id)}
                          onChange={(e) => handleDishSelection("noon", dish._id, e.target.checked)}
                          className="rounded"
                        />
                        <DishTooltip dish={dish}>
                          <Label htmlFor={`noon-${dish._id}`} className="text-sm cursor-pointer hover:text-blue-600">
                            {dish.name}
                          </Label>
                        </DishTooltip>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500">
                    Đã chọn: {dailyMenuForm.meals.noon.length} món
                  </div>
                </div>

                {/* Evening Meal */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-blue-600">🌙 Buổi chiều</h4>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => selectAllDishes("evening")}>
                        Chọn tất cả
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => clearAllDishes("evening")}>
                        Bỏ chọn
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-3">
                    {availableDishes.map((dish) => (
                      <div key={`evening-${dish._id}`} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`evening-${dish._id}`}
                          checked={isDishSelected("evening", dish._id)}
                          onChange={(e) => handleDishSelection("evening", dish._id, e.target.checked)}
                          className="rounded"
                        />
                        <DishTooltip dish={dish}>
                          <Label htmlFor={`evening-${dish._id}`} className="text-sm cursor-pointer hover:text-blue-600">
                            {dish.name}
                          </Label>
                        </DishTooltip>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500">
                    Đã chọn: {dailyMenuForm.meals.evening.length} món
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="daily-notes" className="text-right">
                  Ghi chú
                </Label>
                <Textarea 
                  id="daily-notes" 
                  className="col-span-3" 
                  value={dailyMenuForm.notes}
                  onChange={(e) => setDailyMenuForm({...dailyMenuForm, notes: e.target.value})}
                  placeholder="Ghi chú cho thực đơn ngày (tùy chọn)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsCreateDailyMenuDialogOpen(false)
                setDailyMenuForm({ mealCount: 100, notes: "", meals: { morning: [], noon: [], evening: [] } })
              }}>
                Hủy
              </Button>
              <Button type="submit" onClick={handleCreateDailyMenu}>
                Tạo thực đơn ngày
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
