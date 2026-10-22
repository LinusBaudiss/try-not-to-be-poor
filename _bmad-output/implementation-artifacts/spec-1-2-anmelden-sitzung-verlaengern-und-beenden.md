---
title: 'Story 1.2: Anmelden, Sitzung verlängern und beenden'
type: 'feature'
created: '2026-10-22'
status: 'done'
route: 'dispatch'
baseline_commit: 'f9c7f8e231971bef1eada7b271a30ef79fc4a017'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="Menschlich freizugebender Umfang">

## Intent

Anmeldung, Sitzungserneuerung und Abmeldung gemäß Story 1.2 ergänzen; nach Anmeldung öffnet sich „Monat“ ohne vorgetäuschte Finanzwerte.

## Boundaries & Constraints

**Immer:** Bestehender Stack und OpenAPI-Vertrag. E-Mail wie Registrierung normalisieren; Passwort NFC-normalisiert vollständig gegen Argon2id prüfen, unbekannte Konten mit Dummy-Hash. Keine Geheimnisse protokollieren.

JWT: zehn Minuten; Signatur, Algorithmus, Aussteller, Zielgruppe, Zeitgrenzen und UUID-`sub` prüfen; Schlüssel extern. Refresh: 256 Zufallsbits, serverseitig nur Hashes; hostgebundenes `HttpOnly; Secure; SameSite=Strict`-Cookie. Jede Erneuerung rotiert; Ablauf nach 30 Tagen Inaktivität/90 Tagen seit Anmeldung, Grenzen exklusiv. Replay und Logout widerrufen die Familie; JWTs laufen regulär ab.

Spring-Security-CSRF mit Header und exakte Origin schützen Login/Refresh/Logout. JWT, CSRF-Token und persönliche Daten nur im Browser-Arbeitsspeicher; Sitzungsende/Kontowechsel verwerfen diesen und schließen persönliche Ansichten.

**Außerhalb:** Finanzfunktionen ab Story 1.3, Passwortwiederherstellung, Produktionsdeployment und echte Nutzerdaten.

## I/O & Edge-Case Matrix

| Angenommen | Wenn | Dann |
|---|---|---|
| Konto | Richtige Zugangsdaten | JWT/Cookie nach Commit; geschützter Zugriff über `sub`. |
| Falsches Passwort/unbekannte E-Mail | Login | Identischer neutraler 401-Fehler. |
| Gültiges Refresh-Token | Erneuerung | Neues JWT und Cookie; altes Token verbraucht. |
| 30/90-Tage-Grenze erreicht | Refresh | 401, Cookie löschen, Anmeldung verlangen. |
| Verbrauchtes Token, auch parallel | Refresh | Familie samt Nachfolger dauerhaft widerrufen. |
| CSRF/Origin fehlt oder falsch | Mutation | 403 ohne Mutation. |
| Sitzung | Logout | Familie widerrufen, Cookie/Browserzustand löschen; JWT bleibt bis Ablauf gültig. |
| Ablauf/Kontowechsel/späte Antwort | Zustandswechsel | Keine alten Daten oder Wiederbelebung beendeter Sitzungen. |

</frozen-after-approval>

## Code Map

- `backend/src/main/java/de/linus/tnbp/access/`: Repository, Passwortnormalisierung, Security, Clock/JDBC wiederverwenden.
- `frontend/src/app/registration/registration.ts`: Formular/Fokus erhalten, gemeinsame CSS-Tokens verwenden.

## Tasks & Acceptance

- [x] `api-contract/openapi.yaml`: CSRF/Login/Refresh/Logout/Identitätsendpunkt, Cookie-/Headervertrag; eigenes Sessions-Tag und SessionError, Registrierungsvertrag erhalten.
- [x] `backend/pom.xml`, `backend/src/main/java/de/linus/tnbp/access/{SessionService,SessionRepository,SessionController,AccessConfiguration}.java`: JWT/CSRF/Origin und neutrale Fehler implementieren.
- [x] `backend/src/main/resources/db/migration/V2__sessions.sql`, `backend/src/main/java/de/linus/tnbp/access/AccountRepository.java`: Familien und Tokenhistorie mit minimalen Laufzeitrechten; Rotation und Widerruf transaktional serialisieren.
- [x] `frontend/src/app/session/{session,session.interceptor}.ts`, `frontend/src/app/login/login.ts`, `frontend/src/app/app.routes.ts`: Zugang, geschützte Startansicht, serialisierter Refresh, Logout/Zustandsverwerfung; Registrierung verlinken.
- [x] `backend/src/test/java/de/linus/tnbp/access/{SessionIT,SessionTest,RegistrationIT}.java`: Matrix, JWT-Manipulation, Neustart, Commitfehler/Parallelität; Rechte-/TRUNCATE-Annahmen anpassen.
- [x] `frontend/e2e/session.spec.ts`, `frontend/playwright.config.ts`, `backend/src/test/java/de/linus/tnbp/access/E2eServer.java`: echte Secure-Cookies/CSRF, Reload/Ablauf/Fehler, Speicherfreiheit und axe prüfen.
- [x] `README.md`, `backend/src/main/resources/application.yaml`, `.github/workflows/ci.yml`, Sprintstatus: Schlüssel/Origin und lokale Secure-Cookie-Prüfung dokumentieren/integrieren.

**Abnahme:** Angenommen 320 × 568, Tastatur/200-%-Text, wenn Anmeldung bedient wird, dann bleiben Labels, Fehlerfokus und 44-Pixel-Ziele zugänglich, ohne horizontales Scrollen. Angenommen Zugangswechsel, wenn Registrierung öffnet, dann unterscheiden Überschrift/Hauptaktion die verwandten Formulare.

## Implementation Notes

- Separater Sessions-Vertrag mit Spring-Interfaces und generiertem Angular-Client; Registrierung bleibt kompatibel.
- HS256-Schlüssel extern (Base64, mindestens 32 Bytes); JWT-Verifikation ohne Zeitkulanz, UUID-sub und zehn Minuten Gültigkeit. Fehlende Konfiguration sperrt Sitzungen.
- Familienzeilensperre und erneutes Tokenlesen serialisieren Rotation, Replay und Logout. Verbrauchte Hashes bleiben zur dauerhaften Replay-Erkennung erhalten; kein Refresh-Geheimnis wird gespeichert.
- Spring-CSRF verwendet eine serverseitige Sitzung und ein separates hostgebundenes Secure/HttpOnly-Cookie. Jeder Cookie-Mutation geht ein frischer CSRF-Handshake voraus, sodass ein API-Neustart oder eine kürzere CSRF-Sitzung nicht die Refresh-Lebensdauer verkürzt.
- Browserzustand bleibt im Arbeitsspeicher. Generationen verwerfen späte Antworten; eine gemeinsame Warteschlange ordnet Cookie-Mutationen und anschließenden Widerruf. BroadcastChannel verwirft Ansichten bei Sitzungsende/Kontowechsel auch in anderen Tabs.
- Nach abgelaufenen oder nicht bestätigten Sitzungen wird nach laufenden Cookie-Antworten widerrufen; eine unbestätigte Rotation wird niemals wiederholt. Die geschützte Ansicht „Monat“ zeigt noch keine Finanzwerte.
- Playwright verwendet echtes HTTPS mit synthetischem Schlüssel und echten Secure-Cookies. PostgreSQL-Migrationen wurden ausschließlich auf flüchtigen synthetischen Daten geprüft.
- Nach Reviewkorrekturen: originweiter Web Lock umfasst CSRF und Cookie-Antworten; Ablauf verwendet HTTP-Serverzeit und monotone Restlaufzeit. Login-Abbruch und Logout-Bestätigung sind explizit behandelt. Die geschützte Ansicht prüft ihre Identität über den Angular-Interceptor.
- Die CSRF-HttpSession enthält keine Anmeldung. Bearer-Erfolg darf weder ihre Kennung noch den CSRF-Token verändern; dafür sind Session- und CSRF-Authentifizierungsstrategien ausdrücklich deaktiviert.

## Spec Change Log

## Review Triage Log

Durchlauf 1: Drei unabhängige Layer vollständig eingeordnet. Jeder Befund bleibt einzeln dokumentiert; B1/B2/E1/E2 haben dieselbe Ursache (nur tablokale Serialisierung) und werden gemeinsam korrigiert.

| Fund | Urteil | Beleg und Route |
|---|---|---|
| B1: Gleichzeitiger Refresh in zwei Tabs | medium | Jede Session besitzt eine eigene Queue; beide senden dasselbe browserweite Cookie. Backend widerruft beim zweiten Aufruf korrekt. Patch: tabübergreifende Sperre und Regression. |
| B2: Altes Cookie nach Kontowechsel | medium | Broadcast/Generation verhindern nur Speicherübernahme; eine bereits laufende Antwort setzt weiterhin ihr Cookie. Patch gemeinsam mit B1. |
| B3: Vorgehende Browseruhr | medium | Bei 15 Sekunden scheinbarer Restlaufzeit plant accept() nach jeder Antwort sofort erneut. Patch: serverbezogene Ablaufplanung ohne Rotationsschleife. |
| B4: Login liefert false | low | submit() setzt nur pending zurück; Status bleibt „Anmeldung läuft“. Direkte Korrektur des Ergebniszweigs. |
| B5: Verlassene Login-Komponente | medium | Registrierungslink bleibt bedienbar; die asynchrone Fortsetzung navigiert ohne Lebensdauerprüfung. Patch: abgebrochene Anmeldung und Navigation verwerfen. |
| B6: Vorzeitiger Logout-Erfolg | medium | logout() setzt Erfolg vor revoke(). Patch: sofort schließen, Erfolg erst nach HTTP-Bestätigung; Fehlerfall prüfen. |
| B7: Unbegrenzte Anmeldeversuche | maybe-false | Fehlende Drosselung ist belegt; konkrete Überlastung und notwendige Grenzen sind ohne Zielhost-/Lastprofil nicht belegt. Hohe Auswirkung unbestätigt; als Lastprüfung/Admission-Entscheidung zurückgestellt. |
| B8: Interceptor ungeprüft | medium | Month ruft keine geschützte API auf; vorhandene Browserfälle üben Bearer/401/Retry/Antwortverwerfung nicht aus. Patch: echte geschützte Anfrage und gezielte Regressionen. |
| B9: Fehlende Origin-Konfiguration | low | Filter antwortet vor Service mit 403, README verspricht 503. Direkte Korrektur und HTTP-Nachweis. |
| B10: Content-Type wird 500 | false | Eigene HTTP-Reproduktion mit gültiger CSRF/Origin und text/plain ergibt 415/VALIDATION_FAILED. Mapping scheitert vor Controllerauswahl; der globale Handler bewahrt ErrorResponse. Keine Änderung. |
| B11: Reihenfolge der Startanleitung | low | session.env wird vor ihrer Erzeugungsanleitung geladen. Direkter Vorabverweis. |
| B12: Ablaufbeispiel mit HTTP-Link | low | Ohne base-url verwendet Generator http://localhost:4200, Testserver nutzt HTTPS. Beispiel direkt korrigieren. |
| E1: Paralleler Refresh | medium | Eigenständige Ablaufverfolgung bestätigt B1. Gemeinsamer Patch für browserweite Cookie-Mutationen. |
| E2: Spätes Set-Cookie nach Kontowechsel | medium | Extrahierter Session-Probe bestätigt B2; gemeinsamer Patch und Zwei-Tab-Test. |
| V1: JWT vor Neustart ungeprüft | medium | Neustarttest ersetzt browser.access durch Refresh vor /me; keine positive zweite Decoderinstanz. Vorgeprüfte Nachweislücke, Patch. |
| V2: Alte Familie nach erfolgreichem Kontowechsel ungeprüft | medium | Bestehender Test prüft nur Broadcast; fehlgeschlagener Login-Commit ist ein anderer Pfad. Vorgeprüfte Nachweislücke, Patch mit zwei Konten. |
| Nachprüfung: Bearer verändert CSRF-Sitzung | medium | Angehaltener Refresh plus dazwischenliegendes /me ergab auch mit route.continue reproduzierbar 403. Patch: keine Session-/CSRF-Authentifizierungsstrategie für zustandslose JWT-Aufrufe; direkter HTTP- und Zwei-Tab-Nachweis erfolgreich. |

Abschluss: Alle bestätigten Funktions- und Nachweisbefunde korrigiert; ein Protokollbefund durch HTTP-Reproduktion widerlegt. Die unbestätigte Überlastungsgefahr aus B7 ist in `deferred-work.md` mit dem nötigen Nachweis dokumentiert. Keine weiteren offenen Befunde.

## Design Notes

Keine Absichtsfragen. Migration nur auf synthetischen Testdaten. Familie sperren, Token erneut prüfen; Replay-401 erst nach Widerrufscommit. Unbestätigte Rotation nicht automatisch wiederholen. Persistenter externer Schlüssel; fehlende Konfiguration sperrt Sitzungsbetrieb. Sitzungsantworten: `no-store`.

## Verification

Umgebung: isoliertes JDK 25.0.5 unter `/tmp/tnbp-jdk25`, Maven-Wrapper/Repository unter `/tmp/tnbp-maven`, Chromium unter `/tmp/tnbp-playwright`. Das vorinstallierte Java 25 war nur eine Laufzeit ohne passenden Compiler.

- Vertragsprüfung einschließlich oasdiff, generierter Spring-Interfaces und Angular-Produktionsbuild erfolgreich.
- Backend: 58 Tests erfolgreich (26 RegistrationTest, 3 SessionTest, 19 RegistrationIT, 10 SessionIT).
- Browser: 27 Tests erfolgreich, einschließlich echter Cookies/CSRF, Reload, Ablauf, Replayfehler, späte Antworten, Kontowechsel, Speicherfreiheit, Tastatur/200-%-Text und axe.
- Python: 4 Tests erfolgreich.


`./scripts/check-contract.sh`, `./backend/mvnw -f backend/pom.xml verify`, `npm --prefix frontend ci && npm --prefix frontend run build`, `npm --prefix frontend run e2e`, `python3 -m unittest discover -s scripts/tests -v`: Erwartet werden erfolgreicher Vertrag, Builds und sämtliche Tests.

### Abschließende eigene Verifikation nach Reviewkorrekturen

Alle Prüfungen am 22.10.2026 erneut durch den Hauptagenten ausgeführt: **62 Backendfälle** (26 RegistrationTest, 4 SessionTest, 19 RegistrationIT, 13 SessionIT), **35 Browserfälle**, **4 Pythonfälle**, jeweils erfolgreich und nichts übersprungen. Vertragsprüfung einschließlich oasdiff sowie Generierung/Kompilierung und statischem Produktionsbuild erfolgreich; `git diff --check` ohne Befund. Protokolle: `/tmp/tnbp-story12-final-{backend,contract,browser,python}.log`.

| Matrixzeile / Abnahme | Ausgeführter Nachweis |
|---|---|
| Konto, JWT/Cookie nach Commit, verifiziertes sub | SessionIT.loginCookieIdentitaetNormalisierungUndNeutraleFehler; commitFehlerBestaetigtWederLoginNochRotation; SessionTest.signierteTokensHabenZehnMinutenUndUuidIdentitaet |
| Neutrale Anmeldung | SessionIT.loginCookieIdentitaetNormalisierungUndNeutraleFehler; Browser „Login hat neutrale Fehler …“ |
| Rotation | SessionIT.rotationReplayUndLogoutWiderrufenDauerhaftAberNichtAccessJwt; Browser „automatische Erneuerung …“ und „echte Secure-Cookies …“ |
| Exklusive 30-/90-Tage-Grenzen | SessionIT.inaktivitaetsUndAbsoluteGrenzenSindExklusiv |
| Replay, Parallelität, dauerhafter Widerruf | SessionIT.parallelesRefreshWiderruftAuchDenBereitsErzeugtenNachfolger; replayAntwortKommtErstNachBestaetigtemWiderruf |
| CSRF/Origin vor Mutation | SessionIT.csrfUndOriginBlockierenAlleMutationenOhneZustandsaenderung; bearerIdentitaetspruefungVerwirftKeinenCsrfHandshake; Browser „fehlende oder falsche CSRF/Origin …“ |
| Logout, Cookie/Speicher entfernen, JWT läuft ab | SessionIT.rotationReplayUndLogoutWiderrufenDauerhaftAberNichtAccessJwt; Browser „Logout bleibt bis zur Bestätigung …“ und „echte Secure-Cookies …“ |
| Ablauf, Kontowechsel, späte Antworten | Browser „Tokenablauf …“, „zwei gleichzeitige Wiederherstellungen …“, „verzögertes Refresh hält Kontowechsel …“, „späte geschützte Angular-Antwort …“ |
| Zugängliche Anmeldung und unterscheidbare Formulare | Browser „320 Pixel, Tastatur, 200-Prozent-Text, Touchziele und axe“, „Login hat neutrale Fehler …“ |
| JWT vor Neustart und neue Identität nach Kontowechsel | SessionTest.andererDecoderMitDemselbenExternenSchluesselAkzeptiertVorhandenesJwt; SessionIT.externerSchluesselUndRefreshUeberlebenApiNeustart; kontowechselWiderruftDieVorherigeFamilieUndBestaetigtNeueIdentitaet |
