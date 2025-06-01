"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
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
import { suppliesApi, unitsApi } from "@/lib/api-client"

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

export function SupplyForm({ supplyId }: { supplyId?: string }) {
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [units, setUnits] = useState<Unit[]>([])
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchingData, setFetchingData] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])

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

  useEffect(() => {
    // Đợi session load xong
    if (sessionStatus === "loading") return

    // Kiểm tra quyền truy cập
    if (session && session.user.role !== "admin" && session.user.role !== "unitAssistant") {
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
        if (session?.user.role === "admin") {
          const unitsData = await unitsApi.getUnits()
          setUnits(unitsData)
        }

        // If editing, fetch supply details
        if (supplyId) {
          setIsEditing(true)
          const supplyData = await suppliesApi.getSupplyById(supplyId)

          // Kiểm tra quyền chỉnh sửa
          if (session && session.user.role === "unitAssistant" && supplyData.unit._id !== session.user.unit) {
            throw new Error("Bạn chỉ có thể chỉnh sửa nguồn nhập của đơn vị mình")
          }

          // Kiểm tra trạng thái
          if (supplyData.status !== "pending") {
            throw new Error("Chỉ có thể chỉnh sửa nguồn nhập ở trạng thái chờ phê duyệt")
          }

          form.setValue("unit", supplyData.unit._id)
          form.setValue("category", supplyData.category._id)
          form.setValue("product", supplyData.product._id)
          form.setValue("expectedQuantity", supplyData.expectedQuantity.toString())
          form.setValue("expectedHarvestDate", new Date(supplyData.expectedHarvestDate).toISOString().split("T")[0])
          form.setValue("note", supplyData.note || "")
        }

        const categoriesResponse = await suppliesApi.getFoodCategories()
        setCategories(categoriesResponse.data)
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
  }, [supplyId, form, session, sessionStatus, router, toast])

  // Filter products when category changes
  useEffect(() => {
    const fetchProducts = async () => {
      if (selectedCategory) {
        try {
          const productsResponse = await suppliesApi.getFoodProducts(selectedCategory)
          setFilteredProducts(productsResponse.data)
          form.setValue("product", "") // Reset product selection
        } catch (error) {
          console.error("Error fetching products:", error)
          toast({
            variant: "destructive",
            title: "Lỗi",
            description: error instanceof Error ? error.message : "Failed to fetch products",
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
      // Prepare data
      const submitData = {
        category: values.category,
        product: values.product,
        expectedQuantity: Number(values.expectedQuantity),
        expectedHarvestDate: values.expectedHarvestDate,
        note: values.note,
      }

      // Add unit for admin
      if (session?.user.role === "admin" && values.unit) {
        Object.assign(submitData, { unit: values.unit })
      }

      console.log(`${isEditing ? "PATCH" : "POST"} request with data:`, submitData)

      if (isEditing) {
        await suppliesApi.updateSupply(supplyId!, submitData)
      } else {
        await suppliesApi.createSupply(submitData)
      }

      toast({
        title: isEditing ? "Cập nhật thành công" : "Thêm mới thành công",
        description: `Đã ${isEditing ? "cập nhật" : "thêm mới"} nguồn nhập thành công`,
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
        {session?.user.role === "admin" && (
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Đơn vị</FormLabel>
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
  )
}
