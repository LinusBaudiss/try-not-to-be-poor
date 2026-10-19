---
title: "PRD: Try Not to Be Poor"
status: final
created: 2026-10-19
updated: 2026-10-19
---

# PRD: Try Not to Be Poor

## 0. Dokumentzweck

Dieses PRD hält den v1-Umfang für „Try Not to Be Poor“ fest und dient Linus als persönliche Planungsgrundlage sowie als Grundlage für UX, Architektur und Umsetzung. Es baut auf dem finalen [Produktbriefing](../../briefs/brief-try-not-to-be-poor-2026-10-18/brief.md), dessen [Addendum zur Datentrennung](../../briefs/brief-try-not-to-be-poor-2026-10-18/addendum.md) und der mit Linus abgestimmten Nutzerreise UJ-1 auf. Es beschreibt gewünschtes Nutzerverhalten und Qualitätsanforderungen; technische Umsetzung und Datenmodell bleiben Folgeentscheidungen.

## 1. Vision

„Try Not to Be Poor“ hilft Linus sowie Familie und Freunden, ihre persönlichen Ausgaben manuell festzuhalten und den Überblick zu behalten. Eine responsive Website stellt die eigenen Ausgaben, den Rest des Monatsbudgets und den Fortschritt persönlicher Sparziele übersichtlich dar.

Jede Person sieht ausschließlich die eigenen Daten. Ein Monatsbudget gilt für alle erfassten Ausgaben und zeigt, wie viel vom geplanten Betrag im laufenden Monat noch übrig ist. Sparziele machen einen Zielbetrag und den Fortschritt sichtbar; ein Zieldatum ist optional.

Der gewünschte Nutzen ist mehr Transparenz über Ausgaben und dadurch am Monatsende mehr Geld übrig. Ob dieser finanzielle Effekt eintritt, muss sich in der tatsächlichen Nutzung zeigen.

**Name und Ton:** „Try Not to Be Poor“ ist bewusst provokativ benannt. Der Name dient Linus als persönliche Orientierung und Planung; eine weitergehende Tonalität für Texte oder Gestaltung ist noch nicht festgelegt.

## 2. Umfang von v1

### 2.1 Enthalten

- Anmeldung und getrennte persönliche Datenbereiche.
- Manuelle Erfassung persönlicher Ausgaben mit Name und Betrag.
- Tabellarische Übersicht aller eigenen bisher erfassten Ausgaben.
- Bearbeiten von Ausgabename und -betrag sowie Löschen eigener Ausgaben.
- Ein fortlaufendes Monatsbudget, das für alle eigenen Ausgaben des laufenden Monats gilt und manuell geändert werden kann.
- Anzeige des Restbudgets nach der im PRD festgehaltenen Berechnung.
- Persönliche Sparziele mit Zielbetrag in Euro, Fortschrittsanzeige und optionalem Zieldatum.
- Euro als gemeinsame Währung für Ausgaben, Monatsbudget und Sparziele.
- Responsive Website mit Priorität auf Smartphone-Nutzung.

## 3. Zielgruppe

### 3.1 Aufgaben der Nutzer:innen

- Eigene Ausgaben zeitnah und ohne großen Aufwand festhalten.
- Nach einer Erfassung erkennen, wie viel vom Monatsbudget noch übrig ist.
- Bisherige Ausgaben und den Stand persönlicher Sparziele überblicken.
- Im Alltag besser nachvollziehen, wofür Geld ausgegeben wird.

### 3.2 Nicht-Zielgruppe für v1

- Unternehmen oder Personen, die betriebliche Finanzen verwalten.

### 3.3 Zentrale Nutzerreise

- **UJ-1. Linus erfasst Ausgaben und prüft sein Monatsbudget.**
  - **Person und Kontext:** Linus möchte persönliche Ausgaben im kleinen Kreis manuell nachverfolgen.
  - **Ausgangszustand:** Linus hat den Registrierungslink erhalten. Bei der ersten Nutzung hat er noch kein Nutzerkonto; bei späterer Nutzung ist er abgemeldet.
  - **Ablauf:** Bei der ersten Nutzung registriert sich Linus über den Link und meldet sich an. Bei späterer Nutzung meldet er sich direkt an. Anschließend erfasst er eine oder mehrere Ausgaben mit Name und Betrag.
  - **Wertmoment:** Er sieht den verbleibenden Betrag seines Monatsbudgets und kann die bisherigen Ausgaben tabellarisch prüfen.
  - **Abschluss:** Linus verlässt die Website mit einer aktuellen Übersicht seiner erfassten Ausgaben und des Restbudgets.

## 4. Glossar

- **Nutzerkonto** — Der angemeldeten Person zugeordneter Zugang und Datenbereich.
- **Ausgabe** — Eine von einer Person manuell erfasste persönliche Ausgabe. Der bestätigte Mindestumfang umfasst Name, Betrag und automatisch gesetztes Erfassungsdatum; weitere Felder sind offen.
- **Erfassungsdatum** — Der Kalendertag in der Zeitzone Europe/Berlin, an dem eine Ausgabe in der Website erfasst wird.
- **Monatsbudget** — Der fortlaufende Betrag in Euro für alle Ausgaben einer Person je Kalendermonat nach Europe/Berlin.
- **Restbudget** — Monatsbudget abzüglich der im laufenden Kalendermonat nach Europe/Berlin erfassten Ausgaben.
- **Monatsübersicht** — Ansicht des Restbudgets und der tabellarischen Liste eigener bisheriger Ausgaben.
- **Sparziel** — Ein persönliches Vorhaben mit eigenem Namen, Zielbetrag in Euro, Fortschrittsanzeige und optionalem Zieldatum.
- **Währung** — Für Beträge in v1 gilt der Euro (€).

## 5. Funktionen

### 5.1 Nutzerkonten und Datentrennung

**Beschreibung:** Die Website unterstützt die private Nutzung durch Linus sowie Familie und Freunde. Jede Person hat ein eigenes Nutzerkonto. Gemeinsame Datenansichten sind nicht vorgesehen. Jede Person mit dem Registrierungslink kann ein Nutzerkonto anlegen; der private Nutzerkreis hängt daher davon ab, mit wem der Link geteilt wird.

**Funktionale Anforderungen:**

#### FR-1: Nutzerkonto über den Registrierungslink anlegen

Jede Person mit dem Registrierungslink kann ein eigenes Nutzerkonto registrieren und sich anschließend anmelden.

**Prüfbare Folgen:**
- Jede Person, die den Registrierungslink besitzt, kann darüber ein eigenes Nutzerkonto anlegen.
- Nach erfolgreicher Registrierung kann sich die Person anmelden.

**Hinweis für die Architektur:** Ablaufzeit, Widerruf oder Erneuerung des Registrierungslinks sind noch nicht festgelegt. Die Registrierung steht jeder Person offen, die den Link besitzt.

#### FR-2: Eigene Finanzdaten ansehen

Angemeldete Personen können ihre eigenen Ausgaben, ihr Monatsbudget und ihre Sparziele ansehen.

**Prüfbare Folgen:**
- Linus sieht nur seine eigenen Ausgaben, sein eigenes Monatsbudget und seine eigenen Sparziele.
- Eine andere angemeldete Person sieht nur ihre eigenen Daten.

#### FR-3: Daten anderer Personen schützen

Das System erlaubt einer Person nicht, Ausgaben, Monatsbudgets oder Sparziele einer anderen Person einzusehen oder zu verändern. Gemeinsame Ansichten gehören nicht zum v1-Umfang.

**Prüfbare Folgen:**
- Lese- und Änderungszugriffe auf persönliche Daten sind dem jeweiligen Nutzerkonto zugeordnet.
- Ein Zugriff auf Daten eines fremden Nutzerkontos gibt diese Daten nicht preis.

### 5.2 Ausgaben manuell erfassen und überblicken

**Beschreibung:** Nutzer:innen erfassen eigene Ausgaben manuell und können die bisher erfassten Einträge in einer Tabelle überblicken. UJ-1 beschreibt den Weg von der Anmeldung über die Erfassung bis zur Monatsübersicht.

**Funktionale Anforderungen:**

#### FR-4: Ausgabe manuell erfassen

Angemeldete Personen können eine oder mehrere eigene Ausgaben mit Name und Betrag in Euro erfassen.

**Prüfbare Folgen:**
- Nach dem Speichern erscheinen die erfassten Ausgaben in der eigenen Ausgabenübersicht.
- Die erfassten Ausgaben werden dem angemeldeten Nutzerkonto zugeordnet.
- Jede Ausgabe erhält automatisch den Erfassungstag nach Europe/Berlin; die Person wählt kein abweichendes Datum aus.

#### FR-5: Alle bisher erfassten Ausgaben tabellarisch ansehen

Angemeldete Personen können alle bisher erfassten eigenen Ausgaben in einer tabellarischen Übersicht ansehen. Die Liste ist nicht auf den laufenden Monat beschränkt.

**Prüfbare Folgen:**
- Die Übersicht enthält alle Ausgaben des Nutzerkontos, auch aus früheren Monaten.
- Name, Betrag und automatisch gesetztes Erfassungsdatum sind je Ausgabe erkennbar.
- Die Übersicht enthält keine Ausgaben anderer Nutzerkonten.

#### FR-6: Eigene Ausgabe bearbeiten oder löschen

Angemeldete Personen können den Namen und Betrag einer eigenen Ausgabe ändern oder die Ausgabe löschen.

**Prüfbare Folgen:**
- Änderungen an Name oder Betrag werden in der Ausgabenübersicht angezeigt.
- Gelöschte Ausgaben erscheinen nicht mehr in der Ausgabenübersicht.
- Änderungen oder Löschungen betreffen nicht die Daten anderer Nutzerkonten.
- Das Restbudget wird nach einer Änderung oder Löschung entsprechend der verbliebenen Ausgaben neu berechnet.

### 5.3 Monatsbudget

**Beschreibung:** Das Monatsbudget gilt pauschal für alle Ausgaben und bleibt in Folgemonaten bestehen, bis die Person es manuell ändert. Einnahmen fließen nicht in die Berechnung ein.

**Funktionale Anforderungen:**

#### FR-7: Monatsbudget festlegen

Angemeldete Personen können den Betrag ihres Monatsbudgets festlegen und manuell ändern. Der Betrag gilt in Folgemonaten weiter, bis er geändert wird.

**Prüfbare Folgen:**
- Das Monatsbudget wird dem eigenen Nutzerkonto zugeordnet.
- Das Monatsbudget wird in Euro erfasst.
- **[ASSUMPTION]** Eine Änderung des Monatsbudgets gilt sofort für den laufenden und die folgenden Monate.
- Alle eigenen Ausgaben des laufenden Monats zählen zum Monatsbudget.

#### FR-8: Restbudget anzeigen

Angemeldete Personen können sehen, wie viel vom Monatsbudget nach Abzug der eigenen Ausgaben im laufenden Monat übrig ist.

**Prüfbare Folgen:**
- Restbudget = Monatsbudget − Summe der eigenen Ausgaben im laufenden Kalendermonat nach Europe/Berlin.
- Einnahmen werden für diese Berechnung nicht berücksichtigt.
- Der angezeigte Wert wird aktualisiert, wenn eine Ausgabe erfasst, geändert oder gelöscht wird.

### 5.4 Sparziele

**Beschreibung:** Sparziele helfen, einen Zielbetrag und den erreichten Fortschritt zu überblicken. Nutzer:innen pflegen den aktuell erreichten Gesamtbetrag selbst; einzelne Sparbeiträge und deren Verlauf werden nicht erfasst. Ein Zieldatum ist optional.

**Funktionale Anforderungen:**

#### FR-9: Sparziel festlegen

Angemeldete Personen können ein eigenes Sparziel mit eigenem Namen, Zielbetrag in Euro und optionalem Zieldatum anlegen.

**Prüfbare Folgen:**
- Das Sparziel wird dem eigenen Nutzerkonto zugeordnet.
- Das Sparziel hat einen von der Person festgelegten Namen.
- Ein Sparziel kann ohne Zieldatum bestehen.

#### FR-10: Fortschritt eines Sparziels aktualisieren und ansehen

Angemeldete Personen können den aktuell erreichten Gesamtbetrag eines eigenen Sparziels manuell aktualisieren und im Verhältnis zum Zielbetrag sehen.

**Prüfbare Folgen:**
- Die Fortschrittsanzeige basiert auf dem manuell gepflegten aktuellen Gesamtbetrag.
- Das Aktualisieren ersetzt den bisherigen Gesamtbetrag; einzelne Beiträge werden nicht als Verlauf gespeichert.
- Die Fortschrittsanzeige gehört zum jeweiligen Sparziel.
- Der Fortschritt eines Sparziels ist nur für dessen Nutzerkonto sichtbar.

### 5.5 Website und Nutzung auf verschiedenen Bildschirmgrößen

**Beschreibung:** Die Produktform ist eine responsive Website mit Frontend und Backend. Die Nutzung am Smartphone hat Vorrang; die Website soll auch am Rechner gut bedienbar sein. Konkrete Technologien und deren Aufteilung sind Architekturentscheidungen.

**Funktionale Anforderungen:**

#### FR-11: Website responsiv nutzen

Nutzer:innen können die zentrale Ausgaben-, Monatsbudget- und Sparziel-Funktionalität auf einem Smartphone sowie am Rechner verwenden.

**Prüfbare Folgen:**
- Die genannten Kernfunktionen sind auf einem Smartphone bedienbar.
- Die genannten Kernfunktionen sind auch am Rechner bedienbar.
- Die UX-Spezifikation legt vor der Umsetzungsplanung konkrete Bildschirmgrößen und Aufgaben für die Prüfung auf beiden Gerätetypen fest.

## 6. Nicht-Ziele und zurückgestellte Funktionen

- Gemeinsame Ausgaben-, Budget- oder Sparzielansichten.
- Verwaltung betrieblicher Finanzen.
- Einnahmen werden in v1 weder erfasst noch in die Berechnung des Restbudgets einbezogen.
- **[NON-GOAL for MVP]** Automatischer Bankimport; v1 basiert auf manueller Erfassung. Linus prüft einen Bankimport bei der Planung einer späteren Version erneut.
- Kategorien und wiederkehrende Ausgaben gehören nicht zum v1-Umfang.

## 7. Erfolgskriterien

- **SM-1 — Monatsüberblick:** Linus kann bei der Monatsprüfung die bisherigen Ausgaben und den Rest seines Monatsbudgets ohne eigene Nebenrechnung erkennen. Prüft FR-5 und FR-8.
- **SM-2 — Zielüberblick:** Linus kann den Fortschritt jedes eigenen Sparziels zum Zielbetrag erkennen. Prüft FR-10.
- **SM-C1 — Erfassungsaufwand:** Die Übersicht darf nicht durch einen so aufwendigen Erfassungsprozess erkauft werden, dass Linus die manuelle Erfassung nicht mehr nutzt. SM-C1 und SM-1 werden während der privaten Nutzung gemeinsam beobachtet.

Der übergeordnete gewünschte Effekt — am Monatsende mehr Geld übrig zu haben — lässt sich aus dem Briefing nicht mit einem Ausgangswert oder Ziel messen. Er bleibt ein zu beobachtendes Nutzungsergebnis, keine zugesicherte Produkteigenschaft.

## 8. Datenschutz und Qualitätsanforderungen

- Persönliche Ausgaben-, Budget- und Zieldaten sind jeweils einem Nutzerkonto zugeordnet und dürfen anderen Nutzerkonten nicht offengelegt werden.
- Zugriffe auf persönliche Daten müssen den angemeldeten Nutzer berücksichtigen; die konkrete technische Zugriffskontrolle wird in der Architektur festgelegt.
- Die Website muss die in FR-11 genannten Kernfunktionen auf Smartphone und Rechner bedienbar machen.
- Aufbewahrung, Export und Löschung persönlicher Daten sowie Kontowiederherstellung sind vor der Architektur noch zu klären.

## 9. Offene Fragen

1. **Owner: Linus; entscheiden in der UX-Arbeit an der Monatsübersicht.** Soll ein Restbudget unter null als negativer Betrag oder als gesonderte Überschreitungsmeldung dargestellt werden?
2. **Owner: Linus; klären vor einer Veröffentlichung mit echten Nutzerdaten.** Welche Anforderungen gelten in v1 für Export, Löschung, Aufbewahrungsdauer und Kontowiederherstellung?
3. **Owner: Linus; erneut ansehen bei Planung einer späteren Version.** Soll Bankimport nach v1 erwogen werden?
4. **Owner: Linus; erneut ansehen nach ein bis zwei Monaten privater Nutzung.** Reicht die Nutzung und Transparenz als Erfolgskriterium, oder soll für „am Monatsende mehr übrig“ ein konkreter Vergleich über mehrere Monate erhoben werden?
5. **Owner: Linus; entscheiden in der Architektur, bevor der Registrierungslink an den Nutzerkreis verteilt wird.** Wie lange ist der Link gültig, und kann Linus ihn erneuern oder widerrufen?
6. **Owner: Linus; festlegen, bevor Umsetzungsanforderungen für Betragseingaben abgenommen werden.** Welche Wertebereiche und Genauigkeit gelten für Ausgaben, Monatsbudget, Sparziel und Fortschritt; darf der Fortschritt den Zielbetrag überschreiten?
7. **Owner: Linus; festlegen, bevor Umsetzungsanforderungen für Sparziele abgenommen werden.** Können Name, Zielbetrag und Zieldatum eines bestehenden Sparziels geändert werden, und kann ein Sparziel gelöscht werden?
8. **Owner: Linus; mit der UX-Spezifikation vor der Umsetzungsplanung festlegen.** Welche Bildschirmgrößen und Kernaufgaben dienen als konkrete Prüfung für Smartphone und Rechner?

## 10. Annahmen

- **[ASSUMPTION] Budgetänderung:** Eine manuelle Änderung des Monatsbudgets gilt sofort im laufenden Monat und in allen Folgemonaten.
- **[ASSUMPTION] Restbudget unter null:** Die Formel erlaubt einen negativen Wert, falls die Ausgaben das Monatsbudget überschreiten. Die genaue Darstellung ist offen.

