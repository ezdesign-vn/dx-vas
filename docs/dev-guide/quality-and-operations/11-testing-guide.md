# 🧪 11. Testing Guide – Hướng dẫn Viết và Quản lý Kiểm thử

Tài liệu này hướng dẫn cách viết, tổ chức và chạy các bài kiểm thử (test) trong hệ thống DX-VAS theo chuẩn 5⭐, đảm bảo độ tin cậy cao và phòng ngừa lỗi khi phát triển.

---

## 1. 🧠 Triết lý Kiểm thử

- Mỗi thay đổi phải đi kèm test tương ứng.
- Không có kiểm thử đồng nghĩa với không có niềm tin.
- Kiểm thử không chỉ là "check code chạy", mà là đảm bảo hành vi nghiệp vụ.
- Tự động hóa kiểm thử là yêu cầu bắt buộc trong CI/CD.

> Tham khảo:
> - [ADR-010 - Contract Testing](../ADR/adr-010-contract-testing.md)

---

## 2. 🧪 Các loại kiểm thử

| Loại Test          | Mục tiêu chính                                      | Framework              |
|--------------------|-----------------------------------------------------|------------------------|
| **Unit Test**       | Kiểm tra từng hàm, class nhỏ                        | `pytest`, `unittest`  |
| **Integration Test**| Kiểm tra API thực sự, DB, Pub/Sub, Redis, ...      | `pytest + FastAPI`, `Supertest` (Node.js) |
| **Contract Test**   | So sánh request/response thực tế với OpenAPI       | `schemathesis`, `dredd`, `pact` |
| **E2E Test (FE)**   | Kiểm thử giao diện từ đầu đến cuối                 | `Playwright`, `Cypress` |
| **Load Test**       | Kiểm tra hiệu năng & khả năng chịu tải             | `k6`, `locust`         |

---

## 3. 🧱 Cấu trúc thư mục Test

Ví dụ cho Python service:

```

user-service/
├── app/
├── tests/
│   ├── unit/
│   │   └── test\_rbac.py
│   ├── integration/
│   │   └── test\_users\_api.py
│   └── contract/
│       └── test\_openapi\_schema.py

```

---

## 4. 🧪 Viết Test Hiệu quả

- Mỗi unit test nên kiểm tra **1 logic cụ thể**
- Đặt tên test rõ ràng: `test_create_user_with_valid_data_should_return_201`
- Dùng `fixture` để tạo dữ liệu mẫu (user, token, DB connection…)
- Mock external dependency (Pub/Sub, Redis…) trong unit test

---

## 5. 📋 Các quy tắc bắt buộc

| Quy tắc                                | Ghi chú                                 |
|----------------------------------------|------------------------------------------|
| Coverage ≥ 80%                         | Được kiểm tra tự động trong CI           |
| Không được skip test khi merge         | Dùng `@pytest.mark.skip` chỉ khi thật cần thiết |
| Mỗi PR có ít nhất 1 test đi kèm        | Dù là bugfix hay feature mới             |
| Test phải **idempotent**               | Chạy lại nhiều lần không được fail ngẫu nhiên |

---

## 6. 🚀 Chạy Test

### Local:
```bash
make test
poetry run pytest -v --cov=app tests/
```

### Docker (dành cho service có container riêng):

```bash
docker-compose exec user-service make test
```

### Contract Test với Schemathesis:

```bash
schemathesis run --base-url=http://localhost:8001 openapi.yaml
```

---

## 7. 🛑 Những điều không nên làm

* ❌ Không viết test chỉ để “pass CI” mà không kiểm tra gì thực tế
* ❌ Không test dựa trên hardcoded ID từ DB thật
* ❌ Không gộp nhiều logic khác nhau trong 1 test case
* ❌ Không để test phụ thuộc vào thứ tự chạy

---

> 📌 Ghi nhớ: Một hệ thống không có kiểm thử tự động là hệ thống chưa sẵn sàng để phát triển nghiêm túc.
