---
title: 'Story 3.6: Eigene Sparziele und Gesamtfortschritt über API v2 pflegen'
type: 'feature'
created: '2026-10-27'
status: 'done'
route: 'dispatch'
story_key: '3-6-eigene-sparziele-und-gesamtfortschritt-über-api-v2-pflegen'
review_loop_iteration: 0
baseline_commit: 'e63784cb861bbd2fb57a0d691491e95dad2b408f'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
---

<frozen-after-approval reason="Nutzerabsicht; Änderungen nur nach erneuter Abstimmung">

## Intent

**Problem:** Sparziele verwenden noch v1; negative Antworten sind nicht darstellbar und unbestätigte Mutationen unmittelbar wiederholbar.

**Approach:** Die vollständige Zielpflege auf fünf v2-Operationen umstellen. Story 3.6/AC-1–11 aus `_bmad-output/planning-artifacts/epics.md` gelten vollständig.

## Boundaries & Constraints

**Always:** JWT-Konto, FORCE RLS, öffentliche Modulzugänge, Kontosperre und äußerer Commit. Exakte Cent bis ±9007199254740991, positive Zielbeträge, Kalenderdaten 0001–9999. Gesamtfortschritt ersetzen; Zielbearbeitung erhält Fortschritt. Flüchtige Entwürfe und Sitzungsschutz erhalten.

**Never:** V1-Vertrag oder DB-Grenzen ändern, negative Werte persistieren, Freigabeschalter ergänzen, v1 stilllegen, Automatik oder Produktionsfreigabe vorziehen. Kein v1-Rückfall, blindes Wiederholen oder Beitragsverlauf.

## I/O & Edge-Case Matrix

| Zustand | Erwartung |
| --- | --- |
| Zielpflege | Start 0; Datum fehlend/null entfernt; Löschen bestätigt. Fortschrittsersatz idempotent; Monatsrest unverändert. |
| Signierte Antwort | −30/70/150 bei Ziel 100 zeigen tatsächlichen Betrag/Prozent; nur Balken 0–100 %. Sichere Extreme exakt. |
| Negativer Schreibwert | Gültiger signierter Wert: 409 FEATURE_NOT_AVAILABLE ohne Mutation; ungültige Werte: 400. |
| Fehler/offline/unbestätigt | Entwurf erhalten, Erfolg nicht behaupten; vor Wiederholung Bestand laden und ausdrücklich prüfen. |
| Hintergrund/Navigation/Sitzung | Entwürfe und neue Bestätigungen nicht überschreiben; Vorgangsschutz über Bereichswechsel erhalten, bei Sitzungswechsel alles verwerfen. |

</frozen-after-approval>

## Code Map

Java-Pfade relativ zu `backend/src/main/java/de/linus/tnbp/`.

- `finance/FinanceApplication.java`, `savingsgoals/SavingsGoals.java`: alle Zieloperationen koordiniert vorhanden; nichtnegative Persistenz erhalten.
- `finance/http/SavingsGoalController.java`, `SavingsGoalErrors.java`, `SavingsGoalJson.java`: v1-Vorbilder und striktes Datum-Mixin wiederverwenden.
- `frontend/src/app/savings-goals/savings-goals.ts`: Formulare/Dialog/Sitzungsschutz wiederverwenden; v1-Aufrufe und lokale Sendesperre ersetzen.
- `frontend/src/app/shared/{money,savings-progress}.ts`: signierte Geldanzeige vorhanden; BigInt-Prozente erweitern. `frontend/src/app/{expenses/expenses,month/month}.ts` liefern Vorgangsschutz als Vorbild.

## Tasks & Acceptance

**Execution:**
- [x] `api-contract/v2/openapi.yaml`: zuerst GET/POST `/savings-goals`, PUT/DELETE `/{id}`, PUT `/{id}/progress` mit strikten DTOs, optional/null Datum, signiertem Fortschritt und 200/201/204/400/401/404/409/415/500 festlegen; getrennt generieren.
- [x] `finance/http/{SavingsGoalV2Controller,SavingsGoalV2Errors}.java` neu, `SavingsGoalJson.java`, `access/AccessConfiguration.java`: dünne v2-Adapter, Datum-Mixin, konkrete Methoden/Pfade/CSRF-Ausnahmen und 401 ergänzen; geschlossene serverseitige Negativsperre, neutrale Fehler/no-store, bestehenden Sitzungsschutz erhalten.
- [x] `frontend/src/app/savings-goals/savings-goals.ts`: generierten v2-Service/Typen verwenden; Status/Körper strikt prüfen, signierte Antworten darstellen; Prüfabruf und explizite Freigabe nach Ungewissheit, Pending-Rückkehr und Schutz gegen alte Antworten umsetzen. Nur Vorgangsflags überleben Navigation; keine Finanzdaten/Entwürfe.
- [x] `frontend/src/app/shared/savings-progress.ts`, `frontend/src/styles.css`: symmetrisch gerundete BigInt-Prozente, signierte Geldanzeige verwenden; assistiv tatsächlichen Stand ausgeben, Balken bei negativen Fällen verbergen. Negative Antwort darf den Editor nicht abstürzen lassen; Schreibbedienung bleibt nichtnegativ. Neue Prüfaktionen zugänglich gestalten.
- [x] `backend/src/test/java/de/linus/tnbp/savingsgoals/{SavingsGoalIT,SavingsGoalV2IT}.java`: bestehende HTTP-/PostgreSQL-Matrix für beide Versionen nutzen; gemeinsamen Bestand, Methoden, Datums-/Centgrenzen, neutrale Fremd-/Fehl-IDs, 409 ohne Datenwirkung und unveränderte DB-Grenze belegen. `backend/src/test/java/de/linus/tnbp/finance/FinanceCoordinationIT.java` für Sperre, gemeinsame Verbindung, Rollback/Commitfehler ausführen.
- [x] `frontend/e2e/{savings-goals,savings-progress,savings-mutations,session}.spec.ts`: v2-Matrix, Entwürfe, Löschdialog, Offline/Fehler/Timeout, verpflichtende Prüfung, Navigationsrückkehr und Sitzungswechsel nachweisen. Parser/Prozente/negative Extreme ausschließlich isoliert mit abgefangenen Antworten prüfen; alle fünf Zieloperationen und sämtliche übrigen Browseroperationen über v2 nachweisen.
- [x] `README.md`: v2-Zielpflege, Prüfablauf und internen Übergang dokumentieren.

**Acceptance Criteria:**
- Angenommen Bestandsziele zweier Konten, wenn alle fünf Operationen ausgeführt werden, dann gelten unveränderte Fachregeln, Datentrennung und Commitbestätigung gemäß AC-1–5/7–9/11.
- Angenommen isolierte signierte Antworten, wenn Parser und Anzeige arbeiten, dann bleiben Betrag/Prozent einschließlich symmetrischer Rundung und Extremwerten exakt; kein negativer DB-Bestand entsteht (AC-6/7/11).
- Angenommen 320×568, 390×844, 768×1024, 1280×800 und 200-%-Text, wenn sämtliche Zielzustände bedient werden, dann gelten Reflow, Labels/Status, Tastatur/Touch und sichtbarer Fokus; Aktionen ≥44×44, Geldfelder ≥48 Pixel, Textkontrast ≥4,5:1, Kontrollen/Fokus ≥3:1 (AC-10).

## Implementation Notes

- Vertrag zuerst erweitert und getrennt generiert; fünf dünne Adapter nutzen die bestehende Finanzkoordination. Das geschlossene Negativgate prüft eigene Zielidentität unter der gemeinsamen Kontosperre; keine Migration oder Aufweitung der Bestandsgrenze.
- Privater SavingsOperations-Dienst bewahrt ausschließlich Vorgangsflags über Navigation. Prüfabruf und ausdrückliche Bestätigung entsperren unbestätigte Mutationen; Sitzungsgeneration und Sequenz verhindern alte Antworten im neuen Konto. Formulare und Dialog behalten Entwürfe bei Fehlern.
- Signierte Antworten werden strikt geprüft; Geldanzeige und symmetrische BigInt-Prozente bleiben exakt. Der negative Balken ist assistiv verborgen; maßgeblich bleiben tatsächlicher Betrag und Prozentwert. Negative Editorwerte werden im Übergang nicht als speicherbar angeboten.
- Vollständigen vorgemerkten Diff gegen `e63784cb861bbd2fb57a0d691491e95dad2b408f` unabhängig gelesen: `/tmp/tnbp-story36-diff-V5gvn1.patch`. API-Fehlertext anschließend an die verpflichtende Bestandsprüfung angepasst und gezielt nachgeprüft.
- Reviewkorrekturen umgesetzt und ihren Diff unabhängig gelesen: `/tmp/tnbp-story36-review-fixes.patch`. Prüfabruf schließt den Löschdialog über den vorhandenen Abbruchweg und verwirft die alte Auswahl; Laden/Fehler/Prüfbestand sind anschließend zugänglich. Bestätigte Abwesenheit behauptet keinen Erfolg des ursprünglichen DELETE und erzeugt keinen weiteren DELETE.
- Negative gerundete Nullprozente behalten das Vorzeichen; tatsächliche negative Werte sind im Zugänglichkeitsbaum nachgewiesen. Deterministische Kontosperrprüfung des neuen Negativgates, gemischte v1/v2-Pflege sowie eigene Aktionssperren und vier UX-Größen des Löschprüfablaufs ergänzen die Nachweise.
- Der Ablaufnachweis bereitet Editor/Dialog vor dem nahen Sitzungsende vor und friert die Testuhr kontrolliert ein. Damit verbraucht reale Ausführungszeit nicht mehr das etwa zwei Sekunden breite Restfenster; verspätete PUT-/DELETE-Antworten werden weiterhin erst nach tatsächlichem Sitzungsende ausgeliefert und verworfen.

## Spec Change Log

## Review Triage Log

Jeder Befund wurde vor Gruppierung einzeln eingeordnet:

| Befund | Urteil und Evidenz | Behandlung |
| --- | --- | --- |
| Blind 1: Prüfbestand hinter modalem Löschdialog | medium: load(true) lädt die Liste im durch showModal inerten Hintergrund; Bestätigung im Dialog macht den Bestand nicht zugänglich. | patch: vorhandenen Löschdialog beim Prüfabruf schließen |
| Blind 2: Prüfabruf-Fehler im Dialog nicht angesagt | low: loadFailed aktualisiert nur den Hintergrundstatus; der Dialog behält den früheren Mutationsfehler. | patch: mit Blind 1, Status nach Schließen zugänglich prüfen |
| Blind 3: Fehlendes Ziel nach Prüfung erneut löschbar | medium: deleting behält die alte ID trotz leerer Prüfliste; confirmReview ermöglicht einen weiteren 404-/Ungewissheitszyklus. | patch: mit Blind 1, Dialogzustand beim Prüfabruf verwerfen; bestätigte Abwesenheit prüfen |
| Blind 4: Negatives Vorzeichen bei gerundeten null Prozent verloren | low: hundredths !== 0n unterdrückt bei negativem Fortschritt und kleinem Anteil das Vorzeichen. | patch: Vorzeichen am tatsächlichen Fortschritt ausrichten |
| Blind 5: Beliebiger 400-Körper erlaubt erneuten Versuch | false: Der Vertrag garantiert bei 400 keine Mutation. Alle 400-Handler behandeln Eingabeablehnung beziehungsweise Rollback; tatsächliche Commitfehler liefern nachweislich 500 und erzeugen die Prüfsperre. Ein abweichender Fehlerkörper macht diese HTTP-Ablehnung nicht zu einem belegten unbestätigten Commit. | reject |
| Blind 6: V2-Feldfehler nennt kopierten v1-Bereich | low: Fehlermeldung ab null unterscheidet syntaktischen signierten Bereich und Funktionssperre nicht. | patch: neutrale v2-Centfehlermeldung |
| Blind 7: Negativgate ohne gehaltene Kontosperre geprüft | medium: FinanceCoordinationIT ruft nur progressGoal auf; der neue progressGoalV2-Pfad wird lediglich sequenziell geprüft. | patch: deterministischer Sperr-/Löschnachweis |
| Blind 8: Gemeinsamer Bestand nur von v2 nach v1 gelesen | medium: Der neue Test legt ausschließlich über v2 an; Bestandsmutation und umgekehrte Änderungsrichtung fehlen. | patch: gemischte v1/v2-Mutationsfolge ergänzen |
| Blind 9: Modal enthaltene Prüfaktionen ohne vier UX-Größen | low: Neuer Kontrast-/Fokusfall erfasst ausschließlich den nichtmodalen Prüfbereich. | patch: mit Blind 1, Löschfehler und anschließenden zugänglichen Prüfablauf in vier Größen prüfen |
| Blind 10: Tatsächlicher Negativstand nicht im Zugänglichkeitsbaum geprüft | low: Text- und Balkenassertionen erkennen aria-hidden auf einem übergeordneten Wertebereich nicht. | patch: zugänglichen Zielinhalt ausdrücklich prüfen |
| Edge 1: Prüfbestand hinter modalem Löschdialog | medium: Derselbe bestätigte Pfad wie Blind 1; Hintergrundliste ist inert, Bestätigung bleibt im Dialog. | patch, gemeinsame Ursache mit Blind 1–3/9 |
| Edge 2: Negatives Vorzeichen bei gerundeten null Prozent verloren | low: Derselbe bestätigte Rundungspfad wie Blind 4. | patch, gemeinsame Ursache mit Blind 4 |
| Verification Gap 1: Negativgate fehlt im Kontosperrnachweis | medium: Vorverifizierte Lücke; Umgehung der Mutationssperre im neuen Pfad bliebe von der bisherigen Koordinationsmatrix unbemerkt. | patch, gemeinsame Ursache mit Blind 7 |
| Verification Gap 2: Eigene Speicher-/Löschaktion bei Ungewissheit ungeprüft | low: Vorverifizierte Lücke; bestehende Fehlerfälle prüfen unmittelbar danach, die Navigationstests kontrollieren nur die Anlageaktion. Die Handler verhindern Wiederholen, aber ein sichtbar entsperrter Button bliebe unbemerkt. | patch: Aktionszustände vor/nach Prüfabruf und ausdrücklicher Freigabe prüfen |

## Design Notes

Keine Absichtsfragen, Migrationen oder externen Wirkungen. Umfang: Vertrag, Adapter/Security, Oberfläche und Nachweise. Timeout-Abschlussbarrieren bleiben Folgearbeit gemäß `deferred-work.md`; der Prüfablauf beweist keinen Serverabschluss.

## Verification

- `./scripts/check-contract.sh`: Verträge kompatibel, Schnittstellen/SPA kompilieren.
- `./backend/mvnw -f backend/pom.xml verify`: Backendmatrix erfolgreich.
- `npm --prefix frontend run e2e`: Browsermatrix erfolgreich.

### Ausgeführt am 2026-10-27

- Beide Verträge valide/kompatibel, generierte Java-/Angular-Schnittstellen und Produktions-SPA erfolgreich: `/tmp/tnbp-savings-contract.log`.
- Gesamtlauf: 44 Unit-/Architekturtests und 210 PostgreSQL-/HTTP-Integrationstests ohne Fehler oder übersprungene Fälle: `/tmp/tnbp-savings-backend.log`. Failsafe-XML unabhängig ausgezählt; zusätzliche alte Surefire-IT-Berichte gehören nicht zur Unit-Zahl des Gesamtlaufs.
- HTTPS-Gesamtlauf auf unverändertem Frontendstand: 195/195 erfolgreich: `/tmp/tnbp-savings-e2e.log`. Zwölf Pythonprüfungen erfolgreich: `/tmp/tnbp-savings-python.log`.
- Nach der API-Fehlertextkorrektur gezielt erneut erfolgreich kompiliert und SavingsGoalV2IT ausgeführt: `/tmp/tnbp-savings-error-text-check.log`.
- Freigegebenen Intent per SHA-256 geprüft: `c77a5bbba139e0c1ba88f7df3ca2a1bcd525cba6fa3972dd12f34ce0f8341867`. V1-Vertrag und Migrationen unverändert.

### Unabhängiger Matrixabgleich

Alle folgenden Nachweise sind in den erfolgreichen Läufen enthalten:

| Matrixzeile | Ausgeführte Nachweise |
| --- | --- |
| Zielpflege | SavingsGoalV2IT erbt die Anlage-/Datums-/Bearbeitungs-/Fortschritts-/Löschmatrix; FinanceCoordinationIT prüft gemeinsame Sperre, Rollback und Commitfehler. Browserfälle belegen Datum entfernen, Fortschritterhalt und bestätigten Löschdialog. |
| Signierte Antwort | Isolierter Browserfall „isolierte signierte Antworten …“ mit −30/70/150, symmetrischer Rundung und ±MAX bei Ein-Cent-Ziel, Balken/assistiver Ausgabe und vier Größen. Negativer Fixturebestand wird ausschließlich abgefangen; danach echte leere Liste bestätigt. |
| Negativer Schreibwert | SavingsGoalV2IT.beideVersionenTeilenBestandUndNegativeWerteBleibenOhneDatenwirkungGesperrt einschließlich sicherer Untergrenze, neutraler Fremd-/Fehl-IDs und unveränderter v1-Antwort. Geerbte Roh-JSON-/RLS-/Constraintmatrix erfolgreich. |
| Fehler/offline/unbestätigt | Browserfälle für Entwurferhalt, Doppelsenden, Server-/Feldfehler, Commitverlust und Timeout; „Unbestätigte Anlage …“ verweigert Wiederholen auch bei 206, Zusatzfeldern, gescheitertem Prüfabruf und gewöhnlichem Aktualisieren. |
| Hintergrund/Navigation/Sitzung | Vier Browserfälle zur Rückkehr nach Anlage/Bearbeitung/Fortschritt/Löschen, verspätete GET-/Mutationsantworten nach Sitzungsende und Kontowechsel, pending-/uncertain-Reset ohne Dokumentwechsel. Netzwerkfall belegt alle Zugangs-/Finanzoperationen über v2. |

### Abschluss nach Reviewkorrekturen am 2026-10-28

- Drei unabhängige Review-Linsen abgeschlossen. Jeder Befund einzeln triagiert; alle angenommenen Patches umgesetzt und deren Diff unabhängig gelesen. Keine offenen Korrekturen oder neuen Zurückstellungen. Die bereits dokumentierte Grenze zum Serverabschluss nach Timeout bleibt bestehen.
- Vollständige abschließende Prüfungen nacheinander: beide Verträge valide/kompatibel, getrennte generierte Schnittstellen und Produktions-SPA erfolgreich (`/tmp/tnbp-story36-final-contract.log`); 44 Unit-/Architekturtests und 212 PostgreSQL-/HTTP-Integrationstests ohne Fehler oder übersprungene Fälle (`/tmp/tnbp-story36-final-backend.log`); 199/199 HTTPS-Browserfälle erfolgreich (`/tmp/tnbp-story36-final-e2e.log`).
- Gegenüber dem Vertrags-/Backendlauf wurde ausschließlich die Steuerung des Ablauf-Browsertests geändert. Beide betroffenen Fälle gezielt erfolgreich (`/tmp/tnbp-story36-expiry-check.log`), danach vollständige Browsermatrix wiederholt. Alle 123 Quell-/Vertrags-/Testprüfsummen blieben während des finalen Browserlaufs unverändert.
- Neue Nachweise im erfolgreichen Gesamtlauf enthalten: Sperr-/Löschkonkurrenz des Negativgates, gemischte v1/v2-Pflege, eigene Aktionssperren, Löschprüfung mit zugänglichem Ladefehler und bestätigter Abwesenheit in allen vier Größen/200-%-Text sowie signierte Nullprozente und tatsächliche Negativwerte im Zugänglichkeitsbaum. Gesamte I/O-Matrix erneut abgeglichen.
- Freigegebener Intent, v1-Vertrag und Migrationen unverändert; Diffprüfung erfolgreich. Zwölf Pythonprüfungen aus dem Implementierungslauf gelten weiter, die geprüften Hilfsskripte sind unverändert.
