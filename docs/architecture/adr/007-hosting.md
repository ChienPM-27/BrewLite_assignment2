# ADR-007: Kiến Trúc Triển Khai Sản Phẩm (Vercel + Render + Supabase)

> **Trạng thái**: Accepted  
> **Ngày quyết định**: 2026-11-04  
> **Người đề xuất**: Phạm Minh Chiến (Leader)  
> **Người duyệt**: Phạm Minh Chiến (Leader)  
> **Phạm vi áp dụng**: Môi trường triển khai Production dự kiến của hệ thống BrewLite

---

## 1. BỐI CẢNH & VẤN ĐỀ (CONTEXT & PROBLEM STATEMENT)

Hệ thống đặt cà phê trực tuyến BrewLite cần được đưa lên môi trường Internet thực tế (Production) để phục vụ việc đánh giá, nghiệm thu của giảng viên và trải nghiệm của người dùng. Các tiêu chí đặt ra bao gồm:
1. **Khả năng chi trả & Quản lý vận hành**: Tận dụng tối đa các dịch vụ đám mây miễn phí cho sinh viên, hạn chế việc phải tự cấu hình máy chủ ảo (VPS).
2. **Hiệu năng & Tương thích**: Frontend hỗ trợ PWA và Next.js App Router mượt mà; Backend API đóng gói container hóa chuẩn mực và có endpoint giám sát sức khỏe `/api/v1/health`.
3. **Cơ sở dữ liệu đám mây**: Sử dụng dịch vụ PostgreSQL được quản lý (Managed Database) có hỗ trợ Connection Pooling để phục vụ kết nối của NestJS runtime.

---

## 2. CÁC PHƯƠNG ÁN ĐÃ XEM XÉT (CONSIDERED OPTIONS)

### 2.1. Phương án A: Kiến trúc Đám Mây Chuyên Biệt (Vercel + Render + Supabase)
- **Frontend (`apps/web`)**: Triển khai lên **Vercel** (tối ưu hóa Next.js 15, CDN toàn cầu, tự động cấp chứng chỉ HTTPS).
- **Backend (`apps/api`)**: Đóng gói Docker Container (base image `node:22-slim` dựa trên Debian) và triển khai lên **Render Web Service**. Sử dụng Docker image tag gắn với commit SHA hoặc phiên bản ngữ nghĩa (semver) như `:v1.0.0` thay vì dùng `:latest`.
- **Database**: Sử dụng **Supabase Managed PostgreSQL 16**. Supabase cung cấp cổng 6543 (Transaction Mode qua PgBouncer) cho runtime API và cổng 5432 (Session Mode / Direct) cho migration.

### 2.2. Phương án B: Thuê VPS tự cấu hình (Single VPS)
Chạy toàn bộ dịch vụ trên một máy chủ ảo Ubuntu bằng Docker Compose.
- **Ưu điểm**: Toàn quyền kiểm soát, không bị cold start.
- **Nhược điểm**: Phát sinh chi phí; tốn nhiều thời gian thiết lập reverse proxy, chứng chỉ SSL, sao lưu tự động và rủi ro sập toàn bộ dịch vụ nếu VPS gặp sự cố.

---

## 3. QUYẾT ĐỊNH (DECISION)

Chúng tôi chọn **Phương án A: Kiến trúc Đám Mây Chuyên Biệt (Vercel + Render + Supabase)**.

**Chi tiết kế hoạch triển khai dự kiến**:
1. **Frontend**: Triển khai trên **Vercel** tại domain mục tiêu `https://brewlite.vercel.app` (hoặc URL do Vercel cấp phát).
   - Biến môi trường: `NEXT_PUBLIC_API_URL` trỏ tới URL API Render.
2. **Backend**: Triển khai trên **Render Web Service** tại domain mục tiêu `https://brewlite-api.onrender.com`.
   - Chạy container Docker dựa trên `apps/api/Dockerfile` (`node:22-slim`).
   - Image tag dự kiến: `ghcr.io/chienpm-27/brewlite-api:<commit-sha>` hoặc `:v1.0.0`.
   - Endpoint `/api/v1/health` được cấu hình làm Health Check Path trên Render.
   - Biến môi trường: `PORT=4000`, `NODE_ENV=production`, `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_EXPIRATION=7d`, `CORS_ORIGIN`.
   - Render cung cấp tính năng **Log Stream** thời gian thực để theo dõi hoạt động và lỗi của ứng dụng.
3. **Database**: **Supabase PostgreSQL 16**.
   - Endpoint cơ sở dữ liệu mở ra Internet nhưng được bảo vệ nghiêm ngặt bằng giao thức mã hóa TLS bắt buộc (`sslmode=require`) và mật khẩu mạnh.
   - Cổng 6543 (Transaction Mode): Dùng làm `DATABASE_URL` cho NestJS runtime kết nối qua PgBouncer.
   - Cổng 5432 (Session Mode trên pooler): Dùng làm `DIRECT_URL` để chạy `npx prisma migrate deploy`, hỗ trợ cả mạng IPv4 trên các runner CI/CD.
   - Dữ liệu được lưu trữ bền vững trên Persistent Volume của Supabase.

---

## 4. HỆ QUẢ (CONSEQUENCES)

### 4.1. Điểm tích cực (Positive / Pros)
- Tận dụng thế mạnh chuyên biệt của từng nền tảng, chi phí hạ tầng 0 VNĐ.
- Tự động hóa quá trình cấp phát chứng chỉ HTTPS cho cả Web và API.
- Tách biệt rõ ràng ranh giới giữa Local Development, CI Testing và Production Cloud.

### 4.2. Điểm hạn chế & Biện pháp khắc phục (Cons & Mitigation)
- **Cold Start trên Render Free**: Render sẽ ngủ sau 15 phút không nhận request. Kế hoạch khắc phục: cấu hình dịch vụ ping `/api/v1/health` định kỳ trong khung giờ demo/chấm bài.
- **Tính khả dụng của cổng kết nối DB**: Cần sử dụng host pooler hỗ trợ IPv4 (`aws-0-[REGION].pooler.supabase.com`) thay vì direct hostname IPv6-only khi chạy tác vụ từ CI runner.

---

## 5. LIÊN KẾT MÃ NGUỒN & TRUY VẾT (CODE & TRACEABILITY)

- **Sơ đồ kiến trúc triển khai**: [docs/diagrams/deployment-production.puml](../diagrams/deployment-production.puml), [docs/diagrams/deployment-production.svg](../diagrams/deployment-production.svg)
- **Tài liệu hướng dẫn triển khai**: [docs/deployment.md](../deployment.md)
- **Dockerfile Backend**: [apps/api/Dockerfile](../../apps/api/Dockerfile) (node:22-slim)
- **Health Check Endpoint**: [apps/api/src/modules/health/](../../apps/api/src/modules/health/)
- **Cấu hình biến môi trường mẫu**: [.env.example](../../.env.example)
