"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface SupplyApprovalFormProps {
  supplyId: string
  onSuccess?: () => void
  onCancel?: () => void
  expectedQuantity: number
  productUnit: string
  productName: string
  unitName: string
}

export function SupplyApprovalForm({ 
  supplyId, 
  onSuccess, 
  onCancel, 
  expectedQuantity,
  productUnit,
  productName,
  unitName
}: SupplyApprovalFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [stationEntryDate, setStationEntryDate] = useState(new Date().toISOString().split("T")[0])
  const [requiredQuantity, setRequiredQuantity] = useState(expectedQuantity.toString())
  const [actualQuantity, setActualQuantity] = useState("")
  const [price, setPrice] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [note, setNote] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  // Calculate total price automatically when either quantity or price changes
  const totalPrice = Number(actualQuantity) * Number(price) || 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!stationEntryDate || !requiredQuantity || !actualQuantity || !price || !expiryDate) {
      toast({
        variant: "destructive",
        title: "Vui lòng điền đầy đủ thông tin",
        description: "Tất cả các trường có dấu * là bắt buộc"
      })
      return
    }
    
    try {
      setIsLoading(true)
      
      const approvalData = {
        status: "approved",
        stationEntryDate,
        requiredQuantity: Number(requiredQuantity),
        actualQuantity: Number(actualQuantity),
        price: Number(price),
        totalPrice,
        expiryDate,
        note,
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"}/supplies/${supplyId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(approvalData),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Đã xảy ra lỗi khi phê duyệt nguồn nhập")
      }

      toast({
        title: "Phê duyệt thành công",
        description: `Đã phê duyệt nguồn nhập ${productName} từ ${unitName}`
      })
      
      // Call onSuccess callback
      if (onSuccess) {
        onSuccess()
      }
      
      router.refresh()
    } catch (error) {
      console.error("Error approving supply:", error)
      toast({
        variant: "destructive",
        title: "Phê duyệt thất bại",
        description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi phê duyệt nguồn nhập"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="stationEntryDate" className="flex items-center">
            Ngày nhập trạm <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="stationEntryDate"
            type="date"
            value={stationEntryDate}
            onChange={(e) => setStationEntryDate(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="requiredQuantity" className="flex items-center">
            Số lượng nhập yêu cầu ({productUnit}) <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="requiredQuantity"
            type="number"
            value={requiredQuantity}
            onChange={(e) => setRequiredQuantity(e.target.value)}
            required
          />
          <p className="text-sm text-muted-foreground">Số lượng dự kiến: {expectedQuantity} {productUnit}</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="actualQuantity" className="flex items-center">
            Số lượng nhập thực tế ({productUnit}) <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="actualQuantity"
            type="number"
            value={actualQuantity}
            onChange={(e) => setActualQuantity(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="price" className="flex items-center">
            Giá tiền (VNĐ/{productUnit}) <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="totalPrice">
            Thành tiền (VNĐ)
          </Label>
          <Input
            id="totalPrice"
            type="number"
            value={totalPrice.toString()}
            readOnly
            className="bg-muted"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="expiryDate" className="flex items-center">
            Hạn sử dụng <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="expiryDate"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="note">
          Ghi chú
        </Label>
        <Textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Nhập ghi chú (nếu có)"
          className="min-h-[100px] resize-none"
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Hủy
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang xử lý
            </>
          ) : (
            "Phê duyệt"
          )}
        </Button>
      </div>
    </form>
  )
}
