---
title: 'Story 3.2: Browserzugang über v2 und rotes Abmelden'
type: 'feature'
created: '2026-10-26'
status: 'done'
route: 'dispatch'
story_key: '3-2-in-der-oberfläche-den-neuen-zugang-und-rotes-abmelden-nutzen'
review_loop_iteration: 0
baseline_commit: '5cd387db54cc94aa35e7af02ffd17b1a4480a9f1'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/epics.md'
---

<frozen-after-approval reason="Nutzerabsicht; Änderungen nur nach erneuter Abstimmung">

## Intent

**Problem:** Der Browser verwendet noch v1-Zugang und getrennte grüne Abmeldebuttons.

**Approach:** Alle sechs Zugangsoperationen einschließlich Identitätsprüfung auf generiertes v2 umstellen und eine gemeinsame rote Abmeldeaktion verwenden. Maßgeblich sind Story 3.2/AC-1–AC-9.

## Boundaries & Constraints

**Always:** HTTPS derselben Herkunft, CSRF/Origin, sichere Cookies, flüchtige persönliche Daten, serverzeitgestützte monotone Laufzeit, Generationsgrenzen und Commitbestätigung erhalten. Cookie-Sperre `tnbp-session-cookie` und BroadcastChannel `tnbp-session` bleiben kompatibel. Unbestätigte Rotation niemals automatisch wiederholen. Deutsche Systemtexte ohne Zeitzonenerläuterungen.

**Never:** Finanzrouten umstellen, dritten Bereich ergänzen, Verträge/Backend/Datenbank ändern, generierte Dateien manuell bearbeiten, v1 stilllegen, negative Fortschritte oder Automatik freigeben.

## I/O & Edge-Case Matrix

| Zustand/Eingabe | Erwartung und Fehlerbehandlung |
| --- | --- |
| Gültiger Link/Zugang | Registrierung erst bestätigt erfolgreich; Anmeldung öffnet frischen Monat. Geheimnis sofort aus URL entfernen. |
| Fehler/offline/unbestätigte Registrierung | Neutrale deutsche Feld-/Statusmeldungen; Eingaben nur im offenen Formular, keine Doppelsendung. Ungewissen Ausgang erklären und Anmeldung anbieten, keine automatische Neuanlage. |
| Gleichzeitiger Refresh/mehrere Tabs | Laufenden Refresh teilen; Cookie-Mutationen originweit serialisieren, auch gegenüber v1-Tabs. |
| Abmeldung/Ablauf/Abbruch/Kontowechsel | Zugang, Finanzdaten und Entwürfe verwerfen; Anmeldung anzeigen, Tabs ohne persönliche Inhalte benachrichtigen; späte Antworten bleiben wirkungslos. |
| Widerruf unbestätigt | Lokal sofort schließen; unbestätigten Serverwiderruf nennen, ausdrücklichen Retry ohne Doppelsenden anbieten. |

</frozen-after-approval>

## Code Map

- `frontend/src/app/session/session.ts`: Queue, Generation, monotone Annahme und Guard wiederverwenden; noch v1-Aufrufe, keine Logout-Doppelsendesperre.
- `frontend/src/app/api/v2/api/`: vorhandene `AccessService`/`SessionsService` und v2-Modelle verwenden; getrenntes `BASE_PATH`.
- `frontend/src/app/month/month.ts`, `frontend/src/app/savings-goals/savings-goals.ts`: Identität/Abmeldung; Zustandsverwerfen erhalten.
- `frontend/proxy.conf.json`: `/api/**` deckt v2 bereits ab; Änderung unnötig.
- `frontend/e2e/*.spec.ts`: Alle neun Dateien enthalten Zugangssetup oder Intercepts; Finanzpfade erhalten.

## Tasks & Acceptance

**Execution:**
- [x] `frontend/src/main.ts`, `frontend/src/app/session/session.ts` – v2-Basis/Typen und generierte Sitzungsoperationen anbinden; separaten HttpBackend-Weg für Cookie-Mutationen erhalten. Logout samt Retry zentral bündeln und laufenden Status bereitstellen.
- [x] `frontend/src/app/session/session.interceptor.ts` – Bearer nur für ausdrücklich unterstützte v1/v2-Pfade derselben Herkunft; öffentliche Zugangsoperationen ausnehmen, Identität schützen, höchstens eine 401-Wiederholung und Generationskontrolle erhalten.
- [x] `frontend/src/app/registration/registration.ts`, `frontend/src/app/login/login.ts` – v2-Registrierung; Antworten/Fehler an aktive Formulare und Sitzungsgeneration binden, persönliche Eingaben beim Verlassen/Sitzungsende löschen; unbestätigte Registrierung mit Anmeldeweg erklären.
- [x] `frontend/src/app/session/logout-button.ts` neu, `frontend/src/styles.css` – gemeinsame Aktion „Abmelden“, rot `#842D2D`, weißer Text, lesbare Hover-/Druck-/Pending-Zustände, „Abmeldung läuft …“, mindestens 44×44, Fokus mit Abstand und Abstand zu Speichern/Löschen.
- [x] `frontend/src/app/month/month.ts`, `frontend/src/app/savings-goals/savings-goals.ts` – gemeinsame Aktion einsetzen und generierte v2-Identität über regulären Interceptor laden.
- [x] `frontend/e2e/*.spec.ts`, `frontend/playwright.config.ts` – Zugangssetup/Intercepts und Bereitschaftsprüfung auf v2 umstellen; Matrixfälle, alle sechs Netzwerkpfade, keine v1-Browserzugangsaufrufe, fremde Herkunft/unbekannte Version, Tab-Koordination und verzögerte Antworten prüfen. Bestehende Finanzregressionen erhalten.
- [x] `frontend/e2e/registration.spec.ts`, `frontend/e2e/session.spec.ts` – rote Aktion in beiden Ansichten sowie Zugang bei vier exakten Viewports, Tastatur/Fokus, Status, Kontrast, 200-%-Text und Reflow prüfen.
- [x] `README.md` – neuen Browserzugang und verbleibenden v1-Finanzstand dokumentieren.

**Acceptance Criteria:**
- Angenommen die echte API läuft, wenn alle Zugangsfunktionen ausgeführt werden, dann nutzen sie ausschließlich v2; Budget, Ausgaben und Sparziele funktionieren weiterhin über v1.
- Angenommen eine alte Sitzung endet, wenn verzögerte Zugangs-/Finanzantworten eintreffen oder ein anderes Konto öffnet, dann erscheinen keine alten Daten, Entwürfe oder Erfolgsmeldungen.
- Angenommen 320×568, 390×844, 768×1024 und 1280×800 CSS-Pixel, wenn Zugang/Abmeldung per Tastatur/Touch und mit 200-%-Text bedient werden, dann bleiben Aktionen erreichbar, Status/Fehler assistiv verständlich und 320-Pixel-Reflow ohne horizontales Scrollen. Textkontrast ≥4,5:1, Kontrollgrenzen/Fokus ≥3:1; reduzierte Bewegung beachten.

## Implementation Notes

- Alle sechs Browserzugangsoperationen verwenden generierte v2-Dienste und Typen. Cookie-Mutationen behalten den separaten HttpBackend-Zugang; Identität verwendet den regulären Interceptor. Die v1-Finanzaufrufe bleiben erhalten.
- Die Generation ist jetzt ein Signal, damit offene Formulare beim Sitzungsende auch ohne vorherigen Kontobestand reagieren. Loginantworten prüfen zusätzlich die lokale Versuchsgeneration. Registrierung verwirft Antworten nach Verlassen oder Generationenwechsel und löscht persönliche Eingaben.
- Die gemeinsame Abmeldekomponente verwendet zentrale laufende/ungeklärte Zustände und einen geteilten Widerruf. Offline wird lokal geschlossen, der Retry bleibt bis zur Wiederverbindung gesperrt. Rote Normal-/Hover-/Druck-/Pending-Zustände behalten lesbaren Text und Fokusabstand.
- Beim unmittelbaren Wechsel Registrierung → Anmeldung konnten asynchron registrierte NgModel-Felder frühe Eingaben mit Anfangswerten überschreiben. Die Loginfelder übernehmen native Eingabeereignisse unmittelbar; Labels, Autocomplete, manuelle Validierung und Formularabsendung bleiben erhalten. Der zuvor instabile vollständige Zugangspfad bestand danach 20 Wiederholungen mit echter HTTPS-API.
- Story 3.1 wurde nach der ausdrücklichen Nutzerantwort als Kontext geladen: ihr Specstatus ist `done`, der Sprintstatus weiterhin `review`. Dieser Nachweis bestätigt gemeinsamen Zugang und Cookies; ihr Status wird hier nicht verändert.
- Der Implementierungsagent wurde während der Fehlerdiagnose durch ein Nutzungslimit beendet; Primäragent übernimmt Fertigstellung, Prüfung und Nachweise.

- Alle sechs Zugangsoperationen verwenden die generierten v2-Clients und v2-Typen. Die Cookie-Mutationen laufen weiterhin über `HttpBackend`, Queue und die unveränderte originweite Sperre; die Identitätsprüfung beider Ansichten läuft über den regulären Interceptor. Beide `BASE_PATH`-Tokens werden getrennt bereitgestellt. Finanzpfade bleiben v1.
- Der Interceptor normalisiert relative und absolute URLs und fügt Bearer nur bei derselben Herkunft und den ausdrücklich unterstützten Versionen v1/v2 hinzu. Öffentliche Zugangsoperationen bleiben ausgenommen; die bestehende Begrenzung auf einen 401-Retry und das Verwerfen alter Antworten bleiben erhalten.
- Die Sitzungsgeneration ist reaktiv. Anmeldung und Registrierung binden Erfolg, Fehler und Fokus an ihr aktives Formular und die konkrete Generation beziehungsweise den konkreten Anmeldeversuch; Verlassen und Sitzungsende löschen E-Mail, Passwort, Registrierungsgeheimnis, Fehler und Erfolgsstatus. Ein unbestätigter Registrierungsabschluss verweist zuerst zur Anmeldung.
- `LogoutButton` wird in Monat, Sparzielen und dem ausdrücklichen Widerrufs-Retry verwendet. `Session` teilt laufende Logout-/Widerrufsoperationen und stellt Pending-/Unbestätigt-Zustände bereit. Lokal wird sofort geschlossen; späte Ergebnisse überschreiben keine neue Sitzung. Der Retry ist offline gesperrt. Rot `#842D2D`, weißer Text, dunklere Hover-/Druckfarben, unverändert lesbarer Pending-Zustand, mindestens 44×44 und 3 px Fokus mit 3 px Abstand sind gemeinsam definiert.
- Alle neun bestehenden Browserdateien und die API-Bereitschaftsprüfung verwenden v2 für Zugangssetup und Intercepts. Ein ausdrücklich als vorhandener v1-Tab aufgebauter Kompatibilitätsfall verwendet absichtlich v1 und dieselbe Cookie-Sperre. README beschreibt den verbleibenden v1-Finanzstand.

### Zuordnung der Browsernachweise

| Abnahme | Ausführbare Nachweise |
| --- | --- |
| AC-1 | `session.spec.ts`: „alle sechs Browserzugangsoperationen …“ führt Registrierung bis Logout über die echte API aus, prüft sechs v2-Netzwerkpfade, Bearer/CSRF/Origin und verbleibende v1-Finanzpfade. |
| AC-2 | `registration.spec.ts`: echte Registrierung, Link-/Passwort-/Feldfehler, Commitverlust und Fragmententfernung; `session.spec.ts`: neutrale Loginfehler und frische Monatsstartansicht. |
| AC-3 | `session.spec.ts`: gleichzeitige 401, zwei Wiederherstellungen, verzögerter Refresh/Kontowechsel, v1-Tab-Cookie-Sperre, Geräteuhr und unbestätigte Rotation ohne Retry. |
| AC-4 | `session.spec.ts`: relative/absolute URLs derselben Herkunft, fremde Herkunft, unbekannte Versionen, öffentliche Pfade, höchstens ein 401-Retry und verworfene geschützte Antworten. |
| AC-5 | `session.spec.ts`: gemeinsame rote Aktion in beiden Ansichten mit Fokus/Hover/Druck, geteilter Logout und geteilter Retry, beschrifteter Pending-Zustand und Touch-Abmeldung. |
| AC-6 | `registration.spec.ts`: späte Erfolgs-/Fehlerantwort nach Verlassen und Tab-Sitzungsende; `session.spec.ts`: späte Login-Erfolgs-/Fehlerantwort bei neuem Versuch, Loginabbruch, Tab-Kontowechsel, Refresh/Ablauf und geschützte Antwort nach Logout. Bestehende Finanzdateien prüfen zusätzlich späte Daten-/Mutationsantworten und gelöschte Entwürfe. |
| AC-7 | `registration.spec.ts` und `session.spec.ts`: offline, Netzwerk-/Serverfehler, unbekannter Registrierungsabschluss nach echtem Commit, unbestätigter Widerruf, ausdrücklicher Retry und Doppelsendesperren. |
| AC-8 | Beide Zugangsformulare und beide roten Abmeldeansichten werden bei 320×568, 390×844, 768×1024 und 1280×800 sowie 100/200 % Text geprüft: Reflow, Mindestgrößen, Tastatur/Fokus, Namen/Fehler/Status und axe. Rot/Weiß 8,77:1, Hover 10,53:1, Druck 12,57:1; Fokusring/Weiß 7,27:1. Reduzierte Bewegung und Touch sind zusätzlich abgedeckt. |
| AC-9 | Vertrags-/Clientkompilierung und vollständige HTTPS-Browsersuite mit echter API und temporärem PostgreSQL; Ergebnisse siehe Verification. |

Prüfgrenze: Programmatische Namen, Rollen, Lesereihenfolge, Fokus und Live-Regionen werden im Browser und mit axe geprüft. Die tatsächlich gesprochene Ausgabe eines eigenständigen Screenreaders wurde nicht geprüft; die automatisierten Nachweise ersetzen keinen manuellen Screenreader-Test. Eine Produktionsfreigabe ist damit nicht verbunden.

- Der erhaltene Sparziel-Löschdialog setzte nach dem Öffnen den Fokus nochmals in einem späteren Frame. Diese zweite Fokussierung konnte die erste Tab-Navigation zurücksetzen; Fokus wird nun direkt beim Öffnen gesetzt. Der vollständige bestehende Tastaturfall besteht.

- Reviewkorrekturen: ungeklärter Widerruf bleibt über fehlgeschlagene Anmeldung erhalten; laufende Abmeldung übersteht Generationenwechsel und meldet auch übersprungene Widerrufe ehrlich als unbestätigt. Eine bestätigte Ersatzsitzung räumt den ungeklärten Zustand auf. Alte Fokuscallbacks prüfen ihre Generation. Tests prüfen nun Promiseidentität und endgültige Logout-Anfragezahl sowie Fehler-/Offline-/Pending-/Retry-Zustände bei 200-%-Text in allen vier Größen. Acht gezielte Fälle bestehen.

## Spec Change Log

## Review Triage Log

| Befund | Urteil und Evidenz | Behandlung |
| --- | --- | --- |
| Blind 1: Unbestätigter Widerruf nach fehlgeschlagenem Login verloren | medium: `login → reset` löscht Warnung/Flag vor einer bestätigten neuen Sitzung; bei 401 bleibt das alte Cookie gültig. | patch: ungeklärten Widerruf bis bestätigtem Logout/neuer Sitzung erhalten und Fehlerfolge prüfen. |
| Blind 2: Broadcast beendet laufenden Logoutstatus | medium: `reset` entfernt laufendes Promise/Flag; Generationenwechsel verwirft anschließend auch ein negatives Widerrufsergebnis. | patch: laufende Abmeldung unabhängig vom Generationenreset verfolgen, unbestätigten Abschluss ohne aktive neue Sitzung zeigen. |
| Blind 3: Automatischer Widerrufsfehler bei Ablauf/Abbruch unbeachtet | medium: `end` und `cancelLogin` ignorieren das Ergebnis bereits im unveränderten Basisstand; Cookie kann bei HTTP-Fehler bestehen bleiben. | defer: vorbestehenden automatischen Widerruf gesondert nachführen. |
| Blind 4: Veralteter Login-Fokuscallback | low: `focus` prüft nur `active`; ein zwischenzeitlicher Versuch im gleichen Formular erhöht die Generation, hält die Komponente aber aktiv. | patch: Generation im vorhandenen Framecallback prüfen. |
| Blind 5: Fokusziel nach Sitzungsende und Ankündigung neuer Live-Region | low: bereits die v1-Abmeldung entfernte das aktive Element und navigierte ohne expliziten Eingangsfokus. Tatsächlich gesprochene Ankündigung ist nicht geprüft. | defer: vorbestehenden Eingangsfokus samt manuellem Screenreader-Verhalten prüfen. |
| Blind 6: Fehlende vergrößerte Fehler-/Offline-/Retry-Matrix | low: die vier Größen sind bislang hauptsächlich für normale Formulare/Aktionen geprüft; ergänzte Zustände haben keine vollständige Viererzuordnung. | patch: betroffene Zustände bei 200-%-Text über alle vier Größen prüfen. |
| Blind 7: Kein vollständig gebauter alter v1-Client | low: der neue Fall prüft ausdrücklich das unveränderte v1-Cookie-/Lockprotokoll mit echten v1-HTTP-Aufrufen. Broadcastnamen und handler sind gegenüber der Basis unverändert; eine vollständige Altclient-Ausgabe ist kein belegter Fehler. | verworfen: zusätzliche Fixture über direkte Korrektur hinaus; nur begrenzter Protokollnachweis beansprucht. |
| Blind 8: Fehlende manuelle Screenreader-Ausgabe | low: die Prüfgrenze ist bereits ausdrücklich dokumentiert; gesprochene Ausgabe ist keine ausgeführte Abnahme. | verworfen: vorgeschlagene Spec-Änderung; die bekannte manuelle Prüfgrenze bleibt sichtbar. |
| Blind 9: Sprintstatus noch in-progress | false: Review-Schritt 4 setzt zunächst nur den Specstatus; Sprintabschluss folgt ausdrücklich in Schritt 5. | verworfen: erwarteter Übergangszustand. |
| Blind 10: Nachweise ausschließlich in /tmp | false: versionierter Spec enthält Testanzahl, Befehle, Basisrevision, AC-/Testzuordnung und Prüfgrenzen; temporäre Logs ergänzen diesen dauerhaften Nachweis. CI führt dieselben Tests aus. | verworfen. |
| Blind 11: Doppelte Notizen und gemischte Verifikationsformulierungen | low: Implementierungsnotizen sind teilweise wiederholt; ausgeführte Befehle und Grenzen sind zusätzlich explizit protokolliert. | verworfen: reine Änderung dieser Build-Spec, Notizen bleiben append-only. |
| Edge 1: Zwei Abmeldungen überspringen Widerruf unter Kontention | medium: gegenseitige Broadcasts erhöhen beide Generationen, wartende Widerrufe können daher ungeklärt bleiben. Der bisherige Reset entfernt zugleich Retry/Warnung. | patch: gemeinsamer Grund mit Blind 2; ungeklärten Abschluss und expliziten Retry erhalten, ohne fremde neue Sitzung zu widerrufen. |
| Edge 2: Fokus des vorherigen Anmeldeversuchs | low: identischer nachgewiesener Framecallback wie Blind 4. | patch: gemeinsamer Grund mit Blind 4. |
| Verification 1: Doppelsendesperre nur vor Queueabschluss geprüft | medium: bisherige Zählung erfolgt vor Freigabe des gehaltenen Aufrufs; nachträglich eingereihte Duplikate bleiben unbeobachtet. Der vorgeprüfte Mutationsfall des Reviewers belegt die Lücke. | patch: Promiseidentität sowie endgültige Anfragezahl nach Abschluss prüfen. |

## Verification

- `./scripts/check-contract.sh` – beide Verträge/Client-Namensräume und SPA erfolgreich.
- `npm --prefix frontend run e2e` – gesamte HTTPS-Suite mit echter API/temporärem PostgreSQL erfolgreich, einschließlich gezielter Matrixfälle.
- Namen/Lesereihenfolge, Fokus und Live-Status prüfen; Grenzen automatisierter Screenreader-Nachweise dokumentieren.

- Abschließender Quellstand am 2026-10-26: `npm --prefix frontend run e2e` erfolgreich, **155 bestanden**, keine übersprungenen Fälle; echte HTTPS-SPA, API und temporäres PostgreSQL. Protokoll: `/tmp/story32-verified-e2e.log`.
- `./scripts/check-contract.sh` am selben Quellstand erfolgreich: beide Verträge validiert/gegen die eigene Basis geprüft, Java- und Angular-Ausgaben kompiliert, SPA gebaut. Protokoll: `/tmp/story32-verified-contract.log`.
- Der zuvor instabile vollständige Zugangspfad bestand 20 Wiederholungen nach Korrektur der Loginfelder (`/tmp/story32-form-fixed.log`). Temporäre Diagnoseinstrumentierung wurde entfernt.
- Primärprüfung: vollständigen Diff gegen `baseline_commit` einschließlich neuer Dateien gelesen; alle acht Aufgaben und alle drei Abnahmen bestätigt. Alle fünf Matrixzeilen sind durch tatsächlich ausgeführte Registrierungs-/Sitzungs- und Finanzfälle im erfolgreichen Gesamtlauf belegt; obige AC-Zuordnung benennt die Testfälle. Verträge, Backend und generierte Dateien bleiben unverändert. `git diff --cached --check` erfolgreich.

- Abschluss nach Reviewkorrekturen: vollständige HTTPS-Suite **162 bestanden** ohne Fehler oder übersprungene Fälle (`/tmp/story32-post-review-e2e.log`); Vertragscheck einschließlich Java-/Angular-Kompilierung und Produktionsbuild erneut erfolgreich (`/tmp/story32-post-review-contract.log`). Die acht gezielten Reviewfälle bestanden zusätzlich (`/tmp/story32-review-patches.log`). Finalen Quelltextdiff gelesen und Matrixabdeckung erneut bestätigt; freigegebener Block nachweislich unverändert.
- Drei unabhängige Reviewebenen abgeschlossen: 14 Befunde einzeln triagiert; sieben angenommene Befunde in fünf Korrekturgruppen behoben, fünf verworfen, zwei vorbestehende Themen in `deferred-work.md` festgehalten. Die manuelle Screenreader-Ausgabe bleibt ausdrücklich ungetestet; „done“ bezeichnet den abgeschlossenen Build-Workflow, der Sprintstatus bleibt zur menschlichen Abnahme `review`.
