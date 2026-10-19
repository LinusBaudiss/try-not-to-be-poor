# Abgleich: Produktbriefing und PRD

**Quelle:** `brief-try-not-to-be-poor-2026-10-18/brief.md`  
**Ziel:** `prd-try-not-to-be-poor-2026-10-19/prd.md`  
**Stand:** PRD ist als `draft` markiert. Im PRD-Arbeitsordner liegt kein Addendum.

## Zusammenfassung

Das aktualisierte PRD trägt den Kern und die qualitative Absicht des Briefings jetzt durchgängig: private manuelle Ausgabenerfassung, getrennte persönliche Daten, Monatsbudget für alle Ausgaben, Sparziele mit optionalem Zieldatum, responsive Website mit Smartphone-Priorität und den gewünschten Nutzen von Transparenz und mehr Geld am Monatsende. Der bewusst provokative Produktname sowie sein Zweck als persönliche Orientierungs- und Planungsgrundlage sind ausdrücklich festgehalten. Frontend und Backend werden als Produktform erwähnt; technische Aufteilung und Technologien bleiben der Architektur überlassen.

Die wesentliche verbleibende Spannung betrifft die Registrierung: Das PRD setzt die Regel um, dass jede Person mit dem Link ein Konto erstellen kann, während das Briefing den vorgesehenen Personenkreis als privat (Linus, Familie und Freunde) beschreibt. Das PRD benennt, dass die Reichweite von der Weitergabe des Links abhängt; Ablauf, Widerruf oder Erneuerung des Links sind noch offen.

## Abgleich nach Themen

| Briefing-Aussage | Abdeckung im PRD | Befund |
|---|---|---|
| Persönliche Ausgaben für die Person selbst, Familie und Freunde manuell über eine Website erfassen und verfolgen | Vision, Zielgruppe, UJ-1, FR-4 bis FR-6 | Abgedeckt. Die Nutzerreise konkretisiert den Ablauf von Anmeldung und Erfassung bis zur Übersicht. |
| Jede Person sieht ausschließlich die eigenen Daten; gemeinsame Ansichten sind nicht vorgesehen | Vision, FR-2 und FR-3, Nicht-Ziele, Datenschutzanforderungen | Abgedeckt und in prüfbare Anforderungen übersetzt. |
| Responsive Website mit Frontend und Backend, vorrangig für Smartphone, auch am Rechner gut nutzbar | FR-11 und Produktform-Beschreibung | Abgedeckt; konkrete technische Aufteilung bleibt der Architektur überlassen. |
| Ausgabenübersicht mit Monatsbudget für alle Ausgaben; Rest = Budget minus Ausgaben im laufenden Monat; Einnahmen sind dafür zunächst nicht nötig | Vision, Glossar, FR-7 und FR-8 | Abgedeckt. |
| Sparziele mit Zielbetrag und Fortschritt; Zieldatum optional | Glossar, FR-9 und FR-10 | Abgedeckt. |
| Erfolg heißt mehr Transparenz und am Monatsende mehr Geld übrig | Vision und Erfolgskriterien | Abgedeckt. Das PRD behauptet nicht, dass die App diesen finanziellen Effekt garantiert; es hält ihn wie das Briefing als zu beobachtendes Ergebnis fest. |
| Name ist bewusst provokativ und dient der persönlichen Orientierung und Planung | Vision, „Name und Ton“ | Abgedeckt. Weitergehende Tonalität für Texte und Gestaltung bleibt offen. |
| Produkt ist privat und nicht für Unternehmen gedacht | Zielgruppe und Nicht-Zielgruppe | Abgedeckt. |

## Verbleibende Lücken und Spannungen

1. **Registrierungslink und privater Nutzerkreis.** FR-1 erlaubt jeder Person mit dem Link die Registrierung. Das entspricht der bestätigten Zugangsregel. Das Briefing beschreibt zugleich einen privaten Kreis aus Linus, Familie und Freunden. Das PRD weist zutreffend darauf hin, dass die Reichweite davon abhängt, mit wem der Link geteilt wird; es setzt also keine Zugangsbeschränkung durch. Vor Veröffentlichung sollte geklärt werden, ob die Weitergabe im privaten Kreis genügt und ob Ablauf, Widerruf oder Erneuerung des Links nötig sind. Das PRD führt dies als offene Architekturfrage.

2. **Zeitpunkt der Budgetänderung ist eine ausgewiesene Annahme.** Das Briefing sagt, dass das Budget für alle Ausgaben gilt und der Rest aus Monatsbudget minus Ausgaben im laufenden Monat berechnet wird. Eine sofortige Wirkung einer Budgetänderung für den bereits laufenden Monat folgt daraus nicht eindeutig. Das PRD markiert die sofortige Geltung transparent als `[ASSUMPTION]`; sie sollte vor der Umsetzung bestätigt oder anders festgelegt werden.

3. **Metrik für den finanziellen Effekt bleibt offen, aber korrekt eingeordnet.** Das Briefing enthält keinen Ausgangswert oder messbaren Zielwert für „am Monatsende mehr Geld übrig“. Das PRD hält den Effekt deshalb als zu beobachtendes Ergebnis fest und fragt, ob später ein Monatsvergleich erhoben werden soll. Das ist keine widersprüchliche Anforderung.

## Ergebnis

Der wesentliche Briefinginhalt ist im aktuellen PRD abgedeckt; die früheren Lücken zur Namensabsicht und Registrierung in UJ-1 sind behoben. Für den Abschluss bleiben die Linkreichweite im privaten Nutzerkreis und die als Annahme markierte Wirkung einer Budgetänderung im laufenden Monat zu beachten. Bankimport ist konsistent als Nicht-Ziel für v1 mit einer späteren Neubewertung dokumentiert.
