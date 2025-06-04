# 📚 Service Catalog – Thiết kế Kiến trúc theo Service

Tài liệu này liệt kê các Service chính trong hệ thống `dx-vas`, được tổ chức theo định hướng microservices. Mỗi service có một thư mục riêng chứa các tài liệu thiết kế chi tiết.

## 🧱 Cấu trúc Tài liệu cho Mỗi Service

Mỗi thư mục của một service sẽ tuân theo cấu trúc chuẩn như sau:

```plaintext
docs/services/<service-name>/
├── design.md             # ✅ Tài liệu Thiết kế Tổng quan (Service Design Document - SDD)
├── interface-contract.md # 📘 Giao diện API mô tả bằng Markdown (business-level)
├── data-model.md         # 🗄️ Mô hình dữ liệu chi tiết – mô tả schema, quan hệ, chỉ mục
└── openapi.yaml          # 📡 Đặc tả kỹ thuật OpenAPI (machine-readable)
```

### 📄 Ý nghĩa của từng file:

* **`design.md`**
  Bao gồm: Scope, Trách nhiệm, Flow nghiệp vụ chính, Tương tác giữa service, Các sự kiện phát ra/nghe, Bảo mật, Cấu hình runtime, và Chiến lược test. Đây là tài liệu trung tâm của mỗi service.

* **`interface-contract.md`**
  Giao diện API mô tả ở mức nghiệp vụ (dễ đọc cho dev/backend/frontend). Dạng Markdown dễ review, không phụ thuộc YAML.

* **`data-model.md`**
  Mô tả các bảng, cột, quan hệ, constraint, index. Được viết rõ ràng để phục vụ review DB, code backend, và migration strategy.

* **`openapi.yaml`**
  Chuẩn hóa API specification cho CI/CD, test tự động, và dev tool (VSCode plugin, Swagger UI…).

---

✅ Việc tuân thủ cấu trúc trên giúp toàn bộ tài liệu kiến trúc của dx\_vas thống nhất, dễ tìm, dễ review, dễ onboard người mới.

---

## Dưới đây là danh sách các **service trong hệ thống dx-vas**, được sắp xếp theo **thứ tự ưu tiên từ cao đến thấp**, phản ánh đúng lộ trình triển khai hiện tại và tính phụ thuộc giữa các thành phần:

---

### 🔝 **Danh sách Service theo Ưu tiên**

| Ưu tiên | Tên Service                     | Vai trò chính                                           |
| ------- | ------------------------------- | ------------------------------------------------------- |
| 1️⃣     | [**User Service Master**](./user-service/master/design.md)         | Quản lý người dùng toàn cục, tenant, RBAC templates     |
| 2️⃣     | [**User Service Sub**](./user-service/sub/design.md)            | Quản lý user trong từng tenant                          |
| 3️⃣     | [**Auth Service Master**](./auth-service/master/design.md)         | Đăng nhập & phân quyền động (RBAC) cho Superadmin       |
| 4️⃣     | [**API Gateway**](./api-gateway/design.md)                 | Cổng vào duy nhất cho toàn hệ thống; enforce RBAC       |
| 5️⃣     | [**Reporting Service**](./reporting-service/design.md)           | Truy vấn báo cáo từ Data Warehouse, quản lý template    |
| 6️⃣     | [**Superadmin Webapp**](./superadmin-webapp/design.md)     | Giao diện quản trị cấp hệ thống, bao gồm module báo cáo |
| 7️⃣     | [**Notification Service Master**](./notification-service/master/design.md) | Gửi thông báo toàn cục, quản lý rule gửi                |
| 8️⃣     | [**Auth Service Sub**](./auth-service/sub/design.md)            | Xác thực và phân quyền cho user per tenant              |
| 9️⃣     | [**Notification Service Sub**](./notification-service/sub/design.md)    | Gửi thông báo cá nhân hóa theo tenant                   |
| 🔟      | [**Admin Webapp**](./admin-webapp/design.md)                | Giao diện quản trị cho từng tenant                      |
| 1️⃣1️⃣  | [**Customer Portal**](./customer-portal/design.md)             | Giao diện người dùng cuối (phụ huynh/học sinh)          |
| 1️⃣2️⃣  | [**CRM Adapter**](./crm/design.md)                 | Kết nối hệ thống CRM (ví dụ: Hubspot, Zoho...)          |
| 1️⃣3️⃣  | [**SIS Adapter**](./sis/design.md)                 | Đồng bộ dữ liệu học sinh từ hệ thống SIS                |
| 1️⃣4️⃣  | [**LMS Adapter**](./lms/design.md)                 | Tích hợp dữ liệu học tập từ LMS                         |

Ví dụ:

### 🧠 User Service Master

- [Tổng quan thiết kế (design.md)](./user-service/master/design.md)
- [Giao diện API (interface-contract.md)](./user-service/master/interface-contract.md)
- [Mô hình dữ liệu (data-model.md)](./user-service/master/data-model.md)
- [OpenAPI Spec (openapi.yaml)](./user-service/master/openapi.yaml)

---
