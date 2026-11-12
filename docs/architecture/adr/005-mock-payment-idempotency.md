# ADR-005: Cổng Thanh Toán Mô Phỏng, VNPay Sandbox & Cơ Chế Chống Trừ Tiền Trùng Lặp (Idempotency-Key)

> **Trạng thái**: Accepted  
> **Người đề xuất**: Nguyễn Trần Gia Kiệt  
> **Người duyệt**: Minh Chiến  
> **Phạm vi áp dụng**: `apps/api/src/modules/payments`

---

## 1. BỐI CẢNH & VẤN ĐỀ
Trong môi trường kiểm thử và triển khai Assignment 2, việc tích hợp cổng thanh toán bên ngoài như VNPay có thể phụ thuộc vào đường truyền Internet, cấu hình tunnel (ngrok/Cloudflare Tunnel), tài khoản Sandbox và thông tin xác thực Merchant.

Nếu chỉ sử dụng cổng thanh toán thật hoặc Sandbox, quá trình kiểm thử tự động có thể bị ảnh hưởng bởi sự cố mạng hoặc dịch vụ bên ngoài. Ngược lại, chỉ sử dụng Mock Gateway thì chưa đủ để kiểm thử quy trình tích hợp thanh toán qua redirect URL, Return URL và IPN.

Đồng thời, lỗi mạng hoặc việc khách hàng gửi yêu cầu thanh toán nhiều lần có thể dẫn đến tạo giao dịch trùng lặp (duplicate payment).

Vì vậy, hệ thống cần duy trì Mock Gateway để kiểm thử độc lập, bổ sung VNPay Sandbox để kiểm thử tích hợp và áp dụng cơ chế Idempotency-Key để hạn chế xử lý yêu cầu thanh toán trùng lặp.

## 2. QUYẾT ĐỊNH
### 2.1. Mock Payment Gateway
Hiện thực cổng thanh toán mô phỏng nội bộ thông qua `MockGatewayService`.

- Mặc định trả về kết quả thanh toán thành công.
- Hỗ trợ giả lập thất bại thông qua header `X-Mock-Outcome: FAILED`.
- Chỉ sử dụng trong môi trường Development và Testing/CI.
- Không cho phép sử dụng Mock Gateway trong Production.
- Không phụ thuộc vào tài khoản Merchant hoặc dịch vụ thanh toán bên ngoài.

### 2.2. VNPay Sandbox Gateway
Bổ sung VNPay Sandbox để kiểm thử quy trình tích hợp thanh toán bên ngoài mà không thay thế Mock Gateway.

Quy trình xử lý:

1. Backend tiếp nhận yêu cầu thanh toán và kiểm tra thông tin đơn hàng.
2. Backend tạo bản ghi Payment với trạng thái `PENDING`.
3. Backend tạo URL thanh toán VNPay và trả về Frontend.
4. Frontend chuyển khách hàng đến trang thanh toán VNPay Sandbox.
5. Sau khi khách hàng thực hiện thanh toán, VNPay chuyển trình duyệt về Return URL và gửi thông báo giao dịch đến Backend thông qua IPN.
6. Backend xác minh chữ ký HMAC-SHA512, mã giao dịch, mã đơn hàng và số tiền trước khi xác nhận kết quả.
7. Backend cập nhật trạng thái Payment và Order theo kết quả giao dịch đã xác minh.

**Quy tắc xác nhận giao dịch:**
- IPN là nguồn xác nhận kết quả giao dịch tại Backend.
- Return URL chỉ phục vụ điều hướng khách hàng về Frontend và hiển thị trạng thái.
- Không xác nhận thanh toán thành công chỉ dựa vào tham số Return URL.
- Nếu chưa nhận được IPN hoặc chưa xác minh được kết quả, Payment tiếp tục ở trạng thái `PENDING`.
- IPN gửi lặp không được xử lý thanh toán hoặc cộng điểm Loyalty nhiều lần.

**Cấu hình môi trường VNPay Sandbox:**
Các thông tin tích hợp được quản lý bằng biến môi trường Backend:

- `VNPAY_URL`
- `VNPAY_TMN_CODE`
- `VNPAY_HASH_SECRET`
- `VNPAY_RETURN_URL`

`VNPAY_HASH_SECRET` chỉ được lưu tại Backend, không đưa vào Frontend hoặc repository.

Khi kiểm thử IPN trên Local, sử dụng tunnel để cung cấp URL public nếu cần. Khi triển khai trên Render, sử dụng URL Backend public kết hợp với endpoint IPN thực tế của hệ thống.

### 2.3. Idempotency-Key
Bắt buộc Client gửi header `Idempotency-Key` theo chuẩn UUID v4 khi tạo yêu cầu thanh toán.

- Lưu trữ bản ghi thanh toán kèm hash của request body để kiểm tra tính nhất quán của yêu cầu.
- Nếu nhận request trùng key và trùng body: trả về kết quả đã lưu mà không tạo Payment mới.
- Nếu nhận request trùng key nhưng khác body: trả về lỗi `409 Conflict`.
- Nếu thiếu hoặc key không hợp lệ: trả về lỗi `400 Bad Request`.
- Khi retry sau khi giao dịch đã được xác nhận thất bại, Client phải sử dụng Idempotency-Key mới.
- Sử dụng ràng buộc duy nhất tại Database để hỗ trợ chống xử lý trùng khi có nhiều request đồng thời.

## 3. HỆ QUẢ
### Ưu điểm
- Duy trì khả năng kiểm thử độc lập bằng Mock Gateway, không phụ thuộc dịch vụ thanh toán bên ngoài.
- Hỗ trợ kiểm thử tích hợp quy trình thanh toán VNPay Sandbox.
- Có thể kiểm thử các trường hợp thanh toán thành công, thất bại và chờ xác nhận.
- Hạn chế tạo giao dịch trùng lặp nhờ cơ chế Idempotency-Key và ràng buộc Database.
- Bảo vệ thông tin bí mật và xác minh kết quả thanh toán tại Backend.
- Hỗ trợ kiểm thử tự động trên CI bằng Mock Gateway mà không cần kết nối VNPay.
### Hạn chế
- VNPay Sandbox cần Internet và thông tin cấu hình Merchant được cấp.
- Kiểm thử IPN trên Local có thể cần tunnel public như ngrok hoặc Cloudflare Tunnel.
- Cần xử lý các trường hợp IPN gửi lặp, gửi chậm hoặc chưa nhận được kết quả xác nhận.
- Không tích hợp thanh toán ngân hàng thật trong phạm vi Assignment 2; VNPay chỉ được sử dụng ở môi trường Sandbox theo định hướng đề bài.