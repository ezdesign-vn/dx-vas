---
title: Audit Logging Service - Interface Contract
version: "2.1"
last_updated: ["2025-06-14"]
author: "DX VAS Team"
reviewed_by: "Stephen Le"
---

# 📘 Audit Logging Service – Interface Contract

## 1. 📌 Phạm vi và Trách nhiệm

Audit Logging Service (ALS) là một thành phần nằm trong tầng **Core Services** của hệ thống dx-vas, có trách nhiệm:

- **Thu thập audit log** từ các nguồn nội bộ thông qua 2 cơ chế:
  - Giao tiếp **event-driven** qua Pub/Sub (`audit.events.v1`)
  - Giao tiếp **synchronous HTTP API** dành cho các service không hỗ trợ emit event
- **Áp dụng chính sách bảo mật và masking** trước khi lưu log, nhằm đảm bảo thông tin nhạy cảm không bị lộ (tuân theo `ADR-024`)
- **Lưu trữ bền vững** các bản ghi log vào kho dữ liệu trung tâm (BigQuery hoặc Firestore), phục vụ truy vấn và kiểm toán
- **Cung cấp REST API phân quyền** cho phép truy vấn lịch sử hành động theo `tenant`, `user`, `trace`, hoặc `resource`
- **Hỗ trợ tracing xuyên suốt hệ thống** bằng cách liên kết log với `trace_id` phát sinh từ gateway hoặc frontend

---

### 1.1. ✅ ALS **không đảm nhận** các nhiệm vụ sau:

- Không ghi nhận **application logs** (debug/error logs) – việc này thuộc trách nhiệm của runtime environment.
- Không lưu trữ **metrics hoặc performance logs** – các chỉ số này do Prometheus/Grafana xử lý.
- Không hiển thị giao diện người dùng – log được hiển thị qua Admin WebApp hoặc các dashboard khác.
- Không phục vụ mục đích alerting trực tiếp – nhưng có thể tích hợp gián tiếp qua Observability Platform (`ADR-021`).

---

### 1.2. 🧭 Mối liên hệ chính

| Hệ thống | Mục đích tương tác |
|----------|---------------------|
| API Gateway | Gửi log qua HTTP Ingestion API (các hành vi người dùng qua web) |
| Auth Service | Phát event `auth.login.success`, `token.exchanged`, `otp.verified` |
| User Service | Ghi nhận các hành động tạo, cập nhật người dùng |
| Admin WebApp | Truy vấn log thông qua API `/audit-log` |
| Reporting Service | Truy vấn log theo `trace_id` để tạo báo cáo bảo mật |
| Notification Service | Gửi event khi gửi/thất bại notification (`notification.sent`, `failed`) |

---

## 2. 📌 API: `/audit-log`

Các API cho phép truy vấn các bản ghi hành vi đã lưu trữ trong hệ thống. Tất cả các API yêu cầu xác thực JWT, kiểm tra quyền RBAC và ràng buộc theo tenant (`X-Tenant-ID`).

---

### 2.1. `GET /audit-log`

Truy vấn danh sách bản ghi audit log, với khả năng lọc theo nhiều tiêu chí (user, action, thời gian...) và phân trang.

#### 📥 Request

- **Headers:**
  - `Authorization: Bearer <JWT>`
  - `X-Tenant-ID: string` – Tenant hiện tại

- **Query Parameters:**
  - `actor_user_id`: string – lọc theo người thực hiện hành động
  - `trace_id`: string – lọc theo trace
  - `action`: string – lọc theo hành động
  - `resource_type`: string – loại tài nguyên liên quan (`user`, `tenant`, etc.)
  - `status`: `success` \| `failure` \| `warning`
  - `from_time`, `to_time`: ISO 8601 timestamp
  - `page`, `page_size`: phân trang

#### 📤 Response

```json
{
  "data": [
    {
      "id": "log-abc123",
      "tenant_id": "vas-sch-01",
      "trace_id": "trace-xyz",
      "actor_user_id": "user-01",
      "action": "user.login.success",
      "resource_type": "user",
      "status": "success",
      "created_at": "2025-06-14T12:00:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 125
    },
    "request_id": "req-789",
    "timestamp": "2025-06-14T12:00:01Z"
  },
  "error": null
}
```

#### 🔐 Phân quyền & Điều kiện

* Yêu cầu scope: `audit.read.log`
* RBAC enforced theo condition:

  ```json
  { "tenant_id": "{{X-Tenant-ID}}" }
  ```
* Masking động theo role: các trường nhạy cảm như `input_parameters`, `ip_address`, `user_agent` sẽ bị che nếu không có quyền cao (e.g. `tenant_admin`)

#### 📣 Sự kiện phát ra

* Không có

#### ❌ Mã lỗi có thể trả về

| Code                       | Mô tả                                           |
| -------------------------- | ----------------------------------------------- |
| `common.unauthorized`      | Không gửi JWT hoặc JWT không hợp lệ             |
| `common.forbidden`         | Không có quyền `audit.read.log` hoặc sai tenant |
| `common.validation_failed` | Tham số query không hợp lệ (e.g. sai datetime)  |
| `common.internal_error`    | Lỗi truy vấn BigQuery hoặc hệ thống gián đoạn   |

#### 🧪 Gợi ý kiểm thử

* Gửi truy vấn hợp lệ → nhận log đúng và có phân trang
* Gửi truy vấn thiếu `Authorization` → nhận lỗi `common.unauthorized`
* Gửi truy vấn sai định dạng `from_time` → lỗi `common.validation_failed`
* Dùng token đúng scope nhưng sai tenant → không thấy log hoặc lỗi `common.forbidden`
* Gửi truy vấn khi backend lỗi BigQuery → nhận `common.internal_error`

---

### 2.2. `GET /audit-log/{id}`

Lấy chi tiết một bản ghi log cụ thể theo ID log.

#### 📥 Request

* **Path parameter:**

  * `id`: string – UUID của bản ghi log

* **Headers:**

  * `Authorization: Bearer <JWT>`
  * `X-Tenant-ID: string`

#### 📤 Response

```json
{
  "data": {
    "id": "log-abc123",
    "tenant_id": "vas-sch-01",
    "trace_id": "trace-xyz",
    "actor_user_id": "user-01",
    "action": "user.login.success",
    "resource_type": "user",
    "status": "success",
    "input_parameters": {
      "email": "masked",
      "name": "masked"
    },
    "ip_address": "masked",
    "user_agent": "masked",
    "created_at": "2025-06-14T12:00:00Z"
  },
  "meta": {
    "request_id": "req-456",
    "timestamp": "2025-06-14T12:00:01Z"
  },
  "error": null
}
```

#### 🔐 Phân quyền & Điều kiện

* Scope bắt buộc: `audit.read.log`
* Điều kiện RBAC:

  ```json
  { "tenant_id": "{{X-Tenant-ID}}" }
  ```
* Masking động áp dụng như trên

#### 📣 Sự kiện phát ra

* Không có

#### ❌ Mã lỗi có thể trả về

| Code                    | Mô tả                                        |
| ----------------------- | -------------------------------------------- |
| `common.unauthorized`   | Không có hoặc JWT không hợp lệ               |
| `common.forbidden`      | Không được truy cập log không thuộc tenant   |
| `common.not_found`      | Log không tồn tại hoặc không thuộc quyền xem |
| `common.internal_error` | Lỗi hệ thống khi truy xuất dữ liệu           |

#### 🧪 Gợi ý kiểm thử

* Lấy log hợp lệ với đúng tenant và quyền → thấy log đầy đủ
* Lấy log thuộc tenant khác → lỗi `common.forbidden` hoặc `common.not_found`
* Lấy log với user không đủ quyền → bị che `input_parameters`
* Lấy log không tồn tại → lỗi `common.not_found`
* Gây lỗi backend (e.g. tạm ngưng BigQuery) → lỗi `common.internal_error`

---

## 📌 Chú thích Định dạng Response & Lỗi

Tất cả API tuân thủ định dạng chuẩn hóa của hệ thống (xem ADR-012 và ADR-011).

### ✅ Thành công (200 OK / 204 No Content)

```json
{
  "data": { ... },
  "meta": {
    "request_id": "req-xyz",
    "timestamp": "2025-06-14T12:00:00Z"
  },
  "error": null
}
```

### ❌ Lỗi (4xx/5xx)

```json
{
  "data": null,
  "meta": {
    "request_id": "req-xyz",
    "timestamp": "2025-06-14T12:00:00Z"
  },
  "error": {
    "code": "FORBIDDEN",
    "message": "Bạn không có quyền xem log này.",
    "details": null
  }
}
```

---

## 3. 📥 Giao tiếp Pub/Sub

Audit Logging Service hỗ trợ giao tiếp sự kiện qua Pub/Sub với hai vai trò:

---

### 3.1. 📥 Ingestion từ topic `audit.events.v1`

ALS là **consumer chính thức** của topic Pub/Sub:

```

projects/dx-vas/topics/audit.events.v1

```

Các service trong hệ thống sẽ phát các sự kiện hành vi người dùng, bảo mật, truy cập tài nguyên... lên topic này thay vì gọi HTTP API nội bộ.

#### ✅ Định danh sự kiện

Tên sự kiện tuân theo quy ước:

```

vas.<domain>.<event>.v<version>

```

Ví dụ:
- `vas.auth.login_success.v1`
- `vas.user.updated.v1`
- `vas.notification.sent.v1`

#### 📄 Định dạng payload (ví dụ)

```json
{
  "event": "vas.user.updated.v1",
  "tenant_id": "vas-sch-01",
  "trace_id": "abc-xyz-123",
  "actor_user_id": "u_456",
  "resource_type": "user",
  "resource_id": "u_123",
  "action": "update",
  "status": "success",
  "payload_before": { ... },
  "payload_after": { ... },
  "source_service": "user-service",
  "timestamp": "2025-06-14T12:00:00Z"
}
```

#### 🔐 IAM cho subscriber

ALS sử dụng service account:

```
als@dx-vas.iam.gserviceaccount.com
```

Cần được cấp quyền `roles/pubsub.subscriber` cho topic `audit.events.v1`. Việc binding IAM phải được cấu hình rõ ràng cho từng môi trường (staging/production).
> - ⚠️ ALS chỉ xử lý event có schema hợp lệ đã đăng ký theo ADR-030
> - ⚠️ Không cấp cho user-facing client

---

### 3.2. 📤 Phát sự kiện thứ cấp (optional)

⚠️ **Tính năng này đang TẮT mặc định trong production**. Chỉ bật nếu hệ thống downstream cần theo dõi tín hiệu log ghi thành công.

Audit Logging Service hỗ trợ phát sự kiện thứ cấp `vas.audit.persisted.v1` khi một bản ghi được lưu vào BigQuery/Firestore.

Mục đích:

* Đồng bộ ETL pipeline
* Trigger engine phân tích hành vi
* Hệ thống downstream cần xác nhận việc ghi log hoàn tất

#### ⚙️ Cấu hình bật/tắt

```yaml
emit_audit_event_enabled: false
audit_event_topic: vas.audit.persisted.v1
```

#### 📄 Cấu trúc sự kiện

```json
{
  "event": "vas.audit.persisted.v1",
  "id": "log-abc123",
  "tenant_id": "vas-sch-01",
  "timestamp": "2025-06-14T12:00:00Z",
  "source_service": "user-service",
  "action": "delete"
}
```

#### 🔒 Lưu ý

* Không có consumer bắt buộc. Chỉ phát khi cấu hình `emit_audit_event_enabled: true`
* Không đảm bảo delivery — không retry nếu downstream không subscribe đúng

---

## 4. 📎 Phụ lục

### 4.1. 📎 Các ENUM sử dụng trong Audit Logging Service

| Tên trường         | Giá trị hợp lệ                                  | Mô tả                                                             |
|--------------------|--------------------------------------------------|-------------------------------------------------------------------|
| `status`           | `success`, `failure`, `warning`                 | Trạng thái kết quả của hành động ghi log                         |
| `resource_type`    | `user`, `tenant`, `role`, `permission`, `token`, `report`, `notification`, `config`, `system` | Loại tài nguyên liên quan đến hành động được ghi nhận            |
| `action`      | `create`, `read`, `update`, `delete`, `assign`, `login`, `logout`, `verify`, `exchange`, `send`, `generate` | Hành vi được thực hiện bởi actor                                 |
| `source_service`   | `user-service`, `auth-service/master`, `auth-service/sub`, `notification-service`, `reporting-service`, `api-gateway`, `admin-webapp`, `external-adapter`, `system-task` | Tên service khởi phát hành động (được dùng trong Pub/Sub & trace) |
| `log_channel` _(nội bộ)_ | `http`, `pubsub`                          | Kênh ghi nhận log – dùng để phân biệt luồng trigger              |

📌 **Ghi chú**:

* Enum `action` được đồng bộ với [ADR-008 – Audit Format](../../ADR/adr-008-audit-logging.md)
* Enum `source_service` phải khớp với giá trị thực tế `service_name` trong trace & event emitter
* Các enum này được dùng trong query param, schema Pub/Sub và bảng log

---

### 4.2. 📎 Bảng Permission Code cho Audit Logging Service

| `permission_code`  | Mô tả                                              | API sử dụng                                  | `action` | `resource` | `default_condition`                      |
|---------------------|----------------------------------------------------|----------------------------------------------|----------|------------|------------------------------------------|
| `audit.read.log`    | Đọc danh sách hoặc chi tiết log hành vi người dùng | `GET /audit-log`, `GET /audit-log/{id}`      | `read`   | `log`      | `{ "tenant_id": "{{X-Tenant-ID}}" }`     |
| `audit.write`       | Ghi log (nội bộ, qua HTTP hoặc Pub/Sub)            | `POST /audit-log` (nội bộ), Pub/Sub listener | `create` | `log`      | `internal only, scope-based allowed`     |

---

#### 🎯 Giải thích:

- `audit.read.log`:
  - Áp dụng cho tất cả hành vi truy vấn log.
  - Kiểm soát theo tenant hiện tại (`X-Tenant-ID`).
  - Hệ thống hỗ trợ **masking động** với các trường nhạy cảm như `input_parameters`, `ip_address`, `user_agent` nếu người dùng không có vai trò đủ cao (e.g. không phải `tenant_admin`).

- `audit.write`:
  - **Không cấp cho người dùng cuối** – chỉ sử dụng nội bộ service → cần xác thực bằng JWT + scope `audit.write`.
  - Các hệ thống như `user-service`, `auth-service`, `api-gateway` có thể gọi `POST /audit-log` hoặc emit Pub/Sub event khi xảy ra hành vi cần ghi nhận.

---

### 4.3. 📚 Tài liệu liên quan

| Tài liệu | Mô tả |
|---------|-------|
| [design.md](./design.md) | Thiết kế tổng thể của Audit Logging Service, bao gồm kiến trúc, mô hình dữ liệu và luồng nghiệp vụ |
| [data-model.md](./data-model.md) | Định nghĩa chi tiết cấu trúc bảng log, định dạng lưu trữ và masking |
| [ADR-008 - Audit Format](../../ADR/adr-008-audit-logging.md) | Định dạng schema log chuẩn cho toàn hệ thống |
| [ADR-030 - Event Schema Governance](../../ADR/adr-030-event-schema-governance.md) | Quy tắc định danh, versioning và quản lý schema sự kiện |
| [rbac-deep-dive.md](../../architecture/rbac-deep-dive.md) | Phân tích sâu về RBAC, permission `audit.read.log` và masking theo role |
| [ADR-024 - Data Anonymization & Retention](../../ADR/adr-024-data-anonymization-retention.md) | Chiến lược ẩn danh và xóa dữ liệu nhạy cảm trong log |
| [ADR-012 - Response Structure](../../ADR/adr-012-response-structure.md) | Định dạng phản hồi chuẩn của toàn hệ thống |
| [ADR-011 - Error Format](../../ADR/adr-011-api-error-format.md) | Cấu trúc lỗi chuẩn (error envelope) dùng trong tất cả API |
