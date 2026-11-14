- source_spec: `spec-1-2-anmelden-sitzung-verlaengern-und-beenden.md`
  summary: Anmeldedrosselung und begrenzte parallele Argon2-Prüfung anhand des Produktionslastprofils bewerten (hohe Auswirkung unbestätigt).
  evidence: Die Anmeldung hat keine Admission-/Ratenbegrenzung; jede Anfrage mit gültiger CSRF und Origin führt eine Argon2-Prüfung aus. Eine konkrete Ressourcenüberschreitung wurde nicht nachgewiesen. Zielhost, erwartete Last, parallele HTTP-Lastprüfung und Speicher-/CPU-Messung müssen geeignete Grenzen belegen; vor Produktionsbetrieb entscheiden.

- source_spec: `spec-3-1-eigenen-kontozugang-ueber-api-v2-nutzen.md`
  summary: Vorhandene Generatorausgaben bei Vertragsumbenennungen gegen veraltete Dateien absichern.
  evidence: Bereits der bisherige Java-/Angular-Generator bereinigt seine Zielordner nicht. Nach einer späteren Tag-/Modellumbenennung könnten alte generierte Dienste lokal Imports weiter erfüllen, während ein sauberer CI-Build diese nicht mehr findet. Die aktuelle Story übernimmt keine solchen Umbenennungen; eine Bereinigung muss die unter v1 verschachtelte v2-TypeScript-Ausgabe berücksichtigen.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-2-browserzugang-v2-und-rotes-abmelden.md`
  summary: Vorbestehende automatische Widerrufe nach Ablauf, Refreshfehler oder Loginabbruch müssen fehlgeschlagene Serverwiderrufe sichtbar und ausdrücklich wiederholbar machen.
  evidence: Review Blind 3; bereits der Basisstand verwirft in Session.end und Session.cancelLogin das boolesche Ergebnis von revoke. Bei HTTP-Fehler kann das Refresh-Cookie erhalten bleiben. Die explizite Abmeldung dieser Story verfolgt ihren Abschluss; automatische Aufrufer benötigen einen eigenen nachgewiesenen Fehler-/Retry-Ablauf.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-2-browserzugang-v2-und-rotes-abmelden.md`
  summary: Eingangsfokus nach Sitzungsende und tatsächliche Screenreader-Ankündigung der Anmeldung manuell prüfen und bei Bedarf nachführen.
  evidence: Review Blind 5; bereits die v1-Abmeldung entfernt die fokussierte Aktion und navigiert ohne ausdrücklich gesetzten Eingangsfokus. Programmatische Rollen, Status und Tastaturwege sind geprüft; die gesprochene Ausgabe und deren zeitliche Ankündigung benötigen einen eigenständigen Screenreader-Test.

- source_spec: `spec-3-3-bestehende-ausgaben-und-budgets-verlustfrei-weiterfuehren.md`
  summary: Effektive Tabellen-/Spaltenrechte beim Backendstart gegen das vorgesehene Minimalprofil prüfen.
  evidence: Blind 1; bereits vor Story 3.3 prüfte der Startwächter keine vollständige ACL. Migration und neuer Rechteabgleich setzen das vorgesehene Profil, erkennen jedoch keine anschließend administrativ erweiterten Feldrechte beim direkten Backendstart.

- source_spec: `spec-3-3-bestehende-ausgaben-und-budgets-verlustfrei-weiterfuehren.md`
  summary: Administrativ hinzugefügte Wechselmöglichkeiten in privilegierte Rollen beim Start erkennen.
  evidence: Blind 2; bestehender Wächter prüft eigene Attribute und Besitzer-/Migratormitgliedschaften, keine übrigen per SET erreichbaren Rollenattribute. Die vorgesehenen Rollen besitzen solche Mitgliedschaften nicht; PostgreSQL 18 dokumentiert getrennte SET-/INHERIT-Rechte unter https://www.postgresql.org/docs/18/role-membership.html.

- source_spec: `spec-3-3-bestehende-ausgaben-und-budgets-verlustfrei-weiterfuehren.md`
  summary: Erzwungene RLS zusätzlich auf administrativ aufgeweichte Policysemantik prüfen.
  evidence: Blind 3; bereits der Basisstand überprüfte beim Start keine Policyinhalte. V9 bewahrt die bestehenden korrekten Policies; ENABLE/FORCE allein würde eine zusätzlich angelegte permissive USING-true-Policy nicht erkennen.

- source_spec: `spec-3-3-bestehende-ausgaben-und-budgets-verlustfrei-weiterfuehren.md`
  summary: Rechteabgleich bei zusätzlichen geerbten Gruppenrechten um eine effektive Privilegienprüfung ergänzen.
  evidence: Blind 4; neue Provisionierung entzieht direkte PUBLIC-/runtime-ACLs, keine Rechte anderer Gruppenrollen. Solche administrativ eingerichteten Mitgliedschaften und deren Rechte wären schon vor der Story wirksam; sie werden durch den vorgesehenen Initialisierungsweg nicht angelegt.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-4-eigene-ausgaben-im-getrennten-bereich-ueber-api-v2-verwalten.md`
  summary: Abschlussbarriere oder Operationsidentität für explizite Wiederholungen nach einem Browsertimeout bewerten.
  evidence: Blind 2; bereits vor dieser Story konnte eine Mutation nach dem 30-Sekunden-Browsertimeout auf die Kontosperre warten, während ein ungesperrter Historienabruf den alten Bestand liefert. Neuladen und menschliche Prüfung beweisen keinen abgeschlossenen Servervorgang; eine spätere ausdrücklich wiederholte Anlage kann zusätzlich committen. Ein belastbarer Verbesserungsnachweis benötigt einen blockierten ursprünglichen Vorgang über Timeout und Prüfabruf hinweg.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-4-eigene-ausgaben-im-getrennten-bereich-ueber-api-v2-verwalten.md`
  summary: Bestehende Entwurfsverwerfung beim Verlassen eines Hauptbereichs auf verständliche Verwerfungsentscheidung oder flüchtigen Erhalt prüfen.
  evidence: Blind 3; bereits der Basisstand leert persönliche Formulare bei Routenzerstörung, etwa Monat → Sparziele → Monat; README benennt dieses Verhalten. Der vorhandene Schutz offener Budgetentwürfe gegen Hintergrundantworten bleibt wirksam, schützt aber keinen bereits verlassenen Formularbereich.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-5-monatsbudget-und-restbudget-ueber-api-v2-pruefen-und-aendern.md`
  summary: Abwehr künstlich beschädigter einzelner Ausgaben bei weiterhin gültiger Monatssumme bewerten.
  evidence: Die unveränderte öffentliche Monatssummenprojektion prüft die Summe, nicht jeden Einzelwert; −1 und 101 würden 100 ergeben. Reguläre Schreibpfade und Datenbank-Constraints verhindern solche Bestände, zusätzliche Verteidigung bei außerplanmäßig beschädigten Daten fehlt bereits vor Story 3.5.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-5-monatsbudget-und-restbudget-ueber-api-v2-pruefen-und-aendern.md`
  summary: Abschlussnachweis eines nach Browsertimeout noch laufenden Budgetvorgangs vor weiteren Mutationen untersuchen.
  evidence: Der Timeoutnachweis hält eine bereits committete Antwort zurück. Ein ursprünglicher PUT kann dagegen noch auf der Kontosperre warten, während ein ungesperrter Prüf-GET bereits antwortet; dasselbe Risiko bestand beim früheren v1-Budget-Retry. Eine serverseitige Vorgangsidentität oder Abschlussbarriere wäre gesondert zu entwerfen.
- source_spec: `_bmad-output/implementation-artifacts/spec-3-8-tatsaechlichen-gesamtfortschritt-auch-negativ-speichern.md`
  summary: Allgemeine SQL-/Lockzeitgrenzen und Poolentlastung bei administrativ gehaltenen Datenbanksperren anhand des Betriebs-/Lastprofils bewerten.
  evidence: Review B4; die neue technische Zeilensperre kann wie die bereits vorhandenen unbegrenzten Kontosperren aus FinanceTransactions Verbindungen binden. Der reguläre Versionsguard beendet API/DB-Arbeit vor seiner Zustandsänderung; eine langsame reguläre Nutzeroperation innerhalb der Versionssperre wurde nicht gezeigt. Vor einer breiten Timeoutgestaltung das konkrete Zielprofil, wartende Kontosperren und administrative Locks gemeinsam messen und sichere Abbruch-/Rollbackgrenzen nachweisen.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-8-tatsaechlichen-gesamtfortschritt-auch-negativ-speichern.md`
  summary: Gesprochene Ausgabe des signierten Zielablaufs mit einem konkreten Screenreader nachweisen (mittlere Auswirkung unbestätigt).
  evidence: Review N4; automatisierte ARIA-Snapshots, Tastatur-/Fokusnachweise und Axe zeigen tatsächliche signierte Beträge/Prozente sowie programmatische Fehler-/Statuszustände. Ob eine bestimmte Screenreader-/Browserkombination Vorzeichen, Funktionssperre und Speicherstatus korrekt und rechtzeitig spricht, wurde nicht praktisch ausgeführt; dafür vollständigen Ablauf mit dokumentierter Kombination und Ergebnis prüfen.

- source_spec: `_bmad-output/implementation-artifacts/spec-4-4-historische-ausgaben-mit-monatsueberschusskorrektur.md`
  summary: Finanzansichten nach Bereichswechsel während einer noch laufenden Mutation bereichsübergreifend als erneuerungsbedürftig kennzeichnen und nach deren Abschluss aktualisieren.
  evidence: Review B1; bereits der Basisstand verwirft Antworten zerstörter Ausgabenansichten und meldet das spätere settle ausschließlich über ExpenseOperations. Eine vor dem Commit geöffnete Monatsansicht kann deshalb den alten Snapshot behalten; dieselbe allgemeine Grenze betrifft jetzt zusätzlich die Sparzielübersicht. Das nach bestätigtem/geklärtem Ausgang geforderte nächste Öffnen lädt korrekt neu. Ein gezielt vor Commit gehaltener PUT mit Navigation und anschließendem Freigeben muss einen künftigen allgemeinen Aktualisierungsmechanismus samt Sitzungsschutz und Entwurfserhalt belegen.

- source_spec: `_bmad-output/implementation-artifacts/spec-4-5-sparziel-loeschen-und-historische-monatsbindungen-verbraucht-halten.md`
  summary: Vor öffentlicher Gesamtfreigabe einen ausdrücklichen Reparaturweg für bereits vor V16 gelöschte, weiterhin aktuell referenzierte Ziele in übernommenen Automatikzuständen festlegen.
  evidence: Review B9; FinanceApplication.deleteGoal im Basisstand 7967faf00455052a8fb8fb53072f8c6ab042f7be entfernt nur das Live-Ziel. Erhaltene Auswahlhistorie kann danach auch spätere Monate weiter an die fehlende ID binden und verbrauchen, während die Übersicht keine Auswahl zeigt. Die öffentliche Automatik war gesperrt; positive Vorgängerzustände waren testintern möglich. Ohne gespeicherten Löschzeitpunkt lässt sich deren tatsächlicher Grenzmonat nicht zuverlässig rekonstruieren. Ein befüllter V15-Upgradefall mit anschließenden Monatsabschlüssen muss einen ausdrücklich festgelegten Reparaturweg belegen; keine vermutete historische Leerung oder modulübergreifende Migrationsabfrage einführen.
