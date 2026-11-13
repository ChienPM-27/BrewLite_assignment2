# ADR-005: Cổng Thanh Toán Mô Phỏng, VNPay Sandbox và Cơ Chế Chống Trừ Tiền Trùng Lặp (Idempotency-Key)

> **Trạng thái**: Accepted (Đã cập nhật theo phản hồi thực tế code)  
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
- Hỗ trợ giả lập thất bại thông qua header `X-Mock-Outcome: FAILED`.
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

- IPN là nguồn xác nhận kết quả giao dịch chính thức tại Backend.
- Return URL chỉ phục vụ điều hướng khách hàng về Frontend; Frontend không tự xác nhận thành công mà dựa vào trạng thái từ Backend.
- Nếu chưa nhận được IPN, Payment tiếp tục ở trạng thái `PENDING` chờ xác minh.
- IPN gửi lặp (duplicate IPN) phải được nhận diện và bỏ qua, không thực hiện xử lý thanh toán hay cộng điểm Loyalty nhiều lần.

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
- Khi retry sau khi giao dịch đã được xác nhận thất bại, Client sử dụng Idempotency-Key mới.

## 3. HỆ QUẢ

### Ưu điểm

- **Tính độc lập trong kiểm thử**: Duy trì khả năng kiểm thử độc lập bằng Mock Gateway, giúp chạy CI/CD mượt mà mà không bị nghẽn hay phụ thuộc vào dịch vụ cổng thanh toán bên ngoài.
- **Kiểm thử tích hợp thực tế**: Cho phép kiểm thử trọn vẹn quy trình redirect, Return URL và IPN callback với VNPay Sandbox.
- **Độ tin cậy và chống trùng lặp cao**: Ngăn chặn tình trạng người dùng bấm đúp nút thanh toán hoặc lỗi mạng gửi request nhiều lần nhờ cơ chế `Idempotency-Key`.
- **Bảo mật thông tin**: Bảo vệ tuyệt đối `VNPAY_HASH_SECRET` ở tầng Backend, đồng thời xác thực toàn bộ chữ ký HMAC trước khi ghi nhận tiền vào hệ thống.
- **Khả năng phục hồi (Resilience)**: Phân tách rõ ràng giữa Return URL (chỉ để hiển thị UI) và IPN (xác thực nghiệp vụ server-to-server), giúp hệ thống an toàn trước các trường hợp rớt mạng hoặc IPN gọi lặp.

### Hạn chế & Thách thức

- **Phụ thuộc hạ tầng bên ngoài**: VNPay Sandbox yêu cầu kết nối Internet ổn định và thông tin cấu hình Merchant hợp lệ từ nhà cung cấp.
- **Khó khăn khi debug môi trường Local**: Việc kiểm thử IPN trực tiếp trên máy cá nhân đòi hỏi phải sử dụng các công cụ tunnel (ngrok, Cloudflare Tunnel) để cung cấp URL public cho VNPay gọi về.
- **Độ trễ đồng bộ trạng thái**: Cần cơ chế xử lý các trường hợp IPN gửi chậm, gửi lặp hoặc khi khách hàng tắt trình duyệt trước khi Return URL kịp phản hồi, đòi hỏi Backend phải duy trì trạng thái `PENDING` hợp lý.
- **Giới hạn phạm vi**: Không tích hợp thanh toán bằng tài khoản/thẻ ngân hàng thật trong phạm vi Assignment 2; VNPay chỉ được khai thác ở môi trường Sandbox theo yêu cầu đề bài.