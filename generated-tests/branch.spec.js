require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { ApiClient } = require('../utils/apiClient');
const client = new ApiClient(process.env.BASE_URL, process.env.JWT_TOKEN, process.env.USER_ID);
const fs = require('fs');
const path = require('path');

test.describe('Branch API Tests', () => {
  let branchId;
  let branchName;

  test('GET all branches and extract data', async () => {
    const response = await client.get('/v1/hub/configurations/branches');
    expect(response.status()).toBe(200);
    const branches = await response.json();
    expect(Array.isArray(branches)).toBeTruthy();
    expect(branches.length).toBeGreaterThan(0);
    branchId = branches[0].branchId;
    branchName = branches[0].branchName;
    const extractedData = { branchId, branchName };
    const filePath = path.join(__dirname, '../data/extracted_data.json');
    fs.writeFileSync(filePath, JSON.stringify(extractedData, null, 2));
  });

  test('GET branch by valid ID', async () => {
    const response = await client.get(`/v1/hub/configurations/branches/${branchId}`);
    expect(response.status()).toBe(200);
    const branch = await response.json();
    expect(branch.branchId).toBe(branchId);
    expect(branch.branchName).toBe(branchName);
  });

  test('Search branches by valid name', async () => {
    const response = await client.get(`/v1/hub/configurations/branches/search/${branchName}`);
    expect(response.status()).toBe(200);
    const results = await response.json();
    expect(Array.isArray(results)).toBeTruthy();
    expect(results.length).toBeGreaterThan(0);
  });

  test('Search with invalid branch name', async () => {
    const response = await client.get('/v1/hub/configurations/branches/search/InvalidName123');
    expect(response.status()).toBe(200);
    const results = await response.json();
    expect(results.length).toBe(0);
  });

  test('GET pincode mapping with valid search', async () => {
    const response = await client.get('/v1/hub/configurations/branches/pincodemapping/search/110001');
    expect(response.status()).toBe(200);
    const mappings = await response.json();
    expect(Array.isArray(mappings)).toBeTruthy();
    expect(mappings.length).toBeGreaterThan(0);
  });

  test('GET pincode mapping with invalid search', async () => {
    const response = await client.get('/v1/hub/configurations/branches/pincodemapping/search/999999');
    expect(response.status()).toBe(200);
    const mappings = await response.json();
    expect(mappings.length).toBe(0);
  });

  test('GET master slabs', async () => {
    const response = await client.get('/v1/hub/configurations/branches/master/slabs');
    expect(response.status()).toBe(200);
    const slabs = await response.json();
    expect(Array.isArray(slabs)).toBeTruthy();
  });

  test('GET branch types', async () => {
    const response = await client.get('/v1/hub/configurations/branches/branchTypes');
    expect(response.status()).toBe(200);
    const types = await response.json();
    expect(Array.isArray(types)).toBeTruthy();
  });

  test('Negative: Get branch by invalid ID', async () => {
    const response = await client.get('/v1/hub/configurations/branches/INVALID123');
    expect(response.status()).toBe(404);
  });

  test('POST to hub-landing with extracted data', async () => {
    const filePath = path.join(__dirname, '../data/extracted_data.json');
    const extracted = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const payload = {
      basicConfigId: null,
      branchId: extracted.branchId,
      branchName: extracted.branchName,
      startDate: "2025-11-11",
      endDate: "",
      basicLkpDraftActive: "SAVE_NEXT",
      status: true,
      future: false
    };
    const response = await client.post('/v1/hub/configurations/hub-landing', payload);
    expect(response.status()).toBe(201);
  });
});
