# Spine Pair Review — try-not-to-be-poor

Stand: 2026-10-25. Unabhängiger Rubric Walker im von Linus gewählten Reviewer Gate. Geprüft wurden die aktuellen Entwürfe von [DESIGN.md](./DESIGN.md), [EXPERIENCE.md](./EXPERIENCE.md) und die drei referenzierten HTML-Mockups. Die fünf Skill-Beispiele und die vollständige Rubrik bildeten den Prüfmaßstab.

## Overall verdict

Die beiden Spines bilden einen konsistenten und für die nachfolgende Umsetzung verwendbaren UX-Vertrag. Alle aktuellen Produktanforderungen sind auf benannte Abläufe beziehungsweise querschnittliche Regeln abgebildet; Tokens, Komponenten, Zustände und visuelle Referenzen sind vollständig verbunden. Im statischen Dokument- und HTML-Abgleich wurden keine bestätigten Befunde ermittelt; eine visuelle oder interaktive Browserabnahme ist damit nicht behauptet.

## 1. Flow coverage — strong

Extraktionsbasis sind das aktuelle [PRD](../../prds/prd-try-not-to-be-poor-2026-10-19/prd.md), die [Änderungsspezifikation](../../../specs/spec-oberflaeche-und-monatsueberschuss/SPEC.md), die [Monatsfachregeln](../../../specs/spec-oberflaeche-und-monatsueberschuss/monatsueberschuesse.md) und die darin übernommenen Architekturpräzisierungen. Überholte historische Aussagen wurden gemäß der ausdrücklichen Quellenrangfolge nicht als neue Anforderungen behandelt.

Die bestätigte Reise **UJ-1 — Linus erfasst Ausgaben und prüft seinen Monatsüberblick.** erscheint wortgetreu in Flow 1. Alle fünf Flows besitzen den benannten Protagonisten Linus, nummerierte Schritte, einen ausdrücklich bezeichneten Climax und Fehlerpfade. Die vier ergänzenden Flows sind als UX-Ableitungen gekennzeichnet.

| Extrahierte Anforderung | Abdeckung in EXPERIENCE.md |
|---|---|
| FR-1: Nutzerkonto über den Registrierungslink anlegen und Zugang nutzen | Flow 1, Zugangszustände und rote Abmeldung. |
| FR-2: Eigene Finanzdaten ansehen | Flows 1–5, kontobezogene Anzeige und Sitzungsbereinigung. |
| FR-3: Daten anderer Personen schützen | Flows 1–5, neutrale Zugriffsfehler und ausschließlich eigene Zielauswahl. |
| FR-4: Ausgabe manuell erfassen | Flow 1. |
| FR-5: Alle bisher erfassten Ausgaben tabellarisch ansehen | Flows 1 und 4. |
| FR-6: Eigene Ausgabe bearbeiten oder löschen | Flows 1 und 4 sowie Löschbestätigung. |
| FR-7: Monatsbudget festlegen | Flow 1 und `budget-summary`. |
| FR-8: Restbudget anzeigen | Flow 1 und Zustände ohne Budget, mit Nullbudget und negativem Restbudget. |
| FR-9: Eigenes Sparziel anlegen, bearbeiten und löschen | Flows 2 und 5. |
| FR-10: Fortschritt eines Sparziels aktualisieren und ansehen | Flows 2 und 4. |
| FR-11: Website responsiv und zugänglich nutzen | Alle Flows; Accessibility Floor und vier festgelegte Viewports. |
| FR-12: Monat, Ausgaben und Sparziele getrennt aufrufen | Flows 1–5 und Information Architecture. |
| FR-13: Deutsche Systemtexte ohne Zeitzonenerläuterungen anzeigen | Alle Flows; Voice and Tone einschließlich zugänglicher Hilfstexte. |
| FR-14: Monatsautomatik aktivieren | Flow 3. |
| FR-15: Monatsüberschuss zuordnen oder vormerken | Flows 3 und 5. |
| FR-16: Historische Monatsüberschüsse um Differenzen korrigieren | Flows 4 und 5. |
| FR-17: Monatsabschlüsse ohne offene Sitzung zuverlässig nachholen | Flow 3 und gemeinsame Aktualisierungs-/Fehlerregeln. |

CAP-1 ist mit FR-13, CAP-2 mit FR-12, CAP-3 mit der roten Abmeldung in Flow 1 und CAP-4 mit Flows 2–5 verbunden. Die 17 Monatsabnahmefälle bleiben als verbindliche Quelle verlinkt; ihre UX-relevanten Folgen einschließlich Nullmonaten, Zielverbrauch nach Löschung, signiertem Fortschritt und vollständiger Bestätigung sind in den Verträgen enthalten.

### Findings

Keine.

## 2. Token completeness — strong

Die YAML-Frontmatter wurde geparst. Alle 13 Farbtokens besitzen konkrete sechsstellige Hexwerte; fünf Typografierollen sowie Rundungs-, Abstands- und Komponententokens sind definiert. Alle 45 unterschiedlichen Tokenreferenzen aus beiden Dateien, einschließlich Referenzen innerhalb der Komponentenobjekte, lösen sich auf. Die vorläufigen visuellen Entscheidungen bleiben als Annahmen gekennzeichnet.

DESIGN.md benennt die tragenden Text-/Aktionskontraste und die Mindestziele 4,5:1 für Text sowie 3:1 für erkennbare Kontrollgrenzen/Fokus. Der Abstand des Fokusrings zur roten beziehungsweise grünen Fläche verhindert eine nur gegen die Buttonfarbe definierte Fokuskennung. Es fehlt kein für die dokumentierten Zustände erforderlicher Farbwert.

### Findings

Keine.

## 3. Component coverage — strong

Alle 16 definierten Bausteine besitzen sowohl einen visuellen Vertrag in DESIGN.md → Components als auch Verhaltensregeln in EXPERIENCE.md → Component Patterns: `main-navigation`, `logout-button`, `auth-form`, `primary-button`, `money-field`, `budget-summary`, `expense-table`, `expense-row`, `automation-panel`, `goal-selection`, `pending-surplus`, `goal-progress-value`, `goal-progress-track`, `goal-progress-fill`, `save-status` und `delete-confirmation`.

Die Tabellen beschreiben konkrete Regeln statt bloßer Namen. Insbesondere unterscheiden sie bestätigte Auswahl von Entwurf, Vormerkung von Fortschritt und tatsächlichen signierten Zahlen von der visuell begrenzten Balkenfüllung. Die Komponentenbezeichnungen sind zwischen Tokens, Tabellen und Flows konsistent.

### Findings

Keine.

## 4. State coverage — strong

| IA-Oberfläche | Geprüfte Zustandsabdeckung |
|---|---|
| Registrierung / Anmeldung | Nicht angemeldet, ungültiger/abgelaufener Link, neutraler Zugangsfehler, Formulareingabe, laufende Aktion, Sitzungsende und geschützter Direktzugriff. |
| Monat | Laden, fehlendes Budget, ausdrücklich gesetztes Nullbudget, negativer Rest, Eingabe-/Speicherfehler, Offline und erneutes Laden nach Mutation oder Monatswechsel. |
| Ausgaben | Laden, leere Historie, Eingabefehler, Bearbeiten/Löschen, zugehörige historische Korrektur, sicherer Fehlschlag, ungewisser Ausgang und Sitzungsende. |
| Sparziele | Laden, keine Ziele, negative/übererfüllte Werte, manuelles Ersetzen trotz blockiertem Nachhollauf, Fehler/Offline, Löschung und erneutes Laden. |
| Monatsautomatik innerhalb Sparziele | Nicht aktiviert, aktiv ohne Ziel, aktiv mit Ziel, offene Vormerkung einschließlich null, Auswahl/Übernahme läuft, Übernahmefehler, Betragsgrenze, Nachholen und gelöschtes ausgewähltes Ziel. |
| Löschbestätigung | Offener Dialog, Folgen, eingeschlossener Fokus, Abbrechen/Escape, laufende Bestätigung, Fehlschlag sowie sinnvolle Fokusposition nach erfolgreicher Entfernung. |

Gemeinsame Tastatur-, Fokus-, Doppelsende-, Kontowechsel- und Spätantwortregeln gelten über die Oberflächen hinweg. Ein bekannter Fehlschlag wird von einem unbekannten Speicherausgang getrennt; dadurch wird kein unbestätigter Rückstand als erfolgreich oder sicher zurückgerollt ausgegeben.

### Findings

Keine.

## 5. Visual reference coverage — strong

Alle Dateien in `mockups/` sind in beiden Spines inline verlinkt und mit ihrer jeweiligen Aussage benannt:

- [key-monat.html](./mockups/key-monat.html): Budgetverwaltung und laufende Monatsübersicht ohne Ausgabenformular; Beispiel 1.000 € − 800 € = 200 €. Das vorausgefüllte Eingabefeld verwendet den zum vorhandenen Parser passenden ungruppierten Wert `1000,00`; die Anzeige bleibt deutsch formatiert.
- [key-ausgaben.html](./mockups/key-ausgaben.html): Erfassungsformular, aktuelle und ältere Einträge, sichtbare Bearbeiten-/Löschen-Aktionen und unveränderter nutzereigener Name „Berlin-Fahrt“.
- [key-sparziele.html](./mockups/key-sparziele.html): Drei unabhängig bezeichnete Beispiele für Aktivierung ohne Ziel, aktive Vormerkung ohne Auswahl und ausgewähltes Ziel mit −30 € / −30 % bei leerem visuellen Balken.

Es gibt keine verwaiste promovierte Referenz. `imports/` und `wireframes/` enthalten keine zusätzlichen Eingaben; `.working/` bewahrt die Arbeitskopien. Zugang und Löschdialoge sind nach der dokumentierten Nutzerwahl ausdrücklich Spine-only. DESIGN.md legt den Vorrang der beiden Spines bei Konflikten fest. Der HTML-Abgleich fand keine externen Abhängigkeiten, Skripte, doppelten IDs, fehlenden Labelreferenzen oder gebrochenen lokalen Navigationslinks.

### Findings

Keine.

## 6. Bloat & overspecification — strong

Visuelle Regeln liegen in DESIGN.md, Verhalten in EXPERIENCE.md. Die zusätzliche Tabelle „Monatswirkungen und Darstellung“ ist gerechtfertigt, weil sie die sichtbaren Folgen der fachlich anspruchsvollen Zuordnungs- und Korrekturregeln bündelt. Komponenten, Zustände, Rechenbeispiele und Flows dienen unterschiedlichen Nachschlageaufgaben; die Wiederaufnahme derselben invarianten Regel erzeugt keinen abweichenden Vertrag. Die vollständige Produkt- oder technische Monatsverarbeitung wird nicht dupliziert, sondern über Quellen verankert. Nicht-Ziele und offene Betriebsfragen erzeugen keine erfundenen Oberflächen.

### Findings

Keine.

## 7. Inheritance discipline — strong

Beide Frontmatter-Blöcke verweisen auf dieselben 14 vorhandenen Quellen. Aktuelles PRD, Änderungsspec/Fachbegleiter und übernommene Architekturpräzisierungen besitzen ausdrücklich Vorrang vor historischen Brief-, Review-, Epic- und Story-Aussagen. Alle 17 aktuellen FR-Namen und der Titel der bestätigten UJ-1 stimmen wortgetreu mit dem PRD überein. CAP-Bezüge werden ausdrücklich auf die Änderungsspezifikation begrenzt.

Glossarbegriffe wie Monatsbudget, Restbudget, tatsächlicher Gesamtfortschritt, Zielauswahl und Vormerkung tragen dieselbe Bedeutung wie im aktuellen PRD. Die zwei geerbten Annahmen zum vollständigen Ausgabenumzug und zur signierten manuellen Gesamteingabe bleiben sichtbar. Keine Komponentenbibliothek ist als Vorgabe benannt; daher werden keine fremden Systemdefaults behauptet.

### Findings

Keine.

## 8. Shape fit — strong

DESIGN.md besitzt alle acht kanonischen Abschnitte in vorgeschriebener Reihenfolge. EXPERIENCE.md enthält Foundation, Information Architecture, Voice and Tone, Component Patterns, State Patterns, Interaction Primitives, Accessibility Floor und Key Flows. Responsive & Platform ist für Smartphone und Rechner vorhanden; Inspiration & Anti-patterns beschreibt die vorhandenen Ausschlüsse ohne erfundene Vorbilder. Die zusätzlichen Abschnitte zu Monatswirkungen sowie Annahmen/Folgearbeit haben einen klaren Vertragszweck. Keine erforderliche Grundsektion fehlt.

### Findings

Keine.

## Mechanical notes

- YAML, konkrete Farbwerte und sämtliche Tokenpfade erfolgreich geprüft.
- 14 Quellen je Spine vorhanden; alle lokalen Dateilinks sowie die vier verwendeten Markdown-Abschnittslinks lösen sich auf.
- 17 aktuelle FR-Namen, fünf vollständige Flows, 16 visuelle/verhaltensbezogene Komponentenpaare und drei in beiden Spines verlinkte Mockups geprüft.
- Die Arbeitsfassung steht zum Prüfzeitpunkt in beiden Dateien auf `draft`, Datum 2026-10-25. Die Statusumstellung nach Abschluss des Gates liegt beim Parent.
- Keine Mermaid-Blöcke vorhanden; daher keine entsprechende Syntaxprüfung erforderlich.
- Befunde nach Schwere: critical **0**, high **0**, medium **0**, low **0**.

## Prüfgrenze

Diese Prüfung bewertet Dokumentverträge und HTML-Quellen statisch. Lokale Datei-URLs wurden im vorherigen Browserversuch durch die Browser-Sicherheitsregel blockiert. Es wurden weder Browseraktionen noch Umgehungsversuche vorgenommen; tatsächliches Layout bei 320 CSS-Pixeln/200 % Text, interaktive Tastaturbedienung, Screenreaderausgabe und spätere Implementierung sind hier nicht praktisch abgenommen.
