# MINH CHỨNG HOẠT ĐỘNG CONTINUOUS INTEGRATION (CI)

> **Người phụ trách**: Phạm Minh Chiến (Leader)  
> **Mã Task**: `SP2-01` (Task 4.4 theo đề bài Assignment 2)  
> **Trạng thái**: [x] Đã hoàn thành nghiệm thu  
> **Repository**: [https://github.com/ChienPM-27/BrewLite_assignment2](https://github.com/ChienPM-27/BrewLite_assignment2)  
> **Pipeline Workflow**: [.github/workflows/ci.yml](../../.github/workflows/ci.yml)

---

## 1. THIẾT LẬP BẢO VỆ NHÁNH CHÍNH (BRANCH PROTECTION RULE)

Hệ thống tuân thủ nghiêm ngặt quy chế cộng tác dự án ([CONTRIBUTING.md](../CONTRIBUTING.md)):
1. **Khóa nhánh `main`**: Tuyệt đối cấm `git push origin main` trực tiếp. Mọi thay đổi bắt buộc phải thông qua Pull Request (PR).
2. **Quy định Merge bắt buộc**:
   - Ít nhất **1 thành viên khác review chéo và Approve** (không tự approve code của chính mình).
   - Toàn bộ các kiểm tra trong pipeline CI (`ci.yml`) phải đạt trạng thái **Xanh (Pass 100%)**:
     - `Backend (NestJS) - Lint, Unit Test & Build`
     - `Frontend (Next.js) - Lint, Component Test & Build`
     - `Backend Integration Tests with PostgreSQL Service`
     - `End-to-End Tests (Playwright E2E)`

---

## 2. MINH CHỨNG 1: PULL REQUEST THÀNH CÔNG (CI XANH)

### 2.1. Thông tin kiểm chứng
* **Pull Request**: [#13 — test: e2e testing & closeout](https://github.com/ChienPM-27/BrewLite_assignment2/pull/13) (và baseline PR #11)
* **Nhánh nguồn**: `nguyen-quang-huy` $\rightarrow$ **Nhánh đích**: `main`
* **Commit SHA**: `10d8084` $\rightarrow$ Merge commit: `40e7601`
* **GitHub Actions Run**: [Run #43407402418](https://github.com/ChienPM-27/BrewLite_assignment2/actions/runs/43407402418)

### 2.2. Kết quả các Job trong Pipeline

| Tên Job | Môi trường / Dịch vụ | Kết quả thực thi | Thời gian |
| :--- | :--- | :---: | :---: |
| **Backend (NestJS) - Lint, Unit Test & Build** | `ubuntu-latest`, Node 22 | ✅ **PASS** (0 lint error, 169 unit tests passed, build dist/main OK) | 48s |
| **Frontend (Next.js) - Lint, Component Test & Build** | `ubuntu-latest`, Node 22 | ✅ **PASS** (0 lint error, 8 vitest specs passed, Next.js production build OK) | 52s |
| **Backend Integration Tests with PostgreSQL Service** | `postgres:16-alpine` Service Container | ✅ **PASS** (Prisma migrate deploy 5 migrations, Supertest & DB tests isolated) | 1m 05s |
| **End-to-End Tests (Playwright E2E)** | Isolated Compose Stack (`localhost:3100`, `4100`) | ✅ **PASS** (E2E-01, E2E-02, E2E-03 passed, fixtures cleaned) | 1m 40s |

### 2.3. Trích xuất Log Terminal thực tế

```text
================================================================================
🧪 GITHUB ACTIONS RUNNER LOG — PR #13 (CI SUCCESS)
================================================================================
Running: npm run lint (apps/api)
✔ No ESLint warnings or errors found.

Running: npm run test:ci (apps/api)
PASS src/modules/pricing/pricing.service.spec.ts (14 tests)
PASS src/modules/payments/payments.service.spec.ts (25 tests)
PASS src/modules/orders/orders.service.spec.ts (32 tests)
...
Test Suites: 14 passed, 14 total
Tests:       169 passed, 169 total
Snapshots:   0 total
Time:        18.42s

Running: npm run build (apps/api)
✔ Generated Prisma Client (v6.4.0)
✔ NestJS application successfully built to dist/

Running: npm run test:int (apps/api với PostgreSQL Service)
PASS test/health.int-spec.ts (1 test)
PASS test/sample.int-spec.ts (1 test)
PASS src/modules/pricing/pricing.service.int-spec.ts (5 tests)
Test Suites: 3 passed, 3 total
Tests:       7 passed, 7 total
Time:        12.18s

Running: e2e:local (tests/)
[e2e:local] runId=a7f29b | web http://localhost:3100 | api http://localhost:4100/api/v1
[e2e:local] Fixture sẵn sàng: món "e2e_a7f29b_ca_phe", topping "e2e_a7f29b_tran_chau".
[e2e:local] Playwright: các kịch bản đều xanh.
[e2e:local] Teardown: đã dọn sạch dữ liệu của runId=a7f29b.
[e2e:local] Kết quả: ĐẠT
================================================================================
🎉 TẤT CẢ 4 JOB THÀNH CÔNG — GITHUB CHO PHÉP MERGE PULL REQUEST!
================================================================================
```

---

## 3. MINH CHỨNG 2: PULL REQUEST CỐ TÌNH LỖI (CI ĐỎ & BỊ CHẶN MERGE)

### 3.1. Kịch bản cố tình gây lỗi (Fault Injection)
Để chứng minh CI thực sự hoạt động và bảo vệ chất lượng mã nguồn:
* **Pull Request**: [#6 — test: intentional fault injection to verify branch protection](https://github.com/ChienPM-27/BrewLite_assignment2/pull/6)
* **Hành vi gây lỗi**:
  1. Cố tình sửa logic kiểm thử trong `pricing.service.spec.ts`: sửa giá trị giảm giá của voucher `WELCOME10` từ 20.000đ thành 99.999đ khiến assertion bị fail.
  2. Cố tình đưa biến không sử dụng (`unusedVariable: any`) vi phạm quy tắc khắt khe của ESLint.

### 3.2. Kết quả CI & Hành vi ngăn chặn của GitHub

```text
================================================================================
❌ GITHUB ACTIONS RUNNER LOG — PR #6 (FAIL-FAST DEMO)
================================================================================
● PricingService › tính toán chiết khấu WELCOME10

    expect(received).toBe(expected) // Object.is equality

    Expected: 99999
    Received: 20000

      48 |     const discount = service.calculateDiscount(orderTotal, 'WELCOME10');
    > 49 |     expect(discount).toBe(99999);
         |                      ^

FAIL src/modules/pricing/pricing.service.spec.ts
  ● Test suite failed to run with 1 error

Error: Process completed with exit code 1.
================================================================================
```

### 3.3. Bằng chứng GitHub Branch Protection kích hoạt chặn Merge

Trên giao diện web của Pull Request #6:
1. GitHub hiển thị trạng thái kiểm tra màu đỏ:  
   `❌ Backend (NestJS) - Lint, Unit Test & Build — Failed in 32s`
2. Khung nút bấm Merge hiển thị cảnh báo đỏ và bị khóa chặt (**Disabled**):  
   > ⛔ **Merging is blocked**  
   > *Required status check "Backend (NestJS) - Lint, Unit Test & Build" was not successful.*  
   > *At least 1 approving review is required by reviewers with write access.*
3. Không ai (kể cả Leader) có thể bypass merge nếu chưa sửa hết lỗi để CI chạy xanh trở lại.

---

## 4. QUY TẮC CÔ LẬP DỮ LIỆU KIỂM THỬ (INTEGRATION DATA ISOLATION)

Tuân thủ nghiêm ngặt quy định tại [ADR-009](../architecture/adr/009-testing-strategy.md) mục 3.6:
1. **Định danh dữ liệu riêng biệt**: Mỗi test suite tự sinh dữ liệu riêng thông qua mã UUID ngẫu nhiên (hoặc tiền tố `test_${uuid}_*`).
2. **Dọn dẹp an toàn**: Mọi hook `afterAll` chỉ truy vấn và xóa chính xác các bản ghi mang mã UUID của lượt test đó (`where: { id: { in: createdIds } }`).
3. **Cấm tuyệt đối**: Không dùng `TRUNCATE` hay `deleteMany` không có điều kiện `where`, không đụng vào dữ liệu seed mẫu của hệ thống.
4. Nhờ đó, cả 6 thành viên khi chạy integration test đồng thời trên cùng một cơ sở dữ liệu đều xanh 100% mà không gây xung đột hay làm hỏng dữ liệu của nhau.
