---
id: SPEC-try-not-to-be-poor
companions: []
sources:
  - ../../planning-artifacts/briefs/brief-try-not-to-be-poor-2026-10-18/brief.md
---

# Try Not to Be Poor

## Why

Dies ist ein persönliches Vorhaben, das ein konkretes Problem lösen soll: Linus, Familie und Freunde haben keinen genauen Überblick über ihre Alltagsausgaben. Eine einfache Ausgabenübersicht soll sichtbar machen, wohin Geld fließt, Sparziele unterstützen und helfen, am Monatsende mehr Geld übrig zu haben.

## Capabilities

- **CAP-1**
  - **intent:** Nutzer:innen können Ausgaben manuell erfassen und ihre eigenen Einträge einsehen, um ihre Ausgaben nachvollziehen zu können.
  - **success:** Ein erfasster Eintrag erscheint in der persönlichen Ausgabenübersicht und fließt in die eigene Ausgabensumme ein.
- **CAP-2**
  - **intent:** Nutzer:innen können ein Monatsbudget für alle Ausgaben festlegen und den verbleibenden Betrag einsehen.
  - **success:** Der angezeigte Restbetrag entspricht dem Monatsbudget abzüglich aller im laufenden Monat erfassten Ausgaben.
- **CAP-3**
  - **intent:** Nutzer:innen können Sparziele mit Zielbetrag und optionalem Zieldatum führen und deren Fortschritt einsehen.
  - **success:** Ein Sparziel zeigt Zielbetrag, optionales Zieldatum und Fortschritt an.

## Constraints

- Die Website umfasst Frontend und Backend, ist responsiv, vorrangig für Smartphones ausgelegt und muss auch am Rechner gut bedienbar sein.
- Jede Person sieht ausschließlich die eigenen Ausgabendaten und Ansichten; gemeinsame Ansichten sind ausgeschlossen.
- Das Monatsbudget gilt für alle Ausgaben; Einnahmen werden für die Berechnung des Budgetrests nicht benötigt.

## Non-goals

- Geschäftliche Nutzung.
- Gemeinsame Ansichten, die Ausgaben mehrerer Personen zusammenführen.

## Success signal

- In einer Demonstration kann eine Person eigene Ausgaben eintragen, deren Summe und den korrekt berechneten Budgetrest des laufenden Monats sehen sowie Sparziele mit sichtbarem Fortschritt einsehen. Die persönliche Übersicht macht Ausgaben transparent und unterstützt das Ziel, am Monatsende mehr Geld übrig zu haben.

## Open Questions

- Welche Angaben muss ein manuell erfasster Ausgabeneintrag enthalten?
- Wie wird der Fortschritt eines Sparziels erfasst oder berechnet?
- Welche Währung gilt, und wie werden Monatsgrenze und Zeitzone für Budget und Ausgaben bestimmt?
- Wie identifizieren sich Nutzer:innen, und welche Zugriffs- und Schutzregeln sichern die Trennung ihrer Finanzdaten?
