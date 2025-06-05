---
# TODO: Thay thế các giá trị placeholder bên dưới.
title: "Thiết kế chi tiết [TÊN_SERVICE_CỦA_BẠN]" # Ví dụ: Thiết kế chi tiết Order Service
version: "1.0" # TODO: Bắt đầu với 1.0 cho bản nháp đầu tiên của service này.
last_updated: "YYYY-MM-DD" # TODO: Ngày cập nhật cuối cùng của tài liệu này.
author: "[TÊN_ĐỘI_NGŨ_HOẶC_CÁ_NHÂN_CHỊU_TRÁCH_NHIỆM]" # Ví dụ: DX VAS Team, E-commerce Team
reviewed_by: "[TÊN_NGƯỜI_REVIEW]" # Ví dụ: Stephen Le, CTO Team
---
# 📘 Thiết kế chi tiết [TÊN_SERVICE_CỦA_BẠN]

> **[HƯỚNG DẪN SỬ DỤNG TEMPLATE DESIGN.MD NÀY (v1.2):]**
> 1. Sao chép toàn bộ nội dung file này để tạo một file `design.md` mới trong thư mục service của bạn (ví dụ: `services/[your-service-name]/design.md`).
> 2. Điền đầy đủ thông tin vào phần metadata YAML ở trên.
> 3. Với mỗi mục chính của tài liệu (Phạm vi, Thiết kế API, Mô hình Dữ liệu, Luồng Nghiệp vụ, v.v.), hãy đọc kỹ các hướng dẫn và cung cấp thông tin cụ thể, rõ ràng, và súc tích cho service của bạn.
> 4. Sử dụng Markdown formatting hiệu quả (headings, tables, code blocks, Mermaid diagrams) để tài liệu dễ đọc và trực quan.
> 5. Luôn tham chiếu đến các ADRs, tài liệu kiến trúc tổng thể (`README.md`, `system-diagrams.md`), và các tài liệu chi tiết khác của service (`interface-contract.md`, `data-model.md`, `openapi.yaml`) nếu cần.
> 6. Xóa các comment hướng dẫn không cần thiết sau khi đã hoàn thiện file.
> 7. Mục tiêu là tạo ra một tài liệu thiết kế "sống", phản ánh đúng và đủ chi tiết về service để đội ngũ phát triển, QA, và các bên liên quan có thể hiểu và triển khai.

## 1. 🧭 Phạm vi và Trách nhiệm (Scope & Responsibilities)

> **[HƯỚNG DẪN - MỤC 1: PHẠM VI VÀ TRÁCH NHIỆM]**
> Đây là phần cực kỳ quan trọng để định vị vai trò của service trong toàn bộ hệ thống.
> - **Mục tiêu (Purpose):** Nêu rõ lý do service này tồn tại, vấn đề hoặc nhu cầu nghiệp vụ mà nó giải quyết.
> - **Các thực thể dữ liệu quản lý (Core Data Entities Managed):** Liệt kê các đối tượng dữ liệu chính mà service này chịu trách nhiệm tạo, đọc, cập nhật, hoặc xóa (CRUD). Nếu service không quản lý dữ liệu (ví dụ: API Gateway), hãy mô tả các "thực thể cấu hình" hoặc "luật lệ" mà nó quản lý.
> - **Ngoài Phạm Vi (Out of Scope):** Liệt kê rõ ràng những gì service này KHÔNG làm. Điều này giúp tránh chồng chéo trách nhiệm và hiểu lầm.
> - **Đối tượng người dùng/client của service:** Xác định ai (người dùng cuối, service khác, hệ thống bên ngoài) sẽ tương tác với service này.

### 🎯 Mục tiêu
- [TODO: Mục tiêu 1 của service bạn]
- [TODO: Mục tiêu 2 của service bạn]
- [TODO: Mục tiêu 3 của service bạn (nếu có)]

### 📦 Các thực thể dữ liệu quản lý
| Thực thể               | Mô tả                                                                 |
|------------------------|----------------------------------------------------------------------|
| `[ENTITY_NAME_1]`    | [TODO: Mô tả ngắn gọn vai trò của thực thể 1, ví dụ: Định nghĩa các mẫu thông báo (template) theo loại kênh và loại sự kiện.] |
| `[ENTITY_NAME_2]`    | [TODO: Mô tả ngắn gọn vai trò của thực thể 2, ví dụ: Ghi nhận lịch sử gửi thông báo thành công/thất bại.] |
| `[CONFIG_ENTITY_1]`  | [TODO: Mô tả ngắn gọn vai trò của thực thể cấu hình 1, ví dụ: Cấu hình gửi theo kênh: SMTP, SMS provider, push gateway.] |

### 🔒 Ngoài Phạm Vi (Out of Scope)
Service này **không** thực hiện các tác vụ sau:
- ❌ [TODO: Chức năng/Trách nhiệm 1 không thuộc phạm vi, ví dụ: Không quản lý người dùng nhận thông báo (do User Service đảm nhiệm).]
- ❌ [TODO: Chức năng/Trách nhiệm 2 không thuộc phạm vi, ví dụ: Không thực hiện xử lý nội dung cá nhân hóa ngoài các placeholder đã được backend đổ vào.]
- ❌ [TODO: Chức năng/Trách nhiệm 3 không thuộc phạm vi]
- ❌ [TODO: Chức năng/Trách nhiệm 4 không thuộc phạm vi]
- ❌ [TODO: Chức năng/Trách nhiệm 5 không thuộc phạm vi]

### 👥 Đối tượng sử dụng / Client chính
- [TODO: Client 1, ví dụ: Các service khác trong hệ thống (qua Pub/Sub)]
- [TODO: Client 2, ví dụ: Superadmin Webapp (qua API Gateway)]
- [TODO: Client 3, ví dụ: AI Agent (trong tương lai)]

---

## 2. 🌐 Thiết kế API chi tiết (Interface Contract)

> **[HƯỚNG DẪN - MỤC 2: THIẾT KẾ API]**
> - Cung cấp một bảng tóm tắt các API chính mà service này expose.
> - Mỗi API cần có Method, Path, Mô tả ngắn, và Yêu cầu permission (RBAC).
> - Khẳng định việc tuân thủ các ADRs liên quan đến API (ADR-011, ADR-012, ADR-013, ADR-030 nếu có sự kiện).
> - Cung cấp một ví dụ response JSON điển hình cho một API quan trọng (hoặc tham chiếu đến file `interface-contract.md` và `openapi.yaml` để xem chi tiết hơn).
> - Mục này mang tính tổng quan, chi tiết đầy đủ sẽ nằm trong `interface-contract.md` và `openapi.yaml`.

| Method | Path                       | Tác vụ                                | Yêu cầu permission (RBAC)      |
|--------|----------------------------|---------------------------------------|----------------------------------|
| GET    | `/[resource_collection]`     | [TODO: Lấy danh sách [resource]]      | ✅ `[scope].read.[resource]`     |
| POST   | `/[resource_collection]`     | [TODO: Tạo mới [resource]]            | ✅ `[scope].create.[resource]`   |
| GET    | `/[resource_collection]/{id}`| [TODO: Lấy chi tiết [resource] theo ID]| ✅ `[scope].read.[resource]`     |
| PATCH  | `/[resource_collection]/{id}`| [TODO: Cập nhật [resource] theo ID]   | ✅ `[scope].update.[resource]`   |
| DELETE | `/[resource_collection]/{id}`| [TODO: Xóa [resource] theo ID]        | ✅ `[scope].delete.[resource]`   |
> 🔧 **Tuân thủ chuẩn API của DX-VAS:**
> - [ADR-011 - API Error Format](../../../ADR/adr-011-api-error-format.md)
> - [ADR-012 - Response Structure](../../../ADR/adr-012-response-structure.md)
> - [ADR-013 - Path Naming Convention](../../../ADR/adr-013-path-naming-convention.md)
> - (Nếu có phát sự kiện qua API) [ADR-030 - Event Schema Governance](../../../ADR/adr-030-event-schema-governance.md)

### 📦 Ví dụ response cho `[METHOD] /[path_ví_dụ]`
```json
{
  "data": {
    "status": "queued",
    "notification_id": "notif-123"
  },
  "meta": {
    "request_id": "req-xyz-789",
    "timestamp": "2025-06-05T13:20:00Z"
  },
  "error": null
}
````

> 👉 Xem đặc tả API đầy đủ và chi tiết tại:
>
>   - [`interface-contract.md`](https://www.google.com/search?q=./interface-contract.md)
>   - [`openapi.yaml`](https://www.google.com/search?q=./openapi.yaml)

-----

## 3\. 🗃️ Mô hình dữ liệu chi tiết (Data Model)

> **[HƯỚNG DẪN - MỤC 3: MÔ HÌNH DỮ LIỆU]**
>
>   - Nếu service có CSDL riêng, cung cấp sơ đồ ERD (Mermaid) ở đây.
>   - Mô tả ngắn gọn các bảng chính và vai trò của chúng.
>   - Nếu service không có CSDL (ví dụ: API Gateway) hoặc mô hình dữ liệu rất phức tạp, hãy mô tả ngắn gọn ở đây và tham chiếu đến file `data-model.md` riêng để có chi tiết đầy đủ (bao gồm `CREATE TABLE` SQL, giải thích cột, index, v.v.).
>   - Luôn tham chiếu đến file `data-model.md` để xem chi tiết.

### 🗺️ Sơ đồ ERD (Entity Relationship Diagram)

```mermaid
erDiagram
  NotificationTemplate ||--o{ NotificationLog : uses
  NotificationChannelCfg ||--o{ NotificationTemplate : configures

  NotificationTemplate {
    UUID id PK
    STRING name
    STRING type  // email, sms, push
    TEXT content
    STRING language
    STRING trigger_event // Sự kiện nghiệp vụ kích hoạt template này
    BOOLEAN is_active
    JSONB default_params // Các tham số mặc định cho template
    TIMESTAMPTZ created_at
    TIMESTAMPTZ updated_at
  }

  NotificationLog {
    UUID id PK
    UUID template_id FK // Template đã sử dụng
    STRING recipient // Thông tin người nhận (email, phone, user_id)
    STRING channel_type // Kênh gửi (email, sms, push)
    STRING status // Trạng thái gửi (queued, sent, failed, delivered, read)
    TEXT error_message // Nếu gửi lỗi
    JSONB request_payload // Dữ liệu đã dùng để render template
    JSONB provider_response // Phản hồi từ nhà cung cấp kênh
    TIMESTAMPTZ created_at // Thời điểm log được tạo (thường là lúc đưa vào hàng đợi)
    TIMESTAMPTZ sent_at // Thời điểm thực sự gửi đi
  }

  NotificationChannelCfg {
    STRING channel_type PK // email, sms, push
    STRING provider // Tên nhà cung cấp (ví dụ: smtp.gmail.com, twilio, firebase_fcm)
    JSONB config // Cấu hình chi tiết (API key, secret, sender_id) - được mã hóa hoặc tham chiếu từ Secret Manager
    BOOLEAN is_enabled
    TIMESTAMPTZ updated_at
  }
```

*(Sơ đồ trên là ví dụ, cần điều chỉnh cho service của bạn)*

> 👉 Xem chi tiết định nghĩa bảng, các trường, kiểu dữ liệu, index, và ràng buộc tại: [`data-model.md`](https://www.google.com/search?q=./data-model.md)

-----

## 4\. 🔄 Luồng xử lý nghiệp vụ chính (Business Logic Flows)

> **[HƯỚNG DẪN - MỤC 4: LUỒNG NGHIỆP VỤ]**
>
>   - Chọn 1-2 luồng nghiệp vụ quan trọng nhất hoặc phức tạp nhất của service để minh họa.
>   - Sử dụng sequence diagram (Mermaid) để trực quan hóa các bước tương tác giữa các thành phần nội bộ của service và với các service/actor bên ngoài.
>   - Mô tả ngắn gọn các bước trong luồng.
>   - Điều này giúp người đọc hiểu rõ hơn về cách service hoạt động trong các kịch bản thực tế.

### Luồng: [TÊN\_LUỒNG\_NGHIỆP\_VỤ\_QUAN\_TRỌNG\_1]

```mermaid
sequenceDiagram
  participant Actor as [Actor/Service Khởi tạo]
  participant Gateway as [API Gateway (nếu qua API)]
  participant YourService as [TÊN_SERVICE_CỦA_BẠN]
  participant DB as [CSDL của Service (nếu có)]
  participant PubSub as [Pub/Sub (nếu có)]
  participant OtherService as [Service Khác (nếu có)]

  Actor->>Gateway: [TODO: Request đến API của service bạn (nếu có)]
  Gateway->>YourService: [TODO: Forward request]
  YourService->>DB: [TODO: Đọc/Ghi dữ liệu]
  DB-->>YourService: [TODO: Kết quả từ DB]
  alt [TODO: Điều kiện (ví dụ: Xử lý thành công)]
    YourService->>PubSub: [TODO: Phát sự kiện (nếu có)]
    YourService-->>Gateway: [TODO: Response thành công]
  else [TODO: Điều kiện khác (ví dụ: Xử lý lỗi)]
    YourService-->>Gateway: [TODO: Response lỗi]
  end
  Gateway-->>Actor: [TODO: Trả response cuối cùng]

  OtherService->>PubSub: [TODO: Một service khác phát sự kiện]
  PubSub-->>YourService: [TODO: Service bạn consume sự kiện]
  YourService->>DB: [TODO: Xử lý logic và cập nhật DB]
```

*(Sơ đồ trên là ví dụ, cần điều chỉnh cho luồng nghiệp vụ cụ thể của service bạn)*

> **Mô tả các bước chính trong luồng:**
>
> 1.  [TODO: Bước 1]
> 2.  [TODO: Bước 2]
> 3.  ...

-----

## 5\. 📣 Tương tác với các Service khác & Luồng sự kiện (Interactions & Events)

> **[HƯỚNG DẪN - MỤC 5: TƯƠNG TÁC VÀ SỰ KIỆN]**
>
>   - **Tương tác đồng bộ (Synchronous Interactions):** Service của bạn gọi API của service nào khác? Mục đích là gì?
>   - **Lắng nghe sự kiện (Event Consumption):** Service của bạn lắng nghe những sự kiện nào từ Pub/Sub (hoặc message queue khác)? Hành động tương ứng là gì?
>   - **Phát sự kiện (Event Emission):** Service của bạn phát ra những sự kiện nào? Payload mẫu của sự kiện đó ra sao?
>   - Việc mô tả rõ ràng các tương tác này rất quan trọng trong kiến trúc microservices.

### 5.1. Tương tác đồng bộ (API Calls to Other Services)

  - **[TÊN\_SERVICE\_ĐÍCH\_1]:**
      - API: `[METHOD] /[path_api_đích]`
      - Mục đích: [TODO: Giải thích tại sao cần gọi API này]
  - **[TÊN\_SERVICE\_ĐÍCH\_2]:**
      - API: `[METHOD] /[path_api_đích]`
      - Mục đích: [TODO: Giải thích]

### 5.2. Lắng nghe sự kiện (Event Consumption)

| Sự kiện nhận (Consumed Event) | Nguồn phát (Source Service) | Hành động tại Service này                                 |
|-------------------------------|-----------------------------|-----------------------------------------------------------|
| `[event_name_1.v1]`         | `[source_service_1]`        | [TODO: Mô tả hành động khi nhận sự kiện này.]             |
| `[event_name_2.v1]`         | `[source_service_2]`        | [TODO: Mô tả hành động.]                                  |

### 5.3. Phát sự kiện (Event Emission)

| Sự kiện phát ra (Emitted Event) | Trigger (Hành động/API kích hoạt)     | Mục đích chính của sự kiện                          |
|---------------------------------|--------------------------------------|---------------------------------------------------|
| `[emitted_event_1.v1]`        | [TODO: API hoặc logic nào kích hoạt] | [TODO: Thông báo cho các service khác về điều gì.] |
| `[emitted_event_2.v1]`        | [TODO: API hoặc logic nào kích hoạt] | [TODO: Thông báo cho các service khác về điều gì.] |

#### 📦 Ví dụ Payload cho sự kiện `[emitted_event_1.v1]`

```json
{
  "event_id": "evt_uuid_random_generated",
  "event_name": "[emitted_event_1.v1]",
  "version": "1.0", // Hoặc version của schema sự kiện
  "emitted_at": "YYYY-MM-DDTHH:mm:ssZ",
  "source_service": "[TÊN_SERVICE_CỦA_BẠN]",
  "tenant_id": "[tenant_id_nếu_có_hoặc_global]", // (Tùy chọn)
  "user_id": "[user_id_thực_hiện_nếu_có]", // (Tùy chọn)
  "data": {
    // TODO: Các trường dữ liệu cụ thể của sự kiện
    "[field_1]": "[value_1]",
    "[field_2]": "[value_2]"
  },
  "metadata": { // (Tùy chọn) Metadata bổ sung cho sự kiện
    "trace_id": "trace_id_của_request_gốc_nếu_có",
    "correlation_id": "correlation_id_nếu_có"
  }
}
```

-----

## 6\. 🔐 Bảo mật & Phân quyền (Security & Authorization)

> **[HƯỚNG DẪN - MỤC 6: BẢO MẬT & PHÂN QUYỀN]**
>
>   - **Xác thực (Authentication):** Mô tả cách service xác thực các request đến (thường là qua JWT đã được API Gateway validate).
>   - **Phân quyền (Authorization):**
>       - Cách service thực thi RBAC. Liệu nó có kiểm tra `x-required-permission` từ Gateway không? Hay có logic phân quyền nội bộ phức tạp hơn?
>       - Liệt kê các `permission_code` chính liên quan đến service này và cách chúng được áp dụng.
>   - **Xử lý dữ liệu nhạy cảm:** Các biện pháp bảo vệ PII hoặc dữ liệu quan trọng khác.
>   - Tham chiếu đến các ADRs liên quan (ADR-004, ADR-006, ADR-007, ADR-024).

### 6.1. Xác thực & Định danh

  - Service này không xử lý xác thực trực tiếp, mà **nhận thông tin định danh từ API Gateway** thông qua các HTTP headers chuẩn đã được xác thực và tin cậy:
    | Header              | Mô tả                                      |
    |---------------------|---------------------------------------------|
    | `Authorization`     | `Bearer <JWT>` (đã được Gateway validate)   |
    | `X-User-ID`         | Mã định danh duy nhất của người dùng       |
    | `X-Tenant-ID`       | Mã định danh tenant                        |
    | `X-Permissions`     | (Tùy chọn) Danh sách permission đã được resolve của user trong tenant |

### 6.2. Kiểm soát Truy cập (RBAC)

  - Mọi API trong service này (trừ các endpoint public nếu có) **bắt buộc được khai báo `x-required-permission` tại API Gateway** (theo [liên kết đáng ngờ đã bị xóa]).
  - Service này **sẽ kiểm tra lại quyền truy cập chi tiết** dựa trên `X-Required-Permission` header (do Gateway thêm vào) và/hoặc logic nghiệp vụ cụ thể (ví dụ: kiểm tra xem user có phải là owner của resource không, hoặc `condition` trong permission).
  - **Các permission code chính liên quan đến service này:**
      - `[scope].[resource].create`
      - `[scope].[resource].read`
      - `[scope].[resource].update`
      - `[scope].[resource].delete`
      - `[scope].[specific_action].[resource]`

### 6.3. Bảo vệ Dữ liệu Nhạy cảm

  - Tuân thủ [liên kết đáng ngờ đã bị xóa] cho việc xử lý PII.
  - Các thông tin cấu hình nhạy cảm (ví dụ: API keys cho kênh gửi thông báo) được lưu trữ và truy xuất an toàn từ Google Secret Manager (theo [liên kết đáng ngờ đã bị xóa]).
  - Log được ghi theo [liên kết đáng ngờ đã bị xóa], đảm bảo không lộ thông tin nhạy cảm.

-----

## 7\. ⚙️ Cấu hình & Phụ thuộc (Configuration & Dependencies)

> **[HƯỚNG DẪN - MỤC 7: CẤU HÌNH & PHỤ THUỘC]**
>
>   - **Biến môi trường/Cấu hình Runtime:** Liệt kê các biến môi trường quan trọng hoặc các file cấu hình mà service cần để hoạt động (DB URL, API keys, Pub/Sub topics, feature flags, v.v.).
>   - **Quản lý cấu hình:** Mô tả cách các cấu hình này được quản lý (ví dụ: `.env` files, Secret Manager, Config Center như Firestore/GCS).
>   - **Phụ thuộc vào service khác:** Service này phụ thuộc vào những service nào khác để hoạt động?
>   - **Thư viện chính:** Các thư viện, framework quan trọng được sử dụng.

### 7.1. Các biến môi trường chính / Cấu hình Runtime

| Biến môi trường / Config Key | Mô tả                                                                 | Ví dụ Giá trị / Nguồn        |
|-----------------------------|------------------------------------------------------------------------|-------------------------------|
| `ENV`                       | Môi trường triển khai (`development`, `staging`, `production`)        | `production`                  |
| `PORT`                      | Cổng service sẽ lắng nghe                                             | `8080`                        |
| `DATABASE_URL`              | Chuỗi kết nối đến CSDL của service (nếu có)                             | (Secret) `postgresql://...`   |
| `[TÊN_PUBSUB_TOPIC_CONSUME]`| Tên topic Pub/Sub để lắng nghe sự kiện [loại\_sự\_kiện]                  | `[tên-topic-abc]`             |
| `[TÊN_PUBSUB_TOPIC_PUBLISH]`| Tên topic Pub/Sub để phát sự kiện [loại\_sự\_kiện]                     | `[tên-topic-xyz]`             |
| `[EXTERNAL_SERVICE]_API_KEY`| API Key để gọi đến [Dịch vụ ngoài X]                                    | (Secret)                      |
| `JWT_PUBLIC_KEY_URL`        | URL đến public key dùng để xác thực JWT (nếu service tự validate)       | (Config Center)               |
| `LOG_LEVEL`                 | Mức độ log (`DEBUG`, `INFO`, `WARNING`, `ERROR`)                     | `INFO`                        |
| `TRACING_ENABLED`           | Bật/tắt tracing (ví dụ: OpenTelemetry)                               | `true`                        |
| `[FEATURE_FLAG_X]`          | Bật/tắt tính năng X                                                   | `true` / `false` (Config Center)|

### 7.2. Quản lý cấu hình và secrets

  - Service sử dụng [thư\_viện\_config, ví dụ: `pydantic-settings`, `dynaconf`] để load cấu hình từ biến môi trường và file `.env` (cho local development).
  - Các secrets nhạy cảm được quản lý qua Google Secret Manager và inject vào runtime theo [liên kết đáng ngờ đã bị xóa].
  - Cấu hình động (ví dụ: feature flags) có thể được quản lý qua một Config Center (ví dụ: Firestore, GCS bucket) và service có thể cache/reload định kỳ.

### 7.3. Phụ thuộc vào service/thư viện bên ngoài

  - **Service phụ thuộc:**
      - `[TÊN_SERVICE_PHỤ_THUỘC_1]`: [Lý do phụ thuộc]
      - `Google Cloud Pub/Sub`: [Cho việc nhận và phát sự kiện]
      - `Google Cloud BigQuery`: [Để truy vấn Data Warehouse (nếu là Reporting Service)]
  - **Thư viện chính:**
      - `[TÊN_FRAMEWORK_BACKEND, ví dụ: FastAPI, Express.js]`
      - `[TÊN_THƯ_VIỆN_ORM/DB_CLIENT, ví dụ: SQLAlchemy, Prisma, pgx]`
      - `[TÊN_THƯ_VIỆN_PUBSUB_CLIENT]`

-----

## 8\. 🧪 Chiến lược kiểm thử (Testing Strategy)

> **[HƯỚNG DẪN - MỤC 8: CHIẾN LƯỢC KIỂM THỬ]**
>
>   - Mô tả các lớp kiểm thử sẽ được áp dụng (Unit, Integration, Contract, E2E nếu có).
>   - Nêu rõ các kịch bản kiểm thử quan trọng cần được bao phủ.
>   - Gợi ý các công cụ, framework hỗ trợ.
>   - Đề cập đến mục tiêu về coverage.
>   - Cách mô phỏng (mocking) các service phụ thuộc hoặc hệ thống bên ngoài.

### 8.1. Các lớp kiểm thử

| Lớp kiểm thử           | Mô tả                                                                 |
|------------------------|----------------------------------------------------------------------|
| Unit Test              | [TODO: Kiểm thử từng hàm xử lý, business logic nhỏ, validator]       |
| Integration Test       | [TODO: Kiểm thử tương tác với CSDL, Pub/Sub, các module nội bộ]       |
| Contract Test          | [TODO: Kiểm thử tuân thủ OpenAPI spec, và contract với các service mà nó gọi (nếu có)] |
| RBAC Rule Test         | [TODO: Kiểm tra việc từ chối truy cập nếu không có quyền phù hợp]      |

### 8.2. Mô phỏng (Mocking) và Dữ liệu Test

  - Sử dụng [công\_cụ\_mocking, ví dụ: `unittest.mock` (Python), `jest.fn()` (JS)] để mock các lời gọi đến service bên ngoài hoặc thư viện.
  - Sử dụng [công\_cụ\_test\_db, ví dụ: `testcontainers`, `factory_boy`, `pgTAP`] để tạo dữ liệu test và kiểm thử tương tác CSDL.
  - Sử dụng [công\_cụ\_mock\_pubsub, ví dụ: Google Cloud Pub/Sub Emulator] để kiểm thử luồng sự kiện.

### 8.3. Kịch bản kiểm thử quan trọng

  - [Kịch bản 1: Mô tả kịch bản và kết quả mong đợi]
  - [Kịch bản 2: Mô tả kịch bản và kết quả mong đợi]
  - [Kịch bản 3: Mô tả kịch bản và kết quả mong đợi]

### 8.4. Báo cáo và Coverage

  - Công cụ: `[pytest-cov, JaCoCo, IstanbulJS]`
  - Mục tiêu coverage: [Ví dụ: \>85% cho business logic, 100% cho các module critical]
  - Báo cáo coverage được tích hợp vào CI pipeline.

### 8.5. Load Test (nếu service có yêu cầu hiệu năng cao)

  - Sử dụng `[Locust, k6, JMeter]` để mô phỏng tải.
  - Kịch bản load test: [Mô tả các kịch bản chính]

-----

## 9\. 📈 Quan sát & Giám sát (Observability & Monitoring)

> **[HƯỚNG DẪN - MỤC 9: QUAN SÁT & GIÁM SÁT]**
>
>   - **Logging:** Chiến lược logging (log những gì, cấu trúc log, mức độ log). Tham chiếu ADR-008.
>   - **Metrics:** Các metrics nghiệp vụ và kỹ thuật quan trọng cần theo dõi.
>   - **Tracing:** Khả năng tracing request xuyên suốt các service.
>   - **Alerting:** Các kịch bản cảnh báo quan trọng.
>   - Tham chiếu đến ADR-005 (Env Config), ADR-008 (Audit Logging), ADR-021 (External Observability), ADR-022 (SLA/SLO Monitoring).

### 9.1. Logging

  - Tất cả các request API và các hành động nghiệp vụ quan trọng đều được log.
  - Log định dạng JSON, tuân thủ [liên kết đáng ngờ đã bị xóa], bao gồm các trường chuẩn như `trace_id`, `user_id`, `tenant_id`, `action_type`, `target_resource`, `status`.
  - Log chứa thông tin nhạy cảm sẽ được masking theo [liên kết đáng ngờ đã bị xóa].
  - Log được gửi về hệ thống tập trung (ví dụ: Google Cloud Logging).

### 9.2. Metrics & Monitoring

  - Hệ thống xuất các metrics theo chuẩn Prometheus (hoặc tương đương) bao gồm:
    | Metric                          | Nhãn (Labels)                        | Mô tả                                              |
    |----------------------------------|--------------------------------------|----------------------------------------------------|
    | `[service_prefix]_request_duration_seconds` | `endpoint`, `method`, `status_code`  | Thời gian xử lý request API                       |
    | `[service_prefix]_requests_total`           | `endpoint`, `method`, `status_code`  | Tổng số request API                               |
    | `[service_prefix]_event_consumed_total`     | `event_type`, `status`             | Tổng số sự kiện đã consume (nếu có)              |
    | `[service_prefix]_event_processing_duration_seconds` | `event_type`                       | Thời gian xử lý một sự kiện (nếu có)             |
    | `[service_prefix]_[business_metric_1]`      | `[label_1]`, `[label_2]`             | [Mô tả metric nghiệp vụ quan trọng 1]            |
  - Tích hợp với Grafana (hoặc Cloud Monitoring Dashboard) để giám sát real-time.

### 9.3. Tracing

  - Hỗ trợ OpenTelemetry (hoặc chuẩn tracing tương đương), đảm bảo `trace_id` được truyền và log xuyên suốt từ API Gateway đến các service backend và các lời gọi phụ thuộc (DB, Pub/Sub).

### 9.4. Alerting

  - Các cảnh báo được cấu hình cho:
      - Tỷ lệ lỗi API vượt ngưỡng (ví dụ: \>X% lỗi 5xx trong Y phút).
      - Latency API vượt SLO.
      - Số lượng message trong Dead Letter Queue (DLQ) của Pub/Sub tăng bất thường.
      - [Các cảnh báo nghiệp vụ quan trọng khác, ví dụ: Số lượng template không gửi được thông báo vượt ngưỡng.]
  - Cảnh báo được gửi qua [Kênh thông báo, ví dụ: Slack, PagerDuty, Email].

-----

## 10\. 🚀 Độ tin cậy & Phục hồi (Reliability & Resilience)

> **[HƯỚNG DẪN - MỤC 10: ĐỘ TIN CẬY & PHỤC HỒI]**
>
>   - **Xử lý lỗi:** Cách service phân loại và xử lý lỗi (tham chiếu ADR-011).
>   - **Khả năng phục hồi khi mất dịch vụ phụ thuộc:** Service sẽ hoạt động như thế nào nếu DB, Pub/Sub, hoặc service khác mà nó gọi bị lỗi/chậm.
>   - **Tính Idempotency:** Đối với các thao tác quan trọng (đặc biệt là khi consume event), làm thế nào để đảm bảo tính idempotency?
>   - **Health Check:** Endpoint và các kiểm tra sức khỏe.

### 10.1. Phân lớp lỗi & thông báo lỗi

  - Mọi lỗi API đều được chuẩn hóa theo định dạng [liên kết đáng ngờ đã bị xóa].
  - Phân loại lỗi rõ ràng (ví dụ: `VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `RESOURCE_NOT_FOUND`, `INTERNAL_SERVER_ERROR`, `EXTERNAL_SERVICE_UNAVAILABLE`).

### 10.2. Khả năng phục hồi khi mất dịch vụ phụ trợ

| Thành phần phụ trợ | Phản ứng của hệ thống (Retry, Circuit Breaker, Fallback, Graceful Degradation) |
|--------------------|---------------------------------------------------------------------------------|
| `[TÊN_CSDL]`       | [TODO: Ví dụ: Retry với exponential backoff, nếu lỗi kéo dài thì trả về 503 và alert.] |
| `[TÊN_PUBSUB]`     | [TODO: Ví dụ: NACK message để retry, nếu lỗi lặp lại thì vào DLQ, alert.]          |
| `[TÊN_SERVICE_KHÁC]`| [TODO: Ví dụ: Sử dụng Circuit Breaker, fallback sang dữ liệu cache (nếu có), hoặc trả lỗi 503.] |

### 10.3. Tính Idempotency (cho Event Consumers hoặc API ghi dữ liệu)

  - Khi consume sự kiện từ Pub/Sub, service sử dụng `event_id` (và có thể cả `source_service`, `event_type`) làm idempotency key, lưu vào bảng `processed_events` (hoặc Redis) để tránh xử lý trùng lặp.
  - Đối với các API `POST` có khả năng client retry, cân nhắc hỗ trợ header `Idempotency-Key` (theo chuẩn Stripe).

### 10.4. Health Check

  - Cung cấp endpoint `GET /healthz` trả về HTTP 200 nếu service khỏe mạnh.
  - Kiểm tra sức khỏe bao gồm:
      - Khả năng kết nối đến CSDL (nếu có).
      - Khả năng kết nối đến các service phụ thuộc critical (nếu có).
      - Trạng thái của các consumer Pub/Sub (nếu có).

-----

## 11\. ⚡️ Hiệu năng & Khả năng mở rộng (Performance & Scalability)

> **[HƯỚNG DẪN - MỤC 11: HIỆU NĂNG & MỞ RỘNG]**
>
>   - **SLO (Service Level Objectives):** Đặt ra các mục tiêu cụ thể về hiệu năng (ví dụ: P95 latency \< 200ms, throughput X requests/sec).
>   - **Chiến lược Caching:** Mô tả các lớp cache được sử dụng (in-memory, Redis, CDN) và chiến lược invalidation.
>   - **Khả năng mở rộng (Scalability):** Service là stateless hay stateful? Cách scale (horizontal/vertical)?
>   - **Xử lý tải cao/bất thường:** Các cơ chế bảo vệ (rate limiting, circuit breaker).

### 11.1. Caching chiến lược

  - **[LOẠI\_CACHE\_1, ví dụ: Metadata Cache (Redis)]:**
      - Dữ liệu được cache: [Ví dụ: Thông tin Report Templates, RBAC rules]
      - TTL: [Ví dụ: 5-15 phút]
      - Chiến lược Invalidation: [Ví dụ: TTL, event-driven khi có thay đổi từ nguồn]
  - **[LOẠI\_CACHE\_2, ví dụ: Query Result Cache (Redis/Memcached) - Tùy chọn]:**
      - Dữ liệu được cache: [Ví dụ: Kết quả của các báo cáo thường xuyên truy vấn với cùng tham số]
      - TTL: [Ví dụ: 1-5 phút, tùy thuộc vào tần suất cập nhật dữ liệu nguồn]

### 11.2. Khả năng mở rộng (Scalability)

  - Service được thiết kế **stateless** (trạng thái phiên được quản lý bởi client qua JWT hoặc lưu trong CSDL/cache ngoài), cho phép scale theo chiều ngang dễ dàng bằng cách tăng số lượng instance trên Cloud Run.
  - CSDL (nếu có) sử dụng Cloud SQL với khả năng read replicas để tăng khả năng đọc.
  - Pub/Sub cho phép xử lý sự kiện bất đồng bộ, giúp giảm tải cho các tác vụ xử lý lâu.

### 11.3. Giới hạn truy vấn & Quotas (nếu có)

  - Áp dụng rate limiting tại API Gateway để bảo vệ service khỏi các truy vấn quá mức.
  - Đối với các truy vấn báo cáo nặng (Reporting Service), có thể có giới hạn về số lượng dòng trả về, thời gian thực thi, hoặc số bytes quét trên Data Warehouse.

### 11.4. Dự phòng sự cố (High Availability)

  - Triển khai service trên nhiều zone trong một region của Google Cloud Run để đảm bảo HA.
  - CSDL (Cloud SQL) được cấu hình với HA (failover replica).
  - Pub/Sub và BigQuery là các dịch vụ managed có HA sẵn.

-----

## 12\. 🛠 Kế hoạch Triển khai & Migration (Deployment & Migration Plan)

> **[HƯỚNG DẪN - MỤC 12: KẾ HOẠCH TRIỂN KHAI & MIGRATION]**
>
>   - **Giai đoạn triển khai:** Chia nhỏ việc triển khai thành các giai đoạn (MVP, Phase 1, Phase 2, ...) nếu cần.
>   - **Migration dữ liệu (nếu có):** Kế hoạch di chuyển dữ liệu từ hệ thống cũ hoặc version cũ.
>   - **Công cụ migration schema:** (ví dụ: Alembic, Flyway) và tuân thủ ADR-023.
>   - **Chiến lược Zero Downtime Deployment:** Tham chiếu ADR-014.

### 12.1. Giai đoạn triển khai (Ví dụ)

  - **Giai đoạn 1 – MVP (Minimum Viable Product):**
      - [TODO: Các chức năng cốt lõi nhất sẽ được triển khai.]
      - [TODO: Mục tiêu của giai đoạn này.]
  - **Giai đoạn 2 – Mở rộng Tính năng:**
      - [TODO: Các chức năng bổ sung.]
  - **Giai đoạn 3 – Tối ưu hóa & Chuẩn bị cho AI (nếu liên quan):**
      - [TODO: Các cải tiến về hiệu năng, bảo mật, hoặc chuẩn bị dữ liệu cho AI.]

### 12.2. Migration Dữ liệu (nếu có)

  - [TODO: Nguồn dữ liệu cũ?]
  - [TODO: Các bước migration chính?]
  - [TODO: Chiến lược rollback?]

### 12.3. Migration Schema

  - Sử dụng `[TÊN_CÔNG_CỤ_MIGRATION, ví dụ: Alembic]` để quản lý các thay đổi schema CSDL.
  - Tuân thủ chặt chẽ [liên kết đáng ngờ đã bị xóa].

### 12.4. Triển khai Không Gián Đoạn (Zero Downtime)

  - Áp dụng chiến lược Blue/Green deployment hoặc Rolling Update trên Cloud Run.
  - Tuân thủ [liên kết đáng ngờ đã bị xóa].

-----

## 13\. 🧩 Kiến trúc Service (Service Architecture - MỚI)

> **[HƯỚNG DẪN - MỤC 13: KIẾN TRÚC SERVICE]**
>
>   - Đây là mục mới được thêm vào dựa trên khuyến nghị cho Reporting Service và Notification Service.
>   - Mô tả các thành phần/module logic chính bên trong service.
>   - Cung cấp một sơ đồ Mermaid (ví dụ: flowchart) để trực quan hóa sự tương tác giữa các module này.
>   - Bảng mô tả chi tiết vai trò của từng module.
>   - Nêu các điểm có thể mở rộng của kiến trúc module này.

```mermaid
flowchart TD
    A[Request Router / API Handler]
    A --> B[AuthContext Resolver / JWT Validator]
    B --> C[RBACValidator / Permission Checker]
    C --> D[BusinessLogicModule1]
    D --> E[DataAccessLayer / DBClient]
    E --> F[ExternalServiceClient (nếu có)]
    D --> G[BusinessLogicModule2]
    G --> H[ResponseFormatter / DTOTransformer]
    H --> A

    subgraph InternalModules [Thành phần Nội bộ Service]
        direction LR
        B
        C
        D
        G
        E
        F
        H
    end

    subgraph ExternalDependencies [Phụ thuộc Ngoài]
        direction LR
        DB([Database])
        Cache([Redis Cache])
        OtherSvc([Service Khác])
        PubSubBus([Pub/Sub])
    end

    E --> DB
    E --> Cache
    F --> OtherSvc
    D -.-> PubSubBus
    G -.-> PubSubBus
```

*(Sơ đồ trên là ví dụ rất tổng quát, cần điều chỉnh chi tiết cho service của bạn, thể hiện các module logic chính và luồng dữ liệu/điều khiển giữa chúng. Hãy tham khảo ví dụ của Reporting Service hoặc Notification Service Master.)*

### Thành phần chi tiết

| Module                        | Vai trò chính                                                                    |
|-------------------------------|-----------------------------------------------------------------------------------|
| `[TÊN_MODULE_1]`              | [TODO: Mô tả vai trò, ví dụ: Xử lý request đến, điều phối đến các handler phù hợp.] |
| `[TÊN_MODULE_2]`              | [TODO: Mô tả vai trò, ví dụ: Trích xuất thông tin user, tenant từ JWT/header.]      |
| `[TÊN_MODULE_3]`              | [TODO: Mô tả vai trò, ví dụ: Kiểm tra quyền truy cập dựa trên permission.]         |
| `[TÊN_MODULE_4]`              | [TODO: Mô tả vai trò, ví dụ: Chứa logic nghiệp vụ chính cho chức năng X.]           |
| `[TÊN_MODULE_5]`              | [TODO: Mô tả vai trò, ví dụ: Tương tác với CSDL để đọc/ghi dữ liệu.]                |
| `[TÊN_MODULE_6]`              | [TODO: Mô tả vai trò, ví dụ: Định dạng response trả về cho client.]                |
| `[TÊN_MODULE_7_CACHE_MANAGER]`| [TODO: Mô tả vai trò, ví dụ: Quản lý việc đọc/ghi/invalidate cache.]               |

### Điểm mở rộng

  - Các module được thiết kế độc lập, dễ dàng thay thế hoặc nâng cấp.
  - Cấu trúc module tách biệt cho phép viết unit test và mock từng phần hiệu quả.
  - Luồng xử lý rõ ràng giúp dễ dàng theo dõi và debug với `trace_id`.

-----

## 14\. 📚 Tài liệu liên quan (Related Documents)

> **[HƯỚNG DẪN - MỤC 14: TÀI LIỆU LIÊN QUAN]**
>
>   - Liệt kê và verlink đến tất cả các tài liệu quan trọng khác mà người đọc ADR này nên tham khảo.
>   - Bao gồm các file chi tiết khác của chính service này, các ADRs nền tảng, và các tài liệu kiến trúc tổng thể.

- [Interface Contract](./interface-contract.md)
- [Data Model](./data-model.md)
- [OpenAPI Spec](./openapi.yaml)
- [ADR-XXX – [TÊN ADR]]


