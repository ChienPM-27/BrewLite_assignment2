# KIẾN TRÚC TỔNG THỂ HỆ THỐNG BREWLITE (C4 CONTAINER LEVEL)

> **Người phụ trách**: Nhật Lan  
> **Mã Task**: `SP1-03` (Task 3.1)  
> **Sơ đồ liên quan**: `docs/architecture/c4-container.puml`, `c4-container.svg`

---

## 1. TỔNG QUAN KIẾN TRÚC (C4 CONTAINER OVERVIEW)

Hệ thống BrewLite được thiết kế theo mô hình phân tầng hiện đại (Modern Layered Monorepo Architecture) nhằm tối ưu khả năng mở rộng, độc lập kiểm thử và dễ dàng triển khai.
Hệ thống vận hành theo mô hình Client–Server: Frontend Next.js 15 giao tiếp với Backend NestJS 11 qua REST API; Backend truy cập PostgreSQL 16 thông qua Prisma ORM. Riêng Backend được tổ chức theo kiến trúc Modular Monolith: các phân hệ được tách thành module có trách nhiệm rõ ràng nhưng chạy và triển khai chung trong một ứng dụng NestJS.

```text
[ Người Dùng (Mobile / Desktop) ]
                │
                ▼ (HTTPS / PWA)
[ Web Frontend (Next.js 15 App Router - Vercel) ]
                │
                ▼ (REST API / JWT)
[ Backend API (NestJS Modular - Render Container) ]
                │
                ├───► [ Mock Payment Gateway (In-Memory / Deterministic) ]
                |
                |<---> [ VNPay Sandbox ]
                |       (Hệ thống bên ngoài)
                │
                ▼ (Prisma ORM - Connection Pooler / Direct)
[ Database (PostgreSQL 16 - Supabase) ]
```
Luồng nghiệp vụ cốt lõi: Xem menu → Xem chi tiết/chọn tùy chọn → Giỏ hàng → Tạo đơn → Thanh toán → Xem trạng thái và lịch sử đơn hàng. Backend chịu trách nhiệm xác thực các quy tắc về giá, tồn kho, thanh toán và trạng thái đơn; không tin cậy các giá trị quan trọng chỉ do Frontend gửi lên.
---

## 2. CÁC THÀNH PHẦN KIẾN TRÚC CHÍNH

### 2.1. Frontend Web & PWA (`apps/web`)
- **Công nghệ**: Next.js 15 (App Router), React 19, Tailwind CSS, Zustand, Vitest; môi trường build/chạy trong Dockerfile sử dụng Node.js 22..
- **Vai trò**: Cung cấp giao diện gọi món tối ưu cho thiết bị di động, quản lý giỏ hàng cục bộ bền vững qua Zustand `persist`, xử lý giao diện PWA (Progressive Web App).

### 2.2. Backend API Gateway & Services (`apps/api`)
- **Công nghệ**: NestJS 11, TypeScript, Prisma ORM, Passport JWT, Jest.
- **Kiến trúc Module**:
  - `auth`: Xác thực, cấp phát JWT, băm mật khẩu `bcrypt`.
  - `products`: Đọc danh mục và món đang mở bán (`isAvailable = true`, `stock > 0`); kiểm tra nguyên liệu thuộc bước tạo Order.
  - `pricing`: Tính giá linh hoạt theo size và topping.
  - `orders`: Xử lý tạo đơn, trừ tồn kho nguyên liệu công thức và kiểm soát vòng đời đơn qua State Machine.
  - `payments`: Tích hợp Mock Gateway và VNPay Sandbox, xử lý `Idempotency-Key` và callback có chữ ký.
  - `loyalty`: Quản lý điểm thưởng tích luỹ của khách hàng.
  - `promotions`: Quản lý và áp dụng mã giảm giá.
  

### 2.3. Cơ sở dữ liệu (PostgreSQL 16 - Supabase)
- **Công nghệ**: PostgreSQL 16 quản lý bởi Prisma Schema.
- **Tính năng**: ACID Transaction, Foreign Key Constraints, Row-level Locking khi trừ tồn kho.
- **Chiến lược kết nối**: Cổng 6543 (Transaction Pooler) cho backend runtime và Cổng 5432 cho migration.

### 2.4. Cổng thanh toán mô phỏng (Mock Payment Gateway)
- Được nhúng trực tiếp trong service backend, hoạt động tất định (deterministic), hỗ trợ giả lập thành công hoặc thất bại thông qua header mà không phụ thuộc vào bên thứ ba.

---

## 3. LOGGING, HEALTH CHECK VÀ CONFIGURATION

- **Logging**: NestJS built-in Logger ghi nhận chi tiết các luồng giao dịch, IP client và sự kiện chuyển trạng thái đơn hàng.
- **Health Check**: `GET /api/v1/health` trả `data.status = 'ok'` qua response wrapper, xác nhận API đang trả lời. Endpoint hiện không đo uptime hoặc kiểm tra kết nối DB; khi kiểm tra DB có thể gọi API đọc sản phẩm riêng.
- **Configuration**: `ConfigModule.forRoot({ isGlobal: true })` đọc biến môi trường/`.env`; hiện chưa có schema validation chung. DB readiness và validation cấu hình là cải tiến có thể cân nhắc ở Sprint 2 nếu cần.

---

## 4. ĐÁNH ĐỔI KIẾN TRÚC (TRADE-OFFS)

1. **Modular Monolith vs Microservices**: Chọn Modular Monolith với NestJS để phân chia nghiệp vụ thành các module có trách nhiệm rõ ràng nhưng triển khai chung trong một ứng dụng. Giải pháp phù hợp với quy mô nhóm 7 người, giảm độ phức tạp triển khai, giao tiếp và quản lý giao dịch so với Microservices. Đánh đổi là các module chưa thể triển khai và mở rộng độc lập.

2. **Monorepo vs Multi-repo**: Chọn Monorepo để quản lý Frontend, Backend và tài liệu trong cùng repository, thuận tiện phối hợp phát triển, kiểm thử và quản lý phiên bản. Đánh đổi là cần quy định rõ phạm vi thay đổi và cấu hình CI để tránh ảnh hưởng giữa các ứng dụng.

3. **State Machine tập trung vs Event-Driven**: Chọn quản lý chuyển trạng thái đơn hàng tập trung trong Backend để kiểm soát các chuyển trạng thái hợp lệ, lưu lịch sử và thuận tiện kiểm thử. Đánh đổi là khi mở rộng sang xử lý bất đồng bộ phức tạp, hệ thống có thể cần bổ sung cơ chế sự kiện hoặc hàng đợi.
