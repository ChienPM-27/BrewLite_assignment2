# ADR-008: Chiến Lược Tự Động Hóa CI/CD & Cơ Chế Rollback

> **Trạng thái**: Accepted  
> **Ngày quyết định**: 2026-11-04  
> **Người đề xuất**: Phạm Minh Chiến (Leader)  
> **Người duyệt**: Phạm Minh Chiến (Leader)  
> **Phạm vi áp dụng**: Pipeline GitHub Actions (`.github/workflows/**`), quy trình kiểm thử tự động và kế hoạch phát hành

---

## 1. BỐI CẢNH & VẤN ĐỀ (CONTEXT & PROBLEM STATEMENT)

Dự án BrewLite áp dụng quy trình Scrum với 7 thành viên đóng góp mã nguồn. Để đảm bảo chất lượng phần mềm và đáp ứng các tiêu chí của đồ án:
1. Cần có hệ thống kiểm tra tự động (CI) trước khi bất kỳ đoạn mã nào được merge vào nhánh chính `main`.
2. Định hướng tự động hóa quá trình đóng gói và triển khai (CD) lên môi trường Production khi có bản phát hành mới.
3. Cần xây dựng kế hoạch phục hồi sự cố (Rollback) rõ ràng để đưa hệ thống về phiên bản ổn định trước đó nếu bản cập nhật mới gặp trục trặc.

---

## 2. CÁC PHƯƠNG ÁN ĐÃ XEM XÉT (CONSIDERED OPTIONS)

### 2.1. Phương án A: Tự Động Hóa với GitHub Actions & Kế Hoạch Rollback Đám Mây
- **Continuous Integration (`ci.yml`)**:
  - Tự động kích hoạt trên mỗi Pull Request vào `main`.
  - Thực hiện kiểm tra qua 3 job độc lập:
    1. `api`: Kiểm tra lint, unit test và build ứng dụng backend NestJS.
    2. `web`: Kiểm tra lint, unit test và build ứng dụng frontend Next.js 15.
    3. `integration`: Khởi động container PostgreSQL dịch vụ trên GitHub Actions runner, chạy migration và thực thi toàn bộ kiểm thử tích hợp backend (`jest-int`).
- **Continuous Delivery (`cd.yml` - Kế hoạch triển khai Sprint 2 & 3)**:
  - Dự kiến kích hoạt khi tạo Git Tag phiên bản (`v*.*.*`) hoặc merge vào `main`.
  - Đóng gói Docker image cho API, gắn tag theo commit SHA hoặc semver và đẩy lên GitHub Container Registry (GHCR).
  - Kích hoạt Deploy Webhook trên Render và Vercel, sau đó thực hiện kiểm thử khói (`scripts/smoke-test.sh`).
- **Kế hoạch Rollback Dự Kiến**:
  - Tận dụng tính năng Rollback 1-click có sẵn trên Dashboard của Render và Vercel để đưa ứng dụng về phiên bản/commit SHA ổn định gần nhất.
  - Mục tiêu phục hồi (RTO) dự kiến đạt dưới 5 phút. Diễn tập thực tế sẽ được thực hiện và lưu bằng chứng tại Sprint 3 (`SP3-05`).

### 2.2. Phương án B: Triển khai thủ công không có CI
- **Ưu điểm**: Không tốn công viết kịch bản workflow.
- **Nhược điểm**: Không có kiểm soát chất lượng tự động; dễ gây lỗi hồi quy và vi phạm yêu cầu Task 4 đề bài.

---

## 3. QUYẾT ĐỊNH (DECISION)

Chúng tôi chọn **Phương án A: Tự Động Hóa với GitHub Actions & Kế Hoạch Rollback Đám Mây**.

**Định hướng quản trị chất lượng**:
1. **Quy tắc bảo vệ nhánh `main`**:
   - Yêu cầu mọi thay đổi phải thông qua Pull Request có ít nhất 1 thành viên review duyệt.
   - Bắt buộc cả 3 job của CI (`api`, `web`, `integration`) phải pass thành công.
2. **Quản lý Secrets**:
   - Các biến bảo mật (token triển khai, kết nối cơ sở dữ liệu) được lưu trữ tại GitHub Secrets, không in giá trị secret ra log CI.
3. **Quy trình Rollback dự kiến**:
   - Khi phát hiện sự cố sau release, Leader thực hiện rollback phiên bản trên Render Dashboard và Vercel Dashboard về bản deploy ổn định liền trước.
   - Chạy lại kịch bản `scripts/smoke-test.sh` để kiểm chứng trạng thái hoạt động.

---

## 4. HỆ QUẢ (CONSEQUENCES)

### 4.1. Điểm tích cực (Positive / Pros)
- Tự động phát hiện sớm lỗi cú pháp, kiểm thử thất bại và lỗi build trước khi merge mã nguồn.
- Rõ ràng về quy trình phục hồi khi xảy ra sự cố trên môi trường thực tế.

### 4.2. Điểm hạn chế & Thách thức (Cons & Trade-offs)
- Cần tối ưu thời gian chạy các job CI bằng cách lưu cache phụ thuộc `npm`.
- Quy trình rollback cần được kiểm chứng bằng thực nghiệm (Rollback Drill) ở Sprint 3 trước khi nghiệm thu.

---

## 5. LIÊN KẾT MÃ NGUỒN & TRUY VẾT (CODE & TRACEABILITY)

- **Workflow CI hiện tại**: [.github/workflows/ci.yml](../../.github/workflows/ci.yml) (3 jobs: api, web, integration)
- **Quy tắc đóng góp**: [docs/CONTRIBUTING.md](../CONTRIBUTING.md)
- **Kịch bản kiểm thử khói**: [scripts/smoke-test.sh](../../scripts/smoke-test.sh)
- **Bằng chứng CI (dự kiến Sprint 2)**: [docs/evidence/ci.md](../evidence/ci.md)
- **Bằng chứng Rollback (dự kiến Sprint 3)**: [docs/evidence/rollback.md](../evidence/rollback.md)
