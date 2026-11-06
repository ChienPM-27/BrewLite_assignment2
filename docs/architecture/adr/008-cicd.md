# ADR-008: Chiến Lược Tự Động Hóa CI/CD & Cơ Chế Rollback

> **Trạng thái**: Accepted  
> **Ngày quyết định**: 2026-11-04  
> **Người đề xuất**: Minh Chiến (Leader)  
> **Người duyệt**: Minh Chiến (Leader)  
> **Phạm vi áp dụng**: Pipeline GitHub Actions (`.github/workflows/**`), kịch bản kiểm thử tự động và quy trình phát hành

---

## 1. BỐI CẢNH & VẤN ĐỀ (CONTEXT & PROBLEM STATEMENT)

Dự án BrewLite áp dụng mô hình phát triển phần mềm Agile/Scrum với 7 thành viên đóng góp code liên tục. Để đảm bảo chất lượng phần mềm, ngăn ngừa lỗi hồi quy (Regression Bugs) và đáp ứng yêu cầu của đề tài:
1. Phải có hệ thống kiểm tra tự động trước khi bất kỳ đoạn mã nào được merge vào nhánh chính `main`.
2. Phải tự động hóa quá trình đóng gói và triển khai lên môi trường Production mỗi khi có bản phát hành mới (Tag Release).
3. Phải xây dựng quy trình và kịch bản phục hồi sự cố (Rollback) nhanh chóng (dưới 5 phút) nếu bản phát hành mới bị lỗi hoặc không vượt qua kiểm thử khói (Smoke Test).

---

## 2. CÁC PHƯƠNG ÁN ĐÃ XEM XÉT (CONSIDERED OPTIONS)

### 2.1. Phương án A: Tự động hóa hoàn toàn với GitHub Actions + GHCR + Rollback Tự Động
- **CI (`ci.yml`)**: Tự động kích hoạt trên mỗi Pull Request vào nhánh `main`. Chạy ma trận 4 kiểm tra độc lập:
  1. `Lint`: Kiểm tra lỗi cú pháp và quy chuẩn mã nguồn ESLint / Prettier.
  2. `Unit Test`: Chạy kiểm thử đơn vị độc lập trên cả Frontend (`apps/web` bằng Vitest) và Backend (`apps/api` bằng Jest).
  3. `Build`: Kiểm tra biên dịch TypeScript cho cả 2 ứng dụng.
  4. `Integration Test`: Khởi động dịch vụ PostgreSQL ephemeral container trên GitHub Actions runner, chạy migration và thực thi toàn bộ kiểm thử tích hợp API backend với cờ `--runInBand`.
- **CD (`cd.yml`)**: Kích hoạt khi có commit merge vào `main` hoặc khi tạo Git Tag mới (`v*.*.*`). Tự động build Docker image, push lên GitHub Container Registry (GHCR), chạy migration schema lên Supabase qua Direct Connection, kích hoạt Deploy Webhook trên Render và Vercel, sau đó chạy kịch bản kiểm thử khói (`scripts/smoke-test.sh`).
- **Cơ chế Rollback**:
  - Nếu `smoke-test.sh` báo lỗi (HTTP status != 200 hoặc API lỗi nghiệp vụ): CD pipeline lập tức gửi lệnh Rollback về Docker Image Tag và Git Commit SHA ổn định liền trước đó.
  - Hỗ trợ Rollback thủ công 1-click trực tiếp trên Dashboard của Render và Vercel.

### 2.2. Phương án B: Triển khai thủ công (Manual Deployment)
Mỗi thành viên tự build cục bộ và upload code hoặc trigger deploy thủ công qua giao diện web Render/Vercel.

- **Ưu điểm**: Đơn giản lúc đầu, không tốn công viết YAML workflow.
- **Nhược điểm**: Rất dễ gây sai sót do con người; không có bằng chứng kiểm thử tự động (vi phạm tiêu chí Task 4 của đề bài); không có quy trình rollback chuẩn mực.

---

## 3. QUYẾT ĐỊNH (DECISION)

Chúng tôi chọn **Phương án A: Tự động hóa hoàn toàn với GitHub Actions + GHCR + Rollback Tự Động**.

**Quy tắc vận hành nghiêm ngặt**:
1. **Branch Protection Rule trên `main`**:
   - Cấm đẩy code trực tiếp (`git push origin main` bị chặn 100%).
   - Bắt buộc mở Pull Request tuân thủ template `.github/PULL_REQUEST_TEMPLATE.md`.
   - Bắt buộc có ít nhất 1 thành viên review duyệt (Code Review Approved).
   - Bắt buộc toàn bộ 4 checks của CI pipeline phải xanh (`Success`).
2. **Quản lý Secrets**:
   - Toàn bộ token, webhook URL, database credentials được lưu tại **GitHub Secrets** của repository. Tuyệt đối không in giá trị secret ra log CI/CD.
3. **Quy trình Rollback tiêu chuẩn**:
   - Bước 1: Khi phát hiện sự cố sau release, Leader kích hoạt workflow `rollback.yml` hoặc chuyển Deploy trên Render về commit an toàn gần nhất.
   - Bước 2: Chạy kiểm thử khói để xác nhận trạng thái Uptime xanh.
   - Bước 3: Ghi nhận biên bản sự cố vào `docs/evidence/rollback.md`.

---

## 4. HỆ QUẢ (CONSEQUENCES)

### 4.1. Điểm tích cực (Positive / Pros)
- Đảm bảo chất lượng mã nguồn: Loại bỏ 100% rủi ro code lỗi hoặc không biên dịch được bị lọt vào nhánh `main`.
- Rút ngắn thời gian phát hành: Bản cập nhật được tự động triển khai trong vòng 2–3 phút sau khi merge PR.
- Đảm bảo tính sẵn sàng cao: Thời gian phục hồi sau sự cố (RTO) đạt dưới 5 phút nhờ cơ chế Rollback đã được kiểm chứng.

### 4.2. Điểm hạn chế & Biện pháp khắc phục (Cons & Mitigation)
- **Thời gian chạy CI**: Mỗi PR mất khoảng 2–4 phút để chạy toàn bộ suite test và build.
- **Biện pháp**: Cấu hình cơ chế lưu cache phụ thuộc (`actions/cache` cho npm modules) và tách các job chạy song song nhằm tối ưu thời gian phản hồi cho lập trình viên.

---

## 5. LIÊN KẾT MÃ NGUỒN & TRUY VẾT (CODE & TRACEABILITY)

- **Workflow CI**: [.github/workflows/ci.yml](../../.github/workflows/ci.yml)
- **Quy tắc đóng góp & PR**: [docs/CONTRIBUTING.md](../CONTRIBUTING.md)
- **Kịch bản kiểm thử khói (Smoke Test)**: [scripts/smoke-test.sh](../../scripts/smoke-test.sh)
- **Minh chứng CI pass & blocked**: [docs/evidence/ci.md](../evidence/ci.md)
- **Kịch bản & Bằng chứng Rollback**: [docs/evidence/rollback.md](../evidence/rollback.md)
- **Sơ đồ quy trình triển khai**: [docs/diagrams/deployment-production.puml](../diagrams/deployment-production.puml)
