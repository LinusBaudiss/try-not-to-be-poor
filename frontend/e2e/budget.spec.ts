import AxeBuilder from '@axe-core/playwright';
import { expect, test, Page, APIRequestContext } from '@playwright/test';

const password = '  Grüner 🦊 im Baum  ';
const endpoint = '**/api/v1/expense-budget/budget';
async function account(request: APIRequestContext): Promise<string> {
  const email = `budget-${crypto.randomUUID()}@example.org`;
  expect((await request.post('http://127.0.0.1:8080/api/v1/access/registrations', {
    data: { registrationToken: 'a'.repeat(43), email, password }
  })).status()).toBe(201);
  return email;
}
async function login(page: Page, email: string, loaded = true): Promise<void> {
  await page.goto('/anmelden');
  await page.getByLabel('E-Mail-Adresse', { exact: true }).fill(email);
  await page.getByLabel('Passwort', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Monat', exact: true })).toBeVisible();
  if (loaded) await expect(page.getByLabel('Monatsbudget in Euro')).toBeVisible();
}
async function save(page: Page, input: string, output: string): Promise<void> {
  await page.getByLabel('Monatsbudget in Euro').fill(input);
  await page.getByRole('button', { name: 'Budget speichern', exact: true }).click();
  await expect(page.locator('#budget-status')).toHaveText('Dein Monatsbudget wurde gespeichert.');
  await expect(page.locator('.money')).toHaveText(output);
}

test('fehlendes Budget, Null, Komma/Punkt und sichere Centgrenzen bleiben nach Reload exakt', async ({ page, request }) => {
  await login(page, await account(request));
  await expect(page.getByText('Noch kein Monatsbudget festgelegt. Lege deinen fortlaufenden Betrag fest.')).toBeVisible();
  await expect(page.locator('.money')).toHaveCount(0);
  await save(page, '0', '0,00 €');
  await page.reload();
  await expect(page.locator('.money')).toHaveText('0,00 €');
  await expect(page.getByLabel('Monatsbudget in Euro')).toHaveValue('0,00');
  await save(page, '1234.56', '1.234,56 €');
  await save(page, '0,01', '0,01 €');
  await save(page, '1,15', '1,15 €');
  const outgoing = page.waitForRequest(request => request.url().endsWith('/expense-budget/budget') && request.method() === 'PUT');
  await save(page, '90071992547409,91', '90.071.992.547.409,91 €');
  expect((await outgoing).postDataJSON()).toEqual({ amountCents: 9007199254740991 });
  await page.reload();
  await expect(page.locator('.money')).toHaveText('90.071.992.547.409,91 €');
  await expect(page.getByLabel('Monatsbudget in Euro')).toHaveValue('90071992547409,91');
  await save(page, '90071992547409,90', '90.071.992.547.409,90 €');
  expect(await page.evaluate(async () => ({
    local: localStorage.length, session: sessionStorage.length, databases: await indexedDB.databases(), caches: await caches.keys()
  }))).toEqual({ local: 0, session: 0, databases: [], caches: [] });
});

test('Bearbeiten des Entwurfs entfernt alten Erfolg und überholte Feldfehler', async ({ page, request }) => {
  await login(page, await account(request));
  await save(page, '100', '100,00 €');
  await page.getByLabel('Monatsbudget in Euro').fill('200');
  await expect(page.locator('#budget-status')).toBeEmpty();
  await expect(page.locator('#budget-status')).not.toHaveClass(/success/);
  await expect(page.locator('.money')).toHaveText('100,00 €');
  await page.getByLabel('Monatsbudget in Euro').fill('-1');
  await page.getByRole('button', { name: 'Budget speichern', exact: true }).click();
  await expect(page.locator('#budget-error')).toBeVisible();
  await page.getByLabel('Monatsbudget in Euro').fill('12,34');
  await expect(page.locator('#budget-error')).toHaveCount(0);
  await expect(page.getByLabel('Monatsbudget in Euro')).toHaveAttribute('aria-invalid', 'false');
  await expect(page.getByLabel('Monatsbudget in Euro')).toHaveAttribute('aria-describedby', 'budget-hint');
  await expect(page.locator('#budget-status')).toBeEmpty();
  await expect(page.locator('#budget-status')).not.toHaveClass(/error/);
});

test('Identitätsfehler wird live gemeldet und gehaltene Zugangsprüfung bleibt ein einziger Vorgang', async ({ page, request }) => {
  let identities = 0, budgets = 0;
  let releaseIdentity!: () => void, identityReady!: () => void, releaseBudget!: () => void, budgetReady!: () => void;
  const heldIdentity = new Promise<void>(resolve => { releaseIdentity = resolve; });
  const identitySent = new Promise<void>(resolve => { identityReady = resolve; });
  const heldBudget = new Promise<void>(resolve => { releaseBudget = resolve; });
  const budgetSent = new Promise<void>(resolve => { budgetReady = resolve; });
  await page.route('**/api/v1/access/me', async route => {
    if (++identities === 1) return route.fulfill({ status: 500, json: { code: 'SESSION_UNAVAILABLE', message: 'Nicht bestätigt' } });
    const response = await route.fetch(); identityReady(); await heldIdentity; await route.fulfill({ response });
  });
  await page.route(endpoint, async route => {
    budgets++; const response = await route.fetch(); budgetReady(); await heldBudget; await route.fulfill({ response });
  });
  await login(page, await account(request), false);
  const identityStatus = page.locator('#identity-status');
  await expect(identityStatus).toHaveAttribute('role', 'status');
  await expect(identityStatus).toHaveAttribute('aria-live', 'polite');
  await expect(identityStatus).toHaveText('Der Zugang konnte nicht geprüft werden.');
  await expect(page.getByLabel('Monatsbudget in Euro')).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const retry = page.getByRole('button', { name: 'Zugang erneut prüfen' });
  await expect(retry).toBeEnabled(); await retry.click(); await identitySent;
  await expect(retry).toBeDisabled();
  await retry.dispatchEvent('click'); await retry.dispatchEvent('click');
  expect(identities).toBe(2);
  releaseIdentity(); await budgetSent;
  await page.evaluate(() => {
    const month = (window as any).ng.getComponent(document.querySelector('app-month'));
    void month.open(); void month.open();
  });
  releaseBudget();
  await expect(page.getByLabel('Monatsbudget in Euro')).toBeVisible();
  await page.getByLabel('Monatsbudget in Euro').fill('12,34');
  await page.waitForLoadState('networkidle');
  expect(identities).toBe(2); expect(budgets).toBe(1);
  await expect(page.getByLabel('Monatsbudget in Euro')).toHaveValue('12,34');
  await expect(identityStatus).toHaveText('Du bist angemeldet. Deine persönliche Monatsübersicht ist geöffnet.');
});

test('eingefügter Betrag mit vielen führenden Nullen wird vollständig geprüft und gespeichert', async ({ page, request }) => {
  await login(page, await account(request));
  const fullValue = '0'.repeat(32) + '1';
  const input = page.getByLabel('Monatsbudget in Euro');
  await input.focus(); await page.keyboard.insertText(fullValue);
  await expect(input).toHaveValue(fullValue);
  const outgoing = page.waitForRequest(request => request.url().endsWith('/expense-budget/budget') && request.method() === 'PUT');
  await page.getByRole('button', { name: 'Budget speichern', exact: true }).click();
  expect((await outgoing).postDataJSON()).toEqual({ amountCents: 100 });
  await expect(page.locator('#budget-status')).toHaveText('Dein Monatsbudget wurde gespeichert.');
  await expect(page.locator('.money')).toHaveText('1,00 €');
});

test('ungültige Euroeingaben werden vor HTTP abgelehnt, zugeordnet und fokussiert', async ({ page, request }) => {
  await login(page, await account(request));
  await save(page, '1200,50', '1.200,50 €');
  let sends = 0;
  page.on('request', request => { if (request.url().endsWith('/expense-budget/budget') && request.method() === 'PUT') sends++; });
  for (const invalid of ['', '-1', '1,001', '1.001', '1.000,00', '1,000.00', '1e2', '1 00', 'NaN', '90071992547409,92']) {
    await page.getByLabel('Monatsbudget in Euro').fill(invalid);
    await page.getByRole('button', { name: 'Budget speichern', exact: true }).click();
    await expect(page.getByLabel('Monatsbudget in Euro')).toBeFocused();
    await expect(page.getByLabel('Monatsbudget in Euro')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByLabel('Monatsbudget in Euro')).toHaveAttribute('aria-describedby', 'budget-hint budget-error');
    await expect(page.locator('#budget-error')).toContainText('höchstens zwei Nachkommastellen');
    await expect(page.locator('.money')).toHaveText('1.200,50 €');
  }
  expect(sends).toBe(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('API-Feldfehler erhalten Entwurf und Bestand und setzen den Fehlerfokus', async ({ page, request }) => {
  await login(page, await account(request));
  await save(page, '12', '12,00 €');
  await page.route(endpoint, async route => route.request().method() === 'PUT'
    ? route.fulfill({ status: 400, json: { code: 'VALIDATION_FAILED', message: 'Prüfe den Betrag.', fieldErrors: { amountCents: 'Ungültig' } } })
    : route.continue());
  await page.getByLabel('Monatsbudget in Euro').fill('15,01');
  await page.getByRole('button', { name: 'Budget speichern', exact: true }).click();
  await expect(page.getByLabel('Monatsbudget in Euro')).toBeFocused();
  await expect(page.getByLabel('Monatsbudget in Euro')).toHaveValue('15,01');
  await expect(page.locator('.money')).toHaveText('12,00 €');
  await expect(page.locator('#budget-status')).toHaveText('Prüfe den Budgetbetrag.');
});

test('Ladefehler täuscht kein Nullbudget vor und lässt sich wiederholen', async ({ page, request }) => {
  await page.route(endpoint, route => route.fulfill({ status: 500, json: { code: 'BUDGET_UNAVAILABLE', message: 'Nicht bestätigt', fieldErrors: {} } }));
  await login(page, await account(request), false);
  await expect(page.locator('#budget-status')).toHaveText('Budget nicht geladen. Versuche es erneut.');
  await expect(page.locator('.money')).toHaveCount(0);
  await expect(page.getByText('Noch kein Monatsbudget festgelegt. Lege deinen fortlaufenden Betrag fest.')).toHaveCount(0);
  await expect(page.getByLabel('Monatsbudget in Euro')).toHaveCount(0);
  await page.unroute(endpoint);
  await page.getByRole('button', { name: 'Budget erneut laden' }).click();
  await expect(page.getByLabel('Monatsbudget in Euro')).toHaveValue('');
  await expect(page.getByText('Noch kein Monatsbudget festgelegt. Lege deinen fortlaufenden Betrag fest.')).toBeVisible();
});

test('gehaltene Antwort sperrt Doppelsenden und bestätigt erst nach der Serverantwort', async ({ page, request }) => {
  await login(page, await account(request));
  await save(page, '100', '100,00 €');
  let release!: () => void, committed!: () => void, sends = 0;
  const held = new Promise<void>(resolve => { release = resolve; });
  const ready = new Promise<void>(resolve => { committed = resolve; });
  await page.route(endpoint, async route => {
    if (route.request().method() !== 'PUT') return route.continue();
    sends++;
    const response = await route.fetch(); committed(); await held; await route.fulfill({ response });
  });
  await page.getByLabel('Monatsbudget in Euro').fill('250,25');
  await page.getByRole('button', { name: 'Budget speichern', exact: true }).click(); await ready;
  await expect(page.getByRole('button', { name: 'Budget wird gespeichert …' })).toBeDisabled();
  await expect(page.getByLabel('Monatsbudget in Euro')).toHaveAttribute('readonly', '');
  await expect(page.locator('.money')).toHaveText('100,00 €');
  await expect(page.locator('#budget-status')).toHaveText('Budget wird gespeichert …');
  await page.getByLabel('Monatsbudget in Euro').press('Enter');
  expect(sends).toBe(1);
  release();
  await expect(page.locator('.money')).toHaveText('250,25 €');
  await expect(page.locator('#budget-status')).toHaveText('Dein Monatsbudget wurde gespeichert.');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('verlorene Antwort, Serverfehler und Offline erhalten den Entwurf für bewussten Retry', async ({ page, context, request }) => {
  await login(page, await account(request));
  await save(page, '100', '100,00 €');
  let sends = 0;
  await page.route(endpoint, async route => {
    if (route.request().method() !== 'PUT') return route.continue();
    sends++;
    await route.fetch(); await route.abort('failed');
  });
  await page.getByLabel('Monatsbudget in Euro').fill('345,67');
  await page.getByRole('button', { name: 'Budget speichern', exact: true }).click();
  await expect(page.locator('#budget-status')).toContainText('nicht bestätigt');
  await expect(page.locator('#budget-status')).toBeFocused();
  await expect(page.getByLabel('Monatsbudget in Euro')).toHaveValue('345,67');
  await expect(page.locator('.money')).toHaveText('100,00 €');
  expect(sends).toBe(1);
  await context.setOffline(true);
  await expect(page.getByRole('button', { name: 'Budget speichern', exact: true })).toBeDisabled();
  await expect(page.locator('form').filter({ has: page.getByLabel('Monatsbudget in Euro') })
    .getByText('Du bist offline.', { exact: false })).toBeVisible();
  await page.getByLabel('Monatsbudget in Euro').press('Enter');
  expect(sends).toBe(1);
  await context.setOffline(false); await page.unroute(endpoint);
  await page.route(endpoint, async route => route.request().method() === 'PUT'
    ? route.fulfill({ status: 500, json: { code: 'BUDGET_UNAVAILABLE', message: 'Nicht bestätigt', fieldErrors: {} } }) : route.continue());
  await page.getByRole('button', { name: 'Budget speichern', exact: true }).click();
  await expect(page.locator('#budget-status')).toContainText('nicht bestätigt');
  await expect(page.getByLabel('Monatsbudget in Euro')).toHaveValue('345,67');
  await page.unroute(endpoint);
  await page.getByRole('button', { name: 'Budget speichern', exact: true }).click();
  await expect(page.locator('.money')).toHaveText('345,67 €');
  await expect(page.locator('#budget-status')).toHaveText('Dein Monatsbudget wurde gespeichert.');
  await page.reload(); await expect(page.locator('.money')).toHaveText('345,67 €');
});

for (const method of ['GET', 'PUT']) {
  test(`Abmeldung verwirft Werte und Entwurf auch bei später ${method}-Antwort`, async ({ page, request }) => {
    const email = await account(request);
    if (method === 'PUT') await login(page, email);
    let release!: () => void, committed!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    const ready = new Promise<void>(resolve => { committed = resolve; });
    await page.route(endpoint, async route => {
      if (route.request().method() !== method) return route.continue();
      const response = await route.fetch(); committed(); await held; await route.fulfill({ response });
    });
    if (method === 'GET') await login(page, email, false);
    await page.evaluate(() => { (window as any).closedMonth = (window as any).ng.getComponent(document.querySelector('app-month')); });
    if (method === 'PUT') {
      await page.getByLabel('Monatsbudget in Euro').fill('987,65');
      await page.getByRole('button', { name: 'Budget speichern', exact: true }).click();
    }
    await ready;
    const logout = page.waitForResponse('**/api/v1/access/logout');
    await page.getByRole('button', { name: 'Abmelden', exact: true }).click();
    expect((await logout).status()).toBe(204);
    await expect(page).toHaveURL('/anmelden');
    const answered = page.waitForResponse(response => response.url().endsWith('/expense-budget/budget') && response.request().method() === method);
    release(); await answered;
    await expect.poll(() => page.evaluate(() => {
      const old = (window as any).closedMonth;
      return { amount: old.amountCents(), draft: old.draft, loaded: old.loaded() };
    })).toEqual({ amount: null, draft: '', loaded: false });
    await expect(page.getByLabel('Monatsbudget in Euro')).toHaveCount(0);
  });
}

test('Kontowechsel übernimmt eine spät bestätigte Budgetmutation nicht in das neue Konto', async ({ page, context, request }) => {
  const first = await account(request), second = await account(request);
  await login(page, first); await save(page, '123,45', '123,45 €');
  let release!: () => void, committed!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  const ready = new Promise<void>(resolve => { committed = resolve; });
  await page.route(endpoint, async route => {
    if (route.request().method() !== 'PUT') return route.continue();
    const response = await route.fetch(); committed(); await held; await route.fulfill({ response });
  });
  await page.getByLabel('Monatsbudget in Euro').fill('876,54');
  await page.getByRole('button', { name: 'Budget speichern', exact: true }).click(); await ready;
  const other = await context.newPage();
  await login(other, second);
  await expect(page).toHaveURL('/anmelden');
  const answered = page.waitForResponse(response => response.url().endsWith('/expense-budget/budget') && response.request().method() === 'PUT');
  release(); await answered;
  await expect(other.getByText('Noch kein Monatsbudget festgelegt. Lege deinen fortlaufenden Betrag fest.')).toBeVisible();
  await expect(other.getByLabel('Monatsbudget in Euro')).toHaveValue('');
  await expect(other.locator('.money')).toHaveCount(0);
  await expect(page.getByLabel('Monatsbudget in Euro')).toHaveCount(0);
  await page.unroute(endpoint); await save(other, '55', '55,00 €');
  await login(other, first); await expect(other.locator('.money')).toHaveText('876,54 €');
});

test('fehlgeschlagene Sitzungsverlängerung verwirft den Budgetentwurf und eine ausstehende Mutation', async ({ page, request }) => {
  await page.clock.install(); await login(page, await account(request));
  let release!: () => void, committed!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  const ready = new Promise<void>(resolve => { committed = resolve; });
  await page.route(endpoint, async route => {
    if (route.request().method() !== 'PUT') return route.continue();
    const response = await route.fetch(); committed(); await held; await route.fulfill({ response });
  });
  await page.route('**/api/v1/access/refresh', async route => { await route.abort('failed'); });
  await page.getByLabel('Monatsbudget in Euro').fill('987,65');
  await page.getByRole('button', { name: 'Budget speichern', exact: true }).click(); await ready;
  await page.clock.fastForward(570_001);
  await expect(page).toHaveURL('/anmelden');
  release();
  await expect(page.getByRole('heading', { name: 'Monat', exact: true })).toHaveCount(0);
  await expect(page.locator('#feedback')).toContainText('nicht verlängert');
});

test('Tokenablauf verwirft gespeicherten Betrag und Entwurf trotz verspäteter Erneuerung', async ({ page, request }) => {
  await page.clock.install(); await login(page, await account(request));
  await save(page, '123,45', '123,45 €');
  await page.getByLabel('Monatsbudget in Euro').fill('987,65');
  await page.evaluate(() => { (window as any).closedMonth = (window as any).ng.getComponent(document.querySelector('app-month')); });
  let release!: () => void, committed!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  const ready = new Promise<void>(resolve => { committed = resolve; });
  await page.route('**/api/v1/access/refresh', async route => {
    const response = await route.fetch(); committed(); await held; await route.fulfill({ response });
  });
  await page.clock.fastForward(570_001); await ready;
  await page.clock.fastForward(30_000);
  await expect(page).toHaveURL('/anmelden');
  await expect(page.locator('#feedback')).toContainText('abgelaufen');
  const revoked = page.waitForResponse('**/api/v1/access/logout');
  release(); expect((await revoked).status()).toBe(204);
  expect(await page.evaluate(() => {
    const old = (window as any).closedMonth;
    return { amount: old.amountCents(), draft: old.draft, loaded: old.loaded() };
  })).toEqual({ amount: null, draft: '', loaded: false });
  await expect(page.getByLabel('Monatsbudget in Euro')).toHaveCount(0);
});

test('320 Pixel, Tastatur, 200-Prozent-Text, Geldgrenzen und axe in Formular-/Fehler-/Erfolgszuständen', async ({ page, request }) => {
  await login(page, await account(request));
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByLabel('Monatsbudget in Euro').focus();
  await page.keyboard.press('Tab'); await expect(page.getByRole('button', { name: 'Budget speichern', exact: true })).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page.getByLabel('Monatsbudget in Euro')).toBeFocused();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await save(page, '90071992547409,91', '90.071.992.547.409,91 €');
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 568 });
    for (const size of ['100%', '200%']) {
      await page.evaluate(value => { document.documentElement.style.fontSize = value; }, size);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      for (const label of await page.locator('label').all()) {
        expect(await label.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
      }
      await expect(page.locator('.money')).toHaveText('90.071.992.547.409,91 €');
      expect(await page.locator('.money').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
      const input = await page.getByLabel('Monatsbudget in Euro').boundingBox();
      expect(input!.height).toBeGreaterThanOrEqual(48);
      for (const button of await page.getByRole('button').all()) {
        const bounds = await button.boundingBox(); expect(bounds!.height).toBeGreaterThanOrEqual(44); expect(bounds!.width).toBeGreaterThanOrEqual(44);
      }
    }
  }
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
