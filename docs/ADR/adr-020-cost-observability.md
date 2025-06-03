---
id: adr-020-cost-observability
title: ADR-020 - Theo dõi và tối ưu chi phí vận hành cho hệ thống dx-vas
status: accepted
author: DX VAS Platform Team
date: 2025-05-22
tags: [observability, cost, monitoring, cloud-run, dx-vas]
---

## 📌 Bối cảnh

Chi phí vận hành hệ thống **dx-vas** bao gồm:
- Dịch vụ Cloud Run (API Gateway, adapters, frontend SSR...)
- Cloud Storage, Firestore, Redis (MemoryStore), BigQuery
- Logging & Monitoring (Cloud Logging, Cloud Monitoring)
- Traffic egress (khi gọi external API hoặc frontend SSR qua CDN)

Trong quá khứ đã xảy ra các vấn đề như:
- Cloud Run scale quá mức → tăng đột biến chi phí hàng tháng
- Logging quá chi tiết → tăng chi phí Cloud Logging
- Redis giữ session không xóa → billing tăng không kiểm soát

Cần một chiến lược chủ động để **giám sát, dự đoán và tối ưu chi phí cloud**, vừa để tiết kiệm, vừa để sớm phát hiện bất thường.

---

## 🧠 Quyết định

**Áp dụng hệ thống quan sát và cảnh báo chi phí theo từng dịch vụ và tài nguyên chính của hệ thống dx-vas. Tích hợp với dashboard theo dõi real-time, báo cáo định kỳ, và cảnh báo vượt ngưỡng.**

---

## 💰 Các nguồn chi phí chính

| Nguồn | Công cụ | Đơn vị | Cảnh báo đề xuất |
|-------|--------|--------|------------------|
| Cloud Run | Google Cloud Billing | VND/hour | > 300K/ngày/service |
| Redis | MemoryStore billing | GB RAM/hour | > 4 GB hoặc > 100K ops/min |
| Cloud Logging | Logging bytes | GB/ngày | > 1GB/ngày/service |
| BigQuery | Storage & Query | GB scanned | > 5GB/ngày |
| Cloud Monitoring | Uptime/Alerting | API calls | Không cần alert, nhưng log usage |
| Firestore / Storage | GB stored + reads | GB & IOPS | Theo dõi xu hướng tăng liên tục |

---

## 📊 Dashboard & Phân nhóm chi phí

Tạo dashboard chi phí trong **Cloud Billing > Budgets & reports**:
- Nhóm theo `service.label`, `resource.name`, `project`
- Gán tag: `env=prod|staging|dev`, `owner=platform|lms|crm`, `critical=true`
- Gắn cost attribution qua label: `dx-vas_service`, `env`, `module`

Mỗi service Cloud Run nên có ít nhất:
- `cloud.googleapis.com/run/container/start_count`
- `cloud.googleapis.com/run/request_count`
- `billing/cost` metric qua Cloud Monitoring + BigQuery export

### 📈 Chi phí Reporting Service & BigQuery

#### 💰 Bổ sung bảng chi phí:

| Nguồn             | Công cụ         | Đơn vị     | Cảnh báo đề xuất |
| ----------------- | --------------- | ---------- | ---------------- |
| Reporting Service | Cloud Run       | VND/hour   | > 150K/ngày      |
| BigQuery          | Query & Storage | GB scanned | > 5GB/ngày       |

#### 📊 Dashboard & Attribution (bổ sung):

* Label gợi ý cho Reporting Service:

  * `dx-vas_service=reporting-service`
  * `module=reporting`
  * `critical=true`

* Với BigQuery:

  * Gắn label `report_query_type=dashboard|ad-hoc|scheduled`
  * Theo dõi cụ thể các query chạy bởi Reporting Service (qua `user_email`, `labels` trong `INFORMATION_SCHEMA.JOBS`)

---

## 🚨 Alerting & Noti

- Thiết lập Cloud Budget alert:
  - >90% monthly quota → gửi email/slack
  - >110% week-over-week cost → Slack + log
- Alert rule (Monitoring):
  - Redis memory > 80%
  - Logging usage > 1GB/day/service
  - Cloud Run instance spike > 3x bình thường trong 15 phút
  - Query nào vượt >1GB scanned → gắn vào log cảnh báo
  - Tần suất báo cáo tự động > 100 lần/ngày → cảnh báo spam
  - Tổng chi phí BigQuery > 2M VND/tháng → Slack alert

---

## 🛠 Tích hợp kỹ thuật

- Tự động export billing → BigQuery
- Giao diện dashboard qua Looker Studio hoặc Metabase (nếu private)
- Script cron phân tích log: log traffic vượt 100K req/day/service → gửi cảnh báo
- Gắn cost estimator vào CI/CD (Terraform plan → ước lượng chi phí)

---

## ✅ Lợi ích

- Dự báo chi phí theo thời gian thực
- Phát hiện sớm bất thường do cấu hình sai (scale, cache, logging)
- Tối ưu billing từng microservice rõ ràng
- Phân bổ chi phí công bằng theo team/module

---

## ❌ Rủi ro & Giải pháp

| Rủi ro | Giải pháp |
|--------|-----------|
| Quá nhiều alert gây nhiễu | Gộp alert theo nhóm, alert only trend not spikes |
| Không gán tag cost → không trace được | CI enforce label & billing tag trên resource |
| Cloud Billing export bị ngắt | Có job kiểm tra cron export hoạt động liên tục |

---

## 📎 Tài liệu liên quan

- Auto Scaling: [ADR-016](./adr-016-auto-scaling.md)
- CI/CD Strategy: [ADR-001](./adr-001-ci-cd.md)
- IaC Strategy: [ADR-002](./adr-002-iac.md)

---
> “Không quan sát được chi phí, sớm muộn sẽ vượt ngân sách.”
