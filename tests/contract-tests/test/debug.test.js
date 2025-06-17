const { Pact, Matchers } = require('@pact-foundation/pact');
const path = require('path');
const axios = require('axios');

// --- 1. Cấu hình Pact Provider và Consumer ---
const provider = new Pact({
  consumer: 'APIGateway_And_AuthService',
  provider: 'TokenService',
  port: 1234,
  log: path.resolve(process.cwd(), '../logs', 'pact.log'),
  dir: path.resolve(process.cwd(), '../pacts'),
  logLevel: 'warn',
});

// --- 2. Định nghĩa các hằng số để đảm bảo nhất quán ---
const TENANT_ID = 'tenant-abc';
const AUTH_HEADER_MATCHER = Matchers.term({
  generate: 'Bearer some-internal-service-token',
  matcher: '^Bearer .+$',
});
const VALID_SESSION_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const TIMESTAMP_MATCHER = Matchers.term({
  generate: '2025-06-16T22:57:57.123Z',
  matcher: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?Z$'
});

// --- 3. Bắt đầu bộ kiểm thử ---
describe('Token Service API Contract', () => {
  // Bắt đầu và kết thúc Mock Server cho toàn bộ suite
  beforeAll(() => provider.setup());
  afterAll(() => provider.finalize());

  //================================================================================
  //== Endpoint: POST /v1/token/issue
  //================================================================================
  describe('when receiving a request to issue a token', () => {
    test('should respond with 200 and a new token pair for a valid request', async () => {
      // Arrange
      await provider.addInteraction({
        state: 'a valid request to issue a token',
        uponReceiving: 'a request to issue tokens for an authenticated user',
        withRequest: {
          method: 'POST',
          path: '/v1/token/issue',
          headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': TENANT_ID, 'Authorization': AUTH_HEADER_MATCHER },
          body: {
            sub: Matchers.like('user-123'),
            roles: Matchers.eachLike('teacher'),
            permissions: Matchers.eachLike('grade.read'),
            session_id: Matchers.uuid(VALID_SESSION_ID),
            login_method: Matchers.term({ generate: 'otp', matcher: '^(google|otp|local)$' }),
          },
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: {
            data: {
              access_token: Matchers.like('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.e30.abc'),
              refresh_token: Matchers.like('refresh.token.string'),
              token_type: 'Bearer',
              expires_in: Matchers.integer(900),
            },
            meta: { trace_id: Matchers.like('req-uuid-123'), timestamp: TIMESTAMP_MATCHER },
          },
        },
      });

      // Act
      const client = axios.create({ baseURL: provider.mockService.baseUrl });
      await client.post('/v1/token/issue',
        { sub: 'user-123', roles: ['teacher'], permissions: ['grade.read'], session_id: VALID_SESSION_ID, login_method: 'otp' },
        { headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': TENANT_ID, 'Authorization': 'Bearer some-internal-service-token' } }
      );
      
      // Assert
      await provider.verify();
    });

    test('should respond with 400 if required fields are missing', async () => {
      // Arrange
      await provider.addInteraction({
        state: 'a token issue request is missing the sub field',
        uponReceiving: 'a request to issue a token without a subject',
        withRequest: {
          method: 'POST',
          path: '/v1/token/issue',
          headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': TENANT_ID, 'Authorization': AUTH_HEADER_MATCHER },
          body: { roles: ['teacher'], session_id: VALID_SESSION_ID },
        },
        willRespondWith: {
          status: 400,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: {
            error: { code: 'common.validation_error', message: Matchers.like('Validation failed') },
            meta: { trace_id: Matchers.like('req-uuid-456'), timestamp: TIMESTAMP_MATCHER },
          },
        },
      });
      
      // Act & Assert for expected error
      const client = axios.create({ baseURL: provider.mockService.baseUrl });
      await expect(client.post('/v1/token/issue',
        { roles: ['teacher'], session_id: VALID_SESSION_ID },
        { headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': TENANT_ID, 'Authorization': 'Bearer some-internal-service-token' } }
      )).rejects.toThrow();

      // Assert that the interaction was met
      await provider.verify();
    });
  });

  //================================================================================
  //== Endpoint: POST /v1/token/revoke
  //================================================================================
  describe('when receiving a request to revoke a token', () => {
    test('should respond with 204 for a valid session', async () => {
      // Arrange
      await provider.addInteraction({
        state: 'a session with id sess-to-revoke exists',
        uponReceiving: 'a request to revoke an active session',
        withRequest: {
          method: 'POST',
          path: '/v1/token/revoke',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer valid-access-token', 'X-Tenant-ID': TENANT_ID },
          body: { session_id: 'sess-to-revoke' },
        },
        willRespondWith: { status: 204 },
      });

      // Act
      const client = axios.create({ baseURL: provider.mockService.baseUrl });
      await client.post('/v1/token/revoke',
        { session_id: 'sess-to-revoke' },
        { headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer valid-access-token', 'X-Tenant-ID': TENANT_ID } }
      );
      
      // Assert
      await provider.verify();
    });
  });

  //================================================================================
  //== Endpoint: GET /.well-known/jwks.json
  //================================================================================
  describe('when receiving a request for JWKS', () => {
    test('should respond with 200 and a set of public keys', async () => {
      // Arrange
      await provider.addInteraction({
        state: 'the token service has active public keys',
        uponReceiving: 'a request for the JSON Web Key Set',
        withRequest: { method: 'GET', path: '/.well-known/jwks.json' },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: { keys: Matchers.eachLike({ kty: 'RSA', use: 'sig', alg: 'RS256', kid: Matchers.like('key-id-1'), n: Matchers.like('uA6kkl5e8fKNS3k0_4ZFnN...'), e: 'AQAB' }) },
        },
      });

      // Act
      const client = axios.create({ baseURL: provider.mockService.baseUrl });
      await client.get('/.well-known/jwks.json');
      
      // Assert
      await provider.verify();
    });
  });
});