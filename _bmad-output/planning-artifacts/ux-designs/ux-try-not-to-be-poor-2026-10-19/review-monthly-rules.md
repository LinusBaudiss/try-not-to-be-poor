# Review Monatsregeln — try-not-to-be-poor

Stand: 2026-10-25. Unabhängige statische Prüfung des UX-Entwurfs und der drei HTML-Referenzen.

## Overall verdict

**strong.** Die UX-Verträge bewahren alle 17 verbindlichen Monatsabnahmefälle und die Präzisierungen des aktuellen PRD zu Nullmonaten, Ziellöschung und manuellem Fortschritt bei blockierter Automatik. Zwischen Quellen, Spines und den illustrierten Beispielzuständen wurde kein fachlicher Widerspruch und keine bestätigte vertragsrelevante Lücke festgestellt.

## Quellen und Prüfumfang

- [PRD](../../prds/prd-try-not-to-be-poor-2026-10-19/prd.md), insbesondere FR-6 bis FR-17 und §8.1–8.4.
- [Änderungsspezifikation](../../../specs/spec-oberflaeche-und-monatsueberschuss/SPEC.md), CAP-1 bis CAP-4 und ausdrücklich übernommene Annahmen.
- [Monatsfachregeln](../../../specs/spec-oberflaeche-und-monatsueberschuss/monatsueberschuesse.md), einschließlich aller 17 Abnahmefälle.
- [Brownfield-Abgleich](../../../specs/spec-oberflaeche-und-monatsueberschuss/brownfield.md), ergänzende Oberflächenabnahmen.
- [Architektur](../../architecture/architecture-try-not-to-be-poor-2026-10-19/ARCHITECTURE-SPINE.md), AD-5 und AD-7 bis AD-10.
- [DESIGN.md](./DESIGN.md), [EXPERIENCE.md](./EXPERIENCE.md) sowie [Monat](./mockups/key-monat.html), [Ausgaben](./mockups/key-ausgaben.html) und [Sparziele](./mockups/key-sparziele.html).

Das aktuelle PRD hat Präzisierungen der Architektur bereits übernommen. Ältere, ausdrücklich abgelöste Nichtnegativitäts- oder Zweiernavigationstexte werden deshalb nicht als Gegenvertrag behandelt. Die signierte manuelle Eingabe und der vollständige Ausgabenumzug bleiben als Quellenannahmen sichtbar; daraus wird kein neuer Klärungsbedarf erzeugt.

## Abnahmecoverage

Die Fundorte beziehen sich auf [EXPERIENCE.md](./EXPERIENCE.md); die Fachregeln werden dort zudem ausdrücklich als verbindliche Quelle referenziert.

| Nr. | Verbindlicher Abnahmefall | UX-Abdeckung | Ergebnis |
|---|---|---|---|
| 1 | Aktivierung im Oktober, historische Septemberdaten vorhanden | „Monatswirkungen und Darstellung“ / Aktivierung; Flow 3, Schritte 1–2: ganzer Aktivierungsmonat, keine früheren Monate. | Erhalten |
| 2 | Aktivierung ohne Ziel | `automation-panel`, „Aktiv, ohne Ziel“, Flow 3 und Sparziel-Mockup Zustände 1–2. Kein Ziel ist Voraussetzung. | Erhalten |
| 3 | Zwei offene Monate, dann Zielauswahl | `goal-selection`, `pending-surplus`, Flow 3: 300 € plus 50 € ergibt 350 €, danach 0 € vorgemerkt, keine Doppelwirkung. | Erhalten |
| 4 | Historische Änderung vor Zuordnung | „Monatswirkungen und Darstellung“ / Historische Betragsänderung sowie Flow 4: nur betreffende Vormerkung korrigieren, spätere Übernahme verwendet den korrigierten Betrag. | Erhalten |
| 5 | Positiver Monatsrest mit Ziel | Flow 3, Varianten: 1.000 € minus 800 € erhöht 50 € auf 250 €; eigene Kontozustände gelten in allen Flows. | Erhalten |
| 6 | Null, negativer Rest oder fehlendes Budget | „Kein Monatsbudget“, „Budget ausdrücklich null“, „Restbudget negativ“ und Monatswirkungstabelle: keine erfundene Anrechnung und keine neue Sparbelastung. Historische Rücknahme bleibt möglich. | Erhalten |
| 7 | Nachholen nach Ausfall | Monatswirkungstabelle / Nachholen, Flow 3 und gemeinsame Aktualisierungsregeln: ohne Sitzung, historische Auswahl, einmalige Wirkung. | Erhalten |
| 8 | Historische Ausgabe teurer | Flow 4: 200 € auf 150 € Monatsüberschuss ergibt ausschließlich −50 € auf das ursprüngliche Ziel. | Erhalten |
| 9 | Historische Ausgabe günstiger oder gelöscht | Flow 4, Varianten: ausschließlich positive Differenz, keine erneute volle Monatsanrechnung. | Erhalten |
| 10 | Manuelle Bearbeitung neben Automatik | `goal-progress-value`, „Manueller Gesamtstand“, Flows 2 und 4: Gesamtstand ersetzen, Herkunft erhalten; 300 € minus 50 € ergibt 250 €. | Erhalten |
| 11 | Korrektur unter null | Fortschrittskomponenten, Darstellungstabelle und Flow 4: 20 € minus 50 € ergibt −30 €; tatsächlicher Prozentwert, Balken 0 %. | Erhalten |
| 12 | Anrechnung auf negativen Fortschritt | Flow 4: −30 € plus 100 € ergibt 70 €. Keine separate Korrekturschuld. | Erhalten |
| 13 | Zielwechsel A nach B | Monatswirkungstabelle / Auswahlwechsel und Flow 5: offener und folgende Monate B, Oktober und dessen Korrektur bleiben A. | Erhalten |
| 14 | Ausgewähltes Ziel löschen | `delete-confirmation`, Zustand „Ausgewähltes Ziel gelöscht“ und Flow 5: Ziel/Fortschritt entfallen, keine alte Umleitung, neue Überschüsse vorgemerkt. | Erhalten |
| 15 | Historische Korrektur nach Ziellöschung | Monatswirkungstabelle / Gelöschtes Ziel und Flows 4–5: verbraucht, keine Wiederanlage, Vormerkung oder andere Zielanrechnung. | Erhalten |
| 16 | Ziel übererfüllt | `goal-progress-value`, `goal-progress-fill`, Darstellungstabelle und Flow 2: 150 € / 150 %, nur Balken 100 %. | Erhalten |
| 17 | Commitfehler, Parallelität, Grenzüberschreitung | `primary-button`, `save-status`, State Patterns und Interaction Primitives: keine Teilbestätigung, Vormerkung erhalten, unbekannten Ausgang zuerst klären, keine veralteten Antworten oder verlorenen bestätigten Werte. | Erhalten |

## Zusätzliche Präzisierungen

| Prüffeld | Ergebnis |
|---|---|
| Nullmonatsbindung | „Budget mit Überschuss null“ erhält historische Auswahl beziehungsweise spätere Bindung trotz Summe null; fehlendes Budget bleibt davon unterschieden. |
| Ziellöschung ohne Nachholen | State Patterns, Monatswirkungstabelle und Flow 5 erhalten die Löschung ohne erfolgreichen Nachhollauf und den Verbrauch noch unverarbeiteter abgeschlossener Monate mit damaliger Auswahl dieses Ziels. |
| Manuelle Korrektur bei blockierter Automatik | `primary-button`, Zustand „Betragsgrenze erreicht“ und Flow 2 lassen manuelles Ersetzen erreichbar; kein pauschales Sperren des Sparzielbereichs. |
| Budgethistorie und Restbudget | `budget-summary` erhält abgeschlossene Budgetstände. Monatswirkungstabelle trennt Sparanrechnung von Ausgabe und Restbudgetformel. |
| Rückkehr, Sitzung und unbekannter Ausgang | State Patterns und Interaction Primitives fordern konsistente neue Ansichten, Entwurfserhalt nur im offenen Tab und Verwerfen später Antworten nach Sitzungsende/Kontowechsel. |
| Mockup-Rechnung und Beschriftungen | Monat zeigt 1.000 € − 800 € = 200 €; Oktoberausgaben summieren sich auf 800 €. Sparzielzustände sind ausdrücklich unabhängig: 50/1.000 = 5 % und −30/100 = −30 % mit leerem Balken. 300 € Vormerkung werden als noch nicht angerechnet bezeichnet. |
| Umfangsgrenze | Kein Beitragsverlauf, keine Bankübertragung, keine Deaktivierung und kein manuell auszulösender Monatsabschluss eingeführt. Systemseitige Zeitzonenerläuterungen entfallen; „Berlin-Fahrt“ bleibt eigener Text. |

## Befunde

Keine bestätigten Befunde.

- Critical: **0**
- High: **0**
- Medium: **0**
- Low: **0**

## Prüfgrenze

Geprüft wurden die statischen Dokumentverträge und der HTML-Inhalt der drei Referenzen. Es erfolgte keine Browser-, Screenreader- oder Implementierungsprüfung und keine Ausführung von Monatsverarbeitung, API oder Datenbank. Die zuvor blockierte lokale Browser-Dateinavigation wurde nicht wiederholt oder umgangen. Dieser Bericht bestätigt die fachliche Erhaltung im UX-Vertrag; er ist kein Nachweis funktionierender Automatik oder eine Produktionsfreigabe.
