# ADR-002: Thiết Kế Backend Theo Module Hóa (NestJS Modular Architecture)

> **Trạng thái**: Accepted  
> **Người đề xuất**: Nhật Lan  
> **Người duyệt**: Minh Chiến  
> **Phạm vi áp dụng**: `apps/api`

---

## 1. BỐI CẢNH & VẤN ĐỀ
Backend NestJS cần phục vụ nhiều nghiệp vụ khác nhau: Sản phẩm, Đơn hàng, Thanh toán, Khách hàng thân thiết, Giảm giá. Nếu gom chung vào các service khổng lồ sẽ gây khó bảo trì, khó viết unit test và dễ gây merge conflict giữa các thành viên.

## 2. QUYẾT ĐỊNH
Chia nhỏ Backend thành các Module độc lập (`products`, `orders`, `payments`, `auth`, `loyalty`, `promotions`, `pricing`), mỗi module tự đóng gói:
- `Controller`: Định tuyến HTTP và xác thực DTO.
- `Service`: Chứa logic nghiệp vụ cốt lõi.
- `DTO`: Xác thực dữ liệu đầu vào bằng `class-validator`.
- `Module`: Quản lý phụ thuộc và chỉ xuất khẩu (export) các service cần thiết.

## 3. HỆ QUẢ
- **Ưu điểm**: Đảm bảo nguyên lý Single Responsibility; mỗi thành viên phụ trách đúng module của mình mà không chạm vào code của người khác.
- **Hạn chế**: Cần cẩn trọng với circular dependencies (được giải quyết bằng `forwardRef` hoặc event).
