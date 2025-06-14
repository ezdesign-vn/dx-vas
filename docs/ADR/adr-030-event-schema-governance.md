---
id: adr-030-event-schema-governance
title: "ADR-030 - Chiến lược quản lý schema sự kiện (event schema governance)"
status: "accepted"
author: "DX VAS Platform Team"
date: "2025-06-03"
tags: [event, schema, pubsub, governance, dx-vas]
---

# ADR-030: Chiến lược quản lý schema sự kiện (event schema governance)

## 1. 📌 Bối cảnh (Context)

Trong kiến trúc DX-VAS, nhiều service quan trọng như User Service, Auth Service, SMS sử dụng Pub/Sub để phát các sự kiện (events) phục vụ cho tính năng realtime hoặc tích hợp xuống các hệ thống phân tích. 

Tuy nhiên, hệ thống hiện chưa có một cơ chế quản lý schema sự kiện rõ ràng, dẫn đến nguy cơ:
- Thay đổi field trong sự kiện gây lỗi ngầm ở các consumer.
- Không kiểm soát versioning schema theo thời gian.
- Khó tích hợp vào pipeline ETL hoặc AI analytics engine.

Đặc biệt, để phục vụ cho **Data Lake / Reporting Service** và các dự án AI sau này, mọi sự kiện cần được schema hóa, version hóa và kiểm soát chặt chẽ.

---

## 2. 🧠 Quyết định (Decision)

Chúng tôi quyết định chuẩn hóa chiến lược quản lý schema sự kiện theo hướng:
- Mỗi sự kiện có một **schema định nghĩa chuẩn** (JSON Schema hoặc Protobuf).
- Mỗi sự kiện mang theo thông tin version rõ ràng (vd: `vas.user.created.v1`)
- Tất cả schema được lưu trữ và công bố trong một **event registry trung tâm**.
- Các service có thể phát **sự kiện thứ cấp** (vd: `vas.audit.persisted.v1`) để phục vụ hệ thống downstream như ETL pipeline, AI analytics hoặc alerting system. 
- Các schema này vẫn phải đăng ký & quản lý như các schema thông thường.

---

## 3. 🧱 Chi tiết Thiết kế / Giải pháp (Design / Solution Details)

### 3.1. Định danh sự kiện (Event Naming)

Định danh theo chuẩn:
```

vas.<domain>.\<event\_name>.v<version>

```

Ví dụ:
- `vas.auth.login_success.v1`
- `vas.user.created.v2`
- `vas.lms.lesson_completed.v1`

- Tên sự kiện có thể phản ánh mục đích nội bộ hoặc downstream như:
  - `vas.audit.persisted.v1` (được phát bởi Audit Logging Service)
  - `vas.report.generated.v1` (do Reporting Service phát sau khi sinh xong báo cáo)
- Những sự kiện này gọi là **sự kiện thứ cấp (secondary events)** – không bắt buộc, nhưng hữu ích cho tích hợp phân tích/AI/logging.

### 3.2. Quy ước schema

...

- Mọi field mới đều phải tuân theo **Backward-compatible changes**:
  - ✅ Add optional field
  - ✅ Extend enum
  - ❌ Remove required field
  - ❌ Rename field

- Khi một version mới được phát hành với thay đổi phá vỡ (breaking change), producer **có thể tạm thời phát song song version cũ và mới (dual-publish)** để hỗ trợ các consumer chưa nâng cấp kịp. Thời gian hỗ trợ song song cần được thống nhất giữa các bên liên quan hoặc được công bố trong `README` registry.

### 3.3. Kho lưu trữ & Public registry

- Tạo thư mục `/event-schemas/` trong repo chính.
- Mỗi file schema là một version cố định: `user.created.v1.schema.json`
- Viết `README.md` liệt kê tất cả các sự kiện hợp lệ. Nội dung `event registry` bao gồm:
  - Tên sự kiện: `vas.<domain>.<event>.v<version>`
  - Link đến schema file
  - Mô tả ngắn gọn chức năng sự kiện
  - Producer chính
  - Consumer hiện tại hoặc tiềm năng (nếu biết)
  - Trạng thái: `active`, `deprecated`, `draft`, ...
  - Phân loại: `primary` (người dùng gây ra) / `secondary` (nội bộ hệ thống tạo ra để tracking hoặc downstream)

- (Tương lai) Có thể cân nhắc sử dụng một **Schema Registry chuyên dụng** như Google Schema Registry, Confluent Schema Registry hoặc dịch vụ tùy biến để quản lý tốt hơn khi số lượng schema lớn.

### 3.4. Công cụ kiểm tra & validate

- Mọi producer phải validate schema trước khi phát sự kiện (unit test hoặc linter).
- Consumer có thể sử dụng auto-codegen từ schema để đảm bảo đồng bộ.
- Khuyến khích sử dụng thư viện hỗ trợ deserialize + validate JSON Schema (như `ajv`, `jsonschema`, `pydantic`, `zod`, ...) để đảm bảo dữ liệu sự kiện hợp lệ trước khi xử lý logic downstream.

### 3.5. Luồng thay đổi schema

1. Thêm schema mới → PR vào `/event-schemas/`
2. Reviewer kiểm tra backward-compatibility
3. Merge → cập nhật README registry + gắn version
4. Với sự kiện thứ cấp (`*.persisted.v1`, `*.failed.v1`), cần mô tả rõ trigger và giá trị phân tích để tránh lạm dụng phát tán.

### 3.6. 📦 Ví dụ bổ sung schema `audit_log_persisted.v1` (đặt tại `/event-schemas/audit.persisted.v1.schema.json`)

> Sẽ do ALS phát sau khi ghi log thành công.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "AuditLogPersisted",
  "type": "object",
  "properties": {
    "event": { "type": "string", "enum": ["vas.audit.persisted.v1"] },
    "log_id": { "type": "string", "description": "ID của log trong BigQuery hoặc Firestore" },
    "tenant_id": { "type": "string" },
    "timestamp": { "type": "string", "format": "date-time" },
    "source_service": { "type": "string" },
    "action_type": { "type": "string" }
  },
  "required": ["event", "log_id", "tenant_id", "timestamp", "source_service", "action_type"]
}
```

---

## 4. ✅ Hệ quả (Consequences)

### 4.1. Ưu điểm
- ✅ Truy vết, version rõ ràng mọi sự kiện trên hệ thống
- ✅ Bảo vệ các consumer trước thay đổi phá vỡ
- ✅ Cho phép gen code tự động từ schema (cho ETL hoặc AI)
- ✅ Làm nền tảng cho AI Agent hiểu được context từng sự kiện

### 4.2. Nhược điểm / Rủi ro / Lưu ý
- ⚠️ Tăng chi phí quản lý schema
  - *Giải pháp:* Dùng codegen + CI validate schema
- ⚠️ Một số adapter cũ không hỗ trợ Pub/Sub chuẩn
  - *Giải pháp:* Có thể dùng wrapper service hoặc ETL pull

---

## 5. 🔄 Các Phương án Khác đã Cân nhắc

### 5.1. Không dùng version trong tên sự kiện
- **Lý do không chọn:** Gây khó khăn khi breaking changes xảy ra

### 5.2. Dùng schema tự do / không định danh
- **Lý do không chọn:** Không thể scale khi số lượng event tăng

---

## 6. 📎 Tài liệu liên quan

- [ADR-028 - Reporting Architecture](./adr-028-reporting-architecture.md)
- [ADR-029 - Report Template Schema](./adr-029-report-template-schema.md)
- [README.md - Sơ đồ hệ thống](../README.md)
- [event-schemas/registry](../event-schemas/README.md)
