---
title: '5.3 Frontend-Verhalten mit Unit- und isolierten Komponententests absichern'
type: 'refactor'
created: '2026-11-15'
status: 'draft'
route: 'dispatch'
story_key: '5-3-frontend-verhalten-mit-unit-und-isolierten-komponententests'
review_loop_iteration: 0
context:
  - '_bmad-output/implementation-artifacts/epic-5-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Story 5.3 ergänzt schnelle Frontend-Tests und verlagert geeignete E2E-Varianten mit nachgewiesenem Ersatz. Alle acht Story-Abnahmen und TR-2/TR-3/TR-6 bis TR-10 aus `epics.md` bleiben verbindlich. Mehr als 50 % der unterschiedlichen fachlichen Frontend-Szenarien sollen primär isoliert abgesichert sein; doppelte Ausführungen erhöhen die Quote nicht.

## Boundaries & Constraints

**Immer:** Produktverhalten, exakte Centwerte, Sitzungsgrenzen und echte Browsernachweise erhalten. Vor Entfernung alter Assertions alte und neue Tests erfolgreich ausführen und Beobachtungen einzeln zuordnen. Fehlende Nachweise sichtbar lassen. Bestehende Pflichtprüfungen und neue Tests bei Push/PR ausführen.

**Ausgeschlossen:** Framework-Upgrades, Vertragsänderungen, generierte Dateien manuell ändern, Produktfunktionen ergänzen, echte Integrationsgrenzen durch Mocks ersetzen, Veröffentlichung und GitHub-Abgleich. Kleine verhaltenserhaltende Extraktionen sind zulässig.

## I/O & Edge-Case Matrix

| Zustand/Eingabe | Erwartung |
| --- | --- |
| Euroeingaben, ±9007199254740991 Cent, Überpräzision/Überlauf | Exakte deutsche Anzeige; ungültige Eingaben ablehnen; Null-/Positivregeln feldabhängig |
| Negativer/übererfüllter Fortschritt | Tatsächlicher Betrag/Prozentwert; ausschließlich Balken auf 0–100 % begrenzen |
| Kalenderdatum, fehlendes Budget/null, leere Listen, „Berlin-Fahrt“ | Kalenderdatum erhalten; Zustände unterscheiden; Nutzertext erhalten, keine System-Zeitzonenhinweise |
| Verzögerung, Feldfehler, offline, verlorene Bestätigung | Doppelsenden sperren; kein vorzeitiger Erfolg; Entwurf erhalten; ungewisse Mutation erst nach Zustandsklärung wieder freigeben |
| Löschen bestätigen/abbrechen | Nur bestätigte Aktion sendet; sichtbarer Zustand folgt Antwort |
| Abmeldung, Ablauf, Konto-/Ansichtswechsel und späte Antwort | Alte Daten, Entwürfe und Meldungen bleiben verworfen; Tokens/Finanzdaten nur im Arbeitsspeicher |

</frozen-after-approval>

## Open Questions

- Story 5.1 ist Voraussetzung, steht aber auf `backlog`; Inventar, Matrix und Baseline fehlen. Zuerst 5.1 beauftragen und 5.3 danach fortsetzen, oder 5.3 ausdrücklich vorziehen? Beim Vorziehen bleiben Vergleichs-/Abschlussnachweise abhängig von 5.1; ohne bestandenen Ersatz und Zuordnung entfällt kein E2E-Fall.

## Code Map

- `frontend/src/app/shared/{money,savings-progress}.ts`: reine Funktionen, BigInt-Arithmetik und Balkengrenzen direkt testen.
- `frontend/src/app/{month/month,month/month-summary,expenses/expenses,savings-goals/savings-goals}.ts`: echte Templates, Formulare, Dialoge, Antwortvalidierung und Generationsentscheidungen; Operations-Dienste bewahren Sperren über Navigation.
- `frontend/src/app/savings-goals/monthly-automation.ts`: begrenzte Input-/Output-Komponente und `SavingsOperations`; Aktionen im Elternteil testen.
- `frontend/src/app/session/{session,session.interceptor}.ts`: echte Sitzung mit HTTP-Testbackend verdrahten; Generationsentscheidung nicht durch Fake vorwegnehmen. Timer, Channels und Locks kontrollieren/aufräumen.
- `frontend/src/app/{login/login,registration/registration,session/logout-button}.ts`: Zugang, Entwürfe und zugängliche Statusmeldungen.
- `frontend/angular.json`, `frontend/package.json`: installierter Angular-22.2.3-Builder `@angular/build:unit-test` unterstützt Vitest und jsdom; direkte Testabhängigkeiten fehlen.
- `frontend/e2e/*.spec.ts`, drei `frontend/playwright*.config.ts`: vorhandene Varianten und reale Browsergrenzen; häufig gemeinsame Assertions zu Fachlogik und Fokus/Layout.

## Tasks & Acceptance

**Execution:**
- [ ] `frontend/{angular.json,package.json,package-lock.json,tsconfig.spec.json}` — Vitest/jsdom kompatibel exakt pinnen; getrennte Unit-/Komponentenbefehle ohne Watch/API/DB einführen.
- [ ] `frontend/src/app/shared/*.spec.ts` — Wertebereich und Formatierung der Matrix direkt prüfen.
- [ ] `frontend/src/app/{session,month,expenses,savings-goals,login,registration}/` — benachbarte isolierte Tests ergänzen; TestBed, echte Templates, kontrollierte HTTP-Antworten und Zeit verwenden; Speicherfreiheit prüfen.
- [ ] `_bmad-output/implementation-artifacts/story-5-3-testnachweise.md` — 5.1-Matrix fortführen: stabile Szenarien, bisherige/neue Referenzen, primäre Testart, notwendige Integration, Quotenzählung, Abdeckung und Laufzeiten.
- [ ] `frontend/e2e/*.spec.ts` — ausschließlich belegte Varianten nach bestandener Ersatzprüfung reduzieren; reale Zugangs-/Finanz-/Automatik-, HTTP-, Fokus-, Layout- und Barrierefreiheitsnachweise erhalten.
- [ ] `.github/workflows/ci.yml`, `README.md` — schnellen Pflichtpfad und Einzeltest-/Coveragebefehle dokumentieren.
- [ ] `_bmad-output/implementation-artifacts/story-5-3-testnachweise.md` — Fehlereinbauten für Formatierung, Doppelsenden, späte Kontoantwort und Fortschrittsbegrenzung nachweislich erkennen; Änderungen vollständig zurücknehmen.

**Acceptance Criteria:**
- Angenommen installierte Pins, wenn die neuen Befehle laufen, dann sind Unit-/Komponentenergebnisse getrennt und Exitstatus belastbar, ohne Gesamt-SPA/API/PostgreSQL.
- Angenommen Matrixfälle, wenn Tests produktive Funktionen/Templates ausführen, dann sind sichtbare Texte, Labels, Fehlerzuordnung, Status und Aktionen einschließlich Antwortreihenfolgen abgesichert.
- Angenommen abgeschlossene Verlagerung, wenn isolierte und alle drei Browsergruppen laufen, dann bestehen sie und die Szenariomatrix belegt über 50 % isolierte Hauptabsicherung ohne künstliche Fallvermehrung.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

- Neue getrennte Testbefehle und Coverage: Namen/Pins bei Einführung dokumentieren; generierten Code ausschließen.
- `npm --prefix frontend run build`, `./scripts/check-contract.sh`.
- `npm --prefix frontend run e2e`, `npm --prefix frontend run e2e:transition`, `npm --prefix frontend run e2e:automation`.
- Kontrollierte Fehlereinbauten müssen passende Tests fehlschlagen lassen; danach sauberer Wiederholungslauf.

Planungsreferenz: `71c329e87fc8a130d132e9fb835aa880429d89c2`. Keine Implementierung oder Testausführung mit diesem Entwurf behauptet; keine vorherige abgeschlossene Epic-5-Story vorhanden.
