# ĐẶC TẢ USE-CASE CHI TIẾT: [TÊN USE-CASE]

> **Mã Use-Case**: `UC-xx`  
> **Người phụ trách**: [Tên thành viên]  
> **Mã FR liên kết**: `FR-xx`, `FR-yy`  
> **Sơ đồ liên quan**: `docs/diagrams/...`

---

## 1. THÔNG TIN CƠ BẢN

- **Actor (Tác nhân)**: Khách hàng (Customer) / Quản trị viên (Admin) / Hệ thống thanh toán (Payment Gateway)...
- **Mục tiêu (Goal)**: Mô tả ngắn gọn mục đích chính của use-case.
- **Trigger (Sự kiện kích hoạt)**: Hành động bắt đầu use-case (ví dụ: người dùng bấm nút "Thanh toán").
- **Tiền điều kiện (Pre-conditions)**: Điều kiện hệ thống cần có trước khi thực hiện (ví dụ: người dùng đã đăng nhập, giỏ hàng có ít nhất 1 món).
- **Hậu điều kiện (Post-conditions)**: Trạng thái hệ thống sau khi hoàn thành thành công (ví dụ: đơn hàng chuyển sang `PAID`, tồn kho nguyên liệu bị trừ, điểm thưởng được tích luỹ).

---

## 2. CÁC LUỒNG THỰC HIỆN (FLOW OF EVENTS)

### 2.1. Luồng chính (Main Success Flow - Sunny Day)
1. Người dùng thực hiện...
2. Hệ thống kiểm tra và hiển thị...
3. Người dùng xác nhận...
4. Hệ thống ghi nhận vào cơ sở dữ liệu và chuyển trạng thái...
5. Hệ thống trả về thông báo thành công.

### 2.2. Các luồng thay thế (Alternative Flows)
- **Alt-1: [Tên luồng thay thế]**:
  - Tại bước X của luồng chính, nếu người dùng chọn [lựa chọn khác]:
  - Hệ thống thực hiện [hành động thay thế] và tiếp tục/kết thúc use-case.

### 2.3. Các luồng ngoại lệ / Lỗi (Exception Flows)
- **Exc-1: [Tên trường hợp lỗi 1, ví dụ: Hết nguyên liệu]**:
  - Tại bước Y của luồng chính, hệ thống phát hiện tồn kho không đủ.
  - Hệ thống từ chối yêu cầu, thông báo lỗi cho người dùng và hoàn tác (rollback transaction).
- **Exc-2: [Tên trường hợp lỗi 2, ví dụ: Thanh toán thất bại]**:
  - Cổng thanh toán trả về mã lỗi.
  - Hệ thống chuyển đơn hàng về `PAYMENT_FAILED`, giữ nguyên giỏ hàng để khách hàng có thể thử lại.

---

## 3. TIÊU CHÍ KIỂM THỬ TỪ ACCEPTANCE CRITERIA (AC MAPPING)

- `AC-UC-01`: [Kịch bản kiểm thử luồng chính] ➔ Test ID: `TC-UC-01`
- `AC-UC-02`: [Kịch bản kiểm thử luồng ngoại lệ 1] ➔ Test ID: `TC-UC-02`
- `AC-UC-03`: [Kịch bản kiểm thử luồng ngoại lệ 2] ➔ Test ID: `TC-UC-03`
