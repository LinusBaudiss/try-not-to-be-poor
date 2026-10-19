---
name: try-not-to-be-poor
status: final
updated: 2026-10-19
sources:
  - '{planning_artifacts}/briefs/brief-try-not-to-be-poor-2026-10-18/brief.md'
  - '{planning_artifacts}/briefs/brief-try-not-to-be-poor-2026-10-18/addendum.md'
  - '{planning_artifacts}/prds/prd-try-not-to-be-poor-2026-10-19/prd.md'
  - '{planning_artifacts}/prds/prd-try-not-to-be-poor-2026-10-19/reconcile-product-brief.md'
  - '{planning_artifacts}/prds/prd-try-not-to-be-poor-2026-10-19/reconcile-data-isolation-addendum.md'
  - '{planning_artifacts}/prds/prd-try-not-to-be-poor-2026-10-19/review-privacy-boundary.md'
  - '{planning_artifacts}/prds/prd-try-not-to-be-poor-2026-10-19/review-rubric.md'
---

# Try Not to Be Poor — Experience Spine

## Foundation

Responsive Browser-Erfahrung mit Mobile-first-Priorität. [ASSUMPTION] „Mobile“ bedeutet zunächst Nutzung der responsiven Website im mobilen Browser; eine native App ist nicht bestätigt. Ein UI-System ist nicht festgelegt. [DESIGN.md](./DESIGN.md) definiert die visuelle Identität; diese Spine legt das Verhalten fest.

Das Produkt unterstützt Linus, Familie und Freunde dabei, persönliche Ausgaben manuell festzuhalten, das Monatsbudget zu überblicken und persönliche Sparziele zu pflegen. Alle Werte sind nutzerseitig eingegebene Angaben, keine verifizierten Kontostände. Mehr Geld am Monatsende ist ein gewünschtes, aber nicht garantiertes Ergebnis. Bei manueller Erfassung zählt auch der Erfassungsaufwand: [SM-C1 — Erfassungsaufwand](../../prds/prd-try-not-to-be-poor-2026-10-19/prd.md#L216).

**Quellenrangfolge:** Das aktuelle PRD mit `status: final` ist maßgeblich für v1. Der Text FR-5 sagt ausdrücklich, dass die Ausgabenliste alle bisher erfassten Ausgaben einschließlich früherer Monate und das Erfassungsdatum umfasst ([PRD, FR-5](../../prds/prd-try-not-to-be-poor-2026-10-19/prd.md#L120)). Damit ist die gegenteilige, offenbar veraltete Unklarheit im [Review-Rubric](../../prds/prd-try-not-to-be-poor-2026-10-19/review-rubric.md#L61) für diese UX-Ausarbeitung erledigt. Ebenso ist der Statushinweis „draft“ im [Reconcile-Produktbrief](../../prds/prd-try-not-to-be-poor-2026-10-19/reconcile-product-brief.md#L5) gegenüber der aktuellen PRD-Frontmatter überholt.

## Information Architecture

| Oberfläche | Erreicht über | Zweck |
|---|---|---|
| Registrierung und Anmeldung | Registrierungslink oder erneuter Besuch | Konto anlegen oder anmelden. Jede Person mit dem Link darf registrieren; die Reichweite hängt davon ab, mit wem Linus ihn teilt. |
| Monatsübersicht | Nach Anmeldung; [ASSUMPTION] Hauptnavigation „Monat“ | Monatsbudget und Restbudget, manuelle Erfassung sowie die vollständige eigene Ausgabenliste mit Name, Betrag und Erfassungsdatum. Bearbeiten und Löschen eigener Ausgaben. |
| Sparziele | [ASSUMPTION] Hauptnavigation „Sparziele“ | Eigene Ziele mit Name, Zielbetrag, optionalem Datum und manuell gepflegtem Gesamtfortschritt ansehen und ergänzen. |

[ASSUMPTION] Die Hauptnavigation hat die zwei Einträge „Monat“ und „Sparziele“; Anmeldung und Registrierung bleiben getrennte Zugangszustände. Nicht definierte Kontoverwaltung, Export oder Einstellungen werden nicht als fertige v1-Oberflächen angenommen.

### Funktionale Verträge

Die FR-Namen bleiben identisch zum PRD; Zahlen und Währungen verwenden die dort festgelegte Europe/Berlin-Zeitbasis und Euro-Währung.

| Anforderung | UX-Vertrag |
|---|---|
| **FR-1: Nutzerkonto über den Registrierungslink anlegen** | Linkinhaber:innen können registrieren und sich danach anmelden. Bei späterem Besuch führt der Zugang zur Anmeldung. Linkablauf und Widerruf bleiben offen. |
| **FR-2: Eigene Finanzdaten ansehen** | Angemeldete Person sieht nur eigene Ausgaben, eigenes Monatsbudget und eigene Sparziele. |
| **FR-3: Daten anderer Personen schützen** | Kein Lesen oder Ändern fremder Datensätze; keine gemeinsame Ansicht. Wenn eine Ressource fremd oder nicht verfügbar ist, werden weder ihre Daten noch ihre Existenz offengelegt. |
| **FR-4: Ausgabe manuell erfassen** | Name und Betrag in Euro manuell erfassen. Das System setzt das Erfassungsdatum automatisch auf das aktuelle Datum in der Zeitzone Europe/Berlin; es ist nicht frei wählbar. |
| **FR-5: Alle bisher erfassten Ausgaben tabellarisch ansehen** | Eigene Ausgaben aller Monate zeigen, einschließlich Name, Betrag und Erfassungsdatum. Auf schmalen Ansichten bleibt die gleiche Information linear lesbar. |
| **FR-6: Eigene Ausgabe bearbeiten oder löschen** | Name und Betrag bearbeiten oder eigenen Eintrag löschen; danach Restbudget mit den verbleibenden Monatsausgaben neu berechnen. [ASSUMPTION] Vor dem Löschen wird eine bestätigende Aktion verlangt. |
| **FR-7: Monatsbudget festlegen** | Eigenes fortlaufendes Monatsbudget in Euro festlegen oder ändern. [ASSUMPTION] Eine Änderung gilt sofort im laufenden und in den folgenden Monaten, wie im PRD markiert. |
| **FR-8: Restbudget anzeigen** | `Restbudget = Monatsbudget − Summe der eigenen Ausgaben im laufenden Kalendermonat nach Europe/Berlin`. Einnahmen werden nicht erfasst und nicht angerechnet. Nach Erfassung, Änderung oder Löschung aktualisieren. Negative Werte sind laut PRD-Annahme möglich. [ASSUMPTION] Vorläufig als signierter negativer Betrag mit ausdrücklicher Überschreitungsbezeichnung darstellen; die endgültige Darstellung bleibt zu bestätigen. |
| **FR-9: Sparziel festlegen** | Eigenes Ziel mit selbst gewähltem Namen, Zielbetrag in Euro und optionalem Zieldatum anlegen. |
| **FR-10: Fortschritt eines Sparziels aktualisieren und ansehen** | Aktuellen erreichten Gesamtbetrag manuell pflegen und im Verhältnis zum Zielbetrag anzeigen. Neue Eingabe ersetzt den bisherigen Gesamtbetrag; einzelne Sparbeiträge oder Verlauf werden nicht erfasst. |
| **FR-11: Website responsiv nutzen** | Kernfunktionen auf Smartphone und Rechner bedienbar. Die unten genannten Prüfbreiten und Kernaufgaben sind vorläufige UX-Annahmen. |

## Voice and Tone

[ASSUMPTION] Finanztexte sind sachlich, kurz und nicht wertend. Sie benennen Betrag, Zeitraum und Konsequenz klar; sie erteilen keine Finanzberatung und versprechen keine Ersparnis. „Noch keine Ausgaben erfasst“ statt einer Bewertung wie „Du gibst zu viel aus“.

[ASSUMPTION] Deutsche Beschriftungen und deutsches Euro-Format (`1.234,56 €`) bilden die erste Ausprägung. Der Produktname ist bewusst provokativ, legt aber allein keine provokative Mikrocopy fest.

| Do | Don't |
|---|---|
| „Restbudget: 126,40 €“ | „Du hast diesen Monat gut/schlecht gewirtschaftet.“ |
| „Noch keine Sparziele“ | „Du musst mehr sparen.“ |
| „12,00 € über dem Monatsbudget“ bei negativer Rechnung [ASSUMPTION] | Sparerfolg oder Kontostand als garantiert darstellen. |
| „Änderungen noch nicht gespeichert“ bei einem fehlgeschlagenen Speichern [ASSUMPTION] | Einen Erfolg anzeigen, bevor die Speicherung bestätigt wurde. |

## Component Patterns

Verhalten hier; visuelle Ausprägung in [DESIGN.md → Components](./DESIGN.md#components). Visuelle Tokens werden über `{colors.text-primary}`, `{colors.primary}`, `{colors.error}`, `{components.money-field}` und `{typography.body}` referenziert.

| Baustein | Verhalten |
|---|---|
| `auth-form` | Registrierung über den Registrierungslink und Anmeldung bleiben eindeutig unterscheidbar. Die konkrete Authentifizierungsmethode kommt aus der Umsetzungsvorgabe. [ASSUMPTION] Fehlermeldungen verraten keine fremden Konten. |
| `primary-button` | Führt die beschriftete Primäraktion des aktuellen Bereichs aus. [ASSUMPTION] Während des Speicherns verhindert der Button versehentliche Doppelsendungen und meldet den Zustand. |
| `money-field` | Sichtbar beschriftete Felder für Ausgabe, Budget und Sparziel; Euro-Währung ist kenntlich. [ASSUMPTION] Eingaben bleiben nach Fehlern erhalten. Wertebereich und Genauigkeit werden nicht durch UX erfunden. |
| `budget-summary` | Benennt Monatsbudget, Ausgaben und Restbudget klar. Eine Budgetänderung wird erst nach bestätigtem Speichern in der Übersicht wirksam dargestellt. |
| `expense-table` / `expense-row` | Zeigt eigene Ausgaben aller Monate mit Name, Betrag und Erfassungsdatum. Auf breiten Ansichten ist die Liste eine semantische Tabelle; mobil stehen dieselben Angaben linear. Bearbeiten und Löschen haben beschriftete Aktionen, die nicht von Hover oder Gesten abhängen. |
| `goal-progress-track` / `goal-progress-fill` | Zeigt den manuell gepflegten Gesamtbetrag neben dem Zielbetrag. Neue Eingabe ersetzt den vorherigen Gesamtbetrag; einzelne Beiträge und Verlauf werden nicht suggeriert. |
| `save-status` | Gibt Bearbeiten, Speichern und bestätigten Erfolg textlich zurück. [ASSUMPTION] Ein Statuswechsel wird assistiven Technologien angekündigt. |
| `delete-confirmation` | [ASSUMPTION] Vor dem Löschen ist die Folge eindeutig benannt; Dialogfokus bleibt eingeschlossen und kehrt nach Abschluss zum Auslöser zurück. |

## State Patterns

Wo das PRD keinen Zustand beschreibt, ist das Verhalten ausdrücklich als [ASSUMPTION] markiert.

| Zustand | Verhalten |
|---|---|
| Nicht angemeldet | Registrierungslink bietet Registrierung, bestehende Konten melden sich an. Fremde oder gesperrte Bereiche zeigen keine Finanzdaten. |
| Anmeldung fehlgeschlagen | [ASSUMPTION] Neutrale Fehlermeldung ohne Bestätigung, ob ein Konto existiert; erneuten Versuch oder verfügbare Registrierungsoption anbieten. |
| Kein Monatsbudget | [ASSUMPTION] Restbudget nicht als `0 €` ausgeben, sondern zur Festlegung eines Monatsbudgets auffordern. |
| Noch keine Ausgaben | [ASSUMPTION] Leere Liste mit kurzer Erklärung und direkter Aktion „Ausgabe erfassen“. |
| Noch keine Sparziele | [ASSUMPTION] Leerer Bereich mit „Sparziel anlegen“. |
| Laden | [ASSUMPTION] Inhaltsskelett in der erwarteten Form; persönliche Werte erst anzeigen, wenn sie für das angemeldete Konto geladen sind. |
| Eingabefehler | [ASSUMPTION] Feldnaher verständlicher Fehler, programmatisch dem Feld zugeordnet; Fokus zur Zusammenfassung oder zum ersten fehlerhaften Feld. Eingaben bleiben erhalten. Für nicht vereinbarte Wertebereiche wird keine Grenzzahl behauptet. |
| Speichern fehlgeschlagen | [ASSUMPTION] Kein Erfolgszustand; Entwurf im offenen Formular belassen, Ursache knapp benennen und erneutes Speichern anbieten. |
| Offline / Verbindung verloren | [ASSUMPTION] Keine neue Finanzänderung als gespeichert ausgeben und keine lokale Offline-Synchronisierung versprechen. Formular im offenen Tab erhalten, Speichern bis zur Verbindung blockieren und erneuten Versuch anbieten. |
| Sitzung endet | [ASSUMPTION] Persönliche Ansicht schließen und erneute Anmeldung verlangen; geschützte Werte nicht in einer Fehleransicht offenlegen. |
| Restbudget negativ | Negative Rechnung nicht verbergen. [ASSUMPTION] Vorläufig Betrag mit Minuszeichen und Text zur Überschreitung zeigen; endgültige Darstellung ist offen. |
| Registrierungslink ungültig / Zugriff nicht erlaubt | [ASSUMPTION] Neutrale Erklärung und nächste verfügbare Aktion zeigen, ohne fremde Konten oder Datensätze offenzulegen. |

## Interaction Primitives

- Alle Kernaufgaben funktionieren per Tastatur, Touch und Screenreader; Hover ist nie der einzige Weg zu einer Aktion. [ASSUMPTION]
- Formularfelder besitzen sichtbare Labels, sinnvolle Eingabetypen und mobile Tastaturen für Beträge. [ASSUMPTION]
- Nach Speichern wird der Status als Text angekündigt; dynamische Änderungen des Restbudgets sind für assistive Technik erkennbar. [ASSUMPTION]
- Bearbeiten öffnet den vorhandenen Eintrag mit Name und Betrag. Datum bleibt systemseitig gesetzt. Löschen folgt der bestätigenden Aktion in Component Patterns. [ASSUMPTION]
- Keine versteckte Wischgeste als einzige Bearbeitungs- oder Löschmöglichkeit. [ASSUMPTION]
- Budget- und Zieländerungen wirken nur im eigenen Konto. Die technische Durchsetzung bleibt Architekturaufgabe; ein Kontowechsel darf den alten Datenbestand nicht anzeigen.

## Accessibility Floor

[ASSUMPTION] Als prüfbarer Ausgangsstandard gilt **WCAG 2.2 AA** für die responsive Weboberfläche ([W3C, WCAG 2.2](https://www.w3.org/TR/WCAG22/)). Das ist ein Produktziel für Entwurf und Prüfung, keine Behauptung einer rechtlichen Konformitätszertifizierung. Visuelle Kontrastpaare stehen in [DESIGN.md → Colors](./DESIGN.md#colors).

- Semantische Überschriften, Formulare, Links, Buttons und Tabelle; Beschriftungen und Fehlermeldungen sind programmatisch zugeordnet. [ASSUMPTION]
- Vollständige Tastaturbedienung mit sichtbarem, nicht verdecktem Fokus und logischer Lesereihenfolge. Dialoge verwalten Fokus und geben ihn an den Auslöser zurück. [ASSUMPTION]
- Status- und Fehlermeldungen werden für assistive Technologien als Meldungen angekündigt; Farbe ist nie alleiniger Bedeutungsträger. [ASSUMPTION]
- Text lässt sich auf 200 % vergrößern und die Oberfläche bei 320 CSS-Pixel Breite ohne horizontales Scrollen für Kernaufgaben nutzen. [ASSUMPTION]
- [ASSUMPTION] Zusätzliches UX-Ziel: Touch-Ziele sind mindestens 44 × 44 CSS-Pixel groß; Systemschrift und vergrößerte Textdarstellung dürfen keine Finanzwerte oder Aktionen abschneiden.
- Bewegungen sind entbehrlich; `prefers-reduced-motion` wird berücksichtigt. [ASSUMPTION]
- Eingabefehler nennen das betroffene Feld und einen hilfreichen nächsten Schritt. Vor Änderungen oder Löschungen persönlicher Finanzdaten ist die Aktion eindeutig. [ASSUMPTION]

## Inspiration & Anti-patterns

Die bestätigten Planungsquellen nennen keine Vorbildprodukte. Als v1-Ausschlüsse gelten geteilte Finanzansichten, Einnahmen, automatische Bankimporte, Kategorien, wiederkehrende Ausgaben und betriebliche Finanzen. Diese Funktionen werden weder in der Navigation noch in leeren Zuständen vorgeschlagen.

## Responsive & Platform

[ASSUMPTION] Ziel ist eine responsive Browseroberfläche auf Smartphone und Rechner. Die folgenden Viewports sind konkrete Prüfanker aus FR-11, keine bereits bestätigten Geräteanforderungen. Ein nativer iOS- oder Android-Client ist nicht festgelegt.

| Viewport (CSS Pixel) | Zu prüfende Aufgaben |
|---|---|
| 320 × 568 | Anmelden, eine Ausgabe erfassen, Restbudget lesen, Name/Betrag/Datum eines Listeneintrags erkennen und bearbeiten. Keine horizontale Kernansicht. |
| 390 × 844 | Eine Ausgabe hinzufügen und löschen; Ziel erstellen und Fortschritt ändern; mobile Navigation und Bildschirmtastatur prüfen. |
| 768 × 1024 | Monatsübersicht, vollständige historische Ausgabenliste und Sparziele ohne abgeschnittene Inhalte bedienen. |
| 1280 × 800 | UJ-1 von Anmeldung bis Budgetprüfung; Sparziel anlegen und prüfen; Datenabstände, Tabelle und Tastaturfluss prüfen. |

[ASSUMPTION] Unter 768 px bleibt jede Oberfläche einspaltig mit kompakter Navigation; ab 768 px kann die Hauptnavigation nebeneinander stehen. Ab breiteren Viewports darf die Budgetzusammenfassung neben der Liste erscheinen, sofern die Reihenfolge für Tastatur und Screenreader gleich verständlich bleibt. Alle Prüfungen schließen Tastaturbedienung und Vergrößerung ein.

## Key Flows

### Flow 1 — UJ-1. Linus erfasst Ausgaben und prüft sein Monatsbudget.

1. Linus öffnet den Registrierungslink. Beim ersten Besuch legt er ein Konto an; bei späterer Nutzung meldet er sich direkt an.
2. Nach der Anmeldung landet er auf der Monatsübersicht. [ASSUMPTION] Die Übersicht ist die Startoberfläche.
3. [ASSUMPTION] Hat Linus noch kein Monatsbudget festgelegt, trägt er es vor der Restbudgetprüfung ein.
4. Linus erfasst eine oder mehrere Ausgaben mit Name und Betrag in Euro.
5. Das System setzt den Erfassungstag auf das aktuelle Datum in der Zeitzone Europe/Berlin; Linus kann kein anderes Datum auswählen.
6. Nach bestätigtem Speichern erscheinen die Einträge in seiner eigenen Liste mit Name, Betrag und Erfassungsdatum. Die Liste umfasst frühere Monate.
7. **Climax:** Das Restbudget zeigt `Monatsbudget − Summe der eigenen Ausgaben des laufenden Europe/Berlin-Monats`; Linus kann Restbetrag und bisherige Einträge ohne Nebenrechnung prüfen. Bei negativem Ergebnis gilt vorläufig die markierte Annahme eines sichtbaren negativen Betrags.
8. [ASSUMPTION] Falls er einen Eintrag korrigieren oder entfernen muss, bearbeitet er Name/Betrag oder bestätigt das Löschen; die Monatsberechnung aktualisiert sich danach.

**Fehlerpfade [ASSUMPTION]:** Eingabe-, Speicher- und Sitzungsfehler folgen den Regeln unter [State Patterns](#state-patterns). Ein ungültiger Registrierungslink zeigt die dort beschriebene neutrale Erklärung; fremde Konten und Datensätze bleiben verborgen.

### Flow 2 — [ASSUMPTION] Linus legt ein Sparziel an und aktualisiert dessen Fortschritt.

Dieser Ablauf ist aus **FR-9: Sparziel festlegen** und **FR-10: Fortschritt eines Sparziels aktualisieren und ansehen** abgeleitet; im PRD ist nur UJ-1 als Nutzerreise bestätigt.

1. Linus meldet sich an und öffnet „Sparziele“.
2. Er legt ein Ziel mit eigenem Namen und Zielbetrag in Euro an; das Zieldatum kann leer bleiben.
3. [ASSUMPTION] Ein neu angelegtes Ziel startet mit einem Gesamtfortschritt von `0 €`; das PRD legt den Anfangswert nicht fest.
4. Linus trägt später den aktuellen erreichten Gesamtbetrag ein. Die Eingabe ersetzt den zuvor gespeicherten Gesamtbetrag; einzelne Beiträge werden nicht aufgelistet oder historisiert.
5. **Climax:** Er sieht den manuell gepflegten aktuellen Betrag im Verhältnis zum Zielbetrag und erkennt den Stand seines persönlichen Ziels.

**Fehlerpfade [ASSUMPTION]:** Für Eingabe-, Speicher- und Zugriffsfälle gelten die Regeln unter [State Patterns](#state-patterns); die zulässigen Wertebereiche bleiben offen.

## Open Questions

- **UX-Entscheidung:** Soll ein negatives Restbudget als negativer Betrag oder als gesonderte Überschreitungsmeldung erscheinen? Diese Spine kennzeichnet die negative Darstellung nur vorläufig als [ASSUMPTION].
- **Eingaben:** Welche Wertebereiche und Genauigkeit gelten für Ausgaben, Monatsbudget, Zielbetrag und Fortschritt? Darf der Fortschritt das Ziel übersteigen?
- **Sparziel-Lebenszyklus:** Können Name, Zielbetrag und Datum bestehender Ziele geändert oder Ziele gelöscht werden?
- **Zugangsgrenze:** Wie lange gilt der Registrierungslink, und kann Linus ihn erneuern oder widerrufen? Der bestätigte Zugang bleibt „jede Person mit dem Link“; es wird keine Einladungspflicht unterstellt.
- **Datenlebenszyklus:** Welche v1-Regeln gelten für Export, Löschung, Aufbewahrung und Kontowiederherstellung, bevor echte Nutzerdaten verwendet werden?
- **Plattformverständnis:** Bedeutet „Mobile“ nur den mobilen Browser oder soll später eine native Anwendung entstehen?
- **Barrierefreiheit:** WCAG 2.2 AA und 44-px-Ziele sind explizite UX-Annahmen; die Anforderung einer barrierefreien Anwendung ist bestätigt, konkrete Prüf- und Abnahmekriterien waren in den Produktquellen nicht festgelegt.
- **Darstellung/Verhalten:** Farbtokens, deutscher Zahlenstil, Lichtmodus, Layout, Breakpoints, offline-Verhalten, Bestätigung beim Löschen und leere Zustände sind vorläufige UX-Annahmen.
- **Erfolg:** Die Quellen messen derzeit Übersicht und Ziel-Fortschritt; ob „mehr Geld am Monatsende“ als Ergebnis zusätzlich gemessen werden soll, bleibt offen.
