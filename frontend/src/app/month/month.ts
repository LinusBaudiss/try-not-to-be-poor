import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, HostListener, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, timeout } from 'rxjs';
import { BudgetResponse } from '../api/model/budgetResponse';
import { Session } from '../session/session';
import { LogoutButton } from '../session/logout-button';
import { SessionsService } from '../api/v2/api/sessions.service';
import { Expenses } from './expenses';
import { MonthSummary } from './month-summary';
import { MAX_CENTS, euroInput, formatEuro, parseEuro } from '../shared/money';

@Component({
  selector: 'app-month',
  imports: [FormsModule, Expenses, MonthSummary, LogoutButton],
  template: `<section class="auth-card" aria-labelledby="month-title">
    <h1 id="month-title">Monat</h1>
    <p id="identity-status" role="status" aria-live="polite" [class.error]="identityFailed()">{{ identityStatus() }}</p>
    @if (identityFailed()) { <button type="button" (click)="open()" [disabled]="opening() || !online()">Zugang erneut prüfen</button> }
    @if (identityConfirmed()) {
      <app-month-summary [revision]="summaryRevision()" (confirmedBudget)="reconcileBudget($event)" />
      <h2>Monatsbudget</h2>
      @if (loadFailed()) {
        <p class="error">Dein Monatsbudget konnte nicht geladen werden.</p>
        <button type="button" (click)="loadBudget()" [disabled]="!online()">Budget erneut laden</button>
      }
      @if (loaded()) {
        @if (amountCents() === null) {
          <p>Noch kein Monatsbudget festgelegt. Lege deinen fortlaufenden Betrag fest.</p>
        } @else {
          <p class="budget-value">Dein Monatsbudget: <strong class="money">{{ money(amountCents()!) }}</strong></p>
        }
        <p id="budget-scope" class="hint budget-scope">Dein Budget gilt für den laufenden Kalendermonat in Berlin und danach. Änderungen gelten sofort; frühere Monate behalten ihren Betrag.</p>
        <form (ngSubmit)="save()" novalidate [attr.aria-busy]="pending()">
          <div class="field">
            <label for="budget-amount">Monatsbudget in Euro</label>
            <input id="budget-amount" name="amount" type="text" inputmode="decimal" autocomplete="off" spellcheck="false"
              required [readOnly]="pending()" [ngModel]="draft" (ngModelChange)="editDraft($event)"
              [attr.aria-invalid]="!!fieldError()" [attr.aria-describedby]="fieldError() ? 'budget-hint budget-error' : 'budget-hint'">
            <p id="budget-hint" class="hint">Euro ohne Tausendertrennzeichen, z. B. 1200,50. Komma oder Punkt, höchstens zwei Nachkommastellen. 0 ist erlaubt.</p>
            @if (fieldError()) { <p id="budget-error" class="field-error">{{ fieldError() }}</p> }
          </div>
          @if (!online()) { <p class="error">Du bist offline. Dein Entwurf bleibt in diesem Tab erhalten. Speichern ist erst online möglich.</p> }
          <button type="submit" [disabled]="pending() || !online()">{{ pending() ? 'Budget wird gespeichert …' : 'Budget speichern' }}</button>
        </form>
      }
      <p id="budget-status" tabindex="-1" role="status" aria-live="polite" [class.error]="failed()" [class.success]="saved()">{{ status() }}</p>
      <app-expenses (changed)="refreshSummary()" />
    }
    <app-logout-button />
  </section>`
})
export class Month {
  protected readonly session = inject(Session);
  private readonly http = inject(HttpClient);
  private readonly access = inject(SessionsService);
  private readonly owner = this.session.userId();
  private readonly version = this.session.generation();
  private active = true;
  protected readonly summaryRevision = signal(0);
  protected refreshSummary(): void { this.summaryRevision.update(value => value + 1); }
  protected draft = '';
  private draftEdited = false;
  private confirmedRevision = 0;
  protected reconcileBudget(amount: number | null): void {
    if (!this.accepts()) return;
    ++this.confirmedRevision;
    this.amountCents.set(amount);
    if (this.loaded() && !this.draftEdited && !this.pending()) this.draft = amount === null ? '' : euroInput(amount);
  }
  protected readonly money = formatEuro;
  protected readonly identityStatus = signal('Sitzung wird geprüft …');
  protected readonly identityFailed = signal(false);
  protected readonly opening = signal(false);
  protected readonly identityConfirmed = signal(false);
  protected readonly amountCents = signal<number | null>(null);
  protected readonly loading = signal(false);
  protected readonly loaded = signal(false);
  protected readonly loadFailed = signal(false);
  protected readonly pending = signal(false);
  protected readonly online = signal(navigator.onLine);
  protected readonly failed = signal(false);
  protected readonly saved = signal(false);
  protected readonly status = signal('');
  protected readonly fieldError = signal('');
  private readonly amountError = 'Gib einen Betrag von 0 bis 90071992547409,91 Euro ohne Tausendertrennzeichen und mit höchstens zwei Nachkommastellen ein.';

  constructor() {
    effect(() => { if (this.session.userId() !== this.owner || this.session.generation() !== this.version) this.clear(); });
    inject(DestroyRef).onDestroy(() => { this.active = false; this.clear(); });
    void this.open();
  }

  @HostListener('window:online') connected(): void { this.online.set(true); }
  @HostListener('window:offline') disconnected(): void { this.online.set(false); }

  protected async open(): Promise<void> {
    if (this.opening() || !this.accepts()) return;
    this.opening.set(true);
    try { if (await this.verifyIdentity()) await this.loadBudget(); }
    finally { this.opening.set(false); }
  }

  protected editDraft(value: string): void {
    this.draft = value; this.draftEdited = true;
    this.saved.set(false); this.failed.set(false); this.fieldError.set(''); this.status.set('');
  }

  async verifyIdentity(): Promise<boolean> {
    try {
      const identity = await firstValueFrom(this.access.sessionIdentity().pipe(timeout(30_000)));
      if (!this.accepts() || identity.userId !== this.owner) return false;
      this.identityFailed.set(false); this.identityConfirmed.set(true);
      this.identityStatus.set('Du bist angemeldet. Deine persönliche Monatsübersicht ist geöffnet.');
      return true;
    } catch {
      if (this.accepts()) {
        this.identityFailed.set(true); this.identityConfirmed.set(false);
        this.identityStatus.set('Der Zugang konnte nicht geprüft werden.');
      }
      return false;
    }
  }

  protected async loadBudget(): Promise<void> {
    if (this.loading() || !this.accepts()) return;
    const revision = this.confirmedRevision;
    this.loading.set(true); this.loadFailed.set(false); this.failed.set(false); this.saved.set(false); this.status.set('Dein Monatsbudget wird geladen …');
    try {
      const result = await firstValueFrom(this.http.get<BudgetResponse>('/api/v1/expense-budget/budget').pipe(timeout(30_000)));
      if (!this.accepts()) return;
      if (!this.valid(result.amountCents)) throw new Error('Ungültige Budgetantwort.');
      if (revision === this.confirmedRevision) this.amountCents.set(result.amountCents);
      const confirmed = this.amountCents();
      this.draft = confirmed === null ? '' : euroInput(confirmed); this.draftEdited = false;
      this.loaded.set(true); this.status.set('');
    } catch {
      if (this.accepts()) { this.loadFailed.set(true); this.status.set('Budget nicht geladen. Versuche es erneut.'); this.failed.set(true); }
    } finally { if (this.accepts()) this.loading.set(false); }
  }

  protected async save(): Promise<void> {
    if (this.pending() || !this.online() || !this.loaded() || !this.accepts()) return;
    this.saved.set(false); this.failed.set(false); this.fieldError.set('');
    const amountCents = parseEuro(this.draft);
    if (amountCents === null) {
      this.fieldError.set(this.amountError); this.failed.set(true); this.status.set('Prüfe den Budgetbetrag.');
      this.focus('budget-amount'); return;
    }
    this.pending.set(true); this.status.set('Budget wird gespeichert …');
    try {
      const result = await firstValueFrom(this.http.put<BudgetResponse>('/api/v1/expense-budget/budget', { amountCents }).pipe(timeout(30_000)));
      if (!this.accepts()) return;
      if (result.amountCents !== amountCents) throw new Error('Speicherung nicht bestätigt.');
      this.amountCents.set(amountCents); this.draft = euroInput(amountCents); this.draftEdited = false;
      this.status.set('Dein Monatsbudget wurde gespeichert.'); this.saved.set(true); this.refreshSummary();
    } catch (failure) {
      if (!this.accepts()) return;
      this.failed.set(true);
      if (failure instanceof HttpErrorResponse && failure.status === 400) {
        this.fieldError.set(this.amountError); this.status.set('Prüfe den Budgetbetrag.'); this.focus('budget-amount');
      } else {
        this.status.set('Die Speicherung wurde nicht bestätigt. Dein Entwurf bleibt erhalten. Versuche es erneut.');
        this.focus('budget-status');
      }
    } finally { if (this.accepts()) this.pending.set(false); }
  }

  private accepts(): boolean { return this.active && this.version === this.session.generation() && this.owner === this.session.userId(); }
  private valid(value: unknown): value is number | null { return value === null || typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= MAX_CENTS; }
  private focus(id: string): void { requestAnimationFrame(() => { if (this.accepts()) document.getElementById(id)?.focus(); }); }
  private clear(): void {
    this.draft = ''; this.draftEdited = false; this.amountCents.set(null); this.status.set(''); this.fieldError.set('');
    this.loaded.set(false); this.loading.set(false); this.pending.set(false); this.identityConfirmed.set(false);
  }
}
