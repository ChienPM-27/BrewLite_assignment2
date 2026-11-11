# CHI TIẾT MÓN & TÙY BIẾN GIÁ — ĐẶC TẢ YÊU CẦU CHỨC NĂNG (FR-07..09)

> **Người phụ trách**: Vũ Hoàng Huy  
> **Mã Task**: `SP1-04` (Task 1.2)  
> **Dải ID**: `FR-07` đến `FR-09`  
> **Use-Case liên kết**: `UC-02` (Xem chi tiết & tùy biến món)

---

## 1. TỔNG QUAN PHẠM VI & NGUYÊN TẮC KIẾN TRÚC

Tài liệu này đặc tả đầy đủ nhóm chức năng **Xem chi tiết sản phẩm, tùy biến kích cỡ/topping và tính giá** cho hệ thống BrewLite.

### Nguyên tắc kiến trúc bắt buộc (Business & Security Invariants)
1. **Backend là Nguồn sự thật duy nhất về giá (Single Source of Truth)**:
   - Mọi công thức tính đơn giá dòng món (`unitPrice`), tổng phụ thu topping (`toppingTotal`), đơn giá kèm topping (`unitPriceWithToppings`), thành tiền dòng (`lineTotal`) và tạm tính đơn hàng (`subtotal`) bắt buộc do `PricingService.calculate()` ở Backend đọc trực tiếp từ PostgreSQL (`products`, `product_size_prices`, `toppings`) và tính toán độc lập.
   - Client **không được phép** gửi giá tính sẵn để làm căn cứ tính tiền; nếu payload chứa trường giá giả mạo, Backend bắt buộc bỏ qua hoàn toàn.
2. **Frontend chỉ hiển thị giá tạm tính (Estimated Price Only)**:
   - Giao diện trang chi tiết (`ProductDetailView`, `useProductDetail`, `ProductPrice`) chỉ sử dụng dữ liệu giá do `GET /api/v1/products/:id` trả về để tính **đơn giá/tổng tiền tạm tính** phục vụ trải nghiệm người dùng tức thời và lưu tạm vào `useCartStore`.
   - Giá thanh toán chính thức chỉ được chốt lại ở bước tạo đơn (`OrdersService.create()` → `PricingService.calculate()`).
3. **Toàn vẹn số học VNĐ**:
   - Tiền tệ sử dụng đơn vị `VND` nguyên chẵn (`Decimal(12, 0)` trong DB), không làm tròn sai số dấu phẩy động.

---

## 2. PHÂN LOẠI MỨC ĐỘ ƯU TIÊN THEO CHUẨN MoSCoW

| Nhóm MoSCoW | Mã / Hạng mục | Mô tả phạm vi trong module Product Detail |
| :--- | :--- | :--- |
| **Must-Have** | `FR-07`: Xem chi tiết sản phẩm | Tải dữ liệu món từ `GET /api/v1/products/:id`, hiển thị tên, ảnh (kèm fallback khi `imageUrl = null`), giá gốc, trạng thái còn bán/hết hàng, xử lý `400`/`404`/lỗi mạng. |
| **Must-Have** | `FR-08`: Tùy biến Size & Topping | Chọn 1 kích cỡ thuộc `{S, M, L}`, chọn từ `0` đến tối đa `3` loại topping không trùng lặp, chọn số lượng nguyên từ `1` đến `99`. |
| **Must-Have** | `FR-09`: Tính giá tạm tính & Xác thực giá Backend | Cập nhật giá tạm tính realtime trên UI cho mọi thao tác size/topping/số lượng; Backend tính lại toàn bộ giá từ DB qua `PricingService`. |
| **Should-Have** | Trải nghiệm bổ trợ trên trang chi tiết | Hiển thị bảng kê chi tiết từng thành phần giá, điểm BrewPoints dự kiến (`Math.floor(unitPrice / 1000)`), bộ sưu tập ảnh thu nhỏ, trạng thái Skeleton loading và Toast xác nhận khi thêm vào giỏ. |
| **Could-Have** | Mở rộng thông tin dinh dưỡng & công thức từ DB | Trả thêm mô tả món riêng theo từng sản phẩm (`description`) và bảng thành phần công thức/kcal động từ DB qua API chi tiết (hiện UI đang dùng mô tả & hồ sơ rang mẫu). |
| **Won't-Have** | Ngoài phạm vi MVP của Product Detail | Không cho khách hàng tự chỉnh định lượng nguyên liệu (gram/ml) theo công thức; không áp mã giảm giá (`Promotion`) ngay tại trang chi tiết; không chấp nhận giá do Client gửi lên. |

---

## 3. ĐẶC TẢ CHI TIẾT CÁC YÊU CẦU CHỨC NĂNG (FR-07..09)

### 3.1. FR-07: Xem chi tiết sản phẩm (Product Detail View)

- **Độ ưu tiên (MoSCoW)**: **Must Have**
- **User Story (`US-07`)**:  
  > *Là một **Khách hàng**, tôi muốn **xem đầy đủ thông tin chi tiết của một món đồ uống (tên, hình ảnh, mô tả, giá gốc, danh sách size và topping khả dụng)** để **hiểu rõ sản phẩm và tình trạng phục vụ trước khi tùy biến đặt món**.*
- **Mô tả nghiệp vụ**:
  - Khi người dùng truy cập `/products/:id`, Frontend gọi API công khai `GET /api/v1/products/:id` (`ProductDetailController` → `ProductDetailService.getProductById()`).
  - Backend kiểm tra định dạng ID (`^[A-Za-z0-9_-]{1,64}$`), truy vấn thông tin sản phẩm kèm `sizePrices` (sắp xếp theo `priceAdjustment` tăng dần) và danh sách các `toppings` đang mở bán (`isAvailable = true` và `stock > 0`).
  - Nếu sản phẩm đang ngừng bán (`isAvailable = false` hoặc `stock <= 0`), giao diện vẫn cho xem thông tin món nhưng hiển thị cảnh báo **"Hết hàng / Sản phẩm không còn bán"** và khóa chức năng tùy biến/thêm vào giỏ hàng.

#### Tiêu chí chấp nhận (Acceptance Criteria — FR-07)
- **`AC-07.1` (Lấy & hiển thị chi tiết sản phẩm hợp lệ — Happy Path)**:
  - **Given** sản phẩm có `id` hợp lệ đang tồn tại trong DB và còn bán (`isAvailable = true`).
  - **When** Client gọi `GET /api/v1/products/:id` và render `ProductDetailPage`.
  - **Then** Backend trả về `200 OK` gồm `id`, `name`, `imageUrl`, `basePrice`, `currency: 'VND'`, `isAvailable`, `sizePrices` (theo thứ tự phụ thu tăng dần) và `toppings` khả dụng; Frontend hiển thị đầy đủ tên món (`<h1>`), ảnh sản phẩm (hoặc ảnh giữ chỗ nếu `imageUrl = null`), mô tả, giá gốc (`formatVND(basePrice)`), danh sách size và danh sách topping.
- **`AC-07.2` (Sản phẩm không tồn tại — `404 Not Found`)**:
  - **Given** `id` đúng định dạng nhưng không tồn tại bản ghi tương ứng trong bảng `products`.
  - **When** Client gọi `GET /api/v1/products/:id`.
  - **Then** Backend trả về `404 Not Found`; Frontend hiển thị màn hình trạng thái lỗi 404 (`"Không tìm thấy sản phẩm"`) kèm nút quay lại `/menu`.
- **`AC-07.3` (ID sai định dạng hoặc lỗi kết nối — `400 Bad Request` / `Network Error`)**:
  - **Given** `id` vi phạm biểu thức hợp lệ hoặc hệ thống mất kết nối API.
  - **When** Trang chi tiết tải dữ liệu.
  - **Then** Backend trả `400 Bad Request` cho ID sai định dạng; Frontend hiển thị thông báo lỗi tương ứng (lỗi 400 có nút về thực đơn, lỗi mạng/5xx có nút **"Thử lại"** gọi `retry()`).
- **`AC-07.4` (Trạng thái sản phẩm ngừng bán / hết hàng)**:
  - **Given** sản phẩm trả về `isAvailable = false`.
  - **When** `ProductDetailView` hoàn tất render.
  - **Then** giao diện hiển thị huy hiệu/cảnh báo `"Sản phẩm không còn bán / Hết hàng"`, vô hiệu hóa các lựa chọn size, topping, số lượng và nút CTA hiển thị `"Sản phẩm không còn bán"` ở trạng thái `disabled`.

---

### 3.2. FR-08: Tùy biến Size, Topping & Số lượng (Product Customization)

- **Độ ưu tiên (MoSCoW)**: **Must Have**
- **User Story (`US-08`)**:  
  > *Là một **Khách hàng**, tôi muốn **chọn kích cỡ ly (S/M/L), thêm hoặc bỏ tối đa 3 loại topping và điều chỉnh số lượng ly** để **tùy chỉnh đồ uống đúng khẩu vị và nhu cầu trước khi thêm vào giỏ hàng**.*
- **Mô tả nghiệp vụ**:
  - **Kích cỡ (`SizeSelector`)**: Mỗi dòng sản phẩm chỉ được chọn **duy nhất 1 size** thuộc tập `{S, M, L}` (radio group). Trên UI, hệ thống mặc định chọn phần tử đầu tiên trong `sizePrices` (thường là `Size S` với `priceAdjustment = 0`).
  - **Topping (`ToppingSelector`)**: Khách hàng có thể chọn từ `0` đến tối đa `3` loại topping khác nhau (`MAX_TOPPINGS = 3`). Khi đã chọn đủ 3 loại, toàn bộ các ô topping chưa được chọn phải bị khóa (`disabled`) để ngăn vượt giới hạn. Khách hàng có thể bỏ chọn bất kỳ topping nào đã chọn để mở khóa lại các lựa chọn khác.
  - **Số lượng (`QuantityStepper`)**: Cho phép chọn số lượng nguyên từ `1` đến `99` (`MIN_QUANTITY = 1`, `MAX_QUANTITY = 99`).
  - **Ràng buộc dữ liệu bắt buộc trước khi thêm giỏ**: Chỉ kích hoạt nút thêm vào giỏ khi `product.isAvailable = true`, đã chọn size hợp lệ (`size !== null`) và tính được `unitPrice !== null`.

#### Tiêu chí chấp nhận (Acceptance Criteria — FR-08)
- **`AC-08.1` (Chọn kích cỡ duy nhất & mặc định Size S trên UI)**:
  - **Given** sản phẩm có danh sách `sizePrices` gồm `S (+0đ)`, `M (+5.000đ)`, `L (+10.000đ)`.
  - **When** trang chi tiết tải thành công lần đầu và sau đó người dùng nhấn chọn `Size M` rồi `Size L`.
  - **Then** ban đầu `Size S` được chọn mặc định (`aria-checked="true"`); khi chọn `Size M` hoặc `Size L`, chỉ duy nhất size vừa chọn có `aria-checked="true"`, các size còn lại chuyển về `aria-checked="false"`.
- **`AC-08.2` (Chọn/bỏ chọn Topping & chặn vượt quá 3 topping)**:
  - **Given** sản phẩm có ít nhất 4 topping khả dụng và chưa chọn topping nào (`0/3`).
  - **When** người dùng lần lượt chọn 3 topping khác nhau, thử chọn topping thứ 4, sau đó bỏ chọn 1 topping đã chọn.
  - **Then**:
    - Bộ đếm cập nhật tuần tự `(Đã chọn 1/3 topping)` → `(Đã chọn 3/3 topping)`.
    - Tại trạng thái `3/3`, các checkbox topping chưa được chọn chuyển sang `disabled`, không thể tích chọn topping thứ 4.
    - Khi bỏ chọn 1 topping, bộ đếm giảm về `(Đã chọn 2/3 topping)` và các topping còn lại được kích hoạt (`enabled`) trở lại.
- **`AC-08.3` (Điều chỉnh số lượng trong biên `1..99`)**:
  - **Given** số lượng mặc định là `1`.
  - **When** người dùng nhấn nút tăng (`+`) hoặc giảm (`-`).
  - **Then** khi `quantity = 1`, nút giảm bị `disabled`; khi tăng đến `99`, nút tăng bị `disabled`; giá trị số lượng luôn là số nguyên nằm trong `[1, 99]`.
- **`AC-08.4` (Chặn thêm giỏ khi thiếu thuộc tính size bắt buộc)**:
  - **Given** sản phẩm còn bán nhưng danh sách `sizePrices` rỗng (không xác định được size hợp lệ).
  - **When** trang chi tiết render.
  - **Then** vùng chọn size hiển thị `"Sản phẩm chưa có size khả dụng."`, bảng kê giá báo thiếu dữ liệu size và nút CTA hiển thị `"Chưa thể thêm vào giỏ"` ở trạng thái `disabled`.

---

### 3.3. FR-09: Quy tắc tính giá tạm tính & Xác thực giá Backend (Dynamic Pricing & Backend Validation)

- **Độ ưu tiên (MoSCoW)**: **Must Have**
- **User Story (`US-09`)**:  
  > *Là một **Khách hàng và Chủ hệ thống**, tôi muốn **đơn giá tạm tính trên giao diện cập nhật tức thì theo từng lựa chọn Size/Topping/Số lượng, đồng thời Backend tự tính lại và xác thực toàn bộ giá từ Database** để **khách hàng biết rõ số tiền trước khi đặt và hệ thống không bao giờ bị gian lận giá từ phía Client**.*

#### Công thức tính giá chuẩn (Pricing Formula)
$$\text{unitPrice} = \text{basePrice} + \text{priceAdjustment}(\text{size})$$
$$\text{toppingTotal} = \sum_{i=1}^{k} \text{toppingPrice}_i \quad (0 \le k \le 3)$$
$$\text{unitPriceWithToppings} = \text{unitPrice} + \text{toppingTotal}$$
$$\text{lineTotal} = \text{unitPriceWithToppings} \times \text{quantity} \quad (1 \le \text{quantity} \le 99)$$
$$\text{subtotal} = \sum \text{lineTotal}$$

*(Ghi chú đồng bộ API Order: Trong DB bảng `order_items`, `OrderItem.unitPrice` lưu `basePrice + priceAdjustment(size)` và `OrderItemTopping.price` lưu đơn giá từng topping; Frontend hiển thị `unitPriceWithToppings` là đơn giá 1 ly đã gồm topping).*

#### Tiêu chí chấp nhận (Acceptance Criteria — FR-09)

- **`AC-09.1` (Cập nhật giá realtime khi chọn/đổi Size trên UI)**:
  - **Given** sản phẩm có `basePrice = 35.000đ`, `S (+0đ)`, `M (+5.000đ)`, `L (+10.000đ)`, số lượng `1`, chưa chọn topping.
  - **When** người dùng chọn đổi lần lượt `Size S` → `Size M` → `Size L`.
  - **Then**:
    - Tại `Size S`: `Đơn giá 1 ly = 35.000đ`, dock tổng tiền tạm tính và nút CTA hiển thị `35.000đ`, không hiện dòng nâng cấp size.
    - Tại `Size M`: hiển thị dòng `Nâng cấp Size M: +5.000đ`, `Đơn giá 1 ly` và nút CTA cập nhật tức thì thành `40.000đ`.
    - Tại `Size L`: hiển thị dòng `Nâng cấp Size L: +10.000đ`, `Đơn giá 1 ly` và nút CTA cập nhật tức thì thành `45.000đ`.
- **`AC-09.2` (Cập nhật giá realtime khi thêm/bớt Topping trên UI)**:
  - **Given** sản phẩm đang chọn `Size S (35.000đ)`, số lượng `1`, có các topping `Trân châu trắng (+5.000đ)`, `Kem Cheese (+10.000đ)`, `Đào miếng (+8.000đ)`.
  - **When** người dùng lần lượt tích chọn thêm từng topping và sau đó bỏ chọn `Kem Cheese`.
  - **Then**:
    - Chọn `Trân châu trắng`: `Đơn giá 1 ly` & CTA cập nhật thành `40.000đ`.
    - Chọn thêm `Kem Cheese` và `Đào miếng`: bảng kê hiển thị tổng phụ thu topping `+23.000đ`, `Đơn giá 1 ly` & CTA cập nhật thành `58.000đ`.
    - Bỏ chọn `Kem Cheese`: tổng phụ thu topping giảm còn `+13.000đ`, `Đơn giá 1 ly` & CTA cập nhật thành `48.000đ`.
- **`AC-09.3` (Cập nhật thành tiền khi tăng/giảm Số lượng trên UI và lưu vào Giỏ)**:
  - **Given** cấu hình ly đang có đơn giá đã gồm topping là `45.000đ` (`Size M` + `1 topping`).
  - **When** người dùng tăng số lượng từ `1` lên `2`, sau đó bấm nút `"Thêm vào giỏ hàng – 90.000đ"`.
  - **Then** bảng kê hiện dòng `Thành tiền (× 2): 90.000đ`, dock tổng tiền tạm tính & CTA hiển thị `90.000đ`; khi nhấn nút thêm vào giỏ, `useCartStore` ghi nhận `quantity = 2`, `estimatedUnitPrice = 45000`, `totalAmount = 90000` và hiển thị Toast `"Đã thêm vào giỏ hàng!"`.
- **`AC-09.4` (Backend tính lại giá độc lập theo Size, Topping, Số lượng & không làm tròn sai số)**:
  - **Given** các bản ghi sản phẩm, `ProductSizePrice` và `Topping` nằm trong PostgreSQL (`Decimal(12, 0)`).
  - **When** `PricingService.calculate(items)` nhận danh sách các dòng món gồm `{ productId, size, toppingIds, quantity }`.
  - **Then**:
    - Backend tự truy vấn `basePrice`, `priceAdjustment(size)`, `topping.price` từ DB (khử trùng lặp ID để không N+1 query).
    - Nếu `toppingIds` rỗng `[]` hoặc `undefined`, `toppingTotal = 0` và không truy vấn bảng `toppings`.
    - Tính chính xác `unitPrice`, `toppingTotal`, `unitPriceWithToppings`, `lineTotal` và `subtotal` dưới dạng số nguyên VNĐ không sai số làm tròn (kể cả khi `quantity = 99` và có nhiều dòng món).
    - *(Lưu ý quy ước API Order: khi `size` không được truyền vào `PricingService.calculate()`, service fallback `DEFAULT_SIZE = M` theo hợp đồng `OrdersService` và `OrderItem` trong DB).*
- **`AC-09.5` (Backend bảo vệ tính toàn vẹn giá — chống giả mạo từ Client)**:
  - **Given** một request/payload từ Client cố tình chèn hoặc sửa các trường giá (`unitPrice: 1`, `lineTotal: 1`, `subtotal: 0`, `basePrice: 0`, `price: 0`).
  - **When** `PricingService.calculate()` thực thi (trực tiếp hoặc thông qua `OrdersService.create()`).
  - **Then** Backend bỏ qua hoàn toàn mọi giá trị tiền tệ từ Client, trả về đúng kết quả tính từ giá trị gốc trong DB.
- **`AC-09.6` (Backend từ chối dữ liệu đầu vào & trạng thái DB không hợp lệ)**:
  - **Given** đầu vào gửi vào `PricingService.calculate()` chứa bất kỳ điều kiện vi phạm nào.
  - **When** kiểm tra hợp lệ đầu vào và đối chiếu dữ liệu DB.
  - **Then** Backend ném `BadRequestException` (`400 Bad Request`) trong các trường hợp:
    - Danh sách `items` rỗng hoặc không phải mảng.
    - `productId` rỗng hoặc không phải chuỗi.
    - `quantity` âm, bằng `0`, số thập phân, `NaN`, hoặc `> 99`.
    - `size` không thuộc `{S, M, L}` hoặc sản phẩm chưa cấu hình `ProductSizePrice` cho `size` đó.
    - `toppingIds` chứa giá trị rỗng, vượt quá `3` topping hoặc chứa `toppingId` trùng lặp.
    - Sản phẩm hoặc topping không tồn tại trong DB hoặc có `isAvailable = false`.

---

## 4. MA TRẬN TRUY VẾT YÊU CẦU (TRACEABILITY MATRIX)

> *Bảng truy vết ánh xạ đầy đủ từ User Story → Functional Requirement → Use-Case & Sơ đồ → UI Component → API / Backend Service → Test Case ID để phục vụ kiểm chứng và gộp vào `docs/traceability-matrix.md`.*

| User Story | Mã FR | Tên yêu cầu | Use-Case & Sơ đồ liên quan | UI Component (Frontend) | API Endpoint / Backend Service | Test Case ID & Tệp kiểm thử |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `US-07` | `FR-07` | Xem chi tiết sản phẩm (`AC-07.1`..`07.4`) | `UC-02` (Tùy biến món)<br>`docs/diagrams/class-diagram.puml` | `ProductDetailPage`<br>`ProductDetailView`<br>`ProductGallery`<br>`ProductInfo`<br>`ProductDetailErrorState` | `GET /api/v1/products/:id`<br>`ProductDetailController.getProductById()`<br>`ProductDetailService.getProductById()` | `TC-DETAIL-01` (200 OK)<br>`TC-DETAIL-02` (404)<br>`apps/web/src/app/products/[id]/page.test.tsx` |
| `US-08` | `FR-08` | Tùy biến Size, Topping & Số lượng (`AC-08.1`..`08.4`) | `UC-02` (Tùy biến món)<br>`docs/diagrams/class-diagram.puml` | `SizeSelector`<br>`ToppingSelector`<br>`QuantityStepper`<br>`useProductDetail` | `PricingService.normalizeItem()`<br>`PricingService.calculate()` | `TC-DETAIL-03` (Size S/M/L)<br>`TC-DETAIL-04` (Max 3 topping)<br>`apps/web/src/app/products/[id]/page.test.tsx`<br>`apps/api/src/modules/pricing/pricing.service.spec.ts` |
| `US-09` | `FR-09` | Tính giá tạm tính UI & Xác thực giá Backend (`AC-09.1`..`09.6`) | `UC-02` (Tùy biến món)<br>`docs/diagrams/class-diagram.puml` | `ProductPrice` (tạm tính)<br>`ProductDetailView` (CTA & dock)<br>`useCartStore.addItem()` | `PricingService.calculate()`<br>(được gọi bắt buộc bởi `OrdersService.create()` tại `POST /api/v1/orders`) | `TC-DETAIL-05` (Xác thực giá BE)<br>`apps/api/src/modules/pricing/pricing.service.spec.ts`<br>`apps/api/src/modules/pricing/pricing.service.int-spec.ts`<br>`apps/web/src/app/products/[id]/page.test.tsx` |
