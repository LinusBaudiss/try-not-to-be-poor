# PRD Quality Review — Try Not to Be Poor

Geprüft am 25.10.2026: `prd.md` und `addendum.md` im bestehenden PRD-Arbeitsordner. Maßstab: `.agents/skills/bmad-prd/assets/prd-validation-checklist.md`. Kalibrierung: private Brownfield-Anwendung mit nachfolgender UX-, Architektur- und Storyplanung, ausdrücklich ohne Produktionsfreigabe. Dies ist eine Dokumentprüfung, keine Implementierungsabnahme.

## Overall verdict

Das aktualisierte PRD ist als Produktgrundlage für die weitere Planung geeignet. Es trennt Bestandsnachweise und noch umzusetzenden Zielumfang, bewahrt die bestehenden FR-IDs und beschreibt die fachlich schwierigen Monatskorrekturen einschließlich Nullmonaten, Ziellöschung, manueller Gesamteingabe und Freigabegrenzen konkret. Keine kritischen, hohen, mittleren oder niedrigen Sachbefunde aus dieser Rubrikprüfung; die ausdrücklich offenen Datenlebenszyklus- und Betriebsentscheidungen bleiben vor echten Daten beziehungsweise Produktionsbetrieb zu klären.

## Decision-readiness — strong

§0 erklärt den Quellenrang und den Stand: „Die neue Navigation, Monatsautomatik und Zielarchitektur sind noch umzusetzen“. §8.4 macht den kontrollierten Übergang zur neuen API und die Sperre der neuen Datenwirkungen bis zur v1-Stilllegung zu verbindlichen Bedingungen. Damit kann nachgelagerte Planung arbeiten, ohne den Dokumentstatus als bereits erfolgte Umsetzung oder Betriebsfreigabe zu deuten.

Die Produktentscheidungen sind konkret: manuelle Ausgaben statt Bankimport, ein ausgewähltes Ziel statt Verteilung, manuell ersetzbarer Gesamtfortschritt mit späteren Differenzkorrekturen statt separater Unterkonten. §9 nennt für tatsächlich offene Fragen jeweils Linus und einen Zeitpunkt beziehungsweise Auslöser. Bereits beantwortete Altfragen werden ausdrücklich geschlossen.

### Findings

Keine.

## Substance over theater — strong

§1 benennt den privaten Personenkreis, Smartphone-Priorität, bewusste manuelle Erfassung und den erhofften statt zugesicherten finanziellen Nutzen. Das ist eine hinreichend konkrete Produktabsicht für diese Nutzung; Marktbehauptungen, künstliche Personas oder unverdiente Sparversprechen fehlen.

Die Qualitätsanforderungen sind produktspezifisch: §8.1 nennt Centgenauigkeit, Wertebereiche und Kalenderregeln; FR-11 nennt Prüfgrößen, Textvergrößerung und Bedienanforderungen; §8.3 verlangt beobachtbaren Verarbeitungsrückstand ohne sensible Protokollinhalte. Technische Ausgestaltung ist überwiegend im verlinkten Addendum und der bereits beschlossenen Architektur verortet.

### Findings

Keine.

## Strategic coherence — adequate

Die Funktionen tragen die gemeinsame Absicht, eigene Ausgaben, verbleibendes Monatsbudget und persönliche Sparziele überschaubar zu machen. Die Monatsautomatik erweitert diese Absicht nachvollziehbar; FR-14 erhält insbesondere die Grenze, dass eine Sparanrechnung keine Ausgabe ist und das Restbudget nicht verändert.

SM-1 und SM-2 prüfen den Überblick, SM-3 die korrekte Automatik, SM-4 die durchgängige Bedienbarkeit. SM-C1 verhindert, dass der Überblick durch so viel Erfassungsaufwand erkauft wird, dass die manuelle Nutzung aufgegeben wird. Die finanzielle Wirkung ist noch nicht operationalisiert; §7 und §9 benennen das ehrlich und planen die Klärung nach ein bis zwei Monaten privater Nutzung. Für diese private Erweiterung ist das angemessen und kein Planungsblocker.

### Findings

Keine.

## Done-ness clarity — strong

Jede FR enthält beobachtbares Verhalten. FR-8 verlangt nun explizit die Anzeige von Budget, laufender Monatsausgabensumme und Restbudget; fehlendes Budget und negativer Rest sind getrennt behandelt. FR-9 und FR-10 präzisieren Zielbearbeitung, Löschung, tatsächliche Betrags-/Prozentanzeige und den begrenzten Balken.

Die verhaltensbestimmenden Randfälle der Automatik sind im Haupttext greifbar: unveränderlicher Erstaktivierungsmonat (FR-14), historische Monatsendeauswahl und offene Nullmonate (FR-15), Differenz auf aktuellen Gesamtfortschritt samt Zahlenbeispielen (FR-16), Wiederholung und Konkurrenz ohne Teilwirkung (FR-17). FR-9 schließt eine blockierende Vorverarbeitung vor Ziellöschung aus; FR-10 erhält die manuelle Korrekturmöglichkeit bei blockiertem Nachhollauf. Die 17 verbindlichen Monatsabnahmefälle sind in §0 direkt referenziert und in SM-3 als Erfolgskriterium aufgenommen.

### Findings

Keine.

## Scope honesty — strong

§6 grenzt gemeinsame Finanzansichten, betriebliche Nutzung, Einnahmen, Bankimport, Überweisungen, weitere Währungen, Offline-Synchronisation und einen Nutzer-Beitragsverlauf ausdrücklich aus. Gleichzeitig verhindert der Satz „Monatsnachweise und sichtbare Vormerkungen bleiben erforderlich“, dass die Nicht-Ziele die notwendige Herkunftsführung versehentlich ausschließen.

Genau zwei übernommene Ableitungen sind inline als `[ASSUMPTION]` markiert und in §10 wiedergegeben. Die übrigen offenen Punkte stehen in §9 mit Verantwortung und Klärungsbedingung. Produktions- und Echtdatenvoraussetzungen werden nicht als zusätzliche ungeklärte Architekturgrundsatzfragen dargestellt. Keine stillschweigende Freigabe oder unbezeichnete Umfangskürzung festgestellt.

### Findings

Keine.

## Downstream usability — strong

Das Glossar trägt die für die neue Planung wichtigen Begriffe einschließlich Herkunftsmonat, Zielauswahl, Vormerkung und Monatsnachweis. FR-1 bis FR-11 bleiben erhalten; FR-12 bis FR-17 sind fortlaufend ergänzt. Die Anforderungen gruppieren zusammengehöriges Verhalten und verweisen bei Querwirkungen konkret auf andere FRs, etwa FR-6 auf FR-16 und FR-15 auf FR-9.

UJ-1 bleibt an Linus gebunden und stellt die geänderte Navigation als Fortschreibung der bestätigten Kernreise dar. SM-1, SM-2 und SM-C1 bleiben identifizierbar. Quellen, Bestandseinordnung, Monatsabnahmen, Architektur, Sprintstatus und noch anzupassende UX-Dokumente sind direkt erreichbar. Das Addendum benennt bereits beschlossene technische Mechanismen und überlässt konkrete API- und Implementierungsdetails den Folge-Stories.

### Findings

Keine.

## Shape fit — adequate

Die Gliederung passt zu einer privaten Anwendung mit einer fachlich anspruchsvollen Brownfield-Erweiterung. Eine zentrale namensgebundene Nutzerreise reicht hier aus, weil die zusätzlichen Automatikabläufe in FR-14 bis FR-17 und den verbindlich eingebundenen Abnahmen konkretisiert werden. Es werden keine zusätzlichen, unbestätigten Personas oder erfundenen eigenständigen Nutzerreisen benötigt.

Der Umfang liegt über einem sehr kurzen Hobby-PRD, ist aber durch Geldgenauigkeit, historische Korrekturen, Kontoisolation und Datenmigration begründet. Die technische Vertiefung steht in einem separaten Addendum; der Haupttext behält die aus Nutzersicht wirksamen Übergangsgrenzen. Keine zusätzliche Sektion ist als bloßes Template-Mobiliar erkennbar.

### Findings

Keine.

## Mechanical notes

- FR-1 bis FR-17 sind eindeutig und fortlaufend; die referenzierten FR-IDs existieren.
- UJ-1 hat Linus als Namensperson; SM-1 bis SM-4 und SM-C1 sind eindeutig.
- Beide inline markierten Annahmen sind im Annahmenindex enthalten; der Index führt keine zusätzliche Annahme ein.
- Keine unterbrochene lokale PRD-/Addendum-Verknüpfung festgestellt.
- Der geprüfte Entwurf trägt `status: draft`; die Umstellung auf `final` gehört zur nachfolgenden Finalisierung und ist kein Produktbefund.
- Die offene Messweise zur finanziellen Wirkung ist für den privaten Einsatz angemessen ausgewiesen. Das PRD behauptet keine quantifizierte Sparwirkung.
