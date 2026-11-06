# BẢNG TỔNG HỢP ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) — BREWLITE

> **Người phụ trách**: Minh Chiến (Leader)  
> **Mã Task**: `SP1-02` (Task 1.2 theo đề bài Assignment 2)  
> **Tổng hợp từ**: 7 tài liệu `fr-*.md`, [context-and-scope.md](./context-and-scope.md) và tiêu chuẩn chất lượng phần mềm ISO/IEC 25010

---

## 1. TỔNG QUAN & NGUYÊN TẮC QUẢN TRỊ YÊU CẦU

Hệ thống **BrewLite** là nền tảng gọi món và thanh toán trực tuyến tinh gọn cho chuỗi cửa hàng cà phê, hướng đến trải nghiệm người dùng mượt mà trên thiết bị di động (Mobile Web/PWA) và bảo vệ an toàn cho các giao dịch nghiệp vụ.

Tài liệu này tổng hợp toàn bộ các Yêu cầu Chức năng (**FR-01** đến **FR-22**) và Yêu cầu Phi Chức năng (**NFR-01** đến **NFR-08**), đóng vai trò là "Nguồn Sự Thật Duy Nhất" (Single Source of Truth) cho việc thiết kế sơ đồ UML, hiện thực mã nguồn, xây dựng test suite tự động và nghiệm thu sản phẩm.

---

## 2. BẢNG TỔNG HỢP YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS - FR)

Toàn bộ 22 yêu cầu chức năng được phân loại theo dải ID không trùng lặp, gán quyền sở hữu rõ ràng cho từng thành viên và xếp thứ tự ưu tiên theo thang chuẩn **MoSCoW** (Must Have, Should Have, Could Have, Won't Have).

| Mã FR | Tên yêu cầu chức năng | Phụ trách | Phân loại MoSCoW | File đặc tả chi tiết | Tóm tắt nghiệp vụ chính & Mã lỗi |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `FR-01` | Đăng ký tài khoản thành viên | Quách Tuấn Hào | **Must Have** | [fr-auth.md](./fr-auth.md) | Đăng ký bằng email + password. Mật khẩu băm bcrypt (rounds >= 10). Email trùng trả về `409 Conflict`. |
| `FR-02` | Đăng nhập hệ thống & cấp phát JWT | Quách Tuấn Hào | **Must Have** | [fr-auth.md](./fr-auth.md) | Xác thực thông tin, trả về JWT Access Token (hạn 24h, chứa `sub`, `email`, `role`). Sai thông tin trả về `401 Unauthorized`. |
| `FR-03` | Bảo vệ tuyến API & phân quyền (RBAC) | Quách Tuấn Hào | **Must Have** | [fr-auth.md](./fr-auth.md) | `JwtAuthGuard` bảo vệ các route riêng tư (`/orders`, `/payments`). Phân quyền qua `@Roles()` (`CUSTOMER`, `ADMIN`). Thiếu quyền trả về `403 Forbidden`. |
| `FR-04` | Xem danh mục sản phẩm (Category Browsing) | Nhật Lan | **Must Have** | [fr-menu.md](./fr-menu.md) | Lấy danh sách danh mục (Cà phê, Trà, Bánh...). Cho phép lọc món theo danh mục đã chọn. |
| `FR-05` | Xem danh sách món & kiểm tra tồn kho | Nhật Lan | **Must Have** | [fr-menu.md](./fr-menu.md) | Hiển thị hình ảnh, tên món, giá cơ sở và gắn nhãn "Hết hàng" (Sold Out) nếu nguyên liệu cấu thành không đủ định lượng tối thiểu. |
| `FR-06` | Tìm kiếm món uống theo tên | Nhật Lan | **Should Have** | [fr-menu.md](./fr-menu.md) | Tìm kiếm tức thì (Client/Server search) không phân biệt hoa thường và hỗ trợ tiếng Việt có dấu/không dấu. |
| `FR-07` | Xem chi tiết thông tin sản phẩm | Vũ Hoàng Huy | **Must Have** | [fr-detail.md](./fr-detail.md) | Xem mô tả, thành phần dinh dưỡng, danh sách kích cỡ (Size S/M/L) và danh sách topping khả dụng đi kèm. |
| `FR-08` | Tùy biến kích cỡ và Topping | Vũ Hoàng Huy | **Must Have** | [fr-detail.md](./fr-detail.md) | Cho phép chọn đúng 1 Size (mặc định Size M) và tối đa 3 loại Topping. Chặn vượt quá giới hạn topping trên cả UI và API. |
| `FR-09` | Tính giá linh hoạt & Xác thực giá Backend | Vũ Hoàng Huy | **Must Have** | [fr-detail.md](./fr-detail.md) | `Tổng giá món = Giá Base + Phụ thu Size + Tổng phụ thu Topping`. Giá bắt buộc do `PricingService` backend tính toán và bảo vệ; UI chỉ tạm tính hiển thị. |
| `FR-10` | Thêm, sửa, xóa món trong giỏ hàng | Quách Tuấn Hào | **Must Have** | [fr-cart.md](./fr-cart.md) | Quản lý giỏ hàng phía Client qua Zustand Store. Hỗ trợ tăng/giảm số lượng món, xóa từng món hoặc xóa toàn bộ giỏ. |
| `FR-11` | Tính tổng tiền giỏ hàng tự động | Quách Tuấn Hào | **Must Have** | [fr-cart.md](./fr-cart.md) | Tự động tính tổng số lượng món, tạm tính (Subtotal), áp dụng giảm giá (Discount) và tổng thanh toán cuối cùng (Grand Total). |
| `FR-12` | Lưu trữ giỏ bền vững & Giữ giỏ khi lỗi | Quách Tuấn Hào | **Must Have** | [fr-cart.md](./fr-cart.md) | Giỏ hàng lưu bền vững vào `localStorage`. Khi tạo đơn hoặc thanh toán thất bại, giỏ hàng bắt buộc được giữ nguyên trạng thái. |
| `FR-13` | Tạo đơn hàng mới (Atomic Transaction) | Tôn Thất Hạnh | **Must Have** | [fr-order.md](./fr-order.md) | Nhận danh sách items từ giỏ, bọc trong Prisma `$transaction` để sinh mã đơn hàng, tạo các `order_items` và chuyển trạng thái ban đầu `PENDING`. |
| `FR-14` | Trừ tồn kho nguyên liệu & chống âm kho | Tôn Thất Hạnh | **Must Have** | [fr-order.md](./fr-order.md) | Trừ kho nguyên liệu theo định lượng công thức (g/ml). Dùng điều kiện `stock >= usage` tránh âm kho. Thiếu nguyên liệu trả về `400 Bad Request`. |
| `FR-15` | Áp dụng mã khuyến mãi & Tích điểm thưởng | Tôn Thất Hạnh | **Should Have** | [fr-order.md](./fr-order.md) | Hỗ trợ voucher `WELCOME10` (giảm 10%, tối đa 50k). Tự động tích lũy điểm thưởng thành viên (1.000 VNĐ = 1 điểm) khi đơn sang `PAID`. |
| `FR-16` | Quản lý vòng đời trạng thái đơn (State Machine)| Tôn Thất Hạnh | **Must Have** | [fr-order.md](./fr-order.md) | Kiểm soát nghiêm ngặt chuyển đổi trạng thái tại `OrderService.transition()`. Luồng chuẩn: `PENDING` ➔ `PAID` ➔ `PREPARING` ➔ `READY` ➔ `COMPLETED`. |
| `FR-17` | Cổng thanh toán mô phỏng (Mock Gateway) | Nguyễn Trần Gia Kiệt | **Must Have** | [fr-payment.md](./fr-payment.md) | Hỗ trợ 2 phương thức mô phỏng: Thẻ ngân hàng (`MOCK_CARD`) và Ví điện tử (`MOCK_WALLET`). Hỗ trợ header giả lập kết quả thành công/thất bại. |
| `FR-18` | Cơ chế chống trùng lặp (Idempotency-Key) | Nguyễn Trần Gia Kiệt | **Must Have** | [fr-payment.md](./fr-payment.md) | Bắt buộc client gửi header `Idempotency-Key` (UUIDv4). Nếu gửi lặp lại cùng key, backend trả về kết quả đã xử lý mà không tạo giao dịch mới. |
| `FR-19` | Xử lý lỗi thanh toán & Hồi phục đơn hàng | Nguyễn Trần Gia Kiệt | **Must Have** | [fr-payment.md](./fr-payment.md) | Khi thanh toán lỗi: Đơn chuyển sang `PAYMENT_FAILED`, hoàn trả lại tồn kho nguyên liệu, giữ nguyên giỏ hàng để khách thử lại phương thức khác. |
| `FR-20` | Xác nhận thanh toán & Biên nhận giao dịch | Nguyễn Trần Gia Kiệt | **Must Have** | [fr-payment.md](./fr-payment.md) | Thanh toán thành công: Cập nhật đơn sang `PAID`, tạo bản ghi `payments`, xóa giỏ hàng và trả về biên lai giao dịch đầy đủ cho client. |
| `FR-21` | Xem danh sách lịch sử đơn hàng cá nhân | Nguyễn Quang Huy | **Must Have** | [fr-history.md](./fr-history.md) | Endpoint `GET /api/v1/orders/me` trả về danh sách các đơn hàng của người dùng hiện tại, sắp xếp theo thời gian mới nhất, kèm trạng thái và tổng tiền. |
| `FR-22` | Theo dõi chi tiết & trạng thái đơn hàng | Nguyễn Quang Huy | **Must Have** | [fr-history.md](./fr-history.md) | Xem chi tiết từng món trong đơn, phụ thu, mã voucher áp dụng, thông tin giao dịch thanh toán và timeline tiến trình chuyển đổi trạng thái. |

### Thống kê phân bổ MoSCoW:
- **Must Have**: 20/22 yêu cầu (90.9%) — Cốt lõi của hệ thống để đáp ứng đầy đủ kịch bản đánh giá của đề bài.
- **Should Have**: 2/22 yêu cầu (9.1%) — `FR-06` (Tìm kiếm theo tên) và `FR-15` (Mã khuyến mãi & Tích điểm).
- **Could Have / Won't Have**: Đã đưa vào Post-MVP Backlog (đổi điểm thưởng trừ tiền `Redeem Points`, giao diện riêng cho Barista quầy).

---

## 3. BẢNG YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS - NFR)

Các yêu cầu phi chức năng được xây dựng dựa trên tiêu chuẩn quốc tế **ISO/IEC 25010 (Hệ thống và Chất lượng Phần mềm)**, đảm bảo tính đo lường định lượng và có kịch bản kiểm chứng rõ ràng.

| Mã NFR | Đặc tính chất lượng (ISO/IEC 25010) | Tiêu chí đo lường định lượng (Acceptance Criteria) | Phương pháp kiểm chứng & Công cụ |
| :--- | :--- | :--- | :--- |
| `NFR-01` | **Hiệu năng & Thời gian đáp ứng (Performance Efficiency)** | - Thời gian phản hồi API (Response Time) p95 < 500ms cho các tác vụ đọc menu (`GET /products`) và xem giỏ.<br>- p95 < 800ms cho tác vụ tạo đơn hàng (`POST /orders`).<br>- Chịu tải đồng thời tối thiểu 50 người dùng đồng thời (50 VUs) với tỷ lệ lỗi < 0.5%. | Kịch bản kiểm thử tải bằng `k6` hoặc `autocannon`. Đo lường p95 qua NestJS Logger và Render metrics. |
| `NFR-02` | **Bảo mật & Kiểm soát truy cập (Security)** | - Mật khẩu người dùng được băm một chiều bằng thư viện `bcrypt` với Salt Rounds >= 10.<br>- JWT Access Token ký bằng thuật toán HS256, thời hạn 24 giờ.<br>- Toàn bộ kết nối API và Web bắt buộc HTTPS (TLS 1.3).<br>- Không có bất kỳ API secret, database credential hoặc ngrok URL nào tồn tại trong mã nguồn Git (quét bằng `gitleaks`/`grep`). | Quét secret bằng script kiểm tra bảo mật; Unit test kiểm tra độ phức tạp của bcrypt salt rounds; Kiểm tra header bảo mật SSL trên production. |
| `NFR-03` | **Tính toàn vẹn dữ liệu & Concurrency (Data Integrity)** | - Mọi tác vụ tạo đơn và trừ kho nguyên liệu được bọc trong một Database Transaction (ACID) duy nhất.<br>- Tuyệt đối không để xảy ra hiện tượng âm tồn kho (`stock >= 0`) khi có 20 request đặt cùng một món cuối cùng tại cùng một thời điểm. | Integration test kịch bản concurrency (`apps/api/test/orders-concurrency.int-spec.ts`) gửi 10 request song song qua `Promise.all`. |
| `NFR-04` | **Độ tin cậy & Tính bất biến (Reliability / Idempotency)** | - Khi client gửi lại nhiều request thanh toán với cùng một `Idempotency-Key` (trong vòng 24 giờ), hệ thống chỉ thực hiện trừ tiền và tạo giao dịch thanh toán duy nhất 1 lần.<br>- Các request lặp lại tiếp theo trả về nguyên văn kết quả của giao dịch ban đầu (HTTP 200). | Integration test `payments-idempotency.int-spec.ts` gửi liên tiếp 3 request cùng key và assert số lượng payment record trong database. |
| `NFR-05` | **Tính tương thích & Tiêu chuẩn PWA (Compatibility)** | - Ứng dụng Web đáp ứng đầy đủ tiêu chuẩn Progressive Web App (PWA): manifest hợp lệ, service worker caching, icon chuẩn (192x192, 512x512) và chế độ hiển thị `standalone`.<br>- Tương thích hoàn toàn trên các trình duyệt phổ biến: Chrome, Safari iOS, Edge, Firefox.<br>- Giao diện thích ứng (Responsive) mượt mà từ màn hình 375px (Mobile) đến 1440px (Desktop). | Kiểm tra bằng Google Chrome Lighthouse PWA Audit (Điểm PWA >= 90); Kiểm thử hiển thị trên Chrome DevTools Device Emulation. |
| `NFR-06` | **Khả năng triển khai & Cô lập mạng (Deployability)** | - Backend đóng gói thành Docker Image tiêu chuẩn (Linux Alpine), sẵn sàng triển khai trên bất kỳ container runtime nào.<br>- Môi trường Production tách biệt độc lập: Web trên Vercel CDN, API trên Render Web Service, Database trên Supabase Managed Cloud.<br>- Cơ sở dữ liệu Supabase áp dụng Transaction Connection Pooling (cổng 6543) cho runtime và Direct Connection (cổng 5432) cho migration. | Kiểm tra khởi động thành công bằng `docker compose up`; Xác nhận 3 URL Production hoạt động độc lập và bảo mật. |
| `NFR-07` | **Tự động hóa CI/CD & Quản trị mã nguồn (Automation)** | - 100% Pull Request vào nhánh `main` phải vượt qua quy trình CI tự động gồm 4 bước: Lint (ESLint), Unit Test (Vitest + Jest), Build (TypeScript) và Integration Test.<br>- Branch Protection trên `main` bắt buộc có ít nhất 1 Code Review Approve và CI xanh mới được merge.<br>- Tự động kích hoạt đóng gói và triển khai (CD) khi có commit mới trên `main`. | Minh chứng GitHub Actions pipeline xanh tại [docs/evidence/ci.md](../evidence/ci.md). |
| `NFR-08` | **Khả năng phục hồi sự cố & Rollback (Recoverability)** | - Thời gian phục hồi mục tiêu (Recovery Time Objective - RTO) < 5 phút khi phát hiện bản phát hành mới gặp lỗi nghiêm trọng.<br>- Quy trình Rollback có thể kích hoạt tự động nếu kiểm thử khói (`smoke-test.sh`) thất bại hoặc kích hoạt thủ công 1-click trên Render/Vercel dashboard để đưa hệ thống về release tag ổn định trước đó. | Bằng chứng thực nghiệm diễn tập Rollback (Rollback Drill) tại [docs/evidence/rollback.md](../evidence/rollback.md). |

---

## 4. MA TRẬN PHÂN BỔ TRÁCH NHIỆM & TRUY VẾT BAN ĐẦU

| Thành viên | Trách nhiệm chính | Dải FR phụ trách | NFR liên quan | Thư mục mã nguồn sở hữu |
| :--- | :--- | :--- | :--- | :--- |
| **Minh Chiến (Leader)** | Kiến trúc, CI/CD, Triển khai, SRS | Quản trị chung | `NFR-01`, `02`, `06`, `07`, `08` | `.github/**`, `docs/deployment.md`, `schema.prisma`, `common/**` |
| **Nhật Lan** | Menu, Danh mục, Phạm vi dự án | `FR-04`, `FR-05`, `FR-06` | `NFR-01`, `NFR-05` | `docs/requirements/fr-menu.md`, `apps/api/src/modules/products/**` |
| **Vũ Hoàng Huy** | Chi tiết món, Tùy biến giá, Topping | `FR-07`, `FR-08`, `FR-09` | `NFR-01`, `NFR-03` | `docs/requirements/fr-detail.md`, `apps/api/src/modules/pricing/**` |
| **Quách Tuấn Hào** | Xác thực tài khoản, Giỏ hàng Zustand | `FR-01..03`, `FR-10..12` | `NFR-02`, `NFR-05` | `docs/requirements/fr-auth.md`, `fr-cart.md`, `apps/api/src/modules/auth/**` |
| **Tôn Thất Hạnh** | Tạo đơn, Tồn kho công thức, State Machine| `FR-13..16` | `NFR-03` | `docs/requirements/fr-order.md`, `apps/api/src/modules/orders/**` |
| **Nguyễn Trần Gia Kiệt**| Thanh toán mô phỏng, Idempotency | `FR-17..20` | `NFR-04` | `docs/requirements/fr-payment.md`, `apps/api/src/modules/payments/**` |
| **Nguyễn Quang Huy** | Lịch sử đơn hàng, E2E Test, Truy vết | `FR-21`, `FR-22` | `NFR-07`, `NFR-08` | `docs/requirements/fr-history.md`, `tests/**`, `traceability-matrix.md` |
