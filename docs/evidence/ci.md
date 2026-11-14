# MINH CHỨNG HOẠT ĐỘNG CONTINUOUS INTEGRATION (CI)

> **Người phụ trách**: Phạm Minh Chiến (Leader)  
> **Mã Task**: `SP2-01` (Nghiệm thu Task 4.4 theo đề bài Assignment 2)  
> **Trạng thái**: [x] Đã hoàn thành  
> **Repository GitHub**: [https://github.com/ChienPM-27/BrewLite_assignment2](https://github.com/ChienPM-27/BrewLite_assignment2)  
> **File cấu hình CI**: [.github/workflows/ci.yml](../../.github/workflows/ci.yml)

---

## 1. THIẾT LẬP PIPELINE CI THEO YÊU CẦU ĐỀ BÀI (MỤC 6.4)

Tuân thủ đúng yêu cầu của mục **Task 4.4 – Continuous Integration** trong đề bài Assignment 2:
* **Quy trình pipeline tự động**: Kích hoạt khi mở hoặc cập nhật Pull Request vào nhánh `main`:
  $$\text{Install} \longrightarrow \text{Lint} \longrightarrow \text{Unit Test} \longrightarrow \text{Build}$$
  *(Đồng thời tích hợp kiểm thử tích hợp cơ sở dữ liệu `integration-test-api` với PostgreSQL service container và kiểm thử đầu-cuối `e2e-tests` Playwright).*
* **Quy ước gộp mã**: Nhóm thống nhất chỉ gộp (merge) Pull Request vào nhánh `main` khi tất cả các kiểm tra trong pipeline đều đạt trạng thái **PASS (Xanh 100%)**.

---

## 2. BẢNG TỔNG HỢP MINH CHỨNG PULL REQUEST & CI RUNS THỰC TẾ

Tất cả các tính năng và tài liệu của các thành viên đều được đưa vào hệ thống thông qua Pull Request và được kiểm thử tự động trên GitHub Actions:

| PR # | Tác giả | Module / Hạng mục công việc | Link Pull Request trên GitHub | Link GitHub Actions Run (Xanh) | Trạng thái |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **#13** | Nguyễn Quang Huy | Bộ kiểm thử Playwright E2E (`SP2-08`) | [#13](https://github.com/ChienPM-27/BrewLite_assignment2/pull/13) | [Run #43460199865](https://github.com/ChienPM-27/BrewLite_assignment2/actions/runs/43460199865) | Merged |
| **#12** | Quách Tuấn Hào | Module test Auth & Cart (`SP2-05`) | [#12](https://github.com/ChienPM-27/BrewLite_assignment2/pull/12) | [Run #43431155225](https://github.com/ChienPM-27/BrewLite_assignment2/actions/runs/43431155225) | CI Pass |
| **#14** | Tôn Thất Hạnh | Module test Order (`SP2-06`) | [#14](https://github.com/ChienPM-27/BrewLite_assignment2/pull/14) | [Run #43556350151](https://github.com/ChienPM-27/BrewLite_assignment2/actions/runs/43556350151) | CI Pass |
| **#15** | Nguyễn Trần Gia Kiệt | Cập nhật Payment & Smoke test (`SP2-07`) | [#15](https://github.com/ChienPM-27/BrewLite_assignment2/pull/15) | [Run #43568749301](https://github.com/ChienPM-27/BrewLite_assignment2/actions/runs/43568749301) | CI Pass |
| **#11** | Minh Chiến | Hoàn tất đóng Sprint 1 (`SP1-01`..`08`) | [#11](https://github.com/ChienPM-27/BrewLite_assignment2/pull/11) | [Run #43423663898](https://github.com/ChienPM-27/BrewLite_assignment2/actions/runs/43423663898) | Merged |
| **#2** | Vũ Hoàng Huy | Module test Pricing & Detail (`SP2-04`) | [#2](https://github.com/ChienPM-27/BrewLite_assignment2/pull/2) | [Run #43261470718](https://github.com/ChienPM-27/BrewLite_assignment2/actions/runs/43261470718) | Merged |
| **#1** | Minh Chiến | Thiết lập khung dự án ban đầu (`SP0-01`) | [#1](https://github.com/ChienPM-27/BrewLite_assignment2/pull/1) | [Run #42766877263](https://github.com/ChienPM-27/BrewLite_assignment2/actions/runs/42766877263) | Merged |

*Link kiểm chứng kiểm thử tự động sau khi gộp PR #13 trên nhánh `main`: [Actions Run #43576171640](https://github.com/ChienPM-27/BrewLite_assignment2/actions/runs/43576171640) (Success).*

---

## 3. KẾT LUẬN NGHIỆM THU TASK 4.4

* Hệ thống Continuous Integration đã được thiết lập hoàn chỉnh, chạy tự động và ổn định trên mọi Pull Request mở vào nhánh `main`.
* Quá trình tích hợp mã nguồn tuân thủ đúng nguyên tắc: chỉ merge khi toàn bộ các bước lint, test và build đều thành công, đảm bảo nhánh chính `main` luôn ở trạng thái sẵn sàng để triển khai (Deployable).
