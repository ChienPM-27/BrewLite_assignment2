# ADR-005: Cổng Thanh Toán Mô Phỏng & Cơ Chế Chống Trừ Tiền Trùng Lặp (Idempotency-Key)

> **Trạng thái**: Accepted  
> **Người đề xuất**: Nguyễn Trần Gia Kiệt  
> **Người duyệt**: Minh Chiến  
> **Phạm vi áp dụng**: `apps/api/src/modules/payments`

---

## 1. BỐI CẢNH & VẤN ĐỀ
Trong môi trường kiểm thử và triển khai Assignment 2, cổng thanh toán thật (VNPay) phụ thuộc vào đường truyền mạng ngoài, tunnel ngrok/Cloudflare và tài khoản merchant thực tế dễ gây lỗi hoặc lộ secret. Đồng thời, lỗi mạng chập chờn khi khách hàng nhấn thanh toán nhiều lần có thể gây trừ tiền trùng lặp (double spending).

## 2. QUYẾT ĐỊNH
1. **Mock Payment Gateway**: Hiện thực cổng thanh toán mô phỏng nội bộ trong `MockGatewayService`. Hỗ trợ giả lập thất bại qua header `X-Mock-Outcome: FAILED`.
2. **Idempotency-Key**: Bắt buộc client gửi header `Idempotency-Key` (chuẩn UUID v4).
   - Lưu trữ bản ghi thanh toán kèm hash của request body.
   - Nếu nhận request trùng key và trùng body ➔ trả về kết quả đã lưu mà không tạo payment mới.
   - Nếu nhận request trùng key nhưng khác body ➔ trả về lỗi `409 Conflict`.

## 3. HỆ QUẢ
- **Ưu điểm**: Hệ thống hoạt động độc lập 100% không cần tunnel hay internet ngoài; an toàn tuyệt đối trước các đợt bắn request đồng thời; kiểm thử tự động trên CI xanh ổn định.
- **Hạn chế**: Không tích hợp thanh toán ngân hàng thật trong phạm vi Assignment 2 (đúng định hướng đề bài).
