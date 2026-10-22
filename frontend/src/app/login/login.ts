import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom, timeout } from 'rxjs';
import { Session } from '../session/session';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="auth-card" aria-labelledby="login-title">
      <h1 id="login-title">Anmelden</h1>
      <p>Öffne deine persönliche Monatsübersicht.</p>
      <p id="feedback" tabindex="-1" role="status" aria-live="polite" [class.error]="failed()">{{ status() || session.notice() }}</p>
      <form (ngSubmit)="submit()" novalidate [attr.aria-busy]="pending()">
        <div class="field">
          <label for="email">E-Mail-Adresse</label>
          <input id="email" name="email" type="email" inputmode="email" autocomplete="username" spellcheck="false"
            required [readOnly]="pending()" [(ngModel)]="email" [attr.aria-invalid]="!!errors().email"
            [attr.aria-describedby]="errors().email ? 'email-error' : null">
          @if (errors().email) { <p class="field-error" id="email-error">{{ errors().email }}</p> }
        </div>
        <div class="field">
          <label for="password">Passwort</label>
          <input id="password" name="password" type="password" autocomplete="current-password" required
            [readOnly]="pending()" [(ngModel)]="password" [attr.aria-invalid]="!!errors().password"
            [attr.aria-describedby]="errors().password ? 'password-error' : null">
          @if (errors().password) { <p class="field-error" id="password-error">{{ errors().password }}</p> }
        </div>
        @if (!online()) { <p class="error">Du bist offline. Deine Eingaben bleiben in diesem Tab erhalten.</p> }
        <button type="submit" [disabled]="pending() || !online()">{{ pending() ? 'Anmeldung läuft …' : 'Anmelden' }}</button>
      </form>
      @if (session.notice().includes('nicht bestätigt')) {
        <button type="button" class="secondary" (click)="session.logout()">Abmeldung erneut versuchen</button>
      }
      <a routerLink="/registrieren">Eigenes Konto anlegen</a>
    </section>`
})
export class Login {
  protected readonly session = inject(Session);
  private readonly router = inject(Router);
  private active = true;
  private attempt: number | null = null;
  protected email = '';
  protected password = '';
  protected readonly pending = signal(false);
  protected readonly failed = signal(false);
  protected readonly online = signal(navigator.onLine);
  protected readonly status = signal('');
  protected readonly errors = signal<Record<string, string>>({});
  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.active = false;
      this.password = '';
      if (this.pending() && this.attempt !== null) this.session.cancelLogin(this.attempt);
    });
  }

  @HostListener('window:online') connected(): void { this.online.set(true); }
  @HostListener('window:offline') disconnected(): void { this.online.set(false); }

  protected async submit(): Promise<void> {
    if (this.pending() || !this.online()) return;
    const errors: Record<string, string> = {};
    if (!this.email.trim()) errors['email'] = 'Gib deine E-Mail-Adresse ein.';
    if (!this.password) errors['password'] = 'Gib dein Passwort ein.';
    this.errors.set(errors);
    if (Object.keys(errors).length) {
      this.failed.set(true); this.status.set('Prüfe die markierten Felder.');
      this.focus(errors['email'] ? 'email' : 'password'); return;
    }
    this.pending.set(true); this.failed.set(false); this.status.set('Anmeldung läuft …');
    try {
      const login = this.session.login(this.email, this.password);
      this.attempt = this.session.generation();
      const accepted = await login;
      if (!this.active) return;
      this.status.set('');
      if (accepted) {
        this.password = '';
        this.pending.set(false);
        await this.router.navigateByUrl('/monat');
      } else {
        this.failed.set(true);
        if (!this.session.notice()) this.status.set('Die Anmeldung wurde abgebrochen.');
        this.focus('feedback');
      }
    } catch (failure) {
      if (!this.active) return;
      this.failed.set(true);
      this.status.set(failure instanceof HttpErrorResponse && failure.status === 401
        ? 'Anmeldung nicht möglich. Prüfe E-Mail-Adresse und Passwort.'
        : 'Die Anmeldung wurde nicht bestätigt. Versuche es erneut.');
      this.focus('feedback');
    } finally { this.pending.set(false); }
  }
  private focus(id: string): void { requestAnimationFrame(() => document.getElementById(id)?.focus()); }
}

@Component({
  selector: 'app-month',
  template: `<section class="auth-card" aria-labelledby="month-title">
    <h1 id="month-title">Monat</h1>
    <p role="status">{{ identityStatus() }}</p>
    <p>Budget und Ausgaben sind hier noch nicht verfügbar.</p>
    @if (identityFailed()) { <button type="button" (click)="verifyIdentity()">Zugang erneut prüfen</button> }
    <button type="button" (click)="session.logout()">Abmelden</button>
  </section>`
})
export class Month {
  protected readonly session = inject(Session);
  private readonly http = inject(HttpClient);
  protected readonly identityStatus = signal('Sitzung wird geprüft …');
  protected readonly identityFailed = signal(false);
  private active = true;

  constructor() {
    inject(DestroyRef).onDestroy(() => { this.active = false; });
    void this.verifyIdentity();
  }

  async verifyIdentity(): Promise<boolean> {
    try {
      const identity = await firstValueFrom(this.http.get<{ userId: string }>('/api/v1/access/me').pipe(timeout(30_000)));
      if (!this.active || identity.userId !== this.session.userId()) return false;
      this.identityFailed.set(false);
      this.identityStatus.set('Du bist angemeldet. Deine persönliche Monatsübersicht ist geöffnet.');
      return true;
    } catch {
      if (this.active) {
        this.identityFailed.set(true);
        this.identityStatus.set('Der Zugang konnte nicht geprüft werden.');
      }
      return false;
    }
  }
}
