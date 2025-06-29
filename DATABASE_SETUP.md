# 🗄️ Database Setup Guide

## Hướng dẫn thiết lập cơ sở dữ liệu chi tiết cho hệ thống quản lý hậu cần quân sự

### 📋 Tổng quan

Hệ thống đã được tạo cơ sở dữ liệu toàn diện với:

- **Models chi tiết**: LTTP Items, Inventory, Distribution, Processing Stations
- **Controllers đầy đủ**: CRUD operations với validation
- **Routes API**: RESTful endpoints với authentication
- **Seed Data**: Dữ liệu mẫu thực tế cho testing

### 🚀 Cách thiết lập

#### 1. Chuẩn bị
```bash
cd backend
npm install
```

#### 2. Cấu hình môi trường
Tạo file `.env` hoặc cập nhật:
```env
MONGODB_URI=mongodb://localhost:27017/military-logistics
JWT_SECRET=your-secret-key
NODE_ENV=development
```

#### 3. Chạy database seed

**Cách 1: Seed đơn giản (Khuyến nghị)**
```bash
npm run seed
```

**Cách 2: Seed toàn diện**
```bash
npm run seed:comprehensive
```

**Cách 3: Xóa và tạo lại database**
```bash
npm run clear-db
npm run seed
```

### 📊 Dữ liệu được tạo

#### 👥 Users (Tài khoản đăng nhập)
- **Admin**: admin@military.gov.vn / admin123
- **Manager**: manager@military.gov.vn / admin123

#### 🏢 Units (Đơn vị)
- Tiểu đoàn 1 (150 người)
- Tiểu đoàn 2 (135 người)  
- Tiểu đoàn 3 (140 người)
- Lữ đoàn bộ (45 người)

#### 📦 LTTP Items (14 mặt hàng)
- **Thực phẩm**: Gạo, thịt heo, thịt gà, cá tra, trứng gà, đậu nành
- **Rau củ**: Cà chua, rau cải, bắp cải
- **Gia vị**: Muối, đường, nước mắm, dầu ăn
- **Chất đốt**: Gas LPG

#### 🏭 Processing Data (30 ngày dữ liệu)
- **Đậu phụ**: 30 records với carry-over logic
- **Muối nén**: 30 records với yield calculations

### 🔧 API Endpoints mới

#### LTTP Items
```
GET    /api/lttp/items              # Lấy danh sách LTTP
POST   /api/lttp/items              # Tạo mặt hàng mới
GET    /api/lttp/items/:id          # Chi tiết mặt hàng
PUT    /api/lttp/items/:id          # Cập nhật mặt hàng
DELETE /api/lttp/items/:id          # Xóa mặt hàng
GET    /api/lttp/items/categories   # Danh sách phân loại
GET    /api/lttp/items/units        # Danh sách đơn vị tính
```

#### LTTP Inventory
```
GET    /api/lttp/inventory          # Tồn kho theo ngày
GET    /api/lttp/inventory/range    # Tồn kho theo khoảng thời gian
POST   /api/lttp/inventory          # Tạo/cập nhật tồn kho
GET    /api/lttp/inventory/summary  # Tổng quan tồn kho
GET    /api/lttp/inventory/expiry-alerts # Cảnh báo hết hạn
```

### 🏗️ Cấu trúc Models

#### LTTPItem (Mặt hàng LTTP)
```typescript
{
  name: string              // Tên mặt hàng
  category: string          // Phân loại
  unit: string              // Đơn vị tính
  unitPrice: number         // Giá đơn vị
  description: string       // Mô tả
  nutritionalInfo: {        // Thông tin dinh dưỡng
    calories, protein, fat, carbs, fiber
  }
  storageRequirements: {    // Yêu cầu bảo quản
    temperature, humidity, shelfLife
  }
  supplier: {               // Nhà cung cấp
    name, contact, address
  }
}
```

#### LTTPInventory (Tồn kho)
```typescript
{
  date: Date                // Ngày
  lttpItemId: ObjectId      // Mặt hàng
  previousDay: {            // Chuyển từ ngày trước
    quantity, amount, expiryDate
  }
  input: {                  // Nhập trong ngày
    quantity, amount, notes, receivedBy
  }
  output: {                 // Xuất trong ngày
    quantity, amount, distributedTo[], notes
  }
  endOfDay: {               // Tồn cuối ngày
    quantity, amount, expiryDate
  }
  status: string            // Trạng thái: Tốt/Bình thường/Sắp hết hạn
  alerts: []                // Cảnh báo
}
```

#### LTTPDistribution (Phân bổ)
```typescript
{
  date: Date                // Ngày phân bổ
  lttpItemId: ObjectId      // Mặt hàng
  totalSuggestedQuantity: number // Tổng đề nghị
  unit1, unit2, unit3, ceremonyUnit: {
    suggestedQuantity, actualQuantity, amount
    status, distributedAt, notes
  }
  overallStatus: string     // Trạng thái tổng thể
  approvalFlow: {           // Quy trình phê duyệt
    requestedBy, approvedBy, rejectedBy
  }
}
```

### 🔍 Testing

Sau khi seed data, có thể test:

1. **Login**: POST `/api/auth/login`
2. **Get LTTP Items**: GET `/api/lttp/items`
3. **Processing Data**: GET `/api/processing-station/tofu/daily`

### 🛠️ Development Tips

#### Thêm dữ liệu mới
```javascript
// Thêm LTTP item
const newItem = {
  name: "Sản phẩm mới",
  category: "Thực phẩm",
  unit: "Kg", 
  unitPrice: 50000,
  description: "Mô tả sản phẩm"
}
```

#### Tạo carry-over data
```javascript
// Logic carry-over tự động
const surplus = Math.max(0, previousInput - previousOutput)
// Surplus sẽ tự động chuyển sang ngày hôm sau
```

### ⚡ Performance

- **Indexes**: Đã tạo indexes cho date, lttpItemId, category
- **Aggregation**: Sử dụng MongoDB aggregation cho reports
- **Pagination**: Built-in pagination cho large datasets

### 🔒 Security

- **Authentication**: JWT-based với role permissions
- **Validation**: Input validation với express-validator
- **Authorization**: Role-based access control (admin, stationManager, user)

### 📈 Monitoring

Các endpoints để monitoring:
- `/api/lttp/inventory/summary` - Tổng quan tồn kho
- `/api/lttp/inventory/expiry-alerts` - Cảnh báo hết hạn
- Processing station statistics

### 🐛 Troubleshooting

**Lỗi kết nối MongoDB:**
```bash
# Kiểm tra MongoDB đang chạy
sudo systemctl status mongod

# Hoặc start MongoDB
sudo systemctl start mongod
```

**Seed fails:**
```bash
# Clear và seed lại
npm run clear-db
npm run seed
```

**API errors:**
- Kiểm tra JWT token trong headers
- Verify user permissions
- Check request body format

---

### 🎯 Kết luận

Cơ sở dữ liệu đã sẵn sàng với:
- ✅ Models đầy đủ và chi tiết
- ✅ Controllers với business logic
- ✅ API routes authenticated
- ✅ Seed data thực tế
- ✅ Carry-over functionality
- ✅ Inventory management
- ✅ Distribution workflow

**Ready for production use!** 🚀 