---
title: 'PR 1: Instabile Logprüfung der Registrierung korrigieren'
type: 'bugfix'
created: '2026-10-22'
status: 'done'
route: 'oneshot'
baseline_commit: '5fca7c50dfc37e65b9dfff204005520b1d6ccca4'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
---

<frozen-after-approval reason="Explizit beauftragte Fehlerkorrektur">

## Intent

Die Backend-Prüfung von PR 1 scheitert, weil `RegistrationIT` die absichtlich ausgelöste PostgreSQL-Fehlermeldung mit Anwendungslogs vermischt. Korrigiere die Erfassung nach Logquelle und sichere sie mit einem deterministischen Nachweis gegen diese Vermischung ab. Die Prüfungen von HTTP 500, Rollback, bereinigter Fehlerkategorie und ausbleibender Ausgabe von Passwort, Token und Requestdaten bleiben wirksam. Prüfe die Backend-Suite und eröffne anschließend einen neuen Pull Request gegen `main`.

</frozen-after-approval>

## Implementation Notes

- Untersuchung: `RegistrationIT.java` prüft derzeit globales `CapturedOutput`; der weitergereichte PostgreSQL-Prozessfehler enthält den synthetischen Marker. `RegistrationErrors.java` schreibt bereits ausschließlich eine bereinigte Fehlerkategorie. Produktionsverhalten, Vertrag und Datenbankschema benötigen keine Änderung.
- Kleine reversible Korrektur der Testinfrastruktur, keine offenen Absichtsfragen und keine Datenmutationen außerhalb synthetischer Tests. Push/PR erfolgen nach lokaler Prüfung gemäß ausdrücklichem Auftrag.
- `RegistrationIT.java`: kurzlebiger Logback-Appender erfasst Anwendung und Frameworks strukturiert, trennt die Testbibliothek für den PostgreSQL-Prozess ab und berücksichtigt auch Exception-Ausgaben. Synchronisiertes Lesen nutzt denselben Monitor wie `AppenderBase.doAppend`; try-with-resources entfernt den Appender nach jeder Prüfung.
- Die Commitprüfung behält HTTP 500, Rollback und bereinigte Kategorie bei. Passwort/Token bleiben zusätzlich im gesamten Konsolenoutput verboten; die Prüfung von Konto-Adressen erfolgt für Anwendungslogs, damit erwartete PostgreSQL-Duplikatdiagnosen nicht denselben Fehler auslösen.
- Deterministischer Kontrolltest: derselbe Marker wird aus PostgreSQL-Logger und Anwendungslogger ausgegeben; die Konsolenausgabe belegt die tatsächliche Ausgabe, die strukturierte Erfassung trennt nach Quelle statt nach Nachrichtentext.
- Lokale vollständige Backend-Verifikation: 26 Unitfälle und 19 PostgreSQL-/HTTP-Integrationstests erfolgreich, 0 übersprungen; Protokoll `/tmp/tnbp-log-fix-verify.log`.
- Nach unabhängiger Prüfung: Kontrolltest um Frameworklogger und Exception-Inhalt erweitert; die Prüfung sensibler Ausgaben bestätigt ausdrücklich erfolgreiche Registrierung, Duplikat-Ablehnung und ungültiges JSON samt Fehlercode.
- Abschließender vollständiger Backend-Lauf nach den Review-Korrekturen: erneut 26 Unitfälle und 19 Integrationstests erfolgreich, 0 Fehler/übersprungen. Protokoll `/tmp/tnbp-log-fix-verify-final.log`; Produktionsdateien und API-Vertrag sind unverändert.

## Review Triage Log

- **medium / patch:** Framework-Erfassung besaß keinen positiven Nachweis; ein falscher Filter nur auf eigene Pakete hätte den bisherigen Kontrolltest bestanden. Frameworkmeldung wird jetzt ausdrücklich im strukturierten Output erwartet.
- **medium / patch:** Exception-Erfassung besaß keinen positiven Nachweis; Entfernen des Throwable-Zweigs hätte den bisherigen Kontrolltest nicht beeinflusst. Eine separat benannte Exception-Nachricht muss jetzt erfasst werden.
- **medium / patch:** Negative Logassertionen bestätigten die ausgeübten HTTP-Pfade nicht. Jetzt werden 201, 400 beim Duplikat sowie 400/VALIDATION_FAILED bei ungültigem JSON verlangt. Alle Befunde direkt behoben, nichts zurückgestellt.
