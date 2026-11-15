# Epic 5 Context: Schnellere Builds bei gleichwertiger Testabsicherung

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Epic 5 beschleunigt belastbares Entwicklerfeedback durch überwiegend isoliert geprüfte Fachszenarien und auf echte Grenzen konzentrierte Integration. Finanz-, Sicherheits-, Kalender-, Monats- und Bedienregeln behalten ihre ausführbaren Nachweise. Das Epic implementiert keine noch offene Produktfunktion und erteilt keine Produktionsfreigabe.

## Stories

- Story 5.1: Testbestand und vollständige Build-Laufzeit reproduzierbar vermessen
- Story 5.2: Backend-Fachregeln überwiegend mit isolierten Unit Tests absichern
- Story 5.3: Frontend-Verhalten mit Unit- und isolierten Komponententests absichern
- Story 5.4: Teure Integrationsprüfungen auf ihren Schutzzweck konzentrieren
- Story 5.5: Qualitätsgleichwertigkeit und schnelleren vollständigen Build nachweisen

## Requirements & Constraints

- Echte Backend-Unit-Tests beziehungsweise Frontend-Unit-/isolierte Komponententests müssen zum Epic-Abschluss jeweils mehr als 50 % der unterschiedlichen fachlichen Szenarien primär absichern. Duplikate, Mehrfachausführung, triviale Assertions und künstliche Aufteilung erhöhen die Quote nicht; Adapter, Integration und Hilfsprüfungen bleiben getrennt ausgewiesen.
- Jeder alte Prüffall braucht einen nachvollziehbaren bestandenen Ersatz oder einen begründeten fortbestehenden Nachweis. Neue Tests bestehen zunächst zusätzlich; erst danach dürfen redundante Varianten entfallen. Gezielte Mutationen oder kontrollierte Fehler belegen die Erkennung betroffener Risiken. Code-/Zweigabdeckung ergänzt diese Zuordnung, ersetzt sie aber nicht; generierter Code bleibt aus vergleichbarer Abdeckung ausgeschlossen.
- Der vollständige lokale Zielmedian muss nach Warm-up aus mindestens drei erfolgreichen Läufen höchstens 70 % des festen Referenzmedians von 1755,133 Sekunden betragen: maximal 1228,593 Sekunden (20:28,593), mindestens 30 % Einsparung. Das frühere absolute 15-Minuten-Ziel ist ausdrücklich ersetzt. Gleiche Anforderungen, Umgebung und Cachebedingungen sowie enthaltenes Setup und ein erfolgreicher bereinigter Kontrolllauf sind Pflicht. Fehlgeschlagene Läufe sind keine Leistungsnachweise.
- Alle Pflichtgruppen bleiben lokal und bei Push/PR verbindlich: Python, beide Verträge mit Generatoren/Kompilierung und SPA-Build, Backend-Unit-/Integrations-/Versionsprüfungen, neue Frontend-Tests und alle drei Browsergruppen. CI-Nachweise unterscheiden kritischen Pfad und summierte Jobzeiten; fehlender Zugang bleibt sichtbar offen. Auslassen, Abschwächen, pauschale Retries und nachträgliche Parallelisierung erfüllen das Ziel nicht.
- Tests sind deterministisch, einzeln ausführbar und unabhängig von Reihenfolge, aktueller Uhrzeit und fremdem Zustand. Synchronisation ist explizit und begrenzt; Prozesse, Ports, Verbindungen, Sperren und Testdaten werden zuverlässig bereinigt. Cachegültigkeit folgt allen relevanten Eingaben; fachlicher Zustand wird nicht zwischen Fällen übernommen.

## Technical Decisions

- Backend-Unit-Tests starten weder Spring-Anwendungskontext noch HTTP-Server, PostgreSQL oder externe Anwendungsprozesse. Reale PostgreSQL-Nachweise bleiben für Rollen/erzwungene RLS, fehlenden oder fremden Kontokontext, Pool-Wiederverwendung, Migration/Bestandserhalt, Commit/Rollback, Sperren und Konkurrenz erforderlich. Versionsbarrieren und Releasewechsel benötigen echte Prozess- und Datenbanklebenszyklen.
- Kleine verhaltenserhaltende Extraktionen sind erlaubt, wenn produktive Abläufe die isolierte Implementierung wirklich verwenden. Fachlogik bleibt im zuständigen Modul; keine Geschwisterimporte oder fremden Tabellen-/Repositoryzugriffe. Äußere Koordination, Kontosperre, Autorisierung, Transaktionsgrenzen und Datenbesitz bleiben unverändert. Framework-Upgrades, Vertragsänderungen und neue Produktdatenbankobjekte sind ausgeschlossen; produktive Kryptoparameter bleiben unverändert.
- Exakte ganzzahlige EUR-Cent bleiben innerhalb ±9007199254740991; Überpräzision/Überlauf werden abgelehnt. Fehlendes Budget unterscheidet sich von null. Kalenderdaten bleiben unveränderte Daten, Monatsgrenzen verwenden Europe/Berlin. Tatsächliche negative/übererfüllte Sparfortschritte und Prozentwerte bleiben sichtbar; nur der Balken ist auf 0 bis 100 % begrenzt.
- Access-Tokens und Finanzdaten bleiben ausschließlich im Browserarbeitsspeicher. Logout, Ablauf und Kontowechsel verwerfen Daten/Entwürfe und entwerten späte Antworten. Erfolgsanzeigen folgen bestätigtem Commit; zusammengehörige Mutationen dürfen keine Teilbestätigung erzeugen.

## UX & Interaction Patterns

Isolierte Komponententests beobachten echte Templates, sichtbare Texte, Labels, Fehlerzuordnung, Statusankündigungen und Aktionen. Kontrollierte HTTP-Antworten prüfen Verzögerung, Doppelsendesperre, Fehler, erneuten Versuch und Antwortreihenfolgen einschließlich produktiver Session-/Interceptor-Verdrahtung. Entwürfe bleiben bei Fehlern nur im offenen Tab; ungewisse Mutationen werden vor Wiederholung geklärt. Ausgabe-/Ziellöschung benötigt Bestätigung, Abbruch verändert nichts. Nutzereigene Texte mit „Berlin“ bleiben erhalten; systemseitige Zeitzonenerklärungen entfallen.

Reale Browsernachweise behalten zentrale Zugangs-, Ausgaben-, Monats-, Sparziel- und vorhandene Automatikabläufe sowie Cookie-/CSRF-/Origin-/HTTP-Verhalten und Sitzungswechsel. Fokus, Tastatur, Kontrast und Reflow werden weiterhin im echten Browser geprüft. WCAG 2.2 AA ist Prüfziel: 200 % Text, 320 CSS-Pixel ohne horizontales Scrollen, mindestens 44-Pixel-Aktionen und 48-Pixel-Geldfelder; bestehende Smartphone-, Tablet- und Desktop-Viewports bleiben erhalten.

## Cross-Story Dependencies

5.2 und 5.3 benötigen beide Inventar, Matrix und Baseline aus 5.1 und sind voneinander unabhängig. 5.4 benötigt beide, 5.5 benötigt 5.4. Das genehmigte Zwischenziel für 5.2 beträgt mindestens 15 % von 1096 Backend-Szenarien (165 Primärfälle) mit direkten Fachnachweisen für 25 zusätzlich zugeordnete Szenarien; es ersetzt weder Epic-TR-2 noch die Mehrheitsanforderung in 5.5. Die Frontend-Mehrheitsanforderung bleibt unverändert. Noch offene Produktabnahmen, insbesondere 4.6 bis 4.8, bleiben sichtbar offen und sind keine versteckten Voraussetzungen; vorhandene Prüfungen entfallen deswegen nicht. GitHub-Abgleich und Veröffentlichung gehören nicht zum Auftrag.
