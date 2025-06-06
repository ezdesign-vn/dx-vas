# 🎨 05. Frontend Development Guide – Hướng dẫn Phát triển Frontend

Tài liệu này quy định các tiêu chuẩn và thực hành tốt cho việc phát triển frontend (web app) trong hệ thống DX-VAS. Mục tiêu là đảm bảo mọi frontend thống nhất về UI/UX, bảo mật, hiệu suất và dễ bảo trì.

---

## 1. 🧱 Kiến trúc Frontend

- Sử dụng **React + TypeScript** làm framework chính.
- Quản lý state bằng **Zustand** hoặc **React Query**:
  - `Zustand`: dùng cho state ứng dụng đơn giản, nhẹ, dễ mở rộng.
  - `React Query`: dùng cho state liên quan đến remote data (API call, caching).
- **Không dùng Redux** trừ khi thực sự cần:
  > Chỉ dùng Redux khi ứng dụng có **state toàn cục phức tạp**, nhiều luồng tương tác chéo giữa các domain độc lập (ví dụ: dashboard động với nhiều widget tương tác đồng thời, hệ thống drag & drop nhiều tầng phụ thuộc).

- Tổ chức thư mục theo domain (feature-based) để dễ mở rộng:

src/
├── features/
│   ├── users/
│   └── auth/
├── components/
├── hooks/
├── services/
└── utils/

---

## 2. 🎨 UI/UX Design System

- Ưu tiên sử dụng thư viện **shadcn/ui** kết hợp **Tailwind CSS**.
- Các component đều phải responsive (desktop/tablet/mobile).
- Tên class Tailwind ngắn gọn, có comment khi styling phức tạp.
- Áp dụng thiết kế chuẩn theo file Figma đã duyệt từ UI/UX Team.

---

## 3. 📦 Quản lý API & Auth

- Sử dụng `axios` hoặc `fetch` wrapper trong `services/axios.ts`.
- Mọi request phải:
  - Tự động đính kèm `Authorization: Bearer <JWT>`
  - Tự động gắn `X-Request-ID` (nếu có)
  - Retry thông minh nếu lỗi mạng (401, 429)

```ts
axiosInstance.interceptors.request.use((config) => {
  config.headers['Authorization'] = `Bearer ${token}`;
  config.headers['X-Request-ID'] = uuid();
  return config;
});
```

* **Xử lý lỗi API thống nhất:**

  * Sử dụng `axios interceptor` để chuẩn hóa xử lý lỗi theo chuẩn `ErrorEnvelope` từ [ADR-011](../ADR/adr-011-api-error-format.md).
  * Hiển thị lỗi cho người dùng bằng toast/modal theo loại lỗi (`VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, ...)
  * Log `request_id` vào console để hỗ trợ trace lỗi dễ dàng.

```ts
axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => {
    const err = error.response?.data?.error;
    const meta = error.response?.data?.meta;

    if (err?.code === 'UNAUTHORIZED') {
      toast.error('Bạn cần đăng nhập lại.');
    } else if (err?.code === 'VALIDATION_ERROR') {
      toast.error(err.message || 'Dữ liệu không hợp lệ');
    } else {
      toast.error('Có lỗi xảy ra. Mã truy vết: ' + meta?.request_id);
    }

    return Promise.reject(error);
  }
);
```

---

## 4. 🔐 Bảo mật & Phân quyền (RBAC)

* Ẩn/hiện component theo `permissions` lấy từ token đã decode.
* Không hiển thị UI nếu user không có quyền (thay vì disable).
* Các route cần được kiểm tra `permission` trước khi render layout.

```ts
if (!user.permissions.includes('user.create')) {
  return <Navigate to="/403" />;
}
```

---

## 5. 🧪 Testing Frontend

| Loại test   | Tool dùng                   | Ghi chú                   |
| ----------- | --------------------------- | ------------------------- |
| Unit test   | `vitest`, `jest`            | Test component, logic nhỏ |
| Integration | `testing-library/react`     | Test flow nhiều component |
| E2E test    | `Playwright` hoặc `Cypress` | Chạy qua UI thực tế       |

---

## 6. 🧹 Format, Lint & CI

* Dùng `prettier` cho format và `eslint` cho kiểm tra quy ước.
* Cấu hình nằm trong `.eslintrc.js`, `.prettierrc`, `.editorconfig`.
* Tự động chạy lint khi commit:

  ```bash
  npm run lint
  npm run format
  ```

---

## 7. ⚙️ Env & Config

* Đặt biến môi trường trong `.env.local`, ví dụ:

  ```
  VITE_API_URL=http://localhost:8001
  VITE_AUTH_DOMAIN=auth.dx-vas.edu.vn
  ```

* Không commit file `.env.local`, chỉ giữ `.env.example`.

---

## 8. 🧠 UX Best Practices

* Hiển thị spinner rõ ràng khi đang loading dữ liệu.
* Thông báo lỗi cần cụ thể, dễ hiểu (dùng toast, modal).
* Tránh nested modal hoặc multi-level popup.
* Ưu tiên “tối giản – dễ dùng – mobile-first”.

---

## 9. 🛑 Những điều không được làm

* ❌ Không gọi API trực tiếp trong component – luôn dùng service layer.
* ❌ Không hard-code URL hoặc ID – sử dụng biến môi trường và config file.
* ❌ Không commit console.log hoặc TODO lên `dev` hoặc `main`.
* ❌ Không reload toàn bộ trang trừ khi logout hoặc redirect bắt buộc.

---

> 📌 Ghi nhớ: Frontend không chỉ là "hiển thị UI" – đó là trải nghiệm người dùng, sự liền mạch, và uy tín của hệ thống DX-VAS trong mắt giáo viên, phụ huynh và học sinh.
