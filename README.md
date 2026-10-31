# Try Not to Be Poor

Private Ausgabenübersicht mit fortlaufendem Monatsbudget und persönlichen
Sparzielen, vorrangig für Smartphones. Implementiert sind:

- Kontoanlage über einen aktiven Registrierungslink, Anmeldung, Sitzungserneuerung und Abmeldung.
- Fortlaufendes Monatsbudget und Restbudget für den aktuellen Kalendermonat nach `Europe/Berlin`.
- Ausgaben erfassen, die Historie aller Monate ansehen sowie eigene Einträge bearbeiten und löschen.
- Sparziele mit optionalem Zieldatum anlegen, ihren Gesamtfortschritt aktualisieren sowie Ziele bearbeiten und löschen.

Jede Person mit dem Registrierungslink kann ein unabhängiges Konto mit E-Mail
und Passwort erstellen und sieht ausschließlich die eigenen Daten. Eine
Registrierung meldet nicht an. Nach der Anmeldung öffnet sich „Monat“;
„Ausgaben“ und „Sparziele“ sind in dieser Reihenfolge über die Hauptnavigation erreichbar.
Erfassung, vollständige Ausgabenhistorie, Bearbeiten und bestätigtes Löschen liegen
ausschließlich unter `/ausgaben`; „Monat“ enthält Budget und Monatsübersicht.

Der abgeschlossene v1-Umfang umfasst Epics 1–2 mit den neun Stories
1.1–1.6 und 2.1–2.3. Die Oberfläche verwendet für alle sechs Zugangsfunktionen
einschließlich Identitätsprüfung sowie für alle vier Ausgabenoperationen API v2
(`/api/v2/expenses`). Budget (`GET`/`PUT /api/v2/budget`) und Monatsübersicht
(`GET /api/v2/month-summary`) und alle fünf Sparzieloperationen (`/api/v2/savings-goals`)
verwenden ebenfalls v2. Die Anwendung bleibt für synthetische Daten vorgesehen.
V1 bleibt im Kompatibilitätsmodus unterstützt; nach dem geschützten Versionswechsel
verweist eine frühe Sperre auf den vollständigen Aktualisierungspfad.
Beide Ausgabenversionen verwenden dieselben Daten und dieselbe Finanztransaktion.
Nach einer unbestätigten Ausgabenmutation sperrt die Oberfläche weitere Mutationen,
bis die Historie erfolgreich neu geladen und ausdrücklich geprüft wurde.
Entwürfe bleiben dabei nur im offenen Tab erhalten. Negative Fortschrittspersistenz
und Monatsautomatik aus Epics 3–4 sind noch nicht freigegeben.
Den Arbeitsstand dokumentieren [Sprintstatus](_bmad-output/implementation-artifacts/sprint-status.yaml)
und die zugehörigen Story-Specs. Retrospektiven bleiben optional;
die [Voraussetzungen für Produktivbetrieb](#vor-echten-nutzerdaten)
sind weiterhin offen.

## Voraussetzungen

- Node **24.22.0**, npm (mit Node geliefert), JDK **25** einschließlich `javac`.
- Maven **3.10.0** wird durch `backend/mvnw` geladen; kein globales Maven nötig.
- Für die manuelle lokale Anwendung: Docker mit Compose v2 oder neuer
  (`up --wait` erforderlich) und PostgreSQL **18.6**. Das Startskript erkennt
  sowohl das Plugin `docker compose` als auch ein eigenständiges `docker-compose`.
  Die Docker-CLI allein enthält Compose nicht zwingend. Unter Ubuntu mit Docker
  aus den Ubuntu-Paketquellen installiert `sudo apt-get install docker-compose-v2`
  das Plugin. Danach sollte `docker compose version` erfolgreich sein.
- Für Start und Prüfungen: Linux x86_64, [Python ab 3.11](https://docs.python.org/3/library/hashlib.html#hashlib.file_digest), curl, Git, sha256sum und **unzip**.
  Der API-Guard benötigt [Linux ab Kernel 5.3](https://man7.org/linux/man-pages/man2/pidfd_open.2.html) mit `/proc`, verfügbaren
  `pidfd_open`-/`pidfd_send_signal`-APIs und `prctl(PR_SET_CHILD_SUBREAPER)`.
  Der unveränderte Herstellerwrapper benötigt unzip für das mit ZIP-Prüfsumme
  gepinnte Maven-Archiv; sein TAR-Fallback passt nicht zu dieser Prüfsumme.
- Spring Boot **4.1.1**, Angular **22.2.3**, OpenAPI Generator **7.26.0** und
  oasdiff **1.30.0** sind festgelegt. npm-Abhängigkeiten stehen im Lockfile.

Frontend und Backend besitzen getrennte Builds. Die statische SPA spricht
ausschließlich per HTTP mit `/api/v1` und `/api/v2`. Die getrennten Verträge liegen in
`api-contract/openapi.yaml` und `api-contract/v2/openapi.yaml` (OpenAPI 3.0.4). Client und Spring-Interfaces werden
generiert, nicht von Hand geändert oder versioniert.

## Lokal starten

Nur synthetische Daten verwenden. Eine Produktionskonfiguration ist noch nicht
vorhanden; `deploy/compose.local.yaml` startet nur PostgreSQL. Vor echten Nutzerdaten müssen Datenschutz und
Betrieb geklärt sowie verschlüsselte Backups außerhalb des VPS und eine geprüfte
Wiederherstellung vorhanden sein.

Die gesamte Anwendung in einem Terminal starten:

```bash
./start-local.sh
```

Auch `bash start-local.sh` und `sh start-local.sh` sind möglich; bei einem
Aufruf mit `sh` wechselt das Skript vor dem Start automatisch zu Bash.

Das Skript im Projektverzeichnis ruft Einrichtung, Datenbank, Backend und Frontend
in dieser Reihenfolge auf. Es wartet auf die Bereitschaft von Backend und
HTTPS-Frontend und zeigt dann `https://localhost:4200` an. Belegte Ports 8080/4200
und ein weiterer Gesamtstart desselben Projekts werden abgewiesen. Für den
Gesamtstart werden zusätzlich `curl` und `flock` (Linux: util-linux) benötigt.
Für Backend und Frontend beträgt die Startwartezeit jeweils fünf Minuten; bei
langsamen Erstbuilds kann sie etwa mit `START_LOCAL_TIMEOUT_SECONDS=600 ./start-local.sh`
erhöht werden. Image-Downloads und der vorherige Compose-Datenbankstart fallen
nicht unter dieses Zeitlimit. Als Argumente sind `--ssl-cert` und `--ssl-key`
für eigene Zertifikatspfade erlaubt; Host, Port und HTTPS bleiben für die
Sitzungskonfiguration fest auf `https://localhost:4200` eingestellt.
Die Ausgabe beider Dienste bleibt im Terminal sichtbar. Strg+C oder das Ende
eines Anwendungsprozesses beendet Backend und Frontend samt Unterprozessen;
die lokale Datenbank läuft mit ihren gespeicherten Daten weiter.

Alternativ lassen sich die Schritte einzeln ausführen:

Lokale Konfiguration vorbereiten und anschließend die Datenbank starten:

```bash
./scripts/start-local/setup.sh
./scripts/start-local/start-database.sh
```

Die ausführbaren Bash-Skripte unter [`scripts/start-local/`](scripts/start-local/)
wechseln selbst ins Projektverzeichnis. `setup.sh` erzeugt zufällige lokale
Datenbankkennwörter, einen Sitzungsschlüssel und den Registrierungslink.
Neue Konfigurationsdateien erhalten Modus `0600`, `.local/` erhält `0700`.
Erneutes Ausführen behält bestehende Dateien bei, auch eine widerrufene oder
abgelaufene Registrierungskonfiguration. Parallele Setup-Aufrufe sind über
`.local/setup.lock` serialisiert. Fehlt bei aktiver Registrierung die Linkdatei,
meldet das Skript den nötigen Befehl zur bewussten Rotation. Für Linkrotation oder Widerruf siehe
[Registrierung konfigurieren](#registrierung-konfigurieren-rotieren-und-widerrufen).

Die Datenbank ist nur auf `127.0.0.1:5432` gebunden. Das Initialisierungsskript
legt `tnbp_migrator` und `tnbp_runtime` mit getrennten Kennwörtern an. Die
Laufzeitrolle ist weder Superuser noch Tabellenbesitzer und besitzt kein
`BYPASSRLS`. Sie darf Konten einfügen, die für Anmeldung notwendigen Spalten lesen und Sitzungsfamilien/Tokenhistorie pflegen; ein Startcheck lehnt
privilegierte Laufzeitrollen ab. Budgets, Ausgaben und Sparziele werden zusätzlich
durch SQL-Nutzerfilter und erzwungene PostgreSQL-RLS geschützt; jeder Finanzzugriff
setzt `app.user_id` ausschließlich transaktionslokal aus dem geprüften JWT-`sub`.
Ohne Kontext sind keine Finanzzeilen sichtbar oder schreibbar. Die Laufzeitrolle
darf Budgetbeträge lesen, anlegen und ändern, jedoch keine Budgetzeilen löschen
oder Eigentümer/Monate ändern. Ausgaben dürfen angelegt, gelesen, gelöscht und
in Name/Betrag geändert werden; Eigentümer und Erfassungsdatum bleiben geschützt.
Sparziele dürfen angelegt, gelesen, gelöscht sowie in Name, Zielbetrag,
Zieldatum und Fortschritt geändert werden; Ziel- und Fortschrittsänderungen
schreiben nur ihre jeweiligen Felder. Flyway verwendet ausschließlich die
Migrationsrolle und führt die versionierten Migrationen unter
`backend/src/main/resources/db/migration/` aus. Der benannte Compose-Datenträger
erhält Konten und Finanzdaten bei Neustarts.
Geänderte Kennwörter in der lokalen Datei ändern keine bereits initialisierte
Datenbank; Rollenkennwörter müssen dann gezielt in PostgreSQL angepasst werden.
Bei jedem Datenbankstart führt `start-database.sh` zusätzlich
[`deploy/provision-finance-grants.sql`](deploy/provision-finance-grants.sql)
als Datenbankadministrator aus. Der wiederholbare Abgleich entzieht überzählige
Finanzrechte und setzt die benötigten Tabellen-/Spaltenrechte auch auf vorhandenen
Volumes. Er unterstützt den bisherigen V8- und den neuen V9-Schemastand, legt
keine Rollen an und ändert keine Kennwörter. Der Migrator bleibt ohne `CREATEROLE`.

`setup.sh` legt auch die benötigte `.local/session.env` an. Beachte vor dem
Öffnen der Anwendung die Hinweise zu [Sitzungsschlüssel und HTTPS](#sitzungsschlüssel-und-https).

Backend in einem Terminal starten:

```bash
./scripts/start-local/start-backend.sh
```

Frontend in einem zweiten Terminal starten:

```bash
./scripts/start-local/start-frontend.sh
```

Das Backend-Skript lädt die drei lokalen Konfigurationsdateien bei jedem Start
neu. Das Frontend-Skript installiert die festgelegten npm-Abhängigkeiten und
startet den HTTPS-Entwicklungsserver. Zusätzliche Angular-Startoptionen können
als Argumente übergeben werden, etwa `--ssl-cert` und `--ssl-key`.

Die Datei `.local/registration-link.txt` lokal öffnen und den Link im Browser
aufrufen. Das zufällige 256-Bit-Geheimnis steht ausschließlich im URL-Fragment,
wird von der SPA direkt aus der Adresszeile entfernt und nur im JSON-Body der
Registrierung übertragen. Es bleibt im Speicher des offenen Tabs. Nach einem
Neuladen muss der ursprüngliche Link erneut geöffnet werden. E-Mail, Passwort, JWT, CSRF-Token und persönliche Daten werden ausschließlich im Arbeitsspeicher gehalten. Das Refresh-Geheimnis und die opaque CSRF-Sitzungskennung stehen ausschließlich in geschützten HttpOnly-Cookies. LocalStorage, SessionStorage und IndexedDB bleiben frei.

Der lokale Proxy leitet `/api/**` an `127.0.0.1:8080` weiter. Der statische
Produktionsbuild liegt unter `frontend/dist/tnbp/browser`; ein späterer Webserver
muss SPA-Routen auf `index.html` zurückführen und `/api/*` einschließlich v2 zur API
weiterleiten. Fehlende Dateien dürfen keinen erfolgreichen HTML-Fallback erhalten.
Die reproduzierbare HTTPS-Vorschau steht in `deploy/Caddyfile.preview`.

## Registrierung konfigurieren, rotieren und widerrufen

Die API liest geschützte externe Umgebungsvariablen:

| Variable | Bedeutung |
|---|---|
| `DB_URL` | JDBC-URL; lokal standardmäßig `jdbc:postgresql://localhost:5432/tnbp` |
| `DB_RUNTIME_USER`, `DB_RUNTIME_PASSWORD` | Laufzeitrolle, standardmäßig `tnbp_runtime`; Kennwort erforderlich |
| `DB_MIGRATION_USER`, `DB_MIGRATION_PASSWORD` | Migrationsrolle, standardmäßig `tnbp_migrator`; Kennwort erforderlich |
| `REGISTRATION_LINK_ENABLED` | Aktivierung, standardmäßig `false` |
| `REGISTRATION_LINK_SHA256` | SHA-256 über das Base64url-Geheimnis, 64 Hexzeichen |
| `REGISTRATION_LINK_ISSUED_AT` | Ausgabezeit als ISO-8601-Instant |
| `REGISTRATION_LINK_EXPIRES_AT` | Optionaler früherer Ablauf als ISO-8601-Instant |

Ohne vollständige aktive Linkkonfiguration bleibt die Registrierung gesperrt.
Ein Link gilt ab seiner Ausgabe einschließlich bis **ausschließlich** zur
früheren Grenze aus explizitem Ablauf und Ausgabe plus 30 Tagen. Ein späterer
konfigurierter Ablauf verlängert diese 30 Tage nicht. Hashvergleich ist
zeitkonstant. Für die Kontoanlage gibt es keine Einladungsliste.

```bash
# Rotation: erzeugt ein neues Geheimnis und ersetzt beide geschützten Dateien.
python3 scripts/create-registration-link.py --base-url https://localhost:4200

# Optional früher ablaufen lassen (Datum mit Zeitzone innerhalb der nächsten 30 Tage).
python3 scripts/create-registration-link.py --base-url https://localhost:4200 --expires-at "$(date -u -d '+7 days' +%Y-%m-%dT%H:%M:%SZ)"

# Widerruf: Registrierung deaktivieren und die lokale Linkdatei entfernen.
python3 scripts/create-registration-link.py --revoke
```

Nach jeder Änderung die API mit `./scripts/start-local/start-backend.sh` neu
starten; das Skript lädt die aktuelle Konfiguration. Alte Links sind nach
Aktivierung der neuen Konfiguration gesperrt; vorhandene Konten bleiben erhalten. `--output-dir` erlaubt
ein Verzeichnis außerhalb des Projekts. Dateien erhalten Modus `0600`, das
Verzeichnis `0700`; das Werkzeug druckt keine Geheimnisse. `.local/` und `.env*`
sind von Git ausgeschlossen. Request-Bodys und Linkfragmente auch in späteren
Proxy-, Diagnose- oder Monitoringkonfigurationen nicht protokollieren.

Passwörter werden NFC-normalisiert, in Unicode-Codepunkten auf 15–64 Zeichen
geprüft und vollständig mit individuell gesalzenem Argon2id verarbeitet
(19.456 KiB, zwei Iterationen, Parallelität eins). Leerzeichen werden erhalten;
es gibt keine Zeichenklassenpflicht. Die lokale SecLists-Sperrliste ist samt
Lizenz, Quellversion und Prüfsumme in `THIRD_PARTY.md` dokumentiert. Es finden
keine externen Passwortanfragen statt. E-Mails werden getrimmt und kleingeschrieben;
ein Unique-Constraint verhindert auch parallele doppelte Konten. Kontoanlage ist
transaktional; ein Erfolg wird erst nach Commit zurückgegeben.


## Sitzungsschlüssel und HTTPS

`setup.sh` erzeugt vor dem ersten Backendstart einen zufälligen lokalen Schlüssel
in `.local/session.env`. Eine vorhandene Datei wird beibehalten:

```bash
./scripts/start-local/setup.sh
```

`SESSION_SIGNING_KEY` ist ein externes Base64-Geheimnis mit mindestens 32 Bytes;
`SESSION_ISSUER`, `SESSION_AUDIENCE` und `SESSION_ORIGIN` müssen gesetzt sein.
Origin ist die exakte HTTPS-Origin ohne abschließenden Slash. Unvollständige
Konfiguration sperrt Sitzungsbetrieb (503), ohne die Registrierung zu öffnen.
Derselbe Schlüssel muss einen API-Neustart überleben; ein neuer Schlüssel macht
bestehende JWTs ungültig. Geheimnisse außerhalb versionierter Dateien verwahren.

Die SPA lokal über **https://localhost:4200** öffnen und das lokale Zertifikat
vertrauen. Angular erzeugt mit `--ssl` ein lokales Entwicklungszertifikat; dies
ist ausschließlich für synthetische Daten. Für ein eigenes vertrauenswürdiges
Zertifikat `--ssl-cert` und `--ssl-key` aus geschützter lokaler Ablage verwenden.
HTTP, abweichende Hosts und abweichende Origins sind keine unterstützte
Sitzungskonfiguration. Der lokale Proxy behält Secure-Cookie-Attribute bei.

`GET /api/v2/access/csrf` liefert Spring Securitys CSRF-Token (`no-store`). Vor jeder Cookie-Mutation holt der Tab einen frischen Token und
sendet ihn als `X-CSRF-TOKEN` bei Login, Refresh und Logout. Die serverseitige
CSRF-Sitzung verwendet `__Host-tnbp-csrf` (HttpOnly, Secure, SameSite=Strict,
Path=/, keine Domain), der Token selbst bleibt nur im Tabspeicher. Nach einem
API-Neustart lädt ein neuer Tab/Reload einen neuen CSRF-Token. Auf 403 wird keine
Mutation automatisch wiederholt.

`__Host-tnbp-refresh` hat dieselben Cookie-Schutzattribute. Es enthält 256
Zufallsbits; PostgreSQL speichert ausschließlich SHA-256-Hashes. Jeder Refresh
rotiert atomar. Alte Hashes bleiben für Replay-Erkennung erhalten. Die Familie
wird bei Wiederverwendung (auch parallel), Logout und Erreichen der exklusiven
Grenze von 30 Tagen Inaktivität oder 90 Tagen seit Anmeldung widerrufen. Eine
nicht bestätigte Rotation wird im Browser niemals automatisch wiederholt.

Access-JWTs gelten zehn Minuten und prüfen HS256-Signatur, Aussteller,
Zielgruppe, Zeitgrenzen und kanonischen UUID-`sub`. Logout widerruft die
Refresh-Familie; ausgestellte JWTs bleiben bis Ablauf gültig. Die SPA verwirft
bei Sitzungsende und Kontowechsel alle persönlichen Speicherwerte und schließt
die persönliche Ansicht. Laufende Cookie-Mutationen werden vor Logout beendet,
damit eine späte Refreshantwort die Abmeldung oder einen bereits eingetretenen Sitzungsablauf nicht rückgängig macht. Kontowechsel und Sitzungsende schließen persönliche Ansichten auch in anderen offenen Tabs über BroadcastChannel; dabei werden keine Geheimnisse übertragen.

Alle drei Hauptbereiche verwenden dieselbe rote Aktion **Abmelden**. Sie schließt den
persönlichen Bereich sofort; während des Serverwiderrufs erscheint „Abmeldung
läuft …“. Bleibt dessen Bestätigung aus, nennt die Anmeldung den unbestätigten
Widerruf und bietet „Abmeldung erneut versuchen“ an. Laufende Abmeldungen werden
geteilt und können nicht doppelt gesendet werden. Die Cookie-Sperre
`tnbp-session-cookie` und der BroadcastChannel `tnbp-session` bleiben mit älteren
v1-Tabs kompatibel. Eingaben bleiben bei Fehlern nur im offenen Formular; nach
unbestätigter Registrierung wird zuerst die Anmeldung angeboten. Verlassen und
Sitzungsende verwerfen persönliche Eingaben und entkräften verspätete Antworten.

## Monatsbudget verwenden

Nach der Anmeldung unter „Monat“ den Betrag in **Euro ohne Tausendertrennzeichen**
eingeben, z. B. `1200,50` oder `1200.50`, und „Budget speichern“ wählen.
Höchstens zwei Nachkommastellen sind erlaubt; es wird niemals gerundet.
Der zulässige Bereich ist `0` bis `90071992547409,91` Euro
(`0…9007199254740991` ganze Cent). Auch der Maximalbetrag wird exakt deutsch
formatiert. „Noch kein Monatsbudget“ unterscheidet sich von einem gespeicherten
Nullbudget (`0,00 €`).

Der Betrag gilt ab dem laufenden **Berlin-Kalendermonat** und wird in Folgemonate
übernommen. Änderungen wirken sofort im laufenden Monat. Pro Nutzer und Monat
wird ein Eintrag angelegt beziehungsweise aktualisiert; frühere Monatswerte
bleiben erhalten. Eine Budgetlöschung ist nicht implementiert.

Die Monatsübersicht zeigt Budget, Summe der Ausgaben im laufenden Monat und
`Restbudget = Monatsbudget − Monatsausgaben` aus einem gemeinsamen Datenstand.
Ein negatives Ergebnis bleibt sichtbar und trägt den Hinweis „Budget überschritten“.
Ohne festgelegtes Budget wird kein Restbetrag als Nullwert vorgetäuscht;
Ausgaben lassen sich trotzdem erfassen. Bestätigte Budget- und Ausgabenänderungen
aktualisieren die Übersicht.

Die Anzeige bestätigt erst eine erfolgreich abgeschlossene Speicherung.
Währenddessen ist Doppelsenden gesperrt. Bei Fehlern und offline bleibt der
Entwurf im offenen Tab erhalten; offline ist Speichern blockiert. Bei einer
verlorenen Antwort kann der Server bereits gespeichert haben. Weitere Speicherung
bleibt gesperrt, bis „Budget zur Prüfung laden“ den aktuellen Stand geladen hat
und „Ich habe das Budget geprüft“ ausdrücklich bestätigt wurde. Der Prüfabruf
erhält den offenen Entwurf; erst anschließend lässt sich dieser ausdrücklich
speichern. Ein fehlgeschlagener Prüfabruf hebt die Sperre nicht auf. Der
Vorgangsschutz bleibt auch bei einem Bereichswechsel erhalten; persönliche
Entwürfe bleiben nur im offenen Formular. Es gibt keine automatische Wiederholung
oder Offline-Synchronisation. Neuladen lädt den aktuellen Serverbestand; Entwürfe
werden nicht im Browser gespeichert. Abmeldung,
Sitzungsende und Kontowechsel verwerfen Beträge und Entwürfe sowie später
eintreffende Antworten.

`GET`/`PUT /api/v2/budget` und `GET /api/v2/month-summary` akzeptieren ausschließlich ein
verifiziertes Bearer-JWT; Cookies und Eigentümerangaben bestimmen keinen
Budgetzugriff. Alle Finanzantworten tragen `Cache-Control: no-store`.

## Ausgaben erfassen, bearbeiten und löschen

Unter „Ausgaben“ einen Namen und einen positiven Eurobetrag eingeben, z. B.
`12,50`, und „Ausgabe speichern“ wählen. Komma oder Punkt sind erlaubt,
Tausendertrennzeichen und mehr als zwei Nachkommastellen werden abgelehnt.
Einzelbeträge und die Ausgabensumme jedes Monats dürfen höchstens
`9007199254740991` Cent betragen; überschreitende Änderungen werden abgelehnt.
Das Erfassungsdatum setzt der Server nach `Europe/Berlin`.

„Alle Ausgaben“ zeigt die eigene Historie über alle Monate, mobil als
beschriftete Einträge und auf breiten Ansichten als Tabelle. „Bearbeiten“ ändert
Name und Betrag; das Erfassungsdatum bleibt erhalten. „Löschen“ verlangt eine
Bestätigung und entfernt den Eintrag endgültig. Bestätigte Änderungen aktualisieren
die Historie; beim anschließenden Öffnen von „Monat“ wird die Monatsübersicht frisch
geladen, auch über Zurück/Vorwärts. Nur Ausgaben des laufenden Monats fließen in das
aktuelle Restbudget ein. „Ausgaben aktualisieren“ lädt die Historie erneut. Nach einem
unbestätigten Vorgang zunächst die Historie laden und prüfen, dann „Ich habe die
Historie geprüft“ wählen. Erst danach ist ein weiterer ausdrücklicher Versuch möglich.

## Sparziele verwenden

Unter „Sparziele“ einen Namen und einen positiven Zielbetrag in Euro angeben.
Das optionale Zieldatum wird als Kalenderdatum im Format `JJJJ-MM-TT` eingegeben;
vergangene Daten sind erlaubt. Neue Ziele beginnen mit `0,00 €` Fortschritt.

„Fortschritt aktualisieren“ setzt den **gesamten bisher erreichten Betrag** neu;
es werden keine einzelnen Beiträge oder Verläufe gespeichert. Null und Beträge
über dem Zielbetrag sind erlaubt. Die Anzeige nennt den tatsächlichen Betrag,
Anteil und gegebenenfalls die Überschreitung; ausschließlich der Balken bleibt auf
0–100 % begrenzt. Der v2-Antwortvertrag und die exakte Anzeige unterstützen bereits
signierte Fortschritte bis ±9007199254740991 Cent. Negative Schreibwerte bleiben
serverseitig mit 409 `FEATURE_NOT_AVAILABLE` gesperrt, bis die vollständige
v1-Lese-/Schreibbarriere nachgewiesen ist. Die Datenbankgrenze bleibt unverändert
nichtnegativ; es gibt keinen Freigabeschalter.
Zielbetrag und Fortschritt dürfen jeweils höchstens `9007199254740991` Cent
betragen. Es gelten dieselben Euro-Eingaberegeln wie beim Budget.

„Bearbeiten“ ändert Name, Zielbetrag und Zieldatum; ein leeres Datumsfeld entfernt
das Datum. Der Fortschritt bleibt dabei erhalten. „Löschen“ verlangt eine
Bestätigung und entfernt das Ziel endgültig. „Sparziele aktualisieren“ lädt die
eigenen Ziele erneut. Sparziele beeinflussen das Restbudget nicht.

Für alle Finanzfunktionen gilt: Erfolg wird erst nach bestätigter Speicherung
angezeigt. Bei Fehlern oder offline bleiben Entwürfe nur im offenen Tab erhalten;
offline sind Mutationen gesperrt. Bei verlorenen Antworten kann eine Mutation
bereits gespeichert sein. Weitere Sparzielmutationen bleiben gesperrt, bis
„Sparziele zur Prüfung laden“ den aktuellen Bestand erfolgreich geladen hat und
„Ich habe die Sparziele geprüft“ ausdrücklich bestätigt wurde. Dabei bleiben
alle offenen Entwürfe erhalten; ein gewöhnliches Aktualisieren oder fehlgeschlagenes
Laden hebt die Sperre nicht auf. Die Prüfung beweist keinen Serverabschluss nach
einem Timeout. Bei Bereichswechsel bleiben nur Vorgangsflags erhalten; nach einer
laufenden Anfrage muss ihr Ausgang abgewartet und der Bestand geprüft werden.
Neuladen, Abmeldung, Sitzungsende und Kontowechsel verwerfen offene Entwürfe.

## Prüfen

```bash
./scripts/check-contract.sh
python3 -m unittest discover -s scripts/tests -v
./backend/mvnw -f backend/pom.xml verify
npm --prefix frontend ci
npm --prefix frontend run build
npx --prefix frontend playwright install chromium
npm --prefix frontend run e2e
```

`check-contract.sh` validiert beide Verträge mit Generator 7.26.0 und generiert
die Spring-Boot-4-Interfaces getrennt unter `backend/target/generated-sources/openapi/v1`
und `v2` (Java-Pakete `de.linus.tnbp.contract` und `de.linus.tnbp.contract.v2`).
Die Angular-22-Module liegen unter `frontend/src/app/api/` und dessen Unterordner
`v2/`; bisherige Importe bleiben gültig. Maven kompiliert beide Java-Ausgaben.
`npm --prefix frontend run check:contracts` kompiliert mit `ngc` und
`tsconfig.contracts.json` alle generierten TypeScript-Dateien, einschließlich
der noch nicht durch die SPA importierten v2-Dateien. Danach baut die bisherige SPA.
`CONTRACT_BASE_REF=<commit>` setzt den Vergleichscommit; ohne Variable wird `HEAD`
verwendet. Jede Version wird ausschließlich gegen ihren eigenen Vertrag im
Basiscommit verglichen. Fehlt dort etwa v2, gilt nur diese Version als Erstvertrag;
v1 wird weiterhin gegen v1 geprüft. Bei vorhandenem Basisvertrag blockiert
oasdiff 1.30.0 mit `--fail-on ERR` inkompatible Änderungen jeder unterstützten
Hauptversion. CI verwendet
die PR-Basis beziehungsweise den vorherigen Push-Commit.

Der eingefrorene Vertrag `api-contract/openapi.yaml` beschreibt weiterhin v1.
`api-contract/v2/openapi.yaml` stellt zusätzlich den Kontozugang unter `/api/v2`
bereit: Registrierung (`POST /access/registrations`), CSRF (`GET /access/csrf`),
Anmeldung (`POST /access/login`), Erneuerung (`POST /access/refresh`), Abmeldung
(`POST /access/logout`) und eigene Identität (`GET /access/me`). Beide Versionen
verwenden dieselben Konten, JWT-Regeln, sicheren Cookies und rotierenden
Refresh-Familien. Ein CSRF-Handschlag gilt auch beim Wechsel des Versionsadapters;
Origin und CSRF-Header bleiben für jede Cookie-Mutation verpflichtend. Logout
widerruft die Familie auch für die andere Version. Alle v2-Antworten einschließlich
Registrierung und Fehlern tragen `Cache-Control: no-store`; fehlende Sitzungskonfiguration
meldet bei Login, Refresh und Logout 503. Unbestätigte Mutationen niemals automatisch
wiederholen. Der v2-Vertrag umfasst außerdem GET/POST `/expenses` und PUT/DELETE
`/expenses/{expenseId}`, GET/PUT `/budget`, GET `/month-summary`, GET/POST
`/savings-goals`, PUT/DELETE `/savings-goals/{id}` und PUT
`/savings-goals/{id}/progress`. Der Browser verwendet für sämtliche Operationen die generierten
v2-Clients. Beide Finanzversionen teilen denselben Bestand und die äußere
Finanzkoordination; v1 bleibt im Kompatibilitätsmodus für Altoberflächen verfügbar. V2-Operationen erhalten
den Bearer ausschließlich über den Interceptor für dieselbe Herkunft und die
unterstützten Hauptversionen. Der [geschützte Ablöseweg](deploy/api-transition.md)
legt v1 dauerhaft still. Negative Schreibfreigabe und Produktionsfreigabe bleiben
weiterhin geschlossen.

## Finanzmodule auf V9 umstellen und wiederanlaufen lassen

Der folgende Abschnitt bewahrt den historischen Story-3.3-Nachweis. Nach Anwendung
von V10 gelten für jeden unterstützten Start und jede Rücknahme zusätzlich die
verbindlichen Prüfungen aus [API-Übergang](deploy/api-transition.md); der frühere
V9-Nachweis allein berechtigt keinen Altstart auf dem aktuellen Schema.

Story 3.3 verschiebt mit der neuen Migration
`V9__split_finance_schemas.sql` die vorhandenen Tabellen mittels `SET SCHEMA`:
`expense_budget.expenses` wird `expenses.expenses`, `expense_budget.budgets`
wird `budget.budgets`. Tabellenidentität, Constraints, Indizes, RLS und sämtliche
Bestandszeilen bleiben erhalten. Das alte Schema entfällt. `savings_goals.goals`
und der eingefrorene v1-Vertrag bleiben erhalten. Öffentliche Modulzugänge
verwenden eine äußere Kontotransaktion; alle acht Finanzmutationen erwerben
dieselbe Seed-14-Kontosperre vor Fachlesen und Kalenderbestimmung. Die Monatsansicht
liest ihre getrennten Projektionen in einem read-only REPEATABLE-READ-Snapshot.

Der kontrollierte lokale Umstellungsweg lautet:

1. Backend und laufende Finanzzugriffe vollständig beenden; synthetischen
   V8-Bestand bei Bedarf sichern. Kein altes API-Artefakt parallel weiterbetreiben.
2. `./scripts/start-local/start-database.sh` ausführen. Der administrative
   Rechteabgleich arbeitet auch bei einem bereits initialisierten Volume.
3. Das neue Backend starten. Flyway prüft die unveränderten V1–V8-Migrationen
   und führt V9 vor den Finanzanwendungsfällen mit der Migrationsrolle aus.
   Bei einem Fehler bleibt der Start fehlgeschlagen; keine manuelle
   Datenkopie oder Änderung der alten Migrationen vornehmen.
4. Eigene Ausgabenhistorie, Budget, Monatswerte und Ziele über die bisherigen
   v1-Finanzrouten prüfen. Der Kontozugang bleibt unter v1 und v2 nutzbar.

`FinanceMigrationIT` prüft einen frischen sowie einen befüllten V8-Stand mit zwei
Konten, drei Budget-/Ausgabenmonaten und manuellem Fortschritt. Vollständige
Zeilen- und OID-Vergleiche belegen den Erhalt; derselbe Rechteabgleich läuft
vor und wiederholt nach V9 ohne Passwortänderung. Anschließend startet der Test
das tatsächlich paketierte JAR gegen beide migrierten Datenbanken. Beim befüllten
Bestand lädt es für beide Konten alle bisherigen Finanzansichten über HTTP.
`FinanceCoordinationIT` belegt außerdem gemeinsame Verbindung/Transaktion,
Rollback nach Modulschreiben und bei Commitfehler, acht Sperrpfade, Monatswechsel,
Kontext-/Poolgrenzen und einen Commit zwischen getrennten Monatsprojektionen.

Ein Rücknahmestand muss genau gegen V9 und die beschriebenen Rechte geprüft sein.
Der Vorgänger `3afa328e23a2766fd2f26ee9d1162737510b9b1d` verwendet noch
`expense_budget`-SQL und ist dafür ungeeignet. Für die weitere Einführung wird
das unten identifizierte geprüfte Story-3.3-JAR aufbewahrt. Bei einer Rücknahme
alle laufenden API-Vorgänge beenden und dieses Artefakt mit derselben geschützten
Konfiguration gegen den erhaltenen V9-Bestand neu starten. Keine Downmigration,
Tabellenrückkopie, Datenkürzung oder Fortschrittsrekonstruktion ausführen.
Negative Fortschritte bleiben durch Validierung und Datenbankgrenze gesperrt;
Automatikobjekte oder Automatikrouten entstehen mit dieser Story nicht.
V1-Stilllegung, die vollständige Freigabebarriere und Produktion bleiben eigene
Voraussetzungen. Nach ersten signierten Werten oder Monatswirkungen ist ein
Rückfall auf v1 ausgeschlossen.

Geprüftes Rücknahmeartefakt vom **2026-10-27**: `tnbp-0.1.0-SNAPSHOT.jar`,
SHA-256 `629bcfacb7079922000e3a776a00fa510104b8fb819ec4891420ae085b480a46`.
Eine unveränderte lokale Kopie liegt unter
`.local/releases/story-3.3/tnbp-629bcfacb7079922000e3a776a00fa510104b8fb819ec4891420ae085b480a46.jar`;
`verified-artifact.txt` daneben hält Prüfsumme und Prüfumfang fest.
Der abschließende Backendlauf umfasst 44 Unit-/Architektur- und 145
Integrationstests einschließlich des paketierten Wiederanlaufs. Beide
Vertragsprüfungen samt Client-/SPA-Kompilierung, zwölf Python-Prüfungen und
162 HTTPS-Browserfälle waren erfolgreich. Der geprüfte Quellstand ist als lokaler
Release-Snapshot `b4679692fd63f479cd0ab0cdca99942a512d521d` unter
`refs/bmad/story-3.3-release` gesichert. Dieser Snapshot verändert weder den
aktuellen Branch noch den Arbeitsbaum; die oben genannte JAR-Prüfsumme identifiziert
das tatsächlich ausgeführte Artefakt. Der Snapshot ist lokal und wurde nicht gepusht.

Die Python-Prüfungen prüfen neben dem Linkgenerator die getrennten Basisverträge,
Erstverträge und das Abbrechen des Vertragschecks bei Kompatibilitätsfehlern in
isolierten Git-Repositories. Die Zugangstests werden für beide HTTP-Versionen
gegen PostgreSQL wiederverwendet. Zusätzliche `AccessVersionsIT`-Fälle prüfen
Versionswechsel, konkurrierenden Refresh durch beide Adapter, gemeinsame
Widerrufe, manipulierte JWT-Claims, Cookie-only-Ablehnung, unbekannte Routen und
einen erst beim Logout-Commit auftretenden Fehler ohne Erfolgsbestätigung.

`verify` führt die Unitfälle und die HTTP-Integrationstests für Registrierung,
Sitzungen, Budget, Ausgaben, Monatsübersicht und Sparziele mit einer echten,
temporären PostgreSQL-18.6-Instanz aus. Dafür wird **kein Docker** benötigt.
Die Binärdateien werden als gepinnte Maven-Testabhängigkeiten geladen; PostgreSQL
muss als unprivilegierter Benutzer laufen. Die Tests verwenden die getrennten
Migrations-/Laufzeitrollen. Sie prüfen unter anderem die exakte Ablaufgrenze,
normalisierte parallele Duplikate, Feldfehler unabhängig vom Kontobestand,
Unicode/NFC, vollständig verifizierbare gesalzene Hashes, Commitfehler, Logs und
Persistenz über Linkrotation und API-Neustart. Budgetfälle prüfen zusätzlich
Centgrenzen und JSON-Typen, Berlin-Monatswechsel, zwei Konten, fehlende/ungültige
JWTs, Commitfehler sowie direkte RLS-/Rechteprüfungen und Kontextfreiheit nach
Transaktionsende. Ausgaben- und Sparzieltests decken außerdem Bearbeiten/Löschen,
parallele Änderungen, Feldrechte und den Erhalt unveränderlicher Daten ab;
Monatsübersichtstests prüfen die konsistente Berechnung einschließlich fehlendem
Budget, Nullbudget und Überschreitung. Sparzielfälle prüfen Kalenderdaten,
Gesamtfortschritt, Übererfüllung und die Trennung von Ziel- und Fortschrittsänderungen.

Playwright startet selbst eine temporäre Test-API mit PostgreSQL und den
HTTPS-Frontend-Entwicklungsserver. Die Ports **8080 und 4200 müssen frei sein**.
Die Tests benutzen ausschließlich synthetische Konten und ein festes Testgeheimnis.
Browserfälle prüfen zusätzlich die exakte Budgeteingabe/-ausgabe bis zum Maximum,
Nullbudget, Ausgabenhistorie, Monatsübersicht und Monatswechsel sowie Sparzielanlage,
Fortschritt, Bearbeiten und Löschen. Sie decken Reload,
zurückgehaltene/verlorene/späte Antworten und Entwurfsverwerfung ab und
prüfen echten HTTP-Zugriff, Fehlerretry, Offlinezustand,
Doppelsendesperre, Browserpersistenz und axe sowie Tastatur/200-%-Text bei
320, 390, 768 und 1280 CSS-Pixeln. Mit
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome` lässt sich ein
vorhandenes Chromium verwenden. Traces sind deaktiviert, damit Test-Requestbodys
nicht als Traceartefakt abgelegt werden. Fehler-Screenshots enthalten nur
synthetische Testdaten. Automatische Zugänglichkeitsprüfungen ersetzen keine
vollständige manuelle Screenreader-Prüfung.

Die [GitHub-Action](.github/workflows/ci.yml) läuft bei Push und Pull Request mit
separaten Jobs für Linkgenerator, Vertrag, Backend und Browser. Die oben genannten
Befehle bilden diese Prüfungen lokal ab.

Die Browserprüfungen prüfen die echten Secure-Cookies über HTTPS einschließlich Reload/Rotation, Logout, späten Antworten und axe. Playwright vertraut ausschließlich im Test dem lokalen Entwicklungszertifikat. Die Test-API hat einen festen synthetischen Schlüssel; Anwendungsschlüssel werden nicht eingebaut.

## Vor echten Nutzerdaten

Der lokale Start verwendet den gemeinsamen geschützten API-Startguard und prüft
Bereitschaft über `/api/v2/access/csrf`. Die Oberfläche spricht ausschließlich v2.
Im Kompatibilitätsmodus bleibt v1 für die bisherigen Regressionstests verfügbar;
nach bestätigter Stilllegung wird v1 bereits vor Controller-/Finanzarbeit mit
401 `CLIENT_UPDATE_REQUIRED` abgewiesen. Negative Fortschritte und Monatsautomatik
bleiben geschlossen.

Der vollständige [Ablöse-, Fehler- und Rücknahmeweg](deploy/api-transition.md)
beschreibt den registrierten Linux-Subreaper samt vollständiger Nachkommenschaft,
die DB-Admission der konfigurierten Rollen, technische Versionsmarker und die
zulässige Alt-JAR-Prüfung. Geschützte Metadaten binden Prozess und tatsächliche
PostgreSQL-Datenbank; Konfigurationswechsel werden vor einem Stopp abgewiesen.
Alle administrativen Phasen sind über DB-Advisory-Lock und eine geschützte feste
Cluster-/DB-Sperre unabhängig vom Metadatenverzeichnis serialisiert, auch vor V10
und bis zum Ende bereits gestarteter Migrationskinder nach einem Guardabbruch.
Ein veralteter Ordner kann die Admission eines fremden aktiven Eigentümers nicht
schließen. Nach Bereitschaft bleibt nur der dauerhafte Laufzeit-Lebenszyklus aktiv.
Ein nachgewiesener anderer Hostboot hat einen kontrollierten Wiederanlauf,
während ungeklärter Supervisorverlust im selben Boot gesperrt bleibt. Die
Altprüfung belegt Cookieattribute bei Ausgabe/Rotation/Löschung, geschlossene
Negativschreibwerte, Security-Ablehnungen, gespeicherte Mutationswirkungen und
Kontotrennung mit zwei synthetischen Konten. Der bestehende geschützte volle Datenbankadministrator
ist erforderlich; Web-/Migratorrollen erhalten keine zusätzlichen Betriebsrechte.
Die exakt gebundene JAR migriert ohne HTTP-/Finanzannahme, bevor der endgültige
Schema-/Rollenzustand und die instanzgebundene v2-Bereitschaft bestätigt werden. `npm --prefix frontend run
e2e:transition` führt den gesonderten HTTPS-Übergang mit unverändertem Altbundle,
aktuellem statischem Build und derselben flüchtigen PostgreSQL-Datenbank aus.
Er benötigt vollständige lokale Git-Historie und lädt den festen Caddy-Testserver.

Bei einem Aktualisierungshinweis „Seite vollständig neu laden“ auslösen.
Gespeicherte Werte bleiben erhalten; nicht gespeicherte Entwürfe werden verworfen.
Ein tatsächlich alter v1-Stand schließt seine persönliche Ansicht beim nächsten
geschützten Zugriff beziehungsweise Refresh. Danach die öffentliche App-Adresse
vollständig neu laden und vor einer erneuten Mutation den aktuellen Stand prüfen.

Die lokale Anwendung ist für synthetische Daten vorgesehen. Vor dem Einsatz
echter Finanzdaten sind laut [Architektur](_bmad-output/planning-artifacts/architecture/architecture-try-not-to-be-poor-2026-10-19/ARCHITECTURE-SPINE.md)
und [Epics](_bmad-output/planning-artifacts/epics.md) noch folgende Punkte zu klären
und umzusetzen:

- Export, Löschung, Aufbewahrung und Kontowiederherstellung.
- VPS-Größe, Domain/DNS, Monitoring und geschützte Produktionskonfiguration.
- Backup-Ziel außerhalb des VPS, Verschlüsselung, Häufigkeit, Aufbewahrung und
  Wiederherstellungsziele sowie ein tatsächlich getesteter Wiederherstellungsweg.
- Bewertung von Anmeldedrosselung und begrenzter paralleler Argon2-Prüfung anhand
  des Produktionslastprofils; siehe [zurückgestellte Arbeiten](_bmad-output/implementation-artifacts/deferred-work.md).

Die geplante Produktionsform ist ein deutscher VPS mit Compose, Caddy, API und
PostgreSQL; nur Caddy soll öffentlich erreichbar sein. Die dafür benötigte
Produktionskonfiguration liegt noch nicht vor.
