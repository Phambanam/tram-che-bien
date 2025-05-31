"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, User, Edit, Trash2 } from "lucide-react"
import { ArticleDialog } from "@/components/articles/article-dialog"
import { DeleteArticleDialog } from "@/components/articles/delete-article-dialog"

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

export default function ArticleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockArticles: Article[] = [
      {
        id: "1",
        title: "Lữ đoàn 279 đạt thành tích xuất sắc trong huấn luyện",
        content: `Trong tháng vừa qua, Lữ đoàn 279 đã hoàn thành xuất sắc các nhiệm vụ huấn luyện được giao. Với tinh thần đoàn kết, quyết tâm cao, toàn thể cán bộ, chiến sĩ đã nỗ lực phấn đấu, vượt qua mọi khó khăn để đạt được những thành tích đáng ghi nhận.

Các hoạt động huấn luyện được tổ chức một cách bài bản, khoa học, đảm bảo chất lượng và hiệu quả. Đặc biệt, các bài tập chiến thuật, kỹ thuật được thực hiện nghiêm túc, đúng quy trình, góp phần nâng cao trình độ chuyên môn, nghiệp vụ cho cán bộ, chiến sĩ.

Thành tích này không chỉ thể hiện sự nỗ lực của từng cá nhân mà còn là kết quả của sự phối hợp chặt chẽ giữa các đơn vị, các phòng ban trong toàn Lữ đoàn. Đây cũng là động lực để Lữ đoàn 279 tiếp tục phấn đấu, hoàn thành tốt các nhiệm vụ được giao trong thời gian tới.`,
        type: "article",
        imageUrl: "/placeholder.svg?height=400&width=600",
        author: "Thiếu tá Nguyễn Văn A",
        createdAt: "2024-01-15",
        status: "published",
      },
      {
        id: "2",
        title: "Hội thi đơn vị nuôi quân giỏi năm 2024",
        content: `Cuộc thi đánh giá chất lượng công tác hậu cần và quản lý quân nhu của các đơn vị trong Lữ đoàn 279 đã diễn ra thành công tốt đẹp. Đây là hoạt động thường niên nhằm nâng cao chất lượng công tác hậu cần, đảm bảo đời sống vật chất và tinh thần cho cán bộ, chiến sĩ.

Cuộc thi bao gồm nhiều nội dung như: đánh giá chất lượng bữa ăn, vệ sinh an toàn thực phẩm, quản lý kho tàng, sử dụng tiết kiệm nguyên vật liệu. Các đơn vị tham gia đều thể hiện tinh thần thi đua sôi nổi, tích cực cải tiến phương pháp làm việc.

Kết quả cuộc thi đã tuyên dương những đơn vị có thành tích xuất sắc, đồng thời rút ra những kinh nghiệm quý báu để áp dụng rộng rãi trong toàn Lữ đoàn. Điều này góp phần nâng cao chất lượng công tác hậu cần, tạo điều kiện tốt nhất cho việc huấn luyện và sinh hoạt của cán bộ, chiến sĩ.`,
        type: "article",
        imageUrl: "/placeholder.svg?height=400&width=600",
        author: "Đại úy Trần Thị B",
        createdAt: "2024-01-10",
        status: "published",
      },
      {
        id: "3",
        title: "Video giới thiệu trạm chế biến thực phẩm",
        content: `Video giới thiệu quy trình chế biến thực phẩm tại trạm chế biến của Lữ đoàn 279. Trạm chế biến được trang bị đầy đủ thiết bị hiện đại, đảm bảo vệ sinh an toàn thực phẩm theo tiêu chuẩn quân đội.

Quy trình chế biến được thực hiện nghiêm túc, từ khâu tiếp nhận nguyên liệu, sơ chế, chế biến đến bảo quản và phân phối. Đội ngũ cán bộ, chiến sĩ làm việc tại trạm đều được đào tạo chuyên nghiệp, có kinh nghiệm trong công tác chế biến thực phẩm.

Video này không chỉ giới thiệu về cơ sở vật chất mà còn thể hiện tinh thần trách nhiệm cao của những người làm công tác hậu cần, luôn đặt sức khỏe của cán bộ, chiến sĩ lên hàng đầu.`,
        type: "video",
        videoUrl: "https://example.com/video.mp4",
        author: "Trung úy Lê Văn C",
        createdAt: "2024-01-05",
        status: "published",
      },
    ]

    const foundArticle = mockArticles.find((a) => a.id === params.id)
    setTimeout(() => {
      setArticle(foundArticle || null)
      setIsLoading(false)
    }, 500)
  }, [params.id])

  const handleSaveArticle = (articleData: Partial<Article>) => {
    if (article) {
      setArticle({ ...article, ...articleData })
      setIsEditDialogOpen(false)
    }
  }

  const handleDeleteArticle = () => {
    setIsDeleteDialogOpen(false)
    router.push("/dashboard")
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
      <div className="container mx-auto py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="container mx-auto py-6">
        <Button variant="outline" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">Không tìm thấy bài viết</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Chỉnh sửa
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Xóa
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={article.status === "published" ? "default" : "secondary"}>
              {getTypeIcon(article.type)}{" "}
              {article.type === "article" ? "Bài viết" : article.type === "video" ? "Video" : "Hình ảnh"}
            </Badge>
            <Badge variant="outline">{article.status === "published" ? "Đã xuất bản" : "Bản nháp"}</Badge>
          </div>
          <CardTitle className="text-2xl">{article.title}</CardTitle>
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
        </CardHeader>
        <CardContent>
          {article.imageUrl && (
            <div className="mb-6">
              <img
                src={article.imageUrl || "/placeholder.svg"}
                alt={article.title}
                className="w-full max-w-2xl mx-auto rounded-lg shadow-md"
              />
            </div>
          )}

          {article.videoUrl && (
            <div className="mb-6">
              <div className="bg-gray-100 p-8 rounded-lg text-center">
                <div className="text-6xl mb-4">🎥</div>
                <p className="text-lg font-medium mb-2">Video</p>
                <p className="text-sm text-gray-600 mb-4">URL: {article.videoUrl}</p>
                <Button variant="outline">Xem video</Button>
              </div>
            </div>
          )}

          <div className="prose max-w-none">
            {article.content.split("\n\n").map((paragraph, index) => (
              <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>

      <ArticleDialog
        article={article}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveArticle}
      />

      <DeleteArticleDialog
        article={article}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteArticle}
      />
    </div>
  )
}
