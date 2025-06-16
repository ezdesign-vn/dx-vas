# 🧪 DX-VAS – Bộ Kiểm Thử Tự Động Hệ Thống (`tests/`)

Bộ kiểm thử trong thư mục `tests/` được thiết kế nhằm **đảm bảo chất lượng độc lập và chủ động** cho các **Core Services** do vendor cung cấp, từ góc nhìn của hệ thống consumer (API Gateway và các Tenant Stack).

---

## 1. 📌 Mục Tiêu

- Phát hiện sớm sai lệch giữa implementation và contract API
- Kiểm tra xuyên suốt luồng nghiệp vụ quan trọng
- Đánh giá hiệu năng và khả năng phục hồi hệ thống
- Rà soát bảo mật và các lỗi logic nghiệp vụ có thể bị khai thác
- Tích hợp sâu vào CI/CD để hỗ trợ quy trình phát hành

---

## 2. 🧱 Cấu Trúc Kiểm Thử

```plaintext
tests/                                   # 📦 Thư mục chính chứa toàn bộ chiến lược kiểm thử tự động
│
├── contract-tests/                      # ✅ Level 1 – Contract Testing (Consumer-driven với Pact)
│   ├── pact/                            #   └── Các file *.pact.json mô tả kỳ vọng từ API Gateway
│   │   ├── user-service.pact.json
│   │   └── token-service.pact.json
│   └── pact-broker/                     #   └── Cấu hình kết nối tới Pact Broker (CI/CD)
│       └── pact-broker.config.js
│
├── integration-tests/                  # 🔗 Level 2 – Kiểm thử tích hợp nhiều dịch vụ
│   ├── test_login_flow.py              #   └── Luồng Google Login (Auth → User → Token)
│   ├── test_token_revocation.py        #   └── Luồng thu hồi token
│   ├── test_rbac_update.py             #   └── Luồng cập nhật RBAC → invalidation
│   └── test_tenant_isolation.py        #   └── Luồng xác thực ngăn chặn truy cập chéo tenant
│
├── load-tests/                         # ⚡ Level 3 – Kiểm thử hiệu năng & chịu tải (sử dụng k6)
│   ├── k6_login.js                     #   └── Bắn tải vào token-service
│   └── k6_userquery.js                 #   └── Đo throughput truy vấn user-service
│
├── chaos-tests/                        # 💥 Level 3 – Chaos & Resilience Testing
│   └── chaos_user_slowdown.py          #   └── Mô phỏng user-service bị chậm
│
├── security-tests/                     # 🔐 Level 4 – Security & Logic Abuse Testing
│   ├── test_jwt_variants.py            #   └── Test với token revoked/expired/bị chỉnh sửa
│   ├── test_cross_tenant.py            #   └── Truy cập chéo tenant → phải bị từ chối
│   ├── test_otp_spam.py                #   └── Spam OTP vượt giới hạn
│   └── zap_scan_config.yaml            #   └── Cấu hình OWASP ZAP scan tự động
│
├── reports/                            # 📊 Kết quả kiểm thử & dashboard
│   └── dashboard/                      #   └── Tùy chọn hiển thị bằng Allure hoặc Grafana
│       ├── allure-results/
│       └── index.html
│
└── README.md                           # 📘 Mô tả toàn bộ chiến lược kiểm thử, hướng dẫn chạy, checklist 5* (file này)
```

---

## 3. ✅ Checklist Đánh Giá Chất Lượng Contract

> Tham khảo: [`5* Contract Testing Standard`](../docs/standards/5s.contract.testing.standard.md)

* ⭐ 1-Star: Tồn tại file `.pact.json`, test happy path
* ⭐⭐ 2-Star: Bao phủ các mã lỗi chính (400, 401, 403, 404)
* ⭐⭐⭐ 3-Star: Có `Authorization`, `X-Tenant-ID`, dùng `providerState`
* ⭐⭐⭐⭐ 4-Star: Tích hợp CI/CD, tag, chặn release khi fail
* ⭐⭐⭐⭐⭐ 5-Star: Có `description`, `matchers`, backward-compatible, tài liệu link rõ ràng

---

## 4. 🛠️ Hướng Dẫn Chạy Test

### 4.1. 🧪 Contract Test (Pact)

Contract Test giúp đảm bảo các Core Services (do vendor cung cấp) **tuân thủ đúng giao diện API đã cam kết**, từ góc nhìn của hệ thống consumer như `API Gateway`.

Chúng ta sử dụng **[Pact](https://docs.pact.io/)** làm công cụ kiểm thử chủ đạo, và tích hợp với **Pact Broker** để quản lý version & xác thực tương thích.

---

#### 🔧 Cài đặt ban đầu (local)

```bash
cd tests/contract-tests/
npm install      # cài dependencies cho chạy test Pact
```

> Lưu ý: Có thể sử dụng `yarn` nếu team chuẩn hóa.

---

#### 🧬 Cấu trúc thư mục

```plaintext
contract-tests/
├── pact/
│   ├── user-service.pact.json        # file contract do consumer định nghĩa
│   └── token-service.pact.json
├── test/
│   ├── user-service.test.js          # mã test định nghĩa các interaction Pact
│   └── token-service.test.js
├── pact-broker/
│   └── pact-broker.config.js         # config endpoint, credentials
├── package.json
└── README.md
```

---

#### ▶️ Chạy test local

```bash
npm run test
```

Script này sẽ:

* Spin up Pact mock server
* Chạy các interaction từ file test
* Sinh file `.pact.json` nếu pass

---

#### 🚀 Publish contract lên Pact Broker

```bash
npm run publish
```

Yêu cầu:

* Biến môi trường `PACT_BROKER_URL`, `PACT_BROKER_USERNAME`, `PACT_BROKER_PASSWORD` được cấu hình
* Hoặc chỉnh trực tiếp trong `pact-broker/publish.js`

> Kết quả publish sẽ hiển thị trên giao diện Pact Broker (VD: `https://pact.dx.truongvietanh.edu.vn/`)

---

#### 🧩 Tagging & phiên bản hóa

Khi publish, nên gắn tag phiên bản:

```bash
PACT_TAG=staging PACT_CONSUMER_VERSION=1.3.0 npm run publish
```

Giúp xác định rõ contract nào áp dụng cho môi trường/stage nào.

---

#### 🔍 Verify contract từ phía Provider

Vendor (hoặc CI/CD của Core Service) cần:

* Lấy contract từ Pact Broker
* Chạy verify test (có thể dùng `pact-provider-verifier` hoặc plugin ngôn ngữ tương ứng)
* Kết quả xác thực sẽ hiển thị trên broker

---

#### 🛑 Tích hợp can-i-deploy (tùy chọn)

Kiểm tra khả năng deploy an toàn:

```bash
pact-broker can-i-deploy \
  --pacticipant "api-gateway" \
  --version 1.3.0 \
  --to-environment production
```

---

> 💡 Mẹo: Mỗi khi thay đổi OpenAPI schema, hãy cập nhật lại interaction & regenerate `.pact.json` để đảm bảo contract test luôn phản ánh đúng kỳ vọng của hệ thống consumer.

---

Dưới đây là nội dung chi tiết cho mục `### 4.2. 🔗 Integration Test (pytest)`, hướng dẫn cụ thể cách viết, chạy, tổ chức và mở rộng các bài kiểm thử tích hợp sử dụng `pytest`:

---

### 4.2. 🔗 Integration Test (pytest)

Integration Test kiểm tra **tính đúng đắn của các luồng nghiệp vụ quan trọng**, nơi nhiều Core Services phối hợp với nhau như: `auth-service`, `user-service`, `token-service`.

Các bài test được viết bằng Python sử dụng [`pytest`](https://docs.pytest.org/), cho phép kiểm tra logic đầu-cuối (end-to-end) qua HTTP ở môi trường `integration-staging`.

---

#### 📦 Cài đặt ban đầu

```bash
cd tests/integration-tests/
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**`requirements.txt` mẫu:**

```txt
pytest
httpx
pytest-env
pytest-dotenv
```

---

#### 📂 Cấu trúc thư mục

```plaintext
integration-tests/
├── test_login_flow.py          # Luồng xác thực Google
├── test_token_revocation.py    # Thu hồi token → API Gateway chặn
├── test_rbac_update.py         # RBAC thay đổi → phản ánh qua cache
├── test_tenant_isolation.py    # Token tenant A không truy cập được tenant B
├── conftest.py                 # Fixtures dùng chung (auth, JWT giả lập,...)
├── .env                        # Biến môi trường để config endpoint
└── README.md
```

---

#### ⚙️ Cấu hình biến môi trường `.env`

```dotenv
BASE_URL=https://integration.dx.truongvietanh.edu.vn
TENANT_ID=abc-school
AUTH_HEADER=Bearer dummy-jwt-token
```

> Có thể load tự động qua plugin `pytest-dotenv` hoặc dùng fixture.

---

#### ▶️ Chạy toàn bộ test

```bash
pytest -v
```

Hoặc chạy 1 file:

```bash
pytest test_token_revocation.py
```

---

#### 🧪 Ví dụ: Kiểm tra token bị thu hồi

```python
import httpx

def test_revoked_token_is_blocked():
    token = "eyJhbGciOi..."  # token đã bị revoke
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Tenant-ID": "abc-school"
    }
    response = httpx.get(
        f"{BASE_URL}/users/me",
        headers=headers
    )
    assert response.status_code == 401
```

---

#### 🔁 Các luồng nên kiểm thử

| Tên luồng           | Dịch vụ liên quan            | Mô tả                                      |
| ------------------- | ---------------------------- | ------------------------------------------ |
| `Google Login`      | API GW → Auth → User → Token | Trao đổi token, xác định user              |
| `Token Revocation`  | Token → Redis → API GW       | Token hết hạn phải bị chặn                 |
| `RBAC Cache Update` | User → PubSub → API GW       | Cập nhật phân quyền phải phản ánh tức thời |
| `Tenant Isolation`  | API GW → các service         | Không được phép truy cập chéo tenant       |

---

#### 📎 Ghi chú

* Mọi bài test phải chạy được độc lập
* Dữ liệu test nên được tạo qua API setup (hoặc fixtures), không giả lập DB trực tiếp
* Kết quả test sẽ được lưu về `reports/` nếu tích hợp với `pytest-html` hoặc `Allure`

---
Dưới đây là nội dung chi tiết cho mục `### 4.3. ⚡ Load & Chaos Test (k6)`, hướng dẫn cụ thể cách thiết lập, viết và chạy các bài kiểm thử hiệu năng và resiliency bằng [k6](https://k6.io/):

---

### 4.3. ⚡ Load & Chaos Test (k6)

Load Test kiểm tra **hiệu năng hệ thống dưới tải cao**, còn Chaos Test giúp đánh giá **độ bền và khả năng tự phục hồi (resilience)** của hệ thống khi gặp sự cố bất thường.

Cả hai lớp kiểm thử này được viết bằng [k6](https://k6.io/) – một framework kiểm thử hiệu năng hiện đại, dễ chạy local hoặc tích hợp CI/CD.

---

#### 📦 Cài đặt k6

- Trên macOS:

```bash
brew install k6
```

* Trên Linux:

```bash
sudo apt install k6
```

* Hoặc xem hướng dẫn: [https://k6.io/docs/getting-started/installation](https://k6.io/docs/getting-started/installation)

---

#### 📂 Cấu trúc thư mục

```plaintext
load-tests/
├── k6_login.js               # Kiểm tra hiệu năng token-service (login)
├── k6_userquery.js           # Truy vấn user dưới tải cao
chaos-tests/
├── chaos_user_slowdown.py    # Mô phỏng user-service bị chậm / ngắt kết nối
```

---

#### ▶️ Chạy load test

```bash
cd tests/load-tests/
k6 run k6_login.js
```

---

#### 🧪 Ví dụ: k6\_login.js

```js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 100,               // 100 người dùng ảo
  duration: '30s',        // trong vòng 30 giây
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% request < 500ms
    http_req_failed: ['rate<0.01'],   // Tỉ lệ lỗi < 1%
  }
};

export default function () {
  let res = http.post('https://integration.dx.truongvietanh.edu.vn/token/issue', JSON.stringify({
    provider: "google",
    id_token: "mocked-google-token"
  }), {
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': 'abc-school'
    },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 400ms': (r) => r.timings.duration < 400,
  });

  sleep(1); // chờ 1 giây giữa các lượt
}
```

---

#### 📊 Output mẫu

```plaintext
http_reqs..................: 10000  333.333333/s
http_req_duration..........: avg=280ms min=210ms max=430ms p(95)=390ms
http_req_failed............: 0.2%
```

---

### 4.4. 💥 Chaos Test – Mô phỏng lỗi hệ thống

Chaos Test được thực hiện bằng cách:

* Tạm thời **làm chậm hoặc ngắt** 1 service (vd: user-service)
* Chạy lại các luồng API quan trọng để xem hệ thống có phục hồi được không

#### Ví dụ (chaos\_user\_slowdown.py):

```python
import httpx
import time

def test_user_service_slow():
    start = time.time()
    res = httpx.get("https://integration.dx.truongvietanh.edu.vn/users/me", headers={
        "Authorization": "Bearer dummy",
        "X-Tenant-ID": "abc-school"
    })
    duration = time.time() - start
    assert duration < 2, "User service quá chậm"
```

> 🔧 Có thể kết hợp với mô phỏng network delay, restart container, hoặc dùng tools như [Litmus](https://litmuschaos.io/), [Gremlin](https://www.gremlin.com/).

---

#### 🎯 Kịch bản Chaos phổ biến

| Tình huống                       | Kết quả kỳ vọng                                  |
| -------------------------------- | ------------------------------------------------ |
| `user-service` chậm hoặc lỗi     | `API Gateway` vẫn trả lỗi rõ ràng, không treo    |
| `Pub/Sub` bị delay               | Các tenant vẫn hoạt động, có cảnh báo delay      |
| `token-service` restart đột ngột | Hệ thống tự động recover, không mất token hợp lệ |

---

#### 📎 Ghi chú

* Các bài test load nên chạy định kỳ hoặc trước mỗi đợt release lớn
* Chaos test có thể tích hợp với môi trường staging bằng tay hoặc trong CI
* Nên log `p95`, `throughput`, `error rate` và đưa vào dashboard (`Grafana`, `Allure`...)

---

Dưới đây là nội dung chi tiết cho mục `### 4.5. 🔐 Security Test (Postman hoặc ZAP)`, bao gồm hướng dẫn sử dụng **Postman/Newman** để test các logic abuse và **OWASP ZAP** để quét lỗ hổng tự động:

---

### 4.5. 🔐 Security Test (Postman hoặc ZAP)

Security Test giúp phát hiện các điểm yếu tiềm tàng trong hệ thống, bao gồm:
- Lỗi xác thực & phân quyền (401, 403)
- Lỗi isolation dữ liệu tenant
- Lỗi spam logic (OTP abuse, mass user creation)
- Lỗ hổng phổ biến (XSS, SQLi, SSRF...) thông qua ZAP

---

#### 🧪 A. Kiểm thử logic bảo mật – Dùng Postman / Newman

---

##### 📂 Cấu trúc thư mục gợi ý

```plaintext
security-tests/
├── otp-abuse.postman_collection.json     # Gửi quá nhiều OTP → hệ thống phải chặn
├── tenant-isolation.postman_collection.json
├── replay-token.postman_collection.json  # Token revoked vẫn dùng → phải bị chặn
├── mass-user-creation.postman_collection.json
└── environments/
    └── integration.postman_environment.json
```

---

##### ▶️ Chạy test bằng [Newman](https://www.npmjs.com/package/newman)

```bash
newman run otp-abuse.postman_collection.json \
  --environment environments/integration.postman_environment.json \
  --reporters cli,html \
  --reporter-html-export reports/otp-abuse.html
```

---

##### ✅ Các kịch bản nên kiểm tra

| Kịch bản                                | Kết quả mong đợi                                         |
| --------------------------------------- | -------------------------------------------------------- |
| Gửi OTP liên tục > 5 lần/phút           | Nhận `429 Too Many Requests`                             |
| Truy cập chéo tenant                    | Nhận `403 Forbidden`                                     |
| Sử dụng JWT đã bị revoke                | Nhận `401 Unauthorized`                                  |
| Sử dụng JWT sửa tay (invalid signature) | Nhận `401 Unauthorized`                                  |
| Dùng user thường gọi API của admin      | Nhận `403 Forbidden`                                     |
| Tạo user ảo hàng loạt qua API           | Hệ thống giới hạn rate hoặc require captcha/email verify |

---

#### 🔍 B. Kiểm thử lỗ hổng tự động – Dùng OWASP ZAP

---

##### 📦 Cài đặt ZAP

* Dùng bản Desktop (GUI) hoặc bản CLI (headless):

  * [https://www.zaproxy.org/download/](https://www.zaproxy.org/download/)

---

##### ▶️ Chạy ZAP tự động với cấu hình YAML

```bash
zap.sh -cmd -autorun zap_scan_config.yaml
```

---

##### 🧾 Cấu hình `zap_scan_config.yaml` mẫu

```yaml
env:
  contexts:
    - name: dx-vas
      urls:
        - https://integration.dx.truongvietanh.edu.vn/
      includePaths:
        - https://integration.dx.truongvietanh.edu.vn/.*
      authentication:
        method: "httpHeader"
        parameters:
          headerName: "Authorization"
          headerValue: "Bearer {{JWT}}"

jobs:
  - type: passiveScan-config
  - type: activeScan
    policy: Default Policy
  - type: report
    parameters:
      format: html
      outFile: reports/zap-security-report.html
```

> Ghi chú: JWT có thể được chèn qua biến môi trường hoặc file `.env`.

---

##### 📤 Xuất báo cáo ZAP

* Báo cáo chi tiết HTML nằm tại: `reports/zap-security-report.html`
* Có thể tích hợp vào Allure hoặc hệ thống dashboard riêng

---

#### 📎 Ghi chú thực thi

* Luôn kiểm tra **RBAC + Isolation** tại từng API quan trọng
* Chạy ZAP định kỳ (tuần/tháng) hoặc sau mỗi thay đổi cấu trúc HTTP response
* Postman/Newman lý tưởng để kiểm thử nghiệp vụ logic abuse (không phát hiện bằng scan tool)

---

> 🔐 **Chốt lại:** Security Testing không chỉ là quét lỗ hổng – mà còn là việc chủ động xác thực các hành vi sai lệch trong nghiệp vụ mà hacker hoặc user ác ý có thể khai thác.

---

Dưới đây là nội dung chi tiết cho mục `## 5. 🚀 Tích Hợp CI/CD`, mô tả cách tích hợp đầy đủ 4 lớp kiểm thử (`Contract`, `Integration`, `Performance`, `Security`) vào quy trình CI/CD của hệ thống DX-VAS, tuân theo `ADR-001-ci-cd.md` và `ADR-018-release-approval-policy.md`:

---

## 5. 🚀 Tích Hợp CI/CD

Toàn bộ bộ kiểm thử `tests/` phải được **tích hợp chặt chẽ vào quy trình CI/CD**, giúp kiểm soát chất lượng đầu-cuối của các Core Services do vendor triển khai.

---

### 5.1. 🎯 Mục tiêu tích hợp CI/CD

1. **Chạy test tự động với mọi thay đổi dịch vụ (staging hoặc release).**
2. **Phát hiện sớm lỗi contract hoặc sai lệch nghiệp vụ.**
3. **Chặn việc release nếu không đạt tiêu chuẩn kiểm thử.**
4. **Ghi log + kết quả kiểm thử để audit.**

---

### 5.2. 📦 Tích hợp tại các giai đoạn pipeline

| Giai đoạn | Mục đích | Thư mục test tương ứng |
|----------|----------|-------------------------|
| `post-merge` (dev branch) | Xác thực contract mới | `tests/contract-tests/` |
| `pre-release` (staging) | Chạy end-to-end flow, RBAC, token, tenant isolation | `tests/integration-tests/` |
| `performance-check` | Kiểm tra hiệu năng cơ bản (p95, throughput) | `tests/load-tests/` |
| `chaos-on-demand` | Mô phỏng lỗi service → resiliency | `tests/chaos-tests/` |
| `security-scan` | Kiểm tra JWT, tenant, spam, lỗ hổng OWASP | `tests/security-tests/` |

---

### 5.3. 🧪 Cấu trúc thư mục Git

```plaintext
.github/
└── workflows/
    ├── contract-test.yml
    ├── integration-test.yml
    ├── load-test.yml
    ├── chaos-test.yml
    └── security-test.yml
```

---

### 5.4. ✅ Quy tắc pass/fail

| Test Layer       | Nếu fail                | Tác động                              |
| ---------------- | ----------------------- | ------------------------------------- |
| Contract Test    | Contract sai schema     | Block release ngay lập tức            |
| Integration Test | Luồng nghiệp vụ lỗi     | Không thể approve staging             |
| Load Test        | p95 quá cao / lỗi >1%   | Cảnh báo & yêu cầu performance review |
| Chaos Test       | Hệ thống không recover  | Block release hoặc rollback vendor    |
| Security Test    | Phát hiện lỗ hổng logic | Phải fix trước khi deploy production  |

---

### 5.5. 🧩 Tích hợp Pact Broker

* `contract-test.yml` sẽ:

  * Publish `.pact.json` từ phía API Gateway (consumer)
  * Trigger `verify` từ phía vendor (provider)
  * Gọi `can-i-deploy` API để xác thực an toàn

---

### 5.6. 📊 Kết quả & Dashboard

Kết quả kiểm thử được lưu và hiển thị tại:

* `reports/` (dưới dạng HTML, JSON, Allure)
* `Grafana Dashboard` (p95, error rate từ k6 hoặc Prometheus)
* `QA Portal` (nội bộ – hiện trạng pass/fail của từng service)

---

### 5.7. 📌 Điều kiện để xét duyệt Release (ADR-018)

| Điều kiện                 | Đạt nếu                                                                |
| ------------------------- | ---------------------------------------------------------------------- |
| `contract test passed`    | Tất cả pact verified                                                   |
| `integration test passed` | 100% test nghiệp vụ thông qua                                          |
| `performance test passed` | p95 < 500ms, error rate < 1%                                           |
| `security test passed`    | Không có lỗi nghiêm trọng (High/Critical)                              |
| ✅ Approval                | Nếu **tất cả test pass**, hệ thống mới trigger bước `release approval` |

---

> 🛡️ CI/CD không chỉ là công cụ tự động hóa – mà là **tuyến phòng thủ chất lượng** chủ động, giúp đội ngũ kiểm soát rủi ro từ vendor và đảm bảo mọi thứ được vận hành đúng như thiết kế.

---

## 6. 👥 Quản Trị & Review

Việc xây dựng bộ kiểm thử mạnh mẽ là chưa đủ — để duy trì chất lượng lâu dài, ta cần quy trình **quản trị và review nghiêm túc**, tích hợp chặt vào vòng đời phát triển phần mềm.

---

### 6.1. 🧑‍💼 Ai là người chịu trách nhiệm?

| Vị trí | Vai trò |
|--------|---------|
| **Consumer Lead (API Gateway team)** | Chủ sở hữu chính của test suite (đặc biệt là contract test) |
| **QA Engineer / DevOps** | Tích hợp CI/CD, theo dõi pass/fail, hỗ trợ vendor xác minh |
| **Vendor** | Phải verify contract & chịu trách nhiệm fix khi fail |
| **Tech Lead** | Xét duyệt tiêu chí test pass/fail trước khi release production |

---

### 6.2. 📋 Checklist Review khi tạo / cập nhật test

Mỗi Pull Request (PR) thay đổi test cần đảm bảo:

- [ ] Có cập nhật `.pact.json` nếu schema API thay đổi
- [ ] Có link đến tài liệu liên quan: OpenAPI, ADR (ví dụ: `ADR-010`, `ADR-011`)
- [ ] Tên file, test case mô tả rõ mục đích nghiệp vụ
- [ ] Dùng matchers thay vì hardcode giá trị trong contract
- [ ] Gắn tag vào contract test (VD: `dev`, `staging`, `production`)
- [ ] Được review bởi ít nhất 1 thành viên khác (không phải người viết test)

---

### 6.3. 📚 Tài liệu / README yêu cầu trong mỗi thư mục

Mỗi module trong `tests/` (vd: `contract-tests/`, `integration-tests/`) **phải có `README.md` riêng**, mô tả:

- Mục tiêu test của thư mục
- Cách chạy test
- Các ràng buộc giả định (assumptions)
- Tên team sở hữu chính (ai chịu trách nhiệm review/fix khi fail)
- Checklist 5⭐ áp dụng ra sao

---

### 6.4. 🔁 Lịch kiểm thử & bảo trì

| Hành động | Tần suất | Người phụ trách |
|----------|----------|-----------------|
| Chạy test full suite | Mỗi lần deploy staging | CI/CD |
| Review contract test | Mỗi thay đổi OpenAPI | Consumer team |
| Bảo trì luồng integration | Hàng tuần / khi thay đổi flow | QA / Dev |
| Load test (p95 check) | Trước khi scale lên | DevOps |
| ZAP security scan | Hàng tháng | QA |

---

### 6.5. 📊 Theo dõi chất lượng & báo cáo

- Kết quả test phải được **lưu log đầy đủ** (`reports/`) và hiển thị trong:
  - Dashboard CI/CD (GitHub Actions / GitLab CI / Jenkins...)
  - Allure hoặc HTML report dễ đọc với non-dev
  - Đối với load/security: push chỉ số (p95, fail rate) lên Grafana (tuỳ chọn)

---

### 6.6. 🛡️ Quản lý thất bại (Fail Governance)

| Loại lỗi | Hành động |
|----------|-----------|
| Contract mismatch | Block CI, yêu cầu vendor fix |
| Test tích hợp lỗi | Tạm hoãn release, điều tra nguyên nhân |
| Test load fail (p95 > ngưỡng) | Cảnh báo performance, review lại auto-scaling |
| Test security fail | Không release production nếu severity ≥ High |

---

### 6.7. 🔐 Audit nội bộ & phản hồi vendor

- Lưu mọi kết quả kiểm thử vào S3 / server nội bộ để đối chiếu khi cần
- Có thể tạo báo cáo định kỳ cho vendor: "Top 3 lỗi contract vi phạm", "Luồng RBAC thường xuyên lỗi", v.v.

---

> 🤝 Một test suite tốt không chỉ là "test chạy pass", mà là một **cam kết chất lượng có trách nhiệm**, có người sở hữu rõ ràng, và có hệ thống phát hiện – phản ứng – cải thiện minh bạch.

---

## 7. 📚 Tài Liệu Liên Quan

### 🧾 Quyết định kiến trúc & chuẩn dự án

* [`ADR 001 - CI/CD Pipeline`](../docs/ADR/adr-001-ci-cd.md)
* [`ADR 004 - Security Strategy`](../docs/ADR/adr-004-security.md)
* [`ADR 006 - Auth Strategy`](../docs/ADR/adr-006-auth-strategy.md)
* [`ADR 007 - RBAC`](../docs/ADR/adr-007-rbac.md)
* [`ADR 008 - Audit Logging`](../docs/ADR/adr-008-audit-logging.md)
* [`ADR 010 - Contract Testing`](../docs/ADR/adr-010-contract-testing.md)
* [`ADR 011 - API Error Format`](../docs/ADR/adr-011-api-error-format.md)
* [`ADR 016 - Auto Scaling`](../docs/ADR/adr-016-auto-scaling.md)
* [`ADR 018 - Release Approval Policy`](../docs/ADR/adr-018-release-approval-policy.md)
* [`ADR 022 - SLA & SLO Monitoring`](../docs/ADR/adr-022-sla-slo-monitoring.md)

---

### ⭐ Bộ tiêu chuẩn 5 sao

* [`5* Contract Testing Standard`](../docs/standards/5s.contract.testing.standard.md)
* [`5* Service Design`](../docs/standards/5s.service.design.standard.md)
* [`5* Interface Contract`](../docs/standards/5s.interface.contract.doc.standard.md)
* [`5* OpenAPI Standard`](../docs/standards/5s.openapi.standard.md)
* [`Error Code Specification`](../docs/standards/error-codes.md)

---

### 🔧 Tài liệu kỹ thuật chính thức

* [Pact JS Docs](https://docs.pact.io/getting_started/using_the_library)
* [Pact Broker Docs](https://docs.pact.io/pact_broker)
* [k6 Load Testing Docs](https://k6.io/docs/)
* [Postman Collection Format](https://learning.postman.com/docs/collections/intro-to-collections/)
* [Newman CLI](https://www.npmjs.com/package/newman)
* [OWASP ZAP Docs](https://www.zaproxy.org/docs/)
* [pytest Documentation](https://docs.pytest.org/en/stable/)

---

> **Ghi chú:** Đây là một phần cốt lõi trong chiến lược kiểm soát chất lượng DX-VAS. Mọi vendor hoặc đội phát triển backend đều phải tuân thủ kiểm thử thông qua test suite này.
