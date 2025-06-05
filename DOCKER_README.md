# Docker Setup cho Military Logistics System

## Yêu cầu
- Docker và Docker Compose đã được cài đặt

## Cấu trúc Docker
- **MongoDB**: Database chính của hệ thống
- **Backend**: API server (Node.js + TypeScript + Express)
- **Frontend**: Web application (Next.js + React)

## Cách sử dụng

### 1. Build và chạy tất cả services
```bash
docker-compose up --build
```

### 2. Chạy ở chế độ background
```bash
docker-compose up -d --build
```

### 3. Chỉ build mà không chạy
```bash
docker-compose build
```

### 4. Xem logs
```bash
# Xem logs của tất cả services
docker-compose logs

# Xem logs của service cụ thể
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db
```

### 5. Dừng services
```bash
docker-compose down
```

### 6. Dừng và xóa volumes (database sẽ bị reset)
```bash
docker-compose down -v
```

## Chạy Scripts Backend

### Sử dụng Script Helper (Khuyến nghị)
```bash
# Xem danh sách các scripts có sẵn
./run-scripts.sh help

# Seed database với dữ liệu mẫu (users, units, categories, products)
./run-scripts.sh seed

# Seed database với content mẫu (articles, videos)
./run-scripts.sh seed-content

# Chạy migration database
./run-scripts.sh migrate

# Chạy script tùy chỉnh
./run-scripts.sh custom scripts/your-script.ts
```

### Sử dụng Docker Compose trực tiếp

#### Seed Database
```bash
# Start database first
docker-compose up -d db

# Run seeding
docker-compose --profile seed up --build seed
```

#### Seed Content
```bash
docker-compose --profile seed up --build seed-content
```

#### Run Migration
```bash
docker-compose --profile migrate up --build migrate
```

#### Chạy script tùy chỉnh
```bash
# Build backend với scripts target
docker-compose build --no-cache backend

# Run custom script
docker-compose run --rm \
  -e MONGODB_URI=mongodb://admin:password@db:27017/military-logistics?authSource=admin \
  backend npx ts-node --project tsconfig.json scripts/your-script.ts
```

### Scripts có sẵn trong backend/scripts/
- **`seed.ts`**: Seed database với dữ liệu mẫu (users, units, categories, products)
- **`seed-content.ts`**: Seed database với content mẫu (articles, videos)
- **`migrate-to-mongoose.ts`**: Migration script
- **`seed-data-library.js`**: Legacy seed script

## Ports
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **MongoDB**: localhost:27017

## Environment Variables
Các biến môi trường được cấu hình trong `docker-compose.yml`:

### Database
- `MONGO_INITDB_ROOT_USERNAME`: admin
- `MONGO_INITDB_ROOT_PASSWORD`: password
- `MONGO_INITDB_DATABASE`: military-logistics

### Backend
- `MONGODB_URI`: Connection string tới database
- `JWT_SECRET`: Secret key cho JWT tokens
- `PORT`: Port để backend chạy (5000)

### Frontend
- `NEXT_PUBLIC_API_URL`: URL của backend API

## Docker Targets trong Backend

Backend Dockerfile hỗ trợ nhiều targets:

- **`production`**: Target mặc định để chạy API server
- **`seed`**: Target để chạy database seeding
- **`seed-content`**: Target để chạy content seeding
- **`migrate`**: Target để chạy migration
- **`scripts`**: Target để chạy scripts tùy chỉnh

## Troubleshooting

### Lỗi port đã được sử dụng
Nếu gặp lỗi port đã được sử dụng, thay đổi port mapping trong `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Thay đổi port frontend
  - "5001:5000"  # Thay đổi port backend
```

### Reset database
```bash
docker-compose down -v
docker-compose up --build
```

### Rebuild chỉ một service
```bash
docker-compose build backend
docker-compose up -d backend
```

### Lỗi khi chạy scripts
```bash
# Đảm bảo database đang chạy
docker-compose up -d db

# Kiểm tra logs của database
docker-compose logs db

# Rebuild backend nếu cần
docker-compose build --no-cache backend
```

## Development Mode
Để development, có thể sử dụng volumes mount để hot reload:
- Backend và Frontend code được mount vào container
- `node_modules` được exclude để tránh conflict

## Best Practices

1. **Luôn start database trước** khi chạy scripts
2. **Sử dụng script helper** `./run-scripts.sh` để dễ dàng quản lý
3. **Kiểm tra logs** nếu gặp lỗi: `docker-compose logs [service-name]`
4. **Backup dữ liệu** trước khi chạy migration hoặc reset database
5. **Sử dụng profiles** để tránh chạy scripts không cần thiết