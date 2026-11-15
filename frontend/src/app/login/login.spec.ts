import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, configure, input, settle, submit } from '../../testing/component-harness';
import { Login } from './login';

describe('Login template', () => {
  let fixture: ComponentFixture<Login>, http: HttpTestingController;
  beforeEach(async () => { configure(); http = TestBed.inject(HttpTestingController); fixture = TestBed.createComponent(Login); await settle(fixture); });
  afterEach(cleanup);
  it('links empty-field errors to their inputs without sending HTTP', async () => {
    submit(fixture); await settle(fixture);
    expect(fixture.nativeElement.querySelector('#email').getAttribute('aria-describedby')).toBe('email-error');
    expect(fixture.nativeElement.querySelector('#password').getAttribute('aria-invalid')).toBe('true');
    http.expectNone('/api/v2/access/csrf');
  });
  it('prevents duplicate logins and retains credentials on rejected login', async () => {
    input(fixture, 'email', 'one@example.test'); input(fixture, 'password', 'password'); submit(fixture); submit(fixture); await settle();
    http.expectOne('/api/v2/access/csrf').flush({ token: 'csrf' }); await settle();
    const request = http.expectOne('/api/v2/access/login');
    expect(fixture.nativeElement.querySelector('[type=submit]').disabled).toBe(true);
    request.flush({}, { status: 401, statusText: 'Unauthorized' }); await settle(fixture);
    expect(fixture.nativeElement.textContent).toContain('Prüfe E-Mail-Adresse und Passwort');
    expect(fixture.nativeElement.querySelector('#password').value).toBe('password');
  });
  it('retains open-tab drafts offline without sending', () => {
    input(fixture, 'email', 'one@example.test'); window.dispatchEvent(new Event('offline')); fixture.detectChanges(); submit(fixture);
    expect(fixture.nativeElement.querySelector('#email').value).toBe('one@example.test');
    expect(fixture.nativeElement.querySelector('[type=submit]').disabled).toBe(true); http.expectNone('/api/v2/access/csrf');
  });
});
