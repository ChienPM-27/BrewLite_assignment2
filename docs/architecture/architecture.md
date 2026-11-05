# KIẾN TRÚC TỔNG THỂ HỆ THỐNG BREWLITE (C4 CONTAINER LEVEL)

> **Người phụ trách**: Nhật Lan  
> **Mã Task**: `SP1-03` (Task 3.1)  
> **Sơ đồ liên quan**: `docs/architecture/c4-container.puml`, `c4-container.svg`

---

## 1. TỔNG QUAN KIẾN TRÚC (C4 CONTAINER OVERVIEW)

Hệ thống BrewLite được thiết kế theo mô hình phân tầng hiện đại (Modern Layered Monorepo Architecture) nhằm tối ưu khả năng mở rộng, độc lập kiểm thử và dễ dàng triển khai.

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
                │
                ▼ (Prisma ORM - Connection Pooler / Direct)
[ Database (PostgreSQL 16 - Supabase) ]
```

---

## 2. CÁC THÀNH PHẦN CONTAINER CHÍNH

### 2.1. Frontend Web & PWA (`apps/web`)
- **Công nghệ**: Next.js 15 (App Router), React 19, Tailwind CSS, Zustand, Vitest.
- **Vai trò**: Cung cấp giao diện gọi món tối ưu cho thiết bị di động, quản lý giỏ hàng cục bộ bền vững qua Zustand `persist`, xử lý giao diện PWA (Progressive Web App).

### 2.2. Backend API Gateway & Services (`apps/api`)
- **Công nghệ**: NestJS 11, TypeScript, Prisma ORM, Passport JWT, Jest.
- **Kiến trúc Module**:
  - `auth`: Xác thực, cấp phát JWT, băm mật khẩu `bcrypt`.
  - `products`: Quản lý danh mục, danh sách đồ uống, kiểm tra nguyên liệu.
  - `pricing`: Tính giá linh hoạt theo size và topping.
  - `orders`: Xử lý tạo đơn, trừ tồn kho nguyên liệu công thức và kiểm soát vòng đời đơn qua State Machine.
  - `payments`: Tích hợp cổng thanh toán mô phỏng (Mock Gateway) với cơ chế `Idempotency-Key`.
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
- **Health Check**: Tuyến `/api/v1/health` cung cấp thông tin uptime và khả năng kết nối cơ sở dữ liệu phục vụ giám sát container và CD pipeline.
- **Configuration**: Module `@nestjs/config` đọc biến môi trường từ `.env` với validation chặt chẽ.

---

## 4. ĐÁNH ĐỔI KIẾN TRÚC (TRADE-OFFS)

1. **Monorepo vs Microservices**: Chọn Monorepo vì quy mô nhóm 7 người, đơn giản hóa quy trình CI/CD và chia sẻ contract giữa frontend/backend mà không tốn chi phí quản lý nhiều cluster.
2. **State Machine tập trung vs Event-Driven**: Chọn kiểm soát trạng thái đơn tập trung tại `OrderService.transition()` để đảm bảo tính bất biến và dễ viết test assertion so với kiến trúc phân tán.
