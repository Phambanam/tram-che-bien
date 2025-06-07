"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { FileUpload } from "@/components/ui/file-upload"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"

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

interface ArticleDialogProps {
  article: Article | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (article: Partial<Article>) => void
}

export function ArticleDialog({ article, open, onOpenChange, onSave }: ArticleDialogProps) {
  const [title, setTitle] = useState(article?.title || "")
  const [content, setContent] = useState(article?.content || "")
  const [type, setType] = useState<"article" | "image" | "video">(article?.type || "article")
  const [imageUrl, setImageUrl] = useState(article?.imageUrl || "")
  const [videoUrl, setVideoUrl] = useState(article?.videoUrl || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Reset form when dialog opens/closes or article changes
  useEffect(() => {
    if (open && article) {
      setTitle(article.title)
      setContent(article.content)
      setType(article.type)
      setImageUrl(article.imageUrl || "")
      setVideoUrl(article.videoUrl || "")
    } else if (open && !article) {
      // New article
      setTitle("")
      setContent("")
      setType("article")
      setImageUrl("")
      setVideoUrl("")
    }
  }, [open, article])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate form
      if (!title.trim()) {
        toast({
          title: "Lỗi",
          description: "Vui lòng nhập tiêu đề bài viết",
          variant: "destructive",
        })
        return
      }

      // Strip markdown and HTML for validation
      const plainTextContent = content.replace(/[#*_`~\[\]()]/g, '').replace(/<[^>]*>/g, '').trim()
      if (!plainTextContent) {
        toast({
          title: "Lỗi",
          description: "Vui lòng nhập nội dung bài viết",
          variant: "destructive",
        })
        return
      }

      if (type === "image" && !imageUrl.trim()) {
        toast({
          title: "Lỗi",
          description: "Vui lòng chọn hình ảnh",
          variant: "destructive",
        })
        return
      }

      if (type === "video" && !videoUrl.trim()) {
        toast({
          title: "Lỗi",
          description: "Vui lòng chọn video",
          variant: "destructive",
        })
        return
      }

      const articleData: Partial<Article> = {
        title,
        content,
        type,
        ...(type === "image" && { imageUrl }),
        ...(type === "video" && { videoUrl }),
      }

      onSave(articleData)
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi lưu bài viết. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{article ? "Chỉnh sửa bài viết" : "Thêm bài viết mới"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Tiêu đề</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề bài viết"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Loại nội dung</Label>
              <RadioGroup value={type} onValueChange={(value) => setType(value as "article" | "image" | "video")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="article" id="article" />
                  <Label htmlFor="article">Bài viết</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="image" id="image" />
                  <Label htmlFor="image">Hình ảnh</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="video" id="video" />
                  <Label htmlFor="video">Video</Label>
                </div>
              </RadioGroup>
            </div>

            {type === "image" && (
              <div className="grid gap-2">
                <FileUpload
                  accept="image"
                  label="Hình ảnh"
                  currentUrl={imageUrl}
                  onFileUpload={setImageUrl}
                />
              </div>
            )}

            {type === "video" && (
              <div className="grid gap-2">
                <FileUpload
                  accept="video"
                  label="Video"
                  currentUrl={videoUrl}
                  onFileUpload={setVideoUrl}
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="content">Nội dung</Label>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Nhập nội dung bài viết"
                className="min-h-[150px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : article ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
