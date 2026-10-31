import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e', testMatch: '**/version-transition.spec.ts', fullyParallel: false, workers: 1, retries: 0,
  timeout: 180_000, reporter: 'list',
  use: { baseURL: 'https://localhost:4200', ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 }, actionTimeout: 15_000,
    screenshot: 'only-on-failure', launchOptions: process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH']
      ? { executablePath: process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH'] } : {} },
  webServer: [
    { command: 'E2E_PERSISTENT_DATABASE_DIR="$PWD/../.local/e2e-transition" ../scripts/start-e2e-api.sh',
      url: 'http://127.0.0.1:8080/api/v2/access/csrf', timeout: 180_000, reuseExistingServer: false,
      gracefulShutdown: { signal: 'SIGTERM', timeout: 30_000 } },
    { command: '../scripts/start-transition-preview.sh', url: 'https://localhost:4200', ignoreHTTPSErrors: true,
      timeout: 180_000, reuseExistingServer: false, gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 } }
  ]
});
