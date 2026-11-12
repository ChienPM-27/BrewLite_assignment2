# ĐẶT HÀNG & QUẢN LÝ ĐƠN HÀNG — ĐẶC TẢ YÊU CẦU CHỨC NĂNG (FR-13..16)

> **Mục đích:** biến giỏ hàng của khách đã đăng nhập thành đơn hợp lệ, giữ nguyên liệu cho đơn, áp khuyến mãi / điểm thưởng và kiểm soát vòng đời trạng thái đơn. Người phụ trách: Tôn Thất Hạnh (SP1-06).

---

| Mục | Nội dung |
| :-- | :-- |
| Người phụ trách | Tôn Thất Hạnh |
| Task / Sprint | SP1-06 — Task 1 (đề A2) — Sprint 1 |
| Dải ID | FR-13 … FR-16 (không đặt ID ngoài dải) |
| Nguồn tái sử dụng | A1: `feature-order.tex`, `ch6-advanced-logic.tex`, `ch2-requirements.tex` (mục “Đặt hàng” của A1 → FR-13..16 của A2) |
| Tài liệu liên quan | [usecase-order-payment.md](usecase-order-payment.md), [order-state-machine](../diagrams/order-state-machine.svg), [ADR-006](../architecture/adr/006-order-state-inventory.md) |

## 1. PHẠM VI & QUY ƯỚC CHUNG

Phân hệ Đặt hàng biến giỏ hàng của khách đã đăng nhập thành một đơn hàng hợp lệ, giữ nguyên liệu (tồn kho) cho đơn, áp khuyến mãi / điểm thưởng và quản lý vòng đời trạng thái của đơn cho đến khi giao khách hoặc bị hủy.

**Trong phạm vi:** tạo đơn, kiểm tra và giữ tồn kho nguyên liệu theo công thức pha chế, mã giảm giá, tích điểm khi đơn `PAID`, máy trạng thái đơn, hủy đơn.
**Ngoài phạm vi (xem mục 3.2):** xử lý thanh toán (FR-17..20), lịch sử đơn (FR-21..22), đăng nhập (FR-01..03), giỏ hàng phía client (FR-10..12).

**Quy ước chung**

- Mọi giá, tổng tiền, giảm giá, điểm do **backend tính**; client không quyết định số tiền (quy tắc #9).
- Tiền tính bằng VNĐ, số nguyên; phép chia làm tròn **xuống** (floor).
- Với đơn đã tồn tại, mọi lần chuyển `Order.status` phải đi qua `OrderService.transition()`; `OrdersService.create` được phép khởi tạo đơn mới ở `PENDING` và ghi lịch sử `NULL → PENDING` (quy tắc #9).
- Các API dưới đây yêu cầu header `Authorization: Bearer <JWT>`.

## 2. DANH SÁCH YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS)

### Bảng tổng hợp

| ID | Tên yêu cầu | MoSCoW | Mô tả ngắn | API chính |
| :-- | :-- | :-- | :-- | :-- |
| FR-13 | Tạo đơn hàng mới (Atomic Transaction) | **Must** | Validate giỏ, tính giá, lưu đơn `PENDING`, trả mã đơn | `POST /api/v1/orders` |
| FR-14 | Trừ tồn kho nguyên liệu & chống âm kho | **Must** | Quy đơn ra nhu cầu nguyên liệu theo công thức; transaction + cập nhật có điều kiện `stock >= need`, không dùng quá nguyên liệu còn lại, rollback khi lỗi, hoàn nguyên liệu khi hủy | `POST /api/v1/orders`, `POST /api/v1/orders/:id/cancel` |
| FR-15 | Áp dụng mã khuyến mãi & Tích điểm thưởng | **Should** (theo `srs.md`); quy đổi điểm: **Won't** | Áp `WELCOME10` / `GIAM15K`; cộng điểm một lần khi đơn `PAID` | `POST /api/v1/orders` (mã), luồng thanh toán (cộng điểm) |
| FR-16 | Quản lý vòng đời trạng thái đơn (State Machine) | **Must** (máy trạng thái, hủy đơn); thao tác của Barista: **Should** | Chặn chuyển trạng thái sai, ghi lịch sử, hủy đơn đúng điều kiện | `POST /api/v1/orders/:id/cancel`, endpoint Barista/Admin dưới `/admin` |

### 2.1. FR-13: Tạo đơn hàng mới (Atomic Transaction)
- **Độ ưu tiên (MoSCoW)**: Must Have
- **Mô tả nghiệp vụ**: Khách đã đăng nhập gửi danh sách món (sản phẩm, size, số lượng, topping) và tùy chọn mã giảm giá. Hệ thống validate, tính giá, tạo đơn `PENDING` cùng các dòng món và trả về mã đơn hiển thị (`orderNumber`, ví dụ `#1042`).

**Quy tắc nghiệp vụ**

1. Dữ liệu vào (`CreateOrderDto`): `items` là mảng có ít nhất 1 phần tử; mỗi phần tử có `productId` (chuỗi, bắt buộc), `quantity` (số nguyên từ **1 đến 99**, bắt buộc), `size` thuộc `{S, M, L}` (tùy chọn, **mặc định `M`**), `toppingIds` (mảng chuỗi, **tối đa 3**, **không trùng**, mặc định rỗng); `promotionCode` (chuỗi, tùy chọn). `userId` lấy từ JWT, không nhận từ body.
2. Đơn giá = giá cơ bản + phụ thu size; dòng món = (đơn giá + tổng giá topping) × số lượng; do `PricingService` tính.
3. Đơn giá và giá topping được **chụp lại (snapshot)** vào `order_items` / `order_item_toppings`; đổi giá sản phẩm sau đó không làm đổi đơn cũ.
4. Mỗi đơn có `orderNumber` tự tăng, duy nhất.
5. Tạo đơn ghi 1 dòng `order_status_history` cùng lúc với đơn: `from = NULL`, `to = PENDING`, `changed_by = "system"`, `reason = "Order created"`.
6. Người dùng trong JWT phải còn tồn tại trong CSDL; nếu không → `404 NotFoundException`.
7. Thứ tự xử lý của `OrdersService.create`: (a) kiểm tra có `userId` và `items` (thiếu → `400`); (b) `PricingService.calculate` tính giá và kiểm tra kết quả hợp lệ; (c) thẩm định mã giảm giá bằng `PromotionsService.validate(code, subtotal)`; (d) **mở transaction**: kiểm tra người dùng → sản phẩm/topping còn bán → công thức → trừ nguyên liệu → tạo đơn → ghi snapshot. Do đó tính giá và mã giảm giá đều nằm **ngoài** transaction; mã không hợp lệ → `400` và không có thao tác nào trên CSDL.
8. `promotionCode` được `trim()`; chuỗi rỗng hoặc chỉ có khoảng trắng được coi như **không có mã**. `discountAmount = max(0, min(totalAmount, giảm giá do mã tính))`, `finalAmount = max(0, totalAmount − discountAmount)`.
9. Phản hồi thành công `201` trả cả đơn vừa tạo, gồm `items` (kèm `toppings`), `statusHistory` và `payments` (rỗng).

- **Tiêu chí chấp nhận (Acceptance Criteria - AC)**:
  - `AC-13.1`: **Given** khách đã đăng nhập, giỏ hợp lệ có tổng tạm tính 120.000đ, nguyên liệu đủ. **When** `POST /api/v1/orders`. **Then** đơn được tạo. **Kết quả:** `201`; `status = PENDING`; có `orderNumber`; `totalAmount = 120000`; có đủ `order_items`; có 1 dòng lịch sử `NULL → PENDING` (`changed_by = system`, `reason = Order created`) *(Test: `TC-ORDER-01`, Integration)*
  - `AC-13.2`: **Given** giỏ hợp lệ, nguyên liệu đủ và giá/khuyến mãi đã được backend tính hợp lệ trước transaction. **When** `POST /api/v1/orders`. **Then** kiểm tra người dùng, sản phẩm/topping, công thức; trừ nguyên liệu; tạo `orders`, `order_items`, `order_item_toppings`; ghi `order_ingredient_usages` và lịch sử trạng thái đều nằm trong **một** Prisma transaction. **Kết quả:** nếu một thao tác bên trong transaction lỗi (ví dụ tạo đơn lỗi sau khi đã trừ nguyên liệu) thì toàn bộ transaction rollback, không có đơn/snapshot mới và tồn kho nguyên liệu không đổi. `PricingService.calculate()` và `PromotionsService.validate()` chạy trước transaction, nên lỗi ở hai bước này cũng không tạo đơn hoặc thay đổi tồn kho *(Test: `TC-ORDER-07`, Integration)*
  - `AC-13.3`: **Given** `items = []`. **When** `POST /api/v1/orders`. **Kết quả:** `400`; không tạo đơn *(Test: `TC-ORDER-08`, Integration)*
  - `AC-13.4`: **Given** `quantity` = 0, âm hoặc không nguyên; hoặc `size` ngoài `{S,M,L}`; hoặc thiếu `productId` / `productId` không phải chuỗi. **When** `POST /api/v1/orders`. **Kết quả:** `400`; không tạo đơn, không đổi tồn kho *(Test: `TC-ORDER-09`, Integration)*
  - `AC-13.5`: **Given** `productId` không tồn tại, hoặc sản phẩm / topping có `isAvailable = false`. **When** `POST /api/v1/orders`. **Kết quả:** `400` (“One or more products are unavailable.” / “One or more toppings are unavailable.”); không tạo đơn, không trừ nguyên liệu *(Test: `TC-ORDER-10`, Integration)*
  - `AC-13.6`: **Given** không có token hoặc token hết hạn. **When** `POST /api/v1/orders`. **Kết quả:** `401`; không tạo đơn *(Test: `TC-ORDER-11`, Integration)*
  - `AC-13.7`: **Given** đơn đã tạo với đơn giá 45.000đ. **When** giá niêm yết của sản phẩm đổi thành 50.000đ rồi xem lại đơn. **Then** đơn cũ giữ nguyên giá. **Kết quả:** `unit_price` / `line_total` của đơn cũ không đổi *(Test: `TC-ORDER-12`, Integration)*
  - `AC-13.8`: **Given** khách tạo 2 đơn liên tiếp. **Then** hai `orderNumber` khác nhau. **Kết quả:** `orderNumber` duy nhất *(Test: `TC-ORDER-13`, Integration)*
  - `AC-13.9`: **Given** đặt đơn thành công. **Then** giao diện chuyển tới `/checkout/payment?orderId=<orderId>` và **giỏ chưa bị xóa** (chỉ xóa khi thanh toán thành công, theo FR-20). **Given** đặt đơn lỗi. **Then** giỏ được giữ nguyên và hiển thị thông báo lỗi. **Kết quả:** Giỏ client được giữ cho tới khi thanh toán thành công *(Test: `TC-ORDER-14`, UI)*
  - `AC-13.10`: **Given** `quantity = 99` (biên trên). **Và** `quantity = 100`. **When** `POST /api/v1/orders`. **Kết quả:** `99` hợp lệ (với tồn kho đủ → `201`); `100` → `400`; không tạo đơn *(Test: `TC-ORDER-15`, Integration)*
  - `AC-13.11`: **Given** một dòng có `toppingIds` gồm 4 phần tử; hoặc có `toppingId` trùng nhau. **When** `POST /api/v1/orders`. **Kết quả:** `400`; không tạo đơn, không đổi tồn kho. Đúng 3 topping không trùng → hợp lệ *(Test: `TC-ORDER-16`, Integration)*
  - `AC-13.12`: **Given** một dòng không gửi `size` và không gửi `toppingIds`. **When** `POST /api/v1/orders`. **Kết quả:** `201`; dòng được lưu với `size = M` và không có topping *(Test: `TC-ORDER-17`, Integration)*
  - `AC-13.13`: **Given** JWT hợp lệ nhưng người dùng không còn trong CSDL. **When** `POST /api/v1/orders`. **Kết quả:** `404`; không tạo đơn, không trừ nguyên liệu *(Test: `TC-ORDER-18`, Integration)*
  - `AC-13.14`: **Given** body chứa thêm `totalAmount`/`unitPrice` do client tự gửi. **When** `POST /api/v1/orders`. **Then** `ValidationPipe` hiện tại (bật `whitelist` và `forbidNonWhitelisted`) từ chối thuộc tính ngoài DTO. **Kết quả:** `400`; không tạo đơn, không đổi tồn kho; client không thể quyết định số tiền *(Test: `TC-ORDER-19`, Integration)*

### 2.2. FR-14: Trừ tồn kho nguyên liệu & chống âm kho
- **Độ ưu tiên (MoSCoW)**: Must Have
- **Mô tả nghiệp vụ**: Tồn kho của BrewLite được quản lý theo **nguyên liệu** (`ingredients.stock`, đơn vị g / ml / piece). Mỗi sản phẩm theo size có **công thức** (`product_recipes`), mỗi topping có công thức riêng (`topping_recipes`). Khi tạo đơn, hệ thống quy các món trong giỏ ra **nhu cầu nguyên liệu**, trừ tồn kho trong **cùng một transaction** với việc tạo đơn và lưu lại tổng lượng tiêu hao của đơn vào `order_ingredient_usages`. Các cột `Product.stock`, `Product.version`, `Topping.stock` đã **DEPRECATED (CR-01)** và không tham gia trừ kho.

**Quy tắc nghiệp vụ**

1. Nhu cầu của một nguyên liệu = Σ (lượng theo `product_recipes` của (sản phẩm, size) × số lượng ly) + Σ (lượng theo `topping_recipes` của từng topping × số lượng ly), cộng gộp trên **tất cả các dòng** của giỏ. Phải cộng gộp trước khi so với tồn kho vì nhiều món/topping có thể dùng chung một nguyên liệu (ví dụ sữa).
2. Trừ kho từng nguyên liệu bằng **cập nhật có điều kiện nguyên tử**: `UPDATE ingredients SET stock = stock - :need WHERE id = :id AND stock >= :need AND is_available = true`. Nếu số dòng bị ảnh hưởng ≠ 1 (hết hàng hoặc nguyên liệu đã bị tắt `is_available`) thì coi là thiếu nguyên liệu, dừng ngay ở nguyên liệu đầu tiên bị thiếu và rollback toàn bộ với `400` “Nguyên liệu "X" không đủ số lượng tồn kho.” (cũng áp dụng khi nguyên liệu không tồn tại; lấy tên từ `ingredients`, không có thì dùng `id`). Các dòng nhu cầu có lượng ≤ 0 bị bỏ qua. Điều kiện nằm ngay trong câu lệnh nên hai đơn tranh cùng nguyên liệu sẽ được CSDL tuần tự hóa; đơn đến sau thấy tồn không đủ sẽ bị từ chối.
3. Các nguyên liệu của một đơn được cập nhật theo **thứ tự `id` tăng dần** để tránh deadlock khi hai đơn cùng đụng nhiều nguyên liệu.
4. Món (theo size) hoặc topping **chưa có công thức** trong `product_recipes` / `topping_recipes` thì đơn bị từ chối (thông điệp dạng “Món "X" (size M) chưa có công thức nguyên liệu.”); không trừ kho, không tạo đơn.
5. Một đơn là **tất cả hoặc không gì cả** (atomic): chỉ cần một nguyên liệu thiếu thì không nguyên liệu nào bị trừ và không có đơn.
6. Tồn kho nguyên liệu không bao giờ âm.
7. Tạo đơn thành công ghi **một bản ghi `order_ingredient_usages` cho mỗi nguyên liệu** (duy nhất theo cặp đơn–nguyên liệu) với tổng lượng đã trừ (snapshot).
8. Đơn `PENDING` và `PAYMENT_FAILED` **vẫn giữ** nguyên liệu đã trừ. Khi đơn chuyển `CANCELLED`, luồng hủy đơn hoàn lại (sau khi `transition()` thành công, cùng transaction) **đúng lượng trong `order_ingredient_usages`** (không tính lại từ công thức hiện hành), và hoàn đúng 1 lần. Việc hoàn không kiểm tra `is_available`, nên vẫn hoàn được cho nguyên liệu đã bị tắt. Đơn không có snapshot (tạo trước migration CR-01) thì không hoàn gì.
9. Request bị từ chối vì thiếu nguyên liệu nhận `400`; client được phép gửi lại.

**Dữ liệu minh họa dùng trong AC** (dữ liệu test tự tạo, không dùng dữ liệu seed — quy tắc #8): nguyên liệu **X** (ví dụ sữa) và **Y**; sản phẩm **A** dùng 200 X mỗi ly; **B** dùng 150 X mỗi ly; **C** dùng 200 X và 50 Y mỗi ly; topping **T** dùng 5 Y mỗi ly.

- **Tiêu chí chấp nhận (Acceptance Criteria - AC)**:
  - `AC-14.1`: **Given** X tồn 400. **When** đặt 3 ly A (cần 600 X). **Và** trường hợp C: X đủ nhưng Y thiếu. **Kết quả:** `400`; không có đơn mới; X vẫn 400. Với C: X **không** bị trừ dù X đủ (rollback toàn bộ), không có bản ghi `order_ingredient_usages` *(Test: `TC-ORDER-02`, Integration)*
  - `AC-14.2`: **Given** X tồn 1000 (đủ đúng 5 ly A). **When** 10 request đồng thời, mỗi request đặt 1 ly A. **Kết quả:** Đúng 5 request `201`, 5 request `400`; X cuối = 0; đúng 5 đơn được tạo *(Test: `TC-ORDER-03`, Concurrency)*
  - `AC-14.3`: **Given** X tồn 1000, Y tồn 100. **When** đặt 3 ly A, mỗi ly thêm topping T (cần 600 X và 15 Y). **Then** trừ kho và ghi snapshot trong cùng transaction với tạo đơn. **Kết quả:** `201`; X = 400, Y = 85; có đúng 1 bản ghi `order_ingredient_usages` cho X (600) và 1 cho Y (15) *(Test: `TC-ORDER-20`, Integration)*
  - `AC-14.4`: **Given** X tồn 500. **When** đặt 2 ly A + 1 ly B (cần 400 + 150 = 550 X; từng dòng riêng lẻ đều ≤ 500). **Then** nhu cầu phải được cộng gộp theo nguyên liệu. **Kết quả:** `400`; không có đơn; X vẫn 500 *(Test: `TC-ORDER-21`, Integration)*
  - `AC-14.5`: **Given** X tồn 200 (đủ đúng 1 ly A). **When** 2 request cùng đặt 1 ly A, gửi đồng thời. **Kết quả:** Đúng 1 request `201`, 1 request `400`; X cuối = 0 (không âm); đúng 1 đơn được tạo *(Test: `TC-ORDER-22`, Concurrency)*
  - `AC-14.6`: **Given** đơn `PENDING` đã trừ 600 X (3 ly A) và công thức của A sau đó bị đổi thành 250 X/ly. **When** hủy đơn. **Then** X được cộng lại 600 (theo snapshot). **Kết quả:** X hoàn đúng lượng đã trừ lúc đặt. *(Test: `TC-ORDER-23`, Integration)*
  - `AC-14.7`: **Given** đơn đã `CANCELLED`. **When** hủy lần nữa. **Kết quả:** `409`; X **không** hoàn lần 2 *(Test: `TC-ORDER-24`, Integration)*
  - `AC-14.8`: **Given** sản phẩm A chưa có công thức cho size M; hoặc topping T chưa có công thức. **When** đặt A size M (hoặc A kèm T). **Kết quả:** `400`; không gọi trừ kho; không tạo đơn; không có `order_ingredient_usages` *(Test: `TC-ORDER-25`, Integration)*

### 2.3. FR-15: Áp dụng mã khuyến mãi & Tích điểm thưởng
- **Độ ưu tiên (MoSCoW)**: Should Have (theo `srs.md`); quy đổi điểm thưởng: Won't Have
- **Mô tả nghiệp vụ**: Khách có thể nhập mã giảm giá khi đặt đơn. Sau khi đơn chuyển `PAID`, khách được cộng điểm thưởng tích lũy.

**Quy tắc nghiệp vụ — mã giảm giá**

| Mã | Quy tắc | Đơn tối thiểu |
| :-- | :-- | :-- |
| `WELCOME10` | Giảm 10% tổng tạm tính, tối đa 20.000đ: `discount = min(floor(total × 10 / 100), 20000)` | 40.000đ |
| `GIAM15K` | Giảm cố định 15.000đ | 60.000đ |

1. Mã phải tồn tại, đang kích hoạt (`is_active`) và còn trong thời hạn (`start_date`…`end_date`; `end_date` rỗng nghĩa là không giới hạn). Đơn lưu `promotionId` và `discountAmount` của mã đã áp.
2. `discountAmount` không vượt `totalAmount`; `finalAmount = totalAmount − discountAmount ≥ 0`.
3. Không gửi mã thì `discountAmount = 0`.

**Quy tắc nghiệp vụ — điểm thưởng**

1. `points = floor(finalAmount / 1000)` (1 điểm cho mỗi 1.000đ thực trả, tính trên số tiền **sau** giảm giá). Khi tạo đơn, `orders.points_earned` giữ mặc định 0; giá trị chỉ được ghi khi cộng điểm (khoản 2).
2. Điểm chỉ được cộng khi đơn chuyển `PENDING → PAID`, qua `LoyaltyService.award(tx, order)` chạy trong cùng transaction với việc đổi trạng thái. Hàm này: (a) bỏ qua nếu `points ≤ 0` (đơn dưới 1.000đ không có bản ghi nào); (b) bỏ qua nếu đơn đã có bản ghi `EARNED`; (c) ghi 1 bản ghi `loyalty_transactions` loại `EARNED` với `reason` không rỗng; (d) tăng `users.loyalty_points`; (e) ghi `orders.points_earned = points`.
3. Mỗi đơn chỉ được cộng điểm **một lần** (idempotent theo `order.id`), kể cả khi cổng thanh toán gọi lại. Cơ chế gồm hai lớp: kiểm tra bản ghi `EARNED` đã tồn tại trong `award()`, và máy trạng thái chỉ cho `PENDING → PAID` thành công một lần (`orders.version`). Bảng `loyalty_transactions` chưa có ràng buộc unique `(order_id, type)` nên lớp thứ hai là chốt chặn thật sự khi có hai lời gọi đồng thời.
4. Đơn `PAYMENT_FAILED` / `CANCELLED` không được cộng điểm.

- **Tiêu chí chấp nhận (Acceptance Criteria - AC)**:
  - `AC-15.1`: **Given** tổng tạm tính 120.000đ, mã `WELCOME10`. **Kết quả:** `discountAmount = 12000`; `finalAmount = 108000`; `pointsEarned` vẫn = 0 (chưa thanh toán) *(Test: `TC-ORDER-04`, Unit)*
  - `AC-15.2`: **Given** đơn `PENDING` có `finalAmount = 108000`, `pointsEarned = 0`, khách đang có 120 điểm. **When** đơn chuyển `PAID`. **Kết quả:** `loyaltyPoints = 228`; có đúng 1 bản ghi `EARNED = 108` cho đơn; `orders.pointsEarned = 108` *(Test: `TC-ORDER-26`, Integration)*
  - `AC-15.3`: **Given** tổng tạm tính 250.000đ, mã `WELCOME10`. **Kết quả:** `discountAmount = 20000` (chạm trần); `finalAmount = 230000` *(Test: `TC-ORDER-27`, Integration)*
  - `AC-15.4`: **Given** mã `WELCOME10`, tổng 39.000đ. **Kết quả:** `400`; không tạo đơn, không trừ kho *(Test: `TC-ORDER-28`, Integration)*
  - `AC-15.5`: **Given** mã `WELCOME10`, tổng đúng 40.000đ (biên). **Kết quả:** `201`; `discountAmount = 4000` *(Test: `TC-ORDER-29`, Integration)*
  - `AC-15.6`: **Given** mã `GIAM15K`, tổng 60.000đ. **Kết quả:** `discountAmount = 15000`; `finalAmount = 45000` *(Test: `TC-ORDER-30`, Integration)*
  - `AC-15.7`: **Given** mã `GIAM15K`, tổng 59.000đ. **Kết quả:** `400`; không tạo đơn *(Test: `TC-ORDER-31`, Integration)*
  - `AC-15.8`: **Given** mã không tồn tại / hết hạn / đã tắt. **Kết quả:** `400` (“Promotion code is invalid or not applicable.”); không tạo đơn, không trừ kho *(Test: `TC-ORDER-32`, Integration)*
  - `AC-15.9`: **Given** không gửi mã, hoặc `promotionCode` là `""` / `"   "`. **Kết quả:** `discountAmount = 0`; `finalAmount = totalAmount`; không gọi thẩm định mã *(Test: `TC-ORDER-33`, Integration)*
  - `AC-15.10`: **Given** đơn đã `PAID` và đã cộng điểm. **When** nhận lại thông báo thanh toán thành công (callback lặp / cùng Idempotency-Key). **Kết quả:** Không cộng điểm lần 2; vẫn 1 bản ghi `EARNED` *(Test: `TC-ORDER-34`, Integration)*
  - `AC-15.11`: **Given** đơn chuyển `PAYMENT_FAILED` hoặc `CANCELLED`. **Kết quả:** `loyaltyPoints` không đổi; không có bản ghi `EARNED` *(Test: `TC-ORDER-35`, Integration)*
  - `AC-15.12`: **Given** đơn có `finalAmount = 999` (dưới 1.000đ) chuyển `PAID`. **Kết quả:** `points = 0`: không có bản ghi `EARNED`; `loyaltyPoints` và `pointsEarned` không đổi *(Test: `TC-ORDER-36`, Integration)*
  - `AC-15.13`: **Given** đơn có `finalAmount = 45000` chuyển `PAID`; và đơn khác có `finalAmount = 108999`. **Kết quả:** Lần lượt `+45` điểm và `+108` điểm (làm tròn xuống) *(Test: `TC-ORDER-37`, Integration)*

### 2.4. FR-16: Quản lý vòng đời trạng thái đơn (State Machine)
- **Độ ưu tiên (MoSCoW)**: Must Have (máy trạng thái, hủy đơn); Should Have (thao tác của Barista)
- **Mô tả nghiệp vụ**: Đơn hàng đi theo máy trạng thái hữu hạn gồm 7 trạng thái và **9 chuyển tiếp hợp lệ** (xem [sơ đồ](../diagrams/order-state-machine.svg)). Mọi chuyển tiếp khác bị chặn bởi `assertTransition()`.

| # | Từ | Sang | Tác nhân / sự kiện |
| 1 | `PENDING` | `PAID` | Thanh toán thành công |
| 2 | `PENDING` | `PAYMENT_FAILED` | Thanh toán lỗi hoặc bị hủy tại cổng |
| 3 | `PENDING` | `CANCELLED` | Khách hủy đơn |
| 4 | `PAID` | `PREPARING` | Barista nhận đơn, bắt đầu pha |
| 5 | `PAID` | `CANCELLED` | Barista/Admin hủy (sự cố, hết nguyên liệu) — **hợp lệ về máy trạng thái nhưng chưa có API** (xem mục 3.2, 3.4) |
| 6 | `PREPARING` | `READY` | Pha xong |
| 7 | `READY` | `COMPLETED` | Giao khách |
| 8 | `PAYMENT_FAILED` | `PENDING` | Khách thử lại thanh toán |
| 9 | `PAYMENT_FAILED` | `CANCELLED` | Khách hủy sau khi thanh toán lỗi |

`COMPLETED` và `CANCELLED` là trạng thái kết thúc (không có chuyển tiếp đi ra).

**Quy tắc nghiệp vụ**

1. Chuyển tiếp ngoài bảng trên bị từ chối bằng `409 ConflictException` (“Invalid order status transition: X -> Y”); trạng thái không đổi, không ghi lịch sử.
2. Mỗi chuyển tiếp thành công ghi 1 dòng `order_status_history` (`from`, `to`, `changed_by`, `reason`, `created_at`; `changed_by` và `reason` tùy chọn); chuyển `→ PAID` đặt `paid_at`. Dòng lịch sử đầu tiên `NULL → PENDING` do bước tạo đơn ghi, không phải `transition()`.
3. Chuyển trạng thái dùng optimistic locking trên `orders.version` (điều kiện `id` + `status` + `version` đúng như lúc đọc): nếu hai thao tác xung đột, chỉ một thao tác thành công, thao tác còn lại nhận `409` (“Order status changed concurrently. Please retry.”). Đơn không tồn tại → `404`.
4. Khách chỉ hủy được đơn **của mình** và chỉ khi đơn ở `PENDING` hoặc `PAYMENT_FAILED`. Đơn của người khác hoặc không tồn tại → `404` (không lộ sự tồn tại của đơn); đơn ở trạng thái khác, kể cả đã `CANCELLED` → `409`. Chuyển tiếp [5] (`PAID → CANCELLED`) chưa có API; khi có, chỉ dành cho `role` `BARISTA` hoặc `ADMIN`.
5. Thao tác của Barista (`PAID → PREPARING → READY → COMPLETED`, hủy đơn `PAID` khi có API) yêu cầu `role` `BARISTA` hoặc `ADMIN`.
6. Khách chỉ xem và hủy được đơn của chính mình. Với `POST /api/v1/orders/:id/cancel`, `userId` **chỉ lấy từ JWT** (`req.user.sub`), không nhận từ body hay query; endpoint yêu cầu `JwtAuthGuard` (không có token → `401`) và trả `200` khi thành công.
7. `OrderService.transition()` nhận `tx` từ bên gọi và **không** kiểm tra quyền hay chủ sở hữu; phân quyền (khách chỉ hủy đơn của mình, `BARISTA`/`ADMIN` mới thao tác pha chế) do bên gọi đảm bảo.
8. Tác dụng phụ (cộng điểm, hoàn nguyên liệu) do bên gọi thực hiện **sau** `transition()` thành công và trong **cùng transaction**, để lỗi chuyển trạng thái chặn luôn tác dụng phụ và lỗi ở tác dụng phụ rollback cả việc đổi trạng thái.

- **Tiêu chí chấp nhận (Acceptance Criteria - AC)**:
  - `AC-16.1`: **Given** đơn `PENDING`. **When** lần lượt: thanh toán OK → bắt đầu pha → pha xong → giao khách. **Then** đơn đi `PAID → PREPARING → READY → COMPLETED`. **Kết quả:** Mỗi bước thành công; có 5 dòng lịch sử (gồm `NULL → PENDING`); `paid_at` được đặt ở bước đầu *(Test: `TC-ORDER-05`, Unit)*
  - `AC-16.2`: **Given** từng cặp trong 9 chuyển tiếp hợp lệ (gồm `PENDING → PAYMENT_FAILED` và `PENDING → CANCELLED`). **When** gọi `assertTransition(from, to)`. **Kết quả:** cả 9 cặp được chấp nhận, không ném lỗi *(Test: `TC-ORDER-38`, Unit)*
  - `AC-16.3`: **Given** 40 cặp (từ, sang) không nằm trong 9 chuyển tiếp hợp lệ (gồm 7 cặp tự chuyển như `PAID → PAID`, `COMPLETED → *`, `CANCELLED → *`). **When** gọi `assertTransition`. **Kết quả:** cả 40 cặp ném `409 ConflictException` (“Invalid order status transition: X -> Y”) *(Test: `TC-ORDER-06`, Unit)*
  - `AC-16.4`: **Given** mã nguồn của dự án. **Then** mọi lần cập nhật trạng thái của đơn đã tồn tại đều đi qua `OrderService.transition()`; `OrdersService.create` chỉ khởi tạo đơn mới ở `PENDING`. **Kết quả:** Kiểm tra bằng review mã nguồn / tìm kiếm; ghi kết quả vào PR *(Test: `TC-ORDER-39`, Review)*
  - `AC-16.5`: **Given** đơn ở `COMPLETED` hoặc `CANCELLED`. **When** yêu cầu chuyển sang bất kỳ trạng thái nào. **Kết quả:** `409`; trạng thái không đổi *(Test: `TC-ORDER-40`, Unit)*
  - `AC-16.6`: **Given** đơn `PENDING`. **When** chuyển thẳng sang `COMPLETED`. **Kết quả:** `409`; trạng thái vẫn `PENDING`; không có dòng lịch sử mới *(Test: `TC-ORDER-41`, Integration)*
  - `AC-16.7`: **Given** đơn `PAYMENT_FAILED`. **When** khách thử lại thanh toán. **Then** đơn về `PENDING`, nguyên liệu vẫn đang được giữ. **Kết quả:** `PAYMENT_FAILED → PENDING` thành công; tồn kho nguyên liệu không đổi *(Test: `TC-ORDER-42`, Integration)*
  - `AC-16.8`: **Given** đơn `PENDING` / `PAYMENT_FAILED` của chính khách. **When** `POST /api/v1/orders/:id/cancel`. **Kết quả:** `200`, body `{ id, orderNumber, status: CANCELLED }`; hoàn nguyên liệu (xem AC-14.6); có dòng lịch sử với `changed_by` = id khách, `reason = "Customer cancelled"`. Không có token → `401`; `userId` trong body (nếu gửi) bị bỏ qua *(Test: `TC-ORDER-43`, Integration)*
  - `AC-16.9`: **Given** đơn `PAID`, `PREPARING`, `READY`, `COMPLETED` hoặc `CANCELLED`. **When** khách `POST /api/v1/orders/:id/cancel`. **Kết quả:** `409` (“Đơn hàng ở trạng thái … không thể hủy”); đơn không đổi; tồn kho không đổi *(Test: `TC-ORDER-44`, Integration)*
  - `AC-16.10`: **Given** đơn của khách X. **When** khách Y `POST /api/v1/orders/:id/cancel` (hoặc `id` không tồn tại). **Kết quả:** `404` (“Không tìm thấy đơn hàng”); đơn của X không đổi *(Test: `TC-ORDER-45`, Integration)*
  - `AC-16.11`: **Given** đơn `PAID` và API hủy đơn `PAID` đã được triển khai. **When** hai yêu cầu đồng thời: `PAID → PREPARING` và `PAID → CANCELLED`. **Kết quả:** Đúng 1 yêu cầu thành công, yêu cầu còn lại nhận `409`; `orders.version` tăng 1. Đây là kịch bản kiểm thử dự kiến, chưa chạy được với MVP hiện tại vì API hủy `PAID` chưa có *(Test đề xuất: `TC-ORDER-46`, Integration; phụ thuộc module admin-orders/payment)*
  - `AC-16.12`: **Given** người dùng `role = CUSTOMER`. **When** gọi endpoint chuyển trạng thái của Barista. **Kết quả:** `403`; chưa đăng nhập → `401` *(Test: `TC-ORDER-47`, Integration)*
  - `AC-16.13`: **Given** `orderId` không tồn tại. **When** gọi `transition()`. **Kết quả:** `404 NotFoundException`; không ghi lịch sử *(Test: `TC-ORDER-49`, Unit)*
  - `AC-16.14`: **Given** đơn `PENDING` đang thanh toán thành công, nhưng bước cộng điểm ném lỗi trong cùng transaction. **Kết quả:** Rollback: đơn vẫn `PENDING`, `paid_at` rỗng, không có dòng lịch sử `PENDING → PAID`, không có bản ghi `EARNED` *(Test: `TC-ORDER-50`, Integration)*
  - `AC-16.15`: **Given** đơn `PENDING` của khách. **When** 2 request hủy gửi đồng thời. **Kết quả:** Đúng 1 request `200`, request còn lại `409` (thua khóa lạc quan hoặc thấy đã `CANCELLED`); nguyên liệu được hoàn đúng 1 lần *(Test: `TC-ORDER-51`, Concurrency)*

---

## 3. PHỤ THUỘC, NGOÀI PHẠM VI VÀ GHI CHÚ

### 3.1. Phụ thuộc giữa các FR

| Phụ thuộc | Lý do |
| :-- | :-- |
| FR-01..03 (Hào) | Cần JWT hợp lệ để tạo/xem/hủy đơn |
| FR-07..09 (Vũ Huy) | Giá cơ bản, phụ thu size, giá topping để tính đơn |
| FR-10..12 (Hào) | Giỏ hàng là đầu vào của `POST /api/v1/orders`; giỏ được giữ khi đặt đơn lỗi |
| FR-17..20 (Kiệt) | Thanh toán thành công / thất bại kích hoạt `PENDING → PAID` / `PAYMENT_FAILED` và cộng điểm |
| FR-21..22 (Quang Huy) | Lịch sử và theo dõi trạng thái đơn đọc dữ liệu do FR-13..16 tạo ra |

### 3.2. Ngoài phạm vi (Won't Have trong bản này)

- Quy đổi điểm thưởng thành tiền giảm giá (đã có sẵn enum `SPENT` / `REFUNDED` trong CSDL cho bản sau; quy tắc dự kiến 1 điểm = 1.000đ, tối đa 50% giá trị đơn sau khuyến mãi).
- Hoàn tiền thực tế qua cổng thanh toán và thu hồi điểm khi hủy đơn đã `PAID`.
- API cho Barista/Admin hủy đơn `PAID` (chuyển tiếp [5]); `CancelOrderService` hiện chỉ phục vụ khách hủy đơn `PENDING` / `PAYMENT_FAILED`.
- Tự động hủy đơn `PENDING` quá thời hạn (timeout).

### 3.3. Kết quả đối chiếu với code của repo hiện tại (đầu vào cho SP2-06)

- Đã đối chiếu `CreateOrderDto` và `main.ts`: `items` là mảng không rỗng; `quantity` là số nguyên 1..99; `size` là enum `S/M/L` với mặc định `M`; `toppingIds` không trùng và tối đa 3 phần tử. `ValidationPipe` đang bật `whitelist`, `forbidNonWhitelisted` và `transform`. Hiện không có giới hạn số dòng món tối đa trong `items`; thuộc tính ngoài DTO như `totalAmount` / `unitPrice` bị từ chối `400`, không phải được bỏ qua.
- Đã đối chiếu `OrdersService.create`: `PricingService.calculate()` và `PromotionsService.validate()` chạy **trước** `$transaction`. Trong transaction, hệ thống kiểm tra user/sản phẩm/topping, tải công thức, kiểm tra công thức, trừ nguyên liệu, tạo đơn + các dòng món/topping + lịch sử ban đầu và ghi snapshot nguyên liệu. Vì vậy tài liệu và AC-13.2 phải phân biệt phần tính giá/khuyến mãi với phần ghi dữ liệu có tính nguyên tử.
- `PricingService` kiểm tra sản phẩm/topping tồn tại và còn bán, kiểm tra size, quantity và topping; `OrdersService.create` kiểm tra lại trạng thái còn bán trong transaction. `PromotionsService.validate` trim và chuẩn hóa mã thành chữ hoa, kiểm tra `isActive`, ngày bắt đầu/kết thúc, `minOrderAmount`, mức giảm phần trăm hoặc cố định và `maxDiscount`. Code hiện không kiểm tra giới hạn số lượt sử dụng; không đặc tả thêm quy tắc usage-limit khi chưa có triển khai.
- Có một điểm cần phối hợp với SP1-04 (Pricing): `PricingService.calculate()` trả về snapshot giá topping trong `pricing.lines[index].toppings`, nhưng `OrdersService.create` hiện ghi `order_item_toppings.price` từ `topping.price` được truy vấn lại bên trong transaction. Nếu giá topping thay đổi giữa hai lần đọc, snapshot topping có thể khác số đã dùng trong `lineTotal`. Chưa sửa vì cần thống nhất contract với người phụ trách Pricing.
- Đã đối chiếu `order-state.ts`: `ALLOWED_TRANSITIONS` có đúng 9 cặp hợp lệ trên 7 trạng thái; `COMPLETED` và `CANCELLED` không có trạng thái đi ra; `assertTransition` ném `409 ConflictException` với thông điệp `Invalid order status transition: X -> Y`. `order-state.spec.ts` sinh các cặp từ `Object.values(OrderStatus)`, nên đang kiểm tra ma trận 7×7 (9 hợp lệ, 40 không hợp lệ).
- Đã đối chiếu `OrderService.transition`: đọc `id/status/version`, kiểm tra `assertTransition`, dùng `updateMany` với điều kiện `id + status + version`, tăng `version`, đặt `paidAt` khi sang `PAID`, ghi lịch sử trong transaction do caller truyền vào. Hàm không tự mở transaction và không tự kiểm tra quyền/chủ đơn. `OrdersService.create` tạo bản ghi mới ở `PENDING` và ghi lịch sử `NULL → PENDING`; đây là bước khởi tạo, không phải một lần chuyển trạng thái của đơn đã tồn tại.
- Đã đối chiếu `CancelOrderService`: chỉ chủ đơn được hủy; chỉ `PENDING` / `PAYMENT_FAILED` được hủy; gọi `transition()` trước, sau đó đọc `orderIngredientUsage` và gọi `restoreIngredients()` trong cùng transaction. Đơn không có snapshot (trước migration) được hỗ trợ; hủy lần hai bị chặn `409` trước khi hoàn kho.
- Đã rà các điểm ghi trạng thái trong mã nguồn backend: lần cập nhật trạng thái của đơn tồn tại đi qua `OrderService.transition`; `OrdersService.create` chỉ đặt trạng thái ban đầu `PENDING`. `LoyaltyService` cập nhật `pointsEarned`, không cập nhật `status`.
- Test hiện có: `order-state.spec.ts` bao phủ ma trận trạng thái; `order.service.spec.ts` bao phủ not-found, transition sai và optimistic locking; `orders.service.spec.ts` có unit test mock cho tạo đơn, thiếu user, promotion sai, thiếu kho/công thức và cộng gộp nguyên liệu; `cancel/cancel-order.service.spec.ts` bao phủ chủ đơn, trạng thái hủy, snapshot và tranh chấp hủy. Repo cũng có `apps/api/test/orders-concurrency.e2e-spec.ts` với các ca 10 request song song trên database thật và hai món dùng chung nguyên liệu. Test này dùng fixture stock/usage riêng (không trùng con số minh họa AC); việc chạy xanh cần xác nhận trong môi trường PostgreSQL của nhóm, chưa được xác nhận trong lượt rà soát tài liệu này.
- `AdminOrdersController` hiện chỉ gắn `@Roles(Role.ADMIN)`; chưa cho `BARISTA` truy cập. API hiện có là `PATCH /api/v1/admin/orders/:id/advance`, chỉ thực hiện `PAID → PREPARING → READY → COMPLETED`. Máy trạng thái vẫn khai báo `PAID → CANCELLED`, nhưng chưa có API hủy đơn đã `PAID` hoặc quy trình hoàn tiền/thu hồi điểm. Đây là khác biệt cần gửi người phụ trách `admin-orders` / Leader; không sửa module đó trong SP1-06.
- UI checkout hiện chuyển tới `/checkout/payment?orderId=<orderId>`. Với Mock, trang thanh toán chỉ xóa giỏ khi nhận `SUCCESS`; tuy nhiên nhánh VNPay hiện gọi `clearCart()` ngay trước khi chuyển hướng sang cổng, tức là trước khi IPN xác nhận thành công. Điều này chưa khớp quy tắc giữ giỏ đến khi thanh toán thành công; thuộc phạm vi phối hợp checkout/payment và cart của Kiệt/Hào, không sửa trong phần SP1-06.
- Các FR-21..22 (xem danh sách/chi tiết lịch sử) thuộc Quang Huy. AC kiểm tra quyền xem `GET /api/v1/orders/:id` phải nằm trong `fr-history.md`, không đặt trong FR-16 của Hạnh.
- Mã điểm thưởng hiện được tính trong `LoyaltyService.award()` bằng `floor(finalAmount / 1000)`, chỉ gọi sau khi transition `PENDING → PAID` thành công và trong cùng transaction của luồng payment. `loyalty_transactions` hiện chưa có unique constraint `(order_id, type)`; thiết kế idempotency đang dựa vào lớp kiểm tra trong `award()` và state transition/optimistic locking. Việc callback payment lặp thuộc phần phối hợp với SP1-07.

### 3.4. Giới hạn đã biết của phạm vi Order

| # | Nội dung | Ghi chú |
| :-- | :-- | :-- |
| D-02 | Chuyển tiếp [5] (`PAID → CANCELLED`) hợp lệ về máy trạng thái nhưng chưa có API; `CancelOrderService` chỉ cho `PENDING` / `PAYMENT_FAILED`. | Ghi backlog; khi làm cần hoàn nguyên liệu và quy tắc hoàn tiền/điểm. |

Việc hoàn nguyên liệu khi hủy đã dùng `restoreIngredients` theo snapshot `order_ingredient_usages` (có test hủy từ `PAYMENT_FAILED`).

---

## 4. TRUY VẾT (TRACEABILITY)

> *Lưu ý: bảng này là bắt buộc ở cuối mỗi file `fr-*.md` để Quang Huy tổng hợp vào `docs/traceability-matrix.md`.*

| Mã FR | Tên yêu cầu | Use-Case liên kết | Sơ đồ liên quan | Code / API Endpoint | Test Case ID |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `FR-13` | Tạo đơn hàng mới (Atomic Transaction) | `UC-ORD-01` (bước 4–10, Exc-1, Exc-2) | `docs/diagrams/usecase-order-payment.svg` | `POST /api/v1/orders`; `OrdersService.create`, `PricingService` | `TC-ORDER-01`, `TC-ORDER-07`..`19` |
| `FR-14` | Trừ tồn kho nguyên liệu & chống âm kho | `UC-ORD-01` (bước 7, Exc-3, Alt-4) | `docs/diagrams/usecase-order-payment.svg` | `POST /api/v1/orders`, `POST /api/v1/orders/:id/cancel`; `deductIngredients`, `restoreIngredients` (`common/ingredient-stock.helper.ts`) | `TC-ORDER-02`, `TC-ORDER-03`, `TC-ORDER-20`..`25` |
| `FR-15` | Áp dụng mã khuyến mãi & Tích điểm thưởng | `UC-ORD-01` (Alt-1, Exc-4, bước 16) | `docs/diagrams/usecase-order-payment.svg` | `POST /api/v1/orders` (mã); `PromotionsService.validate`, `LoyaltyService.award` | `TC-ORDER-04`, `TC-ORDER-26`..`37` |
| `FR-16` | Quản lý vòng đời trạng thái đơn (State Machine) | `UC-ORD-01` (bước 15, 18, Alt-3, Alt-4, Exc-9) | `docs/diagrams/order-state-machine.svg` | `POST /api/v1/orders/:id/cancel`; `assertTransition` (`order-state.ts`), `OrderService.transition()` | `TC-ORDER-05`, `TC-ORDER-06`, `TC-ORDER-38`..`47`, `TC-ORDER-49`..`51` |

> `TC-ORDER-01`..`06` trùng với `test-scenarios.md` hiện có (AC-13.1, 14.1, 14.2, 15.1, 16.1, 16.3). Các Test ID còn lại do Hạnh đề xuất, chưa đồng nghĩa với việc test đã được viết/chạy; Quang Huy tổng hợp các AC được phân công vào `test-scenarios.md`. `TC-ORDER-48` không được phân bổ cho SP1-06 vì kịch bản xem chi tiết đơn thuộc FR-21..22 của Quang Huy.
