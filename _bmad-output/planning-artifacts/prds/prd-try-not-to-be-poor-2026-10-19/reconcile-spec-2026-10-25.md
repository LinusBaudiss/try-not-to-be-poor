# Input-Abgleich: SPEC-try-not-to-be-poor

Stand: 25.10.2026. Geprüft wurden der aktualisierte PRD-Entwurf und sein Addendum gegen die Produktspezifikation, ihre Bestandseinordnung und die verbindlichen Monatsfachregeln. Diese Prüfung ändert keine Produktdatei und ist keine Implementierungsabnahme. Zeilenangaben beziehen sich auf den geprüften Entwurf vor dem abschließenden Lektorat.

## Ergebnis

Die neuen Bedienabläufe, Datengrenzen, beiden übernommenen Annahmen und sämtliche 17 Monatsabnahmefälle sind fachlich abgedeckt. Im geprüften Entwurf fehlte die ausdrückliche Anzeigepflicht der laufenden Monatsausgabensumme aus Produkt-CAP-2. Dieser Befund ist inzwischen in FR-8 und im Glossar behoben; siehe Erledigung am Ende dieses Berichts. Es verbleibt keine offene Produktlücke.

## Geprüfte Quellen

- [Produktspezifikation](../../../specs/spec-try-not-to-be-poor/SPEC.md), aktualisiert am 25.10.2026.
- [Bestandseinordnung](../../../specs/spec-try-not-to-be-poor/brownfield.md), Stand 25.10.2026.
- [Monatsfachregeln mit 17 Abnahmen](../../../specs/spec-oberflaeche-und-monatsueberschuss/monatsueberschuesse.md), Stand 25.10.2026.
- [PRD](prd.md), geprüfter Entwurf mit FR-1 bis FR-17.
- [Addendum](addendum.md), technische Ausgestaltung und Übergang.

## Befund des geprüften Entwurfs — inzwischen behoben

- **Medium — Laufende Monatsausgaben sichtbar anzeigen.** SPEC CAP-2, Zeile 33, verlangt ausdrücklich: Monat zeigt Budget, laufende Monatsausgaben und die exakte Differenz. PRD-Glossar „Monatsübersicht“ (Zeile 61), FR-8 (Zeilen 120–124) und FR-12 (Zeile 157) sichern Budgetverwaltung und Restbetrag, aber keinen sichtbaren Summenwert der Monatsausgaben. Das Addendum ergänzt diese UI-Pflicht nicht. **Korrektur:** FR-8 ausdrücklich um die sichtbare Darstellung des gültigen Budgets, der eigenen laufenden Monatsausgabensumme und des Restbudgets ergänzen; die Glossardefinition bei Bedarf entsprechend präzisieren. Keine neue Produktentscheidung erforderlich.

## Abgleich der Produktfähigkeiten

| Quelle | Erhaltung im PRD/Addendum | Befund |
| --- | --- | --- |
| CAP-1 Eigene Ausgaben verwalten | FR-4 bis FR-6, FR-12; Historie aller Monate, unveränderliches Datum/Eigentümer, bestätigtes Löschen, konsistenter nächster Monatsaufruf | Vollständig |
| CAP-2 Fortlaufendes Monatsbudget | FR-7/FR-8, Glossar, §8.1; laufend/künftig wirksam, abgeschlossene Stände geschützt, fehlendes Budget und negativer Rest unterscheidbar | Anzeigelücke inzwischen behoben |
| CAP-3 Sparziele und Fortschritt | FR-9/FR-10; Start null, positive Ziele, leeres Datum entfernt es, Zielbearbeitung erhält Fortschritt, Löschbestätigung, signierter tatsächlicher Betrag/Prozent | Vollständig |
| CAP-4 Zugang und rotes Abmelden | FR-1 bis FR-3, §8.2; Registrierung, Sitzung, roter lesbarer/fokussierbarer Button in allen Hauptbereichen, Browserbereinigung und späte Antworten | Vollständig |
| CAP-5 Deutsche Systemtexte | FR-13, §8.1; sichtbare und zugängliche Texte ohne Zeitzonenerläuterung, interne Kalenderregeln/deutsche Formate und nutzereigene Texte erhalten | Vollständig |
| CAP-6 Automatische Monatsüberschüsse | FR-14 bis FR-17, FR-9/FR-10 und §8.1/8.4; nachfolgender vollständiger Fallabgleich | Vollständig |

## Alle 17 verbindlichen Monatsabnahmen

Die Fallnummern folgen der Reihenfolge der Tabelle im Monatsbegleiter, Zeilen 53–69. PRD §0 nimmt alle Fälle ausdrücklich als verbindliche Abnahmen auf; SM-3 verlangt ihr Bestehen. Der folgende Abgleich prüft zusätzlich, ob die verhaltensbestimmenden Regeln im PRD selbst erhalten sind.

| Nr. | Abnahme aus dem Monatsbegleiter | Konkrete Abdeckung im PRD/Addendum | Ergebnis |
| --- | --- | --- | --- |
| 1 | Aktivierung im Oktober; September bleibt ausgeschlossen | FR-14, Zeilen 169–171: gesamter Oktober nach dessen Ende, unveränderlicher Erstmonat, keine früheren Monate | Abgedeckt |
| 2 | Aktivierung ohne jemals ausgewähltes Ziel; Oktoberüberschuss wird vorgemerkt | FR-14 erlaubt Aktivierung ohne vorhandenes/ausgewähltes Ziel; FR-15 ordnet ohne gültige Auswahl je Herkunftsmonat vor | Abgedeckt |
| 3 | 200 € und 100 € aus zwei Monaten auf 50 € übernehmen: 350 €, offen null, keine Wiederholung | FR-15, Zeilen 180–182, enthält vollständiges Zahlenbeispiel, Übernahme aller offenen Monate und keine Doppelwirkung | Abgedeckt |
| 4 | Historische Änderung vor Zielwahl korrigiert nur Oktober-Vormerkung, spätere Übernahme verwendet korrigierte Gesamtsumme | FR-16, Zeile 193, verändert nur betroffene Vormerkung; FR-15 übernimmt anschließend sämtliche offenen Vormerkungen | Abgedeckt; konkretes 150 € + 100 € = 250 € bleibt im verbindlich referenzierten Abnahmefall |
| 5 | 1.000 € Budget − 800 € Ausgaben erhöhen 50 € auf 250 €; andere Ziele/Konten bleiben unberührt | FR-14 definiert Formel; FR-15 ordnet genau einem eigenen Ziel vollständig zu; FR-2/FR-3 sichern Kontentrennung; FR-17 gemeinsame Wirkung | Abgedeckt; Zahlenbeispiel bleibt im verbindlich referenzierten Abnahmefall |
| 6 | Null/negativer Rest/fehlendes Budget: keine neue positive Anrechnung oder neue Belastung; frühere Anrechnung korrigierbar | FR-14, Zeile 171, unterscheidet alle Fälle; FR-15, Zeile 184, erhält Nullnachweise und grenzt fehlendes Budget ab; FR-16 nimmt frühere Wirkung per Differenz zurück | Abgedeckt |
| 7 | Nachholen nach Ausfall einmalig, historische Monatsendeauswahl, spätere Zielwahl übernimmt Offenes | FR-17, Zeilen 202–204; FR-15, Zeilen 175 und 180–181 | Abgedeckt |
| 8 | Historische Ausgabe teurer: früher 200 €, neu 150 €, nur −50 € am ursprünglichen Ziel | FR-16, Zeilen 194–195, explizite Differenzformel, ursprüngliches Ziel und Zahlenbeispiel | Abgedeckt |
| 9 | Historische Ausgabe günstiger/gelöscht: nur positive Differenz ergänzen | FR-16, Zeilen 189 und 194, umfasst Betragsänderung/Löschung mit vorzeichenfähiger Differenz; FR-17 verhindert Wiederholungswirkung | Abgedeckt |
| 10 | Manueller Stand 300 € plus −50 € Korrektur ergibt 250 €, keine Rekonstruktion aus Monatsüberschüssen | FR-10, Zeilen 138/145, erhält Nachweise und manuelle Gesamteingabe; FR-16, Zeilen 194–195, rechnet auf aktuellen Stand | Abgedeckt |
| 11 | 20 € − 50 € = −30 €, negativer Prozentwert, Balken null | FR-16, Zeile 196, explizite Rechnung; FR-10, Zeilen 142–143, tatsächlicher Betrag/Prozent und begrenzter Balken | Abgedeckt |
| 12 | −30 € + 100 € = 70 € | FR-16, Zeile 196, explizites Zahlenbeispiel | Abgedeckt |
| 13 | Wechsel A nach B: Oktober bleibt A, November folgt B, Oktoberkorrektur bleibt A | FR-15, Zeile 183, vollständiger Fall; FR-16 ursprüngliche Zielbindung | Abgedeckt |
| 14 | Ausgewähltes Ziel löschen: Ziel/Fortschritt entfallen, keine Umleitung, spätere Überschüsse vormerken | FR-9, Zeile 134, samt verständlichem Dialog, Erhalt bestehender Vormerkungen und Leeren der offenen Auswahl; FR-15 ohne Auswahl vormerken | Abgedeckt |
| 15 | Historische Korrektur nach Ziellöschung: kein Wiederanlegen, keine neue Vormerkung/anderes Ziel | FR-9, Zeile 134, verbrauchte Bindung auch für unverarbeitete historische Monate; FR-16, Zeile 197, keine Wirkung auf andere Ziele/Vormerkungen | Abgedeckt |
| 16 | Übererfüllung: tatsächliche Beträge und Prozente, nur Balken endet bei 100 % | FR-10, Zeilen 142–143, explizit 150 € / 150 % bei 100-€-Ziel und Balken 100 % | Abgedeckt |
| 17 | Commitfehler/Parallelität/Grenzfehler: keine Teilwirkung, doppelte Zuordnung oder verlorene Änderung, Vormerkung bleibt | FR-15, Zeile 181; FR-16, Zeile 198; FR-17, Zeile 204; §8.1/8.2; Addendum Konsistenzabschnitt | Abgedeckt |

## Zusätzliche Randfälle und Bedienqualität

- **Monatsende statt Verarbeitungszeit:** FR-15 bindet verspäteten Abschluss ausdrücklich an historische Auswahl; die spätere heutige Auswahl wird nicht ersatzweise verwendet.
- **Nullnachweise:** Glossar, FR-15 und Addendum erhalten Herkunft/Auswahl bei Budget und null Überschuss; offene Nullnachweise werden mit übernommen. Fehlendes Budget bleibt davon getrennt.
- **Löschen vor Nachholung:** FR-9 erhält auch unverarbeitete historische Bindungen als verbraucht und verlangt keine letzte Erhöhung des entfallenden Fortschritts.
- **Keine automatische Auswahl bei Zielanlage:** FR-9/FR-15 explizit.
- **Blockierte Nachholung:** FR-10/145 und Addendum erhalten manuelles Ersetzen trotz Betragsgrenzen.
- **Konten- und Sitzungsgrenzen:** FR-2/FR-3, §8.2 und Addendum sichern Eigenkonten, getrennte Autorisierung, flüchtige Daten und wirkungslose späte Antworten.
- **Zielwahl und Übernahme:** FR-15 macht beide gemeinsam wirksam und leert Vormerkungen erst nach bestätigter Übernahme.
- **Touch/Tastatur und Status:** FR-11 übernimmt konkrete Prüfpunkte, Fokus, programmatische Beschriftung/Status, Kontrast und textliche Werte zusätzlich zur Farbe auch für neue Zustände.
- **Deutsche Bedienung und Ton:** Vision hält verständliche deutsche Texte und den bestehenden persönlichen, provokativen Namen fest, ohne ein neues Markenkonzept zu erfinden. FR-13 umfasst zugängliche Hilfstexte und schützt nutzereigene Namen. Rotes Abmelden und Löschfolgen sind konkret beschrieben. Kein weiterer qualitativer Quellinhalt wurde stillschweigend fallen gelassen.

## Constraints, Nichtziele, Annahmen und offene Punkte

- Sämtliche Geldgrenzen, Vorzeichen, Dezimalpräzision, Kalenderregeln und serverseitiges Datum sind in §8.1 und FR-4/FR-6/FR-9/FR-10 enthalten.
- Privatheit, Websiteform, Smartphone-Priorität, Erhaltung bestätigter Entwürfe im offenen Tab und Commitbestätigung sind erhalten; technische Details leben im Addendum statt in einer neuen Architekturentscheidung.
- API-v2-Einführung und Freigabesprerre für Automatik/signierten Fortschritt sind in §8.4 und Addendum enthalten. Das Update behauptet weder neue Done-Stories noch Produktionstauglichkeit.
- Alle SPEC-Nichtziele stehen in §6. Technische Monatsnachweise und sichtbare Vormerkungen werden vom ausgeschlossenen Nutzer-Beitragsverlauf sauber unterschieden.
- Beide aus der SPEC übernommenen Ableitungen sind inline bei FR-10/FR-12 markiert und im Annahmenindex erfasst.
- Export, Löschung, Aufbewahrung einschließlich Monatsnachweisen, Wiederherstellung und E-Mail-Bestätigung bleiben mit Owner und Klärungsbedingung offen. Betriebs-/Backupbedingungen bleiben zusätzliche Freigabevoraussetzungen.
- Die durch Bestand/Architektur aufgelösten alten Fragen werden nicht erneut geöffnet. Spätere Bankimport-/Wirkungsmessfragen bleiben als spätere Planung erkennbar.

Nach Ergänzung der oben genannten sichtbaren Monatsausgabensumme verbleibt aus diesem Quellenabgleich keine fachliche Lücke.

## Erledigung des Befunds

Der Befund „Laufende Monatsausgaben sichtbar anzeigen“ wurde am 25.10.2026 behoben: FR-8 verlangt jetzt die sichtbare Darstellung des gültigen Monatsbudgets, der laufenden eigenen Monatsausgabensumme und des Restbudgets. Die Glossardefinition der Monatsübersicht wurde entsprechend ergänzt. Damit verbleibt aus diesem Quellenabgleich keine offene Produktlücke.
