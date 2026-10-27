import AxeBuilder from '@axe-core/playwright';
import { expect, test, Page, APIRequestContext } from '@playwright/test';

const password = '  Grüner 🦊 im Baum  ';
const endpoint = '**/api/v2/expenses/*';
async function account(request: APIRequestContext): Promise<string> {
  const email = `mutations-${crypto.randomUUID()}@example.org`;
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
  await page.getByRole('link', { name: 'Ausgaben', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ausgabe speichern', exact: true })).toBeEnabled();
}
async function save(page: Page, name: string, amount: string): Promise<void> {
  await page.getByLabel('Name der Ausgabe').fill(name);
  await page.getByLabel('Ausgabenbetrag in Euro').fill(amount);
  await page.getByRole('button', { name: 'Ausgabe speichern', exact: true }).click();
  await expect(page.locator('#expense-status')).toHaveText('Deine Ausgabe wurde gespeichert.');
}
function action(page: Page, name: string, mode: 'bearbeiten' | 'löschen') {
  return page.getByRole('button', { name: `${name} ${mode}`, exact: true });
}
function gate() {
  let release!: () => void;
  return { promise: new Promise<void>(resolve => { release = resolve; }), release: () => release() };
}
async function edit(page: Page, name: string, amount: string) {
  await page.getByLabel('Name bearbeiten', { exact: true }).fill(name);
  await page.getByLabel('Betrag bearbeiten in Euro', { exact: true }).fill(amount);
}
const summaryMoney = (page: Page) => page.locator('app-month-summary .summary-money');
async function setBudget(page: Page): Promise<void> {
  await page.getByRole('link', { name: 'Monat', exact: true }).click();
  await page.getByLabel('Monatsbudget in Euro').fill('100');
  await page.getByRole('button', { name: 'Budget speichern', exact: true }).click();
  await expect(summaryMoney(page)).toHaveText('100,00 €');
  await page.getByRole('link', { name: 'Ausgaben', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ausgabe speichern', exact: true })).toBeEnabled();
}
async function reviewHistory(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Historie zur Prüfung laden', exact: true }).click();
  await page.getByRole('button', { name: 'Ich habe die Historie geprüft', exact: true }).click();
}

test('Bearbeiten ist vorbelegt, abbrechbar und bestätigt Werte erst nach Antwort; Erfassungsentwurf bleibt', async ({ page, request }) => {
  await login(page, await account(request));
  await setBudget(page);
  await save(page, 'Brot', '12,34');
  const originalDate = await page.locator('.expense-cards dd').last().textContent();
  await page.getByLabel('Name der Ausgabe').fill('Neuer Entwurf');
  await page.getByLabel('Ausgabenbetrag in Euro').fill('7,89');
  await action(page, 'Brot', 'bearbeiten').click();
  await expect(page.getByLabel('Name bearbeiten', { exact: true })).toHaveValue('Brot');
  await expect(page.getByLabel('Betrag bearbeiten in Euro')).toHaveValue('12,34');
  await expect(page.getByLabel('Name bearbeiten', { exact: true })).toBeFocused();
  await edit(page, 'Abbruch', '20');
  await page.getByRole('button', { name: 'Bearbeitung abbrechen', exact: true }).click();
  await expect(action(page, 'Brot', 'bearbeiten')).toBeFocused();
  await expect(page.locator('.expense-cards')).toContainText('12,34 €');
  await expect(page.locator('.expense-editor')).toHaveCount(0);
  await action(page, 'Brot', 'bearbeiten').click();
  await edit(page, '  Brot korrigiert  ', '20,01');
  const held = gate(), ready = gate(); let puts = 0;
  await page.route(endpoint, async route => {
    if (route.request().method() !== 'PUT') return route.continue();
    puts++; const response = await route.fetch(); ready.release(); await held.promise; await route.fulfill({ response });
  });
  await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click(); await ready.promise;
  await expect(page.locator('.expense-cards')).toContainText('12,34 €');
  await expect(page.getByRole('button', { name: 'Änderungen speichern', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Ausgabe speichern', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Bearbeitung abbrechen', exact: true })).toBeDisabled();
  await page.getByLabel('Betrag bearbeiten in Euro').press('Enter'); expect(puts).toBe(1);
  held.release();
  await expect(page.locator('#expense-status')).toHaveText('Deine Ausgabe wurde geändert.');
  await expect(page.locator('.expense-cards')).toContainText('Brot korrigiert');
  await expect(page.locator('.expense-cards')).toContainText('20,01 €');
  await expect(page.locator('.expense-cards dd').last()).toHaveText(originalDate!);
  await expect(action(page, 'Brot korrigiert', 'bearbeiten')).toBeFocused();
  await expect(page.getByLabel('Name der Ausgabe')).toHaveValue('Neuer Entwurf');
  await expect(page.getByLabel('Ausgabenbetrag in Euro')).toHaveValue('7,89');
  await page.reload(); await expect(page.locator('.expense-cards')).toContainText('20,01 €');
});

test('Löschdialog nennt Eintrag und Folge, schließt Fokus ein, startet bei Abbrechen und entfernt erst bestätigt', async ({ page, request }) => {
  await login(page, await account(request));
  await setBudget(page);
  await save(page, 'Erste', '10'); await save(page, 'Zweite', '20');
  const firstName = await page.locator('.expense-cards li').first().locator('dd').first().textContent();
  const otherName = firstName === 'Erste' ? 'Zweite' : 'Erste';
  await action(page, firstName!, 'löschen').click();
  const dialog = page.getByRole('dialog', { name: 'Ausgabe löschen?' });
  await expect(dialog).toContainText(firstName!); await expect(dialog).toContainText('endgültig');
  await expect(dialog).toContainText('Restbudget');
  await expect(dialog.getByRole('button', { name: 'Abbrechen', exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await expect(dialog.getByRole('button', { name: 'Endgültig löschen', exact: true })).toBeFocused();
  await page.keyboard.press('Tab'); await expect(dialog.getByRole('button', { name: 'Abbrechen', exact: true })).toBeFocused();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible();
  await expect(action(page, firstName!, 'löschen')).toBeFocused(); await expect(page.locator('.expense-cards li')).toHaveCount(2);
  await action(page, firstName!, 'löschen').click(); await dialog.getByRole('button', { name: 'Abbrechen', exact: true }).click();
  await expect(action(page, firstName!, 'löschen')).toBeFocused();
  await action(page, firstName!, 'löschen').click();
  const held = gate(), ready = gate(); let deletes = 0;
  await page.route(endpoint, async route => {
    if (route.request().method() !== 'DELETE') return route.continue();
    deletes++; const response = await route.fetch(); ready.release(); await held.promise; await route.fulfill({ response });
  });
  await dialog.getByRole('button', { name: 'Endgültig löschen', exact: true }).click(); await ready.promise;
  await expect(page.locator('.expense-cards li')).toHaveCount(2);
  await expect(dialog.getByRole('button', { name: 'Abbrechen', exact: true })).toBeDisabled();
  await expect(page.locator('#expense-delete-status')).toBeFocused();
  await page.keyboard.press('Tab'); await expect(page.locator('#expense-delete-status')).toBeFocused();
  await page.keyboard.press('Escape'); await expect(dialog).toBeVisible(); expect(deletes).toBe(1);
  held.release(); await expect(dialog).not.toBeVisible();
  await expect(page.locator('.expense-cards li')).toHaveCount(1);
  await expect(action(page, otherName, 'bearbeiten')).toBeFocused();
  await page.unroute(endpoint);
  await action(page, otherName, 'löschen').click(); await dialog.getByRole('button', { name: 'Endgültig löschen', exact: true }).click();
  await expect(page.getByText('Noch keine Ausgaben erfasst.')).toBeVisible();
  await expect(page.getByLabel('Name der Ausgabe')).toBeFocused();
});

test('Bearbeitungsfelder zeigen verständliche Fehler für leere Namen, Null, Überpräzision und Überlauf ohne Request', async ({ page, request, context }) => {
  await login(page, await account(request)); await save(page, 'Brot', '1,15');
  let requests = 0; page.on('request', req => { if (['PUT', 'DELETE'].includes(req.method()) && /expenses\//.test(req.url())) requests++; });
  await action(page, 'Brot', 'bearbeiten').click(); await edit(page, '  ', '1');
  await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
  await expect(page.getByLabel('Name bearbeiten', { exact: true })).toBeFocused();
  await expect(page.locator('#expense-edit-name-error')).toBeVisible();
  for (const value of ['0', '-1', '1,001', '1.009', '90071992547409,92', '1.000,00', 'NaN']) {
    await edit(page, 'Korrektur', value); await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
    await expect(page.getByLabel('Betrag bearbeiten in Euro')).toBeFocused(); await expect(page.locator('#expense-edit-amount-error')).toBeVisible();
  }
  expect(requests).toBe(0);
  await edit(page, 'Korrektur', '2'); await context.setOffline(true);
  await expect(page.getByRole('button', { name: 'Änderungen speichern', exact: true })).toBeDisabled();
  await action(page, 'Brot', 'löschen').click();
  await expect(page.getByRole('button', { name: 'Endgültig löschen', exact: true })).toBeDisabled();
  await page.getByRole('dialog').getByRole('button', { name: 'Abbrechen', exact: true }).click();
  await expect(action(page, 'Brot', 'löschen')).toBeFocused();
  await page.getByRole('button', { name: 'Bearbeitung abbrechen', exact: true }).click();
  await expect(action(page, 'Brot', 'bearbeiten')).toBeFocused();
  await action(page, 'Brot', 'bearbeiten').click(); await edit(page, 'Korrektur', '2');
  await context.setOffline(false); expect(requests).toBe(0);
  await page.route(endpoint, route => route.fulfill({ status: 400, json: { code: 'MONTH_LIMIT_EXCEEDED', message: 'Grenze', fieldErrors: { amountCents: 'Dieser Betrag überschreitet die zulässige Monatssumme.' } } }));
  await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
  await expect(page.locator('#expense-edit-amount-error')).toContainText('Monatssumme');
  await expect(page.getByLabel('Betrag bearbeiten in Euro')).toBeFocused();
  await expect(page.getByLabel('Name bearbeiten', { exact: true })).toHaveValue('Korrektur');
  await expect(page.locator('.expense-cards')).toContainText('1,15 €');
});

test('fehlgeschlagene und ungültige PUT-Antworten bewahren Entwurf und bestätigte Historie', async ({ page, request }) => {
  await login(page, await account(request)); await save(page, 'Brot', '1,15');
  const originalDate = (await page.locator('.expense-cards dd').last().textContent())!.split('.').reverse().join('-');
  await action(page, 'Brot', 'bearbeiten').click(); await edit(page, 'Korrektur', '2,34');
  for (const mode of ['network', 'server', 'missing', 'id', 'date', 'name', 'amount', 'invalid-date', 'fraction', 'wrong-status', 'extra-field']) {
    await page.route(endpoint, async route => {
      if (mode === 'network') return route.abort('failed');
      if (mode === 'server' || mode === 'missing') return route.fulfill({ status: mode === 'server' ? 500 : 404, json: {} });
      const id = route.request().url().split('/').pop();
      await route.fulfill({ status: mode === 'wrong-status' ? 201 : 200, json: {
        id: mode === 'id' ? crypto.randomUUID() : id,
        name: mode === 'name' ? 'Fremder Name' : 'Korrektur',
        amountCents: mode === 'amount' ? 235 : mode === 'fraction' ? 234.5 : 234,
        recordedOn: mode === 'invalid-date' ? '2026-02-30' : mode === 'date' ? '2000-01-01' : originalDate,
        ...(mode === 'extra-field' ? { unexpected: true } : {})
      } });
    });
    await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
    await expect(page.locator('#expense-status')).toContainText(mode === 'missing' ? 'nicht gefunden' : 'nicht bestätigt');
    await expect(page.locator('#expense-status')).not.toHaveClass(/success/);
    await expect(page.getByLabel('Name bearbeiten', { exact: true })).toHaveValue('Korrektur');
    await expect(page.getByLabel('Betrag bearbeiten in Euro')).toHaveValue('2,34');
    await expect(page.locator('.expense-cards')).toContainText('Brot'); await expect(page.locator('.expense-cards')).toContainText('1,15 €');
    await page.unroute(endpoint);
    if (mode !== 'missing') {
      await expect(action(page, 'Brot', 'löschen')).toBeDisabled();
      await page.evaluate(() => {
        const component = (window as any).ng.getComponent(document.querySelector('app-expenses'));
        component.startDelete(component.items()[0], { currentTarget: null });
      });
      await expect(page.getByRole('dialog')).not.toBeVisible();
      await reviewHistory(page);
      await expect(page.getByLabel('Name bearbeiten', { exact: true })).toBeFocused();
    }
  }
});

test('verlorene PUT- und DELETE-Antwort nach Commit meldet Ungewissheit; Aktualisieren findet bestätigten Bestand', async ({ page, request }) => {
  await login(page, await account(request)); await save(page, 'Brot', '1,15');
  await action(page, 'Brot', 'bearbeiten').click(); await edit(page, 'Korrektur', '2,34');
  await page.route(endpoint, async route => { const response = await route.fetch(); expect(response.status()).toBe(200); await route.abort('failed'); });
  await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
  await expect(page.locator('#expense-status')).toContainText('möglicherweise bereits gespeichert');
  await expect(page.locator('.expense-cards')).toContainText('Brot');
  await page.unroute(endpoint); await page.getByRole('button', { name: 'Ausgaben aktualisieren', exact: true }).click();
  await expect(page.locator('.expense-cards')).toContainText('Korrektur');
  await expect(page.getByLabel('Name bearbeiten', { exact: true })).toHaveValue('Korrektur');
  await page.getByRole('button', { name: 'Ich habe die Historie geprüft', exact: true }).click();
  await page.getByRole('button', { name: 'Bearbeitung abbrechen', exact: true }).click();
  await action(page, 'Korrektur', 'löschen').click();
  await page.route(endpoint, async route => { const response = await route.fetch(); expect(response.status()).toBe(204); await route.abort('failed'); });
  await page.getByRole('button', { name: 'Endgültig löschen', exact: true }).click();
  await expect(page.locator('#expense-delete-status')).toContainText('möglicherweise bereits gelöscht');
  await expect(page.getByRole('dialog')).toBeVisible(); await expect(page.locator('.expense-cards li')).toHaveCount(1);
  await page.getByRole('dialog').getByRole('button', { name: 'Abbrechen', exact: true }).click();
  await page.unroute(endpoint); await page.getByRole('button', { name: 'Ausgaben aktualisieren', exact: true }).click();
  await expect(page.getByText('Noch keine Ausgaben erfasst.')).toBeVisible();
});

test('DELETE bestätigt ausschließlich 204, Fehler halten den Dialog und die Historie', async ({ page, request }) => {
  await login(page, await account(request)); await save(page, 'Brot', '1,15'); await action(page, 'Brot', 'löschen').click();
  for (const mode of ['network', 'server', 'missing', 'wrong-status']) {
    await page.route(endpoint, route => mode === 'network' ? route.abort('failed') : route.fulfill({ status: mode === 'server' ? 500 : mode === 'missing' ? 404 : 200, json: {} }));
    await page.getByRole('button', { name: 'Endgültig löschen', exact: true }).click();
    await expect(page.locator('#expense-delete-status')).toContainText(mode === 'missing' ? 'nicht gefunden' : 'nicht bestätigt');
    await expect(page.getByRole('dialog')).toBeVisible(); await expect(page.locator('.expense-cards li')).toHaveCount(1);
    await page.unroute(endpoint);
    if (mode !== 'missing') {
      await page.getByRole('dialog').getByRole('button', { name: 'Abbrechen', exact: true }).click();
      await reviewHistory(page); await action(page, 'Brot', 'löschen').click();
    }
  }
});

test('frühere Monate bleiben in der Historie und ändern den aktuellen Rest bei Mutation nicht', async ({ page, request }) => {
  const id = crypto.randomUUID(); let items = [{ id, name: 'Früher', amountCents: 100, recordedOn: '2020-01-31' }];
  let summaryReads = 0;
  await page.route('**/api/v2/expenses', route => route.fulfill({ json: items }));
  await page.route('**/api/v2/month-summary', async route => {
    summaryReads++; await route.fulfill({ headers: { Date: new Date().toUTCString() }, json: { month: '2026-10-01', budgetCents: 10000, expensesCents: 0, remainingCents: 10000 } });
  });
  await page.route(endpoint, async route => {
    if (route.request().method() === 'PUT') { items = [{ ...items[0], ...route.request().postDataJSON() }]; await route.fulfill({ json: items[0] }); }
    else { items = []; await route.fulfill({ status: 204 }); }
  });
  await login(page, await account(request));
  const initialReads = summaryReads;
  await action(page, 'Früher', 'bearbeiten').click(); await edit(page, 'Früher korrigiert', '99');
  await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
  await expect(page.locator('.expense-cards')).toContainText('31.01.2020'); await expect(page.locator('.expense-cards')).toContainText('99,00 €');
  await page.getByRole('link', { name: 'Monat', exact: true }).click();
  await expect(summaryMoney(page)).toHaveText('100,00 €');
  expect(summaryReads).toBe(initialReads + 1);
  await page.getByRole('link', { name: 'Ausgaben', exact: true }).click();
  await action(page, 'Früher korrigiert', 'löschen').click(); await page.getByRole('button', { name: 'Endgültig löschen', exact: true }).click();
  await expect(page.getByText('Noch keine Ausgaben erfasst.')).toBeVisible();
  await page.goBack();
  await expect(summaryMoney(page)).toHaveText('100,00 €');
  expect(summaryReads).toBe(initialReads + 2);
});

for (const method of ['PUT', 'DELETE']) {
  test(`verspätetes ${method} nach Kontowechsel löscht alten Entwurf/Dialog und bleibt wirkungslos`, async ({ page, context, request }) => {
    const first = await account(request), second = await account(request);
    await login(page, first); await save(page, 'Altes Konto', '1');
    await page.getByLabel('Name der Ausgabe').fill('Erfassungsentwurf');
    await action(page, 'Altes Konto', 'bearbeiten').click(); await edit(page, 'Alter Entwurf', '2');
    if (method === 'DELETE') await action(page, 'Altes Konto', 'löschen').click();
    await page.evaluate(() => { (window as any).oldExpenses = (window as any).ng.getComponent(document.querySelector('app-expenses')); });
    const held = gate(), ready = gate();
    await page.route(endpoint, async route => { const response = await route.fetch(); ready.release(); await held.promise; await route.fulfill({ response }); });
    await page.getByRole('button', { name: method === 'PUT' ? 'Änderungen speichern' : 'Endgültig löschen', exact: true }).click(); await ready.promise;
    const other = await context.newPage(); await login(other, second); await expect(page).toHaveURL('/anmelden');
    const answered = page.waitForResponse(response => response.request().method() === method && /expenses\//.test(response.url()));
    held.release(); await answered;
    expect(await page.evaluate(() => { const old = (window as any).oldExpenses; return { items: old.items(), name: old.name, amount: old.amount, editing: old.editing(), editName: old.editName, editAmount: old.editAmount, deleting: old.deleting(), status: old.status(), deleteStatus: old.deleteStatus() }; }))
      .toEqual({ items: [], name: '', amount: '', editing: null, editName: '', editAmount: '', deleting: null, status: '', deleteStatus: '' });
    await expect(other.getByText('Noch keine Ausgaben erfasst.')).toBeVisible(); await expect(page.getByRole('dialog')).toHaveCount(0);
  });
}

for (const method of ['PUT', 'DELETE']) {
  test(`Tokenablauf verwirft ${method}-Antwort, Entwürfe und Dialog`, async ({ page, request }) => {
    await page.clock.install(); await login(page, await account(request)); await save(page, 'Brot', '1');
    const refreshHeld = gate(), refreshReady = gate();
    await page.route('**/api/v2/access/refresh', async route => { const response = await route.fetch(); refreshReady.release(); await refreshHeld.promise; await route.fulfill({ response }); });
    await page.clock.fastForward(570_001); await refreshReady.promise; await page.clock.fastForward(28_000);
    await action(page, 'Brot', 'bearbeiten').click(); await edit(page, 'Verwerfen', '2');
    if (method === 'DELETE') await action(page, 'Brot', 'löschen').click();
    await page.evaluate(() => { (window as any).oldExpenses = (window as any).ng.getComponent(document.querySelector('app-expenses')); });
    const held = gate(), ready = gate();
    await page.route(endpoint, async route => { const response = await route.fetch(); ready.release(); await held.promise; await route.fulfill({ response }); });
    await page.getByRole('button', { name: method === 'PUT' ? 'Änderungen speichern' : 'Endgültig löschen', exact: true }).click(); await ready.promise;
    await page.clock.fastForward(3_000); await expect(page).toHaveURL('/anmelden');
    const answered = page.waitForResponse(response => response.request().method() === method && /expenses\//.test(response.url()));
    held.release(); await answered;
    const revoked = page.waitForResponse('**/api/v2/access/logout'); refreshHeld.release(); expect((await revoked).status()).toBe(204);
    expect(await page.evaluate(() => { const old = (window as any).oldExpenses; return { items: old.items(), editing: old.editing(), editName: old.editName, editAmount: old.editAmount, deleting: old.deleting() }; }))
      .toEqual({ items: [], editing: null, editName: '', editAmount: '', deleting: null });
  });
}

test('Aktionen, Editor und Dialog sind an vier Viewports und mit 100/200 Prozent Text bedienbar, ohne horizontales Scrollen und axe-Fehler', async ({ page, request }) => {
  await login(page, await account(request));
  const name = 'SehrLangerAusgabenname'.repeat(10); await save(page, name, '90071992547409,91');
  for (const width of [320, 390, 768, 1280]) for (const size of ['100%', '200%']) {
    await page.setViewportSize({ width, height: ({ 320: 568, 390: 844, 768: 1024, 1280: 800 } as Record<number, number>)[width] });
    await page.evaluate(value => { document.documentElement.style.fontSize = value; }, size);
    await action(page, name, 'bearbeiten').click();
    await expect(page.getByLabel('Name bearbeiten', { exact: true })).toBeFocused();
    await page.keyboard.press('Tab'); await expect(page.getByLabel('Betrag bearbeiten in Euro')).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const history = width < 1024 ? page.locator('.expense-cards') : page.locator('.expense-table');
    await expect(history).toBeVisible(); await expect(history).toContainText('90.071.992.547.409,91 €');
    expect(await history.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    for (const target of [...await history.getByRole('button').all(), ...await page.locator('.expense-editor button, .expense-editor input').all()]) {
      const bounds = (await target.boundingBox())!; expect(bounds.width).toBeGreaterThanOrEqual(44); expect(bounds.height).toBeGreaterThanOrEqual(44);
    }
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.getByRole('button', { name: 'Bearbeitung abbrechen', exact: true }).click();
    await action(page, name, 'löschen').click(); const dialog = page.getByRole('dialog');
    await expect(page.getByRole('button', { name: 'Abbrechen', exact: true })).toBeFocused();
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    for (const button of await dialog.getByRole('button').all()) {
      const bounds = (await button.boundingBox())!; expect(bounds.width).toBeGreaterThanOrEqual(44); expect(bounds.height).toBeGreaterThanOrEqual(44);
    }
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.keyboard.press('Escape'); await expect(action(page, name, 'löschen')).toBeFocused();
  }
});

test('fehlgeschlagenes Neuladen sperrt Bearbeitung bei erhaltenem Entwurf bis zum erfolgreichen Neuladen und Retry', async ({ page, request }) => {
  await login(page, await account(request)); await save(page, 'Brot', '1');
  await action(page, 'Brot', 'bearbeiten').click(); await edit(page, 'Korrigiert', '2,34');
  let puts = 0; page.on('request', req => { if (req.method() === 'PUT' && /expenses\//.test(req.url())) puts++; });
  await page.route('**/api/v2/expenses', route => route.fulfill({ status: 500, json: {} }));
  await page.getByRole('button', { name: 'Ausgaben aktualisieren', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ausgaben erneut laden', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Änderungen speichern', exact: true })).toBeDisabled();
  await expect(page.getByLabel('Name bearbeiten', { exact: true })).toHaveValue('Korrigiert');
  await expect(page.getByLabel('Betrag bearbeiten in Euro')).toHaveValue('2,34');
  await page.getByLabel('Betrag bearbeiten in Euro').press('Enter'); expect(puts).toBe(0);
  await page.unroute('**/api/v2/expenses');
  await page.getByRole('button', { name: 'Ausgaben erneut laden', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Änderungen speichern', exact: true })).toBeEnabled();
  await expect(page.getByLabel('Name bearbeiten', { exact: true })).toHaveValue('Korrigiert');
  await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
  await expect(page.locator('.expense-cards')).toContainText('Korrigiert');
  await expect(page.locator('.expense-cards')).toContainText('2,34 €'); expect(puts).toBe(1);
});

test('aktiver Bearbeitungsentwurf bleibt bis zu explizitem Abbruch oder erfolgreichem Speichern erhalten', async ({ page, request }) => {
  await login(page, await account(request)); await save(page, 'Brot', '1'); await save(page, 'Bus', '2');
  await action(page, 'Brot', 'bearbeiten').click(); await edit(page, 'Noch ungespeichert', '3,45');
  await expect(action(page, 'Brot', 'bearbeiten')).toBeDisabled(); await expect(action(page, 'Bus', 'bearbeiten')).toBeDisabled();
  // Auch ein programmatischer veralteter Start darf den Entwurf nicht überschreiben.
  await page.evaluate(() => {
    const component = (window as any).ng.getComponent(document.querySelector('app-expenses'));
    for (const expense of component.items()) component.startEdit(expense, { currentTarget: null });
  });
  await expect(page.getByLabel('Name bearbeiten', { exact: true })).toHaveValue('Noch ungespeichert');
  await expect(page.getByLabel('Betrag bearbeiten in Euro')).toHaveValue('3,45');
  await page.getByRole('button', { name: 'Bearbeitung abbrechen', exact: true }).click();
  await expect(action(page, 'Brot', 'bearbeiten')).toBeEnabled(); await expect(action(page, 'Bus', 'bearbeiten')).toBeEnabled();
  await action(page, 'Bus', 'bearbeiten').click(); await expect(page.getByLabel('Name bearbeiten', { exact: true })).toHaveValue('Bus');
  await edit(page, 'Bus korrigiert', '2,50'); await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
  await expect(action(page, 'Bus korrigiert', 'bearbeiten')).toBeEnabled();
  await action(page, 'Brot', 'bearbeiten').click(); await expect(page.getByLabel('Name bearbeiten', { exact: true })).toHaveValue('Brot');
});

test('Löschen einer anderen Zeile erhält den Editor und fokussiert eine verfügbare Zeilenaktion', async ({ page, request }) => {
  await login(page, await account(request)); await save(page, 'Brot', '1'); await save(page, 'Bus', '2');
  await action(page, 'Brot', 'bearbeiten').click(); await edit(page, 'Offener Entwurf', '3,45');
  await action(page, 'Bus', 'löschen').click();
  await page.getByRole('button', { name: 'Endgültig löschen', exact: true }).click();
  await expect(page.locator('.expense-cards li')).toHaveCount(1);
  await expect(action(page, 'Brot', 'löschen')).toBeFocused();
  await expect(page.getByLabel('Name bearbeiten', { exact: true })).toHaveValue('Offener Entwurf');
  await expect(page.getByLabel('Betrag bearbeiten in Euro')).toHaveValue('3,45');
  await page.getByRole('button', { name: 'Bearbeitung abbrechen', exact: true }).click();
  await expect(action(page, 'Brot', 'bearbeiten')).toBeFocused();
});

test('Abbrechen nach Bearbeitungs- oder Löschfehlern setzt Status und Fehlergestaltung passend zurück', async ({ page, request }) => {
  await login(page, await account(request)); await save(page, 'Brot', '1');
  await action(page, 'Brot', 'bearbeiten').click(); await edit(page, '', '0');
  await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
  await expect(page.locator('#expense-status')).toHaveClass(/error/);
  await page.getByRole('button', { name: 'Bearbeitung abbrechen', exact: true }).click();
  await expect(page.locator('#expense-status')).toHaveText('Bearbeitung abgebrochen.');
  await expect(page.locator('#expense-status')).not.toHaveClass(/error|success/);
  await expect(action(page, 'Brot', 'bearbeiten')).toBeFocused();
  await action(page, 'Brot', 'bearbeiten').click(); await edit(page, '', '0');
  await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
  await action(page, 'Brot', 'löschen').click();
  await expect(page.locator('#expense-status')).toHaveText('');
  await expect(page.locator('#expense-status')).not.toHaveClass(/error|success/);
  await page.route(endpoint, route => route.fulfill({ status: 500, json: {} }));
  await page.getByRole('button', { name: 'Endgültig löschen', exact: true }).click();
  await expect(page.locator('#expense-delete-status')).toContainText('nicht bestätigt');
  await page.getByRole('dialog').getByRole('button', { name: 'Abbrechen', exact: true }).click();
  await expect(page.locator('#expense-status')).toHaveText('Löschen abgebrochen.');
  await expect(page.locator('#expense-status')).not.toHaveClass(/error|success/);
  await expect(action(page, 'Brot', 'löschen')).toBeDisabled();
  await expect(page.getByRole('heading', { name: 'Alle Ausgaben', exact: true })).toBeFocused();
  await expect(page.getByLabel('Betrag bearbeiten in Euro')).toHaveValue('0');
  await page.getByRole('button', { name: 'Bearbeitung abbrechen', exact: true }).click();
  await expect(action(page, 'Brot', 'bearbeiten')).toBeFocused();
  await reviewHistory(page);
  await action(page, 'Brot', 'löschen').click();
  await expect(page.locator('#expense-delete-status')).toHaveText('');
  await page.keyboard.press('Escape'); await expect(page.locator('#expense-status')).toHaveText('Löschen abgebrochen.');
});

for (const method of ['PUT', 'DELETE']) {
  test(`${method} läuft nach 30 Sekunden ab, entsperrt Bedienelemente und nimmt späte Antworten nicht als Erfolg an`, async ({ page, request }) => {
    await page.clock.install(); await login(page, await account(request)); await save(page, 'Brot', '1');
    await action(page, 'Brot', 'bearbeiten').click(); await edit(page, 'Erhaltener Entwurf', '2,34');
    if (method === 'DELETE') await action(page, 'Brot', 'löschen').click();
    const held = gate(), ready = gate(), finished = gate();
    await page.route(endpoint, async route => {
      const response = await route.fetch(); expect(response.status()).toBe(method === 'PUT' ? 200 : 204); ready.release(); await held.promise;
      try { await route.fulfill({ response }).catch(() => {}); } finally { finished.release(); }
    });
    const submit = method === 'PUT' ? page.getByRole('button', { name: 'Änderungen speichern', exact: true }) : page.getByRole('dialog').locator('button').last();
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100));
    await submit.click(); await ready.promise; await page.clock.runFor(20); await expect(submit).toBeDisabled();
    await page.clock.fastForward(29_979); await expect(submit).toBeDisabled();
    await page.clock.runFor(22);
    const status = page.locator(method === 'PUT' ? '#expense-status' : '#expense-delete-status');
    await expect(status).toContainText('nicht bestätigt'); await expect(status).toContainText('möglicherweise');
    await expect(submit).toBeDisabled();
    if (method === 'PUT') await expect(page.getByRole('button', { name: 'Bearbeitung abbrechen', exact: true })).toBeEnabled();
    else await expect(page.getByRole('dialog').getByRole('button', { name: 'Abbrechen', exact: true })).toBeEnabled();
    await expect(page.getByLabel('Name bearbeiten', { exact: true })).toHaveValue('Erhaltener Entwurf');
    await expect(page.getByLabel('Betrag bearbeiten in Euro')).toHaveValue('2,34');
    await expect(page.locator('.expense-cards')).toContainText('Brot'); await expect(page.locator('.expense-cards')).toContainText('1,00 €');
    held.release(); await finished.promise; await page.clock.runFor(50);
    await expect(status).toContainText('nicht bestätigt');
    await expect(page.locator('#expense-status')).not.toHaveClass(/success/);
    await expect(page.locator('.expense-cards')).toContainText('Brot');
    await expect(page.locator('.expense-cards')).toContainText('1,00 €');
    if (method === 'DELETE') await expect(page.getByRole('dialog')).toBeVisible();
  });
}

test('Touch am kleinen Smartphone ermöglicht Bearbeiten und bestätigtes Löschen', async ({ browser, request }) => {
  const context = await browser.newContext({ baseURL: 'https://localhost:4200', ignoreHTTPSErrors: true, hasTouch: true, isMobile: true, viewport: { width: 320, height: 568 } });
  try {
    const page = await context.newPage(); await login(page, await account(request)); await save(page, 'Touch-Ausgabe', '1');
    await action(page, 'Touch-Ausgabe', 'bearbeiten').tap(); await edit(page, 'Touch korrigiert', '2,34');
    for (const target of await page.locator('.expense-cards button, .expense-editor button, .expense-editor input').all()) {
      const bounds = (await target.boundingBox())!; expect(bounds.width).toBeGreaterThanOrEqual(44); expect(bounds.height).toBeGreaterThanOrEqual(44);
    }
    await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).tap();
    await expect(page.locator('.expense-cards')).toContainText('Touch korrigiert');
    await action(page, 'Touch korrigiert', 'löschen').tap();
    await page.getByRole('button', { name: 'Abbrechen', exact: true }).tap();
    await expect(page.locator('.expense-cards li')).toHaveCount(1);
    await action(page, 'Touch korrigiert', 'löschen').tap();
    await page.getByRole('button', { name: 'Endgültig löschen', exact: true }).tap();
    await expect(page.getByText('Noch keine Ausgaben erfasst.')).toBeVisible();
  } finally { await context.close(); }
});
