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
| | `AC-01.4` | Dữ liệu đăng ký không hợp lệ hoặc gửi kèm trường `role` trả về 400 | Unit | `TC-AUTH-08` | `apps/api/src/modules/auth/auth.service.spec.ts` |
| | `AC-02.1` | Đăng nhập đúng trả về 200 OK + JWT accessToken | Integration | `TC-AUTH-04` | `apps/api/src/modules/auth/**` |
| | `AC-02.2` | Đăng nhập sai mật khẩu trả về 401 Unauthorized | Integration | `TC-AUTH-05` | `apps/api/src/modules/auth/**` |
| | `AC-02.3` | Đăng nhập thiếu email/mật khẩu hoặc sai định dạng trả về 400 | Integration | `TC-AUTH-09` | `apps/api/src/modules/auth/**` |
| | `AC-03.1` | Truy cập API bảo vệ không có token trả về 401 (trừ route `vnpay/ipn`) | Integration | `TC-AUTH-06` | `apps/api/test/health.spec.ts` |
| | `AC-03.2` | Token hết hạn hoặc sai chữ ký trả về 401 Unauthorized | Integration | `TC-AUTH-10` | `apps/api/src/modules/auth/**` |
| | `AC-03.3` | Customer gọi API admin trả về 403 Forbidden | Unit/Guard | `TC-AUTH-07` | `apps/api/src/common/guards/**` |
| **Menu** | `AC-04.1` | Lọc sản phẩm theo danh mục hiển thị đúng món | Component | `TC-MENU-01` | `apps/web/src/**/menu/**` |
| | `AC-05.1` | Lấy danh sách sản phẩm trả về mã 200 | Integration | `TC-MENU-02` | `apps/api/src/modules/products/**` |
| | `AC-06.1` | Tìm kiếm món theo từ khóa gần đúng | Component | `TC-MENU-04` | `apps/web/src/**/menu/**` |
| **Detail** | `AC-07.1` | Lấy chi tiết món thành công trả về 200 | Integration | `TC-DETAIL-01` | `apps/api/src/modules/products/**` |
| | `AC-07.2` | Lấy chi tiết món không tồn tại trả về 404 | Integration | `TC-DETAIL-02` | `apps/api/src/modules/products/**` |
| | `AC-08.1` | Chọn kích cỡ size S/M/L giá thay đổi tương ứng | Unit | `TC-DETAIL-03` | `apps/api/src/modules/pricing/**` |
| | `AC-08.2` | Chọn tối đa 3 topping, vượt quá 3 bị chặn | Component | `TC-DETAIL-04` | `apps/web/src/app/products/**` |
| | `AC-09.2` | Backend tính lại giá bảo vệ tính toàn vẹn | Unit | `TC-DETAIL-05` | `apps/api/src/modules/pricing/**` |
| **Cart** | `AC-10.1` | Thêm món cùng size/topping tăng số lượng | Unit Store | `TC-CART-01` | `apps/web/src/store/useCartStore.ts` |
| | `AC-10.2` | Sửa size/topping trong giỏ cập nhật hoặc gộp dòng trùng | Unit Store | `TC-CART-05` | `apps/web/src/store/useCartStore.ts` |
| | `AC-10.3` | Giảm về 0 hoặc xóa món khỏi giỏ hàng | Unit Store | `TC-CART-02` | `apps/web/src/store/useCartStore.ts` |
| | `AC-11.1` | Tổng tiền giỏ hàng tính đúng theo số lượng & topping | Unit Store | `TC-CART-03` | `apps/web/src/store/useCartStore.ts` |
| | `AC-11.2` | Cập nhật tổng tiền & badge tức thì khi thay đổi giỏ hàng | Unit Store | `TC-CART-06` | `apps/web/src/store/useCartStore.ts` |
| | `AC-12.1` | Lưu trữ bền vững giỏ hàng trong `localStorage` khi reload | Unit Store | `TC-CART-07` | `apps/web/src/store/useCartStore.ts` |
| | `AC-12.2` | Thanh toán thất bại GIỮ NGUYÊN giỏ hàng | Component | `TC-CART-04` | `apps/web/src/app/cart/**` |
| | `AC-12.3` | Chỉ xóa sạch giỏ hàng (`clearCart`) sau khi thanh toán `PAID` | Component | `TC-CART-08` | `apps/web/src/app/checkout/payment/page.tsx` |
| **Order** | `AC-13.1` | Tạo đơn hàng mới chuyển trạng thái PENDING | Integration | `TC-ORDER-01` | `apps/api/src/modules/orders/**` |
| | `AC-14.1` | Không đủ nguyên liệu từ chối tạo đơn với 400 | Integration | `TC-ORDER-02` | `apps/api/src/modules/orders/**` |
| | `AC-14.2` | Bắn nhiều đơn song song không bị âm kho nguyên liệu | Concurrency | `TC-ORDER-03` | `apps/api/test/concurrency.ts` |
| | `AC-15.1` | Áp dụng mã giảm giá hợp lệ trừ đúng tiền | Unit | `TC-ORDER-04` | `apps/api/src/modules/promotions/**` |
| | `AC-16.1` | Chuyển đổi trạng thái đúng thứ tự state machine | Unit | `TC-ORDER-05` | `apps/api/src/modules/orders/**` |
| | `AC-16.3` | Chuyển sai trạng thái bị chặn với 409 Conflict | Unit | `TC-ORDER-06` | `apps/api/src/modules/orders/**` |
| **Payment** | `AC-17.1` | Chọn E_WALLET / BANK_CARD; request gửi đúng method | Component | `TC-PAY-15` | `apps/web/src/app/checkout/payment/**` |
| | `AC-17.2` | Mock mặc định SUCCESS; X-Mock-Outcome: FAILED trong môi trường test trả FAILED | Integration | `TC-PAY-01`, `TC-PAY-05` | `apps/api/src/modules/payments/**` |
| | `AC-17.3` | Kiểm thử Mock độc lập trên CI, không gọi VNPay hoặc cần merchant secret | Unit/Integration | `TC-PAY-16` | `apps/api/src/modules/payments/**` |
| | `AC-17.4` | Tạo URL VNPay ký hợp lệ và chuyển browser tới Sandbox | Integration/E2E | `TC-PAY-07` | `apps/api/src/modules/payments/vnpay/**`, `apps/web/src/app/checkout/payment/**` |
| | `AC-17.5` | POST gateway VNPAY lưu Payment PENDING, transactionRef = paymentId, trả id/paymentUrl | Integration | `TC-PAY-07` | `apps/api/src/modules/payments/**` |
| | `AC-17.6` | Đọc cấu hình VNPay từ env Backend; HASH_SECRET không đưa vào Frontend | Unit/Config | `TC-PAY-06` | `apps/api/src/modules/payments/vnpay/**`, `docs/deployment.md` |
| | `AC-18.1` | Thiếu/rỗng Idempotency-Key trả 400; không tạo Payment | Integration | `TC-PAY-02` | `apps/api/src/modules/payments/**` |
| | `AC-18.2` | Cùng key/body trả kết quả cũ, chỉ 1 Payment; không gọi Gateway/cộng điểm lại | Integration | `TC-PAY-03` | `apps/api/src/modules/payments/**` |
| | `AC-18.3` | Cùng key nhưng khác orderId/method/gateway trả 409 Conflict | Integration | `TC-PAY-04` | `apps/api/src/modules/payments/**` |
| | `AC-18.4` | IPN gửi lặp hoặc đồng thời: chỉ 1 lần cập nhật/cộng điểm; lần đã xử lý trả RspCode 02 | Integration/Concurrency | `TC-PAY-08` | `apps/api/src/modules/payments/**` |
| | `AC-19.1` | Mock FAILED hoặc IPN lỗi/hủy có chữ ký hợp lệ cập nhật Payment FAILED | Integration | `TC-PAY-05`, `TC-PAY-17` | `apps/api/src/modules/payments/**` |
| | `AC-19.2` | Giao dịch lỗi/hủy đã xác minh, Order PENDING chuyển PAYMENT_FAILED; không cộng loyalty | Integration | `TC-PAY-05`, `TC-PAY-17` | `apps/api/src/modules/payments/**` |
| | `AC-19.3` | Thất bại/hủy giữ nguyên giỏ ở cả Mock và VNPay; redirect VNPay chưa xóa giỏ, chỉ SUCCESS mới xóa | Component/E2E | `TC-CART-04` | `apps/web/src/app/checkout/payment/**`, `apps/web/src/app/payment/vnpay-return/**` |
| | `AC-19.4` | Retry cùng Order bằng key mới: PAYMENT_FAILED → PENDING; không trừ kho lần nữa | Integration/Component | `TC-PAY-09` | `apps/api/src/modules/payments/**`, `apps/web/src/app/checkout/payment/**` |
| | `AC-19.5` | Chưa có xác nhận qua IPN/fallback thì Payment vẫn PENDING; hết polling không tự kết luận FAILED/SUCCESS | Integration/Component | `TC-PAY-10` | `apps/api/src/modules/payments/**`, `apps/web/src/app/payment/vnpay-return/**` |
| | `AC-20.1` | HMAC sai bị từ chối RspCode 97, không đổi dữ liệu; HMAC hợp lệ vẫn phải xét mã kết quả | Unit/Integration | `TC-PAY-11`, `TC-PAY-12`, `TC-PAY-17` | `apps/api/src/modules/payments/vnpay/**`, `apps/api/src/modules/payments/**` |
| | `AC-20.2` | vnp_TxnRef không có Payment VNPAY trả 01; số tiền lệch trả 04; không đổi Payment/Order/loyalty | Integration | `TC-PAY-13` | `apps/api/src/modules/payments/**` |
| | `AC-20.3` | Return URL đưa về Frontend; query có chữ ký gửi fallback qua Backend, sau đó GET Payment theo paymentId/JWT trước khi hiển thị | Component/Integration | `TC-PAY-14` | `apps/web/src/app/payment/vnpay-return/**`, `apps/web/src/services/payment.service.ts` |
| | `AC-20.4` | IPN hoạt động độc lập với browser: mã 00/00 cập nhật Payment SUCCESS, Order PENDING → PAID và cộng loyalty 1 lần | Integration | `TC-PAY-11`, `TC-PAY-08` | `apps/api/src/modules/payments/**` |
| **History**| `AC-21.1` | Xem danh sách đơn hàng đã mua | Integration | `TC-HIST-01` | `apps/api/src/modules/orders/history/**` |
| | `AC-21.3` | Không xem được đơn của người dùng khác | Integration | `TC-HIST-02` | `apps/api/src/modules/orders/history/**` |
| | `AC-22.1` | Xem chi tiết đơn hàng cũ và lịch sử trạng thái | Integration | `TC-HIST-03` | `apps/api/src/modules/orders/history/**` |

## 2. GHI CHÚ PAYMENT THEO CODE FREEZE

Các Test Case ID là kịch bản cần hiện thực/kiểm chứng, không phải bằng chứng test đã chạy hoặc đã pass. Mapping Payment có đủ 19 AC từ fr-payment.md; nhiều AC có thể dùng cùng Test ID nếu test có đủ assertion.

- `TC-PAY-11`: IPN có HMAC, tham chiếu và số tiền hợp lệ, mã kết quả `00/00`, Order `PENDING` → Payment `SUCCESS`, Order `PAID`, loyalty một lần.
- `TC-PAY-17`: IPN lỗi/hủy vẫn có HMAC hợp lệ → Payment `FAILED`, Order `PAYMENT_FAILED`, không cộng loyalty. `RspCode: '00'` xác nhận xử lý thông báo, không phải giao dịch thành công.
- `TC-PAY-18` (bổ sung cho UC-ORD-01, Exc-10 / AC-UC-14): IPN thành công đến sau Order `CANCELLED` → Payment `SUCCESS`, ghi cần hoàn tiền thủ công, giữ Order `CANCELLED`, không cộng loyalty, handler trả `RspCode: '00'`.
- `TC-CART-04` cần kiểm chứng yêu cầu giữ giỏ ở cả Mock và VNPay. Code đã đồng bộ main giữ giỏ khi redirect VNPay và chỉ xóa khi Backend trả SUCCESS; cần assert cả giỏ và trạng thái đơn khi lỗi/hủy.
- Smoke test Sandbox cần kiểm tra cả body IPN: `TransformInterceptor` hiện bọc `RspCode/Message` trong `data`. HTTP 200 đơn lẻ chưa chứng minh cổng đã chấp nhận callback.
