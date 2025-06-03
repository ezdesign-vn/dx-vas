---
id: adr-027-data-management-strategy
title: ADR-027 - Chiến lược Quản lý Dữ liệu cho hệ thống dx-vas
status: accepted
author: DX VAS Platform Team
date: 2025-05-30
tags: [data, retention, anonymization, deletion, audit, schema, dx-vas]
---

# ADR-027: Chiến lược Quản lý Dữ liệu cho hệ thống dx-vas

## 📌 Bối cảnh

Hệ thống dx-vas xử lý nhiều loại dữ liệu nhạy cảm, lịch sử, và nghiệp vụ – bao gồm thông tin học sinh, nhân viên, phân quyền, học phí, log sự kiện... Việc quản lý dữ liệu không chỉ cần tuân thủ các quy định pháp lý (FERPA, GDPR) mà còn phải đảm bảo:
- Tính truy vết và khôi phục (audit & recovery)
- Bảo mật và giới hạn truy cập hợp lý
- Tối ưu hóa chi phí lưu trữ & hiệu suất

---

## 🧱 Thành phần chiến lược quản lý dữ liệu

### 1. Phân loại dữ liệu

| Loại dữ liệu | Ví dụ | Ghi chú |
|-------------|-------|--------|
| PII (có thể định danh) | Họ tên, email, IP, SĐT | Phải được mask hoặc ẩn danh khi không còn sử dụng |
| Dữ liệu nghiệp vụ | Điểm số, lịch sử lớp học, user-role | Giữ lâu dài, phục vụ phân tích và audit |
| Dữ liệu tạm thời | OTP, upload draft, xác minh | Có thể hard delete sau 1–7 ngày |
| Logs / Audit trail | request logs, hành động người dùng | Không xóa thủ công, có retention rõ ràng |
| Dữ liệu phân tích | Tổng hợp số liệu, hành vi | Có thể ẩn danh để dùng lâu dài cho BI/ML |

---

### 2. Chính sách Anonymization & Privacy

Theo [ADR-024 - Data Anonymization Retention](./adr-024-data-anonymization-retention.md):
- Dữ liệu production chỉ dùng cho dev/test sau khi đã ẩn danh hóa
- Email → `n***@gmail.com`, IP → `/24 subnet` hoặc SHA256
- Logs phải được filter để loại bỏ PII trước khi gửi ra ngoài

---

### 3. Soft Delete & Retention

Theo [ADR-026 - Hard Delete Policy](./adr-026-hard-delete-policy.md):
- KHÔNG hard delete các object có liên kết lịch sử, audit, compliance, hoặc khả năng phục hồi
- Sử dụng `status`, `is_deleted`, `is_archived` để soft delete
- Cronjob định kỳ có thể purge dữ liệu đã bị xóa mềm sau 365 ngày (nếu hợp lệ)

| Object | Trạng thái soft delete | Retention tối thiểu |
|--------|------------------------|---------------------|
| `users_global` | `status = deleted` | ≥ 1 năm |
| `user_tenant_assignments` | `assignment_status = revoked` | ≥ 1 năm |
| `student_records` | `is_archived = true` | ≥ 5 năm |
| `audit_logs` | Không được xóa | 180 ngày (prod) |
| OTP / Draft | Xóa vật lý | 1–7 ngày |

---

### 4. Migration Schema & Tính tương thích

Theo [ADR-023 - Schema Migration Strategy](./adr-023-schema-migration-strategy.md):
- Mọi thay đổi schema đều phải qua bước chuẩn bị → chuyển tiếp → dọn dẹp
- Không rename/drop trực tiếp trong bản deploy
- Script migration và rollback được quản lý riêng qua CI/CD

---

### 5. Quy trình truy cập & bảo mật dữ liệu

Theo [ADR-003 - Secrets](./adr-003-secrets.md) và [ADR-004 - Security](./adr-004-security.md):
- Secrets lưu trong Google Secret Manager theo môi trường
- Truy cập PII chỉ được cấp cho nhóm Platform/Data có audit trail
- Mọi action export dữ liệu thật phải log và ghi lý do

---

### 6. Cost Observability & Logging

Theo [ADR-020 - Cost Observability](./adr-020-cost-observability.md):
- Mọi service/data resource gắn tag: `dx-vas_service`, `env`, `team`
- Thiết lập alert nếu chi phí logging, Redis, Cloud Run vượt ngưỡng
- Export billing → BigQuery → Dashboard Looker Studio

---

Dưới đây là MARKDOWN BLOCK cập nhật cho `adr-027-data-management-strategy.md` theo các change request mới:

---

### 7. Tích hợp với Data Warehouse / Reporting Service

* Dữ liệu phân tích từ các service nguồn sẽ được trích xuất định kỳ hoặc realtime vào **Data Warehouse (BigQuery)** để phục vụ báo cáo, phân tích, và AI.
* Các bảng/fact table trong Data Warehouse phải:

  * Được tách riêng khỏi OLTP schema.
  * Có quy ước version/schema rõ ràng (tuân theo `ADR-030 - Event Schema Governance` nếu sinh từ Pub/Sub).
  * Có retention phù hợp: tối thiểu 1 năm, ưu tiên lưu lâu dài dạng đã ẩn danh.
* Mọi ETL pipeline phải:

  * Ghi log đầy đủ và có cơ chế kiểm tra chất lượng dữ liệu (data quality checks).
  * Mask thông tin nhạy cảm trước khi ghi dữ liệu vào bảng phân tích, trừ khi đã được ủy quyền.
  * Tuân thủ chiến lược ẩn danh hóa của `ADR-024`.

---

## ✅ Lợi ích

- Dễ truy vết, khôi phục và phân tích dữ liệu lịch sử
- Tuân thủ tốt các yêu cầu pháp lý và chính sách nội bộ
- Tối ưu hiệu suất và chi phí lưu trữ
- Tránh lỗi xóa dữ liệu không thể khôi phục

---

## ❌ Rủi ro & Giải pháp

| Rủi ro | Giải pháp |
|--------|-----------|
| Quản lý trạng thái soft delete thiếu thống nhất | Chuẩn hóa enum `status`, enforce qua CI/CD |
| Dữ liệu thật bị dùng sai mục đích | Tất cả môi trường dev/staging phải dùng dữ liệu đã ẩn danh |
| Quá tải dữ liệu log hoặc dữ liệu cũ | Purge tự động, cold storage, retention policy |

---

## 📎 Tài liệu liên quan

- [ADR-003 - Secrets](./adr-003-secrets.md)
- [ADR-004 - Security](./adr-004-security.md)
- [ADR-023 - Schema Migration](./adr-023-schema-migration-strategy.md)
- [ADR-024 - Data Anonymization & Retention](./adr-024-data-anonymization-retention.md)
- [ADR-026 - Hard Delete Policy](./adr-026-hard-delete-policy.md)
- [ADR-020 - Cost Observability](./adr-020-cost-observability.md)
- [ADR-028 - Reporting Architecture](./adr-028-reporting-architecture.md)
- [ADR-029 - Report Template Schema](./adr-029-report-template-schema.md)
- [ADR-030 - Event Schema Governance](./adr-030-event-schema-governance.md)

---

> “Dữ liệu tốt là dữ liệu được kiểm soát, bảo vệ và hiểu đúng mục đích.”
