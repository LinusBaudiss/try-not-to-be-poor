---
name: try-not-to-be-poor
status: final
updated: 2026-10-25
sources:
  - '{planning_artifacts}/briefs/brief-try-not-to-be-poor-2026-10-18/brief.md'
  - '{planning_artifacts}/briefs/brief-try-not-to-be-poor-2026-10-18/addendum.md'
  - '{planning_artifacts}/prds/prd-try-not-to-be-poor-2026-10-19/prd.md'
  - '{planning_artifacts}/prds/prd-try-not-to-be-poor-2026-10-19/addendum.md'
  - '{planning_artifacts}/prds/prd-try-not-to-be-poor-2026-10-19/reconcile-product-brief.md'
  - '{planning_artifacts}/prds/prd-try-not-to-be-poor-2026-10-19/reconcile-data-isolation-addendum.md'
  - '{planning_artifacts}/prds/prd-try-not-to-be-poor-2026-10-19/review-privacy-boundary.md'
  - '{planning_artifacts}/prds/prd-try-not-to-be-poor-2026-10-19/review-rubric.md'
  - '{project-root}/_bmad-output/specs/spec-try-not-to-be-poor/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-oberflaeche-und-monatsueberschuss/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-oberflaeche-und-monatsueberschuss/monatsueberschuesse.md'
  - '{project-root}/_bmad-output/specs/spec-oberflaeche-und-monatsueberschuss/brownfield.md'
  - '{planning_artifacts}/architecture/architecture-try-not-to-be-poor-2026-10-19/ARCHITECTURE-SPINE.md'
  - '{planning_artifacts}/epics.md'
---

# Try Not to Be Poor — Experience Spine

## Foundation

Responsive Website mit Priorität für Smartphones, ebenso am Rechner bedienbar. Ein UI-System ist nicht festgelegt. [DESIGN.md](./DESIGN.md) definiert die visuelle Identität; diese Spine legt Informationsarchitektur, Verhalten und Zustände fest. Die Oberfläche zeigt private manuelle Angaben und rechnerische Monatswirkungen; sie verifiziert keine Kontostände und überweist kein Geld.

**Zielzustand und Quellenrangfolge:** Das [PRD vom 25.10.2026](../../prds/prd-try-not-to-be-poor-2026-10-19/prd.md), die [Änderungsspezifikation](../../../specs/spec-oberflaeche-und-monatsueberschuss/SPEC.md) und deren [Monatsfachregeln](../../../specs/spec-oberflaeche-und-monatsueberschuss/monatsueberschuesse.md) bestimmen den neuen Umfang. Das PRD übernimmt die Präzisierungen der [Architektur AD-7 bis AD-10](../../architecture/architecture-try-not-to-be-poor-2026-10-19/ARCHITECTURE-SPINE.md) zu Nullüberschüssen, gelöschten Zielen, Konsistenz und Übergang. Ältere Brief-, Review-, Epic- und Story-Aussagen gelten für unveränderte Regeln und als historische Herkunft. Zweiernavigation, ausschließlich manueller und nichtnegativer Fortschritt sowie frühere offene Betrags-/Lebenszyklusfragen sind abgelöst. Der [Quellenabgleich](./reconcile-update-2026-10-25.md) hält diese Übernahme fest.

Die neue Navigation und Automatik sind noch umzusetzen. Dieses Dokument ist keine Produktionsfreigabe. Die technischen Freigaben aus PRD §8.4 und Architektur AD-10 gelten vor Bereitstellung der neuen Oberfläche; der normale Produktfluss enthält keine API- oder Infrastrukturbegriffe.

## Information Architecture

Die Hauptnavigation lautet in dieser Reihenfolge **Monat**, **Ausgaben**, **Sparziele**. Monat bleibt Startansicht nach Anmeldung. In allen drei Bereichen steht derselbe rote Button **Abmelden**. Zugang ist kein vierter Hauptbereich.

| Oberfläche | Erreicht über | Zweck und zugehöriger Flow |
|---|---|---|
| Registrierung / Anmeldung | Aktiver Registrierungslink oder erneuter Besuch | Eigenes Konto mit E-Mail/Passwort anlegen beziehungsweise anmelden. Flow 1. |
| Monat | Nach Anmeldung oder Navigation „Monat“ | Budget festlegen/ändern, laufenden Monat mit Budget, Ausgabensumme und Restbudget prüfen. Kein Ausgabenformular. Flow 1. |
| Ausgaben | Navigation „Ausgaben“ | Ausgabe erfassen und vollständige eigene Historie aller Monate mit Name, Betrag und Erfassungsdatum lesen. [ASSUMPTION aus SPEC/PRD] Auch Bearbeiten und Löschen ziehen hierher. Flows 1 und 4. |
| Sparziele | Navigation „Sparziele“ | Ziele anlegen, bearbeiten, löschen und tatsächlichen Gesamtfortschritt lesen/ersetzen. Flows 2 und 5. |
| Monatsautomatik innerhalb Sparziele | [ASSUMPTION] Abschnitt im Bereich „Sparziele“ | Aktivieren, Startmonat und Status erkennen, eigenes Ziel auswählen/wechseln, vorgemerkte Summe lesen. Auch ohne vorhandenes Ziel zugänglich. Flows 3 und 5. |
| Löschbestätigung | „Löschen“ an eigener Ausgabe oder eigenem Ziel | Folgen verstehen und ausdrücklich bestätigen oder abbrechen. Flows 4 und 5. |

Die drei Hauptbereiche besitzen statische visuelle Referenzen: [Monat](./mockups/key-monat.html) für Budget und Monatsübersicht, [Ausgaben](./mockups/key-ausgaben.html) für Erfassung und Historie sowie [Sparziele](./mockups/key-sparziele.html) für Aktivierung, Vormerkung und negativen Fortschritt. Zugang und Löschbestätigungen werden aus den Spine-Verträgen gebaut; Linus hat Mockups für die drei Hauptbereiche gewählt. Nicht definierte Kontoverwaltung, Export oder Einstellungen erhalten hier keine zusätzliche Oberfläche.

## Voice and Tone

Deutsche Systemtexte und deutsche Euro-/Datumsformate bleiben erhalten (`1.234,56 €`, `25.10.2026`). [ASSUMPTION] Die Mikrocopy bleibt kurz, sachlich und nicht wertend. Finanzberatung, garantierte Ersparnis und Bankübertragung werden nicht suggeriert.

**Textregel CAP-1 / FR-13:** Sichtbare Texte, Labels, Tooltips, Fehlermeldungen und zugängliche Hilfstexte enthalten keine systemseitige Zeitzonenerläuterung. Interne Datumssetzung und Monatsgrenzen bleiben `Europe/Berlin`; diese Implementierungsregel erscheint nicht als Produkttext. Nutzereigene Angaben wie „Berlin-Fahrt“ bleiben unverändert.

Die folgenden Formulierungen sind [ASSUMPTION] für die konkrete Mikrocopy; die darin beschriebenen Folgen sind verbindlich.

| Situation | Textmuster |
|---|---|
| Budget | „Dein Budget gilt für den laufenden Monat und danach, bis du es änderst.“ |
| Ausgabe | „Das Datum wird automatisch gesetzt.“ |
| Überschreitung | „Restbudget: −12,00 €“ und „12,00 € über dem Monatsbudget“. |
| Vor Aktivierung | „Monatsüberschüsse automatisch berücksichtigen“; erklären: ab diesem Monat, erstmals nach Monatsende, frühere Monate bleiben unberücksichtigt. |
| Aktiv, ohne Ziel | „Automatik aktiv seit Oktober 2026. Kein Ziel ausgewählt. Überschüsse werden vorgemerkt.“ |
| Vormerkung | „Vorgemerkt: 300,00 €. Bei der Zielauswahl wird der gesamte vorgemerkte Betrag angerechnet.“ |
| Negativer Fortschritt | „Fortschritt: −30,00 € von 100,00 € · −30 %“. Keine separate „Korrekturschuld“. |
| Manuelle Eingabe | „Gesamtfortschritt ersetzen“; erklären, dass die Eingabe den aktuellen Gesamtbetrag ersetzt und spätere Monatswirkungen ihn weiter ändern. |
| Fehlgeschlagene Auswahl | „Auswahl nicht gespeichert. Vorgemerkte Beträge bleiben erhalten.“ Nur verwenden, wenn der Fehlschlag sicher feststeht. |
| Ungewisser Ausgang | „Speicherung noch nicht bestätigt. Aktuellen Stand neu laden.“ |

## Component Patterns

Visuelle Verträge stehen in [DESIGN.md → Components](./DESIGN.md#components). Verhalten und zugängliche Namen gelten unabhängig von Farbe; Text nutzt `{colors.text-primary}` und `{typography.body}`, Fehler `{colors.error}`, Fokus `{colors.focus-ring}`.

| Baustein | Verhalten |
|---|---|
| `main-navigation` | Drei beschriftete Navigationsziele, aktueller Bereich programmatisch und sichtbar erkennbar. Routewechsel funktionieren per Tastatur und Touch; neue Hauptüberschrift wird fokussiert beziehungsweise angekündigt. Keine bloß visuelle Tab-Auswahl ohne geänderten Inhalt. |
| `logout-button` | `{components.logout-button}` beendet die Sitzung und entfernt persönliche Ansichten samt Entwürfen. Während des Versuchs kein Doppelsenden; ein fehlgeschlagener Widerruf wird nicht als erfolgreiche Serverabmeldung bestätigt. Lokale Daten werden dennoch verworfen, geschützte Ansichten bleiben geschlossen. |
| `auth-form` | Registrierung nur mit gültigem geteiltem Link; E-Mail/Passwort und Anmeldung klar unterscheiden. Zugangsfehler bleiben neutral. Erneute Anmeldung nach Ablauf führt in einen frischen Kontozustand. |
| `primary-button` | Explizit beschriftete Aktion. Während des zugehörigen Speicherns Doppelsenden blockieren und „Wird gespeichert …“ melden; andere unabhängige Korrekturmöglichkeiten nicht pauschal sperren. Erfolg erst nach Commit. |
| `money-field` | Sichtbares Label und EUR. Höchstens zwei Euro-Nachkommastellen; exakte Centwerte, keine stille Rundung. Ausgabe/Zielbetrag positiv, Budget ab null. Fortschritt ist signiert [ASSUMPTION aus SPEC/PRD auch für manuelle Eingabe]. Mobile Eingabe muss beim Fortschritt ein Minus ermöglichen; eine nur positive Dezimaltastatur darf negative Eingabe nicht verhindern. Fehler bleibt am Feld, Entwurf im offenen Tab erhalten. |
| `budget-summary` | `{components.budget-summary}` benennt Monatsbudget, laufende Ausgaben und tatsächliches Restbudget. Fehlendes Budget ist von null verschieden. Budgetänderung gilt nach Bestätigung im laufenden und folgenden Monaten, nicht rückwirkend in abgeschlossenen Monaten. |
| `expense-table` | Eigene Ausgaben aller Monate mit semantischen Spalten für Name, Datum, Betrag. Monatswechsel kürzt die Historie nicht. Erfassungsdatum ist automatisch gesetzt und nicht editierbar. |
| `expense-row` | Explizite Aktionen Bearbeiten/Löschen; Editieren erhält Datum und Eigentümer. Die Bestätigung einer historischen Betragsänderung oder Löschung umfasst deren notwendige Monatskorrektur. Eine reine Namensänderung hat keine Geldwirkung. |
| `automation-panel` | `{components.automation-panel}` bietet vor Erstaktivierung eine explizite Aktivierung, auch ohne Ziel. Startmonat und Folge sind vor Bestätigung erklärt. Nach Commit: „aktiv seit …“, Zielstatus und Vormerkung. Kein offener Tab, Login oder manueller Abschlussknopf ist Voraussetzung der Verarbeitung. Eine Deaktivierung ist nicht spezifiziert. |
| `goal-selection` | Nur eigene vorhandene Ziele; kein erstes Ziel vorbelegen. Neue Zielanlage allein wählt es nicht aus. Vor „Auswahl speichern“ vollständige Übernahme aller offenen Vormerkungen erklären. Auswahl/Wechsel, Übernahme und neuer Fortschritt werden erst nach gemeinsamer Bestätigung angezeigt. Ein Wechsel verschiebt keine alten Zuordnungen. |
| `pending-surplus` | `{components.pending-surplus}` zeigt die erkennbare nichtnegative offene Gesamtsumme, auch null, getrennt vom Zielfortschritt. Ohne Auswahl verständlichen Hinweis und Zielauswahl beziehungsweise Zielanlage anbieten. Summe ist erst nach bestätigter vollständiger Übernahme null; kein Nutzer-Beitragsverlauf wird eingeführt. |
| `goal-progress-value` | `{components.goal-progress-value}` zeigt aktuellen Gesamtbetrag, positiven Zielbetrag und tatsächlichen Prozentwert einschließlich negativer Werte und Übererfüllung. Manuelle Änderung ersetzt den Gesamtstand und erhält Monatsbindungen. Zielbearbeitung erhält Fortschritt; leeres Zieldatum entfernt das Datum. Neue Ziele starten mit null. |
| `goal-progress-track` | Visuelle Skala von 0 bis 100 %. Zusammen mit den benannten Werten lesen lassen; der Balken ist keine zweite finanzielle Größe. |
| `goal-progress-fill` | Nur Füllung auf 0–100 % begrenzen. Assistive Ausgabe darf das visuelle Minimum/Maximum nicht als tatsächlichen Fortschritt ausgeben; signierter Betrag und echter Prozentwert bleiben zugänglich. |
| `save-status` | Speichern, bestätigten Erfolg und Fehler verständlich ankündigen. Bei unbekanntem Ausgang weder Erfolg noch sicheren Rollback behaupten; aktuellen Stand ermitteln, bevor eine Wiederholung als neue Mutation angeboten wird. |
| `delete-confirmation` | Objekt und Folgen nennen. Bei Ziel: Ziel und tatsächlicher Fortschritt entfallen, alte Anrechnungen werden nicht übertragen; bei ausgewähltem Ziel werden weitere Überschüsse bis zur nächsten Auswahl vorgemerkt. Bestehende Vormerkungen bleiben erhalten. Dialogfokus einschließen, Abbrechen/Escape erhält Daten. Nach Ende Fokus zum Auslöser, nach dessen Entfernung zum nächsten sinnvollen Eintrag oder zur Anlegeaktion. |

## State Patterns

Gemeinsame Lade-, Fehler-, Offline- und Sitzungsregeln gelten auch für den Automatikabschnitt und Löschdialoge.

| Zustand | Oberfläche | Verhalten |
|---|---|---|
| Nicht angemeldet | Zugang / geschützte Bereiche | Keine Finanzdaten. Anmeldung oder gültige Registrierung anbieten; geschützte direkte Links führen über den Zugang. |
| Ungültiger/abgelaufener Registrierungslink | Registrierung | Neutrale Erklärung, keine Kontoauskunft. Der bestehende Linkvertrag umfasst 30 Tage und geschützten Ersatz/Widerruf; kein neues Kontoverwaltungsmenü daraus ableiten. |
| Anmeldung fehlgeschlagen | Zugang | Neutraler Fehler ohne Bestätigung fremder Konten; erneuten Versuch ermöglichen. |
| Laden / neu laden | Alle Hauptbereiche | Noch nicht geladene Werte als solche kennzeichnen, keine erfundenen Nullwerte. [ASSUMPTION] Inhaltsskelett in erwarteter Form. Nur Daten des aktuellen Kontos einsetzen. |
| Kein Monatsbudget | Monat | Zur Budgetfestlegung führen; kein Restbudget als null ausgeben. Automatik erzeugt ohne damaliges Budget keinen Betrag. |
| Budget ausdrücklich null | Monat | Null als gültiges Budget zeigen; Rest exakt berechnen, gegebenenfalls negativ. |
| Noch keine Ausgaben | Ausgaben | „Noch keine Ausgaben erfasst“ und sichtbare Erfassungsaktion; vollständiges Formular bleibt erreichbar. |
| Noch keine Sparziele | Sparziele | „Sparziel anlegen“; Automatikaktivierung bleibt möglich. Eine fehlende Auswahl und gegebenenfalls Vormerkung bleiben sichtbar. |
| Automatik nicht aktiviert | Sparziele | Aktivierung erläutern; keine Vormerkung oder Monatswirkung für frühere Monate suggerieren. |
| Aktiv, ohne Ziel | Sparziele | Startmonat, „Kein Ziel ausgewählt“ und offene Vormerkung anzeigen. Kein zufälliges Ziel auswählen und Zustand nicht als deaktiviert/pausiert bezeichnen. |
| Aktiv, mit Ziel | Sparziele | Ausgewähltes Ziel benennen; Anrechnung nach Monatsende erläutern. Offene Vormerkung und aktueller tatsächlicher Fortschritt stammen aus konsistentem bestätigtem Stand. |
| Zielauswahl / Übernahme läuft | Sparziele | Gewünschte Auswahl als Entwurf behandeln. Gespeicherte Auswahl, Fortschritt und Vormerkung nicht teilweise vorwegnehmen; zugehörige Aktion gegen Doppelsenden sperren. |
| Übernahme / Korrektur fehlgeschlagen | Sparziele / Ausgaben | Keine Teilbestätigung. Bei sicherem Fehler bleiben gespeicherte Auswahl, Vormerkung und Fortschritt unverändert; erforderliche historische Ausgabenmutation wird ebenfalls nicht bestätigt. Entwurf und erneuten Versuch anbieten. |
| Betragsgrenze erreicht | Betroffenes Formular / Sparziele | Feldnah beziehungsweise am fehlgeschlagenen Vorgang erklären; nichts runden oder abschneiden. Manuelles Ersetzen des Fortschritts bleibt auch bei grenzbedingt blockiertem Nachhollauf erreichbar. Ziellöschung setzt keinen erfolgreichen Nachhollauf voraus. |
| Speichern unbestätigt | Alle Mutationen | Ungewissen Ausgang benennen; aktuellen Stand neu laden. Keine blinde Wiederholung und keine vorzeitige Erfolgsmeldung. |
| Eingabefehler | Alle Formulare | Fehler programmatisch zuordnen, nächsten Schritt nennen, Fokus zum ersten Fehler oder zur Zusammenfassung; Entwurf erhalten. |
| Offline / Verbindung verloren | Alle Hauptbereiche | Keine lokale Synchronisierung versprechen. Entwürfe nur im offenen Tab erhalten; fehlende Verbindung benennen und Speichern bis zur Wiederverbindung blockieren. |
| Restbudget negativ | Monat | Tatsächliches Minus und Überschreitungstext zeigen; keine neue Sparbelastung allein aus dem negativen Monatsrest. |
| Fortschritt negativ / übererfüllt | Sparziele | Tatsächlichen Betrag und Prozentwert zeigen; Balken bei 0 beziehungsweise 100 %. Negative Werte sind kein Eingabe- oder Kontofehler. |
| Löschbestätigung offen | Ausgaben / Sparziele | Folgen lesbar, Fokus eingeschlossen, Escape/Abbrechen ohne Änderung. Während Bestätigung kein Doppelsenden. |
| Ausgewähltes Ziel gelöscht | Sparziele | Ziel und Fortschritt entfernt, Auswahl leer, bestehende Vormerkungen erhalten. Künftige Überschüsse werden vorgemerkt; frühere gebundene Monate bleiben verbraucht. |
| Rückkehr / veraltete Daten | Monat / Sparziele | Nach bestätigter Mutation betroffene Ansichten neu laden. Bei Rückkehr nach Monatswechsel oder Hintergrundverarbeitung konsistente aktuelle Werte laden, alte Werte nicht als frisch ausgeben. Kein Entwurf wird durch Hintergrundantwort stillschweigend ersetzt. |
| Sitzung endet / Kontowechsel | Überall | Finanzdaten, Auswahl, Vormerkungen und Entwürfe aus dem Browser entfernen. Späte Antworten verwerfen; keine Rückkehr alter Werte nach neuer Anmeldung. Automatik läuft serverseitig unabhängig davon weiter. |
| Zugriff nicht erlaubt | Direkter Datenzugriff | Fremde und nicht vorhandene Datensätze gleich neutral behandeln; keine Namen, Beträge oder Existenz verraten. |
| Oberfläche veraltet | Beim notwendigen Versionswechsel | [ASSUMPTION] Verständlicher Hinweis „Bitte lade die Seite neu“ mit Aktualisierungsaktion. Geschützte Altansichten schließen und gegebenenfalls neu anmelden; keine API-Versionsdiagnose im Produktfluss. |

## Interaction Primitives

- Tastatur, Touch und Screenreader erreichen alle Kernaktionen; Hover und Wischgesten sind kein alleiniger Zugangsweg. Navigation, Labels und Fokus bleiben beim Wechsel des Bereichs eindeutig.
- Speichern erfolgt ausdrücklich. Erfolg gilt erst nach Commit; zusammengehörige Werte erscheinen gemeinsam. Nach Ausgabeänderungen ist die nächste Monatsansicht aktuell, nach Monatskorrekturen die nächste Sparzielansicht. Ein offenes Formular behält bei Fehlern seinen Entwurf ausschließlich im Arbeitsspeicher des offenen Tabs.
- Während einer Mutation wird Doppelsenden verhindert. Späte Antworten nach Sitzungsende oder Kontowechsel können weder Werte noch Erfolgsstatus zurückbringen. Ein aktueller Gesamtfortschritt darf nicht durch eine ältere Leseantwort ersetzt werden.
- Formularfelder sind beschriftet. Betrag und Prozentwert behalten das Vorzeichen; native mobile Eingabehilfen dürfen die signierte Fortschrittseingabe nicht einschränken. Zieldaten sind Kalenderdaten ohne Uhrzeit; Ausgabedaten bleiben serverseitig gesetzt.
- Löschdialoge lassen sich mit Escape abbrechen. Nach bestätigtem Löschen bleibt eine sinnvolle Fokusposition erhalten; keine verdeckte zweite Bestätigung oder verschachtelte Dialogkette.

## Accessibility Floor

**WCAG 2.2 AA ist das Prüfziel** aus PRD FR-11, keine Behauptung einer Zertifizierung. Visuelle Kontraste definiert [DESIGN.md → Colors](./DESIGN.md#colors).

- Semantische Navigation, Überschriften, Formulare, Links, Buttons und Tabellen; sichtbare Labels und zugeordnete Fehler. Der aktuelle Hauptbereich ist programmatisch erkennbar.
- Vollständige Tastaturbedienung mit logischem, sichtbarem und nicht verdecktem Fokus. Der rote Abmeldebutton bleibt auch in Fokus-, Hover- und laufendem Zustand lesbar.
- Statusänderungen nach Speichern, Übernahme und Korrektur verständlich ankündigen. Automatikstatus, fehlende Zielauswahl und vorgemerkter Betrag sind auch ohne Farbe wahrnehmbar.
- Tatsächlichen signierten Fortschritt und Prozentwert zugänglich ausgeben. [ASSUMPTION] Der rein visuelle Balken kann vor assistiver Technik verborgen werden, wenn die zugehörige vollständige Textangabe den Stand vermittelt; kein widersprüchliches „0 %“ bei tatsächlichen −30 %.
- 200 % Textgröße und Reflow bei 320 CSS-Pixeln ohne horizontales Scrollen für Kernaufgaben. Mindestens 44 CSS-Pixel hohe Aktionen und 48 CSS-Pixel hohe Geldfelder; Touch-Zielbreite ebenfalls mindestens 44 CSS-Pixel.
- Fehler nennen Feld und nächsten Schritt. Die Bedeutung von Vorzeichen, Vormerkung und bestätigter Auswahl bleibt beim Screenreader erhalten. Zugängliche Hilfstexte enthalten keine Zeitzonenerläuterung.
- [ASSUMPTION] Bewegung ist entbehrlich; `prefers-reduced-motion` wird berücksichtigt.

## Monatswirkungen und Darstellung

Die [Monatsfachregeln mit 17 Abnahmefällen](../../../specs/spec-oberflaeche-und-monatsueberschuss/monatsueberschuesse.md) und PRD FR-14 bis FR-17 bestimmen die Berechnung; diese UX-Regeln legen ihre sichtbare Bedeutung fest.

| Situation | Für die Oberfläche verbindliche Bedeutung |
|---|---|
| Aktivierung im Oktober | Gesamter Oktober wird erstmals nach Monatsende berücksichtigt; September nie. Spätere erste Zielwahl verändert den Start nicht. Kein genauer Ausführungszeitpunkt wird versprochen. |
| Abgeschlossener Monat | Mit damaligem Budget: `max(0, Budget − eigene Monatsausgaben)`. Ohne Budget kein erfundener Betrag. Sparanrechnung ist keine Ausgabe und verändert das Restbudget nicht. |
| Keine Auswahl / spätere Auswahl | Überschuss vorgemerkt; bei bestätigter Auswahl sämtliche offenen Vormerkungen einmal übernehmen, einschließlich fälliger bisher unverarbeiteter Monate nach deren historischen Regeln. |
| Auswahlwechsel | Offener und folgende Monate verwenden das neue Ziel. Bereits zugeordnete Monate samt Korrekturen bleiben beim ursprünglichen Ziel; offene Vormerkungen werden dem neuen Ziel vollständig angerechnet. |
| Budget mit Überschuss null | Vormerkungssumme kann null sein, ohne dass eine historische Zielbindung entfällt. Auch Nullmonate werden bei späterer Auswahl gebunden; eine spätere positive Korrektur geht an dieses Ziel. Fehlendes Budget ist davon verschieden. Kein zusätzlicher Nutzerverlauf nötig. |
| Historische Betragsänderung / Löschung | Vor Zuordnung die betroffene Vormerkung korrigieren; danach nur `neuer Überschuss − zuletzt berücksichtigter Überschuss` auf den aktuellen Stand des ursprünglichen vorhandenen Ziels anwenden. Ausgabe und Korrektur zusammen bestätigen. |
| Manueller Gesamtstand | Ersetzt den aktuellen Fortschritt, erhält historische Bindungen. Bei manuell 300 € und Korrektur −50 € bleiben 250 €; keine Rekonstruktion allein aus Monatsüberschüssen. |
| Gelöschtes Ziel | Frühere gebundene Monate bleiben verbraucht, auch noch unverarbeitete abgeschlossene Monate mit damaliger Auswahl dieses Ziels. Keine Wiederanlage, neue Vormerkung oder Umleitung durch spätere Korrekturen. Löschen wartet nicht auf einen Nachhollauf. |
| Nachholen | Läuft ohne geöffnete Seite/Sitzung, bewahrt historische Zielauswahl und wirkt nicht doppelt. Bei späterem Besuch aktuelle bestätigte Werte laden; fehlgeschlagene Vorgänge nicht als Erfolg zeigen. |

Alle Geldwerte beruhen auf exakten ganzzahligen EUR-Cent. Gespeicherte und berechnete Werte bleiben innerhalb ±9.007.199.254.740.991 Cent. Ausgabe und Zielbetrag sind positiv; Budget darf null sein. Fortschritt darf negativ sein und den Zielbetrag übersteigen; der signierte manuelle Bereich bleibt eine ausdrücklich übernommene Quellenannahme. Höchstens zwei Euro-Nachkommastellen, keine stille Rundung oder Teilübernahme.

| Tatsächlicher Stand bei 100 € Ziel | Sichtbarer / zugänglicher Text | Visuelle Füllung |
|---|---|---|
| −30 € | −30,00 € von 100,00 € · −30 % | 0 % |
| 70 € | 70,00 € von 100,00 € · 70 % | 70 % |
| 150 € | 150,00 € von 100,00 € · 150 % | 100 % |

## Inspiration & Anti-patterns

Es sind keine Vorbildprodukte bestätigt. Keine gemeinsame Finanzansicht, Einnahmenerfassung, Bankimporte/-überweisungen, Kategorien, wiederkehrenden Ausgaben oder betrieblichen Finanzen ergänzen. Aus Monatsnachweisen folgt kein Nutzer-Beitragsverlauf. Vormerkungen werden nicht verworfen, automatisch auf zufällige Ziele verteilt oder als separate Korrekturschuld dargestellt. Ein negativer Fortschritt wird nicht auf null gekürzt.

## Responsive & Platform

Die vier Viewports und 200-%-Textprüfung sind verbindliche Prüfanker aus PRD FR-11. [ASSUMPTION] Unter 768 px bleiben Flächen einspaltig; ab 768 px dürfen Inhalte desselben Bereichs nebeneinanderstehen. Lesereihenfolge und Bereichstrennung bleiben erhalten. Ein nativer Client ist nicht Teil dieser UX.

| Viewport (CSS-Pixel) | Zu prüfende Aufgaben |
|---|---|
| 320 × 568 | Zugang, drei Navigationseinträge, rote Abmeldung, Budget/Rest und Ausgabenerfassung; signierte Eingabe, Vormerkung und Zielauswahl ohne horizontales Scrollen. |
| 390 × 844 | Ausgaben hinzufügen/bearbeiten/löschen, Ziele erstellen und Fortschritt ersetzen; Bildschirmtastatur, negative Werte, Auswahlübernahme und Löschdialog. |
| 768 × 1024 | Monatsübersicht, gesamte Historie, Automatikzustände und Ziele ohne abgeschnittene Werte; lange Beträge und sichtbarer Fokus. |
| 1280 × 800 | Kernreise und alle Sparziel-/Automatikflows mit Tastatur, Tabelle, Dialogen und Statusmeldungen; keine Vermischung der Hauptbereiche. |

## Key Flows

Nur UJ-1 ist im PRD als zentrale Nutzerreise benannt. Weitere Flows sind UX-Ableitungen aus den bestätigten Funktionen; die Beispiele legen keine neuen Fachregeln fest. Jeder Flow folgt auch den gemeinsamen Fehler-/Sitzungsregeln unter [State Patterns](#state-patterns).

### Flow 1 — UJ-1 — Linus erfasst Ausgaben und prüft seinen Monatsüberblick.

1. Linus registriert sich am Smartphone über den gültigen Link mit E-Mail/Passwort oder meldet sich bei späterem Besuch an. Er landet in **Monat**; gegebenenfalls legt er dort zuerst sein Budget fest.
2. Er öffnet **Ausgaben**, trägt Name und positiven Betrag ein und speichert. Das Datum wird automatisch gesetzt; keine freie Datumswahl oder systemseitige Zeitzonenerläuterung erscheint.
3. Nach bestätigtem Speichern sieht er den Eintrag mit Name, Betrag und Datum in seiner vollständigen Historie, einschließlich früherer Monate. Bearbeiten und bestätigtes Löschen stehen dort bereit.
4. **Climax:** Er wechselt zu **Monat** und sieht Budget, laufende Ausgabensumme und dazu konsistentes Restbudget ohne Nebenrechnung. Ein negativer Betrag und seine Überschreitung bleiben ausdrücklich lesbar.
5. Er meldet sich über den roten Button ab. Persönliche Daten und Entwürfe verschwinden; eine später eintreffende Antwort öffnet die alte Ansicht nicht erneut.

**Fehlerpfade:** Ungültiger Link/Zugang neutral; kein Budget → festlegen statt erfundenem Rest. Fehler beim Speichern → Entwurf erhalten, kein Erfolg. Ungewisser Ausgang → Stand neu laden. Fremddaten bleiben verborgen; nach Sitzungsende neu anmelden.

### Flow 2 — Linus pflegt Ziel und Gesamtfortschritt (abgeleitet)

1. Linus öffnet **Sparziele** und legt „Notgroschen“ mit positivem Zielbetrag und optionalem Datum an. Das neue Ziel startet mit 0 € und wird nicht automatisch für die Monatsautomatik ausgewählt.
2. Er bearbeitet Name/Zielbetrag/Datum; der Fortschritt bleibt erhalten, ein geleertes Datum entfällt nach Bestätigung.
3. Später trägt er den tatsächlichen Gesamtfortschritt ein, bei Bedarf mit Minuszeichen. Der Hinweis erklärt, dass die Eingabe den Gesamtstand ersetzt.
4. **Climax:** Nach bestätigtem Speichern sieht er bei −30 € und 100 € Ziel **−30 %** mit leerem Balken; bei 150 € sieht er **150 %** mit vollem Balken. Die tatsächlichen Zahlen bleiben auch assistiv lesbar.

**Fehlerpfade:** Ungültige Werte bleiben im Formular, nichts wird gerundet. Auch bei einem grenzbedingt blockierten Nachhollauf bleibt manuelles Ersetzen erreichbar. Sitzung endet → Daten und Entwurf verwerfen.

### Flow 3 — Linus aktiviert ohne Ziel und übernimmt Vormerkungen (abgeleitet)

1. Linus öffnet im Oktober **Sparziele** und aktiviert die Monatsautomatik ohne vorhandenes Ziel. Vorher liest er: ab diesem Monat, erster Abschluss nach dessen Ende, keine Anrechnung früherer Monate.
2. Nach Bestätigung sieht er Startmonat, aktive Automatik und fehlende Auswahl. Er schließt die App. Nach Monatsende wird ein Oktoberüberschuss von 200 € ohne offene Sitzung vorgemerkt; weitere 100 € aus November kommen hinzu.
3. Beim nächsten Besuch lädt die App den bestätigten Stand: **300 € vorgemerkt**, noch keinem Ziel angerechnet. Linus legt ein Ziel an und setzt dessen Gesamtfortschritt auf 50 €.
4. Er wählt dieses Ziel für Monatsüberschüsse. Vor dem Speichern ist erkennbar, dass die **gesamte** offene Vormerkung übernommen wird; inzwischen fällige Monate werden nach ihren historischen Regeln berücksichtigt.
5. **Climax:** Nach gemeinsamer Bestätigung sieht er das ausgewählte Ziel mit **350 € Fortschritt** und **0 € vorgemerkt**. Eine erneute Auswahl rechnet dieselben Beträge nicht noch einmal an.

**Varianten/Fehlerpfade:** Mit bereits ausgewähltem Ziel erhöhen 1.000 € damaliges Budget minus 800 € Ausgaben einen Stand von 50 € auf 250 €. Ohne Budget kein erfundener Betrag; null/negativer Rest keine neue Sparbelastung. Übernahme scheitert → gespeicherte Auswahl, Fortschritt und Vormerkung gemeinsam erhalten. Kein genaues Abschlussdatum versprechen; nach Ausfall historische Auswahl bewahren.

### Flow 4 — Linus korrigiert eine historische Ausgabe (abgeleitet)

1. Linus findet in **Ausgaben** einen Eintrag aus einem abgeschlossenen aktivierten Monat und ändert seinen Betrag oder bestätigt dessen Löschung.
2. Die App bestätigt die Ausgabe erst zusammen mit ihrer notwendigen Monatskorrektur. Vor Zielzuordnung ändert sich nur die Vormerkung dieses Monats; nach Zuordnung wirkt nur die Differenz auf das ursprüngliche vorhandene Ziel.
3. Bei zuvor 200 € und neu 150 € Monatsüberschuss beträgt die Korrektur −50 €. Ein inzwischen manuell auf 300 € gesetzter Gesamtfortschritt wird dadurch 250 €.
4. **Climax:** Linus öffnet **Sparziele** und liest den aktuellen tatsächlichen Stand. War er vorher 20 €, steht dort nach −50 € Korrektur **−30 €**; eine spätere Anrechnung von 100 € ergibt **70 €**. Keine separate Schuld wird angelegt.

**Varianten/Fehlerpfade:** Günstigere oder gelöschte Ausgabe erhöht nur um die entsprechende Differenz. Reine Namensänderung ohne Geldwirkung. Grenz-/Speicherfehler verwerfen den gesamten zusammengehörigen Vorgang. Ein schon gelöschtes Ziel wird nicht wiederhergestellt; seine Monate erzeugen keine neue Vormerkung oder andere Zielanrechnung.

### Flow 5 — Linus wechselt oder löscht das ausgewählte Ziel (abgeleitet)

1. Im November wählt Linus in **Sparziele** Ziel B statt A. Vor dem Speichern liest er, dass der Wechsel den offenen und folgende Monate betrifft; offene Vormerkungen werden vollständig B angerechnet.
2. Nach Bestätigung bleibt Oktober A zugeordnet, November folgt B. Auch eine spätere Oktoberkorrektur verändert A. Ein historischer Nullmonat behält dieselbe Bindung für spätere Korrekturen.
3. Will Linus B löschen, erklärt der Dialog: Ziel und tatsächlicher Fortschritt entfallen, alte Anrechnungen werden nicht übertragen, weitere Überschüsse bleiben bis zur nächsten Auswahl vorgemerkt. Bereits offene Vormerkungen bleiben erhalten.
4. **Climax:** Nach ausdrücklicher Bestätigung ist B entfernt und keine Auswahl gesetzt. Linus erkennt den weiteren Weg zur Zielauswahl; alte gebundene Monate sind weder erneut vorgemerkt noch einem anderen Ziel zugeschlagen.

**Fehlerpfade:** Abbrechen/Escape verändert nichts. Nach erfolgreichem Löschen Fokus zum nächsten sinnvollen Ziel oder zur Anlegeaktion. Löschen ist auch ohne erfolgreichen Nachhollauf möglich; unverarbeitete abgeschlossene Monate mit damaliger Auswahl B bleiben verbraucht. Fehler bestätigt keine Löschung.

### Anforderungsabdeckung

Die Namen entsprechen dem aktuellen PRD; CAP-Bezüge gelten für die Änderungsspezifikation, nicht für gleichnamige IDs anderer Quellen.

| Anforderung | Key Flow / querschnittliche Abnahme |
|---|---|
| FR-1: Nutzerkonto über den Registrierungslink anlegen und Zugang nutzen | Flow 1, State Patterns; CAP-3 rotes Abmelden. |
| FR-2: Eigene Finanzdaten ansehen | Alle Flows mit ausschließlich eigenem Kontozustand; Sitzungsende in Flow 1. |
| FR-3: Daten anderer Personen schützen | Alle Flows, neutrale Zugriffsfehler; keine fremde Zielauswahl. |
| FR-4: Ausgabe manuell erfassen | Flow 1. |
| FR-5: Alle bisher erfassten Ausgaben tabellarisch ansehen | Flows 1 und 4. |
| FR-6: Eigene Ausgabe bearbeiten oder löschen | Flows 1 und 4. |
| FR-7: Monatsbudget festlegen | Flow 1. |
| FR-8: Restbudget anzeigen | Flow 1. |
| FR-9: Eigenes Sparziel anlegen, bearbeiten und löschen | Flows 2 und 5. |
| FR-10: Fortschritt eines Sparziels aktualisieren und ansehen | Flows 2 und 4. |
| FR-11: Website responsiv und zugänglich nutzen | Alle Flows in den vier Viewports, mit Tastatur und 200 % Textgröße. |
| FR-12: Monat, Ausgaben und Sparziele getrennt aufrufen | Flows 1–5; CAP-2. |
| FR-13: Deutsche Systemtexte ohne Zeitzonenerläuterungen anzeigen | Alle Flows einschließlich zugänglicher Hilfstexte; CAP-1. |
| FR-14: Monatsautomatik aktivieren | Flow 3; CAP-4. |
| FR-15: Monatsüberschuss zuordnen oder vormerken | Flows 3 und 5; CAP-4. |
| FR-16: Historische Monatsüberschüsse um Differenzen korrigieren | Flows 4 und 5; CAP-4. |
| FR-17: Monatsabschlüsse ohne offene Sitzung zuverlässig nachholen | Flow 3 und gemeinsame Fehler-/Aktualisierungsregeln; CAP-4. |

## Annahmen und offene Folgearbeit

- **Aus Quellen übernommen:** Gesamte Ausgabenverwaltung unter Ausgaben und signierter Bereich auch bei manueller Fortschrittseingabe bleiben ausdrücklich als Annahmen markiert (PRD §10). Beide sind bereits Grundlage der Zielarchitektur.
- **UX-Ausgestaltung:** Vorläufige visuelle Tokens, konkrete Mikrocopy, Automatikabschnitt unter Sparziele, Layout ab 768 px und entbehrliche Bewegung sind Annahmen. Sie ändern keine bestätigte Fachregel.
- **Außerhalb dieses Updates:** Export, Kontolöschung, Aufbewahrung, Kontowiederherstellung und Betrieb folgen den offenen Punkten im PRD §9. Es entstehen daraus hier keine zusätzlichen Einstellungen oder Freigaben.
