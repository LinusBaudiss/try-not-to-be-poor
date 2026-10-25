---
title: 'Verfügbares Docker Compose beim lokalen Start erkennen'
type: 'bugfix'
created: '2026-10-25'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Der lokale Gesamtstart scheitert mit `unknown flag: --env-file`, weil der direkte Aufruf des nicht verfügbaren Compose-Plugins bei der Docker-CLI landet. Das Datenbank-Startskript soll ein verfügbares `docker compose` oder `docker-compose` mit Unterstützung für `up --wait` erkennen, diese Variante verwenden und bei fehlender Unterstützung mit einem konkreten Einrichtungshinweis abbrechen. README und Prüfungen sollen die Voraussetzungen und unterstützten Varianten nachvollziehbar machen.

</frozen-after-approval>

## Implementation Notes

- Ausgangsstand `20b69627cd6584ba4e76cd1ad48c0c7e5ba861ee`, Arbeitsbaum sauber; kleine Korrektur ohne offene Absichtsfragen oder irreversible Projektschritte.
- Umgebung geprüft: Docker-CLI vorhanden, `docker compose version` schlägt fehl und `docker-compose` fehlt. Die lokalen Ubuntu-Paketmetadaten führen `docker-compose-v2` als nicht installiertes, verfügbares Paket.
- Compose-Erkennung bevorzugt das Plugin, unterstützt alternativ die eigenständige Variante und prüft das tatsächliche Optionstoken `--wait` in der Hilfe. Ein Fehler beim anschließenden Datenbankstart wird unverändert zurückgegeben und löst keinen zweiten Startversuch aus.
- Verifikation über isolierte CLI-Stubs: Plugin-Präferenz, eigenständige Variante, Docker-CLI ohne Plugin mit/ohne Fallback, veraltetes Plugin mit geeignetem Fallback, vollständig fehlende Befehle, veraltetes Compose sowie Exitcode 29 beim Start erfolgreich geprüft. Alle Tests prüfen den Aufruf aus einem fremden Arbeitsverzeichnis und einem Projektpfad mit Leerzeichen sowie die exakten Startargumente. `bash -n` und `git diff --check` erfolgreich.
- Die systemweite Installation erforderte ein sudo-Passwort. Für die geplante Alternative wurde lediglich ein Ubuntu-Paket nach `/tmp/tnbp-compose-package` heruntergeladen; es wurde kein Benutzerplugin installiert. Nach Mitteilung des Nutzers über seine systemweite Installation wurde der temporäre Download samt Verzeichnis entfernt. `docker compose version` bestätigt jetzt die systemweite Installation. Der Benutzerpluginpfad war weiterhin nicht vorhanden.
- Einzige konfigurierte Review-Ebene Blind Hunter durch kontextfreien Subagent ausgeführt; keine Ebene ausgelassen, keine Zurückstellungen.

## Review Triage Log

- medium → patch: Die erste Teilzeichenfolgenprüfung hätte auch `--wait-timeout` akzeptiert. Auf ein vollständiges Optionstoken mit Whitespace-/Zeilengrenzen umgestellt.
- false: Der Reviewer beanstandete fehlende Prüfungen und Nachweise. Acht isolierte CLI-Aufruftests wurden bereits vor Eingang des Reviews erfolgreich ausgeführt; deren Ergebnisse sind jetzt in den Implementation Notes festgehalten. Der Reviewer hatte die Notizen vor Ergänzung der Prüfnachweise gelesen.
