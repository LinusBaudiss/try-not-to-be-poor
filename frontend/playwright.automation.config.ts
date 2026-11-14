import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e', testMatch: '**/monthly-automation.spec.ts', fullyParallel: false, workers: 1, retries: 0,
  timeout: 45_000, reporter: 'list',
  use: { baseURL: 'https://localhost:4200', ignoreHTTPSErrors: true, timezoneId: 'Pacific/Honolulu', viewport: { width: 390, height: 844 }, actionTimeout: 15_000,
    screenshot: 'only-on-failure', launchOptions: process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH']
      ? { executablePath: process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH'] } : {} },
  webServer: [
    { command: 'sh ../scripts/start-automation-e2e-api.sh', url: 'http://127.0.0.1:8080/api/v2/access/csrf', timeout: 180_000, reuseExistingServer: false,
      gracefulShutdown: { signal: 'SIGTERM', timeout: 10_000 } },
    { command: 'npm start -- --port 4200 --host localhost --ssl', url: 'https://localhost:4200', ignoreHTTPSErrors: true,
      timeout: 120_000, reuseExistingServer: false }
  ]
});
