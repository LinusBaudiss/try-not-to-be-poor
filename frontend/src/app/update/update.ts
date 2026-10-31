import { afterNextRender, Component, inject } from '@angular/core';
import { Session } from '../session/session';

@Component({
  selector: 'app-update',
  template: `<section class="auth-card update-card" aria-labelledby="update-title">
    <h1 id="update-title" tabindex="-1">Bitte lade die Seite neu</h1>
    <p role="status">Eine neue Version ist verfügbar. Deine persönliche Ansicht wurde geschlossen.</p>
    <p>Gespeicherte Werte bleiben erhalten. Nicht gespeicherte Eingaben werden beim Neuladen verworfen.
      Prüfe anschließend den aktuellen Stand, bevor du einen Vorgang erneut ausführst.</p>
    <button type="button" (click)="reload()">Seite vollständig neu laden</button>
    <p class="hint">Danach öffnet sich die aktuelle Monatsübersicht. Falls nötig, melde dich erneut an.</p>
  </section>`
})
export class Update {
  constructor() {
    inject(Session).requireUpdate();
    afterNextRender(() => document.getElementById('update-title')?.focus());
  }
  protected reload(): void {
    // Vollständige Navigation lädt Einstieg und gehashte Dateien neu; kein Routerwechsel.
    window.location.replace('/monat');
  }
}
