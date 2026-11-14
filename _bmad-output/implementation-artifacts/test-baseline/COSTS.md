# Kosten nach gemessenem Bereich

Historische Rohbelege (Logs, Patches, XML-/Coverage-Berichte und Versuche) sind unverändert im [geprüften Nachweisarchiv](ARCHIVE.md) erhalten. Pfade zu diesen Belegen beziehen sich auf den dort wiederhergestellten alten Verzeichnisbaum.

Die Bereiche trennen tatsächlich gemessene Aufwände. Inklusive Klassen-/Jobzeiten werden nicht zu exklusiven inneren Prozess- oder SQL-Phasen umgedeutet. Eine feinere Ursachenprofilierung innerhalb eines Prozessfalls ist eine spätere Optimierungsdiagnose in 5.4; die vorliegenden Grenzen bleiben überprüfbar.

## Lokaler Backend-Medianlauf 2

| Gemessener Bereich | Sekunden | Abgrenzung |
| --- | ---: | --- |
| Prozess-Testhilfe | 2.384 | Realer kurzer Prozess-Cleanup-Test, ausdrücklich kein Fach-Unitfall. |
| Isolierte Fachregeln | 2.781 | Direkte Unit-Klassen; keine gestartete HTTP-/Datenbankinfrastruktur im einzelnen Unitfall. |
| Architekturprüfung | 0.066 | Quellbasierte Modul-/Datenbesitzprüfung. |
| HTTP-/PostgreSQL-Integration | 41.925 | Echte Adapter-/Security-/Commit-/RLS-Prüfungen einschließlich jeweiliger Fixtures. |
| Direkte PostgreSQL-/Migrationsintegration | 11.261 | FinanceMigrationIT, FinanceCoordinationIT und ApiVersionStateIT; ohne externe API-Prozesse. Enthält echte DB-/Flyway-/Rollenkosten sowie jeweilige Fixtures. |
| Alte/neue Releaseprozesse und PostgreSQL | 1145.868 | ReleaseTransitionIT und AdministrativeSerializationIT; inklusive Guards, Datenbankanlage/-migration und wiederholter interner Releasebauten. |
| Nicht Klassen zugeordneter Backend-Aufwand | 12.136 | Rest der gemessenen Backend-Gruppe: Maven/Generierung/Kompilierung/Package/Driver/Reporter; keine reine Compilerzeit. |
| **Backend-Gruppe insgesamt** | **1216.421** | Addierbare Zerlegung desselben Laufs. |

Migrationskosten sind zusätzlich klassenweise belegt: FinanceMigrationIT 9,819 s im Medianlauf und 9,771 s Klassenmedian der drei Messungen. Eine externe API-Prozessklassifikation dieser Klasse wäre falsch; sie wurde im Abschlussreview auf PostgreSQL korrigiert. Das verändert weder Fachszenariozahl noch Unitquote.

## CI-Setup und Prüfgruppen

Die Rohschritte und Einzelläufe stehen in `ci-step-costs.json`, abgeleitet aus `ci-evidence.json`. Tabelle: Median der jeweils drei vorhandenen erfolgreichen CI-Vorläufe; getrennte Phasenmediane sind nicht notwendig zum medianen Jobgesamtwert addierbar.

| Job | Runner/Checkout/Werkzeugsetup (s) | npm-Abhängigkeiten (s) | Browserinstallation (s) | Prüfgruppe inkl. internem Aufbau (s) |
| --- | ---: | ---: | ---: | ---: |
| link-generator | 3 | 0 | 0 | 1 |
| contract | 13 | 0 | 0 | 28 |
| backend | 9 | 0 | 0 | 79 |
| backend-retirement | 5 | 0 | 0 | 1121 |
| browser | 12 | 4 | 30 | 416 |
| browser-transition | 10 | 6 | 22 | 177 |

Zeitstempel haben Sekundenauflösung; Null ist kein Beleg für vollständig kostenlosen Aufbau. Maven-Cache-Hits, Runnerinstanzen und Cache-/Lastgrenzen sind in REPORT dokumentiert. Kritischer CI-Pfad 1129 s und Jobzeitsumme 1984 s bleiben separat; keine Addition mit den lokalen sequenziellen Gruppenzeiten.

## Mehrfach-Builds und dauerhafte Schutzgrenzen

- Vertragsgruppe: beide OpenAPI-Versionen, Java-Generierung/Kompilierung, npm ci, TypeScript-Generierung/Vertragskompilierung und SPA mit zusätzlichem prebuild. Gemessene Phasen: LOCAL-BASELINE.md.
- Backend verify generiert/kompiliert und paketiert erneut. XML-Klassendauern und Restzeit oben bilden dessen gesamte Gruppenzeit ab.
- Jede der drei Browser-API-Fixtures bereitet erneut Backend/Testklassen und Classpath auf; Übergang/Automatik benötigen Package. Übergang baut außerdem aktuellen SPA-/Legacy-Previewzustand auf.
- `ReleaseTransitionIT.oldRelease` ruft `scripts/build-reference-release.sh` auf: saubere Extraktion des festen Altcommits und eigener Maven-clean-package-Lauf. Dieser Aufwand ist in den Prozessklassenzeiten enthalten. Die Anzahl tatsächlicher dynamischer Aufrufe und deren individuelle Dauer werden nicht aus Dateinamen geschätzt.
- Beide CI-Backendjobs führen Surefire aus. Das ist belegte Mehrfachausführung desselben Unit-/Architekturbestands, kein zusätzlicher Fachnenner.

Die inklusive Zuordnung verhindert erfundene Einsparungszusagen: Wiederverwendung unveränderlicher Buildartefakte ist ein Kandidat; tatsächliche PG-Zustände, Konten, RLS-Rollen, Commit-/Parallelitäts-/Prozessgrenzen und Lebenszyklen bleiben unabhängige reale Nachweise.
