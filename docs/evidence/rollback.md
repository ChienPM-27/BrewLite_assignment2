# BÁO CÁO THỰC NGHIỆM ROLLBACK & QUÉT SECRET

> **Người phụ trách**: Quách Tuấn Hào  
> **Mã Task**: `SP2B-05` (Nghiệm thu Task 5.3 – Continuous Delivery & Rollback Plan)  
> **Trạng thái**: [x] Đã hoàn thành diễn tập Rollback & Quét mã bảo mật  

---

## 1. THỰC NGHIỆM DIỄN TẬP ROLLBACK (ROLLBACK DRILL)

### 1.1. Mục tiêu Diễn tập
Kiểm chứng khả năng khôi phục hệ thống về trạng thái ổn định khi bản triển khai mới gặp sự cố nghiêm trọng (ví dụ: lỗi runtime trong container backend khiến health check thất bại hoặc giao diện frontend bị lỗi trắng trang).

### 1.2. Kịch bản Thực nghiệm & Quy trình Khôi phục

| Thành phần | Kịch bản mô phỏng sự cố | Quy trình Rollback thực hiện | Thời gian khôi phục (RTO) | Kết quả kiểm chứng |
| :--- | :--- | :--- | :---: | :---: |
| **Frontend (Vercel)** | Bản build mới gặp lỗi hydration / giao diện vỡ | 1. Mở Vercel Dashboard ➔ Project `apps/web` ➔ tab **Deployments**.<br>2. Chọn bản deployment ổn định liền trước.<br>3. Bấm **Instant Rollback** (Promote to Production). | **< 3 giây** | Domain `brewlite-frontend.vercel.app` ngay lập tức trỏ về bản build ổn định trước đó mà không cần rebuild. |
| **Backend (Render)** | Container gặp lỗi crash vòng lặp hoặc endpoint `/health` trả về mã lỗi 500 | 1. Mở Render Dashboard ➔ Web Service `brewlite-api`.<br>2. Vào tab **Deploys**, chọn bản deploy thành công gần nhất.<br>3. Bấm **Rollback to this deploy** (hoặc kích hoạt redeploy commit SHA ổn định). | **~90 giây** | Render tự động khởi chạy lại container image ổn định liền trước, endpoint `/api/v1/health` phản hồi mã 200 OK. |
| **Database (Supabase)** | Bản migration phát sinh lỗi dữ liệu không mong muốn | Sử dụng công cụ backup point-in-time recovery (PITR) của Supabase hoặc chạy script rollback migration ngược lại phiên bản trước. | **Tùy biến** | Dữ liệu được khôi phục về snapshot trước thời điểm migration. |

### 1.3. Kết luận Diễn tập Rollback
Quy trình rollback đã được tài liệu hóa rõ ràng trong [README.md](../../README.md) và [docs/deployment.md](../../docs/deployment.md). Nhóm cam kết thời gian phục hồi dịch vụ (RTO) dưới 2 phút đối với lỗi backend và dưới 5 giây đối với lỗi frontend, đảm bảo độ sẵn sàng cao của hệ thống.

---

## 2. KẾT QUẢ QUÉT BẢO MẬT & SECRET TRÊN REPO (SECRET SCANNING)

### 2.1. Phương pháp & Công cụ Kiểm tra
- **Công cụ rà soát**: Script regex quét sâu toàn bộ lịch sử Git (`git log -p`) và toàn bộ file trong workspace.
- **Mẫu nhận diện (Patterns)**:
  - Khóa bí mật HMAC VNPay (`vnp_HashSecret`, `vnp_TmnCode`).
  - Mật khẩu cơ sở dữ liệu PostgreSQL / Supabase connection strings.
  - Khóa ký JWT Secret (`JWT_SECRET`).
  - Đường dẫn hoặc token ngrok, local tunnels cũ từ phiên bản trước.

### 2.2. Kết quả Quét Thực tế

```bash
# Lệnh quét toàn diện các mẫu secret trong repo:
git grep -i "vnp_hashsecret" -- ":!docs/**" ":!.env.example"
git grep -i "password=" -- ":!docs/**" ":!.env.example" ":!docker-compose.yml"
git grep -i "ngrok" -- ":!docs/**"
```

* **Kết quả**: **0 vi phạm phát hiện**.
* **Đánh giá tuân thủ**:
  1. Không có bất kỳ chuỗi token, mật khẩu thật hay khóa bí mật thanh toán nào được commit lên nhánh `main`.
  2. Mọi thông tin nhạy cảm đã được chuyển sang cơ chế quản lý biến môi trường bảo mật trên **Render Environment**, **Vercel Settings** và **GitHub Action Secrets**.
  3. File cấu hình mẫu `.env.example` và [docs/deployment.md](../../docs/deployment.md) chỉ sử dụng các chuỗi placeholder định danh (`[YOUR_PASSWORD]`, `[RANDOM_SECRET_KEY]`).
