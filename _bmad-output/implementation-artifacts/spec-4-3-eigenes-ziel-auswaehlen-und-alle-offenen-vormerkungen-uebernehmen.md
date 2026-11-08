---
title: 'Story 4.3: Ziel auswählen und Vormerkungen übernehmen'
type: 'feature'
created: '2026-11-07'
status: 'done'
route: 'dispatch'
baseline_commit: '540e4c7f7ee459b461ec5d2fcb7f1991beeb5813'
story_key: '4-3-eigenes-ziel-auswählen-und-alle-offenen-vormerkungen-überneh'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/epics.md'
---

<frozen-after-approval reason="Nutzerabsicht; Änderungen nur nach erneuter Abstimmung">

## Intent

**Problem:** Ausdrückliche Zielauswahl und vollständige Vormerkungsübernahme fehlen.

**Approach:** Story 4.3/AC-1–12 aus `epics.md` vollständig umsetzen.

## Boundaries & Constraints

**Always:** Kontotrennung, Modulbesitz, Filter/FORCE-RLS, Kontosperre, ein Zeitpunkt/physischer Commit samt Marker; GET read-only REPEATABLE READ. Exakte Cent ±9007199254740991; manuelle Gesamteingabe unabhängig.

**Never:** Gesamtgate/v1/alte Migrationen ändern; Teilübernahme/Umleitung. Korrektur, Löschkoordination und Worker folgen später.

## I/O & Edge-Case Matrix

| Fall | Ergebnis |
| --- | --- |
| 200 € + 100 € offen; Ziel 50 € | 350 €/0 € offen, Herkunft bleibt; Wiederholung ohne Doppelwirkung. |
| Auswahl/Wechsel | Alle fälligen Lücken historisch nachholen, alles Offene binden, neue Auswahl ab aktuellem Monat; Start unverändert. |
| Null/ohne Budget | Nullmonate binden, Ohne-Budget-Nachweise unterscheiden; Zielanlage ohne Auswahl. |
| Historisch A, heute B | A bleibt gebunden; fehlendes A verbraucht ohne Umleitung. 50+200=250 €, −30+100=70 €. |
| Grenze/Commitfehler | Alles zurückrollen, auch frühere Nachholwirkung und Marker. |
| GET/PUT | Gemeinsamer Zustand, PUT nur goalId; Modell/Fehler gemäß AC-1. |
| UI | Keine Vorauswahl, Entwurf bis Commit; Offline/Doppelsenden sperren. Ungewissen Ausgang nachladen; Sitzungsende leert Werte. |

</frozen-after-approval>

## Code Map

Java-Pfade relativ zu `backend/src/main/java/de/linus/tnbp/`, Tests analog unter `backend/src/test/java/de/linus/tnbp/`.

- `shared/FinanceTransactions.java`, `shared/FinanceContext.java`, `shared/ApiVersionState.java`: Sperre/Snapshot/Gates wiederverwenden.
- `finance/FinanceApplication.java`: Abschlusshelfer mit gebundenem Kontext teilen; ausschließlich öffentliche Modulzugänge.

## Tasks & Acceptance

**Execution:** Reihenfolge einhalten; Prüfabläufe sequenziell.

- [x] `api-contract/v2/openapi.yaml`: GET `/monthly-surplus` und PUT `/monthly-surplus/selection` samt Fehlern vor Verbrauchern definieren; Clients generieren.
- [x] `backend/src/main/resources/db/migration/V14__monthly_surplus_selection.sql`, `deploy/provision-finance-grants.sql`, `access/DatabaseRoleVerifier.java`: Historie/Bindung/Verbrauch ergänzen; V13 erhalten, kein Ziel-FK, minimale Rechte/RLS.
- [x] `monthlysurplus/SelectionRepository.java`, `monthlysurplus/MonthRecordRepository.java`, `monthlysurplus/MonthlySurplus.java`: Historie, Bindungen und offene Summe einschließlich Nullmonaten implementieren.
- [x] `savingsgoals/SavingsGoals.java`, `savingsgoals/SavingsGoalRepository.java`: eigene Zielprojektion und geprüften signierten Differenzbefehl ergänzen.
- [x] `finance/FinanceApplication.java`: Nachholen/Anrechnung/Übernahme/Auswahl/Ergebnis atomar koordinieren; Ziel vorher prüfen.
- [x] `finance/http/MonthlySurplusV2Controller.java`, `finance/http/MonthlySurplusV2Errors.java`, `access/AccessConfiguration.java`: Übersicht/Auswahl/Fehler integrieren; Einzelwege kompatibel halten.
- [x] `frontend/src/app/savings-goals/savings-goals.ts`, `frontend/src/app/savings-goals/monthly-automation.ts`, `frontend/src/styles.css`: gemeinsamen Snapshot im Elternteil, Auswahlentwurf und lokale Sperren integrieren. Manuelle Mutationen entkräften Altantworten/erneuern Übersicht. Ladefehler erlauben manuelle Pflege ohne Automatikwerte; kein Fallback nach 401. Entwürfe/Sitzungsgrenzen erhalten.
- [x] `monthlysurplus/MonthlySurplusTest.java`, neue `monthlysurplus/MonthlySelectionIT.java`: Matrix/AC-12 prüfen, insbesondere Rollback nach A-Wirkung vor B-Fehler. `finance/FinanceCoordinationIT.java`, `finance/FinanceMigrationIT.java`, `finance/ArchitectureTest.java`: Verbindung/Snapshot/Bestandserhalt prüfen. `monthlysurplus/MonthlyPendingIT.java`, `access/RegistrationIT.java`: Rechteannahmen anpassen. `versions/ReleaseTransitionIT.java`, `versions/AdministrativeSerializationIT.java`: synthetische V14 auf V15 verschieben.
- [x] `access/MonthlyAutomationE2eServer.java`, `frontend/e2e/monthly-automation.spec.ts`, `frontend/e2e/monthly-automation-closed.spec.ts`: HTTPS-Matrix/geschlossenes Gate prüfen. `README.md`, `_bmad-output/implementation-artifacts/sprint-status.yaml`: Nachweise/Freigabegrenzen aktualisieren.

**Acceptance Criteria:**

- Angenommen echte Kontokontexte, wenn AC-1–8/12 laufen, dann sind Matrix, Isolation, Monatswechsel/Lücken, Konkurrenz, Snapshot und vollständiger Rollback nachgewiesen.
- Angenommen HTTPS, wenn AC-8–12 in allen vier UX-Prüfgrößen laufen, dann bestehen gemeinsame Anzeige, Fehler/Fallback, manuelle Korrektur, Entwürfe/Offline/Sitzungsgrenzen sowie Tastatur, Fokus/Kontrast und 200 % Text/Reflow.

## Implementation Notes

- V14 erweitert ausschließlich den eigenen Automatikbestand: monatswirksame `selections`, dauerhafte `goal_id`/`consumed`-Bindung in Monatsnachweisen, FORCE-RLS und spaltenweise Änderungsrechte. V13 bleibt unverändert; es gibt keinen Fremdschlüssel auf Live-Ziele.
- Die äußere Koordination verwendet denselben Abschlusshelfer für Einzelabschluss und vollständige Auswahltransaktion. Sie prüft das gewünschte eigene Ziel vor Nachholwirkungen, schließt chronologische Lücken, berücksichtigt historische Ziele und bindet danach sämtliche offenen budgetierten Nachweise einschließlich null. Fehlende historische Ziele bleiben verbraucht.
- Der gemeinsame Übersicht-GET verwendet die vorhandene read-only REPEATABLE-READ-Grenze; der PUT stellt seinen vollständigen Zustand vor dem gemeinsamen äußeren Commit zusammen. Der Ziel-Differenzbefehl liest nur eigenen aktuellen Fortschritt und prüft exakte signierte Ergebnisse.
- Die Elternansicht besitzt den gemeinsamen Browser-Snapshot. Auswahlentwürfe und manuelle Entwürfe bleiben unabhängig; Mutationsrevisionen entkräften ältere Antworten. Nach Übersicht-Ladefehler bleibt der bestehende Ziel-Leseweg für manuelle Pflege nutzbar, nach 401 nicht. Das reguläre Gesamtgate bleibt geschlossen.
- Nach bestätigten manuellen Commits wird ausschließlich die gemeinsame Übersicht im Hintergrund erneuert. Unbestätigte manuelle Mutationen behalten den ausdrücklichen Prüfweg. Bekannte Übersichtfehler begrenzen die manuelle Ladeaktion auf den eigenen Ziel-Leseweg; die Automatik-Ladeaktion versucht den gemeinsamen Snapshot erneut. Eine weiterhin abgewiesene Authentifizierung schließt die persönliche Ansicht.
- Die Unteransicht liest den persönlichen Snapshot und Auswahlentwurf direkt aus der Elternansicht, statt eine eigene Kopie zu behalten. Sitzungsprüfungen halten auch eine unmittelbar vor Abmeldung tatsächlich geladene Unteransicht mit 200 € und Auswahlentwurf fest und prüfen sie anschließend auf leere Werte.
- Die bisherigen manuellen Browser-Vertragsfälle prüfen explizit den Ersatz-Leseweg; die Automatikmatrix prüft zusätzlich normale manuelle Anlage, Fortschrittsersatz, Zielbearbeitung/Datum-entfernen und Löschung über die echte gemeinsame Übersicht. Die frühere Aktivierungs-/Lade-/Reconnect-/Sitzungsabdeckung wurde auf den gemeinsamen GET übertragen.

## Spec Change Log

## Review Triage Log

Alle drei Reviewebenen wurden vollständig eingesammelt, bevor die Befunde eingeordnet wurden. Grundlage: `/tmp/story43-review-35gjnrgd.patch`, 220661 Byte. Der vollständige Implementierungsdiff einschließlich neuer Dateien wurde zuvor selbst gelesen; die separate Spezifikation blieb den Blind-/Verifikationsprüfern vorenthalten. Jeder Befund erhält vor der Gruppierung ein eigenes Urteil.

| Befund | Urteil und Evidenz | Behandlung |
| --- | --- | --- |
| B1: Monatswechsel während laufender Mutation wird verbraucht | medium: `checkMonth()` setzt `observedMonth` vor dem Abruf; `load()` bricht bei laufender Auswahl/Aktivierung ab. Nach sicherer Auswahlablehnung setzt kein anderer Pfad einen neuen Abruf voraus. | patch |
| B2: Fortbestehende 401 bei Mutationen lässt persönliche Ansicht offen | medium: Die neu koordinierte Auswahl behandelt die nach Refresh weiterhin abgewiesene Antwort als ungewiss; der Interceptor reicht diese zweite 401 weiter. Der vorhandene Schließhelfer wird ausschließlich von Lesewegen benutzt. Dasselbe Muster besteht im übernommenen Aktivierungspfad. | patch |
| B3: Gelöschter Auswahlentwurf lässt wirkungsloses Speichern zu | medium: Der Entwurf bleibt nach frischer Zielliste erhalten; die Unteransicht prüft nur eine nichtleere ID. Bei fehlendem Entwurfsziel und weiter vorhandenem anderem Ziel bleibt Speichern aktiv, während der Mitgliedschaftsfilter im Elternteil still abbricht. | patch |
| B4: Sichere manuelle Ablehnung entfernt unabhängige Automatikansicht | medium: `invalidateOverview()` leert die Übersicht vor der Mutation. Die bekannten 400-/Fortschritts-Funktionsfehler setzen weder Ungewissheit noch eine Übersichtserneuerung; bestätigte Automatikwerte und Auswahlsteuerung bleiben anschließend ungeladen. | patch |
| B5: Rückkehrereignisse erzeugen doppelte GETs | low: Fokus und Sichtbarkeit können zwei überholende Leseabrufe auslösen. Sequenzen verwerfen die ältere Antwort; belegt sind zusätzliche Abfragen, keine falschen Finanzwerte. | verworfen gemäß Low-Regel: Zusammenfassung/Abbruchsteuerung fügt für diesen geringen Effekt zusätzliche Zustände hinzu |
| B6: Auswahl scannt bereits nachgewiesene Monate erneut | low: Der lineare Scan und zusätzliche Kontext-/Existenzabfragen bestehen. Vorhandene Nachweise überspringen Quellen und Wirkung; eine relevante Verzögerung beim serverseitig begrenzten Aktivierungszeitraum ist nicht nachgewiesen. | verworfen gemäß Low-Regel: neue öffentliche Fehlmonatsprojektion und SQL-Komplexität ohne belegte Alltagsbeeinträchtigung |
| B7: Datenbank erlaubt Ziel-ID-Änderung bereits gebundener Nachweise | false als Fehler des aktuellen Anwendungsablaufs: Das notwendige Spaltenrecht besteht; der einzige Änderungsaufruf `bindOpen()` filtert ausdrücklich `goal_id IS NULL`, und der Abschluss überspringt bestehende Nachweise. Kein benannter erreichbarer Aufrufer bindet alte Monate um. Ein zusätzlicher Trigger würde hypothetische freie Laufzeit-SQL-Aufrufe absichern. | verworfen; vorhandene Anwendungsguards widerlegen die behauptete Umleitung durch diese Story |
| B8: Auswahl und manueller Ersatz nicht tatsächlich gleichzeitig geprüft | medium: Der benannte IT startet acht Auswahlen gleichzeitig, führt den manuellen Ersatz danach jedoch sequenziell aus. Beide möglichen Erwerbsreihenfolgen der gemeinsamen Sperre sind dadurch nicht direkt nachgewiesen. | patch: deterministische Überlappungsprüfung |
| B9: Auswahl-Commitfehler nicht über HTTP nachgewiesen | medium: Der verzögerte Trigger wird nur über den direkten Anwendungsaufruf mit allgemeiner Exceptionerwartung geprüft. Neutraler 500-Körper, no-store und fehlende Erfolgsantwort des Auswahladapters sind in diesem Fehlerfall nicht belegt. | patch: bestehenden Rollbackfall über HTTP ausführen |
| B10: Neues Auswahlfeld fehlt in expliziten UX-Messungen | medium: Der Messhelfer erfasst nur Buttons. Für den zentralen Selektor fehlen damit die zugesagten Größen-/Grenz-/Fokus-/Verdeckungsprüfungen in allen vier Größen; lange Zielnamen werden ebenfalls nicht gezielt abgedeckt. | patch: vorhandenen Helfer und Browserfall ergänzen |
| E1: Sicher abgewiesene Auswahl nach Monatswechsel erhält alten Stand | medium: Unabhängig anhand derselben Reihenfolge von Monatsmarker und verweigertem `load()` bestätigt. Der sichere Fehler stellt nur den alten Snapshot wieder her. | patch; nach Einzelurteil mit B1 gruppiert |
| E2: Nach Hintergrund-Erholung fehlt Serverzeit für Monatswechsel | medium: Nach initialem Übersichtsfehler ist `serverTime` null. Ein bestätigter manueller Vorgang kann die Übersicht über `refreshConfirmedOverview()` erfolgreich nachladen, doch dieser Pfad übernimmt keinen Date-Header. `checkMonth()` bleibt dann bis zu einem anderen Ladeanlass gesperrt. | patch; eigene Ursache, getrennt von B1/E1 |
| E3: Entferntes Entwurfsziel führt zu still wirkungslosem Submit | medium: Unabhängig anhand der Nichtleerprüfung im Kind und der Eigentums-/Existenzprüfung im Elternteil bestätigt. | patch; nach Einzelurteil mit B3 gruppiert |
| V1: Auswahlbestätigung ohne spezifische Antwortprüfungen ungesichert | medium: Vorverifizierte Prüflücke. Entfernen der Prüfungen auf gewünschte `selectedGoalId` und `pendingCents === 0` lässt die bisherigen gültigen PUTs, 409- und Abbruchfälle unverändert bestehen; fehlerhafte Übersichtantworten werden nur dem GET zugeführt. | patch: gültig strukturierte, fachlich unpassende PUT-200-Antworten prüfen |

Die verbleibenden neun Gruppen sind direkte Korrekturen oder eng begrenzte Nachweise bereits demonstrierter Zustände. Sie benötigen keine neue öffentliche Schnittstelle oder Nutzerentscheidung. Keine Absichts-/Planlücke und keine Zurückstellung. Die Korrekturen und ihre erneuten Prüfungen sind noch ausstehend.


Die neun Korrekturgruppen sind umgesetzt und vollständig nachgeprüft. Die nachträglich überholenden GETs bleiben durch dieselben Revisions-/Sitzungsgrenzen geschützt; unsichere manuelle Ausgänge behalten ihren ausdrücklichen Prüfweg. Sichere manuelle 400-/Fortschritts-Funktionsablehnungen erneuern dagegen den unabhängigen Automatikstand. Gelöschte Entwurfsziele sind ausdrücklich ungültig und verlangen eine vorhandene Ersatzwahl. Monatswechsel werden bei laufenden Mutationen nicht verbraucht; nach Hintergrund-Erholung wird die Serverzeit übernommen. Beide Automatikmutationen schließen nach fortbestehender 401 die Sitzung.

Die zusätzlichen Nachweise prüfen echte Auswahl-/Fortschrittsüberlappung in beiden Kontosperrreihenfolgen, verzögerten Commitfehler über HTTP einschließlich neutraler Antwort/Logs, fachlich unpassende PUT-200-Bestätigungen sowie das Auswahlfeld mit langen Namen in allen vier UX-Größen. Keine offenen Korrekturen oder Zurückstellungen. Der abschließende Gesamtlauf nach den Reviewkorrekturen ist maßgeblich; frühere Zwischenläufe bleiben ausschließlich historische Diagnoseartefakte.

## Design Notes

Keine Absichtslücken. Vertrag/DB/API/UI betroffen; dauerhafte Migration, keine Bereitstellung. Letzte Auswahl je Konto/Wirksamkeitsmonat gewinnt. Persönliche Werte nur in der Ansicht.

## Verification

Abschließender Gesamtlauf nach Review vom 08.11.2026, vollständig und sequenziell:

| Aufruf | Tatsächliches Ergebnis | Protokoll |
| --- | --- | --- |
| `./scripts/check-contract.sh` | v1/v2 gültig und kompatibel; generierte Java-/Angular-Schnittstellen und finale Release-SPA erfolgreich gebaut | [Vertrag/Build](../../.local/story-4.3-verification/review-final/contract.log) |
| `./backend/mvnw -f backend/pom.xml verify` | 48 Unit-/Architekturtests und 360 Integrationstests erfolgreich, keine Fehler oder übersprungenen Tests; echte temporäre PostgreSQL-18.6-Datenbank | [Backend](../../.local/story-4.3-verification/review-final/backend.log) |
| `python3 -m unittest discover -s scripts/tests -v` | 19 Tests erfolgreich | [Python](../../.local/story-4.3-verification/review-final/python.log) |
| `npm --prefix frontend run e2e` | 212 HTTPS-Browserprüfungen erfolgreich; geschlossenes Gesamtgate und fortgeltende manuelle Fehler-/Entwurfs-/Fokus-/Sitzungsabläufe | [Regulärer Browserlauf](../../.local/story-4.3-verification/review-final/e2e.log) |
| `npm --prefix frontend run e2e:automation` | 61 HTTPS-Automatikprüfungen erfolgreich, einschließlich sämtlicher Reviewregressionen und vier UX-Größen | [Automatikmatrix](../../.local/story-4.3-verification/review-final/automation.log) |

Insgesamt 700 erfolgreiche Tests. SHA-256 des vollständigen Quelldiffs gegen `540e4c7f7ee459b461ec5d2fcb7f1991beeb5813` ohne `_bmad-output/`: `dfb8a44f2153e0148044e0a5cbd5d5baa578f178df83ad4bfde988d5fda22a26`. Vor und nach allen fünf Läufen identisch; [Ausführungsmanifest](../../.local/story-4.3-verification/review-final/results.json).

Der vollständige Diff einschließlich neuer Dateien wurde selbst gelesen. Sämtliche Aufgaben und beide Abnahmekriterien sind anhand des Codes und tatsächlich ausgeführter Tests geprüft. Die vorhandenen Formel-/Centgrenzenfälle aus `MonthlySurplusTest` und die Monats-/Rollenfälle aus `MonthlyPendingIT` wurden wiederverwendet; eine künstliche Änderung dieser bereits passenden Testdateien war nicht nötig.

| Zeile der eingefrorenen Matrix | Ausgeführter Nachweis |
| --- | --- |
| 200 € + 100 € auf 50 €, Einmalwirkung | `MonthlySelectionIT.dreihundertEuroVollstaendigAufFuenfzigEinmaligUndLueckenChronologisch`; HTTPS-Fall „Gemeinsamer Commit“ |
| Auswahl/Wechsel, chronologische Lücken und Start | derselbe PostgreSQL-Fall; `historischeAuswahlAUndHeutigeBMitMehrerenWechselnUndSigniertemStand` |
| Null/ohne Budget, Anlage ohne Auswahl | `nullmonateWerdenAuchBeiGesamtsummeNullGebundenOhneBudgetBleibtAnders`; HTTPS-Fall „Aktivierung ohne Ziel“ |
| Historisch A/heute B, fehlendes Ziel, signierter Stand | `historischeAuswahlAUndHeutigeBMitMehrerenWechselnUndSigniertemStand`; `historischFehlendesZielWirdVerbrauchtUndNiemalsAufHeuteUmgeleitet` |
| Grenze/Commitfehler, gesamter Rollback | `spaeterBFehlerRolltFruehereAWirkungAlleNachweiseAuswahlUndMarkerZurueck`; HTTP-Fall `commitfehlerVerwirftAuchBereitsGeschriebeneBindungenUndAuswahl` |
| Gemeinsamer GET/PUT, Fehler und Kontogrenze | `gemeinsamerLesestandIstReinLesendUndNurMitBearerErreichbar`; `ungueltigeFremdeFehlendeInaktiveUndGesperrteAuswahlOhneWirkung`; echte RLS-/Rechteprüfungen |
| UI, Entwürfe, Offline, Ungewissheit und Sitzungsende | 61 Fälle in `monthly-automation.spec.ts`, darunter sichere/unbestätigte Auswahl, fehlerhafte PUT-Bestätigungen, gelöschtes Entwurfsziel, fortbestehende 401, Reconnect/Monatswechsel und späte Antworten |

AC-1/AC-2 sind zusätzlich durch Vertragscheck, frische/befüllte V13→V14-Migration und wiederholte administrative Rechtebereitstellung belegt. AC-3 bis AC-7/AC-12 decken die 14 Fälle von `MonthlySelectionIT` ab; die beiden neuen Parameterfälle beweisen tatsächlich blockierende konkurrierende Anwendungsaufrufe und beide Kontosperrreihenfolgen. AC-8 ist durch `uebersichtBehaeltEinenSnapshotBeiCommitZwischenTeilabfragen` sowie `auswahlNachholungFortschrittBindungUndMarkerTeilenPhysischeTransaktionUndEinenZeitpunkt` belegt.

Für AC-9 bis AC-11/AC-12 bestehen die vollständigen HTTPS-Nachweise. UX-Prüfgrößen: 320×568, 390×844, 768×1024 und 1280×800, jeweils auch mit 200 % Text. Selektor und Buttons werden ausdrücklich auf Größe, Kontrollgrenze/Fokuskontrast, Sichtbarkeit und Verdeckung geprüft; Axe/Semantik, Tastatur, lange Zielnamen/Beträge und Reflow bleiben eingeschlossen. Tatsächliche 350 % bei 100 € Ziel und −30 % nach manuellem Ersatz sind sichtbar, nur der Balken ist begrenzt. Die mobile 320-Pixel-Darstellung wurde zusätzlich visuell geprüft. Aktuelle [Bildschirmnachweise](../../.local/story-4.3-verification/screenshots/) bleiben lokal erhalten.

Alle drei Reviewebenen sind abgeschlossen, alle angenommenen Befunde behoben und vollständig nachgeprüft. Öffentliche Automatikfreigabe bleibt geschlossen; historische Korrektur, vollständige Löschkoordination und Worker bleiben die ausdrücklich abgegrenzten Folgestories. Keine Produktionsfreigabe und kein GitHub-Abgleich.
