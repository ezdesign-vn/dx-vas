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

**On Process**

| Ưu tiên | Service                    | Mô tả                                                                 | Trạng thái     |
|--------:|:---------------------------|------------------------------------------------------------------------|----------------|
| 1️⃣     | [`auth-service/master/`](./auth-service/master/design.md)     | Quản lý xác thực toàn hệ thống, cấp & verify JWT, quản lý session      | ✅ Hoàn thành |
| 2️⃣     | [`user-service/master/`](./user-service/master/design.md)     | Quản lý người dùng toàn cục, RBAC động, ánh xạ user ↔ tenant           | ✅ Hoàn thành |
| 3️⃣     | [`api-gateway/`](./api-gateway/design.md)             | Entry point duy nhất, định tuyến theo tenant, enforce bảo mật & quota | ✅ Hoàn thành |
| 4️⃣     | [`notification-service/master/`](./notification-service/master/design.md) | Gửi email/SMS/notification đa kênh, cấu hình template, support tenant | ✅ Hoàn thành |
| 5️⃣     | [`audit-logging-service/`](./audit-logging-service/design.md)   | Ghi nhận hành vi người dùng, hỗ trợ kiểm toán, bảo mật                  | ✅ Hoàn thành |
| 6️⃣     | [`reporting-service/`](./reporting-service/design.md)       | Sinh báo cáo từ BigQuery, quản lý template, trả dữ liệu phân tích      | ✅ Hoàn thành |
| 7️⃣     | [`auth-service/sub/`](./auth-service/sub/design.md)        | Phiên bản riêng theo tenant, xác thực nội bộ, login UI tùy chỉnh       | ⬜ Chưa bắt đầu |
| 8️⃣     | [`user-service/sub/`](./user-service/sub/design.md)        | Quản lý người dùng từng tenant, ánh xạ với dữ liệu đặc thù              | ✅ Hoàn thành |
| 9️⃣     | [`notification-service/sub/`](./notification-service/sub/design.md)| Bản tenant-specific để override cấu hình thông báo nội bộ              | ⬜ Chưa bắt đầu |

Ví dụ:

### 🧠 User Service Master

- [Tổng quan thiết kế (design.md)](./user-service/master/design.md)
- [Giao diện API (interface-contract.md)](./user-service/master/interface-contract.md)
- [Mô hình dữ liệu (data-model.md)](./user-service/master/data-model.md)
- [OpenAPI Spec (openapi.yaml)](./user-service/master/openapi.yaml)
