"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Tên đơn vị không được để trống",
  }),
  description: z.string().optional(),
})

interface UnitFormProps {
  unitId?: string
  defaultValues?: {
    name: string
    description: string
  }
  onSuccess?: () => void
  onCancel?: () => void
}

export function UnitForm({ unitId, defaultValues, onSuccess, onCancel }: UnitFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!unitId

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      name: "",
      description: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      const url = isEditing ? `/api/units/${unitId}` : "/api/units"
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
              <FormLabel>Tên đơn vị</FormLabel>
              <FormControl>
                <Input placeholder="Nhập tên đơn vị" {...field} />
              </FormControl>
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
