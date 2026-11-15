# Epic 5 Context: Schnellere Builds bei gleichwertiger Testabsicherung

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Epic 5 soll Entwicklerfeedback deutlich beschleunigen, indem fachliche Szenarien überwiegend in schnellen isolierten Tests geprüft und teure Prüfläufe auf echte Integrationsgrenzen konzentriert werden. Die bestehende Absicherung von Finanz-, Sicherheits-, Kalender-, Monats- und Bedienregeln muss dabei erhalten bleiben. Das Epic verändert oder nimmt keine noch offene Produktfunktion vorzeitig ab.

## Stories

- Story 5.1: Testbestand und vollständige Build-Laufzeit reproduzierbar erfassen
- Story 5.2: Backend-Fachregeln überwiegend mit isolierten Unit Tests absichern
- Story 5.3: Frontend-Verhalten mit Unit- und isolierten Komponententests absichern
- Story 5.4: Teure Integrationsprüfungen auf ihren Schutzzweck konzentrieren
- Story 5.5: Qualitätsgleichwertigkeit und schnelleren vollständigen Build nachweisen

## Requirements & Constraints

- Echte Backend-Unit-Tests und Frontend-Unit-/isolierte Komponententests sollen jeweils mehr als die Hälfte der unterschiedlichen fachlichen Szenarien bilden. Integrations-, Adapter-, System- und E2E-Prüfungen sind getrennt auszuweisen. Duplikate, vererbte Mehrfachausführungen, triviale Assertions und künstliches Aufteilen zählen keine zusätzlichen Szenarien.
- Alle bisherigen fachlichen, sicherheitsbezogenen und regressionsrelevanten Prüffälle behalten nachvollziehbare ausführbare Nachweise. Ein alter Fall darf erst entfallen, wenn sein Ersatz und die weiterhin erforderliche Integration bestehen. Gezielte Mutationen oder kontrollierte Fehler belegen, dass die neuen Prüfungen relevante Fehler erkennen; Prozentabdeckung genügt dafür nicht.
- Echtes PostgreSQL bleibt für Rollen und erzwungene RLS, fehlenden/fremden Kontokontext, Pool-Wiederverwendung, Migration und Bestandserhalt, Commit/Rollback, Sperren und Konkurrenz erforderlich. Versions- und Releasebarrieren benötigen reale Prozess- und Datenbanknachweise. Reale Browserprüfungen behalten zentrale Nutzerabläufe, HTTP-/Cookie-/CSRF-/Origin-Verhalten sowie Fokus, Tastatur, Reflow, Kontrast und Responsivität.
- Refactoring erhält Produktverhalten, Verträge, Autorisierung, Transaktionsgrenzen und Datenbesitz. Neue Fachlogik bleibt im zuständigen Modul; keine Geschwisterimporte, fremden Repository-/Tabellenzugriffe oder nur für Tests geschaffenen produktiven Umgehungen.
- Tests sind deterministisch, isoliert, einzeln ausführbar und aussagekräftig. Fachzeit und Testdaten sind kontrollierbar, Synchronisation explizit, Wartezeiten begrenzt und Ressourcen zuverlässig bereinigt. Kryptografische Kernimplementierungen und produktive Sicherheitsparameter bleiben unverändert.
- Alle Pflichtprüfungen bleiben im regulären lokalen und CI-Pfad; Fehler müssen den Lauf scheitern lassen. Das verbindliche Ziel für die vollständige lokale Prüflaufzeit ist eine Reduktion von mindestens 30 % gegenüber dem festen Story-5.1-Referenzmedian von 1755,133 Sekunden, derzeit höchstens 1228,593 Sekunden Median. Vergleiche benötigen gleiche Anforderungen und Bedingungen, mindestens drei erfolgreiche Läufe je Stand sowie ausgewiesene Setups und Cachebedingungen.

## Technical Decisions

- Die Backend-Testzuordnung unterscheidet echte Unit-Tests (ohne Spring-Anwendungskontext, HTTP-Server, PostgreSQL oder externe Anwendungsprozesse), Architektur-/Prozesshilfsprüfungen, Adapterprüfungen und Integrationen. HTTP-Typen, unbekannte Felder und Fehlerabbildung gehören gegebenenfalls zu separat gezählten Adaptertests.
- Reine Entscheidungen dürfen klein und verhaltenserhaltend aus Infrastruktur extrahiert werden, wenn der produktive Pfad die extrahierte Implementierung tatsächlich verwendet. Öffentliche Modulzugänge, Autorisierung und äußere Transaktionsgrenzen bleiben maßgeblich.
- Testmatrix und Messung verknüpfen jedes unterschiedliche fachliche Szenario mit seiner primären Prüfart und ergänzenden Grenznachweisen. Erwartungen beruhen auf Fachregeln und Beispielen, nicht auf einer nachgebauten Implementierungsformel.

## Cross-Story Dependencies

Story 5.2 und Story 5.3 benötigen beide die Bestandsmatrix und Baseline aus 5.1 und können unabhängig umgesetzt werden. Ein zwischenzeitlich genehmigtes Story-Ziel ersetzt nicht die Epic-Anforderung TR-2 von mehr als 50 %; Epic-Abschluss und Story 5.5 bleiben an dieses Ziel gebunden, bis es erfüllt oder ausdrücklich neu vereinbart ist. Story 5.4 baut auf 5.2 und 5.3 auf; 5.5 baut auf 5.4 auf. Nicht abgeschlossene Produktabnahmen bleiben in der Matrix offen und sind keine versteckten Voraussetzungen dieses Epics.
