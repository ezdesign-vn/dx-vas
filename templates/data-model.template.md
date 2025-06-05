---
# TODO: Thay thế các giá trị placeholder bên dưới.
title: "[TÊN_SERVICE_CỦA_BẠN] - Data Model" # Ví dụ: Order Service - Data Model
version: "1.0" # TODO: Bắt đầu với 1.0 cho bản nháp đầu tiên của data model service này.
last_updated: "YYYY-MM-DD" # TODO: Ngày cập nhật cuối cùng của tài liệu này.
author: "DX VAS Team" # Ví dụ: DX VAS E-commerce Team
reviewed_by: "Stephen Le" # Ví dụ: Stephen Le, CTO Team
---

# 🗃️ [TÊN_SERVICE_CỦA_BẠN] - Data Model

> **[HƯỚNG DẪN SỬ DỤNG TEMPLATE DATA-MODEL.MD NÀY (v1.2):]**
> 1. Sao chép toàn bộ nội dung file này để tạo một file `data-model.md` mới trong thư mục service của bạn (ví dụ: `services/[your-service-name]/data-model.md`).
> 2. Điền đầy đủ thông tin vào phần metadata YAML ở trên.
> 3. Với mỗi mục chính của tài liệu (Phạm vi, Mục tiêu, Sơ đồ ERD, Chi tiết Bảng, v.v.), hãy đọc kỹ các hướng dẫn và cung cấp thông tin cụ thể, rõ ràng, và súc tích cho service của bạn.
> 4. Sử dụng Markdown formatting hiệu quả (headings, tables, code blocks, Mermaid diagrams) để tài liệu dễ đọc và trực quan.
> 5. Luôn tham chiếu đến các ADRs, tài liệu kiến trúc tổng thể (`README.md`, `system-diagrams.md`), và các tài liệu chi tiết khác của service (`design.md`, `interface-contract.md`, `openapi.yaml`) nếu cần.
> 6. Xóa các comment hướng dẫn không cần thiết sau khi đã hoàn thiện file.
> 7. Mục tiêu là tạo ra một tài liệu mô hình dữ liệu "sống", phản ánh đúng và đủ chi tiết về cấu trúc dữ liệu của service để đội ngũ phát triển, DBA, và kiến trúc sư có thể sử dụng.

Tài liệu này mô tả chi tiết mô hình dữ liệu của **[TÊN_SERVICE_CỦA_BẠN]**.
Service này là một thành phần [TODO: ví dụ: cốt lõi, phụ trợ, tenant-specific] trong hệ thống `dx-vas`, hoạt động theo kiến trúc [TODO: ví dụ: event-driven, request-response, multi-tenant].

**[TÊN_SERVICE_CỦA_BẠN]** chịu trách nhiệm quản lý các loại dữ liệu chính sau:
- [TODO: Loại dữ liệu 1 (`tên_bảng_tương_ứng_1`)]
- [TODO: Loại dữ liệu 2 (`tên_bảng_tương_ứng_2`)]
- [TODO: Loại dữ liệu 3 (nếu có)]

---
---

## 1. Phạm vi Dữ liệu Quản lý (Scope)

> **[HƯỚNG DẪN - MỤC 1: PHẠM VI DỮ LIỆU QUẢN LÝ]**
> - Liệt kê cụ thể hơn các nhóm chức năng hoặc các loại dữ liệu mà service này quản lý.
> - Điều này giúp xác định rõ ranh giới trách nhiệm về mặt dữ liệu của service.

**[TÊN_SERVICE_CỦA_BẠN]** bao gồm việc quản lý:
- [TODO: Chức năng/dữ liệu 1, ví dụ: Template thông báo theo loại sự kiện và ngôn ngữ.]
- [TODO: Chức năng/dữ liệu 2, ví dụ: Lịch sử gửi thông báo và trạng thái thành công/thất bại.]
- [TODO: Chức năng/dữ liệu 3, ví dụ: Cấu hình kênh gửi (SMTP, SMS, push) theo loại.]
- [TODO: Chức năng/dữ liệu 4, ví dụ: Sự kiện đã xử lý từ Kafka để đảm bảo idempotency (nếu có).]

---

## 2. Ngoài Phạm Vi (Out of Scope)

> **[HƯỚNG DẪN - MỤC 2: NGOÀI PHẠM VI]**
> - Liệt kê rõ ràng những gì service này KHÔNG quản lý về mặt dữ liệu.
> - Điều này rất quan trọng để tránh nhầm lẫn và chồng chéo trách nhiệm với các service khác.

**[TÊN_SERVICE_CỦA_BẠN]** **không** chịu trách nhiệm quản lý:
- ❌ [TODO: Dữ liệu/Chức năng 1 không thuộc phạm vi, ví dụ: Người nhận thông báo (được lấy từ sự kiện hoặc hệ thống khác).]
- ❌ [TODO: Dữ liệu/Chức năng 2 không thuộc phạm vi, ví dụ: Quản lý user/role (thuộc về user-service).]
- ❌ [TODO: Dữ liệu/Chức năng 3 không thuộc phạm vi, ví dụ: Logging audit chi tiết (nếu đã có service riêng).]

---

## 3. Mục tiêu của Tài liệu Mô hình Dữ liệu

> **[HƯỚNG DẪN - MỤC 3: MỤC TIÊU TÀI LIỆU]**
> - Nêu rõ mục đích của việc tạo ra tài liệu `data-model.md` này.
> - Nhấn mạnh việc tuân thủ các ADRs liên quan đến dữ liệu.

- Trình bày cấu trúc các bảng dữ liệu cốt lõi của **[TÊN_SERVICE_CỦA_BẠN]**.
- Mô tả các ràng buộc dữ liệu (constraints), khóa chính (PK), khóa ngoại (FK), chỉ mục (indexes), và các giá trị ENUM (nếu có).
- Hỗ trợ cho quá trình phát triển backend, viết đặc tả OpenAPI (`openapi.yaml`), thực hiện schema migration (theo [ADR-023 - Schema Migration Strategy](../../../ADR/adr-023-schema-migration-strategy.md)), kiểm thử và bảo trì service.
- Làm nền tảng để đảm bảo tính nhất quán schema với các tài liệu liên quan như `design.md`, `interface-contract.md`.
- Tuân thủ các ADRs liên quan đến quản lý dữ liệu, ví dụ: [ADR-007 - RBAC Architecture](../../../ADR/adr-007-rbac.md), [ADR-027 - Data Management Strategy](../../../ADR/adr-027-data-management-strategy.md), [ADR-030 - Event Schema Governance](../../../ADR/adr-030-event-schema-governance.md) (nếu service xử lý sự kiện).

---

## 4. Sơ đồ ERD (Entity Relationship Diagram)

> **[HƯỚNG DẪN - MỤC 4: SƠ ĐỒ ERD]**
> - **Sơ đồ ERD Sơ bộ (Conceptual ERD):** Cung cấp một cái nhìn tổng quan về các thực thể chính và mối quan hệ cơ bản giữa chúng. Giúp người đọc nhanh chóng nắm bắt được các khối dữ liệu chính.
> - **Sơ đồ ERD Chi tiết (Logical/Physical ERD):** Thể hiện chi tiết hơn với các thuộc tính chính, kiểu dữ liệu gợi ý, PK, FK. Đây là sơ đồ quan trọng cho đội ngũ phát triển.
> - Sử dụng Mermaid để dễ dàng nhúng và cập nhật.
> - Bao gồm ghi chú cho sơ đồ nếu có những điểm cần làm rõ (ví dụ: kiểu dữ liệu đặc biệt, mối quan hệ logic không có FK vật lý).
> - Tham khảo cách `ADR-027` hoặc `notification-service/master/data-model.md (v1.1)` trình bày ERD.

**Sơ đồ ERD sơ bộ**
```mermaid
erDiagram
  // Ví dụ:
  TABLE_A {
    string id PK
    // ...
  }
  TABLE_B {
    string id PK
    string table_a_id FK
    // ...
  }
  TABLE_A ||--o{ TABLE_B : "quan_he_gi_do"
```

**Sơ đồ ERD Chi tiết**

```mermaid
erDiagram
  // Ví dụ từ Notification Service Master:
  notification_templates {
    UUID id PK
    TEXT name
    TEXT type "ENUM: email, sms, push"
    TEXT language
    TEXT trigger_event
    TEXT content
    TIMESTAMPTZ created_at
    TIMESTAMPTZ updated_at
  }

  notification_logs {
    UUID id PK
    UUID template_id FK
    TEXT channel "ENUM: email, sms, push"
    TEXT recipient
    TEXT status "ENUM: queued, sent, failed"
    TEXT error_message
    TIMESTAMPTZ sent_at
  }
  // ... các bảng khác và mối quan hệ ...
  notification_templates ||--o{ notification_logs : "used by"
```

### 🧠 Ghi chú cho Sơ đồ ERD:

  - `[BẢNG_X].[cột_ngoại_khóa]` có thể `NULL` nếu [lý\_do].
  - Mối quan hệ giữa `[BẢNG_Y]` và `[BẢNG_Z]` là mối quan hệ logic, được xử lý ở tầng ứng dụng.
  - Các trường `status`, `type` sử dụng ENUM (xem Phụ lục ENUMs hoặc Mục 13).

-----

## 5\. Chi tiết Từng Bảng (Core Business Tables)

> **[HƯỚNG DẪN - MỤC 5: CHI TIẾT BẢNG NGHIỆP VỤ]**
>
>   - Lặp lại cấu trúc tiểu mục này cho từng bảng nghiệp vụ chính đã được giới thiệu trong ERD.
>   - Mỗi bảng cần có: Mục đích, Câu lệnh `CREATE TABLE` (ví dụ SQL), và Bảng giải thích cột.
>   - Việc cung cấp `CREATE TABLE` SQL là rất quan trọng, giúp làm rõ kiểu dữ liệu, PK, FK, NOT NULL, UNIQUE, DEFAULT, CHECK constraints.
>   - Tham khảo cách `notification-service/master/data-model.md (v1.1)` mô tả chi tiết từng bảng.

### 📌 Bảng: `[tên_bảng_nghiệp_vụ_1]`

#### 🧾 Mục đích

#### 📜 Câu lệnh `CREATE TABLE` (Ví dụ SQL cho PostgreSQL)

```sql
CREATE TABLE [tên_bảng_nghiệp_vụ_1_sql] (
    id [KIỂU_PK] PRIMARY KEY,                          -- 🔑 Mô tả khóa chính
    [tên_cột_2] [KIỂU_DL_SQL_2] NOT NULL,             -- Mô tả cột 2
    [tên_cột_3] [KIỂU_DL_SQL_3] REFERENCES [bảng_tham_chiếu]([cột_tham_chiếu]) ON DELETE [SET NULL/CASCADE/RESTRICT], -- 🔗 Mô tả cột 3 (FK)
    [tên_cột_enum] [KIỂU_TEXT_HOẶC_INT] CHECK ([tên_cột_enum] IN ('VALUE1', 'VALUE2')), -- 🛡️ Ví dụ ENUM
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    -- TODO: Thêm các cột khác
);
```

#### 📋 Giải thích cột

## | Cột           | Kiểu dữ liệu (Logic) | Ràng buộc      | Mô tả ý nghĩa nghiệp vụ                                          | | :------------ | :------------------- | :------------- | :-------------------------------------------------------------- | | `id`          | `[Kiểu_PK_Logic]`    | PK             | [TODO: Mô tả chi tiết]                                          | | `[tên_cột_2]` | `[KiểuDL_Logic_2]`   | NOT NULL       | [TODO: Mô tả chi tiết]                                          | | `[tên_cột_3]` | `[KiểuDL_Logic_3]`   | FK             | [TODO: Mô tả chi tiết, tham chiếu đến bảng/cột nào]             | | `[tên_cột_enum]`| `[Kiểu_ENUM_Logic]`| CHECK          | [TODO: Mô tả, xem định nghĩa ENUM ở Phụ lục/Mục 12 hoặc 13]      | | `created_at`  | `datetime`           | NOT NULL, DEFAULT | Thời điểm tạo bản ghi.                                         | | `updated_at`  | `datetime`           | NOT NULL, DEFAULT | Thời điểm cập nhật cuối cùng (có thể dùng trigger).           |

## 6\. Các bảng phụ trợ (Auxiliary Tables - nếu có)

> **[HƯỚNG DẪN - MỤC 6: BẢNG PHỤ TRỢ]**
>
>   - Mô tả các bảng không phải là thực thể nghiệp vụ chính nhưng cần thiết cho hoạt động của service.
>   - Ví dụ: bảng `processed_events` để đảm bảo idempotency, hoặc các bảng ENUM nếu bạn chọn cách quản lý ENUM bằng bảng (Mục 13).
>   - Tham khảo Mục 7 trong `notification-service/master/data-model.md (v1.1)` cho bảng `processed_events` và Mục 13 cho các bảng ENUM.

### 🔄 Bảng: `processed_events` (Ví dụ - nếu service consume sự kiện)

#### 🧾 Mục đích

#### 📜 Câu lệnh `CREATE TABLE` (Ví dụ SQL)

```sql
CREATE TABLE processed_events (
    event_id UUID PRIMARY KEY,
    consumer_group_name TEXT NOT NULL, -- Hoặc service_name nếu chỉ có 1 consumer trong service này
    processed_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

#### 📋 Giải thích cột

| Cột                   | Kiểu dữ liệu | Ràng buộc     | Mô tả                                                              |
|-----------------------|--------------|----------------|--------------------------------------------------------------------|
| `event_id`            | `UUID`       | PK             | ID sự kiện duy nhất (`metadata.event_id` trong schema sự kiện)    |
| `consumer_group_name` | `TEXT`       | NOT NULL       | Tên nhóm tiêu dùng (nếu có nhiều consumer trong service này)      |
| `processed_at`        | `TIMESTAMPTZ`| DEFAULT now()  | Thời điểm đã xử lý, phục vụ audit hoặc retry tracking             |

-----

## 7\. Indexes & Constraints (Tổng hợp)

> **[HƯỚNG DẪN - MỤC 7: INDEXES & CONSTRAINTS]**
>
>   - Tổng hợp lại các chỉ mục (indexes) và ràng buộc (constraints) quan trọng từ tất cả các bảng.
>   - Điều này giúp DBA hoặc người review có cái nhìn tổng quan nhanh về cách tối ưu hóa và đảm bảo tính toàn vẹn dữ liệu.
>   - Chia nhỏ theo từng bảng.

### `[tên_bảng_1]`

  - **Indexes:**
      - `idx_[tên_bảng_1]_[cột_quan_trọng]`: (`[cột_quan_trọng]`) - Mục đích: [ví dụ: Tìm kiếm nhanh theo cột này]
  - **Constraints:**
      - `UNIQUE([cột_unique_1], [cột_unique_2])`
      - `CHECK ([tên_cột_enum] IN ('VALUE1', 'VALUE2'))` (nếu không dùng bảng ENUM phụ trợ)

### `[tên_bảng_2]`

  - **Indexes:**
      - ...
  - **Constraints:**
      - ...

-----

## 8\. Chính sách Lưu trữ & Xóa dữ liệu (Retention & Data Lifecycle)

> **[HƯỚNG DẪN - MỤC 8: CHÍNH SÁCH LƯU TRỮ & XÓA]**
>
>   - Mô tả chính sách lưu trữ (retention policy) cho các bảng dữ liệu quan trọng, đặc biệt là các bảng log hoặc dữ liệu có vòng đời giới hạn.
>   - Nêu rõ thời gian giữ, lý do, và chiến lược xóa (batch job, partition, v.v.).
>   - Nhấn mạnh việc tuân thủ ADR-024 (Data Anonymization & Retention) và ADR-026 (Hard Delete Policy).
>   - Tham khảo Mục 8 và 9.5 trong `notification-service/master/data-model.md (v1.1)`.

### 🔄 Bảng: `[tên_bảng_log_hoặc_có_retention]`

  - **Thời gian giữ:** [TODO: Ví dụ: 90 ngày, 12 tháng, vĩnh viễn cho đến khi resource chính bị xóa]
  - **Cơ chế xóa:** [TODO: Ví dụ: Batch job định kỳ hàng ngày/tuần, sử dụng Cloud Scheduler + Cloud Function, hoặc partition pruning trong BigQuery/PostgreSQL.]
  - **Lý do:** [TODO: Ví dụ: Giảm dung lượng lưu trữ, tuân thủ quy định, dữ liệu cũ ít giá trị.]

### 🔒 Lưu ý về bảo mật & audit:

  - Dữ liệu bị xóa theo chính sách này có thể không khôi phục được (trừ khi có backup riêng).
  - Nếu cần lưu trữ lâu dài cho audit, xem xét việc đẩy dữ liệu/log sang một hệ thống lưu trữ dài hạn (cold storage) hoặc Audit Logging Service trước khi xóa.
  - Tuân thủ [suspicious link removed] và [suspicious link removed].

-----

## 9\. Phân quyền truy cập dữ liệu (Data Access Control)

> **[HƯỚNG DẪN - MỤC 9: PHÂN QUYỀN TRUY CẬP DỮ LIỆU]**
>
>   - Mô tả cách service này kiểm soát quyền truy cập vào dữ liệu mà nó quản lý, đặc biệt nếu có các logic phân quyền phức tạp ở tầng dữ liệu.
>   - Thường thì việc phân quyền API được xử lý ở API Gateway và tầng ứng dụng của service. Tuy nhiên, nếu có các policy ở mức CSDL (ví dụ: Row-Level Security), cần mô tả ở đây.
>   - Tham chiếu đến ADR-007 (RBAC).

  - Việc kiểm soát truy cập vào dữ liệu của **[TÊN\_SERVICE\_CỦA\_BẠN]** được thực hiện chủ yếu ở tầng API, thông qua cơ chế RBAC được định nghĩa trong [suspicious link removed] và được thực thi bởi API Gateway và các module kiểm tra quyền bên trong service.
  - Các API sẽ yêu cầu các `permission_code` phù hợp (xem `interface-contract.md`).
  - Không có các chính sách Row-Level Security (RLS) phức tạp được áp dụng trực tiếp tại CSDL ở phiên bản hiện tại.
  - Truy cập CSDL trực tiếp từ bên ngoài service là không được phép và được kiểm soát bởi cấu hình mạng và IAM.

-----

## 10\. Mở rộng trong tương lai (Future Considerations)

> **[HƯỚNG DẪN - MỤC 10: MỞ RỘNG TRONG TƯƠNG LAI]**
>
>   - Nêu các điểm mà mô hình dữ liệu này có thể cần được mở rộng hoặc thay đổi trong tương lai để đáp ứng các yêu cầu mới.
>   - Ví dụ: hỗ trợ đa ngôn ngữ, thêm các loại thực thể mới, chuẩn bị cho AI.
>   - Điều này cho thấy sự nhìn xa trông rộng trong thiết kế.

  - **[ĐIỂM\_MỞ\_RỘNG\_1]:** [TODO: Mô tả, ví dụ: Hỗ trợ đa ngôn ngữ cho các trường text trong `notification_templates` bằng cách thêm cột `language_code` hoặc tách ra bảng localization.]
  - **[ĐIỂM\_MỞ\_RỘNG\_2]:** [TODO: Mô tả, ví dụ: Chuẩn bị schema của `notification_logs` để dễ dàng đưa vào Data Warehouse phục vụ phân tích AI về hiệu quả thông báo.]
  - **[ĐIỂM\_MỞ\_RỘNG\_3]:** [TODO: Mô tả]

-----

## 11\. ENUMs (Định nghĩa tập trung)

> **[HƯỚNG DẪN - MỤC 11: ENUMS]**
>
>   - **Cách 1 (Khuyến nghị cho tính linh hoạt và quản lý UI): Sử dụng Bảng Phụ Trợ cho ENUMs.**
>       - Tạo các bảng riêng để lưu trữ các giá trị ENUM, cùng với mô tả, label cho UI, màu sắc, icon, v.v.
>       - Các bảng nghiệp vụ sẽ có FOREIGN KEY tham chiếu đến các bảng ENUM này.
>       - Cung cấp `CREATE TABLE` và `INSERT INTO` (dữ liệu ban đầu) cho các bảng ENUM này.
>       - Xem Mục 13 trong `notification-service/master/data-model.md (v1.2)` làm ví dụ mẫu mực.
>   - **Cách 2 (Đơn giản hơn, ít linh hoạt hơn): Liệt kê ENUMs.**
>       - Liệt kê tất cả các giá trị ENUM được sử dụng trong các bảng của service này.
>       - Với mỗi ENUM, nêu rõ nó được dùng cho trường nào, bảng nào, và ý nghĩa của từng giá trị.
>       - Nếu dùng cách này, các ràng buộc `CHECK` trong `CREATE TABLE` SQL sẽ đảm bảo tính toàn vẹn.

-----

### 📑 ENUM dưới dạng bảng phụ trợ (Recommended for UI flexibility)

> Việc quản lý các giá trị ENUM bằng bảng phụ trợ giúp tăng tính linh hoạt, dễ cập nhật, hỗ trợ dashboard quản trị, và cho phép mapping metadata phong phú (label, màu sắc, icon) cho UI mà không cần hard-code.

#### 📄 `[tên_bảng_enum_1]` (Ví dụ: `[service_prefix]_statuses`)

```sql
CREATE TABLE [tên_bảng_enum_1_sql] (
  code TEXT PRIMARY KEY,          -- Giá trị ENUM thực tế, dùng trong code và CSDL
  label TEXT NOT NULL,            -- Nhãn hiển thị cho UI
  description TEXT,               -- Mô tả chi tiết (tùy chọn)
  color TEXT,                     -- Mã màu cho UI (tùy chọn, ví dụ: hex)
  icon TEXT,                      -- Tên icon cho UI (tùy chọn)
  is_error BOOLEAN DEFAULT false  -- (Tùy chọn) Đánh dấu nếu là trạng thái lỗi
);

-- TODO: Thêm các câu lệnh INSERT INTO cho các giá trị ENUM ban đầu.
-- Ví dụ:
-- INSERT INTO [tên_bảng_enum_1_sql] (code, label, color, is_error) VALUES
--  ('VALUE_A', 'Label cho Value A', 'green', false),
--  ('VALUE_B', 'Label cho Value B', 'red', true);
```

> Bảng này sẽ thay thế `CHECK([cột_trạng_thái] IN ...)` trong bảng nghiệp vụ `[TÊN_BẢNG_NGHIỆP_VỤ_LIÊN_QUAN]`.
> Cột `[cột_trạng_thái]` trong bảng nghiệp vụ đó sẽ có `FOREIGN KEY (status) REFERENCES [tên_bảng_enum_1_sql](code)`.

-----

-----

## 12\. Phụ lục Khác (Tùy chọn)

> **[HƯỚNG DẪN - MỤC 12: PHỤ LỤC KHÁC]**
>
>   - **Chiến lược Kiểm thử Liên quan đến Mô hình Dữ liệu:** (Rất khuyến khích) Mô tả cách mô hình dữ liệu này sẽ được kiểm thử (Unit test cho ràng buộc, Integration test cho tính toàn vẹn, v.v.). Tham khảo Phụ lục E trong `user-service/master/data-model.md` hoặc Phụ lục D trong `auth-service/master/data-model.md (v1.1)`.
>   - **Danh sách Sự kiện Phát ra (nếu có):** Nếu service phát ra các sự kiện liên quan đến thay đổi dữ liệu, liệt kê chúng ở đây với payload mẫu. (Tham khảo Mục 9 Phụ lục B trong `notification-service/master/data-model.md (v1.1)`).
>   - Các thông tin bổ sung khác mà bạn thấy cần thiết.

### 📘 Phụ lục A – Chiến lược Kiểm thử Liên quan đến Mô hình Dữ liệu

#### 1\. Mục tiêu

Đảm bảo các bảng dữ liệu trong **[TÊN\_SERVICE\_CỦA\_BẠN]** được triển khai đúng cấu trúc, tuân thủ ràng buộc, và có thể mở rộng an toàn.

#### 2\. Các cấp độ kiểm thử

| Cấp độ kiểm thử | Mục tiêu | Công cụ | Ghi chú |
|----------------|---------|--------|--------|
| ✅ Unit Test | [TODO] | [TODO] | [TODO] |
| ✅ Integration Test | [TODO] | [TODO] | [TODO] |
| ✅ Migration Test | [TODO] | [TODO] | [TODO] |
| ✅ Constraint Test | [TODO] | [TODO] | [TODO] |

#### 3\. Kịch bản kiểm thử tiêu biểu

**Bảng `[tên_bảng_1]`**

  - ✅ [Kịch bản 1]
  - ✅ [Kịch bản 2]

#### 4\. Tuân thủ quy trình CI/CD

  - Mỗi thay đổi schema phải đi kèm file migration và unit/integration test.

#### 5\. Kết luận

Việc kiểm thử mô hình dữ liệu là quan trọng để đảm bảo **[TÊN\_SERVICE\_CỦA\_BẠN]** vận hành ổn định.

### 📘 Phụ lục B – Danh sách Sự kiện Phát ra từ Service (Tổng hợp)

| Sự kiện                          | Trigger (Hành động/Bảng bị ảnh hưởng)       | Mục đích chính                                     |
| :------------------------------- | :----------------------------------------- | :------------------------------------------------- |
| `[emitted_event_1.v1]`           | [TODO: Tạo bản ghi mới trong `[TÊN_BẢNG_X]`] | [TODO: Thông báo cho các service khác về việc tạo mới.] |

-----

## 13\. 📚 Liên kết Tài liệu (Related Documents)

> **[HƯỚNG DẪN - MỤC 13: LIÊN KẾT TÀI LIỆU]**
>
>   - Cung cấp các liên kết đến các tài liệu quan trọng khác mà người đọc ADR này nên tham khảo.
>   - Bao gồm các file chi tiết khác của chính service này, các ADRs nền tảng, và các tài liệu kiến trúc tổng thể.

  * [`design.md`](https://www.google.com/search?q=./design.md) (Thiết kế tổng quan của service này)
  * [`interface-contract.md`](https://www.google.com/search?q=./interface-contract.md) (Hợp đồng Giao diện API của service này)
  * [`openapi.yaml`](https://www.google.com/search?q=./openapi.yaml) (Đặc tả OpenAPI của service này)
 

<!-- end list -->

```

---

Bill hy vọng template chi tiết và toàn diện này sẽ giúp bạn và đội ngũ tạo ra các tài liệu `data-model.md` thật sự chất lượng, góp phần vào sự thành công của dự án dx-vas!
```