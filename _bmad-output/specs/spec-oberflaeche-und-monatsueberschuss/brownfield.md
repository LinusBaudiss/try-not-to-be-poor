# Bestand, Abnahmen und Folgeänderungen

Stand: 2026-10-25. Diese Datei ergänzt die Änderungsspezifikation; die beschriebenen neuen Funktionen sind noch nicht umgesetzt. Die ursprünglichen Q-1/Q-2 sind durch Linus’ Entscheidungen beantwortet; die verbindlichen Fachregeln stehen in `monatsueberschuesse.md`.

## Geprüfter Iststand

| Bereich | Bestand und Beleg | Gewünschte Änderung |
| --- | --- | --- |
| Zeitzonenhinweise | `frontend/src/app/month/month.ts`: Budgettext „in Berlin“; `month-summary.ts`: „Kalender in Berlin“; `expenses.ts`: Datum „automatisch in Berlin“. | Systemseitige Zeitzonenhinweise entfernen, interne Kalendersemantik erhalten. Beispielsweise „Dein Budget gilt für den laufenden Kalendermonat und danach.“ und „Das Datum wird automatisch gesetzt.“ |
| Hauptbereiche | `frontend/src/app/app.ts` und `app.routes.ts`: „Monat“ und „Sparziele“. `month.ts` enthält `<app-expenses>` neben Budget und Monatsübersicht. | Eigener Tab „Ausgaben“; Monatsansicht auf Budget und Übersicht konzentrieren. Die vollständige Ausgabenverwaltung zieht gemäß Annahme mit. |
| Abmelden | `month.ts` und `savings-goals/savings-goals.ts`: Button mit `secondary`; `frontend/src/styles.css` verwendet dafür die grüne Standardfarbe. | Abmelden in allen angemeldeten Hauptbereichen rot gestalten. Der vorhandene Farbwert `--error: #842D2D` ist ein möglicher Gestaltungsbaustein; die genaue Ausprägung folgt dem Design. |
| Sparfortschritt | PRD §5.4/FR-10, Story 2.2 und `SavingsGoalService.progress`/`SavingsGoalRepository.progress`: Der eingegebene Betrag ersetzt `progress_cents`. OpenAPI: `PUT /savings-goals/{id}/progress`. | Automatischen Monatsüberschuss und Vormerkungen ergänzen; historische Korrekturen und manuelle Bearbeitung erhalten. |
| Fortschrittsbereich | OpenAPI-Felder `progressCents`, `SavingsGoalService`, `frontend/src/app/shared/savings-progress.ts` und V6-Constraint erlauben bislang nur 0 bis Maximum. | Vorzeichenbehafteten Bereich ±9.007.199.254.740.991 Cent einführen. Negative Beträge und Prozentwerte anzeigen, nur den Balken auf 0 bis 100 % begrenzen. |
| Monatsabschluss und Vormerkungen | Bisher kein Ablauf zur automatischen Anrechnung, keine Aktivierung, Zielauswahl oder Vormerkung. Budget-/Monatsabfragen und Fortschrittsänderungen sind getrennt. | Ab Aktivierungsmonat monatlich zuordnen oder vormerken; bei Zielauswahl offene Vormerkungen automatisch übernehmen. Wiederholungsschutz, Nachholen und historische Zuordnung erhalten. |

Der bestehende Sprintstatus führt alle neun Stories aus Epic 1 und Epic 2 als `done`. Die Änderung ist neuer Umfang; bestehende Fertigmeldungen und Abnahmen bleiben historische Nachweise. Die bisherige Nichtnegativitätsregel ist durch die neue Nutzerentscheidung für den gewünschten Fortschrittsbereich ausdrücklich ersetzt.

## Ergänzende Oberflächenabnahmen

| Fall | Erwartetes Ergebnis |
| --- | --- |
| Texte in Monat, Ausgaben und Sparzielen | Keine systemseitigen Zeitzonenerläuterungen, einschließlich Hilfs- und Screenreadertexten. Ein selbst vergebener Ausgabenname „Berlin-Fahrt“ bleibt erhalten. |
| Monatsgrenze | Weiterhin dieselben Monatszuordnungen und Erfassungsdaten nach `Europe/Berlin`, auch bei abweichender Gerätezeitzone und Sommer-/Winterzeit. |
| Navigation | „Monat“, „Ausgaben“, „Sparziele“ sind per Touch und Tastatur erreichbar. Monat bleibt Startansicht. Ausgabenerfassung erfolgt im eigenen Bereich. |
| Ausgabenänderung | Nach bestätigter Mutation und Wechsel zu „Monat“ sind Budget, laufende Ausgabensumme und Rest konsistent. Historie umfasst weiterhin alle Monate; Fremddaten erscheinen nicht. |
| Abmelden | Roter Button, lesbarer Text, sichtbarer Fokus und bestehender Sitzungs-Cleanup in allen Hauptbereichen. |
| Aktivierung ohne Ziel | Aktivierung ist möglich; ein fehlendes Ziel wird verständlich erklärt, vorgemerkte Überschüsse bleiben erkennbar. |
| Zielauswahl und Vormerkung | Offene Vormerkungen werden nach bestätigter Zielauswahl genau einmal übernommen und der tatsächlich gespeicherte Fortschritt angezeigt. |
| Negativer Fortschritt | Tatsächlichen Betrag und Prozentwert mit Minuszeichen zeigen, Balken bei 0 %. Manuelle Eingabe und Validierung unterstützen den neuen Wertebereich gemäß Annahme. |
| Ziellöschung | Bestehender Bestätigungsdialog benennt den Verlust des Fortschritts und bei ausgewähltem Ziel die anschließende Vormerkung weiterer Überschüsse. |

Die detaillierten Monats-, Zuordnungs- und Korrekturabnahmen stehen in `monatsueberschuesse.md`.

## Betroffene Planung und Architektur

| Artefakt | Vorher | Erforderliche Folgeänderung |
| --- | --- | --- |
| PRD §4 „Monatsübersicht“, §5.2 / FR-4 bis FR-6 | Monatsübersicht vereint Restbudget und Ausgabenliste. | Separaten Ausgabenbereich und Ablauf vom Erfassen zur Budgetprüfung beschreiben. |
| PRD §5.4 / FR-10 | Fortschritt beruht auf manuell gepflegtem Gesamtbetrag, ohne einzelne Beiträge. | Aktivierung, Anrechnung/Vormerkung, Zielauswahl, historische Korrektur und negativen Fortschritt ergänzen; manuelle Bearbeitung erhalten. Kein Nutzer-Beitragsverlauf allein daraus ableiten. |
| EXPERIENCE: Information Architecture, Component Patterns, Flows 1/2 | Zwei Hauptbereiche; Monatsübersicht enthält Erfassung und Liste; Fortschritt nur manuell. | Drei Hauptbereiche, Texte ohne Zeitzonenhinweis, Automatikaktivierung, Zielauswahl, sichtbare Vormerkung und negative Fortschrittsanzeige beschreiben. |
| DESIGN: Colors, Components, Layout | Grüne Standardaktionen; Budget, Eingabe und Liste als gemeinsame Anordnung. | Rote Abmeldeaktion samt zugänglichen Zuständen, getrennte Ausgabenansicht und verständliche Vormerkungs-/Negativdarstellung beschreiben. |
| Epics: Geldkonventionen, Stories 1.3–1.6, 2.1–2.3; neue Folgearbeit | Bisherige Oberfläche, Zweiernavigation und nichtnegativer manuell gepflegter Fortschritt. | Neue Folge-Stories aus der Änderung ableiten; neue Abnahmen für negative Werte und Ziel-Lebenszyklus ergänzen. Historische Abnahmen nicht rückwirkend als falsch markieren. |
| Architektur AD-1 / Modulzuständigkeit | `expense-budget` und `savings-goals` ändern nur eigene Daten. | Monatsüberschuss und Vormerkung über öffentliche Anwendungsfunktionen koordinieren; keine direkten Schreibzugriffe in fremde Modultabellen. |
| Architektur AD-4 / Eigentümerkontext | `user_id` und transaktionslokales `app.user_id` stammen ausschließlich aus verifiziertem JWT-`sub`. | Vertrauenswürdigen internen Ausführungskontext ohne aktive Sitzung ausdrücklich festlegen. Client darf keine fremden Eigentümer bestimmen; Laufzeitrolle darf RLS nicht umgehen. |
| Architektur AD-5 / Capability-Zuordnung | Fortschrittsersatz ohne Beitragsverlauf; Ausgabenansicht der Monatsübersicht zugeordnet. | Aktivierungsmonat, monatliche Vormerkungen, historische Zielbindung, Korrekturdifferenzen, signierten Fortschritt und Zusammenspiel mit manuellen Änderungen definieren; Ausgabenansicht separat zuordnen. |
| OpenAPI / Kompatibilität | Fortschrittsantwort und -anfrage begrenzen `progressCents` bislang auf nichtnegative Werte. | Negative Antwortwerte ändern den bisherigen Vertrag. Vor Umsetzung Kompatibilitäts-/Versionierungsweg gemäß AD-2 festlegen; die Aufhebung von `minimum: 0` nicht ungeprüft als kompatible v1-Erweiterung behandeln. |
| Persistenz / Backend | V6-Constraint und Servicevalidierung erzwingen nichtnegative Fortschritte; kein Monats-/Vormerkungsnachweis. | Neue Flyway-Migration für vorzeichenbehafteten Bereich und benötigte Nachweise; bestehende Migrationen nicht ändern. Kontentrennung, atomare Zuordnung und sichere Summen erhalten. |
| Frontend / Prüfungen | Validierung und Fortschrittsberechnung gehen von nichtnegativen Werten aus. | Geldparser, Validierung, Anzeigelogik und Tests an signierten Fortschritt anpassen; deutsche Beträge und exakte Prozentrechnung erhalten. |
| AGENTS.md / Projektkontext | Der verwaltete Block nennt Fortschritt ab null und ausschließlich JWT-abgeleitete Kontexte. | Bei Umsetzung die neuen Fortschrittsregeln und den festgelegten internen Ausführungskontext nachführen. Bestehende Sicherheitsregeln nicht pauschal aufheben. |

Vor Implementierung bleiben technische Entscheidungen zur internen Autorisierung/RLS und API-Evolution. Es gibt keine offenen Produktfragen aus Q-1/Q-2. Es wurden keine neuen Sprint-Story-IDs oder Fertigmeldungen vergeben.
