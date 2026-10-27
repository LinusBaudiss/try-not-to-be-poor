import { Component, HostListener, inject, input, signal } from '@angular/core';
import { Session } from './session';

@Component({
  selector: 'app-logout-button',
  template: `<button type="button" class="logout-action" [disabled]="session.loggingOut() || retry() && !online()"
    [attr.aria-busy]="session.loggingOut()" (click)="session.logout()">
    {{ session.loggingOut() ? 'Abmeldung läuft …' : retry() ? 'Abmeldung erneut versuchen' : 'Abmelden' }}
  </button>`
})
export class LogoutButton {
  protected readonly session = inject(Session);
  protected readonly online = signal(navigator.onLine);
  readonly retry = input(false);

  @HostListener('window:online') connected(): void { this.online.set(true); }
  @HostListener('window:offline') disconnected(): void { this.online.set(false); }
}
