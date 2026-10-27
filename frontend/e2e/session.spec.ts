import AxeBuilder from '@axe-core/playwright';
import { expect, test, Page, APIRequestContext } from '@playwright/test';

const password = '  Grüner 🦊 im Baum  ';
async function account(request: APIRequestContext): Promise<string> {
  const email = `session-${crypto.randomUUID()}@example.org`;
  expect((await request.post('http://127.0.0.1:8080/api/v2/access/registrations', {
    data: { registrationToken: 'a'.repeat(43), email, password }
  })).status()).toBe(201);
  return email;
}
async function login(page: Page, email: string): Promise<void> {
  await page.goto('/anmelden');
  await page.getByLabel('E-Mail-Adresse', { exact: true }).fill(email);
  await page.getByLabel('Passwort', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Monat', exact: true })).toBeVisible();
  await expect(page.getByText('Du bist angemeldet. Deine persönliche Monatsübersicht ist geöffnet.')).toBeVisible();
}

test('echte Secure-Cookies, CSRF, Reload und Logout; persönliche Werte bleiben im Arbeitsspeicher', async ({ page, context, request }) => {
  const email = await account(request);
  await login(page, email);
  await expect(page.getByText('Noch kein Monatsbudget festgelegt. Lege deinen fortlaufenden Betrag fest.')).toBeVisible();
  const cookies = await context.cookies();
  expect(cookies.map(cookie => cookie.name).sort()).toEqual(['__Host-tnbp-csrf', '__Host-tnbp-refresh']);
  for (const cookie of cookies) {
    expect(cookie.secure).toBe(true); expect(cookie.httpOnly).toBe(true); expect(cookie.sameSite).toBe('Strict');
    expect(cookie.path).toBe('/'); expect(cookie.domain).toBe('localhost');
  }
  expect(await page.evaluate(async () => ({
    local: localStorage.length, session: sessionStorage.length, cookie: document.cookie,
    databases: await indexedDB.databases(), caches: await caches.keys()
  }))).toEqual({ local: 0, session: 0, cookie: '', databases: [], caches: [] });
  const old = cookies.find(cookie => cookie.name === '__Host-tnbp-refresh')!.value;
  const renewed = page.waitForResponse('**/api/v2/access/refresh');
  await page.reload();
  expect((await renewed).status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Monat', exact: true })).toBeVisible();
  expect((await context.cookies()).find(cookie => cookie.name === '__Host-tnbp-refresh')!.value).not.toBe(old);
  const logout = page.waitForResponse('**/api/v2/access/logout');
  await page.getByRole('button', { name: 'Abmelden', exact: true }).click();
  expect((await logout).status()).toBe(204);
  await expect(page).toHaveURL('/anmelden');
  expect((await context.cookies()).some(cookie => cookie.name === '__Host-tnbp-refresh')).toBe(false);
  await page.goto('/monat');
  await expect(page).toHaveURL('/anmelden');
});

test('Login hat neutrale Fehler, Fehlerfokus, verwandte Formulare und keine Doppelsendung', async ({ page, request }) => {
  const email = await account(request);
  await page.goto('/anmelden');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.locator('#email')).toBeFocused();
  await expect(page.locator('#email')).toHaveAttribute('aria-describedby', 'email-error');
  await page.getByLabel('E-Mail-Adresse', { exact: true }).fill(email);
  await page.getByLabel('Passwort', { exact: true }).fill('falsch');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.locator('#feedback')).toBeFocused();
  await expect(page.getByRole('status')).toHaveText('Anmeldung nicht möglich. Prüfe E-Mail-Adresse und Passwort.');
  await expect(page.getByLabel('Passwort', { exact: true })).toHaveValue('falsch');
  await page.getByRole('link', { name: 'Eigenes Konto anlegen', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Eigenes Konto anlegen' })).toBeVisible();
  await page.getByRole('link', { name: 'Zur Anmeldung' }).click();
  await expect(page.getByRole('heading', { name: 'Anmelden', exact: true })).toBeVisible();
});

test('Doppelsenden, Netzwerkfehler und Offline erhalten den Loginentwurf', async ({ page, context, request }) => {
  const email = await account(request);
  await page.goto('/anmelden');
  await page.getByLabel('E-Mail-Adresse', { exact: true }).fill(email);
  await page.getByLabel('Passwort', { exact: true }).fill(password);
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  let sends = 0;
  await page.route('**/api/v2/access/login', async route => { sends++; await held; await route.abort('failed'); });
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Anmeldung läuft …' })).toBeDisabled();
  await page.keyboard.press('Enter');
  release();
  await expect(page.getByRole('status')).toContainText('nicht bestätigt');
  expect(sends).toBe(1);
  await expect(page.getByLabel('E-Mail-Adresse', { exact: true })).toHaveValue(email);
  await expect(page.getByLabel('Passwort', { exact: true })).toHaveValue(password);
  await context.setOffline(true);
  await expect(page.getByRole('button', { name: 'Anmelden', exact: true })).toBeDisabled();
  await context.setOffline(false);
  await page.unroute('**/api/v2/access/login');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Monat', exact: true })).toBeVisible();
});

test('fehlende oder falsche CSRF/Origin verändern eine bestehende Sitzung nicht', async ({ page, request }) => {
  await login(page, await account(request));
  const outcomes = await page.evaluate(async () => {
    const noHeader = await fetch('/api/v2/access/logout', { method: 'POST' });
    const badHeader = await fetch('/api/v2/access/refresh', { method: 'POST', headers: { 'X-CSRF-TOKEN': 'falsch' } });
    return [noHeader.status, badHeader.status];
  });
  expect(outcomes).toEqual([403, 403]);
  // Eine fremde Origin wird real durch den HTTP-Server geprüft; Browser verbieten deren Überschreiben.
  expect((await request.post('http://127.0.0.1:8080/api/v2/access/logout', { headers: { Origin: 'https://fremd.example' } })).status()).toBe(403);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Monat', exact: true })).toBeVisible();
});

test('automatische Erneuerung rotiert genau einmal, unbestätigte Rotation beendet die Ansicht ohne Retry', async ({ page, context, request }) => {
  await page.clock.install();
  await login(page, await account(request));
  let rotations = 0;
  page.on('request', request => { if (request.url().endsWith('/access/refresh')) rotations++; });
  // Eine verlorene/abgelaufene serverseitige CSRF-Sitzung darf ein gültiges Refresh-Cookie nicht aussperren.
  await context.clearCookies({ name: '__Host-tnbp-csrf' });
  const renewed = page.waitForResponse('**/api/v2/access/refresh');
  await page.clock.fastForward(570_001);
  expect((await renewed).status()).toBe(200);
  expect(rotations).toBe(1);
  await page.route('**/api/v2/access/refresh', async route => { await route.fetch(); await route.abort('failed'); });
  await page.reload();
  await expect(page).toHaveURL('/anmelden');
  await expect(page.getByRole('status')).toContainText('nicht verlängert');
  const afterFailure = rotations;
  await page.clock.fastForward(120_000);
  expect(rotations).toBe(afterFailure);
  await expect(page.getByRole('heading', { name: 'Monat', exact: true })).toHaveCount(0);
});

test('Logout während später Refreshantwort verhindert Wiederbelebung und widerruft den Nachfolger', async ({ page, request, context }) => {
  await page.clock.install();
  await login(page, await account(request));
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  let committed!: () => void;
  const ready = new Promise<void>(resolve => { committed = resolve; });
  await page.route('**/api/v2/access/refresh', async route => {
    const response = await route.fetch(); committed(); await held; await route.fulfill({ response });
  });
  await page.clock.fastForward(570_001); await ready;
  await page.getByRole('button', { name: 'Abmelden', exact: true }).click();
  await expect(page).toHaveURL('/anmelden');
  const loggedOut = page.waitForResponse('**/api/v2/access/logout');
  release();
  expect((await loggedOut).status()).toBe(204);
  await expect(page.getByRole('heading', { name: 'Anmelden', exact: true })).toBeVisible();
  expect((await context.cookies()).some(cookie => cookie.name === '__Host-tnbp-refresh')).toBe(false);
});

test('Tokenablauf schließt die Ansicht und verwirft eine danach eintreffende Erneuerung', async ({ page, request, context }) => {
  await page.clock.install();
  await login(page, await account(request));
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  let committed!: () => void;
  const ready = new Promise<void>(resolve => { committed = resolve; });
  await page.route('**/api/v2/access/refresh', async route => {
    const response = await route.fetch(); committed(); await held; await route.fulfill({ response });
  });
  await page.clock.fastForward(570_001); await ready;
  await page.clock.fastForward(30_000);
  await expect(page).toHaveURL('/anmelden');
  await expect(page.getByRole('status')).toContainText('abgelaufen');
  const revoked = page.waitForResponse('**/api/v2/access/logout');
  release();
  expect((await revoked).status()).toBe(204);
  expect((await context.cookies()).some(cookie => cookie.name === '__Host-tnbp-refresh')).toBe(false);
  await expect(page.getByRole('heading', { name: 'Monat', exact: true })).toHaveCount(0);
});

test('Kontowechsel verwirft die persönliche Ansicht auch in einem anderen offenen Tab', async ({ page, context, request }) => {
  const first = await account(request), second = await account(request);
  await login(page, first);
  const other = await context.newPage();
  await other.goto('/monat');
  await expect(other.getByRole('heading', { name: 'Monat', exact: true })).toBeVisible();
  await login(page, second);
  await expect(other).toHaveURL('/anmelden');
  await expect(other.getByRole('status')).toContainText('anderen Tab');
  await expect(other.getByRole('heading', { name: 'Monat', exact: true })).toHaveCount(0);
});

test('320 Pixel, Tastatur, 200-Prozent-Text, Touchziele und axe', async ({ page }) => {
  await page.goto('/anmelden');
  await page.keyboard.press('Tab'); await expect(page.locator('#email')).toBeFocused();
  await page.keyboard.press('Tab'); await expect(page.locator('#password')).toBeFocused();
  await page.keyboard.press('Tab'); await expect(page.getByRole('button', { name: 'Anmelden', exact: true })).toBeFocused();
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1280, height: 800 }]) {
    await page.setViewportSize(viewport);
    for (const size of ['100%', '200%']) {
      await page.evaluate(value => { document.documentElement.style.fontSize = value; }, size);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      for (const selector of ['#email', '#password', 'button', 'a']) {
        const bounds = await page.locator(selector).boundingBox();
        expect(bounds!.height).toBeGreaterThanOrEqual(44); expect(bounds!.width).toBeGreaterThanOrEqual(44);
      }
    }
  }
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('zwei gleichzeitige Wiederherstellungen rotieren das gemeinsame Cookie nacheinander', async ({ page, context, request }) => {
  await login(page, await account(request));
  const other = await context.newPage();
  const statuses: number[] = [];
  let refreshRequests = 0;
  let release!: () => void, committed!: (tab: Page) => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  const ready = new Promise<Page>(resolve => { committed = resolve; });
  await context.route('**/api/v2/access/refresh', async route => {
    const ordinal = ++refreshRequests;
    if (ordinal === 1) { committed(route.request().frame().page()); await held; }
    await route.continue();
  });
  context.on('response', response => { if (response.url().endsWith('/access/refresh')) statuses.push(response.status()); });
  await Promise.all([page.reload(), other.goto('/monat')]);
  const holder = await ready;
  const waiting = holder === page ? other : page;
  await expect(waiting.locator('header')).toBeVisible();
  await waiting.waitForLoadState('networkidle');
  expect(refreshRequests).toBe(1);
  release();
  await expect.poll(() => statuses.length).toBe(2);
  expect(statuses).toEqual([200, 200]);
  for (const tab of [page, other]) {
    await expect(tab.getByText('Du bist angemeldet. Deine persönliche Monatsübersicht ist geöffnet.')).toBeVisible();
  }
  expect(statuses).toEqual([200, 200]);
  await other.reload();
  await expect(other.getByText('Du bist angemeldet. Deine persönliche Monatsübersicht ist geöffnet.')).toBeVisible();
});

test('verzögertes Refresh hält Kontowechsel einschließlich CSRF zurück und überschreibt dessen Cookie nicht', async ({ page, context, request }) => {
  await page.clock.install();
  await login(page, await account(request));
  const replacement = await account(request);
  let release!: () => void, committed!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  const ready = new Promise<void>(resolve => { committed = resolve; });
  await page.route('**/api/v2/access/refresh', async route => {
    const response = await route.fetch(); committed(); await held; await route.fulfill({ response });
  });
  await page.clock.fastForward(570_001); await ready;
  const other = await context.newPage();
  await other.goto('/anmelden');
  await other.getByLabel('E-Mail-Adresse', { exact: true }).fill(replacement);
  await other.getByLabel('Passwort', { exact: true }).fill(password);
  const mutations: string[] = [];
  other.on('request', request => {
    if (/\/access\/(csrf|login)$/.test(request.url())) mutations.push(request.url());
  });
  let replacementUserId: string | undefined, restoredUserId: string | undefined;
  await other.route(/\/api\/v2\/access\/(login|refresh)$/, async route => {
    // Identität aus der echten Serverantwort lesen, bevor Chromium sie erhält.
    const response = await route.fetch(); expect(response.status()).toBe(200);
    const session = await response.json();
    if (route.request().url().endsWith('/login')) replacementUserId = session.userId;
    else restoredUserId = session.userId;
    await route.fulfill({ response });
  });
  await other.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page).toHaveURL('/anmelden');
  expect(mutations).toEqual([]);
  release();
  await expect(other.getByText('Du bist angemeldet. Deine persönliche Monatsübersicht ist geöffnet.')).toBeVisible();
  expect(replacementUserId).toEqual(expect.any(String));
  const restored = other.waitForResponse('**/api/v2/access/refresh');
  await other.reload();
  expect((await restored).status()).toBe(200);
  await expect(other.getByText('Du bist angemeldet. Deine persönliche Monatsübersicht ist geöffnet.')).toBeVisible();
  expect(restoredUserId).toBe(replacementUserId);
  await expect(page.getByRole('status')).toContainText('anderen Tab');
});

test('eine um 9m45s vorgehende Geräteuhr löst keine sofortigen Rotationen aus', async ({ page, request }) => {
  await page.clock.install({ time: new Date(Date.now() + 585_000) });
  let rotations = 0;
  page.on('request', request => { if (request.url().endsWith('/access/refresh')) rotations++; });
  await login(page, await account(request));
  await page.clock.fastForward(5_000);
  expect(rotations).toBe(0);
  const renewed = page.waitForResponse('**/api/v2/access/refresh');
  await page.clock.fastForward(565_001);
  expect((await renewed).status()).toBe(200);
  await page.clock.fastForward(5_000);
  expect(rotations).toBe(1);
  await expect(page.getByRole('heading', { name: 'Monat', exact: true })).toBeVisible();
});

test('abgebrochener Login meldet den tatsächlichen Sitzungszustand statt weiter laufender Anmeldung', async ({ page, context, request }) => {
  const email = await account(request);
  let release!: () => void, committed!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  const ready = new Promise<void>(resolve => { committed = resolve; });
  await page.route('**/api/v2/access/login', async route => {
    const response = await route.fetch(); committed(); await held; await route.fulfill({ response });
  });
  await page.goto('/anmelden');
  await page.getByLabel('E-Mail-Adresse', { exact: true }).fill(email);
  await page.getByLabel('Passwort', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await ready;
  const other = await context.newPage();
  await other.goto('/anmelden');
  await other.getByLabel('E-Mail-Adresse', { exact: true }).fill(email);
  await other.getByLabel('Passwort', { exact: true }).fill(password);
  await other.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).ng.getComponent(document.querySelector('app-login')).session.notice())).toContain('anderen Tab');
  release();
  await expect(page.getByRole('button', { name: 'Anmelden', exact: true })).toBeEnabled();
  await expect(page.getByRole('status')).toContainText('anderen Tab');
  await expect(page.getByRole('status')).not.toContainText('Anmeldung läuft');
  await expect(other.getByRole('heading', { name: 'Monat', exact: true })).toBeVisible();
});

test('Wechsel zur Registrierung verwirft einen noch ausstehenden Login und dessen spätere Navigation', async ({ page, context, request }) => {
  const email = await account(request);
  let release!: () => void, committed!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  const ready = new Promise<void>(resolve => { committed = resolve; });
  await page.route('**/api/v2/access/login', async route => {
    const response = await route.fetch(); committed(); await held; await route.fulfill({ response });
  });
  await page.goto('/anmelden');
  await page.getByLabel('E-Mail-Adresse', { exact: true }).fill(email);
  await page.getByLabel('Passwort', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await ready;
  await page.getByRole('link', { name: 'Eigenes Konto anlegen', exact: true }).click();
  await expect(page).toHaveURL('/registrieren');
  const revoked = page.waitForResponse('**/api/v2/access/logout');
  release();
  expect((await revoked).status()).toBe(204);
  await expect(page).toHaveURL('/registrieren');
  await expect(page.getByRole('heading', { name: 'Monat', exact: true })).toHaveCount(0);
  expect((await context.cookies()).some(cookie => cookie.name === '__Host-tnbp-refresh')).toBe(false);
});

test('Logout bleibt bis zur Bestätigung ausstehend, meldet Fehler und bestätigt erst den Retry', async ({ page, context, request }) => {
  await login(page, await account(request));
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/v2/access/logout', async route => {
    await held;
    await route.fulfill({ status: 500, json: { code: 'SESSION_UNAVAILABLE', message: 'Synthetischer Fehler' } });
  });
  await page.getByRole('button', { name: 'Abmelden', exact: true }).click();
  await expect(page).toHaveURL('/anmelden');
  await expect(page.getByRole('status')).toHaveText('Abmeldung läuft …');
  await expect(page.getByRole('status')).not.toContainText('Du wurdest abgemeldet.');
  release();
  await expect(page.getByRole('status')).toContainText('nicht bestätigt');
  expect((await context.cookies()).some(cookie => cookie.name === '__Host-tnbp-refresh')).toBe(true);
  await page.unroute('**/api/v2/access/logout');
  const response = page.waitForResponse('**/api/v2/access/logout');
  await page.getByRole('button', { name: 'Abmeldung erneut versuchen' }).click();
  expect((await response).status()).toBe(204);
  await expect(page.getByRole('status')).toHaveText('Du wurdest abgemeldet.');
});

test('geschützter Angular-Aufruf setzt Bearer und bündelt zwei 401 zu einer Erneuerung mit zwei Retries', async ({ page, request }) => {
  const initialRequest = page.waitForRequest('**/api/v2/access/me');
  await login(page, await account(request));
  expect((await initialRequest).headers()['authorization']).toMatch(/^Bearer /);
  const authorization: string[] = [];
  let renewals = 0, attempts = 0;
  page.on('request', request => { if (request.url().endsWith('/access/refresh')) renewals++; });
  await page.route('**/api/v2/access/me', async route => {
    authorization.push(route.request().headers()['authorization']);
    if (++attempts <= 2) await route.fulfill({ status: 401, json: { code: 'SESSION_REJECTED', message: 'Synthetischer Ablauf' } });
    else await route.continue();
  });
  const outcomes = await page.evaluate(async () => {
    const month = (window as any).ng.getComponent(document.querySelector('app-month'));
    return Promise.all([month.verifyIdentity(), month.verifyIdentity()]);
  });
  expect(outcomes).toEqual([true, true]);
  expect(renewals).toBe(1);
  expect(authorization).toHaveLength(4);
  expect(authorization[0]).toBe(authorization[1]);
  expect(authorization[2]).toBe(authorization[3]);
  expect(authorization[2]).not.toBe(authorization[0]);
});

test('späte geschützte Angular-Antwort wird nach Sitzungsende als verworfen zurückgegeben', async ({ page, request }) => {
  await login(page, await account(request));
  let release!: () => void, committed!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  const ready = new Promise<void>(resolve => { committed = resolve; });
  await page.route('**/api/v2/access/me', async route => {
    const response = await route.fetch(); committed(); await held; await route.fulfill({ response });
  });
  const outcome = page.evaluate(async () => {
    const month = (window as any).ng.getComponent(document.querySelector('app-month'));
    return new Promise(resolve => month.http.get('/api/v2/access/me').subscribe({
      next: () => resolve({ accepted: true }),
      error: (failure: any) => resolve({ status: failure.status, statusText: failure.statusText })
    }));
  });
  await ready;
  const loggedOut = page.waitForResponse('**/api/v2/access/logout');
  await page.getByRole('button', { name: 'Abmelden', exact: true }).click();
  expect((await loggedOut).status()).toBe(204);
  release();
  expect(await outcome).toEqual({ status: 401, statusText: 'Sitzung beendet' });
  await expect(page.getByRole('status')).toHaveText('Du wurdest abgemeldet.');
});

test('alle sechs Browserzugangsoperationen nutzen ausschließlich v2, Finanzaufgaben bleiben auf v1', async ({ page }) => {
  const access: { path: string; method: string; bearer?: string; csrf?: string; origin?: string }[] = [];
  const headerChecks: Promise<void>[] = [];
  const finances = new Set<string>();
  page.on('request', request => {
    const path = new URL(request.url()).pathname;
    if (/\/api\/v\d+\/access\//.test(path)) {
      headerChecks.push(request.allHeaders().then(headers => {
        access.push({ path, method: request.method(), bearer: headers['authorization'], csrf: headers['x-csrf-token'], origin: headers['origin'] });
      }));
    }
    if (path.startsWith('/api/v1/') && !path.includes('/access/')) finances.add(path);
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
  await page.getByRole('link', { name: 'Sparziele', exact: true }).click();
  await expect(page.getByText('Du bist angemeldet. Deine persönlichen Sparziele sind geöffnet.')).toBeVisible();
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
  expect([...finances]).toEqual(expect.arrayContaining(['/api/v1/expense-budget/budget', '/api/v1/expense-budget/expenses', '/api/v1/expense-budget/month-summary', '/api/v1/savings-goals']));
});

test('Interceptor begrenzt Bearer auf dieselbe Herkunft und v1/v2 und nimmt öffentliche Zugangspfade aus', async ({ page, request }) => {
  await login(page, await account(request));
  const observed = new Map<string, string | undefined>();
  await page.route(url => url.searchParams.has('interceptorProbe'), async route => {
    const url = new URL(route.request().url());
    observed.set(url.href, route.request().headers()['authorization']);
    await route.fulfill({ status: 200, json: {}, headers: { 'Access-Control-Allow-Origin': 'https://localhost:4200' } });
  });
  const paths = [
    '/api/v1/expense-budget/budget', '/api/v2/access/me', 'https://localhost:4200/api/v2/access/me',
    'https://fremd.example/api/v2/access/me', '//fremd.example/api/v1/expense-budget/budget',
    '/api/v3/access/me', '/api/v20/access/me', '/api/v1extra/access/me',
    ...['registrations', 'csrf', 'login', 'refresh', 'logout'].map(name => `/api/v2/access/${name}`)
  ].map((path, index) => `${path}?interceptorProbe=${index}`);
  await page.evaluate(async paths => {
    const month = (window as any).ng.getComponent(document.querySelector('app-month'));
    for (const path of paths) await new Promise(resolve => month.http.get(path).subscribe({ next: resolve, error: resolve }));
  }, paths);
  expect(observed.size).toBe(paths.length);
  for (const [index, path] of paths.entries()) {
    const header = observed.get(new URL(path, 'https://localhost:4200').href);
    if (index < 3) expect(header).toMatch(/^Bearer /);
    else expect(header).toBeUndefined();
  }
});

test('eine auch nach Refresh abgewiesene Identität wird höchstens einmal wiederholt', async ({ page, request }) => {
  await login(page, await account(request));
  let identities = 0, refreshes = 0;
  page.on('request', request => { if (request.url().endsWith('/api/v2/access/refresh')) refreshes++; });
  await page.route('**/api/v2/access/me', route => { identities++; return route.fulfill({ status: 401, json: { code: 'SESSION_REJECTED' } }); });
  expect(await page.evaluate(() => (window as any).ng.getComponent(document.querySelector('app-month')).verifyIdentity())).toBe(false);
  expect(identities).toBe(2); expect(refreshes).toBe(1);
  await expect(page.getByText('Der Zugang konnte nicht geprüft werden.')).toBeVisible();
});

test('v2 wartet auf die Cookie-Sperre eines vorhandenen v1-Tabs einschließlich dessen Antwort', async ({ page, context, request }) => {
  await login(page, await account(request));
  const legacy = await context.newPage();
  await legacy.goto('/anmelden');
  let release!: () => void, committed!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  const ready = new Promise<void>(resolve => { committed = resolve; });
  await legacy.route('**/api/v1/access/refresh', async route => {
    const response = await route.fetch(); expect(response.status()).toBe(200); committed(); await held; await route.fulfill({ response });
  });
  // Ein vorhandener v1-Tab verwendet weiterhin dieselbe originweite Sperre und dieselben Cookies.
  const legacyRefresh = legacy.evaluate(() => navigator.locks.request('tnbp-session-cookie', async () => {
    const csrf = await (await fetch('/api/v1/access/csrf')).json();
    return (await fetch('/api/v1/access/refresh', { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf.token } })).status;
  }));
  await ready;
  const calls: string[] = [];
  page.on('request', request => { if (request.url().includes('/api/v2/access/')) calls.push(new URL(request.url()).pathname); });
  await page.reload();
  await page.waitForLoadState('networkidle');
  expect(calls).toEqual([]);
  release();
  expect(await legacyRefresh).toBe(200);
  await expect(page.getByText('Du bist angemeldet. Deine persönliche Monatsübersicht ist geöffnet.')).toBeVisible();
  expect(calls).toEqual(['/api/v2/access/csrf', '/api/v2/access/refresh', '/api/v2/access/me']);
});

test('Logout und Retry teilen ihren laufenden Widerruf und zeigen einen roten Pending-Zustand', async ({ page, request }) => {
  await login(page, await account(request));
  let release!: () => void;
  let calls = 0;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/v2/access/logout', async route => { calls++; await held; await route.fulfill({ status: 500, json: { code: 'SESSION_UNAVAILABLE' } }); });
  await page.evaluate(() => {
    const session = (window as any).ng.getComponent(document.querySelector('app-month')).session;
    (window as any).logoutSession = session;
    const first = session.logout();
    (window as any).logoutOperations = [first, session.logout(), session.logout()];
    return (window as any).logoutOperations.every((operation: unknown) => operation === first);
  });
  await expect(page).toHaveURL('/anmelden');
  const pending = page.getByRole('button', { name: 'Abmeldung läuft …', exact: true });
  await expect(pending).toBeDisabled();
  await expect(pending).toHaveAttribute('aria-busy', 'true');
  await expect(pending).toHaveCSS('background-color', 'rgb(132, 45, 45)');
  await expect(pending).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect.poll(() => calls).toBe(1);
  expect(await page.evaluate(() => {
    const operations = (window as any).logoutOperations;
    const repeated = (window as any).logoutSession.logout();
    operations.push(repeated);
    return operations.every((operation: unknown) => operation === operations[0]);
  })).toBe(true);
  release();
  await page.evaluate(() => Promise.all((window as any).logoutOperations));
  await expect(page.getByRole('status')).toContainText('Widerruf auf dem Server wurde nicht bestätigt');
  expect(calls).toBe(1);
  const retry = page.getByRole('button', { name: 'Abmeldung erneut versuchen', exact: true });
  await retry.focus(); await expect(retry).toBeFocused();
  let retryRelease!: () => void;
  const retryHeld = new Promise<void>(resolve => { retryRelease = resolve; });
  await page.unroute('**/api/v2/access/logout');
  await page.route('**/api/v2/access/logout', async route => { calls++; await retryHeld; await route.continue(); });
  await page.keyboard.press('Enter');
  await expect(pending).toBeDisabled();
  expect(await page.evaluate(() => {
    const session = (window as any).logoutSession;
    const first = session.logout();
    (window as any).retryOperations = [first, session.logout()];
    return first === (window as any).retryOperations[1];
  })).toBe(true);
  await expect.poll(() => calls).toBe(2);
  retryRelease();
  await page.evaluate(() => Promise.all((window as any).retryOperations));
  await expect(page.getByRole('status')).toHaveText('Du wurdest abgemeldet.');
  expect(calls).toBe(2);
});

for (const destination of ['Monat', 'Sparziele']) {
  test(`rote Abmeldeaktion in ${destination}: vier Viewports, 200-%-Text, Fokus, Zustände und Kontrast`, async ({ page, request }) => {
    test.setTimeout(90_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await login(page, await account(request));
    if (destination === 'Sparziele') {
      await page.getByRole('link', { name: destination, exact: true }).click();
      await expect(page.getByText('Du bist angemeldet. Deine persönlichen Sparziele sind geöffnet.')).toBeVisible();
    }
    const button = page.getByRole('button', { name: 'Abmelden', exact: true });
    for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1280, height: 800 }]) {
      await page.setViewportSize(viewport);
      for (const size of ['100%', '200%']) {
        await page.evaluate(value => { document.documentElement.style.fontSize = value; }, size);
        await page.mouse.move(0, 0);
        await button.focus();
        await expect(button).toBeFocused();
        const bounds = await button.boundingBox();
        expect(bounds!.width).toBeGreaterThanOrEqual(44); expect(bounds!.height).toBeGreaterThanOrEqual(44);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
        await expect(button).toHaveCSS('outline-width', '3px');
        await expect(button).toHaveCSS('outline-offset', '3px');
        await expect(button).toHaveCSS('background-color', 'rgb(132, 45, 45)');
        const contrast = await button.evaluate(element => {
          const style = getComputedStyle(element);
          const luminance = (color: string) => {
            const rgb = color.match(/\d+/g)!.slice(0, 3).map(value => Number(value) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
            return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
          };
          const contrast = (a: string, b: string) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
          return { text: contrast(style.color, style.backgroundColor), border: contrast(style.borderColor, 'rgb(255,255,255)'), focus: contrast(style.outlineColor, 'rgb(255,255,255)'), motion: style.animationName };
        });
        expect(contrast.text).toBeGreaterThanOrEqual(4.5); expect(contrast.border).toBeGreaterThanOrEqual(3); expect(contrast.focus).toBeGreaterThanOrEqual(3); expect(contrast.motion).toBe('none');
      }
    }
    await page.evaluate(() => { document.documentElement.style.fontSize = '100%'; });
    await button.hover();
    await expect(button).toHaveCSS('background-color', 'rgb(112, 38, 38)');
    await page.mouse.down();
    await expect(button).toHaveCSS('background-color', 'rgb(92, 31, 31)');
    await page.mouse.move(0, 0); await page.mouse.up();
    await button.focus();
    await expect(button).toHaveCSS('background-color', 'rgb(132, 45, 45)');
    // Tastaturaktivierung schließt die geschützte Ansicht und kündigt den Abschluss an.
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('status')).toHaveText('Du wurdest abgemeldet.');
  });
}

for (const previous of ['Erfolg', 'Fehler']) {
  test(`späte Login-${previous}-Antwort verändert einen neuen Login im selben Formular nicht`, async ({ page, request }) => {
    const first = await account(request), second = await account(request);
    let releaseFirst!: () => void, releaseSecond!: () => void, firstReady!: () => void, secondReady!: () => void;
    const firstHeld = new Promise<void>(resolve => { releaseFirst = resolve; });
    const secondHeld = new Promise<void>(resolve => { releaseSecond = resolve; });
    const firstSent = new Promise<void>(resolve => { firstReady = resolve; });
    const secondSent = new Promise<void>(resolve => { secondReady = resolve; });
    let count = 0;
    await page.route('**/api/v2/access/login', async route => {
      if (++count === 1) {
        const response = previous === 'Erfolg' ? await route.fetch() : undefined;
        firstReady(); await firstHeld;
        if (response) await route.fulfill({ response });
        else await route.fulfill({ status: 401, json: { code: 'SESSION_REJECTED' } });
      } else {
        const response = await route.fetch(); secondReady(); await secondHeld; await route.fulfill({ response });
      }
    });
    await page.goto('/anmelden');
    await page.getByLabel('E-Mail-Adresse', { exact: true }).fill(first);
    await page.getByLabel('Passwort', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Anmelden', exact: true }).click(); await firstSent;
    await page.evaluate(() => { const channel = new BroadcastChannel('tnbp-session'); channel.postMessage('ended'); channel.close(); });
    await expect(page.getByLabel('E-Mail-Adresse', { exact: true })).toHaveValue('');
    await expect(page.getByLabel('Passwort', { exact: true })).toHaveValue('');
    await page.getByLabel('E-Mail-Adresse', { exact: true }).fill(second);
    await page.getByLabel('Passwort', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
    releaseFirst(); await secondSent;
    await expect(page.getByRole('button', { name: 'Anmeldung läuft …', exact: true })).toBeDisabled();
    await expect(page.getByRole('status')).toHaveText('Anmeldung läuft …');
    await expect(page.getByLabel('E-Mail-Adresse', { exact: true })).toHaveValue(second);
    releaseSecond();
    await expect(page.getByText('Du bist angemeldet. Deine persönliche Monatsübersicht ist geöffnet.')).toBeVisible();
  });
}

test('Offline-Abmeldung schließt lokal und bietet den Widerrufs-Retry erst nach Wiederverbindung an', async ({ page, context, request }) => {
  await login(page, await account(request));
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Abmelden', exact: true }).click();
  await expect(page).toHaveURL('/anmelden');
  await expect(page.getByRole('status')).toContainText('Widerruf auf dem Server wurde nicht bestätigt');
  const retry = page.getByRole('button', { name: 'Abmeldung erneut versuchen', exact: true });
  await expect(retry).toBeDisabled();
  await context.setOffline(false);
  await expect(retry).toBeEnabled();
  await retry.click();
  await expect(page.getByRole('status')).toHaveText('Du wurdest abgemeldet.');
});

test('rote Abmeldung ist in beiden Hauptansichten per Touch bedienbar', async ({ browser, request }) => {
  const context = await browser.newContext({ baseURL: 'https://localhost:4200', ignoreHTTPSErrors: true,
    viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  try {
    const page = await context.newPage();
    const email = await account(request);
    for (const destination of ['Monat', 'Sparziele']) {
      await login(page, email);
      if (destination === 'Sparziele') {
        await page.getByRole('link', { name: 'Sparziele', exact: true }).tap();
        await expect(page.getByRole('heading', { name: 'Sparziele', exact: true })).toBeVisible();
      }
      await page.getByRole('button', { name: 'Abmelden', exact: true }).tap();
      await expect(page).toHaveURL('/anmelden');
      await expect(page.getByRole('status')).toHaveText('Du wurdest abgemeldet.');
    }
  } finally { await context.close(); }
});

test('unbestätigter Widerruf bleibt nach abgewiesenem Login sichtbar und wiederholbar', async ({ page, request }) => {
  const email = await account(request);
  await login(page, email);
  await page.route('**/api/v2/access/logout', route => route.fulfill({ status: 500, json: { code: 'SESSION_UNAVAILABLE' } }));
  await page.getByRole('button', { name: 'Abmelden', exact: true }).click();
  await expect(page.locator('#feedback')).toContainText('Widerruf auf dem Server wurde nicht bestätigt');
  await page.getByLabel('E-Mail-Adresse', { exact: true }).fill(email);
  await page.getByLabel('Passwort', { exact: true }).fill('Ein falsches Passwort');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.locator('#feedback')).toContainText('Anmeldung nicht möglich');
  await expect(page.locator('#feedback')).toContainText('Widerruf auf dem Server wurde nicht bestätigt');
  await expect(page.getByRole('button', { name: 'Abmeldung erneut versuchen', exact: true })).toBeEnabled();
  await page.unroute('**/api/v2/access/logout');
  await page.getByRole('button', { name: 'Abmeldung erneut versuchen', exact: true }).click();
  await expect(page.locator('#feedback')).toHaveText('Du wurdest abgemeldet.');
});

test('zwei Abmeldungen unter belegter Cookie-Sperre erhalten bei Generationenwechsel einen ehrlichen Retry', async ({ page, context, request }) => {
  await login(page, await account(request));
  const other = await context.newPage();
  await other.goto('/monat');
  await expect(other.getByRole('heading', { name: 'Monat', exact: true })).toBeVisible();
  const blocker = await context.newPage();
  await blocker.goto('/anmelden');
  const locked = blocker.evaluate(() => navigator.locks.request('tnbp-session-cookie', () => new Promise<void>(resolve => {
    (window as any).releaseCookieLock = resolve;
  })));
  await expect.poll(() => blocker.evaluate(() => !!(window as any).releaseCookieLock)).toBe(true);
  // Beide Klicks beginnen vor Zustellung der gegenseitigen Sitzungsende-Nachrichten.
  for (const tab of [page, other]) {
    await tab.evaluate(() => {
      const session = (window as any).ng.getComponent(document.querySelector('app-month')).session;
      const send = session.channel.postMessage.bind(session.channel);
      session.channel.postMessage = (message: string) => { (window as any).sendSessionEnd = () => send(message); };
    });
    await tab.getByRole('button', { name: 'Abmelden', exact: true }).click();
  }
  await Promise.all([page, other].map(tab => tab.evaluate(() => (window as any).sendSessionEnd())));
  for (const tab of [page, other]) {
    await expect(tab.locator('#feedback')).toContainText('anderen Tab');
    await expect(tab.getByRole('button', { name: 'Abmeldung läuft …', exact: true })).toBeDisabled();
  }
  await blocker.evaluate(() => (window as any).releaseCookieLock());
  await locked;
  for (const tab of [page, other]) {
    await expect(tab.locator('#feedback')).toContainText('Widerruf auf dem Server wurde nicht bestätigt');
    await expect(tab.getByRole('button', { name: 'Abmeldung erneut versuchen', exact: true })).toBeEnabled();
  }
  await page.getByRole('button', { name: 'Abmeldung erneut versuchen', exact: true }).click();
  await expect(page.locator('#feedback')).toHaveText('Du wurdest abgemeldet.');
  await other.goto('/monat');
  await expect(other).toHaveURL('/anmelden');
  expect((await context.cookies()).some(cookie => cookie.name === '__Host-tnbp-refresh')).toBe(false);
});

test('ein alter Fehlerfokus unterbricht keinen neuen Anmeldeversuch im selben Frame', async ({ page, request }) => {
  const email = await account(request);
  await page.goto('/anmelden');
  expect(await page.evaluate(email => {
    const component = (window as any).ng.getComponent(document.querySelector('app-login'));
    const original = window.requestAnimationFrame;
    const callbacks: FrameRequestCallback[] = [];
    window.requestAnimationFrame = callback => { callbacks.push(callback); return 0; };
    try {
      component.submit();
      component.email = email; component.password = '  Grüner 🦊 im Baum  ';
      (window as any).nextLogin = component.submit();
    } finally { window.requestAnimationFrame = original; }
    document.getElementById('email')!.focus();
    callbacks.forEach(callback => callback(performance.now()));
    return document.activeElement?.id;
  }, email)).toBe('email');
  await page.evaluate(() => (window as any).nextLogin);
  await expect(page.getByRole('heading', { name: 'Monat', exact: true })).toBeVisible();
});

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1280, height: 800 }]) {
  test(`Zugangsfehler, Offline, laufende Abmeldung und Retry bei 200-%-Text in ${viewport.width}×${viewport.height}`, async ({ page, context, request }) => {
    await page.setViewportSize(viewport);
    const email = await account(request);
    await page.goto('/anmelden');
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
    await expect(page.locator('#email-error')).toBeVisible();
    await expect(page.locator('#password-error')).toBeVisible();
    await context.setOffline(true);
    await expect(page.getByText('Du bist offline.', { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Anmelden', exact: true })).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await context.setOffline(false);
    await page.getByLabel('E-Mail-Adresse', { exact: true }).fill(email);
    await page.getByLabel('Passwort', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Monat', exact: true })).toBeVisible();
    let release!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    await page.route('**/api/v2/access/logout', async route => { await held; await route.fulfill({ status: 500, json: { code: 'SESSION_UNAVAILABLE' } }); });
    await page.getByRole('button', { name: 'Abmelden', exact: true }).click();
    const pending = page.getByRole('button', { name: 'Abmeldung läuft …', exact: true });
    await expect(pending).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    release();
    await expect(page.locator('#feedback')).toContainText('Widerruf auf dem Server wurde nicht bestätigt');
    const retry = page.getByRole('button', { name: 'Abmeldung erneut versuchen', exact: true });
    await retry.focus(); await expect(retry).toBeFocused();
    expect((await retry.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await context.setOffline(true); await expect(retry).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await context.setOffline(false); await page.unroute('**/api/v2/access/logout');
    await retry.click(); await expect(page.locator('#feedback')).toHaveText('Du wurdest abgemeldet.');
    await page.goto(`/registrieren#registrationToken=${'a'.repeat(43)}`);
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await page.getByLabel('E-Mail-Adresse', { exact: true }).fill('ungueltig');
    await page.getByLabel('Passwort', { exact: true }).fill('kurz');
    await page.getByRole('button', { name: 'Konto anlegen', exact: true }).click();
    await expect(page.locator('#email-error')).toBeVisible();
    await expect(page.locator('#password-error')).toBeVisible();
    await context.setOffline(true);
    await expect(page.getByRole('button', { name: 'Konto anlegen', exact: true })).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await context.setOffline(false);
    let registrationRelease!: () => void;
    const registrationHeld = new Promise<void>(resolve => { registrationRelease = resolve; });
    await page.route('**/api/v2/access/registrations', async route => {
      await registrationHeld; await route.fulfill({ status: 500, json: { code: 'SERVER_ERROR' } });
    });
    await page.getByLabel('E-Mail-Adresse', { exact: true }).fill(email);
    await page.getByLabel('Passwort', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Konto anlegen', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Konto wird angelegt …', exact: true })).toBeDisabled();
    registrationRelease();
    await expect(page.locator('#feedback')).toContainText('Ob dein Konto angelegt wurde, ist unklar');
    await expect(page.getByRole('link', { name: 'Zur Anmeldung', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}
