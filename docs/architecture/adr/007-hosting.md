# ADR-007: Kiến Trúc Triển Khai Sản Phẩm (Vercel + Render + Supabase)

> **Trạng thái**: Accepted  
> **Người đề xuất**: Minh Chiến (Leader)  
> **Người duyệt**: Minh Chiến  
> **Phạm vi áp dụng**: Môi trường Production

---

## 1. BỐI CẢNH & VẤN ĐỀ
Cần triển khai hệ thống BrewLite lên môi trường Internet thực tế có HTTPS, tốc độ cao, chi phí tối ưu (miễn phí cho sinh viên) và đảm bảo các tiêu chí an toàn:
- Không mở cổng cơ sở dữ liệu trực tiếp ra ngoài Internet.
- Phân tách rõ ràng giữa Frontend Static/SSR và Backend API containerized.

## 2. QUYẾT ĐỊNH
1. **Frontend (`apps/web`)**: Triển khai trực tiếp lên **Vercel** (tối ưu Next.js App Router, Edge Network, tự động cấp chứng chỉ SSL HTTPS).
2. **Backend (`apps/api`)**: Đóng gói Docker image và triển khai lên **Render Web Service** (kết nối GitHub repo hoặc GHCR). Cung cấp endpoint `/health` để giám sát uptime.
3. **Database**: **Supabase PostgreSQL** với chế độ Transaction Pooler (cổng 6543) và Direct Connection (cổng 5432) cho migration.

## 3. HỆ QUẢ
- **Ưu điểm**: Tận dụng tối đa điểm mạnh của từng nền tảng Cloud; đảm bảo tính bảo mật và chi phí 0đ; dễ dàng cấu hình biến môi trường qua Dashboard.
- **Hạn chế**: Render gói free có thời gian "cold start" sau 15 phút không có request (khắc phục bằng script ping health định kỳ).
