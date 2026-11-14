# Abschluss von Epic 3

Stand: 06.11.2026. Epic: „Ausgaben, Budget und Sparziele übersichtlich und sicher nutzen“.

Epic 3 und Stories 3.1–3.8 werden auf den ausdrücklichen Nutzerauftrag „schließe epic 3 ab“ im [Sprintstatus](sprint-status.yaml) als `done` geführt. Grundlage sind die abgeschlossenen Build-/Reviewnachweise aller acht Story-Spezifikationen und die erfolgreichen Gesamtprüfungen des letzten Implementierungsstands. Dieser administrative Abschluss ergänzt die historischen Nachweise; er behauptet keinen zusätzlichen manuellen Abnahmelauf.

Geprüfter Ausgangsstand: Branch `codex/story-3-8-signierter-fortschritt`, Commit `8913a1f82bffa2b81efbfc2660da182fc3785280`, zuvor sauberer Arbeitsbaum. Für diesen Abschluss werden ausschließlich Sprintstatus und dieses Dokument geändert.

## Ergebnis und Storynachweise

Das Epic liefert die vollständige manuelle v2-Oberfläche mit den Bereichen Monat, Ausgaben und Sparziele, erhaltenem Kontozugang und Datenbestand, kontrollierter v1-Stilllegung und tatsächlich speicherbarem signiertem Gesamtfortschritt. Die folgenden Story-Dateien stehen jeweils auf `done` und dokumentieren ihre ausgeführten Prüfungen sowie die Behandlung der Reviewbefunde.

| Story | Abschlussnachweis | Implementierungscommit |
| --- | --- | --- |
| 3.1 – v2-Kontozugang | [Spec und abschließende Vertrags-/Backendprüfungen](spec-3-1-eigenen-kontozugang-ueber-api-v2-nutzen.md) | `1064a52` |
| 3.2 – Browserzugang und rote Abmeldung | [Spec, Reviewabschluss und 162 erfolgreiche HTTPS-Browserfälle](spec-3-2-browserzugang-v2-und-rotes-abmelden.md) | `7175e7c` |
| 3.3 – Verlustfreie Daten-/Modulüberführung | [Spec, Migrations-/Transaktionsnachweise und Reviewabschluss](spec-3-3-bestehende-ausgaben-und-budgets-verlustfrei-weiterfuehren.md) | `607db4a` |
| 3.4 – Getrennter Ausgabenbereich über v2 | [Spec, vollständige CRUD-/Fehlermatrix und Reviewabschluss](spec-3-4-eigene-ausgaben-im-getrennten-bereich-ueber-api-v2-verwalten.md) | `41770e4` |
| 3.5 – Monatsbudget und Restbudget über v2 | [Spec, konsistente Monatsansicht und Reviewabschluss](spec-3-5-monatsbudget-und-restbudget-ueber-api-v2-pruefen-und-aendern.md) | `3d4e120` |
| 3.6 – Sparziele und Gesamtfortschritt über v2 | [Spec, Zielpflege-/Darstellungsnachweise und Reviewabschluss](spec-3-6-eigene-sparziele-und-gesamtfortschritt-ueber-api-v2-pflegen.md) | `3688a66` |
| 3.7 – Sichere v1-Stilllegung | [Storynachweis](spec-3-7-die-neue-oberflaeche-nach-sicherer-v1-stilllegung-nutzen.md) und [CI-Korrektur samt ausdrücklich dokumentiertem Storyabschluss](spec-3-7-pr26-ci-abschluss.md) | `32187af`, Abschlusskorrektur `cb17689` |
| 3.8 – Signierter manueller Gesamtfortschritt | [Spec mit Abschlussnachweisen vom 06.11.2026](spec-3-8-tatsaechlichen-gesamtfortschritt-auch-negativ-speichern.md) | `8913a1f` |

Stories 3.1–3.6 und 3.8 wechseln von `review` auf `done`; Story 3.7 war bereits `done`. Epic 3 wechselt von `in-progress` auf `done`. Die ursprünglichen Abnahmekriterien in [epics.md](../planning-artifacts/epics.md) und die historischen Storyverläufe bleiben erhalten.

## Abgeglichene Gesamtprüfungen

Die vorhandenen Abschlussprotokolle vom 06.11.2026 wurden für diesen Abschluss tatsächlich gelesen. Die folgenden Ergebnisse stammen aus den bereits ausgeführten Implementierungsprüfungen; wegen der reinen Dokumentations-/Statusänderung wurde kein neuer vollständiger Anwendungstest behauptet oder benötigt.

| Prüfung | Erfolgreiches Ergebnis | Vorhandenes lokales Protokoll |
| --- | --- | --- |
| Vertrag und Build | v1/v2 validiert und je eigener Basis kompatibel; generierte Java-/Angular-Schnittstellen und SPA gebaut | `/tmp/tnbp38-contract-final.log` |
| Python-Prüfungen | 19 erfolgreich | `/tmp/tnbp38-python-final.log` |
| Vollständiges Backend-`verify` | 44 Unit-/Architekturtests und 308 Integrationstests; keine Fehler oder übersprungenen Fälle | `/tmp/tnbp38-backend.log` |
| Ergänzte Backend-Reviewnachweise | 12 Integrationstests erfolgreich | `/tmp/tnbp38-review-backend.log` |
| Vollständige HTTPS-Browsermatrix | 211 Fälle gemeinsam erfolgreich | `/tmp/tnbp38-e2e-complete.log` |
| Echter Versionsübergang einschließlich signierter Persistenz | 5 Fälle gemeinsam erfolgreich | `/tmp/tnbp38-transition.log` |
| Gezielte Navigationsstabilität | 12 Ausführungen erfolgreich | `/tmp/tnbp38-navigation.log` |

Der gesicherte vollständige Failsafe-XML-Bericht unter `/tmp/tnbp38-backend-full-h9b4d8dv/failsafe-reports` bestätigt unabhängig die 308 fehlerfreien Integrationstests. Für die Unit-Zahl ist die Zusammenfassung des vollständigen Maven-Laufs maßgeblich; im Surefire-Ordner liegt zusätzlich ein älterer gezielter Integrationstestbericht. Die dauerhaften Ergebniszusammenfassungen und Prüfgrenzen stehen in den verlinkten Story-Spezifikationen; `/tmp` ist kein dauerhaftes Nachweisarchiv.

Für den Statusabschluss wird der vorhandene deterministische Sprintgenerator mit gezielten Statusvorgaben verwendet. Seine Vorschau erkennt alle vier Epics und 25 Stories, ohne neue Einträge, verwaiste Schlüssel oder illegale Statuswerte. Die Hinweise zu zusätzlichen Übersichtsüberschriften betreffen keine fehlenden Epic-/Storyeinträge. Der Aktualisierungszeitpunkt erhält zugleich das vom Validator verlangte vollständige Datums-/Zeitformat.

Abschlussprüfung: Sprintvalidator `valid: true`, acht von acht Epic-3-Stories `done`, sämtliche übrigen Statuswerte gegenüber dem Ausgangscommit unverändert, alle Berichtlinks auf vorhandene Dateien geprüft und `git diff --check` erfolgreich. Die Statusansicht meldet keine Risiken oder Warnungen und nennt Story 4.1 als nächsten Umsetzungsschritt.

## Erhaltene Grenzen und nächste Arbeit

- [Deferred Work](deferred-work.md) bleibt die Liste der ausdrücklich zurückgestellten Verbesserungen und unbestätigten Risiken. Sie wird durch `done` weder als erledigt noch als zusätzlich geprüft ausgewiesen.
- Praktische Screenreaderläufe und reale Smartphone-Softwaretastaturen wurden nicht zusätzlich geprüft. Tastatur, Fokus, ARIA, Axe, vier Prüfgrößen und 200-%-Text sind automatisiert nachgewiesen; gesprochene Ausgabe wird daraus nicht abgeleitet.
- Monatsautomatik und ihre Kontenaktivierung bleiben Epic 4 zugeordnet. Epic 4 und alle acht zugehörigen Stories bleiben auf `backlog`; der erste Umsetzungsschritt ist Story 4.1.
- Produktionsfreigabe und echte Nutzerdaten setzen weiterhin die offenen Datenlebenszyklus-/Betriebsentscheidungen, verschlüsselte externe Backups und getestete Wiederherstellung voraus.
- `epic-3-retrospective` bleibt `optional`. Dieser Abschluss ist keine Retrospektive und erfindet keine daraus abgeleiteten Maßnahmen.
- GitHub-Issues werden ausschließlich beim gesondert beauftragten manuellen Spiegelabgleich aus veröffentlichten Quellen auf `main` aktualisiert. Dieser lokale Abschluss veröffentlicht oder synchronisiert nichts.
