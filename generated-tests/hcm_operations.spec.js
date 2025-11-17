require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { ApiClient } = require('../utils/apiClient');
const client = new ApiClient(process.env.BASE_URL, process.env.JWT_TOKEN, process.env.USER_ID);

// Common header validation
const validateHeaders = async (response) => {
  const headers = response.request().headers();
  expect(headers['userid']).toBeDefined();
  expect(headers['userid']).toBe(process.env.USER_ID);
};

test.describe('HCM Operations API Tests', () => {
  let operationId;
  let dockId;

  // Stock Transfer Tests
  test.describe('Stock Transfer', () => {
    test('GET all stock transfers - validate response', async () => {
      const response = await client.get('/v1/hub/configurations/hcm-operations/stock-transfer');
      expect(response.status()).toBe(200);
      const transfers = await response.json();
      expect(Array.isArray(transfers)).toBe(true);
      transfers.forEach(t => expect(['operationId', 'branchId', 'transferType', 'status', 'createdAt'].every(k => k in t)));
      await validateHeaders(response);
    });

    test('POST create stock transfer - valid payload', async () => {
      const payload = {
        branchId: 'BR001',
        transferType: 'INBOUND',
        quantity: 50,
        status: 'PENDING'
      };
      const response = await client.post('/v1/hub/configurations/hcm-operations/stock-transfer', payload);
      expect(response.status()).toBe(201);
      const created = await response.json();
      operationId = created.operationId;
      expect(operationId).toBeDefined();
      await validateHeaders(response);
    });

    test('POST stock transfer missing branchId - expect 400', async () => {
      const payload = { 
        transferType: 'OUTBOUND',
        quantity: 20,
        status: 'PENDING'
      };
      const response = await client.post('/v1/hub/configurations/hcm-operations/stock-transfer', payload);
      expect(response.status()).toBe(400);
      await validateHeaders(response);
    });

    test('POST stock transfer with negative quantity - expect 400', async () => {
      const payload = {
        branchId: 'BR001',
        transferType: 'INBOUND',
        quantity: -10,
        status: 'PENDING'
      };
      const response = await client.post('/v1/hub/configurations/hcm-operations/stock-transfer', payload);
      expect(response.status()).toBe(400);
      await validateHeaders(response);
    });
  });

  // Stock Take Tests
  test.describe('Stock Take', () => {
    test('GET all stock take - validate response', async () => {
      const response = await client.get('/v1/hub/configurations/hcm-operations/stock-take');
      expect(response.status()).toBe(200);
      const takes = await response.json();
      expect(Array.isArray(takes)).toBe(true);
      takes.forEach(t => expect(['itemId', 'quantity'].every(k => k in t)));
      await validateHeaders(response);
    });

    test('POST create stock take - valid payload', async () => {
      const payload = {
        branchId: 'BR001',
        items: [{ itemId: 'ITM001', quantity: 100 }]
      };
      const response = await client.post('/v1/hub/configurations/hcm-operations/stock-take', payload);
      expect(response.status()).toBe(201);
      await validateHeaders(response);
    });

    test('POST stock take missing items array - expect 400', async () => {
      const payload = { branchId: 'BR001' };
      const response = await client.post('/v1/hub/configurations/hcm-operations/stock-take', payload);
      expect(response.status()).toBe(400);
      await validateHeaders(response);
    });

    test('POST stock take with invalid itemQuantity type - expect 400', async () => {
      const payload = {
        branchId: 'BR001',
        items: [{ itemId: 'ITM001', quantity: '100' }]
      };
      const response = await client.post('/v1/hub/configurations/hcm-operations/stock-take', payload);
      expect(response.status()).toBe(400);
      await validateHeaders(response);
    });
  });

  // Roles Tests
  test.describe('Roles', () => {
    test('GET all roles - validate response', async () => {
      const response = await client.get('/v1/hub/configurations/hcm-operations/roles');
      expect(response.status()).toBe(200);
      const roles = await response.json();
      expect(Array.isArray(roles)).toBe(true);
      roles.forEach(r => expect(['roleId', 'roleName', 'permissions'].every(k => k in r)));
      await validateHeaders(response);
    });

    test('POST create role - valid payload', async () => {
      const payload = {
        roleName: 'WAREHOUSE_ADMIN',
        permissions: ['INVENTORY', 'LAYOUT_DESIGN'],
        description: 'Manages warehouse operations'
      };
      const response = await client.post('/v1/hub/configurations/hcm-operations/roles', payload);
      expect(response.status()).toBe(201);
      const created = await response.json();
      await validateHeaders(response);
    });

    test('POST role with missing permissions - expect 400', async () => {
      const payload = {
        roleName: 'INV_STAFF',
        description: 'Inventory staff'
      };
      const response = await client.post('/v1/hub/configurations/hcm-operations/roles', payload);
      expect(response.status()).toBe(400);
      await validateHeaders(response);
    });

    test('PUT update role - valid payload', async () => {
      // Assuming roleId exists from previous test
      const payload = {
        permissions: ['INVENTORY', 'PROCESS']
      };
      const response = await client.put(`/v1/hub/configurations/hcm-operations/roles/${operationId || '123'}`);
      expect(response.status()).toBe(200);
      await validateHeaders(response);
    });

    test('PUT update role with invalid permissions - expect 400', async () => {
      const payload = { permissions: ['INVALID_PERM'] };
      const response = await client.put(`/v1/hub/configurations/hcm-operations/roles/${operationId || '123'}`);
      expect(response.status()).toBe(400);
      await validateHeaders(response);
    });
  });

  // Cross-Docking Tests
  test.describe('Cross-Docking', () => {
    test('GET all cross-docking configs - validate response', async () => {
      const response = await client.get('/v1/hub/configurations/hcm-operations/cross-docking');
      expect(response.status()).toBe(200);
      const docks = await response.json();
      expect(Array.isArray(docks)).toBe(true);
      docks.forEach(d => expect(['dockId', 'branchId', 'dockType', 'capacity'].every(k => k in d)));
      await validateHeaders(response);
    });

    test('POST create cross-docking - valid payload', async () => {
      const payload = {
        branchId: 'BR001',
        dockType: 'PERMANENT',
        capacity: 200
      };
      const response = await client.post('/v1/hub/configurations/hcm-operations/cross-docking', payload);
      expect(response.status()).toBe(201);
      const created = await response.json();
      dockId = created.dockId;
      expect(dockId).toBeDefined();
      await validateHeaders(response);
    });

    test('DELETE cross-docking invalid ID - expect 404', async () => {
      const response = await client.delete(`/v1/hub/configurations/hcm-operations/cross-docking/INVALID123`);
      expect(response.status()).toBe(404);
      await validateHeaders(response);
    });

    test('DELETE cross-docking valid ID - expect 200', async () => {
      const response = await client.delete(`/v1/hub/configurations/hcm-operations/cross-docking/${dockId}`);
      expect(response.status()).toBe(200);
      await validateHeaders(response);
    });
  });
});
