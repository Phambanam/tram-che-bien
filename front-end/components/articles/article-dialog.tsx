"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { FileUpload } from "@/components/ui/file-upload"
import { MultiImageUpload } from "@/components/ui/multi-image-upload"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { Image, FileText, Video } from "lucide-react"

interface UploadedImage {
  id: string
  url: string
  name: string
  uploadedAt: string
}

interface Article {
  id: string
  title: string
  content: string
  type: "article" | "image" | "video"
  imageUrl?: string
  videoUrl?: string
  images?: UploadedImage[]
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
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>(article?.images || [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const editorRef = useRef<any>(null)
  const { toast } = useToast()

  // Reset form when dialog opens/closes or article changes
  useEffect(() => {
    if (open && article) {
      setTitle(article.title)
      setContent(article.content)
      setType(article.type)
      setImageUrl(article.imageUrl || "")
      setVideoUrl(article.videoUrl || "")
      setUploadedImages(article.images || [])
    } else if (open && !article) {
      // New article
      setTitle("")
      setContent("")
      setType("article")
      setImageUrl("")
      setVideoUrl("")
      setUploadedImages([])
    }
  }, [open, article])

  const handleInsertImage = (imageUrl: string, imageName: string) => {
    if (editorRef.current?.insertImageAtCursor) {
      editorRef.current.insertImageAtCursor(imageUrl, imageName)
    } else {
      // Fallback: append to end of content
      const imageMarkdown = `![${imageName}](${imageUrl})\n`
      setContent(prev => prev + '\n' + imageMarkdown)
    }
  }

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

      if (type === "image" && !imageUrl.trim() && uploadedImages.length === 0) {
        toast({
          title: "Lỗi",
          description: "Vui lòng chọn hình ảnh hoặc upload ảnh vào thư viện",
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
        images: uploadedImages,
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
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{article ? "Chỉnh sửa bài viết" : "Thêm bài viết mới"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
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
                    <Label htmlFor="article" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Bài viết
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="image" id="image" />
                    <Label htmlFor="image" className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Hình ảnh
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="video" id="video" />
                    <Label htmlFor="video" className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Video
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="content">Nội dung</TabsTrigger>
                  <TabsTrigger value="media">Phương tiện & Thư viện ảnh</TabsTrigger>
                </TabsList>
                
                <TabsContent value="content" className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="content">Nội dung bài viết</Label>
                    <RichTextEditor
                      ref={editorRef}
                      value={content}
                      onChange={setContent}
                      placeholder="Nhập nội dung bài viết (hỗ trợ Markdown)"
                      className="min-h-[200px]"
                    />
                    <p className="text-xs text-gray-500">
                      💡 Tip: Vào tab "Phương tiện & Thư viện ảnh" để upload ảnh và chèn vào nội dung
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="media" className="space-y-4">
                  {type === "image" && (
                    <div className="grid gap-2">
                      <FileUpload
                        accept="image"
                        label="Ảnh đại diện (cho bài viết loại hình ảnh)"
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

                  <div className="border-t pt-4">
                    <MultiImageUpload
                      initialImages={uploadedImages}
                      onImagesChange={setUploadedImages}
                      onInsertImage={handleInsertImage}
                      label="Thư viện ảnh cho nội dung"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      📸 Upload nhiều ảnh và click vào nút "chèn" trên ảnh để thêm vào nội dung, hoặc click "copy" để copy markdown
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          
          <DialogFooter className="border-t pt-4">
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
