---
title: Notification Service (Master) - Interface Contract
version: "1.0"
last_updated: "2025-06-05"
author: "DX VAS Team"
reviewed_by: "Stephen Le"
---

# 📘 Notification Service (Master) – Interface Contract

*Service này chịu trách nhiệm gửi thông báo đa kênh (email, sms, push) theo template được định nghĩa sẵn, sử dụng bởi các service khác thông qua Pub/Sub hoặc gọi API trực tiếp.  
Không quản lý người nhận cụ thể (user), không tạo nội dung động mà nhận payload đã chuẩn hóa từ các dịch vụ nguồn.*

> 🧭 **Nguyên tắc chung:**
> - Tất cả API đều yêu cầu header `Authorization: Bearer <JWT>` trừ khi là Pub/Sub consumer.
> - Response tuân thủ [ADR-012 Response Structure](../../../ADR/adr-012-response-structure.md).
> - Lỗi tuân thủ [ADR-011 Error Format](../../../ADR/adr-011-api-error-format.md).
> - Mỗi API có `permission_code` rõ ràng theo [ADR-007].

---

## 📌 API: `/templates`

Danh sách API phục vụ quản lý `NotificationTemplate`

| Method | Path                        | Mô tả                            | Quyền |
|--------|-----------------------------|----------------------------------|--------|
| GET    | /templates                  | Lấy danh sách template           | `notif.read_template` |
| POST   | /templates                  | Tạo mới template                 | `notif.write_template` |
| PUT    | /templates/{id}            | Cập nhật template                | `notif.write_template` |

---

## 📌 API: `/send`

| Method | Path     | Mô tả                     | Quyền |
|--------|----------|---------------------------|--------|
| POST   | /send    | Gửi thông báo thủ công    | `notif.send_manual` |

---

## 🧪 Chi tiết API

### 1. `GET /templates`

Lấy danh sách template theo paging.

**Response mẫu (200 OK):**

```json
{
  "data": [
    {
      "id": "tpl-001",
      "name": "welcome_email",
      "type": "email",
      "language": "vi",
      "trigger_event": "user.created"
    }
  ],
  "meta": {
    "request_id": "req-001",
    "timestamp": "2025-06-05T09:00:00Z"
  }
}
```

---

### 2. `POST /templates`

Tạo template mới.

**Request:**

```json
{
  "name": "reset_sms",
  "type": "sms",
  "language": "vi",
  "trigger_event": "password.reset_requested",
  "content": "Mã xác thực của bạn là: {{code}}"
}
```

**Response (201 Created):**

```json
{
  "data": {
    "id": "tpl-999",
    "name": "reset_sms",
    ...
  },
  "meta": {
    "request_id": "req-002",
    "timestamp": "2025-06-05T09:01:00Z"
  }
}
```

---

### 3. `PUT /templates/{id}`

Cập nhật template.

**Path param:**
- `id`: UUID (VD: `tpl-999`)

**Request:**

```json
{
  "content": "Xin chào {{name}}, đây là hướng dẫn đăng nhập."
}
```

**Response:**

- `204 No Content`

---

### 4. `POST /send`

Gửi thông báo thủ công.

**Request:**

```json
{
  "template_id": "tpl-001",
  "recipient": "student@vas.edu.vn",
  "channel": "email",
  "params": {
    "name": "Nguyễn Văn A"
  }
}
```

**Response (202 Accepted):**

```json
{
  "data": {
    "status": "queued",
    "notification_id": "notif-abc123"
  },
  "meta": {
    "request_id": "req-003",
    "timestamp": "2025-06-05T09:02:00Z"
  }
}
```

---

## 🔐 Quyền truy cập (RBAC)

| permission_code          | Mô tả                        | Áp dụng cho API                 |
|--------------------------|------------------------------|----------------------------------|
| notif.read_template      | Đọc template                 | `GET /templates`                |
| notif.write_template     | Tạo/Cập nhật template        | `POST/PUT /templates`           |
| notif.send_manual        | Gửi thông báo thủ công       | `POST /send`                    |

---

## 📎 ENUMs

| Trường | Giá trị hợp lệ            | Mô tả |
|--------|----------------------------|------|
| `type` | `email`, `sms`, `push`     | Loại kênh thông báo |
| `status` | `queued`, `sent`, `failed` | Trạng thái gửi |

---

## 🔔 Event-triggered Interface

Service này chủ yếu nhận các sự kiện nội bộ từ các dịch vụ khác để gửi thông báo theo template cấu hình. Các sự kiện được tiêu chuẩn hóa theo [ADR-030 Event Schema Governance](../../../ADR/adr-030-event-schema-governance.md).

| Event Type                  | Source Service            | Mô tả hành động xử lý                            | Yêu cầu cấu hình template |
|-----------------------------|----------------------------|--------------------------------------------------|---------------------------|
| `user.created`              | `user-service.master`      | Gửi email chào mừng                               | `trigger_event = user.created` |
| `password.reset_requested`  | `auth-service.master`      | Gửi email/SMS chứa mã xác thực                    | `trigger_event = password.reset_requested` |
| `report.generated`          | `reporting-service`        | Gửi email kèm link tải báo cáo                    | `trigger_event = report.generated` |

### 📦 Ví dụ event schema: `user.created`

```json
{
  "event_type": "user.created",
  "data": {
    "user_id": "u123",
    "email": "student@vas.edu.vn",
    "full_name": "Nguyễn Văn A"
  },
  "metadata": {
    "event_id": "evt-xyz123",
    "timestamp": "2025-06-05T09:00:00Z",
    "source_service": "user-service.master"
  }
}
```

> Lưu ý: Mỗi event sẽ được ánh xạ tới template phù hợp dựa trên `trigger_event`. Nội dung thông báo sẽ được render từ `template.content` và `params = data`.

---

📚 **Tài liệu liên quan:**
- [`design.md`](./design.md)
- [`data-model.md`](./data-model.md)
- [`openapi.yaml`](./openapi.yaml)
- [`adr-007`](../../../ADR/adr-007-rbac.md)
- [`adr-011`](../../../ADR/adr-011-api-error-format.md)
- [`adr-012`](../../../ADR/adr-012-response-structure.md)
- [`adr-030`](../../../ADR/adr-030-event-schema-governance.md)
