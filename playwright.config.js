const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './generated-tests',
  timeout: 60000,
  retries: 1,
  reporter: [
    ['html'],
    ['list']
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://2cdifi6676.execute-api.ap-south-1.amazonaws.com/qa/hcmservice/v1',    extraHTTPHeaders: {
      'Authorization': `Bearer ${process.env.JWT_TOKEN || ''}`
    },
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
  },
});
