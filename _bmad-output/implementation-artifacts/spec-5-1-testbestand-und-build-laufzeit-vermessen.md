---
title: '5.1 Testbestand und vollständige Build-Laufzeit reproduzierbar vermessen'
type: 'chore'
created: '2026-11-14'
status: 'in-progress'
baseline_commit: '8f66421be3b7090c5cd384c9679657d9a17a6b3f'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-5-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Für das Testrefactoring fehlen ein vollständiges fallbezogenes Inventar und vergleichbare aktuelle Laufzeitnachweise. Story 5.1 schafft die prüfbare Grundlage für 5.2 bis 5.5 gemäß ihren acht Abnahmekriterien.

**Ansatz:** Den vorhandenen Prüfverbund inventarisieren, Anforderungen und geschützte Grenzen zuordnen und mit einem wiederholbaren Messwerkzeug vermessen. Aus erfolgreicher Baseline, separater Abdeckungsmessung und verfügbaren CI-Daten konkrete Refactoring-Kandidaten ableiten.

## Boundaries & Constraints

**Immer:** Referenzrevision vollständig festhalten; lokale Pflichtgruppen in fester Reihenfolge ausführen: Python, Vertragsprüfung samt Generatoren/Kompilierung/SPA, Backend-verify, Browser normal/Übergang/Automatik. Warme Abhängigkeitscaches sind erlaubt; Warm-up, mindestens drei erfolgreiche Messläufe und zusätzlicher bereinigter Lauf sind erforderlich. Fehlversuche separat dokumentieren. Setup und Mehrfach-Builds bleiben innerhalb der Messzeit. Codeabdeckung separat instrumentieren; keine instrumentierten Zeiten als primäre Baseline verwenden.

**Niemals:** Assertions abschwächen, Pflichtgruppen entfernen, Produktverhalten/Verträge ändern, Produktionsfreigaben erteilen oder GitHub-Issues abgleichen. Offene Stories 4.6–4.8 bleiben offen. Fehlende CI-/Abdeckungsnachweise verhindern eine unbegründete Fertigmeldung. Das 30-%-Ziel darf nicht stillschweigend gesenkt werden.

## I/O & Edge-Case Matrix

| Zustand | Ergebnis | Fehlerbehandlung |
| --- | --- | --- |
| Voraussetzungen erfüllt | Pro Lauf Revision, Umgebung, Cache, Gruppenzeiten und Logs; Median nur erfolgreicher vollständiger Läufe | Fehlerhafte Läufe getrennt halten |
| Fehlendes Werkzeug, Portkonflikt oder gescheiterte Gruppe | Benannte Voraussetzung beziehungsweise Gruppe und Fehlerstatus | Kein Leistungsnachweis |
| Geerbte, parametrisierte oder geschleifte Fälle | Stabile Fallreferenzen mit Variante und Ausführungspfad | Ungeklärte Discovery sichtbar markieren |
| Fehlender CI-Zugang oder offene Produktabnahme | Sichtbare Nachweislücke | Keine erfundenen Werte oder Abdeckung |

</frozen-after-approval>

## Code Map

- `backend/pom.xml`, `backend/src/test/java/de/linus/tnbp/`: Surefire/Failsafe, zwei Generatoren; sechs V2-Klassen erben V1-Matrizen. Coverage fehlt.
- `frontend/package.json`, `frontend/playwright*.config.ts`, `frontend/e2e/`: drei Browsergruppen, keine Unit-Abdeckung.
- `scripts/check-contract.sh`, `scripts/start*e2e*.sh`, `scripts/tests/`: vorhandene Befehle/Fixtures; wiederholte Builds und Generierung erfassen.
- `.github/workflows/ci.yml`: sechs Jobs, Surefire in beiden Backend-Jobs.
- Monatsfachregeln, Architektur AD-8/9/10 und Story-Specs unter `_bmad-output/`: Schutzanforderungen und Regressionen.

## Tasks & Acceptance

- [x] `scripts/test-baseline.py` — Vorprüfung, Messläufe, Logs/Revision/Umgebung, Phasenzeiten, Median und Fehlerstatus implementieren.
- [x] `scripts/tests/test_test_baseline.py` — Fehlerfälle, Vollständigkeit, Median und Duplikatzählung prüfen.
- [x] `_bmad-output/implementation-artifacts/test-baseline/` — versioniertes Inventar/Matrix: stabile Fall-ID, Quelle/Variante/Vererbung, Anforderung/AC, Beobachtung, Risiko, Zieltestart, verbleibende Integration und späterer Ersatznachweis; alle 17 Monatsfälle und Architekturpräzisierungen zuordnen.
- [ ] Dort Warm-up, drei erfolgreiche vollständige Messungen und bereinigten Lauf ablegen; Setup/Generierung/Kompilierung/Prüfkosten unterscheiden.
- [ ] `backend/pom.xml` — separat aktiviertes Coverage-Profil; generierten Code ausschließen, identischen Vergleichsnenner dokumentieren; Frontend-Lücke ausweisen.
- [ ] Baseline-Bericht — verfügbare vergleichbare CI-Läufe lesend auswerten; kritischen Pfad, Jobzeitsumme und aktuelle Kosten von ReleaseTransitionIT/AdministrativeSerializationIT erfassen; fehlende Nachweise offen halten.
- [ ] `README.md`, Baseline-Bericht — Bedienung, Szenariozählregel je Backend/Frontend, geschützte Integrationen und spätere Fehlervarianten dokumentieren; 5.2–5.4 priorisieren, Zielsekunden als 70 % des Medians berechnen und Erreichbarkeit begründen.

**Abnahme:** Alle acht AC der Story 5.1 bleiben verbindlich:

- Angenommen der Bestand liegt vor, wenn Quellen und Discovery abgeglichen werden, dann sind Fallvarianten, Mehrfachausführungen und Anforderungszuordnung vollständig (AC-1/2).
- Angenommen erfolgreiche Läufe liegen vor, wenn sie ausgewertet werden, dann sind Baseline, CI-Kosten und Ziel nachvollziehbar (AC-3–5).
- Angenommen die Matrix vorliegt, wenn Schutz und Coverage geprüft werden, dann bleiben reale Grenzen, Regressionen und offene Abnahmen sichtbar (AC-6/7).
- Angenommen eine andere Person folgt der Anleitung, wenn sie die Befehle ausführt, dann erhält sie reproduzierbare Ergebnisse oder klare Fehlerstatus (AC-8).

## Implementation Notes

- Messwerkzeug mit fester Reihenfolge aller sechs Pflichtgruppen, Warm-up/drei Messungen/bereinigtem Lauf, Monotonzeit, Logs, Revision/Hashmanifest, optionalen inklusiven Vertragsphasenzeiten, Fehlerstatus und Median ausschließlich vollständiger erfolgreicher Messungen umgesetzt. Opt-in JaCoCo-Profil (0.8.14) ergänzt; generierte v1/v2-Vertragsklassen ausgeschlossen.
- Nachweise/Inventar/Monatsmatrix/CI-Rohdaten und AC-Resttabelle unter `test-baseline/REPORT.md`; README beschreibt eigenständige Bedienung. Keine Assertions oder Produktverträge verändert, keine Pflichtgruppe entfernt, kein GitHub-Abgleich.
- JUnit-Discovery: 371 Methoden-/Template-Ausführungspfade einschließlich sechs Vererbungsmatrizen, 0 fehlende/zusätzliche gegenüber Quelle. Drei Playwright-Discoverygruppen erfassen 320 Ausführungen. Parameter, konstante/namentlich initialisierte Loopvarianten und lesbare Assertionketten sind archiviert. Nach Reviewnacharbeit sind alle 746 Quellenfälle im expliziten `reviewed-scenario-manifest.json` konkreten Story-ACs, Eingaben/Erwartungen und primären Szenario-IDs zugeordnet; keine heuristische Keywordzuordnung. Refresh verweigert nicht zugeordnete/geänderte Fälle. Die übergreifende fachliche Konsolidierung bleibt offen; vorläufige Quellgruppen sind keine anerkannte Fachquote. Vier Fail-closed-Regressionsprüfungen bestehen.
- Alle 17 Monatsfälle sowie AD-8/9/10-Präzisierungen handgeprüft zugeordnet; offene Stories 4.6–4.8 unverändert offen.
- Vollständige lokale Messung blockiert: Vorprüfung liefert EPERM beim Socket-Bind auf 8080/4200 (IPv4/IPv6). Keine erfolgreichen Gesamtzeiten, kein lokaler Median, kein unbegründetes Sekundenziel. Coverage ebenfalls offen: JaCoCo im Cache nicht vorhanden; mit schreibbarer Cachekopie scheitert Maven-Central-DNS. Fehlversuche separat abgelegt.
- CI ausschließlich lesend: drei aktuelle erfolgreiche Läufe mit identischem ausführbarem Quellumfang; Median kritischer Pfad 1129 s, Jobzeitsumme 1984 s. ReleaseTransitionIT/AdministrativeSerializationIT mit aktuellen Klassenzeiten und Cachebeleg erfasst. Diese Werte ersetzen keine lokale Baseline.
- Verifikation: 33 Python-Tests erfolgreich. Offline Backend-test-compile erfolgreich. 48 Backend-Unit-/Architekturausführungen (Prozesshilfe ausgeschlossen) mit explizitem gecachtem Mockito-Agent erfolgreich; erster Standard-Teillauf mit vier umgebungsbedingten Self-Attach-Fehlern separat erhalten. Kein vollständiges verify-/Browser-/Coverage-Ergebnis behauptet. Status bleibt in-progress.

## Spec Change Log

## Review Triage Log

## Verification

- `python3 -m unittest discover -s scripts/tests -v`: bestehende und neue Werkzeugprüfungen bestehen.
- Dokumentierter Messbefehl: Warm-up, drei vollständige erfolgreiche Läufe und bereinigter Lauf; sämtliche Pflichtgruppen enthalten.
- Separater Coverage-Befehl: Berichte und Ausschlüsse prüfbar, keine Verwechslung mit Laufzeitmessung.
- Inventar gegen Testdiscovery, Quellvarianten und Story-Abnahmen abgleichen; CI-Zugang ausschließlich lesend verwenden.

- Lokale Diffprüfung: veraltete Maven-Reports werden vor Backend-Ausführung bereinigt; unsichere Ausgabepfade innerhalb der bereinigten Build-Verzeichnisse werden abgewiesen. Zwei zusätzliche Werkzeugtests bestehen. Semantische Quellgruppen bleiben ausdrücklich vorläufig; cross-method/cross-layer Fachduplikate sind noch unabhängig zu konsolidieren (`semantic_review_complete: false`). Git-Staging wegen schreibgeschütztem Index nicht möglich; temporärer Gesamtdiff erstellt. Kein formaler Workflowabschluss.

- Fortsetzung 2026-11-14 auf ausdrücklichen Nutzerauftrag: übergreifenden statischen Szenario-Abgleich abgeschlossen. Alle 746 Quellverweise und 99 innere Browser-Schleifen explizit zugeordnet; gleiche Regel-/Eingabe-/Beobachtungsklassen über Methoden hinweg konsolidiert, notwendige reale Grenzen erhalten. Bericht: [SCENARIO-REVIEW.md](test-baseline/SCENARIO-REVIEW.md). Der frühere Vermerk `semantic_review_complete: false` ist dadurch überholt; aktuell true ausschließlich für den statischen Abgleich. Zwölf Inventar-/Semantikregressionen erfolgreich. Baseline, Coverage und tatsächliche vollständige Ausführungsnachweise bleiben offen; Story weiterhin in-progress.
