import AxeBuilder from '@axe-core/playwright';
import { expect, test, Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { completeV2Flow } from './support/complete-v2-flow';

const password = '  Grüner 🦊 im Baum  ';
function nextAuthorization(page: Page) {
  return page.waitForRequest(request => /^\/api\/v[12]\//.test(new URL(request.url()).pathname)
    && request.headers()['authorization']?.startsWith('Bearer ') === true)
    .then(request => request.headers()['authorization']);
}
async function login(page: Page, email: string) {
  await page.goto('/anmelden');
  await page.getByLabel('E-Mail-Adresse', { exact: true }).fill(email);
  await page.getByLabel('Passwort', { exact: true }).fill(password);
  const signedIn = nextAuthorization(page);
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Monat', exact: true })).toBeVisible();
  await expect(page.getByLabel('Monatsbudget in Euro', { exact: true })).toBeVisible();
  return signedIn;
}

test('unveränderter Altbundle, echter API-Neustart, gespeicherter Bestand und vollständiger v2-Aktualisierungspfad', async ({ page, context, browser, request }) => {
  test.setTimeout(240_000);
  const email = `transition-${crypto.randomUUID()}@example.org`;
  const other = `transition-${crypto.randomUUID()}@example.org`;
  for (const address of [email, other]) {
    expect((await request.post('http://127.0.0.1:8080/api/v1/access/registrations', {
      data: { registrationToken: 'a'.repeat(43), email: address, password }
    })).status()).toBe(201);
  }
  expect((await request.get('/reference.txt')).status()).toBe(200);
  expect(await (await request.get('/reference.txt')).text()).toBe('5cd387db54cc94aa35e7af02ffd17b1a4480a9f1\n');
  const oldHeaders = { Authorization: await login(page, email) };
  const oldGoal = await request.post('http://127.0.0.1:8080/api/v1/savings-goals', {
    headers: oldHeaders, data: { name: 'Erhaltenes Prüfziel', targetAmountCents: 10000, targetDate: '2028-02-29' }
  });
  expect(oldGoal.status()).toBe(201);
  const goalId = (await oldGoal.json()).id;
  expect((await request.put(`http://127.0.0.1:8080/api/v1/savings-goals/${goalId}/progress`, {
    headers: oldHeaders, data: { progressCents: 12500 }
  })).status()).toBe(200);
  const oldAsset = await page.locator('script[src]').first().getAttribute('src');
  await expect(page.getByRole('link', { name: 'Ausgaben', exact: true })).toHaveCount(0);
  await page.getByLabel('Monatsbudget in Euro', { exact: true }).fill('1200');
  await page.getByRole('button', { name: 'Budget speichern', exact: true }).click();
  await expect(page.locator('#budget-status')).toContainText('gespeichert');
  await page.getByLabel('Name der Ausgabe', { exact: true }).fill('Vor dem Wechsel');
  await page.getByLabel('Ausgabenbetrag in Euro', { exact: true }).fill('12,34');
  await page.getByRole('button', { name: 'Ausgabe speichern', exact: true }).click();
  await expect(page.locator('#expense-status')).toContainText('gespeichert');
  const oldTab = await context.newPage();
  await oldTab.goto('/monat');
  await expect(oldTab.getByRole('heading', { name: 'Monat', exact: true })).toBeVisible();
  const otherContext = await browser.newContext({ baseURL: 'https://localhost:4200', ignoreHTTPSErrors: true });
  const otherPage = await otherContext.newPage();
  await otherPage.clock.install();
  await login(otherPage, other);

  let release!: () => void;
  let committed!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  const saved = new Promise<void>(resolve => { committed = resolve; });
  let mutationSends = 0;
  await page.route('**/api/v1/expense-budget/expenses', async route => {
    if (route.request().method() !== 'POST') { await route.continue(); return; }
    mutationSends++;
    const response = await route.fetch();
    expect(response.status()).toBe(201);
    committed();
    await held;
    await route.fulfill({ response });
  });
  await page.getByLabel('Name der Ausgabe', { exact: true }).fill('Bestätigt ohne Antwort');
  await page.getByLabel('Ausgabenbetrag in Euro', { exact: true }).fill('2,66');
  await page.getByRole('button', { name: 'Ausgabe speichern', exact: true }).click();
  await saved;
  await expect(page.getByRole('button', { name: 'Ausgabe wird gespeichert …' })).toBeDisabled();

  execFileSync('python3', [path.resolve('../scripts/e2e-transition.py')], { timeout: 120_000, stdio: 'pipe' });
  // Tatsächlich geladenes altes JavaScript wird beim nächsten geschützten Versuch geschlossen.
  await oldTab.getByRole('link', { name: 'Sparziele', exact: true }).click();
  await expect(oldTab).toHaveURL('/anmelden');
  await expect(page).toHaveURL('/anmelden');
  release();
  await expect(page.locator('app-expenses')).toHaveCount(0);
  await expect(page.getByLabel('E-Mail-Adresse', { exact: true })).toHaveValue('');
  expect(mutationSends).toBe(1);
  // Eigener Browserkontext: kein Broadcast aus den bereits geschlossenen Alt-Tabs.
  await expect(otherPage.getByRole('heading', { name: 'Monat', exact: true })).toBeVisible();
  // Die automatische Erneuerung beginnt im unveränderten Altcode mit einem frischen CSRF-Handschlag.
  // Bereits dieser erste Schritt erhält nach Stilllegung 401; ein Refresh-POST wird nicht mehr gesendet.
  const automaticRefresh = otherPage.waitForResponse('**/api/v1/access/csrf');
  await otherPage.clock.fastForward(571_000);
  expect((await automaticRefresh).status()).toBe(401);
  await expect(otherPage).toHaveURL('/anmelden');
  await expect(otherPage.getByRole('status')).toContainText('nicht verlängert');

  const currentCalls: string[] = [];
  oldTab.on('request', item => { if (item.url().includes('/api/')) currentCalls.push(new URL(item.url()).pathname); });
  const restored = oldTab.waitForResponse('**/api/v2/access/refresh');
  const currentAuthorization = nextAuthorization(oldTab);
  await oldTab.goto('/monat');
  expect((await restored).status()).toBe(200);
  const authorization = await currentAuthorization;
  await expect(oldTab).toHaveURL('/monat');
  await expect(oldTab.getByRole('link', { name: 'Ausgaben', exact: true })).toBeVisible();
  const currentAsset = await oldTab.locator('script[src]').first().getAttribute('src');
  expect(currentAsset).not.toBe(oldAsset);
  for (const entry of ['/', '/monat', '/ausgaben', '/sparziele', '/aktualisieren']) {
    const response = await request.get(entry);
    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toBe('no-store');
    expect(await response.text()).toContain(currentAsset!);
  }
  const asset = await request.get(currentAsset!);
  expect(asset.status()).toBe(200);
  expect(asset.headers()['content-type']).toMatch(/javascript/);
  expect(asset.headers()['cache-control']).toBe('public, max-age=31536000, immutable');
  await expect(oldTab.getByText('1.200,00 €', { exact: true }).first()).toBeVisible();
  await oldTab.getByRole('link', { name: 'Ausgaben', exact: true }).click();
  await expect(oldTab.getByText('Vor dem Wechsel', { exact: true }).first()).toBeVisible();
  await expect(oldTab.getByText('Bestätigt ohne Antwort', { exact: true }).first()).toBeVisible();
  await expect(oldTab.getByLabel('Name der Ausgabe', { exact: true })).toHaveValue('');
  const headers = { Authorization: authorization };
  const all = await request.get('http://127.0.0.1:8080/api/v2/expenses', { headers });
  const expenses = await all.json();
  expect(expenses.map((expense: { name: string }) => expense.name).sort()).toEqual(['Bestätigt ohne Antwort', 'Vor dem Wechsel']);
  const goals = await (await request.get('http://127.0.0.1:8080/api/v2/savings-goals', { headers })).json();
  expect(goals).toEqual([{ id: goalId, name: 'Erhaltenes Prüfziel', targetAmountCents: 10000, progressCents: 12500, targetDate: '2028-02-29' }]);
  expect((await request.put(`http://127.0.0.1:8080/api/v2/savings-goals/${goalId}/progress`, { headers, data: { progressCents: 12500 } })).status()).toBe(200);
  expect((await request.put(`http://127.0.0.1:8080/api/v2/savings-goals/${goalId}/progress`, { headers, data: { progressCents: -1 } })).status()).toBe(409);
  for (const api of ['http://127.0.0.1:8080/api/v1/expense-budget/expenses', '/api/v1/access/csrf']) {
    const response = await request.get(api, { headers });
    expect(response.status()).toBe(401);
    expect(response.headers()['cache-control']).toBe('no-store');
    expect(await response.json()).toMatchObject({ code: 'CLIENT_UPDATE_REQUIRED', updateUrl: '/aktualisieren' });
  }
  for (const file of [oldAsset!, '/main-missing123.js', '/missing.css', '/api/missing']) {
    const response = await request.get(file);
    expect(response.ok()).toBe(false);
    expect((await response.text()).toLowerCase()).not.toContain('<app-root');
  }
  await otherPage.goto('/monat');
  await expect(otherPage).toHaveURL('/monat');
  await otherPage.getByRole('link', { name: 'Ausgaben', exact: true }).click();
  await expect(otherPage.getByText('Noch keine Ausgaben erfasst.', { exact: true })).toBeVisible();
  await expect(otherPage.getByText('Vor dem Wechsel', { exact: true })).toHaveCount(0);
  const historyResponses: number[] = [];
  page.on('response', response => {
    if (new URL(response.url()).pathname.startsWith('/api/v1/')) historyResponses.push(response.status());
  });
  await page.goBack();
  await expect(page).toHaveURL('/anmelden');
  await page.goForward();
  await expect(page).toHaveURL('/anmelden');
  await expect(page.locator('app-expenses')).toHaveCount(0);
  await expect(page.getByText('Vor dem Wechsel', { exact: true })).toHaveCount(0);
  expect(historyResponses.every(status => status === 401)).toBe(true);
  // Alter gespeicherter Direktlink lädt mit vollständiger Navigation den aktuellen Einstieg.
  await page.goto('/sparziele');
  await expect(page.getByRole('heading', { name: 'Erhaltenes Prüfziel', exact: true })).toBeVisible();

  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1280, height: 800 }]) {
    await oldTab.setViewportSize(viewport);
    for (const title of ['Monat', 'Ausgaben', 'Sparziele']) {
      await oldTab.getByRole('link', { name: title, exact: true }).click();
      await expect(oldTab.getByRole('heading', { name: title, exact: true })).toBeVisible();
      await expect(oldTab.getByRole('button', { name: 'Abmelden', exact: true })).toBeVisible();
      await oldTab.evaluate(() => document.documentElement.style.fontSize = '200%');
      expect(await oldTab.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect((await new AxeBuilder({ page: oldTab }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
      await oldTab.evaluate(() => document.documentElement.style.fontSize = '');
    }
  }
  expect(currentCalls.every(call => call.startsWith('/api/v2/'))).toBe(true);
  await oldTab.goto('/aktualisieren?next=https://example.org');
  await expect(oldTab.locator('#update-title')).toBeFocused();
  await expect(oldTab.getByRole('navigation')).toHaveCount(0);
  await expect(oldTab.getByText(/Nicht gespeicherte Eingaben werden/)).toBeVisible();
  expect((await new AxeBuilder({ page: oldTab }).analyze()).violations).toEqual([]);
  await oldTab.keyboard.press('Tab');
  await expect(oldTab.getByRole('button', { name: 'Seite vollständig neu laden' })).toBeFocused();
  await oldTab.keyboard.press('Enter');
  await expect(oldTab).toHaveURL('/monat');
  await expect(oldTab.getByRole('heading', { name: 'Monat', exact: true })).toBeVisible();
  expect(await oldTab.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
  await oldTab.getByRole('button', { name: 'Abmelden', exact: true }).click();
  await expect(oldTab).toHaveURL('/anmelden');
  await otherContext.close();
});

test('nach realer Stilllegung sind sämtliche v2-Zugangs- und Finanzoperationen über die statische Oberfläche nutzbar', async ({ page }) => {
  execFileSync('python3', [path.resolve('../scripts/e2e-transition.py')], { timeout: 120_000, stdio: 'pipe' });
  await completeV2Flow(page);
});

test('neuer Client erkennt Aktualisierung vor Refresh/Retry auch bei direkten Sitzungsaufrufen und Registrierung', async ({ browser, request }) => {
  execFileSync('python3', [path.resolve('../scripts/e2e-transition.py')], { timeout: 120_000, stdio: 'pipe' });
  for (const operation of ['refresh', 'login', 'csrf', 'registrations', 'expenses', 'logout']) {
    const isolated = await browser.newContext({ baseURL: 'https://localhost:4200', ignoreHTTPSErrors: true });
    const page = await isolated.newPage();
    let refreshes = 0;
    page.on('request', item => { if (item.url().endsWith('/api/v2/access/refresh')) refreshes++; });
    const email = `update-${crypto.randomUUID()}@example.org`;
    expect((await request.post('http://127.0.0.1:8080/api/v2/access/registrations', {
      data: { registrationToken: 'a'.repeat(43), email, password }
    })).status()).toBe(201);
    if (operation === 'expenses' || operation === 'logout') await login(page, email);
    refreshes = 0;
    const endpoint = operation === 'expenses' ? '/api/v2/expenses' : '/api/v2/access/' + operation;
    let intercepted = 0;
    await page.route('**' + endpoint, route => {
      intercepted++;
      return route.fulfill({ status: 401, contentType: 'application/json',
        headers: { 'Cache-Control': 'no-store' },
        body: JSON.stringify({ code: 'CLIENT_UPDATE_REQUIRED', message: 'Bitte neu laden', updateUrl: 'https://example.org' }) });
    });
    if (operation === 'refresh') await page.goto('/monat');
    else if (operation === 'expenses') await page.getByRole('link', { name: 'Ausgaben', exact: true }).click();
    else if (operation === 'logout') await page.getByRole('button', { name: 'Abmelden', exact: true }).click();
    else {
      await page.goto(operation === 'registrations' ? '/registrieren#registrationToken=' + 'a'.repeat(43) : '/anmelden');
      await page.getByLabel('E-Mail-Adresse', { exact: true }).fill(email);
      await page.getByLabel('Passwort', { exact: true }).fill(password);
      await page.getByRole('button', { name: operation === 'registrations' ? 'Konto anlegen' : 'Anmelden', exact: true }).click();
    }
    await expect(page).toHaveURL('/aktualisieren');
    await expect(page.locator('#update-title')).toBeFocused();
    await expect(page.getByRole('navigation')).toHaveCount(0);
    expect(intercepted).toBe(1);
    expect(refreshes).toBe(operation === 'refresh' ? 1 : 0);
    for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1280, height: 800 }]) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => document.documentElement.style.fontSize = '200%');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const button = page.getByRole('button', { name: 'Seite vollständig neu laden' });
      expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.evaluate(() => document.documentElement.style.fontSize = '');
    }
    await isolated.close();
  }
});
