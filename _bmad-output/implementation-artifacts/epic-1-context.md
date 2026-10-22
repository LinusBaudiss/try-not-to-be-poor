# Epic 1 Context: Ausgaben erfassen und Monatsbudget im Blick behalten

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Nutzer:innen können ein eigenes Konto anlegen, sich anmelden, persönliche Ausgaben verwalten und ohne Nebenrechnung ihr Restbudget erkennen. Die responsive Website priorisiert Smartphones. Dieses Epic macht den vollständigen Kernablauf von der Registrierung bis zur Monatsprüfung einschließlich Datentrennung und gemeinsamer technischer Grundlagen nutzbar.

## Stories

- Story 1.1: Eigenes Konto über den Registrierungslink anlegen
- Story 1.2: Anmelden, Sitzung verlängern und beenden
- Story 1.3: Fortlaufendes Monatsbudget festlegen und ändern
- Story 1.4: Ausgaben erfassen und die Historie ansehen
- Story 1.5: Restbudget des laufenden Monats prüfen
- Story 1.6: Eigene Ausgaben bearbeiten und löschen

## Requirements & Constraints

- Konten und Finanzdaten sind persönlich; Fehler dürfen fremde Konten oder Ressourcen nicht offenlegen. Gemeinsame Ansichten, Einnahmen, Bankimport, Kategorien und wiederkehrende Ausgaben gehören nicht zu v1.
- Registrierung mit E-Mail/Passwort steht allen Personen mit aktivem Link offen; keine Einladungsliste oder externer Identity-Anbieter. Linkersetzung erhält bestehende Konten. Passwörter nur adaptiv und gesalzen hashen, niemals im Klartext speichern/protokollieren.
- Ausgaben besitzen Name, positiven Betrag und automatischen, bei Bearbeitung unveränderten Erfassungstag. Die Historie umfasst alle Monate.
- Ein Monatsbudget gilt fortlaufend, darf null sein und wirkt bei Änderungen sofort im laufenden und in folgenden Monaten. Fehlendes Budget ist von gesetztem Nullbudget unterscheidbar. Restbudget = Budget minus eigene Ausgaben des laufenden Berlin-Kalendermonats; negative Ergebnisse bleiben mit ausdrücklichem Überschreitungshinweis sichtbar.
- Vor echten Nutzerdaten: Export, Löschung, Aufbewahrung, Kontowiederherstellung und Betrieb klären; verschlüsselte externe Backups und getestete Wiederherstellung voraussetzen. Erfolg bedeutet verständliche Übersicht bei tragbarem Erfassungsaufwand, keine zugesicherte Ersparnis.

## Technical Decisions

- `frontend/`: statische Angular-SPA ohne SSR, ausschließlich HTTP-Zugriff. `backend/`: Spring-Boot-Modularmonolith; `access` besitzt Konto-/Refresh-Daten, `expense-budget` Ausgaben/Budget, `savings-goals` Sparziele. Fremde Moduldaten nur über öffentliche Anwendungsfunktionen ändern.
- Stack: Angular 22.2.3, Node 24.22.0 LTS, Spring Boot 4.1.1, Java 25 LTS, Maven Wrapper 3.10.0, PostgreSQL 18.6. Kein Starter oder Persistenzframework vorgegeben.
- `api-contract/openapi.yaml`: maßgeblicher Vertrag für JSON, Fehler und `/api/v1`, OpenAPI 3.0.4. GitHub Actions validiert jeden PR mit Generator 7.26.0, erzeugt und kompiliert Angular-22-Client/Spring-Boot-4-Interfaces. oasdiff 1.30.0 blockiert inkompatible Änderungen gegen die Basis mit `--fail-on ERR`; diese benötigen `/api/v2`.
- Access-JWT: zehn Minuten, Signatur/Aussteller/Zielgruppe/Ablauf prüfen; Bearer-Token nur im Arbeitsspeicher. Refresh-Tokens serverseitig gehasht und im `HttpOnly`, `Secure`, `SameSite=Strict`-Cookie, rotierend, maximal 30 Tage inaktiv/90 Tage absolut. Wiederverwendung und Logout widerrufen die Familie; Access-Tokens laufen regulär ab. Refresh/Logout: Spring-Security-CSRF-Token im Header und exakte Origin-Prüfung.
- Finanzzeilen tragen `user_id` ausschließlich aus verifiziertem JWT-`sub`. Abfragefilter und erzwungene PostgreSQL-RLS sichern dieselbe Grenze; `app.user_id` wird transaktionslokal gesetzt, fehlender Kontext verweigert Zugriff. Laufzeitrolle: kein Tabellenbesitz, Superuser oder `BYPASSRLS`.
- Geld: ganzzahlige EUR-Cent (`amountCents`), ±9007199254740991; über zwei Nachkommastellen ablehnen. Exakt rechnen; Mutationen ablehnen, die gespeicherte oder berechnete Grenzen überschreiten. Kalenderdaten als `YYYY-MM-DD`/`DATE`; Erfassungstag/Monatsgrenzen nach `Europe/Berlin`.
- PostgreSQL ist maßgeblich; transaktionale Schreibzugriffe, versionierte Migrationen, keine automatische Produktionsschemaerzeugung. Finanzdaten ausschließlich im Browser-Arbeitsspeicher; bei Logout, Tokenablauf oder Kontowechsel verwerfen. Keine Offline-Synchronisierung.
- Deutscher VPS mit Compose/Caddy/API/PostgreSQL; nur Caddy öffentlich. `/api/v1` über Reverse-Proxy, lokal Frontend-Proxy. Produktionsgeheimnisse außerhalb versionierter Dateien.

## UX & Interaction Patterns

- Vorläufige Tokens, Systemschrift und Typografie aus `DESIGN.md`; deutsche sachliche Texte, Euroformat `1.234,56 €`. Zustände zusätzlich textlich vermitteln.
- Zugangszustände unterscheidbar; Budgetwerte klar beschriftet. Historie mobil linear, am Rechner semantische Tabelle; Aktionen per Tastatur/Touch ohne Hoverpflicht.
- Erfolg erst nach bestätigter Speicherung; Doppelsenden verhindern, Status zugänglich melden, Entwürfe bei Fehlern/offline erhalten. Offline Speichern blockieren. Persönliche Werte erst kontogebunden laden; Sitzungsende schließt die persönliche Ansicht.
- WCAG 2.2 AA als UX-Prüfziel: sichtbare Labels/Fokus, zugeordnete Fehler, Fehlerfokus, zugänglicher Löschdialog. Kernaufgaben bei 320 CSS-Pixeln ohne horizontales Scrollen und bei 200-%-Vergrößerung; Touchziele ≥44 Pixel, Geldfelder ≥48 Pixel, reduzierte Bewegung. Weitere Prüfanker: 390 × 844, 768 × 1024, 1280 × 800.

## Cross-Story Dependencies

Kontoanlage ermöglicht Anmeldung; Sitzung und Datentrennung bilden die Grundlage aller Finanzfunktionen. Die Restbudgetanzeige benötigt Budget und Ausgaben; Bearbeiten/Löschen aktualisiert dieselbe Berechnung. Epic 2 baut auf Konto, Datentrennung und den gemeinsamen API-, Geld- und UI-Konventionen dieses Epics auf.
