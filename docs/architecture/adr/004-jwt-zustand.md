# ADR-004: Xác Thực JWT Stateless Kết Hợp Bcrypt Và Quản Lý Giỏ Hàng Bằng Zustand

> **Trạng thái**: Accepted  
> **Ngày quyết định**: 2026-11-11  
> **Người đề xuất**: Quách Tuấn Hào  
> **Người duyệt**: Phạm Minh Chiến (Leader)  
> **Phạm vi áp dụng**: `apps/api/src/modules/auth`, `apps/api/src/common/guards`, `apps/web/src/store`, `apps/web/src/app/auth`, `apps/web/src/app/cart`

---

## 1. BỐI CẢNH & VẤN ĐỀ (CONTEXT & PROBLEM STATEMENT)

Hệ thống đặt cà phê trực tuyến **BrewLite** được triển khai theo mô hình tách biệt giữa Frontend (`Next.js 15 App Router` trên Vercel) và Backend REST API (`NestJS 11` trên Render). Trong luồng nghiệp vụ toàn trình từ *Xem menu ➔ Tùy chọn món ➔ Giỏ hàng ➔ Đặt đơn & Thanh toán*, hệ thống cần giải quyết hai bài toán kiến trúc cốt lõi:

1. **Xác thực người dùng & Phân quyền truy cập (`FR-01..03`, `NFR-02`)**:
   - Cần cơ chế đăng ký, đăng nhập an toàn, bảo vệ mật khẩu người dùng bằng thuật toán băm một chiều (không lưu plaintext).
   - Cơ chế xác thực API phải hoạt động ổn định qua môi trường Cross-Origin (Vercel gọi sang Render), không gây tốn bộ nhớ lưu trữ phiên (session state) trên container Backend.
   - Bảo vệ các tuyến API nhạy cảm (`/orders`, `/payments`, `/admin/*`) và phân quyền rõ ràng theo vai trò (`CUSTOMER`, `ADMIN`, `BARISTA`).
2. **Quản lý trạng thái Giỏ hàng bền vững & Chịu lỗi (`FR-10..12`)**:
   - Khách hàng có thể duyệt menu, tùy biến kích cỡ (`S`, `M`, `L`), chọn tối đa 3 loại Topping và thêm món vào giỏ ngay cả khi chưa đăng nhập.
   - Giỏ hàng phải tự động nhận diện để gộp các dòng có cùng cấu hình (`productId + size + toppingIds`), tính tổng tiền tức thì không độ trễ và không bị mất dữ liệu khi tải lại trang (reload trình duyệt).
   - Đặc biệt, khi quá trình tạo đơn hoặc thanh toán gặp sự cố (lỗi mạng, hết nguyên liệu, cổng thanh toán trả về `FAILED`), hệ thống **bắt buộc giữ nguyên giỏ hàng** để khách hàng thử lại mà không phải chọn lại món từ đầu.

---

## 2. CÁC PHƯƠNG ÁN ĐÃ XEM XÉT (CONSIDERED OPTIONS)

### 2.1. Bài toán 1: Cơ chế Xác thực & Quản lý Phiên (Authentication)

- **Phương án 1A: Stateless JWT (JSON Web Token) + Passport JWT + Bcrypt**
  - Mật khẩu được băm bằng `bcrypt` (`salt rounds = 10`). Khi đăng ký hoặc đăng nhập hợp lệ, Backend ký chuỗi JWT (`HS256`) chứa thông tin định danh `{ sub, email, role }`. Client lưu token và gửi kèm trong header `Authorization: Bearer <token>`.
  - **Ưu điểm**: Hoàn toàn không trạng thái (stateless), không tốn bộ nhớ RAM hay truy vấn DB/Redis để tra cứu session ở mỗi request; hoạt động xuyên suốt giữa các domain khác nhau (Vercel ↔ Render); dễ dàng viết Unit Test và Integration Test.
  - **Nhược điểm**: Khó thu hồi (revoke) một token đơn lẻ ngay lập tức phía server trước thời điểm hết hạn (`exp`) nếu không dựng thêm bộ nhớ danh sách đen (blacklist).

- **Phương án 1B: Stateful Server-side Session + HTTP-only Cookie (Express Session / Redis)**
  - Máy chủ tạo bản ghi session trong bộ nhớ hoặc Redis và trả `session_id` qua Cookie.
  - **Ưu điểm**: Có thể hủy phiên đăng nhập tức thì từ phía server.
  - **Nhược điểm**: Làm mất tính stateless của REST API; phát sinh chi phí vận hành Redis; cấu hình `SameSite=None; Secure` cho Cross-Site Cookie giữa miền `.vercel.app` và `.onrender.com` thường xuyên bị chặn bởi chính sách bảo mật ITP trên trình duyệt di động (Safari iOS).

### 2.2. Bài toán 2: Quản lý Trạng thái Giỏ hàng phía Client (Client State Management)

- **Phương án 2A: Zustand kết hợp Middleware `persist` (`localStorage`)**
  - Sử dụng store tập trung của Zustand cho giỏ hàng (`useCartStore`) và phiên đăng nhập (`useAuthStore`), tự động đồng bộ xuống `localStorage`.
  - **Ưu điểm**: Dung lượng gói cực nhẹ (~1.2 KB), không cần bọc `<Provider>` phức tạp ở Root Layout, cập nhật state tức thì với cú pháp hook đơn giản, tích hợp sẵn cơ chế đánh phiên bản (`version`) và chuyển đổi dữ liệu (`migrate`), dễ dàng cô lập để viết Unit Test.
  - **Nhược điểm**: Cần xử lý đồng bộ trạng thái Hydration giữa Server-Side Rendering (SSR) và Client-Side trên Next.js.

- **Phương án 2B: Redux Toolkit (RTK) + `redux-persist`**
  - **Ưu điểm**: Cấu trúc chặt chẽ, công cụ DevTools mạnh.
  - **Nhược điểm**: Quá nhiều mã lặp (boilerplate: slice, reducer, provider, persist gate) không cần thiết đối với quy mô giỏ hàng của BrewLite; làm tăng kích thước bundle phía client.

- **Phương án 2C: React Context API + `useEffect` đồng bộ `localStorage` thủ công**
  - **Ưu điểm**: Có sẵn trong React, không cần cài thêm thư viện.
  - **Nhược điểm**: Khi bất kỳ thuộc tính nào trong giỏ hàng thay đổi, toàn bộ component con tiêu thụ Context đều bị re-render; phải tự viết tay logic đọc/ghi `localStorage` và xử lý lỗi parse JSON.

---

## 3. QUYẾT ĐỊNH (DECISION)

Chúng tôi chọn kết hợp **Phương án 1A (Stateless JWT + Bcrypt)** cho tầng xác thực Backend và **Phương án 2A (Zustand + `persist` middleware)** cho tầng quản lý trạng thái Giỏ hàng & Auth phía Frontend:

### 3.1. Thiết kế Xác thực & Phân quyền (Backend & Frontend Auth)
1. **Bảo mật mật khẩu (`AuthService`)**:
   - Email đầu vào được chuẩn hóa (`trim().toLowerCase()`) và kiểm tra tính duy nhất; nếu trùng lặp sẽ ném `409 ConflictException`.
   - Mật khẩu được băm bằng `bcrypt.hash(dto.password, 10)` (đáp ứng `NFR-02`: salt rounds >= 10, tuyệt đối không lưu mật khẩu dạng rõ).
2. **Cấp phát & Kiểm tra JWT (`JwtStrategy`, `JwtAuthGuard`, `RolesGuard`)**:
   - Payload JWT chuẩn hóa gồm `{ sub: user.id, email: user.email, role: user.role }`, được ký bằng `JWT_SECRET` với thời hạn mặc định `JWT_EXPIRATION=7d`.
   - `ValidationPipe` toàn cục bật cấu hình `whitelist: true` và `forbidNonWhitelisted: true`, tự động chặn và trả về `400 Bad Request` nếu client cố tình chèn trường `role: "ADMIN"` vào body đăng ký (chống leo thang đặc quyền — Mass Assignment).
   - `JwtAuthGuard` bảo vệ các endpoint yêu cầu đăng nhập (trả về `401 Unauthorized` nếu thiếu hoặc sai token). `RolesGuard` kết hợp decorator `@Roles(...)` kiểm tra vai trò người dùng (trả về `403 Forbidden` nếu `CUSTOMER` truy cập vào tuyến `/api/v1/admin/*`).

### 3.2. Thiết kế Quản lý Giỏ hàng bền vững (`useCartStore`)
1. **Khóa định danh dòng giỏ hàng tất định (Deterministic Line ID)**:
   - Mỗi dòng trong giỏ được sinh mã duy nhất theo công thức:
     `cartItemId = "${productId}-${size}-${[...toppingIds].sort().join('-')}"`
   - Đảm bảo 2 ly cùng sản phẩm nhưng khác kích cỡ hoặc khác Topping được tách thành 2 dòng riêng biệt; ngược lại nếu trùng hoàn toàn cấu hình sẽ tự động cộng dồn số lượng (giới hạn tối đa `MAX_QUANTITY_PER_LINE = 99`).
2. **Chữ ký giỏ hàng (`computeCartSignature`)**:
   - Tạo chuỗi chữ ký JSON đã sắp xếp từ danh sách món và mã khuyến mãi để theo dõi sự thay đổi của giỏ hàng khi đã có đơn `PENDING` (`pendingOrderId`).
3. **Cơ chế Lưu trữ & Giữ giỏ hàng khi lỗi (`FR-12`)**:
   - Lưu trữ bền vững trong `localStorage` dưới khóa `brewlite_cart_storage` (kèm cơ chế `version: 2` và hàm `migrate` an toàn).
   - Khi tạo đơn thất bại (hết nguyên liệu) hoặc thanh toán thất bại (`OrderStatus.PAYMENT_FAILED`), giỏ hàng vẫn được giữ nguyên vẹn 100%; hàm `clearCart()` chỉ được kích hoạt khi giao dịch thanh toán thành công (`OrderStatus.PAID`).

---

## 4. HỆ QUẢ (CONSEQUENCES)

### 4.1. Điểm tích cực (Positive / Pros)
- **Khả năng mở rộng & Độc lập hạ tầng**: Backend API hoàn toàn stateless, tương thích tuyệt đối với mô hình triển khai container trên Render và gọi chéo miền từ Vercel.
- **Trải nghiệm người dùng liền mạch**: Thao tác thêm/sửa/xóa món và tính tổng tiền giỏ hàng phản hồi tức thì (0ms network latency); tải lại trang hoặc gặp sự cố thanh toán không làm mất giỏ hàng của khách.
- **Dễ kiểm thử (High Testability)**: Cả `AuthService`, `RolesGuard` lẫn `useCartStore` đều có thể kiểm thử độc lập bằng Unit Test với tốc độ rất nhanh.

### 4.2. Điểm hạn chế & Biện pháp khắc phục (Cons & Mitigation)
- **Hạn chế của Stateless JWT (Khó thu hồi token trước hạn)**:
  - *Thách thức*: Vì server không lưu trạng thái session, một JWT sau khi cấp phát sẽ tiếp tục hợp lệ cho tới khi hết hạn (`exp`), gây khó khăn nếu muốn cưỡng bức đăng xuất từ phía server.
  - *Biện pháp khắc phục*: Giới hạn thời gian sống của token (`JWT_EXPIRATION=7d` cho môi trường dev/demo), chỉ lưu các trường định danh tối thiểu (`sub`, `email`, `role`) trong payload, và thiết lập cơ chế tự động xóa sạch token (`localStorage.removeItem('token')`) kèm chuyển hướng về `/auth/login?next=...` ngay khi `fetchApi` nhận phản hồi `401 Unauthorized`.
- **Không tin cậy giá tạm tính từ Client (`estimatedUnitPrice`)**:
  - *Thách thức*: Dữ liệu lưu trong `localStorage` có thể bị người dùng chỉnh sửa thủ công qua trình duyệt.
  - *Biện pháp khắc phục*: Giá trong `useCartStore` chỉ mang tính chất hiển thị tạm tính tại giao diện; khi gửi request `POST /api/v1/orders`, Backend chỉ nhận `productId`, `size`, `toppingIds`, `quantity` và bắt buộc tính toán lại toàn bộ giá trị đơn hàng từ Database thông qua `PricingService` (`FR-09`).
- **Hiện tượng Hydration Mismatch trên Next.js**:
  - *Thách thức*: `localStorage` không tồn tại trong quá trình render trên Server của Next.js.
  - *Biện pháp khắc phục*: Sử dụng custom hook `useHydrated` để trì hoãn việc hiển thị số lượng badge giỏ hàng cho đến khi ứng dụng đã mount hoàn tất trên trình duyệt.

---

## 5. LIÊN KẾT MÃ NGUỒN & TRUY VẾT (CODE & TRACEABILITY)

- **Đặc tả yêu cầu liên quan**:
  - [docs/requirements/fr-auth.md](../../requirements/fr-auth.md) (`FR-01`, `FR-02`, `FR-03`)
  - [docs/requirements/fr-cart.md](../../requirements/fr-cart.md) (`FR-10`, `FR-11`, `FR-12`)
  - [docs/requirements/srs.md](../../requirements/srs.md) (`NFR-02`)
- **Sơ đồ thiết kế liên quan**:
  - [docs/diagrams/activity-e2e.puml](../../diagrams/activity-e2e.puml), [docs/diagrams/activity-e2e.svg](../../diagrams/activity-e2e.svg)
- **Mã nguồn Backend (Auth & RBAC)**:
  - [apps/api/src/modules/auth/auth.service.ts](../../../apps/api/src/modules/auth/auth.service.ts)
  - [apps/api/src/modules/auth/strategies/jwt.strategy.ts](../../../apps/api/src/modules/auth/strategies/jwt.strategy.ts)
  - [apps/api/src/modules/auth/guards/jwt-auth.guard.ts](../../../apps/api/src/modules/auth/guards/jwt-auth.guard.ts)
  - [apps/api/src/common/guards/roles.guard.ts](../../../apps/api/src/common/guards/roles.guard.ts)
- **Mã nguồn Frontend (Zustand Stores & API Client)**:
  - [apps/web/src/store/useCartStore.ts](../../../apps/web/src/store/useCartStore.ts)
  - [apps/web/src/store/useAuthStore.ts](../../../apps/web/src/store/useAuthStore.ts)
  - [apps/web/src/lib/api-client.ts](../../../apps/web/src/lib/api-client.ts)
- **Kiểm thử tự động (Unit Tests)**:
  - [apps/api/src/modules/auth/auth.service.spec.ts](../../../apps/api/src/modules/auth/auth.service.spec.ts)
  - [apps/api/src/common/guards/roles.guard.spec.ts](../../../apps/api/src/common/guards/roles.guard.spec.ts)
