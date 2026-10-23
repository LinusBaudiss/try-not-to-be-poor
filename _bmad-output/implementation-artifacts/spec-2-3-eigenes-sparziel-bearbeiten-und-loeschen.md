---
title: 'Story 2.3: Eigenes Sparziel bearbeiten und löschen'
type: 'feature'
created: '2026-10-23'
status: 'done'
baseline_commit: '01f2303acb8bd7db0a35463ba8219b8d8b8d213c'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '_bmad-output/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Eigene Sparziele lassen sich bisher weder korrigieren noch entfernen.

**Approach:** Name, Zielbetrag und optionales Zieldatum bearbeiten; Löschen nach ausdrücklicher Bestätigung anbieten.

## Boundaries & Constraints

**Always:** Eigentümer aus JWT-sub, SQL-Kontofilter und FORCE RLS mit transaktionslokalem Kontext. Ganze EUR-Cent bis 9007199254740991, Zielbetrag positiv; keine Rundung. Fortschritt beim Bearbeiten erhalten. Erfolg erst nach Commitbestätigung. Daten und Entwürfe nur im Speicher; Sitzungsende/Kontowechsel löschen sie und verwerfen späte Antworten.

**Never:** Beiträge, Verlauf, Wiederherstellung, Offline-Synchronisierung, Deployment; alte Migrationen oder generierte Dateien manuell ändern.

## I/O & Edge-Case Matrix

| Fall | Eingabe/Zustand | Ergebnis/Fehler |
|---|---|---|
| Bearbeiten | Vorbefüllte eigene Zielwerte ändern | Nach Neuladen erhalten; ID/Fortschritt unverändert. PUT ersetzt editierbare Felder; Datum fehlend/null entfernt es. UI sendet unverändertes Datum erneut; ISO-Kalenderdatum ohne Zeitzone. |
| Ungültig | Leerer/NUL-Name; Zielbetrag ≤0, über Maximum oder über zwei Nachkommastellen; ungültiges Datum; API zusätzlich falsche Typen/null für Pflichtfelder/gebrochene Cent | Keine Mutation; Feldfehler zuordnen, Eingabe erhalten und Fehler fokussieren. |
| Übererfüllt | Fortschritt 150 €, neuer Zielbetrag 100 € | 150 €, 150 %, Überschreitung 50 €; Balken maximal 100 %. |
| Löschen | Dialog mit Zielname und endgültiger Löschfolge | Abbrechen/Escape erhält Ziel und fokussiert Auslöser; bestätigtes Löschen entfernt nur dieses Ziel. Danach nächste Zielaktion, sonst „Sparziel anlegen“ fokussieren, da Auslöser entfernt. |
| Isolation | Fremde/fehlende ID; keine Sitzung | Identisches neutrales 404; ohne Sitzung 401; keine fremden Daten. |
| Fehler | Offline, laufende Anfrage, 404/500/Timeout oder unpassende Bestätigung | Offline blockieren, Doppelsenden verhindern; keinen Erfolg melden, Bearbeitungsentwurf erhalten. Bei ungewissem Ergebnis erneutes Laden empfehlen. |
| Entwürfe | Fortschritt oder Zielbearbeitung geöffnet | Gegenseitig sperren und erklären; kein stilles Überschreiben. Löschdialog erst nach Speichern/Abbrechen öffnen. |

</frozen-after-approval>

## Code Map

`BE` = `backend/src/main/java/de/linus/tnbp`; `FE` = `frontend/src`.

- `BE/savingsgoals/`: Controller, Service, Repository, Errors und Json liefern Validierung, Kontokontext, Commitgrenze und striktes Datum; `SavingsGoalRequest` wiederverwenden.
- `FE/app/savings-goals/savings-goals.ts`: `editing` ist Fortschrittseditor; `accepts`, `valid`, `clear` erhalten. `FE/app/month/expenses.ts` liefert Dialog/Fokusmuster; `FE/app/shared/{money,savings-progress}.ts` liefert exakte Darstellung.

## Tasks & Acceptance

**Execution:**
- [x] `api-contract/openapi.yaml`: PUT/DELETE `/savings-goals/{id}` mit UUID, bestehendem Request, 200-Ziel/204-leer, 400/401/404/500 und no-store definieren.
- [x] `backend/src/main/resources/db/migration/V8__savings_goal_mutations.sql`: UPDATE nur für name/target_amount_cents/target_date ergänzen, DELETE erlauben; Eigentümer/ID bleiben schreibgeschützt.
- [x] `BE/savingsgoals/SavingsGoal{Controller,Service,Repository}.java`: validierter atomarer UPDATE nur der Zielfelder mit RETURNING, DELETE mit Trefferprüfung; Kontofilter und Transaktionen wiederverwenden. Gleichzeitiges Fortschrittsupdate nicht überschreiben.
- [x] `BE/access/AccessConfiguration.java`: neue Pfade für no-store, Bearer-CSRF-Ausnahme, Methodenzugriff und 401 ergänzen.
- [x] `FE/app/savings-goals/savings-goals.ts`, `FE/styles.css`: separaten Zielentwurf, Feldfehler, gemeinsame Sendesperre, Antwortprüfung, Cleanup und modalen Löschdialog ergänzen; Fokus einschließen, initial Abbrechen, während Anfrage Dialogschluss sperren.
- [x] `backend/src/test/java/de/linus/tnbp/savingsgoals/SavingsGoal{Test,IT}.java`, `frontend/e2e/savings-mutations.spec.ts`: Matrix einschließlich Maximum, Datum-null, Roh-JSON, Commitfehler, RLS, parallelem Fortschrittsupdate, zwei Konten/Zielen und späten PUT-/DELETE-Antworten prüfen; bisherige Rechteprüfungen anpassen.

**Acceptance Criteria:**
- Angenommen zwei eigene Ziele, wenn eines bearbeitet oder gelöscht wird, dann bleibt das andere vollständig unverändert.
- Angenommen 320×568, 390×844, 768×1024 oder 1280×800, wenn Tastatur und 200-%-Vergrößerung genutzt werden, dann bleiben Aktionen/Fokus sichtbar und ohne horizontales Scrollen erreichbar; Touch-Ziele ≥44 px, Geldfelder ≥48 px, Fehler/Status assistiv zugeordnet und reduzierte Bewegung berücksichtigt.

## Implementation Notes

- PUT/DELETE, V8 und getrennten Zielentwurf mit modaler Löschbestätigung umgesetzt; atomare Spaltenänderungen erhalten parallelen Fortschritt.
- Vollständigen Diff gegen baseline_commit einschließlich neuer Dateien gelesen: `/tmp/tnbp-story23-lQqdvi.diff`. Alle Aufgaben und Abnahmen geprüft.
- Matrixaudit: Bearbeiten/Übererfüllung durch Persistenz- und Browser-Roundtrip; Ungültig durch Roh-JSON-/Formularfälle; Löschen durch Dialog-/Fokus-/Persistenzfälle; Isolation durch API-/RLS-Tests; Fehler durch Commit-, Offline-, Doppelsende-, Timeout- und Antwortprüfungen; Entwürfe durch gegenseitige Sperren abgedeckt. Alle zugeordneten Tests liefen erfolgreich.
- Vertrag und Produktionsbuild erfolgreich (`/tmp/story23-contract.log`); 42 Unit- und 85 Integrationstests ohne Fehler/Auslassungen (`/tmp/story23-backend.log`); 136 Browsertests erfolgreich (`/tmp/story23-e2e-full.log`). Nach abschließender Hinweistext-/Testergänzung 43 Sparzieltests erneut erfolgreich (`/tmp/story23-e2e-savings.log`).

- Reviewpatches B1–B8/V1 umgesetzt. Fortschrittsantworten dürfen gültige parallele Zielfeldänderungen enthalten; Feldfehler bleiben beim Korrigieren anderer Felder sichtbar. Statusfokus, vollständige Tastaturfolge, Zoom-Reflow und späte erfolgreiche Timeoutantworten gezielt geprüft.
- Erweiterte Aktionsprüfung zeigte zu enge Editor-Innenabstände bei 320 px/200-%-Text sowie am Viewportrand abgeschnittene Aktionen. Innenabstand begrenzt und Scrollabstand ergänzt; Layoutprüfung über zehn Kombinationen erfolgreich. Datenbankkonkurrenz nun über tatsächliche blockierte Prozesse nachgewiesen.

- Abschließende Gesamtverifikation nach allen Patches erfolgreich: Vertrag/Produktionsbuild (`/tmp/story23-root-contract.log`), 42 Unit- und 85 Integrationstests ohne Fehler/Auslassungen (`/tmp/story23-root-backend.log`), 141/141 Browserfälle (`/tmp/story23-root-browser.log`). Vollständigen aktualisierten Diff erneut gelesen, Aufgaben/Abnahmen und jede Matrixzeile nochmals abgeglichen; keine offenen Befunde oder Vertagungen. `git diff --check` sauber.

- CI-Nachprüfung für PR #10: Chromium konnte trotz unmittelbarer response.json-Lesung den POST-Body im bestehenden Anlagetest sporadisch nicht bereitstellen. Test liest nun die echte Serverantwort über route.fetch vor unveränderter Weitergabe an die Oberfläche; Status-, Werte-, Persistenz- und UI-Assertions bleiben erhalten. Betroffene Testdatei dreimal erfolgreich: 39/39 (`/tmp/story23-ci-create-response.log`).

## Spec Change Log

## Review Triage Log

| ID | Urteil | Evidenz und Route |
|---|---|---|
| B1 | medium | saveProgress vergleicht Name/Ziel/Datum mit altem Entwurf; seit Zielbearbeitung können gültige parallele Änderungen diese Vergleiche verletzen. Patch: nur gültige Antwort, passende ID und gesendeten Fortschritt verlangen; reale Interleaving-Prüfung ergänzen. |
| B2 | medium | editTarget löscht über resetMutationStatus alle Feldfehler, auch unverändert ungültige Felder. Patch: nur Fehler des geänderten Feldes entfernen und allgemeinen Status zurücksetzen. |
| B3 | medium | Neue fokussierte Statusabsätze besitzen nur :focus-visible; Mausbedienung garantiert damit keine sichtbare Fokusanzeige. Patch: vorhandenes explizites :focus-Muster ergänzen und prüfen. |
| B4 | low | Root-Schriftvergrößerung prüft keine halbierte effektive Viewportbreite. Patch: ergänzende Reflowgrößen für 200-%-Zoom als reine Testdaten prüfen, getrennt von Textvergrößerung benennen. |
| B5 | medium | Tastaturprüfung endet am Datum und überspringt Speichern/Abbrechen. Patch: bestehende Traversierung und Sichtbarkeits-/Größenprüfungen bis zu beiden Aktionen erweitern. |
| B6 | low | Timeouttest bricht gehaltene Anfrage ab und prüft keinen späteren Erfolg. RxJS-Timeout beendet das Abonnement bereits; direkte Testergänzung mit verspäteter erfolgreicher Antwort bestätigt den erhaltenen Zustand. Patch. |
| B7 | medium | Server-400-Test injiziert nur name; Betrag-/Datumzuordnung sind durch lokale Validierungstests nicht geprüft. Patch zusammen mit V1. |
| B8 | medium | 100-ms-Future-Timeout belegt nicht, dass die konkurrierende Abfrage bereits am PostgreSQL-Lock wartet. Patch: tatsächlichen blockierten Datenbankprozess vor Commit nachweisen, nach vorhandenem ExpenseIT-Muster. |
| B9 | false | Sprintstatus in-progress ist während des internen Build-Reviews vorgesehen; der Ablauf synchronisiert die Übergabe erst beim Abschluss. Kein Produktfehler; abschließende Statusangleichung erfolgt im vorgesehenen Schritt. |
| V1 | medium | Vorverifizierte Lücke: Entfernen der serverseitigen Betrags-/Datumfehlerzuordnung ließe bestehende Tests bestehen. Patch: vorhandenen Feldfehlertest parametrisieren, Fokus, Fehlermeldung, ARIA-Zuordnung und Entwurferhalt prüfen. |

## Verification

- `./scripts/check-contract.sh`: kompatibler Vertrag und generierte Schnittstellen kompilieren.
- `./backend/mvnw -f backend/pom.xml verify`: Unit-/PostgreSQL-Tests erfolgreich.
- `npm --prefix frontend run e2e`: Browserregressionen, Matrix, Axe und Layout erfolgreich.
