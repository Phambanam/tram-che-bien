"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { User } from "@/lib/api-client"

const formSchema = z.object({
  unit: z.string().optional(), // Only for admin
  category: z.string({
    required_error: "Vui lòng chọn phân loại",
  }),
  product: z.string({
    required_error: "Vui lòng chọn sản phẩm",
  }),
  expectedQuantity: z.string().min(1, {
    message: "Vui lòng nhập số lượng dự kiến",
  }),
  expectedHarvestDate: z.string().min(1, {
    message: "Vui lòng chọn ngày thu hoạch dự kiến",
  }),
  note: z.string().optional(),
})

interface Unit {
  _id: string
  name: string
}

interface Category {
  _id: string
  name: string
}

interface Product {
  _id: string
  name: string
  category: string
  unit: string
}

interface UserInfo {
  id: string
  name: string
  username: string
  role: string
  unit: string
}

export function SupplyForm({ supplyId }: { supplyId?: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [units, setUnits] = useState<Unit[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchingData, setFetchingData] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [userInfo, setUserInfo] = useState<User | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      unit: "",
      category: "",
      product: "",
      expectedQuantity: "",
      expectedHarvestDate: new Date().toISOString().split("T")[0],
      note: "",
    },
  })

  const selectedCategory = form.watch("category")

  // Lấy thông tin người dùng từ JWT token
  useEffect(() => {
    const getUserInfoFromToken = () => {
      try {
        const payload = localStorage.getItem("user")
        if (!payload) return null
        const user: User = JSON.parse(payload)
        
       
        
        setUserInfo(user)
        console.log("User info extracted from JWT:", user)
        return user
      } catch (error) {
        console.error("Error extracting user info from token:", error)
        return null
      }
    }

    getUserInfoFromToken()
  }, [])

  useEffect(() => {
    // Đợi thông tin người dùng được lấy từ token
    if (!userInfo) return

    // Kiểm tra quyền truy cập
    if (userInfo.role !== "admin" && userInfo.role !== "unitAssistant") {
      toast({
        variant: "destructive",
        title: "Không có quyền truy cập",
        description: "Bạn không có quyền thêm hoặc chỉnh sửa nguồn nhập",
      })
      router.push("/dashboard/supplies")
      return
    }

    const fetchData = async () => {
      setFetchingData(true)
      setError(null)

      try {
        // Fetch units (only for admin)
        if (userInfo.role === "admin") {
          const unitsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/units`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          })
          
          if (!unitsResponse.ok) {
            throw new Error("Không thể tải danh sách đơn vị")
          }
          
          const unitsData = await unitsResponse.json()
          setUnits(unitsData.data || unitsData)
        }

        // If editing, fetch supply details
        if (supplyId) {
          setIsEditing(true)
          const supplyResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/supplies/${supplyId}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
              },
            },
          )

          if (!supplyResponse.ok) {
            const errorData = await supplyResponse.json()
            throw new Error(errorData.message || "Không thể tải thông tin nguồn nhập")
          }

          const supplyData = await supplyResponse.json()

          // Kiểm tra quyền chỉnh sửa
          if (userInfo.role === "unitAssistant" && supplyData.unit._id !== userInfo.unit) {
            throw new Error("Bạn chỉ có thể chỉnh sửa nguồn nhập của đơn vị mình")
          }

          // Kiểm tra trạng thái
          if (supplyData.status !== "pending") {
            throw new Error("Chỉ có thể chỉnh sửa nguồn nhập ở trạng thái chờ phê duyệt")
          }

          form.setValue("unit", supplyData.unit._id)
          form.setValue("category", supplyData.category._id)
          setSelectedCategory(supplyData.category._id)
          form.setValue("expectedQuantity", supplyData.expectedQuantity.toString())
          form.setValue("expectedHarvestDate", new Date(supplyData.expectedHarvestDate).toISOString().split("T")[0])
          form.setValue("note", supplyData.note || "")
          
          // Need to fetch products for this category first, then set the product
          const productsResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/supplies/products/${supplyData.category._id}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
              },
            }
          )
          
          if (!productsResponse.ok) {
            throw new Error("Không thể tải danh sách sản phẩm")
          }
          
          const productsData = await productsResponse.json()
          setFilteredProducts(productsData.data || productsData)
          form.setValue("product", supplyData.product._id)
        }

        // Fetch categories
        const categoriesResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/supplies/categories`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          },
        )

        if (!categoriesResponse.ok) {
          throw new Error("Không thể tải danh sách phân loại")
        }

        const categoriesData = await categoriesResponse.json()
        setCategories(categoriesData.data || categoriesData)
      } catch (error) {
        console.error("Error fetching data:", error)
        setError(error instanceof Error ? error.message : "Đã xảy ra lỗi khi tải dữ liệu")
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi tải dữ liệu",
        })
      } finally {
        setFetchingData(false)
      }
    }

    fetchData()
  }, [supplyId, form, userInfo, router, toast])

  // Filter products when category changes
  useEffect(() => {
    const fetchProducts = async () => {
      if (selectedCategory) {
        try {
          const productsResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/supplies/products/${selectedCategory}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
              },
            },
          )

          if (!productsResponse.ok) {
            throw new Error("Không thể tải danh sách sản phẩm")
          }

          const productsData = await productsResponse.json()
          setFilteredProducts(productsData.data || productsData)
          form.setValue("product", "") // Reset product selection
        } catch (error) {
          console.error("Error fetching products:", error)
          toast({
            variant: "destructive",
            title: "Lỗi",
            description: "Không thể tải danh sách sản phẩm",
          })
        }
      } else {
        setFilteredProducts([])
      }
    }

    fetchProducts()
  }, [selectedCategory, form, toast])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)

    try {
      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/supplies/${supplyId}`
        : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/supplies`
      const method = isEditing ? "PATCH" : "POST"

      // Prepare data
      const submitData = {
        category: values.category,
        product: values.product,
        expectedQuantity: Number(values.expectedQuantity),
        expectedHarvestDate: values.expectedHarvestDate,
        note: values.note,
      }

      // Add unit for admin
      if (userInfo?.role === "admin" && values.unit) {
        Object.assign(submitData, { unit: values.unit })
      }

      console.log(`${method} request to ${url} with data:`, submitData)

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `Đã xảy ra lỗi khi ${isEditing ? "cập nhật" : "thêm mới"} nguồn nhập`)
      }

      toast({
        title: isEditing ? "Cập nhật thành công" : "Thêm mới thành công",
        description: data.message,
      })
      router.push("/dashboard/supplies")
      router.refresh()
    } catch (error) {
      console.error(`Error ${isEditing ? "updating" : "creating"} supply:`, error)
      setError(
        error instanceof Error ? error.message : `Đã xảy ra lỗi khi ${isEditing ? "cập nhật" : "thêm mới"} nguồn nhập`,
      )
      toast({
        variant: "destructive",
        title: isEditing ? "Cập nhật thất bại" : "Thêm mới thất bại",
        description: error instanceof Error ? error.message : "Đã xảy ra lỗi",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Đang tải dữ liệu...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Lỗi</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={() => router.push("/dashboard/supplies")}>
            Quay lại
          </Button>
        </div>
      </Alert>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Unit selection - only for admin */}
        {userInfo?.role === "admin" && (
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tên đơn vị</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn đơn vị" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit._id} value={unit._id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phân loại</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value)
                    form.setValue("product", "")
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phân loại" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="product"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tên LTTP - Chất đốt</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedCategory}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn sản phẩm" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredProducts.map((product) => (
                      <SelectItem key={product._id} value={product._id}>
                        {product.name} ({product.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="expectedQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Số lượng dự kiến cung cấp</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Nhập số lượng" {...field} />
                </FormControl>
                <FormDescription>
                  {selectedCategory && form.watch("product") && (
                    <>Đơn vị tính: {filteredProducts.find((p) => p._id === form.watch("product"))?.unit || ""}</>
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expectedHarvestDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ngày thu hoạch dự kiến</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ghi chú</FormLabel>
              <FormControl>
                <Textarea placeholder="Nhập ghi chú (nếu có)" className="resize-none" {...field} />
              </FormControl>
              <FormDescription>Thông tin bổ sung về nguồn nhập (nếu có)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/supplies")}>
            Hủy
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Đang cập nhật" : "Đang lưu"}
              </>
            ) : isEditing ? (
              "Cập nhật"
            ) : (
              "Lưu"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
