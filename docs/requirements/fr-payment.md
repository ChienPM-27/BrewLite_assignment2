# THANH TOÁN & CHỐNG TRÙNG LẶP — ĐẶC TẢ YÊU CẦU CHỨC NĂNG (FR-17..20)

> **Người phụ trách:** Nguyễn Trần Gia Kiệt  
> **Mã Task:** SP1-07 – Sprint 1  
> **Dải ID:** `FR-17` đến `FR-20`

---

## 1. TỔNG QUAN

Chức năng thanh toán cho phép khách hàng thanh toán đơn hàng bằng Ví điện tử hoặc Thẻ ngân hàng thông qua hai cổng thanh toán: Mock Gateway và VNPay Sandbox.

- **Mock Gateway:** Cổng thanh toán mô phỏng, phục vụ kiểm thử chức năng và CI. Hỗ trợ mô phỏng kết quả thành công hoặc thất bại.
- **VNPay Sandbox:** Cổng thanh toán thử nghiệm bên ngoài, hỗ trợ tạo giao dịch, chuyển hướng khách hàng đến trang thanh toán VNPay và nhận kết quả giao dịch thông qua IPN.

Đối với VNPay Sandbox, Backend tạo giao dịch và lưu Payment với trạng thái `PENDING`, sau đó trả về `paymentUrl` để Frontend chuyển hướng trình duyệt của khách hàng đến VNPay. Khi khách hàng hoàn tất hoặc hủy giao dịch, VNPay gửi thông báo IPN đến Backend. Backend xác minh chữ ký và thông tin giao dịch trước khi cập nhật trạng thái Payment và Order.

Return URL chỉ có nhiệm vụ đưa khách hàng trở lại Frontend để hiển thị trạng thái giao dịch. Return URL không được sử dụng làm căn cứ duy nhất để xác nhận thanh toán thành công.

Hệ thống sử dụng cơ chế `Idempotency-Key` để ngăn việc xử lý một yêu cầu thanh toán nhiều lần, đồng thời bảo đảm IPN được xử lý an toàn khi VNPay gửi lại thông báo.

---

## 2. DANH SÁCH YÊU CẦU CHỨC NĂNG

### 2.1. FR-17: Cổng thanh toán mô phỏng và tích hợp VNPay Sandbox

- **MoSCoW:** Must Have
- **Mô tả:** Hệ thống hỗ trợ thanh toán qua Mock Gateway và VNPay Sandbox cho các phương thức Ví điện tử hoặc Thẻ ngân hàng mô phỏng.

**Acceptance Criteria (AC):**

- `AC-17.1`: Khách hàng có thể lựa chọn phương thức thanh toán Ví điện tử hoặc Thẻ ngân hàng.
- `AC-17.2`: Mock Gateway hỗ trợ mô phỏng kết quả thanh toán thành công (mặc định) hoặc thất bại thông qua header `X-Mock-Outcome: FAILED`.
- `AC-17.3`: Mock Gateway chỉ được phép sử dụng trong môi trường không phải Production.
- `AC-17.4`: VNPay Sandbox hỗ trợ quy trình tạo yêu cầu thanh toán và chuyển hướng khách hàng đến cổng thanh toán thử nghiệm.
- `AC-17.5`: Khi tạo giao dịch VNPay thành công, Backend lưu Payment với trạng thái `PENDING` và trả về `paymentUrl` cho Frontend.
- `AC-17.6`: Backend quản lý cấu hình và secret VNPay thông qua biến môi trường; không để lộ thông tin bí mật ra Frontend.
- `AC-17.7`: Phương thức thanh toán (`E_WALLET`, `BANK_CARD`) được quản lý độc lập với cổng xử lý giao dịch (Mock Gateway hoặc VNPay Sandbox).

### 2.2. FR-18: Cơ chế chống thanh toán lặp (Idempotency-Key Enforcement)

- **MoSCoW:** Must Have
- **Mô tả:** Hệ thống sử dụng Idempotency-Key để bảo đảm một yêu cầu thanh toán không bị xử lý trùng khi client gửi lại request do nhấn nút nhiều lần hoặc gặp lỗi mạng.

**Acceptance Criteria (AC):**

- `AC-18.1`: API `POST /api/v1/payments` yêu cầu header `Idempotency-Key` với giá trị UUID hợp lệ. Nếu thiếu hoặc không hợp lệ, API trả về `400 Bad Request`.
- `AC-18.2`: Khi nhận request có cùng Idempotency-Key và cùng nội dung yêu cầu, hệ thống trả lại kết quả đã ghi nhận mà không tạo giao dịch thanh toán trùng.
- `AC-18.3`: Khi nhận request có cùng Idempotency-Key nhưng nội dung khác nhau, hệ thống từ chối với `409 Conflict`.
- `AC-18.4`: Hệ thống bảo đảm các request đồng thời sử dụng cùng Idempotency-Key không tạo ra nhiều giao dịch thanh toán cho cùng một yêu cầu.
- `AC-18.5`: Khi VNPay gửi IPN lặp cho cùng một giao dịch, Backend không được cập nhật trạng thái hoặc thực hiện nghiệp vụ cộng điểm thưởng nhiều lần.
- `AC-18.6`: Khi khách hàng chủ động thử thanh toán lại sau khi giao dịch trước đã được xác nhận thất bại, yêu cầu mới phải sử dụng Idempotency-Key mới.

### 2.3. FR-19: Xử lý thất bại và khôi phục trạng thái (Payment Failure & Recovery)

- **MoSCoW:** Must Have
- **Mô tả:** Hệ thống xử lý giao dịch thanh toán thất bại hoặc bị khách hàng hủy, đồng thời duy trì trạng thái đơn hàng và giỏ hàng phù hợp để khách hàng có thể thử thanh toán lại.

**Acceptance Criteria (AC):**

- `AC-19.1`: Khi giao dịch thất bại được xác nhận, Payment được cập nhật trạng thái `FAILED` và lưu thông tin lý do thất bại nếu có.
- `AC-19.2`: Khi giao dịch thất bại hoặc bị hủy được xác nhận, Order được chuyển sang trạng thái `PAYMENT_FAILED` theo quy tắc chuyển trạng thái của hệ thống.
- `AC-19.3`: Giỏ hàng phía khách hàng được giữ nguyên khi thanh toán thất bại hoặc bị hủy.
- `AC-19.4`: Khách hàng có thể thực hiện thanh toán lại bằng một Idempotency-Key mới.
- `AC-19.5`: Khách hàng có thể lựa chọn hủy đơn hàng theo quy tắc chuyển trạng thái của hệ thống.
- `AC-19.6`: Khi không nhận được kết quả xác nhận do timeout hoặc lỗi kết nối, hệ thống giữ giao dịch ở trạng thái `PENDING` để chờ xác minh; không tự động kết luận giao dịch thất bại chỉ dựa trên timeout.

### 2.4. FR-20: Xác minh và xác nhận thanh toán (Payment Confirmation)

- **MoSCoW:** Must Have
- **Mô tả:** Hệ thống xác minh kết quả giao dịch từ VNPay Sandbox trước khi cập nhật trạng thái thanh toán và xác nhận đơn hàng. IPN là kênh xác nhận giao dịch chính thức ở phía Backend.

**Acceptance Criteria (AC):**

- `AC-20.1`: Backend xác minh chữ ký dữ liệu VNPay bằng HMAC-SHA512 trước khi chấp nhận kết quả giao dịch.
- `AC-20.2`: Backend kiểm tra các thông tin giao dịch cần thiết, bao gồm mã giao dịch, số tiền, mã đơn hàng và trạng thái thanh toán.
- `AC-20.3`: Return URL đưa khách hàng trở lại Frontend để hiển thị trạng thái giao dịch; Frontend không được tự xác nhận thanh toán thành công chỉ dựa trên tham số URL.
- `AC-20.4`: Backend tiếp nhận và xác minh IPN từ VNPay trước khi cập nhật trạng thái giao dịch.
- `AC-20.5`: Khi IPN hợp lệ xác nhận thanh toán thành công, Payment chuyển sang `SUCCESS`, Order chuyển sang `PAID`.
- `AC-20.6`: Khi IPN hợp lệ xác nhận thanh toán thất bại hoặc bị hủy, Payment chuyển sang `FAILED` và Order được xử lý theo quy tắc trạng thái thanh toán thất bại.
- `AC-20.7`: IPN có chữ ký không hợp lệ hoặc thông tin giao dịch không khớp phải bị từ chối; không được cập nhật trạng thái thanh toán.
- `AC-20.8`: Khi thanh toán thành công, khách hàng nhận được thông tin xác nhận đơn hàng, mã tham chiếu giao dịch và thời gian xác nhận.
- `AC-20.9`: Backend chỉ thực hiện nghiệp vụ sau thanh toán, bao gồm xác nhận đơn hàng và cộng điểm thưởng, sau khi kết quả thành công được xác minh.

---

## 3. BẢNG TRUY VẾT YÊU CẦU (TRACEABILITY TABLE)

| Mã FR | Tên yêu cầu | Use Case liên kết | Sơ đồ liên quan | Code / API Endpoint | Test Case ID |
|---|---|---|---|---|---|
| `FR-17` | Mock Gateway và VNPay Sandbox | `UC-ORDER-PAYMENT` | `sequence-checkout.puml`, `deployment-production.puml` | `MockGatewayService`, `VnpayGatewayService`, `POST /api/v1/payments` | `TC-PAY-01` |
| `FR-18` | Idempotency-Key và chống IPN trùng | `UC-ORDER-PAYMENT` | `sequence-checkout.puml` | `PaymentsService.createPayment`, IPN Handler | `TC-PAY-02`, `TC-PAY-06` |
| `FR-19` | Xử lý lỗi, hủy và thử thanh toán lại | `UC-ORDER-PAYMENT` | `sequence-checkout.puml` | `PaymentsService`, `OrderService` | `TC-PAY-03` |
| `FR-20` | Xác minh và xác nhận thanh toán | `UC-ORDER-PAYMENT` | `sequence-checkout.puml`, `deployment-production.puml` | `VnpayGatewayService`, IPN Handler, `PaymentsController` | `TC-PAY-04`, `TC-PAY-05` |