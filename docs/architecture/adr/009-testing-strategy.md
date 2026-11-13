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
| Unit API | 14 file `*.spec.ts` (13 trong `apps/api/src` + `test/health.spec.ts`): pricing, order-state, orders, cancel, history, payments, promotions, loyalty, auth, roles guard… `payments.service.spec.ts` đã có case cho IPN VNPay (RspCode `97`/`99`/`01`/`04`/`02`, đơn đã `CANCELLED`/`PAID`) nhưng chạy với Prisma mock. | Không có ngưỡng coverage; chỉ `pricing.service.spec.ts` gắn Test Case ID trong tên test → khó truy vết AC. `VnpayGatewayService` (tạo URL, `verifyIpnSignature`) chưa có file spec. |
| Integration API | `test/jest-int.json`, `test-helper.ts`, job `integration-test-api` trên CI với PostgreSQL service | Mới có `health.int-spec.ts`, `sample.int-spec.ts`, `pricing.service.int-spec.ts`; phần lớn TC mức Integration trong các file `fr-*.md` chưa có file test. |
| Concurrency API | `test/orders-concurrency.e2e-spec.ts` (5 test: đặt đơn song song, cùng `Idempotency-Key` song song, hủy đơn sai trạng thái), `test/concurrency.ts` | **Không job CI nào chạy** (`ci.yml` chỉ gọi `test:ci`, `npm test`, `test:int`) → bất biến "không âm kho" (NFR-03) chưa được CI chặn. |
| Unit/Component Web | Vitest + jsdom, 2 file test | Chưa phủ `useCartStore` (TC-CART-*) và trang checkout. |
| E2E | Chưa có (`tests/` chỉ có `.gitkeep`) | Không có bằng chứng luồng đầu-cuối; chưa có chiến lược cho cổng thanh toán ngoài (VNPay Sandbox). |

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
| **Unit — API** | ~60% | Jest + ts-jest, Prisma/ConfigService mock | `apps/api/src/**/*.spec.ts` (cạnh file code) | `npm run test:ci` | Logic thuần: `PricingService`, `assertTransition`/order-state, Promotions, Loyalty, Auth (băm bcrypt), RolesGuard, `PaymentsService` (mock + nhánh IPN VNPay), `VnpayGatewayService` (ký URL, `verifyIpnSignature` với secret giả — cần viết mới). |
| **Unit/Component — Web** | ~15% | Vitest + React Testing Library + jsdom | `apps/web/src/**/*.test.ts(x)` hoặc `__tests__/` | `npm test` (trong `apps/web`) | `useCartStore` (gộp dòng, tổng tiền, persist `localStorage`), giới hạn 3 topping, giữ giỏ khi thanh toán lỗi, chỉ `clearCart` khi `PAID`. |
| **Integration — API** | ~20% | Jest + Supertest + PostgreSQL 16 thật (CI service / docker compose) | `apps/api/**/*.int-spec.ts` (`test/` hoặc cạnh module, theo `testRegex` của `jest-int.json`) | `npm run test:int` | Contract HTTP qua `createNestTestApp()`: mã 200/201/400/401/403/404/409, JWT guard, transaction tạo đơn + trừ kho, Idempotency-Key, quyền sở hữu đơn/giao dịch (mục G3), `GET /payments/vnpay/ipn` trên DB thật (mục G11). |
| **Concurrency — API** | (bổ sung) | Jest (`test/jest-e2e.json`) + Supertest + PostgreSQL thật; script `ts-node` chạy tay | `apps/api/test/*.e2e-spec.ts`; `test/concurrency.ts` | `npm run test:e2e`; `npm run test:concurrency` | `TC-ORDER-03`: bắn đơn song song không âm kho; cùng `Idempotency-Key` song song chỉ tạo 1 payment. Tên script `test:e2e` là của Jest, **không phải** E2E Playwright. Hiện chưa chạy trên CI (mục G10). |
| **E2E — hệ thống** | ~5% | Playwright (Chromium, viewport mobile) | `tests/e2e/**/*.spec.ts`, cấu hình `tests/playwright.config.ts`, `tests/package.json` | `npm --prefix tests run e2e` | Luồng người dùng thật qua trình duyệt (mục 3.4). |

### 3.2. Quy ước Test Case ID (bắt buộc để truy vết)

- Mỗi AC trong `fr-*.md` có **ít nhất 1** Test Case ID dạng `TC-<NHÓM>-<nn>` (`AUTH`, `MENU`, `DETAIL`, `CART`, `ORDER`, `PAY`, `HIST`) trong [test-scenarios.md](../../requirements/test-scenarios.md). Kịch bản E2E dùng `E2E-<nn>`.
- Tên test **phải bắt đầu bằng ID** trong ngoặc vuông để grep được từ ma trận truy vết:
  ```ts
  it('[TC-PAY-03] gửi 2 lần cùng Idempotency-Key chỉ tạo 1 payment', async () => { ... });
  ```
- Một test có thể mang nhiều ID (`[TC-CART-04][TC-PAY-05]`). Không đặt ID ngoài các nhóm trên; ID mới phải thêm vào `test-scenarios.md` trong cùng PR.
- Nguồn gốc của ID là dòng `(Test: TC-…, <loại>)` ngay sau từng AC trong `fr-*.md`; `test-scenarios.md` là bảng tổng hợp và phải khớp với các file đó.
- Loại test của một ID là một trong: `Unit`, `Component`, `Integration`, `Concurrency`, `E2E`, `Review`. ID loại `Review` (ví dụ `TC-ORDER-39` của `AC-16.4`) và ID được chính file FR ghi là chưa chạy được (ví dụ `TC-ORDER-46` của `AC-16.11`, phụ thuộc API hủy đơn `PAID` chưa có) **không phải test tự động**: vẫn tính cho G1, không tính cho G2, và ghi rõ loại ở ma trận truy vết.

### 3.3. Ngưỡng tối thiểu (Quality Gates)

| # | Chỉ số | Ngưỡng | Cách đo / nơi chặn |
| :--- | :--- | :--- | :--- |
| G1 | AC có Test Case ID | **100%** AC trong 7 file `fr-*.md` (mọi loại test, kể cả `Review`) | Review PR + `test-scenarios.md`; `traceability-matrix.md` không có ô trống. |
| G2 | FR mức **Must** có test tự động chạy trên CI | **100%** (mỗi FR Must ≥ 1 test Unit/Component/Integration/Concurrency/E2E thực thi; ID loại `Review` không tính) | Ma trận truy vết cột "Test ID" trỏ tới file test tồn tại. |
| G3 | Endpoint API trong FR | Mỗi endpoint ≥ **1 case thành công + 1 case lỗi** (4xx) ở tầng Integration. Endpoint nhận ID tài nguyên của khách (`GET /orders/:id`, `POST /orders/:id/cancel`, `POST /payments` với `orderId`, `GET /payments/:id`) phải có thêm **1 case khách B dùng ID của khách A → `404`** (đúng hành vi code hiện tại; ví dụ `AC-22.4`/`TC-HIST-18`). | `*.int-spec.ts`. |
| G4 | Line coverage Unit — API toàn cục | **≥ 60%** | `jest --coverage` + `coverageThreshold` trong `apps/api/package.json`. |
| G5 | Coverage module nghiệp vụ lõi (`pricing`, `orders`, `payments`, `promotions`, `auth`) | **Lines ≥ 80%, Branches ≥ 70%** | `coverageThreshold` theo đường dẫn. |
| G6 | Coverage `apps/web/src/store/**` | **Lines ≥ 80%** | `vitest run --coverage` (`@vitest/coverage-v8`). |
| G7 | Kết quả CI | **0 test fail**, không `it.skip`/`it.only` trên `main` | Branch protection: 3 job hiện có + job `e2e` (mục 3.5), cả 4 đều là required check trên mọi PR vào `main`. ESLint rule `no-only-tests` hoặc review. |
| G8 | E2E | **100% kịch bản E2E-01..03 xanh**; tổng thời gian ≤ 5 phút (mục tiêu, chưa đo) | Playwright report trên CI (artifact). |
| G9 | Thời gian toàn pipeline CI | ≤ 10 phút (mục tiêu, chưa đo) | Lịch sử GitHub Actions, ghi ở `docs/evidence/ci.md`. |
| G10 | Concurrency (`TC-ORDER-03`, NFR-03) | `orders-concurrency.e2e-spec.ts` xanh trên CI | Thêm bước `npm run test:e2e` vào job `integration-test-api` (dùng chung PostgreSQL service). Trước khi có bước này, G10 **chưa được CI chặn** và phải chạy tay trước khi merge PR đụng `orders`/`payments`. |
| G11 | Callback VNPay (`GET /payments/vnpay/ipn`) | Tầng Integration, DB thật, ký bằng `VNPAY_HASH_SECRET` giả: sai chữ ký → `97`; không tìm thấy giao dịch → `01`; lệch số tiền → `04`; IPN lặp → `02` và không cộng điểm lần hai; IPN thành công khi đơn đã `CANCELLED` → `00`, đơn giữ nguyên, payment ghi `failureReason` "Cần hoàn tiền thủ công" | `*.int-spec.ts` của module `payments`. Các mã trên là hành vi hiện có của `PaymentsService.handleVnpayIpn` (đang chỉ có unit test với Prisma mock). `fr-payment.md` chưa có AC/TC ID cho VNPay nên G1/G2 không nhìn thấy phần này — xem mục 5.4. |

> **Retry và flaky**: Jest và Vitest không cấu hình retry, nên một test Unit/Integration/Concurrency fail là CI đỏ. Chỉ Playwright có `retries: 1` (mục 3.4); test xanh sau retry không chặn merge nhưng bắt buộc có issue.

> **Lộ trình bật gate coverage (G4–G6)**: Sprint 2A đo baseline bằng `test:cov` ngay buổi sáng 13/11; nếu baseline thấp hơn ngưỡng, Leader bật `coverageThreshold` bằng **giá trị baseline** (không cho phép giảm) và nâng dần lên ngưỡng trên trước khi release `v1.0.0`. Coverage chỉ là chỉ số phụ — G1/G2 (mọi AC có test) là gate chính.

### 3.4. Kịch bản E2E Playwright (tối thiểu)

| ID | Luồng | AC/TC liên quan | Kỳ vọng |
| :--- | :--- | :--- | :--- |
| `E2E-01` | Đăng ký user mới + đăng nhập → menu → chi tiết món, chọn size + topping → thêm giỏ → đặt đơn → trang `/checkout/payment`, cổng `MOCK` (mặc định), bấm nút "Mô phỏng: … thành công" trong `MockGatewayModal` → `/orders/<id>?paid=1` | FR-02, 07–08, 10–11, 13, 17, 20 | Đơn `PAID`, giỏ được xóa, tổng tiền UI = tổng do backend tính. |
| `E2E-02` | User mới riêng; như E2E-01 đến trang thanh toán, bấm nút mô phỏng lỗi trong `MockGatewayModal` (UI tự gửi `X-Mock-Outcome: FAILED`) → sau khi kiểm tra, bấm "Hủy đơn hàng này" | FR-19, `AC-12.2`, `TC-CART-04` | Response `POST /payments` có `status = FAILED`; vẫn ở trang thanh toán và hiển thị thông báo lỗi; **giỏ giữ nguyên**. Sau khi hủy: về `/cart`, giỏ vẫn còn món, `/orders` hiện đơn với nhãn "Đã hủy" (hủy đơn hoàn nguyên liệu nên E2E-02 không để lại đơn giữ kho). |
| `E2E-03` | Chạy tiếp ngay sau E2E-01, **cùng file và cùng `test.describe.serial`**, dùng lại user và đơn của E2E-01 → mở "Đơn hàng của tôi" → xem chi tiết đơn vừa đặt | FR-21..22, `AC-21.13`, `TC-HIST-13` | Đơn vừa đặt đứng đầu danh sách với nhãn "Đã thanh toán"; trang `/orders/<id>` hiển thị đúng trạng thái hiện tại ("Đã thanh toán"), các món, tổng tiền bằng `finalAmount` và lần thanh toán `SUCCESS`. Không kiểm tra lịch sử chuyển trạng thái (FR-22 chỉ hiển thị trạng thái hiện tại, API không trả `statusHistory`). |

Phạm vi E2E-02 dừng ở "thất bại → giữ giỏ → hủy đơn". Nhánh **thử lại** (`PAYMENT_FAILED → PENDING → PAID`, không trừ kho lần hai, không cộng điểm khi thất bại) được kiểm ở tầng dưới: `payments.service.spec.ts` (đã có) và `AC-16.7`/`TC-ORDER-42`, `AC-15.11`/`TC-ORDER-35` (Integration). Kỳ vọng về kho theo code và `fr-order.md` quy tắc 8: đơn `PAYMENT_FAILED` **vẫn giữ** nguyên liệu, chỉ hoàn khi `CANCELLED`.

Nguyên tắc E2E:
- `baseURL` lấy từ biến `E2E_BASE_URL` (mặc định `http://localhost:3000`) → cùng bộ test chạy được local (docker compose), CI và URL production (Sprint 2B).
- Trên production chỉ chạy E2E-01/03 (`npm --prefix tests run e2e -- --grep-invert "E2E-02"`): khi `NODE_ENV=production`, API bỏ qua `X-Mock-Outcome` và cổng `MOCK` luôn trả `SUCCESS`, nên E2E-02 không thể tạo được thanh toán lỗi ở đó. Thanh toán lỗi/hủy trên production được kiểm thủ công qua VNPay Sandbox (mục 3.5).
- Mỗi lần chạy có `runId` duy nhất; script setup tạo món, topping và nguyên liệu test riêng, trả về ID/tên để Playwright chọn đúng fixture. Playwright tự đăng ký user mới (`e2e_<runId>_<uuid>@example.test`) và ghi lại ID user/đơn đã tạo vào manifest của lượt chạy, không dùng tài khoản hay danh mục seed. E2E-01 và E2E-03 dùng chung một user trong cùng nhóm serial; E2E-02 dùng user riêng. Không file spec nào phụ thuộc file khác. Mỗi lần retry cũng phải ghi đầy đủ dữ liệu phát sinh để teardown dọn được.
- E2E-03 phụ thuộc E2E-01 chỉ trong phạm vi một nhóm `test.describe.serial`: Playwright bỏ qua E2E-03 nếu E2E-01 fail và khi retry thì chạy lại cả nhóm từ đầu.
- Chọn phần tử bằng `getByRole`/`getByTestId`, không dùng CSS selector theo class Tailwind.
- CI: `retries: 1`, `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`; test chỉ xanh sau retry được ghi là **flaky** và phải tạo issue sửa — không được tăng retries để che lỗi.
- **Một lệnh** (local; script được bổ sung ở `SP2-08`):
  ```bash
  npm --prefix tests ci && npm --prefix tests run e2e:local
  ```
  `e2e:local` dựng stack riêng bằng `tests/docker-compose.e2e.yml` (container, port và volume riêng), chờ API/Web sẵn sàng, chạy setup fixture → Playwright → teardown trong `finally`, rồi dừng stack test. Lệnh không dùng container/volume của môi trường dev và không chạy `prisma db seed`. Job E2E trên CI dùng cùng vòng đời; lỗi setup hoặc teardown phải làm lệnh/job thất bại.

### 3.5. Môi trường & cổng thanh toán theo từng tầng

| Môi trường | Unit | Integration | E2E | Cổng thanh toán |
| :--- | :--- | :--- | :--- | :--- |
| Local (dev) | ✅ | ✅ PostgreSQL dành cho integration test | Stack E2E riêng qua `e2e:local`, DB và fixture riêng (mục 3.6) | `MOCK` (`NODE_ENV=development` của API test → nhận `X-Mock-Outcome`) |
| CI (GitHub Actions) | ✅ job `lint-and-test-api`, `lint-and-test-web` | ✅ job `integration-test-api` (postgres:16-alpine service) | Job `e2e` mới: build stack test riêng → setup fixture → Playwright → teardown, DB riêng cho từng job | `MOCK`; VNPay chỉ test ký/verify và IPN với `VNPAY_HASH_SECRET` **giả** sinh trong test, không gọi mạng ngoài |
| Production (Vercel + Render + Supabase) | — | — | Smoke + E2E-01/03 sau deploy (Sprint 2B), dùng user/món/nguyên liệu test riêng và setup/teardown theo mục 3.6; cổng `MOCK` luôn trả `SUCCESS`, theo FR-17 | **VNPay Sandbox** qua HTTPS: thành công, thất bại/hủy, sai chữ ký, IPN lặp — kiểm thủ công với cùng quy tắc fixture riêng, lưu ở `docs/evidence/smoke-test.md` |

### 3.6. Quy tắc dữ liệu test

**Unit / Integration / Concurrency (API)** — áp dụng nguyên văn [apps/api/test/README.md](../../../apps/api/test/README.md): dữ liệu cô lập bằng `generateTestIdentifier()`, không đụng seed data, dọn đúng ID đã ghi trong `TestDataRegistry`, cấm `deleteMany()`/`TRUNCATE` không điều kiện, integration chạy `--runInBand`. Các tầng này **không bao giờ** kết nối tới `DATABASE_URL` production; secret trong CI chỉ là giá trị giả dạng `change-me-dev-only`.

**E2E Playwright** — trình duyệt chỉ thao tác qua web. Dữ liệu test được tạo và dọn bằng script setup/teardown quản trị riêng trong `tests/fixtures/**`, dùng Prisma phía Node.js; không thêm API chỉ phục vụ test và không đưa kết nối DB vào Playwright/browser.

- **Dữ liệu riêng cho từng lượt chạy:** setup tạo `runId`, món, size, topping, công thức và nguyên liệu riêng với tiền tố `e2e_<runId>`. Tồn kho fixture đủ cho kịch bản và retry; không sử dụng món/nguyên liệu seed hay demo để tạo đơn test và không sửa/xóa các bản ghi đó. Playwright có thể xem menu chung nhưng chỉ chọn món thuộc fixture của lượt chạy. Manifest ghi chính xác ID đã tạo; Playwright bổ sung ID user, đơn và giao dịch phát sinh qua UI.
- **Local và CI:** `tests/docker-compose.e2e.yml` dựng API/Web trên PostgreSQL riêng cho E2E, với container/port/volume tách khỏi dev và job integration. Chỉ chạy `prisma migrate deploy` trên DB test rồi setup fixture; không chạy seed toàn hệ thống và không dựa vào việc khởi động lại backend để reset dữ liệu.
- **Production:** script quản trị chuẩn bị fixture riêng trên deployment HTTPS; Playwright chỉ đặt các món test dùng nguyên liệu test. E2E-01/03 và kiểm tra VNPay thủ công phải ghi `runId`, `orderNumber` và kết quả teardown vào `docs/evidence/production-check.md` / `docs/evidence/smoke-test.md`. Chỉ chạy sau deploy khi setup/teardown đã được triển khai và kiểm chứng ở local/CI; không dùng việc giới hạn số lần chạy để thay thế dọn dữ liệu.
- **Dọn cả khi test lỗi hoặc retry:** teardown chạy trong `finally` sau khi các browser context đã đóng, kể cả đơn ở `PENDING`, `PAID`, `PAYMENT_FAILED` hoặc `CANCELLED`. Script xóa các bản ghi con (payment, lịch sử trạng thái, loyalty, usage, item/topping) theo đúng ID/quan hệ thuộc manifest trước khi xóa đơn, user và danh mục/nguyên liệu fixture theo thứ tự khóa ngoại. Xóa đơn `PAID` trong fixture không cần mở thêm API hủy `PAID`; tồn kho demo/khách hàng không bị trừ hay hoàn vì fixture dùng nguyên liệu riêng.
- **Phạm vi truy cập:** credentials DB của script được cấu hình riêng ngoài repo và không in ra log hay truyền cho browser. Local/CI chỉ được trỏ tới DB test; cấu hình production dành riêng cho script quản trị fixture do Minh Chiến quản lý. Mọi thao tác xóa có điều kiện theo manifest; nếu một bản ghi fixture có tham chiếu từ dữ liệu ngoài lượt chạy thì dừng phần dọn liên quan và báo lỗi, không mở rộng điều kiện xóa.
- **Bằng chứng hoàn tất:** sau teardown, kiểm tra không còn user/đơn/giao dịch và fixture của `runId`. Lỗi dọn dữ liệu phải làm lệnh/job thất bại và được ghi trong evidence; không ghi nhận E2E đạt khi còn dữ liệu test chưa dọn. Đây là kế hoạch hiện thực ở `SP2-08`; PR `SP1-08` này chỉ chốt ADR, chưa thêm script hay chạy E2E trên production.

---

## 4. HỆ QUẢ (CONSEQUENCES)

### 4.1. Điểm tích cực (Positive / Pros)
- Mỗi AC có đường truy vết `FR → AC → TC-ID → file test → job CI`, grep được bằng ID trong tên test → `traceability-matrix.md` ở Sprint 2B gộp được nhanh, không ô trống.
- CI xác định (deterministic): không phụ thuộc VNPay/Internet, không cần secret thật trên runner.
- Lỗi được bắt ở tầng rẻ nhất: logic giá/state machine ở Unit (mili-giây), contract HTTP/transaction ở Integration, chỉ 3 luồng trọng tâm ở E2E → pipeline giữ được ≤ 10 phút.
- Cùng bộ Playwright tái sử dụng cho production check và video demo.

### 4.2. Điểm hạn chế & Thách thức (Negative / Cons / Trade-offs)
- **Khoảng trống mock ↔ VNPay thật**: CI không chứng minh được redirect/IPN thật của VNPay và không có E2E tự động nào đi qua nhánh VNPay của UI (trang `/payment/vnpay-return`, thời điểm `clearCart`). Bù lại bằng unit test IPN đã có, test ký/verify và Integration IPN theo G11, cùng smoke test thủ công có evidence; rủi ro còn lại được chấp nhận trong phạm vi Assignment 2.
- **Setup/teardown E2E cần thêm script quản trị fixture** và cấu hình DB theo môi trường (mục 3.6). Production vẫn tạo user/đơn test qua API, nhưng chỉ tác động món/nguyên liệu riêng của lượt chạy và phải dọn cả khi test lỗi; việc đối soát manifest và xử lý đúng thứ tự khóa ngoại làm tăng công việc ở `SP2-08`.
- Job `e2e` cần build cả web + API trên runner → ước tính tăng thời gian CI 3–5 phút (chưa đo). Job này luôn là required check; nếu vượt G9 thì tối ưu (cache trình duyệt, cache Docker layer) hoặc nâng ngưỡng G9 bằng cách cập nhật ADR này — không chuyển `e2e` thành job chạy theo nhãn, vì required check không chạy sẽ treo PR còn bỏ required thì mất gate G7.
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
| Dựng `tests/` (Playwright), viết E2E-01..03, script `e2e`/`e2e:local`, stack E2E riêng và setup/teardown fixture có manifest; kiểm chứng dọn dữ liệu khi test lỗi/retry | Quang Huy (`SP2-08`) | `tests/e2e/**`, `tests/fixtures/**`, `tests/docker-compose.e2e.yml`, `tests/package.json`, `tests/playwright.config.ts` |
| Thêm job `e2e` vào CI và đặt làm required check; thêm bước `npm run test:e2e` vào job `integration-test-api` (G10); bật `coverageThreshold` theo lộ trình 3.3 | Minh Chiến | `.github/workflows/ci.yml`, `apps/api/package.json` |
| Thêm `@vitest/coverage-v8` + `data-testid` cho các nút checkout (hiện `apps/web/src` chưa có `data-testid` nào ngoài file test mẫu) | Owner web của từng trang | `apps/web/**` |
| Đổi tên test hiện có sang dạng `[TC-xxx-nn] ...`, bổ sung `*.int-spec.ts` cho TC mức Integration và case quyền sở hữu theo G3 | Owner từng module | `apps/api/src/modules/<module>/**`, `apps/api/test/**` |
| Viết spec cho `VnpayGatewayService` và Integration test IPN theo G11; bổ sung AC + TC ID cho VNPay vào `fr-payment.md` | Gia Kiệt (`SP2-07`) | `apps/api/src/modules/payments/**`, `docs/requirements/fr-payment.md` |
| Cấu hình credentials và tổ chức chạy script fixture trên production; lưu `runId`, đơn test và kết quả teardown sau E2E/manual VNPay | Minh Chiến (cấu hình/quản trị), Quang Huy (E2E), Gia Kiệt (manual VNPay) | Cấu hình môi trường ngoài repo; `docs/evidence/production-check.md`, `docs/evidence/smoke-test.md` |
| Đồng bộ `test-scenarios.md` với các TC ID đã khai báo trong `fr-*.md` (hiện mới có 41 ID; thiếu ví dụ `TC-HIST-13`, `TC-ORDER-42`) | Quang Huy | `docs/requirements/test-scenarios.md` |

### 5.3. Review truy vết container (Deployment Diagram → code)

Kết quả rà [deployment-production.puml](../../diagrams/deployment-production.puml) theo yêu cầu `SP1-08` Task 3; các mục ⚠️ được gửi thành comment PR cho người sở hữu (không sửa file người khác).

| Container / node trên sơ đồ | Code / cấu hình hiện thực | Test kiểm chứng | Kết quả |
| :--- | :--- | :--- | :--- |
| Web Application Server (Next.js PWA, Vercel) | `apps/web/**`, `apps/web/public/manifest.webmanifest`, `apps/web/Dockerfile` | Vitest (`apps/web`), E2E-01..03 | ⚠️ Sơ đồ ghi `manifest.json`, file thật là `manifest.webmanifest` → Minh Chiến. |
| NestJS REST API Gateway (Render, port 4000) | `apps/api/src/main.ts`, `app.module.ts`, `modules/**`, `apps/api/Dockerfile` | Unit + Integration API | ✅ |
| Mock Payment Gateway | `apps/api/src/modules/payments/mock-gateway.service.ts` | `payments.service.spec.ts`, TC-PAY-01..05 | ✅ |
| *(thiếu trên sơ đồ)* VNPay Sandbox (bên thứ ba) | `apps/api/src/modules/payments/vnpay/**` (`VNPAY_URL`, `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_RETURN_URL`) | `payments.service.spec.ts` (nhánh IPN, Prisma mock); chưa có spec cho `VnpayGatewayService`; smoke test thủ công | ⚠️ Sơ đồ chưa có node VNPay Sandbox + luồng IPN `Render ← VNPay`; note env của Render và `.env.example` thiếu biến `VNPAY_*` → Minh Chiến (sơ đồ, `.env.example`). [ADR-005](005-mock-payment-idempotency.md) vẫn mô tả chỉ có mock → Gia Kiệt cập nhật. |
| Health Monitoring Endpoint (`GET /api/v1/health`) | `apps/api/src/app.controller.ts` (`@Get('health')`) | `apps/api/test/health.spec.ts`, `health.int-spec.ts`, smoke test CD | ✅ |
| Render Log Stream | Log stdout NestJS + `common/interceptors`, `common/filters` | — (kiểm thủ công trên Render) | ✅ (không cần test tự động) |
| Supabase PostgreSQL + PgBouncer | `apps/api/prisma/schema.prisma` (`DATABASE_URL` pooler 6543, `DIRECT_URL` 5432), migrations | Job `integration` (`prisma migrate deploy` trên PostgreSQL 16) | ✅ |
| CI Workflow (`ci.yml`, 3 job) | `.github/workflows/ci.yml` | Chính nó | ⚠️ Tên job thật là "Backend (NestJS) - Lint, Unit Test & Build"… khác nhãn `api/web/integration` trên sơ đồ và ADR-008 → thống nhất tên để cấu hình required checks → Minh Chiến. |
| CD Workflow (`cd.yml`) + GHCR | Chưa có `.github/workflows/cd.yml` | — | ⏳ Kế hoạch Sprint 2A (`cd.yml`) — đúng tiến độ, ghi nhận để kiểm lại cuối Sprint 2A. |
| Local Docker Compose (FE/BE/DB) | `docker-compose.yml` | Dev local; E2E dùng stack riêng `tests/docker-compose.e2e.yml` (mục 3.6) | ✅ cho dev; stack E2E riêng triển khai ở `SP2-08`. |

### 5.4. Sai lệch docs ↔ code ghi nhận khi viết ADR

Các điểm dưới đây ảnh hưởng tới kỳ vọng của test; ADR này lấy **code hiện tại** làm chuẩn và gửi comment PR cho người sở hữu (không sửa file người khác).

| Sai lệch | Code hiện tại | Gửi cho |
| :--- | :--- | :--- |
| `srs.md` dòng FR-19 ghi "hoàn trả tồn kho nguyên liệu" khi thanh toán lỗi | `PaymentsService` không đụng tồn kho; đơn `PAYMENT_FAILED` vẫn giữ nguyên liệu, chỉ hoàn khi `CANCELLED` (`CancelOrderService`, khớp `fr-order.md` quy tắc 8) | Minh Chiến (`srs.md`) |
| `fr-payment.md` không có AC/TC ID nào cho VNPay | Code có `gateway: VNPAY`, `GET /payments/vnpay/ipn`, trang `/payment/vnpay-return` | Gia Kiệt |
| Bảng truy vết của `fr-payment.md` gán FR-19 → `TC-PAY-03`, FR-20 → `TC-PAY-04` | Trong `test-scenarios.md`, `TC-PAY-03`/`04` là case Idempotency-Key (`AC-18.2`/`18.3`); lỗi thanh toán là `TC-PAY-05` | Gia Kiệt |
| `mock-gateway.service.ts` tham chiếu `TC-PAY-19` trong comment | ID này chưa có trong `fr-payment.md` và `test-scenarios.md` | Gia Kiệt |
| Quy tắc 10–11 của kế hoạch: không hard-code credential, không phụ thuộc tunnel | `payments.service.ts` còn hard-code email/mật khẩu trang quản trị VNPay Sandbox, in ra log khi khởi động và trả qua `GET /payments/vnpay/tunnel-info` (không có guard); còn gọi `http://tunnel:20241/metrics` dù `docker-compose.yml` không có service `tunnel` | Gia Kiệt, Minh Chiến |
