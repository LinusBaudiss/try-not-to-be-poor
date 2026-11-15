# Story 5.3 — Abnahme und Prüfnachweise

Stand: 2026-11-15. Umsetzung und unabhängiger Review sind abgeschlossen; Sprintstatus `review` zur Abnahme. Produktverhalten und API-Verträge wurden nicht geändert.

## Ergebnis

Zwölf isolierte Testquellen prüfen 324 Fälle: 43 Units für exakte Geld-/Fortschrittsregeln und 281 Komponententests mit produktiven Angular-Templates, generierten HTTP-Clients, echter Session und Interceptor sowie Angulars HTTP-Testbackend. Sie erfassen Eingabegrenzen, deutsche Anzeige, Kalenderdaten, fehlendes/Nullbudget, signierten Fortschritt, Fehler-/Leer-/Ladezustände, Entwürfe, Doppelsenden, unbestätigte Mutationen und Löschbestätigung. Lebenszyklus- und Routerfälle prüfen Abmeldung, Tokenablauf, Folgekonten, echte Komponentenzerstörung/-neuerstellung und späte Antworten.

| Bereich | Fachszenarien | Isolierter Hauptnachweis | Anteil |
| --- | ---: | ---: | ---: |
| Frontend | 467 | 234 | 50,11 % |
| Backend, durch 5.3 unverändert | 1096 | 168 | 15,33 % |

Weitere 13 Frontendszenarien haben ausschließlich isolierte Zusatznachweise. Kanonische IDs, Anforderungen und Integrationsverweise bleiben erhalten; wiederholte Ausführungen erhöhen den Anteil nicht. Zwei neue Messwerkzeugregressionen zählen ausschließlich als Infrastruktur: 1635 kanonische Einträge insgesamt einschließlich aller ursprünglichen 1633 IDs. Matrix und Ableitungen stehen unter `test-baseline/`.

## Aktuelle erfolgreiche Prüfungen

`test-baseline/story-5-3/review-final-checks.json` enthält Befehle, Exitcodes, getrennte Laufzeiten, Testzahlen und die Herkunft der ursprünglichen Konsolenausgaben. Alle aufgeführten Exitcodes sind 0.

| Prüfung | Ergebnis | Gesamtdauer |
| --- | --- | ---: |
| Python | 44/44 | 2.013 s |
| Manifestregressionen | 25/25 | 2.855 s |
| Units | 43/43 | 1.983 s |
| Komponenten | 281/281 | 6.143 s |
| Coverage-Verbund | 324/324 | 7.409 s |
| SPA-Build | bestanden | 3.073 s |
| Vertrag v1/v2 einschließlich Generatoren, Kompilierung und SPA | bestanden | 15.505 s |

Der gemeinsame JSONlauf (`vitest-results.json`) belegt 324/324 erfolgreiche Fälle in zwölf Quellen; tatsächliche Discovery und Inventarrefresh bestehen. Coverage (`coverage-summary.json`): 87,07 % Statements, 80,55 % Branches, 85,59 % Functions und 91,01 % Lines; generierte API-Dateien und Testhilfen sind ausgeschlossen. Instrumentierte Zeiten sind separat ausgewiesen. Diese Einzelläufe sind keine vollständige Medianmessung.

## E2E-Ersatz und erhaltene Browsergrenzen

Genau neun reine ungültige DTO-Antwortvarianten der Monatsübersicht wurden nach einzeln nachgewiesenem Alt-/Neu-Erfolg aus der inneren E2E-Schleife entfernt. `browser-reduction.json` ordnet jede ursprüngliche Eingabe ihrer unveränderten kanonischen ID und ihrem konkreten bestandenen isolierten Test zu. Die isolierten Fälle beginnen mit bestätigten Geld-/Detailwerten und prüfen danach Fehlertext, entfernte Werte/Details und mögliche erneute Prüfung. Im Browser bleiben der repräsentative Nullfall, Netzwerkfehler, erfolgreiche Wiederholung und die echte Zugangs-/HTTP-Verdrahtung erhalten. Sämtliche weiteren Browserfälle bleiben unverändert.

| Externer Browsernachweis | Ergebnis | Dauer |
| --- | ---: | ---: |
| Regulär vor Reduktion | 224/224 | 4,2 Min. |
| Übergang, unveränderte Quellen | 5/5 | 1,9 Min. |
| Automatik, unveränderte Quellen | 91/91 | 1,9 Min. |
| Regulärer reduzierter Endzustand | 224/224 | 4,1 Min. |

Alle Browserbefehle enden mit Exitcode 0, ohne fehlgeschlagene oder übersprungene Fälle. `external-browser-before-reduction.log` und `external-browser-after-reduction.log` sind bytegleiche Nutzernachweise. Sie enthalten keinen maschinell erzeugten Checkout-Fingerprint; diese Herkunftsgrenze wird ausdrücklich beibehalten. `browser-reduction.json` verknüpft sie mit dem geprüften Quellstand und dem archivierten Original `month-summary-before-reduction.ts`. Der vor Entfernung erfolgreiche isolierte Report bleibt unverändert als `vitest-results-before-review.json` erhalten; der aktuelle Nachreviewlauf ist separat verknüpft. Validator und Negativregressionen prüfen Quellen/Hashes, vollständigen aktuellen Browserlauf und gültige isolierte Hauptzuordnungen.

Echte Cookies/CSRF/Origin, HTTP-/Commit-/Persistenzgrenzen, mehrere Tabs, Fokus/Tastatur, Layout, Reflow, Viewports und Kontrast bleiben Browser-/Backendpflicht. Der isolierte Fortschritts-Reload belegt UI-Rekonstruktion einer neuen Fixture aus erneuten authentifizierten GET-Antworten; er ersetzt keine echte Persistenzprüfung.

## Mutationserkennung und Review

Vier kontrollierte Fehler wurden erkannt: falsche deutsche Geldformatierung, fehlende Doppelsendesperre, angenommene alte Kontoantwort im Interceptor und verlorenes negatives Vorzeichen des tatsächlichen Fortschritts. `mutation-results.json` und die vier `mutation-*.log` belegen jeweils Exit 1. Produktdateien wurden bytegenau zurückgesetzt; keine Mutation verblieb.

Drei unabhängige Reviewebenen wurden ausgewertet. Alle 13 Behauptungen sind im Spec-Triageprotokoll einzeln beurteilt: zwei widerlegt, elf Meldungen in zehn Ursachengruppen behoben. Die Korrekturen prüfen unter anderem frische/vollständige Messberichte, produktive Quellfingerabdrücke, genaue Mutationspayloads, Budgetanzeigen, Storagefreiheit, echte Registrierungsnavigation und das Folge-Konto nach alter Aktivierungsantwort. Anschließende vollständige Prüfungen bestanden; keine offenen oder zurückgestellten Reviewbefunde.

## Kuratierter Nachweissatz

Die 65 zuvor aufgenommenen Rohbelegdateien sind auf 13 benötigte Dateien reduziert: Browser-Ersatzzuordnung, zwei vollständige externe Browserlogs, ursprüngliche Browserquelle, aktueller und vor Entfernung erfolgreicher Vitestreport, Coveragebericht, konsolidierte aktuelle Prüfergebnisse sowie vier Mutationslogs mit Ergebnisübersicht. Kein fachlicher Nachweis und keine Abnahme wurden entfernt oder abgeschwächt.

Doppelte Build-/Vertrags-/Coverage-/Discoverylogs, frühere Zwischenberichte und gescheiterte Umgebungsversuche wurden aus dem aktuellen PR entfernt. Sie bleiben im Git-Commit `8f7a39714d28aa9f897df10a5a2da86d38df2b5e` verfügbar; `review-final-checks.json` nennt für ursprüngliche Ausgaben jeweils Commit, Pfad und SHA-256. Beispielsweise liest `git show <commit>:<pfad>` eine historische Ausgabe. Neue Rohläufe gehören in den ignorierten Pfad `.local/test-baseline/`; die Ignore-Allowlist verhindert erneute unbeabsichtigte Aufnahme. Produktionsfreigabe ist kein Gegenstand dieser Story.
