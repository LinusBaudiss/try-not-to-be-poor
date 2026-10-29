import { expect, Page } from '@playwright/test';

const password = '  Grüner 🦊 im Baum  ';

export async function completeV2Flow(page: Page): Promise<void> {
  const access: { path: string; method: string; bearer?: string; csrf?: string; origin?: string }[] = [];
  const headerChecks: Promise<void>[] = [];
  const finances = new Set<string>();
  page.on('response', response => {
    if (/^\/api\/v[12]\//.test(new URL(response.url()).pathname)) {
      headerChecks.push(response.allHeaders().then(headers => { expect(headers['cache-control']).toBe('no-store'); }));
    }
  });
  page.on('request', request => {
    const path = new URL(request.url()).pathname;
    if (/\/api\/v\d+\/access\//.test(path)) {
      headerChecks.push(request.allHeaders().then(headers => {
        access.push({ path, method: request.method(), bearer: headers['authorization'], csrf: headers['x-csrf-token'], origin: headers['origin'] });
      }));
    }
    if (/^\/api\/v[12]\//.test(path) && !path.includes('/access/')) finances.add(`${request.method()} ${path}`);
  });
  const email = `v2-browser-${crypto.randomUUID()}@example.org`;
  await page.goto(`/registrieren#registrationToken=${'a'.repeat(43)}`);
  await page.getByLabel('E-Mail-Adresse', { exact: true }).fill(email);
  await page.getByLabel('Passwort', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Konto anlegen', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Dein Konto wurde angelegt.');
  await page.getByRole('link', { name: 'Zur Anmeldung' }).click();
  await expect(page.getByRole('heading', { name: 'Anmelden', exact: true })).toBeVisible();
  await page.getByLabel('E-Mail-Adresse', { exact: true }).fill(email);
  await page.getByLabel('Passwort', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByLabel('Monatsbudget in Euro', { exact: true })).toBeVisible();
  await page.getByLabel('Monatsbudget in Euro', { exact: true }).fill('75');
  await page.getByRole('button', { name: 'Budget speichern', exact: true }).click();
  await expect(page.locator('#budget-status')).toContainText('wurde gespeichert');
  await page.getByRole('link', { name: 'Ausgaben', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ausgabe speichern', exact: true })).toBeEnabled();
  await page.getByLabel('Name der Ausgabe').fill('Netzwerkprüfung');
  await page.getByLabel('Ausgabenbetrag in Euro').fill('1');
  await page.getByRole('button', { name: 'Ausgabe speichern', exact: true }).click();
  await expect(page.locator('#expense-status')).toHaveText('Deine Ausgabe wurde gespeichert.');
  const expenseId = await page.locator('.expense-cards [data-expense-action]').first().getAttribute('data-expense-action');
  await page.getByRole('button', { name: 'Netzwerkprüfung bearbeiten', exact: true }).click();
  await page.getByLabel('Betrag bearbeiten in Euro').fill('2');
  await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
  await expect(page.locator('#expense-status')).toHaveText('Deine Ausgabe wurde geändert.');
  await page.getByRole('button', { name: 'Netzwerkprüfung löschen', exact: true }).click();
  await page.getByRole('button', { name: 'Endgültig löschen', exact: true }).click();
  await expect(page.locator('#expense-status')).toHaveText('Deine Ausgabe wurde gelöscht.');
  await page.getByRole('link', { name: 'Sparziele', exact: true }).click();
  await expect(page.getByText('Du bist angemeldet. Deine persönlichen Sparziele sind geöffnet.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sparziel speichern', exact: true })).toBeEnabled();
  await page.getByLabel('Name des Sparziels', { exact: true }).fill('Netzwerkziel');
  await page.getByLabel('Zielbetrag in Euro', { exact: true }).fill('100');
  const goalResponse = page.waitForResponse(r => r.url().endsWith('/api/v2/savings-goals') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Sparziel speichern', exact: true }).click();
  const goalId = (await (await goalResponse).json()).id;
  await expect(page.locator('#goal-status')).toHaveClass(/success/);
  await page.getByRole('button', { name: 'Fortschritt aktualisieren: Netzwerkziel', exact: true }).click();
  await page.getByLabel('Gesamtfortschritt in Euro').fill('70');
  await page.getByRole('button', { name: 'Fortschritt speichern', exact: true }).click();
  await expect(page.locator('#goal-progress-status')).toHaveClass(/success/);
  await page.getByRole('button', { name: 'Sparziel bearbeiten: Netzwerkziel', exact: true }).click();
  await page.getByLabel('Zielbetrag in Euro bearbeiten').fill('150');
  await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
  await expect(page.locator('#goal-mutation-status')).toHaveClass(/success/);
  await page.getByRole('button', { name: 'Sparziel löschen: Netzwerkziel', exact: true }).click();
  await page.getByRole('button', { name: 'Endgültig löschen', exact: true }).click();
  await expect(page.locator('#goal-mutation-status')).toHaveText('Dein Sparziel wurde gelöscht.');
  await page.reload();
  await expect(page.getByText('Du bist angemeldet. Deine persönlichen Sparziele sind geöffnet.')).toBeVisible();
  await page.getByRole('button', { name: 'Abmelden', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Du wurdest abgemeldet.');
  await Promise.all(headerChecks);
  expect([...new Set(access.map(item => `${item.method} ${item.path}`))].sort()).toEqual([
    'GET /api/v2/access/csrf', 'GET /api/v2/access/me', 'POST /api/v2/access/login',
    'POST /api/v2/access/logout', 'POST /api/v2/access/refresh', 'POST /api/v2/access/registrations'
  ]);
  for (const item of access) {
    if (item.path.endsWith('/me')) expect(item.bearer).toMatch(/^Bearer /);
    else expect(item.bearer).toBeUndefined();
    if (/\/(login|refresh|logout)$/.test(item.path)) {
      expect(item.csrf).toBeTruthy(); expect(item.origin).toBe('https://localhost:4200');
    }
  }
  expect([...finances]).toEqual(expect.arrayContaining(['GET /api/v2/budget', 'PUT /api/v2/budget', 'GET /api/v2/month-summary', 'GET /api/v2/savings-goals']));
  expect([...finances].filter(operation => operation.includes('/api/v2/expenses')).sort()).toEqual([
    `DELETE /api/v2/expenses/${expenseId}`, 'GET /api/v2/expenses', 'POST /api/v2/expenses', `PUT /api/v2/expenses/${expenseId}`
  ]);
  expect([...finances].filter(operation => operation.includes('/api/v2/savings-goals')).sort()).toEqual([
    `DELETE /api/v2/savings-goals/${goalId}`, 'GET /api/v2/savings-goals', 'POST /api/v2/savings-goals',
    `PUT /api/v2/savings-goals/${goalId}`, `PUT /api/v2/savings-goals/${goalId}/progress`
  ]);
  expect([...finances].filter(operation => operation.includes('/api/v1/'))).toEqual([]);
}
