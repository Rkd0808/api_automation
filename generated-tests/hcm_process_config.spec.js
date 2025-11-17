require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { ApiClient } = require('../utils/apiClient');
const client = new ApiClient(process.env.BASE_URL, process.env.JWT_TOKEN, process.env.USER_ID);

test.describe('HCM Process Config API Tests', () => {
  let conditionId;
  let thresholdId;
  let configId;

  test('GET all vehicle conditions - validate response', async () => {
    const response = await client.get('/v1/hub/configurations/hcm-process-config/vehicle-conditions');
    expect(response.status()).toBe(200);
    const conditions = await response.json();
    expect(Array.isArray(conditions)).toBeTruthy();
    expect(conditions.length).toBeGreaterThan(0);
    conditionId = conditions[0].conditionId;
  });

  test('POST create vehicle condition - validate creation', async () => {
    const payload = {
      conditionName: 'High Temperature',
      criteria: { type: 'TEMP', value: '>75' },
      threshold: 80
    };
    const response = await client.post('/v1/hub/configurations/hcm-process-config/vehicle-conditions', payload);
    expect(response.status()).toBe(201);
    const created = await response.json();
    expect(created.conditionId).toBeDefined();
  });

  test('Negative: POST invalid criteria - expect 400', async () => {
    const payload = {
      conditionName: 'Invalid Criteria',
      criteria: { type: 'INVALID', value: 'unknown' },
      threshold: 0
    };
    const response = await client.post('/v1/hub/configurations/hcm-process-config/vehicle-conditions', payload);
    expect(response.status()).toBe(400);
  });

  test('GET vehicle condition by ID - verify single record', async () => {
    const response = await client.get(`/v1/hub/configurations/hcm-process-config/vehicle-conditions/${conditionId}`);
    expect(response.status()).toBe(200);
    const condition = await response.json();
    expect(condition.conditionId).toBe(conditionId);
    expect(condition.conditionName).toBe('High Temperature');
  });

  test('PUT update vehicle condition - validate update', async () => {
    const updatedPayload = { threshold: 85 };
    const response = await client.put(`/v1/hub/configurations/hcm-process-config/vehicle-conditions/${conditionId}`, updatedPayload);
    expect(response.status()).toBe(200);
    const updated = await response.json();
    expect(updated.threshold).toBe(85);
  });

  test('Negative: PUT non-existent condition - expect 404', async () => {
    const response = await client.put('/v1/hub/configurations/hcm-process-config/vehicle-conditions/INVALID123', {});
    expect(response.status()).toBe(404);
  });

  test('DELETE vehicle condition - validate deletion', async () => {
    const response = await client.delete(`/v1/hub/configurations/hcm-process-config/vehicle-conditions/${conditionId}`);
    expect(response.status()).toBe(204);
  });

  test('GET cut-off thresholds - validate response', async () => {
    const response = await client.get('/v1/hub/configurations/hcm-process-config/cutoff-thresholds');
    expect(response.status()).toBe(200);
    const thresholds = await response.json();
    expect(Array.isArray(thresholds)).toBeTruthy();
    expect(thresholds.length).toBeGreaterThan(0);
    thresholdId = thresholds[0].thresholdId;
  });

  test('POST create cutoff threshold - validate creation', async () => {
    const payload = {
      thresholdType: 'WEIGHT',
      value: 1000,
      unit: 'kg',
      applicableFor: ' Passenger'
    };
    const response = await client.post('/v1/hub/configurations/hcm-process-config/cutoff-thresholds', payload);
    expect(response.status()).toBe(201);
    const created = await response.json();
    expect(created.thresholdId).toBeDefined();
  });

  test('Negative: POST threshold with negative value - expect 400', async () => {
    const payload = {
      thresholdType: 'VOLUME',
      value: -500,
      unit: 'L',
      applicableFor: ' Truck'
    };
    const response = await client.post('/v1/hub/configurations/hcm-process-config/cutoff-thresholds', payload);
    expect(response.status()).toBe(400);
  });

  test('PUT update cutoff threshold - validate update', async () => {
    const updatedPayload = { value: 1200 };
    const response = await client.put(`/v1/hub/configurations/hcm-process-config/cutoff-thresholds/${thresholdId}`, updatedPayload);
    expect(response.status()).toBe(200);
    const updated = await response.json();
    expect(updated.value).toBe(1200);
  });

  test('Negative: PUT non-existent threshold - expect 404', async () => {
    const response = await client.put('/v1/hub/configurations/hcm-process-config/cutoff-thresholds/INVALID456', {});
    expect(response.status()).toBe(404);
  });

  test('GET basic configs - validate response', async () => {
    const response = await client.get('/v1/hub/configurations/hcm-process-config/basic-configs');
    expect(response.status()).toBe(200);
    const configs = await response.json();
    expect(Array.isArray(configs)).toBeTruthy();
    expect(configs.length).toBeGreaterThan(0);
    configId = configs[0].configId;
  });

  test('POST create basic config - validate creation', async () => {
    const payload = {
      configKey: 'vehicle_weight_limit',
      configValue: '2000',
      configType: 'NUMERIC',
      description: 'Maximum vehicle weight allowed'
    };
    const response = await client.post('/v1/hub/configurations/hcm-process-config/basic-configs', payload);
    expect(response.status()).toBe(201);
    const created = await response.json();
    expect(created.configId).toBeDefined();
  });

  test('Negative: POST duplicate config key - expect 400', async () => {
    const payload = {
      configKey: 'vehicle_weight_limit',
      configValue: '2500',
      configType: 'NUMERIC',
      description: 'Updated weight limit'
    };
    const response = await client.post('/v1/hub/configurations/hcm-process-config/basic-configs', payload);
    expect(response.status()).toBe(400);
  });

  test('PUT update basic config - validate update', async () => {
    const updatedPayload = { configValue: '2500' };
    const response = await client.put(`/v1/hub/configurations/hcm-process-config/basic-configs/${configId}`, updatedPayload);
    expect(response.status()).toBe(200);
    const updated = await response.json();
    expect(updated.configValue).toBe('2500');
  });

  test('Negative: PUT non-existent config - expect 404', async () => {
    const response = await client.put('/v1/hub/configurations/hcm-process-config/basic-configs/INVALID789', {});
    expect(response.status()).toBe(404);
  });

  test('Validate headers in responses', async () => {
    const response = await client.get('/v1/hub/configurations/hcm-process-config/vehicle-conditions');
    const headers = response.headers();
    expect(headers['userid']).toBeDefined();
    expect(headers['userid']).toBe(process.env.USER_ID);
  });
});
