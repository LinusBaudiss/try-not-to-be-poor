<!-- bmad:context -->
<!-- Verified 2026-10-26 against 16b8427234c21707315cd343d3355f5c9efd68fb (code, scripts and planning; no test rerun for this documentation update). Managed by bmad-project-context; edits inside this block are replaced on refresh. Keep anything you want preserved outside the markers. -->

## Try Not to Be Poor

Private Ausgabenübersicht mit fortlaufendem Monatsbudget und Sparzielen, vorrangig für Smartphones. Implementiert sind eine statische Angular-SPA unter `frontend/` und eine Spring-Boot-API mit Maven und PostgreSQL unter `backend/`. Der Kontozugang unterstützt v1 und v2; Oberfläche und Finanzrouten verwenden weiterhin v1, Ausgaben und Budget liegen noch gemeinsam in `expensebudget`. Planung und Umsetzungsnachweise liegen unter `_bmad-output/`; vollständiger v2-Modulschnitt und Monatsautomatik sind noch umzusetzen, Produktionsbetrieb und echte Nutzerdaten noch nicht freigegeben.

## Richtlinien

- Schütze Finanzdaten je Nutzerkonto; gemeinsame Ausgaben-, Budget- und Sparzielansichten gehören nicht zum Produktumfang.
- Halte Produktionsgeheimnisse außerhalb versionierter Dateien.
- Kläre vor echten Nutzerdaten Export, Löschung, Aufbewahrung und Kontowiederherstellung sowie die offenen Betriebsvorgaben aus Architektur und Epics; verschlüsselte Backups außerhalb des VPS und ein getesteter Wiederherstellungsweg sind Voraussetzung.

## Einstiegspunkte

- Für neue Anforderungen: lies `_bmad-output/specs/spec-try-not-to-be-poor/SPEC.md` und die benachbarte `brownfield.md`. Ausdrücklich ersetzte Regeln gehen historischen Abnahmen vor; unveränderte Abnahmen gelten weiter.
- Für Produktumfang: lies `_bmad-output/planning-artifacts/prds/prd-try-not-to-be-poor-2026-10-19/prd.md`.
- Für Implementierung und Abnahmekriterien: lies `_bmad-output/planning-artifacts/epics.md`; beachte die konkretisierten Zugangs-, Betrags-, Sparziel- und Übergangsregeln.
- Für technische Änderungen: lies `_bmad-output/planning-artifacts/architecture/architecture-try-not-to-be-poor-2026-10-19/ARCHITECTURE-SPINE.md`.
- Für UI-Arbeit: lies `_bmad-output/planning-artifacts/ux-designs/ux-try-not-to-be-poor-2026-10-19/DESIGN.md` und die benachbarte `EXPERIENCE.md`; berücksichtige die aktuellen Specs und Story-Abnahmen.
- Für Monatsautomatik, Vormerkungen und historische Korrekturen: lies `_bmad-output/specs/spec-oberflaeche-und-monatsueberschuss/monatsueberschuesse.md` sowie Architektur AD-7 bis AD-10.
- Für den Arbeitsstand: lies `_bmad-output/implementation-artifacts/sprint-status.yaml` und die zugehörigen `spec-*.md` mit Abnahmen und Prüfnachweisen; Retrospektiven sind weiterhin optional/offen.
- Für zurückgestellte Arbeiten: lies `_bmad-output/implementation-artifacts/deferred-work.md`; vor Produktionsbetrieb Anmeldedrosselung und begrenzte parallele Argon2-Prüfung anhand des Zielhosts und Lastprofils bewerten.
- Für lokalen Start, geschützte Konfiguration und Bedienung: lies `README.md`. `./start-local.sh` startet die gesamte lokale Anwendung unter `https://localhost:4200`; `deploy/compose.local.yaml` ausschließlich PostgreSQL. Strg+C beendet Backend und Frontend; die Datenbank läuft weiter.

## Ausführen und Prüfen

- Voraussetzungen: Java 25 einschließlich `javac`, Node 24.22.0 und `unzip` für das gepinnte Maven-ZIP; Maven 3.10.0 lädt `backend/mvnw`. Vertragsprüfung und PostgreSQL-Testbinärdateien setzen Linux x86_64 voraus; weitere Werkzeuge stehen in `README.md`.
- Beide OpenAPI-Verträge validieren, je Hauptversion auf Kompatibilität prüfen und alle generierten Java-/Angular-Schnittstellen kompilieren: `./scripts/check-contract.sh`. `CONTRACT_BASE_REF=<commit>` setzt die Vergleichsbasis (Standard `HEAD`); nur eine dort fehlende Version gilt als Erstvertrag. Der Check installiert auch die Frontend-Abhängigkeiten und baut die SPA.
- Linkgenerator und Vertragsprüfabläufe prüfen: `python3 -m unittest discover -s scripts/tests -v`.
- Backend einschließlich echter temporärer PostgreSQL-18.6-Integrationstests: `./backend/mvnw -f backend/pom.xml verify` (kein Docker, unprivilegierter Benutzer).
- Statische SPA: `npm --prefix frontend ci && npm --prefix frontend run build`. `prebuild` und `prestart` generieren die API-Clients automatisch.
- Browser: nach Installation der Frontend-Abhängigkeiten einmalig `npx --prefix frontend playwright install chromium`, danach `npm --prefix frontend run e2e`; Ports 8080/4200 freihalten. Playwright startet Test-API/PostgreSQL und HTTPS-Frontend selbst. Ein vorhandenes Chromium kann über `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` verwendet werden.
- `.github/workflows/ci.yml` führt bei Push und Pull Request separate Jobs für Python-Prüfungen, Vertrag, Backend und Browser aus. Inkompatible Vertragsänderungen an v1 und v2 blockieren den Vertragscheck.

## Abweichende Konventionen

- Module lesen und ändern nur eigene Daten; modulübergreifende Anwendungsfälle verwenden öffentliche Modulzugänge. Beim v2-Modulschnitt koordiniert die äußere Anwendungsschicht diese Zugänge in einer gemeinsamen Transaktion; Geschwisterimporte und Zugriffe auf fremde Tabellen oder Repositories sind ausgeschlossen. Das Frontend greift ausschließlich per HTTP auf die API zu.
- Leite bei HTTP `user_id` ausschließlich aus dem verifizierten JWT-`sub` ab. Der geplante Monatsjob verwendet den serverseitig gespeicherten und unter Kontosperre erneut geprüften Aktivierungskontext gemäß AD-4. Verwende pro Transaktion genau ein Konto mit Abfragefiltern und erzwungener PostgreSQL-RLS über transaktionslokales `app.user_id`; fehlender Kontext verweigert Zugriff. Laufzeit- und Jobrollen dürfen RLS nicht umgehen.
- Halte Access-JWTs und Finanzdaten im Browser ausschließlich im Arbeitsspeicher; verwende für Refresh-Tokens das geschützte Cookie gemäß Authentifizierungsvertrag. Verwirf Finanzdaten bei Abmeldung, Tokenablauf und Kontowechsel.
- Halte `api-contract/openapi.yaml` als v1-Vertrag eingefroren. Lege v2-Pfade, DTOs und Fehler vor ihren Verbrauchern in `api-contract/v2/openapi.yaml` fest; prüfe jede unterstützte Hauptversion gegen ihren eigenen Basisvertrag.
- Sperre Monatsautomatik und negative Fortschrittsschreibwerte serverseitig, solange v1 unterstützt wird. Gib sie erst nach Abschluss oder Abbruch aller laufenden v1-Vorgänge einschließlich Lesezugriffen und Datenbankarbeit gemäß AD-10 frei. Nach ersten signierten Fortschrittswerten oder Monatswirkungen ist ein Rückfall auf v1 ausgeschlossen.
- Verwende ganzzahlige EUR-Cent (`amountCents`) und exakte Arithmetik. Gespeicherte und berechnete Cent-Werte müssen innerhalb ±9007199254740991 bleiben; lehne überschreitende Mutationen ab.
- Setze das Erfassungsdatum serverseitig nach `Europe/Berlin`; verwende denselben Kalender für Monatsgrenzen. Behandle Kalenderdaten ohne Umrechnung in Zeitpunkte.
- Führe das Monatsbudget über Monatsgrenzen fort. Budgetänderungen betreffen laufende und folgende Monate; abgeschlossene Budgetstände bleiben erhalten. Berechne den Rest ausschließlich aus eigenen Ausgaben des laufenden Monats; die Ausgabenliste umfasst dagegen alle Monate.
- Ausgaben und Sparziel-Zielbeträge sind positiv; Budget und Sparfortschritt dürfen null sein. Mehr als zwei Euro-Nachkommastellen werden abgelehnt. Beim Bearbeiten einer Ausgabe bleiben Eigentümer und Erfassungsdatum unverändert.
- Manuelle Sparfortschrittseingabe ersetzt den Gesamtbetrag ohne Nutzer-Beitragsverlauf und darf den Zielbetrag überschreiten. Nach Freigabe signierter Werte bleiben tatsächlicher Betrag und Prozentwert auch unter null sichtbar; nur der Balken wird auf 0 bis 100 % begrenzt. Zielbearbeitung erhält den Fortschritt, ein leeres Zieldatum entfernt das Datum. Sparziele beeinflussen das Restbudget nicht.
- Bestätige Mutationen erst nach Commit; erhalte Entwürfe bei Fehlern/offline nur im offenen Tab, verhindere Doppelsenden und verwerfe späte Antworten nach Sitzungsende/Kontowechsel. Löschen von Ausgaben und Sparzielen erfordert eine Bestätigung im UI.
- Generierte Dateien unter `frontend/src/app/api/` und `backend/target/` nicht manuell bearbeiten. Schemaänderungen erfolgen durch neue Flyway-Migrationen unter `backend/src/main/resources/db/migration/`.

<!-- /bmad:context -->
