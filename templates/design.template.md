---
title: Thiết kế chi tiết [TÊN_SERVICE_CỦA_BẠN]
version: "1.0" # TODO: Bắt đầu với 1.0 cho bản nháp đầu tiên, tăng dần khi có thay đổi lớn.
last_updated: "YYYY-MM-DD" # TODO: Ngày cập nhật cuối cùng.
author: "DX VAS Team"
reviewed_by: "Stephen Le"
---
# 📘 Thiết kế chi tiết [TÊN_SERVICE_CỦA_BẠN]

> **[HƯỚNG DẪN SỬ DỤNG TEMPLATE NÀY:]**
> 1. Sao chép toàn bộ nội dung file này vào một file `design.md` mới trong thư mục service của bạn.
> 2. Tìm và thay thế tất cả các placeholder có dạng `[PLACEHOLDER]` hoặc các comment `TODO:` bằng thông tin cụ thể của service bạn.
> 3. Xóa các khối hướng dẫn (như khối này) hoặc các comment không cần thiết sau khi đã điền thông tin.
> 4. Đảm bảo tài liệu của bạn rõ ràng, chi tiết và tuân thủ "Checklist Tiêu Chuẩn 5★ cho Tài Liệu Thiết Kế Service".

## 1. 🧭 Phạm vi và Trách nhiệm (Scope & Responsibilities)

### 🎯 Mục tiêu

> **[HƯỚNG DẪN:]**
> Nêu rõ ràng và súc tích (2-3 gạch đầu dòng) mục đích chính của service này.
> - Service này giải quyết vấn đề gì?
> - Giá trị cốt lõi mà nó mang lại là gì?
> - Đối tượng người dùng/client chính của service là ai?

-   [TODO: Mục tiêu 1 của service, ví dụ: Cung cấp dữ liệu [loại_dữ_liệu] cho [client_chính] trong từng [phạm_vi, ví dụ: tenant].]
-   [TODO: Mục tiêu 2 của service, ví dụ: Đảm bảo tính [tính_chất, ví dụ: đọc-only, nhất quán] cho dữ liệu được quản lý.]
-   [TODO: Mục tiêu 3 của service, ví dụ: Đồng bộ dữ liệu từ [service_nguồn] thông qua cơ chế [cơ_chế, ví dụ: event-driven].]

### 📦 Các thực thể dữ liệu quản lý

> **[HƯỚNG DẪN:]**
> Liệt kê các thực thể dữ liệu chính mà service này chịu trách nhiệm quản lý hoặc tương tác trực tiếp.
> Đây là cái nhìn tổng quan, chi tiết sẽ có trong Mục 3 (Mô hình dữ liệu).

| Thực thể                 | Mô tả                                                                    |
| :----------------------- | :----------------------------------------------------------------------- |
| `[TÊN_THỰC_THỂ_1]`      | [TODO: Mô tả ngắn gọn vai trò của thực thể 1, ví dụ: Bản sao của [ThựcThểGốc], lưu trạng thái trong [phạm_vi].] |
| `[TÊN_THỰC_THỂ_2]`      | [TODO: Mô tả ngắn gọn vai trò của thực thể 2.]                             |
| `[TÊN_THỰC_THỂ_3_Lite]` | [TODO: Mô tả ngắn gọn, ví dụ: Danh sách [loại_template] được đồng bộ từ [service_nguồn].] |

> ⚠️ [TODO: (Tùy chọn) Thêm các ghi chú quan trọng về phạm vi dữ liệu, ví dụ: Service này không chứa dữ liệu nhạy cảm X, Y...]

### 🔒 Ngoài Phạm Vi (Out of Scope)

> **[HƯỚNG DẪN:]**
> Đây là mục rất quan trọng để tránh hiểu lầm và chồng chéo trách nhiệm. Liệt kê rõ ràng những gì service này **KHÔNG** làm.

Service này **không** thực hiện các tác vụ sau:

-   ❌ [TODO: Chức năng/Trách nhiệm 1 không thuộc phạm vi, ví dụ: Xác thực người dùng (do Service ABC đảm nhiệm).]
-   ❌ [TODO: Chức năng/Trách nhiệm 2 không thuộc phạm vi, ví dụ: Quản lý vòng đời [LoạiTemplate] gốc (Sub chỉ consume bản sao).]
-   ❌ [TODO: Chức năng/Trách nhiệm 3 không thuộc phạm vi, ví dụ: Ghi dữ liệu [LoạiDữLiệu] (chỉ nhận qua event).]
-   ❌ [TODO: Chức năng/Trách nhiệm 4 không thuộc phạm vi, ví dụ: Truy cập hoặc xử lý dữ liệu ngoài phạm vi [phạm_vi_quy_định].]
-   ❌ [TODO: Chức năng/Trách nhiệm 5 không thuộc phạm vi, ví dụ: Gọi trực tiếp sang service X, Y (chỉ tương tác qua API Gateway hoặc consume event).]

---

## 2. 🌐 Thiết kế API chi tiết (Interface Contract)

> **[HƯỚNG DẪN:]**
> - Cung cấp bảng tóm tắt các API chính. Chi tiết từng API sẽ nằm trong file `interface-contract.md` và `openapi.yaml`.
> - Khẳng định việc tuân thủ các ADRs liên quan đến API.
> - Cung cấp một ví dụ response điển hình cho một API phức tạp hoặc quan trọng để minh họa.

| Method | Path                              | Tác vụ                                 | Yêu cầu permission                   |
| :----- | :-------------------------------- | :------------------------------------- | :------------------------------------- |
| GET    | `/[resource_collection]`          | [TODO: Mô tả, ví dụ: Danh sách [resource] trong [phạm_vi]]   | ✅ `[scope].read_[resource]`        |
| GET    | `/[resource_collection]/me`       | [TODO: Mô tả, ví dụ: Thông tin [resource] của người dùng hiện tại] | ❌ (Chỉ cần token hợp lệ)             |
| GET    | `/[resource_collection]/me/subresource` | [TODO: Mô tả]                         | ❌ (Chỉ cần token hợp lệ)             |
| GET    | `/[config_resource_collection]`   | [TODO: Mô tả, ví dụ: [LoạiConfig] hiện có]      | ✅ `[scope].view_[config_resource]` |

> 🔧 API dùng chuẩn OpenAPI, tuân thủ cấu trúc response [ADR-012 Response Structure](../../../ADR/adr-012-response-structure.md), định nghĩa schema riêng cho tất cả response và error theo [ADR-011 Error Format](../../../ADR/adr-011-api-error-format.md).

### 📦 Ví dụ response `GET /[resource_collection]/me/subresource`

```json
// TODO: Cung cấp một ví dụ JSON response điển hình.
// Ví dụ từ user-service/sub cho GET /users/me/permissions:
{
  "data": [
    "student.view",
    "attendance.mark"
  ],
  "meta": {
    "request_id": "req-abc-123",
    "timestamp": "2025-05-31T14:20:00Z"
  }
}
```

-----

## 3\. 🗃️ Mô hình dữ liệu chi tiết (Data Model)

> **[HƯỚNG DẪN:]**
>
>   - Cung cấp sơ đồ ERD trực quan.
>   - Mô tả chi tiết từng bảng/thực thể dữ liệu mà service này quản lý.
>   - Tham khảo file `data-model.md` để có cấu trúc chi tiết hơn nếu cần.

### 🗺️ Sơ đồ ERD (Entity Relationship Diagram)

```mermaid
// TODO: Vẽ sơ đồ ERD cho các bảng chính của service này.
// Sử dụng Mermaid hoặc chèn hình ảnh.
// Ví dụ từ user-service/sub:
erDiagram
  UserLocal ||--o{ UserTenantRole : has
  UserTenantRole }o--|| RoleTemplateLite : references
  RoleTemplateLite ||--o{ PermissionTemplateLite : includes // Quan hệ logic

  UserLocal {
    UUID user_id PK
    STRING email
    STRING full_name
    // ... các trường khác
  }

  UserTenantRole {
    UUID user_id FK
    STRING role_code FK
    STRING[] permissions
  }

  RoleTemplateLite {
    STRING role_code PK
    // ... các trường khác
  }

  PermissionTemplateLite {
    STRING code PK
    // ... các trường khác
  }
```

> 💡 **Ghi chú:** [TODO: Thêm các ghi chú giải thích cho ERD nếu cần, ví dụ: giải thích các mối quan hệ logic, quy ước kiểu dữ liệu trong Mermaid so với CSDL thực tế.]

### Bảng: `[TÊN_BẢNG_1]`

> **[HƯỚNG DẪN:]** Lặp lại cấu trúc này cho mỗi bảng.

| Cột                 | Kiểu     | Ghi chú                                |
| :------------------ | :------- | :------------------------------------- |
| `[tên_cột_1]`       | [KiểuDL] | [TODO: Primary key, Foreign key, Not Null, Default, Mô tả ý nghĩa] |
| `[tên_cột_2]`       | [KiểuDL] | [TODO: Mô tả]                          |
| `created_at`        | datetime | [TODO: Thời gian tạo bản ghi]            |
| `updated_at`        | datetime | [TODO: Thời gian cập nhật cuối]         |

-----

## 4\. 🔄 Luồng xử lý nghiệp vụ chính (Business Logic Flows)

> **[HƯỚNG DẪN:]**
>
>   - Chọn 1-2 luồng nghiệp vụ quan trọng nhất hoặc phức tạp nhất của service để minh họa.
>   - Sử dụng sequence diagram (Mermaid) để trực quan hóa.
>   - Mô tả ngắn gọn các bước trong luồng.

### Luồng: `[TÊN_LUỒNG_NGHIỆP_VỤ_1]`

```mermaid
sequenceDiagram
  participant Client as [Client/Service Gọi Đến]
  participant API as [API Endpoint Của Bạn]
  participant Logic as [Thành Phần Logic Chính]
  participant DB as [Cơ Sở Dữ Liệu]
  // participant OtherService as [Service Khác (nếu có)]

  Client->>API: [TODO: Request đến API]
  API->>Logic: [TODO: Gọi hàm xử lý logic]
  Logic->>DB: [TODO: Tương tác với DB]
  // Logic->>OtherService: [TODO: Gọi service khác (nếu có)]
  // OtherService-->>Logic: [TODO: Response từ service khác]
  DB-->>Logic: [TODO: Kết quả từ DB]
  Logic-->>API: [TODO: Trả kết quả xử lý]
  API-->>Client: [TODO: Response cho client]
```

> **Mô tả luồng:**
>
> 1.  [TODO: Bước 1]
> 2.  [TODO: Bước 2]
> 3.  ...

-----

## 5\. 📣 Các sự kiện Pub/Sub (Events)

> **[HƯỚNG DẪN:]**
>
>   - Nếu service của bạn consume hoặc publish sự kiện, hãy liệt kê chúng ở đây.
>   - Với mỗi sự kiện, nêu rõ tên, nguồn phát/đích nhận, hành động tương ứng, và ví dụ payload.

| Sự kiện nhận/phát                 | Nguồn phát / Đích nhận        | Hành động tại Service này                                       |
| :-------------------------------- | :--------------------------- | :-------------------------------------------------------------- |
| `[TÊN_SỰ_KIỆN_NHẬN_1]`           | `[service_nguồn]`            | [TODO: Mô tả hành động khi nhận sự kiện này, ví dụ: Insert/Update [Bảng Dữ Liệu].] |
| `[TÊN_SỰ_KIỆN_PHÁT_RA_1]` (nếu có) | (Service này phát ra)      | [TODO: Mô tả dữ liệu được phát ra và mục đích.]                 |

### 📦 Ví dụ Payload Sự Kiện Tiêu Biểu (Event Payloads)

```json
// TODO: Cung cấp ví dụ payload cho các sự kiện quan trọng.
// Ví dụ cho sự kiện [TÊN_SỰ_KIỆN_NHẬN_1]:
{
  "event_type": "[TÊN_SỰ_KIỆN_NHẬN_1]",
  "data": {
    "key1": "value1",
    "key2": "value2"
  },
  "metadata": {
    "event_id": "uuid-event-123",
    "timestamp": "2025-06-01T10:00:00Z",
    "source_service": "[service_nguồn]"
  }
}
```

-----

## 6\. 🔐 Bảo mật & Phân quyền (Security & Authorization)

> **[HƯỚNG DẪN:]**
>
>   - Mô tả cơ chế xác thực (thường là JWT đã được Gateway validate).
>   - Cách service xử lý thông tin user/tenant từ token.
>   - Vai trò của Gateway và Service này trong việc enforce permission.

  * **Xác thực (Authentication):** Service này giả định rằng request đến đã được xác thực bởi API Gateway. Thông tin người dùng (`user_id`, `tenant_id`) và danh sách permissions (`X-Permissions`) được truyền xuống qua HTTP headers đã được tin cậy.
  * **Phân quyền (Authorization):**
      * Các API có yêu cầu quyền cụ thể (ví dụ: `GET /users` cần `tenant.read_users`) sẽ **khai báo `x-required-permission`** trong đặc tả OpenAPI.
      * Việc thực thi (`enforce`) các permission này sẽ do **API Gateway đảm nhiệm** dựa trên danh sách `X-Permissions` trong header.
      * Service này **không cần lặp lại logic kiểm tra permission phức tạp** nếu Gateway đã xử lý.
      * Các API cá nhân (ví dụ: `GET /users/me`) chỉ cần token hợp lệ, không yêu cầu permission cụ thể.

-----

## 7\. ⚙️ Cấu hình & Phụ thuộc (Configuration & Dependencies)

> **[HƯỚNG DẪN:]**
>
>   - Liệt kê các biến môi trường quan trọng.
>   - Liệt kê các secrets cần thiết.
>   - Nêu rõ các phụ thuộc vào service khác (nếu có, và cách tương tác).

| Thành phần               | Mục đích                                     | Ví dụ Giá trị / Cách Quản Lý        |
| :----------------------- | :------------------------------------------- | :-------------------------------- |
| `ENV`                    | Môi trường hoạt động (dev, staging, prod) | `production`                      |
| `PORT`                   | Cổng lắng nghe của service                  | `8080`                            |
| `DATABASE_URL`           | Chuỗi kết nối CSDL                          | (Secret) `postgresql://user:pass@host:port/db` |
| `KAFKA_BROKERS` (Nếu dùng Kafka) | Danh sách Kafka brokers                   | `kafka1:9092,kafka2:9092`         |
| `PUBSUB_PROJECT_ID` (Nếu dùng GCP Pub/Sub) | Project ID của Pub/Sub                     | `my-gcp-project`                  |
| `[TÊN_TOPIC_EVENT_1]`    | Tên topic cho sự kiện [TÊN\_SỰ\_KIỆN\_NHẬN\_1]  | `topic-event-1`                   |
| `JWT_PUBLIC_KEY` (Nếu cần verify token) | Public key để xác thực JWT (nếu Gateway không gửi xuống X-User-ID) | (Secret) Path hoặc nội dung key |
| `TENANT_ID` (Cho Sub Service) | ID của tenant mà instance này phục vụ      | Gán cứng trong môi trường deploy   |

> ℹ️ Service này [TODO: ví dụ: **không gọi trực tiếp service khác**, chỉ consume event từ [Service Nguồn] qua [Kafka/PubSub]].

-----

## 8\. 🧪 Testing

> **[HƯỚNG DẪN:]**
> Đề xuất chiến lược testing cho service này, bao gồm các loại test và các kịch bản quan trọng.

### 🔹 Unit Test

  - [TODO: Thành phần/Logic 1 cần unit test, ví dụ: `RBACResolver.expandPermissions()`]
  - [TODO: Thành phần/Logic 2 cần unit test, ví dụ: Mappers dữ liệu từ DB sang DTOs API]
  - [TODO: Thành phần/Logic 3 cần unit test, ví dụ: Xử lý logic của từng event consumer]

### 🔹 Integration Test

  - [TODO: Kịch bản 1, ví dụ: Giả lập sự kiện từ Master và kiểm tra dữ liệu được cập nhật đúng trong DB của Sub Service.]
  - [TODO: Kịch bản 2, ví dụ: Gọi API (mocking Gateway headers) và kiểm tra response trả về từ DB local.]

> 🧪 **Công cụ gợi ý:** [TODO: Liệt kê các công cụ/framework, ví dụ: `pytest` cho Python, `JUnit/Mockito` cho Java, `testcontainers` cho DB, `EmbeddedKafka/MockPubSub` cho event.]

-----

## 9\. 📈 Khả năng Giám sát (Observability)

> **[HƯỚNG DẪN:]**
> Xác định các metrics quan trọng cần theo dõi để đánh giá sức khỏe và hiệu năng của service.
> Tham khảo ADR về Observability chung của hệ thống.

| Metric                                     | Mô tả                                                              | Loại Metric | Đơn vị  | Ghi chú                                      |
| :----------------------------------------- | :----------------------------------------------------------------- | :---------- | :------ | :------------------------------------------- |
| `[prefix]_event_consumed_total`            | Tổng số sự kiện đã consume (có thể chia theo `event_type`)         | Counter     | events  | Theo dõi lưu lượng event                      |
| `[prefix]_event_consume_duration_seconds`  | Thời gian xử lý một sự kiện (có thể chia theo `event_type`)         | Histogram   | seconds | Đánh giá độ trễ xử lý event                  |
| `[prefix]_event_consume_errors_total`      | Tổng số lỗi khi xử lý sự kiện (có thể chia theo `event_type`)       | Counter     | errors  | Theo dõi lỗi đồng bộ                         |
| `[prefix]_api_request_duration_seconds`    | Thời gian xử lý request API (chia theo `endpoint`, `method`)       | Histogram   | seconds | SLO latency cho API                          |
| `[prefix]_api_requests_total`              | Tổng số request API (chia theo `endpoint`, `method`, `status_code`) | Counter     | requests| Lưu lượng API, tỷ lệ lỗi                     |
| `[prefix]_db_connection_pool_active`       | Số lượng active connection đến DB                                  | Gauge       | connections | Theo dõi tài nguyên DB                      |
| `[prefix]_permission_cache_hit_rate` (nếu có) | Tỷ lệ cache hit cho việc tra cứu permission                        | Gauge       | ratio   | Hiệu quả của caching                       |

> 🗣️ Nên expose các metric này qua một endpoint (ví dụ: `/metrics`) để Prometheus hoặc hệ thống giám sát khác có thể scrape.
> 🪵 **Logging:** Đảm bảo log đầy đủ thông tin context (trace\_id, user\_id, tenant\_id nếu có, event\_id) và tuân thủ chuẩn logging của hệ thống.

-----

## 10\. 🔁 Độ tin cậy & Phục hồi (Reliability & Resilience)

> **[HƯỚNG DẪN:]**
> Mô tả các cơ chế giúp service hoạt động tin cậy và có khả năng phục hồi khi có lỗi.

  * **Xử lý lỗi sự kiện (Event Consumer Error Handling):**
      * **Cơ chế retry:** [TODO: Mô tả cơ chế retry, ví dụ: Retry tối thiểu 3 lần với backoff policy nếu xử lý event thất bại.]
      * **Dead Letter Queue (DLQ):** [TODO: Mô tả, ví dụ: Sau khi retry thất bại, event sẽ được gửi vào một DLQ để phân tích và xử lý thủ công sau.]
  * **Tính Idempotency:**
      * [TODO: Mô tả cách đảm bảo idempotency cho việc xử lý event, ví dụ: Dựa trên `event_id` hoặc một key nghiệp vụ duy nhất để tránh xử lý trùng lặp sự kiện.]
  * **Theo dõi Offset (Kafka/PubSub):**
      * [TODO: Mô tả cách service quản lý và theo dõi offset của message queue để đảm bảo không bỏ sót hoặc xử lý lại event không cần thiết.]
  * **Health Check Endpoint:**
      * Service nên cung cấp một endpoint `/healthz` hoặc `/readyz` để Kubernetes hoặc hệ thống điều phối có thể kiểm tra trạng thái.

-----

## 11\. ⚡️ Hiệu năng & Khả năng mở rộng (Performance & Scalability)

> **[HƯỚN DẪN:]**
>
>   - Nêu các mục tiêu về hiệu năng (SLO).
>   - Mô tả cách service có thể được mở rộng.
>   - Đề cập đến các chiến lược caching (nếu có).

  * **SLO đề xuất (Service Level Objectives):**
      * [TODO: API Endpoint 1, ví dụ: `GET /users`]: \< [XXX]ms P95 với [số\_lượng\_dữ\_liệu] trong tenant.
      * [TODO: API Endpoint 2, ví dụ: `GET /users/me/permissions`]: \< [YYY]ms P99 (có thể cache).
      * [TODO: Xử lý sự kiện]: \< [ZZZ]ms P95 từ lúc nhận đến lúc hoàn tất xử lý.
  * **Khả năng mở rộng (Scalability):**
      * [TODO: Mô tả, ví dụ: Service này là stateless và có thể scale horizontally bằng cách tăng số lượng instance. Mỗi instance phục vụ một tenant cụ thể, giúp phân tán tải.]
  * **Caching:**
      * [TODO: Mô tả chiến lược caching, ví dụ: Dữ liệu permission của user có thể được cache tại API Gateway hoặc trong một lớp cache (Redis) với TTL hợp lý (ví dụ: 5-15 phút) để giảm tải cho DB và tăng tốc độ phản hồi cho API `GET /users/me/permissions`.]

-----

## 12\. 📚 Tài liệu liên kết (Related Documents)

> **[HƯỚNG DẪN:]**
> Liệt kê và verlink đến các tài liệu quan trọng khác liên quan đến service này.

  * [Interface Contract](https://www.google.com/search?q=./interface-contract.md): Đặc tả chi tiết các API được service cung cấp.
  * [Data Model](https://www.google.com/search?q=./data-model.md): Thiết kế schema CSDL chi tiết cho service.
  * [OpenAPI Spec](https://www.google.com/search?q=./openapi.yaml): Mô tả chuẩn OpenAPI cho các endpoint.
  * [ADR-xxx - Tên adr]: [TODO: Mô tả ngắn gọn ADR này liên quan như thế nào.]


-----
