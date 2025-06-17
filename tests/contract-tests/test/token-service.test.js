/**
 * @file Contract tests for the TokenService provider
 * @version 1.0.0
 * @description Consumer-driven contract tests ensuring TokenService adheres to interface specifications
 * @see {@link ../../docs/services/token-service/interface-contract.md}
 * @see {@link ../../docs/services/token-service/openapi.yaml}
 * @see {@link ../../docs/adr/ADR-011-response-envelope.md}
 * @author rockymountain
 * @lastModified 2025-06-17 15:38:07
 */

const { PactV3 } = require('@pact-foundation/pact');
const { Matchers } = require('@pact-foundation/pact');
const path = require('path');
const axios = require('axios');

const { like, eachLike, term, uuid, iso8601DateTime } = Matchers;

// Common headers
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8'
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

describe('Token Service API Contract', () => {
  let provider;

  beforeAll(() => {
    provider = new PactV3({
      consumer: 'APIGateway_And_AuthService',
      provider: 'TokenService',
      log: path.resolve(process.cwd(), 'logs', 'pact.log'),
      dir: path.resolve(process.cwd(), 'pacts'),
      logLevel: 'warn',
    });
  });
  
  /**
   * POST /v1/token/issue
   * Issue new token pairs for authenticated internal service calls
   */
  describe('Token Issuance API', () => {
    test('should respond with 200 and a new token pair for a valid request', async () => {
      await provider
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
            session_id: uuid('f47ac10b-58cc-4372-a567-0e02b2c3d479'),
            login_method: 'otp'
          })
        })
        .willRespondWith({
          status: 200,
          headers: DEFAULT_HEADERS,
          body: {
            data: {
              access_token: like('eyJhbGciOiJSUzI1NiIs...'),
              refresh_token: like('eyJhbGciOiJSUzI1NiIs...'),
              token_type: 'Bearer',
              expires_in: like(3600)
            },
            meta: {
              trace_id: like('req-uuid-123'),
              timestamp: iso8601DateTime()
            }
          }
        })
        .executeTest(async (mockServer) => {
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

          expect(response.status).toBe(200);
          expect(response.data).toHaveProperty('data');
          expect(response.data.data).toHaveProperty('access_token');
          expect(response.data.data).toHaveProperty('refresh_token');
          expect(response.data.data).toHaveProperty('token_type', 'Bearer');
          expect(response.data.data).toHaveProperty('expires_in');
          expect(response.data).toHaveProperty('meta');
          expect(response.data.meta).toHaveProperty('trace_id');
          expect(response.data.meta).toHaveProperty('timestamp');
        });
    });

    test('should respond with 400 if required fields are missing', async () => {
      await provider
        .given('a token issue request is missing required fields')
        .uponReceiving('a request to issue a token without required fields')
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
            session_id: uuid('f47ac10b-58cc-4372-a567-0e02b2c3d479')
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
            meta: {
              trace_id: like('req-uuid-123'),
              timestamp: iso8601DateTime()
            }
          }
        })
        .executeTest(async (mockServer) => {
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
      await provider
        .given('a request without Authorization header')
        .uponReceiving('a request to issue a token without authorization')
        .withRequest({
          method: 'POST',
          path: CONSTANTS.PATHS.TOKEN_ISSUE,
          headers: {
            ...DEFAULT_HEADERS,
            'X-Tenant-ID': CONSTANTS.TENANT_ID
          },
          body: like({
            sub: 'user-123',
            roles: ['teacher']
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
            meta: {
              trace_id: like('req-uuid-123'),
              timestamp: iso8601DateTime()
            }
          }
        })
        .executeTest(async (mockServer) => {
          const client = axios.create({ baseURL: mockServer.url });
          await expect(client.post(CONSTANTS.PATHS.TOKEN_ISSUE,
            {
              sub: 'user-123',
              roles: ['teacher']
            },
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
    test('should respond with 200 and new token pair for valid refresh token', async () => {
      await provider
        .given('a valid refresh token exists')
        .uponReceiving('a request to refresh an access token')
        .withRequest({
          method: 'POST',
          path: CONSTANTS.PATHS.TOKEN_REFRESH,
          headers: {
            ...DEFAULT_HEADERS,
            'Authorization': like('Bearer valid-refresh-token'),
            'X-Tenant-ID': CONSTANTS.TENANT_ID
          }
        })
        .willRespondWith({
          status: 200,
          headers: DEFAULT_HEADERS,
          body: {
            data: {
              access_token: like('eyJhbGciOiJSUzI1NiIs...'),
              refresh_token: like('eyJhbGciOiJSUzI1NiIs...'),
              token_type: 'Bearer',
              expires_in: like(3600)
            },
            meta: {
              trace_id: like('req-uuid-123'),
              timestamp: iso8601DateTime()
            }
          }
        })
        .executeTest(async (mockServer) => {
          const client = axios.create({ baseURL: mockServer.url });
          const response = await client.post(CONSTANTS.PATHS.TOKEN_REFRESH,
            null,
            {
              headers: {
                ...DEFAULT_HEADERS,
                'Authorization': 'Bearer valid-refresh-token',
                'X-Tenant-ID': CONSTANTS.TENANT_ID
              }
            }
          );

          expect(response.status).toBe(200);
          expect(response.data).toHaveProperty('data');
          expect(response.data.data).toHaveProperty('access_token');
          expect(response.data.data).toHaveProperty('refresh_token');
          expect(response.data.data).toHaveProperty('token_type', 'Bearer');
          expect(response.data.data).toHaveProperty('expires_in');
          expect(response.data).toHaveProperty('meta');
        });
    });

    test('should respond with 403 if refresh token has been revoked', async () => {
      await provider
        .given('the provided refresh token has been revoked')
        .uponReceiving('a request to refresh using a revoked token')
        .withRequest({
          method: 'POST',
          path: CONSTANTS.PATHS.TOKEN_REFRESH,
          headers: {
            ...DEFAULT_HEADERS,
            'Authorization': like('Bearer revoked-refresh-token'),
            'X-Tenant-ID': CONSTANTS.TENANT_ID
          }
        })
        .willRespondWith({
          status: 403,
          headers: DEFAULT_HEADERS,
          body: {
            error: {
              code: CONSTANTS.ERROR_CODES.SESSION_REVOKED,
              message: like('Session has been revoked')
            },
            meta: {
              trace_id: like('req-uuid-123'),
              timestamp: iso8601DateTime()
            }
          }
        })
        .executeTest(async (mockServer) => {
          const client = axios.create({ baseURL: mockServer.url });
          await expect(client.post(CONSTANTS.PATHS.TOKEN_REFRESH,
            null,
            {
              headers: {
                ...DEFAULT_HEADERS,
                'Authorization': 'Bearer revoked-refresh-token',
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
    test('should respond with 204 for a valid session', async () => {
      await provider
        .given('a valid session exists')
        .uponReceiving('a request to revoke an active session')
        .withRequest({
          method: 'POST',
          path: CONSTANTS.PATHS.TOKEN_REVOKE,
          headers: {
            ...DEFAULT_HEADERS,
            'Authorization': like('Bearer valid-access-token'),
            'X-Tenant-ID': CONSTANTS.TENANT_ID
          },
          body: {
            session_id: like('valid-session-id')
          }
        })
        .willRespondWith({
          status: 204
        })
        .executeTest(async (mockServer) => {
          const client = axios.create({ baseURL: mockServer.url });
          const response = await client.post(CONSTANTS.PATHS.TOKEN_REVOKE,
            {
              session_id: 'valid-session-id'
            },
            {
              headers: {
                ...DEFAULT_HEADERS,
                'Authorization': 'Bearer valid-access-token',
                'X-Tenant-ID': CONSTANTS.TENANT_ID
              }
            }
          );
          expect(response.status).toBe(204);
        });
    });

    test('should respond with 404 if session does not exist', async () => {
      await provider
        .given('session does not exist')
        .uponReceiving('a request to revoke a non-existent session')
        .withRequest({
          method: 'POST',
          path: CONSTANTS.PATHS.TOKEN_REVOKE,
          headers: {
            ...DEFAULT_HEADERS,
            'Authorization': like('Bearer valid-access-token'),
            'X-Tenant-ID': CONSTANTS.TENANT_ID
          },
          body: {
            session_id: like('non-existent-session')
          }
        })
        .willRespondWith({
          status: 404,
          headers: DEFAULT_HEADERS,
          body: {
            error: {
              code: CONSTANTS.ERROR_CODES.SESSION_NOT_FOUND,
              message: like('Session not found')
            },
            meta: {
              trace_id: like('req-uuid-123'),
              timestamp: iso8601DateTime()
            }
          }
        })
        .executeTest(async (mockServer) => {
          const client = axios.create({ baseURL: mockServer.url });
          await expect(client.post(CONSTANTS.PATHS.TOKEN_REVOKE,
            {
              session_id: 'non-existent-session'
            },
            {
              headers: {
                ...DEFAULT_HEADERS,
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
    test('should respond with 200 and a set of public keys', async () => {
      await provider
        .given('token service has active public keys')
        .uponReceiving('a request for the JSON Web Key Set')
        .withRequest({
          method: 'GET',
          path: CONSTANTS.PATHS.JWKS
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
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
        })
        .executeTest(async (mockServer) => {
          const client = axios.create({ baseURL: mockServer.url });
          const response = await client.get(CONSTANTS.PATHS.JWKS);
          
          expect(response.status).toBe(200);
          expect(response.data).toHaveProperty('keys');
          expect(Array.isArray(response.data.keys)).toBe(true);
          expect(response.data.keys.length).toBeGreaterThan(0);
          
          const key = response.data.keys[0];
          expect(key).toHaveProperty('kty', 'RSA');
          expect(key).toHaveProperty('use', 'sig');
          expect(key).toHaveProperty('alg', 'RS256');
          expect(key).toHaveProperty('kid');
          expect(key).toHaveProperty('n');
          expect(key).toHaveProperty('e', 'AQAB');
        });
    });
  });
});