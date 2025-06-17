/**
 * @file Contract tests for the TokenService provider
 * @version 1.0.0
 * @description Consumer-driven contract tests ensuring TokenService adheres to interface specifications
 * @see {@link ../../docs/services/token-service/interface-contract.md}
 * @see {@link ../../docs/services/token-service/openapi.yaml}
 * @author rockymountain
 * @lastModified 2025-06-17 14:44:27
 */

const { PactV3 } = require('@pact-foundation/pact');
const { Matchers } = require('@pact-foundation/pact');
const path = require('path');
const axios = require('axios');

const { like, eachLike, term, uuid, iso8601DateTime } = Matchers;

// Common headers
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json'
};

// Constants for request/response values
const CONSTANTS = {
  TENANT_ID: 'tenant-abc',
  ERROR_CODES: {
    VALIDATION: 'common.validation_error',
    UNAUTHORIZED: 'auth.unauthorized',
    SESSION_REVOKED: 'auth.session.revoked',
    SESSION_NOT_FOUND: 'session.not_found'
  },
  PATHS: {
    TOKEN_ISSUE: '/v1/token/issue',
    TOKEN_REFRESH: '/v1/token/refresh',
    TOKEN_REVOKE: '/v1/token/revoke',
    JWKS: '/.well-known/jwks.json'
  }
};

// Common response fixtures
const ERROR_RESPONSE_TEMPLATE = {
  meta: {
    trace_id: like('req-uuid-123'),
    timestamp: iso8601DateTime()
  }
};

// Pact Provider Configuration
const provider = new PactV3({
  consumer: 'APIGateway_And_AuthService',
  provider: 'TokenService',
  log: path.resolve(process.cwd(), 'logs', 'pact.log'),
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'warn',
});

describe('Token Service API Contract', () => {
  
  /**
   * POST /v1/token/issue
   * Issue new token pairs for authenticated internal service calls
   */
  describe('Token Issuance API', () => {
    test('should respond with 200 and a new token pair for a valid request', async () => {
      // Arrange
      const interaction = provider
        .given('An internal service call with valid user data')
        .uponReceiving('a request to issue a new token pair')
        .withRequest({
          method: 'POST',
          path: CONSTANTS.PATHS.TOKEN_ISSUE,
          headers: {
            ...DEFAULT_HEADERS,
            'X-Tenant-ID': CONSTANTS.TENANT_ID,
            'Authorization': like('Bearer internal-auth-token')
          },
          body: like({
            sub: 'user-123',
            roles: ['teacher'],
            permissions: ['grade.read'],
            session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            login_method: 'otp'
          })
        })
        .willRespondWith({
          status: 200,
          headers: DEFAULT_HEADERS,
          body: like({
            access_token: 'eyJhbGciOiJSUzI1NiIs...',
            refresh_token: 'eyJhbGciOiJSUzI1NiIs...',
            expires_in: 3600
          })
        });

      await provider.executeTest(async (mockServer) => {
        // Act
        const client = axios.create({ baseURL: mockServer.url });
        const response = await client.post(CONSTANTS.PATHS.TOKEN_ISSUE,
          {
            sub: 'user-123',
            roles: ['teacher'],
            permissions: ['grade.read'],
            session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            login_method: 'otp'
          },
          {
            headers: {
              ...DEFAULT_HEADERS,
              'X-Tenant-ID': CONSTANTS.TENANT_ID,
              'Authorization': 'Bearer internal-auth-token'
            }
          }
        );

        // Assert
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('access_token');
        expect(response.data).toHaveProperty('refresh_token');
        expect(response.data).toHaveProperty('expires_in');
      });
    });

    test('should respond with 400 if required fields are missing', async () => {
      // Arrange
      const interaction = provider
        .given('a token issue request is missing the required sub field')
        .uponReceiving('a request to issue a token without a subject')
        .withRequest({
          method: 'POST',
          path: CONSTANTS.PATHS.TOKEN_ISSUE,
          headers: {
            ...DEFAULT_HEADERS,
            'X-Tenant-ID': CONSTANTS.TENANT_ID,
            'Authorization': like('Bearer internal-auth-token')
          },
          body: like({
            roles: ['teacher'],
            session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
          })
        })
        .willRespondWith({
          status: 400,
          headers: DEFAULT_HEADERS,
          body: {
            error: {
              code: CONSTANTS.ERROR_CODES.VALIDATION,
              message: like('Validation failed: sub is required')
            },
            ...ERROR_RESPONSE_TEMPLATE
          }
        });

      await provider.executeTest(async (mockServer) => {
        // Act & Assert
        const client = axios.create({ baseURL: mockServer.url });
        await expect(client.post(CONSTANTS.PATHS.TOKEN_ISSUE,
          {
            roles: ['teacher'],
            session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
          },
          {
            headers: {
              ...DEFAULT_HEADERS,
              'X-Tenant-ID': CONSTANTS.TENANT_ID,
              'Authorization': 'Bearer internal-auth-token'
            }
          }
        )).rejects.toThrow('Request failed with status code 400');
      });
    });

    test('should respond with 401 if Authorization header is missing', async () => {
      // Arrange
      const interaction = provider
        .given('a request is made without an Authorization header')
        .uponReceiving('a request to issue a token with no auth')
        .withRequest({
          method: 'POST',
          path: CONSTANTS.PATHS.TOKEN_ISSUE,
          headers: {
            ...DEFAULT_HEADERS,
            'X-Tenant-ID': CONSTANTS.TENANT_ID
          },
          body: like({
            sub: 'user-123'
          })
        })
        .willRespondWith({
          status: 401,
          headers: DEFAULT_HEADERS,
          body: {
            error: {
              code: CONSTANTS.ERROR_CODES.UNAUTHORIZED,
              message: like('Missing or invalid authorization token')
            },
            ...ERROR_RESPONSE_TEMPLATE
          }
        });

      await provider.executeTest(async (mockServer) => {
        // Act & Assert
        const client = axios.create({ baseURL: mockServer.url });
        await expect(client.post(CONSTANTS.PATHS.TOKEN_ISSUE,
          { sub: 'user-123' },
          {
            headers: {
              ...DEFAULT_HEADERS,
              'X-Tenant-ID': CONSTANTS.TENANT_ID
            }
          }
        )).rejects.toThrow('Request failed with status code 401');
      });
    });
  });

  /**
   * POST /v1/token/refresh
   * Refresh access tokens using valid refresh tokens
   */
  describe('Token Refresh API', () => {
    test('should respond with 200 and new token pair for valid refresh token', () => {
      provider
        .given('a valid refresh token exists')
        .uponReceiving('a request to refresh an access token')
        .withRequest({
          method: 'POST',
          path: CONSTANTS.PATHS.TOKEN_REFRESH,
          headers: {
            'Authorization': 'Bearer valid-refresh-token',
            'X-Tenant-ID': CONSTANTS.TENANT_ID
          }
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            access_token: like('eyJhbGciOiJSUzI1NiIs...'),
            refresh_token: like('eyJhbGciOiJSUzI1NiIs...'),
            expires_in: like(3600)
          }
        });

      return provider.executeTest(async (mockServer) => {
        const client = axios.create({ baseURL: mockServer.url });
        const response = await client.post(CONSTANTS.PATHS.TOKEN_REFRESH,
          null,
          {
            headers: {
              'Authorization': 'Bearer valid-refresh-token',
              'X-Tenant-ID': CONSTANTS.TENANT_ID
            }
          }
        );
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('access_token');
        expect(response.data).toHaveProperty('refresh_token');
        expect(response.data).toHaveProperty('expires_in');
      });
    });

    test('should respond with 403 if refresh token has been revoked', () => {
      provider
        .given('the provided refresh token has been revoked')
        .uponReceiving('a request to refresh using a revoked token')
        .withRequest({
          method: 'POST',
          path: CONSTANTS.PATHS.TOKEN_REFRESH,
          headers: {
            'Authorization': 'Bearer a-revoked-refresh-token',
            'X-Tenant-ID': CONSTANTS.TENANT_ID
          }
        })
        .willRespondWith({
          status: 403,
          headers: { 'Content-Type': 'application/json' },
          body: {
            error: {
              code: CONSTANTS.ERROR_CODES.SESSION_REVOKED,
              message: like('Session has been revoked')
            },
            ...ERROR_RESPONSE_TEMPLATE
          }
        });

      return provider.executeTest(async (mockServer) => {
        const client = axios.create({ baseURL: mockServer.url });
        await expect(client.post(CONSTANTS.PATHS.TOKEN_REFRESH,
          null,
          {
            headers: {
              'Authorization': 'Bearer a-revoked-refresh-token',
              'X-Tenant-ID': CONSTANTS.TENANT_ID
            }
          }
        )).rejects.toThrow('Request failed with status code 403');
      });
    });
  });

  /**
   * POST /v1/token/revoke
   * Revoke active sessions
   */
  describe('Token Revocation API', () => {
    test('should respond with 204 for a valid session', () => {
      provider
        .given('a session with id sess-to-revoke exists')
        .uponReceiving('a request to revoke an active session')
        .withRequest({
          method: 'POST',
          path: CONSTANTS.PATHS.TOKEN_REVOKE,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer valid-access-token',
            'X-Tenant-ID': CONSTANTS.TENANT_ID
          },
          body: { session_id: 'sess-to-revoke' }
        })
        .willRespondWith({ status: 204 });

      return provider.executeTest(async (mockServer) => {
        const client = axios.create({ baseURL: mockServer.url });
        const response = await client.post(CONSTANTS.PATHS.TOKEN_REVOKE,
          { session_id: 'sess-to-revoke' },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer valid-access-token',
              'X-Tenant-ID': CONSTANTS.TENANT_ID
            }
          }
        );
        expect(response.status).toBe(204);
      });
    });

    test('should respond with 404 if session to revoke does not exist', () => {
      provider
        .given('session sess-not-found does not exist')
        .uponReceiving('a request to revoke a non-existent session')
        .withRequest({
          method: 'POST',
          path: CONSTANTS.PATHS.TOKEN_REVOKE,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer valid-access-token',
            'X-Tenant-ID': CONSTANTS.TENANT_ID
          },
          body: { session_id: 'sess-not-found' }
        })
        .willRespondWith({
          status: 404,
          headers: { 'Content-Type': 'application/json' },
          body: {
            error: {
              code: CONSTANTS.ERROR_CODES.SESSION_NOT_FOUND,
              message: like('Session not found')
            },
            ...ERROR_RESPONSE_TEMPLATE
          }
        });

      return provider.executeTest(async (mockServer) => {
        const client = axios.create({ baseURL: mockServer.url });
        await expect(client.post(CONSTANTS.PATHS.TOKEN_REVOKE,
          { session_id: 'sess-not-found' },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer valid-access-token',
              'X-Tenant-ID': CONSTANTS.TENANT_ID
            }
          }
        )).rejects.toThrow('Request failed with status code 404');
      });
    });
  });

  /**
   * GET /.well-known/jwks.json
   * Retrieve public key set for token verification
   */
  describe('JWKS Endpoint', () => {
    test('should respond with 200 and a set of public keys', () => {
      provider
        .given('the token service has active public keys')
        .uponReceiving('a request for the JSON Web Key Set')
        .withRequest({
          method: 'GET',
          path: CONSTANTS.PATHS.JWKS
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            keys: eachLike({
              kty: 'RSA',
              use: 'sig',
              alg: 'RS256',
              kid: like('key-id-1'),
              n: like('base64-encoded-modulus'),
              e: 'AQAB'
            })
          }
        });

      return provider.executeTest(async (mockServer) => {
        const client = axios.create({ baseURL: mockServer.url });
        const response = await client.get(CONSTANTS.PATHS.JWKS);
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('keys');
        expect(Array.isArray(response.data.keys)).toBe(true);
        expect(response.data.keys.length).toBeGreaterThan(0);
        expect(response.data.keys[0]).toHaveProperty('kid');
        expect(response.data.keys[0]).toHaveProperty('kty', 'RSA');
      });
    });
  });
});