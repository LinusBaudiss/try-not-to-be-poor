import AxeBuilder from '@axe-core/playwright';
import { expect, test, Page, APIRequestContext } from '@playwright/test';

const password = '  Grüner 🦊 im Baum  ';
const endpoint = '**/api/v2/expenses';
async function account(request: APIRequestContext): Promise<string> {
  const email = `expenses-${crypto.randomUUID()}@example.org`;
  expect((await request.post('http://127.0.0.1:8080/api/v2/access/registrations', {
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
  await page.getByRole('link', { name: 'Ausgaben', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ausgaben', exact: true, level: 1 })).toBeVisible();
  if (loaded) await expect(page.getByRole('button', { name: 'Ausgabe speichern', exact: true })).toBeEnabled();
}
async function draft(page: Page, name = 'Brot', amount = '1,15'): Promise<void> {
  await page.getByLabel('Name der Ausgabe').fill(name);
  await page.getByLabel('Ausgabenbetrag in Euro').fill(amount);
}
async function save(page: Page, name: string, amount: string): Promise<void> {
  await draft(page, name, amount);
  await page.getByRole('button', { name: 'Ausgabe speichern', exact: true }).click();
  await expect(page.locator('#expense-status')).toHaveText('Deine Ausgabe wurde gespeichert.');
}
function gate() {
  let release!: () => void;
  return { promise: new Promise<void>(resolve => { release = resolve; }), release: () => release() };
}

test('leerer Zustand, weitere Erfassung und Reload zeigen nur eigene bestätigte Ausgaben mit Kalenderdatum', async ({ page, request }) => {
  const first = await account(request), second = await account(request);
  await login(page, first);
  await expect(page.getByText('Noch keine Ausgaben erfasst.')).toBeVisible();
  await page.getByRole('button', { name: 'Ausgabe erfassen', exact: true }).click();
  await expect(page.getByLabel('Name der Ausgabe')).toBeFocused();
  const response = page.waitForResponse(response => response.url().endsWith('/api/v2/expenses') && response.request().method() === 'POST');
  await save(page, '  Brot 🥖  ', '1.15');
  const entry = await (await response).json();
  expect(entry.name).toBe('Brot 🥖'); expect(entry.amountCents).toBe(115);
  expect(entry.recordedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  await expect(page.locator('.expense-cards')).toContainText('Brot 🥖');
  await expect(page.locator('.expense-cards')).toContainText('1,15 €');
  await expect(page.locator('.expense-cards')).toContainText(entry.recordedOn.split('-').reverse().join('.'));
  await expect(page.getByLabel('Name der Ausgabe')).toHaveValue('');
  await expect(page.getByLabel('Name der Ausgabe')).toBeFocused();
  await save(page, 'Bus', '0,01');
  await page.reload(); await expect(page.locator('.expense-cards li')).toHaveCount(2);
  await login(page, second); await expect(page.getByText('Noch keine Ausgaben erfasst.')).toBeVisible();
  await expect(page.locator('.expense-cards li')).toHaveCount(0);
  await login(page, first); await expect(page.locator('.expense-cards li')).toHaveCount(2);
  expect(await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }))).toEqual({ local: [], session: [] });
});

test('Feldfehler lehnen Null, negative Werte, Nachkommastellen und Überlauf ohne Rundung ab', async ({ page, request }) => {
  await login(page, await account(request));
  let posts = 0;
  page.on('request', request => { if (request.url().endsWith('/api/v2/expenses') && request.method() === 'POST') posts++; });
  await draft(page, '   ', '1');
  await page.getByRole('button', { name: 'Ausgabe speichern', exact: true }).click();
  await expect(page.getByLabel('Name der Ausgabe')).toBeFocused();
  await expect(page.getByLabel('Name der Ausgabe')).toHaveAttribute('aria-describedby', 'expense-name-error');
  for (const invalid of ['', '0', '-1', '1,001', '1.001', '1e2', '1.000,00', '90071992547409,92']) {
    await draft(page, 'Brot', invalid);
    await page.getByRole('button', { name: 'Ausgabe speichern', exact: true }).click();
    await expect(page.getByLabel('Ausgabenbetrag in Euro')).toHaveValue(invalid);
    await expect(page.getByLabel('Ausgabenbetrag in Euro')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByLabel('Ausgabenbetrag in Euro')).toBeFocused();
  }
  expect(posts).toBe(0);
  await save(page, 'Maximum', '90071992547409,91');
  await draft(page, 'Zu viel', '0,01');
  await page.getByRole('button', { name: 'Ausgabe speichern', exact: true }).click();
  await expect(page.locator('#expense-amount-error')).toContainText('Monatssumme');
  await expect(page.getByLabel('Name der Ausgabe')).toHaveValue('Zu viel');
  await expect(page.getByLabel('Ausgabenbetrag in Euro')).toHaveValue('0,01');
  await expect(page.locator('.expense-cards li')).toHaveCount(1);
});

test('laufende Speicherung sperrt Doppelsenden und zeigt Erfolg erst nach Antwort', async ({ page, request }) => {
  await login(page, await account(request));
  const held = gate(), ready = gate(); let posts = 0;
  await page.route(endpoint, async route => {
    if (route.request().method() !== 'POST') return route.continue();
    posts++; const response = await route.fetch(); ready.release(); await held.promise; await route.fulfill({ response });
  });
  await draft(page);
  await page.getByRole('button', { name: 'Ausgabe speichern', exact: true }).click(); await ready.promise;
  await expect(page.getByRole('button', { name: 'Ausgabe wird gespeichert …' })).toBeDisabled();
  await expect(page.getByLabel('Name der Ausgabe')).toHaveAttribute('readonly', '');
  await page.getByLabel('Ausgabenbetrag in Euro').press('Enter');
  expect(posts).toBe(1); await expect(page.locator('.expense-cards li')).toHaveCount(0);
  await expect(page.locator('#expense-status')).toHaveText('Ausgabe wird gespeichert …');
  held.release(); await expect(page.locator('.expense-cards li')).toHaveCount(1);
  await expect(page.locator('#expense-status')).toHaveText('Deine Ausgabe wurde gespeichert.');
});

test('Fehler, Netzabbruch und ungeprüfte Antworten erhalten den Entwurf; offline bleibt Speichern gesperrt', async ({ page, request, context }) => {
  await login(page, await account(request));
  await draft(page, 'Entwurf', '12,34');
  for (const mode of ['server', 'network', 'invalid', 'different-name', 'different-amount', 'wrong-status', 'extra-field']) {
    await page.route(endpoint, async route => {
      if (route.request().method() !== 'POST') return route.continue();
      if (mode === 'network') return route.abort('failed');
      await route.fulfill({ status: mode === 'server' ? 500 : mode === 'wrong-status' ? 200 : 201, contentType: 'application/json', body: mode === 'server' ? '{}' : JSON.stringify({ id: crypto.randomUUID(), name: mode === 'different-name' ? 'Abweichender Name' : 'Entwurf', amountCents: mode === 'different-amount' ? 1235 : 1234, recordedOn: mode === 'invalid' ? '2026-02-30' : '2026-10-23', ...(mode === 'extra-field' ? { unexpected: true } : {}) }) });
    });
    await page.getByRole('button', { name: 'Ausgabe speichern', exact: true }).click();
    await expect(page.locator('#expense-status')).toContainText('nicht bestätigt');
    await expect(page.getByLabel('Name der Ausgabe')).toHaveValue('Entwurf');
    await expect(page.getByLabel('Ausgabenbetrag in Euro')).toHaveValue('12,34');
    await expect(page.locator('.expense-cards li')).toHaveCount(0);
    await expect(page.locator('#expense-status')).toBeFocused();
    await page.unroute(endpoint);
    await expect(page.getByRole('button', { name: 'Ausgabe speichern', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'Historie zur Prüfung laden', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Ich habe die Historie geprüft', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Ich habe die Historie geprüft', exact: true }).press('Enter');
    await expect(page.getByLabel('Name der Ausgabe')).toBeFocused();
  }
  await context.setOffline(true);
  await expect(page.getByRole('button', { name: 'Ausgabe speichern', exact: true })).toBeDisabled();
  await expect(page.locator('app-expenses')).toContainText('Du bist offline.');
  await context.setOffline(false);
  await page.getByRole('button', { name: 'Ausgabe speichern', exact: true }).click();
  await expect(page.locator('#expense-status')).toHaveText('Deine Ausgabe wurde gespeichert.');
});

test('verlorene Antwort nach Commit warnt vor Duplikaten und explizites Aktualisieren findet genau eine Ausgabe', async ({ page, request }) => {
  await login(page, await account(request));
  let posts = 0;
  await page.route(endpoint, async route => {
    if (route.request().method() !== 'POST') return route.continue();
    posts++;
    const committed = await route.fetch(); expect(committed.status()).toBe(201);
    await route.abort('failed');
  });
  await draft(page, 'Bereits gespeichert', '12,34');
  await page.getByRole('button', { name: 'Ausgabe speichern', exact: true }).click();
  await expect(page.locator('#expense-status')).toContainText('nicht bestätigt');
  await expect(page.locator('#expense-status')).toContainText('möglicherweise bereits gespeichert');
  await expect(page.locator('#expense-status')).toContainText('vor erneutem Speichern die Historie');
  await expect(page.locator('#expense-status')).toContainText('Duplikate');
  await expect(page.locator('#expense-status')).not.toHaveClass(/success/);
  await expect(page.locator('.expense-cards li')).toHaveCount(0);
  await expect(page.getByLabel('Name der Ausgabe')).toHaveValue('Bereits gespeichert');
  await expect(page.getByLabel('Ausgabenbetrag in Euro')).toHaveValue('12,34');
  expect(posts).toBe(1);
  await expect(page.getByRole('button', { name: 'Ausgabe speichern', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Ich habe die Historie geprüft', exact: true })).toBeDisabled();
  await page.getByLabel('Ausgabenbetrag in Euro').press('Enter');
  expect(posts).toBe(1);
  await page.getByRole('button', { name: 'Ausgaben aktualisieren', exact: true }).click();
  await expect(page.locator('.expense-cards li')).toHaveCount(1);
  await expect(page.locator('.expense-cards')).toContainText('Bereits gespeichert');
  await expect(page.locator('.expense-cards')).toContainText('12,34 €');
  await expect(page.getByLabel('Name der Ausgabe')).toHaveValue('Bereits gespeichert');
  await expect(page.getByLabel('Ausgabenbetrag in Euro')).toHaveValue('12,34');
  expect(posts).toBe(1);
  await expect(page.getByRole('button', { name: 'Ausgabe speichern', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Ich habe die Historie geprüft', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ausgabe speichern', exact: true })).toBeEnabled();
  expect(posts).toBe(1);
});

test('Laden, Fehler und ungültige Listen zeigen keine persönlichen Werte; Wiederholen lädt die Historie', async ({ page, request }) => {
  const email = await account(request); await login(page, email); await save(page, 'Eigene Historie', '5');
  await page.route(endpoint, async route => {
    if (route.request().method() !== 'GET') return route.continue();
    await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
  });
  await page.reload(); await expect(page.getByRole('button', { name: 'Ausgaben erneut laden' })).toBeVisible();
  await expect(page.getByText('Eigene Historie', { exact: true })).toHaveCount(0);
  await page.unroute(endpoint);
  await page.route(endpoint, async route => {
    if (route.request().method() !== 'GET') return route.continue();
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[{"id":"invalid","name":"Ungeprüft","amountCents":1,"recordedOn":"2026-10-23"}]' });
  });
  await page.getByRole('button', { name: 'Ausgaben erneut laden' }).click();
  await expect(page.getByRole('button', { name: 'Ausgaben erneut laden' })).toBeVisible();
  await expect(page.getByText('Ungeprüft', { exact: true })).toHaveCount(0);
  await page.unroute(endpoint);
  const held = gate(), ready = gate();
  await page.route(endpoint, async route => {
    const response = await route.fetch(); ready.release(); await held.promise; await route.fulfill({ response });
  });
  await page.getByRole('button', { name: 'Ausgaben erneut laden' }).click(); await ready.promise;
  await expect(page.getByText('Deine Ausgaben werden geladen …')).toBeVisible();
  await expect(page.getByText('Eigene Historie', { exact: true })).toHaveCount(0);
  held.release(); await expect(page.locator('.expense-cards')).toContainText('Eigene Historie');
});

test('verspätete Historie nach Abmeldung wird verworfen und alter Arbeitsspeicher geleert', async ({ page, request }) => {
  await login(page, await account(request)); await save(page, 'Vorher', '1');
  await page.evaluate(() => { (window as any).closedExpenses = (window as any).ng.getComponent(document.querySelector('app-expenses')); });
  const held = gate(), ready = gate();
  await page.route(endpoint, async route => {
    const response = await route.fetch(); ready.release(); await held.promise; await route.fulfill({ response });
  });
  await page.getByRole('button', { name: 'Ausgaben aktualisieren', exact: true }).click(); await ready.promise;
  await page.getByRole('button', { name: 'Abmelden', exact: true }).click(); await expect(page).toHaveURL('/anmelden');
  const answered = page.waitForResponse(response => response.url().endsWith('/api/v2/expenses'));
  held.release(); await answered;
  await expect(page.locator('app-expenses')).toHaveCount(0);
  expect(await page.evaluate(() => { const old = (window as any).closedExpenses; return { items: old.items(), name: old.name, amount: old.amount, loaded: old.loaded() }; }))
    .toEqual({ items: [], name: '', amount: '', loaded: false });
});

test('verspätete Speicherung nach Kontowechsel erscheint niemals im neuen Konto', async ({ page, context, request }) => {
  const first = await account(request), second = await account(request);
  await login(page, first);
  const held = gate(), ready = gate();
  await page.route(endpoint, async route => {
    if (route.request().method() !== 'POST') return route.continue();
    const response = await route.fetch(); ready.release(); await held.promise; await route.fulfill({ response });
  });
  await draft(page, 'Altes Konto', '4,56');
  await page.evaluate(() => { (window as any).closedExpenses = (window as any).ng.getComponent(document.querySelector('app-expenses')); });
  await page.getByRole('button', { name: 'Ausgabe speichern', exact: true }).click(); await ready.promise;
  const other = await context.newPage(); await login(other, second);
  await expect(page).toHaveURL('/anmelden');
  const answered = page.waitForResponse(response => response.url().endsWith('/api/v2/expenses') && response.request().method() === 'POST');
  held.release(); await answered;
  await expect(other.getByText('Noch keine Ausgaben erfasst.')).toBeVisible();
  await expect(other.getByLabel('Name der Ausgabe')).toHaveValue('');
  expect(await page.evaluate(() => { const old = (window as any).closedExpenses; return { items: old.items(), name: old.name, amount: old.amount }; }))
    .toEqual({ items: [], name: '', amount: '' });
  await page.unroute(endpoint); await login(other, first);
  await expect(other.locator('.expense-cards')).toContainText('Altes Konto');
});

test('Tokenablauf während einer Speicherung verwirft Entwurf und verspätete Antwort', async ({ page, request }) => {
  await page.clock.install(); await login(page, await account(request));
  const held = gate(), ready = gate();
  await page.route(endpoint, async route => {
    if (route.request().method() !== 'POST') return route.continue();
    const response = await route.fetch(); ready.release(); await held.promise; await route.fulfill({ response });
  });
  const refreshHeld = gate(), refreshReady = gate();
  await page.route('**/api/v2/access/refresh', async route => {
    const response = await route.fetch(); refreshReady.release(); await refreshHeld.promise; await route.fulfill({ response });
  });
  await page.clock.fastForward(570_001); await refreshReady.promise;
  await page.clock.fastForward(28_000);
  await draft(page, 'Verwerfen', '9,99');
  await page.evaluate(() => { (window as any).closedExpenses = (window as any).ng.getComponent(document.querySelector('app-expenses')); });
  await page.getByRole('button', { name: 'Ausgabe speichern', exact: true }).click(); await ready.promise;
  await page.clock.fastForward(3_000); await expect(page).toHaveURL('/anmelden');
  await expect(page.locator('#feedback')).toContainText('abgelaufen');
  const answered = page.waitForResponse(response => response.url().endsWith('/api/v2/expenses') && response.request().method() === 'POST');
  held.release(); await answered;
  const revoked = page.waitForResponse('**/api/v2/access/logout');
  refreshHeld.release(); expect((await revoked).status()).toBe(204);
  await expect(page.locator('app-expenses')).toHaveCount(0);
  expect(await page.evaluate(() => { const old = (window as any).closedExpenses; return { items: old.items(), name: old.name, amount: old.amount }; }))
    .toEqual({ items: [], name: '', amount: '' });
});

test('Tastatur, 200-Prozent-Text und axe bestehen mobil mit Labels und am Desktop als Tabelle', async ({ page, request }) => {
  await login(page, await account(request));
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByLabel('Name der Ausgabe').focus(); await page.keyboard.press('Tab');
  await expect(page.getByLabel('Ausgabenbetrag in Euro')).toBeFocused(); await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Ausgabe speichern', exact: true })).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page.getByLabel('Name der Ausgabe')).toBeFocused();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await save(page, 'SehrLangerName'.repeat(15), '90071992547409,91');
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: ({ 320: 568, 390: 844, 768: 1024, 1280: 800 } as Record<number, number>)[width] });
    for (const size of ['100%', '200%']) {
      await page.evaluate(value => { document.documentElement.style.fontSize = value; }, size);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      for (const label of await page.locator('label').all()) {
        expect(await label.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
      }
      const history = width < 1024 ? page.locator('.expense-cards') : page.getByRole('table', { name: 'Alle Ausgaben' });
      await expect(history).toBeVisible(); await expect(history).toContainText('90.071.992.547.409,91 €');
      expect(await history.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
      for (const input of await page.locator('app-expenses input').all()) expect((await input.boundingBox())!.height).toBeGreaterThanOrEqual(48);
      for (const button of await page.getByRole('button').all()) {
        const bounds = (await button.boundingBox())!; expect(bounds.height).toBeGreaterThanOrEqual(44); expect(bounds.width).toBeGreaterThanOrEqual(44);
      }
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    }
  }
});

test('Historie behält Kalenderdaten unabhängig von der Browserzeitzone und zeigt mehrere Monate', async ({ browser, request }) => {
  const context = await browser.newContext({ baseURL: 'https://localhost:4200', ignoreHTTPSErrors: true, timezoneId: 'America/Los_Angeles', viewport: { width: 320, height: 568 } });
  try {
    const page = await context.newPage();
    await page.route(endpoint, async route => {
      await route.fulfill({ status: 200, json: [
        { id: '00000000-0000-4000-8000-000000000001', name: 'Sommer', amountCents: 115, recordedOn: '2026-03-29' },
        { id: '00000000-0000-4000-8000-000000000002', name: 'Winter', amountCents: 123456, recordedOn: '2026-10-25' }
      ] });
    });
    await login(page, await account(request));
    const rows = page.locator('.expense-cards li');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText('Winter'); await expect(rows.nth(0)).toContainText('25.10.2026');
    await expect(rows.nth(0)).toContainText('1.234,56 €');
    await expect(rows.nth(1)).toContainText('Sommer'); await expect(rows.nth(1)).toContainText('29.03.2026');
  } finally { await context.close(); }
});

test('vor bestätigter Identität werden weder Ausgaben angefordert noch Formularwerte angezeigt', async ({ page, request }) => {
  const held = gate(), ready = gate(); let reads = 0;
  await page.route('**/api/v2/access/me', async route => {
    const response = await route.fetch(); ready.release(); await held.promise; await route.fulfill({ response });
  });
  await page.route(endpoint, async route => { reads++; await route.continue(); });
  await login(page, await account(request), false); await ready.promise;
  expect(reads).toBe(0); await expect(page.locator('app-expenses')).toHaveCount(0);
  held.release(); await expect(page.getByRole('button', { name: 'Ausgabe speichern', exact: true })).toBeEnabled();
  expect(reads).toBe(1);
});

test('späte Historie der verlassenen Ausgabenansicht überschreibt nach Rückkehr keine neuen Werte', async ({ page, request }) => {
  await login(page, await account(request));
  await page.evaluate(() => { (window as any).leftExpenses = (window as any).ng.getComponent(document.querySelector('app-expenses')); });
  const held = gate(), ready = gate(); let reads = 0;
  await page.route(endpoint, async route => {
    const stale = ++reads === 1;
    if (stale) { ready.release(); await held.promise; }
    await route.fulfill({ json: [{ id: '00000000-0000-4000-8000-000000000001', name: stale ? 'Alter Stand' : 'Frischer Stand', amountCents: 100, recordedOn: '2026-10-23' }] });
  });
  await page.getByRole('button', { name: 'Ausgaben aktualisieren', exact: true }).click(); await ready.promise;
  await page.getByRole('link', { name: 'Monat', exact: true }).click();
  await expect(page.getByLabel('Monatsbudget in Euro')).toBeVisible();
  await page.goBack(); await expect(page.locator('.expense-cards')).toContainText('Frischer Stand');
  const answered = page.waitForResponse(response => response.url().endsWith('/api/v2/expenses'));
  held.release(); await answered;
  await expect(page.locator('.expense-cards')).toContainText('Frischer Stand');
  await expect(page.getByText('Alter Stand', { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).leftExpenses.items())).toEqual([]);
});

for (const method of ['POST', 'PUT', 'DELETE']) {
  test(`Navigation erhält die ${method}-Sperre bis Abschluss und ausdrücklicher Prüfung, ohne Formulardaten zu behalten`, async ({ page, request }) => {
    await login(page, await account(request));
    if (method !== 'POST') await save(page, 'Ausgang', '1');
    const held = gate(), ready = gate();
    await page.route('**/api/v2/expenses{,/*}', async route => {
      if (route.request().method() !== method) return route.continue();
      const response = await route.fetch(); ready.release(); await held.promise; await route.fulfill({ response });
    });
    if (method === 'POST') { await draft(page, 'Verlassener Entwurf', '2'); await page.getByRole('button', { name: 'Ausgabe speichern', exact: true }).click(); }
    else if (method === 'PUT') {
      await page.getByRole('button', { name: 'Ausgang bearbeiten', exact: true }).click();
      await page.getByLabel('Name bearbeiten', { exact: true }).fill('Geändert');
      await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
    } else {
      await page.getByRole('button', { name: 'Ausgang löschen', exact: true }).click();
      await page.getByRole('button', { name: 'Endgültig löschen', exact: true }).click();
    }
    await ready.promise;
    await page.goBack();
    await expect(page.getByRole('heading', { name: 'Monat', exact: true })).toBeVisible();
    await page.goForward();
    await expect(page.locator('.expense-uncertainty')).toBeVisible();
    await expect(page.getByLabel('Name der Ausgabe')).toHaveValue('');
    await expect(page.getByLabel('Ausgabenbetrag in Euro')).toHaveValue('');
    await expect(page.locator('.expense-editor')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Ausgabe speichern', exact: true })).toBeDisabled();
    const reload = page.getByRole('button', { name: 'Historie zur Prüfung laden', exact: true });
    await expect(reload).toBeDisabled();
    const answered = page.waitForResponse(response => response.request().method() === method && response.url().includes('/api/v2/expenses'));
    held.release(); await answered;
    await expect(reload).toBeEnabled();
    await expect(page.locator('#expense-status')).not.toHaveClass(/success/);
    await expect(page.getByRole('button', { name: 'Ich habe die Historie geprüft', exact: true })).toBeDisabled();
    await reload.click();
    await expect(page.locator('.expense-cards li')).toHaveCount(method === 'DELETE' ? 0 : 1);
    await expect(page.getByRole('button', { name: 'Ausgabe speichern', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Ich habe die Historie geprüft', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Ich habe die Historie geprüft', exact: true }).press('Enter');
    await expect(page.getByLabel('Name der Ausgabe')).toBeFocused();
    await expect(page.getByRole('button', { name: 'Ausgabe speichern', exact: true })).toBeEnabled();
  });
}

test('unbestätigte Speicherung bleibt nach Rückkehr gesperrt; 206 und zusätzliche GET-Felder erlauben keine Prüfung', async ({ page, request }) => {
  await login(page, await account(request)); await save(page, 'Bestand', '1');
  await page.route(endpoint, route => route.request().method() === 'POST' ? route.abort('failed') : route.continue());
  await draft(page, 'Erhaltener Entwurf', '2,34');
  await page.getByRole('button', { name: 'Ausgabe speichern', exact: true }).click();
  await expect(page.locator('#expense-status')).toContainText('nicht bestätigt');
  await page.unroute(endpoint);
  const fixture = { id: crypto.randomUUID(), name: 'Ungeprüft', amountCents: 123, recordedOn: '2026-10-23' };
  for (const mode of ['partial', 'extra-field']) {
    await page.route(endpoint, route => route.fulfill({ status: mode === 'partial' ? 206 : 200, json: [{ ...fixture, ...(mode === 'extra-field' ? { unexpected: true } : {}) }] }));
    const reload = page.getByRole('button', { name: 'Historie zur Prüfung laden', exact: true });
    await reload.click(); await expect(page.getByRole('button', { name: 'Ausgaben erneut laden', exact: true })).toBeVisible();
    await expect(reload).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Ich habe die Historie geprüft', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Ausgabe speichern', exact: true })).toBeDisabled();
    await expect(page.getByLabel('Name der Ausgabe')).toHaveValue('Erhaltener Entwurf');
    await expect(page.getByLabel('Ausgabenbetrag in Euro')).toHaveValue('2,34');
    await expect(page.locator('#expense-status')).toContainText('nicht bestätigt');
    await expect(page.getByText('Ungeprüft', { exact: true })).toHaveCount(0);
    await page.unroute(endpoint);
  }
  await page.getByRole('link', { name: 'Monat', exact: true }).click(); await page.goBack();
  await expect(page.locator('.expense-cards')).toContainText('Bestand');
  await expect(page.getByLabel('Name der Ausgabe')).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Ausgabe speichern', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Bestand löschen', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Ich habe die Historie geprüft', exact: true }).press('Enter');
  await expect(page.getByLabel('Name der Ausgabe')).toBeFocused();
  await expect(page.getByRole('button', { name: 'Ausgabe speichern', exact: true })).toBeEnabled();
});

for (const outcome of ['pending', 'unconfirmed']) {
  test(`Sitzungsende verwirft die ${outcome}-Sperre; eine alte Antwort sperrt die neue Sitzung nicht`, async ({ page, request }) => {
    const first = await account(request), second = await account(request);
    await login(page, first);
    const held = gate(), ready = gate();
    await page.route(endpoint, async route => {
      if (route.request().method() !== 'POST') return route.continue();
      const response = await route.fetch(); ready.release();
      if (outcome === 'pending') { await held.promise; await route.fulfill({ response }); }
      else await route.abort('failed');
    });
    await draft(page, 'Alte Sitzung', '1');
    await page.getByRole('button', { name: 'Ausgabe speichern', exact: true }).click(); await ready.promise;
    if (outcome === 'unconfirmed') await expect(page.locator('#expense-status')).toContainText('nicht bestätigt');
    await page.getByRole('link', { name: 'Monat', exact: true }).click();
    await page.getByRole('button', { name: 'Abmelden', exact: true }).click(); await expect(page).toHaveURL('/anmelden');
    await page.getByLabel('E-Mail-Adresse', { exact: true }).fill(second);
    await page.getByLabel('Passwort', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Monat', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Ausgaben', exact: true }).click();
    await expect(page.locator('.expense-uncertainty')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Ausgabe speichern', exact: true })).toBeEnabled();
    if (outcome === 'pending') {
      const answered = page.waitForResponse(response => response.request().method() === 'POST' && response.url().endsWith('/api/v2/expenses'));
      held.release(); await answered;
    }
    await expect(page.locator('.expense-uncertainty')).toHaveCount(0);
    await expect(page.getByText('Noch keine Ausgaben erfasst.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ausgabe speichern', exact: true })).toBeEnabled();
  });
}
