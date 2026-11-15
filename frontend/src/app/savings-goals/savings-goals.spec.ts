import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { authenticate, cleanup, configure, settle } from '../../testing/component-harness';
import { SavingsGoals } from './savings-goals';

describe('Savings goals actual template', () => {
  let fixture: ComponentFixture<SavingsGoals>, http: HttpTestingController;
  beforeEach(async () => {
    configure(); await authenticate(); http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SavingsGoals); fixture.detectChanges();
    http.expectOne('/api/v2/access/me').flush({ userId: 'owner-1' }); await settle();
    http.expectOne('/api/v2/capabilities').flush({ signedProgressAvailable: true, monthlyAutomationAvailable: false });
    http.expectOne('/api/v2/monthly-surplus').flush({}, { status: 503, statusText: 'Unavailable' }); await settle();
  });
  afterEach(cleanup);
  it.each([[-5000, '−50,00', '−50 %', '0'], [15000, '150,00', '150 %', '100']] as const)('displays actual progress %s and clamps only the bar', async (progressCents, amount, percent, bar) => {
    http.expectOne('/api/v2/savings-goals').flush([{ id: '22222222-2222-4222-8222-222222222222', name: 'Berlin-Fahrt', targetAmountCents: 10000, progressCents, targetDate: '2027-03-28' }]); await settle(fixture);
    expect(fixture.nativeElement.textContent).toContain('Berlin-Fahrt');
    expect(fixture.nativeElement.textContent).toContain(amount + '\u00a0€');
    expect(fixture.nativeElement.textContent).toContain(percent);
    expect(fixture.nativeElement.textContent).toContain('28.03.2027');
    expect(fixture.nativeElement.querySelector('[role=progressbar]').getAttribute('aria-valuenow')).toBe(bar);
    expect(fixture.nativeElement.querySelector('[role=progressbar] span').style.width).toBe(bar + '%');
  });
  it('renders an empty list after confirmed fallback and keeps automatic activation unavailable', async () => {
    http.expectOne('/api/v2/savings-goals').flush([]); await settle(fixture);
    expect(fixture.nativeElement.querySelector('#goal-create').textContent).toContain('Sparziel anlegen');
    expect(fixture.nativeElement.querySelectorAll('[role=progressbar]').length).toBe(0);
  });
  it.each([
    ["FE-ffc44d4f6f2dc455", { progressCents: -3000, targetAmountCents: 10000, amount: '−30,00 €', percent: '−30 %', fill: 0 }],
    ["FE-046fd7c4528faf0d", { progressCents: 7000, targetAmountCents: 10000, amount: '70,00 €', percent: '70 %', fill: 70 }],
    ["FE-614bab1b5b1fd34f", { progressCents: 15000, targetAmountCents: 10000, amount: '150,00 €', percent: '150 %', fill: 100 }],
    ["FE-9a7cab381dd10b58", { progressCents: -1, targetAmountCents: 32, amount: '−0,01 €', percent: '−3,13 %', fill: 0 }],
    ["FE-585304240f4423ea", { progressCents: -1, targetAmountCents: 9007199254740991, amount: '−0,01 €', percent: '−0 %', fill: 0 }],
    ["FE-956578875340d1ff", { progressCents: 1, targetAmountCents: 32, amount: '0,01 €', percent: '3,13 %', fill: 3.13 }],
    ["FE-b2ecd244453591a3", { progressCents: -9007199254740991, targetAmountCents: 1, amount: '−90.071.992.547.409,91 €', percent: '−900.719.925.474.099.100 %', fill: 0 }],
    ["FE-544351230d088b72", { progressCents: 9007199254740991, targetAmountCents: 1, amount: '90.071.992.547.409,91 €', percent: '900.719.925.474.099.100 %', fill: 100 }]
  ] as const)('%s displays signed actual amount/percent and only clamps the bar', async (_id, value) => {
    const { amount, percent, fill, ...values } = value;
    http.expectOne('/api/v2/savings-goals').flush([{ id: '22222222-2222-4222-8222-222222222222', name: 'Berlin-Fahrt', targetDate: null, ...values }]); await settle(fixture);
    expect(fixture.nativeElement.querySelector('.savings-cards').textContent).toContain(amount);
    expect(fixture.nativeElement.querySelector('.savings-cards').textContent).toContain(percent);
    expect(fixture.nativeElement.querySelector('[role=progressbar]').getAttribute('aria-valuenow')).toBe(String(fill));
    expect(fixture.nativeElement.querySelector('[role=progressbar] span').style.width).toBe(fill + '%');
  });
  it.each([
    ["FE-55802ac6ccab6e9d", { id: 'invalid', name: 'Ungeprüft', targetAmountCents: 1, progressCents: 0 }],
    ["FE-afc496c1b6c30b21", { id: '00000000-0000-4000-8000-000000000001', name: 'Ungeprüft', targetAmountCents: 1, progressCents: -9007199254740992 }],
    ["FE-ac20289aa09c3655", { id: '00000000-0000-4000-8000-000000000001', name: 'Ungeprüft', targetAmountCents: 1, progressCents: 0, targetDate: '2026-02-29' }]
  ] as const)('%s refuses unvalidated list items and shows no personal data', async (_id, value) => {
    http.expectOne('/api/v2/savings-goals').flush([value]); await settle(fixture);
    expect(fixture.nativeElement.querySelector('.savings-cards')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Ungeprüft');
    expect(fixture.nativeElement.textContent).toContain('nicht geladen');
  });
  it.each([
    ["FE-ab34582e5a5fe4a1", 'partial'],
    ["FE-49d8edf4d1ea7a25", 'extra-field'],
    ["FE-3e01b9fdb3596e37", 'failed'],
    ["FE-59baacf05c1c68e4", 'out-of-range']
  ] as const)('%s keeps uncertain writes locked after unconfirmed review %s', async (_id, mode) => {
    http.expectOne('/api/v2/savings-goals').flush([]); await settle(fixture);
    const field = (id: string) => fixture.nativeElement.querySelector('#' + id) as HTMLInputElement;
    const button = (text: string) => ([...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[]).find(b => b.textContent?.trim() === text)!;
    field('goal-name').value = 'Erhaltener Entwurf'; field('goal-name').dispatchEvent(new Event('input'));
    field('goal-amount').value = '2,34'; field('goal-amount').dispatchEvent(new Event('input'));
    field('goal-date').value = '0001-01-01'; field('goal-date').dispatchEvent(new Event('input'));
    field('goal-name').closest('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    http.expectOne('/api/v2/savings-goals').error(new ProgressEvent('error')); await settle(fixture);
    button('Sparziele zur Prüfung laden').click(); await settle(fixture);
    http.expectOne('/api/v2/savings-goals').flush([{ id: '22222222-2222-4222-8222-222222222222', name: 'Ungeprüft', targetAmountCents: 100, progressCents: mode === 'out-of-range' ? -9007199254740992 : 0, ...(mode === 'extra-field' ? { unexpected: true } : {}) }], { status: mode === 'partial' ? 206 : mode === 'failed' ? 500 : 200, statusText: 'Controlled response' }); await settle(fixture);
    expect(button('Ich habe die Sparziele geprüft').disabled).toBe(true); expect(button('Sparziel speichern').disabled).toBe(true);
    expect(field('goal-name').value).toBe('Erhaltener Entwurf'); expect(field('goal-amount').value).toBe('2,34'); expect(field('goal-date').value).toBe('0001-01-01');
    expect(fixture.nativeElement.textContent).not.toContain('Ungeprüft');
  });
});
