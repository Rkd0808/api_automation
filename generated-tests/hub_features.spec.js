require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { ApiClient } = require('../utils/apiClient');
const client = new ApiClient(process.env.BASE_URL, process.env.JWT_TOKEN, process.env.USER_ID);

test.describe('Hub Features API Tests', () => {
  let weighbridgeId, facilityId, featureId;

  test('GET all weighbridge configurations', async () => {
    const response = await client.get('/weighbridge');
    expect(response.status()).toBe(200);
    const weighbridges = await response.json();
    expect(Array.isArray(weighbridges.weighbridges)).toBeTruthy();
    expect(weighbridges.weighbridges.length).toBeGreaterThan(0);
    weighbridgeId = weighbridges.weighbridges[0].id;
  });

  test('Create weighbridge with valid data', async () => {
    const newWeighbridge = {
      name: 'Test Weighbridge',
      location: 'Warehouse A',
      capacity: 100,
      unit: 'tons',
      isActive: true,
      calibrationDate: new Date().toISOString().split('T')[0]
    };
    const response = await client.post('/weighbridge', newWeighbridge);
    expect(response.status()).toBe(201);
    const created = await response.json();
    expect(created.id).toBeDefined();
    weighbridgeId = created.id;
  });

  test('Negative: Create weighbridge with missing fields', async () => {
    const invalidPayload = { name: 'Test' };
    const response = await client.post('/weighbridge', invalidPayload);
    expect(response.status()).toBe(400);
  });

  test('GET weighbridge by ID', async () => {
    const response = await client.get(`/weighbridge/${weighbridgeId}`);
    expect(response.status()).toBe(200);
    const weighbridge = await response.json();
    expect(weighbridge.id).toBe(weighbridgeId);
    expect(weighbridge.name).toBeDefined();
  });

  test('Update weighbridge configuration', async () => {
    const updateData = { name: 'Updated Test Weighbridge', capacity: 150 };
    const response = await client.put(`/weighbridge/${weighbridgeId}`, updateData);
    expect(response.status()).toBe(200);
    const updated = await response.json();
    expect(updated.name).toBe('Updated Test Weighbridge');
  });

  test('Negative: Update non-existent weighbridge', async () => {
    const response = await client.put('/weighbridge/INVALIDID', { name: 'Test' });
    expect(response.status()).toBe(404);
  });

  test('DELETE weighbridge', async () => {
    const response = await client.delete(`/weighbridge/${weighbridgeId}`);
    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.deletedId).toBe(weighbridgeId);
  });

  test('Negative: Delete active weighbridge (409)', async () => {
    const response = await client.delete(`/weighbridge/${weighbridgeId}`);
    expect(response.status()).toBe(409);
  });

  test('GET all facilities', async () => {
    const response = await client.get('/facilities');
    expect(response.status()).toBe(200);
    const facilities = await response.json();
    expect(Array.isArray(facilities.facilities)).toBeTruthy();
    expect(facilities.facilities.length).toBeGreaterThan(0);
    facilityId = facilities.facilities[0].id;
  });

  test('Create facility with valid data', async () => {
    const newFacility = {
      name: 'Test Facility',
      type: 'Warehouse',
      location: 'Main Campus',
      capacity: 500,
      isOperational: true,
      operatingHours: { start: '08:00', end: '18:00' }
    };
    const response = await client.post('/facilities', newFacility);
    expect(response.status()).toBe(201);
    const created = await response.json();
    expect(created.id).toBeDefined();
    facilityId = created.id;
  });

  test('Negative: Create facility without authentication', async () => {
    const response = await client.post('/facilities', { name: 'Test' });
    expect(response.status()).toBe(401);
  });

  test('Feature toggle', async () => {
    const response = await client.get('/features/enabled');
    const features = await response.json();
    featureId = features.features[0].featureId;
    
    const enableResponse = await client.post('/features/toggle', { featureId, isEnabled: true });
    expect(enableResponse.status()).toBe(200);
    
    const disabledResponse = await client.post('/features/toggle', { featureId, isEnabled: false });
    expect(disabledResponse.status()).toBe(200);
  });

  test('Negative: Toggle non-existent feature', async () => {
    const response = await client.post('/features/toggle', { featureId: 'INVALID', isEnabled: true });
    expect(response.status()).toBe(404);
  });
});
