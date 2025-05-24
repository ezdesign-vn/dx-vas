# 📘 Interface Contract – SIS Adapter (dx\_vas)

## 🧭 Mục tiêu

Tài liệu này mô tả hợp đồng giao tiếp (interface contract) của **SIS Adapter** – hệ thống quản lý học sinh chính thức:

* Quản lý thông tin hồ sơ học sinh
* Đồng bộ dữ liệu với LMS, CRM và Admin Webapp
* Phục vụ cho các nghiệp vụ như đăng ký lớp, điều chuyển, thống kê

---

## 🧩 Endpoint SIS phơi ra (Provider API)

| Method | Endpoint                  | Mô tả                                          | Input Schema / Query Params                                                 | Output Schema      | Permission Code       |
| ------ | ------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------- | ------------------ | --------------------- |
| GET    | `/students`               | Danh sách học sinh                             | `page: int`, `limit: int`, `class_id?: UUID`, `status?: str`, `grade?: int` | `List[StudentOut]` | `VIEW_STUDENT_ALL`    |
| GET    | `/students/{id}`          | Thông tin chi tiết học sinh                    | —                                                                           | `StudentOut`       | `VIEW_STUDENT_DETAIL` |
| POST   | `/students`               | Tạo học sinh mới (nhập học)                    | `StudentCreate`                                                             | `StudentOut`       | `CREATE_STUDENT`      |
| PATCH  | `/students/{id}`          | Cập nhật hồ sơ học sinh                        | `StudentUpdate`                                                             | `StudentOut`       | `EDIT_STUDENT`        |
| POST   | `/students/{id}/transfer` | Điều chuyển học sinh                           | `TransferRequest`                                                           | `StudentOut`       | `TRANSFER_STUDENT`    |
| POST   | `/students/batch`         | Lấy danh sách thông tin học sinh theo nhiều ID | `student_ids: List[UUID]`                                                   | `List[StudentOut]` | `VIEW_STUDENT_ALL`    |

> Endpoint `/students` hỗ trợ phân trang chuẩn với `page`, `limit`. Để lấy dữ liệu chi tiết theo danh sách ID cụ thể (ví dụ: cho lớp học), dùng `/students/batch`.

---

## 🔁 SIS gọi các hệ thống khác

| Target       | Method | Endpoint                 | Mô tả                                             |
| ------------ | ------ | ------------------------ | ------------------------------------------------- |
| Notification | POST   | `/notifications/send`    | Gửi thông báo nhập học thành công hoặc chuyển lớp |
| LMS Adapter  | PUT    | `/lms/sync/student/{id}` | Đồng bộ thông tin hồ sơ mới hoặc đã cập nhật      |

---

## 🔐 Xác thực & RBAC

* Mọi endpoint gọi qua API Gateway → cần JWT
* Forward header gồm: `X-User-ID`, `X-Role`, `X-Permissions`, `Trace-ID`
* Mọi endpoint đều yêu cầu permission cụ thể → kiểm tra `X-Permissions` tại backend (không cần decode JWT)

---

## 📦 Response structure

Tuân thủ [ADR-012](../ADR/adr-012-response-structure.md):

```json
{
  "data": {...},
  "error": null,
  "meta": {
    "trace_id": "...",
    "timestamp": "...",
    "source": "sis_adapter"
  }
}
```

---

## ⚠️ Lỗi đặc thù

| Code                | Mô tả                                                            |
| ------------------- | ---------------------------------------------------------------- |
| `STUDENT_NOT_FOUND` | Không tồn tại học sinh với ID tương ứng                          |
| `INVALID_CLASS_ID`  | Class không tồn tại hoặc không thuộc campus người dùng phụ trách |
| `TRANSFER_CONFLICT` | Điều chuyển không hợp lệ do trạng thái học sinh                  |

---

## ✅ Ghi chú

* Mọi hành động tạo/cập nhật học sinh đều tạo audit log
* Mọi thao tác cập nhật hồ sơ học sinh phải đồng bộ sang LMS
* Các trường `status` có thể là `admitted`, `studying`, `transferred`, `left`
* Các endpoint trả danh sách nên luôn hỗ trợ `page`, `limit` để đảm bảo hiệu năng và giảm tải frontend

---

## 📎 Tài liệu liên quan

* [ADR-006: Auth Strategy](../ADR/adr-006-auth-strategy.md)
* [ADR-007: RBAC Dynamic](../ADR/adr-007-rbac.md)
* [ADR-011: API Error Format](../ADR/adr-011-api-error-format.md)
* [ADR-012: Response Structure](../ADR/adr-012-response-structure.md)
* [ADR-008: Audit Logging](../ADR/adr-008-audit-logging.md)

---

> “SIS là hệ tim của hệ thống giáo dục – nơi dữ liệu học sinh luôn được duy trì chính xác, đầy đủ, và đồng bộ.”
