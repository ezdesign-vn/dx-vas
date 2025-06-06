# 🛠️ Hướng dẫn Phát triển (Developer Guide) - Dự án DX-VAS

Chào mừng đến với dự án DX-VAS!

Tài liệu này là "nguồn chân lý" dành cho tất cả các lập trình viên khi tham gia phát triển hệ thống. Mục tiêu của bộ hướng dẫn này là đảm bảo chúng ta xây dựng nên một sản phẩm có chất lượng cao, nhất quán, dễ bảo trì và có khả năng mở rộng.

Mọi thành viên, dù là từ đội ngũ DX-VAS hay từ đối tác Hoàng Vũ, đều phải tuân thủ các quy tắc và hướng dẫn được nêu trong đây.

> "Code giỏi không chỉ là viết cho máy hiểu, mà còn là viết cho những người sẽ kế thừa và phát triển nó trong 5 năm tới." - Bill, CTO

---

## 📚 Mục lục

### Phần 1: Bắt đầu
1.  [**Getting Started**](./01-getting-started.md): Hướng dẫn cài đặt môi trường và chạy dự án lần đầu tiên.

### Phần 2: Nguyên tắc và Quy trình
2.  [**Core Principles**](./02-core-principles.md): Các nguyên tắc vàng và tư duy kiến trúc cần tuân thủ.
3.  [**Workflow & Process**](./03-workflow-and-process.md): Quy trình làm việc với Git, Pull Request, và CI/CD.

### Phần 3: Hướng dẫn Kỹ thuật Chi tiết
4.  **Technical Guides:**
    -   [API Development](./technical-guides/01-api-development.md): Cách thiết kế và triển khai API tuân thủ các ADRs.
    -   [Database & Migrations](./technical-guides/02-database-and-migrations.md): Quy trình làm việc với CSDL và schema migration.
    -   [Event-Driven Development](./technical-guides/03-event-driven-development.md): Cách phát và tiêu thụ sự kiện qua Pub/Sub.
    -   [Logging & Tracing](./technical-guides/04-logging-and-tracing.md): Quy chuẩn về ghi log và truy vết.
    -   [Error Handling](./technical-guides/05-error-handling.md): Cách xử lý và trả về lỗi.
    -   [Configuration & Secrets](./technical-guides/06-configuration-and-secrets.md): Cách quản lý cấu hình và biến môi trường.

### Phần 4: Hướng dẫn Chuyên biệt
5.  [**Frontend Development Guide**](./05-frontend-guide.md): Các quy ước riêng cho việc phát triển Frontend.
6.  [**Testing Guide**](./06-testing-guide.md): Chiến lược và hướng dẫn viết các loại test.

### Phần 5: Vận hành & Gỡ lỗi
7.  [**Debugging & Tracing Guide**](./07-debugging-guide.md): Hướng dẫn truy vết và xử lý các lỗi thường gặp.

### Phần 6: Tham khảo nhanh
8.  [**Tooling Cheatsheet**](./08-tooling-cheatsheet.md): Tổng hợp các lệnh thường dùng cho linters, formatters, testing.