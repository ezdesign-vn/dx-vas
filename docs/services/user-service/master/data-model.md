---
title: User Service Master - Data Model
description: Service Design Document cho SPA quản trị hệ thống VAS DX
version: 1.0
author: DX VAS Team
last_updated: 2025-05-23
reviewed_by: Stephen Le
---
# User Service Master - Data Model

## 1. Giới thiệu

Tài liệu này mô tả chi tiết mô hình dữ liệu của **User Service Master** – một trong những thành phần cốt lõi của hệ thống `dx-vas` theo kiến trúc **multi-tenant**. Service này chịu trách nhiệm quản lý **định danh toàn cục người dùng**, **thông tin tenant**, và **mẫu vai trò/quyền toàn cục (RBAC templates)**.

## 2. Phạm vi

User Service Master bao gồm:

- Quản lý người dùng toàn hệ thống (`users_global`).
- Quản lý danh sách tenant (`tenants`) và trạng thái của tenant.
- Quản lý việc gán người dùng vào tenant (`user_tenant_assignments`).
- Cung cấp mẫu vai trò (`global_roles_templates`) và mẫu quyền (`global_permissions_templates`) dùng chung cho các tenant.
- Phát sự kiện tới các Sub User Services hoặc các service khác khi có thay đổi liên quan đến định danh hoặc template RBAC.

## 3. Không bao gồm (Out of Scope)

User Service Master **không** chịu trách nhiệm:

- Quản lý người dùng nội bộ của từng tenant – việc này thuộc về **Sub User Service**.
- Quản lý quyền cụ thể (`roles`, `permissions`, `mappings`) ở cấp tenant.
- Xử lý xác thực đăng nhập người dùng (Google OAuth2, OTP, Local login) – thuộc về **Auth Services**.
- Ghi log audit chi tiết từng thay đổi (nếu audit được xử lý bởi service riêng).

## 4. Mục tiêu

- Trình bày cấu trúc các bảng dữ liệu cốt lõi của User Service Master.
- Mô tả các ràng buộc dữ liệu (constraints), khóa chính/ngoại, chỉ mục.
- Hỗ trợ cho quá trình phát triển backend, viết OpenAPI, migration, testing và bảo trì.
- Làm nền tảng để đồng bộ schema với tài liệu `interface-contract.md`, `openapi.yaml`, và các ADR liên quan (như ADR-007, ADR-025).

---

## 5. Các bảng chính và phân nhóm logic

Dưới đây là danh sách các bảng chính trong cơ sở dữ liệu của **User Service Master**, được chia thành 3 nhóm logic rõ ràng:

---

### 🔹 Nhóm A – Định danh người dùng và phân quyền toàn cục

| Tên bảng                 | Vai trò chính                                                                 |
|--------------------------|------------------------------------------------------------------------------|
| `users_global`           | Lưu trữ thông tin định danh người dùng toàn cục.                             |
| `tenants`                | Lưu trữ thông tin các tenant trong hệ thống.                                 |
| `user_tenant_assignments`| Mapping giữa người dùng toàn cục và các tenant, kèm trạng thái.              |

---

### 🔹 Nhóm B – Template RBAC dùng chung

| Tên bảng                       | Vai trò chính                                                                 |
|--------------------------------|------------------------------------------------------------------------------|
| `global_roles_templates`       | Danh sách vai trò mẫu dùng để khởi tạo RBAC trong mỗi tenant.               |
| `global_permissions_templates` | Danh sách quyền mẫu, gắn với role templates.                                |

---

### 🔹 Nhóm C – Hỗ trợ & Mở rộng (tuỳ chọn)

| Tên bảng              | Vai trò chính                                                                 |
|-----------------------|------------------------------------------------------------------------------|
| `processed_events`    | Lưu các `event_id` đã xử lý (idempotency khi nhận lại message Pub/Sub).     |
| `audit_log_users_master` | (Tuỳ chọn) Lưu log audit các thao tác trong User Service Master.           |

> 🔍 Ghi chú:
> - Các bảng ở Nhóm A là bắt buộc và trung tâm của toàn bộ service.
> - Nhóm B hỗ trợ việc chuẩn hoá và đồng bộ RBAC giữa Master và Sub User Service.
> - Nhóm C phục vụ khả năng mở rộng, theo dõi và debug nếu cần.

---

## 6. Chi tiết bảng: `users_global`

### 🧾 Mục đích
Bảng `users_global` lưu trữ thông tin định danh cốt lõi của người dùng trong toàn bộ hệ thống. Đây là nơi duy nhất lưu thông tin người dùng cấp toàn cục, bất kể họ thuộc tenant nào.

---

### 📜 Câu lệnh `CREATE TABLE`

```sql
CREATE TABLE users_global (
  user_id UUID PRIMARY KEY,                         -- 🔑 ID định danh toàn cục
  full_name TEXT NOT NULL,                          -- Họ tên người dùng
  email TEXT NOT NULL,                              -- Email (dùng cho xác thực OAuth2 hoặc liên hệ)
  phone TEXT,                                       -- Số điện thoại (nếu có)
  auth_provider TEXT NOT NULL,                      -- Hệ thống xác thực (e.g., "google", "local", "zalo")
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,    -- Thời điểm tạo
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,    -- Thời điểm cập nhật gần nhất

  UNIQUE (email, auth_provider),                    -- 🔐 Mỗi email chỉ được dùng một lần trong cùng một hệ thống xác thực
  CHECK (auth_provider IN ('google', 'local', 'zalo'))  -- 🛡️ Ràng buộc giá trị hợp lệ
);
```

---

### 🧩 Giải thích cột

| Cột           | Kiểu dữ liệu | Ý nghĩa                                                            |
|---------------|--------------|---------------------------------------------------------------------|
| `user_id`     | UUID         | Khóa chính toàn cục, dùng để liên kết với tất cả bảng khác         |
| `full_name`   | TEXT         | Tên đầy đủ của người dùng                                          |
| `email`       | TEXT         | Email người dùng – duy nhất trong phạm vi `auth_provider`          |
| `phone`       | TEXT         | Số điện thoại (tùy chọn)                                           |
| `auth_provider` | TEXT       | Hệ thống xác thực (OAuth2, OTP local...)                           |
| `created_at`  | TIMESTAMPTZ  | Thời điểm tạo bản ghi                                              |
| `updated_at`  | TIMESTAMPTZ  | Thời điểm cập nhật cuối cùng                                       |

---

### 🔗 Liên kết & Chỉ số

- ✅ **Unique Constraint:** `(email, auth_provider)` giúp hỗ trợ nhiều provider nhưng vẫn đảm bảo tính duy nhất.
- 📌 **Index khuyến nghị:** tạo thêm index trên `(auth_provider, email)` để tối ưu tra cứu khi đăng nhập.
- 🧩 **Mối liên hệ:** `user_id` được tham chiếu bởi:
    - `user_tenant_assignments.user_id_global`
    - `audit_log_users_master.actor_id` (nếu có)
    - Các bảng Sub User Service: `users_in_tenant.user_id_global`

---

## 7. Chi tiết bảng: `tenants`

### 🧾 Mục đích
Bảng `tenants` lưu thông tin nhận diện các tenant (trường thành viên) trong hệ thống. Mỗi tenant tương ứng với một trường hoặc tổ chức riêng biệt, có hệ thống phụ trợ riêng (Sub Services).

---

### 📜 Câu lệnh `CREATE TABLE`

```sql
CREATE TABLE tenants (
  tenant_id TEXT PRIMARY KEY,                          -- 🔑 Mã định danh duy nhất cho tenant (ví dụ: "va_camau")
  tenant_name TEXT NOT NULL,                           -- Tên hiển thị của tenant
  status TEXT NOT NULL DEFAULT 'active',               -- Trạng thái: active, suspended, deleted...
  logo_url TEXT,                                       -- Logo đại diện (tùy chọn)
  project_id TEXT,                                     -- GCP Project ID gắn với tenant này (nếu có)
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  CHECK (status IN ('active', 'suspended', 'deleted')) -- 🛡️ Trạng thái hợp lệ
);
```

---

### 🧩 Giải thích cột

| Cột          | Kiểu dữ liệu | Ý nghĩa                                                           |
|--------------|--------------|--------------------------------------------------------------------|
| `tenant_id`  | TEXT         | Mã định danh duy nhất cho tenant (viết thường, snake_case)        |
| `tenant_name`| TEXT         | Tên đầy đủ, thân thiện với người dùng                              |
| `status`     | TEXT         | Trạng thái hoạt động của tenant (`active`, `suspended`, `deleted`)|
| `logo_url`   | TEXT         | Link logo (nếu có), dùng cho hiển thị branding                    |
| `project_id` | TEXT         | GCP Project ID nếu mỗi tenant có stack riêng biệt                 |
| `created_at` | TIMESTAMPTZ  | Thời điểm tạo                                                    |
| `updated_at` | TIMESTAMPTZ  | Thời điểm cập nhật cuối cùng                                     |

---

### 🔗 Liên kết & Chỉ số

- 📌 **Tenant ID** sẽ được tham chiếu bởi:
    - `user_tenant_assignments.tenant_id`
    - Sub services dùng để định tuyến và phân quyền
- ✅ **Index khuyến nghị:** index trên `status` để lọc nhanh các tenant đang hoạt động

---

## 8. Chi tiết bảng: `user_tenant_assignments`

### 🧾 Mục đích
Bảng `user_tenant_assignments` lưu thông tin người dùng nào được gán vào tenant nào. Đây là cầu nối giữa `users_global` và các tenant, xác định quyền truy cập của một người dùng toàn cục vào tenant cụ thể.

---

### 📜 Câu lệnh `CREATE TABLE`

```sql
CREATE TABLE user_tenant_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),       -- 🔑 ID duy nhất cho mỗi lần gán
  user_id_global UUID NOT NULL REFERENCES users_global(user_id), -- 🔗 Người dùng toàn cục
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id),         -- 🔗 Tenant được gán
  assignment_status TEXT NOT NULL DEFAULT 'active',     -- Trạng thái: active, revoked
  assigned_at TIMESTAMPTZ DEFAULT now() NOT NULL,       -- ⏱️ Thời điểm gán
  updated_at TIMESTAMPTZ,                               -- ⏱️ Thời điểm hủy gán (nếu có)
  assigned_by UUID,                                     -- 🔗 Người gán (user_id_global) – thường là Superadmin
  UNIQUE (user_id_global, tenant_id),                   -- 🛡️ Không thể gán trùng người dùng vào cùng tenant
  CHECK (assignment_status IN ('active', 'revoked'))
);
```

---

### 🧩 Giải thích cột

| Cột                | Kiểu dữ liệu | Ý nghĩa                                                                 |
|--------------------|--------------|-------------------------------------------------------------------------|
| `id`               | UUID         | ID duy nhất cho bản ghi (dùng cho tra cứu, cập nhật trạng thái)        |
| `user_id_global`   | UUID         | Người dùng toàn cục được gán vào tenant này                            |
| `tenant_id`        | TEXT         | Tenant cụ thể                                                           |
| `assignment_status`| TEXT         | Trạng thái hiện tại: active / revoked                                  |
| `assigned_at`      | TIMESTAMPTZ  | Thời điểm thực hiện gán                                                |
| `updated_at`       | TIMESTAMPTZ  | Thời điểm hủy quyền truy cập (nếu có)                                  |
| `assigned_by`      | UUID         | ID của user thực hiện thao tác gán (thường là superadmin)              |

---

### 🔗 Liên kết & Chỉ số

- 🔁 Dùng để xác định quyền truy cập tenant khi người dùng đăng nhập (Auth Service)
- 🧠 Gateway có thể cache `user_id_global` ↔ danh sách `tenant_id` để tối ưu hiệu suất
- ✅ Cần index trên `user_id_global`, `tenant_id`, và `assignment_status` cho tra cứu nhanh

---

### 📤 Sự kiện phát ra

- `tenant_user_assigned`: Khi một user được gán vào tenant (assignment mới)
- `tenant_user_revoked`: Khi quyền truy cập của user vào tenant bị hủy (status chuyển sang `revoked`)

---

## 9. Chi tiết bảng: `global_roles_templates`

### 🧾 Mục đích
Bảng `global_roles_templates` định nghĩa các mẫu vai trò dùng chung toàn hệ thống, do Superadmin quản lý. Các Sub User Service sẽ dựa vào các mẫu này để tạo các vai trò tương ứng cho từng tenant.

---

### 📜 Câu lệnh `CREATE TABLE`

```sql
CREATE TABLE global_roles_templates (
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- 🔑 ID duy nhất cho role template
  template_code TEXT UNIQUE NOT NULL,                     -- 🏷️ Mã định danh duy nhất (ví dụ: teacher, accountant)
  description TEXT,                                       -- 📘 Mô tả vai trò
  is_default BOOLEAN DEFAULT false,                       -- ✅ Có phải vai trò mặc định không?
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,          -- 🕓 Thời điểm tạo
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL           -- 🕓 Thời điểm cập nhật cuối
);
```

---

### 🧩 Giải thích cột

| Cột            | Kiểu dữ liệu | Ý nghĩa                                                         |
|----------------|--------------|-----------------------------------------------------------------|
| `template_id`  | UUID         | ID duy nhất                                                     |
| `template_code`| TEXT         | Mã vai trò toàn cục (sẽ được clone sang mỗi tenant nếu cần)     |
| `description`  | TEXT         | Mô tả vai trò (ví dụ: "Giáo viên cấp 1", "Kế toán học phí")     |
| `is_default`   | BOOLEAN      | Có phải là vai trò mặc định khi tạo tenant mới không            |
| `created_at`   | TIMESTAMPTZ  | Thời điểm tạo                                                   |
| `updated_at`   | TIMESTAMPTZ  | Thời điểm cập nhật gần nhất                                     |

---

### 🔗 Liên kết & Sử dụng

- 🌍 Là nguồn dữ liệu để clone role sang các tenant mới tạo (bởi Sub User Service)
- 🧠 Dữ liệu này được quản lý và cập nhật bởi Superadmin thông qua API `/rbac/templates/roles`
- 🔒 Không được sửa trực tiếp tại Sub Services – đảm bảo chuẩn RBAC toàn hệ thống

---

### 📤 Sự kiện phát ra

- `rbac_role_template_created`
- `rbac_role_template_updated`
- `rbac_role_template_deleted`

---

## 10. Chi tiết bảng: `global_permissions_templates`

### 🧾 Mục đích
Bảng `global_permissions_templates` định nghĩa các quyền (permission) dùng toàn cục, được gán vào các role template trong bảng `global_roles_templates`. Sub User Service sẽ clone các permission này để áp dụng cục bộ cho từng tenant.

---

### 📜 Câu lệnh `CREATE TABLE`

```sql
CREATE TABLE global_permissions_templates (
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- 🔑 ID của permission template
  permission_code TEXT UNIQUE NOT NULL,                   -- 🏷️ Mã định danh quyền
  action TEXT NOT NULL,                                   -- 🛠️ Hành động (ví dụ: view, edit)
  resource TEXT NOT NULL,                                 -- 📁 Tài nguyên bị tác động (ví dụ: users, roles)
  default_condition JSONB,                                -- 🔄 Điều kiện áp dụng mặc định (nếu có)
  description TEXT,                                        -- 📘 Mô tả quyền
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,          -- 🕓 Thời điểm tạo
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL           -- 🕓 Thời điểm cập nhật cuối
);
```

---

### 🧩 Giải thích cột

| Cột                | Kiểu dữ liệu | Ý nghĩa                                                                 |
|--------------------|--------------|-------------------------------------------------------------------------|
| `template_id`      | UUID         | ID duy nhất của template                                                |
| `permission_code`  | TEXT         | Mã định danh duy nhất cho permission toàn cục                          |
| `action`           | TEXT         | Hành động như `view`, `edit`, `create`, `delete`, v.v.                  |
| `resource`         | TEXT         | Tên tài nguyên bị kiểm soát (ví dụ: `users`, `tenants`, `roles`)        |
| `default_condition`| JSONB        | Điều kiện áp dụng mặc định, ví dụ `{"owner_only": true}`               |
| `description`      | TEXT         | Mô tả quyền, thường để hiển thị cho Superadmin khi cấu hình            |
| `created_at`       | TIMESTAMPTZ  | Thời điểm tạo                                                          |
| `updated_at`       | TIMESTAMPTZ  | Thời điểm cập nhật gần nhất                                            |

---

### 🔗 Liên kết & Sử dụng

- 🔧 Được sử dụng để sinh ra các `permissions_in_tenant` trong từng Sub User Service
- 📌 Gắn với `global_roles_templates` thông qua bảng quan hệ trung gian `global_role_permission_templates` (có thể mở rộng)
- 🔐 Không chỉnh sửa trực tiếp trong tenant, đảm bảo chuẩn hóa cấu trúc quyền

---

### 📤 Sự kiện phát ra

- `rbac_permission_template_created`
- `rbac_permission_template_updated`
- `rbac_permission_template_deleted`

---

## 11. Các bảng phụ trợ & phụ lục

---

### 🔄 Bảng: `processed_events`

#### 📌 Mục đích
Ghi lại các sự kiện đã xử lý để đảm bảo tính idempotent trong hệ thống Event-Driven (ví dụ: khi nhận lại cùng một sự kiện từ Pub/Sub).

```sql
CREATE TABLE processed_events (
  event_id UUID PRIMARY KEY,              -- 🔑 ID duy nhất của sự kiện
  service_name TEXT NOT NULL,             -- 🧭 Tên service xử lý sự kiện
  processed_at TIMESTAMPTZ DEFAULT now()  -- ⏱️ Thời điểm xử lý
);
```

#### 📋 Giải thích
| Cột            | Kiểu dữ liệu | Ý nghĩa                                      |
|----------------|--------------|-----------------------------------------------|
| `event_id`     | UUID         | ID sự kiện (thường đến từ metadata của Pub/Sub) |
| `service_name` | TEXT         | Tên service đã xử lý sự kiện này               |
| `processed_at` | TIMESTAMPTZ  | Thời điểm xử lý                                |

---

### 📘 Phụ lục A – Các Index quan trọng

| Bảng                     | Cột                                 | Loại Index     |
|--------------------------|--------------------------------------|----------------|
| `users_global`           | `(email, auth_provider)`             | UNIQUE INDEX   |
| `user_tenant_assignments`| `(user_id_global, tenant_id)`        | UNIQUE INDEX   |
| `tenants`                | `tenant_id`                          | PRIMARY KEY    |
| `global_roles_templates` | `template_code`                      | UNIQUE INDEX   |
| `global_permissions_templates` | `permission_code`              | UNIQUE INDEX   |

---

### 📘 Phụ lục B – Ràng buộc đặc biệt

- `users_global.email` chỉ là UNIQUE trong phạm vi `auth_provider` (nếu muốn hỗ trợ nhiều provider).
- `user_tenant_assignments` có thể được mở rộng để lưu cả trạng thái `invited`, `active`, `revoked`.

---

### 📘 Phụ lục C – Các sự kiện phát ra từ User Service Master

| Sự kiện                          | Trigger                                    | Mục đích                                     |
|----------------------------------|---------------------------------------------|----------------------------------------------|
| `user_global_created`            | Khi tạo user mới                            | Cho phép các service khác khởi tạo liên kết  |
| `tenant_created`                 | Khi tạo tenant                              | Cho phép Sub Service tạo môi trường dữ liệu  |
| `tenant_user_assigned`          | Khi gán user vào tenant                     | Đồng bộ RBAC và tạo user cục bộ ở Sub Service|
| `rbac_template_updated`         | Khi cập nhật role/permission templates      | Thông báo Sub Service cập nhật cấu hình RBAC |

---

### 📘 Phụ lục D – Enum và giá trị đặc biệt

- `auth_provider`:
  - `google`
  - `local`
  - `otp`
- `user_tenant_assignments.status` (nếu có mở rộng):
  - `active`
  - `revoked`
  - `invited`

---

### 📘 Phụ lục E – Chiến lược kiểm thử liên quan đến mô hình dữ liệu

---

#### 🔍 1. Kiểm thử mức cơ sở dữ liệu (Database-level)

| Loại kiểm thử             | Mô tả                                                                 |
|---------------------------|------------------------------------------------------------------------|
| ✅ Ràng buộc PK/FK         | Đảm bảo không thể insert/update dữ liệu sai liên kết giữa các bảng     |
| ✅ Ràng buộc UNIQUE        | Kiểm thử các cột `email`, `template_code`, `permission_code` không bị trùng |
| ✅ Enum/Constraint logic  | Kiểm thử giá trị hợp lệ của `auth_provider`, `status`, v.v.             |
| ✅ Trigger (nếu có)        | Nếu sử dụng trigger (ví dụ: audit log, cascading update), cần test kỹ |

---

#### 🔄 2. Kiểm thử tính toàn vẹn dữ liệu xuyên suốt (Integration Data Consistency)

| Tình huống kiểm thử                       | Mong đợi                                                             |
|-------------------------------------------|----------------------------------------------------------------------|
| Tạo user mới → Gán vào tenant             | Ghi đúng `users_global`, `user_tenant_assignments`, phát đúng event |
| Cập nhật template RBAC                    | Ghi đúng bảng template, phát sự kiện `rbac_template_updated`        |
| Gỡ user khỏi tenant                       | Không còn entry trong `user_tenant_assignments`, phát sự kiện nếu cần |
| Xử lý lại event trùng (`processed_events`)| Event không bị xử lý lại nhiều lần                                  |

---

#### ⚙️ 3. Kiểm thử với dữ liệu mẫu

| Tên tập dữ liệu         | Mô tả                                                                 |
|-------------------------|------------------------------------------------------------------------|
| `test_user_1.json`      | Một user Google, đã gán vào 2 tenants                                 |
| `test_templates.yaml`   | Role template với nhiều permission có `default_condition` phức tạp     |
| `test_event.json`       | Sự kiện giả lập `tenant_user_assigned` để test idempotency            |

---

#### 🛡️ 4. Kiểm thử bảo mật dữ liệu (Security-focused DB tests)

| Loại kiểm thử                        | Mô tả                                                                 |
|-------------------------------------|------------------------------------------------------------------------|
| Truy cập trái phép dữ liệu tenant khác | Đảm bảo query luôn có điều kiện `tenant_id`, không rò rỉ dữ liệu      |
| SQL Injection / Escaping             | Kiểm thử các cột dạng TEXT để đảm bảo escaping đúng (qua ORM)         |

---

#### 📂 5. Gợi ý công cụ hỗ trợ

- **Migration Tool:** Alembic / Prisma / Liquibase (tuỳ stack)
- **DB Unit Testing:** pgTAP (PostgreSQL), DBUnit (Java), pytest-postgresql
- **Event Testing:** Mock Pub/Sub + Log capture

---

#### 📘 Tham chiếu chéo

- [Thiết kế tổng quan (`design.md`)](./design.md) – phần "Chiến lược Test"
- [OpenAPI (`openapi.yaml`)](./openapi.yaml) – để mock endpoint kiểm thử dữ liệu
- [Audit Strategy (`adr-008-audit-logging.md`)](../../../adr-008-audit-logging.md)

---

### 📘 Phụ lục F – Liên kết tài liệu

* [Interface Contract](./interface-contract.md)
* [OpenAPI Spec](./openapi.yaml)
* [Design](./design.md)
- [RBAC Deep Dive](../../../rbac-deep-dive.md)
