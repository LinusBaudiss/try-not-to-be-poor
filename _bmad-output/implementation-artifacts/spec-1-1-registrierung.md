---
title: 'Story 1.1: Eigenes Konto über den Registrierungslink anlegen'
type: 'feature'
created: '2026-10-22'
status: 'done'
baseline_commit: '4f3e8f4e080de1d6b5ba72a364538a494bf5acbc'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="Menschlich freigegebener Umfang">

## Intent

**Problem:** Anwendungscode und Kontoanlage fehlen.
**Ansatz:** Registrierungsformular, API und PostgreSQL-Persistenz für Story 1.1 aufbauen.

## Boundaries & Constraints

**Immer:** Angular 22.2.3/Node 24.22.0, Spring Boot 4.1.1/Java 25, Maven Wrapper 3.10.0, PostgreSQL 18.6. OpenAPI 3.0.4 unter `/api/v1`; Generator 7.26.0 und oasdiff 1.30.0. Separate Builds, ausschließlich HTTP, Konto-Daten im Modul `access`.

E-Mail trimmen, kleinschreiben, auf gültige Syntax und maximal 254 Zeichen prüfen; normalisierte Adresse eindeutig speichern. Passwort nach NFC in Unicode-Codepunkten zählen: 15–64, Leerzeichen und druckbares Unicode zulassen, keine Zeichenklassenpflicht, kein Trimmen/Abschneiden. Lokale versionierte Sperrliste; ausschließlich gesalzene Argon2id-Hashes. Keine Passwörter, Linkgeheimnisse oder Request-Bodys protokollieren; keine Zugangsdaten im Browser persistieren.

Link: zufälliges 256-Bit-Geheimnis im URL-Fragment, Übertragung im Request-Body. Externe geschützte Konfiguration: Hash, Ausgabezeit, optional früherer Ablauf, Aktivierungsstatus. Gültig ab Ausgabe bis ausschließlich spätestens Ausgabe + 30 Tage. Rotation/Widerruf sperren alte Links, erhalten Konten. Fehlende Konfiguration sperrt Registrierung.

**Außerhalb:** Anmeldung/Sitzungen (Story 1.2), Finanzfunktionen, Produktionsdeployment und echte Nutzerdaten. Datenschutz-/Betriebsvorgaben bleiben deren Voraussetzung.

## I/O & Edge-Case Matrix

| Angenommen | Wenn | Dann |
|---|---|---|
| Aktiver Link, neue E-Mail, gültiges Passwort | `POST /api/v1/access/registrations` mit `registrationToken`, `email`, `password` | 201, eigenes Konto, Bestätigung erst nach Commit; keine Sitzung. |
| Fehlender/falscher, zukünftiger, abgelaufener oder widerrufener Link | Registrierung, auch exakt an der Ablaufgrenze | 400, neutrale Meldung, kein Konto. |
| E-Mail vorhanden, auch andere Schreibweise/parallel | Registrierung | 400, allgemeiner Fehler ohne Existenzhinweis; höchstens ein Konto. |
| Ungültige E-Mail, Passwortlänge 14/65, Sperrlistentreffer | Registrierung | 400, hilfreiche Feldfehler unabhängig vom Kontobestand; kein Konto. |
| Gültige 15/64 Codepunkte, Leerzeichen, Unicode | Registrierung | Vollständiges Passwort verarbeiten; gleicher Klartext ergibt unterschiedliche verifizierbare Hashes. |
| Anfrage läuft, Netzwerk/Server scheitert | Erneutes Absenden | Doppelsenden blockieren; bei Fehler Eingaben erhalten, kein Erfolg; nach Erfolg Passwort entfernen. |

</frozen-after-approval>

## Code Map

- `_bmad-output/planning-artifacts/epics.md`, Story 1.1: konkretisierte Abnahmen; `AGENTS.md` und Epic-Kontext oben bewahren.
- Architektur AD-1/2/3/6, UX DESIGN/EXPERIENCE: Struktur, Vertrag, Zugang und Formular-Tokens/Fokus (Quellpfade in AGENTS.md).
- Sämtlicher Anwendungscode fehlt. Lokal nur Java 21; Werkzeugumgebung vor Tests bereitstellen. Planung/Skills erhalten; Sprintstatus workflowgemäß synchronisieren.

## Tasks & Acceptance

**Ausführung:**

- [x] `api-contract/openapi.yaml`, `scripts/check-contract.sh`: Vertrag validieren, Angular-Client/Spring-Interfaces generieren/kompilieren; v1-Kompatibilität gegen PR-Basis prüfen, Erstvertrag behandeln.
- [x] `backend/pom.xml`, `backend/mvnw`, `backend/src/main/resources/application.yaml`: Boot/Web/Security/Validation/JDBC/Flyway und Generator integrieren; Geheimnisse extern, nur Registrierung freigeben.
- [x] `backend/src/main/resources/db/migration/V1__accounts.sql`, `backend/src/main/java/de/linus/tnbp/access/AccountRepository.java`: UUID/E-Mail/Hash/Zeit speichern; Unique-Constraint, Transaktion und getrennte Migrations-/Laufzeitrolle.
- [x] `backend/src/main/java/de/linus/tnbp/access/RegistrationService.java` und benachbarte `RegistrationController.java`, `RegistrationLink.java`, `PasswordPolicy.java`: Matrix umsetzen; injizierte Clock, zeitkonstanter Linkvergleich, neutrale Duplikatfehler.
- [x] `backend/src/main/resources/access/password-blocklist.txt`, `THIRD_PARTY.md`: [SecLists](https://github.com/danielmiessler/SecLists)-xato-Top100k mit Quelle, MIT-Lizenz und Prüfsumme einbinden; keine externen Passwortanfragen.
- [x] `frontend/package.json`, `frontend/angular.json`, `frontend/src/app/app.routes.ts`, `frontend/src/app/registration/registration.ts`, `frontend/src/styles.css`, `frontend/proxy.conf.json`: statische SPA, Formular, generierter HTTP-Client, Status/Feldfehler, UX-Tokens.
- [x] `backend/src/test/java/de/linus/tnbp/access/RegistrationTest.java`, benachbarte `RegistrationIT.java`, `frontend/e2e/registration.spec.ts`: Matrix mit PostgreSQL und Browser/axe prüfen; Logs/Browserpersistenz kontrollieren.
- [x] `.github/workflows/ci.yml`, `deploy/compose.local.yaml`, `scripts/create-registration-link.py`, `.gitignore`, `README.md`, `AGENTS.md`: reproduzierbare Builds/Tests, lokale DB, Linkrotation/Widerruf dokumentieren; verifizierte Befehle ergänzen.

**Abnahme:**

- Angenommen mehrere Personen besitzen den Link, wenn sie gültige Konten registrieren, dann entstehen unabhängige Konten ohne Einladungsliste.
- Angenommen 320 × 568 CSS-Pixel, Tastatur oder 200-%-Text, wenn das Formular bedient wird, dann bleiben Labels, zugeordnete Fehler, Status und sichtbarer Fokus zugänglich; kein horizontales Scrollen, Touchziele mindestens 44 × 44 Pixel.
- Angenommen ein Konto besteht, wenn Linkrotation oder API-Neustart erfolgen, dann bleibt es persistent.

## Implementation Notes

- Vertrag, generierte Spring-Boot-4-Interfaces und Angular-22-HTTP-Client sind integriert. Registrierung verwendet ausschließlich HTTP; Zugriff auf andere Routen bleibt gesperrt und es wird keine Sitzung erzeugt.
- Kontoanlage liegt im Modul `access`: normalisierte eindeutige E-Mail, UUID, Argon2id-Hash und Zeitpunkt; echte Transaktion mit Bestätigung nach Commit. Flyway und Anwendung benutzen getrennte Rollen. Die Laufzeitrolle besitzt nur Einfügerechte und wird beim Start auf unzulässige Privilegien geprüft.
- Linkgeheimnis: 32 Zufallsbytes im Fragment, sofort aus der Browser-URL entfernt, ausschließlich im Request-Body übertragen. Extern konfigurierter SHA-256, injizierte Clock, exklusive Ablaufgrenze und maximal 30 Tage; fehlende Konfiguration sperrt die Registrierung. Geschützter Generator unterstützt Rotation/Widerruf mit Dateirechten 0600/0700.
- NFC/Codepunktprüfung und unveränderte Leerzeichen vor vollständigem Argon2id-Hashing; lokale SecLists-Top100k unverändert mit MIT-Lizenz, Commit und SHA-256 in [THIRD_PARTY.md](../../THIRD_PARTY.md).
- SPA mit deutschen Feldfehlern, Fehlerfokus, Status, sichtbarem Fokus, Offline-/Retryverhalten und Doppelsendesperre; Passwort wird nach bestätigtem Erfolg entfernt. Keine Browserpersistenz und keine Request-Body-Protokollierung.
- Angulars transitive Vite-Abhängigkeit wird bei unverändertem Angular 22.2.3 auf 8.3.3 überschrieben. `npm audit` meldet danach 0 Schwachstellen.
- [README.md](../../README.md) dokumentiert getrennte Builds, lokale Datenbank, externe Geheimnisse, Linklebenszyklus, Prüfungen und verbleibende Produktionsvoraussetzungen. Verifizierte Befehle stehen zusätzlich außerhalb des verwalteten AGENTS-Blocks.

### Tatsächlich ausgeführte Prüfungen am 22.10.2026

- `./backend/mvnw -f backend/pom.xml verify`: **26 Unitfälle + 12 PostgreSQL-18.6-/HTTP-Integrationstests**, 0 Fehler, 0 übersprungen; letzter vollständiger Lauf erfolgreich.
- `./scripts/check-contract.sh`: OpenAPI 3.0.4 gültig, Generator 7.26.0 und oasdiff 1.30.0 ausgeführt, Erstvertrag erkannt, generierte Spring-Interfaces und Angular-Client kompiliert. Ein temporäres Git-Repository mit entferntem 201-Erfolgscode wurde vom unveränderten Skript mit `response-success-status-removed` und **Exitcode 1** blockiert.
- `npm --prefix frontend ci && npm --prefix frontend run build`: erfolgreich; statisches Artefakt ca. 277 kB.
- `npm --prefix frontend run e2e`: **15 Browserfälle erfolgreich**, echte API und PostgreSQL 18.6, lokales Chromium; axe ohne Verstöße in Formular-, Fehler- und Erfolgszustand.
- Linkgenerator separat geprüft: 256 Bit, Hashzuordnung, zufällige Rotation, 0600/0700, ungültige Ablaufdaten/Basisadressen und Widerruf erfolgreich.

| Matrix / Abnahme | Ausgeführter Nachweis |
|---|---|
| Aktiver Link, eigenes Konto, Commit vor Bestätigung, keine Sitzung | `RegistrationIT.mehrereLinkinhaberErhaltenUnabhaengigePersistenteKontenOhneSitzung`, `commitFehlerBestaetigtKeinenErfolgUndRolltDasKontoZurueck`; Browser „echte Registrierung …“ |
| Fehlender/falscher, zukünftiger, abgelaufener/widerrufener Link und exakte Grenze | `RegistrationTest.linkZeitgrenzenUndKonfiguration` (15 Parametrisierungen); `RegistrationIT.fehlendeFalscheZukuenftigeUndAbgelaufeneLinksSindNeutral`, `fehlendeUndFrueherAbgelaufeneLinkkonfigurationSperrenHttpRegistrierung`, `rotationWiderrufUndApiNeustartErhaltenBereitsGespeicherteKonten` |
| Normalisierte und parallele Duplikate, neutraler Fehler | `RegistrationIT.doppelteEmailIstNeutralUndParalleleAnfragenErzeugenHoechstensEinKonto`; Browser „bereits vorhandene E-Mail …“ |
| Ungültige E-Mail, 14/65 Codepunkte, Sperrliste, unabhängig vom Kontobestand | `RegistrationIT.feldfehlerSindHilfreichUndUnabhaengigVomKontobestand`, `ungueltigeEmailUndGrenzenErzeugenKeinKonto`, `emailMit254ZeichenWirdAngenommenUnd255Abgelehnt`; Unit-Längen/Sperrliste und entsprechende Browserfälle |
| 15/64 Codepunkte, Leerzeichen, Unicode, NFC, unterschiedliche verifizierbare Hashes | `RegistrationTest.argon2idSalztUndVerifiziertDasVollstaendigePasswort`, `leerzeichenUndUnicodeWerdenNichtGetrimmt`, `nfcWirdVorDemZaehlenAngewendet`; `RegistrationIT.gueltige15Und64CodepunkteSowieNfcWerdenVollstaendigGespeichert` |
| Laufende Anfrage, Netzwerk-/Serverfehler, Entwurf erhalten, Passwort nach Erfolg entfernen | Browser „laufende Anfrage blockiert Doppelsenden …“, „Netzwerkfehler …“, „Serverfehler …“, „offline blockiert Speichern …“, „echte Registrierung …“ |
| Konten bleiben bei Linkrotation/API-Neustart; mehrere Linkinhaber | `RegistrationIT.rotationWiderrufUndApiNeustartErhaltenBereitsGespeicherteKonten`, `mehrereLinkinhaberErhaltenUnabhaengigePersistenteKontenOhneSitzung` |
| 320 × 568, Tastatur, 200-%-Text, Labels/Fehler/Status/Fokus, 44-Pixel-Ziele | Browser „320 Pixel, Tastatur, 200-Prozent-Text und Touchziele bleiben zugänglich“; axe-Prüfungen; zusätzlich Breiten 390/768/1280 |
| Keine Geheimnisse in Logs oder Browserpersistenz | `RegistrationIT.logsEnthaltenKeinePasswoerterLinkgeheimnisseOderRequestBodys`; Browser „echte Registrierung …“ prüft URL, Cookies, LocalStorage, SessionStorage, IndexedDB und Cache Storage |

### Verbleibende Grenzen

Docker/Compose ist in dieser Umgebung nicht installiert; die manuelle Compose-Startfolge und ein tatsächlicher GitHub-Actions-Lauf wurden daher nicht ausgeführt. Die PostgreSQL-Migrationen, Rollen und Anwendung wurden mit echtem PostgreSQL 18.6 lokal verifiziert. Eine vollständige manuelle Screenreader-Prüfung steht aus. Produktionsdeployment, echte Nutzerdaten, Datenschutz-/Betriebsvorgaben und Anmeldung/Sitzungen bleiben ausdrücklich außerhalb dieser Story.

### Abschluss nach Review-Korrekturen

- Sämtliche 16 Befunde aus drei unabhängigen Review-Layern wurden eingeordnet und durch 13 zusammenhängende Korrekturen behoben; keine zurückgestellten Befunde.
- Linkwechsel im selben Tab verwirft alten Zustand; nach 30 Sekunden ohne Antwort bleibt der Entwurf erhalten und der Ausgang wird als unbestätigt bezeichnet. Antwortverlust nach tatsächlichem Commit ist als Browserregression abgedeckt.
- Jackson begrenzt JSON-Dokumente und Strings auf 32.768 Einheiten, einschließlich gestreamter Anfragen, und lehnt Zahlen/Boolean an Stringpositionen ab. Framework-HTTP-Fehler behalten ihren Status; Serverdiagnosen enthalten ausschließlich eine bereinigte Kategorie.
- Nur das Einfügen läuft in einer Datenbanktransaktion. Zusätzliche Tests belegen freie Verbindungen während Argon2 sowie abgelehnte Starts mit Superuser- und Tabellenbesitzer-Zugang.
- Die unveränderte Top100k-Sperrliste wird um 10.828 passende Einträge derselben SecLists-Quellversion ergänzt; Herkunft und Prüfsummen stehen in [THIRD_PARTY.md](../../THIRD_PARTY.md).
- Linkgenerator-Subprozesstests sind Bestandteil von CI. Tokenmuster/Länge stehen ausdrücklich im OpenAPI-Schema; unzip ist als Wrapper-Voraussetzung dokumentiert.
- Vollständige Prüfung durch den Hauptagenten: **26 Unitfälle, 18 PostgreSQL-/HTTP-Fälle, 18 Browserfälle und 4 Pythonfälle**, alle erfolgreich, nichts übersprungen. Vertragscheck einschließlich Generierung/Kompilierung beider Schnittstellen, `npm ci` und statischer Produktionsbuild erfolgreich. Protokolle: `/tmp/tnbp-final-{backend,contract,browser,python}.log`.


## Spec Change Log

## Review Triage Log

Reviewdurchlauf 1: alle drei Layer abgeschlossen. Die folgenden Korrekturen bleiben innerhalb der vorhandenen Schnittstellen; Parsergrenzen nutzen vorhandene Jackson-Konfiguration, übrige Änderungen betreffen direkte Korrekturen, Daten oder Verifikationsnachweise. Keine Änderung des freigegebenen Blocks erforderlich.

| Fund | Urteil | Beleg und Route |
|---|---|---|
| Blind 1: Fragmentwechsel | medium | `token` und Fragmententfernung laufen nur im Konstruktor; Browserreproduktion sendet nach Linkwechsel den alten Token. Patch: neue Fragmente erneut konsumieren, alten Zustand verwerfen. |
| Blind 2: JSON-Größe | high | Tomcats Formlimit greift nicht für JSON; 100.000 Passwortzeichen erreichen die Validierung. Patch: vorhandene Jackson-Lesegrenzen setzen, auch ohne Content-Length prüfen. |
| Blind 3: Skalar-Konvertierung | medium | Ein numerisches JSON-Passwort erzeugt 201, obwohl der Vertrag String verlangt. Patch: Konvertierung nach String für Zahlen/Boolean unterbinden. |
| Blind 4: Protokollfehler | medium | Catch-all fängt Frameworkausnahmen; text/plain ergibt reproduziert 500 statt 415. Patch: ursprünglichen HTTP-Status erhalten. |
| Blind 5: Sperrliste | high | Nur 72 Einträge erfüllen die Mindestlänge; die zugelassene öffentliche Zahlenfolge wurde zusätzlich bei HIBP mit 67.042 Vorkommen bestätigt. Patch: unveränderte Quelldatei durch versionierte passende Sperrlistendaten ergänzen. |
| Blind 6: Hängende Anfrage | medium | Subscription besitzt keine Frist; weder Erfolg noch Fehler lösen den Pending-Zustand ohne Antwort. Patch: begrenzte Wartezeit mit vorhandenem Fehlerpfad. |
| Blind 7: Transaktionsdauer | medium | `@Transactional` umfasst Prüfung und Argon2; die gemeinsame Acht-Verbindungen-Poolgrenze wird dadurch auch von ungültigen Registrierungen beansprucht. Patch: vorhandene Transaktion auf das Einfügen begrenzen. |
| Blind 8: Verlorene Antwort | medium | Nach nachweislichem Commit und verworfener Antwort behauptet die Oberfläche einen Speicherfehler. Patch: unbekannten Ausgang sprachlich korrekt benennen, Entwurf/erneuten Versuch erhalten und belegen. |
| Blind 9: Fehlende Diagnose | medium | Unerwartete Exceptions werden ohne Diagnose in 500 umgewandelt; Entwickler können DB- und Programmfehler nicht unterscheiden. Patch: ausschließlich bereinigte Fehlerkategorie protokollieren, keine Exception-Nachrichten oder Requestdaten. |
| Blind 10: Vertragsrestriktionen | low | Der implementierte 43-Zeichen-Base64url-Token ist nur im Beschreibungstext eingeschränkt. Patch: dieselbe ausdrückbare Restriktion im Schema kodieren; NFC-/Trimregeln bleiben Beschreibung. |
| Edge 1: Fragmentwechsel | medium | Derselbe reproduzierte Defekt wie Blind 1; gemeinsamer Patch, kein zusätzlicher Befundgegenstand. |
| Edge 2: Hängende Anfrage | medium | Derselbe fehlende Abschluss wie Blind 6; gemeinsamer Patch. |
| Edge 3: JSON-Größe | high | Derselbe wirkungslose Formparameter wie Blind 2; gemeinsamer Patch einschließlich Chunked-Test. |
| Edge 4: Wrapper ohne unzip | low | Der unveränderte Wrapper wechselt dann von ZIP zu TAR, behält aber die ZIP-Prüfsumme. Patch: unzip als erforderliches Werkzeug dokumentieren; Herstellerwrapper erhalten. |
| Verifikation 1: Rollen-Startprüfung | medium | Vorverifiziert: alle bisherigen Starts verwenden sichere Rollen; Entfernen des Startup-Abbruchs bleibt unentdeckt. Patch: echte Starts mit privilegierter und besitzender Rolle müssen scheitern. |
| Verifikation 2: Linkgenerator | medium | Vorverifiziert: Browser und API bauen Testlinks selbst; CI führt den Generator nicht aus. Patch: Subprozessprüfungen für Fragment/Hash/Dateirechte/Rotation/Widerruf in CI ausführen. |

Abschluss: Alle oben genannten Patches wurden am korrigierten Diff geprüft. Die vollständige Verifikation bestätigt sämtliche ursprünglichen Matrixzeilen sowie die hinzugefügten Regressionen. Kein Befund wurde verworfen oder zurückgestellt; der freigegebene Block blieb unverändert.

## Verification

- `./scripts/check-contract.sh`: Vertragsprüfungen erfolgreich.
- `python3 -m unittest discover -s scripts/tests -v`: Linkgenerator einschließlich Rotation/Widerruf erfolgreich.
- `./backend/mvnw -f backend/pom.xml verify`: Unit-/PostgreSQL-Tests erfolgreich.
- `npm --prefix frontend ci && npm --prefix frontend run build`: statisches Artefakt kompiliert.
- `npm --prefix frontend run e2e`: API-Ablauf/Fehler/mobile Zugänglichkeit erfolgreich.
