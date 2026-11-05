## 📌 Thông Tin Pull Request

- **Mã Task (ID trong kế hoạch)**: `SPx-xx` (Ví dụ: `SP1-03`, `SP2-05`)
- **Người thực hiện**: @github_username
- **Loại thay đổi**:
  - [ ] 📄 Documentation (Tài liệu / Sơ đồ)
  - [ ] ✨ Feature (Tính năng / Chức năng mới)
  - [ ] 🧪 Testing (Unit / Integration / E2E test)
  - [ ] 🔧 Chore / Config (Cấu hình / Quy trình / CI)

---

## 📝 Mô Tả Chi Tiết

- **Lý do thay đổi** (Bắt buộc theo yêu cầu đề bài): 
- **Các file/thư mục đã chỉnh sửa** (Phải thuộc quyền sở hữu trong kế hoạch):
  - `...`
- **Tóm tắt nội dung thực hiện**:

---

## 🔍 Checklist Kiểm Tra & Review Chéo

- [ ] Chỉ sửa các file thuộc phạm vi sở hữu của mình (Không sửa file dùng chung nếu chưa được Leader duyệt).
- [ ] Nếu là tài liệu FR: Đã có bảng **Truy vết** ở cuối file (FR ➔ Use-case ➔ Sơ đồ ➔ Code/API ➔ Test ID).
- [ ] Nếu là Sơ đồ: Đã bao gồm cả file nguồn `.puml` và file kết xuất `.svg` (sinh từ `render.sh`).
- [ ] Nếu là Test: Tuân thủ quy tắc dữ liệu độc lập (dùng UUID, `afterAll` dọn dẹp, không đụng chạm data seed).
- [ ] Đã chạy kiểm tra local thành công:
  - Backend: `npm run lint` & `npm run test:ci` & `npm run build`
  - Frontend: `npm run lint` & `npm test` & `npm run build`
- [ ] CI Pipeline trên GitHub báo xanh toàn bộ (không có job nào fail).

---

## 📸 Minh Chứng Kiểm Thử / Kết Xuất (Screenshots / Logs)

*(Dán ảnh chụp màn hình terminal test pass hoặc kết xuất sơ đồ/giao diện tại đây)*
