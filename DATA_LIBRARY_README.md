# THƯ VIỆN DỮ LIỆU - Hướng dẫn sử dụng

## Tổng quan

**Thư viện dữ liệu** là phần quản lý dữ liệu cơ bản (master data) của hệ thống quản lý hậu cần quân sự. Đây là nơi lưu trữ và quản lý tất cả các thông tin tham chiếu được sử dụng trong các chức năng khác của hệ thống.

## 5 Bảng dữ liệu chính

### 1. 👥 **Bảng Đơn vị**
- **Mục đích**: Quản lý danh sách các đơn vị trong hệ thống
- **Dữ liệu**: Tiểu đoàn 1, Tiểu đoàn 2, Lữ đoàn bộ, v.v.
- **Liên kết**: Sử dụng trong nhu cầu sử dụng, báo cáo thực đơn, phân quyền
- **Thông tin bao gồm**:
  - Mã đơn vị (TD01, TD02, LDB)
  - Tên đơn vị
  - Quân số
  - Chỉ huy
  - Thông tin liên hệ

### 2. 🏷️ **Bảng Phân loại**
- **Mục đích**: Chia nguyên liệu thành các nhóm lớn
- **Các phân loại**: Rau củ quả, Thịt, Hải sản, Chất đốt, Gia vị, Lương thực
- **Chức năng**: Thêm, sửa, xóa phân loại
- **Ứng dụng**: Lọc và truy xuất dữ liệu trong dropdown của phần nhập liệu
- **Thông tin bao gồm**:
  - Tên phân loại
  - Slug (định danh)
  - Mô tả
  - Số lượng mục con

### 3. 📦 **Bảng Tên LTTP - Chất đốt**
- **Mục đích**: Chi tiết hóa từng phân loại
- **Liên kết động**: Chọn phân loại → dropdown "Tên LTTP" tự động cập nhật
- **Ví dụ**: 
  - Phân loại "Rau củ quả" → Rau cải, Cà rốt, Bí đỏ
  - Phân loại "Thịt" → Thịt lợn, Thịt bò
  - Phân loại "Chất đốt" → Gas, Than, Củi
- **Thông tin bao gồm**:
  - Tên LTTP
  - Phân loại liên kết
  - Đơn vị tính
  - Giá trị dinh dưỡng
  - Điều kiện bảo quản

### 4. 🍽️ **Bảng Món ăn**
- **Mục đích**: Quản lý các món ăn và thành phần
- **Chức năng**: 
  - Chọn nguyên liệu → hiển thị món ăn liên quan
  - Chọn món ăn → hiển thị thành phần chi tiết
- **Ví dụ**: 
  - Thịt lợn → Thịt lợn kho, Canh cải thịt bằm, Giò chả
  - Thịt lợn kho → Thịt lợn 1.5kg, Muối 0.02kg
- **Ứng dụng**: Trợ lý quân nhu chọn món → hệ thống suy ngược nguyên liệu cần xuất
- **Thông tin bao gồm**:
  - Tên món ăn
  - Mô tả
  - Số lượng phần ăn
  - Thời gian chế biến
  - Độ khó (Dễ/Trung bình/Khó)
  - Thành phần chi tiết

### 5. 🧮 **Bảng Định lượng ăn 1 người/ngày**
- **Mục đích**: Định lượng nguyên liệu chuẩn cho mỗi người/ngày
- **Mức chuẩn**: 65.000 VND/người/ngày
- **Ứng dụng**:
  - Tính số lượng nguyên liệu cần xuất
  - Tính tổng chi phí cho mỗi đơn vị
  - Lập kế hoạch mua sắm
- **Thông tin bao gồm**:
  - Tên định lượng
  - LTTP liên kết
  - Số lượng/người/ngày
  - Đơn vị tính
  - Giá/đơn vị
  - Tổng chi phí/người
  - Phân loại
  - Ghi chú

## Hướng dẫn sử dụng

### Truy cập trang
1. Đăng nhập vào hệ thống
2. Vào Dashboard → Thư viện dữ liệu
3. URL: `/dashboard/thu-vien-du-lieu`

### Điều hướng giữa các bảng
- **Tab Navigation**: 5 nút tab tương ứng với 5 bảng dữ liệu
- **Icon phân biệt**: Mỗi tab có icon riêng để dễ nhận biết
- **Responsive**: Hiển thị tốt trên mọi thiết bị

### Tìm kiếm dữ liệu
1. **Ô tìm kiếm**: Nhập từ khóa để lọc dữ liệu
2. **Tìm kiếm theo**: Tên, mã, mô tả
3. **Real-time**: Kết quả hiển thị ngay khi nhập

### Thêm mới dữ liệu
1. Nhấn nút **"Thêm mới"**
2. Điền thông tin trong dialog
3. Nhấn **"Thêm mới"** để lưu

### Chỉnh sửa dữ liệu
1. Nhấn nút **"Sửa"** tại dòng cần chỉnh sửa
2. Cập nhật thông tin trong dialog
3. Nhấn **"Cập nhật"** để lưu

### Xóa dữ liệu
1. Nhấn nút **"Xóa"** tại dòng cần xóa
2. Xác nhận trong dialog
3. Dữ liệu sẽ được xóa khỏi hệ thống

### Xuất/Nhập Excel
- **Xuất Excel**: Tải về file Excel chứa dữ liệu hiện tại
- **Nhập Excel**: Upload file Excel để import dữ liệu hàng loạt

## Luồng dữ liệu liên kết

```
Phân loại → Tên LTTP → Món ăn → Định lượng ăn
    ↓           ↓         ↓          ↓
  Filter    Dropdown   Recipe   Calculation
```

### Chi tiết luồng:
1. **Phân loại** → Tạo nhóm cho LTTP
2. **Tên LTTP** → Liên kết với phân loại, tạo dropdown động
3. **Món ăn** → Sử dụng LTTP làm nguyên liệu
4. **Định lượng ăn** → Tham chiếu LTTP để tính toán
5. **Đơn vị** → Sử dụng trong tất cả các chức năng khác

## Dữ liệu mẫu

### Đơn vị mẫu:
- Tiểu đoàn 1 (TD01) - 150 quân số
- Tiểu đoàn 2 (TD02) - 145 quân số  
- Tiểu đoàn 3 (TD03) - 148 quân số
- Lữ đoàn bộ (LDB) - 80 quân số

### Phân loại mẫu:
- Rau củ quả (25 mục)
- Thịt (15 mục)
- Hải sản (12 mục)
- Chất đốt (8 mục)
- Gia vị (20 mục)
- Lương thực (10 mục)

### Món ăn mẫu:
- Thịt lợn kho (10 phần, 45 phút, độ khó trung bình)
- Canh cải thịt bằm (10 phần, 30 phút, độ khó dễ)
- Giò chả (20 phần, 120 phút, độ khó khó)

### Định lượng mẫu (65.000 VND/người/ngày):
- Gạo tẻ: 0.6kg - 15.000 VND
- Thịt lợn: 0.15kg - 27.000 VND
- Rau cải: 0.2kg - 3.000 VND
- Cá biển: 0.1kg - 12.000 VND
- Gia vị: 0.01kg - 80 VND
- Chất đốt: 0.002 bình - 800 VND

## Tính năng kỹ thuật

### Frontend
- **Framework**: Next.js + React + TypeScript
- **UI Components**: Shadcn/ui
- **State Management**: React hooks
- **Form Handling**: Controlled components
- **Validation**: Client-side validation

### Backend Integration
- **API Endpoints**:
  - `/api/units` - Quản lý đơn vị
  - `/api/categories` - Quản lý phân loại
  - `/api/products` - Quản lý LTTP
  - `/api/dishes` - Quản lý món ăn (sắp có)
  - `/api/rations` - Quản lý định lượng ăn (sắp có)

### Tính năng nâng cao
- **Cascading Dropdowns**: Phân loại → LTTP
- **Auto-calculation**: Định lượng ăn tự động tính chi phí
- **Search & Filter**: Tìm kiếm real-time
- **CRUD Operations**: Thêm/Sửa/Xóa đầy đủ
- **Import/Export**: Excel integration

## Quyền truy cập

### Theo vai trò:
- **Quản trị viên**: Toàn quyền CRUD tất cả bảng
- **Trợ lý lữ đoàn**: Chỉnh sửa định lượng ăn, món ăn
- **Trợ lý đơn vị**: Chỉ xem dữ liệu
- **Chỉ huy**: Chỉ xem báo cáo tổng hợp

### Bảo mật:
- Authentication required
- Role-based access control
- Audit trail cho mọi thay đổi

## Roadmap phát triển

### Phase 1 (Hoàn thành) ✅
- [x] Bảng Đơn vị
- [x] Bảng Phân loại  
- [x] Bảng Tên LTTP - Chất đốt
- [x] Giao diện cơ bản

### Phase 2 (Đang phát triển) 🚧
- [ ] Bảng Món ăn với quản lý thành phần chi tiết
- [ ] Bảng Định lượng ăn với tính toán tự động
- [ ] Import/Export Excel

### Phase 3 (Kế hoạch) 📋
- [ ] API backend hoàn chỉnh
- [ ] Audit trail
- [ ] Advanced search & filter
- [ ] Bulk operations
- [ ] Data validation rules

### Phase 4 (Tương lai) 🔮
- [ ] AI-powered recipe suggestions
- [ ] Nutritional analysis
- [ ] Cost optimization
- [ ] Integration với ERP

## Hỗ trợ

### Troubleshooting:
1. **Không tải được dữ liệu**: Kiểm tra kết nối mạng và đăng nhập
2. **Dropdown không cập nhật**: Refresh trang hoặc chọn lại phân loại
3. **Không thể lưu**: Kiểm tra các trường bắt buộc (*)
4. **Lỗi tính toán**: Kiểm tra định dạng số và đơn vị

### Liên hệ hỗ trợ:
- **Email**: support@military-logistics.vn
- **Hotline**: 1900-xxxx
- **Documentation**: [Link tài liệu chi tiết]

---

**Lưu ý**: Thư viện dữ liệu là nền tảng của toàn bộ hệ thống. Mọi thay đổi cần được xem xét kỹ lưỡng để tránh ảnh hưởng đến các chức năng khác. 