---
title: '5.3 Frontend-Verhalten mit Unit- und isolierten Komponententests absichern'
type: 'refactor'
created: '2026-11-15'
status: 'done'
route: 'dispatch'
story_key: '5-3-frontend-verhalten-mit-unit-und-isolierten-komponententests'
review_loop_iteration: 0
baseline_commit: 'e462d25bf34970e6d9a02c41095fe8070f346ddb'
context:
  - '_bmad-output/implementation-artifacts/epic-5-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Story 5.3 ergänzt schnelle Frontend-Tests und verlagert geeignete E2E-Varianten mit nachgewiesenem Ersatz. Alle acht Story-Abnahmen und TR-2/TR-3/TR-6 bis TR-10 aus `epics.md` bleiben verbindlich. Mehr als 50 % der unterschiedlichen fachlichen Frontend-Szenarien sollen primär isoliert abgesichert sein; doppelte Ausführungen erhöhen die Quote nicht.

## Boundaries & Constraints

**Immer:** Produktverhalten, exakte Centwerte, Sitzungsgrenzen und echte Browsernachweise erhalten. Vor Entfernung alter Assertions alte und neue Tests erfolgreich ausführen und Beobachtungen einzeln zuordnen. Fehlende Nachweise sichtbar lassen. Bestehende Pflichtprüfungen und neue Tests bei Push/PR ausführen.

**Ausgeschlossen:** Framework-Upgrades, Vertragsänderungen, generierte Dateien manuell ändern, Produktfunktionen ergänzen, echte Integrationsgrenzen durch Mocks ersetzen, Veröffentlichung und GitHub-Abgleich. Kleine verhaltenserhaltende Extraktionen sind zulässig.

## I/O & Edge-Case Matrix

| Zustand/Eingabe | Erwartung |
| --- | --- |
| Euroeingaben, ±9007199254740991 Cent, Überpräzision/Überlauf | Exakte deutsche Anzeige; ungültige Eingaben ablehnen; Null-/Positivregeln feldabhängig |
| Negativer/übererfüllter Fortschritt | Tatsächlicher Betrag/Prozentwert; ausschließlich Balken auf 0–100 % begrenzen |
| Kalenderdatum, fehlendes Budget/null, leere Listen, „Berlin-Fahrt“ | Kalenderdatum erhalten; Zustände unterscheiden; Nutzertext erhalten, keine System-Zeitzonenhinweise |
| Verzögerung, Feldfehler, offline, verlorene Bestätigung | Doppelsenden sperren; kein vorzeitiger Erfolg; Entwurf erhalten; ungewisse Mutation erst nach Zustandsklärung wieder freigeben |
| Löschen bestätigen/abbrechen | Nur bestätigte Aktion sendet; sichtbarer Zustand folgt Antwort |
| Abmeldung, Ablauf, Konto-/Ansichtswechsel und späte Antwort | Alte Daten, Entwürfe und Meldungen bleiben verworfen; Tokens/Finanzdaten nur im Arbeitsspeicher |

</frozen-after-approval>

## Code Map

- `frontend/src/app/shared/{money,savings-progress}.ts`: reine BigInt-Funktionen.
- `frontend/src/app/{month,expenses,savings-goals,login,registration,session}/`: echte Templates/Generationen; Automatikaktionen in `SavingsGoals`, Darstellung/Sperren in `monthly-automation.ts`.
- `frontend/{angular.json,package.json,tsconfig.spec.json}`: Angular-22.2.3-Unit-Builder unterstützt Vitest/jsdom; Testabhängigkeiten sind exakt gepinnt und im Lockfile aufgelöst.
- `frontend/e2e/`, `frontend/playwright*.config.ts`: Browsergrenzen erhalten.
- `_bmad-output/implementation-artifacts/test-baseline/`: 5.1-Zuordnung; Discovery, erfolgreiche Vitest-Fälle und explizite isolierte Haupt-/Zusatzzuordnungen sind ergänzt.

## Tasks & Acceptance

**Ausführung, in Abhängigkeitsreihenfolge:**
- [x] `frontend/{angular.json,package.json,package-lock.json,tsconfig.spec.json}` — Testabhängigkeiten exakt pinnen; Befehle `test:unit`, `test:component`, gemeinsames `test` und `test:coverage` ohne Watch/Server einrichten.
- [x] `frontend/src/app/shared/*.spec.ts` — Geld-/Fortschrittsmatrix direkt prüfen.
- [x] `frontend/src/app/{month,expenses,savings-goals,login,registration,session}/*.spec.ts` — Matrixzustände mit Templates, HTTP-Testbackend, echter Session/Interceptor, kontrollierter Zeit prüfen; Navigation, Ablauf, Speicherfreiheit, späte Antworten und Ressourcenbereinigung einschließen.
- [x] `test-baseline/{refresh-source-inventory.py,semantic-scenarios.py,verify-manifest-refresh.py,reviewed-scenario-manifest.json}` unter dem genannten Artefaktverzeichnis — Vitest-Discovery/Quellenprüfung ergänzen, konkrete Ersatzzuordnungen eintragen; IDs/Nenner/Integrationsverweise erhalten, Ableitungen regenerieren.
- [x] `frontend/e2e/*.spec.ts` — nur nach bestandenen alten/neuen Prüfungen und belegtem Ersatz reine Varianten reduzieren; gemischte Browserbeobachtungen behalten.
- [x] `.github/workflows/ci.yml`, `README.md`, `scripts/test-baseline.py` — neue Pflichtgruppe bei Push/PR und im vollständigen lokalen Messpfad aufnehmen; Einzeltests/Coverage dokumentieren, Python-Regressionsprüfungen unter `scripts/tests/` anpassen.
- [x] `_bmad-output/implementation-artifacts/story-5-3-testnachweise.md` — Quellen, Quote, getrennte Ergebnisse, Coverage/Laufzeiten und erkannte Fehlereinbauten dokumentieren; Produktmutationen vollständig zurücknehmen.

**Abnahme:** Alle acht Story-AC aus `epics.md` gelten unverändert.
- Angenommen gepinnte Abhängigkeiten, wenn getrennte Testbefehle laufen, dann bestehen produktive Regel-/Templateprüfungen ohne API, PostgreSQL oder Gesamt-SPA (AC-1–5).
- Angenommen vier kontrollierte Fehler an Formatierung, Doppelsenden, später Kontoantwort und tatsächlichem negativem Fortschritt/Balken, wenn passende neue Tests laufen, dann schlagen sie jeweils fehl und bestehen nach Rücknahme (AC-7).
- Angenommen vollständige Verlagerung, wenn isolierte Tests und alle drei Browsergruppen bestehen, dann belegen mindestens 234/467 kanonische Frontendszenarien isolierte Hauptnachweise, erhaltene Browsergrenzen und bestandenen Ersatz vor Entfernung (AC-6/8).

## Implementation Notes

2026-11-15: Fortsetzung nach externer Paketinstallation: echtes Lockfile geprüft und Abhängigkeiten offline installiert. Zwölf isolierte Quellen mit 324 bestandenen Fällen (43 Unit, 281 Komponenten), tatsächlicher Discovery und erfolgreichen getrennten/Coveragebefehlen. Expliziter Quellenreview belegt 234/467 kanonische isolierte Hauptnachweise (50,11 %) sowie 13 ausschließlich ergänzend abgesicherte Szenarien; IDs, Nenner und Browsergrenzen bleiben erhalten. Vier kontrollierte Fehlereinbauten erkannt und vollständig zurückgenommen. Neue Manifestregressionen, Pythonprüfungen und vollständiger Vertrag bestehen. Keine E2E-Assertions entfernt: aktueller Browserstart bleibt beim echten PostgreSQL-ServerSocket mit `Operation not permitted` blockiert. Story bleibt `in-progress`, aktuelle Browserabnahme/Verlagerung weiterhin offen. Details, Coverage und getrennte Laufzeiten: `story-5-3-testnachweise.md`.

2026-11-15: Neue, vom Nutzer lokal ausgeführte Browserbelege liegen in `../../story-5-3-browser.log` (Pfad relativ zu dieser Spec). Vollständig gelesen: Chromiuminstallation Exit 0, `e2e` 224/224 (4,2 Min.), `e2e:transition` 5/5 (1,9 Min.), `e2e:automation` 91/91 (1,9 Min.), alle Exit 0, keine Fehl-/Skipmarker. Diese erfolgreichen unveränderten Altprüfungen sind vor möglichen Reduktionen revisionsbezogen zu sichern und einzeln den vorhandenen erfolgreichen isolierten Nachweisen zuzuordnen. Frühere Socketfehler bleiben historische Umgebungsversuche. Umsetzung fortsetzen, offene E2E-Aufgabe und Abnahmen anhand des konkreten Bestands abschließen.

2026-11-15: Neun reine ungültige Monatsübersichts-DTO-Varianten nach akzeptiertem externem Alt-Erfolg (224/5/91) und erneutem isoliertem Erfolg (324/324) entfernt. Jeder Ersatz prüft jetzt bestätigte Vorwerte sowie Fehlertext und entfernte Geld-/Detailanzeige. `null`, Netzwerkabbruch, Retry und alle gemischten echten Browserbeobachtungen bleiben erhalten. Originalquelle/Log und einzeln zugeordnete IDs/Ersatzfälle sind mit Hashes in `story-5-3/browser-reduction.json` gesichert. 21 Manifestregressionen, 42 Pythonprüfungen, 281 Komponenten, Coverage, Build und Discovery bestehen; IDs/Nenner und 234/467 bleiben unverändert. Der reguläre Endzustandslauf scheitert vor Fällen weiterhin an `ServerSocket: Operation not permitted`; ausschließlich `npm --prefix frontend run e2e` bleibt zur aktuellen AC-8-Abnahme offen. Übergangs-/Automatikbelege sind erfolgreich und deren Quellen unverändert.

2026-11-15: Der Nutzer hat auch den reduzierten regulären Endzustand lokal erfolgreich ausgeführt. Neuer Beleg `../../story-5-3-browser-after.log`: 224 einzeln erfolgreiche Fälle, 224 passed (4,1 Min.), Exitcode 0, keine Fehl-/Skipmarker. Der noch dokumentierte Browserblocker ist damit für die Abnahme durch externen Erfolg ersetzt. Diesen letzten Beleg archivieren und konsistent mit dem unveränderten reduzierten Quellstand verknüpfen, verbleibende Implementierungs-/Abnahmenachweise abschließen; keine neue E2E-Reduktion erforderlich.

## Spec Change Log

## Review Triage Log

| Befund | Urteil | Nachprüfung / Route |
| --- | --- | --- |
| B1 Archivlogs fehlen im Checkout | high | `git check-ignore -v` bestätigt die historische `**/*.log`-Regel für beide zwingend gelesenen Archivlogs; der Diff enthält sie nicht. Direkte Ignore-Ausnahme für Story-5.3-Nachweise; patch. |
| B2 Frontend-Messgruppe ohne Vollständigkeitsprüfung | medium | `main` validiert Backend-/Browserberichte, hat für `frontend` aber nur Exit 0. Ein übersprungener/reduzierter Vitestlauf kann als vollständige Messung zählen. Bestehenden Berichtsmechanismus gezielt auf diese Pflichtgruppe ergänzen; patch. |
| B3 Sessioncleanup versteckt durch Sitzungsende abgebrochene HTTP-Anfragen | false | Interceptor/Session und `clear()` der Finanzkomponenten brechen beim lokalen `Session.end` keine HTTP-Abonnements ab; TestBed-Zerstörung findet erst nach `verify` statt. Behauptete automatische Abbruchfolge an dieser Stelle widerlegt; verwerfen. |
| B4 Zwölf Promise-Fortsetzungen verursachen unbemerkte falsche Tests | false | Der Helfer ist ausdrücklich begrenzt; HTTP-Fortsetzungen werden über `expectOne/flush` synchronisiert, anschließend konkrete positive/negative Zustände geprüft. Es wurde keine erreichbare falsche Erfolgsbeobachtung gezeigt; eine noch nicht abgeschlossene erwartete Anfrage/Anzeige lässt den jeweiligen Test scheitern. Keinen spekulativen Warteframeworkumbau; verwerfen. |
| B5 Identische alte/neue Automatikantwort | medium | FE-6f30cc1eb992907f liefert tatsächlich vor/nach Aktualisierung jeweils 6000/0/dasselbe Ziel. Widersprüchliche alte Werte und Beobachtung vor frischer Antwort fehlen; direkte Testkorrektur, patch. |
| B6 Budgetwert fehlt in Lebenszyklusassertion | medium | Gemeinsame Assertions prüfen Eingaben und `.summary-money`, nicht `.budget-value`; ein wieder sichtbarer bestätigter Budgetwert könnte unentdeckt bleiben. Direkte Assertion ergänzen; patch. |
| B7 Registrierungsnavigation prüft keinen Entwurf | medium | Benannter Test sendet leeres Formular und ruft nur `fixture.destroy()` auf. Tatsächliche Routerzerstörung/Rückkehr mit ausgefüllten Feldern und leerem neuen Entwurf prüfen; patch. |
| B8 Speicherfreiheit nur für nackten HttpClient | medium | Der Test nutzt kein Finanztemplate; sein Speicher-Spy beobachtet damit keine komponenteneigenen Entwürfe/Mutationen. Spy um bestehende echte Finanzinteraktionen erweitern; patch. |
| B9 HTTP-Methode/Mutationspayload fehlen in Ausgabenmatrizen | medium | Mehrere `expectOne(url)`-Prüfungen beantworten Anfragen ohne Methode/Body zu prüfen; dadurch kann falsch verdrahtete Mutation bei passender Mockantwort bestehen. Exakte Methoden/Cent-/Namenspayloads ergänzen; patch. |
| B10 Euroeingabe nur über Parser-Roundtrip | low | Unitfälle für gewöhnliche `euroInput`-Strings haben keine eigenständigen erwarteten Literale; gekoppelte Fehler werden von diesen Fällen nicht erkannt. Kleine direkte Literalassertionen; patch. |
| B11 Isolierter Ausführungsbeleg ohne Produktquellfingerabdruck | medium | `isolated_execution/validate_sources` binden Report nur an Test-/Supportquellen. Änderung einer produktiven TS-/Templatequelle invalidiert den gespeicherten Report nicht. Vorhandene Hashprüfung um relevante produktive Frontendquellen erweitern, ohne generierte Quellen als manuelle Eingaben zu behandeln; patch. |
| E1 Aktivierungsantwort schützt kein folgendes Konto | medium | FE-91c17d7f8c794c9a ist im Manifest primär, Tabellenzeile endet aber nur mit Logout und `userId=null`; ursprünglicher Browserfall meldet danach anderes Konto an. Expliziten zweiten echten Login/neue Ansicht vor alter Antwort und unveränderten Folgezustand prüfen; patch. |
| E2 Unvollständiger Frontendlauf als Messung | medium | Gleicher bestätigter Defekt wie B2: kein Berichtszweig für `frontend`. Gleiche Wurzel, mit B2 gemeinsam patchen. |

Nachprüfung der Patches am 2026-11-15: B1/B2/B5–B11/E1/E2 sind mit minimalen Korrekturen behoben; B3/B4 bleiben mit obiger konkreter Widerlegung verworfen. Vollständiger eigener Nachreviewlauf: 324/324 Frontendfälle (43 Unit/281 Komponenten), 44/44 Pythonprüfungen, 25/25 Manifestregressionen, aktuelle Discovery 12/12, Coverage, Build und vollständiger v1-/v2-Vertrag erfolgreich. Der Messvalidator akzeptiert den tatsächlichen neuen vollständigen Vitestbericht und weist per Regression fehlende/alte/reduzierte/übersprungene Ergebnisse zurück. Benötigte Rohlogs sind nicht mehr ignoriert; alle Archivhashes überprüft. Produkt-/E2E-Quellen unverändert, externe Endzustandsbelege weiter gültig. Keine offenen Reviewbefunde; keine weitere manuelle Ausführung erforderlich.

## Verification

`npm --prefix frontend run test`, `npm --prefix frontend run test:coverage`, `npm --prefix frontend run build`, `./scripts/check-contract.sh`; alle drei bestehenden `e2e`-Befehle; Python-Skriptprüfungen und die drei Inventar-/Semantikbefehle aus `test-baseline/SCENARIO-REVIEW.md`. Einzeltests und gemeinsame Ausführung müssen bestehen. Coverage schließt generierten Code aus; instrumentierte Zeiten separat ausweisen.

5.1 abgeschlossen; aktuell 234/467 kanonische Frontendszenarien mit bestandenem isoliertem Hauptnachweis. Neun reine DTO-Varianten wurden nach einzeln belegtem Alt-/Neu-Erfolg verlagert; IDs, Nenner und echte Browsergrenzen bleiben erhalten. Erfolgreiche externe Belege aller drei unveränderten Altgruppen sowie des regulären reduzierten Endzustands (224/224, Exit 0) sind unverändert archiviert und mit dem Quellstand verknüpft. 24 Manifestregressionen prüfen einschließlich drei neuer Negativprüfungen die vollständigen Endzustandsbelege. Implementierungs- und Prüfnachweise sind konsolidiert; unabhängiger Review und Statusabschluss stehen aus. Aktuelle Ergebnisse und datierte historische Versuche siehe `story-5-3-testnachweise.md`.

Abschluss 2026-11-15: Alle Aufgaben und AC-1 bis AC-8 anhand der dokumentierten internen und akzeptierten externen Prüfnachweise erfüllt; unabhängiger Review einschließlich Patchnachprüfung abgeschlossen. Keine offenen oder zurückgestellten Reviewbefunde. Spec `done`, Sprintstory gemäß Build-Abschluss `review`.

Nachweisbereinigung 2026-11-15 auf Nutzerauftrag: Der PR-Nachweissatz ist von 65 auf 13 Dateien reduziert. Alle zwingenden Alt-/Neu-/Browser-/Mutationsbelege bleiben vorhanden; aktuelle Ergebnisse und Laufzeiten sind in `review-final-checks.json` konsolidiert. Entfernte Zwischen-/Fehlerlogs bleiben im bisherigen Git-Commit `8f7a39714d28aa9f897df10a5a2da86d38df2b5e` erreichbar. Pfad-/Hashreferenzen und Abnahmewerte bleiben erhalten; Produktcode, Tests, Szenariozuordnung und Sprintstatus unverändert.
