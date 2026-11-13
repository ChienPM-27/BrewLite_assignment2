# BIÊN BẢN REVIEW VÀ XỬ LÝ CUỐI SPRINT 1

> **Owner hồ sơ**: Nguyễn Quang Huy (`SP1-08`)
> **Kiểm tra và sửa**: Codex theo yêu cầu người dùng; giữ owner nghiệp vụ của từng task.
> **Ngày kiểm tra/sửa**: 13/11/2026, Asia/Saigon.
> **Baseline đã merge**: `12917802e89109a4d26581fe86da6c415f945a85` trên `main`.
> **Trạng thái**: Các sửa đổi dưới đây đã hoàn thành trên nhánh `codex/sprint-1-closeout-fixes`; chờ review/CI/merge PR bổ sung và xác nhận của Leader để đóng sprint.

## 1. PHẠM VI NGHIỆM THU

Sprint 1 hoàn thiện yêu cầu (Task 1), UML/PlantUML (Task 2) và kiến trúc/ADR (Task 3), theo `SP1-01`..`SP1-08` trong kế hoạch. Full test coverage, Playwright E2E, manual VNPay, CD, rollback và hồ sơ bàn giao tiếp tục ở Sprint 2/2B. Không triển khai thêm tính năng để làm cho tài liệu trông như đã hoàn thành.

## 2. KẾT QUẢ XỬ LÝ THEO LỖI VÀ OWNER

| Mục | Owner / Task | Vị trí | Sửa đổi đã thực hiện |
| :--- | :--- | :--- | :--- |
| R1 — Baseline SRS | Chiến / `SP1-02` | [srs.md](../requirements/srs.md) | Chốt baseline; đồng bộ giữ/hoàn kho, `WELCOME10` tối đa 20.000đ, method/gateway payment, size UI, dinh dưỡng Could Have, trạng thái History và manifest. |
| R2 — AC/Test mapping | Quang Huy / `SP1-08`, phối hợp owner FR | [test-scenarios.md](../requirements/test-scenarios.md), [fr-menu.md](../requirements/fr-menu.md), [fr-detail.md](../requirements/fr-detail.md), [usecase-order-payment.md](../requirements/usecase-order-payment.md) | Đủ 141 AC FR + 14 AC use-case, không thiếu/trùng AC; sửa mapping Menu/Detail/History và `TC-PAY-18`; giữ Test ID có sẵn, bổ sung ID cho AC chưa được tổng hợp. |
| R3 — Sơ đồ nghiệp vụ | Hào / `SP1-05`, Vũ Huy / `SP1-04`, Lan / `SP1-03` | [activity-e2e.puml](../diagrams/activity-e2e.puml), [class-diagram.puml](../diagrams/class-diagram.puml), [fr-menu.md](../requirements/fr-menu.md) | Menu lọc `isAvailable/stock`, không tính công thức hoặc gắn nhãn hết nguyên liệu; giữ nhánh thiếu kho khi tạo Order. Payment lỗi giữ kho; CancelOrderService hoàn snapshot một lần. Render lại SVG. |
| R4 — Migration | Chiến / `SP1-01` | [deployment-production.puml](../diagrams/deployment-production.puml) | Migration đi qua `DIRECT_URL` cổng 5432 Session Mode, runtime CRUD qua 6543; CD ghi là kế hoạch Sprint 2/2B. Render lại SVG. |
| R5 — Hiện trạng vận hành | Lan / `SP1-03`, Chiến / `SP1-01` | [architecture.md](../architecture/architecture.md), [deployment.md](../deployment.md) | Health chỉ xác nhận API trả lời; chưa có DB readiness/uptime/schema validation chung. `CORS_ORIGIN` chưa được code sử dụng. |
| Đồng bộ payment và hồ sơ | Hạnh / `SP1-06`, Kiệt / `SP1-07`, Hào / `SP1-05`, Quang Huy / `SP1-08` | [fr-order.md](../requirements/fr-order.md), [usecase-order-payment.md](../requirements/usecase-order-payment.md), [ADR-009](../architecture/adr/009-testing-strategy.md) | Ghi đúng lỗi clearCart đã được PR #5 sửa; mô tả signed Return URL fallback cùng IPN handler; chuẩn hóa `UC-ORD-01`, cập nhật trạng thái nhận xét cũ trong ADR và hoàn thiện biên bản này. |
| R6 — Tài khoản Sandbox trong code | Kiệt / `SP1-07`, phối hợp Chiến | `apps/api/src/modules/payments/payments.service.ts`, `payments.controller.ts`, `apps/web/src/services/payment.service.ts`, `apps/web/src/app/checkout/payment/page.tsx` | Phát hiện khi kiểm tra lại nhận xét ADR-009: bỏ tài khoản Merchant khỏi UI/API/log và bỏ tự dò tunnel khi khởi động. Cấu hình VNPay tiếp tục lấy từ env; đăng ký IPN thủ công theo deployment guide. Thêm test xác nhận endpoint hỗ trợ cũ trả 404, không trả data. |

Các dòng mapping là kịch bản **cần viết hoặc kiểm chứng** ở Sprint 2, không phải xác nhận 155 AC đã được triển khai/pass. Đặc biệt `AC-16.11` phụ thuộc API hủy đơn `PAID` chưa có, được ghi rõ là mở rộng. Không tạo thêm module, lớp abstraction hoặc tính năng vận hành trong đợt sửa này.

## 3. KIỂM TRA VÀ BẰNG CHỨNG

| Kiểm tra | Kết quả |
| :--- | :--- |
| FR-01..22, NFR-01..08 và 9 ADR | Đã rà soát ở lượt review baseline; các sai lệch ghi trong mục 2 đã xử lý. |
| Mapping FR/use-case | 141/141 AC FR và 14/14 AC use-case có Test ID; ID Order/History khớp FR; Menu/Detail có bảng mapping chi tiết đồng bộ; liên kết Markdown trong các file sửa hợp lệ. |
| PlantUML | 10/10 source qua syntax check với PlantUML 1.2026.10; đủ 10 cặp `.puml/.svg`. Ba SVG bị ảnh hưởng được render lại và kiểm tra hình. |
| Backend local | Lint 0 lỗi; 169 test/14 suite pass; production build pass. |
| Frontend local | Lint pass; 8 test/2 file pass; production build pass. |
| CI baseline main | [Run 43407402418](https://github.com/ChienPM-27/BrewLite_assignment2/actions/runs/43407402418): cả 3 job thành công, Integration 5 test/3 suite và 5 migration. |
| CI của PR sửa cuối | Xem tab **Checks** của PR từ nhánh `codex/sprint-1-closeout-fixes`. Chỉ merge khi cả 3 job thành công; test endpoint cũ được chạy trong job Integration. |
| Credential/tunnel support | Không còn phần công khai tài khoản Merchant/tự dò tunnel trong source API/UI hiện tại. Không xác nhận Git history đã được làm sạch. |

Local dùng Node v26.8.1; CI dùng Node 22. Docker daemon local chưa có sẵn nên test Integration mới được kiểm chứng qua CI của PR, không ghi là đã chạy local. E2E/manual Sandbox/CD/rollback chưa chạy trong đợt sửa tài liệu này.

## 4. GHI NHẬN TIẾN ĐỘ VÀ REVIEW

Các PR #1, #2, #3, #4, #5, #7, #9, #10 đã merge vào `main`. Tại thời điểm review baseline, GitHub chưa có review submission/comment trên các PR này; tài liệu không tự gán reviewer hoặc Approve cho thành viên. Nếu nhóm đã review qua họp/chat, Leader ghi người review và đường dẫn bằng chứng thực tế vào hồ sơ.

Checkpoint kế hoạch là 22:00 ngày 12/11/2026. PR #9 merge lúc 23:32 ngày 12/11, #10 lúc 23:41 ngày 12/11 và #3 lúc 17:12 ngày 13/11 (Asia/Saigon). Vì vậy ngày kiểm tra/sửa là 13/11; ngày đóng chính thức là ngày Leader xác nhận sau PR bổ sung, không backdate về 12/11.

## 5. VIỆC CÒN LẠI ĐỂ XÁC NHẬN ĐÓNG

- [x] Sửa R1..R5 và các ghi chú payment/ID cũ.
- [x] Hoàn tất mapping 141 AC FR + 14 AC use-case.
- [x] Sửa source sơ đồ và render lại SVG; lint/test/build local đạt.
- [x] Bỏ phần công khai tài khoản Merchant và tự dò tunnel; thêm regression test cho endpoint cũ.
- [ ] Chiến đổi mật khẩu Merchant Sandbox đã xuất hiện trong code/history; không ghi mật khẩu mới vào repo, log hoặc biên bản. Việc xóa source không vô hiệu hóa thông tin đăng nhập cũ.
- [ ] PR bổ sung có đủ 3 job CI thành công và ít nhất 1 người review chéo Approve theo [CONTRIBUTING.md](../CONTRIBUTING.md), mục 6.
- [ ] Leader merge PR bổ sung, xác nhận review thực tế và ghi ngày đóng Sprint 1.

Backlog Sprint 2/2B giữ nguyên owner: Lan test Menu; Vũ Huy test Detail/Pricing; Hào test Auth/Cart; Hạnh test Order; Kiệt test Payment/manual VNPay; Quang Huy History/E2E/truy vết; Chiến CI/CD/rollback/bàn giao. Các cải tiến health/config/CORS chỉ cân nhắc nếu cần cho nghiệm thu, không phải tính năng bắt buộc thêm trong đợt đóng Sprint 1.
