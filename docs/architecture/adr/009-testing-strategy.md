# ADR-009: Chiến Lược Kiểm Thử Đa Tầng (Unit, Integration, E2E)

> **Trạng thái**: Accepted  
> **Người đề xuất**: Nguyễn Quang Huy  
> **Người duyệt**: Minh Chiến  
> **Phạm vi áp dụng**: Toàn bộ hệ thống kiểm thử

---

## 1. BỐI CẢNH & VẤN ĐỀ
Để đảm bảo phần mềm hoạt động đúng theo mọi tiêu chí chấp nhận (AC) đã đề ra trong các file `fr-*.md`, nhóm cần định hình chiến lược kiểm thử đa tầng (Kim tự tháp kiểm thử - Test Pyramid), xác định rõ công cụ và ranh giới cho từng loại test.

## 2. QUYẾT ĐỊNH
1. **Tầng 1 - Unit Test (Chiếm ~70%)**:
   - Backend: Jest cho các Service độc lập (`PricingService`, `order-state`, `PromotionsService`).
   - Frontend: Vitest + React Testing Library cho các Component và Zustand Store.
2. **Tầng 2 - Integration Test (Chiếm ~25%)**:
   - Backend: Jest + Supertest + Prisma Client kết nối database PostgreSQL thật (trong Docker hoặc CI service container). Chạy tuần tự (`--runInBand`) với dữ liệu cô lập qua `test-helper.ts`.
3. **Tầng 3 - End-to-End Test (Chiếm ~5%)**:
   - Sử dụng Playwright kiểm thử luồng người dùng xuyên suốt: Đăng nhập ➔ Chọn món ➔ Vào giỏ ➔ Đặt đơn ➔ Thanh toán Mock ➔ Kiểm tra lịch sử đơn.

## 3. HỆ QUẢ
- **Ưu điểm**: Phát hiện lỗi từ sớm; kiểm thử tự động trên CI nhanh gọn; phản ánh đúng trạng thái nghiệp vụ thực tế.
- **Hạn chế**: Cần duy trì script test đồng bộ khi giao diện UI hoặc API contract có thay đổi.
