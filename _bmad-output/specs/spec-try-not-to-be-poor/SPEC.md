---
id: SPEC-try-not-to-be-poor
updated: 2026-10-25
companions:
  - brownfield.md
  - ../spec-oberflaeche-und-monatsueberschuss/monatsueberschuesse.md
  - ../../planning-artifacts/architecture/architecture-try-not-to-be-poor-2026-10-19/ARCHITECTURE-SPINE.md
  - ../../planning-artifacts/prds/prd-try-not-to-be-poor-2026-10-19/prd.md
  - ../../planning-artifacts/epics.md
  - ../../planning-artifacts/ux-designs/ux-try-not-to-be-poor-2026-10-19/DESIGN.md
  - ../../planning-artifacts/ux-designs/ux-try-not-to-be-poor-2026-10-19/EXPERIENCE.md
sources:
  - ../../planning-artifacts/briefs/brief-try-not-to-be-poor-2026-10-18/brief.md
  - ../../planning-artifacts/briefs/brief-try-not-to-be-poor-2026-10-18/addendum.md
  - ../spec-oberflaeche-und-monatsueberschuss/SPEC.md
---

# Try Not to Be Poor

Diese SPEC und ihre Begleiter bilden den Produktvertrag einschließlich der neuen Anforderungen. [brownfield.md](./brownfield.md) ordnet die unterschiedlichen Planungsstände ein und benennt ausdrücklich ersetzte Regeln; unveränderte Bestandsabnahmen gelten weiter.

## Why

Linus, Familie und Freunde benötigen einen verlässlichen Überblick über ihre Alltagsausgaben, ihr Monatsbudget und persönliche Sparziele. Die responsive Website soll Ausgaben transparent machen und das Sparen unterstützen. Eine getrennte Ausgabenansicht, verständliche deutsche Texte und eine erkennbare Abmeldeaktion vereinfachen die Bedienung; automatische Monatsüberschüsse ergänzen die bisher manuelle Fortschrittspflege. Mehr Geld am Monatsende bleibt ein gewünschtes Nutzungsergebnis ohne zugesicherte Ersparnis.

## Capabilities

- **CAP-1 — Eigene Ausgaben verwalten**
  - **intent:** Nutzer:innen können eigene Ausgaben im Tab „Ausgaben“ manuell erfassen, überblicken, bearbeiten und löschen.
  - **success:** Ein bestätigter Eintrag erscheint mit Name, Betrag und automatisch gesetztem Erfassungsdatum in der eigenen Historie aller Monate. Bearbeiten ändert nur Name und Betrag; bestätigtes Löschen entfernt den Eintrag. Nach einer Mutation zeigt die nächste Monatsansicht das korrekte Restbudget. Im Tab „Monat“ steht kein Erfassungsformular.
- **CAP-2 — Fortlaufendes Monatsbudget prüfen**
  - **intent:** Nutzer:innen können ein Monatsbudget für alle eigenen Ausgaben festlegen, ändern und den verbleibenden Betrag einsehen.
  - **success:** Der Tab „Monat“ zeigt Budget, laufende Monatsausgaben und deren exakte Differenz. Ohne Budget fordert er zur Festlegung auf; bei Überschreitung zeigt er den tatsächlichen negativen Betrag mit Hinweis. Ein Budgetwechsel wirkt im laufenden und in folgenden Monaten, ohne abgeschlossene Budgetstände zu ändern.
- **CAP-3 — Eigene Sparziele und Gesamtfortschritt pflegen**
  - **intent:** Nutzer:innen können eigene Sparziele mit Zielbetrag und optionalem Zieldatum verwalten, ihren Gesamtfortschritt manuell ändern und den tatsächlichen Stand erkennen.
  - **success:** Ein neues Ziel zeigt Name, positiven Zielbetrag, optionales Kalenderdatum und zunächst 0 € Fortschritt. Zielbearbeitung erhält den Fortschritt; ein leeres Datum entfernt das Datum. Manuelle Fortschrittseingabe ersetzt den Gesamtbetrag. Betrag und Prozentwert bleiben auch negativ oder über 100 % sichtbar; nur der Balken endet bei 0 beziehungsweise 100 %. Löschen verlangt eine Bestätigung und entfernt Ziel samt Fortschritt.
- **CAP-4 — Persönlichen Zugang öffnen und beenden**
  - **intent:** Nutzer:innen können ein eigenes Konto anlegen, sich anmelden, ihre Sitzung erneuern und sich über eine erkennbare rote Aktion abmelden.
  - **success:** Der aktive Registrierungslink ermöglicht ein eigenes Konto mit anschließender Anmeldung. Sitzungsverlängerung folgt dem bestehenden Zugangsvertrag. Alle angemeldeten Hauptbereiche bieten einen roten Abmeldebutton mit lesbarem Text und sichtbarem Fokus. Abmelden widerruft die Refresh-Familie und verwirft Tokens sowie Finanzdaten im Browser; Sitzungsende und Kontowechsel verhindern die Übernahme verspäteter Antworten.
- **CAP-5 — Deutsche Texte ohne Zeitzonenerläuterung lesen**
  - **intent:** Nutzer:innen verstehen die deutschen Oberflächentexte ohne technische Erläuterungen zur Zeitzone.
  - **success:** Budget-, Monats- und Ausgabentexte sowie zugängliche Hilfstexte enthalten keine systemseitigen Zeitzonenhinweise wie „in Berlin“, „Kalender in Berlin“ oder „Europe/Berlin“. Nutzereigene Texte wie „Berlin-Fahrt“ bleiben erhalten; interne Monatszuordnung und deutsche Euro-/Datumsformate bleiben korrekt.
- **CAP-6 — Monatsüberschüsse automatisch sparen**
  - **intent:** Nutzer:innen können Monatsüberschüsse ab Aktivierung automatisch einem ausgewählten eigenen Sparziel anrechnen oder bis zur Zielauswahl vormerken lassen.
  - **success:** 1.000 € Monatsbudget minus 800 € Monatsausgaben erhöht 50 € Fortschritt auf 250 €. Ohne Ziel bleiben 200 € und 100 € aus zwei Monaten vorgemerkt; die spätere Zielauswahl erhöht 50 € auf 350 € und leert die Vormerkung genau einmal. Historische Ausgabenänderungen korrigieren nur die jeweilige Differenz; 20 € Fortschritt minus 50 € Korrektur ergibt −30 €. Alle Abnahmen aus [monatsueberschuesse.md](../spec-oberflaeche-und-monatsueberschuss/monatsueberschuesse.md) gelten.

## Constraints

- Die Website umfasst Frontend und Backend, priorisiert Smartphones und bleibt am Rechner bedienbar. Die Hauptnavigation bietet „Monat“, „Ausgaben“ und „Sparziele“; „Monat“ bleibt Startansicht mit Budgetverwaltung und Monatsübersicht.
- Jede Person sieht und ändert ausschließlich eigene Ausgaben, Budgets, Ziele und Vormerkungen. Fremde und nicht vorhandene Ressourcen verraten keine fremden Daten oder deren Existenz. Erzwungene RLS und die getrennten Web-/Jobkontexte der Architektur bleiben verbindlich.
- Geldwerte sind exakte ganzzahlige EUR-Cent innerhalb ±9.007.199.254.740.991. Mehr als zwei Euro-Nachkommastellen und Mutationen außerhalb gespeicherter oder berechneter Cent-Grenzen werden abgelehnt. Ausgaben und Zielbeträge sind positiv; Budget und Vormerkungen nichtnegativ; Restbudget und Sparfortschritt dürfen negativ sein.
- Erfassungsdatum und Monatsgrenzen verwenden weiterhin `Europe/Berlin`, einschließlich Zeitumstellungen. Ausgabedatum ist serverseitig gesetzt und bei Bearbeitung unverändert; Kalenderdaten einschließlich Zieldatum werden nicht in Zeitpunkte umgerechnet.
- Das Monatsbudget läuft fort. Der Rest ergibt sich ausschließlich aus dem gültigen Budget minus eigenen Ausgaben des laufenden Monats. Sparzielanrechnungen sind keine Ausgaben und verändern diese Formel nicht.
- Automatik beginnt mit dem gesamten Aktivierungsmonat, auch ohne Ziel; frühere Monate bleiben ausgeschlossen. Nach Monatsende gilt `max(0, damals gültiges Budget − eigene Monatsausgaben)`; ohne Budget entsteht kein erfundener Überschuss. Ohne Ziel wird vorgemerkt, bei Auswahl alles noch Offene automatisch übernommen.
- Die Monatsendeauswahl bleibt auch bei verspätetem Abschluss maßgeblich. Zielwechsel betrifft den offenen und spätere Monate; abgeschlossene Zuordnungen und deren Differenzkorrekturen bleiben beim ursprünglichen Ziel. Gelöschte Zielanrechnungen werden weder umgeleitet noch erneut vorgemerkt; weitere Monate ohne gültiges Ziel werden vorgemerkt.
- Manuelle Eingabe ersetzt den aktuellen Gesamtfortschritt und erhält technische Monatsnachweise. Historische Korrekturen verändern nur die Monatsdifferenz am aktuellen Stand; sie rekonstruieren keinen Gesamtbetrag über manuelle Änderungen hinweg. Negative Ergebnisse werden weder abgeschnitten noch als separate Korrekturschuld geführt.
- Automatik benötigt keine aktive Sitzung oder offene Oberfläche. Ausfälle werden nachgeholt; Wiederholungen, Neustarts und Parallelität dürfen weder Doppelanrechnungen noch verlorene Änderungen erzeugen. Fortschritt und Zuordnung werden gemeinsam wirksam; bei gescheiterter Übernahme bleiben Vormerkungen erhalten.
- Finanzdaten und Access-Tokens bleiben im Browserarbeitsspeicher. Erfolg folgt erst nach Commit; Doppelsenden und späte Antworten nach Sitzungsende/Kontowechsel werden abgefangen. Entwürfe bleiben bei Fehlern/offline nur im offenen Tab; Ausgaben- und Ziellöschung verlangen eine verständliche Bestätigung.
- Tastaturbedienung, sichtbarer Fokus, programmatische Labels und Statusmeldungen, Kontrast und responsive Prüfpunkte aus UX/Storyabnahmen gelten auch für die neuen Zustände. WCAG 2.2 AA bleibt Prüfziel; Beträge, Prozentwerte und Status sind zusätzlich zur Farbe textlich erkennbar.
- Die technische Ausgestaltung einschließlich Modulgrenzen, Autorisierung, atomarer Verarbeitung und kontrollierter API-v2-Einführung folgt der adoptierten Architektur AD-1 bis AD-10. Die dortigen Migrations- und Versionsfreigaben sind Voraussetzung für Automatik und signierten Fortschritt.

## Non-goals

- Geschäftliche Nutzung und gemeinsame Finanzansichten mehrerer Personen.
- Einnahmenerfassung, Bankimport, Banküberweisungen, Kategorien und wiederkehrende Ausgaben.
- Weitere Währungen oder eine wählbare Zeitzone.
- Einzelne Sparbeiträge oder ein Beitragsverlauf als Nutzeroberfläche; technische Monatsnachweise und sichtbare Vormerkungen bleiben erforderlich.
- Eine separate offene Korrekturschuld neben dem Sparfortschritt.
- Produktionsfreigabe oder Einsatz echter Nutzerdaten durch dieses Spec-Update.

## Success signal

- Eine Person registriert sich oder meldet sich an, verwaltet eine Ausgabe im Tab „Ausgaben“, prüft danach im Tab „Monat“ den korrekten Budgetrest und meldet sich über den roten Button ab. Die Anwendung zeigt nur ihre Daten und keine systemseitigen Zeitzonenerläuterungen.
- Ab Aktivierung wird jeder abgeschlossene Monat genau einmal berücksichtigt. Zielauswahl übernimmt offene Vormerkungen; Zielwechsel, Ziellöschung und historische Korrekturen erhalten die festgelegte Herkunft. Manuelle Änderungen und negative Fortschritte bleiben korrekt, auch nach Ausfall oder konkurrierender Verarbeitung; andere Konten bleiben unberührt.

## Assumptions

- Die vollständige Ausgabenverwaltung einschließlich Historie, Bearbeiten und Löschen zieht in den Tab „Ausgaben“; aus der ursprünglichen Formulierung abgeleitet und bereits in der Zielarchitektur übernommen.
- Der signierte Fortschrittsbereich gilt auch für manuelle Gesamteingaben; aus der bestätigten Zulässigkeit negativer Fortschritte und beibehaltener manueller Bearbeitung abgeleitet und in der Zielarchitektur übernommen.

## Open Questions

- Vor echten Nutzerdaten: Welche Regeln gelten für Export, Kontolöschung, Aufbewahrung einschließlich technischer Monatsnachweise, Kontowiederherstellung und nötige E-Mail-Bestätigung? Die offenen Betriebsvorgaben und Backup-/Wiederherstellungsnachweise der Architektur bleiben zusätzliche Freigabevoraussetzungen.
