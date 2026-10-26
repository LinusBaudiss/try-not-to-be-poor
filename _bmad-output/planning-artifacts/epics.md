---
status: final
updated: 2026-10-26
stepsCompleted: [1, 2, 3, 4]
currentStep: 4
currentPhase: complete
finalValidationStatus: passed
workflowCompletionConfirmation: confirmed
completed: 2026-10-26
finalValidation:
  date: 2026-10-26
  scope: planning-readiness
  openChecks: 0
  checks:
    frCoverage: passed
    architectureAndEntityTiming: passed
    storyQuality: passed
    epicStructureAndFileChurn: passed
    dependencies: passed
    formattingAndHistory: passed
currentEpic: 4
storyPlanningCompletedEpics: [3, 4]
epicTransitionConfirmation: confirmed
epic3PlanningCounts:
  stories: 8
  acceptanceCriteria: 80
  functionalRequirements: 13
  assignedNonFunctionalRequirements: 11
  assignedArchitectureRequirements: 16
  assignedUxRequirements: 26
epic4PlanningCounts:
  stories: 8
  acceptanceCriteria: 92
  functionalRequirements: 11
  assignedNonFunctionalRequirements: 12
  assignedArchitectureRequirements: 21
  assignedUxRequirements: 27
  monthlyAcceptanceCases: 17
currentStory: null
lastApprovedStory: '4.8'
pendingStoryDocument: null
approvedNewStories: ['3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8', '4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7', '4.8']
sourceConfirmation: confirmed
requirementsConfirmation: confirmed
epicStructureConfirmation: confirmed
newEpicCount: 2
newStoryCount: 16
newAcceptanceCriteriaCount: 172
newEpicIds: [3, 4]
previousWorkflow:
  status: final
  stepsCompleted: [1, 2, 3, 4]
historicalEpics: [1, 2]
historicalStoryCount: 9
requirementCounts:
  functional: 17
  nonFunctional: 12
  architecture: 23
  ux: 30
  monthlyAcceptanceCases: 17
inputDocuments:
  - '_bmad-output/planning-artifacts/prds/prd-try-not-to-be-poor-2026-10-19/prd.md'
  - '_bmad-output/planning-artifacts/prds/prd-try-not-to-be-poor-2026-10-19/addendum.md'
  - '_bmad-output/planning-artifacts/architecture/architecture-try-not-to-be-poor-2026-10-19/ARCHITECTURE-SPINE.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-try-not-to-be-poor-2026-10-19/DESIGN.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-try-not-to-be-poor-2026-10-19/EXPERIENCE.md'
  - '_bmad-output/specs/spec-oberflaeche-und-monatsueberschuss/SPEC.md'
  - '_bmad-output/specs/spec-oberflaeche-und-monatsueberschuss/monatsueberschuesse.md'
  - '_bmad-output/specs/spec-oberflaeche-und-monatsueberschuss/brownfield.md'
historicalInputDocuments:
  - '_bmad-output/planning-artifacts/briefs/brief-try-not-to-be-poor-2026-10-18/brief.md'
  - '_bmad-output/planning-artifacts/briefs/brief-try-not-to-be-poor-2026-10-18/addendum.md'
  - '_bmad-output/planning-artifacts/prds/prd-try-not-to-be-poor-2026-10-19/prd.md'
  - '_bmad-output/planning-artifacts/prds/prd-try-not-to-be-poor-2026-10-19/reconcile-data-isolation-addendum.md'
  - '_bmad-output/planning-artifacts/prds/prd-try-not-to-be-poor-2026-10-19/reconcile-product-brief.md'
  - '_bmad-output/planning-artifacts/prds/prd-try-not-to-be-poor-2026-10-19/review-privacy-boundary.md'
  - '_bmad-output/planning-artifacts/prds/prd-try-not-to-be-poor-2026-10-19/review-rubric.md'
  - '_bmad-output/planning-artifacts/architecture/architecture-try-not-to-be-poor-2026-10-19/ARCHITECTURE-SPINE.md'
  - '_bmad-output/planning-artifacts/architecture/architecture-try-not-to-be-poor-2026-10-19/reviews/review-adversarial-seams.md'
  - '_bmad-output/planning-artifacts/architecture/architecture-try-not-to-be-poor-2026-10-19/reviews/review-rubric.md'
  - '_bmad-output/planning-artifacts/architecture/architecture-try-not-to-be-poor-2026-10-19/reviews/review-tech-reality.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-try-not-to-be-poor-2026-10-19/DESIGN.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-try-not-to-be-poor-2026-10-19/EXPERIENCE.md'
---

# Try Not to Be Poor – Epic-Aufschlüsselung

> **Planungsfortsetzung vom 25.10.2026:** Der [aktuelle Zielumfang mit extrahierten Anforderungen](#zielumfang-vom-25102026--anforderungsinventar) steht nach den bisherigen Stories. Die folgenden bisherigen Inventare, Epic-Listen und Abnahmen bis einschließlich Story 2.3 bleiben historische Nachweise. Unveränderte Regeln gelten fort; ausdrücklich abgelöste Regeln sind im aktuellen Zielumfang benannt. Der neue Umfang ist abschließend geplant; seine Implementierung ist noch nicht abgenommen oder umgesetzt.

## Überblick

Dieses Dokument zerlegt die Anforderungen aus PRD, UX-Design und Architektur in umsetzbare Epics und Stories.

## Anforderungsinventar

### Funktionale Anforderungen

- **FR-1 – Konto über Registrierungslink anlegen:** Jede Person mit dem Registrierungslink kann ein eigenes Nutzerkonto registrieren und sich anschließend anmelden.
- **FR-2 – Eigene Finanzdaten ansehen:** Angemeldete Personen können ihre eigenen Ausgaben, ihr Monatsbudget und ihre Sparziele ansehen.
- **FR-3 – Daten anderer Personen schützen:** Eine Person kann Ausgaben, Monatsbudgets oder Sparziele anderer Personen weder ansehen noch ändern. Gemeinsame Ansichten gehören nicht zu v1.
- **FR-4 – Ausgabe manuell erfassen:** Angemeldete Personen können eine oder mehrere eigene Ausgaben mit Name und Euro-Betrag erfassen. Das System ordnet sie dem Konto zu und setzt den Erfassungstag automatisch nach `Europe/Berlin`.
- **FR-5 – Alle Ausgaben tabellarisch ansehen:** Die eigene Übersicht zeigt Ausgaben aller Monate mit Name, Betrag und Erfassungsdatum und enthält keine Daten anderer Konten.
- **FR-6 – Eigene Ausgabe bearbeiten oder löschen:** Name und Betrag eigener Ausgaben lassen sich ändern; Ausgaben lassen sich löschen. Das Restbudget wird anhand der verbleibenden Ausgaben neu berechnet.
- **FR-7 – Monatsbudget festlegen:** Angemeldete Personen können ihr fortlaufendes Monatsbudget in Euro festlegen und ändern. Es gilt in Folgemonaten weiter. Eine Änderung gilt sofort im laufenden Monat.
- **FR-8 – Restbudget anzeigen:** `Restbudget = Monatsbudget − Summe der eigenen Ausgaben im laufenden Kalendermonat nach Europe/Berlin`. Einnahmen werden nicht erfasst oder angerechnet. Erfassung, Änderung und Löschung von Ausgaben aktualisieren den Wert.
- **FR-9 – Sparziel festlegen:** Angemeldete Personen können ein eigenes Sparziel mit Namen, Euro-Zielbetrag und optionalem Zieldatum anlegen.
- **FR-10 – Sparzielfortschritt aktualisieren und ansehen:** Angemeldete Personen können den erreichten Gesamtbetrag manuell aktualisieren und im Verhältnis zum Zielbetrag sehen. Eine Aktualisierung ersetzt den bisherigen Betrag; einzelne Beiträge oder ein Verlauf werden nicht gespeichert.
- **FR-11 – Website responsiv nutzen:** Die zentralen Ausgaben-, Monatsbudget- und Sparzielfunktionen sind auf Smartphone und Rechner bedienbar.

### Nichtfunktionale Anforderungen

- **NFR-1 – Vertraulichkeit persönlicher Daten:** Ausgaben, Budgets und Sparziele eines Kontos dürfen anderen Nutzerkonten nicht offengelegt werden.
- **NFR-2 – Nutzergebundene Zugriffskontrolle:** Zugriffe auf persönliche Daten berücksichtigen das angemeldete Konto; die konkrete technische Durchsetzung ist in der Architektur festgelegt.
- **NFR-3 – Nutzbarkeit auf verschiedenen Bildschirmgrößen:** Die Kernfunktionen müssen auf Smartphone und Rechner bedienbar sein.

Das PRD legt keine eigenständigen Performance- oder Verfügbarkeitsziele fest.

### Zusätzliche Anforderungen

- **Kein Starter-Template festgelegt:** Die Architektur wählt Frameworks und Betriebsform, nennt aber kein konkretes Starter-Repository oder -Template.
- **Getrennte Artefakte und Modulverantwortung:** `frontend/` ist eine statisch ausgelieferte Angular-SPA ohne SSR; `backend/` ist eine Spring-Boot-Anwendung als Modularmonolith mit `access`, `expense-budget` und `savings-goals`. Module ändern nur eigene Daten; modulübergreifende Änderungen laufen über öffentliche Anwendungsfunktionen. Das Frontend spricht ausschließlich HTTP mit der API.
- **Gemeinsamer API-Vertrag:** `api-contract/openapi.yaml` ist die maßgebliche Beschreibung für JSON-Anfragen, Antworten und Fehler unter `/api/v1` und verwendet OpenAPI 3.0.4. Die Architekturvorgabe 3.2.1 wird wegen fehlender Generator-Unterstützung durch die interoperable 3.0.4-Version ersetzt. GitHub Actions führt bei jedem Pull Request den `api-contract-check` aus: OpenAPI Generator CLI 7.26.0 validiert den Vertrag, erzeugt den Angular-22-Client (`typescript-angular`) und Spring-Boot-4-Interfaces (`spring`, `useSpringBoot4=true`, `interfaceOnly=true`), anschließend werden beide Implementierungen kompiliert. `oasdiff` 1.30.0 vergleicht den geänderten Vertrag mit der Basisversion und blockiert inkompatible Änderungen (`--fail-on ERR`); solche Änderungen gehören in `/api/v2`. Generator 7.26.0 dokumentiert stabile Unterstützung für OAS 3.0, Angular 9–22 und Spring Boot 4; OAS 3.1 ist dort noch Beta. ([OAS 3.0.4](https://spec.openapis.org/oas/v3.0.4.html), [Generator-Kompatibilität](https://github.com/OpenAPITools/openapi-generator), [Angular-Generator](https://openapi-generator.tech/docs/generators/typescript-angular/), [Spring-Generator](https://openapi-generator.tech/docs/generators/spring/), [oasdiff](https://github.com/oasdiff/oasdiff))
- **Authentifizierung und Sitzung:** Registrierung steht allen Personen mit dem geteilten Registrierungslink offen; E-Mail und Passwort, kein externer Identity-Anbieter. Der Link gilt 30 Tage und kann von Linus über eine geschützte Konfiguration ersetzt werden; der alte Link wird ungültig, bestehende Konten bleiben bestehen. Access-JWTs sind 10 Minuten gültig, werden nur im Arbeitsspeicher gehalten und als Bearer-Token gesendet. Refresh-Tokens liegen als `HttpOnly`, `Secure`, `SameSite=Strict`-Cookie vor und serverseitig nur gehasht. Sie verfallen nach 30 Tagen Inaktivität und spätestens 90 Tage nach Anmeldung; jede Erneuerung rotiert das Token. Wiederverwendung eines ersetzten Tokens widerruft die Token-Familie. Refresh und Logout nutzen Spring-Security-CSRF-Schutz mit Token im Anfrage-Header und genauer `Origin`-Prüfung. Logout widerruft die Refresh-Token-Familie; bereits ausgestellte Access-Tokens gelten bis zu ihrem Ablauf. v1 hat keine Access-Token-Sperrliste. Passwörter sind mindestens 15 und höchstens 64 Zeichen lang; zulässig sind Leerzeichen, druckbare ASCII- und Unicode-Zeichen, ohne zusätzliche Zeichenklassenregeln. Bekannte verbreitete oder kompromittierte Passwörter werden abgelehnt. Gespeichert wird ein adaptiver, gesalzener Hash.
- **Technische Datentrennung:** Jede nutzergebundene Finanzzeile trägt `user_id`; der Server leitet sie allein aus dem verifizierten JWT-`sub` ab. Abfragen filtern nach dieser ID; PostgreSQL-RLS erzwingt dieselbe Grenze. Vor Operationen setzt der Server `app.user_id` transaktionslokal. RLS ist erzwungen; die Laufzeitrolle ist weder Tabellenbesitzer noch Superuser und hat kein `BYPASSRLS`. Zugangsdaten und Refresh-Token-Metadaten verwaltet ausschließlich das Zugangsmodul. Fremde und nicht vorhandene Ressourcen dürfen ihre Existenz nicht offenlegen. Der Brief-Satz „getrennter Datenbestand“ verlangt keine getrennte physische Datenbank; die Architektur entscheidet sich für nutzergebundene Daten und RLS.
- **Geld- und Datumskonventionen:** Beträge sind ganzzahlige Euro-Cent (`amountCents`), niemals binäre Gleitkommazahlen; v1 nutzt nur EUR und höchstens zwei Nachkommastellen. Mehr als zwei Stellen werden abgelehnt, nicht stillschweigend gerundet. Ausgaben und Sparziel-Zielbeträge müssen positiv sein; Monatsbudget und Fortschritt dürfen null sein. Der Sparfortschritt darf den Zielbetrag überschreiten; die Anzeige nennt den realen Betrag und Überschreitung, während der Balken bei 100 % endet. Es gibt keine engere Produktobergrenze als den Bereich `-9007199254740991` bis `9007199254740991` Cent. JSON, Java-Validierung und PostgreSQL-`BIGINT` setzen die Grenzen durch. API-Summen und Restbudget verwenden exakte Arithmetik; Änderungen, die gespeicherte oder berechnete Werte außerhalb des Bereichs erzeugen, werden abgelehnt. Erfassungsdatum und Monatsgrenzen folgen `Europe/Berlin`; Daten werden als Kalenderdaten (`YYYY-MM-DD`/`DATE`) behandelt. Sparziel-Zieldaten bleiben unveränderte Kalenderdaten. Pro Konto gilt ein fortlaufendes Monatsbudget; Budgetänderungen gelten sofort im laufenden Monat und in Folgemonaten. Das Restbudget summiert nur Ausgaben des aktuellen Monats; ein negativer Betrag wird mit explizitem Hinweis auf die Budgetüberschreitung angezeigt. Sparzielfortschritt ersetzt den Gesamtbetrag ohne Beitragsverlauf. Bestehende Sparziele können hinsichtlich Name, Zielbetrag und Datum bearbeitet und mit Bestätigung gelöscht werden.
- **Persistenz und Frontend-Zustand:** PostgreSQL ist maßgebliche Datenquelle; Schreibvorgänge erfolgen transaktional. Schemaänderungen laufen über versionierte Migrationen; automatische Schemaerzeugung ist in Produktion ausgeschaltet. Finanzdaten bleiben im Frontend-Arbeitsspeicher; Offline-Synchronisierung ist nicht vorgesehen. Bei Abmeldung, Tokenablauf oder Kontowechsel wird der vorherige Finanzdaten-Arbeitsspeicher verworfen.
- **Produktionsform:** Selbstverwalteter VPS in Deutschland; Hetzner Cloud in Falkenstein oder Nürnberg ist die Zieloption. Docker Compose betreibt Caddy, Spring-API und PostgreSQL. Caddy ist der einzige öffentliche Einstieg, terminiert HTTPS, liefert das statische Angular-Build aus und leitet `/api/v1` intern weiter. API und Datenbank bleiben im privaten Compose-Netz. Lokale Entwicklung nutzt einen Frontend-Proxy für denselben API-Pfad. Produktionsgeheimnisse liegen außerhalb versionierter Dateien. Ein einzelner Host als gemeinsame Ausfall- und Wartungsdomäne ist für v1 akzeptiert.
- **Betrieb vor echten Nutzerdaten:** Verschlüsselte Backups außerhalb des VPS und ein getesteter Wiederherstellungsweg sind Voraussetzung. Vor Produktionsdaten sind außerdem VPS-Größe, Domain/DNS, Backup-Ziel/-Häufigkeit/-Aufbewahrung, Wiederherstellungsziele und Monitoring festzulegen.
- **Festgelegte Stack-Versionen laut Architektur (Stand 19.10.2026):** Angular 22.2.3; Node.js 24.22.0 LTS; Spring Boot 4.1.1; Java 25 LTS; Maven-Distribution über Maven Wrapper 3.10.0; PostgreSQL 18.6; OpenAPI 3.0.4 (kompatible Ersatzversion für die ursprüngliche Vorgabe 3.2.1); OpenAPI Generator 7.26.0; oasdiff 1.30.0; GitHub Actions für CI; Docker Engine 29.9.1; Docker Compose 5.6.0; Caddy 2.11.7.
- **Verbleibende offene Entscheidungen und Gates:** Export, Löschung, Aufbewahrung und Kontowiederherstellung vor dem Einsatz echter Finanzdaten klären. Vor Produktionsdaten VPS-Größe, Domain/DNS, Backup-Ziel, Häufigkeit/Aufbewahrung, Wiederherstellungsziele und Monitoring festlegen. Bankimport bleibt außerhalb v1 und wird frühestens bei Planung einer späteren Version neu bewertet.
- **Erfolgskriterien und Review-Befunde:** SM-1 prüft, ob bisherige Ausgaben und Restbudget ohne Nebenrechnung erkennbar sind; SM-2 prüft den Fortschritt eigener Sparziele. SM-C1 hält den Erfassungsaufwand als während der privaten Nutzung zu beobachtende Gegenmetrik fest. „Am Monatsende mehr übrig“ ist ein gewünschtes, nicht garantiertes Ergebnis ohne festgelegten Ausgangswert. Reviews fanden keine zusätzliche materielle Lücke bei Datentrennung oder Architektur. Ältere Review-Angaben zur zeitlichen Reichweite der Ausgabenliste und zum PRD-Entwurfsstatus sind durch das finale PRD überholt: Die Liste umfasst alle Monate samt Erfassungsdatum.

### UX-Design-Anforderungen

- **UX-DR1 – Design-Tokens:** Die vorläufigen Tokens aus `DESIGN.md` implementieren: unter anderem Hintergrund `#F7F8F6`, Fläche `#FFFFFF`, Primärfarbe `#155C4A`, Akzent `#805000`, Primärtext `#18211E`, Sekundärtext `#46534D`, Rahmen `#68746D`, Fokus `#1B5C80`, Fehler `#842D2D` und Erfolgsfläche `#EAF4EF`. Abstände: 4/8/12/16/24/32 px; Radien: 4/8/12 px und voll rund; Seitenabstände: mobil 16 px, breit 24 px. Diese visuellen Entscheidungen sind als Annahmen markiert.
- **UX-DR2 – Typografie und Kontrast:** Systemschrift ohne externe Schriftabhängigkeit; Titel 28 px, Abschnitt 20 px, Fließtext 16 px, Label 14 px, Betrag 24 px mit den in `DESIGN.md` festgelegten Zeilenhöhen und Gewichtungen. Eurobeträge verwenden tabellarische Ziffern. Kontrastpaare der Design-Spine erfüllen die dort angegebenen Werte; Status und Bedeutung werden zusätzlich mit Text ausgedrückt. Vorgaben sind UX-Annahmen.
- **UX-DR3 – Anmeldeformular:** Registrierung und Anmeldung visuell verwandt, aber eindeutig unterscheidbar gestalten. Fehlertexte dürfen nicht verraten, ob ein fremdes Konto existiert.
- **UX-DR4 – Primärbutton:** Beschriftete Hauptaktion des jeweiligen Bereichs; während des Speicherns Doppelsendungen verhindern und den Zustand anzeigen. Vorgeschlagene Zielhöhe: mindestens 44 CSS-Pixel, bei vergrößerter Schrift wachsend.
- **UX-DR5 – Geldfeld:** Sichtbares Label und Euro-Hinweis, feldnaher Fehlertext und vorgeschlagene Mindesthöhe von 48 CSS-Pixeln. Eingaben bleiben nach Fehlern erhalten. UX erfindet keine offenen Wertebereiche.
- **UX-DR6 – Budgetzusammenfassung:** Monatsbudget, Ausgaben und Restbudget klar benennen; einen Restbetrag als Zahl prominent, nicht nur als dekorativen Tachometer zeigen. Änderungen erst nach bestätigtem Speichern als wirksam darstellen.
- **UX-DR7 – Ausgabenliste:** Desktop als semantische Tabelle, mobil als linear lesbare, beschriftete Einträge; alle Monate mit Name, Betrag und Erfassungsdatum. Bearbeiten und Löschen besitzen beschriftete Aktionen, die nicht von Hover oder Gesten abhängen.
- **UX-DR8 – Sparziel-Fortschritt:** Fortschrittsbalken mit aktuellem Gesamtbetrag und Zielbetrag kombinieren. Farbe allein darf Fortschritt nicht vermitteln; Darstellung darf keine einzelnen Beiträge oder Historie suggerieren.
- **UX-DR9 – Speicherstatus:** Bearbeiten, Speichern und bestätigten Erfolg textlich unterscheiden. Erfolg erst nach bestätigter Speicherung zeigen; Statuswechsel für assistive Technik ankündigen.
- **UX-DR10 – Löschbestätigung:** Vorgeschlagener Dialog benennt klar die Löschfolge und trennt Bestätigen von Abbrechen. Fokus bleibt im Dialog und kehrt anschließend zum Auslöser zurück.
- **UX-DR11 – Informationsarchitektur:** Anmeldung und Registrierung als getrennte Zugangszustände; vorgeschlagene Hauptnavigation mit „Monat“ und „Sparziele“, Monatsübersicht als Startansicht. Nicht definierte Kontoverwaltung, Export oder Einstellungen nicht als fertige v1-Oberflächen annehmen. Navigationsdetails sind teilweise UX-Annahmen.
- **UX-DR12 – Sprache und Zahlenformat:** Vorgeschlagene deutsche Beschriftungen und Eurodarstellung `1.234,56 €`; kurze, sachliche, nicht wertende Texte mit Betrag, Zeitraum und Folge. Keine Finanzberatung, verifizierten Kontostände oder garantierten Sparerfolg behaupten. Diese Textentscheidungen sind UX-Annahmen.
- **UX-DR13 – Leere Ansichten:** Ohne Monatsbudget zur Festlegung auffordern statt `0 €` anzuzeigen; leere Ausgabenliste mit Aktion „Ausgabe erfassen“ und leerer Sparzielbereich mit Aktion „Sparziel anlegen“ versehen.
- **UX-DR14 – Laden und Eingabefehler:** Persönliche Werte erst anzeigen, wenn sie für das angemeldete Konto geladen sind; beim Laden erwartungsgemäße Platzhalter verwenden. Feldfehler verständlich und programmatisch dem Feld zuordnen, Fokus sinnvoll zur Zusammenfassung oder zum ersten Fehler führen und Eingaben erhalten.
- **UX-DR15 – Speicher- und Verbindungsfehler:** Bei fehlgeschlagenem Speichern keinen Erfolg anzeigen, offenen Entwurf erhalten, Ursache knapp erklären und erneuten Versuch anbieten. Offline keine Änderung als gespeichert ausgeben und keinen Offline-Sync versprechen; offenes Formular im Tab erhalten und Speichern bis zur Verbindung blockieren.
- **UX-DR16 – Sitzung und Zugriffsfehler:** Bei Sitzungsende persönliche Ansicht schließen und Anmeldung verlangen. Fehler zu ungültigem Registrierungslink oder unberechtigtem Zugriff neutral anzeigen, ohne Konten oder Datensätze offenzulegen. Beim Kontowechsel dürfen keine Daten des vorigen Kontos erscheinen.
- **UX-DR17 – Bedienung und Barrierefreiheit:** Als UX-Annahme gilt WCAG 2.2 AA als Prüfziel, keine Rechtszertifizierung. Semantische Überschriften, Formulare, Links, Buttons und Tabellen; vollständige Tastaturbedienung, sichtbarer nicht verdeckter Fokus, logische Lesereihenfolge, programmatische Labels und Fehlermeldungen. Statusmeldungen und dynamische Budgetwerte für assistive Technik erkennbar machen; Farbe nie als einziges Signal nutzen. 200-%-Vergrößerung, Kernaufgaben bei 320 CSS-Pixeln ohne horizontales Scrollen, vorgeschlagene Touch-Ziele mindestens 44 × 44 CSS-Pixel, keine abgeschnittenen Beträge/Aktionen und `prefers-reduced-motion` berücksichtigen.
- **UX-DR18 – Responsive Prüfpunkte:** Vorläufige Viewports samt Aufgaben: 320 × 568 für Anmeldung, Ausgabe, Restbudget sowie Erkennen und Bearbeiten eines Eintrags ohne horizontales Scrollen; 390 × 844 für Ausgabe hinzufügen/löschen, Ziel erstellen/Fortschritt ändern, Navigation und Bildschirmtastatur; 768 × 1024 für Monatsübersicht, vollständige Historie und Ziele ohne abgeschnittene Inhalte; 1280 × 800 für UJ-1, Zielaufgaben, Abstände, Tabelle und Tastaturfluss. Unter 768 px einspaltig und kompakte Navigation; ab 768 px darf Navigation nebeneinanderstehen. Alle Prüfungen schließen Tastaturbedienung und Vergrößerung ein. Diese Maße und Breakpoints sind UX-Annahmen.
- **UX-DR19 – Kernabläufe:** UJ-1 deckt Erstregistrierung oder spätere Anmeldung, Monatsübersicht, gegebenenfalls Budgetfestlegung, manuelle Ausgabe, Bestätigung, historische Liste und aktuelles Restbudget ab. Der abgeleitete Sparzielablauf deckt Anlegen mit optionalem Datum und spätere Aktualisierung des Gesamtfortschritts ab. Startfortschritt `0 €` ist eine UX-Annahme; im PRD nicht festgelegt.

### FR-Abdeckungsübersicht

- **FR-1:** Epic 1 — Konto über Registrierungslink anlegen.
- **FR-2:** Epic 1 und Epic 2 — eigene Ausgaben, Budget und Sparziele ansehen.
- **FR-3:** Epic 1 und Epic 2 — fremde Finanzdaten vor Einsicht und Änderung schützen.
- **FR-4:** Epic 1 — Ausgaben manuell erfassen.
- **FR-5:** Epic 1 — eigene Ausgaben aller Monate tabellarisch ansehen.
- **FR-6:** Epic 1 — eigene Ausgaben bearbeiten oder löschen.
- **FR-7:** Epic 1 — fortlaufendes Monatsbudget festlegen.
- **FR-8:** Epic 1 — Restbudget nach der festgelegten Monatsformel anzeigen.
- **FR-9:** Epic 2 — persönliches Sparziel anlegen.
- **FR-10:** Epic 2 — aktuellen Sparzielfortschritt aktualisieren und ansehen.
- **FR-11:** Epic 1 und Epic 2 — Kernfunktionen responsiv auf Smartphone und Rechner nutzen.

## Epic-Liste

### Epic 1: Ausgaben erfassen und Monatsbudget im Blick behalten

Nutzer:innen können ein Konto anlegen, sich anmelden, eigene Ausgaben erfassen und prüfen, wie viel vom laufenden Monatsbudget übrig ist. Die Ausgabenübersicht umfasst alle Monate; eigene Einträge lassen sich bearbeiten und löschen. Damit ist der vollständige Kernablauf UJ-1 nutzbar.

**FRs covered:** FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, FR-7, FR-8, FR-11

**Umsetzungshinweise:** Responsive Bedienung gilt für Anmeldung, Ausgabenliste und Budgetansicht. NFR-1 bis NFR-3 sowie die einschlägigen UX- und Architekturvorgaben gelten für dieses Epic. Konto, Datentrennung und gemeinsame Grundlagen werden hier nutzbar gemacht; kein separates technisches Epic wird vorgeschaltet.

### Epic 2: Sparziele anlegen und Fortschritt verfolgen

Nutzer:innen können eigene Sparziele mit Namen, Zielbetrag und optionalem Zieldatum anlegen, den aktuellen Gesamtfortschritt pflegen und ihn im Verhältnis zum Zielbetrag sehen. Einzelne Sparbeiträge oder deren Verlauf werden nicht erfasst.

**FRs covered:** FR-2, FR-3, FR-9, FR-10, FR-11

**Umsetzungshinweise:** Dieses Epic baut auf Konto und Datentrennung aus Epic 1 auf und vervollständigt den Sparzielbereich eigenständig. Responsive Bedienung und einschlägige UX-Vorgaben gelten auch für die Sparzielansichten. Zielbeträge müssen positiv, Fortschrittsbeträge dürfen null sein und den Zielbetrag überschreiten. Bestehende Sparziele lassen sich hinsichtlich Name, Zielbetrag und Datum bearbeiten und nach Bestätigung löschen.

## Epic 1: Ausgaben erfassen und Monatsbudget im Blick behalten

Nutzer:innen registrieren sich, melden sich an, verwalten ihre eigenen Ausgaben und sehen das Restbudget des laufenden Monats.

### Story 1.1: Eigenes Konto über den Registrierungslink anlegen

Als Person mit dem Registrierungslink  
möchte ich ein Konto mit E-Mail-Adresse und Passwort anlegen,  
damit ich einen eigenen Zugang für meine Finanzdaten habe.

**FRs:** FR-1

**Abnahmekriterien:**

**Angenommen** der Registrierungslink ist aktiv und die Angaben erfüllen die festgelegten Regeln  
**Wenn** ich die Registrierung absende  
**Dann** wird ein eigenes Konto im Zugangsmodul erstellt, und jede Person mit dem aktiven Link kann sich registrieren; eine Einladungsliste gibt es nicht.

**Angenommen** der Link ist älter als 30 Tage, abgelaufen oder widerrufen  
**Wenn** jemand damit eine Registrierung versucht  
**Dann** wird kein Konto angelegt und die Seite zeigt eine neutrale Meldung an. Linus kann den Link über eine geschützte Konfiguration ersetzen; dadurch werden bestehende Konten nicht ungültig.

**Angenommen** die Registrierung wird angenommen  
**Wenn** das Passwort gespeichert wird  
**Dann** speichert das System nur einen adaptiven, gesalzenen Hash und weder das Klartextpasswort noch dieses in Protokollen.

**Angenommen** ich lege ein Passwort fest  
**Wenn** das System es prüft  
**Dann** muss es mindestens 15 und höchstens 64 Zeichen lang sein; Leerzeichen, druckbare ASCII- und Unicode-Zeichen sind zulässig, zusätzliche Zeichenklassenregeln gibt es nicht, und bekannte verbreitete oder kompromittierte Passwörter werden abgelehnt. ([NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html))

**Angenommen** ein Registrierungsversuch scheitert  
**Wenn** die Seite einen Fehler anzeigt  
**Dann** verrät die Meldung nicht, ob für die eingegebene E-Mail-Adresse bereits ein Konto besteht.

**Angenommen** ich öffne die Registrierung auf einem Smartphone mit 320 × 568 CSS-Pixeln  
**Wenn** ich die Felder per Tastatur oder Touch bediene  
**Dann** sind Labels, Eingaben und Fehlermeldungen zugänglich, und die Registrierung erfordert kein horizontales Scrollen.

### Story 1.2: Anmelden, Sitzung verlängern und beenden

Als registrierte Person  
möchte ich mich sicher anmelden, meine Sitzung bei Bedarf verlängern und mich abmelden können,  
damit ich zuverlässig auf meine Finanzdaten zugreifen und den Zugang beenden kann.

**FRs:** FR-1

**Abnahmekriterien:**

**Angenommen** mein Konto ist registriert und ich gebe die richtigen Zugangsdaten ein  
**Wenn** ich mich anmelde  
**Dann** erhalte ich ein 10 Minuten gültiges Access-Token für Anfragen und ein Refresh-Token als `HttpOnly`, `Secure`, `SameSite=Strict`-Cookie. Das Access-Token bleibt im Arbeitsspeicher; das Refresh-Token wird serverseitig nur gehasht gespeichert.

**Angenommen** E-Mail-Adresse oder Passwort sind ungültig  
**Wenn** ich die Anmeldung absende  
**Dann** erscheint eine neutrale Fehlermeldung, die nicht verrät, ob ein Konto mit dieser E-Mail-Adresse besteht.

**Angenommen** meine Sitzung ist aktiv und das Access-Token muss erneuert werden  
**Wenn** die Anwendung die Erneuerung mit CSRF-Token im Anfrage-Header und der exakt erlaubten `Origin` anfragt  
**Dann** wird das Refresh-Token rotiert und ein neues Access-Token ausgegeben.

**Angenommen** das Refresh-Token ist seit 30 Tagen inaktiv oder seine Token-Familie hat das absolute Höchstalter von 90 Tagen erreicht  
**Wenn** eine Erneuerung versucht wird  
**Dann** wird sie abgelehnt und eine neue Anmeldung verlangt.

**Angenommen** ein bereits ersetztes Refresh-Token wird erneut verwendet  
**Wenn** der Server den Wiederverwendungsversuch erkennt  
**Dann** widerruft er die zugehörige Token-Familie und verlangt eine neue Anmeldung.

**Angenommen** ich bin angemeldet und melde mich ab  
**Wenn** die Abmeldung mit CSRF-Token im Anfrage-Header und der exakt erlaubten `Origin` erfolgt  
**Dann** wird die Refresh-Token-Familie widerrufen, das Cookie gelöscht und das Access-Token im Browser entfernt. Bereits ausgegebene Access-Tokens bleiben höchstens bis zu ihrem Ablauf gültig.

**Angenommen** meine Sitzung endet oder ich melde mich ab  
**Wenn** die Anwendung den Sitzungszustand beendet  
**Dann** verwirft sie die Finanzdaten im Arbeitsspeicher, schließt die persönliche Ansicht und verlangt eine erneute Anmeldung.

**Angenommen** ich öffne die Anmeldung auf einem Smartphone mit 320 × 568 CSS-Pixeln  
**Wenn** ich das Formular per Tastatur oder Touch bediene  
**Dann** sind Labels und Fehlermeldungen zugänglich, und die Anmeldung erfordert kein horizontales Scrollen.

**Angenommen** ich wechsle zwischen Anmeldung und Registrierung  
**Wenn** ich einen der beiden Zugangsbereiche öffne  
**Dann** sind sie visuell verwandt, aber durch Überschrift und Hauptaktion eindeutig unterscheidbar.

### Story 1.3: Fortlaufendes Monatsbudget festlegen und ändern

Als angemeldete Person  
möchte ich mein Monatsbudget festlegen und ändern können,  
damit ich einen klaren Betrag für den laufenden und die folgenden Monate habe.

**FRs:** FR-3, FR-7

**Abnahmekriterien:**

**Angenommen** für mein Konto wurde noch kein Monatsbudget festgelegt  
**Wenn** ich die Monatsübersicht öffne  
**Dann** fordert sie mich auf, ein Budget festzulegen, statt `0 €` als bereits gesetztes Budget anzuzeigen.

**Angenommen** ich lege ein Monatsbudget fest oder ändere es  
**Wenn** ich einen gültigen Eurobetrag speichere  
**Dann** wird er meinem Konto als ganzzahliger Centbetrag zugeordnet. Er darf null sein und höchstens `9.007.199.254.740.991` Cent betragen.

**Angenommen** ein anderes Konto besitzt ein eigenes Monatsbudget  
**Wenn** ich versuche, dieses Budget aufzurufen oder zu ändern  
**Dann** verwendet der Server ausschließlich die Identität meiner angemeldeten Sitzung und legt weder fremde Budgetwerte noch die Existenz des fremden Budgets offen.

**Angenommen** ich gebe einen Betrag mit mehr als zwei Nachkommastellen oder außerhalb des zulässigen Bereichs ein  
**Wenn** das Formular den Betrag prüft  
**Dann** wird er mit einem verständlichen Feldfehler abgelehnt und nicht stillschweigend gerundet.

**Angenommen** mein Budget wird gespeichert  
**Wenn** die Speicherung bestätigt ist  
**Dann** gilt der neue Betrag sofort im laufenden und in allen folgenden Monaten; bereits vergangene Monate werden dadurch nicht rückwirkend geändert.

**Angenommen** ich speichere ein Budget  
**Wenn** der Speichervorgang läuft oder fehlschlägt  
**Dann** wird die Hauptaktion während des Speicherns gegen Doppelsenden geschützt, der Erfolg erst nach Bestätigung angezeigt und mein Eingabewert bei einem Fehler zur Korrektur oder Wiederholung beibehalten. Ohne Verbindung wird keine Änderung als gespeichert angezeigt.

**Angenommen** ich bearbeite das Budget auf einem Smartphone mit 320 × 568 CSS-Pixeln  
**Wenn** ich das Formular per Tastatur oder Touch bediene  
**Dann** hat das Geldfeld ein sichtbares Label und einen Euro-Hinweis, der Fehler ist dem Feld zugeordnet, und das Formular erfordert kein horizontales Scrollen.

### Story 1.4: Ausgaben erfassen und die Historie ansehen

Als angemeldete Person  
möchte ich eigene Ausgaben mit Name und Betrag erfassen und alle meine Einträge ansehen können,  
damit ich meine Ausgaben im zeitlichen Verlauf nachvollziehen kann.

**FRs:** FR-2, FR-3, FR-4, FR-5, FR-11

**Abnahmekriterien:**

**Angenommen** ich bin angemeldet und erfasse eine Ausgabe mit Name und positivem Eurobetrag  
**Wenn** ich die Ausgabe speichere  
**Dann** ordnet das System sie meinem angemeldeten Konto zu und setzt das Erfassungsdatum automatisch auf das aktuelle Kalenderdatum in `Europe/Berlin`.

**Angenommen** ich gebe einen Betrag mit mehr als zwei Nachkommastellen, null oder einem Betrag über `9.007.199.254.740.991` Cent ein  
**Wenn** das Formular den Betrag prüft  
**Dann** wird die Eingabe mit einem verständlichen Feldfehler abgelehnt und nicht stillschweigend gerundet.

**Angenommen** meine Ausgabenhistorie ist geladen  
**Wenn** ich die Übersicht öffne  
**Dann** sehe ich meine Ausgaben aus allen Monaten jeweils mit Name, Betrag und Erfassungsdatum im deutschen Euro- und Datumsformat. Einträge anderer Konten sind nicht enthalten.

**Angenommen** mein Konto hat noch keine Ausgaben  
**Wenn** ich die Übersicht öffne  
**Dann** sehe ich einen leeren Zustand mit der Aktion „Ausgabe erfassen“.

**Angenommen** ich speichere eine Ausgabe  
**Wenn** die Speicherung bestätigt wird oder fehlschlägt  
**Dann** erscheint der Eintrag erst nach bestätigter Speicherung in der Historie; bei einem Fehler bleiben meine Eingaben erhalten und die Seite zeigt keinen Erfolg an. Ohne Verbindung wird keine Ausgabe als gespeichert angezeigt.

**Angenommen** meine Ausgabenhistorie wird geladen oder das angezeigte Konto wechselt  
**Wenn** die persönlichen Daten noch nicht geladen sind oder zum vorherigen Konto gehören  
**Dann** zeigt die Seite keine veralteten oder fremden Ausgaben an.

**Angenommen** ich nutze die Historie auf einem Smartphone mit 320 × 568 CSS-Pixeln oder am Rechner mit 1280 × 800 CSS-Pixeln  
**Wenn** ich die Übersicht bediene  
**Dann** werden Einträge mobil als beschriftete, linear lesbare Elemente und am Rechner als semantische Tabelle dargestellt; Name, Betrag und Datum bleiben ohne horizontales Scrollen zugänglich.

### Story 1.5: Restbudget des laufenden Monats prüfen

Als angemeldete Person  
möchte ich mein Monatsbudget, meine Ausgaben und mein Restbudget sehen,  
damit ich nachvollziehen kann, wie viel mir für den laufenden Monat verbleibt.

**FRs:** FR-2, FR-3, FR-8, FR-11

**Abnahmekriterien:**

**Angenommen** für mein Konto ist ein Monatsbudget festgelegt und meine Ausgaben sind geladen  
**Wenn** ich die Monatsübersicht öffne  
**Dann** zeigt sie das Monatsbudget, die Summe meiner Ausgaben im laufenden Kalendermonat und das Restbudget gut unterscheidbar an. Es gilt exakt: `Restbudget = Monatsbudget − Ausgaben des laufenden Monats nach Europe/Berlin`; vergangene und zukünftige Monate sowie Einnahmen werden nicht eingerechnet.

**Angenommen** im laufenden Monat sind noch keine Ausgaben erfasst  
**Wenn** ich die Monatsübersicht öffne  
**Dann** beträgt die Ausgabensumme `0 €` und das Restbudget entspricht dem festgelegten Monatsbudget.

**Angenommen** für mein Konto wurde noch kein Monatsbudget festgelegt  
**Wenn** ich die Monatsübersicht öffne  
**Dann** fordert sie mich zum Festlegen eines Budgets auf, statt ein Restbudget von `0 €` vorzutäuschen.

**Angenommen** meine Ausgaben übersteigen das Monatsbudget  
**Wenn** die Monatsübersicht das Restbudget berechnet  
**Dann** zeigt sie den tatsächlichen negativen Betrag und weist ausdrücklich auf die Budgetüberschreitung hin.

**Angenommen** ich ändere mein Monatsbudget oder erfasse eine Ausgabe und die Speicherung wird bestätigt  
**Wenn** ich danach die Monatsübersicht sehe  
**Dann** beruhen alle angezeigten Summen auf den bestätigten gespeicherten Werten und verwenden exakte Cent-Arithmetik ohne Rundung.

**Angenommen** ich öffne die Monatsübersicht auf einem Smartphone oder einem Rechner  
**Wenn** die Werte angezeigt werden  
**Dann** ist das Restbudget als klar beschrifteter Betrag prominent erkennbar, nicht nur durch Farbe oder einen dekorativen Balken; dynamische Änderungen sind für assistive Technik wahrnehmbar.

### Story 1.6: Eigene Ausgaben bearbeiten und löschen

Als angemeldete Person  
möchte ich meine eigenen Ausgaben bearbeiten oder löschen können,  
damit ich meine Übersicht korrigieren kann, wenn sich ein Eintrag ändert oder nicht mehr benötigt wird.

**FRs:** FR-3, FR-6, FR-8, FR-11

**Abnahmekriterien:**

**Angenommen** ich wähle eine eigene Ausgabe zum Bearbeiten aus  
**Wenn** ich Name oder Betrag ändere und speichere  
**Dann** werden die Änderungen erst nach bestätigter Speicherung angezeigt; das ursprüngliche Erfassungsdatum bleibt unverändert.

**Angenommen** ich gebe beim Bearbeiten einen Betrag mit mehr als zwei Nachkommastellen, null oder einem Betrag über `9.007.199.254.740.991` Cent ein  
**Wenn** das Formular den Betrag prüft  
**Dann** wird die Eingabe mit einem verständlichen Feldfehler abgelehnt und nicht stillschweigend gerundet.

**Angenommen** ich ändere eine Ausgabe  
**Wenn** die Änderung bestätigt ist  
**Dann** wird das Restbudget anhand der gespeicherten Ausgabe neu berechnet, sofern ihr Erfassungsdatum im laufenden Monat liegt.

**Angenommen** ich wähle eine eigene Ausgabe zum Löschen aus  
**Wenn** die Seite die Löschbestätigung öffnet  
**Dann** benennt der Dialog den betroffenen Eintrag und die Löschfolge klar, bietet getrennte Aktionen zum Bestätigen und Abbrechen und hält den Tastaturfokus im Dialog.

**Angenommen** der Löschdialog ist geöffnet  
**Wenn** ich abbreche oder das Löschen bestätige  
**Dann** bleibt der Eintrag beim Abbrechen unverändert; nach bestätigtem Löschen wird er aus der Liste entfernt, das Restbudget neu berechnet und der Fokus zum auslösenden Element zurückgeführt.

**Angenommen** ich bearbeite oder lösche eine Ausgabe, die nicht zu meinem Konto gehört oder nicht existiert  
**Wenn** ich die Aktion absende  
**Dann** gibt das System keine fremden Daten oder Informationen über die Existenz des Eintrags preis.

**Angenommen** eine Änderung oder Löschung schlägt fehl  
**Wenn** die Seite das Ergebnis anzeigt  
**Dann** zeigt sie keinen Erfolg an und erhält beim Bearbeiten meine Eingaben zur Korrektur oder Wiederholung.

**Angenommen** ich nutze die Aktionen auf Smartphone oder Rechner  
**Wenn** ich eine Ausgabe bearbeiten oder löschen möchte  
**Dann** sind die beschrifteten Aktionen per Tastatur und Touch erreichbar und nicht von Hover oder Gesten abhängig.

## Epic 2: Sparziele anlegen und Fortschritt verfolgen

Nutzer:innen können eigene Sparziele mit Namen, Zielbetrag und optionalem Zieldatum anlegen, den aktuellen Gesamtfortschritt pflegen und ihn im Verhältnis zum Zielbetrag sehen. Einzelne Sparbeiträge oder deren Verlauf werden nicht erfasst.

### Story 2.1: Sparziel anlegen und eigene Ziele ansehen

Als angemeldete Person  
möchte ich ein Sparziel mit Namen, Zielbetrag und optionalem Zieldatum anlegen und meine Ziele ansehen können,  
damit ich festhalten kann, worauf ich spare.

**FRs:** FR-2, FR-3, FR-9, FR-11

**Abnahmekriterien:**

**Angenommen** ich habe noch keine Sparziele  
**Wenn** ich den Bereich „Sparziele“ öffne  
**Dann** sehe ich die Aktion „Sparziel anlegen“ statt einer leeren oder irreführenden Fortschrittsanzeige.

**Angenommen** ich lege ein Sparziel mit Namen, positivem Zielbetrag und optionalem Zieldatum an  
**Wenn** ich es speichere  
**Dann** wird es meinem angemeldeten Konto zugeordnet, mit einem Startfortschritt von `0 €` angelegt und nach bestätigter Speicherung in meiner Zielliste angezeigt.

**Angenommen** ich gebe einen Zielbetrag mit mehr als zwei Nachkommastellen, null oder einem Betrag über `9.007.199.254.740.991` Cent ein  
**Wenn** das Formular den Betrag prüft  
**Dann** wird die Eingabe mit einem verständlichen Feldfehler abgelehnt und nicht stillschweigend gerundet.

**Angenommen** meine Sparziele sind geladen  
**Wenn** ich den Bereich öffne  
**Dann** sehe ich ausschließlich meine eigenen Ziele mit Name, Zielbetrag und gegebenenfalls Zieldatum. Der angezeigte Startfortschritt und Zielbetrag sind als konkrete Beträge erkennbar; das Zieldatum bleibt ein unverändertes Kalenderdatum.

**Angenommen** die Sparziele werden geladen oder das angezeigte Konto wechselt  
**Wenn** persönliche Daten noch nicht geladen sind oder zum vorherigen Konto gehören  
**Dann** zeigt die Seite keine veralteten oder fremden Sparziele an.

**Angenommen** ich speichere ein Sparziel und der Vorgang läuft oder schlägt fehl  
**Wenn** die Seite den Speicherstatus anzeigt  
**Dann** verhindert die Hauptaktion Doppelsendungen, Erfolg wird erst nach bestätigter Speicherung angezeigt, und bei einem Fehler bleiben meine Eingaben zur Korrektur oder Wiederholung erhalten. Ohne Verbindung wird das Ziel nicht als gespeichert angezeigt.

**Angenommen** ich bediene den Sparzielbereich auf einem Smartphone mit 320 × 568 CSS-Pixeln oder am Rechner mit 1280 × 800 CSS-Pixeln  
**Wenn** ich Ziele ansehe oder das Formular bediene  
**Dann** sind Labels, Aktionen und Beträge zugänglich, die Gestaltung verwendet die Tokens und Typografie aus `DESIGN.md`, und die Ansicht benötigt kein horizontales Scrollen.

**Angenommen** ich bin angemeldet und öffne die Anwendung  
**Wenn** ich zwischen den Hauptbereichen navigiere  
**Dann** öffnet sich „Monat“ als Startansicht, und die Hauptnavigation bietet klar beschriftete Bereiche „Monat“ und „Sparziele“.

**Angenommen** meine Sparziele werden geladen  
**Wenn** die persönlichen Werte noch nicht verfügbar sind  
**Dann** zeigt die Seite passende Ladeplatzhalter statt leerer oder veralteter Werte. Geldbeträge erscheinen im deutschen Euroformat `1.234,56 €`; Status- und Fehlertexte bleiben kurz, sachlich und nicht wertend.

**Angenommen** ich gebe beim Anlegen ein ungültiges Feld an oder die Speicherung schlägt fehl  
**Wenn** die Seite den Fehler anzeigt  
**Dann** führt sie den Fokus sinnvoll zur Fehlerzusammenfassung oder zum ersten fehlerhaften Feld und erhält meine Eingaben. Ist keine Verbindung vorhanden, ist Speichern blockiert; der Entwurf bleibt im Tab erhalten und kann nach Wiederherstellung der Verbindung erneut gespeichert werden.

### Story 2.2: Sparzielfortschritt aktualisieren und ansehen

Als angemeldete Person  
möchte ich den erreichten Gesamtbetrag für ein eigenes Sparziel aktualisieren und den Fortschritt sehen können,  
damit ich weiß, wie weit ich meinem Ziel bin.

**FRs:** FR-2, FR-3, FR-10, FR-11

**Abnahmekriterien:**

**Angenommen** ich wähle ein eigenes Sparziel aus  
**Wenn** ich einen gültigen Fortschrittsbetrag speichere  
**Dann** ersetzt dieser Betrag den zuvor gespeicherten Gesamtfortschritt; einzelne Beiträge oder ein Änderungsverlauf werden nicht angelegt.

**Angenommen** ich gebe einen negativen Fortschrittsbetrag, mehr als zwei Nachkommastellen oder einen Betrag über `9.007.199.254.740.991` Cent ein  
**Wenn** das Formular den Betrag prüft  
**Dann** wird die Eingabe mit einem verständlichen Feldfehler abgelehnt und nicht stillschweigend gerundet. Null ist zulässig.

**Angenommen** mein Fortschritt liegt zwischen null und dem Zielbetrag  
**Wenn** ich das Sparziel ansehe  
**Dann** werden aktueller Betrag, Zielbetrag, berechneter Prozentanteil und ein entsprechender Fortschrittsbalken angezeigt. Der Fortschritt ist zusätzlich textlich erkennbar und wird nicht allein durch Farbe vermittelt.

**Angenommen** mein Fortschritt übersteigt den Zielbetrag  
**Wenn** ich das Sparziel ansehe  
**Dann** zeigt die Seite den tatsächlichen Betrag und Prozentanteil sowie einen klaren Hinweis auf die Überschreitung; der Fortschrittsbalken endet bei 100 %.

**Angenommen** ich versuche den Fortschritt eines fremden oder nicht vorhandenen Sparziels zu ändern  
**Wenn** ich die Änderung absende  
**Dann** gibt das System keine fremden Daten oder Informationen über die Existenz des Ziels preis.

**Angenommen** ich speichere einen neuen Fortschrittsbetrag und der Vorgang läuft oder schlägt fehl  
**Wenn** die Seite den Speicherstatus anzeigt  
**Dann** verhindert die Hauptaktion Doppelsendungen, Erfolg wird erst nach bestätigter Speicherung angezeigt und bei einem Fehler bleibt mein Eingabewert zur Korrektur oder Wiederholung erhalten.

**Angenommen** ich bediene Sparziele auf einem Smartphone oder einem Rechner  
**Wenn** ich den Fortschritt aktualisiere oder ansehe  
**Dann** sind Formular, Prozentangabe und Fortschrittsbalken zugänglich; Beträge und Status bleiben auch ohne Farbe verständlich.

### Story 2.3: Eigenes Sparziel bearbeiten und löschen

Als angemeldete Person  
möchte ich Name, Zielbetrag und Zieldatum eines eigenen Sparziels bearbeiten oder es löschen können,  
damit ich meine Sparziele aktuell halten kann.

**FRs:** FR-2, FR-3, FR-9, FR-10, FR-11

**Abnahmekriterien:**

**Angenommen** ich bearbeite ein eigenes Sparziel  
**Wenn** ich Name, positiven Zielbetrag oder optionales Zieldatum ändere und speichere  
**Dann** bleiben der gespeicherte Fortschrittsbetrag und das Zieldatum als Kalenderdatum erhalten, sofern ich es nicht ändere. Der Fortschritt wird anhand des neuen Zielbetrags neu berechnet.

**Angenommen** ich gebe beim Bearbeiten einen Zielbetrag mit mehr als zwei Nachkommastellen, null oder einem Betrag über `9.007.199.254.740.991` Cent ein  
**Wenn** das Formular den Betrag prüft  
**Dann** wird er mit einem verständlichen, dem Feld zugeordneten Fehler abgelehnt und nicht stillschweigend gerundet. Das Geldfeld hat ein sichtbares Label, einen Euro-Hinweis und mindestens 48 CSS-Pixel Höhe.

**Angenommen** der gespeicherte Fortschritt übersteigt nach einer Änderung den Zielbetrag  
**Wenn** ich das Ziel ansehe  
**Dann** zeigt die Seite den tatsächlichen Betrag und Prozentanteil sowie den Hinweis auf die Überschreitung; der Fortschrittsbalken endet bei 100 %.

**Angenommen** ich wähle ein eigenes Sparziel zum Löschen aus  
**Wenn** die Seite die Löschbestätigung öffnet  
**Dann** benennt der Dialog das Ziel und die Löschfolge, bietet getrennte Aktionen zum Bestätigen und Abbrechen und hält den Tastaturfokus im Dialog.

**Angenommen** der Löschdialog ist geöffnet  
**Wenn** ich abbreche oder das Löschen bestätige  
**Dann** bleibt das Ziel beim Abbrechen unverändert; nach bestätigtem Löschen wird es entfernt und der Fokus zum auslösenden Element zurückgeführt. Ist es mein letztes Ziel, erscheint anschließend die leere Ansicht mit „Sparziel anlegen“.

**Angenommen** ich bearbeite oder lösche ein fremdes oder nicht vorhandenes Sparziel  
**Wenn** ich die Aktion absende  
**Dann** gibt das System keine fremden Daten oder Informationen über die Existenz des Ziels preis.

**Angenommen** eine Änderung oder Löschung schlägt fehl  
**Wenn** die Seite das Ergebnis anzeigt  
**Dann** zeigt sie keinen Erfolg an und erhält meine Eingaben bei einer Änderung zur Korrektur oder Wiederholung.

**Angenommen** ich nutze den Sparzielbereich an den Prüfpunkten 320 × 568, 390 × 844, 768 × 1024 oder 1280 × 800 CSS-Pixel  
**Wenn** ich Ziele bearbeite oder lösche, auch per Tastatur oder bei 200-%-Vergrößerung  
**Dann** bleiben Inhalte und Aktionen zugänglich, es entsteht bei 320 CSS-Pixeln kein horizontales Scrollen, Touch-Ziele sind mindestens 44 × 44 CSS-Pixel groß, der Fokus ist sichtbar und nicht verdeckt, und Bewegung berücksichtigt `prefers-reduced-motion`.

## Zielumfang vom 25.10.2026 — Anforderungsinventar

**Workflow-Stand:** Quellen, Anforderungen und Struktur der Epics 3–4 durch Linus bestätigt; Story-Ausarbeitung in Arbeit. Die historischen Epics 1–2 oberhalb dieses Abschnitts bleiben unverändert; ihre Fertigmeldungen belegen ausschließlich den bisherigen Umfang.

### Quellen und Rangfolge

Maßgeblich sind das finale [PRD](./prds/prd-try-not-to-be-poor-2026-10-19/prd.md) einschließlich [Addendum](./prds/prd-try-not-to-be-poor-2026-10-19/addendum.md), die [Architektur AD-1 bis AD-10](./architecture/architecture-try-not-to-be-poor-2026-10-19/ARCHITECTURE-SPINE.md), [DESIGN](./ux-designs/ux-try-not-to-be-poor-2026-10-19/DESIGN.md) und [EXPERIENCE](./ux-designs/ux-try-not-to-be-poor-2026-10-19/EXPERIENCE.md), jeweils aktualisiert am 25.10.2026, sowie die [Änderungsspezifikation](../specs/spec-oberflaeche-und-monatsueberschuss/SPEC.md) mit [Monatsfachregeln](../specs/spec-oberflaeche-und-monatsueberschuss/monatsueberschuesse.md) und [Bestandseinordnung](../specs/spec-oberflaeche-und-monatsueberschuss/brownfield.md). Die drei verlinkten UX-Mockups sind visuelle Referenzen; die beiden UX-Spines haben bei Konflikten Vorrang.

Die bisherigen FR-1 bis FR-11 behalten ihre Identität; ihre Beschreibungen unten entsprechen dem aktualisierten Zielumfang. FR-12 bis FR-17 ergänzen ihn. CAP-1 bis CAP-4 meinen hier ausschließlich den Namensraum `SPEC-oberflaeche-und-monatsueberschuss`.

Gezielt abgelöst werden Zweiernavigation, Ausgabenverwaltung unter Monat, ausschließlich manueller und nichtnegativer Fortschritt, der gemeinsame Ausgaben-/Budgetmodulschnitt und ein ausschließlich JWT-basierter Kontext für sämtliche Finanzoperationen. API v2 und ein begrenzter interner Jobkontext sind beschlossen. Unveränderte Bestandsregeln, insbesondere der Zugangsvertrag, Kontentrennung und die bisherigen Bedienungsabnahmen, gelten weiter. Historische Aussagen zur ursprünglichen OpenAPI-3.2.1-Vorgabe werden nicht wieder aufgenommen: Der Zielvertrag verwendet 3.0.4.

### Funktionale Anforderungen — aktueller Zielumfang

- **FR-1 — Eigenes Konto und Zugang nutzen:** Registrierung über einen aktiven geteilten Link mit E-Mail und Passwort; Link 30 Tage gültig und geschützt ersetzbar/sperrbar. Anmeldung, Erneuerung und Abmeldung erhalten den bestehenden Zugangsvertrag: Access 10 Minuten, Refresh höchstens 30 Tage Inaktivität beziehungsweise 90 Tage seit Anmeldung, Rotation und Widerruf der Familie bei Wiederverwendung. Fehler bleiben neutral. Alle angemeldeten Hauptbereiche bieten denselben lesbaren roten Abmeldebutton mit sichtbarem Fokus. Abmeldung widerruft die Refresh-Familie und verwirft persönlichen Browserzustand; ausgestellte Access-Tokens können bis zum Ablauf gültig bleiben.
- **FR-2 — Ausschließlich eigene Finanzdaten ansehen:** Ausgaben, gültige und historische Budgetstände, Ziele, tatsächliche Fortschritte und Vormerkungen gehören zum aktuellen Konto. Abmeldung, Ablauf und Kontowechsel verwerfen diese Werte; späte Antworten blenden sie nicht erneut ein.
- **FR-3 — Andere Konten schützen:** Kein Konto darf fremde Finanzdaten lesen oder ändern. Dies gilt auch für Zielwahl, historische Korrekturen und Hintergrundverarbeitung. Fremde und nicht vorhandene Ressourcen verraten keine fremden Inhalte oder deren Existenz; gemeinsame Finanzansichten sind ausgeschlossen.
- **FR-4 — Ausgabe manuell erfassen:** Eigene Ausgabe mit Name und positivem EUR-Betrag anlegen. Erst nach bestätigter Speicherung erscheint sie in der eigenen Historie. Eigentümer folgt dem verifizierten Konto; Erfassungsdatum ist der serverseitige Kalendertag nach `Europe/Berlin`, nicht frei wählbar.
- **FR-5 — Vollständige Ausgabenhistorie ansehen:** Unter Ausgaben sämtliche eigenen Einträge aller Monate mit Name, Betrag und Erfassungsdatum tabellarisch beziehungsweise mobil entsprechend beschriftet anzeigen. Monatswechsel und Monatsübersicht begrenzen die Historie nicht.
- **FR-6 — Eigene Ausgabe bearbeiten oder löschen:** Name und Betrag ändern, Eigentümer und Erfassungsdatum erhalten; Löschen verlangt eine verständliche Bestätigung. Historie nach Commit aktualisieren, nächste Monatsansicht konsistent neu laden. Historische Betragsänderung/Löschung umfasst atomar FR-16; reine Namensänderung hat keine Geldwirkung.
- **FR-7 — Fortlaufendes Monatsbudget setzen:** Budget ab null festlegen/ändern. Es gilt sofort im laufenden und in folgenden Monaten bis zur nächsten Änderung; abgeschlossene Budgetstände bleiben unverändert. Fehlendes Budget und ausdrücklich gesetztes null unterscheiden.
- **FR-8 — Exaktes Restbudget prüfen:** Monat zeigt gültiges Budget, eigene Ausgabensumme des laufenden Kalendermonats und deren exakte Differenz. Ohne Budget zur Festlegung auffordern statt einen Rest zu erfinden. Negative Differenz samt Überschreitungshinweis anzeigen. Einnahmen, Sparfortschritt und Monatsanrechnungen verändern die Formel nicht.
- **FR-9 — Eigenes Sparziel verwalten:** Mit Name, positivem EUR-Zielbetrag und optionalem Kalenderdatum anlegen; Startfortschritt null, keine automatische Auswahl für Monatsüberschüsse. Name/Zielbetrag/Datum bearbeiten, Fortschritt erhalten; leeres Datum entfernt es. Bestätigtes Löschen entfernt Ziel und Fortschritt, erhält offene Vormerkungen und verbrauchte historische Bindungen, auch für noch unverarbeitete abgeschlossene Monate mit damaliger Auswahl dieses Ziels. Keine Umleitung, neue Vormerkung oder Wiederanlage dieser Bindungen. Eine aktive Auswahl wird für den offenen Monat geleert. Kein erfolgreicher Nachhollauf oder vorheriges Erhöhen des entfallenden Fortschritts als Löschvoraussetzung. Dialog erklärt Fortschrittsverlust und bei ausgewähltem Ziel die künftige Vormerkung.
- **FR-10 — Tatsächlichen Gesamtfortschritt pflegen:** Manuelle Eingabe ersetzt den Gesamtbetrag und erhält Monatsnachweise. Fortschritt darf negativ oder über dem Zielbetrag sein; Betrag und Prozentwert zeigen den tatsächlichen Stand, ausschließlich der Balken bleibt bei 0–100 %. Bei −30 € von 100 €: −30 % und Balken 0 %; bei 150 €: 150 % und Balken 100 %. Manuelles Ersetzen bleibt bei grenzbedingt blockierter Nachholung möglich. Automatik arbeitet anschließend mit Differenzen am aktuellen Gesamtstand. Kein Nutzer-Beitragsverlauf. Der signierte manuelle Eingabebereich bleibt die ausdrücklich übernommene Quellenannahme.
- **FR-11 — Responsiv und zugänglich bedienen:** Alle Bestands- und Automatikfunktionen auf Smartphone und Rechner; WCAG 2.2 AA als Prüfziel. Tastatur, sichtbarer Fokus, programmatische Labels/Status, Kontraste und zusätzliche textliche Bedeutung. Prüfgrößen 320×568, 390×844, 768×1024 und 1280×800 CSS-Pixel, 200 % Text und Reflow bei 320 CSS-Pixeln. Aktionen mindestens 44 CSS-Pixel hoch, Touch-Ziele mindestens 44×44, Geldfelder mindestens 48 CSS-Pixel hoch.
- **FR-12 — Drei getrennte Hauptbereiche aufrufen:** Navigation in der Reihenfolge Monat, Ausgaben, Sparziele. Monat ist Startansicht mit Budgetverwaltung und Monatsübersicht ohne Ausgabenformular. Die gesamte Ausgabenverwaltung einschließlich Historie, Bearbeiten und Löschen zieht gemäß übernommener Quellenannahme nach Ausgaben; die nächste Monatsansicht nach bestätigter Mutation lädt aktuelle konsistente Werte.
- **FR-13 — Deutsche Texte ohne Zeitzonenerläuterung lesen:** Systemtexte einschließlich Labels, Tooltips, Fehler- und zugänglicher Hilfstexte ohne Erläuterungen wie „in Berlin“, „Kalender in Berlin“ oder „Europe/Berlin“. Deutsche EUR-/Datumsformate und interne Kalendersemantik bleiben erhalten. Nutzereigene Texte wie „Berlin-Fahrt“ unverändert lassen.
- **FR-14 — Monatsautomatik je Konto aktivieren:** Explizite Erstaktivierung auch ohne vorhandenes oder ausgewähltes Ziel. Der gesamte Erstaktivierungsmonat ist nach seinem Ende der früheste Herkunftsmonat; frühere Monate bleiben ausgeschlossen, spätere Zielwahl verschiebt den Start nicht. Mit damaligem Budget gilt `max(0, Budget − eigene Monatsausgaben)`; ohne Budget kein Betrag. Negativer Monatsrest erzeugt keine neue Belastung, historische Korrektur kann frühere Anrechnung zurücknehmen. Sparanrechnung ist keine Ausgabe. Deaktivierung ist nicht spezifiziert.
- **FR-15 — Überschuss vollständig zuordnen oder vormerken:** Genau ein eigenes ausgewähltes Ziel erhält den gesamten Überschuss; maßgeblich ist die Auswahl zum Ende des Herkunftsmonats, auch bei verspätetem Abschluss. Ohne gültige Auswahl je Monat vormerken, nicht zufällig auswählen. Vormerkungssumme und fehlende Auswahl sichtbar machen. Vor Auswahl/Wechsel fällige Monate nach ihren historischen Regeln nachholen, anschließend sämtliche offenen Nachweise mit Budget einschließlich Nullüberschüssen vollständig und einmalig dem gewählten Ziel zuordnen. Auswahl, Fortschritt und Übernahme werden gemeinsam wirksam; bei Fehler nichts teilweise übernehmen. Bereits zugeordnete Monate bleiben beim ursprünglichen Ziel; Wechsel betrifft den offenen und folgende Monate. Fehlendes Budget ist kein offener Nullnachweis; gelöschte Ziele bleiben nach FR-9 verbraucht.
- **FR-16 — Historische Überschüsse um Differenzen korrigieren:** Betragsänderung/Löschung einer Ausgabe eines abgeschlossenen Monats ab Aktivierung berechnet dessen Überschuss in derselben Transaktion neu; fehlenden Monatsnachweis nach historischen Budget-/Zielregeln anlegen. Vor Zuordnung nur die Monatsvormerkung ändern. Nach Zuordnung ausschließlich `neuer Überschuss − zuletzt berücksichtigter Überschuss` auf den aktuellen Gesamtfortschritt des ursprünglichen noch vorhandenen Ziels anwenden. Bei manuell 300 € und Korrektur −50 € bleiben 250 €; 20 € minus 50 € ergibt −30 €, spätere 100 € ergeben 70 €. Gelöschte Bindung erzeugt keine neue Geldwirkung. Keine Rekonstruktion über manuelle Änderungen, keine separate Schuld und kein Abschneiden bei null. Ungültige/grenzüberschreitende Korrektur verwirft den gesamten Vorgang einschließlich Ausgabenmutation.
- **FR-17 — Ohne Sitzung nachholen und einmalig verarbeiten:** Abgeschlossene Monate nach Start, Ausfall und Neustart ohne offene Oberfläche/Sitzung chronologisch ab Aktivierung nachholen. Je Herkunftsmonat höchstens einmal den jeweils gültigen Stand wirksam machen. Wiederholung, Konkurrenz und manuelle Änderungen erzeugen weder doppelte Anrechnung noch verlorene bestätigte Änderungen. Fortschritt und Nachweise gemeinsam committen; bei Fehler bleiben wirksame Zuordnungen und Vormerkungen erhalten. Fehler eines Kontos blockieren andere Konten nicht.

### Nichtfunktionale Anforderungen — aktueller Zielumfang

Das aktualisierte PRD nummeriert seine Qualitätsanforderungen nicht separat. NFR-1 bis NFR-3 behalten die bisherige Bedeutung und werden auf den Zielumfang angewendet; NFR-4 bis NFR-12 sind aus PRD §8, §9 und den querschnittlichen Folgen der FRs extrahiert. Es werden keine neuen Produktentscheidungen eingeführt.

- **NFR-1 — Vertraulichkeit:** Keine Offenlegung fremder Ausgaben, Budgets, Ziele, Monatsnachweise, Vormerkungen oder Zugangsinformationen; auch keine Existenzbestätigung fremder Ressourcen. Quelle: FR-2/FR-3.
- **NFR-2 — Kontogebundene Autorisierung:** Verifizierte Webidentität und begrenzter serverseitiger Jobkontext schützen dieselben Kontogrenzen; kein Finanzzugriff ohne gültigen Kontext. Quelle: FR-3, PRD-Addendum, AD-4.
- **NFR-3 — Zugängliche responsive Nutzung:** WCAG 2.2 AA als Prüfziel, vier festgelegte Viewports, Tastatur/Screenreader, sichtbarer Fokus, 200-%-Text und 320-Pixel-Reflow; alle Automatikzustände, rote Abmeldung und signierte Werte eingeschlossen. Quelle: FR-11.
- **NFR-4 — Exakte und begrenzte Geldwerte:** Ganze EUR-Cent, gespeicherte und fachlich berechnete Ergebnisse innerhalb ±9.007.199.254.740.991; exakte Zwischenrechnung, höchstens zwei Euro-Nachkommastellen. Keine stille Rundung, Kürzung oder Teilübernahme. Quelle: §8.1.
- **NFR-5 — Einheitlicher Kalender:** Erfassungsdatum und Monatsgrenzen nach `Europe/Berlin` einschließlich Zeitumstellungen und unabhängig von der Gerätezeitzone; Kalenderdaten ohne Umrechnung in Zeitpunkte. Quelle: §8.1.
- **NFR-6 — Flüchtiger persönlicher Browserzustand:** Finanzdaten und Access-Tokens ausschließlich im Arbeitsspeicher; Entwürfe nur im offenen Tab. Abmeldung, Ablauf und Kontowechsel verwerfen Daten/Entwürfe und entkräften späte Antworten. Keine Offline-Synchronisation. Quelle: §8.2, FR-2.
- **NFR-7 — Atomare Bestätigung:** Zusammengehörige Ausgaben-, Fortschritts-, Auswahl- und Nachweisänderungen vollständig committen oder verwerfen; Erfolg erst nach äußerem Commit. Doppelsenden verhindern. Quelle: §8.2, FR-6/FR-15 bis FR-17.
- **NFR-8 — Wiederholungs- und Konkurrenzfestigkeit:** Neustarts, wiederholte Abschlüsse und parallele Web-/Jobzugriffe verlieren oder vervielfachen keine Wirkung. Nachholen bleibt ohne Sitzung möglich, fehlerhafte Konten halten andere nicht auf. Quelle: FR-17.
- **NFR-9 — Datensparsame Beobachtbarkeit:** Rückstand, letzte erfolgreiche Monatsverarbeitung und technische Fehler erkennen, ohne Beträge, Finanztexte oder Zugangsnachweise zu protokollieren. Quelle: §8.3.
- **NFR-10 — Bestandserhalt und kontrollierter Versionswechsel:** IDs, Eigentümer, Kalenderdaten, Budgetstände und manuelle Fortschritte erhalten; keine erfundenen Monatswirkungen vor Aktivierung. V1 vollständig stilllegen und laufende Zugriffe beenden/abbrechen, bevor negative Werte oder Automatik freigegeben werden. Nach ersten entsprechenden Datenwirkungen keine Rückkehr zu v1 und kein Zurückschneiden von Finanzdaten. Quelle: §8.4.
- **NFR-11 — Verständliche Fehler und ungewisser Ausgang:** Sicheren Fehlschlag von noch unbestätigter Speicherung unterscheiden. Entwürfe bei Fehler/offline im offenen Tab erhalten, keinen Erfolg vorwegnehmen; vor Wiederholung bei ungewissem Ausgang aktuellen Stand ermitteln. Quelle: §8.2 und EXPERIENCE State Patterns.
- **NFR-12 — Geschützter Betrieb vor echten Daten:** Produktionsgeheimnisse außerhalb versionierter Dateien. Vor echten Nutzerdaten externe verschlüsselte Backups und getestete Wiederherstellung sowie Klärung von Export, Löschung, Aufbewahrung und Kontowiederherstellung; weitere Betriebsentscheidungen vor Produktion. Quelle: §8.3/§9.

Das PRD legt keine zusätzliche Antwortzeit, Verfügbarkeit, feste Joblaufzeit oder Sparerfolgsgarantie fest.

### Zusätzliche Anforderungen aus Architektur und Übergang

- **AR-1 — Bestand statt Starter:** Kein neues Starter-Template; die bestehende statische Angular-SPA und das einzelne Spring-Boot-Java-Artefakt werden weiterentwickelt. Keine Framework-Aktualisierung aus diesem Umfang ableiten. Quelle: Architektur Design Paradigm/Stack.
- **AR-2 — Fünf isolierte Datenbesitzer:** `access`, `expenses`, `budget`, `savingsgoals`, `monthlysurplus` besitzen eigene Daten und Zugänge. Ausgaben und Budget getrennte modulseigene Schemas/Datenzugriffe; Automatik besitzt Aktivierung, Auswahlhistorie, Nachweise und Vormerkungen. Quelle: AD-1/AD-10.
- **AR-3 — Äußere Anwendungskoordination:** HTTP- und Jobadapter rufen äußere Anwendungsfälle auf; diese koordinieren schmale öffentliche Modulbefehle/Projektionen. Keine Geschwisterimporte, fremden Repositories, internen Typen oder modulübergreifenden SQL-Abfragen. Gemeinsame Infrastruktur enthält technische Geld-/Kalender-/Kontext-/Transaktionsfunktionen, keine fachlichen Finanzdaten. Quelle: AD-1.
- **AR-4 — Eigener vollständiger v2-Vertrag:** `/api/v2` einschließlich Registrierung/Anmeldung/Refresh/Logout. `api-contract/openapi.yaml` bleibt eingefrorenes v1, `api-contract/v2/openapi.yaml` beschreibt v2 in OpenAPI 3.0.4. Vor Verbraucherimplementierung Pfade, DTOs, Fehler, Nullable-Semantik und Grenzen festlegen. Je unterstützter Hauptversion separat validieren, gegen ihre eigene Basis auf Kompatibilität prüfen, in getrennte Java-/TypeScript-Namensräume generieren und kompilieren; v2 erstmals als Erstvertrag behandeln, kein v1-v2-Kompatibilitätsvergleich. OpenAPI Generator 7.26.0 und oasdiff 1.30.0; inkompatible Revisionen einer unterstützten Hauptversion blockieren CI. Quelle: AD-2.
- **AR-5 — Bestehenden Zugang unverändert tragen:** Signatur, Aussteller, Zielgruppe, Ablauf und JWT-`sub` prüfen; Access 10 Minuten nur im Speicher. Refresh rotiert, serverseitig gehasht, Cookie `HttpOnly`, `Secure`, `SameSite=Strict`; 30 Tage Inaktivität/90 Tage seit Anmeldung, Wiederverwendung widerruft Familie. Refresh/Logout behalten CSRF-Header und genaue Origin-Prüfung. Keine neue Access-Sperrliste. Link 30 Tage und geschützt ersetzbar/sperrbar; adaptive gesalzene Passwort-Hashes. Unveränderte Bestandsabnahme: Passwörter 15–64 Zeichen, Leerzeichen/druckbare ASCII-/Unicode-Zeichen erlaubt, keine zusätzlichen Zeichenklassenregeln, verbreitete/kompromittierte Passwörter ablehnen. Quelle: AD-3 und historische Stories 1.1/1.2.
- **AR-6 — Webkontext unter erzwungener RLS:** Finanzzeilen tragen `user_id`; HTTP-Konto ausschließlich aus verifiziertem JWT-`sub`. Abfragefilter plus erzwungene PostgreSQL-RLS, genau ein transaktionslokales `app.user_id`; fehlender Kontext verweigert Finanzzugriff. `tnbp_runtime` verwendet ausschließlich Webrechte und keine globale Jobermittlung. Quelle: AD-4.
- **AR-7 — Separater begrenzter Jobkontext:** `tnbp_monthly_worker` verwendet explizit eigene Verbindungs-/Transaktionsbindung im selben Prozess. Konto aus gespeicherter Aktivierung, nach Kontosperre erneut prüfen; kein simulierter JWT und kein öffentlicher Jobendpunkt. Nur nötige Budget-/Ausgabespalten und Zielidentität/Fortschritt lesen, am Ziel ausschließlich `progress_cents` ändern, Monatsnachweise/Fälligkeit bearbeiten. Kein Zugriff auf Passwort-/Sitzungsdaten, keine Anlage/Löschung von Ausgaben/Zielen und keine nutzergesteuerte Zielwahl. Web-/Jobrollen weder Besitzer noch Superuser, kein `BYPASSRLS` oder Wechsel in Besitzer-/Migrationsrollen. Quelle: AD-4.
- **AR-8 — Begrenzte kontoübergreifende Ermittlung:** Ausschließlich `monthlysurplus` stellt eine nur der Jobrolle zugängliche Discovery-Funktion bereit; begrenzte Pakete aus Konto-ID/technischer Fälligkeit, keine Finanzwerte. `SECURITY DEFINER` mit gesonderter `NOLOGIN`-Eigentümerrolle ohne Tabellenbesitz/`BYPASSRLS`, expliziter RLS-Lesepolicy nur auf benötigten aktivierten Automatikzeilen, festem sicherem `search_path`, qualifizierten Namen und entzogenen `PUBLIC`-Ausführungsrechten. Quelle: AD-4.
- **AR-9 — Gemeinsame physische Transaktion:** Äußere Koordination eröffnet und bindet Web-/Jobkontext vor Modulzugriff. Alle beteiligten Module teilen dieselbe physische Verbindung/Transaktion; keine inneren Commits, Kontextwechsel oder andere Rollenverbindung. Fehler einschließlich Geldgrenzen rollen den gesamten Anwendungsfall zurück, Erfolg erst nach äußerem Commit. Quelle: AD-7.
- **AR-10 — Einheitliche Sperre, Zeit und Lesesicht:** Jede Finanzmutation erwirbt vor zustandsabhängigem Lesen dieselbe transaktionsgebundene Kontosperre, auch für leere Konten; PostgreSQL-Advisory-Schlüssel aus kanonischer Konto-UUID mit Hash-Seed 14 für Web und Job. Unter READ COMMITTED nach Sperrerwerb Zustand/Aktivierung und genau einen fachlichen Zeitpunkt/Monat bestimmen und an alle Module weiterreichen; Datum/Wirksamkeitsmonat nicht erneut bestimmen. Reine zusammengesetzte Ansichten verwenden einen Zeitpunkt vor Teilabfragen und dieselbe read-only REPEATABLE-READ-Verbindung für konsistente Monats-/Automatikdaten. Quelle: AD-7.
- **AR-11 — Geld, Kalender und historische Budgets:** Exakte EUR-Cent samt Summen, Rest, Vormerkung und Fortschritt gegen sichere Grenzen vor Commit/Ausgabe prüfen. Ausgaben/Zielbetrag positiv, Budget/Monatssummen/Überschuss/Vormerkung nichtnegativ, Fortschritt/Rest signiert. Kalender `Europe/Berlin`, unverändertes Erfassungsdatum, reine Zieldaten. Fortlaufende monatswirksame Budgets erhalten abgeschlossene Stände; Restbudget ausschließlich gültiges Budget minus laufende eigene Ausgaben. Quelle: AD-5.
- **AR-12 — Dauerhafte monatliche Herkunft:** Unveränderlicher Erstaktivierungsmonat, monatswirksame Auswahlhistorie und Datenbank-Eindeutigkeit je Konto/Herkunftsmonat. Basis über öffentliche Budget-/Ausgabenprojektionen. Zustände ohne Budget, vorgemerkt, zugeordnet und durch Ziellöschung verbraucht unterscheiden; zuletzt berücksichtigten Überschuss bewahren. Nullüberschüsse mit Budget bewahren historische Auswahl beziehungsweise bleiben ohne Auswahl offen. Ohne Budget kein offener Nullnachweis. Quelle: AD-8.
- **AR-13 — Auswahl mit vollständiger Übernahme:** Vor Zielauswahl/-wechsel fällige Monate unter der Kontosperre nach historischen Regeln nachholen, dann alle offenen Nachweise mit Budget einschließlich Nullbeträgen genau einmal binden und Fortschritt atomar erhöhen. Kein Ziel automatisch auswählen, auch nicht bei Anlage. Quelle: AD-8.
- **AR-14 — Ziellöschung ohne Nachholzwang:** Ziel/Fortschritt entfernen und in derselben Kontotransaktion bestehende sowie noch unbearbeitete abgeschlossene Bindungen dieses Ziels verbrauchen. Löschmarker plus erhaltene Auswahlhistorie ist eine zulässige Repräsentation im Automatikmodul. Entfallenden Fortschritt nicht vorher erhöhen; andere Ziele bleiben nachholbar. Auswahl des offenen Monats gegebenenfalls leeren, unzugeordnete Vormerkungen erhalten. Historische Zielreferenzen weder durch Cascade löschen noch auf null setzen; keine Wiederverteilung. Quelle: AD-8.
- **AR-15 — Korrektur am aktuellen Fortschritt:** Historische Betragsmutation/Löschung mit Monatskorrektur atomar koordinieren; Erstnachweis bei Bedarf anhand historischer Regeln. Nur Überschussdifferenz auf den gesperrten aktuellen Stand des ursprünglichen vorhandenen Ziels anwenden; gelöschte Bindungen ohne neue Wirkung. Manuelle Gesamteingabe erhält Nachweise, braucht keinen erfolgreichen grenzbedingt blockierten Nachhollauf und wird nie durch Rekonstruktion oder veraltete Gesamtsumme ersetzt. Reine Namensänderung ohne Geldwirkung. Quelle: AD-9.
- **AR-16 — Nachholbarer fairer Hintergrundlauf:** Nach erfolgreichem Start und regelmäßig gespeicherte Fälligkeiten prüfen; begrenzte Pakete, eigene Transaktion/Kontosperre je Konto, chronologische Monate. Dauerhafte Nachweise und Transaktionen sichern Einmalwirkung statt Uhrzeittrigger oder ausschließlich lokaler Prozesssperre. Verzögerte Wiederholung und faire Kontowahl; nach Rollback ausschließlich technische Fehler-/Wiederholungsmetadaten separat speichern. Rückstand, letzten Erfolg und technische Fehlerkategorien ohne sensible Protokollinhalte erfassen. Batchgrößen/Abstände bleiben Implementierungsdetails. Quelle: AD-9.
- **AR-17 — Additive Migration mit Bestandserhalt:** Neue Flyway-Dateien, bestehende Migrationen unverändert. Konten/IDs, Eigentümer, Ausgabedaten, Budgetstände und manuelle Fortschritte erhalten; manuelle Bestände nicht als automatische Anrechnungen rekonstruieren und keine Wirkungen vor Aktivierung erzeugen. Quelle: AD-10.
- **AR-18 — Wiederholbare Rollenbereitstellung:** Zusätzliche Rollen/Rechte auch auf bereits initialisierten Datenbankvolumes administrativ wiederholbar bereitstellen; Erstanlageskript allein genügt nicht. Migrator ohne `CREATEROLE`; Web-/Jobrollen bleiben unprivilegiert, Geheimnisse außerhalb versionierter Dateien. Quelle: AD-4/AD-10.
- **AR-19 — Vollständiger v2-Wechsel mit Freigabebarriere:** Zuerst Vertrag, Module, Migrationen, Rollen und Generatoren; während v1-Unterstützung serverseitig weder Automatik noch negative manuelle Fortschritte, alle v1-Antworten kompatibel. V2-Zugang samt Security/CSRF/Origin, `no-store`, Proxy, Interceptor und vollständiger Oberfläche prüfen; vorübergehende v1-Adapter verwenden dieselbe neue Koordination/Sperre. Dann neue v1-Zugriffe abweisen und alle zugelassenen v1-Anwendungsfälle einschließlich GETs und ihrer Datenbankarbeit abschließen/abbrechen. Kein zuvor zugelassener v1-Read darf erst nach Freigabe signierte Finanzwerte laden. Alte Oberflächen erhalten einen Aktualisierungspfad. Erst danach signierten Fortschritt/aktivierbare Automatik freigeben; tatsächlicher Start je Konto bleibt die explizite Erstaktivierung. Quelle: AD-10.
- **AR-20 — Geprüfter Rücknahmeweg:** Vor Funktionsfreigabe nur auf einen gegen migriertes Schema und Rollen geprüften v1-kompatiblen Release zurücknehmen. Nach ersten signierten Werten oder Monatswirkungen kein Rückfall auf v1, sondern v2-kompatible Korrektur oder geprüfte Wiederherstellung. Keine Datenkürzung/-überschreibung für einen Code-Rollback. Quelle: AD-10.
- **AR-21 — Gemeinsame Betriebsgrenze und Pins:** Deutscher VPS, Hetzner als Zieloption; Compose mit Caddy, einem Java-Artefakt einschließlich Job und PostgreSQL. Caddy allein öffentlich, statische SPA und freigegebene API-Versionen; API/Datenbank privat, getrennte lokale/Testkonfiguration und Frontend-Proxy. Repositorypins laut Architektur: Angular 22.2.3, Node 24.22.0, Spring Boot 4.1.1, Java 25, Maven 3.10.0, PostgreSQL 18.6, OpenAPI 3.0.4, Generator 7.26.0, oasdiff 1.30.0. Docker 29.9.1, Compose 5.6.0 und Caddy 2.11.7 sind historische Produktionsseeds und vor Rollout erneut zu prüfen; hier kein Versionsupgrade. Quelle: AD-6/Stack.
- **AR-22 — Ausführbare Nachweise für die Grenzen:** Architekturprüfungen zu Modulabhängigkeiten und Schemaeigentum; echte PostgreSQL-Prüfungen zu Rollen/Policies, fehlendem/fremdem Kontext, wiederverwendeten Verbindungen, gemeinsamem Rollback, Web-/Jobkonkurrenz und Monatsnachweisen. Vertrags-/Kompilierchecks je unterstützter Version; Browserprüfungen für vollständigen v2-Übergang, drei Bereiche, signierte Werte, Entwürfe und Sitzungsgrenzen. Die 17 Monatsabnahmefälle plus AD-8/AD-9-Präzisierungen sind zuzuordnen. Quelle: Consistency Conventions, AD-4/AD-10.
- **AR-23 — Offene Betriebs- und Datenlebenszyklusbedingungen erhalten:** Linus klärt vor echten Nutzerdaten Export, Kontolöschung, Aufbewahrung einschließlich Monatsnachweisen, Kontowiederherstellung und nötige E-Mail-Bestätigung. Vor Produktion VPS-Auslegung, Domain/DNS, feste Images, externe verschlüsselte Backups mit Zeitplan/Aufbewahrung, getestete Wiederherstellungsziele, Monitoring und Bewertung von Anmeldedrosselung/parallelen Argon2-Prüfungen anhand Zielhost/Lastprofil. Diese offenen Entscheidungen sind keine implizite Produktionsfreigabe und werden hier nicht erfunden. Projektkontext bei Umsetzung nachführen. Quelle: PRD §9, Architektur Deferred, bestehende Projektvorgaben.

### UX-Design-Anforderungen — aktueller Zielumfang

UX-DR1 bis UX-DR19 behalten ihre bisherigen Themen, werden aber durch die aktuellen Spines präzisiert. UX-DR20 bis UX-DR30 ergänzen konkrete Bausteine und Zustände. Exakte visuelle Ausprägung, Tokens, Mikrocopy, Automatikabschnitt innerhalb Sparziele, 768-Pixel-Breakpoint und entbehrliche Bewegung sind weiterhin UX-Annahmen; sie ändern keine bestätigte Fachregel. Alle 16 benannten Komponenten aus DESIGN/EXPERIENCE sind einzeln erfasst.

- **UX-DR1 — Design-Tokens:** Bestehende helle Palette mit Hintergrund `#F7F8F6`, Fläche `#FFFFFF`, Primär `#155C4A`, Akzent `#805000`, Primärtext `#18211E`, Sekundärtext `#46534D`, Rahmen `#68746D`, Fokus `#1B5C80`, Fehler/Abmelden `#842D2D`, Text auf Aktionsflächen `#FFFFFF` und Erfolgsfläche `#EAF4EF`. Abstände 4/8/12/16/24/32 px, Seitenränder 16/24 px, Radien 4/8/12 px und vollrunder Fortschrittsbalken. Tokens als vorläufige visuelle Annahmen verwenden.
- **UX-DR2 — Schrift und Kontrast:** Systemschrift ohne externe Fonts; Titel 28 px/1,2/650, Abschnitte 20 px/1,3/600, Text 16 px/1,5/400, Labels 14 px/1,4/550, Betrag 24 px/1,2/650. Tabellarische Ziffern; Minuszeichen, Prozentwerte und lange Beträge vollständig lesbar. Text mindestens 4,5:1, Kontrollgrenzen/Fokus mindestens 3:1; Bedeutungen nie nur durch Farbe. Fokus mit Abstand zur roten/grünen Fläche gegen helle Umgebung erkennbar halten.
- **UX-DR3 — `auth-form`:** Registrierung und Anmeldung durch Titel/Aktion unterscheiden, gültigen Linkvertrag erhalten, Zugangsfehler neutral halten. Erneute Anmeldung beginnt mit frischem Kontozustand; geschützte Direktlinks führen ohne Sitzung über den Zugang.
- **UX-DR4 — `primary-button`:** Explizit beschriftete Speicher-/Aktivierungsaktionen; während des zugehörigen Vorgangs Doppelsenden sperren und textlich „Wird gespeichert …“ melden, Erfolg erst nach Commit. Mindestens 44 CSS-Pixel hoch und bei größerer Schrift wachsend.
- **UX-DR5 — `money-field`:** Sichtbares Label, EUR-Hinweis, feldnaher programmatisch zugeordneter Fehler, mindestens 48 CSS-Pixel hoch. Exakte Centwerte, höchstens zwei Euro-Nachkommastellen ohne Rundung. Ausgabe/Zielbetrag positiv, Budget ab null; Fortschritt signiert gemäß Quellenannahme. Mobile Tastatur/Eingabe muss ein Minus ermöglichen; andere Geldfelder erhalten keine negative Semantik. Fehler erhält den Entwurf im offenen Tab.
- **UX-DR6 — `budget-summary`:** Monat nennt Budget, laufende Ausgabensumme und prominent das tatsächliche Restbudget. Fehlendes Budget zur Festlegung führen, null als gültiges Budget unterscheiden; negativen Rest mit Betrag/Überschreitungstext zeigen. Budgetwechsel erst nach Bestätigung als wirksam ausgeben und keine Veränderung abgeschlossener Stände suggerieren.
- **UX-DR7 — `expense-table`:** Im Bereich Ausgaben semantische Desktop-Tabelle für Name, Erfassungsdatum und Betrag aller Monate; mobil dieselben beschrifteten Werte linear lesbar. Keine Kürzung der Historie beim Monatswechsel; Datum nicht editierbar.
- **UX-DR8 — Sparziel-Fortschritt als zusammenhängende Anzeige:** Tatsächlicher Gesamtbetrag, positiver Zielbetrag, tatsächlicher Prozentwert und begrenzter Balken bilden eine verständliche Einheit. Keine einzelnen Beiträge, getrennten manuellen/automatischen Unterkonten oder Korrekturschulden suggerieren; Details der drei Bausteine in UX-DR25 bis UX-DR27.
- **UX-DR9 — `save-status`:** Speichern, bestätigten Erfolg und Fehler textlich unterscheiden und assistiv ankündigen. Zusammengehörige Werte gemeinsam aktualisieren. Bei unbekanntem Ausgang weder Erfolg noch sicheren Rollback behaupten; UX-DR28 beachten.
- **UX-DR10 — `delete-confirmation`:** Objekt und Folgen benennen, Löschen und Abbrechen trennen, Fokus einschließen, Escape/Abbrechen ohne Änderung. Zieltext erklärt Verlust von Ziel/Fortschritt, keine Übertragung früherer Anrechnungen und bei ausgewähltem Ziel künftige Vormerkung; offene Vormerkungen bleiben erhalten. Kein Nachhollauf als Löschvoraussetzung. Nach Ende Fokus zum Auslöser; wenn entfernt, zum nächsten sinnvollen Eintrag beziehungsweise zur Anlegeaktion. Keine verschachtelte Dialogkette.
- **UX-DR11 — `main-navigation`:** Drei ausgeschriebene Bereiche in der Reihenfolge Monat, Ausgaben, Sparziele. Monat ist Startansicht mit Budget/Übersicht ohne Ausgabenformular; gesamte Ausgabenverwaltung im eigenen Bereich gemäß Quellenannahme. Aktueller Bereich sichtbar und programmatisch markiert. Touch/Tastatur wechseln tatsächlich Inhalt; neue Hauptüberschrift fokussieren beziehungsweise ankündigen. Kein vierter Automatik-Hauptbereich.
- **UX-DR12 — Deutsche Sprache und Formate:** Sachliche, nicht wertende Systemtexte, deutsche EUR-/Datumsdarstellung wie `1.234,56 €` und `25.10.2026`. Keine systemseitige Zeitzonenerläuterung in sichtbaren oder zugänglichen Texten; nutzereigene Namen wie „Berlin-Fahrt“ erhalten. Keine Banküberweisung, verifizierten Kontostände, garantierte Ersparnis oder genaue Abschlussuhrzeit behaupten.
- **UX-DR13 — Leere Ansichten:** Kein Budget: Festlegung anbieten statt erfundenem Rest. Keine Ausgaben: Erfassung sichtbar erreichbar. Keine Ziele: Zielanlage anbieten; Automatikaktivierung bleibt auch dann möglich. Fehlende Auswahl und bestehende Vormerkung nicht verstecken und aktive Automatik ohne Ziel nicht als pausiert/deaktiviert ausgeben.
- **UX-DR14 — Laden und Feldfehler:** Noch nicht geladene Werte kenntlich machen statt erfundener Nullen; nur Daten des aktuellen Kontos einsetzen. Verständlicher Feldfehler mit nächstem Schritt, programmatischer Zuordnung und sinnvollem Fokus zum ersten Fehler/zur Zusammenfassung; Entwurf erhalten. Inhaltsskelett ist eine UX-Annahme.
- **UX-DR15 — Verbindungs- und Speicherfehler:** Keine Teilbestätigung oder Erfolg bei sicherem Fehlschlag. Entwurf ausschließlich im offenen Tab erhalten, erneuten Versuch nach sicherem Fehler ermöglichen. Offline keine Synchronisation versprechen; Speichern bis Wiederverbindung blockieren. Bei ungewissem Ausgang UX-DR28 anwenden.
- **UX-DR16 — Sitzung, Kontowechsel und Zugriffsfehler:** Sämtliche Finanzdaten, Auswahl, Vormerkungen und Entwürfe bei Abmeldung/Ablauf/Kontowechsel verwerfen; späte Antworten einschließlich Erfolgsmeldungen ignorieren. Geschützte Ansicht schließen, neu anmelden lassen. Fremde und fehlende Datensätze gleich neutral behandeln. Serverautomatik bleibt von offener Sitzung unabhängig.
- **UX-DR17 — Zugänglichkeit für alle neuen Zustände:** WCAG 2.2 AA als Prüfziel, semantische Navigation/Überschriften/Formulare/Links/Buttons/Tabellen, sichtbare Labels, programmatische Fehler/Status, logische Lesereihenfolge, vollständige Tastaturbedienung und nicht verdeckter Fokus. Zielstatus/Vormerkung/Vorzeichen ohne Farbabhängigkeit verständlich. 200-%-Text und 320-Pixel-Reflow, Touch-Ziele mindestens 44×44 und Geldfelder mindestens 48 CSS-Pixel hoch; reduzierte Bewegung berücksichtigen. Kein widersprüchliches assistives 0 % bei tatsächlichen −30 %.
- **UX-DR18 — Responsive Prüfpunkte und Referenzen:** 320×568: Zugang, drei Navigationseinträge, rote Abmeldung, Budget/Rest, Erfassung, signierte Eingabe, Vormerkung/Zielwahl ohne horizontales Scrollen. 390×844: Ausgaben-/Zielverwaltung, Bildschirmtastatur, Fortschritt, Auswahlübernahme, Löschdialog. 768×1024: Übersicht, ganze Historie, lange Beträge, Automatik und Fokus ohne Abschneiden. 1280×800: alle Kern-/Automatikflows mit Tastatur, Tabelle, Dialogen und Status. 200-%-Text zusätzlich prüfen. Unter 768 px einspaltig, darüber Inhalte nur innerhalb desselben Bereichs nebeneinander als UX-Annahme. Mockups `key-monat.html`, `key-ausgaben.html`, `key-sparziele.html` dienen als Referenzen.
- **UX-DR19 — Fünf durchgängige Flows:** UJ-1 Zugang → gegebenenfalls Budget → Ausgaben erfassen → Monat konsistent prüfen → rot abmelden. Flow 2 Zielverwaltung/manueller tatsächlicher Fortschritt. Flow 3 Aktivierung ohne Ziel → Vormerkungen → vollständige Auswahlübernahme. Flow 4 historische Ausgabe mit Differenzkorrektur. Flow 5 Zielwechsel/-löschung einschließlich Nullmonaten/verbrauchten Bindungen. Gemeinsame Fehler-/Offline-/Sitzungsregeln auf jeden Flow anwenden.
- **UX-DR20 — `logout-button`:** In allen drei Hauptbereichen dieselbe rote Fläche mit lesbarem „Abmelden“, Abstand zu Speichern/Löschen und sichtbarem Fokus. Rot/Lesbarkeit auch bei Hover, gedrücktem und laufendem Zustand erhalten; Vorgang zusätzlich textlich bezeichnen. Doppelsenden verhindern. Lokale Daten/Entwürfe auch bei fehlgeschlagenem Serverwiderruf verwerfen, geschützte Ansichten schließen; fehlgeschlagenen Widerruf nicht als erfolgreiche Serverabmeldung melden.
- **UX-DR21 — `expense-row`:** Sichtbare beschriftete Bearbeiten-/Löschen-Aktionen ohne Hover-/Gestenzwang, mobil dieselben Werte wie Tabelle. Bearbeiten erhält Datum/Eigentümer. Historische Betragsänderung/Löschung erst mit notwendiger Monatskorrektur bestätigen, reine Namensänderung ohne Geldwirkung.
- **UX-DR22 — `automation-panel`:** Als UX-Annahme Abschnitt innerhalb Sparziele, auch ohne Ziele erreichbar. Vor Erstaktivierung Start im gesamten laufenden Monat, ersten Abschluss nach Monatsende und Ausschluss früherer Monate erklären; explizit aktivieren. Nach Commit Startmonat, aktiven Status, Zielstatus und Vormerkung zeigen. Kein Login, offener Tab oder manueller Abschlussknopf als Voraussetzung; keine nicht spezifizierte Deaktivierung ergänzen. Keine Bank-/Überweisungssymbolik.
- **UX-DR23 — `goal-selection`:** Sichtbares Label „Ziel für Monatsüberschüsse“, nur eigene vorhandene Ziele, benannte Auswahl oder „Kein Ziel ausgewählt“, keine Vorbelegung des ersten Ziels. Zielanlage allein wählt nichts aus. Vor explizitem Speichern vollständige Übernahme offener Vormerkungen sowie Wirkung eines Wechsels für offenen/folgende Monate erklären. Fällige Monate folgen ihrer historischen Auswahl; alte Zuordnungen bleiben unverändert. Gewünschte Auswahl bis zum gemeinsamen Commit nur als Entwurf behandeln.
- **UX-DR24 — `pending-surplus`:** Nichtnegative offene Gesamtsumme auch bei null mit Bezeichnung „Vorgemerkt“ getrennt vom Fortschritt zeigen; erklären, dass sie noch keinem Ziel angerechnet ist. Fehlende Auswahl und Weg zur Zielwahl/-anlage benennen. Vollständige Übernahme direkt an der Auswahl erklären; Summe erst nach bestätigtem gemeinsamen Commit leeren. Nullsumme löscht historische Nullmonatsbindungen nicht; daraus keinen Nutzerverlauf bauen.
- **UX-DR25 — `goal-progress-value`:** Tatsächlichen signierten Betrag, positiven Zielbetrag und echten Prozentwert vollständig anzeigen, auch bei −30 % oder 150 %. Manuelle Aktion als Ersetzen des Gesamtfortschritts erklären; spätere Monatsdifferenzen können ihn weiter verändern. Neue Ziele null, Bearbeiten erhält Fortschritt, leeres Datum entfernt Datum. Vorzeichen und exakte Grenzen nicht nur visuell, sondern bei Eingabe/Validierung unterstützen.
- **UX-DR26 — `goal-progress-track`:** Benannte visuelle Skala 0–100 %, ruhiger Hintergrund aus Design-Tokens. Kein zusätzlicher finanzieller Wert und keine alleinige Fortschrittsinformation; mit tatsächlichen Zahlen aus UX-DR25 verbinden.
- **UX-DR27 — `goal-progress-fill`:** Ausschließlich die Füllung auf 0–100 % begrenzen. −30 € bei 100 € Ziel: leer; 150 €: voll, Zahlen bleiben −30 % beziehungsweise 150 %. Assistive Ausgabe darf Balkengrenzen nicht als tatsächlichen Stand melden; visuelles Element gegebenenfalls zugunsten vollständigen zugänglichen Texts verbergen (UX-Annahme).
- **UX-DR28 — Unbestätigtes Speichern und alte Oberflächen:** Bei ungewissem Ausgang verständlich „Speicherung noch nicht bestätigt“ benennen, aktuellen Stand ermitteln und keine blinde Wiederholung als neue Mutation anbieten. Beim notwendigen Versionswechsel verständlichen Aktualisierungshinweis mit Aktion anbieten (konkrete Mikrocopy UX-Annahme); alte geschützte Ansicht schließen, gegebenenfalls neu anmelden. Keine API-/Infrastrukturdiagnose im normalen Produktfluss.
- **UX-DR29 — Frische konsistente Rückkehransichten:** Nach bestätigten Ausgabenmutationen nächste Monatsansicht, nach historischen Korrekturen nächste Sparzielansicht mit aktuellen konsistenten Werten laden. Bei Monatswechsel oder zwischenzeitlicher Hintergrundverarbeitung alte Werte nicht als frisch ausgeben. Hintergrund-/ältere Leseantworten überschreiben weder offenen Entwurf noch neueren bestätigten Gesamtfortschritt.
- **UX-DR30 — Fehler lokal begrenzen und Korrekturwege erhalten:** Bei Auswahl/Übernahme nur zugehörige Aktion sperren, unabhängige Korrekturmöglichkeiten erreichbar lassen. Sicher gescheiterte Übernahme erhält gespeicherte Auswahl, Vormerkung und Fortschritt; historische Ausgabenmutation bei erforderlicher Korrektur ebenfalls nicht bestätigen. Bei Betragsgrenzen verständlich erklären statt runden/abschneiden. Manuelles Ersetzen bleibt bei blockierter Nachholung erreichbar, Ziellöschung braucht keinen erfolgreichen Nachhollauf. Keine zusätzlichen Kontoverwaltungs-/Export-/Einstellungsflächen aus offenen Betriebsfragen ableiten.

### Verbindliche fachliche Prüfbasis

Die folgenden Kennungen M-01 bis M-17 sind lokale Zuordnungslabels dieses Dokuments für die unveränderten 17 Fälle aus `monatsueberschuesse.md`, keine neuen FR- oder Story-IDs. Ihre Zuordnung zu neuen Stories erfolgt erst nach der Epic-Struktur.

| ID | Quellenfall | Erwartetes Ergebnis |
| --- | --- | --- |
| M-01 | Aktivierung im Oktober, Septemberdaten vorhanden | Oktober erst nach Abschluss berücksichtigen; keine Septemberanrechnung. |
| M-02 | Aktivierung ohne Ziel | Oktoberüberschuss 200 € nach Monatsende vormerken, auch ohne je ausgewähltes Ziel. |
| M-03 | Zwei offene Monate, dann Zielwahl | 200 € + 100 € auf 50 € Fortschritt ergeben 350 €, Vormerkung null, Wiederholung ohne Doppelwirkung. |
| M-04 | Historische Änderung vor Zuordnung | Oktober von 200 € auf 150 € korrigieren; mit 100 € November später insgesamt 250 € übernehmen. |
| M-05 | Positiver Monatsrest mit Ziel | 1.000 € Budget minus 800 € Ausgaben erhöhen 50 € auf 250 €; andere Ziele/Konten unverändert. |
| M-06 | Null/negativer Rest oder fehlendes Budget | Keine neue positive Anrechnung oder neue Belastung; historische Korrektur darf alte Anrechnung zurücknehmen. |
| M-07 | Nachholen nach Ausfall | Fällige Monate einmal verarbeiten, jeweilige Monatsendeauswahl bewahren; spätere Auswahl übernimmt offene Vormerkungen. |
| M-08 | Historische Ausgabe teurer | Zuvor 200 €, nun 150 € Überschuss: ausschließlich −50 € am ursprünglichen Ziel. |
| M-09 | Historische Ausgabe günstiger/gelöscht | Nur positive Differenz ergänzen, gesamten Monatsbetrag nicht erneut anrechnen. |
| M-10 | Manuelle Bearbeitung neben Automatik | Manuell 300 € plus Korrektur −50 € ergeben 250 €, keine Rekonstruktion aus Anrechnungen. |
| M-11 | Korrektur unter null | 20 € minus 50 € ergeben −30 € mit tatsächlichem negativem Prozentwert und leerem Balken. |
| M-12 | Anrechnung auf negativen Fortschritt | −30 € plus 100 € ergeben 70 €. |
| M-13 | Wechsel A nach B | Oktober bleibt A einschließlich späterer Korrekturen, November geht an B. |
| M-14 | Ausgewähltes Ziel löschen | Ziel/Fortschritt entfernen, frühere Anrechnungen nicht umleiten; weitere Überschüsse vormerken und bei neuer Auswahl übernehmen. |
| M-15 | Historische Korrektur nach Ziellöschung | Keine Wiederanlage, neue Vormerkung oder Anrechnung auf anderes Ziel für verbrauchten Monat. |
| M-16 | Übererfülltes Ziel | Tatsächlichen Betrag/Prozentwert zeigen, ausschließlich Balken auf 100 % begrenzen. |
| M-17 | Commitfehler, Konkurrenz, Geldgrenzen | Keine Teilbestätigung, Doppelzuordnung oder verlorene Änderung; Vormerkung bei gescheiterter Übernahme erhalten. |

Zusätzlich verbindlich aus den finalen Spines: Nullmonate mit Budget und historische Auswahl auch nach späterer Übernahme binden (AR-12/AR-13); noch unverarbeitete abgeschlossene Monate bei Ziellöschung verbrauchen ohne Nachholzwang (AR-14); manuelles Ersetzen trotz grenzbedingt blockierter Nachholung ermöglichen (AR-15); vollständige v1-Lese-/Schreibbarriere vor signierten Wirkungen nachweisen (AR-19). Die Oberflächenfälle aus `brownfield.md` sind durch UX-DR11/12/16/18/20/22 bis UX-DR30 erfasst.

### Annahmen und Umfangsgrenzen

- Aus PRD §10 übernommen und weiter ausdrücklich als Annahmen markiert: gesamte Ausgabenverwaltung im eigenen Bereich; signierter Wertebereich auch für manuelle Gesamteingabe. Beide sind bereits Grundlage der Zielarchitektur, keine neuen offenen Architekturentscheidungen.
- Visuelle Tokens, konkrete Mikrocopy, Platzierung der Automatik unter Sparziele, Layout ab 768 px und entbehrliche Bewegung bleiben UX-Annahmen. Sie werden nicht mit bestätigten Geld-/Kalender-/Sicherheitsregeln gleichgesetzt.
- Kein Bankimport, keine Bankübertragung, Einnahmenerfassung, Kategorien, wiederkehrenden Ausgaben, zusätzlichen Währungen/Zeitzonen, gemeinsamen Finanzansichten, Nutzer-Beitragsverläufe, getrennten Fortschrittsunterkonten, Korrekturschulden oder Offline-Synchronisation.
- Produktionsfreigabe folgt weder aus dieser Planung noch aus historischen Done-Stories. Die offenen Voraussetzungen aus AR-23 bleiben erhalten. Ein genauer automatischer Ausführungszeitpunkt und eine finanzielle Verbesserung werden nicht garantiert.

### Aktuelle FR-Abdeckungsübersicht

**Status: Epic-Struktur durch Linus bestätigt.** Die beiden neuen Epics sind 3 und 4; Epics 1–2 bleiben historische Bestandsnachweise. Mehrfachzuordnung benennt die jeweils ergänzte beziehungsweise erhaltene Verantwortung und keine doppelte Neuimplementierung. Die Story-Zuordnung wird im aktuellen Schritt ergänzt.

| FR | Historischer Bestandsnachweis | Neue Verantwortung |
| --- | --- | --- |
| FR-1 | Epic 1 | Epic 3: vollständiger v2-Kontozugang, unveränderter Sitzungsvertrag und rote Abmeldung. |
| FR-2 | Epics 1–2 | Epic 3: eigene Bestandsdaten unter v2; Epic 4: eigene Vormerkungen, Auswahl und Monatswirkungen samt Sitzungsgrenzen. |
| FR-3 | Epics 1–2 | Epic 3: Kontentrennung nach Migration und unter v2; Epic 4: dieselbe Grenze bei Job, Auswahl und Korrekturen. |
| FR-4 | Epic 1 | Epic 3: eigene Ausgabe im getrennten Ausgabenbereich erfassen. |
| FR-5 | Epic 1 | Epic 3: gesamte Historie im Ausgabenbereich, Datum und Eigentümer erhalten. |
| FR-6 | Epic 1 | Epic 3: eigene Ausgaben unter v2 bearbeiten/löschen und Monatsansicht aktualisieren; Epic 4: historische Betragsmutation/Löschung mit atomarer Monatskorrektur. |
| FR-7 | Epic 1 | Epic 3: fortlaufendes Budget und historische Budgetstände erhalten; Epic 4 verwendet diese historische Grundlage nach FR-14. |
| FR-8 | Epic 1 | Epic 3: konsistente aktuelle Monatsansicht und unveränderte Restformel; Epic 4 erhält die Unabhängigkeit von Sparanrechnungen. |
| FR-9 | Epic 2 | Epic 3: Ziele unter v2 verwalten, Start null und Fortschritt erhalten; Epic 4: Auswahl, Vormerkungen und verbrauchte Bindungen bei Ziellöschung. |
| FR-10 | Epic 2 | Epic 3: signierten Gesamtfortschritt manuell ersetzen und tatsächlich anzeigen; Epic 4: Differenzen am aktuellen Stand, Metadatenerhalt und manuelle Korrekturmöglichkeit bei blockierter Nachholung. |
| FR-11 | Epics 1–2 | Epic 3: neue Navigation, Zugang und manuelle Kernaufgaben zugänglich; Epic 4: sämtliche Automatikzustände und Folgen im gleichen Prüfmaßstab. |
| FR-12 | Neuer Umfang | Epic 3: Monat, Ausgaben und Sparziele getrennt mit Monat als Startansicht. |
| FR-13 | Neuer Umfang | Epic 3: vorhandene Systemtexte ohne Zeitzonenerläuterungen; Epic 4: dieselbe Textregel für neue Automatiktexte und zugängliche Hilfen. |
| FR-14 | Neuer Umfang | Epic 4: ausdrückliche Erstaktivierung, unveränderlicher Startmonat und vollständige Monatsformel. |
| FR-15 | Neuer Umfang | Epic 4: historische Zielauswahl, Vormerkungen einschließlich Nullnachweisen und vollständige atomare Übernahme. |
| FR-16 | Neuer Umfang | Epic 4: historische Differenzkorrektur am ursprünglichen Ziel beziehungsweise an der Vormerkung, ohne Wiederverteilung gelöschter Bindungen. |
| FR-17 | Neuer Umfang | Epic 4: sitzungsunabhängiger fairer Hintergrundlauf, Nachholen, Einmalwirkung und Konkurrenzschutz. |

FR-7 und FR-8 werden in Epic 3 umgesetzt beziehungsweise erhalten; ihre Verwendung durch Epic 4 verlangt keinen weiteren Budgetverwaltungsumfang. Kein FR bleibt ohne neuen Verantwortungsbereich. Die historischen Nachweise ersetzen keine Abnahme der betroffenen v2- oder Automatikänderungen.

## Neue Epic-Liste — bestätigt

### Epic 3: Ausgaben, Budget und Sparziele übersichtlich und sicher nutzen

**Nutzerergebnis:** Nutzer:innen registrieren sich beziehungsweise melden sich an, verwalten ihre bestehenden eigenen Daten über die neue Oberfläche und behalten ihren Monatsrest im Blick. Monat, Ausgaben und Sparziele sind klar getrennt, Monat bleibt Startansicht. Sie können einen tatsächlichen Gesamtfortschritt einschließlich negativer Werte manuell pflegen und sich in jedem Hauptbereich über dieselbe rote Aktion abmelden. Die bisherigen Konten und Finanzdaten bleiben erhalten.

**FRs covered:** FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, FR-7, FR-8, FR-9, FR-10, FR-11, FR-12, FR-13.

**Zusammenhängender Umfang:** Vollständiger Kontozugang und sämtliche bisherigen Ausgaben-, Budget- und Zielaufgaben unter API v2; drei Hauptbereiche, systemseitige Texte ohne Zeitzonenerläuterungen und zugängliches rotes Abmelden. Exakte signierte manuelle Fortschrittseingabe und tatsächliche Betrag-/Prozentanzeige mit allein begrenzter Balkenfüllung. Ausgabenmutationen führen beim nächsten Aufruf zu einer aktuellen konsistenten Monatsansicht; Entwürfe, Fehler und Sitzungsgrenzen bleiben durchgängig geschützt.

**Technik im Dienst dieses Ergebnisses:** Den v2-Vertrag samt Generatoren, getrennten Namensräumen und Prüfungen vor seinen Verbrauchern festlegen, einschließlich der für die Folgearbeit benötigten Vertragskonventionen. Zugang einschließlich Security/CSRF/Origin, `no-store`, Proxy und Interceptor vollständig nach v2 übernehmen. Ausgaben und Budget in eigene Datenbesitzer überführen, äußere Koordination, öffentliche Modulzugänge, einheitliche Kontosperre und konsistente Lesesicht bereitstellen. Bestehende Sparziel- und Zugangsfunktionen in diesen Schnitt einbinden. Additive Migrationen und wiederholbare administrative Rollenbereitstellung erhalten IDs, Eigentümer, Daten und Budgetstände. Das Monatsautomatikmodul und seine fachlichen Nachweise werden in Epic 4 ergänzt; seine Tabellen werden hier nicht vorsorglich angelegt.

**Eigenständig nutzbarer Abschluss und Freigabe:** Alle in diesem Epic angebotenen Nutzerwege verwenden v2 und sind geprüft. Bevor negative manuelle Fortschritte freigegeben werden, wird v1 kontrolliert stillgelegt, einschließlich Abschluss/Abbruch sämtlicher zugelassener Lese- und Schreibvorgänge und ihrer Datenbankarbeit. Alte Oberflächen erhalten den Aktualisierungspfad. Solange v1 unterstützt wird, bleiben Antworten und Mutationen kompatibel; negative Werte und Automatik sind serverseitig gesperrt. Epic 3 endet mit nutzbarer v2-Oberfläche und signiertem manuellem Fortschritt. Die Monatsautomatik bleibt bis zur vollständigen Umsetzung und Prüfung in Epic 4 serverseitig gesperrt und zeigt keine bedienbare, noch wirkungslose Aktivierung an. Nach ersten signierten Werten gelten die Rücknahmegrenzen aus AD-10 bereits in Epic 3.

**Abhängigkeit:** Baut auf dem abgeschlossenen Bestand aus Epics 1–2 auf und funktioniert vollständig ohne Epic 4. Benötigt weder Monatsabschluss noch Vormerkungen, um seine Nutzeraufgaben zu erfüllen. Die Freigabe dieses Ergebnisses ersetzt keine Produktionsfreigabe mit echten Daten.

### Epic 4: Monatsüberschüsse verlässlich für eigene Sparziele berücksichtigen

**Nutzerergebnis:** Nutzer:innen aktivieren die Monatsautomatik ausdrücklich ab dem laufenden Monat, auch ohne vorhandenes Ziel. Abgeschlossene Überschüsse gehen einmalig an das historisch ausgewählte eigene Ziel oder bleiben erkennbar vorgemerkt. Spätere Zielwahl übernimmt die gesamte offene Vormerkung. Ausgabenänderungen, manuelle Fortschrittseingaben, Zielwechsel und Ziellöschung erhalten nachvollziehbare korrekte Wirkungen, auch nach Ausfällen und ohne offene Sitzung.

**FRs covered:** FR-2, FR-3, FR-6, FR-9, FR-10, FR-11, FR-13, FR-14, FR-15, FR-16, FR-17.

**Zusammenhängender Umfang:** Aktivierung/Startmonat, damaliger Budgetstand und Monatsendeauswahl, dauerhafter Nachweis je Konto/Monat, Anrechnung beziehungsweise Vormerkung und vollständige Auswahlübernahme einschließlich offener Nullmonate mit Budget. Zielwechsel verändert den offenen und spätere Monate; alte Bindungen bleiben bestehen. Historische Ausgabenmutationen korrigieren ausschließlich die Überschussdifferenz am aktuellen Fortschritt des ursprünglichen vorhandenen Ziels. Manuelles Ersetzen bewahrt Monatsmetadaten und bleibt bei grenzbedingt blockierter Nachholung möglich. Ziellöschung erhält verbrauchte historische Bindungen, auch bei noch unverarbeiteten abgeschlossenen Monaten, ohne Nachholzwang oder Umleitung.

**Technik im Dienst dieses Ergebnisses:** `monthlysurplus` als fünften isolierten Datenbesitzer ergänzen und über die äußere Koordination mit öffentlichen Budget-, Ausgaben- und Zielzugängen verbinden. Vor Implementierung der betreffenden Verbraucher die konkreten Automatikpfade, DTOs und Fehler im v2-Vertrag festlegen; der bestehende v1-Vertrag bleibt eingefroren. Begrenzte Jobrolle, sichere Discovery, transaktionslokalen Kontokontext und dieselbe Kontosperre für Web und Job durchsetzen. Monatliche Herkunft, Zustand und zuletzt berücksichtigten Überschuss dauerhaft sichern; alle zusammengehörigen Änderungen atomar durchführen. Nach erfolgreichem Start und regelmäßig fällige Monate fair und chronologisch nachholen, Fehler verzögert wiederholen und Rückstand/letzten Erfolg/technische Fehler ohne sensible Protokolle beobachtbar machen.

**Eigenständig nutzbarer Abschluss und Freigabe:** Alle 17 Monatsfälle M-01 bis M-17, die zusätzlichen Nullmonat-/Lösch-/Korrekturpräzisierungen, PostgreSQL-Sicherheits-/Konkurrenznachweise und die vollständigen zugänglichen Automatikflows sind erfüllt. Aktivierung bleibt serverseitig gesperrt, bis Abschluss, Nachholung, Auswahlübernahme, historische Korrektur und Ziellöschung gemeinsam zuverlässig funktionieren. Eine frühe Anrechnung mit erst später nachgelieferter Korrektur- oder Löschlogik ist kein abgeschlossener Teil dieses Epics. Die v1-Barriere aus Epic 3 wird als Voraussetzung geprüft; erst danach und nach vollständiger Automatikprüfung wird die Aktivierung angeboten. Technische Freigabe aktiviert kein Konto automatisch; der individuelle Start bleibt die ausdrückliche Erstaktivierung. Keine spätere Epic-Arbeit ist zur korrekten Verarbeitung erforderlich.

**Abhängigkeit:** Baut auf dem fertig nutzbaren v2-Zugang, den Datenbesitzern, der Koordination und dem signierten Fortschritt aus Epic 3 auf. Einseitige Reihenfolge: Bestand → Epic 3 → Epic 4. Nicht Bestandteil sind Banktransfers, ein Nutzer-Beitragsverlauf, separate Korrekturschulden oder eine nicht spezifizierte Deaktivierung.

### Begründung der Aufteilung und gemeinsame Dateien

Zwei neue Epics ergänzen die zwei historischen Epics; die Gesamtstruktur umfasst damit vier Epics. Jedes neue Epic liefert einen vollständigen Nutzerzustand. Epic 3 ermöglicht die neue tägliche Bedienung samt manueller Zielpflege; Epic 4 ergänzt anschließend eine dauerhafte automatische Finanzwirkung mit eigener Nachhol- und Korrekturgrenze. Architektur und UX sind bereits geklärt; der gesamte Automatik-Lebenszyklus bleibt deshalb in einem Epic gebündelt. Die technischen Arbeiten an Vertrag, Datenbank, API, Oberfläche und Prüfungen werden innerhalb dieser Nutzerergebnisse geordnet.

Im Bestand betreffen beide Epics unter anderem `frontend/src/app/savings-goals/savings-goals.ts`, `frontend/src/app/shared/money.ts`, `frontend/src/app/shared/savings-progress.ts` und die Sparziel-/Ausgabenfunktionen im Backend sowie Vertrags- und Prüfinfrastruktur. Diese Überschneidung ist sequenziell: Epic 3 stellt den nutzbaren v2-/manuellen Zustand her, Epic 4 erweitert ihn um die fachlich zusammengehörige Automatik. Epic 3 benötigt dabei keine künftigen Automatikfunktionen. Die Aufteilung trennt einen eigenständig freigebbaren manuellen Zustand von dauerhaft wirkender Hintergrundverarbeitung. Auswahl, Vormerkung, Korrektur und Löschung werden wegen ihrer gemeinsamen Daten und Invarianten innerhalb Epic 4 zusammengehalten. Es gibt keine zusätzliche Epic-Trennung nach Frontend, Backend, Migration oder Betrieb.

Die spätere Story-Reihenfolge verwendet nur Bestand oder vorher abgeschlossene Arbeit. Insbesondere stehen Vertragsfestlegung und jeweils nötige Migrationen vor ihren Verbrauchern; Datenbankobjekte entstehen bei ihrer ersten fachlichen Verwendung. Freigaben bleiben bis zum Nachweis aller benötigten Regeln gesperrt. Konkrete Story-IDs und Abnahmen werden nach Einzelbestätigung im jeweiligen Epic-Abschnitt dokumentiert.

### Abdeckung der Qualitätsanforderungen

| NFR | Epic-Verantwortung |
| --- | --- |
| NFR-1 | 3: Datenschutz nach Migration/v2; 4: Erweiterung auf Vormerkungen, Nachweise und Job. |
| NFR-2 | 3: JWT-Webzugriff/RLS; 4: begrenzter interner Jobkontext und sichere Discovery unter RLS. |
| NFR-3 | 3: neue Navigation/manuelle Kernaufgaben; 4: alle Automatikzustände mit denselben Prüfgrößen. |
| NFR-4 | 3: exakte Bestandswerte und signierter manueller Fortschritt; 4: Überschüsse, Summen und atomare Differenzen. |
| NFR-5 | 3: serverseitiges Datum, gemeinsame Monatskontexte und historische Budgets; 4: Abschlüsse/Auswahlhistorie einschließlich Zeitumstellungen. |
| NFR-6 | 3: flüchtiger Browserzustand und Sitzungsgrenzen; 4: Auswahl/Vormerkungen/Automatikentwürfe ebenfalls verwerfen. |
| NFR-7 | 3: koordinierte Bestandsmutationen nach äußerem Commit; 4: zusammengehörige Ausgabe-/Nachweis-/Fortschritts-/Auswahländerungen. |
| NFR-8 | 3: gemeinsame Kontoserialisierung für Webmutationen; 4: dauerhafte Einmalwirkung, Web-/Jobkonkurrenz, Nachholen und faire Wiederholung. |
| NFR-9 | 4: Rückstand, letzte erfolgreiche Monatsverarbeitung und technische Fehler ohne sensible Logs. |
| NFR-10 | 3: Migration, vollständiger v2-Wechsel, v1-Barriere und Rücknahmegrenzen vor signierten Werten; 4: keine erfundenen Voraktivierungswirkungen, sichere Aktivierungsfreigabe und Erhalt der Rücknahmegrenze. |
| NFR-11 | 3: Fehler/ungewisser Ausgang in manuellen Kernaufgaben; 4: dieselben Regeln bei Aktivierung, Übernahme und Korrektur. |
| NFR-12 | Beide: Geheimnisse und bestehende Produktionsbedingungen erhalten; offene Betriebs-/Datenlebenszyklusentscheidungen werden nicht als erledigt markiert. |

### Abdeckung der Architektur- und Übergangsvorgaben

| Anforderungen | Epic-Verantwortung |
| --- | --- |
| AR-1 | 3: Weiterentwicklung des Bestands; kein Starter und kein Framework-Upgrade. |
| AR-2, AR-3 | 3: Ausgaben/Budget isolieren, Zugang/Ziele anbinden, öffentliche Zugänge/äußere Koordination; 4: `monthlysurplus` mit eigenem Datenbesitz ergänzen. |
| AR-4 | 3: v2-Vertragsbasis, vollständiger Zugang, Generator-/Kompatibilitätschecks; 4: konkrete Automatikverträge vor deren Verbrauchern im selben v2-Prüfweg. |
| AR-5 | 3: unveränderter Zugangsvertrag vollständig in v2; gilt in 4 unverändert fort. |
| AR-6 | 3: kontogebundene Webzugriffe nach Schema-/Modulschnitt; 4: RLS auf neue Finanznachweise ausdehnen. |
| AR-7, AR-8 | 4: begrenzte Workerrolle, Aktivierungsautorisierung und sichere paketweise Discovery. |
| AR-9, AR-10 | 3: gemeinsame Transaktion/Sperre/Zeit/Lesesicht für Bestandsaufgaben; 4: Job und Automatikmutationen an dieselben Grenzen anbinden. |
| AR-11 | 3: Geld-/Kalender-/Budgetkonventionen samt signierter manueller Eingabe; 4: dieselben Grenzen in Monatsberechnung und Differenzen anwenden. |
| AR-12, AR-13, AR-14, AR-15, AR-16 | 4: dauerhafte Herkunft, Auswahlübernahme, verbrauchte Löschbindungen, Differenzkorrektur und nachholbarer fairer Lauf als vollständiger Lebenszyklus. |
| AR-17, AR-18 | 3: additive Modul-/Fortschrittsmigrationen und wiederholbare administrative Rollenbasis; 4: benötigte Automatikobjekte und konkrete Worker-/Discoveryrechte bei ihrer ersten Verwendung ergänzen, auch auf initialisierten Volumes. |
| AR-19 | 3: kompletter v2-Nutzerzugang und v1-Lese-/Schreibbarriere vor signiertem Fortschritt; 4: Barriere als Voraussetzung prüfen und Automatik erst nach vollständigem fachlichem Nachweis freigeben. |
| AR-20 | 3: Rücknahme vor Freigabe prüfen, v1-Rückfall nach signierten Werten ausschließen; 4: dieselbe Grenze für Monatswirkungen erhalten. |
| AR-21 | 3: v2-Routing/Proxy und unveränderte Betriebsform/Pins; 4: internen Job im selben Java-Artefakt mit getrennter Konfiguration/Rolle ergänzen. |
| AR-22 | 3: Vertrags-, Architektur-, Migrations-, v2-/Sicherheits-/Browsernachweise; 4: zusätzliche PostgreSQL-, Rollen-, Nachhol-, Konkurrenz- und Monatsabnahmen plus Automatik-Browserflows. |
| AR-23 | Beide: offene Betriebs-/Datenlebenszyklusgates erhalten und betroffene Projektvorgaben bei Umsetzung nachführen. Keine pauschale Produktionsfreigabe. |

### Abdeckung der UX-Anforderungen und Monatsfälle

| Anforderungen | Epic-Verantwortung |
| --- | --- |
| UX-DR1, UX-DR2 | 3: Tokens, Schrift, Kontrast und lange signierte Werte; 4: dieselben Regeln für neue Automatikbausteine. |
| UX-DR3 | 3: konsistenter v2-Zugang mit frischem Kontozustand. |
| UX-DR4, UX-DR5 | 3: explizite Aktionen/Geldfelder einschließlich signierter Eingabe; 4: Aktivierung, Auswahl und betroffene Betragsfehler. |
| UX-DR6, UX-DR7 | 3: getrennte Monatszusammenfassung und vollständige Ausgabenhistorie. |
| UX-DR8, UX-DR9, UX-DR10 | 3: tatsächliche Fortschrittsanzeige, Speicherstatus und Bestandslöschdialoge; 4: automatische Fortschrittswirkung, gemeinsame Übernahme und erweiterte Ziellöschfolgen. |
| UX-DR11 | 3: drei erreichbare Hauptbereiche; 4 erhält die Struktur mit Automatik innerhalb Sparziele. |
| UX-DR12, UX-DR13, UX-DR14, UX-DR15, UX-DR16, UX-DR17, UX-DR18 | 3: Texte, leere Ansichten, Lade-/Fehler-/Offline-/Sitzungszustände und zugängliche responsive Kernaufgaben; 4: gleiche Regeln für sämtliche neuen Automatikzustände. |
| UX-DR19 | 3: vollständige Flows 1 und 2; 4: vollständige Flows 3 bis 5 einschließlich Auswirkungen auf die bestehenden Flows. |
| UX-DR20 | 3: gemeinsame rote Abmeldung in allen Hauptbereichen; in 4 unverändert erhalten. |
| UX-DR21 | 3: sichtbare Ausgabenaktionen; 4: historische Mutation erst mit notwendiger Korrektur bestätigen. |
| UX-DR22, UX-DR23, UX-DR24 | 4: Automatikabschnitt, eigene Zielauswahl und sichtbare Vormerkung einschließlich null. |
| UX-DR25, UX-DR26, UX-DR27 | 3: signierte tatsächliche Werte und begrenzter visueller Balken; 4: Darstellung bei Monatsanrechnung und Korrektur erhalten. |
| UX-DR28, UX-DR29 | 3: unbestätigtes Speichern, Aktualisierungspfad alter Oberflächen und frische Rückkehransichten; 4: gleiche Regeln für Übernahme/Hintergrundwirkungen, ohne Entwurfsverlust. |
| UX-DR30 | 4: Fehler lokal begrenzen, manuelles Ersetzen und Ziellöschung trotz blockierter Nachholung erreichbar halten. |
| M-01, M-02, M-03, M-04, M-05, M-06, M-07, M-08, M-09, M-10, M-11, M-12, M-13, M-14, M-15, M-16, M-17 | 4: sämtliche 17 Monatsabnahmefälle vollständig nachweisen. Epic 3 liefert die signierte manuelle Darstellungsbasis für M-11/M-12/M-16; automatische Wirkungen werden erst in 4 abgenommen. |
| Ergänzungen aus AD-8/AD-9/AD-10 | 3: v1-Lesebarriere vor signierten Werten; 4: historische Nullbindungen, Löschverbrauch unverarbeiteter Monate und manuelles Ersetzen bei blockierter Nachholung. |

### Bestätigungsstand

Linus hat die Struktur mit zwei neuen Epics, den Übergang von Epic 3 zu Epic 4 und alle 16 neuen Stories einzeln bestätigt. Beide Epics sind vollständig ausgearbeitet; die konkreten Anforderungs-/Monatsfallzuordnungen stehen in ihren Planungsabschlüssen. Die Abschlussvalidierung ist ohne offene Prüfpunkte bestanden und Linus hat den Workflow abschließend mit C bestätigt. Das Epic-Dokument ist vollständig und final gespeichert. Historische Abnahmen, Sprint-Fertigmeldungen und tatsächlicher Implementierungsstand bleiben unverändert.

## Epic 3: Ausgaben, Budget und Sparziele übersichtlich und sicher nutzen

Nutzer:innen verwenden drei klare Hauptbereiche, erhalten ihren bisherigen Kontozugang und ihre Daten und können den tatsächlichen Gesamtfortschritt auch negativ manuell pflegen. Vollständiger API-v2-Wechsel, sichere Bestandsmigration und kontrollierte v1-Stilllegung gehören zu diesem eigenständig nutzbaren Ergebnis.

**FRs:** FR-1 bis FR-13. Bestätigte Story-Texte sind Planungsabnahmen und keine Fertigmeldungen der Implementierung.

### Story 3.1: Eigenen Kontozugang über API v2 nutzen

Als Person mit aktivem Registrierungslink oder bestehendem Konto\
möchte ich mich auch über den neuen API-Zugang registrieren, anmelden, meine Sitzung erneuern, meine eigene Identität prüfen und mich abmelden können,\
damit mein persönlicher Kontozugang beim Versionswechsel zuverlässig erhalten bleibt.

**Anforderungsbezug:** FR-1 sowie zugangsbezogene Teile von FR-2/FR-3; NFR-1, NFR-2, NFR-7, NFR-10; AR-1, AR-4, AR-5 und zugangsbezogene Teile von AR-19/AR-22. UX-DR3 ist für die neutralen Zugangsmeldungen verbindlich; die vollständige Browser-/Navigationsumstellung und deren weitere UX-Abnahmen folgen im Epic und werden durch diese Story nicht als erledigt ausgewiesen.

**Abhängigkeiten und Umfang:** Baut ausschließlich auf dem abgeschlossenen Zugang aus Stories 1.1/1.2 und der bestehenden Vertrags-/Prüfinfrastruktur auf. Umfasst den v2-Zugangsvertrag, getrennte Generatorausgaben, die sechs ausführbaren v2-Zugangsoperationen und ihre Sicherheits-/Kompatibilitätsnachweise. Bestehende Anwendungsfunktionen des Zugangsmoduls bleiben die gemeinsame fachliche Implementierung. Die vorhandene Oberfläche bleibt während der stufenweisen Einführung nutzbar; der freigegebene vollständige Wechsel der Oberfläche und die v1-Stilllegung bleiben der Abschluss des Epics. Für diese Story werden keine Finanz- oder Automatikdatenbankobjekte benötigt.

**Abnahmekriterien:**

**AC-1 — Eigenständiger versionierter Zugangsvertrag**

**Angenommen** der v1-Vertrag und die bestehenden Kontozugangsregeln sind vorhanden\
**Wenn** der v2-Zugangsvertrag vor der Implementierung seiner Verbraucher festgelegt wird\
**Dann** beschreibt `api-contract/v2/openapi.yaml` in OpenAPI 3.0.4 unter der Basis `/api/v2` mindestens `POST /access/registrations`, `GET /access/csrf`, `POST /access/login`, `POST /access/refresh`, `POST /access/logout` und `GET /access/me` mit eindeutigen Operationen, Anfrage-/Antwortmodellen, Statuscodes, Fehlerformen, Sicherheitsanforderungen und Cookie-/Headerverhalten.\
**Und** die sechs Operationen erhalten den bestehenden fachlichen Zugangsvertrag; `api-contract/openapi.yaml` bleibt unverändert. Weitere v2-Fachoperationen werden vor ihren jeweiligen Verbrauchern vertraglich festgelegt.

**AC-2 — Getrennte Generierung und belastbarer Vertragscheck**

**Angenommen** v1 und der neue v2-Zugangsvertrag liegen vor\
**Wenn** die gemeinsame Vertragsprüfung lokal beziehungsweise in CI läuft\
**Dann** werden beide unterstützten Hauptversionen separat validiert, in getrennte Java-/TypeScript-Namensräume und Ausgabeordner generiert und beide Generatorausgaben kompiliert; Generator 7.26.0 und oasdiff 1.30.0 bleiben die Werkzeugbasis.\
**Und** jede Version wird gegen ihren eigenen Basisvertrag geprüft; ein noch fehlender v2-Basisvertrag gilt als Erstvertrag, niemals als kompatible Revision von v1. Eine inkompatible Änderung innerhalb einer bereits unterstützten Hauptversion lässt die Prüfung scheitern. Generierte Dateien werden nicht manuell bearbeitet und die bisherige v1-Anwendung baut weiterhin.

**AC-3 — Registrierung erhält Link-, Passwort- und Kontoregeln**

**Angenommen** eine Person verwendet einen aktiven Registrierungslink und zulässige Zugangsdaten\
**Wenn** sie die v2-Registrierung absendet\
**Dann** wird nach erfolgreichem Commit genau ein eigenes Konto nach den bestehenden Regeln angelegt, mit derselben Kontenablage und Identitätssemantik wie unter v1; das Konto ist anschließend über den bereits vorhandenen Zugang anmeldbar.\
**Und** abgelaufene, ersetzte oder gesperrte Links ermöglichen keine Registrierung; Linkgültigkeit 30 Tage, geschützter Ersatz/Widerruf und bestehende Konten bleiben erhalten. Passwörter umfassen 15–64 Zeichen, erlauben Leerzeichen, druckbare ASCII- und Unicode-Zeichen ohne zusätzliche Zeichenklassenregeln, lehnen verbreitete/kompromittierte Werte ab und werden ausschließlich als adaptive gesalzene Hashes gespeichert. Fehler und Protokolle offenbaren weder Klartextpasswörter noch fremde Konten; ein nicht bestätigter Commit wird nicht als erfolgreiche Kontoanlage ausgegeben.

**AC-4 — Anmeldung und Identität vorhandener Konten**

**Angenommen** ein bereits unter v1 angelegtes Konto und gültige Zugangsdaten sind vorhanden\
**Wenn** sich die Person über v2 anmeldet und mit dem ausgestellten Access-JWT die v2-Identität abfragt\
**Dann** erhält sie Zugang für genau zehn Minuten und dieselbe eigene Konto-ID; `GET /access/me` leitet die Identität ausschließlich aus dem geprüften JWT-`sub` ab. Signatur, Aussteller, Zielgruppe und Ablauf werden geprüft.\
**Und** fehlende, ungültige oder abgelaufene Access-Tokens werden abgewiesen; falsche Zugangsdaten und nicht vorhandene Konten liefern eine neutrale Zugangsfehlermeldung. Für Anmeldung und Identitätsabfrage ist keine künftige Finanzroute erforderlich.

**AC-5 — Rotierende Sitzung und versionsübergreifend gleicher Bestand**

**Angenommen** eine gültige Anmeldung hat eine Refresh-Familie erzeugt\
**Wenn** die Person ihre Sitzung über v2 erneuert\
**Dann** wird das Refresh-Token bei jeder erfolgreichen Erneuerung rotiert, serverseitig nur gehasht gespeichert und als hostgebundenes `HttpOnly`-/`Secure`-/`SameSite=Strict`-Cookie nach dem bisherigen Vertrag ausgegeben. Es verfällt nach 30 Tagen Inaktivität beziehungsweise spätestens 90 Tagen seit Anmeldung.\
**Und** wiederverwendete ersetzte Tokens widerrufen die zugehörige Familie. V1- und v2-Adapter verwenden dieselben Konten und Sitzungsfamilien; Erneuerung, Wiederverwendung und Widerruf erzeugen keine getrennten versionsabhängigen Sitzungsbestände. Eine unbestätigte Rotation wird nicht automatisch als neue Mutation wiederholt.

**AC-6 — Geschützte Sitzungsoperationen**

**Angenommen** die v2-Zugangsoperationen werden direkt aufgerufen\
**Wenn** CSRF- oder Origin-Werte fehlen, falsch sind oder Zugangsdaten zur JWT-Ausstellung fehlen\
**Dann** setzen die v2-Adapter für Anmeldung, Erneuerung und Abmeldung denselben CSRF-Header- und exakten Origin-Schutz wie der Bestand durch und geben ohne erforderliche Voraussetzungen keine erfolgreiche Sitzungsänderung aus.\
**Und** der CSRF-Handschlag bleibt ausdrücklich erreichbar, die Registrierung erhält ihre bisherige eng begrenzte Ausnahme und fremde/unbekannte Routen werden nicht durch eine pauschale v2-Freigabe geöffnet. Zugang und Fehlerantworten führen das vorgesehene `Cache-Control: no-store`; Refresh-/CSRF-Cookies ersetzen kein erforderliches Bearer-Token bei der Identitätsabfrage.

**AC-7 — Abmelden widerruft dieselbe Familie**

**Angenommen** eine gültige Refresh-Familie besteht\
**Wenn** die Person mit gültigem CSRF-/Origin-Kontext die v2-Abmeldung abschickt\
**Dann** wird die Familie verbindlich widerrufen und das Refresh-Cookie gelöscht; eine nachfolgende Erneuerung mit dieser Familie scheitert auch über den anderen Versionsadapter.\
**Und** bereits ausgestellte Access-JWTs bleiben höchstens bis zu ihrem regulären Ablauf gültig, ohne neue Access-Sperrliste. Ein fehlgeschlagener oder unbestätigter Widerruf wird nicht als bestätigte Serverabmeldung ausgegeben; die bestehenden Regeln zum lokalen Verwerfen persönlichen Browserzustands bleiben verbindlich.

**AC-8 — Ausführbare Nachweise und unabhängiger Abschluss**

**Angenommen** die sechs v2-Zugangsoperationen sind implementiert\
**Wenn** Vertrags-/Kompilierchecks und die passenden Backend-Integrationstests gegen echtes temporäres PostgreSQL laufen\
**Dann** belegen sie aktive/abgelaufene/ersetzte Links, zulässige/ungültige Registrierung, Anmeldung eines Bestandskontos, verifizierte Identität, sichere Fehler, CSRF/Origin, Cookie-Attribute, Rotation, zeitliche Grenzen, Wiederverwendung und Familienwiderruf einschließlich der Koexistenz von v1/v2. Bestehende v1-Zugangsprüfungen bleiben erfolgreich.\
**Und** Registrierung, Anmeldung, Erneuerung, Identitätsprüfung und Abmeldung sind über v2 tatsächlich ausführbar, ohne eine spätere Story vorauszusetzen. Finanzdaten/IDs bleiben unverändert; signierte Fortschrittswerte und Monatsautomatik werden durch diese Story nicht freigegeben. Die Story beansprucht weder den vollständigen Oberflächenwechsel noch die v1-Stilllegung oder Produktionsfreigabe.

### Story 3.2: In der Oberfläche den neuen Zugang und rotes Abmelden nutzen

Als Person mit aktivem Registrierungslink oder bestehendem Konto\
möchte ich mich über die Oberfläche mit dem neuen Zugang registrieren und anmelden sowie mich überall über dieselbe erkennbare rote Aktion abmelden können,\
damit ich meinen persönlichen Bereich zuverlässig öffnen und schließen kann und nach Sitzungsende keine alten Finanzdaten erscheinen.

**Anforderungsbezug:** FR-1, FR-2, FR-3, FR-11 und zugangsbezogener Teil von FR-13; NFR-1, NFR-2, NFR-3, NFR-6, NFR-7, NFR-11 sowie Browseranteil von NFR-10. AR-4, AR-5 und Browser-/Proxyanteile von AR-19/AR-22. UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR9, UX-DR12, UX-DR14, UX-DR15, UX-DR16, UX-DR17, UX-DR18, Zugangsanteil von UX-DR19, UX-DR20 und Behandlung unbestätigter Zugangsoperationen aus UX-DR28.

**Abhängigkeiten und Umfang:** Baut auf bestätigter Story 3.1 und der vorhandenen Oberfläche samt Sitzungs-/Formularlogik aus Epics 1–2 auf. Umfasst die sechs v2-Zugangsoperationen in der Browseranwendung, die Einbindung ihrer generierten Schnittstellen/Typen, Proxy/Interceptor/Guard, lokale Sitzungsgrenzen und eine wiederverwendete rote Abmeldeaktion. Der intern prüfbare Übergangsstand bleibt mit den vorhandenen v1-Finanzoperationen vollständig bedienbar; die getrennte Ausgabenansicht, deren spätere v2-Finanzoperationen und die kontrollierte v1-Stilllegung sind weitere Ergebnisse desselben Epics. Keine spätere Story ist zum Prüfen oder Nutzen des hier beschriebenen Browserzugangs nötig.

**Abnahmekriterien:**

**AC-1 — Vollständiger Browserzugang über v2**

**Angenommen** die sechs v2-Zugangsoperationen aus Story 3.1 sind verfügbar\
**Wenn** die Oberfläche Registrierung, CSRF-Handschlag, Anmeldung, Sitzungserneuerung, Identitätsprüfung oder Abmeldung ausführt\
**Dann** verwendet sie dafür ausschließlich die entsprechenden `/api/v2/access/...`-Operationen und die dort festgelegten generierten Schnittstellen beziehungsweise Typen. Auch die bisherigen Identitätsprüfungen der angemeldeten Ansichten nutzen v2.\
**Und** diese Aufrufe erreichen über dieselbe vertrauenswürdige Herkunft und den lokalen HTTPS-Frontend-Proxy die API mit den erforderlichen Cookies, Headern und bestehenden CSRF-/Origin-Regeln. Die vorhandenen v1-Finanzoperationen bleiben im Übergangsstand nutzbar. Aus diesem Teilwechsel wird keine vollständige v2-Freigabe abgeleitet.

**AC-2 — Verständliche Registrierung und Anmeldung**

**Angenommen** eine Person öffnet den gültigen Registrierungslink oder die Anmeldung\
**Wenn** sie ihre Zugangsdaten eingibt und ausdrücklich absendet\
**Dann** sind Registrierung und Anmeldung durch Titel und Aktion unterscheidbar; gültige Registrierung wird erst nach bestätigter Kontoanlage als erfolgreich angezeigt und führt zur erreichbaren Anmeldung. Eine bestätigte Anmeldung öffnet die bestehende Monatsstartansicht mit einem frischen Kontozustand.\
**Und** ungültige Links, Passwörter, Zugangsdaten und fremde/nicht vorhandene Konten erhalten neutrale verständliche deutsche Fehler. Sichtbare Labels, programmatisch zugeordnete Feldfehler, sinnvolle Fokussierung und assistiv angekündigte Statusmeldungen bleiben erhalten. Systemtexte und zugängliche Hilfen enthalten keine Zeitzonenerläuterungen. Registrierungsgeheimnis und Passwort werden nicht in dauerhaftem Browserspeicher abgelegt; das Registrierungsgeheimnis wird wie bisher unmittelbar aus der URL entfernt.

**AC-3 — Erneuerung und Tab-Koordination erhalten die Sitzung**

**Angenommen** eine gültige Sitzung besteht oder über das geschützte Cookie wiederhergestellt werden kann\
**Wenn** der Guard eine Ansicht öffnet, eine Erneuerung fällig wird oder mehrere Tabs gleichzeitig Zugangsoperationen anstoßen\
**Dann** erfolgen Wiederherstellung und Erneuerung über v2 unter Erhalt der bisherigen Serialisierung und der mit vorhandenen Tabs geteilten originweiten Cookie-Sperre. Gleichzeitige Erneuerungsanforderungen desselben Tabs teilen ihren laufenden Vorgang; Cookie-Mutationen verschiedener Tabs und noch unterstützter Oberflächenversionen werden in konsistenter Reihenfolge abgeschlossen.\
**Und** eine unbestätigte Refresh-Rotation wird nicht automatisch wiederholt. Ablauf und Annahme einer Sitzungsantwort behalten die bestehende serverzeitgestützte/monotone Laufzeitprüfung, statt von einer verstellten Geräteuhr abhängig zu werden. Ein fehlgeschlagener oder abgelaufener Zugang öffnet keine geschützte Ansicht.

**AC-4 — Interceptor schützt die unterstützten API-Aufrufe**

**Angenommen** ein Access-Token liegt ausschließlich im Arbeitsspeicher der aktuellen Sitzung\
**Wenn** die Anwendung einen geschützten Aufruf an eine ausdrücklich unterstützte API-Version derselben vertrauenswürdigen Herkunft sendet\
**Dann** fügt der Interceptor den aktuellen Bearer hinzu und bewahrt die bestehenden Erneuerungs-/Generationskontrollen auch für v2; der v2-Identitätsaufruf benötigt ein verifiziertes Bearer-Token. Ein alter oder fehlender Zugang wird nicht durch Cookies ersetzt.\
**Und** Registrierung, CSRF-Handschlag, Anmeldung, Erneuerung und Abmeldung gelangen in ihren vorgesehenen eigenen Sitzungsweg statt in eine rekursive Erneuerung. Bei 401 entsteht keine unbegrenzte Wiederholungsfolge; Antworten einer inzwischen beendeten oder gewechselten Sitzung werden verworfen. Access-Tokens gelangen nicht an fremde Herkunftsadressen oder in Protokolle.

**AC-5 — Konsistente zugängliche rote Abmeldeaktion**

**Angenommen** die Person befindet sich in einer vorhandenen angemeldeten Hauptansicht\
**Wenn** sie die Abmeldeaktion sieht, fokussiert oder betätigt\
**Dann** findet sie überall dieselbe beschriftete Aktion „Abmelden“ mit roter Fläche aus dem vorläufigen Designwert `#842D2D`, lesbarem Text und sichtbarem, nicht verdecktem Fokus mit Abstand zur Aktionsfläche. Hover-, gedrückter und laufender Zustand erhalten die lesbare rote Aktion; ein laufender Vorgang wird zusätzlich textlich bezeichnet.\
**Und** die Aktion nutzt eine gemeinsame wiederverwendbare Ausprägung, liegt mit Abstand zu Speichern/Löschen, ist mindestens 44×44 CSS-Pixel groß und per Touch sowie Tastatur bedienbar. Während der zugehörigen Abmeldung werden Doppelsendungen verhindert. Die gemeinsame Ausprägung lässt sich auch in den weiteren Hauptbereich übernehmen, ohne dessen Existenz für diese Story vorauszusetzen.

**AC-6 — Sitzungsende und Kontowechsel verwerfen persönliche Zustände**

**Angenommen** Finanzdaten oder offene Entwürfe eines Kontos sind sichtbar und weitere Antworten stehen aus\
**Wenn** Abmeldung, Tokenablauf, abgebrochene Anmeldung oder ein Kontowechsel die bisherige Sitzung beendet\
**Dann** werden Access-Token, vorherige Finanzdaten und persönliche Entwürfe lokal verworfen, geschützte Ansichten geschlossen und die Anmeldung angezeigt. Andere betroffene Tabs erhalten das vorhandene Sitzungsende-Signal ohne Token- oder Finanzinhalte.\
**Und** verzögerte Login-, Refresh-, Identitäts- oder Finanzantworten bringen weder alte Werte noch Erfolgsmeldungen zurück. Bereits laufende Cookie-Mutationen werden mit dem anschließenden Widerruf so geordnet, dass eine verspätete Antwort keine beendete Sitzung unbemerkt wiederherstellt. Eine neue Anmeldung zeigt ausschließlich Daten ihres Kontos. Tokens und Finanzdaten bleiben außerhalb von `localStorage`, `sessionStorage` und anderen dauerhaften Browserablagen.

**AC-7 — Fehler, Offline und unbestätigte Abmeldung ehrlich anzeigen**

**Angenommen** ein Zugangsformular ist geöffnet oder eine Abmeldung läuft\
**Wenn** die Verbindung fehlt, ein sicherer Fehler eintritt oder die Bestätigung ausbleibt\
**Dann** wird kein unbestätigter Erfolg und kein sicherer Rollback behauptet. Während eines laufenden Vorgangs oder ohne Verbindung wird das zugehörige Formular nicht mehrfach gesendet; korrigierbare Eingaben bleiben ausschließlich im offenen Formular erhalten. Beim Verlassen beziehungsweise beim relevanten Sitzungsende werden persönliche Eingaben verworfen; Offline-Synchronisation wird nicht angeboten.\
**Und** eine fehlgeschlagene oder unbestätigte Serverabmeldung verwirft dennoch lokalen Zugang und persönliche Ansichten, benennt den unbestätigten Widerruf und bietet eine ausdrückliche Wiederholung an. Nach unbestätigter Registrierung wird der ungewisse Ausgang neutral erklärt und der bestehende Anmeldeweg angeboten, ohne Kontoexistenzabfrage oder automatische erneute Kontoanlage. Unbestätigte Refresh-Rotation wird nach AC-3 behandelt.

**AC-8 — Zugang und rote Abmeldung erfüllen den UX-Prüfmaßstab**

**Angenommen** Registrierung, Anmeldung und die rote Abmeldung werden an den Viewports 320×568, 390×844, 768×1024 und 1280×800 CSS-Pixel verwendet\
**Wenn** die Person die Aufgaben mit Tastatur, Touch, Screenreader beziehungsweise bei 200 % Textgröße ausführt\
**Dann** bleiben Labels, Felder, Fehler, Status und Aktionen vollständig erreichbar, bei 320 CSS-Pixeln ohne horizontales Scrollen. Lesereihenfolge und Fokus sind sinnvoll; Statuswechsel und Fehler sind programmatisch verständlich.\
**Und** Textkontrast beträgt mindestens 4,5:1, erkennbare Kontrollgrenzen/Fokus mindestens 3:1; Farbe ist kein alleiniger Bedeutungsträger. Aktionen wachsen mit der Schrift, die Abmeldeaktion wahrt mindestens 44×44 CSS-Pixel und reduzierte Bewegung wird berücksichtigt. Abmeldung bleibt ausdrücklich beschriftet und wird nicht als Fehlerzustand dargestellt.

**AC-9 — Reale Browsernachweise und eigenständiger Abschluss**

**Angenommen** die v2-Anbindung des Browserzugangs ist umgesetzt\
**Wenn** die SPA gebaut und die gezielten HTTPS-Browserprüfungen mit echter API und temporärem PostgreSQL ausgeführt werden\
**Dann** belegen sie Registrierung/Anmeldung, Identitätsprüfung, Wiederherstellung/Erneuerung, rote Abmeldung, fehlgeschlagenen Widerruf, Kontowechsel, Tab-Koordination, Offline-/Fehlerzustände und gezielt verzögerte Antworten. Netzwerkprüfungen zeigen die sechs Zugangsfunktionen über v2; vorhandene Finanzaufgaben bleiben im unterstützten Übergangsstand funktionsfähig. Die vier UX-Prüfgrößen und die betroffenen Tastatur-/Fokus-/Kontrastfälle sind nachgewiesen.\
**Und** der Browserzugang ist auf Grundlage von Story 3.1 und dem Bestand vollständig bedienbar. Die späteren v2-Finanzrouten, der neue Ausgabenbereich und die v1-Stilllegung sind keine Voraussetzung zum Abschluss dieser Story; die neuen Finanzfunktionen bleiben bis zu ihren jeweiligen Freigaben gesperrt. Die Story erteilt keine Produktionsfreigabe.

### Story 3.3: Bestehende Ausgaben und Budgets verlustfrei weiterführen

Als Person mit bereits erfassten Finanzdaten\
möchte ich meine Ausgaben, Budgetstände und Sparziele nach der internen Umstellung unverändert weiter nutzen können,\
damit meine Historie erhalten bleibt und parallele Änderungen keine falschen oder nur teilweise gespeicherten Ergebnisse erzeugen.

**Anforderungsbezug:** Erhalt der bestehenden Finanzfunktionen FR-2 bis FR-10; NFR-1, NFR-2, NFR-4, NFR-5, NFR-7, NFR-8 und migrationsbezogener Teil von NFR-10. AR-1, AR-2, AR-3, AR-6, AR-9, AR-10, AR-11, AR-17 und benötigte Rollen-/Übergangs-/Prüfanteile von AR-18 bis AR-22. Bestehende Formulare, Datenzustände, Löschbestätigungen und neutrale Fehlermeldungen bleiben erhalten; diese Story beansprucht keine neuen visuellen UX-Bausteine oder vollständige UI-/Automatikabdeckung.

**Abhängigkeiten und Umfang:** Baut auf dem abgeschlossenen Bestand und Stories 3.1/3.2 auf. Umfasst die Überführung der bereits genutzten Budget- und Ausgabentabellen in die eigenen Datenzuständigkeiten `budget` und `expenses`, öffentliche Modulprojektionen/-befehle, äußere Finanzkoordination und gemeinsame technische Transaktions-/Kontext-/Geld-/Kalenderfunktionen. Die bestehenden Sparzielmutationen werden in dieselbe Koordinations-/Sperrgrenze eingebunden. Vorhandene v1-Finanzadapter verwenden diese neuen Zugänge mit unverändertem Vertrag; dadurch ist die Umstellung mit den vorhandenen Oberflächen und Daten vollständig prüfbar. Tabellen oder Geschäftsabläufe von `monthlysurplus`, negative Fortschrittswerte und der v2-Finanzvertrag entstehen bei ihrer jeweiligen fachlichen Verwendung in späteren Stories. Diese Story benötigt sie nicht.

**Abnahmekriterien:**

**AC-1 — Datenbestand durch neue Migrationen erhalten**

**Angenommen** eine Datenbank enthält Konten, Ausgaben mehrerer Monate, mehrere wirksame Budgetstände und manuell gepflegte Sparziele aus dem bisherigen Migrationsstand\
**Wenn** die neue versionierte Flyway-Migration kontrolliert vor Aufnahme der Finanzzugriffe ausgeführt wird\
**Dann** besitzen `expenses` und `budget` jeweils ihre eigenen Schemas und Datenzugriffe. Sämtliche vorhandenen IDs, Eigentümer, Ausgabennamen/-beträge/-daten, Budgetbeträge/-wirksamkeitsmonate und Sparzielwerte bleiben erhalten; es entsteht kein zweiter unabhängig beschreibbarer Finanzbestand. Vorhandene Migrationen bleiben unverändert.\
**Und** derselbe Migrationspfad funktioniert für eine frische Datenbank und für den befüllten bisherigen Stand. Es werden ausschließlich für diese Bestandsfunktionen benötigte Objekte angelegt oder überführt; manuelle Fortschritte werden nicht als Monatsanrechnung rekonstruiert.

**AC-2 — Öffentliche Zugänge statt fremder Datenzugriffe**

**Angenommen** die Finanzdaten sind ihren Modulen zugeordnet\
**Wenn** Ausgaben, Budget, Monatsübersicht oder bestehende Sparziele gelesen beziehungsweise geändert werden\
**Dann** rufen HTTP-Adapter äußere Anwendungsfälle auf, die ausschließlich öffentliche Befehle/Projektionen der Eigentümermodule koordinieren. `expenses` liefert insbesondere die exakte Summe eines vorgegebenen Monats; `budget` den historisch für einen vorgegebenen Monat gültigen Betrag oder fehlendes Budget. Die bestehende Sparzielverwaltung erhält ebenfalls einen schmalen öffentlichen Zugang.\
**Und** Geschwistermodule importieren weder einander noch die äußere Koordination und lesen/schreiben keine fremden Tabellen oder Repositories. Öffentliche Modulprojektionen exportieren keine internen Repositorytypen. Gemeinsame Infrastruktur enthält ausschließlich technische Funktionen und keinen fachlichen Finanzdatenbesitz oder fachlichen Ablauf.

**AC-3 — Äußerer Commit bestimmt die Bestätigung**

**Angenommen** ein Finanzanwendungsfall wird für ein verifiziertes Konto gestartet\
**Wenn** er einen oder mehrere öffentliche Modulzugänge ausführt\
**Dann** eröffnet die äußere Koordination die Transaktion und bindet vor dem Fachzugriff den Webkontokontext. Sämtliche beteiligten Module teilen dieselbe physische Verbindung und Transaktion, ohne innere Commits, Wechsel des Kontos oder Wechsel der Rolle/Verbindung.\
**Und** eine erfolgreiche Mutation wird erst nach dem äußeren Commit bestätigt. Ein gezielt verursachter Fehler nach einem Modulschreibzugriff oder ein Commitfehler hinterlässt keine teilweise bestätigte beziehungsweise bereits innen festgeschriebene Änderung. Modulfunktionen eröffnen keinen davon unabhängigen Transaktionsabschluss.

**AC-4 — Alle vorhandenen Finanzmutationen serialisieren je Konto**

**Angenommen** Ausgaben-, Budget-, Ziel- oder Fortschrittsmutationen desselben Kontos treffen gleichzeitig ein, auch über die noch unterstützten v1-Adapter\
**Wenn** sie zustandsabhängige Fachwerte lesen oder schreiben\
**Dann** erwerben sie zuvor dieselbe transaktionsgebundene PostgreSQL-Kontosperre aus der kanonischen Konto-UUID mit Hash-Seed 14 über einen gemeinsamen technischen Zugang. Das gilt auch für leere Konten, Budgetänderungen, Zielanlage/-bearbeitung/-löschung und manuelles Fortschrittsersetzen.\
**Und** der Fachzustand wird unter READ COMMITTED erst nach Sperrerwerb gelesen. Erfolgreich bestätigte Änderungen gehen nicht durch veraltete Gesamtwerte verloren. Verschiedene Konten verwenden getrennte Sperrschlüssel; kein v1-Finanzmutationspfad umgeht diese gemeinsame Grenze.

**AC-5 — Ein Kalenderkontext je Anwendungsfall**

**Angenommen** eine Mutation wartet über eine Monats- oder Tagesgrenze auf die Kontosperre\
**Wenn** sie nach Sperrerwerb fortgesetzt wird\
**Dann** wird genau ein fachlicher Zeitpunkt und daraus der Tag beziehungsweise Monat nach `Europe/Berlin` bestimmt und an die öffentlichen Modulzugänge weitergereicht. Ausgabenerfassungsdatum, Budgetwirksamkeitsmonat und zugehörige Berechnungen verwenden denselben Kontext; kein Modul bestimmt den aktuellen Monat innerhalb dieses Anwendungsfalls erneut.\
**Und** Erfassungsdatum und Eigentümer bestehender Ausgaben bleiben bei Bearbeitung unverändert; neue Ausgaben erhalten weiterhin ausschließlich den serverseitigen Tag. Sommer-/Winterzeit und abweichende Gerätezeitzonen verändern die Fachzuordnung nicht. Zieldaten bleiben unveränderte Kalenderdaten ohne Zeitumrechnung.

**AC-6 — Konsistente Monatsansicht ohne gemeinsames Fach-SQL**

**Angenommen** Budget oder Ausgaben ändern sich gleichzeitig mit einer Monatsabfrage\
**Wenn** die äußere Koordination die Monatsübersicht zusammensetzt\
**Dann** werden Budgetprojektion und Ausgabensumme auf derselben read-only REPEATABLE-READ-Verbindung/Transaktion mit einem einmal vor den Teilabfragen bestimmten fachlichen Zeitpunkt/Monat gelesen. Das bisherige gemeinsame SQL über Budget- und Ausgabentabellen entfällt; kein Modul greift zur Zusammenstellung auf fremde Tabellen zu.\
**Und** die Antwort enthält einen konsistenten Snapshot: gültiges Budget, eigene laufende Monatsausgaben und deren exakte Differenz. Fehlendes Budget und Rest bleiben von einem ausdrücklich gesetzten Nullbudget unterscheidbar; negatives Restbudget bleibt erhalten. Ein Budgetwechsel betrifft den laufenden und folgende Monate, nicht die abgeschlossenen Budgetstände. Die Ausgabenhistorie enthält weiterhin alle Monate.

**AC-7 — RLS und Rollen gelten auch nach der Überführung**

**Angenommen** die migrierte Anwendung wird mit ihrer vorgesehenen Weblaufzeitrolle gestartet\
**Wenn** sie Finanzdaten liest oder ändert beziehungsweise eine Datenbankverbindung wiederverwendet\
**Dann** stammen Konto und transaktionslokales `app.user_id` ausschließlich aus dem verifizierten JWT-`sub`; genau ein Konto gilt je Transaktion. Abfragefilter und erzwungene PostgreSQL-RLS setzen dieselbe Eigentümergrenze durch. Fehlender Kontext verweigert Finanzzugriff; ein Abfragefilter für Konto A bei abweichendem RLS-Kontext B liefert keine Finanzdaten beziehungsweise lässt keine Mutation zu. Eigentümerfelder aus Requests können den verifizierten Kontokontext nicht ersetzen. Nach Transaktionsende bleibt auf wiederverwendeten Verbindungen kein wirksamer vorheriger Kontokontext zurück.\
**Und** die Laufzeitrolle ist weder Tabellenbesitzer noch Superuser, hat kein `BYPASSRLS` und keinen Wechsel in Besitzer-/Migrationsrollen. Für die überführten Objekte erforderliche Rollenrechte werden auch auf bereits initialisierten Volumes wiederholbar bereitgestellt; der Migrator benötigt kein `CREATEROLE`. Finanz-/Zugangsgeheimnisse bleiben außerhalb versionierter Dateien. Jobberechtigungen werden mit dieser Story nicht ersatzweise durch erweiterte Webrechte abgebildet.

**AC-8 — Bestandsfunktionen und Geldgrenzen bleiben verbindlich**

**Angenommen** vorhandene Oberflächen oder API-Clients verwenden die unterstützten v1-Finanzoperationen\
**Wenn** sie eigene Ausgaben erfassen/bearbeiten/löschen, Budgets ändern, Monatswerte lesen oder Sparziele und manuellen Gesamtfortschritt verwalten\
**Dann** funktionieren diese Vorgänge über die neue Koordination mit denselben fachlichen Ergebnissen, Antwortformen, Bestätigungsgrenzen und neutralen Fehlern für fremde beziehungsweise nicht vorhandene Ressourcen. `api-contract/openapi.yaml` bleibt unverändert; v2-Zugang und Browseranbindung aus Stories 3.1/3.2 bleiben nutzbar.\
**Und** gespeicherte und berechnete Geldwerte sind exakte EUR-Cent innerhalb der sicheren Grenzen; überschreitende Mutationen werden vollständig abgelehnt. Ausgabe und Zielbetrag bleiben positiv, Budget ab null. Solange v1 unterstützt wird, bleiben Fortschrittseingaben/-antworten nichtnegativ und Monatsautomatik serverseitig gesperrt. Die bestehende Monatsbudgetformel und manuelle Ersetzungssemantik ändern sich nicht.

**AC-9 — Geprüfter Übergangs- und Rücknahmestand**

**Angenommen** die Anwendung wird mit dem migrierten Schema-/Rollenzustand betrieben und neue signierte Werte beziehungsweise Monatswirkungen sind weiterhin gesperrt\
**Wenn** der Umstellungsnachweis dokumentiert wird\
**Dann** benennt er den getesteten Migrationsweg und einen gegen genau diesen Zustand geprüften v1-kompatiblen Release als möglichen Rücknahmestand für die weitere Einführung. Ein beliebiger alter Release wird nicht ungeprüft als migrationskompatibel angenommen.\
**Und** weder Code-Rücknahme noch Wiederanlauf schneiden Finanzdaten ab oder überschreiben sie. Die spätere v1-Stilllegung und Freigabebarriere bleiben als eigenständige Voraussetzungen erhalten; diese interne Migration allein erteilt weder die neue Funktions- noch eine Produktionsfreigabe.

**AC-10 — Architektur-, Migrations- und Konkurrenznachweise**

**Angenommen** Modulzugänge, Migration und Koordination sind umgesetzt\
**Wenn** die betroffenen Prüfungen ausgeführt werden\
**Dann** belegen ausführbare Architekturprüfungen Datenbesitz/Abhängigkeitsrichtung und echte PostgreSQL-Integrationstests die frische/befüllte Migration mit mindestens zwei Konten und mehreren Budget-/Ausgabenmonaten, Rollen/RLS, fehlenden/fremden Kontext, Verbindungswiederverwendung, gemeinsamen Rollback, kontoweite Serialisierung und konsistente Monatsabfragen unter gezielt überlappenden Mutationen. Monatsgrenz-/Zeitumstellungsfälle und sichere Summengrenzen sind eingeschlossen.\
**Und** die bestehenden v1-Finanzprüfungen, v2-Zugangsprüfungen und passenden Browserregressionen mit den bisherigen Finanzansichten bleiben erfolgreich. Die Story ist mit Bestandsoberfläche und vorhandenen Operationen unabhängig abschließbar; eine spätere v2-Finanzroute, neue Navigation oder Automatik wird nicht vorausgesetzt. Die historischen Done-Nachweise bleiben unverändert; neue Prüfergebnisse beziehen sich ausdrücklich auf den migrierten Zustand.

### Story 3.4: Eigene Ausgaben im getrennten Bereich über API v2 verwalten

Als angemeldete Person\
möchte ich meine Ausgaben in einem eigenen Bereich erfassen, vollständig ansehen, bearbeiten und bestätigt löschen und anschließend den aktuellen Monatsrest prüfen können,\
damit Ausgabenverwaltung und Monatsüberblick klar getrennt und meine Änderungen zuverlässig erkennbar sind.

**Anforderungsbezug:** FR-2 bis FR-6, Erhalt der Restbudgetregel aus FR-8, FR-11, FR-12 und FR-13 für sämtliche vorhandenen Systemtexte. NFR-1 bis NFR-7, Bestands-/Versionsanteil von NFR-10 und NFR-11. AR-4, AR-6, AR-9 bis AR-11 sowie einschlägige Adapter-/Browser-/Prüfanteile von AR-19/AR-22. UX-DR1, UX-DR2, UX-DR4, UX-DR5, UX-DR7, UX-DR9 bis UX-DR18, Ausgaben-/Monatsanteil von UX-DR19, Übernahme von UX-DR20, UX-DR21, Finanzmutationsanteil von UX-DR28 und Ausgaben-/Monatsanteil von UX-DR29. Gesamte Historie, Bearbeiten und Löschen ziehen gemäß der ausdrücklich übernommenen Quellenannahme mit in den Bereich Ausgaben.

**Abhängigkeiten und Umfang:** Baut auf Stories 3.1 bis 3.3 und der bestehenden Ausgabenverwaltung auf. Umfasst den v2-Ausgabenvertrag mit vier Operationen, dünne Adapter über die bereits vorhandene öffentliche Finanzkoordination sowie den vollständigen Browserablauf in einer geschützten Route `/ausgaben`. Die vorhandenen Budget-/Monats- und Sparzieloperationen bleiben im internen Übergangsstand über ihre funktionierenden v1-Adapter nutzbar, bis ihre eigenen v2-Verträge und Verbraucher umgestellt werden. Dadurch ist diese Story ohne spätere Finanzroute ausführbar. Die neue Oberfläche bleibt bis zum vollständigen v2-Wechsel und Freigabenachweis ein interner Entwicklungs-/Prüfstand. Zusätzliche Datenbankobjekte werden für diesen Ausgabenablauf nicht benötigt; Monatsautomatik und ihre historischen Korrekturen folgen als zusammenhängender Umfang in Epic 4.

**Abnahmekriterien:**

**AC-1 — V2-Ausgabenvertrag vor seinen Verbrauchern**

**Angenommen** der versionierte v2-Vertrag und die Generator-/Prüfinfrastruktur aus Story 3.1 sind vorhanden\
**Wenn** die Ausgabenoperationen vor Adapter- und Browserimplementierung festgelegt werden\
**Dann** beschreibt `api-contract/v2/openapi.yaml` unter `/api/v2` die Operationen `GET /expenses`, `POST /expenses`, `PUT /expenses/{expenseId}` und `DELETE /expenses/{expenseId}`. Anfragen enthalten die bearbeitbaren Angaben Name und ganzzahlige `amountCents`; Antworten liefern die serverseitige ID, Name, Betrag und Erfassungsdatum als Kalenderdatum. Eigentümer und Datum sind keine frei wählbaren Mutationsangaben. Erfolgsantworten sind 200 für Lesen/Bearbeiten, 201 für Anlage und 204 ohne Körper für bestätigtes Löschen. 400, 401, identische neutrale 404 für fremde/fehlende Einträge und unbestätigte Serverfehler sind vertraglich festgelegt.\
**Und** Grenzen, Fehler-/Feldfehlerformen, `no-store` und Bearer-Anforderungen sind eindeutig definiert. Die Erweiterung bleibt innerhalb von v2 kompatibel mit dem vorhandenen Zugang; v1 bleibt eingefroren. Getrennte Generatorausgaben und Kompilier-/Kompatibilitätschecks erfassen beide unterstützten Versionen ohne manuelle Bearbeitung generierter Dateien.

**AC-2 — Geschützte Adapter verwenden die bestätigte Koordination**

**Angenommen** ein Client ruft eine v2-Ausgabenoperation auf\
**Wenn** die API den Zugriff verarbeitet\
**Dann** bestimmt ausschließlich das verifizierte JWT-`sub` das Konto. Die Adapter verwenden dieselben äußeren Anwendungsfälle, öffentlichen Modulzugänge, physische Transaktion und Kontosperre wie die v1-Adapter aus Story 3.3; Datenzugriffe unterliegen Abfragefilter und erzwungener RLS.\
**Und** fehlender/ungültiger Zugang oder allein vorhandene Refresh-/CSRF-Cookies eröffnen keinen Finanzzugriff. Bearer-Mutationen werden nur für die konkret vorgesehenen Methoden/Pfade in die Sicherheitsregeln aufgenommen; Sitzungs-CSRF-/Origin-Schutz und die Ablehnung unbekannter Routen werden nicht pauschal gelockert. Erfolgs- und Fehlerantworten setzen `Cache-Control: no-store`; fremde und nicht vorhandene Einträge sind anhand der API-Antwort nicht unterscheidbar.

**AC-3 — Drei Hauptbereiche mit eigener Ausgabenroute**

**Angenommen** die Person ist angemeldet\
**Wenn** sie die Hauptnavigation benutzt oder `/ausgaben` direkt öffnet\
**Dann** sind Monat, Ausgaben und Sparziele in dieser Reihenfolge per Touch und Tastatur erreichbar. Monat bleibt Startansicht und enthält Budgetverwaltung und Monatsübersicht; Ausgabenformular, vollständige Historie, Bearbeiten und Löschen befinden sich ausschließlich unter Ausgaben. Die bisherige Einbettung der Ausgabenverwaltung in Monat entfällt.\
**Und** der aktuelle Bereich ist sichtbar und programmatisch markiert; ein Wechsel ändert tatsächlich den Inhalt und fokussiert beziehungsweise kündigt die Hauptüberschrift an. Die geschützte Route bewahrt Sitzungs-/Kontoprüfung und Generationsgrenzen. Alle drei Hauptbereiche verwenden die gemeinsame rote Abmeldeaktion aus Story 3.2. Automatik erhält keinen vierten Hauptbereich.

**AC-4 — Ausgabe exakt und erst nach Commit erfassen**

**Angenommen** der eigene Ausgabenbereich ist geladen\
**Wenn** die Person einen gültigen Namen und positiven Eurobetrag mit höchstens zwei Nachkommastellen eingibt und ausdrücklich speichert\
**Dann** wird exakt in ganzzahlige Cent umgerechnet und über v2 gespeichert; die Ausgabe erhält serverseitig das aktuelle Erfassungsdatum nach `Europe/Berlin` aus dem gemeinsamen Kontext nach Sperrerwerb und den verifizierten Eigentümer. Erst nach bestätigtem äußerem Commit erscheint der neue Eintrag mit bestätigter ID in der Historie und darf der Entwurf als erfolgreich gespeichert geleert werden.\
**Und** leere Namen, ungültige beziehungsweise nichtpositive Beträge, mehr als zwei Euro-Nachkommastellen und gespeicherte oder berechnete Summen außerhalb der sicheren Centgrenzen werden ohne stille Rundung und ohne Teilmutation abgelehnt. Die bisherige Namens-/Trimvalidierung bleibt erhalten. Geldfeld und Fehler haben sichtbare Labels, EUR-Hinweis und programmatische Zuordnung; das Geldfeld ist mindestens 48 CSS-Pixel hoch.

**AC-5 — Vollständige eigene Historie und unveränderliche Herkunft**

**Angenommen** eigene Ausgaben aus mehreren Monaten sind vorhanden\
**Wenn** die Person die Historie lädt oder Name/Betrag eines Eintrags bearbeitet\
**Dann** zeigt der Bereich alle eigenen Monate mit Name, Betrag und Erfassungsdatum, in der bisherigen stabilen Reihenfolge Datum absteigend und anschließend ID. Monatswechsel kürzt die Liste nicht. Bearbeiten ersetzt ausschließlich die erlaubten Werte; ID, Eigentümer und Erfassungsdatum bleiben unverändert. Erst die bestätigte v2-Antwort aktualisiert den gespeicherten Listenstand.\
**Und** die Monatssummengrenze wird beim Bearbeiten für den ursprünglichen Erfassungsmonat geprüft. Desktop verwendet eine semantische Tabelle, schmale Ansichten entsprechend beschriftete linear lesbare Einträge; sichtbare Bearbeiten-/Löschen-Aktionen benötigen weder Hover noch Gesten. Fehlerhafte/unvollständige oder der alten Sitzung zugehörige Antworten werden nicht als bestätigte Historie übernommen.

**AC-6 — Löschen ausdrücklich bestätigen und Fokus erhalten**

**Angenommen** die Person wählt eine eigene Ausgabe zum Löschen aus\
**Wenn** sich die Bestätigung öffnet oder sie bestätigt beziehungsweise abbricht\
**Dann** nennt der Dialog Eintrag und Löschfolge, bietet getrennte Aktionen für Abbrechen/Löschen und hält den Fokus im Dialog. Escape beziehungsweise Abbrechen erhält die Daten; die ausdrückliche Bestätigung löst genau den zugehörigen v2-Löschaufruf aus. Währenddessen wird Doppelsenden verhindert.\
**Und** der Eintrag verschwindet erst nach bestätigtem Commit. Der Fokus kehrt bei Abbruch zum Auslöser zurück; nach Entfernung des Auslösers zum nächsten sinnvollen Eintrag oder zur Erfassungsaktion. Fehlgeschlagenes/unbestätigtes Löschen wird nicht als Erfolg ausgegeben und wird nach AC-9 behandelt. Andere Konten bleiben unverändert.

**AC-7 — Nächste Monatsansicht zeigt den konsistenten neuen Stand**

**Angenommen** Anlage, Betragsänderung oder Löschung einer Ausgabe ist bestätigt\
**Wenn** die Person anschließend Monat öffnet, auch über Zurück-/Vorwärtsnavigation\
**Dann** werden gültiges Budget, eigene laufende Ausgabensumme und Restbudget aus der konsistenten aktuellen Monatsabfrage neu geladen; vorherige Werte und verzögerte ältere Antworten werden nicht als frischer Stand übernommen. Die Monatsabfrage darf im internen Übergang weiterhin den funktionierenden v1-Adapter aus Story 3.3 verwenden.\
**Und** `Restbudget = gültiges Monatsbudget − eigene Ausgaben des laufenden Monats` bleibt exakt. Die Änderung einer historischen Ausgabe eines anderen Monats verändert den laufenden Rest nicht. Fehlendes Budget fordert zur Festlegung auf statt einen Rest zu erfinden, gesetztes null bleibt unterscheidbar und negatives Restbudget samt Überschreitungshinweis bleibt lesbar. Ein offener anderer Formularentwurf wird durch die Aktualisierung nicht stillschweigend überschrieben.

**AC-8 — Systemtexte vereinfachen und Kalendersemantik erhalten**

**Angenommen** die Person verwendet Monat, Ausgaben oder Sparziele einschließlich Fehler-/Hilfszuständen und assistiver Ausgabe\
**Wenn** sie die systemseitigen Beschriftungen, Hinweise, Tooltips und zugänglichen Hilfstexte liest\
**Dann** enthalten diese keine Zeitzonenerläuterungen wie „in Berlin“, „Kalender in Berlin“ oder „Europe/Berlin“. Die fachliche Bedeutung bleibt verständlich, etwa mit einem Hinweis auf automatisch gesetztes Datum und fortlaufendes Budget. Deutsche EUR-/Datumsformate bleiben erhalten; normale Produkttexte enthalten keine API-/Infrastrukturdiagnose.\
**Und** nutzereigene Texte wie „Berlin-Fahrt“ bleiben unverändert. Interne Tages-/Monatsgrenzen einschließlich Sommer-/Winterzeit und Kalenderdaten werden nicht geändert; eine andere Gerätezeitzone verschiebt weder Erfassungsdatum noch Monatszuordnung. Die genaue sachliche Mikrocopy bleibt UX-Ausgestaltung innerhalb des bestätigten Vertrags.

**AC-9 — Lade-, Fehler-, Offline- und Sitzungszustände bewahren Entwürfe**

**Angenommen** der Ausgabenbereich lädt oder eine Mutation läuft\
**Wenn** ein Feldfehler, sicherer Fehlschlag, Verbindungsverlust oder unbestätigter Ausgang eintritt\
**Dann** werden Laden, bestätigter Erfolg und Fehler textlich sowie assistiv unterscheidbar angezeigt. Leere Historie bietet die Erfassung an; noch nicht geladene Werte erscheinen nicht als bestätigte leere Liste. Feldfehler bleiben zugeordnet und Eingaben im offenen Formular erhalten. Während des zugehörigen Vorgangs oder offline wird nicht mehrfach gesendet; keine Offline-Synchronisation oder dauerhafte Browserablage wird eingeführt.\
**Und** bei unbestätigtem Ausgang wird weder Erfolg noch sicherer Rollback behauptet. Vor einer erneuten Mutation als Wiederholungsversuch ist der aktuelle Listenstand zu ermitteln und der ungewisse Vorgang zu prüfen; eine neue Anlage wird nicht blind automatisch wiederholt oder lediglich anhand gleichen Namens/Betrags als erfolgreich erklärt. Abmeldung, Ablauf oder Kontowechsel verwerfen persönliche Werte/Entwürfe; späte Antworten bringen weder alte Finanzdaten noch Erfolgsmeldungen zurück.

**AC-10 — Zugängliche Ausgabenabläufe an allen Prüfpunkten**

**Angenommen** die Person nutzt Navigation, Erfassung, Historie, Bearbeiten oder Löschdialog bei 320×568, 390×844, 768×1024 oder 1280×800 CSS-Pixeln\
**Wenn** sie die Aufgaben per Tastatur/Touch/Screenreader und bei 200 % Textgröße durchführt\
**Dann** bleiben Kernaufgaben bei 320 CSS-Pixeln ohne horizontales Scrollen bedienbar; Labels, lange Namen/Beträge, Datum, Status und Aktionen werden nicht abgeschnitten. Semantische Überschriften/Formulare/Navigation/Tabelle, programmatische Fehler, sichtbarer nicht verdeckter Fokus und sinnvolle Lesereihenfolge bleiben erhalten.\
**Und** Text erreicht mindestens 4,5:1, Kontrollgrenzen/Fokus mindestens 3:1; Farbe ist kein alleiniger Bedeutungsträger. Touch-Ziele sind mindestens 44×44 CSS-Pixel, Geldfelder mindestens 48 CSS-Pixel hoch und mit Schrift wachsend; reduzierte Bewegung wird berücksichtigt. Die drei UX-Mockups dienen als visuelle Referenz, die Spines bleiben maßgeblich.

**AC-11 — Vertrags-, PostgreSQL- und Browsernachweise**

**Angenommen** v2-Ausgabenadapter und der getrennte Bereich sind umgesetzt\
**Wenn** die betroffenen Vertrags-/Kompilierchecks, Backend-Integrationstests und HTTPS-Browserprüfungen mit echter API und temporärem PostgreSQL ausgeführt werden\
**Dann** belegen sie alle vier v2-Ausgabenoperationen, Bestandsdaten nach Migration, zwei getrennte Konten, neutrale Fremd-/Fehl-ID-Antworten, exakte Einzel-/Monatssummengrenzen, unveränderliche Erfassungsdaten und Commit-/Fehlerfälle. Browsernachweise umfassen alle Monate, Navigation/Startansicht, die rote Abmeldung in drei Bereichen, gültige/ungültige Eingaben, Löschabbruch/-bestätigung, Offline/unbestätigten Ausgang, verzögerte Antworten und den frischen Monatsrest nach Anlage/Bearbeiten/Löschen.\
**Und** Text-/Kalenderfälle prüfen ausdrücklich „Berlin-Fahrt“, fehlende systemseitige Zeitzonenhinweise einschließlich zugänglicher Texte sowie abweichende Gerätezeitzone und Zeitumstellungen. Netzwerkprüfungen zeigen Zugang und Ausgaben über v2; vorhandene Budget-/Zielaufgaben bleiben im unterstützten internen Übergangsstand funktionsfähig. Bestehende v1-Kompatibilitäts-/Sicherheitsprüfungen bleiben erfolgreich. Alle beschriebenen Abläufe sind auf Bestand und Stories 3.1 bis 3.3 ausführbar; vollständige v2-Freigabe, signierter Fortschritt und Monatsautomatik werden dadurch nicht vorweggenommen.

### Story 3.5: Monatsbudget und Restbudget über API v2 prüfen und ändern

Als angemeldete Person\
möchte ich unter Monat mein fortlaufendes Budget festlegen oder ändern und den aktuellen Monatsrest über den neuen Zugang zuverlässig sehen,\
damit ich meine verfügbaren Budgetmittel ohne Nebenrechnung erkenne und abgeschlossene Budgetstände erhalten bleiben.

**Anforderungsbezug:** FR-2, FR-3, FR-7, FR-8, FR-11 sowie Erhalt der Bereichstrennung und Textregeln aus FR-12/FR-13. NFR-1 bis NFR-7, webbezogener Konkurrenzanteil von NFR-8, Versionsanteil von NFR-10 und NFR-11. AR-4, AR-6, AR-9, AR-10, AR-11 sowie Budget-/Monatsanteile von AR-19/AR-22. UX-DR1, UX-DR2, UX-DR4, UX-DR5, UX-DR6, UX-DR9 und die einschlägigen Lade-/Fehler-/Text-/Sitzungs-/Zugänglichkeitsregeln aus UX-DR11 bis UX-DR18; Budget-/Monatsanteil von UX-DR19, Erhalt der gemeinsamen Abmeldung nach UX-DR20, Behandlung unbestätigter Speicherung nach UX-DR28 und aktuelle Rückkehransicht nach UX-DR29.

**Abhängigkeiten und Umfang:** Baut auf Stories 3.1 bis 3.4 und der bestehenden Budget-/Monatsoberfläche auf. Umfasst drei v2-Operationen samt Vertrag, dünne Adapter über die bestätigte Koordination, die Browserumstellung auf diese Operationen und gezielte Zustands-/Konkurrenznachweise. Historische Budgetstände bleiben im bestehenden Eigentümermodul; zusätzliche Datenbankobjekte oder eine Oberfläche zur rückwirkenden Budgetbearbeitung sind dafür nicht erforderlich. Die bisher funktionsfähigen Sparzieloperationen bleiben im internen Übergangsstand nutzbar, bis ihr eigener v2-Ablauf umgestellt wird. Zum Nutzen und Prüfen dieser Story wird weder eine spätere Zieloperation noch die Monatsautomatik benötigt.

**Abnahmekriterien:**

**AC-1 — Eindeutiger v2-Vertrag für Budget und Monatsübersicht**

**Angenommen** v2-Zugang und v2-Ausgabenvertrag sind vorhanden\
**Wenn** die Budget-/Monatsoperationen vor ihren Adaptern und Browser-Verbrauchern festgelegt werden\
**Dann** beschreibt `api-contract/v2/openapi.yaml` unter `/api/v2` `GET /budget`, `PUT /budget` und `GET /month-summary`. `PUT /budget` verlangt nichtnegative ganzzahlige `amountCents`; die Budgetantwort enthält `amountCents` als gültigen Betrag oder ausdrücklich null bei fehlendem Budget. Die Monatsantwort definiert den aktuellen Monat als reines Kalenderdatum am Monatsersten sowie `budgetCents`, `expensesCents` und `remainingCents` mit verbindlichen Grenzen und Nullable-Semantik. Bei fehlendem Budget sind Budget und Rest null; Ausgaben bleiben die tatsächliche nichtnegative Monatssumme.\
**Und** 200-Erfolgsantworten, 400 mit Budget-Feldfehlern, 401 und neutrale unbestätigte Serverfehler, Bearer-Schutz sowie `Cache-Control: no-store` sind festgelegt. Der Vertrag bietet keine frei wählbare Kontozuordnung, rückwirkende Budgetmutation oder Budgetlöschung. Die Erweiterung bleibt mit dem unterstützten v2-Vertrag kompatibel; v1 bleibt eingefroren. Beide Versionen werden getrennt generiert, kompiliert und gegen ihre eigene Basis geprüft.

**AC-2 — Konto und Transaktionsgrenzen bleiben maßgeblich**

**Angenommen** eine Budget- oder Monatsoperation wird über v2 aufgerufen\
**Wenn** die API den Anwendungsfall ausführt\
**Dann** bestimmt ausschließlich das verifizierte JWT-`sub` den Kontokontext. Der Adapter verwendet die äußere Finanzkoordination und öffentlichen Budget-/Ausgabenzugänge aus Story 3.3; Abfragefilter, erzwungene RLS, gemeinsame Verbindung und das transaktionslokale `app.user_id` schützen denselben Datenbestand wie v1.\
**Und** Cookies allein eröffnen keinen Finanzzugriff. Methoden-/Pfadfreigaben sind auf die vorgesehenen Operationen begrenzt; unbekannte Routen und die bestehenden CSRF-/Origin-Regeln der Sitzungsfunktionen werden nicht pauschal geöffnet. Budgetmutationen verwenden vor zustandsabhängigem Lesen dieselbe Kontosperre, die Monatsabfrage die bestätigte read-only REPEATABLE-READ-Lesesicht. Erfolg einer Mutation gilt erst nach äußerem Commit.

**AC-3 — Fortlaufendes Budget ohne rückwirkende Änderung**

**Angenommen** eine Person hat noch kein Budget oder bereits monatswirksame Budgetstände\
**Wenn** sie ihr Budget über v2 festlegt oder ändert\
**Dann** gilt der bestätigte Betrag sofort im laufenden und in folgenden Monaten bis zur nächsten Änderung. Mehrere Änderungen desselben Monats ersetzen den für diesen Monat gültigen Betrag; abgeschlossene Budgetstände bleiben unverändert. Fehlendes Budget und ausdrücklich gespeichertes null bleiben unterscheidbar.\
**Und** der Wirksamkeitsmonat stammt aus dem einmal nach Kontosperrerwerb bestimmten serverseitigen Kontext nach `Europe/Berlin`. Wartet ein Vorgang über eine Monatsgrenze, gilt dieser Kontext nach Sperrerwerb. Eine Gerätezeitzone oder ein vom Client behaupteter Monat kann keinen historischen Budgetstand überschreiben. Die öffentliche Budgetprojektion liefert weiterhin den für einen angegebenen Herkunftsmonat historisch gültigen Betrag für spätere interne Verbraucher.

**AC-4 — Geldwerte exakt eingeben und prüfen**

**Angenommen** die Person bearbeitet das Monatsbudget in der Oberfläche\
**Wenn** sie einen Eurobetrag ausdrücklich speichert\
**Dann** akzeptiert die Anwendung null bis zum sicheren Maximum von 9.007.199.254.740.991 Cent, verarbeitet ganze EUR-Cent exakt und erhält die bisher zulässige Eingabe mit Komma oder Punkt als Dezimaltrennzeichen ohne Tausendertrennzeichen. Negative Werte, mehr als zwei Euro-Nachkommastellen, ungültige Formate und Grenzüberschreitungen werden ohne stille Rundung abgelehnt. Auch die API akzeptiert nur gültige ganzzahlige Centwerte statt numerischer Strings, boolescher Werte oder gebrochener Cent.\
**Und** das Geldfeld hat sichtbares Label und EUR-Hinweis, mindestens 48 CSS-Pixel Höhe, programmatisch zugeordneten Feldfehler und sinnvolle Fehlerfokussierung. Ein sicher gescheiterter Speichervorgang verändert weder Budget noch Monatswerte und erhält den Entwurf im offenen Formular.

**AC-5 — Monatswerte aus einem konsistenten Snapshot**

**Angenommen** Budgetstände und eigene Ausgaben mehrerer Monate sind vorhanden und können gleichzeitig geändert werden\
**Wenn** die v2-Monatsübersicht geladen wird\
**Dann** liest die äußere Koordination gültiges Budget und eigene Ausgabensumme für denselben einmal bestimmten laufenden Monat über die öffentlichen Modulprojektionen auf derselben read-only REPEATABLE-READ-Verbindung. Eine zwischen den Teilabfragen bestätigte Mutation erzeugt keinen gemischten Budget-/Ausgabenstand.\
**Und** es gilt exakt `remainingCents = budgetCents − expensesCents`; Einnahmen, Sparzielstände und spätere Sparanrechnungen verändern die Formel nicht. Ohne Budget bleibt der Rest nicht berechenbar, bei Nullbudget ist er die tatsächliche Differenz und darf negativ sein. Gespeicherte und fachlich berechnete Centwerte bleiben innerhalb ±9.007.199.254.740.991; ungültige oder grenzüberschreitende Bestände führen zu einem neutralen Ladefehler statt gerundeter oder abgeschnittener Werte.

**AC-6 — Monat verwendet die v2-Operationen vollständig**

**Angenommen** die Person ist angemeldet und öffnet Monat\
**Wenn** Budgetverwaltung und Monatsübersicht laden oder ein Budget gespeichert wird\
**Dann** verwendet die Oberfläche ausschließlich die drei vorgesehenen v2-Operationen samt generierten Schnittstellen/Typen, über den bestehenden Proxy und Sitzungs-Interceptor. Fehler lösen für diese Operationen keinen stillen Rückfall auf v1 aus. Monat bleibt Startansicht und zeigt Budgetverwaltung, laufende Ausgabensumme und prominentes Restbudget; die Ausgabenverwaltung bleibt im eigenen Bereich aus Story 3.4.\
**Und** fehlendes Budget führt zur Festlegung statt zu einem erfundenen Rest. Ein gültiges Nullbudget erscheint als null, ein negativer Rest mit tatsächlichem Minus und verständlichem Überschreitungshinweis. Noch nicht geladene und fehlgeschlagen geladene Werte werden nicht als bestätigtes Nullbudget oder frischer Stand ausgegeben. Die rote Abmeldung bleibt erreichbar.

**AC-7 — Neue Monatsstände übernehmen, offene Eingaben erhalten**

**Angenommen** eine Budget- oder Ausgabenmutation wurde bestätigt oder die Person kehrt nach einem Monatswechsel zurück\
**Wenn** die betroffene Monatsansicht neu geladen beziehungsweise erneut geöffnet wird\
**Dann** wird der aktuelle konsistente Stand über v2 ermittelt. Nach Ausgabenmutationen aus Story 3.4 verwenden auch Rückkehr und Zurück-/Vorwärtsnavigation die v2-Monatsübersicht; veraltete frühere Antworten überschreiben keinen bereits neueren bestätigten Stand. Änderungen anderer Monate verändern die laufende Ausgabensumme nicht.\
**Und** ein offen bearbeiteter Budgetentwurf wird durch Hintergrund-/Monatsantworten nicht stillschweigend ersetzt. Budgetanzeige und Monatszusammenfassung dürfen sich durch unterschiedlich alte Antworten nicht widersprechen; die bestehende Revisions-/Generationskontrolle wird auf v2 erhalten. Die Erkennung eines relevanten Monatswechsels bleibt auf den bestätigten serverseitigen Kalenderinformationen aufgebaut und hängt nicht von einer abweichenden Gerätezeitzone ab.

**AC-8 — Speichern, Fehler und ungewisser Ausgang sind unterscheidbar**

**Angenommen** ein Budgetentwurf ist geöffnet oder die Monatsansicht wird geladen\
**Wenn** die Person speichert, ein Feld-/Serverfehler eintritt, die Verbindung fehlt oder eine Bestätigung ausbleibt\
**Dann** werden Speichern, bestätigter Erfolg, Ladefehler und Feldfehler verständlich sowie assistiv angekündigt. Während des zugehörigen Speicherns oder offline wird nicht mehrfach gesendet; sicher fehlerhafte Eingaben bleiben korrigierbar im offenen Formular. Ein unbestätigter Vorgang wird weder als Erfolg noch als sicher zurückgerollt ausgegeben.\
**Und** vor einer Wiederholung eines unbestätigten Speichervorgangs wird der aktuelle Stand ermittelt und der nächste Schritt ausdrücklich angeboten, ohne den erhaltenen Entwurf durch eine ältere Leseantwort zu verlieren. Es gibt keine automatische erneute Budgetmutation oder Offline-Synchronisation. Fehlerantworten bleiben neutral und verraten keine fremden Daten oder internen Details. Protokolle enthalten keine tatsächlichen Geldbeträge, personenbezogenen Finanztexte oder Zugangsnachweise.

**AC-9 — Sitzungsgrenzen gelten für Werte und Antworten**

**Angenommen** Budgetdaten, ein Entwurf oder eine noch ausstehende Budget-/Monatsantwort gehören zu Konto A\
**Wenn** Abmeldung, Ablauf oder ein Wechsel zu Konto B die Sitzung verändert\
**Dann** werden die bisherigen Finanzwerte und persönlichen Entwürfe aus dem Browserarbeitsspeicher verworfen, geschützte Ansichten geschlossen und keine Antwort aus der alten Sitzungs-/Ansichtsgeneration übernommen. Auch ein spät bestätigtes Budget-PUT bringt weder alte Beträge noch Erfolgsmeldungen in die neue Sitzung zurück.\
**Und** nach neuer Anmeldung werden ausschließlich Werte des neuen Kontos geladen. Finanzdaten und kurzfristige Tokens gelangen nicht in `localStorage`, `sessionStorage` oder andere dauerhafte Browserablagen; Fehlerentwürfe verbleiben ausschließlich im offenen Formular.

**AC-10 — Zugänglicher Monatsüberblick ohne technische Zeitzonentexte**

**Angenommen** die Person nutzt Budgetformular und Monatsübersicht bei 320×568, 390×844, 768×1024 oder 1280×800 CSS-Pixeln\
**Wenn** sie den Betrag eingibt, die Werte prüft oder Fehler korrigiert, auch mit Tastatur/Screenreader und bei 200 % Textgröße\
**Dann** bleiben Kernaufgaben bei 320 CSS-Pixeln ohne horizontales Scrollen bedienbar; lange Beträge, Vorzeichen, Labels, Status und Aktionen werden nicht abgeschnitten. Semantische Überschriften/Formulare, sichtbarer nicht verdeckter Fokus, programmatische Beschriftungen/Fehler und verständliche Statusankündigungen bleiben erhalten. Aktionen sind mindestens 44×44 CSS-Pixel und Geldfelder mindestens 48 CSS-Pixel hoch, wachsen mit der Schrift und berücksichtigen reduzierte Bewegung.\
**Und** Design-Tokens, mindestens 4,5:1 Textkontrast beziehungsweise 3:1 für Kontrollgrenzen/Fokus sowie textliche Bedeutung zusätzlich zur Farbe gelten weiter. Deutsche EUR-/Datumsformate bleiben erhalten. Sichtbare und zugängliche Systemtexte nennen keine Zeitzonenerläuterungen; interner Kalender und nutzereigene Texte bleiben unverändert.

**AC-11 — Nachweise für v2, Historie und konkurrierende Monatswerte**

**Angenommen** die drei v2-Operationen und ihre Browseranbindung sind umgesetzt\
**Wenn** die passenden Vertrags-/Kompilierchecks, echten PostgreSQL-Integrationstests und HTTPS-Browserprüfungen ausgeführt werden\
**Dann** belegen sie fehlendes Budget bei vorhandenen Ausgaben, explizites null, gültige normale/Maximalwerte, ungültige Formate/Grenzüberschreitungen, fortlaufende Gültigkeit und unveränderte abgeschlossene Budgetstände. Zwei Konten, Bearer-/RLS-Schutz, gemeinsamer Rollback/Commitfehler, Monatsgrenze nach Sperrerwerb, Sommer-/Winterzeit, abweichende Gerätezeitzone und ein Commit zwischen den getrennten Snapshot-Teilabfragen sind eingeschlossen.\
**Und** Browsernachweise prüfen die aktuelle v2-Monatsansicht nach Budget- und Ausgabenmutationen, Revisionskonkurrenz, offene Entwürfe, verspätete Antworten, Konto-/Sitzungsende, Offline/unbestätigten Ausgang, negative Restanzeige und alle vier UX-Prüfgrößen. Netzwerkprüfungen zeigen Zugang, Ausgaben, Budget und Monatsübersicht über v2. Die bestehenden v1-Adapter bleiben für unterstützte Altoberflächen kompatibel; Sparzielaufgaben im internen Übergangsstand bleiben bedienbar. Die Story ist mit Stories 3.1 bis 3.4 eigenständig abschließbar und gibt weder negative Sparfortschritte noch Monatsautomatik oder den Produktionsbetrieb frei.

### Story 3.6: Eigene Sparziele und Gesamtfortschritt über API v2 pflegen

Als angemeldete Person\
möchte ich meine Sparziele über den neuen Zugang anlegen, ansehen, bearbeiten, bestätigt löschen und ihren Gesamtfortschritt manuell ersetzen können,\
damit ich meine bestehenden Ziele ohne Datenverlust weiterpflege und ihren tatsächlichen Fortschritt verständlich erkenne.

**Anforderungsbezug:** FR-2, FR-3, Bestandsverwaltung aus FR-9, manueller Ersetzungs-/Darstellungsanteil von FR-10, FR-11 und Erhalt von FR-12/FR-13. NFR-1 bis NFR-7, webbezogener Konkurrenzanteil von NFR-8, Versionsanteil von NFR-10 und NFR-11. AR-4, AR-6, AR-9 bis AR-11 sowie die hier benötigten Freigabe-/Adapter-/Prüfanteile von AR-19/AR-22. UX-DR1, UX-DR2, UX-DR4, UX-DR5 für Zielbetrag und derzeit freigegebenen Fortschritt, UX-DR8, UX-DR9, Bestandslöschung aus UX-DR10, UX-DR12 bis UX-DR18, manueller Teil von UX-DR19, Erhalt von UX-DR20, UX-DR25 bis UX-DR29. Monatsbindungen und automatisierungsbezogene Löschfolgen aus FR-9/FR-10 werden mit Epic 4 ergänzt; tatsächliche negative Eingabepersistenz und mobile Minuseingabe folgen erst nach der Versionsbarriere.

**Abhängigkeiten und Umfang:** Baut auf Stories 3.1 bis 3.5 und den abgeschlossenen Sparzielstories aus Epic 2 auf. Umfasst den v2-Zielvertrag mit fünf Operationen, dünne Adapter über die vorhandene äußere Koordination, Browserumstellung und vorzeichenfähige Darstellung. Die bestehende Zielablage wird weiterverwendet; eine neue Beitrags- oder Verlaufstabelle entsteht nicht. Negative Schreibwerte bleiben serverseitig gesperrt und die bestehende nichtnegative Datenbankgrenze wird in dieser Story nicht aufgeweitet. Die gesamte bisher nutzbare Zielpflege ist mit null und positiven Fortschrittswerten unabhängig abschließbar. Der voll signierte v2-Antwortvertrag wird von Beginn an definiert, damit seine spätere Nutzung keine inkompatible v2-Antworterweiterung erfordert.

**Abnahmekriterien:**

**AC-1 — Vollständiger v2-Zielvertrag mit künftig signiertem Bereich**

**Angenommen** der v2-Vertrag und seine Prüf-/Generatorwege stehen bereit\
**Wenn** die Zieloperationen vor ihren Verbrauchern festgelegt werden\
**Dann** beschreibt `api-contract/v2/openapi.yaml` unter `/api/v2` `GET /savings-goals`, `POST /savings-goals`, `PUT /savings-goals/{id}`, `DELETE /savings-goals/{id}` und `PUT /savings-goals/{id}/progress`. Zielfelder sind Name, positiver `targetAmountCents` und optionales Kalenderdatum `targetDate`; Fortschrittsersatz verwendet `progressCents`. Antworten liefern eigene ID, Name, Zielbetrag, tatsächlichen Gesamtfortschritt und das ausdrücklich beschriebene optionale/nullfähige Zieldatum. Der Fortschritt ist im v2-Anfrage-/Antwortschema bereits als ganzzahliger Bereich ±9.007.199.254.740.991 definiert; der positive Zielbetrag behält seine Grenze.\
**Und** 200 für Lesen/Bearbeiten/Ersetzen, 201 für Anlage, 204 ohne Körper für Löschen sowie 400, 401, neutrale identische 404 für fremde/fehlende IDs und unbestätigte Serverfehler sind festgelegt. Für einen syntaktisch gültigen, aber noch gesperrten negativen Fortschrittswert ist eine eindeutige Funktionssperre mit 409 und neutralem Fehlercode `FEATURE_NOT_AVAILABLE` beschrieben. Der Vertrag nennt die Freigabebedingung ausdrücklich; Daten- und Zugriffsschutz werden dadurch nicht gelockert. V1 bleibt unverändert, beide Versionen werden separat generiert, kompiliert und gegen ihre eigene Basis auf Kompatibilität geprüft.

**AC-2 — Gemeinsame gesicherte Zielkoordination**

**Angenommen** eine v2-Zieloperation trifft ein\
**Wenn** sie eigene Ziele liest oder verändert\
**Dann** wird das Konto ausschließlich aus dem verifizierten JWT-`sub` abgeleitet. Die Adapter verwenden öffentliche Zugänge von `savingsgoals` über die äußere Koordination aus Story 3.3; Mutationen teilen Kontosperre, transaktionslokalen Kontext und äußeren Commit mit den unterstützten v1-Operationen. Keine interne Repositoryprojektion oder fremde Modultabelle wird für die Antwort verwendet.\
**Und** Abfragefilter und erzwungene RLS verhindern Fremdzugriffe. Cookies allein geben keinen Finanzzugang; genaue Methoden-/Pfadregeln erhalten den bestehenden Sitzungs-CSRF-/Origin-Schutz und die Ablehnung unbekannter Routen. Erfolgs-/Fehlerantworten setzen `Cache-Control: no-store`. Fremde und nicht vorhandene Ziele verraten weder Inhalte noch Existenz; Fehler und Protokolle enthalten keine vertraulichen Werte oder Zugangsnachweise.

**AC-3 — Ziel anlegen und vollständigen eigenen Bestand ansehen**

**Angenommen** eine Person öffnet Sparziele oder legt ein Ziel mit gültigem Namen, positivem EUR-Zielbetrag und optionalem Datum an\
**Wenn** der v2-Aufruf erfolgreich abgeschlossen ist\
**Dann** zeigt die Liste ausschließlich die eigenen Ziele, stabil nach ID geordnet, einschließlich vorhandener manueller Fortschritte. Ein neu angelegtes Ziel erscheint erst nach bestätigtem Commit mit bestätigter ID und null Fortschritt; eine Zielanlage wählt kein Ziel für künftige Monatsüberschüsse aus.\
**Und** Name/Zielbetrag behalten die bisherigen Gültigkeits- und Trimregeln. Ein gültiges Datum zwischen 0001-01-01 und 9999-12-31 bleibt einschließlich eines vergangenen Datums ein unverändertes Kalenderdatum ohne Zeitumrechnung. Ohne Ziele wird verständlich zur Anlage geführt; ein Ladefehler wird nicht als bestätigte leere Liste ausgegeben.

**AC-4 — Zielbearbeitung erhält den tatsächlichen Fortschritt**

**Angenommen** ein eigenes Ziel mit manuell gepflegtem Fortschritt besteht\
**Wenn** Name, Zielbetrag oder optionales Datum über v2 ersetzt werden\
**Dann** bleiben ID, Eigentümer und Gesamtfortschritt erhalten. Ein leeres Datumsfeld wird vertraglich als entferntes Datum übermittelt; fehlendes beziehungsweise null Datum im Ersetzungsaufruf entfernt es wie im bisherigen Vertrag. Anteil und Balken werden nach bestätigtem Commit anhand des neuen positiven Zielbetrags berechnet.\
**Und** ungültige Namen/Daten, Zielbetrag null oder negativ, mehr als zwei Euro-Nachkommastellen und Grenzüberschreitungen werden ohne stille Rundung und ohne Teilmutation abgelehnt. Der offene Entwurf und zugeordnete Feldfehler bleiben zur Korrektur erhalten. Bearbeiten eines Ziels überschreibt keinen zwischenzeitlich gültigen Fortschritt durch einen veralteten gespeicherten Gesamtwert.

**AC-5 — Manueller Fortschritt ersetzt den Gesamtbetrag**

**Angenommen** ein eigenes Ziel ist vorhanden und die Person gibt einen im aktuellen Freigabestand zulässigen Fortschrittsbetrag ein\
**Wenn** sie ausdrücklich „Gesamtfortschritt ersetzen“ beziehungsweise die gleichbedeutende Aktion absendet\
**Dann** ersetzt der bestätigte Betrag den bisherigen Gesamtfortschritt, statt als Einzelbeitrag addiert zu werden. Null, eine Verringerung und Werte über dem Zielbetrag sind zulässig; Zielname, Zielbetrag und Datum bleiben erhalten. Die Wiederholung desselben Ersetzungsbetrags wirkt idempotent. Die Bedienung erklärt die Ersetzungssemantik, statt eine Einzahlung oder Bankübertragung zu suggerieren.\
**Und** eingegebene EUR-Beträge werden exakt in ganze Cent umgerechnet, mehr als zwei Nachkommastellen und sichere Grenzüberschreitungen abgelehnt. Es entsteht kein Nutzer-Beitragsverlauf oder getrenntes Fortschrittsunterkonto; der Monatsrest ändert sich durch manuelles Ersetzen nicht. Bestätigung und sichtbare Übernahme folgen dem äußeren Commit, Doppelsenden wird verhindert.

**AC-6 — Tatsächliche vorzeichenfähige Fortschrittsanzeige**

**Angenommen** ein gültiger v2-Zielwert innerhalb des signierten Antwortbereichs wird durch Darstellungsfunktionen verarbeitet\
**Wenn** Betrag, Prozentwert und Fortschrittsbalken berechnet und zugänglich ausgegeben werden\
**Dann** behalten Betrag und Prozentwert ihren tatsächlichen Stand einschließlich negativem Vorzeichen oder Übererfüllung; ausschließlich die Balkenfüllung ist auf 0–100 % begrenzt. Bei −30 € von 100 €: −30 € und −30 %, Balken 0 %; bei 150 €: 150 € und 150 %, Balken 100 %; bei 70 €: 70 % und entsprechende Füllung. Ein negativer Stand wird nicht als separate Schuld oder ungültiger Zielwert umgedeutet.\
**Und** die bisherige exakte BigInt-Prozentberechnung mit kaufmännischer Rundung auf höchstens zwei Nachkommastellen und deutscher Darstellung wird für Vorzeichen konsistent fortgeführt. Auch sichere Extremwerte bei einem Zielbetrag von einem Cent erzeugen weder Überlauf noch Exponentialschreibweise. Geldbeträge werden nicht gerundet oder abgeschnitten. Assistive Ausgabe nennt den tatsächlichen Betrag/Prozentwert und darf bei tatsächlichen −30 % nicht widersprüchlich 0 % als finanziellen Stand ausgeben; der rein visuelle Balken kann entsprechend der UX-Annahme verborgen werden. Negative Darstellungsfälle werden in dieser Story isoliert geprüft und erzeugen keine negativen Finanzdaten im laufenden v1-Übergang.

**AC-7 — Negative Schreibwerte bleiben ohne Versionsbarriere gesperrt**

**Angenommen** v1 wird weiterhin unterstützt oder der erforderliche Freigabenachweis liegt noch nicht vor\
**Wenn** ein direkter v2-Aufruf einen negativen Gesamtfortschritt für ein eigenes vorhandenes Ziel zu schreiben versucht\
**Dann** verweigert das serverseitig geschlossene Freigabegate den Vorgang mit der dokumentierten Funktionssperre vor einer Finanzmutation. Die nichtnegative Bestandsvalidierung/-persistenz schützt weiterhin denselben Datenbestand, und die Datenbankgrenze wird noch nicht aufgeweitet. Eine bloße Frontendsperre genügt nicht.\
**Und** v1 liefert weiterhin ausschließlich kompatible nichtnegative Fortschrittsantworten; es werden keine echten negativen Werte verborgen, auf null abgeschnitten oder für v1 umgedeutet. Die Oberfläche bietet im aktuellen Übergangsstand keine als erfolgreich nutzbar dargestellte negative Schreibfunktion an. Es gibt keinen Aktivierungsweg, der ohne nachgewiesene v1-Lese-/Schreibbarriere signierte Werte freigibt. Die spätere negative Eingabe-/Persistenzfreigabe ist eigener Umfang nach dieser Barriere; diese Story ist mit vollständiger nichtnegativer v2-Zielpflege unabhängig nutzbar.

**AC-8 — Ziel samt Fortschritt bestätigt löschen**

**Angenommen** die Person wählt ein eigenes Ziel zum Löschen\
**Wenn** sie den Dialog abbricht beziehungsweise ausdrücklich bestätigt\
**Dann** benennt der Dialog das Ziel und den Verlust seines tatsächlichen Fortschritts. Escape/Abbrechen erhält die Daten; Bestätigen verwendet die v2-Löschoperation und entfernt das Ziel erst nach bestätigtem Commit. Fokus bleibt während der Bestätigung eingeschlossen und kehrt bei Abbruch zum Auslöser beziehungsweise nach Entfernung zu einem sinnvollen Ziel oder zur Anlageaktion zurück.\
**Und** Doppelsenden und Löschen ohne Verbindung werden verhindert. Bei fehlgeschlagenem/unbestätigtem Ausgang wird kein Erfolg behauptet und der Stand nach AC-9 geklärt. Die künftigen Regeln zu ausgewähltem Automatikziel, offenen Vormerkungen und verbrauchten historischen Bindungen werden in Epic 4 vor Automatikfreigabe ergänzt; Zielpflege in diesem noch nicht aktivierbaren Automatikstand benötigt keinen Nachhollauf.

**AC-9 — Browser nutzt v2 und schützt bestätigte Werte und Entwürfe**

**Angenommen** die Person lädt oder bearbeitet ihre Ziele\
**Wenn** die fünf Zieloperationen, Fehler-/Offlinezustände oder Hintergrundantworten verarbeitet werden\
**Dann** verwendet die Oberfläche ausschließlich die vorgesehenen v2-Operationen mit generierten Schnittstellen/Typen und ohne stillen Rückfall auf v1. Laden, Speichern, Erfolg, Feldfehler und unbestätigter Ausgang sind textlich sowie assistiv unterscheidbar. Bei sicherem Fehler/offline bleibt der Entwurf ausschließlich im offenen Formular; bei unbestätigtem Ausgang wird vor einem Wiederholungsversuch der aktuelle Zielstand ermittelt und keine neue Anlage blind wiederholt.\
**Und** Hintergrund-/ältere Antworten überschreiben weder offenen Entwurf noch neueren bestätigten Gesamtfortschritt. Sitzungsende und Kontowechsel verwerfen persönliche Ziele/Werte/Entwürfe; späte Antworten bringen sie nicht zurück. Finanzdaten und kurzfristige Tokens bleiben außerhalb dauerhafter Browserablagen, Offline-Synchronisation wird nicht angeboten. Navigation und rote Abmeldung aus Stories 3.2/3.4 bleiben erhalten; Systemtexte enthalten keine Zeitzonenerläuterungen und verändern keine nutzereigenen Namen.

**AC-10 — Zugängliche Zielpflege in vier Prüfgrößen**

**Angenommen** Sparzielanlage, Bearbeitung, Fortschrittsersatz, Darstellung oder Löschdialog werden bei 320×568, 390×844, 768×1024 oder 1280×800 CSS-Pixeln genutzt\
**Wenn** die Person Tastatur, Touch oder Screenreader beziehungsweise 200 % Textgröße verwendet\
**Dann** bleiben Kernaufgaben bei 320 CSS-Pixeln ohne horizontales Scrollen vollständig bedienbar. Lange Beträge, Minuszeichen, Prozentwerte, Daten und Aktionen bleiben erkennbar. Sichtbare Labels, programmatische Fehler-/Statusbezüge, semantische Struktur und logischer nicht verdeckter Fokus entsprechen dem UX-Vertrag.\
**Und** Aktionen sind mindestens 44×44 CSS-Pixel und Geldfelder mindestens 48 CSS-Pixel hoch, wachsen mit der Schrift und berücksichtigen reduzierte Bewegung. Text erreicht mindestens 4,5:1, Kontrollgrenzen/Fokus mindestens 3:1; Fortschritt wird zusätzlich zur Farbe textlich vermittelt. Die Fortschrittsanzeige, Balkenbreite und assistive Ausgabe werden auch für die isolierten negativen Darstellungsfälle geprüft. Mobile tatsächlich freigegebene Minuseingabe wird mit der späteren negativen Schreibfreigabe abgenommen.

**AC-11 — Nachweise für Zielpflege und sichere Übergangsgrenze**

**Angenommen** v2-Zieladapter und Browseranbindung sind umgesetzt\
**Wenn** die passenden Vertrags-/Kompilierchecks, echten PostgreSQL-Integrationstests und HTTPS-Browserprüfungen ausgeführt werden\
**Dann** belegen sie alle fünf Operationen mit Bestandsdaten und zwei Konten, Anlage mit Start null, Datum-null-Roundtrip, unveränderten Fortschritt bei Zielbearbeitung, idempotentes Gesamtersetzen, Verringerung/Übererfüllung, ungültige Werte/Daten, sichere Grenzen, Rollen/RLS, neutrale Fremd-/Fehl-IDs und gemeinsamen Rollback/Commitfehler. Negative direkte Schreibversuche im noch unterstützten v1-Stand scheitern ohne Datenwirkung und ohne inkompatible v1-Antwort. Die unveränderte Datenbankgrenze bleibt nachgewiesen.\
**Und** isolierte Parser-/Darstellungs-/Prozentprüfungen belegen signierte Antwortverarbeitung, die Beispiele −30/70/150 bei Ziel 100 und sichere Extremwerte; dafür werden keine negativen Daten in einem v1-erreichbaren Datenbestand erzeugt. Browsernachweise prüfen Ziel-/Fortschrittsentwürfe, Löschabbruch/-bestätigung, Fehler/offline/unbestätigten Ausgang, verspätete Antworten, Sitzungswechsel und alle vier UX-Prüfgrößen. Netzwerkprüfungen zeigen sämtliche jetzt implementierten Zugangs- und Finanzoperationen der neuen Oberfläche über v2. Bestehende v1-Adapter bleiben bis zur kontrollierten Stilllegung kompatibel; die neue Oberfläche bleibt bis zum vollständigen Freigabenachweis ein interner Prüfstand. Keine spätere Story ist zur hier vollständig nutzbaren nichtnegativen v2-Zielpflege erforderlich.

### Story 3.7: Die neue Oberfläche nach sicherer v1-Stilllegung nutzen

Als Person mit bestehendem Konto und Finanzdaten\
möchte ich zur vollständig neuen Oberfläche wechseln können und bei einem veralteten Stand einen verständlichen Aktualisierungspfad erhalten,\
damit meine Daten erhalten bleiben und alte Zugriffe keine späteren Finanzänderungen unter einem überholten Vertrag verarbeiten.

**Anforderungsbezug:** Sicherer Übergang für FR-1 bis FR-13 und technische Voraussetzung für den signierten Teil von FR-10 sowie spätere FR-14 bis FR-17. NFR-1, NFR-2, NFR-6, NFR-7, NFR-10, NFR-11 und Erhalt der offenen Bedingungen aus NFR-12. AR-4, AR-5, AR-17 bis AR-23 mit Schwerpunkt AR-19/AR-20; UX-DR16, Aktualisierungspfad aus UX-DR28 und Erhalt der geprüften Hauptbereiche, roten Abmeldung sowie Fehler-/Entwurfsregeln aus UX-DR11/UX-DR15/UX-DR20/UX-DR29.

**Abhängigkeiten und Umfang:** Baut auf Stories 3.1 bis 3.6 und dem dort vollständig über v2 nutzbaren Browserablauf auf. Für den vorgesehenen Einzelhost mit einem Java-Artefakt wird ein dokumentierter Wechsel mit kontrollierter Wartungsunterbrechung verwendet: alte Zugriffe sperren, bisherige API vollständig stoppen, Ende ihrer Datenbankarbeit nachweisen und den geprüften v2-Stand starten. Ein unterbrechungsfreier Wechsel oder ein verteiltes Drain-Protokoll wird nicht vorausgesetzt. Die Umsetzung umfasst den geschützten Ablöse-/Start-/Rücknahmeweg, dauerhaften technischen Versions-/Nutzungszustand, v1-Ablehnung, Aktualisierungsweg und reale Übergangsnachweise. Technische Metadaten enthalten keine Finanzwerte oder personenbezogenen Monatsdaten; fachliche Automatikobjekte entstehen erst in Epic 4. Negative Fortschrittswerte werden in dieser Story weder gespeichert noch freigegeben.

**Abnahmekriterien:**

**AC-1 — Geprüfter und administrativ geschützter Ablöseplan**

**Angenommen** vollständiger v2-Vertrag, Module/Migrationen, Rollen und Oberfläche aus Stories 3.1 bis 3.6 liegen vor\
**Wenn** der Versionswechsel vorbereitet wird\
**Dann** benennt ein ausführbarer beziehungsweise reproduzierbar geprüfter Ablöseplan den konkreten Release-/Schema-/Rollenzustand, die laufende API-Instanz und ihre Datenbankverbindungen, Sperr-/Stopp-/Prüf-/Startreihenfolge, Fehlerabbruch und zulässigen Rücknahmestand. Vor dem Wechsel sind v2-Zugang einschließlich Registrierung/Anmeldung/Refresh/Logout, alle Finanzrouten, Security/CSRF/Origin, `no-store`, Proxy/Interceptor und vollständige Browserwege geprüft.\
**Und** der Wechsel wird ausschließlich über einen administrativ geschützten Betriebsweg ausgelöst, nicht über eine öffentliche Finanz- oder Nutzeraktion. Er erhält Produktionsgeheimnisse außerhalb versionierter Dateien und benötigt keine erweiterten Web-/Jobrechte auf fremde Finanzdaten. Ein normaler Client oder bloßer Frontendstatus kann keinen Stilllegungsnachweis erzeugen.

**AC-2 — Alte API und ihre Datenbankarbeit tatsächlich beenden**

**Angenommen** v1 nimmt noch Anfragen an und bereits zugelassene Vorgänge können ausstehen\
**Wenn** die kontrollierte Stilllegung beginnt\
**Dann** werden neue Zugriffe auf den bisherigen API-Stand gesperrt und die bisherige Java-Instanz kontrolliert vollständig beendet. Bereits zugelassene Vorgänge einschließlich GETs, noch vor dem ersten Fachzugriff wartender Anfragen, Mutationen und ihrer Transaktionen müssen abgeschlossen oder abgebrochen sein. Bei erzwungenem Abbruch wird zusätzlich das tatsächliche Ende der zugehörigen Datenbankarbeit/Transaktionen nachgewiesen.\
**Und** weder geschlossene Clientverbindung, abgelaufener HTTP-Timeout, verstrichene Wartezeit noch verschwundene Proxy-Verbindung allein gelten als Beweis. Alte API-Prozesse und zugehörige noch ausführbare Datenbankarbeit dürfen nicht parallel zum freigegebenen Nachfolgestand übrig bleiben. Bleibt Arbeit ungeklärt oder misslingt ein Prüfschritt, bleibt der Wechsel gesperrt; daraus wird keine erfolgreiche Versionsbarriere abgeleitet.

**AC-3 — Dauerhafter technischer Stilllegungs- und Nutzungszustand**

**Angenommen** die Stilllegung nach AC-2 ist nachgewiesen\
**Wenn** der neue Betriebszustand bestätigt wird\
**Dann** wird die v1-Stilllegung als dauerhafter technischer Zustand im Datenbestand festgehalten und für die unterstützten Start-/Freigabewege verbindlich. Der Zustand enthält ausschließlich technische Versions-/Freigabeinformationen, keine Konten, Geldbeträge, Finanztexte oder Monatsnachweise. Benötigte Metadaten werden durch neue Flyway-Migrationen eingeführt; bestehende Migrationen bleiben unverändert und Finanzbestände werden nicht kopiert oder umgedeutet.\
**Und** ein vorhandener technischer Zugang erlaubt später ausschließlich das Vorwärtssetzen eines dauerhaften Nutzungsmarkers für vorzeichenbehaftete Fortschrittswerte beziehungsweise Monatswirkungen innerhalb derselben äußeren Transaktion wie der entsprechende Effekt. Ein Rollback setzt auch diese unbestätigte Markeränderung zurück; nach Commit ist der Nutzungsmarker nicht über normale Konfiguration zurücksetzbar. Diese Story prüft den technischen Mechanismus ohne neue Finanzwirkung und hält beide fachlichen Freigabegates geschlossen. Fehlender oder widersprüchlicher Zustand wird nicht als Freigabenachweis behandelt.

**AC-4 — V1 wird vor Fachzugriff abgewiesen, v2 bleibt vollständig nutzbar**

**Angenommen** der neue Release startet mit bestätigter v1-Stilllegung\
**Wenn** ein alter oder neuer Client eine v1-Operation aufruft\
**Dann** wird sie unabhängig von gültigem JWT/Cookie bereits vor Ausführung des bisherigen Controllers oder fachlicher Datenbankarbeit abgewiesen. Das gilt für sämtliche bisherigen Lese-/Schreib- und Zugangsoperationen. Der Stilllegungsmodus verwendet eine eindeutige neutrale Antwort mit 401, Code `CLIENT_UPDATE_REQUIRED`, verständlichem Aktualisierungshinweis und einem festgelegten gleichursprünglichen Aktualisierungsziel; der bisherige Sitzungsendeweg alter Clients bleibt damit auslösbar. Die Antwort enthält keine Finanz-/Kontoinformationen und setzt `Cache-Control: no-store`.\
**Und** diese technische Ablehnung nach Stilllegung verändert nicht den archivierten eingefrorenen v1-Fachvertrag. Direkter API-Zugang und Zugang über den Proxy setzen dieselbe Sperre durch; reine Proxyumleitung genügt nicht als Schutz. Sämtliche neuen Nutzerwege verwenden vollständig v2 und fallen nicht still auf v1 zurück. Kein zuvor zugelassener v1-Read kann nach dieser Barriere noch Finanzwerte laden. Negative Fortschrittseingaben bleiben nach dem Vertrag aus Story 3.6 gesperrt und Automatik bleibt nicht aktivierbar.

**AC-5 — Neustart und Rücknahme können die Versionsgrenze nicht umgehen**

**Angenommen** die Stilllegung ist gespeichert und die Anwendung startet neu, ihre Konfiguration ändert sich oder ein vorheriger Release soll verwendet werden\
**Wenn** ein unterstützter Start-/Rücknahmeweg geprüft wird\
**Dann** wird der dauerhafte Zustand vor Aufnahme von Finanzzugriffen berücksichtigt. Ein Neustart oder eine veraltete Konfiguration öffnet v1 nicht automatisch wieder; bei fehlendem/widersprüchlichem Nachweis bleibt die neue fachliche Freigabe gesperrt und ein unsicherer Start wird verweigert beziehungsweise geschützt gehalten. Start-/Rücknahmewerkzeuge prüfen die Grenze auch vor einem älteren Binary, statt dessen Kenntnis neuer Metadaten vorauszusetzen.\
**Und** vor der ersten Nutzung signierter Fortschritte oder Monatswirkungen ist eine Rücknahme nur auf einen gegen genau den migrierten Schema-/Rollenzustand geprüften v1-kompatiblen Release über den dokumentierten kontrollierten Weg zulässig. Sobald der dauerhafte Nutzungsmarker gesetzt ist, scheitert jeder unterstützte Rückfall auf v1, auch wenn spätere Korrekturen alle aktuellen Fortschritte wieder nichtnegativ machen. Dann sind ausschließlich v2-kompatible Korrektur oder geprüfte Wiederherstellung vorgesehen; Finanzdaten werden für Code-Rücknahme weder abgeschnitten noch überschrieben. Wiederherstellung öffnet nicht ungeprüft alte Freigaben.

**AC-6 — Verständlicher Aktualisierungspfad für tatsächlich alte Oberflächen**

**Angenommen** eine bereits geladene veraltete Oberfläche trifft auf die Stilllegung oder eine Person öffnet einen alten gespeicherten App-Link\
**Wenn** der Client die Ablöseantwort verarbeitet beziehungsweise die Seite vollständig neu geladen wird\
**Dann** führen aktualisierungsfähige Oberflächen in einen geschlossenen persönlichen Zustand mit verständlichem Hinweis wie „Bitte lade die Seite neu“ und expliziter Aktualisierungsaktion. Das festgelegte gleichursprüngliche Ziel, etwa `/aktualisieren`, ist ohne Finanzzugang erreichbar und lädt den aktuellen Einstieg/Build; es übernimmt keine beliebige externe Zieladresse. Geschützte alte Werte/Entwürfe werden verworfen, gegebenenfalls wird neu angemeldet. Normale Systemtexte enthalten keine API-/Infrastrukturdiagnose.\
**Und** der tatsächlich bisherige v1-Bundle wird zusätzlich als Altclient geprüft: Fehlt ihm ein neuer Aktualisierungshandler, müssen bereits angemeldete Altansichten spätestens beim nächsten geschützten API- oder Sitzungserneuerungsversuch über den bestehenden Sitzungsendeweg schließen; vollständiges Browser-Neuladen der öffentlichen App-Adresse lädt nachweislich den v2-Stand. Dieser notwendige manuelle Pfad wird im Ablösehinweis dokumentiert. Bereits geladenes altes JavaScript wird nicht als aus der Ferne aktualisierbar angenommen. Alte Direktlinks und Zurück-/Vorwärtsnavigation eröffnen keinen erfolgreichen neuen v1-Datenzugriff.

**AC-7 — Unterbrochene Vorgänge und Sitzungen bleiben ehrlich behandelt**

**Angenommen** beim Wechsel sind noch Vorgänge mit ausstehender Antwort oder gültige bestehende Sitzungen vorhanden\
**Wenn** die Oberfläche aktualisiert und über v2 wieder geöffnet wird\
**Dann** bleiben verbindlich gespeicherte Konten, IDs, Eigentümer, Ausgaben-/Budgetstände und manuelle Zielwerte erhalten. Abgebrochene Transaktionen werden nicht als gespeichert bestätigt; bei unbestätigtem Ausgang wird zuerst der aktuelle v2-Stand ermittelt. Alte POST-/PUT-/DELETE-Anfragen werden nicht automatisch unter neuem Pfad wiederholt.\
**Und** der bestehende Sitzungsvertrag und seine Laufzeiten gelten weiter. Die v2-Oberfläche kann einen gültigen vorhandenen Zugang nach den bisherigen Cookie-/CSRF-/Origin-Regeln wiederherstellen oder verlangt verständlich eine neue Anmeldung. Späte Antworten alter Sitzungs-/Ansichtsgenerationen bringen weder persönliche Werte noch Erfolgsmeldungen zurück. Persönliche Entwürfe werden nicht für den Versionswechsel dauerhaft im Browser gespeichert; ihre Nichtübernahme beim Neuladen wird verständlich behandelt.

**AC-8 — Routing, Bereitschaftsprüfungen und Bedienhinweise verwenden den neuen Stand**

**Angenommen** der neue Betriebszustand wird lokal beziehungsweise in der vorgesehenen Einzelhostform gestartet\
**Wenn** SPA-Einstieg, Direktlinks, Proxy-/API-Routing, Bereitschaftsprüfungen und Prüfläufe verwendet werden\
**Dann** erreichen Monat, Ausgaben und Sparziele den aktuellen statischen Einstieg und alle Zugangs-/Finanzaufrufe ihre v2-Routen. Einstieg/Aktualisierungsziel und referenzierte Build-Dateien verhindern die erneute Ausgabe eines als aktuell behaupteten alten Einstiegs; fehlende alte Build-Dateien werden nicht als erfolgreiche API-/JavaScript-Antwort durch eine SPA-Fallbackseite ersetzt. V1 bleibt auch bei direktem Zugriff stillgelegt.\
**Und** lokale Start-/Testbereitschaftsprüfungen hängen nicht von einer stillgelegten v1-Route ab. CI unterscheidet den noch unterstützten Kompatibilitätsmodus und den geprüften Stilllegungsmodus; ein scheiternder Probeaufruf wird nicht stillschweigend als Bereitschaft gewertet. README und Ablösehinweise benennen v2, Aktualisierung, geschützten Wechsel, geprüfte Rücknahme und weiterhin offene Produktions-/Datenlebenszyklusbedingungen. Es wird kein tatsächlicher Produktionsrollout oder neuer Hostingdienst aus dieser Story abgeleitet.

**AC-9 — Reale Prozess-/PostgreSQL-Nachweise für die Barriere**

**Angenommen** der Ablauf und seine technischen Zustände sind implementiert\
**Wenn** die Übergangsprüfungen mit echten API-Prozessen und temporärem PostgreSQL laufen\
**Dann** belegen sie mindestens einen bereits zugelassenen GET vor seinem ersten Finanz-Lesezugriff, eine laufende Datenbankabfrage, eine Mutation vor Commit und eine bestätigte Mutation mit verlorener Antwort. Der Wechsel erfolgt erst nach deren tatsächlichem Abschluss/Abbruch; bei ungeklärter Arbeit oder fehlgeschlagenem Stopp wird kein Stilllegungsnachweis erzeugt. Nach der Barriere erreicht kein v1-Pfad mehr fachlichen Code oder Finanzabfragen.\
**Und** Neustart, widersprüchliche Konfiguration, direkte API- statt Proxyaufrufe und Rücknahme auf einen alten Startpfad umgehen die Sperre nicht. Ein kontrolliert gesetzter rein technischer Nutzungsmarker weist nach, dass v1-Rücknahme auch bei ausschließlich nichtnegativen aktuellen Testdaten verboten bleibt; dazu werden keine vorzeitig negativen Finanzdaten erzeugt. Transaktions-/Rollbacktests belegen das atomare Vorwärtssetzen des Markers. Die bisherigen Vertrags-/Generator-/Kompilierchecks und v1-Regressionsprüfungen laufen im unterstützten Modus weiterhin erfolgreich, die Stilllegungsprüfungen gesondert im gesperrten Modus.

**AC-10 — Browsernachweis mit altem und neuem Bundle und unabhängiger Abschluss**

**Angenommen** ein bisher tatsächlich unterstützter v1-Bundle und der neue v2-Bundle liegen als reproduzierbare Prüfreferenzen vor\
**Wenn** HTTPS-Browserprüfungen den Wechsel mit bestehenden Konten, offenen Ansichten und verspäteten Antworten durchführen\
**Dann** belegen sie die sichere Schließung alter geschützter Ansichten beim nächsten geschützten API-/Erneuerungsversuch, den nötigen vollständigen Reload, funktionierende alte App-Direktlinks, den aktuellen Build, frischen Kontozustand und ausschließlich v2-basierte neue Zugangs-/Finanzabläufe. Bestätigte Werte bleiben erhalten, ungewisse Mutationen werden nicht blind wiederholt, andere Konten werden nicht sichtbar. Ein bloßer Mock eines neuen Clients ersetzt den Altbundle-Nachweis nicht.\
**Und** Aktualisierungshinweis/-aktion sowie die drei vollständigen Hauptbereiche, rote Abmeldung, Fehler und Sitzungswechsel bleiben bei 320×568, 390×844, 768×1024 und 1280×800 CSS-Pixeln, Tastatur/Screenreader und 200 % Text im bestehenden UX-Prüfmaßstab bedienbar. Der technisch stillgelegte v1-Zustand mit vollständig nutzbarer v2-Oberfläche und weiterhin nichtnegativem manuellem Fortschritt ist ohne spätere Story abschließbar. Diese Story gibt weder signierte Fortschrittspersistenz noch Monatsautomatik oder Produktionsbetrieb mit echten Daten frei.

### Story 3.8: Tatsächlichen Gesamtfortschritt auch negativ speichern

Als angemeldete Person\
möchte ich den tatsächlichen Gesamtfortschritt eines eigenen Sparziels auch als negativen Betrag eingeben und unverändert wiedersehen können,\
damit mein eingetragener Stand erhalten bleibt und die Anzeige ihn weder auf null kürzt noch als separate Schuld führt.

**Anforderungsbezug:** Signierte manuelle Eingabe/Persistenz und vollständige tatsächliche Anzeige aus FR-10; Erhalt von FR-2, FR-3, FR-9 und FR-11 bis FR-13. NFR-1 bis NFR-7, webbezogener Konkurrenzanteil von NFR-8, NFR-10 und NFR-11. AR-4, AR-6, AR-9 bis AR-11, benötigte Migration nach AR-17 und signierte Freigabe-/Rücknahme-/Prüfanteile von AR-19/AR-20/AR-22. UX-DR5 für die tatsächliche mobile Minuseingabe, UX-DR8, UX-DR9, UX-DR14 bis UX-DR18, manueller Flow 2 aus UX-DR19, UX-DR25 bis UX-DR29 und Erhalt der übrigen Ziel-/Navigations-/Textregeln. Der signierte manuelle Eingabebereich bleibt die ausdrücklich übernommene Quellenannahme aus PRD §10. Automatische Anrechnungs-/Korrekturfälle M-01 bis M-17 werden weiterhin in Epic 4 vollständig abgenommen; diese Story liefert deren signierte Fortschrittsgrundlage.

**Abhängigkeiten und Umfang:** Baut ausschließlich auf Stories 3.1 bis 3.7 auf. Umfasst die additive Erweiterung des bestehenden Fortschritts-Constraints, den serverseitig freigegebenen absoluten Ersetzungsweg, einen lesbaren Funktionszustand für den Browser, vorzeichenfähige Eingabe und echte Persistenz-/Browsernachweise. Es entstehen weder Beitragsverlauf noch Monatsnachweise, Korrekturschuld oder getrennte Fortschrittskonten. Ein Hintergrundlauf oder eine spätere Automatikstory ist keine Voraussetzung für manuelles Ersetzen. Die signierte Antwortspanne ist bereits im v2-Vertrag aus Story 3.6 definiert und wird nicht nachträglich inkompatibel erweitert.

**Abnahmekriterien:**

**AC-1 — Bestehende Zielablage additiv für signierten Fortschritt erweitern**

**Angenommen** vorhandene Ziele enthalten gültige manuelle Fortschritte im bisherigen Bereich\
**Wenn** eine neue Flyway-Migration die vorzeichenbehaftete Persistenz bereitstellt\
**Dann** erlaubt der Fortschritts-Constraint exakt −9.007.199.254.740.991 bis +9.007.199.254.740.991 Cent. Die bisherige Nichtnegativitätsbedingung wird gezielt ersetzt, nicht bloß ersatzlos entfernt; Ganzzahltyp, sichere obere/untere Grenze, Eigentümergrenze, RLS und übrige Zielbedingungen bleiben erhalten. IDs, Name, Zielbetrag, Zieldatum und bisheriger Fortschritt werden nicht verändert. Alte Migrationen bleiben unverändert.\
**Und** Migration auf frischer und befüllter Datenbank ist nachgewiesen. Die erweiterte Datenbankstruktur allein öffnet keine negative Schreibfunktion: Ohne bestätigte Versionsbarriere und fachliche Freigabe bleiben negative API-Mutationen auch bei bereits erweitertem Constraint gesperrt. Dadurch können Erstinstallation und noch nicht freigegebener Übergang sicher vorbereitet werden.

**AC-2 — Server prüft Freigabe und liefert lesbaren Funktionszustand**

**Angenommen** der Browser benötigt den aktuellen Freigabestand für die Fortschrittseingabe\
**Wenn** der vor seinen Verbrauchern ergänzte v2-Vertrag und die Serverfunktion implementiert werden\
**Dann** definiert der Vertrag `GET /api/v2/capabilities` als Bearer-geschützten, nicht mutierenden Aufruf mit `Cache-Control: no-store` und einem eindeutigen booleschen Feld `signedProgressAvailable`. Der Wert wird aus dem bestätigten technischen Stilllegungszustand, dem erforderlichen Schema-/Releasezustand und der serverseitigen Funktionsfreigabe abgeleitet; die Antwort gibt keine Finanzwerte, Zugangsnachweise oder technischen Diagnoseinhalte für die Produktoberfläche aus. 200, 401 und ein neutraler Ladefehler sind definiert. Die neue Route wird kompatibel in die getrennten Generator-/Kompilier-/Vertragschecks aufgenommen.\
**Und** jeder negative Fortschritts-Schreibversuch prüft die wirksamen Voraussetzungen erneut im gebundenen Serverkontext. Ein Clientwert, veralteter positiver Capability-Cache oder einfacher Konfigurationsschalter ersetzt den Stilllegungsnachweis nicht. Bei gesperrtem Zustand bleibt 409 `FEATURE_NOT_AVAILABLE` aus Story 3.6 verbindlich, ohne Finanzmutation. Fehlender/widersprüchlicher Nachweis oder fehlgeschlagene Funktionsabfrage führt niemals zu einer angenommenen Freigabe; die bisherige nichtnegative Zielpflege bleibt nutzbar, soweit Zugang und Grundfunktionen verfügbar sind.

**AC-3 — Fortschrittsersatz und Nutzungsmarker sind atomar**

**Angenommen** die v1-Stilllegung ist vollständig nachgewiesen und die signierte Funktion ist serverseitig freigegeben\
**Wenn** ein zulässiger signierter Gesamtfortschritt für ein eigenes Ziel über `PUT /api/v2/savings-goals/{id}/progress` gespeichert wird\
**Dann** erfolgen Berechtigungs-/Freigabeprüfung, kontogesperrter Fortschrittsersatz und erforderliches Vorwärtssetzen des dauerhaften Nutzungsmarkers über die äußere Koordination auf derselben physischen Verbindung/Transaktion. Die erste bestätigte Nutzung signierter Fortschrittswerte markiert damit dauerhaft die Rücknahmegrenze; ein gezielter Fehler nach einem Teilzugriff oder beim Commit verwirft Fortschritt und noch unbestätigte Markeränderung gemeinsam.\
**Und** ein Wettlauf mit einem kontrollierten Rücknahmeversuch kann niemals einen negativen Wert verbindlich speichern und zugleich v1 wieder öffnen: Entweder bleibt die Versionsbarriere wirksam und der signierte Commit gilt, oder die erforderlichen Voraussetzungen gelten nicht und der Schreibversuch hat keine bestätigte Wirkung. Nach Nutzung bleibt der Rückfall auf v1 auch dann gesperrt, wenn später alle aktuellen Fortschritte wieder null/positiv sind. Die Start-/Rücknahmewege aus Story 3.7 setzen diese Grenze weiterhin durch.

**AC-4 — Negative Eingabe ersetzt den Gesamtstand exakt**

**Angenommen** die Person hat ein eigenes Ziel und die signierte Funktion ist verfügbar\
**Wenn** sie einen Fortschrittsbetrag mit führendem Minus, null oder einen positiven Betrag innerhalb der sicheren Grenzen ausdrücklich speichert\
**Dann** ersetzt der bestätigte Centwert den gesamten bisherigen Fortschritt. −30 € bei 100 € Ziel bleiben nach erneutem Laden −30 €; eine spätere manuelle Eingabe von 70 € ersetzt den Stand durch 70 € und wird nicht als Beitrag addiert. Name, Zielbetrag, Datum, Eigentümer und andere Ziele/Konten bleiben unverändert; der Monatsrest verändert sich nicht.\
**Und** es werden weder auf null gekürzte Geldwerte noch separate Korrekturschulden oder Verlaufs-/Unterkonten gespeichert. Ganze EUR-Cent werden exakt verarbeitet; mehr als zwei Euro-Nachkommastellen, ungültige Zeichen und Werte außerhalb ±9.007.199.254.740.991 werden ohne Rundung oder Teilmutation abgelehnt. Wiederholen desselben Gesamtersetzungswerts bleibt idempotent. Die spätere Monatsautomatik darf diesen unabhängigen absoluten Ersetzungsweg nicht von einem erfolgreichen Nachhollauf abhängig machen.

**AC-5 — Vorzeichen nur im Fortschrittsfeld freigeben**

**Angenommen** der signierte Funktionszustand ist für die aktuelle Sitzung geladen\
**Wenn** die Person das Fortschrittsformular am Smartphone oder Rechner öffnet und einen negativen Betrag eingibt\
**Dann** bleibt das Vorzeichen beim Vorbelegen eines bereits negativen Stands, Bearbeiten, Validieren und Übermitteln erhalten. Ein führendes ASCII-Minus ist tatsächlich eingebbar; die mobile Eingabehilfe darf die Minuseingabe nicht durch eine ausschließlich positive Dezimaltastatur verhindern. Die UI erklärt weiterhin das Ersetzen des Gesamtbetrags und behauptet weder Einzahlung noch Bankguthaben.\
**Und** die dafür angepassten Geldfunktionen geben negative Werte nicht versehentlich für andere Felder frei: Ausgaben und Zielbeträge bleiben positiv, Budget bleibt nichtnegativ. Unbekannter/gesperrter Funktionszustand gibt negatives Speichern nicht frei und wird verständlich behandelt; eine zwischen Laden und Speichern wirksam gewordene Sperre wird nach der Serverantwort neu abgeglichen, statt den erhaltenen Entwurf als gespeichert auszugeben. Eine veraltete Capability-Antwort aus einer beendeten Sitzung schaltet die Funktion nicht wieder ein.

**AC-6 — Tatsächliche Anzeige nach echter Speicherung**

**Angenommen** negative, normale oder übererfüllte Fortschritte sind zulässig über v2 gespeichert\
**Wenn** die Liste geladen, ein Ziel geöffnet oder dessen Zielbetrag geändert wird\
**Dann** zeigen Geldbetrag und Prozentwert den tatsächlichen Stand: bei −30 € von 100 € −30 % mit leerem Balken, bei 70 € 70 %, bei 150 € 150 % mit vollem Balken. Die in Story 3.6 vorbereiteten exakten signierten Darstellungs-/Prozentfunktionen werden mit echten persistierten Antworten verwendet; nur der Balken wird auf 0–100 % begrenzt. Die bestehende kaufmännische Prozentdarstellung auf höchstens zwei Nachkommastellen bleibt konsistent, ohne Geldwerte zu runden.\
**Und** sichere Extremwerte bei einem Zielbetrag von einem Cent erzeugen weder Überlauf noch Exponentialschreibweise. Tatsächliche Balkenfüllung und zugänglicher Text stimmen mit ihrer jeweiligen Bedeutung überein; assistive Ausgabe behauptet bei tatsächlichen −30 % nicht 0 % als finanziellen Stand. Nach Zielbearbeitung bleibt auch ein negativer Gesamtfortschritt erhalten, ein leeres Datum entfernt nur das Datum und ein neues Ziel startet weiter bei null.

**AC-7 — Fehler, Konto- und Sitzungsgrenzen erhalten die Datenregeln**

**Angenommen** ein signierter Entwurf, gespeicherter Zielwert oder ausstehender Capability-/Fortschrittsaufruf gehört zum aktuellen Konto\
**Wenn** ein Feldfehler, sicherer Speicherfehler, Verbindungsverlust, unbestätigter Ausgang, Sitzungsende oder Kontowechsel eintritt\
**Dann** werden Speichern, bestätigter Erfolg, Funktionssperre und Fehler verständlich sowie assistiv unterscheidbar angezeigt. Während des zugehörigen Speicherns und offline wird nicht doppelt gesendet; nach sicherem Fehler bleibt der Entwurf im offenen Formular erhalten. Bei unbestätigtem Ausgang wird vor Wiederholung der aktuelle Zielstand ermittelt und weder Erfolg noch sicherer Rollback behauptet.\
**Und** spätere Leseantworten überschreiben keinen neueren bestätigten Wert oder offenen Entwurf. Abmeldung/Ablauf/Kontowechsel verwerfen persönliche Werte/Entwürfe und entkräften späte Antworten einschließlich Capability-Freigaben und Erfolgsmeldungen. Keine Finanz-/Accessdaten werden dauerhaft im Browser gespeichert; Offline-Synchronisation wird nicht eingeführt. Fremde und fehlende Ziel-IDs bleiben neutral gleich behandelt; Protokolle enthalten keine tatsächlichen Geldbeträge, Finanztexte oder Zugangsnachweise.

**AC-8 — Zugängliche Minuseingabe und signierte Zustände**

**Angenommen** die Person verwendet den vollständigen Zielablauf bei 320×568, 390×844, 768×1024 oder 1280×800 CSS-Pixeln\
**Wenn** sie negative Eingabe, Speichern, erneutes Laden, Zielbearbeitung oder bestätigtes Löschen mit Tastatur/Touch/Screenreader und bei 200 % Textgröße ausführt\
**Dann** bleiben Minuszeichen, lange Beträge, tatsächliche Prozente, Status und Aktionen vollständig wahrnehmbar; Kernaufgaben funktionieren bei 320 CSS-Pixeln ohne horizontales Scrollen. Geldfelder sind mindestens 48 CSS-Pixel hoch, Aktionen mindestens 44×44 CSS-Pixel groß und wachsen mit der Schrift; Fokus, programmatische Labels/Fehler/Status und sinnvolle Lesereihenfolge bleiben erhalten.\
**Und** Textkontrast mindestens 4,5:1, Kontrollgrenzen/Fokus mindestens 3:1, zusätzliche textliche Bedeutung statt alleiniger Farbe und reduzierte Bewegung gelten weiter. Negative Werte werden nach Freigabe nicht als Eingabefehler behandelt. Die rote Abmeldung und drei Hauptbereiche bleiben konsistent; Systemtexte enthalten keine Zeitzonenerläuterungen oder technische Freigabediagnose.

**AC-9 — Datenbank-/API-Nachweise einschließlich echter v1-Barriere**

**Angenommen** Migration, serverseitiges Gate und signierter Ersetzungsweg sind umgesetzt\
**Wenn** Vertrags-/Kompilierchecks und echte PostgreSQL-/Prozessintegrationstests laufen\
**Dann** belegen sie positive Bestandsmigration, sichere Min-/Max-Werte, null, ungültige Centtypen/-grenzen, abgesicherte Capability-Antwort, Rollen/RLS, zwei getrennte Konten, fremde/fehlende Ziele, atomaren Marker-/Fortschrittsrollback und den Wettlauf mit Rücknahme. Geprüft werden gesperrte negative Mutation ohne Stilllegungsnachweis und erfolgreiche Mutation nach dem realen Ablauf aus Story 3.7; eine allein gesetzte Konfiguration öffnet den Pfad nicht.\
**Und** ein vor der Stilllegung zugelassener, vor seinem Finanzlesen verzögerter v1-GET kann auch beim anschließenden ersten tatsächlichen negativen Commit keine Finanzwerte mehr laden. Nach −30 € und späterem Ersetzen durch 70 € bleibt v1 trotz nun positivem Bestand gesperrt; ein alter Start-/Rücknahmepfad scheitert. Bisherige direkte Nichtnegativitätsprüfungen werden nur für die ausdrücklich ersetzte Fortschrittsregel angepasst; unveränderte Sicherheits-, Isolations- und Vertragsregeln bleiben nachgewiesen. Die archivierte v1-Schnittstelle bleibt unverändert und erhält keine negativen Antworten.

**AC-10 — Vollständige Browserprüfung und eigenständiger Abschluss von Epic 3**

**Angenommen** die signierte Funktion ist nach nachgewiesener Stilllegung tatsächlich freigegeben\
**Wenn** HTTPS-Browserprüfungen mit echter API und temporärem PostgreSQL den Zielablauf durchführen\
**Dann** belegen sie mobile/tastaturbedienbare Minuseingabe, tatsächliches Speichern/Neuladen von −30 €, null, 70 € und 150 € bei 100 € Ziel, unveränderten Fortschritt nach Zielbearbeitung und Datum-entfernen, bestätigtes Löschen eines negativen Ziels sowie unverändertes Monatsrestbudget. Sicheres Maximum/Minimum, mehr als zwei Nachkommastellen, falsch vorzeichenfähige andere Geldfelder, tatsächliche Balkenbreite, assistiver Prozenttext, Funktionssperre/-ladefehler, Offline/unbestätigter Ausgang und verspätete Antworten sind eingeschlossen.\
**Und** alle vier UX-Prüfgrößen, Kontowechsel, rote Abmeldung und ausschließlich v2-basierte Zugangs-/Finanzaufrufe sind nachgewiesen. Damit sind die vollständigen manuellen Kernaufgaben aus Epic 3 einschließlich signiertem Gesamtfortschritt nutzbar, ohne irgendeine Arbeit aus Epic 4 zu benötigen. Monatsautomatik bleibt bis zu ihrem vollständigen eigenen Lebenszyklus gesperrt und es wird kein Konto automatisch aktiviert. Offene Produktions-/Datenlebenszyklusbedingungen bleiben erhalten; diese Story ist keine Betriebsfreigabe mit echten Nutzerdaten.

### Planungsabschluss und Anforderungsabdeckung von Epic 3

**Stand:** Linus hat alle acht Stories 3.1 bis 3.8 einzeln bestätigt. Sie enthalten zusammen 80 nummerierte Abnahmekriterien. Der folgende Abgleich prüft die Vollständigkeit der Planung und die Reihenfolge; er bestätigt weder Implementierung noch ausgeführte Softwaretests. Linus hat nach dieser Zusammenfassung den Übergang zu Epic 4 bestätigt.

#### Story-Übersicht und Reihenfolge

| Story | Eigenständig prüfbares Ergebnis | Abnahmekriterien | Verwendete neue Vorarbeit |
| --- | --- | --- | --- |
| 3.1 | Vollständiger v2-Kontozugang mit Vertrag, Generierung und Zugangsregeln | 8 | Keine; abgeschlossener Zugang und Vertragswerkzeuge aus dem Bestand |
| 3.2 | Tatsächlicher Browserzugang über v2 und gemeinsame rote Abmeldung | 9 | 3.1 |
| 3.3 | Verlustfreie Modul-/Datenüberführung, öffentliche Zugänge und gemeinsame Finanzkoordination bei weiter nutzbaren Bestandsfunktionen | 10 | 3.1–3.2 |
| 3.4 | Vollständige v2-Ausgabenverwaltung im eigenen Bereich, drei Hauptbereiche und vereinfachte Systemtexte | 11 | 3.1–3.3 |
| 3.5 | V2-Budgetverwaltung und konsistenter aktueller Monatsüberblick | 11 | 3.1–3.4 |
| 3.6 | Vollständige v2-Zielpflege, signierter Antwortvertrag und vorbereitete tatsächliche Fortschrittsanzeige bei noch gesperrten negativen Schreibwerten | 11 | 3.1–3.5 |
| 3.7 | Vollständige v2-Oberfläche nach kontrollierter v1-Stilllegung, Aktualisierungsweg und dauerhafter Rücknahmegrenze | 10 | 3.1–3.6 |
| 3.8 | Tatsächlich speicherbarer signierter manueller Gesamtfortschritt unter der nachgewiesenen Versionsbarriere | 10 | 3.1–3.7 |

Jeder Umfang ist mit dem Bestand und vorherigen Stories abschließbar. In den Übergangsstories werden ausdrücklich die jeweils noch funktionierenden v1-Finanzadapter verwendet; der vollständige Wechsel wird erst nach allen v2-Nutzerwegen abgenommen. Story 3.6 erfordert keine spätere negative Schreibfreigabe, um die nichtnegative v2-Zielpflege vollständig zu nutzen. Story 3.7 erfordert keine negative Finanzwirkung, um den nachgewiesenen v2-Betriebszustand herzustellen. Story 3.8 benötigt keine automatische Monatsverarbeitung. Es gibt keine Rückwärtsabhängigkeit von einer späteren Story oder Epic 4.

Vertrag und Prüf-/Generatorweg stehen vor ihren Verbrauchern. Datenobjekte entstehen erst bei Verwendung: Finanzmodulüberführung in 3.3, technische Versions-/Nutzungsmetadaten in 3.7, signierter Fortschritts-Constraint in 3.8. Monatsnachweise und Automatikobjekte werden nicht vorsorglich angelegt. Das Ausführungstempo innerhalb einer Umsetzung wird hier nicht garantiert; die zugeschnittenen Aufgaben behalten jeweils ein zusammenhängendes Ergebnis und benannte Grenzen.

#### Funktionale Abdeckung im Epic-3-Umfang

| Anforderung | Konkrete Story-/Abnahmenachweise |
| --- | --- |
| FR-1 | 3.1/AC-3 bis AC-7: Registrierung, Link/Passwort, Anmeldung, Identität, Erneuerung und Widerruf; 3.2/AC-1 bis AC-7: tatsächlicher Browserzugang und rote Abmeldung; 3.7: Zugang über den Versionswechsel erhalten. |
| FR-2 | 3.2/AC-6, 3.3/AC-7, 3.4/AC-2/AC-9, 3.5/AC-2/AC-9, 3.6/AC-2/AC-9 und 3.8/AC-7: eigene Kontodaten, Zustandsverwerfen und späte Antworten. |
| FR-3 | 3.3/AC-7: JWT-Kontext, Filter/RLS und Rollen; 3.4/AC-2/AC-11, 3.5/AC-2/AC-11, 3.6/AC-2/AC-11 und 3.8/AC-9: Fremd-/Fehl-IDs, zwei Konten und keine Fremddaten. |
| FR-4 | 3.4/AC-4: eigener Name/Betrag, exakte Cent, serverseitiges Datum, Erfolg erst nach Commit; Grundlage 3.3/AC-3 bis AC-5. |
| FR-5 | 3.4/AC-5: gesamte eigene Historie aller Monate, stabile Reihenfolge, Datum und responsive Tabelle/Einträge. |
| FR-6 | 3.4/AC-5 bis AC-7: Bearbeiten/Löschen, unveränderliche Herkunft, ausdrückliche Bestätigung und frische Monatswerte. Die automatische historische Differenzkorrektur bleibt der zugewiesene Epic-4-Anteil. |
| FR-7 | 3.3/AC-1/AC-5/AC-6 und 3.5/AC-3/AC-4: historische Budgetstände, fortlaufende Gültigkeit, aktueller Wirksamkeitsmonat, null und exakte Grenzen. |
| FR-8 | 3.5/AC-5 bis AC-7/AC-11 und 3.4/AC-7: konsistente exakte Restformel, fehlendes/Nullbudget, negativer Rest und Aktualisierung nach Ausgabenmutation. |
| FR-9 | 3.6/AC-3/AC-4/AC-8: Anlage mit Start null, Bearbeiten, Datum entfernen und bestätigtes Löschen; 3.8/AC-6/AC-10: Erhalt/Löschen auch negativer Fortschritte. Auswahl-/Vormerkungs-/Löschbindungen der Automatik bleiben Epic 4. |
| FR-10 | 3.6/AC-5/AC-6 und 3.8/AC-1 bis AC-6/AC-9/AC-10: tatsächlicher Gesamtersatz, signierte Persistenz nach Barriere, reale Betrag-/Prozentanzeige und ausschließlich begrenzter Balken. Differenzkorrekturen und Metadatenerhalt bei aktiver Automatik folgen in Epic 4. |
| FR-11 | 3.2/AC-8/AC-9, 3.4/AC-10/AC-11, 3.5/AC-10/AC-11, 3.6/AC-10/AC-11, 3.7/AC-10 und 3.8/AC-8/AC-10: vier Viewports, Tastatur/Screenreader, Kontrast, Fokus, 200-%-Text und Reflow. |
| FR-12 | 3.4/AC-3: Reihenfolge Monat/Ausgaben/Sparziele und eigener vollständiger Ausgabenbereich; 3.5/AC-6: Monat bleibt Startansicht für Budget/Übersicht. |
| FR-13 | 3.4/AC-8/AC-11: Systemtexte einschließlich zugänglicher Hilfen ohne Zeitzonenerläuterungen, „Berlin-Fahrt“ bleibt; 3.5/AC-10, 3.6/AC-9 und 3.8/AC-8 erhalten die Regel. |

Alle 13 zugewiesenen FR-IDs besitzen konkrete Story-Abnahmen. Gemeinsam mit Epic 4 zugewiesene Anforderungen gelten hier ausschließlich für die oben benannten manuellen/Web-/Übergangsanteile; die Automatikanteile werden nicht als erledigt ausgegeben.

#### Zugewiesene Qualitäts- und Architekturvorgaben

| Anforderungen | Abdeckung im Epic 3 |
| --- | --- |
| NFR-1, NFR-2 | 3.1–3.3: Zugang, Identität, RLS und Rollen; 3.4–3.6/3.8: konkrete v2-Finanzzugriffe und Isolation. Jobautorisierung bleibt Epic 4. |
| NFR-3 | 3.2/3.4/3.5/3.6/3.7/3.8: konkrete zugängliche Browserabläufe und gemeinsame vier Prüfgrößen. |
| NFR-4, NFR-5 | 3.3–3.6/3.8: exakte sichere Centwerte, gemeinsame Kalenderkontexte, historische Budgets, unveränderliche Kalenderdaten und signierte Werte. |
| NFR-6, NFR-7, NFR-11 | 3.2–3.8: flüchtige Werte/Entwürfe, Generationsgrenzen, äußerer Commit, Doppelsenden, Offline und unbestätigter Ausgang. |
| NFR-8 | 3.3/AC-4/AC-6/AC-10, 3.5/AC-5/AC-11 und 3.8/AC-3/AC-9: Webserialisierung, konsistente Snapshotansichten und atomare Rücknahmegrenze. Jobkonkurrenz, dauerhafte Monats-Einmalwirkung und faire Wiederholung bleiben Epic 4. |
| NFR-10 | 3.3: Bestandsmigration; 3.7: tatsächliche v1-Lese-/Schreibbarriere, Neustart und Rücknahme; 3.8: tatsächlicher signierter Commit mit dauerhaftem Nutzungsmarker. |
| NFR-12 | 3.7/AC-8 und 3.8/AC-10 erhalten ausdrücklich die offenen Betriebs-/Datenlebenszyklusbedingungen. Geheimnisse bleiben geschützt; diese Bedingungen werden nicht als umgesetzt oder geklärt markiert. |
| AR-1, AR-21 | Bestand und unveränderte Stack-/Betriebsvorgaben in 3.1/3.3; v2-Routing, Start-/Bereitschaftswege und kontrollierter Einzelhostwechsel in 3.7. Kein neues Framework, Hostingdienst oder Produktionsrollout. |
| AR-2, AR-3 | 3.3/AC-1/AC-2: isolierte Ausgaben-/Budgetdaten, eigene Zugänge und äußere Koordination, keine fremden Tabellen/Repositories oder Geschwisterimporte; `monthlysurplus` folgt erst in Epic 4. |
| AR-4 | 3.1/AC-1/AC-2 und die jeweiligen Vertragsabnahmen in 3.4/3.5/3.6/3.8: getrennte Versionen/Namensräume, Verträge vor Verbrauchern und kompatible v2-Erweiterungen. |
| AR-5 | 3.1/AC-3 bis AC-7 und 3.2: unveränderter Link-/Passwort-/JWT-/Refresh-/CSRF-/Origin-Vertrag sowie flüchtiger Browserzustand. |
| AR-6 | 3.3/AC-7 und die Finanzzugriffsabnahmen aus 3.4/3.5/3.6/3.8: JWT-Webkontext, transaktionslokale RLS-Grenze und unprivilegierte Webrolle. |
| AR-9, AR-10 | 3.3/AC-3 bis AC-6: gemeinsame Verbindung/Transaktion, Kontosperre vor Fachlesen, ein Zeitpunkt/Monat und konsistente Lesesicht; konkrete Nutzung in 3.4–3.8. |
| AR-11 | 3.3/AC-5/AC-6/AC-8, 3.4/AC-4/AC-5/AC-7/AC-8, 3.5/AC-3 bis AC-7 und 3.6/3.8: exakte Geld-/Kalendersemantik und Fortschritt. |
| AR-17, AR-18 | 3.3/AC-1/AC-7, 3.7/AC-3 und 3.8/AC-1: neue Migrationen, Bestandserhalt und erforderliche wiederholbare Rollenrechte auch auf initialisierten Volumes. Konkrete Worker-/Discoveryrechte entstehen erst mit Epic 4. |
| AR-19, AR-20 | 3.7 und 3.8: vollständiger v2-Wechsel vor signierten Effekten, tatsächliches Ende alter Datenbankarbeit, getesteter Altclient, dauerhafte Sperre und geprüfte Rücknahmegrenzen. |
| AR-22 | Benannte Vertrags-/Kompilier-, Architektur-, echte PostgreSQL-/Prozess- und Browsernachweise in allen acht Stories; hier werden diese Prüfungen geplant und nicht als ausgeführt behauptet. |
| AR-23 | 3.7/AC-8 und 3.8/AC-10 erhalten die offenen Bedingungen vor echten Nutzerdaten/Produktion. Sie implizieren keine zusätzlichen fertigen Verwaltungsoberflächen oder Betriebsfreigaben. |

Die zugewiesenen Anteile von elf NFR-IDs und 16 AR-IDs sind damit in Stories gebunden. NFR-9 sowie AR-7, AR-8 und AR-12 bis AR-16 gehören gemäß bestätigter Struktur zur Monatsautomatik in Epic 4.

#### Zugewiesene UX-Anforderungen

| Anforderungen | Konkrete Story-Abdeckung |
| --- | --- |
| UX-DR1, UX-DR2 | 3.2/AC-5/AC-8, 3.4/AC-10, 3.5/AC-10, 3.6/AC-10 und 3.8/AC-8: gebundene Design-Spines/Tokens, Schrift, lange Werte, Kontrast und Fokus. |
| UX-DR3 | 3.1/AC-3 bis AC-7 und 3.2/AC-1/AC-2: verwandte, unterscheidbare Zugangszustände und neutrale Fehler. |
| UX-DR4, UX-DR5 | 3.2 und 3.4–3.6: explizite Aktionen/Geldfelder; 3.8/AC-4/AC-5/AC-8: echte vorzeichenfähige Eingabe einschließlich mobiler Minuseingabe, ohne andere Geldfelder zu öffnen. |
| UX-DR6 | 3.5/AC-5 bis AC-7: benanntes Budget, Ausgaben, prominenter tatsächlicher Rest und fehlendes/Nullbudget. |
| UX-DR7, UX-DR21 | 3.4/AC-3 bis AC-7: vollständige Historie, semantische Tabelle/mobile Einträge und sichtbare Bearbeiten-/Löschen-Aktionen. |
| UX-DR8, UX-DR25, UX-DR26, UX-DR27 | 3.6/AC-5/AC-6/AC-10 und 3.8/AC-4 bis AC-6/AC-8/AC-10: Gesamtfortschritt, tatsächliche signierte Werte/Prozente, visuelle Skala/Füllung und widerspruchsfreie assistive Ausgabe. |
| UX-DR9 | Speicher-/Fehler-/Statusabnahmen in 3.2/3.4/3.5/3.6/3.8; kein Erfolg vor bestätigtem Commit. |
| UX-DR10 | 3.4/AC-6 und 3.6/AC-8 sowie 3.8/AC-10: bestätigte Bestandslöschung mit Fokus und Fortschrittsverlust. Automatikbezogene Ziellöschfolgen bleiben Epic 4. |
| UX-DR11 | 3.4/AC-3 und 3.5/AC-6: drei echte Hauptbereiche, Monat als Startansicht und ausschließlich Budget/Übersicht unter Monat. |
| UX-DR12 | 3.4/AC-8 und fortgeführte Textabnahmen in 3.5/3.6/3.8: deutsche Formate, sachliche Texte, keine Zeitzonenerläuterungen und unveränderte Nutzernamen. |
| UX-DR13, UX-DR14, UX-DR15, UX-DR16 | 3.2/AC-2/AC-6/AC-7, 3.4/AC-9, 3.5/AC-6/AC-8/AC-9, 3.6/AC-3/AC-9 und 3.8/AC-7: leere/Lade-/Feldfehler-/Offline-/Sitzungszustände, Entwürfe und späte Antworten. Automatikleere/-ladezustände folgen in Epic 4. |
| UX-DR17, UX-DR18 | Gemeinsame konkrete vier Viewport-, Tastatur-/Screenreader-, Kontrast-, Fokus-, Touch-, 200-%-Text-/Reflow- und Reduced-Motion-Abnahmen in den Browserstories. |
| UX-DR19 | Flow 1: 3.1/3.2 → 3.4 → 3.5 mit rotem Abmelden; manueller Flow 2: 3.6 → 3.8. Automatikflows 3–5 bleiben Epic 4. |
| UX-DR20 | 3.2/AC-5, Übernahme in alle drei Bereiche durch 3.4/AC-3 und Erhalt in den weiteren Browserabnahmen. |
| UX-DR28, UX-DR29 | 3.4/AC-7/AC-9, 3.5/AC-7/AC-8, 3.6/AC-9, 3.7/AC-6/AC-7 und 3.8/AC-7: unbestätigte Mutation, tatsächlicher Altclient-/Reloadpfad und frische konsistente Rückkehransichten. Neue Hintergrundwirkungen bleiben Epic 4. |

Alle 26 Epic 3 zugewiesenen UX-IDs sind erfasst. UX-DR22, UX-DR23, UX-DR24 und UX-DR30 sind der noch auszuarbeitenden Automatik in Epic 4 zugeordnet. Die 17 Monatsfälle M-01 bis M-17 bleiben vollständig dort; die negative manuelle Darstellungs-/Persistenzgrundlage aus 3.8 ersetzt keinen Nachweis einer automatischen Monatswirkung.

#### Ergebnis und Übergang

Die Planung von Epic 3 ist vollständig in bestätigte Stories zerlegt. Sein Abschluss liefert die eigenständig nutzbare v2-Oberfläche mit drei Hauptbereichen, erhaltener Historie, korrektem Monatsüberblick und signiertem manuellem Gesamtfortschritt. Ausstehende Arbeit aus Epic 4 ist keine Voraussetzung dieses manuellen Ergebnisses. Die automatische Aktivierung bleibt geschlossen, bis deren vollständiger Lebenszyklus und eigene Freigaberegeln umgesetzt und geprüft sind.

Linus hat nach dieser Zusammenfassung die Fortsetzung mit Epic 4 ausdrücklich bestätigt. Dessen Stories werden nun einzeln ausgearbeitet und zur Bestätigung vorgelegt. Der Gesamtworkflow bleibt bis zur vollständigen Ausarbeitung und Validierung offen; historische Stories, Sprintstatus und tatsächlicher Implementierungsstand bleiben unverändert.

## Epic 4: Monatsüberschüsse verlässlich für eigene Sparziele berücksichtigen

Nutzer:innen aktivieren die Monatsautomatik ab dem laufenden Monat, auch ohne Ziel. Abgeschlossene Überschüsse gehen einmalig an die historische Monatsendeauswahl oder bleiben vorgemerkt; spätere Zielwahl übernimmt sämtliche offenen Vormerkungen. Ausgabenänderungen, manuelle Fortschritte, Zielwechsel/-löschung und Nachholen ohne Sitzung erhalten die richtigen Wirkungen.

**FRs:** FR-2, FR-3, FR-6, FR-9, FR-10, FR-11, FR-13, FR-14, FR-15, FR-16, FR-17. Alle 17 Monatsabnahmefälle und die präzisierten Nullmonat-/Lösch-/Korrekturregeln werden im Epic zugeordnet. Die öffentliche Aktivierung bleibt bis zur vollständigen Lebenszyklus-/Sicherheits-/Browserprüfung gesperrt. Bestätigte Story-Texte sind Planungsabnahmen und keine Implementierungs-Fertigmeldungen.

### Story 4.1: Monatsautomatik ausdrücklich ab dem ersten Aktivierungsmonat starten

Als angemeldete Person\
möchte ich die Monatsautomatik ausdrücklich für mein Konto aktivieren können, auch ohne Budget oder Sparziel, und ihren unveränderlichen Startmonat erkennen,\
damit Überschüsse ab diesem Monat berücksichtigt werden können und eine spätere Zielwahl den Beginn nicht verschiebt.

**Anforderungsbezug:** Aktivierungs-/Startmonatsanteil von FR-14 sowie FR-2, FR-3, FR-11 und FR-13; NFR-1, NFR-2, NFR-3, NFR-5, NFR-6, NFR-7, Wiederholungs-/Webkonkurrenzanteil von NFR-8, Freigabeanteil von NFR-10 und NFR-11. AR-1 bis AR-4, Webanteil von AR-6, AR-9, AR-10, Kalenderanteil von AR-11, Aktivierungsanteil von AR-12, AR-17, AR-19 und passende Prüfanteile von AR-22. UX-DR1, UX-DR2, UX-DR4, einschlägige Status-/Leer-/Fehler-/Sitzungs-/Zugänglichkeitsregeln aus UX-DR9/UX-DR11 bis UX-DR18, Aktivierungsanteil von Flow 3 aus UX-DR19, Erhalt von UX-DR20, UX-DR22 und unbestätigter Ausgang nach UX-DR28. Grundlage für M-01/M-02; ihre tatsächlichen Monatswirkungen werden erst mit der Monatsverarbeitung abgenommen.

**Abhängigkeiten und Umfang:** Baut ausschließlich auf Epic 3 auf. Umfasst das fünfte Eigentümermodul `monthlysurplus` mit seinem jetzt benötigten Aktivierungsdatensatz, v2-Aktivierungszustand/-aufruf, Fortführung des technischen Gesamtfreigabegates und einen Automatikabschnitt innerhalb Sparziele. Die Aktivierungsfunktion ist ohne späteren Monatsabschluss-, Auswahl- oder Jobcode aufrufbar und vollständig prüfbar: Sie speichert genau den Start, verändert keine Geldwerte und verspricht keinen sofortigen Abschluss. Monatliche Nachweise, Vormerkungen, Zielauswahlhistorie und Worker-/Discoveryobjekte entstehen erst bei ihrer fachlichen Verwendung.

Die öffentliche Automatikfreigabe bleibt trotz fertig implementierter Aktivierungsfunktion geschlossen, bis der gesamte bestätigte Epic-4-Lebenszyklus einschließlich Korrektur/Löschung/Nachholen geprüft ist. Positive Aktivierungs- und UI-Fälle werden in ausschließlich internen Modul-/Koordinations-/API-Prüfkontexten mit echter Datenbank getestet. Eine nur testinterne Gesamtfreigabe darf dafür die v1-Barriere, JWT-/RLS-Grenzen und Commitregeln nicht umgehen und wird nicht als Produktionskonfiguration ausgeliefert. Die unfertige Gesamtautomatik wird dadurch keinem Nutzerkonto öffentlich angeboten.

**Abnahmekriterien:**

**AC-1 — V2-Vertrag für eigenen Aktivierungszustand und ausdrückliche Aktivierung**

**Angenommen** die vollständige v2-Vertrags-/Generatorbasis aus Epic 3 ist vorhanden\
**Wenn** die Aktivierungsoperationen vor ihren Verbrauchern festgelegt werden\
**Dann** beschreibt `api-contract/v2/openapi.yaml` unter `/api/v2` `GET /monthly-surplus/activation` und `POST /monthly-surplus/activation`. Die Zustandsantwort enthält `active` und `activationMonth` als Monatsersten im ISO-Kalenderformat beziehungsweise null ohne Aktivierung. Der POST hat keine fachlichen Eingabefelder für Konto, Startdatum, Budget oder Ziel; der Server bestimmt den eigenen Kontokontext und den Erstmonat. Erst nach bestätigtem Commit antwortet er mit 200 und dem gespeicherten Zustand. Auch ein zulässiger wiederholter Aufruf liefert den ursprünglichen aktiven Zustand.\
**Und** 401 für fehlenden/ungültigen Zugang, 409 `FEATURE_NOT_AVAILABLE` bei gesperrter Gesamtfunktion und neutrale unbestätigte Fehler sowie Bearer-Schutz und `Cache-Control: no-store` sind definiert. Die bestehende Capability-Antwort wird kompatibel um `monthlyAutomationAvailable` erweitert; fehlt das Feld oder ist es ungültig, nimmt der Browser keine Freigabe an. Neue Server liefern den tatsächlich gültigen booleschen Zustand. V1 bleibt stillgelegt und unverändert; v2-Erweiterung und getrennte generierte Typen/Interfaces bestehen die Kompatibilitäts-/Kompilierchecks.

**AC-2 — Aktivierung gehört ausschließlich dem neuen Modul und eigenen Konto**

**Angenommen** eine verifizierte Person öffnet oder aktiviert ihren Automatikzustand\
**Wenn** die äußere Anwendungsschicht den Fall verarbeitet\
**Dann** stammt das Konto ausschließlich aus JWT-`sub`; `monthlysurplus` besitzt seine Aktivierungsdaten in einem eigenen Schema und bietet schmale öffentliche Zustands-/Aktivierungszugänge. Äußere Koordination, HTTP-Adapter und gemeinsame technische Infrastruktur besitzen diese fachlichen Daten nicht. Es gibt weder Geschwisterimporte noch direkte Zugriffe auf fremde Tabellen/Repositories.\
**Und** der Datensatz trägt `user_id`, ist je Konto eindeutig und unterliegt eigenem Abfragefilter sowie erzwungener RLS. Fehlender Kontext eröffnet keinen Zugriff, ein abweichender Filter-/RLS-Kontext liefert keine fremden Daten und Cookies allein autorisieren keine Operation. Die Webrolle bleibt unprivilegiert, ist kein Besitzer/Superuser und hat kein `BYPASSRLS`. Sie erhält nur die für Zustandslesen und Erstaktivierung benötigten Rechte; spätere Jobrechte werden hier nicht vorweggenommen.

**AC-3 — Neue Migration erzeugt nur die benötigte Aktivierungsgrundlage**

**Angenommen** bestehende Konten und ihre Finanzdaten sind vorhanden\
**Wenn** die neue Flyway-Migration für `monthlysurplus` ausgeführt wird\
**Dann** entstehen das benötigte modulseigene Schema und der Aktivierungsdatensatz mit eindeutiger Konto-ID und gültigem Erstmonat am Monatsersten, notwendigen Constraints/Policies und begrenzten Rollenrechten. Bestehende Migrationen und Finanzwerte bleiben unverändert. Vorhandene Konten werden nicht automatisch aktiviert und reines Zustandslesen erzeugt keinen Aktivierungsdatensatz.\
**Und** Erstmonat und Eigentümer werden nach Anlage nicht durch reguläre Aktualisierungs-/Löschrechte veränderbar. Die Migration funktioniert auf frischem und befülltem Stand. Es werden noch keine Monats-/Vormerkungs-/Auswahl-/Jobtabellen vorsorglich angelegt und keine manuellen Fortschritte in automatische Herkunft umgedeutet. Offene Datenlebenszyklusentscheidungen bleiben erhalten.

**AC-4 — Erstaktivierung bestimmt den gesamten laufenden Monat nach Sperrerwerb**

**Angenommen** für das Konto besteht noch keine Aktivierung und der interne Prüffall besitzt die erforderlichen Freigabe-/Versionsvoraussetzungen\
**Wenn** die Person die Aktivierung ausdrücklich auslöst\
**Dann** erwirbt die äußere Koordination vor zustandsabhängigem Lesen dieselbe transaktionsgebundene Kontosperre wie alle Finanzmutationen, setzt den transaktionslokalen Webkontext und bestimmt den fachlichen Zeitpunkt/Monat nach Sperrerwerb genau einmal. Dieser Monat wird als frühester Herkunftsmonat gespeichert; das Ergebnis wird erst nach äußerem Commit bestätigt.\
**Und** eine Aktivierung im Oktober bedeutet Start mit dem gesamten Oktober und dessen erstem Abschluss nach Monatsende; September ist ausgeschlossen. Die Aktivierung darf auch ohne gesetztes Budget, vorhandenes Ziel oder Zielauswahl erfolgen und setzt keine aktuelle Geldbewegung voraus. Wartet die erste Mutation über eine Monatsgrenze, gilt der Monat nach tatsächlichem Sperrerwerb. Andere Gerätezeitzonen oder vom Client behauptete Eigentümer-/Datumswerte ändern diesen Kontext nicht.

**AC-5 — Wiederholung und Parallelität verändern den Erstmonat nicht**

**Angenommen** die erste Aktivierung für Oktober ist bestätigt oder mehrere Aktivierungsversuche treffen gleichzeitig ein\
**Wenn** ein weiterer zulässiger Aufruf im Oktober beziehungsweise späteren Monat verarbeitet wird\
**Dann** existiert genau ein wirksamer Aktivierungsdatensatz und die Antwort nennt weiterhin Oktober. Wiederholung erzeugt weder einen neuen Beginn noch eine zweite Wirkung; eine spätere erste Zielwahl kann den Erstmonat ebenfalls nicht umdefinieren. Kontosperre und Datenbank-Eindeutigkeit sichern denselben Zustand auch für ein zuvor leeres Konto.\
**Und** es wird keine Deaktivierungs-, Startmonat-Änderungs- oder Rückdatierungsfunktion angeboten. Ein Fehler vor Commit beziehungsweise ein Commitfehler hinterlässt keine bestätigte Teilaktivierung. Leseantworten nach fehlgeschlagener Erstaktivierung zeigen den tatsächlichen unveränderten Zustand; eine gesperrte Gesamtfunktion löscht oder verschiebt eine bereits gespeicherte Aktivierung nicht.

**AC-6 — Gesamtfreigabe bleibt serverseitig geschlossen**

**Angenommen** der gesamte Automatiklebenszyklus ist noch nicht vollständig implementiert/abgenommen oder der v1-Stilllegungsnachweis fehlt\
**Wenn** ein normaler Client die Capability liest oder direkt den Aktivierungs-POST aufruft\
**Dann** ist `monthlyAutomationAvailable` nicht freigegeben und die Aktivierung wird vor einer Zustandsmutation mit der dokumentierten Funktionssperre abgewiesen. Frontendfeld, direktes HTTP, veraltete Capability-Antwort oder einfacher Schalter allein können weder die Versionsbarriere noch die geschlossene Gesamtabnahme ersetzen. Eine öffentliche Einstellung zum Umgehen dieser Voraussetzungen wird nicht eingeführt.\
**Und** die UI bietet keine als bereits nutzbar dargestellte, tatsächlich wirkungslose Aktivierung an. Der intern prüfbare Aktivierungsfall ist dennoch vollständig implementiert und ohne künftige Monatsverarbeitung ausführbar; seine Positivtests erhalten ausschließlich testintern die benötigte Gesamtfreigabe bei weiterhin tatsächlich gültiger v2-/JWT-/RLS-/Transaktionsgrenze. Die spätere Gesamtfreigabe verändert keinen gespeicherten Erstmonat und aktiviert kein Konto automatisch.

**AC-7 — Automatikabschnitt erklärt Start und fehlende Zielvoraussetzung**

**Angenommen** die Person öffnet Sparziele\
**Wenn** der eigene Automatikzustand geladen wird beziehungsweise die Aktivierung im internen Positivfall bestätigt ist\
**Dann** erscheint der neue Abschnitt innerhalb Sparziele auch bei leerer Zielliste. Vor Erstaktivierung erklärt er den Start im gesamten Aktivierungsmonat, den ersten Abschluss nach Monatsende, den Ausschluss früherer Monate und die Möglichkeit ohne Budget/Ziel zu aktivieren. Er verspricht weder genaue Ausführungszeit noch Bankübertragung oder garantierte Ersparnis. Im zulässigen Positivfall gibt es eine ausdrücklich beschriftete Aktivierungsaktion; nach Commit wird der gespeicherte Status mit verständlichem Startmonat wie „aktiv seit Oktober 2026“ angezeigt.\
**Und** nicht aktiviert, noch nicht geladen, Fehler und gesperrte Gesamtfunktion bleiben unterscheidbar. Eine gespeicherte Aktivierung wird bei vorübergehender Funktionssperre nicht als deaktiviert oder mit neuem Start ausgegeben. Es gibt keinen vierten Hauptbereich und keine nicht spezifizierte Deaktivierung. Zielauswahl, Vormerkungsbetrag und Monatswirkungen werden erst mit ihren tatsächlichen Datenfunktionen ergänzt; diese Story erfindet dafür keine Nullbeträge oder erfolgreiche Anrechnung. Systemtexte einschließlich zugänglicher Hilfen enthalten keine Zeitzonenerläuterung.

**AC-8 — Fehler und Sitzungswechsel bewahren den tatsächlichen Aktivierungszustand**

**Angenommen** eine Aktivierung ist angefordert oder eine Zustands-/Capability-Antwort steht aus\
**Wenn** ein Fehler, Offlinezustand, unbestätigter Ausgang, Sitzungsende oder Kontowechsel eintritt\
**Dann** wird Erfolg erst nach bestätigtem äußerem Commit angezeigt und der zugehörige Vorgang gegen Doppelsenden gesperrt. Offline wird keine Aktivierung versandt und keine Synchronisation versprochen. Bei sicherem Fehler bleibt der gespeicherte Zustand unverändert; bei ausbleibender Bestätigung wird vor einem Wiederholungsversuch der tatsächliche eigene Aktivierungszustand geladen, statt Erfolg oder sicheren Rollback anzunehmen.\
**Und** eine spätere Wiederholung darf einen bereits gespeicherten Oktoberstart auch nach Monatswechsel nicht zu November machen. Abmeldung/Ablauf/Kontowechsel verwerfen persönlichen Status und Entwürfe im Browserarbeitsspeicher; alte Antworten geben weder Daten noch Aktivierungsfreigabe für ein anderes Konto frei. Es gibt keine dauerhafte Browserablage persönlicher Finanz-/Zugangsdaten. Neue Fehlermeldungen bleiben neutral und Protokolle enthalten keine vertraulichen Kontoinhalte oder Zugangsnachweise.

**AC-9 — Zugänglicher Abschnitt an allen Prüfpunkten**

**Angenommen** Automatikhinweis, Status und Aktivierungsaktion werden bei 320×568, 390×844, 768×1024 oder 1280×800 CSS-Pixeln verwendet\
**Wenn** die Person Tastatur/Touch/Screenreader oder 200 % Textgröße nutzt\
**Dann** sind Bedeutung, Startmonat, fehlende Voraussetzungen, Fehler und Status auch ohne Farbe erkennbar. Beschriftete Aktion, programmatische Statusankündigung, semantische Abschnittsüberschrift, logischer sichtbarer nicht verdeckter Fokus und verständliche Fehler entsprechen dem UX-Vertrag. Kernaufgaben bleiben bei 320 CSS-Pixeln ohne horizontales Scrollen erreichbar; Aktionen sind mindestens 44×44 CSS-Pixel groß und wachsen mit der Schrift.\
**Und** Design-Tokens, Textkontrast mindestens 4,5:1, Kontrollgrenzen/Fokus mindestens 3:1 und reduzierte Bewegung gelten weiter. Navigation und rote Abmeldung bleiben in den drei vorhandenen Hauptbereichen erhalten. Auch ohne Ziele bleibt der Abschnitt zugänglich; gesperrte Funktion und Ladefehler werden weder als erfolgreiche Aktivierung noch als angeblich fehlende persönliche Aktivierung ausgegeben.

**AC-10 — Echte Aktivierungsnachweise ohne vorgezogene Gesamtfreigabe**

**Angenommen** Vertrag, Eigentümermodul, Koordination und Abschnitt sind umgesetzt\
**Wenn** Vertrags-/Kompilier-, echte PostgreSQL-/Koordinationsintegrationstests und gezielte HTTPS-Browserprüfungen laufen\
**Dann** belegen sie frische/befüllte Migration, ausbleibende automatische Aktivierung bestehender Konten, zwei Konten, Filter/RLS/Rollen, fehlenden Zugang, Erstaktivierung ohne Budget/Ziel, Oktoberstart trotz Septemberdaten, Monatsgrenze nach Sperrerwerb, parallele Wiederholung, erneuten Aufruf im Folgemonat und unveränderte Finanzwerte. Commitfehler, Verbindungswiederverwendung und nicht veränderbarer Erstmonat sind eingeschlossen.\
**Und** der reguläre Auslieferungszustand weist direkte Aktivierung bei geschlossenem Gesamtgate ab; ausschließlich testinterne Positivfälle mit gültiger Versionsbarriere belegen tatsächlichen Aktivierungs-Commit und UI-Status. Browserprüfungen erfassen Lade-/Fehler-/Sperr-/Offlinezustände, unbestätigten Ausgang über Monatswechsel, Konto-/Sitzungswechsel, späte Antworten und alle vier UX-Prüfgrößen. Vorherige manuelle Kernfunktionen bleiben vollständig nutzbar. Die Grundlage von M-01/M-02 ist damit geprüft, ihre tatsächlichen Überschuss-/Vormerkungsfälle bleiben den folgenden Stories zugeordnet. Die Story ist für den beschriebenen Aktivierungsumfang ohne spätere Monats-/Jobfunktion abschließbar und erteilt keine öffentliche Automatik- oder Produktionsfreigabe.

### Story 4.2: Abgeschlossene Monatsüberschüsse ohne Ziel vormerken

Als Person mit aktivierter Monatsautomatik und noch ohne ausgewähltes Sparziel\
möchte ich Überschüsse abgeschlossener Monate als eigene vorgemerkte Summe erkennen können,\
damit diese Beträge mit ihrer Herkunft erhalten bleiben, bis ich ein Ziel auswähle.

**Anforderungsbezug:** Berechnung ab Aktivierung aus FR-14, Vormerkungsanteil von FR-15, Wiederholungs-/Nachweisgrundlage aus FR-17 sowie FR-2, FR-3, FR-11 und FR-13. NFR-1 bis NFR-7, kontobezogener Wiederholungs-/Konkurrenzanteil von NFR-8, Nutzungs-/Freigabeanteil von NFR-10 und NFR-11. AR-1 bis AR-4, AR-6, AR-9 bis AR-12, AR-17, AR-19, AR-20 und passende Prüfanteile von AR-22. UX-DR1, UX-DR2, UX-DR9, einschlägige Leer-/Lade-/Fehler-/Sitzungs-/Zugänglichkeitsregeln aus UX-DR12 bis UX-DR18, Vormerkungsanteil von Flow 3 aus UX-DR19, UX-DR22, Darstellungsanteil von UX-DR24, aktueller Vormerkungsstand nach UX-DR29 und unabhängige Korrekturmöglichkeiten nach UX-DR30. M-01/M-02 und der Erstverarbeitungsanteil von M-06 werden nachgewiesen; die Vormerkungsgrundlage aus M-03 sowie der Einmaligkeits-/Grenz-/Rollbackanteil von M-17 werden vorbereitet beziehungsweise geprüft. Auswahlübernahme und sitzungsunabhängiges Nachholen bleiben eigene Abnahmeumfänge.

**Abhängigkeiten und Umfang:** Baut ausschließlich auf Epic 3 und Story 4.1 auf. Umfasst einen vollständig ausführbaren internen Abschlussbaustein für ein berechtigtes Konto/einen abgeschlossenen Monat ohne historische Zielauswahl, dauerhafte Monatsnachweise, die exakte offene Gesamtsumme und deren v2-Leseweg/Anzeige. Die äußere Koordination erhält ihren vertrauenswürdigen Ausführungskontext und verwendet öffentliche Budget-/Ausgabenprojektionen; kein Modul importiert ein Geschwistermodul. Der Abschlussbaustein benötigt weder einen späteren Scheduler noch eine spätere Zielauswahlfunktion. Für diese Story werden keine Zielauswahl-, Zielbindungs- oder Worker-/Discoveryobjekte vorsorglich angelegt und kein Ziel automatisch gewählt. Historische Ausgabenmutationen mit Differenzkorrektur werden gesondert integriert.

Die öffentlichen Aktivierungs-/Verarbeitungsgates bleiben bis zum vollständig abgesicherten Epic-4-Lebenszyklus geschlossen. Positive Abschlussfälle laufen mit echter Datenbank im internen Prüfkontext nach dem Muster aus Story 4.1; eine testinterne Gesamtfreigabe schwächt weder die wirkliche Versionsbarriere noch Konten-/RLS-/Commitgrenzen. Der reguläre Client erhält keinen manuellen Monatsabschlussknopf und keinen öffentlichen Jobendpunkt. Der später nötige sitzungsunabhängige Auslöser wird nicht durch simulierte Nutzer-JWTs vorweggenommen.

**Abnahmekriterien:**

**AC-1 — V2-Lesevertrag und klar begrenzter interner Abschluss**

**Angenommen** Aktivierungszustand, v2-Vertrag und die öffentlichen Finanzmodulzugänge stehen bereit\
**Wenn** Vormerkungsanzeige und Abschlussbaustein vor ihren Verbrauchern festgelegt werden\
**Dann** beschreibt der Vertrag `GET /api/v2/monthly-surplus/pending` als Bearer-geschützten, nicht mutierenden Aufruf mit `pendingCents` als exakter nichtnegativer Ganzzahl bis 9.007.199.254.740.991. 200, 401, ein neutraler Ladefehler und `Cache-Control: no-store` sind definiert; getrennte Generator-/Kompilier-/Kompatibilitätschecks erfassen die v2-Erweiterung, während der archivierte v1-Vertrag unverändert bleibt.\
**Und** Zustandslesen erzeugt oder verarbeitet keine Monatsnachweise. Der interne Abschlussfall wird ausschließlich durch vertrauenswürdige äußere Koordination aufgerufen; ein Client kann weder Konto, Herkunftsmonat, Budgetbasis noch vorgemerkten Betrag vorgeben. Es entsteht kein öffentliches POST-/Job-/„Monat abschließen“-API und keine Vorgabe, dass der spätere Hintergrundlauf einen Nutzerzugang nachbilden muss.

**AC-2 — Nur berechtigte abgeschlossene Monate historisch berechnen**

**Angenommen** das Konto wurde erstmals im Oktober aktiviert und der interne Prüfkontext besitzt gültige Versions-/Gesamtfreigabevoraussetzungen\
**Wenn** ein Monat ohne historische Zielauswahl abgeschlossen wird\
**Dann** verarbeitet der Baustein ausschließlich Monate ab dem unveränderlichen Aktivierungsmonat, die nach dem gemeinsamen serverseitigen Kalender bereits beendet sind. September, der noch laufende Monat und spätere Monate erhalten keinen Nachweis oder Betrag; ohne Aktivierung entsteht ebenfalls keine Verarbeitung. Der Oktober verwendet den gesamten Monat, einschließlich Ausgaben vor dem Aktivierungstag.\
**Und** die äußere Koordination liest den für genau diesen Herkunftsmonat gültigen fortlaufenden Budgetstand und dessen exakte eigene Ausgabensumme über die jeweiligen öffentlichen Modulprojektionen. Ein heutiger anderer Budgetwert ersetzt den historischen nicht. Bei vorhandenem Budget gilt `max(0, damaliges Budget − damalige Monatsausgaben)`; ohne Budget entsteht kein Geldbetrag. Monat und fachlicher Zeitpunkt stammen aus dem gemeinsamen Kontext nach Kontosperrerwerb und werden innerhalb des Anwendungsfalls nicht erneut bestimmt.

**AC-3 — Monatsnachweis bewahrt Herkunft, null und fehlendes Budget**

**Angenommen** ein abgeschlossener Monat ab Erstaktivierung wird erstmals verarbeitet\
**Wenn** die neue Flyway-Migration und die Speicherung des Monatsnachweises verwendet werden\
**Dann** besitzt `monthlysurplus` den Nachweis in seinem eigenen Schema, eindeutig je `user_id`/Herkunftsmonat. Ein Monat ohne Budget wird ausdrücklich als „ohne Budget“ unterschieden; ein Monat mit Budget speichert den zuletzt berücksichtigten nichtnegativen Überschuss als offen vorgemerkt, auch wenn er null ist. Nullüberschüsse mit Budget bleiben als offene Nachweise erhalten, damit eine spätere Zuordnung ihre Herkunft binden kann. Ohne Budget entsteht dagegen kein offener Nullnachweis.\
**Und** eigene Abfragefilter und erzwungene RLS schützen die Zeilen; Herkunftsmonat/Eigentümer und Eindeutigkeit sind abgesichert. Neue Rechte sind auf die jetzt benötigten eigenen Lese-/Erstanlagezugriffe begrenzt; vorhandene Migrationen, Aktivierungsmonat und Finanzwerte anderer Module bleiben unverändert. Es werden noch keine späteren Auswahl-/Jobtabellen angelegt. Der technische Nachweis ist kein Beitragsverlauf als Nutzeroberfläche.

**AC-4 — Kontosperre, gemeinsamer Commit und Nutzungsmarker gelten**

**Angenommen** der Abschlussfall verarbeitet Daten eines verifiziert gebundenen Kontos\
**Wenn** er Aktivierung, bisherigen Monatsnachweis und Berechnungsgrundlagen liest und den neuen Nachweis speichert\
**Dann** bindet die äußere Koordination vor Fachzugriff den transaktionslokalen Kontokontext und erwirbt die gemeinsame Kontosperre vor zustandsabhängigem Lesen. Alle öffentlichen Modulzugänge arbeiten auf derselben physischen Verbindung/Transaktion unter den festgelegten Geld-/Kalender-/RLS-Regeln. `monthlysurplus` erhält die benötigten Werte aus der Koordination und fragt keine fremden Tabellen ab.\
**Und** Monatsnachweis, wirksame Vormerkung und Vorwärtssetzen des technischen Nutzungsmarkers aus Story 3.7 werden ausschließlich gemeinsam bestätigt. Auch bestätigte Null-/Ohne-Budget-Nachweise bewahren neue dauerhafte Monatsherkunft und überschreiten damit die technische Rücknahmegrenze. Ein Fehler vor oder beim äußeren Commit verwirft die zusammengehörige Änderung vollständig. Wiederanlauf/Code-Rücknahme darf bestätigte Monatsherkunft nicht durch Wiederöffnung von v1 ignorieren.

**AC-5 — Wiederholung und Konkurrenz vervielfachen keine Vormerkung**

**Angenommen** ein Monatsnachweis besteht bereits oder mehrere Abschlussversuche für denselben Monat treffen gleichzeitig ein\
**Wenn** der Abschluss erneut ausgeführt wird\
**Dann** wird unter der Kontosperre der vorhandene wirksame Nachweis erkannt und kein weiterer Monatsbetrag erzeugt, erneut addiert oder als neuer Herkunftsmonat gespeichert. Datenbank-Eindeutigkeit sichert denselben Schutz; „ohne Budget“ und offene Nullnachweise werden nicht wegen eines Betrags null als unverarbeitet behandelt.\
**Und** Nachweise unterschiedlicher Herkunftsmonate bleiben getrennt. Ein später vorhandener Nachweis verhindert nicht, einen noch fehlenden früheren berechtigten Monat korrekt zu verarbeiten; ein bloßes maximales Nachweismonat-Datum darf solche Lücken nicht ausblenden. Eine historische Quelländerung wird nicht durch erneute absolute Anrechnung behandelt; ihre atomare Differenzkorrektur ist eigener Folgeumfang. Der Baustein verändert keinen manuellen Zielfortschritt und wählt kein vorhandenes Ziel zufällig aus.

**AC-6 — Offene Gesamtsumme und sichere Centgrenzen**

**Angenommen** offene Monatsnachweise mit Budget sind vorhanden\
**Wenn** ein weiterer Betrag wirksam werden oder die Vormerkung gelesen werden soll\
**Dann** ergibt sich `pendingCents` exakt aus den noch nicht zugeordneten Monatsbeträgen des eigenen Kontos. Die leere Menge ergibt null; „ohne Budget“ wird nicht als offene Vormerkung mitgezählt. Zwischenrechnung, Einzelüberschuss und offene Gesamtsumme werden ohne Gleitkommarundung innerhalb der sicheren Centgrenzen geprüft.\
**Und** würde eine neue Verarbeitung die offene Summe überschreiten, wird ihr gesamter Anwendungsfall abgelehnt: frühere Vormerkungen bleiben erhalten, der betroffene Monat wird nicht fälschlich als erledigt bestätigt und ein neuer Nachweis-/Nutzungsmarkerstand wird nicht teilweise festgeschrieben. Ein bereits ungültiger Summenbestand führt beim Lesen zu einem neutralen Fehler statt zu einem gerundeten, abgeschnittenen oder erfundenen Nullbetrag. Einzelne Fehler dürfen unabhängige manuelle Zielpflege nicht pauschal sperren.

**AC-7 — Tatsächliche Vormerkung sichtbar und von Fortschritt getrennt**

**Angenommen** im internen Positivfall sind Oktoberüberschuss 200 € und Novemberüberschuss 100 € ohne Ziel vorgemerkt\
**Wenn** die Person Sparziele öffnet und ihren Vormerkungsstand über v2 lädt\
**Dann** zeigt der Automatikabschnitt „Vorgemerkt: 300,00 €“ mit verständlichem Hinweis, dass der Betrag noch keinem Sparziel angerechnet ist. Die beiden Herkunftsmonate bleiben intern unterscheidbar; ein bestehender manueller Zielfortschritt von 50 € bleibt 50 €. Anzeige von null ist nach erfolgreicher Abfrage zulässig und löscht keine offenen Nullmonatsnachweise.\
**Und** noch nicht aktiviert, noch nicht geladen, Ladefehler und tatsächlich geladene offene Summe bleiben unterscheidbar. Vor Aktivierung wird keine rückwirkende Vormerkung suggeriert; ein Fehler wird nicht durch 0 € ersetzt. Der Abschnitt bleibt auch ohne Ziele erreichbar und kann zur vorhandenen Zielanlage führen. Die eigentliche Auswahl-/Übernahmeaktion wird erst mit ihrer vollständigen Datenfunktion ergänzt; kein wirkungsloser Auswahlknopf wird angeboten. Es entsteht kein vierter Hauptbereich oder Nutzer-Beitragsverlauf.

**AC-8 — Frische Antworten, Entwürfe und Sitzungsgrenzen**

**Angenommen** Vormerkungsladen läuft parallel zu offenem manuellem Zielentwurf, Navigation oder einer Sitzungsänderung\
**Wenn** eine Antwort verspätet eintrifft, ein Ladefehler auftritt oder die Person nach einem Monatswechsel zurückkehrt\
**Dann** werden tatsächliche aktuelle gespeicherte Werte erneut geladen und ältere Antworten nicht als frischer Stand ausgegeben. Ein offener Ziel-/Fortschrittsentwurf wird durch die Vormerkungsantwort nicht überschrieben; ein Fehler des Abschnitts blockiert keine unabhängige manuelle Fortschrittskorrektur. Es wird kein exakter Abschlusszeitpunkt oder bereits erfolgte Zielanrechnung behauptet.\
**Und** Abmeldung, Ablauf und Kontowechsel verwerfen die persönlichen Automatik-/Vormerkungswerte im Browserarbeitsspeicher und entkräften alte Antworten. Finanzdaten und kurzfristige Tokens gelangen nicht in dauerhafte Browserablagen; Offlinezustand wird ehrlich benannt und keine Synchronisation versprochen. Serverfehler und Logs verraten weder fremde Daten noch tatsächliche Beträge, Finanztexte oder Zugangsnachweise.

**AC-9 — Keine vorgezogene Aktivierung oder künstliche Sitzung für Verarbeitung**

**Angenommen** der vollständige Automatiklebenszyklus ist noch nicht abgenommen oder die Versionsbarriere ist ungültig\
**Wenn** ein normaler Client aktiviert beziehungsweise eine reguläre interne Verarbeitung versucht wird\
**Dann** bleiben die Gesamtgates aus Story 4.1 geschlossen und es entsteht keine neue Aktivierung oder Monatswirkung. Positivfälle verwenden ausschließlich testintern die nötige Gesamtfreigabe bei weiterhin tatsächlich gültiger v2-/Konto-/RLS-/Transaktionsgrenze. Der fertige Abschlussbaustein und sein Leseweg sind damit ohne späteren Auswahl-/Scheduler-Code vollständig prüfbar.\
**Und** diese Story führt weder einen öffentlichen Jobauslöser noch simulierte Nutzer-JWTs oder einen breit berechtigten Hintergrundzugang ein. Der spätere Job erhält seine gesonderte begrenzte Autorisierung und ruft denselben fachlichen Baustein über die äußere Koordination auf. Die öffentliche Gesamtfreigabe bleibt bis zur vollständigen gemeinsamen Prüfung von Anrechnung, Übernahme, Korrektur, Ziellöschung und Nachholen gesperrt.

**AC-10 — Zugängliche Vormerkungsanzeige in vier Prüfgrößen**

**Angenommen** Status, Hinweis und Vormerkung werden bei 320×568, 390×844, 768×1024 oder 1280×800 CSS-Pixeln gelesen\
**Wenn** die Person Tastatur/Touch/Screenreader beziehungsweise 200 % Textgröße verwendet\
**Dann** bleiben lange Beträge, die Bedeutung „noch keinem Ziel angerechnet“, Lade-/Fehlerzustände und vorhandene Aktionen ohne Farbe allein verständlich. Kernaufgaben sind bei 320 CSS-Pixeln ohne horizontales Scrollen möglich; semantische Überschriften, programmatische Statusmeldungen, lesbare Kontraste und sichtbarer nicht verdeckter Fokus entsprechen dem UX-Vertrag.\
**Und** vorhandene Aktionen sind mindestens 44×44 CSS-Pixel groß und wachsen mit der Schrift; reduzierte Bewegung, gemeinsame rote Abmeldung und die drei Hauptbereiche bleiben erhalten. Deutsche EUR-/Datumsformate bleiben korrekt, Systemtexte und zugängliche Hilfen enthalten keine Zeitzonenerläuterung und keine Bankübertragungs-/Sparerfolgsgarantie.

**AC-11 — Monats-, Summen-, Rollback- und Browsernachweise**

**Angenommen** Abschlussbaustein, Monatsnachweise und Anzeige sind umgesetzt\
**Wenn** Vertrags-/Kompilierchecks, echte PostgreSQL-/Koordinationsintegrationstests und gezielte HTTPS-Browserprüfungen ausgeführt werden\
**Dann** belegen sie mindestens: Aktivierung im Oktober mit Septemberdaten; Oktober 1.000 € damaliges Budget minus 800 € Ausgaben ergibt 200 € Vormerkung; zweiter Monat 100 € ergibt insgesamt 300 € bei getrennten Nachweisen; aktuelles anderes Budget ändert den historischen Oktoberwert nicht; ein Rest von 0 € oder ein negativer Rest bei gesetztem Budget erzeugt einen offenen Nachweis über 0 €; fehlendes Budget erzeugt keinen offenen Nullnachweis. Monatsgrenzen/Zeitumstellungen, zwei Konten, RLS/Rollen, wiederverwendete Verbindungen, Wiederholung, Konkurrenz, Lücken in Herkunftsmonaten, Einzel-/Gesamtsummengrenzen und gemeinsamer Nachweis-/Nutzungsmarkerrollback sind eingeschlossen.\
**Und** Browserprüfungen mit tatsächlich berechneten internen Positivfällen belegen 300 € Vormerkung bei unverändertem 50-€-Zielfortschritt, geladene null gegenüber Ladefehler, unveränderte Entwürfe, späte Antworten, Konto-/Sitzungswechsel und alle vier UX-Prüfgrößen. Der reguläre Auslieferungszustand bleibt gesperrt und manuelle Kernfunktionen bleiben nutzbar. M-01/M-02 und die genannten Teile von M-06/M-17 sind damit zugeordnet; komplette Auswahlübernahme aus M-03 und sitzungsunabhängiges Nachholen aus M-07 werden nicht als fertig behauptet. Die Story benötigt für ihren ohne Ziel nutzbaren Monatsnachweis-/Vormerkungsumfang keine spätere Funktion und erteilt keine öffentliche Automatik- oder Produktionsfreigabe.

### Story 4.3: Eigenes Ziel auswählen und alle offenen Vormerkungen übernehmen

Als Person mit aktivierter Monatsautomatik\
möchte ich ein eigenes Sparziel ausdrücklich auswählen oder wechseln und dabei alle offenen Vormerkungen vollständig übernehmen,\
damit mein Ziel den gespeicherten Überschuss genau einmal erhält und frühere Zuordnungen erhalten bleiben.

**Anforderungsbezug:** FR-15, Zielanrechnungsanteil von FR-14, Erhalt der manuellen Fortschrittssemantik aus FR-10 sowie FR-2, FR-3, FR-11 und FR-13. NFR-1 bis NFR-8 im hier benötigten Web-/Monatsumfang, Freigabe-/Nutzungsanteil von NFR-10 und NFR-11. AR-1 bis AR-4, AR-6, AR-9 bis AR-13, benötigte Migrationen nach AR-17 und Freigabe-/Rücknahme-/Prüfanteile von AR-19/AR-20/AR-22. UX-DR1, UX-DR2, UX-DR4, UX-DR8, UX-DR9, einschlägige Fehler-/Sitzungs-/Zugänglichkeitsregeln aus UX-DR12 bis UX-DR18, Auswahl-/Übernahmeanteil von Flow 3 und Wechselanteil von Flow 5 aus UX-DR19, Erhalt von UX-DR20, UX-DR22 bis UX-DR29 und lokale Fehlersperren/manuelle Korrekturmöglichkeit nach UX-DR30. M-03, M-05 und M-12 werden vollständig sowie der Zielwechsel-/Bindungsanteil von M-13 und der hier benötigte Atomaritätsanteil von M-17 geprüft; spätere historische Differenzkorrekturen und vollständige Löschintegration werden gesondert abgenommen.

**Abhängigkeiten und Umfang:** Baut ausschließlich auf Epic 3 und Stories 4.1/4.2 auf. Umfasst monatswirksame Auswahlhistorie, dauerhafte Zielbindung vorhandener Monatsnachweise einschließlich null, vollständiges Nachholen vor Auswahl, Anrechnung auf eigene vorhandene Ziele und einen zusammenhängenden v2-Zustand für Auswahl/Vormerkung/Zielwerte. Die äußere Koordination ergänzt den Abschlussbaustein um die historische Zielauflösung und einen öffentlichen Differenzbefehl des Zielmoduls. Budget-, Ausgaben-, Ziel- und Nachweismodule greifen weiterhin nur auf eigene Daten zu; die Koordination verbindet ihre öffentlichen Zugänge.

Zielwahl ist eine eigene ausdrückliche Aktion nach Aktivierung und aktiviert kein Konto nebenbei. Sie bietet weder eine nicht spezifizierte Deaktivierung noch eine freie Änderung des Aktivierungs-/Herkunftsmonats. Die öffentliche Automatik bleibt bis zur vollständigen Epic-Abnahme geschlossen; interne Positivprüfungen mit echter Datenbank bewahren die tatsächlich gültige Versions-/Konto-/RLS-/Commitgrenze. Kein späterer Scheduler oder späterer Korrekturcode ist nötig, um die hier beschriebenen vollständigen Auswahl-/Übernahmefälle auszuführen.

**Abnahmekriterien:**

**AC-1 — V2-Vertrag für Auswahl und zusammenhängenden Zustand**

**Angenommen** Aktivierung und Vormerkungen sind über v2 definiert\
**Wenn** Auswahl und ihre Verbraucher vertraglich festgelegt werden\
**Dann** ergänzt der Vertrag `PUT /api/v2/monthly-surplus/selection` mit genau einer erforderlichen eigenen `goalId` als UUID sowie `GET /api/v2/monthly-surplus` für den zusammenhängenden aktuellen Zustand. Dieser enthält `active`, `activationMonth`, `currentMonth`, `selectedGoalId` als UUID oder null, sichere nichtnegative `pendingCents` und die vollständigen eigenen Ziele unter Wiederverwendung des signierten v2-Zielmodells. Der erfolgreiche PUT liefert nach gemeinsamem Commit denselben konsistenten Zustand mit 200. Konto, Herkunftsmonat oder Geldbeträge sind keine frei bestimmbaren Auswahlfelder.\
**Und** 400 für ungültige Auswahlangaben, 401, neutrale identische 404 für fremde/fehlende Ziele, 409 `FEATURE_NOT_AVAILABLE`, 409 `AUTOMATION_NOT_ACTIVE`, 409 `AMOUNT_LIMIT_EXCEEDED` und neutrale unbestätigte Fehler sind definiert. Null als Auswahl ist kein neuer Deaktivierungs-/Löschbefehl. Lesen bleibt nicht mutierend; Bearer und `Cache-Control: no-store` gelten. Vorhandene Aktivierungs-/Vormerkungswege bleiben kompatibel, der archivierte v1-Vertrag unverändert und getrennte Generator-/Kompilier-/Kompatibilitätsprüfungen erfolgreich.

**AC-2 — Historische Auswahl und Zielbindung im richtigen Datenbesitz**

**Angenommen** Ziele, Aktivierung und offene Monatsnachweise bestehen\
**Wenn** neue Flyway-Migrationen die Auswahl-/Zuordnungsdaten bereitstellen\
**Dann** besitzt ausschließlich `monthlysurplus` die monatswirksame Auswahlhistorie und die Zielreferenzen seiner Monatsnachweise. Je Konto/Wirksamkeitsmonat gibt es einen eindeutigen Auswahlstand; der für einen Herkunftsmonat gültige Stand lässt sich unabhängig von der heutigen Auswahl bestimmen. Monatsnachweise behalten Eigentümer, Herkunftsmonat und zuletzt berücksichtigten Überschuss und unterscheiden ohne Budget, offen, zugeordnet sowie verbrauchte historische Zielbindung.\
**Und** der bestehende offene Bestand wird weder gelöscht noch still zugeordnet. Ziel-IDs in historischer Auswahl/Zuordnung sind dauerhafte Referenzwerte; eine spätere Ziellöschung darf sie weder per Cascade entfernen noch auf null setzen. Der Live-Zielbestand bleibt Eigentum von `savingsgoals`, wird über dessen öffentliche Zugänge geprüft und nicht durch ein Löschhinderungs-Fremdschlüsselmodell für historische Referenzen festgehalten. RLS, eigene Filter, Eindeutigkeit und eng begrenzte Webrechte gelten; zukünftige Worker erhalten kein Recht zur nutzergesteuerten Zielauswahl.

**AC-3 — Vor Auswahl fällige Monate nach ihrer bisherigen Auswahl nachholen**

**Angenommen** das Konto ist aktiviert, die nötige interne Gesamtfreigabe ist gültig und ein eigenes vorhandenes Ziel wurde unter Kontosperre geprüft\
**Wenn** eine Auswahl oder ein Wechsel verarbeitet wird\
**Dann** bestimmt die äußere Koordination nach Sperrerwerb genau einen Zeitpunkt/aktuellen Monat und berücksichtigt zunächst alle fälligen noch nicht nachgewiesenen Monate ab Aktivierung, chronologisch und anhand ihrer damaligen Budget-/Monatsendeauswahl. Die neue gewünschte Auswahl wird dafür noch nicht wirksam. Vorhandene Nachweise werden wiederverwendet und Lücken trotz späterer vorhandener Nachweise geschlossen.\
**Und** der Baustein aus Story 4.2 bleibt für Monate ohne historische Auswahl zuständig; Monate mit historischer Auswahl verwenden die in AC-6 beschriebene Zielanrechnung. Das vollständige Nachholen gehört zur selben äußeren Auswahltransaktion und setzt keinen späteren Job voraus. Es wird keine Teilauswahl nach nur einem verarbeiteten Paket bestätigt und kein Monat vor Aktivierung oder noch offener Monat abgeschlossen.

**AC-4 — Alle offenen Vormerkungen einschließlich Nullmonaten vollständig binden**

**Angenommen** nach Berücksichtigung fälliger Monate sind 200 € aus Oktober und 100 € aus November ohne Ziel offen und das gewählte eigene Ziel hat 50 € Fortschritt\
**Wenn** die Auswahl gespeichert wird\
**Dann** wird die gesamte noch offene Summe genau einmal auf den aktuellen Gesamtfortschritt angewendet: 350 € Fortschritt, 0 € vorgemerkt und beide Herkunftsmonate dauerhaft an dieses Ziel gebunden. Die Nachweise behalten 200 € beziehungsweise 100 € als zuletzt berücksichtigten Überschuss; die leere offene Summe entsteht durch Zuordnung, nicht durch Löschen oder Aufnullsetzen der historischen Beträge.\
**Und** alle offenen Nachweise mit Budget werden gebunden, auch wenn ihr Überschuss null oder die ganze offene Summe null ist. Eine Optimierung auf „Summe null, nichts zu tun“ darf diese Bindungen nicht überspringen. Monate ohne Budget bleiben davon verschieden und werden nicht als offene Nullvormerkung übernommen. Wiederholung und erneute Auswahl desselben Ziels übernehmen bereits zugeordnete Monate nicht nochmals; auch ein unverändertes Ziel überspringt das erforderliche Nachholen/Übernehmen nicht.

**AC-5 — Wechsel gilt für offenen und folgende Monate, alte Bindungen bleiben**

**Angenommen** Oktober ist Ziel A zugeordnet und die Person wählt im November B\
**Wenn** der gemeinsame Auswahlvorgang bestätigt wird\
**Dann** bleiben Oktober und seine gespeicherte Zielbindung bei A; November und spätere Monate verwenden den neuen monatswirksamen Auswahlstand B. Bestehende offene Vormerkungen werden vollständig B zugeordnet, bereits zugeordnete Beträge werden nicht von A nach B verschoben. Ein Nullmonat behält seine gespeicherte Ziel-ID für spätere Korrekturen.\
**Und** mehrere Auswahländerungen im noch offenen Monat bestimmen dessen zuletzt gültige Monatsendeauswahl, ohne abgeschlossene Auswahlstände zu verändern. Der Wirksamkeitsmonat wird serverseitig nach Kontosperrerwerb bestimmt, nicht aus Browserdatum oder Anfragefeldern. Die erste Zielwahl verschiebt niemals den Aktivierungsmonat. Anlage eines neuen Ziels allein wählt es nicht aus und eine Zielwahl ersetzt keine ausdrückliche Aktivierung.

**AC-6 — Historisch ausgewähltes Ziel erhält nur seine eigene Monatswirkung**

**Angenommen** ein abgeschlossener noch nicht nachgewiesener Monat hatte ein eigenes Ziel A als Monatsendeauswahl\
**Wenn** dieser Monat im internen Abschlussfall verarbeitet wird\
**Dann** wird sein Überschuss anhand der historischen Budget-/Ausgabewerte bestimmt und bei weiter vorhandenem A genau einmal als geprüfte Differenz auf dessen aktuellen Gesamtfortschritt angewendet. 1.000 € Budget minus 800 € Ausgaben erhöhen 50 € auf 250 €. Ein aktueller Stand von −30 € plus 100 € Anrechnung ergibt 70 €. `savingsgoals` besitzt den öffentlichen Differenzbefehl und validiert seine eigenen Werte; die äußere Koordination führt Nachweis und Zielmutation zusammen, ohne Geschwisterimporte oder fremde Repositoryzugriffe.\
**Und** der Nachweis bewahrt Herkunft, Ziel-ID und zuletzt berücksichtigten Überschuss, auch bei Überschuss null. Ohne Budget entsteht kein offener Betrag. Ist das historisch gebundene Ziel nicht mehr vorhanden, darf seine Auswahl nicht stillschweigend zu „ohne Ziel“ oder zur heutigen Auswahl werden: Der Herkunftsmonat bleibt verbraucht gebunden, ohne neues Ziel, neue Vormerkung oder Umleitung. Die vollständige Löschkoordination für bereits gebundene sowie noch unverarbeitete Monate und das Leeren der offenen Auswahl wird gesondert ergänzt; sie ist zwingend vor öffentlicher Gesamtfreigabe.

**AC-7 — Gesamter Auswahlvorgang ist atomar und hält die Geldgrenzen ein**

**Angenommen** Nachholen, offene Übernahme und Auswahl betreffen mehrere Monate oder Ziele\
**Wenn** der Vorgang unter dem verifizierten Webkonto ausgeführt wird\
**Dann** teilen alle beteiligten öffentlichen Modulzugänge Kontosperre, transaktionslokalen Kontext, physischen Datenbankzugang, fachlichen Zeitpunkt und äußeren Commit. Neue Nachweise, Anrechnungen auf historisch gewählte Ziele, gesamte offene Übernahme, Auswahlhistorie und erforderlicher Nutzungsmarker werden vollständig wirksam oder vollständig verworfen. Es gibt keine inneren Nachhol-Commits oder teilweise bestätigte Übernahme.\
**Und** Einzelwerte, offene Summen, Differenzen und resultierende Fortschritte bleiben exakt innerhalb der sicheren Centgrenzen. Bei Grenz-/Speicher-/Commitfehlern bleiben vorher bestätigte Auswahl, Vormerkungen, Zielstände und Nachweise erhalten. Das gilt auch, wenn ein früher Nachholschritt A schon verändert hätte und die spätere Übernahme nach B scheitert. Es wird weder gerundet noch gekürzt oder ein zulässiger Teil übernommen. Fremde/fehlende Zielwahl ist neutral abgewiesen und verändert keinen Datenbereich.

**AC-8 — Gemeinsamer Zustand verhindert gemischte Anzeige**

**Angenommen** Auswahl, Vormerkungen und Ziele werden angezeigt oder neu geladen\
**Wenn** der neue Übersicht-GET beziehungsweise eine bestätigte Auswahlantwort verarbeitet wird\
**Dann** stammen Aktivierungs-/Auswahlstand, offene Summe und vollständige eigene Ziele aus einem gemeinsamen konsistenten Stand. Der GET verwendet genau einen vor den Teilabfragen bestimmten Monat/Zeitpunkt und eine gemeinsame read-only REPEATABLE-READ-Verbindung über öffentliche Modulprojektionen. Der PUT stellt den vollständigen Ergebniszustand innerhalb seiner äußeren Transaktion zusammen und bestätigt ihn erst nach Commit. Die Oberfläche übernimmt zusammengehörige Werte gemeinsam statt Auswahl, Summe und Fortschritt unabhängig vorwegzunehmen.\
**Und** die älteren Einzel-Lesewege bleiben kompatibel, werden aber nicht zu einem angeblich atomaren neuen Zustand zusammengesetzt. Neuere bestätigte Daten oder offene manuelle Entwürfe werden nicht durch alte Antworten überschrieben. Bei einem Fehler der Automatikübersicht darf die unabhängige manuelle Zielpflege über ihren vorhandenen v2-Leseweg verfügbar bleiben; der Automatikteil bleibt ausdrücklich ungeladen/fehlerhaft und wird nicht mit erfundener null an die Zielwerte angefügt. Eine fehlgeschlagene Authentifizierung eröffnet keinen solchen Ersatzweg.

**AC-9 — Zielauswahl ist ausdrücklich und ihre Folgen sind sichtbar**

**Angenommen** die Person öffnet den Automatikabschnitt mit vorhandenem eigenen Zielbestand\
**Wenn** sie ein Ziel auswählt oder wechselt\
**Dann** bietet die beschriftete Auswahl ausschließlich eigene vorhandene Ziele und eine klare Darstellung der gespeicherten Auswahl beziehungsweise „Kein Ziel ausgewählt“. Das erste oder einzige vorhandene Ziel wird nicht automatisch vorbelegt oder gespeichert; auch neue Zielanlage allein ändert keine Automatikzuordnung. Vor „Auswahl speichern“ ist verständlich, dass die gesamte offene Vormerkung übernommen wird, der Wechsel für den offenen und folgende Monate gilt und bisher zugeordnete Überschüsse bei ihrem Ziel bleiben.\
**Und** die gewünschte Auswahl bleibt bis zum gemeinsamen Commit ein Entwurf. Erst die bestätigte vollständige Antwort zeigt etwa B mit 350 € und 0 € vorgemerkt; bei sicherem Fehlschlag bleiben gespeicherte A-Auswahl, Vormerkung und Fortschritt sichtbar unverändert. Keine Bankübertragung, sofortiger monatlicher Ausführungszeitpunkt oder garantierter Sparerfolg wird behauptet. Der Abschnitt liegt weiterhin innerhalb Sparziele; die drei Hauptbereiche und rote Abmeldung bleiben erhalten.

**AC-10 — Fehler lokal behandeln und manuelle Korrektur offenhalten**

**Angenommen** Auswahl/Übernahme läuft, ein Entwurf ist geöffnet oder der Nachholvorgang ist durch eine Betragsgrenze blockiert\
**Wenn** Doppelsenden, Offline, Funktionssperre, sicherer Fehler oder unbestätigter Ausgang auftreten\
**Dann** wird die zugehörige Auswahlaktion während des Vorgangs/offline gesperrt und der Zustand verständlich sowie assistiv gemeldet; unabhängige manuelle Korrekturmöglichkeiten werden nicht pauschal gesperrt. Insbesondere bleibt absolutes Fortschrittsersetzen ohne erfolgreichen Nachhollauf möglich und löscht keine Monatsbindungen. Der offene Auswahlentwurf bleibt bei Fehlern im offenen Tab erhalten; gespeicherte Werte werden nicht teilweise vorweggenommen.\
**Und** bei unbestätigtem Ausgang wird der gemeinsame aktuelle Zustand vor einem Wiederholungsversuch ermittelt, statt Erfolg oder sicheren Rollback zu behaupten. Wiederholung kann keine bereits gebundenen Vormerkungen doppelt anrechnen. Abmeldung/Ablauf/Kontowechsel verwerfen persönliche Werte/Entwürfe und entkräften späte Antworten samt Auswahl-/Erfolgsstatus. Es gibt keine dauerhafte Browserablage oder Offline-Synchronisation; Fehlermeldungen bleiben neutral und Logs enthalten keine tatsächlichen Geldbeträge, Finanztexte oder Zugangsnachweise.

**AC-11 — Zugängliche Auswahl und Übernahme in allen Prüfgrößen**

**Angenommen** Auswahl, Vormerkung, Fortschritt und Status werden bei 320×568, 390×844, 768×1024 oder 1280×800 CSS-Pixeln genutzt\
**Wenn** die Person Tastatur/Touch/Screenreader beziehungsweise 200 % Textgröße verwendet\
**Dann** sind Label, gespeicherte und entworfene Auswahl, vollständige Übernahmefolge, lange Beträge und Status programmatisch verständlich und ohne Farbe allein wahrnehmbar. Fokus ist sichtbar und nicht verdeckt; Kernaufgaben funktionieren bei 320 CSS-Pixeln ohne horizontales Scrollen. Aktionen sind mindestens 44×44 CSS-Pixel groß und wachsen mit der Schrift.\
**Und** Textkontrast mindestens 4,5:1, Kontrollgrenzen/Fokus mindestens 3:1, logische Lesereihenfolge und reduzierte Bewegung gelten weiter. Tatsächliche signierte Beträge/Prozente und nur begrenzte Balkenfüllung bleiben korrekt. Systemtexte einschließlich zugänglicher Hilfen enthalten keine Zeitzonenerläuterung; nutzereigene Zielnamen werden nicht gefiltert. Bei Ladefehlern bleiben reale Korrekturwege erreichbar.

**AC-12 — Echte Nachweise für Übernahme, Historie und gemeinsamen Rollback**

**Angenommen** Verträge, Auswahlhistorie, allgemeiner Abschluss und zusammenhängende Anzeige sind umgesetzt\
**Wenn** Vertrags-/Kompilierchecks, echte PostgreSQL-/Koordinationsintegrationstests und HTTPS-Browserprüfungen ausgeführt werden\
**Dann** belegen sie 200 € + 100 € offen auf 50 € Zielstand ergibt 350 € und offene Summe null; erneute/gleiche Auswahl ohne Doppelwirkung; Übernahme offener Nullmonate; Ausschluss von Monaten ohne Budget; Zielanlage ohne automatische Auswahl; eigene/fremde/fehlende Ziele und zwei getrennte Konten. Geprüft werden fällige Monate vor Wechsel, fehlende frühere Nachweise trotz späterer vorhandener Monate, mehrere Wechsel im offenen Monat, unveränderlicher Aktivierungsmonat, Oktober bei A/November bei B sowie ausgewählte Monatsanrechnung 1.000 € − 800 € auf 50 € ergibt 250 € und −30 € + 100 € ergibt 70 €.\
**Und** Grenz-/Commitfehler nach schon ausgeführten Nachholschritten beweisen gemeinsamen Rollback aller betroffenen Module und des Nutzungsmarkers. Ein konkurrierender Commit zwischen Übersicht-Teilabfragen erzeugt keinen gemischten Stand. Browserprüfungen erfassen keine Vorauswahl, explizite Folgen, tatsächliche 350-/0-Anzeige, unabhängige manuelle Korrektur bei blockiertem Nachholen, unbestätigten Ausgang, Offline, Entwurfserhalt, späte Antworten, Kontowechsel und alle vier UX-Prüfgrößen. Positivfälle sind nur intern bei gültiger Versions-/Kontengrenze freigegeben; die öffentliche Gesamtfreigabe bleibt geschlossen. M-03/M-05/M-12 sowie die beschriebenen Teile von M-13/M-17 sind zugeordnet, finanzielle historische Differenzkorrektur, vollständige Ziellöschung und sitzungsunabhängiger Job bleiben eigene Folgeumfänge. Die beschriebenen Auswahl-/Übernahmefälle sind ohne diese Folgefunktionen vollständig ausführbar.

### Story 4.4: Historische Ausgaben mit ihrer Monatsüberschusskorrektur ändern oder löschen

Als Person mit aktivierter Monatsautomatik\
möchte ich ältere eigene Ausgaben ändern oder löschen und die notwendige Überschusskorrektur gemeinsam speichern,\
damit Vormerkung und ursprüngliches Sparziel den richtigen Stand behalten, auch nach manueller Fortschrittsänderung.

**Anforderungsbezug:** FR-16 sowie der historische Mutationsanteil von FR-6, Erhalt von FR-2/FR-3, FR-10/FR-11/FR-13 und den Monats-/Zuordnungsregeln aus FR-14/FR-15; kontobezogener Wiederholungs-/Konkurrenzanteil von FR-17. NFR-1 bis NFR-7, hier benötigter Anteil von NFR-8, Nutzungs-/Freigabeanteil von NFR-10 und NFR-11. AR-1 bis AR-4, AR-6, AR-9 bis AR-12, Korrekturanteil von AR-15, bei Bedarf additive Migration nach AR-17 sowie einschlägige Teile von AR-19/AR-20/AR-22. UX-DR1/UX-DR2, UX-DR4/UX-DR5, UX-DR7 bis UX-DR10, Fehler-/Sitzungs-/Zugänglichkeitsregeln aus UX-DR12 bis UX-DR18, Flow 4 und Korrekturanteil von Flow 5 aus UX-DR19, Erhalt von UX-DR20, UX-DR21, UX-DR24 bis UX-DR30. M-04, M-08 bis M-11 und der historische Korrekturanteil von M-06/M-13/M-17 werden vollständig für diese Mutation nachgewiesen; M-15 wird an vorhandener verbrauchter Bindung geprüft und erst mit vollständigem Löschablauf end-to-end abgeschlossen. M-12/M-16 werden bei anschließender Differenzanrechnung beziehungsweise Übererfüllung erneut geprüft.

**Abhängigkeiten und Umfang:** Baut ausschließlich auf Epic 3 und Stories 4.1 bis 4.3 auf. Ergänzt die vorhandene äußere Ausgabenkoordination für Betragsänderung/Löschung eines abgeschlossenen aktivierten Herkunftsmonats um die Neuberechnung genau dieses Monats. Verwendet bestehende öffentliche Befehle/Projektionen und den vorhandenen Abschluss-/Differenzbaustein. Kein neuer Korrekturknopf, separater Geldendpunkt, Nutzer-Beitragsverlauf, nachträgliches Erfassungsdatum oder pauschaler Nachholzwang für alle anderen Monate entsteht. Reine Namensänderung bleibt ohne Finanzwirkung; manuelles absolutes Fortschrittsersetzen bleibt unabhängig von erfolgreichem Nachholen.

Die hier beschriebenen Korrekturen sind intern mit tatsächlicher v2-/Konten-/RLS-/Commitgrenze vollständig ausführbar, ohne späteren Scheduler oder spätere Löschkoordination. Für Prüfungen verbrauchter Herkunftsbindung dürfen entsprechende modulseigene Datenbankfixtures verwendet werden; sie ersetzen keinen späteren durchgängigen Löschtest. Öffentliche Aktivierung/Automatik bleiben bis zur vollständigen Epic-Abnahme geschlossen. Ein abgeschaltetes Funktionsgate darf eine bereits erforderliche Monatskorrektur niemals still überspringen und trotzdem die historische Ausgabe bestätigen.

**Abnahmekriterien:**

**AC-1 — Bestehender V2-Ausgabenvertrag bestätigt den ganzen Vorgang**

**Angenommen** die v2-Ausgabenoperationen aus Story 3.4 werden für ältere Ausgaben verwendet\
**Wenn** historische Betragsänderung oder Löschung vertraglich konkretisiert werden\
**Dann** bleiben `PUT /api/v2/expenses/{expenseId}` mit 200 und vollständiger gespeicherter Ausgabe sowie `DELETE /api/v2/expenses/{expenseId}` mit 204 ohne Körper bestehen. Ihre Erfolgsbedeutung umfasst die erforderliche Monats-/Zielkorrektur und tritt erst nach gemeinsamem Commit ein. Eigentümer und Erfassungsdatum bleiben serverseitig unverändert; der Client übergibt weder Korrekturdifferenz noch Ziel-ID oder Herkunftsmonat.\
**Und** 400, 401, neutrale identische 404 für fremde/fehlende Ausgaben, 409 `AMOUNT_LIMIT_EXCEEDED` für eine nicht vollständig zulässige Finanzwirkung und 409 `FEATURE_NOT_AVAILABLE` bei gesperrter erforderlicher Korrektur sind vor Verbraucheränderung definiert. Unbestätigte Fehler werden nicht zu sicheren Rollbackaussagen umgedeutet. V1 bleibt eingefroren; die getrennten Vertrags-/Generator-/Kompilier-/Kompatibilitätsprüfungen und `no-store`/Bearer-Regeln gelten fort. Kein zusätzlicher öffentlicher Monatsabschluss- oder Korrekturendpunkt wird eingeführt.

**AC-2 — Herkunft und Korrekturpflicht unter Kontosperre bestimmen**

**Angenommen** eine eigene Ausgabe soll bearbeitet oder gelöscht werden\
**Wenn** die äußere Koordination die Mutation verarbeitet\
**Dann** stammen Konto ausschließlich aus verifiziertem JWT-`sub`, Ausgabe und Aktivierungsstand aus nach Kontosperrerwerb gelesenen eigenen Daten sowie aktueller Zeitpunkt/Monat aus genau einem danach erfassten Kalenderkontext. Der unveränderte gespeicherte Erfassungstag bestimmt den Herkunftsmonat. Nur eine tatsächliche Betragsänderung oder Löschung in einem abgeschlossenen Monat ab dem unveränderlichen Erstaktivierungsmonat erfordert die Monatskorrektur.\
**Und** ohne Aktivierung, vor deren Erstmonat sowie im noch offenen Monat gelten die normalen Ausgaben-/Restbudgetregeln ohne vorgezogenen Monatsnachweis. Eine reine Namensänderung oder erneutes PUT mit unverändertem Betrag erzeugt keine Finanzkorrektur und keinen fehlenden Erstabschluss. Ein vor der Monatsgrenze wartender Aufruf verwendet den nach Sperrerwerb maßgeblichen Monat. Budgetänderungen werden dadurch nicht rückwirkend erlaubt und andere Monate nicht vorsorglich nachgeholt.

**AC-3 — Neuberechnung bleibt bei den fünf Datenbesitzern**

**Angenommen** die Mutation erfordert eine Monatskorrektur\
**Wenn** Ausgabe und neue Monatsbasis verarbeitet werden\
**Dann** führt die äußere Anwendung zuerst die zulässige Ausgabenmutation über den öffentlichen Zugang von `expenses` aus und liest deren resultierende exakte eigene Monatssumme sowie das historisch gültige Budget über die jeweiligen öffentlichen Projektionen. `monthlysurplus` liefert und aktualisiert ausschließlich eigenen Nachweis/Bindung; erforderliche Zieländerung läuft über den öffentlichen Differenzbefehl von `savingsgoals`. Die Monatsformel bleibt `max(0, damaliges Budget − eigene Monatsausgaben)`; eine positive Korrektur erzeugt keine Ausgabe und verändert kein Budget.\
**Und** alle Zugänge verwenden dieselbe äußere Transaktion und physische Verbindung, transaktionslokalen Kontokontext, Sperre und fachlichen Zeitpunkt. Kein Geschwisterimport, fremdes Repository, fachliches Gemeinschaftsschema oder modulübergreifendes SQL wird eingeführt. Bestehende Datenbankobjekte werden wiederverwendet; eine tatsächlich nötige Schemaänderung erfolgt ausschließlich additiv per neuer Flyway-Migration ohne Änderung vorhandener Migrationen oder historischer Identitäten.

**AC-4 — Offene Vormerkung nur für ihren Herkunftsmonat korrigieren**

**Angenommen** Oktober ist noch nicht zugeordnet und mit 200 € vorgemerkt, November mit 100 €\
**Wenn** die historische Oktoberänderung dessen Überschuss auf 150 € senkt\
**Dann** ersetzt der Oktober-Nachweis nur seinen Betrag durch 150 €; November bleibt 100 €, die offene Gesamtsumme beträgt 250 € und kein Zielfortschritt ändert sich. Eine spätere Auswahl übernimmt genau diese 250 € einmal. Wird der neue Überschuss null, bleibt der budgetierte Nullmonat offen und kann später mitgebunden werden. Eine Erhöhung oder Löschung der Ausgabe wirkt entsprechend dem neu berechneten, nichtnegativen Überschuss.\
**Und** die zulässige offene Gesamtsumme wird nach Ersatz des betroffenen Monats vollständig geprüft, ohne negative Korrekturschuld oder Aufteilung in Teilübernahmen. Ohne historisch gesetztes Budget bleibt der Monat ausdrücklich ohne Budget und erzeugt auch nach der Ausgabenmutation keine erfundene Nullvormerkung. Andere offene Herkunftsmonate sowie bereits gebundene Ziele bleiben unverändert.

**AC-5 — Nur die Differenz auf den aktuellen ursprünglich gebundenen Fortschritt anwenden**

**Angenommen** Oktober ist mit zuletzt 200 € Überschuss an Ziel A gebunden und der neue Überschuss beträgt 150 €\
**Wenn** die historische Korrektur gemeinsam gespeichert wird\
**Dann** wirkt ausschließlich `150 € − 200 € = −50 €` auf den nach Sperrerwerb aktuellen Gesamtfortschritt von A. Ein inzwischen manuell auf 300 € ersetzter Stand ergibt 250 €; 20 € ergeben −30 €. Der Nachweis speichert danach 150 € als zuletzt berücksichtigten Überschuss und behält A als Ziel. Eine spätere Differenzanrechnung von 100 € erhöht −30 € auf 70 €. Auch nach Wechsel der aktuellen Auswahl zu B bleibt diese Oktoberkorrektur bei A.\
**Und** günstigere oder gelöschte Ausgaben erhöhen den Fortschritt nur um die positive Überschussdifferenz. Wird ein früher angerechneter Überschuss vollständig aufgezehrt, ist die Differenz dessen negatives bisheriges Ausmaß; der neue Monatsüberschuss selbst bleibt null. Es gibt weder Rekonstruktion allein aus Monatsanrechnungen noch getrennte manuelle/automatische Konten, Nullkürzung oder separate Schuld. Auch ein zuvor mit null an A gebundener Monat erhöht bei späterem positivem Überschuss ausschließlich A.

**AC-6 — Fehlenden Erstnachweis historisch schließen und verbrauchte Bindungen erhalten**

**Angenommen** der betroffene abgeschlossene aktivierte Monat hat noch keinen Nachweis oder sein ursprüngliches Ziel ist verbraucht/gelöscht\
**Wenn** die Ausgabe finanziell mutiert und der Monat verarbeitet wird\
**Dann** wird ein fehlender Nachweis nach den historischen Budget-/Monatsendeauswahlregeln erstmals anhand des resultierenden Ausgabenstands geschlossen: ohne Auswahl vormerken, mit weiter vorhandenem historischem Ziel genau einmal anrechnen, ohne Budget keinen Betrag erzeugen. Eine heute andere Auswahl ersetzt nicht die damalige. Es wird kein früherer ungebuchter Betrag erst fiktiv gutgeschrieben und zusätzlich nochmals korrigiert; andere fehlende Monate bleiben separat nachholbar.\
**Und** eine bestehende oder historisch feststellbare gelöschte Zielbindung bleibt verbraucht. Die Mutation darf den Monatsnachweis aktualisieren, aber weder Ziel wiederanlegen noch neue Vormerkung oder Anrechnung an B erzeugen. Historische Ziel-ID und Verbrauchsinformation gehen nicht verloren; Nullmonate mit Budget bewahren ihre vorhandene Bindung. Die vollständige Ziellöschkoordination einschließlich Verbrauch noch unverarbeiteter Monate und Leeren der offenen Auswahl wird gesondert abgenommen und für die hier prüfbare Korrekturlogik nicht vorausgesetzt.

**AC-7 — Geldgrenzen und Commitfehler verwerfen auch die Ausgabenmutation**

**Angenommen** historische Ausgabenmutation, Nachweis und gegebenenfalls Fortschritt gehören zusammen\
**Wenn** Monats-/Vormerkungssumme, Differenz, resultierender Fortschritt oder Commit geprüft werden\
**Dann** sind alle Werte und Zwischenrechnungen exakt, gespeicherte/berechnete Centwerte innerhalb ±9.007.199.254.740.991 und Ausgabe weiterhin positiv. Unzulässige Geldwirkung oder Fehler verwirft die gesamte Transaktion einschließlich geänderter/gelöschter Ausgabe, Nachweis, Zielstand und erforderlichem dauerhaftem Nutzungsmarker. Es gibt keine bestätigte Ausgabenmutation mit nachzuliefernder Korrektur, innere Commits, Rundung, Kürzung oder Teilerfolg.\
**Und** ein sicherer Fehlschlag erhält den zuvor bestätigten Stand aller Module. Die Versionsbarriere und dauerhafte Rücknahmesperre aus Epic 3 gelten auch für diese Wirkungen. Wenn eine erforderliche Korrektur technisch gesperrt ist, scheitert der zusammengehörige Vorgang geschlossen; unabhängige manuelle Pflege bleibt nach ihren eigenen gültigen Freigaberegeln verfügbar. Logs enthalten keine tatsächlichen Beträge, Ausgaben-/Zieltexte, Tokens oder Finanz-Snapshots.

**AC-8 — Wiederholung und Konkurrenz verlieren keine bestätigte Wirkung**

**Angenommen** Korrektur, manuelles Fortschrittsersetzen, erneute Auswahl oder ein weiterer Aufruf überschneiden sich\
**Wenn** sie dieselbe technische Kontosperre verwenden\
**Dann** werden Zustand und zuletzt berücksichtigter Überschuss nach Sperrerwerb neu gelesen. Dasselbe PUT erzeugt nach wirksamer Korrektur keine zweite Differenz, ein erneut gelöschter Eintrag die neutrale 404 ohne neue Geldwirkung. Zwei unterschiedliche Änderungen wirken in ihrer tatsächlichen serialisierten Reihenfolge; kein außerhalb der Sperre gelesener Zielgesamtstand wird zurückgeschrieben.\
**Und** manuelles Ersetzen vor einer −50-€-Korrektur von 300 € ergibt 250 €; ein späteres ausdrückliches manuelles Ersetzen setzt dagegen seinen angegebenen Gesamtstand. Beide Reihenfolgen erhalten Monatsmetadaten. Auswahl vor Korrektur trifft die dann fest bestehende Herkunftsbindung; Korrektur vor Übernahme liefert deren neu berechnete Vormerkung. Ein grenzbedingt blockierter anderer Nachhollauf sperrt weder das unabhängige manuelle Ersetzen noch eine zulässige reine Namensänderung. Eine spätere Workeranbindung muss dieselbe vorhandene Sperre/Koordination nutzen; ihre Rollen-/Schedulerprüfung bleibt eigener Umfang.

**AC-9 — Historische Änderung und Löschung verständlich gemeinsam bestätigen**

**Angenommen** die Person bearbeitet oder löscht eine historische eigene Ausgabe im Bereich Ausgaben\
**Wenn** sie den Vorgang auslöst oder ein Fehler auftritt\
**Dann** machen verständliche Systemtexte die mögliche gemeinsame Korrektur von Vormerkung beziehungsweise ursprünglichem Sparziel deutlich, ohne eine vom Browser berechnete Differenz als gesichert auszugeben. Löschen benennt die konkrete Ausgabe und die Folge, verlangt die bestehende ausdrückliche Bestätigung und bleibt mit Abbrechen/Escape ohne Mutation. Während des Vorgangs wird nur zugehöriges Doppelsenden verhindert; Erfolg und geänderte Liste erscheinen erst nach gemeinsamer Serverbestätigung.\
**Und** ein sicherer Korrektur-/Grenzfehler meldet auch die Ausgabenänderung als nicht gespeichert und erhält den Bearbeitungsentwurf im offenen Tab sowie den zuvor bestätigten Listeneintrag. Bei unbestätigtem Ausgang wird dieser ausdrücklich benannt und der aktuelle eigene Zustand vor erneutem Senden ermittelt. Offline bleibt Speichern gesperrt; es wird keine spätere Synchronisation versprochen. Unabhängige manuelle Fortschrittskorrektur bleibt erreichbar. Finanzdaten/Entwürfe und späte Erfolgsantworten werden bei Abmeldung/Ablauf/Kontowechsel verworfen.

**AC-10 — Nächste Monats- und Sparzielansicht zeigt den frischen gemeinsamen Stand**

**Angenommen** eine Ausgabenmutation mit Monatskorrektur wurde bestätigt oder ihr Ausgang wird geklärt\
**Wenn** die Person anschließend Monat oder Sparziele öffnet\
**Dann** werden die betroffenen bisherigen Finanzansichten als zu erneuern behandelt und die vorhandenen konsistenten Lesewege neu geladen. Sparziele übernimmt Auswahl, Vormerkung und vollständige eigene Zielwerte gemeinsam aus der Übersicht aus Story 4.3; Monat lädt seine konsistente Monatsübersicht. Das wird ohne Änderung der bestätigten PUT-/DELETE-Erfolgskörper erreicht. Alte Werte gelten bis zur Erneuerung nicht als frischer bestätigter Korrekturstand.\
**Und** −30 € bei 100 € Ziel erscheinen tatsächlich als −30 € und −30 %, Balken leer; spätere 70 € erscheinen als 70 % und Übererfüllung beispielsweise 150 € als 150 % bei vollem Balken. Nur die Füllung bleibt auf 0–100 % begrenzt. Ladefehler erzeugen keine erfundene null; ältere Antworten überschreiben weder neuere bestätigte Werte noch offene manuelle Entwürfe. Bei Monatswechsel bleibt der einmal bestimmte serverseitige Kalender maßgeblich, im UI erscheinen keine Zeitzonenerläuterungen.

**AC-11 — Korrekturzustände und Löschdialog bleiben zugänglich**

**Angenommen** Bearbeitung, Löschbestätigung, Fehler und anschließender Fortschritt werden bei 320×568, 390×844, 768×1024 oder 1280×800 CSS-Pixeln genutzt\
**Wenn** Tastatur, Touch, Screenreader oder 200 % Textgröße eingesetzt werden\
**Dann** bleiben vollständige Beträge/Vorzeichen, Herkunftsdatum, Fehlermeldung und gemeinsamer Speicherstatus verständlich beschriftet und programmatisch zugeordnet. Dialogfokus ist eingeschlossen und gelangt nach Abbrechen zum Auslöser, nach Löschen zum nächsten sinnvollen Eintrag beziehungsweise zur Erfassung. Status werden assistiv angekündigt, Kernaufgaben funktionieren bei 320 CSS-Pixeln ohne horizontales Scrollen.\
**Und** mindestens 44×44 CSS-Pixel große Aktionen, mindestens 48 CSS-Pixel hohe Geldfelder, sichtbarer nicht verdeckter Fokus, Textkontrast mindestens 4,5:1, Kontroll-/Fokuskontrast mindestens 3:1 und reduzierte Bewegung gelten fort. Tatsächliche negative Prozentwerte sind auch assistiv korrekt; Farbe allein vermittelt keine Folge. Drei Hauptbereiche, rote Abmeldung und nutzereigene Namen wie „Berlin-Fahrt“ bleiben erhalten.

**AC-12 — Echte Nachweise für Differenz, Erstabschluss und gesamten Rollback**

**Angenommen** Koordination, bestehende v2-Wege und frische Rückkehransichten sind umgesetzt\
**Wenn** Vertrags-/Kompilierchecks, echte PostgreSQL-/Koordinationsintegrationstests und HTTPS-Browserprüfungen laufen\
**Dann** belegen sie offene Oktoberkorrektur 200 € auf 150 € plus November 100 € und spätere Übernahme von 250 €; negative/positive Differenzen nach Betrag und Löschung; 300 € auf 250 €, 20 € auf −30 € und spätere 100 € auf 70 €. Geprüft werden A-Bindung nach Wechsel zu B, gebundener Nullmonat mit später positiver Wirkung, null/negativer Rest, fehlendes Budget, fehlender Erstnachweis mit damaliger Auswahl sowie vorhandene verbrauchte Bindung ohne Wiederanlage/Umleitung. Inaktive Konten, Monate vor Aktivierung, offener Monat und reine Namensänderung erzeugen keine unzulässigen Monatswirkungen.\
**Und** mindestens zwei Konten, fremde/fehlende Ausgaben, RLS/fehlender Kontext, Verbindungswiederverwendung, Wiederholungen, gezielt überlappende manuelle/automatische Modulbefehle in beiden Reihenfolgen und Sperrwartezeit über Monatsgrenze sind erfasst. Grenz-/Commitfehler nach schon ausgeführter Ausgabenmutation beweisen gemeinsamen Rollback einschließlich Löschung und Nutzungsmarker. Browserfälle erfassen Bestätigungsdialog, sichere/unbestätigte Fehler, Entwurfserhalt, Offline, späte Antworten, Konto-/Sitzungswechsel, frische gemeinsame Ansichten und tatsächliche negative/übererfüllte Darstellung in allen vier Prüfgrößen. Positive Automatikfälle bleiben testintern bei gültiger Versions-/Kontengrenze; öffentliche Gesamtfreigabe, Workerrolle/-lauf und vollständiger Ziellöschflow werden hier nicht vorweggenommen.

### Story 4.5: Sparziel löschen und seine historischen Monatsbindungen verbraucht halten

Als Person mit eigenen Sparzielen\
möchte ich ein Ziel samt Fortschritt nach verständlicher Bestätigung löschen können, auch wenn Monatsabschlüsse noch ausstehen,\
damit frühere Zuordnungen nicht wieder als Geldwirkung auftauchen und offene Vormerkungen erhalten bleiben.

**Anforderungsbezug:** Vollständige Löschsemantik aus FR-9, Erhalt von FR-2/FR-3, FR-10/FR-11/FR-13 sowie Lösch-/Vormerkungsanteil von FR-14/FR-15; Korrektur nach gelöschter Bindung aus FR-16 und kontobezogener Wiederholungs-/Konkurrenzanteil von FR-17. NFR-1 bis NFR-7, hier benötigter Anteil von NFR-8, Bestands-/Nutzungs-/Freigabeanteil von NFR-10 und NFR-11. AR-1 bis AR-4, AR-6, AR-9 bis AR-12, AR-14, verbrauchte Korrekturbindung nach AR-15, nötige additive Migration nach AR-17 und einschlägige Teile von AR-19/AR-20/AR-22. UX-DR1/UX-DR2, UX-DR4, UX-DR8 bis UX-DR10, Leer-/Fehler-/Sitzungs-/Zugänglichkeitsregeln aus UX-DR12 bis UX-DR18, Löschanteil von Flow 5 aus UX-DR19, Erhalt von UX-DR20, UX-DR22 bis UX-DR29 und Löschung ohne Nachholzwang nach UX-DR30. M-14/M-15 werden durchgängig sowie die Lösch-/Konkurrenzanteile von M-13/M-17 geprüft; Nullmonatsbindung und noch unverarbeitete historische Auswahl sind ausdrücklich eingeschlossen.

**Abhängigkeiten und Umfang:** Baut ausschließlich auf Epic 3 und Stories 4.1 bis 4.4 auf. Erweitert den vorhandenen äußeren v2-Ziellöschfall um modulseigenen dauerhaften Verbrauch, historisch wirksames Leeren einer betroffenen aktuellen Auswahl, frisches gemeinsames Nachladen und die verständliche Löschbestätigung. Ein schmaler persistenter Löschmarker je Konto/Ziel-ID zusammen mit erhaltener Auswahlhistorie sichert auch noch nicht materialisierte abgeschlossene Monate; vorhandene Nachweise behalten ihre Herkunft. Dadurch setzt Löschen weder Berechnung aller ausstehenden Monate noch erfolgreiches Anrechnen auf das gleich entfallende Ziel voraus.

Kein späterer Scheduler, keine Workerrolle und keine zusätzliche Nutzer-Verlaufsansicht sind Voraussetzung der hier vollständigen Lösch-/Korrekturfälle. Interne Positivprüfungen nutzen die tatsächliche Versions-/Konten-/RLS-/Commitgrenze und echte Datenbank. Öffentliche Aktivierung und automatische Verarbeitung bleiben bis zur vollständigen Epic-Abnahme geschlossen; die Bestätigung dieser Story ist keine Betriebsfreigabe.

**Abnahmekriterien:**

**AC-1 — Bestehender V2-Löschvertrag umfasst den ganzen Lebenszyklus**

**Angenommen** eine Person löscht ein eigenes Ziel über den bestehenden v2-Vertrag\
**Wenn** `DELETE /api/v2/savings-goals/{id}` erfolgreich bestätigt wird\
**Dann** bedeutet 204 ohne Antwortkörper, dass Ziel und tatsächlicher Fortschritt entfernt und alle erforderlichen eigenen Verbrauchs-/Auswahländerungen gemeinsam committed sind. Konto, Herkunftsmonat, umzuleitender Betrag oder Ersatzziel sind keine Löschparameter. Ungültige ID, fehlender Zugang, fremde/fehlende Ziele und unbestätigte Fehler bleiben mit 400, 401, identischer neutraler 404 beziehungsweise bestehender neutraler Fehlerform beschrieben.\
**Und** v2-Pfade, Erfolgskörper und vorhandene Zieloperationen bleiben kompatibel, v1 unverändert eingefroren. Bearer und `Cache-Control: no-store` gelten; getrennte Vertrags-/Generator-/Kompilier-/Kompatibilitätsprüfungen erfassen die Beschreibung vor Verbraucheränderung. Es entsteht weder ein neuer öffentlicher Verbrauchs-/Jobendpunkt noch ein clientseitig bestimmbarer Löschmarker.

**AC-2 — Verbrauch gehört dem Automatikmodul und bleibt dauerhaft geschützt**

**Angenommen** bestehende Auswahlhistorie und Monatsnachweise können auf ein später gelöschtes Ziel verweisen\
**Wenn** die hierfür benötigte neue Flyway-Migration und öffentliche Modulzugänge ergänzt werden\
**Dann** besitzt ausschließlich `monthlysurplus` den minimalen dauerhaften Löschmarker mit Konto/Ziel-ID und die eigenen Verbrauchs-/Auswahlzustände. Der Marker ist je Konto/Ziel-ID eindeutig und gemeinsam mit der erhaltenen Historie ausreichend, um bei späterem Abschluss/Korrektur eine verbrauchte Herkunftsbindung zu erkennen. Das Ziel samt Name, Zielbetrag und Fortschritt bleibt Eigentum von `savingsgoals` und wird dort gelöscht; diese Finanzwerte werden nicht als neue Schatten-Zielablage im Marker kopiert.\
**Und** vorhandene Ziel-IDs, Herkunftsmonate und zuletzt berücksichtigte Überschüsse bleiben in historischen Nachweisen erhalten. Kein Cascade, `SET NULL` oder Löschhinderungs-Fremdschlüssel auf den Live-Zielbestand zerstört diese Bedeutung. Erzwungene RLS, eigene Abfragefilter und begrenzte Webrechte schützen die neuen Objekte; bei tatsächlich erforderlichen Rechten gilt die wiederholbare administrative Bereitstellung aus Epic 3. Historische Migrationen bleiben unverändert. Gewöhnliche Ziellöschung ohne Aktivierung oder vorhandene Automatikbindung erzeugt keine neue Aktivierung und keine erfundenen Monatswirkungen.

**AC-3 — Ziel, bestehende Bindungen und aktuelle Auswahl gemeinsam ändern**

**Angenommen** das Ziel gehört dem verifizierten Webkonto\
**Wenn** die äußere Löschkoordination verarbeitet wird\
**Dann** erwirbt sie vor zustandsabhängigem Lesen die gemeinsame Kontosperre, prüft das eigene vorhandene Ziel und erfasst danach genau einen fachlichen Zeitpunkt/aktuellen Monat. Öffentliche Zugänge von `monthlysurplus` verbrauchen bestehende Bindungen dieses Ziels und sichern dessen dauerhaften Löschmarker; der öffentliche Löschbefehl von `savingsgoals` entfernt das Ziel samt tatsächlichem Fortschritt. Alle Schritte teilen transaktionslokalen Kontext, physische Verbindung, fachlichen Zeitpunkt und äußeren Commit.\
**Und** war dieses Ziel aktuell ausgewählt, wird die Auswahl für den offenen und folgende Monate intern auf keine Auswahl gesetzt. Frühere abgeschlossene Auswahlstände bleiben unverändert. War B aktuell ausgewählt und A wird gelöscht, bleibt B ausgewählt. Die interne löschbedingte Leerung führt keinen neuen frei nutzbaren Null-Auswahl-/Deaktivierungsbefehl ein. Aktivierung und Erstaktivierungsmonat bleiben unverändert; andere Ziele, Konten, Budget und Ausgaben ändern sich nicht. Kein Modul liest fremde Tabellen oder importiert Geschwistermodule.

**AC-4 — Noch unverarbeitete abgeschlossene Bindungen ohne Nachholen verbrauchen**

**Angenommen** ab Aktivierung fehlen noch Monatsnachweise, deren historische Monatsendeauswahl das zu löschende Ziel A war\
**Wenn** A gelöscht wird\
**Dann** schützt der atomare Löschmarker zusammen mit erhaltener Auswahlhistorie auch diese Herkunftsmonate dauerhaft vor späterer Vormerkung, Anrechnung auf B oder Wiederanlage von A. Es ist nicht nötig, alle ausstehenden Budget-/Ausgabesummen vorher zu berechnen, Nachweise für jeden Monat zu materialisieren oder den entfallenden Fortschritt noch zu erhöhen. Die Verbrauchserkennung umfasst auch historische budgetierte Nullmonate. Monate ohne Budget bleiben ohne erfundene Vormerkung.\
**Und** spätere Ausführung des vorhandenen Abschlussbausteins sowie die Erstnachweisanlage bei historischer Ausgabenmutation erkennen die Bindung als verbraucht und erzeugen keine neue Geldwirkung. Noch nicht verarbeitete Monate mit damaliger Auswahl eines anderen vorhandenen Ziels bleiben unabhängig nachholbar; Monate ohne damalige Auswahl bleiben vormerkbar. Die Leerung der aktuellen Auswahl wirkt nicht rückwirkend auf diese abgeschlossenen historischen Stände und erzeugt keine Verarbeitung vor Aktivierung.

**AC-5 — Offene Vormerkungen erhalten und nachfolgende Monate richtig behandeln**

**Angenommen** es bestehen offene Vormerkungen von 200 € und 100 € und aktuell ist A ausgewählt\
**Wenn** A gelöscht und anschließend der gemeinsame Zustand geladen wird\
**Dann** bleiben beide offenen Herkunftsmonate und 300 € Vormerkung unverändert; A und sein Fortschritt entfallen, die Automatik bleibt mit gleichem Erstmonat aktiv und es ist kein Ziel ausgewählt. Der noch offene Monat und folgende Monate ohne neue Auswahl werden nach ihrem Abschluss vorgemerkt. Die nächste ausdrückliche Auswahl von B übernimmt nur tatsächlich offene Vormerkungen nach den bestehenden Regeln, niemals die verbrauchten A-Monate.\
**Und** offene Nullmonate bleiben offen, bereits A-gebundene Nullmonate bleiben verbraucht. Das Löschen eines nicht aktuell ausgewählten Ziels lässt die heutige andere Auswahl unberührt. Ein neues Ziel, auch mit gleichem Namen wie A, erhält eine neue Identität, startet mit null und wird nicht automatisch ausgewählt; es erbt weder A-Bindungen noch A-Fortschritt. Nach Löschung des letzten Ziels bleiben Aktivierungsstatus, Vormerkung und der Weg zur Zielanlage sichtbar.

**AC-6 — Spätere historische Korrektur erzeugt keine neue Geldwirkung**

**Angenommen** ein bereits zugeordneter oder beim Löschen noch unverarbeiteter abgeschlossener Monat war historisch an A gebunden, A ist gelöscht und B inzwischen ausgewählt\
**Wenn** eine Ausgabe dieses Monats teurer, günstiger oder gelöscht wird\
**Dann** ist die Ausgabenmutation nach Story 4.4 weiterhin zusammen mit ihrem erforderlichen Nachweis zulässig, sofern ihre eigenen Grenzen eingehalten werden. Die Herkunft bleibt verbraucht; weder B noch die offene Vormerkung werden durch diese Korrektur verändert. Der neue Überschuss darf im technischen Monatsnachweis festgehalten werden, ohne dessen verbrauchte Bedeutung oder ursprüngliche Ziel-ID zu verlieren. A wird nicht wiederhergestellt.\
**Und** erneuter Abschluss, wiederholte Ausgabenänderung und spätere Auswahl eines anderen Ziels setzen diese Herkunft nicht frei. Das gilt auch bei ehemaligem Überschuss null und nach manueller Fortschrittsänderung von B. Bereits bestehende unzugeordnete Vormerkungen und andere historische Zielbindungen bleiben unverändert. Dieser Fall wird über den tatsächlichen Löschaufruf und die tatsächliche folgende v2-Ausgabenmutation geprüft, nicht nur über vorbereitete Verbrauchsfixtures.

**AC-7 — Kein Nachholzwang, keine Teilbestätigung und keine verlorene Wirkung**

**Angenommen** eine fällige Anrechnung würde an einer Betragsgrenze scheitern oder Löschung überschneidet sich mit Auswahl, Fortschrittsersatz oder Abschluss\
**Wenn** die Anwendungsfälle unter derselben Kontosperre ausgeführt werden\
**Dann** bleibt die Ziellöschung ohne erfolgreichen Nachhollauf und ohne vorheriges Addieren auf das entfallende Ziel möglich, auch bei negativem, übererfülltem oder maximalem zulässigem Fortschritt und blockierten Monaten anderer Ziele. Sie erzeugt keine neue Summen-/Anrechnungsberechnung als Löschvoraussetzung. Alle Verbrauchs-, Auswahl-, Ziel- und erforderlichen Nutzungsmarkeränderungen committen gemeinsam oder werden vollständig verworfen; ein Fehler nach Teilbefehlen lässt den zuvor bestätigten Stand aller Module bestehen.\
**Und** liest ein Abschluss zuerst und committet, entfernt die anschließende Löschung das Ziel und verbraucht dessen Bindung. Löscht der Aufruf zuerst, erzeugt der anschließende Abschluss keine Wirkung für A; spätere Auswahl/Fortschrittsmutation von A endet neutral ohne Wiederanlage. Nach Löschung von A bleibt eine inzwischen wirksame Auswahl B erhalten. Wiederholte Löschung liefert die neutrale 404 und vervielfacht keinen Verbrauch. Ein bereits gesetzter dauerhafter Nutzungsmarker wird durch das Entfernen letzter Ziele oder negativer Werte niemals aufgehoben; Rückfall auf v1 bleibt gesperrt.

**AC-8 — Löschdialog erklärt Fortschrittsverlust und künftige Vormerkung**

**Angenommen** die Person löst die Löschaktion bei einem eigenen Ziel aus\
**Wenn** die Bestätigung erscheint\
**Dann** nennt sie das konkrete Ziel, den Verlust des Ziels samt tatsächlichem Fortschritt und dass frühere zugehörige Monatsüberschüsse nicht auf ein anderes Ziel übertragen oder neu vorgemerkt werden. Für ein ausgewähltes Ziel wird verständlich erklärt, dass weitere Überschüsse ohne neue Zielauswahl vorgemerkt werden und bereits offene Vormerkungen erhalten bleiben. Die Erklärung umfasst auch noch nicht verarbeitete abgeschlossene Monate mit damaliger Auswahl dieses Ziels, ohne technische Infrastrukturbegriffe im Produktfluss.\
**Und** „Löschen“ und „Abbrechen“ sind deutlich getrennt, Escape/Abbrechen ändern nichts, es gibt keine verschachtelte Dialogkette und keine automatische Auswahl eines Ersatzes. Die Person muss nicht erst einen Monatsabschluss starten oder einen anderen Zielstand ändern. Der Dialog behauptet weder Bankübertragung noch verifizierten Kontostand oder Erlass einer separaten Schuld. Nutzereigene Namen bleiben vollständig erhalten; Systemtexte einschließlich zugänglicher Hilfen enthalten keine Zeitzonenerläuterung.

**AC-9 — Löscherfolg und frischer gemeinsamer Stand bleiben unterscheidbar**

**Angenommen** die Löschung läuft, scheitert oder wird mit 204 bestätigt\
**Wenn** die Oberfläche den Ausgang verarbeitet\
**Dann** verhindert sie zugehöriges Doppelsenden und zeigt Erfolg erst nach gemeinsamer Bestätigung. Danach wird A aus dem nutzbaren Zielbestand entfernt und die betroffene Automatikübersicht aus Story 4.3 konsistent neu geladen, ohne dem unveränderten 204-Körper Auswahl-/Geldwerte hinzuzuerfinden. Bis zum frischen Gesamtstand bleiben dessen abhängige Werte ausdrücklich ungeladen statt als vermeintlich aktuelle alte Auswahl oder erfundene null zu erscheinen. Ein anschließender Ladefehler macht den bestätigten Löscherfolg nicht zu einem fehlgeschlagenen Löschvorgang und löst keine erneute Löschung aus.\
**Und** bei sicherem Löschfehler bleiben bisheriger Ziel-/Auswahl-/Vormerkungsstand sichtbar erhalten und der Vorgang wird nicht teilweise bestätigt. Bei unbestätigtem Ausgang wird der aktuelle eigene Zustand vor Wiederholung geklärt. Offline ist Senden gesperrt; Auswahl-/Fortschrittsentwürfe bleiben bei Fehlern nur im offenen Tab und werden nach bestätigt entfallenem Ziel verworfen. Unabhängige Korrekturmöglichkeiten bleiben erreichbar. Abmeldung/Ablauf/Kontowechsel verwerfen persönliche Daten, Entwürfe und späte Antworten; ältere Leseantworten dürfen A weder wieder anzeigen noch als auswählbar einsetzen. Es gibt keine dauerhafte Browserablage oder Offline-Synchronisation.

**AC-10 — Zugänglicher Dialog und nutzbare leere Zielansicht**

**Angenommen** Löschdialog, laufender Status, Fehler und die Ansicht nach Löschung werden bei 320×568, 390×844, 768×1024 oder 1280×800 CSS-Pixeln genutzt\
**Wenn** Tastatur, Touch, Screenreader oder 200 % Textgröße eingesetzt werden\
**Dann** sind Ziel, Folgen, Aktionen und Status vollständig beschriftet beziehungsweise programmatisch zugeordnet. Der Fokus bleibt im geöffneten Dialog, ist sichtbar und nicht verdeckt und kehrt nach Abbrechen zum Auslöser, nach Löschen zum nächsten sinnvollen Ziel oder zur Zielanlage zurück. Fortschrittsvorzeichen, offene Vormerkung und fehlende Auswahl sind auch assistiv verständlich; Farbe allein vermittelt keine Folge. Kernaufgaben funktionieren bei 320 CSS-Pixeln ohne horizontales Scrollen.\
**Und** mindestens 44×44 CSS-Pixel große Aktionen, Textkontrast mindestens 4,5:1, Kontroll-/Fokuskontrast mindestens 3:1, logische Lesereihenfolge und reduzierte Bewegung gelten fort. Der Automatikabschnitt bleibt auch ohne Ziele erreichbar; „aktiv ohne Ziel“ wird nicht als deaktiviert oder pausiert bezeichnet. Drei Hauptbereiche und dieselbe rote Abmeldung bleiben erhalten, ohne einen neuen Verwaltungs-/Verlaufsbereich einzuführen.

**AC-11 — Echte Nachweise für Löschung ohne Nachholen und verbrauchte Erstmonate**

**Angenommen** Migration, äußere Löschkoordination, Abschluss-/Korrekturintegration und Dialog sind umgesetzt\
**Wenn** Vertrags-/Kompilier-/Architekturchecks, echte PostgreSQL-/Koordinationsintegrationstests und HTTPS-Browserprüfungen ausgeführt werden\
**Dann** belegen sie Löschung des aktuell ausgewählten, eines nicht ausgewählten und des letzten Ziels; Erhalt einer anderen Auswahl B und offener Vormerkungen einschließlich Nullmonaten; Verbrauch vorhandener sowie noch unverarbeiteter historischer A-Monate. Ein absichtlich grenzbedingt blockierter Nachhollauf verhindert Löschung nicht und kein entfallender Fortschritt wird zuvor erhöht. Tatsächliche spätere Betragsänderung/Löschung über v2 und wiederholter Abschluss bewirken weder Wiederanlage noch Umleitung oder neue Vormerkung. Monatsgrenze während Sperrwartezeit, historisch anderes Ziel, ohne Budget, Monate vor Aktivierung, inaktives Konto sowie Neuanlage mit gleichem Namen sind eingeschlossen.\
**Und** mindestens zwei Konten, neutrale Fremd-/Fehlendfälle, fehlender Kontext/RLS, Verbindungswiederverwendung, wiederholtes Löschen, gezielt überlappende Abschluss-/Auswahl-/manuelle Fortschrittsbefehle in beiden Reihenfolgen und Rollback nach bereits geändertem Verbrauch/Auswahl beweisen die gemeinsame Grenze. Browserfälle prüfen erklärte Folgen, Abbrechen/Escape, Fokus, tatsächlichen fehlenden Ziel-/Auswahlzustand, erhaltene Vormerkung, letzten Zielbestand, bestätigten Löscherfolg bei anschließendem Ladefehler, Offline, unbestätigten Ausgang und späte Antworten/Kontowechsel in allen vier UX-Prüfgrößen. M-14/M-15 und die benannten Teile von M-13/M-17 sind damit durchgängig zugeordnet; echte Workerrolle, faire Ausführung ohne Sitzung und öffentliche Gesamtfreigabe bleiben separate Folgeabnahmen.

### Story 4.6: Fällige Monate ohne Nutzersitzung über einen begrenzten Jobzugang verarbeiten

Als Person mit aktivierter Monatsautomatik\
möchte ich fällige abgeschlossene Monate serverseitig ohne Anmeldung oder geöffnete App verarbeiten lassen können,\
damit meine Monatswirkung erhalten bleibt und der Hintergrundzugang nur die dafür nötigen Kontodaten verwenden kann.

**Anforderungsbezug:** Sicherer sitzungsunabhängiger Verarbeitungsbaustein von FR-17, Erhalt von FR-2/FR-3 und der bestehenden Monats-/Ziel-/Korrekturregeln aus FR-9/FR-10/FR-14 bis FR-16. NFR-1/NFR-2, NFR-4/NFR-5/NFR-7, kontobezogener Wiederholungs-/Konkurrenzanteil von NFR-8, Protokollhygiene aus NFR-9, Nutzungs-/Versionsanteil von NFR-10 und Geheimnisschutz aus NFR-12. AR-1 bis AR-3, Trennung zum Webkontext aus AR-6, AR-7 bis AR-12, Erhalt von AR-14/AR-15, begrenzter Konto-Verarbeitungsanteil von AR-16, AR-17/AR-18 sowie einschlägige Teile von AR-19 bis AR-23. Sitzungsunabhängigkeit aus UX-DR16/UX-DR22, serverseitige Grundlage von Flow 3 aus UX-DR19 sowie Erhalt tatsächlicher Zielwerte/frischer Rückkehransichten aus UX-DR25/UX-DR29. M-07 wird für den ohne Sitzung ausführbaren Nachholbaustein und M-17 für echte Web-/Jobrollen und gemeinsamen Rollback geprüft; die tatsächliche automatische Start-/Wiederholungssteuerung bleibt gesondert abzunehmen.

**Abhängigkeiten und Umfang:** Baut ausschließlich auf Epic 3 und Stories 4.1 bis 4.5 auf. Umfasst wiederholbare Rollenbereitstellung, minimale neue technische Fälligkeitsdaten im Eigentum von `monthlysurplus`, geschützte begrenzte Kontoermittlung und einen intern aufrufbaren, vollständig ausführbaren Jobanwendungsfall für ein fälliges Konto mit begrenztem Monatspaket. Er verwendet dieselben öffentlichen Monatsbausteine wie Webauswahl/Korrektur; er ist weder ein neuer Fachalgorithmus noch ein öffentlich aufrufbarer Verwaltungsweg. Eine spätere Scheduler-/Wiederholungsschleife ist keine Voraussetzung für seine echten Rollen-/Datenbank-/Nachholnachweise.

Die öffentliche Automatik bleibt geschlossen. Positive Jobfälle laufen ausschließlich intern mit gültiger tatsächlicher v1-Stilllegungs-/v2-Funktionsgrenze, echten begrenzten Datenbankrollen und explizit aktivierten Testkonten. Kein Test ersetzt die Jobidentität durch einen Nutzer-JWT oder privilegierten Datenbankbesitzer. Es entsteht keine neue Produktoberfläche; regelmäßiges Auslösen, Kontofairness, Fehlerverzögerung und Betriebsmetriken sind eigene nächste Abnahmeumfänge.

**Abnahmekriterien:**

**AC-1 — Rollen und benötigte Fälligkeitsdaten wiederholbar bereitstellen**

**Angenommen** eine frische oder bereits initialisierte Datenbank enthält den bisherigen v2-/Automatikbestand\
**Wenn** administrative Bereitstellung und neue Flyway-Migrationen ausgeführt werden\
**Dann** stehen `tnbp_monthly_worker` und eine gesonderte `NOLOGIN`-Eigentümerrolle für die Discovery-Funktion mit ausdrücklich dokumentierter Bereitstellungsreihenfolge bereit. Der administrative Schritt ist auch auf bestehenden Volumes wiederholbar und hängt nicht nur am Erstanlageskript. Der Migrator bleibt ohne `CREATEROLE`; HTTP und Job verwenden keine administrativen Zugangsdaten. Geheimnisse bleiben außerhalb versionierter Dateien und Ausgaben.\
**Und** neue technische Fälligkeitsdaten gehören ausschließlich `monthlysurplus` und entstehen nur für diesen benötigten Jobumfang. Bestehende Konten, Aktivierungsmonate, Budget-/Ausgaben-/Zielwerte, Auswahlhistorie, Monatsnachweise und Löschmarker bleiben erhalten. Bestehende Migrationen werden nicht verändert und es werden weder Konten aktiviert noch fehlende Geldwirkungen während Migration oder Rollenbereitstellung erfunden. Die neue Rolle und Funktionen werden auf frischem sowie bereits befülltem Schema tatsächlich geprüft.

**AC-2 — Jobrolle erhält ausschließlich benötigte fachliche Rechte**

**Angenommen** ein Datenbankzugriff läuft als `tnbp_monthly_worker`\
**Wenn** erlaubte und verbotene Operationen ausgeführt werden\
**Dann** darf die Rolle unter eigenem transaktionslokalem Kontokontext ausschließlich nötige historische Budget-/Ausgabespalten, Zielidentität/Fortschritt sowie eigene Aktivierungs-/Auswahl-/Löschinformationen lesen, am Ziel ausschließlich `progress_cents` ändern und benötigte eigene Monatsnachweise/technische Fälligkeiten bearbeiten. Schmale öffentliche Modulprojektionen und Differenzbefehle funktionieren mit diesen tatsächlichen Spaltenrechten, ohne vollständige Web-Ziel-/Ausgabenentitäten nachzuladen.\
**Und** Passwort-/Sitzungsdaten, Ausgaben-/Zielnamen und nicht benötigte Zielangaben bleiben unzugänglich; Anlage/Löschung von Ausgaben/Zielen, Budgetänderung, nutzergesteuerte Aktivierung/Zielwahl und Änderung historischer Auswahl-/Löschmarker sind untersagt. Der erforderliche dauerhafte Nutzungsmarker ist nur über einen begrenzten technischen Zugang monoton setzbar; die Jobrolle kann Funktions-/Versionsfreigaben weder öffnen noch zurücksetzen. Web- und Jobrollen sind keine Besitzer/Superuser, haben weder `BYPASSRLS` noch Wechselrecht zu Besitzer-/Migrations-/Discovery-Eigentümerrollen. `tnbp_runtime` erhält keine globale Discovery-Berechtigung.

**AC-3 — Kontoübergreifende Discovery ist eine eng begrenzte Ausnahme**

**Angenommen** Konten müssen ohne Nutzersitzung zur Verarbeitung gefunden werden\
**Wenn** der Job die öffentliche Discovery des Moduls `monthlysurplus` aufruft\
**Dann** ist ausschließlich eine nur der Jobrolle ausführbare `SECURITY DEFINER`-Funktion für diese globale Ermittlung zuständig. Ihr gesonderter `NOLOGIN`-Eigentümer besitzt keine Tabellen und kein `BYPASSRLS`; eine explizite RLS-Lesepolicy erlaubt ihm nur die nötigen aktivierten Automatikzeilen und technischen Fälligkeitsangaben. Qualifizierte Objektnamen, ein fest gesetzter sicherer `search_path` sowie entzogene `PUBLIC`-Ausführungsrechte verhindern indirekte Rechteausweitung.\
**Und** das Ergebnis enthält nur begrenzte Pakete aus Konto-ID und technischer Fälligkeit, keine Finanzbeträge, Auswahl-/Zielinhalte oder Zugangsdaten. Paketgröße wird gegen eine dokumentierte interne Obergrenze validiert; Ordnung/Fortsetzung sind stabil und begrenzt weiterführbar, ohne unbeschränkte Gesamtkontoliste. Der Definer hat keinen globalen Zugriff auf Ausgaben, Budgets, Ziele oder Zugangstabellen. Weder HTTP-Parameter noch ein öffentlicher API-Aufruf führen diese Funktion aus.

**AC-4 — Technische Fälligkeit bewahrt Aktivierungsbeginn und frühere Lücken**

**Angenommen** ein Konto wurde im Oktober aktiviert und danach wurden Monate vollständig, teilweise oder noch nicht verarbeitet\
**Wenn** technische Fälligkeit initialisiert, fortgeschrieben oder zur Discovery geprüft wird\
**Dann** wird vor Ende des Aktivierungsmonats keine Monatswirkung fällig. Nach dessen Ende müssen fehlende berechtigte abgeschlossene Monate ermittelbar bleiben, auch wenn für spätere Monate schon Nachweise bestehen. Kein bloßes Maximum des vorhandenen Monatsbestands darf eine frühere Lücke verdecken. Bereits vorhandene Vormerkungen gelten als verarbeitete Monatsnachweise; sie werden nicht bei jedem Lauf erneut als neue Geldwirkung fällig.\
**Und** nach neuem gültigem Abschluss wird Fälligkeit im selben Kontokontext so fortgeschrieben, dass verbleibende alte Monate weiter bearbeitbar sind oder andernfalls erst eine neue Monatsgrenze fällig wird. Die vorhandenen Web-Aktivierungs-/Nachweiswege halten die benötigte Fälligkeit über öffentliche Modulzugänge im gemeinsamen Commit konsistent. Reine Fälligkeitsverwaltung erzeugt keinen neuen Monatsnachweis, keine Aktivierung und keine Finanzmutation; sie benötigt keinen Zugriff auf fremde Modulschemas.

**AC-5 — Interner Jobkontext kommt ausschließlich aus gespeicherter Aktivierung**

**Angenommen** die begrenzte Discovery liefert ein zur Verarbeitung vorgesehenes Konto\
**Wenn** der interne Jobadapter den Kontoanwendungsfall startet\
**Dann** bindet die äußere Koordination ausdrücklich die Jobverbindung/-transaktion und setzt genau einen transaktionslokalen `app.user_id` aus der serverseitig ermittelten Konto-ID. Die gespeicherte Aktivierung wird nach Erwerb der Kontosperre erneut geprüft; ein veralteter Discoverytreffer oder ungültiger Kontext berechtigt nicht zu fachlicher Wirkung. Erforderliche Versions-/Funktionsfreigaben werden vor Wirkung tatsächlich geprüft.\
**Und** es gibt keinen simulierten Nutzer-JWT, kein ausgeliehenes Webkonto, keine Konto-ID aus Clientangaben und keinen öffentlichen Job-/Administrationsendpunkt. Fehlende Jobkonfiguration, fehlende Rechte oder falsche Rollenbindung führen niemals zum Rückfall auf Web-/Migrations-/Besitzerrechte. Ein technisch freigegebener Job aktiviert selbst keine Konten. Der interne Prüfaufruf ist vollständig ohne gültiges Access-/Refresh-Token oder offene Oberfläche ausführbar.

**AC-6 — Jedes Konto teilt eine physische Jobtransaktion und dieselbe Websperre**

**Angenommen** der interne Kontoanwendungsfall verarbeitet ein begrenztes Paket\
**Wenn** er Modulzugänge aufruft\
**Dann** erwirbt er vor zustandsabhängigem Fachlesen denselben transaktionsgebundenen Advisory-Schlüssel aus kanonischer Konto-UUID und Hash-Seed 14 wie alle Webmutationen. Unter READ COMMITTED werden Aktivierung und Zustand danach gelesen und genau ein fachlicher Zeitpunkt/aktueller Monat bestimmt. Alle öffentlichen Budget-/Ausgaben-/Ziel-/Nachweiszugänge verwenden dieselbe physische Jobverbindung, Transaktion, Identität und diesen Kalenderkontext.\
**Und** kein Modul öffnet nebenbei eine Webverbindung oder eigene innere Transaktion und kein anderer Kontokontext wird im Paket eingesetzt. Zusammengesetzte Web-Leseansichten behalten unabhängig davon ihre vorhandene gemeinsame read-only REPEATABLE-READ-Sicht. Gemeinsame Infrastruktur enthält nur technische Kontext-/Sperr-/Transaktions-/Geld-/Kalenderfunktionen, keine gemeinsamen fachlichen Finanzdaten. Architekturschnitt und Datenbesitz bleiben unverändert.

**AC-7 — Begrenztes Monatspaket verwendet die bestehenden historischen Regeln**

**Angenommen** mehrere berechtigte abgeschlossene Monate fehlen\
**Wenn** der Job ein Konto mit einer intern validierten begrenzten Monatsanzahl verarbeitet\
**Dann** bearbeitet er die ältesten fehlenden Monate chronologisch ab Erstaktivierung bis höchstens vor dem nach Sperrerwerb bestimmten aktuellen Monat. Historisch gültiges Budget und Monatsendeauswahl bleiben maßgeblich: ohne Auswahl vormerken, mit vorhandenem historischem Ziel einmalig differenziert anrechnen, ohne Budget keinen Betrag erfinden und gelöschte Bindung verbraucht lassen. Budgetierte Nullmonate bewahren Auswahl oder offenen Status. Der vorhandene Abschlussbaustein übernimmt diese Regeln; kein zweiter Job-Fachalgorithmus oder fremder Repositoryzugriff entsteht.\
**Und** Monate vor Aktivierung, noch offene sowie bereits wirksam nachgewiesene Monate werden nicht erneut gutgeschrieben. Nach Paketende bleiben weitere fehlende Monate ausdrücklich bearbeitbar. Dies begrenzt nur den Jobanwendungsfall: Die vollständige offene Übernahme bei Web-Zielauswahl aus Story 4.3 wird dadurch nicht in Teil-Commits oder Teilübernahmen umgewandelt. Auswahlwechsel, manuelles Ersetzen und historische Korrektur behalten ihre eigene Semantik.

**AC-8 — Gemeinsamer Commit sichert Wiederholung und Geldgrenzen**

**Angenommen** das Kontopaket würde mehrere Nachweise und Zielstände verändern\
**Wenn** es erfolgreich endet oder eine Geldgrenze beziehungsweise ein Speicher-/Commitfehler auftritt\
**Dann** committen alle Paketwirkungen einschließlich Fortschrittsdifferenzen, Monatsnachweisen, Fälligkeitsfortschreibung und erforderlichem Nutzungsmarker vollständig gemeinsam oder werden vollständig verworfen. Eine zu große spätere Monatswirkung darf keine früheren Teilwirkungen dieses Pakets bestätigt zurücklassen. Exakte sichere Centgrenzen, erlaubte negative Fortschritte und unveränderliche Herkunftsbindungen gelten weiter; nichts wird gerundet, abgeschnitten oder als separater Korrekturbetrag abgelegt.\
**Und** erneuter interner Aufruf nach Commit verwendet die dauerhaften Nachweise ohne Doppelwirkung, nach sicherem Rollback dagegen weiterhin die unveränderte fällige Arbeit. Vor erneuter Verarbeitung nach Verbindungs-/Commitungewissheit wird der tatsächliche Nachweisstand unter neuer Kontosperre geprüft, statt eine Geldmutation blind als sicher fehlgeschlagen zu wiederholen. Diese Story schreibt nach gescheitertem Paket keine wirksamen Beträge/Zuordnungen separat; eine spätere Wiederholungssteuerung darf ausschließlich technische Fehlermetadaten nach sicherem Rollback gesondert persistieren.

**AC-9 — Web und Job erhalten die tatsächlich zuletzt bestätigte Semantik**

**Angenommen** Jobverarbeitung überschneidet sich mit Web-Fortschrittsersatz, historischer Ausgabenmutation, Zielwechsel oder Ziellöschung\
**Wenn** beide Wege ihre tatsächlichen Rollen und dieselbe Kontosperre nutzen\
**Dann** bestimmt die serialisierte Reihenfolge die Wirkung, ohne einen außerhalb der Sperre gelesenen Fortschritt zurückzuschreiben. Manuell 300 € vor einer −50-€-Differenz ergibt 250 €; ein danach ausdrücklich gespeicherter manueller Gesamtwert ersetzt den Stand. Zielwechsel verschiebt keine alte Bindung, gelöschte Ziele bleiben auch für beim Löschen noch unverarbeitete Monate verbraucht. Ein vorher wartender Job bestimmt den aktuellen Monat erst nach Sperrerwerb.\
**Und** blockierte Nachholung hält unabhängiges manuelles Ersetzen und Ziellöschung ohne Nachholzwang weiterhin offen. Nach Abschluss oder Rollback ist die zurückgegebene Poolverbindung frei von altem Kontokontext; Wiederverwendung für B liefert keine Werte von A. Auch fehlender oder dem beabsichtigten Konto widersprechender Kontext verweigert Fachzugriff. Ein Job-Commit wird von vorhandenen konsistenten v2-Leseansichten korrekt als aktueller Stand angezeigt, ohne Browserentwürfe oder Sitzungsgrenzen aufzuheben.

**AC-10 — Neuer Jobzugang bleibt außerhalb der öffentlichen Produkt-/API-Fläche**

**Angenommen** Jobkonfiguration und interne Verarbeitung werden integriert\
**Wenn** HTTP-Routen, Start-/Bereitschaftswege und lokale Betriebsanleitung geprüft werden\
**Dann** bleibt es beim einen bestehenden Java-Artefakt und den drei Hauptbereichen; es entsteht kein separater öffentlicher Dienst, manueller Abschlussknopf oder neuer Benutzer-API-Vertrag. V1-/V2-Vertragschecks bleiben erfolgreich und der Webzugang behält JWT-/CSRF-/Origin-/`no-store`-Regeln. Der Job benötigt keinen Login und widerruft oder verlängert keine Nutzersitzung.\
**Und** die Anleitung beschreibt getrennte geschützte Rollenkonfiguration, administrative Bereitstellung auch auf bestehendem Volume sowie interne Prüf-/Fehlergrenzen, ohne Geheimnisse zu versionieren. Logs/Fehler liefern nur notwendige technische Kategorien, keine Beträge, Finanztexte, Tokens oder Zugangsdaten. Die technische Funktionsfreigabe setzt keine Nutzeraktivierung und öffnet nicht die weiterhin gesperrte öffentliche Automatik. Offene Voraussetzungen vor echten Nutzerdaten/Produktion bleiben erhalten; es wird kein Produktionsrollout durchgeführt oder als abgenommen ausgegeben.

**AC-11 — Echte Rollen-/RLS-Prüfungen belegen die Autorisierungsgrenze**

**Angenommen** Rollen, Policies, Discovery und öffentliche Modulzugänge sind bereitgestellt\
**Wenn** PostgreSQL-Integrationstests tatsächlich unter Web-, Job-, Discovery-Eigentümer- und Migrationsrechten prüfen\
**Dann** belegen sie erlaubte Spaltenzugriffe/Progress-only-Änderung und tatsächliche Ablehnung aller verbotenen Finanz-/Zugangs-/DDL-/Rollenwechseloperationen. Fehlender/fremder Kontext, mindestens zwei Konten, explizite RLS-Policies, entzogene `PUBLIC`-/Web-Discoveryrechte und begrenzte Discoveryausgabe werden mit frischem sowie bereits befülltem Schema geprüft. Wiederholte administrative Bereitstellung erteilt keine zusätzlichen breiten Rechte; der Migrator bleibt ohne `CREATEROLE`.\
**Und** manipuliertes Verbindungssuchschema oder unzulässige Paketgrößen erweitern weder Definerzugriff noch Ergebnisumfang. Wiederverwendete Verbindungen sind nach Commit und Rollback kontextfrei. Ein fachlicher Positivtest läuft mit den tatsächlich eingeschränkten Jobrechten statt Besitzerrechten, mockbasiertem Kontext oder simuliertem Nutzer-JWT. Nachweis-/Zielfehler beweisen den gemeinsamen Rollback und dass alle beteiligten Modulzugänge dieselbe physische Jobverbindung nutzen.

**AC-12 — Sitzungsfreie Nachholfälle sind ohne spätere Schleife vollständig ausführbar**

**Angenommen** ein aktiviertes Konto hat nach einem simulierten Ausfall mehrere fällige Monate und keinerlei aktive Nutzersitzung\
**Wenn** begrenzte Discovery und interner Kontoanwendungsfall mit kontrollierter Uhr und realer Datenbank wiederholt ausgeführt werden\
**Dann** belegen sie Aufholen über mehrere begrenzte Pakete, historische Auswahl A/B statt heutiger Auswahl, Vormerkung ohne je gewähltes Ziel, Null-/Ohne-Budget-Fälle, frühe Lücke trotz späterem Nachweis, verbrauchte unverarbeitete Löschmonate und sicheren negativen Fortschritt. Nach vollständiger Verarbeitung entsteht keine Dauerschleife für bereits bestätigte Vormerkungen; der nächste neue Monatsabschluss bleibt fällig ermittelbar. Wiederholung/parallel gestartete interne Aufrufe vervielfachen keine Wirkung.\
**Und** gezielte Web-/Jobkonkurrenz, Monatsgrenze/Sommer-/Winterzeit, sichere Geldgrenzen und Fehler nach früheren Paketwirkungen beweisen die beschriebenen Regeln. Nach erneuter Anmeldung zeigen echte v2-Leseaufrufe unter dem richtigen Webkonto den gemeinsam gespeicherten Stand, fremde Konten erhalten ihn nicht. Der reguläre Auslieferungszustand bleibt gesperrt; interne Positivfreigabe umgeht weder v1-Barriere noch Rollen-/Kontengrenzen. M-07 und die Jobanteile von M-17 sind für diesen Baustein zugeordnet; automatisches Starten, regelmäßiges Weiterlaufen, faire Kontowahl, verzögerte Wiederholung und Betriebsbeobachtung werden erst im nachfolgenden Umfang abgenommen und sind keine Abhängigkeit für diese ausführbaren Fälle.

### Story 4.7: Fällige Monate regelmäßig und fair nachholen sowie Fehler verzögert wiederholen

Als Person mit aktivierter Monatsautomatik\
möchte ich meine fälligen Monate nach Start, Ausfall und Neustart ohne offene App automatisch nachholen lassen,\
damit auch bei Fehlern anderer Konten meine Überschüsse weiterverarbeitet werden und keine Monatswirkung verloren geht.

**Anforderungsbezug:** Automatischer Start-/Nachhol-/Fehlerisolationsanteil von FR-17; Erhalt von FR-2/FR-3 und der Monats-/Ziel-/Korrekturregeln aus FR-9/FR-10/FR-14 bis FR-16. NFR-1/NFR-2, NFR-4/NFR-5/NFR-7 bis NFR-10 sowie technische Fehlerklarheit aus NFR-11 und Geheimnisschutz aus NFR-12. AR-1 bis AR-3, Erhalt der Web-/Job-/Discoverygrenzen aus AR-6 bis AR-12, Erhalt von AR-14/AR-15, vollständige Ausführungs-/Fairness-/Wiederholungs-/Beobachtungsanteile von AR-16, nötige additive Migration/Rechte nach AR-17/AR-18 sowie einschlägige Teile von AR-19 bis AR-23. Sitzungsunabhängigkeit aus UX-DR16/UX-DR22, automatischer Anteil von Flow 3 aus UX-DR19, Erhalt tatsächlicher Zielstände/frischer Rückkehransichten aus UX-DR25/UX-DR29 und unabhängiger Korrekturwege aus UX-DR30. M-07 wird einschließlich tatsächlichem Start/Neustart ohne Nutzersitzung und M-17 mit wiederholten Runden, Mehrkontofehlern und Commitungewissheit geprüft. Die vollständige öffentliche Aktivierungs-/Browser-/Freigabeprüfung bleibt ein eigener abschließender Umfang.

**Abhängigkeiten und Umfang:** Baut ausschließlich auf Epic 3 und Stories 4.1 bis 4.6 auf. Ergänzt im bestehenden Java-Artefakt den regelmäßigen internen Auslöser, begrenzte faire Runden, technische Wiederholungs-/Erfolgsmetadaten im Modul `monthlysurplus`, datensparsame interne Betriebsbeobachtung und dazugehörige Ablaufprüfungen. Der vollständige begrenzte Kontoanwendungsfall aus Story 4.6 wird wiederverwendet; es entstehen weder zweite Monatsberechnung noch öffentliches Job-API, zusätzlicher Dienst oder neuer Hauptbereich. Intervall, Paketgrößen, Warte-/Ausführungsgrenzen und positive Wiederholungsabstände werden als validierte technische Konfiguration dokumentiert; sie sind kein versprochener Ausführungszeitpunkt oder neues Produkt-SLA.

Regelmäßiger Lauf und Neustartverhalten sind mit realen begrenzten Rollen und explizit aktivierten Testkonten vollständig intern ausführbar. Die testinterne Freigabe bewahrt die tatsächliche v1-Barriere und alle Konto-/RLS-/Commitgrenzen. Die reguläre öffentliche Automatik bleibt bis zur vollständigen gemeinsamen Epic-Abnahme geschlossen.

**Abnahmekriterien:**

**AC-1 — Nach erfolgreichem Start und regelmäßig ohne Sitzung auslösen**

**Angenommen** Migrationen, administrative Rollenbereitstellung, Jobkonfiguration und tatsächliche technische Funktionsgrenze sind gültig\
**Wenn** die Anwendung erfolgreich gestartet ist und danach ihr interner Auslöser läuft\
**Dann** prüft sie nach erfolgreichem Start sowie wiederkehrend gespeicherte Fälligkeit über die geschützte Discovery und den Kontoanwendungsfall aus Story 4.6. Dafür sind weder offener Browser, Login, Refresh-Token, HTTP-Aufruf noch manueller Abschlussknopf erforderlich. Ein während Stillstand versäumter Monatswechsel wird aufgrund des gespeicherten Zustands nachgeholt und hängt nicht an einem einmaligen Uhrzeitereignis.\
**Und** vor gültiger Versions-/Funktionsfreigabe oder bei fehlender sicherer Jobbindung entstehen keine Geldwirkungen und kein Rollenfallback. Technische Freigabe aktiviert kein Konto. Jeder Kontoanwendungsfall prüft Aktivierung/Freigaben erneut unter seiner eigenen Kontosperre und bestimmt seinen fachlichen Monat erst danach. Es wird keine lokale Hostzeitzone oder eine einzige vor allen wartenden Konten berechnete Monatszuordnung als Fachkontext verwendet.

**AC-2 — Runden und Warteschlange bleiben begrenzt**

**Angenommen** mehr fällige Konten/Monate bestehen, als in einer Runde verarbeitet werden können\
**Wenn** wiederkehrende oder sich überschneidende Auslösungen eintreffen\
**Dann** gelten validierte Obergrenzen für Kontoermittlung, Konten je Runde, Monate je Kontopaket und gleichzeitige Arbeit. Neue Ticks erzeugen keine unbegrenzte Warteschlange oder unbegrenzte Parallelität; ausstehende Arbeit bleibt anhand der gespeicherten Fälligkeit für weitere Runden ermittelbar. Eine lokale Überlappungssperre darf Auslösungen zusammenführen, ersetzt aber weder Datenbank-Kontosperre noch dauerhafte Nachweise.\
**Und** jedes Konto hat seine eigene physische Transaktion; es gibt weder eine gemeinsame Konten-Gesamttransaktion noch einen Commit je Einzelmodul. Die vollständige Web-Zielauswahl/Übernahme bleibt davon ungeteilt. Bei geordnetem Stop werden keine neuen Konten begonnen; laufende Arbeit wird vollständig committed oder zurückgenommen. Nach erzwungenem Abbruch entscheidet der beim Neustart gelesene dauerhafte Stand, ohne Doppelanrechnung.

**AC-3 — Faire Fortsetzung lässt große und fehlerhafte Konten nicht vorgehen**

**Angenommen** A hat viele alte fällige Monate, B und C ebenfalls fällige Arbeit und das Discoverypaket ist kleiner als der Gesamtbestand\
**Wenn** mehrere begrenzte Runden laufen\
**Dann** führt eine dokumentierte stabile Fortsetzung/Rotation die Ermittlung über Paket- und Rundengrenzen weiter und beginnt nicht bei jedem Tick erneut mit demselben Präfix. A erhält je Auswahl nur sein begrenztes Kontopaket; B und C werden erreicht, bevor A vollständig aufgeholt sein muss. Nach Ende einer Erhebungsrunde werden neue oder zwischenzeitlich verschobene Fälligkeiten erneut berücksichtigt. Die genaue Batchgröße bleibt eine technische Wahl, die Fairness ist ein ausführbarer Nachweis.\
**Und** ein Fehler von A beendet nicht die Runde für B/C. Ein von Webarbeit gehaltenes Kontoschloss wird für den Job nur begrenzt abgewartet beziehungsweise auf demselben Schlüssel ohne Fachlesen übersprungen; auch Verbindungs-/Anweisungs-/Kontoausführung werden begrenzt. Lange Sperre oder langsamer Einzelaufruf belegen nicht dauerhaft alle Fortschrittsmöglichkeiten. „Beschäftigt“ ist kein erfolgreicher Monatsabschluss und erzeugt keine Finanz-/Auswahl-/Nachweisänderung.

**AC-4 — Minimale technische Wiederholungsdaten dauerhaft halten**

**Angenommen** Fälligkeit und Monatsnachweise aus Story 4.6 bestehen\
**Wenn** die jetzt nötigen Wiederholungs-/Erfolgsdaten ergänzt werden\
**Dann** besitzt ausschließlich `monthlysurplus` die minimalen kontogebundenen Angaben wie nächsten zulässigen Versuch, technische Fehlerkategorie/Versuchszähler, zuletzt bestätigte Monatsverarbeitung und eine geeignete Fälligkeits-/Versuchsversion zur Erkennung veralteter Fehlernachträge. Eine neue Flyway-Migration und die tatsächlich nötigen engen Rollenrechte erhalten bestehenden Fachbestand, RLS und wiederholbare administrative Bereitstellung.\
**Und** relevante bestätigte Web-/Jobänderungen halten den technischen Versuchsstand über öffentliche Modulzugänge der äußeren Koordination aktuell, auch bei manueller Fortschrittsreparatur. Dies benötigt keine Finanzneuberechnung und keinen erfolgreichen Nachhollauf. Technische Wiederholungszeit bleibt von fachlichem Rückstand unterscheidbar: Ein wegen Fehler später erneut versuchbares Konto gilt nicht als erledigt und verliert keinen Herkunftsmonat. Fehlertexte, Beträge, Ziel-/Ausgabennamen, Passwörter oder Tokens werden nicht in diesen Metadaten abgelegt. Es entstehen keine Geldschuld, Ersatz-Finanzwerte, neue Aktivierung oder zusätzliche Auswahlhistorie. Die Discoveryausgabe bleibt auf Konto-ID und technische Fälligkeit begrenzt.

**AC-5 — Nach sicherem Rollback nur technische Fehlermetadaten nachtragen**

**Angenommen** ein Kontopaket endet mit sicherem Rollback wegen fachlicher Grenze oder technischem Fehler\
**Wenn** Wiederholungssteuerung den fehlgeschlagenen Versuch vermerkt\
**Dann** sind alle Paketwirkungen vorher vollständig zurückgenommen. Erst danach darf eine neue kurze Jobtransaktion unter neu gebundenem eigenem Kontokontext und derselben Kontosperre ausschließlich technische Fehler-/Wiederholungsdaten speichern. Sie prüft, ob der gescheiterte Versuch noch zum aktuellen Fälligkeits-/Versuchsstand gehört. Zwischenzeitlich durch Web oder anderen Job erfolgreich erledigte beziehungsweise veränderte Arbeit wird nicht mit einem veralteten Fehlernachtrag überschrieben oder erneut verzögert.\
**Und** weder Fortschritt noch Monatsbetrag, Bindung, Vormerkung oder Nutzungsmarker werden nach Fehler separat als Teilrettung geschrieben. Scheitert auch der technische Nachtrag oder ist die Sperre weiter besetzt, bleibt der unveränderte Fachbestand maßgeblich; andere Konten können weiterlaufen. Fehlende Metadatenpersistenz wird technisch erkennbar und führt nicht zu einem behaupteten Monatsabschluss. Ein bereits bestätigter späterer Erfolg wird nicht rückdatiert oder durch den alten Fehler ersetzt.

**AC-6 — Verzögerte Wiederholung überlebt Neustart und lässt Reparatur zu**

**Angenommen** A scheitert wiederholt oder die Anwendung wird während der Wiederholungswartezeit neu gestartet\
**Wenn** weitere Runden stattfinden\
**Dann** gilt ein dokumentierter positiver begrenzter Wiederholungsabstand, ohne enge Endlosschleife, sofortige Fehlerlawine oder unbegrenztes Anwachsen der Wartezeit. Bereits gespeichertes „nicht vor“ bleibt beim Neustart wirksam. Fachlicher Rückstand wird nicht nach maximalen Versuchen still verworfen oder als erledigt markiert; nach wieder zulässigem Versuch liest der Kontoanwendungsfall den tatsächlichen Zustand erneut. B/C laufen trotz A weiter.\
**Und** manuelles absolutes Fortschrittsersetzen bleibt ohne erfolgreichen Nachhollauf und Ziellöschung ohne vorgängige Anrechnung möglich. Eine spätere erfolgreiche Verarbeitung setzt zugehörige aktuelle technische Fehler-/Wiederholungsstände im gemeinsamen Commit zurück und bestätigt nur tatsächlich verarbeitete Monate. Systemweite Discovery-/Datenbankfehler werden mit begrenzter Verzögerung erneut versucht, ohne fiktiv alle Konten als fachlich fehlerhaft zu markieren, Rollen zu erweitern oder Finanzdaten zu verändern.

**AC-7 — Commitungewissheit anhand des dauerhaften Zustands klären**

**Angenommen** eine Verbindung endet während des äußeren Commits und dessen Ergebnis ist zunächst unbekannt\
**Wenn** der Runner diesen Ausgang verarbeitet und später erneut ansetzt\
**Dann** behauptet er weder sicheren Rollback noch bestätigten Erfolg und trägt nicht vor Klärung einen fachlich gescheiterten Versuch mit Ersatzwirkung nach. Vor neuer Verarbeitung werden unter neuer Kontosperre der tatsächlich wirksame Nachweis-/Fälligkeits-/Versuchsstand gelesen und die vorhandenen Einmaligkeitsregeln verwendet. War der Commit wirksam, werden seine Monate nicht erneut angerechnet; war er unwirksam, bleibt das vollständige Paket nachholbar.\
**Und** andere Konten werden während Klärung nicht durch unbegrenzte Warteversuche blockiert. Neustart nach Commit vor lokaler Erfolgsmeldung erzeugt ebenso wenig Doppelwirkung wie Neustart nach Rollback vor technischem Fehlernachtrag. Monatswerte, Zielstände und wirksame Bindungen werden niemals aus einem unbestätigten lokalen Ergebnis rekonstruiert. Die Versions-/Nutzungsmarkergrenze aus Epic 3 bleibt erhalten.

**AC-8 — Rückstand und letzte bestätigte Verarbeitung datensparsam beobachten**

**Angenommen** Betrieb oder lokale Prüfung benötigt den Verarbeitungszustand\
**Wenn** die interne Beobachtung ausgewertet wird\
**Dann** sind mindestens Runnerzustand, Verarbeitungsrückstand einschließlich zurückgestellter Konten, Alter/älteste technische Fälligkeit, letzte bestätigte Monatsverarbeitung und technische Fehler-/Wiederholungskategorien erkennbar. Leere Discovery, übersprungene Sperre oder gestarteter Versuch werden nicht als erfolgreicher Monatsabschluss gezählt. Erfolgsangaben beziehen sich ausschließlich auf committed Monatsverarbeitung; pro Konto nötige Erfolgsmetadaten werden mit dessen Verarbeitung wirksam.\
**Und** Beobachtung nutzt begrenzte öffentliche Zugänge von `monthlysurplus`, dieselbe geschützte Discoverygrenze und ausdrücklich kontogebundene technische Projektionen, keine globale Querabfrage von Finanzschemas oder Ausweitung des Definerergebnisses um Finanz-/Zugangsdaten. Eine interne technische Erhebungsart darf aktivierte Konten einschließlich zurückgestellter oder erst zukünftig fälliger Konten paketweise ausschließlich als Konto-ID/Fälligkeit liefern; danach werden nur ihre eigenen technischen Metadaten gelesen. So bleiben zurückgestellte Arbeit und gespeicherter letzter Erfolg auch nach Neustart erkennbar. Zukünftige Monate werden dadurch nicht abgeschlossen. Zeitpunkt/Vollständigkeit der Erhebung sind erkennbar; noch nicht erhobene oder fehlgeschlagene Beobachtung wird nicht als Rückstand null oder erfundener letzter Erfolg ausgegeben. Es entsteht keine öffentliche Konten-/Metrikliste und kein neuer Nutzerbereich.

**AC-9 — Protokolle und Bedienhinweise erklären den tatsächlichen Betrieb**

**Angenommen** Runner startet, verarbeitet, wiederholt, stoppt oder Beobachtung scheitert\
**Wenn** Logs, Status und Betriebsanleitung geprüft werden\
**Dann** enthalten sie nur notwendige technische Kategorien/Zählwerte/Zeitangaben, keine Geldbeträge, Finanztexte, Tokens, Passwort-/Sitzungsdaten oder vollständige Datenbank-/HTTP-Nutzlasten. Fehlerursachen werden klassifiziert statt sensitive SQL-/Exceptiondetails ungeprüft auszugeben. Beobachtung und interne Konfiguration werden über einen geschützten lokalen/internen Weg beschrieben und nicht als öffentliches Produkt-API freigegeben.\
**Und** die Anleitung benennt wiederkehrendes Nachholen, Paket-/Warte-/Wiederholungsgrenzen, getrennte sichere Rollen und das Verhalten bei fachlicher Grenze, ungewissem Commit und globalem Infrastrukturausfall. Sie verspricht keine feste Abschlussuhrzeit oder Verfügbarkeit. Benutzertexte bleiben bei verständlichem Aktivierungs-/Ziel-/Vormerkungszustand; ein Systemplanungs- oder Fehlerdiagnosebereich wird nicht ergänzt. Offene Betriebs-/Datenlebenszyklusbedingungen vor echten Daten bleiben erhalten; es werden weder Nachrichten versandt noch ein Produktionsrollout durchgeführt.

**AC-10 — Vorhandene fachliche und Browsergrenzen trotz laufendem Job erhalten**

**Angenommen** der tatsächliche Runner ist intern freigegeben und verarbeitet ohne offene Oberfläche\
**Wenn** danach eine Person neu anmeldet oder Webmutationen während späterer Runden ausführt\
**Dann** zeigen bestehende konsistente v2-Lesewege den tatsächlichen gemeinsam gespeicherten Stand; Herkunftsauswahl A/B, offene Vormerkung, gelöschte Bindung, manuelles Ersetzen sowie negative/übererfüllte Fortschritte behalten die Regeln aus Stories 4.1 bis 4.6. Eine beim Wiederholen bearbeitete Kontoverbindung trägt keinen fremden Kontext in eine spätere Web-/Jobtransaktion. Webentwürfe und neuere bestätigte Werte werden nicht durch verspätete Antwort oder Hintergrundlesen ersetzt.\
**Und** der Runner liest/verlängert keine Nutzersitzung und benötigt keine Cookies. Drei Hauptbereiche, rote Abmeldung, flüchtiger Browserzustand und tatsächliche Prozent-/Balkenanzeige bleiben erhalten. Reguläre Funktionsgates bleiben geschlossen; nur der interne vollständige Prüfstand darf den Runner positiv ausführen. Vollständige öffentliche Aktivierungs-/Vier-Viewport-Abnahme wird dadurch nicht als bereits bestanden behauptet und ist keine Voraussetzung für die hier ausgeführten Scheduler-/Fairnessnachweise.

**AC-11 — Kontrollierte Runden beweisen Fairness und Fehlermetadatenrennen**

**Angenommen** mindestens drei echte Testkonten bestehen und kontrollierte Uhr/Fehlerpunkte ermöglichen reproduzierbare Ausführung\
**Wenn** PostgreSQL-/Runnerintegrationstests mit tatsächlicher Jobrolle laufen\
**Dann** belegen sie begrenzte Pakete über mehrere Runden, B/C-Fortschritt trotz A mit großem Rückstand, dauerhaftem Betragsfehler oder besetztem Schloss sowie Fortsetzung über ein kleineres Discoverypaket als den Kontobestand. Vor „nicht vor“ erfolgt kein erneuter Finanzversuch; nach Wartezeit und Neustart wird korrekt erneut geprüft. Geprüft werden Rollback nach früheren Paketwirkungen, Scheitern des technischen Nachtrags, veralteter Fehlernachtrag nach erfolgreichem Web-/Jobcommit und erfolgreicher Rücksetzung aktueller Fehlerdaten.\
**Und** Zeit-/Fehlersteuerung ersetzt weder Datenbankrollen noch Kontosperren durch Mocks. Wiederholte/überschneidende Runneraufrufe verlieren oder vervielfachen keine Geldwirkung. Metriknachweise erkennen zurückgestellten Rückstand, gespeicherte letzte bestätigte Verarbeitung auch nach Neustart, unvollständige Erhebung und technische Fehler, ohne bei gescheitertem Versuch Erfolg vorzutäuschen. Technische Erhebung zukünftig fälliger Konten erzeugt keine Monatswirkung und erweitert weder RLS- noch Finanzzugriff. Protokollprüfungen mit erkennbaren Testbeträgen/-namen/-tokens belegen deren Abwesenheit in Runner-/Fehlerausgaben; fremde Kontodaten bleiben unzugänglich.

**AC-12 — Tatsächlicher Start und Neustart holen ohne Sitzung nach**

**Angenommen** die Anwendung war über mehrere Monatsgrenzen aus und aktivierte Konten besitzen historische Budget-/Auswahlstände, Löschmarker und gegebenenfalls manuelle Fortschritte\
**Wenn** das tatsächliche Java-Artefakt mit echter Datenbank, begrenzten Rollen, kontrolliertem Kalender und testinterner gültiger Gesamtfreigabe startet\
**Dann** führen Startsignal und wiederkehrender Auslöser die fällige Verarbeitung ohne direkten manuellen Kontoanwendungsaufruf, Browser oder Sitzung aus. Prozessneustart vor Commit, nach wirksamem Commit vor lokaler Bestätigung und während Wiederholungswartezeit erzeugt keine Doppelanrechnung oder verlorene bestätigte Arbeit. Historische Auswahl, frühe Nachweislücken, Aktivierungsgrenze, Null-/Ohne-Budget-/Verbrauchszustände und Monats-/Zeitumstellungsgrenzen bleiben korrekt.\
**Und** nach erneuter Anmeldung bestätigen echte v2-Leseaufrufe die gespeicherten Werte und Kontentrennung. Passende Vertrags-/Kompilier-/Architektur-/Rollenregressionen bleiben erfolgreich; keine Freigabe umgeht v1-Stilllegung oder RLS. M-07 ist für automatische Ausführung und die beschriebenen M-17-Fälle sind für Wiederholung/Fehlerisolierung zugeordnet. Die reguläre öffentliche Automatik bleibt bis zur gesonderten gemeinsamen Abnahme geschlossen. Die Story ist mit diesen bestehenden Bausteinen vollständig ausführbar und hängt nicht von späterem Freigabe- oder Browsercode ab.

### Story 4.8: Monatsautomatik nach vollständigem Nachweis zur ausdrücklichen Aktivierung bereitstellen

Als Person mit eigenen Finanzdaten\
möchte ich die Monatsautomatik erst als vollständig geprüfte Funktion ausdrücklich aktivieren und ihre Folgen verlässlich bedienen können,\
damit Aktivierung, Vormerkung, Zielwahl, historische Korrektur und Löschung zusammen funktionieren.

**Anforderungsbezug:** Gemeinsamer Freigabe-/Bediennachweis für FR-14 bis FR-17 und Erhalt der betroffenen eigenen Daten-/Ausgaben-/Ziel-/Responsiv-/Textregeln aus FR-2/FR-3/FR-6/FR-9 bis FR-11/FR-13. Sämtliche Epic 4 zugewiesenen Anteile von NFR-1 bis NFR-12. AR-2 bis AR-4, AR-6 bis AR-20, unveränderte Betriebsform aus AR-21, Gesamtnachweis nach AR-22 und offene Bedingungen/Kontextpflege nach AR-23; Zugangsregeln und Bestandsbasis aus Epic 3 gelten fort. Gemeinsame Abnahme der Epic 4 zugewiesenen UX-Regeln, insbesondere UX-DR1/UX-DR2, UX-DR4/UX-DR5, UX-DR8 bis UX-DR18, Flows 3 bis 5 aus UX-DR19, Erhalt von UX-DR20 und UX-DR21 bis UX-DR30. M-01 bis M-17 und die zusätzlichen Nullmonat-/Lösch-/Korrektur-/Versionspräzisierungen werden vollständig zu ausführbaren Nachweisen zugeordnet.

**Abhängigkeiten und Umfang:** Baut ausschließlich auf Epic 3 und Stories 4.1 bis 4.7 auf. Ergänzt deren gemeinsamen regulären Freigabepfad, fail-closed Capability-/Aktivierungsintegration, durchgängige Browserabnahme und einen vollständigen, revisionsbezogenen Abnahmenachweis. Vorhandene geeignete Fach-/Datenbank-/Prozess-/Browserprüfungen werden wiederverwendet und gezielt um fehlende Integrationsgrenzen ergänzt. Es entsteht kein zusätzlicher Geldalgorithmus oder neuer Produktbereich. Eine spätere Story ist für den vollständigen freigebbaren Automatiklebenszyklus nicht erforderlich.

Die Funktionsfreigabe wird auf einem isolierten Prüfstand ohne echte Nutzerdaten über denselben dokumentierten Freigabeweg wie die spätere Bereitstellung belegt. Ein Testschalter, der die Versions-/Gesamtabnahmegrenze umgeht, gilt dafür nicht als positiver Freigabenachweis. Produktionsbetrieb und echte Daten bleiben an die ausdrücklich offenen Bedingungen aus PRD §9 gebunden; deren Umsetzung oder externe Bereitstellung gehört nicht zu dieser Story.

**Abnahmekriterien:**

**AC-1 — Reguläre Gesamtfreigabe benötigt überprüfbare Voraussetzungen**

**Angenommen** die Monatsbausteine, sichere Rollen und Hintergrundausführung sind vollständig umgesetzt\
**Wenn** der dokumentierte technische Freigabeweg ausgeführt wird\
**Dann** wird im vorhandenen technischen Freigabezustand nachvollziehbar dem konkreten Anwendungs-/Schema-/Rollenstand ein vollständiger Automatikabnahmenachweis zugeordnet. Er umfasst die bestätigten fachlichen, Sicherheits-, Konkurrenz-, Nachhol- und Browsernachweise dieses Epics sowie die tatsächliche v1-Stilllegungsbarriere aus Epic 3. Die wirksame Freigabe prüft diesen passenden Zustand und die nötige sichere Jobkonfiguration; ein einfacher Umgebungsschalter oder Browserwert allein genügt nicht. Administrative Zustandsbereitstellung bleibt außerhalb öffentlicher Nutzer-APIs.\
**Und** fehlende, unvollständige oder unpassende Voraussetzungen halten die Automatik serverseitig geschlossen. Freigabe erzeugt keine Aktivierung, Auswahl, Monatsanrechnung oder Umdeutung manueller Bestände. Ein nötiges zusätzliches technisches Speicherfeld entsteht nur per neuer Flyway-Migration; Fachbestand und historische Migrationen bleiben unverändert. Die eng begrenzten bestehenden Job-/Administrationsrechte werden erhalten.

**AC-2 — Capability und direkte Mutationen verwenden dieselbe reale Freigabe**

**Angenommen** ein aktueller oder veralteter Client liest `GET /api/v2/capabilities` beziehungsweise ruft Aktivierung direkt auf\
**Wenn** die tatsächlichen Freigabevoraussetzungen fehlen oder erfüllt sind\
**Dann** ist `monthlyAutomationAvailable` nur bei gültiger Gesamtfreigabe wahr; fehlend, unbekannt oder nicht geladen bedeutet für den Client nicht verfügbar. Der Aktivierungs-POST prüft die aktuelle serverseitige Grenze selbst und weist gesperrte Aufrufe vor Mutation mit 409 `FEATURE_NOT_AVAILABLE` ab. Veraltete positive Capability, direkter HTTP-Aufruf und paralleles Ändern des Freigabestands öffnen keine Umgehung. Der serverseitige Freigabeentscheid und eine hiervon abhängige Mutation werden so koordiniert, dass eine zwischenzeitliche Sperre nicht ungeprüft übergangen wird.\
**Und** `signedProgressAvailable` bleibt eine eigenständige Funktion aus Epic 3: Die gesperrte Monatsautomatik sperrt nicht pauschal die bereits gültige manuelle Fortschrittsreparatur. Bestehende Aktivierung/Erstmonat und historische Bindungen werden bei gesperrter technischer Bereitstellung nicht gelöscht oder als vom Nutzer deaktiviert ausgegeben. Erforderliche historische Korrekturen dürfen nicht still übersprungen und trotzdem als erfolgreiche Ausgabenmutation bestätigt werden; sichere Ziellöschung behält ihren fehlenden Nachholzwang. Bestehende v2-Formen bleiben kompatibel, v1 eingefroren und die getrennten Vertrags-/Kompilierchecks erfolgreich.

**AC-3 — Erst nach Freigabe regulär aktivieren, weiterhin ohne Zielvoraussetzung**

**Angenommen** ein Konto hat keine Aktivierung, kein Budget und kein Sparziel\
**Wenn** die Freigabe über den regulären Weg gültig ist und die Person Sparziele öffnet\
**Dann** ist die ausdrückliche Aktivierung erreichbar und erklärt vor Bestätigung den gesamten laufenden Erstmonat, den ersten Abschluss nach Monatsende und den Ausschluss früherer Monate. Erst der bestätigte POST aktiviert dieses Konto; Anlage eines Ziels, Anmeldung, Funktionsfreigabe oder Jobstart allein tun dies nicht. Unter Kontosperre bestimmter Erstmonat bleibt bei Wiederholung, Neustart und späterer erster Zielwahl unverändert.\
**Und** im gesperrten Zustand erscheint keine als nutzbar dargestellte, noch wirkungslose Aktivierung. Bei erstem Commitfehler wird kein Erfolg vorweggenommen. Ein zweites Konto bleibt ohne eigene Aktivierung unberücksichtigt, auch wenn es historische Ausgaben/Ziele besitzt. Weder Deaktivierung, freie Startmonatswahl noch ein Rückdatierungs-/Nachholknopf werden ergänzt. Die reguläre Positivprüfung verwendet die tatsächliche Release-/JWT-/RLS-Grenze statt eines diese Grenze überspringenden Testhooks.

**AC-4 — Durchgängige Vormerkungs-/Übernahmefolge ohne Sitzung belegen**

**Angenommen** das im Oktober ausdrücklich aktivierte Konto hatte noch nie ein Ziel ausgewählt\
**Wenn** die App geschlossen ist, der echte Hintergrundlauf nach Monatsenden beziehungsweise Ausfall nachholt und die Person später neu anmeldet\
**Dann** werden etwa 200 € aus Oktober und 100 € aus November als 300 € Vormerkung geladen, ohne einen manuellen Zielstand zu ändern. Die Person legt ein eigenes Ziel an, ersetzt dessen Fortschritt durch 50 € und wählt es ausdrücklich. Fällige weitere Monate werden nach bisherigen historischen Regeln berücksichtigt; ohne weitere Fälligkeit zeigt die gemeinsame Commitantwort 350 € Fortschritt und 0 € Vormerkung. Wiederholung rechnet nicht nochmals an.\
**Und** die ganze Folge läuft über reguläre v2-Routen, echte Datenbank und echte begrenzte Jobrolle. Kein offener Tab, Login oder manueller Kontoanwendungsaufruf löst den Hintergrundteil ersatzweise aus. Nullmonate mit Budget werden bei Auswahl mitgebunden, fehlendes Budget wird nicht zur offenen Nullvormerkung und das erste/einzige Ziel wird nicht automatisch gewählt. Monat/Restbudget und die vollständige Ausgabenhistorie bleiben unabhängig korrekt.

**AC-5 — Historische Korrektur, Zielwechsel und Löschen gemeinsam bedienen**

**Angenommen** Oktober ist A zugeordnet und im November wird B ausdrücklich gewählt\
**Wenn** die Person alte Ausgaben korrigiert, Fortschritt manuell ersetzt oder ein Ziel löscht\
**Dann** bleibt die Oktoberbindung bei A. Zuvor 200 € und nun 150 € Überschuss wirken nur als −50 € auf dessen aktuellen Stand: manuell 300 € werden 250 €, 20 € werden −30 €, eine spätere Anrechnung von 100 € wird 70 €. Günstigere/gelöschte Ausgabe wirkt nur positiv differenziert; vor Zuordnung wird nur die betroffene Vormerkung korrigiert. Jede notwendige Ausgaben-/Nachweis-/Zieländerung wird gemeinsam bestätigt.\
**Und** der tatsächliche Ziellöschdialog erklärt Verlust samt Fortschritt, erhaltene offene Vormerkung und künftige Vormerkung bei fehlender Auswahl. Bestätigtes Löschen verbraucht auch noch unverarbeitete abgeschlossene Monate mit damaliger Auswahl dieses Ziels ohne vorgelagertes Anrechnen. Spätere Korrektur/Neuverarbeitung erzeugt weder Wiederanlage noch Vormerkung oder Umleitung zu B. Eine andere aktuelle Auswahl bleibt erhalten; Löschung des letzten Ziels erhält den erreichbaren Automatikabschnitt und die Möglichkeit zur Zielanlage. Diese Folgen werden durch echte Benutzerwege einschließlich Abbrechen/Escape nachgewiesen.

**AC-6 — Fehler, blockiertes Nachholen und ungewisser Ausgang erhalten Reparaturwege**

**Angenommen** Aktivierung, Auswahlübernahme, historische Korrektur oder Löschung scheitern sicher beziehungsweise ihr Ausgang ist noch unbestätigt\
**Wenn** die Oberfläche den Zustand verarbeitet\
**Dann** zeigt sie sicheren Fehler, laufendes Speichern und „Speicherung noch nicht bestätigt“ unterscheidbar und assistiv verständlich. Sicher fehlgeschlagene Auswahl erhält gespeicherte Auswahl, Vormerkung und Zielstand; notwendige Korrekturfehler bestätigen auch die Ausgabenmutation nicht. Entwürfe bleiben ausschließlich im offenen Tab, nur die betroffene Aktion wird gegen Doppelsenden gesperrt. Vor Wiederholung bei unbekanntem Ausgang wird der tatsächliche aktuelle Zustand geladen.\
**Und** Betragsgrenzen werden erklärt statt gerundet oder teilweise übernommen; unabhängiges absolutes Fortschrittsersetzen und Ziellöschung bleiben ohne erfolgreichen Nachhollauf möglich. Offline wird kein Versand/keine Synchronisation versprochen. Nach bestätigter Löschung und anschließendem Ladefehler bleibt der Löscherfolg bestätigt; abhängige Werte sind bis zum gemeinsamen Nachladen ausdrücklich ungeladen. Kein Ladefehler erzeugt erfundene Nullen. Logs und Fehlermeldungen enthalten keine fremden Inhalte, tatsächlichen Finanzwerte oder Zugangsnachweise.

**AC-7 — Alle Automatikzustände in vier Größen zugänglich abnehmen**

**Angenommen** Aktivierung, fehlendes Ziel, Vormerkung, Auswahlübernahme, Differenzkorrektur, Löschen und Fehler werden bei 320×568, 390×844, 768×1024 und 1280×800 CSS-Pixeln genutzt\
**Wenn** Tastatur, Touch, Screenreader beziehungsweise 200 % Textgröße eingesetzt werden\
**Dann** funktionieren sämtliche Kernaktionen mit vollständigen Beträgen und programmatisch zugeordneten Labels/Fehlern/Status. Dialogfokus, Escape/Abbrechen und Rückkehrfokus sind korrekt; sichtbarer Fokus ist nicht verdeckt. Kernaufgaben bleiben bei 320 CSS-Pixeln ohne horizontales Scrollen nutzbar. Aktionen sind mindestens 44×44 CSS-Pixel groß, Geldfelder mindestens 48 CSS-Pixel hoch und wachsen mit Text.\
**Und** Textkontrast mindestens 4,5:1, Kontroll-/Fokuskontrast mindestens 3:1, logische Reihenfolge, reduzierte Bewegung und Information jenseits von Farbe gelten. −30 € bei 100 € Ziel erscheinen tatsächlich als −30 % bei leerem Balken, 150 € als 150 % bei vollem Balken; assistive Ausgabe bleibt wahrheitsgemäß. Drei Hauptbereiche mit Monat als Start, dieselbe rote Abmeldung und die UX-Tokens bleiben konsistent. Systemtexte einschließlich Hilfen enthalten keine Zeitzonenerläuterung; eigene Namen wie „Berlin-Fahrt“ werden erhalten. Layout und Komponentenzustände werden mit den drei bestehenden UX-Referenzen abgeglichen.

**AC-8 — Frische Rückkehransichten und Sitzungsgrenzen im tatsächlichen Lauf erhalten**

**Angenommen** Hintergrundverarbeitung oder eine historische Mutation verändert Werte während Navigation, eines offenen Entwurfs oder eines Konto-/Sitzungswechsels\
**Wenn** Monat oder Sparziele erneut geladen werden oder ältere Antworten eintreffen\
**Dann** werden die bestehenden konsistenten Lesewege verwendet: Monat lädt Budget/Ausgaben/Rest gemeinsam, Sparziele übernimmt Aktivierung/Auswahl/Vormerkung/Zielwerte aus der zusammenhängenden Übersicht. Monatswechsel und bekannte Mutationen machen alte Werte erneuerungsbedürftig; sie werden nicht als aktuell ausgegeben. Späte Leseantworten überschreiben weder neuere Bestätigung noch einen offenen manuellen Entwurf.\
**Und** Abmeldung, Ablauf und Kontowechsel entfernen persönliche Werte/Entwürfe samt alten Erfolgsstatus und entkräften späte Mutationsantworten. Access-Tokens und Finanzwerte bleiben nur im Browserarbeitsspeicher. Serververarbeitung kann ohne Nutzersitzung weiterlaufen und offenbart dabei keine anderen Konten. Mehrkontenprüfung, fehlender/fremder Web-/Jobkontext und wiederverwendete Verbindungen belegen denselben Schutz wie vor Freigabe; die vorhandenen Zugang-/CSRF-/Origin-/`no-store`-Regeln bleiben vollständig wirksam.

**AC-9 — Tatsächliche Versionsbarriere und Rücknahmegrenze bleiben wirksam**

**Angenommen** der abschließende Freigabeprüfstand enthält migrierten Bestand und produktionsgleichen Start-/Routingcode\
**Wenn** Altclient, v1-Zugriffe, Freigabe und spätere Wiederanläufe geprüft werden\
**Dann** entstehen keine Automatikwirkungen vor tatsächlichem Ende oder Abbruch sämtlicher zuvor zugelassener v1-Vorgänge einschließlich GETs und Datenbankarbeit. Ein nur begonnener Drain oder beendeter HTTP-Socket genügt nicht. Der Altclient erhält den geprüften Aktualisierungspfad; Zugang und sämtliche aktuellen Finanz-/Automatikwege verwenden v2. Job/HTTP greifen nicht auf Besitzer-/Migrationsrechte zurück und die gesonderte sichere Discovery bleibt begrenzt.\
**Und** erste Monatswirkung setzt den dauerhaften Nutzungsmarker atomar. Neustart, Ziellöschung, später wieder positive Fortschritte oder technische Sperre heben den v1-Rückfallschutz nicht auf. Vor Nutzung zulässige Rücknahme wurde gegen migriertes Schema/Rollen geprüft; danach sind ausschließlich v2-kompatible Korrektur oder geprüfte Wiederherstellung vorgesehen. Finanzdaten werden für Code-Rücknahme weder gekürzt noch überschrieben. Funktionsfreigabe im Prüfstand führt keinen Produktionsrollout aus.

**AC-10 — Alle 17 Monatsfälle und Präzisierungen revisionsbezogen nachweisen**

**Angenommen** die zusammenhängende Umsetzung soll als freigebbar abgenommen werden\
**Wenn** der Abnahmenachweis zusammengestellt wird\
**Dann** besitzt jeder Fall M-01 bis M-17 mindestens eine konkrete ausführbare Prüfung auf der passenden Ebene sowie eine eindeutige Zuordnung zu Story/Abnahmekriterium und tatsächlichem Prüfergebnis für den geprüften Revisionsstand. M-01/M-02 Aktivierung, M-03/M-04 Vormerkung/Übernahme, M-05/M-06 Monatsformel, M-07 echtes Nachholen, M-08 bis M-12 Differenz/manueller/negativer Stand, M-13 Wechsel, M-14/M-15 Löschen, M-16 Übererfüllung und M-17 Konkurrenz/Grenzen/Commitfehler bleiben vollständig enthalten. Bestehende geeignete Tests werden referenziert statt durch bedeutungsgleiche Tests verdoppelt.\
**Und** zusätzliche Prüfungen belegen budgetierte Nullmonatsbindung auch nach späterer Übernahme, fehlendes Budget, verbrauchte unverarbeitete Löschmonate, Erstnachweis bei historischer Korrektur, manuelle Reparatur trotz blockiertem Nachholen, konsistente Lesesicht, Commitungewissheit, Fairness sowie vollständige v1-Lesebarriere. Vertrags-/Generator-/Kompilier-, Architektur-, echte PostgreSQL-/Rollen-/Migrations-/Prozess- und passende Browserprüfungen sind erfolgreich. Fehlende oder fehlgeschlagene Pflichtnachweise verhindern die Gesamtfreigabe; eine reine Dokumentbehauptung ersetzt sie nicht.

**AC-11 — Bedienung, Betrieb und Projektkontext nach tatsächlicher Umsetzung nachführen**

**Angenommen** die geprüfte Funktion und ihre technischen Grenzen stehen fest\
**Wenn** README, Abnahmeunterlagen und betroffener Projektkontext aktualisiert werden\
**Dann** beschreiben sie verständlich ausdrückliche Aktivierung, unveränderlichen Start, Vormerkung, vollständige Übernahme, historische Differenz, signierten Fortschritt, Löschfolgen und unabhängiges Nachholen. Technische Dokumentation nennt den regulären Freigabe-/Sperrweg, getrennte Rollen und administrative Bereitstellung, sichere Beobachtung/Wiederholung sowie die tatsächlich geltende Rücknahmegrenze. Der verwaltete Projektkontext wird anhand der umgesetzten und geprüften Regeln nachgeführt; historische Epic-/Story-/Sprint-Nachweise werden nicht rückwirkend als neue Fertigmeldungen umgeschrieben.\
**Und** offene Entscheidungen zu Export, Kontolöschung, Aufbewahrung einschließlich Monatsnachweisen, Kontowiederherstellung/E-Mail-Bestätigung sowie VPS, Domain, festen Images, externen verschlüsselten Backups, getestetem Wiederherstellungsweg und Überwachung bleiben ausdrücklich offen, bis sie tatsächlich geklärt sind. Gleiches gilt für die Bewertung von Anmeldedrosselung/parallelen Argon2-Prüfungen. Daraus werden keine zusätzlichen fertigen Verwaltungsflächen, echten Daten, gesendeten Nachrichten oder Produktionsfreigaben abgeleitet. Geheimnisse bleiben außerhalb versionierter Dateien.

**AC-12 — Gemeinsamen Freigabepfad positiv und negativ im isolierten Prüfstand belegen**

**Angenommen** der integrierte Kandidat hat die fachlichen, Sicherheits- und Bedienvoraussetzungen der vorherigen Stories nachgewiesen und die reguläre Bereitstellung bleibt zunächst geschlossen\
**Wenn** der dokumentierte reguläre Freigabeweg mit tatsächlichen Rollen/Startwegen und Testdaten geprüft wird\
**Dann** beweisen Negativfälle bei fehlender Gesamtabnahme, unpassendem Freigabestand, fehlender Jobbindung, falschen Rechten oder unvollständiger v1-Barriere die geschlossene Capability und direkte Aktivierung ohne Finanzwirkung. Der positive Fall verwendet den passenden tatsächlichen Freigabezustand, bietet reguläre ausdrückliche Aktivierung an und durchläuft Aktivierung ohne Ziel, sitzungsfreies Nachholen, 300-€-Übernahme auf 50 € sowie historische Korrektur/Wechsel/Löschung über reale Nutzerwege. Web-/Jobgrenzen werden nicht durch Testoverride oder Besitzerzugriff ersetzt.\
**Und** die isolierte Abnahme erfolgt gestuft: Voraussetzungen nachweisen, den regulären Freigabepfad im Teststand ausführen, positive/negative Freigabefälle belegen und erst danach den vollständigen endgültigen Nachweis für eine Bereitstellung feststellen. Fehlender positiver Nachweis lässt die reguläre Bereitstellung geschlossen; erfolgreiche Prüfung aktiviert keine anderen Konten und öffnet keine Produktionsumgebung. Die endgültige Evidenz unterscheidet umgesetzte/ausgeführte/erfolgreiche Prüfungen von bloßen Planungsabnahmen. Der vollständige Automatiklebenszyklus benötigt danach keine spätere Story, um fachlich korrekt benutzbar zu sein; offene Betriebsbedingungen bleiben eigenständig bestehen.

### Planungsabschluss und Anforderungsabdeckung von Epic 4

Linus hat Stories 4.1 bis 4.8 einzeln bestätigt. Das Epic umfasst **acht Stories mit 92 Abnahmekriterien**. Die folgenden Zuordnungen belegen die Vollständigkeit der Planung, nicht ausgeführte Implementierungsprüfungen oder eine Betriebsfreigabe. Alle elf zugewiesenen FRs, zwölf NFRs, 21 Architekturvorgaben, 27 UX-Anforderungen und 17 Monatsfälle besitzen konkrete Story-Abnahmen. Unveränderte Zugangs-/Bestandsregeln aus Epic 3 gelten zusätzlich fort.

#### Story-Zuschnitt und Reihenfolge

| Story | Zusammenhängendes Ergebnis | Abnahmekriterien | Grundlage |
| --- | --- | --- | --- |
| 4.1 | Ausdrückliche Aktivierung auch ohne Ziel mit unveränderlichem Erstmonat | 10 | Epic 3 |
| 4.2 | Ausführbarer Monatsabschluss ohne Auswahl, offene Vormerkung und lesbarer Stand | 11 | Epic 3, 4.1 |
| 4.3 | Historische Auswahl, vollständige offene Übernahme und gemeinsame Zielübersicht | 12 | Epic 3, 4.1–4.2 |
| 4.4 | Historische Ausgabenmutation samt Differenz-/Vormerkungskorrektur im gemeinsamen Commit | 12 | Epic 3, 4.1–4.3 |
| 4.5 | Ziellöschung ohne Nachholzwang, dauerhafter Verbrauch und erhaltene Vormerkungen | 11 | Epic 3, 4.1–4.4 |
| 4.6 | Begrenzter echter Jobzugang, sichere Discovery und sitzungsfreies Kontopaket | 12 | Epic 3, 4.1–4.5 |
| 4.7 | Tatsächlicher Start-/Intervalllauf, Fairness, verzögerte Wiederholung und Beobachtung | 12 | Epic 3, 4.1–4.6 |
| 4.8 | Regulärer Freigabepfad und vollständige gemeinsame Bedien-/Lebenszyklusabnahme | 12 | Epic 3, 4.1–4.7 |

Jede Story hat ein zusammenhängendes Ergebnis auf Grundlage vorheriger Arbeit. Die frühen Monatsbausteine sind vollständig intern ausführbar, obwohl die öffentliche Aktivierung bis zur Gesamtabnahme geschlossen bleibt. Der Kontoanwendungsfall aus 4.6 benötigt keinen späteren Scheduler; 4.7 verwendet ihn für den tatsächlichen regelmäßigen Lauf. Story 4.8 ergänzt den gemeinsamen Freigabenachweis und benötigt keinen später nachzuliefernden Korrektur-/Lösch-/Jobcode. Die vollständige Web-Auswahl bleibt eine gemeinsame Transaktion, auch wenn der Job begrenzte Kontopakete verarbeitet.

Datenobjekte entstehen bei ihrer Verwendung: Aktivierung in 4.1, Monatsnachweis in 4.2, Auswahlhistorie/Zuordnung in 4.3, nötiger Löschmarker in 4.5, konkrete Worker-/Discoveryrechte und Fälligkeit in 4.6 sowie Wiederholungs-/Erfolgsmetadaten in 4.7. Die Korrektur in 4.4 verwendet vorhandene Zugänge/Nachweise. Ein zusätzlich nötiges rein technisches Freigabefeld aus 4.8 wird nur additiv angelegt. Es werden keine später benötigten fachlichen Tabellen vorab aufgebaut.

#### Funktionale Abdeckung im Epic-4-Umfang

| Anforderung | Konkrete Story-/Abnahmezuordnung |
| --- | --- |
| FR-2 | 4.1/AC-2/AC-8, 4.2/AC-7/AC-8, 4.3/AC-8 und 4.8/AC-8: eigener Aktivierungs-/Vormerkungs-/Zielstand, konsistente Rückkehr und Verwerfen persönlicher Daten. |
| FR-3 | 4.1/AC-2/AC-10, 4.6/AC-2/AC-3/AC-5/AC-11 und 4.8/AC-8/AC-9: Kontogrenze bei Web und Job, minimale Discovery und tatsächliche Rollen/RLS. |
| FR-6 | 4.4/AC-1 bis AC-3/AC-7/AC-9/AC-10: historische Betragsänderung/Löschung und notwendige Monatskorrektur gemeinsam bestätigen, Datum/Eigentümer erhalten, nächste Ansichten erneuern. |
| FR-9 | 4.3/AC-9 und 4.5/AC-1 bis AC-11: Zielanlage ohne automatische Auswahl, bestätigte Löschung samt Fortschritt, Verbrauch auch unverarbeiteter Herkunft und Erhalt offener Vormerkung. |
| FR-10 | 4.3/AC-6/AC-10, 4.4/AC-5/AC-8/AC-10 und 4.8/AC-5/AC-7: Differenz am aktuellen Gesamtstand, Metadatenerhalt bei manuellem Ersetzen, negative/übererfüllte tatsächliche Anzeige und erreichbare Reparatur. |
| FR-11 | 4.1/AC-9, 4.2/AC-10, 4.3/AC-11, 4.4/AC-11, 4.5/AC-10 und 4.8/AC-7: alle Automatikzustände in vier Größen mit Tastatur/Screenreader, Fokus, Kontrast, 200-%-Text und Reflow. |
| FR-13 | 4.3/AC-11, 4.4/AC-10/AC-11, 4.5/AC-8 und 4.8/AC-7: deutsche System-/Hilfstexte ohne Zeitzonenerläuterung und unveränderte nutzereigene Namen. |
| FR-14 | 4.1/AC-1 bis AC-7, 4.2/AC-2/AC-3 und 4.8/AC-1 bis AC-3: ausdrücklicher unveränderlicher Start, historische Monatsformel, kein Betrag ohne Budget und sichere Freigabe. |
| FR-15 | 4.2/AC-3/AC-6/AC-7, 4.3/AC-2 bis AC-9 und 4.5/AC-4/AC-5: Vormerkung, historische Auswahl, vollständige atomare Übernahme einschließlich Nullmonaten und keine Wiederverteilung verbrauchter Monate. |
| FR-16 | 4.4/AC-2 bis AC-8/AC-12, 4.5/AC-6 und 4.8/AC-5: offene Monatskorrektur oder genaue Differenz am ursprünglichen Ziel, nötiger Erstnachweis und gesamte Ausgabenmutation zurücknehmen, wenn die Korrektur scheitert. |
| FR-17 | 4.6/AC-3 bis AC-9/AC-11/AC-12, 4.7/AC-1 bis AC-12 und 4.8/AC-4/AC-10/AC-12: tatsächliches sitzungsfreies Nachholen, begrenzte faire Ausführung, Wiederholung, Fehlerisolierung und dauerhafte Einmalwirkung. |

FR-7/FR-8 und die übrigen unveränderten Bestandsaufgaben verbleiben bei Epic 3. Ihre Verwendung durch die Monatsautomatik ändert weder abgeschlossene Budgetstände noch die Formel für das laufende Restbudget. Alle elf Epic 4 zugewiesenen FR-IDs sind abgedeckt.

#### Zugewiesene Qualitätsanforderungen

| Anforderung | Abdeckung im Epic 4 |
| --- | --- |
| NFR-1 | 4.1/4.2/4.3: eigene Daten; 4.6/AC-2/AC-3/AC-11: eingeschränkte Rollen/Discovery; 4.8/AC-8: durchgängige Kontentrennung. |
| NFR-2 | 4.1/AC-2, 4.6/AC-2/AC-5/AC-6/AC-11 und 4.8/AC-8: verifizierter Webkontext, gesonderte gespeicherte Jobautorisierung und erzwungene RLS. |
| NFR-3 | Konkrete UX-Abnahmen in 4.1 bis 4.5; vollständige gemeinsame Prüfung aller Automatikzustände in 4.8/AC-7. |
| NFR-4 | 4.2/AC-6, 4.3/AC-7, 4.4/AC-7 und 4.6/AC-8: exakte sichere Summen/Differenzen ohne Rundung, Kürzung oder Teilübernahme. |
| NFR-5 | 4.1/AC-4, 4.2/AC-2, 4.3/AC-3/AC-5, 4.4/AC-2, 4.6/AC-6/AC-7 und 4.7/AC-12: einmaliger Kalenderkontext nach Sperre, historische Monatsstände und Zeitumstellungen. |
| NFR-6 | 4.1/AC-8, 4.3/AC-10, 4.5/AC-9 und 4.8/AC-8: Finanzdaten/Entwürfe nur im offenen Tab, Kontowechsel und späte Antworten. |
| NFR-7 | 4.3/AC-7, 4.4/AC-7, 4.5/AC-3/AC-7, 4.6/AC-8 und 4.7/AC-5/AC-7: äußerer Commit und vollständiger Rollback einschließlich Nachweis-/Nutzungsmetadaten. |
| NFR-8 | 4.2/AC-5, 4.4/AC-8, 4.6/AC-8/AC-9 sowie 4.7/AC-2 bis AC-7/AC-11/AC-12: Wiederholung, Konkurrenz, Neustart, Fairness und Fehlerisolierung. |
| NFR-9 | 4.7/AC-4/AC-8/AC-9/AC-11: Rückstand einschließlich zurückgestellter Konten, letzte bestätigte Monatsverarbeitung und technische Fehler ohne vertrauliche Protokolle. |
| NFR-10 | 4.1/AC-3/AC-6 und 4.8/AC-1 bis AC-3/AC-9/AC-12: Bestand/Startmonat erhalten, tatsächliche v1-Barriere, kontrollierte Freigabe und dauerhafte Rücknahmegrenze. |
| NFR-11 | 4.3/AC-10, 4.5/AC-9, 4.7/AC-7 und 4.8/AC-6: sicherer Fehler versus unbestätigter Ausgang, Zustandsklärung vor Wiederholung und erhaltene Reparaturwege. |
| NFR-12 | 4.6/AC-1/AC-10, 4.7/AC-9 und 4.8/AC-11: geschützte Geheimnisse und ausdrücklich weiter offene Voraussetzungen vor echten Daten/Produktion. |

#### Zugewiesene Architektur- und Übergangsvorgaben

| Anforderungen | Abdeckung im Epic 4 |
| --- | --- |
| AR-2, AR-3 | 4.1/AC-2/AC-3, 4.4/AC-3 und 4.6/AC-6: fünfter eigener Datenbesitzer, öffentliche Modulzugänge und äußere Koordination ohne fremdes SQL/Repositories. |
| AR-4 | Vertragsabnahmen jeweils in 4.1/AC-1, 4.2/AC-1, 4.3/AC-1, 4.4/AC-1 und 4.5/AC-1; gemeinsame kompatible Capability-/V2-Abnahme in 4.8/AC-2/AC-10. |
| AR-6 | 4.1/AC-2/AC-10, 4.6/AC-11 und 4.8/AC-8: neue Finanznachweise unter eigenem Webkontext/RLS, keine globale Webermittlung. |
| AR-7 | 4.6/AC-1/AC-2/AC-5/AC-11: echte getrennte Jobrolle, gespeicherte Aktivierung als Autorisierung und minimale Spalten-/Befehlsrechte. |
| AR-8 | 4.6/AC-3/AC-11 und 4.7/AC-8/AC-11: begrenzte sichere Definer-Discovery einschließlich rein technischer Erhebung ohne erweiterte Finanz-/Zugangsdaten. |
| AR-9, AR-10 | 4.3/AC-3/AC-7/AC-8, 4.4/AC-2/AC-3, 4.6/AC-6/AC-9 und 4.8/AC-2/AC-8: gemeinsame Verbindung, Kontosperre vor Fachlesen, ein Zeitpunkt/Monat und konsistente Leseansichten. |
| AR-11 | 4.2/AC-2/AC-6, 4.4/AC-3/AC-5/AC-7 und 4.6/AC-7/AC-8: historisches Budget, exakte Centwerte, signierte Fortschritte und Kalendergrenzen. |
| AR-12 | 4.1/AC-4/AC-5, 4.2/AC-3, 4.3/AC-2/AC-4/AC-5 und 4.5/AC-2/AC-4: dauerhafte Herkunft, Auswahl, Null-/Ohne-Budget- und Verbrauchszustände. |
| AR-13 | 4.3/AC-3 bis AC-7/AC-12: vor Auswahl vollständig nachholen, alle offenen Nachweise einschließlich null genau einmal übernehmen und gemeinsam committen. |
| AR-14 | 4.5/AC-2 bis AC-7/AC-11: verbrauchte historische Bindung einschließlich noch unverarbeiteter Monate, Löschung ohne Nachholzwang und keine Wiederverteilung. |
| AR-15 | 4.4/AC-2 bis AC-8/AC-12, 4.3/AC-10 und 4.5/AC-6: Differenz am aktuellen ursprünglichen Fortschritt, fehlender Erstnachweis und unabhängige manuelle Reparatur. |
| AR-16 | 4.6/AC-4/AC-7 und 4.7/AC-1 bis AC-9/AC-11/AC-12: begrenzter Start-/Intervalllauf, chronologische Lücken, Fairness, verzögerte Wiederholung und datensparsame Beobachtung. |
| AR-17, AR-18 | 4.1/AC-3 und 4.5/AC-2: neue benötigte Migrationen; 4.6/AC-1/AC-11 und 4.7/AC-4: konkrete Rechte auch auf bestehendem Volume administrativ wiederholbar, Migrator ohne CREATEROLE. |
| AR-19, AR-20 | 4.1/AC-6, 4.6/AC-5/AC-8 und 4.8/AC-1 bis AC-3/AC-9/AC-12: wirkliche Versionsbarriere, vollständige Funktionsfreigabe und monotone Rücknahmesperre ohne Datenkürzung. |
| AR-21 | 4.6/AC-10 und 4.7/AC-1/AC-9: Job im bestehenden Java-Artefakt, getrennte geschützte Konfiguration und unveränderte Betriebs-/Stackbasis. |
| AR-22 | Benannte Vertrags-/Architektur-/Datenbank-/Rollen-/Prozess-/Browserprüfungen in 4.1 bis 4.7; vollständige Zuordnung und tatsächlicher Freigabepfad in 4.8/AC-7 bis AC-10/AC-12. |
| AR-23 | 4.6/AC-10, 4.7/AC-9 und 4.8/AC-11: offene Betriebs-/Datenlebenszyklusbedingungen erhalten und Projektkontext erst nach tatsächlicher Umsetzung nachführen. |

Die 21 zugewiesenen Architektur-IDs sind damit in Abnahmen gebunden. AR-1/AR-5 und andere unveränderte Bestandsdetails werden aus Epic 3 übernommen; es entsteht kein zusätzlicher Starter-, Zugangs- oder Frameworkumfang.

#### Zugewiesene UX-Anforderungen

| Anforderungen | Konkrete Story-Abdeckung |
| --- | --- |
| UX-DR1, UX-DR2 | 4.1/AC-9, 4.2/AC-10, 4.3/AC-11 und 4.8/AC-7: Tokens, Schrift, vollständige Werte, Kontrast und Fokus. |
| UX-DR4, UX-DR5 | 4.1/AC-7/AC-8, 4.3/AC-9/AC-10, 4.4/AC-9/AC-11 und 4.8/AC-6/AC-7: explizite Aktionen, Geldfelder und zugehörige Fehlersperren. |
| UX-DR8, UX-DR25, UX-DR26, UX-DR27 | 4.3/AC-6/AC-11, 4.4/AC-5/AC-10/AC-11 und 4.8/AC-5/AC-7: tatsächlicher Gesamtbetrag/Prozentwert und ausschließlich begrenzte Skala/Füllung. |
| UX-DR9 | 4.1/AC-8, 4.3/AC-7 bis AC-10, 4.5/AC-9 und 4.8/AC-6: gemeinsame bestätigte Werte, Status und keine Teil-Erfolgsmeldung. |
| UX-DR10 | 4.4/AC-9/AC-11, 4.5/AC-8 bis AC-10 und 4.8/AC-5/AC-7: verständliche Löschfolge, Abbrechen/Escape und korrekter Fokus. |
| UX-DR11 | 4.1/AC-7, 4.3/AC-9, 4.5/AC-10 und 4.8/AC-7: drei bestehende Hauptbereiche und Automatik innerhalb Sparziele. |
| UX-DR12 | 4.3/AC-11, 4.5/AC-8 und 4.8/AC-7: deutsche Formate, keine systemseitigen Zeitzonenerläuterungen und erhaltene eigene Namen. |
| UX-DR13 | 4.1/AC-7, 4.2/AC-7, 4.5/AC-5/AC-10 und 4.8/AC-3: Aktivierung ohne Ziele, fehlende Auswahl und nutzbare leere Zielansicht. |
| UX-DR14, UX-DR15 | 4.1/AC-8, 4.3/AC-8/AC-10, 4.5/AC-9 und 4.8/AC-6: Laden, Feld-/Speicherfehler, Offline und erhaltene Entwürfe. |
| UX-DR16 | 4.6/AC-5, 4.7/AC-1/AC-10 und 4.8/AC-8: Serverlauf ohne Sitzung, kontogebundener Browserzustand und entkräftete späte Antworten. |
| UX-DR17, UX-DR18 | Konkrete vier Prüfgrößen in 4.1 bis 4.5; gemeinsame Tastatur-/Screenreader-/Text-/Reflow-/Kontrastabnahme in 4.8/AC-7. |
| UX-DR19 | 4.8/AC-3 bis AC-8/AC-12 führt Flows 3 bis 5 zusammen; 4.7/AC-12 belegt den tatsächlichen Hintergrundteil ohne Sitzung. |
| UX-DR20 | 4.5/AC-10 und 4.8/AC-7/AC-8 erhalten die rote zugängliche Abmeldung aus Epic 3 samt Zustandsverwerfen. |
| UX-DR21 | 4.4/AC-1/AC-2/AC-7/AC-9 und 4.8/AC-5: historische Ausgabenaktion bestätigt erst mit notwendiger Monatswirkung. |
| UX-DR22 | 4.1/AC-7/AC-9, 4.5/AC-10 und 4.8/AC-3/AC-4: erreichbarer Automatikabschnitt, klarer Start und keine Sitzungs-/Zielvoraussetzung. |
| UX-DR23 | 4.3/AC-9/AC-11 und 4.8/AC-4/AC-5: ausschließlich eigene explizite Auswahl und vollständige Übernahmefolgen. |
| UX-DR24 | 4.2/AC-7/AC-10, 4.3/AC-4/AC-8, 4.5/AC-5 und 4.8/AC-4: benannte nichtnegative Vormerkung einschließlich null, getrennt vom Fortschritt. |
| UX-DR28 | 4.1/AC-8, 4.3/AC-10, 4.5/AC-9 und 4.8/AC-6/AC-9: unbestätigtes Speichern, Zustandsklärung und erhaltener Altclient-Aktualisierungsweg. |
| UX-DR29 | 4.3/AC-8, 4.4/AC-10, 4.5/AC-9 und 4.8/AC-8: frische konsistente Rückkehransichten ohne Entwurfs-/Revisionsverlust. |
| UX-DR30 | 4.3/AC-10, 4.4/AC-7 bis AC-9, 4.5/AC-7, 4.7/AC-6 und 4.8/AC-2/AC-6: lokale Fehlersperre und erreichbare manuelle Reparatur/Löschung trotz Nachholfehler. |

Alle 27 zugewiesenen UX-IDs sind erfasst. Die primäre Umsetzung von UX-DR3, UX-DR6 und UX-DR7 liegt in Epic 3; Zugang, Monatsüberblick und Ausgabenhistorie bleiben auch mit aktiver Automatik erhalten.

#### Vollständige Zuordnung der Monatsfälle

| Fall | Fachlicher Schwerpunkt | Primäre Story-/Abnahmezuordnung |
| --- | --- | --- |
| M-01 | Aktivierungsmonat zählt vollständig, frühere Monate nie | 4.1/AC-4, 4.2/AC-2, 4.7/AC-12, 4.8/AC-3/AC-10 |
| M-02 | Vormerkung auch ohne je gewähltes Ziel | 4.1/AC-4/AC-7, 4.2/AC-7/AC-11, 4.8/AC-4 |
| M-03 | 200 € + 100 € auf 50 € ergeben einmalig 350 € | 4.3/AC-3/AC-4/AC-7/AC-12, 4.8/AC-4 |
| M-04 | Vor Zuordnung nur Oktober 200 € auf 150 € korrigieren | 4.4/AC-4/AC-12, 4.3/AC-4, 4.8/AC-5/AC-10 |
| M-05 | Historischer positiver Monatsrest auf ausgewähltes Ziel | 4.3/AC-6/AC-12, 4.6/AC-7/AC-12 |
| M-06 | Null/negativer Rest, fehlendes Budget, Rücknahme alter Wirkung | 4.2/AC-2/AC-3, 4.4/AC-5/AC-6/AC-12, 4.8/AC-10 |
| M-07 | Tatsächliches Nachholen nach Ausfall ohne Sitzung | 4.6/AC-4 bis AC-9/AC-12, 4.7/AC-1 bis AC-3/AC-6/AC-7/AC-12 |
| M-08 | Teurere historische Ausgabe: nur −50 € | 4.4/AC-5/AC-7/AC-12, 4.8/AC-5 |
| M-09 | Günstigere/gelöschte historische Ausgabe: nur positive Differenz | 4.4/AC-5/AC-12, 4.8/AC-5/AC-10 |
| M-10 | Manuell 300 € minus 50 € ergeben 250 € | 4.4/AC-5/AC-8, 4.6/AC-9, 4.8/AC-5 |
| M-11 | 20 € minus 50 € ergeben tatsächlich −30 € | 4.4/AC-5/AC-10/AC-12, 4.8/AC-5/AC-7 |
| M-12 | −30 € plus 100 € ergeben 70 € | 4.3/AC-6/AC-12, 4.4/AC-5/AC-10/AC-12, 4.8/AC-5 |
| M-13 | Oktober bleibt A samt Korrektur, November folgt B | 4.3/AC-5/AC-12, 4.4/AC-5/AC-12, 4.5/AC-3/AC-11 |
| M-14 | Ausgewähltes Ziel löschen, ohne Umleitung weiter vormerken | 4.5/AC-3 bis AC-5/AC-7 bis AC-11, 4.8/AC-5 |
| M-15 | Gelöschte Herkunft erzeugt bei späterer Korrektur keine neue Wirkung | 4.5/AC-4/AC-6/AC-11, 4.4/AC-6/AC-12, 4.8/AC-5 |
| M-16 | Tatsächliche Übererfüllung, ausschließlich Balken begrenzt | 4.3/AC-11, 4.4/AC-10/AC-11/AC-12, 4.8/AC-7 |
| M-17 | Geldgrenzen, Commitfehler, Konkurrenz, Wiederholung und Fehlerisolierung | 4.3/AC-7/AC-12, 4.4/AC-7/AC-8/AC-12, 4.5/AC-7/AC-11, 4.6/AC-8/AC-9/AC-11, 4.7/AC-3/AC-5 bis AC-7/AC-11/AC-12, 4.8/AC-6/AC-9/AC-10/AC-12 |

Story 4.8/AC-10 fordert für jeden dieser 17 Fälle konkrete ausführbare Prüfreferenzen und tatsächliche Ergebnisse am integrierten Revisionsstand. Die vorliegende Tabelle weist die Planungsverantwortung zu und ersetzt diese künftige Implementierungsevidenz nicht.

#### Zusätzliche verbindliche Präzisierungen und Ergebnis

- Budgetierte Nullmonate bleiben ohne Auswahl offen und werden bei späterer Auswahl mitgebunden: 4.2/AC-3, 4.3/AC-4/AC-5, 4.4/AC-5/AC-6 und 4.8/AC-10. Fehlendes Budget bleibt ein anderer Zustand.
- Noch unverarbeitete abgeschlossene Bindungen werden bei Ziellöschung ohne Nachholzwang verbraucht: 4.5/AC-4/AC-7/AC-11, anschließend 4.6/AC-7/AC-12 und 4.8/AC-5/AC-10.
- Manuelles Ersetzen bleibt bei blockierter Nachholung möglich: 4.3/AC-10, 4.4/AC-8, 4.5/AC-7, 4.7/AC-6 und 4.8/AC-6. Die technische Versuchsfortschreibung verlangt keine erfolgreiche Finanzneuberechnung.
- Frühere Nachweislücken gehen trotz späterer vorhandener Monate nicht verloren: 4.3/AC-3, 4.6/AC-4/AC-7 und 4.7/AC-12. Die globale Discovery bleibt eine begrenzte technische Ausnahme ohne Finanz-/Zugangsdaten.
- Vollständige v1-Lese-/Schreibbarriere und dauerhafte Rücknahmegrenze werden aus Epic 3 übernommen und bei regulärer Automatikfreigabe erneut nachgewiesen: 4.8/AC-1/AC-2/AC-9/AC-12.

Epic 4 ist vollständig in bestätigte Stories zerlegt. Sein umgesetzter und geprüfter Abschluss liefert die ausdrücklich aktivierbare Monatsautomatik mit Vormerkung, kompletter Übernahme, historischer Korrektur, sicherer Ziellöschung und fairem Nachholen ohne Sitzung. Dafür ist keine spätere Epic-Arbeit vorgesehen. Produktions- und Datenlebenszyklusfragen bleiben nach 4.8/AC-11 ausdrücklich eigene offene Bedingungen.

### Gesamtstand der neuen Story-Planung und Übergang zur Abschlussvalidierung

| Planungsumfang | Stories | Abnahmekriterien |
| --- | --- | --- |
| Epic 3 — tägliche v2-Bedienung, Datenüberführung und signierter manueller Fortschritt | 8 | 80 |
| Epic 4 — vollständige Monatsautomatik und gemeinsame Freigabe | 8 | 92 |
| Neue Planung insgesamt | 16 | 172 |

Die Vereinigungsmenge der konkreten Abdeckungstabellen beider Epics umfasst alle **17 FRs, zwölf NFRs, 23 Architekturvorgaben und 30 UX-Anforderungen** des aktuellen Inventars. Alle **17 Monatsfälle** sowie die zusätzlichen Kalender-/Nullmonat-/Lösch-/Korrektur-/Versionsregeln sind zugeordnet. Jede neue Story besitzt eine eindeutige Nummer, vollständige Nutzerstory und nummerierte Given-/When-/Then-Abnahmen. Ihre Grundlagen liegen im Bestand oder in vorherigen Stories; offene Produktionsentscheidungen sind keine versteckte spätere Funktionsstory.

Die neun historischen Stories und ihre Fertigmeldungen aus Epics 1–2 bleiben erhalten. Es wurden ausschließlich Planungsdokumente geändert; Anwendungscode, Sprintstatus und tatsächlicher Implementierungsstand werden durch diese Einzelbestätigungen nicht auf `done` gesetzt. Die vorgesehene Prüfevidenz wird bei Umsetzung erzeugt und nicht als heute ausgeführt ausgegeben.

Alle vier Workflow-Schritte sind abgeschlossen. Die Abschlussvalidierung hat vollständige Anforderungsabdeckung, Architektur/Datenobjekte bei Bedarf, Story-Qualität, Epic-Struktur einschließlich gemeinsamer Dateien, Abhängigkeiten sowie Formatierung/Historienerhalt ohne offene Prüfpunkte bestätigt. Linus hat den Abschluss mit **C** bestätigt. Das Epic-Dokument ist als `final` gespeichert und für die weitere Umsetzungsplanung bereit.
