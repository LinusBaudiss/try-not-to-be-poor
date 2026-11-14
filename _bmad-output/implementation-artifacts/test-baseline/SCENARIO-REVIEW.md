# Abgeschlossener statischer Szenario-Abgleich — Story 5.1

Referenz: `8f66421be3b7090c5cd384c9679657d9a17a6b3f`, geprüft am 2026-11-14. Dies schließt den **statischen fachlichen Abgleich** ab. Die erfolgreiche Ausführung der gesamten Integration, die Laufzeit-Baseline und Code-/Zweigabdeckung sind separate, weiterhin offene Nachweise; der Storystatus bleibt `in-progress`.

## Verbindliche Zählung

Ein Szenario ist eine Regel mit relevanter Eingabe beziehungsweise Zustand und beobachtetem Ergebnis. Gezählt wird die kanonische ID genau einmal je Backend beziehungsweise Frontend. Quellmethoden, Assertionen, Discovery-Ausführungen, CI-Jobs und Bildschirmgrößen sind keine Zähleinheiten. Dieselbe beobachtete Feldregel bei Anlage und Bearbeitung bekommt eine gemeinsame ID. Eine andere reale Grenze — etwa HTTP-Typprüfung, Eigentümerfilter/RLS, äußerer Commit, Sperrreihenfolge oder tatsächliches Browserverhalten — bleibt ein eigenständiger Nachweis und gegebenenfalls ein eigenständiges Szenario. Ähnliche Statuscodes reichen für eine Zusammenführung nicht aus.

Das Manifest bewahrt die bisherigen `SC:`-Quellgruppen unverändert als Rückverweise. `semantic_assignments` ordnet jede davon explizit den geprüften `canonical_scenarios` zu. Jeder Quellfall führt zusätzlich seine kanonischen IDs; die Inventar-CSV enthält beide Ebenen. Jede kanonische Zeile nennt Eingabe, tatsächliche Erwartung, Anforderungen, Primärnachweis/Testart, ergänzende Quellen, Risiko, begründete Zusammenführung/Trennung und notwendige reale Integration. Eine Zuordnung behauptet keinen neuen bestandenen Test oder Ersatznachweis.

| Bestand | Anzahl |
| --- | ---: |
| Zugeordnete Quellfälle einschließlich Werkzeugtests | 746 |
| Erhaltene bisherige Quell-/Beobachtungsgruppen | 1534 |
| Geprüfte innere Browser-Schleifen | 99 |
| Kanonische Einträge einschließlich Architektur/Infrastruktur | 1624 |
| Kanonische Einträge mit mehreren Quellfällen | 124 |

| Bereich | Unterschiedliche Fach-/Schutzszenarien | Unit-/isolierte Komponentenszenarien | Anteil |
| --- | ---: | ---: | ---: |
| Backend | 1096 | 143 | 13.05 % |
| Frontend | 467 | 0 | 0 % |

Backend getrennt nach primärem Testnachweis: 143 Unit, 758 HTTP/PostgreSQL, 42 PostgreSQL und 153 Prozess/PostgreSQL. Zusätzlich 27 Architekturgruppen und eine Backend-Prozesshilfe außerhalb des fachlichen Nenners; weitere 33 Python-Werkzeuggruppen separat. Alle Frontendszenarien sind derzeit Browserprüfungen, auch bei HTTP-Stubs. Es gibt keine bestehenden isolierten Frontend-Komponententests. Der spätere Mehrheitswert ist im Bestand klar verfehlt; die Klassifikation wird nicht zur Quotenerfüllung geändert.

Die kanonische Zahl kann trotz Zusammenführungen über der bisherigen Quellgruppenzahl liegen: Die alte Discovery hat innere Varianten nicht einzeln ausgewiesen. Nach dem Abgleich sind etwa einzelne JWT-Claims, vier historische Null-/Ohne-Budget-Zustände sowie innere Browser-Eingaben und Antwortvarianten ausdrücklich unterscheidbar. Das ist die Auflösung vorhandener Fälle, kein neuer Testbestand.

## Geprüfte Zusammenführungen und geschützte Unterschiede

| Fallfamilie | Entscheidung | Erhaltener Grenznachweis |
| --- | --- | --- |
| Ausgabe: Null-/Negativ-/Grenzbetrag und Name | Gleiche Feldregel zwischen `ExpenseTest`, POST- und PUT-Matrix teilen; bloße ASCII-Leerraummenge erzeugt keinen neuen Fall | Beide wirklichen HTTP-Mutationen mit Feldzuordnung und Bestandserhalt bleiben erforderlich; früher Service-Abbruch vor Repositorykontakt separat |
| Sparziel: Betrag, Name und Kalendergrenze | Anlage/Bearbeitung/Fachvalidator bei derselben Eingabe zusammenführen; Feldkontexte gleichnamiger Schleifenvariablen ausdrücklich auseinanderhalten | POST/PUT, striktes JSON, unveränderte Zielfelder und echte Persistenz bleiben erforderlich |
| Budgetbetrag | Reine Bereichsregel und passender HTTP-Fall gemeinsam; fehlendes Budget und Nullbudget bleiben verschieden | Typ-/Dokumentprüfung und tatsächliche HTTP-/DB-Wirkung bleiben eigener Schutz |
| Passwortlänge | Dieselben 15-/64-Codepunktgrenzen aus direkter Policy und echter Registrierung gemeinsam zuordnen | Vollständige ungetrimmte Speicherung, NFC, Argon2 und HTTP-Commit werden dadurch nicht zu Unit-Nachweisen |
| JWT | Einzelne ungültige Claims und kryptografische Fehler explizit auflösen; dieselbe Decoderregel über Ressourcen hinweg einmal zählen | Jeder geschützte Einstieg/HTTP-Methode behält seine reale 401-/Datenleck-/Mutationsprüfung; unterschiedlicher Algorithmus/Schlüssel/Claim bleibt unterscheidbar |
| Kalender | Gleicher Zeitpunkt und gleicher Berliner Tag aus Fachkontext und Ausgabenerfassung zusammenführen | Tatsächlich serverseitig gespeichertes Datum und Zeitermittlung erst nach Kontosperre bleiben zusätzlich real erforderlich |
| Responsive Oberfläche | Wiederholung derselben Anzeige-/Bedienregel bei vier Größen gemeinsam zählen | Alle vier konkreten Viewports, Textgrößen, Tastatur-/Fokus-/Kontrastproben bleiben erhalten; kein Browserfall wird entfernt |
| Innere Browser-Schleifen | Unterschiedliche Beträge, Feldfehler, Antwortformen und Zustände explizit zuordnen; dieselbe Editor-Eingaberegel bei Anlage/Bearbeitung teilen | Tatsächliche Aktion, Entwurf, Fehlerfokus und Antwortreihenfolge bleiben über Quell-/Schleifenverweis nachvollziehbar |
| Vererbung, Poolproben, Bestandsfelder, Wiederholung | Gleicher Fall mit ergänzenden Ausführungs-/Beobachtungspfaden | V2-Verdrahtung, unabhängige Verbindungen und tatsächliche gemeinsame Transaktion bleiben verpflichtend |
| Autorisierung, Migration, Monatsherkunft, Versionsbarriere | Verschiedene Konten/Rollen/Tabellen, Versionen, Migrationseingänge, historische Zustände, Commitausgänge und Reihenfolgen bleiben getrennt | Insbesondere echte PostgreSQL-RLS, äußerer Commit/Rollback sowie echte alte/neue Releases und Prozesse werden niemals durch eine ähnliche Unit-Assertion ersetzt |

Backend und Frontend haben getrennte Nenner. Eine serverseitige Regelablehnung ist kein Nachweis für verständlichen UI-Fehler, Entwurferhalt oder spät eintreffende Antwort; solche Beobachtungen werden ausdrücklich nicht ebenenübergreifend zusammengelegt. Der gemeinsame fachliche Bezug steht in den Anforderungsreferenzen.

Alle 17 Monatsfälle und AD-8/9/10-Präzisierungen bleiben in [monthly-and-protected-matrix.md](monthly-and-protected-matrix.md) zugeordnet. Die offenen Produktabnahmen 4.6–4.8 bleiben offen. Zusammenführungen erlauben in 5.1 keinerlei Testentfernung; vor späterer Entfernung sind erfolgreiche Ersatz- und Integrationsnachweise erforderlich.

## Reproduktion und Schutz vor falscher Fortschreibung

```sh
python3 _bmad-output/implementation-artifacts/test-baseline/refresh-source-inventory.py
python3 _bmad-output/implementation-artifacts/test-baseline/semantic-scenarios.py
python3 _bmad-output/implementation-artifacts/test-baseline/verify-manifest-refresh.py
```

Die ersten beiden Befehle prüfen die explizite Zuordnung und erzeugen Inventar, `canonical-scenarios.csv` und `semantic-summary.json`. Sie vergeben keine neuen semantischen Zuordnungen automatisch. Neue/geänderte Quellen oder Fixtures, fehlende/verwaiste Zuordnungen, ein nicht vorhandener Primärnachweis, falsche Unit-Einstufung, verlorene Integrationsverweise und gemischte Backend-/Frontendzuordnungen führen zum Fehlerstatus. Zwölf gezielte Inventar-/Semantikprüfungen bestehen; sie ersetzen keinen Produktprüflauf.

Die 99 inneren Browser-Schleifen sind samt tatsächlichem Körper, aufgelösten Arrays, Quellhash und expliziter Entscheidung im Manifest erhalten. Die rohe AST-Extraktion lässt sich mit `node _bmad-output/implementation-artifacts/test-baseline/extract-browser-loops.cjs` reproduzieren; deren Ausgabe ist Quellmaterial für einen erneuten Review und überschreibt keine geprüfte Entscheidung. Dynamische Kontroll-/Fixturekollektionen zählen nicht als zusätzliche fachliche Eingaben.
