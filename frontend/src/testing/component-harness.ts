import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { BASE_PATH } from '../app/api/v2/variables';
import { Session } from '../app/session/session';
import { sessionInterceptor } from '../app/session/session.interceptor';

@Component({ template: '' })
class NavigationTarget {}

let originalHistory: { state: unknown; url: string } | null = null;
const restorePlatform: (() => void)[] = [];
function platform(target: object, name: string, value: unknown) {
  const descriptor = Object.getOwnPropertyDescriptor(target, name);
  Object.defineProperty(target, name, { configurable: true, value });
  restorePlatform.push(() => { if (descriptor) Object.defineProperty(target, name, descriptor); else Reflect.deleteProperty(target, name); });
}

/** Only browser platform primitives are substituted; session, clients and interceptor are real. */
export function configure() {
  originalHistory = { state: window.history.state, url: window.location.href };
  vi.stubGlobal('BroadcastChannel', class { addEventListener() {} postMessage() {} close() {} });
  // A bounded frame queue prevents jsdom's shared animation interval from retaining
  // fake-clock work between cases. Real focus/layout timing remains a browser check.
  const frames = new Map<number, FrameRequestCallback>(); let frameId = 0;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = ++frameId; frames.set(id, callback);
    queueMicrotask(() => { const pending = frames.get(id); frames.delete(id); pending?.(performance.now()); });
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  restorePlatform.push(() => frames.clear());
  platform(HTMLDialogElement.prototype, 'showModal', function(this: HTMLDialogElement) { this.open = true; });
  platform(HTMLDialogElement.prototype, 'close', function(this: HTMLDialogElement) { this.open = false; });
  platform(navigator, 'locks', { request: (_: string, action: () => unknown) => action() });
  TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([sessionInterceptor])), provideHttpClientTesting(), provideRouter([{ path: '**', component: NavigationTarget }]), { provide: BASE_PATH, useValue: '/api/v2' }] });
}
/** Leert begrenzt Promise-Fortsetzungen und rendert Effekte. HTTP wird separat über
 * expectOne/flush synchronisiert: whenStable würde auf absichtlich offene Folgeanfragen warten. */
export async function settle(fixture?: ComponentFixture<unknown>) {
  fixture?.detectChanges();
  for (let i = 0; i < 12; i++) await Promise.resolve();
  fixture?.detectChanges();
}
export async function authenticate(userId = 'owner-1', accessToken = 'memory-token') {
  const session = TestBed.inject(Session), http = TestBed.inject(HttpTestingController);
  const pending = session.login(userId + '@example.test', 'a long test password');
  await settle();
  http.expectOne('/api/v2/access/csrf').flush({ token: 'csrf-test' });
  await settle();
  http.expectOne('/api/v2/access/login').flush({ userId, accessToken, expiresAt: '2026-11-15T12:10:00Z' }, { headers: { Date: 'Sun, 15 Nov 2026 12:00:00 GMT' } });
  await pending;
  return session;
}
export function input(fixture: ComponentFixture<unknown>, id: string, value: string) {
  const field = fixture.nativeElement.querySelector('#' + id) as HTMLInputElement;
  field.value = value; field.dispatchEvent(new Event('input', { bubbles: true })); fixture.detectChanges();
}
export function submit(fixture: ComponentFixture<unknown>, selector = 'form') {
  fixture.nativeElement.querySelector(selector).dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  fixture.detectChanges();
}
export async function cleanup() {
  try {
    vi.restoreAllMocks();
    TestBed.inject(Session).end('', false, false);
    await settle();
    TestBed.inject(HttpTestingController).verify({ ignoreCancelled: true });
  } finally {
    try {
      TestBed.resetTestingModule();
    } finally {
      try {
        restorePlatform.splice(0).reverse().forEach(restore => restore());
        if (originalHistory) window.history.replaceState(originalHistory.state, '', originalHistory.url);
        originalHistory = null;
      } finally {
        vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks();
      }
    }
  }
}
