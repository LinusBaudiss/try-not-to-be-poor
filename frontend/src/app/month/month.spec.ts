import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { authenticate, cleanup, configure, input, settle, submit } from '../../testing/component-harness';
import { Month } from './month';

describe('Month budget template', () => {
  let fixture: ComponentFixture<Month>, http: HttpTestingController;
  beforeEach(async () => {
    configure(); await authenticate(); http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Month); fixture.detectChanges();
    http.expectOne('/api/v2/access/me').flush({ userId: 'owner-1' }); await settle();
    http.expectOne('/api/v2/budget').flush({ amountCents: null }); await settle(fixture);
    http.match('/api/v2/month-summary').forEach(request => request.flush({ month: '2026-11-01', budgetCents: null, expensesCents: 0, remainingCents: null }, { headers: { Date: 'Sun, 15 Nov 2026 12:00:00 GMT' } })); await settle(fixture);
  });
  afterEach(cleanup);
  it('distinguishes missing budget from zero and saves zero only after response', async () => {
    expect(fixture.nativeElement.textContent).toContain('Noch kein Monatsbudget festgelegt');
    input(fixture, 'budget-amount', '0'); submit(fixture); submit(fixture);
    const request = http.expectOne('/api/v2/budget'); expect(request.request.body).toEqual({ amountCents: 0 });
    expect(fixture.nativeElement.querySelector('[type=submit]').disabled).toBe(true);
    expect(fixture.nativeElement.textContent).not.toContain('Dein Monatsbudget wurde gespeichert.');
    request.flush({ amountCents: 0 }); await settle(fixture);
    http.match('/api/v2/month-summary').forEach(request => request.flush({ month: '2026-11-01', budgetCents: 0, expensesCents: 0, remainingCents: 0 }, { headers: { Date: 'Sun, 15 Nov 2026 12:00:00 GMT' } })); await settle(fixture);
    expect(fixture.nativeElement.textContent).toContain('Dein Monatsbudget wurde gespeichert.');
    expect(fixture.nativeElement.querySelector('.budget-value').textContent).toContain('0,00\u00a0€');
  });
  it.each(['-1', '0,001', '90071992547409,92'])('rejects invalid budget %s', async value => {
    input(fixture, 'budget-amount', value); submit(fixture); await settle(fixture);
    expect(fixture.nativeElement.querySelector('#budget-amount').getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('#budget-amount').getAttribute('aria-describedby')).toBe('budget-hint budget-error');
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('#budget-amount')); http.expectNone('/api/v2/budget');
  });
  it.each([
    ["FE-0e0aba64b1a682e0", ''],
    ["FE-600fbc683b4dbc3f", '-1'],
    ["FE-f6eb38d5c4b40e85", '1,001'],
    ["FE-46748f7d929549d4", '1.001'],
    ["FE-f3832e6eefbe87c9", '1.000,00'],
    ["FE-4eac843ea19ffd66", '1,000.00'],
    ["FE-75ea145d6cb5b340", '1e2'],
    ["FE-aa24b4dd2897b072", '1 00'],
    ["FE-5bc8051aa244eff8", 'NaN'],
    ["FE-57cce125ee03ee77", '90071992547409,92']
  ] as const)('%s rejects the original budget input %s before HTTP', async (_id, value) => {
    input(fixture, 'budget-amount', value); submit(fixture); await settle(fixture);
    expect(fixture.nativeElement.querySelector('#budget-amount').value).toBe(value);
    expect(fixture.nativeElement.querySelector('#budget-amount').getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('#budget-amount').getAttribute('aria-describedby')).toBe('budget-hint budget-error');
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('#budget-amount')); http.expectNone('/api/v2/budget');
    expect(fixture.nativeElement.textContent).not.toContain('Dein Monatsbudget wurde gespeichert.');
  });
  async function summaryAfterBudget(amountCents: number) {
    await settle(fixture); http.match('/api/v2/month-summary').forEach(request => request.flush({ month: '2026-11-01', budgetCents: amountCents, expensesCents: 0, remainingCents: amountCents }, { headers: { Date: 'Sun, 15 Nov 2026 12:00:00 GMT' } })); await settle(fixture);
  }
  it('FE-2b867da739afec36 preserves a pasted long leading-zero amount without truncation or rounding', async () => {
    const value = '0'.repeat(1000) + '1,23'; input(fixture, 'budget-amount', value); submit(fixture);
    const request = http.expectOne('/api/v2/budget'); expect(request.request.body).toEqual({ amountCents: 123 }); request.flush({ amountCents: 123 }); await summaryAfterBudget(123);
    expect(fixture.nativeElement.querySelector('.budget-value').textContent).toContain('1,23\u00a0€');
  });
  it('FE-7df6efdc2ab6eaf7 editing clears superseded field errors and the old success announcement', async () => {
    input(fixture, 'budget-amount', '12'); submit(fixture); http.expectOne('/api/v2/budget').flush({ fieldErrors: { amountCents: 'Gezielter Fehler' } }, { status: 400, statusText: 'Bad Request' }); await summaryAfterBudget(0);
    expect(fixture.nativeElement.querySelector('#budget-error').textContent).toContain('Gib einen Betrag von 0 bis');
    input(fixture, 'budget-amount', '13'); expect(fixture.nativeElement.querySelector('#budget-error')).toBeNull(); submit(fixture); http.expectOne('/api/v2/budget').flush({ amountCents: 1300 }); await summaryAfterBudget(1300);
    expect(fixture.nativeElement.querySelector('#budget-status').textContent).toContain('wurde gespeichert');
    input(fixture, 'budget-amount', '14'); expect(fixture.nativeElement.querySelector('#budget-status').textContent).not.toContain('wurde gespeichert');
  });
  it('FE-660bf26923dbfb08 keeps the budget draft and confirmed state while mapping API field errors', async () => {
    input(fixture, 'budget-amount', '12,34'); submit(fixture); http.expectOne('/api/v2/budget').flush({ fieldErrors: { amountCents: 'Betrag prüfen' } }, { status: 400, statusText: 'Bad Request' }); await summaryAfterBudget(0);
    expect(fixture.nativeElement.querySelector('#budget-amount').value).toBe('12,34');
    expect(fixture.nativeElement.querySelector('#budget-amount').getAttribute('aria-invalid')).toBe('true'); expect(fixture.nativeElement.querySelector('#budget-error').textContent).toContain('Gib einen Betrag von 0 bis');
    expect(fixture.nativeElement.textContent).not.toContain('wurde gespeichert');
  });
  it('FE-054e4ecc42262e0a keeps an unconfirmed budget draft offline and requires deliberate state review', async () => {
    input(fixture, 'budget-amount', '12,34'); submit(fixture); http.expectOne('/api/v2/budget').error(new ProgressEvent('error')); await summaryAfterBudget(0);
    const button = (label: string) => ([...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[]).find(b => b.textContent?.trim() === label)!;
    expect(fixture.nativeElement.querySelector('#budget-amount').value).toBe('12,34'); expect(button('Budget speichern').disabled).toBe(true); submit(fixture); http.expectNone('/api/v2/budget');
    button('Budget zur Prüfung laden').click(); http.expectOne('/api/v2/budget').flush({ amountCents: 0 }); await summaryAfterBudget(0);
    expect(button('Budget speichern').disabled).toBe(true); button('Ich habe das Budget geprüft').click(); await settle(fixture);
    window.dispatchEvent(new Event('offline')); await settle(fixture); expect(button('Budget speichern').disabled).toBe(true); expect(fixture.nativeElement.querySelector('#budget-amount').value).toBe('12,34');
    window.dispatchEvent(new Event('online')); await settle(fixture); submit(fixture); http.expectOne('/api/v2/budget').flush({}, { status: 500, statusText: 'Failure' }); await summaryAfterBudget(0);
    expect(fixture.nativeElement.querySelector('#budget-amount').value).toBe('12,34'); expect(button('Budget speichern').disabled).toBe(true);
  });

});
