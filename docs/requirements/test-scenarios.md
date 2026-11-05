# MA TRẬN KỊCH BẢN KIỂM THỬ (TEST SCENARIOS & MAPPING)

> **Người phụ trách**: Nguyễn Quang Huy  
> **Mã Task**: `SP1-08` (Task 2)  
> **Mục tiêu**: Ánh xạ toàn bộ Tiêu chí chấp nhận (AC) từ các file `fr-*.md` sang mã Test Case ID cụ thể.

---

## 1. BẢNG ÁNH XẠ AC SANG TEST CASE ID

| Nhóm chức năng | Mã AC | Mô tả kịch bản kiểm thử | Loại kiểm thử | Test Case ID | Vị trí kiểm thử trong code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth** | `AC-01.1` | Đăng ký tài khoản thành công với email & mật khẩu hợp lệ | Integration | `TC-AUTH-01` | `apps/api/src/modules/auth/**` |
| | `AC-01.2` | Mật khẩu được băm bcrypt, không lưu plain text | Unit | `TC-AUTH-02` | `apps/api/src/modules/auth/**` |
| | `AC-01.3` | Đăng ký trùng email trả về 409 Conflict | Integration | `TC-AUTH-03` | `apps/api/src/modules/auth/**` |
| | `AC-02.1` | Đăng nhập đúng trả về 200 OK + JWT accessToken | Integration | `TC-AUTH-04` | `apps/api/src/modules/auth/**` |
| | `AC-02.2` | Đăng nhập sai mật khẩu trả về 401 Unauthorized | Integration | `TC-AUTH-05` | `apps/api/src/modules/auth/**` |
| | `AC-03.1` | Truy cập API bảo vệ không có token trả về 401 | Integration | `TC-AUTH-06` | `apps/api/test/health.spec.ts` |
| | `AC-03.3` | Customer gọi API admin trả về 403 Forbidden | Unit/Guard | `TC-AUTH-07` | `apps/api/src/common/guards/**` |
| **Menu** | `AC-04.1` | Lọc sản phẩm theo danh mục hiển thị đúng món | Component | `TC-MENU-01` | `apps/web/src/**/menu/**` |
| | `AC-05.1` | Lấy danh sách sản phẩm trả về mã 200 | Integration | `TC-MENU-02` | `apps/api/src/modules/products/**` |
| | `AC-05.2` | Món hết nguyên liệu hiển thị trạng thái hết hàng | Component | `TC-MENU-03` | `apps/web/src/**/menu/**` |
| | `AC-06.1` | Tìm kiếm món theo từ khóa gần đúng | Component | `TC-MENU-04` | `apps/web/src/**/menu/**` |
| **Detail** | `AC-07.1` | Lấy chi tiết món thành công trả về 200 | Integration | `TC-DETAIL-01` | `apps/api/src/modules/products/**` |
| | `AC-07.2` | Lấy chi tiết món không tồn tại trả về 404 | Integration | `TC-DETAIL-02` | `apps/api/src/modules/products/**` |
| | `AC-08.1` | Chọn kích cỡ size S/M/L giá thay đổi tương ứng | Unit | `TC-DETAIL-03` | `apps/api/src/modules/pricing/**` |
| | `AC-08.2` | Chọn tối đa 3 topping, vượt quá 3 bị chặn | Component | `TC-DETAIL-04` | `apps/web/src/app/products/**` |
| | `AC-09.2` | Backend tính lại giá bảo vệ tính toàn vẹn | Unit | `TC-DETAIL-05` | `apps/api/src/modules/pricing/**` |
| **Cart** | `AC-10.1` | Thêm món cùng size/topping tăng số lượng | Unit Store | `TC-CART-01` | `apps/web/src/store/useCartStore.ts` |
| | `AC-10.3` | Giảm về 0 hoặc xóa món khỏi giỏ hàng | Unit Store | `TC-CART-02` | `apps/web/src/store/useCartStore.ts` |
| | `AC-11.1` | Tổng tiền giỏ hàng tính đúng theo số lượng & topping | Unit Store | `TC-CART-03` | `apps/web/src/store/useCartStore.ts` |
| | `AC-12.2` | Thanh toán thất bại GIỮ NGUYÊN giỏ hàng | Component | `TC-CART-04` | `apps/web/src/app/cart/**` |
| **Order** | `AC-13.1` | Tạo đơn hàng mới chuyển trạng thái PENDING | Integration | `TC-ORDER-01` | `apps/api/src/modules/orders/**` |
| | `AC-14.1` | Không đủ nguyên liệu từ chối tạo đơn với 400 | Integration | `TC-ORDER-02` | `apps/api/src/modules/orders/**` |
| | `AC-14.2` | Bắn nhiều đơn song song không bị âm kho nguyên liệu | Concurrency | `TC-ORDER-03` | `apps/api/test/concurrency.ts` |
| | `AC-15.1` | Áp dụng mã giảm giá hợp lệ trừ đúng tiền | Unit | `TC-ORDER-04` | `apps/api/src/modules/promotions/**` |
| | `AC-16.1` | Chuyển đổi trạng thái đúng thứ tự state machine | Unit | `TC-ORDER-05` | `apps/api/src/modules/orders/**` |
| | `AC-16.3` | Chuyển sai trạng thái bị chặn với 409 Conflict | Unit | `TC-ORDER-06` | `apps/api/src/modules/orders/**` |
| **Payment**| `AC-17.1` | Thanh toán mô phỏng thành công chuyển đơn sang PAID | Integration | `TC-PAY-01` | `apps/api/src/modules/payments/**` |
| | `AC-18.1` | Thiếu Idempotency-Key trả về 400 Bad Request | Integration | `TC-PAY-02` | `apps/api/src/modules/payments/**` |
| | `AC-18.2` | Gửi 2 lần cùng Idempotency-Key chỉ tạo 1 payment | Integration | `TC-PAY-03` | `apps/api/src/modules/payments/**` |
| | `AC-18.3` | Cùng Idempotency-Key nhưng khác body trả về 409 | Integration | `TC-PAY-04` | `apps/api/src/modules/payments/**` |
| | `AC-19.1` | Mô phỏng thất bại trả về PAYMENT_FAILED | Integration | `TC-PAY-05` | `apps/api/src/modules/payments/**` |
| **History**| `AC-21.1` | Xem danh sách đơn hàng đã mua | Integration | `TC-HIST-01` | `apps/api/src/modules/orders/history/**` |
| | `AC-21.3` | Không xem được đơn của người dùng khác | Integration | `TC-HIST-02` | `apps/api/src/modules/orders/history/**` |
| | `AC-22.1` | Xem chi tiết đơn hàng cũ và lịch sử trạng thái | Integration | `TC-HIST-03` | `apps/api/src/modules/orders/history/**` |
