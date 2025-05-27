import { MongoClient } from "mongodb"

const MONGODB_URI = "mongodb://admin:password@localhost:27017/military-logistics?authSource=admin"

const sampleContent = [
  {
    title: "Hướng dẫn quản lý nguồn nhập thực phẩm",
    type: "article",
    content: `
      <h2>Quy trình quản lý nguồn nhập thực phẩm</h2>
      <p>Việc quản lý nguồn nhập thực phẩm là một trong những khâu quan trọng nhất trong hệ thống hậu cần quân đội. Bài viết này sẽ hướng dẫn chi tiết quy trình và các bước cần thiết.</p>
      
      <h3>1. Lập kế hoạch nhập hàng</h3>
      <p>- Xác định nhu cầu thực phẩm theo định mức</p>
      <p>- Lập danh sách các mặt hàng cần thiết</p>
      <p>- Xác định thời gian và địa điểm nhập hàng</p>
      
      <h3>2. Kiểm tra chất lượng</h3>
      <p>- Kiểm tra hạn sử dụng</p>
      <p>- Đánh giá chất lượng sản phẩm</p>
      <p>- Ghi nhận số lượng thực tế</p>
      
      <h3>3. Lưu trữ và bảo quản</h3>
      <p>- Phân loại theo nhóm thực phẩm</p>
      <p>- Bảo quản đúng điều kiện</p>
      <p>- Ghi chép sổ sách đầy đủ</p>
    `,
    status: "published",
    author: {
      id: "admin",
      name: "Quản trị viên",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: "Quy định về an toàn thực phẩm trong quân đội",
    type: "article",
    content: `
      <h2>Các quy định về an toàn thực phẩm</h2>
      <p>An toàn thực phẩm là vấn đề hàng đầu trong việc đảm bảo sức khỏe cán bộ chiến sĩ. Dưới đây là các quy định cần tuân thủ nghiêm ngặt.</p>
      
      <h3>1. Quy định về nguồn gốc thực phẩm</h3>
      <p>- Chỉ sử dụng thực phẩm có nguồn gốc rõ ràng</p>
      <p>- Có giấy chứng nhận an toàn thực phẩm</p>
      <p>- Kiểm tra kỹ trước khi sử dụng</p>
      
      <h3>2. Quy định về bảo quản</h3>
      <p>- Bảo quản đúng nhiệt độ quy định</p>
      <p>- Tránh ô nhiễm chéo</p>
      <p>- Tuân thủ nguyên tắc "First In - First Out"</p>
    `,
    status: "published",
    author: {
      id: "admin",
      name: "Quản trị viên",
    },
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000),
  },
  {
    title: "Video hướng dẫn sử dụng hệ thống",
    type: "video",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    content: "Video hướng dẫn chi tiết cách sử dụng hệ thống quản lý hậu cần quân đội.",
    status: "published",
    author: {
      id: "admin",
      name: "Quản trị viên",
    },
    createdAt: new Date(Date.now() - 172800000), // 2 days ago
    updatedAt: new Date(Date.now() - 172800000),
  },
  {
    title: "Sơ đồ quy trình quản lý kho",
    type: "image",
    imageUrl: "/placeholder.svg?height=400&width=600",
    content: "Sơ đồ minh họa quy trình quản lý kho từ nhập hàng đến xuất hàng.",
    status: "published",
    author: {
      id: "admin",
      name: "Quản trị viên",
    },
    createdAt: new Date(Date.now() - 259200000), // 3 days ago
    updatedAt: new Date(Date.now() - 259200000),
  },
  {
    title: "Thông báo cập nhật hệ thống",
    type: "article",
    content: `
      <h2>Thông báo cập nhật hệ thống phiên bản 2.0</h2>
      <p>Hệ thống sẽ được cập nhật với nhiều tính năng mới vào ngày 15/6/2025.</p>
      
      <h3>Các tính năng mới:</h3>
      <ul>
        <li>Giao diện người dùng được cải thiện</li>
        <li>Tính năng báo cáo nâng cao</li>
        <li>Hỗ trợ thiết bị di động tốt hơn</li>
        <li>Tích hợp AI để dự đoán nhu cầu</li>
      </ul>
      
      <p>Vui lòng chuẩn bị cho việc cập nhật và liên hệ bộ phận kỹ thuật nếu có thắc mắc.</p>
    `,
    status: "draft",
    author: {
      id: "admin",
      name: "Quản trị viên",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

async function seedContent() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log("Connected to MongoDB")

    const db = client.db()

    // Clear existing content
    await db.collection("content").deleteMany({})
    console.log("Cleared existing content")

    // Insert sample content
    const result = await db.collection("content").insertMany(sampleContent)
    console.log(`Inserted ${result.insertedCount} content items`)

    console.log("Content seeding completed successfully!")
  } catch (error) {
    console.error("Error seeding content:", error)
  } finally {
    await client.close()
  }
}

// Run the seed function
seedContent()
