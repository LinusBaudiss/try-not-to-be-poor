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
  const created = await request.post('http://127.0.0.1:8080/api/v2/savings-goals', {
    headers: { Authorization: bearer }, data: { name: 'Eigenes Ziel', targetAmountCents: 10000 }
  });
  expect(created.status()).toBe(201); const goal = await created.json();
  const selection = await request.put('http://127.0.0.1:8080/api/v2/monthly-surplus/selection', {
    headers: { Authorization: bearer }, data: { goalId: goal.id }
  });
  expect(selection.status()).toBe(409); expect((await selection.json()).code).toBe('FEATURE_NOT_AVAILABLE');
  expect(selection.headers()['cache-control']).toBe('no-store');
  const overview = await request.get('http://127.0.0.1:8080/api/v2/monthly-surplus', { headers: { Authorization: bearer } });
  expect(overview.status()).toBe(200); expect(overview.headers()['cache-control']).toBe('no-store');
  expect(await overview.json()).toMatchObject({ active: false, activationMonth: null, selectedGoalId: null, pendingCents: 0,
    goals: [{ id: goal.id, progressCents: 0 }] });
  await expect(page.locator('#pending-state')).toContainText('Vor deiner ausdrücklichen Aktivierung');
  expect((await request.post('http://127.0.0.1:8080/api/v2/monthly-surplus/pending', { headers: { Authorization: bearer } })).status()).toBe(403);
});
