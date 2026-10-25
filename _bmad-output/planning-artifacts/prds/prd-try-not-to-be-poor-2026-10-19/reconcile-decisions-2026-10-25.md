# Entscheidungsabgleich — PRD-Aktualisierung vom 25.10.2026

**Geprüft:** Sämtliche Einträge des bestehenden `.memlog.md` bis einschließlich der Entscheidung zu Deferred-Ownern und Klärungsbedingungen („UX und neue Folge-Stories sind vor Umsetzung abzugleichen“); PRD-Entwurf mit Stand 25.10.2026 und `addendum.md`.

**Ergebnis:** Die historischen Produktentscheidungen sind erhalten, durch die ausdrücklich beauftragten neuen Quellen gezielt ersetzt oder mit Verantwortung und Klärungsbedingung zurückgestellt. Kein verlorener Produktinhalt und keine zusätzliche Freigabelücke festgestellt. Workflow-Ereignisse und frühere redaktionelle Eingriffe bleiben Auditgeschichte; sie müssen nicht als Produktanforderungen wiederholt werden. Die noch ausstehende Finalisierung ist kein Sachentscheid.

## Historische Entscheidungen und Änderungen

| Memlog-Eintrag oder Gruppe | Behandlung | Fundstelle im aktuellen PRD oder Addendum |
| --- | --- | --- |
| PRD-Erstellung aus finalem Briefing; Nutzer bestätigte das Briefing als ausreichende damalige Basis | Historische Basis bleibt gültig; neue Quellen bestimmen das ausdrücklich beauftragte Update. Kein Widerspruch zur früheren Aussage, damals seien keine weiteren Eingaben vorhanden gewesen. | PRD §0 benennt Fassung 19.10. und die heutigen Änderungssignale. Private Produktabsicht aus dem Briefing bleibt in §1–§3 erhalten. |
| Persönlicher Einsatz im kleinen Kreis; damaliger Coaching Path | Privater Personenkreis bleibt. Coaching Path ist Ablaufgeschichte und keine dauerhaft vorgeschriebene Produkteigenschaft oder neue Nutzerrückfrage. | PRD §1 und §3; Arbeitsmodus als historisches Ereignis beiseitegestellt. |
| Nutzerreise: öffnen, anmelden, Name/Betrag einer oder mehrerer Ausgaben erfassen, Restbudget und gesamte Historie sehen; UJ-1 bestätigt | Kernaufgabe und namensgebundene UJ-1 erhalten. Die Quellen vom 25.10. ersetzen gezielt die bisher gemeinsame Ansicht durch Navigation zwischen Ausgaben und Monat. | PRD §3.2 UJ-1, FR-4, FR-5, FR-8, FR-12; §0 kennzeichnet die gezielte Fortschreibung. |
| Link erhalten, registrieren, dann anmelden; jede Person mit Link darf registrieren, keine individuellen Einladungen | Erhalten. Gültiger geteilter Link bleibt Voraussetzung; keine personenbezogene Einladungsliste wird eingeführt. Lebensdauer und Sperrung sind inzwischen konkretisiert. | PRD FR-1: privater Kreis durch Linkweitergabe, 30 Tage, geschütztes Ersetzen/Sperren. |
| Sparfortschritt durch Ersetzen des aktuellen kumulierten Gesamtbetrags; keine einzelnen Beiträge und kein Beitragsverlauf | Manuelle Gesamteingabe bleibt unter FR-10 erhalten. Ausschließlichkeit manueller Fortschrittsänderung durch neue Monatsautomatik gezielt ersetzt. Technische Monatsnachweise sind kein Nutzer-Beitragsverlauf. | PRD FR-10, FR-14–FR-17, Glossar Fortschritt/Monatsnachweis, §6; Addendum „Konsistenz der Monatsautomatik“. |
| Datum jeder Ausgabe ist der Erfassungstag; kein abweichendes Datum wählbar | Erhalten und um beim Bearbeiten unveränderliches Datum konkretisiert. | PRD Glossar Erfassungsdatum, FR-4, FR-6, §8.1. |
| Alle Beträge in Euro | Erhalten; centgenaue Wertebereiche ergänzt. | PRD §2, FR-4/FR-7/FR-9, §8.1. |
| Jedes Sparziel hat eigenen frei vergebenen Namen | Erhalten. | PRD Glossar Sparziel und FR-9. |
| Ausgabenname/-betrag bearbeiten, Ausgabe löschen | Erhalten. Historische Auswirkungen auf Monatsautomatik ergänzen die Wirkung; Eigentümer und Datum bleiben unverändert. | PRD FR-6 und FR-16. |
| Monatsbudget gilt unverändert fort, bis die Person es manuell ändert | Erhalten. Heutige Regeln schließen rückwirkende Änderung abgeschlossener Budgetstände aus. | PRD Glossar Monatsbudget und FR-7. |
| Monat und Erfassungsdatum verwenden Europe/Berlin | Erhalten. Keine UI-Erklärungen dazu zeigen ist eine zusätzliche Darstellungsregel, keine Änderung der Fachsemantik. | PRD FR-4/FR-8, FR-13, §8.1. |
| Historischer Memlog-Audit abgeschlossen; frühere Rubrik-/Datenschutzprüfung und Finalisierungen | Als historische Prüfungsergebnisse beiseitegestellt. Keine Behauptung, die neue Erweiterung sei damit bereits abgenommen oder implementiert. | PRD §0, §8.4 und §9 unterscheiden bestehende Done-Nachweise, neuen Zielumfang und Produktionsfreigabe. |
| FR-5 konkretisiert kontoweite Historie über alle Monate samt Erfassungsdatum | Vollständig erhalten; lediglich der Navigationsort folgt der neuen SPEC. | PRD FR-5 und SM-1. |
| FR-11 verlangt konkrete Geräteprüfgrößen und Kernaufgaben durch UX; damalige Frage noch offen | Offenheit durch bestehende konkrete UX-/Abnahmegrundlagen ersetzt. Neue Automatikzustände werden ausdrücklich in die Prüfung einbezogen. | PRD FR-11 mit vier CSS-Prüfgrößen, 200 % Textgröße/Reflow und Interaktionsmaßen; SM-4 benennt Kernaufgaben. §9 verlangt weiteren UX-Abgleich vor Umsetzung. |
| Budgetänderung sofort im aktuellen und in Folgemonaten war Annahme | Als inzwischen bestätigte Regel übernommen; keine neue ungesicherte Annahme. | PRD FR-7 und letzter Absatz §9. |
| Restbudget kann negativ sein; Darstellung negativer Restbeträge noch offen | Rechnerische Eigenschaft erhalten, Darstellung inzwischen entschieden: tatsächlicher Betrag plus Hinweis. | PRD FR-8 und §8.1; letzter Absatz §9 markiert die Schließung. |
| Bankimport kein v1-Umfang, später erneut prüfen | Erhalten und mit Owner/Revisit-Bedingung zurückgestellt. | PRD §6 und §9: Linus, bei Planung einer späteren Version. |
| Export, Löschung, Aufbewahrung, Kontowiederherstellung vor echten Nutzerdaten klären | Weiter offen; erweiterte Automatik macht Monatsnachweise ausdrücklich zum Bestandteil der Aufbewahrungsentscheidung. | PRD §9: Linus, vor echten Nutzerdaten/Produktionsfreigabe; §8.3 und Addendum „Betriebsgrenze“. |
| Finanziellen Effekt nach ein bis zwei Monaten prüfen; Monatsvergleich noch offen | Erhalten; keine unbelegte Erfolgsgarantie oder neue Euro-/Prozentvorgabe. | PRD §1, §7 und §9: Linus, nach ein bis zwei Monaten privater Nutzung. |
| Registrierungslink Gültigkeit/Erneuerung/Widerruf damals offen | Durch heutige Bestandsabnahme und Zielarchitektur konkretisiert; historische Offenheit muss nicht weitergeführt werden. | PRD FR-1 und letzter Absatz §9. |
| Betragsbereiche/Genauigkeit/Fortschritt über Ziel damals offen | Durch neue Quellen konkretisiert: exakte Centgrenzen, positive bzw. nichtnegative Größen, signierter Rest/Fortschritt, tatsächliche Betrags-/Prozentanzeige mit begrenztem Balken. Ableitung zur signierten manuellen Gesamteingabe bleibt markiert. | PRD FR-10, §8.1 und §10. |
| Sparziele bearbeiten/löschen damals offen | Durch heutige Abnahmen und Monatsregeln beantwortet; unveränderter Fortschritt bei Zielbearbeitung, Datum entfernen und Löschbestätigung enthalten. | PRD FR-9, FR-10 und letzter Absatz §9. |
| Frühe Umfangsübersicht, zusammengeführte Nicht-Ziele, Dopplungen entfernt | Redaktionelle Absicht erhalten; alte exakte Formulierungen sind keine eigenständigen Fachentscheidungen. | PRD §2 früh im Dokument und konsolidierter §6. |
| SM-C1 gemeinsam mit SM-1 während privater Nutzung beobachten | Erhalten. | PRD §7 SM-C1. |

## Entscheidungen und Ableitungen dieses Updates

| Neuer Memlog-Eintrag | Abdeckung |
| --- | --- |
| Nutzerauftrag 25.10.: vorhandenes PRD anhand SPEC und Architecture Spine aktualisieren; stabile IDs fortführen | PRD Metadaten und §0; bestehendes Dokument am selben Ort weitergeführt. |
| Override: Ausgabenerfassung/Historie getrennt von Monatsübersicht; FR-10 manuelle Gesamteingabe plus signierte automatische Wirkungen; kein Nutzer-Beitragsverlauf, aber Monatsnachweise/Vormerkungen | PRD Glossar, FR-5/FR-10/FR-12 und FR-14–FR-17, §6; technische Bewahrung im Addendum. |
| Quellenrang: bestätigte neue Regeln ersetzen gezielt ältere PRD-Aussagen, sonst gelten Produktentscheidungen und konkretisierte Bestandsabnahmen fort; Ziel nicht als implementiert/freigegeben ausgeben | PRD §0, §8.4 und §9; Addendum verweist auf beschlossene, noch umzusetzende Architektur. |
| Zwei SPEC-Ableitungen beibehalten: vollständige Ausgabenverwaltung im Tab Ausgaben; signierter Bereich auch manuell | Inline bei FR-12 und FR-10 sowie vollständig im Annahmenindex §10. Kein zusätzliches Architekturhindernis behauptet. |
| Nullmonate mit Herkunft/historischer Bindung, reine Differenzkorrektur auf aktuellen Gesamtfortschritt, Ziellöschung verbraucht unverarbeitete Bindungen ohne vorgezogenen Nachhollauf, manuelle Gesamteingabe bleibt bei blockiertem Nachholen möglich | PRD Glossar Vormerkung/Monatsnachweis; FR-15 Nullmonate, FR-16 Differenzformel, FR-9 Löschung ohne Nachhollauf, FR-10 manuelle Eingabe bei Betragsblockade; Addendum „Konsistenz der Monatsautomatik“. |
| PRD-Entwurf konkretisiert FR-1–FR-11, ergänzt FR-12–FR-17, erweitert Glossar/Erfolgsabnahmen, ordnet technische Umsetzung dem Addendum zu und schließt beantwortete Altfragen | PRD §0, §4–§5, §7 und letzter Absatz §9; Addendum verweist auf beschlossene Architektur statt neue technische Entscheidungen zu treffen. |
| Datenlebenszyklus/Betrieb weiter bei Linus vor echten Daten bzw. Produktionsbetrieb; Finanzwirkung nach 1–2 Monaten; Bankimport bei späterer Version; API-v2/Jobautorisierung nicht wieder öffnen; UX/Folge-Stories vor Umsetzung abgleichen | PRD §9 enthält alle Owner und Bedingungen. §8.3–§8.4 und Addendum erhalten die beschlossenen Sicherheits-/Freigabegrenzen. |

## Stabilität und verbleibende Punkte

- **FR-1–FR-11:** IDs sind eindeutig und behalten ihre ursprünglichen Fähigkeiten. FR-1 erweitert Zugang konkret; FR-9 konkretisiert inzwischen beschlossene Zielbearbeitung/-löschung; FR-10 erweitert den manuellen Gesamtfortschritt um die neue Automatik, ohne die manuelle Fähigkeit zu entfernen. Neue Fähigkeiten sind unter FR-12–FR-17 ergänzt.
- **UJ-1:** Namensperson, Erfassungsaufgabe und Nutzenmoment bleiben erhalten; die neue Navigation ist ausdrücklich als Konkretisierung benannt. Eine unbestätigte zusätzliche Persona oder erfundene eigenständige Nutzerreise wurde nicht eingeführt.
- **SM-1, SM-2, SM-C1:** Identitäten bleiben erhalten; SM-1 berücksichtigt den neuen Navigationsort, SM-2 die signierten Werte. SM-3/SM-4 ergänzen abnehmbare neue Ergebnisse.
- **Qualitative Produktabsicht:** Privater Kreis, Smartphone-Priorität mit Rechnernutzung, manuelle Erfassung, Transparenz, provokativer Name als persönliche Orientierung und erhoffter statt zugesicherter Spareffekt stehen weiter in §1–§3.
- **Offen mit Verantwortung/Bedingung:** Datenlebenszyklus und Betriebsfreigabe, finanzielle Wirkungsmessung sowie spätere Bankimportentscheidung sind in §9 zugeordnet. Die zwei ausdrücklich markierten SPEC-Ableitungen werden unverändert übernommen. Weitere verlorene oder stillschweigend verworfene Sachentscheidungen wurden nicht gefunden.
