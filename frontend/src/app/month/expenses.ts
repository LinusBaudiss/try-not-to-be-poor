import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, HostListener, effect, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, timeout } from 'rxjs';
import { ExpenseResponse } from '../api/model/expenseResponse';
import { Session } from '../session/session';
import { MAX_CENTS, formatEuro, parseEuro } from '../shared/money';

@Component({
  selector: 'app-expenses',
  imports: [FormsModule],
  template: `<section class="expenses" aria-labelledby="expenses-title">
    <h2 id="expenses-title">Ausgaben</h2>
    <form (ngSubmit)="save()" novalidate [attr.aria-busy]="pending()">
      <h3>Ausgabe erfassen</h3>
      <div class="field">
        <label for="expense-name">Name der Ausgabe</label>
        <input id="expense-name" name="name" type="text" autocomplete="off" required
          [readOnly]="pending()" [ngModel]="name" (ngModelChange)="edit('name', $event)"
          [attr.aria-invalid]="!!nameError()" [attr.aria-describedby]="nameError() ? 'expense-name-error' : null">
        @if (nameError()) { <p id="expense-name-error" class="field-error">{{ nameError() }}</p> }
      </div>
      <div class="field">
        <label for="expense-amount">Ausgabenbetrag in Euro</label>
        <input id="expense-amount" name="amount" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" required
          [readOnly]="pending()" [ngModel]="amount" (ngModelChange)="edit('amount', $event)"
          [attr.aria-invalid]="!!amountError()" [attr.aria-describedby]="amountError() ? 'expense-hint expense-amount-error' : 'expense-hint'">
        <p id="expense-hint" class="hint">Positiver Eurobetrag ohne Tausendertrennzeichen, z. B. 12,50. Komma oder Punkt, höchstens zwei Nachkommastellen. Das Datum wird automatisch in Berlin gesetzt.</p>
        @if (amountError()) { <p id="expense-amount-error" class="field-error">{{ amountError() }}</p> }
      </div>
      @if (!online()) { <p class="error">Du bist offline. Dein Entwurf bleibt in diesem Tab erhalten. Speichern ist erst online möglich.</p> }
      <button type="submit" [disabled]="pending() || loading() || !loaded() || !online()">{{ pending() ? 'Ausgabe wird gespeichert …' : 'Ausgabe speichern' }}</button>
    </form>
    <p id="expense-status" tabindex="-1" role="status" aria-live="polite" [class.error]="failed()" [class.success]="saved()">{{ status() }}</p>
    <h3 id="history-title">Alle Ausgaben</h3>
    @if (loaded()) {
      <button type="button" (click)="load()" [disabled]="pending() || !online()">Ausgaben aktualisieren</button>
    }
    @if (loading()) { <p role="status">Deine Ausgaben werden geladen …</p> }
    @if (loadFailed()) {
      <p class="error" role="status">Deine Ausgaben konnten nicht geladen werden.</p>
      <button type="button" (click)="load()" [disabled]="!online()">Ausgaben erneut laden</button>
    }
    @if (loaded()) {
      @if (items().length === 0) {
        <p>Noch keine Ausgaben erfasst.</p>
        <button type="button" (click)="focusName()">Ausgabe erfassen</button>
      } @else {
        <ul class="expense-cards" aria-labelledby="history-title">
          @for (expense of items(); track expense.id) {
            <li><dl>
              <div><dt>Name</dt><dd>{{ expense.name }}</dd></div>
              <div><dt>Betrag</dt><dd class="expense-amount">{{ money(expense.amountCents) }}</dd></div>
              <div><dt>Datum</dt><dd>{{ date(expense.recordedOn) }}</dd></div>
            </dl></li>
          }
        </ul>
        <table class="expense-table" aria-labelledby="history-title">
          <thead><tr><th scope="col">Name</th><th scope="col">Betrag</th><th scope="col">Datum</th></tr></thead>
          <tbody>@for (expense of items(); track expense.id) {
            <tr><td>{{ expense.name }}</td><td class="expense-amount">{{ money(expense.amountCents) }}</td><td>{{ date(expense.recordedOn) }}</td></tr>
          }</tbody>
        </table>
      }
    }
  </section>`
})
export class Expenses {
  readonly changed = output<void>();
  private readonly session = inject(Session);
  private readonly http = inject(HttpClient);
  private readonly owner = this.session.userId();
  private readonly version = this.session.generation();
  private active = true;
  protected name = '';
  protected amount = '';
  protected readonly items = signal<ExpenseResponse[]>([]);
  protected readonly loaded = signal(false);
  protected readonly loading = signal(false);
  protected readonly loadFailed = signal(false);
  protected readonly pending = signal(false);
  protected readonly online = signal(navigator.onLine);
  protected readonly status = signal('');
  protected readonly saved = signal(false);
  protected readonly failed = signal(false);
  protected readonly nameError = signal('');
  protected readonly amountError = signal('');
  protected readonly money = formatEuro;
  protected readonly date = (value: string) => value.split('-').reverse().join('.');
  private readonly positiveAmount = 'Gib einen positiven Betrag bis 90071992547409,91 Euro ohne Tausendertrennzeichen mit höchstens zwei Nachkommastellen ein.';

  constructor() {
    effect(() => { if (this.session.userId() !== this.owner || this.session.generation() !== this.version) this.clear(); });
    inject(DestroyRef).onDestroy(() => { this.active = false; this.clear(); });
    void this.load(false);
  }
  @HostListener('window:online') connected(): void { this.online.set(true); }
  @HostListener('window:offline') disconnected(): void { this.online.set(false); }
  protected edit(field: 'name' | 'amount', value: string): void {
    this[field] = value;
    this.saved.set(false); this.failed.set(false); this.status.set('');
    (field === 'name' ? this.nameError : this.amountError).set('');
  }
  protected async load(notify = true): Promise<void> {
    if (!this.accepts() || this.loading() || this.pending()) return;
    this.items.set([]); this.loaded.set(false); this.loading.set(true); this.loadFailed.set(false);
    try {
      const result = await firstValueFrom(this.http.get<ExpenseResponse[]>('/api/v1/expense-budget/expenses').pipe(timeout(30_000)));
      if (!this.accepts()) return;
      if (!Array.isArray(result) || !result.every(value => this.valid(value)) || new Set(result.map(value => value.id)).size !== result.length)
        throw new Error('Ungültige Ausgabenantwort.');
      this.items.set(this.sort(result)); this.loaded.set(true); if (notify) this.changed.emit();
    } catch { if (this.accepts()) this.loadFailed.set(true); }
    finally { if (this.accepts()) this.loading.set(false); }
  }
  protected async save(): Promise<void> {
    if (!this.accepts() || this.pending() || this.loading() || !this.loaded() || !this.online()) return;
    this.saved.set(false); this.failed.set(false); this.nameError.set(''); this.amountError.set('');
    const name = this.name.trim(), amountCents = parseEuro(this.amount);
    if (!name) this.nameError.set('Gib einen Namen für die Ausgabe ein.');
    if (amountCents === null || amountCents === 0) this.amountError.set(this.positiveAmount);
    if (this.nameError() || this.amountError()) {
      this.failed.set(true); this.status.set('Prüfe Name und Betrag.');
      this.focus(this.nameError() ? 'expense-name' : 'expense-amount'); return;
    }
    this.pending.set(true); this.status.set('Ausgabe wird gespeichert …');
    try {
      const result = await firstValueFrom(this.http.post<ExpenseResponse>('/api/v1/expense-budget/expenses', { name, amountCents }).pipe(timeout(30_000)));
      if (!this.accepts()) return;
      if (!this.valid(result) || result.name !== name || result.amountCents !== amountCents || this.items().some(value => value.id === result.id))
        throw new Error('Speicherung nicht bestätigt.');
      this.items.set(this.sort([...this.items(), result])); this.name = ''; this.amount = '';
      this.status.set('Deine Ausgabe wurde gespeichert.'); this.saved.set(true); this.changed.emit(); this.focus('expense-name');
    } catch (failure) {
      if (!this.accepts()) return;
      this.failed.set(true);
      if (failure instanceof HttpErrorResponse && failure.status === 400) {
        const fields = failure.error?.fieldErrors;
        if (typeof fields?.name === 'string') this.nameError.set(fields.name);
        if (typeof fields?.amountCents === 'string') this.amountError.set(fields.amountCents);
        this.status.set('Die Ausgabe wurde nicht gespeichert. Prüfe die Eingaben.');
        this.focus(this.nameError() ? 'expense-name' : this.amountError() ? 'expense-amount' : 'expense-status');
      } else {
        this.status.set('Die Speicherung wurde nicht bestätigt. Die Ausgabe wurde möglicherweise bereits gespeichert. Dein Entwurf bleibt erhalten. Aktualisiere und prüfe vor erneutem Speichern die Historie, um Duplikate zu vermeiden.');
        this.focus('expense-status');
      }
    } finally { if (this.accepts()) this.pending.set(false); }
  }
  protected focusName(): void { this.focus('expense-name'); }
  private accepts(): boolean { return this.active && !!this.owner && this.owner === this.session.userId() && this.version === this.session.generation(); }
  private focus(id: string): void { requestAnimationFrame(() => { if (this.accepts()) document.getElementById(id)?.focus(); }); }
  private sort(values: ExpenseResponse[]): ExpenseResponse[] {
    return [...values].sort((a, b) => b.recordedOn.localeCompare(a.recordedOn) || a.id.localeCompare(b.id));
  }
  private valid(value: unknown): value is ExpenseResponse {
    if (!value || typeof value !== 'object') return false;
    const e = value as ExpenseResponse;
    return typeof e.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(e.id)
      && typeof e.name === 'string' && !!e.name.trim() && Number.isSafeInteger(e.amountCents) && e.amountCents > 0 && e.amountCents <= MAX_CENTS
      && typeof e.recordedOn === 'string' && this.validDate(e.recordedOn);
  }
  private validDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return year > 0 && month > 0 && month <= 12 && day > 0 && day <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  }
  private clear(): void {
    this.name = ''; this.amount = ''; this.items.set([]); this.loaded.set(false); this.loading.set(false);
    this.pending.set(false); this.status.set(''); this.nameError.set(''); this.amountError.set(''); this.saved.set(false); this.failed.set(false);
  }
}
