# 📘 Auth Service Master – Interface Contract

> Tài liệu này mô tả các API chính mà **Auth Service Master** cung cấp, dùng cho developer backend/frontend và các bên liên quan. Chi tiết kỹ thuật (chuẩn máy đọc) xem thêm: [`openapi.yaml`](./openapi.yaml)

* *Phạm vi (Scope):*
  Service này quản lý thông tin phiên đăng nhập (AuthSession), xác thực JWT, và cung cấp các API OAuth2 login, refresh token, revoke token. Service không quản lý RBAC hay profile người dùng.

> 🗭 **Nguyên tắc chung khi sử dụng API:**
>
> * API `PATCH` trả về `204 No Content` nếu không có body phản hồi.
> * Tất cả API (trừ `/auth/oauth2/authorize` và `/auth/oauth2/callback`) đều yêu cầu `Authorization: Bearer <JWT>`
> * Tất cả response tuân theo [ADR-012 Response Structure](../../../ADR/adr-012-response-structure.md)
> * Mã lỗi theo [ADR-011 Error Format](../../../ADR/adr-011-api-error-format.md)

---

## 📌 API: `/auth`

Danh sách API quản lý đăng nhập, phiên làm việc, và lấy quyền.

| Method | Path                     | Mô tả                                   | Quyền (RBAC Permission Code) |
| ------ | ------------------------ | --------------------------------------- | ---------------------------- |
| GET    | `/auth/me/permissions`   | Lấy danh sách quyền của user            | `public`                     |
| POST   | `/auth/oauth2/authorize` | Redirect user sang Google OAuth         | `public`                     |
| GET    | `/auth/oauth2/callback`  | OAuth2 callback handler                 | `public`                     |
| POST   | `/auth/refresh-token`    | Lấy access token mới bằng refresh token | `public`                     |
| POST   | `/auth/revoke-token`     | Revoke refresh token                    | `public`                     |
| GET    | `/auth/me`               | Lấy thông tin user hiện tại             | Cần token                    |
| GET    | `/auth/providers `       | Lấy danh sách các Auth Provider đang bật| `public`                     |

---

### 1. GET `/auth/me/permissions`

Trả về danh sách quyền (RBAC permission codes) của user đang login hiện tại theo tenant hiện tại (ghi trong JWT).

**Headers:**

* `Authorization`: `Bearer <access_token>`

**Response 200 OK:**

```json
{
  "data": [
    "tenant.read_users",
    "tenant.view_rbac_config"
  ],
  "meta": {
    "request_id": "req-abc-123",
    "timestamp": "2025-06-30T08:15:00Z"
  },
  "error": null
}
```

**Status Codes:** 200, 401, 403, 500

---

### 2. POST `/auth/oauth2/authorize`

Tạo URL redirect user sang Google OAuth2 để đăng nhập.

**Body:**

```json
{
  "redirect_uri": "https://admin.truongvietanh.edu.vn/login/sso"
}
```

**Response 200 OK:**

```json
{
  "data": {
    "url": "https://accounts.google.com/o/oauth2/v2/auth?..."
  },
  "meta": { ... },
  "error": null
}
```

**Status Codes:** 200, 400, 401, 500

---

### 3. GET `/auth/oauth2/callback`

Google redirect về với `code` & `state`, service exchange token & sinh JWT + refresh token.

**Query Parameters:**

* `code`: string, bắt buộc
* `state`: string, bắt buộc

**Response 200 OK:**

```json
{
  "data": {
    "access_token": "...",
    "refresh_token": "...",
    "token_type": "Bearer",
    "expires_in": 3600
  },
  "meta": { ... },
  "error": null
}
```

**Status Codes:** 200, 400, 401, 403, 500

---

### 4. POST `/auth/refresh-token`

Lấy token mới từ refresh token (và thu hồi token cũ).

**Body:**

```json
{
  "refresh_token": "..."
}
```

**Response 200 OK:**

```json
{
  "data": {
    "access_token": "...",
    "refresh_token": "...",
    "token_type": "Bearer",
    "expires_in": 3600
  },
  "meta": { ... },
  "error": null
}
```

**Status Codes:** 200, 400, 401, 403, 500

**Emitted Event:**

* `token_refreshed`

```json
{
  "event_type": "token_refreshed",
  "data": {
    "session_id": "authsess-abc",
    "user_id": "user-xyz",
    "tenant_id": "tenant-001"
  },
  "metadata": {
    "event_id": "evt-1234",
    "timestamp": "2025-06-30T08:00:00Z"
  }
}
```

---

### 5. POST `/auth/revoke-token`

Thu hồi refresh token (logout).

**Body:**

```json
{
  "refresh_token": "..."
}
```

**Response 204 No Content**

**Emitted Event:**

* `session_revoked`

```json
{
  "event_type": "session_revoked",
  "data": {
    "session_id": "authsess-abc",
    "user_id": "user-xyz",
    "tenant_id": "tenant-001"
  },
  "metadata": {
    "event_id": "evt-5678",
    "timestamp": "2025-06-30T08:10:00Z"
  }
}
```

---

### 6. GET /auth/me

Lấy thông tin của user hiện tại dựa trên access token.

**Authorization**
Cần Bearer Token (JWT).

**Request**
Header:
```http
Authorization: Bearer <access_token>
```

**Response 200 OK:**

```json
{
  "data": {
    "user_id": "u_123",
    "full_name": "Jane Doe",
    "email": "jane@example.com",
    "provider": "google",
    "tenants": [
      {
        "tenant_id": "t_001",
        "tenant_name": "VAS Demo",
        "assignment_status": "active",
        "roles": ["teacher", "editor"]
      }
    ]
  },
  "meta": {
    "request_id": "req_xyz"
  },
  "error": null
}
```

**Response 401**

```json
{
  "data": null,
  "meta": {
    "request_id": "req_xyz"
  },
  "error": {
    "code": "unauthorized",
    "message": "Access token missing or invalid"
  }
}
```
**Status Codes:** 200, 400, 401, 500

---

### 7. GET /auth/providers

Lấy danh sách các nhà cung cấp xác thực đang được bật.

**Request**
Không cần token.

**Response 200 OK:**
```json
{
  "data": ["google", "microsoft", "facebook"],
  "meta": {
    "request_id": "req_xyz"
  },
  "error": null
}
```

---

## 📉 ENUMs Dùng trong Auth Service

| Trường Enum     | Values                   | Mô tả          |
| --------------- | ------------------------ | -------------- |
| `auth_provider` | `google`, `local`, `otp` | Kiểu đăng nhập |

---

## 📋 Permission Code

| `permission_code` | Mô tả                       | Dùng cho API                  | `action` | `resource` | `default_condition` |
| ----------------- | --------------------------- | ----------------------------- | -------- | ---------- | ------------------- |
| `public`          | Dùng cho API không cần RBAC | Tất cả API trong Auth Service | -        | -          | -                   |

> 🔐 **Lưu ý:** RBAC không áp dụng trong Auth Service Master

---

## HTTP Status Codes dùng chung

| 500 | Internal Server Error – Lỗi không xác định từ phía server |

---

## 🔖 Tài liệu tham chiếu:

* [`design.md`](./design.md)
* [`data-model.md`](./data-model.md)
* [`openapi.yaml`](./openapi.yaml)
* [`ADR-012`](../../../ADR/adr-012-response-structure.md)
* [`ADR-011`](../../../ADR/adr-011-api-error-format.md)
