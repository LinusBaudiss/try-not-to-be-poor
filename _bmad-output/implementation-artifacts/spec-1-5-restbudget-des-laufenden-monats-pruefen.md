---
title: 'Story 1.5: Restbudget des laufenden Monats prüfen'
type: 'feature'
created: '2026-10-23'
status: 'done'
baseline_commit: 'aa9b9380959403e6778735c9326cdc53938efd1a'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
---

<frozen-after-approval reason="Menschlich freizugebender Umfang">

## Intent

**Problem:** Das verbleibende Monatsbudget muss selbst errechnet werden.
**Ansatz:** Monatsbudget, laufende Ausgaben und prominentes Restbudget gemeinsam per API laden und anzeigen.

## Boundaries & Constraints

**Immer:** Rest = fortlaufendes Budget minus eigene Ausgaben des aktuellen Berlin-Monats. Exakte EUR-Cent innerhalb ±9007199254740991. Eigentümer aus geprüftem JWT-`sub`, Abfragefilter und erzwungene RLS mit lokalem `app.user_id`. Finanzdaten nur im Arbeitsspeicher; Sitzungsende/Kontowechsel löschen sie und verwerfen späte Antworten. Vertragsgenerierung und bestehende Funktionen erhalten.

**Außerhalb:** Ausgaben bearbeiten/löschen, Einnahmen, Diagramme, neue Persistenz, Produktionsdeployment und echte Nutzerdaten.

## I/O & Edge-Case Matrix

| Angenommen | Wenn | Dann |
|---|---|---|
| Budget 10000 Cent, eigene Monatsausgaben 1234; andere Monate/Konten vorhanden | Übersicht öffnen | 100,00 € Budget, 12,34 € Ausgaben, 87,66 € Rest; Monat erkennbar. |
| Budget vorhanden, keine laufenden Ausgaben | Übersicht öffnen | Ausgaben 0,00 €; Rest entspricht Budget. |
| Budget fehlt oder ist ausdrücklich null Euro | Übersicht öffnen | Fehlend: Budgetaufforderung, kein numerischer Rest; Nullbudget: korrektes numerisches Ergebnis. |
| Ausgaben über Budget | Übersicht laden | Tatsächlicher negativer Betrag mit ausdrücklichem Text „Budget überschritten“. |
| Budgetentwurf oder laufende/fehlgeschlagene Speicherung | Übersicht ansehen | Keine Entwurfswerte; nach bestätigtem Speichern neu laden. |
| Erfassung oder Budgetänderung bestätigt, Historie aktualisiert oder Berlin-Monat gewechselt | Übersicht aktualisieren | Aktueller gemeinsamer Datenstand; überholte Antworten verwerfen. |
| Laden, Fehler, ungültige Antwort oder Sitzungswechsel | Antwort verarbeiten | Kein Nullsaldo oder alte/fremde Werte; Ladefehler wiederholbar. |

</frozen-after-approval>

## Code Map

- `backend/src/main/java/de/linus/tnbp/expensebudget/`: BudgetRepository/ExpenseRepository liefern SQL-Muster, BudgetService Berlin-Clock, ExpenseErrors sichere Fehler.
- `frontend/src/app/month/month.ts`: Identitätsprüfung, bestätigter Budget-PUT; `expenses.ts`: bestätigter POST und Nachladen. Ereignisse ergänzen.
- `frontend/e2e/{budget,expenses}.spec.ts`: Auth-/Race-/axe-Muster; globale `.money`-Selektoren gezielt halten.
- Story 1.4 integriert; Epic-Kontext gültig. Sprintschlüssel: `1-5-restbudget-des-laufenden-monats-prüfen`.

## Tasks & Acceptance

- [x] `api-contract/openapi.yaml`: GET `/expense-budget/month-summary` mit `month` als Monatsanfang, `budgetCents`/`remainingCents` nullable, `expensesCents`, Centgrenzen und Fehlerantwort; Schnittstellen generieren.
- [x] `backend/src/main/java/de/linus/tnbp/expensebudget/MonthSummary{Repository,Service,Controller,Errors}.java`, benachbartes `../access/AccessConfiguration.java`: JWT-Route samt 401-Zuordnung, gemeinsamer Datenbanksnapshot, exakte Differenz, no-store und sichere Fehler.
- [x] `frontend/src/app/month/{month-summary,month,expenses}.ts`, `frontend/src/app/shared/money.ts`, `frontend/src/styles.css`: Zusammenfassung vor Formularen, Änderungsereignisse und Zustände; signierte Formatierung ohne negative Eingaben.
- [x] `backend/src/test/java/de/linus/tnbp/expensebudget/MonthSummary{Test,IT}.java`: Matrix, Centgrenzen, Berlin-Monats-/Jahreswechsel, Kontentrennung/JWT/RLS und konsistente Abfrage prüfen.
- [x] `frontend/e2e/month-summary.spec.ts` und betroffene bestehende Browserfälle: Matrix, Antwortreihenfolge, Speicherung, Sitzungsende, Monatswechsel und Layout prüfen.
- [x] Diese Spezifikation und `_bmad-output/implementation-artifacts/sprint-status.yaml`: Fortschritt und Nachweise festhalten.

**Abnahme:** Angenommen 320 × 568 oder 1280 × 800 CSS-Pixel und 200-%-Text, wenn per Tastatur bedient wird, dann bleiben beschriftete Beträge ohne horizontales Scrollen lesbar, das Restbudget prominent und Änderungen zugänglich angekündigt; axe besteht.

## Implementation Notes

- GET `/expense-budget/month-summary` liest das fortlaufende Budget und die aktuelle Ausgabensumme in genau einer SQL-Anweisung und einem MVCC-Snapshot. Monat einmal aus der Berlin-Clock, Eigentümer aus dem geprüften JWT; Transaktion setzt lokalen RLS-Kontext. Summen und Differenz werden vor Ausgabe exakt und gegen die Centgrenze geprüft. Keine Migration nötig.
- Monatsübersicht vor beiden Formularen: klarer Monat, prominenter signierter Rest, Budget und Monatsausgaben; fehlendes Budget unterscheidet sich von Nullbudget. Die signierte Formatierung erweitert nur die Anzeige, die Eingabe bleibt nichtnegativ.
- Öffnen, bestätigte Budget-/Ausgabenänderungen, erfolgreiche explizite Historienaktualisierung, eigener Aktualisieren-Knopf und Berlin-Monatswechsel laden neu. Requestsequenz, Sitzungsgeneration und Konto verwerfen überholte Antworten. Laden/Fehler entfernen die vorherige Zusammenfassung; Sitzungsende entfernt alle Werte.
- Kalenderwechsel wird einmal pro Sekunde und bei Fokus/Sichtbarkeitswechsel geprüft; Hintergrund-Timer können vom Browser gedrosselt werden, beim Zurückkehren wird sofort erneut geprüft.

## Spec Change Log

## Review Triage Log

Durchlauf 1: alle drei unabhängigen Layer abgeschlossen; Verifikationsreview ohne Lücken. Jeder Befund vor Gruppierung geprüft.

| Fund | Urteil | Beleg und Route |
|---|---|---|
| Blind 1: Summary-Refresh während noch unbestätigtem Schreibrequest | false | GET bestätigt selbst einen bereits gespeicherten Snapshot; weder Entwurf noch optimistische Daten fließen ein. Der freigegebene Umfang verbietet keine unabhängige bestätigte Leseabfrage während eines POST/PUT. |
| Blind 2: vorgehende Geräteuhr verpasst tatsächlichen Monatswechsel | medium | checkMonth setzt observedMonth vor dem GET; antwortet der Server noch mit dem alten Monat, bleibt beim späteren Serverwechsel jede weitere Abfrage aus. Patch: vorhandenen HTTP-Date-/Monotonzeitansatz für den Kalender verwenden und Uhrabweichung testen. |
| Blind 3: Monatswechsel offline wird nach Reconnect nicht wiederholt | medium | observedMonth wird trotz gescheitertem GET weitergesetzt; online prüft anschließend denselben Wert. Patch: bei Wiederverbindung erneut laden und Test ergänzen. |
| Blind 4: zwei widersprüchliche bestätigte Budgetanzeigen | medium | Summary-Aktualisierung liest nach externer Änderung neue Beträge, Month.amountCents bleibt alt. Patch: bestätigten Budget-Anzeigewert intern abgleichen, ungespeicherten Entwurf erhalten; Test mit externer Änderung. |
| Blind 5: alte HTTP-Anfragen laufen bis Timeout weiter | low | Veraltete Antworten werden verworfen, Anfragen sind begrenzte lesende Snapshots ohne weitere Mutation. Zusätzliche Abbruchzustände rechtfertigt der geringe praktische Nutzen hier nicht; verworfen. |
| Blind 6: DateTimeFormat wird jede Sekunde neu erzeugt | low | berlinMonth erstellt beim Timer wiederholt denselben Formatter. Direkte Korrektur: Instanz wiederverwenden. |
| Blind 7: Fehlermeldungen ohne Kategorie/Korrelation | low | Sicherer generischer Logeintrag ist vorhanden; keine beobachtete Diagnoseblockade. Zusätzliche Korrelationsstruktur ohne konkrete Störung rechtfertigt die Komplexität nicht; verworfen. |
| Blind 8: Überlauftest beweist nicht die Lesbarkeit extremer Beträge | low | Test prüft vollständigen signierten Text und inneren/äußeren Überlauf; maximale sichere Centwerte umbrechen bei 200-%-Text über mehrere Zeilen. Kein Textverlust, alltägliche Monatsbeträge wesentlich kürzer. Zusätzliche Layout-/Bildvergleichslogik wegen geringem Nutzen verworfen. |
| Blind 9: Fokus-/Visibility-Pfade ohne direkten Browsertest | low | Handler sind implementiert, Suite prüft nur laufenden Timer. Direkte Korrektur: Rückkehr nach unterbrochenen Timern und genau eine Aktualisierung testen. |
| Edge 1: früher Gerätewechsel hält alten Servermonat fest | medium | Gleicher nachgewiesener Zustandsfehler wie Blind 2; gemeinsamer Patch. |

Gruppierung: Blind 2 und Edge 1 teilen denselben verfrühten Kalenderwechsel. Alle angenommenen Befunde sind lokale direkte Korrekturen ohne neue API, Persistenz oder Produktentscheidung und gehen an den vorhandenen Implementierungsagenten. Keine Änderung des freigegebenen Blocks und keine Rückstellung.

## Design Notes

Ein SQL-Snapshot verhindert gemischte Werte; Monat einmal aus Server-Clock bestimmen. Aktualisierung beim Öffnen, nach Bestätigung, ausdrücklich und am Monatswechsel. Konto, Sitzungsgeneration und Requestsequenz prüfen. Keine Migration oder externe Nebenwirkung; keine offenen fachlichen Entscheidungen.

## Verification

Erfolgreich am 2026-10-23 mit Java 25, Node 24.22.0 und den vorhandenen temporären Werkzeugcaches geprüft:

- Vertragsprüfung inklusive Rückwärtskompatibilität, generiertem Java-/TypeScript-Vertrag und Produktions-SPA: erfolgreich (`/tmp/story15-contract.log`).
- Backend: 38 Unit- und 57 echte PostgreSQL-18.6-Integrationstests erfolgreich (`/tmp/story15-backend.log`). Neu: zwei Unit- und fünf Integrationstests, darunter ein deterministischer paralleler Commit zwischen Budget- und Ausgabenleseoperation zur Snapshotprüfung.
- Gesamte Browserregression: 69 Fälle erfolgreich (`/tmp/story15-e2e.log`). Anschließend ergänzte und auf `America/Los_Angeles` festgelegte Monatsübersicht-Suite: alle acht Fälle einschließlich Tokenablauf erfolgreich (`/tmp/story15-summary-e2e.log`). Zusammen 70 verschiedene Browserfälle.
- 320 × 568 und 1280 × 800, jeweils 100-/200-%-Text, Tastatur, Live-Ankündigung und axe erfolgreich in der neuen Suite.
- `git diff --check`: erfolgreich. Keine echten Nutzerdaten oder Produktionsänderungen.

Reproduzierbare Befehle:

- `./scripts/check-contract.sh`: kompatibler Vertrag; beide generierten Schnittstellen und SPA kompilieren.
- `./backend/mvnw -f backend/pom.xml verify`: Unit- und echte PostgreSQL-Integrationstests erfolgreich.
- `npm --prefix frontend run e2e`: neue Abnahmen und bestehende Regressionen erfolgreich.
- `git diff --check`: keine Whitespacefehler.

### Matrixabgleich durch den Hauptagenten

Vollständigen Diff mit neuen Dateien gelesen. Alle sieben Matrixzeilen sind durch ausgeführte grüne Tests belegt: (1–4) `MonthSummaryIT.matrixUndKontentrennungGebenNurDenAktuellenBerlinMonatZurueck`, Null-/Grenzwerttests und Browser „gemeinsamer Datenstand“; (5) Browser „bestätigte Budget- und Ausgabenänderungen“; (6) Browser Änderungsereignisse, Antwortreihenfolge und Berlin-Monatswechsel sowie Backend-Snapshottest; (7) Browser ungültige Antworten, Kontowechsel und tatsächlicher Tokenablauf. Responsive/Tastatur/Live-/axe-Abnahme in beiden Viewports mit 100-/200-%-Text bestanden. Protokolle und Testquellen gegengeprüft; fachliches Review folgt.


### Abschluss nach Review-Korrekturen

- Alle drei unabhängigen Review-Layer abgeschlossen; jeden Befund einzeln bewertet. Alle angenommenen Befunde lokal korrigiert, nichts zurückgestellt. Der freigegebene Block blieb unverändert.
- Monatswechsel verwendet HTTP-Date plus monotone Zeit statt Geräteuhr; der Formatter wird wiederverwendet. Wiederverbinden lädt erneut. Bestätigte Summarywerte gleichen die separate Budgetanzeige ab, erhalten aber bearbeitete Entwürfe; eine ältere Budgetantwort überschreibt neuere Bestätigungen nicht.
- Neue Regressionen sichern vorgehende Geräteuhr, Offline-Monatswechsel, externe Budgetänderung sowie Fokus-/Visibility-Rückkehr bei pausiertem Kalendertimer und verspäteter Altantwort ab. Betroffene Browsersuiten zunächst gezielt erfolgreich: 27 Fälle, `/tmp/story15-review-fixes-e2e.log`.
- Hauptagent hat den korrigierten Gesamtdiff nochmals vollständig gelesen und alle Prüfungen selbst ausgeführt: Vertragskompatibilität, beide generierten Schnittstellen und Produktionsbuild erfolgreich; **38 Unit-Tests, 57 PostgreSQL-Integrationstests und 74 Browserfälle erfolgreich, keine Fehler oder übersprungenen Fälle**. Darunter 2 neue Unit-, 5 Integrations- und 12 Browserfälle zur Monatsübersicht. Alle Matrixzeilen und responsive Abnahmen erneut mit den grünen Nachweisen abgeglichen.
- Finale Protokolle: `/tmp/story15-root-contract.log`, `/tmp/story15-root-backend.log`, `/tmp/story15-root-browser.log`. Vollständiger geprüfter Diff einschließlich Korrekturen: `/tmp/story15-patched-diff.patch`. `git diff --check` erfolgreich.
- Spezifikation abgeschlossen; Sprintstatus bleibt für menschliche Abnahme auf `review`. Keine Produktionsänderungen und kein Push.
