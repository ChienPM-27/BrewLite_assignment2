# ADR-006: Máy Trạng Thái Đơn Hàng & Kiểm Soát Tồn Kho Nguyên Liệu An Toàn

> **Trạng thái**: Accepted  
> **Người đề xuất**: Tôn Thất Hạnh  
> **Người duyệt**: Minh Chiến  
> **Phạm vi áp dụng**: `apps/api/src/modules/orders`

---

## 1. BỐI CẢNH & VẤN ĐỀ
Đơn hàng đồ uống trải qua nhiều giai đoạn (`PENDING`, `PAID`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`). Nếu cho phép cập nhật trạng thái tùy tiện từ bất kỳ endpoint nào sẽ dẫn đến sai lệch quy trình nghiệp vụ (ví dụ: đơn đã hủy vẫn pha chế, hoặc đơn chưa trả tiền đã hoàn thành). Ngoài ra, nhiều khách đặt cùng một món có thể gây âm kho nguyên liệu nếu không có kiểm soát đồng thời.

## 2. QUYẾT ĐỊNH
1. **Order State Machine**:
   - Định nghĩa ma trận chuyển trạng thái hợp lệ trong `order-state.ts`.
   - **DUY NHẤT** phương thức `OrderService.transition()` có quyền cập nhật `Order.status`. Mọi vi phạm đều bị chặn bằng `assertTransition` và trả về `409 Conflict`.
2. **Kiểm soát tồn kho nguyên liệu**:
   - Sử dụng Prisma Transaction `$transaction` khi tạo đơn hàng.
   - Trừ kho bằng cập nhật điều kiện: `stock >= requiredQuantity`. Nếu không đủ, transaction lập tức rollback và trả về `400 Bad Request`.

## 3. HỆ QUẢ
- **Ưu điểm**: Loại bỏ hoàn toàn khả năng chuyển sai trạng thái; bảo đảm kho nguyên liệu không bao giờ bị âm dưới tải cao.
- **Hạn chế**: Cần viết unit test bao phủ toàn bộ các nhánh của ma trận chuyển trạng thái.
