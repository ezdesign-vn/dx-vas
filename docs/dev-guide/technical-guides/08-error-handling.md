# 🚨 08. Error Handling – Hướng dẫn Xử lý và Trả lỗi Chuẩn hóa

Tài liệu này hướng dẫn cách xử lý lỗi trong hệ thống DX-VAS theo chuẩn 5⭐, đảm bảo mọi API trả lỗi một cách nhất quán, rõ ràng và có thể truy vết được.  

---

## 1. 🧠 Triết lý Xử lý Lỗi

- Tất cả lỗi đều phải **có cấu trúc thống nhất** và dễ hiểu với client.
- Không trả lỗi raw hoặc stack trace cho client – hãy map về mã lỗi có ý nghĩa nghiệp vụ.
- Phân biệt rõ lỗi nghiệp vụ (`4xx`) và lỗi hệ thống (`5xx`).
- Mỗi lỗi đều phải log `trace_id`, mã lỗi, và nguyên nhân.

> Tham khảo:
> - [ADR-011 - API Error Format](../../ADR/adr-011-api-error-format.md)  
> - [ADR-012 - Response Structure](../../ADR/adr-012-response-structure.md)

---

## 2. 📦 Cấu trúc Chuẩn của Response Lỗi

Mọi lỗi API phải có dạng sau:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Trường email không hợp lệ"
  },
  "meta": {
    "request_id": "req-abc123",
    "timestamp": "2025-06-05T10:00:00Z"
  }
}
```

* `error.code`: mã lỗi (xem phần danh sách mã lỗi bên dưới)
* `error.message`: mô tả ngắn gọn cho client
* `meta`: bắt buộc có `request_id` và `timestamp`

---

## 3. 📚 Danh sách Mã Lỗi Chuẩn

| Mã lỗi                  | HTTP Code | Mô tả ngắn                                 |
| ----------------------- | --------- | ------------------------------------------ |
| `VALIDATION_ERROR`      | 400       | Dữ liệu đầu vào không hợp lệ               |
| `UNAUTHORIZED`          | 401       | Thiếu hoặc sai token                       |
| `FORBIDDEN`             | 403       | Không có quyền truy cập                    |
| `NOT_FOUND`             | 404       | Tài nguyên không tồn tại                   |
| `CONFLICT`              | 409       | Trạng thái xung đột (VD: email đã tồn tại) |
| `RATE_LIMIT_EXCEEDED`   | 429       | Quá số lần gọi API cho phép                |
| `INTERNAL_SERVER_ERROR` | 500       | Lỗi không xác định từ server               |
| `DEPENDENCY_FAILURE`    | 502       | Service phụ trợ (DB, Pub/Sub...) lỗi       |

> Tùy vào service, có thể mở rộng mã lỗi cho nghiệp vụ đặc thù (VD: `TEMPLATE_INVALID`, `USER_SUSPENDED`)

---

## 4. 🧰 Hướng dẫn Cài đặt Middleware Bắt Lỗi

* Backend phải có middleware để:

  * Catch exception
  * Map về cấu trúc `ErrorEnvelope`
  * Gắn `request_id` từ header vào `meta`
* Ví dụ (FastAPI):

```python
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=400,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": str(exc)
            },
            "meta": {
                "request_id": request.headers.get("X-Request-ID"),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        }
    )
```

---

## 5. 🧪 Kiểm thử Trả Lỗi

* Test các case 400/401/403/404/409/500
* Kiểm tra:

  * Đúng `status code`
  * Đúng `error.code`
  * Có đầy đủ `meta.request_id` và `timestamp`
* Dùng Postman hoặc pytest để viết test case mock input lỗi

---

## 6. ❌ Những Điều Không được Làm

* Không trả lỗi `500 Internal Server Error` trừ khi không có cách phân loại khác
* Không log lỗi dạng raw stack trace gửi về client
* Không nuốt lỗi silently – phải log tất cả `ERROR` với context đầy đủ
* Không trả thông báo lỗi chung chung như “Đã xảy ra lỗi”, “Something went wrong”

---

> 📌 Ghi nhớ: Lỗi là cách hệ thống trò chuyện với người dùng – hãy nói đúng, đủ, và có trách nhiệm.
