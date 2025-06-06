# 🛠️ Hướng dẫn Phát triển (Developer Guide) - Dự án DX-VAS

Chào mừng đến với dự án DX-VAS\!

Tài liệu này là "nguồn chân lý" dành cho tất cả các lập trình viên khi tham gia phát triển hệ thống. Mục tiêu của bộ hướng dẫn này là đảm bảo chúng ta xây dựng nên một sản phẩm có chất lượng cao, nhất quán, dễ bảo trì và có khả năng mở rộng.

Mọi thành viên, dù là từ đội ngũ DX-VAS hay từ đối tác Hoàng Vũ, đều phải tuân thủ các quy tắc và hướng dẫn được nêu trong đây.

> "Code giỏi không chỉ là viết cho máy hiểu, mà còn là viết cho những người sẽ kế thừa và phát triển nó trong 5 năm tới." - Stephen Le

-----

## 📚 Mục lục

**Cây thư mục**
```
/docs
|-- ... (ADR, architecture, etc.)
|-- /dev-guide/
|   |-- README.md
|   |-- 01-getting-started.md
|   |-- 02-core-principles.md
|   |-- 03-workflow-and-process.md
|   |-- /technical-guides/
|   |   |-- 04-api-development.md
|   |   |-- 05-database-and-migrations.md
|   |   |-- 06-event-driven-development.md
|   |   |-- 07-logging-and-tracing.md
|   |   |-- 08-error-handling.md
|   |   |-- 09-configuration-and-secrets.md
|   |-- /specialized-guides/
|   |   |-- 10-frontend-guide.md
|   |-- /quality-and-operations/
|   |   |-- 11-testing-guide.md
|   |   |-- 12-security-checklist.md
|   |   |-- 13-ci-cd-pipeline.md
|   |   |-- 14-debugging-guide.md
|   |   |-- 15-troubleshooting-guide.md
|   |   |-- 16-incident-response.md
|   |   |-- 17-release-versioning.md
|   |-- /productivity-and-tools/
|   |   |-- 18-local-dev-productivity.md
|   |   |-- 19-tooling-cheatsheet.md
|-- /process/
|   |-- ONBOARDING.md
|   |-- OFFBOARDING.md
|
|-- CONTRIBUTING.md
|-- README.md
...
```

---

### **Phần 1: Nền tảng & Quy trình (Foundation & Process)**

*Đây là những tài liệu bắt buộc phải đọc đối với mọi thành viên mới.*

1.  [**01 - Getting Started**](https://www.google.com/search?q=./01-getting-started.md): Hướng dẫn cài đặt môi trường và chạy dự án.
2.  [**02 - Core Principles**](https://www.google.com/search?q=./02-core-principles.md): Các nguyên tắc vàng và tư duy kiến trúc cần tuân thủ.
3.  [**03 - Workflow & Process**](https://www.google.com/search?q=./03-workflow-and-process.md): Quy trình làm việc với Git, Pull Request.

### **Phần 2: Hướng dẫn Kỹ thuật Cốt lõi (Core Technical Guides)**

*Đây là các "bộ luật" chi tiết cho việc phát triển backend service.*

  * [**04 - API Development**](https://www.google.com/search?q=./technical-guides/04-api-development.md): Cách thiết kế và triển khai API.
  * [**05 - Database & Migrations**](https://www.google.com/search?q=./technical-guides/05-database-and-migrations.md): Quy trình làm việc với CSDL và schema migration.
  * [**06 - Event-Driven Development**](https://www.google.com/search?q=./technical-guides/06-event-driven-development.md): Cách phát và tiêu thụ sự kiện qua Pub/Sub.
  * [**07 - Logging & Tracing**](https://www.google.com/search?q=./technical-guides/07-logging-and-tracing.md): Quy chuẩn về ghi log và truy vết.
  * [**08 - Error Handling**](https://www.google.com/search?q=./technical-guides/08-error-handling.md): Cách xử lý và trả về lỗi.
  * [**09 - Configuration & Secrets**](https://www.google.com/search?q=./technical-guides/09-configuration-and-secrets.md): Cách quản lý cấu hình và biến môi trường.

### **Phần 3: Hướng dẫn Chuyên biệt (Specialized Guides)**

*Các hướng dẫn dành cho các lĩnh vực phát triển cụ thể.*

  * [**10 - Frontend Development Guide**](https://www.google.com/search?q=./specialized-guides/10-frontend-guide.md): Các quy ước riêng cho việc phát triển Frontend.

### **Phần 4: Đảm bảo Chất lượng & Vận hành (Quality & Operations)**

*Các quy trình và hướng dẫn để đảm bảo hệ thống ổn định và đáng tin cậy.*

  * [**11 - Testing Guide**](https://www.google.com/search?q=./quality-and-operations/11-testing-guide.md): Chiến lược và hướng dẫn viết các loại test.
  * [**12 - Security Checklist**](https://www.google.com/search?q=./quality-and-operations/12-security-checklist.md): Danh sách kiểm tra bảo mật cho lập trình viên.
  * [**13 - CI/CD Pipeline & Operations**](https://www.google.com/search?q=./quality-and-operations/13-ci-cd-pipeline.md): Hướng dẫn tương tác với pipeline và các môi trường.
  * [**14 - Debugging Guide**](https://www.google.com/search?q=./quality-and-operations/14-debugging-guide.md): Hướng dẫn gỡ lỗi các vấn đề đã biết.
  * [**15 - Troubleshooting Guide**](https://www.google.com/search?q=./quality-and-operations/15-troubleshooting-guide.md): Phương pháp luận xử lý sự cố có hệ thống.
  * [**16 - Incident Response Guide**](https://www.google.com/search?q=./quality-and-operations/16-incident-response.md): Quy trình phản ứng khi có sự cố nghiêm trọng.
  * [**17 - Release & Versioning Guide**](https://www.google.com/search?q=./quality-and-operations/17-release-versioning.md): Chiến lược đánh số phiên bản và quản lý release.

### **Phần 5: Năng suất & Công cụ (Productivity & Tools)**

*Các tài liệu tham khảo nhanh giúp tăng tốc độ làm việc.*

  * [**18 - Local Dev Productivity Tips**](https://www.google.com/search?q=./productivity-and-tools/18-local-dev-productivity.md): Các mẹo để tăng năng suất khi phát triển local.
  * [**19 - Tooling Cheatsheet**](https://www.google.com/search?q=./productivity-and-tools/19-tooling-cheatsheet.md): Tổng hợp các lệnh và công cụ thường dùng.
