require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { ApiClient } = require('../utils/apiClient');
const client = new ApiClient(process.env.BASE_URL, process.env.JWT_TOKEN, process.env.USER_ID);

test.describe('Hub Configuration Workflow Tests', () => {
  let branchId;
  let configId;
  let layoutId;
  let gateTypeId;
  let orientationId;
  let fileBuffer;

  test('Initialize file buffer and fetch branches', async () => {
    const fs = require('fs');
    const path = require('path');
    fileBuffer = fs.readFileSync(path.join(__dirname, '../dummy.pdf'));
    
    const response = await client.get('/v1/hub/configurations/branches');
    expect(response.status()).toBe(200);
    const branches = await response.json();
    expect(branches.length).toBeGreaterThan(0);
    branchId = branches[0].branchId;
  });

  test('Negative: GET invalid branch ID', async () => {
    const response = await client.get('/v1/hub/configurations/branches/INVALID123');
    expect(response.status()).toBe(404);
  });

  test('POST create basic configuration', async () => {
    const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0];
    const payload = {
      basicConfigId: null,
      branchId,
      branchName: branches[0].branchName,
      startDate: tomorrow,
      endDate: '',
      basicLkpDraftActive: 'SAVE_NEXT',
      status: true,
      future: false
    };
    
    const response = await client.post('/v1/hub/configurations/basic-configs', payload);
    expect(response.status()).toBe(201);
    const created = await response.json();
    configId = created.configId;
  });

  test('Negative: Basic config missing branchId', async () => {
    const invalidPayload = { ...payload };
    delete invalidPayload.branchId;
    const response = await client.post('/v1/hub/configurations/basic-configs', invalidPayload);
    expect(response.status()).toBe(400);
  });

  test('POST create layout basic configuration', async () => {
    const payload = {
      layoutBasicRequest: JSON.stringify({
        name: 'blob',
        mimeType: 'application/json',
        buffer: JSON.stringify({
          layoutBasicId: '',
          layoutLength: 100,
          layoutBreadth: 200,
          lkpDraftActive: 'SAVE_NEXT',
          lkpHubOrientationId: 3601,
          branchSharingPremise: false,
          sharingBranchResponseDTOList: []
        })
      }),
      files: {
        name: 'dummy.pdf',
        mimeType: 'application/pdf',
        buffer: fileBuffer
      }
    };
    
    const response = await client.post(`/v1/hub/configurations/${configId}/layoutBasic`, payload);
    expect(response.status()).toBe(201);
    const layoutData = await response.json();
    layoutId = layoutData.layoutBasicId;
  });

  test('Negative: Layout config with invalid file buffer', async () => {
    const invalidPayload = { ...payload };
    invalidPayload.files.buffer = '';
    const response = await client.post(`/v1/hub/configurations/${configId}/layoutBasic`, invalidPayload);
    expect(response.status()).toBe(400);
  });

  test('GET lookup data for gates and orientations', async () => {
    const response = await client.post('/v1/hub/configurations/load', {
      lookupType: ['GATE_TYPE', 'ORIENTATION', 'INACTIVE_REASON_GATES']
    });
    expect(response.status()).toBe(200);
    const lookupData = await response.json();
    gateTypeId = lookupData.GATE_TYPE[0].id;
    orientationId = lookupData.ORIENTATION[0].id;
  });

  test('Negative: GET lookup without required types', async () => {
    const response = await client.post('/v1/hub/configurations/load', {
      lookupType: []
    });
    expect(response.status()).toBe(400);
  });
});
