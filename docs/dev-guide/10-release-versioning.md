# 🧾 10. Release Versioning – Quy ước Đánh số Phiên bản & Quản lý Release

Tài liệu này hướng dẫn cách đánh version, ghi chú release và quản lý sự đồng bộ giữa các thành phần (API, Event, Container) trong hệ thống DX-VAS, nhằm đảm bảo mọi thay đổi đều rõ ràng, có thể truy vết và không phá vỡ backward compatibility một cách vô ý.

---

## 1. 🎯 Mục tiêu

- Dễ dàng theo dõi lịch sử phát hành, rollback hoặc audit sau này.
- Đồng bộ giữa các team Backend – Frontend – DevOps – QA.
- Tuân thủ chuẩn **Semantic Versioning** để phân biệt rõ tính chất thay đổi.

---

## 2. 🔢 Quy tắc Đánh số Phiên bản (Semantic Versioning)

Dạng chuẩn:  
```

v<MAJOR>.<MINOR>.<PATCH>

```

| Thành phần | Ý nghĩa                                               | Khi nào thay đổi |
|------------|--------------------------------------------------------|------------------|
| `MAJOR`    | Thay đổi phá vỡ tương thích (breaking change)         | Thêm/sửa/xoá field trong API, event, schema... |
| `MINOR`    | Tính năng mới, tương thích ngược (backward-compatible) | Thêm API mới, field mới |
| `PATCH`    | Sửa lỗi, cải tiến nhỏ không thay đổi contract          | Fix bug, tối ưu hiệu năng |

**Ví dụ:**
- `v1.0.0`: bản release đầu tiên
- `v1.1.0`: thêm API mới
- `v2.0.0`: xoá field cũ không dùng nữa → breaking change

---

## 3. 📦 Version trong Container & OpenAPI

- Mỗi Docker image phải có 2 tag:
  - `vas-user-service:v1.2.0`
  - `vas-user-service:latest` (trỏ về bản mới nhất)
- OpenAPI file (`openapi.yaml`) phải có version rõ ràng:

```yaml
info:
  title: User Service API
  version: 1.2.0
```

* Contract test dùng `openapi.version` để kiểm tra schema đúng version.

---

## 4. 📣 Version cho Event Schema

* Mỗi event phải khai báo `meta.version`:

```json
{
  "event": "user.created",
  "meta": {
    "version": "1.0.0",
    "timestamp": "..."
  },
  "payload": { ... }
}
```

* Nếu thay đổi **schema**, phải bump:

  * `PATCH` nếu thêm field không ảnh hưởng consumer
  * `MAJOR` nếu đổi tên/xoá field → cần thông báo migration

---

## 5. 📝 Release Note & Tag Git

* Mỗi bản release lên Production phải:

  * Tạo Git Tag: `v1.3.0`
  * Tạo GitHub Release Note (changelog)
  * Gắn link changelog vào Wiki hoặc Slack
* Mẫu changelog:

  ```md
  ## v1.3.0 (2025-06-06)
  - ✨ Thêm API `GET /notifications/{id}`
  - 🛠️ Fix lỗi phân trang bị sai ở `/users`
  - 🔐 Bỏ field `password_plain` (breaking)
  ```

---

## 6. ⚠️ Khi nào cần bump MAJOR?

| Thay đổi                               | Có cần MAJOR không? |
| -------------------------------------- | ------------------- |
| Thêm field mới vào API response        | ❌ MINOR             |
| Đổi tên trường trong payload           | ✅ MAJOR             |
| Xoá API cũ không dùng nữa              | ✅ MAJOR             |
| Sửa lỗi trong xử lý logic              | ❌ PATCH             |
| Bổ sung enum mới (backward-compatible) | ❌ MINOR             |
| Đổi kiểu dữ liệu (string → int)        | ✅ MAJOR             |

---

## 7. 🧪 Kiểm thử Tương thích (Backward Compatibility)

* Mỗi khi release:

  * Contract test sẽ so sánh schema mới với schema version trước
  * Nếu phát hiện breaking → CI sẽ cảnh báo và yêu cầu MAJOR bump
* Pub/Sub consumer phải support version fallback nếu có khả năng.

---

## 8. 🚫 Những điều không nên làm

* ❌ Không tag version nếu chưa có release note rõ ràng
* ❌ Không overwrite Docker tag `v1.2.0` → tag phải bất biến
* ❌ Không deploy bản `dev` vào Production
* ❌ Không cập nhật OpenAPI version bằng tay nếu chưa release

---

> 📌 Ghi nhớ: Một hệ thống có versioning rõ ràng sẽ giúp giảm xung đột giữa các team, rollback dễ dàng và tăng niềm tin với khách hàng.
