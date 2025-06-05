---
title: API Gateway – Interface Contract
version: "1.1"
last_updated: "2025-06-03"
author: "DX VAS Team"
reviewed_by: "Stephen Le"
---
# 📘 API Gateway – Interface Contract

Tài liệu này mô tả các API điều phối của **API Gateway**, giúp định tuyến và kiểm soát truy cập đến các backend service trong hệ thống dx-vas. Gateway không cung cấp logic nghiệp vụ nhưng chịu trách nhiệm enforce RBAC, xác thực JWT và trả lỗi thống nhất theo ADR-011.

📌 **Scope:**

* Quản lý định tuyến (routing) và xác thực request từ client đến các service backend.
* Kiểm tra permission bằng cách ánh xạ route vào cấu hình RBAC (do User Service Master cung cấp).
* Không xử lý logic nghiệp vụ hay thao tác dữ liệu – mọi API gọi qua Gateway được forward đến backend tương ứng.

👥 **Consumer chính:** Superadmin Webapp, Admin Webapp, Customer Portal, các adapter và automation script.

---

## 🔧 Nguyên tắc chung khi sử dụng API

- Tất cả request từ client cần gửi header `Authorization: Bearer <JWT>` nếu endpoint không đánh dấu là `public`.
- Header `x-tenant-id`, `x-user-id`, `x-permissions` sẽ được Gateway tự động thêm vào request gửi đến backend (dựa trên JWT claim).
- Gateway forward trace_id (từ header `x-trace-id` hoặc sinh tự động).
- Các lỗi từ backend sẽ được chuẩn hóa theo ADR-011 nếu không đúng định dạng.
- Kết quả thành công được trả nguyên từ backend, hoặc bọc chuẩn nếu backend đã tuân ADR-012.

---

## 📌 API: `/proxy`

Danh sách các API giúp định tuyến request thông qua Gateway đến backend service phù hợp. Gateway dùng dynamic router dựa trên file cấu hình (`route_config.json`) và permission map.

| Method | Path Pattern        | Mô tả chung                          | Proxy tới Service            |
|--------|----------------------|--------------------------------------|------------------------------|
| ANY    | `/auth/**`           | Các API xác thực & định danh         | Auth Service Master/Sub      |
| ANY    | `/users/**`          | API liên quan đến quản lý người dùng | User Service Master/Sub      |
| ANY    | `/reports/**`        | API truy vấn báo cáo & cấu hình      | Reporting Service Master     |
| ANY    | `/proxy/{wildcard}`  | Fallback proxy theo config động      | Tùy theo `route_config.json` |

---

### 🧪 Chi tiết API

#### 1. ANY `/proxy/{wildcard}`

Đây là endpoint duy nhất của Gateway. Tất cả request đi vào sẽ được định tuyến dựa trên `route_config` và kiểm tra permission tương ứng (nếu route yêu cầu).

**Path Parameters:**

* `{wildcard}`: Phần path còn lại sau `/proxy/` (VD: `users/abc`, `auth/login`).

**Headers yêu cầu:**

* `Authorization: Bearer <JWT>` (nếu route yêu cầu login)
* `x-trace-id`: Tùy chọn, nếu không có sẽ sinh tự động

**Hành vi:**

* Xác thực JWT (nếu route yêu cầu login)
* Kiểm tra permission từ JWT claim + RBAC rule (nếu có `x-required-permission` trong route config)
* Forward request đến backend theo `target_service`
* Chuẩn hóa lỗi trả về theo ADR-011

**Response mẫu (200 OK):** phụ thuộc vào backend trả về

```json
{
  "meta": {
    "code": 200,
    "message": "SUCCESS",
    "trace_id": "abc-123"
  },
  "data": {
    "user_id": "u001",
    "name": "Alice",
    "email": "alice@truongvietanh.edu.vn"
  }
}
```

**Response lỗi mẫu (403 RBAC fail):**

```json
{
  "data": null,
  "meta": {
    "code": 403,
    "message": "FORBIDDEN",
    "trace_id": "abc-123"
  },
  "error": {
    "reason": "Permission denied for route /users",
    "error_type": "rbac.permission.missing"
  }
}
```

**Status codes có thể có:** 200, 201, 204, 400, 401, 403, 404, 500.

**Sự kiện phát ra:** Không có – Gateway không phát event mà chỉ forward request.

---

## 📌 Phụ lục: Mẫu cấu hình route (`route_config.json`)

```json
{
  "/users/**": {
    "method": ["GET", "POST"],
    "backend": "user-service.master",
    "x-required-permission": "user.read",
    "timeout": 3000,
    "retry": 2
  },
  "/auth/login": {
    "method": ["POST"],
    "backend": "auth-service.master",
    "public": true
  }
}
```

---

## 📎 Bảng Permission liên quan

| `permission_code`     | Mô tả ngắn               | Áp dụng cho path   |
| --------------------- | ------------------------ | ------------------ |
| `user.read`           | Xem thông tin người dùng | `/users/**`        |
| `user.create`         | Tạo người dùng mới       | `/users` với POST  |
| `report.view_summary` | Xem báo cáo tổng hợp     | `/reports/summary` |

> Các permission này được mapping bởi User Service Master và tải về Gateway định kỳ/cache. Gateway không tự định nghĩa permission.

---

## 📚 Tài liệu liên kết

* [Data Model](./data-model.md)
* [OpenAPI Spec](./openapi.yaml)
* [Design](./design.md)
* [`adr-011-api-error-format.md`](../../../ADR/adr-011-api-error-format.md)
* [`adr-012-response-structure.md`](../../../ADR/adr-012-response-structure.md)
* [`adr-007-rbac.md`](../../../ADR/adr-007-rbac.md)
