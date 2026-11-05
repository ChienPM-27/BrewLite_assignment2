# BÁO CÁO THỰC NGHIỆM ROLLBACK & QUÉT SECRET

> **Người phụ trách**: Quách Tuấn Hào  
> **Mã Task**: `SP3-05` (Task 5.3)  
> **Trạng thái**: [ ] Chưa thực hiện (Dự kiến thực hiện ở Sprint 3)

---

## 1. THỰC NGHIỆM DIỄN TẬP ROLLBACK (ROLLBACK DRILL)

- **Mục tiêu**: Kiểm chứng quy trình khôi phục hệ thống khi bản deploy mới gặp sự cố nghiêm trọng (crash server hoặc health check fail).
- **Kịch bản thực nghiệm dự kiến**:
  1. Tạo phiên bản thử nghiệm có lỗi (health check trả về 500).
  2. Kích hoạt deploy ➔ Pipeline phát hiện health check thất bại.
  3. Kích hoạt quy trình Rollback về bản release ổn định liền trước đó.
- **Kết quả thực tế**: `TODO` *(Sẽ thực hiện và ghi nhận thời gian rollback thực tế ở Sprint 3)*
- **Minh chứng (Logs & Screenshots)**: `TODO` *(Dán ảnh log và màn hình thực tế ở Sprint 3)*

---

## 2. KẾT QUẢ QUÉT BẢO MẬT & SECRET TRÊN REPO

- **Công cụ sử dụng**: Script grep / GitLeaks.
- **Tiêu chí rà soát**: Không còn các chuỗi secret cũ (mã bí mật VNPay, mật khẩu cơ sở dữ liệu mẫu, token ngrok, private keys).
- **Kết quả thực tế**: `TODO` *(Sẽ chạy quét và đính kèm báo cáo ở Sprint 3)*
