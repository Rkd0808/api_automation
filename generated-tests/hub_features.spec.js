require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { ApiClient } = require('../utils/apiClient');
const client = new ApiClient(process.env.BASE_URL, process.env.JWT_TOKEN, process.env.USER_ID);

test.describe('Hub Configuration Workflow', () => {
  let branchId;
  let baseConfigId;
  
  test('GET branches - validate available branches', async () => {
    const response = await client.get('/v1/hub/configurations/branches');
    expect(response.status()).toBe(200);
    const branches = await response.json();
    expect(Array.isArray(branches)).toBeTruthy();
    branchId = branches.find(b => b.status === 'active') || branches[0];
    expect(branchId).toBeDefined();
  });
  
  test('POST create base config - validate creation', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const payload = {
      branchId: branchId.branchId,
      branchName: branchId.branchName,
      startDate: tomorrow.toISOString().split('T')[0],
      endDate: "",
      basicLkpDraftActive: "SAVE_NEXT",
      status: true
    };
    const response = await client.post('/v1/hub/configurations/basic-configs', payload);
    expect(response.status()).toBe(201);
    baseConfigId = (await response.json()).basicConfigId || (await response.json()).hubConfigId;
    expect(baseConfigId).toBeDefined();
  });
  
  test('POST create layout basic - validate layout', async () => {
    const fs = require('fs');
    const path = require('path');
    const dataPath = path.join(__dirname, '../data/extracted_data.json');
    const extractedData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    const payload = {
      layoutBasicId: "",
      layoutLength: 100,
      layoutBreadth: 200,
      lkpDraftActive: "SAVE_NEXT",
      lkpHubOrientationId: 3601,
      branchSharingPremise: false,
      sharingBranchResponseDTOList: []
    };
    
    const response = await client.post(`/v1/hub/configurations/${baseConfigId}/layoutBasic`, payload);
    expect(response.status()).toBe(201);
    const layoutData = await response.json();
    fs.writeFileSync(dataPath, JSON.stringify({ layoutId: layoutData.layoutBasicId }, null, 2));
  });
  
  test('GET buildings - validate existing structure', async () => {
    const response = await client.get(`/v1/hub/configurations/${baseConfigId}/layout/buildings?lkpDraftActive=DRAFT`);
    expect(response.status()).toBe(200 || 404);
    if (response.status() === 200) {
      const buildings = await response.json();
      fs.writeFileSync(dataPath, JSON.stringify({
        existingBuildings: buildings,
        shouldNullify: true
      }, null, 2));
    }
  });
  
  test('POST create building - validate building creation', async () => {
    const fs = require('fs');
    const path = require('path');
    const dataPath = path.join(__dirname, '../data/extracted_data.json');
    const extractedData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    const buildingPayload = {
      "lkpLineOfBusinessId": 3861,
      "lkpShutterTypeId": 5,
      "lkpOrientationId": "3601",
      "lkpDimensionId": "3765",
      "lkpDockTypeId": "3767",
      "lkpDockSizeId": "3609",
      "serviceId": "SVC001"
    };
    
    if (extractedData.existingBuildings) {
      buildingPayload.lkpLineOfBusinessId = extractedData.existingBuildings[0].lkpLineOfBusinessId;
    }
    
    const response = await client.post(`/v1/hub/configurations/${baseConfigId}/layout/buildings`, buildingPayload);
    expect(response.status()).toBe(201);
    const buildingData = await response.json();
    fs.writeFileSync(dataPath, JSON.stringify({
      ...extractedData,
      buildingId: buildingData.buildingId,
      shouldNullify: false
    }, null, 2));
  });
  
  // ... (Additional tests for offices, inventory, operations, etc.) ...
  
  test('Negative: POST create branch with missing branchName', async () => {
    const invalidPayload = {
      branchId: "123",
      startDate: tomorrow.toISOString().split('T')[0],
      status: true
    };
    const response = await client.post('/v1/hub/configurations/branches', invalidPayload);
    expect(response.status()).toBe(400);
  });
  
  test('Negative: POST create basic config with invalid date format', async () => {
    const invalidPayload = {
      branchId: branchId.branchId,
      branchName: branchId.branchName,
      startDate: "invalid-date",
      endDate: "",
      basicLkpDraftActive: "SAVE_NEXT",
      status: true
    };
    const response = await client.post('/v1/hub/configurations/basic-configs', invalidPayload);
    expect(response.status()).toBe(400);
  });
  
  // ... (Additional negative tests for all endpoints) ...
});

// HUB Features Tests
test.describe('HUB Features Tests', () => {
  let featureId;
  
  test('GET enabled features - validate feature list', async () => {
    const response = await client.get('/v1/hub/configurations/features/enabled');
    expect(response.status()).toBe(200);
    const features = await response.json();
    featureId = features[0].featureId;
    expect(featureId).toBeDefined();
  });
  
  test('POST toggle feature - validate enable', async () => {
    const payload = { featureId: featureId, isEnabled: true };
    const response = await client.post('/v1/hub/configurations/features/toggle', payload);
    expect(response.status()).toBe(200);
    const updated = await response.json();
    expect(updated.isEnabled).toBe(true);
  });
  
  test('Negative: POST toggle non-existent feature', async () => {
    const invalidPayload = { featureId: "NON_EXISTENT", isEnabled: true };
    const response = await client.post('/v1/hub/configurations/features/toggle', invalidPayload);
    expect(response.status()).toBe(404);
  });
  
  // ... (Negative tests for all features endpoints) ...
});
