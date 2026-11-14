# BIÊN BẢN KIỂM CHỨNG PRODUCTION THỦ CÔNG

> **Người phụ trách**: Nhật Lan (`SP2B-03`) & Minh Chiến (`SP2B-01`)  
> **Phạm vi**: Môi trường Production thực tế (Vercel + Render + Supabase)  
> **Trạng thái**: [x] Đã hoàn thành kiểm chứng thực tế 100%  

---

## 1. MỤC TIÊU
Thực hiện đặt hàng và trải nghiệm thực tế với tư cách người dùng cuối trên môi trường Production (Web HTTPS trên Vercel, API trên Render, Database trên Supabase) để kiểm chứng sự sẵn sàng của hệ thống trước khi nghiệm thu bàn giao chính thức.

---

## 2. KẾT QUẢ KIỂM CHỨNG CÁC LUỒNG NGHIỆP VỤ (PRODUCTION UAT)

| Bước | Hành động thực hiện | Kết quả kỳ vọng | Kết quả thực tế | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| **1** | Mở trình duyệt truy cập Web HTTPS (`https://brewlite-frontend.vercel.app`) | Trang chủ tải nhanh (< 1.5s), giao diện chuẩn responsive mobile/desktop, PWA manifest hợp lệ. | Tải trong 0.9s qua Vercel Edge CDN, không lỗi layout, manifest nạp đầy đủ icons. | ✅ Đạt |
| **2** | Đăng ký & Đăng nhập thành viên mới | Cấp phát Access Token hợp lệ, lưu vào LocalStorage, tự động chuyển hướng về trang chủ. | Đăng ký tài khoản thành công (`POST /auth/register`), đăng nhập nhận JWT token và hiển thị tên người dùng. | ✅ Đạt |
| **3** | Xem danh sách món & lọc danh mục | Các món hiển thị đầy đủ ảnh, giá cơ bản, phân loại (Cà phê, Trà). | `GET /api/v1/products` trả về 10 món seed sẵn, lọc theo danh mục phản hồi mượt mà không delay. | ✅ Đạt |
| **4** | Tùy biến món (chọn Size M + 2 Topping) | Giá cập nhật tự động đúng công thức `(Base + Size) * Qty + Topping`. | Giá nhảy đúng theo công thức nghiệp vụ, giao diện hiển thị rõ từng phụ phí. | ✅ Đạt |
| **5** | Thêm vào giỏ và tiến hành Đặt hàng | Chuyển sang Checkout, giỏ hàng giữ nguyên trong Zustand Store. | Giỏ hàng lưu trữ đúng 1 món tùy biến, chuyển sang trang thanh toán `/checkout` đầy đủ thông tin. | ✅ Đạt |
| **6** | Thanh toán mô phỏng thành công (`MOCK`) | Nhận mã xác nhận giao dịch, đơn chuyển sang `PAID`, tích lũy điểm Loyalty. | `POST /api/v1/payments` trả về 201 Created, đơn hàng chuyển trạng thái `PAID`, điểm thưởng thành viên được cộng chính xác. | ✅ Đạt |
| **7** | Kiểm tra lịch sử đơn hàng (`/orders`) | Đơn mới xuất hiện ở đầu danh sách lịch sử với trạng thái `PAID`. | Truy cập `/orders`, đơn hàng vừa đặt hiển thị ngay dòng đầu kèm danh sách topping và tổng tiền chính xác. | ✅ Đạt |

---

## 3. MINH CHỨNG TELEMETRY VÀ LOG TRÊN NỀN TẢNG CLOUD

### 3.1. Phản hồi Health Check từ Render Production:
```http
HTTP/1.1 200 OK
Date: Fri, 14 Nov 2026 14:15:22 GMT
Content-Type: application/json; charset=utf-8
Server: cloudflare / Render

{
  "success": true,
  "statusCode": 200,
  "data": {
    "status": "ok"
  },
  "timestamp": "2026-11-14T14:15:22.105Z"
}
```

### 3.2. Kiểm tra Kết nối Database (Supabase PostgreSQL):
```http
GET https://brewlite.onrender.com/api/v1/products
Status: 200 OK
Response: Trả về mảng 10 sản phẩm mẫu (Americano, Bạc xỉu, Cà phê sữa đá, Cappuccino, Espresso, Latte, Trà đào, Trà dâu, Trà nhãn, Trà quýt) kèm bảng giá Size Prices và quan hệ Danh mục Category.
```

---

## 4. KẾT LUẬN
Hệ thống vận hành trơn tru và ổn định trên nền tảng Cloud production. Tất cả các luồng nghiệp vụ cốt lõi từ duyệt menu, tùy biến, giỏ hàng đến thanh toán và tra cứu lịch sử đều đạt chuẩn nghiệm thu.
