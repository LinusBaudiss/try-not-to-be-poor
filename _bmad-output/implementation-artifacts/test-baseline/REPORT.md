# Story 5.1 — Bestand, Messverfahren und offener Baseline-Nachweis

Stand 2026-11-14. **In Arbeit; keine vollständige lokale Laufzeit-Baseline und keine Qualitäts-/Produktionsfreigabe.** Referenz ist `8f66421be3b7090c5cd384c9679657d9a17a6b3f`. Der aufgezeichnete lokale Versuch enthält zusätzlich noch uncommittete Messwerkzeuge; `attempt-2026-11-14-01/results.json`, `tracked-input.patch` und `input-sha256.json` identifizieren diesen damaligen Eingabestand. Nach Fertigstellung der Werkzeuge ist ein neuer Versuch auf einem festgeschriebenen Stand erforderlich.

## Tatsächlich ausgeführte Nachweise

| Nachweis | Ergebnis / Grenze |
| --- | --- |
| Python inklusive neuer Messwerkzeugtests | **33 Tests erfolgreich**, einschließlich 14 neuer Werkzeugtests; `python-verification.log`. |
| Vollständige lokale Messserie | Vorprüfung Exit 2: Socket-Bind für IPv4 und IPv6 auf 8080/4200 liefert `EPERM / Operation not permitted`. **0 erfolgreiche Warm-ups, 0 Messungen, 0 bereinigte vollständige Läufe.** Kein Median und kein lokales Sekundenziel vorhanden. Kein Test wurde als Beschleunigung ausgelassen. |
| Verwalteter alternativer Runtimezugang | Runtimehinweise geprüft; kein weiterer Cloud-Exec-/Statuszugang in dieser Sitzung verfügbar. Keine Sandbox-Eskalation und kein scheinbarer Ersatzlauf. |
| Backend `test-compile` | Erfolgreich offline mit schreibbarer Kopie des vorhandenen Maven-Repositories nach `/tmp/tnbp-story51-m2`; Originalcache unverändert. `backend-test-compile.log`. Keine vollständige Buildmessung. |
| JUnit-Discovery ohne Ausführung | 371 Method-/Template-Ausführungspfade, einschließlich Vererbung, durch `DiscoverTests.java` erfasst. Setabgleich gegen Quellmethoden plus sechs geerbte Matrizen: **0 fehlend, 0 zusätzlich**. `discovery/backend.tsv`. Parameter werden bei JUnit erst zur Ausführung expandiert; Quellprovider separat aufgelöst. |
| Backend Unit/Architektur | Standard-Teillauf ohne Prozesshilfe: 48 Ausführungen, 4 Mockito-Self-Attach-Umgebungsfehler, keine Assertionfehler. Wiederholung derselben unveränderten Fälle mit explizit gestartetem gecachtem Mockito-Agent: **48 erfolgreich, 0 Fehler, 0 übersprungen**; `backend-unit-architecture-explicit-agent.log`. Diese Teilprüfung ersetzt weder `verify` noch die Baseline. |
| Playwright-Discovery | Alle drei wirklichen Konfigurationen erfolgreich mit `--list --reporter=json` erfasst; insgesamt 320 expandierte Ausführungen in `discovery/{browser,transition,automation}.json`. Kein gestarteter Browser-/API-Lauf behauptet. |
| Coverage | Normale Ausführung scheitert an schreibgeschütztem Maven-Lockverzeichnis. Separater Offlineversuch: JaCoCo fehlt. Erneuter regulärer Versuch mit schreibbarer Cachekopie: Maven-Central-DNS `Name or service not known`. Alle drei Logs erhalten. **Keine gemessene Code-/Zweigabdeckung.** |
| CI | Ausschließlich lesend: drei erfolgreiche Läufe mit identischem ausführbarem Quellumfang samt Job-/Schrittzeiten und aktuellen Kostenklassen ausgewertet, siehe unten. Keine Workflowänderung, kein GitHub-Issueabgleich. |

## Bestand, Discovery und Szenariozählung

`reviewed-scenario-manifest.json` ist die explizite Quelle der semantischen Zuordnung: **746 Quellenfälle**, jeweils mit konkreten nummerierten Story-/AC-Referenzen, Eingabe-/Variantenbindung, tatsächlich erwarteter Eigenschaft, primärer Testart, Zieltestart, bleibender Integration und offenem Ersatznachweis. Anforderungen stammen aus einer ausdrücklich festgelegten Klassen-/Methoden-/Dateifallzuordnung gegen die AC-Titel in `epics.md`; der Manifestkatalog hält diese Titel fest. Es gibt keine Keyword-Ableitung aus Testkörpern und keine unzugeordneten Quellfälle.

`source-inventory.json` und `source-matrix.csv` werden ausschließlich daraus abgeleitet. Java-Assertionketten stehen lesbar im Manifest und im `observation-ledger.json`, zusammen mit vollständigen Testkörpern, Parametern und Schleifenbindungen. Browserfälle verwenden die tatsächlich expandierte Eingabe-/Erwartungsaussage der Playwright-Discovery. Delegierte Summary-Assertions sind ausdrücklich in acht konkrete erwartete HTTP-/Cent-/Monatstupel aufgelöst; die vier delegierenden Python-Stoppregressionen nennen ihre tatsächlichen Eingaben und erwarteten Stopp-/Fehlerfolgen. Java-Discoveryangaben verweisen korrekt auf den erfolgreich erfassten Plan mit 371 Methoden-/Templatepfaden; 0 fehlen, 0 sind zusätzlich.

**Statischer Szenarioabgleich abgeschlossen:** Alle 746 Quellfälle und 99 inneren Browser-Schleifen sind explizit den kanonischen Regel-/Eingabe-/Beobachtungsklassen zugeordnet. Die Zuordnung und begründeten Zusammenführungen/Trennungen stehen in [SCENARIO-REVIEW.md](SCENARIO-REVIEW.md), jede einzelne Klasse in `canonical-scenarios.csv`; `semantic-summary.json` enthält die reproduzierbare Auswertung. Backend: 143/1096 Unit-Fachszenarien (13.05 %), Frontend: 0/467 Unit-/Komponentenszenarien. Architektur/Infrastruktur sind separat. `semantic_review_complete: true` bezeichnet ausschließlich den abgeschlossenen statischen Abgleich, keinen vollständigen Laufzeit-/Integrations-/Coverage-Nachweis.

`refresh-source-inventory.py` schlägt bei neuen/entfallenen Varianten, nicht zugeordneten Fällen, geänderten geprüften Quellen/Fixtures, unbekannten Szenarien oder abweichender JUnit-Discovery fehl. Eine neue Anforderung wird niemals automatisch vergeben. Die zwölf gezielten Inventar-/Semantikregressionen in `verify-manifest-refresh.py` prüfen genau diese Sperren und bestehen; das ist eine zusätzliche Infrastrukturprüfung, keine Fachszenarioquote und kein ersetzter Pflichtlauf. Der semantische Manifeststand ist damit für den unabhängigen Review verfügbar; tatsächliche vollständige Integrations-/Laufzeit-/Coverage-Nachweise bleiben weiterhin offen.

Besondere Mehrfachausführungen:

- `RegistrationV2IT`, `SessionV2IT`, `BudgetV2IT`, `ExpenseV2IT`, `MonthSummaryV2IT`, `SavingsGoalV2IT` erben die jeweiligen v1-Matrizen; v2-eigene Methoden sind getrennt erfasst.
- Surefire führt `*Test` aus, Failsafe `*IT`. Kein pauschaler doppelter Lauf derselben Klasse innerhalb des lokalen `verify`; der als `Test` benannte `MonthlyAutomationE2eServerTest` startet Prozesse und ist ausdrücklich **kein Backend-Unitfall**.
- Beide CI-Backendjobs führen die Surefire-Phase vollständig aus; `-Dit.test` beschränkt nur Failsafe. Das ist ein Kostenduplikat, kein zusätzlicher Schutznenner. Die Failsafe-Mengen sind komplementär.
- Vertragsprüfung generiert/kompiliert beide Java-Verträge; danach TypeScript-Generierung, Vertragskompilierung und SPA-`prebuild` mit erneuter TypeScript-Generierung. Backend-`verify` und jede Browser-API bereiten erneut Klassen/Abhängigkeiten vor. Übergangs-/Release- und Automatikfixtures starten/builden zusätzliche echte Releases. Alle Kosten bleiben innerhalb des jeweiligen Messfensters.
- Ein Frontend-Unit-/Komponentenbefehl und die entsprechende Abdeckung fehlen vollständig. Alle vorhandenen Frontendnachweise sind Browserprüfungen, auch solche mit HTTP-Stubs.

## Geschützte Grenzen und Monatsmatrix

`monthly-and-protected-matrix.md` ordnet alle **17 Monatsfälle**, zusätzliche AD-8/9/10-Präzisierungen und sieben spätere kontrollierte Fehlerfamilien von Hand zu. Die Tabelle benennt exakte bestehende Methoden/Parameter, beobachtete Centwerte, verbleibende reale Grenzen und fehlende Produktnachweise. Alle Ersatzfelder bleiben offen, da 5.1 keine bestehende Assertion entfernt.

PostgreSQL-RLS und unprivilegierte Rollen, fehlender/fremder Kontext, Poolbereinigung, migrationsbedingter Bestandserhalt, gemeinsame physische Transaktionen, späte Commitfehler und unabhängige konkurrierende Verbindungen bleiben echte Integrationen. Versionsbarriere und Zertifizierung erhalten reale alte/neue Artefakte, Prozesse, Datenbankarbeit, Schema-/Rollendrift, Neustart, Hostboot und Verwaltungsrennen. Browser erhalten Cookie/CSRF/Origin/Interceptor, echte vollständige Wege, Tastatur/Fokus/Status, vier Viewports und 200-%-Text/Reflow.

**4.6, 4.7 und 4.8 bleiben backlog/offen.** Interne kontrollierte Monatsaufrufe oder Test-Capabilityfreigaben beweisen keinen begrenzten, fairen, neustartfesten Scheduler und keine reguläre Gesamtfreigabe. Fehlende Hintergrund-/Endabnahmen sind in der Matrix ausdrücklich bezeichnet.

## CI-Ausgangslage (aktuelle lesende Abfrage)

`ci-evidence.json` enthält Quellen/SHAs, echte Job-/Schrittzeitstempel, Runnernamen und Labels. `ci-retirement-timings.json` erhält ausschließlich relevante Klasse-/Cachezeilen aus den erfolgreichen Logs. Alle drei Vergleichskandidaten verwenden dieselben sechs Pflichtjobs, ubuntu-24.04 und gepinnte Java-/Node-/Mavenbefehle. `git diff 657e05d92fc07acc206e37db315cea003c9ba60e 8f66421be3b7090c5cd384c9679657d9a17a6b3f -- backend frontend scripts .github api-contract` ist leer; der Merge hat denselben ausführbaren Umfang. Unterschiedliche Ereignisse (Push/PR), Runnerinstanzen, Hostlast und tatsächliche Caches außerhalb des nachgewiesenen Maven-Hits bleiben Vergleichsgrenzen.

| Erfolgreicher Lauf | SHA | Queue bis erstem Jobstart (s) | Zeit erster Jobstart bis letzter Pflichtjob fertig (s) | Summe Jobzeiten (s) | ReleaseTransitionIT (s / Ausführungen) | AdministrativeSerializationIT (s / Ausführungen) |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| [43617756241](https://github.com/LinusBaudiss/try-not-to-be-poor/actions/runs/43617756241) | `8f66421…` | 3 | 1129 | 1984 | 875.9 / 59 | 215.7 / 20 |
| [43611663659](https://github.com/LinusBaudiss/try-not-to-be-poor/actions/runs/43611663659) | `657e05d…` | 2 | 1071 | 1895 | 820.1 / 59 | 210.4 / 20 |
| [43611606779](https://github.com/LinusBaudiss/try-not-to-be-poor/actions/runs/43611606779) | `657e05d…` | 3 | 1457 | 2352 | 1110 / 59 | 303.7 / 20 |
| **Median der drei** | gleicher ausführbarer Scope | **3** | **1129** | **1984** | **875.9** | **215.7** |

`backend-retirement` ist jeweils der kritische Pflichtjob. Die beiden Klassen beanspruchen im Referenzlauf zusammen 1091.6 s von rund 1129 s kritischer Gesamtdauer; ihre Zeiten enthalten die innerhalb der Tests gestarteten Prozesse/Datenbanken/Builds. Ein separater vierter früherer erfolgreicher Lauf `43587859155` steht als historischer Hinweis in den Rohdaten; er liegt vor Story 4.5 und wird **nicht** in die Mediane aufgenommen. Queuezeit ist nicht Buildzeit. Summierte Jobzeit ist nicht kritischer Pfad. Diese CI-Zeiten werden nicht als lokale Baseline ausgegeben.

Setup, Werkzeuginstallation, npm-Installation und Cache-Schritte sind in den Jobschritten einzeln nachvollziehbar. Die Maven-Classzeiten trennen nicht intern die Kosten jedes Prozessstarts, jeder Datenbank und jedes Unterbuilds. Dafür fehlen lokal erfolgreiche Detailmessungen; eine scheinbar genaue Aufteilung wäre erfunden. Die Vertragsphasenerfassung des neuen Werkzeugs liefert auf einem geeigneten Host zusätzliche inklusive Teilzeiten.

## Ziel und Reihenfolge für 5.2–5.4

Das Ziel bleibt **mindestens 30 % weniger mediane vollständige lokale Laufzeit**. Sobald drei erfolgreiche komplette Messungen vorliegen, berechnet das Werkzeug `Zielsekunden = 0.70 × lokaler Median`. Derzeit gibt es dafür **keinen zulässigen numerischen Ausgangswert**; die 1129 CI-Sekunden dürfen ihn nicht ersetzen. Ein Zielwert oder eine Zusage zur Erreichbarkeit wäre deshalb unbegründet. Der mediane vergleichbare CI-Pfad darf später ebenfalls nicht steigen; andere Parallelisierung separat vergleichen.

1. **5.2:** Geld-/Namen-/Datums-/Monats-/Differenzentscheidungen sowie Zugangspolicy systematisch direkt prüfen; HTTP-Typ/DTO/Fehlerabbildung als Adapterabsicherung führen. Vorhandene `MoneyTest`, `MonthlySurplusTest`, `BudgetTest`, `ExpenseTest`, `SavingsGoalTest`, `RegistrationTest`, `SessionTest` sind konkrete Ausgangspunkte. Echte Kryptoparameter unverändert lassen. Keine Datenbankgrenze zu einer Unitprüfung umetikettieren.
2. **5.3:** Eigenständigen Frontend-Unit-/isolierten Komponentenbefehl einführen. Besonders ergiebig: Euro-/Datumseingaben, tatsächlicher Fortschritt/Balken, Session-/Ansichtsgeneration, ungewisser Commit, Entwurferhalt und kontrollierte verspätete Antwortreihenfolge aus den umfangreichen Mutations-/Sitzungs-/Automatik-Browserdateien. Reale UX-/HTTP-Integration bleibt.
3. **5.4:** Die gemessenen dominanten `ReleaseTransitionIT` (59 Varianten) und `AdministrativeSerializationIT` (20) zuerst nach reiner Entscheidung versus echter Grenze auflösen. Wiederholte unveränderliche Release-/Generator-/Kompilieraufbauten auf nachweislich identische Revision/Quelle/Vertrag/Konfiguration/Umgebung untersuchen; vollständige Invalidierung belegen. Niemals Fachtestzustand oder Prozess-/Datenbank-Barrieren cachen. Surefire-Duplikation beider CI-Backendjobs gesondert messen. Geschützte Varianten erst nach bestandenem Ersatz plus verbleibender Integration verschlanken.

Die aktuellen CI-Daten zeigen einen erheblichen Hebel in Prozess-/Buildaufbau und einen kleineren in reiner fachlicher Verlagerung. Sie beweisen nicht, dass 30 % auf dem lokalen Gesamtlauf erreichbar sind. Bis zur Baseline bleibt diese Einschätzung eine konkrete Hypothese; keine stillschweigende Zielsenkung.

## Reproduktion und vergleichbarer Coverage-Nenner

Der Hauptbefehl und Voraussetzungen stehen im README. `scripts/test-baseline.py --help` dokumentiert Ausgabepfad/Cacheangabe. Messserie ist fest: Python → Vertrag einschließlich aller Builds/Installationen → Backend-verify → normaler Browser → Übergang → Automatik. Ein Frontend-Unitbefehl wird erst nach Einführung zusätzlich aufgenommen. Warm-up und bereinigter Lauf gehen nicht in den Median ein. Fehler, unvollständige Gruppen und abgebrochene Läufe ebenfalls nicht; Logs und Exitstatus bleiben erhalten.

Discovery erneuern:

```sh
frontend/node_modules/.bin/playwright test --config frontend/playwright.config.ts --list --reporter=json > _bmad-output/implementation-artifacts/test-baseline/discovery/browser.json
frontend/node_modules/.bin/playwright test --config frontend/playwright.transition.config.ts --list --reporter=json > _bmad-output/implementation-artifacts/test-baseline/discovery/transition.json
frontend/node_modules/.bin/playwright test --config frontend/playwright.automation.config.ts --list --reporter=json > _bmad-output/implementation-artifacts/test-baseline/discovery/automation.json
python3 _bmad-output/implementation-artifacts/test-baseline/refresh-source-inventory.py
```

Für JUnit zuerst `test-compile` und `maven-dependency-plugin:3.8.1:build-classpath -Dmdep.outputFile=target/test-classpath.txt -DincludeScope=test` ausführen. `DiscoverTests.java` mit Java 25 als Quellprogramm starten; Klassenpfad besteht aus `backend/target/classes`, `backend/target/test-classes`, dem Inhalt von `test-classpath.txt` und zusätzlich `junit-platform-launcher-6.0.3.jar` aus dem verwendeten Maven-Repository. Standardverzeichnis ist `~/.m2/repository`; die Ausführung dieser Sitzung verwendete die schreibbare Kopie unter `/tmp/tnbp-story51-m2`. Java-Discovery initialisiert und startet die Testfixtures nicht; Parameterexpansion ist kein Laufzeit-Erfolgsnachweis.

Coverage separat mit `./backend/mvnw -B -f backend/pom.xml -Pcoverage clean verify`. JaCoCo 0.8.14; Nenner sind die selbst geschriebenen kompilierten Backend-Klassen unter `backend/target/classes`, ausgenommen `de/linus/tnbp/contract/**` (v1 und v2). `clean` verhindert alte Exec-Daten, `append` führt Surefire/Failsafe derselben Ausführung zusammen. `jacoco.xml` enthält pro Klasse und aggregiert INSTRUCTION/BRANCH/LINE/COMPLEXITY/METHOD/CLASS mit covered/missed; identische Klassenliste und Ausschlüsse sowie Quellscope vor/nach Refactoring prüfen. Unterprozesse erhalten nicht automatisch den Agent: diese Ausführungslücke ausdrücklich separat prüfen. Keine Frontendabdeckung konfiguriert. Keine instrumentierte Zeit als primäre Baseline verwenden.

## Offene Abnahmen

| AC | Erfüllter Teil | Noch erforderlich |
| --- | --- | --- |
| AC-1 | Alle Quellmethoden gegen JUnit-Discovery abgeglichen, Parameter/Loops und sechs Vererbungen erfasst; drei Browsergruppen wirklich entdeckt | Volle Ausführung im erfolgreichen Gesamtverbund; der statische Abgleich ist abgeschlossen und gegen falsche Fortschreibung geprüft |
| AC-2 | Explizites Szenariomanifest aller 746 Fälle mit konkreten Story-/ACs, vollständige handgeprüfte 17 Monats-/Architekturzuordnung, Risiken/Integration/Ersatzfelder | Statischer Zuordnungs-/Äquivalenzabgleich abgeschlossen; erfolgreiche vollständige Ausführung und spätere Ersatznachweise separat offen |
| AC-3 | Wiederholbares Werkzeug, Fehlerstatus und belegter Vorprüfungsblocker | Warm-up + 3 erfolgreiche vollständige Messungen + erfolgreicher bereinigter Lauf auf festgeschriebenem Stand; Detailzeiten |
| AC-4 | Drei erfolgreiche CI-Beobachtungen gleichen ausführbaren Scopes, Queue/Jobsumme/kritischer Pfad und aktuelle Klassenkosten | Vollständige lokale Prozess-/DB-/Mehrfachbuilddetailkosten; Runner-/Cachevergleich bei Zielmessung |
| AC-5 | 30-%-Ziel unverändert, Berechnungsformel und konkrete Prioritäten | Lokaler Median/Sekundenziel/Erreichbarkeitsprüfung; Fachszenarionenner liegt statisch vor |
| AC-6 | Geschützte Integrationen, 17 Monatsfälle und zusätzliche Regressionen samt späteren Fehlervarianten dokumentiert | Ersatz-/Fehlervariantennachweise erst in Folgegeschichten; keine Entfernung in 5.1 |
| AC-7 | Separates opt-in Profil, identische Ausschlüsse/Nennerregeln, Frontend-/Unterprozesslücken sichtbar | Tatsächlich erfolgreiche instrumentierte Ausführung mit Berichten und nachvollziehbaren Code-/Zweigzahlen |
| AC-8 | Selbständig verwendbare Befehle/Logs/Fehlerstatus, Inventarwerkzeuge und Prioritäten dokumentiert | Erfolgreiche unabhängige Reproduktion des vollständigen Verfahrens bleibt offen |

## Ergebnis der lokalen Diffprüfung

Alte Surefire-/Failsafe-Reports werden vor der aktuellen Backend-Gruppe entfernt; deren Zeit bleibt im Messfenster. Ausgabeverzeichnisse innerhalb bereinigter Build-Ausgaben werden vor der Erstellung abgewiesen. Beide Fälle sind durch ausgeführte Werkzeugtests abgesichert. Ein Stagingversuch scheiterte am schreibgeschützten Git-Index (`index.lock`); keine Commits oder Veröffentlichungen erstellt. Die vollständige Änderung einschließlich unversionierter Dateien wurde für die Prüfung als temporärer Diff erzeugt. Formales Abschlussreview und Freigabe bleiben wegen offener Abnahmen aus.

Abschließende Vorprüfung nach den Werkzeugkorrekturen: `attempt-2026-11-14-review/results.json` bestätigt erneut Exit 2 wegen EPERM auf allen vier Socket-Bind-Versuchen. Abschließender Pythonlauf: 33 erfolgreiche Tests; Manifest-Negativregressionen: 4 erfolgreich. Alle 746 Quellreferenzen besitzen Anforderungen, Erwartungen und auflösbare Manifestverweise. Der statische Gleichwertigkeitsabgleich wurde anschließend abgeschlossen; Einzelheiten und Prüfungen stehen in SCENARIO-REVIEW.md.
