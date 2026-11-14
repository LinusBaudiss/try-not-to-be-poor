# Titel

chore: Testinventar und reproduzierbare Build-Baseline für Story 5.1

# Beschreibung

Für das Testrefactoring fehlten ein fallbezogenes Inventar und eine aktuelle vollständige Laufzeit-/Coverage-Referenz. Die Änderung liefert die zugeordneten Szenarien, geschützte Integrationsgrenzen, eine erfolgreiche fünfteilige Messserie und die Kostenprioritäten für 5.2–5.4. Der Referenzmedian beträgt 1755,133 Sekunden; das ausdrücklich festgelegte Ziel für den späteren vollständigen Median beträgt höchstens 900 Sekunden. Die Zeitreduktion wird mit diesem PR noch nicht behauptet.

Das Messwerkzeug bewahrt fehlgeschlagene Läufe, prüft tatsächliche Testdiscovery und Quellidentität, erfasst Host-/Ressourcenbedingungen und beendet Prozessgruppen bei Abbruch. Historische Rohdaten und ihre Messgrenzen bleiben erhalten. Keine Produktfunktion, Fachassertion, Testpflicht oder öffentliche API wurde geändert.

## Verifikation

- Erfolgreiche lokale Referenz: Warm-up, drei vollständige Messungen und bereinigter Kontrolllauf; je Lauf 33 damalige Python-, 482 Backend- und 320 Browserausführungen sowie beide Verträge/SPA erfolgreich.
- Separate Coverage: 96,816 % Zeilen und 86,053 % Zweige; Umfang, Ausschlüsse und Instrumentierungslücken dokumentiert.
- Abschlussstand: 42 Python-Tests und 14 Inventar-/Semantikprüfungen erfolgreich, einschließlich realer Abbruch-/Prozessbaumtests.
- Dynamische Backendprüfung akzeptiert alle fünf unveränderten 49/433-XML-Sätze; aktuelle Browser-Discovery 224/5/91.
- Drei unabhängige Reviewebenen, alle bestätigten Befunde behoben, keine zurückgestellt. `git diff --check` erfolgreich.

## Nachweise und Grenzen

[Abnahmeprüfung](test-baseline/ACCEPTANCE.md), [Baseline-Auswertung](test-baseline/LOCAL-BASELINE.md), [Kostenbereiche](test-baseline/COSTS.md), [Review](test-baseline/REVIEW.md).

Die gemessene Referenz ist Commit 630ad58c5ad688e6436d1c4edf1a4d354d63def5 plus archivierter Korrekturpatch/Inputhashes. Neue Diagnose-/Discoveryguards wurden gezielt geprüft; sie ändern nicht nachträglich den historischen Messumfang. Fehlende historische laufbezogene Ressourcenwerte werden nicht erfunden. Direkte DB-/Prozess-/Setupmessbereiche sind inklusive; exklusive interne Unterphasen werden nicht behauptet.

Technische Story-Spec abgeschlossen; Sprintstory `review` für Projektabnahme. 15-Minuten-Ziel, Ersatz-/Mutationsnachweise und Mehrheitsverteilung gehören zu den Folgegeschichten. Stories 4.6–4.8 bleiben offen. Kein Produktionsbetrieb und kein GitHub-BMAD-Spiegel beauftragt.

## Lokaler Veröffentlichungsstand

Auf Branch `codex/story-5-1-testbaseline` vorbereitet. Der Agent konnte wegen schreibgeschütztem `.git/index.lock` weder stagen noch committen. Lokale Commitnachricht: `commit-story-5-1.txt`. Kein neuer Commit, Push oder PR wurde durch diesen Abschluss erzeugt.
