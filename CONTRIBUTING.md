# 🤝 CONTRIBUTING.md – Hướng dẫn Đóng góp cho Dự án DX-VAS

Xin chào và cảm ơn bạn đã quan tâm đến việc đóng góp cho dự án DX-VAS!  
Tài liệu này hướng dẫn quy trình chuẩn để gửi code, đề xuất tính năng, hoặc cải tiến hệ thống một cách hiệu quả và đồng bộ với team core.

---

## 1. 🎯 Mục tiêu của tài liệu

- Đảm bảo mọi thay đổi được kiểm soát và review chặt chẽ.
- Duy trì chất lượng mã nguồn cao, có test, có tài liệu đi kèm.
- Tạo điều kiện để các thành viên – nội bộ hay vendor – đều đóng góp dễ dàng, an toàn.

---

## 2. ⚙️ Trước khi Bắt đầu

### Yêu cầu:
- Đọc qua các tài liệu sau:
  - [`dev-guide/README.md`](./dev-guide/README.md)
  - [`core-principles.md`](./dev-guide/02-core-principles.md)
  - [`workflow-and-process.md`](./dev-guide/03-workflow-and-process.md)
- Đảm bảo máy local đã setup thành công:
  - `make run`, `make test` chạy OK
  - `.env` đúng, Docker hoạt động

---

## 3. 🌱 Tạo Pull Request (PR)

### Nhánh làm việc:
- Dùng nhánh dạng:
  - `feature/DX-123-mota-ngan`
  - `bugfix/DX-456-fix-lỗi-thống-kê`

### Quy trình:
1. Tạo PR từ nhánh `feature/*` → `dev`
2. Điền rõ mô tả, liên kết Jira ticket
3. Đảm bảo:
   - [ ] Pass CI (test, lint)
   - [ ] Có test đơn vị cho logic mới
   - [ ] Có cập nhật OpenAPI/schema nếu liên quan
   - [ ] Gắn label `needs-review`
4. Yêu cầu review từ tối thiểu 1 thành viên khác
5. Sau khi được duyệt, chọn **Squash & Merge**

---

## 4. 🧪 Đảm bảo Test và Tài liệu

### Với backend service:
- Có ít nhất 1 unit test + 1 integration test nếu thêm API mới
- OpenAPI (`openapi.yaml`) phải được cập nhật nếu thêm/chỉnh sửa API
- Nếu ảnh hưởng schema: update `data-model.md` + tạo migration

### Với frontend:
- Có test với `vitest` hoặc `testing-library`
- Thêm validate cho input nếu là form
- Kiểm tra UI ở mobile/tablet/desktop

---

## 5. 📝 Đề xuất ADR mới

Nếu bạn đề xuất thay đổi kiến trúc, hoặc ảnh hưởng đến nhiều service:

1. Tạo file mới trong `ADR/` theo format `adr-0xx-your-topic.md`
2. Liên kết đến các ADR liên quan (nếu có)
3. Mở PR với label `adr-proposal` + ping nhóm kỹ thuật

> Tham khảo: [`adr-001-ci-cd.md`](../ADR/adr-001-ci-cd.md)

---

## 6. 🧹 Quy chuẩn Code

- Tuân thủ formatter & linter (`black`, `isort`, `eslint`, `prettier`)
- Đặt tên biến/nghĩa rõ ràng, viết comment nếu logic phức tạp
- Không log thông tin nhạy cảm (token, email, password)
- Dùng các helper trong `utils/`, `shared/` để tránh lặp lại

---

## 7. 🔒 Tuân thủ Bảo mật & Kiến trúc

| Mục                       | Bắt buộc? | Tài liệu liên quan |
|--------------------------|-----------|---------------------|
| Validate toàn bộ input   | ✅         | `05-error-handling.md`, `security-checklist.md` |
| RBAC rõ ràng (permission) | ✅         | `rbac-deep-dive.md`, `openapi.yaml` |
| Không hard-code secret   | ✅         | `06-configuration-and-secrets.md` |
| Versioning schema/event  | ✅         | `12-release-versioning.md` |

---

## 8. 🙋 Hỏi & Thảo luận

- Slack channel: `#dx-vas-dev`
- Ping `@john_dx` hoặc `@core-arch`
- Nếu là vendor mới, hãy bắt đầu từ: [`onboarding.md`](./dev-guide/internal/onboarding.md)

---

> 📌 Ghi nhớ: Một Pull Request tốt không chỉ là dòng code hoạt động – đó là một phần tử đáng tin cậy, dễ bảo trì, và có thể phát triển thêm trong tương lai.
