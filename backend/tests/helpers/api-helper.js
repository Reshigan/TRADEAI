/**
 * API Test Helper
 * Utilities for API integration testing with supertest
 */

const request = require('supertest');

/**
 * Create API test client
 */
function createApiClient(app) {
  return request(app);
}

/**
 * Make authenticated GET request
 */
async function authenticatedGet(app, url, headers = {}) {
  return request(app)
    .get(url)
    .set(headers)
    .expect('Content-Type', /json/);
}

/**
 * Make authenticated POST request
 */
async function authenticatedPost(app, url, data, headers = {}) {
  return request(app)
    .post(url)
    .set(headers)
    .send(data)
    .expect('Content-Type', /json/);
}

/**
 * Make authenticated PUT request
 */
async function authenticatedPut(app, url, data, headers = {}) {
  return request(app)
    .put(url)
    .set(headers)
    .send(data)
    .expect('Content-Type', /json/);
}

/**
 * Make authenticated PATCH request
 */
async function authenticatedPatch(app, url, data, headers = {}) {
  return request(app)
    .patch(url)
    .set(headers)
    .send(data)
    .expect('Content-Type', /json/);
}

/**
 * Make authenticated DELETE request
 */
async function authenticatedDelete(app, url, headers = {}) {
  return request(app)
    .delete(url)
    .set(headers)
    .expect('Content-Type', /json/);
}

/**
 * Expect successful response
 */
function expectSuccess(response, statusCode = 200) {
  expect(response.status).toBe(statusCode);
  expect(response.body).toHaveProperty('success', true);
  return response.body;
}

/**
 * Expect error response
 */
function expectError(response, statusCode = 400) {
  expect(response.status).toBe(statusCode);
  expect(response.body).toHaveProperty('success', false);
  expect(response.body).toHaveProperty('error');
  return response.body;
}

/**
 * Expect validation error
 */
function expectValidationError(response) {
  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty('success', false);
  expect(response.body.error).toMatch(/validation/i);
  return response.body;
}

/**
 * Expect unauthorized error
 */
function expectUnauthorized(response) {
  expect(response.status).toBe(401);
  expect(response.body).toHaveProperty('success', false);
  return response.body;
}

/**
 * Expect forbidden error
 */
function expectForbidden(response) {
  expect(response.status).toBe(403);
  expect(response.body).toHaveProperty('success', false);
  return response.body;
}

/**
 * Expect not found error
 */
function expectNotFound(response) {
  expect(response.status).toBe(404);
  expect(response.body).toHaveProperty('success', false);
  return response.body;
}

/**
 * Extract data from successful response
 */
function extractData(response) {
  expectSuccess(response);
  return response.body.data;
}

/**
 * Extract pagination info from response
 */
function extractPagination(response) {
  expectSuccess(response);
  expect(response.body).toHaveProperty('pagination');
  return response.body.pagination;
}

/**
 * Test pagination
 */
async function testPagination(app, url, headers, expectedTotal) {
  // Page 1
  const page1 = await authenticatedGet(app, `${url}?page=1&limit=10`, headers);
  expectSuccess(page1);
  expect(page1.body.data).toBeInstanceOf(Array);
  expect(page1.body.data.length).toBeLessThanOrEqual(10);
  
  // Check pagination metadata
  expect(page1.body.pagination).toBeDefined();
  expect(page1.body.pagination.currentPage).toBe(1);
  expect(page1.body.pagination.totalPages).toBeGreaterThan(0);
  
  return page1.body.pagination;
}

/**
 * Test sorting
 */
async function testSorting(app, url, headers, sortField) {
  // Ascending
  const asc = await authenticatedGet(app, `${url}?sort=${sortField}`, headers);
  expectSuccess(asc);
  
  // Descending
  const desc = await authenticatedGet(app, `${url}?sort=-${sortField}`, headers);
  expectSuccess(desc);
  
  return { asc: asc.body.data, desc: desc.body.data };
}

/**
 * Test filtering
 */
async function testFiltering(app, url, headers, filters) {
  const queryString = Object.entries(filters)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
    
  const response = await authenticatedGet(app, `${url}?${queryString}`, headers);
  expectSuccess(response);
  
  return response.body.data;
}

/**
 * Create test data and return IDs
 */
async function createTestResources(app, url, dataArray, headers) {
  const ids = [];
  
  for (const data of dataArray) {
    const response = await authenticatedPost(app, url, data, headers);
    expectSuccess(response, 201);
    ids.push(response.body.data._id || response.body.data.id);
  }
  
  return ids;
}

/**
 * Batch delete resources
 */
async function deleteTestResources(app, url, ids, headers) {
  for (const id of ids) {
    await authenticatedDelete(app, `${url}/${id}`, headers);
  }
}

/**
 * Wait for async operation
 */
function wait(ms = 100) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  createApiClient,
  authenticatedGet,
  authenticatedPost,
  authenticatedPut,
  authenticatedPatch,
  authenticatedDelete,
  expectSuccess,
  expectError,
  expectValidationError,
  expectUnauthorized,
  expectForbidden,
  expectNotFound,
  extractData,
  extractPagination,
  testPagination,
  testSorting,
  testFiltering,
  createTestResources,
  deleteTestResources,
  wait
};
