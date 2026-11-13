# ADR-005: Cổng Thanh Toán Mô Phỏng, VNPay Sandbox và Cơ Chế Chống Trừ Tiền Trùng Lặp (Idempotency-Key)

> **Trạng thái**: Accepted (Đã cập nhật theo phản hồi thực tế code)\
> **Người đề xuất**: Nguyễn Trần Gia Kiệt  
> **Người duyệt**: Minh Chiến  
> **Phạm vi áp dụng**: `apps/api/src/modules/payments`

---

## 1. BỐI CẢNH & VẤN ĐỀ

Trong môi trường kiểm thử và triển khai Assignment 2, việc tích hợp cổng thanh toán VNPay Sandbox có thể phụ thuộc vào đường truyền Internet, cấu hình tunnel (ngrok/Cloudflare Tunnel), tài khoản Sandbox và thông tin xác thực Merchant.

Nếu chỉ sử dụng VNPay Sandbox, quá trình kiểm thử tự động có thể bị ảnh hưởng bởi sự cố mạng hoặc dịch vụ bên ngoài. Ngược lại, chỉ sử dụng Mock Gateway thì chưa đủ để kiểm thử quy trình tích hợp thanh toán qua redirect URL, Return URL và IPN.

Đồng thời, lỗi mạng hoặc việc khách hàng gửi yêu cầu thanh toán nhiều lần có thể dẫn đến tạo giao dịch trùng lặp (duplicate payment) hoặc xử lý IPN lặp lại nhiều lần.

Vì vậy, hệ thống duy trì Mock Gateway để kiểm thử độc lập, bổ sung VNPay Sandbox để kiểm thử tích hợp, đồng thời áp dụng cơ chế `Idempotency-Key` cùng IPN độc lập nhằm đảm bảo an toàn giao dịch.

## 2. QUYẾT ĐỊNH

### 2.1. Mock Payment Gateway

Hiện thực cổng thanh toán mô phỏng nội bộ thông qua `MockGatewayService`.

- Mặc định trả về kết quả thanh toán thành công.
- Hỗ trợ giả lập thất bại thông qua header `X-Mock-Outcome: FAILED` khi `NODE_ENV !== 'production'`; production bỏ qua header giả lập. Code không cấm gateway `MOCK` trên production.
- Tiếp tục sử dụng Mock Gateway cho kiểm thử độc lập và kiểm thử tự động trên CI.
- Không phụ thuộc vào tài khoản Merchant hoặc dịch vụ thanh toán bên ngoài.

### 2.2. VNPay Sandbox Gateway

Bổ sung VNPay Sandbox để kiểm thử quy trình tích hợp thanh toán bên ngoài mà không thay thế Mock Gateway.

Quy trình xử lý:

1. Backend tiếp nhận yêu cầu thanh toán và kiểm tra thông tin đơn hàng.
2. Backend tạo bản ghi Payment với trạng thái `PENDING`.
3. Backend tạo URL thanh toán VNPay và trả về Frontend.
4. Frontend chuyển khách hàng đến trang thanh toán VNPay Sandbox.
5. Sau khi khách hàng thực hiện thanh toán:
   - VNPay chuyển trình duyệt khách hàng về Return URL (đưa khách về Frontend).
   - VNPay gửi thông báo giao dịch độc lập đến Backend thông qua IPN URL.
6. Backend xác minh chữ ký HMAC-SHA512 và đối chiếu thông tin giao dịch trước khi cập nhật trạng thái.
7. Backend cập nhật Payment và Order theo kết quả giao dịch đã xác minh.

**Quy tắc xử lý Return URL và IPN:**

- IPN server-to-server vào `GET /api/v1/payments/vnpay/ipn`, qua `PaymentsController` và `PaymentsService.handleVnpayIpn()`. `VnpayGatewayService` chỉ tạo URL và xác minh chữ ký; PaymentsService điều phối transaction, OrderService và LoyaltyService.
- Return URL điều hướng về `/payment/vnpay-return`. Theo code freeze, nếu query có `vnp_SecureHash`, Frontend gửi nguyên query tới cùng endpoint IPN như fallback trước mỗi lần tra trạng thái. Backend vẫn xác minh chữ ký/thông tin giao dịch; Frontend không tự quyết định SUCCESS từ query.
- Frontend đọc `GET /api/v1/payments/:paymentId` kèm JWT, kiểm tra chủ sở hữu. `vnp_TxnRef` là paymentId; response là `Payment.status = PENDING | SUCCESS | FAILED`, không phải Order.status.
- Lần đầu và tối đa 10 lần hỏi lại, cách nhau 2,5 giây khi PENDING. Nếu chưa có kết quả xác minh qua IPN/fallback thì Payment tiếp tục PENDING; hết số lần polling không tự xác nhận thành công/thất bại.
- HMAC và số tiền hợp lệ chưa đồng nghĩa giao dịch thành công. Chỉ `vnp_ResponseCode === '00' && vnp_TransactionStatus === '00'` xác nhận Payment SUCCESS; mã kết quả khác cập nhật FAILED.
- Order đang PENDING: kết quả thành công → PAID và cộng loyalty; lỗi/hủy → PAYMENT_FAILED, không cộng loyalty. Order không còn PENDING: giữ Order và không cộng loyalty; giao dịch thành công đến muộn được ghi cần hoàn tiền thủ công (UC-ORD-01, Exc-10).
- IPN lặp được chặn bằng trạng thái Payment và `updateMany(... status: PENDING)`; lần đã xử lý trả RspCode 02, không cập nhật Order/cộng điểm lần hai.

**Kết quả handler IPN:**

| RspCode | Ý nghĩa |
|---|---|
| `00` | Thông báo đã xử lý; Payment có thể SUCCESS hoặc FAILED tùy mã giao dịch |
| `01` | Không tìm thấy Payment VNPAY theo transactionRef |
| `02` | Payment đã xác nhận hoặc IPN khác đã cập nhật trước |
| `04` | Số tiền sai định dạng/không khớp |
| `97` | Chữ ký không hợp lệ |
| `99` | Trường dữ liệu bắt buộc sai định dạng |

Đây là mã nghiệp vụ do handler trả, không phải HTTP status. Endpoint GET mặc định trả HTTP 200 cho các object trên; `TransformInterceptor` bọc chúng trong `data` của API envelope. Cần smoke test xác nhận khả năng tương thích của response này với VNPay Sandbox.

**Cấu hình môi trường VNPay Sandbox:**

Các thông tin tích hợp được quản lý bằng biến môi trường Backend:

- `VNPAY_URL`
- `VNPAY_TMN_CODE`
- `VNPAY_HASH_SECRET`
- `VNPAY_RETURN_URL`

`VNPAY_HASH_SECRET` được lưu bảo mật tại Backend, không đưa vào Frontend.

### 2.3. Idempotency-Key

Hệ thống hỗ trợ tiếp nhận header `Idempotency-Key` từ phía Client khi gọi API thanh toán.

- Lưu trữ bản ghi thanh toán kèm hash của request body để kiểm tra tính nhất quán của yêu cầu.
- Nếu nhận request trùng key và trùng body: trả về kết quả đã lưu mà không tạo Payment mới.
- Nếu nhận request trùng key nhưng khác body: trả về lỗi `409 Conflict`.
- Header bắt buộc không rỗng sau trim; không có kiểm tra định dạng UUID tại service.
- Khi retry sau khi giao dịch đã được xác nhận thất bại, Client sử dụng Idempotency-Key mới; OrderService chuyển PAYMENT_FAILED → PENDING trong transaction, không trừ kho lần nữa.
- Nếu VNPay đã có Payment PENDING có paymentUrl và tuổi dưới 15 phút, service trả lại Payment/URL đó. Payment PENDING hết hạn được đánh dấu FAILED trước khi tạo payment mới.

## 3. HỆ QUẢ

### Ưu điểm

- **Tính độc lập trong kiểm thử**: Duy trì khả năng kiểm thử độc lập bằng Mock Gateway, giúp chạy CI/CD mượt mà mà không bị nghẽn hay phụ thuộc vào dịch vụ cổng thanh toán bên ngoài.
- **Kiểm thử tích hợp thực tế**: Cho phép kiểm thử trọn vẹn quy trình redirect, Return URL và IPN callback với VNPay Sandbox.
- **Độ tin cậy và chống trùng lặp cao**: Ngăn chặn tình trạng người dùng bấm đúp nút thanh toán hoặc lỗi mạng gửi request nhiều lần nhờ cơ chế `Idempotency-Key`.
- **Bảo mật thông tin**: Bảo vệ tuyệt đối `VNPAY_HASH_SECRET` ở tầng Backend, đồng thời xác thực toàn bộ chữ ký HMAC trước khi ghi nhận tiền vào hệ thống.
- **Khả năng phục hồi (Resilience)**: Xác minh tại Backend cho cả IPN server-to-server và fallback query Return URL, sau đó Frontend đọc trạng thái, giúp hệ thống an toàn trước các trường hợp rớt mạng hoặc IPN gọi lặp.

### Hạn chế & Thách thức

- **Phụ thuộc hạ tầng bên ngoài**: VNPay Sandbox yêu cầu kết nối Internet ổn định và thông tin cấu hình Merchant hợp lệ từ nhà cung cấp.
- **Khó khăn khi debug môi trường Local**: Việc kiểm thử IPN trực tiếp trên máy cá nhân đòi hỏi phải sử dụng các công cụ tunnel (ngrok, Cloudflare Tunnel) để cung cấp URL public cho VNPay gọi về.
- **Độ trễ đồng bộ trạng thái**: Cần cơ chế xử lý các trường hợp IPN gửi chậm, gửi lặp hoặc khi khách hàng tắt trình duyệt trước khi Return URL kịp phản hồi, đòi hỏi Backend phải duy trì trạng thái `PENDING` hợp lý.
- **Giới hạn phạm vi**: Không tích hợp thanh toán bằng tài khoản/thẻ ngân hàng thật trong phạm vi Assignment 2; VNPay chỉ được khai thác ở môi trường Sandbox theo yêu cầu đề bài.

### Hiện trạng giỏ hàng ở code freeze

Sau khi đồng bộ main, Frontend `apps/web/src/app/checkout/payment/page.tsx` giữ giỏ trước redirect VNPay. `/payment/vnpay-return` chỉ xóa giỏ khi Backend trả Payment SUCCESS; FAILED/hủy giữ giỏ để thử lại. Giữ nguyên AC-19.3 và expected result của test; mô tả code không thay thế bằng chứng test đã chạy.
