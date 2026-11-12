# LỊCH SỬ ĐƠN HÀNG & THEO DÕI TRẠNG THÁI — ĐẶC TẢ YÊU CẦU CHỨC NĂNG (FR)

> **Người phụ trách**: Nguyễn Quang Huy  
> **Mã Task**: `SP1-08`  
> **Dải ID phân công**: `FR-21` đến `FR-22`  
> **Sprint**: Sprint 1 (Task 1.2)

---

## 1. TỔNG QUAN PHẠM VI CHỨC NĂNG

Cho phép khách hàng đã đăng nhập xem lại các đơn đã đặt tại BrewLite, mở chi tiết từng đơn và theo dõi trạng thái xử lý; trang chi tiết tự cập nhật mỗi 10 giây khi đơn ở `PAID`, `PREPARING` hoặc `READY`.

---

## 2. DANH SÁCH YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS)

### Bảng tổng hợp

| ID | Tên yêu cầu | MoSCoW | Mô tả ngắn | API chính |
| :-- | :-- | :-- | :-- | :-- |
| FR-21 | Xem danh sách lịch sử đơn hàng cá nhân | Must Have | Danh sách đơn của chính khách, mới nhất trước; lọc theo 1 trạng thái; phân trang | `GET /api/v1/orders/me` |
| FR-22 | Theo dõi chi tiết & trạng thái đơn hàng | Must Have | Chi tiết món, số tiền, điểm, các lần thanh toán; trang chi tiết tự cập nhật mỗi 10 giây khi đơn ở `PAID`, `PREPARING`, `READY` | `GET /api/v1/orders/:id` |

### 2.1. FR-21: Xem danh sách lịch sử đơn hàng cá nhân
- **Độ ưu tiên (MoSCoW)**: Must Have
- **Mô tả nghiệp vụ**: Khách hàng đã đăng nhập có thể xem danh sách các đơn mình đã đặt. Dữ liệu đầu vào là số trang, số đơn mỗi trang và trạng thái cần lọc, đều tùy chọn. Hệ thống trả các đơn của chính khách, đơn mới nhất trước, mỗi đơn có mã đơn, trạng thái, tổng số lượng món, số tiền và thời điểm đặt, kèm thông tin phân trang.
- **Quy tắc nghiệp vụ**:
  1. Quyền truy cập: cần header `Authorization: Bearer <JWT>`. Người dùng được xác định từ JWT; API không nhận `userId` từ query hay body. Danh sách chỉ gồm các đơn mà người dùng trong JWT là chủ đơn.
  2. Đầu vào (query): `page`, `limit`, `status`. `status` là một trong 7 giá trị `PENDING`, `PAID`, `PREPARING`, `READY`, `COMPLETED`, `PAYMENT_FAILED`, `CANCELLED`; mỗi lần gọi chỉ lọc được một trạng thái. Tham số khác (ví dụ `userId`) bị từ chối với `400 Bad Request`.
  3. Mặc định: `page = 1`, `limit = 20`; không gửi `status` thì lấy mọi trạng thái.
  4. Giới hạn: `page` là số nguyên ≥ 1; `limit` là số nguyên từ 1 đến 50. Giá trị sai kiểu hoặc ngoài giới hạn bị từ chối với `400 Bad Request`.
  5. Thứ tự và phân trang: đơn tạo sau đứng trước; hai đơn trùng thời điểm tạo thì xếp theo `id` giảm dần. `pagination` gồm `page`, `limit`, `total` (số đơn khớp bộ lọc), `totalPages` (`total / limit` làm tròn lên, bằng `0` khi không có đơn) và `hasNextPage` (`true` khi `page < totalPages`).
  6. Dữ liệu trả về: phản hồi thành công có dạng `{ success: true, statusCode, data, timestamp }` với `data = { items, pagination }`; phản hồi lỗi có dạng `{ success: false, statusCode, error, message, timestamp, path }`. Mỗi phần tử `items` gồm `id`, `orderNumber`, `status`, `totalAmount`, `discountAmount`, `finalAmount`, `createdAt` và `itemCount` (tổng `quantity` của các dòng món). Tiền là số nguyên VNĐ.
  7. Trang `/orders`: người chưa đăng nhập được chuyển tới `/auth/login?next=%2Forders`. Mỗi đơn hiển thị `#orderNumber`, nhãn trạng thái (FR-22), thời điểm đặt, số món, tổng tiền theo `finalAmount` và liên kết "Xem chi tiết". Tab lọc: "Tất cả", "Chờ thanh toán" (`PENDING`), "Đang xử lý" (`PAID`, `PREPARING`, `READY`), "Hoàn tất" (`COMPLETED`), "Đã hủy" (`CANCELLED`). Trang xin 10 đơn mỗi lần; riêng tab "Đang xử lý" xin 50 đơn mới nhất, chỉ hiển thị các đơn `PAID`, `PREPARING`, `READY` trong số đó và không phân trang.
- **Tiêu chí chấp nhận (Acceptance Criteria - AC)**:
  - `AC-21.1`: Khi khách hàng có 3 đơn tạo lần lượt lúc t1 < t2 < t3 gọi `GET /api/v1/orders/me`, hệ thống phải trả `data.items` theo thứ tự đơn tạo lúc t3, t2, t1. Mã trạng thái HTTP: `200 OK`. (Test: `TC-HIST-01`, Integration)
  - `AC-21.2`: Khi khách hàng có 1 đơn gồm 2 dòng món với `quantity` lần lượt là 2 và 1 gọi `GET /api/v1/orders/me`, hệ thống phải trả phần tử của đơn đó có các trường `id`, `orderNumber`, `status`, `totalAmount`, `discountAmount`, `finalAmount`, `createdAt` và `itemCount = 3`. Mã trạng thái HTTP: `200 OK`. (Test: `TC-HIST-02`, Integration)
  - `AC-21.3`: Khi khách hàng chưa có đơn nào gọi `GET /api/v1/orders/me`, hệ thống phải trả `data.items = []` và `data.pagination = { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false }`. Mã trạng thái HTTP: `200 OK`. (Test: `TC-HIST-03`, Integration)
  - `AC-21.4`: Khi khách hàng có 51 đơn gọi `GET /api/v1/orders/me` không kèm `page` và `limit`, hệ thống phải trả 20 đơn mới nhất và `data.pagination = { page: 1, limit: 20, total: 51, totalPages: 3, hasNextPage: true }`. Mã trạng thái HTTP: `200 OK`. (Test: `TC-HIST-04`, Integration)
  - `AC-21.5`: Khi khách hàng có 51 đơn gọi `GET /api/v1/orders/me?page=3`, hệ thống phải trả 11 đơn cũ nhất và `data.pagination = { page: 3, limit: 20, total: 51, totalPages: 3, hasNextPage: false }`. Mã trạng thái HTTP: `200 OK`. (Test: `TC-HIST-05`, Integration)
  - `AC-21.6`: Khi khách hàng có 51 đơn gọi `GET /api/v1/orders/me?limit=50` (biên trên), hệ thống phải trả 50 đơn và `data.pagination = { page: 1, limit: 50, total: 51, totalPages: 2, hasNextPage: true }`. Mã trạng thái HTTP: `200 OK`. (Test: `TC-HIST-06`, Integration)
  - `AC-21.7`: Khi khách hàng đã đăng nhập gọi `GET /api/v1/orders/me?limit=51` (vượt biên trên), hệ thống phải từ chối với mã lỗi `400 Bad Request` và `message` có thông báo về `limit`. (Test: `TC-HIST-07`, Integration)
  - `AC-21.8`: Khi khách hàng đã đăng nhập gọi `GET /api/v1/orders/me?page=0`, hệ thống phải từ chối với mã lỗi `400 Bad Request` và `message` có thông báo về `page`. (Test: `TC-HIST-08`, Integration)
  - `AC-21.9`: Khi khách hàng có 1 đơn `PENDING` và 2 đơn `COMPLETED` gọi `GET /api/v1/orders/me?status=COMPLETED`, hệ thống phải trả `data.items` gồm 2 đơn, cả hai có `status = COMPLETED`, và `data.pagination.total = 2`. Mã trạng thái HTTP: `200 OK`. (Test: `TC-HIST-09`, Integration)
  - `AC-21.10`: Khi khách hàng đã đăng nhập gọi `GET /api/v1/orders/me?status=SHIPPED` (không thuộc 7 giá trị `OrderStatus`), hệ thống phải từ chối với mã lỗi `400 Bad Request` và `message` có thông báo về `status`. (Test: `TC-HIST-10`, Integration)
  - `AC-21.11`: **Given** khách hàng A có 3 đơn và khách hàng B có 1 đơn. **When** A gọi `GET /api/v1/orders/me`. **Then** hệ thống phải trả `data.items` gồm 3 đơn của A, không có đơn của B, và `data.pagination.total = 3`. Mã trạng thái HTTP: `200 OK`. (Test: `TC-HIST-11`, Integration)
  - `AC-21.12`: Khi người dùng gọi `GET /api/v1/orders/me` không kèm header `Authorization`, hệ thống phải từ chối với mã lỗi `401 Unauthorized` và `message = "Vui lòng đăng nhập để tiếp tục"`. (Test: `TC-HIST-12`, Integration)
  - `AC-21.13`: Khi khách hàng có đơn mới nhất ở trạng thái `PAID` mở trang `/orders`, hệ thống phải hiển thị đơn đó ở vị trí đầu tiên với `#<orderNumber>`, nhãn "Đã thanh toán", "`<itemCount>` món", tổng tiền bằng `finalAmount` theo định dạng VNĐ (ví dụ `90.000đ`) và liên kết "Xem chi tiết" tới `/orders/<id>`. (Test: `TC-HIST-13`, E2E)
  - `AC-21.14`: Khi người dùng chưa đăng nhập mở trang `/orders`, hệ thống phải chuyển trình duyệt tới `/auth/login?next=%2Forders`. (Test: `TC-HIST-14`, E2E)

### 2.2. FR-22: Theo dõi chi tiết & trạng thái đơn hàng
- **Độ ưu tiên (MoSCoW)**: Must Have
- **Mô tả nghiệp vụ**: Khách hàng đã đăng nhập có thể mở một đơn của mình để xem chi tiết và theo dõi trạng thái. Dữ liệu đầu vào là mã định danh đơn (`id`). Hệ thống trả các món (size, số lượng, topping, đơn giá, thành tiền), số tiền, điểm tích lũy, thời điểm đặt và thanh toán cùng các lần thanh toán; trang chi tiết tự cập nhật trạng thái mỗi 10 giây khi đơn ở `PAID`, `PREPARING` hoặc `READY`.
- **Quy tắc nghiệp vụ**:
  1. Quyền truy cập: cần header `Authorization: Bearer <JWT>`; khách chỉ xem được đơn mà mình là chủ. Đơn không tồn tại và đơn của người khác đều bị từ chối với `404 Not Found` và cùng thông điệp "Không tìm thấy đơn hàng" (không dùng `403 Forbidden`).
  2. Đầu vào: `:id` là mã định danh đơn (`Order.id`, dạng cuid). Hệ thống không kiểm tra định dạng; mã không khớp đơn nào của khách bị từ chối với `404 Not Found`.
  3. Mặc định: `pointsEarned = 0` khi chưa cộng điểm; `paidAt = null` cho tới khi đơn chuyển sang `PAID`.
  4. Dữ liệu trả về (`data`, cùng dạng phản hồi ở FR-21): `id`, `orderNumber`, `status`, `totalAmount`, `discountAmount`, `finalAmount`, `pointsEarned`, `paidAt`, `createdAt`, `items` và `payments`. Mỗi phần tử `items` gồm `id`, `productId`, `name`, `size`, `quantity`, `unitPrice` (đã gồm phụ thu size), `lineTotal` và `toppings` (`id`, `toppingId`, `name`, `price`); giá là giá chụp lại lúc đặt. Mỗi phần tử `payments` gồm `id`, `method`, `status`, `transactionRef` (có thể `null`), `createdAt`, lần mới nhất đứng trước. API không trả lịch sử chuyển trạng thái (`statusHistory`).
  5. Nhãn trạng thái (dùng ở `/orders` và `/orders/<id>`): `PENDING` → "Chờ thanh toán", `PAID` → "Đã thanh toán", `PREPARING` → "Đang pha chế", `READY` → "Sẵn sàng nhận", `COMPLETED` → "Hoàn tất", `PAYMENT_FAILED` → "Thanh toán thất bại", `CANCELLED` → "Đã hủy".
  6. Giới hạn tự cập nhật: ở `PAID`, `PREPARING`, `READY`, trang `/orders/<id>` gọi lại API mỗi 10 giây; bỏ qua lượt gọi khi tab trình duyệt đang ẩn hoặc lượt trước chưa xong; lượt gọi lại bị lỗi thì giữ dữ liệu đang hiển thị. Ở 4 trạng thái còn lại, trang không tự gọi lại.
- **Tiêu chí chấp nhận (Acceptance Criteria - AC)**:
  - `AC-22.1`: Khi khách hàng gọi `GET /api/v1/orders/:id` cho đơn `PAID` của chính mình có 1 dòng món size `L`, `quantity = 2`, `unitPrice = 45000`, 1 topping giá `5000`, `totalAmount = 100000`, `discountAmount = 10000`, `finalAmount = 90000` và `pointsEarned = 90`, hệ thống phải trả `data` có đúng các giá trị đó, `items[0].lineTotal = 100000`, `items[0].name` là tên sản phẩm, `items[0].toppings[0].name` là tên topping và `paidAt` khác `null`. Mã trạng thái HTTP: `200 OK`. (Test: `TC-HIST-15`, Integration)
  - `AC-22.2`: Khi khách hàng gọi `GET /api/v1/orders/:id` cho đơn của chính mình có 2 lần thanh toán (lần đầu `FAILED`, lần sau `SUCCESS`), hệ thống phải trả `data.payments` gồm 2 phần tử, lần `SUCCESS` đứng trước lần `FAILED`, mỗi phần tử có `id`, `method`, `status`, `transactionRef`, `createdAt`. Mã trạng thái HTTP: `200 OK`. (Test: `TC-HIST-16`, Integration)
  - `AC-22.3`: Khi khách hàng đã đăng nhập gọi `GET /api/v1/orders/:id` với `id` không thuộc đơn nào, hệ thống phải từ chối với mã lỗi `404 Not Found` và `message = "Không tìm thấy đơn hàng"`. (Test: `TC-HIST-17`, Integration)
  - `AC-22.4`: Khi khách hàng B gọi `GET /api/v1/orders/:id` với `id` là đơn của khách hàng A, hệ thống phải từ chối với mã lỗi `404 Not Found` (không phải `403 Forbidden`), `message = "Không tìm thấy đơn hàng"` như AC-22.3 và phản hồi không có trường `data`. (Test: `TC-HIST-18`, Integration)
  - `AC-22.5`: Khi người dùng gọi `GET /api/v1/orders/:id` không kèm header `Authorization`, hệ thống phải từ chối với mã lỗi `401 Unauthorized` và `message = "Vui lòng đăng nhập để tiếp tục"`. (Test: `TC-HIST-19`, Integration)
  - `AC-22.6`: Khi trang `/orders/<id>` hiển thị đơn có `status` lần lượt là 7 giá trị `OrderStatus`, hệ thống phải hiển thị nhãn khớp quy tắc 5 cho cả 7 giá trị, ví dụ `READY` → "Sẵn sàng nhận". (Test: `TC-HIST-20`, Component)
  - `AC-22.7`: **Given** khách hàng đang mở `/orders/<id>` của đơn `PREPARING` và tab trình duyệt đang hiển thị. **When** qua 10 giây và `GET /api/v1/orders/:id` trả `status = READY`. **Then** hệ thống phải gửi lần gọi thứ hai tới `GET /api/v1/orders/:id` và đổi nhãn thành "Sẵn sàng nhận" mà không tải lại trang. (Test: `TC-HIST-21`, Component)
  - `AC-22.8`: Khi khách hàng mở `/orders/<id>` của đơn ở `PENDING`, `PAYMENT_FAILED`, `COMPLETED` hoặc `CANCELLED` và chờ quá 10 giây, hệ thống phải chỉ gọi `GET /api/v1/orders/:id` 1 lần (lần tải trang). (Test: `TC-HIST-22`, Component)

---

## 3. BẢNG TRUY VẾT YÊU CẦU (TRACEABILITY TABLE)

> *Lưu ý: Bảng này là bắt buộc ở cuối mỗi file `fr-*.md` để Quang Huy tổng hợp vào `docs/traceability-matrix.md` trong Sprint 3.*

| Mã FR | Tên yêu cầu | Use-Case liên kết | Sơ đồ liên quan | Code / API Endpoint | Test Case ID |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `FR-21` | Xem danh sách lịch sử đơn hàng cá nhân | `UC-ORD-01` (Đặt và thanh toán) | `docs/diagrams/activity-e2e.svg` | `GET /api/v1/orders/me`, trang `/orders` | `TC-HIST-01`, `TC-HIST-02`, `TC-HIST-03`, `TC-HIST-04`, `TC-HIST-05`, `TC-HIST-06`, `TC-HIST-07`, `TC-HIST-08`, `TC-HIST-09`, `TC-HIST-10`, `TC-HIST-11`, `TC-HIST-12`, `TC-HIST-13`, `TC-HIST-14` |
| `FR-22` | Theo dõi chi tiết & trạng thái đơn hàng | `UC-ORD-01` (Đặt và thanh toán) | `docs/diagrams/activity-e2e.svg`, `docs/diagrams/order-state-machine.svg` | `GET /api/v1/orders/:id`, trang `/orders/[id]` | `TC-HIST-15`, `TC-HIST-16`, `TC-HIST-17`, `TC-HIST-18`, `TC-HIST-19`, `TC-HIST-20`, `TC-HIST-21`, `TC-HIST-22` |
