# 📖 QUY TẮC PHÁT TRIỂN & ĐÓNG GÓP — BREWLITE ASSIGNMENT 2

Tài liệu này quy định toàn bộ chuẩn mực làm việc nhóm trong suốt 3 Sprint của Assignment 2. Tất cả thành viên trong nhóm bắt buộc tuân thủ.

---

## 1. 🛡️ QUY TẮC SỞ HỮU TỆP TIN (CODE OWNERSHIP)

1. **Phạm vi cá nhân**: Mỗi thành viên **CHỈ ĐƯỢC CHỈNH SỬA** các file/thư mục được phân công cụ thể trong bảng kế hoạch (và file `.github/CODEOWNERS`).
2. **File dùng chung do Leader quản trị**:
   - Các file: `.github/**`, `docker-compose.yml`, `.env.example`, `apps/*/Dockerfile`, `apps/api/prisma/**`, `apps/api/src/common/**`, `apps/api/src/app.module.ts`, `apps/api/src/main.ts`, `apps/web/src/app/layout.tsx`, `apps/web/src/lib/api-client.ts`, `README.md`, `docs/deployment.md`.
   - Bất kỳ thay đổi nào liên quan đến file chung phải tạo Issue hoặc báo trước cho **Minh Chiến (Leader)** xử lý.

---

## 2. 🌿 QUY TẮC NHÁNH (GIT BRANCHING)

- Tuyệt đối **KHÔNG push trực tiếp vào nhánh `main`**. Nhánh `main` được bảo vệ bằng Branch Protection Rule.
- Mọi công việc phải xuất phát từ nhánh con với định dạng:
  ```text
  <loại-task>/<Mã-Task>-<mô-tả-ngắn>
  ```
  *Ví dụ:*
  - `docs/SP1-03-fr-menu`
  - `test/SP2-05-auth-cart`
  - `feat/SP2-07-smoke-test-script`
- **Thứ tự mở PR trong Sprint 1**:
  - Mỗi người mở 3 PR tuần tự: **Ngày 2 (Task 1) ➔ Ngày 3 (Task 2) ➔ Ngày 4 (Task 3)**.
  - Phải merge task trước rồi mới mở PR task sau để đảm bảo lịch sử commit sạch và đúng trình tự đề bài.
  - Giữa các thành viên: **Không xếp hàng theo tên**, PR nào CI xanh + có 1 review duyệt thì được merge ngay.

---

## 3. ✍️ QUY ƯỚC COMMIT MESSAGE

Mỗi commit message phải tuân thủ chuẩn Conventional Commits và **bắt buộc nêu rõ lý do** (theo yêu cầu đề bài):

```text
<type>(<scope>): <mô tả ngắn> - Lý do: <lý do thay đổi>
```

- **Types**:
  - `feat`: Tính năng mới
  - `fix`: Sửa lỗi
  - `docs`: Thêm/sửa tài liệu hoặc sơ đồ
  - `test`: Thêm/cập nhật test cases
  - `refactor`: Tái cấu trúc code (không đổi logic)
  - `chore`: Cấu hình, script, CI/CD
- *Ví dụ:*
  ```text
  docs(menu): add fr-menu.md with traceability table - Lý do: đặc tả yêu cầu chức năng xem thực đơn theo Task 1.2
  test(orders): add integration test for order stock deduction - Lý do: kiểm chứng AC trừ tồn kho theo Task 4.3
  ```

---

## 4. 🧪 QUY TẮC DỮ LIỆU KIỂM THỬ (TEST DATA GUIDELINES)

Để đảm bảo các bài test có thể chạy song song và lặp lại nhiều lần mà không xung đột:
1. **Dữ liệu riêng biệt**: Mỗi test suite phải tự sinh dữ liệu độc lập bằng `uuid` hoặc tiền tố riêng (ví dụ: `test-order-${uuid}`).
2. **Dọn dẹp chính xác**: Sau khi test xong (`afterAll`), chỉ xóa đúng các bản ghi do suite mình tạo ra.
3. **CẤM**:
   - Cấm dùng `deleteMany()` hoặc `TRUNCATE` mà không có điều kiện `WHERE`.
   - Cấm đọc, sửa hoặc xóa dữ liệu seed mẫu của hệ thống (`seed.ts`).
   - Cấm phụ thuộc vào thứ tự chạy của các test suite khác.
4. **Chạy test**: Kiểm thử integration backend luôn chạy với cờ `--runInBand` để tránh deadlock cơ sở dữ liệu.

---

## 5. 🎯 DEFINITION OF DONE (DoD) THEO SPRINT

| Giai đoạn | Tiêu chí hoàn thành (DoD) |
| :--- | :--- |
| **Cuối Sprint 0** | Repo sạch, branch protection + CI hoạt động, khung test dùng chung sẵn sàng, template và file nháp đã chia về từng thư mục cá nhân. |
| **Cuối Sprint 1** | Task 1, 2, 3 đã merge đúng thứ tự PR; ID không trùng lặp; mọi sơ đồ có cả `.puml` và `.svg`; `srs.md` và deployment diagram hoàn thành. |
| **Cuối Sprint 2** | Test của toàn bộ module đều xanh trên CI; E2E chạy được; có minh chứng CI pass/fail; CD chạy xanh ít nhất 1 lần. |
| **Cuối Sprint 3** | Production truy cập ổn định (Web HTTPS, API, `/health`); Release v1.0.0; README, Traceability Matrix, Video Demo và biên bản Retrospective đầy đủ. |

---

## 6. 🔄 QUY TRÌNH REVIEW & MERGE

1. Mở Pull Request sử dụng `.github/PULL_REQUEST_TEMPLATE.md`.
2. Kiểm tra GitHub Actions: Cả 3 job (`api`, `web`, `integration`) đều phải **xanh (Success)**.
3. Chỉ định người review chéo (theo phân công trong Sprint).
4. Sau khi nhận được ít nhất 1 Approve và CI pass, Leader hoặc người phụ trách nhánh tiến hành `Squash and Merge` hoặc `Rebase and Merge`.
