"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Eye, Edit, Trash2, Calendar, User } from "lucide-react"
import Link from "next/link"
import { ArticleDialog } from "./articles/article-dialog"
import { DeleteArticleDialog } from "./articles/delete-article-dialog"
import { apiClient } from "@/lib/api-client"
import { toast } from "@/hooks/use-toast"

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

// Content API
const contentApi = {
  async getAll(type?: string) {
    const params = type ? { type } : undefined;
    return apiClient.get<Article[]>('/content', params);
  },
  
  async getById(id: string) {
    return apiClient.get<Article>(`/content/${id}`);
  },
  
  async create(data: any) {
    return apiClient.post<{ contentId: string }>('/content', data);
  },
  
  async update(id: string, data: any) {
    return apiClient.patch<void>(`/content/${id}`, data);
  },
  
  async delete(id: string) {
    return apiClient.delete<void>(`/content/${id}`);
  }
}

export function DashboardContent() {
  const [articles, setArticles] = useState<Article[]>([])
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch articles from API
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await contentApi.getAll();
        if (response.success && response.data) {
          // Transform data if needed to match the Article interface
          const fetchedArticles = response.data.map(article => ({
            ...article,
            // Add any missing fields or transform API data to match UI needs
            author: article.author || "Admin",
            status: "published" // Default status if not provided by API
          }));
          setArticles(fetchedArticles);
        } else {
          // Handle empty data or error
          setArticles([]);
        }
      } catch (error) {
        console.error('Error fetching articles:', error);
        toast.error("Không thể tải dữ liệu bài viết. Vui lòng thử lại sau.");
        setArticles([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, [])

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
        await contentApi.update(selectedArticle.id, articleData)
        setArticles((prev) =>
          prev.map((article) =>
            article.id === selectedArticle.id
              ? { ...article, ...articleData, updatedAt: new Date().toISOString() }
              : article,
          ),
        )
        toast.success("Cập nhật bài viết thành công")
      } else {
        // Add new article
        const response = await contentApi.create(articleData)
        const newArticle: Article = {
          id: response.contentId,
          title: articleData.title || "",
          content: articleData.content || "",
          type: articleData.type || "article",
          imageUrl: articleData.imageUrl,
          videoUrl: articleData.videoUrl,
          author: "Current User", // Replace with actual user
          createdAt: new Date().toISOString(),
          status: "published",
        }
        setArticles((prev) => [newArticle, ...prev])
        toast.success("Thêm bài viết mới thành công")
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi. Vui lòng thử lại.")
    } finally {
      setIsArticleDialogOpen(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (selectedArticle) {
      try {
        await contentApi.delete(selectedArticle.id)
        setArticles((prev) => prev.filter((article) => article.id !== selectedArticle.id))
        toast.success("Xóa bài viết thành công")
      } catch (error) {
        toast.error("Đã xảy ra lỗi. Vui lòng thử lại.")
      } finally {
        setIsDeleteDialogOpen(false)
      }
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
    <div className="container">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-center text-[#b45f06]">TRANG CHÍNH</h2>
          <Button onClick={handleAddArticle} className="bg-[#b45f06] hover:bg-[#8b4513]">
            <Plus className="h-4 w-4 mr-2" />
            Thêm bài viết
          </Button>
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
              <p>
                Hệ thống quản lý trạm chế biến là một phần quan trọng trong công tác hậu cần của Lữ đoàn, đảm bảo chất
                lượng bữa ăn và sức khỏe cho cán bộ, chiến sĩ trong đơn vị.
              </p>
            </div>
            <div className="bg-gray-200 h-64 flex items-center justify-center rounded-lg">
              <img
                src="/placeholder.svg?height=256&width=400"
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
              <Button onClick={handleAddArticle} className="bg-[#b45f06] hover:bg-[#8b4513]">
                <Plus className="h-4 w-4 mr-2" />
                Thêm bài viết đầu tiên
              </Button>
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
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditArticle(article)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteArticle(article)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{article.content}</p>
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
