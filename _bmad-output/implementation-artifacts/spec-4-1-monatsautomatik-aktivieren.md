---
title: 'Story 4.1: Monatsautomatik ab dem Erstmonat aktivieren'
type: 'feature'
created: '2026-11-06'
status: 'done'
route: 'dispatch'
story_key: '4-1-monatsautomatik-ausdrücklich-ab-dem-ersten-aktivierungsmonat'
baseline_commit: '1fd6e2076f74c34f56af7f6351131c2179931c62'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/epics.md'
---

<frozen-after-approval reason="Nutzerabsicht; Änderungen nur nach erneuter Abstimmung">

## Intent

**Problem:** Der eigene unveränderliche Aktivierungsbeginn fehlt.

**Approach:** Story 4.1/AC-1–10 aus `epics.md` vollständig umsetzen: Aktivierung, v2-Vertrag und Abschnitt in Sparziele. Positive Fälle intern mit echter Datenbank prüfen; öffentliche Gesamtfreigabe bleibt geschlossen.

## Boundaries & Constraints

**Always:** JWT-Konto, Modulbesitz/Filter/FORCE-RLS, Kontosperre, Zeitpunkt nach Sperrerwerb, äußerer Commit. Finanzwerte/Kernfunktionen erhalten. Ohne Budget/Ziel aktivierbar; gesamter Erstmonat unveränderlich.

**Never:** V1/alte Migrationen ändern; Monatsnachweise, Vormerkungen, Auswahlhistorie, Worker oder Deaktivierung vorwegnehmen. Kein öffentlicher Freigabeschalter, keine automatische Kontoaktivierung oder Produktionsfreigabe.

## I/O & Edge-Case Matrix

| Zustand | Erwartung |
| --- | --- |
| GET ohne Aktivierung | `active:false`, `activationMonth:null`; keine Anlage. |
| Zulässiger POST | Ohne fachliche Eingaben: `200`, gespeicherter Monatserster nach Commit; Wiederholung/Parallelität erhalten Erstmonat. |
| Warten über Monatsgrenze | Monat nach Sperrerwerb; frühere Daten ohne Wirkung. |
| Geschlossenes Gate | Capability false, POST 409 `FEATURE_NOT_AVAILABLE`; GET erhält gespeicherten Status. Fehlender/ungültiger Zugang: 401, Cookies reichen nicht. |
| Fehler oder Bestätigung fehlt | Keine Erfolgsmeldung; vor Wiederholung tatsächlichen Zustand laden. Offline nichts senden, Doppelsenden sperren. |
| Sitzungs-/Kontowechsel | Persönlichen Zustand verwerfen, späte Antworten entkräften. Fehlendes/ungültiges Capabilityfeld öffnet nichts. |

</frozen-after-approval>

## Code Map

Java-Pfade relativ zu `backend/src/main/java/de/linus/tnbp/`, Prüfpfade analog unter `backend/src/test/java/de/linus/tnbp/`.

- `shared/FinanceTransactions.java`, `FinanceContext.java`: Sperre, Uhr, Kontext und Commit wiederverwenden; keine Modultransaktion/-uhr.
- `shared/ApiVersionState.java`: frischen Stilllegungsbeleg/Versionssperre wiederverwenden; signierter Funktionsschalter genügt nicht.
- `frontend/src/app/savings-goals/savings-goals.ts`: `accepts/clear`, Sequenzen und `SavingsOperations` wiederverwenden; Ein-Schlüssel-Capabilityprüfung erweitern.
- `finance/FinanceCoordinationIT.java`, `savingsgoals/SignedProgressIT.java`: echte Sperr-/Commit-/Versionsprüfungen als Vorbild.

## Tasks & Acceptance

**Execution:** Reihenfolge einhalten; gemeinsame Build-/Browserartefakte sequenziell prüfen.

- [x] `api-contract/v2/openapi.yaml`: GET/POST `/monthly-surplus/activation`, Zustand, Fehler, Bearer/no-store sowie optionales `monthlyAutomationAvailable` vor Verbrauchern definieren; Generatoren nutzen.
- [x] `backend/src/main/resources/db/migration/V12__monthly_surplus_activation.sql`, `deploy/provision-finance-grants.sql`: nur Aktivierung mit eindeutiger Konto-ID/Monatserstem, FORCE-RLS, SELECT/INSERT und nötiger technischer Versionsprüfung ergänzen; UPDATE/DELETE ausschließen.
- [x] `monthlysurplus/MonthlySurplus.java`, `monthlysurplus/ActivationRepository.java`: schmale öffentliche Fassade und eigenen gefilterten Datenzugriff ergänzen.
- [x] `shared/ApiVersionState.java`, `finance/MonthlyAutomationReadiness.java`, `finance/FinanceApplication.java`: geschlossenes Gesamtgate ohne Produktkonfiguration, frische unabhängige Versionsprüfung und Aktivierungskoordination ergänzen; allein Tests ersetzen Gesamtbereitschaft.
- [x] `finance/http/MonthlySurplusV2Controller.java`, `finance/http/MonthlySurplusV2Errors.java`, `finance/http/CapabilitiesV2Controller.java`, `access/AccessConfiguration.java`, `access/DatabaseRoleVerifier.java`: HTTP, neutrale Fehler und minimale Authentifizierungs-/Rollenrechte integrieren.
- [x] `frontend/src/app/savings-goals/savings-goals.ts`, `frontend/src/app/savings-goals/monthly-automation.ts`, `frontend/src/styles.css`: eigenständigen Abschnitt auch ohne Ziele ergänzen; Zustände/Freigabe getrennt, persistierten Start bei Sperre zeigen, unbekannten Ausgang über Navigation bewahren. Kalenderformat ohne Zeitumrechnung; keine späteren Geldwerte erfinden.
- [x] `monthlysurplus/MonthlySurplusIT.java`, `finance/FinanceMigrationIT.java`, `finance/FinanceCoordinationIT.java`, `finance/ArchitectureTest.java`, `versions/ApiVersionStateIT.java`: Matrix/AC-10 mit echtem PostgreSQL prüfen; bisherige Erwartung fehlenden Schemas anpassen.
- [x] `backend/src/test/java/de/linus/tnbp/access/MonthlyAutomationE2eServer.java`, `frontend/playwright.automation.config.ts`, `frontend/e2e/monthly-automation.spec.ts`: HTTPS-Positivkontext mit echter Versionsbarriere, testinterner Bereitschaft/steuerbarer Uhr; reguläre Sperre und vollständige Browsermatrix AC-8–10 prüfen.
- [x] `README.md`, `_bmad-output/implementation-artifacts/sprint-status.yaml`: Prüfaufruf, Freigabegrenze und tatsächlichen Storystand dokumentieren; keinen GitHub-Abgleich starten.

**Acceptance Criteria:**

- Angenommen Bestands-/Neukonten, wenn Migration/Aktivierung laufen, dann bestehen AC-1–6/10 ohne Finanzwirkung/Gesamtfreigabe.
- Angenommen Sparziele mit/ohne Ziele, wenn Bedien-/Fehler-/Sitzungsfälle laufen, dann bestehen AC-7–10.

## Implementation Notes

- `monthly_surplus.activations` ist der einzige neue fachliche Datensatz. Die Fassade verwendet den gebundenen Finanzkontext; nur die äußere Anwendung erwirbt Kontosperre, Kalenderkontext und Versionssperre und bestätigt den Commit. Aktivierung setzt keinen Geldwirkungsmarker.
- Das Gesamtgate liefert im ausgelieferten Code weiterhin `false`, ohne Produktkonfiguration. Die unabhängige SQL-Prüfung vergleicht sämtliche Bestandteile des frischen Stilllegungsbelegs und hält ihn bei Mutationen bis zum Commit gesperrt. Der administrative Fingerprint berücksichtigt das neue Schema.
- Der Abschnitt in Sparziele hält Zustand und Verfügbarkeit getrennt. Vorgangsflags überleben Navigation ausschließlich im offenen Tab; ein unbestätigter Ausgang erfordert vor einer weiteren Mutation einen tatsächlichen GET. Sitzungswechsel entkräften alte Antworten. Ladeaktionen behalten mit `aria-disabled` und Handlerguards ihren Tastaturfokus.
- Der HTTPS-Positivkontext startet und beendet zunächst einen echten kompatiblen Release über `api-release.py retire`. Nur die Gesamtbereitschaft und Uhr werden danach im Testklassenpfad ersetzt; Webzugang, Runtime-Rolle, FORCE-RLS, frischer Versionsbeleg und Commit bleiben real. Die Teststeuerung ist nicht im Release-JAR enthalten.
- Bestehende Prozessfixtures verwenden für ihre synthetischen Folgemigrationen nun V13, da V12 fachlich belegt ist. Der Rollenfall gibt vom testweisen Migrator neu angelegte Objekte vor dem Cleanup an die reguläre Migratorrolle zurück.
- Der vorgegebene `npm --prefix frontend exec ... --config playwright.automation.config.ts` löst den Konfigurationspfad im Repository-Hauptverzeichnis auf. Der ausführbare, in README und CI hinterlegte Aufruf ist deshalb `npm --prefix frontend run e2e:automation`.
- Der reguläre Browserlauf deckte einen vorhandenen Fokuswettlauf im Ausgaben-Löschdialog auf: Der zusätzliche zweite Frame konnte die erste Tab-Navigation zurücksetzen. Der Dialog setzt seinen Anfangsfokus nun wie der Sparziel-Dialog direkt im Öffnungsframe. Der neue Offlinehinweis benennt gezielt die Aktivierung, getrennt vom vorhandenen Entwurfshinweis.

## Spec Change Log

## Review Triage Log

Alle drei Ebenen vollständig eingesammelt: Blind Hunter (B1–B11), Edge Case Hunter (keine Befunde), Verification Gap (V1/V2). Grundlage: `/tmp/tnbp41-implementation-htghrywt.patch`, 150456 Byte gegen den festgehaltenen Basiscommit. Jedes Urteil entstand vor der Gruppierung.

| Befund | Urteil und Evidenz | Behandlung |
| --- | --- | --- |
| B1: Testserver lässt bei Startfehlern Kindprozesse zurück | medium: Der Fehlerpfad beendet nur den kompatiblen Guard mit SIGKILL. Dessen Supervisor startet laut `api-release.py` in einer eigenen Session und wartet danach ohne Elternüberwachung auf die API. Der noch laufende Stilllegungsprozess wird ebenfalls nicht beendet; Folgeprüfungen können an belegten Ports scheitern. | patch: frühe lokale Ressourcenbereinigung, geordnetes Guardende und verbleibende Kinder beenden/abwarten |
| B2: HTTP-Startprobe kann trotz Frist unbegrenzt warten | low: Das synchrone `HttpClient.send()` besitzt weder Verbindungs- noch Requestfrist; ein akzeptierender, nicht antwortender Listener erreicht die äußere Fristprüfung nicht. | patch: direkte begrenzte HTTP-Fristen |
| B3: Vertrag erlaubt widersprüchliche Status-/Monatkombinationen | low: Die Schemaform drückt die dokumentierte Korrelation nicht maschinenprüfbar aus. Der einzige reale Produzent leitet `active` unmittelbar aus dem vorhandenen Monat ab, der Browser verwirft beide Widersprüche. Eine zusätzliche Schemaunion würde generierte öffentliche Typen ändern, ohne einen fehlerhaften erreichbaren Produzenten zu korrigieren. | verworfen: geringe Vertragspräzisierung mit zusätzlicher öffentlicher Komplexität |
| B4: Tests prüfen vor Verarbeitung später Antworten | medium: Nach `held.release()` sind mehrere Erwartungen bereits im Zustand des neuen Kontos erfüllt; die späte Antwort muss noch nicht verarbeitet sein. Auch die Altkomponente kann bereits vor deren Ankunft leer sein. | patch: Antwortende und anschließende Browserverarbeitung vor Isolationsassertionen abwarten |
| B5: Ablaufprüfung ruft nur Sitzungsende direkt auf | medium: Der neue Fall verwendet `session.end()` und beweist damit keinen tatsächlichen Timerablauf mit ausstehenden Automatikantworten. Bestehende Timerfälle betreffen andere gehaltene Antworten. | patch: echten vorhandenen Ablauftimer unter Browser-Testuhr mit zurückgehaltenem Refresh verwenden |
| B6: Aktivierung mit gefüllten Finanzdaten fehlt | medium: Die Erhaltungsprüfung enthält nur eine Ausgabe; Budget und Ziele sind ausdrücklich leer. Der Migrationssnapshot ersetzt keinen Aktivierungsfall mit vorhandenen Budget-/Ziel-/Fortschrittswerten. | patch: vorhandene Finanzwerte bei beiden Konten vor/nach Aktivierung vergleichen |
| B7: echter GET-Fehleradapter nicht ausgeführt | low: Der echte Fehlerfall läuft über POST/Commit, der Browser-GET-Fehler ist eine simulierte Antwort. Eine echte fehlgeschlagene Leseoperation ist nicht nachgewiesen. | patch: engen GET-Datenbankfehler mit neutralem Fehler/no-store und Wiederherstellung prüfen |
| B8: ungültige erfolgreiche Aktivierungsantwort fehlt | medium: Die neue Browsermatrix prüft abgebrochene Anfragen und Capabilitywerte, aber keinen widersprüchlichen 200-POST. | patch; mit V2 gruppiert |
| B9: INSERT ohne Kontokontext nicht geprüft | medium: Vorhandene Fälle belegen fehlenden Kontext beim SELECT und fremden Kontext beim INSERT; der ausdrücklich fehlende Schreibkontext wird nicht ausgeführt. | patch: direkte INSERT-Abweisung ohne `app.user_id` ergänzen |
| B10: zugängliche Sonderzustände nicht in Größenmatrix geprüft | medium: Die vier Größen/200-%-Fälle auditieren den verfügbaren Ausgangszustand und Erfolg, Fehler/Ungewissheit/Sperre/laufende Aktivierung nur andere Einzeltests. Kontroll-/Fokuskontrast wird dort nicht explizit gemessen. | patch: bestehende Größenmatrix um diese Zustände und konkrete Kontrastprüfung ergänzen |
| B11: Prüfevidenz nur in temporären Logs und ohne finalen Quellhash | low: Prüfbefehle, Basiscommit, korrigierte Wiederholungen und Matrixzuordnung sind bereits dokumentiert; der Hinweis betrifft vor allem die Darstellung/Aufbewahrung im vorliegenden Spec. Der nun folgende vollständige Abschlusslauf prüft denselben endgültigen Arbeitsstand. | verworfen gemäß Workflowregel für Befunde, deren Korrektur die Build-Spec selbst bearbeiten würde |
| V1: Start mit überzähligen Aktivierungsrechten ungetestet | medium: Vorverifizierte Prüflücke: `RegistrationIT` startet bei bestehenden unsicheren Rechten, aber nicht bei Aktivierungsrechten; `FinanceMigrationIT` repariert diese vor der Prüfung. | patch: vorhandene Startabwehrmatrix um Tabellen-/PUBLIC-Spaltenrechte ergänzen |
| V2: inaktiver 200-POST kann ohne Regressionstest Erfolg vortäuschen | medium: Vorverifizierte Prüflücke: Entfernen des `!response.body.active`-Guards würde die bestehenden Fälle bestehen lassen. | patch; mit B8 gruppiert |

Die angenommenen Korrekturen betreffen lokale Testhelfer und Regressionstests; sie benötigen keine neue öffentliche Schnittstelle oder fachliche Zustandsgrenze. Keine Absichts- oder Planlücke, keine Zurückstellung.

Die gezielten Reviewkorrekturen sind abgeschlossen: Prozessbereinigung und HTTP-Fristen, ausgeführte zusätzliche Rechte-/Lese-/Schreib-/Bestandsfälle, bestätigtes Ende später Antworten, echter Ablauftimer, ungültige erfolgreiche POST-Antworten und erweiterte Zugänglichkeitszustände. Erfolgreich: ein Bereinigungstest, 34 Integrationstests, 26 Automatik-Browserfälle. Die erweiterte 320-Pixel-/200-%-Prüfung zeigte zusätzlich einen überhohen Aktivierungsbutton; die lokalen horizontalen Innenabstände wurden korrigiert und alle vier Größen erneut erfolgreich geprüft. Abschließend werden sämtliche Prüfaufrufe am selben korrigierten Stand erneut ausgeführt.

## Design Notes

Keine Absichtslücken. Migration bleibt nach Ausführung aufgezeichnet; kein Deployment beauftragt. Neue Schnittstellen: Modulfassade, zwei HTTP-Operationen, Capabilityfeld. Aktivierung markiert keine Monatsgeldwirkung. Story 3.8 ist auf main samt fertiger Spec; abweichenden Sprintstatus nicht umschreiben.

## Verification

Erwartung: alle Prüfungen erfolgreich.

- `./scripts/check-contract.sh`
- `./backend/mvnw -f backend/pom.xml verify`
- `python3 -m unittest discover -s scripts/tests -v`
- `npm --prefix frontend run e2e`
- `npm --prefix frontend run e2e:automation`

### Abschließender Gesamtlauf nach Review vom 07.11.2026

Alle Prüfungen wurden nach den Reviewkorrekturen am unveränderten Quellstand erneut ausgeführt. Keine offenen Korrekturen oder Zurückstellungen. Die Teststeuerung ist nach Prüfung des gebauten JARs nicht im Release enthalten; das ausgelieferte Gesamtgate bleibt geschlossen.

Der geprüfte Quellstand wurde vor und nach den Läufen verglichen. SHA-256 des Git-Diffs gegen `baseline_commit` ohne `_bmad-output/`: `4770c66926d812e2804fe84c371e1ae9d6bf32ae20a34c4e613fd0db2b8e2663`.

| Aufruf | Tatsächliches Ergebnis | Log |
| --- | --- | --- |
| `./scripts/check-contract.sh` | Beide Vertragsversionen kompatibel; generierte Java-/Angular-Schnittstellen und Release-SPA erfolgreich gebaut | `/tmp/story41-final-contract.log` |
| `./backend/mvnw -f backend/pom.xml verify` | 45 Unit-Tests und 325 Integrationstests, jeweils keine Fehler/übersprungenen Tests; vollständiger Gesamtlauf ohne Ausschlüsse erfolgreich | `/tmp/story41-final-backend.log` |
| `python3 -m unittest discover -s scripts/tests -v` | 19 erfolgreich | `/tmp/story41-final-python.log` |
| `npm --prefix frontend run e2e` | 212 erfolgreich | `/tmp/story41-final-browser-regular.log` |
| `npm --prefix frontend run e2e:automation` | 26 erfolgreich, einschließlich Reviewergänzungen und sämtlicher Zustände an vier Größen mit 200 % Text | `/tmp/story41-final-browser-automation.log` |

### Vorprüfungen und erste Umsetzung vom 07.11.2026

- Vertrag und Release-Build: beide Hauptversionen validiert und kompatibel, alle generierten Java-/Angular-Verbraucher kompiliert, statische SPA erfolgreich gebaut. Log: `/tmp/story41-contract.log`.

- PostgreSQL/Backend: 44 Unit-Tests und 244 Integrationstests im breiten erfolgreichen Wiederholungslauf; zusätzlich fünf gezielt erneut ausgeführte Prozesswechselmethoden erfolgreich. Der vollständige Erstlauf umfasste 320 Integrationstests und fand vier an V11 gebundene Fixturefehler. Diese sind korrigiert und nachgeprüft; zwei zusätzliche Migrationsfälle und ein zusätzlicher HTTP-Kontextfall erhöhen den abgedeckten Gesamtbestand auf 323 unterschiedliche Integrationstests. Die 59 Prozesswechsel- und 20 administrativen Serialisierungsfälle des Erstlaufs wurden einschließlich sämtlicher zuvor fehlgeschlagener Fälle erfolgreich nachgewiesen. Logs: `/tmp/story41-backend.log`, `/tmp/story41-backend-final.log`, `/tmp/story41-transitions-final.log`.
- Reguläre HTTPS-Bedienung: **212/212 erfolgreich**, einschließlich aller bisherigen manuellen Kernfunktionen und direktem `409 FEATURE_NOT_AVAILABLE` ohne Aktivierung im Auslieferungszustand. Log: `/tmp/story41-browser-regular.log`.
- Testinterner HTTPS-Positivkontext am endgültigen UI-Stand: **17/17 erfolgreich**, einschließlich tatsächlichem Aktivierungscommit und Monatswechsel, unbekanntem Ausgang mit/ohne Commit, Navigation, späten Antworten nach Sitzungs-/Kontowechsel sowie Tastatur/Axe/200-%-Text an allen vier Prüfgrößen. Log: `/tmp/story41-browser-automation.log`.
- Python: **19/19 erfolgreich**. Log: `/tmp/story41-python.log`.
- Das paketierte Release enthält das geschlossene Gesamtgate, aber keine `MonthlyAutomationE2eServer`-Klasse und keine testinterne Uhr oder Bereitschaftssteuerung. V1-Vertrag und bestehende Migrationen bleiben unverändert; keine Bereitstellung und kein GitHub-Abgleich.

| Matrixzeile | Ausgeführte Abdeckung |
| --- | --- |
| GET ohne Aktivierung | `MonthlySurplusIT.getIstReinLesendUndNurBearerAutorisiert`; regulärer Browserfall. |
| Zulässiger POST, Wiederholung/Parallelität | `MonthlySurplusIT.oktoberstartOhneBudgetOderZielAendertKeineBestandswerteUndBleibtImNovember`, `paralleleErstaufrufeUndBeideKontenHabenJeGenauEinenEigenenStart`; echter HTTPS-Commit. |
| Sperrwartezeit über Monatsgrenze | `MonthlySurplusIT.monatUndGenauEinZeitpunktWerdenErstNachKontosperreBestimmt`; beide Browserfälle zum unbestätigten Ausgang über Monatswechsel. |
| Geschlossenes Gate und Zugang | `SignedProgressIT.capabilityIstGeschuetztReinLesendUndFailClosedBeiVeraltetemBelegOderSchema`, `MonthlySurplusIT.gesamtgateBleibtOhneProduktionsschalterGeschlossenUndGespeicherterStartLesbar`, `getIstReinLesendUndNurBearerAutorisiert`; regulärer Browserfall und Capabilitymatrix. |
| Fehler, fehlende Bestätigung, Offline/Doppelsenden | `MonthlySurplusIT.fehlerVorCommitUndEchterCommitfehlerBestaetigenKeineAktivierung`; Browserfälle mit/ohne Commit, Offline/Doppelsenden und erhaltenem Navigationsschutz. |
| Sitzungs-/Kontowechsel, ungültige Capability | Vier Browserfälle zu späten Aktivierungs-/Status-/Capabilityantworten; Capabilityfelder-Matrix und Prüfung geleerter Altkomponenten. |
