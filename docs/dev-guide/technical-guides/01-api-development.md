# 🔧 01. API Development – Hướng dẫn Phát triển API

Tài liệu này mô tả các quy tắc và quy trình chuẩn để thiết kế, triển khai và kiểm thử API trong hệ thống DX-VAS, đảm bảo tuân thủ các ADR và chuẩn 5⭐ đã ban hành.

---

## 1. 📐 Thiết kế API theo nguyên tắc "Contract First"

- Luôn **viết `interface-contract.md` và `openapi.yaml` trước khi bắt đầu code**.
- Các thành phần bắt buộc phải có trong file OpenAPI:
  - `info`, `servers`, `tags`, `securitySchemes`
  - `components/schemas` đầy đủ mô tả (`description`, `example`)
  - `x-required-permission`, `x-emits-event`, `x-audit-action` nếu áp dụng
- Tuân thủ [ADR-011 - API Error Format](../../ADR/adr-011-api-error-format.md) và [ADR-012 - Response Structure](../../ADR/adr-012-response-structure.md)

---

## 2. 📎 Quy ước Endpoint và Path

- Sử dụng danh từ số nhiều (plural nouns):  
  ✅ `/users`, `/notifications`, `/templates`
- Các thao tác đặc biệt nên dùng `/action` ở POST body:  
  ✅ `POST /users/reset-password`
- Với resource cụ thể:  
  ✅ `GET /users/{id}`, `PUT /templates/{id}`

Tham khảo: [ADR-013 - Path Naming Convention](../../ADR/adr-013-path-naming-convention.md)

---

## 3. 🧾 Header & Request chuẩn

- Bắt buộc các header:
  - `Authorization: Bearer <JWT>` – trừ các public API
  - `X-Request-ID` – tự động sinh ở Gateway nếu chưa có
  - `X-Tenant-ID` – bắt buộc nếu service hỗ trợ multi-tenant
- Với `GET` không bao giờ được dùng `requestBody`
- Pagination: dùng `page` và `limit` là query parameter chuẩn

---

## 4. 📤 Response chuẩn & lỗi

- Tất cả response **bọc trong object** có 2 field:
  - `data`: kết quả chính
  - `meta`: metadata (timestamp, request_id…)

```json
{
  "data": { ... },
  "meta": {
    "request_id": "req-123",
    "timestamp": "2025-06-05T10:00:00Z"
  }
}
```

* Lỗi phải dùng chuẩn `ErrorEnvelope`:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Trường email không hợp lệ"
  },
  "meta": {
    "request_id": "req-456",
    "timestamp": "2025-06-05T10:01:23Z"
  }
}
```

---

## 5. 🔐 Phân quyền (RBAC)

* Mỗi endpoint phải chỉ định rõ:

  ```yaml
  x-required-permission: notification.template.read
  ```
* Middleware sẽ validate `permission` của user trong JWT
* Nếu endpoint chỉ audit mà không cần permission, thêm `x-audit-action` nhưng không cần `x-required-permission`

---

## 6. 📣 Sự kiện (Event Emission)

* Nếu API tạo ra sự kiện, cần chỉ rõ:

  ```yaml
  x-emits-event:
    - global_notification_requested
  ```
* Tên sự kiện phải được định nghĩa trong `data-model.md` và mapping trong schema pub/sub
* Luôn đặt mã `event_id`, `source`, `timestamp` trong payload sự kiện

---

## 7. 🧪 Kiểm thử API

* Viết test cho:

  * Logic xử lý (unit)
  * Tính đúng schema và response (integration)
* Kiểm thử cả mã lỗi 400/403/500
* Có thể dùng OpenAPI validator để kiểm tra contract
* Đảm bảo tất cả service đạt `coverage > 80%`

---

> 📌 Tài liệu này là bắt buộc đối với mọi backend developer. Mọi API sai chuẩn sẽ không được merge vào `dev`.
