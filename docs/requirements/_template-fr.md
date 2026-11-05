# [TÊN MODULE] — ĐẶC TẢ YÊU CẦU CHỨC NĂNG (FR)

> **Người phụ trách**: [Tên thành viên]  
> **Dải ID phân công**: `FR-xx` đến `FR-yy`  
> **Sprint**: Sprint 1 (Task 1.2)

---

## 1. TỔNG QUAN PHẠM VI CHỨC NĂNG

Mô tả ngắn gọn mục đích nghiệp vụ của nhóm chức năng này đối với khách hàng hoặc hệ thống BrewLite.

---

## 2. DANH SÁCH YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS)

### 2.1. FR-xx: [Tên chức năng 1]
- **Độ ưu tiên (MoSCoW)**: Must Have / Should Have / Could Have
- **Mô tả nghiệp vụ**: Khách hàng có thể thực hiện hành động gì, dữ liệu đầu vào là gì, hệ thống phản hồi ra sao.
- **Tiêu chí chấp nhận (Acceptance Criteria - AC)**:
  - `AC-xx.1`: Khi [điều kiện], hệ thống phải [kết quả mong đợi]. Mã trạng thái HTTP: `200 OK` (hoặc `201 Created`).
  - `AC-xx.2`: Nếu [điều kiện lỗi/ngoại lệ], hệ thống phải từ chối với mã lỗi `400 Bad Request` và thông điệp lỗi rõ ràng.
  - `AC-xx.3`: [Quy tắc bảo mật/toàn vẹn dữ liệu].

---

## 3. BẢNG TRUY VẾT YÊU CẦU (TRACEABILITY TABLE)

> *Lưu ý: Bảng này là bắt buộc ở cuối mỗi file `fr-*.md` để Quang Huy tổng hợp vào `docs/traceability-matrix.md` trong Sprint 3.*

| Mã FR | Tên yêu cầu | Use-Case liên kết | Sơ đồ liên quan | Code / API Endpoint | Test Case ID |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `FR-xx` | [Tên FR] | `UC-xx` ([Tên]) | `docs/diagrams/...` | `POST /api/v1/...` | `TC-xx-01`, `TC-xx-02` |
