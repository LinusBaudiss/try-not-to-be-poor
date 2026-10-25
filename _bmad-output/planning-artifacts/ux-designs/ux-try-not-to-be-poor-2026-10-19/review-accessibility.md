# UX-Prüfung — Zugänglichkeit

Stand: 2026-10-25. Unabhängige Prüfung im von Linus gewählten Reviewer Gate.

## Overall verdict

Der UX-Vertrag deckt die für diese Änderung tragenden Anforderungen an Zugänglichkeit nachvollziehbar ab. Die statischen Referenzen zeigen keine bestätigte Abweichung: Vorzeichen und tatsächliche Prozentwerte bleiben lesbar, Vormerkungen sind bezeichnet, Navigation und Eingaben besitzen passende Semantik und der rote Abmeldebutton hat ausreichenden rechnerischen Kontrast. **Keine bestätigten Befunde.**

Dies ist eine Dokument- und HTML-Quellprüfung, kein Nachweis praktischer WCAG-Konformität oder erfolgreich ausgeführter Browserabnahmen.

## Geprüfte Bereiche

| Bereich | Ergebnis und Nachweis |
| --- | --- |
| Beträge, Prozentwerte und Balken | EXPERIENCE.md, `goal-progress-value`, `goal-progress-fill`, Accessibility Floor und die Darstellungstabelle unterscheiden tatsächlichen Wert und visuelle Begrenzung. In `mockups/key-sparziele.html` erscheinen −30,00 € und −30 % als Text; der leere Balken ist `aria-hidden="true"`. Dadurch entsteht kein widersprüchlich als tatsächlicher Fortschritt angekündigtes 0 %. Übererfüllung ist im Vertrag mit 150 % und Balkenende 100 % enthalten. |
| Vormerkung und Zielauswahl | Die Zustände vor Aktivierung, aktiv ohne Auswahl und aktiv mit Ziel sind sprachlich unterscheidbar. `pending-target` und `active-target` besitzen sichtbare Labels und auflösbare Hilfstextbezüge. Der ungewählte Zustand ist ausdrücklich bezeichnet; beim ersten Auswählen erklärt der Hilfstext die vollständige Übernahme. Vormerkung und bereits angerechneter Fortschritt sind getrennt benannt. |
| Navigation und Kontrollsemantik | Alle Referenzen verwenden native Links, Buttons, Inputs und Selects. Der aktuelle Bereich trägt `aria-current="page"` und wird zusätzlich zu Farbe unterstrichen. Dokumente haben `lang="de"`, einen Titel und Überschriften. Alle sechs Formular-Controls in den drei Referenzen haben eindeutige IDs und sichtbare zugehörige Labels; es gibt keine fehlenden `for`-/`aria-describedby`-/`aria-labelledby`-Ziele. Die drei Sparzielansichten sind ausdrücklich unabhängige Beispiele. |
| Fokus, Dialoge und Status | DESIGN.md definiert sichtbaren Fokus mit Abstand zur Buttonfläche. EXPERIENCE.md legt Fokusführung beim Bereichswechsel, eingeschlossenen Dialogfokus, Escape/Abbrechen und Rückgabe an einen sinnvollen verbleibenden Auslöser fest. Status-/Fehlerankündigungen und programmatische Fehlerzuordnung sind Teil des Vertrags. Die Referenz-CSS enthält `:focus-visible`; die Mockups führen keine dynamischen Mutationen oder Dialoge aus und können deren Laufzeitverhalten daher nicht belegen. |
| Negative mobile Eingabe | `money-field` verlangt ausdrücklich eine Eingabemöglichkeit für Minus. Die negative Referenzeingabe ist `type="text"`, `inputmode="text"` und enthält `-30,00`; sie erzwingt keine ausschließlich positive Dezimaltastatur. Andere Betragsfelder behalten ihre nichtnegative beziehungsweise positive Fachsemantik. |
| Zielgrößen, Reflow und Vergrößerung | Die Spines erhalten 200-%-Text, Reflow bei 320 CSS-Pixeln, die vier Prüfviewports, mindestens 44 CSS-Pixel hohe Aktionen und 48 CSS-Pixel hohe Geldfelder. Die statische CSS verwendet entsprechende Mindesthöhen, flexible Spalten, `min-width:0` und Umbruchregeln. Daraus wird kein tatsächlich bestandener Layout- oder Touchtest abgeleitet. |
| Sitzung und Fehler | Sitzungsschluss entfernt persönliche Daten, Vormerkungen und Entwürfe; verspätete Antworten bleiben unwirksam. Unbestätigte und sicher fehlgeschlagene Vorgänge erhalten verschiedene Texte. Manuelle Korrektur bleibt bei blockierter Automatik erreichbar. Kein Zustand wird ausschließlich über Farbe vermittelt. |
| Systemtexte | Die sichtbaren Referenztexte und zugänglichen Namen enthalten keine systemseitige Zeitzonenerläuterung. Der eigene Eintragsname „Berlin-Fahrt“ und seine Aktionsnamen bleiben erhalten, wie CAP-1/FR-13 verlangen. |

## Rechnerische Kontraste

Berechnet aus den aktuellen sRGB-Hexwerten in DESIGN.md. Die Ergebnisse bestätigen die angegebenen Mindestwerte für die im Entwurf verwendeten Kombinationen; sie ersetzen keine Prüfung gerenderter Zustände.

| Kombination | Verhältnis |
| --- | --- |
| Haupttext auf Basis / Weiß | 15,46:1 / 16,47:1 |
| Sekundärtext auf Basis / Weiß | 7,57:1 / 8,06:1 |
| Weiß auf Primärgrün | 7,89:1 |
| Weiß auf Abmelderot | 8,77:1 |
| Primärgrün auf Weiß | 7,89:1 |
| Fokusring auf Basis / Weiß | 6,82:1 / 7,27:1 |
| Kontrollgrenze auf Weiß | 4,88:1 |
| Fortschrittsfüllung auf Balkenhintergrund | 7,02:1 |

## Findings

- Critical: 0
- High: 0
- Medium: 0
- Low: 0

Keine Abhilfe an Spines oder Mockups erforderlich.

## Prüfgrenze

Es wurden ausschließlich DESIGN.md, EXPERIENCE.md, die drei HTML-Referenzen und die betreffenden Produktanforderungen FR-11/FR-13 geprüft. Keine Browseraktion und kein Umgehungsversuch der bereits gemeldeten Dateiadressensperre wurden ausgeführt. Praktische Tastatur-/Screenreaderbedienung, Fokusverhalten bei Mutation, native mobile Tastaturen, gerenderte 200-%-Textvergrößerung und Reflow auf den vier Viewports bleiben bei der Implementierung tatsächlich zu prüfen. Die statischen Schaltflächen sind ausdrücklich Illustrationen und speichern keine Daten; fehlende JavaScript-Interaktion wird deshalb nicht als Produktfehler gewertet.
