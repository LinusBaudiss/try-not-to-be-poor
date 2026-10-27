---
title: 'Story 3.3: Bestehende Ausgaben und Budgets verlustfrei weiterführen'
type: 'refactor'
created: '2026-10-27'
status: 'done'
route: 'dispatch'
story_key: '3-3-bestehende-ausgaben-und-budgets-verlustfrei-weiterführen'
review_loop_iteration: 0
baseline_commit: '3afa328e23a2766fd2f26ee9d1162737510b9b1d'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/epics.md'
---

<frozen-after-approval reason="Nutzerabsicht; Änderungen nur nach erneuter Abstimmung">

## Intent

**Problem:** Ausgaben/Budget teilen Datenbesitz; Budget und Sparziele umgehen die Kontosperre.

**Approach:** Eigene Module/Schemas `expenses` und `budget`, öffentliche Projektionen und äußere Finanzkoordination einführen. Story 3.3/AC-1–AC-10 gelten vollständig.

## Boundaries & Constraints

**Always:** Bestand, v1-Vertrag, Fehler und v2-Zugang erhalten. JWT-Konto, FORCE RLS, minimale Rechte; ein Konto/eine Verbindung je Transaktion. Acht Mutationspfade: READ COMMITTED, Seed-14-Sperre vor Fachlesen, danach ein Europe/Berlin-Zeitpunkt/Tag/Monat. Monatsansicht: read-only REPEATABLE READ. Erfolg nach äußerem Commit; sichere exakte Centwerte und Bestandssemantik erhalten.

**Never:** Geschwisterzugriffe, fremdes SQL, öffentliche Repositorytypen, innere Commits, geänderte Altmigrationen oder zweiter Datenbestand. Keine v2-Finanzrouten, UI, Automatikobjekte, negativen Fortschritte oder Produktionsfreigabe.

## I/O & Edge-Case Matrix

| Zustand | Erwartung |
| --- | --- |
| Frisch oder befüllt bis V8 | Neuer Migrationspfad erhält IDs, Eigentümer, Monate, Werte und Ziele. |
| Fehler nach Modulschreiben/bei Commit | Vollständiger Rollback; keine Erfolgsantwort. |
| Sperrwartezeit über Monatsgrenze | Neuer Kalenderkontext erst nach Sperrerwerb; andere Konten laufen weiter. |
| Fehlendes/Nullbudget, Überschreitung | Unterschiedliche Zustände; konsistente Summe/Differenz, echter negativer Rest. |
| Fehlender/fremder Kontext, Kontowechsel | Zugriff verweigert; keine Fremddatenexistenz, kein Kontext im Pool zurückgelassen. |
| Summenüberlauf | Mutation atomar ablehnen; Fortschrittsersetzung bleibt nichtnegativ. |

</frozen-after-approval>

## Code Map

Java-Pfade nachfolgend relativ zu `backend/src/main/java/de/linus/tnbp/`.

- `expensebudget/`: SQL/Validierung übernehmen; gemeinsames SQL in `MonthSummaryRepository` ersetzen.
- `savingsgoals/`: getrennte Ziel-/Fortschrittsupdates erhalten; Transaktionen herausziehen.
- `backend/src/test/java/de/linus/tnbp/`: `access/PostgresFixture`, Finanz-ITs, Sperrbarrieren und Commitfehler wiederverwenden; Schema-SQL anpassen.
- `deploy/init-db.sh`: nur Erstanlage; wiederholbarer Rechteabgleich fehlt.

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/main/resources/db/migration/V9__split_finance_schemas.sql` – Tabellen per SET SCHEMA verschieben; Constraints, RLS und minimale Rechte erhalten.
- [x] `shared/{FinanceTransactions,FinanceContext,Money}.java` – technische Transaktions-/Kontextgrenze, Kontosperre und exakte Geldprüfung; fremden/fehlenden Kontext abweisen.
- [x] `expenses/Expenses.java`, `budget/Budgets.java`, `savingsgoals/SavingsGoals.java` samt Repositories – öffentliche Befehle/Projektionen mit vorgegebenem Kalenderkontext.
- [x] `finance/FinanceApplication.java`, `finance/http/` – äußere Anwendungsfälle; v1-Controller/Fehlerzuordnung verlagern, alte Services/gemeinsames SQL ersetzen.
- [x] `access/DatabaseRoleVerifier.java`, `deploy/provision-finance-grants.sql`, `deploy/compose.local.yaml`, `scripts/start-local/start-database.sh` – Schemaprüfung und wiederholbare Minimalrechte für vorhandene Objekte auch auf initialisierten Volumes; keine Passwortrotation/CREATEROLE für Migrator.
- [x] `backend/src/test/java/de/linus/tnbp/finance/{ArchitectureTest,FinanceMigrationIT,FinanceCoordinationIT}.java` und bestehende Finanztests – Modulgrenzen, Matrixfälle, frische/befüllte Migration mit zwei Konten/mehreren Monaten, RLS/Pool, gemeinsame Verbindung/Rollback, alle acht Sperrpfade, Kalender/DST und Snapshotüberschneidung prüfen.
- [x] `README.md` – Umstellungsweg und geprüften v1-kompatiblen Rücknahmestand mit Artefaktidentität/kanonischer Git-Revision dokumentieren.

**Acceptance Criteria:**
- Angenommen V8-Bestand, wenn Migration und Wiederanlauf erfolgen, dann bleiben alle Daten und bisherigen Finanzabläufe erhalten (AC-1/7–10).
- Angenommen konkurrierende Finanzzugriffe, wenn äußere Anwendungsfälle laufen, dann gelten Modulbesitz, gemeinsame Transaktion/Kontosperre, ein Kalenderkontext und konsistente Monatswerte (AC-2–6/10).

## Implementation Notes

- V9 verschiebt die vorhandenen Tabellen ohne Kopie; Tabellen-OIDs, Zeilen, Constraints, RLS und bisherige Spaltenrechte bleiben erhalten. Das danach leere Schema `expense_budget` entfällt; Sparziele bleiben in `savings_goals`.
- `FinanceApplication` koordiniert ausschließlich öffentliche Projektionen/Befehle. Interne Repositories sind paketprivat; alte Services und das gemeinsame Monats-SQL sind entfernt. Bestehende v1-Adapter und ihre Fehler-/Kalenderdatum-Abbildung liegen unter `finance/http`.
- `FinanceTransactions` verbietet verschachtelte äußere Transaktionen, bindet ein transaktionslokales Konto und sperrt jede Mutation mit kanonischer UUID/Seed 14 unter READ COMMITTED. Genau ein Zeitpunkt entsteht danach; der unveränderliche Kontext prüft beim Modulzugriff und vor Abschluss dieselbe Verbindung, Rolle und Konto-ID. Leseanwendungsfälle teilen read-only REPEATABLE READ.
- Der administrative Rechteabgleich unterstützt V8 und V9, entfernt zusätzliche Tabellen-/Spalten-/Schemarechte, rotiert keine Kennwörter und läuft beim lokalen DB-Start auch auf vorhandenen Volumes. Der Startcheck prüft neue Schemas, Besitzer-/Rollengrenzen und FORCE RLS.
- README enthält Umstellung, v1-kompatiblen JAR-Wiederanlauf und den geprüften Artefakt-Fingerprint. Die kanonische Gitrevision des abschließenden lokalen Release-Snapshots bleibt für den nachfolgenden Abschluss offen; deshalb ist die README-Aufgabe noch nicht als erledigt markiert.
- Nachtrag nach unabhängiger Diff-/Nachweisprüfung: Rücknahmequellstand als lokaler Git-Snapshot `a4554cde8d08453d202839e4c357593a0752b354` unter `refs/bmad/story-3.3-release` gesichert. README-Aufgabe damit abgeschlossen; aktueller Branch und Arbeitsbaum unverändert, kein Push.
- Reviewkorrekturen: Öffentliche Monatsprojektion normalisiert auf den Kalendermonat; PostgreSQL-Grenzfall belegt Monats- und Kontentrennung. Architekturprüfung erfasst quotierte/Java-escapte Schemas und weitere äußere Klassen mit verletzenden Gegenbeispielen. Startup-Negativfälle prüfen RLS/FORCE/Schema-CREATE. Das paketierte JAR vergleicht vollständige Bestandsantworten und bestätigt Budget-, historische Ausgaben- und Fortschrittsänderungen durch Antwort, erneuten GET und DB-Abgleich. Gezielter Lauf: vier Architektur- und vier Integrationstests erfolgreich; abschließender Gesamtlauf folgt.
- Abschließender Gesamtlauf erfolgreich (44 Unit-/Architektur- und 145 Integrationstests, zwölf Python- und 162 Browserfälle). Rücknahmequellstand nach Reviewkorrekturen: `b4679692fd63f479cd0ab0cdca99942a512d521d`, lokal unter `refs/bmad/story-3.3-release`; ersetzt den ersten Snapshot als dokumentierte Rücknahmebasis. Produktionscode, Tests und Provisionierungsdateien stimmen mit diesem Snapshot überein.

## Spec Change Log

## Review Triage Log

| Befund | Urteil und Evidenz | Behandlung |
| --- | --- | --- |
| Blind 1: Startprüfung prüft keine effektiven Tabellen-/Spaltenrechte | medium: Die neue Prüfung kontrolliert RLS/Schema-USAGE, keine vollständige ACL. Bereits der Basisstand prüfte effektive Feldrechte nicht; die neuen Minimalrechte werden für den vorgesehenen Rollenstand per Migration/Provisionierung gesetzt und getestet. Administrativ nachträglich erweiterte Rechte bleiben ein vorher bestehender Härtungsbedarf. | defer |
| Blind 2: Wechsel in zusätzliche privilegierte Rollen | medium: Besitzer-/Migratormitgliedschaften werden geprüft, andere administrativ hinzugefügte Rollen mit privilegierten Attributen nicht. Derselbe Pfad bestand vor dieser Story; die vorgesehenen Rollen haben keine solche Mitgliedschaft. PostgreSQL-SET-/INHERIT-Semantik anhand der Primärdokumentation geprüft. | defer |
| Blind 3: Permissive Zusatzpolicy passiert Startprüfung | medium: ENABLE/FORCE RLS beweist nicht den Inhalt einer administrativ hinzugefügten Policy. V9 erhält die bestehenden korrekten Policies; bereits der Basisstand prüfte keine Policysemantik beim Start. | defer |
| Blind 4: Geerbte Rechte bleiben nach Provisionierung erhalten | medium: REVOKE betrifft direkte ACLs von PUBLIC/runtime; zusätzliche Gruppenrechte wären weiterhin effektiv. Die Story führt keine Gruppenmitgliedschaft ein und verschärft den vorhandenen Rollenstand; die geerbten Rechte selbst wären bereits vorher wirksam. | defer |
| Blind 5: Monatsprojektion akzeptiert Tag mitten im Monat | low: Der neue öffentliche Zugang summiert bei LocalDate 15.10. derzeit bis 15.11.; bisherige HTTP-Aufrufer übergeben zwar den Monatsersten, die neue Modulprojektion sollte den angegebenen Kalendermonat eindeutig auslegen. | patch: auf Monatsersten normalisieren und prüfen |
| Blind 6: Paketierter Wiederanlauf prüft zu wenige Antwortwerte | low: Zeilen/OIDs werden bereits vollständig verglichen und bestehende HTTP-Tests prüfen Felder/Isolation. Der paketierte Wiederanlauf selbst prüft nur Status/Listenlängen; ein direkter Vergleich seiner Finanzwerte stärkt den konkreten Artefaktnachweis. | patch |
| Blind 7: Rücknahme-JAR führt keine Mutationen aus | low: Alle Mutationen bestehen bereits mit derselben kompilierten Anwendung; im gesonderten JAR-Prozess fehlen konkrete Schreibproben. Drei v1-Schreibproben sind eine direkte Ergänzung dieses Tests. | patch; gemeinsamer Nachweis mit Blind 6 |
| Blind 8: Kein echtes Login/Refresh im Migrationsfixture | low: Der Pakettest verwendet synthetische Konten/Bearer. SessionIT.externerSchluesselUndRefreshUeberlebenApiNeustart prüft echte Anmeldung, bestehendes JWT und Refresh nach Neustart bereits am migrierten Stand; V9 verändert keine Zugangstabelle. Ein weiterer V8-Authentifizierungsfixture bringt hier nur geringe zusätzliche Evidenz und benötigt eigene Zustands-/Cookieabläufe. | reject: geringe Zusatzwirkung, mehr als direkte Korrektur |
| Blind 9: Architekturprüfung übersieht quotiertes SQL | medium: Die neue Datenbesitzprüfung erkennt nur unquotierte Schemas; übliche SQL-Quotierung könnte spätere Modulverletzungen verdecken. | patch: quotierte/Java-escapte Schemas mit Gegenbeispielen prüfen |
| Blind 10: Architekturprüfung erfasst nur eine Koordinationsklasse | medium: Eine künftige äußere Hilfsklasse könnte direkten JDBC-/Repositoryzugriff erhalten, ohne den bestehenden Einzeldateicheck auszulösen. | patch: sämtliche äußeren Anwendungsklassen prüfen |
| Verification Gap 1: Neue Startschutzablehnungen nicht ausgeführt | medium: Vorhandene Rollenfälle testen Besitzer-/Privilegienablehnung; der Migrationstest repariert überschüssige Rechte vor dem Start. Negative Startfälle für deaktivierte RLS, fehlendes FORCE und Schema-CREATE fehlen. | patch: PostgreSQL-Startablehnungen mit Wiederherstellung ergänzen |

Edge Case Hunter: keine Befunde. Alle drei Ebenen abgeschlossen; Blind Hunter nach vorübergehendem Kapazitätsfehler fortgesetzt. Keine offene Absichtslücke und kein erforderlicher Spec-Loopback.

## Design Notes

Keine offenen Produktentscheidungen. Migration/Rechteänderung und mehrere Module erfordern den vollständigen Ablauf. Rücknahmebasis: geprüfter Story-3.3-Stand; Vorgänger mit `expense_budget`-SQL ungeeignet. Historische Done-Nachweise erhalten.

## Verification

- `./backend/mvnw -f backend/pom.xml verify` – Architektur und echte PostgreSQL-18.6-Nachweise einschließlich v1-Finanz-/v2-Zugangsregression.
- `./scripts/check-contract.sh` – beide unveränderten Verträge kompatibel; Java-/Angular-Clients und SPA kompilieren.
- `python3 -m unittest discover -s scripts/tests -v` – Skriptregressionen erfolgreich.
- `npm --prefix frontend run e2e` – bestehende HTTPS-Zugangs-/Finanzansichten erfolgreich.

### Ausgeführt am 2026-10-27

- `./backend/mvnw -f backend/pom.xml verify` – abschließend **42 Unit-/Architekturprüfungen und 142 Integrationstests**, keine Fehler/übersprungenen Fälle. Die zuletzt korrigierte und verschärfte `ArchitectureTest` wurde in diesem Abschlusslauf erneut erfolgreich ausgeführt. Ein vorheriger `clean verify` war ebenfalls erfolgreich.
- `FinanceMigrationIT` – leerer und befüllter V8-Stand, zwei Konten, jeweils drei Budget-/Ausgabenmonate, Null-/Überziel-Fortschritt und Kalenderdaten. Vollständiger Zeilen-/OID-Vergleich, unveränderte Rollenkennwörter, wiederholter Entzug absichtlich erweiterter Rechte und echter Start des paketierten JAR gegen beide migrierten Stände erfolgreich; vier v1-Finanzansichten je Bestandskonto liefern 200/no-store.
- `FinanceCoordinationIT` – alle acht Mutationspfade und ein leeres Konto warten nachweislich auf dieselbe Kontosperre; anderes Konto läuft weiter. Uhrabfrage erst nach Sperre, Monatswechsel, gemeinsame physische Verbindung/Transaktion anhand von DB-Triggerproben, Rollback nach Modulzugriff/bei Commit, Kontextwechsel/Read-only/Pool sowie Commit zwischen getrennten Monatsprojektionen erfolgreich. `MoneyTest` ergänzt exakte Geldgrenzen und Sommer-/Winterzeit.
- Bestehende v1-Finanz- und v2-Zugangsprüfungen bleiben auf migriertem Stand grün. Beide OpenAPI-Dateien und V1–V8-Migrationen sind unverändert.
- `./scripts/check-contract.sh` – beide Verträge valide und gegen `3afa328e23a2766fd2f26ee9d1162737510b9b1d` kompatibel; generierte Java-/Angular-Schnittstellen und SPA erfolgreich kompiliert.
- `python3 -m unittest discover -s scripts/tests -v` – **12/12 erfolgreich**, einschließlich drei neuer DB-Start-/Provisionierungsregressionen. `bash -n scripts/start-local/start-database.sh` und `git diff --check` erfolgreich.
- `npm --prefix frontend run e2e` – **162/162 erfolgreich** über HTTPS mit temporärer PostgreSQL/API und Chromium.
- Geprüftes JAR: SHA-256 `a3c1c90f15a8fd06b1f23de5f86b4af0668c1fcb0b902ddce5601973416ddd82`; unveränderte lokale Kopie unter `.local/releases/story-3.3/tnbp-a3c1c90f15a8fd06b1f23de5f86b4af0668c1fcb0b902ddce5601973416ddd82.jar`. Quellstand: `a4554cde8d08453d202839e4c357593a0752b354`, lokal unter `refs/bmad/story-3.3-release` gesichert.
- Unabhängiger Matrixaudit anhand der ausgeführten XML-Berichte: Migration → beide `FinanceMigrationIT`-Parameterfälle; Modul-/Commitfehler → beide Rollbackfälle in `FinanceCoordinationIT`; Monatsgrenzwartezeit → alle acht Mutationsparameter plus Zweitkontofortschritt; fehlendes/Nullbudget/Überschreitung → beide Matrix-/Centgrenzenfälle in `MonthSummaryIT`; Kontext/Kontowechsel/Pool → Kontext- und Poolfälle in `FinanceCoordinationIT` sowie RLS-Fälle der Finanz-ITs; Summenüberlauf/nichtnegativer Fortschritt → `summenueberlaufRolltAuchVorangegangeneModulschreibzugriffeZurueckUndFortschrittBleibtNichtnegativ`. Alle ausgeführt, erfolgreich und nicht übersprungen.

### Abschluss nach Reviewkorrekturen

- Alle angenommenen Patches umgesetzt und deren Diff unabhängig gelesen. Erneute vollständige Prüfung: **44 Unit-/Architekturprüfungen, 145 Integrationstests, zwölf Pythonprüfungen und 162 HTTPS-Browserfälle**, keine Fehler oder übersprungenen Fälle. Beide Verträge weiterhin unverändert/kompatibel, alle generierten Schnittstellen und die SPA erfolgreich gebaut.
- Die neuen Startup-Ablehnungen laufen auch über die vorhandene v2-Zugangsregression. Paketierter Wiederanlauf prüft jetzt vollständige Bestandsantworten und bestätigte Budget-, historische Ausgaben- und Fortschrittsänderungen; alle Matrixfälle erneut erfolgreich ausgeführt.
- Abschlusslogs: `/tmp/tnbp-story33-final-contract.log`, `/tmp/tnbp-story33-final-python.log`, `/tmp/tnbp-story33-final-e2e.log`, `/tmp/tnbp-story33-final-verify.log`.
- Abschließend geprüftes JAR: SHA-256 `629bcfacb7079922000e3a776a00fa510104b8fb819ec4891420ae085b480a46`; unveränderte lokale Kopie unter `.local/releases/story-3.3/tnbp-629bcfacb7079922000e3a776a00fa510104b8fb819ec4891420ae085b480a46.jar`.
- Zugehöriger kanonischer Quell-Snapshot: `b4679692fd63f479cd0ab0cdca99942a512d521d`. Der erste Snapshot und dessen Prüfzahlen sind oben als zeitlicher Verlauf erhalten; maßgeblich sind dieser Abschlussstand und die Abschlusslogs.
