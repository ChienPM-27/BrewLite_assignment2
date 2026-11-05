# THANH TOÁN & CHỐNG TRÙNG LẶP — ĐẶC TẢ YÊU CẦU CHỨC NĂNG (FR-17..20)

> **Người phụ trách**: Nguyễn Trần Gia Kiệt  
> **Mã Task**: `SP1-07` (Task 1.2)  
> **Dải ID**: `FR-17` đến `FR-20`

---

## 1. TỔNG QUAN
Cung cấp khả năng thanh toán không dùng tiền mặt qua cổng thanh toán mô phỏng (Mock Gateway) cho môi trường kiểm thử và production, bảo đảm tính bất biến với cơ chế chống trừ tiền 2 lần (Idempotency-Key).

---

## 2. DANH SÁCH YÊU CẦU CHỨC NĂNG

### 2.1. FR-17: Cổng thanh toán mô phỏng (Mock Payment Gateway)
- **MoSCoW**: Must Have
- **Acceptance Criteria (AC)**:
  - `AC-17.1`: Hỗ trợ phương thức thanh toán thẻ ATM / Ví điện tử mô phỏng.
  - `AC-17.2`: Cho phép mô phỏng thanh toán thành công (mặc định) và thanh toán thất bại qua header `X-Mock-Outcome: FAILED`.

### 2.2. FR-18: Cơ chế chống thanh toán lặp (Idempotency-Key Enforcement)
- **MoSCoW**: Must Have
- **Acceptance Criteria (AC)**:
  - `AC-18.1`: API `POST /api/v1/payments` bắt buộc có header `Idempotency-Key` (chuẩn UUID). Nếu thiếu, trả về `400 Bad Request`.
  - `AC-18.2`: Khi gửi liên tiếp nhiều request cùng `Idempotency-Key` và cùng body, hệ thống chỉ tạo đúng 1 bản ghi thanh toán, không trừ tiền nhiều lần (replay cached response).
  - `AC-18.3`: Nếu cùng `Idempotency-Key` nhưng body khác nhau (sai lệch số tiền/phương thức), hệ thống từ chối với `409 Conflict`.

### 2.3. FR-19: Xử lý thất bại & Khôi phục trạng thái (Payment Failure & Recovery)
- **MoSCoW**: Must Have
- **Acceptance Criteria (AC)**:
  - `AC-19.1`: Khi giao dịch thất bại, bản ghi Payment lưu trạng thái `FAILED` kèm lý do lỗi.
  - `AC-19.2`: Đơn hàng chuyển sang `PAYMENT_FAILED`. Cho phép khách hàng thực hiện thanh toán lại hoặc hủy đơn.

### 2.4. FR-20: Xác nhận thanh toán & Hoàn tất đơn hàng (Payment Confirmation)
- **MoSCoW**: Must Have
- **Acceptance Criteria (AC)**:
  - `AC-20.1`: Thanh toán thành công cập nhật Payment sang `SUCCESS`, Order sang `PAID`.
  - `AC-20.2`: Khách hàng nhận được mã tham chiếu giao dịch và thời gian xác nhận.

---

## 3. BẢNG TRUY VẾT YÊU CẦU (TRACEABILITY TABLE)

| Mã FR | Tên yêu cầu | Use-Case liên kết | Sơ đồ liên quan | Code / API Endpoint | Test Case ID |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `FR-17` | Cổng thanh toán Mock | `UC-04` (Đặt và thanh toán) | `docs/diagrams/sequence-checkout.puml` | `MockGatewayService` | `TC-PAY-01` |
| `FR-18` | Idempotency-Key | `UC-04` (Đặt và thanh toán) | `docs/diagrams/sequence-checkout.puml` | `PaymentsService.createPayment` | `TC-PAY-02` |
| `FR-19` | Xử lý lỗi thanh toán | `UC-04` (Đặt và thanh toán) | `docs/diagrams/activity-e2e.puml` | `PaymentsService` | `TC-PAY-03` |
| `FR-20` | Xác nhận đơn hàng | `UC-04` (Đặt và thanh toán) | `docs/diagrams/sequence-checkout.puml` | `PaymentsController` | `TC-PAY-04` |
