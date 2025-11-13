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
    baseURL: process.env.BASE_URL || 'https://hub-configuration-service.dev.tallento.ai',
    extraHTTPHeaders: {
      'Authorization': `Bearer ${process.env.JWT_TOKEN || ''}`
    },
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
  },
});
