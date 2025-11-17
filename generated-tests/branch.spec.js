require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { ApiClient } = require('../utils/apiClient');
const client = new ApiClient(process.env.BASE_URL, process.env.JWT_TOKEN, process.env.USER_ID);
const fs = require('fs');
const path = require('path');

test.describe('Branch API Tests', () => {
  let branchId;
  let branchName;

  test('GET all branches - extract first branch data', async () => {
    const response = await client.get('/v1/hub/configurations/branches');
    expect(response.status()).toBe(200);
    const branches = await response.json();
    expect(Array.isArray(branches)).toBeTruthy();
    expect(branches.length).toBeGreaterThan(0);

    // Save first branch data to JSON file
    branchId = branches[0].branchId;
    branchName = branches[0].branchName;
    const extractedData = { branchId, branchName };
    const dataPath = path.join(__dirname, '../data/extracted_data.json');
    fs.writeFileSync(dataPath, JSON.stringify(extractedData, null, 2));
  });

  test('GET branch by ID - validate response', async () => {
    const response = await client.get(`/v1/hub/configurations/branches/${branchId}`);
    expect(response.status()).toBe(200);
    const branch = await response.json();
    expect(branch.branchId).toBe(branchId);
    expect(branch.branchName).toBeDefined();
  });

  test('Search branches by name - validate partial match', async () => {
    const searchTerm = branchName.slice(0, 3); // Use first 3 characters as search term
    const response = await client.get(`/v1/hub/configurations/branches/search/${searchTerm}`);
    expect(response.status()).toBe(200);
    const results = await response.json();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].branchName).toContain(searchTerm);
  });

  test('Negative: Get branch with invalid ID - expect 404', async () => {
    const invalidId = 'INVALID123';
    const response = await client.get(`/v1/hub/configurations/branches/${invalidId}`);
    expect(response.status()).toBe(404);
  });

  test('Negative: Search with special characters - expect 400', async () => {
    const invalidSearch = 'b@nch';
    const response = await client.get(`/v1/hub/configurations/branches/search/${invalidSearch}`);
    expect(response.status()).toBe(400);
  });

  test('GET pincode mapping with branch ID - validate existence', async () => {
    const response = await client.get(`/v1/hub/configurations/branches/pincodemapping/search/${branchId}`);
    expect(response.status()).toBe(200);
    const mappings = await response.json();
    expect(mappings.length).toBeGreaterThan(0);
    expect(mappings[0].branchId).toBe(branchId);
  });

  test('Negative: Get pincode mapping with invalid search - expect 404', async () => {
    const invalidValue = '99999';
    const response = await client.get(`/v1/hub/configurations/branches/pincodemapping/search/${invalidValue}`);
    expect(response.status()).toBe(404);
  });

  test('GET master slabs - validate structure', async () => {
    const response = await client.get('/v1/hub/configurations/branches/master/slabs');
    expect(response.status()).toBe(200);
    const slabs = await response.json();
    expect(Array.isArray(slabs)).toBeTruthy();
    expect(slabs.length).toBeGreaterThan(0);
  });

  test('Negative: Access slabs without required permissions - expect 403', async () => {
    // Simulate restricted permissions by modifying token (if possible in test environment)
    // This is a placeholder - actual implementation depends on test infrastructure
    expect(true).toBeFalsy(); // Replace with actual test logic
  });

  test('GET branch types - validate list', async () => {
    const response = await client.get('/v1/hub/configurations/branches/branchTypes');
    expect(response.status()).toBe(200);
    const types = await response.json();
    expect(Array.isArray(types)).toBeTruthy();
    expect(types.length).toBeGreaterThan(0);
  });
});
