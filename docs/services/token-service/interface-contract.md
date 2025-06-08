---
title: Token Service – Interface Contract
version: "1.1"
last_updated: "2025-06-08"
author: "DX VAS Team"
reviewed_by: "Stephen Le"
---
# 📄 Token Service – Interface Contract

Token Service cung cấp các API trung tâm để phát hành, làm mới, thu hồi và xác minh token (access/refresh/JWT) theo chuẩn của hệ thống DX-VAS.

---

## 📌 Tổng quan API

| Method | Endpoint                      | Mô tả                                     | Bảo mật | Ghi chú |
|--------|-------------------------------|-------------------------------------------|---------|--------|
| POST   | `/token`                      | Cấp token mới dựa trên thông tin người dùng | 🔒 Auth | Được gọi bởi `auth-service/sub` |
| POST   | `/token/refresh`             | Làm mới token bằng refresh token          | 🔒      | Gọi trực tiếp từ client |
| POST   | `/token/revoke`              | Thu hồi 1 token cụ thể hoặc theo `sub`    | 🔒      | Sử dụng Redis để blacklist `jti` |
| POST   | `/token/introspect`          | Kiểm tra tính hợp lệ của token            | 🔒 Internal | Sử dụng bởi `api-gateway` |
| GET    | `/.well-known/jwks.json`     | Trả về public keys để xác thực chữ ký JWT | 🔓 Public | Dùng cho các service verify token |

---

## ✅ 1. POST `/token`

### 🎯 Mục đích
Phát hành cặp token (`access_token`, `refresh_token`) mới cho user đã được xác thực trước đó, được gọi nội bộ bởi `auth-service/sub`.

---

### 🔐 Headers yêu cầu

| Tên Header       | Bắt buộc | Mô tả |
|------------------|----------|-------|
| `X-Request-ID`   | ✅        | ID truy vết request |
| `X-Tenant-ID`    | ✅        | Tenant tương ứng |
| `Content-Type`   | ✅        | `application/json` |
| `Authorization`  | ✅        | JWT từ `auth-service/sub`, dùng để xác thực danh tính `sub` |

---

### 📥 Request Body

```json
{
  "sub": "user-abc-uuid",
  "scope": "read:profile write:report",
  "session_metadata": {
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0",
    "device_type": "web",
    "device_model": "MacBookPro16,1",
    "os_version": "macOS 14.3",
    "app_version": "1.0.2"
  }
}
```

| Trường             | Bắt buộc | Kiểu DL | Mô tả                           |
| ------------------ | -------- | ------- | ------------------------------- |
| `sub`              | ✅        | string  | ID của user cần phát hành token |
| `scope`            | ⭕        | string  | Phạm vi quyền hạn của token     |
| `session_metadata` | ⭕        | object  | Metadata phiên đăng nhập        |

---

### 📤 Response

```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 3600
  },
  "meta": {
    "request_id": "req-uuid",
    "timestamp": "2025-06-07T14:35:00Z"
  }
}
```

---

### 📤 Response Headers

| Header         | Mô tả               |
| -------------- | ------------------- |
| `X-Request-ID` | Echo lại ID request |
| `X-Tenant-ID`  | Echo lại tenant     |

---

### 🧪 Response Example (200)

```http
HTTP/1.1 200 OK
X-Request-ID: abc123
X-Tenant-ID: vas-001
Content-Type: application/json

{
  "data": {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "eyJhbGciOi...",
    "token_type": "Bearer",
    "expires_in": 3600
  },
  "meta": {
    "request_id": "abc123",
    "timestamp": "2025-06-07T14:35:00Z"
  }
}
```

---

### ❌ Error Responses

| HTTP | code                    | message                        |
| ---- | ----------------------- | ------------------------------ |
| 400  | `auth.token.invalid`    | Token yêu cầu không hợp lệ     |
| 401  | `auth.unauthorized`     | Không có quyền phát hành token |
| 403  | `auth.tenant.mismatch`  | Tenant không khớp với user     |
| 422  | `auth.input.invalid`    | Dữ liệu không hợp lệ           |
| 500  | `internal.server.error` | Lỗi hệ thống nội bộ            |

> ❗ **Note**: Tất cả lỗi đều trả về dưới dạng `ErrorEnvelope` theo [ADR-011](../../ADR/adr-011-api-error-format.md)

---

Dưới đây là phần chi tiết hóa cho **"## ✅ 2. POST `/token/refresh`"**, đảm bảo:

* Đáp ứng chuẩn 5★ Interface Contract Standard
* Phù hợp với thiết kế `03-cr-token-service.md` và `auth-service/sub`
* Bao gồm headers, body, response, error, ví dụ cụ thể

---

## ✅ 2. POST `/token/refresh`

### 🎯 Mục đích
Phát hành cặp token mới dựa trên `refresh_token` hợp lệ. API này cho phép client duy trì đăng nhập mà không cần nhập lại mật khẩu. Được gọi trực tiếp từ client (mobile/web app) hoặc từ `auth-service/sub`.

---

### 🔐 Headers yêu cầu

| Tên Header       | Bắt buộc | Mô tả |
|------------------|----------|-------|
| `X-Request-ID`   | ✅        | ID truy vết request |
| `X-Tenant-ID`    | ✅        | Tenant hiện hành |
| `Content-Type`   | ✅        | `application/json` |
| `Authorization`  | ✅        | `Bearer <refresh_token>` – được cấp từ lần đăng nhập trước |

---

### 📥 Request Body

```json
{
  "session_id": "session-abc-uuid"
}
```

| Trường       | Bắt buộc | Kiểu DL | Mô tả                      |
| ------------ | -------- | ------- | -------------------------- |
| `session_id` | ✅        | string  | ID phiên cần làm mới token |

---

### 📤 Response

```json
{
  "data": {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "eyJhbGciOi...",
    "token_type": "Bearer",
    "expires_in": 3600
  },
  "meta": {
    "request_id": "abc123",
    "timestamp": "2025-06-07T15:00:00Z"
  }
}
```

---

### 📤 Response Headers

| Header         | Mô tả               |
| -------------- | ------------------- |
| `X-Request-ID` | Echo lại ID request |
| `X-Tenant-ID`  | Echo lại tenant     |

---

### 🧪 Response Example (200)

```http
HTTP/1.1 200 OK
X-Request-ID: abc123
X-Tenant-ID: vas-001
Content-Type: application/json

{
  "data": {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "eyJhbGciOi...",
    "token_type": "Bearer",
    "expires_in": 3600
  },
  "meta": {
    "request_id": "abc123",
    "timestamp": "2025-06-07T15:00:00Z"
  }
}
```

---

### ❌ Error Responses

| HTTP | code                     | message                                    |
| ---- | ------------------------ | ------------------------------------------ |
| 400  | `auth.refresh.invalid`   | Token refresh không hợp lệ hoặc đã hết hạn |
| 401  | `auth.unauthorized`      | Không có quyền làm mới token               |
| 403  | `auth.session.revoked`   | Phiên đã bị thu hồi hoặc bị chặn           |
| 404  | `auth.session.not_found` | Không tìm thấy phiên tương ứng             |
| 422  | `auth.input.invalid`     | Dữ liệu đầu vào không hợp lệ               |
| 500  | `internal.server.error`  | Lỗi hệ thống                               |

> ❗ **Ghi chú:** Đáp ứng chuẩn [ADR-011 - Error Format](../../ADR/adr-011-api-error-format.md)

---

Dưới đây là phần chi tiết hóa cho **"## ✅ 3. POST `/token/revoke`"**, đảm bảo:

* Tuân thủ nghiêm ngặt **ADR-006**, **ADR-004**, **ADR-011**
* Theo chuẩn **5★ Interface Contract Standard**
* Rõ ràng và đủ thông tin cho cả frontend lẫn backend

---

## ✅ 3. POST `/token/revoke`

### 🎯 Mục đích
Thu hồi một phiên đăng nhập (session) cụ thể, chấm dứt hiệu lực của cả access token và refresh token tương ứng.  
API này được sử dụng khi người dùng chủ động đăng xuất khỏi một thiết bị cụ thể hoặc toàn bộ hệ thống.

---

### 🔐 Headers yêu cầu

| Tên Header       | Bắt buộc | Mô tả |
|------------------|----------|-------|
| `X-Request-ID`   | ✅        | ID truy vết request |
| `X-Tenant-ID`    | ✅        | Tenant hiện hành |
| `Content-Type`   | ✅        | `application/json` |
| `Authorization`  | ✅        | Access Token hợp lệ để xác định `sub` thực hiện yêu cầu |

---

### 📥 Request Body

```json
{
  "session_id": "session-abc-uuid"
}
```

| Trường       | Bắt buộc | Kiểu DL | Mô tả                    |
| ------------ | -------- | ------- | ------------------------ |
| `session_id` | ✅        | string  | ID của phiên cần thu hồi |

---

### 📤 Response (204 No Content)

```http
HTTP/1.1 204 No Content
X-Request-ID: abc123
X-Tenant-ID: vas-001
```

✅ Không có response body nếu thành công. Phản hồi `204` thể hiện rằng session đã được thu hồi (hoặc không tồn tại nhưng xử lý idempotent).

---

### ❌ Error Responses

| HTTP | code                     | message                              |
| ---- | ------------------------ | ------------------------------------ |
| 400  | `auth.revoke.invalid`    | Dữ liệu yêu cầu không hợp lệ         |
| 401  | `auth.unauthorized`      | Không có quyền thu hồi phiên         |
| 403  | `auth.session.forbidden` | Session không thuộc về user hiện tại |
| 404  | `auth.session.not_found` | Không tìm thấy session được yêu cầu  |
| 500  | `internal.server.error`  | Lỗi hệ thống nội bộ                  |

> ❗ **Note:** Mọi lỗi đều sử dụng chuẩn `ErrorEnvelope` từ [ADR-011](../../ADR/adr-011-api-error-format.md)

---

Dưới đây là phần chi tiết hóa cho **"## ✅ 4. POST `/token/introspect`"**, tuân thủ đầy đủ tiêu chuẩn:

* Chuẩn hóa theo **ADR-006**, **ADR-011**
* Đảm bảo chuẩn **5★ Interface Contract Standard**
* Hữu ích cho internal services, API Gateway, hoặc frontend debug mode

---

## ✅ 4. POST `/token/introspect`

### 🎯 Mục đích
Kiểm tra tính hợp lệ của một access token hoặc refresh token. Trả về metadata nếu hợp lệ, hoặc trạng thái `active: false` nếu không hợp lệ.  
API được dùng chủ yếu bởi các hệ thống backend như API Gateway hoặc các service phụ trợ muốn xác minh thông tin token (khi không dùng JWKS trực tiếp).

---

### 🔐 Headers yêu cầu

| Tên Header       | Bắt buộc | Mô tả |
|------------------|----------|-------|
| `X-Request-ID`   | ✅        | ID truy vết request |
| `X-Tenant-ID`    | ✅        | Tenant hiện hành |
| `Content-Type`   | ✅        | `application/json` |
| `Authorization`  | ✅        | Access token có quyền introspect token (thường là hệ thống nội bộ) |

---

### 📥 Request Body

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

| Trường  | Bắt buộc | Kiểu DL | Mô tả                  |
| ------- | -------- | ------- | ---------------------- |
| `token` | ✅        | string  | JWT token cần kiểm tra |

---

### 📤 Response (200 OK)

Trường `active` cho biết token có hợp lệ không. Nếu `active: false`, các trường còn lại có thể rỗng hoặc không tồn tại.

```json
{
  "active": true,
  "sub": "user-123",
  "aud": "dx-vas",
  "exp": 1711111111,
  "iat": 1711100000,
  "scope": "read write",
  "token_type": "access",
  "session_id": "session-abc-uuid",
  "client_id": "frontend-app",
  "meta": {
    "device_type": "web",
    "ip_address": "192.168.1.10",
    "user_agent": "Mozilla/5.0"
  }
}
```

| Trường       | Mô tả                                     |
| ------------ | ----------------------------------------- |
| `active`     | Token hợp lệ (`true`) hay không (`false`) |
| `sub`        | ID người dùng                             |
| `exp`, `iat` | Thời điểm hết hạn / phát hành             |
| `token_type` | access / refresh                          |
| `session_id` | Gắn với bảng `auth_sessions`              |
| `meta`       | Dữ liệu bổ sung (IP, thiết bị, agent...)  |

---

### ❌ Error Responses

| HTTP | code                      | message                         |
| ---- | ------------------------- | ------------------------------- |
| 400  | `auth.introspect.invalid` | Token đầu vào không hợp lệ      |
| 401  | `auth.unauthorized`       | Không có quyền introspect token |
| 500  | `internal.server.error`   | Lỗi hệ thống                    |

> ❗ API trả về `200 OK` với `active: false` nếu token không hợp lệ – không trả về `401` để đảm bảo không tiết lộ thông tin cho attacker.

---

Dưới đây là phần chi tiết hóa cho **"## ✅ 5. GET `/.well-known/jwks.json`"**, đảm bảo:

* Tuân thủ các tiêu chuẩn **OAuth 2.0**, **OIDC Discovery**, và **ADR-006**
* Được sử dụng rộng rãi cho việc xác thực chữ ký JWT từ các hệ thống bên ngoài hoặc nội bộ

---

## ✅ 5. GET `/.well-known/jwks.json`

### 🎯 Mục đích
Cung cấp danh sách public key hiện hành dùng để xác minh chữ ký JWT do `token-service` phát hành.  
Endpoint này phục vụ cho việc **verify token phía client**, API Gateway, hoặc các service khác thông qua `kid` trong header của JWT.

---

### 🔓 Authorization

- ❌ **Không yêu cầu xác thực**
- ✅ **Public endpoint**, có thể được truy cập bởi bất kỳ hệ thống nào cần verify chữ ký

---

### 📤 Response (200 OK)

```json
{
  "keys": [
    {
      "kty": "RSA",
      "kid": "2024-rotation-1",
      "use": "sig",
      "alg": "RS256",
      "n": "uA6kkl5e8fKNS3k0_4ZFnN...",
      "e": "AQAB"
    },
    {
      "kty": "RSA",
      "kid": "2023-fallback",
      "use": "sig",
      "alg": "RS256",
      "n": "zN9uhNfUJ73hdJs0_qlmv...",
      "e": "AQAB"
    }
  ]
}
```

| Trường   | Mô tả                                            |
| -------- | ------------------------------------------------ |
| `kid`    | Key ID – dùng để khớp với `kid` trong JWT header |
| `alg`    | Thuật toán chữ ký – thường là `RS256`            |
| `kty`    | Loại key, ví dụ `RSA`                            |
| `use`    | Mục đích – ở đây là `"sig"` để ký token          |
| `n`, `e` | Thành phần của public key (modulus và exponent)  |

---

### ♻️ Rotation và cache

* Các public key sẽ được xoay vòng định kỳ theo chính sách từ [03-cr-token-service.md](../../03-cr-token-service.md)
* Thời gian cache: `max-age=3600` (1h) khuyến nghị để tránh gọi lại liên tục

```http
Cache-Control: public, max-age=3600
Content-Type: application/json
```

---

### ✅ Ứng dụng

* Các service hoặc gateway chỉ cần lấy public key từ endpoint này và lưu vào cache.
* Sử dụng thư viện xác thực JWT (như `jsonwebtoken`, `pyjwt`, `jose`) để verify chữ ký dựa trên `kid`.

---

### 🔐 Ghi chú về `/jwks.json` và Caching Strategy

- Endpoint `/.well-known/jwks.json` là **public**, không yêu cầu xác thực, và được các service khác sử dụng để **verify chữ ký JWT**.

- Để **tăng hiệu suất và giảm tải** cho `token-service`, trong môi trường **Production**, endpoint này **nên được cache bởi Public API Gateway hoặc CDN (như Cloudflare, Cloud CDN)**.

#### 🔄 Gợi ý cấu hình caching:

| Header              | Giá trị đề xuất                 | Mô tả                                 |
|---------------------|-------------------------------|----------------------------------------|
| `Cache-Control`     | `public, max-age=3600`         | Cho phép cache trong 1 giờ            |
| `ETag`              | `"<fingerprint>"`              | Cho phép client check bằng `If-None-Match` |
| `Last-Modified`     | `ISO timestamp`                | Hỗ trợ cache theo thời gian cập nhật  |

> 🔐 JWKS chỉ nên thay đổi khi rotate public keys. Khi đó cần `purge cache` hoặc invalidate.

---

📌 Nếu triển khai trên **GCP API Gateway**, bạn có thể dùng cấu hình `x-google-backend.cacheControl` hoặc gắn cache layer riêng tại Cloud CDN.

```yaml
paths:
  /.well-known/jwks.json:
    get:
      summary: JWKS public keys
      responses:
        '200':
          headers:
            Cache-Control:
              schema:
                type: string
              example: public, max-age=3600
```

---

## 📎 ENUM sử dụng

Trong quá trình thiết kế API của `token-service`, một số enum đã được chuẩn hóa để đảm bảo tính rõ ràng, mở rộng và hỗ trợ tốt cho UI/UX, kiểm thử và i18n. Dưới đây là danh sách các enum đang được sử dụng.

---

### 1. `token_type`

| Giá trị     | Mô tả                                           |
|-------------|--------------------------------------------------|
| `access`    | Token truy cập, có thời hạn ngắn (~15 phút)     |
| `refresh`   | Token làm mới, dùng để lấy access token mới     |

> 🔐 Enum này được dùng trong response của `/token/introspect` để phân biệt loại token đang được kiểm tra.

---

### 2. `grant_type`

| Giá trị       | Mô tả                                                     |
|---------------|------------------------------------------------------------|
| `password`    | Đăng nhập qua email/password truyền thống                 |
| `refresh_token` | Làm mới token thông qua refresh token                    |
| `jwt_bearer`  | Grant flow nội bộ sử dụng JWT đã được xác thực trước đó   |

> 🔄 Enum này giúp mở rộng cho các luồng xác thực OAuth2 trong tương lai.

---

### 3. `device_type`

| Giá trị    | Mô tả                            |
|------------|----------------------------------|
| `web`      | Trình duyệt web thông thường     |
| `android`  | Thiết bị Android                 |
| `ios`      | Thiết bị iOS                     |

> 📱 Được dùng trong metadata của `auth_sessions` và introspection response để phục vụ thống kê, cảnh báo bảo mật, và phân tích hành vi người dùng.

---

### 4. `session_status` (dự phòng cho mở rộng tương lai)

| Giá trị     | Mô tả |
|-------------|------|
| `active`    | Phiên đang hoạt động và có thể sử dụng |
| `revoked`   | Phiên đã bị thu hồi bởi người dùng hoặc hệ thống |
| `expired`   | Phiên đã hết hạn theo thời gian cấu hình |

> ⏳ Enum này sẽ hữu ích nếu hệ thống mở rộng logic quản lý session nâng cao.

---

## 📎 Permission Mapping

Mặc dù `token-service` không trực tiếp quản lý người dùng hoặc phân quyền truy cập tài nguyên, nhưng vẫn cần định nghĩa rõ các quyền (permissions) áp dụng cho các hệ thống gọi đến các endpoint đặc thù như introspect hoặc revoke. Điều này đảm bảo kiểm soát truy cập, tuân thủ nguyên tắc Principle of Least Privilege (ADR-004, ADR-006, ADR-007).

---

### 🔒 Các permission áp dụng cho `token-service`

| Permission Key             | Mô tả                                                     | Endpoint yêu cầu |
|----------------------------|------------------------------------------------------------|------------------|
| `token.generate`           | Cho phép tạo access token / refresh token (nội bộ)         | `POST /token`    |
| `token.refresh`            | Cho phép làm mới access token thông qua refresh token      | `POST /token/refresh` |
| `token.revoke`             | Cho phép thu hồi (revoke) một session token cụ thể        | `POST /token/revoke` |
| `token.introspect`         | Cho phép kiểm tra thông tin và trạng thái của token        | `POST /token/introspect` |
| `token.jwks.read`          | Quyền public, không cần auth – dùng cho `GET /.well-known/jwks.json` | ❌ (public) |

> 📌 Trong hầu hết các trường hợp, `token-service` hoạt động như service nội bộ nên các quyền này được kiểm tra bằng service-to-service authentication (JWT có embedded scope/permission claim).

---

### 🧩 Ví dụ cấu trúc claim `permissions` trong access token:

```json
{
  "sub": "user-abc-123",
  "scope": "read write",
  "permissions": [
    "user.read",
    "token.introspect",
    "token.revoke"
  ],
  "aud": "dx-vas",
  "exp": 1712345678
}
```

---

### ✅ Áp dụng trong OpenAPI

Mỗi operation trong `openapi.yaml` nên khai báo custom field:

```yaml
x-required-permission: token.introspect
```

Hoặc nếu operation không cần quyền cụ thể (ví dụ: `/.well-known/jwks.json`) thì **không cần khai báo permission**.

---

## 🛡️ Error Codes & Envelope

Tất cả lỗi được trả về dưới dạng chuẩn `ErrorEnvelope` (ADR-011), đảm bảo nhất quán trong toàn hệ thống.

```json
{
  "error": {
    "code": "token.expired",
    "message": "Token has expired"
  },
  "meta": {
    "request_id": "a1b2c3",
    "timestamp": "2025-06-07T10:30:00Z"
  }
}
```

### 🔒 Bảng mã lỗi chi tiết

| Mã lỗi (`error.code`)      | Mô tả                                                  | HTTP Status | Áp dụng cho endpoint         |
| -------------------------- | ------------------------------------------------------ | ----------- | ---------------------------- |
| `token.invalid`            | Access token không hợp lệ                              | 401         | `/token/introspect`          |
| `token.expired`            | Token đã hết hạn                                       | 401         | `/token/refresh`, introspect |
| `token.revoked`            | Token đã bị thu hồi                                    | 401         | `/token/refresh`, introspect |
| `token.unknown_jti`        | Token không nằm trong danh sách thu hồi                | 400         | `/token/revoke`              |
| `session.not_found`        | Không tìm thấy phiên đăng nhập                         | 404         | `/token/revoke`              |
| `session.inactive`         | Phiên đăng nhập đã bị hủy                              | 403         | `/token/refresh`, `/revoke`  |
| `jwks.not_found`           | Không tìm thấy khoá công khai JWKS                     | 500         | `/.well-known/jwks.json`     |
| `common.validation_failed` | Dữ liệu gửi lên không hợp lệ                           | 400         | Mọi endpoint `POST`          |
| `common.missing_param`     | Thiếu tham số bắt buộc (`grant_type`, `refresh_token`) | 400         | `/token`, `/refresh`         |
| `common.unauthorized`      | Thiếu token hoặc token không hợp lệ                    | 401         | Tất cả endpoint bảo vệ       |
| `common.forbidden`         | Không đủ quyền thực hiện hành động                     | 403         | Theo `x-required-permission` |
| `common.internal_error`    | Lỗi không xác định từ phía server                      | 500         | Mọi endpoint                 |

---

📌 **Mọi lỗi đều trả về kèm `X-Request-ID` trong response headers** và được ghi log (audit + cloud logging).

---

## 📝 Ví dụ Curl

Dưới đây là các ví dụ `curl` minh họa cách sử dụng các API chính của `token-service`. Các ví dụ này dùng để kiểm thử nhanh, tích hợp CI pipeline, hoặc hướng dẫn frontend/backend team tích hợp.

---

### 🔑 1. Đăng nhập để lấy token mới

```bash
curl -X POST https://api.dxvas.edu.vn/token \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: req-001" \
  -H "X-Tenant-ID: vas-truongvietanh" \
  -d '{
    "grant_type": "password",
    "email": "student01@example.edu.vn",
    "password": "abc123456"
  }'
```

📌 *Trả về access\_token + refresh\_token nếu hợp lệ.*

---

### ♻️ 2. Làm mới token

```bash
curl -X POST https://api.dxvas.edu.vn/token/refresh \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: req-002" \
  -H "X-Tenant-ID: vas-truongvietanh" \
  -d '{
    "refresh_token": "eyJhbGciOiJIUzI1NiIsIn..."
  }'
```

📌 *Trả về cặp token mới nếu refresh token hợp lệ.*

---

### 🛑 3. Thu hồi token (logout toàn bộ thiết bị)

```bash
curl -X POST https://api.dxvas.edu.vn/token/revoke \
  -H "Authorization: Bearer <access_token>" \
  -H "X-Request-ID: req-003" \
  -H "X-Tenant-ID: vas-truongvietanh" \
  -d '{}'
```

📌 *Thu hồi session hiện tại (access + refresh token).*

---

### 🧐 4. Kiểm tra token (introspect)

```bash
curl -X POST https://api.dxvas.edu.vn/token/introspect \
  -H "Authorization: Bearer <access_token>" \
  -H "X-Request-ID: req-004" \
  -H "X-Tenant-ID: vas-truongvietanh" \
  -d '{
    "token": "eyJhbGciOiJIUzI1NiIsIn..."
  }'
```

📌 *Trả về thông tin token, trạng thái (active/revoked/expired), claims.*

---

### 🔐 5. Lấy JWKS key

```bash
curl -X GET https://api.dxvas.edu.vn/.well-known/jwks.json
```

📌 *Trả về public key JWKS để hệ thống khác verify chữ ký JWT.*

---

### 🧪 Ghi chú

* `X-Request-ID` là bắt buộc để trace log.
* `X-Tenant-ID` giúp multi-tenant isolation (bắt buộc).
* Bạn có thể test JWT validity với [jwt.io](https://jwt.io).
* Token mẫu để test có thể lấy từ Auth Web hoặc Dev Tool gắn với `auth-service`.

---

## 📚 Tài liệu liên quan

* [Design](./design.md)
* [Data Model](./data-model.md)
* [OpenAPI Spec](./openapi.yaml)
* [ADR - 006 Auth Strategy](../../ADR/adr-006-auth-strategy.md)
* [ADR - 004 Security](../../ADR/adr-004-security.md)
