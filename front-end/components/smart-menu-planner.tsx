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
    expiryDays: number
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

export function SmartMenuPlanner() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [units, setUnits] = useState<any[]>([])
  const [dishes, setDishes] = useState<any[]>([])
  const [dailyRations, setDailyRations] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [menuSuggestions, setMenuSuggestions] = useState<SmartMenuSuggestion[]>([])
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>([])
  const [dailyMenuPlan, setDailyMenuPlan] = useState<DailyMenuPlan | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  
  const { toast } = useToast()

  // Fetch all required data
  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [unitsRes, dishesRes, rationsRes, inventoryRes] = await Promise.all([
        unitsApi.getUnits(),
        dishesApi.getDishes(),
        dailyRationsApi.getDailyRations(),
        processingStationApi.getFoodInventory()
      ])

      setUnits(Array.isArray(unitsRes) ? unitsRes : unitsRes.data || [])
      setDishes(Array.isArray(dishesRes) ? dishesRes : dishesRes.data || [])
      setDailyRations(Array.isArray(rationsRes) ? rationsRes : rationsRes.data || [])
      setInventory(Array.isArray(inventoryRes) ? inventoryRes : inventoryRes.data || [])

      // Generate smart suggestions
      generateSmartSuggestions()
      generateInventoryAlerts()
      generateDailyMenuPlan()

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

  // Generate smart menu suggestions based on inventory and expiry dates
  const generateSmartSuggestions = () => {
    const suggestions: SmartMenuSuggestion[] = []
    
    dishes.forEach(dish => {
      if (!dish.ingredients || dish.ingredients.length === 0) return

      let totalCost = 0
      let priority: "high" | "medium" | "low" = "low"
      let reasons: string[] = []
      
      const ingredientStatus = dish.ingredients.map((ingredient: any) => {
        const inventoryItem = inventory.find(inv => inv.product.id === ingredient.lttpId)
        const availableQuantity = inventoryItem?.nonExpiredQuantity || 0
        const expiredQuantity = inventoryItem?.expiredQuantity || 0
        
        // Calculate days until expiry (simulated - in real app would use actual expiry dates)
        const expiryDays = Math.floor(Math.random() * 30) + 1
        
        let status: "sufficient" | "insufficient" | "expiring_soon" | "expired" = "insufficient"
        if (expiredQuantity > 0) {
          status = "expired"
          reasons.push(`${ingredient.lttpName} đã hết hạn`)
        } else if (expiryDays <= 3) {
          status = "expiring_soon"
          reasons.push(`${ingredient.lttpName} sắp hết hạn (${expiryDays} ngày)`)
          priority = "high"
        } else if (availableQuantity >= ingredient.quantity) {
          status = "sufficient"
        }

        // Calculate cost from daily rations
        const rationItem = dailyRations.find(r => r.name.toLowerCase().includes(ingredient.lttpName.toLowerCase()))
        const unitCost = rationItem?.pricePerUnit || 15000
        totalCost += ingredient.quantity * unitCost

        return {
          lttpId: ingredient.lttpId,
          lttpName: ingredient.lttpName,
          requiredQuantity: ingredient.quantity,
          availableQuantity,
          unit: ingredient.unit,
          expiryDays,
          status
        }
      })

      // Determine if dish is feasible
      const insufficientIngredients = ingredientStatus.filter(ing => ing.status === "insufficient" || ing.status === "expired")
      const expiringSoon = ingredientStatus.filter(ing => ing.status === "expiring_soon")
      
      if (insufficientIngredients.length === 0) {
        if (expiringSoon.length > 0) {
          priority = "high"
          reasons.push("Sử dụng nguyên liệu sắp hết hạn")
        } else if (priority === "low") {
          priority = "medium"
        }

        suggestions.push({
          dishId: dish._id,
          dishName: dish.name,
          priority,
          reason: reasons.join(", ") || "Đủ nguyên liệu, phù hợp chế biến",
          ingredients: ingredientStatus,
          estimatedCost: totalCost,
          suitableForUnits: units.map(u => u._id) // Simplified - all units for now
        })
      }
    })

    // Sort by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    suggestions.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
    
    setMenuSuggestions(suggestions.slice(0, 20)) // Top 20 suggestions
  }

  // Generate inventory alerts
  const generateInventoryAlerts = () => {
    const alerts: InventoryAlert[] = []
    
    inventory.forEach(item => {
      const daysUntilExpiry = Math.floor(Math.random() * 30) + 1 // Simulated
      let alertLevel: "critical" | "warning" | "info" = "info"
      let recommendedAction = ""

      if (item.expiredQuantity > 0) {
        alertLevel = "critical"
        recommendedAction = `Xử lý ${item.expiredQuantity}kg đã hết hạn ngay lập tức`
      } else if (daysUntilExpiry <= 3) {
        alertLevel = "critical"
        recommendedAction = `Ưu tiên sử dụng trong 3 ngày tới (${item.nonExpiredQuantity}kg)`
      } else if (daysUntilExpiry <= 7) {
        alertLevel = "warning"
        recommendedAction = `Lên kế hoạch sử dụng trong tuần (${item.nonExpiredQuantity}kg)`
      } else if (item.nonExpiredQuantity < 10) {
        alertLevel = "warning"
        recommendedAction = "Tồn kho thấp, cân nhắc nhập thêm"
      }

      if (alertLevel !== "info") {
        alerts.push({
          productId: item.product.id,
          productName: item.product.name,
          currentStock: item.nonExpiredQuantity,
          daysUntilExpiry,
          alertLevel,
          recommendedAction
        })
      }
    })

    // Sort by alert level
    const alertOrder = { critical: 3, warning: 2, info: 1 }
    alerts.sort((a, b) => alertOrder[b.alertLevel] - alertOrder[a.alertLevel])
    
    setInventoryAlerts(alerts)
  }

  // Generate daily menu plan
  const generateDailyMenuPlan = () => {
    const totalPersonnel = units.reduce((sum, unit) => sum + (unit.personnel || 0), 0)
    const dailyBudget = totalPersonnel * 65000 // 65,000 VND per person per day
    
    // Select dishes for each meal
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
      meals: {
        morning: morningMeals,
        noon: noonMeals,
        evening: eveningMeals
      },
      totalCost,
      budgetStatus
    })
  }

  useEffect(() => {
    fetchData()
  }, [selectedDate])

  const getBadgeVariant = (priority: string) => {
    switch (priority) {
      case "high": return "destructive"
      case "medium": return "default"
      default: return "secondary"
    }
  }

  const getAlertColor = (level: string) => {
    switch (level) {
      case "critical": return "bg-red-100 text-red-800 border-red-200"
      case "warning": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default: return "bg-blue-100 text-blue-800 border-blue-200"
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
              {units.reduce((sum, unit) => sum + (unit.personnel || 0), 0).toLocaleString()}
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
              {inventory.reduce((sum, item) => sum + item.nonExpiredQuantity, 0).toLocaleString()}
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
              {inventoryAlerts.filter(alert => alert.alertLevel === "critical").length}
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
              {menuSuggestions.length}
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
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Gợi ý món ăn thông minh
              </CardTitle>
              <CardDescription>
                Các món ăn được đề xuất dựa trên tồn kho hiện tại và hạn sử dụng
              </CardDescription>
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
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Thực đơn được đề xuất cho ngày {format(selectedDate, "dd/MM/yyyy", { locale: vi })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dailyMenuPlan && (
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 