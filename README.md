# ☕ BrewLite — Nền Tảng Đặt Cà Phê Trực Tuyến Không Dùng Tiền Mặt

[![BrewLite CI Pipeline](https://github.com/ChienPM-27/BrewLite_assignment2/actions/workflows/ci.yml/badge.svg)](https://github.com/ChienPM-27/BrewLite_assignment2/actions/workflows/ci.yml)
[![Version](https://img.shields.io/badge/version-v1.0.0-blue.svg)](https://github.com/ChienPM-27/BrewLite_assignment2/releases/tag/v1.0.0)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

BrewLite là nền tảng đặt đồ uống trực tuyến và thanh toán không dùng tiền mặt, tối ưu hóa cho thiết bị di động (Mobile-First PWA), xây dựng theo kiến trúc Monorepo hiện đại với NestJS, Next.js, PostgreSQL và quy trình tự động hóa CI/CD hoàn chỉnh.

---

## 🌐 1. Địa Chỉ Triển Khai Thực Tế (Live Production)

Hệ thống đã được đóng gói và triển khai vận hành thực tế trên nền tảng đám mây (Cloud Hybrid) với đầy đủ chứng chỉ bảo mật HTTPS:

* **Frontend Web Application (Next.js 15 PWA)**: [https://brewlite-frontend.vercel.app](https://brewlite-frontend.vercel.app)
* **Backend REST API (NestJS 11)**: [https://brewlite.onrender.com/api/v1](https://brewlite.onrender.com/api/v1)
* **Health Check Endpoint**: [https://brewlite.onrender.com/api/v1/health](https://brewlite.onrender.com/api/v1/health)
* **Database**: PostgreSQL 16 quản lý trên nền tảng Supabase Cloud (AWS Singapore `ap-southeast-1`).
* **CI/CD Pipeline**: GitHub Actions tự động kiểm thử và triển khai tại [.github/workflows/](.github/workflows/).

---

## 📁 2. Cấu Trúc Thư Mục Dự Án (Monorepo)

```text
BrewLite/
├── apps/
│   ├── api/                   # Backend API (NestJS 11, Prisma ORM, PostgreSQL)
│   │   ├── src/               # Mã nguồn module (auth, products, orders, payments, pricing,...)
│   │   └── test/              # Integration tests kết nối DB thật (orders, products, health)
│   └── web/                   # Frontend Web Application (Next.js 15 App Router, Tailwind CSS, Zustand)
│       └── src/               # UI components, Zustand stores, pages, vitest component tests
├── docs/                      # Toàn bộ tài liệu kỹ thuật theo chuẩn Docs-as-Code
│   ├── requirements/          # Task 1: SRS, AC (Given-When-Then), Use Case đặt & thanh toán
│   ├── diagrams/              # Task 2: Sơ đồ thiết kế UML (.puml và vector .svg)
│   ├── architecture/          # Task 3: Mô tả kiến trúc C4, 9 hồ sơ ADR, Từ điển dữ liệu
│   │   └── adr/               # ADR-001 đến ADR-009
│   ├── evidence/              # Minh chứng thực nghiệm (CI, smoke test, production check, demo link)
│   ├── sprint/                # Biên bản nghiệm thu Sprint Review & Retrospective
│   ├── deployment.md          # Chi tiết cấu hình môi trường Production Cloud
│   ├── local-development.md   # Hướng dẫn chạy môi trường cục bộ
│   └── traceability-matrix.md # Task 5.4: Ma trận truy vết 22 FR sang Use-case, Sơ đồ, Code và Test
├── tests/                     # Task 5.2: Bộ kiểm thử tích hợp hệ thống & End-to-End Playwright
├── .github/workflows/         # Task 4 & 5.3: Pipeline CI (ci.yml) và Pipeline CD (cd.yml)
├── docker-compose.yml         # Container hóa toàn bộ hệ thống phục vụ chạy cục bộ
├── .env.example               # Mẫu cấu hình biến môi trường
└── README.md                  # Hướng dẫn tổng quan bàn giao
```

---

## 💻 3. Khởi Chạy Local 1 Lệnh Với Docker Compose

Yêu cầu hệ thống: Đã cài đặt **Docker** và **Docker Compose**.

```bash
# 1. Sao chép biến môi trường mẫu
cp .env.example .env

# 2. Khởi chạy toàn bộ hệ thống (Web + API + PostgreSQL)
docker compose up --build
```

Sau khi khởi chạy thành công:
* **Frontend Web**: [http://localhost:3000](http://localhost:3000)
* **Backend API**: [http://localhost:4000/api/v1](http://localhost:4000/api/v1)
* **Health Check**: [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health)
* **PostgreSQL Database**: `localhost:5432` (Username: `postgres`, Password: `postgrespassword`, DB: `brewlite`)

---

## 🧪 4. Chạy Kiểm Thử Tự Động (Lint / Test / Build)

### 4.1. Backend API (`apps/api`)
```bash
cd apps/api
npm ci

# 1. Kiểm tra chất lượng mã nguồn (ESLint)
npm run lint

# 2. Chạy Unit Tests
npm run test:ci

# 3. Chạy Integration Tests với Cơ sở dữ liệu PostgreSQL
npm run test:int

# 4. Biên dịch Production Build
npm run build
```

### 4.2. Frontend Web (`apps/web`)
```bash
cd apps/web
npm ci

# 1. Kiểm tra chất lượng mã nguồn (Next.js ESLint)
npm run lint

# 2. Chạy Component & Store Tests (Vitest)
npm test

# 3. Biên dịch Production Next.js App Router
npm run build
```

### 4.3. Kiểm thử luồng End-to-End (Playwright)
```bash
# Chạy toàn bộ kịch bản E2E kiểm tra luồng Đặt món -> Giỏ hàng -> Thanh toán
cd tests
npm ci
npx playwright test
```

---

## 🚀 5. Quy Trình Triển Khai (Deployment)

BrewLite thiết lập quy trình triển khai tự động Continuous Delivery thông qua file [.github/workflows/cd.yml](.github/workflows/cd.yml) khi có sự kiện đẩy code lên nhánh `main` hoặc tạo Tag Release:

1. **Quality Gates**: Toàn bộ Lint, Unit test, Integration test và Build phải PASS 100%.
2. **Triển khai Frontend (Vercel)**: Tự động kích hoạt Vercel Deploy Hook hoặc GitHub Integration để cập nhật mã nguồn mới lên Edge CDN của Vercel.
3. **Triển khai Backend (Render)**: Tự động kích hoạt Render Deploy Hook (`RENDER_DEPLOY_HOOK`), Render tự động kéo image từ GitHub, chạy container NestJS và chuyển hướng lưu lượng.
4. **Cơ sở dữ liệu (Supabase)**: Chạy an toàn Prisma Migrate deploy mà không gây gián đoạn dịch vụ.
5. **Hậu triển khai (Post-deploy Smoke Test)**: Chạy kiểm tra `/health` và các API then chốt để xác nhận bản phát hành hoạt động ổn định.

---

## 🔄 6. Quy Trình Khôi Phục Sự Cố (Rollback Procedure)

Trong trường hợp bản phát hành mới gặp sự cố tại môi trường Production:

1. **Rollback tức thì trên Vercel (Frontend)**:
   - Truy cập Vercel Dashboard ➔ Tab **Deployments**.
   - Tìm bản triển khai ổn định liền trước ➔ Bấm nút **...** ➔ Chọn **Promote to Production** (khôi phục tức thì trong < 10 giây).
2. **Rollback trên Render (Backend API)**:
   - Truy cập Render Dashboard ➔ Dịch vụ `brewlite-api`.
   - Vào tab **Deploys** ➔ Chọn bản deploy thành công trước đó ➔ Chọn **Rollback to this deploy**.
   - Hoặc revert commit lỗi trên nhánh `main`:
     ```bash
     git revert HEAD -m 1
     git push origin main
     ```
3. **Rollback Cơ sở dữ liệu**:
   - Sử dụng tính năng **Point-in-Time Recovery (PITR)** trên Supabase Dashboard để khôi phục trạng thái CSDL về thời điểm trước khi phát hành sự cố.

---

## 👥 7. Phân Công Trách Nhiệm Nhóm (Roster)

| STT | Họ và tên | Mã sinh viên | Vai trò | Phân hệ phụ trách chính |
| :---: | :--- | :---: | :--- | :--- |
| 1 | **Phạm Minh Chiến** | *Leader / Scrum Master* | Trưởng nhóm | Kiến trúc, CI/CD, CD Pipeline, Docker & Release |
| 2 | **Nhật Lan** | *Developer* | Thành viên | Thực đơn, Danh mục, C4 Architecture & Local Dev |
| 3 | **Vũ Hoàng Huy** | *Developer* | Thành viên | Chi tiết sản phẩm, Class Diagram, Bảng giá Pricing |
| 4 | **Quách Tuách Hào** | *Developer* | Thành viên | Xác thực (Auth), Giỏ hàng (Cart) & Activity E2E |
| 5 | **Tôn Thất Hạnh** | *Developer* | Thành viên | Đặt hàng (Order), Tồn kho nguyên liệu & State Machine |
| 6 | **Nguyễn Trần Gia Kiệt**| *Developer* | Thành viên | Thanh toán (Payment), VNPay Sandbox & Smoke Test |
| 7 | **Nguyễn Quang Huy** | *QA / Tester* | Thành viên | Lịch sử đơn (History), E2E Playwright & Traceability |

---

## 📄 8. Giấy Phép & Bàn Giao
Dự án được bàn giao theo giấy phép mã nguồn mở MIT. Mọi tài liệu và mã nguồn tuân thủ nghiêm ngặt chuẩn mực kỹ thuật phần mềm.
