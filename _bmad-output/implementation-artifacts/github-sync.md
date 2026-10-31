# GitHub-Spiegel der BMAD-Planung

Stand der Einrichtung: 31.10.2026.

## Auftrag und Quelle

Alle Epics und Stories werden als Issues in [LinusBaudiss/try-not-to-be-poor](https://github.com/LinusBaudiss/try-not-to-be-poor/issues) gespiegelt. Der Nutzer hat das Anlegen und den dauerhaften Abgleich einschließlich nativer Parent-, Development- und Blockierungsbeziehungen beauftragt; ein separates GitHub-Projects-Board ist nicht gewünscht.

Die verbindlichen Quellen sind die veröffentlichten Dateien auf `main`:

- [epics.md](https://github.com/LinusBaudiss/try-not-to-be-poor/blob/main/_bmad-output/planning-artifacts/epics.md): Titel, Epic-Ziele, Story-Texte und vollständige Abnahmekriterien.
- [sprint-status.yaml](https://github.com/LinusBaudiss/try-not-to-be-poor/blob/main/_bmad-output/implementation-artifacts/sprint-status.yaml): Fortschritt unter `development_status`.

Lokale Entwicklungszweige werden nicht automatisch veröffentlicht. Ihre Änderungen gelangen nach dem Merge auf `main` in den Spiegel. Der Abgleich schreibt keine GitHub-Änderungen zurück in die BMAD-Dateien und nimmt keine fachliche Abnahme vor. Ein gemergter PR oder `done` in einer Implementierungs-Spec ersetzt den Sprintstatus nicht.

## Laufender Abgleich

Die aktive Codex-Automation **BMAD-Issues synchron halten**, ID `bmad-issues-synchron-halten`, kehrt stündlich in den Einrichtungs-Chat zurück. Sie verwendet die GitHub-Anbindung und enthält den vollständigen Ablauf in ihrem gespeicherten Prompt. Rechner und Codex-App müssen für den lokalen Ablauf laufen. Änderungen, Fehler und erforderliche Entscheidungen werden gemeldet; unveränderte erfolgreiche Abgleiche bleiben still.

Nach Veröffentlichung von BMAD-Änderungen kann derselbe Abgleich sofort im aktuellen Chat ausgeführt werden. Die Automation übernimmt den regelmäßigen Nachlauf. Sie ist keine GitHub-Action und kein dauerhaft auf GitHub laufender Dienst.

## Regeln für jeden Abgleich

1. Den Commit von `main` ermitteln und beide Quelldateien von genau diesem Commit lesen.
2. Tatsächliche `## Epic N:`- und `### Story N.M:`-Abschnitte erfassen. Listenübersichten, Entwürfe, Retrospektiven und Aktionspunkte zählen nicht als zusätzliche Epics oder Stories. Story-Text endet an der nächsten Überschrift auf Ebene 1 bis 3.
3. Sprintstatus über die numerischen IDs zuordnen, nicht über die teils gekürzten Slugs. Vollständigkeit, Eindeutigkeit und erlaubte Statuswerte vor Mutationen prüfen.
4. Alle offenen und geschlossenen Repository-Issues paginiert lesen und Pull Requests ausfiltern. Vorhandene Issues über ihre stabilen Marker zuordnen; bei unklarem Ausgang einer Erstellung erneut lesen, bevor sie wiederholt wird.
5. Fehlende Epics zuerst anlegen, dann Stories als echte Sub-Issues ihrer Parent-Epics zuordnen; zuletzt die Epic-Aufgabenlisten mit allen Story-Verweisen vervollständigen. Vorhandene zugehörige PRs unter Development und explizite Planungsabhängigkeiten unter blocks/blocked by verknüpfen. Die nachstehenden nativen Beziehungen sind Teil jedes Abgleichs.
6. Titel, verwalteten Inhalt, Zustand und automatisch verwaltete Beziehungen nur bei tatsächlicher Änderung aktualisieren. `done` bedeutet geschlossen mit Abschlussgrund `completed`; alle anderen Status bedeuten offen, gegebenenfalls wieder öffnen. Nur erledigte Stories sind in Epic-Listen angehakt. Den Zustand nach dem Verknüpfen von PRs erneut gegen den Sprintstatus abgleichen.
7. Texte außerhalb des verwalteten Bereichs, Kommentare, Labels, Zuweisungen, manuell hinzugefügte Beziehungen und andere manuelle Metadaten erhalten. Automatisch verwaltete Beziehungen im unten beschriebenen Eigentumsmarker dokumentieren.
8. Nach dem Schreiben erneut lesen: jede geplante ID genau einmal, vollständige Inhalte und Verweise, korrekter Zustand, tatsächlicher Parent und inverse Sub-Issue-Liste, Development-Verknüpfungen einschließlich gemergter PRs sowie beide Richtungen jeder Blockierung. Bei doppelten IDs, beschädigten Markierungen, gleichnamigen unmarkierten Issues oder unvollständiger Quelle keine riskante Zuordnung vornehmen, sondern den konkreten Konflikt melden. Verschwundene Planungs-IDs melden; keine Issues löschen.

Der verwaltete Bereich beginnt mit `<!-- bmad-sync:start -->`, enthält genau eine ID wie `<!-- bmad-sync:key=story-3.1 -->` bzw. `<!-- bmad-sync:key=epic-3 -->` und endet mit `<!-- bmad-sync:end -->`. Eigene Ergänzungen gehören außerhalb dieser Markierungen oder in Kommentare.

Statusbeschriftungen: `backlog` → Geplant; `ready-for-dev` → Bereit zur Umsetzung; `in-progress` → In Arbeit; `review` → Zur Prüfung; `done` → Erledigt. Epics erlauben nur `backlog`, `in-progress` und `done`.

Die bestehenden Issues geben das Format vor: BMAD-ID und Status, Quelllinks auf Planung und Sprintstatus, Synchronhinweis und Vorrang aktueller Spezifikationen vor ausdrücklich ersetzten historischen Abnahmen. Story-Issues enthalten den vollständigen Story-Text; Epic-Issues den Zieltext und die Story-Aufgabenliste. Relative Markdown-Links werden gegen die Quelldatei aufgelöst.

## Native Parent-, Development- und Blockierungsbeziehungen

Erweiterung vom 31.10.2026: Textlinks und Aufgabenlisten allein erfüllen diese Anforderungen nicht. Jede Story ist ein tatsächliches Sub-Issue ihres Epic-Parents. Implementierungs- und zugehörige Korrektur-PRs stehen im nativen Bereich Development; dokumentierte Voraussetzungen werden als gerichtete blocks/blocked by-Beziehungen abgebildet.

Die GitHub-Anbindung stellt die notwendigen Schreibfunktionen derzeit nicht bereit. Der vorhandene direkte GitHub-Zugang über `gh api` funktioniert mit Netzwerkfreigabe. Eine fehlgeschlagene Authentifizierungsprüfung ohne Netzwerkzugriff darf nicht als sicherer Beleg für ungültige Zugangsdaten behandelt werden. Kein Ersatz durch bloße Textlinks und keine Änderung von Zugangsdaten oder Zugriffsrechten.

- Parent: `POST /repos/{owner}/{repo}/issues/{epic_number}/sub_issues` mit `sub_issue_id` als Datenbank-ID der Story. Parent und Sub-Issue-Liste anschließend nachlesen. Einen abweichenden manuellen Parent nicht stillschweigend ersetzen. [GitHub: Sub-Issues](https://docs.github.com/en/rest/issues/sub-issues)
- Development: GraphQL `addCloseIssueReferences(input:{issueId:ISSUE_NODE_ID,pullRequestIds:[PR_NODE_ID,...]})`. Über `closedByPullRequestsReferences(first:100,includeClosedPrs:true)` einschließlich historischer gemergter PRs verifizieren; Pagination beachten. Keine PR-Beschreibung als Ersatz umschreiben. GitHub kann verknüpfte Issues beim Merge schließen; der BMAD-Sprintstatus bleibt für den Spiegel maßgeblich. [GitHub: PR-Verknüpfung](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue)
- Blockierungen: Wenn A Voraussetzung für B ist, `POST /repos/{owner}/{repo}/issues/{B_number}/dependencies/blocked_by` mit `issue_id` als Datenbank-ID von A. `blockedBy` und invers `blocking` nachlesen. Bereits erledigte Voraussetzungen bleiben als aufgelöste Beziehungen erhalten. [GitHub: Issue-Abhängigkeiten](https://docs.github.com/en/rest/issues/issue-dependencies)

Zugehörige PRs anhand eindeutiger Story-ID in Branch/Titel und bestätigtem Implementierungsumfang in Beschreibung oder geänderten Story-Specs zuordnen. Eine beiläufige Erwähnung in einem allgemeinen Planungs-PR genügt nicht. Bei Mehrdeutigkeit die Kandidaten melden. Mehrere zugehörige Implementierungs-/Korrektur-PRs sind zulässig. Für Stories ohne PR wird kein Verweis erfunden; jeder spätere Lauf prüft neue PRs erneut.

### Eigentum an automatisch verwalteten Beziehungen

Direkt hinter dem stabilen ID-Marker enthält jedes Issue innerhalb des verwalteten Bereichs einen zusätzlichen JSON-Kommentar, zum Beispiel:

```html
<!-- bmad-sync:relationships={"parent":"epic-3","blocked_by":["story-3.1"],"pull_requests":[21]} -->
```

Das Beispiel zeigt nur das Format. `parent` enthält eine kanonische BMAD-ID oder bei Epics `null`; `blocked_by` enthält kanonische BMAD-IDs; `pull_requests` enthält PR-Nummern. Die tatsächlichen Marker geben die erfolgreich eingerichteten automatisch verwalteten Beziehungen an. Leere Mengen bleiben leere Arrays. Den Marker vor einem Inhaltsupdate lesen, erhalten und erst nach erfolgreichen nativen Mutationen samt Nachlesen aktualisieren.

Nur zuvor durch diesen Marker als automatisch verwaltet belegte Beziehungen dürfen entfernt oder ersetzt werden, wenn die aktuelle Quelle sie tatsächlich ablöst. Alle anderen manuell angelegten Beziehungen bleiben erhalten. Vor Entfernen oder Ersetzen die bisherige Eigentumsinformation sichern. Fehlgeschlagene native Änderungen nicht als erfolgreich im Marker vermerken. Bei Konflikten oder fehlendem Zugriff den Abgleich als unvollständig melden.

### Verifizierte Blockierungen

Die tatsächlichen Voraussetzungen stammen aus den bestätigten Epic-Übersichten, den Abschnitten **Abhängigkeit** bzw. **Abhängigkeiten und Umfang** sowie den Planungstabellen in `epics.md` auf `main`:

| Blockiertes Epic / Story | Blockiert durch |
| --- | --- |
| Epic 3 | Epics 1 und 2 |
| Epic 4 | Epic 3 |
| 3.1 | 1.1 und 1.2 |
| 3.2 | Epics 1 und 2 sowie 3.1 |
| 3.3 | 3.1 und 3.2 |
| 3.4 | 3.1 bis 3.3 |
| 3.5 | 3.1 bis 3.4 |
| 3.6 | Epic 2 sowie 3.1 bis 3.5 |
| 3.7 | 3.1 bis 3.6 |
| 3.8 | 3.1 bis 3.7 |
| Jede 4.N | Epic 3 sowie alle vorherigen Stories 4.1 bis 4.(N−1); für 4.1 nur Epic 3 |

Das sind 72 native gerichtete Beziehungen. Explizit genannte Bereiche werden vollständig abgebildet. Eine bloße Nummernreihenfolge, Nennung in einem Beispiel oder spätere Folgearbeit ist keine zusätzliche Abhängigkeit. Insbesondere werden für historische Stories 1.x/2.x ohne explizite Planungsangabe keine Blockierungen erfunden. Zyklen und unbekannte IDs vor Mutationen ablehnen. Die Tabelle bei geänderter Planung erneut gegen die aktuelle Quelle prüfen.

### Verifizierte Development-Zuordnung

| Story-Issue | Zugehörige PRs |
| --- | --- |
| [1.1 / #31](https://github.com/LinusBaudiss/try-not-to-be-poor/issues/31) | [#1](https://github.com/LinusBaudiss/try-not-to-be-poor/pull/1), Registrierungskorrektur [#2](https://github.com/LinusBaudiss/try-not-to-be-poor/pull/2) |
| 1.2 / #32 | [#3](https://github.com/LinusBaudiss/try-not-to-be-poor/pull/3) |
| 1.3 / #33 | [#4](https://github.com/LinusBaudiss/try-not-to-be-poor/pull/4) |
| 1.4 / #34 | [#5](https://github.com/LinusBaudiss/try-not-to-be-poor/pull/5) |
| 1.5 / #35 | [#6](https://github.com/LinusBaudiss/try-not-to-be-poor/pull/6) |
| 1.6 / #36 | [#7](https://github.com/LinusBaudiss/try-not-to-be-poor/pull/7) |
| 2.1 / #37 | [#8](https://github.com/LinusBaudiss/try-not-to-be-poor/pull/8) |
| 2.2 / #38 | [#9](https://github.com/LinusBaudiss/try-not-to-be-poor/pull/9) |
| 2.3 / #39 | [#10](https://github.com/LinusBaudiss/try-not-to-be-poor/pull/10) |
| 3.1 / #40 | [#19](https://github.com/LinusBaudiss/try-not-to-be-poor/pull/19) |
| 3.2 / #41 | [#21](https://github.com/LinusBaudiss/try-not-to-be-poor/pull/21) |
| 3.3 / #42 | [#22](https://github.com/LinusBaudiss/try-not-to-be-poor/pull/22) |
| 3.4 / #43 | [#23](https://github.com/LinusBaudiss/try-not-to-be-poor/pull/23) |
| 3.5 / #44 | [#24](https://github.com/LinusBaudiss/try-not-to-be-poor/pull/24) |
| 3.6 / #45 | [#25](https://github.com/LinusBaudiss/try-not-to-be-poor/pull/25) |
| [3.7 / #46](https://github.com/LinusBaudiss/try-not-to-be-poor/issues/46) | [#26](https://github.com/LinusBaudiss/try-not-to-be-poor/pull/26) |

Für Story 3.8 und Stories 4.1 bis 4.8 existiert zum Einrichtungszeitpunkt noch kein zugehöriger PR. Die bestätigte Ausgangszuordnung begrenzt spätere PR-Ergänzungen nicht.

Abschlusskontrolle am 31.10.2026: 25 korrekte Parent-Zuordnungen einschließlich inverser Sub-Issue-Listen, 17 Development-Verknüpfungen für 16 Stories und 72 Blockierungsbeziehungen in beiden Richtungen über GitHub erneut gelesen. Alle 29 Eigentumsmarker stimmen mit den eingerichteten Beziehungen überein; Story-Inhalte, Titel und Statuswerte sind unverändert. Die aktive stündliche Automation wurde um dieselben Regeln erweitert.

## Verifizierter Anfangsbestand

29 Issues: vier Epics und 25 Stories, 11 geschlossen und 18 offen. Alle Titel, vollständigen Quellabschnitte, Zustände und Epic-/Story-Verweise wurden nach Erstellung erneut über GitHub gelesen und verglichen. Ein zweiter Vergleich ergab keinen Änderungsbedarf. Der Anfangsbestand ist keine Obergrenze für spätere Planung.

| BMAD-ID | GitHub-Issue | Status bei Einrichtung |
| --- | --- | --- |
| epic-1 | [#27](https://github.com/LinusBaudiss/try-not-to-be-poor/issues/27) | `done` |
| story-1.1 | [#31](https://github.com/LinusBaudiss/try-not-to-be-poor/issues/31) | `done` |
| story-1.2 | [#32](https://github.com/LinusBaudiss/try-not-to-be-poor/issues/32) | `done` |
| story-1.3 | [#33](https://github.com/LinusBaudiss/try-not-to-be-poor/issues/33) | `done` |
| story-1.4 | [#34](https://github.com/LinusBaudiss/try-not-to-be-poor/issues/34) | `done` |
| story-1.5 | [#35](https://github.com/LinusBaudiss/try-not-to-be-poor/issues/35) | `done` |
| story-1.6 | [#36](https://github.com/LinusBaudiss/try-not-to-be-poor/issues/36) | `done` |
| epic-2 | [#28](https://github.com/LinusBaudiss/try-not-to-be-poor/issues/28) | `done` |
| story-2.1 | [#37](https://github.com/LinusBaudiss/try-not-to-be-poor/issues/37) | `done` |
| story-2.2 | [#38](https://github.com/LinusBaudiss/try-not-to-be-poor/issues/38) | `done` |
| story-2.3 | [#39](https://github.com/LinusBaudiss/try-not-to-be-poor/issues/39) | `done` |
| epic-3 | [#29](https://github.com/LinusBaudiss/try-not-to-be-poor/issues/29) | `in-progress` |
| story-3.1 | [#40](https://github.com/LinusBaudiss/try-not-to-be-poor/issues/40) | `review` |
| story-3.2 | [#41](https://github.com/LinusBaudiss/try-not-to-be-poor/issues/41) | `review` |
| story-3.3 | [#42](https://github.com/LinusBaudiss/try-not-to-be-poor/issues/42) | `review` |
| story-3.4 | [#43](https://github.com/LinusBaudiss/try-not-to-be-poor/issues/43) | `review` |
| story-3.5 | [#44](https://github.com/LinusBaudiss/try-not-to-be-poor/issues/44) | `review` |
| story-3.6 | [#45](https://github.com/LinusBaudiss/try-not-to-be-poor/issues/45) | `review` |
| story-3.7 | [#46](https://github.com/LinusBaudiss/try-not-to-be-poor/issues/46) | `backlog` |
| story-3.8 | [#47](https://github.com/LinusBaudiss/try-not-to-be-poor/issues/47) | `backlog` |
| epic-4 | [#30](https://github.com/LinusBaudiss/try-not-to-be-poor/issues/30) | `backlog` |
| story-4.1 | [#48](https://github.com/LinusBaudiss/try-not-to-be-poor/issues/48) | `backlog` |
| story-4.2 | [#49](https://github.com/LinusBaudiss/try-not-to-be-poor/issues/49) | `backlog` |
| story-4.3 | [#50](https://github.com/LinusBaudiss/try-not-to-be-poor/issues/50) | `backlog` |
| story-4.4 | [#51](https://github.com/LinusBaudiss/try-not-to-be-poor/issues/51) | `backlog` |
| story-4.5 | [#52](https://github.com/LinusBaudiss/try-not-to-be-poor/issues/52) | `backlog` |
| story-4.6 | [#53](https://github.com/LinusBaudiss/try-not-to-be-poor/issues/53) | `backlog` |
| story-4.7 | [#54](https://github.com/LinusBaudiss/try-not-to-be-poor/issues/54) | `backlog` |
| story-4.8 | [#55](https://github.com/LinusBaudiss/try-not-to-be-poor/issues/55) | `backlog` |

Die Stories 3.1 bis 3.6 bleiben entsprechend dem Sprintstatus auf `main` in `review`, obwohl ihre PRs gemergt sind. Story 3.7 steht auf `main` noch in `backlog`; ein abweichender Stand im Entwicklungszweig wird erst nach Veröffentlichung gespiegelt.
