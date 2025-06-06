# 🧯 15. Troubleshooting Guide – Xử lý Sự cố Nhanh

Tài liệu này tổng hợp các sự cố thường gặp trong quá trình phát triển và vận hành hệ thống DX-VAS, kèm hướng dẫn xử lý nhanh. Mục tiêu là giúp dev không hoảng loạn khi gặp lỗi, và biết tra ở đâu, làm gì trước tiên.

---

## 1. 🧪 Local Development – Lỗi thường gặp

### ❌ Không chạy được service local
| Nguyên nhân                           | Cách xử lý |
|--------------------------------------|------------|
| Docker chưa khởi động hoặc sai port  | `docker-compose up -d postgres redis` |
| File `.env` chưa tồn tại hoặc sai    | Copy từ `.env.example` và kiểm tra từng biến |
| Migration chưa chạy                 | `make migrate` hoặc `alembic upgrade head` |
| Poetry chưa cài / sai virtualenv     | `poetry install` và `poetry shell` |

---

### ❌ Gọi API trả về 401 Unauthorized
| Nguyên nhân | Cách xử lý |
|-------------|------------|
| Thiếu token hoặc token sai | Đăng nhập lại bằng Postman hoặc `make token` |
| Token hết hạn / decode sai | Dán token vào [jwt.io](https://jwt.io) để kiểm tra |
| Backend quên check token?  | Kiểm tra middleware Auth đã bật chưa |

---

## 2. 🛰️ API Gateway / Routing lỗi

### ❌ Gọi API Gateway nhưng báo 404
| Nguyên nhân | Cách xử lý |
|-------------|------------|
| Route chưa được định nghĩa trong `proxy_config.yaml` | Thêm lại route và restart service |
| Sai path hoặc method | So lại với OpenAPI contract |

---

### ❌ Lỗi CORS khi gọi từ Frontend
| Nguyên nhân | Cách xử lý |
|-------------|------------|
| Header `Origin` bị chặn | Kiểm tra config CORS trong service |
| Không trả về header `Access-Control-Allow-Origin` | Thêm middleware CORS đúng trong FastAPI hoặc Express |

---

## 3. 📦 Pub/Sub & Event Processing

### ❌ Sub Service không nhận event
| Nguyên nhân | Cách xử lý |
|-------------|------------|
| Sai `topic` hoặc không có `subscription` | Kiểm tra GCP Pub/Sub hoặc config local |
| Event không hợp lệ schema | Bật `schema validation` trong consumer & kiểm tra logs |
| Event bị swallow do lỗi | Bật log `ERROR`, đảm bảo không `try/except` quá rộng |

---

## 4. 🔐 Bảo mật & Quyền hạn

### ❌ Trả về 403 Forbidden
| Nguyên nhân | Cách xử lý |
|-------------|------------|
| User không có permission cần thiết | So lại `x-required-permission` trong OpenAPI |
| Token không chứa đủ role/claims | Decode token và kiểm tra payload |
| Config role mapping sai | Kiểm tra DB bảng `user_roles` và `role_permissions` |

---

## 5. ☁️ Google Cloud Issues

### ❌ Không thấy log service
| Nguyên nhân | Cách xử lý |
|-------------|------------|
| Sai project GCP | Kiểm tra tên project trong filter |
| Không log đúng `trace_id` | Kiểm tra middleware có gắn `X-Request-ID` chưa |
| Service chưa deploy đúng revision | Vào Cloud Run → tab **Revisions** để rollback nếu cần |

---

## 6. 🧠 Kỹ năng xử lý sự cố (Mindset)

- **Luôn bắt đầu từ `X-Request-ID`** → giúp trace toàn flow qua log.
- **Luôn dùng lại `curl` hoặc Postman** để tái hiện vấn đề từng bước.
- **Tách biệt lỗi logic và lỗi hạ tầng** (logic: exception, hạ tầng: 502/504).
- **Ghi lại các sự cố nghiêm trọng** vào Wiki nội bộ để rút kinh nghiệm.

---

## 7. 📌 Nguồn tham khảo nhanh

| Mục tiêu                            | Link |
|-------------------------------------|------|
| Theo dõi Log                        | https://console.cloud.google.com/logs |
| Theo dõi Pub/Sub                    | https://console.cloud.google.com/cloudpubsub |
| Theo dõi Cloud Run                 | https://console.cloud.google.com/run |
| Monitoring & Alert                  | https://console.cloud.google.com/monitoring |
| Decode JWT                         | https://jwt.io |
| Thử API (local)                     | Postman / Insomnia / REST Client |

---

> 📌 Ghi nhớ: Dev giỏi không phải là dev không gặp lỗi, mà là người biết tìm đúng log, đúng flow, và fix lỗi **có trách nhiệm**.
