---
name: try-not-to-be-poor
description: Visuelle Grundlage für eine private, manuelle Ausgaben- und Sparzielübersicht.
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
components: # [ASSUMPTION]
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
updated: 2026-10-19
status: final
sources:
  - '{planning_artifacts}/briefs/brief-try-not-to-be-poor-2026-10-18/brief.md'
  - '{planning_artifacts}/briefs/brief-try-not-to-be-poor-2026-10-18/addendum.md'
  - '{planning_artifacts}/prds/prd-try-not-to-be-poor-2026-10-19/prd.md'
  - '{planning_artifacts}/prds/prd-try-not-to-be-poor-2026-10-19/reconcile-product-brief.md'
  - '{planning_artifacts}/prds/prd-try-not-to-be-poor-2026-10-19/reconcile-data-isolation-addendum.md'
  - '{planning_artifacts}/prds/prd-try-not-to-be-poor-2026-10-19/review-privacy-boundary.md'
  - '{planning_artifacts}/prds/prd-try-not-to-be-poor-2026-10-19/review-rubric.md'
---

# Try Not to Be Poor — Design Spine

## Brand & Style

[ASSUMPTION] Die Planungsquellen legen keine visuelle Identität fest. Die folgenden Tokens und Regeln sind daher ein provisorischer, direkt umsetzbarer Entwurf: eine ruhige, sachliche Oberfläche für private Finanzübersicht, mit klarer Typografie und ohne wertende oder alarmistische Inszenierung. Diese vorläufigen Tokens und Regeln bilden kein festgelegtes Markenhandbuch.

## Colors

[ASSUMPTION] Die helle, zurückhaltende Palette nutzt eine dunkle Primärfarbe für Aktionen und eine warme Akzentfarbe für sparsame Hervorhebungen. Finanzzustände werden immer auch mit Text und Vorzeichen bezeichnet, nie nur durch Farbe.

- Fließtext `{colors.text-primary}` auf `{colors.surface-base}` hat etwa 15,5:1 Kontrast; `{colors.text-secondary}` auf derselben Fläche etwa 7,6:1.
- Primäraktionen verwenden `{colors.primary}` mit `{colors.on-primary}` (etwa 7,9:1). Akzentaktionen verwenden `{colors.accent}` mit `{colors.on-accent}` (etwa 6,9:1).
- `{colors.error}` mit `{colors.on-error}` (etwa 8,8:1) kennzeichnet Fehler. Ein Fehler, eine Budgetüberschreitung oder ein Erfolg erhält stets eine Textbezeichnung.
- [ASSUMPTION] Heller Modus ist die erste Ausprägung. Ein dunkles Farbschema ist nicht spezifiziert.

## Typography

[ASSUMPTION] Die Systemschrift ohne externe Font-Abhängigkeit sorgt für robuste Darstellung im Browser. Fließtext nutzt `{typography.body}`; Titel, Feldbeschriftungen und prominente Eurobeträge nutzen `{typography.page-title}`, `{typography.label}` und `{typography.amount}`. Beträge sollen tabellarische Ziffern verwenden, damit Werte in Listen ruhig untereinander stehen. Keine Kleinbuchstaben- oder Versalien-Dekoration bei Finanzwerten.

## Layout & Spacing

[ASSUMPTION] Auf schmalen Ansichten stehen Budget, Eingabe und Ausgabenliste in einer Spalte; auf breiteren Ansichten dürfen Budgetzusammenfassung und Sparziele neben der Liste stehen. Die Inhaltsbreite bleibt lesbar begrenzt, die Liste wird auf Mobilgeräten zu beschrifteten, gestapelten Einträgen statt zu horizontalem Scrollen. Abstände folgen `{spacing.1}` bis `{spacing.6}`; Seitenränder verwenden `{spacing.gutter-mobile}` beziehungsweise `{spacing.gutter-wide}`.

## Elevation & Depth

[ASSUMPTION] Flächen werden primär durch Weißraum und leichte Tonunterschiede gegliedert. Dezente Schatten dürfen eine Dialogfläche vom Hintergrund abheben; sie bilden keine zusätzliche Status- oder Datenhierarchie. Trennlinien verwenden `{colors.border}`.

## Shapes

[ASSUMPTION] Eingaben erhalten `{rounded.sm}`, Karten `{rounded.lg}` und Standardaktionen `{rounded.md}`. Vollständig runde Formen sind der schmale Fortschrittsbalken vorbehalten. Pillen und dekorative Formen sollen nicht um Finanzdaten konkurrieren.

## Components

Alle folgenden visuellen Details sind [ASSUMPTION]; Verhaltensregeln stehen in [EXPERIENCE.md](./EXPERIENCE.md).

- **`primary-button`:** `{components.primary-button}`; Folgeaktionen erhalten eine zurückhaltende Umrandung oder Textdarstellung. [ASSUMPTION] Die Zielhöhe beträgt mindestens 44 CSS-Pixel und wächst bei vergrößerter Schrift mit.
- **`auth-form`:** `{components.auth-form}` hält Registrierung und Anmeldung visuell verwandt; die unterschiedlichen Aufgaben sind über klare Beschriftungen erkennbar.
- **`money-field`:** `{components.money-field}` mit sichtbarer Bezeichnung und Euro-Hinweis; Fehlertext steht direkt beim Feld. [ASSUMPTION] Die nutzbare Höhe beträgt mindestens 48 CSS-Pixel und wächst bei vergrößerter Schrift mit.
- **`budget-summary`:** `{components.budget-summary}` zeigt Budget, Ausgaben und Restbudget mit klar benannten Werten. Der Restbetrag ist prominent, nicht als dekorativer Tachometer.
- **`expense-table` / `expense-row`:** `{components.expense-table}` ordnet Name, Erfassungsdatum und Betrag; Zeilen verwenden `{components.expense-row}` und Trennlinien `{colors.border}`. Auf schmalen Ansichten bleiben dieselben Werte beschriftet und linear lesbar.
- **`goal-progress-track` und `goal-progress-fill`:** Die Komposition wird von Betragstexten begleitet, damit der Fortschritt auch ohne Farbe erkennbar bleibt.
- **`save-status`:** `{components.save-status}` vermittelt Speichern und Erfolg mit Text.
- **`delete-confirmation`:** `{components.delete-confirmation}` kennzeichnet die Folge des Löschens und trennt Bestätigen klar vom Abbrechen.
- Fokus- und Fehlerzustände verwenden `{colors.focus-ring}` beziehungsweise `{colors.error}` mit erklärendem Text.

## Do's and Don'ts

| Do | Don't |
|---|---|
| [ASSUMPTION] Lesbare Beträge und klare Beschriftungen vor dekorativen Kennzahlen priorisieren. | [ASSUMPTION] Ausgaben als „schlecht“ markieren oder Nutzer:innen beschämen. |
| [ASSUMPTION] Fehler, Fortschritt und Budgetüberschreitung zusätzlich sprachlich kennzeichnen. | [ASSUMPTION] Bedeutung ausschließlich über Farbe, Animation oder Symbol vermitteln. |
| [ASSUMPTION] Die Tabellenstruktur auf schmalen Ansichten in eine lineare, beschriftete Darstellung überführen. | [ASSUMPTION] Auf Mobilgeräten horizontales Scrollen für Kernaufgaben voraussetzen. |
| Die Daten als manuell erfasste persönliche Angaben darstellen. | Bankimport, verifizierte Kontostände oder garantierte Ersparnisse suggerieren. |
