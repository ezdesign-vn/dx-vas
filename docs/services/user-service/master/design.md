---
title: User Service Master – Service Design Document
description: Service Design Document cho SPA quản trị hệ thống VAS DX
version: 1.1
author: DX VAS Team
last_updated: 2025-06-13
reviewed_by: Stephen Le
---
# 📘 User Service Master – Service Design Document

## 1. Mục đích (Scope)

User Service Master chịu trách nhiệm quản lý định danh người dùng toàn cục (`users_global`), danh sách tenant (`tenants`) và việc gán người dùng vào tenant cụ thể (`user_tenant_assignments`). Ngoài ra, service này cũng cung cấp các template RBAC toàn cục (`global_roles_templates`, `global_permissions_templates`) để các Sub User Service có thể đồng bộ và khởi tạo RBAC cục bộ cho từng tenant.

Service này là nền tảng cốt lõi cho toàn bộ hệ thống phân quyền đa tenant, đảm bảo tính nhất quán trong quản lý người dùng và hỗ trợ các luồng xác thực từ Auth Master/Sub.

### 🚫 Không chịu trách nhiệm (Out of Scope)

User Service Master **không** chịu trách nhiệm đối với các chức năng sau:

- ❌ Quản lý RBAC chi tiết ở cấp tenant (bao gồm roles, permissions, và user-role mapping cục bộ) – đây là trách nhiệm của Sub User Service tương ứng.
- ❌ Thực hiện xác thực người dùng (Google OAuth2, OTP, Local login) – do Auth Service Master/Sub xử lý.
- ❌ Lưu trữ hoặc xử lý các dữ liệu nghiệp vụ chi tiết của từng tenant (ví dụ: học sinh, giáo viên, lớp học, học phí...) – các adapter CRM/SIS/LMS đảm nhiệm phần này.
- ❌ Cung cấp các giao diện frontend – ví dụ Superadmin Webapp chỉ gọi API từ Gateway, chứ không truy cập trực tiếp vào service này.

---

## 2. Trách nhiệm chính (Responsibilities)

- Quản lý bảng định danh người dùng toàn hệ thống (`users_global`)
- Cho phép tạo, cập nhật, tra cứu thông tin người dùng toàn cục
- Quản lý danh sách tenant đang hoạt động và trạng thái
- Gán quyền người dùng vào các tenant cụ thể (`user_tenant_assignments`)
- Cung cấp bộ template `roles` và `permissions` dùng để seed xuống các tenant
- Phát sự kiện `user_created`, `tenant_user_assigned`, `rbac_template_updated` phục vụ Sub Services

---

## 3. Luồng nghiệp vụ chính (Business Flows)

### 🔹 Đăng nhập Google OAuth2 (qua Auth Master)
1. Auth Master xác thực thành công user Google → gọi `GET /users-global/by-email`
2. Nếu chưa tồn tại → gọi `POST /users-global` để tạo mới
3. Gọi `GET /user-tenant-assignments?user_id=...` để lấy danh sách tenant người dùng thuộc về
4. Người dùng chọn tenant → chuyển qua luồng Auth tiếp theo

### 🔹 Gán người dùng vào tenant
- Admin hệ thống (qua Superadmin Webapp) có thể gán người dùng vào 1 hoặc nhiều tenant
- Gọi `POST /user-tenant-assignments`
- Phát sự kiện `tenant_user_assigned` để Sub User Service tạo bản ghi cục bộ

#### 🔄 Luồng 1: Superadmin gán người dùng vào tenant

```mermaid
sequenceDiagram
    participant FE as Superadmin Webapp
    participant GW as API Gateway
    participant USM as User Service Master
    participant DB as PostgreSQL (users_global + user_tenant_assignments)
    participant PUB as Google Pub/Sub

    FE->>GW: POST /user-tenant-assignments
    GW->>USM: POST /user-tenant-assignments
    USM->>DB: Ghi user_id, tenant_id, role_codes vào bảng user_tenant_assignments
    USM-->>PUB: Phát sự kiện tenant_user_assigned (chứa user_id, tenant_id, role_codes)
    USM-->>GW: 200 OK (status: success)
    GW-->>FE: Hiển thị kết quả gán thành công
```

**📝 Giải thích chi tiết:**

1. Superadmin gửi yêu cầu gán người dùng (`user_id`) vào một `tenant_id`, kèm danh sách `role_codes`.
2. API Gateway định tuyến request tới User Service Master.
3. User Service Master ghi thông tin vào bảng `user_tenant_assignments`.
4. Sau khi ghi thành công, service phát một sự kiện `tenant_user_assigned` lên Pub/Sub, giúp Sub User Service của tenant tương ứng có thể đồng bộ RBAC.
5. Kết quả trả về cho frontend xác nhận hành động đã thành công.

**🔁 Trường hợp lỗi tiềm ẩn:**

* `user_id` không tồn tại trong `users_global` → 404.
* `tenant_id` không hợp lệ hoặc không tồn tại → 400.
* Lỗi logic: người dùng đã được gán vào tenant đó → 409 Conflict.

#### 🔐 Luồng 2: Đăng nhập Google OAuth2 – yêu cầu từ Auth Master

```mermaid
sequenceDiagram
    participant FE as Frontend (Superadmin Webapp)
    participant AuthM as Auth Service Master
    participant UserM as User Service Master

    FE->>AuthM: Đăng nhập Google (OAuth2)
    AuthM->>Google: Trao đổi token
    Google-->>AuthM: Trả về user info (email, name,...)

    AuthM->>UserM: GET /users-global/by-email?email=...
    alt Không tìm thấy
        AuthM->>UserM: POST /users-global (tạo user)
    end

    AuthM->>UserM: GET /user-tenant-assignments?user_id=...
    UserM-->>AuthM: Trả về danh sách tenant đã gán

    AuthM-->>FE: Trả về danh sách tenant để chọn
```

➡️ Sau bước này, AuthM sẽ tiếp tục gọi Sub User Service tương ứng để lấy RBAC và phát hành JWT.

---

#### 🧩 Luồng 3: Tạo/Cập nhật RBAC Template

```mermaid
sequenceDiagram
    participant FE as Superadmin Webapp
    participant Gateway as API Gateway
    participant UserM as User Service Master
    participant PubSub as GCP Pub/Sub

    FE->>Gateway: POST /rbac/templates (role/permission)
    Gateway->>UserM: POST /rbac/templates
    UserM->>DB: Tạo hoặc cập nhật bảng templates
    UserM->>PubSub: Publish event rbac_template_updated
    PubSub-->>SubUser: Trigger đồng bộ template
```

➡️ Các Sub User Service có thể tự đồng bộ hoặc hiển thị gợi ý cập nhật template.

---

#### 👤 Luồng 4: Sub Auth Service tạo user local mới và cấp `user_id_global`

```mermaid
sequenceDiagram
    participant AuthT as Sub Auth Service
    participant Gateway as API Gateway
    participant UserM as User Service Master

    AuthT->>Gateway: POST /users-global (tạo user local)
    Gateway->>UserM: POST /users-global
    UserM->>DB: Tạo user (auth_provider = 'local')
    UserM-->>Gateway: Trả về user_id_global
    Gateway-->>AuthT: Trả về user_id_global
```

➡️ AuthT sau đó sẽ gán user vào tenant của mình và phát hành JWT theo chuẩn đa tenant.

---

## 4. Mô hình dữ liệu

Các bảng chính do User Service Master quản lý bao gồm:

- `users_global`: danh sách người dùng toàn cục, gắn với auth_provider.
- `tenants`: thông tin từng tenant (trường thành viên).
- `user_tenant_assignments`: liên kết người dùng với từng tenant cụ thể.
- `global_roles_templates`: danh sách template vai trò toàn cục.
- `global_permissions_templates`: danh sách template quyền toàn cục.

### 🧩 Sơ đồ ERD tổng quan

```mermaid
erDiagram

    USERS_GLOBAL {
        UUID user_id PK
        TEXT full_name
        TEXT email
        TEXT auth_provider
    }

    TENANTS {
        TEXT tenant_id PK
        TEXT tenant_name
        TEXT status
    }

    USER_TENANT_ASSIGNMENTS {
        UUID id PK
        UUID user_id_global FK
        TEXT tenant_id FK
        TEXT role_codes
        BOOLEAN is_active
    }

    GLOBAL_ROLES_TEMPLATES {
        UUID template_id PK
        TEXT template_code
        TEXT description
    }

    GLOBAL_PERMISSIONS_TEMPLATES {
        UUID template_id PK
        TEXT permission_code
        TEXT action
        TEXT resource
        TEXT default_condition
    }

    USERS_GLOBAL ||--o{ USER_TENANT_ASSIGNMENTS : has
    TENANTS ||--o{ USER_TENANT_ASSIGNMENTS : includes
    GLOBAL_ROLES_TEMPLATES ||--o{ GLOBAL_PERMISSIONS_TEMPLATES : defines
```

📝 **Ghi chú quan trọng cho sơ đồ ERD:**

- `USER_TENANT_ASSIGNMENTS.role_codes`: Là một **mảng TEXT**. Mermaid không hỗ trợ kiểu `TEXT[]`, nên được ghi là `TEXT` cho đơn giản.
- `GLOBAL_PERMISSIONS_TEMPLATES.default_condition`: Là một **trường JSONB** dùng để định nghĩa điều kiện RBAC. Mermaid chỉ hỗ trợ `TEXT`, nên cần hiểu `TEXT default_condition` ở đây là biểu diễn của JSONB.
- `email`, `template_code`, `permission_code`: Có ràng buộc `UNIQUE` trong thiết kế thực tế – không thể hiện trong sơ đồ Mermaid nhưng được định nghĩa trong migration script hoặc tài liệu `data-model.md`.

👉 Xem chi tiết định nghĩa bảng tại: [`data-model.md`](./data-model.md)

---

## 5. API

User Service Master cung cấp các API phục vụ cho:

- Superadmin Webapp: quản lý định danh người dùng và RBAC toàn cục.
- Auth Service Master/Sub: tra cứu, tạo người dùng toàn cục.
- Sub User Service: đồng bộ danh sách assignment, template RBAC.

Chi tiết định nghĩa tham khảo tại [`interface-contract.md`](./interface-contract.md) và [`openapi.yaml`](./openapi.yaml).

### 📚 Bảng tóm tắt API chính

| Method | Path                          | Mô tả ngắn                                      | Yêu cầu quyền                     |
|--------|-------------------------------|------------------------------------------------|----------------------------------|
| GET    | `/users-global/by-email`      | Tra cứu người dùng toàn cục theo email         | Authenticated (Google)           |
| POST   | `/users-global`               | Tạo người dùng toàn cục mới                    | Authenticated (Google, OTP)      |
| GET    | `/tenants`                    | Liệt kê danh sách các tenant hiện có           | Superadmin                       |
| GET    | `/user-tenant-assignments`    | Tra cứu các tenant mà người dùng thuộc về      | Auth Service / Admin Tenant     |
| POST   | `/user-tenant-assignments`    | Gán người dùng vào tenant cụ thể               | Superadmin                       |
| GET    | `/global-roles-templates`     | Tra cứu template vai trò toàn cục              | Superadmin                       |
| POST   | `/global-roles-templates`     | Tạo mới template vai trò toàn cục              | Superadmin                       |
| GET    | `/global-permissions-templates` | Tra cứu template quyền toàn cục               | Superadmin                       |
| POST   | `/global-permissions-templates` | Tạo mới template quyền toàn cục               | Superadmin                       |

---

## 6. Sự kiện phát ra (Events)

User Service Master phát các sự kiện lên Google Cloud Pub/Sub để:

- Thông báo cho các Sub User Services về thay đổi RBAC.
- Cho phép các service khác đồng bộ định danh người dùng và cấu hình tenant.

### 📢 Danh sách sự kiện

#### 1. `tenant_user_assigned`

> Khi một người dùng được gán vào một tenant mới.

```json
{
  "event_id": "evt_7a3a8b40",
  "event_type": "tenant_user_assigned",
  "user_id_global": "usr_12345678",
  "tenant_id": "vas-truong-a",
  "role_codes": ["teacher", "homeroom"],
  "assignment_status": "active",
  "timestamp": "2025-06-01T08:30:00Z"
}
```

* **Consumer:** Sub User Service của tenant tương ứng
* **Tác dụng:** Tự động tạo `users_in_tenant` và mapping role cho user trong tenant đó
* **Yêu cầu idempotency:** Sub Service phải kiểm tra `event_id` hoặc `user_id + tenant_id` đã xử lý hay chưa.

---

#### 2. `rbac_template_updated`

> Khi một template vai trò hoặc quyền toàn cục được cập nhật.

```json
{
  "event_id": "evt_5baf6c2d",
  "event_type": "rbac_template_updated",
  "template_type": "permission",
  "template_id": "perm_tpl_001",
  "action": "create_or_update",
  "updated_by": "superadmin@vas.edu.vn",
  "timestamp": "2025-06-01T09:00:00Z"
}
```

* **Consumer:** Sub User Services có nhu cầu đồng bộ template
* **Tác dụng:** Cho phép Sub Service quyết định có nên cập nhật local template không (hoặc gợi ý cho admin cập nhật thủ công)
* **Gợi ý thực thi:** Có thể lưu lại trong bảng `rbac_template_sync_log` tại Sub Service để kiểm soát phiên bản.

---

## 7. 🔐 Bảo mật & Phân quyền

`user-service/master` xử lý thông tin định danh toàn cục (Global User Identity), do đó yêu cầu chính sách bảo mật và kiểm soát phân quyền chặt chẽ theo kiến trúc RBAC phân tầng (xem chi tiết tại [`rbac-deep-dive.md`](../../architecture/rbac-deep-dive.md)).

---

### 🛡️ 7.1. Authentication (Xác thực)

* Tất cả các endpoint đều yêu cầu **JWT access token hợp lệ**, do `auth-service/master` cấp phát.
* Token được xác thực tại API Gateway, sử dụng public key từ `JWKS` endpoint.
* Service không decode token mà dựa vào gateway để inject `X-User-ID`, `X-User-Role`, `X-Tenant-ID`.

---

### 🧩 7.2. Authorization (Phân quyền động)

* Hệ thống áp dụng **RBAC 3 tầng**: `global`, `tenant`, và `scoped-role`.
* Mỗi endpoint định nghĩa `x-required-permission`, ví dụ:

```yaml
x-required-permission: user.read:any
```

* Các permission được mapping theo bảng sau:

| Permission         | Mô tả                                 |
| ------------------ | ------------------------------------- |
| `user.read:any`    | Truy cập thông tin bất kỳ user nào    |
| `user.read:self`   | Truy cập chỉ thông tin của chính mình |
| `user.create`      | Tạo user mới toàn cục                 |
| `user.update:any`  | Sửa thông tin user bất kỳ             |
| `user.update:self` | Sửa thông tin của chính mình          |

---

### 🔐 7.3. Bảo vệ dữ liệu nhạy cảm

* Trường `password`, `token`, `email_verified_at` đều được bảo vệ:

  * `password` chỉ ghi, không bao giờ trả về (gắn `writeOnly: true`)
  * Email được xác minh ở `auth/master`, không lưu lại trong `user/master`
* Các trường có thể bị giới hạn truy cập tuỳ theo vai trò:

  * `internal_notes` chỉ hiện với `admin`, không hiện với `self`

---

### 🔁 7.4. Audit Logging

* Mọi thao tác ghi (`POST`, `PATCH`, `DELETE`) đều emit sự kiện audit:

  * `user.created`, `user.updated`, `user.merged`
* Log audit được gửi qua Pub/Sub → `audit-logging-service`, tuân thủ [ADR-008](../../../ADR/adr-008-audit-logging.md)

---

### 🔒 7.5. Internal Auth

* Các call nội bộ (ví dụ: từ `auth-service/master`) sử dụng `SERVICE_AUTH_TOKEN` và được kiểm tra tại gateway.
* Những API không dành cho public (seed role, fetch global profile) có gắn:

```yaml
x-internal-only: true
x-service-auth-required: true
```

---

### 🚫 7.6. Rate Limiting & Abuse Prevention

* Gateway cấu hình limit mặc định: `100 req/min/user`
* Các endpoint nhạy cảm (tìm theo email, tạo user) có thể gắn limit riêng.

---

## 8. ⚙️ Cấu hình & Triển khai

### 🔧 Biến môi trường

Service sử dụng cấu hình từ file `.env` (hoặc `settings/.env.<env>.template`) theo chuẩn hóa từ [ADR-005: Env Config](../../../ADR/adr-005-env-config.md). Một số biến chính:

| Tên biến               | Mô tả                                                                 | Ví dụ                            |
| ---------------------- | --------------------------------------------------------------------- | -------------------------------- |
| `ENVIRONMENT`          | Môi trường chạy (`local`, `staging`, `production`)                    | `staging`                        |
| `SERVICE_PORT`         | Cổng chạy service                                                     | `8000`                           |
| `DATABASE_URL`         | Kết nối PostgreSQL                                                    | `postgresql://user:pass@host/db` |
| `REDIS_URL`            | Kết nối Redis (cache session/token)                                   | `redis://localhost:6379/0`       |
| `SERVICE_AUTH_TOKEN`   | Token dùng để gọi nội bộ giữa các service (Auth Master → User Master) | `secret-key`                     |
| `JWT_PUBLIC_KEY`       | Public key để validate access token (dạng PEM)                        | –                                |
| `GOOGLE_CLOUD_PROJECT` | Project ID dùng cho Pub/Sub (nếu bật audit)                           | `dxvas-dev`                      |
| `LOG_LEVEL`            | Mức log (`DEBUG`, `INFO`, ...)                                        | `INFO`                           |

👉 Toàn bộ các biến được liệt kê và version hóa tại: `settings/.env.template`.

---

### 🛠 Cấu trúc thư mục cấu hình

```bash
settings/
├── .env.template              # Biến môi trường chuẩn (dùng cho mọi môi trường)
├── env.staging.yaml          # Override cho môi trường staging
├── env.production.yaml       # Override cho môi trường production
└── secrets.yaml              # Chỉ chứa key nhạy cảm, inject từ Vault/SecretManager
```

* Toàn bộ file `yaml` đều được load tự động bởi module config chuẩn trong `dx-core`.
* Secrets như `JWT_PRIVATE_KEY` KHÔNG được ghi trực tiếp vào `.env`, mà được mount vào volume hoặc lấy từ SecretManager (theo [ADR-003: Secrets](../../../ADR/adr-003-secrets.md)).

---

### 🚀 CI/CD & Triển khai

Tuân thủ [ADR-001: CI/CD Pipeline](../../../ADR/adr-001-ci-cd.md):

| Thành phần    | Công cụ                        | Ghi chú                                               |
| ------------- | ------------------------------ | ----------------------------------------------------- |
| Build & test  | GitHub Actions                 | `test.yaml`, `lint.yaml` trong `.github/workflows/`   |
| Build image   | Docker, Poetry                 | Image tối ưu từ `python:slim`, không include dev deps |
| Scan bảo mật  | `trivy`, `semgrep`             | Tích hợp vào CI                                       |
| Deploy        | ArgoCD                         | Tự động rollout nếu merge vào `main`                  |
| Observability | OpenTelemetry, Grafana, Sentry | Default gắn theo dx-core                              |
| Migration     | Alembic, trigger qua Argo Job  | Tách step migrate và deploy rõ ràng                   |

---

📌 Để chạy service cục bộ:

```bash
cp settings/.env.template .env
docker-compose up -d postgres redis
make run
```

---

## 9. 🧪 Chiến lược Test

Việc kiểm thử `user-service/master` được tổ chức theo **chiến lược kiểm thử đa tầng**, đảm bảo chất lượng từ mức độ logic nội bộ đến tích hợp liên service, đồng thời có thể chạy hiệu quả trong CI/CD pipeline.

---

### ✅ 9.1. Unit Test

* Phạm vi:

  * Xử lý logic nghiệp vụ: tạo user, validate dữ liệu, phân quyền động
  * Format hóa response và mã lỗi theo ADR-012
* Công cụ: `pytest + pytest-mock`
* Mỗi PR mới đều bắt buộc chạy qua test suite này trong GitHub Actions (`test.yaml`)
* Yêu cầu coverage ≥ **85%**

---

### ✅ 9.2. Contract Test (Consumer-Driven)

Tuân thủ [ADR-010: Contract Testing](../../../ADR/adr-010-contract-testing.md)

* Kiểm thử tương thích giữa `user-service/master` và các consumer (ví dụ: `auth/master`, `api-gateway`)
* Dùng `pact-python`, publish pact file lên `pact-broker`
* CI sẽ **fail nếu producer làm gãy contract**
* Bắt buộc có contract test cho các API:

  * `GET /users-global/{id}`
  * `POST /users-global`
  * `GET /users-global/by-email`

---

### ✅ 9.3. Integration Test (Service level)

* Spin-up toàn bộ stack (PostgreSQL, Redis, user-service) trong Docker Compose
* Chạy các test query + mutation logic đầy đủ (bao gồm validate RBAC, phân quyền)
* Dùng `httpx` hoặc `pytest-httpx` để test end-to-end response format
* Đảm bảo emit đúng các sự kiện (`user.created`, `user.duplicated`, `user.updated`) qua Pub/Sub mock

---

### ✅ 9.4. Load & Performance Test (Tùy chọn)

* Dùng `locust` hoặc `k6` để test throughput của các API truy xuất hàng loạt (pagination, filter)
* Ước lượng ngưỡng tối ưu: 1000 req/s với latency P95 < 200ms
* Giúp tune indexing, limit-offset, caching Redis user\_id → full profile

---

### ✅ 9.5. Security Test

* `pytest` với các case đặc biệt: không có token, token sai scope, sai tenant
* Kết hợp `semgrep` để phát hiện hardcoded secrets, lỗi injection
* Test `user.read:self` vs `user.read:any` để xác minh phân quyền động

---

### 🧪 Báo cáo & Tích hợp CI

* Test chạy qua `make test`, `make test-contract`, `make test-int`
* Kết quả publish lên `coverage.xml`, `junit.xml`, tích hợp GitHub Checks
* Pact Broker: `https://pact.dxvas.vn`
* Allure Report: Tùy chọn publish khi chạy full test suite

> 🧠 Mọi kịch bản test cần bao gồm trường hợp thành công, lỗi logic, và lỗi hệ thống (timeout, lỗi DB, lỗi Pub/Sub...).

---

## 10. 📈 Quan sát & Giám sát

Hệ thống quan sát (observability) của `user-service/master` giúp đảm bảo khả năng phát hiện lỗi sớm, đo lường sức khỏe hệ thống và hỗ trợ phân tích hành vi người dùng phục vụ vận hành đa tenant hiệu quả.

---

### 📊 10.1. Logging

* **Chuẩn log JSON** theo `dx-core`, định dạng:
  `{ timestamp, level, service, trace_id, span_id, user_id, tenant_id, msg, extra... }`
* Tích hợp OpenTelemetry để đính kèm `trace_id`, `span_id` theo chuẩn OTEL.
* Log được gửi về:

  * Dev: `stdout` → Loki/Grafana
  * Prod: GCP Logging hoặc OpenObserve

| Level   | Mục đích                                    |
| ------- | ------------------------------------------- |
| `INFO`  | Thao tác thông thường                       |
| `WARN`  | Thao tác sai, không làm crash               |
| `ERROR` | Exception, database lỗi, sự cố nghiêm trọng |
| `DEBUG` | Gỡ lỗi (chỉ bật khi local/dev)              |

---

### 📈 10.2. Metrics

* Sử dụng `Prometheus` exporter thông qua `dx-core.metrics`.
* Một số metrics quan trọng:

| Metric                            | Loại      | Nhãn                 | Ghi chú                        |
| --------------------------------- | --------- | -------------------- | ------------------------------ |
| `http_requests_total`             | Counter   | path, method, status | Tổng số request                |
| `http_request_duration_seconds`   | Histogram | path, method         | Độ trễ                         |
| `user_create_success_total`       | Counter   | tenant\_id           | Tạo user thành công            |
| `user_lookup_by_email_miss_total` | Counter   | –                    | Không tìm thấy user theo email |
| `db_query_duration_seconds`       | Histogram | model, operation     | Theo dõi hiệu năng DB          |

---

### 🔐 10.3. Audit Logging

Tuân thủ [ADR-008](../../../ADR/adr-008-audit-logging.md):

* Emit các sự kiện audit dạng Pub/Sub:

  * `user.created`
  * `user.updated`
  * `user.duplicated`
* Mỗi event bao gồm: `actor_id`, `target_user_id`, `tenant_id`, `action`, `changes`
* Được forward sang `audit-logging-service` để lưu DB riêng (GCP BigQuery hoặc PostgreSQL phân vùng)

* Tất cả các thao tác thay đổi dữ liệu liên quan đến người dùng và tenant đều được ghi lại thông qua Audit Logging Service, bao gồm:

    - `user.created`, `user.updated`, `user.deleted`
    - `user_tenant_assignment.created`
    - `tenant.created`, `tenant.status_changed`
    - `role_template.updated`, `permission_template.updated`

* Log bao gồm:
    - `actor_id`, `tenant_id`, `action`, `target_table`, `before`, `after`, `timestamp`
    - Request `X-Request-ID` để truy vết qua toàn hệ thống

---

### 💰 10.4. Cost Observability (Billing)

Áp dụng [ADR-020](../../../ADR/adr-020-cost-observability.md):

* Tự động emit sự kiện `usage.user.query` và `usage.user.create`
* Hỗ trợ billing theo số lần truy cập dữ liệu `global user` của mỗi tenant
* Các service khác (như SIS, CRM) có thể tích hợp các sự kiện này để ước lượng chi phí

---

### 🧪 10.5. Health Check & Alert

* Endpoint: `GET /healthz` (có thể bổ sung `/readyz`)
* Tích hợp:

  * Argo Rollout → kiểm tra trước khi scale
  * GCP Cloud Monitoring → alert theo latency và error rate

---

## 11. 🚀 Độ tin cậy & Phục hồi

`user-service/master` đóng vai trò then chốt trong hệ thống định danh toàn cục, do đó được thiết kế với mục tiêu **khả dụng cao (HA)**, đảm bảo **không mất dữ liệu** và **không gián đoạn khi cập nhật**.

---

### 🧱 11.1. Triển khai không gián đoạn (Zero Downtime)

Tuân thủ [ADR-014: Zero Downtime](../../../ADR/adr-014-zero-downtime.md):

* Sử dụng chiến lược rollout `blue-green` hoặc `canary` qua Argo Rollouts.
* Endpoint `GET /healthz` + probe readiness kiểm tra DB + Redis + Pub/Sub.
* Thực hiện shadow traffic test trước khi 100% chuyển route.

---

### ⚙️ 11.2. Chính sách triển khai

Theo [ADR-015: Deployment Strategy](../../../ADR/adr-015-deployment-strategy.md) và [ADR-018: Release Approval](../../../ADR/adr-018-release-approval-policy.md):

* Mọi release đều yêu cầu:

  * Pass CI (`unit`, `contract`, `integration`)
  * Được duyệt bởi reviewer kỹ thuật
  * Gắn tag version (`v2.x.x`)
* Tự động deploy nếu PR merge vào `main` và có tag.

---

### ♻️ 11.3. Auto Scaling

Tuân thủ [ADR-016: Auto Scaling](../../../ADR/adr-016-auto-scaling.md):

* Sử dụng HPA (Horizontal Pod Autoscaler) theo:

  * CPU: ≥ 70%
  * Request QPS: ≥ 500 req/s
* Giới hạn min 2 replica, max 10 (có thể override theo tenant load)

---

### 💾 11.4. Dự phòng dữ liệu & recovery

* Toàn bộ dữ liệu lưu tại PostgreSQL phân vùng theo tenant\_id.
* Backup qua Cloud SQL export định kỳ (6 giờ/lần).
* Mỗi thay đổi người dùng đều phát `user.updated` → có thể sync vào hệ thống phụ như CRM/LMS/SIS để đảm bảo redundancy.

---

### ⚡ 11.5. Retry & Timeouts

* Giao tiếp nội bộ giữa services có timeout 3s + retry 2 lần (exponential backoff).
* Nếu `user.master` không phản hồi:

  * Gateway trả lỗi `503` với mã `user.service_unavailable`
  * Ghi log + emit alert

---

### 🔄 11.6. Rollback & Observability

* Nếu rollout lỗi (readiness probe fail > 20s), tự động rollback về version trước.
* Tích hợp OpenTelemetry để debug lỗi multi-hop: từ gateway → auth → user.

---

## 12. ⚡️ Hiệu năng & Khả năng mở rộng

`user-service/master` được thiết kế để phục vụ truy vấn user toàn cục đa tenant, với khả năng scale linh hoạt và đáp ứng hàng triệu bản ghi. Mọi thành phần từ lưu trữ, cache đến API đều được tối ưu để đảm bảo throughput cao, latency thấp và hỗ trợ mở rộng theo chiều ngang.

---

### ⚡ 12.1. Truy vấn tối ưu & indexing

* Các API thường xuyên sử dụng như:

  * `GET /users-global/by-email`
  * `GET /users-global/by-phone`
  * `GET /users-global/{id}`
    đều được tối ưu thông qua **index phức hợp** (`email, tenant_id`, `phone_number, tenant_id`).
* Cơ chế filter sử dụng `tenant_id` như điều kiện bắt buộc để đảm bảo query nhanh và cách ly dữ liệu.

---

### 🧠 12.2. Caching thông minh

* Redis layer để cache các bản ghi người dùng phổ biến (dựa vào LRU hoặc Top-K queries).
* TTL mặc định: 15 phút. Có cơ chế invalidate khi có `user.updated`.
* Dữ liệu cache:

  * `user_id → profile`
  * `email/phone → user_id`
* Cơ chế warming cache khi khởi động để tăng cold-start performance.

---

### 🚀 12.3. Hỗ trợ phân trang lớn (deep pagination)

* Dùng cơ chế **seek-based pagination** (trang theo `created_at` hoặc `user_id`) để tránh hiệu năng kém khi offset lớn.
* Default limit: 20. Max limit: 1000.
* Có hỗ trợ cả offset pagination cho use-case quản trị viên.

---

### ⚙️ 12.4. Horizontal Scaling

* Service stateless → có thể scale theo replica (tuân thủ [ADR-016](../../../ADR/adr-016-auto-scaling.md))
* Redis + PostgreSQL có thể tách cụm theo workload:

  * Redis: scale theo số lượng hot user
  * Postgres: có thể sharding theo `tenant_id` nếu vượt quá ngưỡng

---

### 📉 12.5. Theo dõi hiệu năng

* Metrics Prometheus:

  * `http_request_duration_seconds`
  * `user.lookup_latency_p95`
  * `db_user_query_duration_seconds`
* Cảnh báo nếu:

  * `P95 > 200ms` trong 5 phút
  * `cache_miss_rate > 30%` trong 10 phút

---

### 🧪 12.6. Benchmark & Load test

* Dùng `k6` để test với 1 triệu user, 1000 req/s trong 10 phút:

  * `P95 < 150ms`, `success_rate > 99.9%`
* Test profile:

  * 90% `GET`
  * 8% `POST`
  * 2% `PATCH`

---

## 13. 🧩 Kiến trúc Service

`user-service/master` là một thành phần **core multi-tenant**, chịu trách nhiệm quản lý danh tính toàn cục cho người dùng trên toàn hệ thống VAS, bao gồm: ID định danh, tài khoản gốc, và thông tin liên kết giữa người dùng với các tenant. Service này hoạt động độc lập với các sub-service tenant-specific, và là nguồn dữ liệu gốc phục vụ `auth-service/master`, `token-service` và hệ thống SMS mới tích hợp.

---

### 🧭 13.1. Sơ đồ kiến trúc cập nhật (tuân CR-04)

```mermaid
flowchart TD
  subgraph Core Services
    GATEWAY[API Gateway]
    AUTH_MASTER[Auth Service - Master]
    USER_MASTER[User Service - Master]
    TOKEN[Token Service]
    AUDIT[Audit Logging Service]
  end

  subgraph Data Layer
    PG_GLOBAL[(PostgreSQL - Global)]
    REDIS[(Redis)]
  end

  subgraph Tenant System
    SMS[(School Management System)]
  end

  GATEWAY -->|JWT + RBAC + X-Tenant-ID| AUTH_MASTER
  GATEWAY -->|RBAC + Route| USER_MASTER

  AUTH_MASTER -->|Lookup user| USER_MASTER
  USER_MASTER -->|Read/write| PG_GLOBAL
  USER_MASTER -->|Cache email/user_id| REDIS
  USER_MASTER -->|Emit user.created/updated| PUBSUB[(Pub/Sub)]
  USER_MASTER --> AUDIT

  PUBSUB --> SMS
```

---

### 🧩 13.2. Thành phần chính

| Thành phần            | Vai trò                                                   |
| --------------------- | --------------------------------------------------------- |
| `FastAPI`             | Framework triển khai HTTP API                             |
| `PostgreSQL` (global) | Lưu trữ chính thông tin người dùng toàn cục               |
| `Redis`               | Tăng tốc truy xuất `email → user_id`, `user_id → profile` |
| `Pub/Sub`             | Phát sự kiện cho các hệ thống downstream như `SMS`        |
| `Audit Logging`       | Ghi nhận thay đổi user phục vụ kiểm tra và compliance     |

---

### ⚙️ 13.3. Cấu trúc thư mục

```bash
user-service/
├── main.py                  # Entry point chính
├── api/                     # Router FastAPI
│   ├── global_users.py      # Định nghĩa endpoint /users-global/*
├── models/                  # ORM models
├── schemas/                 # Request/response schemas
├── services/                # Business logic: user creation, update, conflict detection
├── events/                  # Emit Pub/Sub events
├── core/                    # Cấu hình, middleware, utils
└── tests/                   # Kiểm thử unit & integration
```

---

### 🔄 13.4. Giao tiếp & tích hợp

| Dịch vụ                 | Mục đích                                                                       |
| ----------------------- | ------------------------------------------------------------------------------ |
| `auth-service/master`   | Xác thực người dùng, gọi `GET /users-global/by-email`                          |
| `token-service`         | Cung cấp JWT token với `user_id` toàn cục                                      |
| `API Gateway`           | Áp dụng RBAC & inject các header (`X-User-ID`, `X-Permissions`, `X-Tenant-ID`) |
| `SMS (Tenant)`          | Tiêu thụ sự kiện `user.created`, `user.updated` để sync user profile           |
| `audit-logging-service` | Nhận log từ mọi hành động cập nhật, tạo user                                   |

---

### 📣 13.5. Các sự kiện phát ra

Tuân chuẩn định danh sự kiện từ \[ADR-030: Event Schema Governance]:

| Sự kiện           | Khi nào phát                            | Payload                                      |
| ----------------- | --------------------------------------- | -------------------------------------------- |
| `user.created`    | Khi tạo user mới toàn cục               | `{ user_id, email, created_by, timestamp }`  |
| `user.updated`    | Khi cập nhật thông tin người dùng       | `{ user_id, fields_changed, updated_by }`    |
| `user.duplicated` | Khi phát hiện trùng thông tin định danh | `{ conflict_user_ids, resolution_strategy }` |

---

## 14. Tài liệu liên quan

| Tên tài liệu                                | Mô tả ngắn gọn                                                                 |
|---------------------------------------------|--------------------------------------------------------------------------------|
| [rbac-deep-dive.md](../../../architecture/rbac-deep-dive.md) | Mô tả chi tiết kiến trúc RBAC, các bảng liên quan và sơ đồ quyền              |
| [adr-007-rbac.md](../../../ADR/adr-007-rbac.md)     | Quyết định thiết kế kiến trúc RBAC phân tầng theo mô hình Master-Sub          |
| [adr-006-auth-strategy.md](../../../ADR/adr-006-auth-strategy.md) | Mô tả chiến lược xác thực, JWT và vai trò của User Service Master/Sub         |
| [Data Model](./data-model.md)             | Chi tiết các bảng CSDL được quản lý bởi User Service Master                  |
| [Interface Contract](./interface-contract.md) | Hợp đồng API định nghĩa rõ input/output, auth, mã lỗi của các endpoint       |
| [OpenAPI](./openapi.yaml)               | File đặc tả OpenAPI kỹ thuật dùng để tạo SDK/Client/Docs tự động             |
| [system-diagrams.md](../../../architecture/system-diagrams.md) | Sơ đồ kiến trúc tổng thể hệ thống, các service và dòng tương tác             |
| [README.md](../../../README.md)              | Tài liệu kiến trúc tổng quan, mục tiêu tổng thể và các nguyên lý thiết kế     |
