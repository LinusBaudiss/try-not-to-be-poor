---
title: 'Story 3.4: Eigene Ausgaben im getrennten Bereich über API v2 verwalten'
type: 'feature'
created: '2026-10-27'
status: 'done'
route: 'dispatch'
story_key: '3-4-eigene-ausgaben-im-getrennten-bereich-über-api-v2-verwalten'
review_loop_iteration: 0
baseline_commit: '2e35615ab980d26a61a42feed91e965acfc78b77'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/epics.md'
---

<frozen-after-approval reason="Nutzerabsicht; Änderungen nur nach erneuter Abstimmung">

## Intent

**Problem:** Ausgabenverwaltung liegt in Monat und verwendet v1.

**Approach:** Vollständiges Ausgaben-CRUD über v2 unter `/ausgaben`; Monat behält Budget/Übersicht. Story 3.4/AC-1–11 aus `epics.md` gelten vollständig.

## Boundaries & Constraints

**Always:** Navigation Monat/Ausgaben/Sparziele, Start Monat, gemeinsame rote Abmeldung. JWT-Konto, FORCE RLS, bestehende äußere Finanztransaktion/Kontosperre und Commitbestätigung erhalten. Positive exakte Cent bis 9007199254740991 einschließlich Monatssummen; bestehende Namensvalidierung, unveränderliche Herkunft und serverseitiger Kalender Europe/Berlin. Sämtliche sichtbaren/assistiven Systemtexte ohne Zeitzonenerläuterung; Nutzereingaben unverändert. Daten/Entwürfe nur im Arbeitsspeicher; Sitzungs-/Ansichtsgenerationen schützen Antworten.

**Never:** v1-Vertrag ändern, neue Datenbankobjekte, Direktzugriffe außerhalb der Modulgrenzen, pauschale Sicherheitsfreigaben, automatische Mutationswiederholung. Budget/Ziele bleiben über v1 bedienbar; keine v1-Stilllegung, negativen Sparfortschritte, Automatik oder Produktionsfreigabe.

## I/O & Edge-Case Matrix

| Zustand | Erwartung |
| --- | --- |
| Gültige Anlage/Änderung/Löschung | Erst 201/200/204 bestätigt Listenänderung; Bearbeitung erhält ID/Eigentümer/Datum. |
| Ungültiger Betrag/Name/Summenüberlauf | Feldfehler, keine Teilmutation, Entwurf erhalten. |
| Fremde/fehlende ID, Cookies allein | Identische neutrale 404 beziehungsweise 401; alle Antworten no-store. |
| Offline/ausstehend/unbestätigt | Doppelsenden sperren; vor Wiederholung erfolgreicher Listenabruf und ausdrückliche Prüfung; gleicher Name/Betrag beweist keinen Erfolg. |
| Monatsrückkehr/späte Antwort | Frische konsistente Monatswerte; historische Änderung beeinflusst laufenden Rest nicht; offene Entwürfe nicht überschreiben. |
| Sitzungsende/Kontowechsel | Persönliche Zustände verwerfen, alte Antworten wirkungslos. |

</frozen-after-approval>

## Code Map

Java-Pfade relativ zu `backend/src/main/java/de/linus/tnbp/`.

- `finance/FinanceApplication.java`, `expenses/`: CRUD, Kalender, Sperren und Summengrenzen vollständig vorhanden; wiederverwenden.
- `finance/http/{ExpenseController,ExpenseErrors}.java`: v1-Vorbild; controllergebundene Fehlerzuordnung.
- `frontend/src/app/month/expenses.ts`: vollständige Formulare, Historie, Dialog/Fokus und Antwortprüfung; bisher nur textliche Warnung vor unbestätigter Wiederholung.
- `frontend/src/app/month/{month,month-summary}.ts`: frischer Instanzabruf, Budgetabgleich/Sequenzschutz und serverzeitbasierte Monatserkennung erhalten. Sitzung/Interceptor unterstützen v2 bereits.

## Tasks & Acceptance

**Execution:**
- [x] `api-contract/v2/openapi.yaml` zuerst erweitern: GET/POST `/expenses`, PUT/DELETE `/expenses/{expenseId}`; Request `name/amountCents`, Antwort zusätzlich `id/recordedOn`, strikte Felder, Grenzen, Feldfehler, 400/401/404/Serverfehler, Bearer/no-store. Clients generieren.
- [x] `finance/http/{ExpenseV2Controller,ExpenseV2Errors}.java`, `access/AccessConfiguration.java`: dünne v2-Adapter über dieselbe Koordination; nur konkrete Methoden/Pfade authentifizieren, CSRF-Ausnahmen und 401-Zuordnung gezielt erweitern; Zugangsschutz erhalten.
- [x] `frontend/src/app/expenses/{expenses,expenses-page}.ts`: bestehende Komponente verschieben, generierten v2-Dienst/Typen verwenden; geschützte Seite mit Identitätsprüfung und Logout. Ungewissheitszustand sperrt Wiederholung bis Neuladen/ausdrücklicher Prüfung, erhält Entwürfe und behauptet keinen Erfolg.
- [x] `frontend/src/app/{app,app.routes,month/month,month/month-summary}.ts`, `frontend/src/styles.css`: Route/Navigation und Überschriftenfokus ergänzen, Ausgabeneinbettung entfernen, Systemhinweise vereinfachen; Monatsrückkehr einschließlich Browserhistorie frisch laden und Generationsschutz erhalten.
- [x] `backend/src/test/java/de/linus/tnbp/{expensebudget/ExpenseIT,expensebudget/ExpenseV2IT,finance/FinanceMigrationIT}.java`: gemeinsame HTTP-Fälle für beide Versionen nutzen; Matrix, zwei Konten, striktes JSON, Sicherheitsgrenzen, migrierter/geteilter Bestand, Herkunft/Monatsgrenzen und Commitfehler belegen.
- [x] `frontend/e2e/{expenses,expense-mutations,month-summary,session}.spec.ts`: Navigation/v2 umstellen; Matrix, CRUD-Rückkehrrest, Zurück/Vorwärts, verzögerte Antworten, drei Abmeldungen, „Berlin-Fahrt“, Kalender/DST und Systemtexte prüfen. Vier Viewports mit 200-%-Text, axe, Tastatur/Touch und Dialogfokus abdecken.
- [x] `README.md`: neuen Bereich/v2-Ausgaben und internen Übergang dokumentieren.

**Acceptance Criteria:**
- Angenommen eine Sitzung, wenn Hauptbereiche geöffnet werden, dann sind Ausgaben ausschließlich unter `/ausgaben` mit vollständiger Historie aller Monate, Datum absteigend/ID, mobil beschriftet und am Desktop als Tabelle erreichbar.
- Angenommen eine bestätigte Mutation, wenn Monat erneut geöffnet wird, dann gelten frische konsistente Budget-/Summen-/Restwerte; fehlendes Budget, null und negativer Rest bleiben unterscheidbar.
- Angenommen Tastatur/Touch und 200-%-Text, wenn CRUD bei 320×568/390×844/768×1024/1280×800 bedient wird, dann funktionieren Fokus/Dialog/Status ohne horizontalen Überlauf; Aktionen ≥44, Geldfelder ≥48 CSS-Pixel, Textkontrast ≥4,5:1 und Kontrollen/Fokus ≥3:1.

## Implementation Notes

- Vertrag zuerst erweitert und generiert; v2-Adapter verwenden unverändert die vorhandenen Anwendungsfälle. Keine Migration und keine manuell geänderte Generatorausgabe.
- Eigenständige identitätsgeprüfte Ausgabenseite mit flüchtigem Ungewissheitszustand: erfolgreicher Historienabruf und ausdrückliche Prüfung sind vor weiteren Mutationen erforderlich. Routenzerstörung/Sitzungswechsel löschen persönliche Zustände; neue Monatsinstanzen laden frisch.
- Sicherheitsnachweis zeigte Springs zusätzliche pauschale Bearer-CSRF-Ausnahme. Der fertige CSRF-Filter verwendet deshalb ausschließlich die konkreten Methoden-/Pfadausnahmen; Login/Refresh/Logout verlangen auch mit Bearer weiterhin CSRF. Beide Ausgabenversionen und Zugangsschutz erfolgreich geprüft.
- Unabhängig gelesen: vollständiger vorgemerkter Diff gegen die Basisrevision. README-Bedienhinweise auf drei Bereiche/v2-Ausgaben und frische Monatsrückkehr vervollständigt.

- Reviewkorrekturen: Nicht exportierter `ExpenseOperations`-Koordinator hält ausschließlich Pending-/Ungewissheitsflags und Vorgangsnummern pro Sitzungsgeneration über Bereichswechsel. Verlassene Ansichten behalten keine Formulardaten; alte Vorgänge können eine neue Sitzung nicht sperren/entsperren. Die Prüfung erhält ein Fokusziel; Löschstart ist bis zur Klärung gesperrt. GET bestätigt nur Status 200 und exakte Antwortfelder; v2 dokumentiert vorhandenes 415. Netzwerkprüfung umfasst alle vier Ausgabenmethoden und schließt v1-Ausgabenverkehr aus.
- Korrigierten Diff unabhängig gelesen. Gezielte Reviewnachweise: 74 Browserfälle erfolgreich, v2-Vertrag valide. Neue Navigationstests decken ausstehendes POST/PUT/DELETE, unbestätigte Vorgänge und Sitzungsende ab; GET-206/Zusatzfelder sowie POST-/PUT-Zusatzfelder und Fokus sind ausdrücklich geprüft.

## Spec Change Log

## Review Triage Log

Alle drei Reviewebenen abgeschlossen. Jede Meldung vor Gruppierung einzeln eingeordnet:

| Befund | Urteil und Evidenz | Behandlung |
| --- | --- | --- |
| Blind 1: Bereichswechsel verwirft Pending/Ungewissheit | medium: `onDestroy → clear` löscht beide Flags; eine neue Instanz lädt und erlaubt weitere Mutationen während der ursprüngliche Vorgang noch läuft oder ungeprüft bleibt. | patch: private Sitzungsschutzflags über Instanzen erhalten; Altantworten weiter verwerfen |
| Blind 2: Neuladen beweist keinen Abschluss einer blockierten Mutation | medium: Historienlesen nimmt keine Kontosperre; ein nach Browsertimeout weiter wartendes POST kann erst nach dem Prüfabruf committen. Derselbe Timeout und ungesperrte Historienabruf bestanden bereits vor dieser Story. Die Oberfläche garantiert keine automatische Zuordnung/Idempotenz. | defer: Abschlussbarriere/Operationsidentität gesondert untersuchen |
| Blind 3: Navigation verwirft offene Entwürfe | medium: Verlassen/Zerstörung leert Formulare bereits im Basisstand, etwa Monat → Sparziele → Monat; README beschreibt diese bestehende Verwerfungsregel. Der unveränderte Budgetabgleich schützt dagegen offene Entwürfe bei Hintergrundantworten nach AC-7, nachgewiesen im vorhandenen Browserfall. | defer: bestehende Entwurfsverwerfung bei Bereichswechsel getrennt bewerten |
| Blind 4: Bestätigungsaktion verliert Tastaturfokus | low: `confirmReview` entfernt den fokussierten Button ohne Ziel; im neuen Wiederherstellungsablauf direkt erreichbar. | patch: Fokus auf erhaltenen Editor oder Erfassung |
| Blind 5: Löschdialog trotz Ungewissheit erreichbar | medium: Zeilenaktionen/startDelete prüfen das Flag nicht; Dialogbestätigung gesperrt, Erklärung liegt außerhalb des modalen Bereichs. | patch: Öffnen während Ungewissheit sperren |
| Blind 6: GET übernimmt 206 als vollständige Liste | low: `getExpenses()` beobachtet nur den Körper; eine gültig geformte Teilantwort würde die Prüffreigabe ermöglichen. | patch: Status 200 ausdrücklich prüfen und abweichende Status testen |
| Blind 7: Vertragsantwort 415 fehlt | low: Beide Mutationsadapter erhalten 415 samt Accept-Header; geerbter Integrationstest belegt dies, v2 dokumentiert es noch nicht. | patch: bestehende 415-Antwort für POST/PUT beschreiben |
| Blind 8: Kein Touch-CRUD-Nachweis | false: `expense-mutations.spec.ts` enthält einen ausgeführten Mobile-/hasTouch-Kontext mit Bearbeiten per tap, Löschabbruch und bestätigtem Löschen per tap; Anlage erfolgt ebenfalls in diesem Kontext. Die Behauptung, Touch prüfe nur Logout, trifft nicht zu. | reject |
| Blind 9: Netzwerknachweis erlaubt zusätzliche v1-Ausgaben | low: Der einzelne Netzwerktest verwendet nur arrayContaining und besucht die Liste; andere Ausgabentests prüfen konkrete v2-Mutationen, ein zusätzlicher v1-Aufruf würde jedoch nicht ausdrücklich im Netzwerkprofil ausgeschlossen. | patch: vier Methoden/Pfade und negative v1-Ausgabenbehauptung ergänzen |
| Blind 10: Kopierte Fehleradapter könnten später divergieren | false: Aktuell sind Klassifikation/Feldfehler identisch; unterschiedliche generierte v1-/v2-Antworttypen sind erforderlich. Es ist kein abweichender Aufrufer oder fehlerhafter gegenwärtiger Pfad nachgewiesen. | reject: hypothetische spätere Wartungsdivergenz rechtfertigt keine zusätzliche gemeinsame Abstraktion |
| Edge 1: Navigation umgeht explizite Historienprüfung | medium: Derselbe bestätigte Lebenszyklusfehler wie Blind 1; ein gewöhnlicher Routenwechsel beendet keine Sitzung. | patch, gemeinsame Ursache mit Blind 1 |
| Verification Gap 1: Exakte Antwortfelder ungeprüft | low: Vorverifizierte Testlücke; sonst gültige GET-/POST-/PUT-Antworten mit Zusatzfeld fehlen, daher könnte die neue Object.keys-Prüfung unbemerkt entfallen. | patch: Zusatzfeldfälle mit Entwurferhalt/unbestätigtem Status |
| Verification Gap Other 1: Route löscht Ungewissheit | medium: `clear()` und neue Instanz bestätigen denselben Fehler wie Blind 1/Edge 1. | patch, gemeinsame Ursache mit Blind 1 |

## Design Notes

Keine offenen Produktfragen oder irreversiblen Änderungen; mehrere Schichten und neuer Vertrag erfordern den vollständigen Ablauf.

## Verification

- `./scripts/check-contract.sh`: beide Versionen kompatibel, generierte Schnittstellen und SPA kompilieren.
- `./backend/mvnw -f backend/pom.xml verify`: PostgreSQL-/Sicherheits-/Koordinationsregression erfolgreich.
- `npm --prefix frontend run e2e`: HTTPS-Browsernachweise einschließlich Matrix erfolgreich.

### Ausgeführt am 2026-10-27

- `./scripts/check-contract.sh`: beide Verträge valide/kompatibel; getrennte Java-/Angular-Schnittstellen und SPA erfolgreich kompiliert. V1-Vertrag und Migrationen unverändert.
- `./backend/mvnw -f backend/pom.xml verify`: 44 Unit-/Architekturprüfungen und 169 Integrationstests, jeweils null Fehler/übersprungene Fälle. XML-Berichte unabhängig ausgewertet.
- `npm --prefix frontend run e2e`: abschließend 167/167 erfolgreich mit unverändertem Quellstand. Vier Viewports, 200-%-Text, axe, Touch, Sitzungsgrenzen und Kalender/DST enthalten.
- `python3 -m unittest discover -s scripts/tests -v`: 12/12 erfolgreich. `git diff --check` sauber.
- Abschlussprotokolle: `/tmp/story34-backend-final.log`, `/tmp/story34-contract-final.log`, `/tmp/story34-e2e-final.log`, `/tmp/story34-python.log`.

### Unabhängiger Matrixaudit

Alle folgenden Nachweise sind im erfolgreichen abschließenden Lauf enthalten:

| Matrixzeile | Ausgeführte Nachweise |
| --- | --- |
| Gültiges CRUD/Herkunft/Commit | Geerbte `ExpenseV2IT.speichernIstGetrimmtBestaetigtUndHistorieUmfasstAlleEigenenMonate`, `bearbeitungUndLoeschungBewahrenMetadatenUndVerwendenDenUrspruenglichenMonat`, beide Commitfehlerfälle; Browserfälle für gehaltenes POST/PUT/DELETE. |
| Ungültige Werte/Summe/Entwurf | `ExpenseV2IT.jsonTypenFeldfehlerUndFremdeEigentuemerOderDatumsfelderErzeugenKeineMutation`, `monatssummeUndRestBleibenExaktUndAndereKontenOderMonateSindUnabhaengig`, `putLehntStriktesJsonUndUngueltigeFelderOhneRundungAb`; Feldfehlerfälle in beiden Ausgabensuiten. |
| Fremde/fehlende ID/Cookies/no-store | `ExpenseV2IT.fremdeUndFehlendeIdsSindIdentischNeutralOhneMutation`, `jwtPruefungUndCookieAlleinVerweigernBeideRouten`, `mutationsRoutenPruefenJwtUndAkzeptierenKeineCookiesAllein`; gemeinsamer HTTP-Helfer prüft no-store. |
| Offline/ausstehend/unbestätigt | Browserfälle „Fehler, Netzabbruch und ungeprüfte Antworten“, „verlorene Antwort nach Commit“, verlorene PUT-/DELETE-Antworten und Zeitüberschreitungen: Entwurf erhalten, gesperrte Wiederholung, Neuladen und ausdrückliche Prüfung. |
| Monatsrückkehr/späte Antwort | Browserfälle „drei Hauptbereiche … Zurück/Vorwärts“, „frühere Monate … Rest … nicht“, „Monatsrückkehr … ausstehende Antwort“, „späte Historie … Rückkehr“ und vorhandener Budgetentwurfsabgleich. |
| Sitzungsende/Kontowechsel | Ausgabensuiten für verspätete Historie/POST/PUT/DELETE nach Abmeldung, Konto- und Tokenwechsel; persönlicher alter Komponenteninhalt nachweislich leer. |

### Abschluss nach Reviewkorrekturen

- Alle angenommenen Patches umgesetzt und deren Diff unabhängig gelesen. Vollständige Wiederholung nacheinander: beide Vertrags-/Generator-/Buildprüfungen erfolgreich, 44 Unit-/Architekturprüfungen und 169 PostgreSQL-Integrationstests ohne Fehler/übersprungene Fälle, 173/173 HTTPS-Browserfälle erfolgreich. Der Anwendungscode blieb während des Browserlaufs unverändert.
- Erneuter Matrixaudit: sämtliche zuvor zugeordneten Fälle im Abschlusslauf enthalten. Zusätzlich erfolgreich: Navigationssperre bei ausstehendem POST/PUT/DELETE, Ungewissheit nach Rückkehr, 206-/Zusatzfeldablehnung, Sitzungsende bei laufender/unbestätigter Mutation, Fokus nach Prüfung und Netzwerkprofil ohne v1-Ausgabenverkehr.
- Abschlussprotokolle nach den Korrekturen: `/tmp/story34-review-final-contract.log`, `/tmp/story34-review-final-backend.log`, `/tmp/story34-review-final-e2e.log`. Die zwölf Pythonprüfungen aus dem Implementierungslauf bleiben erfolgreich; ihre Dateien wurden nicht geändert.
- Drei unabhängige Reviewebenen abgeschlossen; keine offenen Korrekturen oder Absichtsfragen. Zwei Bestandsverbesserungen nach `deferred-work.md` übertragen: Abschlussnachweis einer nach Browsertimeout weiter laufenden Mutation sowie Entwurfsverwerfung beim Verlassen von Formularbereichen.
- Freigegebener Intent, v1-Vertrag und sämtliche Datenbankmigrationen unverändert. `git diff --check` erfolgreich.
