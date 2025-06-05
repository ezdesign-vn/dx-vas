---
title: [TÊN_SERVICE_CỦA_BẠN] - Data Model
version: "1.0"
last_updated: ["YYYY-MM-DD"]
author: "DX VAS Team"
reviewed_by: "Stephen Le"
---
# 🗃️ [TÊN_SERVICE_CỦA_BẠN] - Data Model

> **[HƯỚNG DẪN SỬ DỤNG TEMPLATE NÀY:]**
> 1. Sao chép toàn bộ nội dung file này vào một file `data-model.md` mới trong thư mục service của bạn.
> 2. Tìm và thay thế tất cả các placeholder có dạng `[PLACEHOLDER]` hoặc các comment `TODO:` bằng thông tin cụ thể của service bạn.
> 3. Xóa các khối hướng dẫn (như khối này) hoặc các comment không cần thiết sau khi đã điền thông tin.
> 4. Đảm bảo tài liệu của bạn rõ ràng, chi tiết và tuân thủ "Checklist Tiêu Chuẩn 5★ cho File data-model.md".
> 5. Luôn tham chiếu đến các tài liệu liên quan như `design.md`, `interface-contract.md`, `openapi.yaml` và các ADRs.

## 1. Giới thiệu

> **[HƯỚNG DẪN - MỤC 1: GIỚI THIỆU]**
> - Nêu rõ tên service và vai trò của tài liệu mô hình dữ liệu này.
> - Mô tả ngắn gọn bối cảnh hoạt động của service (ví dụ: multi-tenant, core service, sub service).
> - Liệt kê các trách nhiệm chính của service liên quan đến dữ liệu.
> - Ví dụ từ User Service Master: "Tài liệu này mô tả chi tiết mô hình dữ liệu của User Service Master... Service này chịu trách nhiệm quản lý định danh toàn cục người dùng, thông tin tenant, và mẫu vai trò/quyền toàn cục (RBAC templates)."

Tài liệu này mô tả chi tiết mô hình dữ liệu của **[TÊN_SERVICE_CỦA_BẠN]**. Service này là một thành phần [TODO: mô tả vai trò của service, ví dụ: cốt lõi, phụ trợ] trong hệ thống `dx-vas`, hoạt động theo kiến trúc [TODO: ví dụ: multi-tenant, event-driven].

**[TÊN_SERVICE_CỦA_BẠN]** chịu trách nhiệm quản lý các loại dữ liệu chính sau:
-   [TODO: Loại dữ liệu 1, ví dụ: Định danh người dùng toàn cục (`users_global`)]
-   [TODO: Loại dữ liệu 2, ví dụ: Thông tin tenant (`tenants`)]
-   [TODO: Loại dữ liệu 3, ví dụ: Các phiên làm việc (`auth_sessions`)]

Mô hình dữ liệu này là cơ sở cho việc phát triển backend, định nghĩa API, thực hiện migration cơ sở dữ liệu, và đảm bảo tính nhất quán dữ liệu trong service.

## 2. Phạm vi Dữ liệu Quản lý (Scope)

> **[HƯỚNG DẪN - MỤC 2: PHẠM VI]**
> Liệt kê cụ thể hơn các nhóm chức năng hoặc các loại dữ liệu mà service này quản lý.

**[TÊN_SERVICE_CỦA_BẠN]** bao gồm việc quản lý:
-   [TODO: Chức năng/dữ liệu 1, ví dụ: Người dùng toàn hệ thống (`users_global`).]
-   [TODO: Chức năng/dữ liệu 2, ví dụ: Danh sách tenant (`tenants`) và trạng thái của tenant.]
-   [TODO: Chức năng/dữ liệu 3, ví dụ: Việc gán người dùng vào tenant (`user_tenant_assignments`).]
-   [TODO: Chức năng/dữ liệu 4, ví dụ: Phát sự kiện liên quan đến thay đổi dữ liệu.]

## 3. Ngoài Phạm Vi (Out of Scope)

> **[HƯỚNG DẪN - MỤC 3: NGOÀI PHẠM VI]**
> Liệt kê rõ ràng những gì service này KHÔNG quản lý về mặt dữ liệu để tránh nhầm lẫn.

**[TÊN_SERVICE_CỦA_BẠN]** **không** chịu trách nhiệm quản lý:
-   ❌ [TODO: Dữ liệu/Chức năng 1, ví dụ: Quản lý người dùng nội bộ của từng tenant (thuộc về Sub User Service).]
-   ❌ [TODO: Dữ liệu/Chức năng 2, ví dụ: Xử lý xác thực đăng nhập (thuộc về Auth Services).]
-   ❌ [TODO: Dữ liệu/Chức năng 3, ví dụ: Dữ liệu nghiệp vụ chi tiết của từng tenant (học phí, điểm số...).]

## 4. Mục tiêu của Tài liệu Mô hình Dữ liệu

> **[HƯỚNG DẪN - MỤC 4: MỤC TIÊU TÀI LIỆU]**
> Nêu rõ mục đích của việc tạo ra tài liệu này.

-   Trình bày cấu trúc các bảng dữ liệu cốt lõi của **[TÊN_SERVICE_CỦA_BẠN]**.
-   Mô tả các ràng buộc dữ liệu (constraints), khóa chính/ngoại, chỉ mục (indexes).
-   Hỗ trợ cho quá trình phát triển backend, viết đặc tả OpenAPI, thực hiện schema migration, kiểm thử và bảo trì service.
-   Làm nền tảng để đảm bảo tính nhất quán schema với các tài liệu liên quan như `design.md`, `interface-contract.md`, `openapi.yaml`, và các ADRs của hệ thống (ví dụ: [ADR-007 RBAC Strategy], [ADR-027 Data Management Strategy]).

---

## 5. Sơ đồ ERD (Entity Relationship Diagram)

> **[HƯỚNG DẪN - MỤC 5: SƠ ĐỒ ERD]**
> - Cung cấp một sơ đồ ERD trực quan thể hiện tất cả các bảng chính của service và mối quan hệ giữa chúng.
> - Nên sử dụng Mermaid để dễ dàng nhúng và cập nhật.
> - Bao gồm các thực thể, thuộc tính chính, khóa chính (PK), khóa ngoại (FK), và các loại quan hệ (1-1, 1-n, n-n).
> - Thêm ghi chú cho ERD nếu có những điểm cần làm rõ (ví dụ: kiểu dữ liệu đặc biệt trong Mermaid, mối quan hệ logic).
> - Ví dụ từ User Service Master đã rất tốt.

```mermaid
erDiagram
    // TODO: Vẽ ERD cho service của bạn tại đây.
    // Ví dụ:
    TABLE_A {
        string id PK
        string field_a1
        string field_a2
    }
    TABLE_B {
        string id PK
        string table_a_id FK
        string field_b1
    }
    TABLE_A ||--o{ TABLE_B : "có thể có nhiều"

    // Ví dụ từ User Service Master:
    /*
    USERS_GLOBAL {
        UUID user_id PK
        TEXT full_name
        TEXT email
        TEXT auth_provider
        // ... các trường khác
    }
    TENANTS {
        TEXT tenant_id PK
        TEXT tenant_name
        TEXT status
        // ... các trường khác
    }
    USER_TENANT_ASSIGNMENTS {
        UUID id PK
        UUID user_id_global FK
        TEXT tenant_id FK
        TEXT assignment_status
        // ... các trường khác
    }
    USERS_GLOBAL ||--o{ USER_TENANT_ASSIGNMENTS : "được gán vào"
    TENANTS ||--o{ USER_TENANT_ASSIGNMENTS : "có người dùng được gán"
    */
```

> 💡 **Ghi chú cho Sơ đồ ERD:**
>
> > >   - Mối quan hệ giữa `[BẢNG_X]` và `[BẢNG_Y]` là mối quan hệ logic, được xử lý ở tầng ứng dụng, không có bảng join vật lý.
>
>   - Kiểu dữ liệu `TEXT[]` trong PostgreSQL được biểu diễn là `STRING[]` (hoặc `TEXT`) trong Mermaid.
>   - Các ràng buộc `UNIQUE` không được thể hiện trực tiếp trong Mermaid ERD này nhưng được định nghĩa trong chi tiết bảng hoặc script SQL.

-----

## 6\. Chi tiết Từng Bảng (Table Details)

> **[HƯỚNG DẪN - MỤC 6: CHI TIẾT BẢNG]**
>
>   - Lặp lại cấu trúc tiểu mục này cho từng bảng đã được giới thiệu trong ERD.
>   - Mỗi bảng cần có: Mục đích, Câu lệnh `CREATE TABLE` (ví dụ SQL), Bảng giải thích cột, và phần Liên kết & Chỉ số.
>   - Tham khảo cách User Service Master mô tả bảng `users_global` rất chi tiết.

### 📌 Bảng: `[TÊN_BẢNG_1]`

#### 🧾 Mục đích

#### 📜 Câu lệnh `CREATE TABLE` (Ví dụ SQL cho PostgreSQL)

```sql
CREATE TABLE [tên_bảng_1_sql] (
    [tên_cột_1] [KIỂU_DL_SQL_1] PRIMARY KEY,          -- 🔑 Mô tả cột 1 (PK)
    [tên_cột_2] [KIỂU_DL_SQL_2] NOT NULL,             -- Mô tả cột 2
    [tên_cột_3] [KIỂU_DL_SQL_3] REFERENCES [bảng_tham_chiếu]([cột_tham_chiếu]) ON DELETE [CASCADE/RESTRICT/SET NULL], -- 🔗 Mô tả cột 3 (FK)
    [tên_cột_4] [KIỂU_DL_SQL_4] UNIQUE,               -- Mô tả cột 4 (Unique)
    [tên_cột_5] [KIỂU_DL_SQL_5] DEFAULT [giá_trị_mặc_định], -- Mô tả cột 5 (Default)
    [tên_cột_6] [KIỂU_DL_SQL_6] CHECK ([điều_kiện_check]), -- 🛡️ Mô tả cột 6 (Check)
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

#### 🧩 Giải thích cột

| Cột           | Kiểu dữ liệu (Logic) | Ràng buộc      | Mô tả ý nghĩa nghiệp vụ                                          |
| :------------ | :------------------- | :------------- | :-------------------------------------------------------------- |
| `[tên_cột_1]` | [KiểuDL\_Logic\_1]     | PK             | [Mô tả chi tiết]                                                |
| `[tên_cột_2]` | [KiểuDL\_Logic\_2]     | NOT NULL       | [Mô tả chi tiết]                                                |
| `[tên_cột_3]` | [KiểuDL\_Logic\_3]     | FK             | [Mô tả chi tiết, tham chiếu đến bảng/cột nào]                   |
| `[tên_cột_4]` | [KiểuDL\_Logic\_4]     | UNIQUE         | [Mô tả chi tiết]                                                |
| `[tên_cột_5]` | [KiểuDL\_Logic\_5]     | DEFAULT        | [Mô tả chi tiết]                                                |
| `[tên_cột_6]` | [KiểuDL\_Logic\_6]     | CHECK          | [Mô tả chi tiết]                                                |
| `created_at`  | datetime             | NOT NULL, DEFAULT | Thời điểm tạo bản ghi.                                           |
| `updated_at`  | datetime             | NOT NULL, DEFAULT | Thời điểm cập nhật cuối cùng (có thể dùng trigger để tự động cập nhật). |

#### 🔗 Liên kết, Chỉ mục & Hành vi Cascade

  - **Liên kết chính:**
      - Cột `[tên_cột_3]` liên kết đến bảng `[BẢNG_THAM_CHIẾU]`.
      - [TODO: Mô tả các liên kết quan trọng khác.]
  - **Chỉ mục (Indexes) đề xuất:**
      - PK: `([tên_cột_1])` (tự động tạo index).
      - FK: `([tên_cột_3])` (thường tự động tạo index).
      - UNIQUE: `([tên_cột_4])` (tự động tạo index).
      - [TODO: Index trên cột `[tên_cột_X]` để tối ưu truy vấn [loại\_truy\_vấn\_thường\_xuyên].]
  - **Hành vi Cascade:**
      - `ON DELETE [CASCADE/RESTRICT/SET NULL]` cho khóa ngoại `[tên_cột_3]`: [Giải thích lý do chọn hành vi này].
      - [TODO: Mô tả các hành vi cascade khác nếu có.]

#### 📤 Sự kiện phát ra (nếu có)

  - `[tên_bảng_1]_created`: Khi một bản ghi mới được tạo.
  - `[tên_bảng_1]_updated`: Khi một bản ghi được cập nhật.
  - `[tên_bảng_1]_deleted`: Khi một bản ghi bị xóa (soft delete hoặc hard delete).

-----

## 7\. Các bảng phụ trợ (Auxiliary Tables - nếu có)

> **[HƯỚN DẪN - MỤC 7: BẢNG PHỤ TRỢ]**
>
>   - Mô tả các bảng không phải là thực thể nghiệp vụ chính nhưng cần thiết cho hoạt động của service.
>   - Ví dụ: bảng `processed_events` để đảm bảo idempotency, bảng log audit nội bộ (nếu không dùng service audit riêng).
>   - Tham khảo User Service Master đã có bảng `processed_events`.

### 🔄 Bảng: `processed_events`

#### 📌 Mục đích

Ghi lại các `event_id` đã được xử lý từ message queue (ví dụ: Kafka, Pub/Sub) để đảm bảo tính idempotent, tránh xử lý trùng lặp sự kiện.

```sql
CREATE TABLE processed_events (
    event_id UUID PRIMARY KEY,              -- 🔑 ID duy nhất của sự kiện (từ metadata của message)
    consumer_group_name TEXT NOT NULL,      -- 🧭 Tên của consumer group hoặc service đã xử lý
    processed_at TIMESTAMPTZ DEFAULT now() NOT NULL -- ⏱️ Thời điểm xử lý thành công
);
```

#### 📋 Giải thích

| Cột                   | Kiểu dữ liệu | Ý nghĩa                                                           |
| :-------------------- | :----------- | :---------------------------------------------------------------- |
| `event_id`            | UUID         | ID duy nhất của sự kiện.                                          |
| `consumer_group_name` | TEXT         | Tên của consumer group/service đã xử lý (hữu ích nếu có nhiều consumer). |
| `processed_at`        | TIMESTAMPTZ  | Thời điểm xử lý thành công.                                      |

-----

## 8\. Phụ lục (Appendices)

> **[HƯỚNG DẪN - MỤC 8: PHỤ LỤC]**
>
>   - Cung cấp các thông tin bổ sung giúp làm rõ mô hình dữ liệu.
>   - Bao gồm: Các Index quan trọng (tổng hợp lại), Ràng buộc đặc biệt, Danh sách sự kiện phát ra (tổng hợp), Định nghĩa ENUMs, Chiến lược kiểm thử liên quan đến data model, và Liên kết tài liệu.
>   - Tham khảo các phụ lục A, B, C, D, E, F trong file `data-model.md` của User Service Master.

### 📘 Phụ lục A – Các Index quan trọng (Tổng hợp)

| Bảng          | Cột(s) được Index                | Loại Index     | Mục đích                                |
| :------------ | :------------------------------- | :------------- | :-------------------------------------- |
| `[tên_bảng_1]`| `([tên_cột_pk])`                 | PRIMARY KEY    | Truy cập nhanh theo khóa chính.         |
| `[tên_bảng_1]`| `([tên_cột_unique])`             | UNIQUE INDEX   | Đảm bảo tính duy nhất.                 |
| `[tên_bảng_1]`| `([tên_cột_fk])`                 | INDEX          | Tối ưu JOIN và truy vấn theo khóa ngoại.|
| `[tên_bảng_2]`| `([tên_cột_cho_filter_nhanh])`    | INDEX          | Tối ưu các điều kiện WHERE thường gặp. |

### 📘 Phụ lục B – Ràng buộc đặc biệt và Logic Nghiệp vụ

  - [TODO: Ràng buộc 1, ví dụ: Cột `users_global.email` chỉ là UNIQUE trong phạm vi `auth_provider`.]
  - [TODO: Ràng buộc 2, ví dụ: Một `Order` chỉ có thể chuyển sang trạng thái `SHIPPED` nếu đã ở trạng thái `PAID`.]

### 📘 Phụ lục C – Danh sách Sự kiện Phát ra từ Service (Tổng hợp)

| Sự kiện                          | Trigger (Hành động/Bảng bị ảnh hưởng)       | Mục đích chính                                     |
| :------------------------------- | :----------------------------------------- | :------------------------------------------------- |
| `[tên_bảng_1]_created`           | Tạo bản ghi mới trong `[TÊN_BẢNG_1]`         | [Thông báo cho các service khác về việc tạo mới.] |
| `[tên_bảng_1]_updated`           | Cập nhật bản ghi trong `[TÊN_BẢNG_1]`        | [Thông báo về sự thay đổi.]                       |
| `[tên_bảng_2]_status_changed`    | Thay đổi trường `status` trong `[TÊN_BẢNG_2]` | [Thông báo về thay đổi trạng thái.]                |

### 📘 Phụ lục D – Enum và Giá trị Đặc biệt

  - **`[tên_trường_enum_1]`** (Bảng: `[TÊN_BẢNG_X]`):
      - `VALUE_1_A`: [Mô tả ý nghĩa của VALUE\_1\_A]
      - `VALUE_1_B`: [Mô tả ý nghĩa của VALUE\_1\_B]
  - **`[tên_trường_enum_2]`** (Bảng: `[TÊN_BẢNG_Y]`):
      - `VALUE_2_X`: [Mô tả ý nghĩa của VALUE\_2\_X]
      - `VALUE_2_Y`: [Mô tả ý nghĩa của VALUE\_2\_Y]

### 📘 Phụ lục E – Chiến lược Kiểm thử Liên quan đến Mô hình Dữ liệu

#### 🔍 1. Kiểm thử mức Cơ sở dữ liệu (Database-level)

| Loại kiểm thử             | Mô tả                                                                 |
| :------------------------- | :-------------------------------------------------------------------- |
| ✅ Ràng buộc PK/FK         | Đảm bảo không thể insert/update dữ liệu vi phạm khóa chính/ngoại.   |
| ✅ Ràng buộc UNIQUE        | Kiểm thử các cột có ràng buộc UNIQUE không bị trùng lặp giá trị.        |
| ✅ Enum/Constraint logic  | Kiểm thử giá trị hợp lệ của các cột ENUM hoặc có CHECK constraint.     |
| ✅ Trigger (nếu có)        | Kiểm thử logic của các trigger (ví dụ: tự động cập nhật `updated_at`). |

#### 🔄 2. Kiểm thử Tính toàn vẹn Dữ liệu Xuyên suốt (Integration Data Consistency)

| Tình huống kiểm thử                       | Mong đợi                                                                |
| :---------------------------------------- | :----------------------------------------------------------------------- |
| [TODO: Kịch bản nghiệp vụ 1, ví dụ: Tạo User mới → Gán vào Tenant] | [TODO: Dữ liệu trong các bảng liên quan (`users_global`, `user_tenant_assignments`) phải nhất quán, sự kiện được phát ra chính xác.] |
| [TODO: Kịch bản nghiệp vụ 2, ví dụ: Cập nhật Template RBAC]       | [TODO: Dữ liệu trong bảng template được cập nhật, sự kiện được phát ra.]       |
| [TODO: Kịch bản nghiệp vụ 3, ví dụ: Xử lý lại event đã xử lý (idempotency)] | [TODO: Dữ liệu không bị thay đổi/tạo mới một cách không mong muốn.]          |

#### ⚙️ 3. Kiểm thử với Dữ liệu Mẫu

| Tên tập dữ liệu         | Mô tả                                                                    |
| :---------------------- | :----------------------------------------------------------------------- |
| `[test_data_set_1].json`| [TODO: Mô tả, ví dụ: Dữ liệu cho một User với nhiều assignments khác nhau.] |
| `[test_data_set_2].yaml`| [TODO: Mô tả, ví dụ: Cấu hình RBAC template phức tạp.]                     |

#### 🛡️ 4. Kiểm thử Bảo mật Dữ liệu (Security-focused DB tests - nếu có logic phức tạp)

| Loại kiểm thử                        | Mô tả                                                                   |
| :---------------------------------- | :---------------------------------------------------------------------- |
| [TODO: Kịch bản 1, ví dụ: Truy cập dữ liệu trái phép giữa các tenant (nếu mô hình có tenant\_id ở nhiều bảng)] | [TODO: Đảm bảo query luôn có điều kiện lọc đúng theo tenant\_id hoặc các ràng buộc bảo mật khác.] |
| [TODO: Kịch bản 2, ví dụ: SQL Injection (nếu có xử lý query SQL động không an toàn)] | [TODO: Kiểm tra các input để đảm bảo không có lỗ hổng SQL Injection.]     |

#### 📂 5. Gợi ý Công cụ Hỗ trợ

  - **Migration Tool:** [TODO: Ví dụ: Alembic, Prisma Migrate, Liquibase] (Tuân thủ ADR-023).
  - **DB Unit/Integration Testing:** [TODO: Ví dụ: pgTAP, DBUnit, pytest-postgresql, testcontainers].
  - **Event Testing (nếu có):** [TODO: Ví dụ: Mock Pub/Sub, Kafka Test, Log capture].

#### 📘 Tham chiếu chéo

  - [Thiết kế tổng quan (`design.md`)](./design.md) – Mục "Chiến lược Test"
  - [Đặc tả OpenAPI (`openapi.yaml`)](./openapi.yaml) – Để mock các API endpoint và kiểm thử dữ liệu trả về.
  - [liên kết đáng ngờ đã bị xóa] (Nếu có liên quan đến việc ghi log audit từ dữ liệu).

-----

### 📘 Phụ lục F – Liên kết Tài liệu

  - [Thiết kế tổng quan của Service (`design.md`)](./design.md)
  - [Hợp đồng Giao diện API (`interface-contract.md`)](./interface-contract.md)
  - [Đặc tả OpenAPI (`openapi.yaml`)](./openapi.yaml)

-----
