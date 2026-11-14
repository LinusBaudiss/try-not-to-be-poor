---
title: 'Story 4.5: Sparziel löschen und Monatsbindungen verbraucht halten'
type: 'feature'
created: '2026-11-13'
status: 'done'
route: 'dispatch'
baseline_commit: '7967faf00455052a8fb8fb53072f8c6ab042f7be'
story_key: '4-5-sparziel-löschen-und-seine-historischen-monatsbindungen-verb'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/epics.md'
---

<frozen-after-approval reason="Nutzerabsicht; Änderungen nur nach erneuter Abstimmung">

## Intent

**Problem:** Ziellöschung schützt historische Monatsbindungen noch nicht vollständig.

**Approach:** Story 4.5/AC-1–11 vollständig umsetzen: Ziel, dauerhaften Verbrauch und nötige Auswahlleerung gemeinsam bestätigen; Folgen erklären und Gesamtstand erneuern.

## Boundaries & Constraints

**Always:** Kontosperre vor Fachlesen; ein Zeitpunkt, Kontokontext und Commit. Modulgrenzen, Filter/FORCE-RLS, exakte Centgrenzen erhalten.

**Never:** Löschung durch Nachholen, Summieren oder Gesamtgate blockieren; historische Herkunft ändern; v1/alte Migrationen ändern; Worker, öffentliche Freigabe oder Ersatzwahl ergänzen.

## I/O & Edge-Case Matrix

| Fall | Ergebnis |
| --- | --- |
| Aktuelles A löschen | Ziel/Fortschritt entfernen, A-Bindungen verbrauchen, Auswahl ab laufendem Monat leeren; Aktivierung erhalten. |
| Historisches A, aktuelles B | B erhalten; auch unverarbeitete abgeschlossene A-Monate einschließlich Null bleiben dauerhaft verbraucht. |
| Offen 200/100/0 € | Vormerkungen erhalten; weitere Monate ohne Auswahl vormerken. Neues gleichnamiges Ziel erbt nichts. |
| Spätere Korrektur/Abschluss | Ziel-ID und Verbrauch erhalten; neuen Überschuss speichern, ohne Wiederanlage, Umleitung oder neue Vormerkung für A. |
| Inaktiv/ungebunden | Normale Löschung ohne Aktivierung oder Monatswirkung. |
| Grenzen/Konkurrenz/Fehler | Kein Nachholzwang; gemeinsame Serialisierung beziehungsweise vollständiger Rollback; wiederholtes Löschen neutral 404. |
| 204, danach Ladefehler | Löscherfolg erhalten, abhängige Werte ungeladen; keine erneute Löschung. Sichere Fehler erhalten bestätigten Vorzustand; unbestätigten Ausgang vor Wiederholung klären. |

</frozen-after-approval>

## Code Map

Java-Pfade unter `backend/src/main/java/de/linus/tnbp/`, Tests entsprechend unter `backend/src/test/java/de/linus/tnbp/`.

- `shared/FinanceTransactions.java`, `shared/ApiVersionState.java`: Kontogrenze und monotonen `markMonthlyEffect` wiederverwenden; dieser erzwingt die Versionsbarriere ohne neues Gesamtgate.
- `monthlysurplus/SelectionRepository.java`: Nullauswahl muss ältere Auswahl überdecken; `findFirst` verträgt kein Nullergebnis.
- `frontend/src/app/savings-goals/savings-goals.ts`: Dialog/Fokus, `remove`, `invalidateOverview`, `refreshConfirmedOverview` und Antwort-/Sitzungsschranken erweitern; unabhängige Entwürfe erhalten.

## Tasks & Acceptance

**Execution:** Reihenfolge einhalten; Prüfläufe sequenziell.

- [x] `api-contract/v2/openapi.yaml`: bestehenden DELETE/204 als gemeinsamen Commit präzisieren; vor Verbrauchern generieren, Antwortform erhalten.
- [x] `backend/src/main/resources/db/migration/V16__monthly_surplus_goal_deletion.sql`: eindeutigen Marker `(user_id, goal_id)` ohne Zielfinanzwerte/Live-Ziel-FK, FORCE-RLS und SELECT/INSERT-Rechte anlegen; Auswahl nullable machen. `deploy/provision-finance-grants.sql`, `access/DatabaseRoleVerifier.java`: Minimalrechte nachführen.
- [x] `monthlysurplus/DeletedGoalRepository.java`, `MonthlySurplus.java`, `SelectionRepository.java`, `MonthRecordRepository.java`: gebundene Ziele erkennen, Marker sichern, bestehende Bindungen monoton verbrauchen und nur aktuelle A-Auswahl leeren; keine Aktivierung/Quellberechnung erzeugen.
- [x] `finance/FinanceApplication.java`: eigenes Ziel prüfen, Verbrauch/Löschung/Nutzungsmarker koordinieren; Marker auch bei Abschluss/Erstnachweis/Korrektur beachten. `finance/http/SavingsGoalV2Errors.java`: ungültige ID 400 von neutraler 404 trennen.
- [x] `monthlysurplus/MonthlyDeletionIT.java`, `MonthlySurplusTest.java`: Matrix und vollständige AC-11 mit PostgreSQL/HTTP prüfen: zwei Konten, RLS/Kontext/Pool, Null/ohne Budget/vor Aktivierung/inaktiv, blockierte Nachholung, tatsächliche Folgekorrekturen, Monatsgrenzwartezeit, beide Sperrreihenfolgen und Commitfehler nach Teilbefehlen.
- [x] `finance/FinanceMigrationIT.java`, `access/RegistrationIT.java`, `savingsgoals/SavingsGoalV2IT.java`: Bestand V15→V16, Rechte/Isolation/Vertrag prüfen. `versions/ReleaseTransitionIT.java`, `AdministrativeSerializationIT.java`: synthetische Folgemigration auf V17 verschieben. `monthlysurplus/MonthlySelectionIT.java`, `MonthlyCorrectionIT.java`: Löschzeitpunkt historischer Fixtures und sofortigen Verbrauch anpassen.
- [x] `frontend/src/app/savings-goals/savings-goals.ts`: Dialogfolgen samt unverarbeiteten Monaten erklären; sichere Fehler korrekt erhalten, bestätigte entfallene Zielentwürfe verwerfen, Gesamtstand erneuern. `frontend/src/styles.css`: nötige Reflow-/Fokuskorrekturen.
- [x] `access/MonthlyAutomationE2eServer.java`, `frontend/e2e/monthly-automation.spec.ts`, `savings-mutations.spec.ts`: echte Lösch-/Folgekorrekturen, frische/fehlgeschlagene/späte Leseantworten, Fehler/Offline/Entwürfe/Sitzungswechsel prüfen; alten Test zum erhaltenen gelöschten Auswahlentwurf ersetzen. `README.md`, `_bmad-output/implementation-artifacts/sprint-status.yaml`: Ergebnis dokumentieren.

**Acceptance Criteria:**

- Angenommen echte Kontotransaktionen, wenn AC-1–7/11 ausgeführt werden, dann bestehen Lebenszyklus, Isolation, Einmalwirkung und vollständiger Commit/Rollback ohne Nachholvoraussetzung.
- Angenommen HTTPS in allen vier UX-Größen, wenn AC-8–11 einschließlich 200 % Text ausgeführt werden, dann bestehen verständliche Folgen, Fokus/Tastatur/Axe/Kontrast/44-Pixel-Aktionen/Reflow und sichere frische Zustände auch ohne Ziele.

## Implementation Notes

- V16 ergänzt `monthly_surplus.deleted_goals` mit ausschließlich Konto/Ziel-ID, unveränderlichen SELECT-/INSERT-Rechten und FORCE-RLS; die Auswahl kann intern ab dem offenen Monat leer sein. Historische Migrationen und v1-Vertrag bleiben erhalten.
- `MonthlySurplus.deleteGoal` liest nur eigene Bindungsexistenzen, sichert den Marker, verbraucht bestehende Nachweise und leert ausschließlich eine betroffene aktuelle Auswahl. `FinanceApplication` koordiniert dies mit eigener Zielprüfung, Ziellöschung und monotonem Nutzungsmarker unter der bestehenden Kontosperre. Es gibt keine Quellen-/Summenberechnung oder Gesamtgate als Löschvoraussetzung.
- Abschluss und Korrektur beachten den dauerhaften Marker zusätzlich zur erhaltenden Bindung. Ein späterer positiver Überschuss aus einem verbrauchten Null-/Ohne-Budget-Nachweis wird dadurch weder offen noch umgeleitet.
- Der Dialog erklärt Verlust, historischen Verbrauch einschließlich unverarbeiteter Monate, erhaltene Vormerkungen und künftige Vormerkung ohne Auswahl. Explizite Dialogbreite/max-width und feste 16-Pixel-Ränder verhindern die zusätzliche Browserbegrenzung bei 200 % Text; Fokusziele erhalten Scrollabstand. Sichere 400/404 erhalten den bestätigten Vorzustand. Nach 204 entfallen Ziel und zugehörige Entwürfe sofort; die gemeinsame Übersicht bleibt bis zur frischen Antwort ungeladen. Unabhängige Entwürfe bleiben erhalten.
- `MonthlyDeletionIT` bündelt 22 echte PostgreSQL-/HTTP-/Sperrprüfungen für AC-1–7/11. Migration/Rechte/Vertrag sind zusätzlich in `FinanceMigrationIT`, `RegistrationIT` und `SavingsGoalV2IT` gebunden. `monthly-automation.spec.ts` ergänzt tatsächliche Löschung/Folgekorrektur, vier Größen mit 200-%-Text, frische/fehlgeschlagene/späte Übersichten und Auswahlentwürfe. `savings-mutations.spec.ts` prüft zusätzlich bestätigten Wegfall offener Fortschritts-/Zielentwürfe sowie bestehende Offline-/Ungewissheits-/Sitzungsfälle.
- Die Reviewkorrekturen erhalten einen nur im offenen Dialog lebenden bestätigten Snapshot samt Sitzungs-/Antwortgrenzen. Er liefert bei sicherer Ablehnung den bestätigten Vorzustand und bei 204 die verbleibenden Ziele; entkräftetes Laden wird nicht wiederhergestellt. Frische Übersichten aktualisieren Dialogfolgen, Aktivierung bleibt Voraussetzung. Der vorhandene leere Auswahlwert verhindert eine unbeabsichtigte Ersatzwahl. Entfallene Editoren bereinigen ihren Status und erhalten einen erklärten Rückkehrfokus ausschließlich bei betroffenem Fokusziel. Der v2-Adapter prüft die originale UUID-Pfadschreibweise vor Facharbeit. Zusätzliche Nachweise erhöhen die Löschklasse auf 23 Fälle und die Automatik-Suite auf 91 Fälle.

## Spec Change Log

## Review Triage Log

Alle drei unabhängigen Linsen wurden vollständig eingesammelt, bevor ein Befund eingeordnet wurde. Grundlage: `/tmp/story45-20261114-review.patch`, 99.812 Byte, SHA-256 `abd3758f94aa9b29eab2d27a879033511e0a308a7631895a495d7262b507aa07`. Die Spezifikation blieb Blind- und Verifikationsprüfung vorenthalten; nur die Randfalllinse erhielt sie nach eigenständiger Ablaufverfolgung. Separate Epic-5-Änderungen waren nicht Teil des Diffs.

| Befund | Urteil und geprüfte Evidenz | Behandlung |
| --- | --- | --- |
| B1: Sicherer Löschfehler kann nach überlappendem GET keinen bestätigten Stand erhalten | medium: `load` leert Übersicht und Liste; `remove` liest danach `before=null`. Seine Invalidation entkräftet den alten GET, eine sichere 400/404 stellt den vorigen bestätigten Stand deshalb nicht wieder her. | patch: bestätigten Stand für den Dialog unabhängig vom Ladezustand erhalten |
| B2: 204 verliert bei derselben Überlappung unabhängige Ziele/Fokus | medium: `remaining` wird aus der von `load` geleerten Liste abgeleitet. Bei weiterhin fehlender Verbindung/Ladefehlern fehlen bekannte andere Ziele und der nächste Ziel-Fokus; der Listenverlust bestand bereits im Basisstand. Dieselbe durch B1 benötigte bestätigte Datenbasis vermeidet ihn ohne separaten Mechanismus. | nach Einzelurteil mit B1 gruppierter patch |
| B3: Dialog behauptet nach frischer B-Auswahl weiterhin aktuelle A-Auswahl | medium: `deletingSelected` wird ausschließlich in `startDelete` gesetzt; `acceptOverview` aktualisiert es nicht. Ein bestätigter externer Wechsel zu B erhält B serverseitig, während der offene Dialog weiterhin A und anschließende Vormerkung behauptet. | patch: Folgen zeitlich korrekt aktualisieren oder bedingt formulieren |
| B4: Dialog verspricht bei inaktiver Automatik künftige Vormerkung | medium: Die nicht ausgewählte Variante bindet Vormerkung nur an fehlende Auswahl; sie nennt Aktivierung nicht als Voraussetzung. Ein gewöhnliches inaktives Konto kann den Dialog öffnen. | patch: Aktivierung ausdrücklich als Voraussetzung erhalten |
| B5: Verworfenes A wird still durch gespeichertes B ersetzt | medium: `discardGoalDrafts` setzt `null`; `MonthlyAutomation` verwendet daraufhin `draft() ?? selectedGoalId`. Bei gespeichertem B und Entwurf A erscheint B mit freigegebenem Speichern, obwohl kein Ersatz gewählt wurde. Der vorhandene leere String kann bereits eine ausdrückliche leere Auswahl repräsentieren. | patch: nach Verwerfung ausdrücklich leer und Speichern bis eigener Ersatzwahl gesperrt |
| B6: Bestätigt fehlender Editor verliert Tastaturfokus | medium: Ein erfolgreicher Rückkehrabruf entfernt den zuvor fokussierten Fortschritts-/Zieleditor durch `discardGoalDrafts` ohne Rückkehrfokus oder Erklärung. Außerhalb dieses Editors liegender Fokus muss dabei erhalten bleiben. | patch: sinnvollen Fokus bei tatsächlich entferntem Fokusziel und Status ergänzen |
| B7: Verworfener Zieleditor behält überholten Validierungsstatus | low: `resetTarget` leert Felder und Fehler, aber nicht `mutationStatus`/Fehlerflags; nach früherer Validierung bleibt eine Aufforderung ohne zugehörige Eingaben sichtbar. | patch: direkte Statusbereinigung/Erklärung beim bestätigten Verwerfen |
| B8: Verkürzte UUID erreicht statt 400 die Löschkoordination | medium: Java 25 wandelt `1-1-1-1-1` tatsächlich in eine UUID um. Der lokal gelesene Spring-7.0.9-Konverter verwendet ausschließlich `UUID.fromString(source.trim())`; der neue Type-Mismatch-Handler greift deshalb nicht. | patch: originale v2-Pfadschreibweise strikt prüfen und tatsächliche HTTP-Ablehnung belegen |
| B9: Bereits vor V16 gelöschte aktuelle Auswahl wirkt weiter | medium: Der Basisstand löscht nur das Live-Ziel. Dessen erhaltene Auswahl wird beim späteren Abschluss weiterhin als verbraucht behandelt, auch für nachfolgende Monate. V16 erhält diesen Altbestand; der tatsächliche historische Löschmonat ist daraus nicht rekonstruierbar. Die öffentliche Automatik war bereits im Basisstand gesperrt. | defer: vor Gesamtfreigabe ausdrücklich über eine Reparatur alter synthetischer/übernommener Zustände entscheiden; keine vermutete Historie migrieren |
| B10: Löschung ausschließlich über Monatsnachweise referenzierter Ziele ungeprüft | medium: Bei zwei Auswahlen im selben offenen Monat kann die letzte A-Auswahlzeile durch B ersetzt werden, während übernommene Herkunftsmonate an A gebunden bleiben. Vorhandene Löschfixtures erhalten jeweils eine A-Auswahlzeile; der `records.references`-Zweig ist so nicht eigenständig belegt. | patch: tatsächlichen Auswahl-/Lösch-/Korrekturpfad ohne verbleibende A-Auswahlzeile prüfen |
| E1: Frische externe Auswahl erreicht den offenen Dialog nicht | medium: Derselbe überprüfte Ablauf und dieselbe einmalige Speicherung wie B3; die vorhandene Übersichtannahme aktualisiert den Dialogzustand nicht. | nach Einzelurteil mit B3 gruppierter patch |
| V1: Erfolgreiche gemeinsame Übersicht nach externer Löschung prüft Entwurfsverwerfen nicht | medium: Vorverifizierte Lücke: Die externen Löschtests erzwingen den individuellen Ersatzleseweg; lokale Löschung verwirft eigenständig. Ohne `discardMissingGoalDrafts(state.goals)` bliebe die normale erfolgreiche gemeinsame Übersicht bislang ungesichert. | patch: externe Auswahl-/Fortschritts-/Zielentwürfe über erfolgreichen gemeinsamen GET prüfen |

Die neun Korrekturgruppen ergänzen vorhandene innere Zustandsregeln und deren Nachweise; sie ändern weder öffentliche Oberfläche noch die freigegebene Absicht. Kein Absichts- oder Planungsloop nötig. Der bereits vorher bestehende Altzustandsfall ist separat in `deferred-work.md` erfasst. Nachprüfungen der Korrekturen stehen noch aus.

Alle neun Korrekturgruppen sind umgesetzt und anhand des geänderten Codes geprüft. Gezielt bestanden zunächst 46 Backendfälle, 20 Browserfälle, vier Snapshot-Fälle und zwei Dialogtext-Fälle. Der zusätzlich erkannte B1-Ladezustand eines bereits invalidierten post-mutation-GET wird jetzt ausdrücklich als ungeladen behandelt. Der folgende vollständige Abschlusslauf bestätigt sämtliche Korrekturen gemeinsam. Kein offener Patch, kein weiterer Reviewdurchgang für diese begrenzten Korrekturen erforderlich. B9 bleibt als nachgewiesener Vorgängerfall zurückgestellt.

## Verification

Am **14.11.2026** sequenziell ausgeführt und erfolgreich:

| Prüfung | Ergebnis | Dauerhaftes Log unter `.local/story-4.5-verification/` |
| --- | --- | --- |
| `./scripts/check-contract.sh` | v1/v2 validiert, kompatibel; Java-/Angular-Generierung und Kompilierung bestanden | `contract.log` |
| `./backend/mvnw -f backend/pom.xml verify` | 49 Unit-/Architekturprüfungen und 431 Integrationstests, keine Fehler; davon 22 `MonthlyDeletionIT` | `backend.log` |
| `python3 -m unittest discover -s scripts/tests -v` | 19 bestanden | `python.log` |
| `npm --prefix frontend run e2e` | 224 bestanden | `e2e.log` |
| `npm --prefix frontend run e2e:automation` | 79 bestanden | `automation.log` |
| `npm --prefix frontend run e2e:transition` | 5 bestanden | `transition.log` |
| `npm --prefix frontend run build` | Release-SPA auf finalem CSS-Stand erfolgreich gebaut | `build.log` |

Nach der rein visuellen Dialogkorrektur gezielt erneut geprüft: 36 Sparziel-Mutationsfälle (`e2e-savings-reflow.log`), danach die finale Browser-max-width-Korrektur mit sieben Dialogfällen (`e2e-dialog-final.log`) und acht Automatik-/Spätantwort-/Kontowechselfällen (`automation-layout-final.log`). Alle bestanden. Der finale 320×568-/200-%-Screenshot `dialog-320-200.png` ist visuell geprüft; beide Außenkanten messen 16 CSS-Pixel. Die vier UX-Größen, Tastatur/Fokus, Axe, Kontrast, 44-Pixel-Aktionen und Reflow sind in den Browserfällen enthalten. Die finale CSS-Korrektur ist durch diese gezielten Browserläufe und den anschließenden Release-Build abgedeckt.

Keine offene Umsetzung im Story-4.5-Umfang. Öffentliche Gesamtfreigabe und Hintergrundlauf bleiben wie vorgesehen geschlossen beziehungsweise Folgeumfang. Keine Veröffentlichung oder GitHub-Spiegelung ausgeführt.

### Matrixaudit der äußeren Prüfung

Der vollständige Story-Diff wurde gegen `baseline_commit` gelesen. Alle Aufgaben sind anhand des Diffs bestätigt. Die sieben eingefrorenen Matrixzeilen besitzen tatsächlich ausgeführte, erfolgreiche Nachweise:

| Matrixzeile | Ausgeführter Nachweis |
| --- | --- |
| Aktuelles A | `MonthlyDeletionIT.aktuellesZielVerbrauchtNachweiseUndLoeschtNurAbOffenemMonat`; vier echte HTTPS-Löschabläufe. |
| Historisches A, aktuelles B | Beide Parameter von `echteLoeschungUndFolgekorrekturenVerbrauchenUnverarbeiteteHistorischeMonate`, einschließlich positiver B-Folgeanrechnung und neutraler erneuter A-Auswahl. |
| Offen 200/100/0 € | `bestehendeBindungUndOffeneNullVormerkungenBleibenNachLetztemZielGetrennt`; vier HTTPS-Fälle mit 300 € und gleichnamiger Neuanlage. |
| Spätere Korrektur/Abschluss | Beide Parameter des Folgekorrekturtests und bestehende `MonthlyCorrectionIT`-Fälle; tatsächliche HTTPS-Ausgabenänderung/-löschung nach Ziellöschung. |
| Inaktiv/ungebunden | Alle vier Parameter von `ohneAktivierungBindungBudgetOderVorAktivierungWirdNichtsErfunden` sowie reguläre v2-Ziellöschung. |
| Grenzen/Konkurrenz/Fehler | Drei Fortschrittsstände ohne Nachholzwang; sechs echte Sperrreihenfolgen; Commitfehler nach allen Teilbefehlen und wiederholte 404. |
| 204/Ladefehler/sichere Fehler | Vier HTTPS-Löschabläufe und vier Spätantwort-/Kontowechselfälle; reguläre Ungewissheits-/Offline-/Sitzungsfälle. |

Die 22 Löschintegrationstests und alle zugeordneten Browserfälle sind ohne Fehler oder übersprungene Fälle in den [Backend-](../../.local/story-4.5-verification/backend.log), [regulären Browser-](../../.local/story-4.5-verification/e2e.log) und [Automatikprotokollen](../../.local/story-4.5-verification/automation.log) enthalten. Die finalen Layoutfälle sind zusätzlich im [Dialognachlauf](../../.local/story-4.5-verification/e2e-dialog-final.log) und [Automatiknachlauf](../../.local/story-4.5-verification/automation-layout-final.log) belegt. Das finale Dialogbild wurde auch durch die äußere Prüfung visuell kontrolliert. Separate parallele Epic-5-Planungsänderungen gehören nicht zum geprüften Story-Diff.

### Abschließender Gesamtnachweis nach Review, 14.11.2026

Alle sieben Befehle liefen nach sämtlichen Reviewkorrekturen vollständig und sequenziell erfolgreich. Diese Protokolle sind maßgeblich; die vorherigen Läufe bleiben als Umsetzungshistorie erhalten.

| Aufruf | Finales Ergebnis | Protokoll |
| --- | --- | --- |
| `./scripts/check-contract.sh` | v1/v2 gültig und kompatibel; Java-/Angular-Generierung, Kompilierung und Release-SPA erfolgreich | [Vertrag](../../.local/story-4.5-verification/review-final/contract.log) |
| `./backend/mvnw -f backend/pom.xml verify` | 49 Unit-/Architekturtests und 433 echte PostgreSQL-Integrationstests, darunter alle 23 Löschfälle; keine Fehler/übersprungenen Tests | [Backend](../../.local/story-4.5-verification/review-final/backend.log) |
| `python3 -m unittest discover -s scripts/tests -v` | 19 erfolgreich | [Python](../../.local/story-4.5-verification/review-final/python.log) |
| `npm --prefix frontend run e2e` | 224 HTTPS-Browserfälle erfolgreich | [Regulärer Browser](../../.local/story-4.5-verification/review-final/e2e.log) |
| `npm --prefix frontend run e2e:automation` | 91 erfolgreich, einschließlich aller Reviewregressionen | [Automatik](../../.local/story-4.5-verification/review-final/automation.log) |
| `npm --prefix frontend run e2e:transition` | 5 erfolgreich; finaler Release-Build, Altbundle und tatsächlicher API-Wechsel | [Versionsübergang](../../.local/story-4.5-verification/review-final/transition.log) |
| `npm --prefix frontend run build` | Release-SPA erfolgreich | [Release-Build](../../.local/story-4.5-verification/review-final/build.log) |

Insgesamt **821 erfolgreiche Tests**. SHA-256 des vollständigen Quelldiffs gegen `7967faf00455052a8fb8fb53072f8c6ab042f7be` ohne `_bmad-output/`: `ecba4d9adc5a1865e56431a5b61f7521860e50cd2119aaf998998df64f316329`. Vor und nach jedem der sieben Läufe identisch; [Ausführungsmanifest](../../.local/story-4.5-verification/review-final/results.json). Der aus dem finalen Gesamtlauf erzeugte [320-Pixel-Dialog bei 200 % Text](../../.local/story-4.5-verification/review-final/dialog-320-200.png) wurde erneut visuell geprüft.

Alle angenommenen Reviewkorrekturen sind nachgeprüft. Die freigegebene Absicht und der v1-Vertrag blieben unverändert. Der nachgewiesene ältere Altzustandsfall B9 ist mit Evidenz in `deferred-work.md` dokumentiert und vor öffentlicher Gesamtfreigabe gesondert zu klären. Öffentliche Automatik- und Produktionsfreigabe bleiben geschlossen. Kein GitHub-Abgleich und kein Push.
