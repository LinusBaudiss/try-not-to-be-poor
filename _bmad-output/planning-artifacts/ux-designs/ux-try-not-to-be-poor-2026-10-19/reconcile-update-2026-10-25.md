# Quellenabgleich zum UX-Update

Stand: 2026-10-25. Dieser Abgleich beschreibt den beschlossenen Zielumfang; die neue Navigation und Monatsautomatik sind noch nicht implementiert. Die bisherigen Done-Abnahmen bleiben historische Nachweise.

## Quellen und Rangfolge

- [Aktuelles PRD](../../prds/prd-try-not-to-be-poor-2026-10-19/prd.md), insbesondere §3.2/UJ-1, FR-1 bis FR-17, §8 und §10: aktueller Produktvertrag einschließlich der nach Architekturabgleich übernommenen Präzisierungen.
- [Änderungsspezifikation](../../../specs/spec-oberflaeche-und-monatsueberschuss/SPEC.md), CAP-1 bis CAP-4 und Annahmen: ursprüngliche konkrete Änderungswünsche und ihre ausdrücklichen Ableitungen.
- [Monatsfachregeln](../../../specs/spec-oberflaeche-und-monatsueberschuss/monatsueberschuesse.md): bestätigte Monatsregeln und 17 verbindliche Abnahmefälle.
- [Bestandseinordnung](../../../specs/spec-oberflaeche-und-monatsueberschuss/brownfield.md): betroffene ältere Regeln und zusätzliche Oberflächenabnahmen.
- [Architektur](../../architecture/architecture-try-not-to-be-poor-2026-10-19/ARCHITECTURE-SPINE.md), AD-3, AD-5, AD-7 bis AD-10: flüchtiger Browserzustand, exakte Darstellung, gemeinsame Bestätigung, Zielbindung und Aktualisierung veralteter Oberflächen.
- [Epics](../../epics.md), Geld-/Datumskonventionen und UX-DR1 bis UX-DR19, sowie [Story 1.2](../../../implementation-artifacts/spec-1-2-anmelden-sitzung-verlaengern-und-beenden.md), [Story 1.5](../../../implementation-artifacts/spec-1-5-restbudget-des-laufenden-monats-pruefen.md), [Story 2.2](../../../implementation-artifacts/spec-2-2-sparzielfortschritt-aktualisieren-und-ansehen.md) und [Story 2.3](../../../implementation-artifacts/spec-2-3-eigenes-sparziel-bearbeiten-und-loeschen.md): unveränderte Zugangs-, Entwurfs-, Fokus- und Responsive-Abnahmen; abgelöste Regeln gelten nur historisch.

Neu bestätigte Regeln gehen älteren UX-, Epic- und Story-Aussagen vor. Das aktuelle PRD übernimmt die Architekturpräzisierungen zu Nullüberschüssen und noch unverarbeiteten Monaten bei Ziellöschung; ältere „vor Implementierung klären“-Hinweise in der Änderungsspezifikation sind dadurch für diese Punkte erledigt.

## Vollständig zu erhaltende Änderungen

| Bereich | UX-Vertrag und Quelle |
| --- | --- |
| Drei Hauptbereiche | **Monat**, **Ausgaben**, **Sparziele**. Monat bleibt Startansicht mit Budgetverwaltung und Monatsübersicht, ohne Ausgabenformular. Ausgaben enthält Erfassung und gemäß ausdrücklich beibehaltener Annahme die gesamte Historie samt Bearbeiten/Löschen. Die nächste Monatsansicht lädt nach bestätigter Ausgabenmutation konsistente Werte. CAP-2; FR-5, FR-8, FR-12; AD-10. |
| Rotes Abmelden | In allen angemeldeten Hauptbereichen derselbe rote Button mit lesbarer Beschriftung und sichtbarem Fokus. Persönliche Daten und Entwürfe werden bei Abmeldung, Ablauf und Kontowechsel verworfen; späte Antworten bleiben wirkungslos. Keine Logout-Erfolgsmeldung vor bestätigtem Widerruf. CAP-3; FR-1/FR-2; PRD §8.2; AD-3/AD-10; Story 1.2. |
| Texte | Keine systemseitigen Zeitzonenerläuterungen, auch nicht in Hilfs- oder Screenreadertexten. Nutzereigene Texte wie „Berlin-Fahrt“ bleiben erhalten. Interne Datumssetzung und Monatszuordnung bleiben unverändert; deutsche Euro-/Datumsformate. CAP-1; FR-13; AD-5/AD-10. |
| Aktivierung | Monatsautomatik je Konto aktivierbar, auch ohne vorhandenes oder ausgewähltes Ziel. Unveränderlicher Start ist der Monat der ersten Aktivierung; ganzer Aktivierungsmonat wird nach Ende berücksichtigt, frühere Monate nie. Eine spätere Zielwahl verschiebt den Start nicht. FR-14; Monatsfachregeln „Aktivierung und Monatsabschluss“. |
| Monatliche Wirkung | Mit damaligem Budget: Überschuss mindestens null, berechnet aus Budget minus eigenen Monatsausgaben. Ohne Budget kein erfundener Betrag. Ein negativer Rest löst keine neue Sparbelastung aus. Sparanrechnungen sind keine Ausgaben und ändern die Restbudgetformel nicht. FR-7/FR-8/FR-14; AD-5/AD-8. |
| Ohne Ziel | Fehlende Auswahl und offene vorgemerkte Summe sind erkennbar; Auswahl eigener Ziele wird angeboten. Kein erstes oder zufälliges Ziel wird automatisch gewählt. Vormerkungen sind unabhängig von einzelnen Sparzielen und bleiben nichtnegativ. FR-15; Monatsfachregeln „Ohne Ziel und spätere Zuordnung“. |
| Auswahl und Wechsel | Vor Auswahl/Wechsel fällige Monate nach historischer Monatsendeauswahl berücksichtigen; danach alle offenen Vormerkungen vollständig genau einmal übernehmen. Auswahl und Übernahme werden gemeinsam wirksam. Wechsel betrifft offenen und spätere Monate, verschiebt keine alten Zuordnungen. Zielanlage ist keine Zielauswahl. FR-9/FR-15; AD-8. |
| Nullüberschuss | Gesetztes Budget und Überschuss null sind vom fehlenden Budget zu unterscheiden. Ein Nullmonat behält seine historische Auswahl; ohne Auswahl wird er bei späterer Auswahl ebenfalls gebunden. Kein positiver Betrag und keine zusätzliche Verlaufssicht werden daraus erfunden. FR-15; AD-8. |
| Ziel löschen | Bestätigung erklärt Verlust von Ziel und tatsächlichem Fortschritt; bei ausgewähltem Ziel werden weitere Überschüsse bis zur nächsten Auswahl vorgemerkt. Bestehende Vormerkungen bleiben erhalten. Früher zugeordnete und noch unbearbeitete abgeschlossene Monate mit historischer Auswahl dieses Ziels bleiben verbraucht; keine Umleitung, neue Vormerkung oder Wiederanlage. Kein vorgezogener Nachhollauf oder letzte Fortschrittserhöhung als Löschvoraussetzung. FR-9; AD-8. |
| Historische Ausgabe ändern/löschen | Vor Zuordnung nur betreffende Vormerkung korrigieren; nach Zuordnung nur Differenz auf aktuellen Stand des ursprünglichen noch vorhandenen Ziels anwenden. Reine Namensänderung ohne Geldwirkung. Ausgabe und erforderliche Korrektur gemeinsam bestätigen oder verwerfen. Gelöschte Ziele bleiben verbraucht. FR-6/FR-16; AD-7/AD-9. |
| Manuell und automatisch | Manuelle Eingabe ersetzt weiterhin Gesamtfortschritt, löscht keine Monatszuordnung. Spätere Automatik verändert den aktuellen Gesamtbetrag um eine Differenz. Manuelle Korrektur bleibt auch bei grenzbedingt blockiertem Nachhollauf möglich. Keine bestätigte Änderung durch veraltete Ansicht verlieren. FR-10/FR-17; AD-7/AD-9. |
| Negativer Fortschritt | Tatsächlicher Betrag und Prozentwert einschließlich Minuszeichen bleiben sichtbar; Balken allein auf 0–100 % begrenzen. Keine Nullkappung oder separate Korrekturschuld. Zielbetrag bleibt positiv; neues Ziel startet bei null. FR-9/FR-10/FR-16; AD-5. |
| Zuverlässigkeit und Fehler | Abschluss unabhängig von offener Seite/Sitzung, Nachholen nach Ausfällen, keine Doppelanrechnung. Grenz-/Commitfehler erzeugen keine Teilbestätigung; Vormerkungen bleiben bei fehlgeschlagener Übernahme erhalten. Entwürfe nur im offenen Tab; Doppelsenden verhindern; bei ungewissem Ausgang neu laden statt Erfolg behaupten. FR-15 bis FR-17; PRD §8.2; AD-7 bis AD-9; Stories 2.2/2.3. |
| Übergang | Neue Funktionen erst nach vollständiger Freigabe der v2-Oberfläche verfügbar. Veraltete Oberfläche braucht einen verständlichen Aktualisierungspfad; keine technische API-Erklärung im normalen Produktfluss. Bestandsdaten und manuelle Fortschritte erhalten, keine rückwirkende Umdeutung. PRD §8.4; AD-10. |
| Zugänglichkeit | WCAG 2.2 AA als Prüfziel; Tastatur, sichtbarer Fokus, Labels, Status und Geldwerte zusätzlich zu Farbe. Vier bestehende Viewports, 200-%-Text, Reflow bei 320 CSS-Pixeln, Aktionen mindestens 44 und Geldfelder mindestens 48 CSS-Pixel hoch. FR-11; AD-10; Storyabnahmen. |

## Ausdrücklich abgelöste Bestandsregeln

- Zweiernavigation und Erfassung/gesamte Historie innerhalb der Monatsübersicht → drei getrennte Hauptbereiche.
- Grüne beziehungsweise nur sekundär gestaltete Abmeldeaktion → konsistente rote Aktion.
- Systemseitige Zeitzonenhinweise → ersatzlos aus sichtbaren und zugänglichen Texten entfernen; fachlichen Kalender erhalten.
- Ausschließlich manueller Fortschritt → manuelles Ersetzen plus aktivierbare Monatswirkungen und Korrekturen.
- Nichtnegativer Sparfortschritt beziehungsweise Ablehnung negativer Eingabe aus Story 2.2 → tatsächlicher signierter Fortschritt; manueller Bereich bleibt ausdrücklich eine Quellenannahme.
- Frühere offene Punkte zu Linkgültigkeit, negativem Restbudget, Budgetwirksamkeit, Zielbearbeitung/-löschung und responsiven Prüfgrößen → durch aktuelles PRD und konkretisierte Bestandsabnahmen beantwortet.

## Verbleibende Annahmen und Grenzen

1. Die vollständige Ausgabenverwaltung zieht in Ausgaben; ausdrücklich beibehaltene Ableitung aus SPEC/PRD §10.
2. Der signierte Fortschrittsbereich gilt auch für manuelle Gesamteingabe; ausdrücklich beibehaltene Ableitung aus SPEC/PRD §10 und Grundlage der Zielarchitektur.
3. Konkrete Platzierung und Gestaltung der Automatiksteuerung, genaue Texte und visuelle Tokens sind UX-Ausgestaltung, keine zusätzlichen Fachregeln. Eine Deaktivierung, ein Nutzer-Beitragsverlauf, Benachrichtigungen oder ein manuell auslösbarer Monatsabschluss sind aus den Quellen nicht beauftragt.
4. Betriebsrückstand und technische Wiederholungsmetadaten werden für den Betrieb beobachtbar; daraus folgt keine neue administrative Nutzeroberfläche. Kein exakter Ausführungszeitpunkt wird versprochen.
5. Export, Kontolöschung, Aufbewahrung, Kontowiederherstellung und Produktionsbetrieb bleiben außerhalb dieses UX-Updates gemäß PRD §9.

## Abnahmeszenarien für die UX-Destillation

- **Kernreise UJ-1:** Anmeldung → Ausgaben erfassen/bearbeiten/löschen und vollständige Historie → Monat mit konsistentem Rest → rotes Abmelden; keine systemseitigen Zeitzonenhinweise, auch assistiv nicht.
- **Start:** Aktivierung im Oktober ohne Ziel und mit Septemberhistorie → nur Oktober ab Monatsende berücksichtigen; bei 200 € Überschuss 200 € vorgemerkt. Kein Budget beziehungsweise null/negativer Rest erzeugt keinen erfundenen Betrag.
- **Übernahme:** 200 € Oktober plus 100 € November bei Zielstand 50 € → nach bestätigter Auswahl 350 € Fortschritt und 0 € vorgemerkt. Wiederholung ohne Doppelwirkung. Historische Oktoberkorrektur vor Übernahme auf 150 € → später nur 250 € übernehmen.
- **Direkte Anrechnung:** 1.000 € Budget minus 800 € Ausgaben bei Zielstand 50 € → 250 €; andere Ziele/Konten unverändert. Ausfallnachholung verwendet historische Auswahl.
- **Korrekturen:** 200 € alte Anrechnung → 150 € neuer Überschuss = nur −50 €; manuell inzwischen 300 € → 250 €. Günstigere/gelöschte Ausgabe erzeugt nur positive Differenz. 20 € minus 50 € → −30 €, später plus 100 € → 70 €.
- **Wechsel:** Oktober an A, Wechsel im November zu B → Oktoberkorrektur bleibt A, November B; offene Vormerkungen gehen vollständig B zu.
- **Löschen:** Ziel/Fortschritt nach erklärender Bestätigung entfernen; aktive Auswahl leeren; zukünftige Überschüsse vormerken; alte gebundene Monate bleiben verbraucht, auch wenn damals noch nicht verarbeitet. Abbrechen/Escape erhält Daten und Fokus kehrt zurück; nach Löschung nächsten sinnvollen Auslöser fokussieren.
- **Darstellung:** −30 € bei 100 € Ziel → −30 % und Balken 0 %; 150 € → 150 % und Balken 100 %. Beträge/Prozentwerte nicht abschneiden; deutsch formatieren.
- **Fehler/Parallelität:** Fehlgeschlagene oder grenzüberschreitende Auswahl lässt gespeicherte Auswahl, Fortschritt und Vormerkung gemeinsam unverändert; historische Ausgabe nicht ohne notwendige Korrektur bestätigen. Manuelle Fortschrittskorrektur bleibt als Ausweg erreichbar. Späte Antworten nach Sitzungsende/Kontowechsel bleiben unsichtbar.
- **Bedienung:** Alle drei Bereiche, Automatikzustände, Auswahl, Löschdialog und negative Eingabe in 320×568, 390×844, 768×1024 und 1280×800, mit Tastatur und 200-%-Text prüfen; Reflow, Vorzeichen, Fokus und Status bleiben erkennbar.

Alle 17 verbindlichen Monatsabnahmefälle bleiben über den Fachregelbegleiter referenziert; dieser Quellenabgleich ersetzt sie nicht.
