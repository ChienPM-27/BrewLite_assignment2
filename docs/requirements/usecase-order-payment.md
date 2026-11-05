# ĐẶC TẢ USE-CASE TRỌNG TÂM: ĐẶT VÀ THANH TOÁN (TASK 1.3)

> **Mã Use-Case**: `UC-ORDER-PAYMENT` (Task 1.3 theo đề bài)  
> **Người phụ trách**: Tôn Thất Hạnh  
> **FR liên kết**: `FR-01`, `FR-02`, `FR-03`, `FR-10`, `FR-11`, `FR-12`, `FR-13`, `FR-14`, `FR-15`, `FR-16`, `FR-17`, `FR-18`, `FR-19`, `FR-20`  
> **Sơ đồ liên quan**: `docs/diagrams/sequence-checkout.puml`, `docs/diagrams/order-state-machine.puml`

---

## 1. THÔNG TIN CƠ BẢN
- **Tác nhân (Actors)**: Khách hàng (Customer), Hệ thống BrewLite API, Cổng thanh toán (Payment Gateway).
- **Mục tiêu (Goal)**: Khách hàng chuyển các món trong giỏ hàng thành đơn hàng chính thức và thanh toán thành công không tiền mặt.
- **Trigger**: Khách hàng nhấn nút "Thanh toán ngay" trên trang Checkout.
- **Tiền điều kiện (Pre-conditions)**:
  - Khách hàng đã đăng nhập (sở hữu JWT Token hợp lệ).
  - Giỏ hàng có ít nhất 1 món hợp lệ.
- **Hậu điều kiện (Post-conditions)**:
  - Đơn hàng chuyển sang trạng thái `PAID`.
  - Tồn kho nguyên liệu bị trừ tương ứng.
  - Khách hàng nhận được điểm thưởng loyalty.
  - Giỏ hàng phía client được làm sạch.

---

## 2. CÁC LUỒNG SỰ KIỆN (FLOW OF EVENTS)

### 2.1. Luồng chính (Main Flow - Sunny Day)
1. Khách hàng xem lại giỏ hàng và nhập/chọn mã khuyến mãi (nếu có).
2. Khách hàng nhấn "Xác nhận đặt hàng".
3. Client gửi request `POST /api/v1/orders` kèm giỏ hàng và chữ ký giỏ hàng `computeCartSignature`.
4. API xác thực token JWT, kiểm tra tồn kho nguyên liệu của từng món trong DB.
5. API tính toán lại đơn giá, tạo bản ghi `Order` ở trạng thái `PENDING` và trừ tồn kho nguyên liệu trong 1 Transaction.
6. Client nhận mã `orderId` và gửi request `POST /api/v1/payments` kèm header `Idempotency-Key` (UUID) và phương thức thanh toán.
7. Cổng thanh toán (Mock Gateway) xử lý giao dịch.
8. Giao dịch thành công: API cập nhật `Payment` sang `SUCCESS`, gọi `OrderService.transition(orderId, PAID)`.
9. API cộng điểm thưởng Loyalty cho khách hàng.
10. Client nhận phản hồi thành công, làm sạch giỏ hàng và điều hướng sang trang xác nhận đơn hàng (`/orders/:id`).

### 2.2. Luồng thay thế (Alternative Flows)
- **Alt-1: Khách hàng gửi lại yêu cầu thanh toán (Idempotency Replay)**:
  - Khách hàng bị lag mạng hoặc nhấn đúp nút thanh toán.
  - API phát hiện `Idempotency-Key` đã tồn tại và request hash trùng khớp.
  - API không tạo bản ghi mới mà trả về kết quả đã lưu trước đó mà không trừ tiền 2 lần.

### 2.3. Luồng ngoại lệ (Exception Flows)
- **Exc-1: Nguyên liệu trong kho không đủ**:
  - Tại bước 4, API phát hiện có nguyên liệu thiếu.
  - Trả về `400 Bad Request` kèm thông điệp nguyên liệu hết. Hủy tạo đơn.
- **Exc-2: Thanh toán thất bại**:
  - Tại bước 7, Cổng thanh toán trả về lỗi (hoặc test với header `X-Mock-Outcome: FAILED`).
  - API cập nhật `Payment` sang `FAILED`, chuyển đơn hàng sang `PAYMENT_FAILED`.
  - Client nhận thông báo lỗi, **GIỮ NGUYÊN GIỎ HÀNG**, cho phép khách hàng nhấn "Thử lại thanh toán" với Idempotency-Key mới.

---

## 3. ÁNH XẠ TIÊU CHÍ KIỂM THỬ (AC TO TEST MAPPING)
- `AC-UCOP-01`: Đặt và thanh toán thành công ➔ Test ID: `TC-E2E-01`
- `AC-UCOP-02`: Đặt hàng khi hết nguyên liệu bị từ chối ➔ Test ID: `TC-ORDER-STOCK-01`
- `AC-UCOP-03`: Thanh toán thất bại giữ nguyên giỏ hàng ➔ Test ID: `TC-PAYMENT-FAIL-01`
- `AC-UCOP-04`: Gửi lại cùng Idempotency-Key không tạo payment trùng ➔ Test ID: `TC-PAYMENT-IDEMP-01`
