require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { ApiClient } = require('../utils/apiClient');
const client = new ApiClient(process.env.BASE_URL, process.env.JWT_TOKEN, process.env.USER_ID);

test.describe('Inventory Management API Tests', () => {
  let unitId;
  let equipmentId;
  let deviceId;
  let chaId;

  // Unitization Tests
  test('GET all unitization configs - validate response', async () => {
    const response = await client.get('/v1/hub/configurations/inventory/unitization');
    expect(response.status()).toBe(200);
    const units = await response.json();
    expect(Array.isArray(units)).toBeTruthy();
    expect(units.length).toBeGreaterThan(0);
    unitId = units[0].unitId;
  });

  test('POST create unitization - validate creation', async () => {
    const today = new Date().toISOString().slice(0,10);
    const newUnit = {
      hub_config_id: 1080,
      lkp_inv_type_id: 3752,
      is_inv_exists: true,
      lkp_draft_active: "save_next",
      inv_details: [
        {
          lkp_inv_sub_type_id: 4086,
          unique_ids: [{
            from_id: "B123456789012",
            to_id: "B123456789019",
            assign_date: today,
            end_date: today,
            count: 8
          }],
          non_unique_ids: [{ count: 2 }]
        }
      ],
      inv_count: 10
    };
    const response = await client.post('/v1/hub/configurations/inventory/unitization', newUnit);
    expect(response.status()).toBe(201);
    const created = await response.json();
    expect(created.unitId).toBeDefined();
    expect(created.unitId).toEqual(unitId);
  });

  test('PUT update unitization - validate success', async () => {
    const updateData = { /* valid updates */ };
    const response = await client.put(`/v1/hub/configurations/inventory/unitization/${unitId}`, updateData);
    expect(response.status()).toBe(200);
  });

  test('DELETE unitization - expect 204', async () => {
    const response = await client.delete(`/v1/hub/configurations/inventory/unitization/${unitId}`);
    expect(response.status()).toBe(204);
  });

  test('POST unitization with invalid lkp_inv_type_id - expect 400', async () => {
    const invalidData = { ... };
    invalidData.lkp_inv_type_id = 999;
    const response = await client.post('/v1/hub/configurations/inventory/unitization', invalidData);
    expect(response.status()).toBe(400);
  });

  test('POST unitization with invalid date - expect 400', async () => {
    const futureDate = new Date().toISOString().slice(0,10);
    futureDate = new Date(futureDate);
    futureDate.setDate(futureDate.getDate() + 1);
    const invalidData = { ... };
    invalidData.inv_details[0].unique_ids[0].assign_date = futureDate;
    const response = await client.post('/v1/hub/configurations/inventory/unitization', invalidData);
    expect(response.status()).toBe(400);
  });

  // MHE Tests
  test('GET all MHE configs', async () => {
    const response = await client.get('/v1/hub/configurations/inventory/mhe');
    expect(response.status()).toBe(200);
    const mhes = await response.json();
    expect(Array.isArray(mhes)).toBeTruthy();
    equipmentId = mhes[0].equipmentId;
  });

  test('POST create MHE - validate creation', async () => {
    const newMhe = {
      equipmentType: "FORKLIFT",
      equipmentId: "MH001",
      capacity: 5000,
      status: "ACTIVE"
    };
    const response = await client.post('/v1/hub/configurations/inventory/mhe', newMhe);
    expect(response.status()).toBe(201);
    expect(response.json().equipmentId).toBe("MH001");
  });

  test('PUT update MHE - expect 404 for invalid ID', async () => {
    const response = await client.put('/v1/hub/configurations/inventory/mhe/INVALID_ID', {});
    expect(response.status()).toBe(404);
  });

  // Electronic Devices Tests
  test('GET all electronic devices', async () => {
    const response = await client.get('/v1/hub/configurations/inventory/electronic-devices');
    expect(response.status()).toBe(200);
    const devices = await response.json();
    expect(Array.isArray(devices)).toBeTruthy();
    deviceId = devices[0].deviceId;
  });

  test('POST register device - validate creation', async () => {
    const response = await client.post('/v1/hub/configurations/inventory/electronic-devices', {
      deviceType: "SCANNER",
      deviceId: "DEV001",
      assignedTo: "WH001"
    });
    expect(response.status()).toBe(201);
    expect(response.json().deviceId).toBe("DEV001");
  });

  test('DELETE device - expect 404 for non-existent', async () => {
    const response = await client.delete('/v1/hub/configurations/inventory/electronic-devices/INVALID_ID');
    expect(response.status()).toBe(404);
  });

  // CHA Tests
  test('GET all CHA configs', async () => {
    const response = await client.get('/v1/hub/configurations/inventory/cha');
    expect(response.status()).toBe(200);
    const chaos = await response.json();
    expect(Array.isArray(chaos)).toBeTruthy();
    chaId = chaos[0].chaId;
  });

  test('POST create CHA - validate creation', async () => {
    const response = await client.post('/v1/hub/configurations/inventory/cha', {
      chaName: "CHA001",
      chaCode: "CHA001",
      contactInfo: { phone: "1234567890", email: "test@example.com" }
    });
    expect(response.status()).toBe(201);
    expect(response.json().chaName).toBe("CHA001");
  });

  test('Bulk check empty items - expect 400', async () => {
    const response = await client.post('/v1/hub/configurations/inventory/cha/bulk-check', { items: [] });
    expect(response.status()).toBe(400);
  });

  // Header Verification Assertions
  test('Verify headers presence', async () => {
    const response = await client.get('/any/endpoint');
    const headers = response.request().headers();
    expect(headers['userid']).toBeDefined();
    expect(headers['userid']).toBe(process.env.USER_ID);
    expect(headers['Authorization']).toMatch(/Bearer /);
    expect(headers['Content-Type']).toBe('application/json');
  });
});
