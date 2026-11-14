# LEADER CHECKLIST — RÀ SOÁT NỘP BÀI ASSIGNMENT 2

> **Người phụ trách**: Phạm Minh Chiến (Leader)  
> **Mã Task**: `SP2B-02` (Nghiệm thu Task 5.4 – Tổng duyệt nộp bài Assignment 2)  
> **Trạng thái**: [x] Đã hoàn thành 100% – Toàn bộ tiêu chí đạt chuẩn nghiệm thu  

---

## 1. RÀ SOÁT TÍNH TOÀN VẸN CỦA ĐỀ BÀI (5/5 TASKS)

- [x] **Task 1: Bối cảnh, Yêu cầu & Phạm vi**
  - [x] `docs/requirements/context-and-scope.md`: Đầy đủ 5 mục (bối cảnh, stakeholder, phạm vi in/out-scope, giả định, rủi ro).
  - [x] 7 file yêu cầu chức năng `fr-*.md`: Phủ trọn dải 22 yêu cầu chức năng (`FR-01` đến `FR-22`), không bỏ sót bất kỳ FR nào.
  - [x] `docs/requirements/srs.md`: Tổng hợp bảng MoSCoW, ma trận FR và 8 yêu cầu phi chức năng (`NFR-01`..`08`) kèm tiêu chí đo lường định lượng.
  - [x] `docs/requirements/usecase-order-payment.md`: Đặc tả chi tiết kịch bản use case "Đặt hàng và thanh toán" (Task 1.3).
- [x] **Task 2: Thiết kế Sơ đồ UML**
  - [x] Đầy đủ cặp file mã nguồn PlantUML (`.puml`) và ảnh vector kết xuất (`.svg`) cho tất cả sơ đồ.
  - [x] `docs/diagrams/activity-e2e.*`: Đủ swimlanes (Khách hàng, Web, API, Payment Gateway) và 3 nhánh xử lý lỗi.
  - [x] `docs/diagrams/sequence-checkout.*`: Thể hiện đầy đủ 6 điểm tích hợp hệ thống.
  - [x] `docs/diagrams/class-diagram.*`: Khớp 100% với schema cơ sở dữ liệu PostgreSQL (gồm 16 bảng và 4 bảng nguyên liệu tồn kho).
  - [x] `docs/diagrams/order-state-machine.*`: Khớp chặt chẽ với hàm kiểm soát chuyển trạng thái đơn hàng `assertTransition`.
- [x] **Task 3: Kiến trúc Hệ thống & ADR**
  - [x] `docs/architecture/architecture.md`: Thuyết minh kiến trúc Monorepo, C4 Container diagram và nguyên lý thiết kế.
  - [x] Hồ sơ quyết định kiến trúc: Đầy đủ 9 hồ sơ ADR (`ADR-001` đến `ADR-009`) phản ánh các quyết định kỹ thuật cốt lõi.
  - [x] `docs/diagrams/deployment-production.*`: Mô tả chính xác kiến trúc triển khai thực tế trên Vercel + Render + Supabase.
- [x] **Task 4: Quản lý Mã nguồn & Tự động hóa CI**
  - [x] Cấu trúc Monorepo chuẩn mực: `apps/api` (NestJS), `apps/web` (Next.js PWA), `docs/`, `scripts/`, `tests/`.
  - [x] Quản trị phân quyền: `.github/CODEOWNERS`, `.github/PULL_REQUEST_TEMPLATE.md`, `docs/CONTRIBUTING.md`.
  - [x] Pipeline `.github/workflows/ci.yml`: Tự động kích hoạt khi mở PR, tích hợp Lint, Unit test, Postgres Integration test và Playwright E2E.
  - [x] Minh chứng CI: `docs/evidence/ci.md` ghi nhận 100% Pull Request của 7 thành viên đều chạy pass CI xanh trước khi merge vào `main`.
- [x] **Task 5: Triển khai, Kiểm thử & Bàn giao Sản phẩm**
  - [x] Kiểm thử tự động đa tầng: Unit test, Integration test (`npm run test:int`) và E2E tests (`npm run test:e2e`).
  - [x] Hướng dẫn khởi chạy & triển khai: `README.md`, `docs/local-development.md`, `docs/deployment.md`.
  - [x] Kế hoạch khôi phục & quét bảo mật: `docs/evidence/rollback.md` ghi nhận thời gian RTO và 0 secret lộ trong Git.
  - [x] Ma trận truy vết yêu cầu: `docs/traceability-matrix.md` kết nối 22/22 FRs với Use Case, Sơ đồ, Code và Test case (không còn ô trống).
  - [x] Đường dẫn Production và Video demo: `docs/evidence/demo-link.md` cung cấp URL Web HTTPS, API Healthcheck và kịch bản demo hoàn chỉnh.

---

## 2. RÀ SOÁT BẢO MẬT & QUYỀN TRUY CẬP

- [x] Không còn secret/ngrok trong commit history và repo: Đã chạy script quét regex kiểm tra toàn diện (`docs/evidence/rollback.md`).
- [x] Đã cấu hình và kiểm chứng Docker Compose 1 lệnh: `docker compose up --build` chạy đồng bộ Web, API và Database.
- [x] Quyền truy cập repository: Repo công khai (Public) hoặc đã cấp quyền Collaborator đầy đủ cho Giảng viên và Trợ giảng.
- [x] Gắn Tag Release chính thức: `v1.0.0` trên nhánh `main`.
