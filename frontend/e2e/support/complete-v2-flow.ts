import AxeBuilder from '@axe-core/playwright';
import { expect, Page, Request, Response } from '@playwright/test';

const password = '  Grüner 🦊 im Baum  ';

export async function completeV2Flow(page: Page, signed = false): Promise<void> {
  const access: { path: string; method: string; bearer?: string; csrf?: string; origin?: string }[] = [];
  const headerChecks: Promise<void>[] = [];
  const accessAttempts = new Set<string>();
  const responseHeaders: { path: string; cacheControl?: string }[] = [];
  const finances = new Set<string>();
  const recordResponse = (response: Response) => {
    if (/^\/api\/v[12]\//.test(new URL(response.url()).pathname)) {
      responseHeaders.push({ path: new URL(response.url()).pathname, cacheControl: response.headers()['cache-control'] });
    }
  };
  const recordRequest = (request: Request) => {
    const path = new URL(request.url()).pathname;
    if (/\/api\/v\d+\/access\//.test(path)) accessAttempts.add(`${request.method()} ${path}`);
    if (/\/api\/v\d+\/access\//.test(path) && request.method() === 'GET') {
      const headers = request.headers();
      access.push({ path, method: request.method(), bearer: headers['authorization'], csrf: headers['x-csrf-token'], origin: headers['origin'] });
    }
    if (/^\/api\/v[12]\//.test(path) && !path.includes('/access/')) finances.add(`${request.method()} ${path}`);
  };
  const recordFinished = (request: Request) => {
    const path = new URL(request.url()).pathname;
    // Origin ergänzt Chromium selbst; vollständige Header erst nach erfolgreichem
    // Requestende lesen. Reload-abgebrochene GETs dürfen keine Wartepromises halten.
    if (/\/api\/v\d+\/access\//.test(path) && request.method() === 'POST') {
      headerChecks.push(request.allHeaders().then(headers => {
        access.push({ path, method: request.method(), bearer: headers['authorization'], csrf: headers['x-csrf-token'], origin: headers['origin'] });
      }));
    }
  };
  page.on('response', recordResponse); page.on('request', recordRequest); page.on('requestfinished', recordFinished);
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
  await page.getByRole('link', { name: 'Ausgaben', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ausgabe speichern', exact: true })).toBeEnabled();
  await page.getByLabel('Name der Ausgabe').fill('Netzwerkprüfung');
  await page.getByLabel('Ausgabenbetrag in Euro').fill('1');
  await page.getByRole('button', { name: 'Ausgabe speichern', exact: true }).click();
  await expect(page.locator('#expense-status')).toHaveText('Deine Ausgabe wurde gespeichert.');
  const expenseId = await page.locator('.expense-cards [data-expense-action]').first().getAttribute('data-expense-action');
  await page.getByRole('button', { name: 'Netzwerkprüfung bearbeiten', exact: true }).click();
  await page.getByLabel('Betrag bearbeiten in Euro').fill('2');
  await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
  await expect(page.locator('#expense-status')).toContainText('Deine Ausgabe wurde geändert.');
  await page.getByRole('button', { name: 'Netzwerkprüfung löschen', exact: true }).click();
  await page.getByRole('button', { name: 'Endgültig löschen', exact: true }).click();
  await expect(page.locator('#expense-status')).toContainText('Deine Ausgabe wurde gelöscht.');
  await page.getByRole('link', { name: 'Sparziele', exact: true }).click();
  await expect(page.getByText('Du bist angemeldet. Deine persönlichen Sparziele sind geöffnet.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sparziel speichern', exact: true })).toBeEnabled();
  await page.getByLabel('Name des Sparziels', { exact: true }).fill('Netzwerkziel');
  await page.getByLabel('Zielbetrag in Euro', { exact: true }).fill('100');
  await page.getByLabel('Zieldatum (optional)').fill('2028-02-29');
  await page.getByRole('button', { name: 'Sparziel speichern', exact: true }).click();
  await expect(page.locator('#goal-status')).toHaveClass(/success/);
  const goalTitle = page.locator('.savings-cards h3').filter({ hasText: /^Netzwerkziel$/ });
  await expect(goalTitle).toHaveAttribute('id', /^goal-title-[0-9a-f-]{36}$/);
  const goalId = (await goalTitle.getAttribute('id'))!.slice('goal-title-'.length);
  await expect(page.getByLabel('Name des Sparziels', { exact: true })).toBeFocused();
  if (signed) {
    await expect(page.locator('#goal-capabilities-status')).toHaveText('Negative Gesamtfortschritte sind verfügbar.');
    await page.evaluate(() => document.documentElement.style.fontSize = '200%');
    const progress = page.getByLabel('Gesamtfortschritt in Euro');
    const card = page.locator('.savings-cards li');
    const expectReflow = async () => {
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      for (const area of await page.locator('.savings-editor, dialog[open]').all())
        expect(await area.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    };
    for (const [input, display, percent, fill] of [
      ['-30', '−30,00', '−30 %', 0], ['0', '0,00', '0 %', 0], ['70', '70,00', '70 %', 70], ['150', '150,00', '150 %', 100]
    ] as const) {
      const edit = page.getByRole('button', { name: 'Fortschritt aktualisieren: Netzwerkziel', exact: true });
      await edit.focus(); await page.keyboard.press('Enter'); await expect(progress).toBeFocused();
      await expect(progress).toHaveAttribute('inputmode', 'text');
      await progress.fill(''); await progress.pressSequentially(input);
      await expect(progress).toHaveValue(input);
      expect((await progress.boundingBox())!.height).toBeGreaterThanOrEqual(48);
      const saveButton = page.getByRole('button', { name: 'Fortschritt speichern', exact: true });
      const size = (await saveButton.boundingBox())!; expect(size.height).toBeGreaterThanOrEqual(44); expect(size.width).toBeGreaterThanOrEqual(44);
      await expectReflow();
      await page.keyboard.press('Tab'); await expect(saveButton).toBeFocused();
      await expect(saveButton).toHaveCSS('outline-style', 'solid'); await page.keyboard.press('Enter');
      await expect(page.locator('#goal-progress-status')).toHaveClass(/success/);
      await expect(page.locator('#goal-progress-status')).toContainText(display);
      await expect(edit).toBeFocused();
      await page.reload();
      await expect(card).toContainText(display + ' €');
      await expect(card).toContainText(percent);
      expect(await page.locator('.savings-progress').evaluate(element => element.querySelector('span')!.getBoundingClientRect().width / element.clientWidth * 100)).toBeCloseTo(fill, 0);
      const accessible = (await card.ariaSnapshot()).replace(/\u00a0/g, ' ');
      expect(accessible).toContain(percent);
      if (input === '-30') { expect(accessible).not.toContain('progressbar'); expect(accessible).toContain('−30,00 €'); }
      await page.evaluate(() => document.documentElement.style.fontSize = '200%');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
    }
    await page.getByRole('button', { name: 'Sparziel bearbeiten: Netzwerkziel', exact: true }).click();
    await page.getByLabel('Zielbetrag in Euro bearbeiten').fill('0,01');
    await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
    await expect(page.locator('#goal-mutation-status')).toHaveClass(/success/);
    for (const [input, display, percent] of [
      ['-90071992547409,91', '−90.071.992.547.409,91', '−900.719.925.474.099.100 %'],
      ['90071992547409,91', '90.071.992.547.409,91', '900.719.925.474.099.100 %']
    ]) {
      await page.getByRole('button', { name: 'Fortschritt aktualisieren: Netzwerkziel', exact: true }).click();
      await progress.fill(input); await expectReflow();
      await progress.press('Home'); await expect.poll(() => progress.evaluate(element => element.scrollLeft)).toBe(0);
      await expect(progress).toHaveValue(input); await progress.press('End'); await progress.press('Enter');
      await expect(page.locator('#goal-progress-status')).toHaveClass(/success/);
      await page.reload(); await expect(card).toContainText(display + ' €'); await expect(card).toContainText(percent);
      await page.evaluate(() => document.documentElement.style.fontSize = '200%');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
      await page.getByRole('button', { name: 'Fortschritt aktualisieren: Netzwerkziel', exact: true }).click();
      await expect(progress).toHaveValue(input);
      for (const invalid of ['-30,001', '-90071992547409,92', '90071992547409,92', '- 30', '--30', '+30']) {
        await progress.fill(invalid); await progress.press('Enter');
        await expect(progress).toHaveAttribute('aria-invalid', 'true'); await expect(progress).toHaveValue(invalid);
        await expectReflow();
      }
      await page.getByRole('button', { name: 'Abbrechen', exact: true }).click();
    }
    await page.getByRole('button', { name: 'Fortschritt aktualisieren: Netzwerkziel', exact: true }).click();
    await progress.fill('-30'); await progress.press('Enter');
    await expect(page.locator('#goal-progress-status')).toHaveClass(/success/);
  } else {
    await page.getByRole('button', { name: 'Fortschritt aktualisieren: Netzwerkziel', exact: true }).click();
    await page.getByLabel('Gesamtfortschritt in Euro').fill('70');
    await page.getByRole('button', { name: 'Fortschritt speichern', exact: true }).click();
    await expect(page.locator('#goal-progress-status')).toHaveClass(/success/);
  }
  await expect(page.getByRole('button', { name: 'Fortschritt aktualisieren: Netzwerkziel', exact: true })).toBeFocused();
  const editTarget = page.getByRole('button', { name: 'Sparziel bearbeiten: Netzwerkziel', exact: true });
  await expect(editTarget).toBeEnabled(); await editTarget.focus(); await expect(editTarget).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page.getByLabel('Name des Sparziels bearbeiten')).toBeFocused();
  await page.getByLabel('Zielbetrag in Euro bearbeiten').fill('-150');
  await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
  await expect(page.getByLabel('Zielbetrag in Euro bearbeiten')).toHaveAttribute('aria-invalid', 'true');
  await page.getByLabel('Zielbetrag in Euro bearbeiten').fill('150');
  await page.getByLabel('Zieldatum bearbeiten (optional)').fill('');
  await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
  await expect(page.locator('#goal-mutation-status')).toHaveClass(/success/);
  await expect(editTarget).toBeFocused();
  if (signed) {
    await expect(page.locator('.savings-cards li')).toContainText('−30,00 €');
    await expect(page.locator('.savings-cards li')).not.toContainText('Zieldatum');
  }
  const deleteTarget = page.getByRole('button', { name: 'Sparziel löschen: Netzwerkziel', exact: true });
  await expect(deleteTarget).toBeEnabled(); await deleteTarget.focus(); await expect(deleteTarget).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#goal-delete-cancel')).toBeFocused();
  const dialog = page.getByRole('dialog');
  expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.keyboard.press('Shift+Tab'); await expect(dialog.getByRole('button', { name: 'Endgültig löschen', exact: true })).toBeFocused();
  await page.keyboard.press('Tab'); await expect(page.locator('#goal-delete-cancel')).toBeFocused();
  await page.keyboard.press('Tab'); await expect(dialog.getByRole('button', { name: 'Endgültig löschen', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#goal-mutation-status')).toHaveText('Dein Sparziel wurde gelöscht.');
  await expect(page.getByRole('button', { name: 'Sparziel anlegen', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Name des Sparziels', { exact: true })).toBeFocused();
  if (signed) {
    await page.getByRole('link', { name: 'Monat', exact: true }).click();
    await expect(page.locator('.month-summary')).toContainText('75,00');
    await page.getByRole('link', { name: 'Sparziele', exact: true }).click();
  }
  await page.reload();
  await expect(page.getByText('Du bist angemeldet. Deine persönlichen Sparziele sind geöffnet.')).toBeVisible();
  await expect(page.locator('#goals-list-status')).toHaveText('Noch keine Sparziele angelegt.');
  // Der normale Zielstand kommt aus der gemeinsamen Übersicht. Den weiterhin
  // kompatiblen einzelnen Ziel-Leseweg zusätzlich über seinen echten Ersatzweg prüfen.
  await page.route('**/api/v2/monthly-surplus', route => route.fulfill({ status: 500, headers: { 'Cache-Control': 'no-store' },
    json: { code: 'MONTHLY_SURPLUS_UNAVAILABLE', message: 'Nicht geladen' } }));
  const individualGoals = page.waitForResponse(response => response.url().endsWith('/api/v2/savings-goals') && response.request().method() === 'GET');
  await page.locator('#goals-refresh').click();
  expect((await individualGoals).status()).toBe(200);
  await expect(page.locator('#goals-list-status')).toHaveText('Noch keine Sparziele angelegt.');
  await page.unroute('**/api/v2/monthly-surplus');
  await page.getByRole('button', { name: 'Abmelden', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Du wurdest abgemeldet.');
  page.off('response', recordResponse); page.off('request', recordRequest); page.off('requestfinished', recordFinished);
  await Promise.all(headerChecks);
  for (const response of responseHeaders) expect(response.cacheControl, response.path).toBe('no-store');
  expect([...accessAttempts].sort()).toEqual([
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
  expect([...finances]).toEqual(expect.arrayContaining(['GET /api/v2/budget', 'PUT /api/v2/budget', 'GET /api/v2/month-summary', 'GET /api/v2/monthly-surplus', 'GET /api/v2/savings-goals', 'GET /api/v2/capabilities']));
  expect([...finances].filter(operation => operation.includes('/api/v2/expenses')).sort()).toEqual([
    `DELETE /api/v2/expenses/${expenseId}`, 'GET /api/v2/expenses', 'POST /api/v2/expenses', `PUT /api/v2/expenses/${expenseId}`
  ]);
  expect([...finances].filter(operation => operation.includes('/api/v2/savings-goals')).sort()).toEqual([
    `DELETE /api/v2/savings-goals/${goalId}`, 'GET /api/v2/savings-goals', 'POST /api/v2/savings-goals',
    `PUT /api/v2/savings-goals/${goalId}`, `PUT /api/v2/savings-goals/${goalId}/progress`
  ]);
  expect([...finances].filter(operation => operation.includes('/api/v1/'))).toEqual([]);
}
