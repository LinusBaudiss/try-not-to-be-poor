# Quellenabgleich: Architektur vom 25.10.2026

**Geprüft:** PRD-Entwurf und Addendum vom 25.10.2026 gegen die finale Architecture Spine (`updated: 2026-10-25`). Geprüft wurde Dokumentabdeckung, keine Implementierung oder Laufzeitfunktion.

**Ergebnis:** PASS. Keine bestätigte Produktlücke und kein Widerspruch zur finalen Architektur. Die technischen Mechanismen bleiben durch ausdrücklichen Architekturverweis verbindlich; das PRD beschreibt deren sichtbare Folgen und Freigabegrenzen.

## Abdeckung

| Architekturquelle | Abdeckung in PRD/Addendum | Beurteilung |
| --- | --- | --- |
| Design Paradigm, Zeilen 43–45: Zielarchitektur gegenüber bestehender API v1 und expense-budget unterscheiden | PRD §0, Zeilen 17–19; Addendum Einleitung und Zuständigkeiten | Zielzustand ist ausdrücklich noch umzusetzen; neun abgeschlossene Stories bleiben Bestandsnachweise. Keine Behauptung neuer Implementierung oder Produktionsfreigabe. |
| AD-1: isolierte Module und äußere Koordination | Addendum Zuständigkeiten, Zeile 13 | Fünf Module, eigener Datenbesitz, öffentliche Funktionen, keine fremden Tabellen-/Internazugriffe; bisheriges gemeinsames Ausgaben-/Budgetmodul wird gezielt ersetzt. Technische Details bleiben in der Spine. |
| AD-2/AD-10: vollständige API v2, eingefrorene v1 und kontrollierter Wechsel | PRD §8.4; Addendum Vertragswechsel | V2 einschließlich Zugang und vorgezogene Vertragsfestlegung erfasst. Das Addendum verortet getrennte Verträge/Generierung, additive Migrationen und Rollenprovisionierung. |
| AD-3/AD-4: Kontoschutz, Sitzungen und getrennte Hintergrundautorisierung | PRD FR-1 bis FR-3, §8.2; Addendum Zuständigkeiten | 10-Minuten-Zugang und 30-/90-Tage-Refreshgrenzen, Widerruf, flüchtiger Zustand und verworfene späte Antworten erhalten. Jobautorisierung und forcierte RLS sind korrekt im Addendum verortet. |
| AD-5: Geld- und Kalenderregeln | PRD Glossar, FR-4, FR-6 bis FR-10, §8.1 | Exakte sichere Cent-Grenzen, Vorzeichen, Nachkommastellen, unveränderliches Ausgabedatum, historisch wirksames Budget und Restbudget ohne Sparwirkungen enthalten. Tatsächlicher Fortschrittsbetrag/Prozentwert und auf 0–100 % begrenzter Balken ausdrücklich erfasst. |
| AD-6: gemeinsame Betriebs-/Ausfallgrenze und Backups | PRD FR-17, §8.3, §9; Addendum Betriebsgrenze | Nachholen nach Ausfällen, Einzelhost, externe verschlüsselte Backups und getestete Wiederherstellung erfasst; konkrete Auslegung bleibt Produktions-Gate. Vollständige Hosting- und Stackfestlegung bleibt unter dem maßgeblichen Architekturverweis. |
| AD-7: gemeinsame Atomarität und konsistente Ansichten | PRD FR-6, FR-15 bis FR-17, §8.2; Addendum Konsistenz | Bestätigung oder vollständiges Verwerfen zusammengehöriger Änderungen, Schutz vor Doppelwirkung und verlorenen Änderungen sowie konsistent neu geladene Monatsansicht erfasst. Sperre, Verbindung, Snapshot und gemeinsamer Fachzeitpunkt bleiben technische Architekturvorgaben. |
| AD-8: Aktivierungsmonat, historische Monatsendeauswahl und Zustände | PRD Glossar, FR-9, FR-14 und FR-15 | Erstaktivierung auch ohne Ziel, Ausschluss früherer Monate, damaliges Budget, fehlendes Budget, Vormerkungen, vollständige Übernahme, Nullmonatsbindung und keine automatische Auswahl bei Zielanlage vollständig erfasst. |
| AD-9: historische Korrekturen und absoluter manueller Fortschritt | PRD FR-6, FR-10 und FR-16 | Korrektur nur um neuen minus zuletzt berücksichtigten Überschuss auf aktuellen Gesamtfortschritt; ursprüngliches Ziel trotz Wechsel; kein Rekonstruieren historischer absoluter Summen. Reine Namensänderungen lösen keine Geldwirkung aus. |
| AD-9: nachholbarer unabhängiger Hintergrundlauf | PRD FR-17, §8.3; Addendum Konsistenz | Ohne Sitzung/offene Seite, chronologische Nachholung, Einmalwirkung trotz Wiederholung/Parallelität, Fehler ohne Teilstände und ohne Blockieren anderer Konten; Beobachtbarkeit ohne sensible Logdaten. |
| AD-10: Navigation und UX-Grenzen | PRD FR-1, FR-11 bis FR-13, §8.2 | Monat/Ausgaben/Sparziele mit Monat als Start, eigener Ausgabenbereich, rote zugängliche Abmeldung, keine systemseitigen Zeitzonenerläuterungen, unberührte Nutzereingaben, Entwürfe nur im Tab, Doppelsendeschutz und Löschbestätigung enthalten. Viewports, WCAG-Prüfziel, Reflow, Textvergrößerung und Feld-/Aktionsgrößen konkret übernommen. |
| Deferred, Zeilen 243–247 | PRD §9; Addendum Vertragswechsel/Betriebsgrenze | Datenlebenszyklus einschließlich Monatsnachweisen, Wiederherstellung, Betriebsdimensionierung und Host-/Lastprofil für Zugangsdrosselung bleiben nachvollziehbar mit Owner/Trigger offen. UX und Folge-Stories werden vor Umsetzung synchronisiert; bestehende Done-Abnahmen bleiben historisch. |

## Besonders geprüfte Randfälle

### Finale Ziellöschregel

Architektur AD-8, Zeile 145, ist korrekt übernommen in PRD FR-9, Zeile 134, und Addendum Konsistenz, Zeile 21:

- Kein vorgeschalteter Nachhollauf und keine letzte Fortschrittserhöhung als Löschvoraussetzung.
- Bestehende und noch unverarbeitete abgeschlossene Monate mit historischer Auswahl dieses Ziels bleiben dauerhaft verbraucht.
- Keine Umbuchung, neue Vormerkung oder Wiederherstellung durch spätere Korrekturen.
- Unzugeordnete Vormerkungen bleiben erhalten; Auswahl für offenen Monat wird gegebenenfalls geleert.

Damit wurde der überholte frühere Memlog-Schritt zum Nachholen vor Löschung nicht versehentlich als aktuelle Vorgabe fortgeschrieben. Fällige Monate anderer Ziele werden durch das PRD ebenfalls nicht zur Löschvoraussetzung.

### Fortschrittszerlegung und Nullmonate

PRD FR-10 und FR-16 erhalten einen einzigen tatsächlichen Gesamtfortschritt. Die Formel in FR-16, Zeile 194, entspricht AD-9; manuelle Eingabe löscht keine technischen Monatsmetadaten und bleibt bei grenzbedingt blockierter Verarbeitung möglich. Es gibt keine sichtbaren Unterkonten und keine Korrekturschuld. FR-15, Zeilen 180 und 184, erhält historische Bindung beziehungsweise spätere Übernahme auch für Monate mit Budget und null Überschuss; ohne Budget entsteht keine erfundene Vormerkung.

### V1-Quieszenz und Datenmigration

PRD §8.4, Zeilen 245–249, übernimmt AD-10 einschließlich des finalen Schutzes gegen verzögerte Reads:

- Bestehende IDs, Eigentümer, Ausgabedaten, historische Budgetstände und manuelle Fortschritte bleiben erhalten.
- Keine rückwirkenden automatischen Monate vor Aktivierung und keine Umdeutung manueller Bestände.
- Automatik und negative manuelle Werte bleiben während v1-Unterstützung gesperrt.
- Vor Freigabe sind sämtliche zugelassenen v1-Vorgänge **einschließlich Lesezugriffen und ihrer Datenbankarbeit** beendet oder abgebrochen; veraltete Oberflächen haben einen Aktualisierungspfad.
- Nach ersten signierten Werten oder Monatswirkungen kein Rückfall auf v1, kein Abschneiden/Überschreiben von Finanzdaten für Code-Rollback.

## Lücken und Grenzen dieses Abgleichs

Keine echte Produktlücke festgestellt. Nicht im PRD ausformulierte Rollenrechte, Sperr-/Snapshotmechanismen, konkrete Versionsprüfung und Provisionierung bleiben durch Addendum und maßgebliche Spine referenziert; sie wurden nicht stillschweigend gestrichen oder erneut zur Entscheidung gestellt.

Der Dokumentabgleich belegt weder implementierte v2-Routen noch Migration, Hintergrundlauf, Rollen, Browserzustände oder Produktionsbereitschaft. Die entsprechende Trennung ist im PRD ausdrücklich enthalten.
