# 📘 [TÊN_SERVICE] – Interface Contract

> **[HƯỚNG DẪN SỬ DỤNG TEMPLATE NÀY:]**
> 1. Sao chép toàn bộ nội dung file này vào một file `interface-contract.md` mới trong thư mục service của bạn.
> 2. Tìm và thay thế tất cả các placeholder có dạng `[PLACEHOLDER]` hoặc các comment `TODO:` bằng thông tin cụ thể của service bạn.
> 3. Xóa các khối hướng dẫn (như khối này) hoặc các comment không cần thiết sau khi đã điền thông tin.
> 4. Đảm bảo tài liệu của bạn rõ ràng, chi tiết và tuân thủ "Checklist Tiêu Chuẩn 5★ cho File interface-contract.md".
> 5. Luôn tham chiếu đến các tài liệu liên quan như `design.md`, `data-model.md`, `openapi.yaml` và các ADRs.

* Tài liệu này mô tả các API chính mà **[TÊN_SERVICE]** cung cấp, theo phong cách dễ đọc cho developer (backend/frontend) và các bên liên quan. Đặc tả kỹ thuật chi tiết (chuẩn máy đọc) xem thêm tại [`openapi.yaml`](./openapi.yaml).
* _Phạm vi (Scope):_
[TODO: Mô tả ngắn gọn phạm vi của service này. Nó quản lý những gì? Nó phục vụ mục đích gì trong hệ thống tổng thể? Nó KHÔNG quản lý những gì để tránh nhầm lẫn với các service khác?]
[Ví dụ: Service này quản lý định danh toàn cục người dùng, thông tin tenant, và các template RBAC toàn cục. Nó không quản lý RBAC cục bộ của từng tenant (xem Sub User Service).]

> 🧭 **Nguyên tắc chung (General Principles):**
> > > - Với các API `PATCH`, hệ thống mặc định trả về `204 No Content` nếu cập nhật thành công và không có nội dung body cần trả về, để tối ưu hiệu năng và đơn giản hóa xử lý phía client. Nếu client cần object mới nhất, nên thực hiện `GET` sau khi cập nhật. (Tham khảo ADR-XYZ nếu có).
> - Tất cả các API đều yêu cầu header `Authorization: Bearer <JWT>` trừ khi được ghi chú là `public`.
> - Tất cả response body đều tuân thủ cấu trúc chuẩn trong [ADR-012 Response Structure](../../../ADR/adr-012-response-structure.md).
> - Tất cả lỗi trả về đều tuân thủ định dạng trong [ADR-011 Error Format](../../../ADR/adr-011-api-error-format.md).

---

## 📌 API: `/[RESOURCE_GROUP_1]`
> **[HƯỚNG DẪN:]**
> - Nhóm các API theo tài nguyên chính mà chúng quản lý.
> - Cung cấp bảng tóm tắt các API trong nhóm này.

Danh sách các API phục vụ quản lý [Mô tả ngắn về resource group 1].

| Method | Path                                      | Mô tả                                              | Quyền (RBAC Permission Code)        |
| :----- | :---------------------------------------- | :------------------------------------------------- | :---------------------------------- |
| GET    | `/[resource_group_1]/{id}`                | [TODO: Lấy thông tin chi tiết của một resource]     | `[scope].read.[resource]`           |
| GET    | `/[resource_group_1]/lookup?key=value`    | [TODO: Tra cứu resource theo một thuộc tính khác] | `[scope].read.[resource_alternative]` |
| POST   | `/[resource_group_1]`                     | [TODO: Tạo mới một resource]                       | `[scope].create.[resource]`         |
| PATCH  | `/[resource_group_1]/{id}`                | [TODO: Cập nhật thông tin một resource]             | `[scope].update.[resource]`         |
| DELETE | `/[resource_group_1]/{id}`                | [TODO: Xóa một resource (soft delete/hard delete)] | `[scope].delete.[resource]`         |
---

### 🧪 Chi tiết API

> **[HƯỚNG DẪN:]**
> - Lặp lại cấu trúc này cho từng API đã liệt kê trong bảng tóm tắt ở trên.
> - Cung cấp đầy đủ thông tin: mô tả, tham số (nếu có), request body (nếu có) kèm ví dụ, response body (cho cả thành công và lỗi điển hình) kèm ví dụ, và các sự kiện được phát ra (nếu có).

#### 1. GET `/[resource_group_1]/{id}`
[TODO: Mô tả chi tiết mục đích và hành vi của API này. Ví dụ: Trả về thông tin chi tiết của một [resource_name] dựa trên ID được cung cấp.]

**Path Parameters:**
-   `{id}`: [Kiểu dữ liệu, ví dụ: string (UUID)], bắt buộc. [TODO: Mô tả ý nghĩa của path parameter này].

**Response mẫu (200 OK):**
```json
{
  "data": {
    "id": "uuid-cua-resource",
    "[field_1]": "[value_1]",
    "[field_2]": "[value_2]"
    // ... các trường khác của resource
  },
  "meta": {
    "request_id": "req-abc-123",
    "timestamp": "YYYY-MM-DDTHH:mm:ssZ"
  }
}
````

**Các Status Codes có thể có:**

  - `200 OK`: Thành công, trả về thông tin resource.
  - `401 Unauthorized`: Chưa xác thực.
  - `403 Forbidden`: Không có quyền truy cập.
  - `404 Not Found`: Không tìm thấy resource với ID cung cấp.
  - `500 Internal Server Error`: Lỗi hệ thống.

-----

#### 2\. GET `/[resource_group_1]/lookup?key=value`

[TODO: Mô tả chi tiết mục đích và hành vi của API này. Ví dụ: Sử dụng để tra cứu [resource\_name] dựa trên [key\_name] thay vì ID chính.]

**Query Parameters:**

  - `[key_name]`: [Kiểu dữ liệu, ví dụ: string], bắt buộc. [TODO: Mô tả ý nghĩa của query parameter này].

**Response mẫu (200 OK):**

```json
{
  "data": {
    "id": "uuid-cua-resource",
    "[field_1]": "[value_1]",
    "[field_2]": "[value_2]"
  },
  "meta": {
    // ...
  }
}
```

**Các Status Codes có thể có:** 200, 400 (nếu query param thiếu/sai), 401, 403, 404, 500.

-----

#### 3\. POST `/[resource_group_1]`

[TODO: Mô tả chi tiết mục đích và hành vi của API này. Ví dụ: Tạo mới một [resource\_name].]

**Request body:**

```json
{
  "[field_1_cho_create]": "[value_1]",
  "[field_2_cho_create]": "[value_2]"
  // ... các trường khác cần để tạo resource
}
```

**Response mẫu (201 Created):**

```json
{
  "data": {
    "id": "uuid-moi-cua-resource",
    "[field_1_cho_create]": "[value_1]",
    "[field_2_cho_create]": "[value_2]"
    // ... các trường khác của resource vừa tạo
  },
  "meta": {
    // ...
  }
}
```

**Phát sự kiện (Emitted Events):**

  - `[resource_name]_created` (nếu có)
      * **Payload ví dụ:**
        ```json
        {
          "event_type": "[resource_name]_created",
          "data": { "id": "uuid-moi-cua-resource", "[field_1]": "[value_1]" },
          "metadata": { "event_id": "uuid-event", "timestamp": "...", "actor_id": "..." }
        }
        ```

**Các Status Codes có thể có:** 201, 400 (validation error), 401, 403, 409 (conflict, nếu resource đã tồn tại với key duy nhất), 500.

-----

#### 4\. PATCH `/[resource_group_1]/{id}`

[TODO: Mô tả chi tiết mục đích và hành vi của API này. Ví dụ: Cập nhật một phần thông tin của [resource\_name] đã tồn tại.]

**Path Parameters:**

  - `{id}`: [Kiểu dữ liệu], bắt buộc. [TODO: Mô tả].

**Request body:**

```json
{
  "[field_co_the_cap_nhat_1]": "[gia_tri_moi_1]",
  "[field_co_the_cap_nhat_2]": "[gia_tri_moi_2]"
}
```

**Response (204 No Content hoặc 200 OK với resource đã cập nhật):**

  - `204 No Content` (nếu không có body trả về)
  - Hoặc (nếu trả về resource đã cập nhật):
    ```json
    {
      "data": {
        "id": "uuid-cua-resource",
        "[field_co_the_cap_nhat_1]": "[gia_tri_moi_1]",
        // ... các trường khác
      },
      "meta": {
        // ...
      }
    }
    ```

**Phát sự kiện (Emitted Events):**

  - `[resource_name]_updated` (nếu có)

**Các Status Codes có thể có:** 204/200, 400, 401, 403, 404, 409 (nếu cập nhật gây conflict), 500.

-----

🔒 **Lưu ý quyền truy cập cho Resource Group này:**

  - [TODO: Ví dụ: Các API này thường được gọi bởi [Actor1] hoặc bởi [Actor2] với quyền [PermissionScope] phù hợp.]

📚 **Xem thêm tài liệu liên quan cho Resource Group này:**

  - [`design.md`](./design.md\#[Link tới mục liên quan trong design.md])
  - [`data-model.md`](./data-model.md\#[Link tới bảng liên quan trong data-model.md])

-----

-----

## 📌 Chú thích Định dạng Response & Lỗi

Tất cả các API tuân theo chuẩn phản hồi thống nhất (xem [liên kết đáng ngờ đã bị xóa]):

### ✅ Response Thành công (`200 OK`, `201 Created`, `204 No Content`, v.v.)

```json
// Ví dụ cho response có body (200 OK, 201 Created)
{
  "data": { /* Dữ liệu cụ thể của response */ },
  "meta": {
    "request_id": "uuid-request-id",
    "timestamp": "YYYY-MM-DDTHH:mm:ssZ"
    // ... các trường meta khác như pagination nếu có ...
  },
  "error": null // Luôn là null khi thành công
}
```

> Đối với `204 No Content`, sẽ không có response body.

### ❌ Response Lỗi (4xx/5xx)

```json
{
  "data": null, // Luôn là null khi có lỗi
  "meta": {
    "request_id": "uuid-request-id",
    "timestamp": "YYYY-MM-DDTHH:mm:ssZ"
  },
  "error": {
    "code": "[ERROR_CODE_STRING]", // Ví dụ: "RESOURCE_NOT_FOUND", "VALIDATION_ERROR"
    "message": "[Mô tả lỗi thân thiện với người dùng hoặc developer]",
    "details": { /* (Tùy chọn) Chi tiết lỗi cụ thể, ví dụ: lỗi validation cho từng trường */ }
  }
}
```

Xem chi tiết danh sách mã lỗi và cấu trúc `details` tại [liên kết đáng ngờ đã bị xóa].

-----

## 🔚 Kết luận

Tài liệu này định nghĩa rõ ràng các hợp đồng giao diện (interface contract) của **[TÊN\_SERVICE]**, bao gồm:

  - Quản lý `[RESOURCE_GROUP_1]` (API group `/resource_group_1`)
  - [TODO: Liệt kê các resource group khác]

Mọi API đều áp dụng chuẩn phản hồi thống nhất và cơ chế phân quyền linh hoạt dựa trên RBAC đã được mô tả trong [`design.md`](https://www.google.com/search?q=./design.md) và các tài liệu kiến trúc liên quan của hệ thống dx-vas.

👉 **Các API này là nền tảng để [mô tả vai trò của service trong hệ thống tổng thể, ví dụ: các service khác tương tác, hoặc Superadmin Webapp hoạt động ổn định và mở rộng linh hoạt].**

-----

## 📌 Phụ lục: Các ENUM sử dụng trong [TÊN\_SERVICE]

> **[HƯỚNG DẪN:]**
>
>   - Liệt kê tất cả các ENUM được sử dụng trong request/response của các API thuộc service này.
>   - Điều này rất quan trọng để đảm bảo client hiểu đúng các giá trị có thể có.

| Tên trường (Field Name) | Enum giá trị hợp lệ                | Mô tả                                                                 |
| :---------------------- | :--------------------------------- | :------------------------------------------------------------------- |
| `[tên_trường_enum_1]` | `value1`, `value2`, `value3`       | [TODO: Mô tả ý nghĩa của ENUM này và từng giá trị.]                    |
| `[tên_trường_enum_2]` | `option_a`, `option_b`             | [TODO: Mô tả.]                                                       |
**Ghi chú:** Các ENUM này nên được định nghĩa tập trung trong codebase backend để tái sử dụng (ví dụ: constant hoặc enum class), đồng thời được phản ánh rõ trong `openapi.yaml` và các ví dụ minh hoạ để đảm bảo tính thống nhất giữa backend, frontend và hệ thống tài liệu.

-----

## 📎 Phụ lục: Bảng Permission Code cho [TÊN\_SERVICE]

> **[HƯỚNG DẪN:]**
>
>   - Liệt kê tất cả các permission code (RBAC) mà các API của service này yêu cầu hoặc liên quan đến.
>   - Bảng này giúp quản lý tập trung và dễ dàng tham chiếu khi cấu hình RBAC.

| `permission_code`                  | Mô tả ngắn gọn                                        | Sử dụng bởi API (ví dụ)                       | `action` (ước lượng) | `resource` (ước lượng) | `default_condition` (nếu có) |
| :--------------------------------- | :----------------------------------------------------- | :-------------------------------------------- | :------------------ | :--------------------- | :-------------------------- |
| `[scope].read.[resource]`          | [TODO: Xem thông tin [resource]]                       | `GET /[resource_group_1]/{id}`                | `read`              | `[resource]`           | `null`                      |
| `[scope].create.[resource]`        | [TODO: Tạo mới [resource]]                             | `POST /[resource_group_1]`                    | `create`            | `[resource]`           | `null`                      |
| `[scope].update.[resource]`        | [TODO: Cập nhật [resource]]                            | `PATCH /[resource_group_1]/{id}`              | `update`            | `[resource]`           | `null`                      |
| `[scope].delete.[resource]`        | [TODO: Xóa [resource]]                                 | `DELETE /[resource_group_1]/{id}`             | `delete`            | `[resource]`           | `null`                      |
| `[scope].view_[config_resource]`   | [TODO: Xem cấu hình [config\_resource]]                 | `GET /[config_resource_collection]`           | `read`              | `[config_resource]`    | `null`                      |

> 🔒 **Ghi chú:** Các permission này được định nghĩa và quản lý bởi [Service nào, ví dụ: User Service Master] và có thể được ánh xạ xuống từng tenant thông qua [Cơ chế nào, ví dụ: Sub User Service] nếu cần thiết. Các `default_condition` (nếu có) sẽ được mô tả chi tiết trong đặc tả RBAC của hệ thống.

-----

📎 Để biết chi tiết luồng nghiệp vụ: xem [`design.md`](./design.md)

📦 Để tra cứu schema CSDL chi tiết: xem [`data-model.md`](./data-model.md)

-----
