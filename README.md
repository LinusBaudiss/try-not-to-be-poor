# Try Not to Be Poor

Private Ausgabenübersicht. Implementiert sind Kontoanlage, Sitzungen und Monatsbudget (Story 1.1–1.3): ein eigenes Konto mit
E-Mail und Passwort über einen aktiven Registrierungslink anlegen. Jede Person
mit diesem Link kann ein unabhängiges Konto erstellen. Eine Registrierung meldet
nicht an. Danach führt die Anmeldung zur geschützten Ansicht „Monat“ mit dem persönlichen fortlaufenden Monatsbudget.

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

Nur synthetische Daten verwenden. Produktionsdeployment und echte Nutzerdaten
sind nicht Teil dieser Story. Vor echten Nutzerdaten müssen Datenschutz und
Betrieb geklärt sowie verschlüsselte Backups außerhalb des VPS und eine geprüfte
Wiederherstellung vorhanden sein.

Einmalig zufällige lokale Datenbankkennwörter in einer geschützten Datei anlegen:

```bash
python3 - <<'PY'
from pathlib import Path
import os, secrets
folder = Path('.local')
folder.mkdir(mode=0o700, exist_ok=True)
folder.chmod(0o700)
descriptor = os.open(folder / 'database.env', os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
with os.fdopen(descriptor, 'w') as output:
    for name in ('DB_ADMIN_PASSWORD', 'DB_MIGRATION_PASSWORD', 'DB_RUNTIME_PASSWORD'):
        output.write(name + '=' + secrets.token_urlsafe(32) + '\n')
PY
docker compose --env-file .local/database.env -f deploy/compose.local.yaml up -d --wait
python3 scripts/create-registration-link.py --base-url https://localhost:4200
```

Die Datenbank ist nur auf `127.0.0.1:5432` gebunden. Das Initialisierungsskript
legt `tnbp_migrator` und `tnbp_runtime` mit getrennten Kennwörtern an. Die
Laufzeitrolle ist weder Superuser noch Tabellenbesitzer und besitzt kein
`BYPASSRLS`. Sie darf Konten einfügen, die für Anmeldung notwendigen Spalten lesen und Sitzungsfamilien/Tokenhistorie pflegen; ein Startcheck lehnt
privilegierte Laufzeitrollen ab. Budgetzeilen werden zusätzlich durch SQL-Nutzerfilter und erzwungene PostgreSQL-RLS geschützt; jeder Budgetzugriff setzt `app.user_id` ausschließlich transaktionslokal aus dem geprüften JWT-`sub`. Ohne Kontext sind keine Zeilen sichtbar oder schreibbar. Die Laufzeitrolle darf Budgetbeträge lesen, anlegen und ändern, jedoch keine Budgetzeilen löschen oder Eigentümer/Monate ändern. Flyway verwendet ausschließlich die
Migrationsrolle. Der benannte Compose-Datenträger erhält Konten bei Neustarts.
Geänderte Kennwörter in der lokalen Datei ändern keine bereits initialisierte
Datenbank; Rollenkennwörter müssen dann gezielt in PostgreSQL angepasst werden.

Vor dem Backendstart zuerst [Sitzungsschlüssel und HTTPS](#sitzungsschlüssel-und-https) einrichten; dabei wird die benötigte `.local/session.env` angelegt.

Backend in einem Terminal starten:

```bash
set -a
. .local/database.env
. .local/registration.env
. .local/session.env
set +a
./backend/mvnw -f backend/pom.xml spring-boot:run
```

Frontend in einem zweiten Terminal starten:

```bash
npm --prefix frontend ci
npm --prefix frontend start -- --host localhost --ssl
```

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
python3 scripts/create-registration-link.py --base-url https://localhost:4200 --expires-at 2026-10-23T18:00:00Z

# Widerruf: Registrierung deaktivieren und die lokale Linkdatei entfernen.
python3 scripts/create-registration-link.py --revoke
```

Nach jeder Änderung die neue Konfiguration laden und die API neu starten. Bei
Widerruf in einem bereits benutzten Terminal zunächst `unset REGISTRATION_LINK_SHA256
REGISTRATION_LINK_ISSUED_AT REGISTRATION_LINK_EXPIRES_AT` ausführen und dann
`registration.env` neu laden. Alte Links sind nach Aktivierung der neuen
Konfiguration gesperrt; vorhandene Konten bleiben erhalten. `--output-dir` erlaubt
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

Vor dem ersten Backendstart einen zufälligen lokalen Schlüssel einmalig erzeugen:

```bash
python3 - <<'PYKEY'
from pathlib import Path
import base64, os, secrets
folder = Path('.local')
folder.mkdir(mode=0o700, exist_ok=True)
fd = os.open(folder / 'session.env', os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
with os.fdopen(fd, 'w') as output:
    output.write('SESSION_SIGNING_KEY=' + base64.b64encode(secrets.token_bytes(32)).decode() + '\n')
    output.write('SESSION_ISSUER=tnbp-local\nSESSION_AUDIENCE=tnbp-spa-local\n')
    output.write('SESSION_ORIGIN=https://localhost:4200\n')
PYKEY
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
bleiben erhalten. Ausgaben, Restbudget und Budgetlöschung folgen in späteren
Stories.

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

`verify` führt die Unitfälle und die `RegistrationIT`-/`SessionIT`-/`BudgetIT`-HTTP-Tests mit einer echten,
temporären PostgreSQL-18.6-Instanz aus. Dafür wird **kein Docker** benötigt.
Die Binärdateien werden als gepinnte Maven-Testabhängigkeiten geladen; PostgreSQL
muss als unprivilegierter Benutzer laufen. Die Tests verwenden die getrennten
Migrations-/Laufzeitrollen. Sie prüfen unter anderem die exakte Ablaufgrenze,
normalisierte parallele Duplikate, Feldfehler unabhängig vom Kontobestand,
Unicode/NFC, vollständig verifizierbare gesalzene Hashes, Commitfehler, Logs und
Persistenz über Linkrotation und API-Neustart. Budgetfälle prüfen zusätzlich
Centgrenzen und JSON-Typen, Berlin-Monatswechsel, zwei Konten, fehlende/ungültige
JWTs, Commitfehler sowie direkte RLS-/Rechteprüfungen und Kontextfreiheit nach
Transaktionsende.

Playwright startet selbst eine temporäre Test-API mit PostgreSQL und den
HTTPS-Frontend-Entwicklungsserver. Die Ports **8080 und 4200 müssen frei sein**.
Die Tests benutzen ausschließlich synthetische Konten und ein festes Testgeheimnis.
Browserfälle prüfen zusätzlich die exakte Budgeteingabe/-ausgabe bis zum Maximum,
Nullbudget, Reload, zurückgehaltene/verlorene Antworten und Entwurfsverwerfung. Sie
prüfen echten HTTP-Zugriff, Fehlerretry, Offlinezustand,
Doppelsendesperre, Browserpersistenz und axe sowie Tastatur/200-%-Text bei
320, 390, 768 und 1280 CSS-Pixeln. Mit
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome` lässt sich ein
vorhandenes Chromium verwenden. Traces sind deaktiviert, damit Test-Requestbodys
nicht als Traceartefakt abgelegt werden. Fehler-Screenshots enthalten nur
synthetische Testdaten. Automatische Zugänglichkeitsprüfungen ersetzen keine
vollständige manuelle Screenreader-Prüfung.

Die GitHub-Action prüft Vertrag, Backend und Browser getrennt. Sie ist lokal
nachgebildet; ein tatsächlicher GitHub-Lauf erfolgt erst nach einem späteren Push.

Die Browserprüfungen prüfen die echten Secure-Cookies über HTTPS einschließlich Reload/Rotation, Logout, späten Antworten und axe. Playwright vertraut ausschließlich im Test dem lokalen Entwicklungszertifikat. Die Test-API hat einen festen synthetischen Schlüssel; Anwendungsschlüssel werden nicht eingebaut.
