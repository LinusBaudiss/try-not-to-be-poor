---
title: 'Startskript bei sh-Aufruf an Bash übergeben'
type: 'bugfix'
created: '2026-10-25'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Der vom Nutzer ausgeführte Befehl `sh start-local.sh` bricht vor dem Start mit `set: Illegal option -o pipefail` ab. Ein POSIX-kompatibler Einstieg soll bei diesem Aufruf das Skript mit Bash und denselben Argumenten neu starten. Direkter Aufruf und expliziter Bash-Aufruf bleiben unterstützt; die README nennt die verfügbaren Aufrufarten.

</frozen-after-approval>

## Implementation Notes

- Ausgangsstand `0f17ecec9fb8cef9698e89d2ecc609d75f3c4a6c`, Arbeitsbaum sauber. Kleine Korrektur an Einstieg und README ohne offene Fragen oder irreversible Schritte; bestehender Gesamtstart wird unverändert wiederverwendet.
- Vor `set -euo pipefail` prüfen POSIX-kompatible Befehle auf Bash und übergeben bei Bedarf per `exec bash -- "$0" "$@"`. Dadurch bleiben Argumentgrenzen und die Prozessidentität für Abbruchbehandlung erhalten.
- Verifikation: `bash -n start-local.sh`, `git diff --check` und Aufrufprüfung erfolgreich. Direkter Aufruf, `bash` und `sh` erreichen dieselbe Bash-Validierung eines absichtlich ungültigen Startzeitlimits, ohne Setup oder Dienste zu starten. Die Übergabe erhält Argumente mit Leerzeichen, Sonderzeichen und leere Argumente sowie einen Skriptpfad mit Leerzeichen.
- Unveränderten Startablauf nicht erneut aufgebaut; die Korrektur betrifft ausschließlich den Interpreter-Einstieg. Einzige konfigurierte Review-Ebene Blind Hunter gestartet, keine Ebene ausgelassen.
- Review-Korrektur: Bash über einen subshell-isolierten `builtin shopt`-Aufruf erkennen statt über die möglicherweise geerbte Variable `BASH_VERSION`. Alle Aufrufprüfungen auch mit absichtlich gesetztem `BASH_VERSION` erneut bestanden; zusätzlich unveränderten Exitcode 27 über die Übergabe geprüft. Review abgeschlossen, keine Zurückstellungen.

## Review Triage Log

- medium → patch: Ein aus der Umgebung übernommenes `BASH_VERSION` konnte die erste Interpreterprüfung unter `sh` fälschlich bestehen lassen. Stattdessen wird jetzt ein Bash-Builtin geprüft. `env BASH_VERSION=5.2 sh ...` erreicht erfolgreich die Bash-Validierung.
- false: Der Reviewer beanstandete fehlende Verifikation und Abnahmekriterien. Der kurze One-Shot-Pfad lässt Abnahmekriterien ausdrücklich weg; konkrete Aufruf-, Argument- und Exitcodeprüfungen sind inzwischen unter Implementation Notes dokumentiert. Der Reviewer hatte den Stand vor Ergänzung der Prüfnachweise gelesen.
