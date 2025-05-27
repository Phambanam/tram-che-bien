"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  role: z.string().min(1, {
    message: "Vui lòng chọn vai trò",
  }),
})

interface UserRoleFormProps {
  userId: string
  currentRole: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function UserRoleForm({ userId, currentRole, onSuccess, onCancel }: UserRoleFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: currentRole,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "ID người dùng không hợp lệ",
      })
      return
    }

    setIsLoading(true)

    try {
      console.log(`Updating role for user with ID: ${userId} to ${values.role}`)

      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: values.role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Đã xảy ra lỗi khi cập nhật vai trò")
      }

      toast({
        title: "Cập nhật vai trò thành công",
        description: data.message || "Đã cập nhật vai trò người dùng",
      })

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/dashboard/users")
        router.refresh()
      }
    } catch (error) {
      console.error("Error updating role:", error)
      toast({
        variant: "destructive",
        title: "Cập nhật vai trò thất bại",
        description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi cập nhật vai trò",
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
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vai trò</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="brigadeAssistant">Trợ lý Lữ đoàn</SelectItem>
                  <SelectItem value="unitAssistant">Trợ lý hậu cần Tiểu đoàn</SelectItem>
                  <SelectItem value="commander">Chỉ huy</SelectItem>
                </SelectContent>
              </Select>
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
                Đang cập nhật
              </>
            ) : (
              "Cập nhật"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
