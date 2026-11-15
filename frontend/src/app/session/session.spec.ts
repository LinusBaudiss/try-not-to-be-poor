import { HttpClient } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticate, cleanup, configure, settle } from '../../testing/component-harness';
import { Session } from './session';

describe('Real session and interceptor', () => {
  beforeEach(configure);
  afterEach(cleanup);
  it('keeps tokens and financial HTTP responses out of browser storage', async () => {
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    const session = await authenticate(); expect(session.token()).toBe('memory-token');
    TestBed.inject(HttpClient).get('/api/v2/expenses').subscribe();
    TestBed.inject(HttpTestingController).expectOne('/api/v2/expenses').flush([{ name: 'private', amountCents: 12 }]);
    expect(storage).not.toHaveBeenCalled();
    expect(document.cookie).not.toContain('memory-token');
  });
  it('does not attach bearer credentials to external origins', async () => {
    await authenticate(); TestBed.inject(HttpClient).get('https://example.test/api/v2/expenses').subscribe();
    const request = TestBed.inject(HttpTestingController).expectOne('https://example.test/api/v2/expenses');
    expect(request.request.headers.has('Authorization')).toBe(false); request.flush([]);
  });
  it('rejects unauthenticated finance calls before HTTP', () => {
    let status = 0; TestBed.inject(HttpClient).get('/api/v2/expenses').subscribe({ error: failure => status = failure.status });
    expect(status).toBe(401); TestBed.inject(HttpTestingController).expectNone('/api/v2/expenses');
  });
  it('rejects a late account response at the interceptor boundary', async () => {
    const session = await authenticate(); let observed: unknown, status = 0;
    TestBed.inject(HttpClient).get('/api/v2/expenses').subscribe({ next: value => observed = value, error: failure => status = failure.status });
    const request = TestBed.inject(HttpTestingController).expectOne('/api/v2/expenses');
    session.end('', false, false); request.flush([{ name: 'old account' }]); await settle();
    expect(observed).toBeUndefined(); expect(status).toBe(401); expect(session.token()).toBeNull();
  });
  it('expires using monotonic time, clears identity and revokes on the real end path', async () => {
    const session = await authenticate(), before = session.generation();
    const http = TestBed.inject(HttpTestingController);
    vi.spyOn(performance, 'now').mockReturnValue(performance.now() + 601000);
    expect(session.token()).toBeNull();
    expect(session.userId()).toBeNull(); expect(session.generation()).toBeGreaterThan(before);
    expect(session.notice()).toContain('abgelaufen');
    await settle(); http.expectOne('/api/v2/access/csrf').flush({ token: 'revocation-csrf' });
    await settle(); const revoke = http.expectOne('/api/v2/access/logout');
    expect(revoke.request.method).toBe('POST'); revoke.flush(null, { status: 204, statusText: 'No Content' });
    await settle(); expect(session.token()).toBeNull();
  });
  it('keeps a new account when an old account response arrives after real login', async () => {
    const session = await authenticate(); let observed: unknown, status = 0;
    TestBed.inject(HttpClient).get('/api/v2/expenses').subscribe({ next: value => observed = value, error: failure => status = failure.status });
    const old = TestBed.inject(HttpTestingController).expectOne('/api/v2/expenses');
    await authenticate('owner-2', 'new-memory-token');
    old.flush([{ name: 'old account' }]); await settle();
    expect(observed).toBeUndefined(); expect(status).toBe(401);
    expect(session.userId()).toBe('owner-2'); expect(session.token()).toBe('new-memory-token');
  });
});
