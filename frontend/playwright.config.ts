import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'https://localhost:4200',
    ignoreHTTPSErrors: true,
    viewport: { width: 320, height: 568 },
    trace: 'off',
    screenshot: 'only-on-failure',
    launchOptions: process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH']
      ? { executablePath: process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH'] } : {}
  },
  webServer: [
    { command: '../scripts/start-e2e-api.sh', url: 'http://127.0.0.1:8080/api/v2/access/registrations', timeout: 120000, reuseExistingServer: false,
      gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 } },
    { command: 'npm start -- --port 4200 --host localhost --ssl', url: 'https://localhost:4200', ignoreHTTPSErrors: true, timeout: 120000, reuseExistingServer: false }
  ]
});
