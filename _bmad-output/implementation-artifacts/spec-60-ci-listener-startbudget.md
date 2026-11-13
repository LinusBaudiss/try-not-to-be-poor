---
title: 'PR 60: Startbudget der Fremdlistenerprüfung korrigieren'
type: 'bugfix'
created: '2026-11-13'
status: 'done'
route: 'oneshot'
baseline_commit: 'a0f81280cc3c97ef2bcc5a6aa769f7110fbfbb5d'
context: []
---

<frozen-after-approval reason="Nutzerauftrag: fehlgeschlagenen CI-Test im bestehenden PR beheben">

## Intent

Der Push-Lauf 43498805159 scheitert ausschließlich in `ReleaseTransitionIT.fremderListenerUndGeerbteSpringDbKonfigurationKoennenKeinenStartBestaetigen`: Das auf fünf Sekunden verkürzte Startbudget kann vor dem ersten fremden HTTP-Probeaufruf ablaufen. Der separate PR-Lauf 43498864991 besteht am selben Commit. Der Test soll das reguläre Startbudget der vorhandenen Fixture verwenden und weiterhin tatsächliche Fremdantwort, Startablehnung, DB-Bereinigung und anschließenden regulären Neustart nachweisen. Keine Produktionslogik, Wartebedingungen oder Sicherheitsassertionen entfernen. Fehler mit künstlich verzögertem Start nachvollziehen, danach die betroffene Testmethode und die zugehörigen Prozessprüfungen ausführen; Fix auf denselben PR-Branch pushen.

</frozen-after-approval>

## Implementation Notes

Keine offenen Absichtsfragen; ausschließlich Testfixture und Nachweisdokumentation, keine Migration oder Produktionsänderung. Der reguläre `Running.command`-Helfer verwendet bereits 45 Sekunden. Der lokale Fehlernachweis darf den Supervisor testintern verzögern; dieser Diagnoseeingriff gehört nicht in den Release-Code.


- Ursache aus dem [fehlgeschlagenen Push-Lauf 43498805159](https://github.com/LinusBaudiss/try-not-to-be-poor/actions/runs/43498805159): genau ein Fehlschlag in der Fremdlistenerprüfung, `probes == 0`; die übrigen Jobs waren erfolgreich. Der [PR-Lauf 43498864991](https://github.com/LinusBaudiss/try-not-to-be-poor/actions/runs/43498864991) bestand mit identischem Commit vollständig.
- Ein ausschließlich lokaler Diagnoseeingriff verzögerte den echten Supervisorstart um sechs Sekunden. Mit der bisherigen Fünf-Sekunden-Grenze trat derselbe Assertionsfehler auf: [Reproduktion](../../.local/pr-60-ci-fix/delayed-before.log). Mit dem regulären 45-Sekunden-Budget bestand derselbe verzögerte Fall vollständig: [verzögerter Nachweis](../../.local/pr-60-ci-fix/delayed-after.log).
- Der Diagnoseeingriff wurde anschließend vollständig entfernt. Verbleibende Teständerung: verkürztes Sonderzeitlimit entfernen und das bestehende reguläre Startbudget des `Running.command`-Helfers verwenden. Fremde erfolgreiche HTTP-Antwort, tatsächlicher Probeaufruf, Ablehnung, fehlende Rest-DB-Arbeit und erfolgreicher anschließender Neustart bleiben unverändert geprüft.
- Endgültige Fassung: `./backend/mvnw -f backend/pom.xml verify -Dit.test=ReleaseTransitionIT#fremderListenerUndGeerbteSpringDbKonfigurationKoennenKeinenStartBestaetigen` erfolgreich; 49 Unit-/Architekturtests und die betroffene echte Prozessprüfung bestanden. [Finaler Nachweis](../../.local/pr-60-ci-fix/final-targeted.log). Weitere unveränderte Backend-/Browserprüfungen wurden für diese reine Testfixturekorrektur nicht erneut ausgeführt.

Die lokalen Logs ergänzen diesen eigenständig nachvollziehbaren Nachweis:

1. `ReleaseTransitionIT` ausschließlich für die Diagnose im Fremdlistenerfall über `run.driver` starten. Im Python-Testtreiber `subprocess.Popen` für den Aufruf mit `supervise` so umhüllen, dass vor dem unveränderten Prozessstart sechs Sekunden vergehen; sämtliche Prozessargumente unverändert per `os.execv` weiterreichen.
2. Mit dem bisherigen `--timeout 5` ausführen: Die echte Prozessprüfung scheitert mit `probes == 0` an „gleicher Port erreicht tatsächlich die accepted-socket-Prüfung“ (ein fehlgeschlagener IT-Fall, keine Startbestätigung). Das entspricht dem oben verlinkten erhaltenen CI-Fehler.
3. Nur das Sonderzeitlimit entfernen und denselben verzögerten Diagnosefall ausführen: erfolgreich; der fremde Listener wurde tatsächlich abgefragt, sein Token bestätigt keinen API-Start, die Laufzeit-DB-Sitzungen werden vollständig beendet, und der anschließende reguläre Start funktioniert.
4. Den gesamten Diagnose-Testtreiber entfernen. Die endgültige Fassung mit dem oben dokumentierten Maven-Aufruf prüfen: 49 Unit-/Architekturtests und ein echter Prozessfall erfolgreich; kein übersprungener Test, `BUILD SUCCESS`. Die methodeninterne Ablehnung läuft weiterhin bis zur regulären, endlichen 45-Sekunden-Grenze.
5. Ergänzend `python3 -m unittest discover -s scripts/tests -v`: alle 19 Tests erfolgreich, einschließlich der Prozessbeendigungs- und Zertifizierungsprüfungen in `test_api_release_stop.py` und `test_api_release_certificate.py`.

## Review Triage Log

Die erste angeforderte Agentenprüfung lieferte kein Ergebnis und wurde beendet; eine neue unabhängige Prüfung derselben Änderung wurde vollständig eingesammelt.

- Lokale Nachweislinks sind im veröffentlichten PR nicht zugänglich — low, bestätigt: `.local/` ist ignoriert. Direkte Dokumentkorrektur: eigenständige Reproduktionsschritte, Ergebnisse und dauerhafte CI-Verweise stehen jetzt im versionierten Dokument. Die lokalen Logs bleiben zusätzliche Diagnoseartefakte.
- Zugehörige Skript-Prozessprüfungen waren im Nachlauf noch nicht ausgeführt — medium, bestätigt: der gezielte Java-Lauf prüfte bereits echte Ablehnung/Bereinigung/Neustart, die ergänzenden Python-Checks fehlten noch. `python3 -m unittest discover -s scripts/tests -v` wurde nachgeholt, 19/19 erfolgreich. [Zusätzliches lokales Protokoll](../../.local/pr-60-ci-fix/python.log).

Keine offenen Korrekturen und keine Zurückstellungen. Der vollständige verbleibende Diff wurde selbst geprüft: ausschließlich Entfernen des Fünf-Sekunden-Overrides, erklärender Testkommentar und diese Nachweisdokumentation. Die Sicherheitsbedingungen bleiben unverändert.
