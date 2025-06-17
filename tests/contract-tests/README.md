Dưới# 🤝 Contract Testing – DX-VAS

Bộ kiểm thử **Contract Testing** đảm bảo các Core Services do vendor triển khai luôn tuân thủ đúng giao diện API mà hệ thống DX-VAS (chúng ta) kỳ vọng.

Áp dụng mô hình **Consumer-Driven Contract** với công cụ **Pact JS + Pact Broker**, đây là lớp bảo vệ đầu tiên chống lại lỗi tích hợp backend.

---

## 1. 🎯 Mục Tiêu

- Phát hiện sớm lỗi tích hợp giữa API Gateway / Tenant Adapter với Core Services
- Kiểm soát schema, mã lỗi và logic phản hồi của backend
- Giúp vendor xác minh thay đổi API có phá vỡ consumer hiện tại hay không
- Tích hợp CI/CD để tự động chặn release nếu contract không tương thích

---

## 2. 🧱 Cấu Trúc Thư Mục

Toàn bộ mã kiểm thử contract được tổ chức theo chuẩn hóa dưới đây, giúp đảm bảo khả năng mở rộng, dễ bảo trì, và phù hợp với tích hợp CI/CD:

```

tests/
└── contract-tests/
├── test/                       # Các test case tương ứng với từng Provider
│   ├── token-service.test.js
│   ├── user-service.test.js
│   ├── auth-service.test.js
│   └── notification-service.test.js
│
├── pact/                       # Output file \*.pact.json được sinh sau khi test
│   ├── token-service-api-gateway.json
│   └── ...
│
├── pact-broker/                # Script publish contract + cấu hình Pact Broker
│   ├── pact.config.js
│   ├── publish.js
│   └── can-i-deploy.js         # (tùy chọn) kiểm tra tương thích trước release
│
├── mocks/                      # JWT, headers, payload mẫu dùng lại trong nhiều test
│   ├── fake-jwt.js
│   └── sample-body.js
│
├── .env                        # Biến môi trường chứa PACT\_BROKER\_URL, tag...
├── package.json                # Cấu hình project NodeJS (test runner, pact)
└── README.md                   # Tài liệu hướng dẫn sử dụng cho contract-tests

```

---

### 2.1. 📁 `test/` – Nơi định nghĩa các interaction
- Mỗi file `.test.js` mô tả toàn bộ expectation của consumer với một provider.
- Mỗi interaction cần có:
  - `description`: nêu rõ mục tiêu nghiệp vụ
  - `providerState`: giả lập trạng thái backend
  - `matchers`: để tránh hardcode giá trị động

**Quy ước đặt tên:**
```plaintext
<provider-name>.test.js
```

---

### 2.2. 📁 `pact/` – Nơi sinh file contract `.pact.json`

* Sau khi chạy test, Pact sẽ tạo ra file chứa toàn bộ interaction.
* File này sẽ được publish lên **Pact Broker** để phía provider verify.
* Tên file mặc định: `{provider}-{consumer}.json`

---

### 2.3. 📁 `pact-broker/` – Tích hợp với Pact Broker

* Chứa các script giúp:

  * **Publish contract** từ local hoặc CI lên Pact Broker
  * **Check compatibility** trước khi release
* `pact.config.js`: cấu hình các biến môi trường chung (broker URL, auth...)
* `publish.js`: script publish dùng trong CI/CD

---

### 2.4. 📁 `mocks/` – Dữ liệu mẫu dùng lại

* JWT giả lập, headers mẫu, user giả... để test có thể lặp lại và không phụ thuộc hệ thống thật.
* Tránh trùng lặp logic setup dữ liệu giữa các test.

---

### 2.5. 📄 `.env` – Biến môi trường

* Có thể bao gồm:

```env
PACT_BROKER_URL=https://pact.dx-vas.io
PACT_CONSUMER_VERSION=1.2.3
PACT_TAG=staging
```

---

### 2.6. 📄 `package.json` – Quản lý toàn bộ contract-tests

* Cài dependency (`@pact-foundation/pact`, `dotenv`, `jest`, etc.)
* Định nghĩa các script chuẩn để chạy test và publish:

```json
"scripts": {
  "test:pact": "jest test/*.test.js",
  "publish:pact": "node pact-broker/publish.js"
}
```

---

### 2.7. 📄 `README.md` – Tài liệu bắt buộc

* Giải thích mục tiêu của từng file test
* Hướng dẫn cách chạy test, publish contract
* Link tới ADR & tiêu chuẩn 5⭐ contract testing
* Thông tin liên hệ của team phụ trách (ownership rõ ràng)

---

> 🧠 Việc giữ cấu trúc rõ ràng và chuẩn hóa sẽ giúp team dễ dàng mở rộng, review, và tích hợp test mới mà không cần phụ thuộc quá nhiều vào người viết gốc.

---

## 3. 📦 Công Cụ & Công Nghệ

Bộ kiểm thử Contract Testing trong DX-VAS áp dụng mô hình **Consumer-Driven Contract Testing**, nơi chúng ta (consumer) định nghĩa kỳ vọng và yêu cầu dịch vụ backend (provider) phải tuân thủ.

Dưới đây là các công cụ chủ đạo trong hệ thống kiểm thử contract:

---

### 3.1. 🧪 [Pact JS](https://github.com/pact-foundation/pact-js)

> Thư viện chính để viết contract test từ phía consumer bằng Node.js

- Cho phép định nghĩa **interaction** giữa consumer và provider một cách rõ ràng.
- Hỗ trợ `matchers` để tránh hardcode giá trị (ví dụ: ID, token, timestamps).
- Tích hợp mock server để test local không cần backend thực.

**Vì sao chọn Pact JS?**
- Là tiêu chuẩn de facto cho Consumer-Driven Contract Testing.
- Dễ dùng, hỗ trợ tốt cho dự án có frontend/backend viết bằng TypeScript/JavaScript.
- Dễ tích hợp với Jest, Mocha, hoặc bất kỳ test runner JS nào.

---

### 3.2. 🧰 [Pact CLI](https://docs.pact.io/cli)

> Công cụ dòng lệnh để publish contract, verify và kiểm tra tương thích (`can-i-deploy`).

- Dùng trong CI/CD để tự động publish contract lên Pact Broker.
- Có thể gọi `can-i-deploy` để kiểm tra xem phiên bản consumer hiện tại có thể deploy an toàn không.

**Các lệnh chính:**
```bash
pact-broker publish pact/ --consumer-app-version 1.2.3 --tag staging
pact-broker can-i-deploy --pacticipant api-gateway --version 1.2.3 --to-environment production
```

---

### 3.3. 📦 [Pact Broker](https://docs.pact.io/pact_broker)

> Dịch vụ trung gian để lưu trữ, quản lý, và xác minh các contract giữa các team

* Mỗi khi test pass → contract `.pact.json` sẽ được publish lên đây.
* Provider (vendor) sẽ pull về và verify contract với backend của họ.
* Có matrix thể hiện trạng thái verify giữa các version consumer–provider.
* Hỗ trợ tagging (`dev`, `staging`, `prod`) và versioning theo từng môi trường.

**Lý do chọn:**

* Cho phép phối hợp nhiều team backend/frontend dễ dàng.
* Là trung tâm minh bạch theo dõi tương thích hệ thống.

---

### 3.4. 🧪 [Jest](https://jestjs.io/) / [Mocha](https://mochajs.org/)

> Test runner để chạy các file test trong `test/*.test.js`

* Kết hợp tốt với Pact JS để tạo môi trường test sạch, dễ chạy lặp lại.
* Tích hợp dễ dàng với CI/CD.
* Hỗ trợ assert matcher mạnh mẽ, giúp viết test ngắn gọn và rõ ràng.

---

### 3.5. ⚙️ \[Node.js + npm/yarn]

> Toàn bộ `contract-tests/` là một project Node.js độc lập

* Dễ cài đặt, đóng gói, và deploy riêng biệt với hệ thống backend chính.
* Có thể chạy trong mọi môi trường CI/CD (GitHub Actions, GitLab CI, Jenkins...).
* Tách biệt hoàn toàn giúp giảm dependency và tăng khả năng kiểm soát.

---

### 3.6. 📁 [dotenv](https://www.npmjs.com/package/dotenv)

> Dùng để quản lý biến môi trường trong `.env` như `PACT_BROKER_URL`, `PACT_TAG`.

* Dễ cấu hình, hỗ trợ nhiều môi trường (`dev`, `staging`, `prod`).
* Giúp tách biệt logic test với cấu hình triển khai.

---

### 3.7. 🧪 \[Pact Matchers]

> Giúp định nghĩa dữ liệu mẫu mà không bị “gãy” test do thay đổi giá trị động

Ví dụ:

```js
like({ id: 123, name: 'Alice' })         // Bất kỳ object có cùng schema
eachLike({ id: 1 }, { min: 2 })          // Mảng ít nhất 2 phần tử giống nhau
term({ generate: 'active', matcher: '^(active|inactive)$' })
```

---

### 3.8. 🧩 Tùy chọn: [PactFlow](https://pactflow.io/)

> Dịch vụ cloud-based nâng cao cho Pact Broker, hỗ trợ bảo mật, multi-tenancy và dashboard UI

* Thay thế cho self-hosted Pact Broker nếu muốn dùng SaaS.
* Có chứng nhận ISO27001, tích hợp SSO, RBAC.

---

### 3.9. 🧠 Kết luận

| Mục tiêu                               | Công cụ                   |
| -------------------------------------- | ------------------------- |
| Viết test                              | Pact JS                   |
| Mock Provider                          | Pact JS mock server       |
| Publish / Verify / Check compatibility | Pact CLI                  |
| Quản lý version & trạng thái           | Pact Broker               |
| Tích hợp CI/CD                         | GitHub Actions + Pact CLI |
| Test runner                            | Jest hoặc Mocha           |

> ✅ Bộ công cụ trên được tối ưu để phục vụ quy trình kiểm thử contract sống động, đáng tin cậy, và tự động hóa hoàn toàn trong hệ thống CI/CD của DX-VAS.

---

## 4. 🛠️ Hướng Dẫn Chạy Test

Bộ test contract được viết bằng **Pact JS**, chạy bằng **Jest** (hoặc Mocha), và có thể thực thi hoàn toàn trên máy local hoặc trong CI/CD.

Dưới đây là hướng dẫn từng bước để phát triển và kiểm thử contract:

---

### 4.1. 📦 Cài đặt môi trường

Chạy một lần để cài đặt các thư viện cần thiết:

```bash
cd tests/contract-tests
npm install
```

> ⚠️ Node.js v16+ được khuyến nghị

---

### 4.2. 🧪 Chạy test local (sinh contract)

```bash
npm run test:pact
```

Lệnh này sẽ:

* Chạy tất cả các file `.test.js` trong thư mục `test/`
* Spin-up Pact mock server
* Tạo ra file `.pact.json` chứa các interaction tại thư mục `pact/`

> 🟢 Mỗi test pass tương ứng với một contract “đã được ký cam kết” giữa consumer–provider.

---

### 4.3. 📤 Publish contract lên Pact Broker

Sau khi test pass và file contract đã được tạo, bạn có thể publish lên broker để provider verify:

```bash
npm run publish:pact
```

Lệnh này sẽ:

* Lấy toàn bộ file `.json` từ `pact/`
* Gửi lên Pact Broker (theo URL trong `.env`)
* Gắn thẻ version và tag theo môi trường (dev, staging, prod)

---

### 4.4. 🔁 Kiểm tra tương thích bằng `can-i-deploy`

Trước khi release production hoặc staging, bạn có thể kiểm tra xem phiên bản hiện tại có tương thích với tất cả provider không:

```bash
npm run can-i-deploy
```

Hoặc thủ công:

```bash
pact-broker can-i-deploy \
  --pacticipant api-gateway \
  --version 1.2.3 \
  --to-environment production \
  --broker-base-url https://pact.dx-vas.io
```

> ✅ Nếu kết quả là “You can deploy”, pipeline tiếp tục.
> ❌ Nếu “Verification failed”, bạn cần sửa lại contract hoặc liên hệ provider.

---

### 4.5. 🧪 Chạy test cho một file cụ thể

```bash
npx jest test/token-service.test.js
```

---

### 4.6. ⚙️ Biến môi trường (trong `.env`)

```env
PACT_BROKER_URL=https://pact.dx-vas.io
PACT_CONSUMER_VERSION=1.2.3
PACT_TAG=staging
```

> ✅ Có thể tạo `.env.local` để override khi test local.

---

### 4.7. 🧹 Cleanup

Sau mỗi đợt test, bạn có thể xoá cache để test lại từ đầu:

```bash
rm -rf pact/
```

---

> 🧠 Đừng quên: Sau khi tạo contract mới hoặc cập nhật interaction, bạn cần **review lại bằng checklist 5⭐**, đảm bảo có matcher, mô tả nghiệp vụ, trạng thái provider rõ ràng trước khi publish.

---

## 5. 🎯 Mục tiêu chọn công cụ

Việc lựa chọn công cụ Contract Testing không chỉ là vấn đề kỹ thuật – đó là một **chiến lược đảm bảo chất lượng tích hợp** trong môi trường phát triển đa team, đa nhà cung cấp, và hướng dịch vụ (service-oriented) như hệ thống DX-VAS.

Chúng ta chọn **Pact JS + Pact Broker** làm công cụ chính cho Contract Testing dựa trên các mục tiêu chiến lược sau:

---

### ✅ 5.1. Consumer-Driven Design

- Cho phép **chúng ta (consumer)** chủ động định nghĩa kỳ vọng với các service mà vendor triển khai.
- Tạo thế chủ động khi làm việc với các bên thứ ba, giảm sự lệ thuộc vào tài liệu API "mơ hồ" hoặc lỗi không rõ ràng.

---

### ✅ 5.2. Phát hiện lỗi tích hợp sớm

- Các lỗi thường gặp như:
  - Response schema bị thay đổi ngầm
  - HTTP status sai lệch
  - API không xử lý lỗi đúng format `ErrorEnvelope`
- Sẽ được phát hiện **ngay trong CI/CD** trước khi triển khai staging hoặc production.

---

### ✅ 5.3. Quản lý contract & version minh bạch

- **Pact Broker** lưu trữ mọi contract đã publish, hỗ trợ version hóa, rollback, tagging (`dev`, `staging`, `prod`).
- Có thể sử dụng câu lệnh `can-i-deploy` để kiểm tra xem version hiện tại có thể triển khai an toàn hay không.

---

### ✅ 5.4. Tích hợp CI/CD đơn giản, hiệu quả

- Pact CLI hỗ trợ đầy đủ:
  - Publish contract
  - Verify phía provider
  - Check compatibility (`can-i-deploy`)
- Dễ dàng tích hợp với GitHub Actions, GitLab CI, Jenkins...

---

### ✅ 5.5. Tái sử dụng & bảo trì dễ dàng

- Viết test bằng JavaScript/TypeScript – dễ đọc, dễ review, dễ mở rộng.
- Có thể chia sẻ `mocks`, `providerState`, `headers` chung cho nhiều interaction.
- Có chuẩn `5⭐ Contract Testing` để thống nhất chất lượng giữa các team.

---

### ✅ 5.6. Thân thiện với multi-tenant & RBAC

- Có thể test rõ ràng các header quan trọng như `X-Tenant-ID`, `Authorization`
- Hỗ trợ mô phỏng các context khác nhau: user admin / user thường / user bị thu hồi token.

---

### ✅ 5.7. Có cộng đồng mạnh, tài liệu tốt

- Là công cụ phổ biến nhất trong giới phát triển microservices
- Được hỗ trợ bởi Pact Foundation – nhiều plugin, CI integration mẫu, tài liệu rõ ràng.

---

### 🧠 5.8. Tóm lại:

| Tiêu chí | Pact JS + Pact Broker |
|----------|------------------------|
| Consumer chủ động định nghĩa contract | ✅ |
| Dễ viết, dễ review | ✅ |
| Hỗ trợ CI/CD chuyên sâu | ✅ |
| Phù hợp môi trường nhiều service & vendor | ✅ |
| Hỗ trợ quản lý version & rollback | ✅ |
| Dễ mở rộng và tuân thủ chuẩn nội bộ DX-VAS | ✅ |

> ✅ Bộ công cụ này không chỉ giúp test API mà còn trở thành một “giao kèo sống” giữa các team – tự động, minh bạch và có thể theo dõi xuyên suốt lifecycle của hệ thống.

---

## 6. 🛠️ Quy trình Phát triển Contract Test

Việc phát triển contract test không chỉ đơn giản là “viết test” – đó là quy trình **định nghĩa và duy trì một cam kết kỹ thuật** giữa hệ thống DX-VAS (consumer) và vendor (provider).

Dưới đây là quy trình chuẩn hóa 6 bước để xây dựng và duy trì một contract test đúng chuẩn DX-VAS.

---

### 6.1. 🧩 Bước 1: Xác định consumer–provider

- Xác định service nào trong hệ thống DX-VAS đang đóng vai **consumer**
- Xác định endpoint hoặc interaction cần giao tiếp với **provider**
- Xác định schema mong muốn dựa trên:
  - `interface-contract.md`
  - `openapi.yaml`
  - hoặc ADR liên quan

Ví dụ:
- Consumer: `API Gateway`
- Provider: `token-service`
- Path: `POST /token/issue`

---

### 6.2. 📄 Bước 2: Viết file test trong `test/*.test.js`

- Tạo file theo tên provider, ví dụ: `token-service.test.js`
- Trong mỗi file test:
  - Mỗi endpoint cần ít nhất **1 interaction Happy Path**
  - Mỗi loại lỗi cần 1 interaction: 401, 403, 404, 400
  - Ghi rõ `description` → nêu mục tiêu nghiệp vụ
  - Sử dụng `matchers` thay vì hardcode giá trị (ID, timestamp, token…)

Ví dụ (rút gọn):
```js
provider.addInteraction({
  state: 'a valid user exists',
  uponReceiving: 'a request to issue a token',
  withRequest: {
    method: 'POST',
    path: '/token/issue',
    headers: { 'Content-Type': 'application/json' },
    body: like({ email: 'user@example.com' })
  },
  willRespondWith: {
    status: 200,
    body: like({ access_token: 'abc', expires_in: 3600 })
  }
});
````

---

### 6.3. 🧪 Bước 3: Chạy test local để sinh contract

```bash
npm run test:pact
```

* File contract sẽ được sinh tại `pact/`
* Kiểm tra lại `.pact.json` có đủ interaction chưa

---

### 6.4. 📤 Bước 4: Publish contract lên Pact Broker

```bash
npm run publish:pact
```

* Contract sẽ được gửi lên `PACT_BROKER_URL`
* Gắn version = `GIT_COMMIT_SHA` hoặc số version
* Gắn tag = `dev`, `staging`, `prod`, hoặc tên branch

---

### 6.5. ✅ Bước 5: Review theo checklist 5⭐

Trước khi merge hoặc release, đảm bảo contract test đã:

* [ ] Có đủ `happy path` và các `error cases`
* [ ] Dùng matcher triệt để (no hardcode)
* [ ] Có mô tả nghiệp vụ rõ ràng (`description`)
* [ ] Có `providerState` mô phỏng đúng context backend
* [ ] Được review trong Pull Request
* [ ] Ghi rõ liên kết đến OpenAPI / ADR liên quan (nếu có)
* [ ] Verify pass trên Pact Broker

> 📌 Xem chi tiết: [`5⭐ Contract Testing Checklist`](../../docs/standards/5s.contract.testing.standard.md)

---

### 6.6. 🔁 Bước 6: Duy trì & cập nhật khi provider thay đổi

* Nếu backend thay đổi schema → consumer test sẽ fail (tránh silent break)
* Nếu thêm field mới → consumer nên dùng matcher để không bị gãy
* Nếu xóa field → cần thống nhất giữa 2 team & cập nhật lại contract
* Nếu một interaction không còn dùng → đánh dấu deprecated và cleanup sau review

---

### 6.7. 🧠 Ghi nhớ

> 🟢 Contract test là hợp đồng **sống**: mỗi thay đổi API đều phải được xác minh và đồng thuận qua test.
>
> 🛡️ Test tốt = hệ thống ổn định, vendor minh bạch, consumer tự tin deploy.

---

## 7. 🔁 Chính sách Review & Duy Trì

Contract test không chỉ là “test tạm thời” mà là một **cam kết kỹ thuật lâu dài** giữa consumer (DX-VAS) và provider (vendor). Do đó, cần có quy trình review, bảo trì và kiểm soát nghiêm ngặt để đảm bảo chất lượng theo thời gian.

---

### 🧑‍💻 7.1. Mọi thay đổi contract phải được review

- Contract test được coi như **code production**
- Mỗi PR có thay đổi contract (tạo mới, sửa schema, thêm interaction) **phải được review kỹ càng**
- Reviewer sử dụng [`Checklist 5⭐ Contract Testing`](../../docs/standards/5s.contract.testing.standard.md) để kiểm tra:

| Tiêu chí | Yêu cầu |
|----------|---------|
| Happy path | ✅ Có |
| Error case | ✅ Có |
| Description rõ ràng | ✅ Có |
| Không hardcode | ✅ Matcher |
| Provider State | ✅ Có |
| Dùng headers đúng | ✅ `Authorization`, `X-Tenant-ID` |

---

### 🧭 7.2. Mọi interaction phải có mô tả nghiệp vụ rõ ràng

- Trường `description` trong mỗi interaction phải trả lời được câu hỏi:  
  _“Test này đang xác minh behavior nghiệp vụ nào?”_
- Tránh các mô tả chung chung như `"should return 200"`  
  Nên viết: `"should issue a JWT when valid email is provided"`  

---

### 📅 7.3. Duy trì định kỳ hàng tháng

- Mỗi tháng, người quản lý test (QA lead hoặc DevOps) cần:
  - Chạy lại toàn bộ contract suite
  - Kiểm tra các contract cũ có còn dùng không
  - Xác minh trạng thái verify trên Pact Broker
  - Dọn rác: xóa contract cũ, interaction dư thừa, tag lỗi thời

---

### 🗑️ 7.4. Xóa hoặc bỏ interaction phải có lý do

- Nếu một API endpoint không còn được dùng → cần gắn nhãn `deprecated` và thông báo cho provider
- Nếu một interaction không còn giá trị → phải giải thích rõ trong PR tại sao bị xóa

---

### 🧩 7.5. Không được commit `.pact.json` vào repo

- Các file `*.pact.json` chỉ nên **được sinh tự động khi chạy test**
- Không được commit file này vào Git – nên thêm vào `.gitignore`
- Chỉ publish lên Pact Broker thông qua CI/CD hoặc script

---

### 👥 7.6. Ghi rõ người sở hữu contract

- Mỗi thư mục test nên có `README.md` hoặc ghi chú trong `package.json`:
  - Consumer: team phụ trách `API Gateway`, `Tenant Adapter`
  - Provider: tên dịch vụ của vendor
  - Người phụ trách review: Dev lead hoặc QA được phân công

---

### 📢 7.7. Kết nối với nhà cung cấp (vendor)

- Nếu verify bên provider fail → phải mở issue ngay cho vendor
- Có thể dùng webhook của Pact Broker để tự động thông báo
- Các tương tác nhạy cảm nên được thảo luận trước khi publish contract mới

---

### 🧠 7.8. Kết luận

> ✅ Mỗi contract là một bản giao kèo kỹ thuật.  
> 🛡️ Bảo trì kỹ lưỡng → tránh lỗi ngầm → đảm bảo tích hợp ổn định → tin cậy khi release production.

---

## 8. 🔗 Tích hợp CI/CD

Contract Testing trong DX-VAS không chỉ là kiểm thử local – nó là một phần **cốt lõi trong pipeline CI/CD**, giúp đảm bảo rằng bất kỳ thay đổi nào từ phía vendor **đều không phá vỡ kỳ vọng của hệ thống**.

Dưới đây là kiến trúc và luồng tích hợp chuẩn hoá:

---

### 8.1. 🔁 CI/CD: Consumer Side (DX-VAS)

📍 **Trigger:** Khi có thay đổi mã nguồn liên quan đến consumer (ví dụ: `API Gateway` hoặc `Tenant Adapter`)

**Pipeline thực hiện:**

1. ✅ **Chạy `npm run test:pact`**
   - Sinh ra file `.pact.json` trong thư mục `pact/`

2. 📤 **Publish contract lên Pact Broker**
   - Gắn `PACT_CONSUMER_VERSION = GIT_COMMIT_SHA` hoặc phiên bản
   - Gắn `PACT_TAG = dev`, `staging`, `prod` tùy theo môi trường

3. 📌 **Kết thúc pipeline khi publish thành công**
   - Nếu contract mới không làm gãy các provider, sẽ được sử dụng ở bước tiếp theo (từ phía provider)

---

### 8.2. 🔁 CI/CD: Provider Side (Vendor)

📍 **Trigger:** Khi vendor cập nhật dịch vụ backend (token-service, user-service, ...)

**Pipeline của vendor sẽ:**

1. 🔄 **Fetch contract từ Pact Broker**
   - Lấy version contract mới nhất liên quan đến provider tương ứng

2. ✅ **Verify contract**
   - Chạy Pact Provider Test để xác thực rằng backend hiện tại **đáp ứng đầy đủ interaction từ consumer**

3. ❌ **Nếu fail → build dừng**
   - Không được release bản provider mới nếu contract bị gãy

---

### 8.3. 🚦 `can-i-deploy` Check (trước khi deploy staging/prod)

Khi chuẩn bị release production hoặc staging, pipeline sẽ chạy:

```bash
npm run can-i-deploy
````

Lệnh này kiểm tra:

* Các contract mới nhất (theo tag) có được provider hiện tại **xác thực thành công không**
* Nếu **mọi consumer–provider đều tương thích** → ✅ Deploy.
* Nếu **một trong các contract chưa verify** → ❌ Block deploy.

---

### 8.4. 📦 Quản lý Tag & Version

* Mỗi contract publish cần có:

  * `PACT_CONSUMER_VERSION = GIT_COMMIT_SHA hoặc VERSION`
  * `PACT_TAG = dev | staging | production`

* Tạo tag mới sau mỗi đợt release thành công để kiểm soát rollback/versioning.

---

### 8.5. 🧠 Best Practices CI/CD

| Tiêu chí                         | Mô tả                      |
| -------------------------------- | -------------------------- |
| 🔁 Tự động publish contract      | Mỗi lần test pass          |
| ✅ Tự động verify ở provider      | Sau mỗi thay đổi backend   |
| ⛔ Block deploy nếu fail          | Dựa trên `can-i-deploy`    |
| 📊 Hiển thị trạng thái matrix    | Trên Pact Broker           |
| 🔒 Không commit `.pact.json`     | Chỉ dùng trong pipeline    |
| 🔎 Review log kỹ nếu verify fail | Để gửi feedback cho vendor |

---

> ✅ CI/CD là “người gác cổng” đảm bảo không một contract sai lệch nào có thể lọt vào production – và đó chính là giá trị lớn nhất của mô hình Contract Testing sống động.

---

## 9. 🏗️ Phạm Vi Áp Dụng

Contract Testing được áp dụng trong hệ thống DX-VAS để xác nhận rằng các **Core Services** do vendor phát triển luôn **tuân thủ giao diện (contract)** mà phía chúng ta (consumer) kỳ vọng.

Dưới đây là bảng tổng hợp các cặp **Consumer–Provider** bắt buộc phải có contract test, được duy trì theo checklist 5⭐:

| Consumer (chúng ta)     | Provider (vendor)          | Trạng thái áp dụng | Ghi chú |
|--------------------------|-----------------------------|---------------------|---------|
| `API Gateway`            | `token-service`             | ✅ Bắt buộc         | Kiểm tra cấp JWT, revoked token |
| `API Gateway`            | `user-service/master`       | ✅ Bắt buộc         | Tra cứu thông tin người dùng, RBAC |
| `API Gateway`            | `auth-service/master`       | ✅ Bắt buộc         | Kiểm tra quy trình login (Google/OTP) |
| `Tenant Adapter`         | `user-service/master`       | ✅ Bắt buộc         | Đồng bộ user về tenant |
| `API Gateway`            | `notification-service`      | ✅ Bắt buộc         | Gửi thông báo qua email, OTP |

> ✅ **Tất cả các cặp trên đều phải có ít nhất 1 contract test đạt chuẩn 5⭐** trong test suite.

---

### 9.1. 📌 Nguyên tắc xác định phạm vi

- **Chúng ta là Consumer**: Khi một dịch vụ frontend hoặc gateway của DX-VAS gửi request đến backend do vendor phát triển.
- **Có giao tiếp HTTP rõ ràng**: Đường dẫn, status code, headers, response schema được định nghĩa trong `interface-contract.md` hoặc `openapi.yaml`.
- **Liên quan đến logic nghiệp vụ quan trọng**: Auth, RBAC, Notification, Token, v.v.

---

### 9.2. 🛑 Không áp dụng cho

- Các service do chính DX-VAS team phát triển và chủ động kiểm soát
- Các dịch vụ không giao tiếp HTTP hoặc không expose contract rõ ràng
- Các Adapter phụ trách tích hợp nội bộ tenant (ví dụ: `sms-backend`, `school-db`)

---

> 📢 **Khi có thêm dịch vụ mới từ vendor**, bạn cần cập nhật bảng trên để bổ sung cặp Consumer–Provider mới và thêm test tương ứng. Đây là trách nhiệm thuộc nhóm Kiến trúc (John team).

---

## 10. 📚 Tài Liệu Liên Quan

* [`ADR 010 - Contract Testing`](../../docs/ADR/adr-010-contract-testing.md) – Quyết định kiến trúc chính thức về áp dụng contract testing trong hệ thống DX-VAS.
* [`5⭐ Contract Testing Checklist`](../../docs/standards/5s.contract.testing.standard.md) – Bộ checklist tiêu chuẩn đánh giá chất lượng mỗi contract.
* [`openapi.yaml`](../../docs/services/api-gateway/openapi.yaml) – Định nghĩa cấu trúc API dùng làm cơ sở để viết contract.
* [Pact JS Documentation](https://docs.pact.io/getting_started/using_the_library) – Hướng dẫn chi tiết cách viết và chạy contract test bằng Pact JS.
* [Pact Broker Documentation](https://docs.pact.io/pact_broker) – Tài liệu cấu hình và sử dụng Pact Broker trong quản lý contract.
* [Pact Matchers](https://docs.pact.io/how-to/use-matchers) – Tài liệu chính thức về cách dùng matchers trong contract test để tránh hardcode.
* [Can-I-Deploy Docs](https://docs.pact.io/pact_broker/can_i_deploy/) – Hướng dẫn sử dụng lệnh `can-i-deploy` trong CI/CD để kiểm tra tương thích consumer–provider.
* [DX-VAS CI/CD Pipeline](../../docs/dev-guide/13-ci-cd-pipeline.md) – Cách tích hợp test và publish contract vào quy trình CI/CD toàn hệ thống.

