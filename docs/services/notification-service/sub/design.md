---
title: "Thiết kế chi tiết Notification Sub Service"
version: "1.0"
last_updated: "2025-06-14"
author: "DX VAS Team"
reviewed_by: "Stephen Le"
---

# 📘 Thiết kế chi tiết Notification Sub Service

## 1. 🧭 Phạm vi và Trách nhiệm

### 🎯 Mục tiêu

- Lắng nghe sự kiện `notification.triggered` từ Notification Master để gửi thông báo thực tế đến người dùng cuối trong từng tenant.
- Quản lý cấu hình kênh gửi của tenant (email, SMS, push), mapping template và xử lý fallback logic.
- Ghi nhận log gửi để phục vụ tra soát, thống kê, và audit.

### 📦 Các thực thể dữ liệu quản lý

| Thực thể                  | Mô tả                                                                 |
|---------------------------|----------------------------------------------------------------------|
| `NotificationTemplate`    | Template được cấu hình riêng cho từng tenant, mapping theo trigger_event. |
| `NotificationLog`         | Lưu lại lịch sử gửi thông báo, trạng thái gửi, lỗi, thời gian gửi.     |
| `NotificationChannelCfg`  | Cấu hình kênh gửi (SMTP, SMS provider...) do tenant quản lý.         |

### 🔒 Ngoài Phạm Vi

Service này **không** thực hiện:
- ❌ Quản lý trigger business logic tạo ra notification – đã được tách riêng tại Notification Master.
- ❌ Tự generate nội dung hoặc cá nhân hóa sâu (việc đó do master thực hiện).
- ❌ Gửi thông báo vượt quyền tenant (cross-tenant broadcast).
- ❌ Xác thực user – được thực hiện tại Gateway.

### 👥 Đối tượng sử dụng

- Notification Master (qua Pub/Sub – async)
- Superadmin Webapp (cho mục đích tra log, kiểm tra trạng thái – nếu cần)
- Admin Webapp của tenant (truy cập nội bộ để chỉnh sửa cấu hình kênh)

## 2. 🌐 Thiết kế API chi tiết

| Method | Path                            | Tác vụ                                     | Yêu cầu permission (RBAC)         |
|--------|----------------------------------|--------------------------------------------|----------------------------------|
| GET    | `/notifications/logs`           | Lấy danh sách log gửi                       | `notif.read.log`                |
| GET    | `/notifications/templates`      | Lấy danh sách template                     | `notif.read.template`           |
| POST   | `/notifications/test`           | Gửi thử 1 notification tới người dùng test | `notif.send.test`               |

> 🔧 Tuân thủ:
> - ADR-011: Error Format
> - ADR-012: Response Envelope
> - ADR-013: Path Naming
> - ADR-030: Event Schema Governance (consume: `notification.triggered`)
> - 📎 Chi tiết xem tại: [Interface Contract](./interface-contract.md) và [OpenAPI Spec](./openapi.yaml)

## 3. 🗃️ Mô hình dữ liệu chi tiết

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
    TIMESTAMPTZ updated_at
  }

  NotificationLog {
    UUID id PK
    UUID template_id FK
    STRING recipient
    STRING status
    TEXT error_message
    JSONB payload
    TIMESTAMPTZ sent_at
  }

  NotificationChannelCfg {
    STRING channel PK
    STRING provider
    JSONB config
    BOOLEAN is_enabled
    TIMESTAMPTZ updated_at
  }
````

> 📎 Chi tiết xem tại: [Data Model](./data-model.md)

---

### 4. 🔄 Luồng nghiệp vụ chính – Chi tiết hóa

#### 4.1. Mục tiêu

Mỗi lần nhận được sự kiện `notification.triggered`, service phải:

1. Lấy đúng template phù hợp theo `event_code`, `channel`, `tenant_id`
2. Gửi notification qua kênh tương ứng (email, SMS, v.v.)
3. Log đầy đủ hành động gửi – trạng thái, lỗi nếu có, thời gian
4. Có fallback nếu gửi kênh chính thất bại (nếu được cấu hình)
5. Tuân thủ giới hạn (rate-limit, retry theo config nếu có)

---

#### 4.2. Mô tả logic đầy đủ

```mermaid
sequenceDiagram
    participant PubSub as Pub/Sub
    participant NotiSub as Notification Sub
    participant DB as Notification DB
    participant Email as Email/SMS Gateway
    participant Fallback as Fallback Channel

    PubSub-->>NotiSub: Nhận sự kiện `notification.triggered`
    Note right of NotiSub: Extract `tenant_id`, `event_code`, `channel`, `recipient`, `params`

    NotiSub->>DB: Truy vấn NotificationTemplate (match theo `event_code`, `channel`, `tenant_id`)
    alt Không tìm thấy template
        NotiSub-->>DB: Ghi log lỗi "template not found"
        Note right of NotiSub: Dừng xử lý – không gửi
    else Template hợp lệ
        NotiSub->>DB: Ghi log trạng thái `queued`, lưu payload
        NotiSub->>Email: Gửi thông báo (render template + send)
        alt Gửi thành công
            Email-->>NotiSub: OK
            NotiSub->>DB: Update log → status=`sent`
        else Gửi thất bại
            Email-->>NotiSub: Error
            alt Có fallback được cấu hình
                NotiSub->>Fallback: Gửi lại qua kênh fallback
                Fallback-->>NotiSub: OK/Error
                NotiSub->>DB: Update log → status=`sent_fallback` hoặc `failed`
            else Không có fallback
                NotiSub->>DB: Update log → status=`failed`, lưu lỗi
            end
        end
    end
```

---

#### 4.3. Chi tiết các bước

| Bước                    | Mô tả                                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1. Nhận sự kiện**     | Service lắng nghe từ Pub/Sub `notification.triggered.v1` với payload có `event_code`, `channel`, `recipient`, `params`, `trace_id`, `tenant_id`. |
| **2. Tra cứu template** | Truy theo `event_code` + `channel` + `tenant_id`. Nếu không có template tương ứng → ghi log lỗi và dừng.                                         |
| **3. Render & Gửi**     | Render `template_body` với `params` và gửi thực tế qua SMTP/SMS/...                                                                              |
| **4. Ghi log gửi**      | Tạo entry trong bảng `NotificationLog` trước khi gửi (status: `queued`), sau đó update thành `sent`, `sent_fallback`, hoặc `failed`.             |
| **5. Xử lý fallback**   | Nếu kênh gửi thất bại và có cấu hình fallback (VD: từ email → SMS), thực hiện gửi lại qua fallback.                                              |
| **6. Audit & Tracing**  | Ghi đầy đủ trace\_id và action `notification.sent` phục vụ audit (`adr-008`).                                                                    |

---

#### 4.4. Ghi chú & lưu ý triển khai

* **Template Mapping** phải đúng channel – tránh gửi email bằng SMS template hoặc ngược lại.
* **Bảo vệ chống gửi lặp** nếu Pub/Sub delivery bị trùng → cần xử lý idempotency qua `event_id`.
* **Fallback policy** có thể cấu hình ở level `NotificationChannelCfg`, ví dụ:

  ```json
  {
    "channel": "email",
    "fallback": ["sms"],
    "retry_limit": 2
  }
  ```
* **Cần validate đầu vào kỹ**: recipient không null, channel được hỗ trợ, params đủ để render template.
* **Không block worker nếu gửi thất bại** – chỉ cần log và tiếp tục.

---

## 5. 📣 Tương tác & Sự kiện

### 5.1. Sự kiện nhận vào (Consumed Event)

#### 🔔 Sự kiện: `notification.triggered.v1`

| Thuộc tính   | Bắt buộc | Mô tả                                                      |
| ------------ | -------- | ---------------------------------------------------------- |
| `event_id`   | ✅        | UUID định danh sự kiện, phục vụ idempotency                |
| `tenant_id`  | ✅        | Tenant gửi thông báo                                       |
| `event_code` | ✅        | Mã sự kiện trừu tượng (vd: `user.welcome`) để tra template |
| `channel`    | ✅        | Kênh gửi (`email`, `sms`, `push`, etc.)                    |
| `recipient`  | ✅        | Địa chỉ nhận (`email`, `phone`, `device_id`,…)             |
| `params`     | ✅        | Tham số động để render nội dung template (JSON)            |
| `trigger_by` | ⛔        | ID người dùng kích hoạt sự kiện (nếu có)                   |
| `trace_id`   | ✅        | Trace để tracking xuyên suốt toàn hệ thống                 |
| `created_at` | ✅        | Thời điểm phát sinh sự kiện (để log thống nhất)            |

Ví dụ schema (JSON):

```json
{
  "event_id": "3a36f1d4-8fa7-4704-a94e-4c55e9142cb3",
  "tenant_id": "tenant-vas-001",
  "event_code": "user.welcome",
  "channel": "email",
  "recipient": "student@example.edu.vn",
  "params": {
    "full_name": "Nguyễn Văn A",
    "first_login_at": "2025-06-01T10:00:00Z"
  },
  "trigger_by": "admin_123",
  "trace_id": "x-trace-abc-789",
  "created_at": "2025-06-14T07:32:00Z"
}
```

> ✅ Schema này được quản lý và version hóa theo `ADR-030 – Event Schema Governance`

---

### 5.2. Xử lý sự kiện

* Notification Sub Service sẽ **đăng ký lắng nghe** topic tương ứng, ví dụ:

  * GCP Pub/Sub: `vas.notification.triggered.v1`
  * Kafka: `notification.triggered.v1`
* Khi nhận event, service thực hiện pipeline:

  * Parse + Validate schema theo version
  * Check `event_id` đã xử lý chưa → để tránh gửi lặp (idempotency)
  * Render template
  * Gửi notification
  * Ghi log + kết quả gửi + `trace_id` + `status`

---

### 5.3. Không phát sinh sự kiện outbound

Notification Sub **không phát event ngược ra ngoài**. Tuy nhiên:

* Có thể log vào hệ thống Audit Logging (theo `adr-008`) bằng cách gọi nội bộ tới `audit-logging-service`
* Không có luồng đồng bộ đẩy ra Pub/Sub để tránh phát sinh spam hoặc loop

---

### 5.4. Biến thể sự kiện & khả năng mở rộng

| Biến thể                    | Mô tả                                      | Cách xử lý                                  |
| --------------------------- | ------------------------------------------ | ------------------------------------------- |
| `notification.triggered.v2` | Phiên bản mới của schema (breaking change) | Service nên dual-consume nếu cần            |
| `notification.test.v1`      | Sự kiện gửi thử (từ Admin UI)              | Có thể xử lý nội bộ, log riêng              |
| `notification.bulk.v1`      | Gửi nhiều người nhận một lúc               | **Không xử lý** – đã tách thành luồng riêng |

> 📌 Các biến thể nên được định nghĩa rõ trong `event-schemas/registry` theo `ADR-030`

---

### 5.5. Chính sách Schema & Versioning

Tuân thủ nghiêm ngặt `ADR-030`:

* Không thay đổi field bắt buộc trong version cũ
* Nếu cần breaking change → tạo version mới (vd: `v2`) và dual-publish trong giai đoạn chuyển tiếp
* Mỗi sự kiện đều mang `event_id`, `trace_id`, `version`, `tenant_id`

---

## 6. 🔐 Bảo mật & RBAC

### 6.1. Authentication – Xác thực

* **Mọi API của Notification Sub** đều yêu cầu người dùng đã xác thực qua **API Gateway**, dùng JWT chuẩn theo `ADR-006`.
* Token sẽ được kiểm tra signature và claim gồm:

  * `sub`: user ID
  * `tenant_id`: mã tenant đang truy cập
  * `permissions`: danh sách quyền có dạng `notif.read.log`, `notif.send.test`, v.v.
  * `exp`: thời điểm hết hạn
* Token được đính kèm qua header:

  ```
  Authorization: Bearer <access_token>
  ```

---

### 6.2. Authorization – Phân quyền

Áp dụng mô hình RBAC **phân tầng theo tenant**, theo chuẩn `ADR-007`.
Mỗi API đều khai báo permission yêu cầu qua `x-required-permission`, ví dụ:

```yaml
x-required-permission: notif.read.log
```

#### Quy tắc phân quyền:

| Nhóm chức năng   | Permission            | Mô tả                                            |
| ---------------- | --------------------- | ------------------------------------------------ |
| Xem log gửi      | `notif.read.log`      | Cho phép truy xuất danh sách notification đã gửi |
| Xem template     | `notif.read.template` | Cho phép tra cứu các template hiện có            |
| Gửi thử          | `notif.send.test`     | Gửi thử email/SMS đến địa chỉ kiểm tra           |
| Cấu hình channel | `notif.write.config`  | Sửa thông tin cấu hình kênh gửi của tenant       |

> ✅ Danh sách permission được cấp theo từng `user_role` gắn với `X-Tenant-ID`

---

### 6.3. Tenant Isolation – Tách biệt tenant

Theo yêu cầu của `CR-04`, mọi hành động (query, mutate, audit) đều phải:

* **Ràng buộc trong phạm vi `X-Tenant-ID`** (đọc từ JWT hoặc header)
* Không cho phép truy cập chéo tenant (trừ `Superadmin`)
* Có cấu trúc condition rõ trong OpenAPI:

  ```yaml
  x-condition:
    tenant_id: "{{X-Tenant-ID}}"
  ```

---

### 6.4. Audit Logging – Ghi log kiểm toán

Tuân thủ `ADR-008`, mọi hành động quan trọng sẽ được log lại dưới dạng Audit Event, bao gồm:

| Hành động                | Audit Action                  | Ghi chú                                 |
| ------------------------ | ----------------------------- | --------------------------------------- |
| Gửi một notification     | `notification.sent`           | Bao gồm recipient, template\_id, status |
| Sửa cấu hình channel gửi | `notification.config.updated` | Lưu lại giá trị cũ và mới               |
| Gửi thử                  | `notification.test_sent`      | Lưu lại người gửi thử & kết quả         |

> Audit log được đẩy async tới `audit-logging-service` hoặc ghi nội bộ tùy theo cấu hình môi trường

---

### 6.5. Data Protection – Bảo vệ dữ liệu cá nhân

* Không lưu plaintext recipient hoặc payload nếu không cần thiết.
* Trường nhạy cảm (`recipient`, `error_message`) có thể bị **mask hoặc hash** nếu được cấu hình.
* Có thể dùng `ADR-024` để thiết lập thời gian **anonymization hoặc retention policy** theo từng tenant.

---

### 6.6. Các biện pháp phòng vệ bổ sung

| Lớp bảo vệ         | Mô tả                                                                       |
| ------------------ | --------------------------------------------------------------------------- |
| Input validation   | Kiểm tra recipient, template\_id, channel có hợp lệ không                   |
| Rate limiting      | Do API Gateway quản lý – tránh spam gửi                                     |
| Idempotency        | Dựa trên `event_id` để tránh gửi lặp nếu event bị retry                     |
| Fallback isolation | Nếu gửi thất bại và fallback, đảm bảo fallback không rò dữ liệu giữa tenant |
| CI/CD static scan  | Kiểm tra dependency & config secrets trước khi deploy                       |

---

## 7. ⚙️ Cấu hình & Phụ thuộc

### 7.1. Biến môi trường chính (`ENV VARS`)

| Biến                        | Bắt buộc | Giá trị mẫu                                | Mô tả                                                                 |
| --------------------------- | -------- | ------------------------------------------ | --------------------------------------------------------------------- |
| `SERVICE_PORT`              | ✅        | `8080`                                     | Cổng service sẽ mở cho HTTP API nội bộ                                |
| `DATABASE_URL`              | ✅        | `postgres://user:pass@host:5432/notif_sub` | Kết nối tới CSDL Postgres chứa template/log                           |
| `PUBSUB_TOPIC`              | ✅        | `notification.triggered.v1`                | Tên topic Pub/Sub để subscribe sự kiện                                |
| `GCP_PROJECT_ID`            | ⛔        | `vas-prod-01`                              | Dùng nếu chạy trên GCP – định danh project                            |
| `TENANT_CONFIG_SECRET_PATH` | ✅        | `/secrets/tenant_config/`                  | Trỏ tới thư mục chứa config từng tenant (template, fallback, channel) |
| `SMTP_PROVIDER_SECRET`      | ⛔        | `secret://smtp-notif`                      | Secret chứa config SMTP provider mặc định                             |
| `JWT_PUBLIC_KEY_PATH`       | ✅        | `/etc/keys/jwt.pub`                        | File public key để verify JWT                                         |
| `ENVIRONMENT`               | ✅        | `production` / `staging` / `dev`           | Dùng để phân biệt môi trường khi gửi Audit log, alerting              |
| `AUDIT_SERVICE_ENDPOINT`    | ⛔        | `http://audit-logging-service`             | Endpoint nội bộ gọi tới Audit Logging nếu bật                         |

> 🔐 Secrets như SMTP credentials, access tokens không bao giờ hardcode – được mount từ Secret Manager hoặc Vault (theo `ADR-003` và `ADR-004`)

---

### 7.2. Cấu hình theo tenant (Dynamic per-tenant)

Các tenant có thể có cấu hình khác nhau như:

| Cấu hình          | Mô tả                                                                           |
| ----------------- | ------------------------------------------------------------------------------- |
| Template riêng    | Cùng một `event_code`, mỗi tenant có thể định nghĩa nội dung template khác nhau |
| Cấu hình kênh gửi | Email: SMTP riêng, SMS: key riêng theo provider                                 |
| Fallback policy   | Có thể chọn fallback hoặc không, theo logic riêng của tenant                    |
| Ngôn ngữ mặc định | Một số tenant gửi email bằng Tiếng Anh, số khác bằng Tiếng Việt                 |
| Opt-in / Opt-out  | Cho phép user từ chối nhận một số loại thông báo (VD: quảng cáo)                |

Thông tin này được nạp từ `TENANT_CONFIG_SECRET_PATH` theo mỗi tenant (`tenant_id`) trong runtime.

---

### 7.3. Phụ thuộc hệ thống

| Thành phần               | Mục tiêu sử dụng                                                | Giao thức       |
| ------------------------ | --------------------------------------------------------------- | --------------- |
| `PostgreSQL`             | Lưu trữ `NotificationTemplate`, `NotificationLog`, `ChannelCfg` | SQL             |
| `Pub/Sub`                | Nhận sự kiện `notification.triggered` từ Master                 | PubSub/Kafka    |
| `Email/SMS Provider`     | Gửi email, SMS qua SMTP/HTTP API                                | SMTP / HTTPS    |
| `audit-logging-service`  | Ghi log hành vi gửi (nếu bật)                                   | HTTP nội bộ     |
| `vault / secret-manager` | Lưu config gửi riêng của tenant                                 | Nạp khi runtime |

---

### 7.4. Phân biệt giữa cấu hình "build-time" và "runtime"

| Loại cấu hình  | Ví dụ                                             | Ghi chú                             |
| -------------- | ------------------------------------------------- | ----------------------------------- |
| **Build-time** | `ENVIRONMENT`, `SERVICE_PORT`, `GCP_PROJECT_ID`   | Dùng trong CI/CD, xác định behavior |
| **Runtime**    | `tenant_id`, `SMTP_PROVIDER_SECRET`, `ChannelCfg` | Nạp động tùy tenant hoặc request    |

---

## 8. 🧪 Kiểm thử

Việc kiểm thử `notification-service/sub/` được chia thành 4 lớp chính: **Unit**, **Integration**, **Contract**, và **Security & RBAC**.
Tất cả các test đều cần **tự động hóa** và được tích hợp vào CI pipeline qua GitHub Actions (`adr-001`).

---

### 8.1. 🧪 Unit Tests

| Mục tiêu           | Nội dung kiểm thử                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| Xử lý sự kiện      | Kiểm tra các nhánh xử lý khi nhận event: tìm thấy template, không tìm thấy, gửi thành công, gửi thất bại |
| Gửi thông báo      | Mock SMTP/SMS provider để kiểm tra logic gửi                                                             |
| Template rendering | Xác minh `params` render đúng template hoặc lỗi rõ ràng khi thiếu biến                                   |
| Fallback logic     | Kiểm tra khi channel chính lỗi, service fallback đúng channel phụ                                        |
| Logging logic      | Log đúng trạng thái: `queued`, `sent`, `sent_fallback`, `failed`                                         |

> ✅ Tỷ lệ coverage bắt buộc > 80% (code coverage report tích hợp CI/CD)

---

### 8.2. 🔄 Integration Tests

| Tầng tích hợp        | Nội dung kiểm thử                                                              |
| -------------------- | ------------------------------------------------------------------------------ |
| Với DB               | Insert + query các bản ghi `NotificationLog`, `Template`, `ChannelCfg`         |
| Với Pub/Sub          | Gửi giả lập sự kiện `notification.triggered.v1` và xác minh hành vi end-to-end |
| Với SMTP/SMS giả lập | Dùng fake server để test luồng gửi thật (smtp4dev, httpbin)                    |
| Với Audit Service    | Kiểm tra audit log gửi đi đúng định dạng, đúng action                          |

---

### 8.3. 🤝 Contract Tests (theo ADR-010)

Tuân thủ kiểm thử giao diện (OpenAPI contract):

| API                            | Kiểm thử                                  |
| ------------------------------ | ----------------------------------------- |
| GET `/notifications/logs`      | Trả đúng định dạng `Envelope`, pagination |
| POST `/notifications/test`     | Gửi thử thành công và lỗi                 |
| GET `/notifications/templates` | Trả danh sách template theo tenant        |

Sử dụng:

* [Prism](https://github.com/stoplightio/prism) hoặc [Dredd](https://dredd.org) để test OpenAPI spec
* CI sẽ **fail nếu sai contract** (ví dụ đổi schema không báo trước)

---

### 8.4. 🛡️ RBAC & Security Tests

| Tình huống               | Kiểm thử                                          |
| ------------------------ | ------------------------------------------------- |
| Không có token           | Bị từ chối truy cập (`401`)                       |
| Token sai tenant         | Không nhìn thấy dữ liệu tenant khác (`403`)       |
| Thiếu permission         | Trả lỗi `403`, có `error_code: permission_denied` |
| Có đủ quyền              | Truy cập được API tương ứng                       |
| JWT expired              | Trả lỗi `401` rõ ràng                             |
| JWT không đúng định dạng | Trả `400` với mã lỗi `invalid_token`              |

> ✅ Kết quả test phải khớp với `error-codes.md` theo `ADR-011`

---

### 8.5. 📊 Đo lường & Báo cáo

* Báo cáo test coverage (`pytest-cov`, `jest`,...) gửi về CI/CD dashboard
* Ghi rõ:

  * % coverage theo service/module
  * Tên test bị fail và lý do
* Tự động chạy lại test nếu xảy ra race condition do message queue

---

### 8.6. 🧪 Test trong môi trường staging

Mỗi release trước khi đưa lên production sẽ được kiểm tra trong staging với:

| Môi trường          | Mục tiêu                          |
| ------------------- | --------------------------------- |
| DB độc lập          | Không ảnh hưởng prod              |
| Pub/Sub topic riêng | Tránh tiêu thụ nhầm message thật  |
| SMTP test gateway   | Không gửi thật, có log kiểm chứng |

---

## 9. 📈 Giám sát & Audit

### 9.1. 🔍 Logging (Ứng dụng & Gửi thông báo)

| Mục tiêu       | Chi tiết                                                                       |
| -------------- | ------------------------------------------------------------------------------ |
| Mức log        | Dùng các mức `info`, `warn`, `error`, `debug` đúng chuẩn                       |
| Tenant tagging | Mỗi log đều phải đính kèm `tenant_id`, `trace_id`, `event_id` nếu có           |
| Nhân sự kiện   | Log rõ event nhận được, template áp dụng, hành vi gửi                          |
| Thất bại       | Log lý do lỗi gửi (`SMTP timeout`, `invalid recipient`, v.v.)                  |
| Fallback       | Ghi nhận nếu gửi qua fallback channel                                          |
| Log định dạng  | JSON log structure, tuân chuẩn `12-factor app` để dễ gửi sang ELK/Grafana/Loki |

---

### 9.2. 📊 Metrics (Prometheus / OpenTelemetry)

| Metric                           | Kiểu      | Mô tả                                                                 |
| -------------------------------- | --------- | --------------------------------------------------------------------- |
| `notif_event_received_total`     | Counter   | Tổng số event `notification.triggered` đã nhận                        |
| `notif_sent_success_total`       | Counter   | Số lượng gửi thành công qua channel chính                             |
| `notif_sent_failed_total`        | Counter   | Số lượng gửi thất bại hoàn toàn                                       |
| `notif_sent_fallback_total`      | Counter   | Số lượng gửi qua fallback                                             |
| `notif_delivery_duration_ms`     | Histogram | Thời gian từ lúc nhận event đến khi gửi xong                          |
| `notif_queue_size`               | Gauge     | Số lượng event đang chờ xử lý trong hàng đợi nội bộ (nếu dùng buffer) |
| `notif_db_latency_ms`            | Histogram | Latency khi truy cập CSDL                                             |
| `notif_config_load_errors_total` | Counter   | Số lỗi nạp config channel/template không hợp lệ                       |

> ✅ Tất cả metric đều được **gắn nhãn (`labels`)** gồm `tenant_id`, `channel`, `status`, `template_id` nếu có.

---

### 9.3. 🎯 SLO & Alerting

Tuân thủ `ADR-022` – thiết lập SLO cho service:

| Mục tiêu             | SLO     | Alert khi                                          |
| -------------------- | ------- | -------------------------------------------------- |
| Tỷ lệ gửi thành công | ≥ 99%   | Trong 5 phút, tỉ lệ thất bại > 5%                  |
| Độ trễ xử lý         | < 2s    | Độ trễ gửi > 5s với >10% notification              |
| Lỗi template         | 0       | Có bất kỳ lỗi render hoặc thiếu template           |
| Không có log         | < 1 min | Không có event mới được nhận trong ≥ 5 phút (prod) |

> ✅ Alert được gửi về Email/Slack qua Alertmanager hoặc Grafana OnCall.

---

### 9.4. 📁 Audit Log (tuân thủ ADR-008)

Các hành vi cần audit:

| Hành vi           | `x-audit-action`                | Nội dung cần log                                                    |
| ----------------- | ------------------------------- | ------------------------------------------------------------------- |
| Gửi notification  | `notification.sent`             | event\_id, channel, status, template\_id, recipient (masked), actor |
| Gửi thử           | `notification.test_sent`        | test\_target, actor                                                 |
| Cập nhật channel  | `notification.config.updated`   | diff config, actor, time                                            |
| Cập nhật template | `notification.template.updated` | diff content, actor, trace\_id                                      |

* Audit log được đẩy async tới `audit-logging-service` qua HTTP nội bộ.
* Log phải chứa: `actor_id`, `tenant_id`, `trace_id`, `action`, `timestamp`, `details`.

---

### 9.5. 🔁 Tracing (OpenTelemetry)

Tích hợp **OpenTelemetry** để trace xuyên suốt hành trình notification:

| Trace span    | Ghi nhận                     |
| ------------- | ---------------------------- |
| Nhận event    | timestamp nhận, message size |
| Tìm template  | lookup time, cache hit/miss  |
| Gửi email/SMS | duration, result             |
| Log cập nhật  | DB write status              |

Tất cả trace được gắn với `trace_id` gốc từ sự kiện.
Dữ liệu gửi về `OTEL Collector` → `Grafana Tempo` hoặc `Jaeger`.

---

## 10. 🚀 Triển khai & Migration

### 10.1. 🧭 Chiến lược triển khai

Việc triển khai `notification-service/sub/` được thiết kế để **đảm bảo Zero Downtime** theo `ADR-014` với các đặc điểm:

| Yếu tố              | Chi tiết                                                                    |
| ------------------- | --------------------------------------------------------------------------- |
| Mô hình deploy      | Container-based (Docker)                                                    |
| Phân phối           | Triển khai theo tenant hoặc cụm tenant, có thể dùng K8s namespace tách biệt |
| Quản lý phiên bản   | Image versioning theo tag `vas-notif-sub:v1.x.x`                            |
| Triển khai xanh/xám | Hỗ trợ blue-green và rolling update                                         |
| Healthcheck         | Tuân theo `/healthz`, `/readyz` cho liveness và readiness probe             |
| Quản lý bí mật      | Inject qua secret manager hoặc volume mount (`ADR-003`)                     |

---

### 10.2. ☁️ Môi trường & ranh giới triển khai (theo ADR-017)

| Môi trường | Mục đích      | Ranh giới                                                     |
| ---------- | ------------- | ------------------------------------------------------------- |
| `dev`      | Phát triển    | Có thể chia sẻ DB + PubSub với team khác                      |
| `staging`  | Tiền sản xuất | Mỗi tenant chạy instance độc lập                              |
| `prod`     | Vận hành thật | Mỗi tenant production có cluster riêng (hoặc namespace riêng) |

> 🔐 Cấu hình `ENVIRONMENT` sẽ ảnh hưởng đến behavior gửi thật hay giả (ví dụ: `smtp-sandbox` trong dev)

---

### 10.3. 🚀 Tự động hóa triển khai (CI/CD)

Tuân thủ `ADR-001`:

| Bước                  | Công cụ                               |
| --------------------- | ------------------------------------- |
| Build Docker image    | `Dockerfile` chuẩn hóa                |
| Push lên registry     | GitHub Actions / GitLab CI            |
| Deploy staging        | Helm / ArgoCD                         |
| Run post-deploy tests | `pytest` hoặc `dredd` (contract test) |
| Notify kết quả        | Slack webhook / GitHub Status         |

---

### 10.4. 📥 Migration dữ liệu (schema & dữ liệu)

Tuân thủ `ADR-023 – Schema Migration Strategy`

| Bảng ảnh hưởng           | Chi tiết                                                               |
| ------------------------ | ---------------------------------------------------------------------- |
| `NotificationTemplate`   | Dữ liệu mặc định cho từng `event_code` có thể seed khi khởi tạo tenant |
| `NotificationLog`        | Không migration, tạo mới từng dòng                                     |
| `NotificationChannelCfg` | Tùy tenant, có thể import từ file cấu hình YAML hoặc JSON              |

#### Công cụ gợi ý

* Quản lý migration: `Alembic` hoặc `Sqlx` (nếu dùng Python / Go)
* Kiểm tra forward/backward compatibility: `schemachange` hoặc `sqldiff`

---

### 10.5. ⛑️ Rollback strategy

| Trường hợp lỗi         | Hành động rollback                             |
| ---------------------- | ---------------------------------------------- |
| Service fail khởi động | Rollback image về phiên bản cũ                 |
| DB migration gây lỗi   | Rollback bằng `downgrade` script               |
| Audit log mất kết nối  | Chuyển sang log file tạm thời (buffered log)   |
| SMTP lỗi toàn cục      | Bật chế độ `dry-run` tạm thời để không mất log |

---

### 10.6. 📋 Checklist trước production

| Mục                                    | Xác nhận |
| -------------------------------------- | -------- |
| [ ] Đã kiểm tra healthcheck hoạt động  | ✅      |
| [ ] Metrics có hiển thị trên Grafana   | ✅      |
| [ ] Log gửi đúng audit format          | ✅      |
| [ ] Tenant có config riêng đầy đủ      | ✅      |
| [ ] Thử rollback không mất dữ liệu     | ✅      |
| [ ] Alert hoạt động đúng               | ✅      |

---

## 11. 🧩 Kiến trúc nội bộ

### 11.1. Mục tiêu phân lớp

Hệ thống được thiết kế theo hướng **module hóa rõ ràng**, tách biệt theo chức năng để dễ dàng mở rộng, kiểm thử và bảo trì.

| Lớp          | Trách nhiệm                                                           |
| ------------ | --------------------------------------------------------------------- |
| `consumer`   | Lắng nghe và xử lý sự kiện từ Pub/Sub hoặc message queue              |
| `processor`  | Thực thi nghiệp vụ gửi thông báo: tra template, render, gửi, fallback |
| `notifier`   | Adapter gửi thông báo thực tế (SMTP, SMS, Push...)                    |
| `repository` | Truy xuất & ghi dữ liệu từ/đến Postgres                               |
| `config`     | Tải & cache cấu hình riêng cho từng tenant                            |
| `audit`      | Gửi log kiểm toán (nếu được bật)                                      |
| `api`        | Cung cấp API nội bộ cho việc kiểm tra, gửi thử, quản trị template     |

---

### 11.2. Sơ đồ luồng xử lý nội bộ

```mermaid
flowchart TD
    PubSub[Event Listener]
    PubSub --> Parser[Parse + Validate Event]
    Parser --> TemplateLookup[Lookup Template]
    TemplateLookup --> RenderEngine[Render Template]
    RenderEngine --> Notifier[Send Notification]
    Notifier --> Audit[Log Audit]
    Notifier --> LogWriter[Ghi NotificationLog]

    subgraph Modules
      TemplateLookup
      RenderEngine
      Notifier
      Audit
      LogWriter
    end
```

---

### 11.3. Phân tích module chính

#### 🧩 `consumer/`

* Nhận sự kiện từ Pub/Sub
* Parse & validate schema (tuân theo `ADR-030`)
* Bắt đầu trace (`trace_id`)
* Gửi vào `processor`

#### 🧩 `processor/`

* Truy cập `tenant_id` để load cấu hình (`config/`)
* Gọi `template_repository` để tìm template khớp `event_code` + `channel`
* Render nội dung
* Gọi `notifier/` để gửi đi
* Ghi log + fallback nếu thất bại
* Gửi log audit nếu bật

#### 🧩 `notifier/`

* Có các adapter theo kênh:

  * `notifier/email.py`
  * `notifier/sms.py`
  * `notifier/push.py` *(chưa triển khai)*
* Giao diện thống nhất: `send(recipient, content, config)`

#### 🧩 `repository/`

* Truy cập Postgres: bảng `NotificationLog`, `Template`, `ChannelCfg`
* Được mock dễ dàng trong test

#### 🧩 `config/`

* Load cấu hình theo `tenant_id` từ Secret Manager / mount path
* Có cơ chế cache nội bộ (TTL: 5 phút)
* Tự invalid cache khi có sự kiện `config.updated`

#### 🧩 `audit/`

* Tạo cấu trúc audit log (tuân theo `ADR-008`)
* Gửi async sang `audit-logging-service`

#### 🧩 `api/`

* Expose REST API nội bộ:

  * `GET /notifications/logs`
  * `POST /notifications/test`
  * `GET /notifications/templates`

---

### 11.4. Logging & Tracing luồng nội bộ

* Mỗi bước trong luồng xử lý đều tạo 1 span nếu dùng OpenTelemetry
* Toàn bộ log theo chuẩn JSON và đính kèm:

  * `tenant_id`
  * `event_id`
  * `trace_id`
  * `template_id`
  * `channel`

---

### 11.5. Khả năng mở rộng & plugin

Hệ thống có thể dễ dàng mở rộng thêm kênh gửi mới:

| Kênh mới         | Cách mở rộng                                |
| ---------------- | ------------------------------------------- |
| Zalo             | Thêm `notifier/zalo.py` với hàm `send(...)` |
| App Notification | Tích hợp Firebase, dùng chung pipeline      |
| Tương tác voice  | Kết nối Twilio hoặc WebRTC SDK              |

---

## 12. 📚 Tài liệu liên quan

* [Interface Contract](./interface-contract.md)
* [Data Model](./data-model.md)
* [OpenAPI Spec](./openapi.yaml)
* [ADR-007 – RBAC Strategy](../../../ADR/adr-007-rbac.md)
* [ADR-008 – Audit Logging](../../../ADR/adr-008-audit-logging.md)
* [ADR-030 – Event Schema Governance](../../../ADR/adr-030-event-schema-governance.md)
* [Change Request 04 – Tenant Isolation](../../../requests/04-cr-tenant-system.md)
* [README.md – System Overview](../../../README.md)
* [RBAC Deep Dive](../../../architecture/rbac-deep-dive.md)
* [System Diagram](../../../architecture/system-diagrams.md)
