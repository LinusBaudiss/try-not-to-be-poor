---
status: approved
updated: 2026-10-26
workflow: bmad-create-epics-and-stories
currentStep: 3
epic: 4
story: '4.8'
approval: confirmed
inputDocuments:
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/planning-artifacts/prds/prd-try-not-to-be-poor-2026-10-19/prd.md
  - _bmad-output/planning-artifacts/architecture/architecture-try-not-to-be-poor-2026-10-19/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-try-not-to-be-poor-2026-10-19/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-try-not-to-be-poor-2026-10-19/EXPERIENCE.md
  - _bmad-output/specs/spec-oberflaeche-und-monatsueberschuss/monatsueberschuesse.md
  - _bmad-output/specs/spec-oberflaeche-und-monatsueberschuss/brownfield.md
---

# Zuletzt bestätigter Story-Entwurf

Epic 3 und Stories 4.1 bis 4.8 sind bestätigt und in `epics.md` enthalten. Die folgende Story ist unverändert übernommen; dieser Entwurf ist nicht mehr offen. Maßgeblich ist die vollständige Planung in `epics.md`. Die Bestätigung ist kein Umsetzungsauftrag und keine Fertigmeldung.

## Epic 4: Monatsüberschüsse verlässlich für eigene Sparziele berücksichtigen

Die fachlichen Bausteine und der faire Hintergrundlauf erhalten ihre gemeinsame technische Freigabe- und Bedienabnahme. Erst nach vollständigem Nachweis wird die ausdrückliche Aktivierung regulär angeboten. Funktionsbereitschaft aktiviert kein Konto automatisch und ersetzt keine Produktionsfreigabe oder Klärung der offenen Datenlebenszyklusfragen.

### Story 4.8: Monatsautomatik nach vollständigem Nachweis zur ausdrücklichen Aktivierung bereitstellen

Als Person mit eigenen Finanzdaten\
möchte ich die Monatsautomatik erst als vollständig geprüfte Funktion ausdrücklich aktivieren und ihre Folgen verlässlich bedienen können,\
damit Aktivierung, Vormerkung, Zielwahl, historische Korrektur und Löschung zusammen funktionieren.

**Anforderungsbezug:** Gemeinsamer Freigabe-/Bediennachweis für FR-14 bis FR-17 und Erhalt der betroffenen eigenen Daten-/Ausgaben-/Ziel-/Responsiv-/Textregeln aus FR-2/FR-3/FR-6/FR-9 bis FR-11/FR-13. Sämtliche Epic 4 zugewiesenen Anteile von NFR-1 bis NFR-12. AR-2 bis AR-4, AR-6 bis AR-20, unveränderte Betriebsform aus AR-21, Gesamtnachweis nach AR-22 und offene Bedingungen/Kontextpflege nach AR-23; Zugangsregeln und Bestandsbasis aus Epic 3 gelten fort. Gemeinsame Abnahme der Epic 4 zugewiesenen UX-Regeln, insbesondere UX-DR1/UX-DR2, UX-DR4/UX-DR5, UX-DR8 bis UX-DR18, Flows 3 bis 5 aus UX-DR19, Erhalt von UX-DR20 und UX-DR21 bis UX-DR30. M-01 bis M-17 und die zusätzlichen Nullmonat-/Lösch-/Korrektur-/Versionspräzisierungen werden vollständig zu ausführbaren Nachweisen zugeordnet.

**Abhängigkeiten und Umfang:** Baut ausschließlich auf Epic 3 und Stories 4.1 bis 4.7 auf. Ergänzt deren gemeinsamen regulären Freigabepfad, fail-closed Capability-/Aktivierungsintegration, durchgängige Browserabnahme und einen vollständigen, revisionsbezogenen Abnahmenachweis. Vorhandene geeignete Fach-/Datenbank-/Prozess-/Browserprüfungen werden wiederverwendet und gezielt um fehlende Integrationsgrenzen ergänzt. Es entsteht kein zusätzlicher Geldalgorithmus oder neuer Produktbereich. Eine spätere Story ist für den vollständigen freigebbaren Automatiklebenszyklus nicht erforderlich.

Die Funktionsfreigabe wird auf einem isolierten Prüfstand ohne echte Nutzerdaten über denselben dokumentierten Freigabeweg wie die spätere Bereitstellung belegt. Ein Testschalter, der die Versions-/Gesamtabnahmegrenze umgeht, gilt dafür nicht als positiver Freigabenachweis. Produktionsbetrieb und echte Daten bleiben an die ausdrücklich offenen Bedingungen aus PRD §9 gebunden; deren Umsetzung oder externe Bereitstellung gehört nicht zu dieser Story.

**Abnahmekriterien:**

**AC-1 — Reguläre Gesamtfreigabe benötigt überprüfbare Voraussetzungen**

**Angenommen** die Monatsbausteine, sichere Rollen und Hintergrundausführung sind vollständig umgesetzt\
**Wenn** der dokumentierte technische Freigabeweg ausgeführt wird\
**Dann** wird im vorhandenen technischen Freigabezustand nachvollziehbar dem konkreten Anwendungs-/Schema-/Rollenstand ein vollständiger Automatikabnahmenachweis zugeordnet. Er umfasst die bestätigten fachlichen, Sicherheits-, Konkurrenz-, Nachhol- und Browsernachweise dieses Epics sowie die tatsächliche v1-Stilllegungsbarriere aus Epic 3. Die wirksame Freigabe prüft diesen passenden Zustand und die nötige sichere Jobkonfiguration; ein einfacher Umgebungsschalter oder Browserwert allein genügt nicht. Administrative Zustandsbereitstellung bleibt außerhalb öffentlicher Nutzer-APIs.\
**Und** fehlende, unvollständige oder unpassende Voraussetzungen halten die Automatik serverseitig geschlossen. Freigabe erzeugt keine Aktivierung, Auswahl, Monatsanrechnung oder Umdeutung manueller Bestände. Ein nötiges zusätzliches technisches Speicherfeld entsteht nur per neuer Flyway-Migration; Fachbestand und historische Migrationen bleiben unverändert. Die eng begrenzten bestehenden Job-/Administrationsrechte werden erhalten.

**AC-2 — Capability und direkte Mutationen verwenden dieselbe reale Freigabe**

**Angenommen** ein aktueller oder veralteter Client liest `GET /api/v2/capabilities` beziehungsweise ruft Aktivierung direkt auf\
**Wenn** die tatsächlichen Freigabevoraussetzungen fehlen oder erfüllt sind\
**Dann** ist `monthlyAutomationAvailable` nur bei gültiger Gesamtfreigabe wahr; fehlend, unbekannt oder nicht geladen bedeutet für den Client nicht verfügbar. Der Aktivierungs-POST prüft die aktuelle serverseitige Grenze selbst und weist gesperrte Aufrufe vor Mutation mit 409 `FEATURE_NOT_AVAILABLE` ab. Veraltete positive Capability, direkter HTTP-Aufruf und paralleles Ändern des Freigabestands öffnen keine Umgehung. Der serverseitige Freigabeentscheid und eine hiervon abhängige Mutation werden so koordiniert, dass eine zwischenzeitliche Sperre nicht ungeprüft übergangen wird.\
**Und** `signedProgressAvailable` bleibt eine eigenständige Funktion aus Epic 3: Die gesperrte Monatsautomatik sperrt nicht pauschal die bereits gültige manuelle Fortschrittsreparatur. Bestehende Aktivierung/Erstmonat und historische Bindungen werden bei gesperrter technischer Bereitstellung nicht gelöscht oder als vom Nutzer deaktiviert ausgegeben. Erforderliche historische Korrekturen dürfen nicht still übersprungen und trotzdem als erfolgreiche Ausgabenmutation bestätigt werden; sichere Ziellöschung behält ihren fehlenden Nachholzwang. Bestehende v2-Formen bleiben kompatibel, v1 eingefroren und die getrennten Vertrags-/Kompilierchecks erfolgreich.

**AC-3 — Erst nach Freigabe regulär aktivieren, weiterhin ohne Zielvoraussetzung**

**Angenommen** ein Konto hat keine Aktivierung, kein Budget und kein Sparziel\
**Wenn** die Freigabe über den regulären Weg gültig ist und die Person Sparziele öffnet\
**Dann** ist die ausdrückliche Aktivierung erreichbar und erklärt vor Bestätigung den gesamten laufenden Erstmonat, den ersten Abschluss nach Monatsende und den Ausschluss früherer Monate. Erst der bestätigte POST aktiviert dieses Konto; Anlage eines Ziels, Anmeldung, Funktionsfreigabe oder Jobstart allein tun dies nicht. Unter Kontosperre bestimmter Erstmonat bleibt bei Wiederholung, Neustart und späterer erster Zielwahl unverändert.\
**Und** im gesperrten Zustand erscheint keine als nutzbar dargestellte, noch wirkungslose Aktivierung. Bei erstem Commitfehler wird kein Erfolg vorweggenommen. Ein zweites Konto bleibt ohne eigene Aktivierung unberücksichtigt, auch wenn es historische Ausgaben/Ziele besitzt. Weder Deaktivierung, freie Startmonatswahl noch ein Rückdatierungs-/Nachholknopf werden ergänzt. Die reguläre Positivprüfung verwendet die tatsächliche Release-/JWT-/RLS-Grenze statt eines diese Grenze überspringenden Testhooks.

**AC-4 — Durchgängige Vormerkungs-/Übernahmefolge ohne Sitzung belegen**

**Angenommen** das im Oktober ausdrücklich aktivierte Konto hatte noch nie ein Ziel ausgewählt\
**Wenn** die App geschlossen ist, der echte Hintergrundlauf nach Monatsenden beziehungsweise Ausfall nachholt und die Person später neu anmeldet\
**Dann** werden etwa 200 € aus Oktober und 100 € aus November als 300 € Vormerkung geladen, ohne einen manuellen Zielstand zu ändern. Die Person legt ein eigenes Ziel an, ersetzt dessen Fortschritt durch 50 € und wählt es ausdrücklich. Fällige weitere Monate werden nach bisherigen historischen Regeln berücksichtigt; ohne weitere Fälligkeit zeigt die gemeinsame Commitantwort 350 € Fortschritt und 0 € Vormerkung. Wiederholung rechnet nicht nochmals an.\
**Und** die ganze Folge läuft über reguläre v2-Routen, echte Datenbank und echte begrenzte Jobrolle. Kein offener Tab, Login oder manueller Kontoanwendungsaufruf löst den Hintergrundteil ersatzweise aus. Nullmonate mit Budget werden bei Auswahl mitgebunden, fehlendes Budget wird nicht zur offenen Nullvormerkung und das erste/einzige Ziel wird nicht automatisch gewählt. Monat/Restbudget und die vollständige Ausgabenhistorie bleiben unabhängig korrekt.

**AC-5 — Historische Korrektur, Zielwechsel und Löschen gemeinsam bedienen**

**Angenommen** Oktober ist A zugeordnet und im November wird B ausdrücklich gewählt\
**Wenn** die Person alte Ausgaben korrigiert, Fortschritt manuell ersetzt oder ein Ziel löscht\
**Dann** bleibt die Oktoberbindung bei A. Zuvor 200 € und nun 150 € Überschuss wirken nur als −50 € auf dessen aktuellen Stand: manuell 300 € werden 250 €, 20 € werden −30 €, eine spätere Anrechnung von 100 € wird 70 €. Günstigere/gelöschte Ausgabe wirkt nur positiv differenziert; vor Zuordnung wird nur die betroffene Vormerkung korrigiert. Jede notwendige Ausgaben-/Nachweis-/Zieländerung wird gemeinsam bestätigt.\
**Und** der tatsächliche Ziellöschdialog erklärt Verlust samt Fortschritt, erhaltene offene Vormerkung und künftige Vormerkung bei fehlender Auswahl. Bestätigtes Löschen verbraucht auch noch unverarbeitete abgeschlossene Monate mit damaliger Auswahl dieses Ziels ohne vorgelagertes Anrechnen. Spätere Korrektur/Neuverarbeitung erzeugt weder Wiederanlage noch Vormerkung oder Umleitung zu B. Eine andere aktuelle Auswahl bleibt erhalten; Löschung des letzten Ziels erhält den erreichbaren Automatikabschnitt und die Möglichkeit zur Zielanlage. Diese Folgen werden durch echte Benutzerwege einschließlich Abbrechen/Escape nachgewiesen.

**AC-6 — Fehler, blockiertes Nachholen und ungewisser Ausgang erhalten Reparaturwege**

**Angenommen** Aktivierung, Auswahlübernahme, historische Korrektur oder Löschung scheitern sicher beziehungsweise ihr Ausgang ist noch unbestätigt\
**Wenn** die Oberfläche den Zustand verarbeitet\
**Dann** zeigt sie sicheren Fehler, laufendes Speichern und „Speicherung noch nicht bestätigt“ unterscheidbar und assistiv verständlich. Sicher fehlgeschlagene Auswahl erhält gespeicherte Auswahl, Vormerkung und Zielstand; notwendige Korrekturfehler bestätigen auch die Ausgabenmutation nicht. Entwürfe bleiben ausschließlich im offenen Tab, nur die betroffene Aktion wird gegen Doppelsenden gesperrt. Vor Wiederholung bei unbekanntem Ausgang wird der tatsächliche aktuelle Zustand geladen.\
**Und** Betragsgrenzen werden erklärt statt gerundet oder teilweise übernommen; unabhängiges absolutes Fortschrittsersetzen und Ziellöschung bleiben ohne erfolgreichen Nachhollauf möglich. Offline wird kein Versand/keine Synchronisation versprochen. Nach bestätigter Löschung und anschließendem Ladefehler bleibt der Löscherfolg bestätigt; abhängige Werte sind bis zum gemeinsamen Nachladen ausdrücklich ungeladen. Kein Ladefehler erzeugt erfundene Nullen. Logs und Fehlermeldungen enthalten keine fremden Inhalte, tatsächlichen Finanzwerte oder Zugangsnachweise.

**AC-7 — Alle Automatikzustände in vier Größen zugänglich abnehmen**

**Angenommen** Aktivierung, fehlendes Ziel, Vormerkung, Auswahlübernahme, Differenzkorrektur, Löschen und Fehler werden bei 320×568, 390×844, 768×1024 und 1280×800 CSS-Pixeln genutzt\
**Wenn** Tastatur, Touch, Screenreader beziehungsweise 200 % Textgröße eingesetzt werden\
**Dann** funktionieren sämtliche Kernaktionen mit vollständigen Beträgen und programmatisch zugeordneten Labels/Fehlern/Status. Dialogfokus, Escape/Abbrechen und Rückkehrfokus sind korrekt; sichtbarer Fokus ist nicht verdeckt. Kernaufgaben bleiben bei 320 CSS-Pixeln ohne horizontales Scrollen nutzbar. Aktionen sind mindestens 44×44 CSS-Pixel groß, Geldfelder mindestens 48 CSS-Pixel hoch und wachsen mit Text.\
**Und** Textkontrast mindestens 4,5:1, Kontroll-/Fokuskontrast mindestens 3:1, logische Reihenfolge, reduzierte Bewegung und Information jenseits von Farbe gelten. −30 € bei 100 € Ziel erscheinen tatsächlich als −30 % bei leerem Balken, 150 € als 150 % bei vollem Balken; assistive Ausgabe bleibt wahrheitsgemäß. Drei Hauptbereiche mit Monat als Start, dieselbe rote Abmeldung und die UX-Tokens bleiben konsistent. Systemtexte einschließlich Hilfen enthalten keine Zeitzonenerläuterung; eigene Namen wie „Berlin-Fahrt“ werden erhalten. Layout und Komponentenzustände werden mit den drei bestehenden UX-Referenzen abgeglichen.

**AC-8 — Frische Rückkehransichten und Sitzungsgrenzen im tatsächlichen Lauf erhalten**

**Angenommen** Hintergrundverarbeitung oder eine historische Mutation verändert Werte während Navigation, eines offenen Entwurfs oder eines Konto-/Sitzungswechsels\
**Wenn** Monat oder Sparziele erneut geladen werden oder ältere Antworten eintreffen\
**Dann** werden die bestehenden konsistenten Lesewege verwendet: Monat lädt Budget/Ausgaben/Rest gemeinsam, Sparziele übernimmt Aktivierung/Auswahl/Vormerkung/Zielwerte aus der zusammenhängenden Übersicht. Monatswechsel und bekannte Mutationen machen alte Werte erneuerungsbedürftig; sie werden nicht als aktuell ausgegeben. Späte Leseantworten überschreiben weder neuere Bestätigung noch einen offenen manuellen Entwurf.\
**Und** Abmeldung, Ablauf und Kontowechsel entfernen persönliche Werte/Entwürfe samt alten Erfolgsstatus und entkräften späte Mutationsantworten. Access-Tokens und Finanzwerte bleiben nur im Browserarbeitsspeicher. Serververarbeitung kann ohne Nutzersitzung weiterlaufen und offenbart dabei keine anderen Konten. Mehrkontenprüfung, fehlender/fremder Web-/Jobkontext und wiederverwendete Verbindungen belegen denselben Schutz wie vor Freigabe; die vorhandenen Zugang-/CSRF-/Origin-/`no-store`-Regeln bleiben vollständig wirksam.

**AC-9 — Tatsächliche Versionsbarriere und Rücknahmegrenze bleiben wirksam**

**Angenommen** der abschließende Freigabeprüfstand enthält migrierten Bestand und produktionsgleichen Start-/Routingcode\
**Wenn** Altclient, v1-Zugriffe, Freigabe und spätere Wiederanläufe geprüft werden\
**Dann** entstehen keine Automatikwirkungen vor tatsächlichem Ende oder Abbruch sämtlicher zuvor zugelassener v1-Vorgänge einschließlich GETs und Datenbankarbeit. Ein nur begonnener Drain oder beendeter HTTP-Socket genügt nicht. Der Altclient erhält den geprüften Aktualisierungspfad; Zugang und sämtliche aktuellen Finanz-/Automatikwege verwenden v2. Job/HTTP greifen nicht auf Besitzer-/Migrationsrechte zurück und die gesonderte sichere Discovery bleibt begrenzt.\
**Und** erste Monatswirkung setzt den dauerhaften Nutzungsmarker atomar. Neustart, Ziellöschung, später wieder positive Fortschritte oder technische Sperre heben den v1-Rückfallschutz nicht auf. Vor Nutzung zulässige Rücknahme wurde gegen migriertes Schema/Rollen geprüft; danach sind ausschließlich v2-kompatible Korrektur oder geprüfte Wiederherstellung vorgesehen. Finanzdaten werden für Code-Rücknahme weder gekürzt noch überschrieben. Funktionsfreigabe im Prüfstand führt keinen Produktionsrollout aus.

**AC-10 — Alle 17 Monatsfälle und Präzisierungen revisionsbezogen nachweisen**

**Angenommen** die zusammenhängende Umsetzung soll als freigebbar abgenommen werden\
**Wenn** der Abnahmenachweis zusammengestellt wird\
**Dann** besitzt jeder Fall M-01 bis M-17 mindestens eine konkrete ausführbare Prüfung auf der passenden Ebene sowie eine eindeutige Zuordnung zu Story/Abnahmekriterium und tatsächlichem Prüfergebnis für den geprüften Revisionsstand. M-01/M-02 Aktivierung, M-03/M-04 Vormerkung/Übernahme, M-05/M-06 Monatsformel, M-07 echtes Nachholen, M-08 bis M-12 Differenz/manueller/negativer Stand, M-13 Wechsel, M-14/M-15 Löschen, M-16 Übererfüllung und M-17 Konkurrenz/Grenzen/Commitfehler bleiben vollständig enthalten. Bestehende geeignete Tests werden referenziert statt durch bedeutungsgleiche Tests verdoppelt.\
**Und** zusätzliche Prüfungen belegen budgetierte Nullmonatsbindung auch nach späterer Übernahme, fehlendes Budget, verbrauchte unverarbeitete Löschmonate, Erstnachweis bei historischer Korrektur, manuelle Reparatur trotz blockiertem Nachholen, konsistente Lesesicht, Commitungewissheit, Fairness sowie vollständige v1-Lesebarriere. Vertrags-/Generator-/Kompilier-, Architektur-, echte PostgreSQL-/Rollen-/Migrations-/Prozess- und passende Browserprüfungen sind erfolgreich. Fehlende oder fehlgeschlagene Pflichtnachweise verhindern die Gesamtfreigabe; eine reine Dokumentbehauptung ersetzt sie nicht.

**AC-11 — Bedienung, Betrieb und Projektkontext nach tatsächlicher Umsetzung nachführen**

**Angenommen** die geprüfte Funktion und ihre technischen Grenzen stehen fest\
**Wenn** README, Abnahmeunterlagen und betroffener Projektkontext aktualisiert werden\
**Dann** beschreiben sie verständlich ausdrückliche Aktivierung, unveränderlichen Start, Vormerkung, vollständige Übernahme, historische Differenz, signierten Fortschritt, Löschfolgen und unabhängiges Nachholen. Technische Dokumentation nennt den regulären Freigabe-/Sperrweg, getrennte Rollen und administrative Bereitstellung, sichere Beobachtung/Wiederholung sowie die tatsächlich geltende Rücknahmegrenze. Der verwaltete Projektkontext wird anhand der umgesetzten und geprüften Regeln nachgeführt; historische Epic-/Story-/Sprint-Nachweise werden nicht rückwirkend als neue Fertigmeldungen umgeschrieben.\
**Und** offene Entscheidungen zu Export, Kontolöschung, Aufbewahrung einschließlich Monatsnachweisen, Kontowiederherstellung/E-Mail-Bestätigung sowie VPS, Domain, festen Images, externen verschlüsselten Backups, getestetem Wiederherstellungsweg und Überwachung bleiben ausdrücklich offen, bis sie tatsächlich geklärt sind. Gleiches gilt für die Bewertung von Anmeldedrosselung/parallelen Argon2-Prüfungen. Daraus werden keine zusätzlichen fertigen Verwaltungsflächen, echten Daten, gesendeten Nachrichten oder Produktionsfreigaben abgeleitet. Geheimnisse bleiben außerhalb versionierter Dateien.

**AC-12 — Gemeinsamen Freigabepfad positiv und negativ im isolierten Prüfstand belegen**

**Angenommen** der integrierte Kandidat hat die fachlichen, Sicherheits- und Bedienvoraussetzungen der vorherigen Stories nachgewiesen und die reguläre Bereitstellung bleibt zunächst geschlossen\
**Wenn** der dokumentierte reguläre Freigabeweg mit tatsächlichen Rollen/Startwegen und Testdaten geprüft wird\
**Dann** beweisen Negativfälle bei fehlender Gesamtabnahme, unpassendem Freigabestand, fehlender Jobbindung, falschen Rechten oder unvollständiger v1-Barriere die geschlossene Capability und direkte Aktivierung ohne Finanzwirkung. Der positive Fall verwendet den passenden tatsächlichen Freigabezustand, bietet reguläre ausdrückliche Aktivierung an und durchläuft Aktivierung ohne Ziel, sitzungsfreies Nachholen, 300-€-Übernahme auf 50 € sowie historische Korrektur/Wechsel/Löschung über reale Nutzerwege. Web-/Jobgrenzen werden nicht durch Testoverride oder Besitzerzugriff ersetzt.\
**Und** die isolierte Abnahme erfolgt gestuft: Voraussetzungen nachweisen, den regulären Freigabepfad im Teststand ausführen, positive/negative Freigabefälle belegen und erst danach den vollständigen endgültigen Nachweis für eine Bereitstellung feststellen. Fehlender positiver Nachweis lässt die reguläre Bereitstellung geschlossen; erfolgreiche Prüfung aktiviert keine anderen Konten und öffnet keine Produktionsumgebung. Die endgültige Evidenz unterscheidet umgesetzte/ausgeführte/erfolgreiche Prüfungen von bloßen Planungsabnahmen. Der vollständige Automatiklebenszyklus benötigt danach keine spätere Story, um fachlich korrekt benutzbar zu sein; offene Betriebsbedingungen bleiben eigenständig bestehen.
