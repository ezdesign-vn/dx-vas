# 🛢️ 05. Database & Migrations – Hướng dẫn Làm việc với CSDL

Tài liệu này hướng dẫn cách thiết kế, quản lý và triển khai schema CSDL trong hệ thống DX-VAS, tuân thủ chuẩn 5⭐ và các ADR liên quan đến dữ liệu.

---

## 1. 🧠 Triết lý Thiết kế Dữ liệu

- Mọi bảng phải được định nghĩa rõ ràng trong `data-model.md`, bao gồm:
  - Cấu trúc bảng: cột, kiểu dữ liệu, ràng buộc
  - Quan hệ (FK), chỉ mục (index), enum mở rộng (nếu có)
  - Ghi rõ lifecycle & retention (nếu có)
- Không trực tiếp chỉnh sửa DB bằng tay – mọi thay đổi phải thông qua migration.

---

## 2. 📐 Quy tắc Đặt Tên & Chuẩn hóa

- Bảng dùng **snake_case**, danh từ số nhiều: `users`, `notification_logs`
- Enum nên được lưu trong bảng phụ trợ (`channel_types`, `log_statuses`)
- Tên cột nhất quán: `created_at`, `updated_at`, `deleted_at`, `version`
- Dùng `uuid` làm `primary key`, không dùng `serial`

> Tham khảo: [ADR-023 - Schema Migration Strategy](../../ADR/adr-023-schema-migration-strategy.md)

---

## 3. 🗂️ Quản lý Migration

- Dùng **Alembic** cho Python service hoặc tương đương với Node.js (`knex`, `typeorm`, `prisma`, ...)
- Migration phải được lưu trong thư mục:
```

services/<service-name>/migrations/

```
- Mỗi migration nên có tên mô tả:
```

20240601\_add\_notification\_logs\_table.py

```

- Lệnh tạo migration mẫu (Alembic):
```bash
poetry run alembic revision -m "add processed_events table"
```

* Lệnh chạy migration:

  ```bash
  poetry run alembic upgrade head
  ```

---

## 4. 📋 Ghi chú Khi Thiết kế Bảng

* Luôn thêm `created_at`, `updated_at` với mặc định `timezone.now()`
* Các bảng quan trọng cần có:

  * `is_deleted` hoặc `deleted_at` nếu hỗ trợ soft delete
  * `version` để hỗ trợ optimistic locking
* Thêm chỉ mục cho các trường truy vấn nhiều: `user_id`, `status`, `created_at DESC`

---

## 5. 📉 Chiến lược Lifecycle & Retention

* Ghi rõ thời gian giữ liệu (VD: `notification_logs` giữ 180 ngày)
* Dữ liệu lâu ngày cần dọn dẹp bằng:

  * Batch job hoặc cron
  * Rule SQL: `DELETE WHERE created_at < NOW() - interval '180 days'`
* Tham khảo: [ADR-024 - Data Anonymization & Retention](../../ADR/adr-024-data-anonymization-retention.md)

---

## 6. 🚨 Không Bao giờ

* Không sửa schema bằng `psql` trực tiếp
* Không xoá migration cũ đã merge
* Không tạo migration gây **breaking change** mà không có plan migration dữ liệu (backfill)

---

## 7. 🧪 Testing DB

* Tạo `test_db` riêng biệt với prefix `test_`
* Chạy migration trên DB test trong pipeline CI
* Dọn dẹp DB sau mỗi test để tránh dữ liệu dư

---

> 📌 Mọi thay đổi CSDL đều phải có migration, cập nhật `data-model.md` và được review kỹ lưỡng. Nếu có ảnh hưởng tới schema chung (shared schema), cần tạo thêm ADR.
