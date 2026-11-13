# BỐI CẢNH DỰ ÁN & PHẠM VI (CONTEXT & SCOPE)

> **Người phụ trách**: Nhật Lan  
> **Mã Task**: `SP1-03` (Task 1.1 theo đề bài)  
> **Sprint**: Sprint 1

---

## 1. VẤN ĐỀ NGHIỆP VỤ (BUSINESS PROBLEM)
- Trong quy trình phục vụ đồ uống trực tiếp tại quầy, khách hàng thường phải xem menu, lựa chọn món và thực hiện thanh toán tại cửa hàng. Vào giờ cao điểm, quá trình này có thể làm tăng thời gian chờ đợi và gây ùn tắc tại khu vực gọi món. Bên cạnh đó, việc trao đổi thông tin về sản phẩm, kích cỡ (size) và topping bằng lời nói có thể dẫn đến sai sót trong quá trình tiếp nhận đơn hàng.

- BrewLite được xây dựng nhằm giúp khách hàng có thể đặt món và thanh toán không dùng tiền mặt chỉ trong vài chạm, giảm thời gian xếp hàng và có thể dễ dàng theo dõi trạng thái đơn hàng. Hệ thống hướng tới việc đơn giản hóa quy trình đặt món, giảm thời gian xếp hàng và hỗ trợ khách hàng nhận đơn thuận tiện tại quầy, đồng thời cung cấp thông tin đơn hàng nhất quán phục vụ quy trình vận hành của cửa hàng.

## 2. Các bên liên quan (Stakeholders)

| Tác nhân (Stakeholder) | Vai trò | Mục tiêu / Kỳ vọng chính |
| :--- | :--- | :--- |
| **Khách hàng** | Người sử dụng hệ thống và đặt món | Xem menu/giá rõ ràng, tùy chọn size/topping, đặt món và thanh toán tiện lợi, xem mã đơn, trạng thái và lịch sử đơn hàng bản thân. |
| **Nhân viên quầy/Barista** | Nhân viên tiếp nhận và chuẩn bị đơn | Nhận yêu cầu món đầy đủ, chính xác; nắm được đơn cần thực hiện và trạng thái đơn. |
| **Quản lý cửa hàng/Product Owner**| Người giám sát | Nắm tình trạng đơn, thông tin sản phẩm, hỗ trợ kiểm soát quá trình phục vụ. |
| **Giảng viên/Khách hàng nghiệm thu** | Bên đánh giá và nghiệm thu kết quả dự án | Hệ thống đáp ứng yêu cầu đề bài, có đầy đủ tài liệu phân tích, thiết kế, kiểm thử và minh chứng triển khai. |
| **Nhóm phát triển** | Bên phân tích, thiết kế, xây dựng, kiểm thử và triển khai | Yêu cầu rõ ràng; phân công hợp lý; mã nguồn dễ bảo trì, kiểm thử và tích hợp; có quy trình quản lý phiên bản và bàn giao. |
| **Đơn vị thanh toán**| Dịch vụ tích hợp thanh toán mô phỏng  | Yêu cầu tích hợp đúng luồng trả kết quả, xác minh dữ liệu giao dịch và bảo vệ thông tin nhạy cảm. |

**Lưu ý:** Stakeholder không đồng nghĩa với actor use-case. Giảng viên và nhóm phát triển không là actor nghiệp vụ chỉ vì họ tham gia dự án. Tác nhân Barista/quản lý cũng không mặc nhiên có giao diện trong phiên bản MVP.

## 3. Phạm vi hệ thống (System Scope)
### 3.1. Trong phạm vi MVP (In scope)
MVP tập trung vào luồng nghiệp vụ chính:
*Xem menu → Chọn sản phẩm và tùy chọn → Giỏ hàng → Đặt đơn → Thanh toán → Xác nhận và theo dõi đơn hàng.*
- **Phạm vi mở rộng (Future / Out-of-Scope cho Assignment 2)**:
  - Cổng thanh toán quốc tế thực tế (Stripe, PayPal).
  - Giao hàng tận nơi (Delivery tracking GPS).
  - Phân tích kinh doanh bằng AI nâng cao.

| Nhóm chức năng| Phạm vi |
|---|---|
| Menu | Hiển thị danh sách sản phẩm cùng thông tin cơ bản như tên, hình ảnh và giá; hỗ trợ tìm kiếm, lọc sản phẩm theo phạm vi nhóm thống nhất. |
| Sản phẩm | Hiển thị thông tin sản phẩm; cho phép lựa chọn size, topping và tính giá theo tùy chọn. |
| Giỏ hàng | Thêm sản phẩm, cập nhật số lượng, xóa sản phẩm và tính tổng tiền đơn hàng. |
| Xác thực | Đăng ký, đăng nhập và xác thực người dùng bằng JWT. |
| Đặt đơn | Tạo đơn hàng, validate dữ liệu; kiểm tra tồn kho, kiểm soát cập nhật đồng thời để hạn chế bán quá số lượng còn lại. |
| Thanh toán | Thanh toán Ví/Thẻ mô phỏng qua VNPay Sandbox; xử lý kết quả thành công/thất bại. |
| Xác nhận và theo dõi | Hiển thị mã đơn, chi tiết và trạng thái đơn; khách hàng có thể xem lịch sử đơn của mình. |
| Trạng thái đơn hàng | Quản lý theo vòng đời theo luồng: PENDING ➔ PAID ➔ PREPARING ➔ READY ➔ COMPLETED, với các trạng thái ngoại lệ là `PAYMENT_FAILED` và `CANCELLED` |
| Khuyến mãi (Promotions) | Kiểm tra mã giảm giá và áp dụng số tiền giảm hợp lệ theo quy tắc backend. |
| Điểm thưởng (Loyalty) | Cộng điểm khi đơn đáp ứng điều kiện nghiệp vụ. |

### 3.2. Phạm vi mở rộng (Future / Could)
- Cổng thanh toán quốc tế thực tế (Stripe, PayPal).
- Giao hàng tận nơi (Delivery tracking GPS).
- Phân tích kinh doanh bằng AI nâng cao.
- Giao diện riêng cho nhân viên quầy/Barista để tiếp nhận đơn và cập nhật tiến độ pha chế.

## 4. GIẢ ĐỊNH & RÀNG BUỘC (ASSUMPTIONS & CONSTRAINTS)
- Giả định: Người dùng có kết nối Internet ổn định; thanh toán mô phỏng thành công/thất bại theo header kiểm thử.
- Ràng buộc kỹ thuật: Monorepo Node 22; Backend NestJS + PostgreSQL (Prisma); Frontend Next.js 15 App Router; Deploy Render + Vercel + Supabase.

## 4. Giả định (Assumptions)
- Người dùng có kết nối Internet ổn định.
- Thông tin sản phẩm, giá bán, size/topping, chương trình khuyến mãi được cập nhật chính xác trên hệ thống.
- Thanh toán mô phỏng thành công hoặc thất bại theo header kiểm thử.
- Nhân viên thực hiện đúng quy trình để khách hàng theo dõi đơn hàng.

## 5. Ràng buộc (Constraints)
- Kiến trúc: Mô hình Monorepo
- Môi trường: Sử dụng Node.js 22 theo nhóm thống nhất 
- Backend: Sử dụng NestJS, PostgreSQL và Prisma ORM để xây dựng REST API, quản lý dữ liệu và thực hiện migration/seed.
- Frontend: Sử dụng Next.js 15 với App Router, thiết kế mobile-first và hỗ trợ Progressive Web App (PWA).
- Triển khai: Sử dụng Render cho Backend, Vercel cho Frontend và Supabase cho cơ sở dữ liệu PostgreSQL theo kế hoạch của nhóm.
- Vận hành và chất lượng: Sử dụng Docker Compose cho môi trường phát triển, thiết lập CI/CD, health check và triển khai ứng dụng qua HTTPS.
- Ràng buộc nghiệp vụ: Hệ thống phải đáp ứng luồng đặt hàng tối thiểu: Xem menu → Chọn tùy chọn sản phẩm → Giỏ hàng → Đặt đơn → Thanh toán → Theo dõi đơn hàng.

## 6. Rủi ro ban đầu và biện pháp giảm thiểu (Risks & Mitigation)
| Mã | Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|---|
| RK-01 | Nhiều khách đặt đồng thời |Có thể bán vượt tồn kho | Giải quyết bằng Transaction và Optimistic Locking / Atomic Update. |
| RK-02 | Yêu cầu thanh toán hoặc callback được gửi lại | Phát sinh giao dịch/trạng thái trùng | Idempotency, xác minh callback/IPN, test retry; không lộ secret. |
| RK-03 | API/DB không khả dụng | Menu hoặc đơn hàng không tải được | Loading/empty/error, health check, logging và integration test. |
| RK-04 | FR, sơ đồ và code A1/A2 lệch nhau | Mất truy vết và lỗi nghiệm thu | Review AC, contract và owner; cập nhật bằng PR có lý do thay đổi. |
| RK-05 | CI/CD hoặc deployment lỗi sát hạn | Không có URL hoạt động khi chấm | Test sớm, smoke test, rollback và lưu evidence. |
| RK-06 | Lộ secret cấu hình sandbox/DB/JWT | Rủi ro an toàn và vi phạm quy tắc nhóm | Env/secrets manager, quét log và repo, không đưa credential vào tài liệu. |
