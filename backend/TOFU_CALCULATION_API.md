# API Tính Toán Đậu Phụ Cần Xuất

API này được tạo để tính số lượng nguyên liệu đậu phụ cần xuất dựa trên thực đơn ăn và số lượng người ăn của từng đơn vị.

## Các Endpoint API

### 1. Tính toán yêu cầu đậu phụ hàng ngày/tuần

**Endpoint:** `GET /api/tofu-calculation/requirements`

**Mô tả:** Tính toán số lượng đậu phụ cần thiết dựa trên thực đơn và số lượng người ăn

**Query Parameters:**
- `date` (string, optional): Ngày cụ thể (format: YYYY-MM-DD)
- `week` (number, optional): Tuần trong năm (1-52)
- `year` (number, optional): Năm (cần có khi dùng week)
- `unitIds` (string|array, optional): ID của các đơn vị cần tính (nếu không có sẽ tính cho tất cả)

**Ví dụ:**
```bash
# Tính cho ngày cụ thể
GET /api/tofu-calculation/requirements?date=2025-01-15

# Tính cho tuần
GET /api/tofu-calculation/requirements?week=3&year=2025

# Tính cho đơn vị cụ thể
GET /api/tofu-calculation/requirements?date=2025-01-15&unitIds=60a1b2c3d4e5f6789012345a
```

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2025-01-15",
    "totalTofuRequired": 150.5,
    "totalPersonnel": 500,
    "units": [
      {
        "unitId": "60a1b2c3d4e5f6789012345a",
        "unitName": "Đại đội 1",
        "personnel": 100,
        "totalTofuRequired": 30.5,
        "requirementsByMeal": {
          "morning": [
            {
              "lttpId": "tofu001",
              "lttpName": "Đậu phụ",
              "quantityPerServing": 15.0,
              "unit": "kg",
              "dishName": "Canh đậu phụ",
              "mealType": "morning"
            }
          ],
          "noon": [],
          "evening": []
        },
        "totalByMeal": {
          "morning": 15.0,
          "noon": 10.5,
          "evening": 5.0
        }
      }
    ],
    "dishesUsingTofu": [
      {
        "dishName": "Canh đậu phụ",
        "mealType": "morning",
        "tofuIngredients": [
          {
            "lttpId": "tofu001",
            "lttpName": "Đậu phụ",
            "quantityPerServing": 0.15,
            "unit": "kg",
            "dishName": "Canh đậu phụ",
            "mealType": "morning"
          }
        ]
      }
    ],
    "summary": {
      "totalDishesUsingTofu": 3,
      "averageTofuPerPerson": 0.301,
      "recommendedSoybeanInput": 60.2
    }
  }
}
```

### 2. Tính toán yêu cầu đậu phụ hàng tuần với chi tiết theo ngày

**Endpoint:** `GET /api/tofu-calculation/weekly-requirements`

**Mô tả:** Tính toán chi tiết yêu cầu đậu phụ cho từng ngày trong tuần

**Query Parameters:**
- `week` (number, required): Tuần trong năm (1-52)
- `year` (number, required): Năm
- `unitIds` (string|array, optional): ID của các đơn vị cần tính

**Ví dụ:**
```bash
GET /api/tofu-calculation/weekly-requirements?week=3&year=2025
```

**Response:**
```json
{
  "success": true,
  "data": {
    "week": 3,
    "year": 2025,
    "dailyResults": {
      "2025-01-13": {
        "date": "2025-01-13",
        "totalTofuRequired": 120.5,
        "totalPersonnel": 500,
        "units": [...],
        "dishesUsingTofu": [...],
        "summary": {...}
      },
      "2025-01-14": {
        "date": "2025-01-14",
        "totalTofuRequired": 135.0,
        "totalPersonnel": 500,
        "units": [...],
        "dishesUsingTofu": [...],
        "summary": {...}
      }
    },
    "weeklyTotals": {
      "totalTofuRequired": 850.5,
      "totalPersonnelDays": 3500,
      "averageDailyTofu": 121.5,
      "averageTofuPerPerson": 0.243,
      "estimatedWeeklySoybean": 340.2
    }
  }
}
```

### 3. Thống kê sử dụng đậu phụ

**Endpoint:** `GET /api/tofu-calculation/statistics`

**Mô tả:** Lấy thống kê về việc sử dụng đậu phụ trong một khoảng thời gian

**Query Parameters:**
- `startDate` (string, required): Ngày bắt đầu (format: YYYY-MM-DD)
- `endDate` (string, required): Ngày kết thúc (format: YYYY-MM-DD)

**Ví dụ:**
```bash
GET /api/tofu-calculation/statistics?startDate=2025-01-01&endDate=2025-01-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2025-01-01",
      "endDate": "2025-01-31"
    },
    "tofuDishes": [
      {
        "_id": "60a1b2c3d4e5f6789012345b",
        "name": "Canh đậu phụ",
        "category": "soup",
        "tofuIngredients": [
          {
            "lttpId": "tofu001",
            "lttpName": "Đậu phụ",
            "quantity": 0.15,
            "unit": "kg"
          }
        ]
      }
    ],
    "processing": {
      "totalDays": 31,
      "totalSoybeanInput": 1240.0,
      "totalTofuOutput": 3100.0,
      "averageConversionRate": 2.5,
      "dailyData": [
        {
          "date": "2025-01-01",
          "soybeanInput": 40.0,
          "tofuInput": 100.0,
          "note": "",
          "soybeanPrice": 15000,
          "tofuPrice": 35000
        }
      ]
    },
    "summary": {
      "dishesWithTofu": 5,
      "averageDailyTofuProduction": 100.0
    }
  }
}
```

## Cách thức hoạt động

### 1. Logic tính toán

API sẽ:
1. **Tìm thực đơn** cho ngày/tuần được chỉ định
2. **Phân tích món ăn** trong thực đơn để tìm những món sử dụng đậu phụ (lttpName chứa "đậu phụ" hoặc "tofu")
3. **Lấy số lượng người ăn** từ `unitPersonnelDaily` cho ngày đó, nếu không có thì dùng `personnel` mặc định của đơn vị
4. **Tính toán số lượng đậu phụ** cần thiết theo công thức:
   ```
   Đậu phụ cần = (Số lượng đậu phụ/phần ăn) × (Số người ăn của đơn vị) × (Số bữa có món đó)
   ```
5. **Ước tính đậu tương cần**: Dựa trên tỷ lệ chuyển đổi trung bình 1kg đậu tương → 2.5kg đậu phụ

### 2. Cấu trúc dữ liệu liên quan

- **menus**: Thực đơn tuần
- **dailyMenus**: Thực đơn hàng ngày
- **meals**: Bữa ăn (morning, noon, evening)
- **dishes**: Món ăn với nguyên liệu
- **units**: Đơn vị với số lượng người
- **unitPersonnelDaily**: Số lượng người ăn hàng ngày của từng đơn vị
- **dailyTofuProcessing**: Dữ liệu chế biến đậu phụ hàng ngày

### 3. Xử lý lỗi

API sẽ trả về lỗi trong các trường hợp:
- Không tìm thấy thực đơn cho ngày/tuần chỉ định
- Thiếu tham số bắt buộc
- Lỗi kết nối cơ sở dữ liệu
- ID đơn vị không hợp lệ

## Ví dụ sử dụng

### Tính toán cho một ngày cụ thể
```javascript
// Gọi API để tính toán cho ngày 15/01/2025
const response = await fetch('/api/tofu-calculation/requirements?date=2025-01-15', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

const data = await response.json();
console.log(`Tổng đậu phụ cần: ${data.data.totalTofuRequired}kg`);
console.log(`Đậu tương ước tính cần: ${data.data.summary.recommendedSoybeanInput}kg`);
```

### Tính toán cho tuần với đơn vị cụ thể
```javascript
// Tính toán cho tuần 3/2025, chỉ cho đại đội 1 và 2
const unitIds = ['60a1b2c3d4e5f6789012345a', '60a1b2c3d4e5f6789012345b'];
const response = await fetch(`/api/tofu-calculation/requirements?week=3&year=2025&unitIds=${unitIds.join(',')}`);

const data = await response.json();
console.log('Yêu cầu đậu phụ theo đơn vị:');
data.data.units.forEach(unit => {
  console.log(`${unit.unitName}: ${unit.totalTofuRequired}kg`);
});
```

## Lưu ý quan trọng

1. **Quyền truy cập**: Tất cả endpoint đều yêu cầu authentication (token hợp lệ)
2. **Định dạng ngày**: Sử dụng format ISO 8601 (YYYY-MM-DD)
3. **Tỷ lệ chuyển đổi**: Tỷ lệ đậu tương → đậu phụ có thể thay đổi tùy theo điều kiện thực tế
4. **Fallback dữ liệu**: Nếu không có dữ liệu `unitPersonnelDaily`, sẽ sử dụng `personnel` mặc định của đơn vị
5. **Performance**: Với dữ liệu lớn, API có thể mất thời gian xử lý, nên sử dụng timeout phù hợp 