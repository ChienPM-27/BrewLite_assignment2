# THỰC ĐƠN & TÌM KIẾM — ĐẶC TẢ YÊU CẦU CHỨC NĂNG (FR-04..06)

> **Người phụ trách**: Nhật Lan  
> **Mã Task**: `SP1-03` (Task 1.2)  
> **Dải ID**: `FR-04` đến `FR-06`

---

## 1. TỔNG QUAN
### 1.1. Mục đích
- Tài liệu đặc tả các yêu cầu chức năng liên quan đến việc duyệt danh mục, xem danh sách và tìm kiếm sản phẩm trên hệ thống BrewLite.
- Các chức năng này hỗ trợ khách hàng tìm kiếm đồ uống phù hợp trước khi chuyển sang bước xem chi tiết sản phẩm, lựa chọn kích cỡ, topping và thêm vào giỏ hàng.

### 1.2. Phạm vi
- Tài liệu bao gồm ba yêu cầu chức năng:
| Mã yêu cầu | Tên yêu cầu | Mức ưu tiên MoSCoW |
|---|---|---|
| FR-04 | Xem danh mục sản phẩm (Category Browsing) | Must Have |
| FR-05 | Xem danh sách món & kiểm tra tồn kho | Must Have |
| FR-06 | Tìm kiếm món uống theo tên | Should Have |
---

## 2. DANH SÁCH YÊU CẦU CHỨC NĂNG
### 2.1. FR-04: Xem danh mục sản phẩm (Category Browsing)
- **MoSCoW**: Must Have
- **Mô tả**: Khách hàng có thể xem và lựa chọn danh mục sản phẩm (Cà phê, Trà,...) để lọc danh sách món uống tương ứng trên trang Menu.

#### 2.1.1. Tiêu chí chấp nhận (Acceptance Criteria)
| Mã AC | Điều kiện kiểm thử | Kết quả mong đợi |
|---|---|---|
| AC-04.01 | Khách hàng truy cập trang Menu. | Hệ thống hiển thị danh sách danh mục sản phẩm. |
| AC-04.02 | Khách hàng chọn một danh mục, ví dụ “Cà phê”. | Chỉ hiển thị các sản phẩm thuộc danh mục được chọn và đáp ứng quy tắc hiển thị của FR-05. |
| AC-04.03 | Khách hàng chuyển sang danh mục khác. | Danh sách sản phẩm được cập nhật theo danh mục mới. |
| AC-04.04 | Khách hàng chọn “Tất cả”. | Hệ thống hiển thị sản phẩm từ tất cả danh mục theo quy tắc FR-05. |
| AC-04.05 | Danh mục được chọn không có sản phẩm phù hợp. | Hệ thống hiển thị thông báo không có sản phẩm. |
| AC-04.06 | Không thể tải dữ liệu sản phẩm. | Hệ thống hiển thị thông báo lỗi và cho phép thử lại. |

### 2.2. FR-05: Xem danh sách món uống (Product Catalog Listing)
- **MoSCoW**: Must Have
- **Mô tả**: Hiển thị danh sách các món uống đang mở bán và còn đủ điều kiện đặt hàng, gồm hình ảnh, tên món và giá cơ bản.

#### 2.2.1. Tiêu chí chấp nhận (Acceptance Criteria)
| Mã AC | Điều kiện kiểm thử | Kết quả mong đợi |
|---|---|---|
| AC-05.01 | Khách hàng truy cập trang Menu và API trả về danh sách sản phẩm hợp lệ. | Hệ thống hiển thị danh sách sản phẩm. |
| AC-05.02 | Sản phẩm có đầy đủ thông tin tên, hình ảnh và giá cơ sở. | Các thông tin được hiển thị chính xác theo dữ liệu Backend cung cấp. |
| AC-05.03 | Sản phẩm không đủ nguyên liệu theo định lượng công thức. | Sản phẩm không xuất hiện trong danh sách Menu. |
| AC-05.04 | API trả về danh sách sản phẩm rỗng. | Hệ thống hiển thị thông báo không có sản phẩm. |
| AC-05.05 | API gặp lỗi hoặc mất kết nối mạng. | Hệ thống hiển thị thông báo lỗi và cho phép thử lại. |
| AC-05.06 | Khách hàng chọn một sản phẩm có thể đặt hàng. | Hệ thống chuyển đến trang chi tiết của sản phẩm tương ứng. |

### 2.3. FR-06: Tìm kiếm món theo tên (Product Search)
- **MoSCoW**: Should Have
- **Mô tả**: Ô tìm kiếm cho phép lọc món theo từ khóa gần đúng không phân biệt hoa thường.

#### 2.3.1. Tiêu chí chấp nhận (Acceptance Criteria)
| Mã AC | Điều kiện kiểm thử | Kết quả mong đợi |
|---|---|---|
| AC-06.01 | Khách hàng nhập từ khóa “cà phê”. | Hệ thống hiển thị các sản phẩm có tên phù hợp với từ khóa. |
| AC-06.02 | Khách hàng nhập “CA PHE” thay cho “cà phê”. | Kết quả tìm kiếm tương đương, không phân biệt chữ hoa/thường và dấu tiếng Việt. |
| AC-06.03 | Khách hàng nhập từ khóa không khớp với sản phẩm nào. | Hệ thống hiển thị thông báo không tìm thấy sản phẩm phù hợp. |
| AC-06.04 | Khách hàng xóa toàn bộ từ khóa tìm kiếm. | Hệ thống hiển thị lại danh sách sản phẩm theo danh mục hiện tại. |
| AC-06.05 | Khách hàng chọn danh mục “Cà phê” và nhập từ khóa “sữa”. | Chỉ hiển thị các sản phẩm thuộc danh mục Cà phê có tên phù hợp với từ khóa “sữa”. |
| AC-06.06 | Khách hàng thay đổi nội dung ô tìm kiếm. | Danh sách kết quả được cập nhật tương ứng mà không cần tải lại trang. |
---

## 3. BẢNG TRUY VẾT YÊU CẦU (TRACEABILITY TABLE)

| Mã FR | Tên yêu cầu | Use-Case liên kết | Sơ đồ liên quan | Code / API Endpoint | Test Case ID |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `FR-04` | Xem danh mục món | `UC-01` (Xem thực đơn) | `docs/diagrams/activity-browse.puml` | `GET /api/v1/products` | `TC-MENU-01` |
| `FR-05` | Danh sách sản phẩm | `UC-01` (Xem thực đơn) | `docs/diagrams/usecase-overview.puml` | `GET /api/v1/products` | `TC-MENU-02` |
| `FR-06` | Tìm kiếm món uống | `UC-01` (Xem thực đơn) | `docs/diagrams/activity-browse.puml` | Client search / API query | `TC-MENU-03` |
