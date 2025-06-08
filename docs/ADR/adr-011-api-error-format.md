---
id: adr-011-api-error-format
title: ADR-011 - Chuẩn hóa định dạng lỗi API trong hệ thống dx-vas
status: accepted
author: DX VAS Platform Team
date: 2025-06-09
tags: [api, error, format, dx-vas]
---

# ADR-011: API Error Format

## 📌 Bối cảnh

Các dịch vụ API của **dx-vas** phục vụ web, mobile, admin dashboard và service-to-service.  
Sau **Change Request 03-cr-token-service** (giới thiệu TokenService & namespace mã lỗi) yêu cầu mọi service **thống nhất cấu trúc lỗi** và **quy ước đặt tên `error.code`** để:

* Frontend/i18n dịch thông báo dễ dàng.  
* Gateway & observability truy vấn log theo `namespace.*`.  
* TokenService, Auth, Gateway dùng chung bảng mã lỗi (token.*, session.*, …) :contentReference[oaicite:0]{index=0}.

---

## 🧠 Quyết định

### 1. ErrorEnvelope chuẩn

```json
{
  "error": {
    "code": "<namespace.error_key>",
    "message": "<Human-readable>",
    "details": { /* optional for debug */ }
  },
  "meta": {
    "timestamp": "2025-06-09T12:34:56Z",
    "trace_id": "trace-xyz",
    "service": "api_gateway"
  }
}
```

* HTTP status vẫn tuân thủ REST (`400`, `401`, `403`, `404`, `409`, `422`, `500`…).
* `meta.trace_id` khớp hệ thống tracing; **luôn có timestamp**.
* `error.details` chỉ dùng nội bộ; không trả PII ra ngoài.

### 2. Quy ước `error.code`

* Cấu trúc: `namespace.error_key` (snake\_case).
* Danh sách chính thức duy trì tại **docs/standards/error-codes.md** .

  * Ví dụ: `token.expired`, `session.not_found`, `auth.unauthorized`, `common.validation_failed`.
* Mỗi service đăng ký namespace mới qua PR cập nhật file chuẩn.

### 3. Mapping HTTP ↔ `error.code`

| HTTP | Namespace ví dụ                       | Ghi chú                         |
| ---- | ------------------------------------- | ------------------------------- |
| 400  | `common.validation_failed`            | Payload sai hoặc thiếu trường   |
| 401  | `auth.unauthorized`                   | Thiếu token                     |
| 403  | `auth.permission_denied`              | Không đủ quyền                  |
| 404  | `user.not_found`, `session.not_found` | Không tìm thấy resource / phiên |
| 409  | `user.already_exists`                 | Xung đột                        |
| 422  | `token.invalid`                       | JWT sai chữ ký or malformed     |
| 500  | `common.internal_error`               | Lỗi không xác định              |

### 4. Định nghĩa OpenAPI Schema (tham chiếu ADR-012)

```yaml
components:
  schemas:
    ApiErrorInternal:
      type: object
      required: [code, message]
      properties:
        code:
          type: string
          example: token.expired
        message:
          type: string
          example: Token đã hết hạn
        details:
          type: object
          additionalProperties: true
    ApiErrorResponse:
      type: object
      properties:
        error:
          $ref: '#/components/schemas/ApiErrorInternal'
        meta:
          $ref: '#/components/schemas/ResponseMeta'
```

*(`ResponseMeta` định nghĩa tại ADR-012 – Response Structure).*

### 5. Ví dụ phản hồi

#### ❌ Lỗi token hết hạn

```json
{
  "error": {
    "code": "token.expired",
    "message": "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại."
  },
  "meta": {
    "timestamp": "2025-06-09T12:00:00Z",
    "trace_id": "trace-token-123",
    "service": "api_gateway"
  }
}
```

#### ✅ Thành công

```json
{
  "data": {
    "user_id": "u123",
    "roles": ["student"]
  },
  "error": null,
  "meta": {
    "timestamp": "2025-06-09T12:00:05Z",
    "trace_id": "trace-token-123",
    "service": "token_service"
  }
}
```

### 6. Tích hợp & CI

* Middleware mỗi service tự động đóng gói lỗi thành ErrorEnvelope.
* CI linter kiểm tra tất cả response mẫu (OpenAPI) phải dẫn xuất từ `ApiErrorResponse`.
* Wrapper client (frontend & inter-service) bắt `error.code` để xử lý logic/i18n.

---

## ✅ Lợi ích

* **Nhất quán** toàn hệ thống, dễ debug và monitor.
* **Dễ mở rộng** namespace mới mà không phá vỡ client.
* **Bảo mật**: chi tiết debug ẩn sau `details`, chỉ log nội bộ.

## ❌ Rủi ro & Giải pháp

| Rủi ro                             | Giải pháp                                          |
| ---------------------------------- | -------------------------------------------------- |
| Service legacy chưa theo chuẩn     | Wrapper chuyển đổi & task tech-debt trong roadmap  |
| Đội dev đặt `error.code` trùng lặp | PR bắt buộc cập nhật `error-codes.md`, code-review |
| Quên gửi `trace_id` / `timestamp`  | Middleware tự động bổ sung, CI unit-test enforced  |

---

## 📎 Tài liệu liên quan

* Change Request: [03-cr-token-service.md](../../requests/03-cr-token-service.md)&#x20;
* Mã lỗi chuẩn: [Error Codes Standard](../../standards/error-codes.md)&#x20;
* Auth Strategy: [ADR-006](./adr-006-auth-strategy.md)
* Response Structure: [ADR-012](./adr-012-response-structure.md)
* API Governance: [ADR-009](./adr-009-api-governance.md)

> “Lỗi là điều không tránh khỏi – chuẩn hóa cách ta nói về lỗi mới là chìa khóa cho hệ thống đáng tin cậy.”
