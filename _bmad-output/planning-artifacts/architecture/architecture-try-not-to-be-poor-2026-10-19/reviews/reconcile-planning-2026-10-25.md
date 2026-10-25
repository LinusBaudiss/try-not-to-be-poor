# Quellenabgleich der Zielarchitektur

Stand: 2026-10-25. Geprüft wurde die Entwurfsfassung der `ARCHITECTURE-SPINE.md` gegen PRD, DESIGN/EXPERIENCE, Epics, Sprintstatus und AGENTS.md sowie die finale Änderungsspezifikation einschließlich `brownfield.md` und `monatsueberschuesse.md`. Dies ist ein Dokumentenabgleich; er bestätigt keine Umsetzung oder Produktionsreife.

## Urteil

Die Zielarchitektur erhält die tragenden Bestandsanforderungen und ordnet die ausdrücklich beschlossenen Ablösungen richtig ein. Es gibt keine fehlende strukturelle Entscheidung in den geprüften Planungsquellen. Eine nicht beschlossene Lockerung des bestehenden Sitzungsvertrags sollte vor Finalisierung bereinigt werden; die übrigen Hinweise betreffen die eindeutige Weitergabe bestehender Anforderungen.

## Befunde und Prioritäten

1. **P2 — Bestehenden Sitzungsvertrag unverändert binden.** AD-3 erlaubt Access-JWTs mit „höchstens 15 Minuten“. Die zusätzlichen Anforderungen in `epics.md`, Zeile 55, und die Abnahme von Story 1.2, Zeilen 167–169, verlangen 10 Minuten. Weder die neue Spec noch die weitergegebenen Nutzerentscheidungen ersetzen diese Vorgabe. Außerdem nennt AD-3 nur `SameSite`, während derselbe Bestandsvertrag ausdrücklich `SameSite=Strict` verlangt; die Wiederverwendung eines ersetzten Refresh-Tokens widerruft dort die Token-Familie (Story 1.2, Zeilen 183–185). AD-3 sollte 10 Minuten und `SameSite=Strict` nennen und entweder diese Wiederverwendungsregel oder den unverändert weitergeltenden Zugangsvertrag ausdrücklich binden. Damit erhält v2 den bestätigten Bestandsvertrag.

2. **P3 — Fortgeltende UX-Untergrenze mit gezieltem Verweis sichern.** AD-10 bewahrt zugängliche Bedienung, Löschbestätigung, Entwürfe und Sitzungsgrenzen. Die neue Spec, Constraints Zeile 51, erhält daneben ausdrücklich die bisherigen Bedienungsanforderungen. Für die spätere Aufteilung in Stories wäre ein kurzer Verweis unter den Prüfpflichten auf EXPERIENCE „Accessibility Floor“ und die konkretisierten UX-Abnahmen in `epics.md` hilfreich: Tastatur/Screenreader, nicht verdeckter Fokus, Statusankündigungen, 200-%-Vergrößerung, 320 CSS-Pixel ohne horizontales Scrollen, 44 × 44 CSS-Pixel große Touch-Ziele und reduzierte Bewegung. Diese Details müssen nicht erneut in der Spine ausgeschrieben werden. Der rote Button und der neue Bereich dürfen den bestehenden Prüfmaßstab nicht auf bloßes „zugänglich“ verkürzen.

## Erhaltene Anforderungen und bewusste Ablösungen

| Dimension | Abgleich |
| --- | --- |
| Finanzdaten und Kontentrennung | AD-3/4/7 erhalten flüchtigen Browserzustand, kontogebundene Zugriffe, erzwungene RLS, fehlenden Kontext als Verweigerung und atomare Bestätigungen. Der ausdrücklich beschlossene interne Kontext ist eine eng begrenzte Ergänzung; die HTTP-Regel bleibt JWT-gebunden. Die globale Jobermittlung liefert keine Finanzwerte oder Zugangsdaten. |
| Geld und Kalender | AD-5 erhält exakte EUR-Cent, sichere Grenzen, positive Ausgaben/Zielbeträge, fortlaufendes Budget, unverändertes Erfassungsdatum, Europe/Berlin intern und die Restbudgetformel. Negative Fortschritte und der auf 0–100 % begrenzte Balken ersetzen gezielt die alte Nichtnegativitätsregel. |
| Nutzererfahrung | AD-10 übernimmt drei Hauptbereiche, Monat als Startansicht, vollständige Ausgabenhistorie, bestätigte Aktualisierung der Monatsansicht, rote Abmeldung und entfernte systemseitige Zeitzonentexte. Die alte Zweiernavigation, gemeinsame Monats-/Ausgabenansicht und ausschließlich manuelle Fortschrittswirkung werden deshalb nicht als Widersprüche beanstandet. Keine Banküberweisung, kein Bankimport und kein Nutzer-Beitragsverlauf werden aus der Automatik abgeleitet. |
| Betrieb und Datenlebenszyklus | AD-6 und Deferred bewahren Einzelhost/Deutschland, privaten Datenbank-/API-Zugang, getrennte Geheimnisse, externe verschlüsselte Backups und getestete Wiederherstellung. Export, Löschung, Aufbewahrung, Kontowiederherstellung, konkrete Betriebsziele und Host-/Lastbewertung bleiben ausdrücklich vor echten Nutzerdaten beziehungsweise Produktion zu erledigen. Das Dokument erteilt keine Produktionsfreigabe. |
| Stand und Architekturhöhe | Der Text bezeichnet API v1 und `expense-budget` als Bestand und fünf Module, v2 sowie Automatik als Ziel. Die neun Done-Stories und optionalen Retrospektiven bleiben historische Nachweise; neue Arbeit wird nicht als fertig ausgegeben. Öffentliche Modulzugänge, äußere Koordination und gemeinsame Transaktionen entsprechen den bestätigten Entscheidungen. Klassen, konkrete Tabellenformen, Indizes, Batchgrößen und Storyabnahmen bleiben passend der Umsetzung überlassen. |

Die Synchronisierung von PRD/UX/Folgestories ist in Deferred mit dem Auslöser „vor Implementierungsplanung“ bereits benannt. AGENTS.md soll erst bei Umsetzung den veränderten Iststand erhalten. Die bewussten Abweichungen von älteren Quellen sind dadurch sichtbar, ohne historische Abnahmen rückwirkend umzuschreiben.
