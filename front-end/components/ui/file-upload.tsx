"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, Image, Video, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface FileUploadProps {
  accept?: "image" | "video" | "both"
  onFileUpload: (url: string) => void
  currentUrl?: string
  className?: string
  label?: string
}

export function FileUpload({ 
  accept = "both", 
  onFileUpload, 
  currentUrl, 
  className = "",
  label = "Upload file"
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{url: string, type: string} | null>(
    currentUrl ? { url: currentUrl, type: currentUrl.includes('/images/') ? 'image' : 'video' } : null
  )
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const getAcceptTypes = () => {
    switch (accept) {
      case "image":
        return "image/*"
      case "video":
        return "video/*"
      case "both":
        return "image/*,video/*"
      default:
        return "image/*,video/*"
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    
    if (accept === "image" && !isImage) {
      toast({
        title: "Lỗi",
        description: "Chỉ chấp nhận file hình ảnh",
        variant: "destructive",
      })
      return
    }
    
    if (accept === "video" && !isVideo) {
      toast({
        title: "Lỗi", 
        description: "Chỉ chấp nhận file video",
        variant: "destructive",
      })
      return
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      toast({
        title: "Lỗi",
        description: "File quá lớn. Kích thước tối đa là 50MB",
        variant: "destructive",
      })
      return
    }

    await uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)

      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        const fileInfo = {
          url: data.data.url,
          type: data.data.type
        }
        setUploadedFile(fileInfo)
        onFileUpload(data.data.url)
        toast({
          title: "Thành công",
          description: "Upload file thành công",
        })
      } else {
        throw new Error(data.message || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Lỗi",
        description: "Không thể upload file. Vui lòng thử lại",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    onFileUpload("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const renderFilePreview = () => {
    if (!uploadedFile) return null

    if (uploadedFile.type === 'image') {
      return (
        <div className="relative mt-2">
          <img
            src={uploadedFile.url}
            alt="Preview"
            className="max-w-full h-32 object-cover rounded border"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-1 right-1 h-6 w-6 p-0"
            onClick={handleRemoveFile}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )
    } else {
      return (
        <div className="relative mt-2 p-3 border rounded bg-gray-50 flex items-center gap-2">
          <Video className="h-5 w-5 text-gray-600" />
          <span className="text-sm text-gray-600 flex-1">Video đã upload</span>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleRemoveFile}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )
    }
  }

  return (
    <div className={className}>
      <Label className="text-sm font-medium">{label}</Label>
      
      {!uploadedFile ? (
        <div className="mt-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept={getAcceptTypes()}
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
          />
          
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full h-24 border-dashed border-2 flex flex-col items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-sm">Đang upload...</span>
              </>
            ) : (
              <>
                {accept === "image" ? (
                  <Image className="h-6 w-6 text-gray-400" />
                ) : accept === "video" ? (
                  <Video className="h-6 w-6 text-gray-400" />
                ) : (
                  <Upload className="h-6 w-6 text-gray-400" />
                )}
                <span className="text-sm text-gray-600">
                  Click để chọn {accept === "image" ? "hình ảnh" : accept === "video" ? "video" : "file"}
                </span>
                <span className="text-xs text-gray-400">
                  Tối đa 50MB
                </span>
              </>
            )}
          </Button>
        </div>
      ) : (
        renderFilePreview()
      )}
    </div>
  )
} 