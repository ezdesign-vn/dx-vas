---
id: adr-029-report-template-schema
title: "ADR-029 - Cấu trúc chuẩn cho Report Template trong Reporting Service"
status: "accepted"
author: "DX VAS Platform Team"
date: "2025-06-03"
tags: [reporting, template, dx-vas, multi-tenant, schema]
---

# ADR-029: Cấu trúc chuẩn cho Report Template trong Reporting Service

## 1. 📌 Bối cảnh (Context)

Reporting Service trong hệ thống DX-VAS cần hỗ trợ nhiều loại báo cáo khác nhau, mỗi báo cáo có thể có cấu trúc tham số, quyền truy cập, truy vấn dữ liệu, và kiểu hiển thị khác nhau. Các báo cáo này cần được định nghĩa theo cách có thể quản lý tập trung, cấu hình lại dễ dàng, phân quyền rõ ràng, và an toàn cho truy vấn dữ liệu.

Hiện chưa có định nghĩa chuẩn về một Report Template – dẫn đến việc khó bảo trì, kiểm soát quyền, và tái sử dụng. Ngoài ra, trong tương lai, AI Agent sẽ cần sử dụng cấu trúc này để tự động sinh hoặc gợi ý báo cáo – do đó việc chuẩn hóa là bắt buộc.

---

## 2. 🧠 Quyết định (Decision)

Chúng tôi quyết định chuẩn hóa **Report Template** dưới dạng một schema có cấu trúc, lưu trữ trong cơ sở dữ liệu của `Reporting Service`, phục vụ như nguồn chính để sinh báo cáo.

Mỗi template sẽ bao gồm metadata, tham số đầu vào, định nghĩa view hoặc truy vấn, cấu trúc phân quyền, và hướng dẫn hiển thị.

---

## 3. 🧱 Chi tiết Thiết kế / Giải pháp (Design / Solution Details)

### 3.1. Cấu trúc Report Template

```json
{
  "id": "usage-by-tenant",
  "name": "Số lượng đăng nhập theo tenant",
  "description": "Báo cáo tổng hợp số lượng đăng nhập theo từng tenant theo thời gian",
  "input_parameters": [
  {
    "name": "start_date",
    "type": "date",
    "required": true,
    "description": "Ngày bắt đầu truy vấn",
    "default_value": null,
    "validation_rules": {
      "format": "YYYY-MM-DD"
    }
  },
  {
    "name": "end_date",
    "type": "date",
    "required": true,
    "description": "Ngày kết thúc truy vấn",
    "default_value": null,
    "validation_rules": {
      "format": "YYYY-MM-DD"
    }
  },
  {
    "name": "tenant_id",
    "type": "string",
    "required": false,
    "description": "Mã tenant cần lọc",
    "default_value": null,
    "validation_rules": {
      "maxLength": 64,
      "pattern": "^[a-zA-Z0-9_-]+$",
      "enum": ["tenant_01", "tenant_02", "tenant_03"]
    }
  },
  {
    "name": "max_results",
    "type": "integer",
    "required": false,
    "description": "Giới hạn số dòng trả về",
    "default_value": 100,
    "validation_rules": {
      "minimum": 10,
      "maximum": 1000
    }
  }
]

```

**Giải thích bổ sung:**
- `data_view`: Là tên của một view hoặc data mart đã được predefined trong Data Warehouse. Truy vấn trong `query_template` **chỉ được phép hoạt động trong phạm vi view này** để đảm bảo tính an toàn và hiệu năng cao.
- `version`: Các template khi chỉnh sửa sẽ không cập nhật inplace, mà sẽ tạo thành **bản mới với version tăng dần**. Các cấu hình báo cáo cá nhân (`Saved Report Config`) sẽ **tham chiếu version cụ thể**, đảm bảo sự ổn định theo thời gian.
- `enum` này được **Superadmin Webapp** lấy động từ API `GET /tenants` của **User Service Master** để hiển thị cho người dùng chọn

### 3.2. Luồng sử dụng

1. Superadmin Webapp gọi API `GET /report-templates` để lấy danh sách template.
2. Người dùng chọn template → client hiển thị form tương ứng với `input_parameters`.
3. Gửi yêu cầu `GET /reports/{template_id}` kèm theo tham số → hệ thống validate:
   - Loại tham số đúng
   - Giá trị hợp lệ theo `validation_rules`
   - Người dùng có đủ `required_permission`
4. Reporting Service sinh truy vấn từ `query_template` → chạy trên Data Warehouse → trả kết quả.

### 3.3. Phân quyền và scope

- Mỗi template chứa `required_permission`, có thể kết hợp với RBAC của người dùng để kiểm tra truy cập.
- `scope` có thể là `global` (toàn hệ thống) hoặc `per-tenant`.

### 3.4. DSL và kiểm tra an toàn

- `query_template` là một template đơn giản (Jinja hoặc tương đương), chỉ cho phép:
  - Chèn tham số an toàn (`{{param}}`)
  - Câu lệnh `if`, `else`, `default`
- Không cho phép lệnh SQL động như `ORDER BY {{column}}` không kiểm soát.
- Có cơ chế static validation trước khi chạy truy vấn.

### 3.5. Ghi chú về Saved Report Config (liên quan)

- Mỗi người dùng có thể lưu một hoặc nhiều cấu hình báo cáo (`Saved Report Config`) bao gồm:
  - `template_id`
  - `version` của template
  - Các giá trị tham số cụ thể đã chọn (`input_parameters`)
  - Tùy chọn hiển thị (chart/table), filter mặc định...
- Điều này đảm bảo nếu template thay đổi về sau, người dùng vẫn có thể truy cập lại bản báo cáo cũ với logic ổn định.

---

## 4. ✅ Hệ quả (Consequences)

### 4.1. Ưu điểm
- ✅ Chuẩn hóa việc định nghĩa và phân phối báo cáo
- ✅ Cho phép hiển thị động và linh hoạt trên Webapp
- ✅ Hỗ trợ AI Agent hiểu và sinh báo cáo trong tương lai
- ✅ Tăng khả năng tái sử dụng và kiểm soát truy cập tốt hơn

### 4.2. Nhược điểm / Rủi ro / Lưu ý
- ⚠️ Tăng độ phức tạp trong khâu validate template
  - *Giải pháp:* Dùng static validator và test trước khi lưu
- ⚠️ Nếu dùng DSL mở rộng, có thể phát sinh lỗ hổng
  - *Giải pháp:* Giới hạn câu lệnh template, audit code DSL rõ ràng

### 4.3. Tác động đến các thành phần khác (nếu có)
- **reporting-service:** cần implement schema này, thêm API quản lý template
- **superadmin-webapp:** cần hiển thị đúng form đầu vào theo `input_parameters`
- **ADR-028:** phụ thuộc vào ADR này

---

## 5. 🔄 Các Phương án Khác đã Cân nhắc

### 5.1. Phương án A: Viết truy vấn SQL thủ công từ frontend
- **Lý do không chọn:** Không an toàn, không kiểm soát permission

### 5.2. Phương án B: Tạo báo cáo bằng predefined views cố định
- **Lý do không chọn:** Thiếu tính linh hoạt, khó tùy chỉnh filter theo user

---

## 6. 👎 Tài liệu liên quan (Related Documents)

- [ADR-028 - Reporting Architecture](./adr-028-reporting-architecture.md)
- [reporting-service/design.md](../services/reporting-service/design.md)
- [ADR-007 - Phân quyền RBAC](./adr-007-rbac.md)
- [ADR-012 - Response Structure](./adr-012-response-structure.md)
- [README.md của dự án](../README.md)
