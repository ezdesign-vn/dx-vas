# ⚙️ 18. Local Development Productivity – Tăng Tốc Phát Triển Cục Bộ

Tài liệu này cung cấp các kỹ thuật và công cụ giúp lập trình viên tăng tốc khi phát triển local, giảm thời gian feedback và cải thiện trải nghiệm viết code trên dự án DX-VAS.

---

## 1. 🚀 Auto Reload & Live Dev

| Ngôn ngữ/Stack   | Cách bật auto reload                       |
|------------------|--------------------------------------------|
| **Python (FastAPI)** | `uvicorn app.main:app --reload` hoặc `make dev` |
| **Node.js**      | `nodemon src/index.ts` hoặc cấu hình script npm |
| **Frontend (Vite)**| `npm run dev` (auto reload mặc định)         |

> ✅ Luôn cấu hình `--reload` trong local để tiết kiệm thời gian khởi động lại service sau mỗi lần chỉnh sửa.

---

## 2. 🐳 Docker Dev Mode

- Sử dụng **volume mount** để map source code vào container:
```yaml
  volumes:
    - ./app:/usr/src/app
```

* Tách Dockerfile dev và prod nếu cần:

  * `Dockerfile.dev`: dùng cho local (`pip install -e`, mount code)
  * `Dockerfile`: tối ưu cho build production

> 🔄 Gợi ý: Docker + volume sẽ chậm trên macOS → cân nhắc chạy poetry trực tiếp.

---

## 3. 🪄 Makefile Shortcut cho Dev

| Lệnh nhanh     | Mục đích                            |
| -------------- | ----------------------------------- |
| `make run`     | Chạy app local (`uvicorn --reload`) |
| `make test`    | Chạy test nhanh                     |
| `make migrate` | Tạo schema DB                       |
| `make lint`    | Format + check                      |
| `make token`   | Sinh JWT test                       |
| `make logs`    | Xem log container gần nhất          |

> 🧠 Gợi ý: Nếu thấy make chậm, có thể dùng `justfile` hoặc `npm scripts` tùy stack.

---

## 4. 🧪 Tăng tốc Test Local

* **Chạy test một phần:** `pytest tests/unit/`
* **Cache DB:** dùng SQLite hoặc Postgres riêng cho test
* **Mock external:** không gọi thật Pub/Sub, Redis

> Dùng `--maxfail=2` để fail nhanh:

```bash
pytest --maxfail=2 --disable-warnings
```

---

## 5. 🧠 Tips cho VS Code

| Extension              | Mục đích                  |
| ---------------------- | ------------------------- |
| Python, Pylance        | Intellisense mạnh         |
| Docker, Dev Containers | Quản lý container nhanh   |
| REST Client            | Gửi request API trực tiếp |
| EditorConfig           | Đồng bộ style đa ngôn ngữ |
| Error Lens             | Hiển thị lỗi inline       |

### Launch config mẫu (Python):

```json
{
  "name": "Run FastAPI",
  "type": "python",
  "request": "launch",
  "module": "uvicorn",
  "args": ["app.main:app", "--reload"],
  "justMyCode": true
}
```

---

## 6. 🔄 Hot Reload Template / Frontend

* Với Jinja2 (template server-side), cần bật reload engine:

  ```python
  templates = Jinja2Templates(directory="templates", auto_reload=True)
  ```

* Với frontend Vite:

  * Hỗ trợ hot-module-replacement mặc định
  * Khi thêm file mới: restart `npm run dev` nếu bị delay reload

---

## 7. 📁 Dọn dẹp Workspace

* Xoá file build rác:

  ```bash
  find . -name "__pycache__" -exec rm -r {} +
  ```
* Reset container & volume:

  ```bash
  docker-compose down -v
  ```

---

## 8. 📌 Checklist khi setup máy mới

* [ ] Cài Docker & Docker Compose
* [ ] Cài Python 3.11+ và Poetry
* [ ] Cài Node.js 18+ và Yarn/NPM
* [ ] Cài `pre-commit`, VS Code extensions
* [ ] Clone repo + `poetry install` + `make install`
* [ ] Kiểm tra `.env` và chạy `make run`

---

> 💡 Mẹo: Local productivity tốt không chỉ giúp dev code nhanh hơn, mà còn giảm lỗi production nhờ feedback sớm và phát triển tự tin hơn.
