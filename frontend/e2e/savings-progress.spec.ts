import AxeBuilder from '@axe-core/playwright';
import { expect, test, Page, APIRequestContext, Locator } from '@playwright/test';

const password = '  Grüner 🦊 im Baum  ';
const endpoint = '**/api/v1/savings-goals/*/progress';
async function account(request: APIRequestContext): Promise<string> {
  const email = `progress-${crypto.randomUUID()}@example.org`;
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
  await page.getByRole('link', { name: 'Sparziele', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sparziel speichern', exact: true })).toBeEnabled();
}
async function create(page: Page, amount = '100', name = 'Reise', date = '2028-02-29'): Promise<any> {
  await page.getByLabel('Name des Sparziels').fill(name);
  await page.getByLabel('Zielbetrag in Euro').fill(amount);
  await page.getByLabel('Zieldatum (optional)').fill(date);
  const response = page.waitForResponse(response => response.url().endsWith('/savings-goals') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Sparziel speichern', exact: true }).click();
  await expect(page.locator('#goal-status')).toHaveText('Dein Sparziel wurde gespeichert.');
  return (await response).json();
}
async function edit(page: Page, value: string): Promise<void> {
  await page.getByRole('button', { name: 'Fortschritt aktualisieren:', exact: false }).click();
  await expect(page.getByLabel('Gesamtfortschritt in Euro')).toBeFocused();
  await page.getByLabel('Gesamtfortschritt in Euro').fill(value);
}
async function save(page: Page, value: string): Promise<void> {
  await edit(page, value);
  await page.getByRole('button', { name: 'Fortschritt speichern', exact: true }).click();
  await expect(page.locator('#goal-progress-status')).toContainText('Der Gesamtfortschritt für „');
  await expect(page.locator('#goal-progress-status')).toContainText(' gespeichert.');
  await expect(page.getByRole('button', { name: 'Fortschritt aktualisieren:', exact: false })).toBeFocused();
}
async function expectFill(track: Locator, percent: number): Promise<void> {
  const ratio = await track.evaluate(element => {
    const fill = element.querySelector('span')!.getBoundingClientRect().width;
    return fill / element.clientWidth * 100;
  });
  expect(ratio).toBeCloseTo(percent, 0);
}
function gate() {
  let release!: () => void;
  return { promise: new Promise<void>(resolve => { release = resolve; }), release: () => release() };
}
async function retainComponent(page: Page): Promise<void> {
  await page.evaluate(() => { (window as any).closedGoals = (window as any).ng.getComponent(document.querySelector('app-savings-goals')); });
}
async function expectCleared(page: Page): Promise<void> {
  expect(await page.evaluate(() => {
    const old = (window as any).closedGoals;
    return { items: old.items(), editing: old.editing(), amount: old.progressAmount, error: old.progressError(), status: old.progressStatus(), pending: old.pending() };
  })).toEqual({ items: [], editing: null, amount: '', error: '', status: '', pending: false });
}

test('Gesamtfortschritt wird ersetzt und bleibt nach Neuladen erhalten; Beträge, Prozente und Überschreitung sind exakt', async ({ page, request }) => {
  const first = await account(request), second = await account(request);
  await login(page, first); await create(page);
  await expectFill(page.getByRole('progressbar'), 0);
  await save(page, '20'); await save(page, '30');
  const cards = page.locator('.savings-cards');
  await expect(cards).toContainText('30,00 €'); await expect(cards).toContainText('30 %');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '30');
  await expectFill(page.getByRole('progressbar'), 30);
  await expect(page.locator('#goal-progress-status')).toHaveText('Der Gesamtfortschritt für „Reise“ wurde mit 30,00 € gespeichert.');
  await page.reload(); await expect(cards).toContainText('30,00 €');
  await page.getByRole('button', { name: 'Fortschritt aktualisieren:', exact: false }).click();
  await expect(page.getByLabel('Gesamtfortschritt in Euro')).toHaveValue('30,00');
  await page.getByRole('button', { name: 'Abbrechen', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Fortschritt aktualisieren:', exact: false })).toBeFocused();
  await save(page, '150'); await expect(cards).toContainText('150,00 €'); await expect(cards).toContainText('150 %');
  await expect(cards).toContainText('Zielbetrag überschritten um 50,00 €.');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  await expectFill(page.getByRole('progressbar'), 100);
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '150,00 € von 100,00 €, 150 %');
  for (const value of ['0', '90071992547409,91', '0,01']) {
    await save(page, value); await page.reload();
    await expect(page.getByRole('button', { name: 'Fortschritt aktualisieren:', exact: false })).toBeEnabled();
    await page.getByRole('button', { name: 'Fortschritt aktualisieren:', exact: false }).click();
    await expect(page.getByLabel('Gesamtfortschritt in Euro')).toHaveValue(value === '0' ? '0,00' : value);
    await page.getByRole('button', { name: 'Abbrechen', exact: true }).click();
  }
  await expect(cards).toContainText('Reise'); await expect(cards).toContainText('29.02.2028'); await expect(cards).toContainText('100,00 €');
  await login(page, second); await expect(page.locator('.savings-cards li')).toHaveCount(0);
  await login(page, first); await expect(cards).toContainText('0,01 €');
  expect(await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }))).toEqual({ local: [], session: [] });
});

test('Prozentanzeige rundet kaufmännisch auf höchstens zwei Stellen und Maximum bei Ein-Cent-Ziel bleibt dezimal', async ({ page, request }) => {
  await login(page, await account(request)); await create(page, '0,03');
  await save(page, '0,01'); await expect(page.locator('.savings-cards')).toContainText('33,33 %');
  await save(page, '0,02'); await expect(page.locator('.savings-cards')).toContainText('66,67 %');
  await login(page, await account(request)); await create(page, '0,32');
  await save(page, '0,01'); await expect(page.locator('.savings-cards')).toContainText('3,13 %');
  await login(page, await account(request)); await create(page, '0,01');
  await save(page, '90071992547409,91');
  await expect(page.locator('.savings-cards')).toContainText('900.719.925.474.099.100 %');
  await expect(page.locator('.savings-cards')).toContainText('Zielbetrag überschritten um 90.071.992.547.409,90 €.');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
});

test('Feldfehler behalten Eingabe und Fokus; offline und gemeinsame Sendesperre verhindern Mutationen', async ({ page, context, request }) => {
  await login(page, await account(request)); await create(page); let puts = 0;
  page.on('request', request => { if (request.method() === 'PUT' && request.url().endsWith('/progress')) puts++; });
  await edit(page, '');
  for (const value of ['', '-1', '1,001', '1.001', '1e2', '1.000,00', '90071992547409,92']) {
    await page.getByLabel('Gesamtfortschritt in Euro').fill(value);
    await page.getByRole('button', { name: 'Fortschritt speichern', exact: true }).click();
    await expect(page.getByLabel('Gesamtfortschritt in Euro')).toHaveValue(value);
    await expect(page.getByLabel('Gesamtfortschritt in Euro')).toBeFocused();
    await expect(page.getByLabel('Gesamtfortschritt in Euro')).toHaveAttribute('aria-describedby', 'goal-progress-hint goal-progress-error');
    await expect(page.getByLabel('Gesamtfortschritt in Euro')).toHaveAttribute('aria-invalid', 'true');
  }
  expect(puts).toBe(0); await page.getByLabel('Gesamtfortschritt in Euro').fill('12,34');
  await context.setOffline(true); await expect(page.getByRole('button', { name: 'Fortschritt speichern', exact: true })).toBeDisabled();
  await expect(page.getByText('Du bist offline.', { exact: false })).toBeVisible(); await context.setOffline(false);
  const ready = gate(), held = gate();
  await page.route(endpoint, async route => { ready.release(); await held.promise; await route.fulfill({ status: 400, json: { code: 'VALIDATION_FAILED', fieldErrors: { progressCents: 'Prüfe den Fortschritt.' } } }); });
  await page.getByRole('button', { name: 'Fortschritt speichern', exact: true }).click(); await ready.promise;
  await expect(page.getByRole('button', { name: 'Fortschritt wird gespeichert …' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Sparziel speichern', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Sparziele aktualisieren', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Abbrechen', exact: true })).toBeDisabled();
  await expect(page.getByLabel('Gesamtfortschritt in Euro')).toHaveAttribute('readonly', '');
  await page.getByLabel('Gesamtfortschritt in Euro').press('Enter'); expect(puts).toBe(1); held.release();
  await expect(page.locator('#goal-progress-error')).toHaveText('Prüfe den Fortschritt.');
  await expect(page.getByLabel('Gesamtfortschritt in Euro')).toBeFocused(); await expect(page.getByLabel('Gesamtfortschritt in Euro')).toHaveValue('12,34');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
});

test('verlorene Commitbestätigung behält Entwurf und alten Fortschritt; Neuladen liest den bestätigten Wert', async ({ page, request }) => {
  await login(page, await account(request)); await create(page);
  await page.route(endpoint, async route => { const response = await route.fetch(); expect(response.status()).toBe(200); await route.abort('failed'); });
  await edit(page, '12,34'); await page.getByRole('button', { name: 'Fortschritt speichern', exact: true }).click();
  await expect(page.locator('#goal-progress-status')).toContainText('nicht bestätigt'); await expect(page.locator('#goal-progress-status')).not.toHaveClass(/success/);
  await expect(page.getByLabel('Gesamtfortschritt in Euro')).toHaveValue('12,34'); await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  await page.getByRole('button', { name: 'Sparziele aktualisieren', exact: true }).click();
  await expect(page.locator('.savings-cards')).toContainText('12,34 €'); await expect(page.getByLabel('Gesamtfortschritt in Euro')).toHaveValue('12,34');
});

test('nur passende geprüfte 200-Antworten bestätigen den Fortschritt; Fehler erhalten den Entwurf', async ({ page, request }) => {
  await login(page, await account(request)); const goal = await create(page);
  await edit(page, '30');
  for (const failure of [
    { status: 201, json: { ...goal, progressCents: 3000 } },
    { status: 200, json: { ...goal, id: crypto.randomUUID(), progressCents: 3000 } },
    { status: 200, json: { ...goal, progressCents: 2999 } },
    { status: 200, json: { ...goal, progressCents: '3000' } },
    { status: 200, json: { ...goal, progressCents: 3000, name: 'Anderes Ziel' } },
    { status: 200, json: { ...goal, progressCents: 3000, targetAmountCents: 0 } },
    { status: 200, json: { ...goal, progressCents: 3000, targetDate: '2026-02-29' } },
    { status: 404, json: { code: 'SAVINGS_GOAL_NOT_FOUND' } },
    { status: 500, json: { code: 'SAVINGS_GOAL_UNAVAILABLE' } }
  ]) {
    await page.route(endpoint, route => route.fulfill(failure));
    await page.getByLabel('Gesamtfortschritt in Euro').fill('30');
    await page.getByRole('button', { name: 'Fortschritt speichern', exact: true }).click();
    await expect(page.locator('#goal-progress-status')).toContainText(failure.status === 404 ? 'nicht gefunden' : 'nicht bestätigt');
    await expect(page.locator('#goal-progress-status')).not.toHaveClass(/success/);
    await expect(page.getByLabel('Gesamtfortschritt in Euro')).toHaveValue('30');
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    await expect(page.getByRole('button', { name: 'Fortschritt speichern', exact: true })).toBeEnabled(); await page.unroute(endpoint);
  }
});

for (const boundary of ['Abmeldung', 'Kontowechsel', 'Tokenablauf']) {
  test(`verspätete PUT-Antwort nach ${boundary} wird verworfen und Entwurf gelöscht`, async ({ page, context, request }) => {
    if (boundary === 'Tokenablauf') await page.clock.install();
    await login(page, await account(request)); await create(page);
    const ready = gate(), held = gate();
    await page.route(endpoint, async route => { const response = await route.fetch(); ready.release(); await held.promise; await route.fulfill({ response }); });
    const refreshReady = gate(), refreshHeld = gate();
    if (boundary === 'Tokenablauf') {
      await page.route('**/api/v1/access/refresh', async route => { const response = await route.fetch(); refreshReady.release(); await refreshHeld.promise; await route.fulfill({ response }); });
      await page.clock.fastForward(570_001); await refreshReady.promise; await page.clock.fastForward(28_000);
    }
    await edit(page, '12,34'); await retainComponent(page);
    await page.getByRole('button', { name: 'Fortschritt speichern', exact: true }).click(); await ready.promise;
    if (boundary === 'Abmeldung') await page.getByRole('button', { name: 'Abmelden', exact: true }).click();
    if (boundary === 'Kontowechsel') {
      const other = await context.newPage(); await login(other, await account(request)); await expect(other.locator('.savings-cards li')).toHaveCount(0);
      await expect(other.getByLabel('Gesamtfortschritt in Euro')).toHaveCount(0);
    }
    if (boundary === 'Tokenablauf') await page.clock.fastForward(3_000);
    await expect(page).toHaveURL('/anmelden');
    const answered = page.waitForResponse(response => response.url().endsWith('/progress')); held.release(); await answered;
    if (boundary === 'Tokenablauf') {
      const revoked = page.waitForResponse('**/api/v1/access/logout'); refreshHeld.release(); expect((await revoked).status()).toBe(204);
    }
    await expectCleared(page);
  });
}

test('beschrifteter Balken, Editor, Fehler und 200-Prozent-Schrift bleiben per Tastatur in allen Prüfgrößen zugänglich', async ({ page, request }) => {
  await login(page, await account(request)); await create(page, '0,01', 'SehrLangerZielname'.repeat(12));
  await save(page, '90071992547409,91'); await edit(page, '-1');
  await page.getByRole('button', { name: 'Fortschritt speichern', exact: true }).click();
  await expect(page.getByLabel('Gesamtfortschritt in Euro')).toBeFocused();
  for (const [width, height] of [[320, 568], [390, 844], [768, 1024], [1280, 800]]) {
    await page.setViewportSize({ width, height });
    for (const size of ['100%', '200%']) {
      await page.evaluate(value => { document.documentElement.style.fontSize = value; }, size);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      for (const selector of ['.savings-cards', '.savings-editor'])
        expect(await page.locator(selector).evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
      await expect(page.locator('.savings-cards')).toContainText('90.071.992.547.409,91 €');
      await expect(page.locator('.savings-cards')).toContainText('900.719.925.474.099.100 %');
      for (const action of await page.locator('button, nav a').all()) {
        const bounds = (await action.boundingBox())!; expect(bounds.height).toBeGreaterThanOrEqual(44); expect(bounds.width).toBeGreaterThanOrEqual(44);
      }
      expect((await page.getByLabel('Gesamtfortschritt in Euro').boundingBox())!.height).toBeGreaterThanOrEqual(48);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    }
  }
  await page.getByLabel('Gesamtfortschritt in Euro').focus(); await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Fortschritt speichern', exact: true })).toBeFocused();
  await page.keyboard.press('Tab'); await expect(page.getByRole('button', { name: 'Abbrechen', exact: true })).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page.getByRole('button', { name: 'Fortschritt aktualisieren:', exact: false })).toBeFocused();
  await expect(page.getByLabel('Gesamtfortschritt in Euro')).toHaveCount(0);
});


test('Zeitüberschreitung nach 30 Sekunden entsperrt den Editor und verwirft die späte Bestätigung', async ({ page, request }) => {
  await page.clock.install(); await login(page, await account(request)); await create(page);
  const ready = gate(), held = gate(), finished = gate();
  await page.route(endpoint, async route => {
    const response = await route.fetch(); expect(response.status()).toBe(200); ready.release(); await held.promise;
    try { await route.fulfill({ response }).catch(() => {}); } finally { finished.release(); }
  });
  await edit(page, '12,34'); await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100));
  await page.getByRole('button', { name: 'Fortschritt speichern', exact: true }).click(); await ready.promise;
  await page.clock.runFor(20); await expect(page.getByRole('button', { name: 'Fortschritt wird gespeichert …' })).toBeDisabled();
  await page.clock.fastForward(29_979); await expect(page.getByRole('button', { name: 'Fortschritt wird gespeichert …' })).toBeDisabled();
  await page.clock.runFor(22); await expect(page.locator('#goal-progress-status')).toContainText('nicht bestätigt');
  await expect(page.getByRole('button', { name: 'Fortschritt speichern', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Abbrechen', exact: true })).toBeEnabled();
  await expect(page.getByLabel('Gesamtfortschritt in Euro')).toHaveValue('12,34');
  held.release(); await finished.promise; await page.clock.runFor(50);
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  await expect(page.locator('#goal-progress-status')).not.toHaveClass(/success/);
  await expect(page.getByLabel('Gesamtfortschritt in Euro')).toHaveValue('12,34');
});

test('offener Entwurf erklärt gesperrte andere Ziele; bestätigtes Speichern ändert ausschließlich das gewählte Ziel', async ({ page, request }) => {
  await login(page, await account(request)); const travel = await create(page); const car = await create(page, '50', 'Auto', '');
  const travelAction = page.getByRole('button', { name: 'Fortschritt aktualisieren: Reise', exact: true });
  const carAction = page.getByRole('button', { name: 'Fortschritt aktualisieren: Auto', exact: true });
  await travelAction.click(); await page.getByLabel('Gesamtfortschritt in Euro').fill('12,34');
  await expect(carAction).toBeDisabled(); await expect(carAction).toHaveAttribute('aria-describedby', 'goal-progress-draft-hint');
  await expect(page.locator('#goal-progress-draft-hint')).toHaveText('Speichere den offenen Fortschrittsentwurf oder brich ihn ab, bevor du ein anderes Sparziel auswählst.');
  await travelAction.click();
  await expect(page.getByLabel('Gesamtfortschritt in Euro')).toHaveValue('12,34'); await expect(page.getByLabel('Gesamtfortschritt in Euro')).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Fortschritt für Reise', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Abbrechen', exact: true }).click(); await expect(travelAction).toBeFocused(); await expect(carAction).toBeEnabled();
  await travelAction.click(); await page.getByLabel('Gesamtfortschritt in Euro').fill('30');
  await page.getByRole('button', { name: 'Fortschritt speichern', exact: true }).click();
  await expect(page.locator('#goal-progress-status')).toHaveText('Der Gesamtfortschritt für „Reise“ wurde mit 30,00 € gespeichert.');
  await expect(travelAction).toBeFocused(); await expect(carAction).toBeEnabled();
  await expect(page.locator('.savings-cards li')).toHaveCount(2);
  const travelCard = page.locator('.savings-cards li').filter({ has: page.getByRole('heading', { name: 'Reise', exact: true }) });
  const carCard = page.locator('.savings-cards li').filter({ has: page.getByRole('heading', { name: 'Auto', exact: true }) });
  await expect(travelCard.locator('h3')).toHaveAttribute('id', 'goal-title-' + travel.id);
  const field = (card: Locator, label: string) => card.locator('dl div').filter({ has: page.getByText(label, { exact: true }) }).locator('dd');
  await expect(field(travelCard, 'Zielbetrag')).toHaveText('100,00 €'); await expect(field(travelCard, 'Fortschritt')).toHaveText('30,00 €');
  await expect(field(travelCard, 'Zieldatum')).toHaveText('29.02.2028');
  await expect(travelCard.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '30');
  await expect(carCard.locator('h3')).toHaveAttribute('id', 'goal-title-' + car.id);
  await expect(field(carCard, 'Zielbetrag')).toHaveText('50,00 €'); await expect(field(carCard, 'Fortschritt')).toHaveText('0,00 €');
  await expect(carCard).not.toContainText('Zieldatum');
  await expect(carCard.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  await carAction.click(); await expect(page.getByLabel('Gesamtfortschritt in Euro')).toHaveValue('0,00');
  await expect(page.getByRole('heading', { name: 'Fortschritt für Auto', exact: true })).toBeVisible();
});

for (const refresh of ['läuft', 'fehlgeschlagen']) {
  test(`Abbrechen nach ${refresh === 'läuft' ? 'laufendem' : 'fehlgeschlagenem'} Listenabruf fokussiert die bleibende Ladeaktion`, async ({ page, request }) => {
    await login(page, await account(request)); await create(page); await edit(page, '12,34');
    const ready = gate(), held = gate();
    await page.route('**/api/v1/savings-goals', async route => {
      ready.release(); await held.promise;
      await route.fulfill({ status: 500, json: { code: 'SAVINGS_GOAL_UNAVAILABLE' } });
    });
    const reload = page.locator('#goals-refresh'); await reload.click(); await ready.promise;
    await expect(page.locator('.savings-cards li')).toHaveCount(0);
    if (refresh === 'fehlgeschlagen') { held.release(); await expect(page.locator('#goals-list-status')).toHaveText('Deine Sparziele konnten nicht geladen werden.'); }
    await page.getByRole('button', { name: 'Abbrechen', exact: true }).click();
    await expect(reload).toBeFocused(); await expect(page.getByLabel('Gesamtfortschritt in Euro')).toHaveCount(0);
    if (refresh === 'läuft') { held.release(); await expect(page.locator('#goals-list-status')).toHaveText('Deine Sparziele konnten nicht geladen werden.'); }
    await expect(reload).toBeFocused();
  });
}
