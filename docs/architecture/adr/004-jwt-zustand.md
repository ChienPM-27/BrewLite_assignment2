# ADR-004: Xác Thực JWT Stateless Và Quản Lý Trạng Thái Giỏ Hàng Bằng Zustand

> **Trạng thái**: Accepted  
> **Người đề xuất**: Quách Tuấn Hào  
> **Người duyệt**: Minh Chiến  
> **Phạm vi áp dụng**: `apps/api/src/modules/auth`, `apps/web/src/store`

---

## 1. BỐI CẢNH & VẤN ĐỀ
- Cần cơ chế xác thực người dùng an toàn, không tốn tài nguyên session server.
- Cần lưu trữ giỏ hàng phía Client bền vững, mượt mà và không bị mất khi reload hoặc thanh toán lỗi.

## 2. QUYẾT ĐỊNH
1. **Xác thực**: JWT Stateless. Password được băm bằng `bcrypt` (10 rounds). Access Token lưu tại Client và đính kèm trong header `Authorization: Bearer <token>`.
2. **Quản lý giỏ hàng**: Sử dụng thư viện **Zustand** kết hợp middleware `persist` lưu trữ vào `localStorage`.

## 3. HỆ QUẢ
- **Ưu điểm**: API mở rộng dễ dàng (stateless); Zustand cực nhẹ (< 2KB), dễ viết unit test hơn Redux; giỏ hàng giữ được trạng thái nguyên vẹn khi thanh toán thất bại.
- **Hạn chế của JWT**: Khó thu hồi (revoke) token trước hạn; khắc phục bằng cách đặt thời hạn hết hạn ngắn (`7d` trong môi trường dev/demo).
