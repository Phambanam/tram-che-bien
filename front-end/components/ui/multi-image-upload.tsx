"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, Image, Loader2, Copy, Check } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { uploadApi } from "@/lib/api-client"

interface UploadedImage {
  id: string
  url: string
  name: string
  uploadedAt: string
}

interface MultiImageUploadProps {
  onImagesChange: (images: UploadedImage[]) => void
  onInsertImage?: (imageUrl: string, imageName: string) => void
  initialImages?: UploadedImage[]
  className?: string
  label?: string
}

export function MultiImageUpload({ 
  onImagesChange,
  onInsertImage,
  initialImages = [],
  className = "",
  label = "Thư viện ảnh"
}: MultiImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>(initialImages)
  const [isUploading, setIsUploading] = useState(false)
  const [copiedImageId, setCopiedImageId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    // Validate file types
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    if (imageFiles.length !== files.length) {
      toast({
        title: "Lỗi",
        description: "Chỉ chấp nhận file hình ảnh",
        variant: "destructive",
      })
      return
    }

    // Validate file sizes (10MB max per file)
    const maxSize = 10 * 1024 * 1024
    const oversizedFiles = imageFiles.filter(file => file.size > maxSize)
    if (oversizedFiles.length > 0) {
      toast({
        title: "Lỗi",
        description: `${oversizedFiles.length} file quá lớn. Kích thước tối đa là 10MB/file`,
        variant: "destructive",
      })
      return
    }

    await uploadFiles(imageFiles)
  }

  const uploadFiles = async (files: File[]) => {
    setIsUploading(true)
    
    try {
      const uploadPromises = files.map(async (file) => {
        const data = await uploadApi.uploadFile(file)
        if (data.success) {
          return {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            url: data.data.url,
            name: file.name,
            uploadedAt: new Date().toISOString()
          }
        }
        throw new Error(data.message || 'Upload failed')
      })

      const uploadedImages = await Promise.all(uploadPromises)
      const newImages = [...images, ...uploadedImages]
      
      setImages(newImages)
      onImagesChange(newImages)
      
      toast({
        title: "Thành công",
        description: `Upload thành công ${uploadedImages.length} ảnh`,
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Lỗi",
        description: "Không thể upload ảnh. Vui lòng thử lại",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = (imageId: string) => {
    const newImages = images.filter(img => img.id !== imageId)
    setImages(newImages)
    onImagesChange(newImages)
  }

  const handleCopyImageUrl = async (imageUrl: string, imageId: string) => {
    try {
      await navigator.clipboard.writeText(`![Ảnh](${imageUrl})`)
      setCopiedImageId(imageId)
      setTimeout(() => setCopiedImageId(null), 2000)
      toast({
        title: "Đã copy",
        description: "Markdown của ảnh đã được copy vào clipboard",
      })
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể copy vào clipboard",
        variant: "destructive",
      })
    }
  }

  const handleInsertImage = (imageUrl: string, imageName: string) => {
    if (onInsertImage) {
      onInsertImage(imageUrl, imageName)
      toast({
        title: "Đã chèn ảnh",
        description: "Ảnh đã được chèn vào nội dung",
      })
    }
  }

  return (
    <div className={className}>
      <Label className="text-sm font-medium">{label}</Label>
      
      {/* Upload Area */}
      <div className="mt-2 mb-4">
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
        />
        
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full h-16 border-dashed border-2 flex items-center gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Đang upload...</span>
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                Click để chọn nhiều ảnh (Ctrl/Cmd + Click)
              </span>
            </>
          )}
        </Button>
      </div>

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((image) => (
            <Card key={image.id} className="relative group">
              <CardContent className="p-2">
                <div className="aspect-square relative">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover rounded border"
                  />
                  
                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => handleCopyImageUrl(image.url, image.id)}
                      className="h-8 w-8 p-0"
                      title="Copy markdown"
                    >
                      {copiedImageId === image.id ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                    
                    {onInsertImage && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => handleInsertImage(image.url, image.name)}
                        className="h-8 w-8 p-0"
                        title="Chèn vào nội dung"
                      >
                        <Image className="h-3 w-3" />
                      </Button>
                    )}
                    
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveImage(image.id)}
                      className="h-8 w-8 p-0"
                      title="Xóa ảnh"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-xs text-gray-600 mt-1 truncate" title={image.name}>
                  {image.name}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Image className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Chưa có ảnh nào được upload</p>
        </div>
      )}
    </div>
  )
} 