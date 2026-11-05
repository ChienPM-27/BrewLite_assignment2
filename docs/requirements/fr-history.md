# LỊCH SỬ ĐƠN HÀNG & THEO DÕI — ĐẶC TẢ YÊU CẦU CHỨC NĂNG (FR-21..22)

> **Người phụ trách**: Nguyễn Quang Huy  
> **Mã Task**: `SP1-08` (Task 1.2)  
> **Dải ID**: `FR-21` đến `FR-22`

---

## 1. TỔNG QUAN
Cho phép khách hàng đã đăng nhập xem lại toàn bộ lịch sử các đơn hàng đã đặt, theo dõi tiến độ xử lý đơn hàng theo thời gian thực và xem chi tiết từng món đồ uống.

---

## 2. DANH SÁCH YÊU CẦU CHỨC NĂNG

### 2.1. FR-21: Danh sách lịch sử đơn hàng (Order History Listing)
- **MoSCoW**: Must Have
- **Acceptance Criteria (AC)**:
  - `AC-21.1`: `GET /api/v1/orders/history` trả về danh sách đơn hàng thuộc chính tài khoản đang đăng nhập, sắp xếp theo thời gian tạo mới nhất.
  - `AC-21.2`: Hỗ trợ lọc theo trạng thái (`PENDING`, `PAID`, `COMPLETED`, `CANCELLED`...) và phân trang.
  - `AC-21.3`: Tuyệt đối không cho phép người dùng xem đơn hàng của người dùng khác (kiểm tra `order.userId === currentUser.id`).

### 2.2. FR-22: Chi tiết & Theo dõi trạng thái đơn (Order Status Tracking)
- **MoSCoW**: Must Have
- **Acceptance Criteria (AC)**:
  - `AC-22.1`: `GET /api/v1/orders/:id` trả về đầy đủ chi tiết: danh sách món, kích cỡ, topping, tổng tiền, điểm tích luỹ và nhật ký thay đổi trạng thái (`orderStatusHistory`).
  - `AC-22.2`: Giao diện hiển thị thanh tiến độ trực quan tương ứng với trạng thái hiện tại của đơn hàng.

---

## 3. BẢNG TRUY VẾT YÊU CẦU (TRACEABILITY TABLE)

| Mã FR | Tên yêu cầu | Use-Case liên kết | Sơ đồ liên quan | Code / API Endpoint | Test Case ID |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `FR-21` | Xem danh sách lịch sử | `UC-05` (Lịch sử đơn hàng) | `docs/diagrams/activity-e2e.puml` | `GET /api/v1/orders/history` | `TC-HIST-01` |
| `FR-22` | Theo dõi chi tiết đơn | `UC-05` (Lịch sử đơn hàng) | `docs/diagrams/order-state-machine.puml` | `GET /api/v1/orders/:id` | `TC-HIST-02` |
