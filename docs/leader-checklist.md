# LEADER CHECKLIST — RÀ SOÁT NỘP BÀI ASSIGNMENT 2

> **Người phụ trách**: Minh Chiến (Leader)  
> **Mã Task**: `SP3-02`  
> **Trạng thái**: [ ] Đang thực hiện (Dùng để rà soát cuối Sprint 3 trước khi nộp bài)

---

## 1. RÀ SOÁT TÍNH TOÀN VẸN CỦA ĐỀ BÀI (5/5 TASKS)

- [ ] **Task 1: Yêu cầu & Phạm vi**
  - [ ] `docs/requirements/context-and-scope.md` (Đầy đủ 5 mục: vấn đề, stakeholder, phạm vi, giả định, rủi ro).
  - [ ] 7 file `fr-*.md` phủ trọn dải `FR-01` đến `FR-22`.
  - [ ] `docs/requirements/srs.md` tổng hợp FR + NFR-01..08 kèm tiêu chí đo lường.
  - [ ] `docs/requirements/usecase-order-payment.md` đặc tả chi tiết Task 1.3.
- [ ] **Task 2: Thiết kế Sơ đồ UML**
  - [ ] Có đủ file nguồn `.puml` và kết xuất `.svg` cho từng sơ đồ.
  - [ ] `docs/diagrams/activity-e2e.*` có swimlanes và 3 nhánh lỗi.
  - [ ] `docs/diagrams/sequence-checkout.*` đủ 6 điểm tích hợp.
  - [ ] `docs/diagrams/class-diagram.*` khớp schema cơ sở dữ liệu.
  - [ ] `docs/diagrams/order-state-machine.*` khớp logic code `assertTransition`.
- [ ] **Task 3: Kiến trúc & ADR**
  - [ ] `docs/architecture/architecture.md` + `c4-container.*`.
  - [ ] Đủ 9 hồ sơ quyết định kiến trúc: `ADR-001` đến `ADR-009`.
  - [ ] `docs/diagrams/deployment-production.*` mô tả đúng Vercel + Render + Supabase.
- [ ] **Task 4: Quản lý Mã nguồn & Tự động hóa CI**
  - [ ] Cấu trúc Monorepo `apps/api`, `apps/web`.
  - [ ] `.github/CODEOWNERS`, `.github/PULL_REQUEST_TEMPLATE.md`, `docs/CONTRIBUTING.md`.
  - [ ] Pipeline `.github/workflows/ci.yml` hoạt động tự động.
  - [ ] `docs/evidence/ci.md` có link minh chứng PR pass và PR bị chặn merge.
- [ ] **Task 5: Triển khai, Kiểm thử & Bàn giao**
  - [ ] Đầy đủ unit, integration (`npm run test:int`) và E2E tests.
  - [ ] `docs/deployment.md` và `docs/evidence/rollback.md`.
  - [ ] `docs/traceability-matrix.md` không còn ô trống, liên kết 5 cột xuyên suốt.
  - [ ] Có link video demo sản phẩm `docs/evidence/demo-link.md`.

---

## 2. RÀ SOÁT BẢO MẬT & QUYỀN TRUY CẬP

- [ ] Không còn secret/ngrok trong commit history và repo.
- [ ] Repo đặt chế độ Public hoặc đã Add quyền truy cập (Collaborator) cho Giảng viên / TA.
- [ ] Đã gắn Tag Release chính thức: `v1.0.0`.
