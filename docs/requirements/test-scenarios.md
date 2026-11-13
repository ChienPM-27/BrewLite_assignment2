# MA TRẬN KỊCH BẢN KIỂM THỬ (TEST SCENARIOS & MAPPING)

> **Người phụ trách**: Nguyễn Quang Huy  
> **Mã Task**: `SP1-08` (Task 2)  
> **Baseline**: 13/11/2026, sau các PR cuối Sprint 1.

## 1. PHẠM VI VÀ CÁCH ĐỌC

Bảng tổng hợp đủ **141 AC** từ 7 FR và **14 AC** của `UC-ORD-01`. Mỗi AC có ít nhất một Test Case ID; Given/When/Then và các assertion chi tiết trong FR/use-case là tiêu chuẩn viết test. Các tóm tắt dưới đây không thay thế đặc tả.

**Trạng thái các dòng: kịch bản cần viết hoặc kiểm chứng ở Sprint 2.** Loại kiểm thử là mức dự kiến; cột code là phạm vi mục tiêu, không khẳng định đã có test tương ứng. Test ID và việc suite đang xanh không tự chứng minh AC đã được bao phủ. Test Unit có Prisma mock không được tính là Integration trên DB thật.

| Nhóm | Owner | Số AC | Nguồn |
| :--- | :--- | ---: | :--- |
| Auth | Hào | 10 | [fr-auth.md](fr-auth.md) |
| Menu | Lan | 18 | [fr-menu.md](fr-menu.md) |
| Detail | Vũ Huy | 14 | [fr-detail.md](fr-detail.md) |
| Cart | Hào | 8 | [fr-cart.md](fr-cart.md) |
| Order | Hạnh | 50 | [fr-order.md](fr-order.md) |
| Payment | Kiệt | 19 | [fr-payment.md](fr-payment.md) |
| History | Quang Huy | 22 | [fr-history.md](fr-history.md) |
| Use-case | Hạnh, phối hợp Kiệt/Hào | 14 | [usecase-order-payment.md](usecase-order-payment.md) |

## 2. ÁNH XẠ AC CỦA FR

### Auth

| Nhóm chức năng | Mã AC | Mô tả kịch bản kiểm thử | Loại kiểm thử dự kiến | Test Case ID | Phạm vi code cần kiểm chứng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Auth | `AC-01.1` | Đăng ký tài khoản thành công với email & mật khẩu hợp lệ | Integration | `TC-AUTH-01` | `apps/api/src/modules/auth`<br>`apps/api/src/common/guards` |
| Auth | `AC-01.2` | Mật khẩu được băm bcrypt, không lưu plain text | Unit | `TC-AUTH-02` | `apps/api/src/modules/auth`<br>`apps/api/src/common/guards` |
| Auth | `AC-01.3` | Đăng ký trùng email trả về 409 Conflict | Integration | `TC-AUTH-03` | `apps/api/src/modules/auth`<br>`apps/api/src/common/guards` |
| Auth | `AC-01.4` | Dữ liệu đăng ký không hợp lệ hoặc gửi kèm trường `role` trả về 400 | Integration (DTO/ValidationPipe) | `TC-AUTH-08` | `apps/api/src/modules/auth`<br>`apps/api/src/common/guards` |
| Auth | `AC-02.1` | Đăng nhập đúng trả về 200 OK + JWT accessToken | Integration | `TC-AUTH-04` | `apps/api/src/modules/auth`<br>`apps/api/src/common/guards` |
| Auth | `AC-02.2` | Đăng nhập sai mật khẩu trả về 401 Unauthorized | Integration | `TC-AUTH-05` | `apps/api/src/modules/auth`<br>`apps/api/src/common/guards` |
| Auth | `AC-02.3` | Đăng nhập thiếu email/mật khẩu hoặc sai định dạng trả về 400 | Integration | `TC-AUTH-09` | `apps/api/src/modules/auth`<br>`apps/api/src/common/guards` |
| Auth | `AC-03.1` | Truy cập API bảo vệ không có token trả về 401 (trừ route `vnpay/ipn`) | Integration | `TC-AUTH-06` | `apps/api/src/modules/auth`<br>`apps/api/src/common/guards` |
| Auth | `AC-03.2` | Token hết hạn hoặc sai chữ ký trả về 401 Unauthorized | Integration | `TC-AUTH-10` | `apps/api/src/modules/auth`<br>`apps/api/src/common/guards` |
| Auth | `AC-03.3` | Customer gọi API admin trả về 403 Forbidden | Unit/Guard + Integration | `TC-AUTH-07` | `apps/api/src/modules/auth`<br>`apps/api/src/common/guards` |

### Menu

| Nhóm chức năng | Mã AC | Mô tả kịch bản kiểm thử | Loại kiểm thử dự kiến | Test Case ID | Phạm vi code cần kiểm chứng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Menu | `AC-04.1` | Khách hàng truy cập trang Menu. Hệ thống hiển thị danh sách danh mục sản phẩm. | Component | `TC-MENU-01` | `apps/web/src/app/menu`<br>`apps/api/src/modules/products` |
| Menu | `AC-04.2` | Khách hàng chọn một danh mục, ví dụ “Cà phê”. Chỉ hiển thị các sản phẩm thuộc danh mục được chọn và đáp ứng quy tắc hiển thị của FR-05. | Component | `TC-MENU-04` | `apps/web/src/app/menu`<br>`apps/api/src/modules/products` |
| Menu | `AC-04.3` | Khách hàng chuyển sang danh mục khác. Danh sách sản phẩm được cập nhật theo danh mục mới. | Component | `TC-MENU-05` | `apps/web/src/app/menu`<br>`apps/api/src/modules/products` |
| Menu | `AC-04.4` | Khách hàng chọn “Tất cả”. Hệ thống hiển thị sản phẩm từ tất cả danh mục theo quy tắc FR-05. | Component | `TC-MENU-06` | `apps/web/src/app/menu`<br>`apps/api/src/modules/products` |
| Menu | `AC-04.5` | Danh mục được chọn không có sản phẩm phù hợp. Hệ thống hiển thị thông báo không có sản phẩm. | Component | `TC-MENU-07` | `apps/web/src/app/menu`<br>`apps/api/src/modules/products` |
| Menu | `AC-04.6` | Không thể tải dữ liệu sản phẩm. Hệ thống hiển thị thông báo lỗi và cho phép thử lại. | Component | `TC-MENU-08` | `apps/web/src/app/menu`<br>`apps/api/src/modules/products` |
| Menu | `AC-05.1` | Khách hàng truy cập trang Menu và API trả về danh sách sản phẩm hợp lệ. Hệ thống hiển thị danh sách sản phẩm. | Component/Integration | `TC-MENU-02` | `apps/web/src/app/menu`<br>`apps/api/src/modules/products` |
| Menu | `AC-05.2` | Sản phẩm có đầy đủ thông tin tên, hình ảnh và giá cơ sở. Các thông tin được hiển thị chính xác theo dữ liệu Backend cung cấp. | Component | `TC-MENU-09` | `apps/web/src/app/menu`<br>`apps/api/src/modules/products` |
| Menu | `AC-05.3` | Sản phẩm có `isAvailable = false` hoặc `stock <= 0`. API không trả sản phẩm đó trong danh sách Menu. Thiếu nguyên liệu theo công thức được xử lý khi tạo Order, không dùng làm nhãn/lọc Menu. | Integration | `TC-MENU-10` | `apps/web/src/app/menu`<br>`apps/api/src/modules/products` |
| Menu | `AC-05.4` | API trả về danh sách sản phẩm rỗng. Hệ thống hiển thị thông báo không có sản phẩm. | Component | `TC-MENU-11` | `apps/web/src/app/menu`<br>`apps/api/src/modules/products` |
| Menu | `AC-05.5` | API gặp lỗi hoặc mất kết nối mạng. Hệ thống hiển thị thông báo lỗi và cho phép thử lại. | Component | `TC-MENU-12` | `apps/web/src/app/menu`<br>`apps/api/src/modules/products` |
| Menu | `AC-05.6` | Khách hàng chọn một sản phẩm có thể đặt hàng. Hệ thống chuyển đến trang chi tiết của sản phẩm tương ứng. | Component | `TC-MENU-13` | `apps/web/src/app/menu`<br>`apps/api/src/modules/products` |
| Menu | `AC-06.1` | Khách hàng nhập từ khóa “cà phê”. Hệ thống hiển thị các sản phẩm có tên phù hợp với từ khóa. | Component | `TC-MENU-03` | `apps/web/src/app/menu`<br>`apps/api/src/modules/products` |
| Menu | `AC-06.2` | Khách hàng nhập “CA PHE” thay cho “cà phê”. Kết quả tìm kiếm tương đương, không phân biệt chữ hoa/thường và dấu tiếng Việt. | Component | `TC-MENU-14` | `apps/web/src/app/menu`<br>`apps/api/src/modules/products` |
| Menu | `AC-06.3` | Khách hàng nhập từ khóa không khớp với sản phẩm nào. Hệ thống hiển thị thông báo không tìm thấy sản phẩm phù hợp. | Component | `TC-MENU-15` | `apps/web/src/app/menu`<br>`apps/api/src/modules/products` |
| Menu | `AC-06.4` | Khách hàng xóa toàn bộ từ khóa tìm kiếm. Hệ thống hiển thị lại danh sách sản phẩm theo danh mục hiện tại. | Component | `TC-MENU-16` | `apps/web/src/app/menu`<br>`apps/api/src/modules/products` |
| Menu | `AC-06.5` | Khách hàng chọn danh mục “Cà phê” và nhập từ khóa “sữa”. Chỉ hiển thị các sản phẩm thuộc danh mục Cà phê có tên phù hợp với từ khóa “sữa”. | Component | `TC-MENU-17` | `apps/web/src/app/menu`<br>`apps/api/src/modules/products` |
| Menu | `AC-06.6` | Khách hàng thay đổi nội dung ô tìm kiếm. Danh sách kết quả được cập nhật tương ứng mà không cần tải lại trang. | Component | `TC-MENU-18` | `apps/web/src/app/menu`<br>`apps/api/src/modules/products` |

### Detail

| Nhóm chức năng | Mã AC | Mô tả kịch bản kiểm thử | Loại kiểm thử dự kiến | Test Case ID | Phạm vi code cần kiểm chứng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Detail | `AC-07.1` | Lấy & hiển thị chi tiết sản phẩm hợp lệ — Happy Path | Component/Integration | `TC-DETAIL-01` | `apps/web/src/app/products/[id]`<br>`apps/api/src/modules/products`<br>`apps/api/src/modules/pricing` |
| Detail | `AC-07.2` | Sản phẩm không tồn tại — `404 Not Found` | Component/Integration | `TC-DETAIL-02` | `apps/web/src/app/products/[id]`<br>`apps/api/src/modules/products`<br>`apps/api/src/modules/pricing` |
| Detail | `AC-07.3` | ID sai định dạng hoặc lỗi kết nối — `400 Bad Request` / `Network Error` | Component/Integration | `TC-DETAIL-06` | `apps/web/src/app/products/[id]`<br>`apps/api/src/modules/products`<br>`apps/api/src/modules/pricing` |
| Detail | `AC-07.4` | Trạng thái sản phẩm ngừng bán / hết hàng | Component | `TC-DETAIL-07` | `apps/web/src/app/products/[id]`<br>`apps/api/src/modules/products`<br>`apps/api/src/modules/pricing` |
| Detail | `AC-08.1` | Chọn kích cỡ duy nhất & mặc định Size S trên UI | Component | `TC-DETAIL-03` | `apps/web/src/app/products/[id]`<br>`apps/api/src/modules/products`<br>`apps/api/src/modules/pricing` |
| Detail | `AC-08.2` | Chọn/bỏ chọn Topping & chặn vượt quá 3 topping | Component | `TC-DETAIL-04` | `apps/web/src/app/products/[id]`<br>`apps/api/src/modules/products`<br>`apps/api/src/modules/pricing` |
| Detail | `AC-08.3` | Điều chỉnh số lượng trong biên `1..99` | Component | `TC-DETAIL-08` | `apps/web/src/app/products/[id]`<br>`apps/api/src/modules/products`<br>`apps/api/src/modules/pricing` |
| Detail | `AC-08.4` | Chặn thêm giỏ khi thiếu thuộc tính size bắt buộc | Component | `TC-DETAIL-09` | `apps/web/src/app/products/[id]`<br>`apps/api/src/modules/products`<br>`apps/api/src/modules/pricing` |
| Detail | `AC-09.1` | Cập nhật giá realtime khi chọn/đổi Size trên UI | Component | `TC-DETAIL-10` | `apps/web/src/app/products/[id]`<br>`apps/api/src/modules/products`<br>`apps/api/src/modules/pricing` |
| Detail | `AC-09.2` | Cập nhật giá realtime khi thêm/bớt Topping trên UI | Component | `TC-DETAIL-11` | `apps/web/src/app/products/[id]`<br>`apps/api/src/modules/products`<br>`apps/api/src/modules/pricing` |
| Detail | `AC-09.3` | Cập nhật thành tiền khi tăng/giảm Số lượng trên UI và lưu vào Giỏ | Component | `TC-DETAIL-12` | `apps/web/src/app/products/[id]`<br>`apps/api/src/modules/products`<br>`apps/api/src/modules/pricing` |
| Detail | `AC-09.4` | Backend tính lại giá độc lập theo Size, Topping, Số lượng & không làm tròn sai số | Unit | `TC-DETAIL-05` | `apps/web/src/app/products/[id]`<br>`apps/api/src/modules/products`<br>`apps/api/src/modules/pricing` |
| Detail | `AC-09.5` | Backend bảo vệ tính toàn vẹn giá — chống giả mạo từ Client | Unit | `TC-DETAIL-05` | `apps/web/src/app/products/[id]`<br>`apps/api/src/modules/products`<br>`apps/api/src/modules/pricing` |
| Detail | `AC-09.6` | Backend từ chối dữ liệu đầu vào & trạng thái DB không hợp lệ | Unit | `TC-DETAIL-13` | `apps/web/src/app/products/[id]`<br>`apps/api/src/modules/products`<br>`apps/api/src/modules/pricing` |

### Cart

| Nhóm chức năng | Mã AC | Mô tả kịch bản kiểm thử | Loại kiểm thử dự kiến | Test Case ID | Phạm vi code cần kiểm chứng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Cart | `AC-10.1` | Thêm món cùng size/topping tăng số lượng | Unit Store | `TC-CART-01` | `apps/web/src/store/useCartStore.ts`<br>`apps/web/src/app/cart`<br>`apps/web/src/app/checkout`<br>`apps/web/src/app/payment/vnpay-return` |
| Cart | `AC-10.2` | Sửa size/topping trong giỏ cập nhật hoặc gộp dòng trùng | Unit Store | `TC-CART-05` | `apps/web/src/store/useCartStore.ts`<br>`apps/web/src/app/cart`<br>`apps/web/src/app/checkout`<br>`apps/web/src/app/payment/vnpay-return` |
| Cart | `AC-10.3` | Giảm về 0 hoặc xóa món khỏi giỏ hàng | Unit Store | `TC-CART-02` | `apps/web/src/store/useCartStore.ts`<br>`apps/web/src/app/cart`<br>`apps/web/src/app/checkout`<br>`apps/web/src/app/payment/vnpay-return` |
| Cart | `AC-11.1` | Tổng tiền giỏ hàng tính đúng theo số lượng & topping | Unit Store | `TC-CART-03` | `apps/web/src/store/useCartStore.ts`<br>`apps/web/src/app/cart`<br>`apps/web/src/app/checkout`<br>`apps/web/src/app/payment/vnpay-return` |
| Cart | `AC-11.2` | Cập nhật tổng tiền & badge tức thì khi thay đổi giỏ hàng | Unit Store | `TC-CART-06` | `apps/web/src/store/useCartStore.ts`<br>`apps/web/src/app/cart`<br>`apps/web/src/app/checkout`<br>`apps/web/src/app/payment/vnpay-return` |
| Cart | `AC-12.1` | Lưu trữ bền vững giỏ hàng trong `localStorage` khi reload | Unit Store | `TC-CART-07` | `apps/web/src/store/useCartStore.ts`<br>`apps/web/src/app/cart`<br>`apps/web/src/app/checkout`<br>`apps/web/src/app/payment/vnpay-return` |
| Cart | `AC-12.2` | Thanh toán thất bại GIỮ NGUYÊN giỏ hàng | Component | `TC-CART-04` | `apps/web/src/store/useCartStore.ts`<br>`apps/web/src/app/cart`<br>`apps/web/src/app/checkout`<br>`apps/web/src/app/payment/vnpay-return` |
| Cart | `AC-12.3` | Chỉ xóa sạch giỏ hàng (`clearCart`) sau khi thanh toán `PAID` | Component | `TC-CART-08` | `apps/web/src/store/useCartStore.ts`<br>`apps/web/src/app/cart`<br>`apps/web/src/app/checkout`<br>`apps/web/src/app/payment/vnpay-return` |

### Order

| Nhóm chức năng | Mã AC | Mô tả kịch bản kiểm thử | Loại kiểm thử dự kiến | Test Case ID | Phạm vi code cần kiểm chứng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Order | `AC-13.1` | Tạo đơn hợp lệ: 201, PENDING, đủ dòng món và lịch sử khởi tạo | Integration | `TC-ORDER-01` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-13.2` | Lỗi trong transaction: rollback đơn, snapshot và tồn nguyên liệu | Integration | `TC-ORDER-07` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-13.3` | items rỗng: 400, không tạo đơn | Integration | `TC-ORDER-08` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-13.4` | quantity/size/productId không hợp lệ: 400, không đổi kho | Integration | `TC-ORDER-09` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-13.5` | Sản phẩm/topping không tồn tại hoặc ngừng bán: 400 | Integration | `TC-ORDER-10` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-13.6` | Thiếu hoặc hết hạn JWT: 401, không tạo đơn | Integration | `TC-ORDER-11` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-13.7` | Đổi giá niêm yết sau đặt hàng: giá snapshot của đơn cũ không đổi | Integration | `TC-ORDER-12` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-13.8` | Tạo hai đơn liên tiếp: orderNumber khác nhau | Integration | `TC-ORDER-13` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-13.9` | Tạo đơn xong chuyển tới trang payment, giữ giỏ; lỗi cũng giữ giỏ | Component | `TC-ORDER-14` | `apps/web/src/app/checkout`<br>`apps/web/src/store/useCartStore.ts` |
| Order | `AC-13.10` | Biên quantity: 99 hợp lệ khi đủ kho; 100 bị từ chối 400 | Integration | `TC-ORDER-15` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-13.11` | Tối đa 3 topping không trùng; 4 topping hoặc ID trùng: 400 | Integration | `TC-ORDER-16` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-13.12` | Bỏ size/toppingIds: lưu size M, không có topping | Integration | `TC-ORDER-17` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-13.13` | JWT hợp lệ nhưng user không còn trong DB: 404 | Integration | `TC-ORDER-18` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-13.14` | Chèn totalAmount/unitPrice ngoài DTO: 400, không đổi đơn/kho | Integration | `TC-ORDER-19` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-14.1` | Thiếu một nguyên liệu: 400, rollback toàn bộ kho và snapshot | Integration | `TC-ORDER-02` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-14.2` | 10 request tranh 5 ly: 5 thành công, 5 bị từ chối, kho cuối 0 | Concurrency | `TC-ORDER-03` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-14.3` | Trừ nguyên liệu món và topping, ghi snapshot cùng transaction | Integration | `TC-ORDER-20` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-14.4` | Cộng gộp nhu cầu nguyên liệu của nhiều dòng trước khi kiểm tra kho | Integration | `TC-ORDER-21` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-14.5` | 2 request tranh ly cuối: đúng 1 thành công, kho không âm | Concurrency | `TC-ORDER-22` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-14.6` | Hủy đơn sau đổi công thức: hoàn đúng lượng theo snapshot lúc đặt | Integration | `TC-ORDER-23` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-14.7` | Hủy lại đơn CANCELLED: 409, không hoàn kho lần hai | Integration | `TC-ORDER-24` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-14.8` | Món/size/topping thiếu công thức: 400, không trừ kho/tạo đơn | Integration | `TC-ORDER-25` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-15.1` | WELCOME10 trên 120.000đ: giảm 12.000đ, trả 108.000đ, chưa cộng điểm | Unit | `TC-ORDER-04` | `apps/api/src/modules/promotions`<br>`apps/api/src/modules/loyalty`<br>`apps/api/src/modules/payments` |
| Order | `AC-15.2` | PENDING → PAID với 108.000đ: cộng 108 điểm và 1 bản ghi EARNED | Integration | `TC-ORDER-26` | `apps/api/src/modules/promotions`<br>`apps/api/src/modules/loyalty`<br>`apps/api/src/modules/payments` |
| Order | `AC-15.3` | WELCOME10 trên 250.000đ: giảm chạm trần 20.000đ | Integration | `TC-ORDER-27` | `apps/api/src/modules/promotions`<br>`apps/api/src/modules/loyalty`<br>`apps/api/src/modules/payments` |
| Order | `AC-15.4` | WELCOME10 trên 39.000đ: 400, không tạo đơn/trừ kho | Integration | `TC-ORDER-28` | `apps/api/src/modules/promotions`<br>`apps/api/src/modules/loyalty`<br>`apps/api/src/modules/payments` |
| Order | `AC-15.5` | WELCOME10 tại biên 40.000đ: hợp lệ, giảm 4.000đ | Integration | `TC-ORDER-29` | `apps/api/src/modules/promotions`<br>`apps/api/src/modules/loyalty`<br>`apps/api/src/modules/payments` |
| Order | `AC-15.6` | GIAM15K trên 60.000đ: giảm 15.000đ, trả 45.000đ | Integration | `TC-ORDER-30` | `apps/api/src/modules/promotions`<br>`apps/api/src/modules/loyalty`<br>`apps/api/src/modules/payments` |
| Order | `AC-15.7` | GIAM15K trên 59.000đ: 400, không tạo đơn | Integration | `TC-ORDER-31` | `apps/api/src/modules/promotions`<br>`apps/api/src/modules/loyalty`<br>`apps/api/src/modules/payments` |
| Order | `AC-15.8` | Voucher không tồn tại/hết hạn/tắt: 400, không đổi kho | Integration | `TC-ORDER-32` | `apps/api/src/modules/promotions`<br>`apps/api/src/modules/loyalty`<br>`apps/api/src/modules/payments` |
| Order | `AC-15.9` | Không gửi voucher hoặc chuỗi trắng: discountAmount = 0 | Integration | `TC-ORDER-33` | `apps/api/src/modules/promotions`<br>`apps/api/src/modules/loyalty`<br>`apps/api/src/modules/payments` |
| Order | `AC-15.10` | Callback/key thanh toán lặp: không cộng điểm lần hai | Integration | `TC-ORDER-34` | `apps/api/src/modules/promotions`<br>`apps/api/src/modules/loyalty`<br>`apps/api/src/modules/payments` |
| Order | `AC-15.11` | PAYMENT_FAILED/CANCELLED: không có điểm hoặc bản ghi EARNED | Integration | `TC-ORDER-35` | `apps/api/src/modules/promotions`<br>`apps/api/src/modules/loyalty`<br>`apps/api/src/modules/payments` |
| Order | `AC-15.12` | Thanh toán 999đ: 0 điểm, không có bản ghi EARNED | Integration | `TC-ORDER-36` | `apps/api/src/modules/promotions`<br>`apps/api/src/modules/loyalty`<br>`apps/api/src/modules/payments` |
| Order | `AC-15.13` | Điểm làm tròn xuống theo finalAmount: 45.000đ → 45, 108.999đ → 108 | Integration | `TC-ORDER-37` | `apps/api/src/modules/promotions`<br>`apps/api/src/modules/loyalty`<br>`apps/api/src/modules/payments` |
| Order | `AC-16.1` | Luồng PENDING → PAID → PREPARING → READY → COMPLETED, lịch sử và paidAt | Unit | `TC-ORDER-05` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-16.2` | assertTransition chấp nhận đủ 9 chuyển tiếp hợp lệ | Unit | `TC-ORDER-38` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-16.3` | assertTransition từ chối đủ 40 cặp còn lại bằng 409 | Unit | `TC-ORDER-06` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-16.4` | Review: mọi cập nhật trạng thái đơn đã tồn tại đi qua transition() | Review | `TC-ORDER-39` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-16.5` | COMPLETED/CANCELLED không có chuyển tiếp đi ra | Unit | `TC-ORDER-40` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-16.6` | PENDING → COMPLETED: 409, không đổi trạng thái/lịch sử | Integration | `TC-ORDER-41` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-16.7` | Retry PAYMENT_FAILED → PENDING: giữ kho, không trừ lần nữa | Integration | `TC-ORDER-42` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-16.8` | Chủ đơn hủy PENDING/PAYMENT_FAILED: 200, hoàn snapshot, ghi lịch sử; thiếu JWT: 401 | Integration | `TC-ORDER-43` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-16.9` | Khách hủy đơn ngoài PENDING/PAYMENT_FAILED: 409, kho không đổi | Integration | `TC-ORDER-44` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-16.10` | Hủy đơn người khác/không tồn tại: 404, không đổi đơn | Integration | `TC-ORDER-45` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-16.11` | Mở rộng: PAID → PREPARING tranh PAID → CANCELLED, chỉ 1 thao tác thành công | Integration (mở rộng, chưa có API hủy PAID) | `TC-ORDER-46` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-16.12` | CUSTOMER gọi API pha chế: 403; chưa đăng nhập: 401 | Integration | `TC-ORDER-47` | `apps/api/src/modules/admin-orders`<br>`apps/api/src/common/guards` |
| Order | `AC-16.13` | transition() với orderId không tồn tại: 404, không ghi lịch sử | Unit | `TC-ORDER-49` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-16.14` | Lỗi cộng điểm cùng transaction: rollback PAID, paidAt và lịch sử/EARNED | Integration | `TC-ORDER-50` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |
| Order | `AC-16.15` | Hai request hủy đồng thời: 1 trả 200, 1 trả 409, hoàn kho một lần | Concurrency | `TC-ORDER-51` | `apps/api/src/modules/orders`<br>`apps/api/src/common/ingredient-stock.helper.ts` |

### Payment

| Nhóm chức năng | Mã AC | Mô tả kịch bản kiểm thử | Loại kiểm thử dự kiến | Test Case ID | Phạm vi code cần kiểm chứng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Payment | `AC-17.1` | Chọn E_WALLET / BANK_CARD; request gửi đúng method | Component | `TC-PAY-15` | `apps/api/src/modules/payments`<br>`apps/web/src/app/checkout/payment`<br>`apps/web/src/app/payment/vnpay-return` |
| Payment | `AC-17.2` | Mock mặc định SUCCESS; X-Mock-Outcome: FAILED trong môi trường test trả FAILED | Integration | `TC-PAY-01`, `TC-PAY-05` | `apps/api/src/modules/payments`<br>`apps/web/src/app/checkout/payment`<br>`apps/web/src/app/payment/vnpay-return` |
| Payment | `AC-17.3` | Kiểm thử Mock độc lập trên CI, không gọi VNPay hoặc cần merchant secret | Unit/Integration | `TC-PAY-16` | `apps/api/src/modules/payments`<br>`apps/web/src/app/checkout/payment`<br>`apps/web/src/app/payment/vnpay-return` |
| Payment | `AC-17.4` | Tạo URL VNPay ký hợp lệ và chuyển browser tới Sandbox | Integration/E2E | `TC-PAY-07` | `apps/api/src/modules/payments`<br>`apps/web/src/app/checkout/payment`<br>`apps/web/src/app/payment/vnpay-return` |
| Payment | `AC-17.5` | POST gateway VNPAY lưu Payment PENDING, transactionRef = paymentId, trả id/paymentUrl | Integration | `TC-PAY-07` | `apps/api/src/modules/payments`<br>`apps/web/src/app/checkout/payment`<br>`apps/web/src/app/payment/vnpay-return` |
| Payment | `AC-17.6` | Đọc cấu hình VNPay từ env Backend; HASH_SECRET không đưa vào Frontend | Unit/Config | `TC-PAY-06` | `apps/api/src/modules/payments`<br>`apps/web/src/app/checkout/payment`<br>`apps/web/src/app/payment/vnpay-return` |
| Payment | `AC-18.1` | Thiếu/rỗng Idempotency-Key trả 400; không tạo Payment | Integration | `TC-PAY-02` | `apps/api/src/modules/payments`<br>`apps/web/src/app/checkout/payment`<br>`apps/web/src/app/payment/vnpay-return` |
| Payment | `AC-18.2` | Cùng key/body trả kết quả cũ, chỉ 1 Payment; không gọi Gateway/cộng điểm lại | Integration | `TC-PAY-03` | `apps/api/src/modules/payments`<br>`apps/web/src/app/checkout/payment`<br>`apps/web/src/app/payment/vnpay-return` |
| Payment | `AC-18.3` | Cùng key nhưng khác orderId/method/gateway trả 409 Conflict | Integration | `TC-PAY-04` | `apps/api/src/modules/payments`<br>`apps/web/src/app/checkout/payment`<br>`apps/web/src/app/payment/vnpay-return` |
| Payment | `AC-18.4` | IPN gửi lặp hoặc đồng thời: chỉ 1 lần cập nhật/cộng điểm; lần đã xử lý trả RspCode 02 | Integration/Concurrency | `TC-PAY-08` | `apps/api/src/modules/payments`<br>`apps/web/src/app/checkout/payment`<br>`apps/web/src/app/payment/vnpay-return` |
| Payment | `AC-19.1` | Mock FAILED hoặc IPN lỗi/hủy có chữ ký hợp lệ cập nhật Payment FAILED | Integration | `TC-PAY-05`, `TC-PAY-17` | `apps/api/src/modules/payments`<br>`apps/web/src/app/checkout/payment`<br>`apps/web/src/app/payment/vnpay-return` |
| Payment | `AC-19.2` | Giao dịch lỗi/hủy đã xác minh, Order PENDING chuyển PAYMENT_FAILED; không cộng loyalty | Integration | `TC-PAY-05`, `TC-PAY-17` | `apps/api/src/modules/payments`<br>`apps/web/src/app/checkout/payment`<br>`apps/web/src/app/payment/vnpay-return` |
| Payment | `AC-19.3` | Thất bại/hủy giữ nguyên giỏ ở cả Mock và VNPay; redirect VNPay chưa xóa giỏ, chỉ SUCCESS mới xóa | Component/E2E | `TC-CART-04` | `apps/api/src/modules/payments`<br>`apps/web/src/app/checkout/payment`<br>`apps/web/src/app/payment/vnpay-return` |
| Payment | `AC-19.4` | Retry cùng Order bằng key mới: PAYMENT_FAILED → PENDING; không trừ kho lần nữa | Integration/Component | `TC-PAY-09` | `apps/api/src/modules/payments`<br>`apps/web/src/app/checkout/payment`<br>`apps/web/src/app/payment/vnpay-return` |
| Payment | `AC-19.5` | Chưa có xác nhận qua IPN/fallback thì Payment vẫn PENDING; hết polling không tự kết luận FAILED/SUCCESS | Integration/Component | `TC-PAY-10` | `apps/api/src/modules/payments`<br>`apps/web/src/app/checkout/payment`<br>`apps/web/src/app/payment/vnpay-return` |
| Payment | `AC-20.1` | HMAC sai bị từ chối RspCode 97, không đổi dữ liệu; HMAC hợp lệ vẫn phải xét mã kết quả | Unit/Integration | `TC-PAY-11`, `TC-PAY-12`, `TC-PAY-17` | `apps/api/src/modules/payments`<br>`apps/web/src/app/checkout/payment`<br>`apps/web/src/app/payment/vnpay-return` |
| Payment | `AC-20.2` | vnp_TxnRef không có Payment VNPAY trả 01; số tiền lệch trả 04; không đổi Payment/Order/loyalty | Integration | `TC-PAY-13` | `apps/api/src/modules/payments`<br>`apps/web/src/app/checkout/payment`<br>`apps/web/src/app/payment/vnpay-return` |
| Payment | `AC-20.3` | Return URL đưa về Frontend; query có chữ ký gửi fallback qua Backend, sau đó GET Payment theo paymentId/JWT trước khi hiển thị | Component/Integration | `TC-PAY-14` | `apps/api/src/modules/payments`<br>`apps/web/src/app/checkout/payment`<br>`apps/web/src/app/payment/vnpay-return` |
| Payment | `AC-20.4` | IPN hoạt động độc lập với browser: mã 00/00 cập nhật Payment SUCCESS, Order PENDING → PAID và cộng loyalty 1 lần | Integration | `TC-PAY-11`, `TC-PAY-08` | `apps/api/src/modules/payments`<br>`apps/web/src/app/checkout/payment`<br>`apps/web/src/app/payment/vnpay-return` |

### History

| Nhóm chức năng | Mã AC | Mô tả kịch bản kiểm thử | Loại kiểm thử dự kiến | Test Case ID | Phạm vi code cần kiểm chứng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| History | `AC-21.1` | Danh sách cá nhân sắp xếp mới nhất trước, trả 200 | Integration | `TC-HIST-01` | `apps/api/src/modules/orders/history`<br>`apps/web/src/app/orders` |
| History | `AC-21.2` | Đủ trường tóm tắt đơn; itemCount là tổng quantity (2 + 1 = 3) | Integration | `TC-HIST-02` | `apps/api/src/modules/orders/history`<br>`apps/web/src/app/orders` |
| History | `AC-21.3` | Lịch sử rỗng: items [], pagination total/totalPages 0 | Integration | `TC-HIST-03` | `apps/api/src/modules/orders/history`<br>`apps/web/src/app/orders` |
| History | `AC-21.4` | 51 đơn, mặc định page 1/limit 20: 20 đơn và hasNextPage true | Integration | `TC-HIST-04` | `apps/api/src/modules/orders/history`<br>`apps/web/src/app/orders` |
| History | `AC-21.5` | 51 đơn, page 3: 11 đơn và hasNextPage false | Integration | `TC-HIST-05` | `apps/api/src/modules/orders/history`<br>`apps/web/src/app/orders` |
| History | `AC-21.6` | Biên limit 50: trả 50 đơn và tổng trang đúng | Integration | `TC-HIST-06` | `apps/api/src/modules/orders/history`<br>`apps/web/src/app/orders` |
| History | `AC-21.7` | limit 51: 400 với thông báo limit | Integration | `TC-HIST-07` | `apps/api/src/modules/orders/history`<br>`apps/web/src/app/orders` |
| History | `AC-21.8` | page 0: 400 với thông báo page | Integration | `TC-HIST-08` | `apps/api/src/modules/orders/history`<br>`apps/web/src/app/orders` |
| History | `AC-21.9` | Lọc COMPLETED: chỉ trả đơn khớp, pagination.total đúng | Integration | `TC-HIST-09` | `apps/api/src/modules/orders/history`<br>`apps/web/src/app/orders` |
| History | `AC-21.10` | status SHIPPED ngoài enum: 400 | Integration | `TC-HIST-10` | `apps/api/src/modules/orders/history`<br>`apps/web/src/app/orders` |
| History | `AC-21.11` | Danh sách chỉ có đơn của user hiện tại, không lộ đơn user khác | Integration | `TC-HIST-11` | `apps/api/src/modules/orders/history`<br>`apps/web/src/app/orders` |
| History | `AC-21.12` | Danh sách thiếu JWT: 401 và thông báo đăng nhập | Integration | `TC-HIST-12` | `apps/api/src/modules/orders/history`<br>`apps/web/src/app/orders` |
| History | `AC-21.13` | UI danh sách: mã đơn, nhãn PAID, số món, finalAmount và link chi tiết | E2E | `TC-HIST-13` | `apps/api/src/modules/orders/history`<br>`apps/web/src/app/orders` |
| History | `AC-21.14` | Mở /orders khi chưa đăng nhập: chuyển tới login với next đúng | E2E | `TC-HIST-14` | `apps/api/src/modules/orders/history`<br>`apps/web/src/app/orders` |
| History | `AC-22.1` | Chi tiết đơn PAID: size/topping, giá/lineTotal, tiền giảm và paidAt đúng | Integration | `TC-HIST-15` | `apps/api/src/modules/orders/history`<br>`apps/web/src/app/orders` |
| History | `AC-22.2` | Hai lần thanh toán: trả đủ payments, lần mới nhất trước | Integration | `TC-HIST-16` | `apps/api/src/modules/orders/history`<br>`apps/web/src/app/orders` |
| History | `AC-22.3` | Chi tiết orderId không tồn tại: 404 | Integration | `TC-HIST-17` | `apps/api/src/modules/orders/history`<br>`apps/web/src/app/orders` |
| History | `AC-22.4` | Chi tiết đơn người khác: 404, không trả data | Integration | `TC-HIST-18` | `apps/api/src/modules/orders/history`<br>`apps/web/src/app/orders` |
| History | `AC-22.5` | Chi tiết thiếu JWT: 401 | Integration | `TC-HIST-19` | `apps/api/src/modules/orders/history`<br>`apps/web/src/app/orders` |
| History | `AC-22.6` | UI hiển thị đúng nhãn cả 7 giá trị OrderStatus | Component | `TC-HIST-20` | `apps/api/src/modules/orders/history`<br>`apps/web/src/app/orders` |
| History | `AC-22.7` | Tab hiển thị, đơn PREPARING: polling 10 giây, đổi nhãn READY không reload | Component | `TC-HIST-21` | `apps/api/src/modules/orders/history`<br>`apps/web/src/app/orders` |
| History | `AC-22.8` | PENDING/PAYMENT_FAILED/COMPLETED/CANCELLED: chỉ tải lần đầu, không polling | Component | `TC-HIST-22` | `apps/api/src/modules/orders/history`<br>`apps/web/src/app/orders` |

## 3. ÁNH XẠ USE-CASE UC-ORD-01

| Nhóm chức năng | Mã AC | Mô tả kịch bản kiểm thử | Loại kiểm thử dự kiến | Test Case ID | Phạm vi code cần kiểm chứng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Use-case | `AC-UC-01` | Luồng chính: voucher, tạo đơn, trừ kho, payment PAID và cộng điểm một lần | E2E | `TC-UC-01`, `TC-ORDER-01`, `TC-ORDER-04`, `TC-ORDER-26` | `tests/e2e (dự kiến Sprint 2)`<br>`apps/api/src/modules/orders`<br>`apps/api/src/modules/payments`<br>`apps/web/src/app/checkout` |
| Use-case | `AC-UC-02` | Thiếu JWT: 401, không tạo đơn | Integration | `TC-ORDER-11` | `tests/e2e (dự kiến Sprint 2)`<br>`apps/api/src/modules/orders`<br>`apps/api/src/modules/payments`<br>`apps/web/src/app/checkout` |
| Use-case | `AC-UC-03` | Items/size/quantity/topping vi phạm: 400, không tạo đơn | Integration | `TC-ORDER-08`, `TC-ORDER-09`, `TC-ORDER-15`, `TC-ORDER-16` | `tests/e2e (dự kiến Sprint 2)`<br>`apps/api/src/modules/orders`<br>`apps/api/src/modules/payments`<br>`apps/web/src/app/checkout` |
| Use-case | `AC-UC-04` | Thiếu nguyên liệu: 400, kho không đổi | Integration | `TC-ORDER-02` | `tests/e2e (dự kiến Sprint 2)`<br>`apps/api/src/modules/orders`<br>`apps/api/src/modules/payments`<br>`apps/web/src/app/checkout` |
| Use-case | `AC-UC-05` | Nhiều món/nguyên liệu: thiếu một loại hoặc tổng usage vượt kho, rollback toàn bộ | Integration | `TC-ORDER-02`, `TC-ORDER-21` | `tests/e2e (dự kiến Sprint 2)`<br>`apps/api/src/modules/orders`<br>`apps/api/src/modules/payments`<br>`apps/web/src/app/checkout` |
| Use-case | `AC-UC-06` | Hai request tranh ly cuối: 1 trả 201, 1 trả 400, kho cuối 0 | Concurrency | `TC-ORDER-22` | `tests/e2e (dự kiến Sprint 2)`<br>`apps/api/src/modules/orders`<br>`apps/api/src/modules/payments`<br>`apps/web/src/app/checkout` |
| Use-case | `AC-UC-07` | WELCOME10 dưới đơn tối thiểu: 400, không tạo đơn | Integration | `TC-ORDER-28` | `tests/e2e (dự kiến Sprint 2)`<br>`apps/api/src/modules/orders`<br>`apps/api/src/modules/payments`<br>`apps/web/src/app/checkout` |
| Use-case | `AC-UC-08` | Mock/IPN lỗi hoặc hủy đã xác minh: PAYMENT_FAILED, giữ kho/giỏ, không cộng điểm | Integration/Component | `TC-PAY-05`, `TC-PAY-17`, `TC-CART-04`, `TC-ORDER-35` | `tests/e2e (dự kiến Sprint 2)`<br>`apps/api/src/modules/orders`<br>`apps/api/src/modules/payments`<br>`apps/web/src/app/checkout` |
| Use-case | `AC-UC-09` | Retry cùng đơn: PAYMENT_FAILED → PENDING, kho không đổi | Integration | `TC-ORDER-42` | `tests/e2e (dự kiến Sprint 2)`<br>`apps/api/src/modules/orders`<br>`apps/api/src/modules/payments`<br>`apps/web/src/app/checkout` |
| Use-case | `AC-UC-10` | Hủy đơn của mình: CANCELLED, hoàn snapshot; hủy lần hai: 409 | Integration | `TC-ORDER-23`, `TC-ORDER-24`, `TC-ORDER-43` | `tests/e2e (dự kiến Sprint 2)`<br>`apps/api/src/modules/orders`<br>`apps/api/src/modules/payments`<br>`apps/web/src/app/checkout` |
| Use-case | `AC-UC-11` | Hủy đơn PAID: 409; hủy đơn người khác: 404 | Integration | `TC-ORDER-44`, `TC-ORDER-45` | `tests/e2e (dự kiến Sprint 2)`<br>`apps/api/src/modules/orders`<br>`apps/api/src/modules/payments`<br>`apps/web/src/app/checkout` |
| Use-case | `AC-UC-12` | Idempotency/IPN lặp: 1 payment, 1 lần PAID, 1 lần cộng điểm | Integration/Concurrency | `TC-ORDER-34`, `TC-PAY-03`, `TC-PAY-08` | `tests/e2e (dự kiến Sprint 2)`<br>`apps/api/src/modules/orders`<br>`apps/api/src/modules/payments`<br>`apps/web/src/app/checkout` |
| Use-case | `AC-UC-13` | Chuyển tiếp không hợp lệ: 409, không đổi trạng thái/lịch sử | Unit/Integration | `TC-ORDER-06`, `TC-ORDER-41` | `tests/e2e (dự kiến Sprint 2)`<br>`apps/api/src/modules/orders`<br>`apps/api/src/modules/payments`<br>`apps/web/src/app/checkout` |
| Use-case | `AC-UC-14` | IPN thành công đến sau CANCELLED: Payment SUCCESS, giữ Order, cần hoàn tiền thủ công, không cộng điểm | Integration | `TC-PAY-18` | `tests/e2e (dự kiến Sprint 2)`<br>`apps/api/src/modules/orders`<br>`apps/api/src/modules/payments`<br>`apps/web/src/app/checkout` |

## 4. GHI CHÚ PAYMENT THEO CODE FREEZE

Các Test Case ID là kịch bản cần hiện thực/kiểm chứng, không phải bằng chứng test đã chạy hoặc đã pass. Mapping Payment có đủ 19 AC từ fr-payment.md; nhiều AC có thể dùng cùng Test ID nếu test có đủ assertion.

- `TC-PAY-11`: IPN có HMAC, tham chiếu và số tiền hợp lệ, mã kết quả `00/00`, Order `PENDING` → Payment `SUCCESS`, Order `PAID`, loyalty một lần.
- `TC-PAY-17`: IPN lỗi/hủy vẫn có HMAC hợp lệ → Payment `FAILED`, Order `PAYMENT_FAILED`, không cộng loyalty. `RspCode: '00'` xác nhận xử lý thông báo, không phải giao dịch thành công.
- `TC-PAY-18` (bổ sung cho UC-ORD-01, Exc-10 / AC-UC-14): IPN thành công đến sau Order `CANCELLED` → Payment `SUCCESS`, ghi cần hoàn tiền thủ công, giữ Order `CANCELLED`, không cộng loyalty, handler trả `RspCode: '00'`.
- `TC-CART-04` cần kiểm chứng yêu cầu giữ giỏ ở cả Mock và VNPay. Code đã đồng bộ main giữ giỏ khi redirect VNPay và chỉ xóa khi Backend trả SUCCESS; cần assert cả giỏ và trạng thái đơn khi lỗi/hủy.
- Smoke test Sandbox cần kiểm tra cả body IPN: `TransformInterceptor` hiện bọc `RspCode/Message` trong `data`. HTTP 200 đơn lẻ chưa chứng minh cổng đã chấp nhận callback.
