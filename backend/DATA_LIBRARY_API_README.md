# THƯ VIỆN DỮ LIỆU - API Documentation

## Tổng quan

Backend API cho Thư viện dữ liệu hỗ trợ 5 bảng dữ liệu chính của hệ thống quản lý hậu cần quân sự:

1. **Units** (Đơn vị) - `/api/units`
2. **Categories** (Phân loại) - `/api/categories`  
3. **Products** (LTTP - Chất đốt) - `/api/products`
4. **Dishes** (Món ăn) - `/api/dishes`
5. **Daily Rations** (Định lượng ăn) - `/api/daily-rations`

## Authentication

Tất cả API endpoints đều yêu cầu authentication token trong header:

```
Authorization: Bearer <token>
```

## Role-based Access Control

- **Public** (với auth): GET endpoints
- **Admin + Brigade Assistant**: POST, PATCH endpoints
- **Admin only**: DELETE endpoints

---

## 1. UNITS API

### GET /api/units
Lấy danh sách tất cả đơn vị

**Response:**
```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "_id": "...",
      "name": "Tiểu đoàn 1",
      "code": "TD01",
      "personnel": 150,
      "commander": "Thiếu tá Nguyễn Văn A",
      "contact": "0987654321",
      "description": "Tiểu đoàn bộ binh số 1",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /api/units
Tạo đơn vị mới

**Request Body:**
```json
{
  "name": "Tiểu đoàn 4",
  "code": "TD04",
  "personnel": 140,
  "commander": "Thiếu tá Hoàng Văn E",
  "contact": "0987654325",
  "description": "Tiểu đoàn bộ binh số 4"
}
```

### GET /api/units/:id
Lấy thông tin đơn vị theo ID

### PATCH /api/units/:id
Cập nhật thông tin đơn vị

### DELETE /api/units/:id
Xóa đơn vị (Admin only)

---

## 2. CATEGORIES API

### GET /api/categories
Lấy danh sách phân loại với số lượng items

**Response:**
```json
{
  "success": true,
  "count": 6,
  "data": [
    {
      "_id": "...",
      "name": "Rau củ quả",
      "slug": "rau-cu-qua",
      "description": "Các loại rau xanh, củ quả tươi",
      "itemCount": 3,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /api/categories
Tạo phân loại mới

**Request Body:**
```json
{
  "name": "Đồ uống",
  "slug": "do-uong", // Optional, auto-generated if not provided
  "description": "Các loại đồ uống"
}
```

### GET /api/categories/:id
Lấy thông tin phân loại theo ID

### PATCH /api/categories/:id
Cập nhật phân loại

### DELETE /api/categories/:id
Xóa phân loại (Admin only)

---

## 3. PRODUCTS API (LTTP Items)

### GET /api/products
Lấy danh sách LTTP với phân trang và filter

**Query Parameters:**
- `page`: Trang (default: 1)
- `limit`: Số items per page (default: 10)
- `category`: Filter theo category ID

**Response:**
```json
{
  "success": true,
  "count": 9,
  "totalCount": 9,
  "totalPages": 1,
  "currentPage": 1,
  "data": [
    {
      "_id": "...",
      "name": "Rau cải",
      "categoryId": "...",
      "categoryName": "Rau củ quả",
      "unit": "kg",
      "description": "Rau cải xanh tươi",
      "nutritionalValue": "Vitamin A, C",
      "storageCondition": "Bảo quản lạnh 2-4°C",
      "category": {
        "_id": "...",
        "name": "Rau củ quả"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /api/products
Tạo LTTP mới

**Request Body:**
```json
{
  "name": "Khoai tây",
  "category": "category_id",
  "unit": "kg",
  "description": "Khoai tây tươi",
  "nutritionalValue": "Carbohydrate, Vitamin C",
  "storageCondition": "Nơi khô ráo, thoáng mát"
}
```

### GET /api/products/:id
Lấy thông tin LTTP theo ID

### PATCH /api/products/:id
Cập nhật LTTP

### DELETE /api/products/:id
Xóa LTTP (Admin only)

---

## 4. DISHES API

### GET /api/dishes
Lấy danh sách món ăn với phân trang và filter

**Query Parameters:**
- `page`: Trang (default: 1)
- `limit`: Số items per page (default: 10)
- `category`: Filter theo category
- `lttpId`: Filter theo nguyên liệu

**Response:**
```json
{
  "success": true,
  "count": 3,
  "totalCount": 3,
  "totalPages": 1,
  "currentPage": 1,
  "data": [
    {
      "_id": "...",
      "name": "Thịt lợn kho",
      "description": "Món thịt lợn kho đậm đà",
      "servings": 10,
      "preparationTime": 45,
      "difficulty": "medium",
      "category": "Món mặn",
      "ingredients": [
        {
          "lttpId": "...",
          "lttpName": "Thịt lợn",
          "quantity": 1.5,
          "unit": "kg",
          "notes": "Thái miếng vừa"
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /api/dishes
Tạo món ăn mới

**Request Body:**
```json
{
  "name": "Cà ri gà",
  "description": "Món cà ri gà thơm ngon",
  "servings": 8,
  "preparationTime": 60,
  "difficulty": "medium",
  "category": "Món mặn",
  "ingredients": [
    {
      "lttpId": "product_id",
      "lttpName": "Thịt gà",
      "quantity": 1.2,
      "unit": "kg",
      "notes": "Thái miếng vừa"
    }
  ]
}
```

### GET /api/dishes/:id
Lấy thông tin món ăn theo ID

### GET /api/dishes/by-ingredient/:lttpId
Lấy danh sách món ăn theo nguyên liệu

### PATCH /api/dishes/:id
Cập nhật món ăn

### DELETE /api/dishes/:id
Xóa món ăn (Admin only)

---

## 5. DAILY RATIONS API

### GET /api/daily-rations
Lấy danh sách định lượng ăn với phân trang và filter

**Query Parameters:**
- `page`: Trang (default: 1)
- `limit`: Số items per page (default: 10)
- `category`: Filter theo category
- `lttpId`: Filter theo LTTP

**Response:**
```json
{
  "success": true,
  "count": 6,
  "totalCount": 6,
  "totalPages": 1,
  "currentPage": 1,
  "data": [
    {
      "_id": "...",
      "name": "Gạo tẻ",
      "lttpId": "...",
      "lttpName": "Gạo tẻ",
      "quantityPerPerson": 0.6,
      "unit": "kg",
      "pricePerUnit": 25000,
      "totalCostPerPerson": 15000,
      "category": "Lương thực",
      "notes": "Khẩu phần chính",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /api/daily-rations
Tạo định lượng ăn mới

**Request Body:**
```json
{
  "name": "Thịt gà",
  "lttpId": "product_id",
  "lttpName": "Thịt gà",
  "quantityPerPerson": 0.12,
  "unit": "kg",
  "pricePerUnit": 160000,
  "category": "Thịt",
  "notes": "Protein bổ sung"
}
```

### GET /api/daily-rations/:id
Lấy thông tin định lượng ăn theo ID

### GET /api/daily-rations/by-category/:category
Lấy danh sách định lượng ăn theo phân loại

### GET /api/daily-rations/total-cost
Tính tổng chi phí hàng ngày

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCostPerPerson": 57880,
    "itemCount": 6,
    "standardBudget": 65000,
    "budgetStatus": "within_budget"
  }
}
```

### PATCH /api/daily-rations/:id
Cập nhật định lượng ăn

### DELETE /api/daily-rations/:id
Xóa định lượng ăn (Admin only)

---

## Data Relationships

### Categories → Products
```
Categories (1) ←→ (N) Products
```

### Products → Dishes
```
Products (N) ←→ (N) Dishes (through ingredients array)
```

### Products → Daily Rations
```
Products (1) ←→ (N) Daily Rations
```

### Units → Users/Supplies
```
Units (1) ←→ (N) Users
Units (1) ←→ (N) Supplies
```

---

## Error Handling

Tất cả API endpoints sử dụng consistent error format:

```json
{
  "success": false,
  "message": "Error message in Vietnamese",
  "statusCode": 400
}
```

### Common Error Codes:
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

---

## Database Collections

### units
```javascript
{
  _id: ObjectId,
  name: String,
  code: String,
  personnel: Number,
  commander: String,
  contact: String,
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

### categories
```javascript
{
  _id: ObjectId,
  name: String,
  slug: String,
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

### products
```javascript
{
  _id: ObjectId,
  name: String,
  category: ObjectId, // Reference to categories
  unit: String,
  description: String,
  nutritionalValue: String,
  storageCondition: String,
  createdAt: Date,
  updatedAt: Date
}
```

### dishes
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  servings: Number,
  preparationTime: Number,
  difficulty: String, // "easy", "medium", "hard"
  category: String,
  ingredients: [
    {
      lttpId: String, // Reference to products
      lttpName: String,
      quantity: Number,
      unit: String,
      notes: String
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### dailyRations
```javascript
{
  _id: ObjectId,
  name: String,
  lttpId: String, // Reference to products
  lttpName: String,
  quantityPerPerson: Number,
  unit: String,
  pricePerUnit: Number,
  totalCostPerPerson: Number, // Auto-calculated
  category: String,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Seeding Data

Để seed dữ liệu mẫu:

```bash
cd backend
node scripts/seed-data-library.js
```

Script sẽ tạo:
- 4 đơn vị mẫu
- 6 phân loại cơ bản
- 9 sản phẩm LTTP
- 3 món ăn mẫu
- 6 định lượng ăn (tổng 57,880 VND/người/ngày)

---

## Testing APIs

### Using curl:

```bash
# Get all categories
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/categories

# Create new product
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Khoai tây","category":"category_id","unit":"kg"}' \
  http://localhost:5000/api/products

# Get daily rations total cost
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/daily-rations/total-cost
```

### Using Postman:

Import collection từ `/docs/postman/` (nếu có) hoặc tạo requests theo documentation trên.

---

## Performance Notes

- **Pagination**: Tất cả list endpoints đều hỗ trợ pagination
- **Indexing**: Đã tạo indexes cho các trường thường query
- **Aggregation**: Sử dụng MongoDB aggregation cho complex queries
- **Caching**: Có thể implement Redis caching cho frequently accessed data

---

## Security

- **Authentication**: JWT token required
- **Authorization**: Role-based access control
- **Validation**: Input validation cho tất cả endpoints
- **Sanitization**: MongoDB injection protection
- **Rate Limiting**: Có thể implement nếu cần

---

## Monitoring & Logging

- **Error Logging**: Tất cả errors được log với timestamp
- **Request Logging**: Optional request logging middleware
- **Health Check**: `/health` endpoint (nếu cần)
- **Metrics**: Có thể integrate với monitoring tools

---

## Deployment

### Environment Variables:
```
MONGODB_URI=mongodb://localhost:27017/military-logistics
JWT_SECRET=your-secret-key
PORT=5000
NODE_ENV=production
```

### Docker:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

---

## Changelog

### v1.0.0 (Current)
- ✅ Units API với đầy đủ CRUD
- ✅ Categories API với slug và itemCount
- ✅ Products API với nutritionalValue và storageCondition
- ✅ Dishes API với ingredients management
- ✅ Daily Rations API với cost calculation
- ✅ Data seeding script
- ✅ Role-based access control
- ✅ Comprehensive error handling

### Planned Features:
- [ ] Excel import/export endpoints
- [ ] Bulk operations
- [ ] Advanced search & filtering
- [ ] Data validation rules
- [ ] Audit trail
- [ ] API rate limiting
- [ ] Caching layer
- [ ] Real-time notifications 