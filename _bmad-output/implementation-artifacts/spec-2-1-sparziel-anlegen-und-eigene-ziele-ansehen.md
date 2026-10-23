---
title: 'Story 2.1: Sparziel anlegen und eigene Ziele ansehen'
type: 'feature'
created: '2026-10-23'
status: 'done'
baseline_commit: 'eb7d035168d576adda51d91d6bf5e4ea7ca1dcc5'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '_bmad-output/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Der Sparzielbereich fehlt. Angemeldete Personen sollen festhalten können, worauf sie sparen.

**Approach:** Eigene Ziele mit Name, positivem Euro-Zielbetrag und optionalem Zieldatum anlegen und auflisten. Neue Ziele beginnen bei 0 € Fortschritt. Navigation „Monat / Sparziele“ ergänzen; „Monat“ bleibt Startansicht.

## Boundaries & Constraints

**Always:** Eigentümer ausschließlich aus JWT-`sub`; SQL-Filter plus erzwungene RLS mit transaktionslokalem Kontext. Zielbetrag 1..9007199254740991 ganzzahlige Cent, exakte Umrechnung. Zieldatum bleibt Kalenderdatum, auch vergangene Daten sind zulässig. Finanzdaten und Entwürfe nur im Arbeitsspeicher; bei Sitzungsende/Kontowechsel verwerfen. Erfolg erst nach Commitbestätigung. Bestehende Design-Tokens verwenden.

**Never:** Fortschritt ändern, Prozentbalken, Ziele bearbeiten/löschen, Beitragsverlauf, Offline-Synchronisierung oder Produktionsdeployment. Keine Änderung bestehender Migrationen oder manuelle Bearbeitung generierter Schnittstellen.

## I/O & Edge-Case Matrix

| Fall | Eingabe/Zustand | Ergebnis/Fehler |
|---|---|---|
| Anlage | Name, positiver Zielbetrag, optional ISO-Datum | Eigenes Ziel erscheint nach Bestätigung mit Fortschritt 0; Datum unverändert. |
| Validierung | Leername, NUL, 0/negative/zu große oder gebrochene Cent, über zwei Dezimalstellen, ungültiges Datum | Ablehnen ohne Rundung; Feldfehler, Fokus und Entwurf erhalten. |
| Listenabruf | Keine Ziele / laufender Abruf / Fehler | Aktion „Sparziel anlegen“ / Platzhalter / Wiederholung; keine alten Werte. |
| Speichern | Laufend / offline / fehlgeschlagen | Doppelsenden verhindern / blockieren / kein Erfolg; Entwurf erhalten. Ungewisse Speicherung benennen. |
| Isolation | Zweites Konto oder verspätete Antwort nach Sitzungswechsel | Nur eigene Ziele; alte Antworten verwerfen, Daten und Entwürfe löschen. |

</frozen-after-approval>

## Code Map

- `api-contract/openapi.yaml`: maßgeblicher Vertrag; Generatoren über `scripts/check-contract.sh`.
- `backend/src/main/java/de/linus/tnbp/expensebudget/Expense{Controller,Service,Repository,Errors}.java`: Vorbilder für Commitgrenze, Validierung, Kontext und sichere Fehler; keine Modulabhängigkeit einführen.
- `frontend/src/app/month/{month,expenses}.ts`: Identitätsprüfung, Lebenszyklus/Antwortschutz, Kalenderformatierung und Fehlerfokus als Muster. `session/session.ts` liefert Nutzer und Generation; `shared/money.ts` liefert exakten Parser/Formatierer.
- `backend/src/test/java/de/linus/tnbp/access/PostgresFixture.java` und `frontend/e2e/expenses.spec.ts`: echte Datenbank und Browser-Prüfmuster wiederverwenden.

## Tasks & Acceptance

**Execution:**
- [x] `api-contract/openapi.yaml`: GET/POST `/savings-goals`, Tag `SavingsGoals`; Request `name`, `targetAmountCents`, optional nullable `targetDate`; Antwort zusätzlich `id`, `progressCents`. GET liefert Liste, POST 201; Fehler 400/401/500, `no-store`; kein Eigentümer-/Fortschrittsfeld im Request.
- [x] `backend/src/main/resources/db/migration/V6__savings_goals.sql`: eigenes Schema/Tabelle, UUID, Eigentümer-FK, nichtleerer Name, sichere BIGINT-Grenzen, Fortschritt DEFAULT 0, optional DATE; FORCE RLS und minimale SELECT/INSERT-Rechte.
- [x] `backend/src/main/java/de/linus/tnbp/savingsgoals/SavingsGoal{Controller,Service,Repository,Errors}.java`: generiertes Interface implementieren, transaktionales Lesen/Anlegen mit zusätzlichem Eigentümerfilter; Namen wie Ausgaben trimmen, Datum strikt prüfen, Liste stabil nach ID sortieren, Fehler ohne Dateninhalte.
- [x] `backend/src/main/java/de/linus/tnbp/access/{AccessConfiguration,DatabaseRoleVerifier}.java`: GET/POST erlauben, Bearer-POST-CSRF-Ausnahme, 401/no-store und Rollenprüfung erweitern; Sitzungsendpunkte behalten ihren Schutz.
- [x] `frontend/src/app/savings-goals/savings-goals.ts`: geschützte Ansicht mit Identitätsprüfung, Zielliste/Formular, Ladeplatzhaltern, zugeordneten Fehlern, Fokus, Offline-/Speicherstatus und Sitzungs-Cleanup implementieren; Antworten validieren.
- [x] `frontend/src/app/{app.ts,app.routes.ts}` und `frontend/src/styles.css`: `/sparziele` mit `sessionGuard`, Hauptnavigation mit aktivem Bereich und responsive Zielkarten; sichtbare Labels, Euro-Hinweis und Kalenderdatum ohne Zeitzonenumrechnung.
- [x] `backend/src/test/java/de/linus/tnbp/savingsgoals/SavingsGoal{Test,IT}.java` und `frontend/e2e/savings-goals.spec.ts`: Matrix einschließlich Centgrenze, Schaltjahr, fehlendem RLS-Kontext, zwei Konten, Commitfehlern und verspäteten Antworten prüfen.

**Acceptance Criteria:**
- Angenommen ich melde mich an, wenn ich navigiere, dann startet „Monat“ und beide Bereiche sind beschriftet erreichbar.
- Angenommen eigene Ziele sind bestätigt, wenn ich sie öffne, dann sehe ich Name, Zielbetrag, Fortschritt und gegebenenfalls Zieldatum im deutschen Format.
- Angenommen 320 × 568 oder 1280 × 800, wenn ich die Ansicht mit Tastatur/Touch und 200 % Schrift bediene, dann bleiben Inhalt, Fokus und Aktionen ohne horizontales Scrollen zugänglich; Statuswechsel werden angekündigt.

## Implementation Notes

- Vertrag, V6-Migration, eigenes Modul, geschützte Ansicht und Navigation umgesetzt. Zusätzlich `SavingsGoalJson.java`: lokaler Request-Deserializer verhindert die standardmäßige Normalisierung von Zeitstempeln und Datumsarrays.
- Vollständigen Diff einschließlich neuer Dateien gegen `baseline_commit` geprüft: `/tmp/tnbp-story-2-1-diff-kWc7HO.patch`.
- Matrixaudit: Anlage/Isolation durch `eigeneZieleWerdenGetrimmtMitNullFortschrittUndUnveraendertemDatumGespeichert` und Browserfall „geschützte Navigation…“; Validierung durch `striktesJsonUndUngueltigeFelderErzeugenKeineMutation`, beide Unittests und „Feldfehler…“; Listenabruf durch „Ladefehler…“; Speichern durch `commitFehlerBestaetigtNichtsUndEnthaeltKeineFinanzdaten`, „Offline…“ und „verlorene Commitbestätigung…“; Sitzungswechsel durch die drei Browserfälle für Abmeldung, Kontowechsel und Tokenablauf. Alle liefen erfolgreich.
- Pflichtprüfungen: Vertragscheck mit Build erfolgreich (`/tmp/savings-contract-final.log`); Backend 41 Unit- und 73 Integrationstests, keine Auslassungen (`/tmp/savings-full-backend.log`); Browser 105/105 einschließlich 12 neuer Fälle, Axe und Layout bei 100/200 % (`/tmp/savings-full-browser.log`).
- Laufzeitumgebung für lokale Checks: `JAVA_HOME=/tmp/tnbp-jdk25`, `MAVEN_USER_HOME=/tmp/tnbp-maven`, `MAVEN_OPTS=-Dmaven.repo.local=/tmp/tnbp-maven/repository`; Tests benötigen freigegebene lokale Sockets. Datenbank ausschließlich temporäre Testdaten.

- Reviewkorrekturen B1/B3/B4/B7/B8/B9/E1/V1/V2 umgesetzt: mobile Texttastatur, beständiger Ladebutton/Fokus und Live-Status, Seitentitel, Datumsgrenzen-Roundtrip, zusätzliche Besitzerrollenprüfung, passende Viewportpaare und abweichende Bestätigungswerte. Keine Änderung am freigegebenen Intent.
- Abschließende vollständige Verifikation nach allen Patches: Vertrag/SPA-Build erfolgreich (`/tmp/tnbp-2-1-final-contract.log`), 41 Unit- und 74 Integrationstests ohne Fehler/Auslassungen (`/tmp/tnbp-2-1-final-backend.log`), 106/106 Browserfälle einschließlich 13 Sparzielfällen (`/tmp/tnbp-2-1-final-browser.log`). Matrix erneut vollständig abgedeckt, `git diff --check` sauber.

## Spec Change Log

## Review Triage Log

| ID | Urteil | Evidenz und Route |
|---|---|---|
| B1 | medium | `goal-date` verlangt Bindestriche, fordert aber eine numerische Bildschirmtastatur an. Auf entsprechenden Mobilgeräten fehlen diese Zeichen. Patch: Texteingabetastatur; identisch mit E1. |
| B2 | false | Der behauptete Widerspruch zur Entwurfsgarantie besteht nicht: EXPERIENCE verlangt das Erhalten „im offenen Formular“ beziehungsweise „Formular im offenen Tab“. Offline-Ereignisse erhalten sämtliche Felder; Navigation schließt dieses Formular. Sitzungs-/Destroy-Cleanup ist beabsichtigt, eine Wiederaufnahme geschlossener Formulare ist nicht zugesagt. |
| B3 | medium | Der ausgelöste Aktualisieren-Button wird durch `loaded=false` aus dem DOM entfernt; der Fokus geht verloren. Patch: denselben Lade-/Wiederholungsbutton während des Abrufs erhalten. |
| B4 | medium | Ladeende hat keine persistente Live-Ankündigung; nur der Statusknoten verschwindet. Patch: Ergebnis/Leerzustand in beständiger Statusregion ankündigen. |
| B5 | low | Ein isoliert fehlerhaftes GET blockiert auch POST, bis das vorhandene „erneut laden“ erfolgreich ist. Seltene Teilverfügbarkeit, Wiederholung vorhanden; abgelehnt, da unabhängiges Anlegen neue Zustandszweige und Abstimmungsregeln benötigt. |
| B6 | low | Globale bestehende JSON-Limits können überlange Zielnamen ohne Feldzuordnung ablehnen. Namen mit mehr als 32768 Zeichen sind im Alltag unwahrscheinlich; abgelehnt, weil Angleichung neue Vertragsgrenzen und Validierungszweige erfordern würde. |
| B7 | medium | Dokumenttitel bleibt trotz neuem Sparzielbereich „Konto anlegen“. Patch: passende Titel für die beiden Hauptnavigation-Ziele. |
| B8 | low | Tests prüfen gültige Schaltjahre, aber keine erfolgreichen Roundtrips beider Grenzen des implementierten Datumsbereichs. Patch: 0001-01-01 und 9999-12-31 ergänzen. |
| B9 | low | Breiten 390/768 werden mit Höhe 800 geprüft; die UX-Prüfpunkte nennen 844/1024. Patch: explizite Paare verwenden. |
| B10 | false | Review findet noch statt. Schritt 3 setzt Sprintstatus in-progress; Schritt 4 setzt nur Spec in-review. Der behauptete abgeschlossene Review-Handoff ist noch nicht erfolgt; abschließende Synchronisierung folgt im Workflow. |
| E1 | medium | Gleicher verifizierter Tastaturfehler wie B1; gemeinsam als ein Patch behandeln. |
| V1 | medium | Vorverifizierte Regressionslücke: bestehender Starttest besitzt nur eine expense_budget-Probetabelle. Entfernen von savings_goals aus der Rollenprüfung bliebe unentdeckt. Patch: direkte Besitzer- und Mitgliedsrolle nur für savings_goals prüfen. |
| V2 | medium | Vorverifizierte Regressionslücke: ungültige POST-Antwort wird nur über progressCents=1 geprüft. Name/Betrag/Datum können abweichen, ohne dass Tests deren jeweilige Bestätigungsschranke schützen. Patch: strukturell gültige abweichende Antworten mit Fortschritt 0 ergänzen. |

## Verification

- `./scripts/check-contract.sh`: kompatibler Vertrag und beide Generatorausgaben kompilieren.
- `./backend/mvnw -f backend/pom.xml verify`: alle Tests einschließlich PostgreSQL erfolgreich.
- `npm --prefix frontend run e2e`: neue Prüfungen und bestehende Browser-Regressionen erfolgreich; Layout und Axe prüfen. Der Vertragscheck baut bereits die SPA.
