import { Component, DestroyRef, HostListener, effect, inject, signal } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { SessionsService } from '../api/v2/api/sessions.service';
import { Session } from '../session/session';
import { LogoutButton } from '../session/logout-button';
import { Expenses } from './expenses';

@Component({
  selector: 'app-expenses-page',
  imports: [Expenses, LogoutButton],
  template: `<section class="auth-card" aria-labelledby="expenses-page-title">
    <h1 id="expenses-page-title" tabindex="-1">Ausgaben</h1>
    <p role="status" aria-live="polite" [class.error]="failed()">{{ status() }}</p>
    @if (failed()) { <button type="button" (click)="open()" [disabled]="opening() || !online()">Zugang erneut prüfen</button> }
    @if (confirmed()) { <app-expenses /> }
    <app-logout-button />
  </section>`
})
export class ExpensesPage {
  private readonly session = inject(Session);
  private readonly access = inject(SessionsService);
  private readonly owner = this.session.userId();
  private readonly version = this.session.generation();
  private active = true;
  protected readonly confirmed = signal(false);
  protected readonly opening = signal(false);
  protected readonly failed = signal(false);
  protected readonly online = signal(navigator.onLine);
  protected readonly status = signal('Sitzung wird geprüft …');

  constructor() {
    effect(() => { if (this.session.userId() !== this.owner || this.session.generation() !== this.version) this.clear(); });
    inject(DestroyRef).onDestroy(() => { this.active = false; this.clear(); });
    requestAnimationFrame(() => { if (this.accepts()) document.getElementById('expenses-page-title')?.focus(); });
    void this.open();
  }
  @HostListener('window:online') connected(): void { this.online.set(true); }
  @HostListener('window:offline') disconnected(): void { this.online.set(false); }
  protected async open(): Promise<void> {
    if (!this.accepts() || this.opening()) return;
    this.opening.set(true);
    try {
      const identity = await firstValueFrom(this.access.sessionIdentity().pipe(timeout(30_000)));
      if (!this.accepts()) return;
      if (identity.userId !== this.owner) throw new Error('Ungültige Identität.');
      this.confirmed.set(true); this.failed.set(false);
      this.status.set('Du bist angemeldet. Deine persönlichen Ausgaben sind geöffnet.');
    } catch {
      if (this.accepts()) { this.confirmed.set(false); this.failed.set(true); this.status.set('Der Zugang konnte nicht geprüft werden.'); }
    } finally { if (this.accepts()) this.opening.set(false); }
  }
  private accepts(): boolean { return this.active && !!this.owner && this.owner === this.session.userId() && this.version === this.session.generation(); }
  private clear(): void { this.confirmed.set(false); this.opening.set(false); this.failed.set(false); this.status.set(''); }
}
