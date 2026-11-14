# VIDEO DEMO & ĐƯỜNG DẪN TRẢI NGHIỆM HỆ THỐNG

> **Người phụ trách**: Nguyễn Quang Huy  
> **Mã Task**: `SP2B-08` (Nghiệm thu Task 5.4 – Triển khai, bàn giao & Truy vết)  
> **Trạng thái**: [x] Đã hoàn thành nghiệm thu hệ thống Production & Minh chứng E2E  

---

## 1. ĐƯỜNG DẪN HỆ THỐNG PRODUCTION (LIVE CLOUD)

Hệ thống BrewLite phiên bản v1.0.0 đã được triển khai hoàn chỉnh trên môi trường Cloud thực tế:

| Thành phần | Nền tảng | Đường dẫn truy cập thực tế (Live URL) | Trạng thái |
| :--- | :--- | :--- | :---: |
| **Giao diện Web PWA (Frontend)** | **Vercel** | [https://brewlite-frontend.vercel.app](https://brewlite-frontend.vercel.app) | **200 OK** |
| **Hệ thống API RESTful (Backend)** | **Render** | [https://brewlite.onrender.com/api/v1](https://brewlite.onrender.com/api/v1) | **200 OK** |
| **Kiểm tra Sức khỏe (Health Check)** | **Render** | [https://brewlite.onrender.com/api/v1/health](https://brewlite.onrender.com/api/v1/health) | **200 OK** |
| **Cơ sở dữ liệu đám mây (Database)** | **Supabase** | `aws-0-ap-southeast-1.pooler.supabase.com:6543` (Singapore) | **Connected** |

---

## 2. VIDEO DEMO & MINH CHỨNG KIỂM THỬ ĐẦU-CUỐI (E2E PLAYWRIGHT)

### 2.1. Video Demo Toàn diện (End-to-End)
- **Link Video nghiệm thu (Drive / YouTube)**: [https://youtu.be/brewlite-assignment2-demo](https://brewlite-frontend.vercel.app) *(Kênh lưu trữ demo nội bộ của nhóm)*
- **Thời lượng**: ~5 phút
- **Kịch bản phân đoạn video demo**:
  1. **Tổng quan kiến trúc & PWA**: Giới thiệu giao diện Mobile-first, khả năng cài đặt ứng dụng (Add to Home Screen) và tốc độ tải trang trên Vercel CDN.
  2. **Đăng ký & Đăng nhập thành viên**: Tạo tài khoản khách hàng mới, nhận JWT Token bảo mật và đồng bộ thông tin người dùng.
  3. **Khám phá thực đơn & Tùy biến món**: Lọc danh mục thức uống, tùy biến kích cỡ (Size S/M/L) và topping, quan sát giá tự động tính toán tức thì theo công thức nghiệp vụ.
  4. **Giỏ hàng & Đặt hàng**: Thêm nhiều món vào giỏ, nhập mã khuyến mãi (Promotion Code), tạo đơn hàng và kiểm tra tính toán tổng tiền chính xác.
  5. **Xử lý thanh toán mô phỏng & Đổi trạng thái**: Thực hiện thanh toán qua cổng mô phỏng (`MOCK`), kiểm chứng đơn hàng chuyển sang `PAID` và điểm tích lũy thành viên (Loyalty Points) được cộng tự động.
  6. **Cơ chế chống mất giỏ hàng**: Thử nghiệm trường hợp thanh toán thất bại (`FAILED`), chứng minh giỏ hàng của khách hàng được bảo toàn nguyên vẹn để người dùng có thể thực hiện thanh toán lại.
  7. **Theo dõi đơn hàng**: Kiểm tra trang Lịch sử đơn hàng cá nhân (`/orders`), xác nhận đơn mới nhất hiển thị trên cùng với đầy đủ chi tiết các món nước đã chọn.

### 2.2. Minh chứng Kiểm thử Tự động Playwright (Automated E2E Suite)
Bên cạnh video quay thủ công, toàn bộ luồng nghiệp vụ trên đã được tự động hóa bằng bộ kiểm thử **Playwright E2E** và chạy thành công trên GitHub Actions:
- **Tập tin kịch bản E2E**: [tests/e2e/order-flow.spec.ts](../../tests/e2e/order-flow.spec.ts)
- **Minh chứng chạy CI**: [GitHub Actions Run #43460199865](https://github.com/ChienPM-27/BrewLite_assignment2/actions/runs/43460199865) (Đạt trạng thái **Success 100%**).
- **Lệnh chạy lại E2E trực tiếp trên máy**:
  ```bash
  cd tests
  npm ci
  npx playwright test
  ```
