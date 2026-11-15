# Unit-Kandidatenprüfung für Story 5.2

Stand: 2026-11-15
Basis: geprüfte kanonische Inventur aus Story 5.1 (`canonical-scenarios.csv`, 1633 Einträge)

## Ergebnis

Der fachliche Backend-Nenner bleibt 1096. Die geprüfte Baseline hatte 143 Unit-Primärszenarien. Der Abgleich der bereits ergänzten Unit-Quellen mit den 5.1-Fällen bestätigte 25 weitere fachliche Primärnachweise: **168/1096 (15,33 %)**. Für AC-8 fehlen damit noch 381 Unit-Primärszenarien bis zur Mindestzahl 549.

Die zusätzlichen 25 betreffen reine Regeln zu sicheren Cent-Summen, Monatsrest, Vormerkung, v1-/signiertem Sparfortschritt, Fortschrittsdifferenzen und E-Mail-Formatgrenzen. Für alle 25 bleiben die ursprünglichen HTTP-/PostgreSQL-/Sperr-/Commit-Nachweise als ergänzende Quellen und notwendige Integrationsgrenzen erhalten. Kein Integrationsfall wurde entfernt.

Der erste Auditentwurf wertete eine notwendige Integration fälschlich als Ausschlussgrund für einen Unit-Primärnachweis. Die 5.1-Monatsmatrix erlaubt ausdrücklich reine Rechen-/Zustandsentscheidungen als Unit-Hauptnachweis, während die echte Grenze ergänzend bestehen bleibt. Die aktualisierte Einstufung folgt dieser Regel; der Nenner und die kanonischen IDs blieben unverändert.

## Geprüfter Umfang

Es wurden alle 1096 fachlichen Backend-Zeilen betrachtet. Davon sind nun 168 Unit-Primärnachweise; 928 Fälle bleiben primär HTTP/PostgreSQL (733), PostgreSQL (82) oder Prozess/PostgreSQL (113). Alle 928 benötigen weiterhin eine reale Integrationsgrenze.

| Priorisierter Bereich | Verbleibende Nicht-Unit-Fälle | Beobachtete Grenze in der vorhandenen Gruppe |
| --- | ---: | --- |
| `access` | 143 | HTTP-/Cookie-/CSRF-/Origin-/JWT-Verhalten, Kontositzung, Persistenz und Commit-/Replay-Rennen |
| `expenses` | 125 | HTTP, Eigentümer-/Monatsdaten, RLS, Kontosperren, Summenänderung und Rollback |
| `budget` | 56 | HTTP, historische Monatszeilen, RLS und Commit/Rollback |
| `savingsgoals` | 196 | HTTP, Fortschritts-/Zielverhalten, Eigentümer/RLS und Commit-/Versionsgrenzen |
| `monthlysurplus` | 145 | Herkunft, Auswahl/Löschung, Marker, Kontosperren und atomare Mehrfachschreibvorgänge |

Die Bereiche sind nach Primärtestklasse gruppiert; angrenzende Versionierungs- und Monatsfälle bleiben eigenständige Szenarien und überschneiden sich fachlich.

## Bestätigte Zuordnungen

Die 25 kanonischen IDs erhielten einen bereits vorhandenen produktiven Unit-Test als Primärnachweis. Die bisherigen Integrationsquellen blieben Mitglieder derselben IDs und `required_integration` blieb unverändert:

- Cent-Summen und Ersatz: `BE-d9f80335548620e3`, `BE-ad93fa77c6d7e858`.
- Restbudget und Null-/Fehlend-Unterscheidung: `BE-fa0492cf3dee1bfa`, `BE-1f217e0b66d357e4`.
- Fortschrittsdifferenz auf tatsächlichem Stand: `BE-4cae31c94cf07f9a`, `BE-fda4892f421cc67b`.
- Vormerkungssumme und Obergrenze: `BE-ff75f96ef66b60d8`, `BE-06ed7d54777297f0`.
- v1-Fortschritt und sichere Grenzen: `BE-c3f80fbde30de4cf`, `BE-1bee2842ef9c9192`, `BE-74fe424bf38065be`.
- Signierter Fortschritt und unzulässige Grenzen: `BE-007ef7ec03579457`, `BE-f3175f9cb70556e5`, `BE-6f34061352bd9782`, `BE-461a5b3112e75d73`, `BE-737751881d793ec6`, `BE-5bd466eaeaa4578b`, `BE-2abe8b9aaa5206fd`, `BE-b97c2bbb87af6180`.
- E-Mail-Format und Längengrenzen: `BE-49a7b931ce60f8b1`, `BE-e32f25dd70033ad3`, `BE-2e4b1e88f7d75919`, `BE-fc6dd1d77a516e97`, `BE-d11a81b70a6b632e`, `BE-0d9b7c687364db27`.

Die Einstufung beansprucht nur die reine Fachregel als Unit-Nachweis. HTTP-Status/Feldabbildung, echte Persistenz, Kontentrennung, RLS, Herkunft, Transaktion, Marker und Sperrreihenfolge bleiben durch die ursprünglichen Integrationsquellen abgesichert.

## Weiterer Kandidatenumfang

Die übrigen 934 Nicht-Unit-Fälle sind nicht pauschal Unit-Kandidaten. Die CSV weist weiterhin notwendige reale Beobachtungen aus, zum Beispiel:

- HTTP-Status, JSON-Typen/Feldabbildung, Route, Header oder Cookie;
- tatsächliche Konto-/Eigentümertrennung, RLS, persistierte Daten oder historische Herkunft;
- Commit/Rollback, Eindeutigkeit, konkurrierende Sperrreihenfolge oder Wiederholungswirkung;
- echte Prozessidentität, alte/neue Releases, Startbarriere oder Datenbankmigration.

Reine Produktentscheidungen darin können Unit-Hauptnachweise erhalten, wenn die konkrete Eingabe und erwartete Regel durch den Unit-Test getroffen werden und sämtliche bisherigen Grenznachweise erhalten bleiben. Daraus dürfen keine pauschalen Mengen abgeleitet werden. Jede Zuordnung braucht die gleiche explizite Eingabe-/Erwartungsprüfung wie die 25 bestätigten Fälle.

Für AC-8 fehlen noch 381 Unit-Primärszenarien. Der aktuelle Bestand weist diese Anzahl noch nicht als unabhängige passende Unit-Erwartungen aus. Erforderlich sind weitere produktiv verwendete Regeln und passende konkrete kanonische Varianten, danach semantische Manifestprüfung und gezielte Mutationserkennung. Falls die bestehende Produktlogik nicht genügend unterschiedliche Fachregeln trägt, ist AC-8 mit dem fixierten Nenner nicht erreichbar, ohne die Abnahmeregel neu zu verhandeln; echte Grenzfälle zusammenzuziehen wäre kein Ersatz.

## Verifikation

```sh
python3 _bmad-output/implementation-artifacts/test-baseline/semantic-scenarios.py
```

Erwarteter aktueller Stand: Backend 1096, Unit-Primärnachweis 168, Quote 15,33 %. Die Integrationsquellen bleiben im Inventar und regulären `verify`-Pfad.

## Mutationsnachweis für die neuen Fachhilfen

Vier temporäre Fehler wurden jeweils vom zugehörigen Unit-Test erkannt: ungeprüfte Monatssumme (`ExpenseTest`), rohe Restbudgetsubtraktion mit Überlauf (`FinanceApplicationTest`), fehlende Zielbindung bei der Vormerkung (`MonthlySurplusTest`) und unchecked Fortschrittsaddition (`SavingsGoalTest`). Nach Wiederherstellung des Produktivcodes liefen die vier fokussierten Testklassen erneut erfolgreich: 33 Tests, keine Fehler oder Skips. Keine alte Integrationsassertion wurde entfernt.


## Ergänzung: E-Mail-Regel und abschließender Verify

`RegistrationEmailPolicy` isoliert die produktive Normalisierungs- und Formatregel; `RegistrationEmailTest` prüft zulässige/ungültige Formate sowie die 254/255-Zeichen-Grenze. Sechs passende kanonische Szenarien erhielten diese Unit-Quelle als Primärnachweis. Registrierung, HTTP-Fehlerabbildung, persistierte Normalisierung und Kontobindung bleiben durch `RegistrationIT` und bestehende Integrationsquellen geschützt.

Der abschließende `./backend/mvnw -f backend/pom.xml verify`-Lauf am 2026-11-15 bestand mit **73 Surefire- und 434 Failsafe-Tests**, ohne Fehler oder Skips; Laufzeit 16:20. Die semantische Validierung bestätigt 168/1096 (15,33 %).


## Fortsetzung: 255-Zeichen-Grenzfall

Die Unit-Prüfung für die produktive E-Mail-Policy weist auch die 255-Zeichen-Ablehnung nach. Der passende kanonische Fall `BE-0d9b7c687364db27` wird deshalb nun primär durch diesen Unit-Test belegt; der bisherige `RegistrationIT`-Fall bleibt als ergänzender HTTP-/Persistenznachweis erhalten. Der aktuelle Stand ist **168/1096 (15,33 %)**; für AC-8 fehlen **381** Primärszenarien.

Die weiteren gefilterten Kandidaten dieser Prüfung waren JSON-Typ-/Datumsdeserialisierung, Fehlerabbildung, persistierter Kontostand oder echte Konten-/Transaktionsgrenzen. Sie bleiben daher primär Integration.
