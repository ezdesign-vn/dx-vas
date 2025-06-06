# 👋 Onboarding Guide – Hướng dẫn Cho Thành viên Mới

Chào mừng bạn đến với dự án **DX-VAS**!  
Tài liệu này giúp bạn nhanh chóng hoà nhập, hiểu hệ thống, setup môi trường, và bắt đầu đóng góp hiệu quả chỉ trong vài ngày đầu.

> “Onboarding tốt không chỉ là setup máy, mà là giúp bạn hiểu hệ thống, hiểu văn hoá code, và trở thành một phần của team.” – John, DX Architect

---

## 1. 📅 Checklist Tuần Đầu Tiên

| Việc cần làm                          | Mục tiêu                               | Trạng thái |
|--------------------------------------|----------------------------------------|------------|
| [ ] Clone repo chính `dx-vas`        | Bắt đầu làm việc trên local            |            |
| [ ] Cài tool (Python, Node, Docker...)| Setup môi trường phát triển            |            |
| [ ] `make run` chạy được 1 service   | Kiểm tra môi trường hoạt động đúng     |            |
| [ ] Đọc sơ đồ hệ thống tổng thể      | Hiểu kiến trúc & cách các service giao tiếp |       |
| [ ] Đọc core guide (`dev-guide/`)    | Nắm nguyên tắc phát triển của team     |            |
| [ ] Làm một task nhỏ đầu tiên        | Làm quen với workflow & codebase        |            |
| [ ] Join Slack, Google Group          | Giao tiếp nội bộ                       |            |

---

## 2. ⚙️ Cài đặt Môi trường Phát Triển

Xem chi tiết tại: [`01-getting-started.md`](../01-getting-started.md)

### Tool yêu cầu:
- Python 3.11+, Poetry
- Node.js 18.x+, npm/yarn
- Docker & Docker Compose
- gcloud CLI, terraform
- VS Code + extensions (Python, ESLint, Prettier...)

---

## 3. 🧠 Kiến trúc Tổng Quan

- Sơ đồ hệ thống: [`system-diagrams.md`](../../architecture/system-diagrams.md)
- Gồm 5 nhóm thành phần:
  - Frontend apps
  - Core Services (Auth, User, Notification, etc.)
  - Business Adapters (CRM, LMS…)
  - External Services (SMTP, Zalo, etc.)
  - Infrastructure (Pub/Sub, DB, Redis)

---

## 4. 📚 Những File Bạn Nên Bắt đầu Đọc

| File                                | Mục đích |
|-------------------------------------|----------|
| `README.md`                         | Tổng quan hệ thống DX-VAS |
| `dev-guide/02-core-principles.md`  | Nguyên tắc kiến trúc & code |
| `dev-guide/03-workflow-and-process.md` | Git, CI/CD, pull request |
| `ADR/index.md` + các `adr-xxx.md`   | Quyết định kiến trúc chính |
| `dev-guide/05-frontend-guide.md` (nếu frontend) | Quy tắc dành cho team FE |
| `dev-guide/06-testing-guide.md`    | Cách viết test chuẩn |
| `dev-guide/10-security-checklist.md` | Checklist bảo mật bắt buộc |

---

## 5. ✅ Việc Đầu Tiên Bạn Nên Làm

1. Chạy thử service `user-service/master` local:
```bash
   make run SERVICE=user-service-master
```

2. Gọi API thử bằng Postman hoặc curl:

   ```bash
   curl -H "Authorization: Bearer <token>" http://localhost:8001/users/me
   ```

   > Xem hướng dẫn lấy token tại `getting-started.md`

3. Tạo PR đầu tiên:

   * Có thể là cập nhật tài liệu, fix typo, hoặc thêm test
   * Tuân thủ quy trình PR: `feature/DX-xxx-description` + mô tả rõ ràng

---

## 6. 💬 Kênh Hỗ trợ

| Kênh                   | Mục đích              |
| ---------------------- | --------------------- |
| `#dx-vas-dev` (Slack)  | Hỏi nhanh về kỹ thuật |
| `#dx-vas-docs`         | Thảo luận tài liệu    |
| Google Group `dx-vas@` | Trao đổi toàn dự án   |
| `@john_dx`             | Kiến trúc tổng thể    |
| `@pm_vas`              | Quản lý dự án         |

---

## 7. 🔐 Một số nguyên tắc quan trọng

* **Không bao giờ merge code chưa review**
* **Không push vào nhánh `main` hoặc `dev` trực tiếp**
* **Luôn test kỹ trước khi tạo PR**
* **Đọc và tuân thủ các ADR (Architecture Decision Record)**

---

> 📌 Ghi nhớ: Bạn không đơn độc. Hãy chủ động hỏi – càng hỏi nhiều, học càng nhanh. Chào mừng bạn đến với DX-VAS!
