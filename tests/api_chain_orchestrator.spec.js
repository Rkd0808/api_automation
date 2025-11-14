require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { ApiClient } = require('../utils/apiClient');
const fs = require('fs');
const path = require('path');

const client = new ApiClient(process.env.BASE_URL, process.env.JWT_TOKEN, process.env.USER_ID);
const chainConfig = require('../chains/api_chain.json');
const dataFilePath = path.join(__dirname, '../data/extracted_data.json');

test.describe('API Chain Orchestrator - Sequential Execution', () => {
  
  test.beforeAll(async () => {
    // Ensure data directory exists
    const dataDir = path.dirname(dataFilePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    // Clear previous data
    if (fs.existsSync(dataFilePath)) {
      fs.unlinkSync(dataFilePath);
    }
  });

  test('Execute complete API chain in sequence', async () => {
    const executionOrder = chainConfig.executionOrder;
    let extractedData = {};

    for (const stepName of executionOrder) {
      console.log(`\n========== Executing: ${stepName} ==========`);
      const stepConfig = chainConfig[stepName];
      
      // Read existing data if needed
      if (stepConfig.readFromFile && fs.existsSync(dataFilePath)) {
        extractedData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
        console.log('Loaded data:', extractedData);
      }

      // Prepare payload with placeholders replaced
      let payload = null;
      if (stepConfig.payloadTemplate) {
        payload = JSON.parse(JSON.stringify(stepConfig.payloadTemplate)); // Deep clone
        
        // Replace placeholders like {{branchId}} with actual values
        const payloadStr = JSON.stringify(payload);
        const replacedStr = payloadStr.replace(/\{\{(\w+)\}\}/g, (match, key) => {
          return extractedData[key] !== undefined ? extractedData[key] : match;
        });
        payload = JSON.parse(replacedStr);
        console.log('Payload:', JSON.stringify(payload, null, 2));
      }

      // Execute API call
      let response;
      switch (stepConfig.method) {
        case 'GET':
          response = await client.get(stepConfig.endpoint);
          break;
        case 'POST':
          response = await client.post(stepConfig.endpoint, payload);
          break;
        case 'PUT':
          response = await client.put(stepConfig.endpoint, payload);
          break;
        case 'PATCH':
          response = await client.patch(stepConfig.endpoint, payload);
          break;
        case 'DELETE':
          response = await client.delete(stepConfig.endpoint);
          break;
        default:
          throw new Error(`Unknown method: ${stepConfig.method}`);
      }

      // Verify response
      const status = response.status();
      console.log(`Response status: ${status}`);
      expect([200, 201, 202]).toContain(status);

      // Parse response
      const responseData = await response.json();
      console.log('Response:', JSON.stringify(responseData, null, 2));

      // Extract fields if configured
      if (stepConfig.extractFields) {
        for (const fieldConfig of stepConfig.extractFields) {
          const fieldPath = fieldConfig.from.replace('response', 'responseData');
          let value;
          
          // Handle array indexing like response[0].branchId
          if (fieldPath.includes('[')) {
            value = eval(fieldPath);
          } else {
            // Handle dot notation like response.basicConfigId
            const keys = fieldPath.replace('responseData.', '').split('.');
            value = keys.reduce((obj, key) => obj?.[key], responseData);
          }
          
          extractedData[fieldConfig.field] = value;
          console.log(`Extracted ${fieldConfig.field}:`, value);
        }

        // Save or append to file
        if (stepConfig.saveToFile || stepConfig.appendToFile) {
          fs.writeFileSync(dataFilePath, JSON.stringify(extractedData, null, 2));
          console.log('Saved data to file:', dataFilePath);
        }
      }

      console.log(`========== Completed: ${stepName} ==========\n`);
    }

    // Final verification
    console.log('\n========== CHAIN EXECUTION COMPLETED ==========');
    console.log('Final extracted data:', extractedData);
    expect(extractedData.branchId).toBeDefined();
    expect(extractedData.branchName).toBeDefined();
    expect(extractedData.basicConfigId).toBeDefined();
    expect(extractedData.hubId).toBeDefined();
  });

});
