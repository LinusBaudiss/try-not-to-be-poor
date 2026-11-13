---
title: 'Story 4.4: Historische Ausgaben mit Monatsüberschusskorrektur'
type: 'feature'
created: '2026-11-09'
status: 'done'
route: 'dispatch'
baseline_commit: '5eae9cd7a0ab81a16a503a803e6aa3da85e58962'
story_key: '4-4-historische-ausgaben-mit-ihrer-monatsüberschusskorrektur-änd'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/epics.md'
---

<frozen-after-approval reason="Nutzerabsicht; Änderungen nur nach erneuter Abstimmung">

## Intent

**Problem:** Historische Ausgabenmutationen korrigieren bisher weder Vormerkung noch Sparfortschritt.

**Approach:** Story 4.4/AC-1–12 aus `epics.md` vollständig umsetzen: Ausgabe und erforderliche Herkunftsmonatskorrektur gemeinsam bestätigen.

## Boundaries & Constraints

**Always:** Kontosperre vor Zustandslesen; ein Kalenderkontext/physischer Commit samt Nutzungsmarker. Modulzugänge, Filter/FORCE-RLS, exakte Cent ±9007199254740991. Datum und Bindung erhalten.

**Never:** V1/alte Migrationen/Gesamtgate ändern; andere Monate pauschal nachholen; Differenz im Browser berechnen; neue Geldendpunkte, Worker oder vollständige Ziellöschkoordination ergänzen.

## I/O & Edge-Case Matrix

| Fall | Ergebnis |
| --- | --- |
| Oktober offen 200→150 €, November 100 € | 250 € offen; spätere vollständige Einmalübernahme. Nullmonat bleibt budgetiert offen; ohne Budget kein Betrag. |
| Oktober an A: 200→150 €, aktueller Stand 300/20 € | Nur −50 € auf A: 250/−30 €; spätere +100 € ergeben 70 €. Wechsel zu B ändert Herkunft nicht. |
| Günstiger/Löschen/gebundener Nullmonat | Positive Differenz; Überschuss mindestens null; Übererfüllung sichtbar. |
| Fehlender Nachweis/verbrauchtes Ziel | Genau diesen Monat nach resultierender Mutation historisch erstmals schließen; verbrauchte Bindung erhalten, keine Umleitung. |
| Inaktiv/vor Aktivierung/offener Monat/gleicher Betrag | Normale Ausgabenregeln; keine Monatswirkung, auch bei Namensänderung. |
| Grenze/Gatesperre/Commitfehler | Gesamter Rollback einschließlich Ausgabe/Löschung und Marker; bekannte 409 sicher, unbestätigte Fehler ausdrücklich unbestätigt. |
| Wiederholung/Konkurrenz | Keine doppelte Differenz; Löschwiederholung neutrale 404; tatsächliche Sperrreihenfolge bestimmt Fortschritt. |

</frozen-after-approval>

## Code Map

Java-Pfade unter `backend/src/main/java/de/linus/tnbp/`, Testpfade unter `backend/src/test/java/de/linus/tnbp/`.

- `budget/Budgets.java`, `savingsgoals/SavingsGoals.java`: historische Budgetprojektion und `applyDifference` wiederverwenden.
- `frontend/src/app/app.routes.ts`, `frontend/src/app/month/month-summary.ts`, `frontend/src/app/savings-goals/savings-goals.ts`: Routen-Neuerzeugung lädt konsistente Ansichten; Antwort-/Entwurfsschranken erhalten.

## Tasks & Acceptance

**Execution:** Reihenfolge einhalten; Prüfläufe sequenziell.

- [x] `api-contract/v2/openapi.yaml`: PUT/DELETE-Erfolg als gemeinsamen Commit konkretisieren; 409 `AMOUNT_LIMIT_EXCEEDED`/`FEATURE_NOT_AVAILABLE` vor Verbrauchern definieren; Erfolgskörper erhalten, Clients generieren.
- [x] `backend/src/main/resources/db/migration/V15__monthly_surplus_correction.sql`, `deploy/provision-finance-grants.sql`, `access/DatabaseRoleVerifier.java`: minimale Änderungsrechte für `surplus_cents`/`consumed` ergänzen, Bestand/Identitäten bewahren.
- [x] `expenses/Expenses.java`: eigenen Einzelzugang unter bestehendem Kontext ergänzen; `finance/FinanceApplication.java`: alten Zustand lesen, tatsächliche Korrekturpflicht bestimmen, mutieren und ausschließlich Herkunftsmonat koordinieren; vorhandenen Erstabschluss/Differenzbefehl nutzen. Erforderliche gesperrte Korrektur geschlossen ablehnen.
- [x] `monthlysurplus/MonthlySurplus.java`, `monthlysurplus/MonthRecordRepository.java`: eigene Nachweisprojektion/-korrektur, sichere Ersatzsumme und Verbrauch implementieren; Zielbindung bewahren.
- [x] `finance/http/ExpenseV2Errors.java`: bekannte Korrekturfehler/no-store abbilden; neutrale Fehler/Logs erhalten.
- [x] `frontend/src/app/expenses/expenses.ts`: gemeinsame Hinweise/Status und sichere 409 ergänzen; bestehende Unsicherheits-/Dialog-/Sitzungsschranken nutzen. Rückkehr-Neuladen nachweisen; belegte Lücken obiger Ansichten korrigieren.
- [x] `monthlysurplus/MonthlySurplusTest.java`, neue `monthlysurplus/MonthlyCorrectionIT.java`: Matrix/AC-12 mit PostgreSQL, zwei Konten, HTTP, Wiederholung, beiden Sperrreihenfolgen und Monatsgrenzwartezeit prüfen; Rollback nach bereits ausgeführtem PUT/DELETE samt Marker beweisen.
- [x] `finance/FinanceCoordinationIT.java`, `finance/FinanceMigrationIT.java`, `access/RegistrationIT.java`, `monthlysurplus/MonthlyPendingIT.java`, `monthlysurplus/MonthlySelectionIT.java`: gemeinsame Verbindung/Zeitpunkt, RLS/Rechte und frische/befüllte V14→V15-Migration prüfen; `versions/ReleaseTransitionIT.java`, `versions/AdministrativeSerializationIT.java`: synthetische V15 nach V16 verschieben.
- [x] `access/MonthlyAutomationE2eServer.java`, `frontend/e2e/monthly-automation.spec.ts`, `frontend/e2e/expense-mutations.spec.ts`: echte Korrekturen, frische Folgeansichten, bekannte/unbekannte Fehler, Entwürfe/Offline/späte Antworten und vier UX-Größen einschließlich 200 % prüfen. `README.md`, `_bmad-output/implementation-artifacts/sprint-status.yaml`: Nachweise/Freigabegrenzen aktualisieren.

**Acceptance Criteria:**

- Angenommen echte Kontokontexte, wenn AC-1–8/12 ausgeführt werden, dann bestehen Matrix, Isolation, Serialisierung und vollständiger Commit/Rollback ohne Fremdzugriff.
- Angenommen HTTPS in allen vier UX-Größen, wenn AC-9–12 ausgeführt werden, dann bestehen gemeinsame Bestätigung, frische Werte, tatsächliche signierte Darstellung sowie Tastatur/Fokus/Kontrast/Reflow und Sitzungsgrenzen.

## Implementation Notes

- `FinanceApplication` liest eigene Ausgabe und Aktivierungsgrenze nach der gemeinsamen Kontosperre. Nur tatsächliche historische Geldmutationen koordinieren den Herkunftsmonat; die Ausgabenmutation erfolgt vor den resultierenden Quellprojektionen. Eine gesperrte notwendige Korrektur verwirft auch den bereits ausgeführten Ausgabenschreibzugriff.
- `monthlysurplus` liefert den eigenen Nachweis und prüft die vollständige Ersatzsumme exakt mit `BigDecimal`. Korrektur verändert ausschließlich Herkunftsbetrag und monotonen Verbrauch; Ziel-ID und Herkunft bleiben erhalten. Fehlende Nachweise verwenden den vorhandenen Erstabschluss, vorhandene Bindungen den öffentlichen Zieldifferenzbefehl.
- V15 ergänzt ausschließlich Spaltenrechte für `surplus_cents` und `consumed`. Wiederholbare Provisionierung und Startprüfung verlangen diese Rechte, schließen Herkunftsänderung und Tabellen-UPDATE/DELETE weiterhin aus. Synthetische Folgemigrationen der Versionsprüfungen verwenden V16.
- Die vorhandene Routenneuerzeugung lädt Monat und gemeinsame Sparzielübersicht bereits neu und entkräftet Antworten zerstörter Ansichten; hierfür ist kein zusätzlicher Zustandscache nötig. Ausgaben erläutern die gemeinsame Wirkung und behandeln ausschließlich die vertraglich bekannten 409-Codes als sicheren Fehlschlag.

## Spec Change Log

## Review Triage Log

Alle drei Ebenen wurden vor der Einordnung vollständig eingesammelt. Grundlage: `/tmp/story44-review-20261113.patch`, 105579 Byte; die separate Spezifikation blieb Blind-/Verifikationsprüfung vorenthalten. Randfallprüfung meldete keine Befunde. Jeder Befund erhält zunächst ein eigenes Urteil.

| Befund | Urteil und geprüfte Evidenz | Behandlung |
| --- | --- | --- |
| B1: Beim Bereichswechsel vor Commit kann die Zielübersicht alt bleiben | medium: `ExpenseOperations` meldet den Abschluss nur im eigenen Feature; die Antwort einer zerstörten Ansicht wird verworfen. Derselbe Ablauf steht bereits unverändert im Basisstand, einschließlich fehlender Aktualisierung einer während eines Ausgaben-PUT geöffneten Monatsansicht. AC-10 dieser Story verlangt das Neuladen nach bestätigtem/geklärtem Ausgang; dieser Pfad ist belegt. Die weitergehende automatische Aktualisierung nach Verlassen während laufender Mutation ist ein bestehendes bereichsübergreifendes Problem. | defer; kein Eingriff in Sitzungs-/Entwurfs- und Antwortgrenzen dieser Story |
| B2: Ersatz einer vorhandenen Vormerkung über Gesamtgrenze fehlt als IT | medium: Der vorhandene HTTP-Grenzfall legt nur andere Monatsnachweise an; für Oktober läuft Erstabschluss statt `correct`. Der direkte Unit-Test beweist die Formel, aber nicht den gesamten Rollback dieses Ersatzpfads. | patch: bestehenden Grenztest um vorhandenen Herkunftsnachweis erweitern |
| B3: Commitfehler nur bei Erstabschluss | medium: Der vorhandene Commitfehler beginnt ohne Oktobernachweis. Rücknahme bereits ersetzter Vormerkung beziehungsweise gebundenen Nachweises ist noch nicht direkt geprüft. | patch: bestehenden Commitfehler auf fehlend/offen/gebunden parametrisieren |
| B4: Bestehende ungebrauchte Bindung nach Zielentfall fehlt | medium: Fehlendes Ziel wird nur vor Erstabschluss geprüft; der andere Fall beginnt bereits verbraucht mit lebendem Ziel. Der neue Erkennungspfad einer vorhandenen ungebrauchten Bindung ist damit ungesichert. | patch; nach Einzelurteil mit V1 gruppiert |
| B5: Zwei Ausgabenkorrekturen überlappen nicht gezielt | medium: Die Sperre ist mit manuellem Ersatz und Auswahl belegt; zwei tatsächliche Ausgabenmutationen lesen jedoch beide Monatsbasis und Nachweis neu. Dafür fehlt eine direkte Überlappungsprüfung. | patch: PUT/PUT und PUT/DELETE mit nachgewiesenem Sperrwarten |
| B6: Korrekturgate nur über Bereitschaft geprüft | medium: `READY.open=false` schließt vor `lockMonthlyAutomation`; ein zwischen Start und Mutation unpassender Stilllegungsbeleg wird für PUT/DELETE nicht geprüft. | patch: Bereitschaft offen, abweichender Versionsbeleg, neutrale 409 und vollständiger Erhalt |
| B7: Rücknahme positiver Anrechnung bis null fehlt | medium: Vorhandene Differenztests prüfen 200→150 und 0→positiv. Vollständige Rücknahme bei null/negativem Rest samt Wiederholung ist ein alltäglicher, bislang nicht direkt geprüfter Korrekturfall. | patch: 200→0 bei null/negativem Rest prüfen |
| B8: Ausgenommene Löschungen nur indirekt belegt | medium: Der neue Ausschlusstest mutiert ausschließlich per PUT. Aktives Konto mit älterem/voraktiviertem beziehungsweise offenem Monat benötigt auch bei geschlossenem Gate den normalen DELETE-Pfad. | patch: inaktiv/vor Aktivierung/offen per DELETE prüfen |
| B9: Erfolgreiche Korrektur exakt auf signierte Grenzwerte fehlt als IT | low: Der direkte Integrationsfall fehlt, aber `SavingsGoals.applyDifference` verwendet unverändert `Money.exact`; `MoneyTest` prüft bereits +MAX und −MAX einschließlich ihrer Zulässigkeit. Es gibt keine neue gesonderte Grenzbedingung im Korrekturpfad. | verworfen gemäß Low-Regel: seltene Endpunktwerte und zusätzliche redundante Fixtures ohne neue ungeprüfte Grenzentscheidung |
| B10: Echter Grenzfehler mit manueller Reparatur und erhaltenem Ausgabenentwurf fehlt | medium: Browser-409-Korrekturtests mocken die Grenze; reale Grenzreparatur prüft bisher nur Zielauswahl. Die neue Zusage zur erreichbaren manuellen Fortschrittspflege sollte mit tatsächlicher Korrekturgrenze und anschließender Wiederholung belegt sein. | patch: echten Grenzfehler, Reparatur im zweiten Tab und erneutes Speichern prüfen |
| V1: Regression bei gelöschtem Ziel einer bestehenden ungebrauchten Bindung ungesichert | medium: Vorverifizierte Prüflücke; `previous.consumed()` allein statt fehlender-Ziel-Erkennung lässt die bisherigen Tests unverändert bestehen, würde aber eine historische Ausgabe nach Zielentfall blockieren. | patch; nach Einzelurteil mit B4 gruppiert |

Acht Korrekturgruppen betreffen ausschließlich zusätzliche konkrete Nachweise vorhandener Regeln; kein neuer öffentlicher Zugang und keine neue Zustandsregel. Eine bestehende allgemeine Aktualisierungslücke wird zurückgestellt. Keine Absichts- oder Planlücke. Nachprüfungen stehen noch aus.

Die acht angenommenen Korrekturgruppen sind umgesetzt. Ausschließlich `MonthlyCorrectionIT.java` und `monthly-automation.spec.ts` wurden dafür ergänzt; Produktionscode und Testserveroberflächen blieben unverändert. Die gezielte Nachprüfung bestand mit 44 Korrektur-Integrationstests und dem neuen echten Browser-Reparaturfall. Der vollständige finale Prüfablauf läuft noch. Kein weiterer Reviewdurchgang ist für diese eng begrenzten Nachweiskorrekturen erforderlich.

## Verification

`./scripts/check-contract.sh`; `./backend/mvnw -f backend/pom.xml verify`; `python3 -m unittest discover -s scripts/tests -v`; `npm --prefix frontend run e2e`; `npm --prefix frontend run e2e:automation`; `npm --prefix frontend run e2e:transition`. Erwartung: alle erfolgreich, öffentliches Gesamtgate geschlossen.


Nachweise vom 09.11.2026; Browser-Versionsübergang am 13.11.2026 abgeschlossen. Alle Ergebnisse wurden anhand der Protokolle und des vollständigen Diffs selbst geprüft. Die ursprünglichen Zwischenläufe bleiben als Diagnose erhalten; maßgeblich sind die erfolgreichen Nachprüfungen der korrigierten Fälle.

| Prüfung | Ergebnis und Protokoll |
| --- | --- |
| Vertrag | Beide Versionen gültig/kompatibel, generierte Java-/Angular-Schnittstellen und Release-SPA gebaut: [Vertragscheck](../../.local/story-4.4-verification/check-contract.log). |
| Backend | 362 bestehende Integrationstests im [Gesamtlauf](../../.local/story-4.4-verification/backend-full-initial.log) erfolgreich; nur drei inzwischen korrigierte Testdaten-/Assertionsfehler in der neuen Klasse. Anschließend 25 neue Korrekturtests und 49 Unit-/Architekturtests vollständig erfolgreich: [bereinigter verify-Nachlauf](../../.local/story-4.4-verification/backend-correction.log). Insgesamt 387 erfolgreiche Integrationstests. Java-Produktionscode, V15 und Provisionierung blieben zwischen diesen Läufen unverändert. |
| Python | 19 erfolgreich: [Protokoll](../../.local/story-4.4-verification/python.log). |
| Regulärer HTTPS-Browser | 220/222 im [Gesamtlauf](../../.local/story-4.4-verification/e2e-full-initial.log); danach alle 29 Ausgabenmutationsfälle erfolgreich: [Nachlauf](../../.local/story-4.4-verification/e2e-expense-mutations.log). Korrigiert wurden eine neue Testerwartung und die mobile Verengung der Schaltflächen bei 320 Pixeln/200 % Text. Damit alle 222 Fälle abgedeckt. |
| Automatik-HTTPS | 68/70 im [Gesamtlauf](../../.local/story-4.4-verification/e2e-automation.log); nach Korrektur des Kontowechsel-Testaufbaus und nachweislicher 200-%-Textgröße alle sechs betroffenen Fälle erfolgreich: [finaler Nachlauf](../../.local/story-4.4-verification/e2e-automation-final.log). Damit alle 70 Fälle abgedeckt. |
| Browser-Versionsübergang | 5 erfolgreich, einschließlich finalem Release-Build, unverändertem Altbundle und realer Stilllegung: [Protokoll](../../.local/story-4.4-verification/e2e-transition.log). |

Die testinternen Bereitschafts-, Uhr- und Commitfehlersteuerungen bleiben ausschließlich im Testcode. Öffentliche Gesamtfreigabe weiterhin geschlossen. Keine Produktionsfreigabe, kein GitHub-Abgleich.

| Eingefrorene Matrixzeile | Ausgeführter Nachweis |
| --- | --- |
| Offener Oktober/November, Null/ohne Budget | `MonthlyCorrectionIT.offeneOktoberkorrekturErsetztNurDiesenMonatUndUebernimmtSpaeterEinmalig250Euro`, `offeneNullUndOhneBudgetMonateBleibenVerschieden`; echte HTTPS-Folgeansichten. |
| Differenz am aktuellen A-Stand, −30/70 | Beide Parameter von `differenzAmAktuellenStandBleibtAnAUndKannNegativWerden`; HTTPS in vier Größen. |
| Günstiger/Löschen/Nullmonat | `positiveDifferenzLoeschungWiederholungUndGebundenerNullmonat`; HTTPS-Löschung mit Zielübererfüllung. |
| Fehlender Nachweis/Verbrauch | Beide Parameter von `fehlenderErstnachweisVerwendetResultierendeBasisUndHistorischeAuswahl` sowie `bestehendeVerbrauchteBindungBleibtVerbrauchtAuchBeiNochVorhandenemZiel`. |
| Keine Korrekturpflicht | `keineAktivierungVorAktivierungOffenerMonatUndGleicherBetragHabenKeineMonatswirkung`. |
| Grenze/Gate/Commitfehler | Je PUT/DELETE: `grenzeNachAusgabenmutationRolltAusgabeNachweisUndMarkerZurueck`, `signierteFortschrittsgrenzenVerwerfenDieSchonAusgefuehrteAusgabenmutation`, `gesperrteErforderlicheKorrekturRolltBereitsAusgefuehrteMutationSicherZurueck`, `echterCommitfehlerNachAusgabeNachweisZielUndMarkerBestaetigtGarNichts`; sichere/unbekannte 409 und echte Commitfehler im Browser. |
| Wiederholung/Konkurrenz | Wiederholungen der Betrags-/Löschtests; beide Parameter von `manuellesErsetzenUndKorrekturWerdenInBeidenTatsaechlichenSperrreihenfolgenSerialisiert` und `auswahlUndKorrekturVerwendenInBeidenReihenfolgenDieFestgelegteHerkunft`. |

Zusätzlich nachgewiesen: zwei Konten, neutrale 404/401, fehlender/RLS-geschützter Kontext, Verbindungsbereinigung, genau ein Zeitpunkt nach Sperrwartezeit über Monatsgrenze sowie identischer physischer Commit von Ausgabe/Ziel/Nachweis/Marker. `FinanceCoordinationIT` wurde unverändert wiederverwendet; der neue Korrekturfall enthält den spezifischen Trigger-/Verbindungsnachweis. Die Migrationsprüfung belegt frische/befüllte V14→V15-Bestände und wiederholte Rechtebereitstellung.

Vier Viewports (320×568, 390×844, 768×1024, 1280×800), tatsächliche 200-%-Textgröße, Axe, Tastatur/Escape/Fokusschleife und sichtbarer/unverdeckter Fokus sind geprüft. Die sicheren Fehlerzustände messen explizit 44-Pixel-Aktionen, 48-Pixel-Geldfelder sowie Text-/Kontroll-/Fokuskontrast. Der finale [320-Pixel-Dialog bei 200 %](../../.local/story-4.4-verification/final-320-200-dialog.png) wurde zusätzlich visuell geprüft. Offene Entwürfe, Offline, späte Antworten und realer Kontowechsel über einen zweiten Tab bleiben geschützt.


### Abschließender Gesamtnachweis nach Review, 13.11.2026

Alle sechs Aufrufe liefen nach sämtlichen Reviewergänzungen vollständig und sequenziell erfolgreich. Diese finalen Protokolle sind maßgeblich; die vorherigen Zwischenläufe bleiben ausschließlich als Diagnosehistorie erhalten.

| Aufruf | Finales Ergebnis | Protokoll |
| --- | --- | --- |
| `./scripts/check-contract.sh` | v1/v2 gültig und kompatibel; generierte Java-/Angular-Schnittstellen und Release-SPA gebaut | [Vertrag](../../.local/story-4.4-verification/review-final/contract.log) |
| `./backend/mvnw -f backend/pom.xml verify` | 49 Unit-/Architekturtests und 406 echte PostgreSQL-Integrationstests, darunter alle 44 Korrekturfälle; keine Fehler/übersprungenen Tests | [Backend](../../.local/story-4.4-verification/review-final/backend.log) |
| `python3 -m unittest discover -s scripts/tests -v` | 19 erfolgreich | [Python](../../.local/story-4.4-verification/review-final/python.log) |
| `npm --prefix frontend run e2e` | 222 HTTPS-Browserfälle erfolgreich | [Regulärer Browser](../../.local/story-4.4-verification/review-final/e2e.log) |
| `npm --prefix frontend run e2e:automation` | 71 HTTPS-Automatikfälle erfolgreich | [Automatik](../../.local/story-4.4-verification/review-final/automation.log) |
| `npm --prefix frontend run e2e:transition` | 5 erfolgreich; finaler Release-Build, Altbundle und echter API-Wechsel | [Versionsübergang](../../.local/story-4.4-verification/review-final/transition.log) |

Insgesamt **772 erfolgreiche Tests**. SHA-256 des vollständigen Quelldiffs gegen `5eae9cd7a0ab81a16a503a803e6aa3da85e58962` ohne `_bmad-output/`: `fe2a7ab5a447436c22de14394c726aee7d3add9b86d54b54e055570fcbe8df59`. Vor und nach jedem der sechs Läufe identisch; [Ausführungsmanifest](../../.local/story-4.4-verification/review-final/results.json).

Die zusätzlichen Reviewnachweise prüfen vorhandene und fehlende Nachweise bei vollständigem Rollback, gelöschtes Ursprungsziel einer noch unverbrauchten Bindung, geänderten Stilllegungsbeleg, vollständige Überschussrücknahme, ausgenommene Löschungen und vier tatsächlich überlappende Ausgabenmutationen. Der echte Browser-Grenzfehler erhält Ausgabe und Entwurf; manuelle Fortschrittsreparatur im zweiten Tab und erneutes Speichern führen zum korrekten gemeinsamen Stand.

Alle angenommenen Reviewbefunde sind behoben und vollständig nachgeprüft. Ein bestehendes allgemeines Aktualisierungsproblem bei Bereichswechsel vor Mutationsabschluss ist mit Quelle/Evidenz in `deferred-work.md` dokumentiert (B1); es betrifft nicht das abgenommene Öffnen nach bestätigtem/geklärtem Ausgang. Kein offener Patch. Die freigegebene Absicht blieb unverändert. Öffentliche Gesamtfreigabe bleibt geschlossen; kein Produktionsrollout und kein GitHub-Abgleich.
