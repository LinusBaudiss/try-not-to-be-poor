---
title: 'Story 2.2: Sparzielfortschritt aktualisieren und ansehen'
type: 'feature'
created: '2026-10-23'
status: 'done'
baseline_commit: '492f34d39873c53ee81a9240a6cbe70897bc7426'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '_bmad-output/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Der Gesamtfortschritt eigener Sparziele lässt sich bisher nicht aktualisieren oder zum Ziel ins Verhältnis setzen.

**Approach:** Gesamtbetrag ersetzen; bestätigten Betrag, Zielbetrag, Prozentanteil und zugänglichen Fortschrittsbalken anzeigen.

## Boundaries & Constraints

**Always:** Fortschritt 0..9007199254740991 ganzzahlige EUR-Cent, exakte Arithmetik. Eigentümer aus JWT-sub; SQL-Filter plus FORCE RLS mit transaktionslokalem Kontext. Erfolg erst nach Commitbestätigung. Daten/Entwürfe nur im Speicher; bei Sitzungsende/Kontowechsel löschen und späte Antworten verwerfen.

**Never:** Beiträge, Verlauf, Zielbearbeitung/-löschung, Offline-Synchronisierung, Deployment; bestehende Migrationen oder generierte Dateien manuell ändern.

## I/O & Edge-Case Matrix

| Fall | Eingabe/Zustand | Ergebnis/Fehler |
|---|---|---|
| Ersetzen | 20 € auf 30 € bei Ziel 100 € | 30 €, 30 %, entsprechender Balken; übrige Zielfelder unverändert. |
| Grenzen | 0, Maximum, Verringerung | Speichern und nach Neuladen unverändert anzeigen. |
| Ungültig | Negativ, leer, über zwei Nachkommastellen, über Maximum; API zusätzlich fehlend/null, gebrochene Cent, falscher Typ | Keine Mutation/Rundung; zugeordneter Feldfehler, Fokus und Eingabe erhalten. |
| Übererfüllung | 150 € bei Ziel 100 € | 150 €, 150 %, Überschreitung um 50 €; Balken maximal 100 %. |
| Isolation | Fremde/fehlende ID; ohne Sitzung | Identisches neutrales 404; ohne Sitzung 401. |
| Speichern | Laufend/offline/fehlgeschlagen/Bestätigung ungewiss | Doppelsenden verhindern/offline blockieren/kein Erfolg; Entwurf im offenen Tab erhalten. |
| Sitzungswechsel | Abmeldung, Ablauf, Kontowechsel während PUT | Daten/Entwurf löschen, verspätete Antwort verwerfen. |

</frozen-after-approval>

## Code Map

`BE` bezeichnet `backend/src/main/java/de/linus/tnbp`.

- `BE/savingsgoals/SavingsGoal{Controller,Service,Repository,Errors}.java`: Transaktionen, Kontext und Fehler wiederverwenden.
- `BE/access/AccessConfiguration.java`: bislang nur exakter Listenpfad freigegeben.
- `backend/src/main/resources/db/migration/V6__savings_goals.sql`: Fortschritt/Constraints/RLS vorhanden; bislang SELECT/INSERT erlaubt.
- `frontend/src/app/savings-goals/savings-goals.ts`: Identitätsprüfung, valid/accepts/clear erhalten. `frontend/src/app/shared/money.ts`: parseEuro/euroInput/formatEuro.

## Tasks & Acceptance

**Execution:**
- [x] `api-contract/openapi.yaml`: PUT `/savings-goals/{id}/progress`, UUID, Request ausschließlich progressCents; 200 SavingsGoalResponse, 400/401/404/500 und no-store. Separates 404-Schema nach Ausgabenmuster.
- [x] `backend/src/main/resources/db/migration/V7__savings_goal_progress.sql`: nur UPDATE(progress_cents) für Laufzeitrolle freigeben.
- [x] `BE/savingsgoals/SavingsGoal{Controller,Service,Repository,Errors}.java`: validieren; atomar UPDATE mit user_id/id und RETURNING in Kontexttransaktion; neutrales Nichtgefunden, sichere Fehler. `BE/access/AccessConfiguration.java`: PUT-Authentifizierung, Bearer-CSRF-Ausnahme, 401 und no-store ergänzen.
- [x] `frontend/src/app/savings-goals/savings-goals.ts`: Fortschrittsaktion je Ziel, vorbefülltes Formular, Abbrechen/Fokusrückgabe, gemeinsame Sendesperre, Offline-/Fehlerstatus und Cleanup. Nur geprüfte 200-Antwort mit passender ID und gesendetem Fortschritt übernehmen; Fehlerentwurf erhalten.
- [x] `frontend/src/app/shared/savings-progress.ts`, `frontend/src/styles.css`: exakte Prozentanzeige, Überschreitung und beschrifteten Balken responsiv gestalten.
- [x] `backend/src/test/java/de/linus/tnbp/savingsgoals/SavingsGoal{Test,IT}.java`, `frontend/e2e/savings-progress.spec.ts`: Matrix, Roh-JSON, Commitfehler, RLS, Kontentrennung und späte Antworten prüfen; übrige Spalten bleiben schreibgeschützt.

**Acceptance Criteria:**
- Angenommen ein eigenes Ziel, wenn ich Fortschritt speichere und neu lade, dann bleibt der neue Gesamtbetrag erhalten.
- Angenommen 320×568, 390×844, 768×1024 oder 1280×800, wenn ich mit Tastatur und 200 % Schrift bediene, dann sind Beträge, Prozent, Balken und Formular ohne horizontales Scrollen zugänglich; Fehler und Status werden assistiv vermittelt.

## Implementation Notes

- Vertrag, atomarer PUT, V7-Spaltenrecht und Fortschrittseditor umgesetzt; Kontokontext und Commitgrenze bleiben erhalten.
- Matrixaudit: Ersetzen/Grenzen/Übererfüllung durch `fortschrittErsetztGesamtbetragIdempotentUndErhaeltAlleZielfelder` und Browserfall „Gesamtfortschritt wird ersetzt…“; Ungültig durch Roh-JSON-/Validierungstests und „Feldfehler…“; Isolation durch Kontentrennungs-/RLS-Tests; Speichern durch Commitfehler-, Offline-, Bestätigungs- und Timeoutfälle; Sitzungswechsel durch alle drei verspäteten PUT-Fälle. Alle Prüfungen liefen erfolgreich.
- Verifikation: Vertrag und SPA-Build erfolgreich (`/tmp/story22-contract-final.log`); 42 Unit- und 79 Integrationstests ohne Fehler/Auslassungen (`/tmp/story22-backend.log`); 117/117 Browserfälle einschließlich elf Fortschrittstests, Axe und Layout in allen Prüfgrößen (`/tmp/story22-browser-final.log`).
- Vollständigen Diff einschließlich neuer Dateien gegen baseline_commit gelesen: `/tmp/tnbp-story22-bvai2ozx.diff`. `git diff --check` sauber.

- Reviewpatches B1/B2/B5/B8/E1/V1/V2 umgesetzt: andere Ziele während offenem Entwurf erklärt gesperrt, stabiler Fokusfallback, bestätigter Betrag in Live-Meldung, Datum-null-Roundtrip, gemessene Balkenbreite und isoliertes Update einer von zwei Karten. Kein offener Befund und keine Vertagung.
- Abschließende Gesamtverifikation nach allen Patches: Vertragsprüfung/SPA erfolgreich (`/tmp/story22-root-contract.log`), 42 Unit- und 79 Integrationstests ohne Fehler oder Auslassungen (`/tmp/story22-root-backend.log`), 119/119 Browserfälle einschließlich 13 Fortschrittsfällen (`/tmp/story22-root-browser.log`). Matrix erneut vollständig abgedeckt; `git diff --check` sauber.

## Spec Change Log

## Review Triage Log

| ID | Urteil | Evidenz und Route |
|---|---|---|
| B1 | medium | openProgress fokussiert bei jedem bereits offenen Editor dessen altes Ziel, selbst nach Aktion für ein anderes Ziel. Patch: andere Zielaktionen während Bearbeitung deaktivieren und den Grund erklären; Entwurf bleibt erhalten. |
| B2 | medium | load entfernt Zielkarten; cancelProgress fokussiert dann eine fehlende Zielaktion. Patch: beständigen Aktualisieren-Button als Fokusfallback nutzen. |
| B3 | low | Balken und Text teilen die Rundung auf 0,01 Prozentpunkte. Die maximale Abweichung von 0,005 Prozentpunkten ist bei der vorhandenen Balkengröße unsichtbar; präzisere Berechnung bringt im Alltag keinen Nutzen. Abgelehnt, da zusätzliches Berechnungsverhalten nötig wäre. |
| B4 | low | BigInt-Berechnung wird pro Karte wiederholt, aber eine spürbare Verzögerung ist weder gezeigt noch bei üblichen persönlichen Ziellisten zu erwarten. Abgelehnt: Memoisierung erhöht ohne belegten Nutzen die Zustandskomplexität. |
| B5 | low | Erfolg meldet bisher keinen bestätigten Betrag in der Live-Region. Direkter Textpatch: Zielname und Gesamtbetrag ankündigen. |
| B6 | false | Der Timeoutfall bestätigt bewusst keinen ungewissen Commit und fordert erneutes Laden. Er garantiert keine Reihenfolge unabhängiger paralleler Serveranfragen. PUT ist atomar und idempotent; eine geforderte Reihenfolge nach Client-Sendezeit besteht nicht. Kein belegter Verstoß gegen den beschriebenen Speichervertrag. |
| B7 | low | Cookie-only-Test verwendet synthetisches Cookie; die unveränderte stateless SecurityFilterChain authentifiziert ausschließlich Bearer, Refresh-Cookies werden nur am eigenen Refresh-Endpunkt verarbeitet. Zusätzlicher echter Sitzungsaufbau ist für diese Route unnötige Testkomplexität; abgelehnt. |
| B8 | low | Fortschritts-Roundtrip ohne Zieldatum fehlt. Direkte Ergänzung des vorhandenen Persistenztests. |
| B9 | maybe-false | Die Browserumgebung emuliert keine echte Bildschirmtastatur. Decimal-inputmode, Fokus und Scrollbarkeit sind geprüft; ein konkreter Fehler ist nicht gezeigt. Reales Mobilgerät wäre zum Nachweis erforderlich. Vermuteter geringer Prüfumfang rechtfertigt keinen zusätzlichen Emulationszustand; abgelehnt. |
| E1 | medium | Gleicher verifizierter Fokusverlust wie B2; gemeinsam patchen. |
| V1 | medium | Vorverifizierte Lücke: Entfernen der span-Breite ließe bisher alle Prozent-/ARIA-Tests bestehen. Patch: tatsächliche Füllbreite bei 0/30/über 100 Prozent prüfen. |
| V2 | medium | Vorverifizierte Lücke: erfolgreiche Updates werden bislang mit nur einem Ziel geprüft. Patch: zwei Karten anlegen, eine aktualisieren und unveränderte Identität/Felder/Fortschritt der anderen prüfen. |

## Design Notes

PUT ersetzt idempotent. Prozente mit BigInt auf maximal zwei Nachkommastellen kaufmännisch runden, deutsch formatieren; nur Balken begrenzen. Maximum bei 1 Cent Ziel darf weder überlaufen noch Exponentialschreibweise zeigen. Kalenderdaten bleiben unverändert.

## Verification

- `./scripts/check-contract.sh`: kompatibler Vertrag, generierte Schnittstellen und SPA kompilieren.
- `./backend/mvnw -f backend/pom.xml verify`: Unit-/PostgreSQL-Tests erfolgreich.
- `npm --prefix frontend run e2e`: Browserregressionen, Matrix, Axe und Layout erfolgreich.
