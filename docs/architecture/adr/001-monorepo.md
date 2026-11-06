# ADR-001: Lựa Chọn Kiến Trúc Monorepo (apps/api & apps/web)

> **Trạng thái**: Accepted  
> **Ngày quyết định**: 2026-11-04  
> **Người đề xuất**: Phạm Minh Chiến (Leader)  
> **Người duyệt**: Phạm Minh Chiến (Leader)  
> **Phạm vi áp dụng**: Toàn bộ dự án BrewLite (`apps/api`, `apps/web`, `.github/**`, `docs/**`)

---

## 1. BỐI CẢNH & VẤN ĐỀ (CONTEXT & PROBLEM STATEMENT)

Dự án BrewLite là hệ thống đặt cà phê trực tuyến phục vụ đồ án môn Công nghệ Phần mềm, bao gồm 2 thành phần chính:
- **Frontend**: Ứng dụng Web / PWA xây dựng bằng Next.js 15, Tailwind CSS và Zustand.
- **Backend**: Hệ thống REST API xây dựng bằng NestJS, Prisma ORM và cơ sở dữ liệu PostgreSQL.

Nhóm gồm 7 thành viên cùng tham gia phát triển trong 3 Sprint. Vấn đề kỹ thuật đặt ra là: Làm thế nào để tổ chức cấu trúc mã nguồn sao cho:
1. Phân chia rõ ràng phạm vi sở hữu file/thư mục (Code Ownership) cho từng thành viên, giảm thiểu xung đột merge code (Merge Conflicts).
2. Dễ dàng đồng bộ hóa tài liệu kiến trúc, đặc tả yêu cầu (`docs/`) với mã nguồn thực tế (`apps/`).
3. Đơn giản hóa quy trình tích hợp liên tục (CI) và hỗ trợ chạy toàn bộ hệ thống cục bộ phục vụ chấm bài bằng 1 lệnh `docker compose up`.

---

## 2. CÁC PHƯƠNG ÁN ĐÃ XEM XÉT (CONSIDERED OPTIONS)

### 2.1. Phương án A: Kiến trúc Monorepo (Chung 1 Git Repository)
Tất cả các thành phần ứng dụng (`apps/api`, `apps/web`), tài liệu (`docs/`), bài test (`tests/`) và cấu hình CI/CD (`.github/`) được lưu trữ tập trung trong 1 Git Repository duy nhất.

- **Ưu điểm**:
  - Quản lý phiên bản nguyên tử (Atomic Commits): một commit/PR có thể cập nhật đồng thời tài liệu và mã nguồn tương ứng.
  - Kiểm thử tích hợp thuận tiện: CI pipeline có thể khởi động dịch vụ cơ sở dữ liệu và kiểm tra toàn diện cả API lẫn Web.
  - Thuận tiện cho người chấm: chỉ cần clone 1 repository duy nhất và chạy `docker-compose.yml`.
- **Nhược điểm**:
  - Cần quy định rõ ràng về quyền sở hữu mã nguồn và bảo vệ nhánh chính để tránh các thành viên chỉnh sửa chồng chéo.

### 2.2. Phương án B: Kiến trúc Multi-repo (Tách biệt các Git Repositories riêng)
Tạo riêng các repository độc lập cho Frontend, Backend và Docs.

- **Ưu điểm**: Phân quyền repository độc lập.
- **Nhược điểm**: Khó đồng bộ hợp đồng API; tăng chi phí thiết lập CI/CD; người chấm phải clone nhiều repo khác nhau.

---

## 3. QUYẾT ĐỊNH (DECISION)

Chúng tôi chọn **Phương án A: Kiến trúc Monorepo** với cấu trúc thư mục phân định rõ ràng:
```text
BrewLite_assignment2/
├── apps/
│   ├── api/                   # Backend NestJS REST API (module hóa)
│   └── web/                   # Frontend Next.js 15 App Router & PWA
├── docs/                      # Toàn bộ tài liệu yêu cầu, sơ đồ, kiến trúc, kế hoạch
├── tests/                     # Kiểm thử E2E dùng chung
├── docker-compose.yml         # Khởi tạo môi trường phát triển cục bộ
└── .github/                   # Workflows CI, CODEOWNERS và PR template
```

**Quy tắc phân quyền & nhánh**:
- Thành viên phát triển trên các nhánh riêng (`nhat-lan`, `vu-hoang-huy`, `quach-tuan-hao`, `ton-that-hanh`, `nguyen-tran-gia-kiet`, `nguyen-quang-huy`), Leader làm việc trên nhánh `pham-minh-chien`.
- Áp dụng file `.github/CODEOWNERS`: quy định các file cấu hình dùng chung thuộc quyền quản lý của Leader.
- Kế hoạch áp dụng Branch Protection trên nhánh `main`: yêu cầu có code review duyệt và CI pass trước khi merge.

---

## 4. HỆ QUẢ (CONSEQUENCES)

### 4.1. Điểm tích cực (Positive / Pros)
- Quy trình làm việc thống nhất cho cả 7 thành viên trên cùng một kho lưu trữ.
- Dễ dàng truy vết tài liệu yêu cầu với các commit mã nguồn và test case.
- Giúp người chấm bài dễ dàng dựng môi trường thử nghiệm bằng Docker Compose.

### 4.2. Điểm hạn chế & Thách thức (Cons & Trade-offs)
- Cần sự tuân thủ nghiêm ngặt quy tắc commit và phân công file để tránh xung đột mã nguồn.

---

## 5. LIÊN KẾT MÃ NGUỒN & TRUY VẾT (CODE & TRACEABILITY)

- **Cấu trúc Monorepo**: [apps/api](../../apps/api), [apps/web](../../apps/web)
- **Cấu hình Docker Compose cục bộ**: [docker-compose.yml](../../docker-compose.yml)
- **Quy tắc phân công sở hữu**: [.github/CODEOWNERS](../../.github/CODEOWNERS)
- **Quy ước đóng góp**: [docs/CONTRIBUTING.md](../CONTRIBUTING.md)
