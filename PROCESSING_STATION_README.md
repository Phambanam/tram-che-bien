# TRẠM CHẾ BIẾN - Hướng dẫn sử dụng

## Tổng quan

Trang **Trạm chế biến** là một phần quan trọng trong hệ thống quản lý hậu cần quân sự, cho phép theo dõi và quản lý quá trình chế biến thực phẩm từ nguyên liệu thô thành thành phẩm.

## Cấu trúc 6 phần chính

### 1. 🟢 Chế biến đậu phụ (Đã hoàn thành)
- **Chức năng**: Theo dõi quá trình chế biến đậu nành thành đậu phụ
- **Tỷ lệ chuyển đổi**: 1kg đậu nành = 1kg đậu phụ
- **Nguồn dữ liệu**: 
  - **Đầu vào**: Lấy từ trang "Quản lý nguồn nhập" (đậu nành đã được phê duyệt)
  - **Đầu ra**: Lấy từ trang "Quản lý nguồn xuất" (đậu phụ đã xuất)
- **Tính năng**:
  - Hiển thị tồn kho theo thời gian thực
  - Cập nhật tiến độ chế biến
  - Theo dõi trạng thái (Đang chế biến/Hoàn thành/Hết hạn)

### 2. 🟡 Làm giò chả (Sắp có)
- **Chức năng**: Chế biến thịt thành giò chả
- **Nguyên liệu**: Thịt lợn, gia vị
- **Trạng thái**: Đang phát triển

### 3. 🟡 Giá đỗ (Sắp có)
- **Chức năng**: Ngâm ủ đậu xanh thành giá đỗ
- **Nguyên liệu**: Đậu xanh
- **Trạng thái**: Đang phát triển

### 4. 🟡 Muối nén (Sắp có)
- **Chức năng**: Muối nén rau củ quả
- **Nguyên liệu**: Rau củ, muối
- **Trạng thái**: Đang phát triển

### 5. 🟠 Giết mổ gia súc (Đang phát triển)
- **Chức năng**: Quản lý giết mổ và chế biến gia súc
- **Nguyên liệu**: Gia súc sống
- **Trạng thái**: Giao diện cơ bản đã có

### 6. 🟡 Gia cầm, hải sản (Sắp có)
- **Chức năng**: Chế biến gia cầm và hải sản
- **Nguyên liệu**: Gà, vịt, cá, tôm
- **Trạng thái**: Đang phát triển

### 7. 🟢 Quản lý LTTP (Đã hoàn thành)
- **Chức năng**: Quản lý tổng thể lương thực thực phẩm
- **Tính năng**:
  - Tổng hợp dữ liệu nhập/xuất/tồn
  - Báo cáo tỷ lệ sử dụng
  - Cảnh báo hết hạn
  - Xuất báo cáo

## Hướng dẫn sử dụng

### Truy cập trang
1. Đăng nhập vào hệ thống
2. Vào Dashboard → Trạm chế biến
3. URL: `/dashboard/tram-che-bien`

### Sử dụng phần Chế biến đậu phụ

#### Xem tổng quan
- **Thẻ thông tin**: Hiển thị số lượng đậu hạt nhập, đậu phụ xuất, tồn kho
- **Cập nhật tự động**: Dữ liệu được cập nhật từ hệ thống quản lý nguồn nhập/xuất

#### Theo dõi tiến độ chế biến
1. **Bảng theo dõi**: Hiển thị từng lô chế biến với thông tin:
   - Ngày nhập đậu nành
   - Số lượng đậu hạt nhập (kg)
   - Số lượng đậu phụ đã sản xuất (kg)
   - Tồn kho còn lại (kg)
   - Trạng thái chế biến
   - Ghi chú

#### Cập nhật tiến độ
1. Nhấn nút **"Cập nhật"** tại dòng cần cập nhật
2. Trong hộp thoại:
   - Nhập số lượng đậu phụ đã sản xuất
   - Chọn trạng thái (Đang chế biến/Hoàn thành/Hết hạn)
   - Thêm ghi chú nếu cần
3. Nhấn **"Cập nhật"** để lưu

### Sử dụng phần Quản lý LTTP

#### Xem tổng quan
- **4 thẻ thống kê**:
  - Tổng nhập mới
  - Tồn trạm hiện tại  
  - Đã xuất
  - Tỷ lệ sử dụng

#### Bảng quản lý chi tiết
- Hiển thị thông tin nhập/xuất/tồn theo từng sản phẩm
- Trạng thái hết hạn
- Ghi chú và thao tác

#### Các chức năng nhanh
1. **Báo cáo tồn kho**: Xuất báo cáo Excel
2. **Cảnh báo hết hạn**: Kiểm tra sản phẩm sắp hết hạn
3. **Nhập thêm LTTP**: Thêm mới lương thực thực phẩm

## Luồng dữ liệu

```
Quản lý nguồn nhập → Trạm chế biến → Quản lý nguồn xuất
     (Đậu nành)      (Chế biến)        (Đậu phụ)
```

### Chi tiết luồng đậu phụ:
1. **Đầu vào**: Đậu nành được nhập và phê duyệt trong "Quản lý nguồn nhập"
2. **Chế biến**: Trạm chế biến theo dõi quá trình chuyển đổi đậu nành → đậu phụ
3. **Đầu ra**: Đậu phụ được xuất trong "Quản lý nguồn xuất"
4. **Tồn kho**: Tự động tính = Nhập - Xuất

## Dữ liệu mẫu

Khi chưa có dữ liệu thực tế, hệ thống sẽ hiển thị dữ liệu mẫu:
- 150kg đậu nành nhập
- 80kg đậu phụ đã sản xuất  
- 70kg đậu nành còn lại
- 3 lô chế biến mẫu với các trạng thái khác nhau

## Quyền truy cập

- **Tất cả người dùng**: Xem thông tin
- **Nhân viên trạm chế biến**: Cập nhật tiến độ
- **Quản lý**: Toàn quyền quản lý

## Tính năng kỹ thuật

### Frontend
- **Framework**: Next.js + React
- **UI Components**: Shadcn/ui
- **State Management**: React hooks
- **API Integration**: Fetch API với error handling

### Backend Integration
- **API Endpoints**:
  - `/api/supplies` - Lấy dữ liệu nguồn nhập
  - `/api/supply-outputs` - Lấy dữ liệu nguồn xuất
  - `/api/processing-station` - Quản lý trạm chế biến

### Error Handling
- Fallback data khi API lỗi
- Toast notifications cho user feedback
- Loading states cho UX tốt hơn

## Roadmap phát triển

### Phase 1 (Hoàn thành) ✅
- [x] Chế biến đậu phụ
- [x] Quản lý LTTP cơ bản
- [x] Giao diện responsive

### Phase 2 (Đang phát triển) 🚧
- [ ] Giết mổ gia súc
- [ ] Làm giò chả
- [ ] Giá đỗ

### Phase 3 (Kế hoạch) 📋
- [ ] Muối nén rau củ
- [ ] Gia cầm, hải sản
- [ ] Báo cáo nâng cao
- [ ] Tích hợp IoT sensors

## Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra kết nối mạng
2. Đảm bảo đã đăng nhập
3. Refresh trang nếu dữ liệu không cập nhật
4. Liên hệ admin nếu cần hỗ trợ kỹ thuật

---

**Lưu ý**: Trang này đang trong giai đoạn phát triển. Một số tính năng có thể chưa hoàn thiện hoặc đang được cập nhật. 