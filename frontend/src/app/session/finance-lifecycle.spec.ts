import { HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticate, cleanup, configure, input, settle, submit } from '../../testing/component-harness';
import { Month } from '../month/month';
import { MonthSummary } from '../month/month-summary';
import { Expenses } from '../expenses/expenses';
import { SavingsGoals } from '../savings-goals/savings-goals';
import { Session } from './session';

const goal = { id: '22222222-2222-4222-8222-222222222222', name: 'Alte Berlin-Fahrt', targetAmountCents: 10000, progressCents: 2500, targetDate: '2027-03-28' };
const expense = { id: goal.id, name: 'Alte Berlin-Fahrt', amountCents: 1234, recordedOn: '2026-03-29' };
const summary = { month: '2026-11-01', budgetCents: 10000, expensesCents: 1234, remainingCents: 8766 };
const overview = { active: true, activationMonth: '2026-11-01', currentMonth: '2026-11-01', pendingCents: 3500, selectedGoalId: null, goals: [goal] };
const headers = { Date: 'Sun, 15 Nov 2026 12:00:00 GMT' };

describe('Session boundaries through actual finance templates', () => {
  beforeEach(configure); afterEach(cleanup);
  it.each([["FE-1976682961be2db1", "budget", "GET", "logout"], ["FE-3a6d606dba4c7e5e", "budget", "PUT", "logout"], ["FE-fce40c4ec84b86df", "budget", "PUT", "switch"], ["FE-f89703ac35b0ceb5", "budget", "PUT", "expiry"], ["FE-a301ad32e8eabbfe", "expenses", "GET", "logout"], ["FE-0e87bdeb82dbc104", "expenses", "POST", "switch"], ["FE-bdc48f2be3ff049e", "expenses", "POST", "expiry"], ["FE-8f7c0c80cbefdcc0", "expenses", "PUT", "switch"], ["FE-ea760b638723cdb2", "expenses", "DELETE", "switch"], ["FE-c094bbcaae77bfa2", "expenses", "PUT", "expiry"], ["FE-5eae39e7cf52234b", "expenses", "DELETE", "expiry"], ["FE-a464bdf1e76cba26", "goals", "GET", "logout"], ["FE-3b723d1848674474", "goals", "POST", "switch"], ["FE-2cad0f8626c19159", "goals", "POST", "expiry"], ["FE-f250bf2d88aa2953", "goals", "PUT", "logout"], ["FE-3fe39f1c1b6ab41e", "goals", "PUT", "switch"], ["FE-8dfee0225d794056", "goals", "PUT", "expiry"], ["FE-0ef2b51e053730b0", "goals", "DELETE", "logout"], ["FE-3c18621cf845f987", "goals", "DELETE", "switch"], ["FE-a3168e40cca58aef", "goals", "DELETE", "expiry"], ["FE-bb5d99ec5a06ede4", "summary", "GET", "switch"], ["FE-1f4b01073a787787", "summary", "GET", "expiry"], ["FE-06acae53985adae0", "goals", "selection", "switch"], ["FE-91c17d7f8c794c9a", "goals", "activation", "logout"], ["FE-818527da90f13b80", "goals", "progress", "logout"], ["FE-91408e7331f29f28", "goals", "progress", "switch"], ["FE-22ebd555c96d3f51", "goals", "progress", "expiry"]] as const)('%s clears old %s %s state after %s and rejects its late response', async (_id, screen, action, ending) => {
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    const session = await authenticate(), http = TestBed.inject(HttpTestingController);
    let fixture: ComponentFixture<any>, request: TestRequest, response: Parameters<TestRequest['flush']>[0];
    if (screen === 'budget') {
      fixture = TestBed.createComponent(Month); fixture.detectChanges();
      http.expectOne('/api/v2/access/me').flush({ userId: 'owner-1' }); await settle();
      const initial = http.expectOne('/api/v2/budget');
      http.match('/api/v2/month-summary').forEach(req => req.flush(summary, { headers }));
      initial.flush({ amountCents: 10000 }); await settle(fixture); http.match('/api/v2/month-summary').forEach(req => req.flush(summary, { headers })); await settle(fixture);
      expect(fixture.nativeElement.querySelector('.budget-value').textContent).toContain('100,00\u00a0€');
      input(fixture, 'budget-amount', '123,45'); submit(fixture); request = http.expectOne('/api/v2/budget'); response = { amountCents: 12345 };
      if (action === 'GET') {
        request.error(new ProgressEvent('error')); await settle(fixture);
        http.match('/api/v2/month-summary').forEach(req => req.flush(summary, { headers })); await settle(fixture);
        ([...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[]).find(b => b.textContent?.trim() === 'Budget zur Prüfung laden')!.click();
        request = http.expectOne('/api/v2/budget');
      }
    } else if (screen === 'summary') {
      fixture = TestBed.createComponent(MonthSummary); fixture.detectChanges(); request = http.expectOne('/api/v2/month-summary'); response = summary;
    } else if (screen === 'expenses') {
      fixture = TestBed.createComponent(Expenses); fixture.detectChanges(); const initial = http.expectOne('/api/v2/expenses');
      if (action === 'GET') { request = initial; response = [expense]; }
      else {
        initial.flush([expense]); await settle(fixture); input(fixture, 'expense-name', 'Alter Entwurf'); input(fixture, 'expense-amount', '12,34');
        if (action === 'POST') { submit(fixture); request = http.expectOne('/api/v2/expenses'); response = { ...expense, id: '33333333-3333-4333-8333-333333333333', name: 'Alter Entwurf' }; }
        else if (action === 'PUT') { fixture.nativeElement.querySelector('[aria-label="Alte Berlin-Fahrt bearbeiten"]').click(); await settle(fixture); input(fixture, 'expense-edit-name', 'Alter Entwurf'); submit(fixture, '.expense-editor'); request = http.expectOne('/api/v2/expenses/' + expense.id); response = { ...expense, name: 'Alter Entwurf' }; }
        else { fixture.nativeElement.querySelector('[aria-label="Alte Berlin-Fahrt löschen"]').click(); await new Promise<void>(resolve => requestAnimationFrame(() => resolve())); await settle(fixture); fixture.nativeElement.querySelector('dialog button:last-child').click(); request = http.expectOne('/api/v2/expenses/' + expense.id); response = null; }
      }
    } else {
      fixture = TestBed.createComponent(SavingsGoals); fixture.detectChanges(); http.expectOne('/api/v2/access/me').flush({ userId: 'owner-1' }); await settle();
      http.expectOne('/api/v2/capabilities').flush({ signedProgressAvailable: true, monthlyAutomationAvailable: true });
      const initial = http.expectOne('/api/v2/monthly-surplus');
      if (action === 'GET') { request = initial; response = overview; }
      else {
        initial.flush(action === 'activation' ? { ...overview, active: false, activationMonth: null, pendingCents: 0 } : overview, { headers }); await settle(fixture);
        input(fixture, 'goal-name', 'Alter Entwurf'); input(fixture, 'goal-amount', '12,34');
        if (action === 'POST') { fixture.nativeElement.querySelector('#goal-name').closest('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); request = http.expectOne('/api/v2/savings-goals'); response = { ...goal, id: '33333333-3333-4333-8333-333333333333', name: 'Alter Entwurf', targetAmountCents: 1234, progressCents: 0, targetDate: null }; }
        else if (action === 'PUT') { fixture.nativeElement.querySelector('#goal-edit-' + goal.id).click(); await settle(fixture); input(fixture, 'goal-edit-name', 'Alter Entwurf'); fixture.nativeElement.querySelector('#goal-edit-name').closest('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); request = http.expectOne('/api/v2/savings-goals/' + goal.id); response = { ...goal, name: 'Alter Entwurf' }; }
        else if (action === 'progress') { fixture.nativeElement.querySelector('#goal-progress-' + goal.id).click(); await settle(fixture); input(fixture, 'goal-progress-amount', '60'); fixture.nativeElement.querySelector('#goal-progress-amount').closest('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); request = http.expectOne('/api/v2/savings-goals/' + goal.id + '/progress'); response = { ...goal, progressCents: 6000 }; }
        else if (action === 'DELETE') { fixture.nativeElement.querySelector('#goal-delete-' + goal.id).click(); await new Promise<void>(resolve => requestAnimationFrame(() => resolve())); await settle(fixture); fixture.nativeElement.querySelector('dialog button:last-child').click(); request = http.expectOne('/api/v2/savings-goals/' + goal.id); response = null; }
        else if (action === 'selection') { const select = fixture.nativeElement.querySelector('#monthly-goal'); select.value = goal.id; select.dispatchEvent(new Event('change')); fixture.nativeElement.querySelector('#monthly-goal').closest('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); request = http.expectOne('/api/v2/monthly-surplus/selection'); response = { ...overview, selectedGoalId: goal.id, pendingCents: 0 }; }
        else { ([...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[]).find(b => b.textContent?.trim() === 'Monatsautomatik ausdrücklich aktivieren')!.click(); request = http.expectOne('/api/v2/monthly-surplus/activation'); response = { active: true, activationMonth: '2026-11-01' }; }
      }
    }
    await settle(fixture);
    if (screen === 'budget') expect(fixture.nativeElement.querySelector('.budget-value').textContent).toContain('100,00\u00a0€');
    if (ending === 'switch') await authenticate('owner-2', 'replacement-token');
    else if (ending === 'expiry') {
      vi.spyOn(performance, 'now').mockReturnValue(performance.now() + 601000); expect(session.token()).toBeNull();
      await settle(); http.expectOne('/api/v2/access/csrf').flush({ token: 'csrf' }); await settle(); http.expectOne('/api/v2/access/logout').flush(null, { status: 204, statusText: 'No Content' });
    } else session.end('', false, false);
    await settle(fixture);
    if (screen === 'budget') expect(fixture.nativeElement.querySelector('.budget-value')).toBeNull();
    let newFixture: ComponentFixture<SavingsGoals> | undefined;
    const newGoal = { ...goal, name: 'Neues Konto', progressCents: 700 };
    if (action === 'activation') {
      await authenticate('owner-2', 'replacement-token');
      fixture.destroy(); newFixture = TestBed.createComponent(SavingsGoals); newFixture.detectChanges();
      http.expectOne('/api/v2/access/me').flush({ userId: 'owner-2' }); await settle();
      http.expectOne('/api/v2/capabilities').flush({ signedProgressAvailable: true, monthlyAutomationAvailable: true });
      http.expectOne('/api/v2/monthly-surplus').flush({ ...overview, active: false, activationMonth: null, pendingCents: 0, goals: [newGoal] }, { headers }); await settle(newFixture);
      expect(newFixture.nativeElement.textContent).toContain('Neues Konto');
    }
    request.flush(response, { status: action === 'DELETE' ? 204 : action === 'POST' ? 201 : 200, statusText: 'Controlled late reply', headers }); await settle(fixture);
    expect(fixture.nativeElement.textContent).not.toContain('Alte Berlin-Fahrt'); expect(fixture.nativeElement.textContent).not.toContain('Alter Entwurf');
    expect(fixture.nativeElement.textContent).not.toContain('wurde gespeichert.'); expect(fixture.nativeElement.textContent).not.toContain('wurde aktiviert.');
    for (const field of fixture.nativeElement.querySelectorAll('input')) expect((field as HTMLInputElement).value).toBe('');
    if (screen === 'budget') expect(fixture.nativeElement.querySelector('.budget-value')).toBeNull();
    if (newFixture) {
      await settle(newFixture);
      expect(newFixture.nativeElement.textContent).toContain('Neues Konto'); expect(newFixture.nativeElement.textContent).toContain('7,00\u00a0€');
      expect(newFixture.nativeElement.textContent).not.toContain('wurde aktiviert.'); expect(newFixture.nativeElement.textContent).not.toContain('aktiv seit');
      expect(newFixture.nativeElement.textContent).not.toContain('Alte Berlin-Fahrt');
      expect(([...newFixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[]).find(b => b.textContent?.trim() === 'Monatsautomatik ausdrücklich aktivieren')).toBeDefined();
      http.expectNone('/api/v2/monthly-surplus');
    }
    expect(fixture.nativeElement.querySelector('dialog[open]')).toBeNull(); expect(fixture.nativeElement.querySelector('.summary-money')).toBeNull();
    expect(storage).not.toHaveBeenCalled(); expect(document.cookie).not.toContain('memory-token'); expect(document.cookie).not.toContain('replacement-token');
    expect(session.userId()).toBe(ending === 'switch' || action === 'activation' ? 'owner-2' : null);
  });
});
