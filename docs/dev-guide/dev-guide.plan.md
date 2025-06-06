
## 🛠️ Hướng dẫn Phát triển (Developer Guide) - Dự án DX-VAS (v1.0)

Chúng ta sẽ cấu trúc bộ `dev-guide` dưới dạng một thư mục chứa nhiều file Markdown, với file `README.md` là điểm khởi đầu và mục lục chính.

### Cấu trúc thư mục đề xuất:

```
/docs
|-- /ADR
|-- /architecture
|-- /dev-guide/
|   |-- README.md                   <-- File chính, mục lục của dev-guide
|   |-- 01-getting-started.md       <-- Hướng dẫn cài đặt môi trường
|   |-- 02-core-principles.md       <-- Các nguyên tắc vàng khi lập trình
|   |-- 03-workflow-and-process.md  <-- Quy trình làm việc (Git, PR, CI/CD)
|   |-- /technical-guides/          <-- Thư mục chứa các hướng dẫn kỹ thuật chi tiết
|   |   |-- 01-api-development.md
|   |   |-- 02-database-and-migrations.md
|   |   |-- 03-event-driven-development.md
|   |   |-- 04-logging-and-tracing.md
|   |   |-- 05-error-handling.md
|   |   |-- 06-configuration-and-secrets.md
|   |-- 05-frontend-guide.md        <-- Hướng dẫn riêng cho Frontend
|   |-- 06-testing-guide.md         <-- Chiến lược và hướng dẫn kiểm thử
|   |-- 07-tooling-cheatsheet.md    <-- Các lệnh thường dùng
|-- /interfaces
|-- /services
...
```

-----

### Nội dung chi tiết cho từng file:

#### 1\. `dev-guide/README.md` (File chính, mục lục)

```markdown
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

### Phần 5: Tham khảo nhanh
7.  [**Tooling Cheatsheet**](./07-tooling-cheatsheet.md): Tổng hợp các lệnh thường dùng cho linters, formatters, testing.
```

-----

#### 2\. `01-getting-started.md`

```markdown
## Hướng dẫn Cài đặt Môi trường Phát triển

### Yêu cầu Công cụ
- **Ngôn ngữ:**
  - Python [phiên_bản_cụ_thể, ví dụ: 3.11+]
  - Node.js [phiên_bản_cụ_thể, ví dụ: 18.x+]
- **Quản lý dependencies:**
  - `poetry` (cho Python)
  - `npm` hoặc `yarn` (cho Node.js)
- **Containerization:**
  - Docker & Docker Compose
- **Công cụ dòng lệnh:**
  - `gcloud` CLI
  - `terraform`
- **Editor & IDE:**
  - Khuyến nghị VS Code với các extensions: Python, Pylance, Prettier, ESLint, ...

### Cài đặt Dự án
1. Clone repository chính của dx-vas.
2. Cài đặt `pre-commit` hooks để tự động format và lint code trước khi commit:
   ```bash
   pip install pre-commit
   pre-commit install
```

3.  Cấu hình file `.env` cho từng service dựa trên file `.env.example` đã có. Tham khảo [ADR-005 - Environment Configuration](https://www.google.com/search?q=./ADR/adr-005-env-config.md).
4.  Sử dụng Docker Compose để khởi chạy các service phụ thuộc (PostgreSQL, Redis) cho môi trường local.
    ```bash
    docker-compose up -d postgres redis
    ```
5.  Chạy migration cho CSDL của service bạn đang làm việc.
6.  Chạy service local.

### Chạy Dự án Lần đầu

  - [TODO: Thêm các bước cụ thể để một dev mới có thể chạy được một service (ví dụ: `user-service/master`) trên máy local.]

<!-- end list -->

```

---

#### 3. `02-core-principles.md`

```markdown
## Các Nguyên tắc Vàng khi Lập trình

1.  **Design First:** Không bao giờ viết code trước khi có tài liệu thiết kế (`design.md`, `data-model.md`, `interface-contract.md`) được review và đồng thuận. Tài liệu là kim chỉ nam.
2.  **ADR-Driven:** Mọi quyết định có ảnh hưởng đến kiến trúc, hoặc các service khác, đều phải được ghi lại dưới dạng ADR và được phê duyệt.
3.  **Security by Design:** Bảo mật không phải là một tính năng, mà là một yêu cầu xuyên suốt. Luôn tuân thủ `ADR-004 - Security Policy`, validate tất cả input từ client, không bao giờ tin tưởng dữ liệu đầu vào.
4.  **Stateless Services:** Các service backend phải được thiết kế stateless để dễ dàng scale theo chiều ngang. Mọi trạng thái phải được lưu trữ ở một hệ thống bên ngoài (CSDL, Redis Cache).
5.  **Test Everything:** Mọi dòng code logic nghiệp vụ đều phải có unit test đi kèm. Mọi API endpoint đều phải có integration test.
6.  **Tuân thủ Hợp đồng (Contract First):** `openapi.yaml` là hợp đồng không thể phá vỡ. Mọi thay đổi trên API phải được cập nhật vào OpenAPI trước, sau đó mới đến code.
```

-----

#### 4\. `03-workflow-and-process.md`

```markdown
## Quy trình Làm việc với Git, Pull Request và CI/CD

### Git Branching Strategy
- **`main`**: Nhánh chính, luôn ở trạng thái sẵn sàng để deploy Production. Chỉ merge từ `dev` sau khi đã được phê duyệt.
- **`dev`**: Nhánh phát triển, tích hợp các feature. Tự động deploy lên môi trường Staging.
- **`feature/[TICKET-ID]-[short-description]`**: Nhánh cho mỗi tính năng mới. Ví dụ: `feature/DX-123-add-reporting-api`.
- **`bugfix/[TICKET-ID]-[short-description]`**: Nhánh sửa lỗi trên `dev`/`staging`.
- **`hotfix/[TICKET-ID]-[short-description]`**: Nhánh sửa lỗi khẩn cấp trên `main`/`production`.

### Commit Message Convention
- Sử dụng **Conventional Commits**. Ví dụ:
  - `feat: add new endpoint for report templates`
  - `fix: correct pagination logic in list users API`
  - `docs: update README with new architecture diagram`
  - `style: format code with black`
  - `refactor: improve query performance for user lookup`
  - `test: add unit tests for RBAC validator`
  - `chore: update dependencies`

### Pull Request (PR) Process
1.  Tạo PR từ nhánh `feature/*` hoặc `bugfix/*` vào nhánh `dev`.
2.  Điền đầy đủ thông tin vào PR template (liên kết đến ticket Jira, mô tả thay đổi, checklist).
3.  Đảm bảo CI pipeline (lint, test, build) chạy thành công.
4.  Yêu cầu ít nhất **1-2 approver** từ các thành viên khác trong team hoặc từ team kiến trúc (nếu có thay đổi lớn).
5.  Sau khi được approve, thực hiện **Squash and Merge** để giữ lịch sử Git gọn gàng.
```

-----

**Và các file hướng dẫn kỹ thuật chi tiết khác** (`technical-guides/`, `frontend-guide.md`, `testing-guide.md`, `tooling-cheatsheet.md`) sẽ được xây dựng dựa trên cấu trúc đã đề xuất ở trên. Mỗi file sẽ đi sâu vào việc "làm thế nào" để áp dụng các ADRs và tiêu chuẩn của chúng ta vào thực tế.
