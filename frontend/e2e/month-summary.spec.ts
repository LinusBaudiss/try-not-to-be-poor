import AxeBuilder from '@axe-core/playwright';
import { expect, test, Page, APIRequestContext } from '@playwright/test';

test.use({ timezoneId: 'America/Los_Angeles' });

const password = '  Grüner 🦊 im Baum  ';
const summaryHeaders = { Date: 'Fri, 23 Oct 2026 10:00:00 GMT' };
const endpoint = '**/api/v1/expense-budget/month-summary';
const initial = { month: '2026-10-01', budgetCents: 10000, expensesCents: 1234, remainingCents: 8766 };
async function account(request: APIRequestContext): Promise<string> {
  const email = `summary-${crypto.randomUUID()}@example.org`;
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
  await expect(page.getByRole('button', { name: 'Ausgabe speichern', exact: true })).toBeEnabled();
}
function gate() {
  let release!: () => void;
  return { promise: new Promise<void>(resolve => { release = resolve; }), release: () => release() };
}
async function refresh(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Monatsübersicht aktualisieren', exact: true }).click();
}

test('gemeinsamer Datenstand, fehlendes Budget, Nullbudget und negative sichere Centgrenzen', async ({ page, request }) => {
  let value: object = initial;
  await page.route(endpoint, route => route.fulfill({ headers: summaryHeaders, json: value }));
  await login(page, await account(request));
  const summary = page.locator('app-month-summary');
  await expect(summary).toContainText('Oktober 2026');
  await expect(summary).toContainText('100,00 €'); await expect(summary).toContainText('12,34 €');
  await expect(summary.locator('.summary-money')).toHaveText('87,66 €');
  for (const [budgetCents, expensesCents, remainingCents, text] of [
    [10000, 0, 10000, '100,00 €'], [0, 0, 0, '0,00 €'], [0, 9007199254740991, -9007199254740991, '−90.071.992.547.409,91 €'],
    [9007199254740991, 9007199254740990, 1, '0,01 €']
  ] as const) {
    value = { ...initial, budgetCents, expensesCents, remainingCents }; await refresh(page);
    await expect(summary.locator('.summary-money')).toHaveText(text);
    await expect(summary.getByText('Budget überschritten', { exact: true })).toHaveCount(remainingCents < 0 ? 1 : 0);
  }
  value = { ...initial, budgetCents: null, remainingCents: null }; await refresh(page);
  await expect(summary).toContainText('Lege dein Monatsbudget fest');
  await expect(summary.locator('.summary-money')).toHaveCount(0);
  await expect(summary).toContainText('12,34 €');
});

test('bestätigte Budget- und Ausgabenänderungen laden neu; Entwürfe und laufende oder fehlgeschlagene Speicherung ändern den Rest nicht', async ({ page, request }) => {
  await login(page, await account(request));
  const money = page.locator('app-month-summary .summary-money');
  await page.getByLabel('Monatsbudget in Euro').fill('100');
  await page.getByRole('button', { name: 'Budget speichern', exact: true }).click();
  await expect(money).toHaveText('100,00 €');
  await page.getByLabel('Monatsbudget in Euro').fill('200');
  await expect(money).toHaveText('100,00 €');
  const held = gate(), ready = gate();
  await page.route('**/api/v1/expense-budget/budget', async route => {
    if (route.request().method() !== 'PUT') return route.continue();
    const response = await route.fetch(); ready.release(); await held.promise; await route.fulfill({ response });
  });
  await page.getByRole('button', { name: 'Budget speichern', exact: true }).click(); await ready.promise;
  await expect(money).toHaveText('100,00 €'); held.release(); await expect(money).toHaveText('200,00 €');
  await page.unroute('**/api/v1/expense-budget/budget');
  await page.route('**/api/v1/expense-budget/budget', async route => {
    if (route.request().method() !== 'PUT') return route.continue();
    await route.fulfill({ status: 500, json: {} });
  });
  await page.getByLabel('Monatsbudget in Euro').fill('300');
  await page.getByRole('button', { name: 'Budget speichern', exact: true }).click();
  await expect(page.locator('#budget-status')).toContainText('nicht bestätigt'); await expect(money).toHaveText('200,00 €');
  await page.getByLabel('Name der Ausgabe').fill('Brot'); await page.getByLabel('Ausgabenbetrag in Euro').fill('12,34');
  await page.getByRole('button', { name: 'Ausgabe speichern', exact: true }).click();
  await expect(money).toHaveText('187,66 €');
  let reads = 0;
  await page.route(endpoint, async route => { reads++; await route.continue(); });
  await page.getByRole('button', { name: 'Ausgaben aktualisieren', exact: true }).click();
  await expect.poll(() => reads).toBe(1); await expect(money).toHaveText('187,66 €');
});

test('Laden, Netzfehler und ungültige Antworten entfernen alte Werte und bleiben wiederholbar', async ({ page, request }) => {
  let value: unknown = initial;
  let fail = false;
  await page.route(endpoint, route => fail ? route.abort('failed') : route.fulfill({ headers: summaryHeaders, json: value }));
  await login(page, await account(request));
  const summary = page.locator('app-month-summary');
  await expect(summary.locator('.summary-money')).toHaveText('87,66 €');
  for (const invalid of [null, {}, { ...initial, month: '2026-13-01' }, { ...initial, month: '2026-10-02' },
    { ...initial, remainingCents: 1 }, { ...initial, budgetCents: null }, { ...initial, expensesCents: -1 },
    { ...initial, expensesCents: 9007199254740992 }, { ...initial, budgetCents: '10000' }]) {
    value = invalid;
    await summary.getByRole('button').click();
    await expect(summary).toContainText('konnte nicht geladen werden');
    await expect(summary.locator('.summary-money')).toHaveCount(0);
    await expect(summary.locator('.summary-details')).toHaveCount(0);
  }
  fail = true; await summary.getByRole('button').click();
  await expect(summary).toContainText('konnte nicht geladen werden');
  fail = false; value = initial; await summary.getByRole('button').click();
  await expect(summary.locator('.summary-money')).toHaveText('87,66 €');
});

test('überholte Antworten werden nach einer neueren Aktualisierung verworfen', async ({ page, request }) => {
  await page.route(endpoint, route => route.fulfill({ headers: summaryHeaders, json: initial }));
  await login(page, await account(request));
  await expect(page.locator('.summary-money')).toHaveText('87,66 €');
  await page.unroute(endpoint);
  const held = gate(), ready = gate(); let reads = 0;
  await page.route(endpoint, async route => {
    if (++reads === 1) { ready.release(); await held.promise; await route.fulfill({ headers: summaryHeaders, json: initial }); }
    else await route.fulfill({ headers: summaryHeaders, json: { ...initial, expensesCents: 0, remainingCents: 10000 } });
  });
  await refresh(page); await ready.promise;
  await expect(page.locator('.summary-money')).toHaveCount(0);
  await refresh(page); await expect(page.locator('.summary-money')).toHaveText('100,00 €');
  const answered = page.waitForResponse(response => response.url().endsWith('/month-summary'));
  held.release(); await answered;
  await expect(page.locator('.summary-money')).toHaveText('100,00 €');
});

test('Sitzungsende und Kontowechsel leeren die Zusammenfassung und verwerfen späte Antworten', async ({ page, context, request }) => {
  const first = await account(request), second = await account(request);
  await page.route(endpoint, route => route.fulfill({ headers: summaryHeaders, json: initial }));
  await login(page, first); await expect(page.locator('.summary-money')).toHaveText('87,66 €');
  await page.evaluate(() => { (window as any).closedSummary = (window as any).ng.getComponent(document.querySelector('app-month-summary')); });
  await page.unroute(endpoint);
  const held = gate(), ready = gate();
  await page.route(endpoint, async route => { ready.release(); await held.promise; await route.fulfill({ headers: summaryHeaders, json: initial }); });
  await refresh(page); await ready.promise;
  const other = await context.newPage(); await login(other, second);
  await expect(page).toHaveURL('/anmelden');
  const answered = page.waitForResponse(response => response.url().endsWith('/month-summary'));
  held.release(); await answered;
  expect(await page.evaluate(() => (window as any).closedSummary.value())).toBeNull();
  await expect(other.locator('app-month-summary')).toContainText('Lege dein Monatsbudget fest');
  await other.getByRole('button', { name: 'Abmelden', exact: true }).click(); await expect(other).toHaveURL('/anmelden');
  await expect(other.locator('app-month-summary')).toHaveCount(0);
});

test('Servermonat wechselt trotz über die Monatsgrenze vorgehender Geräteuhr und anderer Browserzeitzone', async ({ page, request }) => {
  await page.clock.install({ time: new Date('2026-12-31T23:09:58Z') });
  let reads = 0;
  await page.route(endpoint, async route => {
    reads++; await route.fulfill({ headers: { Date: reads === 1 ? 'Thu, 31 Dec 2026 22:59:58 GMT' : 'Thu, 31 Dec 2026 23:00:01 GMT' }, json: reads === 1 ? { ...initial, month: '2026-12-01' } : { ...initial, month: '2027-01-01', expensesCents: 0, remainingCents: 10000 } });
  });
  await login(page, await account(request));
  await expect(page.locator('app-month-summary')).toContainText('Dezember 2026');
  await page.clock.fastForward(1000);
  expect(reads).toBe(1);
  await expect(page.locator('app-month-summary')).toContainText('Dezember 2026');
  await page.clock.fastForward(2000);
  await expect(page.locator('app-month-summary')).toContainText('Januar 2027');
  await expect(page.locator('.summary-money')).toHaveText('100,00 €');
  expect(reads).toBe(2);
});

test('Restbudget steht vor Formularen, ist per Tastatur aktualisierbar und bleibt mit 200-Prozent-Text lesbar; axe besteht', async ({ page, request }) => {
  await page.route(endpoint, route => route.fulfill({ headers: summaryHeaders, json: { ...initial, budgetCents: 0, expensesCents: 9007199254740991, remainingCents: -9007199254740991 } }));
  await login(page, await account(request));
  await expect(page.locator('.summary-money')).toHaveText('−90.071.992.547.409,91 €');
  const button = page.getByRole('button', { name: 'Monatsübersicht aktualisieren', exact: true });
  await button.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#summary-status')).toContainText('Budget überschritten');
  await expect(page.locator('#summary-status')).toHaveAttribute('aria-live', 'polite');
  expect(await page.evaluate(() => !!(document.querySelector('app-month-summary')!.compareDocumentPosition(document.querySelector('form')!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 800 });
    for (const size of ['100%', '200%']) {
      await page.evaluate(value => { document.documentElement.style.fontSize = value; }, size);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      for (const element of await page.locator('app-month-summary dt, app-month-summary dd, .summary-money').all())
        expect(await element.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    }
  }
});


test('Tokenablauf leert den Arbeitsspeicher und verwirft eine noch laufende Monatsantwort', async ({ page, request }) => {
  await page.clock.install();
  await page.route(endpoint, route => route.fulfill({ headers: summaryHeaders, json: initial }));
  await login(page, await account(request));
  await expect(page.locator('.summary-money')).toHaveText('87,66 €');
  await page.evaluate(() => { (window as any).closedSummary = (window as any).ng.getComponent(document.querySelector('app-month-summary')); });
  const refreshHeld = gate(), refreshReady = gate();
  await page.route('**/api/v2/access/refresh', async route => {
    const response = await route.fetch(); refreshReady.release(); await refreshHeld.promise; await route.fulfill({ response });
  });
  await page.clock.fastForward(570_001); await refreshReady.promise;
  await page.clock.fastForward(28_000);
  await page.unroute(endpoint);
  const held = gate(), ready = gate();
  await page.route(endpoint, async route => { ready.release(); await held.promise; await route.fulfill({ headers: summaryHeaders, json: initial }); });
  await refresh(page); await ready.promise;
  await page.clock.fastForward(3_000); await expect(page).toHaveURL('/anmelden');
  const answered = page.waitForResponse(response => response.url().endsWith('/month-summary'));
  held.release(); await answered;
  expect(await page.evaluate(() => (window as any).closedSummary.value())).toBeNull();
  const revoked = page.waitForResponse('**/api/v2/access/logout');
  refreshHeld.release(); expect((await revoked).status()).toBe(204);
  await expect(page.locator('app-month-summary')).toHaveCount(0);
});


test('Monatswechsel offline lädt beim Wiederverbinden genau einmal den aktuellen Servermonat', async ({ page, context, request }) => {
  await page.clock.install();
  let reads = 0;
  await page.route(endpoint, async route => {
    reads++;
    await route.fulfill({ headers: { Date: reads === 1 ? 'Thu, 31 Dec 2026 22:59:58 GMT' : 'Thu, 31 Dec 2026 23:00:01 GMT' },
      json: { ...initial, month: reads === 1 ? '2026-12-01' : '2027-01-01' } });
  });
  await login(page, await account(request));
  await expect(page.locator('app-month-summary')).toContainText('Dezember 2026');
  await context.setOffline(true); await page.clock.fastForward(3000);
  expect(reads).toBe(1);
  await context.setOffline(false);
  await expect(page.locator('app-month-summary')).toContainText('Januar 2027');
  expect(reads).toBe(2);
});

test('extern geändertes Budget wird mit der Zusammenfassung abgeglichen und erhält einen bearbeiteten Entwurf', async ({ page, context, request }) => {
  await login(page, await account(request));
  await page.getByLabel('Monatsbudget in Euro').fill('100');
  await page.getByRole('button', { name: 'Budget speichern', exact: true }).click();
  await expect(page.locator('.summary-money')).toHaveText('100,00 €');
  // Ein zweiter Tab verwendet dieselbe Sitzung ohne einen Kontowechsel auszulösen.
  const other = await context.newPage();
  await other.goto('/monat');
  await expect(other.getByLabel('Monatsbudget in Euro')).toHaveValue('100,00');
  await page.getByLabel('Monatsbudget in Euro').fill('123,45');
  await other.getByLabel('Monatsbudget in Euro').fill('200');
  await other.getByRole('button', { name: 'Budget speichern', exact: true }).click();
  await expect(other.locator('.summary-money')).toHaveText('200,00 €');
  await refresh(page);
  await expect(page.locator('.summary-money')).toHaveText('200,00 €');
  await expect(page.locator('.budget-value .money')).toHaveText('200,00 €');
  await expect(page.getByLabel('Monatsbudget in Euro')).toHaveValue('123,45');
  await expect(page.locator('#budget-status')).not.toHaveClass(/success/);
});

for (const firstEvent of ['focus', 'visibilitychange'] as const) {
  test(`${firstEvent} holt einen verpassten Monatswechsel genau einmal nach und verwirft die alte Antwort`, async ({ page, request }) => {
    await page.clock.install();
    // Hintergrunddrosselung simulieren: ausschließlich der Kalendertimer wird nicht ausgeführt.
    await page.addInitScript(() => {
      const original = window.setInterval;
      window.setInterval = ((handler: TimerHandler, delay?: number, ...args: any[]) =>
        original(delay === 1000 ? () => {} : handler, delay, ...args)) as typeof window.setInterval;
    });
    let reads = 0;
    const held = gate(), ready = gate();
    await page.route(endpoint, async route => {
      const read = ++reads;
      if (read === 2) { ready.release(); await held.promise; }
      await route.fulfill({ headers: { Date: read < 3 ? 'Thu, 31 Dec 2026 22:59:57 GMT' : 'Thu, 31 Dec 2026 23:00:02 GMT' },
        json: { ...initial, month: read < 3 ? '2026-12-01' : '2027-01-01', expensesCents: read < 3 ? 1234 : 0, remainingCents: read < 3 ? 8766 : 10000 } });
    });
    await login(page, await account(request));
    await expect(page.locator('app-month-summary')).toContainText('Dezember 2026');
    await refresh(page); await ready.promise;
    await page.clock.fastForward(5000); expect(reads).toBe(2);
    await page.evaluate(first => {
      const send = (name: string) => (name === 'focus' ? window : document).dispatchEvent(new Event(name));
      send(first); send(first === 'focus' ? 'visibilitychange' : 'focus');
    }, firstEvent);
    await expect(page.locator('app-month-summary')).toContainText('Januar 2027');
    expect(reads).toBe(3);
    const answered = page.waitForResponse(response => response.url().endsWith('/month-summary'));
    held.release(); await answered;
    await expect(page.locator('app-month-summary')).toContainText('Januar 2027');
    await expect(page.locator('.summary-money')).toHaveText('100,00 €');
    expect(reads).toBe(3);
  });
}
