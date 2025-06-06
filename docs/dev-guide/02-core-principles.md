# 🌟 02. Các Nguyên tắc Vàng khi Lập trình

Dưới đây là các nguyên tắc cốt lõi mà mọi lập trình viên tham gia phát triển hệ thống DX-VAS đều phải tuân thủ. Những nguyên tắc này không chỉ giúp đảm bảo chất lượng code mà còn là nền tảng cho khả năng mở rộng, bảo trì và bảo mật lâu dài của hệ thống.

---

## 1. 🧠 Design First

> "Không bao giờ viết code trước khi có tài liệu thiết kế được duyệt."

- Mỗi tính năng hoặc module mới đều phải bắt đầu bằng việc viết `design.md`, `data-model.md`, `interface-contract.md`.
- Tài liệu phải được review bởi Tech Lead hoặc Kiến trúc sư và lưu trữ đúng chỗ trong `/docs/services/<service-name>/`.
- Đây là kim chỉ nam để tránh “code trước – sửa sau”.

---

## 2. 📜 ADR-Driven

> "Mọi quyết định có ảnh hưởng đến kiến trúc đều phải có ADR tương ứng."

- Nếu thay đổi liên quan đến:
  - Luồng dữ liệu tổng thể
  - API cross-service
  - Schema chia sẻ
  - Cách triển khai CI/CD, bảo mật
- Thì **phải tạo một file ADR mới trong `/docs/ADR/`**, theo mẫu chuẩn `adr-xxx-title.md`.
- Tham khảo: [ADR-001 đến ADR-030](../ADR/index.md)

---

## 3. 🔐 Security by Design

> "Bảo mật không phải là tính năng – nó là trách nhiệm."

- Mọi service đều phải tuân thủ [ADR-004 - Security Policy](../ADR/adr-004-security.md)
- Bắt buộc validate toàn bộ input từ client
- Không bao giờ trust dữ liệu đầu vào (nhất là headers, payload JSON)
- Không được log PII, token, hoặc dữ liệu nhạy cảm

---

## 4. ⚙️ Stateless Services

> "Nếu service của bạn cần lưu trạng thái, bạn đang vi phạm kiến trúc scale-out."

- Mọi service backend phải stateless
- Các trạng thái (như phiên đăng nhập, token, hàng đợi xử lý…) phải lưu ở:
  - PostgreSQL
  - Redis
  - Pub/Sub
- Điều này giúp bạn dễ dàng scale horizontal và deploy mà không mất session

---

## 5. 🧪 Test Everything

> "Không test, không merge."

- Mọi đoạn code có logic nghiệp vụ đều phải đi kèm unit test
- Mọi API endpoint đều phải có integration test
- Coverage cho service phải >= 80%
- Không có lý do ngoại lệ – thời gian test là đầu tư, không phải chi phí

---

## 6. 🤝 Tuân thủ Hợp đồng (Contract First)

> "`openapi.yaml` là hợp đồng – không được thay đổi tùy tiện."

- Tất cả thay đổi liên quan đến API:
  - Bắt buộc cập nhật `openapi.yaml` trước tiên
  - Sau đó mới bắt đầu implement
- Không được merge bất kỳ thay đổi nào vi phạm schema định nghĩa
- Cần review kỹ `x-required-permission`, `x-audit-action`, `x-emits-event` cho mỗi endpoint

---

> 📌 **Ghi nhớ:** Bạn có thể tham khảo các hướng dẫn cụ thể trong:
> - [03-workflow-and-process.md](./03-workflow-and-process.md)
> - [technical-guides/01-api-development.md](./technical-guides/01-api-development.md)
> - [technical-guides/02-database-and-migrations.md](./technical-guides/02-database-and-migrations.md)
