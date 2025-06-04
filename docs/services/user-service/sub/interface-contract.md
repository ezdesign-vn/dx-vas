---
title: User Service Sub – Interface Contract
version: 1.1
last_updated: 2025-06-01
author: DX VAS Team
reviewed_by: Stephen Le
---
# 📘 User Service Sub – Interface Contract

## 1. 🎯 Tổng quan

### Mục đích
Cung cấp đặc tả chi tiết cho các API được exposed bởi `user-service/sub`, phục vụ frontend và các client thuộc tenant. Các API này chủ yếu mang tính **read-only**, sử dụng dữ liệu đồng bộ từ `user-service/master`.

### Đối tượng sử dụng
- Frontend Webapp nội bộ cho tenant
- Gateway Service (thực thi RBAC)

### Nguyên tắc chung
- Sub không xử lý xác thực/ủy quyền trực tiếp, chỉ nhận JWT header từ Gateway
- Các API luôn trả về theo chuẩn [ADR-012 Response Structure](../../ADR/adr-012-response-structure.md)
- Các lỗi sử dụng theo [ADR-011 Error Format](../../ADR/adr-011-api-error-format.md)

---

## 2. 📜 API Summary Table

| Method | Path                     | Mô tả                              | RBAC Permission                  |
|--------|--------------------------|-------------------------------------|----------------------------------|
| GET    | `/users`                 | Danh sách user trong tenant        | `tenant.read_users`              |
| GET    | `/users/me`              | Thông tin người dùng hiện tại     | –                                |
| GET    | `/users/me/permissions`  | Danh sách quyền của user          | –                                |
| GET    | `/roles`                 | Role templates đã đồng bộ         | `tenant.view_rbac_config`        |
| GET    | `/permissions`           | Permission templates đã đồng bộ   | `tenant.view_rbac_config`        |

---

## 3. 🔍 Chi tiết từng API

### GET `/users`
Trả về danh sách người dùng trong tenant hiện tại.

- **RBAC Required:** `tenant.read_users`
- **Query Params:**
  - `page`: integer (default: 1)
  - `limit`: integer (default: 20)
  - `search`: optional, tìm theo tên hoặc email
- **Response:**
```json
{
  "data": [
    {
      "user_id": "uuid-1234",
      "full_name": "Nguyen Van A",
      "email": "a@example.com",
      "status": "active",
      "is_active_in_tenant": true
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 1,
    "request_id": "req-abc",
    "timestamp": "2025-06-01T10:00:00Z"
  }
}
```

* **Status Codes:**

  * `200 OK`: Thành công
  * `401 Unauthorized`: Thiếu JWT hoặc không hợp lệ
  * `403 Forbidden`: Không đủ quyền truy cập
  * `500 Internal Server Error`: Lỗi hệ thống

---

### GET `/users/me`

Trả về thông tin user hiện tại (theo JWT).

* **RBAC:** không yêu cầu
* **Headers:** `Authorization: Bearer <JWT>`
* **Response:** như `UserLocal`
* **Status Codes:**

  * `200 OK`
  * `401 Unauthorized`
  * `500 Internal Server Error`

---

### GET `/users/me/permissions`

Trả về danh sách quyền người dùng hiện tại đã được expand.

* **RBAC:** không yêu cầu
* **Response:**

```json
{
  "data": [
    "student.view",
    "attendance.mark"
  ],
  "meta": {
    "request_id": "req-xyz",
    "timestamp": "2025-06-01T11:00:00Z"
  }
}
```

* **Status Codes:**

  * `200 OK`
  * `401 Unauthorized`
  * `500 Internal Server Error`

---

### GET `/roles`

Trả về danh sách role template đã được đồng bộ.

* **RBAC Required:** `tenant.view_rbac_config`
* **Response:**

```json
{
  "data": [
    {
      "role_code": "teacher",
      "name": "Giáo viên",
      "description": "Vai trò cho giáo viên"
    }
  ],
  "meta": { ... }
}
```

* **Status Codes:**

  * `200 OK`
  * `401 Unauthorized`
  * `403 Forbidden`
  * `500 Internal Server Error`

---

### GET `/permissions`

Trả về danh sách permission template đã được đồng bộ.

* **RBAC Required:** `tenant.view_rbac_config`
* **Response:**

```json
{
  "data": [
    {
      "code": "student.view",
      "resource": "student",
      "action": "view",
      "description": "Xem hồ sơ học sinh"
    }
  ],
  "meta": { ... }
}
```

* **Status Codes:**

  * `200 OK`
  * `401 Unauthorized`
  * `403 Forbidden`
  * `500 Internal Server Error`

---

## 4. 📑 Phụ lục: ENUM và Permission Code

### ✅ ENUM: `status` (UserLocal)

* `active`
* `invited`
* `suspended`
* `deleted`

### ✅ ENUM: `auth_provider`

* `local`
* `google`

### ✅ Permission Codes sử dụng

* `tenant.read_users`
* `tenant.view_rbac_config`

---

## 5. 📚 Tài liệu liên kết

* [Design Document](./design.md)
* [Data Model](./data-model.md)
* [OpenAPI Spec](./openapi.yaml)
* [ADR-012 Response Structure](../../ADR/adr-012-response-structure.md)
* [ADR-011 Error Format](../../ADR/adr-011-api-error-format.md)
* [ADR-027 Data Management Strategy](../../ADR/adr-027-data-management-strategy.md)
