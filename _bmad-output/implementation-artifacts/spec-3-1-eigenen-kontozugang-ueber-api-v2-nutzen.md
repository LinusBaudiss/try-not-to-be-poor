---
title: 'Story 3.1: Eigenen Kontozugang über API v2 nutzen'
type: 'feature'
created: '2026-10-26'
status: 'done'
route: 'dispatch'
baseline_commit: 'cf230fe3c2039457a5b8ae83a1658a319027c484'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Der Kontozugang ist nur über v1 erreichbar.

**Ansatz:** Getrennten Vertrag und Adapter für Registrierung, CSRF, Anmeldung, Erneuerung, Abmeldung und Identität ergänzen; Zugangsfunktionen gemeinsam verwenden. Alle acht Abnahmen von Story 3.1 in `_bmad-output/planning-artifacts/epics.md` gelten vollständig.

## Boundaries & Constraints

**Immer:** OpenAPI 3.0.4, Generator 7.26.0, oasdiff 1.30.0; eigene Generierung, Kompilierung und Vergleichsbasis je Version. Bestehende Link-/Passwortregeln, Argon2id, zehnminütige vollständig geprüfte JWTs und gemeinsame rotierende Refresh-Familien mit exklusiven 30-/90-Tage-Grenzen erhalten. Sichere Hostcookies, CSRF/exakte Origin, neutrale Fehler, v2-`no-store`, Bestätigung nach Commit und geheimnisfreie Logs. Unbestätigte Mutationen nicht automatisch wiederholen.

**Ausgeschlossen:** Änderung des v1-Vertrags, manuelle Generatoränderungen, Migrationen, Browserumstellung, v1-Stilllegung, negative Fortschritte, Automatik und Betriebsfreigabe. Bestandsdaten und Anwendung erhalten.

## I/O & Edge-Case Matrix

| Fall | Eingabe/Zustand | Ergebnis/Fehler |
|---|---|---|
| Registrierung | Aktiver Link, gültige Daten | 201 nach Commit ohne Sitzung; ungültig: neutrale 400/Feldfehler; Commitfehler: 500 ohne Konto. |
| Identität | Anmeldung, Bearer | 200, gleiche Konto-ID; fehlender/ungültiger/abgelaufener JWT oder nur Cookies: 401. |
| Sitzung | Refresh, auch versionsübergreifend | Gemeinsame Rotation; Wiederverwendung/Ablauf/Widerruf: 401. |
| Schutz | Falsche/fehlende CSRF oder Origin | 403 ohne Mutation; fehlende Konfiguration: 503; unbekannte Routen gesperrt. |
| Abmeldung | Gültiger Schutzkontext | 204 nach Widerrufscommit, Cookie löschen; Refresh beider Versionen gesperrt, JWT läuft regulär ab. Commitfehler bestätigt nichts. |

</frozen-after-approval>

## Code Map

- `api-contract/openapi.yaml`: eingefrorene Vorlage für sechs Zugangspfade und Modelle.
- `backend/src/main/java/de/linus/tnbp/access/`: gemeinsame Services/JWT/Cookies; `SessionErrors` gilt bislang ausschließlich für den v1-Sitzungscontroller.
- `backend/src/test/java/de/linus/tnbp/access/`: `RegistrationIT`/`SessionIT` prüfen PostgreSQL, Uhr, Fehler, Schutz und Logs.
- `.github/workflows/ci.yml`: ruft Vertragscheck mit Basisrevision auf. `frontend/tsconfig.app.json` erfasst ungenutzte v2-Ausgaben nicht zuverlässig.

## Tasks & Acceptance

**Ausführung:**
- [x] `api-contract/v2/openapi.yaml` zuerst: `/api/v2`, sechs Zugangspfade, DTOs/Fehler/Statuscodes einschließlich Logout-503, Sicherheits-/Header-/Cookievertrag.
- [x] `backend/pom.xml`, `scripts/generate-client.sh`: getrennte Java-Ausgaben/-Pakete `contract` und `contract.v2`, getrennte TypeScript-Module unter `frontend/src/app/api/` und `api/v2/`; bestehende Importe erhalten.
- [x] `frontend/tsconfig.contracts.json`, `frontend/package.json`, `scripts/check-contract.sh`: vollständige Generatorausgaben mit `ngc` kompilieren, je Version validieren/vergleichen; fehlende v2-Basis als Erstvertrag behandeln; CI-Anbindung erhalten.
- [x] `backend/src/main/java/de/linus/tnbp/access/{RegistrationV2Controller,SessionV2Controller}.java` ergänzen; `AccessConfiguration.java` und `SessionErrors.java` für präzise v2-Routen, Schutz und korrekte Fehler erweitern.
- [x] `backend/src/test/java/de/linus/tnbp/access/{RegistrationIT,SessionIT}.java`: Versionspfade wählbar machen; `{RegistrationV2IT,SessionV2IT}.java`: Nachweise mit expliziter Testkonfiguration für v2 wiederverwenden. `AccessVersionsIT.java`: Versionswechsel, Parallelrefresh, JWT-Manipulation, Cookie-only-Ablehnung, unbekannte Routen und Logout-Commitfehler prüfen.
- [x] `scripts/tests/test_contract_versions.py` ergänzt gezielte Nachweise für eigene Basisverträge, Erstvertrag und inkompatible Änderungen. `README.md` dokumentiert Versionen und Prüfungen; `sprint-status.yaml` synchronisieren.

**Abnahme:**
- Angenommen beide Verträge bestehen, wenn geprüft wird, dann kompilieren beide Ausgaben und inkompatible Änderungen jeder Version scheitern.
- Angenommen Link/Bestandskonto/Familie bestehen, wenn v2 oder beide Versionen verwendet werden, dann bestehen alle acht Storyabnahmen ohne spätere Stories; v1-Vertrag, Bestandsdaten und Anwendung bleiben erhalten.

## Implementation Notes

- Der v2-Zugangsvertrag wurde vor Generatoren und Adaptern angelegt; er beschreibt nur die sechs Zugangspfade, einschließlich Logout-503, no-store und Hostcookie-/Headerverhalten.
- Zwei Maven-Ausführungen generieren nach `target/generated-sources/openapi/v1` beziehungsweise `v2` in die Pakete `contract` und `contract.v2`. Angular generiert weiterhin nach `api/` sowie zusätzlich nach `api/v2/`. `ngc` prüft unabhängig vom SPA-Importbaum alle generierten TypeScript-Dateien.
- Beide v2-Controller verwenden unverändert `RegistrationService` und `SessionService`; Kontoablage, Passwortprüfung, JWTs, Refresh-Familien und Commitgrenzen bleiben gemeinsam. Die Security-Freigaben nennen ausschließlich die sechs konkreten v2-Zugangsrouten. `SessionErrors` erfasst beide Sitzungsadapter; v2-Antworten einschließlich Registrierung und Fehler tragen no-store.
- Die bestehenden 19 Registrierungs- und 13 Sitzungs-HTTP-Prüfungen laufen über wählbare Versionspfade mit expliziter Testkonfiguration auch für v2. Sieben zusätzliche `AccessVersionsIT`-Fälle belegen Konto-/Identitätswechsel zwischen Versionen, Rotation/Replay, Parallelrefresh, Logout und Logout-Commitfehler, signierte JWT-Manipulationen, Cookie-only-Ablehnung und geschlossene unbekannte Routen/falsche Methoden.
- Die fünf neuen Pythonfälle prüfen die Steuerung des echten Vertragscheckskripts in temporären Git-Repositories mit Testdoubles für Builds/Comparator. Die getrennten echten oasdiff-Negativproben ergänzen diesen Nachweis.
- README dokumentiert Versionen und Prüfbefehle. Keine Migration, Browserumstellung, v1-Stilllegung oder Finanz-/Automatikfunktion ergänzt.
- Alle sieben angenommenen Reviewkorrekturen sind umgesetzt: verpflichtende TypeScript-Einstiegspunkte beider Versionen, präziser 415-/Logout-/CSRF-Vertrag, idempotente Logoutnachweise, Cache-/Cookieassertionen und genaue Beschreibung der manuellen Negativproben. Die drei unabhängigen Reviewebenen sind abgeschlossen; keine offenen Korrekturen. Bestehende Generatorhygiene wurde in `deferred-work.md` aufgenommen.

## Spec Change Log

## Review Triage Log

| Befund | Urteil und Evidenz | Behandlung |
|---|---|---|
| Blind 1: Registrierung ohne 415-Vertrag | low: `RegistrationV2IT.frameworkProtokollfehlerBehaltenIhrenHttpStatus` belegt 415; der neue Vertrag beschreibt diese bestehende Antwort nicht. | patch: Status, Fehlerform und Cacheheader dokumentieren. |
| Blind 2: Logout ohne/mit unbekanntem Refresh | low: `SessionService.logout` widerruft nur eine gefundene Familie und bestätigt ansonsten ebenfalls 204; der neue Vertrag beschreibt die vorhandene Idempotenz unvollständig. | patch: optionale Refresh-Authentifizierung und Idempotenz dokumentieren, beide Fälle prüfen. |
| Blind 3: CSRF-Cookie-/Headerpaar | low: `HttpSessionCsrfTokenRepository` benötigt dieselbe Session; die Headerbeschreibung nennt dieses notwendige Paar nicht ausdrücklich. | patch: Beschreibung präzisieren. |
| Blind 4: v1-Fehler-DTOs in v2 | false: `ApiError` und `SessionError` besitzen derzeit in beiden Verträgen identische JSON-Felder und Enumwerte. Gemeinsame Advice-Antworten erfüllen den v2-Vertrag; eine künftige abweichende Schemaänderung ist kein vorhandener Fehler. | verworfen. |
| Blind 5: veraltete Generatorreste | low: Generatoren bereinigen Ausgaben nicht; ein lokal verbleibender alter Dienst könnte nach einer späteren Umbenennung einen Import weiter erfüllen. Dieselbe Eigenschaft bestand bereits in beiden bisherigen Generatorwegen; diese Story ändert keine bestehenden Tags/Modelle. | defer: bestehende Generatorhygiene gesondert behandeln. |
| Blind 6: Compilerkommando generiert nicht | false: `check-contract.sh` generiert unmittelbar vor `check:contracts`; `prebuild` generiert ebenfalls. Das separat dokumentierte Compilerkommando prüft ausdrücklich bereits generierte Dateien. Eine automatische Generierung darin würde zudem die gezielte Typfehlerprobe überschreiben. | verworfen. |
| Blind 7: Cacheheader bei Registrierungsfehlern ungetestet | low: Der v2-Filter setzt den Header auch bei 400/415/500 korrekt; wiederverwendete Registrierungstests sichern ihn bisher nur nicht ab. | patch: Headerassertionen für die tatsächlich ausgeführten Fehlerfälle ergänzen. |
| Blind 8: CSRF-Cookieattribute im HTTP-Helfer ungeprüft | low: Attribute sind global korrekt konfiguriert und bereits im v1-Browsertest geprüft; der wiederverwendete HTTP-Helfer prüft sie für den neuen Adapter noch nicht. | patch: direkte Attributassertionen für beide Versionen. |
| Blind 9: kein deterministischer Datenbanküberlapp | low: Parallele HTTP-Einsendungen garantieren keine überlappenden Transaktionen; beide Adapter rufen aber unverändert denselben bereits sperrenden Dienst auf. Kein verlorener Widerruf wurde gezeigt. Deterministische Datenbankbarrieren würden zusätzliche Testinfrastruktur für unveränderte Sperrlogik verlangen. | verworfen: geringe Nachweisschwäche ohne erwartbaren Alltagsfehler, Behebung mehr als direkte Korrektur. |
| Blind 10: Negativproben als automatischer Skriptteil lesbar | low: Die Modulbeschreibung sagt „separat im Vertragscheck“, während die echten Negativproben manuell in isolierten Repositories ausgeführt wurden. Die normale CI ruft nur positive Checks auf. | patch: Aussage präzisieren. |
| Verification 1: fehlende v2-Ausgabe bleibt grün | medium: Reviewer hat mit echtem `ngc`, v1-Dateien und fehlendem v2-Ordner Exit 0 nachgewiesen. Der Glob erzwingt keine Ausgabe je Version und könnte einen entfallenen Generatorlauf verschleiern. | patch: beide generierten Einstiegspunkte verpflichtend machen; echte Negativprobe mit fehlender v2-Ausgabe. |
| Edge Case Hunter | Keine Befunde. | abgeschlossen. |

## Verification

- 2026-10-26: `./scripts/check-contract.sh` erfolgreich: beide Verträge validiert, beide Java-Ausgaben kompiliert, alle Angular-Generatorausgaben durch `ngc` geprüft und bestehende SPA gebaut. Fehlende v2-Basis wurde ausdrücklich als Erstvertrag gemeldet.
- `python3 -m unittest discover -s scripts/tests -v`: 9 Fälle erfolgreich (4 Linkgenerator, 5 Versionscheck).
- `./backend/mvnw -f backend/pom.xml verify`: 42 Unitfälle und 124 echte PostgreSQL-18.6-/HTTP-Integrationsfälle erfolgreich; vorhandene Finanzprüfungen eingeschlossen. Beide Versionsadapter bestehen die 19 Registrierungs- und 13 Sitzungsfälle; die 7 Zusatzfälle bestehen.
- Echte Negativproben in einem temporären Git-Repository mit eigenen v1-/v2-Basisverträgen: Entfernen von `/access/me` in jeweils einer Version lässt `check-contract.sh` mit `api-path-removed` und Exit 1 scheitern, bevor Builds starten.
- Temporärer Typfehler unter der sonst ungenutzten v2-Generatorausgabe lässt `npm --prefix frontend run check:contracts` mit Exit 1 scheitern. Probe entfernt; anschließender `ngc`-Lauf erfolgreich.
- `git diff --check` erfolgreich; `git diff --exit-code -- api-contract/openapi.yaml` bestätigt den unveränderten v1-Vertrag. Keine Negativproben verbleiben.
- Für den Werkzeuglauf wurden fehlende gepinnte Maven-/npm-Abhängigkeiten über die zugelassene lokale Ausführung geladen. Keine Browserprüfungen erforderlich: die Oberfläche bleibt in dieser Story auf v1.
- Primärprüfung: vollständigen Diff gegen die Basis einschließlich neuer Dateien gelesen; alle sechs Aufgaben bestätigt. XML-Berichte belegen 42/124 erfolgreiche Tests ohne übersprungene Fälle. Jede Matrixzeile ist durch ausgeführte Tests in `RegistrationV2IT`, `SessionV2IT` beziehungsweise `AccessVersionsIT` abgedeckt; Vertrags- und Negativprobenprotokolle geprüft.
- Abschluss nach Reviewkorrekturen: `./scripts/check-contract.sh`, neun Pythonfälle und vollständiges Maven-`verify` erneut erfolgreich. Finale XML-Berichte: 42 Unitfälle und 125 PostgreSQL-/HTTP-Fälle, keine Fehler oder übersprungenen Fälle. Protokolle: `/tmp/tnbp-story31-final-contract.log`, `/tmp/tnbp-story31-final-python.log`, `/tmp/tnbp-story31-final-verify.log`.
- Abschließende isolierte Negativproben erneut erfolgreich: echtes `check-contract.sh`/oasdiff weist Entfernen von `/access/me` in beiden Versionen ab; echtes `ngc` scheitert sowohl bei vorhandenem v1 und fehlendem v2-Einstiegspunkt als auch bei einem unimportierten v2-Typfehler. Temporäre Testprojekte wurden entfernt; produktive Generatorausgaben blieben unverändert.
