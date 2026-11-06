# 🚀 HƯỚNG DẪN TRIỂN KHAI HỆ THỐNG BREWLITE (DEPLOYMENT GUIDE)

> **Người phụ trách**: Phạm Minh Chiến (Leader)  
> **Mã Task**: `SP1-01` (Kế hoạch khởi tạo) & `SP3-01` (Bàn giao chính thức)  
> **Phạm vi áp dụng**: Môi trường triển khai Production (Vercel + Render + Supabase)  
> **Sơ đồ liên quan**: [docs/diagrams/deployment-production.puml](diagrams/deployment-production.puml), [docs/diagrams/deployment-production.svg](diagrams/deployment-production.svg), [ADR-007](architecture/adr/007-hosting.md)

---

## 1. TỔNG QUAN KIẾN TRÚC TRIỂN KHAI DỰ KIẾN

Hệ thống BrewLite lựa chọn mô hình triển khai **Hybrid Cloud** với 3 dịch vụ đám mây chuyên biệt nhằm tối ưu chi phí (sử dụng các gói miễn phí/sinh viên) và dễ vận hành:

| Tầng hệ thống | Ứng dụng | Nền tảng Cloud | Domain / Endpoint dự kiến | Phương thức triển khai |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | `apps/web` (Next.js 15 PWA) | **Vercel** | `https://brewlite.vercel.app` (hoặc domain do Vercel cấp) | Vercel Git Integration / Deploy Hook |
| **Backend** | `apps/api` (NestJS 11) | **Render Web Service** | `https://brewlite-api.onrender.com` | Docker Container (`node:22-slim`) từ GHCR hoặc Render Git Build |
| **Database** | PostgreSQL 16 (Prisma) | **Supabase** | `aws-0-[REGION].pooler.supabase.com` | Quản lý schema bằng `npx prisma migrate deploy` |

---

## 2. MA TRẬN BIẾN MÔI TRƯỜNG (ENVIRONMENT VARIABLES)

> [!IMPORTANT]
> Tuyệt đối **KHÔNG commit secret thật** vào Git. Các giá trị bên dưới là mẫu tham chiếu cấu hình cho Render và Vercel Dashboard.

### 2.1. Backend API (`apps/api` trên Render)

| Tên biến | Bắt buộc | Giá trị mẫu / Định dạng | Mục đích & Ghi chú |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Có | `production` | Chế độ chạy production của NestJS |
| `PORT` | Có | `4000` | Cổng container lắng nghe (Render tự map ra 443 HTTPS ngoài) |
| `DATABASE_URL` | Có | `postgresql://postgres.[REF]:[PWD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true` | Chuỗi kết nối Supabase qua PgBouncer (Transaction Mode, cổng 6543) cho API runtime |
| `DIRECT_URL` | Có | `postgresql://postgres.[REF]:[PWD]@aws-0-[REGION].pooler.supabase.com:5432/postgres` | Chuỗi kết nối Session Pooler (cổng 5432, hỗ trợ IPv4) phục vụ `prisma migrate deploy` |
| `JWT_SECRET` | Có | `[Chuỗi ngẫu nhiên >= 32 ký tự]` | Khóa bí mật dùng để ký và giải mã JWT token |
| `JWT_EXPIRATION` | Có | `7d` | Thời hạn sống của JWT token (khớp với `auth.module.ts` và `.env.example`) |
| `CORS_ORIGIN` | Có | `https://brewlite.vercel.app` (hoặc URL frontend thật) | Miền được phép gọi API có kèm credentials |

### 2.2. Frontend Web (`apps/web` trên Vercel)

| Tên biến | Bắt buộc | Giá trị mẫu / Định dạng | Mục đích & Ghi chú |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Có | `https://brewlite-api.onrender.com/api/v1` | URL gốc của Backend REST API trên Render |
| `NODE_ENV` | Có | `production` | Tối ưu hóa build Next.js 15 |

---

## 3. THIẾT LẬP CHI TIẾT TỪNG NỀN TẢNG CLOUD

### 3.1. Cơ sở dữ liệu Supabase (PostgreSQL 16)
1. Tạo Project mới trên [Supabase Console](https://supabase.com/dashboard). Chọn khu vực gần Việt Nam (ví dụ: `Singapore - ap-southeast-1`).
2. Vào **Project Settings ➔ Database ➔ Connection Pooling**:
   - Sao chép chuỗi kết nối **Transaction Mode (cổng 6543)** cho biến `DATABASE_URL`. Định dạng:
     `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true`
   - Sao chép chuỗi kết nối **Session Mode (cổng 5432 trên pooler)** cho biến `DIRECT_URL`:
     `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres`
     *(Lưu ý: Domain direct `db.[PROJECT_REF].supabase.co` của Supabase Free Tier thường chỉ hỗ trợ IPv6, trong khi nhiều runner CI như GitHub Actions chạy trên môi trường IPv4. Sử dụng Session Pooler trên cổng 5432 giúp hỗ trợ cả IPv4).*
3. Cơ sở dữ liệu Supabase được mở endpoint ra Internet nhưng được bảo vệ bằng giao thức mã hóa TLS bắt buộc (`sslmode=require`) và mật khẩu mạnh.

### 3.2. Backend API trên Render Web Service
1. Tạo mới một **Web Service** trên [Render Dashboard](https://dashboard.render.com) kết nối với repository GitHub.
2. Cấu hình môi trường:
   - **Environment**: Docker (sử dụng `apps/api/Dockerfile` với base image `node:22-slim`).
   - **Instance Type**: Free.
3. Thiết lập **Health Check Path**: `/api/v1/health` (Render sẽ ping định kỳ để theo dõi uptime).
4. Nhập đầy đủ các biến môi trường theo Bảng 2.1 (đặc biệt là `JWT_EXPIRATION` và `DATABASE_URL`).
5. Render cung cấp luồng **Log Stream** thời gian thực tại tab *Logs* để theo dõi chi tiết lỗi và request của ứng dụng.

### 3.3. Frontend Web trên Vercel
1. Import repository vào [Vercel Dashboard](https://vercel.com).
2. Thiết lập thư mục gốc (**Root Directory**): `apps/web`.
3. Framework Preset: **Next.js**.
4. Cấu hình biến môi trường `NEXT_PUBLIC_API_URL` trỏ về domain API trên Render.
5. Triển khai và nhận URL HTTPS tự động từ Vercel.

---

## 4. QUY TRÌNH CHẠY DATABASE MIGRATION

Để đảm bảo an toàn cho dữ liệu trên môi trường Production:
- Tuyệt đối **KHÔNG** dùng lệnh `prisma migrate reset` hoặc `prisma db push --force-reset`.
- Sử dụng lệnh deploy migration chính thức:
  ```bash
  npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
  ```
- **Phương án thực thi khuyến nghị**:
  - *Cách 1 (Pre-deploy command trên Render)*: Cấu hình Render chạy lệnh `npx prisma migrate deploy` trước khi container API khởi động chính thức. Cách này đảm bảo migration chạy từ cùng hạ tầng mạng với backend.
  - *Cách 2 (Trong CD pipeline của GitHub Actions)*: Kết nối thông qua Session Pooler (`aws-0-[REGION].pooler.supabase.com:5432`) để đảm bảo tương thích IPv4.

---

## 5. THEO DÕI SỨC KHỎE HỆ THỐNG & KẾ HOẠCH ROLLBACK

### 5.1. Giám sát Uptime & Cold Start
- **Health check endpoint**: `GET /api/v1/health` trả về trạng thái hoạt động của API và kết nối database.
- **Hạn chế Cold Start**: Gói Render Free sẽ ngủ (idle) sau 15 phút không có request. Kế hoạch khắc phục: sử dụng dịch vụ ping định kỳ (UptimeRobot / Cron script) gọi vào `/api/v1/health` trong khung giờ nghiệm thu.

### 5.2. Kế hoạch Rollback Dự Kiến
Khi phiên bản release mới phát sinh lỗi nghiêm trọng:
1. **Rollback Backend (Render)**: Truy cập Render Dashboard ➔ `brewlite-api` ➔ chọn bản deploy ổn định liền trước ➔ bấm **Rollback to this deploy** (hoặc chuyển image tag về commit SHA ổn định trước đó).
2. **Rollback Frontend (Vercel)**: Truy cập Vercel Dashboard ➔ `apps/web` ➔ chọn deployment ổn định trước đó ➔ chọn **Promote to Production**.
3. **Kiểm tra phục hồi**: Chạy lại kịch bản kiểm thử khói `scripts/smoke-test.sh` trên URL production để xác nhận hệ thống đã hoạt động bình thường. Ghi nhận nhật ký vào `docs/evidence/rollback.md`.
