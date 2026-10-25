# Fachregeln für Monatsüberschüsse

Stand: 2026-10-25. Die Regeln zu Aktivierung, Vormerkung, Zielwechsel/-löschung und negativem Fortschritt beruhen auf Linus’ Entscheidungen. Sie ergänzen CAP-4; die Funktion ist noch nicht umgesetzt.

## Aktivierung und Monatsabschluss

- Die Automatik wird je Nutzerkonto aktiviert; dafür muss noch kein Sparziel vorhanden oder ausgewählt sein. Die erste Aktivierung setzt den frühesten berücksichtigten Monat.
- Aktivierung im Oktober bedeutet: erster Abschluss des Oktobers nach dessen Ende, Anfang November. Der gesamte Oktober zählt; Monate vor Oktober bleiben ausgeschlossen. Eine spätere erste Zielauswahl verschiebt diesen Start nicht.
- Für jeden abgeschlossenen Monat gilt der damals gültige fortlaufende Budgetbetrag. Der Überschuss ist `max(0, Budget − eigene Monatsausgaben)`. Ohne festgelegtes Budget entsteht keine fiktive Vormerkung oder Anrechnung.
- Es zählt die Zielauswahl zum Monatsende. Ein verspäteter Abschluss darf nicht stillschweigend die heutige Auswahl verwenden. Ausfälle können ohne offene Oberfläche und ohne aktive Nutzersitzung nachgeholt werden.
- Monatsüberschüsse müssen nach Herkunftsmonat unterscheidbar bleiben. Wiederholungen und parallele Verarbeitung desselben Monats dürfen dessen Wirkung nicht vervielfachen.

## Ohne Ziel und spätere Zuordnung

- Ohne gültiges ausgewähltes Ziel bleibt ein Überschuss vorgemerkt; kein erstes oder zufälliges Ziel wird automatisch ausgewählt.
- Die App zeigt den vorgemerkten Betrag erkennbar an und bietet die Auswahl eines eigenen Sparziels an. Vormerkungen bestehen unabhängig von einzelnen Sparzielen.
- Bei einer Zielauswahl wird die gesamte noch nicht zugeordnete Vormerkung automatisch dem ausgewählten Ziel angerechnet. Fällige, noch nicht verarbeitete Monatsabschlüsse müssen dabei berücksichtigt werden.
- Beispiel: Oktober 200 € und November 100 € ohne Ziel ergeben 300 € vorgemerkt. Bei Auswahl eines Ziels mit 50 € Fortschritt wird daraus 350 € Fortschritt und 0 € vorgemerkt. Erneute Auswahl oder Wiederholung rechnet dieselben 300 € nicht nochmals an.
- Herkunftsmonate bleiben auch nach Übernahme unterscheidbar und ab dann an dieses Ziel gebunden. Spätere Korrekturen treffen das zugeordnete Ziel.
- Eine Änderung historischer Ausgaben vor Zielauswahl korrigiert zuerst den jeweiligen vorgemerkten Monatsbetrag. Vormerkungen sind keine negative Korrekturschuld; der Monatsüberschuss selbst bleibt wegen der Formel mindestens null.

## Zielwechsel und Löschen

- Ein Zielwechsel gilt für den noch offenen Monat und spätere Monate. Bereits zugeordnete Monatsüberschüsse bleiben beim bisherigen Ziel; sie werden nicht verschoben.
- Bei einem Wechsel werden noch offene Vormerkungen vollständig dem neu ausgewählten Ziel zugeordnet. Dies verändert keine bereits erfolgte Zuordnung.
- Beispiel: Oktober wurde Ziel A zugeordnet. Ein Wechsel zu B im November führt den Novemberüberschuss zu B; eine spätere Korrektur des Oktobers verändert weiterhin A.
- Das Löschen entfernt das Ziel einschließlich seines tatsächlichen Fortschritts. Frühere Anrechnungen dieses Ziels werden weder auf ein anderes Ziel übertragen noch erneut vorgemerkt.
- Wird das ausgewählte Ziel gelöscht, fehlt danach eine gültige Auswahl: weitere Monatsüberschüsse werden vorgemerkt. Bereits bestehende Vormerkungen bleiben erhalten.
- Der bestehende Löschdialog muss erklären, dass das Ziel und sein Fortschritt entfallen und bei aktiv ausgewähltem Ziel weitere Überschüsse bis zur nächsten Auswahl vorgemerkt werden.
- Spätere Ausgabenänderungen eines bereits dem gelöschten Ziel zugeordneten Monats erzeugen weder eine Wiederanlage des Ziels noch eine neue Vormerkung oder Anrechnung auf ein anderes Ziel. Die technische Monatsverarbeitung muss die frühere Zuordnung weiterhin als verbraucht erkennen.

## Historische Korrekturen und manuelle Bearbeitung

- Noch vorgemerkt: Überschuss des Herkunftsmonats neu berechnen und nur seine Vormerkung anpassen.
- Bereits zugeordnet: `Korrekturdifferenz = neuer Monatsüberschuss − zuvor berücksichtigter Monatsüberschuss`. Nur diese Differenz auf den aktuellen Fortschritt des zugeordneten, noch vorhandenen Ziels anwenden.
- Beispiel: Ursprünglich 200 € angerechnet, nach teurer gewordener Ausgabe noch 150 € Überschuss: Korrektur −50 €. Wurde der Gesamtfortschritt zwischenzeitlich manuell auf 300 € gesetzt, ergibt die Korrektur 250 €.
- Korrekturen können auch positiv sein, etwa nach Verringerung oder Löschen einer historischen Ausgabe. Wiederholungen derselben Korrektur wirken nicht doppelt.
- Manuelle Eingabe ersetzt weiterhin den Gesamtfortschritt; sie löscht nicht die technische Herkunft und Zuordnung früherer Monatsanrechnungen. Die nächste automatische Änderung arbeitet mit einer Differenz auf dem dann aktuellen Gesamtfortschritt.
- Zeitgleiche manuelle und automatische Änderungen müssen in einer eindeutigen Reihenfolge verarbeitet werden, ohne eine bereits bestätigte Änderung durch veraltete Daten zu verlieren.

## Negativer Fortschritt und Grenzen

- 20 € aktueller Fortschritt und −50 € Korrektur ergeben −30 € Fortschritt. Es wird weder auf null gekürzt noch ein separater offener Korrekturbetrag angelegt.
- Eine spätere Anrechnung von 100 € erhöht −30 € auf 70 €.
- Der Fortschritt liegt im sicheren Bereich von −9.007.199.254.740.991 bis +9.007.199.254.740.991 Cent. Die einheitliche Anwendung auf manuelle Eingaben ist als Annahme in `SPEC.md` gekennzeichnet. Zielbeträge bleiben positiv; ein neu angelegtes Ziel startet weiterhin mit 0 €.
- Betrag und Prozentwert zeigen den tatsächlichen Stand, auch negativ oder über 100 %. Bei −30 € Fortschritt und 100 € Ziel erscheinen −30 € und −30 %; der Balken steht bei 0 %. Bei 150 € und 100 € Ziel erscheinen 150 € und 150 %, der Balken endet bei 100 %.
- Eine zu große Summe oder Anrechnung darf nicht gerundet, abgeschnitten oder teilweise als erfolgreich bestätigt werden. Bereits gespeicherte Vormerkungen bleiben bei fehlgeschlagener Übernahme erhalten; Fortschrittsänderung und wirksame Zuordnung dürfen nicht auseinanderlaufen.

## Verbindliche Abnahmefälle

| Fall | Erwartetes Ergebnis |
| --- | --- |
| Aktivierung im Oktober, historische Septemberdaten vorhanden | Oktober wird ab seinem Abschluss berücksichtigt; September erhält keine nachträgliche Anrechnung. |
| Aktivierung ohne Ziel | Oktoberüberschuss 200 € wird nach Monatsende vorgemerkt, obwohl noch nie ein Ziel ausgewählt wurde. |
| Zwei offene Monate, dann Zielauswahl | 200 € + 100 € Vormerkung erhöhen 50 € Fortschritt auf 350 €; vorgemerkt danach 0 €, keine Doppelwirkung bei Wiederholung. |
| Historische Änderung vor Zuordnung | Oktober-Vormerkung sinkt von 200 € auf 150 €; mit 100 € November erhält das später gewählte Ziel insgesamt 250 €. |
| Positiver Monatsrest mit Ziel | 1.000 € Budget minus 800 € Ausgaben erhöht 50 € Fortschritt auf 250 €; andere Ziele und Konten bleiben unberührt. |
| Null, negativer Rest oder fehlendes Budget | Keine neue positive Anrechnung; keine neue Sparbelastung. Eine frühere Anrechnung kann durch eine historische Korrektur zurückgenommen werden. |
| Nachholen nach Ausfall | Bereits fällige Monate werden einmal verarbeitet. Die zum jeweiligen Monatsende geltende Auswahl bleibt maßgeblich; eine spätere Zielauswahl übernimmt offene Vormerkungen. |
| Historische Ausgabe teurer | Zuvor 200 € angerechnet, neuer Überschuss 150 €: nur −50 € auf das ursprüngliche Ziel anwenden. |
| Historische Ausgabe günstiger oder gelöscht | Nur die Differenz des neuen Überschusses ergänzen, ohne den gesamten Monatsbetrag nochmals anzurechnen. |
| Manuelle Bearbeitung neben Automatik | Manueller Stand 300 € plus Korrektur −50 € ergibt 250 €; keine Rekonstruktion allein aus Monatsüberschüssen. |
| Korrektur unter null | 20 € minus 50 € ergibt −30 €, mit tatsächlichem negativem Prozentwert und Balken bei 0 %. |
| Anrechnung auf negativen Fortschritt | −30 € plus 100 € ergibt 70 €. |
| Zielwechsel A nach B | Oktober bleibt A zugeordnet; November geht an B. Eine spätere Oktoberkorrektur verändert A. |
| Ausgewähltes Ziel löschen | Ziel und Fortschritt entfallen; keine Umleitung früherer Anrechnungen. Spätere Überschüsse werden vorgemerkt und bei neuer Auswahl angerechnet. |
| Historische Korrektur nach Ziellöschung | Kein Wiederanlegen, keine neue Vormerkung und keine Anrechnung auf ein anderes Ziel für den zuvor verbrauchten Monat. |
| Ziel übererfüllt | Tatsächlichen Betrag und Prozentwert zeigen, nur den Balken bei 100 % begrenzen. |
| Commitfehler, Parallelität, Grenzüberschreitung | Keine Teilbestätigung, doppelte Zuordnung oder verlorene Änderung; bestehende Vormerkungen bleiben bei fehlgeschlagener Übernahme erhalten. |
