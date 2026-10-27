import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, HostListener, effect, inject, input, output, signal } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { MonthSummaryResponse } from '../api/model/monthSummaryResponse';
import { Session } from '../session/session';
import { MAX_CENTS, formatSignedEuro } from '../shared/money';

@Component({
  selector: 'app-month-summary',
  template: `<section class="month-summary" aria-labelledby="summary-title" [attr.aria-busy]="loading()">
    <h2 id="summary-title">Deine Monatsübersicht</h2>
    <p id="summary-status" role="status" aria-live="polite" [class.error]="failed()">{{ status() }}</p>
    @if (value(); as summary) {
      <p class="summary-month">{{ monthLabel(summary.month) }}</p>
      @if (summary.remainingCents !== null) {
        <p class="remaining" [class.error]="summary.remainingCents < 0">Restbudget
          <strong class="summary-money">{{ money(summary.remainingCents) }}</strong>
          @if (summary.remainingCents < 0) { <span>Budget überschritten</span> }
        </p>
      } @else { <p>Lege dein Monatsbudget fest, um dein Restbudget zu sehen.</p> }
      <dl class="summary-details">
        <div><dt>Monatsbudget</dt><dd>{{ summary.budgetCents === null ? 'Noch nicht festgelegt' : money(summary.budgetCents) }}</dd></div>
        <div><dt>Ausgaben im laufenden Monat</dt><dd>{{ money(summary.expensesCents) }}</dd></div>
      </dl>
    }
    <button type="button" (click)="load()" [disabled]="!online()">{{ failed() ? 'Monatsübersicht erneut laden' : 'Monatsübersicht aktualisieren' }}</button>
  </section>`
})
export class MonthSummary {
  readonly revision = input(0);
  readonly confirmedBudget = output<number | null>();
  private readonly session = inject(Session);
  private readonly http = inject(HttpClient);
  private readonly owner = this.session.userId();
  private readonly version = this.session.generation();
  private active = true;
  private sequence = 0;
  private readonly monthFormatter = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit' });
  private observedMonth: string | null = null;
  private serverTime: { epoch: number; monotonic: number } | null = null;
  protected readonly value = signal<MonthSummaryResponse | null>(null);
  protected readonly loading = signal(false);
  protected readonly failed = signal(false);
  protected readonly status = signal('');
  protected readonly online = signal(navigator.onLine);
  protected readonly money = formatSignedEuro;
  protected readonly monthLabel = (month: string) => `${['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'][Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`;

  constructor() {
    effect(() => { this.revision(); if (this.accepts()) void this.load(); });
    effect(() => { if (this.session.userId() !== this.owner || this.session.generation() !== this.version) this.clear(); });
    const timer = setInterval(() => this.checkMonth(), 1_000);
    inject(DestroyRef).onDestroy(() => { this.active = false; clearInterval(timer); this.clear(); });
  }
  @HostListener('window:online') connected(): void { this.online.set(true); void this.load(); }
  @HostListener('window:offline') disconnected(): void { this.online.set(false); }
  @HostListener('window:focus')
  @HostListener('document:visibilitychange') checkMonth(): void {
    if (!this.online() || !this.serverTime) return;
    const month = this.monthFormatter.format(new Date(this.serverTime.epoch + performance.now() - this.serverTime.monotonic));
    if (month !== this.observedMonth) { this.observedMonth = month; void this.load(); }
  }
  async load(): Promise<void> {
    if (!this.accepts()) return;
    const request = ++this.sequence;
    this.value.set(null); this.loading.set(true); this.failed.set(false); this.status.set('Deine Monatsübersicht wird geladen …');
    try {
      const response = await firstValueFrom(this.http.get<MonthSummaryResponse>('/api/v1/expense-budget/month-summary', { observe: 'response' }).pipe(timeout(30_000)));
      const receivedAt = performance.now();
      const result = response.body;
      if (!this.accepts(request)) return;
      if (!this.valid(result)) throw new Error('Ungültige Monatsübersicht.');
      const serverNow = Date.parse(response.headers.get('Date') ?? '');
      if (!Number.isFinite(serverNow)) throw new Error('Ungültige Serverzeit.');
      this.serverTime = { epoch: serverNow, monotonic: receivedAt };
      this.observedMonth = result.month.slice(0, 7);
      this.value.set(result);
      this.confirmedBudget.emit(result.budgetCents);
      this.status.set(result.remainingCents === null ? 'Monatsübersicht geladen. Noch kein Monatsbudget festgelegt.'
        : `Monatsübersicht aktualisiert. Restbudget ${this.money(result.remainingCents)}.${result.remainingCents < 0 ? ' Budget überschritten.' : ''}`);
    } catch {
      if (this.accepts(request)) { this.failed.set(true); this.status.set('Deine Monatsübersicht konnte nicht geladen werden. Versuche es erneut.'); }
    } finally { if (this.accepts(request)) this.loading.set(false); }
  }
  private valid(value: unknown): value is MonthSummaryResponse {
    if (!value || typeof value !== 'object') return false;
    const s = value as MonthSummaryResponse;
    const cents = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 && v <= MAX_CENTS;
    return typeof s.month === 'string' && /^(?!0000)\d{4}-(0[1-9]|1[0-2])-01$/.test(s.month)
      && cents(s.expensesCents) && (s.budgetCents === null ? s.remainingCents === null
        : cents(s.budgetCents) && typeof s.remainingCents === 'number' && Number.isSafeInteger(s.remainingCents)
          && BigInt(s.remainingCents) === BigInt(s.budgetCents) - BigInt(s.expensesCents));
  }
  private accepts(request = this.sequence): boolean {
    return this.active && !!this.owner && this.owner === this.session.userId() && this.version === this.session.generation() && request === this.sequence;
  }
  private clear(): void { ++this.sequence; this.serverTime = null; this.observedMonth = null; this.value.set(null); this.loading.set(false); this.failed.set(false); this.status.set(''); }
}
