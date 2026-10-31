---
title: 'Story 3.7: CI von PR #26 beheben und Abschluss nachweisen'
type: 'bugfix'
created: '2026-10-31'
status: 'done'
route: 'oneshot'
baseline_commit: 'da35cc78da65d7953c4001c53a99f782ca0d166c'
story_key: '3-7-die-neue-oberfläche-nach-sicherer-v1-stilllegung-nutzen'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/story-3-7-acceptance-context.md'
---

<frozen-after-approval reason="Nutzerauftrag: CI-Fehler beheben und bestehende Story abschließen">

## Intent

**Problem:** PR #26 scheitert trotz vorheriger lokaler Nachweise in den Stilllegungs-, Browser- und Bundleübergangsprüfungen. Der Sprintstatus steht noch auf Review.

**Approach:** Die konkret belegten Wettläufe minimal korrigieren, ohne die Abnahmen von Story 3.7 abzuschwächen. Bereits verschwundene Datenbankarbeit frisch nachweisen; weiter bestehende oder unbekannte Arbeit sperrt unverändert. Browserhilfen warten auf abgeschlossene Fokusführung und verwenden bestätigte DOM-Identitäten. Regressions-, Gesamt- und CI-Nachweise erfassen und Story 3.7 anschließend konsistent abschließen. Keine Vertrags-, Migrations-, Produktumfangs- oder Produktionsänderung.

</frozen-after-approval>

## Implementation Notes

- Untersuchung: CI-Lauf `40811823206`, Revision `da35cc78da65d7953c4001c53a99f782ca0d166c`. Fehler in `backend-retirement`, `browser-transition`, `browser`; Vertrag, Python und Kompatibilitätsbackend erfolgreich. Protokolle lokal unter `/tmp/pr26-job-*.log`, Browserfehlerartefakt unter `/tmp/pr26-browser-failure/`.
- `scripts/api-release.py`: `stop()` und `recover_lifecycle()` behandeln `pg_terminate_backend=false` zu streng; eine frische Prüfung darf ausschließlich tatsächlich beendete Arbeit zulassen. Admission, vollständige Abschlussabfrage und Lebenszyklusnachweis erhalten. PostgreSQL-Semantik: https://www.postgresql.org/docs/18/functions-admin.html#FUNCTIONS-ADMIN-SIGNAL .
- `frontend/e2e/savings-progress.spec.ts`: Erfolgstext kann vor der über `requestAnimationFrame` geplanten Fokussierung sichtbar sein. Fehlerartefakt zeigt `Auto50` im Namen, leeren Betrag und keinen zweiten POST. Helfer erst nach bestätigtem Abschluss der Fokusaktion zurückgeben.
- `frontend/e2e/support/complete-v2-flow.ts`: ausschließlich die Ziel-ID aus der bestätigten Karte lesen; alle bestehenden echten Zugangs-/Finanzoperationen, Header- und Versionsassertionen erhalten. Kein Retry oder höheres Timeout.
- Kleine, reversible Korrektur ohne offene Absichtsfragen oder neue öffentliche Schnittstelle. Deterministische Datenbankgegenproben sowie betroffene Browserfälle zuerst; vollständige Prüfungen sequenziell auf gemeinsamen Build-Dateien. Historischer Storynachweis bleibt erhalten und erhält einen datierten Abschlussverweis.
- CI-Provenienz: Der PR-Kopf ist `da35cc78da65d7953c4001c53a99f782ca0d166c`; der fehlgeschlagene Pull-Request-Lauf testete dessen Merge mit der Basis als `1a9805a24dfd15863f7a557729c13dcc8c42b3e1`.
- Umsetzung: Zwei frische Existenzabfragen im Guard ersetzen ausschließlich bei belegtem Backendende einen fehlgeschlagenen Terminierungsaufruf. Die vollständige Sitzungserfassung, Admissionprüfung und dauerhaften Zustandsänderungen behalten ihre Reihenfolge. Der Browser-Gesamtablauf liest die Ziel-ID aus der bestätigten Karte; die Mehrfachanlage wartet auf den abgeschlossenen Namensfokus.
- Nachweise: 19 Pythonprüfungen erfolgreich (`/tmp/pr26-python.log`), einschließlich beider Stoppwege mit verschwundenem/vorhandenem Backend, weiterer Arbeit und fehlgeschlagener Existenzabfrage. Gegen den ursprünglichen Guard schlagen exakt die Verschwunden-Fälle beider Stoppwege fehl. 13 gezielte reale Übergangs-/Administrationsfälle und 44 Unit-/Architekturtests erfolgreich (`/tmp/pr26-targeted-backend.log`); die ergänzte reale Hostbootprüfung mit und ohne Verschwinden zusätzlich 2/2 unter zwei CPU-Kernen erfolgreich (`/tmp/pr26-recovery-backend.log`).
- Der erste vollständige lokale Übergangslauf reproduzierte denselben Chromium-Antwortkörperfehler zusätzlich im Loginhelfer (`/tmp/pr26-browser-transition.log`): 2/3 erfolgreich, Altbundlefall scheitert am Protokollzugriff trotz erfolgreicher Anmeldung. `version-transition.spec.ts` verwendet nun den tatsächlich vom Browser gesendeten Bearer-Header statt des kurzlebigen Antwortkörpers; Wiederherstellung verlangt zusätzlich ausdrücklich Refreshstatus 200. Auch der Mehrfachanlagehelfer benötigt nur noch die bestätigte DOM-ID. Der isolierte Test falscher Fortschrittsantworten erhält seine gültige Basis als kontrolliertes Fixture. Keine Änderungen am Anwendungscode oder an den Abnahmen.
- Beide ursprünglich betroffenen regulären Browserfälle zunächst je fünfmal unter zwei CPU-Kernen erfolgreich (`/tmp/pr26-browser-repeat.log`). Nach dem zusätzlichen Loginbefund den vollständigen statischen Übergang mit echten alten und neuen Bundles auf dem korrigierten Stand unter zwei CPU-Kernen erfolgreich wiederholt: 3/3 (`/tmp/pr26-browser-transition-final.log`). Die unabhängige Folgeprüfung der endgültigen Browserdiffs fand keine konkreten Korrektheitsprobleme.
- Abschließende reguläre HTTPS-Matrix auf dem endgültigen Stand: 203/203 erfolgreich (`/tmp/pr26-browser-full.log`); alle 19 Pythonprüfungen erneut erfolgreich (`/tmp/pr26-python-final.log`). Prüfsummen sämtlicher geänderter Steuer-/Testquellen nach dem Browserlauf unverändert (`/tmp/pr26-final-sources.sha256`). Verträge, fachlicher Anwendungscode und Migrationen unverändert. Die vollständigen CI-Jobs des veröffentlichten Kopfes sind über [PR #26](https://github.com/LinusBaudiss/try-not-to-be-poor/pull/26/checks) nachvollziehbar.
- Den ausdrücklich beauftragten Storyabschluss im Sprintstatus als `done` festgehalten. Andere Storyzustände und parallel entstandene GitHub-Spiegelhinweise bleiben eigenständige Arbeitsstände. Der GitHub-Issue-Spiegel verwendet gemäß seinen Vorgaben ausschließlich die veröffentlichten Quellen auf `main` und folgt nach dem Merge.

## Review Triage Log

Unabhängige Blindprüfung; vier Hinweise einzeln bewertet:

| Hinweis | Urteil und Evidenz | Behandlung |
| --- | --- | --- |
| Abschlusserfassung mit anderer Arbeit nicht gezielt geprüft | low: Der Abschluss verweigert vorhandene Arbeit bereits, die neue Verschwunden-Verzweigung war mit nachträglich vorhandener Arbeit aber nicht kombiniert geprüft. | patch: Gegenprobe für beide konkreten Stoppwege; kein Lebenszyklusabschluss oder Stoppbeleg |
| Fehlgeschlagene frische Existenzabfrage nicht gezielt geprüft | low: SQL-Fehler werden weitergegeben; der neue Aufruf besaß zunächst keine gezielte Fehlergegenprobe. | patch: Verbindungsverlust für beide Wege; kein Lebenszyklusabschluss oder Stoppbeleg |
| Wiederanlaufrennen nur mit Mock geprüft | low: PostgreSQL-Semantik und beide Pythonpfade waren getrennt belegt, der reale Hostbootfall enthielt das Verschwinden noch nicht. | patch: reale Hostbootprüfung um tatsächliche zweite Terminierung mit Ergebnis false ergänzt; Fremdprozess bleibt unbeeinflusst, Neustart erfolgreich |
| PR-Kopf und getestete Mergerevision nicht unterschieden | false: Die Untersuchungsnotiz nennt zutreffend den PR-Kopf, ohne ihn als ausgecheckte Revision zu behaupten. | reject; getestete Mergerevision ergänzend zur Provenienz dokumentiert |

Keine zurückgestellten Befunde; bestehende Storyabnahmen bleiben vollständig verbindlich.
