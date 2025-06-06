# 📊 07. Logging & Tracing – Hướng dẫn Ghi Log và Truy vết

Tài liệu này cung cấp chuẩn và best practices cho việc ghi log và truy vết (trace) trong hệ thống DX-VAS, nhằm hỗ trợ debugging, monitoring và bảo mật ở quy mô lớn.

---

## 1. 🎯 Mục tiêu Logging & Tracing

- Hỗ trợ gỡ lỗi nhanh chóng (theo `X-Request-ID`)
- Cho phép phân tích hành vi hệ thống theo thời gian thực và lịch sử
- Ghi nhận sự kiện bảo mật, hành vi bất thường
- Cung cấp dữ liệu cho báo cáo audit

---

## 2. 📍 Các Quy tắc Vàng

- **Tất cả log phải có `trace_id` hoặc `request_id`**
- **Không bao giờ log dữ liệu nhạy cảm (PII, mật khẩu, token)**
- **Không log ở level DEBUG trong môi trường Production**
- **Log đúng context – gắn theo từng request / task**

---

## 3. 🪵 Cấu trúc Log Chuẩn

Một log chuẩn phải là dạng JSON và chứa đầy đủ thông tin:

```json
{
  "timestamp": "2025-06-05T10:05:23Z",
  "severity": "INFO",
  "service": "user-service.master",
  "trace_id": "req-abc123",
  "operation": "GET /users/me",
  "user_id": "user-001",
  "message": "Get current user success",
  "extra": {
    "ip": "127.0.0.1"
  }
}
```

> Mỗi log phải có ít nhất:
>
> * `timestamp`
> * `severity`
> * `service` (tự động từ ENV)
> * `trace_id` hoặc `X-Request-ID`
> * `message`

---

## 4. 📡 Tracing và Request Correlation

* Mỗi request vào hệ thống sẽ có một `X-Request-ID` duy nhất:

  * Sinh tại API Gateway nếu chưa có
  * Được truyền qua toàn bộ các service qua header
* Các service bắt buộc phải:

  * Log `trace_id` (gắn vào logger context hoặc middleware)
  * Truyền `X-Request-ID` khi gọi các service khác

> Gợi ý: Dùng middleware để tự động gắn trace\_id vào logger (FastAPI, Express, ...)

---

## 5. 📋 Các Level Ghi Log

| Level    | Mô tả và khi nào dùng                                                  |
| -------- | ---------------------------------------------------------------------- |
| DEBUG    | Thông tin chi tiết, dùng khi dev hoặc test local                       |
| INFO     | Thông điệp thành công, hành vi người dùng bình thường                  |
| WARNING  | Hành vi bất thường nhưng không lỗi (ex: retry, missing optional field) |
| ERROR    | Lỗi nghiệp vụ, logic, exception                                        |
| CRITICAL | Hệ thống mất kết nối, mất dữ liệu, hoặc lỗi không thể phục hồi         |

---

## 6. 🛑 Những Điều Không được Làm

* ❌ Không ghi log vào `stdout` dạng text – luôn dùng JSON
* ❌ Không log dữ liệu người dùng (email, số điện thoại, token, OTP…)
* ❌ Không swallow exception mà không ghi `ERROR`
* ❌ Không log trùng dòng ở nhiều service (tránh nhiễu)

---

## 7. 🧪 Kiểm thử Logging & Tracing

* Test bằng cách gửi request có `X-Request-ID` và tra cứu trong Google Cloud Logging
* Tìm bằng truy vấn:

  ```sql
  jsonPayload.trace_id="req-abc123"
  ```
* Log phải hiển thị theo flow:

  * API Gateway → Auth Service → User Service → Notification → ...

---

> 📌 Ghi nhớ: Log là con mắt của hệ thống trong production – nếu bạn không log đủ hoặc log sai, bạn sẽ không thể kiểm soát những gì đang diễn ra.
