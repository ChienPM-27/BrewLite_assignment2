# BIÊN BẢN SPRINT REVIEW & RETROSPECTIVE — BREWLITE

> **Dự án**: Nền tảng đặt đồ uống trực tuyến BrewLite  
> **Thời gian tổ chức**: 20:00 - 21:30 ngày 14/11/2026  
> **Địa điểm**: Họp trực tuyến Google Meet  
> **Chủ trì**: Phạm Minh Chiến (Leader / Scrum Master)  
> **Thư ký**: Tôn Thất Hạnh  
> **Thành phần tham dự**: Đầy đủ 7/7 thành viên nhóm (Phạm Minh Chiến, Nhật Lan, Vũ Hoàng Huy, Quách Tuấn Hào, Tôn Thất Hạnh, Nguyễn Trần Gia Kiệt, Nguyễn Quang Huy).

---

## 1. SPRINT REVIEW (TỔNG KẾT & NGHIỆM THU DỰ ÁN)

### 1.1. Mục tiêu Sprint & Mức độ hoàn thành
Toàn bộ nhóm đã kiểm chứng luồng nghiệp vụ end-to-end trên hệ thống và nghiệm thu 100% mục tiêu của đồ án Assignment 2:
1. **Hoàn thiện MVP Đặt món & Thanh toán**:
   - Luồng nghiệp vụ: Đăng ký/Đăng nhập JWT ➔ Duyệt thực đơn ➔ Tùy biến món (Size S/M/L, chọn topping) ➔ Giỏ hàng tức thì ➔ Tạo đơn hàng ➔ Thanh toán qua VNPay Sandbox / Mock Gateway ➔ Theo dõi lịch sử đơn hàng.
   - Quản lý kho nguyên liệu theo Change Request CR-01: Trừ kho nguyên liệu nguyên tử theo công thức, tự động hoàn trả kho khi đơn bị hủy hoặc lỗi thanh toán.
2. **Chất lượng Kiểm thử (Test Automation)**:
   - Đạt 100% pass trên CI với 169 unit tests, 4 bộ integration test với PostgreSQL database thật, và bộ kiểm thử End-to-End Playwright.
3. **Triển khai Production Cloud & Tự động hóa**:
   - Frontend PWA hoạt động trên Vercel: `https://brewlite-frontend.vercel.app`
   - Backend NestJS hoạt động trên Render: `https://brewlite.onrender.com/api/v1`
   - Cơ sở dữ liệu PostgreSQL vận hành trên Supabase Cloud.
   - Pipeline CI/CD tự động hóa kiểm tra và triển khai hoàn chỉnh.

### 1.2. Nghiệm thu sản phẩm (DoD Checklist)
- [x] 100% các tiêu chí chấp nhận (AC) của 22 Yêu cầu Chức năng (FR-01..22) đều có test case tự động kiểm chứng.
- [x] Không còn thông tin nhạy cảm / credentials hard-code trong mã nguồn.
- [x] Bảng ma trận truy vết `docs/traceability-matrix.md` liên kết đầy đủ 5 cột.
- [x] Hệ thống khởi chạy cục bộ thành công bằng 1 lệnh duy nhất với Docker Compose.

---

## 2. SPRINT RETROSPECTIVE (ĐÁNH GIÁ & RÚT KINH NGHIỆM)

### 2.1. Điều đã làm tốt (What went well)
1. **Áp dụng quy trình Agile/Scrum chặt chẽ**: Phân chia rõ ràng trách nhiệm từng thành viên, tuân thủ nghiêm ngặt quy tắc nhánh tính năng (`feature branch`) và kiểm duyệt Pull Request (Code Review) trước khi merge vào `main`.
2. **Kỷ luật Tự động hóa (CI First)**: Mọi commit đều được CI chạy tự động kiểm tra lint, unit test, integration test và build. Nhờ đó không bao giờ có lỗi syntax hoặc logic làm gãy nhánh chính.
3. **Thiết kế kiến trúc vững chắc**: Việc tách biệt rõ ràng các tầng (Domain Layer, Service Layer, Controller) và áp dụng Finite State Machine cho vòng đời đơn hàng giúp hệ thống vận hành cực kỳ ổn định, chống tranh chấp tài nguyên hiệu quả.
4. **Tài liệu hóa chi tiết (Docs-as-Code)**: 9 hồ sơ quyết định kiến trúc (ADR) và hệ thống sơ đồ UML bằng PlantUML giúp cả nhóm hiểu sâu và thống nhất logic nghiệp vụ từ đầu đến cuối.

### 2.2. Điểm cần cải thiện (What could be improved)
1. **Quản lý thời gian ở giai đoạn đầu**: Giai đoạn đầu còn mất thời gian tranh luận về công nghệ và phạm vi tính năng; nếu chốt sớm Definition of Done từ Sprint 0 thì tốc độ phát triển sẽ nhanh hơn nữa.
2. **Xử lý môi trường kiểm thử CI**: Việc chạy các bài test tích hợp có container PostgreSQL trên GitHub Actions ban đầu gặp một số lỗi timeout do tài nguyên máy ảo miễn phí; sau khi tối ưu cấu hình và index dữ liệu test thì thời gian chạy đã giảm đáng kể.

### 2.3. Kế hoạch hành động & Backlog phiên bản tương lai (Action Items / Next Release)
1. **Thông báo đẩy thời gian thực (Web Push / WebSocket)**: Phát triển tính năng thông báo trạng thái đơn hàng (Đang pha chế ➔ Đã sẵn sàng) theo thời gian thực tới trình duyệt của khách hàng.
2. **Tích hợp thêm cổng thanh toán thật**: Bổ sung MoMo, ZaloPay và Apple Pay bên cạnh VNPay.
3. **Mở rộng module Khuyến mãi**: Cho phép tạo các chiến dịch Flash Sale theo khung giờ vàng và mã giảm giá theo hạng thành viên (Bạc, Vàng, Kim Cương).

---

## 3. CHỮ KÝ XÁC NHẬN CỦA CÁC THÀNH VIÊN

Biên bản được toàn thể 7 thành viên thống nhất thông qua và làm căn cứ bàn giao đồ án:

1. **Phạm Minh Chiến** *(Trưởng nhóm)*: `Đã ký duyệt`
2. **Nhật Lan**: `Đã ký duyệt`
3. **Vũ Hoàng Huy**: `Đã ký duyệt`
4. **Quách Tuấn Hào**: `Đã ký duyệt`
5. **Tôn Thất Hạnh**: `Đã ký duyệt`
6. **Nguyễn Trần Gia Kiệt**: `Đã ký duyệt`
7. **Nguyễn Quang Huy**: `Đã ký duyệt`
