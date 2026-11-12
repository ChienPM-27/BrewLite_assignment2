# GIỎ HÀNG — ĐẶC TẢ YÊU CẦU CHỨC NĂNG (FR-10..12)

> **Người phụ trách**: Quách Tuấn Hào  
> **Mã Task**: `SP1-05` (Task 1.2)  
> **Dải ID phân công**: `FR-10` đến `FR-12`  
> **Tài liệu liên kết**: [srs.md](./srs.md), [ADR-004](../architecture/adr/004-jwt-zustand.md), [test-scenarios.md](./test-scenarios.md)

---

## 1. TỔNG QUAN PHẠM VI CHỨC NĂNG

Quản lý trạng thái giỏ hàng của khách hàng phía Client bằng thư viện **Zustand** kết hợp middleware **`persist` (`localStorage`)**, hỗ trợ đầy đủ thao tác thêm, chỉnh sửa cấu hình kích cỡ/topping, xóa món, tính toán tổng tiền tạm tính tức thì và đảm bảo **bất biến giữ nguyên giỏ hàng** khi quá trình đặt đơn hoặc thanh toán gặp sự cố.

---

## 2. DANH SÁCH YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS)

### 2.1. FR-10: Thêm, sửa, xóa món trong giỏ hàng (Cart Management)
- **Độ ưu tiên (MoSCoW)**: Must Have
- **Mô tả nghiệp vụ**: Khách hàng có thể thêm đồ uống kèm tùy chọn kích cỡ (`S`, `M`, `L`) và Topping (tối đa 3 loại) vào giỏ hàng, chỉnh sửa lại cấu hình món ngay trong giỏ hoặc xóa từng món/toàn bộ giỏ.
- **Tiêu chí chấp nhận (Acceptance Criteria - AC)**:
  - `AC-10.1`: **Thêm món & Gộp dòng tự động** ➔ Khi gọi `useCartStore.addItem()`, hệ thống sinh khóa định danh dòng tất định theo công thức `cartItemId = "${productId}-${size}-${[...toppingIds].sort().join('-')}"`. Nếu trùng `cartItemId` với dòng đã có trong giỏ ➔ cộng dồn `quantity` (tối đa `MAX_QUANTITY_PER_LINE = 99`); nếu khác `size` hoặc khác tập `toppingIds` ➔ tách thành dòng giỏ hàng mới.
  - `AC-10.2`: **Chỉnh sửa cấu hình món trong giỏ** ➔ Tại trang Giỏ hàng (`/cart`), khách hàng mở `EditCartItemModal` để đổi `size` hoặc `toppingIds` (`updateItem`). Nếu cấu hình mới trùng `cartItemId` với một dòng khác đã có sẵn trong giỏ, hệ thống tự động hợp nhất hai dòng và cộng dồn số lượng.
  - `AC-10.3`: **Giảm số lượng & Xóa món** ➔ Khi giảm số lượng về `<= 0` (`updateQuantity(id, 0)`) hoặc nhấn nút Xóa món (`removeItem(id)`), dòng sản phẩm đó bị loại bỏ hoàn toàn khỏi mảng `items` của giỏ hàng.

### 2.2. FR-11: Tính tổng tiền giỏ hàng tự động (Cart Total Calculation)
- **Độ ưu tiên (MoSCoW)**: Must Have
- **Mô tả nghiệp vụ**: Tự động tính tổng số lượng ly hiển thị trên thanh điều hướng (`badgeCount`) và tổng tiền tạm tính của toàn bộ giỏ hàng (`totalAmount`) ngay khi có bất kỳ thao tác thay đổi nào.
- **Tiêu chí chấp nhận (Acceptance Criteria - AC)**:
  - `AC-11.1`: **Công thức tính tổng tiền & số lượng** ➔ Đơn giá tạm tính mỗi ly được tính bằng `estimatedUnitPrice = basePrice + sizePriceAdjustment + sum(toppingPrices)`. Tổng tiền tạm tính toàn giỏ hàng bằng `totalAmount = sum(estimatedUnitPrice * quantity)` và tổng số lượng badge bằng `badgeCount = sum(quantity)`.
  - `AC-11.2`: **Cập nhật tức thì & Xác thực giá phía Server** ➔ Mọi thao tác thêm, sửa, tăng/giảm số lượng hoặc xóa món đều cập nhật `totalAmount` và `badgeCount` tức thì trên giao diện mà không bị trễ mạng; khi gửi đơn hàng lên Server (`POST /api/v1/orders`), `PricingService` và `PromotionsService` tại Backend sẽ tính toán và xác thực lại số tiền thanh toán chính thức (`FR-09`).

### 2.3. FR-12: Lưu trữ bền vững & Giữ giỏ hàng khi lỗi thanh toán (Cart Persistence & Resilience)
- **Độ ưu tiên (MoSCoW)**: Must Have
- **Mô tả nghiệp vụ**: Lưu trữ giỏ hàng bền vững trong bộ nhớ trình duyệt và bảo toàn trạng thái giỏ hàng khi gặp lỗi xác thực, hết nguyên liệu hoặc lỗi cổng thanh toán.
- **Tiêu chí chấp nhận (Acceptance Criteria - AC)**:
  - `AC-12.1`: **Lưu trữ bền vững qua `localStorage`** ➔ Dữ liệu giỏ hàng được lưu dưới khóa `brewlite_cart_storage` (`version: 2`). Khi khách hàng tải lại trang (reload F5), chuyển trang đăng nhập hoặc mở lại ứng dụng PWA, toàn bộ danh sách món và số lượng vẫn được giữ nguyên.
  - `AC-12.2`: **Bắt buộc giữ nguyên giỏ hàng khi lỗi** ➔ Khi tạo đơn bị từ chối (`400 Bad Request` do thiếu nguyên liệu) hoặc khi thanh toán thất bại / khách hủy giao dịch (`OrderStatus.PAYMENT_FAILED`), hệ thống **BẮT BUỘC GIỮ NGUYÊN GIỎ HÀNG** cùng thông tin `pendingOrderId` và `pendingCartSignature` (`computeCartSignature`) để khách hàng có thể thử lại thanh toán hoặc đổi món ngay mà không phải chọn lại từ đầu.
  - `AC-12.3`: **Chỉ làm sạch giỏ hàng khi hoàn tất thanh toán** ➔ Hành động xóa sạch giỏ hàng (`useCartStore.clearCart()`) chỉ được phép gọi duy nhất sau khi đơn hàng đã chuyển sang trạng thái đã thanh toán thành công (`OrderStatus.PAID`).

---

## 3. BẢNG TRUY VẾT YÊU CẦU (TRACEABILITY TABLE)

| Mã FR | Tên yêu cầu | Use-Case liên kết | Sơ đồ liên quan | Code / API Endpoint | Test Case ID |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `FR-10` | Thêm, sửa, xóa món trong giỏ hàng | `UC-03` (Quản lý giỏ hàng), `UC-ORDER-PAYMENT` | `docs/diagrams/activity-e2e.puml` | `useCartStore` (`addItem`, `updateItem`, `updateQuantity`, `removeItem`), `EditCartItemModal` | `TC-CART-01`, `TC-CART-02` |
| `FR-11` | Tính tổng tiền giỏ hàng tự động | `UC-03` (Quản lý giỏ hàng), `UC-ORDER-PAYMENT` | `docs/diagrams/activity-e2e.puml` | `useCartStore` (`totalAmount`, `badgeCount`), `apps/web/src/app/cart/page.tsx` | `TC-CART-03` |
| `FR-12` | Lưu trữ bền vững & Giữ giỏ khi lỗi thanh toán | `UC-ORDER-PAYMENT` (Đặt và thanh toán) | `docs/diagrams/activity-e2e.puml`, `docs/diagrams/sequence-checkout.puml` | `useCartStore` (`persist`, `computeCartSignature`, `clearCart`), `apps/web/src/app/checkout/**` | `TC-CART-04` |
