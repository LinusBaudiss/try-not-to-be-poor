import { Component, Injectable, effect, inject, input, output, signal } from '@angular/core';
import { MonthlySurplusOverviewResponse } from '../api/v2/model/monthlySurplusOverviewResponse';
import { FormsModule } from '@angular/forms';
import { Session } from '../session/session';
import { formatSignedEuro } from '../shared/money';

// Nur Vorgangsflags überleben die Navigation, persönliche Werte bleiben in der Ansicht.
@Injectable({ providedIn: 'root' })
export class SavingsOperations {
  private readonly session = inject(Session);
  private version = this.session.generation();
  private sequence = 0;
  private activationSequence = 0;
  private selectionSequence = 0;
  readonly selectionPending = signal(false);
  readonly selectionUncertain = signal(false);
  readonly pending = signal(false);
  readonly uncertain = signal(false);
  readonly activationPending = signal(false);
  readonly activationUncertain = signal(false);
  constructor() { effect(() => { this.session.generation(); this.synchronize(); }); }
  synchronize(): void {
    if (this.version === this.session.generation()) return;
    this.version = this.session.generation(); ++this.sequence; ++this.activationSequence; ++this.selectionSequence;
    this.pending.set(false); this.uncertain.set(false);
    this.activationPending.set(false); this.activationUncertain.set(false);
    this.selectionPending.set(false); this.selectionUncertain.set(false);
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
  beginSelection(): { version: number; sequence: number } {
    this.synchronize(); this.selectionPending.set(true);
    return { version: this.version, sequence: ++this.selectionSequence };
  }
  abandonSelection(): void { this.synchronize(); if (this.selectionPending()) this.selectionUncertain.set(true); }
  settleSelection(operation: { version: number; sequence: number }): void {
    this.synchronize();
    if (operation.version === this.version && operation.sequence === this.selectionSequence) this.selectionPending.set(false);
  }
  beginActivation(): { version: number; sequence: number } {
    this.synchronize(); this.activationPending.set(true);
    return { version: this.version, sequence: ++this.activationSequence };
  }
  abandonActivation(): void { this.synchronize(); if (this.activationPending()) this.activationUncertain.set(true); }
  settleActivation(operation: { version: number; sequence: number }): void {
    this.synchronize();
    if (operation.version === this.version && operation.sequence === this.activationSequence) this.activationPending.set(false);
  }
}

type Capability = 'unknown' | 'loading' | 'open' | 'closed' | 'failed';
export type OverviewLoadState = 'unknown' | 'loading' | 'loaded' | 'failed';
@Component({
  selector: 'app-monthly-automation',
  imports: [FormsModule],
  template: `<section class="monthly-automation" aria-labelledby="automation-title">
    <h2 id="automation-title">Monatsautomatik</h2>
    <p>Die Automatik startet mit dem gesamten Monat deiner ausdrücklichen Aktivierung. Der erste Abschluss folgt nach Monatsende. Frühere Monate bleiben ausgeschlossen. Du kannst auch ohne Budget oder Sparziel aktivieren.</p>
    <p id="automation-state" role="status" aria-live="polite" aria-atomic="true" [class.error]="loadState() === 'failed'">
      @if (loadState() === 'loading') { Dein Aktivierungszustand und deine Automatikübersicht werden geladen … }
      @else if (loadState() === 'failed') { Deine Automatikübersicht konnte nicht geladen werden. Deine Sparziele kannst du unabhängig pflegen. }
      @else if (state()?.active) { Monatsautomatik aktiv seit {{ month(state()!.activationMonth!) }}. }
      @else if (loadState() === 'loaded') { Die Monatsautomatik ist für dein Konto noch nicht aktiviert. }
      @else { Dein Aktivierungszustand ist noch nicht geladen. }
    </p>
    <p id="automation-capability" role="status" aria-live="polite">
      @if (capability() === 'loading') { Die Verfügbarkeit der Monatsautomatik wird geprüft … }
      @else if (capability() === 'open' && !blocked()) { Die Monatsautomatik ist verfügbar. }
      @else if (capability() === 'failed') { Die Verfügbarkeit konnte nicht geprüft werden. }
      @else if (capability() === 'unknown') { Die Verfügbarkeit wurde noch nicht geprüft. }
      @else { Die Monatsautomatik ist derzeit nicht verfügbar. Ein gespeicherter Start bleibt erhalten. }
    </p>
    @if (activationUncertain()) { <p class="error" role="status">Die Aktivierung wurde nicht bestätigt. Lade vor einem weiteren Versuch den tatsächlichen Aktivierungszustand. Auch nach einem Monatswechsel bleibt ein bereits gespeicherter Start erhalten.</p> }
    @if (!online()) { <p class="error" role="status">Die Aktivierung ist offline gesperrt. Es wird nichts gesendet.</p> }
    <p id="automation-result" tabindex="-1" role="status" aria-live="polite" aria-atomic="true" [class.error]="activationFailed()">{{ activationResult() }}</p>
    @if (capability() === 'open' && !blocked() && loadState() === 'loaded' && !state()?.active) {
      <button type="button" (click)="activate.emit()" [disabled]="activationPending() || activationUncertain() || !online()" aria-describedby="automation-state automation-capability">{{ activationPending() ? 'Aktivierung wird gespeichert …' : 'Monatsautomatik ausdrücklich aktivieren' }}</button>
    }
    <button type="button" class="secondary" (click)="reload()" [disabled]="activationPending() || selectionPending()" [attr.aria-disabled]="activationPending() || selectionPending() || loadState() === 'loading' || !online()" [attr.aria-busy]="loadState() === 'loading'">Aktivierungszustand laden</button>
    <button type="button" class="secondary" (click)="retry()" [attr.aria-disabled]="capability() === 'loading' || !online()" [attr.aria-busy]="capability() === 'loading'">Verfügbarkeit der Monatsautomatik prüfen</button>
    <div class="monthly-pending" aria-labelledby="pending-title">
      <h3 id="pending-title">Vorgemerkte Monatsüberschüsse</h3>
      <p id="pending-state" role="status" aria-live="polite" aria-atomic="true" [class.error]="loadState() === 'failed'">
        @if (loadState() === 'loading') { Deine Vormerkung wird geladen … }
        @else if (loadState() === 'failed') { Deine Vormerkung konnte nicht geladen werden. Versuche es erneut. }
        @else if (loadState() === 'loaded' && !state()?.active) { Vor deiner ausdrücklichen Aktivierung werden keine Monatsüberschüsse vorgemerkt. }
        @else if (loadState() === 'loaded' && state()) { <strong class="pending-money">Vorgemerkt: {{ money(state()!.pendingCents) }}</strong> }
        @else { Deine Vormerkung ist noch nicht geladen. }
      </p>
      @if (state()?.active && loadState() === 'loaded') {
        <p>Die vorgemerkten Beträge sind noch keinem Sparziel angerechnet. Dein manuell gespeicherter Zielfortschritt bleibt davon unabhängig.</p>
        <p id="saved-selection">{{ selectedName() ? 'Gespeicherte Auswahl: ' + selectedName() : 'Kein Ziel ausgewählt' }}</p>
        @if (state()!.goals.length) {
          <form (ngSubmit)="choose()" novalidate [attr.aria-busy]="selectionPending()">
            <div class="field">
              <label for="monthly-goal">Ziel für Monatsüberschüsse</label>
              <select id="monthly-goal" name="monthlyGoal" [ngModel]="draft() ?? state()!.selectedGoalId ?? ''" (ngModelChange)="draftChange.emit($event)"
                [disabled]="selectionPending()" [attr.aria-invalid]="unavailableDraft() ? true : null" aria-describedby="selection-draft selection-effect selection-result">
                <option value="">Kein Ziel ausgewählt</option>
                @if (unavailableDraft()) { <option [value]="draft()!" disabled>Entworfenes Sparziel nicht mehr verfügbar</option> }
                @for (goal of state()!.goals; track goal.id) { <option [value]="goal.id">{{ goal.name }}</option> }
              </select>
            </div>
            <p id="selection-draft" [class.error]="unavailableDraft()">Entwurf: {{ draftName() }}@if (unavailableDraft()) {. Wähle ein vorhandenes eigenes Sparziel als Ersatz. }</p>
            <p id="selection-effect">Beim Speichern werden alle offenen Vormerkungen vollständig übernommen, auch Nullmonate. Zuvor werden fällige Monate nach ihrer damaligen Auswahl berücksichtigt. Ein Wechsel gilt für den offenen und folgende Monate; bereits zugeordnete Überschüsse bleiben bei ihrem Ziel.</p>
            <p class="hint">Deine Auswahl ist bis zur bestätigten Speicherung ein Entwurf.</p>
            <button type="submit" [disabled]="selectionPending() || manualPending() || selectionUncertain() || !online() || capability() !== 'open' || blocked() || !availableDraftGoal()">{{ selectionPending() ? 'Auswahl wird gespeichert …' : 'Auswahl speichern' }}</button>
          </form>
        } @else { <p>Lege ein eigenes Sparziel an, um deine Vormerkungen vollständig zu übernehmen. Eine Zielanlage wählt noch kein Ziel aus.</p> }
        @if (!online()) { <p class="error" role="status">Die Auswahl ist offline gesperrt. Dein Entwurf bleibt in diesem Tab erhalten.</p> }
      }
        <button type="button" class="secondary" (click)="reload()" [attr.aria-disabled]="selectionPending() || loadState() === 'loading' || !online()" [attr.aria-busy]="loadState() === 'loading'">Vormerkung aktualisieren</button>
      @if (selectionUncertain()) { <p class="error" role="status">Speicherung noch nicht bestätigt. Lade vor einem weiteren Versuch den gemeinsamen aktuellen Stand. Dein Auswahlentwurf bleibt erhalten.</p> }
      <p id="selection-result" tabindex="-1" role="status" aria-live="polite" aria-atomic="true" [class.error]="selectionFailed()">{{ selectionResult() }}</p>
    </div>
  </section>`
})
export class MonthlyAutomation {
  readonly capability = input<Capability>('unknown');
  readonly stateSource = input<(() => MonthlySurplusOverviewResponse | null) | null>(null, { alias: 'state' });
  readonly loadState = input<OverviewLoadState>('unknown');
  readonly online = input(true);
  readonly blocked = input(false);
  readonly activationPending = input(false);
  readonly activationUncertain = input(false);
  readonly activationFailed = input(false);
  readonly activationResult = input('');
  readonly selectionPending = input(false);
  readonly selectionUncertain = input(false);
  readonly selectionFailed = input(false);
  readonly selectionResult = input('');
  readonly manualPending = input(false);
  readonly draftSource = input<(() => string | null) | null>(null, { alias: 'draft' });
  readonly draftChange = output<string>();
  readonly selectGoal = output<string>();
  readonly activate = output<void>();
  readonly reloadOverview = output<void>();
  readonly retryCapability = output<void>();
  protected readonly money = formatSignedEuro;
  // Keine eigene Snapshotkopie: Auch eine bereits zerstörte Ansicht liest nach Sitzungsende null.
  protected state(): MonthlySurplusOverviewResponse | null { return this.stateSource()?.() ?? null; }
  protected draft(): string | null { return this.draftSource()?.() ?? null; }
  protected selectedName(): string | null {
    return this.state()?.goals.find(goal => goal.id === this.state()?.selectedGoalId)?.name ?? null;
  }
  protected draftName(): string {
    if (this.draft() === '') return 'Keine neue Zielauswahl getroffen';
    const id = this.draft() ?? this.state()?.selectedGoalId;
    return this.state()?.goals.find(goal => goal.id === id)?.name ?? (id ? 'Sparziel nicht mehr verfügbar' : 'Kein Ziel ausgewählt');
  }
  protected availableDraftGoal(): boolean { return this.state()?.goals.some(goal => goal.id === (this.draft() ?? this.state()?.selectedGoalId)) ?? false; }
  protected unavailableDraft(): boolean { return !!this.draft() && !this.availableDraftGoal(); }
  protected choose(): void {
    const id = this.draft() ?? this.state()?.selectedGoalId;
    if (id && this.availableDraftGoal() && this.online() && !this.manualPending() && !this.selectionPending() && !this.selectionUncertain() && this.capability() === 'open' && !this.blocked()) this.selectGoal.emit(id);
  }
  protected reload(): void { if (this.online() && !this.activationPending() && !this.selectionPending() && this.loadState() !== 'loading') this.reloadOverview.emit(); }
  protected retry(): void { if (this.online() && this.capability() !== 'loading') this.retryCapability.emit(); }
  protected month(value: string): string {
    const names = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    return names[Number(value.slice(5, 7)) - 1] + ' ' + value.slice(0, 4);
  }
}
