# 🔐 06. Configuration & Secrets – Hướng dẫn Quản lý Cấu hình và Thông tin Nhạy cảm

Tài liệu này mô tả cách quản lý biến môi trường, cấu hình hệ thống, và thông tin nhạy cảm (secrets) một cách an toàn và nhất quán trong hệ thống DX-VAS, tuân thủ chuẩn 5⭐ và các ADR bảo mật.

---

## 1. 🎯 Nguyên tắc Chung

- Không hard-code bất kỳ giá trị cấu hình nào vào mã nguồn.
- Mọi biến cấu hình phải được định nghĩa trong `.env` hoặc lấy từ Secret Manager.
- Tách biệt rõ:
  - **Cấu hình công khai** (PORT, DEBUG, API_URL)
  - **Thông tin nhạy cảm** (DB_PASSWORD, JWT_SECRET, GCP_CREDENTIALS)
- Cấu hình phải có giá trị mặc định hợp lý cho môi trường local.

> Tham khảo:
> - [ADR-005 - Environment Configuration](../../ADR/adr-005-env-config.md)  
> - [ADR-003 - Secret Management](../../ADR/adr-003-secrets.md)

---

## 2. 📂 Cấu trúc File `.env`

Mỗi service phải có file `.env.example` mẫu. Ví dụ:

```env
# App
APP_ENV=local
PORT=8001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=user_db
DB_USER=postgres
DB_PASSWORD=secret

# JWT
JWT_SECRET=my-super-secret
JWT_ALGORITHM=HS256

# GCP Pub/Sub
GCP_PROJECT_ID=dx-vas-dev
PUBSUB_EMULATOR_HOST=localhost:8432
```

> 🔒 Không commit file `.env` thực tế — chỉ `.env.example`.

---

## 3. 🔐 Quản lý Secrets

### Local

* Dùng `.env` với giá trị giả lập cho phát triển.
* Với Python, sử dụng `python-dotenv` để load từ `.env`.

### Staging / Production

* Dùng Google Secret Manager để lưu và truy xuất các biến nhạy cảm.
* Không nên inject toàn bộ `.env` – chỉ lấy giá trị cần dùng tại runtime.

> Ví dụ với `gcloud`:

```bash
gcloud secrets versions access latest --secret="jwt-secret"
```

---

## 4. 📌 Tên Biến Môi Trường Chuẩn hóa

| Prefix   | Ý nghĩa              | Ví dụ                       |
| -------- | -------------------- | --------------------------- |
| `APP_`   | Thông tin về service | `APP_ENV`, `APP_NAME`       |
| `DB_`    | Kết nối CSDL         | `DB_HOST`, `DB_PASSWORD`    |
| `JWT_`   | Cấu hình token       | `JWT_SECRET`, `JWT_EXPIRY`  |
| `GCP_`   | Tích hợp GCP         | `GCP_PROJECT_ID`, `GCP_KEY` |
| `REDIS_` | Redis cache          | `REDIS_HOST`, `REDIS_DB`    |

---

## 5. 🧪 Kiểm thử cấu hình

* Chạy service bằng `.env` local:

  ```bash
  poetry run uvicorn app.main:app --reload
  ```
* Kiểm tra khi thiếu biến quan trọng → service phải **fail fast** với log lỗi rõ ràng.
* Tạo unit test validate cấu hình khi load app (`test_config.py`)

---

## 6. 🛑 Những Điều Không được Làm

* ❌ Không commit `.env` thực tế lên Git
* ❌ Không log ra giá trị secret
* ❌ Không sử dụng giá trị mặc định nguy hiểm (VD: `SECRET=123456`)
* ❌ Không chia sẻ secret qua email, chat, Google Docs

---

> 📌 Ghi nhớ: Configuration là nền tảng cho việc deploy linh hoạt – hãy cấu hình đúng, bảo vệ kỹ, và luôn kiểm soát được.
