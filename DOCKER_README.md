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

## Ports
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
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

## Development Mode
Để development, có thể sử dụng volumes mount để hot reload:
- Backend và Frontend code được mount vào container
- `node_modules` được exclude để tránh conflict 