---
title: API Gateway – Interface Contract
version: "2.1"
last_updated: "2025-06-11"
author: "DX VAS Team"
reviewed_by: "Stephen Le"
---
# 📘 API Gateway – Interface Contract

Tài liệu này mô tả cách API Gateway xử lý request đến các backend service trong hệ sinh thái DX-VAS thông qua cơ chế định tuyến động, kiểm soát phân quyền (RBAC), xác thực JWT và chuẩn hóa lỗi.  
Gateway không chứa logic nghiệp vụ nhưng đóng vai trò quan trọng trong việc bảo vệ, quan sát và kiểm soát toàn bộ luồng request.

📌 **Phạm vi:**
- Định tuyến và xác thực request từ frontend đến các service backend dựa trên route config.
- Thực hiện kiểm tra phân quyền theo permission đã được resolve từ `user-sub`.
- Chuẩn hóa toàn bộ lỗi theo `ADR-011` và phản hồi thành công theo `ADR-012`.

👥 **Đối tượng sử dụng:**  
Superadmin Webapp, Admin Webapp, Customer Portal, các adapter và automation script nội bộ.

---

## 1. 🔧 Nguyên tắc chung khi sử dụng API

### 1.1. Xác thực và Trace

- Mọi request đến Gateway (trừ các route `public`) đều yêu cầu header:
```

Authorization: Bearer <JWT>

```
- Gateway sẽ xác thực JWT thông qua JWKS (do `token-service` cung cấp).
- Header `x-trace-id` là tùy chọn từ phía client; nếu không có, Gateway sẽ tự động sinh một UUID v4.
- Mỗi response (kể cả lỗi) sẽ bao gồm `meta.trace_id` để phục vụ trace toàn hệ thống.

---

### 1.2. Header forward mặc định đến backend

Gateway sẽ tự động thêm các header sau vào request gửi đến backend:

| Header          | Mục đích                                  |
|------------------|--------------------------------------------|
| `X-Trace-ID`     | Mã định danh trace xuyên suốt toàn hệ thống |
| `X-User-ID`      | Định danh người dùng, lấy từ JWT claim     |
| `X-Tenant-ID`    | Tenant hiện hành, lấy từ JWT hoặc header gốc |
| `X-Permissions`  | Danh sách quyền (nếu cần), resolved từ cache |
| `X-Service`      | Tên backend được định tuyến (ghi log/tracing) |
| `X-Login-Method` | Phương thức đăng nhập: `otp`, `oauth2`, `password` |

> ⚠️ Backend cần tin tưởng các header này là hợp lệ và đã được Gateway kiểm tra.

---

### 1.3. Xử lý lỗi thống nhất theo ADR-011

- Các lỗi từ backend nếu không tuân `ErrorEnvelope` sẽ được Gateway chuẩn hóa lại.
- Gateway có thể tự sinh lỗi (403/401/500) nếu thất bại trong các bước kiểm tra token, RBAC, hoặc điều kiện `x-condition`.

Ví dụ response lỗi chuẩn hóa:
```json
{
"meta": {
  "code": 403,
  "message": "FORBIDDEN",
  "error_type": "rbac.condition_failed",
  "trace_id": "abc-123",
  "service": "api-gateway",
  "timestamp": "2025-06-10T12:34:56Z"
},
"error": {
  "reason": "Access denied due to condition mismatch",
  "details": null
}
}
```

---

### 1.4. Kết quả thành công

* Nếu backend đã trả response theo chuẩn `ADR-012`, Gateway sẽ giữ nguyên.
* Nếu backend trả kiểu `raw`, Gateway vẫn bọc vào `meta + data` để frontend luôn xử lý thống nhất.

---

### 1.5. Lưu ý về phân quyền

* Các permission được resolve theo Redis key `rbac:{user_id}:{tenant_id}`.
* Nếu không có trong cache → Gateway gọi `user-sub` để lấy quyền thật.
* Điều kiện `x-condition` trong route config (nếu có) sẽ được đánh giá tại thời điểm runtime.

> 📌 Tất cả hành vi liên quan đến phân quyền đều được ghi log kèm trace\_id và kết quả kiểm tra.

---

## 2. 📌 API

API Gateway không cung cấp các endpoint nghiệp vụ cố định như các service khác.  
Thay vào đó, nó sử dụng **cơ chế định tuyến động** (dynamic routing) để chuyển tiếp mọi request từ client đến các backend service, dựa trên **route configuration** được nạp từ file JSON hoặc service discovery.

### 2.1. ✅ Cách hoạt động

Khi client gửi một request đến một path cụ thể (ví dụ `/users/{id}` hoặc `/auth/login`), Gateway sẽ:

1. **Ánh xạ** path và method với cấu hình định tuyến (route config).
2. **Xác thực** token JWT (nếu không phải route `public`).
3. **Kiểm tra permission** từ cache RBAC hoặc gọi `user-sub`.
4. **Đánh giá điều kiện** `x-condition` (nếu được định nghĩa).
5. **Chuyển tiếp (proxy)** request đến backend tương ứng.
6. **Ghi log + trace + metrics** tại mọi bước.
7. **Trả về kết quả** hoặc lỗi đã chuẩn hóa theo ADR-011/ADR-012.

---

### 2.2. 🌐 Endpoint duy nhất

- Gateway chỉ expose một endpoint duy nhất xử lý mọi loại path và method:

```http
ANY /<path>
```

Ví dụ:

* `GET /users` → proxy tới `user-service.master`
* `POST /auth/login` → proxy tới `auth-service.master`
* `GET /reports/summary` → proxy tới `report-service.master`

Mọi định tuyến, permission và backend mapping được điều khiển bởi file `route_config.json`.

> 🔍 Chi tiết từng luồng định tuyến và điều kiện được mô tả trong mục tiếp theo.

---

### 2.3. 🔁 Luồng xử lý định tuyến (Route Evaluation Flow)

Khi một request đi qua API Gateway, hệ thống sẽ thực hiện một chuỗi các bước kiểm tra và định tuyến theo cấu hình động. Dưới đây là luồng xử lý chuẩn hoá cho mọi request:

---

#### 🧭 Các bước xử lý

1. **Nhận request**
   - Gateway tiếp nhận request từ client tại path bất kỳ.
   - Header `Authorization` và `x-trace-id` được ghi nhận (hoặc sinh mới nếu thiếu).

2. **Tìm route tương ứng**
   - Dựa trên `path + method`, Gateway truy vấn route từ `route_config.json`.
   - Nếu không tìm thấy cấu hình phù hợp → trả lỗi `404 Not Found`.

3. **Xác thực JWT**
   - Nếu route không đánh dấu là `public`, Gateway sẽ xác thực JWT:
     - Check chữ ký bằng JWKS từ `token-service`
     - Check token đã bị thu hồi qua Redis key `revoked:{jti}`
     - Nếu JWT hợp lệ, Gateway trích xuất các trường quan trọng như `sub`, `tenant`, và `login_method` để forward cho backend.
     - Nếu không có trong cache → gọi `/token/introspect`

4. **Phân quyền RBAC**
   - Nếu route yêu cầu permission (`x-required-permission`) → truy xuất permission từ Redis `rbac:{user_id}:{tenant_id}`.
   - Nếu cache miss → gọi `user-sub` để resolve rồi cache lại.
   - Nếu permission không tồn tại → trả `403 Forbidden` với `error_type: rbac.permission_denied`.

5. **Đánh giá điều kiện RBAC**
   - Nếu route có `x-condition`, Gateway sẽ:
     - Parse điều kiện dạng JSON (VD: `{"user_id": "{{X-User-ID}}"}`)
     - Bind runtime từ request headers/path/body
     - So sánh điều kiện → nếu không đạt → trả lỗi `403 Forbidden` với `error_type: rbac.condition_failed`.

6. **Gửi request đến backend**
   - Request được proxy tới `backend_service` đã định nghĩa trong route config.
   - Forward đầy đủ các headers chuẩn: `X-Trace-ID`, `X-User-ID`, `X-Tenant-ID`, `X-Service`, v.v.

7. **Xử lý phản hồi**
   - Nếu backend trả lỗi không theo chuẩn ADR-011 → Gateway tự động map lỗi lại đúng format.
   - Mọi response (kể cả lỗi) đều có `meta.trace_id`, `meta.service`, `meta.timestamp`.

8. **Ghi log và metrics**
   - Log hành vi RBAC (pass/fail), condition, backend response, duration.
   - Tăng counter Prometheus tương ứng (vd: `api_gateway_permission_denied_total`, `api_gateway_request_duration_seconds`, ...)

---

> ✅ Toàn bộ chuỗi xử lý này đảm bảo mọi request đi qua Gateway được trace, log và enforce chuẩn hoá tuyệt đối.

---

### 2.4. 📥 Chi tiết endpoint: ALL /<path>

Đây là endpoint duy nhất và mặc định của API Gateway. Mọi request đến bất kỳ URL nào sẽ được xử lý và định tuyến thông qua endpoint này, dựa vào file `route_config.json`.

---

#### 🧩 Định dạng

```http
ALL /<path>
```

* `<path>`: là đường dẫn bất kỳ như `/users`, `/auth/login`, `/reports/summary`, v.v.
* Method: Hỗ trợ tất cả các HTTP methods (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `HEAD`, `OPTIONS`)

---

#### 🔐 Yêu cầu về Header

| Header           | Bắt buộc | Ghi chú                                                                       |
| ---------------- | -------- | ----------------------------------------------------------------------------- |
| `Authorization`  | Có       | Với route không phải `public`; dạng `Bearer <JWT>`                            |
| `x-trace-id`     | Không    | Nếu không có, Gateway sẽ sinh tự động                                         |
| `Content-Type`   | Có       | `application/json` nếu có body                                                |
| (auto forward)   | —        | `X-User-ID`, `X-Tenant-ID`, `X-Service`, `X-Permissions` được Gateway tự thêm |
| `X-Login-Method` | Không    | Forward bởi Gateway nếu có, ví dụ: `otp`, `oauth2`                            |

---

#### ⚙️ Hành vi xử lý

1. Ánh xạ path & method sang cấu hình trong `route_config.json`
2. Nếu không có route phù hợp → 404 Not Found
3. Xác thực token JWT nếu không phải route `public`
4. Kiểm tra revoked token → fallback `token-service/introspect` nếu cần
5. Kiểm tra `x-required-permission` (nếu có)
6. Đánh giá `x-condition` (nếu có)
7. Proxy request tới backend service
8. Chuẩn hóa response lỗi theo ADR-011 nếu backend không tuân

---

#### 📦 Ví dụ route config

```json
{
  "/users/**": {
    "method": ["GET", "POST"],
    "backend": "user-service.master",
    "x-required-permission": "user.read",
    "x-condition": {
      "tenant_id": "{{X-Tenant-ID}}"
    },
    "timeout": 3000,
    "retry": 2
  }
}
```

---

#### 📤 Response thành công (200)

```json
{
  "meta": {
    "code": 200,
    "message": "SUCCESS",
    "trace_id": "abc-123",
    "service": "api-gateway",
    "timestamp": "2025-06-10T12:34:56Z"
  },
  "data": {
    "user_id": "u001",
    "name": "Alice"
  }
}
```

---

#### ❌ Response lỗi chuẩn hoá

* **Token bị thu hồi**:

```json
{
  "meta": {
    "code": 401,
    "message": "UNAUTHORIZED",
    "error_type": "auth.token_revoked",
    "trace_id": "abc-123",
    "service": "api-gateway",
    "timestamp": "2025-06-10T12:34:56Z"
  },
  "error": {
    "reason": "Token has been revoked",
    "details": null
  }
}
```

* **Không có quyền truy cập**:

```json
{
  "meta": {
    "code": 403,
    "message": "FORBIDDEN",
    "error_type": "rbac.permission_denied",
    "trace_id": "abc-123",
    "service": "api-gateway",
    "timestamp": "2025-06-10T12:34:56Z"
  },
  "error": {
    "reason": "Permission denied for route /users",
    "details": null
  }
}
```

* **Không thoả điều kiện**:

```json
{
  "meta": {
    "code": 403,
    "message": "FORBIDDEN",
    "error_type": "rbac.condition_failed",
    "trace_id": "abc-123",
    "service": "api-gateway",
    "timestamp": "2025-06-10T12:34:56Z"
  },
  "error": {
    "reason": "Condition 'user_id == self' not satisfied",
    "details": null
  }
}
```

---

#### 📘 Ghi chú

> * Response từ backend sẽ giữ nguyên nếu backend đã dùng định dạng chuẩn (`ADR-012`)
> * Các lỗi không chuẩn từ backend sẽ được Gateway bọc lại đúng format
> * Tất cả request đều được log cùng `trace_id`, `user_id`, `tenant_id`, `permission_checked`, và `rbac_result`

---

## 3. 📌 Phụ lục: Mẫu cấu hình route (`route_config.json`)

File `route_config.json` định nghĩa toàn bộ hành vi định tuyến và kiểm soát truy cập của API Gateway. Mỗi entry tương ứng với một pattern path và method cụ thể, cho phép cấu hình:

- Tên backend service đích
- Phương thức HTTP hỗ trợ
- Quyền yêu cầu (RBAC)
- Điều kiện truy cập (`x-condition`)
- Thông số về timeout, retry
- Tùy chọn `public` hoặc fallback service

---

### 3.1. 🧩 Cấu trúc chung của một rule

```json
"/<pattern>": {
  "method": ["GET", "POST", ...],
  "backend": "<service_name>",
  "x-required-permission": "<permission_code>",
  "x-condition": {
    "<field>": "{{X-Header}}" | "{{PathParam}}" | "{{BodyField}}"
  },
  "timeout": 3000,
  "retry": 2,
  "public": false,
  "fallback_backend": "<optional_service>"
}
```

---

### 3.2. 📘 Ví dụ 1: Route cơ bản có kiểm tra quyền

```json
"/users/**": {
  "method": ["GET", "POST"],
  "backend": "user-service.master",
  "x-required-permission": "user.read",
  "timeout": 3000,
  "retry": 2
}
```

---

### 3.3. 📘 Ví dụ 2: Route yêu cầu xác minh điều kiện runtime

```json
"/users/{id}": {
  "method": ["PATCH"],
  "backend": "user-service.master",
  "x-required-permission": "user.update",
  "x-condition": {
    "user_id": "{{X-User-ID}}",
    "login_method": "otp"
  }
}
```

✅ Nếu `X-User-ID` khác với `user_id` trong request → trả lỗi `rbac.condition_failed`

---

### 3.4. 📘 Ví dụ 3: Route công khai không yêu cầu JWT

```json
"/auth/login": {
  "method": ["POST"],
  "backend": "auth-service.master",
  "public": true
}
```

---

### 3.5. 📘 Ví dụ 4: Route có fallback khi backend chính bị lỗi

```json
"/reports/summary": {
  "method": ["GET"],
  "backend": "report-service.master",
  "fallback_backend": "report-service.cache",
  "timeout": 2000,
  "retry": 1
}
```

Nếu backend chính không phản hồi → thử lại với `report-service.cache`

---

### 3.6. 🛠️ Nguyên tắc triển khai

* Wildcard `**` được hỗ trợ để định nghĩa route tổng quát.
* Các biến `{{...}}` trong `x-condition` sẽ được binding tự động từ:

  * `X-Header` → header có tên tương ứng
  * `PathParam` → biến trong path (VD: `/users/{id}`)
  * `BodyField` → trường JSON trong body (với `Content-Type: application/json`)

---

> 📌 File này có thể được đồng bộ từ GCS, Firestore hoặc service discovery và được cache tại Gateway theo TTL mặc định.

---

## 4. 📎 Bảng Permission liên quan

Bảng dưới đây tổng hợp một số permission phổ biến mà API Gateway sử dụng để kiểm soát truy cập thông qua trường `x-required-permission` trong `route_config.json`.  
Các permission này được định nghĩa và quản lý bởi **User Service Master**, sau đó đồng bộ định kỳ hoặc cache tại Gateway.

---

### 4.1. 📋 Cấu trúc permission

Mỗi permission có dạng `resource.action`, theo cú pháp:
```

<đối tượng>.\<hành\_động>

````

Ví dụ:
- `user.read` – Xem thông tin người dùng
- `report.view_summary` – Xem báo cáo tổng hợp
- `user.update.self` – Cập nhật thông tin chính mình (RBAC condition)

---

### 4.2. 📌 Danh sách permission mẫu

| `permission_code`       | Mô tả quyền                             | Áp dụng cho route           |
|--------------------------|-----------------------------------------|------------------------------|
| `user.read`             | Xem thông tin người dùng                | `GET /users/**`              |
| `user.create`           | Tạo người dùng mới                      | `POST /users`                |
| `user.update`           | Sửa thông tin người dùng                | `PATCH /users/{id}`          |
| `user.delete`           | Xoá người dùng                          | `DELETE /users/{id}`         |
| `user.update.self`      | Sửa thông tin của chính mình            | `PATCH /users/{id}` kèm `x-condition` |
| `auth.manage`           | Thay đổi cấu hình xác thực              | `/auth/**`                   |
| `report.view_summary`   | Truy vấn báo cáo tổng quan              | `GET /reports/summary`       |
| `report.export_detail`  | Tải báo cáo chi tiết                    | `GET /reports/export`        |

---

### 4.3. 🔐 RBAC Condition Permission

Một số quyền được khai báo kèm điều kiện runtime (x-condition).  
Gateway sẽ enforce các điều kiện này tại thời điểm xử lý request.

Ví dụ:
```json
"x-required-permission": "user.update.self",
"x-condition": {
  "user_id": "{{X-User-ID}}"
}
````

> Nếu điều kiện không thỏa → Gateway trả `403 Forbidden` với `error_type: rbac.condition_failed`

---

### 4.4. 📎 Quản lý & cập nhật

* Gateway **không tự định nghĩa permission**
* Tất cả permission được resolve từ `user-sub` thông qua Redis hoặc HTTP fallback
* TTL mặc định của cache permission: `300s`
* Có thể được invalidate qua sự kiện `rbac.updated` (xem chi tiết trong thiết kế `design.md`)

---

## 5. 📚 Tài liệu liên kết

* [Data Model](./data-model.md)
* [OpenAPI Spec](./openapi.yaml)
* [Design](./design.md)
* [`adr-011-api-error-format.md`](../../../ADR/adr-011-api-error-format.md)
* [`adr-012-response-structure.md`](../../../ADR/adr-012-response-structure.md)
* [`adr-007-rbac.md`](../../../ADR/adr-007-rbac.md)
