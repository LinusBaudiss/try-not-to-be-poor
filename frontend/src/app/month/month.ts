import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, HostListener, Injectable, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, timeout } from 'rxjs';
import { BudgetResponse } from '../api/v2/model/budgetResponse';
import { BudgetService } from '../api/v2/api/budget.service';
import { Session } from '../session/session';
import { LogoutButton } from '../session/logout-button';
import { SessionsService } from '../api/v2/api/sessions.service';
import { MonthSummary } from './month-summary';
import { MAX_CENTS, euroInput, formatEuro, parseEuro } from '../shared/money';

// Der Sitzungsschutz überlebt Bereichswechsel ohne Beträge oder Entwürfe zu behalten.
@Injectable({ providedIn: 'root' })
class BudgetOperations {
  private readonly session = inject(Session);
  private version = this.session.generation();
  private sequence = 0;
  readonly pending = signal(false);
  readonly uncertain = signal(false);
  constructor() { effect(() => { this.session.generation(); this.synchronize(); }); }
  synchronize(): void {
    if (this.version === this.session.generation()) return;
    this.version = this.session.generation(); ++this.sequence;
    this.pending.set(false); this.uncertain.set(false);
  }
  begin(): { version: number; sequence: number } {
    this.synchronize(); this.pending.set(true);
    return { version: this.version, sequence: ++this.sequence };
  }
  abandon(): void { this.synchronize(); if (this.pending()) this.uncertain.set(true); }
  settle(operation: { version: number; sequence: number }): void {
    this.synchronize();
    if (operation.version === this.version && operation.sequence === this.sequence) this.pending.set(false);
  }
}

@Component({
  selector: 'app-month',
  imports: [FormsModule, MonthSummary, LogoutButton],
  template: `<section class="auth-card" aria-labelledby="month-title">
    <h1 id="month-title" tabindex="-1">Monat</h1>
    <p id="identity-status" role="status" aria-live="polite" [class.error]="identityFailed()">{{ identityStatus() }}</p>
    @if (identityFailed()) { <button type="button" (click)="open()" [disabled]="opening() || !online()">Zugang erneut prüfen</button> }
    @if (identityConfirmed()) {
      <app-month-summary [revision]="summaryRevision()" [paused]="pending() || loading()" (confirmedBudget)="reconcileBudget($event)" />
      <h2>Monatsbudget</h2>
      @if (pending() && !loaded()) { <p id="budget-pending" role="status" aria-live="polite">Dein Monatsbudget wird noch gespeichert. Warte auf die Bestätigung, bevor du den aktuellen Stand prüfst.</p> }
      @if (loadFailed()) {
        <p class="error">Dein Monatsbudget konnte nicht geladen werden.</p>
        <button type="button" (click)="loadBudget()" [disabled]="pending() || loading() || !online()">Budget erneut laden</button>
      }
      @if (loaded()) {
        @if (amountCents() === null) {
          <p>Noch kein Monatsbudget festgelegt. Lege deinen fortlaufenden Betrag fest.</p>
        } @else {
          <p class="budget-value">Dein Monatsbudget: <strong class="money">{{ money(amountCents()!) }}</strong></p>
        }
        <p id="budget-scope" class="hint budget-scope">Dein Budget gilt für den laufenden Kalendermonat und danach. Änderungen gelten sofort; frühere Monate behalten ihren Betrag.</p>
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
          <button type="submit" [disabled]="pending() || loading() || !online() || uncertain()">{{ pending() ? 'Budget wird gespeichert …' : 'Budget speichern' }}</button>
        </form>
      }
      @if (uncertain()) {
        <div class="budget-uncertainty" role="status">
          <p>Die letzte Speicherung ist unbestätigt. Lade das aktuelle Budget und prüfe den gespeicherten Stand vor einem weiteren Versuch. Dein offener Entwurf bleibt erhalten.</p>
          <button type="button" (click)="loadBudget(true)" [disabled]="pending() || loading() || !online()">Budget zur Prüfung laden</button>
          <button type="button" (click)="confirmReview()" [disabled]="pending() || loading() || !reviewLoaded()">Ich habe das Budget geprüft</button>
        </div>
      }
      <p id="budget-status" tabindex="-1" role="status" aria-live="polite" [class.error]="failed()" [class.success]="saved()">{{ status() }}</p>
    }
    <app-logout-button />
  </section>`
})
export class Month {
  protected readonly session = inject(Session);
  private readonly budgets = inject(BudgetService);
  private readonly operations = inject(BudgetOperations);
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
  protected readonly pending = this.operations.pending;
  protected readonly uncertain = this.operations.uncertain;
  protected readonly reviewLoaded = signal(false);
  protected readonly online = signal(navigator.onLine);
  protected readonly failed = signal(false);
  protected readonly saved = signal(false);
  protected readonly status = signal('');
  protected readonly fieldError = signal('');
  private readonly amountError = 'Gib einen Betrag von 0 bis 90071992547409,91 Euro ohne Tausendertrennzeichen und mit höchstens zwei Nachkommastellen ein.';

  constructor() {
    this.operations.synchronize();
    let wasPending = this.pending();
    effect(() => {
      const pending = this.pending();
      if (wasPending && !pending && this.accepts() && this.identityConfirmed() && !this.loaded()) void this.loadBudget();
      wasPending = pending;
    });
    effect(() => { if (this.session.userId() !== this.owner || this.session.generation() !== this.version) this.clear(); });
    inject(DestroyRef).onDestroy(() => { this.operations.abandon(); this.active = false; this.clear(); });
    this.focus('month-title');
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

  protected async loadBudget(review = false): Promise<void> {
    if (this.loading() || this.pending() || !this.accepts()) return;
    const revision = this.confirmedRevision;
    this.reviewLoaded.set(false);
    this.loading.set(true); this.loadFailed.set(false); this.failed.set(false); this.saved.set(false); this.status.set('Dein Monatsbudget wird geladen …');
    try {
      const response = await firstValueFrom(this.budgets.getBudget('response').pipe(timeout(30_000)));
      if (!this.accepts()) return;
      if (response.status !== 200 || !this.validResponse(response.body)) throw new Error('Ungültige Budgetantwort.');
      if (revision !== this.confirmedRevision) return;
      this.amountCents.set(response.body.amountCents);
      if (!this.draftEdited) this.draft = response.body.amountCents === null ? '' : euroInput(response.body.amountCents);
      this.loaded.set(true); this.status.set('');
      this.refreshSummary();
      if (review && this.uncertain()) {
        this.reviewLoaded.set(true);
        this.status.set('Aktuelles Budget geladen. Prüfe den gespeicherten Betrag und deinen Entwurf vor einem weiteren Speichern.');
        this.focus('budget-status');
      }
    } catch {
      if (this.accepts()) { this.loadFailed.set(true); this.status.set('Budget nicht geladen. Versuche es erneut.'); this.failed.set(true); }
    } finally { if (this.accepts()) this.loading.set(false); }
  }

  protected confirmReview(): void {
    if (!this.accepts() || this.pending() || this.loading() || !this.reviewLoaded()) return;
    this.uncertain.set(false); this.reviewLoaded.set(false);
    this.status.set('Du hast den aktuellen Stand geprüft. Du kannst deinen Entwurf jetzt ausdrücklich speichern.');
    this.focus('budget-amount');
  }

  protected async save(): Promise<void> {
    if (this.pending() || this.loading() || this.uncertain() || !this.online() || !this.loaded() || !this.accepts()) return;
    this.saved.set(false); this.failed.set(false); this.fieldError.set('');
    const amountCents = parseEuro(this.draft);
    if (amountCents === null) {
      this.fieldError.set(this.amountError); this.failed.set(true); this.status.set('Prüfe den Budgetbetrag.');
      this.focus('budget-amount'); return;
    }
    ++this.confirmedRevision;
    const operation = this.operations.begin(); this.status.set('Budget wird gespeichert …');
    try {
      const response = await firstValueFrom(this.budgets.putBudget({ amountCents }, 'response').pipe(timeout(30_000)));
      const result = response.body;
      if (!this.accepts()) return;
      if (response.status !== 200 || !this.validResponse(result) || result.amountCents !== amountCents) throw new Error('Speicherung nicht bestätigt.');
      ++this.confirmedRevision;
      this.amountCents.set(amountCents); this.draft = euroInput(amountCents); this.draftEdited = false;
      this.status.set('Dein Monatsbudget wurde gespeichert.'); this.saved.set(true); this.refreshSummary();
    } catch (failure) {
      if (!this.accepts()) return;
      this.failed.set(true);
      if (failure instanceof HttpErrorResponse && failure.status === 400) {
        this.fieldError.set(this.amountError); this.status.set('Prüfe den Budgetbetrag.'); this.focus('budget-amount');
      } else {
        this.uncertain.set(true); this.reviewLoaded.set(false);
        this.status.set('Die Speicherung wurde nicht bestätigt. Dein Entwurf bleibt erhalten. Lade das Budget zur Prüfung, bevor du erneut speicherst.');
        this.focus('budget-status');
      }
    } finally { this.operations.settle(operation); }
  }

  private accepts(): boolean { return this.active && this.version === this.session.generation() && this.owner === this.session.userId(); }
  private validResponse(value: unknown): value is BudgetResponse {
    return !!value && typeof value === 'object' && Object.keys(value).length === 1 && Object.hasOwn(value, 'amountCents') && this.valid((value as BudgetResponse).amountCents);
  }
  private valid(value: unknown): value is number | null { return value === null || typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= MAX_CENTS; }
  private focus(id: string): void { requestAnimationFrame(() => { if (this.accepts()) document.getElementById(id)?.focus(); }); }
  private clear(): void {
    this.draft = ''; this.draftEdited = false; this.amountCents.set(null); this.status.set(''); this.fieldError.set('');
    this.loaded.set(false); this.loading.set(false); this.reviewLoaded.set(false); this.identityConfirmed.set(false);
  }
}
