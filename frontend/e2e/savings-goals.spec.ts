import AxeBuilder from '@axe-core/playwright';
import { expect, test, Page, APIRequestContext } from '@playwright/test';

const password = '  Grüner 🦊 im Baum  ';
const endpoint = '**/api/v1/savings-goals';
async function account(request: APIRequestContext): Promise<string> {
  const email = `goals-${crypto.randomUUID()}@example.org`;
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
  await expect(page).toHaveTitle('Monat – Try Not to Be Poor');
  await expect(page.getByRole('link', { name: 'Monat', exact: true })).toHaveAttribute('aria-current', 'page');
  await page.getByRole('link', { name: 'Sparziele', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Sparziele', exact: true })).toBeVisible();
  await expect(page).toHaveTitle('Sparziele – Try Not to Be Poor');
  await expect(page.getByRole('link', { name: 'Sparziele', exact: true })).toHaveAttribute('aria-current', 'page');
  if (loaded) await expect(page.getByRole('button', { name: 'Sparziel speichern', exact: true })).toBeEnabled();
}
async function draft(page: Page, name = 'Reise', amount = '1,15', date = ''): Promise<void> {
  await page.getByLabel('Name des Sparziels').fill(name);
  await page.getByLabel('Zielbetrag in Euro').fill(amount);
  await page.getByLabel('Zieldatum (optional)').fill(date);
}
async function save(page: Page, name: string, amount: string, date = ''): Promise<void> {
  await draft(page, name, amount, date);
  await page.getByRole('button', { name: 'Sparziel speichern', exact: true }).click();
  await expect(page.locator('#goal-status')).toHaveText('Dein Sparziel wurde gespeichert.');
}
function gate() {
  let release!: () => void;
  return { promise: new Promise<void>(resolve => { release = resolve; }), release: () => release() };
}

test('geschützte Navigation, eigene persistente Ziele und unveränderte Kalenderdaten mit null Fortschritt', async ({ page, request }) => {
  await page.goto('/sparziele'); await expect(page).toHaveURL('/anmelden');
  const first = await account(request), second = await account(request);
  await login(page, first);
  await expect(page.getByText('Noch keine Sparziele angelegt.')).toBeVisible();
  await expect(page.getByLabel('Zieldatum (optional)')).toHaveAttribute('inputmode', 'text');
  await page.getByRole('button', { name: 'Sparziel anlegen', exact: true }).click();
  await expect(page.getByLabel('Name des Sparziels')).toBeFocused();
  const responseBody = page.waitForResponse(response => response.url().endsWith('/savings-goals') && response.request().method() === 'POST')
    .then(response => { expect(response.status()).toBe(201); return response.json(); });
  const [, entry] = await Promise.all([save(page, '  Reise 🧳  ', '1.15', '2000-02-29'), responseBody]);
  expect(entry.name).toBe('Reise 🧳'); expect(entry.targetAmountCents).toBe(115); expect(entry.progressCents).toBe(0); expect(entry.targetDate).toBe('2000-02-29');
  await expect(page.locator('.savings-cards')).toContainText('Reise 🧳');
  await expect(page.locator('.savings-cards')).toContainText('1,15 €');
  await expect(page.locator('.savings-cards')).toContainText('0,00 €');
  await expect(page.locator('.savings-cards')).toContainText('29.02.2000');
  await expect(page.getByLabel('Name des Sparziels')).toHaveValue(''); await expect(page.getByLabel('Zieldatum (optional)')).toHaveValue('');
  await expect(page.getByLabel('Name des Sparziels')).toBeFocused();
  await save(page, 'Ohne Datum', '0,01');
  await page.reload(); await expect(page.locator('.savings-cards li')).toHaveCount(2);
  await login(page, second); await expect(page.getByText('Noch keine Sparziele angelegt.')).toBeVisible();
  await expect(page.locator('.savings-cards li')).toHaveCount(0);
  await login(page, first); await expect(page.locator('.savings-cards li')).toHaveCount(2);
  expect(await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }))).toEqual({ local: [], session: [] });
});

test('Feldfehler erhalten Fokus und Entwurf; Centgrenze und Schaltjahr werden ohne Rundung geprüft', async ({ page, request }) => {
  await login(page, await account(request)); let posts = 0;
  page.on('request', request => { if (request.url().endsWith('/savings-goals') && request.method() === 'POST') posts++; });
  for (const name of ['   ', 'Rei\0se']) {
    await draft(page, name, '1'); await page.getByRole('button', { name: 'Sparziel speichern', exact: true }).click();
    await expect(page.getByLabel('Name des Sparziels')).toBeFocused(); await expect(page.getByLabel('Name des Sparziels')).toHaveAttribute('aria-describedby', 'goal-name-error');
  }
  for (const invalid of ['', '0', '-1', '1,001', '1.001', '1e2', '1.000,00', '90071992547409,92']) {
    await draft(page, 'Reise', invalid); await page.getByRole('button', { name: 'Sparziel speichern', exact: true }).click();
    await expect(page.getByLabel('Zielbetrag in Euro')).toHaveValue(invalid); await expect(page.getByLabel('Zielbetrag in Euro')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByLabel('Zielbetrag in Euro')).toBeFocused();
  }
  for (const date of ['2026-02-29', '1900-02-29', '2028-02-30', '2026-04-31', '2026-1-01', '0000-01-01', '2026-01-01T00:00:00Z']) {
    await draft(page, 'Reise', '1', date); await page.getByRole('button', { name: 'Sparziel speichern', exact: true }).click();
    await expect(page.getByLabel('Zieldatum (optional)')).toHaveValue(date); await expect(page.getByLabel('Zieldatum (optional)')).toBeFocused();
    await expect(page.getByLabel('Zieldatum (optional)')).toHaveAttribute('aria-describedby', 'goal-date-hint goal-date-error');
  }
  expect(posts).toBe(0); await save(page, 'Maximum', '90071992547409,91', '2028-02-29');
  await save(page, 'Weiteres Ziel', '90071992547409,91'); expect(posts).toBe(2);
});

test('Offline, Doppelsenden und Serverfeldfehler behalten den Entwurf', async ({ page, context, request }) => {
  await login(page, await account(request)); await draft(page, 'Entwurf', '12,34', '2028-02-29');
  await context.setOffline(true); await expect(page.getByRole('button', { name: 'Sparziel speichern', exact: true })).toBeDisabled();
  await expect(page.getByText('Du bist offline.', { exact: false })).toBeVisible(); await context.setOffline(false);
  const held = gate(), ready = gate(); let posts = 0;
  await page.route(endpoint, async route => {
    if (route.request().method() !== 'POST') return route.continue(); posts++; ready.release(); await held.promise;
    await route.fulfill({ status: 400, json: { code: 'VALIDATION_FAILED', fieldErrors: { targetDate: 'Prüfe das Zieldatum.' } } });
  });
  await page.getByRole('button', { name: 'Sparziel speichern', exact: true }).click(); await ready.promise;
  await expect(page.getByRole('button', { name: 'Sparziel wird gespeichert …' })).toBeDisabled(); await expect(page.locator('#goal-status')).toHaveText('Sparziel wird gespeichert …');
  await page.getByLabel('Zieldatum (optional)').press('Enter'); expect(posts).toBe(1); held.release();
  await expect(page.getByLabel('Zieldatum (optional)')).toBeFocused(); await expect(page.locator('#goal-date-error')).toHaveText('Prüfe das Zieldatum.');
  await expect(page.getByLabel('Name des Sparziels')).toHaveValue('Entwurf'); await expect(page.getByLabel('Zielbetrag in Euro')).toHaveValue('12,34');
  await expect(page.getByLabel('Zieldatum (optional)')).toHaveValue('2028-02-29'); expect(posts).toBe(1);
});

test('verlorene Commitbestätigung zeigt keinen Erfolg und warnt vor Duplikaten', async ({ page, request }) => {
  await login(page, await account(request)); let posts = 0;
  await page.route(endpoint, async route => {
    if (route.request().method() !== 'POST') return route.continue(); posts++; const response = await route.fetch(); expect(response.status()).toBe(201); await route.abort('failed');
  });
  await draft(page, 'Bereits gespeichert', '12,34', '2028-02-29'); await page.getByRole('button', { name: 'Sparziel speichern', exact: true }).click();
  await expect(page.locator('#goal-status')).toContainText('möglicherweise bereits gespeichert'); await expect(page.locator('#goal-status')).toContainText('Duplikate');
  await expect(page.locator('#goal-status')).not.toHaveClass(/success/); await expect(page.locator('.savings-cards li')).toHaveCount(0);
  await expect(page.getByLabel('Name des Sparziels')).toHaveValue('Bereits gespeichert'); await expect(page.getByLabel('Zieldatum (optional)')).toHaveValue('2028-02-29'); expect(posts).toBe(1);
  await page.getByRole('button', { name: 'Sparziele aktualisieren', exact: true }).click(); await expect(page.locator('.savings-cards li')).toHaveCount(1);
  await expect(page.getByLabel('Name des Sparziels')).toHaveValue('Bereits gespeichert'); expect(posts).toBe(1);
});

test('Ladefehler, ungültige Antworten und Platzhalter zeigen keine alten Ziele', async ({ page, request }) => {
  await login(page, await account(request)); await save(page, 'Eigenes Ziel', '5');
  await page.route(endpoint, async route => { if (route.request().method() !== 'GET') return route.continue(); await route.fulfill({ status: 500, json: {} }); });
  await page.getByRole('button', { name: 'Sparziele aktualisieren', exact: true }).click(); await expect(page.getByRole('button', { name: 'Sparziele erneut laden' })).toBeVisible();
  await expect(page.getByText('Eigenes Ziel', { exact: true })).toHaveCount(0); await page.unroute(endpoint);
  for (const goal of [
    { id: 'invalid', name: 'Ungeprüft', targetAmountCents: 1, progressCents: 0 },
    { id: '00000000-0000-4000-8000-000000000001', name: 'Ungeprüft', targetAmountCents: 1, progressCents: -1 },
    { id: '00000000-0000-4000-8000-000000000001', name: 'Ungeprüft', targetAmountCents: 1, progressCents: 0, targetDate: '2026-02-29' }
  ]) {
    await page.route(endpoint, route => route.fulfill({ status: 200, json: [goal] }));
    await page.getByRole('button', { name: 'Sparziele erneut laden' }).click(); await expect(page.getByRole('button', { name: 'Sparziele erneut laden' })).toBeVisible();
    await expect(page.getByText('Ungeprüft', { exact: true })).toHaveCount(0); await page.unroute(endpoint);
  }
  const held = gate(), ready = gate();
  await page.route(endpoint, async route => { const response = await route.fetch(); ready.release(); await held.promise; await route.fulfill({ response }); });
  await page.getByRole('button', { name: 'Sparziele erneut laden' }).click(); await ready.promise;
  await expect(page.getByText('Deine Sparziele werden geladen …')).toBeVisible(); await expect(page.getByText('Eigenes Ziel', { exact: true })).toHaveCount(0);
  held.release(); await expect(page.locator('.savings-cards')).toContainText('Eigenes Ziel');
});

test('derselbe Listenstatus meldet Laden, Anzahl, Leerzustand und Fehler; die Ladeaktion behält den Fokus', async ({ page, request }) => {
  await login(page, await account(request)); await save(page, 'Eigenes Ziel', '5');
  const refresh = page.locator('#goals-refresh'), status = page.locator('#goals-list-status');
  await expect(status).toHaveAttribute('role', 'status'); await expect(status).toHaveAttribute('aria-live', 'polite');
  await expect(status).toHaveText('1 Sparziel geladen.');
  const controlNode = await refresh.elementHandle(), statusNode = await status.elementHandle();
  for (const result of ['success', 'empty', 'failure', 'success']) {
    const held = gate(), ready = gate(); let reads = 0;
    await page.route(endpoint, async route => {
      if (route.request().method() !== 'GET') return route.continue();
      reads++; ready.release(); await held.promise;
      await route.fulfill(result === 'failure' ? { status: 500, json: {} } : { status: 200, json: result === 'empty' ? [] : [
        { id: '00000000-0000-4000-8000-000000000001', name: 'Eigenes Ziel', targetAmountCents: 500, progressCents: 0 }
      ] });
    });
    await refresh.focus(); await page.keyboard.press('Enter'); await ready.promise;
    await expect(status).toHaveText('Deine Sparziele werden geladen …'); await expect(refresh).toBeFocused(); await expect(refresh).toHaveAttribute('aria-disabled', 'true');
    await page.keyboard.press('Enter'); expect(reads).toBe(1);
    held.release();
    await expect(status).toHaveText(result === 'failure' ? 'Deine Sparziele konnten nicht geladen werden.' : result === 'empty' ? 'Noch keine Sparziele angelegt.' : '1 Sparziel geladen.');
    await expect(refresh).toBeFocused(); await expect(refresh).toHaveAttribute('aria-disabled', 'false');
    expect(await controlNode!.evaluate(node => node === document.getElementById('goals-refresh'))).toBe(true);
    expect(await statusNode!.evaluate(node => node === document.getElementById('goals-list-status'))).toBe(true);
    await page.unroute(endpoint);
  }
});

test('ungültige Anlageantwort bestätigt weder Ziel noch Erfolg und erhält jedes Entwurfsfeld', async ({ page, request }) => {
  await login(page, await account(request));
  const submitted = { id: '00000000-0000-4000-8000-000000000001', name: 'Reise', targetAmountCents: 115, progressCents: 0, targetDate: '2028-02-29' };
  for (const mismatch of [{ progressCents: 1 }, { name: 'Anderes Ziel' }, { targetAmountCents: 116 }, { targetDate: '2028-03-01' }]) {
    await page.route(endpoint, async route => {
      if (route.request().method() !== 'POST') return route.continue();
      await route.fulfill({ status: 201, json: { ...submitted, ...mismatch } });
    });
    await draft(page, 'Reise', '1,15', '2028-02-29'); await page.getByRole('button', { name: 'Sparziel speichern', exact: true }).click();
    await expect(page.locator('#goal-status')).toContainText('nicht bestätigt'); await expect(page.locator('#goal-status')).not.toHaveClass(/success/);
    await expect(page.getByLabel('Name des Sparziels')).toHaveValue('Reise'); await expect(page.getByLabel('Zielbetrag in Euro')).toHaveValue('1,15');
    await expect(page.getByLabel('Zieldatum (optional)')).toHaveValue('2028-02-29'); await expect(page.locator('.savings-cards li')).toHaveCount(0);
    await page.unroute(endpoint);
  }
});

test('verspäteter Listenabruf nach Abmeldung wird verworfen und Entwurf gelöscht', async ({ page, request }) => {
  await login(page, await account(request)); await save(page, 'Vorher', '1'); await draft(page, 'Entwurf', '2', '2028-02-29');
  await page.evaluate(() => { (window as any).closedGoals = (window as any).ng.getComponent(document.querySelector('app-savings-goals')); });
  const held = gate(), ready = gate();
  await page.route(endpoint, async route => { const response = await route.fetch(); ready.release(); await held.promise; await route.fulfill({ response }); });
  await page.getByRole('button', { name: 'Sparziele aktualisieren', exact: true }).click(); await ready.promise;
  await page.getByRole('button', { name: 'Abmelden', exact: true }).click(); await expect(page).toHaveURL('/anmelden');
  const answered = page.waitForResponse(response => response.url().endsWith('/savings-goals')); held.release(); await answered;
  expect(await page.evaluate(() => { const old = (window as any).closedGoals; return { items: old.items(), name: old.name, amount: old.amount, date: old.targetDate, loaded: old.loaded() }; }))
    .toEqual({ items: [], name: '', amount: '', date: '', loaded: false });
});

test('verspätetes Speichern nach Kontowechsel gelangt niemals ins neue Konto', async ({ page, context, request }) => {
  const first = await account(request), second = await account(request); await login(page, first);
  const held = gate(), ready = gate();
  await page.route(endpoint, async route => { if (route.request().method() !== 'POST') return route.continue(); const response = await route.fetch(); ready.release(); await held.promise; await route.fulfill({ response }); });
  await draft(page, 'Altes Konto', '4,56', '2028-02-29');
  await page.evaluate(() => { (window as any).closedGoals = (window as any).ng.getComponent(document.querySelector('app-savings-goals')); });
  await page.getByRole('button', { name: 'Sparziel speichern', exact: true }).click(); await ready.promise;
  const other = await context.newPage(); await login(other, second); await expect(page).toHaveURL('/anmelden');
  const answered = page.waitForResponse(response => response.url().endsWith('/savings-goals') && response.request().method() === 'POST'); held.release(); await answered;
  await expect(other.getByText('Noch keine Sparziele angelegt.')).toBeVisible(); await expect(other.getByLabel('Name des Sparziels')).toHaveValue('');
  expect(await page.evaluate(() => { const old = (window as any).closedGoals; return { items: old.items(), name: old.name, amount: old.amount, date: old.targetDate }; })).toEqual({ items: [], name: '', amount: '', date: '' });
  await page.unroute(endpoint); await login(other, first); await expect(other.locator('.savings-cards')).toContainText('Altes Konto');
});

test('Tokenablauf während des Speicherns verwirft Entwurf und verspätete Antwort', async ({ page, request }) => {
  await page.clock.install(); await login(page, await account(request)); const held = gate(), ready = gate();
  await page.route(endpoint, async route => { if (route.request().method() !== 'POST') return route.continue(); const response = await route.fetch(); ready.release(); await held.promise; await route.fulfill({ response }); });
  const refreshHeld = gate(), refreshReady = gate();
  await page.route('**/api/v1/access/refresh', async route => { const response = await route.fetch(); refreshReady.release(); await refreshHeld.promise; await route.fulfill({ response }); });
  await page.clock.fastForward(570_001); await refreshReady.promise; await page.clock.fastForward(28_000);
  await draft(page, 'Verwerfen', '9,99', '2028-02-29'); await page.evaluate(() => { (window as any).closedGoals = (window as any).ng.getComponent(document.querySelector('app-savings-goals')); });
  await page.getByRole('button', { name: 'Sparziel speichern', exact: true }).click(); await ready.promise;
  await page.clock.fastForward(3_000); await expect(page).toHaveURL('/anmelden');
  const answered = page.waitForResponse(response => response.url().endsWith('/savings-goals') && response.request().method() === 'POST'); held.release(); await answered;
  const revoked = page.waitForResponse('**/api/v1/access/logout'); refreshHeld.release(); expect((await revoked).status()).toBe(204);
  expect(await page.evaluate(() => { const old = (window as any).closedGoals; return { items: old.items(), name: old.name, amount: old.amount, date: old.targetDate }; })).toEqual({ items: [], name: '', amount: '', date: '' });
});

test('Tastatur, 200-Prozent-Text und axe bleiben mobil und am Desktop zugänglich', async ({ page, request }) => {
  await login(page, await account(request)); expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Sparziel anlegen', exact: true }).click(); await expect(page.getByLabel('Name des Sparziels')).toBeFocused();
  await page.keyboard.press('Tab'); await expect(page.getByLabel('Zielbetrag in Euro')).toBeFocused(); await page.keyboard.press('Tab');
  await expect(page.getByLabel('Zieldatum (optional)')).toBeFocused(); await page.keyboard.press('Tab'); await expect(page.getByRole('button', { name: 'Sparziel speichern', exact: true })).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page.getByLabel('Name des Sparziels')).toBeFocused();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]); await save(page, 'SehrLangerName'.repeat(15), '90071992547409,91', '2028-02-29');
  for (const [width, height] of [[320, 568], [390, 844], [768, 1024], [1280, 800]]) {
    await page.setViewportSize({ width, height });
    for (const size of ['100%', '200%']) {
      await page.evaluate(value => { document.documentElement.style.fontSize = value; }, size);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      const cards = page.locator('.savings-cards'); await expect(cards).toBeVisible(); await expect(cards).toContainText('90.071.992.547.409,91 €');
      expect(await cards.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
      for (const input of await page.locator('app-savings-goals input').all()) expect((await input.boundingBox())!.height).toBeGreaterThanOrEqual(48);
      for (const action of await page.locator('button, nav a').all()) { const bounds = (await action.boundingBox())!; expect(bounds.height).toBeGreaterThanOrEqual(44); expect(bounds.width).toBeGreaterThanOrEqual(44); }
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    }
  }
});

test('vor bestätigter Identität fehlen persönliche Anfragen und Formulare; falsche Identität wird abgewiesen', async ({ page, request }) => {
  const held = gate(), ready = gate(); let reads = 0;
  await page.route('**/api/v1/access/me', async route => { ready.release(); await held.promise; await route.fulfill({ status: 200, json: { userId: '00000000-0000-4000-8000-000000000001' } }); });
  await page.route(endpoint, async route => { reads++; await route.continue(); });
  await login(page, await account(request), false); await ready.promise;
  expect(reads).toBe(0); await expect(page.getByLabel('Name des Sparziels')).toHaveCount(0); held.release();
  await expect(page.getByRole('button', { name: 'Zugang erneut prüfen' })).toBeVisible(); expect(reads).toBe(0); await page.unroute('**/api/v1/access/me');
  await page.getByRole('button', { name: 'Zugang erneut prüfen' }).click(); await expect(page.getByRole('button', { name: 'Sparziel speichern', exact: true })).toBeEnabled(); expect(reads).toBe(1);
});

test('Kalenderdatum bleibt in anderer Browserzeitzone unverändert', async ({ browser, request }) => {
  const context = await browser.newContext({ baseURL: 'https://localhost:4200', ignoreHTTPSErrors: true, timezoneId: 'America/Los_Angeles', viewport: { width: 320, height: 568 } });
  try { const page = await context.newPage(); await login(page, await account(request)); await save(page, 'Kalenderdatum', '1', '2028-02-29'); await expect(page.locator('.savings-cards')).toContainText('29.02.2028'); }
  finally { await context.close(); }
});
