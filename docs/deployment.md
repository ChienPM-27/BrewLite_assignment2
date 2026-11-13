# 🚀 HƯỚNG DẪN TRIỂN KHAI HỆ THỐNG BREWLITE (DEPLOYMENT GUIDE)

> **Người phụ trách**: Phạm Minh Chiến (Leader)  
> **Mã Task**: `SP1-01` (Kế hoạch khởi tạo) & Sprint 2B (Bàn giao chính thức)
> **Phạm vi áp dụng**: Môi trường triển khai Production (Vercel + Render + Supabase)  
> **Sơ đồ liên quan**: [docs/diagrams/deployment-production.puml](diagrams/deployment-production.puml), [docs/diagrams/deployment-production.svg](diagrams/deployment-production.svg), [ADR-007](architecture/adr/007-hosting.md)

---

## 1. TỔNG QUAN KIẾN TRÚC TRIỂN KHAI THỰC TẾ (PRODUCTION CLOUD)

Hệ thống BrewLite lựa chọn mô hình triển khai **Hybrid Cloud** với 3 dịch vụ đám mây chuyên biệt đã được kích hoạt và đang vận hành thực tế (Live):

| Tầng hệ thống | Ứng dụng | Nền tảng Cloud | Domain / Endpoint thực tế (Live) | Trạng thái Uptime | Phương thức triển khai |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Frontend** | `apps/web` (Next.js 15 PWA) | **Vercel** | [https://brewlite-frontend.vercel.app](https://brewlite-frontend.vercel.app) | **200 OK** | Vercel Git Integration / Edge CDN |
| **Backend** | `apps/api` (NestJS 11) | **Render Web Service** | [https://brewlite.onrender.com](https://brewlite.onrender.com)<br>Base API: `https://brewlite.onrender.com/api/v1` | **200 OK** | Docker Container (`node:22-slim`) / Render Web Service |
| **Database** | PostgreSQL 16 (Prisma) | **Supabase** | `aws-0-ap-southeast-1.pooler.supabase.com`<br>Region: `ap-southeast-1` (Singapore) | **Connected** | PgBouncer Pooler (Port 6543) & Session Pooler (Port 5432) |

### 1.1. MINH CHỨNG KIỂM CHỨNG DỊCH VỤ HOẠT ĐỘNG THỰC TẾ (LIVE PROOF)

Hệ thống đã được kiểm tra tính khả dụng thực tế thông qua các request kiểm thử trực tiếp:

#### A. Kiểm chứng Frontend trên Vercel:
```http
Request: HEAD https://brewlite-frontend.vercel.app
Status: HTTP/1.1 200 OK
Server: Vercel
Content-Type: text/html; charset=utf-8
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Vercel-Cache: HIT / MISS (Edge Caching)
```

#### B. Kiểm chứng Backend Health Check trên Render:
```http
Request: GET https://brewlite.onrender.com/api/v1/health
Status: HTTP/1.1 200 OK
Server: cloudflare / Render
Content-Type: application/json; charset=utf-8

Response Body:
{
  "success": true,
  "statusCode": 200,
  "data": {
    "status": "ok"
  },
  "timestamp": "2026-11-10T06:02:46.873Z"
}
```

#### C. Kiểm chứng Truy vấn Dữ liệu Sản phẩm (Backend nối Supabase Database):
```http
Request: GET https://brewlite.onrender.com/api/v1/products
Status: HTTP/1.1 200 OK
Response Body: Trả về đầy đủ danh sách 10 món nước thực tế đã seed trên cơ sở dữ liệu Supabase (Americano, Bạc xỉu, Cà phê sữa đá, Cappuccino, Espresso, Latte, Trà đào, Trà dâu, Trà nhãn, Trà quýt) kèm đầy đủ thông tin sizePrices và category.
```

---

## 2. MA TRẬN BIẾN MÔI TRƯỜNG (ENVIRONMENT VARIABLES)

> [!IMPORTANT]
> Tuyệt đối **KHÔNG commit secret thật** vào Git. Toàn bộ thông tin đăng nhập, token và secret thực tế của nhóm được lưu trữ an toàn trong file nội bộ `team-secrets.txt` (đã được cấu hình trong `.gitignore`) và cài đặt trực tiếp trên Render Dashboard / Vercel Environment Variables / GitHub Secrets Vault.

### 2.1. Backend API (`apps/api` trên Render)

| Tên biến | Bắt buộc | Giá trị cấu hình thực tế / Định dạng | Mục đích & Ghi chú |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Có | `production` | Chế độ chạy production của NestJS |
| `PORT` | Có | `4000` | Cổng container lắng nghe (Render tự map ra 443 HTTPS ngoài) |
| `DATABASE_URL` | Có | `postgresql://postgres.tfqdvfsfzoyzkaftylyo:[PWD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true` | Chuỗi kết nối Supabase qua PgBouncer (Transaction Mode, cổng 6543) cho API runtime |
| `DIRECT_URL` | Có | `postgresql://postgres.tfqdvfsfzoyzkaftylyo:[PWD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres` | Chuỗi kết nối Session Pooler (cổng 5432, hỗ trợ IPv4) phục vụ `prisma migrate deploy` |
| `JWT_SECRET` | Có | `[Chuỗi ngẫu nhiên >= 32 ký tự, lưu trong team-secrets.txt]` | Khóa bí mật dùng để ký và giải mã JWT token |
| `JWT_EXPIRATION` | Có | `7d` | Thời hạn sống của JWT token (khớp với `auth.module.ts` và `.env.example`) |
| `CORS_ORIGIN` | Không (chưa được code sử dụng) | `https://brewlite-frontend.vercel.app` | Giá trị dự kiến cho whitelist. `main.ts` hiện cấu hình `origin: '*'`, không đọc biến này; JWT được gửi qua Bearer header. |

### 2.2. Frontend Web (`apps/web` trên Vercel)

| Tên biến | Bắt buộc | Giá trị cấu hình thực tế | Mục đích & Ghi chú |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Có | `https://brewlite.onrender.com/api/v1` | URL gốc của Backend REST API thật trên Render |
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
- **Health check endpoint**: `GET /api/v1/health` trả `data.status = 'ok'`, xác nhận API trả lời; hiện không kiểm tra DB hoặc trả uptime. Dùng `GET /api/v1/products` để kiểm chứng truy vấn DB riêng như mục 1.1.C.
- **Hạn chế Cold Start**: Gói Render Free sẽ ngủ (idle) sau 15 phút không có request. Kế hoạch khắc phục: sử dụng dịch vụ ping định kỳ (UptimeRobot / Cron script) gọi vào `/api/v1/health` trong khung giờ nghiệm thu.

### 5.2. Kế hoạch Rollback Dự Kiến
Khi phiên bản release mới phát sinh lỗi nghiêm trọng:
1. **Rollback Backend (Render)**: Truy cập Render Dashboard ➔ `brewlite-api` ➔ chọn bản deploy ổn định liền trước ➔ bấm **Rollback to this deploy** (hoặc chuyển image tag về commit SHA ổn định trước đó).
2. **Rollback Frontend (Vercel)**: Truy cập Vercel Dashboard ➔ `apps/web` ➔ chọn deployment ổn định trước đó ➔ chọn **Promote to Production**.
3. **Kiểm tra phục hồi**: Chạy lại kịch bản kiểm thử khói `scripts/smoke-test.sh` trên URL production để xác nhận hệ thống đã hoạt động bình thường. Ghi nhận nhật ký vào `docs/evidence/rollback.md`.

---

## 6. CẤU HÌNH VNPAY SANDBOX (SP1-07)

Phần này bổ sung tích hợp payment vào hạ tầng Vercel/Render/Supabase ở trên. VNPay Sandbox là dịch vụ bên ngoài, không chạy trong container API.

### 6.1. Biến môi trường Backend

| Biến | Giá trị / ý nghĩa |
|---|---|
| `VNPAY_URL` | `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html` — URL gateway Sandbox |
| `VNPAY_TMN_CODE` | Terminal code do VNPay Sandbox cấp |
| `VNPAY_HASH_SECRET` | Secret tạo URL và xác minh HMAC-SHA512, chỉ lưu tại Backend |
| `VNPAY_RETURN_URL` | `https://brewlite-frontend.vercel.app/payment/vnpay-return` trên Vercel; local dùng URL Frontend tương ứng |

Khai báo trên Render Environment hoặc file `.env` local đã gitignore; không commit secret thật và không đưa HASH_SECRET vào biến `NEXT_PUBLIC_*`. Đăng ký merchant/tài khoản thử nghiệm theo hướng dẫn tại [VNPay Sandbox](https://sandbox.vnpayment.vn/).

### 6.2. IPN URL public và Return URL

- **Production Sandbox trên Render:** đăng ký `https://brewlite.onrender.com/api/v1/payments/vnpay/ipn` làm IPN URL trên portal merchant.
- **Local:** Backend localhost không nhận được request Internet trực tiếp; dùng HTTPS tunnel trỏ về cổng Backend 4000 và đăng ký `https://<TUNNEL_HOST>/api/v1/payments/vnpay/ipn`. Khi hostname tunnel thay đổi, cập nhật đăng ký IPN. Tunnel là công cụ kiểm thử local, không thay thế URL Render.
- **Return URL:** điều hướng browser về trang Frontend; không phải địa chỉ webhook Backend. IPN và Return URL có thể tới theo bất kỳ thứ tự nào.
- Frontend code freeze có fallback gửi query Return URL có chữ ký tới cùng endpoint IPN trước khi đọc `GET /api/v1/payments/:paymentId` kèm JWT. Backend luôn xác minh chữ ký/thông tin trước khi cập nhật kết quả.

### 6.3. Kiểm chứng theo code freeze

Cần lưu minh chứng Sandbox cho thành công, lỗi/hủy và IPN lặp. HMAC hợp lệ không tự đồng nghĩa giao dịch thành công: cả `vnp_ResponseCode` và `vnp_TransactionStatus` phải bằng `00`. Kết quả lỗi/hủy được xác minh chuyển Payment FAILED, Order PENDING → PAYMENT_FAILED và không cộng loyalty.

Handler trả `RspCode/Message` theo ADR-005. API hiện bọc kết quả trong `data` của response envelope; cần kiểm chứng VNPay nhận đúng phản hồi khi smoke test. HTTP 200 đơn lẻ chưa chứng minh Sandbox đã chấp nhận callback. Theo code đã đồng bộ main, giỏ được giữ khi redirect VNPay và chỉ xóa sau khi Backend trả Payment SUCCESS.
