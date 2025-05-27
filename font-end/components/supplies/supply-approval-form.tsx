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
  stationEntryDate: z.string().min(1, {
    message: "Vui lòng chọn ngày nhập trạm",
  }),
  receivedQuantity: z.string().min(1, {
    message: "Vui lòng nhập số lượng nhận",
  }),
  note: z.string().optional(),
})

interface SupplyApprovalFormProps {
  supplyId: string
  onSuccess?: () => void
  onCancel?: () => void
  expectedQuantity: number
}

export function SupplyApprovalForm({ supplyId, onSuccess, onCancel, expectedQuantity }: SupplyApprovalFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      stationEntryDate: new Date().toISOString().split("T")[0],
      receivedQuantity: expectedQuantity.toString(),
      note: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/supplies/${supplyId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          status: "approved",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Phê duyệt thành công",
          description: data.message || "Đã phê duyệt nguồn nhập",
        })
        if (onSuccess) {
          onSuccess()
        } else {
          router.push("/dashboard/supplies")
          router.refresh()
        }
      } else {
        toast({
          variant: "destructive",
          title: "Phê duyệt thất bại",
          description: data.message,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Phê duyệt thất bại",
        description: "Đã xảy ra lỗi khi phê duyệt",
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
          name="stationEntryDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ngày nhập trạm</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="receivedQuantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Số lượng nhận (kg)</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ghi chú</FormLabel>
              <FormControl>
                <Textarea placeholder="Nhập ghi chú (nếu có)" {...field} />
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
                Đang phê duyệt
              </>
            ) : (
              "Phê duyệt"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
