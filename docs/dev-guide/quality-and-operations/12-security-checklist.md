# 🔒 12. Security Checklist – Danh sách Kiểm tra Bảo mật cho Lập trình viên

Tài liệu này cụ thể hóa [ADR-004 - Security Policy](../ADR/adr-004-security.md) thành một danh sách kiểm tra hành động cho lập trình viên. Mục tiêu là đảm bảo mọi commit và Pull Request (PR) đều tuân thủ các nguyên tắc bảo mật cốt lõi.

---

## 1. ✅ Checklist Bảo mật Trước khi Merge PR

Dựa trên OWASP Top 10:

| Mục kiểm tra                                          | Bắt buộc | Ghi chú |
|--------------------------------------------------------|----------|---------|
| [ ] Validate và sanitize toàn bộ input từ client       | ✅       | Không tin bất kỳ dữ liệu nào từ frontend |
| [ ] Không trả lỗi raw/stack trace ra client            | ✅       | Dùng chuẩn `ErrorEnvelope` |
| [ ] Không log thông tin nhạy cảm (token, password...)  | ✅       | Đặc biệt trong production |
| [ ] Không hard-code secret/key/API token               | ✅       | Dùng biến môi trường |
| [ ] Dữ liệu quan trọng có được mã hóa nếu cần          | ✅       | VD: mã OTP, backup token |
| [ ] Truy cập API được kiểm tra permission rõ ràng      | ✅       | Dùng `x-required-permission` |
| [ ] Rate-limit/Throttling được thiết lập nếu cần       | ⚠️       | Đặc biệt với các endpoint nhạy cảm |
| [ ] Đầu ra được encode đúng cách (HTML/JSON...)        | ✅       | Tránh XSS |
| [ ] Cập nhật thư viện phụ thuộc định kỳ                | ⚠️       | Dùng `npm audit`, `poetry check` |
| [ ] Có unit test và integration test cho các case edge | ✅       | Bao gồm cả input độc hại |

---

## 2. 🛡️ Làm sạch và Validate Input

- Sử dụng schema validation (VD: Pydantic, Joi...) cho toàn bộ body/query/params.
- Không xử lý logic với dữ liệu chưa validate.
- Các kiểm tra nên bao gồm:
  - Kiểu dữ liệu, độ dài, regex, whitelist
  - Sanitization đầu vào: loại bỏ ký tự lạ, escape HTML
- Tránh SQL Injection / NoSQL Injection bằng cách:
  - **Không bao giờ** nối chuỗi SQL bằng string format
  - Dùng parameter binding trong ORM

---

## 3. 🔐 Quản lý JWT Token ở Frontend

- **Không bao giờ lưu token trong localStorage.**
  - Ưu tiên lưu trong `HttpOnly Secure Cookie` để tránh XSS.
- Nếu buộc phải lưu (SPA), phải đảm bảo:
  - Token được mã hóa và prefix xác định
  - Auto logout khi token hết hạn
  - Xóa sạch khi `logout` hoặc tab bị đóng

### Gợi ý các biện pháp bảo vệ:

| Cơ chế             | Mục đích                        |
|--------------------|----------------------------------|
| `SameSite=Strict`  | Ngăn CSRF                        |
| `Secure`           | Chỉ truyền qua HTTPS             |
| `HttpOnly`         | Không cho JavaScript truy cập    |
| Token rotation     | Làm mới token định kỳ            |

---

## 4. 🔏 Mã hóa Dữ liệu trong CSDL

### Khi nào cần:
- Dữ liệu nhạy cảm: mã OTP, recovery code, mã hóa cấu hình email nội bộ...
- Dữ liệu backup hoặc event log có thông tin cá nhân

### Cách thực hiện:
- Dùng thư viện mã hóa đối xứng AES (Python: `cryptography.fernet`, Node: `crypto`)
- Lưu `encryption_key` trong Secret Manager hoặc thông qua biến ENV
- Mã hóa khi ghi vào DB, giải mã khi truy vấn
- Không nên mã hóa toàn bộ bảng → chỉ cột cần thiết

```python
from cryptography.fernet import Fernet
f = Fernet(os.environ['ENCRYPTION_KEY'])

encrypted = f.encrypt(b"123456")
decrypted = f.decrypt(encrypted)
```

---

## 5. 🚨 Logging & Alert Liên quan tới Bảo mật

* Log các hành vi bất thường:

  * Đăng nhập thất bại nhiều lần
  * Truy cập API không đúng permission
  * JWT bị từ chối (hết hạn, giả mạo)
* Thiết lập cảnh báo:

  * Gửi Slack/email nếu có 5xx tăng đột biến
  * Theo dõi access log để phát hiện DDoS

---

## 6. 🚫 Những điều tuyệt đối không được làm

* ❌ Log `Authorization`, `password`, `OTP`, `JWT`, `secret`
* ❌ Bỏ qua middleware RBAC hoặc Auth cho endpoint "tạm thời"
* ❌ Tắt CSRF hoặc CORS kiểm soát sai cách
* ❌ Dùng `eval()` hoặc tương tự trên dữ liệu không tin cậy
* ❌ Lưu mật khẩu người dùng ở dạng plain text (phải hash bằng bcrypt/scrypt)

---

> 📌 Ghi nhớ: Một dòng code thiếu kiểm tra bảo mật có thể phá vỡ toàn bộ hệ thống. Hãy luôn checklist kỹ lưỡng trước khi nhấn merge.
