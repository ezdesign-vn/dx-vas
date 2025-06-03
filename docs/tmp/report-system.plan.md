# 📋 Kế hoạch Triển khai Hệ thống Báo Cáo & Phân Tích VAS DX (v2.2)

## 🎯 Mục tiêu
Thiết lập nền tảng báo cáo đa chiều, phân quyền, đa tenant, chuẩn hóa và mở rộng, sẵn sàng cho tích hợp AI Agent trong tương lai.

---

## I. 🧱 Kiến trúc & Thành phần chính

### 1. Data Platform (OLAP Layer)
- **Thiết lập Data Warehouse/Data Lake**
  - Công nghệ: Google BigQuery / ClickHouse / Snowflake
  - Schema chính: `fact_login`, `fact_user`, `dim_tenant`, `dim_time`, `fact_permission`
  - Hỗ trợ `schema versioning`, `evolution`, `partitioning`, `cold/hot tier`

- **Xây dựng Data Pipeline (CDC + Batch)**
  - CDC bằng Pub/Sub từ Auth, User, Adapters (CRM/SIS/LMS)
  - Batch ETL bằng dbt / Airbyte / custom Python Job
  - Lưu log vào event-catalog.md, theo định danh `vas.{domain}.{event}.v1`

---

### 2. Reporting Service (Microservice Mới)
- **API báo cáo:**
  - `GET /reports/{report_id}` → Query theo view đã chuẩn hóa
  - `GET /reports/{id}/export?format=csv` → Xuất file
- **API quản lý template:**
  - `GET/POST /report-templates`
  - `PUT /report-templates/{id}` → update logic/view/params
- **API dashboard cá nhân:**
  - `GET /saved-reports`, `POST /saved-reports`
- **Bảo mật:** tích hợp OAuth2, phân quyền RBAC (`report.view_*`, `report.manage_*`), log truy cập `ADR-008`

---

### 3. Superadmin Webapp (Mở rộng mới)
- **Module mới: `Báo cáo & Phân tích`**
  - UI chọn loại báo cáo + bộ lọc động (time, tenant, trạng thái...)
  - Viewer theo role + dashboard preview + biểu đồ ECharts
  - Export CSV/PDF + scheduler export
- **Module mới: `Quản lý Mẫu báo cáo`**
  - Form tạo template → define logic + scope + permission yêu cầu
  - Hiển thị danh sách và cấu trúc RBAC liên kết

---

### 4. Các Service nguồn (User, Auth, Adapters)
- Phát thêm Pub/Sub event: `user_login_success`, `user_created`, `class_assigned`, `crm_event_logged`
- Chuẩn hóa schema sự kiện theo `ADR-030`
- Đảm bảo endpoint `GET /internal/reporting-extracts?...` nếu dùng ETL pull

---

### 5. ADR & Tài liệu Kiến trúc
- `adr-028-reporting-architecture.md`: flow, modules, data, permission
- `adr-029-report-template-schema.md`: cấu trúc template, scope, input
- `adr-030-event-schema-governance.md`: naming, versioning, registry
- Cập nhật `adr-008`, `adr-007`, `adr-020`, `adr-027` để liên kết lại
- Vẽ lại `system-diagrams.md`, bổ sung Reporting Layer + Flow

---

## II. 📅 Roadmap triển khai 8 tuần

| Tuần | Hạng mục                                    | Trách nhiệm       |
|------|---------------------------------------------|-------------------|
| 1–2  | Viết ADR-028/029/030 + Thiết kế schema DW   | Kiến trúc + Data  |
| 2–3  | Phát triển MVP Pipeline (event → BigQuery)  | Data Engineer     |
| 3–4  | Tạo `reporting-service` + APIs đầu tiên     | Backend           |
| 4–5  | Phát triển module UI báo cáo đầu tiên       | Frontend          |
| 5–6  | Tích hợp permission, audit, RBAC             | Backend + Security|
| 6–7  | Tích hợp Webapp với report templates         | FE + BE           |
| 7–8  | QA, export, performance + deploy + docs      | DevOps + Arch     |

---

## III. ✅ Kết quả kỳ vọng
- Có `reporting-service` production-ready (v1)
- Có module báo cáo trong Superadmin Webapp
- Có ≥ 5 template báo cáo mẫu (login, user, tenant, usage, permission)
- Có schema chuẩn cho 100% các sự kiện báo cáo
- Có ADR đầy đủ và cập nhật sơ đồ hệ thống

---

## 🧠 Mở rộng giai đoạn 2 (AI-ready)
- Cấu hình query DSL an toàn → cho phép AI agent tạo report
- Fine-tune LLM để gợi ý báo cáo phù hợp theo hành vi BoD
- Đào tạo recommender system chọn dashboard phù hợp cho tenant
