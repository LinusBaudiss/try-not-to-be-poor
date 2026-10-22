import AxeBuilder from '@axe-core/playwright';
import { expect, test, Page } from '@playwright/test';

const token = 'a'.repeat(43);
const password = '  Grüner 🦊 im Baum  ';
const freshEmail = () => `browser-${crypto.randomUUID()}@example.org`;

async function open(page: Page, secret = token): Promise<void> {
  await page.goto(`/registrieren#registrationToken=${secret}`);
  await expect(page.getByRole('heading', { name: 'Eigenes Konto anlegen' })).toBeVisible();
}

async function fill(page: Page, email = freshEmail(), value = password): Promise<string> {
  await page.getByLabel('E-Mail-Adresse', { exact: true }).fill(email);
  await page.getByLabel('Passwort', { exact: true }).fill(value);
  return email;
}

async function send(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Konto anlegen', exact: true }).click();
}

test('echte Registrierung: Commit bestätigt Erfolg, Passwort entfernt, keine Sitzung oder Browserpersistenz', async ({ page, context }) => {
  const urls: string[] = [];
  page.on('request', request => urls.push(request.url()));
  await open(page);
  await expect(page).toHaveURL('/registrieren');
  const email = await fill(page);
  const request = page.waitForRequest('**/api/v1/access/registrations');
  const response = page.waitForResponse('**/api/v1/access/registrations');
  await send(page);
  expect((await response).status()).toBe(201);
  expect((await request).postDataJSON()).toEqual({ registrationToken: token, email, password });
  await expect(page.getByRole('status')).toHaveText('Dein Konto wurde angelegt.');
  await expect(page.locator('#feedback')).toBeFocused();
  await expect(page.locator('input[type=password]')).toHaveCount(0);
  expect(urls.every(url => !url.includes(token))).toBeTruthy();
  expect(await context.cookies()).toEqual([]);
  expect(await page.evaluate(async () => ({
    local: localStorage.length, session: sessionStorage.length,
    databases: await indexedDB.databases(), caches: await caches.keys()
  }))).toEqual({ local: 0, session: 0, databases: [], caches: [] });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('fehlender Link bietet einen verständlichen nächsten Schritt und sendet keine Anfrage', async ({ page }) => {
  await page.goto('/registrieren');
  await expect(page.getByRole('status')).toContainText('Öffne einen gültigen Registrierungslink');
  await expect(page.getByRole('button', { name: 'Konto anlegen', exact: true })).toBeDisabled();
});

test('falscher Link liefert einen neutralen Fehler und erhält Eingaben', async ({ page }) => {
  await open(page, 'b'.repeat(43));
  const email = await fill(page);
  await send(page);
  await expect(page.getByRole('status')).toHaveText('Registrierung nicht möglich. Prüfe deine Angaben und den Registrierungslink.');
  await expect(page.getByLabel('E-Mail-Adresse', { exact: true })).toHaveValue(email);
  await expect(page.getByLabel('Passwort', { exact: true })).toHaveValue(password);
  await expect(page.locator('#feedback')).toBeFocused();
});

test('bereits vorhandene E-Mail wird auch bei anderer Schreibweise nicht bestätigt', async ({ page, request }) => {
  const email = freshEmail();
  const first = await request.post('http://127.0.0.1:8080/api/v1/access/registrations', { data: { registrationToken: token, email, password } });
  expect(first.status()).toBe(201);
  await open(page);
  await fill(page, `  ${email.toUpperCase()}  `);
  await send(page);
  await expect(page.getByRole('status')).toHaveText('Registrierung nicht möglich. Prüfe deine Angaben und den Registrierungslink.');
});

test('Feldfehler haben Labels und Zuordnung, fokussieren das erste Feld und bestehen axe', async ({ page }) => {
  await open(page);
  await fill(page, 'keine-adresse', 'kurz');
  await send(page);
  await expect(page.locator('#email')).toBeFocused();
  await expect(page.locator('#email')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#email')).toHaveAttribute('aria-describedby', 'email-error');
  await expect(page.locator('#email-error')).toContainText('gültige E-Mail-Adresse');
  await expect(page.locator('#password-error')).toContainText('15 bis 64');
  await expect(page.getByLabel('Passwort', { exact: true })).toHaveValue('kurz');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

for (const length of [14, 65]) {
  test(`Passwort mit ${length} Unicode-Codepunkten wird mit hilfreichem Feldfehler abgelehnt`, async ({ page }) => {
    await open(page);
    await fill(page, freshEmail(), '🦊'.repeat(length));
    await send(page);
    await expect(page.locator('#password-error')).toContainText('15 bis 64');
    await expect(page.locator('#password')).toBeFocused();
  });
}

for (const length of [15, 64]) {
  test(`Passwort mit ${length} Unicode-Codepunkten wird vollständig angenommen`, async ({ page }) => {
    await open(page);
    await fill(page, freshEmail(), '🦊'.repeat(length));
    await send(page);
    await expect(page.getByRole('status')).toHaveText('Dein Konto wurde angelegt.');
  });
}

test('lokaler Sperrlistentreffer wird als hilfreicher Passwortfehler angezeigt', async ({ page }) => {
  await open(page);
  await fill(page, freshEmail(), 'Mailcreated5240');
  await send(page);
  await expect(page.locator('#password-error')).toContainText('zu häufig');
});

test('laufende Anfrage blockiert Doppelsenden und zeigt Erfolg erst nach der Antwort', async ({ page }) => {
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  let requests = 0;
  await page.route('**/api/v1/access/registrations', async route => {
    requests++;
    await held;
    await route.continue();
  });
  await open(page);
  await fill(page);
  await send(page);
  await expect(page.getByRole('button', { name: 'Konto wird angelegt …' })).toBeDisabled();
  await expect(page.getByRole('status')).toHaveText('Dein Konto wird angelegt …');
  await page.locator('#password').press('Enter');
  await page.locator('#password').press('Enter');
  expect(requests).toBe(1);
  release();
  await expect(page.getByRole('status')).toHaveText('Dein Konto wurde angelegt.');
});

for (const mode of ['Netzwerkfehler', 'Serverfehler']) {
  test(`${mode}: kein Erfolg, Eingaben erhalten, erneutes Absenden möglich`, async ({ page }) => {
    await page.route('**/api/v1/access/registrations', route => mode === 'Netzwerkfehler'
      ? route.abort('failed')
      : route.fulfill({ status: 500, contentType: 'application/json', body: '{"code":"SERVER_ERROR","message":"Fehler","fieldErrors":{}}' }));
    await open(page);
    const email = await fill(page);
    await send(page);
    await expect(page.getByRole('status')).toContainText('Die Bestätigung ist ausgeblieben.');
    await expect(page.getByLabel('E-Mail-Adresse', { exact: true })).toHaveValue(email);
    await expect(page.getByLabel('Passwort', { exact: true })).toHaveValue(password);
    await expect(page.getByRole('button', { name: 'Konto anlegen', exact: true })).toBeEnabled();
    await page.unroute('**/api/v1/access/registrations');
    await send(page);
    await expect(page.getByRole('status')).toHaveText('Dein Konto wurde angelegt.');
  });
}

test('neuer Link im selben Tab verwirft alten Token, Entwurf und Fehler und entfernt das neue Fragment', async ({ page }) => {
  await open(page, 'b'.repeat(43));
  await fill(page);
  await send(page);
  await expect(page.getByRole('status')).toContainText('Registrierung nicht möglich.');
  const reloaded = page.waitForEvent('load');
  await page.evaluate(secret => { window.location.hash = `registrationToken=${secret}`; }, token);
  await reloaded;
  await expect(page.getByLabel('E-Mail-Adresse', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Passwort', { exact: true })).toHaveValue('');
  await expect(page.getByRole('status')).toBeEmpty();
  await expect(page).toHaveURL('/registrieren');
  await fill(page);
  const sent = page.waitForRequest('**/api/v1/access/registrations');
  await send(page);
  expect((await sent).postDataJSON().registrationToken).toBe(token);
  await expect(page.getByRole('status')).toHaveText('Dein Konto wurde angelegt.');
});

test('hängende Anfrage endet nach 30 Sekunden mit erhaltenem Entwurf und erneuter Aktion', async ({ page }) => {
  await page.clock.install();
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/v1/access/registrations', async route => {
    await held;
    await route.abort().catch(() => {});
  });
  await open(page);
  const email = await fill(page);
  const sent = page.waitForRequest('**/api/v1/access/registrations');
  await send(page);
  await sent;
  await expect(page.getByRole('button', { name: 'Konto wird angelegt …' })).toBeDisabled();
  await page.clock.fastForward(30_001);
  await expect(page.getByRole('status')).toContainText('Die Bestätigung ist ausgeblieben.');
  await expect(page.getByLabel('E-Mail-Adresse', { exact: true })).toHaveValue(email);
  await expect(page.getByLabel('Passwort', { exact: true })).toHaveValue(password);
  await expect(page.getByRole('button', { name: 'Konto anlegen', exact: true })).toBeEnabled();
  release();
  await page.unroute('**/api/v1/access/registrations');
  await send(page);
  await expect(page.getByRole('status')).toHaveText('Dein Konto wurde angelegt.');
});

test('verlorene Antwort nach echtem Commit meldet fehlende Bestätigung und erlaubt erneuten Versuch', async ({ page }) => {
  let committed = false;
  await page.route('**/api/v1/access/registrations', async route => {
    const response = await route.fetch();
    expect(response.status()).toBe(201);
    committed = true;
    await route.abort('failed');
  });
  await open(page);
  const email = await fill(page);
  await send(page);
  await expect(page.getByRole('status')).toContainText('Ob dein Konto angelegt wurde, ist unklar.');
  expect(committed).toBeTruthy();
  await expect(page.getByLabel('E-Mail-Adresse', { exact: true })).toHaveValue(email);
  await expect(page.getByLabel('Passwort', { exact: true })).toHaveValue(password);
  await expect(page.getByRole('button', { name: 'Konto anlegen', exact: true })).toBeEnabled();
  await page.unroute('**/api/v1/access/registrations');
  const retried = page.waitForResponse('**/api/v1/access/registrations');
  await send(page);
  expect((await retried).status()).toBe(400);
  await expect(page.getByRole('status')).toContainText('Registrierung nicht möglich.');
});

test('offline blockiert Speichern, erhält den Entwurf und erlaubt einen Versuch nach Wiederverbindung', async ({ page, context }) => {
  await open(page);
  await fill(page);
  await context.setOffline(true);
  await expect(page.getByText('Du bist offline.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Konto anlegen', exact: true })).toBeDisabled();
  await expect(page.getByLabel('Passwort', { exact: true })).toHaveValue(password);
  await context.setOffline(false);
  await send(page);
  await expect(page.getByRole('status')).toHaveText('Dein Konto wurde angelegt.');
});

test('320 Pixel, Tastatur, 200-Prozent-Text und Touchziele bleiben zugänglich', async ({ page }) => {
  await open(page);
  await page.keyboard.press('Tab');
  await expect(page.locator('#email')).toBeFocused();
  expect(await page.locator('#email').evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none');
  await page.keyboard.type(freshEmail());
  await page.keyboard.press('Tab');
  await expect(page.locator('#password')).toBeFocused();
  await page.keyboard.insertText(password);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Konto anlegen', exact: true })).toBeFocused();
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 568 });
    for (const fontSize of ['100%', '200%']) {
      await page.evaluate(size => { document.documentElement.style.fontSize = size; }, fontSize);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy();
      for (const selector of ['#email', '#password', 'button']) {
        const box = await page.locator(selector).boundingBox();
        expect(box?.width).toBeGreaterThanOrEqual(44);
        expect(box?.height).toBeGreaterThanOrEqual(44);
      }
    }
  }
  await page.setViewportSize({ width: 320, height: 568 });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toHaveText('Dein Konto wurde angelegt.');
});
