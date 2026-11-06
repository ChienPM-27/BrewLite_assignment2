# ADR-007: Kiến Trúc Triển Khai Sản Phẩm (Vercel + Render + Supabase)

> **Trạng thái**: Accepted  
> **Ngày quyết định**: 2026-11-04  
> **Người đề xuất**: Minh Chiến (Leader)  
> **Người duyệt**: Minh Chiến (Leader)  
> **Phạm vi áp dụng**: Môi trường triển khai Production của toàn bộ hệ thống BrewLite

---

## 1. BỐI CẢNH & VẤN ĐỀ (CONTEXT & PROBLEM STATEMENT)

Hệ thống đặt cà phê trực tuyến BrewLite cần được đưa lên môi trường Internet thực tế (Production) để phục vụ việc đánh giá, nghiệm thu của giảng viên và người dùng trải nghiệm thật. Môi trường triển khai đặt ra các yêu cầu khắt khe:
1. **Bảo mật & Cô lập**: Cơ sở dữ liệu tuyệt đối không mở cổng trực tiếp không an toàn ra ngoài Internet; kết nối phải được mã hóa SSL/TLS; không lưu secret trong Git.
2. **Hiệu năng & Khả dụng**: Ứng dụng Web phải đạt tốc độ tải trang nhanh, hỗ trợ PWA và có HTTPS tự động. Backend API phải chạy ổn định, có endpoint `/health` phục vụ giám sát uptime.
3. **Chi phí & Khả năng vận hành**: Tối ưu hóa chi phí (ưu tiên Free/Student Tier của các nền tảng Cloud hiện đại), dễ dàng triển khai tự động qua CI/CD và hỗ trợ cơ chế Rollback khi có sự cố.

---

## 2. CÁC PHƯƠNG ÁN ĐÃ XEM XÉT (CONSIDERED OPTIONS)

### 2.1. Phương án A: Kiến trúc Hybrid Cloud Hiện Đại (Vercel + Render + Supabase)
- **Frontend (`apps/web`)**: Triển khai trực tiếp lên **Vercel Edge Network**. Tận dụng khả năng tối ưu hóa sâu của Vercel cho Next.js 15 (App Router, Static Site Generation, Server Components, tự động cấp phát SSL Let's Encrypt miễn phí).
- **Backend (`apps/api`)**: Đóng gói Docker Container và triển khai lên **Render Web Service**. Render tự động pull image từ GitHub Container Registry (GHCR) hoặc build từ repository, cung cấp endpoint HTTPS công khai và hỗ trợ health check tự động.
- **Database**: Sử dụng **Supabase Managed PostgreSQL 16**. Supabase cung cấp cơ chế Transaction Connection Pooler (pgBouncer trên cổng 6543) giúp chống quá tải kết nối cho runtime NestJS, đồng thời mở cổng trực tiếp 5432 có bảo vệ cho tác vụ migration schema.

### 2.2. Phương án B: Tự triển khai tất cả trên 1 máy chủ ảo (Single Virtual Private Server - VPS)
Thuê 1 máy chủ ảo (EC2, DigitalOcean hoặc Linode) và chạy toàn bộ Frontend, Backend, PostgreSQL qua Docker Compose.

- **Ưu điểm**: Toàn quyền kiểm soát hệ thống, không bị giới hạn cold start.
- **Nhược điểm**: Chi phí duy trì phát sinh; tốn nhiều thời gian thiết lập hạ tầng (Nginx reverse proxy, cấu hình Let's Encrypt certbot, firewall ufw, backup tự động); rủi ro cao nếu server bị sập thì mất toàn bộ dịch vụ (Single Point of Failure).

### 2.3. Phương án C: Triển khai toàn bộ trên Render (Render Web + Render Postgres)
- **Ưu điểm**: Quản lý tập trung trong một dashboard của Render.
- **Nhược điểm**: Vercel tối ưu Next.js 15 tốt hơn hẳn Render Static/Web; Render Free Postgres tự động xóa dữ liệu sau 30 ngày (không an toàn cho bài tập lớn); tài nguyên free tier của Render dễ bị nghẽn nếu chạy đồng thời cả API và DB.

---

## 3. QUYẾT ĐỊNH (DECISION)

Chúng tôi chọn **Phương án A: Kiến trúc Hybrid Cloud Hiện Đại (Vercel + Render + Supabase)**.

**Chi tiết kiến trúc triển khai**:
1. **Frontend**: Triển khai trên **Vercel** tại domain `https://brewlite.vercel.app` (hoặc domain do Vercel cấp phát).
   - Tự động cấu hình CDN toàn cầu, tối ưu tệp tĩnh và chứng chỉ HTTPS.
   - Biến môi trường: `NEXT_PUBLIC_API_URL=https://brewlite-api.onrender.com/api/v1`.
2. **Backend**: Triển khai trên **Render Web Service** tại domain `https://brewlite-api.onrender.com`.
   - Chạy container Docker dựa trên `apps/api/Dockerfile`.
   - Endpoint `/api/v1/health` được cấu hình làm Health Check Path trên Render (kiểm tra trạng thái HTTP 200).
   - Biến môi trường: `PORT=4000`, `NODE_ENV=production`, `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `CORS_ORIGIN=https://brewlite.vercel.app`.
3. **Database**: **Supabase PostgreSQL 16**.
   - Cổng 6543 (Transaction Pooler): Cung cấp chuỗi kết nối `DATABASE_URL` cho Prisma Client của NestJS runtime.
   - Cổng 5432 (Direct Session): Cung cấp chuỗi kết nối `DIRECT_URL` cho tác vụ chạy migration `prisma migrate deploy` trong pipeline CD.
   - Bật bắt buộc SSL `sslmode=require`.

---

## 4. HỆ QUẢ (CONSEQUENCES)

### 4.1. Điểm tích cực (Positive / Pros)
- **Bảo mật tuyệt đối**: Cơ sở dữ liệu Supabase được bảo vệ sau firewall và Transaction Pooler, không phơi bày cổng thô ra môi trường không tin cậy.
- **Chi phí 0 VNĐ**: Tận dụng triệt để gói miễn phí chất lượng cao của cả Vercel, Render và Supabase.
- **Khả năng quan sát (Observability)**: Render cung cấp log stream thời gian thực; Vercel cung cấp analytics thời gian tải trang; Supabase cung cấp metric truy vấn cơ sở dữ liệu.
- **Dễ dàng tích hợp CI/CD**: Cả Vercel và Render đều hỗ trợ kích hoạt triển khai tự động thông qua Webhook hoặc CLI từ GitHub Actions.

### 4.2. Điểm hạn chế & Biện pháp khắc phục (Cons & Mitigation)
- **Hạn chế Cold Start trên Render**: Gói miễn phí của Render sẽ tạm dừng (sleep) container sau 15 phút không nhận request, dẫn đến request đầu tiên sau đó mất khoảng 30–50 giây để khởi động lại.
- **Biện pháp khắc phục**:
  - Tích hợp dịch vụ ping định kỳ (Cron Job / UptimeRobot / cron GitHub Actions) gọi vào endpoint `/api/v1/health` mỗi 10 phút một lần trong khung giờ chấm bài.
  - Xây dựng giao diện Frontend thân thiện, hiển thị màn hình chờ (Loading Skeleton / Retry Toast) khi gọi API lần đầu.

---

## 5. LIÊN KẾT MÃ NGUỒN & TRUY VẾT (CODE & TRACEABILITY)

- **Sơ đồ triển khai Production**: [docs/diagrams/deployment-production.puml](../diagrams/deployment-production.puml), [docs/diagrams/deployment-production.svg](../diagrams/deployment-production.svg)
- **Tài liệu hướng dẫn triển khai**: [docs/deployment.md](../deployment.md)
- **Dockerfile Backend**: [apps/api/Dockerfile](../../apps/api/Dockerfile)
- **Mã nguồn Health Check**: [apps/api/src/modules/health/](../../apps/api/src/modules/health/)
- **Cấu hình Prisma Connection Pooler**: [apps/api/prisma/schema.prisma](../../apps/api/prisma/schema.prisma)
- **Biến môi trường mẫu**: [.env.example](../../.env.example)
- **Bằng chứng kiểm tra Uptime & Production**: [docs/evidence/production-check.md](../evidence/production-check.md)
