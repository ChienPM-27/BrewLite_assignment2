# THANH TOÁN & CHỐNG TRÙNG LẶP — ĐẶC TẢ YÊU CẦU CHỨC NĂNG (FR-17..20)

> **Người phụ trách:** Nguyễn Trần Gia Kiệt  
> **Mã Task:** SP1-07 – Sprint 1  
> **Dải ID:** `FR-17` đến `FR-20`

---

## 1. TỔNG QUAN

Chức năng thanh toán cho phép khách hàng thanh toán đơn hàng bằng Ví điện tử hoặc Thẻ ngân hàng thông qua VNPay Sandbox. Hệ thống sử dụng cơ chế Idempotency-Key để ngăn việc xử lý một yêu cầu thanh toán nhiều lần, đồng thời hỗ trợ xử lý giao dịch thành công, thất bại hoặc bị hủy.

Backend chịu trách nhiệm tạo yêu cầu thanh toán, quản lý thông tin giao dịch, xác minh chữ ký và xử lý kết quả trả về từ VNPay thông qua Return URL/IPN.

## 2. DANH SÁCH YÊU CẦU CHỨC NĂNG

### 2.1. FR-17: Cổng thanh toán mô phỏng và tích hợp VNPay Sandbox

- **MoSCoW:** Must Have
- **Mô tả:** Hệ thống hỗ trợ thanh toán qua Mock Gateway và VNPay Sandbox cho các phương thức Ví điện tử hoặc Thẻ ngân hàng mô phỏng.

- **Acceptance Criteria (AC):**
  - `AC-17.1`: Khách hàng có thể lựa chọn phương thức thanh toán Ví điện tử hoặc Thẻ ngân hàng.
  - `AC-17.2`: Mock Gateway hỗ trợ mô phỏng kết quả thanh toán thành công (mặc định) hoặc thất bại thông qua header `X-Mock-Outcome: FAILED`.
  - `AC-17.3`: Mock Gateway chỉ được phép sử dụng trong môi trường không phải Production.
  - `AC-17.4`: VNPay Sandbox hỗ trợ quy trình tạo yêu cầu thanh toán và chuyển hướng khách hàng đến cổng thanh toán thử nghiệm.
  - `AC-17.5`: Backend quản lý cấu hình và secret VNPay thông qua biến môi trường, không để lộ thông tin bí mật ra frontend.

### 2.2. FR-18: Cơ chế chống thanh toán lặp (Idempotency-Key Enforcement)

- **MoSCoW:** Must Have
- **Mô tả:** Hệ thống sử dụng Idempotency-Key để bảo đảm một yêu cầu thanh toán không bị xử lý trùng khi client gửi lại request do nhấn nút nhiều lần hoặc gặp lỗi mạng.
- **Acceptance Criteria (AC):**
  - `AC-18.1`: API `POST /api/v1/payments` yêu cầu header `Idempotency-Key` với giá trị UUID hợp lệ. Nếu thiếu hoặc không hợp lệ, API trả về `400 Bad Request`.
  - `AC-18.2`: Khi nhận request có cùng Idempotency-Key và cùng nội dung yêu cầu, hệ thống trả lại kết quả đã ghi nhận mà không tạo giao dịch thanh toán trùng.
  - `AC-18.3`: Khi nhận request có cùng Idempotency-Key nhưng nội dung khác nhau, hệ thống từ chối với `409 Conflict`.
  - `AC-18.4`: Hệ thống bảo đảm các request đồng thời sử dụng cùng Idempotency-Key không tạo ra nhiều giao dịch thanh toán cho cùng một yêu cầu.

### 2.3. FR-19: Xử lý thất bại và khôi phục trạng thái (Payment Failure & Recovery)

- **MoSCoW:** Must Have
- **Mô tả:** Hệ thống xử lý giao dịch thanh toán thất bại hoặc bị khách hàng hủy, đồng thời duy trì trạng thái đơn hàng và giỏ hàng phù hợp để khách hàng có thể thử thanh toán lại.
- **Acceptance Criteria (AC):**
  - `AC-19.1`: Khi giao dịch thất bại, Payment được cập nhật trạng thái `FAILED` và lưu thông tin lý do thất bại nếu có.
  - `AC-19.2`: Khi giao dịch thất bại hoặc bị hủy, Order được chuyển sang trạng thái `PAYMENT_FAILED`.
  - `AC-19.3`: Giỏ hàng phía khách hàng được giữ nguyên khi thanh toán thất bại hoặc bị hủy.
  - `AC-19.4`: Khách hàng có thể thực hiện thanh toán lại bằng một Idempotency-Key mới.
  - `AC-19.5`: Khách hàng có thể lựa chọn hủy đơn hàng theo quy tắc chuyển trạng thái của hệ thống.

### 2.4. FR-20: Xác minh và xác nhận thanh toán (Payment Confirmation)

- **MoSCoW:** Must Have
- **Mô tả:** Hệ thống xác minh kết quả giao dịch từ VNPay Sandbox trước khi cập nhật trạng thái thanh toán và xác nhận đơn hàng.
- **Acceptance Criteria (AC):**
  - `AC-20.1`: Backend xác minh chữ ký dữ liệu VNPay bằng HMAC-SHA512 trước khi chấp nhận kết quả giao dịch.
  - `AC-20.2`: Backend kiểm tra các thông tin giao dịch cần thiết, bao gồm mã giao dịch, số tiền và trạng thái thanh toán.
  - `AC-20.3`: Hệ thống xử lý Return URL để điều hướng khách hàng trở lại giao diện và hiển thị kết quả thanh toán.
  - `AC-20.4`: Hệ thống tiếp nhận và xác minh IPN từ VNPay ở phía backend trước khi cập nhật trạng thái giao dịch.
  - `AC-20.5`: Khi thanh toán thành công, Payment chuyển sang `SUCCESS`, Order chuyển sang `PAID`.
  - `AC-20.6`: Khách hàng nhận được thông tin xác nhận đơn hàng, mã tham chiếu giao dịch và thời gian xác nhận.

## 3. BẢNG TRUY VẾT YÊU CẦU (TRACEABILITY TABLE)

| Mã FR | Tên yêu cầu | Use Case liên kết | Sơ đồ liên quan | Code / API Endpoint | Test Case ID |
|---|---|---|---|---|---|
| `FR-17` | VNPay Sandbox Gateway | `UC-ORDER-PAYMENT` | `sequence-checkout.puml` | `VnpayGatewayService`, `POST /api/v1/payments` | `TC-PAY-01` |
| `FR-18` | Idempotency-Key | `UC-ORDER-PAYMENT` | `sequence-checkout.puml` | `PaymentsService.createPayment` | `TC-PAY-02` |
| `FR-19` | Xử lý lỗi và hủy thanh toán | `UC-ORDER-PAYMENT` | `sequence-checkout.puml` | `PaymentsService`, `OrderService` | `TC-PAY-03` |
| `FR-20` | Xác minh và xác nhận thanh toán | `UC-ORDER-PAYMENT` | `sequence-checkout.puml` | `VnpayGatewayService`, `PaymentsController` | `TC-PAY-04` |