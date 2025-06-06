# 👋 Offboarding Guide – Hướng dẫn Rút khỏi Dự án DX-VAS

Tài liệu này hướng dẫn các bước cần thực hiện khi một thành viên (nhân sự nội bộ, vendor hoặc cộng tác viên) rời khỏi dự án DX-VAS.  
Mục tiêu là đảm bảo việc chuyển giao trách nhiệm diễn ra suôn sẻ, hệ thống không bị gián đoạn, và tri thức không bị thất lạc.

---

## 1. 🎯 Mục tiêu Offboarding

- Bảo vệ an toàn hệ thống: xoá quyền truy cập đúng lúc.
- Đảm bảo luồng công việc không bị gián đoạn.
- Ghi nhận lại kiến thức (knowledge transfer) để người khác tiếp tục dễ dàng.

---

## 2. 📋 Checklist Bắt buộc trước khi Offboarding

| Việc cần làm                             | Bắt buộc | Ghi chú |
|------------------------------------------|----------|---------|
| [ ] Chuyển giao toàn bộ công việc dang dở | ✅       | Gửi bản tóm tắt qua email/Slack/Wiki |
| [ ] Cập nhật trạng thái Jira/Trello       | ✅       | Tất cả ticket đang assigned |
| [ ] Review lại các Pull Request liên quan | ✅       | Merge hoặc reassigned nếu chưa xong |
| [ ] Cập nhật tài liệu mình đang phụ trách | ✅       | `dev-guide`, `ADR`, `README`… |
| [ ] Dọn dẹp branch cá nhân chưa dùng      | ✅       | Xoá branch `feature/xxx` cũ |
| [ ] Thực hiện buổi handover kỹ thuật      | ✅       | Ghi hình/lưu notes nếu cần |
| [ ] Xoá quyền truy cập GitHub repo        | ✅       | Bởi admin hoặc DevOps |
| [ ] Xoá quyền truy cập GCP / Slack        | ✅       | Gửi yêu cầu tới `@john_dx` hoặc `@pm_vas` |

---

## 3. 🧠 Template Knowledge Transfer
```
**Tên service/phân hệ bạn đang phụ trách:**  
- `notification-service/master`

**Các module chính đã làm:**  
- `TemplateManager`, `NotificationDispatcher`, `WebhookChannel`

**Các issue chưa hoàn thành:**  
- `DX-487`: thêm retry mechanism  
- `DX-501`: chuyển cấu hình channel từ DB sang Pub/Sub cache

**Các điểm kỹ thuật cần lưu ý:**  
- Redis có thể bị treo nếu số lượng subscriber quá lớn  
- Pub/Sub khi retry cần check `event_id` tránh duplicate

**Người tiếp nhận chính:**  
- `@huy_tran (vendor team Hoàng Vũ)`
```

---

## 4. 🔒 Xoá Quyền Truy Cập

Yêu cầu PM/Tech Lead gửi checklist này cho DevOps:

- [ ] GitHub repo `ezdesign-vn/dx-vas`
- [ ] GCP Project `dx-vas-core`, `dx-vas-tenant-*`
- [ ] Slack `#dx-vas-*`
- [ ] Google Drive (tài liệu nội bộ)
- [ ] Email nhóm (nếu được thêm vào mailing list)

---

## 5. 🪪 Tài liệu & Liên hệ Sau Offboarding

- Nếu có vấn đề liên quan đến code cũ bạn từng viết:
  - PM/Tech Lead sẽ liên hệ lại (nếu còn trong thời gian cam kết hỗ trợ)
- Nếu cần bàn giao thêm sau offboarding chính thức:
  - Vui lòng tạo Google Doc và gửi qua email/slack

---

## 6. 🙏 Lời Cảm Ơn

> Cảm ơn bạn vì những đóng góp quý giá cho DX-VAS.  
> Chúng tôi rất mong sẽ có cơ hội cộng tác cùng bạn trong các dự án tương lai! 💙
