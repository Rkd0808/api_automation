require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { ApiClient } = require('../utils/apiClient');
const client = new ApiClient(process.env.BASE_URL, process.env.JWT_TOKEN, process.env.USER_ID);
const fs = require('fs');
const path = require('path');

test.describe('Lookup API Tests', () => {
  let vehicleTypeId;
  let countryId;
  let stateId;
  let locationId;
  let categoryId;
  let roleId;

  test('GET all vehicle types - validate response', async () => {
    const response = await client.get('/vehicle-types');
    expect(response.status()).toBe(200);
    const vehicleTypes = await response.json();
    expect(Array.isArray(vehicleTypes.vehicleTypes)).toBeTruthy();
    expect(vehicleTypes.vehicleTypes.length).toBeGreaterThan(0);
    vehicleTypeId = vehicleTypes.vehicleTypes[0].id;
    // Save extracted vehicleTypeId to JSON
    fs.writeFileSync(
      path.join(__dirname, '../data/extracted_data.json'),
      JSON.stringify({ vehicleTypeId }, null, 2)
    );
  });

  test('GET vehicle models by vehicleTypeId - validate chaining', async () => {
    const data = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '../data/extracted_data.json'),
        'utf8'
      )
    );
    const response = await client.get(
      `/vehicle-models?vehicleTypeId=${data.vehicleTypeId}`
    );
    expect(response.status()).toBe(200);
    const vehicleModels = await response.json();
    expect(Array.isArray(vehicleModels.vehicleModels)).toBeTruthy();
    // Extract first model's ID for potential further chaining
    if (vehicleModels.vehicleModels.length > 0) {
      const modelId = vehicleModels.vehicleModels[0].id;
      fs.writeFileSync(
        path.join(__dirname, '../data/model_id.json'),
        JSON.stringify({ modelId }, null, 2)
      );
    }
  });

  test('GET vehicle models without vehicleTypeId - expect full list', async () => {
    const response = await client.get('/vehicle-models');
    expect(response.status()).toBe(200);
    const vehicleModels = await response.json();
    expect(vehicleModels.vehicleModels.length).toBeGreaterThan(0);
  });

  test('GET all locations - validate response', async () => {
    const response = await client.get('/locations');
    expect(response.status()).toBe(200);
    const locations = await response.json();
    expect(Array.isArray(locations.locations)).toBeTruthy();
    expect(locations.locations.length).toBeGreaterThan(0);
    locationId = locations.locations[0].id;
  });

  test('GET locations filtered by branch type - validate filtering', async () => {
    const response = await client.get('/locations?type=branch');
    expect(response.status()).toBe(200);
    const branchLocations = await response.json();
    expect(Array.isArray(branchLocations.locations)).toBeTruthy();
    // Verify at least one branch exists
    expect(branchLocations.locations.length).toBeGreaterThan(0);
  });

  test('GET status codes without entity - expect 400', async () => {
    const response = await client.get('/status-codes');
    expect(response.status()).toBe(400);
  });

  test('GET status codes with entity=order - validate success', async () => {
    const response = await client.get('/status-codes?entity=order');
    expect(response.status()).toBe(200);
    const statusCodes = await response.json();
    expect(Array.isArray(statusCodes.statusCodes)).toBeTruthy();
  });

  test('GET countries - validate response', async () => {
    const response = await client.get('/countries');
    expect(response.status()).toBe(200);
    const countries = await response.json();
    expect(Array.isArray(countries.countries)).toBeTruthy();
    expect(countries.countries.length).toBeGreaterThan(0);
    countryId = countries.countries[0].id;
  });

  test('GET states by countryId - validate chaining', async () => {
    const response = await client.get(`/states?countryId=${countryId}`);
    expect(response.status()).toBe(200);
    const states = await response.json();
    expect(Array.isArray(states.states)).toBeTruthy();
    expect(states.states.length).toBeGreaterThan(0);
    stateId = states.states[0].id;
  });

  test('GET cities by stateId - validate chaining', async () => {
    const response = await client.get(`/cities?stateId=${stateId}`);
    expect(response.status()).toBe(200);
    const cities = await response.json();
    expect(Array.isArray(cities.cities)).toBeTruthy();
    expect(cities.cities.length).toBeGreaterThan(0);
  });

  test('GET product categories - validate response', async () => {
    const response = await client.get('/product-categories');
    expect(response.status()).toBe(200);
    const categories = await response.json();
    expect(Array.isArray(categories.categories)).toBeTruthy();
    expect(categories.categories.length).toBeGreaterThan(0);
    categoryId = categories.categories[0].id;
  });

  test('GET user roles - validate response', async () => {
    const response = await client.get('/user-roles');
    expect(response.status()).toBe(200);
    const roles = await response.json();
    expect(Array.isArray(roles.roles)).toBeTruthy();
    expect(roles.roles.length).toBeGreaterThan(0);
    roleId = roles.roles[0].id;
  });

  test('GET payment methods - validate response', async () => {
    const response = await client.get('/payment-methods');
    expect(response.status()).toBe(200);
    const methods = await response.json();
    expect(Array.isArray(methods.paymentMethods)).toBeTruthy();
    expect(methods.paymentMethods.length).toBeGreaterThan(0);
  });

  test('GET document types - validate response', async () => {
    const response = await client.get('/document-types');
    expect(response.status()).toBe(200);
    const documentTypes = await response.json();
    expect(Array.isArray(documentTypes.documentTypes)).toBeTruthy();
    expect(documentTypes.documentTypes.length).toBeGreaterThan(0);
  });

  test('GET units - validate response', async () => {
    const response = await client.get('/units');
    expect(response.status()).toBe(200);
    const units = await response.json();
    expect(Array.isArray(units.units)).toBeTruthy();
    expect(units.units.length).toBeGreaterThan(0);
  });

  test('GET currencies - validate response', async () => {
    const response = await client.get('/currencies');
    expect(response.status()).toBe(200);
    const currencies = await response.json();
    expect(Array.isArray(currencies.currencies)).toBeTruthy();
    expect(currencies.currencies.length).toBeGreaterThan(0);
  });

  test('GET vehicle types with invalid ID - expect empty response', async () => {
    const invalidId = 'NON_EXISTENT';
    const response = await client.get(`/vehicle-models?vehicleTypeId=${invalidId}`);
    expect(response.status()).toBe(200);
    const models = await response.json();
    expect(models.vehicleModels.length).toEqual(0);
  });

  test('GET locations with invalid type filter - expect empty response', async () => {
    const response = await client.get('/locations?type=invalid');
    expect(response.status()).toBe(200);
    const locations = await response.json();
    expect(locations.locations.length).toEqual(0);
  });

  test('GET cities for non-existent state - expect empty response', async () => {
    const response = await client.get('/cities?stateId=INVALID');
    expect(response.status()).toBe(200);
    const cities = await response.json();
    expect(cities.cities.length).toEqual(0);
  });

  test('GET status codes without entity param - expect 400', async () => {
    const response = await client.get('/status-codes');
    expect(response.status()).toBe(400);
  });

  test('GET locations without authentication - expect 401', async () => {
    // Temporarily override JWT_TOKEN to empty
    client.token = '';
    const response = await client.get('/locations');
    expect(response.status()).toBe(401);
    client.token = process.env.JWT_TOKEN; // Restore for subsequent tests
  });
});
