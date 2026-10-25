---
title: 'Lokale Startskripte aus der README extrahieren'
type: 'chore'
created: '2026-10-25'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Die lokalen Einrichtungs- und Startbefehle aus der README sollen als ausführbare Bash-Dateien unter `scripts/start-local/` verfügbar sein. Die README verweist anschließend auf diese Skripte und erklärt ihre Reihenfolge. Geschützte lokale Konfiguration, HTTPS und der getrennte Start von Datenbank, Backend und Frontend bleiben erhalten.

</frozen-after-approval>

## Implementation Notes

- Ausgangsstand: `41305d5290499ac288c6f122c812d7aa1c27ea6b`, Arbeitsbaum vor Beginn sauber; keine Zuordnung zu einer Epic-Story.
- Vier ausführbare Bash-Skripte unter `scripts/start-local/`: `setup.sh`, `start-database.sh`, `start-backend.sh`, `start-frontend.sh`. Alle bestimmen das Projektverzeichnis relativ zum Skript.
- `setup.sh` übernimmt die geschützte Geheimniserzeugung aus der README und verwendet den vorhandenen Registrierungslinkgenerator. Bestehende Dateien bleiben erhalten, einschließlich widerrufener Registrierungskonfiguration. Neue Dateien haben Modus 0600, das Verzeichnis 0700.
- Datenbank- und Backendstart melden fehlende Konfiguration mit Verweis auf `setup.sh`; Backend lädt Konfiguration bei jedem Start neu. Frontend führt weiterhin `npm ci` vor dem HTTPS-Start aus und reicht zusätzliche Startoptionen weiter.
- README-Einrichtung und Startbefehle durch Skriptaufrufe ersetzt; Konfigurations- und HTTPS-Erklärungen bleiben erhalten.
- Verifikation: alle vier Skripte einzeln mit `bash -n`, Ausführbarkeit und `git diff --check` geprüft. Isolierter temporärer Aufruftest mit ersetzten Docker-/Maven-/npm-Befehlen prüft Dateirechte, Geheimnisfreiheit der Ausgabe, unveränderte Konfiguration bei Wiederholung/Widerruf, Konfigurationsexport, Argumente, Arbeitsverzeichnis mit Leerzeichen und Fehlerweitergabe einschließlich Abbruch nach fehlgeschlagenem `npm ci`.
- Bestehende vier Linkgenerator-Tests erfolgreich: `python3 -m unittest discover -s scripts/tests -v`. Keine echten Dienste gestartet; für die reine Skriptextraktion sind keine Frontend-/Backend-Builds erforderlich.
- Review: einzige konfigurierte Ebene Blind Hunter mit kontextfreiem Subagent ausgeführt; keine konfigurierte Ebene ausgelassen. Drei bestätigte Randfälle direkt korrigiert, nichts zurückgestellt.
- Neue Konfiguration wird über geschützte temporäre Dateien und atomare Hardlinks ohne Überschreiben veröffentlicht. Ein Python-`fcntl`-Lock serialisiert komplette Setup-Läufe samt Registrierungslinkgenerator. Fehlt eine aktive Linkdatei, beendet sich Setup mit einem Rotationshinweis; Widerruf bleibt erhalten.
- Zusätzliche Verifikation nach Review: simulierter Fehler beim Veröffentlichen hinterlässt keine Konfiguration; acht parallele Setup-Prozesse erzeugen genau ein zusammenpassendes Link-/Hash-Paar. Dateirechte, unveränderte Wiederholung, fehlender aktiver Link, Widerruf und geheimnisfreie Ausgabe erneut erfolgreich geprüft. Bash-Syntax und `git diff --check` nach den Korrekturen erfolgreich.

## Review Triage Log

- medium → patch: Direktes Erstellen veröffentlichte die Konfigurationsdatei vor ihrem vollständigen Inhalt; nach Schreibabbruch hätte wiederholtes Setup sie ungeprüft behalten. Durch temporäre Datei mit atomarem `os.link` ohne Überschreiben ersetzt; Fehler vor Veröffentlichung isoliert geprüft.
- medium → patch: Aktive Registrierung ohne Linkdatei wurde bislang als erfolgreich eingerichteter Zustand gemeldet. Bestehende Konfiguration bleibt erhalten; Setup meldet jetzt einen Fehler mit dem Befehl zur bewussten Rotation. Fehlende aktive Linkdatei und absichtlichen Widerruf separat geprüft.
- medium → patch: Zwei gleichzeitige Setup-Aufrufe konnten den rotierenden Generator überlappend starten. Exklusiver `fcntl`-Lock um den vollständigen Einrichtungsablauf ergänzt; acht parallele Aufrufe erzeugten genau ein gültiges Link-/Hash-Paar.
