import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, ElementRef, ViewChild, HostListener, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, timeout } from 'rxjs';
import { SavingsGoalResponse } from '../api/model/savingsGoalResponse';
import { savingsProgress } from '../shared/savings-progress';
import { Session } from '../session/session';
import { MAX_CENTS, euroInput, formatEuro, parseEuro } from '../shared/money';

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
          <button id="goal-create" type="button" (click)="focusName()">Sparziel anlegen</button>
        } @else {
          <ul class="savings-cards" aria-labelledby="goals-list-title">
            @for (goal of items(); track goal.id) {
              <li><h3 [id]="'goal-title-' + goal.id">{{ goal.name }}</h3><dl>
                <div><dt>Zielbetrag</dt><dd class="money">{{ money(goal.targetAmountCents) }}</dd></div>
                <div><dt>Fortschritt</dt><dd class="money">{{ money(goal.progressCents) }}</dd></div>
                <div><dt>Anteil am Zielbetrag</dt><dd>{{ progress(goal.progressCents, goal.targetAmountCents).percent }}</dd></div>
                @if (goal.targetDate) { <div><dt>Zieldatum</dt><dd>{{ date(goal.targetDate) }}</dd></div> }
              </dl>
                <div class="savings-progress" role="progressbar" [attr.aria-labelledby]="'goal-title-' + goal.id"
                  aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="progress(goal.progressCents, goal.targetAmountCents).barPercent"
                  [attr.aria-valuetext]="money(goal.progressCents) + ' von ' + money(goal.targetAmountCents) + ', ' + progress(goal.progressCents, goal.targetAmountCents).percent">
                  <span [style.width.%]="progress(goal.progressCents, goal.targetAmountCents).barPercent"></span>
                </div>
                @if (goal.progressCents > goal.targetAmountCents) {
                  <p class="savings-excess">Zielbetrag überschritten um {{ money(progress(goal.progressCents, goal.targetAmountCents).excessCents) }}.</p>
                }
                <button [id]="'goal-progress-' + goal.id" class="secondary" type="button" [disabled]="pending() || loading() || !!targetEditing() || !!editing() && editing()?.id !== goal.id"
                  [attr.aria-describedby]="targetEditing() ? 'goal-edit-draft-hint' : editing() ? 'goal-progress-draft-hint' : null" [attr.aria-label]="'Fortschritt aktualisieren: ' + goal.name" (click)="openProgress(goal)">Fortschritt aktualisieren</button>
                <div class="savings-actions">
                  <button [id]="'goal-edit-' + goal.id" type="button" class="secondary" [attr.aria-label]="'Sparziel bearbeiten: ' + goal.name"
                    [disabled]="pending() || loading() || !!editing() || !!targetEditing()" [attr.aria-describedby]="editing() ? 'goal-progress-draft-hint' : targetEditing() ? 'goal-edit-draft-hint' : null" (click)="openTarget(goal)">Bearbeiten</button>
                  <button [id]="'goal-delete-' + goal.id" type="button" class="secondary" [attr.aria-label]="'Sparziel löschen: ' + goal.name"
                    [disabled]="pending() || loading() || !!editing() || !!targetEditing()" [attr.aria-describedby]="editing() ? 'goal-progress-draft-hint' : targetEditing() ? 'goal-edit-draft-hint' : null" (click)="startDelete(goal)">Löschen</button>
                </div>
              </li>
            }
          </ul>
        }
      }
      @if (!online()) { <p class="error" role="status">Du bist offline. Dein Entwurf bleibt in diesem Tab erhalten. Speichern ist erst online möglich.</p> }
      @if (editing(); as goal) {
        <section class="savings-editor" aria-labelledby="progress-title">
          <h2 id="progress-title">Fortschritt für {{ goal.name }}</h2>
          <p id="goal-progress-draft-hint" class="hint">Speichere den offenen Fortschrittsentwurf oder brich ihn ab, bevor du Zielwerte bearbeitest, ein anderes Sparziel auswählst oder ein Ziel löschst.</p>
          <form (ngSubmit)="saveProgress()" novalidate [attr.aria-busy]="pending()">
            <div class="field">
              <label for="goal-progress-amount">Gesamtfortschritt in Euro</label>
              <input id="goal-progress-amount" name="progressAmount" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" required
                [readOnly]="pending()" [ngModel]="progressAmount" (ngModelChange)="editProgress($event)"
                [attr.aria-invalid]="!!progressError()" [attr.aria-describedby]="progressError() ? 'goal-progress-hint goal-progress-error' : 'goal-progress-hint'">
              <p id="goal-progress-hint" class="hint">Ersetzt den bisherigen Gesamtbetrag. Euro ohne Tausendertrennzeichen, höchstens zwei Nachkommastellen. Null und Beträge über dem Zielbetrag sind erlaubt.</p>
              @if (progressError()) { <p id="goal-progress-error" class="field-error">{{ progressError() }}</p> }
            </div>
            <div class="savings-actions">
              <button type="submit" [disabled]="pending() || loading() || !loaded() || !online()">{{ progressPending() ? 'Fortschritt wird gespeichert …' : 'Fortschritt speichern' }}</button>
              <button type="button" [disabled]="pending()" (click)="cancelProgress()">Abbrechen</button>
            </div>
          </form>
        </section>
      }
      @if (targetEditing(); as goal) {
        <section class="savings-editor" aria-labelledby="goal-edit-title">
          <h2 id="goal-edit-title">Sparziel bearbeiten: {{ goal.name }}</h2>
          <p id="goal-edit-draft-hint" class="hint">Speichere den offenen Zielentwurf oder brich ihn ab, bevor du Fortschritt bearbeitest, ein anderes Ziel auswählst oder ein Ziel löschst.</p>
          <form (ngSubmit)="saveTarget()" novalidate [attr.aria-busy]="pending()">
            <div class="field">
              <label for="goal-edit-name">Name des Sparziels bearbeiten</label>
              <input id="goal-edit-name" name="editName" type="text" autocomplete="off" required [readOnly]="pending()" [ngModel]="editName" (ngModelChange)="editTarget('editName', $event)"
                [attr.aria-invalid]="!!editNameError()" [attr.aria-describedby]="editNameError() ? 'goal-edit-name-error' : null">
              @if (editNameError()) { <p id="goal-edit-name-error" class="field-error">{{ editNameError() }}</p> }
            </div>
            <div class="field">
              <label for="goal-edit-amount">Zielbetrag in Euro bearbeiten</label>
              <input id="goal-edit-amount" name="editAmount" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" required [readOnly]="pending()" [ngModel]="editAmount" (ngModelChange)="editTarget('editAmount', $event)"
                [attr.aria-invalid]="!!editAmountError()" [attr.aria-describedby]="editAmountError() ? 'goal-edit-amount-hint goal-edit-amount-error' : 'goal-edit-amount-hint'">
              <p id="goal-edit-amount-hint" class="hint">Positiver Eurobetrag ohne Tausendertrennzeichen, höchstens zwei Nachkommastellen. Der Gesamtfortschritt bleibt erhalten.</p>
              @if (editAmountError()) { <p id="goal-edit-amount-error" class="field-error">{{ editAmountError() }}</p> }
            </div>
            <div class="field">
              <label for="goal-edit-date">Zieldatum bearbeiten (optional)</label>
              <input id="goal-edit-date" name="editDate" type="text" autocomplete="off" placeholder="JJJJ-MM-TT" [readOnly]="pending()" [ngModel]="editDate" (ngModelChange)="editTarget('editDate', $event)"
                [attr.aria-invalid]="!!editDateError()" [attr.aria-describedby]="editDateError() ? 'goal-edit-date-hint goal-edit-date-error' : 'goal-edit-date-hint'">
              <p id="goal-edit-date-hint" class="hint">Kalenderdatum im Format JJJJ-MM-TT. Ein leeres Feld entfernt das Datum.</p>
              @if (editDateError()) { <p id="goal-edit-date-error" class="field-error">{{ editDateError() }}</p> }
            </div>
            <div class="savings-actions">
              <button type="submit" [disabled]="pending() || loading() || !loaded() || !online()">{{ targetPending() ? 'Änderungen werden gespeichert …' : 'Änderungen speichern' }}</button>
              <button type="button" [disabled]="pending()" (click)="cancelTarget()">Abbrechen</button>
            </div>
          </form>
        </section>
      }
      <p id="goal-mutation-status" tabindex="-1" role="status" aria-live="polite" aria-atomic="true" [class.error]="mutationFailed()" [class.success]="mutationSaved()">{{ mutationStatus() }}</p>
      <dialog #deleteDialog class="savings-delete-dialog" aria-labelledby="goal-delete-title" aria-describedby="goal-delete-description" (cancel)="cancelDelete($event)" (keydown)="trapDeleteFocus($event)" [attr.aria-busy]="pending()">
        @if (deleting(); as goal) {
          <h2 id="goal-delete-title">Sparziel löschen?</h2>
          <p id="goal-delete-description">„{{ goal.name }}“ und sein Gesamtfortschritt werden endgültig gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.</p>
          @if (!online()) { <p class="error" role="status">Du bist offline. Löschen ist erst online möglich.</p> }
          <p id="goal-delete-status" tabindex="-1" role="status" aria-live="polite" [class.error]="mutationFailed()">{{ deleteStatus() }}</p>
          <div class="savings-actions">
            <button id="goal-delete-cancel" type="button" autofocus [disabled]="pending()" (click)="cancelDelete()">Abbrechen</button>
            <button type="button" [disabled]="pending() || !online()" (click)="remove()">{{ pending() ? 'Sparziel wird gelöscht …' : 'Endgültig löschen' }}</button>
          </div>
        }
      </dialog>
      <p id="goal-progress-status" tabindex="-1" role="status" aria-live="polite" aria-atomic="true" [class.error]="progressFailed()" [class.success]="progressSaved()">{{ progressStatus() }}</p>
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
        <button type="submit" [disabled]="pending() || loading() || !loaded() || !online()">{{ pending() && !progressPending() && !targetPending() && !deleting() ? 'Sparziel wird gespeichert …' : 'Sparziel speichern' }}</button>
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
  @ViewChild('deleteDialog') private deleteDialog?: ElementRef<HTMLDialogElement>;
  protected editName = '';
  protected editAmount = '';
  protected editDate = '';
  protected readonly targetEditing = signal<SavingsGoalResponse | null>(null);
  protected readonly deleting = signal<SavingsGoalResponse | null>(null);
  protected readonly targetPending = signal(false);
  protected readonly editNameError = signal('');
  protected readonly editAmountError = signal('');
  protected readonly editDateError = signal('');
  protected readonly mutationStatus = signal('');
  protected readonly mutationFailed = signal(false);
  protected readonly mutationSaved = signal(false);
  protected readonly deleteStatus = signal('');
  protected progressAmount = '';
  protected readonly editing = signal<SavingsGoalResponse | null>(null);
  protected readonly progressError = signal('');
  protected readonly progressStatus = signal('');
  protected readonly progressFailed = signal(false);
  protected readonly progressSaved = signal(false);
  protected readonly progressPending = signal(false);
  protected readonly progress = savingsProgress;
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
  protected openProgress(goal: SavingsGoalResponse): void {
    if (!this.accepts() || this.pending() || this.loading() || this.targetEditing() || this.deleting()) return;
    if (this.editing()) { this.focus('goal-progress-amount'); return; }
    this.editing.set(goal); this.progressAmount = euroInput(goal.progressCents); this.resetProgressStatus();
    this.focus('goal-progress-amount');
  }
  protected cancelProgress(): void {
    if (this.pending()) return;
    const id = this.editing()?.id;
    this.editing.set(null); this.progressAmount = ''; this.resetProgressStatus();
    if (id) this.focus('goal-progress-' + id, 'goals-refresh');
  }
  protected editProgress(value: string): void { this.progressAmount = value; this.resetProgressStatus(); }
  private resetProgressStatus(): void {
    this.progressError.set(''); this.progressStatus.set(''); this.progressSaved.set(false); this.progressFailed.set(false);
  }
  protected async saveProgress(): Promise<void> {
    const goal = this.editing();
    if (!goal || !this.accepts() || !this.identityConfirmed() || this.pending() || this.loading() || !this.loaded() || !this.online()) return;
    this.resetProgressStatus();
    const progressCents = parseEuro(this.progressAmount);
    if (progressCents === null) {
      this.progressError.set('Gib einen Fortschritt von 0 bis 90071992547409,91 Euro ohne Tausendertrennzeichen mit höchstens zwei Nachkommastellen ein.');
      this.progressStatus.set('Prüfe den Gesamtfortschritt.'); this.progressFailed.set(true); this.focus('goal-progress-amount'); return;
    }
    this.pending.set(true); this.progressPending.set(true); this.progressStatus.set('Fortschritt wird gespeichert …');
    try {
      const response = await firstValueFrom(this.http.put<SavingsGoalResponse>(`/api/v1/savings-goals/${goal.id}/progress`,
        { progressCents }, { observe: 'response' }).pipe(timeout(30_000)));
      if (!this.accepts()) return;
      const result = response.body;
      if (response.status !== 200 || !this.valid(result) || result.id !== goal.id || result.progressCents !== progressCents)
        throw new Error('Fortschritt nicht bestätigt.');
      this.items.update(values => values.map(value => value.id === goal.id ? result : value));
      this.editing.set(null); this.progressAmount = ''; this.progressSaved.set(true);
      this.progressStatus.set(`Der Gesamtfortschritt für „${result.name}“ wurde mit ${formatEuro(result.progressCents)} gespeichert.`); this.focus('goal-progress-' + goal.id);
    } catch (failure) {
      if (!this.accepts()) return;
      this.progressFailed.set(true);
      if (failure instanceof HttpErrorResponse && failure.status === 400) {
        const message = failure.error?.fieldErrors?.progressCents;
        this.progressError.set(typeof message === 'string' ? message : 'Prüfe den Gesamtfortschritt in Euro.');
        this.progressStatus.set('Der Fortschritt wurde nicht gespeichert. Prüfe die Eingabe.'); this.focus('goal-progress-amount');
      } else {
        this.progressStatus.set(failure instanceof HttpErrorResponse && failure.status === 404
          ? 'Das Sparziel wurde nicht gefunden. Dein Entwurf bleibt erhalten. Lade die Sparziele erneut.'
          : 'Die Speicherung wurde nicht bestätigt. Dein Entwurf bleibt erhalten. Lade die Sparziele erneut und prüfe den bestätigten Fortschritt.');
        this.focus('goal-progress-status');
      }
    } finally { if (this.accepts()) { this.pending.set(false); this.progressPending.set(false); } }
  }
  protected openTarget(goal: SavingsGoalResponse): void {
    if (!this.accepts() || this.pending() || this.loading() || this.editing() || this.targetEditing() || this.deleting()) return;
    this.targetEditing.set(goal); this.editName = goal.name; this.editAmount = euroInput(goal.targetAmountCents); this.editDate = goal.targetDate ?? '';
    this.resetMutationStatus(); this.focus('goal-edit-name');
  }
  protected editTarget(field: 'editName' | 'editAmount' | 'editDate', value: string): void {
    this[field] = value;
    (field === 'editName' ? this.editNameError : field === 'editAmount' ? this.editAmountError : this.editDateError).set('');
    this.mutationStatus.set(''); this.mutationFailed.set(false); this.mutationSaved.set(false);
  }
  private resetMutationStatus(): void {
    this.editNameError.set(''); this.editAmountError.set(''); this.editDateError.set('');
    this.mutationStatus.set(''); this.mutationFailed.set(false); this.mutationSaved.set(false);
  }
  private resetTarget(): void {
    this.targetEditing.set(null); this.editName = ''; this.editAmount = ''; this.editDate = '';
    this.editNameError.set(''); this.editAmountError.set(''); this.editDateError.set('');
  }
  protected cancelTarget(): void {
    if (this.pending()) return;
    const id = this.targetEditing()?.id; this.resetTarget(); this.resetMutationStatus();
    if (id) this.focus('goal-edit-' + id, 'goals-refresh');
  }
  private focusTargetError(): void {
    this.focus(this.editNameError() ? 'goal-edit-name' : this.editAmountError() ? 'goal-edit-amount' : this.editDateError() ? 'goal-edit-date' : 'goal-mutation-status');
  }
  protected async saveTarget(): Promise<void> {
    const goal = this.targetEditing();
    if (!goal || !this.accepts() || !this.identityConfirmed() || this.pending() || this.loading() || !this.loaded() || !this.online()) return;
    this.resetMutationStatus();
    const name = this.editName.trim(), targetAmountCents = parseEuro(this.editAmount), targetDate = this.editDate || null;
    if (!name) this.editNameError.set('Gib einen Namen für das Sparziel ein.');
    if (name.includes('\0')) this.editNameError.set('Entferne das Nullzeichen aus dem Namen des Sparziels.');
    if (targetAmountCents === null || targetAmountCents === 0) this.editAmountError.set(this.positiveAmount);
    if (targetDate && !this.validDate(targetDate)) this.editDateError.set('Gib ein gültiges Kalenderdatum im Format JJJJ-MM-TT ein.');
    if (this.editNameError() || this.editAmountError() || this.editDateError()) {
      this.mutationFailed.set(true); this.mutationStatus.set('Prüfe die Eingaben für dein Sparziel.'); this.focusTargetError(); return;
    }
    this.pending.set(true); this.targetPending.set(true); this.mutationStatus.set('Änderungen werden gespeichert …');
    try {
      const response = await firstValueFrom(this.http.put<SavingsGoalResponse>(`/api/v1/savings-goals/${goal.id}`,
        { name, targetAmountCents, targetDate }, { observe: 'response' }).pipe(timeout(30_000)));
      if (!this.accepts()) return;
      const result = response.body;
      if (response.status !== 200 || !this.valid(result) || result.id !== goal.id || result.name !== name
        || result.targetAmountCents !== targetAmountCents || (result.targetDate ?? null) !== targetDate) throw new Error('Änderung nicht bestätigt.');
      this.items.update(values => values.map(value => value.id === goal.id ? result : value)); this.resetTarget();
      this.mutationStatus.set(`Dein Sparziel „${result.name}“ wurde geändert.`); this.mutationSaved.set(true); this.focus('goal-edit-' + goal.id);
    } catch (failure) {
      if (!this.accepts()) return;
      this.mutationFailed.set(true);
      if (failure instanceof HttpErrorResponse && failure.status === 400) {
        const fields = failure.error?.fieldErrors;
        if (typeof fields?.name === 'string') this.editNameError.set(fields.name);
        if (typeof fields?.targetAmountCents === 'string') this.editAmountError.set(fields.targetAmountCents);
        if (typeof fields?.targetDate === 'string') this.editDateError.set(fields.targetDate);
        this.mutationStatus.set('Das Sparziel wurde nicht geändert. Prüfe die Eingaben.'); this.focusTargetError();
      } else {
        this.mutationStatus.set(failure instanceof HttpErrorResponse && failure.status === 404
          ? 'Das Sparziel wurde nicht gefunden. Dein Entwurf bleibt erhalten. Lade die Sparziele erneut.'
          : 'Die Änderung wurde nicht bestätigt. Dein Entwurf bleibt erhalten. Lade die Sparziele erneut und prüfe die gespeicherten Werte.'); this.focus('goal-mutation-status');
      }
    } finally { if (this.accepts()) { this.pending.set(false); this.targetPending.set(false); } }
  }
  protected startDelete(goal: SavingsGoalResponse): void {
    if (!this.accepts() || this.pending() || this.loading() || this.editing() || this.targetEditing() || this.deleting()) return;
    this.deleting.set(goal); this.deleteStatus.set(''); this.resetMutationStatus();
    requestAnimationFrame(() => {
      if (!this.accepts() || this.deleting()?.id !== goal.id) return;
      this.deleteDialog?.nativeElement.showModal(); this.focus('goal-delete-cancel');
    });
  }
  protected cancelDelete(event?: Event): void {
    event?.preventDefault();
    if (this.pending()) return;
    const id = this.deleting()?.id; this.closeDelete(); this.resetMutationStatus();
    if (id) this.focus('goal-delete-' + id, 'goals-refresh');
  }
  private closeDelete(): void { this.deleteDialog?.nativeElement.close(); this.deleting.set(null); this.deleteStatus.set(''); }
  protected trapDeleteFocus(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const buttons = [...(this.deleteDialog?.nativeElement.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])];
    const first = buttons[0], last = buttons.at(-1), active = document.activeElement;
    if (!first || !last) { event.preventDefault(); this.focus('goal-delete-status'); }
    else if (!buttons.some(button => button === active) || (event.shiftKey ? active === first : active === last)) {
      event.preventDefault(); (event.shiftKey ? last : first).focus();
    }
  }
  protected async remove(): Promise<void> {
    const goal = this.deleting();
    if (!goal || !this.accepts() || this.pending() || !this.online()) return;
    this.pending.set(true); this.mutationFailed.set(false); this.mutationSaved.set(false); this.deleteStatus.set('Sparziel wird gelöscht …'); this.focus('goal-delete-status');
    try {
      const response = await firstValueFrom(this.http.delete(`/api/v1/savings-goals/${goal.id}`, { observe: 'response', responseType: 'text' }).pipe(timeout(30_000)));
      if (!this.accepts()) return;
      if (response.status !== 204 || response.body) throw new Error('Löschung nicht bestätigt.');
      const index = this.items().findIndex(value => value.id === goal.id), remaining = this.items().filter(value => value.id !== goal.id);
      this.items.set(remaining); this.closeDelete(); this.mutationStatus.set('Dein Sparziel wurde gelöscht.'); this.mutationSaved.set(true);
      const next = remaining[index] ?? remaining[index - 1]; this.focus(next ? 'goal-edit-' + next.id : 'goal-create', 'goal-name');
    } catch (failure) {
      if (!this.accepts()) return;
      this.mutationFailed.set(true);
      this.deleteStatus.set(failure instanceof HttpErrorResponse && failure.status === 404
        ? 'Das Sparziel wurde nicht gefunden. Schließe den Dialog und lade die Sparziele erneut.'
        : 'Die Löschung wurde nicht bestätigt. Das Sparziel wurde möglicherweise bereits gelöscht. Schließe den Dialog und lade die Sparziele erneut, bevor du es erneut versuchst.'); this.focus('goal-delete-status');
    } finally { if (this.accepts()) this.pending.set(false); }
  }
  protected focusName(): void { this.focus('goal-name'); }
  private focusError(): void { this.focus(this.nameError() ? 'goal-name' : this.amountError() ? 'goal-amount' : this.dateError() ? 'goal-date' : 'goal-status'); }
  private accepts(): boolean { return this.active && !!this.owner && this.owner === this.session.userId() && this.version === this.session.generation(); }
  private focus(id: string, fallback?: string): void {
    requestAnimationFrame(() => {
      if (this.accepts()) (document.getElementById(id) ?? (fallback ? document.getElementById(fallback) : null))?.focus();
    });
  }
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
    this.closeDelete(); this.resetTarget(); this.resetMutationStatus(); this.targetPending.set(false);
    this.name = ''; this.amount = ''; this.targetDate = ''; this.progressAmount = ''; this.editing.set(null); this.resetProgressStatus(); this.progressPending.set(false); this.items.set([]); this.loaded.set(false); this.loading.set(false);
    this.pending.set(false); this.opening.set(false); this.identityConfirmed.set(false); this.identityFailed.set(false); this.identityStatus.set('');
    this.status.set(''); this.nameError.set(''); this.amountError.set(''); this.dateError.set(''); this.saved.set(false); this.failed.set(false); this.loadFailed.set(false);
  }
}
