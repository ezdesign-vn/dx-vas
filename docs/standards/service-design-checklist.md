## ✅ Checklist Chuẩn Thiết kế Service DX-VAS

| Hạng mục                                     | Trạng thái | Ghi chú                               |
| -------------------------------------------- | ---------- | ------------------------------------- |
| **1. design.md**                             | ☐          | Tuân theo `design.template.md`        |
| – Mô tả rõ use case, trigger chính           | ☐          | Business logic, external interaction  |
| – Có module nội bộ rõ ràng (service view)    | ☐          | Dispatcher, Manager, Worker, v.v.     |
| – Tương tác service khác (Pub/Sub, API call) | ☐          | Vẽ flow hoặc sequence diagram nếu cần |
| – Kế hoạch cấu hình & phụ thuộc              | ☐          | .env, secret, external service        |
| – Chiến lược kiểm thử & triển khai           | ☐          | Unit, integration, migration          |
| – Kế hoạch giám sát & khôi phục lỗi          | ☐          | Logging, tracing, retry               |

---

| **2. interface-contract.md**          | ☐          | Tuân theo `interface-contract.template.md` |
| – Đầy đủ tất cả endpoint chính        | ☐          | CRUD + đặc thù nghiệp vụ |
| – Có mô tả request/response rõ ràng   | ☐          | Headers, params, body |
| – Áp dụng `x-required-permission`     | ☐          | Chuẩn theo RBAC |
| – Mô tả ENUM, permission mapping      | ☐          | Hỗ trợ frontend/dev hiểu |

---

| **3. data-model.md**                  | ☐          | Tuân theo `data-model.template.md` |
| – Có sơ đồ ERD đầy đủ                 | ☐          | Sử dụng Mermaid hoặc tool khác |
| – Mô tả rõ tất cả bảng và cột         | ☐          | Kèm kiểu dữ liệu, mô tả |
| – Có indexes, constraints             | ☐          | Unique, FK, composite indexes |
| – Có chiến lược Retention & TTL       | ☐          | Batch job, archive, auto-delete |
| – Có phụ lục ENUM, access control     | ☐          | Enum mở rộng nếu cần |
| – Có phụ lục chiến lược kiểm thử DB   | ☐          | Seed, fixture, rollback logic |

---

| **4. openapi.yaml**                   | ☐          | Tuân theo `openapi.template.yaml` |
| – Dùng `OpenAPI 3.0.3`, có `info`, `servers`, `tags` | ☐ | Chuẩn hóa toàn cục |
| – Mỗi operation có `summary`, `operationId`, `x-required-permission` | ☐ | Rõ ràng |
| – Tái sử dụng `components.responses`, `parameters`, `headers`, `schemas` | ☐ | Không lặp lại |
| – Có `examples`, `readOnly`, `writeOnly` | ☐        | Đủ cho request/response |
| – Các lỗi `400`, `404`, `default` tách rõ | ☐      | Chuẩn hóa lỗi theo `ADR-012` |
| – Có hỗ trợ pagination (nếu áp dụng) | ☐          | `page`, `limit` |

---

## 🚦 Tổng kết

| Giai đoạn                       | Trạng thái | Ghi chú                              |
| ------------------------------- | ---------- | ------------------------------------ |
| Thiết kế business và kỹ thuật   | ☐          | design.md                            |
| Thiết kế contract & API         | ☐          | interface-contract.md + openapi.yaml |
| Thiết kế cơ sở dữ liệu          | ☐          | data-model.md                        |
| Chuẩn bị cho phát triển & CI/CD | ☐          | contract test-ready                  |

---

## 📦 Sẵn sàng cho

| Mục tiêu                               | Trạng thái | Ghi chú                                                    |
| -------------------------------------- | ---------- | ---------------------------------------------------------- |
| **Contract Testing (`ADR-010`)**       | ☐          | `openapi.yaml` đầy đủ schema, response, ví dụ              |
| **Mock Server / Auto-Generated SDK**   | ☐          | Có `examples`, `readOnly`, `operationId`                   |
| **CI/CD Integration (`ADR-001`)**      | ☐          | Có thể kiểm tra qua linter, test runner                    |
| **Đồng bộ RBAC (`ADR-007`)**           | ☐          | `x-required-permission` có ở tất cả endpoints              |
| **Frontend Integration**               | ☐          | Contract rõ ràng, dùng `ErrorEnvelope`, headers thống nhất |
| **Phát triển Backend**                 | ☐          | Có đủ thông tin logic, DB, API, event flow                 |
| **Tự động sinh dữ liệu mẫu (seeding)** | ☐          | `data-model.md` có ví dụ mẫu rõ ràng                       |
| **Giám sát & Logging (`ADR-008`)**     | ☐          | Có phần mô tả `X-Request-ID`, tracing                      |
| **Triển khai & cấu hình (`ADR-005`)**  | ☐          | `.env`, secret, pubsub topic/DB đã định nghĩa              |

