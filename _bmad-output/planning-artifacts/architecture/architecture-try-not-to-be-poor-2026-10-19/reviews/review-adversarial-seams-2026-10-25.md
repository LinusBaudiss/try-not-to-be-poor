# Adversarial Seams Review — 2026-10-25

**Gegenstand:** `ARCHITECTURE-SPINE.md` im selben Architekturordner, vollständig erneut gelesen nach der Präzisierung von Nullbindung und Ziellöschung.

**Linse:** Zwei unabhängig gebaute Einheiten eine Ebene unterhalb der Spine konstruieren, die die konkreten AD-Regeln jeweils erfüllen, zusammen aber eine relevante Inkonsistenz erzeugen. Fehlende Klassen-/Tabellenformen, noch auszuarbeitende DTOs und beliebige Implementierungsfehler zählen nicht als Befund. Prüfmaßstab ist die konfigurierte Adversarial-Linse aus `bmad-architecture/customize.toml` in Verbindung mit `references/reviewer-gate.md`.

## Urteil

**PASS nach gezielter Nachprüfung.** Die Erstprüfung fand zwei konkrete P2-Nähte: fehlender gemeinsamer fachlicher Monatsanker für zusammengesetzte Reads und fehlendes Beenden bereits zugelassener v1-Leseanwendungsfälle vor Freigabe negativer Werte. Beide wurden im erneut gelesenen aktuellen Wortlaut geschlossen. Die übrigen geprüften Modul-, Herkunfts-, Mutations- und Wiederholungsnähte sind durch die expliziten Regeln bereits geschlossen. Es bleibt kein belegter materieller Befund aus dieser Linse offen. Die Erstbefunde bleiben unten als nachvollziehbare Prüfevidenz erhalten; sie sind keine noch offenen Aufgaben.

## S-1 · P2 · Behoben — Ein gemeinsamer DB-Snapshot friert den laufenden Monat nicht ein

**Erststelle:** AD-7, Absatz beginnend mit „Jede Mutation …“, zum Erstprüfzeitpunkt Zeile 126. AD-5 legt den Berliner Kalender fest. AD-7 erfasst den fachlichen Zeitpunkt ausdrücklich für Mutationen nach Sperrerwerb; für reine zusammengesetzte Monats-/Automatikansichten fordert es dagegen nur eine gemeinsame read-only REPEATABLE-READ-Verbindung.

**Unabhängig zulässige Einheiten:**

1. Eine Implementierung der öffentlichen Budget-/Ausgabenprojektionen liest für den angegebenen Monat aus dem gebundenen DB-Kontext und verändert keine fremden Daten. Der gemeinsame Kalender liefert auf Nachfrage den jeweils aktuellen Berliner Monat.
2. Eine separat gebaute zusammengesetzte Monatsansicht öffnet genau eine read-only REPEATABLE-READ-Transaktion und ruft beide Projektionen darin auf. Mangels eines explizit eingefrorenen Read-Monats darf sie für die öffentliche Projektion beziehungsweise die Monatskennzeichnung jeweils erneut den gemeinsamen Kalender abfragen. Sie verwendet also denselben Kalender und denselben DB-Snapshot, aber keinen zugesicherten gemeinsamen Kalenderstand.

**Konkreter Gegenfall:** Oktober enthält 800 € Ausgaben bei 1.000 € Budget. Die Anfrage beginnt am 31. Oktober um 23:59:59,999 Berliner Zeit. Die erste Teilprojektion und die Monatskennzeichnung bestimmen Oktober. Zwischen den Modulaufrufen beginnt November. Die andere Teilprojektion fragt nun November ab und liefert 0 € Ausgabensumme. Der Datenbank-Snapshot enthält völlig konsistente Oktober- und Novemberdaten; die zusammengesetzte Antwort kann trotzdem „Oktober“, 1.000 € Budget, 0 € Ausgaben und 1.000 € Rest enthalten. Der korrekte Oktoberrest wäre 200 €.

**Warum eine Architektur-Naht:** Gleiche Zeitzone und gleiche Transaktion verhindern weder mehrere Kalenderabfragen noch das Überschreiten der Monatsgrenze dazwischen. Die klare einmalige Zeitbestimmung ist für Mutationen beschrieben, die Snapshotregel für Reads bildet einen anderen Vertrag. Das ist kein Vorschlag für eine neue Produktfunktion, sondern eine fehlende gemeinsame Eingabe an unabhängig gebaute Modulprojektionen.

**Kleinste Schließung:** Für jeden zusammengesetzten Leseanwendungsfall genau einen fachlichen Zeitpunkt beziehungsweise Monat an der äußeren Koordinationsgrenze bestimmen und allen Modulprojektionen sowie der Antwortkennzeichnung übergeben. Die Read-Transaktion behält zusätzlich ihren gemeinsamen DB-Snapshot. Eine Uhr pro Projektionsaufruf ist dadurch ausgeschlossen.

**Prüfbeispiel:** Testuhr überschreitet zwischen Budget- und Ausgabenprojektion die Monatsgrenze. Beide erhalten denselben zuvor erfassten Herkunfts-/Ansichtsmonat; Rückgabe und Berechnung bleiben einheitlich Oktober oder einheitlich November.

## S-2 · P2 · Behoben — Vor dem Cutover zugelassene v1-GETs können den negativen v2-Bestand lesen

**Erststelle:** AD-10, Übergangsschritt 3, zum Erstprüfzeitpunkt Zeile 167. Dieser Schritt verlangte neue v1-Zugriffe abzuweisen und laufende v1-Mutationen zu beenden, bevor signierter Fortschritt und Automatik freigegeben werden. Die bereits zugelassenen Leseanwendungsfälle waren darin nicht genannt.

**Unabhängig zulässige Einheiten:**

1. Die Versionierungs-/Freigabeeinheit schließt die Zulassung neuer v1-Anfragen, wartet laufende v1-Mutationen ab und gibt danach die v2-Funktion frei. Damit erfüllt sie die konkret formulierte Reihenfolge des Übergangsschritts.
2. Der v1-Leseadapter übernimmt bereits zugelassene GETs und liest den aktuellen eigenen Zielbestand über öffentliche Modulzugänge im normalen Webkontext. Er ändert keine Daten, verwendet keine falsche Rolle und benötigt deshalb keine Mutationssperre. Seine Arbeit muss nach dem bisherigen Wortlaut nicht vor dem Freigabezeitpunkt abgeschlossen sein.

**Konkreter Gegenfall:** Ein GET der v1-Zielliste wird vor dem Sperren neuer v1-Anfragen zugelassen, wartet aber noch auf einen Ausführungsplatz oder eine DB-Verbindung. Der Cutover beendet alle v1-Mutationen und aktiviert v2. Ein v2-Anwendungsfall setzt einen Zielstand auf −30 € und committet. Erst anschließend liest der bereits zugelassene v1-GET denselben nun negativen Zielstand. Die Antwort des eingefrorenen v1-Vertrags kann damit `progressCents: -3000` enthalten, obwohl v1 auf nichtnegative Antwortwerte festgelegt ist.

**Warum eine Architektur-Naht:** Die allgemeine Absicht „v1 erhält keine negativen Antworten“ und die Prüfung im ungefährlichen Parallelbetrieb schließen dieses konkrete Zeitfenster noch nicht. Der Cutover definiert die Freigabegrenze bislang allein über laufende Mutationen; der reine Leser darf seine DB-Arbeit danach noch beginnen. Die Einheiten können damit die genannte Übergangsreihenfolge und jeweils ihre Modul-/Transaktionsregeln erfüllen, ohne eine sichere gemeinsame Versionsgrenze zu besitzen.

**Kleinste Schließung:** Vor Freigabe sämtliche bereits zugelassenen v1-Anwendungsfälle einschließlich GETs und zugehöriger DB-Arbeit beendet oder wirksam abgebrochen haben. Abgebrochene Arbeit darf später nicht wieder auf den nun signierten Bestand zugreifen. Gleichwertig wäre ein ausdrücklich definierter sicherer Abbruch-/Antwortmechanismus für noch laufende v1-Leser; ein zusätzlicher Mechanismus ist nicht nötig, wenn alle v1-Anwendungsfälle vor Freigabe beendet werden.

**Prüfbeispiel:** Einen v1-GET unmittelbar vor seinem ersten DB-Lesezugriff blockieren. Der Cutover darf die signierte v2-Funktion erst freigeben, wenn auch dieser GET beendet oder vollständig abgebrochen ist. Anschließend darf kein verbliebener v1-Leser erstmals Daten lesen.

## Weitere gezielt angegriffene Nähte

| Naht und Angriffsversuch | Warum kein verbleibendes Gegenbeispiel aus den gelesenen Regeln folgt |
| --- | --- |
| expenses und budget lesen zur gleichen Monatsansicht unabhängig, während eine Mutation dazwischen committet | AD-7 schreibt denselben physischen read-only REPEATABLE-READ-Kontext vor. Ein zweiter Snapshot oder eine zweite Verbindung wäre ein ausdrücklicher Regelverstoß. Davon getrennt ist S-1 zur Kalenderzeit. |
| monthlysurplus schreibt eigenständig in savingsgoals oder exportiert fremde Repositorytypen | AD-1 verbietet Geschwisterimporte, fremde SQL-/Repositoryzugriffe und Datenbesitz außerhalb der Eigentümermodule. Öffentliche Zugänge werden von außen koordiniert; die Verantwortung ist nicht doppelt vergeben. |
| Ein savingsgoals-Aufruf committet vor dem Monatsnachweis oder eröffnet die HTTP-Verbindung im Worker | AD-7 fordert dieselbe physische Verbindung/Transaktion und verbietet innere Commits sowie Verbindungen der anderen Rolle. Ein autonomer Fortschrittscommit wäre kein zulässiger unabhängiger Entwurf. |
| Worker verwendet zur Verarbeitung einen selbst gewählten Fremdkontext oder liest Finanzdaten global | AD-4 bindet den Kontokontext an die gespeicherte Aktivierung, erneute Prüfung unter Kontosperre und erzwungene RLS. Die globale Discovery-Ausnahme liefert ausdrücklich keine Finanzwerte und ist eng auf aktivierte Automatikzeilen beschränkt. |
| Ausgabenänderung committet, Korrektur des Herkunftsmonats fällt aus | AD-9 bindet Betragsänderung/Löschung, Neuberechnung, wirksamen Nachweis und Fortschrittsdifferenz an dieselbe Transaktion; AD-7 bestätigt erst nach äußerem Commit. Ein nachträglicher nur asynchroner Finanzkorrekturpfad widerspräche dem Wortlaut. |
| Historische Ausgabe wird nach manueller Fortschrittseingabe korrigiert | AD-9 verlangt die Differenz zum zuletzt berücksichtigten Monatsüberschuss auf den aktuellen gesperrten Gesamtstand und verbietet die Rekonstruktion aus Monatsanrechnungen. AD-7 serialisiert beide Mutationstypen mit demselben Kontoschlüssel. |
| Zielwechsel bei verspätetem Abschluss | AD-8 verlangt Nachholen vor Auswahl/-wechsel, die historische Monatsendeauswahl und dauerhafte Herkunftsbindung. Eine heutige Zielauswahl darf nicht für alte bereits gebundene Monate verwendet werden. |
| Nullmonat ohne Auswahl wird später positiv korrigiert | AD-8 regelt technische Nullbindung ausdrücklich: offene Nachweise mit Budget werden bei späterer Auswahl einschließlich Nullbeträgen gebunden. Ohne Budget entstehen dagegen keine zu übernehmenden Vormerkungen. Die beiden Kategorien sind nicht mehr austauschbar. |
| Ziellöschung bei fehlendem Nachweis oder späterer historischer Änderung | AD-8 sichert auch unbehandelte geschlossene Monate mit historischer Auswahl des gelöschten Ziels durch dauerhaften Verbrauch, gegebenenfalls Löschmarker plus Auswahlhistorie. AD-9 erhält verbrauchte Wirkung ohne neue Vormerkung oder Umleitung. Das frühere zwingende Nachholen vor Löschung ist entfernt. |
| Überlauf eines ganz anderen Ziels verhindert Ziellöschung | Der aktuelle AD-8-Absatz benötigt keinen vorgelagerten Nachhollauf; andere fällige Ziele bleiben unabhängig nachholbar. Die frühere unnötige Zwischenaddition ist ausdrücklich ausgeschlossen. |
| Zwei Jobs oder Job und HTTP rechnen denselben Monatsbetrag an | Kontosperre, Eindeutigkeit je Konto/Herkunftsmonat und atomare Nachweis-/Fortschrittsänderung schließen die zulässige Doppelanrechnung. Ein zweiter Aufruf liest den bereits wirksamen Nachweis. |
| Fehlerhandler schreibt nach Rollback fiktive wirksame Beträge oder verbraucht Vormerkungen | AD-9 erlaubt außerhalb der fehlgeschlagenen Fachtransaktion ausschließlich technische Fehler-/Wiederholungsmetadaten. Finanzielle Buchung und wirksame Herkunft bleiben der Fachtransaktion vorbehalten. Konkrete Retry-Abstände sind Implementierungsparameter, kein abweichender Finanzvertrag. |
| Ein fehlerhaftes Konto blockiert die gesamte Jobauswahl | AD-9 verlangt eigene Kontotransaktionen, begrenzte Pakete, verzögerte Wiederholung und faire Kontowahl. Eine globale Alles-oder-nichts-Batchtransaktion wäre ausdrücklich ausgeschlossen. |
| API- und Frontendteams wählen unabhängig andere v2-DTOs oder Pfade | AD-2 verlangt den versionierten Vertrag vor Verbraucherimplementierung; AD-10 schließt einen dauerhaften v1/v2-Mix der neuen Oberfläche aus. Die konkrete Form ist als späterer gemeinsamer Vertrag vorgesehen, nicht unabhängig an jeden Verbraucher delegiert. |
| Code-Rollback verwendet alte Rollen-/Schemazugriffe oder kehrt nach ersten signierten Werten zu v1 zurück | AD-10 erlaubt vor Freigabe nur einen gegen den migrierten Schema-/Rollenzustand geprüften v1-kompatiblen Release. Nach ersten signierten Werten/Monatswirkungen ist der v1-Rückfall ausgeschlossen; Abschneiden oder Überschreiben von Daten ist verboten. |

## Gezielte Nachprüfung nach Korrektur

Die aktualisierten Absätze von AD-7 und AD-10 Schritt 3 wurden nach Speicherung gezielt erneut aus `ARCHITECTURE-SPINE.md` gelesen.

| Befund | Sichtbare Schließung | Nachprüfurteil |
| --- | --- | --- |
| S-1: geteilte DB-Sicht, verschiedene laufende Monate | AD-7 gibt jetzt jedem Anwendungsfall genau einen fachlichen Zeitpunkt und daraus abgeleiteten Berliner Monat. Für reine Reads wird dieser vor den Teilabfragen erfasst, für Mutationen nach Sperrerwerb. Die Koordination übergibt ihn an alle öffentlichen Modulzugänge; diese dürfen den laufenden Monat nicht erneut bestimmen. Der gemeinsame REPEATABLE-READ-Kontext bleibt erhalten. | Behoben. Der Gegenfall benötigt nun ausdrücklich verbotene erneute Monatsbestimmung. Die Regel ergänzt die Snapshotgrenze um die fehlende gemeinsame Kalendergrenze. Historische Herkunftsmonate bleiben davon getrennte explizite Fachparameter; die Regel betrifft den laufenden Monat des Anwendungsfalls. |
| S-2: ausstehender v1-GET liest erstmals nach v2-Freigabe | AD-10 Schritt 3 verlangt jetzt das Abschließen oder Abbrechen sämtlicher bereits laufender v1-Anwendungsfälle einschließlich GETs und ihrer DB-Arbeit. Er verbietet zusätzlich ausdrücklich das erstmalige Finanzdatenladen eines zuvor zugelassenen v1-Reads nach Freigabe signierter Werte. Erst danach wird v2 freigegeben. | Behoben. Zulassungsstopp plus vollständige Barriere nimmt dem Gegenfall den noch zulässigen späten DB-Lesezugriff. |

Keine andere konkrete offene Naht wurde bei der gezielten Nachprüfung festgestellt. Die Reviewdatei wurde ergänzt; Hauptdatei und Memlogs wurden nicht geändert. Es wurden keine Implementierungstests ausgeführt. Die beschriebenen Prüffälle sind Anforderungen an spätere Verifikation, kein Nachweis bereits implementierten Verhaltens.
