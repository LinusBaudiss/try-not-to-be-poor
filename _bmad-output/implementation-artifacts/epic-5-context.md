# Epic 5 Context: Schnellere Builds bei gleichwertiger Testabsicherung

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Das Epic verkürzt das belastbare Feedback für Änderungen, indem fachliche Varianten überwiegend in schnellen isolierten Tests geprüft und teure Prüfungen auf echte Integrationsgrenzen konzentriert werden. Die bisherige Fehlererkennung und alle bestehenden Schutzanforderungen bleiben erhalten. Es entstehen keine neuen Produktfunktionen, Vertragsänderungen, Framework-Upgrades oder Produktionsfreigaben; offene Produktabnahmen werden nicht durch bessere Tests als erledigt ausgewiesen.

## Stories

- Story 5.1: Testbestand und vollständige Build-Laufzeit reproduzierbar vermessen
- Story 5.2: Backend-Fachregeln überwiegend mit isolierten Unit Tests absichern
- Story 5.3: Frontend-Verhalten mit Unit- und isolierten Komponententests absichern
- Story 5.4: Teure Integrationsprüfungen auf ihren Schutzzweck konzentrieren
- Story 5.5: Qualitätsgleichwertigkeit und schnelleren vollständigen Build nachweisen

## Requirements & Constraints

- Verbindliches Nutzerziel vom 14.11.2026: höchstens 15 Minuten (900 Sekunden) Median des vollständigen lokalen Prüflaufs. Es ersetzt die frühere 30-%-Planungsannahme und wird durch eine neue Baseline nicht angehoben. Zur aktuellen Baseline 1755,133 Sekunden sind rund 48,72 % Einsparung nötig. Eine Zieländerung benötigt eine ausdrücklich dokumentierte Nutzerentscheidung; fehlende Messungen oder Zielverfehlungen bleiben offen.
- Vollständig bedeutet: Python-Prüfungen, beide Vertrags-/Generator-/Kompilierprüfungen samt SPA-Build, Backend-`verify`, nach Einführung Frontend-Unit-/Komponententests sowie `e2e`, `e2e:transition` und `e2e:automation`. Alle Pflichtgruppen bleiben bei Push und Pull Request verpflichtend. Auslassen, abgeschwächte Assertions, pauschale Retries oder fehlertolerante Jobs sind keine Beschleunigung.
- Referenz und Ziel benötigen denselben fachlichen Umfang, Host, vergleichbare Last und Ressourcenlimits, Werkzeugpins, Befehlsreihenfolge und definierte Cachebedingungen. Nach Warm-up mindestens drei vollständige erfolgreiche Messungen mit Einzelwerten und Median; zusätzlich ein erfolgreicher Lauf mit bereinigten Build-/Testausgaben. Erforderliche Setups und Builds zählen zur Messung; Erstdownloads werden getrennt berichtet.
- Für CI sind mindestens drei vergleichbare erfolgreiche Läufe je Stand, Cache-/Runnerbedingungen, summierte Jobzeit und Zeit bis Ende des letzten Pflichtjobs erforderlich; Queue-Zeit separat. Der mediane kritische Pfad darf nicht steigen. Geänderte Parallelisierung ist ein eigener Vergleich.
- Unterschiedliche fachliche Szenarien erhalten stabile Inventarverweise und eine primäre Testart: Kombination aus Fachregel, relevanter Eingabe/Zustand und erwartetem Verhalten. Ergänzende Nachweise, doppelte Parameter und Vererbungsausführungen erhöhen weder Zähler noch Nenner. Eigenständige HTTP-, Rollback- oder andere Grenzrisiken bleiben eigene Szenarien. Architektur-/Infrastrukturhilfsprüfungen werden separat ausgewiesen.
- Backend-Unit-Tests beziehungsweise Frontend-Unit-/isolierte Komponententests müssen jeweils mehr als 50 % der fachlichen Szenarien bilden. Qualität geht vor Quote. Spring-Kontext, HTTP-Server, Datenbank oder externe Prozesse schließen die Backend-Klassifikation als Unit Test aus.
- Vor Entfernung eines bestehenden Falls müssen Ersatz und verbleibende Integration bestanden sein. Eine Matrix verbindet Anforderung/Story-Abnahme, Altfall einschließlich Parameter/Schleife, Beobachtung, Risiko, Zieltestart, bleibende Integration und Ersatznachweis. Alle 17 Monatsfälle sowie zusätzliche historische Bindungs-, Korrektur- und Versionspräzisierungen werden abgebildet; fehlende Umsetzung bleibt sichtbar offen.
- Gezielte kontrollierte Fehlervarianten vergleichen die Fehlererkennung bei Geld/Kalender, Autorisierung, Commit/Rollback, Doppelwirkung, Versions- und Sitzungsgrenzen. Identisch instrumentierte Code-/Zweigabdeckung ergänzt dies mit nachvollziehbarem Nenner und Ausschlüssen für generierten Code; sie ersetzt keine Fallzuordnung. Fehlende Frontend-Unit-Abdeckung ist eine Ausgangslücke.

## Technical Decisions

Reine Geld-, Kalender-, Validierungs- und Differenzentscheidungen eignen sich für direkte Unit Tests; JSON-/DTO-/Fehlerabbildung zählt als Adapterprüfung. Kleine notwendige Produktionscode-Extraktionen bewahren öffentliche Modulgrenzen und produktives Verhalten. Kryptografische Kernprüfungen verwenden echte Implementierungen und unveränderte Produktionsparameter. Tests bleiben einzeln ausführbar, deterministisch und unabhängig, mit kontrollierter Zeit, expliziten Synchronisationssignalen, begrenzten Timeouts und vollständigem Cleanup.

Echtes PostgreSQL mit unprivilegierten Rollen bleibt erforderlich für erzwungene RLS, fehlenden/fremden Kontokontext, Pool-Wiederverwendung, Schema/Rechte und Bestandserhalt. Finanzkoordination muss dieselbe physische Transaktion, Kontosperre und unabhängige konkurrierende Verbindungen prüfen; Erfolg erst nach äußerem Commit, vollständiger Rollback auch für Monatsnachweise und Marker. Geldwerte bleiben exakte EUR-Cent innerhalb ±9007199254740991, Kalender und Monatsgrenzen folgen Europe/Berlin.

Historische Monatsbindung einschließlich Nullüberschüssen, vollständig einmalige Übernahme offener Nachweise, verbrauchte Bindungen gelöschter Ziele und reine Differenzkorrekturen auf den aktuellen Fortschritt bleiben erhalten. Manuelle Fortschritte ersetzen den Gesamtbetrag ohne technische Monatsmetadaten zu löschen. Hintergrundverarbeitung bleibt nachholbar, kontoatomar und unabhängig von offenen Sitzungen.

Versionsbarriere und Rücknahme benötigen echte alte/neue Releases, Prozesse und Datenbankarbeit. Alle zugelassenen v1-Lese-/Schreibvorgänge müssen beendet oder abgebrochen sein, bevor signierte Werte/Automatik freigegeben werden. Nach erster Nutzung ist v1-Rücknahme ausgeschlossen. Zertifikate, Schema-/Rollendrift, Neustarts und konkurrierende Administration dürfen nicht durch Stubs ersetzt werden. Cacheoptimierungen benötigen klare Invalidierung bei Quell-, Revisions-, Vertrags-, Konfigurations- oder Umgebungswechsel; fachlicher Testzustand wird niemals übernommen.

## UX & Interaction Patterns

Isolierte Frontendtests prüfen Eingaben, Formate, sichtbare Zustände, Aktionen und kontrollierte Antwortreihenfolgen. Reale Browsernachweise erhalten zentrale vollständige Abläufe, tatsächliches HTTP/Cookie/CSRF/Origin und Interceptor-Verdrahtung. Tokens, Finanzdaten und Entwürfe bleiben flüchtig; Sitzungsende/Kontowechsel verwerfen sie und späte Antworten. Doppelsenden bleibt gesperrt, Erfolg folgt bestätigter Speicherung, Fehler erhalten Entwürfe nur im offenen Tab, Löschen verlangt Bestätigung. Tatsächlicher negativer/übererfüllter Fortschritt bleibt sichtbar; nur der Balken wird begrenzt.

Tastatur, Dialogfokus, Statusankündigungen, Kontrast, 200-%-Text und Reflow bleiben real geprüft: Viewports 320×568, 390×844, 768×1024 und 1280×800, mindestens 44-Pixel-Aktionen und 48-Pixel-Geldfelder. WCAG 2.2 AA bleibt Prüfziel.

## Cross-Story Dependencies

5.1 kann auf dem vorhandenen Stand vor Abschluss von Epic 3/4 beginnen. 5.2 und 5.3 benötigen 5.1 und sind voneinander unabhängig; 5.4 benötigt beide, 5.5 benötigt 5.4. Offene Stories 4.6 bis 4.8 blockieren nicht; ihre fehlende Produktabdeckung bleibt offen. Bei zwischenzeitlich hinzugefügtem Funktionsumfang werden Referenz und Ziel vergleichbar neu gemessen. Gemeinsame Dateien/Fixtures erfordern abgestimmte Bearbeitung; die Produktfreigabe der Monatsautomatik bleibt bei Epic 4.
