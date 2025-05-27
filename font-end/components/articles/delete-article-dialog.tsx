"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertTriangle } from "lucide-react"

interface Article {
  id: string
  title: string
  content: string
  type: "article" | "image" | "video"
  imageUrl?: string
  videoUrl?: string
  author: string
  createdAt: string
  status: "published" | "draft"
}

interface DeleteArticleDialogProps {
  article: Article | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteArticleDialog({ article, open, onOpenChange, onConfirm }: DeleteArticleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Xác nhận xóa bài viết
          </DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>

        {article && (
          <div className="py-4">
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="font-medium text-sm">Tiêu đề:</p>
              <p className="text-sm text-gray-600">{article.title}</p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            Xóa bài viết
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
