# THANH TOÁN & CHỐNG TRÙNG LẶP — ĐẶC TẢ YÊU CẦU CHỨC NĂNG (FR-17..20)

> **Người phụ trách:** Nguyễn Trần Gia Kiệt  
> **Mã Task:** SP1-07 – Sprint 1  
> **Dải ID:** `FR-17` đến `FR-20`

---

## 1. TỔNG QUAN

Chức năng thanh toán cho phép khách hàng thanh toán đơn hàng thông qua hai cổng thanh toán: Mock Gateway và VNPay Sandbox.

- **Mock Gateway:** Cổng thanh toán mô phỏng nội bộ, phục vụ kiểm thử chức năng và CI. Hỗ trợ mô phỏng kết quả thành công hoặc thất bại.
- **VNPay Sandbox:** Cổng thanh toán thử nghiệm bên ngoài, hỗ trợ tạo giao dịch, chuyển hướng khách hàng đến trang thanh toán VNPay và nhận kết quả giao dịch thông qua IPN độc lập.

Backend tạo giao dịch và lưu Payment với trạng thái `PENDING`, sau đó trả về `paymentUrl` cho Frontend chuyển hướng. Return URL đưa khách về Frontend, trong khi IPN là kênh xác nhận kết quả thanh toán chính thức ở phía Backend. Hệ thống sử dụng `Idempotency-Key` để tránh xử lý trùng yêu cầu.

---

## 2. DANH SÁCH YÊU CẦU CHỨC NĂNG

### 2.1. FR-17: Cổng thanh toán mô phỏng và tích hợp VNPay Sandbox
- **MoSCoW:** Must Have
- **Acceptance Criteria (AC):**
  - `AC-17.1`: Khách hàng có thể lựa chọn phương thức thanh toán Ví điện tử hoặc Thẻ ngân hàng.
  - `AC-17.2`: Mock Gateway hỗ trợ mô phỏng kết quả thanh toán thành công hoặc thất bại thông qua header `X-Mock-Outcome: FAILED`.
  - `AC-17.3`: Mock Gateway được sử dụng linh hoạt trong môi trường kiểm thử và CI.
  - `AC-17.4`: VNPay Sandbox hỗ trợ quy trình tạo yêu cầu thanh toán và chuyển hướng khách hàng đến cổng thanh toán thử nghiệm.
  - `AC-17.5`: Khi tạo giao dịch VNPay thành công, Backend lưu Payment với trạng thái `PENDING` và trả về `paymentUrl` cho Frontend.
  - `AC-17.6`: Backend quản lý cấu hình và secret VNPay thông qua biến môi trường.

### 2.2. FR-18: Cơ chế chống thanh toán lặp (Idempotency-Key Enforcement)
- **MoSCoW:** Must Have
- **Acceptance Criteria (AC):**
  - `AC-18.1`: API `POST /api/v1/payments` hỗ trợ tiếp nhận header `Idempotency-Key` từ client.
  - `AC-18.2`: Khi nhận request có cùng Idempotency-Key và cùng nội dung, hệ thống trả lại kết quả đã ghi nhận mà không tạo giao dịch thanh toán trùng.
  - `AC-18.3`: Khi nhận request có cùng Idempotency-Key nhưng nội dung khác nhau, hệ thống trả về `409 Conflict`.
  - `AC-18.4`: Khi VNPay gửi IPN lặp cho cùng một giao dịch, Backend nhận diện và không xử lý thanh toán hoặc cộng điểm loyalty hai lần.

### 2.3. FR-19: Xử lý thất bại và khôi phục trạng thái
- **MoSCoW:** Must Have
- **Acceptance Criteria (AC):**
  - `AC-19.1`: Khi giao dịch thất bại được xác nhận, Payment cập nhật trạng thái `FAILED`.
  - `AC-19.2`: Order chuyển sang trạng thái `PAYMENT_FAILED`.
  - `AC-19.3`: Khi thanh toán thất bại hoặc bị hủy, Frontend **giữ nguyên giỏ hàng** để khách hàng có thể thử thanh toán lại.
  - `AC-19.4`: Khách hàng có thể thực hiện thanh toán lại.
  - `AC-19.5`: Khi chưa nhận được kết quả xác nhận, hệ thống duy trì trạng thái `PENDING` chờ IPN.

### 2.4. FR-20: Xác minh và xác nhận thanh toán
- **MoSCoW:** Must Have
- **Acceptance Criteria (AC):**
  - `AC-20.1`: Backend xác minh chữ ký dữ liệu VNPay bằng HMAC-SHA512 trước khi chấp nhận kết quả giao dịch.
  - `AC-20.2`: Backend kiểm tra thông tin giao dịch bao gồm mã giao dịch, số tiền và mã đơn hàng.
  - `AC-20.3`: Return URL điều hướng trình duyệt về Frontend. Frontend lấy trạng thái từ Backend trước khi hiển thị kết quả cuối cùng.
  - `AC-20.4`: VNPay gửi IPN độc lập với Return URL đến Backend để xác nhận giao dịch chính thức.

---

## 3. BẢNG TRUY VẾT YÊU CẦU (TRACEABILITY TABLE)

| Mã FR | Tên yêu cầu | Use Case liên kết | Sơ đồ liên quan | Code / API Endpoint | Test Case ID |
|---|---|---|---|---|---|
| `FR-17` | Mock Gateway & VNPay Sandbox | `UC-ORD-01` | `sequence-checkout.puml`, `deployment-production.puml` | `MockGatewayService`, `VnpayGatewayService`, `POST /api/v1/payments` | `TC-PAY-01`, `TC-PAY-07`, `TC-PAY-11` |
| `FR-18` | Idempotency-Key & Chống IPN trùng | `UC-ORD-01` | `sequence-checkout.puml` | `PaymentsService`, IPN Handler | `TC-PAY-02`, `TC-PAY-03`, `TC-PAY-04`, `TC-PAY-08` |
| `FR-19` | Xử lý lỗi, hủy & Giữ giỏ hàng | `UC-ORD-01` | `sequence-checkout.puml` | `PaymentsService`, `OrderService`, Frontend Cart | `TC-PAY-05`, `TC-PAY-09`, `TC-PAY-10`, `TC-CART-04` |
| `FR-20` | Xác minh HMAC, Return URL & IPN | `UC-ORD-01` | `sequence-checkout.puml`, `deployment-production.puml` | `VnpayGatewayService`, IPN Handler, `PaymentsController` | `TC-PAY-11`, `TC-PAY-12`, `TC-PAY-13`, `TC-PAY-14` |