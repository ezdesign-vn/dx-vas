---
id: adr-008-audit-logging
title: ADR-008 - Chiến lược Audit Logging cho hệ thống dx-vas
status: accepted
author: DX VAS Security & Platform Team
date: 2025-05-22
tags: [audit, logging, observability, dx-vas, security]
---

# ADR-008: Audit Logging – Nhật ký hoạt động và giám sát an ninh hệ thống

## Bối cảnh

Hệ thống dx-vas phục vụ nhiều tenant (trường thành viên), mỗi tenant có người dùng, phân quyền và thao tác riêng biệt. Việc theo dõi và ghi lại đầy đủ các hành vi quan trọng là thiết yếu để:

- Đảm bảo minh bạch trong thao tác phân quyền
- Phát hiện sớm các hành vi đáng ngờ hoặc sai lệch
- Hỗ trợ phân tích lỗi, truy vết sự cố và đối soát hoạt động
- Đáp ứng yêu cầu bảo mật và kiểm toán theo từng tenant

## Quyết định

### 1. Mọi hành động quan trọng phải được ghi log

Bao gồm (nhưng không giới hạn):

- Đăng nhập / Đăng xuất (Google OAuth2, OTP, Local)
- Gán quyền (user ↔ role ↔ permission)
- Thay đổi trạng thái người dùng (`is_active`, `is_active_in_tenant`)
- Gửi thông báo (qua Sub Notification Service hoặc từ Master)
- Tạo / sửa / xoá role, permission, template
- Bất kỳ hành động hệ thống liên quan tới tài chính, học sinh, hồ sơ

### 2. Log bắt buộc phải chứa các trường:

| Trường | Ý nghĩa |
|--------|--------|
| `tenant_id` | Tenant nơi xảy ra hành động |
| `actor_user_id` | ID người thực hiện hành động (user đăng nhập) |
| `target_resource_type` | Loại tài nguyên bị tác động (user, role, permission, notification, ...) |
| `target_resource_id` | ID tài nguyên bị tác động (nếu có) |
| `action_type` | Hành động cụ thể (assign_role, update_user, send_notification, ...) |
| `action_scope` | Phạm vi tác động (global / per-tenant) |
| `trace_id` | ID theo dõi xuyên suốt chuỗi sự kiện |
| `timestamp` | Thời điểm xảy ra |
| `ip`, `user_agent` | (nếu có thể lấy) từ request đầu vào |
| `payload_before`, `payload_after` | Ghi nhận giá trị trước/sau (cho audit thay đổi) |

> Trong trường hợp audit RBAC hoặc notification, có thể log `target_resource_type = "user"`, `target_resource_id = <user_id>` để thể hiện user bị gán vai trò hoặc nhận thông báo.

### 3. Giao tiếp giữa service phải traceable

- Các service (Auth, Gateway, Sub Service) gắn `trace_id` vào log
- Nếu là call qua Pub/Sub → gắn `message_id`, `correlation_id`

### 4. Notification Service (Pub/Sub Option B) ghi log như sau:

- Mỗi Sub Notification Service:
  - Ghi log trạng thái gửi thông báo (`sent`, `failed`, `queued`, `skipped`)
  - Gắn: `tenant_id`, `notification_id`, `channel`, `receiver_count`, `error_detail` (nếu có)
  - Log có thể gắn `correlation_id` theo sự kiện từ Master

- Notification Master:
  - Lắng nghe các sự kiện `tenant_notification_batch_status` để tổng hợp kết quả toàn hệ thống
  - Tổng hợp này cũng được ghi log dưới dạng audit, ví dụ:
    ```json
    {
      "actor_user_id": "<superadmin_id>",
      "action_type": "global_notification_summary",
      "target_resource_type": "notification",
      "target_resource_id": "notif-xyz",
      "success_count": 2,
      "fail_count": 1,
      "trace_id": "...",
      "timestamp": "..."
    }
    ```
  - Ghi rõ tenant nào nhận thành công / thất bại (nếu cần đối soát)

### 5. Hệ thống log tập trung

- Dùng Cloud Logging / Stackdriver
- Tất cả log đều có cấu trúc JSON chuẩn → dễ phân tích bằng BigQuery
- Cho phép filter theo `tenant_id`, `action_type`, `trace_id`

### 6. Ghi log truy cập báo cáo (từ Reporting Service)

- Mọi truy cập các API `/reports/*`, `/report-templates/*`, `/saved-reports/*` sẽ được ghi audit log.
- Thông tin cần log:
  - `actor_user_id`: người thực hiện truy cập
  - `action_type`: `view_report`, `list_templates`, `generate_report`, `download_report`, ...
  - `target_resource_type`: `"report_template"` hoặc `"report_result"`
  - `target_resource_id`: id của template hoặc report (nếu có)
  - `input_parameters`: (nếu có) – được mask nếu chứa thông tin nhạy cảm
  - `duration_ms`: thời gian thực thi truy vấn
  - `tenant_id`, `trace_id`, `timestamp`
- Các trường nhạy cảm trong `input_parameters` như email, số điện thoại cần được mask hoặc loại trừ ra khỏi log.
  - Việc masking phải **tuân thủ `ADR-024 - Data Anonymization & Retention`**.
  - Cần xây dựng một danh sách whitelist hoặc pattern-based detection cho các tham số cần được ẩn/mask, và áp dụng nhất quán bằng middleware hoặc utility trước khi log.
- `target_resource_id`:
  - Với `generate_report`, đây thường là ID của `report_template`.
  - Nếu hệ thống sinh ra một `report_result_id` riêng (ví dụ khi export hoặc lưu báo cáo), thì có thể sử dụng `report_result_id` làm `target_resource_id`.

Ví dụ:
```json
{
  "actor_user_id": "admin-001",
  "action_type": "generate_report",
  "target_resource_type": "report_template",
  "target_resource_id": "login-by-tenant",
  "input_parameters": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "tenant_id": "vas-hn"
  },
  "duration_ms": 142,
  "trace_id": "abc-xyz-123",
  "tenant_id": "vas-superadmin",
  "timestamp": "2025-06-03T08:00:00Z"
}
```

## Hệ quả

✅ Ưu điểm:

- Dễ theo dõi hoạt động của từng người dùng trong từng tenant
- Giúp truy vết nhanh khi có lỗi, gian lận hoặc bất thường
- Hỗ trợ quản trị tập trung nhưng phân quyền phân tích theo tenant

⚠️ Lưu ý:

- Dữ liệu log cần được bảo vệ riêng, có retention phù hợp
- Audit log quan trọng (RBAC, phân quyền) không được phép xóa
- Cần cơ chế mask dữ liệu nhạy cảm khi export (email, số điện thoại)

## Liên kết liên quan

- [ADR-006 - Auth Strategy](./adr-006-auth-strategy.md)
- [ADR-007 - RBAC và phân quyền động](./adr-007-rbac.md)
- [ADR-012 - Response Structure](./adr-012-response-structure.md)
- [ADR-028 - Reporting Architecture](./adr-028-reporting-architecture.md)
- [ADR-029 - Report Template Schema](./adr-029-report-template-schema.md)
- [ADR-030 - Event Schema Governance](./adr-030-event-schema-governance.md)
- [RBAC Deep Dive](../architecture/rbac-deep-dive.md#10-giám-sát--gỡ-lỗi)
- [README - 17. Bảo mật & giám sát](../README.md#17-bảo-mật--giám-sát)

---
> “Nếu bạn không ghi lại hành vi của hệ thống – bạn sẽ không bao giờ biết điều gì đã xảy ra khi nó xảy ra.”
