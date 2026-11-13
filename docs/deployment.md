## Cấu hình VNPay Sandbox

### 1. Các biến môi trường

Khai báo các biến môi trường sau trong file `.env` của Backend:

```env
VNPAY_URL="<VNPAY_SANDBOX_URL>"
VNPAY_TMN_CODE="<YOUR_TMN_CODE>"
VNPAY_HASH_SECRET="<YOUR_HASH_SECRET>"
VNPAY_RETURN_URL="<YOUR_FRONTEND_RETURN_URL>"
```

| Biến | Mô tả |
|---|---|
| `VNPAY_URL` | Địa chỉ cổng thanh toán VNPay Sandbox |
| `VNPAY_TMN_CODE` | Mã Terminal được VNPay cấp |
| `VNPAY_HASH_SECRET` | Khóa bí mật dùng để tạo và xác minh chữ ký |
| `VNPAY_RETURN_URL` | URL Frontend nhận điều hướng sau thanh toán |

**Lưu ý bảo mật:**
- Thay placeholder bằng thông tin được VNPay cấp.
- Không commit file `.env` lên Git.
- `VNPAY_HASH_SECRET` chỉ được lưu và sử dụng tại Backend, tuyệt đối không đưa vào Frontend hoặc biến `NEXT_PUBLIC_*`.

### 2. Đăng ký VNPay Sandbox

1. Truy cập [VNPay Sandbox](https://sandbox.vnpayment.vn/).
2. Thực hiện đăng ký thông tin tích hợp theo hướng dẫn của VNPay.
3. Nhận `TMN_CODE`, `HASH_SECRET` và thông tin Sandbox.
4. Cấu hình các thông tin được cấp vào biến môi trường Backend.

### 3. Cấu hình IPN URL public

IPN URL là địa chỉ Backend mà VNPay gọi trực tiếp để gửi thông báo kết quả giao dịch.

Ví dụ:

```text
https://<PUBLIC_BACKEND_DOMAIN>/<VNPAY_IPN_ENDPOINT>
```

Đăng ký IPN URL theo hướng dẫn tích hợp của VNPay và sử dụng đúng endpoint được triển khai trong Backend.

**Môi trường Local:**
- Backend chạy trên `localhost` không thể được VNPay truy cập trực tiếp từ Internet.
- Khi kiểm thử IPN, sử dụng công cụ tunnel để tạo HTTPS public URL trỏ về Backend local.
- Đăng ký URL tunnel kèm đúng endpoint IPN với VNPay.
- Nếu URL tunnel thay đổi, cần cập nhật lại URL đã đăng ký.

**Môi trường Render:**
- Sử dụng URL Backend public được Render cấp.
- Ghép URL Backend với endpoint IPN thực tế của hệ thống.
- Đăng ký URL hoàn chỉnh này với VNPay.

### 4. Phân biệt Return URL và IPN URL

| Thành phần | Mục đích |
|---|---|
| Return URL | VNPay chuyển trình duyệt khách hàng về Frontend sau thanh toán |
| IPN URL | VNPay gửi thông báo giao dịch trực tiếp đến Backend |

**Nguyên tắc:** Backend phải xác minh chữ ký IPN bằng `VNPAY_HASH_SECRET` trước khi cập nhật trạng thái thanh toán. Không xem việc trình duyệt được chuyển về Return URL là bằng chứng giao dịch đã thành công.

# HƯỚNG DẪN TRIỂN KHAI HỆ THỐNG (DEPLOYMENT GUIDE)

## 1. TỔNG QUAN HẠ TẦNG TRIỂN KHAI
Hệ thống BrewLite áp dụng kiến trúc triển khai phân tách rõ ràng giữa các môi trường:
* **Frontend**: Triển khai trên **Vercel** (Next.js Web App).
* **Backend**: Triển khai trên **Render** (NestJS API Service).
* **Database**: Sử dụng **Supabase PostgreSQL** làm cơ sở dữ liệu quản lý tập trung.

---

## 2. CẤU HÌNH VERCEL (FRONTEND)
1. Import repository dự án vào Vercel.
2. Thiết lập Root Directory trỏ tới thư mục frontend (hoặc cấu hình Monorepo tương ứng).
3. Khai báo các biến môi trường tại Vercel Dashboard:
   * `NEXT_PUBLIC_API_BASE_URL`: URL public của Backend API trên Render.
   * *Lưu ý:* Tuyệt đối không đưa các biến secret của thanh toán (như VNPay Hash Secret) vào Vercel hay biến `NEXT_PUBLIC_*`.

---

## 3. CẤU HÌNH RENDER (BACKEND)
1. Tạo Web Service mới trên Render trỏ tới repository Backend (NestJS).
2. Thiết lập Build Command và Start Command phù hợp cho NestJS monorepo.
3. Khai báo các biến môi trường kết nối Database Supabase và VNPay Sandbox tại Render Dashboard.

---

## 4. CẤU HÌNH SUPABASE (DATABASE)
1. Sử dụng instance PostgreSQL được cung cấp bởi Supabase.
2. Cấu hình biến môi trường kết nối (`DATABASE_URL`) trong Backend trên Render.
3. Chạy các script migration/seed database theo quy định của nhóm.

---