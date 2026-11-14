---
title: 'PR 64: Testnachweise auslagern und Werkzeuge korrigieren'
type: 'chore'
created: '2026-11-14'
status: 'done'
route: 'dispatch'
baseline_commit: 'cc9e34acb513c7a06eb9c677f6fda9e9c74277c6'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="Nutzer hat alle sechs vorgeschlagenen Schritte ausdrücklich beauftragt">

## Intent

PR #64 für Story 5.1 soll bei vollständig erhaltenen Nachweisen übersichtlich prüfbar werden. Rohdaten werden dauerhaft archiviert, der Branch bereinigt, Werkzeugfehler korrigiert und der veröffentlichte PR samt CI geprüft. Nutzerauftrag: „Mache alle Schritte nacheinander“.

## Boundaries & Constraints

Alle historischen Rohbelege unverändert erhalten. Vor Entfernen aus dem Branch muss der GitHub-Download vollständig geprüft sein. Keine Produktänderungen, Testabschwächung, Zieländerung oder Story-Abnahme. Kein Merge und kein GitHub-BMAD-Spiegel. Commit/Push und Aktualisierung von PR #64 sind ausdrücklich beauftragt. Das Archiv ist ein Nachweis-Prerelease ohne Produktionsfreigabe.

## I/O & Edge-Case Matrix

| Zustand | Erwartetes Verhalten |
| --- | --- |
| Archiv erfolgreich erneut geladen | Alle 484 Pfade/Größen/Hashes stimmen; Rohbelege dürfen aus dem Branch verschwinden |
| Git fehlt | Vorprüfung liefert Exit 2 und results.json mit benannter Voraussetzung, ohne Git-Aufruf oder Teststart |
| Neuer Messlauf | README verwendet freien ignorierten Ausgabepfad; Inventar und gezielte Prüfungen reproduzierbar |

</frozen-after-approval>

## Code Map

- `scripts/test-baseline.py`: Vorprüfung erkennt fehlendes git; `_main` ruft trotzdem revision/check_output/input_identity auf. Diese Aufrufe bei fehlendem git überspringen; Diagnose speichern.
- `scripts/tests/test_test_baseline.py`: bestehenden Vorprüfungsfehler-Test um fehlendes git erweitern, keine neue Fall-ID nötig.
- `_bmad-output/implementation-artifacts/test-baseline/`: Manifest, lesbare Matrizen, Auswertungen und notwendige Discoverydaten bleiben. Historische Rohdaten und redundante ableitbare Vollinventare ins Archiv.
- `.gitignore`, `README.md`: neue lokale Läufe in `.local/test-baseline/` mit eindeutigem Zeitstempel; generierte Ableitungen ignorieren.

## Tasks & Acceptance

- [x] Alle 484 versionierten Baseline-Dateien lokal archivieren, mit Manifest prüfen, veröffentlichen, herunterladen und vollständig erneut vergleichen.
- [x] Branch bereinigen: alle Rohlogs und Patchdateien; attempt-/recheck-/local-reference-01-Verzeichnisse; XML-, Exec- und JaCoCo-Webberichte aus coverage-reference/local-reference-02 entfernen. Behalten: coverage README/evidence.json/discovery-and-instrumented-costs.json sowie local-reference-02/results.json/analysis.json/input-sha256.json. Discovery nur backend.tsv und browser/transition/automation.json behalten. Redundante source-inventory.json, observation-ledger.json und browser-loop-evidence.json entfernen; source-matrix.csv, canonical-scenarios.csv und geprüftes Manifest behalten.
- [x] `ARCHIVE.md`, `archive-files.sha256.json` und `archive-SHA256SUMS` im Baselineverzeichnis: Inhalt, Prüfsummen, Release-/Downloadbefehle, sicheres Entpacken in getrenntes Verzeichnis, alter Pfadaufbau und bewusst behaltene Ableitungen dokumentieren. Originale Manifeste liegen in `/tmp/pr64-evidence/download/`. Release: https://github.com/LinusBaudiss/try-not-to-be-poor/releases/tag/evidence/story-5.1-cc9e34a . SHA-256 Archiv: f5c5a0806b0f2b45811777d840880ed5b39785814dfc593a2799d35b5443dfd4 .
- [x] README/Auswertungen auf Archiv verweisen, keine gebrochenen Markdownlinks. Historische Specnotizen nur durch Fortsetzungsvermerk ergänzen. Überholte PR-/Commitentwurfsdateien entfernen. Schutz gegen erneutes Einchecken der Rohartefakte durch konkrete Ignoremuster, keine benötigten Quell-/Zuordnungsdateien ignorieren.
- [x] Fehlendes git korrigieren und gezielt testen. Nur betroffene Infrastrukturhashes im geprüften Manifest aktualisieren; Fachzuordnungen/Nenner unverändert erhalten. Keine neue Infrastruktur-Testmethode anlegen.
- [x] Python-/Inventarprüfungen, Generierungs-Reproduktion und Diffprüfung ausführen; erforderliche Browser-/Discoverydaten bleiben nutzbar. Kein weiterer vollständiger historischer Messlauf erforderlich.
- [x] Endgültigen lokalen Diff unabhängig prüfen; Veröffentlichung mit Commit/Push, PR-Aktualisierung und CI-Verfolgung anschließend im selben Nutzerauftrag ausführen. Der aktuelle Remote-/CI-Abschluss wird am PR dokumentiert.

**Abnahme:** Angenommen die Bereinigung ist veröffentlicht, wenn man Archiv und README folgt, dann sind alle ursprünglichen Nachweise zugänglich, die gezielten Prüfungen erfolgreich und der PR enthält die Rohbelege nicht mehr einzeln.

## Implementation Notes

Archiv am 14.11.2026 veröffentlicht. Vollständiger Ausgangsstand 50.647.390 Bytes; gzip 3.968.438 Bytes. Lokale Entpackprüfung und erneuter GitHub-Download: alle 484 Dateien geprüft. Originaler Dateimodus im Manifest und Tar enthalten. Nutzerfreigabe ersetzt erneute Planfreigabe.

## Review Triage Log

| ID | Urteil | Route | Befund und Entscheidung |
| --- | --- | --- | --- |
| R1 | medium | patch | Bestätigt: Shellblock in ARCHIVE.md läuft nach fehlgeschlagener unabhängiger Hashprüfung weiter. Gesamtablauf in Subshell mit `set -e`; Erfolg und beschädigter Hash gezielt prüfen. |
| R2 | low | reject | Historischer Specabsatz nennt einen inzwischen entfernten Entwurf „verfügbar“. Direkter Klammervermerk und neuer Fortsetzungsabschnitt erklären die Entfernung. Keine funktionale Nachweislücke; historische Chronik bleibt erhalten. |

Edge-Case- und Verification-Gap-Ebene: keine Befunde. Archivdownload und alle 484 Dateihashes unabhängig geprüft. Keine fachlichen Zuordnungen verändert.

## Verification

- `python3 -m unittest discover -s scripts/tests -v`
- `python3 _bmad-output/implementation-artifacts/test-baseline/verify-manifest-refresh.py`
- Refresh und Semantik neu erzeugen; verbleibende CSV-/JSON-Projektionen auf deterministische Ausgabe prüfen.
- `git diff --check origin/main` nach Bereinigung.
- Archivintegrität, Dokumentationslinks und endgültige GitHub-CI prüfen.


### Lokale Verifikation der Bereinigung (14.11.2026)

- 454 der 484 ursprünglichen Baseline-Dateien aus dem Arbeitsbaum entfernt; alle entfernten Roh-/Ableitungsdateien werden von konkreten Ignoremustern erfasst. 30 originale Dateien bleiben als lesbare Auswertungen, Matrizen, Manifest, Werkzeuge und notwendige Discovery-/Referenzdaten erhalten (teils mit ergänzten Archivverweisen).
- Downloadarchiv erneut vollständig geprüft: Archivhash, 484 Pfade/Größen/Hashes und eingebettetes Originalmanifest stimmen. Der dokumentierte Wiederherstellungsblock wurde mit den bereits heruntergeladenen drei Releaseassets statt erneutem Remoteabruf ausgeführt: beide Prüfsummenprüfungen und sichere Wiederherstellung aller 484 Dateien einschließlich Modusprüfung erfolgreich.
- `python3 -m unittest discover -s scripts/tests -v`: 42 Tests erfolgreich; bestehende Vorprüfungsregression deckt zusätzlich fehlendes Git ohne Git-Aufruf oder Teststart ab, Exit 2 und `results.json` erhalten.
- `python3 _bmad-output/implementation-artifacts/test-baseline/verify-manifest-refresh.py`: 14 Tests erfolgreich.
- Refresh und Semantik zweimal ausgeführt: `source-matrix.csv`, `canonical-scenarios.csv`, `semantic-summary.json` sowie die zwei ignorierten Vollinventare bytegleich reproduziert; danach redundante JSON-Ausgaben wieder entfernt. Rohe Browser-Loop-Extraktion zweimal bytegleich (99 Einträge). Nur ein Infrastrukturquellhash im geprüften Manifest geändert; Fachfälle, Zuordnungen und Nenner unverändert.
- `git diff --check origin/main`: erfolgreich ohne Ausgabe. Lokale Markdownziele in README, Baselineberichten und historischer Story-Spec geprüft. Zwei Verweise auf die ausdrücklich entfernten Commit-/PR-Entwürfe werden als historische Dateinamen dargestellt; historischer Inhalt bleibt erhalten und ist um einen Fortsetzungsvermerk ergänzt.
- Unabhängiger endgültiger Review, Commit/Push, PR-Aktualisierung und CI-Abschluss folgen im Hauptauftrag; kein Merge, kein GitHub-BMAD-Abgleich, kein vollständiger historischer Messlauf.

- Abschlussreview: zwei Ebenen ohne Befund; unabhängige Integritätsprüfung der Wiederherstellungsanleitung auf sicheren Abbruch korrigiert. Gezielte Probe ohne äußeres `bash -e`: falscher unabhängiger Hash bricht ab, kein `restored`; korrekte Hashes stellen alle 484 Dateien wieder her. Keine offenen bestätigten Fehler. Lokale technische Spec abgeschlossen; Veröffentlichung und abschließender CI-Status werden im PR nachgeführt.
