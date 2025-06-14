---
title: Notification Sub Service - Interface Contract
version: "1.0"
last_updated: ["2025-06-14"]
author: "DX VAS Team"
reviewed_by: "Stephen Le"
---

# 📘 Notification Sub Service – Interface Contract

Service này cung cấp các API phục vụ việc:
- Tra cứu danh sách notification đã gửi theo nhiều tiêu chí (tenant, trạng thái, channel…)
- Gửi thử một template notification (cho mục đích kiểm tra, sandbox)
- Tra cứu danh sách template hiện hành (per tenant)

## 1. Phạm vi (Scope)

Notification Sub Service chịu trách nhiệm xử lý các hành động sau:

✅ **Trong phạm vi**:
- Thực thi việc **gửi notification thực tế** dựa trên sự kiện `notification.triggered.v1` nhận từ Pub/Sub
- **Ghi nhận log gửi** (thành công/thất bại/fallback) cho mỗi tenant
- **Cung cấp API truy vấn log đã gửi** để phục vụ giao diện quản trị
- **Cho phép gửi thử** (test) một template tới một địa chỉ cụ thể nhằm kiểm tra cấu hình
- **Cho phép xem danh sách template** đang được sử dụng (metadata)
- **Ghi log kiểm toán (audit)** cho tất cả các hành động gửi, test, thay đổi config

🔒 **Tất cả các API có ràng buộc `tenant_id`** (multi-tenant isolation theo CR-04 và `ADR-007`).

---

🔎 **Danh sách endpoint thuộc phạm vi contract:**

| Method | Path                          | Mô tả chức năng                          |
|--------|-------------------------------|------------------------------------------|
| `GET`  | `/notifications/logs`         | Truy xuất log notification đã gửi       |
| `POST` | `/notifications/test`         | Gửi thử một notification (dry-run)      |
| `GET`  | `/notifications/templates`    | Truy xuất danh sách template (metadata) |

---

❌ **Ngoài phạm vi**:
- Không nhận request gửi thật từ client (frontend)
- Không quản lý người nhận, trạng thái đọc/unread
- Không tạo/sửa template qua API (template được quản lý ngoài service này)
- Không quản lý opt-in/opt-out của người dùng (handled tại User Profile hoặc Master)
- Không phát sinh sự kiện outbound ra Pub/Sub

---

> 🧭 **Nguyên tắc chung (General Principles):**
> - Tất cả API yêu cầu header `Authorization: Bearer <JWT>` (theo ADR-006).
> - API tuân thủ cấu trúc response chuẩn theo [ADR-012](../../../ADR/adr-012-response-structure.md).
> - Mọi lỗi đều tuân thủ [ADR-011](../../../ADR/adr-011-api-error-format.md) và [Error Codes](../../../standards/error-codes.md)
> - Một số API yêu cầu `x-condition: tenant_id = {{X-Tenant-ID}}`.

---

## 2. 📌 API: `/notifications/logs`

API dùng để liệt kê các notification đã gửi thành công hoặc thất bại của tenant hiện tại. Cho phép lọc theo trạng thái, kênh gửi, sự kiện hoặc người nhận.  
Hữu ích cho mục đích giám sát, hỗ trợ người dùng và truy vết sự cố.

---

#### 📥 Request

```http
GET /notifications/logs?page=1&page_size=20&status=sent&channel=email
Authorization: Bearer <JWT>
X-Tenant-ID: tenant-vas-001
```

**Query Parameters (tùy chọn):**

| Tên          | Kiểu    | Mặc định | Mô tả                                  |
| ------------ | ------- | -------- | -------------------------------------- |
| `page`       | integer | 1        | Trang thứ mấy                          |
| `page_size`  | integer | 20       | Số kết quả mỗi trang (max: 100)        |
| `status`     | string  |          | `sent`, `failed`, `queued`, `fallback` |
| `channel`    | string  |          | `email`, `sms`, `push`                 |
| `event_code` | string  |          | Mã sự kiện (`user.welcome`, v.v.)      |
| `recipient`  | string  |          | Email/số điện thoại người nhận         |

---

#### 📤 Response

```json
{
  "meta": {
    "page": 1,
    "page_size": 20,
    "total_pages": 3,
    "total_items": 55
  },
  "data": [
    {
      "id": "c3017c2b-5ef0-44a9-9274-06d9ab3f6cf7",
      "event_code": "user.welcome",
      "channel": "email",
      "status": "sent",
      "recipient": "user@example.edu.vn",
      "template_id": "tmpl-welcome-01",
      "sent_at": "2025-06-13T09:45:00Z",
      "retry": false,
      "trace_id": "x-trace-123abc"
    }
  ]
}
```

> Response tuân theo chuẩn `Envelope` định nghĩa tại `ADR-012`.

---

#### 🔐 Phân quyền & Điều kiện

| Thuộc tính              | Giá trị                       |
| ----------------------- | ----------------------------- |
| `x-required-permission` | `notif.read.log`              |
| `x-condition`           | `tenant_id = {{X-Tenant-ID}}` |

JWT phải chứa `tenant_id`, `sub`, và `permissions` hợp lệ.

---

#### 📣 Sự kiện phát ra

Không phát sinh sự kiện. API này chỉ phục vụ mục đích **read-only** và **truy vết log**.

---

#### ❌ Mã lỗi có thể trả về

| HTTP | `error_code`                   | Mô tả                               |
| ---- | ------------------------------ | ----------------------------------- |
| 401  | `auth.unauthorized`            | Thiếu hoặc sai JWT token            |
| 403  | `auth.permission_denied`       | Không có quyền `notif.read.log`     |
| 400  | `common.validation_failed`     | Tham số query không hợp lệ          |
| 429  | `common.rate_limited`          | Gửi quá nhanh, bị giới hạn truy cập |
| 500  | `common.internal_server_error` | Lỗi nội bộ không xác định           |

> Danh sách mã lỗi tuân thủ định nghĩa trong [Error Codes](../../../standards/error-codes.md)

---

#### 🧪 Gợi ý kiểm thử

| Tình huống                            | Kết quả mong đợi                    |
| ------------------------------------- | ----------------------------------- |
| Không có `Authorization` header       | 401 + `auth.unauthorized`           |
| Token không có quyền `notif.read.log` | 403 + `auth.permission_denied`      |
| `page = -1` hoặc `page_size = 0`      | 400 + `common.validation_failed`    |
| Token hợp lệ, có quyền                | 200, trả đúng danh sách theo filter |
| `recipient` không tồn tại             | 200, `data=[]`, không có lỗi        |
| Truy vấn quá nhiều lần                | 429 + `common.rate_limited`         |

---

Dưới đây là phần mô tả chi tiết chuẩn 5★ cho API `POST /notifications/test`, đảm bảo đồng bộ với `design.md`, `error-codes.md`, `adr-012`, `adr-011`, và hỗ trợ kiểm thử cấu hình gửi thông báo trong môi trường multi-tenant:

---

## 3. 📌 API: `/notifications/test`

API dùng để gửi thử một notification dựa trên template hiện có, dùng cho mục đích kiểm tra kênh gửi (email/SMS) và nội dung hiển thị.  
Chỉ gửi đến một `recipient` duy nhất, không log lại trong hệ thống chính, không ảnh hưởng dữ liệu thật.  
Thường được dùng trong trang cấu hình kênh gửi hoặc giao diện test template.

---

#### 📥 Request

```http
POST /notifications/test
Authorization: Bearer <JWT>
Content-Type: application/json
X-Tenant-ID: tenant-vas-001
```

**Payload:**

```json
{
  "channel": "email",
  "recipient": "test@example.com",
  "event_code": "user.welcome",
  "params": {
    "full_name": "Lê Minh",
    "class": "5A",
    "school": "Trường Việt Anh"
  }
}
```

**Mô tả field:**

| Trường       | Kiểu   | Bắt buộc | Mô tả                                 |
| ------------ | ------ | -------- | ------------------------------------- |
| `channel`    | string | ✅        | `email`, `sms`, `push`                |
| `recipient`  | string | ✅        | Địa chỉ email/số điện thoại nhận test |
| `event_code` | string | ✅        | Mã sự kiện (template) để gửi thử      |
| `params`     | object | ⛔        | Dữ liệu sẽ được render vào template   |

---

#### 📤 Response

```json
{
  "meta": {
    "trace_id": "trace-x123",
    "status": "sent"
  },
  "data": {
    "channel": "email",
    "recipient": "test@example.com",
    "event_code": "user.welcome",
    "template_id": "tmpl-welcome-01",
    "preview": "<p>Xin chào Lê Minh, chào mừng bạn đến lớp 5A!</p>"
  }
}
```

> Trường `preview` chứa nội dung đã được render – hữu ích để kiểm thử cấu trúc template.

---

#### 🔐 Phân quyền & Điều kiện

| Thuộc tính              | Giá trị                       |
| ----------------------- | ----------------------------- |
| `x-required-permission` | `notif.send.test`             |
| `x-condition`           | `tenant_id = {{X-Tenant-ID}}` |

---

#### 📣 Sự kiện phát ra

| Tên sự kiện              | Mô tả                                        |
| ------------------------ | -------------------------------------------- |
| `notification.test_sent` | Log kiểm toán cho việc test gửi notification |

> Sự kiện sẽ được gửi async tới `audit-logging-service`, không đưa vào luồng gửi thật.

---

#### ❌ Mã lỗi có thể trả về

| HTTP | `error_code`                   | Mô tả                                          |
| ---- | ------------------------------ | ---------------------------------------------- |
| 401  | `auth.unauthorized`            | Thiếu hoặc sai JWT token                       |
| 403  | `auth.permission_denied`       | Không có quyền `notif.send.test`               |
| 400  | `notif.template_not_found`     | Không tìm thấy template tương ứng `event_code` |
| 400  | `notif.invalid_recipient`      | Sai định dạng email hoặc số điện thoại         |
| 400  | `common.validation_failed`     | Payload không hợp lệ (thiếu field)             |
| 429  | `common.rate_limited`          | Gửi thử quá nhanh trong thời gian ngắn         |
| 500  | `common.internal_server_error` | Lỗi hệ thống khi gửi thử notification          |

> Mọi mã lỗi tuân thủ định nghĩa trong [Error Codes](../../../standards/error-codes.md)

---

#### 🧪 Gợi ý kiểm thử

| Tình huống                 | Kết quả mong đợi                          |
| -------------------------- | ----------------------------------------- |
| Không có token             | `401 unauthorized`                        |
| Token không có quyền       | `403 permission_denied`                   |
| Sai `event_code`           | `400 notif.template_not_found`            |
| Sai `recipient`            | `400 notif.invalid_recipient`             |
| Thiếu `channel`            | `400 common.validation_failed`            |
| Gửi thử thành công         | `200`, status = `sent`, có `preview` HTML |
| Gửi quá nhanh              | `429 common.rate_limited`                 |
| Gửi bằng token tenant khác | `403 permission_denied`                   |

---

## 4. 📌 API: `/notifications/templates`

API dùng để liệt kê danh sách metadata của các template notification đang được áp dụng cho `tenant` hiện tại.  
Không trả nội dung đầy đủ (body), chỉ metadata cần thiết phục vụ giao diện chọn template.

---

#### 📥 Request

```http
GET /notifications/templates
Authorization: Bearer <JWT>
X-Tenant-ID: tenant-vas-001
```

**Query Parameters (tuỳ chọn):**

| Tên       | Kiểu    | Mô tả                          |
| --------- | ------- | ------------------------------ |
| `channel` | string  | Lọc theo kênh (`email`, `sms`) |
| `active`  | boolean | Lọc theo trạng thái đang bật   |

---

#### 📤 Response

```json
{
  "meta": {
    "total_items": 2
  },
  "data": [
    {
      "template_id": "tmpl-welcome-01",
      "event_code": "user.welcome",
      "channel": "email",
      "language": "vi",
      "version": 3,
      "active": true,
      "updated_at": "2025-06-01T08:00:00Z"
    },
    {
      "template_id": "tmpl-resetpass-01",
      "event_code": "user.reset_password",
      "channel": "email",
      "language": "en",
      "version": 1,
      "active": true,
      "updated_at": "2025-05-10T14:32:12Z"
    }
  ]
}
```

> Response sử dụng `Envelope` theo `ADR-012`.

---

#### 🔐 Phân quyền & Điều kiện

| Thuộc tính              | Giá trị                       |
| ----------------------- | ----------------------------- |
| `x-required-permission` | `notif.read.template`         |
| `x-condition`           | `tenant_id = {{X-Tenant-ID}}` |

---

#### 📣 Sự kiện phát ra

Không phát sinh sự kiện. Đây là API dạng *read-only*, không có side effect.

---

#### ❌ Mã lỗi có thể trả về

| HTTP | `error_code`                   | Mô tả                                |
| ---- | ------------------------------ | ------------------------------------ |
| 401  | `auth.unauthorized`            | Thiếu hoặc sai JWT token             |
| 403  | `auth.permission_denied`       | Không có quyền `notif.read.template` |
| 400  | `common.validation_failed`     | Tham số query không hợp lệ           |
| 429  | `common.rate_limited`          | Truy cập quá nhanh, bị giới hạn      |
| 500  | `common.internal_server_error` | Lỗi không xác định từ hệ thống       |

> Tất cả mã lỗi tuân thủ [Error Codes](../../../standards/error-codes.md)

---

#### 🧪 Gợi ý kiểm thử

| Tình huống                        | Kết quả mong đợi                      |
| --------------------------------- | ------------------------------------- |
| Token không hợp lệ                | `401 unauthorized`                    |
| Thiếu quyền `notif.read.template` | `403 permission_denied`               |
| Gọi API với token hợp lệ          | 200, danh sách metadata template đúng |
| Lọc theo `channel=email`          | Chỉ trả các template email            |
| Lọc theo `active=false`           | Trả các template không còn dùng       |
| Không có template nào             | `data=[]`, không lỗi                  |

---

## 📌 Phụ lục: Bảng Permission Code

Dưới đây là bảng phân quyền (RBAC) áp dụng cho `notification-service/sub/`.  
Mỗi permission xác định rõ hành động cho một loại tài nguyên và phạm vi (scope).  
Permission được kiểm tra dựa trên JWT claim (`permissions`) kết hợp với điều kiện `tenant_id`.

| `permission_code`       | Mô tả quyền                                | Áp dụng cho API                           | `resource`            | `scope`  |
|-------------------------|--------------------------------------------|-------------------------------------------|------------------------|----------|
| `notif.read.log`        | Truy vấn log notification đã gửi          | `GET /notifications/logs`                | `NotificationLog`     | `read`   |
| `notif.send.test`       | Gửi thử notification bằng template         | `POST /notifications/test`               | `NotificationSendTest`| `write`  |
| `notif.read.template`   | Truy vấn metadata template của tenant      | `GET /notifications/templates`           | `NotificationTemplate`| `read`   |

> ✅ Tất cả các permission đều được kiểm tra cùng `x-condition: tenant_id = {{X-Tenant-ID}}` để đảm bảo isolation giữa các tenant.

---

🔒 **Best Practice**:
- Các role như `notification_admin`, `tenant_config_editor` có thể được gán những permission này.
- Không nên gán trực tiếp cho end-user frontend, chỉ áp dụng cho Admin Webapp hoặc hệ thống liên kết.

---

📚 **Tài liệu liên quan:**

* [Data Model](./data-model.md)
* [OpenAPI Spec](./openapi.yaml)
* [Design](./design.md)
* [ADR-012 – Response Structure](../../../ADR/adr-012-response-structure.md)
* [ADR-011 – Error Format](../../../ADR/adr-011-api-error-format.md)
* [Error Codes](../../../standards/error-codes.md)
