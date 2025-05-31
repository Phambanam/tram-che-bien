"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AlertCircle, CalendarIcon, FileDown, FileUp, Loader2, Search } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Supply, suppliesApi } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { Session } from "next-auth"
import {SuppliesTable} from "@/components/supplies/supplies-table"
interface Category {
  _id: string
  name: string
}

interface Product {
  _id: string
  name: string
  unit: string
}

interface SupplyManagementContentProps {
  session?: Session | null
}

export function SupplyManagementContent({ session }: SupplyManagementContentProps) {
  const [date, setDate] = useState<Date>()
  const [supplies, setSupplies] = useState<Supply[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()


  // Fetch supplies from API
  useEffect(() => {
    const fetchSupplies = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await suppliesApi.getAll()
        console.log("API Response:", response); // Debug log
        
        // Handle different response formats
        if (Array.isArray(response)) {
          setSupplies(response);
        } else if (response && Array.isArray(response.data)) {
          setSupplies(response.data);
        } else {
          console.error("Unexpected API response format:", response);
          setSupplies([]);
          setError("Định dạng dữ liệu không hợp lệ");
        }
        
        // Fetch categories for the new supply form
        const categoriesResponse = await suppliesApi.getCategories()
        if (categoriesResponse && Array.isArray(categoriesResponse.data)) {
          setCategories(categoriesResponse.data);
        } else {
          console.error("Unexpected categories API response format:", categoriesResponse);
          setCategories([]);
        }
        
      } catch (error) {
        console.error("Error fetching supplies:", error)
        setError(error instanceof Error ? error.message : "Đã xảy ra lỗi khi tải danh sách nguồn nhập")
        setSupplies([]); // Reset to empty array on error
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi tải danh sách nguồn nhập",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSupplies()
  }, [toast])

  // Fetch products when category changes
  useEffect(() => {
    if (selectedCategory) {
      const fetchProducts = async () => {
        try {
          const response = await suppliesApi.getProductsByCategory(selectedCategory)
          if (response && Array.isArray(response.data)) {
            setProducts(response.data);
          } else {
            console.error("Unexpected products API response format:", response);
            setProducts([]);
          }
        } catch (error) {
          console.error("Error fetching products:", error)
          setProducts([]);
          toast({
            variant: "destructive",
            title: "Lỗi",
            description: "Không thể tải danh sách sản phẩm",
          })
        }
      }
      
      fetchProducts()
    } else {
      setProducts([])
    }
  }, [selectedCategory, toast])

  // Handle form submission for new supply
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    const formData = new FormData(event.currentTarget)
    const supplyData = {
      category: formData.get("category") as string,
      product: formData.get("product") as string,
      expectedQuantity: Number(formData.get("quantity")),
      expectedHarvestDate: formData.get("date") ? 
        new Date(formData.get("date") as string).toISOString().split("T")[0] : 
        new Date().toISOString().split("T")[0],
      note: formData.get("notes") as string,
    }
    
    try {
      await suppliesApi.create(supplyData)
      
      toast({
        title: "Thành công",
        description: "Đã thêm nguồn nhập mới",
      })
      
      // Refresh supply list
      const updatedResponse = await suppliesApi.getAll()
      setSupplies(updatedResponse.data)
      
    } catch (error) {
      console.error("Error creating supply:", error)
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi tạo nguồn nhập mới",
      })
    }
  }

  // Filter supplies by search query - with safety checks
  const filteredSupplies = supplies && Array.isArray(supplies) ? supplies.filter(supply => {
    if (!supply || !supply.product || !supply.unit || !supply.category || !supply.status) {
      return false;
    }
    
    const searchLower = searchQuery.toLowerCase()
    return (
      supply.product.name?.toLowerCase().includes(searchLower) ||
      supply.unit.name?.toLowerCase().includes(searchLower) ||
      supply.category.name?.toLowerCase().includes(searchLower) ||
      supply.status?.toLowerCase().includes(searchLower)
    )
  }) : [];

  // Render loading state
  if (loading) {
    return (
      <div className="container">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-[#b45f06]">QUẢN LÝ NGUỒN NHẬP</h2>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-[#b45f06]" />
            <span className="ml-2">Đang tải dữ liệu...</span>
          </div>
        </div>
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className="container">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-[#b45f06]">QUẢN LÝ NGUỒN NHẬP</h2>
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Lỗi</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#b45f06]">QUẢN LÝ NGUỒN NHẬP</h2>

        <Tabs defaultValue="list" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Danh sách nguồn nhập</TabsTrigger>
            <TabsTrigger value="add">Thêm nguồn nhập mới</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2 items-center">
                <Input 
                  placeholder="Tìm kiếm..." 
                  className="w-64" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Danh sách nguồn nhập</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Truyền session vào SuppliesTable */}
                <SuppliesTable session={session} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle>Thêm nguồn nhập mới</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleFormSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="category" className="font-medium">
                        Phân loại
                      </label>
                      <Select 
                        name="category" 
                        onValueChange={(value) => setSelectedCategory(value)}
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
                    <div className="space-y-2">
                      <label htmlFor="product" className="font-medium">
                        Tên hàng
                      </label>
                      <Select name="product" disabled={!selectedCategory || products.length === 0}>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedCategory ? 
                            (products.length > 0 ? "Chọn tên hàng" : "Không có sản phẩm") : 
                            "Chọn phân loại trước"} 
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product._id} value={product._id}>
                              {product.name} ({product.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="quantity" className="font-medium">
                        Số lượng
                      </label>
                      <Input id="quantity" name="quantity" type="number" placeholder="Nhập số lượng" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="date" className="font-medium">
                        Ngày thu hoạch
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP", { locale: vi }) : "Chọn ngày"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar 
                            mode="single" 
                            selected={date} 
                            onSelect={(date) => {
                              setDate(date)
                              // Set form input value
                              const input = document.createElement('input')
                              input.type = 'hidden'
                              input.name = 'date'
                              input.value = date ? date.toISOString().split('T')[0] : ''
                              document.querySelector('form')?.appendChild(input)
                            }}
                            initialFocus 
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="notes" className="font-medium">
                      Ghi chú
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      className="w-full min-h-[100px] p-2 border border-gray-300 rounded-md"
                      placeholder="Nhập ghi chú (nếu có)"
                    ></textarea>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" type="button">Hủy</Button>
                    <Button type="submit">Lưu</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
