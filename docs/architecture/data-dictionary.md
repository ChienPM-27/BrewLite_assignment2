# TỪ ĐIỂN DỮ LIỆU CƠ SỞ DỮ LIỆU — BREWLITE (DATA DICTIONARY)

> **Hệ quản trị CSDL**: PostgreSQL 16 (triển khai qua Supabase / Docker Compose)  
> **ORM**: Prisma Client v5.x  
> **Tài liệu tham chiếu**: [database-erd.svg](./database-erd.svg) | [ADR-003: Cơ sở dữ liệu quan hệ và Prisma ORM](./adr/003-postgres-prisma.md)  
> **Tổng số thực thể**: 16 bảng (gồm 12 bảng kế thừa A1 và 4 bảng mở rộng quản lý nguyên liệu theo CR-01).

---

## 1. TỔNG QUAN CÁC BẢNG TRONG CƠ SỞ DỮ LIỆU

| STT | Tên bảng CSDL | Tên Model Prisma | Phân hệ nghiệp vụ | Mô tả mục đích |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `users` | `User` | Auth & Profile | Tài khoản người dùng, băm mật khẩu, phân quyền và điểm loyalty |
| 2 | `categories` | `Category` | Menu Catalog | Danh mục phân loại đồ uống (Cà phê, Trà,...) |
| 3 | `products` | `Product` | Product Detail | Thông tin sản phẩm cốt lõi (tên, giá cơ sở, ảnh) |
| 4 | `size_prices` | `ProductSizePrice` | Pricing | Bảng cấu hình phụ thu theo từng kích cỡ (S, M, L) |
| 5 | `toppings` | `Topping` | Product Detail | Danh mục topping thêm và đơn giá tương ứng |
| 6 | `promotions` | `Promotion` | Discount | Mã giảm giá, điều kiện kích hoạt, thời hạn và số tiền giảm |
| 7 | `orders` | `Order` | Order Engine | Đơn hàng, trạng thái vòng đời, số tiền thực trả và tích điểm |
| 8 | `order_items` | `OrderItem` | Order Engine | Chi tiết từng dòng sản phẩm trong đơn (kích cỡ, số lượng, đơn giá) |
| 9 | `order_item_toppings`| `OrderItemTopping` | Order Engine | Topping đi kèm của từng dòng sản phẩm |
| 10 | `order_status_history`| `OrderStatusHistory`| State Machine | Nhật ký vết chuyển trạng thái đơn (audit trail) |
| 11 | `payments` | `Payment` | Payment Gateway | Bản ghi giao dịch thanh toán (Mock / VNPay Sandbox) |
| 12 | `loyalty_transactions`| `LoyaltyTransaction`| Loyalty | Nhật ký biến động tích điểm thưởng thành viên |
| 13 | `ingredients` | `Ingredient` | Inventory (CR-01) | Tồn kho nguyên liệu thực tế (sữa, cà phê, đường...) |
| 14 | `product_recipes` | `ProductRecipe` | Inventory (CR-01) | Định lượng nguyên liệu tiêu hao cho từng sản phẩm theo Size |
| 15 | `topping_recipes` | `ToppingRecipe` | Inventory (CR-01) | Định lượng nguyên liệu tiêu hao cho từng loại Topping |
| 16 | `order_ingredient_usages` | `OrderIngredientUsage` | Inventory (CR-01) | Snapshot nguyên liệu thực tế đã trừ của đơn hàng (dùng để hoàn kho khi hủy) |

---

## 2. CHI TIẾT CẤU TRÚC TỪNG BẢNG

### 2.1. Bảng `users` (Tài khoản người dùng)
* **Khóa chính**: `id`
* **Ràng buộc duy nhất**: `email`

| Tên cột | Kiểu dữ liệu | Null | Mặc định | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :---: | :--- |
| `id` | VARCHAR(36) | No | `uuid()` / `cuid()` | Khóa chính định danh người dùng duy nhất |
| `email` | VARCHAR(255) | No | - | Email đăng nhập (UNIQUE, viết thường, chuẩn hóa) |
| `password_hash` | VARCHAR(255) | No | - | Mật khẩu băm an toàn bằng Bcrypt 10 rounds (`$2b$10$...`) |
| `full_name` | VARCHAR(100) | Yes | NULL | Họ và tên hiển thị của người dùng |
| `role` | ENUM(`Role`) | No | `'CUSTOMER'` | Phân quyền người dùng: `'CUSTOMER'` hoặc `'ADMIN'` |
| `loyalty_points` | INTEGER | No | `0` | Số điểm thưởng tích lũy hiện có của khách hàng |
| `created_at` | TIMESTAMP | No | `NOW()` | Thời điểm tạo tài khoản |
| `updated_at` | TIMESTAMP | No | `NOW()` | Thời điểm cập nhật thông tin cuối cùng |

---

### 2.2. Bảng `categories` (Danh mục sản phẩm)
* **Khóa chính**: `id`
* **Ràng buộc duy nhất**: `name`, `slug`

| Tên cột | Kiểu dữ liệu | Null | Mặc định | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :---: | :--- |
| `id` | VARCHAR(36) | No | `cuid()` | Khóa chính danh mục |
| `name` | VARCHAR(100) | No | - | Tên hiển thị danh mục (UNIQUE: Cà phê, Trà,...) |
| `slug` | VARCHAR(100) | No | - | Đường dẫn URL thân thiện (UNIQUE) |
| `display_order` | INTEGER | No | `0` | Thứ tự ưu tiên sắp xếp trên thanh điều hướng |
| `created_at` | TIMESTAMP | No | `NOW()` | Thời điểm tạo |
| `updated_at` | TIMESTAMP | No | `NOW()` | Thời điểm cập nhật |

---

### 2.3. Bảng `products` (Sản phẩm đồ uống)
* **Khóa chính**: `id`
* **Khóa ngoại**: `category_id` ➔ `categories(id)`

| Tên cột | Kiểu dữ liệu | Null | Mặc định | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :---: | :--- |
| `id` | VARCHAR(36) | No | `cuid()` | Khóa chính sản phẩm |
| `category_id` | VARCHAR(36) | Yes | NULL | Tham chiếu tới danh mục phân loại |
| `name` | VARCHAR(150) | No | - | Tên sản phẩm đồ uống |
| `description` | TEXT | Yes | NULL | Mô tả hương vị và chi tiết món |
| `base_price` | DECIMAL(10,2)| No | - | Giá cơ sở (áp dụng cho Size chuẩn / Size S) |
| `image_url` | VARCHAR(500) | Yes | NULL | Đường dẫn ảnh đại diện sản phẩm |
| `is_available` | BOOLEAN | No | `true` | Trạng thái mở bán (`false` là tạm ngưng phục vụ) |
| `stock` | INTEGER | No | `0` | *(DEPRECATED)* Cột tồn kho cũ của A1, A2 chuyển sang quản lý kho nguyên liệu |
| `version` | INTEGER | No | `0` | *(DEPRECATED)* Optimistic locking version cũ của A1 |
| `created_at` | TIMESTAMP | No | `NOW()` | Thời điểm tạo |
| `updated_at` | TIMESTAMP | No | `NOW()` | Thời điểm cập nhật |

---

### 2.4. Bảng `size_prices` (Phụ thu theo kích cỡ)
* **Khóa chính**: `id`
* **Ràng buộc duy nhất**: `(product_id, size)`
* **Khóa ngoại**: `product_id` ➔ `products(id)` ON DELETE CASCADE

| Tên cột | Kiểu dữ liệu | Null | Mặc định | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :---: | :--- |
| `id` | VARCHAR(36) | No | `cuid()` | Khóa chính bản ghi cấu hình |
| `product_id` | VARCHAR(36) | No | - | ID sản phẩm áp dụng |
| `size` | ENUM(`ProductSize`) | No | - | Kích cỡ đồ uống: `'S'`, `'M'`, `'L'` |
| `price_adjustment` | DECIMAL(10,2)| No | `0.00` | Số tiền phụ thu cộng thêm vào `base_price` |

---

### 2.5. Bảng `toppings` (Danh mục Topping)
* **Khóa chính**: `id`
* **Ràng buộc duy nhất**: `name`

| Tên cột | Kiểu dữ liệu | Null | Mặc định | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :---: | :--- |
| `id` | VARCHAR(36) | No | `cuid()` | Khóa chính topping |
| `name` | VARCHAR(100) | No | - | Tên topping (Trân châu trắng, Thạch đào,...) |
| `price` | DECIMAL(10,2)| No | - | Đơn giá bán lẻ của topping |
| `is_available` | BOOLEAN | No | `true` | Cờ trạng thái còn bán |
| `stock` | INTEGER | No | `0` | *(DEPRECATED)* Tồn kho cũ |
| `created_at` | TIMESTAMP | No | `NOW()` | Thời điểm tạo |
| `updated_at` | TIMESTAMP | No | `NOW()` | Thời điểm cập nhật |

---

### 2.6. Bảng `promotions` (Mã khuyến mãi)
* **Khóa chính**: `id`
* **Ràng buộc duy nhất**: `code`

| Tên cột | Kiểu dữ liệu | Null | Mặc định | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :---: | :--- |
| `id` | VARCHAR(36) | No | `cuid()` | Khóa chính mã khuyến mãi |
| `code` | VARCHAR(50) | No | - | Mã voucher nhập khi checkout (UNIQUE, ví dụ: WELCOME10, GIAM15K) |
| `discount_percent` | DECIMAL(5,2) | Yes | NULL | Phần trăm giảm giá (nếu là voucher theo %) |
| `discount_amount` | DECIMAL(10,2)| Yes | NULL | Số tiền giảm cố định (nếu là voucher tiền mặt) |
| `min_order_amount` | DECIMAL(10,2)| No | `0.00` | Giá trị đơn hàng tối thiểu để được áp dụng mã |
| `max_discount` | DECIMAL(10,2)| Yes | NULL | Số tiền giảm tối đa (trần giảm giá đối với voucher %) |
| `start_date` | TIMESTAMP | No | - | Ngày bắt đầu có hiệu lực |
| `end_date` | TIMESTAMP | Yes | NULL | Ngày hết hạn (NULL nghĩa là vô thời hạn) |
| `is_active` | BOOLEAN | No | `true` | Trạng thái kích hoạt của mã |

---

### 2.7. Bảng `orders` (Đơn hàng)
* **Khóa chính**: `id`
* **Ràng buộc duy nhất**: `order_number`
* **Khóa ngoại**: `user_id` ➔ `users(id)`, `promotion_id` ➔ `promotions(id)`

| Tên cột | Kiểu dữ liệu | Null | Mặc định | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :---: | :--- |
| `id` | VARCHAR(36) | No | `cuid()` | Khóa chính định danh đơn hàng |
| `order_number` | INTEGER | No | `autoincrement` | Số hiệu đơn hàng tăng dần hiển thị cho khách |
| `user_id` | VARCHAR(36) | No | - | Khách hàng sở hữu đơn |
| `status` | ENUM(`OrderStatus`)| No | `'PENDING'` | Trạng thái đơn theo Finite State Machine (PENDING, PAID, PREPARING, READY, COMPLETED, CANCELLED, PAYMENT_FAILED) |
| `total_amount` | DECIMAL(10,2)| No | - | Tổng tạm tính giá các món trước giảm giá |
| `discount_amount` | DECIMAL(10,2)| No | `0.00` | Số tiền được giảm trừ |
| `final_amount` | DECIMAL(10,2)| No | - | Số tiền thanh toán cuối cùng thực tế (`total_amount - discount_amount`) |
| `promotion_id` | VARCHAR(36) | Yes | NULL | Mã khuyến mãi đã áp dụng (nếu có) |
| `points_earned` | INTEGER | No | `0` | Số điểm thưởng loyalty được cộng (khi chuyển PAID) |
| `version` | INTEGER | No | `0` | Optimistic concurrency control version |
| `paid_at` | TIMESTAMP | Yes | NULL | Thời điểm thanh toán thành công |
| `created_at` | TIMESTAMP | No | `NOW()` | Thời điểm tạo đơn |
| `updated_at` | TIMESTAMP | No | `NOW()` | Thời điểm cập nhật |

---

### 2.8. Bảng `order_items` & `order_item_toppings` (Chi tiết dòng món & topping)
* **Bảng `order_items`**:
  * `id`: Khóa chính
  * `order_id`: Khóa ngoại ➔ `orders(id)` ON DELETE CASCADE
  * `product_id`: Khóa ngoại ➔ `products(id)`
  * `size`: Kích cỡ (`S`, `M`, `L`)
  * `quantity`: Số lượng ly (1 - 99)
  * `unit_price`: Đơn giá tại thời điểm đặt
  * `line_total`: Tổng tiền dòng món (`unit_price * quantity`)
* **Bảng `order_item_toppings`**:
  * `id`: Khóa chính
  * `order_item_id`: Khóa ngoại ➔ `order_items(id)` ON DELETE CASCADE
  * `topping_id`: Khóa ngoại ➔ `toppings(id)`
  * `topping_name`: Tên topping lưu vết snapshot
  * `price`: Đơn giá topping tại thời điểm đặt

---

### 2.9. Bảng `order_status_history` (Nhật ký chuyển trạng thái)
* **Khóa chính**: `id`
* **Khóa ngoại**: `order_id` ➔ `orders(id)` ON DELETE CASCADE

| Tên cột | Kiểu dữ liệu | Null | Mặc định | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :---: | :--- |
| `id` | VARCHAR(36) | No | `cuid()` | Khóa chính bản ghi lịch sử |
| `order_id` | VARCHAR(36) | No | - | Đơn hàng được cập nhật |
| `from_status` | VARCHAR(30) | Yes | NULL | Trạng thái trước khi chuyển (NULL khi tạo mới) |
| `to_status` | VARCHAR(30) | No | - | Trạng thái sau khi chuyển |
| `changed_by` | VARCHAR(100) | No | `'system'` | Tác nhân thực hiện chuyển trạng thái (system, admin, customer, vnpay) |
| `reason` | VARCHAR(255) | Yes | NULL | Ghi chú lý do chuyển (ví dụ: "Order created", "VNPay IPN Success") |
| `created_at` | TIMESTAMP | No | `NOW()` | Thời điểm thực hiện chuyển đổi |

---

### 2.10. Bảng `payments` (Giao dịch thanh toán)
* **Khóa chính**: `id`
* **Ràng buộc duy nhất**: `transaction_id`, `idempotency_key`
* **Khóa ngoại**: `order_id` ➔ `orders(id)`

| Tên cột | Kiểu dữ liệu | Null | Mặc định | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :---: | :--- |
| `id` | VARCHAR(36) | No | `cuid()` | Khóa chính giao dịch |
| `order_id` | VARCHAR(36) | No | - | Đơn hàng thanh toán |
| `amount` | DECIMAL(10,2)| No | - | Số tiền thanh toán (VND) |
| `method` | ENUM(`PaymentMethod`)| No | `'VNPAY'` | Phương thức thanh toán (VNPAY, MOCK, CASH) |
| `gateway` | ENUM(`PaymentGateway`)| No | `'VNPAY'` | Cổng thanh toán phụ trách |
| `status` | ENUM(`PaymentStatus`)| No | `'PENDING'` | Trạng thái giao dịch: PENDING, SUCCESS, FAILED, REFUNDED |
| `transaction_id` | VARCHAR(100) | Yes | NULL | Mã giao dịch phía cổng thanh toán trả về (UNIQUE) |
| `idempotency_key`| VARCHAR(100) | Yes | NULL | Khóa chống trùng lặp request (UNIQUE) |
| `raw_response` | JSONB | Yes | NULL | Dữ liệu gốc JSON/IPN do cổng thanh toán gửi về |
| `failure_reason`| VARCHAR(255) | Yes | NULL | Lý do thất bại nếu giao dịch lỗi |
| `paid_at` | TIMESTAMP | Yes | NULL | Thời điểm thanh toán thành công |
| `created_at` | TIMESTAMP | No | `NOW()` | Thời điểm tạo giao dịch |
| `updated_at` | TIMESTAMP | No | `NOW()` | Thời điểm cập nhật |

---

### 2.11. Bảng `loyalty_transactions` (Lịch sử điểm thưởng)
* **Khóa chính**: `id`
* **Khóa ngoại**: `user_id` ➔ `users(id)`, `order_id` ➔ `orders(id)`

| Tên cột | Kiểu dữ liệu | Null | Mặc định | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :---: | :--- |
| `id` | VARCHAR(36) | No | `cuid()` | Khóa chính giao dịch điểm |
| `user_id` | VARCHAR(36) | No | - | Khách hàng nhận hoặc sử dụng điểm |
| `order_id` | VARCHAR(36) | Yes | NULL | Đơn hàng phát sinh giao dịch điểm |
| `points` | INTEGER | No | - | Số điểm cộng (dương) hoặc trừ (âm) |
| `type` | ENUM(`LoyaltyTransactionType`)| No | `'EARNED'` | Loại giao dịch: EARNED (tích lũy), REDEEMED (đổi quà), EXPIRED |
| `reason` | VARCHAR(255) | Yes | NULL | Ghi chú lý do phát sinh giao dịch điểm |
| `created_at` | TIMESTAMP | No | `NOW()` | Thời điểm ghi nhận giao dịch |

---

## 3. PHÂN HỆ QUẢN LÝ NGUYÊN LIỆU & TỒN KHO THẬT (MỞ RỘNG THEO CR-01)

> Đây là 4 bảng cốt lõi được bổ sung hoàn toàn mới trong Assignment 2 để thay thế cơ chế trừ tồn kho giả định `Product.stock` của Assignment 1.

### 3.1. Bảng `ingredients` (Kho nguyên liệu pha chế)
* **Khóa chính**: `id`
* **Ràng buộc duy nhất**: `name`

| Tên cột | Kiểu dữ liệu | Null | Mặc định | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :---: | :--- |
| `id` | VARCHAR(36) | No | `cuid()` | Khóa chính định danh nguyên liệu |
| `name` | VARCHAR(100) | No | - | Tên nguyên liệu (Hạt cà phê Robusta, Sữa tươi tiệt trùng, Đường nước,...) |
| `unit` | VARCHAR(20) | No | - | Đơn vị đo lường: `'g'` (gram), `'ml'`, `'piece'` |
| `stock` | DECIMAL(10,2)| No | `0.00` | Số lượng tồn kho thực tế hiện tại |
| `min_threshold` | DECIMAL(10,2)| No | `0.00` | Ngưỡng tồn kho tối thiểu cảnh báo hết hàng |
| `is_available` | BOOLEAN | No | `true` | Cờ khả dụng: `false` là ngưng sử dụng nguyên liệu này |
| `created_at` | TIMESTAMP | No | `NOW()` | Thời điểm tạo |
| `updated_at` | TIMESTAMP | No | `NOW()` | Thời điểm cập nhật |

---

### 3.2. Bảng `product_recipes` (Công thức tiêu hao món theo Size)
* **Khóa chính**: `id`
* **Ràng buộc duy nhất**: `(product_id, ingredient_id, size)`
* **Khóa ngoại**: `product_id` ➔ `products(id)` ON DELETE CASCADE, `ingredient_id` ➔ `ingredients(id)` ON DELETE CASCADE

| Tên cột | Kiểu dữ liệu | Null | Mặc định | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :---: | :--- |
| `id` | VARCHAR(36) | No | `cuid()` | Khóa chính dòng công thức |
| `product_id` | VARCHAR(36) | No | - | Món áp dụng |
| `ingredient_id`| VARCHAR(36) | No | - | Nguyên liệu tiêu tốn |
| `size` | ENUM(`ProductSize`)| No | `'M'` | Kích cỡ áp dụng (`S`, `M`, `L`) |
| `quantity` | DECIMAL(10,2)| No | - | Lượng nguyên liệu tiêu hao cho 1 ly size tương ứng |

---

### 3.3. Bảng `topping_recipes` (Công thức tiêu hao của Topping)
* **Khóa chính**: `id`
* **Ràng buộc duy nhất**: `(topping_id, ingredient_id)`
* **Khóa ngoại**: `topping_id` ➔ `toppings(id)` ON DELETE CASCADE, `ingredient_id` ➔ `ingredients(id)` ON DELETE CASCADE

| Tên cột | Kiểu dữ liệu | Null | Mặc định | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :---: | :--- |
| `id` | VARCHAR(36) | No | `cuid()` | Khóa chính dòng công thức topping |
| `topping_id` | VARCHAR(36) | No | - | Loại topping tương ứng |
| `ingredient_id`| VARCHAR(36) | No | - | Nguyên liệu cấu thành topping |
| `quantity` | DECIMAL(10,2)| No | - | Định lượng nguyên liệu tiêu hao cho 1 phần topping |

---

### 3.4. Bảng `order_ingredient_usages` (Snapshot tiêu hao nguyên liệu của đơn)
* **Khóa chính**: `id`
* **Ràng buộc duy nhất**: `(order_id, ingredient_id)`
* **Khóa ngoại**: `order_id` ➔ `orders(id)` ON DELETE CASCADE, `ingredient_id` ➔ `ingredients(id)`

| Tên cột | Kiểu dữ liệu | Null | Mặc định | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :---: | :--- |
| `id` | VARCHAR(36) | No | `cuid()` | Khóa chính dòng snapshot |
| `order_id` | VARCHAR(36) | No | - | Đơn hàng đã trừ nguyên liệu |
| `ingredient_id`| VARCHAR(36) | No | - | Nguyên liệu đã bị trừ kho |
| `quantity` | DECIMAL(10,2)| No | - | Tổng số lượng nguyên liệu thực tế đã trừ của đơn hàng |
| `created_at` | TIMESTAMP | No | `NOW()` | Thời điểm ghi nhận (cùng lúc đơn chuyển PENDING) |

---

## 4. KẾT LUẬN & ĐỐI CHIẾU KIẾN TRÚC CSDL

1. CSDL của BrewLite Assignment 2 gồm **16 thực thể hoàn chỉnh**, được chuẩn hóa ở mức chuẩn 3 (3NF).
2. Việc chuyển đổi từ trừ kho sản phẩm sang **trừ kho nguyên liệu nguyên tử** thông qua `product_recipes` và `order_ingredient_usages` đã giải quyết triệt để bài toán chống âm kho và bảo đảm khả năng hoàn kho chính xác 100% khi đơn bị hủy (`CANCELLED`).
