/**
 * Industries API Tests
 *
 * Tests for industry-related endpoints
 */

const { createTestApp, createTestRequest, INDUSTRIES, LAYOUTS, EFFECTS, SECTIONS } = require('../utils/testApp');

describe('GET /api/industries', () => {
  let app;
  let request;

  beforeAll(() => {
    app = createTestApp();
    request = createTestRequest(app);
  });

  test('returns industries object', async () => {
    const response = await request.get('/api/industries');

    expect(response.status).toBe(200);
    expect(typeof response.body).toBe('object');
  });

  test('each industry has required fields', async () => {
    const response = await request.get('/api/industries');

    // Skip if no industries loaded (missing config files)
    if (Object.keys(response.body).length === 0) {
      console.log('Skipping: No industries loaded from config');
      return;
    }

    Object.values(response.body).forEach(industry => {
      expect(industry).toHaveProperty('name');
    });
  });
});

describe('GET /api/industry/:key', () => {
  let app;
  let request;

  beforeAll(() => {
    app = createTestApp();
    request = createTestRequest(app);
  });

  test('returns 404 for non-existent industry', async () => {
    const response = await request.get('/api/industry/non-existent-industry');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Industry not found');
  });

  test('returns industry for valid key', async () => {
    // Skip if no industries loaded
    const industriesResponse = await request.get('/api/industries');
    const industryKeys = Object.keys(industriesResponse.body);

    if (industryKeys.length === 0) {
      console.log('Skipping: No industries loaded from config');
      return;
    }

    const firstKey = industryKeys[0];
    const response = await request.get(`/api/industry/${firstKey}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('name');
  });
});

describe('GET /api/layouts', () => {
  let app;
  let request;

  beforeAll(() => {
    app = createTestApp();
    request = createTestRequest(app);
  });

  test('returns layouts object', async () => {
    const response = await request.get('/api/layouts');

    expect(response.status).toBe(200);
    expect(typeof response.body).toBe('object');
  });
});

describe('GET /api/effects', () => {
  let app;
  let request;

  beforeAll(() => {
    app = createTestApp();
    request = createTestRequest(app);
  });

  test('returns effects object', async () => {
    const response = await request.get('/api/effects');

    expect(response.status).toBe(200);
    expect(typeof response.body).toBe('object');
  });
});

describe('GET /api/sections', () => {
  let app;
  let request;

  beforeAll(() => {
    app = createTestApp();
    request = createTestRequest(app);
  });

  test('returns sections object', async () => {
    const response = await request.get('/api/sections');

    expect(response.status).toBe(200);
    expect(typeof response.body).toBe('object');
  });
});

describe('POST /api/build-prompt', () => {
  let app;
  let request;

  beforeAll(() => {
    app = createTestApp();
    request = createTestRequest(app);
  });

  test('builds prompt for valid industry', async () => {
    const response = await request
      .post('/api/build-prompt')
      .send({ industry: 'restaurant' });

    expect(response.status).toBe(200);
    expect(response.body.prompt).toBeDefined();
    expect(response.body.industry).toBe('restaurant');
  });

  test('returns 400 for missing industry', async () => {
    const response = await request
      .post('/api/build-prompt')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  test('accepts optional layout parameter', async () => {
    const response = await request
      .post('/api/build-prompt')
      .send({ industry: 'saas', layout: 'hero-split' });

    expect(response.status).toBe(200);
    expect(response.body.layout).toBe('hero-split');
  });
});
