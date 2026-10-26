# Epic 3 Context: Ausgaben, Budget und Sparziele übersichtlich und sicher nutzen

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Den vorhandenen persönlichen Kontozugang und sämtliche Finanzdaten über einen vollständigen Wechsel auf API v2 erhalten. Drei klare Hauptbereiche machen Ausgabenhistorie, laufenden Monatsüberblick und Sparziele unabhängig bedienbar; der tatsächliche manuelle Gesamtfortschritt wird einschließlich negativer Werte nutzbar. Das Epic liefert ein vollständiges manuelles Ergebnis ohne Monatsautomatik oder Produktionsfreigabe.

## Stories

- Story 3.1: Eigenen Kontozugang über API v2 nutzen
- Story 3.2: In der Oberfläche den neuen Zugang und rotes Abmelden nutzen
- Story 3.3: Bestehende Ausgaben und Budgets verlustfrei weiterführen
- Story 3.4: Eigene Ausgaben im getrennten Bereich über API v2 verwalten
- Story 3.5: Monatsbudget und Restbudget über API v2 prüfen und ändern
- Story 3.6: Eigene Sparziele und Gesamtfortschritt über API v2 pflegen
- Story 3.7: Die neue Oberfläche nach sicherer v1-Stilllegung nutzen
- Story 3.8: Tatsächlichen Gesamtfortschritt auch negativ speichern

## Requirements & Constraints

- Jedes Konto sieht und verändert ausschließlich eigene Daten. Finanzidentität stammt nur aus geprüftem JWT-`sub`; fehlende und fremde Ressourcen dürfen keine Fremddatenexistenz offenbaren. Keine gemeinsamen Ansichten, Einnahmenverwaltung, Bankanbindung, Kategorien oder Beitragsverläufe ergänzen.
- Registrierungslink-, Passwort- und Sitzungsregeln bleiben erhalten: Links gelten 30 Tage und sind geschützt ersetzbar/widerrufbar; Passwörter umfassen 15–64 Zeichen einschließlich Leerzeichen und Unicode ohne Zeichenklassenzwang, bekannte kompromittierte Werte werden abgelehnt. Adaptive gesalzene Hashes schützen Passwörter. Access-JWTs gelten zehn Minuten; Refresh rotiert mit gehashtem Serverbestand, 30 Tagen Inaktivitätsgrenze und 90 Tagen absoluter Grenze. Wiederverwendung und Abmeldung widerrufen dieselbe Familie. CSRF, exakter Origin-Schutz, sichere Cookie-Attribute und `no-store` gelten versionsübergreifend.
- Geld bleibt ganzzahlig in EUR-Cent innerhalb ±9007199254740991; auch Summen und Ergebnisse werden exakt geprüft. Ausgabe und Zielbetrag sind positiv, Budget darf null sein. Fortschritt ersetzt den Gesamtbetrag und darf nach seiner Freigabe negativ beziehungsweise über dem Ziel liegen; nur der Balken endet bei 0 beziehungsweise 100 Prozent. Mehr als zwei Euro-Nachkommastellen werden abgelehnt.
- Erfassungsdatum und Monatsgrenzen verwenden intern Europe/Berlin. Bearbeiten erhält Eigentümer und Erfassungsdatum. Budget gilt monatswirksam fort; aktuelle Änderungen verändern keine abgeschlossenen Budgetstände. Restbudget ist gültiges Monatsbudget minus eigene laufende Monatsausgaben, bei fehlendem Budget nicht berechenbar. Sparziele beeinflussen diesen Rest nicht.
- Historie, IDs, Eigentümer, Datum, Budgetstände und Fortschritt werden verlustfrei erhalten. Produktionsbetrieb mit echten Daten bleibt abhängig von Datenlebenszyklus, Wiederherstellung und verschlüsselten externen Backups; abgeschlossene frühere Abnahmen werden nicht rückwirkend umgeschrieben.

## Technical Decisions

- Ein Java-Artefakt, statische Angular-SPA und PostgreSQL bleiben bestehen. Die Zielarchitektur trennt Datenbesitz in `access`, `expenses`, `budget`, `savingsgoals` und später `monthlysurplus`. Module nutzen keine Geschwister-Repositories; äußere Anwendungsfälle verbinden öffentliche Befehle und Projektionen. Automatikobjekte entstehen erst mit ihrem fachlichen Bedarf in Epic 4.
- Der v1-Vertrag `api-contract/openapi.yaml` bleibt eingefroren. `api-contract/v2/openapi.yaml` definiert v2 vor seinen Verbrauchern. OpenAPI 3.0.4, Generator 7.26.0 und oasdiff 1.30.0 bleiben verbindlich. Jede Hauptversion wird gegen ihre eigene Basis geprüft, separat generiert und in getrennten Java-/TypeScript-Namensräumen kompiliert; fehlende v2-Basis bedeutet Erstvertrag.
- Neue Flyway-Migrationen erhalten Bestandsdaten. RLS wird erzwungen; Abfragefilter und transaktionslokales `app.user_id` sichern dasselbe Konto. Laufzeitrollen besitzen keine RLS-Umgehung oder Besitzerrechte; erforderliche Rollenbereitstellung muss auch für initialisierte Volumes wiederholbar sein.
- Äußere Finanzkoordination bindet genau einen Konto-/Transaktionskontext. Alle Mutationen verwenden denselben transaktionsgebundenen Advisory-Kontoschlüssel aus kanonischer UUID und Seed 14, lesen den Fachzustand erst danach und teilen einen fachlichen Zeitpunkt/Monat. Zusammengesetzte Leseansichten verwenden eine gemeinsame read-only REPEATABLE-READ-Verbindung. Commit bestätigt den gesamten Vorgang; Fehler rollen ihn vollständig zurück.
- Während v1 unterstützt wird, bleiben negative Fortschrittsschreibwerte und Automatik serverseitig gesperrt. Vor Freigabe müssen alle v1-Aufrufe einschließlich bereits zugelassener Lesevorgänge und Datenbankarbeit beendet sein. Ein kontrollierter Einzelhostwechsel mit Wartungsunterbrechung genügt. Nach ersten signierten Werten oder Monatswirkungen ist ein Rückfall auf v1 ausgeschlossen; Rücknahme darf keine Daten abschneiden.

## UX & Interaction Patterns

Die Navigation lautet Monat, Ausgaben, Sparziele; Monat bleibt Startansicht. Ausgaben samt Historie/Bearbeiten/Löschen liegen vollständig im eigenen Bereich. Jede Hauptansicht verwendet dieselbe beschriftete rote Aktion „Abmelden“ mit sichtbarem Fokus und Abstand zu Speichern/Löschen. Deutsche Systemtexte und zugängliche Hilfen enthalten keine Zeitzonenerläuterung; nutzereigene Texte bleiben unverändert.

Tokens, Finanzdaten und Entwürfe bleiben flüchtig. Sitzungsende/Kontowechsel verwerfen persönliche Zustände und verspätete Antworten. Fehler erhalten Eingaben nur im offenen Tab; Doppelsenden wird verhindert, unbestätigter Ausgang bleibt ausdrücklich unbestätigt. Ausgaben- und Ziellöschung benötigen eine Bestätigung. Alte Oberflächen erhalten beim Versionswechsel einen Aktualisierungspfad.

WCAG 2.2 AA ist Prüfziel: Tastatur, programmatische Labels/Fehler/Status, sichtbarer Fokus, 200 Prozent Text und Reflow ohne horizontales Scrollen bei 320 CSS-Pixeln. Prüfgrößen: 320×568, 390×844, 768×1024, 1280×800. Aktionen mindestens 44×44, Geldfelder mindestens 48 CSS-Pixel; Textkontrast mindestens 4,5:1, Kontrollgrenzen/Fokus mindestens 3:1. Tatsächliche negative Werte und Übererfüllung bleiben lesbar und assistiv verständlich.

## Cross-Story Dependencies

Die Reihenfolge 3.1 bis 3.8 ist verbindlich: Zugang/Vertragsbasis → Browserzugang → verlustfreier Modulschnitt und Finanzkoordination → Ausgaben → Budget/Monatsansicht → Ziele mit signiertem Antwortvertrag → v1-Stilllegung → Freigabe negativer manueller Werte. Jede Story ist auf ihrem bestätigten Vorgängerstand eigenständig ausführbar; der interne Übergangsstand erhält bestehende Funktionen. Epic 4 baut auf dem vollständigen Epic 3 auf und liefert Aktivierung, Monatswirkungen und Jobverarbeitung separat.
