# THANH TOÁN & CHỐNG TRÙNG LẶP — ĐẶC TẢ YÊU CẦU CHỨC NĂNG (FR-17..20)

> **Người phụ trách:** Nguyễn Trần Gia Kiệt\
> **Mã Task:** SP1-07 – Sprint 1\
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
  - `AC-18.1`: API `POST /api/v1/payments` bắt buộc có header `Idempotency-Key` không rỗng sau khi trim; thiếu/rỗng trả `400 Bad Request`, không tạo Payment.
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
  - `AC-19.5`: Khi chưa nhận được kết quả xác nhận, hệ thống duy trì trạng thái `PENDING` cho tới khi Backend xác minh được kết quả qua IPN hoặc fallback từ Return URL.

### 2.4. FR-20: Xác minh và xác nhận thanh toán
- **MoSCoW:** Must Have
- **Acceptance Criteria (AC):**
  - `AC-20.1`: Backend xác minh chữ ký dữ liệu VNPay bằng HMAC-SHA512 trước khi chấp nhận kết quả giao dịch.
  - `AC-20.2`: Backend tra Payment bằng `vnp_TxnRef = transactionRef = paymentId`, kiểm tra gateway `VNPAY`, đối chiếu `vnp_Amount = Payment.amount * 100` và sử dụng Order liên kết; dữ liệu lệch không đổi Payment/Order hoặc cộng loyalty.
  - `AC-20.3`: Return URL điều hướng trình duyệt về Frontend. Frontend lấy trạng thái từ Backend trước khi hiển thị kết quả cuối cùng.
  - `AC-20.4`: VNPay gửi IPN độc lập với Return URL đến Backend để xác nhận giao dịch chính thức.

---

## 3. BẢNG TRUY VẾT YÊU CẦU (TRACEABILITY TABLE)

| Mã FR | Tên yêu cầu | Use Case liên kết | Sơ đồ liên quan | Code / API Endpoint | Test Case ID |
|---|---|---|---|---|---|
| `FR-17` | Mock Gateway & VNPay Sandbox | `UC-ORD-01` | `sequence-checkout.puml`, `deployment-production.puml` | `MockGatewayService`, `VnpayGatewayService`, `POST /api/v1/payments` | `TC-PAY-01`, `TC-PAY-05`, `TC-PAY-06`, `TC-PAY-07`, `TC-PAY-15`, `TC-PAY-16` |
| `FR-18` | Idempotency-Key & IPN lặp | `UC-ORD-01` | `sequence-checkout.puml` | `PaymentsService`, `GET /api/v1/payments/vnpay/ipn` | `TC-PAY-02`, `TC-PAY-03`, `TC-PAY-04`, `TC-PAY-08` |
| `FR-19` | Lỗi, hủy, retry & giỏ hàng | `UC-ORD-01` | `sequence-checkout.puml` | `PaymentsService`, `OrderService`, `/checkout/payment`, `/payment/vnpay-return` | `TC-PAY-05`, `TC-PAY-09`, `TC-PAY-10`, `TC-PAY-17`, `TC-CART-04` |
| `FR-20` | Xác minh, Return URL & IPN | `UC-ORD-01` | `sequence-checkout.puml`, `deployment-production.puml` | `PaymentsController`, `PaymentsService.handleVnpayIpn`, `GET /api/v1/payments/:id` | `TC-PAY-08`, `TC-PAY-11`, `TC-PAY-12`, `TC-PAY-13`, `TC-PAY-14`, `TC-PAY-18` |

## 4. HIỆN TRẠNG CODE FREEZE VÀ KHOẢNG CÁCH VỚI YÊU CẦU

AC ở trên là yêu cầu và cơ sở viết test, không phải xác nhận mọi AC đã đạt.

- Backend chỉ xác nhận giao dịch thành công khi cả `vnp_ResponseCode` và `vnp_TransactionStatus` bằng `00`. HMAC hợp lệ có thể đi kèm kết quả lỗi/hủy. Chỉ cộng loyalty khi giao dịch thành công và Order đang `PENDING`.
- IPN thành công đến sau khi Order đã `CANCELLED`: Payment `SUCCESS`, ghi lý do cần hoàn tiền thủ công, giữ Order và không cộng loyalty (UC-ORD-01, Exc-10; `TC-PAY-18`).
- Callback vào `GET /api/v1/payments/vnpay/ipn`, qua `PaymentsController → PaymentsService → VnpayGatewayService` để xác minh; transaction cập nhật do PaymentsService điều phối. Handler trả `RspCode/Message`; `00` là đã xử lý thông báo, không phải luôn thanh toán thành công; IPN lặp trả `02`.
- Frontend có fallback gửi query Return URL chứa `vnp_SecureHash` tới cùng endpoint IPN trước khi gọi `GET /api/v1/payments/:paymentId` kèm JWT. Payment được đọc theo chủ sở hữu; trạng thái response là `PENDING/SUCCESS/FAILED`. Chưa có kết quả đã xác minh thì vẫn `PENDING`, kể cả đã hết số lần polling.
- Sau khi đồng bộ main, `apps/web/src/app/checkout/payment/page.tsx` giữ giỏ khi redirect VNPay; trang Return URL chỉ gọi `clearCart()` khi Backend trả Payment `SUCCESS`. AC-19.3 cần được kiểm chứng ở cả Mock và VNPay; tài liệu không coi mô tả code là bằng chứng test đã pass.
- `TransformInterceptor` hiện bọc kết quả IPN trong `data` của API envelope. Việc VNPay Sandbox nhận đúng phản hồi cần được kiểm chứng bằng smoke test; tài liệu không coi một HTTP 200 là bằng chứng tích hợp đã thành công.
