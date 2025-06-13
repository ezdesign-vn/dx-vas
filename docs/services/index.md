# 📚 Service Catalog – Thiết kế Kiến trúc theo Service

Tài liệu này liệt kê các Service chính trong hệ thống `dx-vas`, được tổ chức theo định hướng microservices. Mỗi service có một thư mục riêng chứa các tài liệu thiết kế chi tiết.

## 1. 🧱 Cấu trúc Tài liệu cho Mỗi Service

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

## 2. Dưới đây là danh sách các **service trong hệ thống dx-vas**, được sắp xếp theo **thứ tự ưu tiên từ cao đến thấp**, phản ánh đúng lộ trình triển khai hiện tại và tính phụ thuộc giữa các thành phần:

---

### 🔝 **Danh sách Service theo Ưu tiên**

**On Process**

| Ưu tiên | Service | Mô tả | Trạng thái |
|---:|:---|:---|:---|
| 1️⃣ | [`token-service/`](./token-service/design.md) | Là trái tim bảo mật, phát hành và quản lý vòng đời JWT cho toàn hệ thống. | ✅ Hoàn thành |
| 2️⃣ | [`api-gateway/`](./api-gateway/design.md) | Cổng vào duy nhất, định tuyến, thực thi bảo mật (JWT, RBAC), và rate-limit. | ✅ Hoàn thành |
| 3️⃣ | [`auth-service/master/`](./auth-service/master/design.md) | Xử lý xác thực tập trung qua Google OAuth2, điều phối việc cấp token. | ✅ Hoàn thành |
| 4️⃣ | [`user-service/master/`](./user-service/master/design.md) | Quản lý định danh người dùng và template RBAC toàn cục, phát sự kiện đồng bộ. | ✅ Hoàn thành |
| 5️⃣ | [`auth-service/sub/`](./auth-service/sub/design.md) | Xử lý xác thực cục bộ tại tenant (Local/OTP), tích hợp với Auth Master. | ✅ Hoàn thành |
| 6️⃣ | [`user-service/sub/`](./user-service/sub/design.md) | Quản lý người dùng và RBAC trong phạm vi tenant, nhận dữ liệu đồng bộ từ Master. | ✅ Hoàn thành |
| 7️⃣ | [`sms-service/`](./sms-service/design.md) | Cung cấp nghiệp vụ lõi cho tenant (CRM, SIS, LMS), thay thế các adapter cũ. | ⬜ Chưa bắt đầu |
| 8️⃣ | [`notification-service/master/`](./notification-service/master/design.md) | Điều phối việc gửi thông báo, quản lý template chung và phát sự kiện fan-out. | ⏳ Đang chỉnh sửa |
| 9️⃣ | [`notification-service/sub/`](./notification-service/sub/design.md) | Nhận sự kiện và thực thi gửi thông báo (email/SMS) với cấu hình riêng của tenant. | ⬜ Chưa bắt đầu |
| 🔟 | [`reporting-service/`](./reporting-service/design.md) | Truy vấn Data Warehouse, sinh báo cáo phân tích theo template và quyền hạn. | ⏳ Đang chỉnh sửa |
| 1️⃣1️⃣| [`audit-logging-service/`](./audit-logging-service/design.md) | Thu thập, lưu trữ, và cung cấp giao diện truy vấn các log kiểm toán quan trọng. | ⏳ Đang chỉnh sửa |

Ví dụ:

### 🧠 User Service Master

- [Tổng quan thiết kế (design.md)](./user-service/master/design.md)
- [Giao diện API (interface-contract.md)](./user-service/master/interface-contract.md)
- [Mô hình dữ liệu (data-model.md)](./user-service/master/data-model.md)
- [OpenAPI Spec (openapi.yaml)](./user-service/master/openapi.yaml)

## 3. 📡 Chính sách đặt `servers.url` trong OpenAPI cho các Service

Dưới đây là quy ước đặt `servers.url` cho từng loại service trong hệ thống `dx-vas`, nhằm đảm bảo thống nhất versioning và routing.

---

### 🔒 `auth-service/master` – **Có `/v1`**

```yaml
servers:
  - url: https://auth.truongvietanh.edu.vn/auth-master/v1
    description: Production server
```

✅ **Lý do:**

* Là **public-facing API**, gọi trực tiếp từ frontend.
* Các API như `login-via-otp`, `login-via-local`, `oauth2/callback` có thể thay đổi request/response theo version.
* Cần version tường minh để hỗ trợ backward compatibility & route control tại API Gateway.

---

### 🎯 `token-service` – **Không có `/v1`**

```yaml
servers:
  - url: https://api.truongvietanh.edu.vn/token
    description: Production
  - url: https://staging.truongvietanh.edu.vn/token
    description: Staging
```

❌ **Không cần `/v1` trong URL path**

✅ **Lý do:**

* Là **internal service**, chỉ được gọi từ `auth-service`.
* API mang tính RPC (`/issue`, `/revoke`, `/introspect`) và hiếm khi cần public backward compatibility.
* Version được quản lý qua deployment tag (CI/CD), không cần expose qua path.

---

### 🛡️ `api-gateway` – **Không có `/v1` (proxy toàn bộ)**

```yaml
servers:
  - url: https://api.truongvietanh.edu.vn/
    description: API Gateway
```

✅ **Lý do:**

* Gateway không cung cấp business API riêng, mà proxy toàn bộ sang các service khác.
* Từng service gắn version trong path của chính nó nếu cần (`/auth-master/v1`, `/reporting/v2`,…).

---

### 📌 Ghi chú quan trọng:

* ❗ Nếu một service **phục vụ frontend** hoặc **có khả năng thay đổi API** → bắt buộc dùng version trong URL (`/v1`, `/v2`,…).
* ✅ Nếu là internal RPC → giữ path đơn giản, version hóa qua CI/CD hoặc headers.
