---
name: try-not-to-be-poor
description: Visuelle Grundlage für private Ausgaben, Monatsbudget und Sparziele mit Monatsautomatik.
colors:
  surface-base: '#F7F8F6' # [ASSUMPTION]
  surface-raised: '#FFFFFF' # [ASSUMPTION]
  text-primary: '#18211E' # [ASSUMPTION]
  text-secondary: '#46534D' # [ASSUMPTION]
  border: '#68746D' # [ASSUMPTION]
  primary: '#155C4A' # [ASSUMPTION]
  on-primary: '#FFFFFF' # [ASSUMPTION]
  accent: '#805000' # [ASSUMPTION]
  on-accent: '#FFFFFF' # [ASSUMPTION]
  focus-ring: '#1B5C80' # [ASSUMPTION]
  error: '#842D2D' # [ASSUMPTION]
  on-error: '#FFFFFF' # [ASSUMPTION]
  success-surface: '#EAF4EF' # [ASSUMPTION]
typography:
  page-title: # [ASSUMPTION]
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: 28px
    fontWeight: '650'
    lineHeight: '1.2'
  section-title: # [ASSUMPTION]
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.3'
  body: # [ASSUMPTION]
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label: # [ASSUMPTION]
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: 14px
    fontWeight: '550'
    lineHeight: '1.4'
  amount: # [ASSUMPTION]
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: 24px
    fontWeight: '650'
    lineHeight: '1.25'
rounded: # [ASSUMPTION]
  sm: 4px
  md: 8px
  lg: 12px
  full: 9999px
spacing: # [ASSUMPTION]
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 24px
  '6': 32px
  gutter-mobile: 16px
  gutter-wide: 24px
components: # Exakte visuelle Ausprägung weiterhin [ASSUMPTION]
  main-navigation:
    textColor: '{colors.text-primary}'
    activeColor: '{colors.primary}'
    gap: '{spacing.2}'
  logout-button:
    backgroundColor: '{colors.error}'
    textColor: '{colors.on-error}'
    rounded: '{rounded.md}'
    padding: '{spacing.3}'
  automation-panel:
    backgroundColor: '{colors.surface-raised}'
    textColor: '{colors.text-primary}'
    rounded: '{rounded.lg}'
    padding: '{spacing.5}'
  goal-selection:
    backgroundColor: '{colors.surface-raised}'
    textColor: '{colors.text-primary}'
    rounded: '{rounded.sm}'
    padding: '{spacing.3}'
  pending-surplus:
    textColor: '{colors.text-primary}'
    typography: '{typography.amount}'
  goal-progress-value:
    textColor: '{colors.text-primary}'
    typography: '{typography.amount}'
  auth-form:
    backgroundColor: '{colors.surface-raised}'
    textColor: '{colors.text-primary}'
    rounded: '{rounded.lg}'
    padding: '{spacing.5}'
  primary-button:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    rounded: '{rounded.md}'
    padding: '{spacing.3}'
  money-field:
    backgroundColor: '{colors.surface-raised}'
    textColor: '{colors.text-primary}'
    rounded: '{rounded.sm}'
    padding: '{spacing.3}'
  budget-summary:
    backgroundColor: '{colors.surface-raised}'
    textColor: '{colors.text-primary}'
    rounded: '{rounded.lg}'
  expense-table:
    backgroundColor: '{colors.surface-raised}'
    textColor: '{colors.text-primary}'
  expense-row:
    backgroundColor: '{colors.surface-raised}'
    textColor: '{colors.text-primary}'
    rounded: '{rounded.sm}'
    padding: '{spacing.3}'
  goal-progress-track:
    backgroundColor: '{colors.success-surface}'
    rounded: '{rounded.full}'
  goal-progress-fill:
    backgroundColor: '{colors.primary}'
    rounded: '{rounded.full}'
  save-status:
    textColor: '{colors.text-secondary}'
    typography: '{typography.label}'
  delete-confirmation:
    backgroundColor: '{colors.surface-raised}'
    textColor: '{colors.text-primary}'
    rounded: '{rounded.lg}'
    padding: '{spacing.5}'
updated: 2026-10-25
status: final
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

# Try Not to Be Poor — Design Spine

## Brand & Style

[ASSUMPTION] Die bestehende helle, ruhige Oberfläche mit Systemschrift bleibt die vorläufige visuelle Identität. Lesbare Finanzwerte und sachliche Orientierung haben Vorrang vor Dekoration; ein Markenhandbuch ist nicht beschlossen. Die neue Struktur trennt **Monat**, **Ausgaben** und **Sparziele**. Der rote Abmeldebutton ist eine bestätigte Vorgabe; sein exakter Farbwert nutzt vorläufig das vorhandene Rot.

Diese Spine besitzt die visuellen Regeln; [EXPERIENCE.md](./EXPERIENCE.md) besitzt Verhalten und Zustände. Für den Zielzustand gelten das PRD und die Änderungsspezifikation vom 25.10.2026 samt Monatsfachregeln; ältere Quellen und Epics gelten nur für unveränderte Entscheidungen. Der neue Umfang ist noch umzusetzen. Die beiden Spines haben bei Konflikten Vorrang vor visuellen Referenzen.

## Colors

[ASSUMPTION] Die vorhandenen Farbwerte bleiben erhalten. Werte, Vorzeichen und Zustände werden immer zusätzlich mit Text bezeichnet.

| Kombination | Verwendung und Kontrast |
|---|---|
| `{colors.text-primary}` auf `{colors.surface-base}` | Haupttext, etwa 15,5:1. |
| `{colors.text-secondary}` auf `{colors.surface-base}` | Ergänzende Texte, etwa 7,6:1. |
| `{colors.primary}` mit `{colors.on-primary}` | Primäraktionen, etwa 7,9:1. |
| `{colors.accent}` mit `{colors.on-accent}` | Sparsame Hervorhebung, etwa 6,9:1. |
| `{colors.error}` mit `{colors.on-error}` | Fehler und roter Abmeldebutton, etwa 8,8:1. Die Aktionsbeschriftung „Abmelden“ unterscheidet ihn vom Fehlerzustand. |

Text erreicht mindestens 4,5:1, erkennbare Kontrollgrenzen und Fokus mindestens 3:1 zur angrenzenden Fläche. Der Fokus mit `{colors.focus-ring}` erhält einen Abstand zur roten oder grünen Buttonfläche, damit er gegen die helle Umgebung sichtbar bleibt. Hover und gedrückter Zustand erhalten die lesbare rote Abmeldeaktion; Fokus ist auch ohne Hover erkennbar. Ein laufender Vorgang wird zusätzlich beschriftet, nicht allein durch geringere Deckkraft angezeigt.

Eine Vormerkung ist kein Fehler und kein bereits angerechneter Fortschritt. Negativer Fortschritt wird durch Minuszeichen und Zahl sichtbar; die Palette allein vermittelt keine finanzielle Bewertung. [ASSUMPTION] Heller Modus bleibt die erste Ausprägung; ein dunkles Schema ist nicht spezifiziert.

## Typography

[ASSUMPTION] Die vorhandene Systemschrift bleibt ohne externe Font-Abhängigkeit. Fließtext nutzt `{typography.body}`, Titel `{typography.page-title}` und `{typography.section-title}`, Labels `{typography.label}`, prominente Beträge `{typography.amount}`. Tabellarische Ziffern halten Beträge untereinander ausgerichtet. Minuszeichen, Nachkommastellen und Prozentangaben bleiben auch bei langen Werten und vergrößerter Schrift vollständig erkennbar.

## Layout & Spacing

Die Hauptnavigation zeigt in dieser Reihenfolge **Monat**, **Ausgaben**, **Sparziele**. Abmelden bleibt eine eigene, rot erkennbare Aktion in allen angemeldeten Hauptbereichen. Der aktuelle Bereich ist zusätzlich zur Farbe markiert.

| Hauptbereich | Komposition |
|---|---|
| Monat | Budgetverwaltung und Monatsübersicht mit Monatsbudget, laufenden Ausgaben und prominentem Restbudget. Kein Ausgabenformular. |
| Ausgaben | Erfassungsformular und vollständige Historie mit Bearbeiten und Löschen. [ASSUMPTION aus SPEC] Die gesamte Ausgabenverwaltung zieht in diesen Bereich. |
| Sparziele | Ziele mit tatsächlichem Fortschritt; [ASSUMPTION] ein eigener Abschnitt für Aktivierung, Zielauswahl und offene Vormerkung innerhalb dieses Bereichs. |

[ASSUMPTION] Schmale Ansichten bleiben einspaltig. Die Ausgabentabelle wird dort zu linear lesbaren, beschrifteten Einträgen. Breitere Ansichten dürfen Inhalte **innerhalb desselben Bereichs** nebeneinander anordnen; die Bereichstrennung bleibt erhalten. Die Inhaltsbreite bleibt lesbar begrenzt. Abstände folgen `{spacing.1}` bis `{spacing.6}`, Seitenränder `{spacing.gutter-mobile}` und `{spacing.gutter-wide}`. Drei Navigationseinträge, rote Abmeldung, lange Beträge und Formulare müssen bei 320 CSS-Pixel und 200 % Textgröße ohne horizontales Scrollen nutzbar bleiben.

Die [Monatsreferenz](./mockups/key-monat.html) zeigt Übersicht und Budgetverwaltung, die [Ausgabenreferenz](./mockups/key-ausgaben.html) Formular und Historie. Die [Sparzielreferenz](./mockups/key-sparziele.html) zeigt drei unabhängige Zustände: vor Aktivierung, aktive Automatik mit Vormerkung ohne Ziel und ausgewähltes Ziel mit negativem Fortschritt. Alle drei illustrieren die gemeinsame Navigation und rote Abmeldung; es sind statische Ansichten.

## Elevation & Depth

[ASSUMPTION] Weißraum und Tonunterschiede gliedern die Flächen. Trennlinien nutzen `{colors.border}`. Ein dezenter Schatten darf einen Bestätigungsdialog abheben; Schatten oder Bewegung codieren keinen Finanzzustand.

## Shapes

[ASSUMPTION] Eingaben nutzen `{rounded.sm}`, Karten und Dialoge `{rounded.lg}`, Aktionen `{rounded.md}`. `{rounded.full}` bleibt dem Fortschrittsbalken vorbehalten.

## Components

Die genaue visuelle Ausprägung ist [ASSUMPTION], sofern sie nicht ausdrücklich als Produktvorgabe bezeichnet ist. Verhalten steht in [EXPERIENCE.md → Component Patterns](./EXPERIENCE.md#component-patterns). Aktionen sind mindestens 44 CSS-Pixel hoch, Geldfelder mindestens 48 CSS-Pixel; alle wachsen mit der Schrift.

| Baustein | Visueller Vertrag |
|---|---|
| `main-navigation` | `{components.main-navigation}`; drei ausgeschriebene Bereichsnamen, aktueller Bereich zusätzlich markiert, sichtbarer Fokus. Keine vierte Hauptfläche für die Automatik. |
| `logout-button` | `{components.logout-button}`; bestätigte rote Aktion mit lesbarem Text „Abmelden“. Eigene Aktionsfläche mit Abstand zu Speichern und Löschen. Die Beschriftung bleibt in allen Bereichen konsistent. |
| `auth-form` | `{components.auth-form}`; Anmeldung und Registrierung sind durch Titel und Aktion unterscheidbar. |
| `primary-button` | `{components.primary-button}`; Folgeaktionen bleiben zurückhaltend. Speichern, Fortschritt ersetzen und Automatikaktivierung sind klar beschriftet. |
| `money-field` | `{components.money-field}`; sichtbares Label, EUR-Hinweis und feldnaher Fehler. Vorzeichen darf beim Fortschritt nicht abgeschnitten werden; andere Betragsfelder erhalten keine negative Eingabesemantik. |
| `budget-summary` | `{components.budget-summary}`; benannte Werte statt Tachometer. Negatives Restbudget zeigt den tatsächlichen Betrag und eine Überschreitungsbezeichnung. |
| `expense-table` | `{components.expense-table}`; Name, Erfassungsdatum und Betrag mit klaren Spaltenüberschriften. |
| `expense-row` | `{components.expense-row}` mit Trennlinie `{colors.border}`; auf schmalen Ansichten dieselben beschrifteten Werte und sichtbare Bearbeiten-/Löschen-Aktionen. |
| `automation-panel` | `{components.automation-panel}`; Status, Startmonat, Zielauswahl und Vormerkung sind als zusammengehöriger Abschnitt erkennbar. Keine Überweisungs- oder Bankkontosymbolik. |
| `goal-selection` | `{components.goal-selection}`; sichtbares Label „Ziel für Monatsüberschüsse“, benannte aktuelle Auswahl beziehungsweise „Kein Ziel ausgewählt“, erklärender Text und explizite Speicheraktion. |
| `pending-surplus` | `{components.pending-surplus}`; Betrag mit Bezeichnung „Vorgemerkt“ und Hinweis, dass er noch keinem Ziel angerechnet ist. Text zur vollständigen Übernahme steht direkt bei der Zielauswahl. |
| `goal-progress-value` | `{components.goal-progress-value}`; tatsächlicher signierter Betrag neben Zielbetrag und tatsächlichem Prozentwert. Keine visuelle Kürzung auf null oder 100 %. |
| `goal-progress-track` | `{components.goal-progress-track}`; ruhiger Hintergrund für die visuelle Skala 0–100 %. |
| `goal-progress-fill` | `{components.goal-progress-fill}`; Füllung endet bei 0 beziehungsweise 100 %, ohne die begleitenden Zahlen zu verändern. |
| `save-status` | `{components.save-status}`; textlich unterscheidbare Zustände für Speichern, bestätigten Erfolg und Fehler. Keine Erfolgsgeste vor bestätigter Speicherung. |
| `delete-confirmation` | `{components.delete-confirmation}`; benennt Objekt und Folgen. Abbrechen und Löschen sind klar getrennt; bei Ziellöschung bleiben Fortschrittsverlust und gegebenenfalls folgende Vormerkung lesbar. |

## Do's and Don'ts

| Do | Don't |
|---|---|
| Drei klar bezeichnete Hauptbereiche und konsistente rote Abmeldung zeigen. | Ausgabenerfassung wieder in Monat einbetten oder Abmelden nur über Farbe kennzeichnen. |
| Vorgemerkte Summe von bereits angerechnetem Fortschritt unterscheiden. | Vormerkung als Bankguthaben oder schon gesparten Zielbetrag darstellen. |
| Tatsächlichen Fortschritt mit Vorzeichen und Prozentwert lesen lassen. | Negativen Fortschritt auf null kürzen oder Übererfüllung als 100 % ausgeben. |
| Sachliche deutsche Texte mit verständlichen Datumsangaben verwenden. | Systemseitige Zeitzonenerläuterungen in Labels, Tooltips oder zugänglichen Hilfstexten ergänzen. |
| Lange Werte, Fehler und Aktionen auch mobil vollständig erreichbar halten. | Kernaufgaben von Hover, horizontalem Scrollen oder Animation abhängig machen. |
| Manuelle Angaben und rechnerische Anrechnung benennen. | Verifizierte Kontostände, Geldübertragung oder garantierte Ersparnisse suggerieren. |
