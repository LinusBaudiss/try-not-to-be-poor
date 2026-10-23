---
title: 'Story 1.4: Ausgaben erfassen und die Historie ansehen'
type: 'feature'
created: '2026-10-23'
status: 'done'
baseline_commit: 'f004eb6e160f051b9c7141d319664ff3aaa569d5'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
---

<frozen-after-approval reason="Menschlich freizugebender Umfang">

## Intent

**Problem:** Eigene Ausgaben lassen sich bisher weder erfassen noch ansehen.
**Ansatz:** Erfassung und vollständige Historie in der Monatsansicht ergänzen, mit API und PostgreSQL-Persistenz.

## Boundaries & Constraints

**Immer:** Eigentümer ausschließlich aus geprüftem JWT-`sub`; Abfragefilter und erzwungene RLS mit transaktionslokalem `app.user_id`. Laufzeitrolle ohne Tabellenbesitz oder RLS-Umgehung. Positive ganzzahlige EUR-Cent bis `9007199254740991`; exakte Monatssummen und Restbudget innerhalb ± dieser Grenze. Erfassungstag serverseitig über injizierte Clock nach `Europe/Berlin`, als Kalenderdatum. Finanzdaten und Entwürfe nur im Arbeitsspeicher; Sitzungsende und Kontowechsel verwerfen sie samt verspäteten Antworten. Bestehenden Stack und Vertragsgenerierung verwenden.

**Außerhalb:** Restbudgetanzeige (1.5), Bearbeiten/Löschen (1.6), Kategorien, frei wählbares Datum, Produktionsdeployment und echte Nutzerdaten.

## I/O & Edge-Case Matrix

| Angenommen | Wenn | Dann |
|---|---|---|
| Angemeldet, Name und positiver Betrag | Speichern | Nach Commit eigener Eintrag mit UUID und Berlin-Datum; anschließend weitere Erfassung möglich. |
| Leerer Name, Null, negative/zu große Beträge oder mehr als zwei Dezimalstellen | Prüfen | Feldfehler, keine Rundung oder Mutation; Entwurf bleibt. |
| Eigene Einträge aus mehreren Monaten | Historie laden | Alle eigenen Namen, Beträge und Daten deutsch formatiert; keine fremden Einträge. |
| Keine Ausgaben | Laden erfolgreich | Leerer Zustand mit „Ausgabe erfassen“. |
| Anfrage läuft, scheitert oder offline | Speichern | Doppelsenden gesperrt; Erfolg ausschließlich nach Bestätigung; bei Fehler Entwurf erhalten. |
| Daten laden oder Konto/Sitzung endet | Antwort kommt | Keine ungeprüften, alten oder fremden Werte sichtbar. |
| Monatssumme erreicht Centgrenze | Weitere, auch parallele Erfassung | Grenzüberschreitung atomar ablehnen; fremde Konten und andere Monate nicht einrechnen. |

</frozen-after-approval>

## Code Map

- `backend/src/main/java/de/linus/tnbp/expensebudget/Budget*.java`: JDBC-/Transaktionsmuster; Budgetverhalten erhalten.
- `backend/src/main/java/de/linus/tnbp/access/AccessConfiguration.java`: Bearer-Routen und strikter JSON-Parser.
- `frontend/src/app/month/month.ts`: Identitätsprüfung und Generation; `../shared/money.ts`: exakte Geldfunktionen.
- `frontend/e2e/budget.spec.ts`: Browsermuster; `backend/src/test/java/de/linus/tnbp/access/PostgresFixture.java`: echte Datenbank.
- Kontinuität: `spec-1-1-registrierung.md` abgeschlossen; Code 1.2/1.3 in `main` integriert. Gültigen Epic-Kontext gelesen.

## Tasks & Acceptance

- [x] `api-contract/openapi.yaml`: GET/POST `/expense-budget/expenses`; Anfrage `name`/`amountCents`, Antwort zusätzlich `id`/`recordedOn`; Liste und Fehler definieren, generieren.
- [x] `backend/src/main/resources/db/migration/V4__expenses.sql`: Tabelle, sichere Cent-Constraints, RLS und minimale Laufzeitrechte anlegen.
- [x] `backend/src/main/java/de/linus/tnbp/expensebudget/Expense{Controller,Service,Repository,Errors}.java` und `access/AccessConfiguration.java`: Erfassung, Historie, Zugriffsschutz und atomare Summenprüfung implementieren.
- [x] `frontend/src/app/month/expenses.ts`, benachbarte `month.ts`, `frontend/src/styles.css`: Formular, Lade-/Fehler-/Leerzustände; mobil beschriftete Einträge, Desktop Tabelle.
- [x] `backend/src/test/java/de/linus/tnbp/expensebudget/ExpenseTest.java`, `ExpenseIT.java`, `frontend/e2e/expenses.spec.ts`: Matrix, JSON-Typen, JWT/RLS, Berlin-Grenzen, Parallelität, Commitfehler und verspätete Antworten nach Konto-/Sitzungswechsel prüfen.
- [x] `_bmad-output/implementation-artifacts/sprint-status.yaml` und diese Spezifikation: Fortschritt und tatsächliche Nachweise festhalten.

**Abnahme:** Angenommen 320 × 568 oder 1280 × 800 CSS-Pixel und 200-%-Text, wenn die Übersicht per Tastatur/Touch bedient wird, dann bleiben Name/Betrag/Datum ohne horizontales Scrollen zugänglich; Labels, Fehlerzuordnung, Fokus, Statusmeldungen und axe-Prüfung bestehen.

## Implementation Notes

- GET/POST `/expense-budget/expenses` verwenden generierte Vertragstypen. Erfolgreiche Erfassung antwortet mit 201 erst nach Commit; unbekannte Felder und unpassende JSON-Typen werden ohne Mutation abgewiesen.
- V4 legt die Tabelle mit sicheren positiven Centwerten, Eigentümerindex und erzwungenem RLS an. Runtime erhält nur SELECT/INSERT; `user_id` stammt ausschließlich aus dem geprüften JWT und wird zusätzlich in Abfragen gefiltert.
- Eine transaktionslokale Advisory-Sperre je Konto serialisiert Summenprüfung und Insert auch bei leerer Historie. PostgreSQL-NUMERIC/Java-BigDecimal halten die Monatssumme exakt. Weil Budget und Monatssumme jeweils zwischen 0 und MAX_CENTS liegen, bleibt auch ihre Differenz innerhalb ±MAX_CENTS.
- Datum entsteht nach der Sperre aus der injizierten Clock im Berlin-Kalender. Namen werden einschließlich Unicode-Leerzeichen wie im Browser getrimmt.
- Die Monatsansicht erhält ein Formular und die gesamte Historie als beschriftete mobile Einträge beziehungsweise semantische Desktop-Tabelle. Alle Beträge und Daten werden vor Anzeige geprüft; Sitzungs-/Kontowechsel und Zerstörung der Komponente löschen Einträge und Entwürfe. Ausstehende Antworten werden über Generation und Eigentümer verworfen.
- Eine bestehende Budget-Offline-Assertion wurde auf ihr Formular begrenzt, weil die Monatsansicht nun zwei Formulare mit Offline-Hinweis enthält.

### Matrixabgleich durch den Hauptagenten

Alle sieben Matrixzeilen sind im vollständigen grünen Lauf belegt: (1) `ExpenseIT.speichernIstGetrimmtBestaetigtUndHistorieUmfasstAlleEigenenMonate` und Browser Erfassung/Reload, (2) `ExpenseTest.nameUndPositiveGanzeSichereCentSindErforderlich`, JSON-Integrationstest und Browser Feldfehler, (3) derselbe mehrmonatige Integrationstest und Browser mit fremder Zeitzone, (4) Browser Leerzustand, (5) Browser Doppelsenden/Fehler/offline plus tatsächlicher Commitfehler im Backend, (6) Browser Laden/Identität/Logout/Kontowechsel/Tokenablauf, (7) Integrationstests Monatsgrenze und zwölf parallele Erfassungen. Responsive Abnahme durch Browser Tastatur/200-%-Text/axe bei beiden geforderten Viewports bestätigt. Diff vollständig gelesen und gegen Aufgaben sowie Prüfprotokolle abgeglichen.

## Spec Change Log

## Review Triage Log

Reviewdurchlauf 1: Alle drei unabhängigen Layer abgeschlossen. Jeder Befund wurde vor Gruppierung bewertet.

| Fund | Urteil | Beleg und Route |
|---|---|---|
| Blind 1: verlorene POST-Antwort und Retry | medium | POST erzeugt jeweils eine neue UUID; nach unbekanntem Ausgang lädt der Text ohne Warnung zum Wiederholen ein. Patch: unklaren Ausgang und Duplikatrisiko nennen, vorhandenes Nachladen zur Prüfung anbieten; keine automatische Wiederholung. |
| Blind 2: Nullzeichen im Namen | medium | Java lässt U+0000 zu, PostgreSQL TEXT kann es nicht speichern; der Fehler landet in 500. Patch: konkret dieses Zeichen als Namensfehler vor der Transaktion ablehnen und HTTP-Test ergänzen. |
| Blind 3: unbeschränkte Namens-/Anfragegröße | false | `application.yaml` begrenzt global JSON-Dokument und Strings auf 32768; der Jackson-Parser schützt auch diese Route. Eine zusätzliche Produktlängengrenze ist nicht erforderlich. |
| Blind 4: SQL-Namensconstraint | low | `btrim(name)` erfasst nur Leerzeichen; direkte Inserts können reine Tab-/Unicode-Leerzeichen speichern. Direkte Korrektur: Trimzeichensatz an die vorhandene Serviceprüfung angleichen und Constraint testen. |
| Blind 5: vollständige Historie/zweifaches DOM | low | Liste und Tabelle wachsen mit der Historie. Kein beobachteter Fehler und kein Performanceziel; Pagination/Virtualisierung brächten für die private v1 zusätzliche Zustände und Schnittstellen. Wegen geringem Nutzen gegenüber Komplexität verworfen. |
| Blind 6: GET als Voraussetzung für POST | low | Die Erfassung ist nach Ladefehler gesperrt, bis „Ausgaben erneut laden“ erfolgreich ist. Konservatives Bereitschaftsmodell mit vorhandener Wiederholung; Entkopplung samt Abgleich erfordert zusätzliche Zustände. Als geringfügige Einschränkung verworfen. |
| Blind 7: Liste anderer Tabs wird nicht nachgeladen | low | Nachladen gibt es nur nach Ladefehler. Direkter Patch: denselben Handler als explizite Aktualisierungsaktion nutzbar machen, Entwurf erhalten; kein automatischer Mehrtab-Abgleich versprochen. |
| Blind 8: falsche Feldfehler | low | Handler markiert auch bei einem einzelnen Validierungsfehler beide Felder. Patch: Binding-/Parserpfad nutzen oder bei nicht zuordenbarer JSON-Struktur ausschließlich allgemeinen Fehler ausgeben. |
| Blind 9: grobe Logkategorien | low | Datenbankfehler werden absichtlich ohne Parameter/Exceptiontext zusammengefasst; Programmfehler besitzen eigene Kategorie. Zusätzliche Diagnose-/Korrelationsstruktur ohne beobachtete Störung rechtfertigt hier keine neue Komplexität. Verworfen. |
| Blind 10: Datum nach wartender Sperre ungetestet | medium | Bisherige Tests prüfen Sperre und Datum getrennt; Entfernen der Reihenfolgegarantie bliebe unentdeckt. Patch: bestehendes Fixture für über Mitternacht gehaltene Sperre samt altem vollem/neuem leerem Monat nutzen. |
| Edge 1: verlorene Antwort erzeugt bei Retry Duplikat | medium | Wie Blind 1: Commit vor Antwortverlust ist möglich und erneutes POST ist eine neue Erfassung. Gemeinsamer Patch macht dies ausdrücklich kenntlich und bietet Historienprüfung vor bewusster Wiederholung. |
| Verifikation 1: abweichende Bestätigung ungetestet | medium | Vorverifiziert: ungültiges Datum wird geprüft, gültige Antwort mit abweichendem Namen/Betrag nicht. Patch: zwei Varianten im bestehenden Entwurferhaltungstest. |
| Hauptagent: Protokollfehler als 500 | medium | Catch-all in `ExpenseErrors` verschluckt Spring-`ErrorResponse` (z. B. 415). `RegistrationErrors` enthält bereits korrektes Muster. Patch: HTTP-Status/Headers übernehmen und gezielt testen. |

Gruppierung: Blind 1 und Edge 1 teilen dieselbe irreführende Wiederholungsempfehlung. Alle übrigen angenommenen Befunde erhalten jeweils eigene direkte Korrekturen. Keine Änderung des freigegebenen Blocks, keine neue öffentliche API und kein Loopback erforderlich.


## Design Notes

Namen trimmen und nichtleer prüfen. Historie nach Datum absteigend, dann ID; Datum ohne Zeitzonenumrechnung formatieren. Monatssumme exakt als NUMERIC lesen, unter kontogebundener Transaktionssperre prüfen. Migration ausschließlich lokal testen.

## Verification

Erfolgreich am 2026-10-23, ausschließlich mit synthetischen lokalen Daten:

- Vertragscheck vollständig erfolgreich: OpenAPI gültig, oasdiff ohne inkompatible Änderung, generierte Spring-/Angular-Schnittstellen und statischer SPA-Build erfolgreich. Protokoll: `/tmp/story14-contract.log`.
- Backend vollständig erfolgreich: **35 Unit-Tests und 49 PostgreSQL-Integrationstests**, darunter 3 neue Unit- und 8 neue Integrationstests. Belegt sind JSON-Typen, JWT/Cookie-Grenze, Kontentrennung, RLS samt Kontextablauf und minimalen Rechten, Berlin-Grenzen, exakte Summen, 12 parallele Requests an der Centgrenze und ein tatsächlicher verzögerter Commitfehler. Protokoll: `/tmp/story14-backend-final.log`.
- Browserregression vollständig erfolgreich: **61 Tests**, darunter 11 neue Ausgabenfälle. Enthalten sind bestätigte Erfassung/Reload, Entwurferhalt bei Fehlern/offline, Doppelsendschutz, ungültige Antworten, verspätetes GET nach Logout, verspätetes POST nach Kontowechsel und tatsächlichem Tokenablauf, Datum in fremder Browserzeitzone, Identitätsprüfung vor dem ersten Ausgabenrequest und axe/Tastatur/Touchziele ohne horizontales Scrollen bei 320 × 568 und 1280 × 800 sowie 100-/200-%-Text. Protokoll: `/tmp/story14-browser-final.log`.
- `git diff --check` erfolgreich. Keine Abnahme offen innerhalb dieser Spezifikation; fachliche Review folgt.

Lokale Prüfumgebung: `JAVA_HOME=/tmp/tnbp-jdk25`, `MAVEN_USER_HOME=/tmp/tnbp-maven`, `MAVEN_OPTS=-Dmaven.repo.local=/tmp/tnbp-maven/repository`, `npm_config_cache=/tmp/tnbp-npm`, für Browser zusätzlich `PLAYWRIGHT_BROWSERS_PATH=/tmp/tnbp-playwright`. Lokale Server/DB und npm-Installationsunterprozesse benötigen in dieser Codex-Umgebung die genehmigte Sandbox-Eskalation.

Vorgegebene Prüfkommandos:

- `./scripts/check-contract.sh`: Vertrag kompatibel, beide Schnittstellen kompilieren.
- `./backend/mvnw -f backend/pom.xml verify`: Unit- und PostgreSQL-Integrationstests erfolgreich.
- `npm --prefix frontend run e2e`: neue Browserfälle und bestehende Regressionen erfolgreich; statischer Build im Vertragscheck enthalten.


### Abschluss nach Review-Korrekturen

- Alle drei unabhängigen Review-Layer und die zusätzliche Hauptprüfung sind abgeschlossen. Jeder Befund ist oben bewertet; alle angenommenen Befunde wurden korrigiert, nichts zurückgestellt. Der freigegebene Block blieb unverändert.
- Bei unbekanntem POST-Ausgang weist die Oberfläche ausdrücklich auf eine möglicherweise bereits gespeicherte Ausgabe und das Duplikatrisiko hin. Die vorhandene Historienabfrage ist ausdrücklich aktualisierbar und erhält den Entwurf; sie sendet keine zweite Mutation. Ein echter Commit mit anschließend verlorener Antwort ist als Browserregression nachgewiesen. Bewusst erneut gesendete POSTs bleiben eigenständige Erfassungen.
- Nullzeichen werden vor der Transaktion als Namensfehler abgelehnt. Datenbank und Service stimmen hinsichtlich leerer Unicode-Namen überein. Fehler betreffen ausschließlich die tatsächlich ungültigen Felder; Protokollstatus und Header bleiben erhalten.
- Zusätzliche Regressionen sichern gültige, aber abweichende Speicherbestätigungen und einen nachweislich auf die Kontosperre wartenden POST über den Berliner Monatswechsel ab.
- Der Hauptagent hat den korrigierten Diff vollständig gegen Aufgaben, Matrix und Abnahmen geprüft und alle vollständigen Prüfungen anschließend selbst ausgeführt: **Vertragscheck mit Kompatibilitätsvergleich und beiden generierten Builds erfolgreich; 36 Unit-Tests, 52 PostgreSQL-Integrationstests und 62 Browserfälle erfolgreich, keine Fehler oder übersprungenen Fälle.** Darunter 4 neue Unit-, 11 Integrations- und 12 Browserfälle für Ausgaben.
- Finale Protokolle: `/tmp/story14-root-contract.log`, `/tmp/story14-root-backend.log`, `/tmp/story14-root-browser.log`. Zusätzlich gezielte Korrekturprüfungen: `/tmp/story14-fixes-backend.log`, `/tmp/story14-fixes-browser.log`. `git diff --check` erfolgreich.
- Spezifikation abgeschlossen; Sprintstatus bleibt für menschliche Abnahme auf `review`. Kein Push und keine Änderung an Produktionsdaten.


### CI-Korrektur in PR #5

Die ersten Push-/PR-Läufe fanden bei 200-%-Text einen echten horizontalen Überlauf langer Feldlabels. Lokal ließ sich die Schriftabhängigkeit mit DejaVu Sans reproduzieren: Seite 342 statt 320 Pixel, Ausgabenlabel 261 statt 158 Pixel. `overflow-wrap: anywhere` für Labels korrigiert dies ohne Abschneiden oder Verbergen; anschließend bleiben Seite und Labels exakt in ihrem Bereich. Die vorhandenen Budget-/Ausgaben-Responsive-Tests prüfen nun zusätzlich jedes Label auf inneren Überlauf, sodass auch die lokale Standardschrift die frühere Lücke erkennt. Vollständige Browserregression nach der Korrektur: 62 Fälle erfolgreich; Protokoll `/tmp/story14-pr5-browser-fixed.log`. Der freigegebene Umfang bleibt unverändert.
