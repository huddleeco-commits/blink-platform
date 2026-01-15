/**
 * Health Check API Tests
 *
 * Tests for the /api/health endpoint
 */

const { createTestApp, createTestRequest } = require('./utils/testApp');

describe('GET /api/health', () => {
  let app;
  let request;

  beforeAll(() => {
    app = createTestApp();
    request = createTestRequest(app);
  });

  test('returns status ok', async () => {
    const response = await request.get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  test('includes timestamp', async () => {
    const response = await request.get('/api/health');

    expect(response.body.timestamp).toBeDefined();
    expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
  });

  test('returns valid JSON', async () => {
    const response = await request.get('/api/health');

    expect(response.type).toBe('application/json');
    expect(typeof response.body).toBe('object');
  });
});
