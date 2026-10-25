---
title: "PRD: Try Not to Be Poor"
status: final
created: 2026-10-19
updated: 2026-10-25
sources:
  - ../../../specs/spec-try-not-to-be-poor/SPEC.md
  - ../../../specs/spec-try-not-to-be-poor/brownfield.md
  - ../../../specs/spec-oberflaeche-und-monatsueberschuss/monatsueberschuesse.md
  - ../../architecture/architecture-try-not-to-be-poor-2026-10-19/ARCHITECTURE-SPINE.md
---

# PRD: Try Not to Be Poor

## 0. Dokumentzweck und Stand

Dieses PRD beschreibt den Produktzielumfang für Linus und die nachfolgende UX-, Architektur- und Umsetzungsplanung. Es aktualisiert die Fassung vom 19.10.2026 anhand der [Produktspezifikation](../../../specs/spec-try-not-to-be-poor/SPEC.md), ihrer [Bestandseinordnung](../../../specs/spec-try-not-to-be-poor/brownfield.md) und der [Architektur vom 25.10.2026](../../architecture/architecture-try-not-to-be-poor-2026-10-19/ARCHITECTURE-SPINE.md). Die verbindlichen Monatsfachregeln und alle 17 zugehörigen Abnahmefälle stehen im [Begleiter zu Monatsüberschüssen](../../../specs/spec-oberflaeche-und-monatsueberschuss/monatsueberschuesse.md).

Die neun abgeschlossenen Stories im [Sprintstatus](../../../implementation-artifacts/sprint-status.yaml) dokumentieren den bisherigen Funktionsstand. Die neue Navigation, Monatsautomatik und Zielarchitektur sind noch umzusetzen; dieses Update erteilt keine Produktionsfreigabe. Neue bestätigte Regeln ersetzen betroffene ältere Aussagen. Unveränderte Produktentscheidungen und konkretisierte Bestandsabnahmen gelten weiter. FR-1 bis FR-11 behalten ihre Identität; FR-12 bis FR-17 ergänzen den Umfang. Technische Entscheidungen und Übergangsbedingungen sind im [Addendum](addendum.md) verortet.

## 1. Vision

Try Not to Be Poor gibt Linus, Familie und Freunden einen privaten Überblick über eigene Ausgaben, das verbleibende Monatsbudget und persönliche Sparziele. Die responsive Website ist vorrangig für das Smartphone gedacht und auch am Rechner bedienbar. Ausgaben werden bewusst manuell erfasst.

Der Monatsüberblick soll helfen, Ausgaben im Alltag besser einzuschätzen. Abgeschlossene Monatsüberschüsse können automatisch einem eigenen Sparziel zugerechnet oder bis zur Zielwahl vorgemerkt werden. Die App verschiebt dabei kein Geld zwischen Bankkonten. Mehr Geld am Monatsende ist ein erhoffter Nutzen, keine zugesicherte Wirkung.

Der provokative Produktname dient der persönlichen Orientierung. Deutsche Systemtexte sollen verständlich sein; ein darüber hinausgehendes Marken- oder Tonkonzept ist nicht beschlossen.

## 2. Umfang

Enthalten sind private Konten mit Registrierung, Anmeldung, Sitzungsverlängerung und Abmeldung; ausschließlich eigene Finanzdaten; manuelle Ausgaben samt vollständiger Historie, Bearbeiten und Löschen; ein fortlaufendes Monatsbudget und das Restbudget; Sparziele mit manueller Gesamteingabe; sowie aktivierbare automatische Monatsüberschüsse einschließlich Vormerkungen und historischer Korrekturen.

Die Hauptbereiche heißen **Monat**, **Ausgaben** und **Sparziele**. Monat bleibt die Startansicht. Sämtliche Geldwerte sind EUR. Die Freigabebedingungen in §8.4 sind Teil des Umfangs; die Umsetzung folgt nicht allein aus dem Status dieses Dokuments.

## 3. Zielgruppe und Nutzung

### 3.1 Aufgaben der Nutzer:innen

- Eigene Ausgaben zeitnah mit wenig Aufwand festhalten und später korrigieren.
- Das Restbudget des laufenden Monats ohne Nebenrechnung erkennen.
- Die gesamte eigene Ausgabenhistorie und persönliche Sparziele überblicken.
- Überschüsse abgeschlossener Monate nachvollziehbar für ein Sparziel berücksichtigen lassen.

Die App richtet sich an einen privaten Personenkreis. Betriebliche Finanzen und gemeinsame Finanzansichten gehören nicht zum Zielumfang.

### 3.2 Zentrale Nutzerreise

**UJ-1 — Linus erfasst Ausgaben und prüft seinen Monatsüberblick.** Linus öffnet den geteilten Registrierungslink und legt bei der ersten Nutzung sein Konto an; später meldet er sich direkt an. Am Smartphone öffnet er Ausgaben, trägt Name und Betrag einer oder mehrerer Ausgaben ein und sieht nach bestätigtem Speichern die aktualisierte Historie. Unter Monat erkennt er das aktuelle Restbudget. Er verlässt die Seite mit einer aktuellen Übersicht oder meldet sich über die sichtbare Abmeldeaktion ab.

Die bestätigte Kernreise bleibt erhalten; die neue Aufteilung auf drei Bereiche konkretisiert ihren Weg. Die Automatik ergänzt sie: In den Sparzielen sind Aktivierung, Zielauswahl, tatsächlicher Fortschritt und offene Vormerkungen verständlich sichtbar, auch wenn der Monatsabschluss ohne geöffnete Seite stattgefunden hat.

## 4. Glossar

| Begriff | Bedeutung |
| --- | --- |
| Nutzerkonto | Zugang und geschützter Datenbereich genau einer Person. |
| Ausgabe | Eigener Eintrag mit Name, positivem EUR-Betrag und automatisch gesetztem Erfassungsdatum. |
| Erfassungsdatum | Serverseitig bestimmter Kalendertag nach Europe/Berlin; nicht frei wählbar und beim Bearbeiten unveränderlich. |
| Monatsbudget | Nichtnegativer EUR-Betrag, der im laufenden und in folgenden Kalendermonaten gilt, bis er geändert wird. Abgeschlossene Budgetstände bleiben erhalten. |
| Restbudget | Gültiges Monatsbudget minus eigene Ausgaben des laufenden Kalendermonats. Ohne gesetztes Budget nicht berechenbar. |
| Monatsübersicht | Ansicht unter Monat mit Budgetverwaltung, gültigem Monatsbudget, laufender Monatsausgabensumme und Restbudget; die vollständige Ausgabenhistorie liegt unter Ausgaben. |
| Sparziel | Eigenes Ziel mit Name, positivem Zielbetrag, tatsächlichem Fortschritt und optionalem Zieldatum. |
| Fortschritt | Aktueller Gesamtbetrag eines Sparziels; manuell ersetzbar und durch automatische Monatswirkungen veränderbar, auch negativ oder über dem Zielbetrag. |
| Monatsautomatik | Je Nutzerkonto aktivierbare Berücksichtigung abgeschlossener Monate ab dem unveränderlichen Erstaktivierungsmonat. |
| Herkunftsmonat | Abgeschlossener Kalendermonat, dessen damaliges Budget und eigene Ausgaben einen Monatsüberschuss bestimmen. |
| Monatsüberschuss | Bei vorhandenem Budget: Maximum aus null und Budget minus Ausgaben des Herkunftsmonats. Ohne Budget entsteht kein Betrag. |
| Zielauswahl | Genau ein eigenes Sparziel für die Monatsautomatik; maßgeblich ist die Auswahl zum Ende des jeweiligen Herkunftsmonats. |
| Vormerkung | Noch keinem Sparziel zugeordneter Monatsüberschuss; Herkunftsmonat und Betrag bleiben erhalten. Auch Monate mit Budget und Überschuss null werden für spätere Korrekturen gebunden. |
| Monatsnachweis | Dauerhafte fachliche Herkunft und zuletzt berücksichtigter Überschuss eines Monats; unterscheidet ohne Budget, vorgemerkt, zugeordnet und durch Ziellöschung verbraucht. Kein Nutzer-Beitragsverlauf. |

## 5. Funktionen

### 5.1 Nutzerkonten und Datentrennung

#### FR-1: Nutzerkonto über den Registrierungslink anlegen und Zugang nutzen

Eine Person mit aktivem geteiltem Registrierungslink kann sich mit E-Mail und Passwort registrieren und anschließend anmelden. Der private Kreis wird durch die Weitergabe des Links bestimmt.

**Prüfbare Folgen:**

- Der Registrierungslink ist 30 Tage gültig und kann geschützt ersetzt beziehungsweise gesperrt werden; ein abgelöster oder abgelaufener Link ermöglicht keine Registrierung.
- Angemeldete können ihre Sitzung verlängern und sich abmelden. Zugang gilt zehn Minuten; Sitzungsverlängerung endet nach 30 Tagen Inaktivität oder spätestens 90 Tagen seit Anmeldung. Wiederverwendung eines abgelösten Verlängerungsnachweises widerruft die zugehörige Sitzungsfamilie.
- Zugangsfehler bleiben neutral und offenbaren keine fremden Konten.
- Alle angemeldeten Hauptbereiche bieten einen konsistenten roten Abmeldebutton mit lesbarem Text und sichtbarem Tastaturfokus. Abmeldung widerruft die Sitzungsverlängerung und entfernt Sitzung und Finanzdaten aus dem Browser; ein bereits ausgestellter Zugang kann serverseitig höchstens bis zu seinem Ablauf gültig bleiben.

#### FR-2: Eigene Finanzdaten ansehen

Angemeldete Personen sehen ausschließlich eigene Ausgaben, Budgetstände, Sparziele, Fortschritte und Vormerkungen. Die angezeigten Werte gehören zum aktuellen Nutzerkonto. Bei Abmeldung, Sitzungsablauf oder Kontowechsel werden sie verworfen; späte Antworten dürfen sie nicht wieder einblenden.

#### FR-3: Daten anderer Personen schützen

Kein Konto kann Finanzdaten eines anderen Kontos lesen oder ändern. Dies gilt für direkte Zugriffe, Zielauswahl, historische Korrekturen und Hintergrundverarbeitung. Zugriffe auf fremde und nicht vorhandene Ressourcen dürfen weder fremde Inhalte noch deren Existenz offenlegen. Es gibt keine gemeinsamen Finanzansichten.

### 5.2 Ausgaben manuell erfassen und überblicken

#### FR-4: Ausgabe manuell erfassen

Angemeldete Personen können eine eigene Ausgabe mit Name und positivem EUR-Betrag anlegen. Nach bestätigtem Speichern erscheint sie in ihrer Ausgabenhistorie. Eigentümer ist das angemeldete Konto; das Erfassungsdatum setzt der Server auf den aktuellen Kalendertag nach Europe/Berlin. Eine freie Datumswahl ist ausgeschlossen.

#### FR-5: Alle bisher erfassten Ausgaben tabellarisch ansehen

Unter Ausgaben sind sämtliche eigenen Ausgaben über alle Monate hinweg mit Name, Betrag und Erfassungsdatum tabellarisch sichtbar. Ein Monatswechsel entfernt keine Historie. Die Monatsübersicht beschränkt diese vollständige Historie nicht auf den laufenden Monat.

#### FR-6: Eigene Ausgabe bearbeiten oder löschen

Nutzer:innen können Name und Betrag einer eigenen Ausgabe ändern oder den Eintrag nach verständlicher Bestätigung löschen. Eigentümer und Erfassungsdatum bleiben beim Bearbeiten unverändert.

**Prüfbare Folgen:**

- Nach bestätigter Mutation zeigt die Ausgabenhistorie den neuen Stand; die nächste Monatsansicht zeigt das dazu konsistente Restbudget.
- Betragsänderungen und Löschungen in abgeschlossenen aktivierten Herkunftsmonaten lösen die Korrektur nach FR-16 aus. Eine reine Namensänderung verändert keine Geldwerte.
- Ausgabe und zugehörige Korrektur werden gemeinsam bestätigt oder vollständig verworfen; kein anderer Datenbereich eines anderen Kontos ändert sich.

### 5.3 Monatsbudget

#### FR-7: Monatsbudget festlegen

Eine Person kann ihr Monatsbudget ab null festlegen oder ändern. Es gilt sofort für den laufenden und für folgende Monate bis zur nächsten Änderung. Abgeschlossene Budgetstände bleiben unverändert. Ein fehlendes Budget ist von einem ausdrücklich gesetzten Budget von null unterscheidbar.

#### FR-8: Restbudget anzeigen

Monat zeigt das gültige Monatsbudget, die Summe der eigenen Ausgaben des laufenden Kalendermonats und das Restbudget. Das Restbudget ist deren exakte Differenz; der Kalendermonat richtet sich nach Europe/Berlin. Nach Ausgabenerfassung, Betragsänderung oder Löschung zeigt die nächste Monatsansicht den aktualisierten Stand.

Ohne Budget fordert Monat zur Festlegung auf und zeigt kein erfundenes Restbudget. Bei Überschreitung bleiben der tatsächliche negative Betrag und ein verständlicher Hinweis sichtbar. Einnahmen, Sparfortschritt und Monatsüberschussanrechnungen verändern diese Formel nicht.

### 5.4 Sparziele

#### FR-9: Eigenes Sparziel anlegen, bearbeiten und löschen

Eine Person kann ein eigenes Sparziel mit selbst gewähltem Namen, positivem EUR-Zielbetrag und optionalem Zieldatum anlegen. Der Fortschritt startet bei null. Zielanlage allein wählt das Ziel nicht für die Monatsautomatik aus.

Name, Zielbetrag und Zieldatum sind bearbeitbar; der Fortschritt bleibt dabei erhalten. Ein leeres Zieldatum entfernt das bisherige Datum. Das Zieldatum ist ein reines Kalenderdatum.

Löschen erfordert eine verständliche Bestätigung und entfernt Ziel und Fortschritt. Der Dialog erklärt den Fortschrittsverlust und bei einem ausgewählten Ziel die spätere Vormerkung neuer Überschüsse. Bestehende Vormerkungen bleiben erhalten. Bereits zugeordnete Monate werden weder umgeleitet noch neu vorgemerkt. Das gilt auch für noch unverarbeitete abgeschlossene Monate, deren historische Zielauswahl dieses Ziel war. Sie bleiben als verbraucht gebunden; Korrekturen stellen das Ziel nicht wieder her. Ein Nachhollauf oder eine letzte Erhöhung des entfallenden Fortschritts ist keine Löschvoraussetzung. Die Auswahl für den offenen Monat wird geleert, falls das gelöschte Ziel ausgewählt war.

#### FR-10: Fortschritt eines Sparziels aktualisieren und ansehen

Eine Person kann den tatsächlichen Gesamtfortschritt eines eigenen Sparziels manuell ersetzen. Es gibt keinen Nutzer-Beitragsverlauf. Monatsnachweise bleiben bei manueller Eingabe erhalten; spätere automatische Wirkungen verändern den aktuellen Gesamtbetrag nach FR-16 und FR-17.

**Prüfbare Folgen:**

- Fortschritt darf negativ sein oder den Zielbetrag überschreiten. Betrag und Prozentwert zeigen den tatsächlichen Stand; nur der Balken wird auf 0–100 % begrenzt.
- Bei −30 € Fortschritt und 100 € Ziel zeigt die App −30 € und −30 %, Balken 0 %. Bei 150 € zeigt sie 150 € und 150 %, Balken 100 %.
- [ASSUMPTION: Der vorzeichenbehaftete Fortschrittsbereich gilt auch für die manuelle Gesamteingabe.] Diese Ableitung stammt aus der SPEC und ist Grundlage der Zielarchitektur.
- Manuelles Ersetzen bleibt möglich, wenn ein Nachhollauf wegen Betragsgrenzen blockiert ist. Historische Anrechnungen dürfen die manuelle Eingabe nicht durch eine neu errechnete absolute Summe überschreiben.

### 5.5 Website und Orientierung

#### FR-11: Website responsiv und zugänglich nutzen

Ausgaben, Budget, Sparziele und sämtliche neuen Automatikzustände sind am Smartphone und Rechner bedienbar. WCAG 2.2 AA ist das Prüfziel: Tastaturbedienung, sichtbarer Fokus, programmatische Beschriftungen und Statusmeldungen, ausreichende Kontraste sowie Beträge, Prozentwerte und Status zusätzlich zur Farbe.

Abnahmegrößen sind 320×568, 390×844, 768×1024 und 1280×800 CSS-Pixel. Die Kernfunktionen bleiben bei 200 % Textgröße und Reflow auf 320 CSS-Pixel nutzbar. Aktionen sind mindestens 44 CSS-Pixel, Geldfelder mindestens 48 CSS-Pixel hoch. Der rote Abmeldebutton und Vormerkungen unterliegen denselben Anforderungen.

#### FR-12: Monat, Ausgaben und Sparziele getrennt aufrufen

Die Hauptnavigation enthält Monat, Ausgaben und Sparziele. Monat bleibt Startansicht mit Budgetverwaltung und Monatsübersicht, ohne Ausgabenformular. Ausgabenerfassung liegt unter Ausgaben.

[ASSUMPTION: Die gesamte Ausgabenverwaltung einschließlich vollständiger Historie, Bearbeiten und Löschen zieht in den Tab Ausgaben.] Diese Ableitung ist aus der SPEC übernommen und in der Zielarchitektur berücksichtigt. Nach einer bestätigten Ausgabenmutation lädt die nächste Monatsansicht den konsistenten neuen Stand.

#### FR-13: Deutsche Systemtexte ohne Zeitzonenerläuterungen anzeigen

Sichtbare Systemtexte und zugängliche Hilfstexte enthalten keine Zeitzonenerläuterungen wie „in Berlin“, „Kalender in Berlin“ oder „Europe/Berlin“. Deutsche Euro- und Datumsformate sowie die interne Kalendersemantik bleiben erhalten. Nutzereigene Texte wie „Berlin-Fahrt“ werden dadurch nicht verändert.

### 5.6 Automatische Monatsüberschüsse

#### FR-14: Monatsautomatik aktivieren

Eine Person kann die Monatsautomatik für ihr Konto aktivieren, auch ohne vorhandenes oder ausgewähltes Sparziel. Die erste Aktivierung legt den unveränderlichen frühesten Herkunftsmonat fest. Frühere Monate bleiben ausgeschlossen; eine spätere erste Zielwahl verschiebt den Start nicht.

Nach Aktivierung im Oktober wird der gesamte Oktober nach dessen Ende berücksichtigt, September dagegen nicht. Für jeden abgeschlossenen Herkunftsmonat mit Budget gilt: `Monatsüberschuss = max(0, damaliges Monatsbudget − eigene Monatsausgaben)`. Ohne Budget entsteht weder Anrechnung noch Vormerkung. Ein negativer Rest erzeugt keine neue Sparbelastung; eine historische Korrektur kann eine frühere Anrechnung jedoch zurücknehmen. Sparanrechnung ist keine Ausgabe und verändert das Restbudget nicht.

#### FR-15: Monatsüberschuss zuordnen oder vormerken

Genau ein ausgewähltes eigenes Sparziel erhält den Monatsüberschuss vollständig. Maßgeblich ist die Zielauswahl zum Ende des Herkunftsmonats, auch bei verspäteter Verarbeitung. Ohne gültige Auswahl wird der Betrag je Herkunftsmonat vorgemerkt. Kein Ziel wird automatisch oder zufällig gewählt.

**Prüfbare Folgen:**

- Die offene vorgemerkte Summe, eine fehlende Zielwahl und die Auswahl eigener Ziele sind verständlich sichtbar.
- Zielwahl oder Zielwechsel berücksichtigt zuerst fällige, bisher unverarbeitete abgeschlossene Monate nach deren historischen Regeln. Danach werden sämtliche offenen Vormerkungen einschließlich noch nicht zugeordneter Monate mit Budget und Überschuss null dem gewählten Ziel zugeordnet.
- Übernahme und Auswahl werden nur gemeinsam wirksam. Erst nach bestätigter vollständiger Übernahme leert sich die Vormerkung; bei Fehler bleibt sie erhalten. Wiederholung wirkt nicht doppelt.
- 200 € aus Oktober und 100 € aus November vorgemerkt, Zielstand 50 €: Nach Übernahme beträgt der Fortschritt 350 €, die offene Summe null. Die beiden Herkunftsmonate bleiben unterscheidbar.
- Ein Wechsel zu B im November verschiebt keine Oktoberzuordnung von A nach B. Oktoberkorrekturen bleiben bei A, November folgt B; noch offene Vormerkungen werden vollständig nach B übernommen.
- Auch ein Monat mit Budget und Überschuss null bewahrt seine historische Auswahl. Ohne Auswahl bleibt er für eine spätere Übernahme offen. Ein Monat ohne Budget wird dadurch nicht zur Vormerkung.
- Für gelöschte Ziele gilt FR-9; deren frühere Bindungen werden nicht erneut verteilt.

#### FR-16: Historische Monatsüberschüsse um Differenzen korrigieren

Eine Betragsänderung oder Löschung einer Ausgabe aus einem abgeschlossenen Monat ab Erstaktivierung berechnet dessen Monatsüberschuss gemeinsam mit der Ausgabenmutation neu. Fehlt die bisherige Verarbeitung, wird der Monat anhand seiner historischen Budget- und Zielregeln berücksichtigt.

**Prüfbare Folgen:**

- Vor Zielzuordnung verändert sich nur die Vormerkung des betroffenen Herkunftsmonats.
- Nach Zuordnung zu einem weiterhin vorhandenen Ziel gilt: `neuer Fortschritt = aktueller Fortschritt + (neuer Monatsüberschuss − zuletzt berücksichtigter Monatsüberschuss)`. Die Differenz wirkt einmal auf das ursprüngliche Ziel, auch nach einem Zielwechsel.
- Beispiel: Ursprünglich 200 € angerechnet, neu 150 €; bei zwischenzeitlich manuell auf 300 € gesetztem Fortschritt bleibt danach 250 €.
- Negative Ergebnisse bleiben erhalten: 20 € minus 50 € ergibt −30 €; spätere 100 € ergeben 70 €. Es gibt weder Abschneiden bei null noch eine separate Korrekturschuld.
- Gelöschte Ziele bleiben verbraucht; weder andere Ziele noch neue Vormerkungen erhalten ihre Korrekturen.
- Eine ungültige oder grenzüberschreitende Korrektur verwirft den gesamten zusammengehörigen Vorgang. Keine Ausgabeänderung wird ohne ihre erforderliche Monatskorrektur bestätigt.

#### FR-17: Monatsabschlüsse ohne offene Sitzung zuverlässig nachholen

Die Monatsautomatik verarbeitet abgeschlossene Monate ohne geöffnete Oberfläche und ohne aktive Sitzung. Nach Ausfällen und Neustarts werden versäumte Monate ab Erstaktivierung chronologisch nachgeholt.

Jeder Herkunftsmonat wirkt höchstens einmal in seinem jeweils gültigen Stand. Wiederholungen und gleichzeitige manuelle oder automatische Änderungen dürfen weder doppelt anrechnen noch bestätigte Änderungen verlieren. Fortschritt und Zuordnung werden gemeinsam wirksam. Fehler führen zu keiner Teilbestätigung; Vormerkungen und wirksame Zuordnungen bleiben erhalten. Ein fehlerhaftes Konto blockiert die Verarbeitung anderer Konten nicht.

## 6. Nicht-Ziele

- Betriebliche Nutzung und gemeinsame Ausgaben-, Budget- oder Sparzielansichten.
- Einnahmenerfassung, Bankimport, Banküberweisungen, Kategorien und wiederkehrende Ausgaben.
- Andere Währungen oder eine wählbare Zeitzone.
- Nutzer-Beitragsverlauf, getrennte sichtbare manuelle/automatische Fortschrittskonten und separate Korrekturschulden. Monatsnachweise und sichtbare Vormerkungen bleiben erforderlich.
- Offline-Synchronisation oder dauerhafte Speicherung von Finanzdaten im Browser.
- Produktionsfreigabe allein durch diese Dokumentaktualisierung. Bankimport kann für eine spätere Version erneut geprüft werden.

## 7. Erfolgskriterien

- **SM-1 — Monatsüberblick:** Linus erkennt bei der Monatsprüfung vollständige Ausgabenhistorie unter Ausgaben und aktuelles Restbudget unter Monat ohne Nebenrechnung (FR-5, FR-8, FR-12).
- **SM-2 — Zielüberblick:** Bei jedem eigenen Sparziel sind tatsächlicher Fortschritt und Verhältnis zum Zielbetrag einschließlich negativer Werte und Übererfüllung erkennbar (FR-10).
- **SM-3 — Verlässliche Monatsautomatik:** Die 17 Monatsabnahmefälle bestehen; jeder berechtigte Herkunftsmonat wird genau einmal berücksichtigt, Vormerkungen vollständig übernommen und historische Zielbindungen nach Wechsel, Löschung, Korrektur, Ausfall und Parallelität erhalten (FR-14 bis FR-17, FR-9, FR-10).
- **SM-4 — Durchgängige Bedienung:** Registrierung/Anmeldung, Ausgabenverwaltung, korrekter Monatsüberblick und rotes Abmelden sind in den festgelegten Ansichten und Prüfgrößen durchführbar; keine fremden Daten oder systemseitigen Zeitzonenerläuterungen erscheinen (FR-1 bis FR-3, FR-11 bis FR-13).
- **SM-C1 — Erfassungsaufwand:** Der Monatsüberblick darf nicht so viel Eingabe- oder Bedienaufwand verursachen, dass Linus die manuelle Erfassung aufgibt. Gemeinsam mit SM-1 während der privaten Nutzung beobachten.

Eine finanzielle Verbesserung wird nach ein bis zwei Monaten privater Nutzung beobachtet; Vergleich und Messweise sind noch offen. Es gibt kein zugesagtes Sparziel in Euro oder Prozent.

## 8. Datenschutz, Qualität und Freigabe

### 8.1 Exakte Geldwerte und Kalender

Alle gespeicherten und fachlich berechneten Geldwerte sind exakte ganzzahlige EUR-Cent innerhalb ±9.007.199.254.740.991. Mehr als zwei Euro-Nachkommastellen und Mutationen, die eine Grenze überschreiten, werden abgelehnt. Grenzen werden nicht durch Runden oder Abschneiden eingehalten. Ausgaben und Zielbeträge sind positiv; Budget, Monatsausgabensummen, Monatsüberschüsse und Vormerkungen sind nichtnegativ; Restbudget und Fortschritt dürfen negativ sein.

Erfassungsdatum und Monatsgrenzen richten sich nach Europe/Berlin einschließlich Sommer-/Winterzeit. Eine andere Gerätezeitzone verändert keine Zuordnung. Kalenderdaten wie das Zieldatum werden ohne Umrechnung in Zeitpunkte behandelt. Diese Fachdefinition ist keine Aufforderung, Zeitzonenerläuterungen im UI anzuzeigen.

### 8.2 Sitzung, Bestätigung und Fehler

Finanzdaten und kurzfristige Zugangsnachweise bleiben im Browser ausschließlich im Arbeitsspeicher. Die geschützte Sitzungsverlängerung folgt dem bestehenden Zugangsvertrag. Erfolg wird erst nach dauerhaft bestätigter Speicherung angezeigt; Doppelsenden wird verhindert. Späte Antworten nach Abmeldung, Ablauf oder Kontowechsel bleiben wirkungslos.

Bei Fehlern oder fehlender Verbindung bleiben Entwürfe nur im offenen Tab erhalten. Es gibt keine Offline-Synchronisation. Ausgaben- und Ziellöschung erfordern eine verständliche Bestätigung. Zusammengehörige Änderungen werden vollständig bestätigt oder vollständig verworfen.

### 8.3 Betrieb und private Daten

Der Betrieb muss Verarbeitungsrückstand, letzte erfolgreiche Monatsverarbeitung und technische Fehler erkennen können, ohne Finanztexte, Geldbeträge oder Zugangsnachweise in Logs offenzulegen. Produktionsgeheimnisse bleiben außerhalb versionierter Dateien. Vor echten Daten sind verschlüsselte Backups außerhalb des VPS und ein getesteter Wiederherstellungsweg Voraussetzung. Die noch offenen Entscheidungen dazu stehen in §9.

### 8.4 Übergang und Freigabebedingungen

Bestehende Konten und IDs, Eigentümer, Ausgabedaten, historische Budgetstände und manuelle Fortschritte bleiben erhalten. Vor Erstaktivierung werden keine automatischen Monatsanrechnungen rückwirkend erfunden; manuelle Bestände werden nicht in solche Anrechnungen umgedeutet.

Die neue Oberfläche verwendet vollständig API v2 einschließlich Kontozugang. Während v1 unterstützt wird, bleiben Monatsautomatik und negative manuelle Fortschrittswerte serverseitig gesperrt. Vor Freigabe müssen die v2-Oberfläche und ihre Sicherheitsregeln abgenommen sowie v1 kontrolliert stillgelegt sein: Bereits zugelassene v1-Vorgänge einschließlich Lesezugriffen und Datenbankarbeit müssen beendet oder abgebrochen sein; veraltete Oberflächen erhalten einen Aktualisierungspfad. Erst dann darf ein Konto die Monatsautomatik aktivieren beziehungsweise negative Werte nutzen.

Nach den ersten vorzeichenbehafteten Fortschrittswerten oder Monatswirkungen ist ein Rückfall auf v1 ausgeschlossen. Ein technischer Rücknahmeschritt darf Finanzdaten nicht abschneiden oder überschreiben; erforderlich sind eine v2-kompatible Korrektur oder eine geprüfte Wiederherstellung.

## 9. Offene Fragen und weitere Planung

| Punkt | Verantwortlich | Klärung spätestens |
| --- | --- | --- |
| Export, Kontolöschung, Aufbewahrung einschließlich Monatsnachweisen, Kontowiederherstellung und notwendige E-Mail-Bestätigung | Linus | Vor echten Nutzerdaten und Produktionsfreigabe. |
| VPS-Auslegung, Domain/DNS, feste Laufzeitversionen, externe verschlüsselte Backups mit Zeitplan/Aufbewahrung, Wiederherstellungsziele und Überwachung | Linus | Vor Produktionsbetrieb; Wiederherstellungsweg muss getestet sein. |
| Anmeldedrosselung und begrenzte gleichzeitige Passwortprüfungen anhand von Zielhost und Lastprofil bewerten | Linus | Vor Produktionsbetrieb; bestehender Eintrag in [deferred-work.md](../../../implementation-artifacts/deferred-work.md) bleibt maßgeblich. |
| Vergleich zur finanziellen Wirkung bestimmen | Linus | Nach ein bis zwei Monaten privater Nutzung. |
| Bankimport für eine spätere Version erneut bewerten | Linus | Erst bei Planung einer späteren Version; kein Bestandteil dieses Umfangs. |

Diese Punkte blockieren die Produktionsfreigabe beziehungsweise die genannte spätere Entscheidung, nicht die bereits beschlossene Zielarchitektur. Vor Umsetzung sind [DESIGN.md](../../ux-designs/ux-try-not-to-be-poor-2026-10-19/DESIGN.md) und [EXPERIENCE.md](../../ux-designs/ux-try-not-to-be-poor-2026-10-19/EXPERIENCE.md) sowie neue Folge-Stories mit diesem Zielumfang abzugleichen. Die bisherigen Done-Nachweise werden nicht rückwirkend umgeschrieben. API-v2-Details und konkrete technische Ausgestaltung verbleiben in Architektur und Folge-Stories.

Die bisher offenen Fragen zu negativem Restbudget, Linkgültigkeit, Betragsregeln, Sparzielbearbeitung/-löschung und responsiven Prüfgrößen sind in §5 und §8 beantwortet. Die sofortige Wirkung einer Budgetänderung ist eine bestätigte Regel.

## 10. Annahmenindex

Die SPEC führt zwei Ableitungen, die auch dieses PRD ausdrücklich beibehält:

- **Zu FR-10:** Der vorzeichenbehaftete Fortschrittsbereich gilt auch für die manuelle Gesamteingabe.
- **Zu FR-12:** Die gesamte Ausgabenverwaltung einschließlich Historie, Bearbeiten und Löschen zieht in den Tab Ausgaben.

Beide sind bereits Grundlage der Architektur vom 25.10.2026; es bestehen daraus keine zusätzlichen offenen Architekturentscheidungen.
