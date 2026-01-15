/**
 * Authentication API Tests
 *
 * Tests for the password validation endpoints
 */

const { createTestApp, createTestRequest } = require('../utils/testApp');
const { validCredentials, invalidCredentials } = require('../utils/mockData');

describe('POST /api/auth/validate', () => {
  let app;
  let request;

  beforeAll(() => {
    app = createTestApp();
    request = createTestRequest(app);
  });

  test('accepts valid admin password', async () => {
    const response = await request
      .post('/api/auth/validate')
      .send({ password: validCredentials.adminPassword });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('rejects invalid password', async () => {
    const response = await request
      .post('/api/auth/validate')
      .send({ password: invalidCredentials.wrongPassword });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Invalid password');
  });

  test('returns 400 for empty password', async () => {
    const response = await request
      .post('/api/auth/validate')
      .send({ password: '' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.errors).toBeDefined();
  });

  test('returns 400 for missing password field', async () => {
    const response = await request
      .post('/api/auth/validate')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});

describe('POST /api/auth/validate-dev', () => {
  let app;
  let request;

  beforeAll(() => {
    app = createTestApp();
    request = createTestRequest(app);
  });

  test('accepts valid dev password', async () => {
    const response = await request
      .post('/api/auth/validate-dev')
      .send({ password: validCredentials.devPassword });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('rejects invalid dev password', async () => {
    const response = await request
      .post('/api/auth/validate-dev')
      .send({ password: invalidCredentials.wrongPassword });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test('admin password does not work for dev endpoint', async () => {
    const response = await request
      .post('/api/auth/validate-dev')
      .send({ password: validCredentials.adminPassword });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
