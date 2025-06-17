const path = require('path');
const { Pact, Matchers } = require('@pact-foundation/pact');
const axios = require('axios');

const { like, term } = Matchers;

const provider = new Pact({
  consumer: 'API Gateway',
  provider: 'token-service',
  port: 1234,
  log: path.resolve(process.cwd(), 'logs', 'pact.log'),
  dir: path.resolve(process.cwd(), 'pact'),
  logLevel: 'INFO',
  spec: 3,
});

describe('Pact with token-service', () => {
  // Set up the Pact mock server before all tests
  beforeAll(() => provider.setup());
  
  // Tear down the Pact mock server after all tests have run
  afterAll(() => provider.finalize());

  describe('POST /token/issue', () => {
    // Định nghĩa interaction cho endpoint phát hành token.
    // Dựa vào interface-contract.md và openapi.yaml, chúng ta yêu cầu một request POST với thông tin đăng nhập,
    // và mong đợi được trả về access_token cùng thời gian hết hạn (expires_in).
    beforeAll(() =>
      provider.addInteraction({
        state: 'a valid user exists',
        uponReceiving: 'a request to issue a token with valid credentials',
        withRequest: {
          method: 'POST',
          path: '/token/issue',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            email: like('user@example.com'),
            password: like('password123')
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            access_token: like('abc123token'),
            expires_in: like(3600)
          },
        },
      })
    );

    it('should issue a token when valid credentials are provided', async () => {
      const url = provider.mockService.baseUrl + '/token/issue';
      const requestBody = {
        email: 'user@example.com',
        password: 'password123'
      };

      const response = await axios.post(url, requestBody, {
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('access_token');
      expect(response.data).toHaveProperty('expires_in');
    });

    // Xác nhận các interaction sau mỗi test
    afterEach(() => provider.verify());
  });
});