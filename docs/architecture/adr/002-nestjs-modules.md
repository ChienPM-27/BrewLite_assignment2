# ADR-002: Thiết Kế Backend Theo Module Hóa (NestJS Modular Architecture)

> **Trạng thái**: Accepted  
> **Người đề xuất**: Nhật Lan  
> **Người duyệt**: Minh Chiến  
> **Phạm vi áp dụng**: `apps/api`

---

## 1. BỐI CẢNH & VẤN ĐỀ
Backend NestJS cần phục vụ nhiều nghiệp vụ khác nhau như Sản phẩm, Đơn hàng, Thanh toán, Xác thực người dùng, Khách hàng thân thiết và Giảm giá. Các nghiệp vụ có sự liên kết với nhau, chẳng hạn Đơn hàng cần tính giá và Thanh toán cần cập nhật trạng thái đơn. Nếu tập trung toàn bộ chức năng trong các Controller hoặc Service lớn sẽ gây khó bảo trì, kiểm thử và dễ phát sinh merge conflict giữa các thành viên. Ngược lại, việc tách thành nhiều Microservices độc lập làm tăng độ phức tạp trong giao tiếp, quản lý giao dịch và triển khai, chưa phù hợp với quy mô đồ án. 
Vì vậy, nhóm cần một kiến trúc phân chia rõ trách nhiệm theo nghiệp vụ nhưng vẫn thuận tiện phối hợp, kiểm thử và triển khai thống nhất.

## 2. QUYẾT ĐỊNH
Nhóm lựa chọn kiến trúc Modular Monolith với NestJS: Backend được chia thành các module theo nghiệp vụ nhưng cùng chạy trong một ứng dụng, một tiến trình API và một vòng đời triển khai. Các module độc lập về trách nhiệm, không phải các microservice triển khai riêng.
**Các nhóm module chính:**
`auth`: Đăng ký, đăng nhập, xác thực JWT và xử lý thông tin xác thực người dùng.
`products`: Cung cấp danh mục, danh sách và chi tiết sản phẩm.
`orders`: Tạo đơn hàng và điều phối những quy tắc liên quan đến đơn.
`pricing` và `promotions`: Tính giá theo lựa chọn sản phẩm, kiểm tra và áp dụng mã giảm giá.
`payments`: Xử lý giao dịch, chống yêu cầu thanh toán lặp bằng idempotency; tích hợp MockGatewayService và phần VNPay.
`loyalty`: Xử lý tích lũy và ghi nhận giao dịch điểm thưởng.
*Ngoài các module nghiệp vụ chính, hệ thống còn có các module phục vụ chức năng hủy đơn, lịch sử đơn hàng, quản lý đơn hàng và PrismaModule hỗ trợ truy cập PostgreSQL.*

**Cấu trúc trách nhiệm trong module**:
`Controller`: Khai báo endpoint, nhận HTTP request và chuyển xử lý đến service; sử dụng DTO để mô tả dữ liệu đầu vào.
`Service`: Chứa logic nghiệp vụ và phối hợp với các provider cần thiết.
`DTO`: Định nghĩa cấu trúc, quy tắc kiểm tra dữ liệu bằng class-validator; việc xác thực được thực thi thông qua ValidationPipe.
`Module`: Tổ chức và liên kết các Controller, Service cùng những thành phần liên quan; đồng thời quản lý việc sử dụng và chia sẻ Service giữa các module.

**Nguyên tắc phối hợp:** Các module có thể sử dụng Service của nhau thông qua cơ chế quản lý của NestJS, giúp phân chia trách nhiệm và hạn chế phụ thuộc không cần thiết. Backend sử dụng Prisma ORM và Transaction khi cần xử lý nhiều thao tác dữ liệu liên quan nhằm bảo đảm tính nhất quán.
## 3. HỆ QUẢ
**Ưu điểm**:
- Phân tách trách nhiệm: Mỗi module tập trung vào một nhóm nghiệp vụ, phù hợp với nguyên lý Single Responsibility.
- Dễ bảo trì và mở rộng: Có thể bổ sung hoặc điều chỉnh nghiệp vụ trong phạm vi module tương ứng.
- Hỗ trợ kiểm thử: Các service có thể được kiểm thử độc lập bằng cách sử dụng dependency injection và mock các dependency.
- Hỗ trợ làm việc nhóm: Các thành viên có thể phân công theo module, giảm nguy cơ xung đột mã nguồn khi phát triển song song.
- Đơn giản hóa triển khai: Backend được build và triển khai như một ứng dụng thống nhất, không cần quản lý nhiều dịch vụ phân tán.

**Hạn chế và đánh đổi**:
- Phụ thuộc giữa các module: Cần kiểm soát quan hệ phụ thuộc để tránh phụ thuộc vòng (circular dependencies); ưu tiên điều chỉnh thiết kế, chỉ sử dụng forwardRef khi thực sự cần thiết.
- Triển khai chung: Thay đổi ở một module có thể yêu cầu build, kiểm thử và triển khai lại toàn bộ Backend.
- Chia sẻ tài nguyên: Các module sử dụng chung tiến trình ứng dụng và cơ sở dữ liệu, nên lỗi hoặc quá tải ở một chức năng có thể ảnh hưởng đến chức năng khác.
- Khả năng mở rộng độc lập: Không thể triển khai hoặc mở rộng riêng từng module như mô hình Microservices.

Nhóm chấp nhận các hạn chế này vì kiến trúc Modular Monolith đáp ứng được nhu cầu phát triển hiện tại, đồng thời duy trì cấu trúc đủ rõ ràng để tiếp tục mở rộng hệ thống khi cần thiết.