# 📬 03. Event-Driven Development – Hướng dẫn Phát triển theo Kiến trúc Sự kiện

Tài liệu này hướng dẫn cách thiết kế, phát hành và xử lý sự kiện (event) trong hệ thống DX-VAS. Mục tiêu là đảm bảo các service giao tiếp thông qua Pub/Sub theo chuẩn hóa, dễ kiểm soát và mở rộng.

---

## 1. 📐 Triết lý Kiến trúc Sự kiện

- Sự kiện là **giao tiếp chính giữa các master/sub service và adapters**
- Luôn phải định nghĩa schema sự kiện trước khi phát hành
- Tên sự kiện cần phản ánh ngữ nghĩa nghiệp vụ, không phụ thuộc implementation
- Event là immutable – không sửa event đã phát, chỉ phát phiên bản mới

> Tham khảo:  
> - [ADR-030 - Event Schema Governance](../../ADR/adr-030-event-schema-governance.md)  
> - [ADR-027 - Data Management Strategy](../../ADR/adr-027-data-management-strategy.md)

---

## 2. 🧱 Cấu trúc Một Event

Một sự kiện chuẩn phải có cấu trúc 2 phần: `meta` và `data`.

```json
{
  "meta": {
    "event_id": "evt-abc123",
    "event_name": "global_notification_requested",
    "source": "notification-service.master",
    "timestamp": "2025-06-05T10:00:00Z",
    "version": "v1"
  },
  "data": {
    "template_id": "tpl-001",
    "target_user_ids": ["user-123", "user-456"],
    "channel": "email"
  }
}
```

* `event_name`: viết dưới dạng snake\_case
* `source`: định danh theo service (có hậu tố `.master` hoặc `.sub`)
* `version`: luôn có (để hỗ trợ versioning schema)

---

## 3. 📤 Phát Sự kiện (Publishing Events)

* Service phát sự kiện cần:

  * Dùng thư viện chuẩn (`event_publisher.py`, `pubsub_adapter.js`)
  * Log rõ `event_id`, `topic`, `payload`
* Sự kiện phải được định nghĩa trước trong `data-model.md` (phụ lục Event Emitted)
* Gửi qua Pub/Sub topic tương ứng theo config môi trường

> Ví dụ trong Python:

```python
event = {
    "meta": {
        "event_id": str(uuid4()),
        "event_name": "user.created",
        "source": "user-service.master",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "version": "v1"
    },
    "data": {
        "user_id": "user-123",
        "email": "a@b.com"
    }
}
publisher.publish("user-events", json.dumps(event).encode("utf-8"))
```

---

## 4. 📥 Tiêu thụ Sự kiện (Consuming Events)

* Sub service hoặc Adapter phải đăng ký `subscription` đúng topic
* Validate schema trước khi xử lý
* Có logic retry khi event fail (dùng Pub/Sub DLQ hoặc thủ công)
* Ghi log rõ `event_id`, `result`, `error` nếu có

> Xem thêm ví dụ trong `notification-service.sub/event_handler.py`

---

## 5. 📦 Quản lý Schema Sự kiện

* Mỗi service phải định nghĩa schema của event mà nó phát trong:

  * `data-model.md` → Phụ lục: "Các Sự kiện Phát ra"
  * `event-schema/` (nếu tách riêng)
* Đặt tên schema theo pattern:

  ```
  events/<domain>/<event_name>.schema.json
  ```

---

## 6. 🧪 Testing & Contract Validation

* Dùng **test contract** giữa service phát và tiêu thụ
* Mọi event test phải đi kèm:

  * `valid.json` → sự kiện hợp lệ
  * `invalid.json` → event bị lỗi schema
* Nếu schema thay đổi → phải cập nhật `version` trong meta

---

## 7. 🚫 Những Điều Không được Làm

* Không publish event **chưa được định nghĩa**
* Không thay đổi cấu trúc `data` mà không version hóa
* Không viết logic xử lý event có side effect **trước khi xác thực schema thành công**
* Không ghi đè `event_id` bằng ID từ client

---

> 📌 Ghi nhớ: Event là xương sống của kiến trúc đa service – đừng tạo nợ kỹ thuật bằng cách xử lý sự kiện không rõ schema.
