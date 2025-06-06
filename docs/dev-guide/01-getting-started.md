## Getting Started - Hướng dẫn Cài đặt Môi trường Phát triển

---

### 🧰 Yêu cầu Công cụ

| Loại công cụ           | Yêu cầu cụ thể                                      |
|------------------------|-----------------------------------------------------|
| **Ngôn ngữ**           | - Python `>=3.11`<br>- Node.js `>=18.x`             |
| **Quản lý dependencies** | - `poetry` (cho Python)<br>- `npm` hoặc `yarn` (cho Node.js frontend) |
| **Containerization**   | - Docker `>=24.0`<br>- Docker Compose               |
| **CLI tools**          | - [`gcloud`](https://cloud.google.com/sdk)<br>- [`terraform`](https://developer.hashicorp.com/terraform/downloads) |
| **Editor & IDE**       | - Khuyến nghị [VS Code](https://code.visualstudio.com/) với các extensions:  
  <br>- Python, Pylance  
  <br>- Prettier, ESLint  
  <br>- Docker, YAML, GitLens |

---

### 🛠️ Cài đặt Dự án

1. **Clone repository chính của dự án DX-VAS:**
```bash
   git clone git@github.com:vas-dev/dx-vas-platform.git
   cd dx-vas-platform
```

2. **Cài đặt `pre-commit` để đảm bảo format/lint code trước khi commit:**

```bash
   pip install pre-commit
   pre-commit install
```

3. **Tạo và cấu hình file `.env` cho từng service.**
   Dựa trên các file `.env.example` có sẵn, điều chỉnh theo môi trường local của bạn.
   Tham khảo: [ADR-005 - Environment Configuration](../../../ADR/adr-005-env-config.md)

4. **Khởi chạy các service phụ thuộc bằng Docker Compose:**

```bash
   docker-compose up -d postgres redis
```

5. **Chạy migration cho CSDL** của service bạn đang làm việc (ví dụ với Alembic hoặc custom migration tool):

```bash
   make migrate
```

6. **Chạy service ở local** bằng Poetry:

```bash
   cd services/user-service/master
   poetry install
   poetry run uvicorn app.main:app --reload
```

---

### 🚀 Chạy Dự án Lần đầu

> Ví dụ chạy `user-service/master` tại `http://localhost:8001`

1. Đảm bảo Postgres đang chạy trong Docker:

```bash
   docker-compose ps
```

2. Tạo DB nếu chưa có:

```bash
   make db-init
```

3. Truy cập Swagger UI của service:

```
   http://localhost:8001/docs
```


4. Gọi thử API bằng `curl`:
```bash
   curl -H "Authorization: Bearer <token>" http://localhost:8001/users/me
```

> 🧠 **Ghi chú:**
> Bạn có thể lấy JWT token thử nghiệm bằng một trong các cách sau:
>
> * Sử dụng API `/auth/login` từ `auth-service/master` với tài khoản test (ví dụ: `admin@vas.edu.vn`)
> * Hoặc gọi script tạo nhanh token local (nếu có make target):
>
> ```bash
>   make token USER_ID=user-001 ROLE=admin
> ```
> * Hoặc decode lại token có sẵn để kiểm tra payload bằng [jwt.io](https://jwt.io)

---

> Nếu bạn gặp lỗi môi trường, hãy tham khảo `dev-guide/debug-guide.md` hoặc trao đổi trong Slack channel nội bộ.
