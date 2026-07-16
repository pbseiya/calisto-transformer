import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  use: {
    baseURL: 'https://100.123.214.57',
    ignoreHTTPSErrors: true,
    viewport: { width: 1440, height: 900 },
  },
  reporter: 'line',
});
