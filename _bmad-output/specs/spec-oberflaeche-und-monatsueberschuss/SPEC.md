---
id: SPEC-oberflaeche-und-monatsueberschuss
created: 2026-10-25
updated: 2026-10-25
status: final
companions:
  - monatsueberschuesse.md
  - brownfield.md
  - ../../planning-artifacts/prds/prd-try-not-to-be-poor-2026-10-19/prd.md
  - ../../planning-artifacts/epics.md
  - ../../planning-artifacts/architecture/architecture-try-not-to-be-poor-2026-10-19/ARCHITECTURE-SPINE.md
  - ../../planning-artifacts/ux-designs/ux-try-not-to-be-poor-2026-10-19/DESIGN.md
  - ../../planning-artifacts/ux-designs/ux-try-not-to-be-poor-2026-10-19/EXPERIENCE.md
sources: []
---

# Oberfläche vereinfachen und Monatsüberschuss einem Sparziel anrechnen

## Why

Linus möchte die Oberfläche für ausschließlich deutsche Nutzer:innen vereinfachen: Zeitzonenhinweise entfallen, die Ausgabenerfassung bekommt einen eigenen Bereich und Abmelden wird rot dargestellt. Übrig gebliebenes Monatsbudget soll automatisch einem ausgewählten Sparziel zugutekommen oder bis zur Zielauswahl vorgemerkt werden; derzeit müssen Nutzer:innen den Fortschritt vollständig manuell pflegen.

Die vier Fähigkeiten sind fachlich geklärt und noch nicht umgesetzt. Diese Änderungsspezifikation ersetzt gezielt die in [brownfield.md](./brownfield.md) benannten bisherigen Regeln; im übrigen Umfang gilt der Bestand. Die Monatsregeln stehen verbindlich in [monatsueberschuesse.md](./monatsueberschuesse.md). Interne Autorisierung und API-Kompatibilität sind vor der Implementierung technisch zu planen.

## Capabilities

- **CAP-1**
  - **intent:** Nutzer:innen lesen verständliche deutsche Oberflächentexte ohne technische Erläuterung der Zeitzone.
  - **success:** Budgethinweis, Monatsübersicht und Ausgabenformular nennen weder „in Berlin“ noch „Kalender in Berlin“, „Europe/Berlin“ oder andere systemseitige Zeitzonenerläuterungen; auch zugängliche Hilfstexte verzichten darauf.
- **CAP-2**
  - **intent:** Nutzer:innen erfassen eigene Ausgaben in einem eigenen Tab „Ausgaben“ und prüfen ihr Budget im Tab „Monat“.
  - **success:** Die Hauptnavigation bietet „Monat“, „Ausgaben“ und „Sparziele“. Das Ausgabenformular liegt im Tab „Ausgaben“; „Monat“ enthält kein Erfassungsformular. Nach bestätigtem Anlegen, Bearbeiten oder Löschen zeigt die nächste Monatsansicht das korrekte Restbudget.
- **CAP-3**
  - **intent:** Nutzer:innen erkennen „Abmelden“ als konsistente rote Aktion.
  - **success:** Alle angemeldeten Hauptbereiche bieten einen roten Abmeldebutton mit lesbarem Text und sichtbarem Tastaturfokus. Die Aktion beendet die Sitzung und verwirft persönliche Daten wie bisher.
- **CAP-4**
  - **intent:** Nutzer:innen können Monatsüberschüsse ab Aktivierung automatisch einem ausgewählten eigenen Sparziel anrechnen oder bis zur Zielauswahl vormerken lassen und den Gesamtfortschritt weiterhin manuell ändern.
  - **success:** 1.000 € Monatsbudget minus 800 € Monatsausgaben erhöht 50 € Fortschritt auf 250 €. Ohne Ziel werden 200 € vorgemerkt und bei Zielauswahl genau einmal angerechnet. Historische Ausgabenänderungen korrigieren den zugeordneten oder vorgemerkten Betrag; 20 € Fortschritt minus 50 € Korrektur ergibt −30 €. Alle Abnahmefälle aus `monatsueberschuesse.md` sind erfüllt.

## Constraints

- Interne Erfassungsdaten und Monatsgrenzen verwenden weiterhin `Europe/Berlin`, einschließlich Sommer-/Winterzeit. Euro- und Datumsformate bleiben deutsch; nutzereigene Texte mit dem Wort „Berlin“ werden nicht gefiltert.
- Ausgabenhistorie umfasst weiterhin alle Monate. Budget läuft fort; eine Budgetänderung wirkt im laufenden und in folgenden Monaten. Monat bleibt die Startansicht.
- **Von Linus bestätigt:** Start im Aktivierungsmonat, auch ohne ausgewähltes Ziel. Monate vor Aktivierung werden nicht nachgebucht. Überschüsse ohne Ziel bleiben vorgemerkt und werden bei Zielauswahl vollständig automatisch angerechnet.
- Angerechnet oder vorgemerkt wird `max(0, Monatsbudget − eigene Monatsausgaben)` für den abgeschlossenen Monat; ohne Budget wird kein Überschuss erfunden. Ein negativer Monatsrest erzeugt keine neue Sparbelastung; eine Korrektur kann eine frühere Anrechnung zurücknehmen. Sparzielanrechnungen sind keine Ausgaben des Folgemonats und verändern dessen Budgetformel nicht.
- **Von Linus bestätigt:** Ein ausgewähltes eigenes Ziel erhält die Anrechnung, ohne Verteilung. Zielwechsel betrifft den offenen und spätere Monate. Abgeschlossene Anrechnungen samt Korrekturen bleiben ihrem ursprünglichen Ziel zugeordnet. Löschen entfernt das Ziel samt Fortschritt ohne Übertragung; weitere Überschüsse ohne gültiges Ziel werden vorgemerkt.
- **Von Linus bestätigt:** Manuelle Fortschrittsänderungen bleiben möglich. Historische Ausgabenänderungen korrigieren nur die Differenz des Monatsüberschusses; manuelle Änderungen dürfen nicht durch eine Rekonstruktion allein aus Monatsüberschüssen überschrieben werden. Negative Fortschrittswerte sind zulässig.
- Geldwerte verwenden exakte ganzzahlige EUR-Cent innerhalb ±9.007.199.254.740.991. Der Sparfortschritt darf negativ sein und den positiven Zielbetrag überschreiten. Tatsächlicher Betrag und Prozentwert bleiben sichtbar; nur der Balken ist auf 0 bis 100 % begrenzt.
- Automatik und Vormerkung benötigen keine geöffnete Oberfläche oder aktive Sitzung. Ausfälle sind nachholbar; Wiederholungen, Neustarts und parallele Verarbeitung erzeugen weder doppelte Anrechnungen noch verlorene Fortschrittsänderungen. Erfolg gilt erst nach Commit.
- Kontentrennung, erzwungene RLS, Modulzuständigkeit und Datenhaltung im Browser nur im Arbeitsspeicher gelten weiter. Der interne Monatsabschluss benötigt eine ausdrücklich definierte Autorisierung; vorhandene JWT-Regeln dürfen nicht stillschweigend umgangen werden. Die Einführung negativer API-Antwortwerte muss die Vertrags- und Versionierungsregeln erfüllen.
- Die bestehenden Anforderungen an Tastaturbedienung, Kontrast, Beschriftungen, Sitzungsende und responsive Bedienung gelten auch für den neuen Tab, die Vormerkungen und den roten Button.

## Non-goals

- Banküberweisungen, Bankimport, Einnahmenerfassung oder gemeinsame Finanzansichten.
- Wahl zusätzlicher Zeitzonen oder Währungen.
- Ein neuer Beitragsverlauf als Nutzeroberfläche; technische Monatsnachweise und eine erkennbare vorgemerkte Summe sind davon unberührt.
- Eine separate offene Korrekturschuld neben dem Fortschritt; negative Korrekturergebnisse werden direkt als negativer Fortschritt geführt.
- Produktionsfreigabe durch diese Anforderung.

## Success signal

- Eine Person verwaltet eine Ausgabe im Tab „Ausgaben“, prüft danach im Tab „Monat“ den korrekten Budgetrest und meldet sich über den roten Button ab; systemseitige Zeitzonenhinweise erscheinen in keiner Hauptansicht.
- Ab Aktivierung geht jeder Monatsüberschuss genau einmal in das ausgewählte eigene Ziel oder eine Vormerkung ein. Zielauswahl übernimmt offene Vormerkungen. Historische Korrekturen bleiben korrekt zugeordnet, auch bei manuellem oder negativem Fortschritt; andere Konten bleiben unberührt.

## Assumptions

- „In einer eigenen“ meint einen eigenen Tab „Ausgaben“; auch Historie, Bearbeiten und Löschen ziehen in diesen Bereich. Die gewünschte Verlagerung des Erfassungsformulars ist eindeutig, der Umfang dieses Umzugs ist daraus abgeleitet.
- Der neue vorzeichenbehaftete Wertebereich gilt einheitlich auch für die manuelle Eingabe des Gesamtfortschritts; abgeleitet aus negativem Fortschritt und beibehaltener manueller Bearbeitung.
