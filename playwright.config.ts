import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  timeout: 30_000,
  use: { channel: 'chrome', headless: true, baseURL: 'http://127.0.0.1:4321/fliqlo/', viewport: { width: 1440, height: 1000 }, timezoneId: 'Asia/Shanghai' },
  reporter: 'list',
});
