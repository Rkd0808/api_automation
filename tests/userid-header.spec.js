require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { ApiClient } = require('../utils/apiClient');
const { BranchApi } = require('../pages/branchApi');

test.describe('UserID Header Verification', () => {
  let apiClient;
  let branchApi;

  test.beforeEach(async () => {
    // Initialize ApiClient with BASE_URL, JWT_TOKEN, and USER_ID from .env
    apiClient = new ApiClient(
      process.env.BASE_URL,
      process.env.JWT_TOKEN,
      process.env.USER_ID
    );
    branchApi = new BranchApi(apiClient);
  });

  test('should include userid header in API request', async () => {
    // Make an API call to get all branches
    const response = await branchApi.getAllBranches();
    
    // Verify the response is successful
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    // Log the request headers to verify userid is included
    const headers = response.request().headers();
    console.log('Request Headers:', headers);
    
    // Verify userid header is present
    expect(headers['userid']).toBeDefined();
    expect(headers['userid']).toBe(process.env.USER_ID);
    
    console.log('✓ UserID header successfully sent:', headers['userid']);
  });

  test('should send userid header with POST request', async () => {
    // Create a test branch data
    const branchData = {
      branchName: 'Test Branch',
      branchCode: 'TB001',
      status: 'active'
    };
    
    // Make a POST request
    const response = await branchApi.createBranch(branchData);
    
    // Verify headers
    const headers = response.request().headers();
    expect(headers['userid']).toBeDefined();
    expect(headers['userid']).toBe(process.env.USER_ID);
    
    console.log('✓ UserID header in POST request:', headers['userid']);
  });
});
