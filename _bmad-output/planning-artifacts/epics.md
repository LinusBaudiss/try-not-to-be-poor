---
status: final
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
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
