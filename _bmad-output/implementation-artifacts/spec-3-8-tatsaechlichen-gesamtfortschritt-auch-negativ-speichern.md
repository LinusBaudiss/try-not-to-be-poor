---
title: 'Story 3.8: Tatsächlichen Gesamtfortschritt auch negativ speichern'
type: 'feature'
created: '2026-10-31'
status: 'done'
route: 'dispatch'
story_key: '3-8-tatsächlichen-gesamtfortschritt-auch-negativ-speichern'
baseline_commit: '5b6d37fb30cffd04ecb64a5270b64ee15d7d8fb3'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/epics.md'
---

<frozen-after-approval reason="Nutzerabsicht; Änderungen nur nach erneuter Abstimmung">

## Intent

**Problem:** Negative Gesamtfortschritte sind darstellbar, aber weder eingebbar noch speicherbar.

**Approach:** Signiertes absolutes Ersetzen nach nachgewiesener v1-Stilllegung freigeben. Story 3.8/AC-1–10 in `epics.md` gelten vollständig, einschließlich echter Persistenz-, Prozess- und Browsernachweise.

## Boundaries & Constraints

**Always:** Exakte Cent innerhalb ±9007199254740991, Kontotrennung/RLS, äußere Kontotransaktion und Commitbestätigung. Fortschritt und dauerhafter Nutzungsmarker gemeinsam speichern. Fehler erhalten offene Entwürfe; Sitzungsende entkräftet Antworten.

**Never:** v1-Vertrag oder alte Migrationen ändern; andere Geldfelder signiert öffnen; Fortschritt abschneiden; Beitragsverlauf, Monatsautomatik oder Produktionsfreigabe ergänzen.

## I/O & Edge-Case Matrix

| Zustand | Verhalten |
| --- | --- |
| Freigabe fehlt, widerspricht sich oder ist veraltet | Capability geschlossen; negative Mutation 409 `FEATURE_NOT_AVAILABLE`, keine Wirkung; nichtnegative Pflege bleibt nutzbar. |
| Freigegebenes eigenes Ziel | −30, 0, 70 und 150 Euro ersetzen exakt; erneutes Laden erhält den Betrag. |
| Ungültiger Betrag oder fremde/fehlende ID | Ohne Teilmutation ablehnen; Ressourcen neutral behandeln. |
| Fehler/Commitverlust/Rücknahmewettlauf | Atomarer Fortschritt/Marker; unbestätigten Ausgang prüfen; kein negativer Commit bei geöffnetem v1. |
| Anzeige/Eingabe | ASCII-Minus mobil eingebbar, negatives Vorbelegen; tatsächliche Beträge/Prozente, allein Balken 0–100 %. |
| Sitzungs-/Kontowechsel | Persönliche Zustände verwerfen; späte Capability-/Finanzantworten bleiben wirkungslos. |

</frozen-after-approval>

## Code Map

Java-Pfade relativ zu `backend/src/main/java/de/linus/tnbp/`.

- `shared/{ApiVersionState,FinanceTransactions}.java`: Beleg, Marker und Verbindung wiederverwenden; gecachtes `v1Retired()` genügt nicht.
- `frontend/src/app/shared/{money,savings-progress}.ts`: BigInt-Darstellung erhalten; signierte Eingabe getrennt ergänzen.
- `frontend/src/app/savings-goals/savings-goals.ts`: `accepts()`, `clear()`, Revisionen/Vorgangssperren erhalten; Erfolgstext mit `formatSignedEuro()`.

## Tasks & Acceptance

**Execution:** Änderungen nach Abhängigkeit; gemeinsame Maven-/Browserartefakte ausschließlich sequenziell bauen und prüfen.

- [x] `api-contract/v2/openapi.yaml`: vor Verbrauchern Bearer-GET `/capabilities`, `signedProgressAvailable`, `no-store`, 200/401 und neutralen Ladefehler festlegen; Generatoren verwenden.
- [x] `backend/src/main/resources/db/migration/V11__signed_savings_progress.sql`: Constraint gezielt ersetzen; technische Prüffunktion ergänzen; Bestände/Rechte/RLS erhalten.
- [x] `shared/ApiVersionState.java`, `finance/FinanceApplication.java`, `savingsgoals/SavingsGoals.java`: Freigabe frisch prüfen; Versionszeile gegen Rücknahme sperren; Marker und Ersatz gemeinsam committen.
- [x] `finance/http/CapabilitiesV2Controller.java` neu, `access/{AccessConfiguration,DatabaseRoleVerifier}.java`, `backend/src/main/resources/application.yaml`: geschützte Capability, minimale Funktionsrechte und geschlossene Standardkonfiguration integrieren.
- [x] `frontend/src/app/shared/money.ts`, `frontend/src/app/savings-goals/savings-goals.ts`: signierte Parser/Vorbelegung, Texteingabetastatur, sitzungsgebundene Capability-Zustände mit Retry und 409-Neuabgleich ergänzen; Entwurf erhalten.
- [x] `backend/src/test/java/de/linus/tnbp/{savingsgoals/SignedProgressIT.java,savingsgoals/SavingsGoalIT.java,finance/FinanceMigrationIT.java,finance/FinanceCoordinationIT.java,versions/ReleaseTransitionIT.java,versions/AdministrativeSerializationIT.java}`: Matrix samt Migration, Commitfehler, Rollen/Konten, Rücknahmewettlauf und verzögertem v1-GET real prüfen; nur ersetzte DB-Nichtnegativitätsprüfungen ändern, synthetische V11-Migrationen umnummerieren.
- [x] `frontend/e2e/{savings-progress,savings-mutations,version-transition}.spec.ts`, `frontend/e2e/support/complete-v2-flow.ts`, `backend/src/test/java/de/linus/tnbp/access/E2eServer.java`, `scripts/e2e-transition.py`: freigegebene HTTPS-Matrix über echten administrativen Übergang ergänzen, gesperrte Matrix erhalten; vier Größen/200 %, Extremwerte, Fehler und Sitzungsgrenzen prüfen.
- [x] `README.md`, `deploy/api-transition.md`: Freigabe/Rücknahmegrenze dokumentieren; Spec und Sprintstatus nach tatsächlichen Nachweisen fortschreiben.

**Acceptance Criteria:**

- Angenommen Bestandsdaten, wenn Migration/Freigabe erfolgen, dann gelten AC-1–4/9 samt dauerhafter Rückfallgrenze nach −30 → 70 Euro.
- Angenommen gespeicherte Zielwerte, wenn Pflege/Fehlerfälle auftreten, dann gelten AC-5–7 ohne Einfluss auf Monatsrest/andere Geldfelder.
- Angenommen vier UX-Prüfgrößen/200-%-Text, wenn der manuelle Ablauf ausgeführt wird, dann gelten AC-8/10 und ausschließlich v2-Aufrufe.

## Implementation Notes

- Der v2-Vertrag enthält die Bearer-geschützte, rein lesende Capability mit neutralem Fehler und `no-store`; Java-/Angular-Verbraucher werden daraus generiert. Der archivierte v1-Vertrag bleibt unverändert.
- V11 ersetzt ausschließlich den bisherigen Fortschritts-Constraint. Die technische SECURITY-DEFINER-Prüffunktion vergleicht den vollständigen aktuellen Beleg mit dem gebundenen Startbeleg und prüft den tatsächlichen validierten signierten Constraint. Runtime erhält nur EXECUTE; bei negativen Mutationen bleibt die Versionszeile bis zum äußeren Commit gegen Rücknahme gesperrt.
- `SIGNED_PROGRESS_ENABLED` bleibt standardmäßig `false`. Die äußere Kontotransaktion führt Marker und absoluten Zielersatz auf derselben Verbindung aus. Bestätigte negative Nutzung bleibt nach positivem Ersatz oder Löschen dauerhaft markiert.
- Nur Fortschritt verwendet signierten Parser und ASCII-Minus-Vorbelegung; die Texteingabetastatur erlaubt das Minus auch mobil. Andere Betragsparser bleiben unverändert. Capability-Zustände sind an Sitzung und Ansicht gebunden, inklusive Retry bei unbekanntem/gesperrtem/fehlgeschlagenem Stand, erneutem Abgleich nach 409 und wirkungslosen späten Antworten.
- Echte PostgreSQL-/HTTP-/Prozessprüfungen umfassen V10→V11 auf frischer und befüllter Datenbank, atomare Teil-/Commitfehler, Rollen/Konten und beide in `pg_stat_activity` beobachteten Lock-Reihenfolgen. Der verzögerte alte v1-GET wird vor dem ersten tatsächlichen negativen Commit beendet; −30→70 verhindert weiterhin Rücknahme und Altstart.
- Die administrativ freigegebene HTTPS-Matrix verwendet ausschließlich synthetische Konten. Der gemeinsame Test-Recorder liest vollständige Origin-Header nur bei beendeten Access-POSTs; beim Reload abgebrochene GETs halten keine Header-Promises. Nach der Zustandsprüfung wartet der gehaltene PUT-Test auf den Editorfokus und beobachtet den Commit begrenzt.

## Spec Change Log

## Review Triage Log

Alle drei Ebenen abgeschlossen: Blind Hunter (B1–B10), Edge Case Hunter (E1), Verification Gap (keine Befunde). Jeder Hinweis vor Gruppierung einzeln gegen Code, Aufrufer und Tests geprüft.

| Befund | Urteil und Evidenz | Behandlung |
| --- | --- | --- |
| B1: 409 hält Mutation während Capability-GET offen | medium: `saveProgress()` wartet im sicheren 409-Zweig auf `loadCapabilities()`, erst danach läuft `operations.settle()`. Ein gehaltener GET blockiert Abbrechen/andere Mutationen und Navigation markiert die bereits verworfene Mutation als unbestätigt. | patch: sicheren Fehlschlag sofort abschließen, Funktionsabfrage unabhängig weiterführen |
| B2: Retry verliert Tastaturfokus | medium: `@if` entfernt den fokussierten Button beim Wechsel nach `loading`; danach gibt es keinen Ersatzfokus. | patch; gemeinsame Ursache mit E1 |
| B3: Capability-Fehler ohne neutrale Betriebsspur | low: der neue Exceptionhandler protokolliert anders als `SavingsGoalV2Errors` keine Fehlerkategorie. Ein entzogenes Funktionsrecht erzeugt nur die neutrale 500-Antwort, ohne dem Betreiber den betroffenen Handler zu nennen. | patch: feste Kategorie ohne Finanzwerte, SQL oder Exceptiontext protokollieren |
| B4: unbegrenztes Warten auf Versionslock | medium: ein administrativ offen gehaltener Lock kann Poolverbindungen binden. Allgemein fehlende serverseitige SQL-/Lockzeitgrenzen bestehen jedoch bereits in `FinanceTransactions` bei Kontosperren; der reguläre Guard beendet API/DB-Arbeit vor Versionsänderung. Keine langsame Nutzeroperation innerhalb der neuen Versionssperre nachgewiesen. | defer: bestehendes Timeout-/Poolthema anhand Lastprofil bewerten |
| B5: Schalter true ohne Stilllegung nicht per negativer HTTP-Mutation geprüft | medium: `FinanceMigrationIT` prüft nur Capability false; die vorhandenen HTTP-409-Fälle laufen mit geschlossenem Standardflag. Der ausdrücklich geforderte kombinierte Abwehrfall fehlt. | patch: vorhandene kompatible HTTP-Matrix mit eingeschaltetem Flag und unverändertem Marker nachweisen |
| B6: Funktionsentzug nach negativer Nutzung nicht durch Neustart geprüft | medium: die ausgeschaltete Instanz in `SignedProgressIT` prüft nur Capability. Lesen bestehender Negativwerte, 409, positiver Ersatz und erhaltene Rückfallgrenze nach Abschalten sind nicht gemeinsam nachgewiesen. | patch: vorhandenen echten Prozess-/Rücknahmefall erweitern |
| B7: fremde/fehlende ID erst nach gesetztem Marker geprüft | medium: vor den beiden 404-Versuchen ist `signed_progress_used` bereits true; eine fälschlich vorgezogene Markierung wäre so nicht erkennbar. | patch: beide neutralen Versuche vor erster Nutzung samt Marker false prüfen |
| B8: schwächerer/unvalidierter Constraint nicht geprüft | medium: der Test ersetzt nur durch den alten nichtnegativen Constraint. Gleichnamiger permissiver Constraint und exakter `NOT VALID`-Constraint fehlen, obwohl beide gesperrt bleiben müssen. | patch: beide gezielten Gegenproben ergänzen |
| B9: abgebrochene Access-POSTs fehlen im v2-Recorder | medium: POST-Methode/Pfad werden erst bei `requestfinished` erfasst; eine zusätzliche abgebrochene v1-Anfrage könnte dem Ausschließlich-v2-Nachweis entgehen. | patch: alle Access-Versuche beim Start unabhängig von vollständigen Headern erfassen |
| B10: mobile Tastaturgrenze präzisieren | low: Viewport und `pressSequentially()` prüfen Browser-Eingabe und HTML-Eingabehilfe, aber keine reale Smartphone-Softwaretastatur. | patch: Grenze im Betriebs-/Prüfnachweis ausdrücklich dokumentieren |
| E1: fokussierter Capability-Retry verschwindet | medium: bestätigt denselben DOM-/Fokuspfad wie B2; ein eigener Chromium-Versuch des Reviewers wurde von der Sandbox verhindert und wird nicht als Prüfnachweis gezählt. | patch; mit B2 gruppiert |
| R1: temporäre Katalog-/Typobjekte im Definer-Suchpfad | high: eigener isolierter PostgreSQL-18.6-Gegenbeweis mit unveränderter V11-Funktion und unprivilegierter Runtime samt TEMP-Recht. Ein temporäres `pg_constraint` kehrt einen tatsächlich falschen Schema-Nachweis um; eine View mit Invoker-Funktion schreibt im Kontext `tnbp_migrator` in eine der Runtime nicht beschreibbare Probetabelle. Auch ein temporärer `regclass`-Domain kann den unqualifizierten Cast beeinflussen. Quelle und laufender Build blieben dabei unverändert. | patch: `pg_temp` ausdrücklich zuletzt setzen, Katalog-/Typzugriffe qualifizieren und beide Gegenproben als Rechte-Regression absichern |

Keine Absichts- oder Planlücke: alle angenommenen Korrekturen sind lokale Änderungen ohne neue öffentliche Schnittstelle oder neue fachliche Zustandsgrenze. Die Review-Patches werden anschließend mit den vorgeschriebenen Checks vollständig geprüft.

### Fortgesetztes Review am 06.11.2026

Alle drei Ebenen erneut gemeinsam gestartet und vor der Triage vollständig eingesammelt: Blind Hunter (N1–N10), Edge Case Hunter (keine Befunde), Verification Gap (V1). Grundlage: vollständiger Arbeitsstand gegen `5b6d37fb30cffd04ecb64a5270b64ee15d7d8fb3`, Diff `/tmp/tnbp38-review-gl_cnkd7.patch` (153397 Byte). Die einzelnen Urteile wurden vor der Gruppierung anhand der Aufrufer und vorhandenen Nachweise gefällt.

| Befund | Urteil und Evidenz | Behandlung |
| --- | --- | --- |
| N1: aktuelle Rollen-/RLS-Drift schließt Capability nicht | false: die Funktion vergleicht ausdrücklich den aktuellen dauerhaften Beleg mit dem Startbeleg und zusätzlich den echten Constraint. Eine administrative RLS-/ACL-Änderung am laufenden System ist kein unterstützter Wechselweg; Runtime kann diese Änderung nicht selbst ausführen. Der reguläre Guard stoppt vorher und bindet den neuen Schema-/Rollenstand. Vollständige laufende Abwehr außerplanmäßiger Administratoränderungen wurde nicht zugesagt; bestehende ACL-/Policy-Härtung bleibt gesondert erfasst. | verworfen |
| N2: native Eingabe scrollt das führende Minus aus dem Ausschnitt | false: der native einzeilige Editor behält den vollständigen zugänglichen Wert einschließlich Minus und erlaubt die Navigation zu jedem Zeichen; es gibt keine Kürzung des Entwurfs. Gleichzeitige Anzeige sämtlicher Zeichen innerhalb einer einzeiligen Eingabe ist keine zusätzliche Fachregel. Die vollständige gespeicherte Zahl wird umbrechend ausgegeben. | verworfen; Home-/Wertabgleich im bestehenden Extremwertablauf ergänzt |
| N3: Fortschrittsvertrag beschreibt weitere 409-Bedingungen nicht vollständig | low: Operation, Requestfeld und 409-Text nennen nur die Versionsbarriere; nach Stilllegung können auch Funktionsschalter oder Beleg/Schema sperren. | patch: drei Beschreibungen samt Capability-Verweis präzisieren |
| N4: tatsächliche Screenreaderansagen nicht ausgeführt | maybe-false, mögliche Auswirkung medium unverified: ARIA-Snapshots, Labels, Fokus und Axe belegen die programmatische Ausgabe; ein Fehler einer konkreten gesprochenen Ausgabe wurde nicht gezeigt. Nur ein tatsächlicher assistiver Lauf kann das entscheiden; die Grenze war bereits ausdrücklich dokumentiert. | defer: konkreten Screenreaderlauf gesondert nachweisen; keine gesprochenen Ansagen aus Automation ableiten |
| N5: reale Smartphone-Softwaretastatur nicht geprüft | low: carried aus B10, gleiche Behauptung und unveränderte Dokumentationsstelle. Die Automation belegt ASCII-Eingabe und `inputmode=text`, keine reale Softwaretastatur; die Grenze wurde bereits ergänzt. | bestehendes patch beibehalten; keine erneute Korrektur oder Zurückstellung |
| N6: freigegebene Reflow-Matrix prüft nicht alle offenen Zustände | medium: gemeinsame Editor-/Fehler-/Dialogprüfungen existieren in regulären Browserfällen, der echte freigegebene Ablauf prüft Reflow jedoch hauptsächlich an der geladenen Karte. | patch: vorhandenen Übergangsablauf um offene Extremwerte, Feldfehler und negativen Löschdialog erweitern |
| N7: freigegebener Ablauf verwendet Klicks statt kompletter Tastaturfolge | medium: gemeinsame Fokus-/Dialogtests existieren, aber im tatsächlich freigegebenen Ablauf fehlen Tabfolge und Dialogumlauf. | patch: vorhandene Aktionen per Tastatur auslösen und Fokus vor/nach signiertem Speichern und Löschen prüfen; mit N6 gemeinsam ergänzen |
| N8: negative Nutzung, Löschen und Neustart nicht gemeinsam belegt | medium: der Prozessnachweis prüft bisher −30 → 70 und dauerhafte Sperre; der Browser löscht ein negatives Ziel, prüft aber keine administrative Rücknahme danach. | patch: bestehenden Prozessfall um Löschen, Neustart, erhaltenen Marker und verweigerte Altwege erweitern |
| N9: Funktionsrechtsentzug nicht im Schreibpfad geprüft | medium: der vorhandene Fall liest nur die neutrale Capability-500-Antwort. | patch: negativen PUT ohne Fortschritts-/Markerwirkung sowie weiterhin erfolgreichen positiven Ersatz im selben Fall prüfen |
| N10: Verification-Tabelle enthält ältere Zahlen | low: historische Ergebnisse sind korrekt datiert, die neuen Review-Patches haben noch keinen Abschlussnachweis. Die vorgeschlagene Änderung betrifft ausschließlich diese Build-Spec. | nach Workflow als Review-Fix verworfen; aktuelle Ergebnisse werden regulär nach den Prüfungen angehängt |
| V1: ausgeschalteter Standard nach Stilllegung nicht ohne Konfiguration geprüft | medium: pre-verified; explizites `false` und Konstruktorargumente würden eine versehentliche Änderung des YAML-Standardwerts nicht erkennen. | patch: echten Prozess ohne beide Feature-Umgebungsvariablen starten, Abwesenheit der Overrides anhand ausschließlich der Variablennamen prüfen; Capability false, PUT 409, unveränderter Stand/Marker und positiver Ersatz bleiben nachgewiesen |

Keine neue Absichts- oder Planungslücke. Die Korrekturen ergänzen bestehende Beschreibungen und ausführbare Fälle ohne neue öffentliche Schnittstelle oder fachlichen Zustand.

## Design Notes

Keine Absichtsfragen; ausschließlich synthetische Testdaten. Freigabe kombiniert Schalter (Standard false), frisch verglichenen vollständigen Startbeleg (Release/Schema/Rollen) und tatsächlichen signierten Constraint. Capability prüft lesend. V11 ergänzt eine schmale SECURITY-DEFINER-Prüffunktion mit festem Suchpfad und ausschließlich runtime-EXECUTE; negative Mutation sperrt damit die Versionszeile ohne zusätzliche Tabellenrechte. Danach Marker und Zielersatz auf derselben Verbindung ausführen; Marker bleibt ab erstem negativen Commit monoton.

## Verification

- `./scripts/check-contract.sh`
- `python3 -m unittest discover -s scripts/tests -v`
- `./backend/mvnw -f backend/pom.xml verify`
- `npm --prefix frontend run e2e`
- `npm --prefix frontend run e2e:transition`

Erwartung: alle Prüfungen erfolgreich. Automatisierte assistive Nachweise von tatsächlich ausgeführtem Screenreaderlauf unterscheiden.


### Tatsächlich ausgeführte Nachweise am 31.10.2026

| Prüfung | Ergebnis |
| --- | --- |
| `./scripts/check-contract.sh` | Erfolgreich: v1/v2 validiert, gegen ihre eigene Basis kompatibel, generierte Java-/Angular-Verträge kompiliert und SPA gebaut. |
| `python3 -m unittest discover -s scripts/tests -v` | 19 Prüfungen erfolgreich. |
| Backend-Gesamtlauf `verify` | 44 Unit-/Architekturtests erfolgreich; 301 IT ausgeführt, dabei zunächst zwei Fehler in angepassten Testtreibern: erwartete synthetische Maximalversion noch 11 statt 12 und nicht normalisiertes `sys.argv` im `runpy`-Treiber. Beide korrigiert und gezielt erfolgreich nachgeprüft; der vollständige Gesamtlauf wurde danach nicht wiederholt. |
| Gerichtete Backend-Nachprüfung | 14 IT erfolgreich: `SignedProgressIT` (8), `FinanceMigrationIT` (4), `ReleaseTransitionIT.folgemigrationWirdVorFreigabeGebundenUndLaesstWiederholtenNeustartZu` (1) und `AdministrativeSerializationIT.statischerUebergangsfehlerStopptErsatzguardSofortUndErlaubtRetry` (1). Einschließlich beider neuen V10→V11-Fälle und des Rücknahme-zuerst-Falls. |
| Abschließende `SignedProgressIT` | 8 IT erneut erfolgreich, nachdem auch der signierter-Commit-zuerst-Fall seine tatsächliche Lock-Warteposition beobachtet. |
| `npm --prefix frontend run e2e` | Alle 207 Browserfälle erfolgreich. |
| Gezielte Browsernachprüfung nach Unknown-Retry-/Recorderkorrektur | 6 Fälle erfolgreich: Capability-Ladefehler/ungültige Antworten/Retry/echter 409, späte Freigaben nach Abmeldung/Kontowechsel/Tokenablauf, Identitätsreply→offline→online→Retry sowie vollständiger v2-/Origin-/CSRF-/Bearer-Nachweis. |
| Abschließendes `npm --prefix frontend run e2e:transition` | Alle 5 Fälle gemeinsam erfolgreich (1,7 Minuten). Echte administrative Stilllegung, persistierte −30/0/70/150 Euro, sichere Min-/Max-Werte bei Ein-Cent-Ziel, vier Größen/200-%-Text, Zielbearbeitung/Datum-entfernen/Löschen, unveränderter Monatsrest, ausschließlich v2 und signierte Fehler-/Sitzungsgrenzen. |

Die Transition-Vorläufe fanden zwei Prüfablaufprobleme: ein offenes `request.allHeaders()` bei einem Reload-GET und einen zu frühen Enter-Tastendruck vor dem angeforderten Editorfokus. Der Recorder erfasst vollständige Header jetzt nur für beendete Access-POSTs; der gehaltene PUT-Nachweis wartet auf Fokus und beobachtet den Commit mit einer Grenze. Der abschließende gemeinsame Fünferlauf war erfolgreich.

**Assistive Evidenz:** Ausgeführt wurden Tastaturbedienung, ARIA-Snapshots mit tatsächlichen signierten Beträgen/Prozenten, tatsächliche Balkenfüllung, Reflow bei 320×568/390×844/768×1024/1280×800 und 200-%-Text, Größenprüfung für Felder/Aktionen sowie Axe. Ein tatsächlicher Screenreaderlauf wurde nicht durchgeführt und wird aus diesen automatisierten Nachweisen nicht abgeleitet. Die bestehenden Voraussetzungen vor echten Nutzerdaten/Produktion bleiben unverändert.

Diese Prüfevidenz ist keine Produktionsfreigabe.

### Eigenständiger Abgleich vor Review

- Gesamtdiff gegen die unveränderte Basis selbst gelesen: `/tmp/tnbp38-implementation-qbw7yhb2.patch`; sämtliche späteren Änderungen vollständig über `/tmp/tnbp38-audit-delta.patch` mit dem finalen Stand `/tmp/tnbp38-final-g9aua4af.patch` abgeglichen. Alle acht Aufgaben gegen den tatsächlichen Code bestätigt. Eingefrorene Absicht unverändert SHA-256 `6f1994e07a073b59e87c86596c4c019a68e3b08b163b8660a488cf570d451a11`.
- Alle sechs Matrixzeilen mit ausgeführten erfolgreichen Fällen abgeglichen: Freigabe-/Belegfehler und neutrale Ressourcen in `SignedProgressIT`; echter Ersatz, Anzeige und mobile Eingabe im signierten Übergangsablauf; atomare Fehler und beide beobachteten Sperrreihenfolgen in `SignedProgressIT`; Commitverlust und späte PUT-Antwort im Übergangsfehlerfall; Capability-/Sitzungsgrenzen einschließlich Offline-Unknown in den fokussierten Browserfällen.
- Protokolle sowie die beiden zuvor fehlgeschlagenen Testnamen und die abschließend fehlerfreien XML-Berichte selbst geprüft. 305 unterschiedliche IT über Gesamt-/Korrekturläufe, 208 unterschiedliche reguläre Browserfälle und fünf gemeinsam erfolgreiche Übergangsfälle bestätigt. Archivierter v1-Vertrag und V1–V10 unverändert.

### Abschlussnachweise am 06.11.2026

Fortgesetzt auf `codex/story-3-8-signierter-fortschritt` mit HEAD `5a6c54397a0d1d6d746dce01c18ff0b6acd6de5b`; die unveränderte Storybasis bleibt `5b6d37fb30cffd04ecb64a5270b64ee15d7d8fb3`. Die bereits vorhandene Umsetzung und sämtliche vorbereiteten Review-Korrekturen wurden einbezogen. Nach dem Backend-Gesamtlauf änderten sich ausschließlich Vertragsbeschreibungen, Tests und Nachweisdokumentation; die ergänzten Backendfälle wurden danach gezielt erneut kompiliert und ausgeführt.

| Prüfung | Tatsächliches Ergebnis |
| --- | --- |
| Abschließendes `./scripts/check-contract.sh` | Erfolgreich: v1/v2 gültig und je eigener Basis kompatibel, beide generierten Java-/Angular-Schnittstellen kompiliert, statische SPA gebaut. Protokoll `/tmp/tnbp38-contract-final.log`. |
| Abschließendes `python3 -m unittest discover -s scripts/tests -v` | Alle 19 Prüfungen erfolgreich. Protokoll `/tmp/tnbp38-python-final.log`. |
| Vollständiges `./backend/mvnw -f backend/pom.xml verify` | Erfolgreich: 44 Unit-/Architekturtests und 308 Integrationstests, keine Fehler oder übersprungenen Fälle. Darunter 59 echte Release-/Übergangsfälle und 20 Fälle administrativer Serialisierung. Protokoll `/tmp/tnbp38-backend.log`; vollständige XML-Berichte vor dem gezielten Nachlauf unter `/tmp/tnbp38-backend-full-h9b4d8dv` gesichert. |
| Ergänzte Backend-Reviewnachweise | Erfolgreich: alle 11 Fälle in `SignedProgressIT` und `ReleaseTransitionIT.echtesAelteresBinaryBrauchtExaktenPruefstandUndMarkerVerhindertJedenRueckfall` (insgesamt 12 IT). Einschließlich temporärer Katalog-/View-/Domain-Angriffe, fehlgeschlagener Schreibprüfung ohne Teilwirkung, positivem Ersatz trotz Funktionsausfall, echtem Neustart ohne Feature-Override sowie Löschen/Neustart mit ausdrücklich markerbedingter Rücknahmeverweigerung und gesperrter Altzertifizierung. Protokoll `/tmp/tnbp38-review-backend.log`. |
| Abschließendes `npm --prefix frontend run e2e` | Alle 211 Fälle gemeinsam erfolgreich (3,7 Minuten). Enthält den sicheren 409 ohne gehaltene Mutation, bleibenden Retry-Fokus, gesperrte Fehlerzustände bei 200 % Text sowie den negativen Kontrolltest für abgebrochene v1-Access-POSTs. Protokoll `/tmp/tnbp38-e2e-complete.log`. |
| `npm --prefix frontend run e2e:transition` | Alle fünf Fälle gemeinsam erfolgreich (2,0 Minuten). Echter administrativer Übergang, signierte Persistenz in allen vier Größen bei 200 % Text, Home-/End-Navigation im vollständigen Extremwert, Tabfolge/Fokus, offene Fehler-/Dialogzustände ohne horizontalen Seitenlauf, negative Ziellöschung sowie verlorene Bestätigung und Sitzungsgrenzen. Protokoll `/tmp/tnbp38-transition.log`. |
| Gezielte Stabilitätsprüfung der Navigation | Alle vier Fälle von `Navigation erhält die Sperre …` jeweils dreimal erfolgreich (12 Ausführungen). Protokoll `/tmp/tnbp38-navigation.log`. |

Die Browser-Vorläufe fanden ausschließlich Probleme der Prüfsteuerung: Die neu ergänzte Tastaturfolge wartete zunächst nicht auf die Fokus-Rückgabe nach Speicherung und erwartete nach Löschen direkt das Namensfeld statt der vorgesehenen Anlegeaktion. Beides ist im gemeinsamen Ablauf richtig synchronisiert und im abschließenden regulären sowie signierten Lauf erfolgreich. Ein bestehender Navigationstest kollidierte außerdem mit einer noch ausstehenden Fokus-Rückgabe nach dem Prüfabruf. Seine Vorgangssperre wird jetzt durch eine stabile Klickauslösung geprüft; die ausdrückliche Enter-Bestätigung samt Zielfokus bleibt im bestehenden Viergrößen-/Kontrast-/Fokustest eigenständig nachgewiesen. Danach bestand die komplette reguläre Suite ohne Retry.

Alle angenommenen Review-Patches B1–B3/B5–B10/E1/R1 und N3/N6–N9/V1 sind umgesetzt und geprüft. B4 sowie der unbestätigte tatsächliche Screenreaderfall N4 stehen getrennt in `deferred-work.md`; es werden keine tatsächlichen Screenreaderansagen oder reale Smartphone-Softwaretastaturen aus den Browsernachweisen abgeleitet. Diese manuellen Nachweisgrenzen und die offenen Produktionsbedingungen bleiben ausdrücklich erhalten.

Abschließend `git diff --check`, unveränderten v1-Vertrag und unveränderte V1–V10-Migrationen bestätigt. Der eingefrorene Absichtsblock bleibt SHA-256 `6f1994e07a073b59e87c86596c4c019a68e3b08b163b8660a488cf570d451a11`. Push, GitHub-Abgleich und Produktionsrollout wurden nicht ausgeführt. Der Build-Workflow setzt diese Spec auf `done` und den Sprintstatus auf `review`; die fachliche beziehungsweise manuelle Abnahme bleibt dadurch vom technischen Abschluss unterscheidbar.
