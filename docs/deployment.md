# 🚀 HƯỚNG DẪN TRIỂN KHAI HỆ THỐNG BREWLITE (DEPLOYMENT GUIDE)

> **Người phụ trách**: Minh Chiến (Leader)  
> **Mã Task**: `SP1-01` (Khởi tạo) & `SP3-01` (Hoàn thiện bàn giao)  
> **Phạm vi áp dụng**: Môi trường Production (Vercel + Render + Supabase)  
> **Sơ đồ kiến trúc liên quan**: [docs/diagrams/deployment-production.puml](diagrams/deployment-production.puml), [docs/architecture/adr/007-hosting.md](architecture/adr/007-hosting.md)

---

## 1. TỔNG QUAN KIẾN TRÚC TRIỂN KHAI PRODUCTION

Hệ thống BrewLite áp dụng kiến trúc triển khai **Hybrid Cloud** hiện đại, kết hợp điểm mạnh của ba nhà cung cấp dịch vụ đám mây nhằm tối ưu hiệu năng, bảo mật và chi phí vận hành:

| Tầng hệ thống | Ứng dụng | Nền tảng Cloud | URL Môi trường Thực tế | Cơ chế triển khai |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | `apps/web` (Next.js 15 PWA) | **Vercel** | `https://brewlite.vercel.app` | Vercel GitHub Integration / CLI |
| **Backend** | `apps/api` (NestJS 11) | **Render** | `https://brewlite-api.onrender.com` | Docker Container từ GHCR / Git Hook |
| **Database** | PostgreSQL 16 (Prisma) | **Supabase** | `db.xxxx.supabase.co` | Prisma Migration qua Direct URL |

---

## 2. MA TRẬN BIẾN MÔI TRƯỜNG (ENVIRONMENT VARIABLES)

> [!IMPORTANT]
> Tuyệt đối **KHÔNG commit secret thật** vào mã nguồn hoặc Git repository. Mọi giá trị bí mật được quản lý an toàn thông qua Dashboard của từng nền tảng hoặc GitHub Secrets.

### 2.1. Backend API (`apps/api` trên Render)

| Tên biến | Bắt buộc | Giá trị mẫu / Định dạng | Mục đích |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Có | `production` | Bật chế độ tối ưu hiệu năng NestJS |
| `PORT` | Có | `4000` | Cổng lắng nghe nội bộ của container |
| `DATABASE_URL` | Có | `postgresql://postgres:[PWD]@db.[REF].supabase.co:6543/postgres?pgbouncer=true` | Chuỗi kết nối Supabase qua PgBouncer (cổng 6543) cho runtime |
| `DIRECT_URL` | Có | `postgresql://postgres:[PWD]@db.[REF].supabase.co:5432/postgres?sslmode=require` | Chuỗi kết nối trực tiếp (cổng 5432) cho Prisma Migration |
| `JWT_SECRET` | Có | `[Chuỗi ngẫu nhiên >= 32 ký tự]` | Khóa bí mật ký và xác thực JSON Web Token |
| `JWT_EXPIRES_IN`| Có | `24h` | Thời gian sống của JWT access token |
| `CORS_ORIGIN` | Có | `https://brewlite.vercel.app` | Khóa miền cho phép truy cập tài nguyên chéo |

### 2.2. Frontend Web (`apps/web` trên Vercel)

| Tên biến | Bắt buộc | Giá trị mẫu / Định dạng | Mục đích |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Có | `https://brewlite-api.onrender.com/api/v1` | URL gốc của Backend REST API trên Render |
| `NODE_ENV` | Có | `production` | Bật chế độ tối ưu Next.js production build |

---

## 3. QUY TRÌNH THIẾT LẬP TỪNG NỀN TẢNG CLOUD

### 3.1. Thiết lập Cơ sở dữ liệu Supabase
1. Đăng nhập vào [Supabase Console](https://supabase.com/dashboard) và tạo Project mới mang tên `BrewLite-Prod`.
2. Chọn Region phù hợp (khuyến nghị: **Singapore - ap-southeast-1** để giảm độ trễ về Việt Nam).
3. Lấy thông tin kết nối tại **Project Settings ➔ Database**:
   - **Connection Pooler (Transaction mode - Cổng 6543)** ➔ Dùng làm giá trị cho `DATABASE_URL`.
   - **Direct Connection (Cổng 5432)** ➔ Dùng làm giá trị cho `DIRECT_URL`.
4. Bật chế độ bắt buộc SSL (`sslmode=require`).
5. Đảm bảo cấu hình Network Restrictions không phơi bày cổng thô ra bên ngoài nếu không cần thiết.

### 3.2. Thiết lập Backend API trên Render
1. Đăng nhập vào [Render Dashboard](https://dashboard.render.com).
2. Tạo mới một **Web Service**:
   - Nguồn: Chọn repository `ChienPM-27/BrewLite_assignment2`.
   - Môi trường: **Docker** (Root Directory: `.` hoặc chỉ định `apps/api/Dockerfile`).
   - Tên service: `brewlite-api`.
   - Region: Đồng bộ với cơ sở dữ liệu (Frankfurt hoặc Singapore).
   - Instance Type: **Free**.
3. Cấu hình **Health Check Path**: `/api/v1/health` (Render sẽ định kỳ gửi request kiểm tra HTTP 200).
4. Thiết lập các biến môi trường tại mục **Environment** theo bảng 2.1.
5. Sao chép **Deploy Hook URL** của Render và thêm vào mục **GitHub Secrets** của repository dưới tên `RENDER_DEPLOY_HOOK`.

### 3.3. Thiết lập Frontend Web trên Vercel
1. Đăng nhập vào [Vercel Dashboard](https://vercel.com).
2. Nhấn **Add New Project** và chọn repository `ChienPM-27/BrewLite_assignment2`.
3. Cấu hình thư mục gốc (Root Directory): Chọn `apps/web`.
4. Framework Preset: Tự động nhận diện **Next.js**.
5. Nhập biến môi trường `NEXT_PUBLIC_API_URL` trỏ tới URL API Render.
6. Nhấn **Deploy**. Sau khi hoàn tất, Vercel sẽ tự động cấp chứng chỉ HTTPS cho domain.

---

## 4. QUY TRÌNH CHẠY DATABASE MIGRATION TRÊN PRODUCTION

> [!WARNING]
> Tuyệt đối **CẤM** chạy các lệnh `prisma migrate reset` hoặc `prisma db push --force-reset` trên môi trường Production vì sẽ làm mất toàn bộ dữ liệu thật của khách hàng.

Khi có thay đổi về cấu trúc cơ sở dữ liệu:
1. Thành viên phụ trách tạo migration cục bộ và commit vào repo:
   ```bash
   npx prisma migrate dev --name <ten_migration>
   ```
2. Trên môi trường CI/CD hoặc máy Leader khi release:
   Chạy lệnh áp dụng migration chính thức bằng connection trực tiếp (`DIRECT_URL`):
   ```bash
   npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
   ```
3. Sau khi migration thành công, kiểm tra tính toàn vẹn của bảng thông qua Supabase Table Editor.

---

## 5. GIÁM SÁT SỨC KHỎE HỆ THỐNG & LOGGING

- **Endpoint kiểm tra Uptime**:
  ```bash
  curl -i https://brewlite-api.onrender.com/api/v1/health
  ```
  Phản hồi thành công mong đợi (HTTP 200):
  ```json
  {
    "status": "ok",
    "timestamp": "2026-11-06T13:30:00.000Z",
    "uptime": 12450.2,
    "database": "connected"
  }
  ```
- **Giám sát Logs**:
  - Render cung cấp Real-time Log Stream ghi nhận mọi truy vấn HTTP, mã trạng thái và thông báo lỗi từ NestJS Logger.
  - Vercel cung cấp Functions Log và Web Vitals theo dõi tốc độ phản hồi người dùng.
- **Biện pháp chống Cold Start (Render Free)**:
  - Cấu hình UptimeRobot hoặc script GitHub Actions định kỳ gọi vào `/api/v1/health` mỗi 10 phút để giữ container luôn trong trạng thái sẵn sàng (Warm).

---

## 6. QUY TRÌNH PHỤC HỒI SỰ CỐ & ROLLBACK (TASK 5.3)

Nếu phiên bản mới phát hành gặp sự cố nghiêm trọng (Smoke test fail, API trả 500 hàng loạt hoặc lỗi crash):
1. **Dừng khẩn cấp**: Pipeline CD sẽ tự động hủy tác vụ phát hành nếu `scripts/smoke-test.sh` trả về mã lỗi khác 0.
2. **Rollback Backend (Render)**:
   - Truy cập Render Dashboard ➔ `brewlite-api` ➔ **Events / Deploys**.
   - Tìm bản Deploy thành công liền trước đó và nhấn **Rollback to this deploy**.
   - Hoặc redeploy Docker tag ổn định trước đó từ GHCR.
3. **Rollback Frontend (Vercel)**:
   - Truy cập Vercel Dashboard ➔ `brewlite` ➔ **Deployments**.
   - Tìm deployment ổn định trước đó, chọn menu 3 chấm ➔ **Promote to Production**.
4. **Kiểm tra sau Rollback**:
   - Chạy lại kiểm thử khói để xác nhận hệ thống đã khôi phục:
     ```bash
     bash scripts/smoke-test.sh https://brewlite-api.onrender.com
     ```
   - Ghi lại chi tiết sự cố và nguyên nhân vào [docs/evidence/rollback.md](evidence/rollback.md).

---

## 7. DANH MỤC KIỂM TRA TRƯỚC BÀN GIAO (PRE-FLIGHT CHECKLIST)

- [ ] URL Web HTTPS truy cập được, không có lỗi chứng chỉ SSL.
- [ ] Ứng dụng Web tải thành công danh mục đồ uống từ API Render.
- [ ] Đăng ký / Đăng nhập hoạt động bình thường, JWT cấp phát hợp lệ.
- [ ] Luồng đặt hàng và thanh toán mô phỏng hoạt động trơn tru.
- [ ] Endpoint `/health` trả về `status: "ok"`.
- [ ] Toàn bộ secret đã được loại bỏ khỏi mã nguồn và git history.
