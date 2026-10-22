import { HttpBackend, HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom, timeout } from 'rxjs';
import { SessionResponse } from '../api/model/sessionResponse';

@Injectable({ providedIn: 'root' })
export class Session {
  private readonly http = new HttpClient(inject(HttpBackend));
  private readonly router = inject(Router);
  private readonly channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('tnbp-session');
  private readonly current = signal<SessionResponse | null>(null);
  readonly userId = () => this.current()?.userId ?? null;
  readonly notice = signal('');
  private csrfRequest: Promise<string> | null = null;
  private epoch = 0;
  private restored = false;
  private restoring: Promise<boolean> | null = null;
  private refreshing: Promise<boolean> | null = null;
  private queue: Promise<unknown> = Promise.resolve();
  private refreshTimer?: ReturnType<typeof setTimeout>;
  private expiryTimer?: ReturnType<typeof setTimeout>;
  private expiresAtMonotonic = 0;

  constructor() {
    this.channel?.addEventListener('message', event => {
      if (event.data === 'ended') this.end('Die Sitzung wurde in einem anderen Tab beendet oder gewechselt.', false, false);
    });
  }

  generation(): number { return this.epoch; }
  token(): string | null {
    const value = this.current();
    if (value && performance.now() >= this.expiresAtMonotonic) {
      this.end('Deine Sitzung ist abgelaufen. Melde dich erneut an.');
      return null;
    }
    return value?.accessToken ?? null;
  }

  async restore(): Promise<boolean> {
    if (this.token()) return true;
    if (this.restoring) return this.restoring;
    if (this.restored) return false;
    this.restored = true;
    this.restoring = this.refresh().finally(() => { this.restoring = null; });
    return this.restoring;
  }

  async login(email: string, password: string): Promise<boolean> {
    this.reset();
    this.channel?.postMessage('ended');
    this.restored = true;
    const version = this.epoch;
    return this.serialize(async () => {
      if (version !== this.epoch) return false;
      const headers = { 'X-CSRF-TOKEN': await this.csrfToken() };
      const startedAt = performance.now();
      const result = await firstValueFrom(this.http.post<SessionResponse>('/api/v1/access/login', { email, password }, { headers, observe: 'response' }).pipe(timeout(30_000)));
      return this.accept(result, version, startedAt);
    });
  }

  refresh(): Promise<boolean> {
    if (this.refreshing) return this.refreshing;
    const version = this.epoch;
    const operation = this.serialize(async () => {
      if (version !== this.epoch) return false;
      try {
        const headers = { 'X-CSRF-TOKEN': await this.csrfToken() };
        const startedAt = performance.now();
        const result = await firstValueFrom(this.http.post<SessionResponse>('/api/v1/access/refresh', null, { headers, observe: 'response' }).pipe(timeout(30_000)));
        return this.accept(result, version, startedAt);
      } catch {
        // Eine möglicherweise bereits committete Rotation niemals automatisch wiederholen.
        if (version === this.epoch) this.end('Deine Sitzung konnte nicht verlängert werden. Melde dich erneut an.');
        return false;
      }
    });
    this.refreshing = operation;
    void operation.finally(() => { if (this.refreshing === operation) this.refreshing = null; });
    return operation;
  }

  async logout(): Promise<void> {
    this.end('Abmeldung läuft …', true, false);
    const version = this.epoch;
    const confirmed = await this.revoke();
    if (version === this.epoch) this.notice.set(confirmed ? 'Du wurdest abgemeldet.'
      : 'Die Abmeldung wurde nicht bestätigt. Versuche die Abmeldung erneut.');
  }

  end(message = 'Melde dich erneut an.', broadcast = true, revoke = true): void {
    this.reset();
    if (broadcast) this.channel?.postMessage('ended');
    this.restored = true;
    this.notice.set(message);
    void this.router.navigateByUrl('/anmelden');
    // Auch eine verspätete Cookie-Antwort nach Ablauf darf keinen Reload wieder anmelden.
    if (revoke) void this.revoke();
  }

  cancelLogin(version: number): void {
    if (version !== this.epoch) return;
    this.reset();
    this.restored = true;
    this.notice.set('Die Anmeldung wurde abgebrochen.');
    this.channel?.postMessage('ended');
    void this.revoke();
  }

  private revoke(): Promise<boolean> {
    // Erst laufende Cookie-Mutationen abschließen, danach deren Familie widerrufen.
    const version = this.epoch;
    return this.serialize(async () => {
      if (version !== this.epoch) return false;
      try {
        const headers = { 'X-CSRF-TOKEN': await this.csrfToken() };
        await firstValueFrom(this.http.post('/api/v1/access/logout', null, { headers }).pipe(timeout(30_000)));
        return true;
      } catch { return false; }
    });
  }

  private reset(): void {
    ++this.epoch;
    this.current.set(null);
    this.expiresAtMonotonic = 0;
    this.notice.set('');
    clearTimeout(this.refreshTimer);
    clearTimeout(this.expiryTimer);
  }

  private accept(response: HttpResponse<SessionResponse>, version: number, startedAt: number): boolean {
    if (version !== this.epoch) return false;
    const result = response.body;
    if (!result || (this.current() && result.userId !== this.current()?.userId)) { this.end(); return false; }
    // HTTP-Date und eine monotone Restlaufzeit vermeiden Abhängigkeit von der Geräteuhr.
    const serverNow = Date.parse(response.headers.get('Date') ?? '');
    const lifetime = Date.parse(result.expiresAt) - serverNow - (performance.now() - startedAt);
    if (!result.accessToken || !result.userId || !Number.isFinite(lifetime) || lifetime <= 30_000 || lifetime > 601_000) {
      this.end('Die Sitzung konnte nicht bestätigt werden. Melde dich erneut an.'); return false;
    }
    this.current.set(result);
    this.expiresAtMonotonic = performance.now() + lifetime;
    this.notice.set('');
    clearTimeout(this.refreshTimer);
    clearTimeout(this.expiryTimer);
    this.refreshTimer = setTimeout(() => { void this.refresh(); }, Math.max(1_000, lifetime - 30_000));
    this.expiryTimer = setTimeout(() => {
      if (version === this.epoch) this.end('Deine Sitzung ist abgelaufen. Melde dich erneut an.');
    }, lifetime);
    return true;
  }

  // CSRF-Sitzungen dürfen vor dem langlebigen Refresh-Cookie ablaufen oder neu starten.
  private csrfToken(): Promise<string> {
    if (this.csrfRequest) return this.csrfRequest;
    this.csrfRequest = firstValueFrom(this.http.get<{ token: string }>('/api/v1/access/csrf').pipe(timeout(30_000)))
      .then(result => result.token)
      .finally(() => { this.csrfRequest = null; });
    return this.csrfRequest;
  }

  private serialize<T>(operation: () => Promise<T>): Promise<T> {
    // Der originweite Web Lock umfasst CSRF, Cookie-Antwort und deren Verarbeitung.
    // Er wird erst freigegeben, wenn ein wartender Tab bereits das rotierte Cookie sieht.
    const locked = () => navigator.locks.request('tnbp-session-cookie', operation);
    const result = this.queue.then(locked, locked);
    this.queue = result.catch(() => {});
    return result;
  }
}

export const sessionGuard: CanActivateFn = async () => {
  const session = inject(Session);
  const router = inject(Router);
  return await session.restore() || router.parseUrl('/anmelden');
};
