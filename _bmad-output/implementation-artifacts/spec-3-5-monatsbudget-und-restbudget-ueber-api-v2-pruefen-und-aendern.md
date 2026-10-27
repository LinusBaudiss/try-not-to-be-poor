---
title: 'Story 3.5: Monatsbudget und Restbudget über API v2 prüfen und ändern'
type: 'feature'
created: '2026-10-27'
status: 'done'
route: 'dispatch'
story_key: '3-5-monatsbudget-und-restbudget-über-api-v2-prüfen-und-ändern'
review_loop_iteration: 0
baseline_commit: '8c86e0a72cb49a9dca139baec094faca1effbd9b'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
---

<frozen-after-approval reason="Nutzerabsicht; Änderungen nur nach erneuter Abstimmung">

## Intent

**Problem:** Budget und Monatsübersicht verwenden noch v1; unbestätigtes Speichern erlaubt ungeprüfte Wiederholung.

**Approach:** Drei v2-Operationen und die bestehende Monatsoberfläche verbinden. Story 3.5/AC-1–11 aus `_bmad-output/planning-artifacts/epics.md` gelten vollständig.

## Boundaries & Constraints

**Always:** JWT-Konto, FORCE RLS, öffentliche Modulzugänge, äußere Commitbestätigung, Kontosperre vor Kalenderbestimmung und gemeinsamer REPEATABLE-READ-Snapshot bleiben erhalten. Europe/Berlin gilt intern; keine technischen Zeitzonentexte. Budget läuft fort, abgeschlossene Monate bleiben unverändert. Exakte Cent bis ±9007199254740991; Budget/Ausgabensumme nichtnegativ. Fehlendes Budget ist null, gespeichertes Nullbudget ist 0. Sitzungsschutz, flüchtige Daten, Bereichstrennung und rote Abmeldung erhalten.

**Never:** V1-Vertrag ändern, Datenbankobjekte ergänzen, historische Budgetbearbeitung/-löschung, automatische Mutationswiederholung oder v1-Rückfall. Sparziele bleiben bedienbar; keine v1-Stilllegung, negativen Sparfortschritte, Automatik oder Produktionsfreigabe.

## I/O & Edge-Case Matrix

| Zustand | Erwartung |
| --- | --- |
| Fehlendes/Null-/Maximalbudget | Null unterscheidbar von 0; tatsächliche Monatsausgaben, Rest exakt Budget minus Ausgaben, ohne Budget null. |
| Ungültige Eingabe/Bestandsgrenze | Keine Rundung/Teilmutation; Feldfehler oder neutraler Ladefehler, Entwurf erhalten. |
| Pending/offline/unbestätigt | Doppelsenden sperren, Erfolg nicht behaupten; vor Wiederholung aktuellen Stand laden und ausdrückliche Prüfung anbieten. Prüfabruf erhält offenen Entwurf. |
| Konkurrierende Antworten/Monatsrückkehr | Neuer bestätigter Stand gewinnt; Anzeige und Zusammenfassung widersprechen sich nicht. Offene Eingaben bleiben erhalten. |
| Sitzungsende/Kontowechsel | Werte/Entwürfe verwerfen; alte GET-/PUT-Antworten wirkungslos. |

</frozen-after-approval>

## Code Map

Java-Pfade relativ zu `backend/src/main/java/de/linus/tnbp/`.

- `finance/FinanceApplication.java`, `budget/Budgets.java`, `shared/FinanceTransactions.java`: Historie, Sperre, Kalender, Snapshot und Commit bereits vorhanden; unverändert wiederverwenden.
- `finance/http/{BudgetController,BudgetErrors,MonthSummaryController,MonthSummaryErrors}.java`: v1-Vorbilder für getrennte generierte v2-Typen.
- `frontend/src/app/month/{month,month-summary}.ts`: Revisions-/Sequenzschutz und Serverzeit erhalten; Budget-GET überschreibt derzeit Entwürfe. Private `ExpenseOperations` in `frontend/src/app/expenses/expenses.ts` als Vorbild für sitzungsgebundene Pending-/Ungewissheitsflags ohne Finanzdaten.

## Tasks & Acceptance

**Execution:**
- [x] `api-contract/v2/openapi.yaml`: zuerst GET/PUT `/budget`, GET `/month-summary` definieren; strikte DTOs, Monatserster, Nullable-/Centgrenzen, 200/400-Feldfehler/401/415/500, Bearer/no-store. Clients generieren.
- [x] `finance/http/{BudgetV2Controller,BudgetV2Errors,MonthSummaryV2Controller,MonthSummaryV2Errors}.java`, `access/AccessConfiguration.java`: dünne Adapter; ausschließlich konkrete Methoden/Pfade/CSRF-Ausnahme und 401-Zuordnung ergänzen, Sitzungsschutz erhalten.
- [x] `frontend/src/app/month/{month,month-summary}.ts`: generierte v2-Dienste/Typen; Status 200 und exakte Antwortfelder prüfen. Budget-/Summary-/PUT-Konkurrenz koordinieren; Prüfablauf mit Entwurferhalt, Fokus und Sperren auch über Bereichswechsel, ohne alte Antworten zu übernehmen.
- [x] `backend/src/test/java/de/linus/tnbp/expensebudget/{BudgetIT,BudgetV2IT,MonthSummaryIT,MonthSummaryV2IT,ExpenseV2IT}.java`: bestehende HTTP-Matrizen für beide Versionen nutzen; verbotene Routenerwartung anpassen. Matrix, geteilter Bestand, fehlendes Budget mit Ausgaben, Sommer-/Winterzeit und ungültige Bestände ergänzen. `backend/src/test/java/de/linus/tnbp/finance/FinanceCoordinationIT.java` für Sperr-Monatsgrenze, gemeinsame Verbindung/Rollback/Commitfehler und Commit zwischen Snapshot-Teilabfragen weiter ausführen.
- [x] `frontend/e2e/{budget,month-summary,expense-mutations,session}.spec.ts`: v2 umstellen; Matrix einschließlich GET/PUT-Konkurrenz, 206/Zusatzfeldern, Prüfabruf-Fehlern, Navigation bei laufendem/unbestätigtem PUT und Sitzungswechsel prüfen. Netzwerkprofil: Zugang/Ausgaben/Budget/Monat v2, keine v1-Budget-/Monatsaufrufe. Vier exakte UX-Größen, 200-%-Text, axe, Tastatur/Touch, lange Beträge und neue Zustände abdecken.
- [x] `README.md`: v2-Budget/Monat, Prüfablauf und internen Übergang dokumentieren.

**Acceptance Criteria:**
- Angenommen bestätigtes Speichern, wenn Monat neu geladen wird, dann gelten fortlaufendes Budget und konsistenter Rest; frühere Budgetstände bleiben erhalten.
- Angenommen Ausgabenmutation oder Monatswechsel, wenn Monat auch über Zurück/Vorwärts geöffnet wird, dann erscheinen frische v2-Werte gemäß Serverkalender ohne Entwurfsverlust durch Hintergrundantworten.
- Angenommen 320×568/390×844/768×1024/1280×800 und 200-%-Text, wenn Eingabe/Prüfung/Fehler bedient werden, dann bleiben Fokus, Labels und Status zugänglich, ohne horizontalen Überlauf; Aktionen ≥44×44, Geldfelder ≥48 Pixel, Textkontrast ≥4,5:1 und Kontrollen/Fokus ≥3:1.

## Implementation Notes

- Vertrag zuerst erweitert und getrennt generiert. Dünne v2-Adapter nutzen unverändert die bestätigte Finanzkoordination; v1-Vertrag und Migrationen bleiben unverändert.
- Privater BudgetOperations-Dienst erhält ausschließlich Vorgangsschutz über Bereichswechsel. Prüfabruf und ausdrückliche Bestätigung entsperren unbestätigte Speicherung; persönliche Entwürfe bleiben nur im offenen Formular. Sitzungswechsel invalidiert alte Vorgänge.
- Monatsabfragen pausieren während Budgetabruf/-mutation; Revisionen und Sequenzen verwerfen überholte Antworten. Strikte Status-/Körperprüfung, Serverkalender und Entwurferhalt sind nachgewiesen.
- Vollständigen vorgemerkten Diff gegen `8c86e0a72cb49a9dca139baec094faca1effbd9b` unabhängig gelesen: `/tmp/story35-implementation-diff-20261027.patch`. Alle Aufgaben und Abnahmekriterien gegen Code und tatsächliche Prüfergebnisse abgeglichen.

- Angenommene Reviewpatches vollständig umgesetzt: Pausen invalidieren die geplante Revision und erklären den Wiederanlauf; Pending-Rückkehr ist sichtbar, Sitzungsreset im selben Dokument geprüft. Prüfaktionen nutzen getrennte Fokusringe/Abstände mit direkten Kontrast- und Sichtbarkeitsnachweisen. Vorhandenen Date-Header dokumentiert/geprüft, Fehlertext korrigiert und unbenutzte Importe entfernt.
- Korrigierten Diff unabhängig gelesen: `/tmp/story35-review-fixes-diff-20261027.patch`. Die nach Fehler automatisch geladene Zusammenfassung darf einen durch GET bestätigten aktuellen Budgetstand anzeigen; sie behauptet weiterhin keinen Erfolg des unbestätigten PUT, und die ausdrückliche Prüfpflicht bleibt bestehen.

## Spec Change Log

## Review Triage Log

Jeder Befund wurde vor Gruppierung einzeln eingeordnet:

| Befund | Urteil und Evidenz | Behandlung |
| --- | --- | --- |
| Blind 1: Monatswechsel während Pause verloren | medium: checkMonth setzt observedMonth, load bricht bei paused ab; unveränderte Revision und bestehender Wert verhindern den Wiederanlauf nach Fehler. | patch: Wiederanlauf beim Pausieren vormerken, Regressionstest |
| Blind 2: Ladeansage trotz beendeter Ladephase | low: Pausenzweig setzt loading=false, erhält aber den Status des verworfenen Abrufs. | patch: verständlichen vorgemerkten Zustand ansagen |
| Blind 3: Rückkehr bei laufendem PUT ohne Speicherindikator | low: loaded=false blendet Formular und Pending-Beschriftung aus; gesperrte Prüfaktionen erklären nicht den noch laufenden Vorgang. | patch: Pending-Hinweis außerhalb des Formulars, Rückkehrtest |
| Blind 4: Ungültige einzelne Ausgaben mit gültiger Summe | medium: Unveränderte ExpenseRepository.monthTotal/Expenses.monthTotal prüfen die Summe; künstlich beschädigte Werte −1/101 würden 100 liefern. Reguläre Schreibpfade und DB-Constraints verhindern solche Einzelwerte. | defer: bereits bestehende Abwehr beschädigter Einzelbestände gesondert bewerten |
| Blind 5: API-Fehlermeldung fordert sofortige Wiederholung | low: BudgetV2Errors nennt „Versuche es erneut“, obwohl der neue Vertrag vorherige Prüfung verlangt. | patch: bestehenden Text direkt korrigieren |
| Blind 6: Date-Abhängigkeit fehlt im Monatsvertrag | low: Browser verlangt gültigen Date-Header; neuer Vertrag beschreibt ihn nicht und echter HTTP-Nachweis fehlt. | patch: vorhandenen Header dokumentieren und prüfen |
| Blind 7: Timeouttest erfasst nur bereits erfolgten Commit | medium: route.fetch ist vor Timeout fertig. Ein nach Timeout noch auf Kontosperre wartender Vorgang kann weiterhin nach einem ungesperrten Prüfabruf committen. Fehlende Abschlussbarriere bestand bereits beim v1-Budget-Retry. | defer: serverseitige Vorgangsidentität/Abschlussnachweis gesondert untersuchen |
| Blind 8: Neue Prüfaktionen ohne konkreten Fokus-/Kontrastnachweis | low: Größen/axe sind ausgeführt, unverdeckter Fokus und Kontroll-/Fokusringkontrast der neuen Aktionen werden nicht ausdrücklich geprüft. | patch: gezielte Browserassertionen ergänzen |
| Blind 9: Prüfaktionen ohne Abstand/Gruppenstil | low: Neue budget-uncertainty hat keinen Stil; benachbarte volle Buttons grenzen unmittelbar aneinander und ihre Fokusringe überlagern sich. | patch: vorhandenen Ausgaben-Prüfstil über gemeinsame Selektoren verwenden |
| Blind 10: Spec/Sprint-Status unterscheiden sich im laufenden Review | low: Arbeitsstände sind tatsächlich in-review/in-progress; abschließender Statusabgleich steht im laufenden Build noch aus. | reject: verlangte Korrektur betrifft diese Build-Spec; Abschluss synchronisiert den Sprint |
| Blind 11: Zwei unbenutzte Importe | low: Budgets in MonthSummaryV2Errors und List in MonthSummaryV2IT werden nicht verwendet. | patch: direkt entfernen |
| Edge 1: Monatswechsel während Pause verloren | medium: derselbe bestätigte Pausenpfad wie Blind 1; Reviewer hat ihn mit dem transpilierten aktuellen Code reproduziert. | patch, gemeinsame Ursache mit Blind 1 |
| Verification Gap 1: Sitzungsreset des Root-Vorgangsschutzes ungetestet | low: vorverifizierte Lücke; bisherige Budgettests enden nach Logout oder erzeugen per goto einen neuen Injector. Entfernen des Uncertain-Resets bliebe unbemerkt. | patch: Ab-/Anmeldung im selben Dokument bei pending und uncertain prüfen |
| Verification Other 1: Monatswechsel während Pause verloren | medium: Kontrollfluss und reproduzierter alter Monatswert bestätigen denselben Fehler wie Blind 1. | patch, gemeinsame Ursache mit Blind 1 |

## Verification

- `./scripts/check-contract.sh`: beide Verträge kompatibel, generierte Schnittstellen und SPA kompilieren.
- `./backend/mvnw -f backend/pom.xml verify`: echte PostgreSQL-, Sicherheits- und Koordinationsnachweise erfolgreich.
- `npm --prefix frontend run e2e`: HTTPS-Browsermatrix erfolgreich.

### Ausgeführt am 2026-10-27

- Vertragsprüfung erfolgreich: beide Versionen kompatibel, getrennte Java-/Angular-Schnittstellen und SPA gebaut; `/tmp/story35-contract-final.log`.
- XML-Berichte unabhängig ausgewertet: 44 Unit-/Architekturprüfungen und 189 Integrationstests, null Fehler oder übersprungene Fälle; `/tmp/story35-backend-verify.log`.
- Vollständiger HTTPS-Browserlauf 181/181 erfolgreich; `/tmp/story35-e2e-final.log`. Sämtliche 109 Quell-/Vertrags-/Testprüfsummen vor/nach dem Lauf identisch; `/tmp/story35-source-final-check.log`.
- Zwölf Pythonprüfungen erfolgreich; `/tmp/story35-python.log`. Diffprüfung ohne Formatfehler.

### Unabhängiger Matrixaudit

Alle zugeordneten Fälle sind im erfolgreichen Abschlusslauf enthalten:

| Matrixzeile | Ausgeführte Nachweise |
| --- | --- |
| Fehlendes/Null-/Maximalbudget | BudgetV2IT.fehlendesBudgetNullbudgetMaximumUndAendernSindUnterscheidbar; MonthSummaryV2IT.matrixUndKontentrennungGebenNurDenAktuellenBerlinMonatZurueck und nullbudgetUndCentgrenzenBleibenExaktUndUngueltigeSummenScheiternSicher; Browserfall für fehlendes Budget, Komma/Punkt und sichere Centgrenzen. |
| Ungültige Eingabe/Bestandsgrenze | BudgetV2IT.jsonTypenFehlendeWerteNegativUndUeberlaufWerdenOhneRundungAbgelehnt und ungueltigerGespeicherterBetragWirdNeutralAbgelehnt; entsprechende Monatsbestandsprüfung; Browserfälle für Feldfehler, Entwurferhalt und Fokus. |
| Pending/offline/unbestätigt | Browserfälle für gehaltene Speicherung, verlorene Antwort/Serverfehler/Offline, 206/Zusatzfelder mit gescheitertem Prüfabruf, Bereichsrückkehr bei laufendem/unbestätigtem PUT, Timeout/Prüfzwang und Touch. |
| Konkurrenz/Monatsrückkehr | MonthSummaryV2IT.parallelerCommitZwischenTeilabfragenErgibtKeinenGemischtenDatenstand; FinanceCoordinationIT für Sperre vor Monatsbestimmung und gemeinsamen Snapshot; Browserfälle für alte Summary vor PUT, spätes Budget-GET mit offenem Entwurf, externes Budget, Servermonat, Zurück/Vorwärts und frische Werte nach Ausgaben-CRUD. |
| Sitzungsende/Kontowechsel | Browserfälle für verspätetes Budget-GET/PUT nach Abmeldung, Kontowechsel, fehlgeschlagene Verlängerung und Tokenablauf; entsprechende Monatsantwortprüfungen. |

### Abschluss nach Reviewkorrekturen

- Vollständige Wiederholung auf dem korrigierten Stand nacheinander: beide Verträge valide und kompatibel, getrennte Schnittstellen und SPA erfolgreich gebaut; 44 Unit-/Architekturprüfungen und 190 PostgreSQL-/HTTP-Integrationstests ohne Fehler oder übersprungene Fälle; 185/185 HTTPS-Browserfälle erfolgreich. Die XML-Auswertung berücksichtigt, dass zusätzliche Surefire-Berichte aus einem gezielten IT-Aufruf stammen; der aktuelle Gesamtlauf weist im Log 44 plus 190 Fälle aus.
- Während des finalen Browserlaufs alle 109 Quell-/Vertrags-/Testprüfsummen unverändert. Logs: `/tmp/story35-postreview-contract.log`, `/tmp/story35-postreview-backend.log`, `/tmp/story35-postreview-e2e.log`, `/tmp/story35-postreview-source-check.log`.
- Matrix erneut abgeglichen: sämtliche bisherigen Nachweise im finalen Gesamtlauf enthalten. Zusätzlich erfolgreich: automatisches Nachladen nach Monatswechsel während fehlgeschlagenem PUT, Pending-Ansage bei Rückkehr, pending-/uncertain-Reset mit identischem Browserdokument und verspäteter Altantwort, direkte Fokus-/Kontrast-/Abstandsnachweise beider Prüfaktionen und echter RFC-1123-Date-Header.
- Drei unabhängige Reviewebenen abgeschlossen; alle angenommenen Patches umgesetzt und deren Diff unabhängig gelesen. Keine offenen Korrekturen oder Absichtsfragen. Zwei bestehende Risiken als Folgearbeit dokumentiert: beschädigte Ausgabeneinzelbestände mit zulässiger Summe und Abschlussnachweis noch serverseitig laufender Budgetvorgänge nach Timeout.
- Zwölf Pythonprüfungen aus dem Implementierungslauf bleiben erfolgreich; betroffene Hilfsskripte wurden nicht geändert. Freigegebener Intent, v1-Vertrag und sämtliche Migrationen unverändert. Diffprüfung erfolgreich.
