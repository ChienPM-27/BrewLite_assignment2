# BÁO CÁO SMOKE TEST PRODUCTION & TEST TÍCH HỢP PAYMENT

> **Người phụ trách**: Nguyễn Trần Gia Kiệt  
> **Mã Task**: `SP2-07` (Nghiệm thu Task 5.2 – Tích hợp thanh toán & Kịch bản kiểm thử)  
> **Trạng thái**: [x] Đã hoàn thành bộ kiểm thử tích hợp (Integration Test) & Kịch bản Smoke Test  
> **Script kiểm thử**: [scripts/smoke-test.sh](../../scripts/smoke-test.sh)  
> **Bộ test tích hợp**: [apps/api/src/modules/payments/payments.int-spec.ts](../../apps/api/src/modules/payments/payments.int-spec.ts)

---

## 1. BẢNG ĐỐI CHIẾU TIÊU CHÍ NGHIỆM THU PAYMENT (TASK 5.2)

Hệ thống thanh toán BrewLite được thiết kế theo kiến trúc Module hóa, hỗ trợ cổng thanh toán mô phỏng (`MOCK`) và sẵn sàng tích hợp cổng VNPay Sandbox:

| Mã TC | Hạng mục kiểm thử | Kịch bản / Input | Kết quả kỳ vọng | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| **TC-PAY-01** | Thanh toán thành công | `POST /api/v1/payments`<br>`x-mock-outcome: SUCCESS` | Trả về 201 Created, `Payment.status = SUCCESS`, cập nhật `Order.status = PAID`, tích lũy điểm loyalty | ✅ Đạt |
| **TC-PAY-02** | Thanh toán thất bại & Retry | `POST /api/v1/payments`<br>`x-mock-outcome: FAILED` | `Payment.status = FAILED`, `Order.status = PAYMENT_FAILED` (giữ nguyên đơn, cho phép thanh toán lại) | ✅ Đạt |
| **TC-PAY-03** | Cơ chế Idempotency | Gửi 2 lần cùng `Idempotency-Key` và cùng payload | Trả về kết quả giao dịch cũ, không tạo bản ghi thanh toán trùng lặp trong DB | ✅ Đạt |
| **TC-PAY-04** | Chữ ký VNPay IPN | `GET /api/v1/payments/vnpay/ipn`<br>(checksum giả mạo) | Trả về mã lỗi `RspCode: '97'` (Invalid signature), không cập nhật đơn | ✅ Đạt |
| **TC-PAY-05** | Xác thực & Bảo mật | Request không token / sai order / đã PAID | Trả về đúng mã lỗi HTTP 401 Unauthorized, 404 Not Found, 409 Conflict | ✅ Đạt |

---

## 2. QUY TRÌNH CHẠY SMOKE TEST

Script `scripts/smoke-test.sh` được sử dụng để kiểm tra tự động các điểm chạm dịch vụ chính sau khi triển khai hệ thống:

```bash
# Cấp quyền thực thi và chạy smoke test trỏ vào endpoint
chmod +x ./scripts/smoke-test.sh
./scripts/smoke-test.sh https://brewlite.onrender.com/api/v1
```

### Các bước kiểm tra chính trong kịch bản:
1. **Kiểm tra Health Check (`GET /health`)**: Xác nhận dịch vụ API đang trực tuyến và phản hồi mã 200 OK.
2. **Kiểm tra Thực đơn (`GET /products`)**: Xác nhận API kết nối với cơ sở dữ liệu Supabase và truy vấn được danh sách sản phẩm.
3. **Kiểm tra Xác thực (`POST /auth/register`, `/auth/login`)**: Xác nhận luồng tạo tài khoản và cấp phát JWT Token.
4. **Kiểm tra Thanh toán mô phỏng (`POST /payments`)**: Kiểm tra luồng xử lý đơn hàng và thanh toán trên môi trường mục tiêu.
