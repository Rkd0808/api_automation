require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { ApiClient } = require('../utils/apiClient');
const client = new ApiClient(process.env.BASE_URL, process.env.JWT_TOKEN, process.env.USER_ID);

test.describe('HCM Operations API Tests', () => {
  let branchId;
  let operationId;
  let roleId;
  let dockId;

  test('Get branchId from Branch API', async () => {
    const response = await client.get('/v1/branches');
    expect(response.status()).toBe(200);
    const branches = await response.json();
    branchId = branches[0].branchId;
    const headers = response.request().headers();
    console.log('Branch Headers:', headers);
    expect(headers['userid']).toBeDefined();
    expect(headers['userid']).toBe(process.env.USER_ID);
  });

  test('GET all stock transfers - validate response', async () => {
    const response = await client.get('/v1/hub/configurations/hcm-operations/stock-transfer');
    expect(response.status()).toBe(200);
    const transfers = await response.json();
    expect(Array.isArray(transfers)).toBeTruthy();
    expect(transfers.length).toBeGreaterThan(0);
    const headers = response.request().headers();
    console.log('Stock Transfer Headers:', headers);
    expect(headers['userid']).toBeDefined();
    expect(headers['userid']).toBe(process.env.USER_ID);
  });

  test('POST create stock transfer - valid data', async () => {
    const payload = {
      branchId: branchId,
      transferType: 'OUTBOUND',
      quantity: 50,
      status: 'PENDING'
    };
    const response = await client.post('/v1/hub/configurations/hcm-operations/stock-transfer', payload);
    expect(response.status()).toBe(201);
    const created = await response.json();
    operationId = created.operationId;
    expect(operationId).toBeDefined();
    const headers = response.request().headers();
    console.log('Created Stock Transfer Headers:', headers);
    expect(headers['userid']).toBeDefined();
    expect(headers['userid']).toBe(process.env.USER_ID);
  });

  test('POST create stock transfer - missing branchId (expect 400)', async () => {
    const payload = {
      transferType: 'OUTBOUND',
      quantity: 50,
      status: 'PENDING'
    };
    const response = await client.post('/v1/hub/configurations/hcm-operations/stock-transfer', payload);
    expect(response.status()).toBe(400);
    const headers = response.request().headers();
    console.log('Missing BranchId Headers:', headers);
    expect(headers['userid']).toBeDefined();
    expect(headers['userid']).toBe(process.env.USER_ID);
  });

  test('POST create stock transfer - negative quantity (expect 400)', async () => {
    const payload = {
      branchId: branchId,
      transferType: 'OUTBOUND',
      quantity: -10,
      status: 'PENDING'
    };
    const response = await client.post('/v1/hub/configurations/hcm-operations/stock-transfer', payload);
    expect(response.status()).toBe(400);
    const headers = response.request().headers();
    console.log('Negative Quantity Headers:', headers);
    expect(headers['userid']).toBeDefined();
    expect(headers['userid']).toBe(process.env.USER_ID);
  });

  test('GET all stock takes - validate response', async () => {
    const response = await client.get('/v1/hub/configurations/hcm-operations/stock-take');
    expect(response.status()).toBe(200);
    const takes = await response.json();
    expect(Array.isArray(takes)).toBeTruthy();
    expect(takes.length).toBeGreaterThan(0);
    const headers = response.request().headers();
    console.log('Stock Take Headers:', headers);
    expect(headers['userid']).toBeDefined();
    expect(headers['userid']).toBe(process.env.USER_ID);
  });

  test('POST create stock take - valid data', async () => {
    const items = [{ itemId: 'ITEM001', quantity: 10 }];
    const payload = { branchId: branchId, items: items };
    const response = await client.post('/v1/hub/configurations/hcm-operations/stock-take', payload);
    expect(response.status()).toBe(201);
    const created = await response.json();
    expect(created).toBeDefined();
    const headers = response.request().headers();
    console.log('Created Stock Take Headers:', headers);
    expect(headers['userid']).toBeDefined();
    expect(headers['userid']).toBe(process.env.USER_ID);
  });

  test('POST create stock take - missing branchId (expect 400)', async () => {
    const items = [{ itemId: 'ITEM001', quantity: 10 }];
    const payload = { items: items };
    const response = await client.post('/v1/hub/configurations/hcm-operations/stock-take', payload);
    expect(response.status()).toBe(400);
    const headers = response.request().headers();
    console.log('Missing BranchId Headers:', headers);
    expect(headers['userid']).toBeDefined();
    expect(headers['userid']).toBe(process.env.USER_ID);
  });

  test('POST create stock take - negative quantity (expect 400)', async () => {
    const items = [{ itemId: 'ITEM001', quantity: -5 }];
    const payload = { branchId: branchId, items: items };
    const response = await client.post('/v1/hub/configurations/hcm-operations/stock-take', payload);
    expect(response.status()).toBe(400);
    const headers = response.request().headers();
    console.log('Negative Quantity Headers:', headers);
    expect(headers['userid']).toBeDefined();
    expect(headers['userid']).toBe(process.env.USER_ID);
  });

  test('GET all HCM roles - validate response', async () => {
    const response = await client.get('/v1/hub/configurations/hcm-operations/roles');
    expect(response.status()).toBe(200);
    const roles = await response.json();
    expect(Array.isArray(roles)).toBeTruthy();
    expect(roles.length).toBeGreaterThan(0);
    const headers = response.request().headers();
    console.log('Roles Headers:', headers);
    expect(headers['userid']).toBeDefined();
    expect(headers['userid']).toBe(process.env.USER_ID);
  });

  test('POST create HCM role - valid data', async () => {
    const role = {
      roleName: 'TestRole',
      permissions: ['READ', 'WRITE'],
      description: 'Test Role'
    };
    const response = await client.post('/v1/hub/configurations/hcm-operations/roles', role);
    expect(response.status()).toBe(201);
    const created = await response.json();
    roleId = created.roleId;
    expect(roleId).toBeDefined();
    const headers = response.request().headers();
    console.log('Created Role Headers:', headers);
    expect(headers['userid']).toBeDefined();
    expect(headers['userid']).toBe(process.env.USER_ID);
  });

  test('POST create HCM role - invalid permissions (expect 400)', async () => {
    const role = {
      roleName: 'TestRole',
      permissions: ['INVALID'],
      description: 'Test Role'
    };
    const response = await client.post('/v1/hub/configurations/hcm-operations/roles', role);
    expect(response.status()).toBe(400);
    const headers = response.request().headers();
    console.log('Invalid Permissions Headers:', headers);
    expect(headers['userid']).toBeDefined();
    expect(headers['userid']).toBe(process.env.USER_ID);
  });

  test('PUT update HCM role - valid', async () => {
    const update = { permissions: ['ADMIN'] };
    const response = await client.put(`/v1/hub/configurations/hcm-operations/roles/${roleId}`, update);
    expect(response.status()).toBe(200);
    const updated = await response.json();
    expect(updated.roleId).toBe(roleId);
    const headers = response.request().headers();
    console.log('Updated Role Headers:', headers);
    expect(headers['userid']).toBeDefined();
    expect(headers['userid']).toBe(process.env.USER_ID);
  });

  test('PUT update HCM role - non-existent role (expect 404)', async () => {
    const nonExistentId = 'INVALID';
    const update = { roleName: 'NewRole' };
    const response = await client.put(`/v1/hub/configurations/hcm-operations/roles/${nonExistentId}`, update);
    expect(response.status()).toBe(404);
    const headers = response.request().headers();
    console.log('Non-Existent Role Headers:', headers);
    expect(headers['userid']).toBeDefined();
    expect(headers['userid']).toBe(process.env.USER_ID);
  });

  test('GET general configuration - validate response', async () => {
    const response = await client.get('/v1/hub/configurations/hcm-operations/general-config');
    expect(response.status()).toBe(200);
    const config = await response.json();
    expect(config).toBeDefined();
    const headers = response.request().headers();
    console.log('General Config Headers:', headers);
    expect(headers['userid']).toBeDefined();
    expect(headers['userid']).toBe(process.env.USER_ID);
  });

  test('PUT update general configuration - valid', async () => {
    const update = { someKey: 'newValue' };
    const response = await client.put('/v1/hub/configurations/hcm-operations/general-config', update);
    expect(response.status()).toBe(200);
    const updated = await response.json();
    expect(updated).toBeDefined();
    const headers = response.request().headers();
    console.log('Updated General Config Headers:', headers);
    expect(headers['userid']).toBeDefined();
    expect(headers['userid']).toBe(process.env.USER_ID);
  });

  test('GET all cross-docking configurations - validate response', async () => {
    const response = await client.get('/v1/hub/configurations/hcm-operations/cross-docking');
    expect(response.status()).toBe(200);
    const docks = await response.json();
    expect(Array.isArray(docks)).toBeTruthy();
    expect(docks.length).toBeGreaterThan(0);
    const headers = response.request().headers();
    console.log('Cross-Docking Headers:', headers);
    expect(headers['userid']).toBeDefined();
    expect(headers['userid']).toBe(process.env.USER_ID);
  });

  test('POST create cross-docking configuration - valid data', async () => {
    const dock = {
      branchId: branchId,
      dockType: 'INTERNAL',
      capacity: 50
    };
    const response = await client.post('/v1/hub/configurations/hcm-operations/cross-docking', dock);
    expect(response.status()).toBe(201);
    const created = await response.json();
    dockId = created.dockId;
    expect(dockId).toBeDefined();
    const headers = response.request().headers();
    console.log('Created Cross-Docking Headers:', headers);
    expect(headers['userid']).toBeDefined();
    expect(headers['userid']).toBe(process.env.USER_ID);
  });

  test('POST create cross-docking configuration - missing branchId (expect 400)', async () => {
    const dock = {
      dockType: 'INTERNAL',
      capacity: 50
    };
    const response = await client.post('/v1/hub/configurations/hcm-operations/cross-docking', dock);
    expect(response.status()).toBe(400);
    const headers = response.request().headers();
    console.log('Missing BranchId Headers:', headers);
    expect(headers['userid']).toBeDefined();
    expect(headers['userid']).toBe(process.env.USER_ID);
  });

  test('DELETE cross-docking configuration - valid', async () => {
    const response = await client.delete(`/v1/hub/configurations/hcm-operations/cross-docking/${dockId}`);
    expect(response.status()).toBe(200);
    const headers = response.request().headers();
    console.log('Deleted Cross-Docking Headers:', headers);
    expect(headers['userid']).toBeDefined();
    expect(headers['userid']).toBe(process.env.USER_ID);
  });

  test('DELETE cross-docking configuration - non-existent (expect 404)', async () => {
    const nonExistentId = 'INVALID';
    const response = await client.delete(`/v1/hub/configurations/hcm-operations/cross-docking/${nonExistentId}`);
    expect(response.status()).toBe(404);
    const headers = response.request().headers();
    console.log('Non-Existent Dock Headers:', headers);
    expect(headers['userid']).toBeDefined();
    expect(headers['userid']).toBe(process.env.USER_ID);
  });

  test('Edge case: Get cross-docking for inactive branch (expect 400/404)', async () => {
    // Assume inactive branchId is 'INACTIVE123'
    const response = await client.get(`/v1/hub/configurations/hcm-operations/cross-docking?branchId=INACTIVE123`);
    expect(response.status()).toBe(400); // or 404 based on actual API behavior
    const headers = response.request().headers();
    console.log('Inactive Branch Headers:', headers);
    expect(headers['userid']).toBeDefined();
    expect(headers['userid']).toBe(process.env.USER_ID);
  });
});
