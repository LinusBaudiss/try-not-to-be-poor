import { HttpTestingController } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, configure, input, settle, submit } from '../../testing/component-harness';
import { Registration } from './registration';

@Component({ template: '<h1>Andere Ansicht</h1>' })
class Away {}

describe('Registration template', () => {
  let fixture: ComponentFixture<Registration>, http: HttpTestingController;
  beforeEach(async () => {
    configure(); window.history.replaceState(null, '', '/#registrationToken=secret');
    http = TestBed.inject(HttpTestingController); fixture = TestBed.createComponent(Registration); await settle(fixture);
  });
  afterEach(cleanup);
  it('removes the link secret and confirms success only after HTTP completion', async () => {
    expect(window.location.hash).toBe('');
    input(fixture, 'email', 'one@example.test'); input(fixture, 'password', 'a long test password'); submit(fixture); submit(fixture);
    const request = http.expectOne('/api/v2/access/registrations');
    expect(request.request.body).toEqual({ registrationToken: 'secret', email: 'one@example.test', password: 'a long test password' });
    expect(fixture.nativeElement.textContent).not.toContain('Dein Konto wurde angelegt.');
    expect(fixture.nativeElement.querySelector('[type=submit]').disabled).toBe(true);
    request.flush(null, { status: 201, statusText: 'Created' }); await settle(fixture);
    expect(fixture.nativeElement.textContent).toContain('Dein Konto wurde angelegt.'); expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });
  it('maps only known server field errors and retains the draft', async () => {
    input(fixture, 'email', 'invalid'); input(fixture, 'password', 'password'); submit(fixture);
    http.expectOne('/api/v2/access/registrations').flush({ fieldErrors: { email: 'Ungültige E-Mail', other: 'hidden' } }, { status: 400, statusText: 'Bad Request' }); await settle(fixture);
    expect(fixture.nativeElement.querySelector('#email').value).toBe('invalid');
    expect(fixture.nativeElement.querySelector('#email').getAttribute('aria-describedby')).toBe('email-error');
    expect(fixture.nativeElement.querySelector('#email-error').textContent).toBe('Ungültige E-Mail');
    expect(fixture.nativeElement.textContent).not.toContain('hidden');
  });
  it('explains missing confirmation and keeps the open-tab draft', async () => {
    input(fixture, 'email', 'one@example.test'); input(fixture, 'password', 'password'); submit(fixture);
    http.expectOne('/api/v2/access/registrations').error(new ProgressEvent('error')); await settle(fixture);
    expect(fixture.nativeElement.textContent).toContain('Ob dein Konto angelegt wurde, ist unklar');
    expect(fixture.nativeElement.querySelector('#password').value).toBe('password');
    submit(fixture); const retry = http.expectOne('/api/v2/access/registrations'); expect(retry.request.body.password).toBe('password'); retry.flush(null, { status: 201, statusText: 'Created' }); await settle(fixture); expect(fixture.nativeElement.textContent).toContain('Dein Konto wurde angelegt.');
  });
  it('cancels its subscription on navigation and clears its draft', async () => {
    fixture.destroy();
    TestBed.inject(Router).resetConfig([{ path: 'register', component: Registration }, { path: 'away', component: Away }]);
    window.history.replaceState(null, '', '/register#registrationToken=secret');
    const harness = await RouterTestingHarness.create('/register#registrationToken=secret'); await settle(harness.fixture);
    input(harness.fixture, 'email', 'discard@example.test'); input(harness.fixture, 'password', 'discard this old password'); submit(harness.fixture);
    const request = http.expectOne('/api/v2/access/registrations');
    expect(request.request.body).toEqual({ registrationToken: 'secret', email: 'discard@example.test', password: 'discard this old password' });
    await harness.navigateByUrl('/away'); expect(request.cancelled).toBe(true);
    window.history.replaceState(null, '', '/register#registrationToken=new-secret');
    await harness.navigateByUrl('/register#registrationToken=new-secret'); await settle(harness.fixture);
    expect(harness.routeNativeElement!.querySelector<HTMLInputElement>('#email')!.value).toBe('');
    expect(harness.routeNativeElement!.querySelector<HTMLInputElement>('#password')!.value).toBe('');
    expect(harness.routeNativeElement!.textContent).not.toContain('Dein Konto wurde angelegt.');
    http.expectNone('/api/v2/access/registrations');
  });
});
