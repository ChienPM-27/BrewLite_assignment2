# THỰC ĐƠN & TÌM KIẾM — ĐẶC TẢ YÊU CẦU CHỨC NĂNG (FR-04..06)

> **Người phụ trách**: Nhật Lan  
> **Mã Task**: `SP1-03` (Task 1.2)  
> **Dải ID**: `FR-04` đến `FR-06`

---

## 1. TỔNG QUAN
Cung cấp khả năng hiển thị danh mục sản phẩm, danh sách đồ uống phân loại và tìm kiếm món uống trực quan, nhanh chóng cho khách hàng.

---

## 2. DANH SÁCH YÊU CẦU CHỨC NĂNG

### 2.1. FR-04: Xem danh mục sản phẩm (Category Browsing)
- **MoSCoW**: Must Have
- **Mô tả**: Khách hàng có thể chuyển đổi giữa các tab danh mục (Cà phê, Trà, Đá xay, Bánh ngọt...).
- **Acceptance Criteria (AC)**:
  - `AC-04.1`: Hiển thị đầy đủ các danh mục active.
  - `AC-04.2`: Khi chọn một danh mục, hệ thống lọc danh sách sản phẩm hiển thị ngay lập tức không cần tải lại trang.

### 2.2. FR-05: Xem danh sách món uống (Product Catalog Listing)
- **MoSCoW**: Must Have
- **Mô tả**: Hiển thị thẻ món gồm hình ảnh, tên món và giá cơ bản.
- **Acceptance Criteria (AC)**:
  - `AC-05.1`: Gọi API `GET /api/v1/products` trả về mã `200 OK` kèm danh sách món.

### 2.3. FR-06: Tìm kiếm món theo tên (Product Search)
- **MoSCoW**: Should Have
- **Mô tả**: Ô tìm kiếm cho phép lọc món theo từ khóa gần đúng không phân biệt hoa thường.
- **Acceptance Criteria (AC)**:
  - `AC-06.1`: Nhập từ khóa ➔ danh sách sản phẩm hiển thị các món có tên chứa từ khóa.
  - `AC-06.2`: Nếu không tìm thấy món, hiển thị giao diện trạng thái rỗng (Empty State) thân thiện.

---

## 3. BẢNG TRUY VẾT YÊU CẦU (TRACEABILITY TABLE)

| Mã FR | Tên yêu cầu | Use-Case liên kết | Sơ đồ liên quan | Code / API Endpoint | Test Case ID |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `FR-04` | Xem danh mục món | `UC-01` (Xem thực đơn) | `docs/diagrams/activity-browse.puml` | `GET /api/v1/products` | `TC-MENU-01` |
| `FR-05` | Danh sách sản phẩm | `UC-01` (Xem thực đơn) | `docs/diagrams/usecase-overview.puml` | `GET /api/v1/products` | `TC-MENU-02` |
| `FR-06` | Tìm kiếm món uống | `UC-01` (Xem thực đơn) | `docs/diagrams/activity-browse.puml` | Client search / API query | `TC-MENU-03` |
