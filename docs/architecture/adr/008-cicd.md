# ADR-008: Chiến Lược Tự Động Hóa CI/CD & Cơ Chế Rollback

> **Trạng thái**: Accepted  
> **Người đề xuất**: Minh Chiến (Leader)  
> **Người duyệt**: Minh Chiến  
> **Phạm vi áp dụng**: `.github/workflows`

---

## 1. BỐI CẢNH & VẤN ĐỀ
Cần tự động hóa toàn bộ quy trình kiểm thử và triển khai mã nguồn nhằm đảm bảo không có code lỗi nào được merge vào nhánh `main`, đồng thời có phương án phục hồi nhanh chóng (Rollback) khi phiên bản mới gặp sự cố.

## 2. QUYẾT ĐỊNH
1. **Continuous Integration (`ci.yml`)**:
   - Tự động chạy trên mọi Pull Request vào `main`.
   - Kiểm tra độc lập 3 job: Lint, Unit test, Build và Integration Test (với PostgreSQL service).
   - Thiết lập Branch Protection: Bắt buộc CI xanh 100% mới cho phép Merge.
2. **Continuous Delivery (`cd.yml`)**:
   - Kích hoạt khi có tag mới hoặc push vào `main`.
   - Build image Docker backend, chạy migration `prisma migrate deploy`, kích hoạt webhook deploy Render/Vercel và chạy smoke test.
3. **Chiến lược Rollback**:
   - Nếu smoke test thất bại: Pipeline dừng khẩn cấp và gọi lệnh redeploy về commit SHA / Docker tag ổn định liền trước đó.

## 3. HỆ QUẢ
- **Ưu điểm**: Giảm thiểu tối đa lỗi do con người; triển khai an toàn và có phương án dự phòng rõ ràng.
- **Hạn chế**: Cần bảo mật chặt chẽ GitHub Secrets (Token Render, Vercel, Supabase URL).
