---
title: Auth Service Master – Interface Contract
version: 2.1
last_updated: 2025-06-11
author: DX VAS Team
reviewed_by: Stephen Le
---
# 📘 Auth Service Master – Interface Contract

## 1. 🔧 Nguyên tắc chung khi sử dụng API

Tài liệu này mô tả các API được cung cấp bởi `auth-service/master`, nơi chịu trách nhiệm điều phối luồng xác thực người dùng thông qua Google OAuth2.

### 1.1. 🧭 Vai trò của auth-service/master

Auth service không còn tự sinh token hay giữ trạng thái phiên đăng nhập. Thay vào đó, nó:

- Khởi tạo luồng xác thực Google
- Nhận `code` từ Google callback
- Đồng bộ người dùng vào `user-service`
- Yêu cầu `token-service` phát hành JWT
- Ghi nhận audit log sự kiện đăng nhập

---

### 1.2. 🔐 Cơ chế xác thực

Hầu hết các API ở đây là **public** hoặc được gọi trong luồng redirect. Một số API như `/me`, `/verify` yêu cầu header:

```

Authorization: Bearer \<access\_token>

```

> Token phải được phát hành từ `token-service`, có chữ ký hợp lệ và còn hiệu lực.

---

### 1.3. 📎 Header chuẩn hóa

| Header          | Mô tả |
|-----------------|------|
| `Authorization` | Dạng `Bearer <access_token>` |
| `X-Tenant-ID`   | Mã tenant, trích xuất từ token hoặc thêm vào (nếu cần) |
| `X-Trace-ID`    | UUID để theo dõi toàn bộ luồng xử lý |

> Mọi phản hồi đều gắn `trace_id` vào response để phục vụ logging & debug.

---

### 1.4. 📦 Response chuẩn hóa

- Tất cả response thành công tuân theo định dạng:

```json
{
  "data": { ... },
  "meta": {
    "trace_id": "abc-123",
    "timestamp": "2025-06-10T12:00:00Z"
  }
}
```

* Mọi lỗi đều theo `ErrorEnvelope` chuẩn hóa, ví dụ:

```json
{
  "error": {
    "code": "auth.invalid_oauth_code",
    "message": "Mã xác thực không hợp lệ hoặc đã hết hạn",
    "details": []
  },
  "meta": {
    "trace_id": "abc-123",
    "timestamp": "2025-06-10T12:00:00Z"
  }
}
```

---

### 1.5. 📎 Namespace mã lỗi

Mọi mã lỗi đều tuân theo cấu trúc:

```
auth.<error_type>
```

Ví dụ:

* `auth.invalid_oauth_code`
* `auth.token_issue_failed`
* `auth.unauthorized`

---

## 2. 📌 API

Auth Service cung cấp tập hợp các API công khai giúp frontend hoặc gateway khởi tạo và hoàn tất luồng xác thực người dùng thông qua Google OAuth2. Ngoài ra, nó còn cung cấp các endpoint để introspect token (`/verify`) và lấy thông tin người dùng hiện tại (`/me`).

### 2.1. 🧩 Nhóm API chính

| Nhóm | Mô tả |
|------|------|
| OAuth2 | Điều phối xác thực Google: `/oauth2/login`, `/oauth2/callback` |
| Token Exchange | Trao đổi mã xác thực lấy JWT: `/auth/exchange` |
| User Info | Lấy thông tin người dùng hiện tại: `/me` |
| Token Verify | Kiểm tra tính hợp lệ của access token: `/verify` |
| Provider Metadata | Cấu hình provider: `/providers` |
| Dev Mode (tuỳ chọn) | Endpoint giả lập (`/dev/mimic`) dành cho môi trường phát triển |
| OTP Login | Đăng nhập bằng mã OTP: `/auth/otp`, `/auth/verify-otp` |
| Local Login | Đăng nhập bằng username/password: `/auth/login` |

---

### 2.2. ⚠️ Lưu ý tích hợp

- Để đăng nhập Google OAuth2, client **phải redirect** người dùng đến `/oauth2/login` và lắng nghe phản hồi ở `/oauth2/callback`.
- API `/auth/exchange` sẽ phát hành token thông qua **`token-service`**, không được gọi trực tiếp ở client.
- API `/me` và `/verify` nên được sử dụng thông qua **`api-gateway`**, không expose public.

---

### 2.3. 🔁 Luồng: OAuth2 Login Flow

Luồng đăng nhập Google OAuth2 bao gồm 3 bước chính:

---

#### **1. Redirect người dùng đến Google**

```http
GET /oauth2/login
```

| Mô tả        | Tạo URL chuyển hướng người dùng đến trang đăng nhập của Google    |
| ------------ | ----------------------------------------------------------------- |
| Auth yêu cầu | ❌ Không                                                           |
| Headers      | `X-Tenant-ID` (nếu hệ thống đa tenant)                            |
| Phản hồi     | Redirect 302 → `https://accounts.google.com/o/oauth2/v2/auth?...` |
| Audit event  | Không                                                             |

✅ Endpoint này xây dựng URL chứa client\_id, scope, redirect\_uri theo config trong `auth_provider_config`.

---

#### **2. Google Redirect về Callback**

```http
GET /oauth2/callback?code=XXXX&state=...
```

| Mô tả        | Nhận `code` từ Google và bắt đầu luồng trao đổi token |
| ------------ | ----------------------------------------------------- |
| Auth yêu cầu | ❌ Không                                               |
| Query Params | `code`, `state`                                       |
| Headers      | `X-Tenant-ID`, `X-Trace-ID`                           |
| Response     | Redirect về `frontend_url?code=EXCH_CODE&state=...`   |
| Audit        | `auth.login.success` hoặc `auth.login.failed`         |

✅ Nếu thành công, trả về mã `exchange_code` tạm thời, client dùng mã này để gọi `/auth/exchange`.

---

#### **3. Đổi exchange\_code lấy JWT**

```http
POST /auth/exchange
```

| Mô tả        | Frontend dùng exchange\_code để nhận token từ hệ thống |
| ------------ | ------------------------------------------------------ |
| Auth yêu cầu | ❌ Không                                                |
| Body         |                                                        |

```json
{
  "exchange_code": "abc123",
  "client_ip": "123.123.123.123",
  "user_agent": "Chrome/120"
}
```

\| Response |

```json
{
  "data": {
    "access_token": "jwt...",
    "refresh_token": "jwt...",
    "expires_in": 3600,
    "session_id": "uuid"
  },
  "meta": { ... }
}
```

\| Audit | `auth.token.issued` (ghi qua audit-service) |

📌 Auth Service sẽ gọi nội bộ:

* `POST /v1/users/global/sync` (user-service)
* `POST /v1/token/issue` (token-service)

---

#### 🧩 Lưu ý bảo mật

* `exchange_code` có TTL ngắn (5 phút), dùng một lần duy nhất
* Nếu code hết hạn → trả `auth.exchange_code_expired`
* Nếu Google trả lỗi → trả `auth.invalid_oauth_code`

---

### 2.4. 🔐 POST /auth/otp – Gửi mã OTP

Gửi mã OTP (One-Time Password) tới số điện thoại hoặc địa chỉ email của người dùng để bắt đầu quá trình xác thực.

| Thuộc nhóm API | OTP Login |
|----------------|-----------|

#### 📥 Request

- **URL:** `/auth/otp`
- **Phương thức:** `POST`
- **Auth yêu cầu:** ❌ Không yêu cầu access token
- **Headers yêu cầu:**
  - `X-Tenant-ID`: Mã định danh tenant (bắt buộc)
  - `X-Request-ID` (khuyến nghị)

##### 🔸 Request Body

```json
{
  "identifier": "0934567890",
  "type": "phone"
}
```

| Trường       | Kiểu   | Bắt buộc | Mô tả                                   |
| ------------ | ------ | -------- | --------------------------------------- |
| `identifier` | string | ✅        | Số điện thoại hoặc email cần gửi mã OTP |
| `type`       | enum   | ✅        | `"phone"` hoặc `"email"`                |

#### 📤 Response

```json
{
  "data": "OTP has been sent",
  "meta": {
    "trace_id": "79f2f5ba-3fc7-4c1f-9c6a-843d0caa15bb",
    "timestamp": "2025-06-10T14:33:00Z"
  }
}
```

#### ❗️Các lỗi có thể gặp

| Mã lỗi                  | Mô tả                                  |
| ----------------------- | -------------------------------------- |
| `auth.otp.invalid_type` | Trường `type` không hợp lệ             |
| `auth.otp.rate_limited` | Gửi quá nhiều OTP trong thời gian ngắn |

#### 🧭 Audit Log

| Event                | Khi nào ghi log                                |
| -------------------- | ---------------------------------------------- |
| `auth.otp.requested` | Khi OTP được gửi thành công hoặc bị rate-limit |

#### 🔐 Ghi chú bảo mật

* Có giới hạn số lần gửi OTP theo IP & identifier để chống spam.
* OTP sẽ được lưu trữ tạm thời trên Redis với TTL ngắn (vd: 5 phút).
* Nếu type = `email`, hệ thống sẽ dùng `notification-service` để gửi email chứa mã OTP.

---

### 2.5. 🔐 POST /auth/verify-otp – Xác minh mã OTP

Xác minh mã OTP do người dùng nhập. Nếu hợp lệ, hệ thống sẽ:
1. Xác thực identifier.
2. Gọi `user-service` để tìm hoặc tạo người dùng.
3. Gọi `token-service` để phát hành token.

| Thuộc nhóm API | OTP Login |
|----------------|-----------|

#### 📥 Request

- **URL:** `/auth/verify-otp`
- **Phương thức:** `POST`
- **Auth yêu cầu:** ❌ Không yêu cầu access token
- **Headers yêu cầu:**
  - `X-Tenant-ID`: Mã định danh tenant (bắt buộc)
  - `X-Request-ID` (khuyến nghị)
  - `User-Agent`, `X-Forwarded-For` (để ghi audit, phân tích)

##### 🔸 Request Body

```json
{
  "identifier": "0934567890",
  "otp_code": "123456",
  "client_ip": "192.168.1.10",
  "user_agent": "Mozilla/5.0"
}
```

| Trường       | Kiểu   | Bắt buộc | Mô tả                          |
| ------------ | ------ | -------- | ------------------------------ |
| `identifier` | string | ✅        | Số điện thoại hoặc email       |
| `otp_code`   | string | ✅        | Mã OTP người dùng nhập         |
| `client_ip`  | string | ✅        | Địa chỉ IP client              |
| `user_agent` | string | ✅        | User agent của trình duyệt/app |

#### 📤 Response

```json
{
  "data": {
    "access_token": "<JWT>",
    "refresh_token": "<JWT>",
    "expires_in": 3600,
    "token_type": "bearer"
  },
  "meta": {
    "trace_id": "cfe18234-fcc9-4432-a09e-84c12395cabc",
    "timestamp": "2025-06-10T15:01:23Z",
    "additional": {
      "login_method": "otp"
    }
  }
}
```

#### ❗️Các lỗi có thể gặp

| Mã lỗi                       | Mô tả                               |
| ---------------------------- | ----------------------------------- |
| `auth.otp_invalid`           | Mã OTP không đúng hoặc đã hết hạn   |
| `auth.otp_expired`           | Mã OTP đã hết hạn                   |
| `auth.otp_attempts_exceeded` | Vượt quá số lần thử OTP cho phép    |
| `user.not_found`             | Không tìm thấy người dùng tương ứng |
| `token.issue_failed`         | Gọi `token-service` thất bại        |

#### 🧭 Audit Log

| Event                    | Khi nào ghi log                          |
| ------------------------ | ---------------------------------------- |
| `auth.login.otp.success` | Khi xác minh OTP thành công và cấp token |
| `auth.login.otp.failed`  | Khi OTP sai, hết hạn hoặc hết lượt thử   |

#### 🔐 Ghi chú bảo mật

* Mỗi OTP chỉ được sử dụng một lần.
* Số lần thử sai bị giới hạn (thường 5 lần / 10 phút).
* Tất cả các hành vi sai đều được ghi vào audit để phân tích bất thường.
* `client_ip` và `user_agent` được forward sang `token-service` và ghi lại trace/audit.

---

### 2.6. 🔐 POST /auth/login – Đăng nhập bằng Username/Password

Xác thực người dùng bằng tài khoản nội bộ (username & password). Sau khi xác minh:
1. Đồng bộ người dùng từ `user-service`.
2. Gọi `token-service` để phát hành access token & refresh token.

| Thuộc nhóm API | Local Login |
|----------------|-------------|

#### 📥 Request

- **URL:** `/auth/login`
- **Phương thức:** `POST`
- **Auth yêu cầu:** ❌ Không yêu cầu access token
- **Headers yêu cầu:**
  - `X-Tenant-ID`: Mã định danh tenant (bắt buộc)
  - `X-Request-ID` (khuyến nghị)
  - `User-Agent`, `X-Forwarded-For` (để audit)

##### 🔸 Request Body

```json
{
  "username": "ngocminh",
  "password": "hunter2",
  "client_ip": "192.168.1.10",
  "user_agent": "Mozilla/5.0"
}
```

| Trường       | Kiểu   | Bắt buộc | Mô tả                |
| ------------ | ------ | -------- | -------------------- |
| `username`   | string | ✅        | Tên đăng nhập nội bộ |
| `password`   | string | ✅        | Mật khẩu người dùng  |
| `client_ip`  | string | ✅        | IP client            |
| `user_agent` | string | ✅        | Chuỗi user agent     |

#### 📤 Response

```json
{
  "data": {
    "access_token": "<JWT>",
    "refresh_token": "<JWT>",
    "expires_in": 3600,
    "token_type": "bearer"
  },
  "meta": {
    "trace_id": "fb81d9e8-2740-4d92-8fa2-c7b17b5a328a",
    "timestamp": "2025-06-10T15:33:11Z",
    "additional": {
      "login_method": "local"
    }
  }
}
```

#### ❗️Các lỗi có thể gặp

| Mã lỗi                    | Mô tả                               |
| ------------------------- | ----------------------------------- |
| `auth.local_login_failed` | Sai username hoặc password          |
| `user.not_found`          | Không tìm thấy người dùng tương ứng |
| `token.issue_failed`      | Gọi `token-service` thất bại        |

#### 🧭 Audit Log

| Event                      | Khi nào ghi log         |
| -------------------------- | ----------------------- |
| `auth.login.local.success` | Đăng nhập thành công    |
| `auth.login.local.failed`  | Sai thông tin đăng nhập |

#### 🔐 Ghi chú bảo mật

* Password được mã hóa và so sánh bằng thuật toán an toàn (bcrypt/scrypt).
* Số lần login sai bị giới hạn để ngăn brute force.
* Không phản hồi lý do cụ thể khi đăng nhập thất bại (để tránh dò thông tin).
* Sau đăng nhập, `X-Login-Method: local` sẽ được forward sang các service.

---

### 2.7. 👤 Lấy thông tin người dùng hiện tại

```http
GET /me
```

| Mô tả            | Trích xuất thông tin người dùng từ access token |
| ---------------- | ----------------------------------------------- |
| Auth yêu cầu     | ✅ `Authorization: Bearer <access_token>`        |
| Headers bắt buộc | `Authorization`, `X-Tenant-ID`, `X-Trace-ID`    |
| Phân quyền       | `user.read.self` (đã gắn sẵn trong token)       |
| Response         |                                                 |

```json
{
  "data": {
    "user_id": "5f12e5...",
    "email": "abc@gmail.com",
    "name": "Nguyễn Văn A",
    "avatar_url": "https://...",
    "tenant_id": "vas-primary",
    "roles": ["teacher"],
    "permissions": ["user.read.self", "class.view"]
  },
  "meta": {
    "trace_id": "...",
    "timestamp": "..."
  }
}
```

\| Audit | Không cần ghi log (truy vấn thuần) |

---

#### ⚠️ Lưu ý kỹ thuật

* Token phải còn hiệu lực và có chữ ký hợp lệ từ `token-service`
* Auth Service **không gọi lại user-service**, mà chỉ decode token và enrich từ payload
* Các field như `roles`, `permissions` được trích từ claim `"x-rbac"` hoặc `"custom"` tùy hệ thống

---

#### 🧪 Tình huống kiểm thử

| Tình huống       | Kỳ vọng                                            |
| ---------------- | -------------------------------------------------- |
| Token hợp lệ     | Trả thông tin user đầy đủ                          |
| Token hết hạn    | `401 Unauthorized` với mã lỗi `auth.token_expired` |
| Token sai tenant | `403 Forbidden` với mã `auth.invalid_tenant`       |
| Thiếu trace\_id  | Sinh ngẫu nhiên và log cảnh báo                    |

---

### 2.8. 🛡 Kiểm tra tính hợp lệ của token

```http
GET /verify
```

| Mô tả            | Kiểm tra access token có hợp lệ không (chữ ký, hết hạn, issuer…) |
| ---------------- | ---------------------------------------------------------------- |
| Auth yêu cầu     | ✅ `Authorization: Bearer <access_token>`                         |
| Headers bắt buộc | `Authorization`, `X-Tenant-ID`, `X-Trace-ID`                     |
| Phân quyền       | `auth.verify.token` (đã có sẵn trong token)                      |
| Response         |                                                                  |

```json
{
  "data": {
    "valid": true,
    "user_id": "abc123",
    "tenant_id": "vas-primary",
    "issued_at": "2025-06-10T12:00:00Z",
    "expires_at": "2025-06-10T13:00:00Z",
    "roles": ["admin"],
    "permissions": ["rbac.manage"]
  },
  "meta": { ... }
}
```

\| Audit | Không cần ghi log |

---

#### ✅ Luồng xử lý

1. Parse access token từ header `Authorization`
2. Kiểm tra:

   * Chữ ký có hợp lệ?
   * Thời gian `exp`, `nbf`, `iat`
   * Issuer & audience có đúng không?
   * Revoked status (`jti`) → gọi `token-service` nếu cần (tùy môi trường)
3. Trích xuất thông tin user & tenant → trả về

---

#### ⚠️ Mã lỗi có thể gặp

| Mã lỗi                | Mô tả                                                |
| --------------------- | ---------------------------------------------------- |
| `auth.token_invalid`  | Token bị sửa, sai chữ ký                             |
| `auth.token_expired`  | Token hết hạn                                        |
| `auth.token_revoked`  | Token đã bị thu hồi (jti nằm trong danh sách revoke) |
| `auth.invalid_tenant` | Token không khớp với `X-Tenant-ID` yêu cầu           |

---

#### 🧪 Tình huống kiểm thử

| Tình huống    | Kết quả                                             |
| ------------- | --------------------------------------------------- |
| Token hợp lệ  | Trả `valid: true` và thông tin user                 |
| Token expired | Trả `valid: false`, mã lỗi `auth.token_expired`     |
| Token bị sửa  | Trả `401 Unauthorized`, mã lỗi `auth.token_invalid` |

---

📌 Endpoint này được dùng phổ biến bởi `api-gateway` để validate token trước khi forward request vào backend.

---

### 2.9. 🧭 Lấy danh sách nhà cung cấp xác thực

```http
GET /providers
```

| Mô tả        | Trả về metadata các `auth_provider_config` đang hoạt động cho tenant hiện tại |
| ------------ | ----------------------------------------------------------------------------- |
| Auth yêu cầu | ❌ Không                                                                       |
| Headers      | `X-Tenant-ID`, `X-Trace-ID`                                                   |
| Phân quyền   | Public                                                                        |
| Response     |                                                                               |

```json
{
  "data": [
    {
      "provider": "google",
      "client_id": "abc.apps.googleusercontent.com",
      "redirect_uri": "https://auth.truongvietanh.edu.vn/oauth2/callback",
      "scopes": ["email", "profile"],
      "is_active": true
    }
  ],
  "meta": { ... }
}
```

\| Audit | Không ghi log |

---

#### 🎯 Mục đích sử dụng

* Cho phép frontend render đúng nút "Đăng nhập với Google" với `client_id`, `redirect_uri` tương ứng
* Giúp quản trị viên xác minh cấu hình OAuth2 hiện tại qua Swagger / Postman

---

#### ⚠️ Lưu ý

* Mỗi tenant có thể có nhiều provider (hiện tại chỉ hỗ trợ `google`)
* Không trả về `client_secret` hoặc thông tin nhạy cảm khác
* Nếu `X-Tenant-ID` không hợp lệ → trả lỗi `auth.invalid_tenant`

---

#### 🧪 Tình huống kiểm thử

| Trường hợp                | Kỳ vọng                                                   |
| ------------------------- | --------------------------------------------------------- |
| Tenant có Google provider | Trả metadata đúng, không leak secret                      |
| Tenant không tồn tại      | Trả lỗi `auth.invalid_tenant`                             |
| Gọi thiếu `X-Tenant-ID`   | Trả lỗi `400 Bad Request` hoặc `403 Forbidden` tùy policy |

---

## 3. 🛠 Phụ lục: Header, Trace & Error Code

---

### 3.1. 🔗 Header chuẩn

| Header | Bắt buộc | Mô tả |
|--------|----------|-------|
| `Authorization` | ✅ nếu API yêu cầu login | Dạng `Bearer <access_token>` |
| `X-Tenant-ID`   | ✅ với mọi request đa tenant | Mã định danh tenant hiện hành |
| `X-Trace-ID`    | ✅ | UUID duy nhất cho mỗi request, phục vụ logging & tracing |
| `User-Agent`    | ❌ | (Khuyến nghị) Dùng để phân tích client & audit |
| `X-Forwarded-For` | ❌ | (Tuỳ chọn) IP thực của người dùng, hỗ trợ geo/audit |
| `X-Login-Method` | ❌ | Forwarded bởi Gateway, phản ánh phương thức login ban đầu (`google`, `otp`, `local`) |

> Mọi request đều nên gắn `X-Trace-ID` (nếu không có, hệ thống sẽ tự sinh và ghi log cảnh báo).

---

### 3.2. 🧪 Cấu trúc `trace_id`

- Dạng: UUID v4
- Sử dụng xuyên suốt các log dòng, audit, metric, và cả response body:

```json
{
  "meta": {
    "trace_id": "7f7b441c-943b-4a68-bf4f-5c3a5e312be5",
    "timestamp": "2025-06-10T15:35:00Z"
  }
}
```

---

### 3.3. ❗️ Namespace mã lỗi

Mọi lỗi đều tuân theo định dạng `auth.<namespace>`, ví dụ:

| Mã lỗi                       | Ý nghĩa                                           |
| ---------------------------- | ------------------------------------------------- |
| `auth.invalid_oauth_code`    | Google trả về code không hợp lệ hoặc đã hết hạn   |
| `auth.exchange_code_expired` | Mã trao đổi quá hạn hoặc đã sử dụng               |
| `auth.token_issue_failed`    | Không thể phát hành token từ `token-service`      |
| `auth.token_expired`         | Access token hết hạn                              |
| `auth.token_invalid`         | Token sai định dạng hoặc không có chữ ký đúng     |
| `auth.invalid_tenant`        | Tenant không tồn tại hoặc bị vô hiệu              |
| `auth.missing_authorization` | Thiếu header `Authorization`                      |
| `auth.login.failed`          | Đăng nhập thất bại (lý do sẽ ghi trong `details`) |
| `auth.otp_invalid`           | Mã OTP không đúng hoặc đã hết hạn                 |
| `auth.local_login_failed`    | Sai username hoặc password                        |

---

### 3.4. 📋 Mẫu phản hồi lỗi

```json
{
  "error": {
    "code": "auth.token_invalid",
    "message": "Token không hợp lệ hoặc đã bị sửa đổi",
    "details": []
  },
  "meta": {
    "trace_id": "c3d2...",
    "timestamp": "2025-06-10T15:44:00Z"
  }
}
```

> Lỗi sẽ luôn kèm `trace_id` để truy vết trong logs và audit-service.

---

### 3.5. 📉 ENUMs Dùng trong Auth Service

| Tên ENUM         | Giá trị hợp lệ                            | Mô tả |
|------------------|-------------------------------------------|-------|
| `auth_provider`  | `google`, `otp`, `local`                  | Phương thức xác thực người dùng |
| `otp_type`       | `phone`, `email`                          | Kênh gửi mã OTP |
| `grant_type`     | `google`, `otp`, `local`                  | Phương thức xác thực truyền vào `token-service` |
| `login_status`   | `success`, `failed`                       | Trạng thái login (ghi trong audit log) |
| `token_type`     | `bearer`                                  | Loại token được cấp |
| `error_namespace`| `auth`, `user`, `token`                   | Namespace của mã lỗi – phục vụ chuẩn hóa ErrorEnvelope |

📌 Ghi chú:

* Các giá trị enum phải được đồng bộ xuyên suốt trong OpenAPI Spec, trong `token-service`, và cả trong các dịch vụ sử dụng log/audit.
* Các field như `login_method`, `auth_provider`, `grant_type` đều sẽ được forward thông qua JWT claims hoặc header (`X-Login-Method`) để đảm bảo trace & audit đầy đủ.

---

### 3.6. 📋 Permission Code

Các permission dưới đây được sử dụng để kiểm soát truy cập các API của `auth-service/master` trong môi trường nội bộ hoặc dành cho admin. Các API login chính như `/auth/login`, `/auth/verify-otp`, `/oauth2/callback` là public nên không yêu cầu permission.

| Mã Permission                    | Mô tả                                  | Áp dụng cho API                  |
|----------------------------------|----------------------------------------|----------------------------------|
| `auth.otp.send`                 | Cho phép gửi mã OTP                    | `POST /auth/otp` (nếu cần giới hạn qua API Gateway) |
| `auth.user.login_via_local`     | Cho phép đăng nhập bằng tài khoản nội bộ | `POST /auth/login`             |
| `auth.user.login_via_otp`       | Cho phép đăng nhập bằng OTP            | `POST /auth/verify-otp`         |
| `auth.user.login_via_oauth2`    | Cho phép login qua Google OAuth2       | `GET /oauth2/callback`          |
| `auth.provider.admin.read`      | Xem danh sách nhà cung cấp OAuth2 cấu hình | `GET /providers`           |
| `auth.provider.admin.sync`      | Đồng bộ config OAuth2 với `user-service` | `POST /oauth2/callback` hoặc webhook nội bộ |

📌 Ghi chú:
- Trong môi trường production, các API login phổ biến **không nên yêu cầu RBAC**, nhưng vẫn nên khai báo permission code để thống nhất log/audit.
- Với các môi trường nhạy cảm hoặc cần bảo vệ kỹ hơn (như API test hoặc endpoint cấu hình), cần gán permission tương ứng tại Gateway.

---

### 3.7. 📟 HTTP Status Codes dùng chung

Bảng sau mô tả các mã trạng thái HTTP được sử dụng thống nhất trong toàn bộ `auth-service/master`. Việc chuẩn hóa này đảm bảo khả năng dự đoán hành vi và dễ tích hợp với frontend/client.

| Mã | Ý nghĩa ngữ nghĩa (semantics)          | Áp dụng trong trường hợp                                 |
|----|----------------------------------------|----------------------------------------------------------|
| `200 OK`           | Yêu cầu thành công               | Tất cả các API trả kết quả hợp lệ                        |
| `201 Created`      | Tạo mới thành công               | Không dùng trong auth-service (không có create entity)  |
| `400 Bad Request`  | Dữ liệu đầu vào không hợp lệ     | Thiếu field, sai format, enum không đúng, v.v.           |
| `401 Unauthorized` | Thiếu hoặc sai thông tin xác thực | Token không hợp lệ, OTP sai, password sai               |
| `403 Forbidden`    | Người dùng không có quyền truy cập | Khi JWT hợp lệ nhưng không có permission cần thiết      |
| `404 Not Found`    | Không tìm thấy tài nguyên        | Không tìm thấy người dùng tương ứng                     |
| `409 Conflict`     | Xung đột dữ liệu logic           | (Hiếm dùng trong auth-service)                          |
| `429 Too Many Requests` | Quá nhiều request trong thời gian ngắn | Gửi OTP liên tục, vượt giới hạn login                  |
| `500 Internal Server Error` | Lỗi không xác định phía server | Gọi `user-service`, `token-service` thất bại không mong đợi |
| `503 Service Unavailable` | Service tạm thời không hoạt động | Khi auth-service bị quá tải hoặc đang bảo trì           |

📌 Ghi chú:
- Tất cả các lỗi đều được bọc theo chuẩn `ErrorEnvelope`, với `code`, `message`, và `details`.
- Trace ID được đính kèm trong `meta.trace_id` để phục vụ truy vết (observability).
- Frontend nên xử lý theo logic mã lỗi (namespace + code), không phụ thuộc tuyệt đối vào HTTP status.

---

### 3.8. 🔖 Tài liệu tham chiếu:

* [Data Model](./data-model.md)
* [OpenAPI Spec](./openapi.yaml)
* [Design](./design.md)
* [`ADR-012`](../../../ADR/adr-012-response-structure.md)
* [`ADR-011`](../../../ADR/adr-011-api-error-format.md)
