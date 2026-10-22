import { HttpErrorResponse } from '@angular/common/http';
import { Component, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { timeout } from 'rxjs';
import { AccessService } from '../api/api/access.service';
import { ApiError } from '../api/model/apiError';

@Component({
  selector: 'app-registration',
  imports: [FormsModule],
  template: `
    <section class="auth-card" aria-labelledby="registration-title">
      <h1 id="registration-title">Eigenes Konto anlegen</h1>
      @if (!success()) {
        <p>Lege dein persönliches Konto mit deiner E-Mail-Adresse und einem Passwort an.</p>
      }
      <p id="feedback" tabindex="-1" role="status" aria-live="polite" [class.error]="failed()"
         [class.success]="success()">{{ status() }}</p>
      @if (!success()) {
        <form (ngSubmit)="submit()" novalidate [attr.aria-busy]="pending()">
          <div class="field">
            <label for="email">E-Mail-Adresse</label>
            <input id="email" name="email" type="email" inputmode="email" autocomplete="username"
              spellcheck="false" required [readOnly]="pending()" [ngModel]="email()"
              (ngModelChange)="email.set($event)" [attr.aria-invalid]="!!errors().email"
              [attr.aria-describedby]="errors().email ? 'email-error' : null">
            @if (errors().email) { <p class="field-error" id="email-error">{{ errors().email }}</p> }
          </div>
          <div class="field">
            <label for="password">Passwort</label>
            <input id="password" name="password" type="password" autocomplete="new-password" required
              [readOnly]="pending()" [ngModel]="password()" (ngModelChange)="password.set($event)"
              [attr.aria-invalid]="!!errors().password"
              [attr.aria-describedby]="errors().password ? 'password-hint password-error' : 'password-hint'">
            <p class="hint" id="password-hint">15 bis 64 Zeichen. Leerzeichen und Unicode sind erlaubt.</p>
            @if (errors().password) { <p class="field-error" id="password-error">{{ errors().password }}</p> }
          </div>
          @if (!online()) { <p class="error">Du bist offline. Deine Eingaben bleiben in diesem Tab erhalten.</p> }
          <button type="submit" [disabled]="pending() || !online() || !token">
            {{ pending() ? 'Konto wird angelegt …' : 'Konto anlegen' }}
          </button>
        </form>
      }
    </section>`
})
export class Registration {
  private readonly api = inject(AccessService);
  protected token = new URLSearchParams(window.location.hash.slice(1)).get('registrationToken') ?? '';
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly pending = signal(false);
  protected readonly success = signal(false);
  protected readonly failed = signal(!this.token);
  protected readonly online = signal(navigator.onLine);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly status = signal(this.token ? '' : 'Öffne einen gültigen Registrierungslink, um ein Konto anzulegen.');

  constructor() {
    // Das Geheimnis bleibt ausschließlich im Speicher dieses Tabs und verlässt die URL sofort.
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  @HostListener('window:online')
  connected(): void { this.online.set(true); }

  @HostListener('window:hashchange')
  newLink(): void {
    if (window.location.hash) window.location.reload();
  }

  @HostListener('window:offline')
  disconnected(): void { this.online.set(false); }

  protected submit(): void {
    if (this.pending() || !this.online() || this.success() || !this.token) return;
    this.errors.set({});
    this.failed.set(false);
    this.pending.set(true);
    this.status.set('Dein Konto wird angelegt …');
    this.api.register({ registrationToken: this.token, email: this.email(), password: this.password() }).pipe(timeout(30_000)).subscribe({
      next: () => {
        this.password.set('');
        this.token = '';
        this.pending.set(false);
        this.success.set(true);
        this.status.set('Dein Konto wurde angelegt.');
        this.focus('feedback');
      },
      error: (response: HttpErrorResponse) => {
        const body = response.error as Partial<ApiError> | null;
        const fields: Record<string, string> = {};
        for (const key of ['email', 'password']) {
          const value = body?.fieldErrors?.[key];
          if (response.status === 400 && typeof value === 'string') fields[key] = value;
        }
        this.pending.set(false);
        this.failed.set(true);
        this.errors.set(fields);
        this.status.set(response.status === 400
          ? (Object.keys(fields).length ? 'Prüfe die markierten Felder.' : 'Registrierung nicht möglich. Prüfe deine Angaben und den Registrierungslink.')
          : 'Die Bestätigung ist ausgeblieben. Ob dein Konto angelegt wurde, ist unklar. Deine Eingaben bleiben erhalten. Versuche es erneut.');
        this.focus(fields['email'] ? 'email' : fields['password'] ? 'password' : 'feedback');
      }
    });
  }

  private focus(id: string): void {
    requestAnimationFrame(() => document.getElementById(id)?.focus());
  }
}
