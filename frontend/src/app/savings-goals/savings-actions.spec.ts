import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticate, cleanup, configure, input, settle } from '../../testing/component-harness';
import { MonthlySurplusOverviewResponse } from '../api/v2/model/monthlySurplusOverviewResponse';
import { SavingsGoalResponse } from '../api/v2/model/savingsGoalResponse';
import { SavingsGoals } from './savings-goals';

const goal: SavingsGoalResponse = { id: '22222222-2222-4222-8222-222222222222', name: 'Berlin-Fahrt', targetAmountCents: 10000, progressCents: 2500, targetDate: '2027-03-28' };
const created: SavingsGoalResponse = { id: '33333333-3333-4333-8333-333333333333', name: 'Reserve', targetAmountCents: 12345, progressCents: 0, targetDate: null };
const goalUrl = '/api/v2/savings-goals/' + goal.id;
const overviewUrl = '/api/v2/monthly-surplus';
function overview(changes: Partial<MonthlySurplusOverviewResponse> = {}): MonthlySurplusOverviewResponse {
  return { active: false, activationMonth: null, currentMonth: '2026-11-01', pendingCents: 0, selectedGoalId: null, goals: [goal], ...changes };
}

describe('SavingsGoals actions through real templates and authenticated HTTP', () => {
  let fixture: ComponentFixture<SavingsGoals>, http: HttpTestingController;
  const text = () => fixture.nativeElement.textContent as string;
  const field = (id: string) => fixture.nativeElement.querySelector('#' + id) as HTMLInputElement;
  const button = (label: string) => ([...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[]).find(value => value.textContent?.trim() === label)!;
  function sendForm(inputId: string) {
    field(inputId).closest('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); fixture.detectChanges();
  }
  async function receive(state: MonthlySurplusOverviewResponse) {
    http.expectOne(overviewUrl).flush(state, { headers: { Date: 'Sun, 15 Nov 2026 12:00:00 GMT' } }); await settle(fixture);
  }
  async function open(state = overview()) { await receive(state); }
  async function createDraft() {
    input(fixture, 'goal-name', created.name); input(fixture, 'goal-amount', '123,45'); await settle(fixture);
  }
  function selectDraft() {
    const select = field('monthly-goal'); select.value = goal.id; select.dispatchEvent(new Event('change', { bubbles: true })); fixture.detectChanges();
  }
  beforeEach(async () => {
    configure(); await authenticate(); http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SavingsGoals); fixture.detectChanges();
    http.expectOne('/api/v2/access/me').flush({ userId: 'owner-1' }); await settle();
    http.expectOne('/api/v2/capabilities').flush({ signedProgressAvailable: true, monthlyAutomationAvailable: true });
  });
  afterEach(cleanup);

  it('creates exact cents once and exposes the goal only after confirmation', async () => {
    await open(); await createDraft(); sendForm('goal-name'); sendForm('goal-name');
    const request = http.expectOne('/api/v2/savings-goals');
    expect(request.request.method).toBe('POST'); expect(request.request.body).toEqual({ name: created.name, targetAmountCents: 12345, targetDate: null });
    expect(field('goal-name').readOnly).toBe(true); expect(fixture.nativeElement.querySelector('.savings-cards').textContent).not.toContain('Reserve');
    expect(text()).not.toContain('Dein Sparziel wurde gespeichert.');
    request.flush(created, { status: 201, statusText: 'Created' }); await settle(fixture);
    await receive(overview({ goals: [goal, created] }));
    expect(fixture.nativeElement.querySelector('.savings-cards').textContent).toContain('Reserve'); expect(field('goal-name').value).toBe('');
    expect(text()).toContain('Dein Sparziel wurde gespeichert.');
  });
  it('preserves a new-goal draft on field errors and on lost confirmation', async () => {
    await open(); await createDraft(); window.dispatchEvent(new Event('offline')); await settle(fixture); sendForm('goal-name'); http.expectNone('/api/v2/savings-goals'); window.dispatchEvent(new Event('online')); await receive(overview()); sendForm('goal-name'); sendForm('goal-name');
    http.expectOne('/api/v2/savings-goals').flush({ fieldErrors: { targetAmountCents: 'Betrag prüfen' } }, { status: 400, statusText: 'Bad Request' }); await settle(fixture); await receive(overview());
    expect(field('goal-amount').getAttribute('aria-invalid')).toBe('true'); expect(field('goal-name').value).toBe(created.name);
    input(fixture, 'goal-amount', '123,45'); sendForm('goal-name');
    http.expectOne('/api/v2/savings-goals').error(new ProgressEvent('error')); await settle(fixture);
    expect(text()).toContain('möglicherweise bereits gespeichert'); expect(field('goal-name').value).toBe(created.name);
    sendForm('goal-name'); http.expectNone('/api/v2/savings-goals');
    button('Sparziele zur Prüfung laden').click(); await receive(overview());
    expect(field('goal-name').closest('form')!.querySelector('button')!.disabled).toBe(true);
    button('Ich habe die Sparziele geprüft').click(); fixture.detectChanges();
    expect(field('goal-name').closest('form')!.querySelector('button')!.disabled).toBe(false);
  });
  it('cancels editing without HTTP then preserves progress while editing target and clearing date', async () => {
    await open(); fixture.nativeElement.querySelector('#goal-edit-' + goal.id).click(); await settle(fixture);
    input(fixture, 'goal-edit-name', 'Verworfen'); button('Abbrechen').click(); fixture.detectChanges();
    http.expectNone(goalUrl); expect(fixture.nativeElement.querySelector('#goal-edit-name')).toBeNull();
    expect(fixture.nativeElement.querySelector('.savings-cards').textContent).toContain(goal.name);
    fixture.nativeElement.querySelector('#goal-edit-' + goal.id).click(); await settle(fixture);
    input(fixture, 'goal-edit-name', 'Urlaub'); input(fixture, 'goal-edit-amount', '200'); input(fixture, 'goal-edit-date', '');
    sendForm('goal-edit-name'); sendForm('goal-edit-name'); const request = http.expectOne(goalUrl);
    expect(request.request.body).toEqual({ name: 'Urlaub', targetAmountCents: 20000, targetDate: null });
    expect(text()).not.toContain('wurde geändert.'); expect(field('goal-edit-name').readOnly).toBe(true);
    const updated = { ...goal, name: 'Urlaub', targetAmountCents: 20000, targetDate: null };
    request.flush(updated); await settle(fixture); await receive(overview({ goals: [updated] }));
    expect(fixture.nativeElement.querySelector('#goal-edit-name')).toBeNull();
    expect(fixture.nativeElement.querySelector('.savings-cards').textContent).toContain('25,00\u00a0€'); expect(text()).not.toContain('28.03.2027');
  });
  it('retains target-edit drafts through field errors and blocks unconfirmed edits', async () => {
    await open(); fixture.nativeElement.querySelector('#goal-edit-' + goal.id).click(); await settle(fixture);
    input(fixture, 'goal-edit-name', 'Neuer Entwurf'); sendForm('goal-edit-name');
    http.expectOne(goalUrl).flush({ fieldErrors: { name: 'Name prüfen' } }, { status: 400, statusText: 'Bad Request' }); await settle(fixture); await receive(overview());
    expect(field('goal-edit-name').value).toBe('Neuer Entwurf'); expect(field('goal-edit-name').getAttribute('aria-invalid')).toBe('true');
    input(fixture, 'goal-edit-name', 'Neuer Entwurf'); sendForm('goal-edit-name');
    http.expectOne(goalUrl).flush({}, { status: 503, statusText: 'Unavailable' }); await settle(fixture);
    expect(text()).toContain('Die Änderung wurde nicht bestätigt'); expect(field('goal-edit-name').value).toBe('Neuer Entwurf');
    expect(field('goal-edit-name').closest('form')!.querySelector('button')!.disabled).toBe(true); sendForm('goal-edit-name'); http.expectNone(goalUrl);
  });
  it('cancels progress without sending then replaces its total including negative cents', async () => {
    await open(); fixture.nativeElement.querySelector('#goal-progress-' + goal.id).click(); await settle(fixture);
    input(fixture, 'goal-progress-amount', '99'); button('Abbrechen').click(); fixture.detectChanges(); http.expectNone(goalUrl + '/progress');
    fixture.nativeElement.querySelector('#goal-progress-' + goal.id).click(); await settle(fixture);
    expect(field('goal-progress-amount').value).toBe('25,00'); input(fixture, 'goal-progress-amount', '-50'); sendForm('goal-progress-amount'); sendForm('goal-progress-amount');
    const request = http.expectOne(goalUrl + '/progress'); expect(request.request.body).toEqual({ progressCents: -5000 });
    expect(fixture.nativeElement.querySelector('.savings-cards').textContent).toContain('25,00\u00a0€');
    const updated = { ...goal, progressCents: -5000 }; request.flush(updated); await settle(fixture); await receive(overview({ goals: [updated] }));
    expect(fixture.nativeElement.querySelector('.savings-cards').textContent).toContain('−50,00\u00a0€');
    expect(fixture.nativeElement.querySelector('[role=progressbar]').getAttribute('aria-valuenow')).toBe('0');
  });
  it('keeps an uncertain progress draft blocked until state reload and explicit review', async () => {
    await open(); fixture.nativeElement.querySelector('#goal-progress-' + goal.id).click(); await settle(fixture);
    input(fixture, 'goal-progress-amount', '-50'); sendForm('goal-progress-amount');
    http.expectOne(goalUrl + '/progress').error(new ProgressEvent('error')); await settle(fixture);
    expect(field('goal-progress-amount').value).toBe('-50'); sendForm('goal-progress-amount'); http.expectNone(goalUrl + '/progress');
    button('Sparziele zur Prüfung laden').click(); await receive(overview());
    expect(field('goal-progress-amount').closest('form')!.querySelector('button')!.disabled).toBe(true);
    button('Ich habe die Sparziele geprüft').click(); fixture.detectChanges();
    expect(field('goal-progress-amount').closest('form')!.querySelector('button')!.disabled).toBe(false);
  });
  it('requires delete confirmation, supports cancellation and waits for deletion response', async () => {
    await open(); fixture.nativeElement.querySelector('#goal-delete-' + goal.id).click(); await settle(fixture);
    http.expectNone(goalUrl); button('Abbrechen').click(); fixture.detectChanges(); http.expectNone(goalUrl);
    expect(fixture.nativeElement.querySelector('.savings-cards').textContent).toContain(goal.name);
    fixture.nativeElement.querySelector('#goal-delete-' + goal.id).click(); await settle(fixture);
    button('Endgültig löschen').click(); fixture.detectChanges(); button('Sparziel wird gelöscht …').click();
    const request = http.expectOne(goalUrl); expect(request.request.method).toBe('DELETE');
    expect(fixture.nativeElement.querySelector('.savings-cards').textContent).toContain(goal.name);
    request.flush(null, { status: 204, statusText: 'No Content' }); await settle(fixture); await receive(overview({ goals: [] }));
    expect(text()).toContain('Dein Sparziel wurde gelöscht.'); expect(fixture.nativeElement.querySelector('.savings-cards')).toBeNull();
  });
  it('keeps unconfirmed deletion blocked and preserves the visible goal', async () => {
    await open(); fixture.nativeElement.querySelector('#goal-delete-' + goal.id).click(); await settle(fixture);
    button('Endgültig löschen').click(); http.expectOne(goalUrl).error(new ProgressEvent('error')); await settle(fixture);
    expect(text()).toContain('Die Löschung wurde nicht bestätigt'); expect(button('Endgültig löschen').disabled).toBe(true);
    button('Endgültig löschen').click(); http.expectNone(goalUrl); expect(fixture.nativeElement.querySelector('.savings-cards').textContent).toContain(goal.name);
  });

  it('activates once, confirms only after response, then reconciles the shared overview', async () => {
    await open(); button('Monatsautomatik ausdrücklich aktivieren').click(); fixture.detectChanges(); button('Aktivierung wird gespeichert …').click();
    const request = http.expectOne(overviewUrl + '/activation'); expect(request.request.method).toBe('POST');
    expect(text()).not.toContain('Deine Monatsautomatik wurde aktiviert.'); expect(button('Aktivierung wird gespeichert …').disabled).toBe(true);
    request.flush({ active: true, activationMonth: '2026-11-01' }); await settle(fixture);
    await receive(overview({ active: true, activationMonth: '2026-11-01' }));
    expect(text()).toContain('Deine Monatsautomatik wurde aktiviert.'); expect(text()).toContain('aktiv seit November 2026');
  });
  it('blocks uncertain activation until an explicit shared-state reload', async () => {
    await open(); button('Monatsautomatik ausdrücklich aktivieren').click();
    http.expectOne(overviewUrl + '/activation').error(new ProgressEvent('error')); await settle(fixture);
    expect(text()).toContain('Die Aktivierung wurde nicht bestätigt'); expect(button('Monatsautomatik ausdrücklich aktivieren').disabled).toBe(true);
    button('Monatsautomatik ausdrücklich aktivieren').click(); http.expectNone(overviewUrl + '/activation');
    button('Aktivierungszustand laden').click(); await receive(overview());
    expect(button('Monatsautomatik ausdrücklich aktivieren').disabled).toBe(false);
  });
  it('shows a rejected activation without confirming it or blindly repeating it', async () => {
    await open(); button('Monatsautomatik ausdrücklich aktivieren').click();
    http.expectOne(overviewUrl + '/activation').flush({ code: 'FEATURE_NOT_AVAILABLE' }, { status: 409, statusText: 'Conflict' }); await settle(fixture);
    http.expectOne('/api/v2/capabilities').flush({ signedProgressAvailable: true, monthlyAutomationAvailable: false }); await receive(overview());
    expect(text()).toContain('Die Aktivierung wurde nicht gespeichert.'); expect(text()).not.toContain('Deine Monatsautomatik wurde aktiviert.');
    http.expectNone(overviewUrl + '/activation');
  });
  it('commits target selection and all pending cents together after one confirmed response', async () => {
    const before = overview({ active: true, activationMonth: '2026-11-01', pendingCents: 3500 }); await open(before); selectDraft(); window.dispatchEvent(new Event('offline')); await settle(fixture); sendForm('monthly-goal'); http.expectNone(overviewUrl + '/selection'); window.dispatchEvent(new Event('online')); await receive(before); sendForm('monthly-goal'); sendForm('monthly-goal'); await settle(fixture);
    const request = http.expectOne(overviewUrl + '/selection'); expect(request.request.body).toEqual({ goalId: goal.id });
    expect(text()).toContain('Vorgemerkt: 35,00\u00a0€'); expect(text()).toContain('Kein Ziel ausgewählt'); expect(field('monthly-goal').disabled).toBe(true);
    const after = { ...before, pendingCents: 0, selectedGoalId: goal.id, goals: [{ ...goal, progressCents: 6000 }] };
    request.flush(after); await settle(fixture);
    expect(text()).toContain('Gespeicherte Auswahl: Berlin-Fahrt'); expect(text()).toContain('Vorgemerkt: 0,00\u00a0€');
    expect(fixture.nativeElement.querySelector('.savings-cards').textContent).toContain('60,00\u00a0€'); expect(text()).toContain('gemeinsam gespeichert');
  });
  it('preserves confirmed totals and the selection draft after a field/domain rejection', async () => {
    await open(overview({ active: true, activationMonth: '2026-11-01', pendingCents: 3500 })); selectDraft(); sendForm('monthly-goal');
    http.expectOne(overviewUrl + '/selection').flush({ code: 'AMOUNT_LIMIT_EXCEEDED' }, { status: 409, statusText: 'Conflict' }); await settle(fixture);
    expect(text()).toContain('Die Auswahl wurde nicht gespeichert'); expect(text()).toContain('Vorgemerkt: 35,00\u00a0€');
    expect(fixture.nativeElement.querySelector('#saved-selection').textContent).toContain('Kein Ziel ausgewählt'); expect(field('monthly-goal').value).toBe(goal.id);
  });
  it('keeps an uncertain selection blocked until the shared overview is reconciled', async () => {
    const before = overview({ active: true, activationMonth: '2026-11-01', pendingCents: 3500 }); await open(before); selectDraft(); sendForm('monthly-goal');
    http.expectOne(overviewUrl + '/selection').error(new ProgressEvent('error')); await settle(fixture);
    expect(text()).toContain('Speicherung noch nicht bestätigt'); expect(field('monthly-goal').value).toBe(goal.id);
    sendForm('monthly-goal'); http.expectNone(overviewUrl + '/selection');
    expect(text()).toContain('Speicherung noch nicht bestätigt');
    button('Vormerkung aktualisieren').click(); await receive(before);
    expect(field('monthly-goal').closest('form')!.querySelector('button')!.disabled).toBe(false); expect(text()).toContain('Vorgemerkt: 35,00\u00a0€');
  });
  it.each([
    ["FE-c6669c4ab4dcee58", '   '],
    ["FE-59f0607ed8b2d052", 'Rei\0se'],
    ["FE-b0b12380ee5da553", '']
  ] as const)('%s refuses invalid name without sending a goal mutation', async (_id, value) => {
    await open(); await createDraft(); input(fixture, 'goal-name', value); sendForm('goal-name'); await settle(fixture);
    expect(field('goal-name').value).toBe(value);
    expect(field('goal-name').getAttribute('aria-invalid')).toBe('true'); http.expectNone('/api/v2/savings-goals');
    expect(text()).not.toContain('Dein Sparziel wurde gespeichert.');
  });
  it.each([
    ["FE-6600976d7041b1e0", ''],
    ["FE-08472aba7d512f02", '0'],
    ["FE-0a02d41e7cc6837f", '-1'],
    ["FE-1495000f80734a6c", '1,001'],
    ["FE-8398c5d25da36835", '1.001'],
    ["FE-9d169323029c1fe5", '1e2'],
    ["FE-1bf80b47e8bf9235", '1.000,00'],
    ["FE-dc3ace8cd8cc4a12", '90071992547409,92']
  ] as const)('%s refuses invalid amount without sending a goal mutation', async (_id, value) => {
    await open(); await createDraft(); input(fixture, 'goal-amount', value); sendForm('goal-name'); await settle(fixture);
    expect(field('goal-amount').value).toBe(value);
    expect(field('goal-amount').getAttribute('aria-invalid')).toBe('true'); http.expectNone('/api/v2/savings-goals');
    expect(text()).not.toContain('Dein Sparziel wurde gespeichert.');
  });
  it.each([
    ["FE-d92b32c20e5e02c5", '2026-02-29'],
    ["FE-88d42aa8812e9a71", '1900-02-29'],
    ["FE-f2158e32ab761166", '2028-02-30'],
    ["FE-0488a483f52fb299", '2026-04-31'],
    ["FE-015b045920d1093a", '2026-1-01'],
    ["FE-b6de6cdd2164535b", '0000-01-01'],
    ["FE-b60923a297cd84f0", '2026-01-01T00:00:00Z'],
    ["FE-c151501521b5cdd1", '2028-02-29T00:00:00Z']
  ] as const)('%s refuses invalid date without sending a goal mutation', async (_id, value) => {
    await open(); await createDraft(); input(fixture, 'goal-date', value); sendForm('goal-name'); await settle(fixture);
    expect(field('goal-date').value).toBe(value);
    expect(field('goal-date').getAttribute('aria-invalid')).toBe('true'); http.expectNone('/api/v2/savings-goals');
    expect(text()).not.toContain('Dein Sparziel wurde gespeichert.');
  });
  it.each([
    ["FE-c7dc324b57eb8243", { status: 404, json: {} }],
    ["FE-fd035163f858598f", { status: 500, json: {} }],
    ["FE-785b96c442518ad2", { status: 200, json: { ...goal, name: 'Falsch' } }],
    ["FE-caaf53937d80077f", { status: 200, json: { ...goal, name: 'Korrigiert', id: '44444444-4444-4444-8444-444444444444' } }],
    ["FE-44756bddc98c03ba", { status: 200, json: { ...goal, name: 'Korrigiert', targetAmountCents: 1 } }],
    ["FE-2359e973e5276e76", { status: 200, json: { ...goal, name: 'Korrigiert', targetDate: null } }],
    ["FE-1c9cfba34d5c2874", { status: 204, body: '' }]
  ] as const)('%s refuses an unconfirmed goal edit and preserves its draft', async (_id, result) => {
    await open(); fixture.nativeElement.querySelector('#goal-edit-' + goal.id).click(); await settle(fixture);
    input(fixture, 'goal-edit-name', 'Korrigiert'); sendForm('goal-edit-name');
    http.expectOne(goalUrl).flush('json' in result ? result.json : null, { status: result.status, statusText: 'Controlled response' }); await settle(fixture);
    expect(field('goal-edit-name').value).toBe('Korrigiert');
    expect(fixture.nativeElement.querySelector('#goal-mutation-status').classList.contains('success')).toBe(false);
    expect(field('goal-edit-name').closest('form')!.querySelector('button')!.disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('.savings-cards').textContent).toContain(goal.name);
  });
  it.each([
    ["FE-539dc69c5cd96703", { status: 404, json: {} }],
    ["FE-99381492bb41d90b", { status: 500, json: {} }],
    ["FE-1e4b6420224f510e", { status: 200, body: '' }],
    ["FE-f87c1729a71b164f", { status: 200, json: { deleted: true } }]
  ] as const)('%s refuses an unconfirmed goal deletion and preserves the goal', async (_id, result) => {
    await open(); fixture.nativeElement.querySelector('#goal-delete-' + goal.id).click(); await settle(fixture); button('Endgültig löschen').click();
    http.expectOne(goalUrl).flush('json' in result ? result.json : null, { status: result.status, statusText: 'Controlled response' }); await settle(fixture);
    expect(fixture.nativeElement.querySelector('.savings-cards').textContent).toContain(goal.name);
    expect(fixture.nativeElement.querySelector('#goal-delete-status').classList.contains('success')).toBe(false);
  });
  it.each([
    ["FE-0a38eb716e400611", { status: 201, json: { ...goal, progressCents: 3000 } }],
    ["FE-87fb1fc66861511a", { status: 200, json: { ...goal, id: '44444444-4444-4444-8444-444444444444', progressCents: 3000 } }],
    ["FE-7fe26e4a63ff18db", { status: 200, json: { ...goal, progressCents: 2999 } }],
    ["FE-b5b68936fa9a164c", { status: 200, json: { ...goal, progressCents: '3000' } }],
    ["FE-a1dec26d3a0026d8", { status: 200, json: { ...goal, progressCents: 3000, targetAmountCents: 0 } }],
    ["FE-d2dec6100eeae9d9", { status: 200, json: { ...goal, progressCents: 3000, targetDate: '2026-02-29' } }],
    ["FE-9cc14634e838a2ef", { status: 404, json: { code: 'SAVINGS_GOAL_NOT_FOUND' } }],
    ["FE-edcd2689c8ce75de", { status: 500, json: { code: 'SAVINGS_GOAL_UNAVAILABLE' } }]
  ] as const)('%s refuses an unconfirmed total-progress replacement', async (_id, result) => {
    await open(); fixture.nativeElement.querySelector('#goal-progress-' + goal.id).click(); await settle(fixture);
    input(fixture, 'goal-progress-amount', '30'); sendForm('goal-progress-amount');
    http.expectOne(goalUrl + '/progress').flush(result.json, { status: result.status, statusText: 'Controlled response' }); await settle(fixture);
    expect(field('goal-progress-amount').value).toBe('30');
    expect(fixture.nativeElement.querySelector('#goal-progress-status').classList.contains('success')).toBe(false);
    expect(fixture.nativeElement.querySelector('.savings-cards').textContent).toContain('25,00\u00a0€');
    sendForm('goal-progress-amount'); http.expectNone(goalUrl + '/progress');
  });
  it.each([
    ["FE-1af019dd611b3f09", { progressCents: 1 }],
    ["FE-7cd19791ed36549d", { name: 'Anderes Ziel' }],
    ["FE-00a0b4a8647595ad", { targetAmountCents: 116 }],
    ["FE-fff2cacddd5d58fd", { targetDate: '2028-03-01' }]
  ] as const)('%s refuses a mismatching creation confirmation and keeps every draft field', async (_id, changes) => {
    await open(); input(fixture, 'goal-name', 'Reise'); input(fixture, 'goal-amount', '1,15'); input(fixture, 'goal-date', '2028-02-29'); sendForm('goal-name');
    http.expectOne('/api/v2/savings-goals').flush({ ...created, name: 'Reise', targetAmountCents: 115, targetDate: '2028-02-29', ...changes }, { status: 201, statusText: 'Created' }); await settle(fixture);
    expect(field('goal-name').value).toBe('Reise'); expect(field('goal-amount').value).toBe('1,15'); expect(field('goal-date').value).toBe('2028-02-29');
    expect(fixture.nativeElement.querySelector('#goal-status').textContent).toContain('nicht bestätigt');
    expect(fixture.nativeElement.querySelector('.savings-cards').textContent).not.toContain('Reise');
  });
  it.each([
    ["FE-12cc329a1111d2d7", {"active":false,"activationMonth":null}],
    ["FE-1c1ad3964f4aada3", {}],
    ["FE-fdccb25f773c2a4e", {"active":true}],
    ["FE-7753c81d65bd0bda", {"active":false,"activationMonth":"2026-10-01"}],
    ["FE-b827b6aafd5c11a9", {"active":true,"activationMonth":null}],
    ["FE-21bd8a98b7b41ded", {"active":"true","activationMonth":"2026-10-01"}],
    ["FE-ead4fe0c9fb41a97", {"active":true,"activationMonth":"2026-10-02"}],
    ["FE-ddd6adae25cf869e", {"active":true,"activationMonth":"2026-10-01","diagnostic":"fremd"}]
  ] as const)('%s rejects malformed activation without confirmation or blind retry', async (_id, response) => {
    await open(); button('Monatsautomatik ausdrücklich aktivieren').click();
    http.expectOne(overviewUrl + '/activation').flush(response); await settle(fixture);
    expect(text()).not.toContain('Deine Monatsautomatik wurde aktiviert.');
    expect(button('Monatsautomatik ausdrücklich aktivieren').disabled).toBe(true);
    button('Monatsautomatik ausdrücklich aktivieren').click(); http.expectNone(overviewUrl + '/activation');
  });
  it.each([
    ["FE-4a49205a56832aa2", '0'],
    ["FE-86c0790334c35c9f", '90071992547409,91'],
    ["FE-fdba3b3c50fef837", '0,01']
  ] as const)('%s replaces total progress with exact accepted cents', async (_id, value) => {
    await open(); fixture.nativeElement.querySelector('#goal-progress-' + goal.id).click(); await settle(fixture);
    input(fixture, 'goal-progress-amount', value); sendForm('goal-progress-amount');
    const expected = value === '0' ? 0 : value === '0,01' ? 1 : 9007199254740991;
    const request = http.expectOne(goalUrl + '/progress'); expect(request.request.body).toEqual({ progressCents: expected });
    const updated = { ...goal, progressCents: expected }; request.flush(updated); await settle(fixture); await receive(overview({ goals: [updated] }));
    expect(fixture.nativeElement.querySelector('#goal-progress-amount')).toBeNull();
    expect(fixture.nativeElement.querySelector('#goal-progress-status').textContent).toContain('gespeichert');
    // Reconstruct a new view exclusively from fresh authenticated GET responses.
    // Real persistence/commit remains the retained browser/backend boundary.
    fixture.destroy(); fixture = TestBed.createComponent(SavingsGoals); fixture.detectChanges();
    http.expectOne('/api/v2/access/me').flush({ userId: 'owner-1' }); await settle();
    http.expectOne('/api/v2/capabilities').flush({ signedProgressAvailable: true, monthlyAutomationAvailable: true });
    await receive(overview({ goals: [updated] }));
    const formatted = value === '0' ? '0,00\u00a0€' : value === '0,01' ? '0,01\u00a0€' : '90.071.992.547.409,91\u00a0€';
    expect(fixture.nativeElement.querySelector('.savings-cards').textContent).toContain(formatted);
  });
  it.each([
    ["FE-f209289494014074", ''],
    ["FE-ae592d9c6e1fec19", '-1'],
    ["FE-1179884ddeb58e84", '1,001'],
    ["FE-c91c4ca018fcbb63", '1.001'],
    ["FE-a0213c4d7b10d7f6", '1e2'],
    ["FE-d07752fed1ab679a", '1.000,00'],
    ["FE-5e466e18e2e6b732", '90071992547409,92']
  ] as const)('%s validates original unsigned progress while capability is closed', async (_id, value) => {
    await open(); button('Fortschrittseingabe erneut prüfen').click();
    http.expectOne('/api/v2/capabilities').flush({ signedProgressAvailable: false, monthlyAutomationAvailable: true }); await settle(fixture);
    fixture.nativeElement.querySelector('#goal-progress-' + goal.id).click(); await settle(fixture);
    input(fixture, 'goal-progress-amount', value); sendForm('goal-progress-amount'); await settle(fixture);
    expect(field('goal-progress-amount').value).toBe(value); expect(field('goal-progress-amount').getAttribute('aria-invalid')).toBe('true');
    http.expectNone(goalUrl + '/progress');
  });
  it.each([
    ["FE-29417d73a413a51d", undefined],
    ["FE-4f7d10afaf0b8955", 'true'],
    ["FE-3f4a29f95d294e82", 1],
    ["FE-06a9096fda766408", null]
  ] as const)('%s keeps invalid monthly capability closed and retryable', async (_id, value) => {
    await open(); button('Verfügbarkeit der Monatsautomatik prüfen').click();
    http.expectOne('/api/v2/capabilities').flush({ signedProgressAvailable: true, monthlyAutomationAvailable: value }); await settle(fixture);
    expect([...fixture.nativeElement.querySelectorAll('button')].some((b: any) => b.textContent.trim() === 'Monatsautomatik ausdrücklich aktivieren')).toBe(false);
    expect(button('Verfügbarkeit der Monatsautomatik prüfen').getAttribute('aria-disabled')).toBe('false');
    http.expectNone(overviewUrl + '/activation');
  });
  it.each([
    ["FE-3a3327f22b1f1f45", null],
    ["FE-f30f2390b86e4e6d", {}],
    ["FE-d0f45d306c3fde4a", { signedProgressAvailable: 'true' }],
    ["FE-edb206cfaa06bb3d", { signedProgressAvailable: true, diagnostic: 'fremd' }]
  ] as const)('%s keeps malformed signed capability closed and retryable', async (_id, value) => {
    await open(); button('Fortschrittseingabe erneut prüfen').click();
    http.expectOne('/api/v2/capabilities').flush(value); await settle(fixture);
    expect(text()).toContain('Fortschrittseingabe erneut prüfen');
    fixture.nativeElement.querySelector('#goal-progress-' + goal.id).click(); await settle(fixture);
    input(fixture, 'goal-progress-amount', '-1'); sendForm('goal-progress-amount'); await settle(fixture);
    http.expectNone(goalUrl + '/progress'); expect(field('goal-progress-amount').getAttribute('aria-invalid')).toBe('true');
  });
  it.each([
    ['FE-46dee2a5f42ccbc2', -1], ['FE-1834a4fccec7fa58', 9007199254740992], ['FE-4493345b28af9f98', 0.1],
    ['FE-c35235334f28be41', '30000'], ['FE-a4109d96a6acd3a2', null], ['FE-daa6181a7d4faca4', undefined],
  ] as const)('%s refuses an unconfirmed common pending total', async (_id, pendingCents) => {
    const state: any = overview({ active: true, activationMonth: '2026-11-01' });
    if (pendingCents === undefined) delete state.pendingCents; else state.pendingCents = pendingCents;
    await receive(state); http.expectOne('/api/v2/savings-goals').flush([goal]); await settle(fixture);
    expect(fixture.nativeElement.querySelector('#pending-state').textContent).toContain('konnte nicht geladen');
    expect(fixture.nativeElement.querySelector('#pending-state').textContent).not.toContain('Vorgemerkt:');
    expect(fixture.nativeElement.querySelector('.savings-cards').textContent).toContain(goal.name);
  });
  it.each([
    ['FE-aab602d6cca42e7e', 'pendingCents', -1], ['FE-8dca926901171550', 'selectedGoalId', '44444444-4444-4444-8444-444444444444'],
    ['FE-69ee36df5862b54e', 'currentMonth', '2026-12-02'], ['FE-2e538abb393b2d67', 'goals', [{ id: 'fremd' }]],
  ] as const)('%s refuses an invalid common field while retaining independent manual access', async (_id, key, value) => {
    await receive({ ...overview({ active: true, activationMonth: '2026-11-01' }), [key]: value } as any);
    http.expectOne('/api/v2/savings-goals').flush([goal]); await settle(fixture);
    expect(fixture.nativeElement.querySelector('#automation-state').textContent).toContain('konnte nicht geladen');
    expect(fixture.nativeElement.querySelector('#pending-state').textContent).not.toContain('Vorgemerkt:');
    expect(fixture.nativeElement.querySelector('.savings-cards').textContent).toContain('25,00\u00a0€');
  });
  it('FE-c7a99a8bf5e390cb distinguishes confirmed pending zero from failed loading and retries', async () => {
    await open(overview({ active: true, activationMonth: '2026-11-01' })); expect(text()).toContain('Vorgemerkt: 0,00\u00a0€');
    button('Vormerkung aktualisieren').click(); http.expectOne(overviewUrl).flush({}, { status: 500, statusText: 'Failure' }); await settle(fixture); http.expectOne('/api/v2/savings-goals').flush([goal]); await settle(fixture);
    expect(fixture.nativeElement.querySelector('#pending-state').textContent).toContain('konnte nicht geladen');
    expect(fixture.nativeElement.querySelector('#pending-state').textContent).not.toContain('Vorgemerkt:');
    button('Vormerkung aktualisieren').click(); await receive(overview({ active: true, activationMonth: '2026-11-01' })); expect(text()).toContain('Vorgemerkt: 0,00\u00a0€');
  });
  it.each([
    ["FE-d6bb00660d2098fb", ['name', 'name']],
    ["FE-38f8fa228b1ae7ae", ['targetAmountCents', 'amount']],
    ["FE-eaf6dee6a4c2cf57", ['targetDate', 'date']]
  ] as const)('%s maps the original server field error and keeps its draft', async (_id, [key, local]) => {
    await open(); await createDraft(); input(fixture, 'goal-date', '2028-02-29'); sendForm('goal-name');
    http.expectOne('/api/v2/savings-goals').flush({ fieldErrors: { [key]: 'Gezielter Feldfehler' } }, { status: 400, statusText: 'Bad Request' }); await settle(fixture); await receive(overview());
    expect(field('goal-' + local).getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('#goal-' + local + '-error').textContent).toBe('Gezielter Feldfehler');
    expect(field('goal-name').value).toBe(created.name); expect(field('goal-amount').value).toBe('123,45'); expect(field('goal-date').value).toBe('2028-02-29');
  });
  it.each([
    ['FE-91b23f664fda832b', 'create', '12'], ['FE-e0560c0b720a7ebc', 'target', '12'],
    ['FE-4392f3881fb822d4', 'progress', '12'], ['FE-c711e8d64cb6a094', 'progress', '-12'],
  ] as const)('%s reloads the independent overview after safe manual rejection and keeps its %s draft', async (_id, action, amount) => {
    await open(overview({ active: true, activationMonth: '2026-11-01', pendingCents: 3500 }));
    selectDraft(); let fieldId: string, requestUrl: string;
    if (action === 'create') { await createDraft(); fieldId = 'goal-amount'; requestUrl = '/api/v2/savings-goals'; }
    else if (action === 'target') { fixture.nativeElement.querySelector('#goal-edit-' + goal.id).click(); await settle(fixture); fieldId = 'goal-edit-amount'; requestUrl = goalUrl; }
    else { fixture.nativeElement.querySelector('#goal-progress-' + goal.id).click(); await settle(fixture); fieldId = 'goal-progress-amount'; requestUrl = goalUrl + '/progress'; }
    input(fixture, fieldId, amount); sendForm(fieldId);
    const key = action === 'progress' ? 'progressCents' : 'targetAmountCents';
    http.expectOne(requestUrl).flush({ fieldErrors: { [key]: 'Gezielter Fehler' } }, { status: 400, statusText: 'Bad Request' }); await settle(fixture);
    await receive(overview({ active: true, activationMonth: '2026-11-01', pendingCents: 3600 }));
    expect(field(fieldId).value).toBe(amount); expect(field(fieldId).getAttribute('aria-invalid')).toBe('true');
    expect(field('monthly-goal').value).toBe(goal.id); expect(text()).toContain('Vorgemerkt: 36,00\u00a0€');
    http.expectNone(requestUrl);
  });
  it.each([
    ['FE-9f5a0cf665e3dd13', 'other-goal'], ['FE-0e76349beb9e2b29', 'pending'],
  ] as const)('%s blocks mismatching selection confirmation until successful common reconciliation', async (_id, mismatch) => {
    const second = { ...goal, id: '44444444-4444-4444-8444-444444444444', name: 'Anderes Ziel' };
    const before = overview({ active: true, activationMonth: '2026-11-01', pendingCents: 3500, goals: [goal, second] }); await open(before); selectDraft(); sendForm('monthly-goal');
    http.expectOne(overviewUrl + '/selection').flush({ ...before, selectedGoalId: mismatch === 'other-goal' ? second.id : goal.id, pendingCents: mismatch === 'pending' ? 1 : 0 }); await settle(fixture);
    expect(fixture.nativeElement.querySelector('#selection-result').textContent).toContain('noch nicht bestätigt');
    expect(field('monthly-goal').value).toBe(goal.id); expect(text()).toContain('Vorgemerkt: 35,00\u00a0€'); expect(text()).toContain('Kein Ziel ausgewählt');
    sendForm('monthly-goal'); http.expectNone(overviewUrl + '/selection');
    button('Vormerkung aktualisieren').click(); http.expectOne(overviewUrl).flush({}, { status: 500, statusText: 'Failure' }); await settle(fixture); http.expectOne('/api/v2/savings-goals').flush([goal, second]); await settle(fixture);
    expect(text()).toContain('Speicherung noch nicht bestätigt');
    button('Vormerkung aktualisieren').click(); await receive(before);
    expect(field('monthly-goal').closest('form')!.querySelector('button')!.disabled).toBe(false); expect(field('monthly-goal').value).toBe(goal.id);
    sendForm('monthly-goal'); http.expectOne(overviewUrl + '/selection').flush({ ...before, pendingCents: 0, selectedGoalId: goal.id }); await settle(fixture);
    expect(text()).toContain('gemeinsam gespeichert');
  });
  it('FE-1a0ebc543c139d6e reconnect supersedes the old pending overview and ignores its late response', async () => {
    const old = http.expectOne(overviewUrl);
    window.dispatchEvent(new Event('offline')); window.dispatchEvent(new Event('online')); await settle(fixture);
    await receive(overview({ active: true, activationMonth: '2026-11-01', pendingCents: 3500 }));
    old.flush(overview({ active: true, activationMonth: '2026-11-01', pendingCents: 1 })); await settle(fixture);
    expect(text()).toContain('Vorgemerkt: 35,00\u00a0€'); expect(text()).not.toContain('Vorgemerkt: 0,01\u00a0€');
  });
  it.each([
    ['FE-e3c63e07ca899b82', 'inactive'], ['FE-c649dd5a4e9d21ac', 'not-loaded'],
  ] as const)('%s recognizes activation elsewhere on returning from %s', async (_id, initial) => {
    if (initial === 'inactive') await open();
    else { http.expectOne(overviewUrl).flush({}, { status: 500, statusText: 'Failure' }); await settle(fixture); http.expectOne('/api/v2/savings-goals').flush([goal]); await settle(fixture); }
    window.dispatchEvent(new Event('focus')); await receive(overview({ active: true, activationMonth: '2026-11-01', pendingCents: 3500 }));
    expect(text()).toContain('aktiv seit November 2026'); expect(text()).toContain('Vorgemerkt: 35,00\u00a0€');
    expect([...fixture.nativeElement.querySelectorAll('button')].some((b: any) => b.textContent.trim() === 'Monatsautomatik ausdrücklich aktivieren')).toBe(false);
  });
  it('FE-d7cfadc81f9a277b safe selection failure preserves confirmed values and an independent progress draft', async () => {
    await open(overview({ active: true, activationMonth: '2026-11-01', pendingCents: 3500 }));
    fixture.nativeElement.querySelector('#goal-progress-' + goal.id).click(); await settle(fixture); input(fixture, 'goal-progress-amount', '-30');
    selectDraft(); sendForm('monthly-goal'); http.expectOne(overviewUrl + '/selection').flush({ code: 'AMOUNT_LIMIT_EXCEEDED' }, { status: 409, statusText: 'Conflict' }); await settle(fixture);
    expect(field('goal-progress-amount').value).toBe('-30'); expect(field('monthly-goal').value).toBe(goal.id);
    expect(fixture.nativeElement.querySelector('.savings-cards').textContent).toContain('25,00\u00a0€'); expect(text()).toContain('Vorgemerkt: 35,00\u00a0€'); expect(text()).toContain('Kein Ziel ausgewählt');
    expect(text()).toContain('Die Auswahl wurde nicht gespeichert');
  });
  it('FE-6f30cc1eb992907f confirmed manual progress invalidates an older overview and retains the selection draft', async () => {
    const before = overview({ active: true, activationMonth: '2026-11-01', pendingCents: 3500 }); await open(before); selectDraft();
    fixture.nativeElement.querySelector('#goal-progress-' + goal.id).click(); await settle(fixture); input(fixture, 'goal-progress-amount', '60');
    sendForm('monthly-goal'); const old = http.expectOne(overviewUrl + '/selection'); sendForm('goal-progress-amount');
    const updated = { ...goal, progressCents: 6000 }; http.expectOne(goalUrl + '/progress').flush(updated); await settle(fixture);
    expect(fixture.nativeElement.querySelector('.savings-cards').textContent).toContain('60,00\u00a0€');
    old.flush({ ...before, selectedGoalId: goal.id, pendingCents: 0, goals: [{ ...goal, progressCents: 500 }] }); await settle(fixture);
    expect(fixture.nativeElement.querySelector('.savings-cards').textContent).toContain('60,00\u00a0€');
    expect(fixture.nativeElement.querySelector('.savings-cards').textContent).not.toContain('5,00\u00a0€');
    await receive({ ...before, selectedGoalId: goal.id, pendingCents: 0, goals: [updated] });
    expect(fixture.nativeElement.querySelector('.savings-cards').textContent).toContain('60,00\u00a0€'); expect(field('monthly-goal').value).toBe(goal.id); expect(text()).toContain('Vorgemerkt: 0,00\u00a0€');
  });

  it.each([
    ['FE-04623014002ce111', 'target'], ['FE-506d479e06b52be6', 'delete'], ['FE-76e2574483e740e4', 'progress'],
  ] as const)('%s times out %s after thirty seconds with preserved draft and explicit review requirement', async (_id, action) => {
    await open(); let requestUrl = goalUrl;
    if (action === 'target') { fixture.nativeElement.querySelector('#goal-edit-' + goal.id).click(); await settle(fixture); input(fixture, 'goal-edit-name', 'Zeitentwurf'); }
    else if (action === 'progress') { fixture.nativeElement.querySelector('#goal-progress-' + goal.id).click(); await settle(fixture); input(fixture, 'goal-progress-amount', '60'); requestUrl += '/progress'; }
    else { fixture.nativeElement.querySelector('#goal-delete-' + goal.id).click(); await new Promise<void>(resolve => requestAnimationFrame(() => resolve())); await settle(fixture); }
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
    if (action === 'delete') button('Endgültig löschen').click(); else sendForm(action === 'target' ? 'goal-edit-name' : 'goal-progress-amount');
    const held = http.expectOne(requestUrl); await vi.advanceTimersByTimeAsync(30001); await settle(fixture);
    expect(held.cancelled).toBe(true); expect(fixture.nativeElement.querySelector('.savings-cards').textContent).toContain(goal.name);
    expect(text()).not.toContain('wurde geändert.'); expect(text()).not.toContain('wurde gelöscht.');
    if (action !== 'delete') { const id = action === 'target' ? 'goal-edit-name' : 'goal-progress-amount'; expect(field(id).value).toBe(action === 'target' ? 'Zeitentwurf' : '60'); expect(field(id).closest('form')!.querySelector('button')!.disabled).toBe(true); }
    else expect(button('Endgültig löschen').disabled).toBe(true);
    expect(text()).toContain('nicht bestätigt'); http.expectNone(requestUrl);
  });

  it('FE-aae07c79f4dc66f1 progress field errors retain the draft while offline and global pending prevent every mutation', async () => {
    await open(); fixture.nativeElement.querySelector('#goal-progress-' + goal.id).click(); await settle(fixture); input(fixture, 'goal-progress-amount', '30');
    window.dispatchEvent(new Event('offline')); await settle(fixture); sendForm('goal-progress-amount'); http.expectNone(goalUrl + '/progress');
    expect(field('goal-progress-amount').value).toBe('30'); window.dispatchEvent(new Event('online')); await settle(fixture);
    await receive(overview()); sendForm('goal-progress-amount'); sendForm('goal-progress-amount');
    const request = http.expectOne(goalUrl + '/progress'); expect(field('goal-name').closest('form')!.querySelector('button')!.disabled).toBe(true);
    request.flush({ fieldErrors: { progressCents: 'Fortschritt prüfen' } }, { status: 400, statusText: 'Bad Request' }); await settle(fixture); await receive(overview());
    expect(field('goal-progress-amount').value).toBe('30'); expect(field('goal-progress-amount').getAttribute('aria-invalid')).toBe('true'); expect(text()).toContain('Fortschritt prüfen');
  });
  it('FE-920c02a9ffdeedd7 target and progress drafts mutually lock actions until explicit cancellation', async () => {
    await open(); fixture.nativeElement.querySelector('#goal-edit-' + goal.id).click(); await settle(fixture);
    for (const action of fixture.nativeElement.querySelectorAll('.savings-cards button')) expect((action as HTMLButtonElement).disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('#goal-edit-draft-hint').textContent).toContain('Zielentwurf'); button('Abbrechen').click(); await settle(fixture);
    fixture.nativeElement.querySelector('#goal-progress-' + goal.id).click(); await settle(fixture);
    expect((fixture.nativeElement.querySelector('#goal-edit-' + goal.id) as HTMLButtonElement).disabled).toBe(true);
    expect((fixture.nativeElement.querySelector('#goal-delete-' + goal.id) as HTMLButtonElement).disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('#goal-edit-' + goal.id).getAttribute('aria-describedby')).toBe('goal-progress-draft-hint');
    button('Abbrechen').click(); await settle(fixture); expect((fixture.nativeElement.querySelector('#goal-edit-' + goal.id) as HTMLButtonElement).disabled).toBe(false);
  });
  it('FE-c4a8a2b090f57538 deletion prevents offline sends, duplicates and dialog cancellation while pending', async () => {
    await open(); fixture.nativeElement.querySelector('#goal-delete-' + goal.id).click(); await new Promise<void>(resolve => requestAnimationFrame(() => resolve())); await settle(fixture);
    window.dispatchEvent(new Event('offline')); await settle(fixture); button('Endgültig löschen').click(); http.expectNone(goalUrl);
    window.dispatchEvent(new Event('online')); await receive(overview()); button('Endgültig löschen').click(); const held = http.expectOne(goalUrl); await settle(fixture);
    expect(button('Sparziel wird gelöscht …').disabled).toBe(true); expect(button('Abbrechen').disabled).toBe(true);
    fixture.nativeElement.querySelector('dialog').dispatchEvent(new Event('cancel', { cancelable: true })); await settle(fixture); expect(fixture.nativeElement.querySelector('dialog').open).toBe(true);
    held.flush(null, { status: 204, statusText: 'No Content' }); await settle(fixture); await receive(overview({ goals: [] })); expect(text()).toContain('wurde gelöscht');
  });

  it.each([
    ["FE-c6669c4ab4dcee58", '   '],
    ["FE-59f0607ed8b2d052", 'Rei\0se'],
    ["FE-b0b12380ee5da553", '']
  ] as const)('%s also rejects the original name in the target editor without sending', async (_id, value) => {
    await open(); fixture.nativeElement.querySelector('#goal-edit-' + goal.id).click(); await settle(fixture);
    input(fixture, 'goal-edit-name', value); sendForm('goal-edit-name'); await settle(fixture);
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    expect(field('goal-edit-name').value).toBe(value); expect(field('goal-edit-name').getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(field('goal-edit-name')); http.expectNone(goalUrl);
    expect(fixture.nativeElement.querySelector('.savings-cards').textContent).toContain(goal.name);
  });
  it.each([
    ["FE-6600976d7041b1e0", ''],
    ["FE-08472aba7d512f02", '0'],
    ["FE-0a02d41e7cc6837f", '-1'],
    ["FE-1495000f80734a6c", '1,001'],
    ["FE-8398c5d25da36835", '1.001'],
    ["FE-9d169323029c1fe5", '1e2'],
    ["FE-1bf80b47e8bf9235", '1.000,00'],
    ["FE-dc3ace8cd8cc4a12", '90071992547409,92']
  ] as const)('%s also rejects the original amount in the target editor without sending', async (_id, value) => {
    await open(); fixture.nativeElement.querySelector('#goal-edit-' + goal.id).click(); await settle(fixture);
    input(fixture, 'goal-edit-amount', value); sendForm('goal-edit-amount'); await settle(fixture);
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    expect(field('goal-edit-amount').value).toBe(value); expect(field('goal-edit-amount').getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(field('goal-edit-amount')); http.expectNone(goalUrl);
    expect(fixture.nativeElement.querySelector('.savings-cards').textContent).toContain(goal.name);
  });
  it.each([
    ["FE-d92b32c20e5e02c5", '2026-02-29'],
    ["FE-88d42aa8812e9a71", '1900-02-29'],
    ["FE-f2158e32ab761166", '2028-02-30'],
    ["FE-0488a483f52fb299", '2026-04-31'],
    ["FE-015b045920d1093a", '2026-1-01'],
    ["FE-b6de6cdd2164535b", '0000-01-01'],
    ["FE-b60923a297cd84f0", '2026-01-01T00:00:00Z'],
    ["FE-c151501521b5cdd1", '2028-02-29T00:00:00Z']
  ] as const)('%s also rejects the original date in the target editor without sending', async (_id, value) => {
    await open(); fixture.nativeElement.querySelector('#goal-edit-' + goal.id).click(); await settle(fixture);
    input(fixture, 'goal-edit-date', value); sendForm('goal-edit-date'); await settle(fixture);
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    expect(field('goal-edit-date').value).toBe(value); expect(field('goal-edit-date').getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(field('goal-edit-date')); http.expectNone(goalUrl);
    expect(fixture.nativeElement.querySelector('.savings-cards').textContent).toContain(goal.name);
  });
});
