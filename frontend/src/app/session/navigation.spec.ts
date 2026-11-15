import { HttpTestingController } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { authenticate, cleanup, configure, input, settle, submit } from '../../testing/component-harness';
import { Expenses } from '../expenses/expenses';

@Component({ template: '<h1>Andere Ansicht</h1>' })
class Away {}
const row = { id: '11111111-1111-4111-8111-111111111111', name: 'Ausgang', amountCents: 100, recordedOn: '2026-03-29' };

describe('Actual Angular navigation and operation ownership', () => {
  beforeEach(() => {
    configure();
  });
  afterEach(cleanup);
  it.each([
    ['FE-f1fc9b87fe0283d6', 'POST'], ['FE-c698667f913e47ed', 'PUT'], ['FE-7d96c2e77b720c67', 'DELETE'],
  ] as const)('%s retains the %s operation guard across actual route destruction and explicit review', async (_id, method) => {
    await authenticate(); TestBed.inject(Router).resetConfig([{ path: 'expenses', component: Expenses }, { path: 'away', component: Away }]); const http = TestBed.inject(HttpTestingController), harness = await RouterTestingHarness.create('/expenses');
    http.expectOne('/api/v2/expenses').flush(method === 'POST' ? [] : [row]); await settle(harness.fixture);
    let response = { ...row, name: 'Verlassener Entwurf', amountCents: 200 };
    if (method === 'POST') {
      input(harness.fixture, 'expense-name', response.name); input(harness.fixture, 'expense-amount', '2'); submit(harness.fixture);
    } else if (method === 'PUT') {
      harness.routeNativeElement!.querySelector<HTMLButtonElement>('[aria-label="Ausgang bearbeiten"]')!.click(); await settle(harness.fixture);
      input(harness.fixture, 'expense-edit-name', response.name); input(harness.fixture, 'expense-edit-amount', '2'); submit(harness.fixture, '.expense-editor');
    } else {
      harness.routeNativeElement!.querySelector<HTMLButtonElement>('[aria-label="Ausgang löschen"]')!.click();
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve())); await settle(harness.fixture);
      harness.routeNativeElement!.querySelector<HTMLButtonElement>('dialog button:last-child')!.click();
    }
    const held = http.expectOne('/api/v2/expenses' + (method === 'POST' ? '' : '/' + row.id));
    await harness.navigateByUrl('/away'); await harness.navigateByUrl('/expenses'); await settle(harness.fixture);
    const button = (label: string) => [...harness.routeNativeElement!.querySelectorAll('button')].find(b => b.textContent?.trim() === label)!;
    expect(harness.routeNativeElement!.querySelector<HTMLInputElement>('#expense-name')!.value).toBe('');
    expect(harness.routeNativeElement!.querySelector<HTMLInputElement>('#expense-amount')!.value).toBe('');
    expect(harness.routeNativeElement!.querySelector('.expense-editor')).toBeNull();
    expect(button('Ausgabe speichern').disabled).toBe(true); expect(button('Historie zur Prüfung laden').disabled).toBe(true);
    held.flush(method === 'DELETE' ? null : response, { status: method === 'POST' ? 201 : method === 'DELETE' ? 204 : 200, statusText: 'Confirmed after navigation' }); await settle(harness.fixture);
    expect(harness.routeNativeElement!.textContent).not.toContain('wurde gespeichert');
    expect(button('Historie zur Prüfung laden').disabled).toBe(false); expect(button('Ich habe die Historie geprüft').disabled).toBe(true);
    button('Historie zur Prüfung laden').click(); http.expectOne('/api/v2/expenses').flush(method === 'DELETE' ? [] : [response]); await settle(harness.fixture);
    expect(button('Ausgabe speichern').disabled).toBe(true); expect(button('Ich habe die Historie geprüft').disabled).toBe(false);
    button('Ich habe die Historie geprüft').click(); await settle(harness.fixture); expect(button('Ausgabe speichern').disabled).toBe(false);
  });
  it('FE-a02bfc45334c9a36 rejects the list response of a destroyed route after returning to newer data', async () => {
    await authenticate(); TestBed.inject(Router).resetConfig([{ path: 'expenses', component: Expenses }, { path: 'away', component: Away }]); const http = TestBed.inject(HttpTestingController), harness = await RouterTestingHarness.create('/expenses');
    const old = http.expectOne('/api/v2/expenses'); await harness.navigateByUrl('/away'); await harness.navigateByUrl('/expenses');
    http.expectOne('/api/v2/expenses').flush([{ ...row, name: 'Neuer Stand' }]); await settle(harness.fixture);
    old.flush([row]); await settle(harness.fixture);
    expect(harness.routeNativeElement!.textContent).toContain('Neuer Stand'); expect(harness.routeNativeElement!.textContent).not.toContain('Ausgang');
  });
});
