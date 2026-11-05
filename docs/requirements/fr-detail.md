# CHI TIẾT MÓN & TÙY BIẾN GIÁ — ĐẶC TẢ YÊU CẦU CHỨC NĂNG (FR-07..09)

> **Người phụ trách**: Vũ Hoàng Huy  
> **Mã Task**: `SP1-04` (Task 1.2)  
> **Dải ID**: `FR-07` đến `FR-09`

---

## 1. TỔNG QUAN
Cho phép khách hàng xem chi tiết thông tin đồ uống, lựa chọn kích cỡ (Size S/M/L) và các loại topping đi kèm (tối đa 3 loại), đồng thời đảm bảo giá được tính toán chính xác và bảo vệ từ phía Backend.

---

## 2. DANH SÁCH YÊU CẦU CHỨC NĂNG

### 2.1. FR-07: Xem chi tiết sản phẩm (Product Detail View)
- **MoSCoW**: Must Have
- **Acceptance Criteria (AC)**:
  - `AC-07.1`: `GET /api/v1/products/:id` trả về `200 OK` với thông tin món, công thức nguyên liệu, danh sách size và topping hợp lệ.
  - `AC-07.2`: Nếu ID không tồn tại, trả về `404 Not Found`.

### 2.2. FR-08: Tùy biến Size & Topping (Recipe Customization)
- **MoSCoW**: Must Have
- **Acceptance Criteria (AC)**:
  - `AC-08.1`: Khách hàng chỉ được chọn 1 kích cỡ trong {S, M, L}. Mặc định chọn Size S.
  - `AC-08.2`: Khách hàng được chọn từ 0 đến tối đa 3 loại topping. Vượt quá 3 topping giao diện phải chặn chọn thêm.

### 2.3. FR-09: Tính giá linh hoạt & Xác thực giá Backend (Dynamic Pricing Validation)
- **MoSCoW**: Must Have
- **Acceptance Criteria (AC)**:
  - `AC-09.1`: Giá hiển thị trên UI tự động cập nhật khi đổi size hoặc chọn topping.
  - `AC-09.2`: Backend (`PricingService`) tự tính lại toàn bộ đơn giá dựa trên dữ liệu DB, không tin tưởng giá gửi lên từ Client.

---

## 3. BẢNG TRUY VẾT YÊU CẦU (TRACEABILITY TABLE)

| Mã FR | Tên yêu cầu | Use-Case liên kết | Sơ đồ liên quan | Code / API Endpoint | Test Case ID |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `FR-07` | Xem chi tiết món | `UC-02` (Tùy biến món) | `docs/diagrams/activity-browse.puml` | `GET /api/v1/products/:id` | `TC-DETAIL-01` |
| `FR-08` | Chọn size & topping | `UC-02` (Tùy biến món) | `docs/diagrams/class-diagram.puml` | `PricingService.calculateItemPrice` | `TC-DETAIL-02` |
| `FR-09` | Xác thực giá Backend | `UC-02` (Tùy biến món) | `docs/diagrams/class-diagram.puml` | `PricingService` | `TC-DETAIL-03` |
