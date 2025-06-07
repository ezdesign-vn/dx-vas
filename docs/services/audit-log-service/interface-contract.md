---
title: Audit Logging Service - Interface Contract
version: "1.0"
last_updated: "2025-06-07"
author: "DX VAS Team"
reviewed_by: "Stephen Le"
---

# 📘 Audit Logging Service – Interface Contract

Tài liệu này mô tả các API chính mà **Audit Logging Service** cung cấp – theo cách dễ đọc, đầy đủ thông tin cho backend, frontend và devops. 

> ✅ Phạm vi: Service này ghi nhận, lưu trữ và cung cấp khả năng truy vấn các hành vi người dùng/hệ thống có tính audit.  
> 🚫 Không chịu trách nhiệm phân tích, dashboard (giao cho Reporting Service), hoặc alerting (giao cho hệ thống cảnh báo riêng).

---

## 📌 API: `/audit-logs`

Danh sách các API phục vụ việc ghi nhận và truy xuất hành vi audit.

| Method | Path                        | Mô tả                                 | Quyền (RBAC Permission Code)   |
|--------|-----------------------------|---------------------------------------|--------------------------------|
| POST   | `/audit-logs`               | Ghi nhận một hành động audit          | `audit.create.logs`            |
| POST   | `/audit-logs/bulk`          | Ghi nhận hàng loạt hành động audit   | `audit.create.logs.bulk`       |
| GET    | `/audit-logs`               | Truy vấn danh sách log                | `audit.read.logs`              |
| GET    | `/audit-logs/{id}`          | Lấy chi tiết một bản ghi log          | `audit.read.logs`              |

---

### 🧪 Chi tiết API

#### 1. POST `/audit-logs`

Ghi nhận một hành động audit đơn lẻ vào hệ thống.  
API này được sử dụng bởi các service backend (user-service, auth-service, notification-service...) hoặc frontend (qua API Gateway) khi có hành vi cần lưu vết phục vụ kiểm toán.

---

### 🧾 Headers yêu cầu

| Header           | Bắt buộc | Mô tả |
|------------------|----------|-------|
| `Authorization`  | ✅       | `Bearer <JWT>` – dùng để xác thực người dùng và trích xuất actor |
| `X-Tenant-ID`    | ✅       | ID tenant hiện hành (nếu không có trong JWT) |
| `X-Request-ID`   | ✅       | ID truy vết request – được gắn vào log, trace, response, và phục vụ debugging liên service |

> ✅ Với thay đổi này, `X-Request-ID` trở thành **bắt buộc**, đảm bảo mọi bản ghi log đều có thể truy vết xuyên suốt hệ thống.

> 💡 Nếu request thiếu header này, API sẽ trả về lỗi `422` với thông báo `Missing required header: X-Request-ID`.

---

### 📥 Request Body

```json
{
  "actor_id": "user-123",
  "actor_type": "user",
  "action": "UPDATE",
  "resource_type": "USER",
  "resource_id": "user-abc",
  "timestamp": "2025-06-07T13:00:00Z",
  "tenant_id": "tenant-001",
  "metadata": {
    "field_changed": "email",
    "old_value": "a@example.com",
    "new_value": "b@example.com"
  },
  "request_id": "req-xyz-999",
  "event_id": "event-123"
}
```

> 🧠 `event_id` được sử dụng để đảm bảo idempotency – nếu log bị gửi trùng, hệ thống sẽ không ghi đè.

---

### 🔐 RBAC

* **Yêu cầu permission:** `audit.create.logs`
* Actor phải thuộc đúng tenant hoặc có role `superadmin`

---

### ✅ Response (201 Created)

```json
{
  "data": {
    "id": "audit-abc999",
    "created_at": "2025-06-07T13:00:01Z"
  },
  "meta": {
    "request_id": "req-xyz-999",
    "timestamp": "2025-06-07T13:00:01Z"
  },
  "error": null
}
```

---

### ❌ Response lỗi thường gặp

| HTTP Code | Lỗi                | Mô tả                                    |
| --------- | ------------------ | ---------------------------------------- |
| `401`     | Unauthorized       | Thiếu hoặc sai JWT                       |
| `403`     | Forbidden (RBAC)   | Không có quyền `audit.create.logs`       |
| `422`     | Validation Error   | Thiếu trường bắt buộc hoặc sai định dạng |
| `409`     | Duplicate Event ID | `event_id` đã được ghi trước đó          |

---

### 🔎 Ví dụ thực tế

Audit một hành động xoá học sinh:

```json
{
  "actor_id": "teacher-456",
  "actor_type": "user",
  "action": "DELETE",
  "resource_type": "STUDENT",
  "resource_id": "student-abc",
  "timestamp": "2025-06-07T15:20:00Z",
  "metadata": {
    "reason": "duplicate entry",
    "approved_by": "admin-001"
  },
  "event_id": "ev-std-del-0001"
}
```

---

### 🧪 Các tiêu chí kiểm thử

| Case                           | Kỳ vọng                      |
| ------------------------------ | ---------------------------- |
| Đủ thông tin, permission đúng  | `201 Created` với ID         |
| Thiếu `actor_id` hoặc `action` | `422 Unprocessable Entity`   |
| Sai `timestamp` format         | `422` – ISO-8601 required    |
| Dùng `event_id` trùng          | `409 Conflict` – idempotency |
| Gửi từ tenant khác             | `403 Forbidden`              |

---

#### 2. POST `/audit-logs/bulk`

Ghi nhận **nhiều hành động audit cùng lúc** trong một request.  
Phù hợp cho các service backend hoặc batch job cần lưu nhiều log trong 1 giao dịch hoặc thời điểm cụ thể (ví dụ: import học sinh, cập nhật hàng loạt điểm số...).

---

### 🧾 Headers yêu cầu

| Header           | Bắt buộc | Mô tả |
|------------------|----------|-------|
| `Authorization`  | ✅       | `Bearer <JWT>` – để xác thực và gán actor mặc định nếu không có trong mỗi bản ghi |
| `X-Tenant-ID`    | ✅       | ID tenant – dùng cho phân vùng dữ liệu |
| `X-Request-ID`   | ✅       | Trace ID dùng để debug và liên kết toàn bộ batch log |

---

### 📥 Request Body

Là mảng tối đa **100 bản ghi**, mỗi bản ghi có cấu trúc tương tự như `POST /audit-logs`:

```json
[
  {
    "actor_id": "admin-001",
    "actor_type": "user",
    "action": "UPDATE",
    "resource_type": "STUDENT",
    "resource_id": "student-123",
    "timestamp": "2025-06-07T13:00:00Z",
    "metadata": {
      "field": "score",
      "old": 7,
      "new": 9
    },
    "event_id": "batch-001"
  },
  {
    "actor_id": "admin-001",
    "actor_type": "user",
    "action": "UPDATE",
    "resource_type": "STUDENT",
    "resource_id": "student-124",
    "timestamp": "2025-06-07T13:01:00Z",
    "metadata": {
      "field": "score",
      "old": 6,
      "new": 8
    },
    "event_id": "batch-002"
  }
]
```

---

### 🔐 RBAC

* **Yêu cầu permission:** `audit.create.logs.bulk`
* Actor bắt buộc là service hoặc user có quyền ghi hàng loạt audit (đa số là backend, không phải frontend)

---

### ✅ Response (207 Multi-Status)

Vì đây là ghi nhiều log, nên response theo chuẩn `multi-status` (inspired by WebDAV) – phản hồi trạng thái cho từng bản ghi:

```json
{
  "meta": {
    "success_count": 98,
    "failure_count": 2,
    "request_id": "req-xyz-999"
  },
  "data": [
    {
      "event_id": "batch-001",
      "status": "created",
      "id": "audit-uuid-001"
    },
    {
      "event_id": "batch-002",
      "status": "error",
      "error": {
        "code": "DUPLICATE_EVENT_ID",
        "message": "Event ID already exists"
      }
    }
  ],
  "error": null
}
```

---

### ❌ Response lỗi tổng

| HTTP Code | Lỗi                    | Mô tả                                         |
| --------- | ---------------------- | --------------------------------------------- |
| `401`     | Unauthorized           | Thiếu JWT                                     |
| `403`     | Forbidden (RBAC)       | Không có quyền `audit.create.logs.bulk`       |
| `422`     | Invalid payload        | Nếu không phải mảng hoặc vượt quá 100 bản ghi |
| `207`     | Multi-status (partial) | Một số bản ghi thành công, một số lỗi         |

---

### 💡 Lưu ý triển khai

| Yếu tố               | Ghi chú                                                   |
| -------------------- | --------------------------------------------------------- |
| Tối đa 100 log/lần   | Giới hạn để tránh overload DB                             |
| Ghi theo batch SQL   | `INSERT INTO ... VALUES (...), (...)`                     |
| Idempotency từng log | Dựa trên `event_id` riêng biệt                            |
| Tách `created_at`    | Tự động tạo theo từng bản ghi, không dùng timestamp chung |

---

### 🧪 Các tiêu chí kiểm thử

| Case                           | Kỳ vọng                             |
| ------------------------------ | ----------------------------------- |
| Gửi 5 bản ghi đúng             | `201` với 5 bản ghi `created`       |
| Trùng `event_id` với bản đã có | Bản ghi đó báo `DUPLICATE_EVENT_ID` |
| Gửi mảng >100 bản ghi          | `422` – vượt giới hạn               |
| Không phải mảng JSON           | `422` – invalid request             |

---

### 📎 Gợi ý sử dụng

* ✅ Ghi log hàng loạt sau khi import file Excel
* ✅ Ghi audit cho từng user được bulk cập nhật điểm
* ❌ Không dùng từ frontend – nên chỉ dùng cho backend trusted

---

#### 3. GET `/audit-logs`

API dùng để **truy vấn danh sách bản ghi audit** theo nhiều tiêu chí lọc khác nhau.  
Được dùng trong:
- Giao diện admin (Audit Dashboard)
- Tính năng kiểm tra hành vi gần đây
- Debug trace logic

---

### 🧾 Headers yêu cầu

| Header           | Bắt buộc | Mô tả |
|------------------|----------|-------|
| `Authorization`  | ✅       | `Bearer <JWT>` – xác thực và phân quyền |
| `X-Tenant-ID`    | ✅       | Tenant phân vùng dữ liệu |
| `X-Request-ID`   | ✅       | Trace ID phục vụ debug |

---

### 🔎 Query Parameters

| Param             | Bắt buộc | Kiểu DL     | Mô tả |
|-------------------|----------|-------------|------|
| `actor_id`        | ❌       | string      | Lọc theo ID người thực hiện |
| `actor_type`      | ❌       | enum        | `user`, `system`, `service` |
| `action`          | ❌       | enum        | `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, ... |
| `resource_type`   | ❌       | enum        | `USER`, `CLASS`, `FEE`, ... |
| `resource_id`     | ❌       | string      | ID của đối tượng bị tác động |
| `from`            | ❌       | ISO-8601    | Thời gian bắt đầu (UTC) |
| `to`              | ❌       | ISO-8601    | Thời gian kết thúc (UTC) |
| `page`            | ❌       | int         | Trang hiện tại (mặc định: 1) |
| `limit`           | ❌       | int (1–100) | Số dòng mỗi trang (mặc định: 20) |

---

### ✅ Response (200 OK)

```json
{
  "data": [
    {
      "id": "audit-001",
      "actor_id": "admin-123",
      "action": "DELETE",
      "resource_type": "STUDENT",
      "resource_id": "stu-xyz",
      "timestamp": "2025-06-07T12:34:56Z",
      "metadata": {
        "reason": "duplicate",
        "approved_by": "admin-001"
      }
    },
    ...
  ],
  "meta": {
    "request_id": "req-xyz",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total_items": 42,
      "total_pages": 3
    }
  },
  "error": null
}
```

---

### 🔐 RBAC

* **Yêu cầu permission:** `audit.read.logs`
* Người dùng chỉ có thể truy vấn dữ liệu thuộc tenant của họ
* Các role như `school_admin`, `sys_auditor` thường có quyền này

---

### ⚠️ Giới hạn truy vấn

| Giới hạn       | Mức mặc định     | Ghi chú                         |
| -------------- | ---------------- | ------------------------------- |
| `limit` tối đa | 100              | Tránh trả quá nhiều log 1 lần   |
| `from-to` max  | 180 ngày         | Tùy chỉnh theo retention policy |
| Default sort   | `timestamp desc` | Log mới nhất hiển thị trước     |

---

### 🧪 Các tiêu chí kiểm thử

| Tình huống                           | Kết quả kỳ vọng                           |
| ------------------------------------ | ----------------------------------------- |
| Truy vấn không có filter             | Trả về log gần nhất                       |
| Truy vấn `resource_id=student-123`   | Trả về đúng hành vi liên quan học sinh đó |
| Lọc theo `action=DELETE`, `from=...` | Lọc chính xác, giới hạn theo thời gian    |
| Không có quyền truy cập log          | `403 Forbidden`                           |
| Token hợp lệ nhưng `X-Tenant-ID` sai | Không có log hoặc `403`                   |

---

### 💡 Best Practice cho Frontend

* Tích hợp filter nâng cao (dropdown enum)
* Hiển thị tooltip cho metadata → thường chứa lý do, hành vi cụ thể
* Hiển thị tên người thực hiện từ `actor_id` qua lookup User Service (nếu cần)

---

#### 4. GET `/audit-logs/{id}`

API này cho phép lấy **chi tiết một bản ghi log cụ thể**, dựa trên `id` duy nhất của log.  
Được dùng khi người dùng từ giao diện Audit Dashboard hoặc từ các hệ thống backend cần xem chi tiết một hành vi cụ thể.

---

### 📌 Mục đích

- Hiển thị popup/modal chi tiết audit log
- Phục vụ kiểm tra hành vi, xác định người chịu trách nhiệm
- Truy vết và kiểm tra integrity của hành vi

---

### 🧾 Headers yêu cầu

| Header           | Bắt buộc | Mô tả |
|------------------|----------|-------|
| `Authorization`  | ✅       | `Bearer <JWT>` – để xác thực người dùng |
| `X-Tenant-ID`    | ✅       | Tenant dùng để phân vùng dữ liệu |
| `X-Request-ID`   | ✅       | Trace ID – hỗ trợ debug, giám sát |

---

### 📥 Path Parameters

| Param  | Bắt buộc | Kiểu DL | Mô tả                      |
|--------|----------|---------|----------------------------|
| `id`   | ✅       | string (UUID) | ID duy nhất của bản ghi audit log |

---

### ✅ Response (200 OK)

```json
{
  "data": {
    "id": "audit-001",
    "tenant_id": "tenant-abc",
    "actor_id": "teacher-999",
    "actor_type": "user",
    "action": "UPDATE",
    "resource_type": "STUDENT",
    "resource_id": "stu-123",
    "timestamp": "2025-06-07T12:34:56Z",
    "request_id": "req-xyz-001",
    "event_id": "event-001",
    "metadata": {
      "field_changed": "dob",
      "old_value": "2012-03-01",
      "new_value": "2012-03-02",
      "approved_by": "admin-001"
    }
  },
  "meta": {
    "request_id": "req-xyz-001",
    "timestamp": "2025-06-07T12:35:00Z"
  },
  "error": null
}
```

---

### ❌ Response lỗi thường gặp

| HTTP Code | Lỗi                 | Mô tả                                                    |
| --------- | ------------------- | -------------------------------------------------------- |
| `401`     | Unauthorized        | Thiếu JWT hoặc không hợp lệ                              |
| `403`     | Forbidden           | Không có quyền `audit.read.logs` hoặc không thuộc tenant |
| `404`     | Not Found           | Không tìm thấy bản ghi log theo ID                       |
| `422`     | Invalid UUID format | Nếu `id` không đúng định dạng UUID v4                    |

---

### 🔐 RBAC

* **Permission yêu cầu:** `audit.read.logs`
* Chỉ được phép xem log thuộc `tenant_id` tương ứng
* Nếu là `superadmin` hoặc `sys_auditor` có thể xem nhiều tenant (nếu JWT cho phép)

---

### 🧪 Các tình huống kiểm thử

| Tình huống                          | Kết quả kỳ vọng    |
| ----------------------------------- | ------------------ |
| Lấy log có `id` hợp lệ, quyền đúng  | `200 OK`           |
| Log tồn tại nhưng khác `tenant_id`  | `403 Forbidden`    |
| ID log không tồn tại                | `404 Not Found`    |
| Thiếu `Authorization` header        | `401 Unauthorized` |
| Gửi ID sai format (không phải UUID) | `422`              |

---

### 💡 Best Practice (Frontend)

* Gọi API này khi user bấm “🔍 Chi tiết” trên một dòng log từ `GET /audit-logs`
* Hiển thị metadata theo dạng bảng key-value dễ đọc
* Nếu có `request_id`, có thể dẫn link sang Cloud Logging trace

---

## 📎 ENUM sử dụng

Để đảm bảo tính thống nhất, dễ hiểu và có thể mapping UI (label, màu sắc, icon), các trường có giá trị lựa chọn trước (enum) trong Audit Logging Service được chuẩn hoá theo các bảng phụ trợ như sau:

---

### 1. `actor_type`

| Giá trị       | Mô tả tiếng Việt      | Dùng cho UI |
|---------------|------------------------|-------------|
| `user`        | Người dùng (giáo viên, admin, học sinh) | 👤 |
| `system`      | Hệ thống nội bộ (scheduler, automation) | ⚙️ |
| `service`     | Service khác (API Gateway, Notification Service...) | 🔁 |

> Sử dụng để xác định ai là người thực hiện hành động.

---

### 2. `action`

| Giá trị       | Mô tả tiếng Việt         | Loại icon gợi ý |
|---------------|---------------------------|------------------|
| `CREATE`      | Tạo mới                   | 🟢 ➕ |
| `UPDATE`      | Cập nhật                  | 🟡 ✏️ |
| `DELETE`      | Xoá                       | 🔴 🗑️ |
| `LOGIN`       | Đăng nhập                 | 🔐 |
| `LOGOUT`      | Đăng xuất                 | 🚪 |
| `APPROVE`     | Duyệt hành động           | ✅ |
| `REJECT`      | Từ chối hành động         | ❌ |
| `EXPORT`      | Xuất dữ liệu              | 📤 |
| `IMPORT`      | Nhập dữ liệu              | 📥 |

> Có thể mở rộng tuỳ use case. Tất cả action đều phải tuân thủ schema chuẩn để phục vụ truy vấn và phân tích hành vi.

---

### 3. `resource_type`

| Giá trị         | Mô tả tài nguyên được tác động       |
|------------------|---------------------------------------|
| `USER`           | Người dùng (học sinh, giáo viên, phụ huynh) |
| `STUDENT`        | Học sinh                              |
| `TEACHER`        | Giáo viên                             |
| `PARENT`         | Phụ huynh                             |
| `CLASS`          | Lớp học                               |
| `SCHEDULE`       | Thời khoá biểu                        |
| `FEE`            | Phí và hoá đơn                        |
| `TEMPLATE`       | Notification Template                 |
| `AUDIT_LOG`      | Bản ghi log (meta-level audit)        |
| `PERMISSION`     | Quyền                                |
| `ROLE`           | Vai trò                              |
| `CONFIG`         | Cấu hình hệ thống                    |

> Dùng để phân loại nhanh hành vi đang tác động lên nhóm dữ liệu nào.

---

### 4. `actor_scope` (tuỳ chọn nếu dùng RBAC nâng cao)

| Giá trị         | Mô tả                                     |
|------------------|--------------------------------------------|
| `global`         | Thực hiện bởi hệ thống toàn cục            |
| `tenant`         | Thực hiện trong phạm vi tenant cụ thể      |
| `school_branch`  | Giới hạn theo chi nhánh hoặc site          |

---

### 🎨 UI Mapping Suggestion

| Field          | Color            | Icon suggestion |
|----------------|------------------|------------------|
| `CREATE`       | Green             | ➕ |
| `UPDATE`       | Yellow            | ✏️ |
| `DELETE`       | Red               | 🗑️ |
| `LOGIN`        | Blue              | 🔐 |
| `REJECT`       | Gray              | ❌ |
| `EXPORT`       | Purple            | 📤 |

> Những bảng phụ trợ này nên được hiển thị trên Dashboard để người dùng lọc & hiểu rõ hành vi đang xem.

---

## 📎 Permission Mapping

Hệ thống sử dụng cơ chế **RBAC (Role-Based Access Control)** phân tầng, như mô tả trong [`rbac-deep-dive.md`](../architecture/rbac-deep-dive.md), để kiểm soát quyền truy cập vào các API.

Dưới đây là bảng ánh xạ **permission code** với từng API endpoint tương ứng của Audit Logging Service.

---

### 🔐 Bảng Phân Quyền Chi Tiết

| `permission_code`        | API liên quan                             | Phương thức | Mô tả quyền                        |
|--------------------------|-------------------------------------------|-------------|------------------------------------|
| `audit.create.logs`      | `/audit-logs`                             | `POST`      | Cho phép ghi một bản ghi audit     |
| `audit.create.logs.bulk` | `/audit-logs/bulk`                        | `POST`      | Cho phép ghi hàng loạt bản ghi audit |
| `audit.read.logs`        | `/audit-logs`, `/audit-logs/{id}`        | `GET`       | Truy vấn danh sách hoặc chi tiết log |

---

### 🧠 Quy tắc áp dụng permission

- Mọi API đều yêu cầu có header `Authorization: Bearer <token>`.
- `permission_code` được trích xuất từ JWT (trong payload `permissions`).
- Nếu không có permission phù hợp:
  - API sẽ trả về `403 Forbidden`
  - Và log lại hành vi vi phạm (nếu ghi log audit cả lỗi truy cập)

---

### 🔍 Ví dụ Payload JWT:

```json
{
  "sub": "admin-123",
  "tenant_id": "vas_hn",
  "permissions": [
    "audit.read.logs",
    "audit.create.logs"
  ]
}
```

---

### 🧪 Quy tắc kiểm thử

| Tình huống                                                     | Kết quả mong đợi          |
| -------------------------------------------------------------- | ------------------------- |
| Người dùng có `audit.read.logs`                                | Truy vấn log thành công   |
| Không có `audit.read.logs`                                     | `403 Forbidden`           |
| Có `audit.create.logs.bulk` nhưng không có `audit.create.logs` | Không gọi được API đơn lẻ |
| JWT hợp lệ nhưng không có trường `permissions`                 | `403 Forbidden`           |

---

### 🛡️ RBAC & Tầng kiểm tra

* Việc kiểm tra permission được thực hiện bởi middleware của mỗi service.
* Mỗi API trong `openapi.yaml` sẽ có trường:

```yaml
x-required-permission: audit.read.logs
```

---

### 🎯 Gợi ý mapping với role

| Role              | Permissions gắn với role               |
| ----------------- | -------------------------------------- |
| `school_admin`    | `audit.read.logs`                      |
| `sys_auditor`     | `audit.read.logs`, `audit.create.logs` |
| `service_account` | `audit.create.logs.bulk`               |

> ⚠️ Các role được định nghĩa tại `user-service/master`, phân phối theo từng tenant.

---

📎 Tham khảo thêm:

* [Design](./design.md)
* [Data Model](./data-model.md)
* [OpenAPI](./openapi.yaml)
* [`adr-007-rbac.md`](../../ADR/adr-007-rbac.md)
* [`rbac-deep-dive.md`](../../architecture/rbac-deep-dive.md)
* [`auth-service/master/design.md`](../auth-service/master/design.md)

