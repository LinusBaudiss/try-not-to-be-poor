import AxeBuilder from '@axe-core/playwright';
import { expect, test, Page, APIRequestContext, Locator } from '@playwright/test';

const password = '  Grüner 🦊 im Baum  ';
const endpoint = '**/api/v1/savings-goals/*';
async function account(request: APIRequestContext): Promise<string> {
  const email = `mutation-${crypto.randomUUID()}@example.org`;
  expect((await request.post('http://127.0.0.1:8080/api/v1/access/registrations', {
    data: { registrationToken: 'a'.repeat(43), email, password }
  })).status()).toBe(201); return email;
}
async function login(page: Page, email: string): Promise<void> {
  await page.goto('/anmelden'); await page.getByLabel('E-Mail-Adresse', { exact: true }).fill(email);
  await page.getByLabel('Passwort', { exact: true }).fill(password); await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Monat', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Sparziele', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sparziel speichern', exact: true })).toBeEnabled();
}
async function create(page: Page, name = 'Reise'): Promise<any> {
  await page.getByLabel('Name des Sparziels', { exact: true }).fill(name);
  await page.getByLabel('Zielbetrag in Euro', { exact: true }).fill('100');
  await page.getByLabel('Zieldatum (optional)', { exact: true }).fill('2028-02-29');
  const response = page.waitForResponse(r => r.url().endsWith('/savings-goals') && r.request().method() === 'POST').then(r => r.json());
  await page.getByRole('button', { name: 'Sparziel speichern', exact: true }).click();
  await expect(page.locator('#goal-status')).toHaveText('Dein Sparziel wurde gespeichert.'); return response;
}
async function open(page: Page, name = 'Reise'): Promise<void> {
  await page.getByRole('button', { name: `Sparziel bearbeiten: ${name}`, exact: true }).click();
  await expect(page.locator('#goal-edit-name')).toBeFocused();
}
async function draft(page: Page, name = 'Korrigiert', amount = '100', date = '2028-02-29'): Promise<void> {
  await page.locator('#goal-edit-name').fill(name); await page.locator('#goal-edit-amount').fill(amount); await page.locator('#goal-edit-date').fill(date);
}
const save = (page: Page) => page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
const cancel = (page: Page) => page.locator('.savings-editor').getByRole('button', { name: 'Abbrechen', exact: true }).click();
const startDelete = (page: Page, name = 'Reise') => page.getByRole('button', { name: `Sparziel löschen: ${name}`, exact: true }).click();
const remove = (page: Page) => page.getByRole('button', { name: 'Endgültig löschen', exact: true }).click();
function gate() { let release!: () => void; return { promise: new Promise<void>(resolve => { release = resolve; }), release: () => release() }; }
async function expectFocusOutline(element: Locator): Promise<void> {
  await expect(element).toBeFocused();
  await expect(element).toHaveCSS('outline-style', 'solid'); await expect(element).toHaveCSS('outline-width', '3px');
  await expect(element).toHaveCSS('outline-color', 'rgb(27, 92, 128)'); await expect(element).toHaveCSS('outline-offset', '3px');
}
async function expectVisibleAction(element: Locator, height: number): Promise<void> {
  await expect(element).toBeFocused(); await expect(element).toBeInViewport({ ratio: 1 });
  const box = (await element.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(44); expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.y).toBeGreaterThanOrEqual(0); expect(box.y + box.height).toBeLessThanOrEqual(height);
}

async function retain(page: Page): Promise<void> { await page.evaluate(() => { (window as any).closedGoals = (window as any).ng.getComponent(document.querySelector('app-savings-goals')); }); }
async function cleared(page: Page): Promise<void> {
  expect(await page.evaluate(() => { const old = (window as any).closedGoals; return {
    items: old.items(), editing: old.targetEditing(), deleting: old.deleting(), name: old.editName, amount: old.editAmount, date: old.editDate,
    status: old.mutationStatus(), error: old.editNameError(), pending: old.pending()
  }; })).toEqual({ items: [], editing: null, deleting: null, name: '', amount: '', date: '', status: '', error: '', pending: false });
}

test('Bearbeiten erhält Fortschritt und zweites Ziel; Datum bleibt erhalten oder wird entfernt, Übererfüllung bleibt sichtbar', async ({ page, request }) => {
  const first = await account(request), second = await account(request); await login(page, first);
  const goal = await create(page); await create(page, 'Unverändert');
  await page.getByRole('button', { name: 'Fortschritt aktualisieren: Reise', exact: true }).click();
  await page.getByLabel('Gesamtfortschritt in Euro').fill('150'); await page.getByRole('button', { name: 'Fortschritt speichern', exact: true }).click();
  await expect(page.locator('#goal-progress-status')).toContainText('gespeichert.');
  await open(page); await expect(page.locator('#goal-edit-name')).toHaveValue('Reise'); await expect(page.locator('#goal-edit-amount')).toHaveValue('100,00');
  await expect(page.locator('#goal-edit-date')).toHaveValue('2028-02-29');
  await draft(page, 'Korrigiert', '100');
  const response = page.waitForResponse(r => r.url().endsWith('/' + goal.id) && r.request().method() === 'PUT').then(r => r.json());
  await save(page); expect(await response).toMatchObject({ id: goal.id, name: 'Korrigiert', progressCents: 15000, targetAmountCents: 10000, targetDate: '2028-02-29' });
  await expect(page.getByRole('button', { name: 'Sparziel bearbeiten: Korrigiert', exact: true })).toBeFocused();
  const card = page.locator('.savings-cards li').filter({ has: page.getByRole('heading', { name: 'Korrigiert', exact: true }) });
  await expect(card).toContainText('150,00 €'); await expect(card).toContainText('150 %'); await expect(card).toContainText('überschritten um 50,00 €');
  await expect(card.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  await open(page, 'Korrigiert'); await draft(page, 'Maximum', '90071992547409,91', ''); await save(page);
  await expect(page.locator('#goal-mutation-status')).toHaveClass(/success/); await page.reload();
  const max = page.locator('.savings-cards li').filter({ has: page.getByRole('heading', { name: 'Maximum', exact: true }) });
  await expect(max).toContainText('90.071.992.547.409,91 €'); await expect(max).not.toContainText('Zieldatum'); await expect(max).toContainText('150,00 €');
  const untouched = page.locator('.savings-cards li').filter({ has: page.getByRole('heading', { name: 'Unverändert', exact: true }) });
  await expect(untouched).toContainText('100,00 €'); await expect(untouched).toContainText('0,00 €'); await expect(untouched).toContainText('29.02.2028');
  await login(page, second); await expect(page.locator('.savings-cards li')).toHaveCount(0);
  await login(page, first); await expect(page.locator('.savings-cards li')).toHaveCount(2);
});

test('Ziel- und Fortschrittsentwürfe sperren sich gegenseitig und erklären die Sperre', async ({ page, request }) => {
  await login(page, await account(request)); await create(page); await create(page, 'Zweites'); await open(page);
  await expect(page.getByRole('button', { name: 'Fortschritt aktualisieren:', exact: false }).first()).toBeDisabled();
  for (const action of await page.locator('.savings-cards button').all()) await expect(action).toBeDisabled();
  await expect(page.locator('#goal-edit-draft-hint')).toContainText('Speichere den offenen Zielentwurf'); await cancel(page);
  await page.getByRole('button', { name: 'Fortschritt aktualisieren: Reise', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sparziel bearbeiten: Reise', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Sparziel löschen: Reise', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Sparziel bearbeiten: Reise', exact: true })).toHaveAttribute('aria-describedby', 'goal-progress-draft-hint');
  await cancel(page); await open(page); await expect(page.locator('#goal-edit-name')).toHaveValue('Reise');
});

test('Ungültige Felder werden ohne Anfrage fokussiert und Entwürfe bleiben erhalten', async ({ page, request }) => {
  await login(page, await account(request)); await create(page); await open(page); let puts = 0;
  page.on('request', r => { if (r.method() === 'PUT') puts++; });
  for (const name of ['', '  ', 'Rei\0se']) { await draft(page, name); await save(page); await expect(page.locator('#goal-edit-name')).toBeFocused(); }
  for (const amount of ['', '0', '-1', '1,001', '1.001', '90071992547409,92']) {
    await draft(page, 'Entwurf', amount); await save(page); await expect(page.locator('#goal-edit-amount')).toHaveValue(amount);
    await expect(page.locator('#goal-edit-amount')).toBeFocused(); await expect(page.locator('#goal-edit-amount')).toHaveAttribute('aria-invalid', 'true');
  }
  for (const date of ['2026-02-29', '0000-01-01', '2028-02-30', '2028-02-29T00:00:00Z']) {
    await draft(page, 'Entwurf', '1', date); await save(page); await expect(page.locator('#goal-edit-date')).toBeFocused(); await expect(page.locator('#goal-edit-date')).toHaveValue(date);
  } expect(puts).toBe(0);
});

for (const fields of [
  { name: 'Prüfe den Namen auf dem Server.' },
  { targetAmountCents: 'Prüfe den Zielbetrag auf dem Server.' },
  { targetDate: 'Prüfe das Zieldatum auf dem Server.' },
  { name: 'Prüfe den Namen auf dem Server.', targetAmountCents: 'Prüfe den Zielbetrag auf dem Server.', targetDate: 'Prüfe das Zieldatum auf dem Server.' }
]) {
  test(`Offline, Serverfeldfehler (${Object.keys(fields).join(', ')}) und Doppelsenden erhalten den Entwurf`, async ({ page, context, request }) => {
    await login(page, await account(request)); await create(page); await open(page); await draft(page, 'Entwurf', '12,34', '2000-02-29');
    await context.setOffline(true); await expect(page.getByRole('button', { name: 'Änderungen speichern', exact: true })).toBeDisabled(); await context.setOffline(false);
    const ready = gate(), held = gate(); let puts = 0;
    await page.route(endpoint, async route => { if (route.request().method() !== 'PUT') return route.continue(); puts++; ready.release(); await held.promise;
      await route.fulfill({ status: 400, json: { fieldErrors: fields } }); });
    await save(page); await ready.promise; await expect(page.getByRole('button', { name: 'Änderungen werden gespeichert …' })).toBeDisabled();
    await page.locator('#goal-edit-amount').press('Enter'); expect(puts).toBe(1); held.release();
    const mapping = [ ['name', 'name'], ['targetAmountCents', 'amount'], ['targetDate', 'date'] ];
    await expect(page.locator('#goal-edit-' + mapping.find(([field]) => field in fields)![1])).toBeFocused();
    for (const [field, id] of mapping) {
      const input = page.locator('#goal-edit-' + id), message = fields[field as keyof typeof fields];
      await expect(input).toHaveAttribute('aria-invalid', String(!!message));
      if (message) {
        await expect(page.locator('#goal-edit-' + id + '-error')).toHaveText(message);
        await expect(input).toHaveAttribute('aria-describedby', id === 'name' ? 'goal-edit-name-error' : `goal-edit-${id}-hint goal-edit-${id}-error`);
      }
    }
    await expect(page.locator('#goal-edit-name')).toHaveValue('Entwurf'); await expect(page.locator('#goal-edit-amount')).toHaveValue('12,34'); await expect(page.locator('#goal-edit-date')).toHaveValue('2000-02-29');
  });
}

test('Korrigieren eines Feldes erhält Fehler der unveränderten Felder', async ({ page, request }) => {
  await login(page, await account(request)); await create(page); await open(page); await draft(page, '', '0', '2026-02-29'); await save(page);
  await expect(page.locator('#goal-edit-name')).toBeFocused();
  const amountMessage = await page.locator('#goal-edit-amount-error').textContent(), dateMessage = await page.locator('#goal-edit-date-error').textContent();
  await page.locator('#goal-edit-name').fill('Korrigiert');
  await expect(page.locator('#goal-edit-name')).toHaveAttribute('aria-invalid', 'false'); await expect(page.locator('#goal-edit-name-error')).toHaveCount(0);
  await expect(page.locator('#goal-edit-amount')).toHaveAttribute('aria-invalid', 'true'); await expect(page.locator('#goal-edit-amount-error')).toHaveText(amountMessage!);
  await expect(page.locator('#goal-edit-date')).toHaveAttribute('aria-invalid', 'true'); await expect(page.locator('#goal-edit-date-error')).toHaveText(dateMessage!);
  await expect(page.locator('#goal-mutation-status')).toHaveText(''); await expect(page.locator('#goal-mutation-status')).not.toHaveClass(/error|success/);
  await page.locator('#goal-edit-amount').fill('1'); await expect(page.locator('#goal-edit-amount-error')).toHaveCount(0);
  await expect(page.locator('#goal-edit-date-error')).toHaveText(dateMessage!);
});

test('404, Serverfehler, fehlende oder unpassende PUT-Bestätigung melden keinen Erfolg', async ({ page, request }) => {
  await login(page, await account(request)); const goal = await create(page); await open(page); await draft(page);
  for (const result of [ { status: 404, json: {} }, { status: 500, json: {} }, { status: 200, json: { ...goal, name: 'Falsch' } },
    { status: 200, json: { ...goal, name: 'Korrigiert', id: crypto.randomUUID() } }, { status: 200, json: { ...goal, name: 'Korrigiert', targetAmountCents: 1 } },
    { status: 200, json: { ...goal, name: 'Korrigiert', targetDate: null } }, { status: 204, body: '' } ]) {
    await page.route(endpoint, route => route.fulfill(result)); await save(page);
    await expect(page.locator('#goal-mutation-status')).toHaveClass(/error/); await expect(page.locator('#goal-edit-name')).toHaveValue('Korrigiert');
    await expect(page.locator('#goal-mutation-status')).toContainText('Lade die Sparziele erneut'); await expect(page.locator('#goal-mutation-status')).not.toHaveClass(/success/); await expectFocusOutline(page.locator('#goal-mutation-status')); await page.unroute(endpoint);
  }
  await page.route(endpoint, async route => { const response = await route.fetch(); expect(response.status()).toBe(200); await route.abort('failed'); });
  await save(page); await expect(page.locator('#goal-mutation-status')).toContainText('nicht bestätigt');
  await page.getByRole('button', { name: 'Sparziele aktualisieren', exact: true }).click(); await expect(page.locator('.savings-cards')).toContainText('Korrigiert');
  await expect(page.locator('#goal-edit-name')).toHaveValue('Korrigiert');
});

test('Löschdialog benennt endgültige Folge, hält Fokus und gibt ihn nach Abbruch und Löschen sinnvoll zurück', async ({ page, request }) => {
  await login(page, await account(request)); await create(page); await create(page, 'Zweites'); await startDelete(page);
  const dialog = page.getByRole('dialog'); await expect(dialog).toContainText('„Reise“ und sein Gesamtfortschritt werden endgültig gelöscht');
  await expect(page.locator('#goal-delete-cancel')).toBeFocused(); await page.keyboard.press('Shift+Tab'); await expect(page.getByRole('button', { name: 'Endgültig löschen', exact: true })).toBeFocused();
  await page.keyboard.press('Tab'); await expect(page.locator('#goal-delete-cancel')).toBeFocused();
  await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible(); await expect(page.getByRole('button', { name: 'Sparziel löschen: Reise', exact: true })).toBeFocused();
  await startDelete(page); await page.locator('#goal-delete-cancel').click(); await expect(page.locator('.savings-cards li')).toHaveCount(2);
  await startDelete(page); await remove(page); await expect(page.locator('.savings-cards li')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Sparziel bearbeiten: Zweites', exact: true })).toBeFocused();
  await page.reload(); await expect(page.locator('.savings-cards li')).toHaveCount(1);
  await startDelete(page, 'Zweites'); await remove(page); await expect(page.getByRole('button', { name: 'Sparziel anlegen', exact: true })).toBeFocused();
});

test('Löschen sperrt offline, Mehrfachanfragen und Dialogschluss während Anfrage', async ({ page, context, request }) => {
  await login(page, await account(request)); await create(page); await startDelete(page); await context.setOffline(true);
  await expect(page.getByRole('button', { name: 'Endgültig löschen', exact: true })).toBeDisabled(); await context.setOffline(false);
  const ready = gate(), held = gate(); let deletes = 0;
  await page.route(endpoint, async route => { deletes++; ready.release(); await held.promise; await route.fulfill({ status: 500, json: {} }); });
  await remove(page); await ready.promise; await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toBeVisible(); await expect(page.locator('#goal-delete-cancel')).toBeDisabled(); await expectFocusOutline(page.locator('#goal-delete-status'));
  await page.keyboard.press('Tab'); await expect(page.locator('#goal-delete-status')).toBeFocused(); expect(deletes).toBe(1); held.release();
  await expect(page.locator('#goal-delete-status')).toContainText('nicht bestätigt'); await expectFocusOutline(page.locator('#goal-delete-status')); await expect(page.locator('.savings-cards li')).toHaveCount(1);
});

test('DELETE-404, Fehler und unpassende Bestätigungen erhalten Ziel und empfehlen erneutes Laden', async ({ page, request }) => {
  await login(page, await account(request)); await create(page); await startDelete(page);
  for (const result of [{ status: 404, json: {} }, { status: 500, json: {} }, { status: 200, body: '' }, { status: 200, json: { deleted: true } }]) {
    await page.route(endpoint, route => route.fulfill(result)); await remove(page);
    await expect(page.locator('#goal-delete-status')).toContainText('lade die Sparziele erneut'); await expect(page.locator('.savings-cards li')).toHaveCount(1);
    await expect(page.getByRole('dialog')).toBeVisible(); await expect(page.locator('#goal-mutation-status')).not.toHaveClass(/success/); await page.unroute(endpoint);
  }
  await page.route(endpoint, async route => { const response = await route.fetch(); expect(response.status()).toBe(204); await route.abort('failed'); });
  await remove(page); await expect(page.locator('#goal-delete-status')).toContainText('möglicherweise bereits gelöscht');
  await expect(page.locator('.savings-cards li')).toHaveCount(1); await page.locator('#goal-delete-cancel').click(); await page.unroute(endpoint);
  await page.getByRole('button', { name: 'Sparziele aktualisieren', exact: true }).click(); await expect(page.locator('.savings-cards li')).toHaveCount(0);
});

for (const method of ['PUT', 'DELETE']) {
  test(`${method}: Timeout verwirft auch die verspätete erfolgreiche Bestätigung und erhält Entwurf/Dialog`, async ({ page, request }) => {
    await page.clock.install(); await login(page, await account(request)); const goal = await create(page);
    const ready = gate(), held = gate(), delivered = gate();
    await page.route(endpoint, async route => {
      const response = await route.fetch(); expect(response.status()).toBe(method === 'PUT' ? 200 : 204);
      ready.release(); await held.promise; await route.fulfill({ response }); delivered.release();
    });
    if (method === 'PUT') { await open(page); await draft(page); await save(page); } else { await startDelete(page); await remove(page); }
    await ready.promise; await page.clock.fastForward(30_001);
    const status = page.locator(method === 'PUT' ? '#goal-mutation-status' : '#goal-delete-status');
    await expect(status).toContainText('nicht bestätigt'); const timeoutMessage = await status.textContent();
    held.release(); await delivered.promise; await page.clock.runFor(100);
    await expect(status).toHaveText(timeoutMessage!); await expect(status).not.toHaveClass(/success/);
    await expect(page.locator('.savings-cards li')).toHaveCount(1); await expect(page.locator('.savings-cards h3')).toHaveText(goal.name);
    if (method === 'PUT') {
      await expect(page.locator('#goal-edit-name')).toHaveValue('Korrigiert'); await expect(page.locator('#goal-edit-amount')).toHaveValue('100'); await expect(page.locator('#goal-edit-date')).toHaveValue('2028-02-29');
    } else { await expect(page.getByRole('dialog')).toBeVisible(); await expect(page.locator('#goal-delete-cancel')).toBeEnabled(); }
  });
  for (const boundary of ['logout', 'switch', 'expiry']) {
    test(`${method}: verspätete Antwort nach ${boundary} wird verworfen und Speicherentwürfe werden geleert`, async ({ page, context, request }) => {
      if (boundary === 'expiry') await page.clock.install();
      const first = await account(request), second = boundary === 'switch' ? await account(request) : ''; await login(page, first); await create(page);
      const ready = gate(), held = gate();
      await page.route(endpoint, async route => { const response = await route.fetch(); ready.release(); await held.promise; await route.fulfill({ response }); });
      const refreshReady = gate(), refreshHeld = gate();
      if (boundary === 'expiry') {
        await page.route('**/api/v1/access/refresh', async route => { const response = await route.fetch(); refreshReady.release(); await refreshHeld.promise; await route.fulfill({ response }); });
        await page.clock.fastForward(570_001); await refreshReady.promise; await page.clock.fastForward(28_000);
      }
      if (method === 'PUT') { await open(page); await draft(page); } else await startDelete(page);
      await retain(page); if (method === 'PUT') await save(page); else await remove(page); await ready.promise;
      if (boundary === 'logout') {
        // Native modal makes the background inert; session logout is driven through the same component service.
        await page.evaluate(() => (window as any).closedGoals.session.logout());
      } else if (boundary === 'switch') { const other = await context.newPage(); await login(other, second); await expect(other.locator('.savings-cards li')).toHaveCount(0); }
      else await page.clock.fastForward(3_000);
      await expect(page).toHaveURL('/anmelden');
      const answered = page.waitForResponse(r => r.request().method() === method && /savings-goals\/[\w-]+$/.test(r.url())); held.release(); await answered;
      if (boundary === 'expiry') { const revoked = page.waitForResponse('**/api/v1/access/logout'); refreshHeld.release(); expect((await revoked).status()).toBe(204); }
      await cleared(page);
    });
  }
}

test('Editor und Löschdialog bleiben per Tastatur bei Textvergrößerung und zoomäquivalentem Reflow zugänglich', async ({ page, request }) => {
  await login(page, await account(request)); await create(page, 'SehrLangerName'.repeat(12));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const cases = [
    ...[[320, 568], [390, 844], [768, 1024], [1280, 800]].flatMap(([width, height]) => ['100%', '200%'].map(fontSize => ({
      label: `${width}×${height}, Textgröße ${fontSize}`, width, height, fontSize
    }))),
    { label: 'Tablet 768×1024 bei 200 % Zoom: effektiver Viewport 384×512', width: 384, height: 512, fontSize: '100%' },
    { label: 'Desktop 1280×800 bei 200 % Zoom: effektiver Viewport 640×400', width: 640, height: 400, fontSize: '100%' }
  ];
  for (const { label, width, height, fontSize } of cases) await test.step(label, async () => {
    await page.setViewportSize({ width, height }); await page.evaluate(value => { document.documentElement.style.fontSize = value; }, fontSize);
    await page.getByRole('button', { name: 'Sparziel bearbeiten:', exact: false }).focus(); await page.keyboard.press('Enter'); await expect(page.locator('#goal-edit-name')).toBeFocused();
    await page.keyboard.press('Tab'); await expect(page.locator('#goal-edit-amount')).toBeFocused(); await page.keyboard.press('Tab'); await expect(page.locator('#goal-edit-date')).toBeFocused();
    for (const input of await page.locator('.savings-editor input').all()) expect((await input.boundingBox())!.height).toBeGreaterThanOrEqual(48);
    await page.keyboard.press('Tab'); await expectVisibleAction(page.getByRole('button', { name: 'Änderungen speichern', exact: true }), height);
    await page.keyboard.press('Tab'); const cancelAction = page.locator('.savings-editor').getByRole('button', { name: 'Abbrechen', exact: true }); await expectVisibleAction(cancelAction, height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]); await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Sparziel bearbeiten:', exact: false })).toBeFocused();
    await page.getByRole('button', { name: 'Sparziel löschen:', exact: false }).focus(); await page.keyboard.press('Enter'); await expect(page.locator('#goal-delete-cancel')).toBeFocused();
    const dialog = page.getByRole('dialog'); expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    for (const button of await dialog.getByRole('button').all()) { await button.focus(); await expectVisibleAction(button, height); }
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]); await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Sparziel löschen:', exact: false })).toBeFocused();
  });
});
