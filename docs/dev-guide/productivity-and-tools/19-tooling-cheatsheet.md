# ⚡ 19. Tooling Cheatsheet – Tổng hợp Lệnh và Công cụ Thường Dùng

Tài liệu này tổng hợp các lệnh CLI, script và công cụ hữu ích phục vụ quá trình phát triển, kiểm thử và vận hành hệ thống DX-VAS. Đây là “sổ tay bỏ túi” của mọi lập trình viên.

---

## 1. 🐍 Python & Poetry

| Mục đích                   | Lệnh |
|----------------------------|------|
| Cài đặt dependencies       | `poetry install` |
| Chạy shell tương tác       | `poetry shell` |
| Chạy script cụ thể         | `poetry run python script.py` |
| Cài gói mới                | `poetry add <package>` |
| Cài gói dev                | `poetry add --group dev <package>` |

---

## 2. 🧪 Testing

| Mục đích                     | Lệnh |
|------------------------------|------|
| Chạy toàn bộ test            | `make test` hoặc `poetry run pytest` |
| Chạy test có coverage        | `poetry run pytest --cov=app tests/` |
| Chạy test theo file          | `pytest tests/unit/test_user.py` |
| Contract test bằng schemathesis | `schemathesis run --base-url=http://localhost:8001 openapi.yaml` |

---

## 3. 🐳 Docker & Docker Compose

| Mục đích                         | Lệnh |
|----------------------------------|------|
| Khởi động các service phụ thuộc | `docker-compose up -d postgres redis` |
| Kiểm tra container đang chạy     | `docker-compose ps` |
| Vào container service            | `docker-compose exec user-service bash` |
| Xem log một container            | `docker-compose logs -f <service>` |
| Tắt toàn bộ container            | `docker-compose down` |

---

## 4. 🌐 Gcloud CLI

| Mục đích                            | Lệnh |
|-------------------------------------|------|
| Xem log theo trace_id               | `gcloud logging read 'jsonPayload.trace_id="req-abc123"' --project=dx-vas-core` |
| Truy xuất secret                    | `gcloud secrets versions access latest --secret="jwt-secret"` |
| Liệt kê topic Pub/Sub               | `gcloud pubsub topics list` |
| Gửi event mẫu đến Pub/Sub (local)  | `make publish-sample-event` (tuỳ service) |

---

## 5. 🧹 Code Format & Lint

| Mục đích                         | Lệnh |
|----------------------------------|------|
| Format toàn bộ code              | `black .` |
| Sắp xếp import                    | `isort .` |
| Kiểm tra style & error tĩnh      | `flake8 .` |
| Kiểm tra YAML, Markdown, JSON    | `pre-commit run --all-files` |

---

## 6. 📦 Makefile Shortcut

| Mục tiêu                          | Lệnh |
|----------------------------------|------|
| Cài đặt & chuẩn bị môi trường    | `make install` |
| Chạy server                      | `make run` |
| Chạy migration DB                | `make migrate` |
| Lint + format toàn bộ            | `make lint` |
| Chạy tất cả test                 | `make test` |

---

## 7. 🔐 JWT Token

| Mục đích                       | Cách làm |
|-------------------------------|----------|
| Sinh token test local         | `make token USER_ID=user-123 ROLE=admin` |
| Decode token                  | Dán token vào https://jwt.io |
| Thêm vào curl / Postman       | Header: `Authorization: Bearer <token>` |

---

## 8. 📝 Gợi ý Extension VS Code

- Python, Pylance
- Docker, YAML, dotenv
- Prettier, ESLint, EditorConfig
- REST Client (test API nhanh)

---

> 📌 Mẹo: Bạn có thể copy phần này ra file riêng `dx-cheatsheet.txt` để mở bằng terminal hoặc lưu vào Notion nội bộ.
