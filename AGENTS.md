<!-- bmad:context -->
<!-- Verified 2026-10-22 against 2dfca34d1a7965e820510023453b42fbf48ace9b. Managed by bmad-project-context; edits inside this block are replaced on refresh. Keep anything you want preserved outside the markers. -->

## Try Not to Be Poor

Private Ausgabenübersicht mit fortlaufendem Monatsbudget und Sparzielen, vorrangig für Smartphones. Geplant sind eine statische Angular-SPA und eine Spring-Boot-API mit Maven und PostgreSQL. Produkt-, UX- und Architekturplanung liegen unter `_bmad-output/`; Anwendungscode ist noch nicht angelegt.

## Richtlinien

- Schütze Finanzdaten je Nutzerkonto; gemeinsame Ausgaben-, Budget- und Sparzielansichten gehören nicht zu v1.
- Halte Produktionsgeheimnisse außerhalb versionierter Dateien.
- Kläre vor echten Nutzerdaten die offenen Datenschutz- und Betriebsvorgaben aus Architektur und Epics; verschlüsselte Backups außerhalb des VPS und ein getesteter Wiederherstellungsweg sind Voraussetzung.

## Einstiegspunkte

- Für Produktumfang: lies `_bmad-output/planning-artifacts/prds/prd-try-not-to-be-poor-2026-10-19/prd.md`.
- Für Implementierung und Abnahmekriterien: lies `_bmad-output/planning-artifacts/epics.md`; dort stehen die später konkretisierten Zugangs-, Betrags- und Sparzielregeln.
- Für technische Änderungen: lies `_bmad-output/planning-artifacts/architecture/architecture-try-not-to-be-poor-2026-10-19/ARCHITECTURE-SPINE.md`.
- Für UI-Arbeit: lies `_bmad-output/planning-artifacts/ux-designs/ux-try-not-to-be-poor-2026-10-19/DESIGN.md` und die benachbarte `EXPERIENCE.md`; berücksichtige die Konkretisierungen in den Story-Abnahmen.
- Für den Arbeitsstand: lies `_bmad-output/implementation-artifacts/sprint-status.yaml`.

## Ausführen und Prüfen

- TODO nach dem Scaffold: Build- und Testbefehle für Angular/Node sowie Spring Boot/Java mit Maven Wrapper anhand der angelegten Projektdateien verifizieren.
- TODO beim Scaffold: die in Architektur AD-2 und den Epics vorgesehene OpenAPI-Vertragsprüfung einrichten; sie ist noch kein vorhandener CI-Check.

## Abweichende Konventionen

- Module ändern nur eigene Daten; verwende für Änderungen an fremden Moduldaten deren öffentliche Anwendungsfunktionen. Das Frontend greift ausschließlich per HTTP auf die API zu.
- Leite `user_id` ausschließlich aus dem verifizierten JWT-`sub` ab. Verwende zusätzlich Abfragefilter und erzwungene PostgreSQL-RLS mit transaktionslokalem `app.user_id`; fehlender Kontext verweigert Zugriff. Die Laufzeitrolle darf RLS nicht umgehen.
- Halte Access-JWTs und Finanzdaten im Browser ausschließlich im Arbeitsspeicher; verwende für Refresh-Tokens das geschützte Cookie gemäß Authentifizierungsvertrag. Verwirf Finanzdaten bei Abmeldung, Tokenablauf und Kontowechsel.
- Verwende ganzzahlige EUR-Cent (`amountCents`) und exakte Arithmetik. Gespeicherte und berechnete Cent-Werte müssen innerhalb ±9007199254740991 bleiben; lehne überschreitende Mutationen ab.
- Setze das Erfassungsdatum serverseitig nach `Europe/Berlin`; verwende denselben Kalender für Monatsgrenzen. Behandle Kalenderdaten ohne Umrechnung in Zeitpunkte.
- Führe das Monatsbudget über Monatsgrenzen fort. Berechne den Rest ausschließlich aus eigenen Ausgaben des laufenden Monats; die Ausgabenliste umfasst dagegen alle Monate.

<!-- /bmad:context -->
