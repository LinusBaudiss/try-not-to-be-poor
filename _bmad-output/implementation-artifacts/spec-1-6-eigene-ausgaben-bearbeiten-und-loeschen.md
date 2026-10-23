---
title: 'Story 1.6: Eigene Ausgaben bearbeiten und löschen'
type: 'feature'
created: '2026-10-23'
status: 'done'
baseline_commit: '3a0752a216de489708e546e404a660ef4b39f637'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
---

<frozen-after-approval reason="Menschlich freizugebender Umfang">

## Intent

**Problem:** Ausgaben lassen sich bisher nicht korrigieren.
**Ansatz:** Eigene Einträge bearbeiten oder nach Bestätigung löschen; Historie und Restbudget zeigen bestätigte Ergebnisse.

## Boundaries & Constraints

**Immer:** Name und positiver Betrag bearbeitbar; ID, Eigentümer und Datum unverändert. Ganze EUR-Cent und Monatssummen bis 9007199254740991 ohne Rundung. Eigentümer aus geprüftem JWT; Abfragefilter, erzwungene RLS und lokales `app.user_id`. Finanzdaten/Entwürfe nur im Arbeitsspeicher, bei Sitzungsende/Kontowechsel löschen; späte Antworten verwerfen. Historie aller Monate; Rest nur aus laufendem Berlin-Monat.

**Außerhalb:** Datumsänderung, Wiederherstellung, Mehrfachlöschung, Versionskonfliktoberfläche, Produktionsbetrieb und echte Nutzerdaten.

## I/O & Edge-Case Matrix

| Angenommen | Wenn | Dann |
|---|---|---|
| Eigene Ausgabe ausgewählt | Name/Betrag speichern | Vorbelegte Bearbeitung; erst bestätigte Werte ersetzen den Eintrag; Datum bleibt gleich. |
| Leerer Name, null Euro, Überpräzision oder Überlauf | Speichern | Verständlicher zugeordneter Feldfehler; keine Mutation/Rundung. |
| Grenze der Monatssumme, auch bei Parallelzugriff | Betrag erhöhen | Ersatzsumme exakt prüfen; Überschreitung atomar ablehnen. |
| Aktueller oder früherer Eintrag | Änderung/Löschung bestätigt | Historie aktualisiert; Rest neu laden, frühere Monate verändern ihn nicht. |
| Löschdialog geöffnet | Abbrechen/Escape oder bestätigen | Eintrag/Folge benannt; Fokus eingeschlossen, zunächst Abbrechen; Abbruch unverändert, Entfernung nach Bestätigung. |
| Fremde oder fehlende ID | Bearbeiten/löschen | Identischer neutraler 404 ohne Existenzinformation; fremde Daten unverändert. |
| Offline, laufender Request oder Fehler | Mutation versuchen/beantworten | Offline/Doppelsenden blockieren; kein falscher Erfolg, Bearbeitungsentwurf erhalten; ungewisser Commit verständlich melden. |
| Sitzungsende/Kontowechsel | Antwort trifft später ein | Daten, Entwurf und Dialog entfernt; Antwort wirkungslos. |

</frozen-after-approval>

## Code Map

- `backend/src/main/java/de/linus/tnbp/expensebudget/Expense{Controller,Service,Repository,Errors}.java`: Transaktion, Validierung, Kontosperre und Fehler wiederverwenden; Summary berechnet aus Bestand.
- `frontend/src/app/month/expenses.ts`: `accepts`, `clear`, Antwortprüfung, `changed` erhalten; `shared/money.ts` wiederverwenden. `month.ts` aktualisiert bereits die Summary.
- `ExpenseIT`, `frontend/e2e/expenses.spec.ts`: PostgreSQL, gehaltene Antworten, Commitfehler, Layout. Story 1.5 abgeschlossen; gültiger Epic-Kontext, anfangs sauber auf `main`.

## Tasks & Acceptance

- [x] `api-contract/openapi.yaml`: PUT/DELETE `/expense-budget/expenses/{expenseId}`; bestehender Request, PUT 200, DELETE 204, neutrale 404 und bestehende Fehler; Bestandsenums erhalten, Schnittstellen generieren.
- [x] `backend/src/main/resources/db/migration/V5__expense_mutations.sql`: UPDATE nur für `name, amount_cents`, DELETE für Laufzeitrolle; Eigentümer/Datum/ID und RLS schützen.
- [x] Obige `Expense*.java` und `../access/AccessConfiguration.java`: Eigentümerfilter, neutrale Nichtexistenz, Bearer-Routen/401 und no-store. Unter derselben Kontosperre lesen, Ersatzsumme im ursprünglichen Monat prüfen und schreiben/löschen; Erfolg nach Commit.
- [x] `frontend/src/app/month/expenses.ts`, `frontend/src/styles.css`: Karten-/Tabellenaktionen, separates Bearbeitungsformular mit Abbrechen, Löschdialog, Fehler und bestätigte Aktualisierung; Erfassungsentwurf erhalten.
- [x] `backend/src/test/java/de/linus/tnbp/expensebudget/Expense{Test,IT}.java`: Matrix, Datum über Monatswechsel, RLS/Minimalrechte, JWT/Cookie-Ablehnung, striktes JSON, konkurrierende POST/PUT/DELETE und Commit-Rollback prüfen; bisheriges UPDATE/DELETE-Verbot gezielt ersetzen.
- [x] `frontend/e2e/expense-mutations.spec.ts`: Matrix samt Netzfehlern, ungültigen Antworten, Fokus, Restbudget, Kontowechsel/Tokenablauf und Antwortverzögerung prüfen.
- [x] Diese Spezifikation und `_bmad-output/implementation-artifacts/sprint-status.yaml`: Fortschritt/Nachweise dokumentieren; Schlüssel `1-6-eigene-ausgaben-bearbeiten-und-löschen`.

**Abnahme:** Angenommen 320 × 568 oder 1280 × 800 und 100-/200-%-Text, wenn Tastatur/Touch verwendet werden, dann bleiben Aktionen, Beträge und Dialog ohne horizontales Scrollen nutzbar; zugänglicher Status, axe erfolgreich.

## Implementation Notes

- PUT und DELETE verwenden Eigentümerfilter, lokalen RLS-Kontext und dieselbe transaktionale Kontosperre wie POST. PUT prüft die exakte Ersatzsumme im ursprünglichen Monat; Erfolg folgt erst nach Commit. Neues separates 404-Schema erhält die bisherigen geschlossenen Fehlerenums.
- V5 erlaubt ausschließlich UPDATE auf Name/Betrag und DELETE. RLS und Metadaten bleiben geschützt; keine Bestandsdatenmigration.
- Getrennte Erfassungs-/Bearbeitungsentwürfe, bestätigte Antwortprüfung und vorhandenes `changed` aktualisieren Historie/Restbudget. Dialog mit explizitem Tab-Umlauf, Abbrechen/Escape, Fokusanker während des Requests und getrennten Rücksprungpunkten; bei Löschung nächste Aktion oder Historienüberschrift.
- Kontowechsel/Tokenablauf entfernen auch Editor, Dialog und Referenzen. Fehlgeschlagene oder verlorene Mutationsantworten erhalten Entwürfe und melden mögliche bereits erfolgte Commits.
- Erster Paralleltest verwendete versehentlich eine Mengen-Gleichheitsprüfung für zulässige Statuscodes. Korrigiert auf zulässige Antworten bei unverändert exakter Prüfung der bestätigten Endsumme; erfolgreiche PUTs separat deterministisch geprüft. Erste Browserprüfung deckte fehlenden expliziten Fokusumlauf und irreführenden Erfassungsstatus auf; beide korrigiert und einschließlich gemischtem Editor-/Dialogabbruch geprüft.
- Reviewkorrekturen: PUT setzt auch nach einem Ladefehler bestätigte Historie voraus; weitere Bearbeitungsstarts ersetzen keinen offenen Entwurf. Abbrechen bereinigt Statusgestaltung. Ungültige Pfad-IDs verwenden dieselbe neutrale 404-Antwort. Nach Löschung bei weiterhin geöffnetem anderem Editor fokussiert die Seite eine aktivierte Zeilenaktion.
- Deterministischer Sperrhalter ändert den Zielbetrag vor Commit; wartender PUT muss mit diesem Betrag rechnen und Grenzüberschreitung ablehnen. Fremdhistorien werden vollständig verglichen, Status methodenspezifisch geprüft. Zusätzliche Browserfälle belegen Retry nach Ladefehler, Entwurfsschutz, Abbruchfeedback, tatsächliche 30-Sekunden-Timeouts mit späten Antworten sowie Touch und Zielgrößen.

## Spec Change Log

## Review Triage Log

Durchlauf 1: drei unabhängige Layer vollständig abgeschlossen. Jeden Befund vor Gruppierung geprüft.

| Befund | Urteil | Beleg und Route |
|---|---|---|
| Blind 1: ungültige Pfad-UUID wird 500 | medium | `MethodArgumentTypeMismatchException` ist kein `ErrorResponse` (lokales javap); generischer Handler wählt 500. Patch: bestehenden neutralen 404-Handler auch dafür verwenden und beide Methoden testen; keine neue öffentliche Antwort nötig. |
| Blind 2: bestätigtes PUT nach gescheiterter Historie bleibt unsichtbar | medium | `load` leert Bestand und setzt loaded=false; `update` prüft nur loading und mappt anschließend über die leere Liste. Patch: bestätigte Historie wie bei POST voraussetzen und Wiederholung testen. |
| Blind 3: erneutes Bearbeiten überschreibt offenen Entwurf | medium | `startEdit` ersetzt Entwurf ohne Prüfung; weitere Bearbeiten-Aktionen bleiben erreichbar. Patch: aktive Bearbeitung bis Abbruch/Bestätigung erhalten, weitere Starts sperren. |
| Blind 4: Abbruch bleibt als Fehler markiert | low | `cancelEdit` setzt nur Text/Editor zurück, nicht failed; gleiches gemeinsame Feedback im Dialog. Direkte Korrektur der Abbruchmeldungen und Regression. |
| Blind 5: Paralleltest erlaubt Status anderer Methoden | low | Gemeinsame erlaubte Codemenge unterscheidet POST/PUT nicht; DELETE wird bereits einzeln geprüft. Direkte Korrektur auf methodenspezifische Statusprüfungen. |
| Blind 6: Sperrtest beweist keine frische Betragslesung | medium | Halter ändert nur Uhr; fehlerhaftes Vorziehen von find würde unerkannt bleiben. Patch: deterministische Betragsänderung vor Freigabe und exakte Ablehnung/Endsumme prüfen. |
| Blind 7: fremde Inhalte statt nur Zeilenanzahl prüfen | low | Der betreffende API-Test prüft fremde Anzahl, nicht Inhalte; unabhängige RLS-Tests sichern bereits Filterung. Direkte Ergänzung eines vollständigen Vorher-/Nachhervergleichs. |
| Blind 8: tatsächlicher Mutationstimeout ungetestet | low | Browserfälle behandeln sofortige Fehler und gehaltenen Erfolg; kein Fall überschreitet 30 Sekunden. Direkte Ergänzung kontrollierter PUT-/DELETE-Zeitüberschreitungen samt Erholung/später Antwort. |
| Blind 9: Zielgrößen und Touchabnahme unvollständig | low | Größen nur bei Dialogbuttons, Interaktionen per click/keyboard. Direkte Ergänzung der Zeilen-/Editorzielgrößen und eines echten Touch-Kontexts. |
| Blind 10: Sprintstatus noch in-progress | low | Während Review tatsächlich noch in-progress; Implementierung ist geprüft. Direkte Synchronisierung auf review beim Abschluss gemäß Workflow. |
| Edge 1: PUT nach gescheitertem Nachladen verschwindet | medium | Derselbe erreichbare Zustandsfehler wie Blind 2; gemeinsamer Patch mit Ladefehler-/Erholungstest. |
| Verification 1: veralteter Betrag vor Kontosperre bleibt unentdeckt | medium | Vorverifizierte Testlücke: kein vorhandener Test ändert den Zielbetrag im Sperrhalter; sonst könnte alte Subtraktion eine Summe über MAX erlauben. Gemeinsamer Patch mit Blind 6. |
| Nachprüfung: Löschfokus trifft bei offenem anderem Editor deaktivierte Aktion | medium | Entwurfsschutz deaktiviert Bearbeiten, während ein anderer Eintrag weiter löschbar bleibt. Direkter Patch wählt sichtbare aktivierte Zeilenaktionen; eigener Browserfall erhält Entwurf und prüft den Fokus. |

Gruppierung: Blind 2/Edge 1 teilen den fehlenden Ladezustandscheck; Blind 6/Verification 1 dieselbe deterministische Nachweislücke. Alle übrigen Befunde bleiben eigenständig. Ausschließlich lokale direkte Korrekturen an nachgewiesenen Zuständen oder Tests, ohne neue API/Oberfläche oder offene Produktentscheidung: Route patch. Keine Änderung am freigegebenen Block, keine Rückstellung.

## Design Notes

Keine offenen Produktfragen. Rechtemigration ohne Bestandsdatenänderung; Löschung nur nach Bestätigung. Abbruch fokussiert Auslöser; nach Entfernung nächste Zeilenaktion, sonst Historienüberschrift. Nativen Dialog bevorzugen. Mutationen serialisieren, keine neue Versionsverwaltung.

## Verification

- `./scripts/check-contract.sh`: kompatibler Vertrag, beide generierten Schnittstellen und SPA kompilieren.
- `./backend/mvnw -f backend/pom.xml verify`: Unit-/PostgreSQL-Tests erfolgreich.
- `npm --prefix frontend run e2e`: neue Abnahmen und Regression erfolgreich.
- `git diff --check`: keine Whitespacefehler.

### Ausgeführte Nachweise

- Vertragsprüfung inklusive Rückwärtskompatibilität, generiertem Java-/TypeScript-Vertrag und Produktionsbuild erfolgreich: `/tmp/story16-root-contract.log`.
- Vollständiges Backend erfolgreich: 39 Unit- und 65 PostgreSQL-18.6-Integrationstests, keine Fehler oder übersprungenen Fälle: `/tmp/story16-root-backend.log`.
- Alle zwölf neuen Browserfälle einschließlich 320/1280 Pixeln, 100-/200-%-Text und axe erfolgreich: `/tmp/story16-root-browser-focused-fixed.log`.
- Sandbox blockierte Mockito-Selbstanbindung und lokale Testports; Tests wurden ohne Deaktivierung mit explizitem Byte-Buddy-Agent und erlaubten lokalen Testservern ausgeführt. Werkzeugkonfiguration: `JAVA_HOME=/tmp/tnbp-jdk25`, `MAVEN_USER_HOME=/tmp/tnbp-maven`, `MAVEN_OPTS=-Dmaven.repo.local=/tmp/tnbp-maven/repository`, für npm `npm_config_cache=/tmp/tnbp-npm`, Browser `PLAYWRIGHT_BROWSERS_PATH=/tmp/tnbp-playwright`. Maven zusätzlich: `-DargLine=-javaagent:/tmp/tnbp-maven/repository/net/bytebuddy/byte-buddy-agent/1.18.11/byte-buddy-agent-1.18.11.jar`.

### Matrixabgleich

Hauptagent hat den vollständigen Diff einschließlich neuer Dateien gelesen. Zeilen 1/4: Backend `bearbeitungUndLoeschungBewahrenMetadatenUndVerwendenDenUrspruenglichenMonat` und Browser Bearbeiten/Löschdialog/frühere Monate. Zeile 2: striktes JSON und Browser-Feldfehler. Zeile 3: Backend Ersatzsummen-, Parallel- und Sperrtests. Zeile 5: Dialogtest einschließlich Tab/Shift-Tab, Escape, ausstehender Bestätigung und Fokus nach letzter Löschung. Zeile 6: identische 404-Antworten und unveränderte fremde Daten. Zeile 7: Offline, Doppelsenden, Fehler/ungültige Antworten, verlorene Antworten und echter Commit-Rollback. Zeile 8: je PUT/DELETE Kontowechsel und tatsächlicher Tokenablauf. Alle zugeordneten Fälle und die gesamte Browserregression erfolgreich: 86 Browserfälle, keine Fehler oder übersprungenen Fälle, `/tmp/story16-root-browser-regression.log`.

### Abschluss nach Review-Korrekturen

- Drei unabhängige Layer abgeschlossen, jeden Befund einzeln bewertet; alle angenommenen Befunde behoben, nichts zurückgestellt. Freigegebener Block unverändert. Hauptagent hat die Korrekturen selbst gelesen und die gesamte Verifikation erneut ausgeführt.
- Endstand: **39 Unit-Tests, 67 echte PostgreSQL-Integrationstests und 93 Browserfälle erfolgreich**, keine Fehler oder übersprungenen Fälle. Darunter 19 Mutations-Browserfälle einschließlich aller Reviewkorrekturen und der nachträglichen Fokusregression. Sämtliche Matrixzeilen und responsive Abnahmen erneut mit den grünen Fällen abgeglichen.
- Vertragskompatibilität, beide generierten Schnittstellen und endgültiger Produktionsbuild erfolgreich. Finale Protokolle: `/tmp/story16-final-contract.log`, `/tmp/story16-final-backend.log`, `/tmp/story16-final-browser.log`, `/tmp/story16-final-production.log`. Vollständiger Diff einschließlich Korrekturen: `/tmp/story16-patched-diff.patch`; `git diff HEAD --check` erfolgreich.
- Spezifikation abgeschlossen; Sprintstatus `review` für menschliche Abnahme. Keine echten Nutzerdaten oder Produktionsänderungen; lokaler Abschlusscommit, kein Push.
