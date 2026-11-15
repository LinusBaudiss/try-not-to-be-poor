# Sprint Change Proposal: Story 5.2 Unit-Quote

**Status:** Genehmigt und umgesetzt am 2026-11-15
**Auslöser:** Story 5.2, AC-8
**Empfohlener Weg:** AC-8 als Zwischenziel der Story präzisieren; Epic-Ziel TR-2 vorerst unverändert und offen lassen.

## 1. Anlass und Nachweis

Story 5.2 setzt in AC-8 die Vorgabe aus Epic TR-2 um: echte Backend-Unit-Tests sollen mehr als 50 % der 1096 unterschiedlichen fachlichen Backend-Szenarien primär abdecken. Das erfordert mindestens 549 Unit-Primärszenarien.

Die Umsetzung hat die Quote von 143/1096 (13,05 %) auf 168/1096 (15,33 %) erhöht. 25 kanonische Szenarien sind mit produktiven Unit-Regeln als Primärnachweis versehen. Die zugehörigen HTTP-/PostgreSQL-/Transaktionsnachweise und `required_integration` bleiben erhalten. Die neueste ergänzte Zuordnung betrifft die 255-Zeichen-Grenze der E-Mail-Policy. Die Matrix hält den Nenner bei 1096; künstliche Aufteilung oder triviale Zusatztests zählen nicht.

Der aktuelle Abstand zur Schwelle beträgt 381 Primärszenarien. Die bisherige Bestandsprüfung fand bei den verbleibenden Fällen überwiegend echte HTTP-, PostgreSQL-, Prozess-, Kontotrennungs-, Commit-, Sperr- und Versionsgrenzen. Eine Unit-Prüfung dieser Grenzen würde deren Nachweis nicht ersetzen. Der Bestand liefert derzeit keine belastbare Liste weiterer 381 unterschiedlicher, isoliert prüfbarer Regeln.

Prüfnachweise: vollständiges Backend-`verify` mit 73 Surefire- und 434 Failsafe-Tests erfolgreich; 42 Python-Prüfungen erfolgreich; Szenarioinventur aktuell 168/1096 (15,33 %). Die Matrix und der Kandidatenbericht liegen unter `_bmad-output/implementation-artifacts/test-baseline/`.

## 2. Auswirkungen

### Epic 5 und Abhängigkeiten

- Epic TR-2 verlangt weiterhin mehr als 50 % und erklärt Qualitätsanforderungen ausdrücklich für vorrangig. Eine Story-Absenkung würde TR-2 nicht erfüllen und darf nicht als Epic-Abschluss gewertet werden.
- Story 5.3 ist laut Epic-Planung unabhängig von 5.2 und kann parallel weiterlaufen.
- Story 5.4 baut auf 5.2 und 5.3 auf. Ein abgestimmtes, nachweisbares Zwischenziel für 5.2 würde diesen Übergang ermöglichen.
- Story 5.5/AC-5 wiederholt die Quote von mehr als 50 %. Sie und Epic 5/AC-8 bleiben blockiert, solange TR-2 nicht erfüllt oder gesondert neu vereinbart ist.
- Es wird kein neues Epic vorgeschlagen. Vor der Abnahme von 5.5 braucht es entweder weitere echte Kandidaten mit konkreter Fachregel und Integrationsschutz oder eine gesonderte Nutzerentscheidung zu TR-2.

### PRD, Architektur und UX

- **PRD:** keine Änderung vorgeschlagen. Die Quote gehört zu den Test- und Qualitätsanforderungen von Epic 5, nicht zum Produktumfang.
- **Architektur:** keine Änderung vorgeschlagen. Modulgrenzen, Kontotrennung, Transaktionen, API-Verträge und PostgreSQL-Nachweise bleiben unverändert.
- **UX:** keine Änderung vorgeschlagen. Keine Produktansicht oder Nutzerreise ist betroffen.
- **Testinventar und Dokumentation:** Szenariennenner, Kategorien, Primärquellen und Integrationspflichten bleiben reproduzierbar ausgewiesen.

### Technischer Umfang und Risiko

Die vorgeschlagene AC-Änderung ändert keine Produktionsfunktion und keine Testklassifikation. Sie ändert den Abnahmeumfang einer Story und deren Verhältnis zur Epic-Anforderung. Umfang: **moderat**, da Planungsartefakte und Storystatus angepasst werden müssten. Risiko: **mittel**, weil Story 5.2 dadurch abschließbar werden kann, während das Epic-Ziel ausdrücklich unerfüllt bleibt.

## 3. Bewertete Wege

| Weg | Ergebnis | Einschätzung |
| --- | --- | --- |
| A. Story 5.2 bekommt ein messbares Zwischenziel von 15 %; TR-2 bleibt Epic-Gate | 168/1096 entsprechen 15,33 % und überschreiten die vorgeschlagene Mindestquote von 15 % (= mindestens 165 Fälle). AC-8 verlangt zusätzlich die konkrete Kandidaten- und Schutzmatrix sowie keine künstlichen Szenarien. Das Epic bleibt offen. | **Empfohlen.** Erhält ehrliche Zählung und Schutzgrenzen, ohne den Storyabschluss an einer aktuell nicht belegbaren Menge festzuhalten. |
| B. Mehr als 50 % bleibt unverändert in Story 5.2 | Story 5.2 bleibt `in-progress`, bis mindestens 381 weitere echte Szenarien eine direkte Unit-Erwartung erhalten. | Verwirft die nachgewiesene Zwischenleistung als nicht abnahmefähig und hält 5.4 blockiert. Weitere Arbeit ist nur mit konkret belegbaren Kandidaten sinnvoll. |
| C. TR-2 und alle Folgekriterien werden jetzt aufgehoben | Die Quote wird durch dokumentierte Maximierung geeigneter Regeln ersetzt. | Nicht empfohlen: größere Zieländerung, die Epic-Ziel und Story 5.5 betrifft und eine gesonderte Produkt-/Projektentscheidung braucht. |

## 4. Vorgeschlagene Textänderung

### Story 5.2 — AC-8

**Alt:**

> Given Unit-, Adapter- und vollständiger Backend-Prüflauf, when die Verlagerung verglichen wird, then bestehen alle Schutzanforderungen, Ersatznachweise sind konkret verknüpft, Laufzeit und verbleibende teure Fälle dokumentiert und Pflichtintegrationen im regulären `verify`-Pfad enthalten.

**Neu — Vorschlag A:**

> Given das geprüfte Backend-Inventar aus Story 5.1 mit 1096 unterschiedlichen fachlichen Szenarien, when Story 5.2 abgeschlossen wird, then sind mindestens 15 % (mindestens 165/1096) primär durch echte Backend-Unit-Tests belegt. Die 25 zusätzlich zugeordneten Szenarien sind durch eine direkte Prüfung der produktiven Fachregel belegt; jede Zuordnung nennt konkrete Eingabe und erwartete Regel. Alle erforderlichen HTTP-, PostgreSQL-, Prozess-, Commit-, Sperr- und Versionsnachweise bleiben erhalten.
>
> And Nenner, Primärarten, Ergänzungsnachweise, verbleibende Kandidaten und Abstand zu Epic TR-2 (>50 %, mindestens 549/1096) sind reproduzierbar ausgewiesen. Doppelte oder künstlich aufgeteilte Szenarien erhöhen die Quote nicht; Pflichtintegrationen bleiben im regulären `verify`-Pfad.

Der gegenwärtige Stand 168/1096 (15,33 %) erfüllt den vorgeschlagenen Zwischenwert. Die 15-%-Schwelle ist am nachgewiesenen Stand ausgerichtet und ersetzt die übergeordnete Epic-Quote nicht. Das Inventar hält den verbleibenden Abstand und die Integrationsgründe sichtbar.

### Bewusst unverändert

- Epic-5/TR-2 bleibt vorerst bei **mehr als 50 %** und verhindert weiterhin einen unbegründeten Epic-Abschluss.
- Story 5.5/AC-5 bleibt vorerst bei **mehr als 50 %**. Vor ihrer Abnahme muss der Abstand durch weitere echte Kandidaten geschlossen oder in einer weiteren genehmigten Änderung neu bewertet werden.
- Der Szenariennenner bleibt bei 1096. Es gibt keine Änderungen an PRD, Architektur, UX oder produktivem Verhalten.

## 5. Umsetzung nach Freigabe

1. Story AC-8 und ihre Begleitnachweise auf den genehmigten Text abstimmen.
2. Prüfen, dass `sprint-status.yaml` Story 5.2 erst nach vollständiger Erfüllung auf `review` setzt; Epic 5 bleibt `in-progress`.
3. Story 5.3 unabhängig fortsetzen. Vor Story 5.5 den TR-2-Abstand erneut mit konkreten Kandidaten und Kosten bewerten.
4. Kein GitHub-Abgleich, keine Veröffentlichung und keine Änderung an TR-2 ohne ausdrückliche gesonderte Genehmigung.

**Erfolgskriterien:** keine verlorenen Integrationsnachweise; valide kanonische Matrix mit unverändertem Nenner; Story 5.2 erfüllt das genehmigte Zwischenziel; die unerfüllte Epic-Quote bleibt sichtbar offen.

## 6. Handoff

**Einordnung:** moderat. Die Umsetzung wurde nach Zustimmung von Linus durch Developer vorgenommen. Product-Manager-/Architect-Änderungen waren für Vorschlag A nicht erforderlich. TR-2 bleibt als Epic-Gate bestehen.

**Genehmigung:** Linus genehmigte Vorschlag A am 2026-11-15 („Okay tu das“). AC-8 wurde in der Epic-Storyquelle und Story-Spezifikation angepasst; die Story wurde nach Matrixvalidierung auf `review` gesetzt. TR-2, Story 5.5/AC-5 und der Epicstatus bleiben unverändert. Kein GitHub-Abgleich wurde vorgenommen.

## 7. Change-Navigation-Checkliste

- **Auslöser und Belege:** erledigt — Story 5.2/AC-8; aktuelle Quote 168/1096 gegenüber der unveränderten 50-%-Anforderung.
- **Epic-Auswirkungen:** erledigt — TR-2, Abhängigkeit zu 5.4 und wiederholte Quote in 5.5/AC-5 sind benannt.
- **Artefaktkonflikte:** erledigt — Änderungsvorschlag nur für 5.2/AC-8; PRD, Architektur und UX bleiben unberührt.
- **Wege:** erledigt — Zwischenziel empfohlen; unveränderte Quote und umfassende Epic-Neuverhandlung als Alternativen dokumentiert.
- **Nutzerfreigabe:** erledigt — Vorschlag A wurde ausdrücklich genehmigt und umgesetzt.
