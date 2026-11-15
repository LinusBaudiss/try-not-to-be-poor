import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { authenticate, cleanup, configure, input, settle, submit } from '../../testing/component-harness';
import { Session } from '../session/session';
import { Expenses } from './expenses';

describe('Expenses template with authenticated HTTP', () => {
  let fixture: ComponentFixture<Expenses>, http: HttpTestingController;
  const row = { id: '11111111-1111-4111-8111-111111111111', name: 'Berlin-Fahrt', amountCents: 1234, recordedOn: '2026-03-29' };
  beforeEach(async () => {
    configure(); await authenticate(); http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Expenses); fixture.detectChanges();
    http.expectOne('/api/v2/expenses').flush([]); await settle(fixture);
  });
  afterEach(cleanup);
  it('renders empty state, labels and preserves calendar dates and user text', async () => {
    expect(fixture.nativeElement.textContent).toContain('Noch keine Ausgaben');
    input(fixture, 'expense-name', row.name); input(fixture, 'expense-amount', '12,34'); submit(fixture);
    const request = http.expectOne('/api/v2/expenses');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: row.name, amountCents: 1234 });
    expect(request.request.headers.get('Authorization')).toBe('Bearer memory-token');
    expect(fixture.nativeElement.textContent).not.toContain('Deine Ausgabe wurde gespeichert.');
    submit(fixture); http.expectNone('/api/v2/expenses');
    expect(fixture.nativeElement.querySelector('[type=submit]').disabled).toBe(true);
    request.flush(row, { status: 201, statusText: 'Created' }); await settle(fixture);
    expect(fixture.nativeElement.textContent).toContain('Berlin-Fahrt');
    expect(fixture.nativeElement.textContent).not.toMatch(/Europe\/Berlin|Zeitzone|Berliner Zeit/);
    expect(fixture.nativeElement.textContent).toContain('29.03.2026');
    expect(fixture.nativeElement.textContent).toContain('12,34\u00a0€');
    expect(fixture.nativeElement.textContent).toContain('Deine Ausgabe wurde gespeichert.');
  });
  it.each(['0', '-1', '1,001', '90071992547409,92'])('rejects invalid positive amount %s accessibly', async amount => {
    input(fixture, 'expense-name', 'Brot'); input(fixture, 'expense-amount', amount); submit(fixture); await settle(fixture);
    expect(fixture.nativeElement.querySelector('#expense-amount').getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('#expense-amount-error').textContent).toContain('positiven Betrag');
    http.expectNone('/api/v2/expenses');
  });
  it('retains a draft on field errors and clears the error on edit', async () => {
    input(fixture, 'expense-name', row.name); input(fixture, 'expense-amount', '12,34'); submit(fixture);
    http.expectOne('/api/v2/expenses').flush({ fieldErrors: { name: 'Name prüfen' } }, { status: 400, statusText: 'Bad Request' }); await settle(fixture);
    expect(fixture.nativeElement.querySelector('#expense-name').value).toBe(row.name);
    expect(fixture.nativeElement.querySelector('#expense-name-error').textContent).toBe('Name prüfen');
    input(fixture, 'expense-name', 'Neu'); expect(fixture.nativeElement.querySelector('#expense-name-error')).toBeNull();
  });
  it('keeps uncertain writes blocked until a reload and explicit review', async () => {
    input(fixture, 'expense-name', row.name); input(fixture, 'expense-amount', '12,34'); submit(fixture);
    http.expectOne('/api/v2/expenses').error(new ProgressEvent('error')); await settle(fixture);
    expect(fixture.nativeElement.querySelector('#expense-name').value).toBe(row.name);
    submit(fixture); http.expectNone('/api/v2/expenses');
    const buttons = () => [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons().find(b => b.textContent?.includes('Historie zur Prüfung'))!.click();
    http.expectOne('/api/v2/expenses').flush([row]); await settle(fixture);
    expect(fixture.nativeElement.querySelector('[type=submit]').disabled).toBe(true);
    buttons().find(b => b.textContent?.includes('Ich habe die Historie'))!.click(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[type=submit]').disabled).toBe(false);
  });
  it('keeps offline input in the open tab and prevents sending', () => {
    input(fixture, 'expense-name', row.name); window.dispatchEvent(new Event('offline')); fixture.detectChanges(); submit(fixture);
    expect(fixture.nativeElement.querySelector('#expense-name').value).toBe(row.name);
    expect(fixture.nativeElement.querySelector('[type=submit]').disabled).toBe(true); http.expectNone('/api/v2/expenses');
  });
  it('sends deletion only after confirmation and changes the list after response', async () => {
    const buttons = () => [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons().find(button => button.textContent?.includes('Ausgaben aktualisieren'))!.click();
    http.expectOne('/api/v2/expenses').flush([row]); await settle(fixture);
    fixture.nativeElement.querySelector('[aria-label="Berlin-Fahrt löschen"]').click();
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve())); await settle(fixture);
    expect(fixture.nativeElement.querySelector('dialog').open).toBe(true);
    http.expectNone('/api/v2/expenses/11111111-1111-4111-8111-111111111111');
    fixture.nativeElement.querySelector('#expense-delete-cancel').click(); fixture.detectChanges();
    http.expectNone('/api/v2/expenses/11111111-1111-4111-8111-111111111111');
    expect(fixture.nativeElement.querySelector('.expense-cards').textContent).toContain('Berlin-Fahrt');
    fixture.nativeElement.querySelector('[aria-label="Berlin-Fahrt löschen"]').click();
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve())); await settle(fixture);
    buttons().find(button => button.textContent?.includes('Endgültig löschen'))!.click(); fixture.detectChanges();
    const request = http.expectOne('/api/v2/expenses/11111111-1111-4111-8111-111111111111'); expect(request.request.method).toBe('DELETE');
    expect(fixture.nativeElement.querySelector('.expense-cards').textContent).toContain('Berlin-Fahrt');
    request.flush(null, { status: 204, statusText: 'No Content' }); await settle(fixture);
    expect(fixture.nativeElement.textContent).toContain('Noch keine Ausgaben');
  });
  it('discards an old account mutation after a real account login succeeds', async () => {
    input(fixture, 'expense-name', row.name); input(fixture, 'expense-amount', '12,34'); submit(fixture);
    const old = http.expectOne('/api/v2/expenses');
    const session = await authenticate('owner-2', 'new-memory-token'); await settle(fixture);
    old.flush(row, { status: 201, statusText: 'Created' }); await settle(fixture);
    expect(session.userId()).toBe('owner-2'); expect(session.token()).toBe('new-memory-token');
    expect(fixture.nativeElement.querySelector('#expense-name').value).toBe('');
    expect(fixture.nativeElement.textContent).not.toContain('Berlin-Fahrt');
    expect(fixture.nativeElement.textContent).not.toContain('Deine Ausgabe wurde gespeichert.');
  });
  it('discards a late response and all drafts after the session ends', async () => {
    input(fixture, 'expense-name', row.name); input(fixture, 'expense-amount', '12,34'); submit(fixture);
    const pending = http.expectOne('/api/v2/expenses');
    TestBed.inject(Session).end('Sitzung beendet', false, false); await settle(fixture);
    pending.flush(row, { status: 201, statusText: 'Created' }); await settle(fixture);
    expect(fixture.nativeElement.textContent).not.toContain('Berlin-Fahrt');
    expect(fixture.nativeElement.querySelector('#expense-name').value).toBe('');
    expect(fixture.nativeElement.textContent).not.toContain('Deine Ausgabe wurde gespeichert.');
  });
  it.each([
    ["FE-2d60f3258d64b7f7", '0'],
    ["FE-dfeb43baf6163f50", '-1'],
    ["FE-8ea82b54f2a149bd", '1,001'],
    ["FE-83256bf1cbec8ae0", '1.009'],
    ["FE-8819b488cd0c486a", '90071992547409,92'],
    ["FE-49ecbc5e7a30c888", '1.000,00'],
    ["FE-e948b7362796ab11", 'NaN'],
    ["FE-128b514ccb31a242", ''],
    ["FE-8be342db74f23aa1", '1.001'],
    ["FE-f5c5e2fbe0de6629", '1e2']
  ] as const)('%s rejects the original expense input %s before HTTP', async (_id, value) => {
    input(fixture, 'expense-name', 'Entwurf'); input(fixture, 'expense-amount', value); submit(fixture); await settle(fixture);
    expect(fixture.nativeElement.querySelector('#expense-amount').value).toBe(value);
    expect(fixture.nativeElement.querySelector('#expense-amount').getAttribute('aria-invalid')).toBe('true'); http.expectNone('/api/v2/expenses');
  });
  it.each([
    ["FE-c36f41e084565e4b", 'server'],
    ["FE-0fb418954be5ea57", 'network'],
    ["FE-4a3f7ed87244161b", 'invalid'],
    ["FE-21f2f86246f1beaf", 'different-name'],
    ["FE-c999230101cb6088", 'different-amount'],
    ["FE-db5850f49e20cc78", 'wrong-status'],
    ["FE-c834a44207f03f43", 'extra-field']
  ] as const)('%s rejects unconfirmed expense create response %s', async (_id, mode) => {
    input(fixture, 'expense-name', 'Entwurf'); input(fixture, 'expense-amount', '12,34'); submit(fixture);
    const request = http.expectOne('/api/v2/expenses');
    expect(request.request.method).toBe('POST'); expect(request.request.body).toEqual({ name: 'Entwurf', amountCents: 1234 });
    if (mode === 'network') request.error(new ProgressEvent('error'));
    else request.flush(mode === 'server' ? {} : { ...row, name: mode === 'different-name' ? 'Abweichender Name' : 'Entwurf', amountCents: mode === 'different-amount' ? 1235 : 1234, recordedOn: mode === 'invalid' ? '2026-02-30' : row.recordedOn, ...(mode === 'extra-field' ? { unexpected: true } : {}) }, { status: mode === 'server' ? 500 : mode === 'wrong-status' ? 200 : 201, statusText: 'Controlled response' });
    await settle(fixture);
    expect(fixture.nativeElement.querySelector('#expense-status').textContent).toContain('nicht bestätigt');
    expect(fixture.nativeElement.querySelector('#expense-name').value).toBe('Entwurf');
    expect(fixture.nativeElement.querySelector('#expense-amount').value).toBe('12,34');
    expect(fixture.nativeElement.querySelector('.expense-cards')).toBeNull();
    submit(fixture); http.expectNone('/api/v2/expenses');
  });
  it.each([
    ["FE-430ee60b2df3bb7e", 'network'],
    ["FE-8c70bd7be759c620", 'server'],
    ["FE-17945a60ce564c98", 'missing'],
    ["FE-c1dcf7a9c845b449", 'id'],
    ["FE-f896d21b15007652", 'date'],
    ["FE-cd0a4955498abd9e", 'name'],
    ["FE-497dd84891379b27", 'amount'],
    ["FE-37a634c768613c37", 'invalid-date'],
    ["FE-ce629af28bb166a2", 'fraction'],
    ["FE-68a1eb5fc75d0320", 'wrong-status'],
    ["FE-bc7eb34895dd28d7", 'extra-field']
  ] as const)('%s retains draft and history for rejected expense edit response %s', async (_id, mode) => {
    ([...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[]).find(button => button.textContent?.includes('Ausgaben aktualisieren'))!.click();
    http.expectOne('/api/v2/expenses').flush([row]); await settle(fixture);
    fixture.nativeElement.querySelector('[aria-label="Berlin-Fahrt bearbeiten"]').click(); await settle(fixture);
    input(fixture, 'expense-edit-name', 'Korrektur'); input(fixture, 'expense-edit-amount', '2,34'); submit(fixture, '.expense-editor');
    const request = http.expectOne('/api/v2/expenses/' + row.id);
    expect(request.request.method).toBe('PUT'); expect(request.request.body).toEqual({ name: 'Korrektur', amountCents: 234 });
    if (mode === 'network') request.error(new ProgressEvent('error'));
    else request.flush(mode === 'server' || mode === 'missing' ? {} : { id: mode === 'id' ? '22222222-2222-4222-8222-222222222222' : row.id, name: mode === 'name' ? 'Fremder Name' : 'Korrektur', amountCents: mode === 'amount' ? 235 : mode === 'fraction' ? 234.5 : 234, recordedOn: mode === 'date' ? '2000-01-01' : mode === 'invalid-date' ? '2026-02-30' : row.recordedOn, ...(mode === 'extra-field' ? { unexpected: true } : {}) }, { status: mode === 'server' ? 500 : mode === 'missing' ? 404 : mode === 'wrong-status' ? 201 : 200, statusText: 'Controlled response' });
    await settle(fixture);
    expect(fixture.nativeElement.querySelector('#expense-status').textContent).toContain(mode === 'missing' ? 'nicht gefunden' : 'nicht bestätigt');
    expect(fixture.nativeElement.querySelector('#expense-edit-name').value).toBe('Korrektur');
    expect(fixture.nativeElement.querySelector('#expense-edit-amount').value).toBe('2,34');
    expect(fixture.nativeElement.querySelector('.expense-cards').textContent).toContain('Berlin-Fahrt');
    expect(fixture.nativeElement.querySelector('.expense-cards').textContent).toContain('12,34\u00a0€');
  });
  it.each([
    ["FE-d6ffa7e338459f14", 'network'],
    ["FE-77e2499cb142ac45", 'server'],
    ["FE-425b222b286c1204", 'missing'],
    ["FE-143f79293e8d5f21", 'wrong-status']
  ] as const)('%s retains history on rejected expense deletion %s', async (_id, mode) => {
    ([...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[]).find(button => button.textContent?.includes('Ausgaben aktualisieren'))!.click();
    http.expectOne('/api/v2/expenses').flush([row]); await settle(fixture);
    fixture.nativeElement.querySelector('[aria-label="Berlin-Fahrt löschen"]').click();
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve())); await settle(fixture);
    ([...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[]).find(button => button.textContent?.includes('Endgültig löschen'))!.click();
    const request = http.expectOne('/api/v2/expenses/' + row.id);
    expect(request.request.method).toBe('DELETE'); expect(request.request.body).toBeNull();
    if (mode === 'network') request.error(new ProgressEvent('error'));
    else request.flush({}, { status: mode === 'server' ? 500 : mode === 'missing' ? 404 : 200, statusText: 'Controlled response' });
    await settle(fixture);
    expect(fixture.nativeElement.querySelector('#expense-delete-status').textContent).toContain(mode === 'missing' ? 'nicht gefunden' : 'nicht bestätigt');
    expect(fixture.nativeElement.querySelector('dialog').open).toBe(true);
    expect(fixture.nativeElement.querySelector('.expense-cards').textContent).toContain('Berlin-Fahrt');
  });
  it.each([
    ["FE-0ef24908f50702a3", 'partial'],
    ["FE-4367f1b1dfd35574", 'extra-field']
  ] as const)('%s keeps uncertain expense writes locked after malformed review %s', async (_id, mode) => {
    input(fixture, 'expense-name', 'Erhaltener Entwurf'); input(fixture, 'expense-amount', '2,34'); submit(fixture);
    http.expectOne('/api/v2/expenses').error(new ProgressEvent('error')); await settle(fixture);
    const button = (text: string) => ([...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[]).find(b => b.textContent?.trim() === text)!;
    button('Historie zur Prüfung laden').click(); http.expectOne('/api/v2/expenses').flush([{ ...row, name: 'Ungeprüft', ...(mode === 'extra-field' ? { unexpected: true } : {}) }], { status: mode === 'partial' ? 206 : 200, statusText: 'Controlled response' }); await settle(fixture);
    expect(button('Ich habe die Historie geprüft').disabled).toBe(true); expect(fixture.nativeElement.querySelector('[type=submit]').disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('#expense-name').value).toBe('Erhaltener Entwurf'); expect(fixture.nativeElement.querySelector('#expense-amount').value).toBe('2,34');
    expect(fixture.nativeElement.textContent).not.toContain('Ungeprüft');
  });
});
