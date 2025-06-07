"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, User, Edit, Trash2, Home } from "lucide-react"
import { ArticleDialog } from "@/components/articles/article-dialog"
import { DeleteArticleDialog } from "@/components/articles/delete-article-dialog"
import { contentApi } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"
import ReactMarkdown from "react-markdown"
import "@/styles/markdown.css"

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

export default function ArticleDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [article, setArticle] = useState<Article | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const data = await contentApi.getContentById(params.id)
        setArticle(data)
      } catch (error) {
        console.error("Error fetching article:", error)
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin bài viết. Vui lòng thử lại sau.",
          variant: "destructive",
        })
        // Fallback to mock data
        setArticle({
          id: params.id,
          title: "Lữ đoàn 279 đạt thành tích xuất sắc trong huấn luyện",
          content: `Trong tháng vừa qua, Lữ đoàn 279 đã hoàn thành xuất sắc các nhiệm vụ huấn luyện được giao. Các đơn vị trong Lữ đoàn đã tích cực tham gia các hoạt động huấn luyện, nâng cao trình độ chiến đấu và sẵn sàng thực hiện nhiệm vụ khi được giao.
          
          Đặc biệt, Tiểu đoàn 1 đã đạt được kết quả xuất sắc trong cuộc thi bắn súng toàn quân, với nhiều chiến sĩ đạt danh hiệu xạ thủ xuất sắc. Tiểu đoàn 2 cũng đã hoàn thành tốt các bài tập chiến thuật phức tạp trong điều kiện địa hình khó khăn.
          
          Thành tích này là kết quả của sự nỗ lực không ngừng của toàn thể cán bộ, chiến sĩ trong Lữ đoàn, cũng như sự quan tâm, chỉ đạo sát sao của Ban chỉ huy Lữ đoàn và cấp trên.`,
          type: "article",
          imageUrl: "/placeholder.svg?height=400&width=600",
          author: "Thiếu tá Nguyễn Văn A",
          createdAt: "2024-01-15",
          status: "published",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchArticle()
  }, [params.id, toast])

  const handleEditArticle = () => {
    setIsArticleDialogOpen(true)
  }

  const handleDeleteArticle = () => {
    setIsDeleteDialogOpen(true)
  }

  const handleSaveArticle = async (articleData: Partial<Article>) => {
    try {
      if (article) {
        await contentApi.updateContent(article.id, articleData)
        setArticle({ ...article, ...articleData })
        toast({
          title: "Thành công",
          description: "Cập nhật bài viết thành công",
        })
      }
    } catch (error) {
      console.error("Error updating article:", error)
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật bài viết. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    }
    setIsArticleDialogOpen(false)
  }

  const handleConfirmDelete = async () => {
    try {
      if (article) {
        await contentApi.deleteContent(article.id)
        toast({
          title: "Thành công",
          description: "Xóa bài viết thành công",
        })
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Error deleting article:", error)
      toast({
        title: "Lỗi",
        description: "Không thể xóa bài viết. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    }
    setIsDeleteDialogOpen(false)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return "🎥"
      case "image":
        return "🖼️"
      default:
        return "📄"
    }
  }

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="container py-8">
        <Card className="p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Không tìm thấy bài viết</h2>
            <p className="mb-6">Bài viết này có thể đã bị xóa hoặc không tồn tại.</p>
            <Button onClick={() => router.push("/dashboard")}>
              <Home className="mr-2 h-4 w-4" />
              Về trang chủ
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
        <button 
          onClick={() => router.push("/dashboard")} 
          className="hover:text-blue-600 flex items-center gap-1"
        >
          <Home className="h-4 w-4" />
          Trang chủ
        </button>
        <span>/</span>
        <span className="text-gray-800 font-medium">Chi tiết bài viết</span>
      </nav>
      
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Về trang chủ
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEditArticle}>
            <Edit className="mr-2 h-4 w-4" />
            Chỉnh sửa
          </Button>
          <Button variant="outline" className="text-red-600" onClick={handleDeleteArticle}>
            <Trash2 className="mr-2 h-4 w-4" />
            Xóa
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <Badge variant={article.status === "published" ? "default" : "secondary"}>
              {getTypeIcon(article.type)}{" "}
              {article.type === "article" ? "Bài viết" : article.type === "video" ? "Video" : "Hình ảnh"}
            </Badge>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{article.author}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(article.createdAt).toLocaleDateString("vi-VN")}</span>
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
        </div>

        {article.imageUrl && (
          <div className="mb-6">
            <img
              src={article.imageUrl || "/placeholder.svg"}
              alt={article.title}
              className="w-full max-h-[400px] object-cover rounded-lg"
            />
          </div>
        )}

        {article.videoUrl && (
          <div className="mb-6 aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-2">🎥</div>
              <p className="text-gray-600">Video URL: {article.videoUrl}</p>
            </div>
          </div>
        )}

        <div className="prose max-w-none">
          <ReactMarkdown className="markdown-content">
            {article.content}
          </ReactMarkdown>
        </div>
      </Card>

      <ArticleDialog
        article={article}
        open={isArticleDialogOpen}
        onOpenChange={setIsArticleDialogOpen}
        onSave={handleSaveArticle}
      />

      <DeleteArticleDialog
        article={article}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
