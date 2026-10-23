import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, HostListener, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, timeout } from 'rxjs';
import { SavingsGoalResponse } from '../api/model/savingsGoalResponse';
import { Session } from '../session/session';
import { MAX_CENTS, formatEuro, parseEuro } from '../shared/money';

@Component({
  selector: 'app-savings-goals',
  imports: [FormsModule],
  template: `<section class="auth-card" aria-labelledby="savings-title">
    <h1 id="savings-title">Sparziele</h1>
    <p role="status" aria-live="polite" [class.error]="identityFailed()">{{ identityStatus() }}</p>
    @if (identityFailed()) { <button type="button" (click)="open()" [disabled]="opening() || !online()">Zugang erneut prüfen</button> }
    @if (identityConfirmed()) {
      <h2 id="goals-list-title">Deine Sparziele</h2>
      <p id="goals-list-status" role="status" aria-live="polite" aria-atomic="true" [class.savings-placeholder]="loading()" [class.error]="loadFailed()">{{ listStatus() }}</p>
      @if (loaded()) {
        @if (items().length === 0) {
          <button type="button" (click)="focusName()">Sparziel anlegen</button>
        } @else {
          <ul class="savings-cards" aria-labelledby="goals-list-title">
            @for (goal of items(); track goal.id) {
              <li><h3>{{ goal.name }}</h3><dl>
                <div><dt>Zielbetrag</dt><dd class="money">{{ money(goal.targetAmountCents) }}</dd></div>
                <div><dt>Fortschritt</dt><dd>{{ money(goal.progressCents) }}</dd></div>
                @if (goal.targetDate) { <div><dt>Zieldatum</dt><dd>{{ date(goal.targetDate) }}</dd></div> }
              </dl></li>
            }
          </ul>
        }
      }
      <button id="goals-refresh" class="secondary" type="button" (click)="load()" [disabled]="pending() || !online()" [attr.aria-disabled]="loading() || pending() || !online()">{{ loading() ? 'Sparziele laden …' : loadFailed() ? 'Sparziele erneut laden' : 'Sparziele aktualisieren' }}</button>
      <h2 class="savings-form-title">Neues Sparziel</h2>
      <form (ngSubmit)="save()" novalidate [attr.aria-busy]="pending()">
        <div class="field">
          <label for="goal-name">Name des Sparziels</label>
          <input id="goal-name" name="name" type="text" autocomplete="off" required [readOnly]="pending()"
            [ngModel]="name" (ngModelChange)="edit('name', $event)" [attr.aria-invalid]="!!nameError()"
            [attr.aria-describedby]="nameError() ? 'goal-name-error' : null">
          @if (nameError()) { <p id="goal-name-error" class="field-error">{{ nameError() }}</p> }
        </div>
        <div class="field">
          <label for="goal-amount">Zielbetrag in Euro</label>
          <input id="goal-amount" name="amount" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" required [readOnly]="pending()"
            [ngModel]="amount" (ngModelChange)="edit('amount', $event)" [attr.aria-invalid]="!!amountError()"
            [attr.aria-describedby]="amountError() ? 'goal-amount-hint goal-amount-error' : 'goal-amount-hint'">
          <p id="goal-amount-hint" class="hint">Euro ohne Tausendertrennzeichen, z. B. 1200,50. Komma oder Punkt, höchstens zwei Nachkommastellen. Der Zielbetrag muss positiv sein.</p>
          @if (amountError()) { <p id="goal-amount-error" class="field-error">{{ amountError() }}</p> }
        </div>
        <div class="field">
          <label for="goal-date">Zieldatum (optional)</label>
          <input id="goal-date" name="targetDate" type="text" inputmode="text" placeholder="JJJJ-MM-TT" autocomplete="off" [readOnly]="pending()"
            [ngModel]="targetDate" (ngModelChange)="edit('targetDate', $event)" [attr.aria-invalid]="!!dateError()"
            [attr.aria-describedby]="dateError() ? 'goal-date-hint goal-date-error' : 'goal-date-hint'">
          <p id="goal-date-hint" class="hint">Kalenderdatum im Format JJJJ-MM-TT, z. B. 2028-02-29. Vergangene Daten sind erlaubt.</p>
          @if (dateError()) { <p id="goal-date-error" class="field-error">{{ dateError() }}</p> }
        </div>
        @if (!online()) { <p class="error" role="status">Du bist offline. Dein Entwurf bleibt in diesem Tab erhalten. Speichern ist erst online möglich.</p> }
        <button type="submit" [disabled]="pending() || loading() || !loaded() || !online()">{{ pending() ? 'Sparziel wird gespeichert …' : 'Sparziel speichern' }}</button>
      </form>
      <p id="goal-status" tabindex="-1" role="status" aria-live="polite" [class.error]="failed()" [class.success]="saved()">{{ status() }}</p>
    }
    <button type="button" class="secondary" (click)="session.logout()">Abmelden</button>
  </section>`
})
export class SavingsGoals {
  protected readonly session = inject(Session);
  private readonly http = inject(HttpClient);
  private readonly owner = this.session.userId();
  private readonly version = this.session.generation();
  private active = true;
  protected name = '';
  protected amount = '';
  protected targetDate = '';
  protected readonly identityStatus = signal('Sitzung wird geprüft …');
  protected readonly identityFailed = signal(false);
  protected readonly identityConfirmed = signal(false);
  protected readonly opening = signal(false);
  protected readonly items = signal<SavingsGoalResponse[]>([]);
  protected readonly loaded = signal(false);
  protected readonly loading = signal(false);
  protected readonly loadFailed = signal(false);
  protected readonly listStatus = computed(() => this.loading() ? 'Deine Sparziele werden geladen …'
    : this.loadFailed() ? 'Deine Sparziele konnten nicht geladen werden.'
    : !this.loaded() ? '' : this.items().length === 0 ? 'Noch keine Sparziele angelegt.'
    : this.items().length === 1 ? '1 Sparziel geladen.' : `${this.items().length} Sparziele geladen.`);
  protected readonly pending = signal(false);
  protected readonly online = signal(navigator.onLine);
  protected readonly status = signal('');
  protected readonly saved = signal(false);
  protected readonly failed = signal(false);
  protected readonly nameError = signal('');
  protected readonly amountError = signal('');
  protected readonly dateError = signal('');
  protected readonly money = formatEuro;
  protected readonly date = (value: string) => value.split('-').reverse().join('.');
  private readonly positiveAmount = 'Gib einen positiven Zielbetrag bis 90071992547409,91 Euro ohne Tausendertrennzeichen mit höchstens zwei Nachkommastellen ein.';

  constructor() {
    effect(() => { if (this.session.userId() !== this.owner || this.session.generation() !== this.version) this.clear(); });
    inject(DestroyRef).onDestroy(() => { this.active = false; this.clear(); });
    void this.open();
  }
  @HostListener('window:online') connected(): void { this.online.set(true); }
  @HostListener('window:offline') disconnected(): void { this.online.set(false); }
  protected async open(): Promise<void> {
    if (!this.accepts() || this.opening()) return;
    this.opening.set(true); this.identityFailed.set(false);
    try {
      const identity = await firstValueFrom(this.http.get<{ userId: string }>('/api/v1/access/me').pipe(timeout(30_000)));
      if (!this.accepts()) return;
      if (identity?.userId !== this.owner) throw new Error('Identität nicht bestätigt.');
      this.identityConfirmed.set(true); this.identityStatus.set('Du bist angemeldet. Deine persönlichen Sparziele sind geöffnet.');
      await this.load();
    } catch {
      if (this.accepts()) { this.identityConfirmed.set(false); this.identityFailed.set(true); this.identityStatus.set('Der Zugang konnte nicht geprüft werden.'); }
    } finally { if (this.accepts()) this.opening.set(false); }
  }
  protected edit(field: 'name' | 'amount' | 'targetDate', value: string): void {
    this[field] = value; this.saved.set(false); this.failed.set(false); this.status.set('');
    (field === 'name' ? this.nameError : field === 'amount' ? this.amountError : this.dateError).set('');
  }
  protected async load(): Promise<void> {
    if (!this.accepts() || !this.identityConfirmed() || this.loading() || this.pending()) return;
    this.items.set([]); this.loaded.set(false); this.loading.set(true); this.loadFailed.set(false);
    try {
      const result = await firstValueFrom(this.http.get<SavingsGoalResponse[]>('/api/v1/savings-goals').pipe(timeout(30_000)));
      if (!this.accepts()) return;
      if (!Array.isArray(result) || !result.every(value => this.valid(value)) || new Set(result.map(value => value.id)).size !== result.length)
        throw new Error('Ungültige Sparzielantwort.');
      this.items.set(this.sort(result)); this.loaded.set(true);
    } catch { if (this.accepts()) this.loadFailed.set(true); }
    finally { if (this.accepts()) this.loading.set(false); }
  }
  protected async save(): Promise<void> {
    if (!this.accepts() || !this.identityConfirmed() || this.pending() || this.loading() || !this.loaded() || !this.online()) return;
    this.saved.set(false); this.failed.set(false); this.nameError.set(''); this.amountError.set(''); this.dateError.set('');
    const name = this.name.trim(), targetAmountCents = parseEuro(this.amount), targetDate = this.targetDate;
    if (!name) this.nameError.set('Gib einen Namen für das Sparziel ein.');
    if (name.includes('\0')) this.nameError.set('Entferne das Nullzeichen aus dem Namen des Sparziels.');
    if (targetAmountCents === null || targetAmountCents === 0) this.amountError.set(this.positiveAmount);
    if (targetDate && !this.validDate(targetDate)) this.dateError.set('Gib ein gültiges Kalenderdatum im Format JJJJ-MM-TT ein.');
    if (this.nameError() || this.amountError() || this.dateError()) {
      this.failed.set(true); this.status.set('Prüfe die Eingaben für dein Sparziel.'); this.focusError(); return;
    }
    this.pending.set(true); this.status.set('Sparziel wird gespeichert …');
    try {
      const response = await firstValueFrom(this.http.post<SavingsGoalResponse>('/api/v1/savings-goals',
        { name, targetAmountCents, targetDate: targetDate || null }, { observe: 'response' }).pipe(timeout(30_000)));
      if (!this.accepts()) return;
      const result = response.body;
      if (response.status !== 201 || !this.valid(result) || result.name !== name || result.targetAmountCents !== targetAmountCents
        || result.progressCents !== 0 || (result.targetDate ?? null) !== (targetDate || null) || this.items().some(value => value.id === result.id))
        throw new Error('Speicherung nicht bestätigt.');
      this.items.set(this.sort([...this.items(), result])); this.name = ''; this.amount = ''; this.targetDate = '';
      this.status.set('Dein Sparziel wurde gespeichert.'); this.saved.set(true); this.focusName();
    } catch (failure) {
      if (!this.accepts()) return;
      this.failed.set(true);
      if (failure instanceof HttpErrorResponse && failure.status === 400) {
        const fields = failure.error?.fieldErrors;
        if (typeof fields?.name === 'string') this.nameError.set(fields.name);
        if (typeof fields?.targetAmountCents === 'string') this.amountError.set(fields.targetAmountCents);
        if (typeof fields?.targetDate === 'string') this.dateError.set(fields.targetDate);
        this.status.set('Das Sparziel wurde nicht gespeichert. Prüfe die Eingaben.'); this.focusError();
      } else {
        this.status.set('Die Speicherung wurde nicht bestätigt. Das Sparziel wurde möglicherweise bereits gespeichert. Dein Entwurf bleibt erhalten. Aktualisiere und prüfe vor erneutem Speichern die Sparziele, um Duplikate zu vermeiden.');
        this.focus('goal-status');
      }
    } finally { if (this.accepts()) this.pending.set(false); }
  }
  protected focusName(): void { this.focus('goal-name'); }
  private focusError(): void { this.focus(this.nameError() ? 'goal-name' : this.amountError() ? 'goal-amount' : this.dateError() ? 'goal-date' : 'goal-status'); }
  private accepts(): boolean { return this.active && !!this.owner && this.owner === this.session.userId() && this.version === this.session.generation(); }
  private focus(id: string): void { requestAnimationFrame(() => { if (this.accepts()) document.getElementById(id)?.focus(); }); }
  private sort(values: SavingsGoalResponse[]): SavingsGoalResponse[] { return [...values].sort((a, b) => a.id.localeCompare(b.id)); }
  private valid(value: unknown): value is SavingsGoalResponse {
    if (!value || typeof value !== 'object') return false;
    const g = value as SavingsGoalResponse;
    return typeof g.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(g.id)
      && typeof g.name === 'string' && !!g.name.trim() && !g.name.includes('\0')
      && Number.isSafeInteger(g.targetAmountCents) && g.targetAmountCents > 0 && g.targetAmountCents <= MAX_CENTS
      && Number.isSafeInteger(g.progressCents) && g.progressCents >= 0 && g.progressCents <= MAX_CENTS
      && (g.targetDate === undefined || g.targetDate === null || typeof g.targetDate === 'string' && this.validDate(g.targetDate));
  }
  private validDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return year > 0 && month > 0 && month <= 12 && day > 0 && day <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  }
  private clear(): void {
    this.name = ''; this.amount = ''; this.targetDate = ''; this.items.set([]); this.loaded.set(false); this.loading.set(false);
    this.pending.set(false); this.opening.set(false); this.identityConfirmed.set(false); this.identityFailed.set(false); this.identityStatus.set('');
    this.status.set(''); this.nameError.set(''); this.amountError.set(''); this.dateError.set(''); this.saved.set(false); this.failed.set(false); this.loadFailed.set(false);
  }
}
