import AxeBuilder from '@axe-core/playwright';
import { expect, test, Page, APIRequestContext } from '@playwright/test';

const password = '  Grüner 🦊 im Baum  ';
const endpoint = '**/api/v2/monthly-surplus/activation';
const activate = (page: Page) => page.getByRole('button', { name: 'Monatsautomatik ausdrücklich aktivieren', exact: true });
const reload = (page: Page) => page.getByRole('button', { name: 'Aktivierungszustand laden', exact: true });
function gate() { let release!: () => void; return { promise: new Promise<void>(resolve => { release = resolve; }), release: () => release() }; }
async function deliver(page: Page, release: () => void, paths: { path: string; method: string }[]): Promise<void> {
  const responses = paths.map(({ path, method }) => page.waitForResponse(response => response.url().endsWith(path) && response.request().method() === method));
  release();
  await Promise.all(responses.map(async pending => expect(await (await pending).finished()).toBeNull()));
  // Nach Netzwerkende auch RxJS-Fortsetzungen und den anschließenden Angular-Render abwarten.
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}
async function account(request: APIRequestContext): Promise<string> {
  const email = `automation-${crypto.randomUUID()}@example.org`;
  expect((await request.post('http://127.0.0.1:8080/api/v2/access/registrations', {
    data: { registrationToken: 'a'.repeat(43), email, password }
  })).status()).toBe(201);
  return email;
}
async function login(page: Page, email: string): Promise<void> {
  if (new URL(page.url()).pathname !== '/anmelden') await page.goto('/anmelden');
  await page.getByLabel('E-Mail-Adresse', { exact: true }).fill(email);
  await page.getByLabel('Passwort', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Monat', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Sparziele', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Monatsautomatik', exact: true })).toBeVisible();
}
async function accessibleAutomation(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  for (const control of await page.locator('.monthly-automation button:not(:disabled)').all()) {
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
      return { width: rect.width, height: rect.height, control: contrast(style.backgroundColor), focus: contrast(style.outlineColor),
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

test('Echter Aktivierungscommit ohne Budget oder Ziel erhält Oktober nach Monatswechsel und Neuladen', async ({ page, request }) => {
  const email = await account(request); await login(page, email);
  await expect(page.locator('#goals-list-status')).toContainText('Noch keine Sparziele');
  await expect(page.locator('.monthly-automation')).toContainText('gesamten Monat');
  await expect(page.locator('.monthly-automation')).toContainText('ohne Budget oder Sparziel');
  const saved = page.waitForResponse(response => response.url().endsWith('/monthly-surplus/activation') && response.request().method() === 'POST');
  await activate(page).click(); const response = await saved;
  expect(response.status()).toBe(200); expect(response.headers()['cache-control']).toBe('no-store');
  expect(await response.json()).toEqual({ active: true, activationMonth: '2026-10-01' });
  await expect(page.locator('#automation-state')).toContainText('aktiv seit Oktober 2026');
  await expect(page.locator('#automation-result')).toBeFocused();
  await request.post('http://127.0.0.1:8081/clock', { data: '2026-10-31T23:00:01Z' });
  await page.reload(); await expect(page.locator('#automation-state')).toContainText('aktiv seit Oktober 2026');
  await request.post('http://127.0.0.1:8081/readiness', { data: 'false' });
  await page.getByRole('button', { name: 'Verfügbarkeit der Monatsautomatik prüfen', exact: true }).click();
  await expect(page.locator('#automation-capability')).toContainText('derzeit nicht verfügbar');
  await expect(page.locator('#automation-state')).toContainText('aktiv seit Oktober 2026');
  await expect(activate(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Sparziel speichern', exact: true })).toBeEnabled();
  await page.getByRole('link', { name: 'Monat', exact: true }).click();
  await expect(page.locator('#budget-status')).not.toContainText('gespeichert');
  await expect(page.getByLabel('Monatsbudget in Euro', { exact: true })).toHaveValue('');
});

test('Laden, Ladefehler und gesperrte Funktion sind getrennt und Kernfunktionen bleiben erreichbar', async ({ page, request }) => {
  const email = await account(request), held = gate(), ready = gate();
  await page.route(endpoint, async route => { if (route.request().method() === 'GET') { ready.release(); await held.promise; await route.fulfill({ status: 500, json: { code: 'MONTHLY_SURPLUS_UNAVAILABLE', message: 'Nicht bestätigt' } }); } else await route.continue(); });
  await login(page, email); await ready.promise;
  await expect(page.locator('#automation-state')).toContainText('wird geladen'); await expect(activate(page)).toHaveCount(0);
  held.release(); await expect(page.locator('#automation-state')).toContainText('konnte nicht geladen werden');
  await expect(page.getByRole('button', { name: 'Sparziel speichern', exact: true })).toBeEnabled();
  await page.unroute(endpoint); await reload(page).click(); await expect(activate(page)).toBeEnabled();
  await request.post('http://127.0.0.1:8081/readiness', { data: 'false' });
  await page.getByRole('button', { name: 'Verfügbarkeit der Monatsautomatik prüfen', exact: true }).click();
  await expect(page.locator('#automation-capability')).toContainText('derzeit nicht verfügbar');
  await expect(page.locator('#automation-state')).toContainText('noch nicht aktiviert'); await expect(activate(page)).toHaveCount(0);
});

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

test('Beide Ladeaktionen behalten Tastaturfokus und verhindern parallele Abfragen', async ({ page, request }) => {
  await login(page, await account(request)); await expect(activate(page)).toBeEnabled();
  for (const kind of ['state', 'capability']) {
    const held = gate(), ready = gate(); let calls = 0;
    const pattern = kind === 'state' ? endpoint : '**/api/v2/capabilities';
    await page.route(pattern, async route => {
      calls++; ready.release(); await held.promise;
      await route.fulfill({ json: kind === 'state' ? { active: false, activationMonth: null } : { signedProgressAvailable: false, monthlyAutomationAvailable: true } });
    });
    const action = kind === 'state' ? reload(page) : page.getByRole('button', { name: 'Verfügbarkeit der Monatsautomatik prüfen', exact: true });
    await action.focus(); await page.keyboard.press('Enter'); await ready.promise;
    await expect(action).toBeFocused(); await expect(action).toHaveAttribute('aria-disabled', 'true');
    expect(await action.evaluate(element => (element as HTMLButtonElement).disabled)).toBeFalsy();
    await page.keyboard.press('Enter'); expect(calls).toBe(1);
    held.release(); await expect(action).toHaveAttribute('aria-disabled', 'false'); await expect(action).toBeFocused();
    await page.unroute(pattern);
  }
});

test('Offline wird nichts gesendet und während der Aktivierung ist Doppelsenden gesperrt', async ({ page, request, context }) => {
  await login(page, await account(request)); await expect(activate(page)).toBeEnabled();
  let posts = 0; page.on('request', item => { if (item.url().endsWith('/monthly-surplus/activation') && item.method() === 'POST') posts++; });
  await context.setOffline(true); await expect(activate(page)).toBeDisabled();
  await expect(page.locator('.monthly-automation')).toContainText('Die Aktivierung ist offline gesperrt'); expect(posts).toBe(0);
  await context.setOffline(false);
  const held = gate(), ready = gate();
  await page.route(endpoint, async route => { if (route.request().method() === 'POST') { ready.release(); await held.promise; await route.continue(); } else await route.continue(); });
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

for (const candidate of [
  { name: 'inaktiver Zustand', status: 200, json: { active: false, activationMonth: null } },
  { name: 'fehlende Felder', status: 200, json: {} },
  { name: 'fehlender Monat', status: 200, json: { active: true } },
  { name: 'widersprüchlicher Monat', status: 200, json: { active: false, activationMonth: '2026-10-01' } },
  { name: 'aktiver Zustand ohne Monat', status: 200, json: { active: true, activationMonth: null } },
  { name: 'ungültiger Typ', status: 200, json: { active: 'true', activationMonth: '2026-10-01' } },
  { name: 'ungültiger Monatserster', status: 200, json: { active: true, activationMonth: '2026-10-02' } },
  { name: 'unerwartetes Feld', status: 200, json: { active: true, activationMonth: '2026-10-01', diagnostic: 'fremd' } },
  { name: 'unpassender Erfolgsstatus', status: 201, json: { active: true, activationMonth: '2026-10-01' } }
]) test(`POST bestätigt keinen Erfolg bei ${candidate.name}; nur gültiger GET erlaubt Wiederholung`, async ({ page, request }) => {
  await login(page, await account(request)); await expect(activate(page)).toBeEnabled();
  let posts = 0, invalidGet = false;
  page.on('request', item => { if (item.url().endsWith('/monthly-surplus/activation') && item.method() === 'POST') posts++; });
  await page.route(endpoint, route => route.request().method() === 'POST'
    ? route.fulfill({ status: candidate.status, json: candidate.json })
    : invalidGet ? route.fulfill({ status: 200, json: { active: true } }) : route.continue());
  await activate(page).click(); await expect(page.locator('#automation-result')).toContainText('nicht bestätigt');
  await expect(page.locator('.monthly-automation')).toContainText('Lade vor einem weiteren Versuch');
  await expect(activate(page)).toBeDisabled(); await expect(page.locator('.monthly-automation')).not.toContainText('wurde aktiviert');
  expect(posts).toBe(1);
  invalidGet = true; await reload(page).click(); await expect(page.locator('#automation-state')).toContainText('konnte nicht geladen werden');
  await expect(activate(page)).toHaveCount(0); expect(posts).toBe(1);
  await page.unroute(endpoint); await reload(page).click(); await expect(activate(page)).toBeEnabled();
  await activate(page).click(); await expect(page.locator('#automation-state')).toContainText('aktiv seit Oktober 2026'); expect(posts).toBe(2);
});

for (const committed of [false, true]) test(`Unbestätigter Ausgang ${committed ? 'mit' : 'ohne'} Commit wird vor Wiederholung über Monatswechsel gelesen`, async ({ page, request }) => {
  await login(page, await account(request)); await expect(activate(page)).toBeEnabled();
  let posts = 0;
  page.on('request', item => { if (item.url().endsWith('/monthly-surplus/activation') && item.method() === 'POST') posts++; });
  await page.route(endpoint, async route => {
    if (route.request().method() !== 'POST') { await route.continue(); return; }
    if (committed) { const response = await route.fetch(); expect(response.status()).toBe(200); }
    await route.abort();
  });
  await activate(page).click(); await expect(page.locator('#automation-result')).toContainText('nicht bestätigt');
  await expect(activate(page)).toBeDisabled(); expect(posts).toBe(1);
  await request.post('http://127.0.0.1:8081/clock', { data: '2026-10-31T23:00:01Z' });
  await page.getByRole('link', { name: 'Monat', exact: true }).click();
  await page.getByRole('link', { name: 'Sparziele', exact: true }).click();
  if (committed) { await expect(page.locator('#automation-state')).toContainText('aktiv seit Oktober 2026'); await expect(activate(page)).toHaveCount(0); }
  else {
    await expect(activate(page)).toBeEnabled(); await page.unroute(endpoint); await activate(page).click();
    await expect(page.locator('#automation-state')).toContainText('aktiv seit November 2026');
  }
  expect(posts).toBe(committed ? 1 : 2);
});

test('Navigation während ausstehender Bestätigung bewahrt die Ungewissheit und lädt nach deren Ende neu', async ({ page, request }) => {
  await login(page, await account(request)); await expect(activate(page)).toBeEnabled();
  const held = gate(), committed = gate(); let posts = 0;
  await page.route(endpoint, async route => {
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
  await page.route(endpoint, async route => {
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

for (const ending of ['Abmeldung', 'Ablauf', 'Kontowechsel']) test(`Späte Zustands- und Capabilityantworten geben nach ${ending} keine alten Kontodaten frei`, async ({ page, request, context }) => {
  if (ending === 'Ablauf') await page.clock.install();
  const first = await account(request), second = await account(request);
  await login(page, first); await expect(activate(page)).toBeEnabled(); await activate(page).click(); await expect(page.locator('#automation-state')).toContainText('aktiv seit Oktober 2026');
  await page.getByRole('link', { name: 'Monat', exact: true }).click();
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
  await page.getByRole('link', { name: 'Sparziele', exact: true }).click(); await Promise.all([stateReady.promise, capabilityReady.promise]);
  await page.evaluate(() => { (window as any).oldAutomation = (window as any).ng.getComponent(document.querySelector('app-monthly-automation')); });
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
  await deliver(page, held.release, [{ path: '/monthly-surplus/activation', method: 'GET' }, { path: '/capabilities', method: 'GET' }]);
  await expect(page.locator('#automation-state')).toContainText('noch nicht aktiviert'); await expect(activate(page)).toHaveCount(0);
  expect(await page.evaluate(() => { const old = (window as any).oldAutomation; return { state: old.state(), result: old.result(), load: old.loadState() }; })).toEqual({ state: null, result: '', load: 'unknown' });
});

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1280, height: 800 }]) {
  test(`Semantik, Tastatur, Kontrast, Fokus und Reflow mit 200 % Text bei ${viewport.width}×${viewport.height}`, async ({ page, request }) => {
    await page.setViewportSize(viewport); await login(page, await account(request)); await expect(activate(page)).toBeEnabled();
    await page.evaluate(() => document.documentElement.style.fontSize = '200%');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await reload(page).focus(); await page.keyboard.press('Shift+Tab');
    const action = activate(page); await expect(action).toBeFocused();
    const box = await action.boundingBox(); expect(box!.height).toBeGreaterThanOrEqual(44); expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(await action.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none');
    await accessibleAutomation(page);
    await request.post('http://127.0.0.1:8081/readiness', { data: 'false' });
    const capability = page.getByRole('button', { name: 'Verfügbarkeit der Monatsautomatik prüfen', exact: true });
    await capability.click(); await expect(page.locator('#automation-capability')).toContainText('derzeit nicht verfügbar');
    await expect(activate(page)).toHaveCount(0); await accessibleAutomation(page);
    await page.route(endpoint, route => route.fulfill({ status: 500, json: { code: 'MONTHLY_SURPLUS_UNAVAILABLE', message: 'Nicht bestätigt' } }));
    await reload(page).click(); await expect(page.locator('#automation-state')).toContainText('konnte nicht geladen werden');
    await accessibleAutomation(page);
    await page.unroute(endpoint); await reload(page).click();
    await request.post('http://127.0.0.1:8081/readiness', { data: 'true' }); await capability.click(); await expect(activate(page)).toBeEnabled();
    const held = gate(), ready = gate();
    await page.route(endpoint, async route => {
      if (route.request().method() !== 'POST') { await route.continue(); return; }
      ready.release(); await held.promise; await route.abort();
    });
    await activate(page).press('Enter'); await ready.promise;
    await expect(page.getByRole('button', { name: 'Aktivierung wird gespeichert …', exact: true })).toBeDisabled();
    await accessibleAutomation(page);
    held.release(); await expect(page.locator('#automation-result')).toContainText('nicht bestätigt');
    await expect(activate(page)).toBeDisabled(); await accessibleAutomation(page);
    await page.unroute(endpoint); await reload(page).click(); await expect(activate(page)).toBeEnabled();
    await action.press('Enter'); await expect(page.locator('#automation-state')).toContainText('aktiv seit Oktober 2026');
    await expect(page.locator('#automation-result')).toBeFocused();
    await accessibleAutomation(page);
    await expect(page.locator('#automation-state')).toHaveAttribute('role', 'status');
    await expect(page.getByRole('navigation')).toContainText('Monat'); await expect(page.getByRole('navigation')).toContainText('Ausgaben');
    const logout = page.getByRole('button', { name: 'Abmelden', exact: true }); await expect(logout).toHaveCSS('background-color', 'rgb(132, 45, 45)');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await expect(page.locator('.monthly-automation')).not.toContainText('Europe/Berlin');
  });
}
