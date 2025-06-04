# Sơ đồ Kiến trúc Hệ thống dx-vas

Tài liệu này tập hợp tất cả các sơ đồ kiến trúc quan trọng của hệ thống chuyển đổi số dx-vas, bao gồm:

* Sơ đồ kiến trúc tổng thể
* Diễn giải các khối chức năng
* Các sơ đồ con chi tiết theo từng luồng nghiệp vụ (ví dụ: Tuyển sinh, Thông báo, Phân quyền RBAC...)

## 📚 Mục lục Sơ đồ Kiến trúc Hệ thống dx-vas

| STT | Tên sơ đồ | Mô tả ngắn | Liên kết |
|-----|-----------|------------|----------|
| 1️⃣ | **Kiến trúc tổng quan hệ thống Multi-Tenant** | Tổng thể hệ thống gồm Shared Core và các Tenant Stack | [Xem sơ đồ](#1-kiến-trúc-tổng-quan-hệ-thống-multi-tenant) |
| 2️⃣ | **Luồng đánh giá RBAC tại API Gateway** | Cách Gateway đánh giá quyền động từ JWT + Redis + Sub Service | [Xem sơ đồ](#2-luồng-đánh-giá-rbac-tại-api-gateway) |
| 3️⃣ | **Luồng phát hành JWT đa-tenant** | Quá trình xác thực Google/OTP và phát token | [Xem sơ đồ](#3-luồng-phát-hành-jwt-đa-tenant) |
| 4️⃣ | **Luồng gửi Notification toàn hệ thống (Option B)** | Pub/Sub fan-out từ Master đến Sub Notification Services | [Xem sơ đồ](#4-luồng-gửi-notification-toàn-hệ-thống-option-b--pubsub-fan-out) |
| 5️⃣ | **Sơ đồ triển khai hạ tầng (Deployment Diagram)** | Tổ chức project GCP cho core/tenant/monitoring/data | [Xem sơ đồ](#5-sơ-đồ-triển-khai-hạ-tầng-deployment-diagram) |
| 6️⃣ | **Vòng đời tài khoản (Account Lifecycle)** | Từ tạo user → gán tenant → cấp quyền → vô hiệu hóa | [Xem sơ đồ](#6-vòng-đời-tài-khoản-account-lifecycle) |
| 7️⃣ | **Luồng đồng bộ RBAC từ Master → Sub** | Tự động hoặc thủ công sync role/permission template | [Xem sơ đồ](#7-luồng-đồng-bộ-rbac-từ-master--sub-user-services) |
| 8️⃣ | **Phân quyền giao diện người dùng (UI Role Mapping)** | Vai trò được ánh xạ đến các frontend: Superadmin, Admin, GV, PH | [Xem sơ đồ](#8-phân-quyền-giao-diện-người-dùng-ui-role-mapping) |


---

## 1. Kiến trúc tổng quan hệ thống Multi-Tenant

Sơ đồ dưới đây mô tả kiến trúc tổng thể của hệ thống dx-vas theo mô hình multi-tenant:

- Một công ty quản lý nhiều trường thành viên (tenant), mỗi trường có stack riêng biệt.
- Các stack tenant sử dụng chung các dịch vụ cốt lõi như API Gateway, User Service Master, Auth Master.
- Phân quyền, xác thực, thông báo và định tuyến được thực hiện theo từng `tenant_id`.

```mermaid
flowchart TD
  %% SUPERADMIN
  subgraph SuperadminZone [Superadmin Zone]
    SuperadminWebapp(Superadmin Webapp)
  end

  %% TENANT ZONE
  subgraph Tenant [Per Tenant]
    subgraph Frontend
      AdminWebapp(Admin Webapp)
      CustomerPortal(Customer Portal)
    end

    subgraph TenantInfra [Services]
      UserSub(User Service Sub)
      AuthSub(Auth Service Sub)
      NotificationSub(Notification Service Sub)
    end

    subgraph ExternalAdapters [Adapters]
      CRM
      SIS
      LMS
    end
  end

  %% CORE SERVICES
  subgraph CoreServices [Core Services]
    subgraph Entry
      %% API GATEWAY
      APIGateway(API Gateway)
    end
    UserMaster(User Service Master)
    AuthMaster(Auth Service Master)
    NotificationMaster(Notification Service Master)
    ReportingService(Reporting Service)
    RedisCache(Redis Cache)
    MonitoringStack(Monitoring & Audit Stack)
  end

  %% DATA PLATFORM
  subgraph DataInfra [Data Platform]
    PubSub(Pub/Sub)
    ETL(ETL / ELT)
    DataWarehouse(Data Warehouse - BigQuery)
  end

  %% FLOW: SUPERADMIN & GATEWAY
  SuperadminWebapp -->|API| APIGateway
  AdminWebapp -->|API| APIGateway
  CustomerPortal -->|API| APIGateway

  %% FLOW: API TO CORE
  APIGateway --> UserMaster
  APIGateway --> AuthMaster
  APIGateway --> NotificationMaster
  APIGateway --> ReportingService

  %% FLOW: API TO TENANT SUB SERVICES
  APIGateway --> UserSub
  APIGateway --> AuthSub
  APIGateway --> NotificationSub

  %% FLOW: SYNC MASTER -> SUB
  UserMaster -->|Provision user| UserSub
  AuthMaster -->|Provision account| AuthSub
  NotificationMaster -->|Sync rule| NotificationSub

  %% FLOW: TENANT SERVICE TO ADAPTERS (Operational APIs)
  UserSub --> CRM
  UserSub --> SIS
  UserSub --> LMS

  %% FLOW: ANALYTICS PIPELINES (into DW)
  CRM -->|data sync| ETL
  SIS -->|data sync| ETL
  LMS -->|data sync| ETL

  UserSub -->|events| PubSub
  AuthSub -->|events| PubSub
  NotificationSub -->|events| PubSub

  UserMaster -->|events| PubSub
  AuthMaster -->|events| PubSub
  NotificationMaster -->|events| PubSub

  PubSub --> ETL
  ETL --> DataWarehouse
  ReportingService -->|query/report| DataWarehouse

  %% Redis Cache Flow
  AuthMaster -->|cache session/token| RedisCache
  UserMaster -->|cache RBAC/profile| RedisCache
  ReportingService -->|cache aggregated result| RedisCache

  %% Monitoring & Audit Flow
  AuthMaster -->|audit log| MonitoringStack
  UserMaster -->|audit log| MonitoringStack
  NotificationMaster -->|audit log| MonitoringStack
  ReportingService -->|access log| MonitoringStack
  APIGateway -->|request log| MonitoringStack
```

📘 **Ghi chú:**

* Các khối `Tenant A`, `Tenant B` có thể mở rộng tùy theo số lượng trường.
* Sub Notification Service lắng nghe từ `Notification Master` thông qua Pub/Sub (`Option B`).
* RBAC, Auth, Notification đều hoạt động theo `tenant_id`, đảm bảo isolation.
* Bổ sung `Reporting Service`, `ETL`, `Data Warehouse`
* Hiển thị quan hệ `Superadmin Webapp → Reporting Service → BigQuery`
* Bao gồm Redis, Pub/Sub, Audit Stack

---

## 2. Luồng đánh giá RBAC tại API Gateway

Sơ đồ dưới mô tả cách API Gateway thực hiện xác thực và đánh giá phân quyền động (RBAC) cho từng request dựa trên JWT, Redis cache, và Sub User Service.

- Gateway giải mã JWT để lấy `user_id`, `tenant_id`, `permissions`.
- Nếu có cache, sử dụng Redis để tra cứu nhanh.
- Nếu không có, gọi Sub User Service tương ứng để lấy quyền theo tenant.
- Đánh giá các điều kiện JSONB nếu có trong permission.

```mermaid
sequenceDiagram
    autonumber
    participant Frontend as 🌐 Frontend App
    participant Gateway as 🛡️ API Gateway
    participant JWT as 📦 JWT Token
    participant Redis as ⚡ Redis (RBAC Cache)
    participant SubUser as 🧩 Sub User Service (per tenant)

    Frontend->>Gateway: Gửi request kèm JWT

    Gateway->>JWT: Giải mã token
    Gateway->>JWT: Trích xuất user_id, tenant_id

    alt Cache Hit
        Gateway->>Redis: GET rbac:{user_id}:{tenant_id}
        Redis-->>Gateway: Trả về roles & permissions
    else Cache Miss
        Gateway->>SubUser: GET /rbac/{user_id}
        SubUser-->>Gateway: Trả về roles & permissions
        Gateway->>Redis: SET rbac:{user_id}:{tenant_id}
    end

    Gateway->>Gateway: Đánh giá permission match + condition JSONB

    alt Có quyền truy cập hợp lệ
        Gateway-->>Frontend: ✅ 200 OK (Forward đến backend)
    else Không hợp lệ
        Gateway-->>Frontend: ❌ 403 Forbidden
    end
```

📘 **Tham khảo thêm:**

* [Chi tiết về RBAC Cache](../rbac-deep-dive.md#6-chiến-lược-cache-rbac-tại-api-gateway)
* [Cấu trúc permission có điều kiện](../rbac-deep-dive.md#5-permission-có-điều-kiện-condition-jsonb)

---

## 3. Luồng phát hành JWT đa-tenant

Sơ đồ này mô tả hai luồng xác thực và phát hành JWT:

1. Qua Google OAuth2 – xử lý bởi Auth Service Master
2. Qua Local/OTP – xử lý bởi Sub Auth Service của từng tenant

Sau khi xác thực, JWT được phát hành với thông tin `user_id_global`, `tenant_id`, `roles`, `permissions` – phục vụ phân quyền tại API Gateway.

```mermaid
sequenceDiagram
    autonumber
    participant User as 👤 Người dùng
    participant Frontend as 🌐 Frontend App
    participant AuthM as 🔐 Auth Master
    participant AuthT as 🔐 Sub Auth Service
    participant Master as 🧠 User Service Master
    participant SubUser as 🧩 Sub User Service
    participant JWT as 📦 JWT Token

    rect rgba(220,220,220,0.1)
    Note over User, AuthM: Đăng nhập bằng Google OAuth2
    User->>Frontend: Truy cập ứng dụng
    Frontend->>AuthM: Gửi yêu cầu đăng nhập Google
    AuthM->>Google: OAuth2 login
    Google-->>AuthM: Access Token
    AuthM->>Master: Xác minh user Google + lấy user_id_global
    Master-->>AuthM: Trả user_id_global + danh sách tenant

    alt User có nhiều tenant
        AuthM->>Frontend: Hiển thị danh sách tenant để chọn
        Frontend->>AuthM: Gửi lại tenant đã chọn
    end

    AuthM->>SubUser: Lấy roles & permissions theo tenant đã chọn
    SubUser-->>AuthM: Trả RBAC
    AuthM->>JWT: Phát hành token chứa user_id, tenant_id, roles, permissions
    AuthM-->>Frontend: Trả JWT
    end

    rect rgba(220,220,220,0.1)
    Note over User, AuthT: Đăng nhập bằng OTP / Local
    User->>Frontend: Truy cập app tenant (VD: `abc.truongvietanh.edu.vn`)
    Frontend->>AuthT: Gửi yêu cầu login OTP
    AuthT->>Master: Kiểm tra hoặc đăng ký user → lấy user_id_global
    Master-->>AuthT: Trả user_id_global
    AuthT->>SubUser: Lấy RBAC theo tenant
    SubUser-->>AuthT: Trả roles, permissions
    AuthT->>JWT: Phát JWT với tenant_id + quyền
    AuthT-->>Frontend: Trả JWT
    end
```

📘 **Tham khảo thêm:**

* [ADR-006: Chiến lược xác thực](../ADR/adr-006-auth-strategy.md)
* [Cấu trúc token & chuẩn hoá claim](../README.md#5-auth-service)

---

## 4. Luồng gửi Notification toàn hệ thống (Option B – Pub/Sub fan-out)

Sơ đồ dưới đây thể hiện luồng gửi thông báo toàn hệ thống khi Superadmin muốn broadcast đến một hoặc nhiều trường thành viên:

- Notification Master phát sự kiện lên Pub/Sub.
- Mỗi Sub Notification Service lắng nghe topic, lọc theo `tenant_id`, gửi thông báo bằng kênh riêng (Zalo OA, Gmail API…).
- Mỗi Sub Service phản hồi lại trạng thái gửi qua một topic riêng để Master theo dõi và tổng hợp.

```mermaid
flowchart TD
  subgraph TriggerSources [Nguồn Kích Hoạt Thông báo]
    CRM
    SIS
    LMS
    UserSub(User Service Sub)
    SuperadminAction(Superadmin Webapp)
  end

  subgraph RuleEngines [Notification Rule Engines]
    NotificationRuleSub(Tenant Rule Engine)
    NotificationRuleMaster(Master Rule Engine)
  end

  subgraph NotificationServicesAndPubSub [Notification Services & Pub/Sub]
    NotificationMaster(Notification Service Master)
    NotificationSub(Notification Service Sub)
    GlobalNotifyTopic(Pub/Sub: vas-global-notifications-topic) 
    AckCollector(ACK Collector)
  end

  subgraph Channels [Các Kênh Gửi Thông báo]
    SMS
    Email
    Zalo
    Internal(App Notification)
  end

  %% Trigger sources to rule engines
  CRM --> NotificationRuleSub
  SIS --> NotificationRuleSub
  LMS --> NotificationRuleSub
  UserSub --> NotificationRuleSub
  SuperadminAction --> NotificationRuleMaster

  %% Rule engines trigger services
  NotificationRuleSub --> NotificationSub
  NotificationRuleMaster --> NotificationMaster

  %% Master notification fan-out via Pub/Sub
  NotificationMaster --> GlobalNotifyTopic
  GlobalNotifyTopic ---> NotificationSub
  %% Tenant notification direct send
  NotificationSub --> SMS
  NotificationSub --> Email
  NotificationSub --> Zalo
  NotificationSub --> Internal

  %% Acknowledgement feedback loop
  SMS ---> AckCollector
  Email ---> AckCollector
  Zalo ---> AckCollector
  Internal ---> AckCollector

  AckCollector --> NotificationSub
  AckCollector --> NotificationMaster
```

📘 **Ghi chú:**

* Mỗi Sub Notification tự chịu trách nhiệm gửi đi và ghi log theo cấu hình tenant riêng.
* Notification Master **không cần biết cấu trúc cụ thể** của từng Sub Service, chỉ cần phát sự kiện chuẩn hoá.
* Hệ thống hỗ trợ cả lọc theo `target_tenant_ids`, `target_roles`, hoặc tiêu chí tùy chỉnh.

📎 Tham khảo thêm:

* [`phat-sinh-va-phuong-an-02.md`](../requirements/phat-sinh-va-phuong-an-02.md)
* [`adr-008-audit-logging.md`](../ADR/adr-008-audit-logging.md)

---

## 5. Sơ đồ triển khai hạ tầng (Deployment Diagram)

Sơ đồ này mô tả kiến trúc triển khai hạ tầng của hệ thống dx-vas trên Google Cloud, theo mô hình chia project rõ ràng giữa core services và các tenant. Mỗi tenant có stack riêng, độc lập về tài nguyên, giúp đảm bảo cách ly và dễ scale.

```mermaid
flowchart TD
  subgraph dx-vas-core [VPC: dx-vas-core]
    APIGateway(API Gateway)
    AuthService(Auth Service)
    UserService(User Service)
    NotificationService(Notification Service)
    ReportingService(Reporting Service)
    RedisCache(Redis Cache)
    AuditStack(Monitoring & Audit Stack)
  end

  subgraph dx-vas-data [VPC: dx-vas-data]
    PubSub
    ETL(ETL Worker / Dataflow)
    BigQuery(Data Warehouse)
    GCS(Google Cloud Storage)
  end

  subgraph SharedInfra [Hạ tầng dùng chung]
    SecretManager(Secret Manager)
    ConfigCenter(Config Center)
    GitHub(GitHub Actions)
    Terraform(IaC via Terraform)
  end

  %% Core Services access data infra
  ReportingService --> BigQuery
  ReportingService --> RedisCache
  APIGateway --> RedisCache
  NotificationService --> PubSub

  %% ETL ingest
  PubSub --> ETL
  GCS --> ETL
  ETL --> BigQuery

  %% DevOps & Config
  GitHub --> Terraform
  Terraform --> dx-vas-core
  Terraform --> dx-vas-data
  AuthService --> SecretManager
  UserService --> ConfigCenter
  NotificationService --> ConfigCenter
  ReportingService --> ConfigCenter
```

📘 **Giải thích:**

* Mỗi tenant được tách thành 1 project riêng (theo chuẩn đa tổ chức và quản trị billing).
* Tách `dx-vas-core` và `dx-vas-data` theo mô hình micro-VPC
* `dx-vas-core` chứa các dịch vụ dùng chung: Gateway, Auth/User Master, Redis, Pub/Sub.
* `dx-vas-monitoring` tập trung log/metrics toàn hệ thống.
* `dx-vas-data` lưu trữ Cloud SQL, BigQuery, GCS phục vụ phân tích, lưu trữ tập trung.
* Thể hiện đúng hướng tương tác: Service → Redis, Service → Config/Secrets
* Dễ mở rộng thêm AI stack hoặc Worker nếu cần sau này

📎 Tham khảo chi tiết:

* [`adr-019-project-layout.md`](../ADR/adr-019-project-layout.md)
* [`adr-015-deployment-strategy.md`](../ADR/adr-015-deployment-strategy.md)

---

## 6. Vòng đời tài khoản (Account Lifecycle)

Sơ đồ dưới đây mô tả toàn bộ vòng đời của một người dùng trong hệ thống dx-vas, từ khi được định danh tại User Service Master đến khi được gán vào tenant, phân quyền, hoạt động và (nếu cần) bị vô hiệu hóa.

```mermaid
graph TD

  A[📥 Đăng ký / Import User] --> B[🧠 Tạo định danh tại users_global]
  B --> C[🏫 Gán vào tenant tại user_tenant_assignments]
  C --> D[🧩 Đồng bộ xuống users_in_tenant]
  D --> E[🗂️ Gán role tại user_role_in_tenant]
  E --> F[🛂 Phát JWT sau khi xác thực]
  F --> G[⚙️ Hoạt động & phân quyền tại Gateway]

  G --> H[🪵 Audit log + thống kê]
  G --> I[🛑 Vô hiệu hóa tạm thời: is_active_in_tenant = false]
  G --> J[🗃️ Vô hiệu hóa toàn cục: is_active = false]

  I --> H
  J --> H
```

📌 **Ý nghĩa các bước:**

* **Bước A–C:** User có thể được thêm thủ công (Admin/Superadmin) hoặc import từ hệ thống khác.
* **Bước D–E:** Khi gán vào tenant, user được ánh xạ và gán role tại tenant đó.
* **Bước F–G:** Sau khi đăng nhập, token được phát hành và dùng để phân quyền.
* **Bước H–J:** Quản trị viên có thể vô hiệu hóa tạm thời tại tenant hoặc toàn hệ thống.

📘 Tham khảo chi tiết mô hình dữ liệu:

* [`user-service/master/data-model.md`](../services/user-service/master/data-model.md)
* [`user-service/tenant/data-model.md`](../services/user-service/tenant/data-model.md)

---

## 7. Luồng đồng bộ RBAC từ Master → Sub User Services

Sơ đồ này mô tả cách hệ thống dx-vas thực hiện đồng bộ vai trò và quyền từ User Service Master xuống các Sub User Service của từng tenant.

- Các template vai trò/quyền được quản lý tập trung.
- Tenant có thể chọn kế thừa tự động, hoặc clone để chỉnh sửa nội bộ.
- Việc đồng bộ được thực hiện theo event (Pub/Sub) hoặc API chủ động.

```mermaid
sequenceDiagram
    autonumber
    participant Admin as 🧑‍💼 Superadmin / DevOps
    participant Master as 🧠 User Service Master
    participant PubSub as 📨 Pub/Sub: rbac-sync
    participant SubUser as 🧩 Sub User Service (per tenant)

    Admin->>Master: Cập nhật template role/permission
    Master->>Master: Ghi vào global_roles_templates / global_permissions_templates

    alt Cấu hình auto-sync (tenant đang dùng bản chuẩn)
        Master->>PubSub: Publish `rbac_template_updated`
        PubSub-->>SubUser: Sự kiện cập nhật RBAC
        SubUser->>SubUser: Tự động cập nhật/cập đè các role/permission
    else Tenant dùng bản đã clone
        Admin->>SubUser: Yêu cầu re-sync thủ công (qua API)
        SubUser->>SubUser: Hiển thị diff, cho phép xác nhận cập nhật
    end
```

📘 **Ghi chú:**

* Cấu hình `sync_mode` tại mỗi tenant có thể là:

  * `"inherit"`: đồng bộ tự động
  * `"clone"`: chỉ copy 1 lần, sau đó quản lý riêng
* Tenant có thể dùng dashboard để xem chênh lệch giữa template master và local.

📎 Tài liệu liên quan:

* [`rbac-deep-dive.md`](../architecture/rbac-deep-dive.md#7-chiến-lược-đồng-bộ-rbac)

---

## 8. Phân quyền giao diện người dùng (UI Role Mapping)

Sơ đồ dưới mô tả cách các vai trò hệ thống được ánh xạ và kiểm soát hiển thị tính năng trong từng lớp giao diện người dùng.

- Quyền được cấp tại Sub User Service (per tenant)
- UI xác định quyền truy cập chức năng dựa vào các permission đã decode từ JWT

```mermaid
flowchart TD

  subgraph SuperadminWebapp["🧑‍💼 Superadmin Webapp"]
    S1[View Tenants]
    S2[Assign User ↔ Tenant]
    S3[Manage Global RBAC Templates]
    S4[Global Notification]
    S5[System Audit Logs]
  end

  subgraph AdminWebapp_Tenant["🧑‍🏫 Admin Webapp (per tenant)"]
    A1[Manage Users in Tenant]
    A2[Assign Roles]
    A3[Create/Update Roles]
    A4["Access Audit Logs (Tenant)"]
    A5[Send Local Notification]
  end

  subgraph TeacherUI["👩‍🏫 Teacher Interface"]
    T1[Xem lớp đang dạy]
    T2[Nhập điểm]
    T3[Gửi thông báo đến học sinh]
  end

  subgraph ParentUI["👨‍👩‍👧‍👦 Phụ huynh UI"]
    P1[Xem học phí]
    P2[Xem điểm số, hạnh kiểm]
    P3[Gửi phản hồi giáo viên]
  end

  subgraph JWT["📦 JWT Payload"]
    Roles["roles[]"]
    Permissions["permissions[]"]
  end

  JWT --> SuperadminWebapp
  JWT --> AdminWebapp_Tenant
  JWT --> TeacherUI
  JWT --> ParentUI
```

---

## 9. Hệ thống Báo cáo & Phân tích (Reporting & Analytics Architecture)

- phản ánh đầy đủ luồng dữ liệu và các thành phần chính như:
* Superadmin Webapp
* Reporting Service
* Data Warehouse
* ETL pipelines từ Pub/Sub và Adapters
* RBAC + Template

```mermaid
flowchart TD
  subgraph UI [Giao diện Người dùng]
    SuperadminWebapp(Superadmin Webapp)
  end

  subgraph Gateway [Cổng Giao Tiếp]
    APIGateway(API Gateway)
  end

  subgraph API [Lớp API & Báo cáo]
    ReportingService(Reporting Service)
  end

  subgraph ConfigStorage [Lưu trữ Cấu hình & Templates]
    ReportTemplateDB(Report Templates Store) 
    SavedDashboardConfigDB(Saved Dashboard Configs)
  end

  subgraph DataInfra [Hạ tầng Dữ liệu]
    PubSubEvents(Pub/Sub Events)
    ETLWorker(ETL Pipeline)
    DataWarehouse(BigQuery / Data Lake)
  end

  subgraph DataSources [Nguồn Dữ liệu Gốc]
    direction LR
    UserServiceMaster(User Service Master)
    AuthServiceMaster(Auth Service Master)
    TenantAdapters["Tenant Specific: <br/>UserSub, AuthSub, <br/>CRM, SIS, LMS Adapters"]
  end

  %% User flow
  SuperadminWebapp -->|API Request - chọn report, params| APIGateway
  APIGateway -- "Forward Request + Enforce RBAC<br/>(dựa trên JWT & ReportTemplate.required_permission)" --> ReportingService
  ReportingService -->|1. Get Template Definition| ReportTemplateDB
  ReportingService -->|2. Optional - Get Saved Config| SavedDashboardConfigDB 
  ReportingService -->|3. Generate & Execute Query| DataWarehouse

  %% Data ingestion
  UserServiceMaster -->|events| PubSubEvents
  AuthServiceMaster -->|events| PubSubEvents
  TenantAdapters -->|events/data sync| PubSubEvents
  TenantAdapters -->|batch data| ETLWorker
  
  PubSubEvents --> ETLWorker
  ETLWorker --> DataWarehouse
```

📌 **Ghi chú cho sơ đồ:**

* `ReportingService` truy xuất template + kiểm tra RBAC trước khi truy vấn `DataWarehouse`
* `ETLWorker` nạp dữ liệu từ cả `PubSub` (sự kiện từ các Sub Services) và từ CRM/SIS/LMS qua batch hoặc streaming
* Phân quyền báo cáo được thực thi bởi `RBACEnforcer` theo cấu hình trong template

---

## 10. AI Integration Strategy 

– phản ánh Mục 10 trong `README.md`, kết nối hệ thống hiện tại với khả năng tích hợp các AI Agent trong tương lai. Sơ đồ nhấn mạnh:
* Nền tảng dữ liệu (Data Warehouse) là trung tâm
* AI Agent có thể tương tác qua API hoặc Data Access Layer
* Yêu cầu chuẩn hóa schema, metadata và quản trị data quality

```mermaid
flowchart TD
  subgraph SuperadminZone [Superadmin Zone]
    SuperadminWebapp(Superadmin Webapp)
  end

  subgraph BackendAPI [Backend APIs]
    APIGateway(API Gateway<br/><sub>check RBAC first</sub>)
    ReportingService(Reporting Service)
    RBAC(RBAC Enforcer<br/><sub>enforce permission from Report Template</sub>)
    ReportTemplateDB(Report Templates Store)
  end

  subgraph DataPlatform [Nền tảng Dữ liệu]
    BigQuery(Data Warehouse)
    ETL(ETL Pipeline)
    MetadataRegistry(Schema & Metadata Registry)
  end

  subgraph DataSources [Nguồn Dữ liệu]
    MasterServicesEvents
    SubServicesEvents
    SystemEvents(System Events - Pub/Sub<br/><sub>Central Event Bus</sub>)
    CRM
    SIS
    LMS
  end

  subgraph AIIntegration [Tầng AI Tương Tác]
    AIAdminAgent(AI Agent - Trợ lý Superadmin)
    AIDashboardBuilder(AI Agent - Dashboard Builder)
    AIPredictor(AI Agent - Dự đoán xu hướng)
    DataAccessAPI(Data Access Layer / Feature Store)
  end

  %% Luồng người dùng
  SuperadminWebapp --> APIGateway
  APIGateway --> ReportingService
  ReportingService --> ReportTemplateDB
  ReportingService --> RBAC
  ReportingService --> BigQuery
  
  MasterServicesEvents --> SystemEvents
  SubServicesEvents --> SystemEvents
  %% Dữ liệu vào
  CRM --> ETL
  SIS --> ETL
  LMS --> ETL
  SystemEvents --> ETL
  ETL --> BigQuery
  ETL --> MetadataRegistry

  %% AI dùng data platform
  DataAccessAPI --> BigQuery
  DataAccessAPI --> MetadataRegistry

  %% AI dùng lại báo cáo sẵn có
  AIAdminAgent --> DataAccessAPI
  AIDashboardBuilder --> DataAccessAPI
  AIDashboardBuilder -.-> ReportTemplateDB
  AIPredictor --> DataAccessAPI
```

---

📌 **Ghi chú:**

* `DataAccessAPI` là lớp trừu tượng (có thể dùng để chuẩn bị dữ liệu cho training hoặc inference)
* `MetadataRegistry` tương ứng với quản trị schema theo `ADR-030`
* Mỗi AI Agent có mục tiêu riêng (hỗ trợ, tổng hợp, dự đoán) và có thể tái sử dụng query/template từ Reporting Service

---

📘 **Ghi chú:**

* UI không nên hard-code role, mà nên kiểm tra theo permission cụ thể (VD: `can_assign_role`, `can_view_tuition`)
* Các permission này được Gateway trả về trong JWT hoặc refresh qua API `GET /me/permissions`
* Việc kiểm tra quyền có thể dùng Hook/Vuex/Redux trung tâm tại frontend để gắn cờ `canAccess[X]`

📎 Liên quan:

* [RBAC Deep Dive](../architecture/rbac-deep-dive.md#11-best-practices-cho-quản-trị-rbac)
* [README](../README.md#3-admin-webapp-cấp-độ-tenant)
