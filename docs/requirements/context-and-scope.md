# BỐI CẢNH DỰ ÁN & PHẠM VI (CONTEXT & SCOPE)

> **Người phụ trách**: Nhật Lan  
> **Mã Task**: `SP1-03` (Task 1.1 theo đề bài)  
> **Sprint**: Sprint 1

---

## 1. VẤN ĐỀ NGHIỆP VỤ (BUSINESS PROBLEM)
- Mô tả khó khăn của các quán cà phê truyền thống trong giờ cao điểm: xếp hàng dài, gọi món chậm, sai sót tiền mặt, tắc nghẽn quầy pha chế.
- Giải pháp BrewLite: Hệ thống gọi món và thanh toán không tiền mặt trên thiết bị di động (PWA/Web).

## 2. BẢNG STAKEHOLDER & MỤC TIÊU / KỲ VỌNG
| Tác nhân (Stakeholder) | Vai trò | Mục tiêu / Kỳ vọng chính |
| :--- | :--- | :--- |
| **Khách hàng (Customer)** | Người mua đồ uống | Đặt món nhanh, tùy biến size/topping, thanh toán tiện lợi, theo dõi trạng thái đơn. |
| **Thu ngân / Barista (Admin)** | Nhân viên pha chế | Nhận đơn hàng theo thời gian thực, quản lý tồn kho nguyên liệu, cập nhật tiến độ pha chế. |
| **Chủ cửa hàng (Business Owner)**| Quản lý kinh doanh | Tối ưu vận hành, giảm sai sót tài chính, tăng độ trung thành qua chương trình tích điểm. |

## 3. PHẠM VI HỆ THỐNG (SYSTEM SCOPE)
- **Trong phạm vi MVP (In-Scope MVP)**:
  - Xem menu, tìm kiếm món, xem chi tiết và tùy biến công thức (size, topping).
  - Giỏ hàng cục bộ, tạo đơn hàng, thanh toán qua cổng mô phỏng (Mock Gateway) với Idempotency-Key.
  - Quản lý trạng thái đơn hàng (PENDING ➔ PAID ➔ PREPARING ➔ READY ➔ COMPLETED).
  - Tích luỹ điểm thưởng (Loyalty) và áp dụng mã giảm giá.
  - Khấu trừ tồn kho nguyên liệu tự động.
- **Phạm vi mở rộng (Future / Out-of-Scope cho Assignment 2)**:
  - Cổng thanh toán quốc tế thực tế (Stripe, PayPal).
  - Giao hàng tận nơi (Delivery tracking GPS).
  - Phân tích kinh doanh bằng AI nâng cao.

## 4. GIẢ ĐỊNH & RÀNG BUỘC (ASSUMPTIONS & CONSTRAINTS)
- Giả định: Người dùng có kết nối Internet ổn định; thanh toán mô phỏng thành công/thất bại theo header kiểm thử.
- Ràng buộc kỹ thuật: Monorepo Node 22; Backend NestJS + PostgreSQL (Prisma); Frontend Next.js 15 App Router; Deploy Render + Vercel + Supabase.

## 5. RỦI RO & BIỆN PHÁP GIẢM THIỂU (RISKS & MITIGATION)
- Rủi ro tồn kho âm khi đặt đồng thời: Giải quyết bằng Transaction và Optimistic Locking / Atomic Update.
- Rủi ro mạng chập chờn khi thanh toán: Giải quyết bằng Idempotency-Key chuẩn UUID.
