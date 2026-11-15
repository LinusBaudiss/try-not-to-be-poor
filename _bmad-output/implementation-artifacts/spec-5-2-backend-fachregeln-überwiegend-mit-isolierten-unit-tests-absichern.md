---
title: '5.2 Backend-Fachregeln überwiegend mit isolierten Unit Tests absichern'
type: 'chore'
created: '2026-11-15'
status: 'review'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'e70cbe10072b426780af147b99e462177b18b765'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-5-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/test-baseline/SCENARIO-REVIEW.md'
  - '{project-root}/_bmad-output/implementation-artifacts/test-baseline/monthly-and-protected-matrix.md'
---

<frozen-after-approval reason="human-owned intent — AC-8 renegotiated by approved Sprint Change Proposal on 2026-11-15">

## Intent

**Problem:** Die Backend-Baseline hat nur 143 von 1096 unterschiedlichen fachlichen Szenarien als Unit Tests klassifiziert. Viele schnelle Regelentscheidungen sind noch an HTTP- und Datenbankabläufe gekoppelt, obwohl die Regeln ohne vollständigen Anwendungsstart geprüft werden können.

**Approach:** Die in der geprüften Story-5.1-Matrix priorisierten Fachvarianten in `access`, `expenses`, `budget`, `savingsgoals` und `monthlysurplus` direkt an produktiv verwendeten Kernentscheidungen absichern. Infrastrukturgrenzen behalten ihre echten Adapter- und PostgreSQL-Nachweise; kleine verhaltenserhaltende Extraktionen dienen nur dort, wo Isolation sonst nicht möglich ist.

**Always:** Szenariozählung und Zusammenführungen folgen den kanonischen IDs aus 5.1; eine Regel zählt pro Backend einmal, unabhängig von Testmethoden oder Ausführungsvarianten. Erwartungen folgen expliziten Regeln und Beispielen. Änderungen bleiben im zuständigen Modul, erhalten Verträge, Autorisierung und Transaktionsgrenzen und zählen nur bei realer Unit-Ausführung ohne Spring, HTTP, PostgreSQL oder externe Prozesse. Jeder ersetzte Integrationsfall bleibt bis zum bestandenen Ersatz und gezielten Fehlereinbau zusätzlich aktiv.

**Never:** Keine Kryptoparameter lockern, keine Kontotrennung/RLS-, HTTP-/Cookie-/CSRF-/Origin-, Replay-, Persistenz-, Herkunfts-, Eindeutigkeits-, Commit-/Rollback-, Sperr- oder Versionsgrenzen durch Fakes ersetzen. Keine fachlichen Assertions entfernen, bevor Mutations-/Fehlereinbau die neue Prüfung nachweislich scheitern lässt. Architektur-/Prozesshilfsprüfungen erhöhen nicht den fachlichen Unit-Anteil.

## I/O & Edge-Case Matrix

| Szenario | Eingabe/Zustand | Erwartetes Verhalten | Fehlerbehandlung |
|---|---|---|---|
| Betrag | Null, positiv, negativ, ±9007199254740991 Cent und Überschreitung; Summe/Differenz | Fachregel und Grenzverhalten bleiben exakt erhalten | Überlauf wird abgelehnt, kein gerundeter Wert |
| Budget und Überschuss | Fehlendes oder null gesetztes Budget, Ausgaben, Vormerkung | Fehlend bleibt von null unterscheidbar; Rest, Überschuss und Vormerkung stimmen mit Regelbeispielen überein | Ungültige Beträge ändern keinen Zustand |
| Kalender und Historie | Monatswechsel, Berlin-Sommerzeit, Erstaktivierungsmonat, historische Monats-/Zielzustände | Monats- und Zustandsentscheidung folgt kontrollierter Zeit und expliziter Herkunft | Persistenz/Verbrauch wird weiterhin gegen echte PostgreSQL-Prüfung abgesichert |
| Sparfortschritt und Zugang | Vorzeichen, signierter tatsächlicher Fortschritt, Passwort-/Link-/Tokenregeln | Bestehende Regeln bleiben mit echten Kernimplementierungen geprüft | HTTP, Cookies und kryptografische Konfiguration bleiben Integrationsgrenzen |

</frozen-after-approval>

## Code Map

- `backend/src/main/java/de/linus/tnbp/shared/Money.java` und `backend/src/test/java/de/linus/tnbp/shared/MoneyTest.java` -- Centarithmetik und Kalenderprimitive; bestehende Tests erhalten und fachlich ergänzen.
- `backend/src/main/java/de/linus/tnbp/{access,expenses,budget,savingsgoals,monthlysurplus}/` -- produktive Entscheidungslogik; vorhandene Pure Tests liegen jeweils in den entsprechenden `*Test.java`-Klassen.
- `backend/src/test/java/de/linus/tnbp/{access,expenses,budget,savingsgoals,monthlysurplus}/` -- bestehende PostgreSQL-/HTTP-Integrationen bleiben für reale Grenzen bestehen.
- `_bmad-output/implementation-artifacts/test-baseline/canonical-scenarios.csv`, `reviewed-scenario-manifest.json`, `monthly-and-protected-matrix.md` -- geprüfte Zählung, Varianten, geschützte Integrationen und Ersatzreferenzen.
- `backend/pom.xml` und `scripts/test-baseline.py` -- Testgruppen-/Szenarioverteilung und Laufzeit nachvollziehen; reguläres `verify` behält Pflichtintegrationen.

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/test/java/de/linus/tnbp/` -- nach 5.1-Matrix vollständige parametrische Unit-Matrizen für Geldgrenzen, Summen/Differenzen, null-vs-fehlend, Überschuss/Vormerkung, signierten Fortschritt, Kalender und ausgewählte Zugangsregeln ergänzen; vorhandene reine Tests nicht doppelt als Verlagerung zählen.
- [x] `backend/src/main/java/de/linus/tnbp/` -- eng gekoppelte Fachentscheidungen nur bei Bedarf innerhalb des eigenen Moduls extrahieren und im produktiven Ablauf verwenden; Autorisierung, API-Verträge und Modulzugriffe bewahren.
- [x] `backend/src/test/java/de/linus/tnbp/` -- gezielte Mutations-/Fehlereinbauten für jede ersetzte Risikogruppe nachweisen; alte Integrationsassertion erst danach entfernen und reale Grenzprüfung behalten.
- [x] `_bmad-output/implementation-artifacts/test-baseline/` -- Matrix, Primärnachweis, Integrationsschutz und Ersatzreferenzen aktualisieren; semantischen Nenner und Unit-/Adapter-/Integrationsanteile reproduzierbar ausweisen.
- [x] `backend/pom.xml`, `README.md` -- schnelle isolierte Unit-Prüfung dokumentieren und als eigenständige Gruppe ohne Ports, Datenbank oder Anwendungsprozess ausführbar halten; Integrationen weiter in `verify`.

**Acceptance Criteria:**
- Given die dokumentierte Unit-Gruppe, when sie separat läuft, then prüft sie produktive Fachimplementierungen ohne Spring-Kontext, HTTP-Server, PostgreSQL oder externe Prozesse und zählt Prozess-/Architekturhilfen getrennt.
- Given die bisherige Fachfallmatrix, when Betrags-, Summen-, Budget-, Überschuss-, Vormerkungs- und signierte Fortschrittsvarianten ausgeführt werden, then stimmen alle Ergebnisse mit den Regeln einschließlich Maximalgrenzen und Überschreitung überein.
- Given kontrollierte Zeit und explizite historische Zustände, when Monatswechsel, Sommerzeit, Erstaktivierung, Zielwechsel/-löschung und Korrekturen geprüft werden, then sind Entscheidungen isoliert deterministisch; reale Persistenz, Herkunft, Eindeutigkeit und Wiederholungswirkung bleiben integriert belegt.
- Given Zugangskern- und Adapterfälle, when Passwort-/Link-/Tokenregeln isoliert geprüft werden, then bleiben HTTP-Typen, Fehlerabbildung und echte Authentifizierungs-/Cookie-/CSRF-/Replaygrenzen durch passende Adapter- und Integrationsprüfungen geschützt.
- Given eine verhaltenserhaltende Extraktion, when Architekturprüfungen und gezielte Fehlereinbauten laufen, then bleibt die produktive Modulgrenze erhalten und jede betroffene neue Unit-Prüfung erkennt den eingebauten Fehler, bevor ein alter Fachfall entfernt wird.
- Given unabhängige Reihenfolge, Zeit und Testdaten, when neue Unit-Fälle einzeln und gemeinsam ausgeführt werden, then sind sie deterministisch, benennen Varianten fachlich und mocken nur technische Grenzen.
- Given der nach 5.1 festgelegte Nenner von 1096 unterschiedlichen Backend-Fachszenarien, when Story 5.2 abgeschlossen wird, then sind mindestens 15 % (mindestens 165/1096) primär durch echte Backend-Unit-Tests belegt. Die 25 zusätzlich zugeordneten Szenarien sind jeweils durch eine direkte Prüfung der produktiven Fachregel belegt.
- And jede Zuordnung nennt konkrete Eingabe und erwartete Regel; erforderliche HTTP-, PostgreSQL-, Prozess-, Commit-, Sperr- und Versionsnachweise bleiben erhalten. Nenner, Primärarten, Ergänzungsnachweise, verbleibende Kandidaten und Abstand zu Epic-TR-2 sind reproduzierbar dokumentiert. Doppelte oder künstlich aufgeteilte Szenarien erhöhen die Quote nicht. Pflichtintegrationen bleiben im regulären `verify`-Pfad.
- Given Unit-, Adapter- und vollständiger Backend-Prüflauf, when die Verlagerung verglichen wird, then bestehen alle Schutzanforderungen, Ersatznachweise sind konkret verknüpft, Laufzeit und verbleibende teure Fälle dokumentiert und Pflichtintegrationen im regulären `verify`-Pfad enthalten.

## Implementation Notes

- Verhaltensgleiche Fachentscheidungen sind in `Expenses` (Monatssumme und Ersatz), `FinanceApplication` (Restbudget), `MonthlySurplus` (Vormerkung) und `SavingsGoals` (Fortschrittsdifferenz) als produktiv genutzte reine Hilfen isoliert; direkte Unit-Fälle ergänzen vorhandene Fachtests. Keine Integrationstestassertion wurde entfernt.
- Maven trennt `MonthlyAutomationE2eServerTest` von Surefire und führt die Prozessprüfung weiterhin über Failsafe in `verify` aus. README beschreibt die Gruppen. Architekturtests laufen in Surefire mit, zählen aber laut Inventar getrennt.
- Die Szenariomatrix und das Quellenmanifest verknüpfen 23 zusätzliche Quellaufrufe als ergänzende Belege. Sie sind nicht als primäre Unit-Szenarien gezählt. Die fachliche Quote bleibt daher bei 143/1096 (13,05 %); die geforderte Mehrheit und gezielte Mutationsnachweise sind noch offen.

- `Expenses.replacementTotal` kapselt jetzt den fachlichen Ersatz eines bestehenden Monatsbetrags und wird von `Expenses.update` verwendet. Die Unit-Matrix prüft exakte Ersetzung, Maximum und Ablehnung eines überschrittenen Gesamtstands.
- `SavingsGoals.progressAfterDifference` kapselt jetzt die reine Differenzkorrektur und wird vom produktiven Korrekturpfad verwendet. Die Unit-Matrix prüft negative/positive Fortschritte, den sicheren Gesamtstand und Überlauf.
- `FinanceApplication.remainingCents` kapselt jetzt die reine Restbudgetregel und wird von der echten Monatsübersicht verwendet. Unit-Fälle halten fehlendes Budget, Nullbudget, Überziehung und sichere Grenzwerte getrennt.
- `MonthlySurplus.checkedPending` und `pendingAfterClosure` kapseln die echte Vormerkungssumme und werden von den Lese-/Abschlusswegen genutzt. Tests prüfen fehlende Herkunft, ungebundene und bereits gebundene Beträge, Nullsumme und sichere Obergrenze; SQL-Summe, Herkunft und Commit bleiben PostgreSQL-Nachweise.
- Zuordnungsgrenze: Monatsübersicht-, Korrektur- und signierte Fortschritts-IDs aus der 5.1-Matrix beobachten zusätzlich HTTP-Form, historische Datums-/Zielherkunft, Kontotrennung, Sperre oder Commit. Die neuen Rechentests belegen diese zusammengesetzten IDs nicht alleine. Daher bleiben solche Primärnachweise und alle zugehörigen Integrationen unverändert, bis Manifestreview und Mutationsnachweis eine präzisere vorhandene kanonische Eingabe-/Erwartungs-ID bestätigen.
- Die geprüfte 5.1-Zuordnung ist konkret ergänzt: `reviewed-scenario-manifest.json` und `source-matrix.csv` enthalten 23 neue Unit-Quellaufrufe als ergänzende Belege für 24 vorhandene kanonische IDs; `canonical-scenarios.csv` verweist diese Quellbelege zurück. Primärtestarten und Nenner wurden nicht künstlich umklassifiziert; die dokumentierte Unit-Primärquote bleibt 143/1096 (13,05 %). Der aktualisierte Quellhash ist eingetragen, tatsächliche JUnit-Discovery und Testausführung stehen noch aus.
- Keine alte Integrationsassertion wurde entfernt. Für die neuen Ergänzungen sind gezielte Fehlereinbauten noch nicht ausgeführt; erst nach Unit- und `verify`-Lauf kann die Erkennung dokumentiert werden.
- `MonthlyAutomationE2eServerTest` startet absichtlich echte Kindprozesse. Surefire schließt diese reine Prozess-/Infrastrukturprüfung aus; Failsafe führt sie weiter bei `verify` aus. Die Baselinezeile, der Inventar-Refresh und der dynamische Gruppenzähler ordnen sie weiterhin als Prozess-/Infrastrukturprüfung ein und erwarten sie in Failsafe.
- Die Unit-Matrix für Sparfortschritt deckt signierte Werte an beiden sicheren Grenzen, Zwischenwerte, v1-Null/Positivwerte sowie ungültige Vorzeichen und Überläufe ab. Vorhandene Tests für Budget-null/fehlend, Monatsüberschuss, Berlin-Kalender, Zugangslink, JWT und Passwort bleiben erhalten.
- `README.md` dokumentiert `./backend/mvnw -f backend/pom.xml test` als schnelle Surefire-Gruppe ohne Anwendungsserver und PostgreSQL; `verify` behält die Integrationsprüfungen.
- Noch offen: Die neuen Tests sind in `reviewed-scenario-manifest.json`, `source-matrix.csv` und `canonical-scenarios.csv` nur als ergänzende Belege zugeordnet; es gab keine Primärtestart-Umklassifizierung. Der Nenner bleibt 1096; die zuletzt dokumentierte Unit-Primärzuordnung ist 143/1096. Für eine Mehrheit wären mindestens 549 Unit-Primärfälle, also 406 zusätzliche kanonische Zuordnungen nötig. Der Bestandsabgleich ordnet 758 Fälle HTTP/PostgreSQL, 82 PostgreSQL und 113 Prozess/PostgreSQL zu. Im Monatsbereich sind 22 von 189 Fällen Unit, die übrigen 167 enthalten HTTP-/Persistenz-/Sperr-/Commitbeobachtungen. Diese Grenzen dürfen laut Story nicht durch Fakes ersetzt werden. Die neue Restbudget-Unit prüft isoliert nur die Berechnungsregel; sie ersetzt keinen der geschützten HTTP-/Datenbanknachweise. Weitere Zuordnungen müssen die gesamte erwartete Beobachtung des jeweiligen canonical ID abdecken.
- Mangels erlaubtem Prüfaufruf sind Testkompilierung, Ausführung, Mutationsnachweise, Quotenreproduktion und vollständiges `verify` noch offen; deshalb wurden keine Integrationsassertionen entfernt.
- Fortsetzung am 15.11.2026: Die oben als offen markierten Build-/Ausführungsschritte wurden nach der Implementierung ausgeführt und sind erfolgreich (Surefire 71, Failsafe 434; 42 Python-Prüfungen; Szenariozuordnung validiert). Die damalige Formulierung „Mangels erlaubtem Prüfaufruf“ ist damit historisch überholt. Weiterhin offen bleiben Mutationsnachweise und die Mehrheitsquote; die Zuordnung bleibt 143/1096 und keine alten Integrationsassertionen wurden entfernt.

## Spec Change Log

- 2026-11-15 — Linus genehmigte [Sprint Change Proposal](../planning-artifacts/sprint-change-proposal-2026-11-15.md), Vorschlag A. AC-8 nutzt für Story 5.2 ein Zwischenziel von mindestens 15 % (165/1096) und verlangt direkte Unit-Nachweise für die 25 zusätzlich zugeordneten Szenarien. Epic-TR-2 (>50 %) und Story 5.5/AC-5 bleiben unverändert und offen.

## Review Triage Log

## Verification

**Commands:**
- `./backend/mvnw -f backend/pom.xml test` -- isolierte Gruppe läuft ohne Server-/PostgreSQL-/Portverfügbarkeit und weist nur echte Fach-Unit-Tests aus.
- `./backend/mvnw -f backend/pom.xml verify` -- Pflichtintegrationen und vollständiger Backend-Schutz bestehen.
- `python3 _bmad-output/implementation-artifacts/test-baseline/semantic-scenarios.py` -- Zuordnung, Nenner und Primärtestarten validieren; geänderte Risikogruppen zusätzlich mit gezielten Fehlereinbauten prüfen.

**Ergebnisse 2026-11-15:**
- `./backend/mvnw -f backend/pom.xml test`: erfolgreich, 71 Surefire-Tests, keine Fehler oder Skips; kein Spring-/HTTP-/PostgreSQL-Start in dieser Gruppe. Die Prozessprüfung wird dort ausgeschlossen.
- `./backend/mvnw -f backend/pom.xml verify`: erfolgreich, 434 Failsafe-Tests einschließlich Prozessprüfung, keine Fehler oder Skips; Gesamtlaufzeit 16:09.
- `python3 -m unittest discover -s scripts/tests -v`: 42 Prüfungen erfolgreich.
- `python3 _bmad-output/implementation-artifacts/test-baseline/semantic-scenarios.py`: Zuordnung gültig; Backend 143/1096 Unit-Szenarien (13,05 %). Keine Mutationserkennung ausgeführt; Matrix-Mehrheit nicht erreicht.

- Kandidatenprüfung 2026-11-15: Alle 1096 fachlichen Backend-Zeilen wurden strukturell nach Primärtestart, erwarteter Beobachtung und notwendiger Integration ausgewertet. Für keinen der 953 Nicht-Unit-Fälle ist eine direkte Umklassifizierung der bestehenden ID vollständig belegt, weil jeder weiterhin eine reale HTTP-, PostgreSQL- oder Prozessgrenze enthält. Die Analyse und die empfohlenen Schritte zur semantischen Aufteilung sind in `test-baseline/UNIT-CANDIDATE-AUDIT.md` festgehalten. Die Quote bleibt 143/1096; AC-8 ist offen.


- Fortsetzung am 15.11.2026: Erneute Prüfung der 5.1-Regel „reine Rechen-/Zustandsentscheidungen können Unit-Hauptnachweise bekommen; reale Grenzen bleiben integriert“ korrigierte den zu strengen ersten Auditentwurf. 19 bestehende Unit-Quellgruppen wurden für passende kanonische IDs als Primärnachweis gesetzt; sämtliche bisherigen HTTP-/PostgreSQL-Quellen und `required_integration` blieben erhalten. Die reproduzierte Quote ist jetzt 162/1096 (14,78 %); bis AC-8 fehlen 387 Fälle. Temporäre Mutationen an Monatsersatz, Restbudget, Vormerkungsbindung und Fortschrittsdifferenz wurden jeweils von `ExpenseTest`, `FinanceApplicationTest`, `MonthlySurplusTest` und `SavingsGoalTest` erkannt. Keine Mutation oder Integrationsassertion blieb verändert/entfernt.


### Aktualisierung nach E-Mail-Policy und abschließendem Verify (2026-11-15)

`RegistrationEmailPolicy` extrahiert die produktive Normalisierungs- und Formatregel aus `RegistrationService`; `RegistrationEmailTest` prüft gültige/ungültige Formate und die 254/255-Zeichen-Grenze. Fünf passende kanonische Szenarien erhielten Unit-Primärnachweise. HTTP-Fehlerabbildung, persistierte Normalisierung und Kontobindung bleiben durch Integrationsquellen geschützt. Der semantische Stand beträgt 167/1096 (15,24 %); 382 Unit-Primärszenarien fehlen bis AC-8. Keine Integrationsassertion wurde entfernt.

Abschließendes `./backend/mvnw -f backend/pom.xml verify`: erfolgreich, 73 Surefire- und 434 Failsafe-Tests ohne Fehler oder Skips (16:20). `python3 -m unittest discover -s scripts/tests -v`: 42 Prüfungen erfolgreich. `semantic-scenarios.py`: gültig, 167/1096. AC-8 bleibt offen; die Story bleibt `in-progress`.


### Weitere Zuordnung (2026-11-15)

Der passende 255-Zeichen-E-Mail-Fall `BE-0d9b7c687364db27` ist zusätzlich mit `RegistrationEmailTest` als Unit-Primärnachweis verknüpft. Der ursprüngliche `RegistrationIT`-Nachweis bleibt verpflichtend für HTTP-Fehlerabbildung und Konto-/Persistenzwirkung. Die aktuelle Matrix ergibt 168/1096 (15,33 %); 381 Primärszenarien fehlen bis AC-8. Die übrigen bei der gezielten Suche gefundenen JSON-Deserialisierungs-, Fehlerabbildungs-, Konten- und Transaktionsfälle behalten ihre Integrationsprimärart.

### Umsetzung des genehmigten Zwischenziels (2026-11-15)

AC-8 wurde gemäß Vorschlag A mit mindestens 15 % (165/1096) und direkten produktiven Unit-Nachweisen für die 25 zusätzlich zugeordneten Szenarien festgelegt. Der gemessene Stand 168/1096 (15,33 %) erfüllt diesen Schwellenwert. Die höhere Epic-Anforderung TR-2 (>50 %) und Story 5.5/AC-5 bleiben ausdrücklich offen. Story 5.2 ist zur Prüfung bereit; Epic 5 bleibt `in-progress`.

Aktualisierte Nachweise: `semantic-scenarios.py` gültig mit 168/1096; `verify-manifest-refresh.py` mit 14 Prüfungen erfolgreich; vollständiges Backend-`verify` mit 73 Surefire- und 434 Failsafe-Tests erfolgreich, keine Fehler oder Skips; 42 Python-Prüfungen erfolgreich; bereinigter `mvn clean test` mit 73 Tests erfolgreich; `git diff --check` erfolgreich. Für die Änderung an Akzeptanztext und Status waren keine Codeänderungen und kein erneuter Backendlauf erforderlich.
