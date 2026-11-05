# ĐẶT HÀNG & QUẢN LÝ TRẠNG THÁI — ĐẶC TẢ YÊU CẦU CHỨC NĂNG (FR-13..16)

> **Người phụ trách**: Tôn Thất Hạnh  
> **Mã Task**: `SP1-06` (Task 1.2)  
> **Dải ID**: `FR-13` đến `FR-16`

---

## 1. TỔNG QUAN
Xử lý tạo đơn hàng, xác thực số lượng tồn kho nguyên liệu công thức, áp dụng mã khuyến mãi/điểm thưởng, và kiểm soát chuyển đổi trạng thái đơn hàng thông qua State Machine nghiêm ngặt.

---

## 2. DANH SÁCH YÊU CẦU CHỨC NĂNG

### 2.1. FR-13: Tạo đơn hàng (Order Creation)
- **MoSCoW**: Must Have
- **Acceptance Criteria (AC)**:
  - `AC-13.1`: `POST /api/v1/orders` với danh sách món hợp lệ trả về `201 Created` kèm thông tin đơn ở trạng thái ban đầu `PENDING`.
  - `AC-13.2`: Mọi thao tác tính tiền, tạo OrderItem, tạo OrderIngredientUsage nằm trong một Database Transaction duy nhất.

### 2.2. FR-14: Kiểm tra & Khấu trừ tồn kho nguyên liệu (Ingredient Inventory Tracking)
- **MoSCoW**: Must Have
- **Acceptance Criteria (AC)**:
  - `AC-14.1`: Kiểm tra tồn kho của tất cả nguyên liệu trong công thức (món, size, topping). Nếu bất kỳ nguyên liệu nào không đủ, từ chối tạo đơn với `400 Bad Request` và thông báo nguyên liệu hết.
  - `AC-14.2`: Tồn kho không bao giờ bị âm dưới bất kỳ tình huống concurrency nào (kiểm soát bằng atomic update / optimistic lock).

### 2.3. FR-15: Áp dụng khuyến mãi & Tích luỹ điểm (Promotions & Loyalty)
- **MoSCoW**: Should Have
- **Acceptance Criteria (AC)**:
  - `AC-15.1`: Kiểm tra tính hợp lệ của mã coupon (ngày hết hạn, đơn tối thiểu, số lượt dùng). Áp dụng giảm giá đúng công thức.
  - `AC-15.2`: Đơn hàng sau khi thanh toán thành công (`PAID`) tự động cộng điểm tích luỹ cho khách hàng theo tỉ lệ quy định.

### 2.4. FR-16: Quản lý trạng thái đơn hàng (Order State Machine)
- **MoSCoW**: Must Have
- **Acceptance Criteria (AC)**:
  - `AC-16.1`: Trạng thái chỉ được chuyển hợp lệ theo quy tắc:
    `PENDING ➔ PAID ➔ PREPARING ➔ READY ➔ COMPLETED`.
  - `AC-16.2`: Từ `PENDING` có thể chuyển sang `PAYMENT_FAILED` hoặc `CANCELLED`.
  - `AC-16.3`: Bất kỳ hành vi chuyển sai trạng thái (ví dụ: `COMPLETED ➔ PAID`, `CANCELLED ➔ READY`) đều bị chặn bởi `assertTransition` và trả về `409 Conflict`.
  - `AC-16.4`: Chỉ có hàm `OrderService.transition()` mới có quyền ghi đè `Order.status`.

---

## 3. BẢNG TRUY VẾT YÊU CẦU (TRACEABILITY TABLE)

| Mã FR | Tên yêu cầu | Use-Case liên kết | Sơ đồ liên quan | Code / API Endpoint | Test Case ID |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `FR-13` | Tạo đơn hàng mới | `UC-04` (Đặt và thanh toán) | `docs/diagrams/sequence-checkout.puml` | `POST /api/v1/orders` | `TC-ORDER-01` |
| `FR-14` | Kiểm tra tồn kho | `UC-04` (Đặt và thanh toán) | `docs/diagrams/sequence-checkout.puml` | `IngredientStockHelper` | `TC-ORDER-02` |
| `FR-15` | Khuyến mãi & Loyalty | `UC-04` (Đặt và thanh toán) | `docs/diagrams/class-diagram.puml` | `PromotionsService`, `LoyaltyService` | `TC-ORDER-03` |
| `FR-16` | State Machine trạng thái | `UC-04` (Đặt và thanh toán) | `docs/diagrams/order-state-machine.puml` | `OrderService.transition` | `TC-ORDER-04` |
