# ADR-001: Lựa Chọn Kiến Trúc Monorepo (apps/api & apps/web)

> **Trạng thái**: Accepted  
> **Ngày quyết định**: 2026-11-04  
> **Người đề xuất**: Minh Chiến (Leader)  
> **Người duyệt**: Minh Chiến  
> **Phạm vi áp dụng**: Toàn bộ dự án BrewLite

---

## 1. BỐI CẢNH & VẤN ĐỀ
Dự án BrewLite bao gồm 2 thành phần chính: Frontend (Next.js 15) và Backend API (NestJS). Nhóm cần quyết định cấu trúc lưu trữ mã nguồn để tối ưu hóa việc phân chia công việc cho 7 thành viên, chia sẻ tài liệu kiến trúc, đồng bộ mã lỗi và cấu hình CI/CD.

## 2. CÁC PHƯƠNG ÁN ĐÃ XEM XÉT
1. **Multi-repo (Tách riêng 2 repository)**: Mỗi ứng dụng 1 repository riêng biệt.
2. **Monorepo (Chung 1 repository với `apps/api` và `apps/web`)**: Tất cả nằm trong 1 repo duy nhất.

## 3. QUYẾT ĐỊNH
Chúng tôi chọn **Kiến trúc Monorepo** với thư mục `apps/api` và `apps/web`.
- Dễ dàng truy vết tài liệu (`docs/`) với mã nguồn (`apps/`).
- Tiện lợi cho giảng viên và TA khi clone và chạy kiểm thử toàn bộ hệ thống bằng 1 lệnh `docker compose up`.
- Quản lý CI/CD tập trung trong thư mục `.github/workflows/`.

## 4. HỆ QUẢ
- **Ưu điểm**: Quản lý phiên bản tập trung, chia sẻ contract API và tài liệu dễ dàng.
- **Hạn chế**: Cần cấu hình CI/CD và quy tắc `.github/CODEOWNERS` chặt chẽ để tránh xung đột mã nguồn giữa các thành viên.
