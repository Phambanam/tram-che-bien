"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Pagination } from "@/components/ui/pagination"
import { Search, Plus, Edit, Trash2, FileDown, FileUp, Users, Tag, Package, Utensils, Calculator, Info, UserCheck } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import { unitsApi, categoriesApi, productsApi, dishesApi, dailyRationsApi, lttpApi } from "@/lib/api-client"
import { UsersTable } from "@/components/users/users-table"

interface Unit {
  _id: string
  name: string
  code?: string
  personnel?: number
  commander?: string
  contact?: string
  description?: string
}

interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  itemCount?: number
}

interface LTTPItem {
  _id: string
  name: string
  categoryId: string
  categoryName: string
  unit: string
  description?: string
  nutritionalValue?: string
  storageCondition?: string
}

interface Dish {
  _id: string
  name: string
  description?: string
  mainLTTP?: {
    lttpId: string
    lttpName: string
    category: string
  }
  ingredients: DishIngredient[]
  servings: number
  preparationTime?: number
  difficulty?: "easy" | "medium" | "hard"
  category?: string
}

interface DishIngredient {
  lttpId: string
  lttpName: string
  quantity: number
  unit: string
  notes?: string
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

export function DataLibraryContent() {
  const [activeTab, setActiveTab] = useState("units")
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  // Pagination states for each tab
  const [currentPages, setCurrentPages] = useState({
    units: 1,
    categories: 1,
    lttp: 1,
    dishes: 1,
    rations: 1,
    users: 1
  })
  const [itemsPerPage] = useState(10)

  // Data states
  const [units, setUnits] = useState<Unit[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [lttpItems, setLTTPItems] = useState<LTTPItem[]>([])
  const [dishes, setDishes] = useState<Dish[]>([])
  const [dailyRations, setDailyRations] = useState<DailyRation[]>([])

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add")
  const [selectedItem, setSelectedItem] = useState<any>(null)

  // Form states
  const [formData, setFormData] = useState<any>({})
  const [ingredients, setIngredients] = useState<DishIngredient[]>([])
  const [newIngredient, setNewIngredient] = useState<DishIngredient>({
    lttpId: "",
    lttpName: "",
    quantity: 0,
    unit: "",
    notes: ""
  })

  // Category ingredients cache for tooltip
  const [categoryIngredients, setCategoryIngredients] = useState<{ [categoryId: string]: LTTPItem[] }>({})

  // Reset pagination when search term changes
  useEffect(() => {
    setCurrentPages(prev => ({
      ...prev,
      [activeTab]: 1
    }))
  }, [searchTerm])

  // Fetch data
  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch units
      try {
        const unitsResponse = await unitsApi.getUnits()
        const unitsData = Array.isArray(unitsResponse) ? unitsResponse : (unitsResponse as any).data || []
        setUnits(unitsData)
      } catch (error) {
        console.log("Could not fetch units, using sample data")
        setUnits([
          { _id: "1", name: "Tiểu đoàn 1", code: "TD01", personnel: 150, commander: "Thiếu tá Nguyễn Văn A", contact: "0987654321" },
          { _id: "2", name: "Tiểu đoàn 2", code: "TD02", personnel: 145, commander: "Thiếu tá Trần Văn B", contact: "0987654322" },
          { _id: "3", name: "Tiểu đoàn 3", code: "TD03", personnel: 148, commander: "Thiếu tá Lê Văn C", contact: "0987654323" },
          { _id: "4", name: "Lữ đoàn bộ", code: "LDB", personnel: 80, commander: "Trung tá Phạm Văn D", contact: "0987654324" },
        ])
      }

      // Fetch categories
      try {
        const categoriesResponse = await categoriesApi.getCategories()
        const categoriesData = Array.isArray(categoriesResponse) ? categoriesResponse : (categoriesResponse as any).data || []
        setCategories(categoriesData)
      } catch (error) {
        console.log("Could not fetch categories, using sample data")
        setCategories([
          { _id: "1", name: "Rau củ quả", slug: "rau-cu-qua", description: "Các loại rau xanh, củ quả tươi", itemCount: 25 },
          { _id: "2", name: "Thịt", slug: "thit", description: "Thịt lợn, bò, gà và các loại thịt khác", itemCount: 15 },
          { _id: "3", name: "Hải sản", slug: "hai-san", description: "Cá, tôm, cua và các loại hải sản", itemCount: 12 },
          { _id: "4", name: "Chất đốt", slug: "chat-dot", description: "Gas, than, củi và các chất đốt", itemCount: 8 },
          { _id: "5", name: "Gia vị", slug: "gia-vi", description: "Muối, đường, nước mắm, các loại gia vị", itemCount: 20 },
          { _id: "6", name: "Lương thực", slug: "luong-thuc", description: "Gạo, bún, phở và các loại lương thực", itemCount: 10 },
        ])
      }

      // Fetch products (LTTP Items)
      try {
        console.log('Fetching products...')
        const productsResponse = await productsApi.getAllProducts()
        console.log('Products response:', productsResponse)
        
        const productsData = Array.isArray(productsResponse) ? productsResponse : (productsResponse as any).data || []
        console.log('Products data:', productsData)
        
        const mappedLTTPItems = productsData.map((product: any) => ({
          _id: product._id,
          name: product.name,
          categoryId: product.categoryId || product.category?._id,
          categoryName: product.categoryName || product.category?.name,
          unit: product.unit,
          description: product.description,
          nutritionalValue: product.nutritionalValue,
          storageCondition: product.storageCondition,
        }))
        
        console.log('Mapped LTTP items:', mappedLTTPItems)
        setLTTPItems(mappedLTTPItems)
        console.log('LTTP items state updated')
      } catch (error) {
        console.log("Could not fetch products, using sample data. Error:", error)
        
      }

      // Fetch dishes
      try {
        const dishesResponse = await dishesApi.getDishes()
        const dishesData = Array.isArray(dishesResponse) ? dishesResponse : (dishesResponse as any).data || []
        setDishes(dishesData)
      } catch (error) {
        console.log("Could not fetch dishes, using sample data")
        setDishes([
          {
            _id: "1",
            name: "Thịt lợn kho",
            description: "Món thịt lợn kho đậm đà",
            servings: 10,
            preparationTime: 45,
            difficulty: "medium",
            category: "Món mặn",
            ingredients: [
              { lttpId: "4", lttpName: "Thịt lợn", quantity: 1.5, unit: "kg", notes: "Thái miếng vừa" },
              { lttpId: "8", lttpName: "Muối", quantity: 0.02, unit: "kg", notes: "Nêm vừa ăn" },
            ]
          },
          {
            _id: "2", 
            name: "Canh cải thịt bằm",
            description: "Canh rau cải với thịt bằm",
            servings: 10,
            preparationTime: 30,
            difficulty: "easy",
            category: "Canh",
            ingredients: [
              { lttpId: "1", lttpName: "Rau cải", quantity: 0.8, unit: "kg", notes: "Rửa sạch, thái khúc" },
              { lttpId: "4", lttpName: "Thịt lợn", quantity: 0.3, unit: "kg", notes: "Băm nhỏ" },
              { lttpId: "8", lttpName: "Muối", quantity: 0.015, unit: "kg", notes: "Nêm vừa ăn" },
            ]
          },
          {
            _id: "3",
            name: "Giò chả",
            description: "Giò chả truyền thống",
            servings: 20,
            preparationTime: 120,
            difficulty: "hard",
            category: "Món chế biến",
            ingredients: [
              { lttpId: "4", lttpName: "Thịt lợn", quantity: 2, unit: "kg", notes: "Thịt nạc vai" },
              { lttpId: "8", lttpName: "Muối", quantity: 0.04, unit: "kg", notes: "Muối tinh" },
            ]
          }
        ])
      }

      // Fetch daily rations
      try {
        const dailyRationsResponse = await dailyRationsApi.getDailyRations()
        const dailyRationsData = Array.isArray(dailyRationsResponse) ? dailyRationsResponse : (dailyRationsResponse as any).data || []
        setDailyRations(dailyRationsData)
      } catch (error) {
        console.log("Could not fetch daily rations, using sample data")
        setDailyRations([
          { _id: "1", name: "Gạo tẻ", categoryId: "6", categoryName: "Lương thực", quantityPerPerson: 0.6, unit: "kg", pricePerUnit: 25000, totalCostPerPerson: 15000, notes: "Khẩu phần chính" },
          { _id: "2", name: "Thịt heo", categoryId: "2", categoryName: "Thịt", quantityPerPerson: 0.15, unit: "kg", pricePerUnit: 180000, totalCostPerPerson: 27000, notes: "Protein chính" },
          { _id: "3", name: "Rau cải", categoryId: "1", categoryName: "Rau củ quả", quantityPerPerson: 0.2, unit: "kg", pricePerUnit: 15000, totalCostPerPerson: 3000, notes: "Vitamin và chất xơ" },
          { _id: "4", name: "Cá biển", categoryId: "3", categoryName: "Hải sản", quantityPerPerson: 0.1, unit: "kg", pricePerUnit: 120000, totalCostPerPerson: 12000, notes: "Protein bổ sung" },
          { _id: "5", name: "Gia vị cơ bản", categoryId: "5", categoryName: "Gia vị", quantityPerPerson: 0.05, unit: "kg", pricePerUnit: 16000, totalCostPerPerson: 800, notes: "Muối, đường, nước mắm" },
          { _id: "6", name: "Gas nấu ăn", categoryId: "4", categoryName: "Chất đốt", quantityPerPerson: 0.002, unit: "bình", pricePerUnit: 400000, totalCostPerPerson: 800, notes: "Năng lượng nấu ăn cho 1 người" },
        ])
      }

    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi tải dữ liệu",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAdd = (type: string) => {
    setDialogMode("add")
    setSelectedItem(null)
    setFormData({})
    
    // Reset ingredients for dishes
    if (type === "dishes") {
      setIngredients([])
      setNewIngredient({
        lttpId: "",
        lttpName: "",
        quantity: 0,
        unit: "",
        notes: ""
      })
    }
    
    setDialogOpen(true)
  }

  const handleEdit = (item: any, type: string) => {
    setSelectedItem(item)
    setFormData(item)
    setDialogMode("edit")
    
    // Special handling for dishes
    if (type === "dishes" && item.ingredients) {
      setIngredients(item.ingredients || [])
    }
    
    setDialogOpen(true)
  }

  const handleDelete = async (id: string, type: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa mục này?")) {
      try {
        let apiCall
        let successMessage = ""

        if (type === "units") {
          apiCall = unitsApi.deleteUnit(id)
          successMessage = "Đã xóa đơn vị thành công!"
        } else if (type === "categories") {
          apiCall = categoriesApi.deleteCategory(id)
          successMessage = "Đã xóa phân loại thành công!"
        } else if (type === "lttp") {
          apiCall = productsApi.deleteProduct(id)
          successMessage = "Đã xóa LTTP thành công!"
        } else if (type === "dishes") {
          apiCall = dishesApi.deleteDish(id)
          successMessage = "Đã xóa món ăn thành công!"
        } else if (type === "rations") {
          apiCall = dailyRationsApi.deleteDailyRation(id)
          successMessage = "Đã xóa định lượng ăn thành công!"
        }

        if (apiCall) {
          await apiCall
          toast({
            title: "Thành công",
            description: successMessage,
          })
          await fetchData() // Refresh data
        }
      } catch (error: any) {
        console.error('Error in handleDelete:', error)
        toast({
          title: "Lỗi", 
          description: error.message || "Có lỗi xảy ra khi xóa",
          variant: "destructive",
        })
      }
    }
  }

  const handleSave = async () => {
    try {
      let apiCall
      let successMessage = ""

      // Prepare data based on active tab
      let dataToSave = { ...formData }
      
      console.log('handleSave called for tab:', activeTab)
      console.log('Data to save:', dataToSave)
      
      // Special handling for dishes
      if (activeTab === "dishes") {
        dataToSave.ingredients = ingredients
        successMessage = dialogMode === "add" ? "Thêm món ăn thành công" : "Cập nhật món ăn thành công"
        
        if (dialogMode === "add") {
          apiCall = dishesApi.createDish(dataToSave)
        } else {
          apiCall = dishesApi.updateDish(selectedItem._id, dataToSave)
        }
      } else if (activeTab === "units") {
        successMessage = dialogMode === "add" ? "Thêm đơn vị thành công" : "Cập nhật đơn vị thành công"
        
        if (dialogMode === "add") {
          apiCall = unitsApi.createUnit(dataToSave)
        } else {
          apiCall = unitsApi.updateUnit(selectedItem._id, dataToSave)
        }
      } else if (activeTab === "categories") {
        successMessage = dialogMode === "add" ? "Thêm phân loại thành công" : "Cập nhật phân loại thành công"
        
        if (dialogMode === "add") {
          apiCall = categoriesApi.createCategory(dataToSave)
        } else {
          apiCall = categoriesApi.updateCategory(selectedItem._id, dataToSave)
        }
      } else if (activeTab === "lttp") {
        successMessage = dialogMode === "add" ? "Thêm LTTP thành công" : "Cập nhật LTTP thành công"
        
        // For LTTP, use productsApi instead of lttpApi for consistency
        if (dialogMode === "add") {
          // Make sure categoryId is included for product creation
          if (!dataToSave.categoryId) {
            toast({
              title: "Lỗi",
              description: "Vui lòng chọn phân loại cho LTTP",
              variant: "destructive",
            })
            return
          }
          console.log('Creating LTTP with data:', dataToSave)
          apiCall = productsApi.createProduct(dataToSave)
        } else {
          console.log('Updating LTTP with data:', dataToSave)
          apiCall = productsApi.updateProduct(selectedItem._id, dataToSave)
        }
      } else if (activeTab === "rations") {
        successMessage = dialogMode === "add" ? "Thêm định lượng ăn thành công" : "Cập nhật định lượng ăn thành công"
        
        if (dialogMode === "add") {
          apiCall = dailyRationsApi.createDailyRation(dataToSave)
        } else {
          apiCall = dailyRationsApi.updateDailyRation(selectedItem._id, dataToSave)
        }
      }

      if (apiCall) {
        console.log('Calling API...')
        const result = await apiCall
        console.log('API result:', result)
        
        toast({
          title: "Thành công",
          description: successMessage,
        })
        
        setDialogOpen(false)
        setFormData({})
        setIngredients([])
        setNewIngredient({
          lttpId: "",
          lttpName: "",
          quantity: 0,
          unit: "",
          notes: ""
        })
        
        console.log('Refreshing data...')
        await fetchData()
        console.log('Data refreshed successfully')
      }
    } catch (error: any) {
      console.error('Error in handleSave:', error)
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi lưu dữ liệu",
        variant: "destructive",
      })
    }
  }

  const filteredData = (data: any[]) => {
    if (!searchTerm) return data
    return data.filter(item => 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  // Pagination logic
  const paginateData = (data: any[]) => {
    const filtered = filteredData(data)
    const currentPage = currentPages[activeTab as keyof typeof currentPages]
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const result = {
      data: filtered.slice(startIndex, endIndex),
      totalPages: Math.ceil(filtered.length / itemsPerPage),
      totalItems: filtered.length
    }
    
    // Debug for dishes tab
    if (activeTab === "dishes") {
      console.log("🍽️ Dishes pagination debug:", {
        totalDishes: data.length,
        filteredDishes: filtered.length,
        currentPage,
        itemsPerPage,
        totalPages: result.totalPages,
        displayedItems: result.data.length,
        startIndex,
        endIndex
      })
    }
    
    return result
  }

  const handlePageChange = (page: number) => {
    setCurrentPages(prev => ({
      ...prev,
      [activeTab]: page
    }))
  }

  const tabs = [
    { id: "units", name: "Đơn vị", icon: Users, color: "bg-blue-100 text-blue-800" },
    { id: "categories", name: "Phân loại", icon: Tag, color: "bg-green-100 text-green-800" },
    { id: "lttp", name: "Tên LTTP - Chất đốt", icon: Package, color: "bg-orange-100 text-orange-800" },
    { id: "dishes", name: "Món ăn", icon: Utensils, color: "bg-purple-100 text-purple-800" },
    { id: "rations", name: "Định lượng ăn", icon: Calculator, color: "bg-red-100 text-red-800" },
    { id: "users", name: "Quản lý người dùng", icon: UserCheck, color: "bg-indigo-100 text-indigo-800" },
  ]

  // Handle ingredient management
  const addIngredient = () => {
    if (!newIngredient.lttpId || !newIngredient.lttpName || !newIngredient.quantity || !newIngredient.unit) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin nguyên liệu",
        variant: "destructive",
      })
      return
    }

    setIngredients([...ingredients, { ...newIngredient }])
    setNewIngredient({
      lttpId: "",
      lttpName: "",
      quantity: 0,
      unit: "",
      notes: ""
    })
  }

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const updateIngredient = (index: number, field: keyof DishIngredient, value: any) => {
    const updatedIngredients = [...ingredients]
    updatedIngredients[index] = { ...updatedIngredients[index], [field]: value }
    setIngredients(updatedIngredients)
  }

  // Handle LTTP selection for main LTTP
  const handleMainLTTPSelect = (lttp: LTTPItem) => {
    setFormData({
      ...formData,
      mainLTTP: {
        lttpId: lttp._id,
        lttpName: lttp.name,
        category: lttp.categoryName
      }
    })
  }

  // Handle LTTP selection for ingredient
  const handleIngredientLTTPSelect = (lttp: LTTPItem) => {
    setNewIngredient({
      ...newIngredient,
      lttpId: lttp._id,
      lttpName: lttp.name,
      unit: lttp.unit || "kg"
    })
  }

  // Fetch ingredients by category for tooltip
  const fetchIngredientsByCategory = async (categoryId: string) => {
    if (categoryIngredients[categoryId]) {
      return categoryIngredients[categoryId]
    }

    try {
      const response = await productsApi.getProducts(categoryId)
      const products = Array.isArray(response) ? response : (response as any).data || []
      
      const mappedProducts = products.map((product: any) => ({
        _id: product._id,
        name: product.name,
        categoryId: product.categoryId || product.category?._id,
        categoryName: product.categoryName || product.category?.name,
        unit: product.unit,
        description: product.description,
        nutritionalValue: product.nutritionalValue,
        storageCondition: product.storageCondition,
      }))

      setCategoryIngredients(prev => ({
        ...prev,
        [categoryId]: mappedProducts
      }))

      return mappedProducts
    } catch (error) {
      console.error("Error fetching ingredients for category:", error)
      return []
    }
  }

  // Component tooltip để hiển thị chi tiết nguyên liệu theo phân loại
  const CategoryTooltip = ({ category }: { category: Category }) => {
    const [ingredients, setIngredients] = useState<LTTPItem[]>([])
    const [loading, setLoading] = useState(false)

    const loadIngredients = async () => {
      if (ingredients.length === 0) {
        setLoading(true)
        const fetchedIngredients = await fetchIngredientsByCategory(category._id)
        setIngredients(fetchedIngredients)
        setLoading(false)
      }
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto p-1"
              onMouseEnter={loadIngredients}
            >
              <Info className="h-4 w-4 mr-1" />
              {category.itemCount} mục
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-80">
            <div className="p-2">
              <div className="font-medium mb-2">{category.name}</div>
              {loading ? (
                <div className="text-sm text-gray-500">Đang tải...</div>
              ) : (
                <>
                  {ingredients.length > 0 ? (
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Danh sách nguyên liệu:</div>
                      <div className="max-h-40 overflow-y-auto">
                        {ingredients.map((ingredient, index) => (
                          <div key={ingredient._id} className="text-xs text-gray-600 py-1">
                            {index + 1}. {ingredient.name} ({ingredient.unit})
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Chưa có nguyên liệu nào</div>
                  )}
                </>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className="w-full p-6">
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h1 className="text-3xl font-bold text-center text-[#b45f06] mb-2">
            THƯ VIỆN DỮ LIỆU
          </h1>
          <p className="text-center text-gray-600">
            Quản lý dữ liệu cơ bản của hệ thống
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <Button
                  key={tab.id}
                  variant={isActive ? "default" : "outline"}
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs text-center">{tab.name}</span>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {/* Search and Actions */}
          <div className="flex justify-between items-center mb-6">
              <div className="flex gap-2 items-center">
              <Input 
                placeholder={`Tìm kiếm ${tabs.find(t => t.id === activeTab)?.name.toLowerCase()}...`}
                className="w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
              {activeTab !== "users" && (
                <Button className="flex items-center gap-2" onClick={() => handleAdd(activeTab)}>
                  <Plus className="h-4 w-4" />
                  Thêm mới
                </Button>
              )}
            </div>
            </div>

          {/* Tab Content */}
          {activeTab === "units" && (
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
                    {paginateData(units).data.map((unit, index) => (
                      <TableRow key={unit._id}>
                        <TableCell>{(currentPages.units - 1) * itemsPerPage + index + 1}</TableCell>
                        <TableCell>{unit.code}</TableCell>
                        <TableCell className="font-medium">{unit.name}</TableCell>
                        <TableCell>{unit.personnel}</TableCell>
                        <TableCell>{unit.commander}</TableCell>
                        <TableCell>{unit.contact}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(unit, "units")}>
                              Sửa
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(unit._id, "units")}>
                              Xóa
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Pagination
                  currentPage={currentPages.units}
                  totalPages={paginateData(units).totalPages}
                  onPageChange={handlePageChange}
                />
              </CardContent>
            </Card>
          )}

          {activeTab === "categories" && (
            <Card>
              <CardHeader>
                <CardTitle>Danh sách phân loại</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>STT</TableHead>
                      <TableHead>Tên phân loại</TableHead>
                      <TableHead>Mô tả</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginateData(categories).data.map((category, index) => (
                      <TableRow key={category._id}>
                        <TableCell>{(currentPages.categories - 1) * itemsPerPage + index + 1}</TableCell>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.description}</TableCell>
                        <TableCell>
                          <div className="flex gap-2 items-center">
                            <CategoryTooltip category={category} />
                            <Button variant="outline" size="sm" onClick={() => handleEdit(category, "categories")}>
                              Sửa
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(category._id, "categories")}>
                              Xóa
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Pagination
                  currentPage={currentPages.categories}
                  totalPages={paginateData(categories).totalPages}
                  onPageChange={handlePageChange}
                />
              </CardContent>
            </Card>
          )}

          {activeTab === "lttp" && (
            <Card>
              <CardHeader>
                <CardTitle>Danh sách tên LTTP - Chất đốt</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>STT</TableHead>
                      <TableHead>Tên LTTP</TableHead>
                      <TableHead>Phân loại</TableHead>
                      <TableHead>Đơn vị</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginateData(lttpItems).data.map((item, index) => (
                      <TableRow key={item._id}>
                        <TableCell>{(currentPages.lttp - 1) * itemsPerPage + index + 1}</TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.categoryName}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(item, "lttp")}>
                              Sửa
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(item._id, "lttp")}>
                              Xóa
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Pagination
                  currentPage={currentPages.lttp}
                  totalPages={paginateData(lttpItems).totalPages}
                  onPageChange={handlePageChange}
                />
              </CardContent>
            </Card>
          )}

          {activeTab === "dishes" && (
            <Card>
              <CardHeader>
                <CardTitle>Danh sách món ăn</CardTitle>
                <div className="text-sm text-gray-500">
                  Tổng: {dishes.length} món ăn
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>STT</TableHead>
                      <TableHead>Tên món ăn</TableHead>
                      <TableHead>LTTP chính</TableHead>
                      <TableHead>Số nguyên liệu</TableHead>
                      <TableHead>Số lượng</TableHead>
                      <TableHead>Thời gian chế biến</TableHead>
                      <TableHead>Độ khó</TableHead>
                      <TableHead>Phân loại</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const paginatedDishes = paginateData(dishes)
                      console.log("🍽️ Dishes debug:", {
                        totalDishes: dishes.length,
                        currentPage: currentPages.dishes,
                        totalPages: paginatedDishes.totalPages,
                        showingItems: paginatedDishes.data.length
                      })
                      
                      return paginatedDishes.data.map((dish, index) => (
                        <TableRow key={dish._id}>
                          <TableCell>{(currentPages.dishes - 1) * itemsPerPage + index + 1}</TableCell>
                          <TableCell className="font-medium">{dish.name}</TableCell>
                          <TableCell>
                            {dish.mainLTTP ? (
                              <Badge variant="outline" className="bg-blue-50">
                                {dish.mainLTTP.lttpName}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">Chưa chọn</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {dish.ingredients?.length || 0} nguyên liệu
                            </Badge>
                          </TableCell>
                          <TableCell>{dish.servings}</TableCell>
                          <TableCell>{dish.preparationTime} phút</TableCell>
                          <TableCell>
                            <Badge variant={
                              dish.difficulty === "easy" ? "default" : 
                              dish.difficulty === "medium" ? "secondary" : "destructive"
                            }>
                              {dish.difficulty === "easy" ? "Dễ" : 
                               dish.difficulty === "medium" ? "Trung bình" : "Khó"}
                            </Badge>
                          </TableCell>
                          <TableCell>{dish.category}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEdit(dish, "dishes")}>
                                Sửa
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDelete(dish._id, "dishes")}>
                                Xóa
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    })()}
                  </TableBody>
                </Table>
                <Pagination
                  currentPage={currentPages.dishes}
                  totalPages={paginateData(dishes).totalPages}
                  onPageChange={handlePageChange}
                />
              </CardContent>
            </Card>
          )}

          {activeTab === "rations" && (
            <Card>
              <CardHeader>
                <CardTitle>Danh sách định lượng ăn</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>STT</TableHead>
                      <TableHead>Tên định lượng ăn</TableHead>
                      <TableHead>Phân loại</TableHead>
                      <TableHead>Số lượng/người/ngày</TableHead>
                      <TableHead>Đơn vị</TableHead>
                      <TableHead>Giá/đơn vị (VND)</TableHead>
                      <TableHead>Tổng chi phí/người/ngày (VND)</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginateData(dailyRations).data.map((ration, index) => (
                      <TableRow key={ration._id}>
                        <TableCell>{(currentPages.rations - 1) * itemsPerPage + index + 1}</TableCell>
                        <TableCell className="font-medium">{ration.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{ration.categoryName}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{ration.quantityPerPerson}</Badge>
                        </TableCell>
                        <TableCell>{ration.unit}</TableCell>
                        <TableCell>{ration.pricePerUnit.toLocaleString()} đ</TableCell>
                        <TableCell>{ration.totalCostPerPerson.toLocaleString()} đ</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(ration, "rations")}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(ration._id, "rations")}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Pagination
                  currentPage={currentPages.rations}
                  totalPages={paginateData(dailyRations).totalPages}
                  onPageChange={handlePageChange}
                />
              </CardContent>
            </Card>
          )}

          {activeTab === "users" && (
            <Card>
              <CardHeader>
                <CardTitle>Quản lý người dùng</CardTitle>
              </CardHeader>
              <CardContent>
                <UsersTable />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "add" ? "Thêm mới" : "Chỉnh sửa"} {tabs.find(t => t.id === activeTab)?.name}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "add" ? "Thêm mới" : "Cập nhật thông tin"} {tabs.find(t => t.id === activeTab)?.name.toLowerCase()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {activeTab === "units" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-medium">Mã đơn vị *</label>
                    <Input
                      value={formData.code || ""}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, code: e.target.value }))}
                      placeholder="VD: TD01"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-medium">Tên đơn vị *</label>
                    <Input
                      value={formData.name || ""}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
                      placeholder="VD: Tiểu đoàn 1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-medium">Quân số</label>
                    <Input
                      type="number"
                      value={formData.personnel || ""}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, personnel: Number(e.target.value) }))}
                      placeholder="VD: 150"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-medium">Chỉ huy</label>
                    <Input
                      value={formData.commander || ""}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, commander: e.target.value }))}
                      placeholder="VD: Thiếu tá Nguyễn Văn A"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-medium">Liên hệ</label>
                  <Input
                    value={formData.contact || ""}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, contact: e.target.value }))}
                    placeholder="VD: 0987654321"
                  />
                </div>
              </>
            )}

            {activeTab === "categories" && (
              <>
                <div className="space-y-2">
                  <label className="font-medium">Tên phân loại *</label>
                  <Input
                    value={formData.name || ""}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
                    placeholder="VD: Rau củ quả"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-medium">Slug *</label>
                  <Input
                    value={formData.slug || ""}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, slug: e.target.value }))}
                    placeholder="VD: rau-cu-qua"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-medium">Mô tả</label>
                  <textarea
                    className="w-full min-h-[80px] p-2 border border-gray-300 rounded-md"
                    value={formData.description || ""}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, description: e.target.value }))}
                    placeholder="Mô tả về phân loại này"
                  />
                </div>
              </>
            )}

            {activeTab === "lttp" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-medium">Tên LTTP *</label>
                    <Input
                      value={formData.name || ""}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
                      placeholder="VD: Rau cải"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-medium">Phân loại *</label>
                    <Select
                      value={formData.categoryId || ""}
                      onValueChange={(value) => {
                        const category = categories.find(c => c._id === value)
                        setFormData(prev => ({ 
                          ...prev, 
                          categoryId: value,
                          categoryName: category?.name || ""
                        }))
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn phân loại" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category._id} value={category._id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-medium">Đơn vị *</label>
                    <Input
                      value={formData.unit || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                      placeholder="VD: kg, lít, bình"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-medium">Giá trị dinh dưỡng</label>
                    <Input
                      value={formData.nutritionalValue || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, nutritionalValue: e.target.value }))}
                      placeholder="VD: Vitamin A, C"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-medium">Điều kiện bảo quản</label>
                  <Input
                    value={formData.storageCondition || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, storageCondition: e.target.value }))}
                    placeholder="VD: Bảo quản lạnh 2-4°C"
                  />
                </div>
              </>
            )}

            {activeTab === "dishes" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-medium">Tên món ăn *</label>
                    <Input
                      value={formData.name || ""}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
                      placeholder="VD: Thịt lợn rang cháy cạnh"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-medium">Phân loại món ăn</label>
                    <Input
                      value={formData.category || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="VD: Món mặn"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-medium">Mô tả món ăn</label>
                  <textarea
                    className="w-full min-h-[60px] p-2 border border-gray-300 rounded-md"
                    value={formData.description || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Mô tả về món ăn này"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="font-medium">Số lượng (người)</label>
                    <Input
                      type="number"
                      value={formData.servings || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, servings: Number(e.target.value) }))}
                      placeholder="VD: 10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-medium">Thời gian (phút)</label>
                    <Input
                      type="number"
                      value={formData.preparationTime || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, preparationTime: Number(e.target.value) }))}
                      placeholder="VD: 45"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-medium">Độ khó</label>
                    <Select
                      value={formData.difficulty || ""}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn độ khó" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Dễ</SelectItem>
                        <SelectItem value="medium">Trung bình</SelectItem>
                        <SelectItem value="hard">Khó</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* LTTP chính */}
                <div className="space-y-2">
                  <label className="font-medium">LTTP chính *</label>
                  <div className="flex gap-2">
                    {formData.mainLTTP ? (
                      <div className="flex items-center gap-2 p-2 bg-blue-50 border rounded-md flex-1">
                        <Badge variant="outline">{formData.mainLTTP.lttpName}</Badge>
                        <span className="text-sm text-gray-600">({formData.mainLTTP.category})</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, mainLTTP: null }))}
                          className="ml-auto"
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <Select
                        value=""
                        onValueChange={(value) => {
                          const lttp = lttpItems.find(item => item._id === value)
                          if (lttp) handleMainLTTPSelect(lttp)
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Chọn LTTP chính cho món ăn" />
                        </SelectTrigger>
                        <SelectContent>
                          {lttpItems.map((lttp) => (
                            <SelectItem key={lttp._id} value={lttp._id}>
                              {lttp.name} ({lttp.categoryName})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                {/* Nguyên liệu */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="font-medium">Nguyên liệu</label>
                    <Badge variant="secondary">{ingredients.length} nguyên liệu</Badge>
                  </div>

                  {/* Danh sách nguyên liệu hiện tại */}
                  {ingredients.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                      {ingredients.map((ingredient, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{ingredient.lttpName}</div>
                            <div className="text-xs text-gray-600">
                              {ingredient.quantity} {ingredient.unit}
                              {ingredient.notes && ` - ${ingredient.notes}`}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeIngredient(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Form thêm nguyên liệu mới */}
                  <div className="border rounded-md p-3 bg-gray-50">
                    <div className="text-sm font-medium mb-2">Thêm nguyên liệu mới</div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <Select
                        value={newIngredient.lttpId}
                        onValueChange={(value) => {
                          const lttp = lttpItems.find(item => item._id === value)
                          if (lttp) handleIngredientLTTPSelect(lttp)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn LTTP" />
                        </SelectTrigger>
                        <SelectContent>
                          {lttpItems.map((lttp) => (
                            <SelectItem key={lttp._id} value={lttp._id}>
                              {lttp.name} ({lttp.categoryName})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          step="0.001"
                          value={newIngredient.quantity}
                          onChange={(e) => setNewIngredient(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                          placeholder="Số lượng"
                          className="flex-1"
                        />
                        <Input
                          value={newIngredient.unit}
                          onChange={(e) => setNewIngredient(prev => ({ ...prev, unit: e.target.value }))}
                          placeholder="ĐVT"
                          className="w-16"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newIngredient.notes}
                        onChange={(e) => setNewIngredient(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Ghi chú (VD: Thái miếng vừa, rửa sạch...)"
                        className="flex-1"
                      />
                      <Button onClick={addIngredient} size="sm">
                        Thêm
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === "rations" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-medium">Tên định lượng *</label>
                    <Input
                      value={formData.name || ""}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
                      placeholder="VD: Gạo tẻ"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-medium">Phân loại *</label>
                    <Select
                      value={formData.categoryId || ""}
                      onValueChange={(value) => {
                        const category = categories.find(c => c._id === value)
                        setFormData((prev: any) => ({ 
                          ...prev, 
                          categoryId: value,
                          categoryName: category?.name || ""
                        }))
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn phân loại" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category._id} value={category._id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="font-medium">Số lượng/người/ngày *</label>
                    <Input
                      type="number"
                      step="0.001"
                      value={formData.quantityPerPerson || ""}
                      onChange={(e) => {
                        const quantity = Number(e.target.value)
                        const price = formData.pricePerUnit || 0
                        setFormData((prev: any) => ({ 
                          ...prev, 
                          quantityPerPerson: quantity,
                          totalCostPerPerson: quantity * price
                        }))
                      }}
                      placeholder="VD: 0.6 hoặc 0.002"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-medium">Đơn vị *</label>
                    <Input
                      value={formData.unit || ""}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, unit: e.target.value }))}
                      placeholder="VD: kg, lít, bình"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-medium">Giá/đơn vị (VND) *</label>
                    <Input
                      type="number"
                      value={formData.pricePerUnit || ""}
                      onChange={(e) => {
                        const price = Number(e.target.value)
                        const quantity = formData.quantityPerPerson || 0
                        setFormData((prev: any) => ({ 
                          ...prev, 
                          pricePerUnit: price,
                          totalCostPerPerson: quantity * price
                        }))
                      }}
                      placeholder="VD: 25000"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-medium">Tổng chi phí/người/ngày (VND)</label>
                    <Input
                      type="number"
                      value={formData.totalCostPerPerson || 0}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-medium">Ghi chú</label>
                    <Input
                      value={formData.notes || ""}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, notes: e.target.value }))}
                      placeholder="VD: Khẩu phần chính"
                    />
                  </div>
                </div>
                
                {/* Info note */}
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Ví dụ:</strong> Gạo tẻ: 0.6 kg/người/ngày. Gas nấu ăn: 0.002 bình/người/ngày. Thịt heo: 0.15 kg/người/ngày.
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave}>
              {dialogMode === "add" ? "Thêm mới" : "Cập nhật"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
