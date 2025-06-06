# 🚀 13. CI/CD Pipeline & Environment Operations

Tài liệu này hướng dẫn lập trình viên cách tương tác hiệu quả với quy trình CI/CD và các môi trường vận hành (Staging, Production) trong hệ thống DX-VAS. Mục tiêu là giúp team chủ động theo dõi, kiểm soát và phản ứng nhanh với sự cố.

---

## 1. 🛠️ Tổng quan CI/CD

- CI/CD của hệ thống sử dụng **GitHub Actions + Terraform + Google Cloud Run + GCS + Pub/Sub**.
- Mỗi commit lên nhánh `dev` sẽ:
  - Chạy pipeline: lint → test → build → push container → deploy Staging
- Mỗi commit lên `main` sẽ:
  - Tạo release → trigger deploy lên Production

> CI/CD pipeline được mô tả tại: [ADR-001 - CI/CD Strategy](../ADR/adr-001-ci-cd.md)

---

## 2. 🧪 Môi trường & Nhánh Tương ứng

| Environment   | Git Branch | Tự động Deploy | Domain URL                          |
|---------------|------------|----------------|--------------------------------------|
| Local         | N/A        | ❌ Thủ công     | http://localhost:8001                |
| **Staging**   | `dev`      | ✅ Auto         | https://staging.dx-vas.edu.vn        |
| **Production**| `main`     | ✅ Auto         | https://dx-vas.edu.vn                |

---

## 3. 🚦 Trigger Deploy thủ công (Staging)

Nếu cần deploy lại lên môi trường **Staging** (dù không có commit mới):

1. Vào GitHub → repo `vas/dx-vas`
2. Chọn tab **Actions**
3. Tìm workflow `Deploy to Staging`
4. Nhấn **Run workflow** → chọn branch `dev` → Confirm

---

## 4. 👀 Theo dõi Tiến trình Deploy

- Truy cập tab **Actions** trên GitHub → chọn workflow tương ứng (CI, Staging Deploy, Production Deploy).
- Click vào từng bước để xem log build, test, push image và deploy.
- Kiểm tra service trên GCP:
  - Giao diện: [https://console.cloud.google.com/run](https://console.cloud.google.com/run)
  - Chọn service → Tab **Revisions** để xem trạng thái deploy và traffic split.

---

## 5. 🔁 Rollback Production (nếu lỗi)

1. Truy cập Google Cloud Console → **Cloud Run**
2. Chọn service bị lỗi → tab **Revisions**
3. Tìm bản build ổn định trước đó → Nhấn nút **Roll back to this revision**
4. Kiểm tra lại Logs + Health check

---

## 6. 📈 Xem Logs & Metrics

### Logs:
- Vào [Google Cloud Logging](https://console.cloud.google.com/logs/query)
- Query mẫu theo `service_name` hoặc `trace_id`:
  ```sql
  resource.type="cloud_run_revision"
  resource.labels.service_name="user-service"
  jsonPayload.trace_id="req-abc123"
```

### Metrics:

* Vào [Cloud Monitoring](https://console.cloud.google.com/monitoring)
* Dashboard tổng hợp: `dx-vas-core` / `dx-vas-tenant-*`
* Hoặc vào Grafana (nếu được cấu hình): `https://grafana.dx-vas.vn/`

---

## 7. 🚨 Xử lý Alert từ Hệ thống

* Hệ thống gửi cảnh báo (alert) qua:

  * Slack channel `#dx-vas-alerts`
  * Email nhóm `devops@dx-vas.edu.vn`

### Khi nhận được alert:

| Bước                                 | Mô tả                                             |
| ------------------------------------ | ------------------------------------------------- |
| 1. Xác minh                          | Dựa vào message hoặc link trace/log được đính kèm |
| 2. Kiểm tra Logs                     | Truy vết bằng `trace_id`, `revision`, `timestamp` |
| 3. Kiểm tra lỗi API                  | Dùng Postman hoặc `curl` với token test           |
| 4. Rollback (nếu cần)                | Theo mục 5 ở trên                                 |
| 5. Ghi nhận vào Wiki/Incident Report | Nếu là sự cố nghiêm trọng                         |

---

## 8. ✅ Checklist cho Một Release Ổn định

* [ ] Pull Request đã được review kỹ lưỡng
* [ ] Test Coverage ≥ 80%
* [ ] Đã chạy test local + staging OK
* [ ] Không có breaking change API/schema
* [ ] Đã update changelog / release note
* [ ] Các event schema được sync version đúng

---

> 📌 Ghi nhớ: Dev không chỉ là "code" – dev là người chịu trách nhiệm cho sản phẩm chạy được, ổn định, và có thể rollback nhanh khi cần.

```
```
