# XÁC THỰC & BẢO VỆ TÀI KHOẢN — ĐẶC TẢ YÊU CẦU CHỨC NĂNG (FR-01..03)

> **Người phụ trách**: Quách Tuấn Hào  
> **Mã Task**: `SP1-05` (Task 1.2)  
> **Dải ID**: `FR-01` đến `FR-03`

---

## 1. TỔNG QUAN
Cung cấp khả năng đăng ký tài khoản thành viên, đăng nhập xác thực qua JSON Web Token (JWT) và bảo vệ các tuyến API nhạy cảm.

---

## 2. DANH SÁCH YÊU CẦU CHỨC NĂNG

### 2.1. FR-01: Đăng ký tài khoản (User Registration)
- **MoSCoW**: Must Have
- **Acceptance Criteria (AC)**:
  - `AC-01.1`: `POST /api/v1/auth/register` với email hợp lệ, mật khẩu từ 6 ký tự trở lên trả về `201 Created`.
  - `AC-01.2`: Mật khẩu người dùng được băm bằng thuật toán `bcrypt` với salt rounds >= 10, tuyệt đối không lưu plain text.
  - `AC-01.3`: Nếu email đã tồn tại, trả về `409 Conflict`.

### 2.2. FR-02: Đăng nhập & Cấp phát JWT (User Login)
- **MoSCoW**: Must Have
- **Acceptance Criteria (AC)**:
  - `AC-02.1`: `POST /api/v1/auth/login` với email và mật khẩu đúng trả về `200 OK` kèm `accessToken` và thông tin User.
  - `AC-02.2`: Nếu sai mật khẩu hoặc tài khoản không tồn tại, trả về `401 Unauthorized`.

### 2.3. FR-03: Bảo vệ tuyến API & Phân quyền (Route Protection & RBAC)
- **MoSCoW**: Must Have
- **Acceptance Criteria (AC)**:
  - `AC-03.1`: Các API đặt hàng, thanh toán, lịch sử yêu cầu header `Authorization: Bearer <token>`. Thiếu token trả về `401 Unauthorized`.
  - `AC-03.2`: Token hết hạn hoặc chữ ký sai trả về `401 Unauthorized`.
  - `AC-03.3`: Các tuyến quản trị (`/api/v1/admin/*`) yêu cầu Role là `ADMIN`, người dùng thông thường (`CUSTOMER`) truy cập bị từ chối với mã `403 Forbidden`.

---

## 3. BẢNG TRUY VẾT YÊU CẦU (TRACEABILITY TABLE)

| Mã FR | Tên yêu cầu | Use-Case liên kết | Sơ đồ liên quan | Code / API Endpoint | Test Case ID |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `FR-01` | Đăng ký thành viên | `UC-AUTH-01` | `docs/diagrams/activity-e2e.puml` | `POST /api/v1/auth/register` | `TC-AUTH-01` |
| `FR-02` | Đăng nhập JWT | `UC-AUTH-02` | `docs/diagrams/activity-e2e.puml` | `POST /api/v1/auth/login` | `TC-AUTH-02` |
| `FR-03` | Bảo vệ route & RBAC | `UC-AUTH-03` | `docs/diagrams/sequence-checkout.puml` | `JwtAuthGuard`, `RolesGuard` | `TC-AUTH-03` |
