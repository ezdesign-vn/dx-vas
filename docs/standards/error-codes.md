# 🛡️ Chuẩn Hóa Mã Lỗi (Error Code Standards) - DX-VAS

Tài liệu này định nghĩa **chuẩn hóa các mã lỗi (`error.code`)** được sử dụng thống nhất trong toàn bộ hệ thống DX-VAS, nhằm đảm bảo:

- ✅ Dễ đọc – Có cấu trúc rõ ràng theo nhóm (namespace).
- 🌐 Dễ i18n – Dễ ánh xạ sang message hiển thị theo ngôn ngữ.
- 📊 Dễ phân tích – Log hệ thống có thể lọc theo nhóm lỗi (`token.*`, `user.*`, ...).
- 🔒 An toàn – Không để lộ chi tiết nội bộ khi không cần thiết.

---

## ✅ Quy ước Đặt tên `error.code`

- Cấu trúc: `namespace.error_key`
- `namespace` là tên domain logic: `token`, `auth`, `session`, `user`, `common`, `jwks`, ...
- `error_key` là tên lỗi cụ thể, viết `snake_case`.

Ví dụ:
- `token.expired`
- `session.not_found`
- `common.validation_failed`

---

## 🔒 Nhóm Lỗi Chính (Namespace)

### `token.*` — Các lỗi liên quan đến JWT Token
| Mã lỗi             | Mô tả                                 |
|--------------------|----------------------------------------|
| `token.invalid`     | Token không hợp lệ hoặc bị chỉnh sửa   |
| `token.expired`     | Token đã hết hạn                       |
| `token.revoked`     | Token đã bị thu hồi                    |
| `token.unknown_jti` | Không tìm thấy JTI token trong hệ thống |

### `session.*` — Lỗi liên quan đến phiên đăng nhập
| Mã lỗi             | Mô tả                                 |
|--------------------|----------------------------------------|
| `session.not_found`| Không tìm thấy phiên đăng nhập         |
| `session.inactive` | Phiên đăng nhập đã bị đóng             |

### `auth.*` — Lỗi xác thực
| Mã lỗi               | Mô tả                                 |
|----------------------|----------------------------------------|
| `auth.invalid_credential` | Email/password không đúng        |
| `auth.unauthorized`  | Thiếu hoặc sai token                  |
| `auth.permission_denied` | Không đủ quyền truy cập          |

### `jwks.*` — Lỗi liên quan đến public key / jwks
| Mã lỗi             | Mô tả                                 |
|--------------------|----------------------------------------|
| `jwks.not_found`    | Không tìm thấy JWKS phù hợp            |

### `user.*` — Lỗi liên quan đến người dùng
| Mã lỗi              | Mô tả                                |
|---------------------|---------------------------------------|
| `user.not_found`     | Không tìm thấy người dùng             |
| `user.inactive`      | Người dùng bị khóa                    |
| `user.already_exists`| Email/username đã tồn tại            |

### `common.*` — Lỗi chung
| Mã lỗi                     | Mô tả                                       |
|----------------------------|----------------------------------------------|
| `common.validation_failed` | Payload không đúng định dạng hoặc thiếu field |
| `common.missing_param`     | Thiếu tham số bắt buộc trong request         |
| `common.forbidden`         | Không được phép truy cập                     |
| `common.internal_error`    | Lỗi không xác định trong hệ thống            |

---

## 🧩 Hướng dẫn tích hợp

### 1. Trong OpenAPI
```yaml
components:
  schemas:
    ErrorEnvelope:
      type: object
      properties:
        error:
          type: object
          properties:
            code:
              type: string
              example: "token.expired"
            message:
              type: string
              example: "Token đã hết hạn"
```

### 2. Trong Frontend (i18n)

```js
{
  "token.expired": "Phiên đăng nhập đã hết hạn",
  "auth.invalid_credential": "Tài khoản hoặc mật khẩu không đúng",
  ...
}
```

---

📌 Mọi service cần đăng ký prefix `namespace.*` của mình tại tài liệu này để tránh trùng lặp.

> Được duy trì bởi team DX Platform. Mọi đề xuất bổ sung namespace mới, vui lòng gửi PR cập nhật file này.
