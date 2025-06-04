# 📘 Reporting Service – Interface Contract

```
title: Reporting Service – Interface Contract
version: "1.1"
last_updated: "2025-06-04"
author: "DX VAS Team"
reviewed_by: "Stephen Le"
```

* Tài liệu này mô tả các API chính mà **Reporting Service** cung cấp, phục vụ nhu cầu báo cáo phân tích toàn hệ thống.
* _Phạm vi (Scope):_
  Reporting Service cho phép Superadmin Webapp và các AI Agent truy vấn các báo cáo đã được định nghĩa qua Report Template, quản lý Template và các cấu hình báo cáo đã lưu. Service không trực tiếp xử lý pipeline ETL hay ghi dữ liệu vào Data Warehouse, mà chỉ tương tác dạng read/query.

> 🧭 **Nguyên tắc chung (General Principles):**
> - Tất cả API yêu cầu `Authorization: Bearer <JWT>`.
> - Header `X-Tenant-ID` được yêu cầu cho mọi request.
> - Header `X-Request-ID` được sinh ra và trả về trong response để hỗ trợ trace.
> - Các response theo chuẩn [ADR-012 Response Structure](../../ADR/adr-012-response-structure.md).
> - Các lỗi theo chuẩn [ADR-011 Error Format](../../ADR/adr-011-api-error-format.md).
> - Tất cả response dạng `GET` là dạng `cached`, nếu có `ETag` được trả về thì nên dùng `If-None-Match` để giảm tải.

---

## 2. 📌 Tóm tắt Endpoint & HTTP Method

| Method | Endpoint | Mô tả ngắn | Phân hệ | Yêu cầu quyền |
|--------|----------|------------|---------|----------------|
| POST   | `/reports/query` | Truy vấn báo cáo theo template | Query Engine | `report.view_*` |
| GET    | `/report-templates` | Lấy danh sách template | Template Management | `report.view_templates` |
| GET    | `/report-templates/{id}` | Chi tiết template | Template Management | `report.view_templates` |
| POST   | `/report-templates` | Tạo template mới | Template Management | `report.manage_templates` |
| PATCH  | `/report-templates/{id}` | Cập nhật template | Template Management | `report.manage_templates` |
| DELETE | `/report-templates/{id}` | Vô hiệu hóa template | Template Management | `report.manage_templates` |
| GET    | `/saved-configs` | Danh sách cấu hình cá nhân | Saved Config | `report.view_saved_config` |
| POST   | `/saved-configs` | Lưu cấu hình báo cáo | Saved Config | `report.manage_saved_config` |
| DELETE | `/saved-configs/{id}` | Xóa cấu hình đã lưu | Saved Config | `report.manage_saved_config` |

---

> 📘 **HTTP Status Codes dùng chung:**
>
> - `200 OK`: Thành công
> - `201 Created`: Tạo mới thành công
> - `204 No Content`: Xóa thành công
> - `400 Bad Request`: Input không hợp lệ
> - `401 Unauthorized`: JWT token không hợp lệ
> - `403 Forbidden`: Thiếu permission theo RBAC
> - `404 Not Found`: Không tìm thấy tài nguyên
> - `409 Conflict`: Phiên bản xung đột
> - `422 Unprocessable Entity`: Input đúng schema nhưng business logic sai
> - `500 Internal Server Error`: Lỗi hệ thống

---

> 🔁 **Sự kiện phát ra (Pub/Sub Events):**
>
> Các API dưới đây sẽ phát sự kiện tương ứng vào `PubSubEvents` để phục vụ mục đích logging/auditing:
>
> | API | Event Code | Ghi chú |
> |-----|------------|---------|
> | `POST /reports/query` | `report.query_logged` | Ghi lại thông tin người dùng thực hiện truy vấn |
> | `POST /report-templates` | `report_template_created` | Ghi lại metadata template |
> | `PATCH /report-templates/{id}` | `report_template_updated` | Bao gồm version mới |
> | `DELETE /report-templates/{id}` | `report_template_disabled` | Không xóa vật lý |
> | `POST /saved-configs` | `report_config_saved` | Ghi lại cấu hình người dùng |
> | `DELETE /saved-configs/{id}` | `report_config_deleted` | Ghi lại hành động |

---

## 2. Nhóm API: `/reports` – Truy vấn báo cáo

> Cho phép truy vấn báo cáo theo template đã được định nghĩa và input tùy chỉnh.  
> Trả về dữ liệu tổng hợp từ Data Warehouse (BigQuery).

### `POST /reports/query`

- **Mô tả:** Thực thi một truy vấn báo cáo dựa trên report template và input parameters từ người dùng.
- **Yêu cầu:** Header chứa `Authorization`, `X-Tenant-ID`, và `Content-Type: application/json`.
- **RBAC:** Cần `x-required-permission` tương ứng với template (VD: `report.view_financial_summary`).

#### 📥 Request Body
```json
{
  "template_id": "student_summary",
  "version": 1,
  "input_parameters": {
    "from_date": "2024-01-01",
    "to_date": "2024-01-31",
    "status": "active"
  }
}
```

#### 📤 Success Response (200 OK)

```json
{
  "meta": {
    "trace_id": "a1b2c3",
    "timestamp": "2025-06-04T10:00:00Z"
  },
  "data": [
    { "date": "2024-01-01", "total_students": 234 },
    { "date": "2024-01-02", "total_students": 241 }
  ]
}
```

#### ⚠️ Error Responses

| HTTP Code | Description                                             |
| --------- | ------------------------------------------------------- |
| 400       | Input không hợp lệ hoặc thiếu input parameters bắt buộc |
| 403       | Không có permission truy cập template                   |
| 404       | Template ID không tồn tại                               |
| 500       | Lỗi xử lý hoặc truy vấn BigQuery thất bại               |

---

## 3. Nhóm API: `/report-templates` – Quản lý mẫu báo cáo

> Cho phép quản trị viên hệ thống (Superadmin) tạo, cập nhật, và truy vấn các mẫu báo cáo (Report Templates).  
> Đây là nền tảng để xây dựng báo cáo động.

---

### `GET /report-templates`

- **Mô tả:** Lấy danh sách tất cả các report templates đang hoạt động.
- **RBAC:** Yêu cầu permission `report.view_templates`.

#### 📤 Response
```json
{
  "meta": {
    "trace_id": "xyz123",
    "timestamp": "2025-06-04T10:30:00Z"
  },
  "data": [
    {
      "id": "student_summary",
      "name": "Tổng kết học sinh theo trạng thái",
      "description": "Hiển thị tổng số học sinh theo trạng thái mỗi ngày",
      "version": 1,
      "active": true
    }
  ]
}
```

---

### `GET /report-templates/{id}`

* **Mô tả:** Truy vấn chi tiết một report template.
* **RBAC:** Yêu cầu `report.view_templates`.

#### 📤 Response

```json
{
  "meta": { "trace_id": "abc123", "timestamp": "2025-06-04T10:35:00Z" },
  "data": {
    "id": "student_summary",
    "version": 1,
    "input_parameters": [
      {
        "name": "from_date",
        "type": "date",
        "required": true,
        "description": "Từ ngày",
        "default_value": null
      }
    ],
    "x-required-permission": "report.view_student_summary"
  }
}
```

---

### `POST /report-templates`

* **Mô tả:** Tạo mới một template.
* **RBAC:** Chỉ dành cho Superadmin – `report.manage_templates`

---

### `PATCH /report-templates/{id}`

* **Mô tả:** Cập nhật nội dung template hoặc metadata.
* **Lưu ý:** Version mới sẽ được tạo, version cũ vẫn được giữ lại nếu có saved reports đang sử dụng.
* **RBAC:** `report.manage_templates`

---

### `DELETE /report-templates/{id}`

* **Mô tả:** Vô hiệu hóa template (không xóa vật lý).
* **RBAC:** `report.manage_templates`

---

## 4. Nhóm API: `/saved-configs` – Quản lý cấu hình báo cáo cá nhân (Tùy chọn)

> Cho phép người dùng (Superadmin) lưu lại các cấu hình truy vấn thường dùng để tái sử dụng sau này.  
> Phục vụ chức năng “My Dashboard” hoặc “Saved Reports”.

---

### `GET /saved-configs`

- **Mô tả:** Lấy danh sách cấu hình báo cáo đã lưu của người dùng hiện tại.
- **RBAC:** `report.view_saved_config`

#### 📤 Response
```json
{
  "meta": { "trace_id": "xyz", "timestamp": "2025-06-04T11:00:00Z" },
  "data": [
    {
      "id": "rpt001",
      "template_id": "student_summary",
      "version": 1,
      "name": "Báo cáo học sinh tháng 1",
      "input_parameters": {
        "from_date": "2024-01-01",
        "to_date": "2024-01-31"
      },
      "created_at": "2025-05-01T10:00:00Z"
    }
  ]
}
```

---

### `POST /saved-configs`

* **Mô tả:** Tạo mới một cấu hình báo cáo đã lưu.
* **RBAC:** `report.manage_saved_config`

#### 📥 Request Body

```json
{
  "template_id": "student_summary",
  "version": 1,
  "name": "Báo cáo học sinh tháng 1",
  "input_parameters": {
    "from_date": "2024-01-01",
    "to_date": "2024-01-31"
  }
}
```

---

### `DELETE /saved-configs/{id}`

* **Mô tả:** Xóa một cấu hình báo cáo đã lưu.
* **RBAC:** `report.manage_saved_config`

---

## 📚 Tài liệu liên quan

- [Design Spec](./design.md)
- [Data Model](./data-model.md)
- [OpenAPI Spec](./openapi.yaml)
- [ADR-012 - Response Structure](../../ADR/adr-012-response-structure.md)
- [ADR-011 - API Error Format](../../ADR/adr-011-api-error-format.md)
- [ADR-029 - Report Template Schema](../../ADR/adr-029-report-template-schema.md)
- [ADR-007 - RBAC Architecture](../../ADR/adr-007-rbac.md)
- [ADR-028 - Reporting Architecture](../../ADR/adr-028-reporting-architecture.md)
- [ADR-030 - Event Schema Governance](../../ADR/adr-030-event-schema-governance.md)
