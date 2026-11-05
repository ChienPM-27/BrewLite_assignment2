# ADR-003: Sử Dụng PostgreSQL và Prisma ORM Với Chiến Lược Migration An Toàn

> **Trạng thái**: Accepted  
> **Người đề xuất**: Vũ Hoàng Huy  
> **Người duyệt**: Minh Chiến  
> **Phạm vi áp dụng**: `apps/api/prisma`

---

## 1. BỐI CẢNH & VẤN ĐỀ
Cần một hệ quản trị cơ sở dữ liệu quan hệ mạnh mẽ, đảm bảo tính toàn vẹn dữ liệu (ACID transaction) cho các luồng đặt món, trừ kho và thanh toán. Đồng thời cần công cụ quản lý schema và migration có thể chạy tự động trong CI/CD và môi trường Production mà không gây mất mát dữ liệu.

## 2. QUYẾT ĐỊNH
1. **Database**: PostgreSQL 16 (Hỗ trợ tốt JSONB, Row Locking, ACID).
2. **ORM & Migration**: Prisma ORM.
3. **Chiến lược Migration**:
   - Ở môi trường Dev/Local: Dùng `prisma migrate dev` để tạo file migration.
   - Ở môi trường CI / Production: **CHỈ DÙNG** `prisma migrate deploy`. Tuyệt đối không dùng `prisma db push` hoặc `prisma migrate reset` trên môi trường thực tế.

## 3. HỆ QUẢ
- **Ưu điểm**: Type-safe toàn diện từ DB tới TypeScript; schema rõ ràng; lịch sử migration được lưu vết chính xác trong bảng `_prisma_migrations`.
- **Hạn chế**: Khi scale lớn cần cấu hình connection pooler (sử dụng Supabase Transaction Pooler cổng 6543 cho `DATABASE_URL` và direct port 5432 cho `DIRECT_URL`).
