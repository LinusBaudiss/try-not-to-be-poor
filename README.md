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
„Sparziele“ ist über die Hauptnavigation erreichbar.

Laut [Sprintstatus](_bmad-output/implementation-artifacts/sprint-status.yaml)
sind beide Epics und alle neun Stories (1.1–1.6 und 2.1–2.3) `done`.
Die Retrospektiven sind noch offen und optional. Die Implementierung des
geplanten Funktionsumfangs ist abgeschlossen; die
[Voraussetzungen für Produktivbetrieb](#vor-echten-nutzerdaten) sind noch offen.

## Voraussetzungen

- Node **24.22.0**, npm (mit Node geliefert), JDK **25** einschließlich `javac`.
- Maven **3.10.0** wird durch `backend/mvnw` geladen; kein globales Maven nötig.
- Für die manuelle lokale Anwendung: Docker mit Compose und PostgreSQL **18.6**.
- Für Prüfungen: Linux x86_64, Python 3, curl, Git, sha256sum und **unzip**.
  Der unveränderte Herstellerwrapper benötigt unzip für das mit ZIP-Prüfsumme
  gepinnte Maven-Archiv; sein TAR-Fallback passt nicht zu dieser Prüfsumme.
- Spring Boot **4.1.1**, Angular **22.2.3**, OpenAPI Generator **7.26.0** und
  oasdiff **1.30.0** sind festgelegt. npm-Abhängigkeiten stehen im Lockfile.

Frontend und Backend besitzen getrennte Builds. Die statische SPA spricht
ausschließlich per HTTP mit `/api/v1`. Der Vertrag liegt in
`api-contract/openapi.yaml` (OpenAPI 3.0.4). Client und Spring-Interfaces werden
generiert, nicht von Hand geändert oder versioniert.

## Lokal starten

Nur synthetische Daten verwenden. Eine Produktionskonfiguration ist noch nicht
vorhanden; `deploy/compose.local.yaml` startet nur PostgreSQL. Vor echten Nutzerdaten müssen Datenschutz und
Betrieb geklärt sowie verschlüsselte Backups außerhalb des VPS und eine geprüfte
Wiederherstellung vorhanden sein.

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
muss SPA-Routen auf `index.html` zurückführen und `/api/v1` zur API weiterleiten.

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

`GET /api/v1/access/csrf` liefert Spring Securitys CSRF-Token (`no-store`). Vor jeder Cookie-Mutation holt der Tab einen frischen Token und
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
verlorenen Antwort kann der Server bereits gespeichert haben. Ein bewusster
Retry setzt denselben Monatswert erneut. Neuladen lädt den bestätigten
Serverbestand; Entwürfe werden nicht im Browser gespeichert. Abmeldung,
Sitzungsende und Kontowechsel verwerfen Beträge und Entwürfe sowie später
eintreffende Antworten.

`GET`/`PUT /api/v1/expense-budget/budget` akzeptieren ausschließlich ein
verifiziertes Bearer-JWT; Cookies und Eigentümerangaben bestimmen keinen
Budgetzugriff. Alle Finanzantworten tragen `Cache-Control: no-store`.

## Ausgaben erfassen, bearbeiten und löschen

Unter „Monat“ einen Namen und einen positiven Eurobetrag eingeben, z. B.
`12,50`, und „Ausgabe speichern“ wählen. Komma oder Punkt sind erlaubt,
Tausendertrennzeichen und mehr als zwei Nachkommastellen werden abgelehnt.
Einzelbeträge und die Ausgabensumme jedes Monats dürfen höchstens
`9007199254740991` Cent betragen; überschreitende Änderungen werden abgelehnt.
Das Erfassungsdatum setzt der Server nach `Europe/Berlin`.

„Alle Ausgaben“ zeigt die eigene Historie über alle Monate, mobil als
beschriftete Einträge und auf breiten Ansichten als Tabelle. „Bearbeiten“ ändert
Name und Betrag; das Erfassungsdatum bleibt erhalten. „Löschen“ verlangt eine
Bestätigung und entfernt den Eintrag endgültig. Änderungen aktualisieren
Historie und Monatsübersicht; nur Ausgaben des laufenden Monats fließen in das
aktuelle Restbudget ein. „Ausgaben aktualisieren“ lädt die Historie erneut.

## Sparziele verwenden

Unter „Sparziele“ einen Namen und einen positiven Zielbetrag in Euro angeben.
Das optionale Zieldatum wird als Kalenderdatum im Format `JJJJ-MM-TT` eingegeben;
vergangene Daten sind erlaubt. Neue Ziele beginnen mit `0,00 €` Fortschritt.

„Fortschritt aktualisieren“ setzt den **gesamten bisher erreichten Betrag** neu;
es werden keine einzelnen Beiträge oder Verläufe gespeichert. Null und Beträge
über dem Zielbetrag sind erlaubt. Die Anzeige nennt den tatsächlichen Betrag,
Anteil und gegebenenfalls die Überschreitung; der Balken endet bei 100 %.
Zielbetrag und Fortschritt dürfen jeweils höchstens `9007199254740991` Cent
betragen. Es gelten dieselben Euro-Eingaberegeln wie beim Budget.

„Bearbeiten“ ändert Name, Zielbetrag und Zieldatum; ein leeres Datumsfeld entfernt
das Datum. Der Fortschritt bleibt dabei erhalten. „Löschen“ verlangt eine
Bestätigung und entfernt das Ziel endgültig. „Sparziele aktualisieren“ lädt die
eigenen Ziele erneut. Sparziele beeinflussen das Restbudget nicht.

Für alle Finanzfunktionen gilt: Erfolg wird erst nach bestätigter Speicherung
angezeigt. Bei Fehlern oder offline bleiben Entwürfe nur im offenen Tab erhalten;
offline sind Mutationen gesperrt. Bei verlorenen Antworten kann eine Mutation
bereits gespeichert sein; vor erneutem Anlegen den Serverbestand prüfen.
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

`check-contract.sh` validiert den Vertrag mit Generator 7.26.0, generiert und
kompiliert die verwendeten Spring-Boot-4-Interfaces und den Angular-22-Client.
`CONTRACT_BASE_REF=<commit>` setzt den Vergleichscommit; ohne Variable wird `HEAD`
verwendet. Fehlt dort der Vertrag, behandelt das Skript ausdrücklich den
Erstvertrag. Bei vorhandenem Basisvertrag blockiert oasdiff 1.30.0 mit
`--fail-on ERR` inkompatible Änderungen; diese benötigen `/api/v2`. CI verwendet
die PR-Basis beziehungsweise den vorherigen Push-Commit.

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
