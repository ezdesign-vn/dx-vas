---
id: adr-007-rbac
status: accepted
title: ADR-007 - Chiến lược phân quyền RBAC động cho toàn hệ thống dx-vas
author: DX VAS Platform Team
date: 2025-05-22
tags: [rbac, security, auth, dx-vas]
---

# ADR-007: Chiến lược RBAC phân tầng

## Bối cảnh

Hệ thống dx-vas phục vụ nhiều trường thành viên (multi-tenant), mỗi trường có người dùng, vai trò và quyền riêng biệt. Một người dùng có thể hoạt động ở nhiều tenant khác nhau với vai trò khác nhau.

Hệ thống cần một chiến lược RBAC động, linh hoạt, mở rộng được và:
- Phân quyền đúng trong từng tenant
- Cho phép kế thừa hoặc tuỳ biến quyền theo từng trường
- Hỗ trợ caching để tăng hiệu năng
- Dễ audit, rollback, và quản trị

## Quyết định

### 1. Phân tầng RBAC: Master vs Sub

| Thành phần | Vai trò |
|------------|---------|
| **User Service Master** | Quản lý định danh toàn cục (`users_global`), danh sách tenant, và template role/permission dùng chung |
| **Sub User Service (per tenant)** | Quản lý người dùng trong tenant, role/permission nội bộ, mapping user ↔ role ↔ permission |

Mỗi tenant có stack riêng. RBAC được đánh giá tại API Gateway trong ngữ cảnh `tenant_id`.

### 2. JWT và Phân quyền

- JWT luôn chứa:
  - `user_id` (global)
  - `tenant_id`
  - `roles`: danh sách mã vai trò (`role_code`)
- JWT **không chứa `permissions`**
  - Việc đánh giá quyền chi tiết (bao gồm cả `condition`) sẽ được thực hiện tại API Gateway
  - Gateway tra cứu từ Redis cache theo key:
  
    ```text
    rbac:{user_id}:{tenant_id}
    ```

- Nếu cache miss → Gateway gọi Sub User Service thông qua API Gateway để lấy `permissions` theo role

---

### 3. Cấu trúc dữ liệu RBAC

**Tại Master:**

```sql
CREATE TABLE global_permissions_templates (
  template_id UUID PRIMARY KEY,
  permission_code TEXT UNIQUE NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  default_condition JSONB,
  description TEXT
);
```

* `permission_code` giúp mapping và clone xuống Sub User Service dễ dàng
* Cấu trúc tương tự `permissions_in_tenant`, giúp tenant kế thừa hoặc override khi cần

**Tại Sub User Service (per tenant):**

```sql
CREATE TABLE permissions_in_tenant (
  permission_id UUID PRIMARY KEY,
  permission_code TEXT UNIQUE NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  condition JSONB
);
```

* Trường `action`, `resource` đều có `NOT NULL` để đảm bảo permission luôn đủ thông tin để đánh giá

### 4. Điều kiện phân quyền (`condition` JSONB)

Permissions có thể chứa điều kiện động:

```json
{
  "class_id": "$user.class_id"
}
```

Gateway sẽ đánh giá điều kiện này dựa trên context user và request. Điều kiện được lưu và tra cứu từ Redis hoặc gọi API nếu cần.

### 5. Cache tại Gateway

* Key: `rbac:{user_id}:{tenant_id}`
* TTL mặc định: 5–15 phút
* Invalidation:

  * Khi user bị gán quyền mới
  * Khi user bị vô hiệu hóa
  * Qua sự kiện Pub/Sub: `rbac_updated`, `user_status_changed`

### 6. Đồng bộ template

* Các tenant có thể:

  * Kế thừa template vai trò từ Master (tự động đồng bộ)
  * Clone để tuỳ chỉnh (độc lập về sau)
* Sự kiện `rbac_template_updated` được phát từ Master → Sub nhận và xử lý

### 7. Báo cáo và quyền truy cập báo cáo

* Mỗi Report Template sẽ có một trường `required_permission`, ví dụ `"report.view_login_by_tenant"`.
* Người dùng chỉ có thể truy cập template hoặc sinh báo cáo khi **có đủ quyền tương ứng trong RBAC**, được đánh giá tại API Gateway.
* `required_permission` được tra cứu từ Redis cache tương tự như các API business khác.
* Nếu template có `scope: global`, thì permission phải là của tenant "superadmin"; nếu là `scope: tenant`, thì permission được kiểm tra trong context `tenant_id` hiện tại.

### 8. Liên kết với hệ thống quản lý báo cáo

* Bảng `permissions_in_tenant` có thể lưu các quyền đặc thù cho từng loại báo cáo, bao gồm:

  * `"report.view_*"` – quyền xem từng nhóm báo cáo
  * `"report.manage_templates"` – quyền quản lý định nghĩa báo cáo
  * `"report.export"` – quyền export kết quả
* Các quyền này cũng có thể được đồng bộ từ `global_permissions_templates` nếu báo cáo là toàn cục.

## Hệ quả

✅ Ưu điểm:

* Phân tách rõ ràng giữa định danh toàn cục và phân quyền nội bộ
* Dễ mở rộng khi có tenant mới hoặc role mới
* Tối ưu hiệu năng qua Redis cache và Pub/Sub
* Quản trị tập trung, nhưng cho phép mỗi tenant tùy biến độc lập
* Hỗ trợ condition động, RBAC đa ngữ cảnh

⚠️ Lưu ý:

* Cần xây dựng giao diện quản lý role/permission rõ ràng cho từng tenant
* Cần cơ chế trace + audit phân quyền theo `tenant_id`

## Liên kết liên quan

- [ADR-006 - Auth Strategy](./adr-006-auth-strategy.md)
- [ADR-012 - Response Structure](./adr-012-response-structure.md)
- [ADR-028 - Reporting Architecture](./adr-028-reporting-architecture.md)
- [ADR-029 - Report Template Schema](./adr-029-report-template-schema.md)
- [ADR-030 - Event Schema Governance](./adr-030-event-schema-governance.md)
- [RBAC Deep Dive](../architecture/rbac-deep-dive.md#10-giám-sát--gỡ-lỗi)
- [README - 2. Đăng nhập & Phân quyền động RBAC](../README.md#2-đăng-nhập--phân-quyền-động-rbac)
