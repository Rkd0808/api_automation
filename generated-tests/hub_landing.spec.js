require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { ApiClient } = require('../utils/apiClient');
const client = new ApiClient(process.env.BASE_URL, process.env.JWT_TOKEN, process.env.USER_ID);
const fs = require('fs');
const path = require('path');

// Read branch data from JSON file
const dataPath = path.join(__dirname, '../data/extracted_data.json');
const branchData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const branchId = branchData.branchId;
const branchName = branchData.branchName;

test.describe('Hub Landing API Tests', () => {
  // Test 1: GET basic hub configuration
  test('GET basic hub config - validate response', async () => {
    const response = await client.get('/v1/hub/configurations/hub-landing/basic-config');
    expect(response.status()).toBe(200);
    const config = await response.json();
    expect(config.configId).toBeDefined();
    expect(config.hubId).toBeDefined();
    expect(config.hubName).toBeDefined();
    expect(config.capacity).toBeGreaterThan(0);
    const headers = await response.request().headers();
    expect(headers['userid']).toBeDefined();
    expect(headers['userid']).toBe(process.env.USER_ID);
  });

  // Test 2: PUT basic config with valid data
  test('PUT update basic config - verify update', async () => {
    const updateData = {
      hubName: 'Test Hub',
      capacity: 200,
      operationalHours: { start: '08:00', end: '18:00' }
    };
    const response = await client.put('/v1/hub/configurations/hub-landing/basic-config', updateData);
    expect(response.status()).toBe(200);
    const updatedConfig = await response.json();
    expect(updatedConfig.hubName).toBe('Test Hub');
  });

  // Test 3: Negative PUT with invalid hours
  test('PUT invalid operational hours - expect 400', async () => {
    const payload = {
      hubName: 'Invalid Hub',
      capacity: 100,
      operationalHours: { start: '25:00', end: '26:00' }
    };
    const response = await client.put('/v1/hub/configurations/hub-landing/basic-config', payload);
    expect(response.status()).toBe(400);
  });

  // Test 4: GET version by ID
  test('GET version v1.0 - validate data', async () => {
    const response = await client.get('/v1/hub/configurations/hub-landing/version/v1.0');
    expect(response.status()).toBe(200);
    const version = await response.json();
    expect(version.version).toBe('v1.0');
    expect(version.hubId).toBe(branchId); // Cross-reference with branch data
  });

  // Test 5: Negative GET non-existent version
  test('GET invalid version - expect 404', async () => {
    const response = await client.get('/v1/hub/configurations/hub-landing/version/v999');
    expect(response.status()).toBe(404);
  });

  // Test 6: Get gates
  test('GET all gates - validate array', async () => {
    const response = await client.get('/v1/hub/configurations/hub-landing/gates');
    expect(response.status()).toBe(200);
    const gates = await response.json();
    expect(Array.isArray(gates)).toBe(true);
    expect(gates.length).toBeGreaterThan(0);
  });

  // Test 7: Create gate with valid data
  test('POST create gate - store ID', async () => {
    const newGate = {
      gateName: 'Main Entrance',
      gateType: 'ENTRY',
      capacity: 3
    };
    const response = await client.post('/v1/hub/configurations/hub-landing/gates', newGate);
    expect(response.status()).toBe(201);
    const created = await response.json();
    expect(created.gateId).toBeDefined();
    gateId = created.gateId; // Save for update/delete tests
  });

  // Test 8: Create gate without name ( Negative )
  test('POST missing gate name - expect 400', async () => {
    const invalid = { gateType: 'EXIT', capacity: 2 };
    const response = await client.post('/v1/hub/configurations/hub-landing/gates', invalid);
    expect(response.status()).toBe(400);
  });

  // Test 9: Update gate
  test('PUT update gate with valid data', async () => {
    const update = { gateName: 'Updated Gate', capacity: 5 };
    const response = await client.put(`/v1/hub/configurations/hub-landing/gates/${gateId}`, update);
    expect(response.status()).toBe(200);
    const updated = await response.json();
    expect(updated.gateName).toBe('Updated Gate');
  });

  // Test 10: Delete gate
  test('DELETE gate - expect 200', async () => {
    const response = await client.delete(`/v1/hub/configurations/hub-landing/gates/${gateId}`);
    expect(response.status()).toBe(200);
  });

  // Test 11: Delete non-existent gate
  test('DELETE invalid gate ID - expect 404', async () => {
    const response = await client.delete('/v1/hub/configurations/hub-landing/gates/INVALID_ID');
    expect(response.status()).toBe(404);
  });

  // Test 12: Create building
  test('POST add building - use branch data', async () => {
    const payload = {
      branchId: branchId,
      branchName: branchName,
      buildingName: 'Warehouse',
      buildingType: 'WAREHOUSE',
      floors: 3,
      area: 5000
    };
    const response = await client.post('/v1/hub/configurations/hub-landing/buildings', payload);
    expect(response.status()).toBe(201);
    const created = await response.json();
    expect(created.buildingId).toBeDefined();
    buildingId = created.buildingId; // Save for update tests
  });

  // Test 13: Create building with invalid type
  test('POST building invalid type - expect 400', async () => {
    const invalid = {
      branchId: branchId,
      branchName: branchName,
      buildingName: 'Invalid',
      buildingType: 'INVALID_TYPE',
      floors: 0,
      area: 0
    };
    const response = await client.post('/v1/hub/configurations/hub-landing/buildings', invalid);
    expect(response.status()).toBe(400);
  });

  // Test 14: Get buildings
  test('GET all buildings - validate array', async () => {
    const response = await client.get('/v1/hub/configurations/hub-landing/buildings');
    expect(response.status()).toBe(200);
    const buildings = await response.json();
    expect(Array.isArray(buildings)).toBe(true);
    expect(buildings.length).toBeGreaterThan(0);
  });

  // Test 15: Update building
  test('PUT update building - validate changes', async () => {
    const update = {
      buildingName: 'Updated Warehouse',
      floors: 4
    };
    const response = await client.put(`/v1/hub/configurations/hub-landing/buildings/${buildingId}`, update);
    expect(response.status()).toBe(200);
    const updated = await response.json();
    expect(updated.buildingName).toBe('Updated Warehouse');
  });

  // Test 16: Delete building
  test('DELETE building - expect 200', async () => {
    const response = await client.delete(`/v1/hub/configurations/hub-landing/buildings/${buildingId}`);
    expect(response.status()).toBe(200);
  });

  // Test 17: Get bays
  test('GET all bays - validate array', async () => {
    const response = await client.get('/v1/hub/configurations/hub-landing/bays');
    expect(response.status()).toBe(200);
    const bays = await response.json();
    expect(Array.isArray(bays)).toBe(true);
    expect(bays.length).toBeGreaterThan(0);
  });

  // Test 18: Create loading bay
  test('POST create loading bay - store ID', async () => {
    const bay = {
      bayNumber: 'B1',
      bayType: 'LOADING',
      capacity: 10
    };
    const response = await client.post('/v1/hub/configurations/hub-landing/bays', bay);
    expect(response.status()).toBe(201);
    const created = await response.json();
    expect(created.bayId).toBeDefined();
    bayId = created.bayId; // Save for update tests
  });

  // Test 19: Create bay with invalid type
  test('POST bay invalid type - expect 400', async () => {
    const invalid = { bayNumber: 'B2', bayType: 'INVALID', capacity: 5 };
    const response = await client.post('/v1/hub/configurations/hub-landing/bays', invalid);
    expect(response.status()).toBe(400);
  });

  // Test 20: Update bay
  test('PUT update bay - validate changes', async () => {
    const update = { bayNumber: 'B1-Updated', capacity: 12 };
    const response = await client.put(`/v1/hub/configurations/hub-landing/bays/${bayId}`, update);
    expect(response.status()).toBe(200);
    const updated = await response.json();
    expect(updated.bayNumber).toBe('B1-Updated');
  });

  // Test 21: Delete bay
  test('DELETE bay - expect 200', async () => {
    const response = await client.delete(`/v1/hub/configurations/hub-landing/bays/${bayId}`);
    expect(response.status()).toBe(200);
  });

  // Test 22: Get offices
  test('GET all offices - validate array', async () => {
    const response = await client.get('/v1/hub/configurations/hub-landing/offices');
    expect(response.status()).toBe(200);
    const offices = await response.json();
    expect(Array.isArray(offices)).toBe(true);
    expect(offices.length).toBeGreaterThan(0);
  });

  // Test 23: Create office
  test('POST create office - use branch data', async () => {
    const office = {
      branchId: branchId,
      branchName: branchName,
      officeName: 'Admin Office',
      floor: 2,
      capacity: 15,
      facilities: ['WiFi', 'AC']
    };
    const response = await client.post('/v1/hub/configurations/hub-landing/offices', office);
    expect(response.status()).toBe(201);
    const created = await response.json();
    expect(created.officeId).toBeDefined();
  });

  // Test 24: Create office with invalid facilities
  test('POST office invalid facilities - expect 400', async () => {
    const invalid = {
      branchId: branchId,
      branchName: branchName,
      officeName: 'Invalid',
      floor: 1,
      capacity: 10,
      facilities: ['WiFi', 123] // Number instead of string
    };
    const response = await client.post('/v1/hub/configurations/hub-landing/offices', invalid);
    expect(response.status()).toBe(400);
  });

  // Test 25: Update office
  test('PUT update office - validate changes', async () => {
    const update = { officeName: 'Updated Office', capacity: 20 };
    const response = await client.put(`/v1/hub/configurations/hub-landing/offices/${'office123'}`, update); // Use a known office ID
    expect(response.status()).toBe(200);
    const updated = await response.json();
    expect(updated.officeName).toBe('Updated Office');
  });
});
