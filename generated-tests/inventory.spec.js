require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { ApiClient } = require('../utils/apiClient');
const client = new ApiClient(process.env.BASE_URL, process.env.JWT_TOKEN, process.env.USER_ID);

let unitId;

test.describe('Inventory Management API Tests', () => {
  test('GET all unitization configs - validate response', async () => {
    const response = await client.get('/v1/hub/configurations/inventory/unitization');
    expect(response.status()).toBe(200);
    const units = await response.json();
    expect(Array.isArray(units)).toBeTruthy();
    expect(units.length).toBeGreaterThan(0);
  });

  test('POST create unitization - validate creation', async () => {
    const today = new Date().toISOString().split('T')[0];
    const payload = {
      hub_config_id: 1080,
      lkp_inv_type_id: 3752,
      is_inv_exists: true,
      lkp_draft_active: 'save_next',
      inv_details: [
        {
          lkp_inv_sub_type_id: 4086,
          unique_ids: [
            {
              from_id: 'B123456789012',
              to_id: 'B123456789019',
              assign_date: today,
              end_date: today,
              count: 8
            }
          ],
          non_unique_ids: [
            { count: 2, assign_date: today, end_date: today }
          ]
        }
      ],
      inv_count: 10
    };

    const response = await client.post('/v1/hub/configurations/inventory/unitization', payload);
    expect(response.status()).toBe(201);

    const getResponse = await client.get('/v1/hub/configurations/inventory/unitization');
    const units = await getResponse.json();
    unitId = units.find(u => u.hub_config_id === 1080 && u.lkp_inv_type_id === 3752).unitId;
  });

  test('Negative: Create unitization with invalid lkp_inv_type_id', async () => {
    const payload = {
      hub_config_id: 1080,
      lkp_inv_type_id: 3753,
      is_inv_exists: true,
      lkp_draft_active: 'save_next',
      inv_details: [
        {
          lkp_inv_sub_type_id: 4086,
          unique_ids: [
            {
              from_id: 'B123', to_id: 'B123456789012', assign_date: new Date().toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0], count: 5
            }
          ]
        }
      ],
      inv_count: 5
    };

    const response = await client.post('/v1/hub/configurations/inventory/unitization', payload);
    expect(response.status()).toBe(400);
  });

  test('Negative: Create unitization with invalid unique ID format', async () => {
    const payload = {
      hub_config_id: 1080,
      lkp_inv_type_id: 3752,
      is_inv_exists: true,
      lkp_draft_active: 'save_next',
      inv_details: [
        {
          lkp_inv_sub_type_id: 4086,
          unique_ids: [
            { from_id: '123', to_id: 'B123456789012', assign_date: new Date().toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0], count: 1 }
          ]
        }
      ],
      inv_count: 1
    };

    const response = await client.post('/v1/hub/configurations/inventory/unitization', payload);
    expect(response.status()).toBe(400);
  });

  test('Negative: Create unitization with future end_date', async () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const payload = {
      hub_config_id: 1080,
      lkp_inv_type_id: 3752,
      is_inv_exists: true,
      lkp_draft_active: 'save_next',
      inv_details: [
        {
          lkp_inv_sub_type_id: 4086,
          unique_ids: [
            {
              from_id: 'B123456789012',
              to_id: 'B123456789013',
              assign_date: new Date().toISOString().split('T')[0],
              end_date: tomorrow,
              count: 2
            }
          ]
        }
      ],
      inv_count: 2
    };

    const response = await client.post('/v1/hub/configurations/inventory/unitization', payload);
    expect(response.status()).toBe(400);
  });

  test('PUT update unitization - validate update', async () => {
    const payload = {
      is_inv_exists: false,
      lkp_draft_active: 'SAVE_NEXT'
    };

    const response = await client.put(`/v1/hub/configurations/inventory/unitization/${unitId}`, payload);
    expect(response.status()).toBe(200);
  });

  test('DELETE delete unitization - validate deletion', async () => {
    const response = await client.delete(`/v1/hub/configurations/inventory/unitization/${unitId}`);
    expect(response.status()).toBe(200);
  });
});

test('GET all MHE configs - validate response', async () => {
  const response = await client.get('/v1/hub/configurations/inventory/mhe');
  expect(response.status()).toBe(200);
  const mhe = await response.json();
  expect(Array.isArray(mhe)).toBeTruthy();
});

test('POST create MHE - validate creation', async () => {
  const payload = {
    equipmentType: 'FORKLIFT',
    equipmentId: 'MHE001',
    capacity: 5,
    status: 'ACTIVE'
  };

  const response = await client.post('/v1/hub/configurations/inventory/mhe', payload);
  expect(response.status()).toBe(201);
});

test('Negative: Create MHE with invalid equipmentType', async () => {
  const payload = {
    equipmentType: 'invalid',
    equipmentId: 'MHE002',
    capacity: 10,
    status: 'INACTIVE'
  };

  const response = await client.post('/v1/hub/configurations/inventory/mhe', payload);
  expect(response.status()).toBe(400);
});

test('PUT update MHE - validate update', async () => {
  const response = await client.put('/v1/hub/configurations/inventory/mhe/MHE001', { status: 'INACTIVE' });
  expect(response.status()).toBe(200);
});

test('DELETE delete MHE - validate deletion', async () => {
  const response = await client.delete('/v1/hub/configurations/inventory/mhe/MHE001');
  expect(response.status()).toBe(200);
});

test('GET all electronic devices - validate response', async () => {
  const response = await client.get('/v1/hub/configurations/inventory/electronic-devices');
  expect(response.status()).toBe(200);
  const devices = await response.json();
  expect(Array.isArray(devices)).toBeTruthy();
});

test('POST create electronic device - validate creation', async () => {
  const payload = {
    deviceType: 'SCANNER',
    deviceId: 'DEV001',
    assignedTo: 'USER123'
  };

  const response = await client.post('/v1/hub/configurations/inventory/electronic-devices', payload);
  expect(response.status()).toBe(201);
});

test('Negative: Create electronic device with missing assignedTo', async () => {
  const payload = {
    deviceType: 'TABLET',
    deviceId: 'DEV002'
  };

  const response = await client.post('/v1/hub/configurations/inventory/electronic-devices', payload);
  expect(response.status()).toBe(400);
});

test('DELETE delete electronic device - validate deletion', async () => {
  const response = await client.delete('/v1/hub/configurations/inventory/electronic-devices/DEV001');
  expect(response.status()).toBe(200);
});

test('GET all CHA configs - validate response', async () => {
  const response = await client.get('/v1/hub/configurations/inventory/cha');
  expect(response.status()).toBe(200);
  const cha = await response.json();
  expect(Array.isArray(cha)).toBeTruthy();
});

test('POST create CHA - validate creation', async () => {
  const payload = {
    chaName: 'CHA001',
    chaCode: 'CHA123',
    contactInfo: { phone: '1234567890', email: 'cha@example.com' }
  };

  const response = await client.post('/v1/hub/configurations/inventory/cha', payload);
  expect(response.status()).toBe(201);
});

test('Negative: Create CHA with missing contactInfo', async () => {
  const payload = {
    chaName: 'CHA002',
    chaCode: 'CHA456'
  };

  const response = await client.post('/v1/hub/configurations/inventory/cha', payload);
  expect(response.status()).toBe(400);
});

test('POST bulk check - validate results', async () => {
  const itemIds = ['UNIT001', 'MHE001'];
  const response = await client.post('/v1/hub/configurations/inventory/cha/bulk-check', { items: itemIds });
  expect(response.status()).toBe(200);
});

test('Negative: Bulk check with empty items', async () => {
  const response = await client.post('/v1/hub/configurations/inventory/cha/bulk-check', { items: [] });
  expect(response.status()).toBe(400);
});
