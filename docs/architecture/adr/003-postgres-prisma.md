# ADR-003: Lựa Chọn PostgreSQL và Prisma Migrate Làm Giải Pháp Quản Lý Database

> **Trạng thái**: Accepted  
> **Ngày quyết định**: 2026-11-04 (Cập nhật quy trình vận hành: 2026-11-11)  
> **Người đề xuất**: Vũ Hoàng Huy  
> **Người duyệt**: Phạm Minh Chiến (Leader)  
> **Phạm vi áp dụng**: `apps/api/prisma/**`, `apps/api/src/**`, `.github/workflows/ci.yml`, Production (Render + Supabase)

---

## 1. BỐI CẢNH & VẤN ĐỀ (CONTEXT)

Hệ thống đặt món và thanh toán trực tuyến **BrewLite** cần lưu trữ và xử lý dữ liệu có tính ràng buộc quan hệ chặt chẽ (User, Category, Product, ProductSizePrice, Topping, Ingredient, Recipe, Order, OrderItem, Payment, Promotion, LoyaltyTransaction). Các yêu cầu kỹ thuật cốt lõi đặt ra gồm:

1. **Tính toàn vẹn giao dịch (ACID & Concurrency Safety)**: Luồng đặt hàng trừ tồn kho nguyên liệu (`IngredientStockHelper`), chuyển trạng thái đơn hàng (`OrderService.transition()` với Optimistic Locking) và thanh toán chống trùng lặp (`Idempotency-Key` trong `PaymentsService`) đòi hỏi cơ sở dữ liệu quan hệ mạnh mẽ, hỗ trợ transaction và row-level locking.
2. **An toàn kiểu dữ liệu (Strong Typing & Schema Sync)**: Backend NestJS dùng TypeScript; cần một ORM sinh type tự động từ schema để phát hiện lỗi lệch cột/kiểu ngay tại thời điểm biên dịch (`tsc` / `nest build`), hạn chế lỗi runtime.
3. **Tốc độ phát triển & Quản lý thay đổi lược đồ**: Nhóm 7 thành viên phát triển song song qua 3 Sprint, cần cơ chế **Schema-as-Code** kiểm soát lịch sử thay đổi bảng qua Git và triển khai tự động an toàn từ Local → CI → Production (Supabase).

---

## 2. QUYẾT ĐỊNH (DECISION)

Nhóm quyết định lựa chọn **PostgreSQL 16** làm hệ quản trị cơ sở dữ liệu quan hệ (RDBMS) chính kết hợp **Prisma ORM & Prisma Migrate** làm giải pháp truy vấn và quản lý lược đồ dữ liệu:

1. **Database Engine — PostgreSQL 16**:
   - Local/CI sử dụng image `postgres:16-alpine` (qua `docker-compose.yml` và GitHub Actions service container).
   - Production sử dụng **Supabase Managed PostgreSQL 16** (`sslmode=require`), tách biệt `DATABASE_URL` (cổng `6543` — Transaction Pooler cho runtime NestJS) và `DIRECT_URL` (cổng `5432` — Session/Direct mode phục vụ Prisma Migrate).
2. **ORM & Schema-as-Code — Prisma (`apps/api/prisma/schema.prisma`)**:
   - Toàn bộ cấu trúc bảng, khóa ngoại, index, enum và kiểu tiền tệ `Decimal(12, 0)` (VNĐ nguyên chẵn) được khai báo tập trung trong `schema.prisma`.
   - Sinh Prisma Client strongly-typed thông qua `npx prisma generate` (`postinstall` & `build`).
3. **Quản lý thay đổi lược đồ — Prisma Migrate**:
   - Mọi thay đổi schema bắt buộc phải sinh file SQL migration có kiểm soát phiên bản tại `apps/api/prisma/migrations/`.
   - **Quy tắc bất di bất dịch**: Chỉ dùng `prisma migrate dev` ở Local; trên CI và Production **bắt buộc dùng `prisma migrate deploy`**. Tuyệt đối cấm chạy `prisma db push` hoặc `prisma migrate reset` trên môi trường Staging/Production.

---

## 3. HỆ QUẢ & ĐÁNH GIÁ TÁC ĐỘNG (CONSEQUENCES)

### 3.1. Ưu điểm (Pros)
- **End-to-End Type Safety**: Prisma Client sinh type chính xác cho từng model, enum (`OrderStatus`, `PaymentStatus`, `ProductSize`, `Role`, ...) và truy vấn lồng nhau (`include`/`select`), giảm lỗi sai tên trường hoặc kiểu dữ liệu khi refactor.
- **Developer Experience (DX) cao**: Cú pháp `schema.prisma` trực quan, dễ đọc; hỗ trợ `$transaction` lồng các thao tác nghiệp vụ nguyên tử (`OrdersService`, `PaymentsService`) và tích hợp sẵn `Prisma Studio` để kiểm tra dữ liệu khi debug.
- **Schema-as-Code & Audit Trail rõ ràng**: Mọi thay đổi DDL được lưu thành các thư mục SQL theo timestamp trong `apps/api/prisma/migrations/` (ví dụ: `20261028140000_add_user_role`, `20261031165700_add_payment_gateway`) và được đối chiếu tự động trong bảng hệ thống `_prisma_migrations`.
- **Audit Log nghiệp vụ ở tầng dữ liệu**: Kết hợp bảng `order_status_history`, `order_ingredient_usages` và `loyalty_transactions` giúp truy vết đầy đủ vòng đời đơn hàng, lượng nguyên liệu tiêu hao và biến động điểm thưởng.

### 3.2. Hạn chế & Thách thức (Cons / Trade-offs)
- **Xử lý Raw Query phức tạp**: Một số truy vấn đặc thù (như khóa dòng nâng cao hoặc tổng hợp phức tạp) phải dùng `prisma.$queryRaw` / `prisma.$executeRaw`, làm mất một phần khả năng kiểm tra type tự động và đòi hỏi viết test tích hợp kỹ hơn.
- **Hiệu năng ở quy mô lớn (Scale & Connection Pooling)**:
  - Prisma Client sinh truy vấn phụ hoặc nhiều round-trip nếu lạm dụng `include` lồng sâu (cần tối ưu bằng query gộp như `PricingService` dùng `findMany({ where: { id: { in: [...] } } })` để tránh N+1).
  - Trong môi trường serverless/container với PgBouncer Transaction Mode (cổng `6543`), cần cấu hình tham số pooler phù hợp và tách riêng `DIRECT_URL` (cổng `5432`) cho lệnh migration.
- **Migration Lock & Advisory Lock**:
  - `prisma migrate deploy` dùng PostgreSQL Advisory Lock để ngăn hai tiến trình chạy migration song song; nếu lệnh migration bị ngắt đột ngột hoặc chạy qua Transaction Pooler (không hỗ trợ session-level advisory lock), quá trình deploy có thể bị treo hoặc fail lock.
  - Các lệnh DDL như `ALTER TABLE ... ADD COLUMN ... NOT NULL` hoặc `CREATE INDEX` không kèm `CONCURRENTLY` trên bảng lớn có thể giữ `ACCESS EXCLUSIVE` lock gây nghẽn request trong lúc triển khai.

---

## 4. QUY TRÌNH MIGRATION AN TOÀN TRÊN PRODUCTION (SAFE MIGRATION WORKFLOW)

### 4.1. Luồng chuẩn: Local Dev → CI/CD → Production

```text
[1. Local Dev] prisma migrate dev  ──►  [2. Git PR + CI] prisma migrate deploy + test:int  ──►  [3. Production] DIRECT_URL + prisma migrate deploy
```

#### Bước 1: Phát triển & Tạo Migration tại Local (`apps/api`)
```bash
# 1. Khởi động PostgreSQL sạch qua Docker Compose
docker compose up -d postgres

# 2. Chỉnh sửa apps/api/prisma/schema.prisma và tạo file migration SQL
cd apps/api
npx prisma migrate dev --name add_feature_column

# 3. Kiểm tra lại SQL vừa sinh trong prisma/migrations/<timestamp>_add_feature_column/migration.sql
# 4. Xác minh tính idempotent của toàn bộ chuỗi migration + seed trên DB local sạch
npx prisma migrate reset --force
npx prisma migrate reset --force
```

#### Bước 2: Kiểm tra tự động trên CI Pipeline (`.github/workflows/ci.yml`)
Trong job `integration-test-api`, GitHub Actions khởi tạo container `postgres:16-alpine` sạch và thực thi:
```bash
cd apps/api
npx prisma migrate deploy
npm run test:int
```
Mọi PR vào `main` bị chặn merge nếu migration lỗi hoặc integration test thất bại.

#### Bước 3: Áp dụng lên Production (Render + Supabase)
- `prisma migrate deploy` kết nối qua `DIRECT_URL` (Supabase Session Mode / Direct port `5432`, `sslmode=require`), **không** chạy qua Transaction Pooler cổng `6543`.
```bash
cd apps/api
# Kiểm tra trạng thái trước khi deploy
npx prisma migrate status

# Áp dụng các migration mới chưa chạy (chỉ tiến tới, không reset dữ liệu)
npx prisma migrate deploy
```

---

### 4.2. Chiến lược Zero-Downtime & Backward Compatibility (Expand and Contract)

Để tránh lỗi 500 khi ứng dụng cũ và mới chạy song song trong lúc rolling deploy trên Render, mọi thay đổi phá vỡ tương thích (breaking schema change như đổi tên cột, xóa cột, thêm `NOT NULL`) phải tuân theo mẫu **Expand and Contract (Mở rộng trước — Thu gọn sau)** qua 3 đợt phát hành:

1. **Pha 1 — Expand (Mở rộng tương thích ngược)**:
   - Thêm cột mới ở dạng **nullable (`?`)** hoặc có **`@default(...)`**, thêm bảng mới (ví dụ: bổ sung `Payment.gateway` với `@default(MOCK)`, hoặc thêm `Ingredient`/`ProductRecipe` song song khi đánh dấu `Product.stock`/`Product.version` là `DEPRECATED` trong CR-01).
   - Deploy migration trước; phiên bản Backend cũ vẫn chạy bình thường vì không bị thiếu cột bắt buộc.
2. **Pha 2 — Migrate & Dual-Write / Cutover (Chuyển đổi dữ liệu)**:
   - Deploy Backend mới đọc/ghi trên cấu trúc mới (và ghi song song nếu cần tương thích ngược).
   - Backfill dữ liệu cho các dòng cũ theo từng lô nhỏ (batch) để tránh khóa bảng lâu, sau đó mới gắn ràng buộc `NOT NULL` hoặc `CREATE INDEX CONCURRENTLY`.
3. **Pha 3 — Contract (Thu gọn)**:
   - Khi chắc chắn 100% instance cũ đã tắt và không còn code nào tham chiếu cột cũ, mới tạo migration `DROP COLUMN` trong một PR tách biệt.

---

### 4.3. Phương án Rollback & Xử lý sự cố Migration

- **Nguyên tắc**: Prisma Migrate là **forward-only** (không có lệnh `migrate down` tự động), và **cấm chỉnh sửa nội dung file migration đã merge vào `main`**.
- **Rollback ứng dụng (App Rollback)**: Nhờ tuân thủ *Expand and Contract*, khi code Backend mới gặp lỗi, có thể rollback container trên Render về image tag ổn định trước đó (`v1.0.x` / commit SHA cũ) mà **không cần revert DB**.
- **Xử lý khi một migration thất bại giữa chừng trên Production** (trạng thái `failed` trong `_prisma_migrations`):
  1. Kiểm tra chi tiết lỗi và migration đang kẹt:
     ```bash
     npx prisma migrate status
     ```
  2. Kiểm tra trên Supabase SQL Editor xem câu lệnh DDL nào đã chạy một phần; xử lý thủ công (hoàn tất nốt DDL hoặc hoàn tác DDL dở dang).
  3. Đánh dấu lại trạng thái với Prisma để mở khóa pipeline:
     ```bash
     # Nếu đã hoàn tác các thay đổi SQL dở dang để chạy lại migration đó:
     npx prisma migrate resolve --rolled-back "<timestamp>_<migration_name>"

     # Hoặc nếu đã áp dụng xong thủ công qua SQL:
     npx prisma migrate resolve --applied "<timestamp>_<migration_name>"
     ```
  4. **Rollback dữ liệu khi đã lỡ chạy sai logic/xóa nhầm**: Tạo một **compensating forward migration** mới hoặc khôi phục từ bản sao lưu (Snapshot / Point-in-Time Recovery) của Supabase.

---

## 5. CƠ CHẾ SEED DATA TÁI TẠO MÔI TRƯỜNG

### 5.1. Cấu trúc tệp `apps/api/prisma/seed.ts`
Tệp seed được khai báo trong `apps/api/package.json` (`"prisma": { "seed": "ts-node prisma/seed.ts" }`), thực thi theo thứ tự phụ thuộc khóa ngoại:
1. **Guard kiểm tra tồn tại** (`productCount > 0 && recipeCount > 0 && !force`).
2. **Dọn dữ liệu cũ khi `--force`**: Xóa theo thứ tự bảng con trước, bảng cha sau (`OrderItemTopping` → `OrderItem` → `Payment` → `OrderStatusHistory` → `LoyaltyTransaction` → `Order` → `ProductSizePrice` → `Product` → `Category` → `Topping` → `Promotion` → `User` → `OrderIngredientUsage` → `ProductRecipe` → `ToppingRecipe` → `Ingredient`).
3. **Nạp dữ liệu theo tầng**:
   - Tài khoản `ADMIN` (đọc từ biến môi trường `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_FULL_NAME`) và tài khoản khách hàng demo.
   - `Ingredient` (18 nguyên liệu), `Category` (2 danh mục), `Topping` (3 loại).
   - `Product` (10 sản phẩm) kèm `ProductSizePrice` (`S: +0`, `M: +5000`, `L: +10000`).
   - `ProductRecipe` (theo tỉ lệ size `S: 0.8`, `M: 1.0`, `L: 1.2`) & `ToppingRecipe`.
   - `Promotion` (`WELCOME10`, `GIAM15K`).

### 5.2. Cơ chế Idempotency (Chạy nhiều lần không lỗi / không trùng lặp)
- **Mặc định an toàn (`npx prisma db seed`)**: Nếu DB đã có sẵn sản phẩm và công thức (`productCount > 0 && recipeCount > 0`), script tự động bỏ qua (`return`) và thoát mã `0`, tránh lỗi `Unique constraint failed` khi container khởi động lại (`docker-compose.yml` chạy `npx prisma migrate deploy && npx prisma db seed && node dist/main`).
- **Tái nạp sạch ở Local (`--force`)**: Khi cần làm mới toàn bộ dữ liệu mẫu:
  ```bash
  cd apps/api
  npm run prisma:seed -- --force
  # Hoặc đặt biến môi trường: FORCE_SEED=true npx prisma db seed
  ```
- **Quy tắc cho Integration Tests**: Các test suite (`*.int-spec.ts`) **tuyệt đối không phụ thuộc, sửa hoặc xóa dữ liệu seed**; mỗi suite phải tự sinh dữ liệu riêng bằng UUID/prefix và chỉ xóa bản ghi do chính mình tạo trong `afterAll` bằng điều kiện `where`.

### 5.3. Tách biệt Seed Dữ Liệu Mẫu (Development) & Master Data (Production)

| Tiêu chí | Môi trường Development / Test | Môi trường Production (Supabase) |
| :--- | :--- | :--- |
| **Mục đích** | Tạo đầy đủ dữ liệu mẫu để dev, demo và kiểm thử UI/API (tài khoản `demo@brewlite.test`, 10 món, nguyên liệu test hết hàng `stock = 40`, voucher mẫu). | Chỉ khởi tạo **Master Data / Bootstrap Config** cần thiết để hệ thống vận hành lần đầu (tài khoản Admin gốc, danh mục chuẩn, cấu hình cơ bản). |
| **Cách thức ghi DB** | Cho phép reset toàn bộ bằng `prisma migrate reset --force` hoặc `npm run prisma:seed -- --force`. | **Cấm tuyệt đối** dùng `deleteMany()` không `where` hay `--force`. Bắt buộc dùng `prisma.<model>.upsert({ where: { uniqueKey }, update: {}, create: { ... } })`. |
| **Quản lý Secret** | Dùng giá trị fallback dev-only trong `.env.example` (`change-me-dev-only`). | Bắt buộc nạp `ADMIN_EMAIL` và `ADMIN_PASSWORD` mạnh từ Secret Manager (Render/GitHub Secrets); kiểm tra `if (process.env.NODE_ENV === 'production')` để bỏ qua dữ liệu demo. |

---

## 6. LIÊN KẾT MÃ NGUỒN & TRUY VẾT (CODE & TRACEABILITY)

- **Schema & Migrations**: [apps/api/prisma/schema.prisma](../../../apps/api/prisma/schema.prisma), [apps/api/prisma/migrations/](../../../apps/api/prisma/migrations/)
- **Script Seed**: [apps/api/prisma/seed.ts](../../../apps/api/prisma/seed.ts)
- **Cấu hình CI/CD & Docker**: [.github/workflows/ci.yml](../../../.github/workflows/ci.yml), [docker-compose.yml](../../../docker-compose.yml), [apps/api/Dockerfile](../../../apps/api/Dockerfile)
- **Kiến trúc Hosting & Kết nối DB**: [ADR-007: Kiến trúc triển khai Production](./007-hosting.md), [docs/deployment.md](../../deployment.md)
- **Kiểm chứng Migration/Seed & Test tích hợp**: `apps/api/test/sample.int-spec.ts`, `apps/api/src/modules/pricing/pricing.service.int-spec.ts`
