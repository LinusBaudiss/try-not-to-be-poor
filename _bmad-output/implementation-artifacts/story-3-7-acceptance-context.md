# Story 3.7 — Verbindliche Abnahmen

Unveränderter Auszug aus `../planning-artifacts/epics.md`, Stand 2026-10-28.

### Story 3.7: Die neue Oberfläche nach sicherer v1-Stilllegung nutzen

Als Person mit bestehendem Konto und Finanzdaten\
möchte ich zur vollständig neuen Oberfläche wechseln können und bei einem veralteten Stand einen verständlichen Aktualisierungspfad erhalten,\
damit meine Daten erhalten bleiben und alte Zugriffe keine späteren Finanzänderungen unter einem überholten Vertrag verarbeiten.

**Anforderungsbezug:** Sicherer Übergang für FR-1 bis FR-13 und technische Voraussetzung für den signierten Teil von FR-10 sowie spätere FR-14 bis FR-17. NFR-1, NFR-2, NFR-6, NFR-7, NFR-10, NFR-11 und Erhalt der offenen Bedingungen aus NFR-12. AR-4, AR-5, AR-17 bis AR-23 mit Schwerpunkt AR-19/AR-20; UX-DR16, Aktualisierungspfad aus UX-DR28 und Erhalt der geprüften Hauptbereiche, roten Abmeldung sowie Fehler-/Entwurfsregeln aus UX-DR11/UX-DR15/UX-DR20/UX-DR29.

**Abhängigkeiten und Umfang:** Baut auf Stories 3.1 bis 3.6 und dem dort vollständig über v2 nutzbaren Browserablauf auf. Für den vorgesehenen Einzelhost mit einem Java-Artefakt wird ein dokumentierter Wechsel mit kontrollierter Wartungsunterbrechung verwendet: alte Zugriffe sperren, bisherige API vollständig stoppen, Ende ihrer Datenbankarbeit nachweisen und den geprüften v2-Stand starten. Ein unterbrechungsfreier Wechsel oder ein verteiltes Drain-Protokoll wird nicht vorausgesetzt. Die Umsetzung umfasst den geschützten Ablöse-/Start-/Rücknahmeweg, dauerhaften technischen Versions-/Nutzungszustand, v1-Ablehnung, Aktualisierungsweg und reale Übergangsnachweise. Technische Metadaten enthalten keine Finanzwerte oder personenbezogenen Monatsdaten; fachliche Automatikobjekte entstehen erst in Epic 4. Negative Fortschrittswerte werden in dieser Story weder gespeichert noch freigegeben.

**Abnahmekriterien:**

**AC-1 — Geprüfter und administrativ geschützter Ablöseplan**

**Angenommen** vollständiger v2-Vertrag, Module/Migrationen, Rollen und Oberfläche aus Stories 3.1 bis 3.6 liegen vor\
**Wenn** der Versionswechsel vorbereitet wird\
**Dann** benennt ein ausführbarer beziehungsweise reproduzierbar geprüfter Ablöseplan den konkreten Release-/Schema-/Rollenzustand, die laufende API-Instanz und ihre Datenbankverbindungen, Sperr-/Stopp-/Prüf-/Startreihenfolge, Fehlerabbruch und zulässigen Rücknahmestand. Vor dem Wechsel sind v2-Zugang einschließlich Registrierung/Anmeldung/Refresh/Logout, alle Finanzrouten, Security/CSRF/Origin, `no-store`, Proxy/Interceptor und vollständige Browserwege geprüft.\
**Und** der Wechsel wird ausschließlich über einen administrativ geschützten Betriebsweg ausgelöst, nicht über eine öffentliche Finanz- oder Nutzeraktion. Er erhält Produktionsgeheimnisse außerhalb versionierter Dateien und benötigt keine erweiterten Web-/Jobrechte auf fremde Finanzdaten. Ein normaler Client oder bloßer Frontendstatus kann keinen Stilllegungsnachweis erzeugen.

**AC-2 — Alte API und ihre Datenbankarbeit tatsächlich beenden**

**Angenommen** v1 nimmt noch Anfragen an und bereits zugelassene Vorgänge können ausstehen\
**Wenn** die kontrollierte Stilllegung beginnt\
**Dann** werden neue Zugriffe auf den bisherigen API-Stand gesperrt und die bisherige Java-Instanz kontrolliert vollständig beendet. Bereits zugelassene Vorgänge einschließlich GETs, noch vor dem ersten Fachzugriff wartender Anfragen, Mutationen und ihrer Transaktionen müssen abgeschlossen oder abgebrochen sein. Bei erzwungenem Abbruch wird zusätzlich das tatsächliche Ende der zugehörigen Datenbankarbeit/Transaktionen nachgewiesen.\
**Und** weder geschlossene Clientverbindung, abgelaufener HTTP-Timeout, verstrichene Wartezeit noch verschwundene Proxy-Verbindung allein gelten als Beweis. Alte API-Prozesse und zugehörige noch ausführbare Datenbankarbeit dürfen nicht parallel zum freigegebenen Nachfolgestand übrig bleiben. Bleibt Arbeit ungeklärt oder misslingt ein Prüfschritt, bleibt der Wechsel gesperrt; daraus wird keine erfolgreiche Versionsbarriere abgeleitet.

**AC-3 — Dauerhafter technischer Stilllegungs- und Nutzungszustand**

**Angenommen** die Stilllegung nach AC-2 ist nachgewiesen\
**Wenn** der neue Betriebszustand bestätigt wird\
**Dann** wird die v1-Stilllegung als dauerhafter technischer Zustand im Datenbestand festgehalten und für die unterstützten Start-/Freigabewege verbindlich. Der Zustand enthält ausschließlich technische Versions-/Freigabeinformationen, keine Konten, Geldbeträge, Finanztexte oder Monatsnachweise. Benötigte Metadaten werden durch neue Flyway-Migrationen eingeführt; bestehende Migrationen bleiben unverändert und Finanzbestände werden nicht kopiert oder umgedeutet.\
**Und** ein vorhandener technischer Zugang erlaubt später ausschließlich das Vorwärtssetzen eines dauerhaften Nutzungsmarkers für vorzeichenbehaftete Fortschrittswerte beziehungsweise Monatswirkungen innerhalb derselben äußeren Transaktion wie der entsprechende Effekt. Ein Rollback setzt auch diese unbestätigte Markeränderung zurück; nach Commit ist der Nutzungsmarker nicht über normale Konfiguration zurücksetzbar. Diese Story prüft den technischen Mechanismus ohne neue Finanzwirkung und hält beide fachlichen Freigabegates geschlossen. Fehlender oder widersprüchlicher Zustand wird nicht als Freigabenachweis behandelt.

**AC-4 — V1 wird vor Fachzugriff abgewiesen, v2 bleibt vollständig nutzbar**

**Angenommen** der neue Release startet mit bestätigter v1-Stilllegung\
**Wenn** ein alter oder neuer Client eine v1-Operation aufruft\
**Dann** wird sie unabhängig von gültigem JWT/Cookie bereits vor Ausführung des bisherigen Controllers oder fachlicher Datenbankarbeit abgewiesen. Das gilt für sämtliche bisherigen Lese-/Schreib- und Zugangsoperationen. Der Stilllegungsmodus verwendet eine eindeutige neutrale Antwort mit 401, Code `CLIENT_UPDATE_REQUIRED`, verständlichem Aktualisierungshinweis und einem festgelegten gleichursprünglichen Aktualisierungsziel; der bisherige Sitzungsendeweg alter Clients bleibt damit auslösbar. Die Antwort enthält keine Finanz-/Kontoinformationen und setzt `Cache-Control: no-store`.\
**Und** diese technische Ablehnung nach Stilllegung verändert nicht den archivierten eingefrorenen v1-Fachvertrag. Direkter API-Zugang und Zugang über den Proxy setzen dieselbe Sperre durch; reine Proxyumleitung genügt nicht als Schutz. Sämtliche neuen Nutzerwege verwenden vollständig v2 und fallen nicht still auf v1 zurück. Kein zuvor zugelassener v1-Read kann nach dieser Barriere noch Finanzwerte laden. Negative Fortschrittseingaben bleiben nach dem Vertrag aus Story 3.6 gesperrt und Automatik bleibt nicht aktivierbar.

**AC-5 — Neustart und Rücknahme können die Versionsgrenze nicht umgehen**

**Angenommen** die Stilllegung ist gespeichert und die Anwendung startet neu, ihre Konfiguration ändert sich oder ein vorheriger Release soll verwendet werden\
**Wenn** ein unterstützter Start-/Rücknahmeweg geprüft wird\
**Dann** wird der dauerhafte Zustand vor Aufnahme von Finanzzugriffen berücksichtigt. Ein Neustart oder eine veraltete Konfiguration öffnet v1 nicht automatisch wieder; bei fehlendem/widersprüchlichem Nachweis bleibt die neue fachliche Freigabe gesperrt und ein unsicherer Start wird verweigert beziehungsweise geschützt gehalten. Start-/Rücknahmewerkzeuge prüfen die Grenze auch vor einem älteren Binary, statt dessen Kenntnis neuer Metadaten vorauszusetzen.\
**Und** vor der ersten Nutzung signierter Fortschritte oder Monatswirkungen ist eine Rücknahme nur auf einen gegen genau den migrierten Schema-/Rollenzustand geprüften v1-kompatiblen Release über den dokumentierten kontrollierten Weg zulässig. Sobald der dauerhafte Nutzungsmarker gesetzt ist, scheitert jeder unterstützte Rückfall auf v1, auch wenn spätere Korrekturen alle aktuellen Fortschritte wieder nichtnegativ machen. Dann sind ausschließlich v2-kompatible Korrektur oder geprüfte Wiederherstellung vorgesehen; Finanzdaten werden für Code-Rücknahme weder abgeschnitten noch überschrieben. Wiederherstellung öffnet nicht ungeprüft alte Freigaben.

**AC-6 — Verständlicher Aktualisierungspfad für tatsächlich alte Oberflächen**

**Angenommen** eine bereits geladene veraltete Oberfläche trifft auf die Stilllegung oder eine Person öffnet einen alten gespeicherten App-Link\
**Wenn** der Client die Ablöseantwort verarbeitet beziehungsweise die Seite vollständig neu geladen wird\
**Dann** führen aktualisierungsfähige Oberflächen in einen geschlossenen persönlichen Zustand mit verständlichem Hinweis wie „Bitte lade die Seite neu“ und expliziter Aktualisierungsaktion. Das festgelegte gleichursprüngliche Ziel, etwa `/aktualisieren`, ist ohne Finanzzugang erreichbar und lädt den aktuellen Einstieg/Build; es übernimmt keine beliebige externe Zieladresse. Geschützte alte Werte/Entwürfe werden verworfen, gegebenenfalls wird neu angemeldet. Normale Systemtexte enthalten keine API-/Infrastrukturdiagnose.\
**Und** der tatsächlich bisherige v1-Bundle wird zusätzlich als Altclient geprüft: Fehlt ihm ein neuer Aktualisierungshandler, müssen bereits angemeldete Altansichten spätestens beim nächsten geschützten API- oder Sitzungserneuerungsversuch über den bestehenden Sitzungsendeweg schließen; vollständiges Browser-Neuladen der öffentlichen App-Adresse lädt nachweislich den v2-Stand. Dieser notwendige manuelle Pfad wird im Ablösehinweis dokumentiert. Bereits geladenes altes JavaScript wird nicht als aus der Ferne aktualisierbar angenommen. Alte Direktlinks und Zurück-/Vorwärtsnavigation eröffnen keinen erfolgreichen neuen v1-Datenzugriff.

**AC-7 — Unterbrochene Vorgänge und Sitzungen bleiben ehrlich behandelt**

**Angenommen** beim Wechsel sind noch Vorgänge mit ausstehender Antwort oder gültige bestehende Sitzungen vorhanden\
**Wenn** die Oberfläche aktualisiert und über v2 wieder geöffnet wird\
**Dann** bleiben verbindlich gespeicherte Konten, IDs, Eigentümer, Ausgaben-/Budgetstände und manuelle Zielwerte erhalten. Abgebrochene Transaktionen werden nicht als gespeichert bestätigt; bei unbestätigtem Ausgang wird zuerst der aktuelle v2-Stand ermittelt. Alte POST-/PUT-/DELETE-Anfragen werden nicht automatisch unter neuem Pfad wiederholt.\
**Und** der bestehende Sitzungsvertrag und seine Laufzeiten gelten weiter. Die v2-Oberfläche kann einen gültigen vorhandenen Zugang nach den bisherigen Cookie-/CSRF-/Origin-Regeln wiederherstellen oder verlangt verständlich eine neue Anmeldung. Späte Antworten alter Sitzungs-/Ansichtsgenerationen bringen weder persönliche Werte noch Erfolgsmeldungen zurück. Persönliche Entwürfe werden nicht für den Versionswechsel dauerhaft im Browser gespeichert; ihre Nichtübernahme beim Neuladen wird verständlich behandelt.

**AC-8 — Routing, Bereitschaftsprüfungen und Bedienhinweise verwenden den neuen Stand**

**Angenommen** der neue Betriebszustand wird lokal beziehungsweise in der vorgesehenen Einzelhostform gestartet\
**Wenn** SPA-Einstieg, Direktlinks, Proxy-/API-Routing, Bereitschaftsprüfungen und Prüfläufe verwendet werden\
**Dann** erreichen Monat, Ausgaben und Sparziele den aktuellen statischen Einstieg und alle Zugangs-/Finanzaufrufe ihre v2-Routen. Einstieg/Aktualisierungsziel und referenzierte Build-Dateien verhindern die erneute Ausgabe eines als aktuell behaupteten alten Einstiegs; fehlende alte Build-Dateien werden nicht als erfolgreiche API-/JavaScript-Antwort durch eine SPA-Fallbackseite ersetzt. V1 bleibt auch bei direktem Zugriff stillgelegt.\
**Und** lokale Start-/Testbereitschaftsprüfungen hängen nicht von einer stillgelegten v1-Route ab. CI unterscheidet den noch unterstützten Kompatibilitätsmodus und den geprüften Stilllegungsmodus; ein scheiternder Probeaufruf wird nicht stillschweigend als Bereitschaft gewertet. README und Ablösehinweise benennen v2, Aktualisierung, geschützten Wechsel, geprüfte Rücknahme und weiterhin offene Produktions-/Datenlebenszyklusbedingungen. Es wird kein tatsächlicher Produktionsrollout oder neuer Hostingdienst aus dieser Story abgeleitet.

**AC-9 — Reale Prozess-/PostgreSQL-Nachweise für die Barriere**

**Angenommen** der Ablauf und seine technischen Zustände sind implementiert\
**Wenn** die Übergangsprüfungen mit echten API-Prozessen und temporärem PostgreSQL laufen\
**Dann** belegen sie mindestens einen bereits zugelassenen GET vor seinem ersten Finanz-Lesezugriff, eine laufende Datenbankabfrage, eine Mutation vor Commit und eine bestätigte Mutation mit verlorener Antwort. Der Wechsel erfolgt erst nach deren tatsächlichem Abschluss/Abbruch; bei ungeklärter Arbeit oder fehlgeschlagenem Stopp wird kein Stilllegungsnachweis erzeugt. Nach der Barriere erreicht kein v1-Pfad mehr fachlichen Code oder Finanzabfragen.\
**Und** Neustart, widersprüchliche Konfiguration, direkte API- statt Proxyaufrufe und Rücknahme auf einen alten Startpfad umgehen die Sperre nicht. Ein kontrolliert gesetzter rein technischer Nutzungsmarker weist nach, dass v1-Rücknahme auch bei ausschließlich nichtnegativen aktuellen Testdaten verboten bleibt; dazu werden keine vorzeitig negativen Finanzdaten erzeugt. Transaktions-/Rollbacktests belegen das atomare Vorwärtssetzen des Markers. Die bisherigen Vertrags-/Generator-/Kompilierchecks und v1-Regressionsprüfungen laufen im unterstützten Modus weiterhin erfolgreich, die Stilllegungsprüfungen gesondert im gesperrten Modus.

**AC-10 — Browsernachweis mit altem und neuem Bundle und unabhängiger Abschluss**

**Angenommen** ein bisher tatsächlich unterstützter v1-Bundle und der neue v2-Bundle liegen als reproduzierbare Prüfreferenzen vor\
**Wenn** HTTPS-Browserprüfungen den Wechsel mit bestehenden Konten, offenen Ansichten und verspäteten Antworten durchführen\
**Dann** belegen sie die sichere Schließung alter geschützter Ansichten beim nächsten geschützten API-/Erneuerungsversuch, den nötigen vollständigen Reload, funktionierende alte App-Direktlinks, den aktuellen Build, frischen Kontozustand und ausschließlich v2-basierte neue Zugangs-/Finanzabläufe. Bestätigte Werte bleiben erhalten, ungewisse Mutationen werden nicht blind wiederholt, andere Konten werden nicht sichtbar. Ein bloßer Mock eines neuen Clients ersetzt den Altbundle-Nachweis nicht.\
**Und** Aktualisierungshinweis/-aktion sowie die drei vollständigen Hauptbereiche, rote Abmeldung, Fehler und Sitzungswechsel bleiben bei 320×568, 390×844, 768×1024 und 1280×800 CSS-Pixeln, Tastatur/Screenreader und 200 % Text im bestehenden UX-Prüfmaßstab bedienbar. Der technisch stillgelegte v1-Zustand mit vollständig nutzbarer v2-Oberfläche und weiterhin nichtnegativem manuellem Fortschritt ist ohne spätere Story abschließbar. Diese Story gibt weder signierte Fortschrittspersistenz noch Monatsautomatik oder Produktionsbetrieb mit echten Daten frei.

