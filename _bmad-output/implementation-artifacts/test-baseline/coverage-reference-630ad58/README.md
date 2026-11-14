# Übernommene separate Coverage-Referenz

Vom Nutzer ausgeführt: `./backend/mvnw -B -f backend/pom.xml -Pcoverage clean verify`.
Ausgewerteter Checkout: `630ad58c5ad688e6436d1c4edf1a4d354d63def5`. Die Revision wurde bei Übernahme gelesen, nicht durch einen Coverage-Runner zum Start erfasst. Der Produkt-/Backend-Testquellstand ist seit dieser Ausführung unverändert; danach wurde nur der Fehler der Phasenmessungsumgebung samt Werkzeugregression korrigiert.

49 Surefire- und 433 Failsafe-Ausführungen: 0 Fehler, 0 Fehlschläge, 0 übersprungen. Die originalen XML-Testergebnisse und die JaCoCo-Ausgaben einschließlich Exec-Daten sind hier vor einem weiteren `clean` gesichert; Prüfsummen und Klassen-/Counter-Nenner stehen in `evidence.json`.

| Metrik | Abgedeckt / Gesamt | Anteil |
| --- | ---: | ---: |
| Instruktionen | 8106 / 8461 | 95,804 % |
| Zweige | 654 / 760 | 86,053 % |
| Zeilen | 1125 / 1162 | 96,816 % |
| Methoden | 429 / 436 | 98,394 % |
| Klassen | 79 / 81 | 97,531 % |

JaCoCo 0.8.14, Profil `coverage`. Generierte Klassen unter `de/linus/tnbp/contract/**` sind ausgeschlossen; in `jacoco.xml` sind keine Vertragspakete enthalten. Vorher/Nachher dieselbe Werkzeug-/Profil-/Ausschlusskonfiguration verwenden; die Klassenliste und covered/missed-Werte aus `evidence.json` und XML bilden den überprüfbaren Nenner. Falls Produktionscode in Folgestories extrahiert wird, Änderungen dieses Nenners ausdrücklich erklären.

Eigenständige Prozess-Unter-JVMs erhalten den Agent nicht automatisch; das ist eine Instrumentierungslücke, kein Nachweis fehlender Prozessprüfungen. Frontend-Unit-/Komponentenabdeckung fehlt weiterhin als Ausgangslücke. Die Zahlen ergänzen die Fallmatrix, ersetzen weder Mutations-/Fehlererkennungsnachweise noch echte Integration. Keine Laufzeit dieser instrumentierten Ausführung wird als primäre Baseline verwendet.

HTML-Ansicht: [JaCoCo](jacoco/index.html).
