# Epic 4 Context: Monatsüberschüsse verlässlich für eigene Sparziele berücksichtigen

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Nutzer:innen aktivieren die Monatsautomatik ausdrücklich für ihr Konto. Abgeschlossene Überschüsse gehen an die historische Zielauswahl oder bleiben vorgemerkt. Auswahl, Korrektur, manuelle Fortschritte, Zielwechsel/-löschung und sitzungsfreies Nachholen erhalten Herkunft und Einmalwirkung. Die öffentliche Aktivierung bleibt bis zum vollständig geprüften Lebenszyklus gesperrt; Einzelbausteine erteilen keine Gesamt- oder Produktionsfreigabe.

## Stories

- Story 4.1: Monatsautomatik ausdrücklich ab dem ersten Aktivierungsmonat starten
- Story 4.2: Abgeschlossene Monatsüberschüsse ohne Ziel vormerken
- Story 4.3: Eigenes Ziel auswählen und alle offenen Vormerkungen übernehmen
- Story 4.4: Historische Ausgaben mit ihrer Monatsüberschusskorrektur ändern oder löschen
- Story 4.5: Sparziel löschen und seine historischen Monatsbindungen verbraucht halten
- Story 4.6: Fällige Monate ohne Nutzersitzung über einen begrenzten Jobzugang verarbeiten
- Story 4.7: Fällige Monate regelmäßig und fair nachholen sowie Fehler verzögert wiederholen
- Story 4.8: Monatsautomatik nach vollständigem Nachweis zur ausdrücklichen Aktivierung bereitstellen

## Requirements & Constraints

- Aktivierung benötigt weder Budget noch Ziel. Der gesamte Erstaktivierungsmonat wird nach Monatsende berücksichtigt; frühere Monate bleiben ausgeschlossen. Start bleibt unveränderlich, spätere Zielwahl verschiebt ihn nicht. Anmeldung, Freigabe und Zielanlage aktivieren nichts automatisch; Deaktivierung ist nicht spezifiziert.
- Abgeschlossenes Monatsbudget minus eigene Monatsausgaben, mindestens null, ergibt den Überschuss. Ohne Budget kein Betrag. Sparanrechnung verändert weder Ausgaben noch Restbudget. Maßgeblich bleibt die Monatsendeauswahl, auch bei verspäteter Verarbeitung.
- Ohne Auswahl bleiben budgetierte Monatsnachweise offen, einschließlich Nullüberschüssen. Zielwahl holt zuerst fällige Monate historisch nach und übernimmt anschließend alle offenen Nachweise vollständig, atomar und einmalig. Zielanlage wählt nichts aus; Wechsel betrifft offene/folgende Monate, alte Bindungen bleiben.
- Historische Betragsänderung/-löschung korrigiert atomar nur die Überschussdifferenz; fehlenden Nachweis historisch anlegen. Vor Zuordnung Vormerkung ändern, danach aktuellen Fortschritt des ursprünglichen vorhandenen Ziels. Manuelle Gesamteingabe erhält Nachweise und bleibt bei blockiertem Nachholen möglich. Keine Rekonstruktion, separate Schuld oder Kürzung bei null; reine Namensänderung ohne Geldwirkung.
- Ziellöschung verbraucht auch unverarbeitete abgeschlossene Bindungen ohne Nachholzwang oder vorherige Anrechnung. Historische Referenzen erhalten; keine Wiederanlage, Umleitung oder neue Vormerkung. Unzugeordnete Vormerkungen bleiben; betroffene aktuelle Auswahl leeren.
- Exakte EUR-Cent innerhalb ±9007199254740991 für gespeicherte und berechnete Werte; Grenzverletzung verwirft alles. Fortschritt darf negativ/übererfüllt sein. Kalender nach Europe/Berlin, Kalenderdaten ohne Zeitumrechnung. Keine Banktransfers, gemeinsamen Ansichten oder Nutzer-Beitragsverläufe. Datenlebenszyklus, Backups/Wiederherstellung und Produktionsbetrieb bleiben gesondert offen.

## Technical Decisions

- monthlysurplus besitzt Aktivierung, Auswahlhistorie, Monatsnachweise, Vormerkungen und Verarbeitungsmetadaten. Module greifen ausschließlich auf eigene Daten zu; äußere Koordination verwendet öffentliche Zugänge. Keine Geschwisterimporte, fremden Repositories oder modulübergreifenden SQL-Abfragen. Tabellen erst bei fachlicher Verwendung anlegen.
- Eine äußere physische Transaktion bindet genau ein Konto. Jede Mutation erwirbt vor zustandsabhängigem Lesen dieselbe transaktionsgebundene Kontosperre aus kanonischer UUID/Hash-Seed 14. Zeitpunkt/Monat danach einmal bestimmen und weiterreichen. Zusammengesetzte Ansichten lesen read-only REPEATABLE READ. Erfolg erst nach äußerem Commit.
- HTTP-Konto ausschließlich aus geprüftem JWT-sub, Jobkonto aus gespeicherter und unter Sperre erneut geprüfter Aktivierung. Abfragefilter plus erzwungene RLS mit transaktionslokalem app.user_id; fehlender Kontext verweigert Zugriff. Web-/Workerrollen getrennt, unprivilegiert, ohne Tabellenbesitz/BYPASSRLS oder Rollenaufstieg.
- Begrenzte kontoübergreifende Discovery ausschließlich im Automatikmodul für Worker: nur Konto-ID/Fälligkeit, gesonderter NOLOGIN-Funktionseigentümer, enge RLS-Policy, sicherer Suchpfad, kein PUBLIC-Recht. Kein öffentlicher Jobendpunkt/simulierter JWT. Hintergrundlauf im selben Java-Prozess nach Start und regelmäßig: chronologische begrenzte Pakete, Kontotransaktionen, eindeutige Monatsnachweise, faire Wahl und verzögerte Wiederholung. Nach Rollback nur technische Fehlermetadaten separat; keine vertraulichen Logwerte.
- V2-Vertrag vor Verbrauchern, v1 eingefroren. Neue Flyway-Migrationen und wiederholbare administrative Rollenbereitstellung erhalten Bestand. Öffentliche Automatik benötigt reale v1-Stilllegungsbarriere, passende Gesamtabnahme und sichere Jobkonfiguration; einfacher Schalter genügt nicht. Erste signierte Werte/Monatswirkungen verhindern dauerhaft v1-Rückfall.

## UX & Interaction Patterns

Automatik bleibt innerhalb Sparziele auch ohne Ziele erreichbar; drei Hauptbereiche/rote Abmeldung bleiben. Start, erster Abschluss nach Monatsende, fehlende Auswahl und vollständige Übernahme verständlich erklären, ohne Laufzeit-/Ersparnisversprechen. Laden, Fehler, Sperre, nicht aktiviert und gespeichert aktiv unterscheiden; keine erfundenen Nullen oder Deaktivierung bei technischer Sperre.

Erfolg nach Commit, Doppelsenden verhindern. Ungewissen Ausgang vor Wiederholung durch Laden klären. Offline keine Übertragung/Synchronisation versprechen. Persönliche Werte, Tokens und Entwürfe nur im Tab-Arbeitsspeicher; Sitzungswechsel verwirft sie und entkräftet späte Antworten. Rückkehr lädt konsistente Werte ohne Entwürfe zu überschreiben.

Bestehende Design-Tokens/Systemschrift; tatsächliche signierte Beträge/Prozente, nur Balken auf 0–100 %. WCAG 2.2 AA als Prüfziel: Labels, semantische Überschriften, Status/Fehler, sichtbarer Fokus, Bedeutung jenseits von Farbe, reduzierte Bewegung, 200-%-Text/320-Pixel-Reflow. Prüfpunkte 320×568, 390×844, 768×1024, 1280×800; Aktionen 44×44, Geldfelder 48 Pixel hoch, Textkontrast 4,5:1, Kontrollen/Fokus 3:1. Systemtexte ohne Zeitzonenerläuterungen.

## Cross-Story Dependencies

Epic 3 liefert v2-Zugang, Datenbesitzer, Koordination, Versionsbarriere und signierten manuellen Fortschritt. Frühe Bausteine erhalten ausschließlich testintern Gesamtfreigabe für echte Datenbank-/Browserprüfungen, ohne Versions-/JWT-/RLS-/Commitgrenzen zu umgehen. Öffentliche Freigabe folgt nach Auswahl, Korrektur, Löschung und sitzungsfreiem Nachholen. Alle 17 Monatsfälle plus Nullmonat-/Lösch-/Grenz-/Konkurrenzpräzisierungen benötigen revisionsbezogene tatsächliche Vertrags-, Architektur-, PostgreSQL-/Rollen-/Prozess- und Browsernachweise. Offene Produktionsbedingungen bleiben eigenständig.
