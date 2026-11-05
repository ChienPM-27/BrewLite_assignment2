# GIỎ HÀNG — ĐẶC TẢ YÊU CẦU CHỨC NĂNG (FR-10..12)

> **Người phụ trách**: Quách Tuấn Hào  
> **Mã Task**: `SP1-05` (Task 1.2)  
> **Dải ID**: `FR-10` đến `FR-12`

---

## 1. TỔNG QUAN
Quản lý giỏ hàng của khách hàng phía Client sử dụng Zustand và localStorage persist, cho phép thêm, sửa, xóa món và giữ nguyên giỏ hàng khi gặp sự cố thanh toán.

---

## 2. DANH SÁCH YÊU CẦU CHỨC NĂNG

### 2.1. FR-10: Thêm, sửa, xóa món trong giỏ (Cart Management)
- **MoSCoW**: Must Have
- **Acceptance Criteria (AC)**:
  - `AC-10.1`: Thêm món cùng size và cùng topping ➔ tăng số lượng. Khác size/topping ➔ tạo thành item giỏ hàng mới.
  - `AC-10.2`: Cho phép mở modal sửa lại size và topping của món đã có trong giỏ.
  - `AC-10.3`: Giảm số lượng về 0 hoặc bấm nút Xóa ➔ xóa món khỏi giỏ hàng.

### 2.2. FR-11: Tính tổng tiền giỏ hàng (Cart Total Calculation)
- **MoSCoW**: Must Have
- **Acceptance Criteria (AC)**:
  - `AC-11.1`: Tổng tiền giỏ hàng được tính bằng tổng các item: `(basePrice + sizePrice + toppingPrice) * quantity`.
  - `AC-11.2`: Cập nhật giá tức thì khi thay đổi số lượng mà không bị lag.

### 2.3. FR-12: Lưu trữ bền vững & Giữ giỏ hàng khi lỗi (Cart Persistence & Resilience)
- **MoSCoW**: Must Have
- **Acceptance Criteria (AC)**:
  - `AC-12.1`: Giỏ hàng được lưu trong `localStorage`, reload trình duyệt không làm mất giỏ hàng.
  - `AC-12.2`: Khi thanh toán thất bại (lỗi mạng, gateway lỗi), hệ thống **BẮT BUỘC GIỮ NGUYÊN GIỎ HÀNG** để khách hàng không phải chọn món lại từ đầu.
  - `AC-12.3`: Chỉ xóa sạch giỏ hàng khi thanh toán được xác nhận thành công (`OrderStatus.PAID`).

---

## 3. BẢNG TRUY VẾT YÊU CẦU (TRACEABILITY TABLE)

| Mã FR | Tên yêu cầu | Use-Case liên kết | Sơ đồ liên quan | Code / API Endpoint | Test Case ID |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `FR-10` | Quản lý món trong giỏ | `UC-03` (Quản lý giỏ hàng) | `docs/diagrams/activity-e2e.puml` | `useCartStore` | `TC-CART-01` |
| `FR-11` | Tính tổng tiền giỏ | `UC-03` (Quản lý giỏ hàng) | `docs/diagrams/activity-e2e.puml` | `useCartStore.getTotalPrice` | `TC-CART-02` |
| `FR-12` | Giữ giỏ khi lỗi thanh toán | `UC-04` (Đặt và thanh toán) | `docs/diagrams/sequence-checkout.puml` | `useCartStore` | `TC-CART-03` |
