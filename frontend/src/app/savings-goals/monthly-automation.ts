import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, HostListener, Injectable, effect, inject, input, output, signal } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { MonthlySurplusService } from '../api/v2/api/monthlySurplus.service';
import { MonthlySurplusActivationResponse } from '../api/v2/model/monthlySurplusActivationResponse';
import { Session } from '../session/session';
import { MAX_CENTS, formatSignedEuro } from '../shared/money';

// Nur Vorgangsflags überleben die Navigation, persönliche Werte bleiben in der Ansicht.
@Injectable({ providedIn: 'root' })
export class SavingsOperations {
  private readonly session = inject(Session);
  private version = this.session.generation();
  private sequence = 0;
  private activationSequence = 0;
  readonly pending = signal(false);
  readonly uncertain = signal(false);
  readonly activationPending = signal(false);
  readonly activationUncertain = signal(false);
  constructor() { effect(() => { this.session.generation(); this.synchronize(); }); }
  synchronize(): void {
    if (this.version === this.session.generation()) return;
    this.version = this.session.generation(); ++this.sequence; ++this.activationSequence;
    this.pending.set(false); this.uncertain.set(false);
    this.activationPending.set(false); this.activationUncertain.set(false);
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
@Component({
  selector: 'app-monthly-automation',
  template: `<section class="monthly-automation" aria-labelledby="automation-title">
    <h2 id="automation-title">Monatsautomatik</h2>
    <p>Die Automatik startet mit dem gesamten Monat deiner ausdrücklichen Aktivierung. Der erste Abschluss folgt nach Monatsende. Frühere Monate bleiben ausgeschlossen. Du kannst auch ohne Budget oder Sparziel aktivieren.</p>
    <p id="automation-state" role="status" aria-live="polite" aria-atomic="true" [class.error]="loadState() === 'failed'">
      @if (loadState() === 'loading') { Dein Aktivierungszustand wird geladen … }
      @else if (loadState() === 'failed') { Dein Aktivierungszustand konnte nicht geladen werden. }
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
    @if (uncertain()) { <p class="error" role="status">Die Aktivierung wurde nicht bestätigt. Lade vor einem weiteren Versuch den tatsächlichen Aktivierungszustand. Auch nach einem Monatswechsel bleibt ein bereits gespeicherter Start erhalten.</p> }
    @if (!online()) { <p class="error" role="status">Die Aktivierung ist offline gesperrt. Es wird nichts gesendet.</p> }
    <p id="automation-result" tabindex="-1" role="status" aria-live="polite" aria-atomic="true" [class.error]="failed()">{{ result() }}</p>
    @if (capability() === 'open' && !blocked() && loadState() === 'loaded' && !state()?.active) {
      <button type="button" (click)="activate()" [disabled]="pending() || uncertain() || !online()" aria-describedby="automation-state automation-capability">{{ pending() ? 'Aktivierung wird gespeichert …' : 'Monatsautomatik ausdrücklich aktivieren' }}</button>
    }
    <button type="button" class="secondary" (click)="load()" [attr.aria-disabled]="pending() || loadState() === 'loading' || !online()" [attr.aria-busy]="loadState() === 'loading'">Aktivierungszustand laden</button>
    <button type="button" class="secondary" (click)="retry()" [attr.aria-disabled]="capability() === 'loading' || !online()" [attr.aria-busy]="capability() === 'loading'">Verfügbarkeit der Monatsautomatik prüfen</button>
    <div class="monthly-pending" aria-labelledby="pending-title">
      <h3 id="pending-title">Vorgemerkte Monatsüberschüsse</h3>
      <p id="pending-state" role="status" aria-live="polite" aria-atomic="true" [class.error]="pendingLoadState() === 'failed'">
        @if (loadState() === 'loaded' && !state()?.active) { Vor deiner ausdrücklichen Aktivierung werden keine Monatsüberschüsse vorgemerkt. }
        @else if (pendingLoadState() === 'loading') { Deine Vormerkung wird geladen … }
        @else if (pendingLoadState() === 'failed') { Deine Vormerkung konnte nicht geladen werden. Versuche es erneut. }
        @else if (pendingLoadState() === 'loaded') { <strong class="pending-money">Vorgemerkt: {{ money(pendingCents()!) }}</strong> }
        @else { Deine Vormerkung ist noch nicht geladen. }
      </p>
      @if (state()?.active) {
        <p>Die vorgemerkten Beträge sind noch keinem Sparziel angerechnet. Dein manuell gespeicherter Zielfortschritt bleibt davon unabhängig. Die Zielauswahl wird später verfügbar.</p>
        @if (!online()) { <p class="error" role="status">Die Vormerkung kann offline nicht aktualisiert werden. Es gibt keine Offline-Synchronisation.</p> }
        <button type="button" class="secondary" (click)="loadPending()" [attr.aria-disabled]="pendingLoadState() === 'loading' || !online()" [attr.aria-busy]="pendingLoadState() === 'loading'">Vormerkung aktualisieren</button>
      }
    </div>
  </section>`
})
export class MonthlyAutomation {
  readonly capability = input<Capability>('unknown');
  readonly retryCapability = output<void>();
  private readonly session = inject(Session);
  private readonly api = inject(MonthlySurplusService);
  private readonly operations = inject(SavingsOperations);
  private readonly owner = this.session.userId();
  private readonly version = this.session.generation();
  private active = true;
  private sequence = 0;
  private pendingSequence = 0;
  private readonly monthFormatter = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit' });
  private observedMonth: string | null = null;
  private serverTime: { epoch: number; monotonic: number } | null = null;
  protected readonly money = formatSignedEuro;
  protected readonly pendingCents = signal<number | null>(null);
  protected readonly pendingLoadState = signal<'unknown' | 'loading' | 'loaded' | 'failed'>('unknown');
  protected readonly pending = this.operations.activationPending;
  protected readonly uncertain = this.operations.activationUncertain;
  protected readonly state = signal<MonthlySurplusActivationResponse | null>(null);
  protected readonly loadState = signal<'unknown' | 'loading' | 'loaded' | 'failed'>('unknown');
  protected readonly online = signal(navigator.onLine);
  protected readonly result = signal('');
  protected readonly failed = signal(false);
  protected readonly blocked = signal(false);
  constructor() {
    this.operations.synchronize();
    effect(() => { if (!this.accepts()) this.clear(); });
    effect(() => { if (this.capability() === 'loading') this.blocked.set(false); });
    let wasPending = this.pending();
    effect(() => {
      const pending = this.pending();
      if (wasPending && !pending && this.accepts() && this.loadState() === 'unknown') void this.load();
      wasPending = pending;
    });
    const timer = setInterval(() => this.checkMonth(), 1_000);
    inject(DestroyRef).onDestroy(() => { clearInterval(timer); this.operations.abandonActivation(); this.active = false; this.clear(); });
    void this.load();
  }
  @HostListener('window:online') connected(): void { this.online.set(true); this.refresh(); }
  @HostListener('window:offline') disconnected(): void { this.online.set(false); }
  @HostListener('window:focus')
  @HostListener('document:visibilitychange') returned(): void {
    if (document.visibilityState === 'visible') this.refresh();
  }
  private refresh(): void {
    if (this.state()?.active) void this.loadPending(true);
    else void this.load(true);
  }
  private checkMonth(): void {
    if (!this.online() || !this.serverTime || document.visibilityState !== 'visible') return;
    const month = this.monthFormatter.format(new Date(this.serverTime.epoch + performance.now() - this.serverTime.monotonic));
    if (month !== this.observedMonth) { this.observedMonth = month; void this.loadPending(true); }
  }
  protected async loadPending(refresh = false): Promise<void> {
    if (!this.accepts() || !this.state()?.active || !this.online() || !refresh && this.pendingLoadState() === 'loading') return;
    const sequence = ++this.pendingSequence;
    this.pendingCents.set(null); this.pendingLoadState.set('loading');
    try {
      const response = await firstValueFrom(this.api.getMonthlySurplusPending('response').pipe(timeout(30_000)));
      if (!this.accepts() || sequence !== this.pendingSequence) return;
      const body = response.body;
      if (response.status !== 200 || !body || Object.keys(body).length !== 1 || !Object.hasOwn(body, 'pendingCents')
        || !Number.isSafeInteger(body.pendingCents) || body.pendingCents < 0 || body.pendingCents > MAX_CENTS) throw new Error('Ungültige Vormerkung.');
      this.pendingCents.set(body.pendingCents); this.pendingLoadState.set('loaded');
      const now = Date.parse(response.headers.get('Date') ?? '');
      if (Number.isFinite(now)) { this.serverTime = { epoch: now, monotonic: performance.now() }; this.observedMonth = this.monthFormatter.format(new Date(now)); }
    } catch {
      if (this.accepts() && sequence === this.pendingSequence) this.pendingLoadState.set('failed');
    }
  }
  protected retry(): void {
    if (this.accepts() && this.online() && this.capability() !== 'loading') this.retryCapability.emit();
  }
  protected async load(refresh = false): Promise<void> {
    if (!this.accepts() || this.pending() || !this.online() || !refresh && this.loadState() === 'loading') return;
    const sequence = ++this.sequence;
    this.loadState.set('loading');
    try {
      const response = await firstValueFrom(this.api.getMonthlySurplusActivation('response').pipe(timeout(30_000)));
      if (!this.accepts() || sequence !== this.sequence) return;
      if (response.status !== 200 || !this.valid(response.body)) throw new Error('Aktivierungszustand nicht bestätigt.');
      this.state.set(response.body); this.loadState.set('loaded'); this.uncertain.set(false);
      this.result.set(''); this.failed.set(false);
      if (response.body.active) void this.loadPending(true);
      else this.clearPending();
    } catch {
      if (this.accepts() && sequence === this.sequence) this.loadState.set('failed');
    }
  }
  protected async activate(): Promise<void> {
    if (!this.accepts() || this.capability() !== 'open' || this.blocked() || this.pending() || this.uncertain()
      || !this.online() || this.loadState() !== 'loaded' || this.state()?.active) return;
    ++this.sequence;
    const operation = this.operations.beginActivation();
    this.result.set('Aktivierung wird gespeichert …'); this.failed.set(false);
    try {
      const response = await firstValueFrom(this.api.postMonthlySurplusActivation('response').pipe(timeout(30_000)));
      if (!this.accepts()) return;
      if (response.status !== 200 || !this.valid(response.body) || !response.body.active) throw new Error('Aktivierung nicht bestätigt.');
      this.state.set(response.body); this.loadState.set('loaded');
      this.result.set('Deine Monatsautomatik wurde aktiviert.');
      void this.loadPending(true);
    } catch (failure) {
      if (!this.accepts()) return;
      this.failed.set(true);
      if (failure instanceof HttpErrorResponse && failure.status === 409 && failure.error?.code === 'FEATURE_NOT_AVAILABLE') {
        this.blocked.set(true); this.result.set('Die Monatsautomatik ist derzeit nicht verfügbar. Die Aktivierung wurde nicht gespeichert.');
        this.retryCapability.emit();
      } else {
        this.uncertain.set(true); this.result.set('Die Aktivierung wurde nicht bestätigt. Prüfe den gespeicherten Zustand vor einem weiteren Versuch.');
      }
    } finally {
      this.operations.settleActivation(operation);
      if (this.accepts()) requestAnimationFrame(() => { if (this.accepts()) document.getElementById('automation-result')?.focus(); });
    }
  }
  protected month(value: string): string {
    const names = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    return names[Number(value.slice(5, 7)) - 1] + ' ' + value.slice(0, 4);
  }
  private valid(value: unknown): value is MonthlySurplusActivationResponse {
    if (!value || typeof value !== 'object') return false;
    const state = value as MonthlySurplusActivationResponse;
    return Object.keys(state).length === 2 && typeof state.active === 'boolean'
      && (state.active ? typeof state.activationMonth === 'string' && /^(?!0000)\d{4}-(0[1-9]|1[0-2])-01$/.test(state.activationMonth) : state.activationMonth === null);
  }
  private accepts(): boolean { return this.active && !!this.owner && this.owner === this.session.userId() && this.version === this.session.generation(); }
  private clearPending(): void { ++this.pendingSequence; this.pendingCents.set(null); this.pendingLoadState.set('unknown'); this.serverTime = null; this.observedMonth = null; }
  private clear(): void { this.clearPending(); ++this.sequence; this.state.set(null); this.loadState.set('unknown'); this.result.set(''); this.failed.set(false); this.blocked.set(false); }
}
