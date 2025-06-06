# 🛠️ Hướng dẫn Phát triển (Developer Guide) - Dự án DX-VAS

Chào mừng đến với dự án DX-VAS\!

Tài liệu này là "nguồn chân lý" dành cho tất cả các lập trình viên khi tham gia phát triển hệ thống. Mục tiêu của bộ hướng dẫn này là đảm bảo chúng ta xây dựng nên một sản phẩm có chất lượng cao, nhất quán, dễ bảo trì và có khả năng mở rộng.

Mọi thành viên, dù là từ đội ngũ DX-VAS hay từ đối tác Hoàng Vũ, đều phải tuân thủ các quy tắc và hướng dẫn được nêu trong đây.

> "Code giỏi không chỉ là viết cho máy hiểu, mà còn là viết cho những người sẽ kế thừa và phát triển nó trong 5 năm tới." - Stephen Le

-----

## 📚 Mục lục

### **Phần 1: Nền tảng & Quy trình**

1.  [**Getting Started**](./01-getting-started.md): Hướng dẫn cài đặt môi trường và chạy dự án lần đầu tiên.
2.  [**Core Principles**](./02-core-principles.md): Các nguyên tắc vàng và tư duy kiến trúc cần tuân thủ.
3.  [**Workflow & Process**](./03-workflow-and-process.md): Quy trình làm việc với Git, Pull Request, và CI/CD.

### **Phần 2: Hướng dẫn Kỹ thuật Chi tiết**

Đây là phần cốt lõi, mô tả cách "làm thế nào" để triển khai các service tuân thủ kiến trúc đã định.

  * **API & Backend:**
      * [API Development](./technical-guides/01-api-development.md): Cách thiết kế và triển khai API.
      * [Database & Migrations](./technical-guides/02-database-and-migrations.md): Quy trình làm việc với CSDL và schema migration.
      * [Event-Driven Development](./technical-guides/03-event-driven-development.md): Cách phát và tiêu thụ sự kiện qua Pub/Sub.
  * **Vận hành & Bảo mật:**
      * [Logging & Tracing](./technical-guides/04-logging-and-tracing.md): Quy chuẩn về ghi log và truy vết.
      * [Error Handling](./technical-guides/05-error-handling.md): Cách xử lý và trả về lỗi.
      * [Configuration & Secrets](./technical-guides/06-configuration-and-secrets.md): Cách quản lý cấu hình và biến môi trường.
      * [CI/CD Pipeline & Operations](./technical-guides/07-ci-cd-pipeline.md): Hướng dẫn tương tác với pipeline và các môi trường.
      * [Security Checklist](./technical-guides/08-security-checklist.md): Danh sách kiểm tra bảo mật cho lập trình viên.

### **Phần 3: Hướng dẫn Chuyên biệt**

  * [**Frontend Development Guide**](./05-frontend-guide.md): Các quy ước riêng cho việc phát triển Frontend.
  * [**Testing Guide**](./06-testing-guide.md): Chiến lược và hướng dẫn viết các loại test.

### **Phần 4: Hỗ trợ & Tham khảo**

  * [**Debugging Guide**](./07-debugging-guide.md): Hướng dẫn gỡ lỗi các vấn đề thường gặp.
  * [**Tooling Cheatsheet**](./08-tooling-cheatsheet.md): Tổng hợp các lệnh và công cụ thường dùng.
  * [**Troubleshooting Guide**](./09-troubleshooting.md): Phương pháp luận xử lý sự cố có hệ thống.  