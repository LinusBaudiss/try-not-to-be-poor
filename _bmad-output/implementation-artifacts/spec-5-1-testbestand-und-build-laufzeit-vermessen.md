---
title: '5.1 Testbestand und vollständige Build-Laufzeit reproduzierbar vermessen'
type: 'chore'
created: '2026-11-14'
status: 'done'
baseline_commit: '8f66421be3b7090c5cd384c9679657d9a17a6b3f'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-5-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Für das Testrefactoring fehlen ein vollständiges fallbezogenes Inventar und vergleichbare aktuelle Laufzeitnachweise. Story 5.1 schafft die prüfbare Grundlage für 5.2 bis 5.5 gemäß ihren acht Abnahmekriterien.

**Ansatz:** Den vorhandenen Prüfverbund inventarisieren, Anforderungen und geschützte Grenzen zuordnen und mit einem wiederholbaren Messwerkzeug vermessen. Aus erfolgreicher Baseline, separater Abdeckungsmessung und verfügbaren CI-Daten konkrete Refactoring-Kandidaten ableiten.

## Boundaries & Constraints

**Immer:** Referenzrevision vollständig festhalten; lokale Pflichtgruppen in fester Reihenfolge ausführen: Python, Vertragsprüfung samt Generatoren/Kompilierung/SPA, Backend-verify, Browser normal/Übergang/Automatik. Warme Abhängigkeitscaches sind erlaubt; Warm-up, mindestens drei erfolgreiche Messläufe und zusätzlicher bereinigter Lauf sind erforderlich. Fehlversuche separat dokumentieren. Setup und Mehrfach-Builds bleiben innerhalb der Messzeit. Codeabdeckung separat instrumentieren; keine instrumentierten Zeiten als primäre Baseline verwenden.

**Niemals:** Assertions abschwächen, Pflichtgruppen entfernen, Produktverhalten/Verträge ändern, Produktionsfreigaben erteilen oder GitHub-Issues abgleichen. Offene Stories 4.6–4.8 bleiben offen. Fehlende CI-/Abdeckungsnachweise verhindern eine unbegründete Fertigmeldung. Verbindliche Nutzerentscheidung vom 14.11.2026: maximal 900 Sekunden (15 Minuten) Median des vollständigen lokalen Prüflaufs; ersetzt die ursprüngliche 30-%-Planungsannahme. Dieses absolute Ziel darf nicht stillschweigend angehoben werden.

## I/O & Edge-Case Matrix

| Zustand | Ergebnis | Fehlerbehandlung |
| --- | --- | --- |
| Voraussetzungen erfüllt | Pro Lauf Revision, Umgebung, Cache, Gruppenzeiten und Logs; Median nur erfolgreicher vollständiger Läufe | Fehlerhafte Läufe getrennt halten |
| Fehlendes Werkzeug, Portkonflikt oder gescheiterte Gruppe | Benannte Voraussetzung beziehungsweise Gruppe und Fehlerstatus | Kein Leistungsnachweis |
| Geerbte, parametrisierte oder geschleifte Fälle | Stabile Fallreferenzen mit Variante und Ausführungspfad | Ungeklärte Discovery sichtbar markieren |
| Fehlender CI-Zugang oder offene Produktabnahme | Sichtbare Nachweislücke | Keine erfundenen Werte oder Abdeckung |

</frozen-after-approval>

## Code Map

- `backend/pom.xml`, `backend/src/test/java/de/linus/tnbp/`: Surefire/Failsafe, zwei Generatoren; sechs V2-Klassen erben V1-Matrizen; Coverage über opt-in Profil separat erfasst.
- `frontend/package.json`, `frontend/playwright*.config.ts`, `frontend/e2e/`: drei Browsergruppen, keine Unit-Abdeckung.
- `scripts/check-contract.sh`, `scripts/start*e2e*.sh`, `scripts/tests/`: vorhandene Befehle/Fixtures; wiederholte Builds und Generierung erfassen.
- `.github/workflows/ci.yml`: sechs Jobs, Surefire in beiden Backend-Jobs.
- Monatsfachregeln, Architektur AD-8/9/10 und Story-Specs unter `_bmad-output/`: Schutzanforderungen und Regressionen.

## Tasks & Acceptance

- [x] `scripts/test-baseline.py` — Vorprüfung, Messläufe, Logs/Revision/Umgebung, Phasenzeiten, Median und Fehlerstatus implementieren.
- [x] `scripts/tests/test_test_baseline.py` — Fehlerfälle, Vollständigkeit, Median und Duplikatzählung prüfen.
- [x] `_bmad-output/implementation-artifacts/test-baseline/` — versioniertes Inventar/Matrix: stabile Fall-ID, Quelle/Variante/Vererbung, Anforderung/AC, Beobachtung, Risiko, Zieltestart, verbleibende Integration und späterer Ersatznachweis; alle 17 Monatsfälle und Architekturpräzisierungen zuordnen.
- [x] Dort Warm-up, drei erfolgreiche vollständige Messungen und bereinigten Lauf ablegen; Setup/Generierung/Kompilierung/Prüfkosten unterscheiden.
- [x] `backend/pom.xml` — separat aktiviertes Coverage-Profil; generierten Code ausschließen, identischen Vergleichsnenner dokumentieren; Frontend-Lücke ausweisen.
- [x] Baseline-Bericht — verfügbare vergleichbare CI-Läufe lesend auswerten; kritischen Pfad, Jobzeitsumme und aktuelle Kosten von ReleaseTransitionIT/AdministrativeSerializationIT erfassen; fehlende Nachweise offen halten.
- [x] `README.md`, Baseline-Bericht — Bedienung, Szenariozählregel je Backend/Frontend, geschützte Integrationen und spätere Fehlervarianten dokumentieren; 5.2–5.4 priorisieren, absolutes Ziel von 900 Sekunden und erforderliche Einsparung gegenüber der Baseline ausweisen und Erreichbarkeit begründen.

**Abnahme:** Alle acht AC der Story 5.1 bleiben verbindlich:

- Angenommen der Bestand liegt vor, wenn Quellen und Discovery abgeglichen werden, dann sind Fallvarianten, Mehrfachausführungen und Anforderungszuordnung vollständig (AC-1/2).
- Angenommen erfolgreiche Läufe liegen vor, wenn sie ausgewertet werden, dann sind Baseline, CI-Kosten und Ziel nachvollziehbar (AC-3–5).
- Angenommen die Matrix vorliegt, wenn Schutz und Coverage geprüft werden, dann bleiben reale Grenzen, Regressionen und offene Abnahmen sichtbar (AC-6/7).
- Angenommen eine andere Person folgt der Anleitung, wenn sie die Befehle ausführt, dann erhält sie reproduzierbare Ergebnisse oder klare Fehlerstatus (AC-8).

## Implementation Notes

- Messwerkzeug mit fester Reihenfolge aller sechs Pflichtgruppen, Warm-up/drei Messungen/bereinigtem Lauf, Monotonzeit, Logs, Revision/Hashmanifest, optionalen inklusiven Vertragsphasenzeiten, Fehlerstatus und Median ausschließlich vollständiger erfolgreicher Messungen umgesetzt. Opt-in JaCoCo-Profil (0.8.14) ergänzt; generierte v1/v2-Vertragsklassen ausgeschlossen.
- Nachweise/Inventar/Monatsmatrix/CI-Rohdaten und AC-Resttabelle unter `test-baseline/REPORT.md`; README beschreibt eigenständige Bedienung. Keine Assertions oder Produktverträge verändert, keine Pflichtgruppe entfernt, kein GitHub-Abgleich.
- JUnit-Discovery: 371 Methoden-/Template-Ausführungspfade einschließlich sechs Vererbungsmatrizen, 0 fehlende/zusätzliche gegenüber Quelle. Drei Playwright-Discoverygruppen erfassen 320 Ausführungen. Parameter, konstante/namentlich initialisierte Loopvarianten und lesbare Assertionketten sind archiviert. Nach Reviewnacharbeit sind alle 746 Quellenfälle im expliziten `reviewed-scenario-manifest.json` konkreten Story-ACs, Eingaben/Erwartungen und primären Szenario-IDs zugeordnet; keine heuristische Keywordzuordnung. Refresh verweigert nicht zugeordnete/geänderte Fälle. Die übergreifende fachliche Konsolidierung bleibt offen; vorläufige Quellgruppen sind keine anerkannte Fachquote. Vier Fail-closed-Regressionsprüfungen bestehen.
- Alle 17 Monatsfälle sowie AD-8/9/10-Präzisierungen handgeprüft zugeordnet; offene Stories 4.6–4.8 unverändert offen.
- Vollständige lokale Messung blockiert: Vorprüfung liefert EPERM beim Socket-Bind auf 8080/4200 (IPv4/IPv6). Keine erfolgreichen Gesamtzeiten, kein lokaler Median, kein unbegründetes Sekundenziel. Coverage ebenfalls offen: JaCoCo im Cache nicht vorhanden; mit schreibbarer Cachekopie scheitert Maven-Central-DNS. Fehlversuche separat abgelegt.
- CI ausschließlich lesend: drei aktuelle erfolgreiche Läufe mit identischem ausführbarem Quellumfang; Median kritischer Pfad 1129 s, Jobzeitsumme 1984 s. ReleaseTransitionIT/AdministrativeSerializationIT mit aktuellen Klassenzeiten und Cachebeleg erfasst. Diese Werte ersetzen keine lokale Baseline.
- Verifikation: 33 Python-Tests erfolgreich. Offline Backend-test-compile erfolgreich. 48 Backend-Unit-/Architekturausführungen (Prozesshilfe ausgeschlossen) mit explizitem gecachtem Mockito-Agent erfolgreich; erster Standard-Teillauf mit vier umgebungsbedingten Self-Attach-Fehlern separat erhalten. Kein vollständiges verify-/Browser-/Coverage-Ergebnis behauptet. Status bleibt in-progress.

## Spec Change Log

## Review Triage Log

| ID | Urteil | Route | Geprüfter Befund / Begründung |
| --- | --- | --- | --- |
| B1 | medium | patch | Runner erfasst nur CPU-Anzahl/Plattform; spätere Same-Host-Prüfung ohne stabilen Fingerabdruck/CPU-Modell nicht möglich. Metadaten ergänzen; historische Werte nicht erfinden. |
| B2 | medium | patch | Effektive Affinität, Speicher-/cgroup-Grenzen fehlen; gleicher cpu_count beweist keine gleichen Ressourcen. Ergänzung für neue Serien, alte Einschränkung bleibt sichtbar. |
| B3 | medium | patch | os.getloadavg wird nur bei Serienstart gelesen; neue Serien brauchen Randwerte je Lauf. Bestehende Streuung bleibt als Messgrenze dokumentiert. |
| B4 | medium | patch | Inputhashes werden nur initial erzeugt; eine während der Serie geänderte Quelle könnte in den Median gelangen. Nachlaufvergleich mit invalidierendem Fehlerstatus ergänzen. |
| B5 | medium | patch | Unversionierte Eingaben werden nur gehasht, nicht archiviert; Hash allein rekonstruiert keinen Quelltext. Relevante unversionierte Laufzeiteingaben sichern; jüngste Referenz hatte versionierte Laufzeitquellen plus Patch. |
| B6 | medium | patch | execute_group behandelt KeyboardInterrupt/Timeout, aber kein SIGTERM; Prozessgruppen können beim Abbruch überleben und Status running stehenbleiben. Signal-/Persistenzpfad prüfen und korrigieren. |
| B7 | medium | patch | Nach SIGTERM wird nur auf den Gruppenleiter gewartet; dessen früher Exit überspringt SIGKILL für ignorierende Kinder. Verbleibende Gruppe unabhängig vom Leiter beenden. |
| B8 | medium | patch | Exitcode 0 alleine prüft keine leere oder reduzierte Discovery. Aktuelle beabsichtigte Testmenge gegen tatsächliche Berichte/Browser-Discovery validieren; gültige neue Tests nicht durch feste Altzahlen blockieren. |
| B9 | medium | patch | Unbekanntes counting wird durch Filter still aus dem Nenner entfernt; Enumprüfung fehlt. Erlaubte counting/scope/Testart-Werte vor Quotenermittlung validieren. |
| B10 | medium | patch | REPORT enthält trotz erfolgreicher Serie aktuelle Offen-/Neustartanweisungen. Bericht auf aktuellen Ergebnisstand konsolidieren und historische Versuche klar abtrennen. |
| E1 | medium | patch | Bestätigt denselben Prozessgruppenfehler wie B7: Exit des Leiters garantiert kein Ende eines SIGTERM-ignorierenden Kindes. Gemeinsame Korrektur, eigener Befund bleibt protokolliert. |
| E2 | medium | patch | ET.parse in report_counts kann bei abgebrochener Ausgabe ParseError werfen, bevor Gruppenfehler dauerhaft gespeichert ist. Originalreport erhalten und diagnostizierten Fehlschlag persistieren. |
| E3 | medium | patch | FE-Inventar wird aus gecachter Playwright-Discovery gelesen; neue Spec ohne neue Discovery wird von existierenden Dateihashes nicht erkannt. Aktuelle/überprüfte Testquellmengen vor Cacheannahme vergleichen. |
| V1 | medium | patch | Verifikationslücke vorverifiziert: Orchestrierungstests mocken execute_group, kein realer Prozessbaum-Abbruchtest vorhanden. Gezielten kurzen Prozessbaumtest ohne Ports/DB ergänzen. Gleiche Ursache wie B6/B7/E1. |
| O1 | medium | patch | Eigener AC-Abgleich: FinanceMigrationIT startet Flyway direkt gegen PostgreSQL, keinen externen API-Prozess. Bisherige Prozessklassifikation war falsch; auf PostgreSQL korrigiert, realen Migrations-/Bestandsschutz konkretisiert und Fachnenner unverändert gelassen. |

Alle drei Reviewebenen vollständig eingegangen; keine Ebene übersprungen. Die Größenarithmetik des Blind-Reviews ist kein eigener Fehlerbefund. Die aufgezählten Zustände sind im bestehenden Code erreichbar; gezielte Regressionen prüfen die jeweiligen Korrekturen. Die vorhandenen erfolgreichen Rohmessungen wurden zusätzlich unabhängig auf tatsächliche Fallzahlen/Identitäten geprüft und bleiben unverändert.

## Verification

- `python3 -m unittest discover -s scripts/tests -v`: bestehende und neue Werkzeugprüfungen bestehen.
- Dokumentierter Messbefehl: Warm-up, drei vollständige erfolgreiche Läufe und bereinigter Lauf; sämtliche Pflichtgruppen enthalten.
- Separater Coverage-Befehl: Berichte und Ausschlüsse prüfbar, keine Verwechslung mit Laufzeitmessung.
- Inventar gegen Testdiscovery, Quellvarianten und Story-Abnahmen abgleichen; CI-Zugang ausschließlich lesend verwenden.

- Lokale Diffprüfung: veraltete Maven-Reports werden vor Backend-Ausführung bereinigt; unsichere Ausgabepfade innerhalb der bereinigten Build-Verzeichnisse werden abgewiesen. Zwei zusätzliche Werkzeugtests bestehen. Semantische Quellgruppen bleiben ausdrücklich vorläufig; cross-method/cross-layer Fachduplikate sind noch unabhängig zu konsolidieren (`semantic_review_complete: false`). Git-Staging wegen schreibgeschütztem Index nicht möglich; temporärer Gesamtdiff erstellt. Kein formaler Workflowabschluss.

- Fortsetzung 2026-11-14 auf ausdrücklichen Nutzerauftrag: übergreifenden statischen Szenario-Abgleich abgeschlossen. Alle 746 Quellverweise und 99 innere Browser-Schleifen explizit zugeordnet; gleiche Regel-/Eingabe-/Beobachtungsklassen über Methoden hinweg konsolidiert, notwendige reale Grenzen erhalten. Bericht: [SCENARIO-REVIEW.md](test-baseline/SCENARIO-REVIEW.md). Der frühere Vermerk `semantic_review_complete: false` ist dadurch überholt; aktuell true ausschließlich für den statischen Abgleich. Zwölf Inventar-/Semantikregressionen erfolgreich. Baseline, Coverage und tatsächliche vollständige Ausführungsnachweise bleiben offen; Story weiterhin in-progress.

- Fortsetzung nach Nutzerlauf: Coverage-Ergebnisse aus `-Pcoverage clean verify` gesichert und ausgewertet: 49 Surefire + 433 Failsafe, alle erfolgreich; 34/34 erwartete Klassen. 96,816 % Zeilen- und 86,053 % Zweigabdeckung mit prüfbarem Nenner/Quell-/Instrumentierungsumfang. Herkunft: aktueller Checkout 630ad58c5ad688e6436d1c4edf1a4d354d63def5, vom Nutzer separat gestartet; kein zur Startzeit automatisch erfasster Coverage-Commit. Unveränderte Produkt-/Backend-Testquellen. Frühere Coverage-Blocker sind dadurch überholt.
- Nutzerlauf local-reference-01 ist im Python-Warm-up fehlgeschlagen. Root cause: globale Phasenvariable ließ isolierte Vertragsfixtures nach einem dort fehlenden Messskript suchen. Kleinste Korrektur: Variable ausschließlich für echte Vertragsgruppe setzen, sonst aus Gruppen-Umgebung entfernen; bestehender vollständiger Werkzeugablauftest prüft jede Gruppenumgebung. Alle 33 Python- und 12 Inventar-/Semantikprüfungen bestehen. Neuer vollständiger lokaler Lauf erforderlich; kein Median/Leistungsziel erfunden. Story bleibt in-progress.

- Auswertung nach erfolgreichem local-reference-02: Warm-up, drei Messungen und bereinigter Kontrolllauf bestehen; 33 Python/482 Backend/320 Browserausführungen je Lauf, identische Backend-Testidentitäten, keine Fehler/Skips. Baseline-Median 1755,133 s, unverändertes 70-%-Ziel 1228,593 s. Rohdaten plus Auswertung unter [LOCAL-BASELINE.md](test-baseline/LOCAL-BASELINE.md). Commit 630ad58c5ad688e6436d1c4edf1a4d354d63def5 plus gesicherter Korrekturpatch und Inputhashes; relevante Start-/Auswertungsquellen ohne Drift. Gruppen-/Vertragsphasenkosten und aktuelle XML-Klassendauern belegt. Prozesspaar 1145,868 s beziehungsweise 65,29 % des vollständigen Medianlaufs; reine Backend-Fachverlagerung allein reicht nicht für 30 % Gesamtersparnis. Weitere interne Prozess-/DB-Aufteilung ist aus den vorhandenen Logs nicht exakt ableitbar; Messgrenzen und Laststreuung dokumentiert. Kein formaler Workflowabschluss behauptet.

- Ausdrückliche Nutzerentscheidung 2026-11-14: maximal 15 Minuten. Die betreffende Zielvorgabe im freigegebenen Intent wurde auf Nutzerauftrag angepasst: absoluter vollständiger Median ≤ 900 Sekunden statt 70 % des Referenzmedians. Die bisherigen 70-%-/30-%-Angaben in den Implementierungsnotizen dokumentieren den historischen Stand und sind ersetzt. Epic TR-1, Stories 5.1/5.4/5.5, Kontext, Auswertung und Messwerkzeug sind entsprechend synchronisiert; keine Qualitäts-/Integrationsanforderung gelockert.

- Abschluss 2026-11-14: alle acht Kriterien anhand [ACCEPTANCE.md](test-baseline/ACCEPTANCE.md) geprüft. Drei unabhängige Reviewebenen, 15 einzeln protokollierte bestätigte Befunde einschließlich eigener Klassifikationskorrektur; alle behoben, nichts zurückgestellt. Aktuelle Tests: 42 Python plus 14 Inventar/Semantik; aktuelle Browser-Discovery 224/5/91, dynamischer Abgleich aller fünf historischen Backend-XML-Sätze 49/433 gültig. Originale Laufzeit-/Coverageprüfsummen unverändert. Setup-/Prozess-/PostgreSQL-/Restbereiche und CI-Schritte in [COSTS.md](test-baseline/COSTS.md) getrennt ausgewiesen; inklusive Messgrenzen explizit. Weitere interne Ursachenprofilierung und Erreichen von 900 Sekunden gehören in Folgegeschichten, keine verdeckte Qualitätslücke.
- Reviewkorrekturen: Host-/Ressourcendaten und Laufgrenzen, Quellidentitätsprüfung und konservierte unversionierte Eingaben, SIGTERM-/Prozessbaum-Cleanup, fehlerhafte XML-Evidenz, dynamische Discovery, Klassifikations-Enums, neue Testdateien trotz Cache und konsolidierte Dokumentation. FinanceMigrationIT als direkte PostgreSQL-Migrationsprüfung eingestuft. Neue Werkzeugregressionen bleiben Infrastruktur; Fachnenner/Unitquote unverändert. Schema 3 ersetzt die früheren neuen Schema-2-Angaben; historische Berichte nicht umgeschrieben.
- Technische Spec done; Projektstory review. Keine Produktionsfreigabe und keine Abnahme des 15-Minuten-Ziels; kein Push/GitHub-Spiegel. Commit-/PR-Unterlagen vorbereitet.

- Commit-Versuch nach Abschluss: `git add` scheitert an schreibgeschütztem `.git/index.lock`. Kein Staging/Commit/Push ausgeführt. Konkrete Commitnachricht commit-story-5-1.txt (`commit-story-5-1.txt`, historischer Entwurf entfernt; siehe Fortsetzungsvermerk) und PR-Entwurf (`pr-story-5-1.md`, historischer Entwurf entfernt; siehe Fortsetzungsvermerk) sind verfügbar; die technischen Prüfungen und der Storystatus bleiben davon unberührt.


## Fortsetzung: Nachweisarchiv und PR-Bereinigung (14.11.2026)

Die historischen Rohbelege bleiben unverändert im [geprüften Nachweisarchiv](test-baseline/ARCHIVE.md) zugänglich. Die lokale Bereinigung und Werkzeugkorrektur wird in [spec-pr-64-nachweise-bereinigen.md](spec-pr-64-nachweise-bereinigen.md) fortgeführt. Historische Pfade in dieser Spec beziehen sich auf den wiederhergestellten alten Archivbaum; damalige Prüfergebnisse, Fachzuordnungen, Ziele und Abnahmestände bleiben unverändert. Die früheren Commit-/PR-Entwürfe wurden nach Veröffentlichung von PR #64 entfernt.
