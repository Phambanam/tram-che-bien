"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "article" as "article" | "image" | "video",
    imageUrl: "",
    videoUrl: "",
    status: "published" as "published" | "draft",
  })

  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title,
        content: article.content,
        type: article.type,
        imageUrl: article.imageUrl || "",
        videoUrl: article.videoUrl || "",
        status: article.status,
      })
    } else {
      setFormData({
        title: "",
        content: "",
        type: "article",
        imageUrl: "",
        videoUrl: "",
        status: "published",
      })
    }
  }, [article, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{article ? "Chỉnh sửa bài viết" : "Thêm bài viết mới"}</DialogTitle>
          <DialogDescription>
            {article ? "Cập nhật thông tin bài viết" : "Tạo bài viết mới cho trang chính"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tiêu đề *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Nhập tiêu đề bài viết"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Loại nội dung *</Label>
            <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại nội dung" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="article">📄 Bài viết</SelectItem>
                <SelectItem value="image">🖼️ Hình ảnh</SelectItem>
                <SelectItem value="video">🎥 Video</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Nội dung *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange("content", e.target.value)}
              placeholder="Nhập nội dung bài viết"
              rows={6}
              required
            />
          </div>

          {(formData.type === "image" || formData.type === "article") && (
            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL Hình ảnh</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                placeholder="https://example.com/image.jpg"
                type="url"
              />
            </div>
          )}

          {formData.type === "video" && (
            <div className="space-y-2">
              <Label htmlFor="videoUrl">URL Video *</Label>
              <Input
                id="videoUrl"
                value={formData.videoUrl}
                onChange={(e) => handleInputChange("videoUrl", e.target.value)}
                placeholder="https://example.com/video.mp4"
                type="url"
                required={formData.type === "video"}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="status">Trạng thái</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Đã xuất bản</SelectItem>
                <SelectItem value="draft">Bản nháp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" className="bg-[#b45f06] hover:bg-[#8b4513]">
              {article ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
