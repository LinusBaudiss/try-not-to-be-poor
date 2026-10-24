<!-- bmad:context -->
<!-- Verified 2026-10-24 against 72c58735f6bb6f4ddcfd1dd8d3c67ad80c2e67ce (code, scripts and sprint status; no test rerun for this documentation update). Managed by bmad-project-context; edits inside this block are replaced on refresh. Keep anything you want preserved outside the markers. -->

## Try Not to Be Poor

Private Ausgabenübersicht mit fortlaufendem Monatsbudget und Sparzielen, vorrangig für Smartphones. Implementiert sind eine statische Angular-SPA unter `frontend/` und eine Spring-Boot-API mit Maven und PostgreSQL unter `backend/`; der gemeinsame OpenAPI-Vertrag liegt unter `api-contract/openapi.yaml`. Beide Epics und alle neun Stories (1.1–1.6, 2.1–2.3) sind als `done` geführt: Registrierung, Sitzungen, Budget, Ausgaben samt Bearbeiten/Löschen, Restbudget und Sparziele samt Fortschritt/Bearbeiten/Löschen. Produkt-, UX- und Architekturplanung sowie Umsetzungsnachweise liegen unter `_bmad-output/`. Produktionsbetrieb und echte Nutzerdaten sind noch nicht freigegeben.

## Richtlinien

- Schütze Finanzdaten je Nutzerkonto; gemeinsame Ausgaben-, Budget- und Sparzielansichten gehören nicht zu v1.
- Halte Produktionsgeheimnisse außerhalb versionierter Dateien.
- Kläre vor echten Nutzerdaten Export, Löschung, Aufbewahrung und Kontowiederherstellung sowie die offenen Betriebsvorgaben aus Architektur und Epics; verschlüsselte Backups außerhalb des VPS und ein getesteter Wiederherstellungsweg sind Voraussetzung.

## Einstiegspunkte

- Für Produktumfang: lies `_bmad-output/planning-artifacts/prds/prd-try-not-to-be-poor-2026-10-19/prd.md`.
- Für Implementierung und Abnahmekriterien: lies `_bmad-output/planning-artifacts/epics.md`; dort stehen die später konkretisierten Zugangs-, Betrags- und Sparzielregeln.
- Für technische Änderungen: lies `_bmad-output/planning-artifacts/architecture/architecture-try-not-to-be-poor-2026-10-19/ARCHITECTURE-SPINE.md`.
- Für UI-Arbeit: lies `_bmad-output/planning-artifacts/ux-designs/ux-try-not-to-be-poor-2026-10-19/DESIGN.md` und die benachbarte `EXPERIENCE.md`; berücksichtige die Konkretisierungen in den Story-Abnahmen.
- Für den Arbeitsstand: lies `_bmad-output/implementation-artifacts/sprint-status.yaml` und die zugehörigen `spec-*.md` mit Abnahmen und Prüfnachweisen; die beiden Retrospektiven sind noch optional/offen.
- Für zurückgestellte Arbeiten: lies `_bmad-output/implementation-artifacts/deferred-work.md`; vor Produktionsbetrieb Anmeldedrosselung und begrenzte parallele Argon2-Prüfung anhand des Zielhosts und Lastprofils bewerten.
- Für lokalen Start, geschützte Konfiguration und Bedienung: lies `README.md`; `deploy/compose.local.yaml` startet ausschließlich die lokale Datenbank.

## Ausführen und Prüfen

- Voraussetzungen: Java 25 einschließlich `javac`, Node 24.22.0; Maven 3.10.0 lädt `backend/mvnw`. Vertragsprüfung und PostgreSQL-Testbinärdateien setzen Linux x86_64 voraus; weitere Werkzeuge stehen in `README.md`.
- Vertrag validieren, Kompatibilität prüfen und beide generierten Schnittstellen kompilieren: `./scripts/check-contract.sh`. `CONTRACT_BASE_REF=<commit>` setzt die Vergleichsbasis (Standard `HEAD`); ein fehlender Basisvertrag gilt als Erstvertrag. Der Check installiert auch die Frontend-Abhängigkeiten und baut die SPA.
- Linkgenerator prüfen: `python3 -m unittest discover -s scripts/tests -v`.
- Backend einschließlich echter temporärer PostgreSQL-18.6-Integrationstests: `./backend/mvnw -f backend/pom.xml verify` (kein Docker, unprivilegierter Benutzer).
- Statische SPA: `npm --prefix frontend ci && npm --prefix frontend run build`. `prebuild` und `prestart` generieren den API-Client automatisch.
- Browser: nach Installation der Frontend-Abhängigkeiten einmalig `npx --prefix frontend playwright install chromium`, danach `npm --prefix frontend run e2e`; Ports 8080/4200 freihalten. Playwright startet Test-API/PostgreSQL und HTTPS-Frontend selbst. Ein vorhandenes Chromium kann über `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` verwendet werden.
- `.github/workflows/ci.yml` führt bei Push und Pull Request separate Jobs für Linkgenerator, Vertrag, Backend und Browser aus. Inkompatible Vertragsänderungen in `/api/v1` blockieren den Vertragscheck.

## Abweichende Konventionen

- Module ändern nur eigene Daten; verwende für Änderungen an fremden Moduldaten deren öffentliche Anwendungsfunktionen. Das Frontend greift ausschließlich per HTTP auf die API zu.
- Leite `user_id` ausschließlich aus dem verifizierten JWT-`sub` ab. Verwende zusätzlich Abfragefilter und erzwungene PostgreSQL-RLS mit transaktionslokalem `app.user_id`; fehlender Kontext verweigert Zugriff. Die Laufzeitrolle darf RLS nicht umgehen.
- Halte Access-JWTs und Finanzdaten im Browser ausschließlich im Arbeitsspeicher; verwende für Refresh-Tokens das geschützte Cookie gemäß Authentifizierungsvertrag. Verwirf Finanzdaten bei Abmeldung, Tokenablauf und Kontowechsel.
- Verwende ganzzahlige EUR-Cent (`amountCents`) und exakte Arithmetik. Gespeicherte und berechnete Cent-Werte müssen innerhalb ±9007199254740991 bleiben; lehne überschreitende Mutationen ab.
- Setze das Erfassungsdatum serverseitig nach `Europe/Berlin`; verwende denselben Kalender für Monatsgrenzen. Behandle Kalenderdaten ohne Umrechnung in Zeitpunkte.
- Führe das Monatsbudget über Monatsgrenzen fort. Berechne den Rest ausschließlich aus eigenen Ausgaben des laufenden Monats; die Ausgabenliste umfasst dagegen alle Monate.
- Ausgaben und Sparziel-Zielbeträge sind positiv; Budget und Sparfortschritt dürfen null sein. Mehr als zwei Euro-Nachkommastellen werden abgelehnt. Beim Bearbeiten einer Ausgabe bleiben Eigentümer und Erfassungsdatum unverändert.
- Sparfortschritt ersetzt den Gesamtbetrag ohne Beitragsverlauf und darf den Zielbetrag überschreiten; nur der Balken endet bei 100 %. Zielbearbeitung erhält den Fortschritt, ein leeres Zieldatum entfernt das Datum. Sparziele beeinflussen das Restbudget nicht.
- Bestätige Mutationen erst nach Commit; erhalte Entwürfe bei Fehlern/offline nur im offenen Tab, verhindere Doppelsenden und verwerfe späte Antworten nach Sitzungsende/Kontowechsel. Löschen von Ausgaben und Sparzielen erfordert eine Bestätigung im UI.
- Generierte Dateien unter `frontend/src/app/api/` und `backend/target/` nicht manuell bearbeiten. Schemaänderungen erfolgen durch neue Flyway-Migrationen unter `backend/src/main/resources/db/migration/`.

<!-- /bmad:context -->
