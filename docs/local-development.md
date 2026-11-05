# 💻 HƯỚNG DẪN KHỞI CHẠY DỰ ÁN MÔI TRƯỜNG LOCAL

> **Người phụ trách**: Nhật Lan  
> **Mã Task**: `SP3-03`

Tài liệu này hướng dẫn chi tiết cách chạy hệ thống BrewLite trên máy cục bộ dành cho sinh viên, giảng viên và người ngoài nhóm.

---

## 1. YÊU CẦU MÔI TRƯỜNG
- **Node.js**: Phiên bản 22.x (Kiểm tra bằng lệnh: `node -v`).
- **Docker & Docker Compose**: Đã cài đặt và đang chạy Docker Desktop.
- **Git**: Đã cài đặt.

---

## 2. CÁC BƯỚC KHỞI CHẠY NHANH BẰNG DOCKER COMPOSE (KHUYÊN DÙNG)

```bash
# Bước 1: Clone dự án
git clone https://github.com/ChienPM-27/BrewLite_assignment2.git
cd BrewLite_assignment2

# Bước 2: Tạo file cấu hình môi trường từ mẫu
cp .env.example .env

# Bước 3: Khởi chạy toàn bộ hệ thống
docker compose up --build
```

Sau khi khởi chạy thành công:
- **Giao diện Web (Next.js)**: `http://localhost:3000`
- **Backend API (NestJS)**: `http://localhost:4000/api/v1`
- **Endpoint Kiểm tra sức khỏe**: `http://localhost:4000/api/v1/health`
- **Cơ sở dữ liệu PostgreSQL**: `localhost:5432`

---

## 3. CHẠY THỦ CÔNG & KIỂM THỬ KHÔNG DÙNG DOCKER

### 3.1. Khởi chạy Backend (`apps/api`)
```bash
cd apps/api
cp .env.example .env
npm ci
npx prisma generate
npx prisma migrate dev
npm run prisma:seed    # Nạp dữ liệu mẫu
npm run start:dev      # Chạy dev server tại port 4000
```

### 3.2. Khởi chạy Frontend (`apps/web`)
```bash
cd apps/web
cp .env.example .env.local
npm ci
npm run dev            # Chạy dev server tại port 3000
```

---

## 4. LỆNH CHẠY LINT, TEST VÀ BUILD

```bash
# Kiểm tra Backend
cd apps/api
npm run lint          # Kiểm tra ESLint
npm run test:ci       # Chạy unit tests
npm run test:int      # Chạy integration tests
npm run build         # Build production

# Kiểm tra Frontend
cd apps/web
npm run lint          # Kiểm tra Next.js ESLint
npm test              # Chạy Vitest component tests
npm run build         # Build production Next.js
```
