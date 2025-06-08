---
id: adr-006-auth-strategy
title: ADR-006 - Chiến lược xác thực & quản lý vòng đời token cho hệ thống dx-vas
status: accepted
author: DX VAS Platform Team
date: 2025-06-09
tags: [auth, token, security, dx-vas, oauth2, otp, jwt]
---

# ADR-006: Chiến lược Xác thực (Auth Strategy)

## 📌 Bối cảnh (Context)

Hệ thống **dx-vas** phục vụ nhiều nhóm người dùng:

- **Nhân viên, giáo viên, học sinh** (một số tenant): đăng nhập Google Workspace (OAuth2).  
- **Phụ huynh & học sinh** (ở các trường chưa dùng Google): đăng nhập Local/OTP.  
- **Một người dùng có thể thuộc nhiều tenant** với vai trò khác nhau.

Ban đầu, mỗi **Auth Service** (Master & Sub) tự phát hành JWT. **Change Request 03-cr-token-service** đã chỉ ra rủi ro bảo mật, SPOF và khó audit khi logic tạo token bị _phân tán_ :contentReference[oaicite:0]{index=0}.  
**Quyết định:** _Tập trung_ toàn bộ vòng đời token vào **TokenService** – micro-service nền tảng ký JWT bất đối xứng (RS256), hỗ trợ thu hồi tức thời và cung cấp JWKS công khai.

---

## 🧠 Quyết định (Decision)

### 1. Kiến trúc xác thực & vòng đời token

| Thành phần | Vai trò chính |
|------------|---------------|
| **Auth Service Master** | Xác thực Google OAuth2, chọn tenant, gọi TokenService để _issue_ / _refresh_ token |
| **Sub Auth Service (per tenant)** | Xác thực Local/OTP, gọi TokenService tương tự |
| **TokenService** | “Nhà máy” duy nhất phát hành, làm mới, thu hồi, introspect JWT |
| **API Gateway** | Xác thực chữ ký RS256 _offline_ bằng JWKS; chỉ gọi `POST /token/introspect` khi cần kiểm tra **revoked_tokens** |

### 2. Tầng xác thực (Authentication Layers)

| Layer | Luồng xử lý |
|-------|-------------|
| **Google OAuth2** | User → Auth Master → Google → Auth Master → (User Service Master + Sub User) → **TokenService** |
| **Local/OTP** | User → Sub Auth Service → (User Service Master + Sub User) → **TokenService** |

Các bước gọi User Service và API Gateway không đổi so với bản trước :contentReference[oaicite:1]{index=1}; điểm mới là **TokenService** ở cuối luồng.

### 3. **TokenService** – chi tiết

- **Endpoint chuẩn**  
  - `POST /token/issue` – phát _access_ & _refresh_ token  
  - `POST /token/refresh` – làm mới _access_ token  
  - `POST /token/revoke` – thu hồi theo `jti` / `sid`  
  - `POST /token/introspect` – kiểm tra token (chỉ dùng khi cần)  
  - `GET /.well-known/jwks.json` – JWKS công khai (có header `Cache-Control: public, max-age=600`)  
- **Ký bất đối xứng RS256** — private key lưu Secret Manager; rotate tối đa **90 ngày/lần** theo `ADR-003` :contentReference[oaicite:2]{index=2}.  
- **Xuất sự kiện** `token.issued` / `token.revoked` lên Pub/Sub cho Audit-Logging.

### 4. JWT & Key Management

| Claim | Mô tả |
|-------|-------|
| `sub`  | `user_id_global` |
| `tid`  | `tenant_id` |
| `roles` | Mảng `role_code` |
| `perms` | (tuỳ chọn) `permission_code[]` |
| `jti`  | ID duy nhất, dùng cho thu hồi |
| `sid`  | Session ID – liên kết bảng `auth_sessions` |
| `exp`  | TTL ngắn (≤ 15 phút) |

Key rotation: TokenService giữ **2 key** hoạt động song song (`kid=current|next`); API Gateway chấp nhận cả hai.

### 5. Vòng đời Phiên & Thu hồi token

| Bảng | Trường chính | TTL / Storage |
|------|--------------|---------------|
| `auth_sessions` | `sid`, `user_id`, `tenant_id`, `ip_address`, `user_agent`, `device_type`, `location` | Cloud SQL |
| `revoked_tokens` | `jti`, `revoked_at`, `reason` | Cloud SQL + Redis (cache 15′) |

Thu hồi token: Auth Master/Sub gọi `POST /token/revoke`, TokenService thêm `jti` vào DB, sync Redis (pub/sub cache-invalidation).

### 6. Quy ước Mã lỗi **namespace.error_code**

Ví dụ:

| Namespace | Code | HTTP | Ý nghĩa |
|-----------|------|------|---------|
| `token` | `invalid_signature` | 401 | Chữ ký sai |
| `session` | `not_found` | 404 | Không tìm thấy phiên |
| `common` | `validation_failed` | 400 | Payload sai định dạng |

Danh sách chi tiết được chuẩn hoá tại `ADR-011 – API Error Format`.

### 7. Hệ quả

| Khía cạnh | Lợi ích | Rủi ro / Giải pháp |
|-----------|---------|--------------------|
| **Bảo mật** | Thu hẹp bề mặt tấn công, audit tập trung | Bảo vệ private key; CI check rotate |
| **Hiệu năng** | Gateway verify local, loại bỏ introspection per request | Redis cache `revoked_tokens` cần TTL hợp lý |
| **Vận hành** | Logic token tập trung, dễ quan sát & rollback | Auth Service phải refactor thành client |

---

## 🔗 Liên kết liên quan

- Change Request `03-cr-token-service.md` :contentReference[oaicite:3]{index=3}  
- `ADR-003 – Secrets` :contentReference[oaicite:4]{index=4}  
- `ADR-004 – Security` :contentReference[oaicite:5]{index=5}  
- `ADR-007 – RBAC` :contentReference[oaicite:6]{index=6}  
- `ADR-011 – API Error Format` :contentReference[oaicite:7]{index=7}  
- `RBAC Deep Dive – section 3` :contentReference[oaicite:8]{index=8}

> “Đặt TokenService làm trung tâm – bảo mật, hiệu năng và khả năng mở rộng cùng thăng hạng.”
