import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticate, cleanup, configure, settle } from '../../testing/component-harness';
import { MonthSummary } from './month-summary';

describe('Month summary template', () => {
  let fixture: ComponentFixture<MonthSummary>, http: HttpTestingController;
  beforeEach(async () => { configure(); await authenticate(); http = TestBed.inject(HttpTestingController); fixture = TestBed.createComponent(MonthSummary); fixture.detectChanges(); });
  afterEach(cleanup);
  it.each([
    [null, 100, null, 'Noch nicht festgelegt'],
    [0, 0, 0, 'Restbudget'],
    [0, 100, -100, 'Budget überschritten'],
    [9007199254740991, 0, 9007199254740991, '90.071.992.547.409,91'],
  ] as const)('distinguishes budget %s and remainder %s', async (budgetCents, expensesCents, remainingCents, text) => {
    http.expectOne('/api/v2/month-summary').flush({ month: '2026-03-01', budgetCents, expensesCents, remainingCents }, { headers: { Date: 'Sun, 01 Mar 2026 12:00:00 GMT' } }); await settle(fixture);
    expect(fixture.nativeElement.textContent).toContain(text);
    expect(fixture.nativeElement.textContent).toContain('März 2026');
  });
  it('rejects inconsistent totals and offers retry', async () => {
    http.expectOne('/api/v2/month-summary').flush({ month: '2026-03-01', budgetCents: 100, expensesCents: 200, remainingCents: 100 }, { headers: { Date: 'Sun, 01 Mar 2026 12:00:00 GMT' } }); await settle(fixture);
    expect(fixture.nativeElement.textContent).toContain('konnte nicht geladen');
    fixture.nativeElement.querySelector('button').click();
    http.expectOne('/api/v2/month-summary').flush({ month: '2026-03-01', budgetCents: 100, expensesCents: 200, remainingCents: -100 }, { headers: { Date: 'Sun, 01 Mar 2026 12:00:00 GMT' } }); await settle(fixture);
    expect(fixture.nativeElement.textContent).toContain('−1,00\u00a0€');
  });
  it('discards a late older revision', async () => {
    const old = http.expectOne('/api/v2/month-summary');
    fixture.componentRef.setInput('revision', 1); fixture.detectChanges();
    http.expectOne('/api/v2/month-summary').flush({ month: '2026-03-01', budgetCents: 200, expensesCents: 0, remainingCents: 200 }, { headers: { Date: 'Sun, 01 Mar 2026 12:00:00 GMT' } }); await settle(fixture);
    old.flush({ month: '2026-03-01', budgetCents: 100, expensesCents: 0, remainingCents: 100 }, { headers: { Date: 'Sun, 01 Mar 2026 12:00:00 GMT' } }); await settle(fixture);
    expect(fixture.nativeElement.querySelector('.summary-money').textContent).toBe('2,00\u00a0€');
  });
  it.each([
    ["FE-9113247496b60d50", null],
    ["FE-367c9171c962500a", {}],
    ["FE-a72dd1dfceb04480", { ...{ month: '2026-10-01', budgetCents: 10000, expensesCents: 1234, remainingCents: 8766 }, month: '2026-13-01' }],
    ["FE-0b0cce363c811763", { ...{ month: '2026-10-01', budgetCents: 10000, expensesCents: 1234, remainingCents: 8766 }, month: '2026-10-02' }],
    ["FE-de6431aec57bf086", { ...{ month: '2026-10-01', budgetCents: 10000, expensesCents: 1234, remainingCents: 8766 }, remainingCents: 1 }],
    ["FE-4c306961ea6bdc08", { ...{ month: '2026-10-01', budgetCents: 10000, expensesCents: 1234, remainingCents: 8766 }, budgetCents: null }],
    ["FE-335ec21a78c3af4c", { ...{ month: '2026-10-01', budgetCents: 10000, expensesCents: 1234, remainingCents: 8766 }, expensesCents: -1 }],
    ["FE-aeb5e091805ab33d", { ...{ month: '2026-10-01', budgetCents: 10000, expensesCents: 1234, remainingCents: 8766 }, expensesCents: 9007199254740992 }],
    ["FE-55848d86e10e7eaa", { ...{ month: '2026-10-01', budgetCents: 10000, expensesCents: 1234, remainingCents: 8766 }, budgetCents: '10000' }],
    ["FE-bdf5e283eefcc853", { ...{ month: '2026-10-01', budgetCents: 10000, expensesCents: 1234, remainingCents: 8766 }, extra: true }]
  ] as const)('%s refuses malformed summary values without displaying money', async (_id, value) => {
    const confirmed = { month: '2026-10-01', budgetCents: 10000, expensesCents: 1234, remainingCents: 8766 };
    const headers = { Date: 'Sun, 15 Nov 2026 12:00:00 GMT' };
    http.expectOne('/api/v2/month-summary').flush(confirmed, { headers }); await settle(fixture);
    expect(fixture.nativeElement.querySelector('.summary-money').textContent).toBe('87,66\u00a0€');
    expect(fixture.nativeElement.querySelector('.summary-details')).not.toBeNull();
    fixture.nativeElement.querySelector('button').click();
    http.expectOne('/api/v2/month-summary').flush(value, { headers }); await settle(fixture);
    expect(fixture.nativeElement.querySelector('.summary-money')).toBeNull();
    expect(fixture.nativeElement.querySelector('.summary-details')).toBeNull();
    expect(fixture.nativeElement.querySelector('#summary-status').textContent).toContain('konnte nicht geladen');
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(false);
  });
  it.each([
    ["FE-ea55d98ed47057a0", [10000, 0, 10000, '100,00 €']],
    ["FE-289a1ee88fbcf285", [0, 0, 0, '0,00 €']],
    ["FE-8a99606d556504c4", [0, 9007199254740991, -9007199254740991, '−90.071.992.547.409,91 €']],
    ["FE-5020de80520b864d", [9007199254740991, 9007199254740990, 1, '0,01 €']]
  ] as const)('%s renders exact summary totals', async (_id, [budgetCents, expensesCents, remainingCents, money]) => {
    http.expectOne('/api/v2/month-summary').flush({ month: '2026-11-01', budgetCents, expensesCents, remainingCents }, { headers: { Date: 'Sun, 15 Nov 2026 12:00:00 GMT' } }); await settle(fixture);
    expect(fixture.nativeElement.querySelector('.summary-money').textContent).toBe(money);
  });
  it.each([
    ['FE-3314ceb0a45f8bc8', 'focus'], ['FE-482fa274bc122ff9', 'visibilitychange'],
  ] as const)('%s catches a missed server-month boundary once through %s and discards the older response', async (_id, event) => {
    http.expectOne('/api/v2/month-summary').flush({ month: '2026-11-01', budgetCents: 100, expensesCents: 0, remainingCents: 100 }, { headers: { Date: 'Mon, 30 Nov 2026 22:59:59 GMT' } }); await settle(fixture);
    fixture.nativeElement.querySelector('button').click(); const old = http.expectOne('/api/v2/month-summary');
    vi.spyOn(performance, 'now').mockReturnValue(performance.now() + 2001);
    const target = event === 'focus' ? window : document; target.dispatchEvent(new Event(event)); target.dispatchEvent(new Event(event));
    http.expectOne('/api/v2/month-summary').flush({ month: '2026-12-01', budgetCents: 200, expensesCents: 0, remainingCents: 200 }, { headers: { Date: 'Mon, 30 Nov 2026 23:00:01 GMT' } }); await settle(fixture);
    old.flush({ month: '2026-11-01', budgetCents: 100, expensesCents: 0, remainingCents: 100 }, { headers: { Date: 'Mon, 30 Nov 2026 22:59:59 GMT' } }); await settle(fixture);
    expect(fixture.nativeElement.querySelector('.summary-month').textContent).toBe('Dezember 2026'); expect(fixture.nativeElement.querySelector('.summary-money').textContent).toBe('2,00\u00a0€');
    http.expectNone('/api/v2/month-summary');
  });
  it('FE-78f1c4dd1cbdb91c reconnect requests exactly one current server month after an offline boundary', async () => {
    http.expectOne('/api/v2/month-summary').flush({ month: '2026-11-01', budgetCents: 100, expensesCents: 0, remainingCents: 100 }, { headers: { Date: 'Mon, 30 Nov 2026 22:59:59 GMT' } }); await settle(fixture);
    window.dispatchEvent(new Event('offline')); vi.spyOn(performance, 'now').mockReturnValue(performance.now() + 2001); window.dispatchEvent(new Event('focus')); http.expectNone('/api/v2/month-summary');
    window.dispatchEvent(new Event('online')); http.expectOne('/api/v2/month-summary').flush({ month: '2026-12-01', budgetCents: 200, expensesCents: 0, remainingCents: 200 }, { headers: { Date: 'Mon, 30 Nov 2026 23:00:01 GMT' } }); await settle(fixture);
    window.dispatchEvent(new Event('focus')); http.expectNone('/api/v2/month-summary'); expect(fixture.nativeElement.querySelector('.summary-month').textContent).toBe('Dezember 2026');
  });

  it('FE-c332204edabf4ac4 removes stale summary values on network failure and retries without inventing zero', async () => {
    const value = { month: '2026-11-01', budgetCents: 10000, expensesCents: 1234, remainingCents: 8766 };
    http.expectOne('/api/v2/month-summary').flush(value, { headers: { Date: 'Sun, 15 Nov 2026 12:00:00 GMT' } }); await settle(fixture);
    fixture.nativeElement.querySelector('button').click(); await settle(fixture); expect(fixture.nativeElement.querySelector('.summary-money')).toBeNull();
    http.expectOne('/api/v2/month-summary').error(new ProgressEvent('error')); await settle(fixture); expect(fixture.nativeElement.querySelector('.summary-money')).toBeNull();
    fixture.nativeElement.querySelector('button').click(); http.expectOne('/api/v2/month-summary').flush(value, { headers: { Date: 'Sun, 15 Nov 2026 12:00:00 GMT' } }); await settle(fixture);
    expect(fixture.nativeElement.querySelector('.summary-money').textContent).toBe('87,66\u00a0€');
  });

});
