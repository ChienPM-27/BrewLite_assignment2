# BrewLite - Hệ Thống Đặt Cà Phê Không Dùng Tiền Mặt

BrewLite là nền tảng đặt món và thanh toán trực tuyến cho chuỗi cửa hàng cà phê, hỗ trợ trải nghiệm gọi món nhanh chóng, tùy chỉnh công thức linh hoạt và thanh toán an toàn.

---

## 1. Cấu Trúc Thư Mục

```text
BrewLite/
├── apps/
│   ├── api/                   # Backend API (NestJS, Prisma ORM, PostgreSQL)
│   └── web/                   # Frontend Web Application (Next.js 15, Tailwind CSS, PWA)
├── docs/                      # Tài liệu dự án
│   ├── architecture/adr/      # Architecture Decision Records
│   ├── diagrams/              # Biểu đồ thiết kế (UML, Sequence, ERD)
│   ├── requirements/          # Đặc tả yêu cầu phần mềm
│   ├── deployment.md          # Tài liệu hướng dẫn triển khai
│   └── traceability-matrix.md # Ma trận truy vết yêu cầu (Traceability Matrix)
├── tests/                     # Kiểm thử hệ thống & end-to-end
├── docker-compose.yml         # Cấu hình container Docker cho toàn hệ thống
├── .env.example               # Mẫu biến môi trường dev
└── .nvmrc                     # Phiên bản Node.js chuẩn (Node 22)
```

---

## 2. Khởi Chạy Local Với Docker Compose

Yêu cầu môi trường: Docker & Docker Compose.

```bash
# 1. Sao chép biến môi trường mẫu
cp .env.example .env

# 2. Khởi chạy toàn bộ hệ thống
docker compose up --build
```

- **Frontend (Web):** `http://localhost:3000`
- **Backend (API):** `http://localhost:4000/api/v1`
- **Database (PostgreSQL):** `localhost:5432`

---

## 3. Chạy Lint / Test / Build

### Backend (`apps/api`)
```bash
cd apps/api
npm ci
npm run lint          # Kiểm tra mã nguồn với ESLint
npm run test:ci       # Chạy unit & integration test qua Jest
npm run build         # Build production bundle NestJS
```

### Frontend (`apps/web`)
```bash
cd apps/web
npm ci
npm run lint          # Kiểm tra mã nguồn với Next.js ESLint
npm test              # Kiểm thử frontend
npm run build         # Build production Next.js App Router
```

---

## 4. Deploy

TODO

---

## 5. Rollback

TODO
