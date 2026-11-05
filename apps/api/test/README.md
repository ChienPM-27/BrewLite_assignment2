# 🧪 QUY TẮC DỮ LIỆU & KHUNG KIỂM THỬ — BACKEND (APPS/API)

Tài liệu này hướng dẫn cách viết Unit Test và Integration Test cho các module thuộc Backend BrewLite trong Assignment 2.

---

## 1. 🛡️ QUY TẮC BẤT DI BẤT DỊCH (TEST DATA INTEGRITY)

1. **Tự tạo dữ liệu riêng biệt (Isolated Data)**:
   - Sử dụng helper `generateTestIdentifier(prefix)` từ `test/test-helper.ts` để sinh email, username, mã đơn hàng ngẫu nhiên với UUID.
   - *Ví dụ:*
     ```typescript
     const testEmail = `${generateTestIdentifier('user')}@example.test`;
     ```
2. **Tuyệt đối KHÔNG xâm phạm dữ liệu mẫu (Seed Data)**:
   - Không được sửa, xóa hoặc kiểm tra dựa trên dữ liệu do `prisma/seed.ts` tạo ra (Admin, Sản phẩm cố định...).
   - Nếu bài test cần sản phẩm có tồn kho nguyên liệu, hãy tự tạo sản phẩm test và nguyên liệu test riêng.
3. **Dọn dẹp chính xác (Precise Teardown)**:
   - Ghi nhận mọi ID được tạo vào `TestDataRegistry`.
   - Trong `afterAll()`, gọi `cleanupTestData(prisma, registry)` để xóa đúng những gì mình tạo ra.
   - **NGHIÊM CẤM**:
     - Cấm chạy `deleteMany()` hoặc `TRUNCATE` mà không có điều kiện `WHERE id IN (...)`.
4. **Chạy tuần tự (`--runInBand`)**:
   - Mọi lệnh test tích hợp phải chạy tuần tự qua `npm run test:int` hoặc `npm run test:ci` để chống race condition và deadlock database.

---

## 2. 🚀 CÁC LỆNH KIỂM THỬ

- **Chạy toàn bộ Unit & Service Tests**:
  ```bash
  npm run test:ci
  ```
- **Chạy Integration Tests (kết nối cơ sở dữ liệu)**:
  ```bash
  npm run test:int
  ```
- **Kiểm tra cú pháp & Lint**:
  ```bash
  npm run lint
  ```
