"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Eye, Edit, Trash2, Calendar, User, Shield } from "lucide-react"
import Link from "next/link"
import { ArticleDialog } from "./articles/article-dialog"
import { DeleteArticleDialog } from "./articles/delete-article-dialog"
import { contentApi } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth/auth-provider"

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

// API service for articles
const articleService = {
  async getAll(type?: string) {
    return contentApi.getContent(type)
  },

  async getById(id: string) {
    return contentApi.getContentById(id)
  },

  async create(data: Partial<Article>) {
    return contentApi.createContent(data)
  },

  async update(id: string, data: Partial<Article>) {
    return contentApi.updateContent(id, data)
  },

  async delete(id: string) {
    return contentApi.deleteContent(id)
  },
}

export function DashboardContent() {
  const [articles, setArticles] = useState<Article[]>([])
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()

  // Kiểm tra quyền admin (Trợ lý lữ đoàn)
  const isAdmin = user?.role === "brigadeAssistant" || user?.role === "admin"

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        // Try to fetch from API first
        const data = await articleService.getAll()
        if (data && Array.isArray(data)) {
          setArticles(data)
        } else {
          // Fallback to mock data if API returns unexpected format
          setArticles(getMockArticles())
        }
      } catch (error) {
        console.error("Error fetching articles:", error)
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu bài viết. Vui lòng thử lại sau.",
          variant: "destructive",
        })
        setArticles(getMockArticles())
      } finally {
        setIsLoading(false)
      }
    }

    fetchArticles()
  }, [toast])

  // Mock data function
  const getMockArticles = (): Article[] => {
    return [
      {
        id: "1",
        title: "Lữ đoàn 279 đạt thành tích xuất sắc trong huấn luyện",
        content: "Trong tháng vừa qua, Lữ đoàn 279 đã hoàn thành xuất sắc các nhiệm vụ huấn luyện được giao...",
        type: "article",
        imageUrl: "/placeholder.svg?height=200&width=300",
        author: "Thiếu tá Nguyễn Văn A",
        createdAt: "2024-01-15",
        status: "published",
      },
      {
        id: "2",
        title: "Hội thi đơn vị nuôi quân giỏi năm 2024",
        content: "Cuộc thi đánh giá chất lượng công tác hậu cần và quản lý quân nhu của các đơn vị...",
        type: "article",
        imageUrl: "/placeholder.svg?height=200&width=300",
        author: "Đại úy Trần Thị B",
        createdAt: "2024-01-10",
        status: "published",
      },
      {
        id: "3",
        title: "Video giới thiệu trạm chế biến thực phẩm",
        content: "Video giới thiệu quy trình chế biến thực phẩm tại trạm chế biến của Lữ đoàn 279...",
        type: "video",
        videoUrl: "https://example.com/video.mp4",
        author: "Trung úy Lê Văn C",
        createdAt: "2024-01-05",
        status: "published",
      },
    ]
  }

  const handleAddArticle = () => {
    setSelectedArticle(null)
    setIsArticleDialogOpen(true)
  }

  const handleEditArticle = (article: Article) => {
    setSelectedArticle(article)
    setIsArticleDialogOpen(true)
  }

  const handleDeleteArticle = (article: Article) => {
    setSelectedArticle(article)
    setIsDeleteDialogOpen(true)
  }

  const handleSaveArticle = async (articleData: Partial<Article>) => {
    try {
      if (selectedArticle) {
        // Update existing article
        await articleService.update(selectedArticle.id, articleData)
        setArticles((prev) =>
          prev.map((article) =>
            article.id === selectedArticle.id
              ? { ...article, ...articleData, updatedAt: new Date().toISOString() }
              : article,
          ),
        )
        toast({
          title: "Thành công",
          description: "Cập nhật bài viết thành công",
        })
      } else {
        // Add new article
        const newArticleData: Partial<Article> = {
          ...articleData,
          author: "Current User", // Replace with actual user
          createdAt: new Date().toISOString(),
          status: "published" as const,
        }

        const response = await articleService.create(newArticleData)
        const newArticle = (response as any)?.data || {
          id: Date.now().toString(),
          ...newArticleData,
        } as Article

        setArticles((prev) => [newArticle, ...prev])
        toast({
          title: "Thành công",
          description: "Thêm bài viết mới thành công",
        })
      }
    } catch (error) {
      console.error("Error saving article:", error)
      toast({
        title: "Lỗi",
        description: "Không thể lưu bài viết. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    }
    setIsArticleDialogOpen(false)
  }

  const handleConfirmDelete = async () => {
    if (selectedArticle) {
      try {
        await articleService.delete(selectedArticle.id)
        setArticles((prev) => prev.filter((article) => article.id !== selectedArticle.id))
        toast({
          title: "Thành công",
          description: "Xóa bài viết thành công",
        })
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
      <div className="container">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((item) => (
                <div key={item} className="border border-gray-300 p-4 rounded-md">
                  <div className="bg-gray-200 h-40 mb-4 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full p-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-center text-[#b45f06]">TRANG CHÍNH</h2>
          <div className="flex items-center gap-3">
            {!isAdmin && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                <Shield className="h-4 w-4" />
                <span>Chế độ xem</span>
              </div>
            )}
            {isAdmin && (
              <Button onClick={handleAddArticle} className="bg-[#b45f06] hover:bg-[#8b4513]">
                <Plus className="h-4 w-4 mr-2" />
                Thêm bài viết
              </Button>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">GIỚI THIỆU LỮ ĐOÀN 279</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="mb-4">
                Lữ đoàn 279 là một đơn vị quân đội tinh nhuệ thuộc Quân khu 7, được thành lập vào năm 1975. Với truyền
                thống vẻ vang và nhiều thành tích xuất sắc trong công tác huấn luyện, sẵn sàng chiến đấu và xây dựng đơn
                vị vững mạnh toàn diện.
              </p>
              <p className="mb-4">
                Hệ thống quản lý trạm chế biến là một phần quan trọng trong công tác hậu cần của Lữ đoàn, đảm bảo chất
                lượng bữa ăn và sức khỏe cho cán bộ, chiến sĩ trong đơn vị.
              </p>
              
              {/* Thông báo quyền hạn */}
              <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                <h4 className="font-semibold text-blue-800 mb-2">📋 Quyền hạn hệ thống:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li><strong>• Trợ lý lữ đoàn (Admin):</strong> Thêm, sửa, xóa bài viết</li>
                  <li><strong>• Các chức vụ khác:</strong> Chỉ được xem chi tiết bài viết</li>
                  <li><strong>• Vai trò hiện tại:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                      isAdmin ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {isAdmin ? 'Quản trị viên' : 'Người xem'}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="bg-gray-200 h-64 flex items-center justify-center rounded-lg">
              <img
                src="/anh.jpg"
                alt="Hình ảnh Lữ đoàn 279"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">
            CÁC BÀI VIẾT, HÌNH ẢNH, VIDEO GIỚI THIỆU LỮ ĐOÀN 279 VÀ HỘI THI ĐƠN VỊ NUÔI QUÂN GIỎI, QUẢN LÝ QUÂN NHU TỐT
          </h3>

          {articles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Chưa có bài viết nào</p>
              {isAdmin && (
                <Button onClick={handleAddArticle} className="bg-[#b45f06] hover:bg-[#8b4513]">
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm bài viết đầu tiên
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <Card key={article.id} className="border border-gray-300 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant={article.status === "published" ? "default" : "secondary"}>
                        {getTypeIcon(article.type)}{" "}
                        {article.type === "article" ? "Bài viết" : article.type === "video" ? "Video" : "Hình ảnh"}
                      </Badge>
                      {isAdmin && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditArticle(article)}
                            className="h-8 w-8 p-0"
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteArticle(article)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-lg leading-tight">{article.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {article.imageUrl && (
                      <div className="bg-gray-200 h-40 mb-4 flex items-center justify-center rounded-md overflow-hidden">
                        <img
                          src={article.imageUrl || "/placeholder.svg"}
                          alt={article.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    {article.videoUrl && (
                      <div className="bg-gray-200 h-40 mb-4 flex items-center justify-center rounded-md">
                        <div className="text-center">
                          <div className="text-4xl mb-2">🎥</div>
                          <p className="text-sm text-gray-600">Video</p>
                        </div>
                      </div>
                    )}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {article.content.replace(/[#*_`~\[\]()]/g, '').replace(/<[^>]*>/g, '').slice(0, 150)}
                      {article.content.length > 150 ? '...' : ''}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{article.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(article.createdAt).toLocaleDateString("vi-VN")}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/articles/${article.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          Xem chi tiết
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <ArticleDialog
        article={selectedArticle}
        open={isArticleDialogOpen}
        onOpenChange={setIsArticleDialogOpen}
        onSave={handleSaveArticle}
      />

      <DeleteArticleDialog
        article={selectedArticle}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
