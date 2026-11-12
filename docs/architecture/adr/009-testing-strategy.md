# ADR-009: Chiến Lược Kiểm Thử Đa Tầng (Unit / Integration / E2E Playwright) & Ngưỡng Chất Lượng Tối Thiểu

> **Trạng thái**: Proposed (chuyển Accepted khi PR được Leader duyệt)  
> **Ngày quyết định**: 2026-11-12  
> **Người đề xuất**: Nguyễn Quang Huy (`SP1-08` — Task 3)  
> **Người duyệt**: Minh Chiến (Leader)  
> **Phạm vi áp dụng**: `apps/api` (Jest + Supertest), `apps/web` (Vitest + RTL), `tests/e2e` (Playwright), `.github/workflows/ci.yml`

---

## 1. BỐI CẢNH & VẤN ĐỀ (CONTEXT & PROBLEM STATEMENT)

BrewLite có 22 FR (`FR-01..22`) trải trên 7 file `fr-*.md` do 7 người viết, mỗi FR có nhiều AC. Đề Assignment 2 yêu cầu: mọi AC kiểm chứng được bằng test, CI chặn merge khi test hỏng, E2E chạy được bằng **một lệnh**, và hệ thống chạy thật trên production (Vercel + Render + Supabase, xem [ADR-007](007-hosting.md)).

Hiện trạng trước ADR này:

| Tầng | Đang có | Vấn đề |
| :--- | :--- | :--- |
| Unit API | 13 file `*.spec.ts` (pricing, order-state, payments, promotions, auth, roles guard…) | Không có ngưỡng coverage; tên test không gắn Test Case ID → khó truy vết AC. |
| Integration API | `test/jest-int.json`, `test-helper.ts`, job `integration` trên CI với PostgreSQL service | Mới có `health.int-spec.ts`, `sample.int-spec.ts`; phần lớn TC mức Integration trong [test-scenarios.md](../../requirements/test-scenarios.md) chưa có file. |
| Unit/Component Web | Vitest + jsdom, 2 file test | Chưa phủ `useCartStore` (TC-CART-*) và trang checkout. |
| E2E | Chưa có (`tests/` chưa tồn tại) | Không có bằng chứng luồng đầu-cuối; chưa có chiến lược cho cổng thanh toán ngoài (VNPay Sandbox). |

Ràng buộc kỹ thuật cần giải quyết:
1. **Cổng thanh toán ngoài**: VNPay Sandbox cần URL HTTPS công khai để nhận IPN và phụ thuộc mạng → không thể chạy ổn định trên GitHub Actions runner.
2. **Database dùng chung**: Integration test chạy trên DB thật; nếu test xóa/sửa seed data sẽ làm hỏng test của người khác và dữ liệu demo.
3. **Thời gian**: Sprint 2A chỉ có 1 ngày (13/11/2026) → chiến lược phải tận dụng khung test đã có, không đổi framework.

---

## 2. CÁC PHƯƠNG ÁN ĐÃ XEM XÉT (CONSIDERED OPTIONS)

1. **Phương án A — Kim tự tháp kiểm thử 3 tầng + gateway giả lập trên CI (chọn)**:
   - Unit (Jest/Vitest) là đa số, chạy < 1 phút, không cần DB.
   - Integration (Jest + Supertest + PostgreSQL thật trong service container) cho mọi API contract (mã HTTP, validate, transaction, idempotency).
   - E2E Playwright ít kịch bản, chỉ phủ luồng nghiệp vụ trọng tâm; thanh toán dùng `MockGatewayService` (`gateway: MOCK` + header `X-Mock-Outcome`).
   - VNPay Sandbox được kiểm chứng **thủ công** trên môi trường HTTPS (production/staging) và lưu evidence.
2. **Phương án B — E2E-first (Playwright phủ hầu hết AC)**:
   - Ít code test hơn ở tầng dưới, nhưng chậm (mỗi kịch bản cần build web + API + DB), dễ flaky, khó chỉ ra lỗi nằm ở tầng nào; không kiểm được các nhánh khó dựng qua UI (409 Idempotency khác body, sai chữ ký IPN, race condition kho).
3. **Phương án C — Chỉ Unit test với Prisma mock**:
   - Nhanh nhất nhưng không kiểm được migration, constraint DB, transaction + optimistic locking ([ADR-006](006-order-state-inventory.md)) và hành vi HTTP thật (guard, pipe, filter) → không đủ bằng chứng cho AC dạng "trả về 401/409".
4. **Phương án D — E2E gọi thẳng VNPay Sandbox trên CI**:
   - Phản ánh thực tế nhất nhưng cần tunnel công khai cho IPN, phụ thuộc uptime bên thứ ba, phải đưa `VNPAY_HASH_SECRET` vào runner → vi phạm mục tiêu "CI không phụ thuộc dịch vụ ngoài" và tăng rủi ro lộ secret.

---

## 3. QUYẾT ĐỊNH (DECISION)

Chúng tôi chọn **Phương án A — Kim tự tháp kiểm thử 3 tầng + gateway giả lập trên CI**, vì: (1) tận dụng nguyên khung Jest/Vitest/CI đã có ở Sprint 0; (2) mỗi loại AC được kiểm ở tầng rẻ nhất có thể chứng minh nó; (3) CI xanh/đỏ có tính quyết định, không phụ thuộc mạng ngoài; (4) phần VNPay thật vẫn có bằng chứng qua smoke test thủ công trên HTTPS.

### 3.1. Phân tầng, công cụ và quy ước file

| Tầng | Tỷ lệ mục tiêu (số test) | Công cụ | Quy ước file | Lệnh chạy | Phạm vi kiểm |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Unit — API** | ~60% | Jest + ts-jest, Prisma/ConfigService mock | `apps/api/src/**/*.spec.ts` (cạnh file code) | `npm run test:ci` | Logic thuần: `PricingService`, `assertTransition`/order-state, Promotions, Loyalty, Auth (băm bcrypt), RolesGuard, VNPay helper (ký/verify `vnp_SecureHash`). |
| **Unit/Component — Web** | ~15% | Vitest + React Testing Library + jsdom | `apps/web/src/**/*.test.ts(x)` hoặc `__tests__/` | `npm test` (trong `apps/web`) | `useCartStore` (gộp dòng, tổng tiền, persist `localStorage`), giới hạn 3 topping, giữ giỏ khi thanh toán lỗi, chỉ `clearCart` khi `PAID`. |
| **Integration — API** | ~20% | Jest + Supertest + PostgreSQL 16 thật (CI service / docker compose) | `apps/api/test/**/*.int-spec.ts` | `npm run test:int` | Contract HTTP qua `createNestTestApp()`: mã 200/201/400/401/403/404/409, JWT guard, transaction tạo đơn + trừ kho, Idempotency-Key, IPN sai chữ ký bị từ chối, quyền xem lịch sử đơn. |
| **Concurrency** | (bổ sung) | Jest e2e config / script ts-node | `apps/api/test/*.e2e-spec.ts`, `test/concurrency.ts` | `npm run test:e2e` | `TC-ORDER-03`: bắn đơn song song không âm kho. |
| **E2E — hệ thống** | ~5% | Playwright (Chromium, viewport mobile) | `tests/e2e/**/*.spec.ts`, cấu hình `tests/playwright.config.ts`, `tests/package.json` | `npm --prefix tests run e2e` | Luồng người dùng thật qua trình duyệt (mục 3.4). |

### 3.2. Quy ước Test Case ID (bắt buộc để truy vết)

- Mỗi AC trong `fr-*.md` có **ít nhất 1** Test Case ID dạng `TC-<NHÓM>-<nn>` (`AUTH`, `MENU`, `DETAIL`, `CART`, `ORDER`, `PAY`, `HIST`) trong [test-scenarios.md](../../requirements/test-scenarios.md). Kịch bản E2E dùng `E2E-<nn>`.
- Tên test **phải bắt đầu bằng ID** trong ngoặc vuông để grep được từ ma trận truy vết:
  ```ts
  it('[TC-PAY-03] gửi 2 lần cùng Idempotency-Key chỉ tạo 1 payment', async () => { ... });
  ```
- Một test có thể mang nhiều ID (`[TC-CART-04][TC-PAY-05]`). Không đặt ID ngoài các nhóm trên; ID mới phải thêm vào `test-scenarios.md` trong cùng PR.

### 3.3. Ngưỡng tối thiểu (Quality Gates)

| # | Chỉ số | Ngưỡng | Cách đo / nơi chặn |
| :--- | :--- | :--- | :--- |
| G1 | AC có Test Case ID | **100%** AC trong 7 file `fr-*.md` | Review PR + `test-scenarios.md`; `traceability-matrix.md` không có ô trống. |
| G2 | FR mức **Must** có test tự động chạy trên CI | **100%** (mỗi FR Must ≥ 1 test Unit/Integration/E2E thực thi) | Ma trận truy vết cột "Test ID" trỏ tới file test tồn tại. |
| G3 | Endpoint API trong FR | Mỗi endpoint ≥ **1 case thành công + 1 case lỗi** (4xx) ở tầng Integration | `*.int-spec.ts`. |
| G4 | Line coverage Unit — API toàn cục | **≥ 60%** | `jest --coverage` + `coverageThreshold` trong `apps/api/package.json`. |
| G5 | Coverage module nghiệp vụ lõi (`pricing`, `orders`, `payments`, `promotions`, `auth`) | **Lines ≥ 80%, Branches ≥ 70%** | `coverageThreshold` theo đường dẫn. |
| G6 | Coverage `apps/web/src/store/**` | **Lines ≥ 80%** | `vitest run --coverage` (`@vitest/coverage-v8`). |
| G7 | Kết quả CI | **0 test fail**, không `it.skip`/`it.only` trên `main` | Branch protection: 3 job hiện có + job `e2e` (mục 3.5). ESLint rule `no-only-tests` hoặc review. |
| G8 | E2E | **100% kịch bản E2E-01..03 xanh**; tổng thời gian ≤ 5 phút | Playwright report trên CI (artifact). |
| G9 | Thời gian toàn pipeline CI | ≤ 10 phút | Lịch sử GitHub Actions, ghi ở `docs/evidence/ci.md`. |

> **Lộ trình bật gate coverage (G4–G6)**: Sprint 2A đo baseline bằng `test:cov` ngay buổi sáng 13/11; nếu baseline thấp hơn ngưỡng, Leader bật `coverageThreshold` bằng **giá trị baseline** (không cho phép giảm) và nâng dần lên ngưỡng trên trước khi release `v1.0.0`. Coverage chỉ là chỉ số phụ — G1/G2 (mọi AC có test) là gate chính.

### 3.4. Kịch bản E2E Playwright (tối thiểu)

| ID | Luồng | AC/TC liên quan | Kỳ vọng |
| :--- | :--- | :--- | :--- |
| `E2E-01` | Đăng nhập → menu → chi tiết món, chọn size + topping → thêm giỏ → đặt đơn → thanh toán (`MOCK`, `SUCCESS`) → màn hình xác nhận | FR-02, 07–08, 10–11, 13, 17, 20 | Đơn `PAID`, giỏ được xóa, tổng tiền UI = tổng do backend tính. |
| `E2E-02` | Như E2E-01 nhưng thanh toán `X-Mock-Outcome: FAILED` | FR-19, `AC-12.2`, `TC-CART-04` | Đơn `PAYMENT_FAILED`, **giỏ giữ nguyên**, hiển thị thông báo lỗi. |
| `E2E-03` | Sau E2E-01 → mở "Đơn hàng của tôi" → xem chi tiết đơn vừa đặt | FR-21..22 | Đơn mới nhất hiển thị đúng trạng thái và lịch sử trạng thái. |

Nguyên tắc E2E:
- `baseURL` lấy từ biến `E2E_BASE_URL` (mặc định `http://localhost:3000`) → cùng bộ test chạy được local (docker compose), CI và URL production (Sprint 2B, chỉ chạy E2E-01/03 với tài khoản test riêng).
- Mỗi lần chạy tự đăng ký user mới (`e2e_<uuid>@example.test`), không dùng tài khoản admin/seed.
- Chọn phần tử bằng `getByRole`/`getByTestId`, không dùng CSS selector theo class Tailwind.
- CI: `retries: 1`, `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`; test chỉ xanh sau retry được ghi là **flaky** và phải tạo issue sửa — không được tăng retries để che lỗi.
- **Một lệnh** (local):
  ```bash
  docker compose up -d --build && npm --prefix tests ci && npm --prefix tests run e2e
  ```

### 3.5. Môi trường & cổng thanh toán theo từng tầng

| Môi trường | Unit | Integration | E2E | Cổng thanh toán |
| :--- | :--- | :--- | :--- | :--- |
| Local (dev) | ✅ | ✅ PostgreSQL của `docker compose` | ✅ `docker compose up` | `MOCK` (`NODE_ENV != production` → nhận `X-Mock-Outcome`) |
| CI (GitHub Actions) | ✅ job `api`, `web` | ✅ job `integration` (postgres:16-alpine service) | ✅ job `e2e` mới: build compose stack → Playwright | `MOCK`; VNPay chỉ test helper ký/verify với `VNPAY_HASH_SECRET` **giả** sinh trong test, không gọi mạng ngoài |
| Production (Vercel + Render + Supabase) | — | — | Smoke + E2E-01/03 sau deploy (Sprint 2B) | **VNPay Sandbox** qua HTTPS: thành công, thất bại/hủy, sai chữ ký, IPN lặp — kiểm thủ công, lưu ở `docs/evidence/smoke-test.md` |

### 3.6. Quy tắc dữ liệu test

Áp dụng nguyên văn [apps/api/test/README.md](../../../apps/api/test/README.md): dữ liệu cô lập bằng `generateTestIdentifier()`, không đụng seed data, dọn đúng ID đã ghi trong `TestDataRegistry`, cấm `deleteMany()`/`TRUNCATE` không điều kiện, integration chạy `--runInBand`. Test **không bao giờ** trỏ vào `DATABASE_URL` production; secret trong CI chỉ là giá trị giả dạng `change-me-dev-only`.

---

## 4. HỆ QUẢ (CONSEQUENCES)

### 4.1. Điểm tích cực (Positive / Pros)
- Mỗi AC có đường truy vết `FR → AC → TC-ID → file test → job CI`, grep được bằng ID trong tên test → `traceability-matrix.md` ở Sprint 2B gộp được nhanh, không ô trống.
- CI xác định (deterministic): không phụ thuộc VNPay/Internet, không cần secret thật trên runner.
- Lỗi được bắt ở tầng rẻ nhất: logic giá/state machine ở Unit (mili-giây), contract HTTP/transaction ở Integration, chỉ 3 luồng trọng tâm ở E2E → pipeline giữ được ≤ 10 phút.
- Cùng bộ Playwright tái sử dụng cho production check và video demo.

### 4.2. Điểm hạn chế & Thách thức (Negative / Cons / Trade-offs)
- **Khoảng trống mock ↔ VNPay thật**: CI không chứng minh được redirect/IPN thật của VNPay. Bù lại bằng unit test ký/verify với vector cố định và smoke test thủ công có evidence; rủi ro còn lại được chấp nhận trong phạm vi Assignment 2.
- Job `e2e` cần build cả web + API trên runner → tăng thời gian CI 3–5 phút; nếu vượt G9, chỉ chạy `e2e` trên PR có nhãn `e2e` và trên `main`.
- Thêm phụ thuộc mới (`@playwright/test`, `@vitest/coverage-v8`) và trình duyệt Chromium trên runner (dùng cache `~/.cache/ms-playwright`).
- Ngưỡng coverage có thể dẫn tới viết test "cho đủ số" → G1/G2 (AC-driven) là gate chính, coverage chỉ là chỉ số phụ.
- File chung (`ci.yml`, `apps/api/package.json`, `docker-compose.yml`) do Leader sở hữu → các thay đổi cấu hình ở mục 5.2 phải do Minh Chiến thực hiện.

---

## 5. LIÊN KẾT MÃ NGUỒN & TRUY VẾT (CODE & TRACEABILITY)

### 5.1. Liên kết
- Ánh xạ AC → Test Case ID: [docs/requirements/test-scenarios.md](../../requirements/test-scenarios.md)
- Quy tắc dữ liệu test & helper: [apps/api/test/README.md](../../../apps/api/test/README.md), [apps/api/test/test-helper.ts](../../../apps/api/test/test-helper.ts)
- Cấu hình test: `apps/api/package.json` (khối `jest`), [apps/api/test/jest-int.json](../../../apps/api/test/jest-int.json), [apps/api/test/jest-e2e.json](../../../apps/api/test/jest-e2e.json), [apps/web/vitest.config.mts](../../../apps/web/vitest.config.mts), `tests/playwright.config.ts` (Sprint 2A — `SP2-08`)
- Pipeline: [.github/workflows/ci.yml](../../../.github/workflows/ci.yml) — ADR liên quan: [ADR-005](005-mock-payment-idempotency.md) (gateway + idempotency), [ADR-006](006-order-state-inventory.md) (state machine + kho), [ADR-008](008-cicd.md) (CI/CD)
- Bằng chứng: `docs/evidence/ci.md`, `docs/evidence/smoke-test.md`, `docs/traceability-matrix.md`

### 5.2. Việc cần làm để hiện thực ADR (Sprint 2A)

| Việc | Người làm | File |
| :--- | :--- | :--- |
| Dựng `tests/` (Playwright), viết E2E-01..03, script `e2e` | Quang Huy | `tests/e2e/**`, `tests/package.json`, `tests/playwright.config.ts` |
| Thêm job `e2e` vào CI, bật `coverageThreshold` theo lộ trình 3.3 | Minh Chiến | `.github/workflows/ci.yml`, `apps/api/package.json` |
| Thêm `@vitest/coverage-v8` + `data-testid` cho các nút checkout | Owner web của từng trang | `apps/web/**` |
| Đổi tên test hiện có sang dạng `[TC-xxx-nn] ...`, bổ sung `*.int-spec.ts` cho TC mức Integration | Owner từng module | `apps/api/src/modules/<module>/**`, `apps/api/test/**` |

### 5.3. Review truy vết container (Deployment Diagram → code)

Kết quả rà [deployment-production.puml](../../diagrams/deployment-production.puml) theo yêu cầu `SP1-08` Task 3; các mục ⚠️ được gửi thành comment PR cho người sở hữu (không sửa file người khác).

| Container / node trên sơ đồ | Code / cấu hình hiện thực | Test kiểm chứng | Kết quả |
| :--- | :--- | :--- | :--- |
| Web Application Server (Next.js PWA, Vercel) | `apps/web/**`, `apps/web/public/manifest.webmanifest`, `apps/web/Dockerfile` | Vitest (`apps/web`), E2E-01..03 | ⚠️ Sơ đồ ghi `manifest.json`, file thật là `manifest.webmanifest` → Minh Chiến. |
| NestJS REST API Gateway (Render, port 4000) | `apps/api/src/main.ts`, `app.module.ts`, `modules/**`, `apps/api/Dockerfile` | Unit + Integration API | ✅ |
| Mock Payment Gateway | `apps/api/src/modules/payments/mock-gateway.service.ts` | `payments.service.spec.ts`, TC-PAY-01..05 | ✅ |
| *(thiếu trên sơ đồ)* VNPay Sandbox (bên thứ ba) | `apps/api/src/modules/payments/vnpay/**` (`VNPAY_URL`, `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_RETURN_URL`) | Unit helper ký/verify; smoke test thủ công | ⚠️ Sơ đồ chưa có node VNPay Sandbox + luồng IPN `Render ← VNPay`; note env của Render và `.env.example` thiếu biến `VNPAY_*` → Minh Chiến (sơ đồ, `.env.example`). [ADR-005](005-mock-payment-idempotency.md) vẫn mô tả chỉ có mock → Gia Kiệt cập nhật. |
| Health Monitoring Endpoint (`GET /api/v1/health`) | `apps/api/src/app.controller.ts` (`@Get('health')`) | `apps/api/test/health.spec.ts`, `health.int-spec.ts`, smoke test CD | ✅ |
| Render Log Stream | Log stdout NestJS + `common/interceptors`, `common/filters` | — (kiểm thủ công trên Render) | ✅ (không cần test tự động) |
| Supabase PostgreSQL + PgBouncer | `apps/api/prisma/schema.prisma` (`DATABASE_URL` pooler 6543, `DIRECT_URL` 5432), migrations | Job `integration` (`prisma migrate deploy` trên PostgreSQL 16) | ✅ |
| CI Workflow (`ci.yml`, 3 job) | `.github/workflows/ci.yml` | Chính nó | ⚠️ Tên job thật là "Backend (NestJS) - Lint, Unit Test & Build"… khác nhãn `api/web/integration` trên sơ đồ và ADR-008 → thống nhất tên để cấu hình required checks → Minh Chiến. |
| CD Workflow (`cd.yml`) + GHCR | Chưa có `.github/workflows/cd.yml` | — | ⏳ Kế hoạch Sprint 2A (`cd.yml`) — đúng tiến độ, ghi nhận để kiểm lại cuối Sprint 2A. |
| Local Docker Compose (FE/BE/DB) | `docker-compose.yml` | Dùng làm môi trường E2E local | ✅ |
