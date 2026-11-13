# E2E Playwright — BrewLite (`SP2-08`)

> **Owner**: Nguyễn Quang Huy · **Đặc tả**: [ADR-009](../docs/architecture/adr/009-testing-strategy.md) mục 3.4–3.6

## 1. Chạy bằng một lệnh

Yêu cầu: Docker đang chạy, Node 22 (theo `.nvmrc`).

```bash
npm --prefix tests ci
npm --prefix tests run e2e:install-browsers   # chỉ cần lần đầu trên mỗi máy
npm --prefix tests run e2e:local
```

`e2e:local` ([scripts/e2e-local.mjs](scripts/e2e-local.mjs)) chạy theo vòng đời ở ADR-009 mục 3.4 và trả exit code khác 0 nếu bất kỳ bước nào lỗi:

1. Dựng stack riêng `brewlite-e2e` từ [docker-compose.e2e.yml](docker-compose.e2e.yml) (Postgres, API, Web), không dùng container/volume của môi trường dev. Web: `http://localhost:3100`, API: `http://localhost:4100/api/v1`.
2. API chỉ chạy `prisma migrate deploy`, không chạy seed.
3. Setup fixture ([fixtures/setup.cjs](fixtures/setup.cjs)) tạo dữ liệu riêng của lượt chạy và ghi `tests/.e2e-run/<runId>/manifest.json`.
4. Playwright chạy các kịch bản ở mục 2 (Chromium, khung mobile). User/đơn/giao dịch tạo qua UI được ghi vào `created.jsonl` cùng thư mục.
5. Teardown ([fixtures/teardown.cjs](fixtures/teardown.cjs)) luôn chạy khi stack đã lên, kể cả khi test lỗi: xóa theo manifest, kiểm tra không còn dữ liệu của runId, ghi `teardown.json`. Teardown lỗi thì lượt chạy không đạt.
6. Dừng stack và xóa volume E2E.

## 2. Kịch bản (ADR-009 mục 3.4)

| ID | File | Kiểm tra chính |
| :--- | :--- | :--- |
| `E2E-01` | [checkout-success-history.spec.ts](e2e/checkout-success-history.spec.ts) | Đăng ký user mới → menu → chi tiết món fixture, chọn size M + topping → giỏ → đặt đơn → cổng `MOCK`, mô phỏng thành công → `/orders/<id>?paid=1`. Đơn `PAID`, giỏ được xóa, tổng tiền UI bằng tổng backend tính. |
| `E2E-02` | [payment-failure.spec.ts](e2e/payment-failure.spec.ts) | User mới riêng, như E2E-01 tới trang thanh toán, mô phỏng lỗi (`X-Mock-Outcome: FAILED`): `POST /payments` trả `FAILED`, vẫn ở trang thanh toán có thông báo lỗi, giỏ giữ nguyên; hủy đơn → về `/cart` còn món, `/orders` hiện "Đã hủy". |
| `E2E-03` | [checkout-success-history.spec.ts](e2e/checkout-success-history.spec.ts) | Chạy nối tiếp E2E-01 trong cùng `describe.serial`, dùng lại user và đơn: mở "Đơn hàng của tôi" → đơn đứng đầu với nhãn "Đã thanh toán" → chi tiết đúng trạng thái hiện tại, món, tổng tiền `finalAmount`, giao dịch thành công. |

Tên test bắt đầu bằng ID trong ngoặc vuông theo ADR-009 mục 3.2 (`[E2E-02][TC-CART-04]`, `[E2E-03][TC-HIST-13]`).

## 3. Dữ liệu test (ADR-009 mục 3.6)

- Mỗi lượt chạy có `runId` riêng (10 ký tự hex). Setup tạo món `e2e_<runId>_ca_phe` (size S/M/L, công thức đủ 3 size), topping `e2e_<runId>_tran_chau` và 3 nguyên liệu `e2e_<runId>_*` với tồn kho đủ cho các kịch bản; không dùng danh mục seed/demo.
- Mỗi kịch bản đăng ký user `e2e_<runId>_<uuid>@example.test`; mật khẩu chỉ giữ trong bộ nhớ của test.
- Script fixture chỉ chạy khi `DATABASE_URL` trỏ tới DB của stack E2E.
- Teardown chỉ xóa theo ID trong manifest; nếu danh mục fixture bị dữ liệu ngoài lượt chạy tham chiếu thì dừng phần đó và báo lỗi.

## 4. Biến môi trường

| Biến | Mặc định | Ý nghĩa |
| :--- | :--- | :--- |
| `E2E_RUN_ID` | ngẫu nhiên | Cố định runId (4–24 ký tự `a-z0-9`) |
| `E2E_WEB_PORT` / `E2E_API_PORT` | `3100` / `4100` | Port trên máy host |

Chạy một kịch bản: `npm --prefix tests run e2e:local -- --grep E2E-02`. Báo cáo HTML: `npm --prefix tests run e2e:report`.

## 5. Trên CI

`.github/workflows/ci.yml` hiện chưa có job `e2e`. Theo ADR-009 mục 5.2, việc thêm job này và đặt làm required check do Minh Chiến thực hiện; theo mục 3.4–3.5, job dùng cùng vòng đời với `e2e:local` và cổng `MOCK`, không gọi VNPay.
