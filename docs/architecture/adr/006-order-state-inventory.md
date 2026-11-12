# ADR-006: Máy Trạng Thái Đơn Hàng & Kiểm Soát Tồn Kho Nguyên Liệu An Toàn

>> **Trạng thái**: Accepted
> **Ngày quyết định**: 2026-11-10
> **Người đề xuất**: Tôn Thất Hạnh (SP1-06)
> **Người duyệt**: Minh Chiến (Leader)
> **Phạm vi áp dụng**: `apps/api/src/modules/orders` và `apps/api/src/common/ingredient-stock.helper.ts`
> **Liên quan**: FR-13..16 ([fr-order.md](../../requirements/fr-order.md)), [UC-ORD-01](../../requirements/usecase-order-payment.md), [order-state-machine](../../diagrams/order-state-machine.svg), ADR-003 (PostgreSQL + Prisma), ADR-005 (Idempotency-Key)

---

## 1. BỐI CẢNH & VẤN ĐỀ (CONTEXT & PROBLEM STATEMENT)

Đơn hàng là nghiệp vụ cốt lõi của BrewLite và có ba rủi ro kỹ thuật:

1. **Trạng thái sai.** Đơn đi qua nhiều bước (thanh toán, pha chế, giao, hủy) do nhiều tác nhân kích hoạt: khách, cổng thanh toán, Barista. Nếu mỗi nơi tự ghi `status`, rất dễ xuất hiện chuyển trạng thái vô lý (ví dụ `COMPLETED → PAID`, hoặc đơn đã hủy lại được thanh toán).
2. **Dùng quá tồn kho nguyên liệu.** BrewLite quản lý tồn kho theo nguyên liệu và công thức pha chế; một nguyên liệu (ví dụ sữa) được nhiều món dùng chung. Nhiều khách đặt cùng lúc khi nguyên liệu sắp hết, nếu kiểm tra “còn đủ” rồi mới trừ thành hai bước riêng sẽ tạo race condition (hai request cùng thấy còn đủ cho 1 ly và cùng bán).
3. **Dữ liệu dở dang.** Tạo đơn, trừ kho, ghi lịch sử là nhiều thao tác; nếu một bước lỗi mà các bước trước vẫn được lưu thì tồn kho và đơn sẽ lệch nhau.

Ràng buộc: dùng NestJS + Prisma + PostgreSQL (ADR-003); kết nối CSDL có thể đi qua connection pooler (schema khai báo cả `url` và `directUrl`); quy mô là MVP với tải thấp; đề yêu cầu có test chứng minh (a) chặn được chuyển trạng thái sai, (c) đặt đồng thời không vượt tồn kho nguyên liệu.

---

## 2. CÁC PHƯƠNG ÁN ĐÃ XEM XÉT (CONSIDERED OPTIONS)

1. **Phương án A. Cập nhật có điều kiện nguyên tử `WHERE stock >= need` trong transaction + snapshot `order_ingredient_usages`** — *Chọn*:
   - Ưu điểm: Đúng đắn chỉ với một câu lệnh; khóa dòng rất ngắn; không cần thêm cột/hạ tầng; chạy tốt qua pooler; không từ chối “oan”: chỉ từ chối khi thật sự thiếu nguyên liệu.
   - Nhược điểm: Nguyên liệu dùng chung (sữa) là điểm nóng, các đơn xếp hàng ngắn tại dòng đó; cần sắp thứ tự cập nhật theo `id` để tránh deadlock.
2. **Phương án A'. Thêm cột `version` cho `ingredients` và so khớp `version` khi trừ** — *Không chọn*:
   - Ưu điểm: Phát hiện xung đột tường minh.
   - Nhược điểm: Thừa vì điều kiện `stock >= need` đã đủ; gây từ chối “oan” khi nguyên liệu còn nhiều; cần migration schema.
3. **Phương án B. Khóa bi quan `SELECT … FOR UPDATE`** — *Không chọn*:
   - Ưu điểm: Request xếp hàng, ít bị từ chối oan.
   - Nhược điểm: Giữ khóa suốt transaction; dễ nghẽn và deadlock khi giỏ nhiều dòng; phức tạp hơn khi dùng pooler.
4. **Phương án C. Mức cô lập `SERIALIZABLE`** — *Không chọn*:
   - Ưu điểm: Đúng đắn mặc định, ít code.
   - Nhược điểm: Lỗi serialization phải retry ở mọi nơi; chi phí cao với MVP; khó kiểm soát phạm vi.
5. **Phương án D. Khóa phân tán (Redis)** — *Không chọn*:
   - Ưu điểm: Mở rộng nhiều instance.
   - Nhược điểm: Thêm một dịch vụ để vận hành và triển khai; vượt phạm vi MVP.
6. **Phương án E. Kiểm tra rồi trừ kho ở hai bước riêng** — *Loại*:
   - Ưu điểm: Dễ viết.
   - Nhược điểm: Có race condition, có thể dùng quá nguyên liệu còn lại.
7. **Phương án F. Trạng thái bằng các cờ boolean (`isPaid`, `isCancelled`…) hoặc cho mọi nơi tự ghi `status`** — *Loại*:
   - Ưu điểm: Linh hoạt.
   - Nhược điểm: Dễ ra tổ hợp vô nghĩa; không có điểm kiểm soát duy nhất; khó test.

---

## 3. QUYẾT ĐỊNH (DECISION)

Chúng tôi chọn **Phương án A** (cập nhật có điều kiện nguyên tử trên `ingredients.stock` trong transaction, kèm máy trạng thái một cửa ghi) vì lý do:
- Khớp yêu cầu đề bài: có test chứng minh chặn chuyển trạng thái sai và không dùng quá tồn kho khi đặt đồng thời.
- Đơn giản, an toàn, dễ bảo trì: một câu lệnh có điều kiện thay cho khóa bi quan hay hạ tầng ngoài.
- Tối ưu chi phí và môi trường hosting: không cần thêm dịch vụ (Redis) và chạy ổn qua connection pooler.

Chi tiết quyết định:

### 3.1. Máy trạng thái hữu hạn, một cửa ghi duy nhất

- Định nghĩa 7 trạng thái và **9 chuyển tiếp hợp lệ** trong một bảng hằng `ALLOWED_TRANSITIONS` (`order-state.ts`); `COMPLETED` và `CANCELLED` có danh sách rỗng.
- Hàm `assertTransition(from, to)` ném `409 ConflictException` nếu cặp không nằm trong bảng.
- **Mọi lần chuyển trạng thái của một đơn đã tồn tại chỉ được thực hiện qua `OrderService.transition(tx, orderId, to, opts?)`.** Trường hợp tạo đơn mới là ngoại lệ khởi tạo: `OrdersService.create` insert đơn ở `PENDING` và ghi lịch sử `NULL → PENDING`. Hàm `transition()` nhận `tx` từ bên gọi (không tự mở transaction) và thực hiện theo thứ tự: đọc đơn (`id`, `status`, `version`) → `404 NotFoundException` nếu không có → `assertTransition(status, to)` → cập nhật có điều kiện (bên dưới) → đặt `paid_at` khi `to = PAID` → ghi `order_status_history` (`changedBy`, `reason` tùy chọn) → trả đơn đã cập nhật. Các module khác (payments, admin) chỉ gọi `transition()`, không `update` trực tiếp.
- **`transition()` không làm tác dụng phụ nghiệp vụ.** Cộng điểm thưởng (`LoyaltyService.award`) và hoàn nguyên liệu khi hủy do **bên gọi** thực hiện, **sau khi** `transition()` thành công và **trong cùng `tx`**. Nhờ vậy lỗi `409` từ `assertTransition` hoặc từ xung đột đồng thời chặn luôn các tác dụng phụ, và nếu một tác dụng phụ lỗi thì cả việc đổi trạng thái được rollback.
- **`transition()` không kiểm tra quyền hay chủ sở hữu đơn.** Việc đó thuộc lớp controller/service gọi nó (khách chỉ hủy đơn của mình; chỉ `BARISTA`/`ADMIN` được thao tác pha chế).
- Chuyển trạng thái dùng **optimistic locking trên `orders.version`** (cài bằng `updateMany`): `UPDATE orders SET status = :to, version = version + 1 [, paid_at = now()] WHERE id = :id AND status = :from AND version = :v`. Nếu `count ≠ 1` thì có thao tác khác vừa đổi đơn, trả `409 ConflictException` (“Order status changed concurrently. Please retry.”).

### 3.2. Tạo đơn và trừ kho trong một transaction (Prisma interactive transaction)

Các phép tính giá và thẩm định khuyến mãi (`PricingService.calculate`, `PromotionsService.validate`) chạy **trước** khi mở transaction, đúng với `OrdersService.create` hiện tại. Các thao tác đọc/kiểm tra dữ liệu liên quan đến user, sản phẩm/topping và công thức; trừ nguyên liệu; tạo `orders`, `order_items`, `order_item_toppings`; ghi `order_ingredient_usages` và lịch sử `NULL → PENDING` nằm trong cùng `prisma.$transaction`. Bất kỳ lỗi nào bên trong transaction đều rollback toàn bộ thay đổi dữ liệu và tồn kho. Lỗi tính giá/khuyến mãi xảy ra trước transaction nên cũng không tạo đơn hoặc trừ kho.

### 3.3. Cập nhật tồn kho nguyên liệu có điều kiện (nguyên tử)

1. Từ giỏ hàng, `product_recipes` (theo sản phẩm + size) và `topping_recipes`, tính **nhu cầu của từng nguyên liệu**, cộng gộp qua tất cả các dòng (các món khác nhau có thể dùng chung một nguyên liệu).
2. Với từng nguyên liệu, **theo thứ tự `id` tăng dần** (tránh deadlock giữa hai đơn đụng nhiều nguyên liệu), trừ kho bằng một câu lệnh có điều kiện:

```sql
UPDATE ingredients
SET stock = stock - :need
WHERE id = :id AND stock >= :need AND is_available = true;
```

3. Nếu số dòng bị ảnh hưởng ≠ 1 (không đủ nguyên liệu), ném `400 BadRequestException` và toàn bộ transaction rollback, kể cả các nguyên liệu đã trừ trước đó trong cùng đơn. Tồn kho không bao giờ âm vì điều kiện `stock >= :need` nằm ngay trong câu lệnh; PostgreSQL khóa dòng trong thời gian ngắn của câu `UPDATE` và đánh giá lại điều kiện cho đơn đến sau, nên hai đơn đồng thời không thể cùng lấy phần nguyên liệu cuối cùng.
4. Cách làm này đã được xác nhận trong `deductIngredients` (`common/ingredient-stock.helper.ts`): gom trùng, bỏ lượng ≤ 0, sắp theo `ingredientId`, `updateMany` có điều kiện, ném `400` khi thiếu. `restoreIngredients` hoàn theo snapshot với cùng thứ tự. Trong cùng transaction, ghi `order_ingredient_usages` (một dòng cho mỗi nguyên liệu, tổng lượng đã trừ). Khi hủy đơn, hoàn lại đúng các lượng này.
5. Schema hiện **không có cột `version` trên `ingredients`** (`Product.version` đã DEPRECATED theo CR-01); khóa lạc quan bằng `version` chỉ dùng cho `orders` (mục 3.1). Với tồn kho, “lạc quan” theo nghĩa không giữ khóa trước: đơn cứ thực hiện và chỉ bị từ chối khi điều kiện `stock >= :need` không còn đúng tại thời điểm ghi.

### 3.4. Vòng đời tồn kho gắn với trạng thái

- Trừ nguyên liệu khi tạo đơn (`PENDING`); đơn `PENDING` và `PAYMENT_FAILED` **giữ** nguyên liệu đã trừ.
- Hoàn nguyên liệu đúng một lần, đúng lượng trong snapshot `order_ingredient_usages` khi đơn chuyển sang `CANCELLED`. Luồng hủy đơn gọi `transition(→ CANCELLED)` **trước**, rồi mới hoàn nguyên liệu trong cùng `tx`; `CANCELLED` là trạng thái kết thúc nên hủy lần hai bị `assertTransition` chặn trước khi tới bước hoàn, do đó không hoàn hai lần.

---

## 4. HỆ QUẢ (CONSEQUENCES)

### 4.1. Điểm tích cực (Positive / Pros)
- Mọi chuyển trạng thái đi qua một điểm, kiểm chứng được bằng bảng 7×7 (9 cặp hợp lệ, 40 cặp bị chặn).
- Không thể dùng quá tồn kho nguyên liệu, kể cả khi đặt đồng thời; tạo đơn là “tất cả hoặc không gì cả”.
- Lịch sử trạng thái đầy đủ phục vụ theo dõi đơn và đối soát.

### 4.2. Điểm hạn chế & Thách thức (Negative / Cons / Trade-offs)
- Nguyên liệu dùng chung bị nhiều đơn cùng cập nhật sẽ xếp hàng ngắn tại dòng đó; chấp nhận được ở quy mô MVP. Đơn bị `400` vì thiếu nguyên liệu thì UI giữ giỏ để khách đổi món hoặc đặt lại.
- Phải duy trì thứ tự cập nhật nguyên liệu theo `id`; nếu code mới bỏ qua quy ước này, hai đơn đụng nhiều nguyên liệu có thể deadlock. Giá và khuyến mãi hiện được đọc trước transaction; nếu catalog/promotion thay đổi đồng thời trong khoảng giữa bước tính và bước ghi, request đang chạy vẫn dùng kết quả đã tính. Đây là trade-off hiện tại cần cân nhắc khi tăng tải hoặc thay đổi cách quản trị giá.
- Đơn `PENDING` / `PAYMENT_FAILED` giữ nguyên liệu; đơn bị bỏ quên sẽ khóa tồn kho nguyên liệu cho đến khi khách hủy. **Chưa có tự động hủy theo timeout** (ngoài phạm vi bản này, ghi vào backlog).
- Hoàn tiền thực tế và thu hồi điểm khi hủy đơn đã `PAID` chưa được hiện thực; chuyển `PAID → CANCELLED` hiện chưa có API (chỉ tồn tại trong máy trạng thái).
- Việc hoàn nguyên liệu khi hủy do `CancelOrderService` gọi `restoreIngredients` (theo snapshot `order_ingredient_usages`) sau `transition()`; đã có test cho hủy từ `PAYMENT_FAILED`.
- Cần thận trọng khi thêm trạng thái mới: phải cập nhật bảng chuyển tiếp, sơ đồ và test 7×7 cùng lúc.

---

## 5. LIÊN KẾT MÃ NGUỒN & TRUY VẾT (CODE & TRACEABILITY)

> Phạm vi SP1-06 chỉ cập nhật tài liệu và sơ đồ Order. `common/ingredient-stock.helper.ts`, `prisma/schema.prisma`, `prisma/seed.ts`, `payments`, `admin-orders`, pricing và loyalty được tham chiếu để đối chiếu; không chỉnh sửa trong task này.

- Thư mục code hiện thực: `apps/api/src/modules/orders/` (`order-state.ts` với `assertTransition`; `order.service.ts` với `OrderService.transition()`; `orders.service.ts` với `OrdersService.create`; `cancel/cancel-order.service.ts`), `apps/api/src/common/ingredient-stock.helper.ts` (`deductIngredients`, `restoreIngredients`) và `LoyaltyService.award()`.
- File cấu hình liên quan: `apps/api/prisma/schema.prisma` (`Order.version`, `Ingredient`, `ProductRecipe`, `ToppingRecipe`, `OrderIngredientUsage`, `OrderStatusHistory`); `apps/api/prisma/seed.ts` (nguyên liệu, công thức, mã giảm giá).
- Sơ đồ và đặc tả: [order-state-machine](../../diagrams/order-state-machine.svg), [usecase-order-payment](../../diagrams/usecase-order-payment.svg), [fr-order.md](../../requirements/fr-order.md) (FR-14, FR-16), [usecase-order-payment.md](../../requirements/usecase-order-payment.md).
- Test case kiểm chứng: các test hiện có `order-state.spec.ts`, `order.service.spec.ts`, `orders.service.spec.ts`, `cancel/cancel-order.service.spec.ts`, `ingredient-stock.helper.spec.ts`; Test ID theo tiêu chí của đề:

| Tiêu chí của đề | Cách chứng minh | Test (đề xuất) |
| :-- | :-- | :-- |
| (a) Chặn chuyển trạng thái sai | Unit test bảng 7×7 cho `assertTransition`; integration test `PENDING → COMPLETED` nhận `409` | TC-ORDER-06, 40; TC-ORDER-41 |
| (b) Cùng `Idempotency-Key` chỉ tạo 1 payment và không cộng điểm hai lần | Cơ chế payment/idempotency thuộc ADR-005 và SP1-07; FR-15 chỉ kiểm tra điểm không bị cộng lần hai | Test của fr-payment; TC-ORDER-34 |
| (c) Đặt đồng thời không vượt tồn kho nguyên liệu | Integration test chạy N request song song trên Postgres thật, kiểm tra tồn kho nguyên liệu cuối không âm; tồn đủ đúng 5 ly và 10 request song song thì đúng 5 đơn thành công (AC-14.2); thêm ca hai món dùng chung nguyên liệu (AC-14.4) | TC-ORDER-03, TC-ORDER-21 |
| Chỉ một cửa ghi `status` | Review mã nguồn/tìm kiếm trong PR | TC-ORDER-39 |
