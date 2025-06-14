---
title: Notification Sub Service – Data Model
version: "1.0"
last_updated: "2025-06-14"
author: "DX VAS Team"
reviewed_by: "Stephen Le"
---

# 📦 Notification Sub Service – Data Model

Tài liệu này mô tả chi tiết các thực thể dữ liệu cốt lõi của Notification Sub Service, bao gồm schema, quan hệ, và các lưu ý về bảo mật, ẩn danh và chuẩn hóa schema theo chuẩn đa tenant.

---

## 1. 🎯 Mục tiêu & Phạm vi

Phần này xác định rõ phạm vi dữ liệu mà Notification Sub Service quản lý, đồng thời nhấn mạnh mục tiêu thiết kế dữ liệu đa tenant, có khả năng mở rộng, kiểm thử và truy vết.

---

### 🎯 Mục tiêu

- Cung cấp **mô hình dữ liệu chuẩn hóa** để lưu trữ các hoạt động gửi notification cho từng tenant.
- Hỗ trợ việc **truy vấn hiệu quả** thông tin log đã gửi theo nhiều tiêu chí: event, channel, trạng thái, người nhận.
- Cho phép **mapping động giữa event_code + channel → template** tùy theo tenant.
- Lưu trữ **cấu hình kênh gửi riêng** cho mỗi tenant với khả năng bật/tắt và fallback.
- Đảm bảo dữ liệu phù hợp với các yêu cầu:
  - **Audit & Compliance** theo `ADR-008`
  - **Retention & Anonymization** theo `ADR-024`
  - **Multi-tenant Isolation** theo CR-04 & `ADR-025`

---

### 📦 Phạm vi dữ liệu được quản lý

| Nhóm dữ liệu                 | Mô tả ngắn gọn                                                   |
|-----------------------------|------------------------------------------------------------------|
| Notification Template       | Metadata và nội dung template notification per tenant + channel |
| Notification Log            | Log gửi thực tế, bao gồm trace, status, lỗi, thời gian gửi      |
| Notification Channel Config | Cấu hình kênh gửi động (SMTP, SMS Provider, …) cho mỗi tenant   |

---

### 🔒 Nguyên tắc thiết kế dữ liệu

| Tiêu chí                         | Giải thích cụ thể                                                                 |
|----------------------------------|------------------------------------------------------------------------------------|
| **Multi-Tenant Isolation**       | Mọi bản ghi đều bắt buộc có `tenant_id` và được truy vấn dưới điều kiện isolation |
| **Traceability**                 | Mỗi notification log gắn `trace_id` xuyên suốt hệ thống                           |
| **Versioning**                   | Template có `version`, log lưu `template_id` để đảm bảo tái hiện                  |
| **Anonymization** *(optional)*  | Một số trường như `recipient`, `payload` có thể hash theo `ADR-024`              |
| **Retention & Deletion**        | Cho phép xóa mềm hoặc xóa vĩnh viễn sau thời gian theo policy                     |

---

### ⛔ Không nằm trong phạm vi

- Không lưu trạng thái đọc / unread
- Không lưu trạng thái gửi real-time của client (client-side delivery)
- Không lưu full render HTML trừ khi cần audit (tuỳ cấu hình)
- Không quản lý luồng trigger gửi (thuộc về Notification Master)

---

## 2. 🔢 Mô hình dữ liệu tổng thể

Hệ thống Notification Sub quản lý ba thực thể chính:

1. **NotificationTemplate** – Metadata template gắn với `event_code`, `channel`, và `tenant`
2. **NotificationLog** – Lưu lại từng lần gửi thực tế, bao gồm trace, lỗi, người nhận
3. **NotificationChannelCfg** – Cấu hình kênh gửi cho mỗi `tenant` và `channel`

Mô hình tuân thủ chặt chẽ kiến trúc multi-tenant, hỗ trợ versioning, tracing và khả năng kiểm toán đầy đủ.

---

### 🧭 Mối quan hệ giữa các thực thể

```mermaid
erDiagram
  NotificationTemplate ||--o{ NotificationLog : used_by
  NotificationChannelCfg ||--o{ NotificationTemplate : configures

  NotificationTemplate {
    UUID id PK
    STRING event_code
    STRING channel
    TEXT template_body
    JSONB default_params
    BOOLEAN is_active
    INTEGER version
    STRING tenant_id
    TIMESTAMPTZ updated_at
  }

  NotificationLog {
    UUID id PK
    UUID template_id FK
    STRING recipient
    STRING status
    TEXT error_message
    JSONB payload
    STRING tenant_id
    TIMESTAMPTZ sent_at
    STRING event_code
    STRING channel
    BOOLEAN retry
    STRING trace_id
  }

  NotificationChannelCfg {
    STRING channel PK
    STRING provider
    JSONB config
    BOOLEAN is_enabled
    STRING tenant_id
    TIMESTAMPTZ updated_at
  }
````

---

### 📌 Giải thích tổng quan các bảng

| Bảng                     | Vai trò chính                                                           |
| ------------------------ | ----------------------------------------------------------------------- |
| `NotificationTemplate`   | Template chuẩn hoá mapping từ `event_code` + `channel` → body gửi       |
| `NotificationLog`        | Log từng lần gửi: trạng thái, lỗi, trace\_id, thông tin người nhận      |
| `NotificationChannelCfg` | Lưu thông tin SMTP, SMS API, push key của từng tenant + trạng thái kênh |

---

### 🧩 Thiết kế hỗ trợ:

| Tính năng                     | Cách thực hiện                                                    |
| ----------------------------- | ----------------------------------------------------------------- |
| **Multi-tenant isolation**    | Trường `tenant_id` là bắt buộc trong tất cả các bảng              |
| **Traceability (X-Trace-ID)** | Log gắn `trace_id`, audit event có thể liên kết được              |
| **Versioning Template**       | Template có trường `version`; log lưu `template_id` để tái hiện   |
| **Soft-delete hoặc TTL**      | Log có thể xóa mềm theo config hoặc dọn dẹp theo `retention_days` |
| **Anonymization (opt-in)**    | Các trường `recipient`, `payload` có thể được mã hóa/anonymize    |

---

## 3. 📚 Chi tiết các bảng

---

### 3.1. `NotificationTemplate`

Lưu trữ metadata và nội dung template cho từng `event_code` và `channel`. Hỗ trợ versioning, ngôn ngữ, trạng thái bật/tắt và kiểm tra render (qua `POST /notifications/test`).

| Trường           | Kiểu        | Bắt buộc | Mô tả |
|------------------|-------------|----------|-------|
| `id`             | UUID        | ✅       | Mã định danh template (PK) |
| `tenant_id`      | STRING      | ✅       | Tenant sở hữu template |
| `event_code`     | STRING      | ✅       | Mã sự kiện nghiệp vụ, ví dụ `user.welcome` |
| `channel`        | STRING      | ✅       | `email`, `sms`, `push`,... |
| `language`       | STRING      | ⛔       | ISO code: `vi`, `en`,... |
| `version`        | INTEGER     | ✅       | Version template |
| `template_body`  | TEXT        | ✅       | Nội dung chứa biến (Jinja2 format) |
| `default_params` | JSONB       | ⛔       | Giá trị mặc định nếu `params` không cung cấp |
| `is_active`      | BOOLEAN     | ✅       | Template còn hiệu lực hay không |
| `updated_at`     | TIMESTAMPTZ | ✅       | Thời điểm cập nhật gần nhất |

🔎 **Ràng buộc quan trọng:**
- Unique constraint: `(tenant_id, event_code, channel, language, version)`
- Có index trên `tenant_id`, `event_code`, `channel`, `is_active`

---

### 3.2. `NotificationLog`

Lưu lại từng lần gửi notification (gửi thật hoặc test). Phục vụ audit, kiểm tra lỗi, thống kê.

| Trường           | Kiểu        | Bắt buộc | Mô tả |
|------------------|-------------|----------|-------|
| `id`             | UUID        | ✅       | Mã log gửi notification (PK) |
| `tenant_id`      | STRING      | ✅       | Tenant thực hiện gửi |
| `template_id`    | UUID        | ⛔       | Template sử dụng để gửi (nullable nếu gửi không qua template) |
| `event_code`     | STRING      | ✅       | Ghi lại event_code ứng với log này |
| `channel`        | STRING      | ✅       | `email`, `sms`, `push`,... |
| `recipient`      | STRING      | ✅       | Email/số điện thoại người nhận (có thể hash nếu config) |
| `status`         | STRING      | ✅       | `sent`, `failed`, `queued`, `fallback` |
| `error_message`  | TEXT        | ⛔       | Thông báo lỗi (nếu thất bại) |
| `payload`        | JSONB       | ✅       | Nội dung notification đã render (hoặc thông tin đầu vào) |
| `retry`          | BOOLEAN     | ✅       | Gửi lại từ lần trước (retry hoặc fallback) |
| `trace_id`       | STRING      | ✅       | Trace để liên kết với luồng Master |
| `sent_at`        | TIMESTAMPTZ | ✅       | Thời gian gửi thực tế (hoặc giả lập nếu test) |

🔎 **Lưu ý:**
- Có index trên `tenant_id`, `event_code`, `status`, `sent_at`, `recipient`
- Có thể xóa mềm hoặc TTL 30 ngày theo `ADR-024`

---

### 3.3. `NotificationChannelCfg`

Lưu cấu hình kênh gửi (SMTP, SMS provider...) riêng cho từng tenant. Hỗ trợ bật/tắt động, fallback hoặc dry-run.

| Trường         | Kiểu        | Bắt buộc | Mô tả |
|----------------|-------------|----------|-------|
| `channel`      | STRING      | ✅       | Kênh gửi (`email`, `sms`, `push`) |
| `tenant_id`    | STRING      | ✅       | Tenant sở hữu cấu hình này |
| `provider`     | STRING      | ✅       | Tên provider (`smtp`, `twilio`,...) |
| `config`       | JSONB       | ✅       | Config tùy thuộc provider (host, port, api_key...) |
| `is_enabled`   | BOOLEAN     | ✅       | Cho phép bật/tắt kênh gửi |
| `updated_at`   | TIMESTAMPTZ | ✅       | Lần cập nhật cuối cùng |

🔎 **Best Practice:**
- Config được load từ cache, invalidate khi có cập nhật
- Có thể có thêm trường `test_email`, `test_number` dùng cho `POST /notifications/test`

---

📌 **Gợi ý mở rộng tương lai (optional):**

| Trường gợi ý thêm  | Áp dụng cho | Gợi ý |
|--------------------|-------------|-------|
| `archived_at`      | All tables  | Hỗ trợ soft-delete có TTL tự động |
| `created_by`       | Template    | Ghi lại ai tạo template |
| `rendered_preview` | Log         | Lưu bản HTML đã render (nếu bật audit nâng cao) |

---

## 4. 🔐 Chính sách bảo mật & đa tenant

Thiết kế dữ liệu của Notification Sub Service đặt trọng tâm vào **tách biệt dữ liệu tenant**, **bảo mật thông tin cá nhân**, và **tuân thủ chính sách kiểm toán & lưu trữ**.  
Các nguyên tắc sau được áp dụng ở mọi tầng: schema, query, API, log và pipeline event.

---

### 4.1. 🧱 Tách biệt theo tenant (Tenant Isolation)

| Biện pháp                         | Giải thích                                                                 |
|----------------------------------|----------------------------------------------------------------------------|
| `tenant_id` bắt buộc             | Mọi bảng dữ liệu đều bắt buộc có `tenant_id`, không có giá trị `NULL`     |
| Ràng buộc truy vấn (`x-condition`) | Tất cả API & query đều sử dụng `WHERE tenant_id = {{X-Tenant-ID}}`        |
| Index hóa theo `tenant_id`       | Tối ưu hóa hiệu năng cho mô hình multi-tenant tách biệt                    |
| Không chia sẻ cấu hình           | Mỗi tenant có `NotificationChannelCfg` độc lập, không kế thừa mặc định    |

> 🔐 Tuân thủ `ADR-025 – Multi-Tenant Versioning`, `ADR-007 – RBAC`, `CR-04 – Phân vùng tenant vật lý/logic`

---

### 4.2. 🛡️ Bảo vệ dữ liệu cá nhân

| Trường nhạy cảm        | Biện pháp bảo vệ                            | Tùy chỉnh |
|------------------------|---------------------------------------------|-----------|
| `recipient`            | Có thể **băm SHA256 + salt riêng theo tenant** | Có cấu hình bật/tắt |
| `payload`              | Có thể **ẩn một số key nhạy cảm**            | Cấu hình whitelist field |
| `error_message`        | Chỉ hiển thị nội bộ, không lộ cho người dùng | Mặc định không expose qua UI |
| `config` trong channel | Không trả qua API                            | Chỉ dùng nội bộ khi gửi |

> Tuân thủ `ADR-024 – Data Anonymization & Retention`

---

### 4.3. 🕓 Chính sách giữ dữ liệu (Retention)

| Loại dữ liệu            | Chính sách gợi ý                             |
|-------------------------|----------------------------------------------|
| `NotificationLog`       | Xoá vĩnh viễn sau 30 ngày (`hard delete`)    |
| `Template`              | Không xoá – chỉ đánh dấu `is_active=false`   |
| `ChannelCfg`            | Ghi đè theo tenant, giữ phiên bản cuối cùng  |
| Audit event             | Do `audit-logging-service` lưu, TTL = 90 ngày|

> Nếu cần soft-delete (dùng `archived_at`), nên thêm theo `ADR-026 – Hard Delete Policy`

---

### 4.4. 🔍 Giám sát & kiểm toán

| Mục tiêu                       | Biện pháp triển khai                                    |
|-------------------------------|----------------------------------------------------------|
| Truy vết hành vi người dùng   | Log `POST /notifications/test`, `GET /logs` vào audit    |
| Trace toàn hệ thống           | Gắn `trace_id` từ Master xuyên suốt qua log gửi         |
| Giám sát channel usage        | Mỗi gửi log sẽ emit counter theo channel + status       |

---

### 4.5. ✅ Checklist tuân thủ bảo mật & đa tenant

| Tiêu chí                                                | Trạng thái |
|---------------------------------------------------------|------------|
| Mọi bảng có `tenant_id`, có index phù hợp               | ✅         |
| Không có API nào trả `config` hoặc `template_body` sai tenant | ✅         |
| Log không lộ thông tin cá nhân nếu cấu hình ẩn danh bật | ✅         |
| Dữ liệu nhạy cảm có thể xóa sau 30 ngày                 | ✅         |
| RBAC tách biệt rõ từng permission cho từng API          | ✅         |
| Sự kiện gửi thử được log lại phục vụ audit              | ✅         |

---

## 5. 🧩 Mapping sang các API

Bảng dưới đây trình bày mối quan hệ giữa từng API và các bảng dữ liệu liên quan.  
Mục tiêu là đảm bảo tính nhất quán giữa luồng nghiệp vụ, dữ liệu lưu trữ, và hợp đồng giao tiếp (interface contract).

| API Endpoint                         | Method | Thực thể liên quan              | Field truy cập/chỉnh sửa chính           |
|-------------------------------------|--------|----------------------------------|-------------------------------------------|
| `/notifications/logs`              | `GET`  | `NotificationLog`               | `status`, `recipient`, `event_code`, `channel`, `sent_at` |
| `/notifications/test`              | `POST` | `NotificationTemplate`, `NotificationChannelCfg` | `template_body`, `channel`, `event_code`, `params`, `config`, `recipient` |
|                                     |        | → log test cũng ghi vào `NotificationLog` (loại: test) | `status=test`, `retry=false`, `trace_id`, `payload` |
| `/notifications/templates`         | `GET`  | `NotificationTemplate`          | `event_code`, `channel`, `language`, `version`, `is_active`, `updated_at` |

---

### 5.1. 📌 Chi tiết truy xuất & ghi dữ liệu theo API

#### 🔍 `GET /notifications/logs`
- **Read-only**
- Truy vấn trên bảng `NotificationLog`
- Dựa trên `tenant_id`, có thể filter theo `status`, `channel`, `event_code`, `recipient`

#### 🧪 `POST /notifications/test`
- Truy xuất `NotificationTemplate` để render
- Truy xuất `NotificationChannelCfg` để kiểm tra config kênh gửi
- Ghi log gửi thử vào `NotificationLog` (dạng test, không ảnh hưởng thống kê chính)
- Gắn `trace_id`, status: `sent`, `failed`, `test_only: true`

#### 📑 `GET /notifications/templates`
- Truy xuất từ `NotificationTemplate` với `tenant_id` tương ứng
- Không trả `template_body`, chỉ metadata để UI lựa chọn

---

### 5.2. 🔐 RBAC Mapping

| API                                 | Permission Code         | Thực thể bảo vệ      |
|-------------------------------------|--------------------------|-----------------------|
| `GET /notifications/logs`          | `notif.read.log`         | `NotificationLog`     |
| `POST /notifications/test`         | `notif.send.test`        | `NotificationTemplate`, `ChannelCfg` |
| `GET /notifications/templates`     | `notif.read.template`    | `NotificationTemplate` |

---

## 6. 📌 Schema versioning & kiểm thử schema

---

### 6.1. 🎯 Mục tiêu

Việc version hóa schema giúp đảm bảo:
- Tương thích ngược khi template thay đổi cấu trúc
- Hỗ trợ A/B testing hoặc rollback khi cấu hình gửi thay đổi
- Cho phép kiểm tra tính đúng đắn của schema trước khi gửi thực tế

---

### 6.2. 📚 Vị trí version trong hệ thống

| Thành phần              | Cách version hóa                          |
|------------------------|-------------------------------------------|
| `NotificationTemplate` | Trường `version` (số nguyên tăng dần)     |
| `NotificationLog`      | Trường `template_id` và `event_code` lưu theo thời điểm gửi |
| API gửi thử (`/test`)  | Sử dụng `event_code`, hệ thống lấy template `is_active=true`, `version=max` |
| Event payload          | Schema validation thực hiện theo template tương ứng |

> Hệ thống KHÔNG nhúng version vào `event_code` – theo khuyến nghị của `ADR-030`.

---

### 6.3. 🧪 Cơ chế kiểm thử schema

**Gửi thử (`POST /notifications/test`) đóng vai trò là cơ chế kiểm thử schema động.**

| Bước | Diễn giải |
|------|-----------|
| 1️⃣   | Người dùng chọn `event_code`, `channel`, nhập `recipient` và `params` |
| 2️⃣   | Hệ thống lấy template đang `active` có `version = max` của tenant |
| 3️⃣   | Thực hiện render (Jinja2), nếu lỗi sẽ trả về `notif.render_failed` |
| 4️⃣   | Nếu render thành công, thực hiện gửi thử (tùy kênh) |
| 5️⃣   | Trả về preview HTML + trạng thái gửi |

> ❗ Các lỗi render, thiếu biến, sai kiểu sẽ được phát hiện tại bước 3 – không được phép đến bước gửi.

---

### 6.4. 🧩 Cơ chế quản lý template theo version

| Trường                | Mô tả                                                   |
|-----------------------|----------------------------------------------------------|
| `version`             | Được hệ thống auto tăng khi thêm template mới           |
| `is_active`           | Chỉ một bản active tại 1 thời điểm với `event_code + channel + language` |
| `template_id`         | Gắn vào mỗi `NotificationLog` để xác định nội dung đã dùng khi gửi |
| `updated_at`          | Phục vụ kiểm tra lịch sử và kiểm toán                   |

---

### 6.5. ✅ Kiểm thử schema nên bao gồm:

| Loại kiểm thử                    | Mục tiêu |
|----------------------------------|----------|
| Gửi test thiếu biến (`params`)  | Phát hiện lỗi render động |
| Gửi test với biến sai kiểu      | Bắt lỗi schema không khớp |
| Gửi test khi có version mới     | Đảm bảo lấy đúng version mới nhất |
| So sánh version giữa các tenant | Đảm bảo isolation, không xung đột |

---

## 7. 🧪 Gợi ý kiểm thử dữ liệu

Các trường hợp kiểm thử dưới đây nhằm đảm bảo hệ thống lưu trữ dữ liệu đúng, phản ánh chính xác luồng nghiệp vụ, đồng thời hỗ trợ audit và phân tích sự cố dễ dàng.

---

### 7.1. 🔄 Kiểm thử tạo & truy vấn log gửi

| Tình huống                                    | Mục tiêu kiểm thử                                      | Kết quả mong đợi                      |
|----------------------------------------------|--------------------------------------------------------|----------------------------------------|
| Gửi thử một template thành công              | Log ghi nhận đầy đủ thông tin (trace, status, payload) | Trạng thái `sent`, có trace_id         |
| Gửi thử template thiếu biến                  | Kiểm tra lỗi render template                           | Trạng thái `failed`, `error_message` rõ ràng |
| Gửi test với `recipient` ẩn danh             | Kiểm tra cơ chế hash `recipient`                       | Recipient bị mã hóa theo cấu hình      |
| Truy vấn log với `status=sent`               | Lọc log chính xác theo trạng thái                      | Kết quả đúng, không chứa log `failed`  |
| Truy vấn log theo `event_code` cụ thể        | Kiểm tra chỉ lấy log đúng loại sự kiện                 | `event_code` khớp toàn bộ trong response |
| Truy vấn log sai tenant                      | Đảm bảo isolation dữ liệu giữa tenants                 | Kết quả rỗng, không có dữ liệu lộ      |

---

### 7.2. 📄 Kiểm thử template

| Tình huống                                    | Mục tiêu kiểm thử                                      | Kết quả mong đợi                      |
|----------------------------------------------|--------------------------------------------------------|----------------------------------------|
| Gửi test với `event_code` không tồn tại      | Xử lý trường hợp template không hợp lệ                 | 400 + `notif.template_not_found`       |
| Gửi test với template `is_active=false`      | Không cho phép gửi test template đã tắt                | 400 + `notif.template_inactive`        |
| Truy vấn danh sách template                  | Đảm bảo trả metadata đúng                              | Có `event_code`, `channel`, `version`  |
| Có nhiều version cùng `event_code`           | Hệ thống chọn đúng `version=max` khi gửi test          | Gửi đúng template mới nhất             |

---

### 7.3. 🔐 Kiểm thử liên quan bảo mật & phân vùng tenant

| Tình huống                                     | Mục tiêu kiểm thử                                  | Kết quả mong đợi                     |
|-----------------------------------------------|----------------------------------------------------|---------------------------------------|
| Truy vấn log từ tenant khác                   | Bảo vệ phân vùng dữ liệu giữa tenants              | 403 hoặc 200 + `data=[]`              |
| Cùng `event_code`, khác tenant                | Template độc lập, không bị lẫn nhau                | Kết quả đúng theo từng tenant         |
| Gửi thử với cấu hình channel bị tắt           | Không gửi, báo lỗi cấu hình                         | 400 + `notif.channel_disabled`        |
| Thử cấu hình kênh không hợp lệ                | Phát hiện config sai (ví dụ thiếu SMTP host)       | 500 + `notif.channel_config_invalid`  |

---

### 7.4. 🧩 Kiểm thử toàn vẹn dữ liệu

| Tình huống                                    | Mục tiêu kiểm thử                                      | Kết quả mong đợi                      |
|----------------------------------------------|--------------------------------------------------------|----------------------------------------|
| Log không có `template_id` (trường hợp test JSON thuần) | Đảm bảo nullable hoạt động đúng            | Ghi log với `template_id = null`       |
| Log có `trace_id` trùng với Master            | Cho phép liên kết xuyên trace                          | Dữ liệu khớp trace                    |
| TTL dọn log sau 30 ngày                       | Dữ liệu được xóa định kỳ theo retention policy         | Không còn dữ liệu cũ                  |

---

### 7.5. ✅ Checklist xác nhận dữ liệu

| Tiêu chí                                    | Trạng thái |
|--------------------------------------------|------------|
| `tenant_id` luôn được kiểm tra trong mọi truy vấn  | ✅         |
| Các bản ghi log có `trace_id` hợp lệ        | ✅         |
| Template không thể bị gửi nếu không active  | ✅         |
| Dữ liệu test không được dùng cho thống kê thật | ✅         |
| Có thể kiểm tra lại dữ liệu từ log + trace  | ✅         |

---

## 8. 📚 Tài liệu liên quan

* [Design.md](./design.md)
* [Interface Contract](./interface-contract.md)
* [OpenAPI Spec](./openapi.yaml)
* [ADR-030 – Event Schema Governance](../../../ADR/adr-030-event-schema-governance.md)
* [ADR-024 – Data Anonymization & Retention](../../../ADR/adr-024-data-anonymization-retention.md)
* [ADR-025 – Multi-Tenant Versioning](../../../ADR/adr-025-multi-tenant-versioning.md)
* [ADR-007 – RBAC](../../../ADR/adr-007-rbac.md)