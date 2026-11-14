# Auswertung der vollständigen lokalen Baseline

Historische Rohbelege (Logs, Patches, XML-/Coverage-Berichte und Versuche) sind unverändert im [geprüften Nachweisarchiv](ARCHIVE.md) erhalten. Pfade zu diesen Belegen beziehen sich auf den dort wiederhergestellten alten Verzeichnisbaum.

**Ergebnis: Warm-up, drei vollständige Messungen und bereinigter Kontrolllauf sind erfolgreich.** Die zuvor fehlende lokale Laufzeitserie liegt damit vor. Der statische Szenarioabgleich und die separat gesicherte Coverage bleiben ergänzende Qualitätsnachweise; ein formaler Story-/Epic-Abschluss wird durch diese Auswertung allein nicht behauptet.

## Gesamtlaufzeit und Ziel

| Lauf | Zeit (min:ss) | Sekunden | Wertung |
| --- | ---: | ---: | --- |
| 0 – warmup | 26:47.761 | 1607,761 | Erfolgreicher Kontrolllauf, nicht im Median |
| 1 – measurement | 28:09.182 | 1689,182 | Medianstichprobe |
| 2 – measurement | 29:15.133 | 1755,133 | Medianstichprobe |
| 3 – measurement | 29:26.059 | 1766,059 | Medianstichprobe |
| 4 – clean | 26:51.958 | 1611,958 | Erfolgreicher Kontrolllauf, nicht im Median |

**Referenzmedian: 1755,133 s = 29:15.133.** Die ausdrückliche Nutzerentscheidung vom 14.11.2026 verlangt später **höchstens 900 Sekunden = 15:00 Minuten**, also mindestens **855,133 Sekunden = 14:15,133 Minuten (48,72 %)** Einsparung. Dieses absolute Ziel ersetzt die frühere relative 30-%-Planungsannahme und bleibt auch bei einer neuen Baseline auf 900 Sekunden begrenzt. Das ist eine Zielvorgabe, noch kein erzielter Refactoring-Erfolg.

Die drei Messwerte liegen zwischen 28:09.182 und 29:26.059; Spannweite 76,877 s beziehungsweise 4.38 % des Medians. Der bereinigte Lauf ist rund 8.16 % schneller als der Median. Das widerlegt die Ausführbarkeit nicht, zeigt aber wechselnde Laufzeitbedingungen. Mangels laufbezogener Last-/Temperaturdaten lässt sich dafür keine Ursache nachweisen.

## Aufteilung des Medianlaufs

Für die addierbare Aufteilung werden die Gruppen aus **demselben Medianlauf 2** verwendet. Die unabhängigen Gruppenmediane stehen zusätzlich in `local-reference-02/analysis.json`; sie dürfen nicht als exakte Zerlegung des Gesamtmedians addiert werden.

| Prüfgruppe | Zeit (min:ss) | Anteil am Medianlauf |
| --- | ---: | ---: |
| Python | 00:01.316 | 0.07 % |
| Verträge/Generierung/Kompilierung/SPA | 00:22.069 | 1.26 % |
| Backend verify | 20:16.421 | 69.31 % |
| Browser normal | 04:20.446 | 14.84 % |
| Browser Versionsübergang | 02:01.570 | 6.93 % |
| Browser Monatsautomatik | 02:13.283 | 7.59 % |

Alle Gruppen liefen sequenziell; Unterbuilds, Server-/Datenbank-/Browseraufbau, Wartezeit und Cleanup liegen innerhalb der Gruppenfenster. Kein Pflichtjob und kein bestehender Fall wurde zur Messung ausgelassen.

## Konkrete Kostenkandidaten

| Klasse | Lauf 1 (s) | Lauf 2 (s) | Lauf 3 (s) | Median (s) |
| --- | ---: | ---: | ---: | ---: |
| ReleaseTransitionIT | 850,498 | 905,098 | 955,486 | 905,098 |
| AdministrativeSerializationIT | 241,632 | 240,770 | 232,186 | 240,770 |
| FinanceMigrationIT | 9,771 | 9,819 | 8,934 | 9,771 |
| MonthlyDeletionIT | 6,851 | 6,915 | 7,366 | 6,915 |
| RegistrationV2IT | 5,959 | 6,672 | 5,589 | 5,959 |
| RegistrationIT | 5,223 | 5,534 | 5,184 | 5,223 |
| MonthlyCorrectionIT | 3,039 | 3,141 | 3,536 | 3,141 |
| MonthlyAutomationE2eServerTest | 2,320 | 2,384 | 2,333 | 2,333 |

`ReleaseTransitionIT` (59 Ausführungen) und `AdministrativeSerializationIT` (20) benötigen im Medianlauf zusammen **1145,868 s = 19:05.868**. Das sind **65.29 %** der vollständigen Laufzeit und **94.20 %** der Backend-Gruppe.

Alle übrigen Backend-Klassen **einschließlich restlichem Backend-Buildaufwand** liegen im Medianlauf zusammen nur bei rund **70,553 s (4.02 % des Gesamtlaufs)**. Selbst deren vollständige, unzulässige Entfernung würde das 15-Minuten-Ziel nicht erreichen. Fachliche Unit-Verlagerung in 5.2 bleibt für schnelle Rückmeldung und die Testverteilung wichtig, ist allein aber kein ausreichender Laufzeithebel.

Falls alle anderen Kosten gleich blieben, müssten die beiden Prozessklassen zusammen rund **74,63 %** ihrer Zeit einsparen, um das Gesamtziel zu erreichen. Das ist eine Rechenbedingung, keine Zusage. Quellen zeigen wiederholte echte alte/neue Releases, Datenbanken, Guards und Builds; aus XML-Summen lässt sich deren interne Zeit nicht exakt aufteilen.

Priorität für die Umsetzung:

1. **5.2:** geeignete Geld-/Kalender-/Validierungs-/Differenzregeln isoliert absichern; die gemeinsame Szenariomatrix nutzen und echte Grenzen erhalten. Erwarteter Nutzen vor allem schnelles gezieltes Feedback, begrenzte absolute Gesamtersparnis.
2. **5.3:** UI-Eingaben, Zustände und Antwortreihenfolgen schnell absichern. Die Browsergruppen kosten im Medianlauf gemeinsam rund 08:35.300. Reale Cookies, Interceptor, Fokus, Reflow und vollständige Wege bleiben erforderlich.
3. **5.4:** den dominanten Prozessharness priorisieren: unveränderliche Release-/Generator-/Buildartefakte nur mit nachgewiesener Invalidierung wiederverwenden; vermeidbare Mehrfachaufbauten und Wartebedingungen prüfen. Fachlicher Datenbankzustand, Rollen/RLS, unabhängige Verbindungen, tatsächlicher Prozesslebenszyklus und Versionsbarriere dürfen nicht gecacht oder vorgetäuscht werden. Doppelte Surefire-Ausführung in den zwei CI-Backendjobs bleibt ein gesonderter CI-Kandidat.

Das verbindliche 15-Minuten-Ziel erfordert gegenüber der Baseline 48,72 % Gesamtersparnis. Es ist deutlich anspruchsvoller als die frühere Annahme und durch die Baseline noch nicht als erreichbar bewiesen. Wenn sich dort keine sichere ausreichende Einsparung ergibt, Zielverfehlung offenlegen; keine stille Zielsenkung und kein Auslassen von Integration.

## Vertragsphasen

Inklusive Phasenmediane aus den drei Messungen. Java- und SPA-Zeiten enthalten Generierung beziehungsweise weitere Unterkommandos; keine isolierten Compiler-CPU-Zeiten.

| Phase | Median (s) |
| --- | ---: |
| generation-validation | 1,369 |
| compatibility | 0,077 |
| java-generation-compilation | 6,028 |
| dependency-setup | 3,394 |
| typescript-generation | 2,796 |
| typescript-contract-compilation | 1,606 |
| spa-generation-compilation | 6,006 |

Die gesamte Vertragsgruppe kostet nur etwa 1,3 % des Medianlaufs. Mehrfache Java-/TypeScript-Generierung, Maven-Testkompilierung/Package für Browser-API-Starts sowie SPA-/Altbundle-Aufbau bleiben in der Messung enthalten. Quellbelege: `scripts/check-contract.sh`, `scripts/start-e2e-api.sh`, `scripts/start-automation-e2e-api.sh`, `scripts/start-transition-preview.sh` und `scripts/build-reference-release.sh`. Ohne Zeitmarken in den Unterprozessen ist eine weitere genaue Aufteilung von Prozess-/Datenbank-/Unterbuildkosten nicht belegt; keine fiktiven Detailzeiten.

## Qualität und Vollständigkeit

- Jeder der fünf Durchläufe: **33 Python**, **49 Surefire**, **433 Failsafe**, **224 normale Browser**, **5 Übergangs-Browser** und **91 Automatik-Browser** erfolgreich; beide Vertragsprüfungen und SPA-Build ebenfalls erfolgreich.
- XML-Prüfung: keine Fehler, Fehlschläge oder übersprungenen Backendfälle; dieselben 482 Backend-Testidentitäten in allen fünf Läufen; keine doppelten Identitäten zwischen Surefire und Failsafe.
- Browser-Logsummen bestätigen alle 320 erwarteten Ausführungen je Durchlauf; Exitcodes aller sechs Gruppen null. Vertragsphasen haben ebenfalls Exitcode null.
- Gescheiterter früherer Lauf `local-reference-01` bleibt als Fehlversuch erhalten und fließt nicht ein.
- Separate Coverage: **96,816 % Zeilen, 86,053 % Zweige**. Gesicherte Berichte und Klassen-/Zählernenner unter [coverage-reference-630ad58/README.md](coverage-reference-630ad58/README.md). Frontend-Ausgangslücke und Unter-JVM-Instrumentierungslücke bleiben sichtbar.
- Statische Fachverteilung weiterhin **143/1096 Backend-Unit (13,05 %)**, **0/467 Frontend-Unit-/Komponenten**. Ausführungszahlen werden nicht zur Fachquote umgedeutet. Offene Produktabnahmen 4.6–4.8 bleiben offen.

## Referenz, Reproduktion und Grenzen

- Commit: `630ad58c5ad688e6436d1c4edf1a4d354d63def5` **plus aufgezeichneter uncommitteter Korrekturstand**, nicht nur dieser Commit allein. Patch-SHA-256: `c373419f35c47a71c8f1f32f429c3f07d0875f72f87982d056739e7df6393f00`. `tracked-input.patch` und `input-sha256.json` im Messordner erhalten diesen Stand; die Laufzeitwerkzeuge werden für spätere Vergleiche entsprechend fixiert.
- Nachträglicher Prüfsummenabgleich aller erfassten relevanten Quellen/Verträge/Startskripte/Buildkonfigurationen: **keine Abweichung**. Das ist eine Start-/Auswertungsprüfung, kein kontinuierlicher Quellmonitor.
- Host: Linux x86_64, 20 logische CPUs; Java/Javac 25.0.5.0.3, Node 24.22.0, npm 11.19.1, Python 3.12.3. Startlast: 2,97 / 3,54 / 4,69. Cacheangabe: vorbereitete Abhängigkeiten, keine parallelen Builds; bestehende Abhängigkeits-/Tool-/Browsercaches bleiben erhalten. Ressourcenlimits und laufbezogene Lastwerte sind nicht separat aufgezeichnet.
- Vergleichsstand später auf demselben Host, mit gleichen Werkzeugpins, Gruppen/reihenfolge und Cachebedingungen messen. Neue Frontend-Unit-/Komponententests müssen hinzukommen. Geänderten Produktumfang ausdrücklich abgleichen; keine fehlenden Pflichtgruppen als Beschleunigung zählen.
- CI bleibt eine separate Auswertung: die dokumentierten drei erfolgreichen CI-Vorläufe haben 1129 s medianen kritischen Pfad und 1984 s Jobzeitsumme. Die parallele CI-Zeit ist kein Ersatz für diese sequenzielle lokale Baseline. Zusätzliche Messwerkzeugtests/Korrekturstand und tatsächliche Runner-/Cachebedingungen im späteren CI-Vergleich gesondert berücksichtigen.

Rohdaten: [results.json](local-reference-02/results.json). Geprüfte Auswertung, Einzelklassendauern und Quellprüfsummen: [analysis.json](local-reference-02/analysis.json). Für diese Auswertung wurden keine teuren Prüfläufe wiederholt.

## Zieländerung durch Nutzerentscheidung

Am 14.11.2026 hat Linus ausdrücklich maximal 15 Minuten festgelegt. Die drei gemessenen Rohwerte, ihr Median und die Prüfergebnisse bleiben unverändert. `local-reference-02/results.json` ist ein unveränderter historischer Messbericht im alten Schema und enthält noch das damalige relative Ziel; das gilt nicht mehr als Abnahme. Die abgeleitete `analysis.json`, diese Auswertung, Epic TR-1 und neue Messberichte verwenden das absolute 900-Sekunden-Ziel. `target_met` bewertet nur die Zielerfüllung; erfolgreiche Prüfungen bleiben auch bei Zielverfehlung als erfolgreiche Referenzmessung gültig.
