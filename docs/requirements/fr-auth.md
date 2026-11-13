# XÁC THỰC & BẢO VỆ TÀI KHOẢN — ĐẶC TẢ YÊU CẦU CHỨC NĂNG (FR-01..03)

> **Người phụ trách**: Quách Tuấn Hào  
> **Mã Task**: `SP1-05` (Task 1.2)  
> **Dải ID phân công**: `FR-01` đến `FR-03`  
> **Tài liệu liên kết**: [srs.md](./srs.md), [ADR-004](../architecture/adr/004-jwt-zustand.md), [test-scenarios.md](./test-scenarios.md)

---

## 1. TỔNG QUAN PHẠM VI CHỨC NĂNG

Cung cấp cơ chế đăng ký tài khoản thành viên mới, đăng nhập xác thực phi trạng thái (Stateless) thông qua **JSON Web Token (JWT)** kết hợp băm mật khẩu một chiều bằng **bcrypt**, đồng thời bảo vệ các tuyến API riêng tư và kiểm soát phân quyền truy cập theo vai trò (**RBAC**: `CUSTOMER`, `ADMIN`, `BARISTA`).

---

## 2. DANH SÁCH YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS)

### 2.1. FR-01: Đăng ký tài khoản thành viên (User Registration)
- **Độ ưu tiên (MoSCoW)**: Must Have
- **Mô tả nghiệp vụ**: Khách hàng mới tạo tài khoản bằng địa chỉ email, mật khẩu và họ tên. Hệ thống chuẩn hóa email (`trim().toLowerCase()`), kiểm tra trùng lặp, băm mật khẩu bằng `bcrypt` và trả về JWT token ngay sau khi tạo tài khoản thành công.
- **Tiêu chí chấp nhận (Acceptance Criteria - AC)**:
  - `AC-01.1`: **Input hợp lệ** ➔ Khi gửi `POST /api/v1/auth/register` với body `{ email, password (tối thiểu 6 ký tự), fullName? }`, hệ thống khởi tạo tài khoản với `role = CUSTOMER`, `loyaltyPoints = 0` và trả về mã trạng thái **`201 Created`** kèm `{ accessToken, user: { id, email, fullName, role, loyaltyPoints } }`.
  - `AC-01.2`: **Bảo mật mật khẩu** ➔ Mật khẩu người dùng bắt buộc được băm một chiều bằng thuật toán `bcrypt` với **`salt rounds = 10`** trước khi lưu vào cơ sở dữ liệu (`password_hash`); tuyệt đối không lưu plain text và không trả trường `passwordHash` trong response.
  - `AC-01.3`: **Trùng lặp email** ➔ Nếu `email` (sau khi chuẩn hóa chữ thường) đã tồn tại trong bảng `users`, hệ thống từ chối tạo tài khoản và trả về mã lỗi **`409 Conflict`** (`"Email này đã được sử dụng"`).
  - `AC-01.4`: **Dữ liệu không hợp lệ / Chống leo thang đặc quyền** ➔ Nếu `email` sai định dạng, `password` dưới 6 ký tự, hoặc client cố tình gửi thêm trường không được phép trong body (như `role: "ADMIN"`), `ValidationPipe` (`whitelist: true`, `forbidNonWhitelisted: true`) chặn ngay với mã lỗi **`400 Bad Request`**.

### 2.2. FR-02: Đăng nhập hệ thống & Cấp phát JWT (User Login)
- **Độ ưu tiên (MoSCoW)**: Must Have
- **Mô tả nghiệp vụ**: Xác thực thông tin đăng nhập của người dùng và cấp phát chuỗi JWT Access Token (ký bằng thuật toán `HS256`, thời hạn mặc định `JWT_EXPIRATION=7d`) để định danh cho các phiên gọi API tiếp theo.
- **Tiêu chí chấp nhận (Acceptance Criteria - AC)**:
  - `AC-02.1`: **Đăng nhập thành công** ➔ Khi gửi `POST /api/v1/auth/login` với `{ email, password }` chính xác, hệ thống trả về **`200 OK`** kèm `{ accessToken, user: { id, email, fullName, role, loyaltyPoints } }`, trong đó JWT payload chứa `{ sub: user.id, email: user.email, role: user.role }`.
  - `AC-02.2`: **Sai thông tin xác thực** ➔ Nếu `email` không tồn tại trong hệ thống hoặc `password` không khớp khi kiểm tra qua `bcrypt.compare()`, hệ thống từ chối và trả về mã lỗi **`401 Unauthorized`** kèm thông điệp chung `"Email hoặc mật khẩu không chính xác"`.
  - `AC-02.3`: **Thiếu thông tin đầu vào** ➔ Nếu body thiếu `email` hoặc `password` hoặc sai định dạng email, hệ thống trả về mã lỗi **`400 Bad Request`**.

### 2.3. FR-03: Bảo vệ tuyến API & Phân quyền truy cập (Route Protection & RBAC)
- **Độ ưu tiên (MoSCoW)**: Must Have
- **Mô tả nghiệp vụ**: Bảo vệ các tuyến API nghiệp vụ nhạy cảm thông qua `JwtAuthGuard` và kiểm tra quyền hạn theo vai trò người dùng thông qua `RolesGuard` kết hợp decorator `@Roles(...)`.
- **Tiêu chí chấp nhận (Acceptance Criteria - AC)**:
  - `AC-03.1`: **Thiếu token xác thực** ➔ Khi gọi các API người dùng như `/api/v1/orders/**`, `POST /api/v1/payments`, `GET /api/v1/payments/:id`, `/api/v1/admin/**`, `/api/v1/auth/admin-ping` mà không có header `Authorization: Bearer <token>`, hệ thống từ chối với mã lỗi **`401 Unauthorized`**. Ngoại trừ webhook công khai từ đối tác cổng thanh toán (`GET /api/v1/payments/vnpay/ipn`) được xác thực bằng chữ ký số HMAC-SHA512 thay vì JWT.
  - `AC-03.2`: **Token hết hạn hoặc không hợp lệ** ➔ Khi gửi token đã hết hạn (`exp`), sai chữ ký (`JWT_SECRET`) hoặc bị chỉnh sửa payload, `JwtStrategy` từ chối với mã lỗi **`401 Unauthorized`**; đồng thời phía Frontend (`api-client.ts`) tự động xóa token trong `localStorage` và chuyển hướng về `/auth/login?next=...`.
  - `AC-03.3`: **Phân quyền theo vai trò (RBAC)** ➔ Các tuyến quản trị (`/api/v1/admin/orders/**`, `/api/v1/auth/admin-ping`) yêu cầu vai trò `ADMIN` (hoặc `BARISTA` theo cấu hình route); nếu người dùng có vai trò `CUSTOMER` truy cập, `RolesGuard` từ chối với mã lỗi **`403 Forbidden`**.

---

## 3. BẢNG TRUY VẾT YÊU CẦU (TRACEABILITY TABLE)

| Mã FR | Tên yêu cầu | Use-Case liên kết | Sơ đồ liên quan | Code / API Endpoint | Test Case ID |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `FR-01` | Đăng ký tài khoản thành viên (`AC-01.1`..`01.4`) | `UC-ORD-01` ([usecase-order-payment.md](./usecase-order-payment.md)) | [docs/diagrams/activity-e2e.puml](../diagrams/activity-e2e.puml) | `POST /api/v1/auth/register` (`AuthController`, `AuthService`, `RegisterDto`) | `TC-AUTH-01`, `TC-AUTH-02`, `TC-AUTH-03`, `TC-AUTH-08` |
| `FR-02` | Đăng nhập & cấp phát JWT (`AC-02.1`..`02.3`) | `UC-ORD-01` ([usecase-order-payment.md](./usecase-order-payment.md)) | [docs/diagrams/activity-e2e.puml](../diagrams/activity-e2e.puml) | `POST /api/v1/auth/login` (`AuthController`, `AuthService`, `useAuthStore`) | `TC-AUTH-04`, `TC-AUTH-05`, `TC-AUTH-09` |
| `FR-03` | Bảo vệ tuyến API & phân quyền RBAC (`AC-03.1`..`03.3`) | `UC-ORD-01` ([usecase-order-payment.md](./usecase-order-payment.md)) | [docs/diagrams/activity-e2e.puml](../diagrams/activity-e2e.puml) | `JwtAuthGuard`, `JwtStrategy`, `RolesGuard`, `@Roles()` | `TC-AUTH-06`, `TC-AUTH-07`, `TC-AUTH-10` |

> *(Ghi chú: Các Test Case ID trên được đối chiếu từ `docs/requirements/test-scenarios.md`. Toàn bộ kịch bản kiểm thử tự động chi tiết và minh chứng kiểm thử của module Auth & Cart sẽ được hoàn thiện tại Sprint 2 theo nhiệm vụ SP2-05).*
