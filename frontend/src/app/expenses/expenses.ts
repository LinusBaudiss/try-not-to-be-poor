import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, ElementRef, HostListener, Injectable, ViewChild, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, timeout } from 'rxjs';
import { ExpenseResponse } from '../api/v2/model/expenseResponse';
import { ExpensesService } from '../api/v2/api/expenses.service';
import { Session } from '../session/session';
import { MAX_CENTS, euroInput, formatEuro, parseEuro } from '../shared/money';

// Nur der Vorgangsschutz überlebt eine Ansicht; keine Namen, Beträge, IDs oder Entwürfe.
@Injectable({ providedIn: 'root' })
class ExpenseOperations {
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
  selector: 'app-expenses',
  imports: [FormsModule],
  template: `<section class="expenses" aria-labelledby="expenses-title">
    <h2 id="expenses-title">Ausgaben verwalten</h2>
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
        <p id="expense-hint" class="hint">Positiver Eurobetrag ohne Tausendertrennzeichen, z. B. 12,50. Komma oder Punkt, höchstens zwei Nachkommastellen. Das Datum wird automatisch gesetzt.</p>
        @if (amountError()) { <p id="expense-amount-error" class="field-error">{{ amountError() }}</p> }
      </div>
      @if (!online()) { <p class="error">Du bist offline. Dein Entwurf bleibt in diesem Tab erhalten. Speichern ist erst online möglich.</p> }
      <button type="submit" [disabled]="pending() || loading() || !loaded() || !online() || uncertain()">{{ creating() ? 'Ausgabe wird gespeichert …' : 'Ausgabe speichern' }}</button>
    </form>
    @if (editing(); as expense) {
      <form class="expense-editor" (ngSubmit)="update()" novalidate [attr.aria-busy]="pending()" aria-labelledby="expense-edit-title">
        <h3 id="expense-edit-title">Ausgabe bearbeiten</h3>
        <p>Erfasst am {{ date(expense.recordedOn) }}. Das Datum bleibt unverändert.</p>
        <div class="field">
          <label for="expense-edit-name">Name bearbeiten</label>
          <input id="expense-edit-name" name="editName" type="text" autocomplete="off" required
            [readOnly]="pending()" [ngModel]="editName" (ngModelChange)="editMutation('name', $event)"
            [attr.aria-invalid]="!!editNameError()" [attr.aria-describedby]="editNameError() ? 'expense-edit-name-error' : null">
          @if (editNameError()) { <p id="expense-edit-name-error" class="field-error">{{ editNameError() }}</p> }
        </div>
        <div class="field">
          <label for="expense-edit-amount">Betrag bearbeiten in Euro</label>
          <input id="expense-edit-amount" name="editAmount" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" required
            [readOnly]="pending()" [ngModel]="editAmount" (ngModelChange)="editMutation('amount', $event)"
            [attr.aria-invalid]="!!editAmountError()" [attr.aria-describedby]="editAmountError() ? 'expense-edit-hint expense-edit-amount-error' : 'expense-edit-hint'">
          <p id="expense-edit-hint" class="hint">Positiver Eurobetrag ohne Tausendertrennzeichen, mit höchstens zwei Nachkommastellen.</p>
          @if (editAmountError()) { <p id="expense-edit-amount-error" class="field-error">{{ editAmountError() }}</p> }
        </div>
        <div class="expense-actions">
          <button type="submit" [disabled]="pending() || loading() || !loaded() || !online() || uncertain()">Änderungen speichern</button>
          <button type="button" (click)="cancelEdit()" [disabled]="pending()">Bearbeitung abbrechen</button>
        </div>
      </form>
    }
    <dialog #deleteDialog class="expense-delete-dialog" aria-labelledby="expense-delete-title" aria-describedby="expense-delete-description" (cancel)="cancelDelete($event)" (keydown)="trapDeleteFocus($event)" [attr.aria-busy]="pending()">
      @if (deleting(); as expense) {
        <h2 id="expense-delete-title">Ausgabe löschen?</h2>
        <p id="expense-delete-description">„{{ expense.name }}“ mit {{ money(expense.amountCents) }} vom {{ date(expense.recordedOn) }} wird endgültig gelöscht. Die Historie und dein Restbudget werden anschließend aktualisiert. Diese Aktion kann nicht rückgängig gemacht werden.</p>
        @if (!online()) { <p class="error">Du bist offline. Löschen ist erst online möglich.</p> }
        <p id="expense-delete-status" tabindex="-1" role="status" aria-live="polite" [class.error]="failed()">{{ deleteStatus() }}</p>
        <div class="expense-actions">
          <button id="expense-delete-cancel" type="button" autofocus (click)="cancelDelete()" [disabled]="pending()">Abbrechen</button>
          <button type="button" (click)="remove()" [disabled]="pending() || loading() || !loaded() || !online() || uncertain()">{{ pending() ? 'Ausgabe wird gelöscht …' : 'Endgültig löschen' }}</button>
        </div>
      }
    </dialog>
    <p id="expense-status" tabindex="-1" role="status" aria-live="polite" [class.error]="failed()" [class.success]="saved()">{{ status() }}</p>
    @if (uncertain()) {
      <div class="expense-uncertainty" role="status">
        <p>Der letzte Vorgang ist unbestätigt. Lade die Historie neu und prüfe den gespeicherten Stand vor einem weiteren Versuch. Gleicher Name und Betrag beweisen keinen erfolgreichen Vorgang.</p>
        <button type="button" (click)="load()" [disabled]="pending() || loading() || !online()">Historie zur Prüfung laden</button>
        <button type="button" (click)="confirmReview()" [disabled]="!uncertaintyReloaded() || loading() || !loaded()">Ich habe die Historie geprüft</button>
      </div>
    }
    <h3 id="history-title" tabindex="-1">Alle Ausgaben</h3>
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
            </dl><div class="expense-actions">
              <button type="button" [attr.aria-label]="expense.name + ' bearbeiten'" [attr.data-expense-action]="expense.id" (click)="startEdit(expense, $event)" [disabled]="pending() || loading() || !!editing()">Bearbeiten</button>
              <button type="button" [attr.aria-label]="expense.name + ' löschen'" [attr.data-expense-action]="expense.id" (click)="startDelete(expense, $event)" [disabled]="pending() || loading() || uncertain()">Löschen</button>
            </div></li>
          }
        </ul>
        <table class="expense-table" aria-labelledby="history-title">
          <thead><tr><th scope="col">Name</th><th scope="col">Betrag</th><th scope="col">Datum</th><th scope="col">Aktionen</th></tr></thead>
          <tbody>@for (expense of items(); track expense.id) {
            <tr><td>{{ expense.name }}</td><td class="expense-amount">{{ money(expense.amountCents) }}</td><td>{{ date(expense.recordedOn) }}</td><td><div class="expense-actions">
              <button type="button" [attr.aria-label]="expense.name + ' bearbeiten'" [attr.data-expense-action]="expense.id" (click)="startEdit(expense, $event)" [disabled]="pending() || loading() || !!editing()">Bearbeiten</button>
              <button type="button" [attr.aria-label]="expense.name + ' löschen'" [attr.data-expense-action]="expense.id" (click)="startDelete(expense, $event)" [disabled]="pending() || loading() || uncertain()">Löschen</button>
            </div></td></tr>
          }</tbody>
        </table>
      }
    }
  </section>`
})
export class Expenses {
  private readonly session = inject(Session);
  private readonly api = inject(ExpensesService);
  private readonly operations = inject(ExpenseOperations);
  private readonly owner = this.session.userId();
  private readonly version = this.session.generation();
  private active = true;
  @ViewChild('deleteDialog') private deleteDialog?: ElementRef<HTMLDialogElement>;
  private editTrigger: HTMLElement | null = null;
  private deleteTrigger: HTMLElement | null = null;
  protected readonly creating = signal(false);
  protected readonly editing = signal<ExpenseResponse | null>(null);
  protected readonly deleting = signal<ExpenseResponse | null>(null);
  protected editName = '';
  protected editAmount = '';
  protected readonly editNameError = signal('');
  protected readonly editAmountError = signal('');
  protected readonly deleteStatus = signal('');
  protected name = '';
  protected amount = '';
  protected readonly items = signal<ExpenseResponse[]>([]);
  protected readonly loaded = signal(false);
  protected readonly loading = signal(false);
  protected readonly loadFailed = signal(false);
  protected readonly pending = this.operations.pending;
  protected readonly online = signal(navigator.onLine);
  protected readonly status = signal('');
  protected readonly uncertain = this.operations.uncertain;
  protected readonly uncertaintyReloaded = signal(false);
  protected readonly saved = signal(false);
  protected readonly failed = signal(false);
  protected readonly nameError = signal('');
  protected readonly amountError = signal('');
  protected readonly money = formatEuro;
  protected readonly date = (value: string) => value.split('-').reverse().join('.');
  private readonly positiveAmount = 'Gib einen positiven Betrag bis 90071992547409,91 Euro ohne Tausendertrennzeichen mit höchstens zwei Nachkommastellen ein.';

  constructor() {
    this.operations.synchronize();
    effect(() => { if (this.session.userId() !== this.owner || this.session.generation() !== this.version) this.clear(); });
    inject(DestroyRef).onDestroy(() => { this.operations.abandon(); this.active = false; this.clear(); });
    void this.load();
  }
  @HostListener('window:online') connected(): void { this.online.set(true); }
  @HostListener('window:offline') disconnected(): void { this.online.set(false); }
  protected edit(field: 'name' | 'amount', value: string): void {
    this[field] = value;
    this.saved.set(false); this.failed.set(false); this.status.set('');
    (field === 'name' ? this.nameError : this.amountError).set('');
  }
  protected async load(): Promise<void> {
    if (!this.accepts() || this.loading() || this.pending()) return;
    this.items.set([]); this.loaded.set(false); this.loading.set(true); this.loadFailed.set(false); this.uncertaintyReloaded.set(false);
    try {
      const response = await firstValueFrom(this.api.getExpenses('response').pipe(timeout(30_000)));
      const result = response.body;
      if (!this.accepts()) return;
      if (response.status !== 200 || !Array.isArray(result) || !result.every(value => this.valid(value)) || new Set(result.map(value => value.id)).size !== result.length)
        throw new Error('Ungültige Ausgabenantwort.');
      this.items.set(this.sort(result)); this.loaded.set(true);
      if (this.uncertain()) this.uncertaintyReloaded.set(true);
    } catch { if (this.accepts()) this.loadFailed.set(true); }
    finally { if (this.accepts()) this.loading.set(false); }
  }
  protected async save(): Promise<void> {
    if (!this.accepts() || this.pending() || this.loading() || !this.loaded() || !this.online() || this.uncertain()) return;
    this.saved.set(false); this.failed.set(false); this.nameError.set(''); this.amountError.set('');
    const name = this.name.trim(), amountCents = parseEuro(this.amount);
    if (!name) this.nameError.set('Gib einen Namen für die Ausgabe ein.');
    if (amountCents === null || amountCents === 0) this.amountError.set(this.positiveAmount);
    if (this.nameError() || this.amountError()) {
      this.failed.set(true); this.status.set('Prüfe Name und Betrag.');
      this.focus(this.nameError() ? 'expense-name' : 'expense-amount'); return;
    }
    const operation = this.operations.begin(); this.creating.set(true); this.status.set('Ausgabe wird gespeichert …');
    try {
      const response = await firstValueFrom(this.api.postExpense({ name, amountCents: amountCents! }, 'response').pipe(timeout(30_000)));
      const result = response.body;
      if (!this.accepts()) return;
      if (response.status !== 201 || !this.valid(result) || result.name !== name || result.amountCents !== amountCents || this.items().some(value => value.id === result.id))
        throw new Error('Speicherung nicht bestätigt.');
      this.items.set(this.sort([...this.items(), result])); this.name = ''; this.amount = '';
      this.status.set('Deine Ausgabe wurde gespeichert.'); this.saved.set(true); this.focus('expense-name');
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
        this.markUncertain();
        this.status.set('Die Speicherung wurde nicht bestätigt. Die Ausgabe wurde möglicherweise bereits gespeichert. Dein Entwurf bleibt erhalten. Aktualisiere und prüfe vor erneutem Speichern die Historie, um Duplikate zu vermeiden.');
        this.focus('expense-status');
      }
    } finally { this.operations.settle(operation); if (this.accepts()) this.creating.set(false); }
  }
  protected startEdit(expense: ExpenseResponse, event: Event): void {
    if (!this.accepts() || this.pending() || this.loading() || this.editing()) return;
    this.editTrigger = event.currentTarget as HTMLElement;
    this.editing.set(expense); this.editName = expense.name; this.editAmount = euroInput(expense.amountCents);
    this.editNameError.set(''); this.editAmountError.set(''); this.status.set(''); this.failed.set(false); this.saved.set(false);
    this.focus('expense-edit-name');
  }
  protected editMutation(field: 'name' | 'amount', value: string): void {
    if (field === 'name') { this.editName = value; this.editNameError.set(''); }
    else { this.editAmount = value; this.editAmountError.set(''); }
    this.status.set(''); this.failed.set(false); this.saved.set(false);
  }
  protected cancelEdit(): void {
    if (this.pending()) return;
    this.resetEditor(); this.failed.set(false); this.saved.set(false); this.status.set('Bearbeitung abgebrochen.'); this.restoreTrigger('edit');
  }
  private resetEditor(): void {
    this.editing.set(null); this.editName = ''; this.editAmount = ''; this.editNameError.set(''); this.editAmountError.set('');
  }
  protected startDelete(expense: ExpenseResponse, event: Event): void {
    if (!this.accepts() || this.pending() || this.loading() || this.uncertain()) return;
    this.deleteTrigger = event.currentTarget as HTMLElement;
    this.deleting.set(expense); this.deleteStatus.set(''); this.status.set(''); this.failed.set(false); this.saved.set(false);
    requestAnimationFrame(() => {
      if (!this.accepts() || this.deleting()?.id !== expense.id) return;
      this.deleteDialog?.nativeElement.showModal(); this.focus('expense-delete-cancel');
    });
  }
  protected cancelDelete(event?: Event): void {
    event?.preventDefault();
    if (this.pending()) return;
    this.closeDelete(); this.failed.set(false); this.saved.set(false); this.status.set('Löschen abgebrochen.'); this.restoreTrigger('delete');
  }
  protected trapDeleteFocus(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const buttons = [...(this.deleteDialog?.nativeElement.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])];
    const first = buttons[0], last = buttons.at(-1), active = document.activeElement;
    if (!first || !last) {
      event.preventDefault(); this.focus('expense-delete-status');
    } else if (!buttons.some(button => button === active) || (event.shiftKey ? active === first : active === last)) {
      event.preventDefault(); (event.shiftKey ? last : first).focus();
    }
  }
  private closeDelete(): void {
    this.deleteDialog?.nativeElement.close(); this.deleting.set(null); this.deleteStatus.set('');
  }
  private restoreTrigger(kind: 'edit' | 'delete'): void {
    const trigger = kind === 'edit' ? this.editTrigger : this.deleteTrigger;
    if (kind === 'edit') this.editTrigger = null; else this.deleteTrigger = null;
    requestAnimationFrame(() => {
      if (!this.accepts()) return;
      if (trigger?.isConnected && trigger.matches(':enabled') && trigger.getClientRects().length) trigger.focus();
      else document.getElementById('history-title')?.focus();
    });
  }
  protected async update(): Promise<void> {
    const expense = this.editing();
    if (!expense || !this.accepts() || this.pending() || this.loading() || !this.loaded() || !this.online() || this.uncertain()) return;
    const name = this.editName.trim(), amountCents = parseEuro(this.editAmount);
    this.editNameError.set(!name ? 'Gib einen Namen für die Ausgabe ein.' : '');
    this.editAmountError.set(amountCents === null || amountCents === 0 ? this.positiveAmount : '');
    this.failed.set(false); this.saved.set(false);
    if (this.editNameError() || this.editAmountError()) {
      this.failed.set(true); this.status.set('Prüfe Name und Betrag.');
      this.focus(this.editNameError() ? 'expense-edit-name' : 'expense-edit-amount'); return;
    }
    const operation = this.operations.begin(); this.status.set('Änderungen werden gespeichert …');
    try {
      const response = await firstValueFrom(this.api.putExpense(expense.id, { name, amountCents: amountCents! }, 'response').pipe(timeout(30_000)));
      if (!this.accepts()) return;
      const result = response.body;
      if (response.status !== 200 || !this.valid(result) || result.id !== expense.id || result.recordedOn !== expense.recordedOn || result.name !== name || result.amountCents !== amountCents)
        throw new Error('Änderung nicht bestätigt.');
      this.items.set(this.sort(this.items().map(value => value.id === result.id ? result : value)));
      this.resetEditor(); this.status.set('Deine Ausgabe wurde geändert.'); this.saved.set(true); this.restoreTrigger('edit');
    } catch (failure) {
      if (!this.accepts()) return;
      this.failed.set(true);
      if (failure instanceof HttpErrorResponse && failure.status === 400) {
        const fields = failure.error?.fieldErrors;
        if (typeof fields?.name === 'string') this.editNameError.set(fields.name);
        if (typeof fields?.amountCents === 'string') this.editAmountError.set(fields.amountCents);
        this.status.set('Die Ausgabe wurde nicht geändert. Prüfe die Eingaben.');
        this.focus(this.editNameError() ? 'expense-edit-name' : this.editAmountError() ? 'expense-edit-amount' : 'expense-status');
      } else {
        if (!(failure instanceof HttpErrorResponse && failure.status === 404)) this.markUncertain();
        this.status.set(failure instanceof HttpErrorResponse && failure.status === 404
          ? 'Die Ausgabe wurde nicht gefunden. Dein Bearbeitungsentwurf bleibt erhalten. Aktualisiere die Historie.'
          : 'Die Änderung wurde nicht bestätigt. Sie wurde möglicherweise bereits gespeichert. Dein Bearbeitungsentwurf bleibt erhalten. Aktualisiere und prüfe vor erneutem Speichern die Historie.');
        this.focus('expense-status');
      }
    } finally { this.operations.settle(operation); }
  }
  protected async remove(): Promise<void> {
    const expense = this.deleting();
    if (!expense || !this.accepts() || this.pending() || !this.online() || !this.loaded() || this.loading() || this.uncertain()) return;
    const operation = this.operations.begin(); this.failed.set(false); this.saved.set(false); this.deleteStatus.set('Ausgabe wird gelöscht …');
    this.focus('expense-delete-status');
    try {
      const response = await firstValueFrom(this.api.deleteExpense(expense.id, 'response').pipe(timeout(30_000)));
      if (!this.accepts()) return;
      if (response.status !== 204 || response.body) throw new Error('Löschung nicht bestätigt.');
      const index = this.items().findIndex(value => value.id === expense.id);
      const remaining = this.items().filter(value => value.id !== expense.id);
      this.items.set(remaining);
      if (this.editing()?.id === expense.id) { this.resetEditor(); this.editTrigger = null; }
      this.closeDelete(); this.deleteTrigger = null;
      this.status.set('Deine Ausgabe wurde gelöscht.'); this.saved.set(true);
      const next = remaining[index] ?? remaining[index - 1];
      requestAnimationFrame(() => {
        if (!this.accepts()) return;
        const action = next ? [...document.querySelectorAll<HTMLElement>('[data-expense-action]')]
          .find(element => element.dataset['expenseAction'] === next.id && element.matches(':enabled') && element.getClientRects().length > 0) : null;
        (action ?? document.getElementById('expense-name'))?.focus();
      });
    } catch (failure) {
      if (!this.accepts()) return;
      this.failed.set(true);
      if (!(failure instanceof HttpErrorResponse && failure.status === 404)) this.markUncertain();
      this.deleteStatus.set(failure instanceof HttpErrorResponse && failure.status === 404
        ? 'Die Ausgabe wurde nicht gefunden. Schließe den Dialog und aktualisiere die Historie.'
        : 'Die Löschung wurde nicht bestätigt. Die Ausgabe wurde möglicherweise bereits gelöscht. Schließe den Dialog und aktualisiere die Historie, bevor du es erneut versuchst.');
    } finally { this.operations.settle(operation); }
  }
  private markUncertain(): void { this.uncertain.set(true); this.uncertaintyReloaded.set(false); }
  protected confirmReview(): void {
    if (!this.accepts() || this.pending() || !this.uncertaintyReloaded() || this.loading() || !this.loaded()) return;
    this.uncertain.set(false); this.uncertaintyReloaded.set(false);
    this.failed.set(false); this.saved.set(false);
    this.status.set('Historie geprüft. Ein weiterer Vorgang kann ausdrücklich gestartet werden.');
    this.focus(this.editing() ? 'expense-edit-name' : 'expense-name');
  }
  protected focusName(): void { this.focus('expense-name'); }
  private accepts(): boolean { return this.active && !!this.owner && this.owner === this.session.userId() && this.version === this.session.generation(); }
  private focus(id: string): void { requestAnimationFrame(() => { if (this.accepts()) document.getElementById(id)?.focus(); }); }
  private sort(values: ExpenseResponse[]): ExpenseResponse[] {
    return [...values].sort((a, b) => b.recordedOn.localeCompare(a.recordedOn) || a.id.localeCompare(b.id));
  }
  private valid(value: unknown): value is ExpenseResponse {
    if (!value || typeof value !== 'object') return false;
    if (Object.keys(value).sort().join(',') !== 'amountCents,id,name,recordedOn') return false;
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
    this.closeDelete(); this.resetEditor(); this.editTrigger = null; this.deleteTrigger = null; this.creating.set(false);
    this.uncertaintyReloaded.set(false);
    this.name = ''; this.amount = ''; this.items.set([]); this.loaded.set(false); this.loading.set(false);
    this.status.set(''); this.nameError.set(''); this.amountError.set(''); this.saved.set(false); this.failed.set(false);
  }
}
