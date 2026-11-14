# Story 5.1 — Testinventar, Baseline und Abschlussprüfung

Historische Rohbelege (Logs, Patches, XML-/Coverage-Berichte und Versuche) sind unverändert im [geprüften Nachweisarchiv](ARCHIVE.md) erhalten. Pfade zu diesen Belegen beziehen sich auf den dort wiederhergestellten alten Verzeichnisbaum.

Stand: 2026-11-14. Die technische Umsetzung und das Abschlussreview sind abgeschlossen; die Story wird zur Projektabnahme vorgelegt. Keine Produktionsfreigabe und keine vorweggenommene Abnahme von Epic 5 oder Produktstories 4.6–4.8.

## Ergebnis

| Nachweis | Ergebnis |
| --- | --- |
| Vollständige lokale Serie | Warm-up, drei Messungen und bereinigter Kontrolllauf erfolgreich; Median **1755,133 s = 29:15,133** |
| Verbindliches Nutzerziel | Vollständiger Median **≤ 900 s = 15:00**; noch nicht erreicht und erst in 5.5 nachzuweisen |
| Nötige Einsparung | **855,133 s = 14:15,133 beziehungsweise 48,72 %** gegenüber der Baseline |
| Tatsächliche Ausführung je Baseline-Lauf | 33 Python-, 49 Surefire-, 433 Failsafe-, 224 normale Browser-, 5 Übergangs- und 91 Automatikfälle; beide Verträge und SPA erfolgreich |
| Identitäten/Fehler | Dieselben 482 Backend-Identitäten in allen fünf Läufen, keine doppelten Identitäten/Fehler/Skips; alle 320 Browserausführungen bestätigt |
| Separate Coverage | 96,816 % Zeilen und 86,053 % Zweige; generierter Vertragscode ausgeschlossen, Nenner und Unter-JVM-/Frontend-Lücken ausdrücklich dokumentiert |
| Aktuelle Werkzeugprüfung nach Review | 42 Python-Tests und 14 Inventar-/Semantikprüfungen erfolgreich, einschließlich realer Signal-/Prozessbaumregressionen |
| Aktuelle Discovery | Dynamisch erwartete 49/433 Backendfälle passen zu allen fünf historischen XML-Berichten; aktuelle Browser-Discovery 224/5/91 ohne Serverstart |

Die Leistungsgrenze ist eine Vorgabe für das Refactoring, kein Erfolgskriterium der Referenzmessung selbst. Keine bestehende fachliche Assertion, Produktimplementierung, Pflichtgruppe oder produktive Kryptoparametrisierung wurde abgeschwächt.

## Nachweise und Entscheidungen

- [ACCEPTANCE.md](ACCEPTANCE.md): Prüfung aller acht Story-Abnahmekriterien und ihrer Grenzen.
- [LOCAL-BASELINE.md](LOCAL-BASELINE.md): Rohwerte, Median, Ziel, Klassenrangfolge, Umgebung/Cache und Vergleichsgrenzen; [analysis.json](local-reference-02/analysis.json) enthält die geprüfte Ableitung.
- [COSTS.md](COSTS.md): getrennte Setup-/Prozess-/PostgreSQL-/Restkostenbereiche und CI-Schrittmediane; Rohdaten in `cost-breakdown.json`, `ci-step-costs.json` und `ci-evidence.json`.
- [SCENARIO-REVIEW.md](SCENARIO-REVIEW.md): Zählregel und konkrete Gleichwertigkeitsentscheidungen; einzelne Fälle in `canonical-scenarios.csv`, `source-matrix.csv` und `reviewed-scenario-manifest.json`.
- [monthly-and-protected-matrix.md](monthly-and-protected-matrix.md): alle 17 Monatsfälle, zusätzliche AD-8/9/10-Regeln, geschützte echte Integration und spätere kontrollierte Fehlervarianten.
- [Coverage-Referenz](coverage-reference-630ad58/README.md): originale JaCoCo-/XML-/Exec-Berichte, Counter-/Klassennenner, Herkunft und Prüfsummen.
- [REVIEW.md](REVIEW.md): drei unabhängige Reviewebenen, Befunde, Korrekturen und Verifikationsbelege.

## Referenz und Vergleichsgrenzen

Gemessener Stand: Commit `630ad58c5ad688e6436d1c4edf1a4d354d63def5` **plus dokumentierter Korrekturpatch und Inputhashmanifest** in `local-reference-02`. Der frühere Analyse-/Planungsstand `8f66421be3b7090c5cd384c9679657d9a17a6b3f` bezeichnet nicht alleine die tatsächlich gemessene Werkzeugversion. Die relevanten erfassten Quellen waren beim nachträglichen Start-/Auswertungsabgleich unverändert; dies ist kein kontinuierlicher Monitor der historischen Serie.

Die alte Serie erfasste Last nur am Start und keine detaillierten cgroup-/Affinitäts-/Hostfingerprintwerte. Diese Grenzen sind sichtbar, werden nicht rückwirkend mit erfundenen Werten gefüllt und sind beim Zielvergleich auf demselben Host zu berücksichtigen. Neue Serien erfassen diese Werte sowie Randwerte je Lauf, archivieren relevante unversionierte Eingaben und invalidieren Quelländerungen. XML-Klassen-/Jobzeiten sind inklusive Messbereiche; exklusive Unterphasen innerhalb eines Prozessfalls werden nicht behauptet.

Drei erfolgreiche CI-Vorläufe mit identischem damaligem ausführbarem Scope: kritischer Pfad **1129 s**, summierte Jobzeit **1984 s**, Queue separat. Sie bilden die CI-Ausgangslage, keine lokale Zeit. Runner-/Cache-/Ereignisabweichungen sowie zusätzlich entstandene Werkzeugregressionen müssen beim späteren CI-Zielvergleich beachtet werden. Aktueller lokaler Engpass: ReleaseTransitionIT und AdministrativeSerializationIT zusammen 1145,868 s beziehungsweise 65,29 % des Medianlaufs.

## Refactoring-Reihenfolge

1. **5.2:** fachliche Backendvarianten direkt prüfen; Grenzen aus der Matrix erhalten. Isolierte Kernklassen kosten bereits wenig; allein damit ist das 15-Minuten-Gesamtziel nicht erreichbar.
2. **5.3:** schnelle UI-Eingabe-/Zustands-/Antwortreihenfolgetests einführen. Tatsächliche Cookies, Interceptor, Fokus, Reflow und vollständige Nutzerwege bleiben Browserprüfungen.
3. **5.4:** dominanten Prozessharness und wiederholte unveränderliche Buildaufbauten optimieren; echte alte/neue Releases, PostgreSQL und Commit-/Rücknahmebarrieren bewahren. Die aktuelle Zielannahme verlangt bei unveränderten anderen Kosten rund 74,63 % Einsparung im Prozesspaar; Erreichbarkeit ist noch zu belegen.
4. **5.5:** Gleichwertigkeit, >50-%-Testverteilung pro Bereich, vollständigen Median ≤ 900 s und nicht verschlechterten CI-Pfad nachweisen. Kein Auslassen oder Abschwächen als Leistungsgewinn zählen.

## Historische Versuche

`attempt-2026-11-14-*` und `recheck-*` dokumentieren Sandbox-/Download-/Socketfehler. `local-reference-01` endete im Python-Warm-up wegen einer an isolierte Vertragsfixtures vererbten Phasenvariable; der Fehler wurde korrigiert. Diese Versuche gehen in keinen Leistungsmedian ein. Sie sind durch die erfolgreiche Serie **kein aktueller Messblocker mehr**.

Die ursprüngliche 30-%-Planungsannahme wurde auf ausdrücklichen Nutzerauftrag durch das absolute 15-Minuten-Ziel ersetzt. Historische Rohberichte im Schema 1 behalten ihre damalige Zielangabe. Schema 3 neuer Runnerberichte enthält das feste `target_seconds: 900`, getrenntes `target_met`, ausgeführte Befehle, Ressourcen-/Inputidentität und Discoveryvalidierung. Eine erfolgreiche Referenz kann `target_met: false` haben; eine unvollständige Serie hat `target_met: null`.
