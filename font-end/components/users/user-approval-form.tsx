"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface UserApprovalFormProps {
  userId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function UserApprovalForm({ userId, onSuccess, onCancel }: UserApprovalFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  async function handleApprove() {
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
      console.log(`Approving user with ID: ${userId}`)

      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "active",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Đã xảy ra lỗi khi phê duyệt tài khoản")
      }

      toast({
        title: "Phê duyệt thành công",
        description: data.message || "Đã phê duyệt tài khoản người dùng",
      })

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/dashboard/users")
        router.refresh()
      }
    } catch (error) {
      console.error("Error approving user:", error)
      toast({
        variant: "destructive",
        title: "Phê duyệt thất bại",
        description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi phê duyệt",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleReject() {
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
      console.log(`Rejecting user with ID: ${userId}`)

      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "rejected",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Đã xảy ra lỗi khi từ chối tài khoản")
      }

      toast({
        title: "Từ chối thành công",
        description: data.message || "Đã từ chối tài khoản người dùng",
      })

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/dashboard/users")
        router.refresh()
      }
    } catch (error) {
      console.error("Error rejecting user:", error)
      toast({
        variant: "destructive",
        title: "Từ chối thất bại",
        description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi từ chối",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex justify-end space-x-2">
      <Button type="button" variant="outline" onClick={onCancel}>
        Hủy
      </Button>
      <Button type="button" variant="destructive" onClick={handleReject} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang xử lý
          </>
        ) : (
          "Từ chối"
        )}
      </Button>
      <Button type="button" onClick={handleApprove} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang xử lý
          </>
        ) : (
          "Phê duyệt"
        )}
      </Button>
    </div>
  )
}
