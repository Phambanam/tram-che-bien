# Fix: Tofu Processing Data Management

## Problem
- Báo cáo thực đơn hiển thị đậu phụ được sử dụng (từ supply-outputs API)
- Trang chế biến đậu phụ không hiển thị dữ liệu do thiếu API endpoints
- Lỗi 404 khi gọi: `/api/processing-station/daily/:date`

## Solution
Đã thêm các API endpoints còn thiếu:

### 1. Daily Tofu Processing
```
GET  /api/processing-station/daily/:date     - Lấy dữ liệu hàng ngày
PATCH /api/processing-station/daily/:date    - Cập nhật dữ liệu hàng ngày
```

### 2. Daily Sausage Processing
```
GET  /api/processing-station/sausage/:date   - Lấy dữ liệu giò chả
PATCH /api/processing-station/sausage/:date  - Cập nhật dữ liệu giò chả
```

## How It Works

### Data Flow
1. **Input (CHI/THU)**: Trạm trưởng nhập thủ công
   - Đậu tương chi (soybeanInput)
   - Đậu phụ thu (tofuInput)

2. **Output (XUẤT)**: Tự động từ hệ thống
   - Lấy từ supply-outputs API
   - Tính tổng các records có product.name chứa "đậu phụ"

3. **Remaining (TỒN)**: Tự động tính toán
   - Đậu phụ tồn = Đậu phụ thu - Đậu phụ xuất

### Data Storage
- Daily data stored in MongoDB collections:
  - `dailyTofuProcessing` - Tofu processing data
  - `dailySausageProcessing` - Sausage processing data

### Permissions
- **View**: All authenticated users
- **Edit**: Admin, StationManager only

## Testing
1. Restart backend: `cd backend && npm run dev`
2. Access: http://localhost:3000/dashboard/tram-che-bien
3. Click "Chế biến đậu phụ" tab
4. Data should now load without 404 errors 