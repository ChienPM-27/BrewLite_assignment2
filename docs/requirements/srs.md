# BẢNG TỔNG HỢP ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) — BREWLITE

> **Người phụ trách**: Phạm Minh Chiến (Leader)  
> **Mã Task**: `SP1-02` (Task 1.2 theo đề bài Assignment 2)  
> **Tổng hợp từ**: 7 tài liệu `fr-*.md`, [context-and-scope.md](./context-and-scope.md) và tiêu chuẩn chất lượng ISO/IEC 25010  
> **Ghi chú tiến độ**: *Bản đặc tả sơ bộ đầu Sprint 1; sẽ được Leader đối chiếu và chuẩn hóa đồng bộ lần cuối vào cuối Sprint 1 sau khi 7 file `fr-*.md` của các thành viên được duyệt và merge.*

---

## 1. NGUYÊN TẮC QUẢN TRỊ YÊU CẦU & THỨ TỰ THỰC HIỆN

Hệ thống **BrewLite** là nền tảng gọi món và thanh toán trực tuyến tinh gọn cho chuỗi cửa hàng cà phê, tập trung vào trải nghiệm đặt hàng tiện lợi trên trình duyệt thiết bị di động (Web/PWA) và đảm bảo an toàn giao dịch.

Tài liệu này tổng hợp toàn bộ các Yêu cầu Chức năng (**FR-01** đến **FR-22**) và Yêu cầu Phi Chức năng (**NFR-01** đến **NFR-08**), đồng thời xác định ranh giới phạm vi rõ ràng qua phân loại **MoSCoW** (bao gồm cả các tính năng Could Have và Won't Have ngoài MVP).

---

## 2. BẢNG TỔNG HỢP YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS - FR)

Toàn bộ các yêu cầu chức năng được phân loại theo dải ID độc nhất, gán quyền sở hữu cụ thể và xếp loại theo thang ưu tiên **MoSCoW**:

| Mã FR | Tên yêu cầu chức năng | Phụ trách | Phân loại MoSCoW | File đặc tả chi tiết | Tóm tắt nghiệp vụ chính & Mã lỗi |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `FR-01` | Đăng ký tài khoản thành viên | Quách Tuấn Hào | **Must Have** | [fr-auth.md](./fr-auth.md) | Đăng ký bằng email + password. Mật khẩu băm một chiều với `bcrypt` (salt rounds = 10). Email đã tồn tại trả về `409 Conflict`. |
| `FR-02` | Đăng nhập hệ thống & cấp phát JWT | Quách Tuấn Hào | **Must Have** | [fr-auth.md](./fr-auth.md) | Xác thực thông tin, cấp JWT token (mặc định `JWT_EXPIRATION=7d`, chứa `sub`, `email`, `role`). Sai thông tin đăng nhập trả về `401 Unauthorized`. |
| `FR-03` | Bảo vệ tuyến API & phân quyền (RBAC) | Quách Tuấn Hào | **Must Have** | [fr-auth.md](./fr-auth.md) | `JwtAuthGuard` bảo vệ các route riêng tư (`/orders`, `/payments`). Phân quyền qua `@Roles()` (`CUSTOMER`, `ADMIN`). Thiếu quyền truy cập trả về `403 Forbidden`. |
| `FR-04` | Xem danh mục sản phẩm (Category Browsing) | Đinh Nhật Lan | **Must Have** | [fr-menu.md](./fr-menu.md) | Lấy danh sách danh mục (Cà phê, Trà, Bánh...). Lọc món theo danh mục được chọn. |
| `FR-05` | Xem danh sách món uống | Đinh Nhật Lan | **Must Have** | [fr-menu.md](./fr-menu.md) | Hiển thị tên món, hình ảnh và giá cơ sở. |
| `FR-06` | Tìm kiếm món uống theo tên | Đinh Nhật Lan | **Should Have** | [fr-menu.md](./fr-menu.md) | Tìm kiếm món tức thời không phân biệt hoa/thường, hỗ trợ tiếng Việt có dấu và không dấu. |
| `FR-07` | Xem chi tiết thông tin sản phẩm | Vũ Hoàng Huy | **Must Have** | [fr-detail.md](./fr-detail.md) | Xem mô tả, thành phần dinh dưỡng, danh sách kích cỡ (Size S/M/L) và topping khả dụng đi kèm. |
| `FR-08` | Tùy biến kích cỡ và Topping | Vũ Hoàng Huy | **Must Have** | [fr-detail.md](./fr-detail.md) | Cho phép chọn đúng 1 Size (mặc định Size M) và tối đa 3 loại Topping. Chặn vượt quá giới hạn trên cả UI và API. |
| `FR-09` | Tính giá linh hoạt & Xác thực giá Backend | Vũ Hoàng Huy | **Must Have** | [fr-detail.md](./fr-detail.md) | `Tổng giá món = Giá Base + Phụ thu Size + Tổng phụ thu Topping`. Giá do `PricingService` backend tính toán và bảo vệ; UI chỉ tạm tính hiển thị. |
| `FR-10` | Thêm, sửa, xóa món trong giỏ hàng | Quách Tuấn Hào | **Must Have** | [fr-cart.md](./fr-cart.md) | Quản lý giỏ hàng phía Client bằng Zustand Store. Hỗ trợ tăng/giảm số lượng, xóa từng món hoặc xóa toàn bộ giỏ. |
| `FR-11` | Tính tổng tiền giỏ hàng tự động | Quách Tuấn Hào | **Must Have** | [fr-cart.md](./fr-cart.md) | Tự động tính số lượng món, tạm tính (Subtotal), giảm giá voucher (Discount) và tổng thanh toán cuối cùng (Grand Total). |
| `FR-12` | Lưu trữ giỏ bền vững & Giữ giỏ khi lỗi | Quách Tuấn Hào | **Must Have** | [fr-cart.md](./fr-cart.md) | Giỏ hàng lưu bền vững vào `localStorage`. Khi tạo đơn hoặc thanh toán thất bại, giỏ hàng bắt buộc được giữ nguyên trạng thái. |
| `FR-13` | Tạo đơn hàng mới (Atomic Transaction) | Tôn Thất Hạnh | **Must Have** | [fr-order.md](./fr-order.md) | Nhận danh sách items, bọc trong Prisma `$transaction` để tạo đơn và các `order_items`, chuyển trạng thái ban đầu `PENDING`. |
| `FR-14` | Trừ tồn kho nguyên liệu & chống âm kho | Tôn Thất Hạnh | **Must Have** | [fr-order.md](./fr-order.md) | Trừ kho nguyên liệu theo định lượng công thức (g/ml). Kiểm tra điều kiện `stock >= usage` tránh âm kho. Thiếu nguyên liệu trả về `400 Bad Request`. |
| `FR-15` | Áp dụng mã khuyến mãi & Tích điểm thưởng | Tôn Thất Hạnh | **Should Have** | [fr-order.md](./fr-order.md) | Hỗ trợ voucher `WELCOME10` (giảm 10%, tối đa 50k). Tự động tích lũy điểm thưởng thành viên (1.000 VNĐ = 1 điểm) khi đơn sang `PAID`. |
| `FR-16` | Quản lý vòng đời trạng thái đơn (State Machine)| Tôn Thất Hạnh | **Must Have** | [fr-order.md](./fr-order.md) | Kiểm soát nghiêm ngặt chuyển đổi trạng thái tại `OrderService.transition()`. Luồng: `PENDING` ➔ `PAID` ➔ `PREPARING` ➔ `READY` ➔ `COMPLETED`. |
| `FR-17` | Cổng thanh toán mô phỏng (Mock Gateway) | Nguyễn Trần Gia Kiệt | **Must Have** | [fr-payment.md](./fr-payment.md) | Thanh toán mô phỏng nội bộ (`MOCK_CARD`, `MOCK_WALLET`). Hỗ trợ header `x-mock-outcome` nhận giá trị `SUCCESS` hoặc `FAILED` để phục vụ kiểm thử. |
| `FR-18` | Cơ chế chống trùng lặp (Idempotency-Key) | Nguyễn Trần Gia Kiệt | **Must Have** | [fr-payment.md](./fr-payment.md) | Yêu cầu header `Idempotency-Key` (UUIDv4). Nếu gửi lặp lại cùng key, backend trả về kết quả giao dịch đã xử lý mà không tạo bản ghi mới. |
| `FR-19` | Xử lý lỗi thanh toán & Hồi phục đơn hàng | Nguyễn Trần Gia Kiệt | **Must Have** | [fr-payment.md](./fr-payment.md) | Khi thanh toán lỗi: Đơn chuyển sang `PAYMENT_FAILED`, hoàn trả tồn kho nguyên liệu, giữ nguyên giỏ hàng để khách thử lại. |
| `FR-20` | Xác nhận thanh toán & Biên nhận giao dịch | Nguyễn Trần Gia Kiệt | **Must Have** | [fr-payment.md](./fr-payment.md) | Thanh toán thành công: Cập nhật đơn sang `PAID`, tạo bản ghi `payments`, xóa giỏ hàng và trả về biên lai giao dịch đầy đủ cho client. |
| `FR-21` | Xem danh sách lịch sử đơn hàng cá nhân | Nguyễn Quang Huy | **Must Have** | [fr-history.md](./fr-history.md) | Endpoint `GET /api/v1/orders/me` trả về danh sách các đơn hàng của người dùng hiện tại, sắp xếp theo thời gian mới nhất, kèm trạng thái và tổng tiền. |
| `FR-22` | Theo dõi chi tiết & trạng thái đơn hàng | Nguyễn Quang Huy | **Must Have** | [fr-history.md](./fr-history.md) | Xem chi tiết từng món trong đơn, phụ thu, mã voucher áp dụng, thông tin giao dịch thanh toán và timeline tiến trình chuyển đổi trạng thái. |
| `POST-01`| Đổi điểm thưởng tích luỹ trừ tiền (Redeem Points)| Tôn Thất Hạnh | **Could Have** | [context-and-scope.md](./context-and-scope.md) | Cho phép khách hàng nhập số điểm tích lũy hiện có để giảm trừ trực tiếp vào giá trị đơn hàng mới (xếp vào phạm vi mở rộng sau MVP). |
| `POST-02`| Giao diện Web riêng cho Barista quầy | Đinh Nhật Lan | **Won't Have** | [context-and-scope.md](./context-and-scope.md) | Cổng thông tin màn hình thao tác pha chế riêng cho nhân viên tại quầy (MVP chỉ tập trung luồng khách hàng B2C; state machine được quản lý qua API). |

---

## 3. BẢNG YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS - NFR)

Xây dựng theo tiêu chuẩn chất lượng **ISO/IEC 25010** với các tiêu chí đo lường cụ thể và kiểm chứng được bằng công cụ/test suite trong repository:

| Mã NFR | Đặc tính chất lượng (ISO/IEC 25010) | Tiêu chí đo lường định lượng (Acceptance Criteria) | Phương pháp kiểm chứng & Công cụ |
| :--- | :--- | :--- | :--- |
| `NFR-01` | **Hiệu năng & Thời gian đáp ứng (Performance Efficiency)** | - Thời gian phản hồi API (Response Time) p95 < 500ms đối với tác vụ đọc menu (`GET /api/v1/products`).<br>- p95 < 800ms đối với tác vụ tạo đơn hàng (`POST /api/v1/orders`). | Đo lường bằng NestJS Request Logger và Render Service Metrics. |
| `NFR-02` | **Bảo mật & Kiểm soát truy cập (Security)** | - Mật khẩu người dùng được băm bằng thư viện `bcrypt` với Salt Rounds = 10.<br>- JWT token ký thuật toán HS256, thời hạn mặc định `JWT_EXPIRATION=7d`.<br>- Không lưu bất kỳ secret thật nào trong mã nguồn Git (quét bằng script kiểm tra). | Unit test `auth.service.spec.ts` kiểm tra rounds 10; script quét regex secret trên git history. |
| `NFR-03` | **Tính toàn vẹn dữ liệu & Concurrency (Data Integrity)** | - Mọi tác vụ tạo đơn và trừ kho nguyên liệu được bọc trong một Database Transaction (ACID) duy nhất.<br>- Tuyệt đối không để xảy ra hiện tượng âm tồn kho (`stock >= 0`) khi nhiều request tranh chấp cùng đặt món cuối cùng. | Integration/E2E test: [apps/api/test/orders-concurrency.e2e-spec.ts](../../apps/api/test/orders-concurrency.e2e-spec.ts) chạy kịch bản gửi request đồng thời. |
| `NFR-04` | **Độ tin cậy & Tính bất biến (Reliability / Idempotency)** | - Khi gửi lặp lại nhiều request thanh toán với cùng một `Idempotency-Key` (UUIDv4), hệ thống chỉ tạo duy nhất 1 bản ghi thanh toán trong cơ sở dữ liệu.<br>- Các request trùng key tiếp theo trả về kết quả giao dịch ban đầu (HTTP 200). | Integration test: `apps/api/src/modules/payments/payments.service.spec.ts` assert số lượng bản ghi thanh toán khi trùng key. |
| `NFR-05` | **Tính tương thích & Tiêu chuẩn PWA (Compatibility)** | - Ứng dụng Web có manifest hợp lệ (`apps/web/public/manifest.json`), hiển thị độc lập (`display: standalone`) và cho phép người dùng cài đặt lên màn hình chính thiết bị di động/desktop (Installable PWA).<br>- Tương thích trên các trình duyệt hiện đại: Chrome, Safari iOS, Edge. | Kiểm tra manifest trong Chrome DevTools (tab Application ➔ Manifest); kiểm tra tính năng "Install App" trên trình duyệt. |
| `NFR-06` | **Khả năng triển khai container (Deployability)** | - Backend đóng gói thành Docker Image tiêu chuẩn dựa trên base image `node:22-slim` (Debian GNU/Linux).<br>- Môi trường Production tách biệt: Web trên Vercel, API trên Render Web Service, Database trên Supabase Managed PostgreSQL (cổng 6543 Transaction Mode, cổng 5432 Session Mode). | Kiểm tra `docker build` thành công trên cả môi trường cục bộ và CI runner. |
| `NFR-07` | **Tự động hóa kiểm thử CI (Continuous Integration)** | - 100% Pull Request vào nhánh `main` phải vượt qua quy trình CI tự động gồm 3 job độc lập: `api`, `web`, `integration`.<br>- Chặn merge nếu bất kỳ job nào thất bại. | Workflow [.github/workflows/ci.yml](../../.github/workflows/ci.yml); minh chứng lưu tại `docs/evidence/ci.md`. |
| `NFR-08` | **Khả năng phục hồi sự cố (Recoverability / Rollback)** | - Khi phát hiện bản phát hành mới gặp lỗi nghiêm trọng, quy trình rollback đưa hệ thống về phiên bản ổn định trước đó thông qua tính năng rollback 1-click của Render và Vercel Dashboard.<br>- Mục tiêu thời gian phục hồi (RTO) dự kiến dưới 5 phút. | Diễn tập thực nghiệm và biên bản lưu tại `docs/evidence/rollback.md` ở Sprint 3 (`SP3-05`). |

---

## 4. KẾ HOẠCH RÀ SOÁT ĐỒNG BỘ CUỐI SPRINT 1

Theo đúng quy trình Scrum và kế hoạch phân công trong bảng [BrewLite_A2_implement_plan.xlsx](../BrewLite_A2_implement_plan.xlsx):
1. Các thành viên hiện đang hoàn thiện 7 file tài liệu đặc tả chức năng chi tiết (`fr-*.md`) trên các nhánh cá nhân.
2. Cuối Sprint 1 (sau khi 7 PR của các thành viên được merge vào nhánh chính), Leader (Phạm Minh Chiến) sẽ rà soát lại toàn bộ bảng FR ở Mục 2 để đối chiếu mã lỗi, danh sách tham số DTO và kịch bản Acceptance Criteria, đảm bảo không có bất kỳ độ lệch nào giữa tài liệu tổng hợp SRS và các tài liệu chi tiết.
