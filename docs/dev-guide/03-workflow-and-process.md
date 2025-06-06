# 🔁 03. Quy trình Làm việc với Git, Pull Request và CI/CD

Quy trình làm việc chuẩn mực giúp team phát triển DX-VAS cộng tác hiệu quả, hạn chế xung đột, và tự động hóa kiểm tra chất lượng code trước khi đưa vào môi trường chính thức.

---

## 🪢 Git Branching Strategy

| Nhánh                  | Mục đích                                                           |
|------------------------|---------------------------------------------------------------------|
| `main`                 | Nhánh chính, luôn ở trạng thái **có thể triển khai Production**. Chỉ merge từ `dev` sau khi kiểm thử xong. |
| `dev`                  | Nhánh **phát triển tổng**, nơi tích hợp các feature và tự động deploy lên môi trường **Staging**. |
| `feature/*`            | Nhánh cho từng tính năng mới. Đặt tên theo định dạng:<br> `feature/DX-123-add-reporting-api` |
| `bugfix/*`             | Nhánh xử lý lỗi trên `dev` hoặc `staging`. Định dạng:<br> `bugfix/DX-456-fix-pagination` |
| `hotfix/*`             | Nhánh sửa lỗi khẩn cấp trực tiếp trên `main`. Được merge và deploy nhanh.<br> Ví dụ: `hotfix/DX-999-fix-token-bug` |

---

## 📝 Commit Message Convention

Áp dụng chuẩn [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) giúp:

- Dễ đọc lịch sử commit
- Tích hợp tốt với changelog tự động, release note
- Tự động trigger pipeline hoặc semantic versioning

### 📌 Một số ví dụ chuẩn:

| Prefix     | Mục đích sử dụng                              |
|------------|-----------------------------------------------|
| `feat:`    | Thêm mới tính năng                            |
| `fix:`     | Sửa lỗi logic, bug cụ thể                     |
| `docs:`    | Cập nhật tài liệu                             |
| `style:`   | Định dạng lại code, không ảnh hưởng logic     |
| `refactor:`| Cải tiến cấu trúc code mà không đổi hành vi   |
| `test:`    | Thêm / sửa test (unit, integration)           |
| `chore:`   | Cập nhật dependency, CI, file phụ trợ         |

📌 **Ví dụ thực tế:**

```bash
feat: add new endpoint for report templates
fix: correct pagination logic in list users API
docs: update README with new architecture diagram
style: format code with black
refactor: improve query performance for user lookup
test: add unit tests for RBAC validator
chore: update dependencies
```

---

## 🔄 Pull Request (PR) Process

1. Tạo PR từ nhánh `feature/*`, `bugfix/*` hoặc `hotfix/*` vào **`dev`** (hoặc `main` nếu hotfix production).
2. Điền đầy đủ thông tin theo template PR:

   * Link tới ticket (Jira/Trello)
   * Mô tả thay đổi
   * Screenshot nếu có thay đổi giao diện
   * Checklist testing
3. Đảm bảo pipeline CI/CD pass toàn bộ:

   * ✅ `pre-commit` lint (black, isort, flake8…)
   * ✅ `pytest` hoặc `unit test`
   * ✅ Build docker image nếu cần
4. Phải có **ít nhất 1-2 người review và approve**, ưu tiên từ nhóm liên quan trực tiếp hoặc team kiến trúc nếu thay đổi lớn.
5. Khi merge, chọn **Squash & Merge** để giữ lịch sử commit rõ ràng và gọn gàng.

---

## 🚀 Ghi chú CI/CD

* Mỗi push/PR sẽ trigger tự động:

  * Kiểm tra lint + test
  * Đóng gói docker
  * Deploy lên môi trường staging (nếu branch là `dev`)
* Không được merge nếu pipeline CI fail
* Để kiểm tra CI config, xem thêm: `ci-guide.md` (sẽ có sau)
