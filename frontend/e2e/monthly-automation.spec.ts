import AxeBuilder from '@axe-core/playwright';
import { expect, test, Page, APIRequestContext, Request } from '@playwright/test';

const password = '  Grüner 🦊 im Baum  ';
const endpoint = '**/api/v2/monthly-surplus';
const activationEndpoint = '**/api/v2/monthly-surplus/activation';
const selectionEndpoint = '**/api/v2/monthly-surplus/selection';
const activate = (page: Page) => page.getByRole('button', { name: 'Monatsautomatik ausdrücklich aktivieren', exact: true });
const reload = (page: Page) => page.getByRole('button', { name: 'Aktivierungszustand laden', exact: true });
function gate() { let release!: () => void; return { promise: new Promise<void>(resolve => { release = resolve; }), release: () => release() }; }
async function deliver(page: Page, release: () => void, paths: { path: string; method: string }[]): Promise<void> {
  const ended = new Map<Request, string | null>();
  const finished = (request: Request) => { ended.set(request, null); };
  const failed = (request: Request) => { ended.set(request, request.failure()?.errorText ?? 'Unbekannter Netzwerkfehler'); };
  // Vor Freigabe registrieren: Ein terminales Ereignis kann schon vor der Response-Fortsetzung eintreffen.
  page.on('requestfinished', finished); page.on('requestfailed', failed);
  try {
    const responses = paths.map(({ path, method }) => page.waitForResponse(response => response.url().endsWith(path) && response.request().method() === method));
    release();
    const delivered = await Promise.all(responses);
    await expect.poll(() => delivered.every(response => ended.has(response.request())), { message: 'Jede freigegebene Antwort erreicht ein terminales Netzwerkereignis' }).toBe(true);
    for (const response of delivered) {
      // Ein verworfener/ersetzter Angular-Abruf darf nach Empfang der Antwort abbrechen.
      // Response.finished() wird von Playwright nur bei requestfinished aufgelöst, nicht bei requestfailed.
      expect([null, 'net::ERR_ABORTED']).toContain(ended.get(response.request()));
    }
    // Nach Netzwerkende auch RxJS-Fortsetzungen und den anschließenden Angular-Render abwarten.
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  } finally {
    page.off('requestfinished', finished); page.off('requestfailed', failed);
  }
}
async function account(request: APIRequestContext): Promise<string> {
  const email = `automation-${crypto.randomUUID()}@example.org`;
  expect((await request.post('http://127.0.0.1:8080/api/v2/access/registrations', {
    data: { registrationToken: 'a'.repeat(43), email, password }
  })).status()).toBe(201);
  return email;
}
async function login(page: Page, email: string, expectAutomation = true): Promise<void> {
  if (new URL(page.url()).pathname !== '/anmelden') await page.goto('/anmelden');
  await page.getByLabel('E-Mail-Adresse', { exact: true }).fill(email);
  await page.getByLabel('Passwort', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Monat', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Sparziele', exact: true }).click();
  if (expectAutomation) await expect(page.getByRole('heading', { name: 'Monatsautomatik', exact: true })).toBeVisible();
}
async function accessibleAutomation(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  for (const control of await page.locator('.monthly-automation button:not(:disabled), .monthly-automation select:not(:disabled)').all()) {
    await control.focus(); await control.evaluate(element => element.scrollIntoView({ block: 'center' }));
    await expect(control).toBeFocused(); await expect(control).toHaveCSS('outline-style', 'solid');
    const measured = await control.evaluate(element => {
      const style = getComputedStyle(element), rect = element.getBoundingClientRect();
      let surface = element.parentElement!;
      while (getComputedStyle(surface).backgroundColor === 'rgba(0, 0, 0, 0)') surface = surface.parentElement!;
      const rgb = (color: string) => color.match(/[\d.]+/g)!.slice(0, 3).map(Number);
      const background = rgb(getComputedStyle(surface).backgroundColor), opacity = Number(style.opacity);
      const blend = (color: string) => rgb(color).map((value, index) => value * opacity + background[index] * (1 - opacity));
      const luminance = (color: number[]) => {
        const linear = color.map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
        return .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2];
      };
      const contrast = (color: string) => (Math.max(luminance(blend(color)), luminance(background)) + .05) / (Math.min(luminance(blend(color)), luminance(background)) + .05);
      const reach = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
      return { width: rect.width, height: rect.height, control: contrast(element.tagName === 'SELECT' ? style.borderTopColor : style.backgroundColor), focus: contrast(style.outlineColor),
        visible: rect.left - reach >= 0 && rect.right + reach <= innerWidth && rect.top - reach >= 0 && rect.bottom + reach <= innerHeight,
        unobscured: element.contains(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)) };
    });
    expect(measured.width).toBeGreaterThanOrEqual(44); expect(measured.height).toBeGreaterThanOrEqual(44);
    expect(measured.control).toBeGreaterThanOrEqual(3); expect(measured.focus).toBeGreaterThanOrEqual(3);
    expect(measured.visible).toBeTruthy(); expect(measured.unobscured).toBeTruthy();
  }
  const audit = await new AxeBuilder({ page }).include('.monthly-automation').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(audit.violations).toEqual([]);
}
test.beforeEach(async ({ request }) => {
  expect((await request.post('http://127.0.0.1:8081/clock', { data: '2026-10-31T22:59:59Z' })).ok()).toBeTruthy();
  expect((await request.post('http://127.0.0.1:8081/readiness', { data: 'true' })).ok()).toBeTruthy();
});
async function pendingAccount(request: APIRequestContext): Promise<string> {
  const email = await account(request);
  expect((await request.post('http://127.0.0.1:8081/pending-fixture', { data: email })).status()).toBe(204);
  return email;
}
const selection = (page: Page) => page.getByLabel('Ziel für Monatsüberschüsse', { exact: true });
const saveSelection = (page: Page) => page.getByRole('button', { name: 'Auswahl speichern', exact: true });
const pendingReload = (page: Page) => page.getByRole('button', { name: 'Vormerkung aktualisieren', exact: true });
const card = (page: Page, name = 'Vorhandenes Ziel') => page.locator('.savings-cards li').filter({ has: page.getByRole('heading', { name, exact: true }) });
async function choose(page: Page, name = 'Vorhandenes Ziel'): Promise<void> { await selection(page).selectOption({ label: name }); }
async function createGoal(page: Page, name: string): Promise<void> {
  await page.getByLabel('Name des Sparziels', { exact: true }).fill(name);
  await page.getByLabel('Zielbetrag in Euro', { exact: true }).fill('100');
  await page.getByRole('button', { name: 'Sparziel speichern', exact: true }).click();
  await expect(page.locator('#goal-status')).toContainText('gespeichert');
  await expect(page.locator('#goals-list-status')).toContainText('geladen');
}

test('Aktivierung ohne Ziel bleibt ausdrücklich und erhält ihren Erstmonat', async ({ page, request }) => {
  await login(page, await account(request)); await expect(activate(page)).toBeEnabled();
  await expect(selection(page)).toHaveCount(0); await activate(page).click();
  await expect(page.locator('#automation-state')).toContainText('aktiv seit Oktober 2026');
  await expect(page.locator('#pending-state')).toContainText('Vorgemerkt: 0,00 €');
  await expect(page.locator('.monthly-automation')).toContainText('Lege ein eigenes Sparziel an');
  await request.post('http://127.0.0.1:8081/clock', { data: '2026-11-01T12:00:00Z' });
  await page.reload(); await expect(page.locator('#automation-state')).toContainText('aktiv seit Oktober 2026');
  await createGoal(page, 'Berlin-Fahrt'); await expect(selection(page)).toHaveValue(''); await expect(saveSelection(page)).toBeDisabled();
});

test('Gemeinsamer Commit holt die Monatslücke nach und übernimmt 300 € auf 50 € genau einmal', async ({ page, request }) => {
  let oldReads = 0; page.on('request', item => { if (/monthly-surplus\/(activation|pending)$/.test(item.url()) && item.method() === 'GET') oldReads++; });
  await login(page, await pendingAccount(request));
  await expect(page.locator('#pending-state')).toHaveText('Vorgemerkt: 200,00 €');
  await expect(card(page)).toContainText('50,00 €'); await expect(selection(page)).toHaveValue('');
  await expect(page.locator('#saved-selection')).toHaveText('Kein Ziel ausgewählt'); await expect(saveSelection(page)).toBeDisabled();
  await expect(page.locator('#selection-effect')).toContainText('alle offenen Vormerkungen vollständig'); await expect(page.locator('#selection-effect')).toContainText('bereits zugeordnete Überschüsse bleiben');
  await choose(page); await expect(page.locator('#saved-selection')).toHaveText('Kein Ziel ausgewählt');
  const response = page.waitForResponse(r => r.url().endsWith('/monthly-surplus/selection') && r.request().method() === 'PUT');
  await saveSelection(page).click(); const committed = await response; expect(committed.status()).toBe(200); expect(committed.headers()['cache-control']).toBe('no-store');
  const body = await committed.json(); expect(Object.keys(body).sort()).toEqual(['active', 'activationMonth', 'currentMonth', 'goals', 'pendingCents', 'selectedGoalId'].sort());
  expect(body.pendingCents).toBe(0); expect(body.goals[0].progressCents).toBe(35000);
  await expect(card(page)).toContainText('350,00 €'); await expect(page.locator('#pending-state')).toHaveText('Vorgemerkt: 0,00 €');
  await expect(page.locator('#saved-selection')).toContainText('Vorhandenes Ziel'); await expect(page.locator('#selection-result')).toContainText('gemeinsam gespeichert');
  await expect(page.locator('#selection-result')).toBeFocused();
  await saveSelection(page).click(); await expect(card(page)).toContainText('350,00 €');
  await page.reload(); await expect(card(page)).toContainText('350,00 €'); expect(oldReads).toBe(0);
});

test('Ladefehler lässt manuelle Zielpflege ohne erfundene Automatikwerte erreichbar', async ({ page, request }) => {
  await page.route(endpoint, route => route.fulfill({ status: 500, json: { code: 'MONTHLY_SURPLUS_UNAVAILABLE', message: 'Nicht geladen' } }));
  await login(page, await pendingAccount(request));
  await expect(page.locator('#automation-state')).toContainText('konnte nicht geladen werden'); await expect(page.locator('#pending-state')).not.toContainText('0,00');
  await expect(selection(page)).toHaveCount(0);
  await card(page).getByRole('button', { name: 'Fortschritt aktualisieren: Vorhandenes Ziel', exact: true }).click();
  await page.getByLabel('Gesamtfortschritt in Euro', { exact: true }).fill('70');
  await page.getByRole('button', { name: 'Fortschritt speichern', exact: true }).click();
  await expect(card(page)).toContainText('70,00 €'); await expect(page.locator('#automation-state')).toContainText('konnte nicht geladen werden');
  await page.unroute(endpoint); await reload(page).click(); await expect(card(page)).toContainText('70,00 €'); await expect(page.locator('#pending-state')).toContainText('200,00');
});

test('Abgewiesene Authentifizierung eröffnet keinen Ersatz-Leseweg', async ({ page, request }) => {
  let fallback = 0; page.on('request', item => { if (item.url().endsWith('/api/v2/savings-goals') && item.method() === 'GET') fallback++; });
  await page.route(endpoint, route => route.fulfill({ status: 401, json: { code: 'SESSION_REJECTED', message: 'Abgewiesen' } }));
  await login(page, await account(request), false);
  await expect(page.getByRole('heading', { name: 'Anmelden', exact: true })).toBeVisible(); expect(fallback).toBe(0);
});

test('Auswahl offline und während des Vorgangs gesperrt; bestätigte Werte bleiben bis Commit', async ({ page, request, context }) => {
  await login(page, await pendingAccount(request)); await choose(page);
  await context.setOffline(true); await expect(saveSelection(page)).toBeDisabled(); await expect(selection(page)).toHaveValue(/.+/);
  await context.setOffline(false); await expect(saveSelection(page)).toBeEnabled();
  const held = gate(), started = gate(); let puts = 0;
  await page.route(selectionEndpoint, async route => { puts++; started.release(); await held.promise; await route.continue(); });
  await saveSelection(page).click(); await started.promise;
  await expect(page.getByRole('button', { name: 'Auswahl wird gespeichert …', exact: true })).toBeDisabled(); await expect(selection(page)).toBeDisabled();
  await expect(page.locator('#saved-selection')).toHaveText('Kein Ziel ausgewählt'); await expect(card(page)).toContainText('50,00 €'); await expect(page.locator('#pending-state')).toContainText('200,00'); expect(puts).toBe(1);
  await expect(card(page).getByRole('button', { name: 'Fortschritt aktualisieren: Vorhandenes Ziel', exact: true })).toBeEnabled();
  held.release(); await expect(page.locator('#pending-state')).toContainText('0,00'); await expect(card(page)).toContainText('350,00');
});

test('Grenzfehler erhält Auswahlentwurf und manuelle Reparatur braucht keinen Nachhollauf', async ({ page, request }) => {
  await login(page, await pendingAccount(request));
  await card(page).getByRole('button', { name: 'Fortschritt aktualisieren: Vorhandenes Ziel', exact: true }).click();
  await page.getByLabel('Gesamtfortschritt in Euro', { exact: true }).fill('90071992547409,91'); await page.getByRole('button', { name: 'Fortschritt speichern', exact: true }).click();
  await expect(page.locator('#goals-list-status')).toContainText('geladen'); await choose(page); const draft = await selection(page).inputValue();
  await saveSelection(page).click(); await expect(page.locator('#selection-result')).toContainText('Betragsgrenze');
  await expect(selection(page)).toHaveValue(draft); await expect(page.locator('#pending-state')).toContainText('200,00'); await expect(page.locator('#saved-selection')).toHaveText('Kein Ziel ausgewählt');
  await card(page).getByRole('button', { name: 'Fortschritt aktualisieren: Vorhandenes Ziel', exact: true }).click();
  await page.getByLabel('Gesamtfortschritt in Euro', { exact: true }).fill('50'); await page.getByRole('button', { name: 'Fortschritt speichern', exact: true }).click();
  await expect(saveSelection(page)).toBeEnabled(); await expect(selection(page)).toHaveValue(draft); await saveSelection(page).click(); await expect(card(page)).toContainText('350,00');
});

for (const committed of [false, true]) test(`Unbestätigte Auswahl ${committed ? 'mit' : 'ohne'} Commit verlangt gemeinsamen neuen Stand`, async ({ page, request }) => {
  await login(page, await pendingAccount(request)); await choose(page); const draft = await selection(page).inputValue(); let puts = 0;
  await page.route(selectionEndpoint, async route => { puts++; if (committed) expect((await route.fetch()).status()).toBe(200); await route.abort(); });
  await saveSelection(page).click(); await expect(page.locator('#selection-result')).toContainText('noch nicht bestätigt'); await expect(saveSelection(page)).toBeDisabled();
  await expect(selection(page)).toHaveValue(draft); expect(puts).toBe(1);
  await reload(page).click(); await expect(saveSelection(page)).toBeEnabled();
  await expect(card(page)).toContainText(committed ? '350,00' : '50,00'); await expect(page.locator('#pending-state')).toContainText(committed ? '0,00' : '200,00');
  await page.unroute(selectionEndpoint); await saveSelection(page).click(); await expect(card(page)).toContainText('350,00');
});

test('Sicherer Auswahlfehler lässt gespeicherte Werte und offenen Fortschrittsentwurf unverändert', async ({ page, request }) => {
  await login(page, await pendingAccount(request)); await choose(page);
  await card(page).getByRole('button', { name: 'Fortschritt aktualisieren: Vorhandenes Ziel', exact: true }).click();
  await page.getByLabel('Gesamtfortschritt in Euro', { exact: true }).fill('17,31');
  await page.route(selectionEndpoint, route => route.fulfill({ status: 409, json: { code: 'FEATURE_NOT_AVAILABLE', message: 'Gesperrt' } }));
  await saveSelection(page).click(); await expect(page.locator('#selection-result')).toContainText('nicht gespeichert');
  await expect(page.getByLabel('Gesamtfortschritt in Euro', { exact: true })).toHaveValue('17,31'); await expect(card(page)).toContainText('50,00'); await expect(page.locator('#pending-state')).toContainText('200,00');
});

test('Manueller Commit entkräftet eine ältere Übersicht und erhält Auswahlentwurf', async ({ page, request }) => {
  await login(page, await pendingAccount(request)); await choose(page); const draft = await selection(page).inputValue();
  await card(page).getByRole('button', { name: 'Fortschritt aktualisieren: Vorhandenes Ziel', exact: true }).click();
  await page.getByLabel('Gesamtfortschritt in Euro', { exact: true }).fill('70');
  // Ein noch ausstehender Auswahlaufruf sperrt unabhängige manuelle Korrektur nicht.
  const held = gate(), committed = gate();
  await page.route(selectionEndpoint, async route => { const response = await route.fetch(); committed.release(); await held.promise; await route.fulfill({ response }); });
  await saveSelection(page).click(); await committed.promise;
  await page.getByRole('button', { name: 'Fortschritt speichern', exact: true }).click();
  await expect(page.locator('#goal-progress-status')).toContainText('70,00');
  await deliver(page, held.release, [{ path: '/monthly-surplus/selection', method: 'PUT' }]);
  await expect(card(page)).toContainText('70,00'); await expect(page.locator('#pending-state')).toContainText('0,00'); await expect(selection(page)).toHaveValue(draft);
});

test('Späte Auswahlantwort nach Kontowechsel bringt weder Werte noch Auswahl zurück', async ({ page, request }) => {
  const second = await account(request), first = await pendingAccount(request); await login(page, first); await choose(page);
  const held = gate(), committed = gate();
  await page.route(selectionEndpoint, async route => { const response = await route.fetch(); committed.release(); await held.promise; await route.fulfill({ response }); });
  await saveSelection(page).click(); await committed.promise;
  await expect(page.locator('#pending-state')).toContainText('200,00');
  const draft = await selection(page).inputValue();
  expect(await page.evaluate(() => {
    const panel = (window as any).ng.getComponent(document.querySelector('app-monthly-automation'));
    (window as any).loadedOldAutomationPanel = panel;
    return { pending: panel.state()?.pendingCents, draft: panel.draft() };
  })).toEqual({ pending: 20000, draft });
  await page.getByRole('button', { name: 'Abmelden', exact: true }).click(); await expect(page.getByRole('heading', { name: 'Anmelden', exact: true })).toBeVisible();
  expect(await page.evaluate(() => {
    const panel = (window as any).loadedOldAutomationPanel;
    return { state: panel.state(), draft: panel.draft() };
  })).toEqual({ state: null, draft: null });
  await login(page, second); await deliver(page, held.release, [{ path: '/monthly-surplus/selection', method: 'PUT' }]);
  await expect(page.locator('#automation-state')).toContainText('noch nicht aktiviert'); await expect(page.locator('.savings-cards')).toHaveCount(0); await expect(page.locator('#selection-result')).toBeEmpty();
  expect(await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }))).toEqual({ local: [], session: [] });
});

test('Rückkehr und Monatswechsel laden einen gemeinsamen Stand ohne Entwurfsverlust', async ({ page, request }) => {
  await page.clock.install(); const email = await pendingAccount(request); let reads = 0;
  await page.route(endpoint, async route => { reads++; const response = await route.fetch(); await route.fulfill({ response, headers: { ...response.headers(), date: 'Thu, 31 Dec 2026 22:59:59 GMT' } }); });
  await login(page, email); await choose(page); const draft = await selection(page).inputValue();
  await card(page).getByRole('button', { name: 'Fortschritt aktualisieren: Vorhandenes Ziel', exact: true }).click(); await page.getByLabel('Gesamtfortschritt in Euro', { exact: true }).fill('17,31');
  expect((await request.post('http://127.0.0.1:8081/close-month', { data: email + '\n2026-11-01' })).status()).toBe(204);
  const before = reads; await page.clock.fastForward(2_001); await expect(page.locator('#pending-state')).toContainText('300,00'); expect(reads).toBeGreaterThan(before);
  await expect(selection(page)).toHaveValue(draft); await expect(page.getByLabel('Gesamtfortschritt in Euro', { exact: true })).toHaveValue('17,31');
});

test('Monatswechsel während gehaltener Auswahl wird nach sicherer Ablehnung frisch gelesen', async ({ page, request }) => {
  await page.clock.install(); const email = await pendingAccount(request); let reads = 0;
  let date = 'Thu, 31 Dec 2026 22:59:59 GMT';
  await page.route(endpoint, async route => { reads++; const response = await route.fetch(); await route.fulfill({ response, headers: { ...response.headers(), date } }); });
  await login(page, email); await choose(page); const draft = await selection(page).inputValue();
  const held = gate(), started = gate();
  await page.route(selectionEndpoint, async route => { started.release(); await held.promise; await route.fulfill({ status: 409, json: { code: 'AMOUNT_LIMIT_EXCEEDED', message: 'Grenze' } }); });
  await saveSelection(page).click(); await started.promise; const before = reads;
  await closeNovember(request, email); date = 'Thu, 31 Dec 2026 23:00:01 GMT';
  await page.clock.fastForward(2_001); expect(reads).toBe(before);
  await deliver(page, held.release, [{ path: '/monthly-surplus/selection', method: 'PUT' }]);
  await expect(page.locator('#selection-result')).toContainText('Betragsgrenze');
  await page.clock.fastForward(1_001);
  await expect(page.locator('#pending-state')).toContainText('300,00'); expect(reads).toBeGreaterThan(before);
  await expect(selection(page)).toHaveValue(draft); await expect(card(page)).toContainText('50,00');
});

for (const mutation of ['Aktivierung', 'Auswahl']) test(`Fortbestehende 401 nach ${mutation} leert Sitzung und Entwürfe ohne Ersatz-Leseweg`, async ({ page, request }) => {
  await login(page, mutation === 'Auswahl' ? await pendingAccount(request) : await account(request));
  await page.getByLabel('Name des Sparziels', { exact: true }).fill('Privater Entwurf');
  await page.getByLabel('Zielbetrag in Euro', { exact: true }).fill('17,31');
  if (mutation === 'Auswahl') {
    await choose(page);
    await card(page).getByRole('button', { name: 'Fortschritt aktualisieren: Vorhandenes Ziel', exact: true }).click();
    await page.getByLabel('Gesamtfortschritt in Euro', { exact: true }).fill('19,73');
  }
  await page.evaluate(() => { (window as any).rejectedSavings = (window as any).ng.getComponent(document.querySelector('app-savings-goals')); });
  let fallback = 0, attempts = 0, refreshes = 0;
  page.on('request', item => {
    if (item.url().endsWith('/api/v2/savings-goals') && item.method() === 'GET') fallback++;
    if (item.url().endsWith('/access/refresh') && item.method() === 'POST') refreshes++;
  });
  await page.route(mutation === 'Auswahl' ? selectionEndpoint : activationEndpoint, route => { attempts++; return route.fulfill({ status: 401, json: { code: 'SESSION_REJECTED', message: 'Abgewiesen' } }); });
  await (mutation === 'Auswahl' ? saveSelection(page) : activate(page)).click();
  await expect(page.getByRole('heading', { name: 'Anmelden', exact: true })).toBeVisible();
  expect(attempts).toBe(2); expect(refreshes).toBe(1); expect(fallback).toBe(0);
  expect(await page.evaluate(() => {
    const old = (window as any).rejectedSavings;
    return { user: old.session.userId(), token: old.session.token(), overview: old.overview(), items: old.items(), draft: old.selectionDraft(), name: old.name, amount: old.amount, progress: old.progressAmount, editing: old.editing() };
  })).toEqual({ user: null, token: null, overview: null, items: [], draft: null, name: '', amount: '', progress: '', editing: null });
});

test('Bestätigt gelöschtes Entwurfsziel wird verworfen und erfordert eigene neue Auswahl', async ({ page, request }) => {
  await login(page, await pendingAccount(request)); await createGoal(page, 'Eigenes Ersatzziel'); await choose(page);
  let puts = 0;
  page.on('request', item => { if (item.url().endsWith('/monthly-surplus/selection') && item.method() === 'PUT') puts++; });
  await card(page).getByRole('button', { name: 'Sparziel löschen: Vorhandenes Ziel', exact: true }).click();
  await page.getByRole('button', { name: 'Endgültig löschen', exact: true }).click();
  await expect(selection(page)).toHaveValue(''); await expect(saveSelection(page)).toBeDisabled();
  expect(await page.evaluate(() => (window as any).ng.getComponent(document.querySelector('app-savings-goals')).selectionDraft())).toBe('');
  await selection(page).evaluate(element => (element.closest('form') as HTMLFormElement).requestSubmit());
  expect(puts).toBe(0); await expect(page.locator('#pending-state')).toContainText('200,00');
  await choose(page, 'Eigenes Ersatzziel'); await expect(saveSelection(page)).toBeEnabled(); await saveSelection(page).click();
  await expect(page.locator('#saved-selection')).toContainText('Eigenes Ersatzziel'); await expect(page.locator('#pending-state')).toContainText('0,00');
  await expect(card(page, 'Eigenes Ersatzziel')).toContainText('300,00'); expect(puts).toBe(1);
});

for (const kind of ['Anlage', 'Zielbearbeitung', 'Fortschritt', 'signierter Fortschritt']) test(`Sichere manuelle Ablehnung bei ${kind} erneuert die unabhängige Automatik und erhält Entwürfe`, async ({ page, request }) => {
  await login(page, await pendingAccount(request)); await choose(page); const draft = await selection(page).inputValue();
  const progress = kind.includes('Fortschritt'); let reads = 0;
  page.on('request', item => { if (item.url().endsWith('/api/v2/monthly-surplus') && item.method() === 'GET') reads++; });
  await page.route('**/api/v2/savings-goals' + (kind === 'Anlage' ? '' : progress ? '/*/progress' : '/*'), route => route.fulfill({
    status: kind === 'signierter Fortschritt' ? 409 : 400,
    json: kind === 'signierter Fortschritt' ? { code: 'FEATURE_NOT_AVAILABLE', message: 'Gesperrt' } : { code: 'INVALID_GOAL', fieldErrors: { name: 'Abgewiesen', progressCents: 'Abgewiesen' }, message: 'Abgewiesen' }
  }));
  if (kind === 'Anlage') {
    await page.getByLabel('Name des Sparziels', { exact: true }).fill('Erhaltener Entwurf');
    await page.getByLabel('Zielbetrag in Euro', { exact: true }).fill('17,31'); await page.getByRole('button', { name: 'Sparziel speichern', exact: true }).click();
    await expect(page.locator('#goal-status')).toContainText('nicht gespeichert');
    await expect(page.getByLabel('Name des Sparziels', { exact: true })).toHaveValue('Erhaltener Entwurf');
    await expect(page.getByLabel('Zielbetrag in Euro', { exact: true })).toHaveValue('17,31');
  } else if (progress) {
    await card(page).getByRole('button', { name: 'Fortschritt aktualisieren: Vorhandenes Ziel', exact: true }).click();
    const value = kind === 'signierter Fortschritt' ? '-17,31' : '17,31';
    await page.getByLabel('Gesamtfortschritt in Euro', { exact: true }).fill(value); await page.getByRole('button', { name: 'Fortschritt speichern', exact: true }).click();
    await expect(page.locator('#goal-progress-status')).toContainText('nicht gespeichert');
    await expect(page.getByLabel('Gesamtfortschritt in Euro', { exact: true })).toHaveValue(value);
  } else {
    await card(page).getByRole('button', { name: 'Sparziel bearbeiten: Vorhandenes Ziel', exact: true }).click();
    await page.getByLabel('Name des Sparziels bearbeiten', { exact: true }).fill('Erhaltener Entwurf');
    await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
    await expect(page.locator('#goal-mutation-status')).toContainText('nicht geändert');
    await expect(page.getByLabel('Name des Sparziels bearbeiten', { exact: true })).toHaveValue('Erhaltener Entwurf');
  }
  await expect(page.locator('#pending-state')).toContainText('200,00'); expect(reads).toBeGreaterThan(0);
  await expect(selection(page)).toHaveValue(draft); await expect(saveSelection(page)).toBeEnabled(); await expect(card(page)).toContainText('50,00');
  expect(await page.evaluate(() => (window as any).ng.getComponent(document.querySelector('app-savings-goals')).uncertain())).toBe(false);
});

test('Nach initialem Übersichtfehler erholter gemeinsamer Stand merkt Serverzeit für folgenden Monatswechsel', async ({ page, request }) => {
  await page.clock.install(); const email = await pendingAccount(request); let reads = 0;
  await page.route(endpoint, route => route.fulfill({ status: 500, json: { code: 'MONTHLY_SURPLUS_UNAVAILABLE', message: 'Nicht geladen' } }));
  await login(page, email); await expect(page.locator('#pending-state')).toContainText('konnte nicht geladen werden'); await expect(card(page)).toContainText('50,00');
  await page.unroute(endpoint); let date = 'Thu, 31 Dec 2026 22:59:59 GMT';
  await page.route(endpoint, async route => { reads++; const response = await route.fetch(); await route.fulfill({ response, headers: { ...response.headers(), date } }); });
  await card(page).getByRole('button', { name: 'Fortschritt aktualisieren: Vorhandenes Ziel', exact: true }).click();
  await page.getByLabel('Gesamtfortschritt in Euro', { exact: true }).fill('70'); await page.getByRole('button', { name: 'Fortschritt speichern', exact: true }).click();
  await expect(page.locator('#pending-state')).toContainText('200,00'); await expect(card(page)).toContainText('70,00'); const before = reads;
  await closeNovember(request, email); date = 'Thu, 31 Dec 2026 23:00:01 GMT'; await page.clock.fastForward(2_001);
  await expect(page.locator('#pending-state')).toContainText('300,00'); expect(reads).toBeGreaterThan(before); await expect(card(page)).toContainText('70,00');
});

for (const mismatch of ['anderes eigenes Ziel', 'offene Vormerkung']) test(`Strukturell gültige Auswahlbestätigung mit ${mismatch} verlangt erfolgreichen gemeinsamen Prüfstand vor Wiederholung`, async ({ page, request }) => {
  await login(page, await pendingAccount(request)); await createGoal(page, 'Anderes eigenes Ziel'); await choose(page); const draft = await selection(page).inputValue();
  const before = await page.evaluate(() => (window as any).ng.getComponent(document.querySelector('app-savings-goals')).overview());
  const other = before.goals.find((goal: { id: string }) => goal.id !== draft).id;
  let puts = 0; page.on('request', item => { if (item.url().endsWith('/monthly-surplus/selection') && item.method() === 'PUT') puts++; });
  await page.route(selectionEndpoint, route => route.fulfill({ json: { ...before, selectedGoalId: mismatch === 'anderes eigenes Ziel' ? other : draft, pendingCents: mismatch === 'offene Vormerkung' ? 1 : 0 } }));
  await saveSelection(page).click(); await expect(page.locator('#selection-result')).toContainText('noch nicht bestätigt'); await expect(saveSelection(page)).toBeDisabled();
  await expect(selection(page)).toHaveValue(draft); await expect(page.locator('#saved-selection')).toHaveText('Kein Ziel ausgewählt');
  await expect(page.locator('#pending-state')).toContainText('200,00'); await expect(card(page)).toContainText('50,00');
  expect(await page.evaluate(() => (window as any).ng.getComponent(document.querySelector('app-savings-goals')).overview())).toEqual(before);
  await page.route(endpoint, route => route.fulfill({ status: 500, json: { code: 'MONTHLY_SURPLUS_UNAVAILABLE', message: 'Nicht geladen' } }));
  await reload(page).click(); await expect(page.locator('#pending-state')).toContainText('konnte nicht geladen werden');
  await expect(page.locator('.monthly-automation')).toContainText('Speicherung noch nicht bestätigt'); expect(puts).toBe(1);
  await page.unroute(endpoint); await reload(page).click(); await expect(saveSelection(page)).toBeEnabled(); await expect(selection(page)).toHaveValue(draft);
  await expect(page.locator('#pending-state')).toContainText('200,00'); await expect(card(page)).toContainText('50,00'); expect(puts).toBe(1);
  await page.unroute(selectionEndpoint); await saveSelection(page).click(); await expect(card(page)).toContainText('350,00'); expect(puts).toBe(2);
});

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1280, height: 800 }]) {
  test(`Auswahl, gemeinsame 350-/0-Anzeige und 200 % Text bei ${viewport.width}×${viewport.height}`, async ({ page, request }) => {
    const longName = 'Berlin-Fahrt mit der Familie und ein sehr langes eigenes Sparziel für die gemeinsame Sommerreise';
    await page.setViewportSize(viewport); await login(page, await pendingAccount(request));
    await card(page).getByRole('button', { name: 'Sparziel bearbeiten: Vorhandenes Ziel', exact: true }).click();
    await page.getByLabel('Name des Sparziels bearbeiten', { exact: true }).fill(longName);
    await page.getByLabel('Zielbetrag in Euro bearbeiten', { exact: true }).fill('100');
    await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
    await expect(page.locator('#goal-mutation-status')).toContainText('geändert'); await choose(page, longName);
    await page.evaluate(() => document.documentElement.style.fontSize = '200%'); await accessibleAutomation(page);
    await selection(page).focus(); await page.keyboard.press('Tab'); await expect(saveSelection(page)).toBeFocused(); await page.keyboard.press('Enter');
    await expect(card(page, longName)).toContainText('350,00'); await expect(page.locator('#pending-state')).toContainText('0,00'); await accessibleAutomation(page);
    await expect(card(page, longName)).toContainText('350 %');
    expect(await card(page, longName).locator('.savings-progress span').evaluate(element => (element as HTMLElement).style.width)).toBe('100%');
    await page.screenshot({ path: `test-results/monthly-selection-${viewport.width}.png`, fullPage: true });
    await selection(page).focus();
    await selection(page).evaluate(element => element.scrollIntoView({ block: 'center' }));
    await page.screenshot({ path: `test-results/monthly-selection-${viewport.width}-viewport.png`, fullPage: false });
    await card(page, longName).getByRole('button', { name: 'Fortschritt aktualisieren: ' + longName, exact: true }).click();
    await page.getByLabel('Gesamtfortschritt in Euro', { exact: true }).fill('-30'); await page.getByRole('button', { name: 'Fortschritt speichern', exact: true }).click();
    await expect(card(page, longName)).toContainText('−30,00'); await expect(card(page, longName)).toContainText('−30 %'); await expect(card(page, longName).locator('.savings-progress span')).toHaveCSS('width', '0px');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await expect(page.locator('.monthly-automation')).not.toContainText('Europe/Berlin');
    await page.route(endpoint, async route => {
      const response = await route.fetch(), body = await response.json(); body.pendingCents = 9007199254740991;
      await route.fulfill({ response, json: body });
    });
    await pendingReload(page).click(); await expect(page.locator('#pending-state')).toContainText('90.071.992.547.409,91'); await accessibleAutomation(page);
    await page.unroute(endpoint);
    await page.route(endpoint, route => route.fulfill({ status: 500, json: { code: 'MONTHLY_SURPLUS_UNAVAILABLE', message: 'Ladefehler' } }));
    await pendingReload(page).click(); await expect(page.locator('#pending-state')).toContainText('konnte nicht geladen werden'); await accessibleAutomation(page);
    await expect(card(page, longName).getByRole('button', { name: 'Fortschritt aktualisieren: ' + longName, exact: true })).toBeEnabled();
  });
}

test('Fehlende und ungültige Capabilityfelder öffnen keine Aktivierung; Fehler bleiben erneut prüfbar', async ({ page, request }) => {
  await login(page, await account(request)); await expect(activate(page)).toBeEnabled();
  for (const value of [undefined, 'true', 1, null]) {
    await page.route('**/api/v2/capabilities', route => route.fulfill({ json: { signedProgressAvailable: false, ...(value === undefined ? {} : { monthlyAutomationAvailable: value }) } }));
    await page.getByRole('button', { name: 'Verfügbarkeit der Monatsautomatik prüfen', exact: true }).click();
    await expect(page.locator('#automation-capability')).toContainText('derzeit nicht verfügbar'); await expect(activate(page)).toHaveCount(0);
    await page.unroute('**/api/v2/capabilities');
  }
  await page.route('**/api/v2/capabilities', route => route.fulfill({ status: 500, json: { code: 'CAPABILITIES_UNAVAILABLE', message: 'Nicht bestätigt' } }));
  await page.getByRole('button', { name: 'Verfügbarkeit der Monatsautomatik prüfen', exact: true }).click();
  await expect(page.locator('#automation-capability')).toContainText('konnte nicht geprüft werden'); await expect(activate(page)).toHaveCount(0);
  await page.unroute('**/api/v2/capabilities'); await page.getByRole('button', { name: 'Verfügbarkeit der Monatsautomatik prüfen', exact: true }).click(); await expect(activate(page)).toBeEnabled();
});


test('Offline wird nichts gesendet und während der Aktivierung ist Doppelsenden gesperrt', async ({ page, request, context }) => {
  await login(page, await account(request)); await expect(activate(page)).toBeEnabled();
  let posts = 0; page.on('request', item => { if (item.url().endsWith('/monthly-surplus/activation') && item.method() === 'POST') posts++; });
  await context.setOffline(true); await expect(activate(page)).toBeDisabled();
  await expect(page.locator('.monthly-automation')).toContainText('Die Aktivierung ist offline gesperrt'); expect(posts).toBe(0);
  await context.setOffline(false);
  const held = gate(), ready = gate();
  await page.route(activationEndpoint, async route => { if (route.request().method() === 'POST') { ready.release(); await held.promise; await route.continue(); } else await route.continue(); });
  await activate(page).click(); await ready.promise;
  await expect(page.getByRole('button', { name: 'Aktivierung wird gespeichert …', exact: true })).toBeDisabled(); await expect(reload(page)).toBeDisabled();
  expect(posts).toBe(1); held.release(); await expect(page.locator('#automation-state')).toContainText('aktiv seit Oktober 2026');
});

test('Sicher abgewiesene Aktivierung meldet keinen Erfolg und lässt gespeicherten Zustand erhalten', async ({ page, request }) => {
  await login(page, await account(request)); await expect(activate(page)).toBeEnabled();
  await request.post('http://127.0.0.1:8081/readiness', { data: 'false' });
  await activate(page).click(); await expect(page.locator('#automation-result')).toContainText('nicht gespeichert');
  await expect(page.locator('#automation-capability')).toContainText('derzeit nicht verfügbar');
  await reload(page).click(); await expect(page.locator('#automation-state')).toContainText('noch nicht aktiviert');
  await expect(page.locator('.monthly-automation')).not.toContainText('wurde aktiviert');
});


for (const ending of ['Abmeldung', 'Ablauf', 'Kontowechsel']) test(`Späte Zustands- und Capabilityantworten geben nach ${ending} keine alten Kontodaten frei`, async ({ page, request, context }) => {
  if (ending === 'Ablauf') await page.clock.install();
  const second = await account(request), first = await pendingAccount(request);
  await login(page, first); await expect(page.locator('#pending-state')).toContainText('200,00'); await choose(page);
  await card(page).getByRole('button', { name: 'Fortschritt aktualisieren: Vorhandenes Ziel', exact: true }).click();
  await page.getByLabel('Gesamtfortschritt in Euro', { exact: true }).fill('123,45');
  const refreshHeld = gate(), refreshReady = gate(), refreshDelivered = gate();
  if (ending === 'Ablauf') {
    await page.route('**/api/v2/access/refresh', async route => {
      const response = await route.fetch(); refreshReady.release(); await refreshHeld.promise;
      await route.fulfill({ response }); refreshDelivered.release();
    });
    await page.clock.fastForward(570_001); await refreshReady.promise;
    // Die Automatikabrufe erst kurz vor dem echten Ablauf starten, damit ihre eigenen 30-s-Fristen nicht vorher enden.
    await page.clock.fastForward(20_000);
  }
  const held = gate(), stateReady = gate(), capabilityReady = gate();
  let hold = true;
  await page.route(endpoint, async route => {
    if (!hold) { await route.continue(); return; } const response = await route.fetch(); stateReady.release(); await held.promise; await route.fulfill({ response });
  });
  await page.route('**/api/v2/capabilities', async route => {
    if (!hold) { await route.continue(); return; } const response = await route.fetch(); capabilityReady.release(); await held.promise; await route.fulfill({ response });
  });
  await reload(page).click(); await page.getByRole('button', { name: 'Verfügbarkeit der Monatsautomatik prüfen', exact: true }).click(); await Promise.all([stateReady.promise, capabilityReady.promise]);
  await page.evaluate(() => { (window as any).oldAutomation = (window as any).ng.getComponent(document.querySelector('app-savings-goals')); (window as any).oldAutomationPanel = (window as any).ng.getComponent(document.querySelector('app-monthly-automation')); });
  if (ending === 'Abmeldung') await page.getByRole('button', { name: 'Abmelden', exact: true }).click();
  else if (ending === 'Ablauf') {
    const revoked = page.waitForResponse('**/api/v2/access/logout');
    const refreshEnded = page.waitForEvent('requestfailed', item => item.url().endsWith('/access/refresh'));
    await page.clock.fastForward(10_000);
    await expect(page.getByRole('heading', { name: 'Anmelden', exact: true })).toBeVisible();
    await expect(page.getByRole('status')).toContainText('abgelaufen');
    await refreshEnded; refreshHeld.release(); await refreshDelivered.promise;
    expect((await revoked).status()).toBe(204); expect(await (await revoked).finished()).toBeNull();
    await page.unroute('**/api/v2/access/refresh');
  }
  else { const other = await context.newPage(); await login(other, second); await other.close(); }
  await expect(page.getByRole('heading', { name: 'Anmelden', exact: true })).toBeVisible();
  hold = false; await request.post('http://127.0.0.1:8081/readiness', { data: 'false' });
  await login(page, second); await expect(page.locator('#automation-state')).toContainText('noch nicht aktiviert');
  await expect(page.locator('#automation-capability')).toContainText('derzeit nicht verfügbar');
  await deliver(page, held.release, [{ path: '/monthly-surplus', method: 'GET' }, { path: '/capabilities', method: 'GET' }]);
  await expect(page.locator('#automation-state')).toContainText('noch nicht aktiviert'); await expect(activate(page)).toHaveCount(0);
  expect(await page.evaluate(() => { const old = (window as any).oldAutomation; return { state: old.overview(), result: old.activationResult(), load: old.overviewState(), items: old.items(), progress: old.progressAmount }; })).toEqual({ state: null, result: '', load: 'unknown', items: [], progress: '' });
  expect(await page.evaluate(() => { const old = (window as any).oldAutomationPanel; return { state: old.state(), draft: old.draft() }; })).toEqual({ state: null, draft: null });
});


test('Reconnect ersetzt eine noch laufende alte Vormerkungsantwort durch eine neue Abfrage', async ({ page, request, context }) => {
  const email = await pendingAccount(request); await login(page, email); await expect(page.locator('#pending-state')).toContainText('200,00');
  const old = gate(), oldReady = gate(), fresh = gate(), freshReady = gate(); let calls = 0;
  await page.route(endpoint, async route => {
    const attempt = ++calls, response = await route.fetch();
    const ready = attempt === 1 ? oldReady : freshReady, waiting = attempt === 1 ? old : fresh;
    ready.release(); await waiting.promise; await route.fulfill({ response });
  });
  await pendingReload(page).click(); await oldReady.promise; await pendingLoading(page);
  await context.setOffline(true); await closeNovember(request, email); await context.setOffline(false);
  await freshReady.promise; expect(calls).toBe(2); await pendingLoading(page);
  await deliver(page, fresh.release, [{ path: '/monthly-surplus', method: 'GET' }]);
  await expect(page.locator('#pending-state')).toContainText('300,00');
  await deliver(page, old.release, [{ path: '/monthly-surplus', method: 'GET' }]);
  await expect(page.locator('#pending-state')).toContainText('300,00');
});


for (const prior of ['inaktiv', 'nicht geladen']) test(`Rückkehr erkennt die Aktivierung aus einem anderen Tab bei zuvor ${prior}`, async ({ page, request, context }) => {
  const email = await account(request);
  if (prior === 'nicht geladen') await page.route(endpoint, route => route.fulfill({ status: 500, json: { code: 'MONTHLY_SURPLUS_UNAVAILABLE', message: 'Nicht geladen' } }));
  await login(page, email);
  await expect(page.locator('#automation-state')).toContainText(prior === 'inaktiv' ? 'noch nicht aktiviert' : 'konnte nicht geladen werden');
  const other = await context.newPage();
  try {
    await other.goto('/sparziele'); await expect(activate(other)).toBeEnabled();
    await activate(other).click(); await expect(other.locator('#automation-state')).toContainText('aktiv seit Oktober 2026');
    if (prior === 'nicht geladen') await page.unroute(endpoint);
    await page.bringToFront();
    // Beide Browser-Rückkehrsignale verwenden dieselbe Aktualisierung.
    await page.evaluate(() => { dispatchEvent(new Event('focus')); document.dispatchEvent(new Event('visibilitychange')); });
    await expect(page.locator('#automation-state')).toContainText('aktiv seit Oktober 2026');
    await expect(page.locator('#pending-state')).toHaveText('Vorgemerkt: 0,00 €');
    await expect(activate(page)).toHaveCount(0);
  } finally { await other.close(); }
});

async function closeNovember(request: APIRequestContext, email: string): Promise<void> {
  expect((await request.post('http://127.0.0.1:8081/close-month', { data: email + '\n2026-11-01' })).status()).toBe(204);
}
async function pendingLoading(page: Page): Promise<void> {
  await expect(page.locator('#pending-state')).toContainText('wird geladen');
  await expect(page.locator('#pending-state')).not.toContainText('Vorgemerkt:');
}

for (const candidate of [
  { active: false, activationMonth: null }, {}, { active: true }, { active: false, activationMonth: '2026-10-01' },
  { active: true, activationMonth: null }, { active: 'true', activationMonth: '2026-10-01' },
  { active: true, activationMonth: '2026-10-02' }, { active: true, activationMonth: '2026-10-01', diagnostic: 'fremd' }
]) test(`Ungültige Aktivierungsantwort ${JSON.stringify(candidate)} gibt keinen Erfolg frei`, async ({ page, request }) => {
  await login(page, await account(request)); await expect(activate(page)).toBeEnabled();
  await page.route(activationEndpoint, route => route.fulfill({ status: 200, json: candidate }));
  await activate(page).click(); await expect(page.locator('#automation-result')).toContainText('nicht bestätigt'); await expect(activate(page)).toBeDisabled();
  await reload(page).click(); await expect(activate(page)).toBeEnabled();
  await expect(page.locator('#automation-state')).toContainText('noch nicht aktiviert');
});

for (const committed of [false, true]) test(`Unbestätigte Aktivierung ${committed ? 'mit' : 'ohne'} Commit wird vor Wiederholung neu gelesen`, async ({ page, request }) => {
  await login(page, await account(request)); await expect(activate(page)).toBeEnabled();
  await page.route(activationEndpoint, async route => { if (committed) await route.fetch(); await route.abort(); });
  await activate(page).click(); await expect(page.locator('#automation-result')).toContainText('nicht bestätigt'); await expect(activate(page)).toBeDisabled();
  await request.post('http://127.0.0.1:8081/clock', { data: '2026-11-01T12:00:00Z' });
  await reload(page).click();
  if (committed) await expect(page.locator('#automation-state')).toContainText('aktiv seit Oktober 2026');
  else { await expect(activate(page)).toBeEnabled(); await page.unroute(activationEndpoint); await activate(page).click(); await expect(page.locator('#automation-state')).toContainText('aktiv seit November 2026'); }
});

for (const field of ['pendingCents', 'selectedGoalId', 'currentMonth', 'goals']) test(`Ungültiger gemeinsamer ${field}-Wert bestätigt keine Automatikwerte`, async ({ page, request }) => {
  const email = await pendingAccount(request);
  await page.route(endpoint, async route => {
    const response = await route.fetch(), body = await response.json();
    body[field] = field === 'pendingCents' ? -1 : field === 'selectedGoalId' ? crypto.randomUUID() : field === 'currentMonth' ? '2026-12-02' : [{ id: 'fremd' }];
    await route.fulfill({ response, json: body });
  });
  await login(page, email); await expect(page.locator('#automation-state')).toContainText('konnte nicht geladen werden');
  await expect(page.locator('#pending-state')).not.toContainText('Vorgemerkt:'); await expect(card(page)).toContainText('50,00');
});

test('Normale manuelle Zielbearbeitung, Datum-entfernen und bestätigtes Löschen erneuern den echten gemeinsamen Stand', async ({ page, request }) => {
  await login(page, await pendingAccount(request)); await expect(selection(page)).toHaveValue('');
  await card(page).getByRole('button', { name: 'Sparziel bearbeiten: Vorhandenes Ziel', exact: true }).click();
  await page.getByLabel('Name des Sparziels bearbeiten', { exact: true }).fill('Berlin-Fahrt');
  await page.getByLabel('Zieldatum bearbeiten (optional)', { exact: true }).fill('2027-05-12');
  await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
  await expect(card(page, 'Berlin-Fahrt')).toContainText('50,00'); await expect(card(page, 'Berlin-Fahrt')).toContainText('12.05.2027'); await expect(selection(page)).toHaveValue('');
  await card(page, 'Berlin-Fahrt').getByRole('button', { name: 'Sparziel bearbeiten: Berlin-Fahrt', exact: true }).click();
  await page.getByLabel('Zieldatum bearbeiten (optional)', { exact: true }).fill(''); await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
  await expect(card(page, 'Berlin-Fahrt')).not.toContainText('Zieldatum'); await expect(card(page, 'Berlin-Fahrt')).toContainText('50,00');
  await card(page, 'Berlin-Fahrt').getByRole('button', { name: 'Sparziel löschen: Berlin-Fahrt', exact: true }).click();
  await page.getByRole('button', { name: 'Endgültig löschen', exact: true }).click();
  await expect(page.locator('#goal-mutation-status')).toContainText('gelöscht'); await expect(page.locator('#goals-list-status')).toContainText('Noch keine Sparziele');
  await expect(page.locator('#pending-state')).toContainText('200,00'); await expect(page.locator('#saved-selection')).toHaveText('Kein Ziel ausgewählt');
});

test('Navigation während ausstehender Bestätigung bewahrt die Ungewissheit und lädt nach deren Ende neu', async ({ page, request }) => {
  await login(page, await account(request)); await expect(activate(page)).toBeEnabled();
  const held = gate(), committed = gate(); let posts = 0;
  await page.route(activationEndpoint, async route => {
    if (route.request().method() !== 'POST') { await route.continue(); return; }
    posts++; const response = await route.fetch(); expect(response.status()).toBe(200); committed.release(); await held.promise; await route.fulfill({ response });
  });
  await activate(page).click(); await committed.promise;
  await page.getByRole('link', { name: 'Monat', exact: true }).click(); await page.getByRole('link', { name: 'Sparziele', exact: true }).click();
  await expect(page.locator('.monthly-automation')).toContainText('nicht bestätigt'); await expect(reload(page)).toBeDisabled();
  await deliver(page, held.release, [{ path: '/monthly-surplus/activation', method: 'POST' }]);
  await expect(page.locator('#automation-state')).toContainText('aktiv seit Oktober 2026'); expect(posts).toBe(1);
});

test('Späte Aktivierungsbestätigung nach Abmeldung verändert das folgende Konto nicht', async ({ page, request }) => {
  const first = await account(request), second = await account(request);
  await login(page, first); await expect(activate(page)).toBeEnabled();
  const held = gate(), committed = gate(); let hold = true;
  await page.route(activationEndpoint, async route => {
    if (!hold || route.request().method() !== 'POST') { await route.continue(); return; }
    const response = await route.fetch(); committed.release(); await held.promise; await route.fulfill({ response });
  });
  await activate(page).click(); await committed.promise;
  await page.getByRole('button', { name: 'Abmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Anmelden', exact: true })).toBeVisible();
  hold = false; await login(page, second); await expect(activate(page)).toBeEnabled();
  await deliver(page, held.release, [{ path: '/monthly-surplus/activation', method: 'POST' }]);
  await expect(page.locator('#automation-state')).toContainText('noch nicht aktiviert');
  await expect(page.locator('#automation-result')).not.toContainText('wurde aktiviert');
  expect(await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }))).toEqual({ local: [], session: [] });
});


test('Gemeinsames Laden ist sichtbar und beide Ladeaktionen behalten den Fokus ohne Doppelsenden', async ({ page, request }) => {
  await login(page, await account(request)); await expect(activate(page)).toBeEnabled();
  for (const kind of ['state', 'capability']) {
    const held = gate(), ready = gate(); let calls = 0;
    const pattern = kind === 'state' ? endpoint : '**/api/v2/capabilities';
    await page.route(pattern, async route => { calls++; const response = await route.fetch(); ready.release(); await held.promise; await route.fulfill({ response }); });
    const action = kind === 'state' ? reload(page) : page.getByRole('button', { name: 'Verfügbarkeit der Monatsautomatik prüfen', exact: true });
    await action.focus(); await page.keyboard.press('Enter'); await ready.promise;
    await expect(action).toBeFocused(); await expect(action).toHaveAttribute('aria-disabled', 'true');
    if (kind === 'state') await pendingLoading(page);
    await page.keyboard.press('Enter'); expect(calls).toBe(1); held.release();
    await expect(action).toHaveAttribute('aria-disabled', 'false'); await expect(action).toBeFocused(); await page.unroute(pattern);
  }
});

for (const pendingCents of [-1, 9007199254740992, .1, '30000', null, undefined]) test(`Ungültige gemeinsame Vormerkung ${pendingCents} bestätigt keinen Betrag`, async ({ page, request }) => {
  const email = await pendingAccount(request);
  await page.route(endpoint, async route => {
    const response = await route.fetch(), body = await response.json();
    if (pendingCents === undefined) delete body.pendingCents; else body.pendingCents = pendingCents;
    await route.fulfill({ response, json: body });
  });
  await login(page, email); await expect(page.locator('#pending-state')).toContainText('konnte nicht geladen werden');
  await expect(page.locator('#pending-state')).not.toContainText('Vorgemerkt:');
});

test('Nur geladene Null gilt als bestätigte Vormerkung; Ladefehler bleibt unterscheidbar', async ({ page, request }) => {
  await login(page, await account(request)); await activate(page).click(); await expect(page.locator('#pending-state')).toHaveText('Vorgemerkt: 0,00 €');
  await page.route(endpoint, route => route.fulfill({ status: 500, json: { code: 'MONTHLY_SURPLUS_UNAVAILABLE', message: 'Ladefehler' } }));
  await pendingReload(page).click(); await expect(page.locator('#pending-state')).toContainText('konnte nicht geladen werden');
  await page.unroute(endpoint); await pendingReload(page).click(); await expect(page.locator('#pending-state')).toHaveText('Vorgemerkt: 0,00 €');
});

async function editHistorical(page: Page, amount: string): Promise<void> {
  await page.getByRole('link', { name: 'Ausgaben', exact: true }).click();
  await page.getByRole('button', { name: 'Oktober vor Aktivierung bearbeiten', exact: true }).click();
  await expect(page.locator('#expense-correction-hint')).toContainText('ursprünglichen Sparziels');
  await page.getByLabel('Betrag bearbeiten in Euro', { exact: true }).fill(amount);
  await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
  await expect(page.locator('#expense-status')).toContainText('gemeinsam gespeichert');
}
async function setProgress(page: Page, amount: string, name = 'Berlin-Fahrt'): Promise<void> {
  await card(page, name).getByRole('button', { name: `Fortschritt aktualisieren: ${name}`, exact: true }).click();
  await page.getByLabel('Gesamtfortschritt in Euro', { exact: true }).fill(amount);
  await page.getByRole('button', { name: 'Fortschritt speichern', exact: true }).click();
  await expect(page.locator('#goal-progress-status')).toContainText('gespeichert');
}
for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1280, height: 800 }]) {
  test(`Historische Korrektur liefert frische Vormerkung und tatsächliche −30/70/150 Prozent bei ${viewport.width}`, async ({ page, request }) => {
    await page.setViewportSize(viewport);
    const email = await pendingAccount(request);
    expect((await request.post('http://127.0.0.1:8081/close-month', { data: `${email}\n2026-11-01` })).status()).toBe(204);
    await login(page, email); await expect(page.locator('#pending-state')).toContainText('300,00');
    await editHistorical(page, '850');
    let overviewReads = 0, summaryReads = 0;
    page.on('request', req => { if (req.method() === 'GET' && req.url().endsWith('/monthly-surplus')) overviewReads++;
      if (req.method() === 'GET' && req.url().endsWith('/month-summary')) summaryReads++; });
    await page.getByRole('link', { name: 'Monat', exact: true }).click();
    await expect(page.locator('app-month-summary')).toContainText('9.999,99'); expect(summaryReads).toBe(1);
    await page.getByRole('link', { name: 'Sparziele', exact: true }).click();
    await expect(page.locator('#pending-state')).toContainText('250,00'); expect(overviewReads).toBe(1);
    await createGoal(page, 'Berlin-Fahrt'); await choose(page, 'Berlin-Fahrt'); await saveSelection(page).click();
    await expect(card(page, 'Berlin-Fahrt')).toContainText('250,00'); await setProgress(page, '20');
    await editHistorical(page, '900'); await page.getByRole('link', { name: 'Sparziele', exact: true }).click();
    const target = card(page, 'Berlin-Fahrt');
    await expect(target).toContainText('−30,00'); await expect(target).toContainText('−30 %');
    await expect(target.locator('.savings-progress')).toHaveAttribute('aria-valuenow', '0');
    await expect(target.locator('.savings-progress')).toHaveAttribute('aria-valuetext', /−30,00.*−30 %/);
    await editHistorical(page, '800'); await page.getByRole('link', { name: 'Sparziele', exact: true }).click();
    await expect(target).toContainText('70,00'); await expect(target).toContainText('70 %');
    await editHistorical(page, '720'); await page.getByRole('link', { name: 'Sparziele', exact: true }).click();
    await expect(target).toContainText('150,00'); await expect(target).toContainText('150 %');
    await expect(target.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    await page.evaluate(() => document.documentElement.style.fontSize = '200%');
    await expect(page.locator('html')).toHaveCSS('font-size', '32px');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
    await page.getByRole('link', { name: 'Ausgaben', exact: true }).click();
    const trigger = page.getByRole('button', { name: 'Oktober vor Aktivierung löschen', exact: true });
    await trigger.click(); const dialog = page.getByRole('dialog', { name: 'Ausgabe löschen?' });
    await expect(dialog).toContainText('ursprünglichen Sparziels');
    await expect(dialog.getByRole('button', { name: 'Abbrechen', exact: true })).toBeFocused();
    await page.keyboard.press('Shift+Tab'); await expect(dialog.getByRole('button', { name: 'Endgültig löschen', exact: true })).toBeFocused();
    await page.keyboard.press('Tab'); await page.keyboard.press('Escape'); await expect(trigger).toBeFocused();
    await trigger.click();
    if (viewport.width === 320) {
      await dialog.getByRole('button', { name: 'Endgültig löschen', exact: true }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: '../.local/story-4.4-verification/final-320-200-dialog.png' });
    }
    await dialog.getByRole('button', { name: 'Endgültig löschen', exact: true }).click();
    await expect(page.locator('#expense-status')).toContainText('gemeinsam gespeichert');
    await expect(trigger).toHaveCount(0); await expect(page.locator('[data-expense-action]:focus')).toHaveCount(1);
    await page.getByRole('link', { name: 'Sparziele', exact: true }).click(); await expect(target).toContainText('870,00');
  });
}

test('Echte Gatesperre erhält historischen Entwurf, Listeneintrag und manuelle Reparatur', async ({ page, request, context }) => {
  await login(page, await pendingAccount(request));
  await page.getByRole('link', { name: 'Ausgaben', exact: true }).click();
  await page.getByRole('button', { name: 'Oktober vor Aktivierung bearbeiten', exact: true }).click();
  await page.getByLabel('Betrag bearbeiten in Euro', { exact: true }).fill('850');
  await context.setOffline(true); await expect(page.getByRole('button', { name: 'Änderungen speichern', exact: true })).toBeDisabled();
  await expect(page.getByLabel('Betrag bearbeiten in Euro', { exact: true })).toHaveValue('850');
  await context.setOffline(false); await request.post('http://127.0.0.1:8081/readiness', { data: 'false' });
  const failed = page.waitForResponse(response => response.url().includes('/expenses/') && response.request().method() === 'PUT');
  await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click(); expect((await failed).status()).toBe(409);
  await expect(page.locator('#expense-status')).toContainText('nicht gespeichert'); await expect(page.locator('#expense-status')).toContainText('gesperrt');
  await expect(page.locator('.expense-uncertainty')).toHaveCount(0); await expect(page.getByLabel('Betrag bearbeiten in Euro', { exact: true })).toHaveValue('850');
  await expect(page.locator('.expense-cards').getByText('800,00 €', { exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: 'Bearbeitung abbrechen', exact: true }).click();
  await page.getByRole('button', { name: 'Oktober vor Aktivierung löschen', exact: true }).click();
  await page.getByRole('button', { name: 'Endgültig löschen', exact: true }).click();
  await expect(page.locator('#expense-delete-status')).toContainText('nicht gespeichert');
  await expect(page.locator('.expense-uncertainty')).toHaveCount(0); await page.keyboard.press('Escape');
  await page.getByRole('link', { name: 'Sparziele', exact: true }).click(); await setProgress(page, '20', 'Vorhandenes Ziel');
  await expect(page.locator('#pending-state')).toContainText('200,00'); await expect(card(page)).toContainText('20,00');
});
for (const method of ['PUT', 'DELETE']) {
  test(`Echter Commitfehler nach historischem ${method} bleibt unbestätigt und klärt den gemeinsamen Stand`, async ({ page, request }) => {
    const email = await pendingAccount(request); await login(page, email);
    await request.post('http://127.0.0.1:8081/correction-commit-failure', { data: 'true' });
    try {
      await page.getByRole('link', { name: 'Ausgaben', exact: true }).click();
      if (method === 'PUT') {
        await page.getByRole('button', { name: 'Oktober vor Aktivierung bearbeiten', exact: true }).click();
        await page.getByLabel('Betrag bearbeiten in Euro', { exact: true }).fill('850');
        await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
        await expect(page.locator('#expense-status')).toContainText('nicht bestätigt');
        await expect(page.getByLabel('Betrag bearbeiten in Euro', { exact: true })).toHaveValue('850');
      } else {
        await page.getByRole('button', { name: 'Oktober vor Aktivierung löschen', exact: true }).click();
        await page.getByRole('button', { name: 'Endgültig löschen', exact: true }).click();
        await expect(page.locator('#expense-delete-status')).toContainText('nicht bestätigt'); await page.keyboard.press('Escape');
      }
      await expect(page.locator('.expense-uncertainty')).toBeVisible();
      await page.getByRole('button', { name: 'Historie zur Prüfung laden', exact: true }).click();
      await expect(page.locator('.expense-cards')).toContainText('800,00');
      await page.getByRole('button', { name: 'Ich habe die Historie geprüft', exact: true }).click();
      await page.getByRole('link', { name: 'Sparziele', exact: true }).click();
      await expect(page.locator('#pending-state')).toContainText('200,00'); await expect(card(page)).toContainText('50,00');
    } finally { await request.post('http://127.0.0.1:8081/correction-commit-failure', { data: 'false' }); }
  });
}
for (const method of ['PUT', 'DELETE']) test(`Späte historische ${method}-Bestätigung nach Kontowechsel belebt keine Finanzdaten oder Entwürfe`, async ({ page, request, context }) => {
  const second = await account(request), first = await pendingAccount(request); await login(page, first);
  await page.getByRole('link', { name: 'Ausgaben', exact: true }).click();
  await page.getByRole('button', { name: 'Oktober vor Aktivierung bearbeiten', exact: true }).click();
  await page.getByLabel('Betrag bearbeiten in Euro', { exact: true }).fill('850');
  if (method === 'DELETE') await page.getByRole('button', { name: 'Oktober vor Aktivierung löschen', exact: true }).click();
  await page.evaluate(() => { (window as any).historicalExpenses = (window as any).ng.getComponent(document.querySelector('app-expenses')); });
  const held = gate(), ready = gate(); let path = '';
  await page.route('**/api/v2/expenses/*', async route => {
    const response = await route.fetch(); path = new URL(response.url()).pathname; ready.release(); await held.promise; await route.fulfill({ response });
  });
  await page.getByRole('button', { name: method === 'PUT' ? 'Änderungen speichern' : 'Endgültig löschen', exact: true }).click(); await ready.promise;
  const other = await context.newPage(); await login(other, second); await expect(page).toHaveURL('/anmelden');
  await expect(other.locator('#pending-state')).toContainText('Vor deiner ausdrücklichen Aktivierung');
  await deliver(page, held.release, [{ path, method }]);
  expect(await page.evaluate(() => { const old = (window as any).historicalExpenses; return { items: old.items(), editing: old.editing(), amount: old.editAmount, deleting: old.deleting(), status: old.status() }; }))
    .toEqual({ items: [], editing: null, amount: '', deleting: null, status: '' });
  await expect(other.locator('.savings-cards')).toHaveCount(0); await expect(page.locator('.expense-delete-dialog')).toHaveCount(0);
  await other.getByRole('button', { name: 'Abmelden', exact: true }).click(); await login(page, first);
  await expect(page.locator('#pending-state')).toContainText(method === 'PUT' ? '150,00' : '1.000,00');
});

test('Echter Korrekturgrenzfehler erhält den Entwurf bis zur manuellen Reparatur im zweiten Tab', async ({ page, request, context }) => {
  await login(page, await pendingAccount(request)); await choose(page); await saveSelection(page).click();
  await expect(card(page)).toContainText('350,00'); await expect(page.locator('#pending-state')).toContainText('0,00');
  await setProgress(page, '90071992547409,91', 'Vorhandenes Ziel');
  await expect(card(page)).toContainText('90.071.992.547.409,91');
  await page.getByRole('link', { name: 'Ausgaben', exact: true }).click();
  const originalRow = page.locator('.expense-cards li').filter({ has: page.getByRole('button', { name: 'Oktober vor Aktivierung bearbeiten', exact: true }) });
  const confirmedRow = await originalRow.innerText();
  await originalRow.getByRole('button', { name: 'Oktober vor Aktivierung bearbeiten', exact: true }).click();
  await page.getByLabel('Name bearbeiten', { exact: true }).fill('Korrigierter Oktober');
  await page.getByLabel('Betrag bearbeiten in Euro', { exact: true }).fill('750');
  const rejected = page.waitForResponse(response => response.url().includes('/expenses/') && response.request().method() === 'PUT');
  await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
  const failure = await rejected;
  expect(failure.status()).toBe(409); expect(failure.headers()['cache-control']).toBe('no-store');
  expect((await failure.json()).code).toBe('AMOUNT_LIMIT_EXCEEDED');
  await expect(page.locator('#expense-status')).toContainText('nicht gespeichert');
  await expect(page.locator('#expense-status')).toContainText('manuelle Fortschrittspflege');
  await expect(page.locator('.expense-uncertainty')).toHaveCount(0);
  await expect(page.getByLabel('Name bearbeiten', { exact: true })).toHaveValue('Korrigierter Oktober');
  await expect(page.getByLabel('Betrag bearbeiten in Euro', { exact: true })).toHaveValue('750');
  await expect(originalRow).toHaveText(confirmedRow, { useInnerText: true });
  const other = await context.newPage();
  try {
    await other.goto('/sparziele'); await expect(card(other)).toContainText('90.071.992.547.409,91');
    await setProgress(other, '20', 'Vorhandenes Ziel'); await expect(card(other)).toContainText('20,00');
    await page.bringToFront();
    await expect(page.getByLabel('Name bearbeiten', { exact: true })).toHaveValue('Korrigierter Oktober');
    await expect(page.getByLabel('Betrag bearbeiten in Euro', { exact: true })).toHaveValue('750');
    await expect(originalRow).toHaveText(confirmedRow, { useInnerText: true });
    const accepted = page.waitForResponse(response => response.url().includes('/expenses/') && response.request().method() === 'PUT');
    await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
    const success = await accepted; expect(success.status()).toBe(200);
    expect(await success.json()).toMatchObject({ name: 'Korrigierter Oktober', amountCents: 75000, recordedOn: '2026-10-01' });
    await expect(page.locator('#expense-status')).toContainText('gemeinsam gespeichert');
    await expect(page.locator('.expense-editor')).toHaveCount(0);
    const corrected = page.locator('.expense-cards li').filter({ has: page.getByRole('button', { name: 'Korrigierter Oktober bearbeiten', exact: true }) });
    await expect(corrected).toContainText('750,00'); await expect(corrected).toContainText('01.10.2026');
    await page.getByRole('link', { name: 'Sparziele', exact: true }).click();
    await expect(card(page)).toContainText('70,00'); await expect(page.locator('#pending-state')).toContainText('0,00');
    await pendingReload(other).click(); await expect(card(other)).toContainText('70,00');
  } finally { await other.close(); }
});

async function deletionAccount(request: APIRequestContext): Promise<string> {
  const email = await account(request);
  expect((await request.post('http://127.0.0.1:8081/deletion-fixture', { data: email })).status()).toBe(204);
  return email;
}
for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1280, height: 800 }]) {
  test(`Ziellöschung erklärt Verbrauch und erhält frische Vormerkung ohne Ziel bei ${viewport.width} und 200 Prozent`, async ({ page, request, context }) => {
    await page.setViewportSize(viewport); const email = await deletionAccount(request); await login(page, email);
    await expect(card(page, 'Historisches Ziel')).toContainText('−30,00'); await expect(page.locator('#pending-state')).toContainText('300,00');
    await choose(page, 'Historisches Ziel');
    await page.getByLabel('Name des Sparziels', { exact: true }).fill('Unabhängiger Entwurf');
    await page.getByLabel('Zielbetrag in Euro', { exact: true }).fill('123,45');
    await page.evaluate(() => document.documentElement.style.fontSize = '200%');
    const trigger = page.getByRole('button', { name: 'Sparziel löschen: Historisches Ziel', exact: true });
    let deletes = 0; page.on('request', req => { if (req.method() === 'DELETE' && req.url().includes('/savings-goals/')) deletes++; });
    await trigger.click(); const dialog = page.getByRole('dialog', { name: 'Sparziel löschen?' });
    await expect(dialog).toContainText('„Historisches Ziel“ und sein Gesamtfortschritt');
    await expect(dialog).toContainText('abgeschlossene Monate, die noch nicht verarbeitet wurden');
    await expect(dialog).toContainText('Bereits offene Vormerkungen bleiben erhalten');
    await expect(dialog).toContainText('Weitere Monatsüberschüsse werden ohne neue Zielauswahl vorgemerkt');
    await expect(page.locator('#goal-delete-cancel')).toBeFocused();
    await page.keyboard.press('Shift+Tab'); await expect(dialog.getByRole('button', { name: 'Endgültig löschen', exact: true })).toBeFocused();
    await page.keyboard.press('Tab'); await expect(page.locator('#goal-delete-cancel')).toBeFocused();
    expect((await new AxeBuilder({ page }).include('.savings-delete-dialog').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
    for (const button of await dialog.getByRole('button').all()) {
      await button.focus(); await button.evaluate(element => element.scrollIntoView({ block: 'center' }));
      await expect(button).toHaveCSS('outline-style', 'solid'); await expect(button).toBeInViewport({ ratio: 1 });
      const size = (await button.boundingBox())!; expect(size.width).toBeGreaterThanOrEqual(44); expect(size.height).toBeGreaterThanOrEqual(44);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    if (viewport.width === 320) {
      const bounds = (await dialog.boundingBox())!;
      expect(bounds.x).toBeCloseTo(16, 0); expect(viewport.width - bounds.x - bounds.width).toBeCloseTo(16, 0);
    }
    if (viewport.width === 320) await page.screenshot({ path: '../.local/story-4.5-verification/dialog-320-200.png' });
    await page.keyboard.press('Escape'); await expect(trigger).toBeFocused(); expect(deletes).toBe(0);
    await trigger.click(); await context.setOffline(true); await expect(dialog.getByRole('button', { name: 'Endgültig löschen', exact: true })).toBeDisabled();
    await context.setOffline(false); await page.locator('#goal-delete-cancel').click(); await expect(trigger).toBeFocused();
    await expect(page.locator('#saved-selection')).toContainText('Historisches Ziel'); await expect(page.locator('#pending-state')).toContainText('300,00');
    // Sichere Ablehnung erhält den bestätigten Vorzustand samt Auswahlentwurf.
    await page.route('**/api/v2/savings-goals/*', route => route.fulfill({ status: 404, json: { code: 'SAVINGS_GOAL_NOT_FOUND' } }));
    await trigger.click(); await dialog.getByRole('button', { name: 'Endgültig löschen', exact: true }).click();
    await expect(page.locator('#goal-delete-status')).toContainText('Es wurde nichts geändert');
    await expect(page.locator('#saved-selection')).toContainText('Historisches Ziel'); await expect(page.locator('#pending-state')).toContainText('300,00');
    await page.keyboard.press('Escape'); await page.unroute('**/api/v2/savings-goals/*');
    const readStarted = gate(), releaseRead = gate();
    await page.route(endpoint, async route => { readStarted.release(); await releaseRead.promise; await route.fulfill({ status: 500, json: {} }); });
    await trigger.click(); await dialog.getByRole('button', { name: 'Endgültig löschen', exact: true }).click(); await readStarted.promise;
    await expect(page.locator('#goal-mutation-status')).toHaveText('Dein Sparziel wurde gelöscht.');
    await expect(page.getByRole('button', { name: 'Sparziel anlegen', exact: true })).toBeFocused();
    await expect(page.locator('#saved-selection')).toHaveCount(0); await expect(page.locator('#pending-state')).not.toContainText('Vorgemerkt:');
    expect(await page.evaluate(() => (window as any).ng.getComponent(document.querySelector('app-savings-goals')).selectionDraft())).toBe('');
    releaseRead.release(); await expect(page.locator('#automation-state')).toContainText('konnte nicht geladen');
    await expect(page.locator('#goal-mutation-status')).toHaveText('Dein Sparziel wurde gelöscht.');
    await expect(page.getByLabel('Name des Sparziels', { exact: true })).toHaveValue('Unabhängiger Entwurf');
    await expect(page.getByLabel('Zielbetrag in Euro', { exact: true })).toHaveValue('123,45');
    expect(deletes).toBe(2); await page.unroute(endpoint); await pendingReload(page).click();
    await expect(page.locator('#pending-state')).toContainText('300,00'); await expect(page.locator('#saved-selection')).toHaveText('Kein Ziel ausgewählt');
    await expect(page.locator('#automation-state')).toContainText('aktiv'); await expect(page.locator('.savings-cards li')).toHaveCount(0);
    await accessibleAutomation(page);
    // Tatsächliche folgende Korrektur und Ausgabenlöschung ändern die verbrauchte Herkunft nicht.
    await page.getByRole('link', { name: 'Ausgaben', exact: true }).click();
    await page.getByRole('button', { name: 'Historische Reise bearbeiten', exact: true }).click();
    await page.getByLabel('Betrag bearbeiten in Euro', { exact: true }).fill('850');
    await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click(); await expect(page.locator('#expense-status')).toContainText('gemeinsam gespeichert');
    await page.getByRole('button', { name: 'Historische Reise löschen', exact: true }).click();
    await page.getByRole('button', { name: 'Endgültig löschen', exact: true }).click(); await expect(page.locator('#expense-status')).toContainText('gemeinsam gespeichert');
    expect((await request.post('http://127.0.0.1:8081/close-month', { data: `${email}\n2026-11-01` })).status()).toBe(204);
    await page.getByRole('link', { name: 'Sparziele', exact: true }).click(); await expect(page.locator('#pending-state')).toContainText('300,00');
    await createGoal(page, 'Historisches Ziel'); await expect(card(page, 'Historisches Ziel')).toContainText('0,00');
    await expect(page.locator('#saved-selection')).toHaveText('Kein Ziel ausgewählt'); await choose(page, 'Historisches Ziel'); await saveSelection(page).click();
    await expect(card(page, 'Historisches Ziel')).toContainText('300,00'); await expect(page.locator('#pending-state')).toContainText('0,00');
  });
}

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1280, height: 800 }]) test(`Späte Übersichten erhalten Löschung und unabhängigen Entwurf und bleiben nach Kontowechsel bei ${viewport.width} leer`, async ({ page, request }) => {
  await page.setViewportSize(viewport); const otherEmail = await account(request);
  await login(page, await deletionAccount(request));
  await page.evaluate(() => document.documentElement.style.fontSize = '200%');
  await createGoal(page, 'Unabhängiges Ziel'); await choose(page, 'Unabhängiges Ziel'); const draft = await selection(page).inputValue();
  await page.getByRole('button', { name: 'Sparziel löschen: Historisches Ziel', exact: true }).click();
  const oldRead = gate(), releaseOld = gate(); let reads = 0;
  await page.route(endpoint, async route => {
    const response = await route.fetch();
    if (++reads === 1) { oldRead.release(); await releaseOld.promise; }
    await route.fulfill({ response });
  });
  await page.evaluate(() => window.dispatchEvent(new Event('focus'))); await oldRead.promise;
  await page.getByRole('button', { name: 'Endgültig löschen', exact: true }).click();
  await expect(page.locator('#goal-mutation-status')).toHaveText('Dein Sparziel wurde gelöscht.');
  await expect(page.locator('#saved-selection')).toHaveText('Kein Ziel ausgewählt'); await expect(page.locator('#pending-state')).toContainText('300,00');
  await deliver(page, releaseOld.release, [{ path: '/api/v2/monthly-surplus', method: 'GET' }]);
  await expect(page.locator('.savings-cards li')).toHaveCount(1); await expect(page.locator('#saved-selection')).toHaveText('Kein Ziel ausgewählt');
  await expect(card(page, 'Historisches Ziel')).toHaveCount(0); await expect(selection(page)).toHaveValue(draft);
  await expect(saveSelection(page)).toBeEnabled();
  await page.unroute(endpoint);
  const ownerRead = gate(), releaseOwner = gate(); let ownerReads = 0;
  await page.route(endpoint, async route => {
    const response = await route.fetch();
    if (++ownerReads === 1) { ownerRead.release(); await releaseOwner.promise; }
    await route.fulfill({ response });
  });
  await page.evaluate(() => { (window as any).oldOwnerSavings = (window as any).ng.getComponent(document.querySelector('app-savings-goals')); });
  await pendingReload(page).click(); await ownerRead.promise;
  await page.getByRole('button', { name: 'Abmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Anmelden', exact: true })).toBeVisible();
  await login(page, otherEmail); await expect(page.locator('#automation-state')).toContainText('noch nicht aktiviert');
  await deliver(page, releaseOwner.release, [{ path: '/api/v2/monthly-surplus', method: 'GET' }]);
  await expect(page.locator('.savings-cards li')).toHaveCount(0); await expect(page.locator('#saved-selection')).toHaveCount(0);
  await expect(page.locator('#pending-state')).not.toContainText('300,00');
  expect(await page.evaluate(() => {
    const old = (window as any).oldOwnerSavings;
    return { items: old.items(), overview: old.overview(), selection: old.selectionDraft(), name: old.name, progress: old.progressAmount };
  })).toEqual({ items: [], overview: null, selection: null, name: '', progress: '' });

});

async function externalFinance(page: Page, method: string, path: string, data?: unknown) {
  const token = await page.evaluate(() => (window as any).ng.getComponent(document.querySelector('app-savings-goals')).session.token());
  return page.request.fetch(`https://localhost:4200/api/v2/${path}`, { method, headers: { Authorization: `Bearer ${token}` }, data });
}
async function goalId(page: Page, name: string): Promise<string> {
  return card(page, name).locator('h3').getAttribute('id').then(id => id!.replace('goal-title-', ''));
}
async function creationDraft(page: Page): Promise<void> {
  await page.getByLabel('Name des Sparziels', { exact: true }).fill('Unabhängiger Entwurf');
  await page.getByLabel('Zielbetrag in Euro', { exact: true }).fill('123,45');
}
for (const status of [400, 404]) test(`Reviewfix: bestätigte Dialogdaten überstehen gehaltenes focus-GET und sichere ${status}`, async ({ page, request }) => {
  await login(page, await deletionAccount(request)); await createGoal(page, 'B'); await choose(page, 'B'); const draft = await selection(page).inputValue();
  await creationDraft(page); await page.getByRole('button', { name: 'Sparziel löschen: Historisches Ziel', exact: true }).click();
  const read = gate(), release = gate();
  await page.route(endpoint, async route => { const response = await route.fetch(); read.release(); await release.promise; await route.fulfill({ response }); });
  await page.evaluate(() => window.dispatchEvent(new Event('focus'))); await read.promise;
  await expect(page.locator('.savings-cards li')).toHaveCount(0);
  await page.route('**/api/v2/savings-goals/*', route => route.fulfill({ status, json: {} }));
  await page.getByRole('button', { name: 'Endgültig löschen', exact: true }).click();
  await expect(page.locator('#goal-delete-status')).toContainText(status === 404 ? 'Es wurde nichts geändert' : 'nicht gelöscht');
  await expect(page.locator('.savings-cards li')).toHaveCount(2); await expect(page.locator('#saved-selection')).toContainText('Historisches Ziel');
  await expect(page.locator('#pending-state')).toContainText('300,00'); await expect(selection(page)).toHaveValue(draft);
  await deliver(page, release.release, [{ path: '/api/v2/monthly-surplus', method: 'GET' }]);
  await page.keyboard.press('Escape'); await expect(page.getByRole('button', { name: 'Sparziel löschen: Historisches Ziel', exact: true })).toBeFocused();
  await expect(page.getByLabel('Name des Sparziels', { exact: true })).toHaveValue('Unabhängiger Entwurf');
});

test('Reviewfix: 204 nach gehaltenem GET erhält bestätigtes B und dessen Fokus auch bei Ladefehler', async ({ page, request }) => {
  await login(page, await deletionAccount(request)); await createGoal(page, 'B'); await choose(page, 'B'); const draft = await selection(page).inputValue();
  await creationDraft(page); await page.getByRole('button', { name: 'Sparziel löschen: Historisches Ziel', exact: true }).click();
  const read = gate(), release = gate(); let reads = 0, deletes = 0;
  page.on('request', req => { if (req.method() === 'DELETE' && req.url().includes('/savings-goals/')) deletes++; });
  await page.route(endpoint, async route => {
    if (++reads === 1) { const response = await route.fetch(); read.release(); await release.promise; await route.fulfill({ response }); }
    else await route.fulfill({ status: 500, json: {} });
  });
  await page.evaluate(() => window.dispatchEvent(new Event('focus'))); await read.promise;
  await expect(page.locator('.savings-cards li')).toHaveCount(0);
  await page.getByRole('button', { name: 'Endgültig löschen', exact: true }).click();
  await expect(page.locator('#goal-mutation-status')).toHaveText('Dein Sparziel wurde gelöscht.');
  await expect(card(page, 'B')).toBeVisible(); await expect(card(page, 'B').getByRole('button', { name: 'Sparziel bearbeiten: B', exact: true })).toBeFocused();
  await expect(page.locator('#automation-state')).toContainText('konnte nicht geladen'); await expect(page.locator('#saved-selection')).toHaveCount(0);
  await deliver(page, release.release, [{ path: '/api/v2/monthly-surplus', method: 'GET' }]);
  await expect(page.locator('.savings-cards li')).toHaveCount(1); await expect(card(page, 'B')).toBeVisible();
  expect(await page.evaluate(() => (window as any).ng.getComponent(document.querySelector('app-savings-goals')).selectionDraft())).toBe(draft);
  await expect(page.getByLabel('Name des Sparziels', { exact: true })).toHaveValue('Unabhängiger Entwurf'); expect(deletes).toBe(1);
});

test('Reviewfix: externe Auswahländerung aktualisiert den offenen Löschdialog und erhält B', async ({ page, request }) => {
  await login(page, await deletionAccount(request)); await createGoal(page, 'B'); const b = await goalId(page, 'B');
  await page.getByRole('button', { name: 'Sparziel löschen: Historisches Ziel', exact: true }).click();
  await expect(page.locator('#goal-delete-future')).toContainText('Dieses Ziel ist aktuell ausgewählt');
  expect((await externalFinance(page, 'PUT', 'monthly-surplus/selection', { goalId: b })).status()).toBe(200);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.locator('#saved-selection')).toContainText('B');
  await expect(page.locator('#goal-delete-future')).not.toContainText('Dieses Ziel ist aktuell ausgewählt');
  await expect(page.locator('#goal-delete-future')).toContainText('Falls ein anderes Ziel ausgewählt ist, bleibt diese Auswahl erhalten');
  await page.getByRole('button', { name: 'Endgültig löschen', exact: true }).click();
  await expect(page.locator('#saved-selection')).toContainText('B'); await expect(card(page, 'B')).toContainText('300,00');
});

test('Reviewfix: gewöhnliche inaktive Ziellöschung verspricht keine künftigen Vormerkungen', async ({ page, request }) => {
  await login(page, await account(request)); await createGoal(page, 'Ohne Automatik');
  await page.getByRole('button', { name: 'Sparziel löschen: Ohne Automatik', exact: true }).click();
  await expect(page.locator('#goal-delete-future')).toContainText('Die Monatsautomatik ist nicht aktiviert');
  await expect(page.locator('#goal-delete-future')).toContainText('erzeugt keine Vormerkungen');
  await expect(page.locator('#goal-delete-future')).not.toContainText('weitere Monatsüberschüsse');
  await page.getByRole('button', { name: 'Endgültig löschen', exact: true }).click();
  await expect(page.locator('#automation-state')).toContainText('noch nicht aktiviert');
});

for (const mode of ['lokal', 'extern']) test(`Reviewfix: gespeichertes B ersetzt verworfenen A-Entwurf nicht automatisch (${mode})`, async ({ page, request }) => {
  await login(page, await pendingAccount(request)); await createGoal(page, 'B'); await choose(page, 'B'); await saveSelection(page).click();
  await expect(page.locator('#saved-selection')).toContainText('B'); const a = await goalId(page, 'Vorhandenes Ziel');
  await choose(page); await creationDraft(page); let puts = 0, fallbackReads = 0;
  page.on('request', req => { if (req.method() === 'PUT' && req.url().endsWith('/monthly-surplus/selection')) puts++;
    if (req.method() === 'GET' && req.url().endsWith('/api/v2/savings-goals')) fallbackReads++; });
  if (mode === 'extern') { expect((await externalFinance(page, 'DELETE', `savings-goals/${a}`)).status()).toBe(204); await pendingReload(page).click(); }
  else { await page.getByRole('button', { name: 'Sparziel löschen: Vorhandenes Ziel', exact: true }).click(); await page.getByRole('button', { name: 'Endgültig löschen', exact: true }).click(); }
  await expect(card(page)).toHaveCount(0); await expect(page.locator('#saved-selection')).toContainText('B');
  await expect(selection(page)).toHaveValue(''); await expect(saveSelection(page)).toBeDisabled();
  await expect(page.locator('#selection-draft')).toContainText('Keine neue Zielauswahl getroffen');
  await selection(page).evaluate(element => (element.closest('form') as HTMLFormElement).requestSubmit());
  expect(puts).toBe(0); expect(fallbackReads).toBe(0);
  await expect(page.getByLabel('Name des Sparziels', { exact: true })).toHaveValue('Unabhängiger Entwurf');
});

for (const kind of ['Fortschritt', 'Zielwerte']) for (const focused of [true, false]) test(`Reviewfix: gemeinsamer GET verwirft extern entfallenen ${kind}-Entwurf mit bedingtem Fokus (${focused})`, async ({ page, request }) => {
  await login(page, await pendingAccount(request)); await createGoal(page, 'B'); const a = await goalId(page, 'Vorhandenes Ziel');
  await creationDraft(page);
  if (kind === 'Fortschritt') {
    await card(page).getByRole('button', { name: 'Fortschritt aktualisieren: Vorhandenes Ziel', exact: true }).click();
    await page.getByLabel('Gesamtfortschritt in Euro', { exact: true }).fill('77,77');
  } else {
    await card(page).getByRole('button', { name: 'Sparziel bearbeiten: Vorhandenes Ziel', exact: true }).click();
    await page.getByLabel('Name des Sparziels bearbeiten', { exact: true }).fill('');
    await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
    await expect(page.locator('#goal-mutation-status')).toHaveClass(/error/);
  }
  if (!focused) await page.getByLabel('Name des Sparziels', { exact: true }).focus();
  let fallbackReads = 0; page.on('request', req => { if (req.method() === 'GET' && req.url().endsWith('/api/v2/savings-goals')) fallbackReads++; });
  expect((await externalFinance(page, 'DELETE', `savings-goals/${a}`)).status()).toBe(204);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.locator('.savings-editor')).toHaveCount(0); await expect(page.locator('#goal-mutation-status')).toContainText('Entwurf wurde verworfen');
  await expect(page.locator('#goal-mutation-status')).not.toHaveClass(/error|success/);
  await expect(page.locator('#pending-state')).toContainText('200,00'); expect(fallbackReads).toBe(0);
  if (focused) await expect(card(page, 'B').getByRole('button', { name: 'Sparziel bearbeiten: B', exact: true })).toBeFocused();
  else await expect(page.getByLabel('Name des Sparziels', { exact: true })).toBeFocused();
  await expect(page.getByLabel('Name des Sparziels', { exact: true })).toHaveValue('Unabhängiger Entwurf');
});

test('Reviewfix: Ladezustand eines gehaltenen post-mutation GET wird nach sicherer Ablehnung nicht wiederhergestellt', async ({ page, request }) => {
  await login(page, await pendingAccount(request)); await choose(page); const draft = await selection(page).inputValue();
  const read = gate(), release = gate();
  await page.route(endpoint, async route => { const response = await route.fetch(); read.release(); await release.promise; await route.fulfill({ response }); });
  await createGoal(page, 'B'); await read.promise;
  await expect(page.locator('#automation-state')).toContainText('werden geladen');
  await creationDraft(page); await page.getByRole('button', { name: 'Sparziel löschen: Vorhandenes Ziel', exact: true }).click();
  await page.route('**/api/v2/savings-goals/*', route => route.fulfill({ status: 400, json: {} }));
  await page.getByRole('button', { name: 'Endgültig löschen', exact: true }).click();
  await expect(page.locator('#goal-delete-status')).toContainText('nicht gelöscht');
  await expect(page.locator('#automation-state')).toContainText('noch nicht geladen');
  await expect(page.locator('#pending-state')).toContainText('noch nicht geladen');
  await expect(page.locator('.savings-cards li')).toHaveCount(2);
  expect(await page.evaluate(() => (window as any).ng.getComponent(document.querySelector('app-savings-goals')).selectionDraft())).toBe(draft);
  await deliver(page, release.release, [{ path: '/api/v2/monthly-surplus', method: 'GET' }]);
  await expect(page.locator('#automation-state')).toContainText('noch nicht geladen');
  await page.keyboard.press('Escape'); await expect(page.getByLabel('Name des Sparziels', { exact: true })).toHaveValue('Unabhängiger Entwurf');
});
