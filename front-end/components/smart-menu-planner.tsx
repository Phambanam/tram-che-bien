"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/components/ui/use-toast"
import { 
  CalendarIcon, 
  Package, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  ChefHat,
  TrendingUp,
  Search,
  Filter,
  Lightbulb,
  BarChart3
} from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { unitsApi, dishesApi, dailyRationsApi, processingStationApi } from "@/lib/api-client"

interface SmartMenuSuggestion {
  dishId: string
  dishName: string
  priority: "high" | "medium" | "low"
  reason: string
  ingredients: {
    lttpId: string
    lttpName: string
    requiredQuantity: number
    availableQuantity: number
    unit: string
    daysUntilExpiry: number
    status: "sufficient" | "insufficient" | "expiring_soon" | "expired"
  }[]
  estimatedCost: number
  suitableForUnits: string[]
}

interface InventoryAlert {
  productId: string
  productName: string
  currentStock: number
  daysUntilExpiry: number
  alertLevel: "critical" | "warning" | "info"
  recommendedAction: string
}

interface DailyMenuPlan {
  date: string
  totalPersonnel: number
  meals: {
    morning: SmartMenuSuggestion[]
    noon: SmartMenuSuggestion[]
    evening: SmartMenuSuggestion[]
  }
  totalCost: number
  budgetStatus: "under" | "within" | "over"
}

// Menu Planning API Functions
const menuPlanningApi = {
  async getMenuSuggestions() {
    const response = await fetch("/api/menu-planning/suggestions", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem('token')}`,
      },
    })
    if (!response.ok) {
      throw new Error("Failed to fetch menu suggestions")
    }
    return response.json()
  },

  async getInventoryAlerts() {
    const response = await fetch("/api/menu-planning/alerts", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem('token')}`,
      },
    })
    if (!response.ok) {
      throw new Error("Failed to fetch inventory alerts")
    }
    return response.json()
  },

  async generateDailyPlan(date: string) {
    const response = await fetch("/api/menu-planning/daily-plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ date }),
    })
    if (!response.ok) {
      throw new Error("Failed to generate daily plan")
    }
    return response.json()
  },

  async getOverview() {
    const response = await fetch("/api/menu-planning/overview", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem('token')}`,
      },
    })
    if (!response.ok) {
      throw new Error("Failed to fetch overview")
    }
    return response.json()
  }
}

export function SmartMenuPlanner() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [units, setUnits] = useState<any[]>([])
  const [dishes, setDishes] = useState<any[]>([])
  const [dailyRations, setDailyRations] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [menuSuggestions, setMenuSuggestions] = useState<SmartMenuSuggestion[]>([])
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>([])
  const [dailyMenuPlan, setDailyMenuPlan] = useState<DailyMenuPlan | null>(null)
  const [overviewData, setOverviewData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  
  const { toast } = useToast()

  // Fetch all required data using backend APIs
  const fetchData = async () => {
    setIsLoading(true)
    try {
      // First try to get overview data from backend
      const overviewRes = await menuPlanningApi.getOverview()
      setOverviewData(overviewRes.data)
      setMenuSuggestions(overviewRes.data.suggestions || [])
      setInventoryAlerts(overviewRes.data.alerts || [])

      // Also fetch individual data for display
      const [unitsRes, dishesRes, rationsRes, inventoryRes] = await Promise.all([
        unitsApi.getUnits(),
        dishesApi.getDishes(),
        dailyRationsApi.getDailyRations(),
        processingStationApi.getFoodInventory()
      ])

      const unitsData = Array.isArray(unitsRes) ? unitsRes : (unitsRes as any).data || []
      const dishesData = Array.isArray(dishesRes) ? dishesRes : (dishesRes as any).data || []
      const rationsData = Array.isArray(rationsRes) ? rationsRes : (rationsRes as any).data || []
      const inventoryData = Array.isArray(inventoryRes) ? inventoryRes : (inventoryRes as any).data || []

      setUnits(unitsData)
      setDishes(dishesData)
      setDailyRations(rationsData)
      setInventory(inventoryData)

      toast({
        title: "Thành công",
        description: "Đã tải dữ liệu từ hệ thống backend",
        variant: "default",
      })

    } catch (error) {
      console.error("Error fetching data from backend:", error)
      
      // Fallback to sample data for demo purposes
      console.log("Using fallback sample data for Smart Menu Planner")
      
      const sampleUnits = [
        { _id: "1", name: "Tiểu đoàn 1", personnel: 150 },
        { _id: "2", name: "Tiểu đoàn 2", personnel: 180 },
        { _id: "3", name: "Tiểu đoàn 3", personnel: 120 }
      ]
      
      const sampleDishes = [
        { 
          _id: "1", 
          name: "Cơm rang thập cẩm", 
          ingredients: [
            { lttpId: "1", lttpName: "Gạo tẻ", quantity: 0.6, unit: "kg" },
            { lttpId: "2", lttpName: "Thịt heo", quantity: 0.15, unit: "kg" },
            { lttpId: "3", lttpName: "Rau cải", quantity: 0.1, unit: "kg" }
          ]
        },
        { 
          _id: "2", 
          name: "Canh chua cá", 
          ingredients: [
            { lttpId: "4", lttpName: "Cá biển", quantity: 0.2, unit: "kg" },
            { lttpId: "3", lttpName: "Rau cải", quantity: 0.1, unit: "kg" },
            { lttpId: "5", lttpName: "Gia vị", quantity: 0.05, unit: "kg" }
          ]
        },
        { 
          _id: "3", 
          name: "Thịt kho tàu", 
          ingredients: [
            { lttpId: "2", lttpName: "Thịt heo", quantity: 0.3, unit: "kg" },
            { lttpId: "5", lttpName: "Gia vị", quantity: 0.03, unit: "kg" }
          ]
        }
      ]
      
      const sampleRations = [
        { _id: "1", name: "Gạo tẻ", quantityPerPerson: 0.6, unit: "kg", pricePerUnit: 25000, totalCostPerPerson: 15000 },
        { _id: "2", name: "Thịt heo", quantityPerPerson: 0.15, unit: "kg", pricePerUnit: 180000, totalCostPerPerson: 27000 },
        { _id: "3", name: "Rau cải", quantityPerPerson: 0.2, unit: "kg", pricePerUnit: 15000, totalCostPerPerson: 3000 },
        { _id: "4", name: "Cá biển", quantityPerPerson: 0.1, unit: "kg", pricePerUnit: 120000, totalCostPerPerson: 12000 },
        { _id: "5", name: "Gia vị", quantityPerPerson: 0.05, unit: "kg", pricePerUnit: 100000, totalCostPerPerson: 5000 }
      ]
      
      const sampleInventory = [
        { 
          product: { id: "1", name: "Gạo tẻ" }, 
          nonExpiredQuantity: 500, 
          expiredQuantity: 0 
        },
        { 
          product: { id: "2", name: "Thịt heo" }, 
          nonExpiredQuantity: 80, 
          expiredQuantity: 5 
        },
        { 
          product: { id: "3", name: "Rau cải" }, 
          nonExpiredQuantity: 30, 
          expiredQuantity: 0 
        },
        { 
          product: { id: "4", name: "Cá biển" }, 
          nonExpiredQuantity: 25, 
          expiredQuantity: 0 
        },
        { 
          product: { id: "5", name: "Gia vị" }, 
          nonExpiredQuantity: 15, 
          expiredQuantity: 0 
        }
      ]

      const sampleSuggestions: SmartMenuSuggestion[] = [
        {
          dishId: "1",
          dishName: "Cơm rang thập cẩm",
          priority: "high",
          reason: "Thịt heo sắp hết hạn (2 ngày)",
          ingredients: [
            { lttpId: "1", lttpName: "Gạo tẻ", requiredQuantity: 0.6, availableQuantity: 500, unit: "kg", daysUntilExpiry: 30, status: "sufficient" },
            { lttpId: "2", lttpName: "Thịt heo", requiredQuantity: 0.15, availableQuantity: 80, unit: "kg", daysUntilExpiry: 2, status: "expiring_soon" }
          ],
          estimatedCost: 42000,
          suitableForUnits: ["1", "2", "3"]
        },
        {
          dishId: "2",
          dishName: "Canh chua cá",
          priority: "medium",
          reason: "Đủ nguyên liệu, phù hợp chế biến",
          ingredients: [
            { lttpId: "4", lttpName: "Cá biển", requiredQuantity: 0.2, availableQuantity: 25, unit: "kg", daysUntilExpiry: 5, status: "sufficient" }
          ],
          estimatedCost: 24000,
          suitableForUnits: ["1", "2", "3"]
        }
      ]

      const sampleAlerts: InventoryAlert[] = [
        {
          productId: "2",
          productName: "Thịt heo",
          currentStock: 80,
          daysUntilExpiry: 2,
          alertLevel: "critical",
          recommendedAction: "Ưu tiên sử dụng trong 3 ngày tới (80kg)"
        }
      ]
      
      setUnits(sampleUnits)
      setDishes(sampleDishes)
      setDailyRations(sampleRations)
      setInventory(sampleInventory)
      setMenuSuggestions(sampleSuggestions)
      setInventoryAlerts(sampleAlerts)
      
      setOverviewData({
        totalPersonnel: 450,
        totalInventory: 650,
        criticalAlerts: 1,
        totalSuggestions: 2
      })
      
      toast({
        title: "Thông báo",
        description: "Đang sử dụng dữ liệu mẫu để demo. Kiểm tra kết nối backend.",
        variant: "default",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Generate daily menu plan using backend API
  const generateDailyMenuPlan = async () => {
    if (!selectedDate) return
    
    setIsLoading(true)
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd")
      const response = await menuPlanningApi.generateDailyPlan(dateStr)
      setDailyMenuPlan(response.data)
      
      toast({
        title: "Thành công",
        description: "Đã tạo kế hoạch thực đơn từ hệ thống backend",
        variant: "default",
      })
    } catch (error) {
      console.error("Error generating daily plan:", error)
      
      // Fallback plan generation
      if (menuSuggestions.length > 0) {
        const totalPersonnel = overviewData?.totalPersonnel || 450
        const dailyBudget = totalPersonnel * 65000

        const highPriority = menuSuggestions.filter(s => s.priority === "high").slice(0, 2)
        const mediumPriority = menuSuggestions.filter(s => s.priority === "medium").slice(0, 3)
        const lowPriority = menuSuggestions.filter(s => s.priority === "low").slice(0, 3)

        const morningMeals = [...highPriority.slice(0, 1), ...mediumPriority.slice(0, 1)]
        const noonMeals = [...highPriority.slice(1, 2), ...mediumPriority.slice(1, 3)]
        const eveningMeals = [...lowPriority.slice(0, 2)]

        const totalCost = [...morningMeals, ...noonMeals, ...eveningMeals]
          .reduce((sum, meal) => sum + (meal.estimatedCost * totalPersonnel), 0)

        let budgetStatus: "under" | "within" | "over" = "within"
        if (totalCost < dailyBudget * 0.8) budgetStatus = "under"
        else if (totalCost > dailyBudget) budgetStatus = "over"

        setDailyMenuPlan({
          date: format(selectedDate, "yyyy-MM-dd"),
          totalPersonnel,
          meals: { morning: morningMeals, noon: noonMeals, evening: eveningMeals },
          totalCost,
          budgetStatus,
        })

        toast({
          title: "Thông báo",
          description: "Đã tạo kế hoạch thực đơn với dữ liệu mẫu",
          variant: "default",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh suggestions using backend API
  const refreshSuggestions = async () => {
    setIsLoading(true)
    try {
      const [suggestionsRes, alertsRes] = await Promise.all([
        menuPlanningApi.getMenuSuggestions(),
        menuPlanningApi.getInventoryAlerts()
      ])
      
      setMenuSuggestions(suggestionsRes.data || [])
      setInventoryAlerts(alertsRes.data || [])
      
      toast({
        title: "Thành công",
        description: "Đã cập nhật gợi ý từ hệ thống backend",
        variant: "default",
      })
    } catch (error) {
      console.error("Error refreshing suggestions:", error)
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật gợi ý từ backend",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getBadgeVariant = (priority: string) => {
    switch (priority) {
      case "high": return "destructive"
      case "medium": return "default"
      case "low": return "secondary"
      default: return "outline"
    }
  }

  const getAlertColor = (level: string) => {
    switch (level) {
      case "critical": return "text-red-600 bg-red-50"
      case "warning": return "text-yellow-600 bg-yellow-50"
      case "info": return "text-blue-600 bg-blue-50"
      default: return "text-gray-600 bg-gray-50"
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b45f06] mx-auto mb-4"></div>
            <p>Đang phân tích dữ liệu và tạo gợi ý thực đơn...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#b45f06] mb-2">
              HỖ TRỢ LẬP THỰC ĐƠN THÔNG MINH
            </h1>
            <p className="text-gray-600">
              Trợ lý AI cho Quân nhu Lữ đoàn - Tối ưu hóa thực đơn dựa trên tồn kho và hạn sử dụng
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(selectedDate, "dd/MM/yyyy", { locale: vi })}
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
            <Button onClick={fetchData} className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Phân tích lại
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Tổng quân số
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {overviewData?.totalPersonnel?.toLocaleString() || units.reduce((sum, unit) => sum + (unit.personnel || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">người ăn/ngày</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Tồn kho khả dụng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {overviewData?.totalInventory?.toLocaleString() || inventory.reduce((sum, item) => sum + item.nonExpiredQuantity, 0).toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">kg thực phẩm</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Cảnh báo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overviewData?.criticalAlerts || inventoryAlerts.filter(alert => alert.alertLevel === "critical").length}
            </div>
            <p className="text-xs text-gray-500">cấp độ nghiêm trọng</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              Gợi ý món ăn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {overviewData?.totalSuggestions || menuSuggestions.length}
            </div>
            <p className="text-xs text-gray-500">món có thể chế biến</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="suggestions">Gợi ý món ăn</TabsTrigger>
          <TabsTrigger value="alerts">Cảnh báo tồn kho</TabsTrigger>
          <TabsTrigger value="planning">Lập thực đơn</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Menu Plan Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Kế hoạch thực đơn ngày {format(selectedDate, "dd/MM", { locale: vi })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dailyMenuPlan && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Tổng chi phí:</span>
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          {dailyMenuPlan.totalCost.toLocaleString()} đ
                        </div>
                        <Badge 
                          variant={
                            dailyMenuPlan.budgetStatus === "over" ? "destructive" : 
                            dailyMenuPlan.budgetStatus === "under" ? "secondary" : "default"
                          }
                        >
                          {dailyMenuPlan.budgetStatus === "over" ? "Vượt ngân sách" : 
                           dailyMenuPlan.budgetStatus === "under" ? "Dưới ngân sách" : "Trong ngân sách"}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Buổi sáng:</span>
                        <span>{dailyMenuPlan.meals.morning.length} món</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Buổi trưa:</span>
                        <span>{dailyMenuPlan.meals.noon.length} món</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Buổi chiều:</span>
                        <span>{dailyMenuPlan.meals.evening.length} món</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Cảnh báo quan trọng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inventoryAlerts.slice(0, 5).map((alert, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg border ${getAlertColor(alert.alertLevel)}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium">{alert.productName}</span>
                        <Badge variant="outline" className="text-xs">
                          {alert.daysUntilExpiry} ngày
                        </Badge>
                      </div>
                      <p className="text-sm">{alert.recommendedAction}</p>
                    </div>
                  ))}
                  {inventoryAlerts.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      Tất cả tồn kho đang trong tình trạng tốt
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Gợi ý món ăn thông minh
                  </CardTitle>
                  <CardDescription>
                    Các món ăn được đề xuất dựa trên tồn kho hiện tại và hạn sử dụng
                  </CardDescription>
                </div>
                <Button onClick={refreshSuggestions} disabled={isLoading} className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Cập nhật gợi ý
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {menuSuggestions.map((suggestion, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{suggestion.dishName}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">{suggestion.reason}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getBadgeVariant(suggestion.priority)}>
                            {suggestion.priority === "high" ? "Ưu tiên cao" : 
                             suggestion.priority === "medium" ? "Ưu tiên vừa" : "Ưu tiên thấp"}
                          </Badge>
                          <span className="text-sm font-medium">
                            {suggestion.estimatedCost.toLocaleString()}đ/suất
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Nguyên liệu cần thiết:</h4>
                          <div className="space-y-1">
                            {suggestion.ingredients.map((ingredient, idx) => (
                              <div key={idx} className="flex justify-between items-center text-sm">
                                <span>{ingredient.lttpName}</span>
                                <div className="flex items-center gap-2">
                                  <span>{ingredient.requiredQuantity} {ingredient.unit}</span>
                                  <Badge 
                                    variant={
                                      ingredient.status === "sufficient" ? "default" :
                                      ingredient.status === "expiring_soon" ? "destructive" :
                                      ingredient.status === "insufficient" ? "secondary" : "destructive"
                                    }
                                    className="text-xs"
                                  >
                                    {ingredient.status === "sufficient" ? "Đủ" :
                                     ingredient.status === "expiring_soon" ? "Sắp hết hạn" :
                                     ingredient.status === "insufficient" ? "Thiếu" : "Hết hạn"}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Thông tin bổ sung:</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Phù hợp cho:</span>
                              <span>{suggestion.suitableForUnits.length} đơn vị</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Chi phí ước tính:</span>
                              <span className="font-medium">{suggestion.estimatedCost.toLocaleString()}đ</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {menuSuggestions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <ChefHat className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Không có gợi ý món ăn phù hợp với tồn kho hiện tại</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Cảnh báo và khuyến nghị tồn kho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên thực phẩm</TableHead>
                    <TableHead>Tồn kho</TableHead>
                    <TableHead>Hạn sử dụng</TableHead>
                    <TableHead>Mức độ</TableHead>
                    <TableHead>Khuyến nghị</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryAlerts.map((alert, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{alert.productName}</TableCell>
                      <TableCell>{alert.currentStock.toLocaleString()} kg</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {alert.daysUntilExpiry} ngày
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            alert.alertLevel === "critical" ? "destructive" :
                            alert.alertLevel === "warning" ? "default" : "secondary"
                          }
                        >
                          {alert.alertLevel === "critical" ? "Nghiêm trọng" :
                           alert.alertLevel === "warning" ? "Cảnh báo" : "Thông tin"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm">{alert.recommendedAction}</p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {inventoryAlerts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>Tất cả tồn kho đang trong tình trạng tốt</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="planning" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5" />
                  Thực đơn được đề xuất cho ngày {format(selectedDate, "dd/MM/yyyy", { locale: vi })}
                </CardTitle>
                <Button onClick={generateDailyMenuPlan} disabled={isLoading} className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Tạo kế hoạch thực đơn
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {dailyMenuPlan ? (
                <div className="space-y-6">
                  {/* Budget Overview */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {dailyMenuPlan.totalPersonnel.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">Tổng quân số</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {dailyMenuPlan.totalCost.toLocaleString()}đ
                        </div>
                        <div className="text-sm text-gray-600">Tổng chi phí</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {Math.round(dailyMenuPlan.totalCost / dailyMenuPlan.totalPersonnel).toLocaleString()}đ
                        </div>
                        <div className="text-sm text-gray-600">Chi phí/người</div>
                      </div>
                    </div>
                  </div>

                  {/* Meals by time */}
                  {[
                    { key: "morning", name: "Buổi sáng", meals: dailyMenuPlan.meals.morning },
                    { key: "noon", name: "Buổi trưa", meals: dailyMenuPlan.meals.noon },
                    { key: "evening", name: "Buổi chiều", meals: dailyMenuPlan.meals.evening },
                  ].map(mealTime => (
                    <div key={mealTime.key}>
                      <h3 className="text-lg font-semibold mb-3">{mealTime.name}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {mealTime.meals.map((meal, index) => (
                          <Card key={index} className="border-l-4 border-l-green-500">
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-center">
                                <CardTitle className="text-base">{meal.dishName}</CardTitle>
                                <Badge variant={getBadgeVariant(meal.priority)}>
                                  {meal.priority === "high" ? "Ưu tiên cao" : 
                                   meal.priority === "medium" ? "Ưu tiên vừa" : "Ưu tiên thấp"}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-gray-600 mb-2">{meal.reason}</p>
                              <div className="text-xs space-y-1">
                                {meal.ingredients.slice(0, 3).map((ing, idx) => (
                                  <div key={idx} className="flex justify-between">
                                    <span>{ing.lttpName}</span>
                                    <span>{ing.requiredQuantity} {ing.unit}</span>
                                  </div>
                                ))}
                                {meal.ingredients.length > 3 && (
                                  <div className="text-gray-500">
                                    +{meal.ingredients.length - 3} nguyên liệu khác
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        
                        {mealTime.meals.length === 0 && (
                          <div className="col-span-2 text-center py-4 text-gray-500">
                            Chưa có món ăn nào được đề xuất cho {mealTime.name.toLowerCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4 border-t">
                    <Button className="flex-1">
                      Tạo thực đơn từ gợi ý này
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Xuất báo cáo PDF
                    </Button>
                    <Button variant="outline">
                      Chia sẻ với trợ lý
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <ChefHat className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">Chưa có kế hoạch thực đơn</h3>
                  <p className="mb-4">Nhấn "Tạo kế hoạch thực đơn" để hệ thống phân tích và đề xuất thực đơn cho ngày đã chọn</p>
                  <Button onClick={generateDailyMenuPlan} disabled={isLoading} className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Tạo kế hoạch thực đơn
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 