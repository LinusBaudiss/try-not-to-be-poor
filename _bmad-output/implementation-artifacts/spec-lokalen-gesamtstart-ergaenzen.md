---
title: 'Lokalen Gesamtstart im Projektverzeichnis ergänzen'
type: 'chore'
created: '2026-10-25'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Eine ausführbare Bash-Datei `start-local.sh` im Projektverzeichnis ruft die vorhandenen Skripte für Einrichtung, Datenbank, Backend und Frontend in der nötigen Reihenfolge auf, sodass die gesamte lokale Anwendung mit einem Befehl startet. Sie wartet auf die Bereitschaft der Dienste, zeigt die lokale HTTPS-Adresse und beendet die selbst gestarteten Anwendungsprozesse bei Abbruch oder Fehler. Die Datenbank und ihre gespeicherten Daten bleiben erhalten. Die README erklärt den gemeinsamen Einstieg und behält die einzelnen Startbefehle als Alternative.

</frozen-after-approval>

## Implementation Notes

- Ausgangsstand `a00d0486343eaf0bbce774412863573d5c147b7d`; Arbeitsbaum sauber, freie Wartungsaufgabe ohne Epic-Zuordnung.
- Keine offenen Absichtsfragen oder irreversiblen Schritte; kleiner Umfang: Root-Skript, README und dieser Nachweis. Die vorhandenen Teilskripte und Konfigurationen werden weiterverwendet.
- `start-local.sh` ruft Setup und Compose-Datenbankstart synchron auf, startet danach Backend und nach dessen erfolgreicher HTTP-Bereitschaftsprüfung das HTTPS-Frontend. Beide Dienste erhalten eigene Prozessgruppen. Das Skript überwacht deren Ende und beendet beim Fehler sowie bei INT/TERM auch Unterprozesse; nach fünf Sekunden werden verbliebene Prozesse beendet. Die Datenbank wird nicht heruntergefahren.
- Ein `flock` verhindert mehrere Gesamtstarts desselben Projekts; bestehende Listener auf 8080/4200 werden für IPv4 und IPv6 vor dem Datenbankstart abgewiesen. Die Einrichtung und deren bestehende Konfiguration werden unverändert wiederverwendet. Keine Geheimnisse oder Dienstlogs werden zusätzlich in Dateien geschrieben.
- Bereitschaftschecks ignorieren curl-Konfiguration und Proxys. Einzig beim lokalen HTTPS-Frontend wird dessen Entwicklungszertifikat akzeptiert. Backend und Frontend haben jeweils 300 Sekunden Startwartezeit, über `START_LOCAL_TIMEOUT_SECONDS` anpassbar; der vorherige Compose-Start fällt nicht unter dieses Zeitlimit.
- Die gemeinsame Startdatei erlaubt ausschließlich die Frontend-Argumente `--ssl-cert` und `--ssl-key`; alle Dienste bleiben auf der konfigurierten Origin `https://localhost:4200`. README um gemeinsamen Start, Abbruchverhalten, Voraussetzungen und Zeitlimit ergänzt; einzelne Startskripte bleiben dokumentiert.
- Verifikation: `bash -n start-local.sh` und `git diff --check` erfolgreich. Isolierte temporäre Dienst-Stubs prüfen Reihenfolge, fremdes Arbeitsverzeichnis mit Leerzeichen, Zertifikatspfad mit Leerzeichen, Backend-/Frontend-Bereitschaftsaufrufe, Doppelsperre, SIGINT, Timeout, Datenbank-/Frontend-Startfehler und späteres Backend-Ende. Auch SIGTERM-ignorierende Unterprozesse bleiben nach Cleanup nicht aktiv. Nach Review-Korrekturen vollständig erneut bestanden.
- Zusätzliche Prüfung mit echten kurzzeitigen localhost-Listenern: belegte Ports 8080/4200 jeweils auf 127.0.0.1 und ::1 werden vor Datenbankstart abgewiesen. Host-/Port-/HTTPS-Änderungen und unvollständige Zertifikatsoptionen werden schon vor Setup abgelehnt.
- Einzige konfigurierte Review-Ebene Blind Hunter durch kontextfreien Subagent ausgeführt; keine Ebene ausgelassen. Drei Befunde geprüft und behoben, keine Zurückstellungen. Echte Docker-, Maven- und Angular-Dienste wurden bei den isolierten Aufruftests nicht gestartet.

## Review Triage Log

- medium → patch: Unbeschränkte Frontend-Argumente konnten Port/Origin verändern, während Sitzung und Bereitschaftscheck fest auf localhost:4200 blieben. Gemeinsamen Einstieg auf Zertifikatsoptionen begrenzt; Abweisung von `--port`, `--host`, `--ssl=false` und fehlenden Pfaden geprüft.
- medium → patch: curl erbte Proxy-Konfiguration und konnte dadurch lokale Dienste trotz Bereitschaft nicht erreichen. `--disable --noproxy '*'` ergänzt; beide Bereitschaftschecks verwenden diese Optionen, nur der HTTPS-Check zusätzlich `--insecure`.
- low → patch: Die README beschrieb das Startzeitlimit pauschal pro Dienst, obwohl es erst nach dem Compose-Datenbankstart wirkt. Text auf Backend/Frontend präzisiert und Image-Downloads/Compose explizit als außerhalb des Zeitlimits dokumentiert.
