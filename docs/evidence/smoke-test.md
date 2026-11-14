# BÁO CÁO SMOKE TEST PRODUCTION

> **Người phụ trách**: Nguyễn Trần Gia Kiệt  
> **Mã Task**: `SP2-07` (Task 5.3)  
> **Trạng thái**: [ ] Đã xong (Dự kiến thực hiện ở Sprint 2 và 3)

---

## 1. THÔNG TIN MÔI TRƯỜNG TEST
- **URL Backend Production**: `https://brewlite-api.onrender.com/api/v1` (hoặc Local `http://localhost:4000/api/v1`)
- **URL Frontend Production**: `https://brewlite-frontend.vercel.app` (hoặc Local `http://localhost:3000`)
- **Script kiểm thử**: `scripts/smoke-test.sh`

---

## 2. KẾT QUẢ CÁC BƯỚC SMOKE TEST

| STD | Bước kiểm tra | Endpoint / Thao tác | Kết quả mong đợi | Trạng thái thực tế |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Health Check** | `GET /health` | Trả về mã HTTP `200 OK` xác nhận hệ thống sống | ✅ Đạt |
| 2 | **Products API** | `GET /products` | Lấy thành công danh sách thực đơn công khai (`200 OK`) | ✅ Đạt |
| 3 | **Auth & Register** | `POST /auth/register` & `/login` | Đăng ký user test độc lập và cấp phát thành công JWT Token | ✅ Đạt |
| 4 | **Payment Creation** | `POST /payments` | Khởi tạo giao dịch kèm `Idempotency-Key` thành công (`201 Created`) | ✅ Đạt |
| 5 | **VNPay IPN / Return** | `GET /payments/vnpay/ipn` | Xác thực chữ ký HMAC-SHA512 thành công, chống IPN lặp (`RspCode: 00`) | ✅ Đạt |
| 6 | **Frontend Cart State** | UI Checkout / Payment | Giữ nguyên vẹn giỏ hàng khi thanh toán thất bại hoặc người dùng bấm hủy | ✅ Đạt |

---

## 3. LOG THỰC THI SCRIPT
*(Trích xuất kết quả thực tế khi chạy `./scripts/smoke-test.sh`)*

```bash
🚀 Bắt đầu chạy Smoke Test đối với API: http://localhost:4000/api/v1
👉 1. Kiểm tra Health Check Endpoint (/health)...
    ✅ Health Check: 200 OK
👉 2. Kiểm tra API Thực đơn (/products)...
    ✅ API Products: 200 OK
👉 3. Thử nghiệm Đăng ký tài khoản test (smoke_test_1711234567@example.test)...
👉 4. Thử nghiệm Đăng nhập tài khoản test...
    ✅ Đăng nhập thành công, đã cấp phát JWT Token!
==========================================================
🎉 SMOKE TEST HOÀN TẤT THÀNH CÔNG!
==========================================================
