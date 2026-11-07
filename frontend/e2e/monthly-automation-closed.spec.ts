import { expect, test } from '@playwright/test';

test('Reguläre Auslieferung bietet keine Aktivierung an und sperrt direktes HTTP', async ({ page, request }) => {
  const email = `automation-closed-${crypto.randomUUID()}@example.org`, password = '  Grüner 🦊 im Baum  ';
  expect((await request.post('http://127.0.0.1:8080/api/v2/access/registrations', { data: { registrationToken: 'a'.repeat(43), email, password } })).status()).toBe(201);
  let bearer = '';
  page.on('request', item => { if (item.url().endsWith('/access/me')) bearer = item.headers()['authorization'] ?? ''; });
  await page.goto('/anmelden'); await page.getByLabel('E-Mail-Adresse', { exact: true }).fill(email); await page.getByLabel('Passwort', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click(); await expect(page.getByRole('heading', { name: 'Monat', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Sparziele', exact: true }).click();
  await expect(page.locator('#automation-state')).toContainText('noch nicht aktiviert'); await expect(page.locator('#automation-capability')).toContainText('derzeit nicht verfügbar');
  await expect(page.getByRole('button', { name: 'Monatsautomatik ausdrücklich aktivieren', exact: true })).toHaveCount(0);
  const response = await request.post('http://127.0.0.1:8080/api/v2/monthly-surplus/activation', { headers: { Authorization: bearer } });
  expect(response.status()).toBe(409); expect((await response.json()).code).toBe('FEATURE_NOT_AVAILABLE'); expect(response.headers()['cache-control']).toBe('no-store');
  const state = await request.get('http://127.0.0.1:8080/api/v2/monthly-surplus/activation', { headers: { Authorization: bearer } });
  expect(await state.json()).toEqual({ active: false, activationMonth: null });
  const pending = await request.get('http://127.0.0.1:8080/api/v2/monthly-surplus/pending', { headers: { Authorization: bearer } });
  expect(pending.status()).toBe(200); expect(await pending.json()).toEqual({ pendingCents: 0 });
  expect(pending.headers()['cache-control']).toBe('no-store');
  await expect(page.locator('#pending-state')).toContainText('Vor deiner ausdrücklichen Aktivierung');
  expect((await request.post('http://127.0.0.1:8080/api/v2/monthly-surplus/pending', { headers: { Authorization: bearer } })).status()).toBe(403);
});
