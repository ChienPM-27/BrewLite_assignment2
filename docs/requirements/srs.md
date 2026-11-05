# BẢNG TỔNG HỢP ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) — BREWLITE

> **Người phụ trách**: Minh Chiến (Leader)  
> **Mã Task**: `SP1-02`  
> **Tổng hợp từ**: 7 tài liệu `fr-*.md` và yêu cầu phi chức năng (NFR)

---

## 1. BẢNG TỔNG HỢP YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS - FR)

| Mã FR | Tên yêu cầu chức năng | Phụ trách | Độ ưu tiên (MoSCoW) | File đặc tả chi tiết |
| :--- | :--- | :--- | :--- | :--- |
| `FR-01` | Đăng ký tài khoản thành viên (bcrypt >= 10 rounds) | Quách Tuấn Hào | Must Have | [fr-auth.md](./fr-auth.md) |
| `FR-02` | Đăng nhập hệ thống & cấp phát JWT | Quách Tuấn Hào | Must Have | [fr-auth.md](./fr-auth.md) |
| `FR-03` | Bảo vệ tuyến API & phân quyền (RBAC) | Quách Tuấn Hào | Must Have | [fr-auth.md](./fr-auth.md) |
| `FR-04` | Xem danh mục sản phẩm (Category Browsing) | Nhật Lan | Must Have | [fr-menu.md](./fr-menu.md) |
| `FR-05` | Xem danh sách món uống & trạng thái tồn kho | Nhật Lan | Must Have | [fr-menu.md](./fr-menu.md) |
| `FR-06` | Tìm kiếm món uống theo tên | Nhật Lan | Should Have | [fr-menu.md](./fr-menu.md) |
| `FR-07` | Xem chi tiết thông tin sản phẩm | Vũ Hoàng Huy | Must Have | [fr-detail.md](./fr-detail.md) |
| `FR-08` | Tùy biến kích cỡ (S/M/L) và Topping (tối đa 3) | Vũ Hoàng Huy | Must Have | [fr-detail.md](./fr-detail.md) |
| `FR-09` | Tính giá linh hoạt & Xác thực giá Backend | Vũ Hoàng Huy | Must Have | [fr-detail.md](./fr-detail.md) |
| `FR-10` | Thêm, sửa, xóa món trong giỏ hàng | Quách Tuấn Hào | Must Have | [fr-cart.md](./fr-cart.md) |
| `FR-11` | Tính tổng tiền giỏ hàng tự động | Quách Tuấn Hào | Must Have | [fr-cart.md](./fr-cart.md) |
| `FR-12` | Lưu trữ giỏ bền vững & Giữ giỏ hàng khi lỗi | Quách Tuấn Hào | Must Have | [fr-cart.md](./fr-cart.md) |
| `FR-13` | Tạo đơn hàng mới (Transaction an toàn) | Tôn Thất Hạnh | Must Have | [fr-order.md](./fr-order.md) |
| `FR-14` | Kiểm tra tồn kho nguyên liệu & chống âm kho | Tôn Thất Hạnh | Must Have | [fr-order.md](./fr-order.md) |
| `FR-15` | Áp dụng mã khuyến mãi & Tích điểm thưởng | Tôn Thất Hạnh | Should Have | [fr-order.md](./fr-order.md) |
| `FR-16` | Quản lý vòng đời trạng thái đơn (State Machine) | Tôn Thất Hạnh | Must Have | [fr-order.md](./fr-order.md) |
| `FR-17` | Cổng thanh toán mô phỏng (Mock Gateway) | Nguyễn Trần Gia Kiệt | Must Have | [fr-payment.md](./fr-payment.md) |
| `FR-18` | Cơ chế chống trùng lặp thanh toán (Idempotency) | Nguyễn Trần Gia Kiệt | Must Have | [fr-payment.md](./fr-payment.md) |
| `FR-19` | Xử lý lỗi thanh toán & phục hồi đơn hàng | Nguyễn Trần Gia Kiệt | Must Have | [fr-payment.md](./fr-payment.md) |
| `FR-20` | Xác nhận thanh toán & biên nhận giao dịch | Nguyễn Trần Gia Kiệt | Must Have | [fr-payment.md](./fr-payment.md) |
| `FR-21` | Xem danh sách lịch sử đơn hàng cá nhân | Nguyễn Quang Huy | Must Have | [fr-history.md](./fr-history.md) |
| `FR-22` | Theo dõi chi tiết & trạng thái đơn hàng | Nguyễn Quang Huy | Must Have | [fr-history.md](./fr-history.md) |

---

## 2. BẢNG YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS - NFR)

| Mã NFR | Nhóm chất lượng | Tiêu chí đo lường cụ thể (Acceptance Criteria) |
| :--- | :--- | :--- |
| `NFR-01` | **Hiệu năng (Performance)** | Thời gian phản hồi API (Response Time) p95 < 500ms đối với các tác vụ đọc menu và tạo đơn hàng. |
| `NFR-02` | **Bảo mật (Security)** | Mật khẩu băm bằng bcrypt với salt rounds >= 10; API bảo vệ bằng JWT; không lưu secret trong git. |
| `NFR-03` | **Tính nhất quán dữ liệu (Data Integrity)** | Đảm bảo ACID transaction khi tạo đơn và trừ kho; tồn kho nguyên liệu không bao giờ bị âm khi concurrency cao. |
| `NFR-04` | **Độ tin cậy & Bất biến (Reliability / Idempotency)** | Gửi nhiều request cùng `Idempotency-Key` chỉ tạo duy nhất 1 giao dịch thanh toán trong cơ sở dữ liệu. |
| `NFR-05` | **Khả năng tương thích (PWA / Compatibility)** | Ứng dụng Web đáp ứng chuẩn PWA (standalone display, manifest hợp lệ), chạy tốt trên Chrome, Safari, Firefox. |
| `NFR-06` | **Khả năng triển khai (Deployability)** | Backend đóng gói container Docker; Frontend triển khai Vercel; Database Supabase tách biệt cổng mạng. |
| `NFR-07` | **Tự động hóa CI/CD** | Pipeline GitHub Actions tự động kiểm tra Lint, Test và Build; chặn merge nếu có lỗi. |
| `NFR-08` | **Khả năng phục hồi (Recoverability / Rollback)** | Khi deploy bản release lỗi, quy trình rollback đưa hệ thống về phiên bản ổn định trước đó trong vòng dưới 5 phút. |
