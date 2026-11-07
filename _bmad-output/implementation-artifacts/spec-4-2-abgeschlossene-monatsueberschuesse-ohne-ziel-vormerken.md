---
title: 'Story 4.2: Monatsüberschüsse ohne Ziel vormerken'
type: 'feature'
created: '2026-11-07'
status: 'done'
route: 'dispatch'
story_key: '4-2-abgeschlossene-monatsüberschüsse-ohne-ziel-vormerken'
baseline_commit: '8c2882b1164246041218797e3eb2da9478e9d283'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/epics.md'
---

<frozen-after-approval reason="Nutzerabsicht; Änderungen nur nach erneuter Abstimmung">

## Intent

**Problem:** Monatsnachweise und sichtbare Vormerkungen ohne Ziel fehlen.

**Approach:** Story 4.2/AC-1–11 aus `epics.md` vollständig umsetzen: interner Monatsabschluss, Nachweise, exakte offene Summe und v2-Anzeige in Sparziele.

## Boundaries & Constraints

**Always:** Verifizierter Kontokontext, Modulbesitz, Filter/FORCE-RLS, Kontosperre, eine physische Transaktion und ein Zeitpunkt nach Sperrerwerb. Historische öffentliche Finanzprojektionen; `max(0, Budget − Ausgaben)`. Exakte Cent innerhalb ±9007199254740991. Nachweis/Summenprüfung/Nutzungsmarker gemeinsam committen, auch bei 0/ohne Budget.

**Never:** Gesamtgates öffnen, v1/alte Migrationen ändern, öffentlichen Abschluss oder simulierten Nutzer-JWT einführen. Auswahl, Zielbindung, Anrechnung, Korrektur und Worker bleiben Folgeumfang; keine vorsorglichen Objekte.

## I/O & Edge-Case Matrix

| Zustand | Verhalten |
| --- | --- |
| Oktoberstart | Vollständiger Oktober erst nach Monatsende; September/laufende/spätere Monate oder fehlende Aktivierung ohne Nachweis. |
| Oktober 1000 € − 800 €; November 100 € | Getrennte Nachweise, 300 € offen; heutiges Budget ersetzt historisches nicht, Zielfortschritt bleibt 50 €. |
| Budgetrest ≤0 / kein Budget | Offener Nullnachweis / Ohne-Budget-Nachweis ohne Vormerkung. |
| Wiederholung/Konkurrenz/Monatslücke | Einmalwirkung; vorhandenen Nachweis erhalten, fehlenden früheren Monat verarbeiten. |
| Grenze/Commitfehler | Vollständiger Rollback; ungültige Bestandssumme beim GET neutral ablehnen. |
| GET `/api/v2/monthly-surplus/pending` | Rein lesend, `pendingCents` sicher/nichtnegativ, leer=0; Bearer/401, no-store, neutraler 500. |
| UI-Fehler/Rückkehr/Sitzungswechsel | Keine erfundene Null; neu laden, Entwürfe erhalten, alte Antworten entkräften, persönliche Werte verwerfen. |

</frozen-after-approval>

## Code Map

Java-Pfade relativ zu `backend/src/main/java/de/linus/tnbp/`, Testpfade analog unter `backend/src/test/java/de/linus/tnbp/`.

- `shared/FinanceTransactions.java`, `shared/FinanceContext.java`: Sperre/Uhr/Snapshot wiederverwenden. `Budgets.current`/`Expenses.monthTotal` unterstützen historische Monate.
- `shared/ApiVersionState.java`: `lockMonthlyAutomation` und `markMonthlyEffect` bestehen; `finance/MonthlyAutomationReadiness.java` bleibt geschlossen.
- UI: `accepts/clear` und Sequenzen erhalten; Rückkehrmuster aus `frontend/src/app/month/month-summary.ts` übernehmen.

## Tasks & Acceptance

**Execution:** Reihenfolge einhalten; Builds/Browserläufe sequenziell.

- [x] `api-contract/v2/openapi.yaml`: Lesevertrag vor Verbrauchern ergänzen, Clients generieren.
- [x] `backend/src/main/resources/db/migration/V13__monthly_surplus_month_records.sql`, `deploy/provision-finance-grants.sql`, `access/DatabaseRoleVerifier.java`: eigene eindeutige Monatsnachweise, Constraints, FORCE-RLS, ausschließlich SELECT/INSERT ergänzen.
- [x] `monthlysurplus/MonthRecordRepository.java`, `monthlysurplus/MonthlySurplus.java`: Erstverarbeitung, Wiederholungsschutz und offene Summe ergänzen; nullable Überschuss unterscheidet fehlendes Budget von offenem Betrag einschließlich 0. SUM dezimal prüfen.
- [x] `finance/FinanceApplication.java`: internen Einmonatsabschluss mit Gates, Projektionen und Marker koordinieren; Vormerkung read-only lesen.
- [x] `finance/http/MonthlySurplusV2Controller.java`, `finance/http/MonthlySurplusV2Errors.java`, `access/AccessConfiguration.java`: GET, JWT-Schutz und neutralen Ladefehler integrieren.
- [x] `frontend/src/app/savings-goals/monthly-automation.ts`, `frontend/src/styles.css`: unabhängige Zustände, sichere Antwortvalidierung, Vormerkung/fehlende Auswahl erklären; bei Rückkehr/Fokus aktualisieren. Entwürfe/manuelle Zielpflege erhalten.
- [x] `monthlysurplus/MonthlySurplusTest.java`: Geld-/Monatsrandfälle der Matrix als Unit-Tests prüfen. `monthlysurplus/MonthlyPendingIT.java`, `finance/FinanceMigrationIT.java`, `finance/FinanceCoordinationIT.java`, `finance/ArchitectureTest.java`, `access/RegistrationIT.java`, `versions/ApiVersionStateIT.java`: Matrix/AC-11 mit PostgreSQL prüfen. `versions/ReleaseTransitionIT.java`, `versions/AdministrativeSerializationIT.java`: synthetische V13-Fixtures auf V14 verschieben; Rücknahmegrenze prüfen.
- [x] `access/MonthlyAutomationE2eServer.java`, `frontend/e2e/monthly-automation.spec.ts`, `frontend/e2e/monthly-automation-closed.spec.ts`: testinterne echte Abschlusssteuerung und Browsermatrix ergänzen.
- [x] `README.md`, `_bmad-output/implementation-artifacts/sprint-status.yaml`: Nachweise/Freigabegrenzen dokumentieren; kein GitHub-Abgleich.

**Acceptance Criteria:**

- Angenommen echte PostgreSQL-/API-Kontexte, wenn Matrix/AC-1–6/9/11 laufen, dann bestehen Migration, Kontentrennung, Kalender-/Sperrgrenzen, Kontextbereinigung, Einmalwirkung, Centgrenzen und Markerrollback.
- Angenommen HTTPS, wenn AC-7/8/10/11 laufen, dann bestehen berechnete 300 €/unveränderte 50 €, Null/Fehler, Entwürfe, Offline, Rückkehr und Sitzungsgrenzen bei 320×568, 390×844, 768×1024, 1280×800 mit Tastatur, Kontrast/Fokus und 200 % Text/Reflow.

## Implementation Notes

- V13 ergänzt ausschließlich `monthly_surplus.month_records`: eindeutige Konto-/Monatsherkunft, `surplus_cents = NULL` für fehlendes Budget, nichtnegative Werte einschließlich 0 für offene budgetierte Monate; FORCE-RLS und nur SELECT/INSERT.
- `FinanceApplication.closeMonthlySurplusMonth` ist ausschließlich intern erreichbar. Kontosperre/Uhr, frisches Versionsgate, historische Modulprojektionen, Dezimalsummenprüfung, Erstnachweis und Nutzungsmarker teilen den äußeren Commit. Bestehende Nachweise werden nicht neu berechnet.
- Die GET-Anzeige lädt unabhängig von Zielentwürfen; sichere Antwortvalidierung, eigene Anfragesequenz, Serverkalender, Fokus/Rückkehr und Sitzungsbereinigung sichern frische persönliche Werte. Auswahl und Übernahme werden nicht vorweggenommen.
- Die nur im Testklassenpfad vorhandene Loopback-Steuerung erzeugt synthetische historische Quellen und ruft die echte äußere Abschlusskoordination auf. Gesamtgate, v1-Vertrag und bestehende Migrationen bleiben unverändert.

## Spec Change Log

## Review Triage Log

Alle drei Reviewebenen wurden vor der Einordnung vollständig eingesammelt. Grundlage: `/tmp/story42-implementation-dj2dqfxh.patch`, 105272 Byte. Jedes Urteil entstand vor der Gruppierung.

| Befund | Urteil und Evidenz | Behandlung |
| --- | --- | --- |
| B1: Wiederverbindung übernimmt ausstehende alte Antwort | medium: `connected()` verwendet den nicht erzwungenen Abruf; dessen Loading-Guard verhindert eine neue Sequenz, solange die vor der Unterbrechung gelesene Antwort aussteht. | patch |
| B2: Rückkehr erkennt Aktivierung aus anderem Tab nicht | medium: `returned()` lädt nur Vormerkungen; `loadPending()` bricht bei gespeichertem inaktivem Zustand ab. Eine Aktivierung desselben Kontos ändert weder dessen Identität noch die Sitzungsgeneration. | patch |
| B3: Aktivierungs-Lesefehler blockiert Vormerkungsaktualisierung | medium: `load()` verwirft den bestätigten Aktivierungszustand vor der Antwort. Bei Fehler bleiben vorhandene Vormerkungswerte sichtbar, aber Button und Aktualisierungswege verlieren ihren aktiven Zustand. | patch |
| B4: Fehlende Serverzeit verhindert Monatswechseltimer | low: Ohne gültigen Date-Header bleibt bei Erstabruf die Timerbasis leer. Reguläre Antworten liefern diesen Header; Fokus, Navigation und manuelle Aktualisierung funktionieren weiterhin. Ein zusätzlicher Fehler-/Fallbackzweig hätte nur für diesen ungewöhnlichen Antwortzustand Wirkung. | verworfen gemäß Low-Regel: zusätzliche Zustands-/Fallbackkomplexität |
| B5: Fokus und Sichtbarkeitswechsel erzeugen doppelte GETs | low: Beide Ereignisse dürfen einen überholenden Abruf starten; Sequenzen verhindern alte Anzeige, beenden aber die vorherige Anfrage nicht. Die belegte Folge sind zusätzliche rein lesende Abfragen, kein verlorener oder falscher Geldwert; eine relevante Lastwirkung ist nicht gezeigt. | verworfen gemäß Low-Regel: zusätzliche Zusammenfassungs-/Abbruchsteuerung |
| B6: Exakte Summengrenze nicht durch Abschluss nachgewiesen | medium: Der bestehende IT legt MAX direkt per SQL an; Formel-/Money-Tests ersetzen keinen erfolgreichen Abschluss bis exakt MAX und anschließende Ablehnung von MAX+1. | patch: präziser Abschluss-/Rollbacktest |
| B7: Konkurrenz verschiedener Monate an Summengrenze fehlt | medium: Der vorhandene Konkurrenztest verwendet nur denselben Monat; dessen Datenbank-Eindeutigkeit würde einen fehlenden Schutz der Gesamtsumme zwischen zwei Monaten nicht erkennen. | patch: zwei Monate, nur ein wirksamer Abschluss |
| B8: Erster budgetierter Nullmonat beweist Marker nicht unabhängig | medium: Der Ohne-Budget-Nachweis setzt den Marker vor allen budgetierten Nullfällen; ein fälschlich nur bei positiven/fehlenden Budgets gesetzter Marker bestünde die vorhandenen Tests. | patch; erst nach Einzelurteil mit V1 gruppiert |
| B9: Wiederholung bei ausgefallener Quellprojektion ungetestet | low: Der aktuelle Test verändert Quellen, beweist aber nicht deren vollständiges Überspringen. Der Code prüft den vorhandenen Nachweis ausdrücklich vor den Projektionen; ein zusätzlicher Fehler-/Spyfall wäre eine weitergehende Absicherung dieses bereits richtigen Pfads. | verworfen gemäß Low-Regel: seltene Fehlerkombination und zusätzliche Teststeuerung |
| B10: Neutralität der Fehlerlogs ohne Testnachweis | medium: Der Fehlerfall prüft nur die HTTP-Antwort; die derzeit konstante Logmeldung könnte künftig durch vertrauliche Werte erweitert werden, ohne dass der vorhandene Nachweis dies erkennt. | patch: tatsächlich erzeugte Fehlermeldungen erfassen |
| E1: Alte Antwort nach Wiederverbindung bleibt sichtbar | medium: Eigenständig anhand des identischen Loading-Guards bestätigt; eine Online-Rückkehr erzeugt keine neue Sequenz. | patch; erst nach Einzelurteil mit B1 gruppiert |
| V1: Budgetierter erster Nullmonat lässt Markerregression zu | medium: Vorverifizierte Prüflücke mit konkretem überlebendem Mutanten `created && (budget == null || budget > total)`; der erste Ohne-Budget-Monat maskiert die fehlende Nullwirkung. | patch; mit B8 gruppiert |
| V2: Ausstehende Vormerkung wird nie als ladend geprüft | medium: Vorverifizierte Prüflücke; gehaltene Antworten werden erst nach Abschluss/Überholung geprüft. Ein erfundener Nulltext im Ladezweig würde diese Tests bestehen. | patch: Initial- und Aktualisierungsabruf vor Freigabe prüfen |

Die angenommenen Korrekturen sind direkt und ohne neue öffentliche Schnittstelle ausführbar. Keine Absichts- oder Planlücke, keine Zurückstellung. B1/E1 und B8/V1 teilen jeweils eine Ursache; die übrigen angenommenen Befunde bleiben getrennt.

Die Korrekturen sind umgesetzt und gezielt geprüft: drei Aktualisierungskorrekturen innerhalb der bestehenden Komponente, 16 erfolgreiche `MonthlyPendingIT`-Fälle und 51 erfolgreiche Automatik-Browserfälle. Die neuen Fälle prüfen echte MAX/MAX+1-Abschlüsse, gleichzeitig wartende unterschiedliche Monate, drei erste budgetierte Nullmonate mit Rücknahmesperre, neutrale Fehlerlogs sowie explizites Laden ohne Betrag. Reconnect, Rückkehr nach Aktivierung in einem zweiten Tab und unabhängige Vormerkungsaktualisierung trotz Aktivierungs-Lesefehler sind ausgeführt. Logs: `/tmp/story42-review-backend.log`, `/tmp/story42-review-automation.log`. Der vollständige Abschlusslauf folgt am korrigierten Quellstand.

## Design Notes

Keine Absichtslücken. Migration/Monatsherkunft dauerhaft; keine Bereitstellung. Neue Modul-/Koordinationszugänge und HTTP-Leseweg. Ausgangsbasis ist die abgeschlossene Story 4.1; deren Sprintstatus erhalten.

## Verification

Ergebnis 2026-11-07: alle vorgesehenen Prüfungen erfolgreich. Release-JAR enthält V13 und keine E2E-/Teststeuerklassen; `MonthlyAutomationReadiness` bleibt im Auslieferungscode geschlossen.

- Vertrag: v1/v2 validiert, je Basisvertrag kompatibel, generierte Java-/Angular-Schnittstellen und SPA erfolgreich kompiliert. v1 unverändert.
- Backend: 48 Unit-/Architekturtests und 339 PostgreSQL-/API-/Prozessintegrationstests erfolgreich, keine übersprungenen Tests (15:35 Minuten). Darunter `MonthlyPendingIT` mit 11 Fällen, bestehende Aktivierung mit 14 Fällen, ReleaseTransition mit 59 Fällen sowie Migration/Rollen/Serialisierung/Koordination.
- Python: 19 Prüfungen erfolgreich.
- Reguläres HTTPS-E2E: 212/212 erfolgreich (3,9 Minuten), einschließlich geschlossener Auslieferung und manuellem Bestand.
- Automatik-HTTPS-E2E: 46/46 erfolgreich (1,2 Minuten), einschließlich echt berechneter 300 €/unveränderter 50 €, Null/Fehler, ungültiger Antworten, Entwürfe/Offline, konkurrierender Antworten, Navigation/Rückkehr/Fokus/Monatswechsel sowie Abmeldung/Ablauf/Kontowechsel.
- Vier Größen mit Tastatur, Axe/WCAG, Fokus-/Kontrast-/Touchmessung und 200-%-Text/Reflow geprüft; lokal erzeugte Screenshots `frontend/test-results/monthly-pending-{320,390,768,1280}.png` gesichtet. Lange sichere Centbeträge werden ebenfalls vollständig dargestellt.
- `git diff --check` erfolgreich. Maven verwendete den vorhandenen projektlokalen Cache; npm-Downloads und lokale Testprozesse benötigten die freigegebene Ausführung außerhalb der eingeschränkten Sandbox. Kein GitHub-Abgleich und keine Bereitstellung.

Ausgeführte Prüfkommandos:

- `./scripts/check-contract.sh`
- `./backend/mvnw -f backend/pom.xml verify`
- `python3 -m unittest discover -s scripts/tests -v`
- `npm --prefix frontend run e2e`
- `npm --prefix frontend run e2e:automation`

### Unabhängiger Matrixabgleich

Der vollständige Diff einschließlich neuer Dateien wurde gegen `baseline_commit` gelesen. Ausführungslogs: `/tmp/story42-contract.log`, `/tmp/story42-backend.log`, `/tmp/story42-python.log`, `/tmp/story42-e2e.log`, `/tmp/story42-automation.log`. Alle folgenden Abdeckungen wurden tatsächlich ausgeführt und bestanden.

| Matrixzeile | Nachweis |
| --- | --- |
| Oktoberstart/Ausschlüsse | `MonthlyPendingIT.zweiHistorischeMonateGetrenntMitLueckeEinmalwirkungUndUnveraendertemZiel`, Kalender-/Sperrtests und `MonthlySurplusTest` |
| Historische 200 € + 100 €, Fortschritt 50 € | derselbe PostgreSQL-Fall und HTTPS-Fall „Echte historische Abschlüsse ergeben 300 Euro“ |
| Null/fehlendes Budget | `MonthlyPendingIT.nullBudgetUndNegativeResteBewahrenUnterschiedlicheHerkunftUndRichtigesMarkerRollback`, Formel-Unit-Test |
| Wiederholung/Konkurrenz/Lücke | historischer PostgreSQL-Fall und `konkurrierendeAbschluesseHabenGenauEineWirkung` |
| Grenzen/Commitfehler | `einzelUndOffeneSummengrenzeSindExaktUndFehlerLassenManuellePflegeZu`, `echterCommitfehlerUndFehlerVorCommitNehmenNachweisUndNutzungsmarkerZurueck` |
| GET/Zugang/Lesefehler | `nurBearerUndReinesLesenAuchBeiGeschlossenemGesamtgate`, ungültiger Summenbestand und regulärer HTTPS-Fall |
| UI/Entwürfe/Frische/Sitzung | Automatik-HTTPS-Fälle für Fehler/Null, Offline/Entwürfe, Fokus-/Navigationskonkurrenz, Servermonatswechsel, Abmeldung/Ablauf/Kontowechsel und vier Prüfgrößen |

### Abschließender Gesamtlauf nach Review vom 07.11.2026

Sämtliche Prüfkommandos wurden nach den Reviewkorrekturen vollständig und sequenziell erneut ausgeführt. Alle angenommenen Reviewbefunde sind behoben; keine Zurückstellungen oder offenen Korrekturen. Die vorstehenden Ergebnisse mit 339 Integrationstests und 46 Automatikfällen beschreiben den Erstlauf; maßgeblich für den Abschluss ist dieser korrigierte Stand.

SHA-256 des vollständigen Git-Diffs gegen `baseline_commit` einschließlich neuer Dateien und ohne `_bmad-output/`: `0d06454250617a3053bb6f4efeb5ee96375adf72b2c3c0f4225a65fb83d86c24`. Vor und nach allen fünf Läufen identisch. Ausführungsübersicht: `/tmp/story42-final-results.json`.

| Aufruf | Tatsächliches Ergebnis | Log |
| --- | --- | --- |
| `./scripts/check-contract.sh` | Beide Verträge kompatibel; generierte Schnittstellen und Release-SPA erfolgreich gebaut | `/tmp/story42-final-contract.log` |
| `./backend/mvnw -f backend/pom.xml verify` | 48 Unit-/Architekturtests und 344 Integrationstests, keine Fehler oder übersprungenen Tests | `/tmp/story42-final-backend.log` |
| `python3 -m unittest discover -s scripts/tests -v` | 19 erfolgreich | `/tmp/story42-final-python.log` |
| `npm --prefix frontend run e2e` | 212 erfolgreich | `/tmp/story42-final-e2e.log` |
| `npm --prefix frontend run e2e:automation` | 51 erfolgreich, einschließlich aller Reviewregressionen und vier Prüfgrößen | `/tmp/story42-final-automation.log` |

Die neue Migration und die interne Abschlussfunktion sind enthalten; öffentliche Gesamtfreigabe bleibt geschlossen. Auswahl, Übernahme, historische Korrektur und Worker bleiben die bereits geplanten Folgestories. Kein GitHub-Abgleich und keine Bereitstellung.

### CI-Nachprüfung des Browser-Testhelfers

Die ersten GitHub-Browserläufe von PR #58 zeigten in unterschiedlichen Fällen denselben Timeout beim Warten auf `Response.finished()` im Helfer `deliver`. Die vorherigen fachlichen Assertions waren erfolgreich. Der installierte Playwright-Client löst dieses Promise über `requestfinished` auf; `requestfailed` löst es nicht auf. Ein nach Antwortempfang verworfener Abruf konnte dadurch den Testhelfer bis zum Testtimeout warten lassen.

Der Helfer registriert jetzt vor Freigabe beide terminalen Ereignisse und ordnet sie der konkreten empfangenen Anfrage zu. Ein Browserabbruch `net::ERR_ABORTED` ist zulässig; andere Netzwerkfehler schlagen weiterhin fehl. Anschließend werden die RxJS-/Renderfortsetzungen abgewartet; sämtliche fachlichen Zustands-/Entwurfs-/Sitzungsassertionen bleiben erhalten. Geändert wurden Testhelfer und dieser Nachweis.

- Ausgangscommit: `0031dee961d70cdbe1e39d52a27d810ce670464d`.
- Tatsächlicher Aufruf: `npm --prefix frontend run e2e:automation -- --repeat-each=3`.
- Ergebnis: **153/153 erfolgreich**, einschließlich aller zuvor betroffenen Fokus-/Ablauf-/Ladefälle; keine Wiederholungs-Retries oder größeren Timeouts eingerichtet.
- Log: `/tmp/story42-ci-browser-repeat.log`.
- SHA-256 von `frontend/e2e/monthly-automation.spec.ts`: `3d7b2dd2ec5fc51b84139d73719c41659b259b067e4ed60a97221734bc14eb64`.
