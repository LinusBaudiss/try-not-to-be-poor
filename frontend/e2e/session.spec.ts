import AxeBuilder from '@axe-core/playwright';
import { expect, test, Page, APIRequestContext } from '@playwright/test';

const password = '  Grüner 🦊 im Baum  ';
async function account(request: APIRequestContext): Promise<string> {
  const email = `session-${crypto.randomUUID()}@example.org`;
  expect((await request.post('http://127.0.0.1:8080/api/v1/access/registrations', {
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
  const renewed = page.waitForResponse('**/api/v1/access/refresh');
  await page.reload();
  expect((await renewed).status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Monat', exact: true })).toBeVisible();
  expect((await context.cookies()).find(cookie => cookie.name === '__Host-tnbp-refresh')!.value).not.toBe(old);
  const logout = page.waitForResponse('**/api/v1/access/logout');
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
  await page.route('**/api/v1/access/login', async route => { sends++; await held; await route.abort('failed'); });
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
  await page.unroute('**/api/v1/access/login');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Monat', exact: true })).toBeVisible();
});

test('fehlende oder falsche CSRF/Origin verändern eine bestehende Sitzung nicht', async ({ page, request }) => {
  await login(page, await account(request));
  const outcomes = await page.evaluate(async () => {
    const noHeader = await fetch('/api/v1/access/logout', { method: 'POST' });
    const badHeader = await fetch('/api/v1/access/refresh', { method: 'POST', headers: { 'X-CSRF-TOKEN': 'falsch' } });
    return [noHeader.status, badHeader.status];
  });
  expect(outcomes).toEqual([403, 403]);
  // Eine fremde Origin wird real durch den HTTP-Server geprüft; Browser verbieten deren Überschreiben.
  expect((await request.post('http://127.0.0.1:8080/api/v1/access/logout', { headers: { Origin: 'https://fremd.example' } })).status()).toBe(403);
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
  const renewed = page.waitForResponse('**/api/v1/access/refresh');
  await page.clock.fastForward(570_001);
  expect((await renewed).status()).toBe(200);
  expect(rotations).toBe(1);
  await page.route('**/api/v1/access/refresh', async route => { await route.fetch(); await route.abort('failed'); });
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
  await page.route('**/api/v1/access/refresh', async route => {
    const response = await route.fetch(); committed(); await held; await route.fulfill({ response });
  });
  await page.clock.fastForward(570_001); await ready;
  await page.getByRole('button', { name: 'Abmelden', exact: true }).click();
  await expect(page).toHaveURL('/anmelden');
  const loggedOut = page.waitForResponse('**/api/v1/access/logout');
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
  await page.route('**/api/v1/access/refresh', async route => {
    const response = await route.fetch(); committed(); await held; await route.fulfill({ response });
  });
  await page.clock.fastForward(570_001); await ready;
  await page.clock.fastForward(30_000);
  await expect(page).toHaveURL('/anmelden');
  await expect(page.getByRole('status')).toContainText('abgelaufen');
  const revoked = page.waitForResponse('**/api/v1/access/logout');
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
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 568 });
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
  await context.route('**/api/v1/access/refresh', async route => {
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
  await page.route('**/api/v1/access/refresh', async route => {
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
  await other.route(/\/api\/v1\/access\/(login|refresh)$/, async route => {
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
  const restored = other.waitForResponse('**/api/v1/access/refresh');
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
  const renewed = page.waitForResponse('**/api/v1/access/refresh');
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
  await page.route('**/api/v1/access/login', async route => {
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
  await page.route('**/api/v1/access/login', async route => {
    const response = await route.fetch(); committed(); await held; await route.fulfill({ response });
  });
  await page.goto('/anmelden');
  await page.getByLabel('E-Mail-Adresse', { exact: true }).fill(email);
  await page.getByLabel('Passwort', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await ready;
  await page.getByRole('link', { name: 'Eigenes Konto anlegen', exact: true }).click();
  await expect(page).toHaveURL('/registrieren');
  const revoked = page.waitForResponse('**/api/v1/access/logout');
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
  await page.route('**/api/v1/access/logout', async route => {
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
  await page.unroute('**/api/v1/access/logout');
  const response = page.waitForResponse('**/api/v1/access/logout');
  await page.getByRole('button', { name: 'Abmeldung erneut versuchen' }).click();
  expect((await response).status()).toBe(204);
  await expect(page.getByRole('status')).toHaveText('Du wurdest abgemeldet.');
});

test('geschützter Angular-Aufruf setzt Bearer und bündelt zwei 401 zu einer Erneuerung mit zwei Retries', async ({ page, request }) => {
  const initialRequest = page.waitForRequest('**/api/v1/access/me');
  await login(page, await account(request));
  expect((await initialRequest).headers()['authorization']).toMatch(/^Bearer /);
  const authorization: string[] = [];
  let renewals = 0, attempts = 0;
  page.on('request', request => { if (request.url().endsWith('/access/refresh')) renewals++; });
  await page.route('**/api/v1/access/me', async route => {
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
  await page.route('**/api/v1/access/me', async route => {
    const response = await route.fetch(); committed(); await held; await route.fulfill({ response });
  });
  const outcome = page.evaluate(async () => {
    const month = (window as any).ng.getComponent(document.querySelector('app-month'));
    return new Promise(resolve => month.http.get('/api/v1/access/me').subscribe({
      next: () => resolve({ accepted: true }),
      error: (failure: any) => resolve({ status: failure.status, statusText: failure.statusText })
    }));
  });
  await ready;
  const loggedOut = page.waitForResponse('**/api/v1/access/logout');
  await page.getByRole('button', { name: 'Abmelden', exact: true }).click();
  expect((await loggedOut).status()).toBe(204);
  release();
  expect(await outcome).toEqual({ status: 401, statusText: 'Sitzung beendet' });
  await expect(page.getByRole('status')).toHaveText('Du wurdest abgemeldet.');
});
