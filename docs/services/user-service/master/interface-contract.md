---
title: User Service Master – Interface Contract
description: Service Design Document cho SPA quản trị hệ thống VAS DX
version: 1.0
author: DX VAS Team
last_updated: 2025-05-23
reviewed_by: Stephen Le
---
# 📘 User Service Master – Interface Contract

* Tài liệu này mô tả các API chính mà User Service Master cung cấp, theo phong cách dễ đọc cho developer/backend/frontend. Đặc tả kỹ thuật chi tiết xem thêm tại [`openapi.yaml`](./openapi.yaml).
* _Phạm vi:_
Service này quản lý định danh toàn cục người dùng, thông tin tenant, và các template RBAC toàn cục. Nó không quản lý RBAC cục bộ của từng tenant (xem Sub User Service).

> 🧭 **Nguyên tắc chung:**  
> Với các API `PATCH`, hệ thống mặc định trả về `204 No Content` nếu cập nhật thành công, để tối ưu hiệu năng và đơn giản hóa xử lý phía client. Nếu client cần object mới nhất, nên thực hiện `GET` sau khi cập nhật.

---

## 📌 API: `/users-global`

Danh sách các API phục vụ quản lý người dùng toàn cục.

| Method | Path | Mô tả | Quyền (RBAC) |
|--------|------|-------|--------------|
| GET | `/users-global/{user_id}` | Lấy thông tin user toàn cục theo `user_id` | `superadmin.view_user_global` |
| GET | `/users-global/by-email?email=...` | Lấy thông tin user theo email (dành cho login Google) | `public` / `auth_master.lookup_user_by_email` |
| POST | `/users-global` | Tạo người dùng toàn cục mới (dành cho Sub Auth khi login local/OTP lần đầu) | `auth_sub.create_user_global` |
| PATCH | `/users-global/{user_id}` | Cập nhật thông tin user toàn cục (thường chỉ Superadmin dùng) | `superadmin.update_user_global` |

---

### 🧪 Chi tiết API

#### 1. GET `/users-global/{user_id}`

Trả về thông tin chi tiết của một người dùng toàn cục.

**Response mẫu:**
```json
{
  "user_id": "uuid",
  "full_name": "Nguyễn Văn A",
  "email": "a@example.com",
  "auth_provider": "google"
}
```

---

#### 2. GET `/users-global/by-email?email=...`

Sử dụng trong luồng Google OAuth2 (Auth Master cần lookup user toàn cục bằng email).

**Query param:**  
- `email`: string

**Response mẫu:**  
Giống với API trên. Trả về 404 nếu không tìm thấy.

---

#### 3. POST `/users-global`

Tạo mới một user toàn cục (Sub Auth Service sẽ dùng trong lần đăng nhập đầu tiên qua local/OTP).

**Request body:**
```json
{
  "full_name": "Trần Thị B",
  "email": "b@example.com",
  "auth_provider": "local"
}
```

**Response:**
```json
{
  "user_id": "uuid"
}
```

**Phát sự kiện:**
- `user_global_created`

---

#### 4. PATCH `/users-global/{user_id}`

Cập nhật thông tin user (thường để sửa tên/email khi có yêu cầu).

**Request body:**
```json
{
  "full_name": "Trần Thị Bình",
  "email": "b@example.com",
  "status": "active"
}
```

**Response:** `204 No Content`

---

🔒 **Lưu ý quyền truy cập:**
- Các API này được gọi bởi Superadmin (qua Superadmin Webapp) hoặc bởi Auth Services.
- Việc xác định `auth_provider` (`google`, `local`, `otp`, ...) rất quan trọng để phân biệt luồng xác thực.

📚 Xem thêm:
- [`design.md`](./design.md#luồng-nghiệp-vụ-đăng-ký--lookup-user)
- [`data-model.md`](./data-model.md#bảng-users_global)

---

## 🏢 API: `/tenants`

Quản lý thông tin tenant trong hệ thống. Chỉ dành cho Superadmin.

| Method | Path | Mô tả | Quyền (RBAC) |
|--------|------|-------|--------------|
| GET | `/tenants` | Lấy danh sách tất cả tenants | `superadmin.view_tenant` |
| GET | `/tenants/{tenant_id}` | Lấy thông tin chi tiết một tenant | `superadmin.view_tenant` |
| POST | `/tenants` | Tạo tenant mới | `superadmin.create_tenant` |
| PATCH | `/tenants/{tenant_id}` | Cập nhật thông tin tenant | `superadmin.update_tenant` |
| DELETE | `/tenants/{tenant_id}` | Xoá (deactivate) tenant | `superadmin.delete_tenant` |

---

### 🧪 Chi tiết API

#### 1. GET `/tenants`

Trả về danh sách tất cả tenants trong hệ thống.

**Response mẫu:**
```json
[
  {
    "tenant_id": "tenant_a",
    "tenant_name": "Trường Việt Anh Cơ Sở A",
    "status": "active"
  },
  {
    "tenant_id": "tenant_b",
    "tenant_name": "Trường Việt Anh Cơ Sở B",
    "status": "inactive"
  }
]
```

---

#### 2. GET `/tenants/{tenant_id}`

Trả về thông tin chi tiết một tenant.

**Response mẫu:**
```json
{
  "tenant_id": "tenant_a",
  "tenant_name": "Trường Việt Anh Cơ Sở A",
  "status": "active"
}
```

---

#### 3. POST `/tenants`

Tạo tenant mới. Chỉ Superadmin có quyền.

**Request body:**
```json
{
  "tenant_id": "tenant_c",
  "tenant_name": "Trường Việt Anh Cơ Sở C"
}
```

**Response:**
```json
{
  "tenant_id": "tenant_c"
}
```

**Phát sự kiện:**
- `tenant_created`

---

#### 4. PATCH `/tenants/{tenant_id}`

Cập nhật thông tin một tenant.

**Request body:**
```json
{
  "tenant_name": "Tên mới cho tenant",
  "status": "inactive"
}
```

**Response:** `204 No Content`

---

#### 5. DELETE `/tenants/{tenant_id}`

Xoá hoặc đánh dấu tenant là `inactive`.

**Response:** `204 No Content`

---

📚 Xem thêm:
- [`design.md`](./design.md#luồng-superadmin-tạo--quản-lý-tenant)
- [`data-model.md`](./data-model.md#bảng-tenants)

---

## 👥 API: `/user-tenant-assignments`

Gán và quản lý mối quan hệ giữa user toàn cục và các tenant. Chỉ Superadmin có quyền gọi các API này.

| Method | Path | Mô tả | Quyền (RBAC) |
|--------|------|-------|--------------|
| GET | `/user-tenant-assignments?user_id=...` | Lấy danh sách các tenant mà user được gán | `superadmin.view_user_tenants` |
| POST | `/user-tenant-assignments` | Gán user vào một tenant | `superadmin.assign_user_to_tenant` |
| PATCH | `/user-tenant-assignments/{id}` | Cập nhật trạng thái gán (ví dụ: vô hiệu hóa) | `superadmin.update_user_tenant_assignment` |

---

### 🧪 Chi tiết API

#### 1. GET `/user-tenant-assignments?user_id=...`

Trả về tất cả các tenant mà user đã được gán vào.

**Response mẫu:**
```json
[
  {
    "assignment_id": "a123",
    "user_id": "user-uuid",
    "tenant_id": "tenant_a",
    "assignment_status": "active"
  },
  {
    "assignment_id": "a456",
    "user_id": "user-uuid",
    "tenant_id": "tenant_b",
    "assignment_status": "revoked"
  }
]
```

---

#### 2. POST `/user-tenant-assignments`

Gán một user toàn cục vào một tenant cụ thể. Mỗi lần gán tạo một `assignment`.

**Request body:**
```json
{
  "user_id": "user-uuid",
  "tenant_id": "tenant_a"
}
```

**Response:**
```json
{
  "assignment_id": "a123"
}
```

**Phát sự kiện:**
- `tenant_user_assigned` (Pub/Sub)

---

#### 3. PATCH `/user-tenant-assignments/{id}`

Cập nhật thông tin gán user vào tenant – thường để vô hiệu hóa (`is_active: false`).

**Request body:**
```json
{
  "assignment_status": "revoked"
}
```

**Giá trị hợp lệ của `assignment_status`:**

- `"active"`
- `"revoked"`

**Response**

```json
{
  "id": "c9d5d2e5-84b1-40de-8f7f-7f8cf4b6b94e",
  "user_id_global": "72ae5021-cc44-46c5-bf99-51bcaa9d2ea6",
  "tenant_id": "vas-hn",
  "assignment_status": "revoked"
}
```

**Ghi chú:**
- Trước đây dùng `is_active: boolean`, nay thay bằng `assignment_status` (`enum`) để tăng khả năng mở rộng và đồng bộ với mô hình dữ liệu thực tế.

**Phát sự kiện:**
- `tenant_user_assignment_updated`

---

📚 Xem thêm:
- [`design.md`](./design.md#luồng-1-gán-user-into-tenant)
- [`data-model.md`](./data-model.md#bảng-user_tenant_assignments)

---

## 🧱 API: `/rbac/templates`

Quản lý template RBAC toàn cục – dành riêng cho Superadmin. Bao gồm `roles` và `permissions` mẫu được nhân bản xuống từng tenant.

| Method | Path | Mô tả | Quyền (RBAC) |
|--------|------|-------|--------------|
| GET | `/rbac/templates/roles` | Liệt kê tất cả template roles | `superadmin.view_rbac_templates` |
| POST | `/rbac/templates/roles` | Tạo mới một template role | `superadmin.manage_rbac_templates` |
| PATCH | `/rbac/templates/roles/{template_id}` | Cập nhật template role | `superadmin.manage_rbac_templates` |
| DELETE | `/rbac/templates/roles/{template_id}` | Xoá template role | `superadmin.manage_rbac_templates` |
| GET | `/rbac/templates/permissions` | Liệt kê tất cả template permissions | `superadmin.view_rbac_templates` |
| POST | `/rbac/templates/permissions` | Tạo mới một template permission | `superadmin.manage_rbac_templates` |
| PATCH | `/rbac/templates/permissions/{template_id}` | Cập nhật template permission | `superadmin.manage_rbac_templates` |
| DELETE | `/rbac/templates/permissions/{template_id}` | Xoá template permission | `superadmin.manage_rbac_templates` |

---

### 🧪 Chi tiết API

#### 1. POST `/rbac/templates/roles`

**Request body:**
```json
{
  "template_code": "teacher",
  "description": "Vai trò dành cho giáo viên"
}
```

**Response:**
```json
{
  "template_id": "uuid-role-template"
}
```

---

#### 2. POST `/rbac/templates/permissions`

**Request body:**
```json
{
  "permission_code": "manage.student.profile",
  "action": "update",
  "resource": "student_profile",
  "default_condition": {
    "scope": "class",
    "match_teacher_id": true
  }
}
```

**Response:**
```json
{
  "template_id": "uuid-perm-template"
}
```

---

#### 3. GET `/rbac/templates/roles` & `/permissions`

Trả về danh sách các template role/permission toàn cục.

**Response mẫu (permissions):**
```json
[
  {
    "template_id": "uuid",
    "permission_code": "manage.student.profile",
    "action": "update",
    "resource": "student_profile",
    "default_condition": {
      "scope": "class"
    }
  }
]
```

---

#### 4. PATCH và DELETE

Cập nhật/xoá các template theo `template_id`. Các thay đổi có thể được propagate xuống các Sub User Service thông qua Pub/Sub event (`rbac_template_updated`).

**Phát sự kiện:**
- `rbac_template_created`
- `rbac_template_updated`
- `rbac_template_deleted`

---

📚 Xem thêm:
- [`design.md`](./design.md#mục-3-quản-lý-template-rbac-toàn-cục)
- [`data-model.md`](./data-model.md#bảng-global_roles_templates-và-global_permissions_templates)

---

## 📌 Chú thích Định dạng Response & Lỗi

Tất cả các API tuân theo chuẩn phản hồi thống nhất (xem [ADR-012](../../../adr/adr-012-response-structure.md)):

### ✅ Response Thành công (`200 OK`, `201 Created`, v.v.)

```json
{
  "data": { ... },
  "meta": {
    "request_id": "abc-123",
    "timestamp": "2024-06-01T08:30:00Z"
  }
}
```

### ❌ Response Lỗi (4xx/5xx)

```json
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "Người dùng không tồn tại",
    "details": null
  },
  "meta": {
    "request_id": "abc-123",
    "timestamp": "2024-06-01T08:30:00Z"
  }
}
```

Xem chi tiết mã lỗi tại [ADR-011 - API Error Format](../../../adr/adr-011-api-error-format.md).

---

## 🔚 Kết luận

Tài liệu này định nghĩa rõ ràng các hợp đồng giao diện (interface contract) của **User Service Master**, bao gồm:

- Quản lý người dùng toàn cục (`/users-global`)
- Quản lý tenant (`/tenants`)
- Gán người dùng vào tenant (`/user-tenant-assignments`)
- Quản lý template RBAC toàn cục (`/rbac/templates`)

Mọi API đều áp dụng chuẩn phản hồi thống nhất và cơ chế phân quyền linh hoạt dựa trên RBAC đã được mô tả trong [`design.md`](./design.md) và [`rbac-deep-dive.md`](../../../architecture/rbac-deep-dive.md).

👉 **Các API này là nền tảng để các dịch vụ Auth Master, Sub Auth và Superadmin Webapp hoạt động ổn định và mở rộng linh hoạt trong kiến trúc multi-tenant.**

---

## 📌 Phụ lục: Các ENUM sử dụng trong User Service Master

| Tên trường           | Enum giá trị hợp lệ                | Mô tả                                                                 |
|----------------------|------------------------------------|----------------------------------------------------------------------|
| `assignment_status`  | `active`, `revoked`                | Trạng thái gán user vào một tenant.                                 |
| `auth_provider`      | `google`, `local`, `otp`           | Phương thức định danh của user.                                     |
| `tenant_status`      | `active`, `suspended`, `archived`  | Trạng thái hoạt động của một tenant. *(Tùy chọn nếu mở rộng về sau)*|
| `event_type` (nếu có)| `created`, `updated`, `deleted`    | Loại sự kiện phát ra trong các event. *(áp dụng nếu thống nhất định danh kiểu event trong log/audit)* |

**Ghi chú:** Các ENUM này nên được định nghĩa tập trung trong codebase backend để tái sử dụng (ví dụ: constant hoặc enum class trong FastAPI hoặc Pydantic), đồng thời được phản ánh rõ trong `openapi.yaml` và các ví dụ minh hoạ để đảm bảo tính thống nhất giữa backend, frontend và hệ thống tài liệu.

---

## 📎 Phụ lục: Bảng Permission Code cho User Service Master

| `permission_code`                      | Mô tả ngắn gọn                                            | Sử dụng bởi API                                             | `action`    | `resource`         | `default_condition` (nếu có) |
|----------------------------------------|------------------------------------------------------------|-------------------------------------------------------------|-------------|--------------------|-------------------------------|
| `superadmin.view_user_global`          | Xem thông tin người dùng toàn cục                         | `GET /users-global/{id}`, `GET /users-global/by-email`     | `read`      | `user_global`      | `null`                        |
| `auth_sub.create_user_global`          | Tạo user toàn cục (qua luồng OTP)                         | `POST /users-global` từ Sub Auth                           | `create`    | `user_global`      | `null`                        |
| `superadmin.create_user_global`        | Tạo user toàn cục từ Superadmin                           | `POST /users-global` từ Superadmin                         | `create`    | `user_global`      | `null`                        |
| `superadmin.update_user_global`        | Cập nhật thông tin user toàn cục                          | `PATCH /users-global/{id}`                                 | `update`    | `user_global`      | `null`                        |
| `superadmin.view_tenant`               | Xem danh sách tenant                                      | `GET /tenants`, `GET /tenants/{id}`                        | `read`      | `tenant`           | `null`                        |
| `superadmin.create_tenant`             | Tạo tenant mới                                            | `POST /tenants`                                            | `create`    | `tenant`           | `null`                        |
| `superadmin.update_tenant`             | Cập nhật thông tin tenant                                 | `PATCH /tenants/{id}`                                      | `update`    | `tenant`           | `null`                        |
| `superadmin.delete_tenant`             | Xóa tenant                                                | `DELETE /tenants/{id}`                                     | `delete`    | `tenant`           | `null`                        |
| `superadmin.assign_user_to_tenant`     | Gán người dùng vào tenant                                 | `POST /user-tenant-assignments`                            | `create`    | `user_tenant_map`  | `null`                        |
| `superadmin.update_user_tenant_status` | Cập nhật trạng thái user trong tenant                     | `PATCH /user-tenant-assignments/{id}`                      | `update`    | `user_tenant_map`  | `null`                        |
| `superadmin.view_user_tenant_assignments` | Tra cứu mapping user ↔ tenant                            | `GET /user-tenant-assignments?user_id=...`                 | `read`      | `user_tenant_map`  | `null`                        |
| `superadmin.create_rbac_template`      | Tạo role / permission template toàn cục                   | `POST /rbac/templates/roles`, `POST /rbac/templates/permissions` | `create` | `rbac_template`    | `null`                        |
| `superadmin.view_rbac_template`        | Xem danh sách template RBAC                               | `GET /rbac/templates/roles`, `GET /rbac/templates/permissions` | `read`  | `rbac_template`    | `null`                        |
| `superadmin.update_rbac_template`      | Cập nhật role / permission template                       | `PATCH /rbac/templates/roles/{id}`, ...                    | `update`    | `rbac_template`    | `null`                        |
| `superadmin.delete_rbac_template`      | Xóa role / permission template                            | `DELETE /rbac/templates/roles/{id}`, ...                   | `delete`    | `rbac_template`    | `null`                        |

> 🔒 **Ghi chú:** Các permission này được định nghĩa tại User Service Master và có thể được ánh xạ xuống từng tenant thông qua Sub User Service nếu cần thiết. Các `default_condition` có thể được bổ sung nếu áp dụng điều kiện như "chỉ xem tenant mình quản lý", v.v.

---
**Tài liệu liên quan**

* [Data Model](./data-model.md)
* [OpenAPI Spec](./openapi.yaml)
* [Design](./design.md)
