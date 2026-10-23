# Epic 2 Context: Sparziele anlegen und Fortschritt verfolgen

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Angemeldete Personen können eigene Sparziele anlegen, ansehen, bearbeiten und löschen sowie den manuell gepflegten Gesamtfortschritt zum Zielbetrag erkennen. Einzelne Sparbeiträge und deren Verlauf werden nicht erfasst. Die responsive Website priorisiert Smartphones und bleibt am Rechner bedienbar.

## Stories

- Story 2.1: Sparziel anlegen und eigene Ziele ansehen
- Story 2.2: Sparzielfortschritt aktualisieren und ansehen
- Story 2.3: Eigenes Sparziel bearbeiten und löschen

## Requirements & Constraints

- Ziele gehören ausschließlich einem Konto; gemeinsame Ansichten sind außerhalb v1. Fremde und fehlende Ressourcen dürfen weder fremde Daten noch deren Existenz offenlegen.
- Ein Ziel besitzt Namen, positiven Euro-Zielbetrag und optionales Zieldatum; Startfortschritt ist null. Zielbearbeitung erhält den Fortschrittsbetrag und berechnet dessen Verhältnis neu.
- Fortschrittsänderungen ersetzen den bisherigen Gesamtbetrag ohne Beitragsverlauf. Null und Übererfüllung sind zulässig: tatsächlichen Betrag, Prozentanteil und Überschreitung nennen; Balken bei 100 % begrenzen.
- EUR mit höchstens zwei Nachkommastellen; zusätzliche Stellen ablehnen statt runden. Gespeicherte und berechnete Centwerte bleiben innerhalb ±9007199254740991. Zielbetrag positiv, Fortschritt nicht negativ; überschreitende Mutationen ablehnen.
- Erfolg erst nach Serverbestätigung, Doppelsendungen verhindern. Bei Fehlern Eingaben erhalten. Offline Speichern blockieren und Entwurf im offenen Tab behalten; keine Offline-Synchronisierung.
- Persönliche Werte erst für das aktive Konto laden und anzeigen. Abmeldung, Sitzungsende und Kontowechsel verwerfen vorherige Finanzdaten und schließen die persönliche Ansicht.
- Echte Finanzdaten setzen geklärte Datenschutz-/Betriebsvorgaben, verschlüsselte externe Backups und getestete Wiederherstellung voraus.

## Technical Decisions

- Spring-Boot-Modul `savings-goals` besitzt Sparziele. Module ändern nur eigene Daten; fremde Moduldaten über öffentliche Anwendungsfunktionen. Die statische Angular-SPA kommuniziert ausschließlich per HTTP mit der API.
- `api-contract/openapi.yaml` definiert JSON und Fehler unter `/api/v1` mit OpenAPI 3.0.4. v1 bleibt rückwärtskompatibel. Vertragsprüfung validiert, generiert und kompiliert Angular-Client/Spring-Interfaces und prüft mit `oasdiff`; generierte Dateien nicht manuell ändern.
- `user_id` kommt ausschließlich aus verifiziertem JWT-`sub`. Abfragefilter und erzwungene PostgreSQL-RLS sichern jede Finanzzeile mit transaktionslokalem `app.user_id`; ohne Kontext kein Zugriff. Laufzeitrolle ist weder Besitzer noch Superuser und besitzt kein `BYPASSRLS`.
- PostgreSQL ist maßgeblich; Mutationen transaktional, Schemaänderungen über versionierte Migrationen. Geld als ganzzahlige Centwerte mit exakter Arithmetik; JSON, Java-Validierung und `BIGINT`-Constraints sichern Grenzen.
- Zieldatum unverändert als Kalenderdatum: `YYYY-MM-DD`, OpenAPI `format: date`, Java `LocalDate`, PostgreSQL `DATE`; keine Umrechnung in Zeitpunkte.
- Access-JWT und Finanzdaten ausschließlich im Browser-Arbeitsspeicher; kein `localStorage`/`sessionStorage`. Bestehende Authentifizierung liefert Bearer-Token und Sitzungsgrenzen.

## UX & Interaction Patterns

- Navigation „Monat“ und „Sparziele“, Startansicht „Monat“. Leere Zieleansicht mit „Sparziel anlegen“; beim Laden Platzhalter statt alter Werte.
- Sachliche deutsche Texte und Euroformat `1.234,56 €`. Konkrete Beträge neben dem Fortschrittsbalken; Farbe allein vermittelt keinen Status. Keine verifizierten Kontostände oder garantierte Ersparnis suggerieren.
- Vorläufige Tokens aus `DESIGN.md`: Hintergrund `#F7F8F6`, weiße Flächen, Primärfarbe `#155C4A`, Text `#18211E`, Sekundärtext `#46534D`, Rahmen `#68746D`, Fokus `#1B5C80`, Fehler `#842D2D`, Erfolgsfläche `#EAF4EF`. Systemschrift; Titel/Abschnitt/Text/Label/Betrag 28/20/16/14/24 px, Beträge mit tabellarischen Ziffern. Abstände 4/8/12/16/24/32 px; Seitenränder mobil/breit 16/24 px.
- Sichtbare Labels und Euro-Hinweis; Geldfelder mindestens 48 px hoch. Fehler programmatisch zuordnen, Fokus zum Fehler führen, Speicherstatus assistiv ankündigen. Beschriftete Aktionen per Tastatur und Touch.
- Löschbestätigung benennt Ziel und Folge, trennt Bestätigen/Abbrechen, hält Dialogfokus und gibt ihn zurück.
- WCAG 2.2 AA als Prüfziel: sichtbarer Fokus, logische Lesereihenfolge, Touch-Ziele mindestens 44 × 44 px. Unter 768 px einspaltig; bei 320 px kein horizontales Scrollen oder abgeschnittene Beträge. Prüfpunkte 320 × 568, 390 × 844, 768 × 1024 und 1280 × 800 mit Tastatur und 200-%-Vergrößerung; `prefers-reduced-motion` berücksichtigen.

## Cross-Story Dependencies

- Epic 1 liefert Authentifizierung, Sitzungsgrenzen, Persistenzschutz und Vertragswerkzeugkette.
- Story 2.1 schafft Anlage und eigene Zielliste für Fortschrittsänderungen in 2.2 sowie Bearbeiten/Löschen in 2.3.
- Fortschrittsdarstellung und Zielbearbeitung teilen Geld-/Datumssemantik; neuer Zielbetrag muss auch übererfüllten Fortschritt korrekt darstellen.
