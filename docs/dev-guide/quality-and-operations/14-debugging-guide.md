# 🐞 14. Hướng dẫn Gỡ lỗi & Truy vết (Debugging & Tracing Guide)

Tài liệu này cung cấp các phương pháp, công cụ và kịch bản thường gặp để gỡ lỗi và truy vết các vấn đề trong hệ thống DX-VAS.

---

## 1. 🧠 Triết lý Gỡ lỗi

- **Follow the Trace ID:**  
  `X-Request-ID` (hoặc `trace_id` trong log) là người bạn tốt nhất của bạn. Mọi quá trình gỡ lỗi nên bắt đầu từ đây. Nó được gán tự động tại API Gateway và truyền qua tất cả các service.

- **Understand the Flow:**  
  Trước khi gỡ lỗi, hãy mở `docs/architecture/system-diagrams.md` để hiểu rõ request của bạn đã đi qua các service nào.

- **Reproduce Locally:**  
  Cố gắng tái hiện lỗi trong môi trường local – với cùng input – trước khi xử lý trên Staging hoặc Production.

---

## 2. 🛠️ Công cụ Chính

| Công cụ                 | Mục đích                                                         |
|-------------------------|------------------------------------------------------------------|
| **Google Cloud Logging** | Tra cứu log tập trung, lọc theo `trace_id`, `severity`, `service` |
| **Google Cloud Trace**   | (nếu tích hợp) Truy vết biểu đồ Gantt của một request đa service |
| **Debugger Local (VS Code)** | Đặt breakpoint trong Python hoặc Node.js để debug cục bộ |
| **`curl` / Postman**     | Gửi thử API, xem chi tiết response, header, status              |

---

## 3. 🔍 Quy trình Truy vết một Request

1. **Lấy `X-Request-ID`:**  
   Header này được trả về trong mọi API response. Ngoài ra, bạn có thể tìm trong log theo `request_id` hoặc `trace_id`.

2. **Vào Cloud Logging:**
   - Mở https://console.cloud.google.com/logs/query
   - Chọn đúng Project GCP (`dx-vas-core`, `dx-vas-tenant-xxx`, v.v.)
   - Dán truy vấn:
     ```sql
     jsonPayload.trace_id="req-abc123"
     ```
   - Nhấn "Run Query"

3. **Đọc Log theo thứ tự:**
   - Bắt đầu từ log của `api-gateway`
   - Theo dõi các service backend tương ứng (auth, user, notification…)
   - Tập trung vào các trường `severity: "ERROR"`, `request_payload`, `response_payload`, `x-emits-event`, `audit_log`

---

## 4. ❗ Các Lỗi Thường gặp và Cách Xử lý

### 🔒 Lỗi 401 Unauthorized

**Nguyên nhân:**
- Thiếu `Authorization` header
- Token hết hạn hoặc sai

**Cách xử lý:**
1. Kiểm tra header `Authorization: Bearer <JWT>`
2. Dán token vào [jwt.io](https://jwt.io) để kiểm tra payload (`exp`, `scope`)
3. Thực hiện lại luồng đăng nhập qua `auth-service/master`

---

### 🔒 Lỗi 403 Forbidden

**Nguyên nhân:**
- User không có permission được yêu cầu

**Cách xử lý:**
1. Mở file `openapi.yaml` → tìm endpoint → xem `x-required-permission`
2. Kiểm tra trong JWT xem user có permission đó không
3. Truy vấn `user-service/master` hoặc `sub` để kiểm tra gán `role → permission`

---

### 💥 Lỗi 5xx Internal Server Error

**Nguyên nhân:**
- Lỗi logic trong backend
- Lỗi kết nối với DB, Redis, Pub/Sub

**Cách xử lý:**
1. Không dừng lại ở log của API Gateway!
2. Dùng `trace_id` để tìm log sâu hơn trong các service
3. Tập trung vào log `severity=ERROR` + xem traceback cụ thể

---

### 🧪 Lỗi Môi trường Local

**Nguyên nhân phổ biến:**
- Docker Compose chưa khởi động
- `.env` chưa cấu hình đúng
- Chưa chạy migration tạo bảng

**Cách xử lý:**
1. Kiểm tra container:
   ```bash
   docker-compose ps
   ```

2. So sánh `.env` với `.env.example`
3. Chạy migration:
   ```bash
   make migrate
   ```
---

> 💡 Mẹo: Luôn thêm `X-Request-ID` vào mọi log thủ công của bạn – nó giúp bạn trace xuyên tầng, kể cả khi lỗi không xảy ra.
