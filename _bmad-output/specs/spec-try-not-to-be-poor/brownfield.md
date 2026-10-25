# Bestand und Geltung der aktualisierten Produktspezifikation

Stand: 2026-10-25. Die Produktspezifikation vereint den bisherigen Umfang mit den bestätigten Anforderungen aus „Oberfläche und Monatsüberschuss“. Die bestehenden neun Stories sind als `done` geführt; neue Anforderungen und Zielarchitektur sind noch umzusetzen. Ihre Aufnahme in die Spec ändert keine historischen Abnahmen.

## Quellen und ausdrücklich ersetzte Regeln

Die bestätigten Produktentscheidungen der Änderungsspezifikation und deren [Monatsfachregeln](../spec-oberflaeche-und-monatsueberschuss/monatsueberschuesse.md) gelten für den neuen Umfang. Die [Architektur vom 2026-10-25](../../planning-artifacts/architecture/architecture-try-not-to-be-poor-2026-10-19/ARCHITECTURE-SPINE.md) legt dessen technische Ausgestaltung fest. Sonst bleiben die konkretisierten Epic-/Storyabnahmen sowie die unveränderten PRD- und UX-Regeln verbindlich. Frühere UX-Annahmen zu bereits in Stories abgenommenen Sachverhalten öffnen diese nicht erneut.

| Bisherige Aussage oder Unklarheit | Geltende Anforderung |
| --- | --- |
| PRD-Glossar, EXPERIENCE und Story 2.1: zwei Hauptbereiche, Ausgaben zusammen mit Budget in der Monatsansicht | „Monat“, „Ausgaben“, „Sparziele“; Monat bleibt Startansicht mit Budgetverwaltung und Übersicht. Erfassung, Historie und Bearbeiten/Löschen liegen im Ausgabenbereich; die nächste Monatsansicht lädt nach bestätigter Mutation den konsistenten Stand. |
| Systemseitige Hinweise „in Berlin“, „Kalender in Berlin“, „Europe/Berlin“ | Hinweise entfallen einschließlich zugänglicher Hilfstexte; interne Kalenderregeln und nutzereigene Texte bleiben erhalten. |
| Grüne Standardaktion für Abmelden | In allen angemeldeten Hauptbereichen ein konsistenter roter Button mit lesbarem Text und sichtbarem Fokus; bestehendes Sitzungsende bleibt erhalten. |
| PRD FR-10/Story 2.2: Fortschritt nur manuell, keine technischen Beitragsnachweise | Manuelle Gesamteingabe bleibt; Automatik und monatsweise Nachweise ergänzen sie. Kein Beitragsverlauf als Nutzeroberfläche. |
| Story 2.2 und bisheriger Implementierungs-/Projektkontext: Fortschritt ab null | Fortschritt darf innerhalb ±9.007.199.254.740.991 Cent negativ sein. Tatsächlichen Betrag/Prozentwert zeigen; nur Balken auf 0 bis 100 % begrenzen. Die Anwendung auf manuelle Eingaben bleibt als abgeleitete Annahme sichtbar. |
| Ursprüngliche offene Fragen zu Beträgen, Datumsgrenzen, Zugang und Sparziel-Lebenszyklus | Konkrete Werte-, Zugangs- und Lifecycle-Abnahmen aus Epics/Stories gelten, ergänzt durch die signierten Werte und die Monatsfachregeln. |
| Änderungsspezifikation/bisheriger Begleiter: interne Autorisierung und API-Evolution noch zu entscheiden | Architektur AD-2/AD-4/AD-10 hat API v2 und getrennte Web-/Jobkontexte beschlossen. Offen ist deren Umsetzung, nicht mehr die Wahl des Autorisierungs- oder Versionierungsansatzes. |
| Alter Implementierungsschnitt `expense-budget` und nur JWT-basierter Finanzkontext | Zielarchitektur AD-1/AD-4: fünf getrennte Fachmodule und begrenzter aktivierungsbasierter Jobkontext neben dem JWT-Webkontext; RLS bleibt erzwungen. |

Diese Ersetzungen sind durch vorhandene Nutzerentscheidungen beziehungsweise die aktuelle Architektur gedeckt. Die älteren Planungsdateien sind als Begleiter übernommen; die betroffenen Textstellen müssen noch mit dem neuen Stand synchronisiert werden.

## Stabile Capability-Zuordnung

IDs gelten innerhalb ihres jeweiligen SPEC-Namensraums. Die ursprünglichen Produkt-IDs CAP-1 bis CAP-3 behalten ihre Bedeutung; die neuen Produkt-IDs ersetzen oder nummerieren keine IDs der Änderungsspezifikation um.

| Produktspezifikation `SPEC-try-not-to-be-poor` | Bestandsanforderungen | Änderungsspezifikation `SPEC-oberflaeche-und-monatsueberschuss` | Architektur |
| --- | --- | --- | --- |
| CAP-1 Ausgaben verwalten | FR-4 bis FR-6; Stories 1.4/1.6 | CAP-2 eigener Ausgabenbereich | AD-1, AD-5, AD-7, AD-9, AD-10 |
| CAP-2 Monatsbudget/Rest | FR-7/FR-8; Stories 1.3/1.5 | CAP-2 Monatsansicht nach Verlagerung | AD-1, AD-5, AD-7, AD-10 |
| CAP-3 Sparziele/Gesamtfortschritt | FR-9/FR-10; Stories 2.1 bis 2.3 | CAP-4 manuelle und negative Fortschritte | AD-1, AD-5, AD-7 bis AD-10 |
| CAP-4 Kontozugang/rotes Abmelden | FR-1 bis FR-3; Stories 1.1/1.2 | CAP-3 rote Abmeldeaktion | AD-2 bis AD-4, AD-10 |
| CAP-5 deutsche Texte | FR-11 und deutsche Darstellungsabnahmen | CAP-1 ohne Zeitzonenhinweise | AD-5, AD-10 |
| CAP-6 Monatsüberschüsse | Neuer Umfang, keine frühere Done-Story | CAP-4 Automatik/Vormerkung/Korrektur | AD-1, AD-2, AD-4 bis AD-10 |

FR-2/FR-3 und FR-11 gelten quer über alle Fähigkeiten. Architekturverweise auf CAP-1 bis CAP-4 meinen weiterhin ausdrücklich den Namensraum der Änderungsspezifikation.

## Aufgelöste ursprüngliche Fragen

| Frage der Produktspezifikation von 2026-10-19 | Antwort und maßgeblicher Beleg |
| --- | --- |
| Angaben einer Ausgabe | Name, positiver Eurobetrag, serverseitiger Erfassungstag nach `Europe/Berlin`; kein frei wählbares Datum. Bearbeiten erhält Eigentümer und Datum. Epics, Stories 1.4/1.6 und AD-5. |
| Sparfortschritt | Manuelle Eingabe ersetzt den Gesamtbetrag; Start null. Automatik wirkt mit Monatsdifferenzen auf den aktuellen Stand. Zielbearbeitung erhält Fortschritt, leeres Datum entfernt das Datum, Löschen ist bestätigt. Stories 2.1 bis 2.3, neue Monatsfachregeln und AD-5/AD-8/AD-9. |
| Währung und Kalender | Exakte EUR-Cent, höchstens zwei Euro-Nachkommastellen, sichere Cent-Grenzen; Monatsgrenzen und Ausgabendatum nach `Europe/Berlin`. Kalenderdaten bleiben ohne Zeitumrechnung. Epics und AD-5. |
| Identität und Datentrennung | Registrierung per geteiltem Link, E-Mail/Passwort und bestehender Sitzungsvertrag; Webidentität aus verifiziertem JWT, Jobidentität aus gespeicherter Aktivierung. Abfragefilter und erzwungene RLS, getrennte unprivilegierte Rollen, keine Offenlegung fremder Ressourcen. Stories 1.1/1.2 und AD-3/AD-4. |

Auch frühere PRD-/UX-Fragen nach Linkgültigkeit, negativem Restbudget und Übererfüllung sind bereits konkretisiert: Link 30 Tage und geschützt ersetzbar; negatives Restbudget mit Betrag und Überschreitungshinweis; tatsächlicher Sparbetrag/Prozentwert auch über Ziel. Die Access-Gültigkeit von 10 Minuten und Refresh-Grenzen von 30 Tagen Inaktivität beziehungsweise 90 Tagen seit Anmeldung bleiben erhalten.

## Verbindliche Monats- und Oberflächenabnahmen

Die vollständigen Monatsregeln und 17 Abnahmefälle des adoptierten Begleiters `monatsueberschuesse.md` gelten für Produkt-CAP-6 zusammen mit AD-7 bis AD-9. Sie umfassen Aktivierung ohne Ziel, gesammelte Vormerkungen, historische Differenzkorrekturen, manuelle Zwischenänderungen, negative Fortschritte, Zielwechsel/-löschung, Ausfallnachholung und atomare Grenzprüfung.

AD-8 präzisiert zusätzlich: Nullüberschüsse mit Budget bewahren Auswahl und Herkunft, damit spätere Korrekturen eindeutig bleiben. Eine Zielauswahl übernimmt auch offene Nullnachweise. Ziellöschung bewahrt ebenfalls noch nicht verarbeitete historische Zuordnungen als verbraucht; sie erhöht den entfallenden Fortschritt vorher nicht. Zielanlage wählt kein Ziel automatisch aus. AD-9 lässt manuelle Fortschrittseingaben auch bei einem wegen Betragsgrenzen blockierten Nachhollauf zu.

| Oberflächenfall | Erwartung |
| --- | --- |
| Navigation und Ausgabenänderung | Drei per Touch/Tastatur erreichbare Bereiche, Monat als Startansicht; eigene Historie aller Monate im Ausgabenbereich. Nach bestätigtem Anlegen/Bearbeiten/Löschen korrekte Werte in der nächsten Monatsansicht. |
| Texte und Datumsgrenze | Keine systemseitigen Zeitzonenhinweise, auch für Screenreader; „Berlin-Fahrt“ bleibt. Erfassungsdatum und Monatszuordnung bleiben bei anderer Gerätezeitzone und Zeitumstellungen korrekt. |
| Abmelden | In allen angemeldeten Hauptbereichen rot, lesbar und mit sichtbarem Fokus; persönlicher Browserzustand wird verworfen, späte Antworten bleiben wirkungslos. |
| Aktivierung und Zielauswahl | Aktivierung ohne Ziel möglich; fehlende Auswahl verständlich erklären, vorgemerkte Summe erkennbar anzeigen, eigenes Ziel auswählbar. Offene Vormerkung erst nach bestätigter Übernahme leeren. |
| Negativer oder übererfüllter Fortschritt | Tatsächlicher Betrag und Prozentwert, Balken auf 0 bis 100 % begrenzt; Eingaben unterstützen den signierten Bereich gemäß Annahme. |
| Ziellöschung | Bestätigungsdialog erklärt Verlust von Ziel/Fortschritt und bei ausgewähltem Ziel die anschließende Vormerkung weiterer Überschüsse. |
| Speichern, Fehler und Sitzungsgrenze | Erfolg erst nach Commit, Doppelsendungen verhindert; bei Fehler/offline Entwurf nur im offenen Tab erhalten, keinen Offline-Sync versprechen. Keine fremden oder veralteten Finanzwerte anzeigen. |

Die adoptierten DESIGN-/EXPERIENCE-Regeln gelten mit obigen Ersetzungen. Die konkretisierten Storyabnahmen und AD-10 erhalten WCAG 2.2 AA als Prüfziel, Tastatur/Fokus, zugängliche Labels/Status, 200-%-Text, Reflow bei 320 CSS-Pixeln, mindestens 44-Pixel-Aktionen und 48-Pixel-Geldfelder. Prüfanker bleiben 320 × 568, 390 × 844, 768 × 1024 und 1280 × 800 CSS-Pixel.

## Umsetzung und verbleibende Folgearbeit

- AD-1 bis AD-10 sind die technische Vorgabe: fünf isolierte Datenbesitzer, äußere gemeinsame Transaktionen/Kontosperre, begrenzte Jobrolle unter RLS, historische Budget-/Zielstände, atomare Monatsnachweise und nachholbare Verarbeitung. Einzelne Klassen, Tabellenformen, Batchgrößen und Wiederholungsabstände bleiben Implementierungsdetails.
- Der vollständige Wechsel auf API v2 einschließlich Zugang ist entschieden. V1-Vertrag bleibt eingefroren; v2 erhält eigenen Vertrag und generierte Namensräume. Konkrete v2-Pfade, DTOs und Fehler vor Verbraucherimplementierung festlegen. Vertragschecks und Freigabereihenfolge aus AD-2/AD-10 sind verbindlich.
- Automatik und signierte Fortschritte bleiben während der v1-Unterstützung gesperrt. Erst nach kontrollierter Stilllegung samt Abschluss/Abbruch laufender v1-Zugriffe dürfen sie freigegeben werden. Bestehende Daten bleiben durch neue Flyway-Migrationen erhalten; Rollenprovisionierung und Rücknahme folgen AD-10.
- PRD, DESIGN/EXPERIENCE und neue Folge-Stories müssen vor Implementierungsplanung synchronisiert werden; den Projektkontext bei Umsetzung nachführen. Bestehende Done-Abnahmen sind historische Nachweise, keine Abnahme des neuen Umfangs.
- Vor echten Nutzerdaten bleiben Export, Kontolöschung, Aufbewahrung einschließlich Monatsnachweisen, Kontowiederherstellung und nötige E-Mail-Bestätigung offen. Vor Produktion sind außerdem die Betriebsentscheidungen aus AD-6/Deferred einschließlich externer verschlüsselter Backups und getesteter Wiederherstellung zu erfüllen.
