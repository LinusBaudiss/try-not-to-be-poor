# Quellenabgleich der Architecture Spine

Stand: 2026-10-25. Gegenstand ist ausschließlich die Zielarchitektur, keine Prüfung einer implementierten Funktion. Geprüft wurden `ARCHITECTURE-SPINE.md` vollständig sowie das vollständige Specpaket `SPEC.md`, `monatsueberschuesse.md` und `brownfield.md` unter `_bmad-output/specs/spec-oberflaeche-und-monatsueberschuss/`.

Zusätzlich wurden die vom Auftraggeber für diesen Abgleich übergebenen jüngsten Nutzerentscheidungen zugrunde gelegt: Hintergrundlauf in der bestehenden Java-Anwendung, eigener begrenzter DB-Zugang für den Job, eigenes Modul Monatsüberschüsse, Trennung von Ausgaben und Budget in zwei isolierte Module, gemeinsame Transaktion zusammengehöriger Änderungen und vollständiger Wechsel sämtlicher API-Bereiche einschließlich Frontend auf `/api/v2` mit geplanter v1-Ablösung vor Featureaktivierung. Gewünscht ist die Spine als Arbeitsgrundlage; weitere Planungsartefakte werden durch diesen Abgleich nicht geändert.

## Urteil

Die Spine deckt alle vier CAPs und alle ausdrücklich formulierten Monatsabnahmen fachlich ab. Die bestätigten technischen Richtungsentscheidungen sind nachvollziehbar umgesetzt. Es gibt keinen nachgewiesenen Widerspruch der Priorität P0/P1 und keine ausgelassene CAP.

Ein P2-Befund betrifft den zwingenden Nachhollauf vor jeder Ziellöschung: Er macht deren Erfolg von möglicherweise überlaufenden, auch andere Ziele desselben Kontos betreffenden Abschlüssen abhängig. Eine P3-Präzisierung betrifft die Herkunft der Nullregel: Die Zuordnung bisheriger Nullmonate bei späterer Zielauswahl ist eine konsistente technische Ableitung zur eindeutigen Korrekturzuordnung, deren Grenzfall im Specpaket nicht ausdrücklich ausformuliert ist. Sie ist kein nachgewiesener Produktwiderspruch. Die positiven Standardabnahmen werden durch keinen der beiden Punkte widerlegt.

## Befunde

### R-1 · P3 · Herkunft der technischen Nullbindung kenntlich machen

- **Stelle:** `ARCHITECTURE-SPINE.md:140`.
- **Quellen:** `monatsueberschuesse.md:15–20` verlangt Übernahme der gesamten noch nicht zugeordneten Vormerkung und Bindung ihrer Herkunftsmonate. `monatsueberschuesse.md:58` regelt für Nullüberschuss nur, dass keine neue positive Anrechnung oder Sparbelastung entsteht. Die Quelle entscheidet nicht ausdrücklich, ob ein Monat ohne Überschuss und ohne Auswahl bereits als übernehmbare Vormerkung zählt.
- **Beobachtung:** Die Spine bindet bei späterer Auswahl ausdrücklich auch sämtliche offenen Nullnachweise, ohne einen Betrag zu erhöhen. Für einen Nullmonat mit bereits zum Monatsende ausgewähltem Ziel ist das Bewahren dieser historischen Auswahl direkt aus der Quelle ableitbar. Die zusätzliche Übernahme eines Nullmonats, der am Monatsende kein Ziel hatte, ist eine konsistente technische Grenzfallableitung: Sie hält auch für einen später erstmals positiven Korrekturbetrag genau ein Ziel fest. Die Quellen formulieren diese Ableitung nicht ausdrücklich.
- **Sichtbare Folge:** Oktober endet ohne Ziel mit 0 €. Im November wird B ausgewählt und später gelöscht. Eine danach günstigere historische Oktoberausgabe erzeugt einen positiven Oktoberüberschuss. Nach der Spine bleibt dieser Monat wegen seiner zwischenzeitlichen Nullzuordnung zu B verbraucht. Ohne diese zusätzliche Bindung wäre noch eine Vormerkung des erst später positiven, zuvor unzugeordneten Monats denkbar. Die Source-of-Truth legt diese Alternative nicht ausdrücklich fest.
- **Empfehlung:** Die Nullbindung als aus der Herkunftsregel abgeleitete technische Präzisierung kennzeichnen und den konkreten Ablauf einschließlich späterer Löschung als Prüfbeispiel in der Arbeitsgrundlage festhalten. Nicht als bereits wörtlich vom Nutzer entschiedene Regel ausgeben. Keine zusätzliche Nutzerbestätigung und keine neue Produktfunktion sind allein deshalb erforderlich; es handelt sich um Herkunftsgenauigkeit, nicht um einen bewiesenen Widerspruch.

### R-2 · P2 · Zwingender vollständiger Nachhollauf kann Ziellöschung zusätzlich blockieren

- **Stellen:** `ARCHITECTURE-SPINE.md:142`, `:123` und `:152`.
- **Quellen:** `monatsueberschuesse.md:17` verlangt ausdrücklich Nachholen bei Zielauswahl; `:27–30` verlangt Löschen samt Fortschritt und Bewahren verbrauchter Herkunft, formuliert dafür aber keinen erfolgreichen vollständigen Nachhollauf als Vorbedingung. `:47` verlangt bei einer fehlgeschlagenen Übernahme Erhalt bestehender Vormerkungen und atomare Wirkung.
- **Beobachtung:** AD-8 verlangt vor jeder Ziellöschung, dass fällige Monate nachgeholt werden. AD-7 rollt den gesamten Anwendungsfall bei Grenzüberschreitung zurück. Damit kann auch die Löschung eines Ziels, dessen Fortschritt gerade entfernt werden soll, oder eines unbeteiligten Ziels an einer ausstehenden Anrechnung scheitern. Die explizite Ausnahme für manuelle Fortschrittseingabe in AD-9 zeigt, dass ein blockierter Nachhollauf als Zustand bereits berücksichtigt wurde; für die Löschung fehlt eine entsprechende Aussage.
- **Beispiel:** Ziel A steht am sicheren Maximum; ein verspäteter Abschluss für A würde 1 Cent ergänzen. Der Nutzer möchte Ziel B oder A löschen. Nach dem Wortlaut muss zunächst die unzulässige Addition erfolgen, der Nachhollauf scheitert und die Löschung wird zurückgerollt. Diese neue Verfügbarkeitskopplung folgt nicht zwingend aus der Quelle.
- **Kleinste Korrektur:** Den verpflichtenden vorgelagerten Abschluss auf Zielauswahl/-wechsel begrenzen. Bei Ziellöschung unter derselben Kontosperre und in derselben äußeren Transaktion bestehende Zuordnungen sowie die Herkunft noch unbehandelter abgeschlossener Monate mit historischer Monatsendeauswahl dieses Ziels dauerhaft als verbraucht sichern, ohne den unmittelbar entfallenden Zielstand zuvor noch zu erhöhen. Danach Ziel/Fortschritt löschen und die Auswahl für den offenen Monat leeren. Fällige Monate anderer Ziele bleiben nachholbar und sind keine Löschvoraussetzung. Die Sicherung kann durch Monatsnachweise oder einen gleichwertigen Ziel-Tombstone in Verbindung mit der erhaltenen Auswahlhistorie geschehen; die Spine muss hierfür keine Tabellenform vorschreiben.
- **Warum keine neue Nutzerregel:** Bereits geschlossene Monate bleiben dem historisch ausgewählten Ziel zugehörig; dessen Löschung entfernt den Fortschritt und erlaubt keine erneute Vormerkung oder Umleitung. Die Korrektur vermeidet ausschließlich eine nutzlose Zwischenaddition und die Kopplung an nicht betroffene Ziele. Die Quelle verlangt weder diese Zwischenaddition noch den Abschluss aller anderen fälligen Monate als Löschvoraussetzung. Die äußere Transaktion bewahrt die atomare Löschung und verhindert ein Zeitfenster zwischen Herkunftssicherung und Löschen.

## CAP-Abgleich

| Fähigkeit | Quelle | Deckung in der Spine | Bewertung |
| --- | --- | --- | --- |
| CAP-1: deutsche Texte ohne systemseitige Zeitzonenerläuterung | `SPEC.md:27–29`, `:42`; `brownfield.md:9`, `:22–23` | AD-5 behält `Europe/Berlin` intern; AD-10 entfernt systemseitige Erläuterungen und erhält nutzereigene Texte. Capability Map ordnet CAP-1 den Angular-Texten zu. | Abgedeckt. Das Verbot umfasst nach dem allgemeinen Wortlaut auch Hilfs- und Screenreadertexte. Kein Filtern selbst vergebener Namen. |
| CAP-2: eigener Ausgabenbereich und konsistente nächste Monatsansicht | `SPEC.md:30–32`, `:43`, `:68`; `brownfield.md:10`, `:24–25` | AD-10 bestimmt drei Hauptbereiche, Monat als Start, vollständige Ausgabenverwaltung im eigenen Bereich und Neuladen der nächsten Monatsansicht. AD-7 liefert den gemeinsamen Snapshot für Budget und Ausgabensumme. | Abgedeckt. Die im Specpaket markierte Annahme zum Mitumzug der Historie wird übernommen; die Spine erfindet den Umfang nicht. |
| CAP-3: rote zugängliche Abmeldeaktion und Cleanup | `SPEC.md:33–35`, `:51`; `brownfield.md:11`, `:26` | AD-10 bestimmt dieselbe zugängliche rote Aktion in allen angemeldeten Hauptbereichen; AD-3 erhält Widerruf und Verwerfen persönlicher Daten/später Antworten. | Abgedeckt. Konkrete Farbe und Zustände dürfen der späteren UI-Arbeit überlassen bleiben. |
| CAP-4: Überschuss, Vormerkung, Auswahl, Korrektur, signierter Fortschritt | `SPEC.md:36–38`, `:44–50`; vollständige `monatsueberschuesse.md` | AD-1/4/5/7/8/9/10 regeln Eigentümer, Autorisierung, exakte Beträge, Atomarität, Herkunft, Differenzen, Job und Übergang. | Die expliziten Abnahmen sind vollständig abgedeckt. Grenzfallpräzisierungen R-1/R-2 beachten. |

## Vollständiger Abgleich der verbindlichen Monatsabnahmen

Die Zeilen beziehen sich auf die Tabelle in `monatsueberschuesse.md:49–69`.

| Fall | Architekturregel und erwartete Wirkung | Ergebnis |
| --- | --- | --- |
| Aktivierung im Oktober, ältere Septemberdaten | AD-8 schließt Monate vor dem unveränderlichen Erstaktivierungsmonat aus; AD-9 holt nur ab Aktivierung nach. | Erfüllt. Der gesamte Aktivierungsmonat zählt, kein Start erst im Folgemonat. |
| Aktivierung ohne jemals ausgewähltes Ziel | AD-1 besitzt Aktivierung getrennt von Zielen; AD-8 führt unzugeordnete Monatsnachweise; AD-10 zeigt Aktivierung und Vormerkung. | Erfüllt. Kein notwendiges Ziel und keine automatische Zielanlage/-auswahl. |
| Zwei offene Monate, danach Auswahl | AD-8 holt Fälliges nach und übernimmt alle offenen Vormerkungen atomar; Datenbank-Eindeutigkeit schützt die Herkunftsmonate. | Erfüllt. 50 € + 200 € + 100 € = 350 €, danach keine offene Vormerkung und keine Wiederholungswirkung. |
| Historische Änderung vor Zuordnung | AD-9 ersetzt nur die betreffende Monatsvormerkung. | Erfüllt. 200 € werden zu 150 €; 100 € des anderen Monats bleiben erhalten. |
| Positiver Monatsrest mit Ziel | AD-5/8 bestimmen historischen Budgetstand, eigene Monatssumme und `max(0, Budget − Ausgaben)`; AD-7/9 wenden atomar auf das eigene Ziel an. | Erfüllt. 1.000 € − 800 € + 50 € = 250 € Fortschritt; keine andere Ziel-/Kontowirkung. |
| Null, negativer Rest, fehlendes Budget | AD-8 unterscheidet Zustand ohne Budget und nichtnegative Überschüsse. Null hat keine finanzielle Wirkung; AD-9 kann frühere Wirkungen zurücknehmen. | Erfüllt; die spätere Bindung zuvor unzugeordneter Nullmonate ist R-1. Kein fiktiver Überschuss bei fehlendem Budget. |
| Nachholen nach Ausfall | AD-8 verwendet historische Monatsendeauswahl; AD-9 arbeitet beim Start und regelmäßig, dauerhaft und wiederholbar. | Erfüllt. Kein Browser, keine Sitzung und kein einmaliger Uhrzeittrigger erforderlich. |
| Historische Ausgabe teurer | AD-9 addiert ausschließlich neuen minus zuletzt berücksichtigten Überschuss auf den aktuellen Fortschritt des ursprünglichen Ziels. | Erfüllt. Keine Rückschreibung eines rekonstruierten Gesamtfortschritts. |
| Historische Ausgabe günstiger/gelöscht | AD-9 behandelt Betrag und Löschung des betroffenen historischen Monats in derselben Transaktion. | Erfüllt. Nur positive Differenz, kein erneutes Addieren des Gesamtmonats. |
| Manuelle Bearbeitung neben Automatik | AD-9 erhält Herkunftsmetadaten; AD-7 serialisiert den aktuellen Gesamtbetrag unter derselben Kontosperre. | Erfüllt. Manueller Stand 300 € plus −50 € = 250 €. |
| Korrektur unter null | AD-5/9 erlauben signierten Gesamtfortschritt; AD-5 begrenzt nur den Balken. | Erfüllt. 20 € − 50 € = −30 €, tatsächlicher negativer Prozentwert. |
| Anrechnung auf negativen Fortschritt | AD-9 verwendet die Differenz auf dem aktuellen signierten Fortschritt. | Erfüllt. −30 € + 100 € = 70 €. |
| Zielwechsel A nach B | AD-8 bewahrt historische Auswahl und Zuordnung; Änderung gilt offenem und späteren Monat. | Erfüllt. Oktoberkorrektur trifft A; Novemberabschluss B. |
| Ausgewähltes Ziel löschen | AD-8 entfernt Ziel/Fortschritt, verbraucht alte Zuordnungen, leert offene Auswahl und erhält bestehende offene Vormerkungen; AD-10 erweitert die Löschbestätigung. | Fachwirkung erfüllt; mögliche zusätzliche Erfolgsbedingung siehe R-2. |
| Historische Korrektur nach Ziellöschung | AD-8/9 behalten Ziel-ID und verbrauchte Herkunft ohne Cascade/SET NULL. | Erfüllt. Kein Wiederanlegen, keine neue Vormerkung, keine Umleitung. |
| Ziel übererfüllt | AD-5 zeigt tatsächlichen Betrag/Prozent und begrenzt nur den Balken bei 100 %. | Erfüllt. Zielbetrag bleibt positiv; tatsächlicher Fortschritt darf darüber liegen. |
| Commitfehler, Parallelität, Grenzüberschreitung | AD-5 prüft exakte Grenzen, AD-7 bindet alles an eine Verbindung/Transaktion und Kontosperre, AD-8 bewahrt eindeutige Herkunft, AD-9 erlaubt nach Rollback nur technische Fehlermetadaten. | Erfüllt. Kein Teilcommit und keine verlorene oder doppelte Fortschrittswirkung. |

## Stille Regeln und Nichtausweitungen

| Prüfaspekt | Abgleich |
| --- | --- |
| Monat und Datum | AD-5/7 verwenden weiterhin den serverseitigen Berliner Kalender; ein fachlicher Zeitpunkt nach Sperrerwerb vermeidet unterschiedliche Monatszuordnungen innerhalb desselben Anwendungsfalls. Ausgabedatum bleibt bei Bearbeitung unverändert. Keine zusätzliche Gerätezeitzone wird eingeführt. |
| Historisches Budget | AD-1/5/8 führen monatswirksame Stände; heutige Budgetänderungen ändern abgeschlossene Budgetstände nicht. Dies folgt aus dem laufenden/folgenden Wirksamkeitsbereich der Spec und dem historischen Monatsbudget, nicht aus einer neuen rückwirkenden Budgetfunktion. |
| Fehlendes Budget | Ein technischer Nachweis ohne Budget erzeugt keinen Geldbetrag und wird nicht wie ein Nullüberschuss mit vorhandenem Budget übernommen. Weil Budgetänderungen abgeschlossene Monate nicht rückwirkend ändern, entsteht dadurch keine stille spätere Auffüllung. |
| Null mit historischer Auswahl | Herkunft und Auswahl müssen auch bei finanziell wirkungslosem Abschluss erhalten bleiben, damit eine spätere positive Korrektur nicht an das heutige Ziel fließt. Das ist eine notwendige Sicherung der historischen Monatsendeauswahl. Davon getrennt ist die spätere Übernahme ohne damalige Auswahl, R-1. |
| Keine Sparbelastung aus negativem Monatsrest | `max(0, …)` verhindert eine neue negative Anrechnung. Ein negativer Fortschritt entsteht weiterhin durch zulässige manuelle Eingabe oder Rücknahme einer früheren positiven Wirkung; keine separate Korrekturschuld. |
| Manuelle Werte | Die Spine übernimmt den signierten Eingabebereich aus der ausdrücklich markierten Spec-Annahme. Sie rekonstruiert keine Beiträge und löscht keine technische Herkunft. Dass ein neuer Zielbestand weiterhin bei null beginnt, gehört zum fortgeltenden Bestand und ist in `monatsueberschuesse.md:45` ausdrücklich erhalten. |
| Herkunft nach Übernahme | Noch offene Monate werden vollständig zusammen übernommen, behalten aber getrennte Herkunft; spätere Korrekturen treffen nur das damals zugeordnete Ziel. Keine Verteilung auf mehrere Ziele. |
| Löschung | Das technische Behalten einer Ziel-ID bedeutet keine Wiederherstellung des gelöschten Ziels. Fachliche Ziele und Fortschritt verschwinden; historische Herkunft bleibt verbraucht. Kontolöschung/Aufbewahrung werden ausdrücklich vor echten Nutzerdaten geklärt und nicht durch diese Ziellöschregel entschieden. |
| Name-only-Ausgabenänderung | Keine finanzielle Korrektur ist eine zulässige technische Optimierung bei identischer Berechnungsbasis, keine neue Einschränkung der Bearbeitung. |
| Ausgaben/Budgetformel | AD-5 erhält Budget minus eigene laufende Monatsausgaben; Sparanrechnung erzeugt keine Ausgabe. Historie umfasst weiterhin alle Monate. |
| UI-Verlauf | Technische Monatsnachweise und sichtbare Vormerksumme führen keinen vom Spec ausgeschlossenen Beitragsverlauf ein. Die Spine fordert einen solchen nicht. |
| Aktivierung/Deaktivierung | Unveränderlicher Erstaktivierungsmonat verhindert rückwirkende Neuaktivierung vor dem ersten Start. Die Spine erfindet keine Deaktivierungs- oder Pausenfunktion und keine Regeln für deren zeitliche Lücken. |
| Produktgrenzen | Kein Bankimport, keine Einnahmenerfassung, keine gemeinsame Finanzansicht, keine zusätzliche Währung/Zeitzone und keine Produktionsfreigabe. |

## Abgleich der jüngsten technischen Nutzerentscheidungen

| Bestätigte Entscheidung | Deckung |
| --- | --- |
| Hintergrundlauf in bestehender Java-Anwendung | Design Paradigm, AD-6 und AD-9; kein zusätzlicher separater Jobdienst. |
| Eigener begrenzter DB-Zugang | AD-4 benennt getrennten Worker-Kontext und konkrete minimale Rechte unter RLS; nur eng begrenzte Discovery ohne Finanzwerte ist kontoübergreifend. |
| Eigenes Modul Monatsüberschüsse | AD-1 weist Aktivierung, Auswahlhistorie, Herkunft, Vormerkung und Verarbeitungszustand eindeutig `monthlysurplus` zu. |
| Ausgaben und Budget isolieren | AD-1 verbietet Geschwisterimporte und fremde SQL-/Repositoryzugriffe. AD-7 ersetzt die bisherige gemeinsame SQL-Ansicht durch öffentliche Projektionen in gemeinsamem Snapshot. |
| Gemeinsame Transaktion zusammengehöriger Änderungen | AD-7/8/9 verlangen eine physische Verbindung, äußeren Commit, gleiche Kontosperre und vollständigen Rollback. |
| Vollständiger Wechsel auf API v2 | AD-2 bezieht ausdrücklich Zugang ein; AD-10 nennt Anmeldung/Refresh/Logout, Frontend, Sicherheitsregeln, Generatoren und Proxy. Kein dauerhaftes v1/v2-Mischfrontend. |
| V1-Ablösung vor Featureaktivierung | AD-10 sperrt Automatik und negative manuelle Werte während des Parallelbetriebs, beendet v1 vor Freigabe und verhindert datenzerstörenden v1-Rollback nach ersten Wirkungen. |
| Nur Spine als Arbeitsgrundlage | Die Datei bleibt Zielarchitektur; Abstimmung anderer Planungsdokumente und Folge-Stories wird als spätere Arbeit bezeichnet. Historische Done-Stories bleiben historische Evidenz. |

## Reichweite und verbleibende Arbeit

Die vorliegenden Quellen entscheiden fachlich die positive Anrechnung, Vormerkung, Herkunft, Korrektur und negative Fortschrittsdarstellung. Keine dieser Kernfragen wird in der Spine erneut als offen behandelt. Die vormals offenen technischen Fragen nach internem Ausführungskontext und API-Evolution sind durch AD-2/4/10 und die jüngsten Nutzerentscheidungen beantwortet.

Konkrete DTOs, v2-Pfade, Tabellen-/Klassenformen, Wiederholungsintervalle und Batchgrößen können vor beziehungsweise in der Implementierung festgelegt werden, solange die hier gebundenen Regeln gelten. Der geplante Übergangsablauf ist als Architektur vorhanden; ein ausführbarer Release-/Ablöseplan ist erst spätere Umsetzung. Neue Produktionsfreigaben, neue Sprint-IDs oder rückwirkend geänderte Fertigmeldungen wurden durch diesen Abgleich nicht eingeführt. Keine Tests wurden ausgeführt, weil ausschließlich Dokumentquellen abgeglichen wurden.
