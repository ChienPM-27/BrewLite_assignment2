# ADR-001: Lựa Chọn Kiến Trúc Monorepo (apps/api & apps/web)

> **Trạng thái**: Accepted  
> **Ngày quyết định**: 2026-11-04  
> **Người đề xuất**: Minh Chiến (Leader)  
> **Người duyệt**: Minh Chiến (Leader)  
> **Phạm vi áp dụng**: Toàn bộ dự án BrewLite (`apps/api`, `apps/web`, `.github/**`, `docs/**`)

---

## 1. BỐI CẢNH & VẤN ĐỀ (CONTEXT & PROBLEM STATEMENT)

Dự án BrewLite là hệ thống đặt cà phê trực tuyến phục vụ bài tập lớn môn Công nghệ Phần mềm, bao gồm 2 thành phần chính:
- **Frontend**: Ứng dụng Web / PWA xây dựng bằng Next.js 15, Tailwind CSS và Zustand.
- **Backend**: Hệ thống REST API xây dựng bằng NestJS, Prisma ORM và cơ sở dữ liệu PostgreSQL.

Nhóm gồm 7 thành viên cùng tham gia phát triển song song trong 3 Sprint (mỗi Sprint 2–3 ngày). Vấn đề kỹ thuật đặt ra là: Làm thế nào để tổ chức cấu trúc mã nguồn sao cho:
1. Tối ưu hóa việc phân chia quyền sở hữu file/thư mục (Code Ownership) cho từng thành viên, tránh xung đột merge code (Merge Conflicts).
2. Dễ dàng đồng bộ hóa tài liệu kiến trúc, đặc tả yêu cầu (`docs/`) với mã nguồn thực tế (`apps/`).
3. Đơn giản hóa quy trình tích hợp liên tục (CI/CD) và hỗ trợ giảng viên/TA có thể chạy toàn bộ hệ thống cục bộ chỉ với 1 lệnh duy nhất (`docker compose up`).

---

## 2. CÁC PHƯƠNG ÁN ĐÃ XEM XÉT (CONSIDERED OPTIONS)

### 2.1. Phương án A: Kiến trúc Monorepo (Chung 1 Git Repository)
Tất cả các thành phần ứng dụng (`apps/api`, `apps/web`), tài liệu (`docs/`), bài test (`tests/`) và cấu hình CI/CD (`.github/`) được lưu trữ tập trung trong 1 Git Repository duy nhất.

- **Ưu điểm**:
  - Quản lý phiên bản nguyên tử (Atomic Commits): một commit hoặc PR có thể cập nhật cả API backend, UI frontend và tài liệu SRS tương ứng.
  - Dễ dàng thiết lập ma trận kiểm thử (Testing Matrix) và kiểm thử tích hợp End-to-End.
  - Thuận tiện tối đa cho người chấm điểm: clone 1 repository duy nhất và chạy `docker-compose.yml`.
- **Nhược điểm**:
  - Nguy cơ xung đột code nếu các thành viên chỉnh sửa chồng chéo lên các file dùng chung. Cần thiết lập Branch Protection và quy tắc `.github/CODEOWNERS` nghiêm ngặt.

### 2.2. Phương án B: Kiến trúc Multi-repo (Tách biệt 2-3 Git Repositories riêng rẽ)
Tạo riêng `brewlite-frontend`, `brewlite-backend` và `brewlite-docs`.

- **Ưu điểm**:
  - Phân quyền repo độc lập, giảm thiểu nguy cơ xung đột mã nguồn trực tiếp.
- **Nhược điểm**:
  - Khó khăn trong việc đồng bộ hóa phiên bản và hợp đồng API (API Contracts).
  - Tăng độ phức tạp cho CI/CD (phải quản lý nhiều pipeline độc lập và deploy token chéo).
  - Giảng viên và người chấm phải clone nhiều repo, tăng nguy cơ cấu hình sai môi trường.

---

## 3. QUYẾT ĐỊNH (DECISION)

Chúng tôi chọn **Phương án A: Kiến trúc Monorepo** với cấu trúc thư mục chuẩn hóa:
```text
BrewLite_assignment2/
├── apps/
│   ├── api/                   # Backend NestJS REST API
│   └── web/                   # Frontend Next.js 15 App Router & PWA
├── docs/                      # Toàn bộ tài liệu yêu cầu, kiến trúc, sơ đồ, bằng chứng
├── tests/                     # Kiểm thử E2E Playwright dùng chung
├── docker-compose.yml         # Khởi tạo môi trường phát triển cục bộ
└── .github/                   # Workflows CI/CD, CODEOWNERS và PR template
```

**Lý do chọn**:
- Đảm bảo tính toàn vẹn và khả năng truy vết trực tiếp giữa mã nguồn và tài liệu thiết kế.
- Giúp Leader dễ dàng kiểm soát chất lượng qua bộ lọc GitHub Actions và file `.github/CODEOWNERS`.
- Phù hợp với tiến độ gấp rút của đồ án và yêu cầu bàn giao sản phẩm của môn học.

---

## 4. HỆ QUẢ (CONSEQUENCES)

### 4.1. Điểm tích cực (Positive / Pros)
- Quy trình phát triển thống nhất: mọi thành viên làm việc trên cùng một luồng Git Flow cải tiến.
- Kiểm thử tích hợp thuận tiện: CI pipeline có thể khởi động cả PostgreSQL, API và Frontend để chạy smoke test và integration test.
- Đảm bảo nguyên tắc "Single Source of Truth" cho toàn bộ tài liệu và mã nguồn dự án.

### 4.2. Điểm hạn chế & Biện pháp khắc phục (Cons & Mitigation)
- **Hạn chế**: Nếu thành viên tùy tiện sửa file chung (`package.json`, `docker-compose.yml`, `schema.prisma`), có thể gây hỏng toàn bộ dự án.
- **Biện pháp**:
  - Áp dụng file `.github/CODEOWNERS`: quy định các file dùng chung chỉ duy nhất Leader (Minh Chiến) có quyền phê duyệt thay đổi.
  - Kích hoạt GitHub Branch Protection trên nhánh `main`: cấm push trực tiếp, yêu cầu ít nhất 1 code review và 100% kiểm thử CI thành công mới được merge.

---

## 5. LIÊN KẾT MÃ NGUỒN & TRUY VẾT (CODE & TRACEABILITY)

- **Cấu trúc Monorepo**: [apps/api](../../apps/api), [apps/web](../../apps/web)
- **Cấu hình Docker cục bộ**: [docker-compose.yml](../../docker-compose.yml)
- **Quy tắc sở hữu mã nguồn**: [.github/CODEOWNERS](../../.github/CODEOWNERS)
- **Quy tắc đóng góp**: [docs/CONTRIBUTING.md](../CONTRIBUTING.md)
- **Kiểm thử xác minh**: Kiểm tra lệnh `docker compose config` và `npm run lint` trên toàn bộ monorepo.
