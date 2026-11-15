# Story 5.3 — Implementierung und Prüfnachweise

Stand: 2026-11-15. **Umsetzung, Nachweise und unabhängiger Review abgeschlossen. Der reguläre reduzierte Endzustand ist extern erfolgreich belegt.** Die eingefrorene Absicht und alle acht Story-Abnahmen bleiben unverändert.

## Implementierung und konkrete Zuordnung

- Exakt gepinnte Vitest-/coverage-v8-Version 4.0.18 und jsdom 27.4.0; synchrones echtes npm-Lockfile. `npm ci --offline --ignore-scripts` hat die inzwischen vorhandenen Cachepakete erfolgreich installiert. Die früher fehlenden Pakete sind kein aktueller Blocker mehr.
- Zwölf isolierte Testquellen mit 324 bestandenen Fällen: 43 direkte Geld-/Fortschritts-Units und 281 Komponententests mit echten Angular-Templates, generierten Clients, Session und Interceptor sowie dem HTTP-Testbackend. Keine Produktfunktion, Vertragsänderung oder manuelle Änderung generierter Dateien.
- Eingabe-/Antwortmatrizen prüfen sichere exakte Centwerte, Überpräzision, Positiv-/Nullregeln, Kalenderdaten, fehlendes Budget versus null, Fehlerzuordnung, Fokus, Entwürfe, unbestätigte Mutationen und ausdrückliche Prüfzwänge. Signierter Betrag und Prozentwert bleiben tatsächlich sichtbar; ausschließlich Balkenwerte sind begrenzt.
- Die Lebenszyklustabelle prüft 27 alte Antworten bei Abmeldung, echtem zweiten Konto-Login oder kontrolliertem Tokenablauf einschließlich echter CSRF-/Logout-Widerrufkette. Vier Routerfälle verwenden tatsächliche Angular-Navigation und Komponentenzerstörung/-neuerstellung. Der Vorgangsschutz überlebt den Bereichswechsel, Finanzentwürfe dagegen nicht; die Wiederfreigabe benötigt eine erfolgreiche Zustandsprüfung und ausdrückliche Bestätigung.
- Automatikprüfungen umfassen Capability-/Übersichtsvalidierung, gemeinsame Auswahlbestätigung, sichere Ablehnung, verlorene Bestätigung, Reconnect, Rückkehr, unabhängige manuelle Korrektur und verworfene ältere Antworten. Ziel-/Fortschritts-/Löschtimeouts verwenden kontrollierte Timer.
- Plattformersatz betrifft BroadcastChannel, Web Locks, Dialogdarstellung und eine begrenzte Framewarteschlange. Ein echter jsdom-Reihenfolgedefekt wurde gefunden: seine gemeinsame Frame-Uhr konnte nach Fake-Timern hängen. Die lokale Warteschlange wird pro Fall geleert; TestBed, HTTP-Anfragen, Timer, globale Änderungen und History werden zuverlässig bereinigt. Tatsächliche Cookie-/Sperr-/Dialog-/Layout-/Browserzeitgrenzen bleiben Browserpflicht.

Der erfolgreiche JSONreport enthält jeden tatsächlichen Vitest-Fall. Das vorhandene Manifest führt diese als konkrete Quellfälle und Quellgruppen samt expliziten Haupt-/Zusatzbezügen; die übrigen ursprünglichen 94 Tests sind ebenfalls geprüft und entweder zugeordnet oder als zusätzliche Regression ohne künstlichen Nenner ausgewiesen. Quell-/Supporthashes, tatsächliche Namen, erfolgreicher Ausführungsbeleg und Zuordnung werden getrennt geprüft. Discovery allein erhält keinen Ausführungskredit.

| Kanonischer Bereich | Nenner | Isolierter Hauptnachweis | Anteil |
| --- | ---: | ---: | ---: |
| Frontend | 467 | 234 | 50,11 % |
| Backend, unverändert durch 5.3 | 1096 | 168 | 15,33 % |

Weitere **13 Frontendszenarien haben ausschließlich isolierte Zusatznachweise**. Beispielsweise ersetzt die reine Speicher-/Interceptorprobe weder echte Secure-Cookies noch tabübergreifende Sperren; die einfache Budget-Ablaufprobe ersetzt keinen ausstehenden Refresh. Alle bisherigen kanonischen IDs, Mitglieder, Anforderungen und Integrationsverweise bleiben erhalten. Wiederholungen derselben Eingabe in Anlage/Bearbeitung, responsive Varianten und mehrfach zugeordnete Fälle erhöhen die Quote nicht. Die vollständige Zuordnung steht in `test-baseline/reviewed-scenario-manifest.json`, `source-matrix.csv` und `canonical-scenarios.csv`; `semantic-summary.json` berechnet die Quote.

Bei Sparfortschritt bedeutet der isolierte Reloadnachweis ausdrücklich **UI-Rekonstruktion einer neuen ComponentFixture aus erneuten authentifizierten GET-Antworten**. Echte Persistenz und Commit bleiben durch die bisherigen Browser-/Backendnachweise erforderlich. Browser-Fokus, Tastatur, Kontrast, Reflow, Viewports und 200-%-Text werden ebenso nicht durch jsdom ersetzt.

## Erfolgreiche Referenzläufe vor dem Abschlussreview

Rohbelege: `test-baseline/story-5-3/`. Zeiten einzelner erfolgreicher Läufe sind keine vollständige Build-Medianmessung. Instrumentierte Zeiten werden getrennt ausgewiesen.

| Prüfung | Ergebnis | Gesamtdauer einschließlich Pre-Skript/Builder |
| --- | --- | ---: |
| `test:unit` | 43/43 bestanden | 4,220 s |
| `test:component` | 281/281 bestanden | 8,024 s |
| Gesamtausführung, JSONreport | 324/324, 12/12 Quellen bestanden | siehe `vitest-results.json` / `final-json-execution.log` |
| `test:coverage` | 324/324 bestanden; generierter Code ausgeschlossen | 9,113 s; instrumentierte Vitestzeit 4,57 s |
| Tatsächliche Angular/Vitest-Dateidiscovery | 12/12 Quellen, bestanden | 3,406 s |
| Inventarrefresh und Semantik | bestanden, unveränderte Nenner 1096/467 | keine Produktleistungsmessung |
| Manifestregressionen | 19/19 bestanden | 2,306 s |
| Python-Gesamtsuite | 42/42 bestanden | 1,822 s |
| Vollständiger Vertragscheck einschließlich SPA-Build | bestanden mit vorhandener Maven-Cachekopie, npm offline und ohne npm-Installationsskripte | SPA-Builder 2,397 s; keine Messserie |
| Historischer lokaler Browserstart `e2e` | vor dem ersten Fall blockiert; aktueller externer Erfolg siehe unten | kein Leistungsnachweis |

Coverage: **Statements 87,07 % (2694/3094), Branches 80,55 % (1512/1877), Functions 85,59 % (303/354), Lines 91,01 % (1499/1647)**. Der maschinenlesbare Bericht liegt neben den Rohlogs. Coverage ersetzt keine semantische Zuordnung.

Vier kontrollierte Fehlereinbauten wurden jeweils erkannt (Exit 1): deutsche Geldformatierung, entfernte Doppelsendesperre, zugelassene alte Kontoantwort im echten Interceptor und verlorenes negatives Vorzeichen des tatsächlichen Prozentwerts. Jeder Produktquelltext wurde im `finally` bytegenau zurückgesetzt. Einzelbelege und Rückgabewerte: `mutation-*.log` und `mutation-results.json`. Danach bzw. mit unveränderten produktiven Quellen bestehen die neuen Tests; im Arbeitsstand bleiben **keine Produktmutationen** zurück.

## Revisionsbezogener Alt-/Neu-Nachweis und gezielte Reduktion

Der in der aktuellen Spec ausdrücklich akzeptierte, vom Nutzer lokal ausgeführte vollständige Browserlog wurde vollständig ausgewertet und unverändert als `story-5-3/external-browser-before-reduction.log` gesichert: **224/224 regulär, 5/5 Übergang, 91/91 Automatik, jeweils Exit 0**, keine Fehl-/Skipmarker. Er ist ein externer Nutzernachweis, kein in dieser Sandbox ausgeführter Lauf. Die ursprüngliche `month-summary.spec.ts` wurde vor Änderung archiviert; ihr SHA-256 stimmt mit dem bis dahin geprüften Manifest überein. `browser-reduction.json` bindet Log, Originalquelle, HEAD `e462d25bf34970e6d9a02c41095fe8070f346ddb`, neue Quelle und erfolgreichen isolierten Report durch Hashes. Der externe Log enthält keinen eigenständig erzeugten Checkout-Fingerprint; diese Herkunftsgrenze bleibt sichtbar.

Genau **neun reine DTO-Antwortvarianten** der inneren Schleife in `frontend/e2e/month-summary.spec.ts`, Test „Laden, Netzfehler und ungültige Antworten entfernen alte Werte und bleiben wiederholbar“, wurden verlagert. Jede ursprüngliche Eingabe hat im JSONbeleg ihre unveränderte kanonische ID, den konkreten bestandenen Vitest-Fall und die Beobachtungen Fehlertext/kein Geld/keine Details/erneut prüfbar. Die isolierte Matrix wurde vor Entfernung verstärkt: Jeder Fall beginnt mit tatsächlich angezeigtem bestätigtem Geld und Details und prüft deren Entfernung nach einer neuen fehlerhaften Antwort. **324/324 isolierte Fälle bestanden vor der Kürzung**; der ursprüngliche erfolgreiche Report ist zusätzlich archiviert.

Im Browser bleiben `null` als repräsentative ungeprüfte Antwort, Entfernen alter Werte/Details, Netzwerkabbruch und erfolgreiche ausdrückliche Wiederholung erhalten. Der Test behält echte Registrierung, Anmeldung und HTTP-/Interceptor-Verdrahtung. Sämtliche übrigen 319 Browserfälle einschließlich Fokus, Tastatur, Cookies/CSRF/Origin, Sitzungswechsel, Viewports, Reflow, Kontrast und vollständigen echten Finanz-/Automatikabläufen bleiben unverändert. Top-Level-Testzahlen bleiben deshalb 224/5/91; entfernt wurden neun innere Wiederholungen. Weitere Matrizen mit solchen gemischten Grenzbeobachtungen wurden bewusst beibehalten, beispielsweise Eurofehler mit echtem Fehlerfokus in `budget.spec.ts` und `expenses.spec.ts`.

Original-IDs, Nenner und Integrationsverweise bleiben erhalten. Die historische Schleifenexpression und ihre Werte bleiben ausdrücklich als historische Rückverweise im Manifest; `retired_canonical_scenarios` kennzeichnet die neun ersetzten Varianten. Der reguläre aktuelle Schleifeneingang ist `[null]`. Der Validator prüft unveränderte Alt-/Neubelege, identische Eingaben und erfolgreiche isolierte Hauptzuordnungen; zwei gezielte Negativprüfungen verhindern unbemerkte Belegänderung und Ersatz durch bloße Zusatznachweise.

## Aktuelle Abschlussprüfungen und externer Endzustandsnachweis

Neue Rohbelege heißen `story-5-3/completion-*`; sie ergänzen die bisherigen historischen Logs. Die gezielte aktuelle Verifikation ergibt:

| Prüfung | Ergebnis | Gesamtdauer |
| --- | --- | ---: |
| Unit-Befehl | 43/43 bestanden | separat erneut ausgeführt |
| Gesamtausführung vor Entfernung | 324/324 bestanden | JSONreport und `summary-replacement-before-reduction.log` |
| Komponenten | 281/281 bestanden | 7,651 s |
| Coverage | 324/324 bestanden | 9,774 s, instrumentiert |
| SPA-Build | bestanden | 5,533 s |
| Vollständiger Vertrag v1/v2, Generatoren, Kompilierung, SPA | bestanden (offline, beschreibbare Maven-Cachekopie) | `completion-contract.log` |
| Python | 42/42 bestanden | 1,968 s |
| Tatsächliche Vitest-Discovery | 12/12 Quellen, bestanden | 3,676 s |
| Manifestregressionen nach Endzustandsarchivierung | 24/24 bestanden | 2,826 s |
| Inventar/Semantik | bestanden: 234/467 = 50,11 %, IDs/Nenner unverändert | keine Produktleistungsmessung |
| Historischer lokaler E2E-Versuch nach Reduktion | vor dem ersten Fall technisch blockiert | 7,953 s |
| Reguläres E2E nach Reduktion, externer Nutzernachweis | 224/224 bestanden, Exit 0; keine Fehl-/Skipmarker | 4,1 Min. |

Der frühere lokale reguläre E2E-Start nutzte eine beschreibbare Maven-Cachekopie und erreichte PostgreSQL; `EmbeddedPostgres.detectPort` endete beim echten ServerSocket mit `java.net.SocketException: Operation not permitted`. Der fehlgeschlagene Versuch bleibt historisch erhalten und zählt nicht als erfolgreicher Lauf.

Der anschließend vom Nutzer bereitgestellte vollständige Endzustandslog `story-5-3-browser-after.log` wurde vollständig gelesen und bytegenau als `story-5-3/external-browser-after-reduction.log` archiviert. **Alle 224 einzeln nummerierten regulären Fälle bestehen, die Summary meldet 224 passed (4.1m), der Exitcode ist 0; keine Fehl-/Skipmarker.** `browser-reduction.json` sichert den SHA-256 des Logs und den unveränderten reduzierten Quellhash `63084401210fb5265f3edefc766f9606d01b2f3e511116e936f1e2c1727ef6aa`. Es bleibt ausdrücklich ein externer Nutzernachweis ohne maschinell erzeugten Checkout-Fingerprint; die aktuelle Spec akzeptiert ihn für diesen Quellstand. Der Validator prüft den Quellbezug, sämtliche Erfolgsnummern, Summary und Exitcode. Drei zusätzliche Negativregressionen erkennen nachträgliche Logänderungen, fehlende Fälle/fehlerhaften Exit/Skip sowie einen falschen Quellbezug.

Die Übergangs- und Automatikgruppen behalten die erfolgreichen externen Nutzernachweise (5/5 und 91/91); ihre Quellen wurden durch die Reduktion nicht geändert. Damit liegen die geforderten Alt-/Neu-Nachweise vor Entfernung und erfolgreiche Browsernachweise des Endzustands vor. **Die Browserabnahme ist belegt. Die anschließend behobenen Reviewpunkte und deren aktuelle Prüfergebnisse stehen im folgenden Abschnitt.** Dies erteilt keine Produktionsfreigabe.

## Abschlussreview und unabhängige Nachprüfung

Die drei Reviewebenen wurden vollständig ausgewertet. Jede der 13 gemeldeten Behauptungen ist im Spec-Triageprotokoll einzeln beurteilt: zwei wurden anhand des Codes widerlegt; elf bestätigte Meldungen wurden in zehn Ursachengruppen behoben. Keine offenen Befunde verbleiben.

Die Korrekturen umfassen die verfügbare Versionierung der benötigten Rohlogs, frische und vollständige Messberichte, einen zusätzlichen Fingerabdruck der produktiven TS-/Template-/Stilquellen sowie direkte Assertions zu Mutationspayloads, Budgetanzeige, Storagefreiheit, Navigation und widersprüchlichen Altantworten. Die Aktivierungsprobe meldet nach Abmeldung ein zweites Konto tatsächlich an und prüft dessen neue Ansicht vor/nach der alten Antwort. Geld-Eingabestrings haben unabhängige erwartete Literale. Zwei neue Messwerkzeugregressionen sind ausschließlich als Infrastruktur inventarisiert: die Fachnenner 1096/467 und die Quote 234/467 bleiben unverändert; 44 Pythonprüfungen ergeben jetzt insgesamt 1635 kanonische Einträge einschließlich Infrastruktur. Alle ursprünglichen 1633 IDs bleiben erhalten.

| Eigene aktuelle Prüfung nach Reviewkorrekturen | Ergebnis | Dauer |
| --- | --- | ---: |
| Python | 44/44 | 2.013 s |
| Manifestregressionen | 25/25 | 2.855 s |
| Units | 43/43 | 1.983 s |
| Komponenten | 281/281 | 6.143 s |
| Coverage-Verbund | 324/324 | 7.409 s |
| SPA-Build | bestanden | 3.073 s |
| Vertrag v1/v2 einschließlich Generierung/Kompilierung/SPA | bestanden | 15.505 s |

Der eigene gemeinsame JSONlauf besteht mit 324/324 Tests in zwölf Quellen; tatsächliche Discovery und Inventarrefresh bestehen. Der neue Messvalidator akzeptiert diesen tatsächlichen Bericht mit exakt vollständigen Fallidentitäten. Coverage bleibt bei 87,07 % Statements, 80,55 % Branches, 85,59 % Functions und 91,01 % Lines. `review-final-checks.json` und `review-*.log` enthalten getrennte Exitcodes, Befehle und Laufzeiten.

Der vor Entfernung erfolgreiche isolierte Bericht ist unverändert unter `vitest-results-before-review.json` bewahrt und in `browser-reduction.json` als `historical_pre_removal_execution` verknüpft; `replacement_execution` zeigt getrennt auf den aktuellen Nachreviewlauf. Neue Quell-/Support-/Produktfingerabdrücke stimmen mit diesem Lauf überein. Die enge Ignore-Ausnahme erfasst die Story-5.3-Rohlogs; alle verpflichtenden Alt-/Neu-/Browserdateien wurden auf Existenz, Hash und Checkout-Verfügbarkeit geprüft.

Produktquellen und Browsertests wurden durch die Reviewkorrekturen nicht verändert. Deshalb bleiben die erfolgreichen externen Browserbelege (224 regulär im reduzierten Endzustand, fünf Übergang, 91 Automatik) gültig; unveränderte technisch blockierte lokale Browserstarts wurden nicht wiederholt. Alle sechs eingefrorenen Matrixzeilen sind durch tatsächlich bestandene Tests belegt. Dies ist keine neue Gesamt-Medianmessung und keine Produktionsfreigabe.

## Historische Versuche

Die vor der externen Paketinstallation protokollierten DNS-/Paket-/Compiler-/Socketfehler sind historische Versuche und stehen unverändert in den älteren Rohbelegen. Die frühere Quote 0/467 und fehlendes Lockfile beschreiben ausschließlich diesen früheren Zustand. Aktuell sind Lockfile, echte Unit-/Komponenten-/Coverageausführung, tatsächliche Discovery, Mutationserkennung und die explizite Mehrheitszuordnung vorhanden; der reguläre Endzustandslauf ist ebenso wie die unveränderten Altprüfungen extern erfolgreich belegt. Die Socketbeschränkung betrifft ausschließlich die historischen lokalen Versuche.
