package de.linus.tnbp.versions;

import static org.assertj.core.api.Assertions.*;
import java.nio.file.*;
import java.nio.file.attribute.PosixFilePermissions;
import java.net.*;
import java.net.http.*;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.zip.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import tools.jackson.databind.json.JsonMapper;

class ReleaseTransitionIT {
    static final Path ROOT = Path.of(System.getProperty("user.dir")).toAbsolutePath().getParent();
    static final Path RELEASE = ROOT.resolve("backend/target/tnbp-0.1.0-SNAPSHOT.jar");
    static final JsonMapper JSON = JsonMapper.builder().build();

    @ParameterizedTest @ValueSource(strings={"before-read", "sql", "before-commit", "after-commit", "orphan"})
    void realeAltarbeitEndetVorBestaetigterBarriere(String hold) throws Exception {
        try (var db = new VersionDatabase(); var run = new Running(db, true)) {
            UUID user = UUID.randomUUID();
            db.admin.update("INSERT INTO access.accounts VALUES (?, ?, '$argon2id$synthetic', now())", user, user + "@example.org");
            run.start(run.harness);
            var request = HttpRequest.newBuilder(URI.create(run.origin + "/api/v1/expense-budget/expenses"))
                .header("X-Test-Hold", hold).header("X-Test-User", user.toString())
                .header("Authorization", "Bearer " + token(user))
                .header("Content-Type", "application/json").timeout(Duration.ofSeconds(60))
                .method(hold.endsWith("commit") ? "POST" : "GET", hold.endsWith("commit")
                    ? HttpRequest.BodyPublishers.ofString("{\"name\":\"Prozessnachweis\",\"amountCents\":123}") : HttpRequest.BodyPublishers.noBody()).build();
            var pending = HttpClient.newHttpClient().sendAsync(request, HttpResponse.BodyHandlers.ofString());
            await(() -> Files.exists(run.folder.resolve("ready")));
            if (hold.equals("sql")) await(() -> Boolean.TRUE.equals(db.admin.queryForObject(
                "SELECT EXISTS(SELECT FROM pg_stat_activity WHERE datname=current_database() AND query LIKE 'SELECT pg_sleep%' AND state='active')", Boolean.class)));
            assertThat(db.admin.queryForObject("SELECT count(*) FROM expenses.expenses", Integer.class)).isEqualTo(hold.equals("after-commit") ? 1 : 0);
            String childStart = (hold.equals("before-read") || hold.equals("orphan"))
                ? kernelStart(Path.of("/proc/"+Files.readString(run.folder.resolve("child.pid"))+"/stat")) : null;
            if (hold.equals("orphan")) {
                var registered=JSON.readValue(Files.readString(run.folder.resolve("instance.json")),Map.class);
                long supervisor=((Number)((Map<?,?>)registered.get("supervisor")).get("pid")).longValue();
                long orphan=Long.parseLong(Files.readString(run.folder.resolve("child.pid")));
                await(() -> ProcessHandle.of(orphan).flatMap(ProcessHandle::parent).map(p -> p.pid()==supervisor).orElse(false));
            }
            var result = run.guard("retire", RELEASE);
            assertThat(result.code).as(result.output).isZero();
            assertThat(db.admin.queryForObject("SELECT v1_retired FROM api_version.state", Boolean.class)).isTrue();
            assertThat(db.admin.queryForObject("SELECT count(*) FROM pg_stat_activity WHERE datname=current_database() AND usename='tnbp_runtime'", Integer.class)).isZero();
            if (hold.equals("before-read") || hold.equals("orphan")) {
                var childStat = Path.of("/proc/" + Files.readString(run.folder.resolve("child.pid")) + "/stat");
                assertThat(Files.notExists(childStat) || Files.readString(childStat).contains(") Z ") || !kernelStart(childStat).equals(childStart)).as("genaue alte Kernelidentität ist beendet").isTrue();
            }
            assertThat(db.admin.queryForObject("SELECT count(*) FROM expenses.expenses", Integer.class)).isEqualTo(hold.equals("after-commit") ? 1 : 0);
            assertThat(pending.handle((response, failure) -> failure != null).get(10, TimeUnit.SECONDS)).isTrue();
            run.finish();
            Files.deleteIfExists(run.folder.resolve("ready"));
            run.start(RELEASE);
            for (String method : List.of("GET", "POST", "PUT", "DELETE")) {
                var rejected = HttpClient.newHttpClient().send(HttpRequest.newBuilder(URI.create(run.origin + "/api/v1/expense-budget/expenses"))
                    .method(method, HttpRequest.BodyPublishers.noBody()).build(), HttpResponse.BodyHandlers.ofString());
                assertThat(rejected.statusCode()).isEqualTo(401);
                assertThat(rejected.body()).contains("CLIENT_UPDATE_REQUIRED");
            }
            assertThat(Files.exists(run.folder.resolve("ready"))).isFalse();
            run.finish();
            // Derselbe dauerhafte Nachweis gilt nach echtem Prozessneustart.
            run.start(RELEASE);
            assertThat(HttpClient.newHttpClient().send(HttpRequest.newBuilder(URI.create(run.origin + "/api/v1/access/csrf")).GET().build(),
                HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(401);
        }
    }

    @Test void ungeklärteDatenbankarbeitStopfehlerUndKonfigurationskonfliktErzeugenKeinenNachweis() throws Exception {
        try (var db = new VersionDatabase(); var run = new Running(db, false)) {
            run.start(RELEASE);
            try (var unknown = db.runtimeSource.getConnection()) {
            var path = run.folder.resolve("instance.json");
            var original = Files.readString(path);
            var record = new LinkedHashMap<>(JSON.readValue(original, Map.class));
            var identity = new LinkedHashMap<String, Object>((Map<String, Object>) record.get("process"));
            identity.put("start", "falsche-identitaet"); record.put("process", identity);
            Files.writeString(path, JSON.writeValueAsString(record));
            assertThat(run.guard("retire", RELEASE).code).isNotZero();
            assertThat(db.admin.queryForObject("SELECT v1_retired FROM api_version.state", Boolean.class)).isFalse();
            Files.writeString(path, original);
            // Betriebssystemfehler ausschließlich im separaten Testtreiber injizieren.
            String denyKill = """
                import os,runpy,signal,sys
                module=runpy.run_path(sys.argv[1])
                real=signal.pidfd_send_signal
                def denied(pid,action):
                    if action==signal.SIGKILL: raise PermissionError('synthetischer Stoppfehler')
                    return real(pid,action)
                signal.pidfd_send_signal=denied
                sys.argv=sys.argv[1:]
                try: module['main']()
                except PermissionError: sys.exit(17)
                """;
            var stoppedCommand = new ArrayList<>(List.of("python3", "-c", denyKill));
            stoppedCommand.addAll(run.command("retire", RELEASE).command().subList(1, run.command("retire", RELEASE).command().size()));
            var stoppedBuilder = new ProcessBuilder(stoppedCommand).directory(ROOT.toFile()).redirectErrorStream(true)
                .redirectOutput(run.folder.resolve("denied-stop.log").toFile());
            stoppedBuilder.environment().putAll(run.environment);
            var failedStop = stoppedBuilder.start();
            assertThat(failedStop.waitFor(30, TimeUnit.SECONDS)).isTrue();
            assertThat(failedStop.exitValue()).isEqualTo(17);
            assertThat(db.admin.queryForObject("SELECT v1_retired FROM api_version.state", Boolean.class)).isFalse();
            // Eine fremde, nicht zugeordnete Laufzeitverbindung reicht zum sicheren Abbruch.
                assertThat(run.guard("retire", RELEASE).code).isNotZero();
                assertThat(db.admin.queryForObject("SELECT v1_retired FROM api_version.state", Boolean.class)).isFalse();
            }
            run.finish();
            assertThat(run.guard("retire", RELEASE).code).isZero();
            run.environment.put("API_VERSION_MODE", "compatible");
            var conflict = run.guard("start", RELEASE);
            assertThat(conflict.code).isNotZero();
            assertThat(conflict.output).contains("widerspricht");
        }
    }

    @Test void echtesAelteresBinaryBrauchtExaktenPruefstandUndMarkerVerhindertJedenRueckfall() throws Exception {
        try (var db = new VersionDatabase(); var run = new Running(db, false)) {
            Path old = oldRelease(run);
            run.start(RELEASE);
            assertThat(run.guard("retire", RELEASE).code).isZero();
            run.finish();
            assertThat(run.guard("start", old).code).isNotZero();
            assertThat(run.guard("rollback", old).code).isNotZero();
            // Der reale v1-Release wird isoliert gegen genau V10 und dieselben Rollen geprüft.
            var certification = run.guard("certify-rollback", old, "--check-port", Integer.toString(run.port));
            assertThat(certification.code).as(certification.output).isZero();
            assertThat(run.guard("rollback", old).code).isZero();
            run.start(old);
            assertThat(HttpClient.newHttpClient().send(HttpRequest.newBuilder(URI.create(run.origin + "/api/v1/access/csrf")).GET().build(),
                HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(200);
            assertThat(run.guard("retire", RELEASE).code).isZero();
            run.finish();
            db.runtime.execute("SELECT api_version.mark_usage('signed-progress')");
            assertThat(db.admin.queryForObject("SELECT count(*) FROM savings_goals.goals WHERE progress_cents<0", Integer.class)).isZero();
            var directSupervisor=run.guard("supervise",old);
            assertThat(directSupervisor.code).isNotZero();
            assertThat(directSupervisor.output).contains("Interner Supervisorstart benötigt den registrierten lebenden Guard-Elternprozess");
            assertThat(run.guard("rollback", old).code).isNotZero();
            assertThat(run.guard("start", old).code).isNotZero();
            var directLog = run.folder.resolve("direct-old-check.log");
            var direct = new ProcessBuilder("python3", ROOT.resolve("scripts/check-rollback-release.py").toString(), "--release", old.toString(),
                "--tool-release", RELEASE.toString(), "--state-dir", run.folder.toString(), "--port", Integer.toString(run.port)).redirectErrorStream(true).redirectOutput(directLog.toFile());
            direct.environment().putAll(run.environment);
            var rejected = direct.start();
            assertThat(rejected.waitFor(30, TimeUnit.SECONDS)).isTrue();
            assertThat(rejected.exitValue()).isNotZero();
            assertThat(Files.readString(directLog)).contains("Altprüfung ohne eindeutigen ungenutzten Versionszustand");
            assertThat(db.admin.queryForObject("SELECT count(*) FROM pg_stat_activity WHERE datname=current_database() AND usename='tnbp_runtime'", Integer.class)).isZero();
            run.start(RELEASE);
        }
    }

    @Test void nurNeuerReleaseDarfVorV10InitialisierenFehlenderNachweisNachV10SperrtJedenStart() throws Exception {
        try (var db = new VersionDatabase("9"); var run = new Running(db, false)) {
            Path old = oldRelease(run);
            var legacy = run.guard("start", old);
            assertThat(legacy.code).isNotZero();
            assertThat(legacy.output).contains("Altstart ohne eindeutigen Versionszustand");
            run.start(RELEASE);
            assertThat(db.admin.queryForObject("SELECT count(*) FROM api_version.state", Integer.class)).isEqualTo(1);
            run.finish();
            db.admin.execute("DROP SCHEMA api_version CASCADE");
            for (Path release : List.of(old, RELEASE)) {
                var missing = run.guard("start", release);
                assertThat(missing.code).isNotZero();
                assertThat(missing.output).contains("V10 ist verzeichnet, aber der Versionszustand fehlt");
            }
        }
    }

    @Test void admissionBleibtBisZumBestaetigungscommitGegenReconnectGeschlossen() throws Exception {
        try (var db = new VersionDatabase(); var run = new Running(db, false)) {
            run.start(RELEASE);
            String driver = """
                import os,runpy,subprocess,sys
                module=runpy.run_path(sys.argv[1]); Guard=module['Guard']; original=Guard.sql
                def checked(self,sql):
                    if sql.startswith('BEGIN; DO $$'):
                        environment=os.environ.copy()
                        environment.update(RELEASE_DB_URL=self.url, DB_ADMIN_USER=self.runtime,
                            DB_ADMIN_PASSWORD=os.environ['DB_RUNTIME_PASSWORD'])
                        attempted=subprocess.run([module['java'](),'--class-path',str(self.folder/'postgresql.jar'),
                            str(module['ROOT']/'scripts/ApiReleaseDatabase.java')], input='SELECT 1',
                            text=True,capture_output=True,env=environment)
                        if attempted.returncode==0: raise RuntimeError('Reconnect im Bestätigungsfenster zugelassen')
                        if 'not permitted to log in' not in attempted.stderr: raise RuntimeError(attempted.stderr)
                        print('Reconnect unmittelbar vor Commit wirksam gesperrt',flush=True)
                    return original(self,sql)
                Guard.sql=checked; sys.argv=sys.argv[1:]; sys.exit(module['main']())
                """;
            var result = run.driver(driver, "retire", RELEASE);
            assertThat(result.code).as(result.output).isZero();
            assertThat(result.output).contains("Reconnect unmittelbar vor Commit wirksam gesperrt");
            assertThat(db.admin.queryForObject("SELECT v1_retired FROM api_version.state", Boolean.class)).isTrue();
            assertThat(db.admin.queryForObject("SELECT bool_and(rolcanlogin) FROM pg_roles WHERE rolname IN ('tnbp_runtime','tnbp_migrator')", Boolean.class)).isTrue();
        }
    }

    @Test void registrierungsfehlerNachSpawnHinterlaesstKeineApiOderDatenbankarbeit() throws Exception {
        try (var db = new VersionDatabase(); var run = new Running(db, true)) {
            String driver = """
                import runpy,subprocess,sys
                module=runpy.run_path(sys.argv[1]); original=subprocess.Popen
                wrapper='''
                import runpy,sys
                m=runpy.run_path(sys.argv[1]); G=m['Guard']; old=G.write; failed=[False]
                def fail(self,value,name='instance.json'):
                    if name=='instance.json' and not value.get('pending') and not failed[0]:
                        failed[0]=True
                        (self.folder/'failed-api.json').write_text(m['json'].dumps(value))
                        raise OSError('synthetischer Registrierungsfehler nach Spawn')
                    return old(self,value,name)
                G.write=fail; sys.argv=sys.argv[1:]; sys.exit(m['main']())
                '''
                def spawn(command,*args,**kwargs):
                    if len(command)>2 and command[2]=='supervise':
                        command=[command[0],'-c',wrapper,*command[1:]]
                    return original(command,*args,**kwargs)
                subprocess.Popen=spawn; sys.argv=sys.argv[1:]; sys.exit(module['main']())
                """;
            var result = run.driver(driver, "start", run.harness, "--timeout", "8");
            assertThat(result.code).isNotZero();
            assertThat(result.output).contains("Registrierungsfehler nach Spawn");
            assertThat(db.admin.queryForObject("SELECT count(*) FROM pg_stat_activity WHERE datname=current_database() AND usename='tnbp_runtime'", Integer.class)).isZero();
            var started=JSON.readValue(Files.readString(run.folder.resolve("failed-api.json")),Map.class);
            var apiIdentity=(Map<String,Object>)started.get("process");
            var apiStat=Path.of("/proc/"+apiIdentity.get("pid")+"/stat");
            if(Files.exists(apiStat)) {
                String raw=Files.readString(apiStat);
                String[] fields=raw.substring(raw.lastIndexOf(')')+2).split(" ");
                assertThat(fields[0].equals("Z") || !fields[19].equals(apiIdentity.get("start"))).as("gestartete API-PID/Kernelstartzeit ist beendet").isTrue();
            }
            var launch=JSON.readValue(Files.readString(run.folder.resolve("launch.json")),Map.class);
            String actualArtifact=(String)launch.get("target");
            assertThat(actualArtifact).isNotEqualTo(run.harness.toString());
            assertThat(ProcessHandle.allProcesses().anyMatch(process -> process.info().arguments()
                .map(arguments -> Arrays.asList(arguments).contains(actualArtifact)).orElse(false)))
                .as("keine API mit der tatsächlich gestarteten gebundenen Artefaktkopie").isFalse();
            assertThat(db.admin.queryForObject("SELECT v1_retired FROM api_version.state", Boolean.class)).isFalse();
            run.start(RELEASE); run.finish();
        }
    }

    @Test void jedeAltpruefungLehntLebendenRegistriertenProzessAuchOhneDbAb() throws Exception {
        try (var db = new VersionDatabase(); var run = new Running(db, false)) {
            var sleeping = new ProcessBuilder("sleep", "120").start();
            try {
                String driver = """
                    import runpy,sys,uuid
                    module=runpy.run_path(sys.argv[1]); sys.argv=sys.argv[1:]
                    args=module['argparse'].Namespace(state_dir=sys.argv[sys.argv.index('--state-dir')+1],
                        release=sys.argv[sys.argv.index('--release')+1],tool_release=sys.argv[sys.argv.index('--tool-release')+1])
                    guard=module['Guard'](args)
                    with guard.lock():
                        identity=module['process_identity'](int(__PID__))
                        guard.write(dict(instance=str(uuid.uuid4()),application='unconnected-test',process=identity,supervisor=identity,stopped=False))
                    sys.exit(module['main']())
                    """.replace("__PID__", Long.toString(sleeping.pid()));
                var rejected = run.driver(driver, "certify-rollback", oldRelease(run), "--check-port", Integer.toString(run.port));
                assertThat(rejected.code).isNotZero();
                assertThat(rejected.output).contains("lebt noch");
                assertThat(Files.exists(run.folder.resolve("rollback.json"))).isFalse();
                db.admin.execute("UPDATE api_version.lifecycle SET active=true,owner_sha256=repeat('a',64)");
                Path directLog=run.folder.resolve("different-metadata.log");
                var direct=new ProcessBuilder("python3",ROOT.resolve("scripts/check-rollback-release.py").toString(),"--release",oldRelease(run).toString(),
                    "--tool-release",RELEASE.toString(),"--state-dir",run.folder.resolve("other").toString(),"--port",Integer.toString(run.port))
                    .redirectErrorStream(true).redirectOutput(directLog.toFile());
                direct.environment().putAll(run.environment);
                var denied=direct.start();assertThat(denied.waitFor(30,TimeUnit.SECONDS)).isTrue();
                assertThat(denied.exitValue()).isNotZero();assertThat(Files.readString(directLog)).contains("DB-Lebenszyklus ist noch aktiv");

                assertThat(db.admin.queryForObject("SELECT count(*) FROM pg_stat_activity WHERE datname=current_database() AND usename='tnbp_runtime'", Integer.class)).isZero();
            } finally { sleeping.destroyForcibly(); sleeping.waitFor(); }
        }
    }

    @Test void fremderListenerUndGeerbteSpringDbKonfigurationKoennenKeinenStartBestaetigen() throws Exception {
        try (var db = new VersionDatabase(); var run = new Running(db, false)) {
            run.environment.put("SPRING_DATASOURCE_URL", "jdbc:postgresql://127.0.0.1:1/fremd");
            var conflict = run.guard("start", RELEASE);
            assertThat(conflict.code).isNotZero(); assertThat(conflict.output).contains("Abweichende Spring");
            run.environment.remove("SPRING_DATASOURCE_URL");
            run.environment.put("SPRING_FLYWAY_USER", "fremder_migrator");
            assertThat(run.guard("certify-rollback", oldRelease(run)).code).isNotZero();
            run.environment.remove("SPRING_FLYWAY_USER");
            var listener = com.sun.net.httpserver.HttpServer.create(new java.net.InetSocketAddress("127.0.0.1", run.port), 0);
            var probes=new java.util.concurrent.atomic.AtomicInteger();
            listener.createContext("/api/v2/access/csrf", exchange -> {
                probes.incrementAndGet();
                byte[] body = "{\"token\":\"fremder-token\"}".getBytes(java.nio.charset.StandardCharsets.UTF_8);
                exchange.sendResponseHeaders(200, body.length); exchange.getResponseBody().write(body); exchange.close();
            });
            listener.start();
            run.environment.put("SERVER_ADDRESS", "127.0.0.2");
            try {
                var rejected = run.guard("start", RELEASE, "--timeout", "5");
                assertThat(rejected.code).isNotZero(); assertThat(rejected.output).contains("instanzgebundene v2-Bereitschaft fehlt");
                assertThat(probes.get()).as("gleicher Port erreicht tatsächlich die accepted-socket-Prüfung").isPositive();
                assertThat(db.admin.queryForObject("SELECT count(*) FROM pg_stat_activity WHERE datname=current_database() AND usename='tnbp_runtime'", Integer.class)).isZero();
            } finally { listener.stop(0); }
            run.environment.remove("SERVER_ADDRESS"); run.start(RELEASE); run.finish();
        }
    }

    @Test void folgemigrationWirdVorFreigabeGebundenUndLaesstWiederholtenNeustartZu() throws Exception {
        try (var db = new VersionDatabase(); var run = new Running(db, false)) {
            run.start(RELEASE);
            assertThat(run.guard("retire", RELEASE).code).isZero(); run.finish();
            Path next = run.variant(RELEASE, "next.jar", Map.of("BOOT-INF/classes/db/migration/V11__synthetic_followup.sql",
                "CREATE TABLE api_version.synthetic_followup (id integer PRIMARY KEY);"));
            var migrated = run.guard("retire", next);
            assertThat(migrated.code).as(migrated.output).isZero();
            assertThat(db.admin.queryForObject("SELECT max(version::integer) FROM access.flyway_schema_history WHERE version IS NOT NULL", Integer.class)).isEqualTo(11);
            for (int restart=0; restart<2; restart++) { run.start(next); run.finish(); }
            assertThat(db.admin.queryForObject("SELECT v1_retired FROM api_version.state", Boolean.class)).isTrue();
        }
    }

    @Test void altstartVorErsterStilllegungBrauchtZertifikatUndEchteDriftEntziehtStartUndRuecknahme() throws Exception {
        try (var db = new VersionDatabase(); var run = new Running(db, false)) {
            Path old = oldRelease(run);
            assertThat(run.guard("start", old).code).isNotZero();
            assertThat(run.guard("certify-rollback", old, "--check-port", Integer.toString(run.port)).code).isZero();
            db.admin.execute("CREATE TABLE api_version.synthetic_drift(id integer)");
            assertThat(run.guard("start", old).code).isNotZero();
            assertThat(run.guard("rollback", old).code).isNotZero();
            db.admin.execute("DROP TABLE api_version.synthetic_drift");
            run.start(RELEASE); assertThat(run.guard("retire", RELEASE).code).isZero(); run.finish();
            db.admin.execute("CREATE TABLE api_version.synthetic_drift(id integer)");
            assertThat(run.guard("start", RELEASE).code).isNotZero();
            assertThat(run.guard("rollback", old).code).isNotZero();
        }
    }

    @Test void eigeneLoginrollenUndTransitiveMitgliedschaftenSindTeilDesNachweises() throws Exception {
        try (var db = new VersionDatabase(); var run = new Running(db, false)) {
            String suffix = UUID.randomUUID().toString().replace("-", "");
            String runtime = "web_" + suffix, migrator = "ddl_" + suffix, parent = "parent_" + suffix, ancestor = "ancestor_" + suffix;
            db.admin.execute("CREATE ROLE " + runtime + " LOGIN PASSWORD 'runtime-test-only'; GRANT tnbp_runtime TO " + runtime + ";"
                + "CREATE ROLE " + migrator + " LOGIN PASSWORD 'migration-test-only'; GRANT tnbp_migrator TO " + migrator + ";"
                + "CREATE ROLE " + parent + "; CREATE ROLE " + ancestor + "; GRANT " + parent + " TO " + runtime);
            run.environment.put("DB_RUNTIME_USER", runtime); run.environment.put("DB_MIGRATION_USER", migrator);
            try {
                Path old = oldRelease(run);
                assertThat(run.guard("certify-rollback", old, "--check-port", Integer.toString(run.port)).code).isZero();
                run.start(RELEASE);
                try (var unknown = new org.springframework.jdbc.datasource.DriverManagerDataSource(db.url, runtime, "runtime-test-only").getConnection()) {
                    assertThat(run.guard("retire", RELEASE).code).isNotZero();
                    assertThat(db.admin.queryForObject("SELECT v1_retired FROM api_version.state", Boolean.class)).isFalse();
                }
                run.finish();
                assertThat(run.guard("retire", RELEASE).code).isZero();
                db.admin.execute("GRANT " + ancestor + " TO " + parent);
                assertThat(run.guard("start", RELEASE).code).isNotZero();
                assertThat(run.guard("rollback", old).code).isNotZero();
            } finally {
                db.admin.execute("DROP ROLE " + runtime + "; DROP ROLE " + migrator + "; DROP ROLE " + parent + "; DROP ROLE " + ancestor);
            }
        }
    }

    @Test void optimierterAltprueferEntziehtAlteFreigabeUndBereinigtKontoBeiFehlerVorLogin() throws Exception {
        try (var db = new VersionDatabase(); var run = new Running(db, false)) {
            Path old = oldRelease(run);
            run.environment.put("PYTHONOPTIMIZE", "1");
            assertThat(run.guard("certify-rollback", old, "--check-port", Integer.toString(run.port)).code).isZero();
            Path broken = run.variant(old, "broken-old.jar", Map.of("BOOT-INF/classes/application.properties",
                "spring.main.sources=de.linus.tnbp.versions.TransitionHooks\n"));
            run.environment.put("API_TEST_CERT_FAILURE", "login");
            var rejected = run.guard("certify-rollback", broken, "--check-port", Integer.toString(run.port));
            assertThat(rejected.code).as(rejected.output).isNotZero();
            assertThat(rejected.output).contains("/access/login", "401");
            assertThat(Files.exists(run.folder.resolve("rollback.json"))).isFalse();
            assertThat(db.admin.queryForObject("SELECT count(*) FROM access.accounts WHERE email LIKE 'rollback-%@example.org'", Integer.class)).isZero();
            assertThat(run.guard("rollback", old).code).isNotZero();
            run.environment.put("API_TEST_CERT_FAILURE", "budget");
            var wrongAmount = run.guard("certify-rollback", broken, "--check-port", Integer.toString(run.port));
            assertThat(wrongAmount.code).as(wrongAmount.output).isNotZero();
            assertThat(wrongAmount.output).contains("Budgetprüfung fehlgeschlagen");
            assertThat(Files.exists(run.folder.resolve("rollback.json"))).isFalse();
            assertThat(db.admin.queryForObject("SELECT count(*) FROM access.accounts WHERE email LIKE 'rollback-%@example.org'", Integer.class)).isZero();
        }
    }

    @Test void fehlgeschlagenerZertifizierungsstoppOeffnetAdmissionAuchOhneDbArbeitNicht() throws Exception {
        try (var db=new VersionDatabase();var run=new Running(db,false)) {
            Path old=oldRelease(run);
            String driver="""
                import runpy,sys
                module=runpy.run_path(sys.argv[1]); Guard=module['Guard']
                def failed(self):
                    self.close_admission()
                    for row in self.sessions():
                        self.sql('SELECT pg_terminate_backend('+str(row['pid'])+',5000)')
                    if self.sessions(): raise RuntimeError('synthetischer Prüffehler: DB-Arbeit blieb')
                    raise RuntimeError('synthetischer Zertifizierungsstopp ohne DB-Arbeit fehlgeschlagen')
                Guard.stop=failed;sys.argv=sys.argv[1:];sys.exit(module['main']())
                """;
            try {
                var rejected=run.driver(driver,"certify-rollback",old,"--check-port",Integer.toString(run.port));
                assertThat(rejected.code).isNotZero();assertThat(rejected.output).contains("Zertifizierungsstopp ohne DB-Arbeit fehlgeschlagen");
                assertThat(db.admin.queryForObject("SELECT bool_and(NOT rolcanlogin) FROM pg_roles WHERE rolname IN ('tnbp_runtime','tnbp_migrator')",Boolean.class)).isTrue();
                assertThat(db.admin.queryForObject("SELECT active FROM api_version.lifecycle",Boolean.class)).isTrue();
                assertThat(Files.exists(run.folder.resolve("rollback.json"))).isFalse();
                assertThat(db.admin.queryForObject("SELECT count(*) FROM access.accounts WHERE email LIKE 'rollback-%@example.org'",Integer.class)).isZero();
            } finally { assertThat(run.guard("stop",old).code).isZero(); }
        }
    }

    @Test void eingeschraenkterOperatorErhaeltKeineZusaetzlichenFinanzOderBetriebsrechte() throws Exception {
        try (var db = new VersionDatabase(); var run = new Running(db, false)) {
            String operator="operator_"+UUID.randomUUID().toString().replace("-", "");
            db.admin.execute("CREATE ROLE "+operator+" LOGIN PASSWORD 'operator-test-only'; GRANT USAGE ON SCHEMA api_version,access TO "+operator
                +"; GRANT SELECT ON api_version.state,api_version.lifecycle,access.flyway_schema_history TO "+operator);
            try {
                run.environment.put("DB_ADMIN_USER",operator);run.environment.put("DB_ADMIN_PASSWORD","operator-test-only");
                var denied=run.guard("start",RELEASE);
                assertThat(denied.code).isNotZero();assertThat(denied.output).contains("Vollständiger geschützter Datenbankadministrator erforderlich");
                assertThat(db.admin.queryForObject("SELECT bool_and(rolcanlogin) FROM pg_roles WHERE rolname IN ('tnbp_runtime','tnbp_migrator')",Boolean.class)).isTrue();
            } finally { db.admin.execute("DROP OWNED BY "+operator+"; DROP ROLE "+operator); }
        }
    }

    @Test void andereDatenbankWirdVorSignalenUndAdmissionAbgewiesen() throws Exception {
        try (var second = io.zonky.test.db.postgres.embedded.EmbeddedPostgres.builder().setPort(0).start()) {
            var cluster = new org.springframework.jdbc.core.JdbcTemplate(second.getPostgresDatabase());
            cluster.execute("CREATE ROLE tnbp_runtime LOGIN PASSWORD 'runtime-test-only'; CREATE ROLE tnbp_migrator LOGIN PASSWORD 'migration-test-only'");
            try (var a = new VersionDatabase(); var b = new VersionDatabase(second, "10"); var run = new Running(a, false)) {
                run.start(RELEASE);
                String application = (String)JSON.readValue(Files.readString(run.folder.resolve("instance.json")),Map.class).get("application");
                try (var connection = a.runtimeSource.getConnection()) {
                    connection.createStatement().execute("SET application_name='" + application + "'");
                    var work = java.util.concurrent.CompletableFuture.runAsync(() -> {
                        try { connection.createStatement().execute("SELECT pg_sleep(120)"); } catch (java.sql.SQLException expected) { }
                    });
                    await(() -> Boolean.TRUE.equals(a.admin.queryForObject("SELECT EXISTS(SELECT FROM pg_stat_activity WHERE query='SELECT pg_sleep(120)' AND state='active')",Boolean.class)));
                    run.environment.put("DB_URL",b.url);
                    var rejected=run.guard("retire",RELEASE);
                    assertThat(rejected.code).isNotZero(); assertThat(rejected.output).contains("Datenbankbindung widerspricht");
                    assertThat(run.process.isAlive()).isTrue();
                    assertThat(a.admin.queryForObject("SELECT count(*) FROM pg_stat_activity WHERE query='SELECT pg_sleep(120)' AND state='active'",Integer.class)).isEqualTo(1);
                    assertThat(b.admin.queryForObject("SELECT v1_retired FROM api_version.state",Boolean.class)).isFalse();
                    assertThat(b.admin.queryForObject("SELECT bool_and(rolcanlogin) FROM pg_roles WHERE rolname IN ('tnbp_runtime','tnbp_migrator')",Boolean.class)).isTrue();
                    run.environment.put("DB_URL",a.url);
                    assertThat(run.guard("retire",RELEASE).code).isZero(); work.get(10,TimeUnit.SECONDS);
                }
            }
        }
    }

    @ParameterizedTest @ValueSource(strings={"trigger","constraint"})
    void schutztriggerUndConstraintrelationSindTeilDesSchemafingerabdrucks(String drift) throws Exception {
        try(var db=new VersionDatabase();var run=new Running(db,false)) {
            db.admin.execute("CREATE TABLE api_version.first_check(id integer CONSTRAINT same_check CHECK(id>0)); CREATE TABLE api_version.second_check(id integer)");
            run.start(RELEASE); assertThat(run.guard("retire",RELEASE).code).isZero(); run.finish();
            var before=run.guard("snapshot",RELEASE);assertThat(before.code).isZero();
            if(drift.equals("trigger")) db.admin.execute("ALTER TABLE api_version.state DISABLE TRIGGER monotone_usage");
            else db.admin.execute("ALTER TABLE api_version.first_check DROP CONSTRAINT same_check; ALTER TABLE api_version.second_check ADD CONSTRAINT same_check CHECK(id>0)");
            var after=run.guard("snapshot",RELEASE);assertThat(after.code).isZero();assertThat(after.output).isNotEqualTo(before.output);
            var denied=run.guard("start",RELEASE);assertThat(denied.code).isNotZero();assertThat(denied.output).contains("Schema-/Rollenzustand weicht");
        }
    }

    @Test void belegterAndererHostbootSchliesstDbArbeitOhneWiederverwendetePidZuSignalisieren() throws Exception {
        try(var db=new VersionDatabase();var run=new Running(db,false)) {
            var unrelated=new ProcessBuilder("sleep","120").start();
            try(var work=db.runtimeSource.getConnection()) {
                work.createStatement().execute("SET application_name='tnbp-api-old-boot'");
                String driver="""
                    import runpy,sys,uuid
                    m=runpy.run_path(sys.argv[1]); real=m['boot_id']
                    G=m['Guard']; old=G.bind_database
                    def prepare(self):
                        old(self)
                        identity=m['process_identity'](__PID__)
                        identity['boot']='synthetic-previous-host-boot'
                        self.write(dict(instance=str(uuid.uuid4()),application='tnbp-api-old-boot',process=identity,supervisor=identity,stopped=False))
                        self.lifecycle(True)
                        proof=self.read('lifecycle.json')
                        proof['controller']['boot']='synthetic-previous-host-boot'
                        proof.update(application='tnbp-api-old-boot',instance=self.read()['instance'])
                        self.write(proof,'lifecycle.json')
                        # Nur die Bootermittlung ist isoliert; diese PID gehört im neuen Boot einem fremden Prozess.
                        m['process_identity'].__globals__['boot_id']=lambda:'synthetic-new-host-boot'
                        def forbidden(*args): raise RuntimeError('Fremde PID wurde signalisiert')
                        m['end_containment'].__globals__['signal_process']=forbidden
                    G.bind_database=prepare;sys.argv=sys.argv[1:];sys.exit(m['main']())
                    """.replace("__PID__",Long.toString(unrelated.pid()));
                var recovered=run.driver(driver,"stop",RELEASE);
                assertThat(recovered.code).as(recovered.output).isZero();assertThat(unrelated.isAlive()).isTrue();
                assertThat(db.admin.queryForObject("SELECT active FROM api_version.lifecycle",Boolean.class)).isFalse();
                assertThat(db.admin.queryForObject("SELECT count(*) FROM pg_stat_activity WHERE application_name='tnbp-api-old-boot'",Integer.class)).isZero();
                run.start(RELEASE);run.finish();
            } finally { unrelated.destroyForcibly();unrelated.waitFor(); }
        }
    }

    @Test void frischerMarkerNachErsterLesungVerhindertAltprozessAuchAusAnderemMetadatenverzeichnis() throws Exception {
        try(var db=new VersionDatabase();var run=new Running(db,false)) {
            Path old=oldRelease(run);
            run.start(RELEASE);assertThat(run.guard("retire",RELEASE).code).isZero();run.finish();
            String driver="""
                import runpy,sys,time
                from pathlib import Path
                m=runpy.run_path(sys.argv[1]);G=m['Guard'];original=G.state;first=[True]
                def raced(self):
                    state=original(self)
                    if first[0]:
                        first[0]=False
                        Path('__FOLDER__/cert-first-read').touch()
                        while not Path('__FOLDER__/cert-continue').exists(): time.sleep(.01)
                    return state
                G.state=raced;sys.argv=sys.argv[1:];sys.exit(m['main']())
                """.replace("__FOLDER__",run.folder.toString());
            var normal=run.folder.resolve("other");
            var command=run.command("certify-rollback",old,"--state-dir",normal.toString(),"--check-port",Integer.toString(run.port));
            var arguments=new ArrayList<>(List.of("python3","-c",driver));arguments.addAll(command.command().subList(1,command.command().size()));
            Path log=run.folder.resolve("marker-race.log");
            var builder=new ProcessBuilder(arguments).directory(ROOT.toFile()).redirectErrorStream(true).redirectOutput(log.toFile());
            builder.environment().putAll(command.environment());
            var checking=builder.start();
            await(() -> Files.exists(run.folder.resolve("cert-first-read")));
            db.runtime.execute("SELECT api_version.mark_usage('signed-progress')");
            assertThat(db.admin.queryForObject("SELECT bool_and(rolcanlogin) FROM pg_roles WHERE rolname IN ('tnbp_runtime','tnbp_migrator')",Boolean.class)).isTrue();
            Files.createFile(run.folder.resolve("cert-continue"));
            assertThat(checking.waitFor(90,TimeUnit.SECONDS)).isTrue();
            assertThat(checking.exitValue()).as(Files.readString(log)).isNotZero();
            assertThat(Files.readString(log)).contains("Altstart nach technischer Nutzung");
            assertThat(Files.exists(normal.resolve("instance.json"))).isFalse();assertThat(Files.exists(normal.resolve("rollback.json"))).isFalse();
            assertThat(db.admin.queryForObject("SELECT active FROM api_version.lifecycle",Boolean.class)).isFalse();
        }
    }

    @Test void fehlgeschlageneFolgemigrationErhaeltNachweisUndGeschlosseneAdmission() throws Exception {
        try(var db=new VersionDatabase();var run=new Running(db,false)) {
            run.start(RELEASE);assertThat(run.guard("retire",RELEASE).code).isZero();run.finish();
            var before=db.admin.queryForMap("SELECT * FROM api_version.state");
            Path broken=run.variant(RELEASE,"failed-migration.jar",Map.of("BOOT-INF/classes/db/migration/V11__broken.sql",
                "CREATE TABLE api_version.must_rollback(id integer); SELECT synthetic_missing_function();"));
            var rejected=run.guard("retire",broken);
            assertThat(rejected.code).isNotZero();assertThat(rejected.output).contains("Administrative Migration fehlgeschlagen");
            assertThat(db.admin.queryForMap("SELECT * FROM api_version.state")).isEqualTo(before);
            assertThat(db.admin.queryForObject("SELECT to_regclass('api_version.must_rollback') IS NULL",Boolean.class)).isTrue();
            assertThat(db.admin.queryForObject("SELECT bool_and(NOT rolcanlogin) FROM pg_roles WHERE rolname IN ('tnbp_runtime','tnbp_migrator')",Boolean.class)).isTrue();
            assertThat(run.guard("start",broken).code).isNotZero();
            assertThat(db.admin.queryForObject("SELECT bool_and(NOT rolcanlogin) FROM pg_roles WHERE rolname IN ('tnbp_runtime','tnbp_migrator')",Boolean.class)).isTrue();
        }
    }

    @ParameterizedTest @ValueSource(strings={"auth","csrf","origin","isolation","expense-edit","goal-edit","expense-delete","goal-delete","cookie-secure","cookie-http","cookie-samesite","cookie-path","cookie-domain","cookie-domain-empty","cookie-rotation","cookie-deletion","negative-progress"})
    void altzertifizierungVerweigertTatsaechlichFehlerhafteSecurityKontotrennungUndMutation(String failure) throws Exception {
        try(var db=new VersionDatabase();var run=new Running(db,false)) {
            Path broken=run.variant(oldRelease(run),"faulty-"+failure+".jar",Map.of("BOOT-INF/classes/application.properties",
                "spring.main.sources=de.linus.tnbp.versions.TransitionHooks\n"));
            run.environment.put("API_TEST_CERT_FAILURE",failure);
            var rejected=run.guard("certify-rollback",broken,"--check-port",Integer.toString(run.port));
            assertThat(rejected.code).as(rejected.output).isNotZero();
            String expected=switch(failure) {
                case "auth" -> "/access/me";
                case "csrf","origin" -> "/access/login";
                case "isolation" -> "Fremdes Budget sichtbar";
                case "expense-edit" -> "Ausgabenänderung nicht gespeichert";
                case "goal-edit" -> "Zieländerung nicht gespeichert";
                case "expense-delete" -> "Ausgabenlöschung nicht gespeichert";
                case "goal-delete" -> "Ziellöschung nicht gespeichert";
                case "negative-progress" -> "/progress";
                default -> "Refresh-Cookieattribute verletzen den Vertrag";
            };
            assertThat(rejected.output).contains(expected);
            assertThat(Files.exists(run.folder.resolve("rollback.json"))).isFalse();
            assertThat(db.admin.queryForObject("SELECT count(*) FROM access.accounts WHERE email LIKE 'rollback-%@example.org'",Integer.class)).isZero();
            assertThat(db.admin.queryForObject("SELECT active FROM api_version.lifecycle",Boolean.class)).isFalse();
        }
    }

    @Test void zertifizierungFruehfehlerHinterlaesstKeinenEigenenAktivenLebenszyklus() throws Exception {
        try(var db=new VersionDatabase();var run=new Running(db,false)) {
            Path old=oldRelease(run);
            run.start(RELEASE);assertThat(run.guard("stop",RELEASE).code).isZero();run.finish();
            Path other=run.folder.resolve("other");
            var rejected=run.guard("certify-rollback",old,"--state-dir",other.toString(),"--check-port",Integer.toString(run.port));
            assertThat(rejected.code).isNotZero();assertThat(rejected.output).contains("ungeklärt gesperrt");
            assertThat(db.admin.queryForObject("SELECT active FROM api_version.lifecycle",Boolean.class)).isFalse();
            assertThat(db.admin.queryForObject("SELECT bool_and(NOT rolcanlogin) FROM pg_roles WHERE rolname IN ('tnbp_runtime','tnbp_migrator')",Boolean.class)).isTrue();
            assertThat(Files.exists(other.resolve("instance.json"))).isFalse();
        }
    }

    @Test void altprozessStartfehlerHaeltExklusivenLebenszyklusBisZumPruefcleanup() throws Exception {
        try(var db=new VersionDatabase();var run=new Running(db,false)) {
            Path broken=run.variant(oldRelease(run),"failed-legacy-start.jar",Map.of("BOOT-INF/classes/application.properties",
                "spring.main.sources=missing.SyntheticConfiguration\n"));
            String driver="""
                import runpy,sys
                m=runpy.run_path(sys.argv[1]);G=m['Guard'];original=G.sql
                def observed(self,sql):
                    if sql.startswith('DO $$ DECLARE target uuid;'):
                        if original(self,'SELECT active FROM api_version.lifecycle WHERE singleton')!='t':
                            raise RuntimeError('Altprüfung verlor Lebenszyklus vor Cleanup')
                        print('Altpruefungs-Cleanup weiterhin exklusiv',flush=True)
                    return original(self,sql)
                G.sql=observed;sys.argv=sys.argv[1:];sys.exit(m['main']())
                """;
            var rejected=run.driver(driver,"certify-rollback",broken,"--check-port",Integer.toString(run.port));
            assertThat(rejected.code).isNotZero();assertThat(rejected.output).contains("missing.SyntheticConfiguration","Altpruefungs-Cleanup weiterhin exklusiv")
                .doesNotContain("verlor Lebenszyklus");
            assertThat(db.admin.queryForObject("SELECT active FROM api_version.lifecycle",Boolean.class)).isFalse();
            assertThat(db.admin.queryForObject("SELECT count(*) FROM access.accounts WHERE email LIKE 'rollback-%@example.org'",Integer.class)).isZero();
            assertThat(Files.exists(run.folder.resolve("rollback.json"))).isFalse();
        }
    }

    @ParameterizedTest @ValueSource(strings={"before-spawn","before-registration","foreign-owner","directory-sync-failure"})
    void hostneustartVorSpawnOderRegistrierungBrauchtEigenenDauerhaftenLebenszyklus(String phase) throws Exception {
        try(var db=new VersionDatabase();var run=new Running(db,false)) {
            try(var work=db.runtimeSource.getConnection()) {
                // Echte verbliebene Arbeit wird nur für die bereits gebundene Vorregistrierungsinstanz zugelassen.
                if(phase.equals("before-registration")) work.createStatement().execute("SET application_name='tnbp-api-pre-registration'");
                else work.close();
                String driver="""
                    import os,runpy,sys,uuid
                    m=runpy.run_path(sys.argv[1]);G=m['Guard'];old=G.bind_database
                    def prepare(self):
                        old(self)
                        if (self.folder/'prepared').exists(): return
                        (self.folder/'prepared').touch()
                        # Der reale DB-Erwerb muss seinen Bootbeleg bereits vor UPDATE dauerhaft besitzen.
                        sql=self.sql;sync=os.fsync;durable=[False]
                        def observed_sync(descriptor):
                            directory=os.readlink('/proc/self/fd/'+str(descriptor))==str(self.folder)
                            if directory and '__PHASE__'=='directory-sync-failure': raise OSError('synthetischer Verzeichnis-Syncfehler')
                            sync(descriptor)
                            if directory: durable[0]=True
                        os.fsync=observed_sync
                        def verify(statement):
                            if statement.startswith('UPDATE api_version.lifecycle SET active=true'):
                                proof=self.read('lifecycle.json')
                                if not durable[0] or proof['database']!=self.database or proof['controller']['boot']!=m['boot_id']():
                                    raise RuntimeError('Bootbeleg fehlt vor DB-Erwerb')
                            return sql(statement)
                        self.sql=verify
                        self.lifecycle(True)
                        proof=self.read('lifecycle.json');proof['controller']['boot']='synthetic-previous-boot'
                        if '__PHASE__'=='before-registration': proof.update(instance=str(uuid.uuid4()),application='tnbp-api-pre-registration')
                        self.write(proof,'lifecycle.json')
                        if '__PHASE__'=='foreign-owner': self.sql("UPDATE api_version.lifecycle SET owner_sha256=repeat('a',64)")
                        m['process_identity'].__globals__['boot_id']=lambda:'synthetic-current-boot'
                        def forbidden(*args): raise RuntimeError('Unzugeordnete PID signalisiert')
                        m['end_containment'].__globals__['signal_process']=forbidden
                    G.bind_database=prepare;sys.argv=sys.argv[1:];sys.exit(m['main']())
                    """.replace("__PHASE__",phase);
                var result=run.driver(driver,"stop",RELEASE);
                assertThat(Files.exists(run.folder.resolve("instance.json"))).isFalse();
                if(phase.equals("directory-sync-failure")) {
                    assertThat(result.code).isNotZero();assertThat(result.output).contains("synthetischer Verzeichnis-Syncfehler");
                    assertThat(db.admin.queryForObject("SELECT active FROM api_version.lifecycle",Boolean.class)).isFalse();
                    assertThat(db.admin.queryForObject("SELECT bool_and(rolcanlogin) FROM pg_roles WHERE rolname IN ('tnbp_runtime','tnbp_migrator')",Boolean.class)).isTrue();
                } else if(phase.equals("foreign-owner")) {
                    assertThat(result.code).isNotZero();assertThat(result.output).contains("gehört zu einem anderen Metadatenverzeichnis");
                    assertThat(db.admin.queryForObject("SELECT active FROM api_version.lifecycle",Boolean.class)).isTrue();
                    assertThat(db.admin.queryForObject("SELECT bool_and(rolcanlogin) FROM pg_roles WHERE rolname IN ('tnbp_runtime','tnbp_migrator')",Boolean.class)).isTrue();
                } else {
                    assertThat(result.code).as(result.output).isZero();
                    assertThat(db.admin.queryForObject("SELECT active FROM api_version.lifecycle",Boolean.class)).isFalse();
                    assertThat(db.admin.queryForObject("SELECT count(*) FROM pg_stat_activity WHERE application_name='tnbp-api-pre-registration'",Integer.class)).isZero();
                    run.start(RELEASE);run.finish();
                }
            }
        }
    }

    @Test void altzertifizierungBleibtMitFremdemProxyUndOhneNoProxyLokal() throws Exception {
        try(var db=new VersionDatabase();var run=new Running(db,false)) {
            var proxy=com.sun.net.httpserver.HttpServer.create(new java.net.InetSocketAddress("127.0.0.1",0),0);
            var requests=new java.util.concurrent.atomic.AtomicInteger();
            proxy.createContext("/",exchange->{ requests.incrementAndGet();exchange.sendResponseHeaders(502,-1);exchange.close(); });proxy.start();
            try {
                var command=run.command("certify-rollback",oldRelease(run),"--check-port",Integer.toString(run.port));
                command.environment().remove("no_proxy");command.environment().remove("NO_PROXY");
                for(String name:List.of("http_proxy","HTTP_PROXY","all_proxy","ALL_PROXY")) command.environment().put(name,"http://127.0.0.1:"+proxy.getAddress().getPort());
                Path log=run.folder.resolve("proxy-free-certification.log");var child=command.redirectOutput(log.toFile()).start();
                assertThat(child.waitFor(120,TimeUnit.SECONDS)).isTrue();assertThat(child.exitValue()).as(Files.readString(log)).isZero();
                assertThat(requests.get()).isZero();assertThat(Files.exists(run.folder.resolve("rollback.json"))).isTrue();
            } finally {proxy.stop(0);}
        }
    }
    @ParameterizedTest @ValueSource(strings={"cookie-no-rotation","replay","replay-family","access-lifetime","expired-access","cookie-refresh-lifetime","inactivity-limit","absolute-limit","neutral-login"})
    void altzertifizierungPrueftRotationReplayFristenUndNeutraleAnmeldung(String failure) throws Exception {
        try(var db=new VersionDatabase();var run=new Running(db,false)) {
            Path broken=run.variant(oldRelease(run),"session-"+failure+".jar",Map.of("BOOT-INF/classes/application.properties",
                "spring.main.sources=de.linus.tnbp.versions.TransitionHooks\n"));
            run.environment.put("API_TEST_CERT_FAILURE",failure);
            var denied=run.guard("certify-rollback",broken,"--check-port",Integer.toString(run.port));
            assertThat(denied.code).as(denied.output).isNotZero();
            assertThat(denied.output).contains(switch(failure) {
                case "cookie-no-rotation" -> "Refresh-Cookie wurde nicht rotiert";
                case "access-lifetime" -> "Access-/Antwortfrist verletzt";
                case "expired-access" -> "/access/me";
                case "cookie-refresh-lifetime" -> "Refresh-Cookiefrist verletzt";
                case "neutral-login" -> "Anmeldeablehnung verrät unbekannte Konten";
                default -> "/access/refresh";
            });
            assertThat(Files.exists(run.folder.resolve("rollback.json"))).isFalse();
            assertThat(db.admin.queryForObject("SELECT count(*) FROM access.accounts WHERE email LIKE 'rollback-%@example.org'",Integer.class)).isZero();
            assertThat(db.admin.queryForObject("SELECT active FROM api_version.lifecycle",Boolean.class)).isFalse();
        }
    }
    @Test void transitivErbenderGeschwisterLoginBleibtBisZumBestaetigungscommitGesperrt() throws Exception {
        try(var db=new VersionDatabase()) {
            String suffix=UUID.randomUUID().toString().replace("-","");String parent="parent_"+suffix,sibling="sibling_"+suffix;
            db.admin.execute("CREATE ROLE "+parent+";GRANT tnbp_runtime TO "+parent+";CREATE ROLE "+sibling+" LOGIN IN ROLE "+parent+" PASSWORD 'runtime-test-only'");
            try(var run=new Running(db,false)) {
                run.start(RELEASE);
                try(var unknown=new org.springframework.jdbc.datasource.DriverManagerDataSource(db.url,sibling,"runtime-test-only").getConnection()) {
                    var rejected=run.guard("retire",RELEASE);assertThat(rejected.code).isNotZero();assertThat(rejected.output).contains("Nicht zugeordnete Datenbankarbeit");
                    assertThat(db.admin.queryForObject("SELECT v1_retired FROM api_version.state",Boolean.class)).isFalse();
                }
                run.finish();
                String driver="""
                    import os,runpy,subprocess,sys
                    m=runpy.run_path(sys.argv[1]);G=m['Guard'];original=G.sql
                    def checked(self,sql):
                        if sql.startswith('BEGIN; DO $$'):
                            for role in (self.runtime,'__SIBLING__'):
                                environment=os.environ.copy();environment.update(RELEASE_DB_URL=self.url,DB_ADMIN_USER=role,DB_ADMIN_PASSWORD='runtime-test-only')
                                result=subprocess.run([m['java'](),'--class-path',str(self.folder/'postgresql.jar'),str(m['ROOT']/'scripts/ApiReleaseDatabase.java')],input='SELECT 1',text=True,capture_output=True,env=environment)
                                if result.returncode==0 or 'not permitted to log in' not in result.stderr: raise RuntimeError('Geschwister-Reconnect nicht nachweislich gesperrt: '+result.stderr)
                            print('Konfigurierter und transitiver Geschwister-LOGIN vor Commit gesperrt',flush=True)
                        return original(self,sql)
                    G.sql=checked;sys.argv=sys.argv[1:];sys.exit(m['main']())
                    """.replace("__SIBLING__",sibling);
                var retired=run.driver(driver,"retire",RELEASE);assertThat(retired.code).as(retired.output).isZero();
                assertThat(retired.output).contains("transitiver Geschwister-LOGIN vor Commit gesperrt");
            } finally {db.admin.execute("DROP ROLE "+sibling+";DROP ROLE "+parent);}
        }
    }

    static Path oldRelease(Running run) throws Exception {
        var build = new ProcessBuilder("bash", ROOT.resolve("scripts/build-reference-release.sh").toString()).directory(ROOT.toFile());
        build.environment().put("MAVEN_REPO_LOCAL", System.getProperty("maven.repo.local", Path.of(System.getProperty("user.home"), ".m2/repository").toString()));
        var buildLog = Files.createTempFile(run.folder, "reference-", ".log");
        var builder = build.redirectErrorStream(true).redirectOutput(buildLog.toFile()).start();
        assertThat(builder.waitFor(120, TimeUnit.SECONDS)).isTrue();
        assertThat(builder.exitValue()).as(Files.readString(buildLog)).isZero();
        return Path.of(Files.readAllLines(buildLog).getLast());
    }

    static void await(java.util.function.BooleanSupplier condition) throws Exception {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(40);
        while (!condition.getAsBoolean() && System.nanoTime() < deadline) Thread.sleep(30);
        assertThat(condition.getAsBoolean()).isTrue();
    }
    record Result(int code, String output) {}

    static final class Running implements AutoCloseable {
        final VersionDatabase db;
        final Path folder = Files.createTempDirectory("tnbp-release-it-", PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rwx------")));
        final Path harness;
        final int port;
        final String origin;
        final Map<String, String> environment = new HashMap<>();
        Process process;
        Path log;
        Running(VersionDatabase db, boolean hooks) throws Exception {
            this.db = db;
            try (var socket = new java.net.ServerSocket(0)) { port = socket.getLocalPort(); }
            origin = "http://127.0.0.1:" + port;
            harness = hooks ? instrument() : RELEASE;
            environment.put("DB_URL", db.url); environment.put("DB_ADMIN_USER", "postgres"); environment.put("DB_ADMIN_PASSWORD", "postgres");
            environment.put("DB_RUNTIME_USER", "tnbp_runtime"); environment.put("DB_RUNTIME_PASSWORD", "runtime-test-only");
            environment.put("DB_MIGRATION_USER", "tnbp_migrator"); environment.put("DB_MIGRATION_PASSWORD", "migration-test-only");
            environment.put("SERVER_PORT", Integer.toString(port)); environment.put("API_TEST_HOLD_DIR", folder.toString());
            environment.put("SESSION_SIGNING_KEY", Base64.getEncoder().encodeToString(new byte[32]));
            environment.put("SESSION_ISSUER", "transition-it"); environment.put("SESSION_AUDIENCE", "transition-spa-it");
            environment.put("SESSION_ORIGIN", "https://localhost:4200");
            if (hooks) environment.put("SPRING_MAIN_SOURCES", TransitionHooks.class.getName());
        }
        Path instrument() throws Exception {
            Path result = folder.resolve("synthetic-api.jar");
            try (var input = new ZipInputStream(Files.newInputStream(RELEASE)); var output = new ZipOutputStream(Files.newOutputStream(result))) {
                ZipEntry entry;
                while ((entry = input.getNextEntry()) != null) {
                    // Boot lädt verschachtelte JARs ausschließlich unkomprimiert.
                    var copy = new ZipEntry(entry.getName());
                    if (entry.getMethod() == ZipEntry.STORED) { copy.setMethod(ZipEntry.STORED); copy.setSize(entry.getSize()); copy.setCrc(entry.getCrc()); }
                    output.putNextEntry(copy); input.transferTo(output); output.closeEntry();
                }
                try (var classes = Files.list(ROOT.resolve("backend/target/test-classes/de/linus/tnbp/versions"))) {
                    for (Path type : classes.filter(path -> path.getFileName().toString().startsWith("TransitionHooks")).toList()) {
                        output.putNextEntry(new ZipEntry("BOOT-INF/classes/de/linus/tnbp/versions/" + type.getFileName()));
                        Files.copy(type, output); output.closeEntry();
                    }
                }
            }
            return result;
        }
        Path variant(Path source, String name, Map<String,String> entries) throws Exception {
            Path target = folder.resolve(name);
            try (var input = new ZipInputStream(Files.newInputStream(source)); var output = new ZipOutputStream(Files.newOutputStream(target))) {
                ZipEntry entry;
                while ((entry=input.getNextEntry())!=null) {
                    if (entries.containsKey(entry.getName())) continue;
                    var copy=new ZipEntry(entry.getName());
                    if(entry.getMethod()==ZipEntry.STORED){copy.setMethod(ZipEntry.STORED);copy.setSize(entry.getSize());copy.setCrc(entry.getCrc());}
                    output.putNextEntry(copy);input.transferTo(output);output.closeEntry();
                }
                for (var entryToAdd:entries.entrySet()) {
                    output.putNextEntry(new ZipEntry(entryToAdd.getKey())); output.write(entryToAdd.getValue().getBytes(java.nio.charset.StandardCharsets.UTF_8)); output.closeEntry();
                }
                if (!source.equals(harness) || harness.equals(RELEASE)) {
                    try (var classes=Files.list(ROOT.resolve("backend/target/test-classes/de/linus/tnbp/versions"))) {
                        for(Path type:classes.filter(path->path.getFileName().toString().startsWith("TransitionHooks")).toList()) {
                            output.putNextEntry(new ZipEntry("BOOT-INF/classes/de/linus/tnbp/versions/"+type.getFileName()));Files.copy(type,output);output.closeEntry();
                        }
                    }
                }
            }
            return target;
        }
        Result driver(String script, String action, Path release, String... extra) throws Exception {
            var normal=command(action,release,extra);
            var arguments=new ArrayList<>(List.of("python3","-c",script));arguments.addAll(normal.command().subList(1,normal.command().size()));
            Path log=Files.createTempFile(folder,"driver-",".log");
            var builder=new ProcessBuilder(arguments).directory(ROOT.toFile()).redirectErrorStream(true).redirectOutput(log.toFile());builder.environment().putAll(normal.environment());
            var child=builder.start();
            if(!child.waitFor(120,TimeUnit.SECONDS)){child.destroyForcibly();throw new IllegalStateException(Files.readString(log));}
            return new Result(child.exitValue(),Files.readString(log));
        }
        ProcessBuilder command(String action, Path release, String... extra) {
            var command = new ArrayList<>(List.of("python3", ROOT.resolve("scripts/api-release.py").toString(), action,
                "--release", release.toString(), "--tool-release", RELEASE.toString(), "--state-dir", folder.toString(),
                "--ready-url", origin + "/api/v2/access/csrf", "--timeout", "45"));
            command.addAll(List.of(extra));
            var builder = new ProcessBuilder(command).directory(ROOT.toFile()).redirectErrorStream(true);
            builder.environment().putAll(environment);
            if (!release.equals(harness) || harness.equals(RELEASE)) builder.environment().remove("SPRING_MAIN_SOURCES");
            return builder;
        }
        void start(Path release) throws Exception {
            log = Files.createTempFile(folder, "api-", ".log");
            process = command("start", release).redirectOutput(log.toFile()).start();
            await(() -> {
                if (!process.isAlive()) throw new IllegalStateException(readLog());
                return readLog().contains("API über v2 bereit");
            });
            var registered=JSON.readValue(Files.readString(folder.resolve("instance.json")),Map.class);
            var identity=(Map<String,Object>)registered.get("process");
            var variables=new String(Files.readAllBytes(Path.of("/proc/"+identity.get("pid")+"/environ")),java.nio.charset.StandardCharsets.UTF_8)
                .split(String.valueOf((char)0));
            var names=Arrays.stream(variables).map(value->value.split("=",2)[0]).toList();
            assertThat(names).as("Webprozess besitzt ausschließlich Laufzeit-Zugangsdaten").doesNotContain("DB_ADMIN_PASSWORD","DB_MIGRATION_PASSWORD");
        }
        String readLog() { try { return Files.readString(log); } catch (Exception failure) { throw new IllegalStateException(failure); } }
        Result guard(String action, Path release, String... extra) throws Exception {
            Path output = Files.createTempFile(folder, "guard-", ".log");
            var child = command(action, release, extra).redirectOutput(output.toFile()).start();
            if (!child.waitFor(120, TimeUnit.SECONDS)) { child.destroyForcibly(); throw new IllegalStateException("Guard hängt: " + Files.readString(output)); }
            return new Result(child.exitValue(), Files.readString(output));
        }
        void finish() throws Exception {
            if (process != null && process.isAlive()) process.destroy();
            if (process != null && !process.waitFor(20, TimeUnit.SECONDS)) { process.destroyForcibly(); throw new IllegalStateException(readLog()); }
            process = null;
        }
        @Override public void close() throws Exception {
            try { finish(); }
            finally {
                // Ausschließlich Testfixture: die nächste isolierte DB benutzt
                // dieselben synthetischen Clusterrollen.
                db.admin.execute("ALTER ROLE tnbp_runtime LOGIN; ALTER ROLE tnbp_migrator LOGIN");
            }
        }
    }

    static String kernelStart(Path stat) throws Exception {
        String raw=Files.readString(stat);return raw.substring(raw.lastIndexOf(')')+2).split(" ")[19];
    }

    static String token(UUID user) throws Exception {
        var now = java.time.Instant.now();
        var claims = new com.nimbusds.jwt.JWTClaimsSet.Builder().issuer("transition-it").audience("transition-spa-it")
            .subject(user.toString()).issueTime(java.util.Date.from(now)).notBeforeTime(java.util.Date.from(now))
            .expirationTime(java.util.Date.from(now.plusSeconds(600))).build();
        var jwt = new com.nimbusds.jwt.SignedJWT(new com.nimbusds.jose.JWSHeader(com.nimbusds.jose.JWSAlgorithm.HS256), claims);
        jwt.sign(new com.nimbusds.jose.crypto.MACSigner(new byte[32]));
        return jwt.serialize();
    }
}
