# BÁO CÁO HOẠT ĐỘNG CONTINUOUS INTEGRATION (CI) & ĐỐI CHIẾU NGIỆM THU

> **Người phụ trách**: Phạm Minh Chiến (Leader)  
> **Mã Task**: `SP2-01` (Task 4.4 theo đề bài Assignment 2)  
> **Trạng thái**: [x] Đã hoàn thành  
> **Repository GitHub**: [https://github.com/ChienPM-27/BrewLite_assignment2](https://github.com/ChienPM-27/BrewLite_assignment2)  
> **Pipeline Workflow**: [.github/workflows/ci.yml](../../.github/workflows/ci.yml)

---

## 1. THIẾT LẬP BẢO VỆ NHÁNH CHÍNH & NGUYÊN TẮC DUYỆT PR

### 1.1. Nguyên tắc gộp mã nguồn (Pull Request Governance)
Tuân thủ quy chế đóng góp mã nguồn tại [CONTRIBUTING.md](../CONTRIBUTING.md) và thiết kế tại [ADR-008](../architecture/adr/008-cicd.md):
1. **Khóa nhánh `main`**: Cấm tuyệt đối lệnh `git push origin main` trực tiếp. Mọi thay đổi đều phải thông qua Pull Request (PR).
2. **Quy tắc duyệt gộp (Merge Principle)**:
   - **Xong trước merge trước**: PR nào hoàn thiện trước, CI chạy xanh toàn bộ và có ít nhất 1 review chéo Approve thì được duyệt và merge ngay vào `main`, không xếp hàng chờ đợi theo tên thành viên.
   - **Chạy lại kiểm thử**: Mỗi khi merge một PR mới, toàn bộ pipeline CI tự động kích hoạt trên `main` để kiểm chứng không có xung đột hồi quy (regression) giữa các module.

### 1.2. Trật tự duyệt gộp các PR thực tế trên Repository
Các Pull Request đã được kiểm tra, review và merge thành công vào `main` theo thứ tự thời gian hoàn thành:

| PR # | Nhánh nguồn | Tác giả | Nội dung / Module | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| **#1** | `pham-minh-chien` | Minh Chiến | Setup ban đầu, monorepo framework | Merged |
| **#2** | `vu-hoang-huy` | Vũ Hoàng Huy | Module Pricing, test unit/int `SP2-04` | Merged |
| **#3** | `nguyen-tran-gia-kiet` | Gia Kiệt | Đặc tả Payment, sơ đồ checkout `SP1-07` | Merged |
| **#4** | `ton-that-hanh` | Tôn Thất Hạnh | Đặc tả Order, sơ đồ state machine `SP1-06` | Merged |
| **#5** | `quach-tuan-hao` | Quách Tuấn Hào | Đặc tả Auth/Cart, activity diagram `SP1-05` | Merged |
| **#7** | `docs/SP1-03-remove-sold-out-ui` | Minh Chiến | Đồng bộ phạm vi Menu UI | Merged |
| **#9** | `nhat-lan` | Nhật Lan | Đặc tả Menu, C4 Container `SP1-03` | Merged |
| **#10** | `nguyen-quang-huy` | Nguyễn Quang Huy | Đặc tả History, test-scenarios `SP1-08` | Merged |
| **#11** | `codex/sprint-1-closeout-fixes` | Minh Chiến | Đóng Sprint 1, gỡ secret Sandbox | Merged |
| **#13** | `nguyen-quang-huy` | Nguyễn Quang Huy | Trọn bộ kiểm thử E2E Playwright `SP2-08` | Merged |

*Các PR tiếp theo đang xếp hàng chuẩn bị gộp cho Sprint 2A:*
- **PR #12** (`quach-tuan-hao`): Module test Auth & Cart (`SP2-05`).
- **PR #14** (`test/SP2-06-order`): Module test Order (`SP2-06`).
- **PR #15** (`nguyen-tran-gia-kiet`): Module hoàn thiện Payment (`SP2-07`).

---

## 2. MINH CHỨNG HOẠT ĐỘNG CI THỰC TẾ TRÊN GITHUB ACTIONS

### 2.1. Danh sách các Pipeline Run thực tế đã kiểm chứng (100% Pass)
Toàn bộ lịch sử thực thi trên GitHub Actions của repository đều được ghi nhận công khai và kiểm chứng được thông qua API/Web:

* **CI Run sau khi Merge PR #13 lên `main`**:  
  👉 [Actions Run #43576171640](https://github.com/ChienPM-27/BrewLite_assignment2/actions/runs/43576171640) (`success`)  
  *Xác nhận toàn bộ mã nguồn `main` tích hợp trọn bộ E2E Playwright và build production thành công.*
* **CI Run kiểm thử trên PR #13 (E2E Test Suite)**:  
  👉 [Actions Run #43460199865](https://github.com/ChienPM-27/BrewLite_assignment2/actions/runs/43460199865) (`success`)
* **CI Run kiểm thử trên PR #11 (Closeout Baseline Sprint 1)**:  
  👉 [Actions Run #43423663898](https://github.com/ChienPM-27/BrewLite_assignment2/actions/runs/43423663898) (`success`)
* **CI Run kiểm thử trên PR #12 (Auth/Cart Test)**:  
  👉 [Actions Run #43431155225](https://github.com/ChienPM-27/BrewLite_assignment2/actions/runs/43431155225) (`success`)
* **CI Run kiểm thử trên PR #14 (Order Integration Test)**:  
  👉 [Actions Run #43556350151](https://github.com/ChienPM-27/BrewLite_assignment2/actions/runs/43556350151) (`success`)
* **CI Run kiểm thử trên PR #15 (Payment Sandbox Update)**:  
  👉 [Actions Run #43568749301](https://github.com/ChienPM-27/BrewLite_assignment2/actions/runs/43568749301) (`success`)

### 2.2. Chi tiết các Job trong Pipeline CI chuẩn hóa (`ci.yml`)

Pipeline [.github/workflows/ci.yml](../../.github/workflows/ci.yml) tự động thực thi 4 tầng kiểm thử:

1. **`lint-and-test-api` (Backend NestJS)**:
   - Kiểm tra ESLint strict rule (`apps/api`).
   - Chạy toàn bộ Unit & Service Tests bằng Jest: **14/14 test suites, 169 unit tests PASS 100%**.
   - Build production NestJS (`dist/main.js`).
2. **`lint-and-test-web` (Frontend Next.js)**:
   - Kiểm tra Next.js ESLint (`apps/web`).
   - Chạy Frontend Component Tests bằng Vitest: **PASS 100%**.
   - Build production Next.js App Router (`.next/`).
3. **`integration-test-api` (Integration Tests với PostgreSQL Service)**:
   - Khởi động service container `postgres:16-alpine`.
   - Thực thi di chuyển cơ sở dữ liệu thực: `npx prisma migrate deploy` (5 migrations).
   - Chạy test tích hợp Supertest gọi trực tiếp vào cơ sở dữ liệu thật. Hiện trạng trên `main` có **3 integration test suites**:
     - `test/health.int-spec.ts` (kiểm tra endpoint health check).
     - `test/sample.int-spec.ts` (kiểm tra quy tắc dữ liệu DB).
     - `src/modules/pricing/pricing.service.int-spec.ts` (kiểm tra tính giá, chiết khấu và voucher do Vũ Huy viết ở `SP2-04`).
     *(Khi merge PR #12 và #14, bộ integration test sẽ tự động mở rộng lên 5 suites gồm cả `auth.int-spec.ts` và `orders.int-spec.ts`)*.
4. **`e2e-tests` (End-to-End Tests Playwright)**:
   - Khởi động stack docker riêng biệt `tests/docker-compose.e2e.yml`.
   - Chạy trọn vẹn 3 luồng kiểm thử nghiệp vụ: `E2E-01` (đặt đơn thành công), `E2E-02` (thanh toán lỗi giữ giỏ hàng), `E2E-03` (xem chi tiết lịch sử đơn hàng).

---

## 3. CƠ CHẾ NGĂN CHẶN LỖI (QUALITY GATE & FAIL-SAFE MECHANISM)

### 3.1. Cơ chế chặn lỗi tự động của CI
Pipeline CI được thiết kế với cơ chế chặn đứng lỗi (Fail-Fast):
* **Quy tắc Exit Code**: Bất kỳ bước nào trong 4 jobs (`npm run lint`, `npm run test:ci`, `npm run test:int`, `npm run build`) trả về exit code khác 0, toàn bộ job đó lập tức chuyển sang trạng thái thất bại (**Failed ❌**).
* **Concurrency Guard**: Cấu hình `concurrency.cancel-in-progress: true` tự động hủy bỏ các lượt chạy cũ khi có commit mới được push, tránh lãng phí tài nguyên và ngăn chặn tình trạng race condition trong kiểm thử.
* **Nguyên tắc kiểm thử cục bộ (Pre-push verification)**: Nhóm thực hiện nghiêm ngặt quy trình chạy lint, unit test và integration test nội bộ trước khi push, nhờ đó 100% các pipeline run chính thức trên repository đều giữ vững trạng thái xanh ổn định.

### 3.2. Quy tắc cô lập dữ liệu Integration Test (Data Isolation)
Tuân thủ mục 3.6 của [ADR-009](../architecture/adr/009-testing-strategy.md):
* Mỗi test suite tự sinh dữ liệu riêng bằng mã UUID hoặc tiền tố ngẫu nhiên.
* Hook `afterAll` chỉ dọn dẹp các bản ghi do chính suite đó tạo ra (`where: { id: { in: createdIds } }`).
* Nghiêm cấm sử dụng `TRUNCATE` hoặc `deleteMany` không có điều kiện `where`, đảm bảo dữ liệu của các thành viên không bị ghi đè hoặc xung đột lẫn nhau khi chạy cùng lúc trên cơ sở dữ liệu kiểm thử.
