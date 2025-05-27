# Military Logistics Backend API

Backend API cho Hệ thống Quản lý Nguồn Nhập Quân Nhu sử dụng Express.js, TypeScript và MongoDB.

## Tính năng

- Xác thực và phân quyền người dùng
- Quản lý đơn vị, phân loại, sản phẩm
- Quản lý nguồn nhập quân nhu
- Báo cáo thống kê
- API RESTful

## Yêu cầu hệ thống

- Node.js v14.0.0 trở lên
- MongoDB v4.4 trở lên
- npm hoặc yarn

## Cài đặt

1. Clone repository:
\`\`\`bash
git clone https://github.com/your-username/military-logistics-backend.git
cd military-logistics-backend
\`\`\`

2. Cài đặt các phụ thuộc:
\`\`\`bash
npm install
# hoặc
yarn install
\`\`\`

3. Tạo file .env từ .env.example và cấu hình các biến môi trường:
\`\`\`bash
cp .env.example .env
\`\`\`

4. Khởi chạy ứng dụng:
\`\`\`bash
# Chế độ phát triển
npm run dev
# hoặc
yarn dev

# Chế độ sản xuất
npm run build
npm start
# hoặc
yarn build
yarn start
\`\`\`

## Cấu trúc API

### Xác thực

- `POST /api/auth/register` - Đăng ký người dùng mới
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin người dùng hiện tại

### Người dùng

- `GET /api/users` - Lấy danh sách người dùng
- `GET /api/users/:id` - Lấy thông tin người dùng theo ID
- `PATCH /api/users/:id` - Cập nhật thông tin người dùng
- `DELETE /api/users/:id` - Xóa người dùng

### Đơn vị

- `GET /api/units` - Lấy danh sách đơn vị
- `POST /api/units` - Tạo đơn vị mới
- `GET /api/units/:id` - Lấy thông tin đơn vị theo ID
- `PATCH /api/units/:id` - Cập nhật thông tin đơn vị
- `DELETE /api/units/:id` - Xóa đơn vị

### Phân loại

- `GET /api/categories` - Lấy danh sách phân loại
- `POST /api/categories` - Tạo phân loại mới
- `GET /api/categories/:id` - Lấy thông tin phân loại theo ID
- `PATCH /api/categories/:id` - Cập nhật thông tin phân loại
- `DELETE /api/categories/:id` - Xóa phân loại

### Sản phẩm

- `GET /api/products` - Lấy danh sách sản phẩm
- `POST /api/products` - Tạo sản phẩm mới
- `GET /api/products/:id` - Lấy thông tin sản phẩm theo ID
- `PATCH /api/products/:id` - Cập nhật thông tin sản phẩm
- `DELETE /api/products/:id` - Xóa sản phẩm

### Nguồn nhập

- `GET /api/supplies` - Lấy danh sách nguồn nhập
- `POST /api/supplies` - Tạo nguồn nhập mới
- `GET /api/supplies/:id` - Lấy thông tin nguồn nhập theo ID
- `PATCH /api/supplies/:id` - Cập nhật thông tin nguồn nhập
- `PATCH /api/supplies/:id/approve` - Phê duyệt nguồn nhập
- `DELETE /api/supplies/:id` - Xóa nguồn nhập

### Báo cáo

- `GET /api/reports/by-unit` - Báo cáo theo đơn vị
- `GET /api/reports/by-category` - Báo cáo theo phân loại
- `GET /api/reports/detailed` - Báo cáo chi tiết

## Phân quyền

- **Admin**: Có toàn quyền trong hệ thống
- **Brigade Assistant**: Có quyền phê duyệt nguồn nhập, quản lý thư viện dữ liệu
- **Unit Assistant**: Có quyền thêm, sửa, xóa nguồn nhập của đơn vị mình
- **Commander**: Có quyền xem báo cáo và thông tin nguồn nhập

## Môi trường triển khai

- Development: Môi trường phát triển cục bộ
- Staging: Môi trường kiểm thử trước khi triển khai
- Production: Môi trường sản phẩm chính thức

## Giấy phép

[MIT](LICENSE)
