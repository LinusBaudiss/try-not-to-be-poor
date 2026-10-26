import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, HostListener, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Session } from '../session/session';
import { LogoutButton } from '../session/logout-button';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, LogoutButton],
  template: `
    <section class="auth-card" aria-labelledby="login-title">
      <h1 id="login-title">Anmelden</h1>
      <p>Öffne deine persönliche Monatsübersicht.</p>
      <p id="feedback" tabindex="-1" role="status" aria-live="polite" [class.error]="failed()">{{ status() && session.logoutUnconfirmed() ? status() + ' ' + session.notice() : status() || session.notice() }}</p>
      <form (ngSubmit)="submit()" novalidate [attr.aria-busy]="pending()">
        <div class="field">
          <label for="email">E-Mail-Adresse</label>
          <input id="email" name="email" type="email" inputmode="email" autocomplete="username" spellcheck="false"
            required [readOnly]="pending()" [value]="email" (input)="email = $any($event.target).value" [attr.aria-invalid]="!!errors().email"
            [attr.aria-describedby]="errors().email ? 'email-error' : null">
          @if (errors().email) { <p class="field-error" id="email-error">{{ errors().email }}</p> }
        </div>
        <div class="field">
          <label for="password">Passwort</label>
          <input id="password" name="password" type="password" autocomplete="current-password" required
            [readOnly]="pending()" [value]="password" (input)="password = $any($event.target).value" [attr.aria-invalid]="!!errors().password"
            [attr.aria-describedby]="errors().password ? 'password-error' : null">
          @if (errors().password) { <p class="field-error" id="password-error">{{ errors().password }}</p> }
        </div>
        @if (!online()) { <p class="error">Du bist offline. Deine Eingaben bleiben in diesem Tab erhalten.</p> }
        <button type="submit" [disabled]="pending() || session.loggingOut() || !online()">{{ pending() ? 'Anmeldung läuft …' : 'Anmelden' }}</button>
      </form>
      @if (session.logoutUnconfirmed() || session.loggingOut()) {
        <app-logout-button [retry]="true" />
      }
      <a routerLink="/registrieren">Eigenes Konto anlegen</a>
    </section>`
})
export class Login {
  protected readonly session = inject(Session);
  private readonly router = inject(Router);
  private active = true;
  private attempt: number | null = null;
  private version = this.session.generation();
  protected email = '';
  protected password = '';
  protected readonly pending = signal(false);
  protected readonly failed = signal(false);
  protected readonly online = signal(navigator.onLine);
  protected readonly status = signal('');
  protected readonly errors = signal<Record<string, string>>({});
  constructor() {
    effect(() => {
      const version = this.session.generation();
      if (version !== this.version) { this.version = version; this.clear(); }
    });
    inject(DestroyRef).onDestroy(() => {
      this.active = false;
      if (this.pending() && this.attempt !== null) this.session.cancelLogin(this.attempt);
      this.clear();
    });
  }

  @HostListener('window:online') connected(): void { this.online.set(true); }
  @HostListener('window:offline') disconnected(): void { this.online.set(false); }

  protected async submit(): Promise<void> {
    if (this.pending() || this.session.loggingOut() || !this.online()) return;
    const errors: Record<string, string> = {};
    if (!this.email.trim()) errors['email'] = 'Gib deine E-Mail-Adresse ein.';
    if (!this.password) errors['password'] = 'Gib dein Passwort ein.';
    this.errors.set(errors);
    if (Object.keys(errors).length) {
      this.failed.set(true); this.status.set('Prüfe die markierten Felder.');
      this.focus(errors['email'] ? 'email' : 'password'); return;
    }
    this.pending.set(true); this.failed.set(false); this.status.set('Anmeldung läuft …');
    let attempt: number | null = null;
    try {
      const login = this.session.login(this.email, this.password);
      attempt = this.attempt = this.session.generation();
      this.version = this.attempt;
      const accepted = await login;
      if (!this.accepts(attempt)) return;
      this.status.set('');
      if (accepted) {
        this.email = ''; this.password = '';
        this.pending.set(false);
        await this.router.navigateByUrl('/monat');
      } else {
        this.failed.set(true);
        if (!this.session.notice()) this.status.set('Die Anmeldung wurde abgebrochen.');
        this.focus('feedback');
      }
    } catch (failure) {
      if (!this.accepts(attempt)) return;
      this.failed.set(true);
      this.status.set(failure instanceof HttpErrorResponse && failure.status === 401
        ? 'Anmeldung nicht möglich. Prüfe E-Mail-Adresse und Passwort.'
        : 'Die Anmeldung wurde nicht bestätigt. Versuche es erneut.');
      this.focus('feedback');
    } finally { if (this.accepts(attempt)) this.pending.set(false); }
  }
  private accepts(attempt: number | null): boolean {
    return this.active && attempt === this.attempt && attempt === this.session.generation();
  }
  private clear(): void {
    this.email = ''; this.password = ''; this.errors.set({}); this.status.set(''); this.failed.set(false); this.pending.set(false);
  }
  private focus(id: string): void {
    const version = this.session.generation();
    requestAnimationFrame(() => { if (this.active && version === this.session.generation()) document.getElementById(id)?.focus(); });
  }
}
