# Kontrollierter Einzelhostwechsel auf API v2

Dieser Ablauf gilt für synthetische Daten und eine API-Instanz auf einem Linux-Host.
Er ist keine Produktionsfreigabe. Negative Fortschrittswerte und Monatsautomatik
bleiben auch nach erfolgreicher Stilllegung serverseitig gesperrt.

## Artefakte und geschützter Zugang

- Der v1-Vertrag `api-contract/openapi.yaml` bleibt archiviert und unverändert.
  Die neue Oberfläche verwendet ausschließlich `api-contract/v2/openapi.yaml`.
- `scripts/api-release.py` ist der gemeinsame administrative Start-, Stopp-,
  Ablöse- und Rücknahmeweg. Er benötigt Java 25, [Python ab 3.11](https://docs.python.org/3/library/hashlib.html#hashlib.file_digest)
  (`hashlib.file_digest`) und [Linux ab Kernel 5.3](https://man7.org/linux/man-pages/man2/pidfd_open.2.html) mit lesbarem `/proc`,
  verfügbaren `pidfd_open`-/`pidfd_send_signal`-APIs und
  `prctl(PR_SET_CHILD_SUBREAPER)` sowie einen administrativen PostgreSQL-Zugang. Er entnimmt den JDBC-Treiber der angegebenen
  Werkzeug-JAR; ein zusätzlich installiertes `psql` ist nicht erforderlich.
- `DB_URL`, `DB_ADMIN_USER`, `DB_ADMIN_PASSWORD`, die Laufzeit-/Migrationspasswörter
  und die Sitzungskonfiguration kommen ausschließlich aus geschützten externen
  Dateien oder der Betriebsumgebung. `.local/database.env`, `registration.env`
  und `session.env` sind lokale Beispiele; niemals in Versionskontrolle aufnehmen.
  Supervisor und Webserver erhalten nur das Laufzeitpasswort; Admin- und
  Migrationspasswort bleiben im Guard beziehungsweise der administrativen Phase.
- Der Guard legt technische Metadaten im Verzeichnis `.local/api-release` an
  (0700, Metadaten 0600, gebundene JAR-Kopien 0400, gleicher Betriebsnutzer). Keine Konten, Finanzwerte oder
  Monatsdaten stehen darin. Prozessidentität umfasst PID, Kernelstartzeit,
  Prozessgruppe, Sitzung und Boot-ID. `database.json`, `launch.json`,
  `instance.json` und `lifecycle.json` binden denselben JDBC-Host/Port/Datenbanknamen, Optionsfingerabdruck,
  die tatsächliche PostgreSQL-Clusterkennung, Datenbank-OID und Serveradresse sowie
  Laufzeit-/Migrationsrollen. Jede abweichende Konfiguration scheitert vor
  Signalen, Admission oder Versionsänderungen; ein Metadatenverzeichnis gehört
  dauerhaft zu genau diesem technischen Datenbankziel. Der gebundene Boot-/
  Eigentumsbeleg wird bereits vor Erwerb des DB-Lebenszyklus dauerhaft geschrieben;
  Dateiinhalt und der nach Umbenennung synchronisierte Verzeichniseintrag müssen
  vor dem DB-Erwerb bestätigt sein; ein Syncfehler sperrt den Erwerb. Wiederanlauf
  ist dadurch auch vor Spawn oder Supervisorregistrierung prüfbar.
  Er schließt ausschließlich den eigenen alten DB-Lebenszyklus, niemals einen
  inzwischen fremden aktuellen Eigentümer. Der interne Supervisorstart prüft zusätzlich
  PID/Kernelstartzeit seines lebenden Guard-Elternprozesses; ein direkter
  Wiederholungsaufruf kann keinen gespeicherten Altstart ausführen. Jede
  JDBC-Verbindung erhält ein eindeutiges
  `ApplicationName=tnbp-api-<UUID>` für ausführbare API-/Migrationsarbeit. Rein administrative
  Sperrverbindungen verwenden getrennt `tnbp-release-guard-<UUID>`. Eine zusätzliche rein technische
  DB-Lebenszyklusregistrierung verhindert einen parallelen Start oder eine
  Zertifizierung mit einem anderen lokalen Metadatenverzeichnis, selbst wenn
  der registrierte API-Prozess noch keine DB-Verbindung geöffnet hat.
- Der bestehende geschützte vollständige Datenbankadministrator ist erforderlich.
  `deploy/api-release.sql` prüft diese Voraussetzung. Es gibt keine delegierte
  Hilfsrolle; Zertifizierung und synthetisches Cleanup benötigen den vollen
  administrativen Zugang. Webrolle und Migrator erhalten keine zusätzlichen
  Betriebs- oder fremden Finanzdatenrechte.
- Guard und Altprüfer binden dieselben `DB_URL`, `DB_RUNTIME_USER` und
  `DB_MIGRATION_USER`. Abweichende geerbte `SPRING_DATASOURCE_*`,
  `SPRING_FLYWAY_*`, `SPRING_CONFIG_*`, `SPRING_APPLICATION_JSON` und JVM-Optionen
  werden vor dem Start abgewiesen. Geheimnisse bleiben in der Prozessumgebung.

Alle administrativen Befehle halten vor der ersten Zustands-/Eigentumsentscheidung
bis zur Bestätigung oder tatsächlichen Instanzbereitschaft dieselbe PostgreSQL-
Advisory-Sperre auf einer einzigen Verbindung. Die Verbindung wird niemals unter
Verlust der Sperre erneuert. Das gilt auch vor V10 und unabhängig von lokalen
Verzeichnissen, DB-Hostaliasen und `TMPDIR`. Zusätzlich liegt eine feste lokale
Sperre in `/tmp/tnbp-api-release-locks`, benannt nach tatsächlicher Clusterkennung
und Datenbank-OID. Dieses Verzeichnis ist 0700, die Sperrdateien sind 0600; ein
abweichender Besitzer oder ungeschützter Zustand sperrt den Betrieb. Alle
Betriebsaufrufe auf diesem Host benötigen denselben Betriebsnutzer. Diese Dateien
nicht während laufender administrativer Arbeit entfernen. Nur administrative
Migrationskinder erben den Sperrdeskriptor: Auch beim Tod ihres Guard-Elternprozesses
bleibt die Phase bis zu ihrem tatsächlichen Ende exklusiv. API und Supervisor
erben ihn nicht; nach Bereitschaft endet die administrative Sperre, der dauerhafte
DB-Lebenszyklus bleibt aktiv. Ein fremder aktiver Eigentümer wird im Stoppweg vor
Rollenänderungen oder Signalen abgewiesen. Ein bekannt beendeter Datensatz mit
wiederverwendeter PID bezieht sich weiter nur auf seine alte Kernelidentität.

## Vorbereitende Prüfung

Das genaue freizugebende Artefakt aufbewahren; nach der Prüfung nicht neu bauen
oder ersetzen. Die Guard-Metadaten binden die tatsächliche SHA-256 der JAR und
Fingerabdrücke des konkreten Schemas und der Rollen. Schemafingerabdruck umfasst
Flyway-Prüfsummen, Tabellen/Spalten/Constraints, Eigentümer, ACLs, RLS-Policies,
Funktionen und Trigger einschließlich Aktivierungszustand; Constraints sind ihrer
Eigentümerrelation eindeutig zugeordnet; wirksame Spaltenkollationen einschließlich
Definition/Version und Viewdefinitionen sind enthalten; Default-ACL-Objekttypen und
Mitgliedschaftsgrantoren besitzen vollständige stabile Sortierschlüssel; Rollenfingerabdruck umfasst technische Rolleneigenschaften
und vollständige transitive Mitgliedschaften unabhängig von Rollenpräfixen,
Verbindungslimits, Gültigkeit und DB-Rolleneinstellungen, keine Passwörter.

```sh
./scripts/check-contract.sh
python3 -m unittest discover -s scripts/tests -v
./backend/mvnw -f backend/pom.xml verify
npm --prefix frontend run e2e
npm --prefix frontend run e2e:transition
```

CI trennt `backend`/`browser` für den unterstützten Kompatibilitätsmodus von
`backend-retirement`/`browser-transition` für die Versionsbarriere. Der vollständige
lokale Backendlauf prüft beide Modi mit getrennten synthetischen Datenbanken.
Der Backendlauf prüft v1/v2 im unterstützten Kompatibilitätsmodus sowie gesondert
die Stilllegung mit echten Prozessen und PostgreSQL. Er hält GETs vor Fachlesen,
laufendes SQL, Mutationen vor Commit und Antworten nach Commit ausschließlich
mit Testcode in einer synthetischen Test-JAR an. Ein erfolgreiches HTTP-Timeout
oder ein geschlossener Browser gilt dabei nie als Prozess-/Transaktionsnachweis.
Der Browserlauf verwendet den unveränderten v1-Quellstand
`5cd387db54cc94aa35e7af02ffd17b1a4480a9f1` und den aktuellen statischen v2-Build.
Er behält dieselbe temporäre Datenbank über den tatsächlichen API-Neustart. Die
statischen Folgetests stellen Stilllegungsmodus und Neubundle auch im gefilterten
Einzellauf ausdrücklich her. Ein gescheiterter Ersatzstart wird sofort über den
registrierten Stoppweg beendet; der Treiber wartet auf das tatsächliche Guardende.

## Start und Ablösung

Zuerst V10 im Kompatibilitätsmodus durch den neuen Release anwenden und dessen
v2-Bereitschaft erfolgreich nachweisen. Ein initialer Guardstart ist auch vor V10
zulässig; ausschließlich ein neuer Release darf diesen Bootstrap durchführen.
Ein altes Binary startet niemals ohne eindeutigen Versionszustand. Fehlt nach
verzeichneter V10-Migration die technische Tabelle, scheitert jeder Start.
Der Guard schließt zunächst die DB-Admission mit `NOLOGIN` für die tatsächlich
konfigurierten Laufzeit-/Migrationsrollen und führt die exakt gebundene neue JAR
mit `--api.version.migrate-only=true` aus. Diese administrative Flyway-Phase
hat keinen HTTP-Listener und erzeugt keinen Spring-/Finanzkontext. Sie verbindet
als geschützter Administrator und führt DDL nach `SET ROLE` mit den unveränderten
Migratorrechten aus. Erst danach werden der endgültige Schema-/Rollenzustand
geprüft und die Loginrollen atomar mit der Bestätigung wiederhergestellt. Der
anschließende Serverstart führt keine Migration mehr aus. Normale Starts berücksichtigen
danach immer den dauerhaften Zustand. Ein konfiguriertes `API_VERSION_MODE`, das
diesem Zustand widerspricht, bricht ab. Direkte Starts der aktuellen JAR haben
zusätzlich die frühe Startprüfung vor Aufbau ihrer HTTP-Sicherheitskette.

```sh
python3 scripts/api-release.py start --release /geschuetzter-pfad/neue-api.jar
```

Der Start blockiert bei einem noch laufenden registrierten Subreaper/API-Prozess oder
ungeklärten alten Laufzeit-/Migrationsverbindungen. Nur ein erfolgreicher
`GET /api/v2/access/csrf` mit gültigem Tokenkörper bestätigt Bereitschaft;
401/403/404/503 werden nicht als Bereitschaft akzeptiert. Zusätzlich muss der
registrierte API-Prozess den Linux-Listenersocket besitzen; eine erfolgreiche
Tokenantwort eines fremden Listeners genügt auch beim Altbinary nicht.

In einem zweiten administrativen Terminal, mit derselben geschützten Konfiguration:

```sh
python3 scripts/api-release.py snapshot --release /geschuetzter-pfad/neue-api.jar
python3 scripts/api-release.py retire --release /geschuetzter-pfad/neue-api.jar
python3 scripts/api-release.py start --release /geschuetzter-pfad/neue-api.jar
```

`retire` schließt zuerst neue Datenbankanmeldungen der konfigurierten
Laufzeit-/Migrationsrollen. Diese committed `NOLOGIN`-Admission bleibt während
sämtlicher Stopp-, Prüf- und Migrationsschritte geschlossen. Der registrierte
Linux-Subreaper hält auch verwaiste Kinder nach `setsid()` oder Doppel-Fork in
seinem Nachkommenbaum. Der Guard friert Supervisor und sämtliche Nachkommen
stabil ein, beendet zuerst alle Nachkommen und zuletzt den Supervisor. PID,
Kernelstartzeit und Boot-ID verhindern das Verwechseln wiederverwendeter PIDs.
Ein ungeklärtes Verschwinden des Supervisors innerhalb desselben Hostboots wird
nicht als Abschluss gewertet. Nach einem belegbar anderen Hostboot verwendet
`stop` beziehungsweise der nächste `start` die gespeicherte vorige Boot-ID als
Nachweis des lokalen Prozessendes: alte PIDs werden dabei nicht signalisiert.
Der Guard schließt trotzdem die Admission, beendet zugeordnete verbliebene
Datenbankarbeit, prüft deren tatsächliches Ende und schließt erst danach den
lokalen und DB-Lebenszyklus. Unbekannte DB-Arbeit oder widersprüchliche Boot- und
Datenbankidentitäten sperren diesen Wiederanlauf weiterhin.
Das ist ein erzwungener Stopp mit Wartungsunterbrechung, auch für alte Binärstände.

Danach erfasst der Guard alle zugehörigen und unbekannten Verbindungen der
konfigurierten Rollen sowie noch nicht authentifizierte Clientbackends, beendet
zugeordnete verbliebene DB-Arbeit und verweigert den Wechsel bei unbekannter
Arbeit. Neue Anmeldungen bleiben bis zum endgültigen Commit gesperrt. Die letzte
Sitzungsprüfung, technische Bestätigung und Wiederherstellung der ursprünglichen
Loginattribute erfolgen in einer gemeinsamen administrativen Transaktion.

Die administrative Zielmigration läuft vor dem endgültigen Fingerabdruck und
vor jeder HTTP-/Finanzannahme. Ein additiver v2-Folgerelease wird auf demselben
Weg mit `retire --release /pfad/korrektur.jar` gebunden und lässt sich danach
wiederholt starten. Ein einfaches `start` einer anderen JAR ersetzt keinen Beleg. Scheitert eine
Folgemigration, bleibt der bisherige Stilllegungsbeleg unverändert, die Admission
geschlossen und der fehlerhafte Zielrelease kann nicht starten.

Fehlende Prozessnachweise, falsche Identitäten, Stopp-/Registrierungsfehler,
unbekannte DB-Arbeit oder Konfigurations-/Schema-/Rollenkonflikte erzeugen keinen
erfolgreichen Beleg. Spawnfehler räumen auch noch nicht vollständig registrierte
Prozesse und ihre DB-Arbeit auf und speichern nach bewiesenem Cleanup den vollständigen
Instanzabschluss dauerhaft, sodass ein normaler Retry im selben Hostboot möglich ist. Im Fehlerfall bleibt die Admission geschlossen;
`admission.json` bewahrt geschützt ausschließlich die ursprünglichen technischen
Loginattribute. Ursache klären und denselben Guard erneut verwenden, keine
manuelle Metadatenlöschung oder ungeprüfte Rollenfreigabe. Niemals einen
fehlgeschlagenen Probeaufruf als Beleg umdeuten oder eine Mutation wiederholen.

Nach der Barriere beantwortet die API sämtliche `/api/v1`-Operationen vor
JWT-/CSRF-/Controller-/Finanzarbeit mit 401, `CLIENT_UPDATE_REQUIRED`,
`Cache-Control: no-store` und dem festen gleichursprünglichen Ziel
`/aktualisieren`. Direktzugriff und Proxy verhalten sich gleich.

## Browser und statische Auslieferung

`deploy/Caddyfile.preview` und `scripts/start-static-preview.sh` prüfen die
statische HTTPS-Auslieferung lokal mit festem Caddy 2.10.2 und geprüftem Download.
Der Einstieg und App-Direktlinks werden mit `no-store` ausgeliefert; gehashte
Build-Dateien sind eindeutig. API-Routen und Dateianfragen haben keinen
SPA-Erfolgsfallback. Das lokale CA-Vertrauen wird nicht im System installiert.
Dies ist eine Vorschau und kein neuer Hostingdienst.

Neue Clients erkennen den Aktualisierungscode vor Refresh oder Retry, schließen
Sitzung/Ansicht/Entwürfe und zeigen eine explizite vollständige Ladeaktion.
`/aktualisieren` bleibt öffentlich; Serverantworten dürfen keine externe
Zieladresse einschleusen. Der Reload öffnet `/monat`, lädt zuerst aktuelle
v2-Werte und stellt einen gültigen Zugang per Cookie/CSRF/Origin wieder her oder
verlangt Anmeldung. Entwürfe werden nicht übernommen. Bei zuvor unbestätigtem
Speichern zuerst den aktuellen Stand prüfen, dann eine neue Aktion auslösen.

Der tatsächlich alte v1-Bundle hat keinen neuen Aktualisierungshandler. Seine
persönliche Ansicht schließt beim nächsten geschützten API- oder
Sitzungserneuerungsversuch über den vorhandenen Sitzungsendeweg. **Die öffentliche
App-Adresse anschließend vollständig im Browser neu laden.** Bereits geladenes
altes JavaScript lässt sich nicht aus der Ferne ersetzen. Auch alte Direktlinks
laden dann den aktuellen Einstieg. Zurück/Vorwärts erlaubt keinen neuen
erfolgreichen v1-Finanzzugriff. Im neuen Client führen auch frühere öffentliche
Anmelde-/Registrierungsseiten und interne Navigation bei erkanntem Updatezustand
zur festen Reloadaktion zurück; alte Formulare und Entwürfe erscheinen nicht erneut.

## Geprüfte Rücknahme

Die technische Rücknahme verändert keine Finanzdaten. Vor der ersten Nutzung
signierter Fortschritte oder Monatswirkungen ist sie nur auf eine erneut gegen
genau den aktuellen Schema-/Rollenzustand geprüfte v1-kompatible JAR zulässig.
Der lokale historische Snapshot `b4679692fd63f479cd0ab0cdca99942a512d521d` besitzt
denselben Backend-Tree `750ce7764a0e9c997ff9e724f84001d9125b8168` wie der über
die normale Historie erreichbare Quellstand
`607db4ab33cd83bc90949d5b88a9cfd37aeed42b`. Der Referenzbau verwendet letzteren
und prüft die Tree-ID; historische Dokumentunterschiede werden nicht als Code
ausgegeben. CI benötigt deshalb vollständige Git-Historie, keine lokalen Refs.

```sh
./scripts/build-reference-release.sh
# Nach vollständig beendetem API-Prozess; ausschließlich synthetischer Prüfbestand:
python3 scripts/api-release.py certify-rollback \
  --release /geschuetzter-pfad/gepruefte-alt-api.jar \
  --tool-release /geschuetzter-pfad/neue-api.jar --check-port 18081
python3 scripts/api-release.py rollback \
  --release /geschuetzter-pfad/gepruefte-alt-api.jar \
  --tool-release /geschuetzter-pfad/neue-api.jar
python3 scripts/api-release.py start \
  --release /geschuetzter-pfad/gepruefte-alt-api.jar \
  --tool-release /geschuetzter-pfad/neue-api.jar
```

Die Zertifizierung führt zwingend den Prüflauf aus `scripts/check-rollback-release.py`
unter demselben Lock und registrierten Subreaper-Lebenszyklus aus. Nach dem
exklusiven DB-Lebenszykluserwerb und unmittelbar vor jedem Altprozessstart werden
die dauerhaften Nutzungsmarker frisch geprüft. Die Exklusivität bleibt über den
gesamten Prüflauf einschließlich Prozessstopp und Ausstellung des Belegs bestehen. Auch
ein direkter Aufruf dieses Helfers prüft vor dem Prozessstart den vollständigen
Versionszustand, tatsächlich beendete registrierte Prozesse, geschlossene alte Datenbankarbeit
und die Nutzungsmarker. Ein direkter Helferaufruf verwendet dasselbe geschützte
`--state-dir`; ein abweichendes Verzeichnis ist kein Ersatz für den registrierten
Lebenszyklusnachweis. Dieser
startet die unveränderte Alt-JAR nur auf Loopback, prüft Zugang/Sitzung und sämtliche
v1-Finanzoperationen mit zwei eigenen synthetischen Konten. Fehlende/ungültige
Bearer, falsche Zugangsdaten, fehlende Refresh-Cookies sowie fehlende/falsche
CSRF- und Originwerte müssen konkret abgewiesen werden. Beide Kontoperspektiven
prüfen eigene Listen, Budget und Monatswerte sowie neutrale fremde Änderungs- und
Löschversuche. Edits, Fortschritt und Löschungen werden anhand gespeicherter
Inhalte und IDs nachgelesen. Ausgabe, Rotation und Löschung des Refresh-Cookies
prüfen Secure, HttpOnly, SameSite=Strict, Path=/ und fehlendes Domainattribut. Ein
negativer Fortschrittsversuch muss abgewiesen werden und den bestätigten Bestand erhalten. Anschließend entfernt der Prüfer beide Konten samt
Prüfdaten und beendet den Prozess. Die geschützte Zertifikatsdatei bindet Release,
Schema und Rollen; jede Abweichung verlangt eine neue Prüfung. Sie ist kein
allgemeiner Schalter zur Umgehung der Versionsgrenze. Jeder Altstart nach V10
benötigt dieses exakte Zertifikat, auch vor der ersten Stilllegung. Eine neue
Prüfung entzieht zuerst eine vorhandene Freigabe. Explizite Prüfexceptions bleiben
auch mit `PYTHONOPTIMIZE=1` wirksam. Beide eindeutigen synthetischen Konten werden auch
nach Fehlern zwischen bestätigter Registrierung und erfolgreichem Login bereinigt.

Die späteren technischen Marker werden nur vorwärts in derselben äußeren
Finanztransaktion gesetzt; Rollback nimmt den unbestätigten Marker zurück. Nach
Commit eines Markers verweigern Datenbankfunktion und alle unterstützten
Start-/Rücknahmewege dauerhaft den Rückfall auf v1, auch wenn sämtliche aktuellen
Testwerte nichtnegativ sind. Dann nur v2-kompatibel korrigieren oder eine geprüft
wiederhergestellte Version verwenden; Wiederherstellung öffnet keine alten
Freigaben automatisch. Diese Story setzt Marker ausschließlich in synthetischen
Tests und aktiviert keine Finanzwirkung.

## Weiter offene Betriebsbedingungen

Vor echten Nutzerdaten bleiben Export, Löschung, Aufbewahrung,
Kontowiederherstellung, Zielhost/Domain/Monitoring, geschützte Produktionswerte
sowie verschlüsselte Backups außerhalb des VPS und ein getesteter
Wiederherstellungsweg erforderlich. Anmeldedrosselung und begrenzte parallele
Argon2-Prüfung werden anhand des Zielhosts und Lastprofils bewertet. Dieser Ablauf
führt keinen Produktionsrollout durch.
