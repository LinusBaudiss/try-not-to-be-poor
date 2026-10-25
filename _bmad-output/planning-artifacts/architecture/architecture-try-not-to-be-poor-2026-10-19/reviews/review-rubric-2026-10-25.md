# Reviewer Gate — Rubric Walker

Stand: 2026-10-25. Gegenstand ist die aktuelle Entwurfsfassung von `ARCHITECTURE-SPINE.md` mit AD-1 bis AD-10. Maßstab ist die Good-Spine-Checkliste aus `.agents/skills/bmad-architecture/references/reviewer-gate.md`. Die Prüfung ist unabhängig von der Bearbeitung der Hauptdatei; Hauptdatei und Memlog wurden nicht verändert.

## Verdict

**PASS — keine priorisierten Befunde.** Die Spine schließt die erkennbaren, für die nachfolgende Umsetzung gefährlichen Divergenzpunkte. Es wurde kein Paar fachlich inkompatibler Implementierungen gefunden, das die vorhandenen Regeln zugleich zulassen. Die bereits eingearbeiteten Korrekturen zum Zugangsvertrag, UX-Prüfmaßstab, Nullfall und zur Ziellöschung wurden berücksichtigt.

Der deterministische Lint wurde für diese Fassung erneut ausgeführt: `ok: true`, `total_findings: 0`. Der erste Aufruf scheiterte lediglich am nicht beschreibbaren Standardcache; der erneute Aufruf mit Cache unter `/tmp` war erfolgreich.

## Prüfung der Checkliste

| Prüfpunkt | Ergebnis und maßgebliche Bindung |
| --- | --- |
| Echte Divergenzpunkte der nächsttieferen Ebene | AD-1 regelt Datenbesitz und Importgrenzen, AD-2/10 den Vertragswechsel, AD-4 die beiden Vertrauenskontexte, AD-7 Snapshot/Serialisierung und AD-8/9 die dauerhafte Monatswirkung. Diese Entscheidungen verhindern unterschiedliche Lösungen zwischen Modul-, Frontend-, Job- und Migrationsarbeit. |
| Durchsetzbare Regeln | Abhängigkeiten und Schemaeigentum sind prüfbar. Rollenrechte, erzwungene RLS, gemeinsame Verbindung, Sperrschlüssel, Isolation, Nachweiseindeutigkeit und atomare Wirkungen können in PostgreSQL-Integrationstests nachgewiesen werden. Browser- und Vertragsprüfungen decken die versions- und sitzungsübergreifenden Grenzen ab. |
| Keine kritische Entscheidung nur unter Deferred | Konkrete DTOs und Pfade bleiben offen, dürfen aber erst im gemeinsamen v2-Vertrag festgelegt werden; parallele Verbraucherimplementierung ist vorher ausdrücklich ausgeschlossen. Datenbesitz, Versionspolitik, Zustandsbedeutung, Atomarität, Rollengrenzen und Freigabereihenfolge werden nicht an getrennte Stories delegiert. Betriebs- und Datenlebenszyklusdetails haben ausdrücklich benannte Gates vor echten Nutzerdaten beziehungsweise Produktion. |
| Alle strukturellen Dimensionen | Client/Server, Modulabhängigkeiten, Persistenz und Konsistenz, Identität und RLS, Hintergrundverarbeitung, Migration/Versionierung/Rücknahme, Browserzustand, Deployment/Umgebungen, Geheimnisse, Ausfallbehandlung und Beobachtbarkeit sind entschieden oder mit passendem Auslöser zurückgestellt. Der Einzelhost und Deutschland als betrieblicher Rahmen bleiben sichtbar. |
| Spec-Abdeckung | CAP-1 bis CAP-3 sind in AD-5/10 beziehungsweise AD-3/10 abgedeckt. CAP-4 reicht von Aktivierung und historischer Budget-/Zielbindung über Vormerkung und Differenzkorrektur bis zu Wiederholung, Ausfall und Grenzüberschreitung. Die Capability-Tabelle benennt die zuständigen Bereiche und ADs. |
| Brownfield und Quellenrangfolge | Bestand und Ziel werden ausdrücklich getrennt. Die bewussten Ablösungen entsprechen Spec und Nutzerentscheidungen. Authentifizierung bleibt bei 10 Minuten, `SameSite=Strict` und Refresh-Familienwiderruf. Sonstige Zugangsabnahmen sowie die konkretisierten UX-Abnahmen bleiben ausdrücklich verbindlich. Abgeschlossene Stories werden nicht rückwirkend geändert und neue Funktionen nicht als umgesetzt ausgegeben. |
| Technologien und Eignung | Es wird keine neue Stackversion festgelegt. Die Pins sind als Repositorybestand vom 2026-10-25 ausgewiesen; die älteren Produktionswerkzeuge sind als Planungsseed mit Prüfung vor dem Rollout gekennzeichnet. Die neu benötigten Transaktions-, Scheduler- und RLS-Semantiken sind mit primären Quellen dokumentiert und im Memlog als geprüft verzeichnet. Diese Rubrik bestätigt die Abgrenzung zwischen Bestand und neuer Technologieentscheidung; sie behauptet keine erneute unabhängige Ermittlung sämtlicher neuester Releases. |
| Angemessene Kürze und Abstraktion | Zehn Entscheidungen auf Initiativebene sind für fünf getrennte Module, vollständige API-Ablösung und finanzwirksame Automatik angemessen. Die ausführlicheren Regeln in AD-4/7/8/9 fixieren sicherheits- und korrektheitsrelevante Grenzen. Klassen, konkrete Tabellenrepräsentation, Indizes, Batchgrößen und Wiederholungsintervalle bleiben der Umsetzung. Ein zusätzliches Lösungsdesign oder eine vollständige Schema-/Endpunktliste ist nicht erforderlich. |

## Konkrete Divergenzversuche

Die folgenden Gegenproben ergeben **keine Befunde**, weil jeweils mindestens eine der inkompatiblen Varianten bereits ausgeschlossen ist:

| Denkbare getrennte Implementierungen | Warum die Spine die Kollision verhindert |
| --- | --- |
| Die Monatsansicht liest Budget und Ausgaben nacheinander unter READ COMMITTED; ein anderes Modul erwartet einen einheitlichen Snapshot. | AD-7 verlangt für zusammengesetzte Leseansichten dieselbe read-only REPEATABLE-READ-Verbindung. Der gemischte Snapshot ist nicht zulässig. |
| Das Überschussmodul schreibt direkt in die Sparzieltabelle; das Sparzielmodul führt Fortschrittsänderungen über seine eigene Anwendungsschnittstelle aus. | AD-1 verbietet fremde Tabellen-/Repositoryzugriffe und Geschwisterimporte; die äußere Anwendungsschicht koordiniert öffentliche Modulzugänge. |
| Der Job nutzt eine zweite Verbindung mit eigenem Commit; die Ausgabenänderung bestätigt ihre Transaktion unabhängig davon. | AD-7 verlangt denselben äußeren Transaktionskontext, dieselbe physische Verbindung und gemeinsamen Rollback. AD-9 bindet historische Korrektur und Fortschrittsdifferenz an diese Transaktion. |
| Der verspätete Abschluss verwendet das heute ausgewählte Ziel; die Zielverwaltung erwartet die Auswahl am Ende des Herkunftsmonats. | AD-8 bindet die historisch monatswirksame Auswahl. Ein Wechsel arbeitet zuvor fällige Monate ab und übernimmt danach nur offene Vormerkungen. |
| Beim Löschen wird ein noch nicht abgeschlossener historischer Zielmonat später wieder vorgemerkt; eine andere Implementierung betrachtet seine Wirkung als verbraucht. | AD-8 verlangt die dauerhafte verbrauchte Zielbindung auch für noch unbearbeitete abgeschlossene Monate und erlaubt dafür einen Löschmarker zusammen mit erhaltener Auswahlhistorie. Ein vorgelagerter finanzieller Nachhollauf ist keine Löschvoraussetzung. |
| Ein Nullüberschuss ohne Ziel erhält bei späterer Zielauswahl keine Bindung; eine spätere positive Korrektur wird beliebig einem heutigen Ziel zugeordnet. | Die ausdrücklich technische Nullfallpräzisierung in AD-8 bindet auch offene Nullnachweise mit Budget bei Übernahme. Die Herkunftszuordnung für spätere Korrekturen ist damit festgelegt. |
| V2 schreibt negative Werte, während ein alter v1-Client noch Sparzielantworten erhält. | AD-10 sperrt Automatik und negative manuelle Fortschritte serverseitig bis nach v1-Stilllegung und Beendigung laufender v1-Mutationen. Der Freigabeablauf ist auch für v2 verbindlich. |

## Einordnung offener Arbeiten

Der noch fehlende v2-Vertrag, konkrete Implementierungsstories und die Synchronisierung von PRD/UX sind benannte nächste Arbeitsprodukte. Sie stellen bei Einhaltung der angegebenen Reihenfolge keine offene Architekturentscheidung zwischen unabhängigen Einheiten dar. Der Entwurfsstatus wird durch dieses Review nicht zur Umsetzungs- oder Produktionsfreigabe.
