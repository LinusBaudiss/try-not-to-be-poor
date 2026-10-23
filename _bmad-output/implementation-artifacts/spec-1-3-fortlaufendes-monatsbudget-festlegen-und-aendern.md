---
title: 'Story 1.3: Fortlaufendes Monatsbudget festlegen und ändern'
type: 'feature'
created: '2026-10-23'
status: 'done'
route: 'dispatch'
baseline_commit: 'c519f437f749ed7b2313af2aa1b4a0d116a555d2'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="Menschlich freizugebender Umfang">

## Intent

Das persönliche Monatsbudget fehlt. In „Monat“ den fortlaufenden Betrag festlegen, ansehen und ändern; ein fehlendes Budget von einem gesetzten Nullbudget unterscheiden.

## Boundaries & Constraints

Bestehenden Stack/Vertrag erhalten. Budget ausschließlich dem verifizierten JWT-`sub` zuordnen; SQL-Filter plus FORCE RLS mit transaktionslokalem `app.user_id`, fehlender Kontext verweigert Zugriff. Laufzeitrolle ohne Tabellenbesitz/BYPASSRLS. Bestätigung nach Commit; Finanzantworten `no-store`, keine Finanzwerte in Logs.

EUR-Cent ganzzahlig in `0…9007199254740991`; exakt konvertieren, niemals runden. Euroeingabe ungruppiert mit Komma oder Punkt und höchstens zwei Dezimalstellen; Ausgabe deutsch und auch am Maximum exakt. Keine Browserpersistenz; Sitzungsschluss/Kontowechsel verwirft Werte und Entwürfe einschließlich später Antworten.

Änderungen gelten sofort im laufenden Berlin-Kalendermonat und danach; vergangene Monate behalten ihren Wert. Ausgaben, Restbudget, Budgetlöschung, Produktionsbetrieb und echte Nutzerdaten gehören nicht zu dieser Story.

## I/O & Edge-Case Matrix

| Angenommen | Wenn | Dann |
|---|---|---|
| Kein Budget | Monatsansicht laden | Zur Festlegung auffordern; keinen Nullwert vortäuschen. |
| Eigene Sitzung | Gültigen Betrag speichern | Eigenen Betrag nach Commit anzeigen; `0` und Maximum zulassen. |
| Ungültiger Betrag | Formular oder API prüfen | Negativ, Überlauf und Bruchteile von Cent ablehnen; Feldfehler, unveränderter Bestand. |
| Fremdes Konto oder manipulierte Eigentümerangabe | Lesen/schreiben | Ausschließlich eigene Identität verwenden; keine fremden Werte/Existenz offenlegen. |
| Monatswechsel | Budget lesen oder ändern | Fortführung; Änderung ab aktuellem Berlin-Monat, frühere Werte erhalten. |
| Laufende/gescheiterte Anfrage oder offline | Speichern | Doppelsenden sperren; Erfolg erst nach Bestätigung, Entwurf für Wiederholung erhalten; offline Speichern blockieren. |
| Sitzungsende/Kontowechsel | Antwort trifft verspätet ein | Persönliche Ansicht schließen; keine alten Werte/Entwürfe übernehmen. |

</frozen-after-approval>

## Code Map

- `backend/src/main/java/de/linus/tnbp/access/`: `SessionController` liefert UUID-Identität, `SessionService` das Transaktionsmuster. `AccessConfiguration` sperrt Finanzrouten noch; `DatabaseRoleVerifier` prüft bisher nur `access`. Globale `RegistrationErrors` benötigt Budget-spezifische Übersteuerung.
- `frontend/src/app/login/login.ts`: `Month` enthält Identitätsprüfung; Session-E2E verwenden `verifyIdentity()`/`http`. `session/session.interceptor.ts` liefert Bearer/Generationsschutz; `session/session.ts` Guard und Abmeldung.
- `backend/src/test/java/de/linus/tnbp/access/PostgresFixture.java`: echte PostgreSQL-18.6-Instanz, bisher paketprivat. Story 1.2 ist integriert und ihre Spezifikation `done`.

## Tasks & Acceptance

- [x] `api-contract/openapi.yaml`: GET/PUT `/expense-budget/budget`, Bearer, nullable `amountCents` beim Lesen, verpflichtender Integer beim Schreiben, Fehlervertrag ergänzen; Schnittstellen generieren.
- [x] `backend/src/main/resources/db/migration/V3__budgets.sql`: Schema `expense_budget`, Betrag/Constraints, Nutzerbezug, FORCE-RLS und minimale Rechte anlegen. Gültigkeitsbeginn pro Nutzer/Berlin-Monat; im selben Monat upserten, zuletzt gültigen Eintrag lesen.
- [x] `backend/src/main/java/de/linus/tnbp/expensebudget/{BudgetController,BudgetService,BudgetRepository,BudgetErrors}.java`: Vertrag, Transaktionen, RLS-Kontext und neutrale Fehler umsetzen.
- [x] `backend/src/main/java/de/linus/tnbp/access/{AccessConfiguration,DatabaseRoleVerifier}.java`: Budgetrouten authentifizieren, ausschließlich Bearer-Budgetzugriffe passend von Cookie-CSRF ausnehmen; strikte Integer-JSON-Prüfung und Besitzprüfung erweitern.
- [x] `frontend/src/app/{month/month,shared/money}.ts`, `frontend/src/app/{login/login,app.routes}.ts`, `frontend/src/styles.css`: Monatskomponente auslagern, exakte Geldfunktionen, Budgetformular und Lade-/Fehler-/Speicherzustände einbauen; Sitzungsprüfung erhalten.
- [x] `backend/src/test/java/de/linus/tnbp/expensebudget/{BudgetTest,BudgetIT}.java`, `backend/src/test/java/de/linus/tnbp/access/PostgresFixture.java`: Betrags-/Monatsgrenzen als Unitfälle prüfen; Fixture wiederverwenden für Matrix, JSON-Typfehler, Commitfehler, zwei Konten, ungültige/fehlende JWTs und direkte RLS-/Rechteprüfung. Fehlenden/falschen Kontext und Kontextfreiheit nach Transaktionsende prüfen.
- [x] `frontend/e2e/{budget,session}.spec.ts`: Matrix, exakte Geldgrenzen, Reload, gehaltene/verlorene Antworten, Retry/Offline und Zustandsverwerfung prüfen; Platzhaltererwartung aktualisieren.
- [x] `README.md`, `_bmad-output/implementation-artifacts/sprint-status.yaml`: Budgetnutzung und verifizierten Stand dokumentieren.

Angenommen 320 × 568, Tastatur oder 200-%-Text, wenn das Formular bedient wird, dann bleiben Label, Euro-Hinweis, Fehlerzuordnung/-fokus und Status zugänglich, ohne horizontales Scrollen; Geldfeld ≥48 px, Aktionen ≥44 px. Angenommen weitere Breiten 390/768/1280 px, wenn Budgetwerte angezeigt werden, dann bleiben auch Maximalbeträge vollständig lesbar. Axe prüft Formular-/Fehler-/Erfolgszustände.

## Implementation Notes

- GET/PUT verwenden den erweiterten OpenAPI-Vertrag und generierte Schnittstellen. `amountCents: null` bezeichnet ein fehlendes Budget; gültige Schreibwerte reichen einschließlich von 0 bis 9007199254740991.
- Migration V3 legt Monatsversionen mit Nutzer-/Monatsschlüssel an. Änderungen upserten den aktuellen Berlin-Monat; Lesen wählt die letzte bis dahin gültige Version. SQL-Nutzerfilter, transaktionslokaler RLS-Kontext, FORCE RLS und minimale Spaltenrechte schützen die Kontogrenze.
- Der Controller bestätigt erst nach Rückkehr des committenden TransactionTemplate. Budgetfehler bleiben neutral, sämtliche Finanzantworten sind `no-store`; finanzielle Werte/SQL-Fehlerdetails werden nicht protokolliert.
- Die ausgelagerte Monatskomponente behält die Identitätsprüfung bei. Einfache Euroeingaben werden mit BigInt exakt in sichere Centwerte umgerechnet und aus ganzen Cent deutsch formatiert. Formular-, Lade-, Fehler-, Offline- und Speicherzustände sowie Retry sind umgesetzt.
- Werte und Entwürfe bleiben ausschließlich im Arbeitsspeicher und werden beim Sitzungswechsel/Komponentenende verworfen. Aktive Generation und Eigentümerprüfung ergänzen den bestehenden Interceptor-Schutz vor verspäteten Antworten.
- Es wurden ausschließlich synthetische Daten in temporärem PostgreSQL verwendet. Der bestätigte Umfang blieb unverändert.

- Reviewkorrekturen: Entwurfsänderungen entfernen überholte Rückmeldungen; die Wiederholung der Zugangsprüfung ist während Identitätsprüfung und Budgetladen gesperrt. Live-Status für Identitätsfehler wiederhergestellt; stille Eingabekürzung entfernt.
- Direkte RLS-UPDATE-Prüfungen und echte Startabbrüche bei Budget-Tabellenbesitz/Besitzerrollenmitgliedschaft ergänzt. Commitfehler erhalten eine sichere DATENBANK-Kategorie ohne Finanz- oder SQL-Details.

## Spec Change Log

## Review Triage Log

Durchlauf 1: alle drei unabhängigen Layer abgeschlossen. Jeder Befund wurde vor der Gruppierung einzeln eingeordnet.

| Fund | Urteil | Beleg und Route |
|---|---|---|
| B1: Veraltete Erfolgs-/Feldmeldung beim Bearbeiten | medium | ngModel verändert nur `draft`; `saved`, `fieldError` und Status bleiben bis zum nächsten Submit stehen. Patch: beim Bearbeiten die überholte Rückmeldung zurücksetzen; Browserregression. |
| B2: Parallele Zugangs-Wiederholung | medium | Der Retrybutton bleibt während `open()` bedienbar; zwei Aufrufe laufen ohne Sperre in `verifyIdentity()` und anschließend `loadBudget()`. Eine spätere Antwort kann die Ansicht schließen oder einen Entwurf überschreiben. Patch: den bestehenden Öffnungsvorgang serialisieren und den Retrybutton währenddessen sperren; Regression mit gehaltener Antwort. |
| B3: Verlorene Live-Ankündigung | medium | Die ausgelagerte Identitätsmeldung besitzt kein `role=status`; bei `/me`-Fehler ist die Budget-Liveregion noch nicht vorhanden. Patch: Statussemantik wiederherstellen und Fehlerfall prüfen. |
| B4: Abweichende Identität in erfolgreicher Antwort | false | `SessionController.sessionIdentity` gibt ausschließlich den vom JWT geprüften `sub` zurück. Der Interceptor verwirft Antworten nach Generationswechsel, `accepts()` prüft zusätzlich dieselbe Generation und Eigentümer-ID. Ein 200 mit fehlender/fremder ID ist über den vorhandenen Server nicht erreichbar; der hypothetische Vertragsbruch ist kein nachgewiesener Fehlerablauf. |
| B5: Geldfeld schneidet führende Nullen ab | medium | `maxlength=32` begrenzt Texte vor der fachlichen Prüfung; 32 Nullen plus 1 wird als Null übergeben. Der Parser erlaubt führende Nullen. Patch: die stille Feldbegrenzung entfernen und den vollständigen Wert prüfen; Einfüge-Regression. |
| B6: Unendliche PostgreSQL-Daten | low | SQL-CHECK lässt ein NULL-Ergebnis durch; `EXTRACT(DAY FROM infinity)` liefert NULL. Budgetdaten entstehen jedoch aus `LocalDate.now(Clock.systemUTC())` mit festem Berlin-Kalender, nicht aus Client-Daten. Im normalen Betrieb ist der Fall nicht erreichbar; zusätzliche Datumswächter wären mehr als eine direkte Korrektur. Nach der Low-Regel verworfen. |
| B7: Direkter RLS-UPDATE ungeprüft | medium | Die Tests prüfen fremdes INSERT und Lesen, aber UPDATE nur auf ohnehin gesperrte Eigentümer-/Monatsspalten. Patch: UPDATE von `amount_cents` ohne/fremden Kontext und unveränderten Bestand sowie erlaubten Eigenzugriff belegen. |
| B8: Gleichzeitige absolute Budgetänderungen | false | PUT setzt einen absoluten Betrag ohne Berechnung aus einer gelesenen Vorversion; jedes Commit bestätigt seinen tatsächlich gesetzten Wert. Ein späteres erfolgreiches Setzen ersetzt ihn bestimmungsgemäß. Kein verlorenes Read-modify-write und kein geforderter Versions-/Konfliktdialog; keine zusätzliche Produktoberfläche. |
| B9: Antwort über Monatswechsel | false | Ohne weitere Mutation gilt derselbe Betrag fortlaufend im nächsten Monat; es gibt keine vorab angelegten künftigen Versionen. Für einen abweichenden Folgemonatswert ist eine weitere Budgetänderung erforderlich. Deren spätere Speicherung ist eine unabhängige Änderung, kein durch den Monatswechsel ungültig gewordener Betrag. Live-Synchronisierung fremder Tabs/Geräte ist nicht vereinbart. |
| B10: Fehlerkategorie immer ANWENDUNG | low | BudgetErrors nimmt die Ausnahme nicht entgegen; ein Commitfehler verliert dadurch die vorhandene sichere Unterscheidungsmöglichkeit zu Datenbankfehlern. Patch: Datenbank-/Transaktionsfehler wie im bestehenden Registrierungshandler kategorisieren, keine Details protokollieren; Nachweis am Commitfehler. |
| E1: Verlorene Live-Ankündigung | medium | Gleicher entfernte `role=status` wie B3, unabhängig am Fehlerpfad bestätigt. Gemeinsamer Patch mit B3. |
| V1: Budget-Tabellenbesitz beim Start ungeprüft | medium | Vorverifiziert: Der vorhandene Starttest prüft Superuser und Besitzer von `access`; die Erweiterung auf `expense_budget` könnte unbemerkt entfallen. Patch: ansonsten unprivilegierte Rolle mit ausschließlich Budget-Tabellenbesitz beim echten Start abweisen und Fixture wiederherstellen. |


Abschluss: Alle sieben bestätigten Korrekturgruppen sind behoben und mit Regressionen belegt. B3/E1 wurden gemeinsam korrigiert; jeder Befund bleibt oben einzeln dokumentiert. Kein Befund wurde zurückgestellt. Der freigegebene Block blieb unverändert.

## Verification

Am 23.10.2026 als Implementierungsnachweis erfolgreich ausgeführt:

- `./scripts/check-contract.sh`: gültiger OpenAPI-Vertrag, oasdiff ohne inkompatible Änderungen, generierte Spring-Interfaces und Angular-Produktionsbuild erfolgreich. Protokoll: `/tmp/tnbp-budget-contract.log`.
- `./backend/mvnw -f backend/pom.xml verify`: **73 Tests erfolgreich**, davon 2 BudgetTest und 9 BudgetIT; bestehende Zugangsregressionen eingeschlossen. Protokoll: `/tmp/tnbp-budget-backend.log`.
- `npm --prefix frontend run e2e`: **47 Browserfälle erfolgreich**, davon 12 Budgetfälle; vorhandene Registrierungs-/Sitzungsregressionen eingeschlossen. Protokoll des vollständigen wiederholten Laufs: `/tmp/tnbp-budget-browser-final.log`.
- `git diff --check`: erfolgreich.

Umgebung: JDK 25 unter `/tmp/tnbp-jdk25`, Maven-Wrapper und Repository unter `/tmp/tnbp-maven`, npm-Cache unter `/tmp/tnbp-npm`, Chromium unter `/tmp/tnbp-playwright`. Backend-/Browserläufe benötigten lokale Sockets außerhalb der eingeschränkten Sandbox; die Vertragsprüfung verwendete zuletzt den vollständigen lokalen npm-Cache ohne Netzwerkdownloads.

| Matrix / Abnahme | Ausgeführter Nachweis |
|---|---|
| Fehlendes Budget, Nullbudget, Maximum, Speichern und Ändern | BudgetIT.fehlendesBudgetNullbudgetMaximumUndAendernSindUnterscheidbar; Browser „fehlendes Budget, Null, Komma/Punkt und sichere Centgrenzen …“ |
| Negative Werte, Überlauf, Bruchteile und JSON-Typen | BudgetTest.betraegeSindGanzeNichtnegativeSichereCentwerte; BudgetIT.jsonTypenFehlendeWerteNegativUndUeberlaufWerdenOhneRundungAbgelehnt; Browser „ungültige Euroeingaben …“, „API-Feldfehler …“ |
| Eigene Identität, zwei Konten, manipulierte Eigentümerangaben | BudgetIT.zweiKontenUndManipulierteEigentuemerangabenGebenKeineFremdenWertePreis; fehlendeAbgelaufeneUndManipulierteJwtErlaubenKeineFinanzzugriffe; cookieAlleinErteiltKeinenBudgetzugangUndBearerPutBenoetigtKeinCookieCsrf |
| Berlin-Monatswechsel, Fortführung und frühere Werte | BudgetTest.monatsgrenzenVerwendenBerlinAuchBeiSommerzeitUndJahreswechsel; BudgetIT.budgetGiltFortlaufendUndAenderungenBewahrenFruehereBerlinMonate |
| Erfolg nach Commit, Rollback und neutrale Logs | BudgetIT.commitFehlerBestaetigtKeineSpeicherungUndVeraendertKeinenBestand; Browser „gehaltene Antwort …“, „verlorene Antwort, Serverfehler und Offline …“ |
| FORCE RLS, minimale Rechte, fehlender/falscher Kontext und Kontextfreiheit | BudgetIT.rlsVerweigertFehlendenUndFalschenKontextUndLaeuftAmTransaktionsendeAus; minimaleRechteForceRlsUndDatenbankConstraintsSindWirksam |
| Reload, Fehlerretry, Doppelsenden und Offline | Browser „Ladefehler …“, „gehaltene Antwort …“, „verlorene Antwort, Serverfehler und Offline …“ |
| Abmeldung, Kontowechsel, Tokenablauf und späte Antworten | Browser „Abmeldung … GET-Antwort“, „Abmeldung … PUT-Antwort“, „Kontowechsel …“, „fehlgeschlagene Sitzungsverlängerung …“, „Tokenablauf …“ |
| 320/390/768/1280 Pixel, 200-%-Text, Geldfeld-/Aktionsgrößen, Tastatur und axe | Browser „320 Pixel, Tastatur, 200-Prozent-Text, Geldgrenzen und axe in Formular-/Fehler-/Erfolgszuständen“ |


### Abschließende eigene Verifikation nach Reviewkorrekturen

Am 23.10.2026 durch den Hauptagenten am korrigierten Stand ausgeführt:

- `./backend/mvnw -f backend/pom.xml verify`: **73 Backendfälle**, keine Fehler, nichts übersprungen. Die erweiterten Startprüfungen, direkten RLS-UPDATE-Kontrollen und sichere Fehlerkategorie liefen erfolgreich. Protokoll: `/tmp/tnbp-story13-final-backend.log`.
- `./scripts/check-contract.sh`: OpenAPI gültig, oasdiff ohne inkompatible Änderungen, Generierung/Kompilierung beider Schnittstellen und statischer Produktionsbuild erfolgreich. Protokoll: `/tmp/tnbp-story13-final-contract.log`.
- `npm --prefix frontend run e2e`: **50 Browserfälle**, alle erfolgreich, einschließlich 15 Budgetfälle und sämtlicher Zugangsregressionen. Neue Nachweise: Rückmeldungen beim Bearbeiten, serialisierte Zugangs-Wiederholung/Live-Status und vollständige Übernahme langer Nullfolgen. Protokoll: `/tmp/tnbp-story13-final-browser.log`.
- `git diff --check`: ohne Befund. Vergleich des eingefrorenen Blocks vor/nach Review: identisch.

Die unabhängigen Reviews umfassten Blind Hunter, Edge Case Hunter und Verification Gap Reviewer. Es bestehen keine offenen bestätigten Befunde. Produktionsdeployment und echte Nutzerdaten wurden nicht ausgeführt.
