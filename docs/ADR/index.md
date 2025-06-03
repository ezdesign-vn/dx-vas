# 📘 ADR Index – dx-vas

> Danh sách và phạm vi áp dụng của các **Architecture Decision Records (ADR)** cho hệ thống dx-vas. Bảng dưới đây liệt kê từng ADR, các service bị ảnh hưởng và vai trò/điểm nhấn triển khai đặc biệt nếu có.

| ADR | Áp dụng cho Service | Vai trò/Điểm nhấn triển khai |
|-----|----------------------|-------------------------------|
| [ADR-001: CI/CD](./adr-001-ci-cd.md) | Tất cả services (core + tenant stack) | ✅ Tách pipeline theo stack; ✅ Sử dụng GitHub Actions và Environments |
| [ADR-002: IaC](./adr-002-iac.md) | Hạ tầng GCP toàn hệ thống | ✅ Tách Terraform module cho core/tenant; hỗ trợ provisioning tự động |
| [ADR-003: Secrets](./adr-003-secrets.md) | Tất cả services | ✅ Secret per tenant (Zalo, Gmail); quản lý bằng Secret Manager & rotate riêng |
| [ADR-004: Security](./adr-004-security.md) | Tất cả services | ✅ Gateway enforce JWT trust boundary; ✅ Mỗi tenant có project/DB/network riêng |
| [ADR-005: Env Config](./adr-005-env-config.md) | Tất cả services | ✅ Mỗi stack có env riêng (`dev`, `staging`, `prod`) |
| [ADR-006: Auth Strategy](./adr-006-auth-strategy.md) | Auth Service, API Gateway | ✅ Sub Auth login OTP; ✅ Master Auth Google; JWT có `tenant_id` |
| [ADR-007: RBAC](./adr-007-rbac.md) | User Service, API Gateway | ✅ RBAC phân tầng; Gateway đọc Redis theo `user_id` + `tenant_id` |
| [ADR-008: Audit Logging](./adr-008-audit-logging.md) | Tất cả services | ✅ Log hành vi có side-effect; ✅ Audit log có `tenant_id`, traceId |
| [ADR-009: API Governance](./adr-009-api-governance.md) | Tất cả services phơi API | ✅ Kiểm tra OpenAPI + tagging module trong CI |
| [ADR-010: Contract Testing](./adr-010-contract-testing.md) | Tất cả services phơi API | ✅ Hợp đồng test có `tenant_id`, JWT context |
| [ADR-011: API Error Format](./adr-011-api-error-format.md) | Tất cả services phơi API | ✅ Dùng chung ErrorEnvelope (code/message/details) |
| [ADR-012: Response Structure](./adr-012-response-structure.md) | Tất cả services phơi API | ✅ Chuẩn `meta`, `data`, `errors`; dễ monitoring |
| [ADR-013: Path Naming Convention](./adr-013-path-naming-convention.md) | Tất cả services phơi API | ✅ Tuân thủ RESTful, phân loại rõ tài nguyên |
| [ADR-014: Zero Downtime Deployment](./adr-014-zero-downtime.md) | Tất cả services | ✅ Tách migration & deploy; rollback dễ dàng |
| [ADR-015: Deployment Strategy](./adr-015-deployment-strategy.md) | Core & tenant stack | ✅ Stack per tenant; Gateway chia theo domain/host |
| [ADR-016: Auto Scaling](./adr-016-auto-scaling.md) | Tất cả services (Cloud Run) | ✅ Core và tenant scale độc lập; cấu hình min/max instance |
| [ADR-017: Env Deploy Boundary](./adr-017-env-deploy-boundary.md) | Tất cả services | ✅ Mỗi tenant có môi trường riêng biệt |
| [ADR-018: Release Approval Policy](./adr-018-release-approval-policy.md) | Core & tenant stack | ✅ Core phải duyệt thủ công; tenant có thể tự động nếu an toàn |
| [ADR-019: Project Layout](./adr-019-project-layout.md) | GCP project toàn hệ thống | ✅ Chia project: core, tenant, monitoring, data |
| [ADR-020: Cost Observability](./adr-020-cost-observability.md) | Tất cả services | ✅ Tách chi phí per tenant; billing label theo service/group |
| [ADR-021: External Observability](./adr-021-external-observability.md) | Tùy chọn cho tenant stack | ✅ Cho phép tích hợp Prometheus, Grafana, Datadog nếu cần |
| [ADR-022: SLA, SLO, Monitoring](./adr-022-sla-slo-monitoring.md) | Tất cả services | ✅ Alert/log theo `tenant_id`; dashboard riêng mỗi tenant |
| [ADR-023: Schema Migration Strategy](./adr-023-schema-migration-strategy.md) | Các service có DB schema | ✅ Tuân thủ 3 bước: prepare, transition, cleanup |
| [ADR-024: Data Anonymization & Retention](./adr-024-data-anonymization-retention.md) | Dịch vụ xử lý PII | ✅ TTL per table; masking log; anonymize sandbox data |
| [ADR-025: Multi-Tenant Versioning](./adr-025-multi-tenant-versioning.md) | Core & tenant stack | ✅ Cho phép mỗi tenant chọn version riêng; hỗ trợ rollout lệch phiên bản |
| [ADR-026: Hard Delete Policy](./adr-026-hard-delete-policy.md) | Tất cả service có dữ liệu nhạy cảm | ✅ Xác định tiêu chí không được xoá vật lý; sử dụng soft delete và audit |
| [ADR-027: Data Management Strategy](./adr-027-data-management-strategy.md) | Toàn hệ thống | ✅ Chuẩn hoá phân loại dữ liệu, retention, purge, schema, access, bảo mật |
| [ADR-028: Reporting Service Design](./adr-028-reporting-architecture.md) | Reporting Service | ✅ Tách backend chuyên biệt cho báo cáo; sử dụng Data Warehouse và RBAC theo template |
| [ADR-029: Report Template Schema](./adr-029-report-template-schema.md) | Reporting Service + Superadmin Webapp | ✅ Chuẩn hóa cấu trúc report_template; hỗ trợ input validation, versioning, metadata RBAC |
| [ADR-030: Event Schema Governance](./adr-030-event-schema-governance.md) | Tất cả services phát sự kiện (User, Auth, Notification, Adapters) | ✅ Chuẩn hóa schema sự kiện, versioned, lưu tại event registry; hỗ trợ backward compatibility |

---

> 🔎 Gợi ý sử dụng: Nếu bạn triển khai service mới, hãy rà soát bảng này để đảm bảo service tuân thủ đầy đủ các ADR tương ứng và ghi rõ mọi điểm triển khai đặc biệt (nếu có) trong Interface Contract.
