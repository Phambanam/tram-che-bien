"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Tên sản phẩm không được để trống",
  }),
  category: z.string().min(1, {
    message: "Vui lòng chọn phân loại",
  }),
  unit: z.string().min(1, {
    message: "Vui lòng chọn đơn vị tính",
  }),
  description: z.string().optional(),
})

interface Category {
  _id: string
  name: string
}

interface ProductFormProps {
  productId?: string
  defaultValues?: {
    name: string
    category: string
    unit: string
    description: string
  }
  onSuccess?: () => void
  onCancel?: () => void
}

export function ProductForm({ productId, defaultValues, onSuccess, onCancel }: ProductFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const isEditing = !!productId

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      name: "",
      category: "",
      unit: "kg",
      description: "",
    },
  })

  useEffect(() => {
    // Fetch categories
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories")
        if (response.ok) {
          const data = await response.json()
          setCategories(data)
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
      }
    }

    fetchCategories()
  }, [])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      const url = isEditing ? `/api/products/${productId}` : "/api/products"
      const method = isEditing ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: isEditing ? "Cập nhật thành công" : "Thêm mới thành công",
          description: data.message,
        })
        if (onSuccess) {
          onSuccess()
        } else {
          router.push("/dashboard/library")
          router.refresh()
        }
      } else {
        toast({
          variant: "destructive",
          title: isEditing ? "Cập nhật thất bại" : "Thêm mới thất bại",
          description: data.message,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: isEditing ? "Cập nhật thất bại" : "Thêm mới thất bại",
        description: "Đã xảy ra lỗi",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên sản phẩm</FormLabel>
              <FormControl>
                <Input placeholder="Nhập tên sản phẩm" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phân loại</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn phân loại" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories
                    .filter(category => category._id && category._id.trim() !== "")
                    .map((category) => (
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
          name="unit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Đơn vị tính</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn đơn vị tính" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="con">con</SelectItem>
                  <SelectItem value="quả">quả</SelectItem>
                  <SelectItem value="bó">bó</SelectItem>
                  <SelectItem value="gói">gói</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mô tả</FormLabel>
              <FormControl>
                <Textarea placeholder="Nhập mô tả (nếu có)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Hủy
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Đang cập nhật" : "Đang thêm"}
              </>
            ) : isEditing ? (
              "Cập nhật"
            ) : (
              "Thêm mới"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
