package de.linus.tnbp.versions;

import static org.assertj.core.api.Assertions.*;
import static de.linus.tnbp.versions.ReleaseTransitionIT.*;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/** Reale Konkurrenzfälle: getrennte 0700-Verzeichnisse, ein tatsächliches DB-Ziel. */
class AdministrativeSerializationIT {
    record Child(Process process, Path log) {
        Result finish() throws Exception {
            assertThat(process.waitFor(90,TimeUnit.SECONDS)).as(log.toString()).isTrue();
            return new Result(process.exitValue(),Files.readString(log));
        }
    }
    static Child spawn(Running run,String driver,String action,Path release,String... extra) throws Exception {
        var normal=run.command(action,release,extra);
        var args=new ArrayList<>(List.of("python3","-c",driver)); args.addAll(normal.command().subList(1,normal.command().size()));
        Path log=Files.createTempFile(run.folder,"concurrent-",".log");
        var builder=new ProcessBuilder(args).directory(ROOT.toFile()).redirectErrorStream(true).redirectOutput(log.toFile());
        builder.environment().putAll(normal.environment()); return new Child(builder.start(),log);
    }
    static String pauseBefore(String method,Path folder) {
        return """
            import runpy,sys,time
            from pathlib import Path
            m=runpy.run_path(sys.argv[1]); G=m['Guard']; original=getattr(G,'__METHOD__')
            def paused(self,*args,**kwargs):
                Path('__FOLDER__/entered').touch()
                while not Path('__FOLDER__/continue-admin').exists(): time.sleep(.01)
                return original(self,*args,**kwargs)
            setattr(G,'__METHOD__',paused);sys.argv=sys.argv[1:];sys.exit(m['main']())
            """.replace("__METHOD__",method).replace("__FOLDER__",folder.toString());
    }
    @ParameterizedTest @ValueSource(strings={"9","10"})
    void zweiVerzeichnisseUndDbAliasKoennenMigrationUndStartNichtUeberlappen(String version) throws Exception {
        try(var db=new VersionDatabase(version);var first=new Running(db,false);var second=new Running(db,false)) {
            second.environment.put("DB_URL",db.url.replace("localhost","127.0.0.1"));
            second.environment.put("TMPDIR",second.folder.toString());
            var owner=spawn(first,pauseBefore("migrate",first.folder),"start",RELEASE);
            first.process=owner.process();first.log=owner.log();
            await(() -> Files.exists(first.folder.resolve("entered")));
            var waiter=spawn(second,pauseBefore("migrate",second.folder),"start",RELEASE);
            await(() -> Boolean.TRUE.equals(db.admin.queryForObject("SELECT EXISTS(SELECT FROM pg_stat_activity WHERE application_name LIKE 'tnbp-release-guard-%' AND wait_event='advisory')",Boolean.class)));
            assertThat(Files.exists(second.folder.resolve("database.json"))).isFalse();
            Files.createFile(first.folder.resolve("continue-admin"));
            await(() -> first.readLog().contains("API über v2 bereit"));
            var rejected=waiter.finish();assertThat(rejected.code()).as(rejected.output()).isNotZero();
            assertThat(rejected.output()).contains("DB-Lebenszyklus ist noch aktiv");
            assertThat(Files.exists(second.folder.resolve("entered"))).isFalse();
            first.finish();
        }
    }
    @Test void wartenderAltstartLiestErstNachFremdemStilllegungscommitUndKannNichtCompatibleStarten() throws Exception {
        try(var db=new VersionDatabase();var oldFolder=new Running(db,false);var current=new Running(db,false)) {
            Path old=oldRelease(oldFolder);
            var certificate=oldFolder.guard("certify-rollback",old,"--check-port",Integer.toString(oldFolder.port));
            assertThat(certificate.code()).as(certificate.output()).isZero();
            current.start(RELEASE);
            var retiring=spawn(current,pauseBefore("confirm",current.folder),"retire",RELEASE);
            await(() -> Files.exists(current.folder.resolve("entered")));
            var waiting=spawn(oldFolder,"import runpy,sys;sys.argv=sys.argv[1:];runpy.run_path(sys.argv[0],run_name='__main__')","start",old);
            await(() -> Boolean.TRUE.equals(db.admin.queryForObject("SELECT EXISTS(SELECT FROM pg_stat_activity WHERE application_name LIKE 'tnbp-release-guard-%' AND wait_event='advisory')",Boolean.class)));
            Files.createFile(current.folder.resolve("continue-admin"));
            var retired=retiring.finish();assertThat(retired.code()).as(retired.output()).isZero();
            var denied=waiting.finish();assertThat(denied.code()).as(denied.output()).isNotZero();
            assertThat(denied.output()).contains("Release passt nicht zum bestätigten Stilllegungszustand");
            assertThat(db.admin.queryForObject("SELECT v1_retired FROM api_version.state",Boolean.class)).isTrue();
            current.finish();
        }
    }
    @Test void veralteterGestoppterOrdnerKannFremdeAktiveAdmissionNichtSchliessen() throws Exception {
        try(var db=new VersionDatabase();var stale=new Running(db,false);var active=new Running(db,false)) {
            stale.start(RELEASE);assertThat(stale.guard("retire",RELEASE).code()).isZero();stale.finish();
            active.start(RELEASE);
            var denied=stale.guard("stop",RELEASE);assertThat(denied.code()).isNotZero();
            assertThat(denied.output()).contains("gehört zu einem anderen Metadatenverzeichnis");
            assertThat(db.admin.queryForObject("SELECT bool_and(rolcanlogin) FROM pg_roles WHERE rolname IN ('tnbp_runtime','tnbp_migrator')",Boolean.class)).isTrue();
            assertThat(active.process.isAlive()).isTrue();
        }
    }
    @Test void beendeteIdentitaetMitWiederverwendeterPidBlockiertUndSignalisiertFremdprozessNicht() throws Exception {
        try(var db=new VersionDatabase();var run=new Running(db,false)) {
            run.start(RELEASE);assertThat(run.guard("retire",RELEASE).code()).isZero();run.finish();
            var saved=Files.readString(run.folder.resolve("instance.json"));
            var incomplete=new LinkedHashMap<>(JSON.readValue(saved,Map.class));incomplete.remove("containment_stopped");incomplete.remove("contained_exit");
            Files.writeString(run.folder.resolve("instance.json"),JSON.writeValueAsString(incomplete));
            var missing=run.guard("start",RELEASE);assertThat(missing.code()).isNotZero();assertThat(missing.output()).contains("Ungeklärtes Ende des registrierten Containments");
            Files.writeString(run.folder.resolve("instance.json"),saved);
            var foreign=new ProcessBuilder("sleep","120").start();
            try {
                String driver="""
                    import runpy,sys
                    m=runpy.run_path(sys.argv[1]);G=m['Guard'];old=G.bind_database
                    def changed(self):
                        old(self);record=self.read();identity=m['process_identity'](__PID__)
                        identity['start']='old-kernel-start'
                        record.update(process=identity,supervisor=identity);self.write(record)
                    G.bind_database=changed;sys.argv=sys.argv[1:];sys.exit(m['main']())
                    """.replace("__PID__",Long.toString(foreign.pid()));
                var stopped=run.driver(driver,"stop",RELEASE);assertThat(stopped.code()).as(stopped.output()).isZero();
                assertThat(foreign.isAlive()).isTrue();run.start(RELEASE);run.finish();assertThat(foreign.isAlive()).isTrue();
            } finally { foreign.destroyForcibly();foreign.waitFor(); }
        }
    }
    @ParameterizedTest @ValueSource(strings={"collation","view"})
    void wirksameKollationUndViewdefinitionEntziehenDenSchemaNachweis(String drift) throws Exception {
        try(var db=new VersionDatabase();var run=new Running(db,false)) {
            db.admin.execute("CREATE TABLE api_version.collation_probe(value text COLLATE \"C\"); CREATE VIEW api_version.view_probe AS SELECT 1 AS value");
            run.start(RELEASE);assertThat(run.guard("retire",RELEASE).code()).isZero();run.finish();
            var before=run.guard("snapshot",RELEASE);assertThat(before.code()).isZero();
            db.admin.execute(drift.equals("collation")?"ALTER TABLE api_version.collation_probe ALTER COLUMN value TYPE text COLLATE \"POSIX\"":"CREATE OR REPLACE VIEW api_version.view_probe AS SELECT 2 AS value");
            var after=run.guard("snapshot",RELEASE);assertThat(after.code()).isZero();assertThat(after.output()).isNotEqualTo(before.output());
            var denied=run.guard("start",RELEASE);assertThat(denied.code()).isNotZero();assertThat(denied.output()).contains("Schema-/Rollenzustand weicht");
        }
    }
    @Test void sortierungBleibtBeiUmgekehrterAnlageVonDefaultAclUndGrantorenGleich() throws Exception {
        try(var db=new VersionDatabase();var run=new Running(db,false)) {
            String prefix="sort_"+UUID.randomUUID().toString().replace("-","");
            String role=prefix+"_role",one=prefix+"_one",two=prefix+"_two",member=prefix+"_member";
            db.admin.execute("CREATE ROLE "+role+";CREATE ROLE "+one+";CREATE ROLE "+two+";CREATE ROLE "+member+";GRANT "+role+" TO "+one+","+two+" WITH ADMIN OPTION");
            try {
                for(String grantor:List.of(one,two)) db.admin.execute("GRANT "+role+" TO "+member+" GRANTED BY "+grantor);
                db.admin.execute("ALTER DEFAULT PRIVILEGES FOR ROLE "+role+" IN SCHEMA api_version GRANT SELECT ON TABLES TO tnbp_runtime; ALTER DEFAULT PRIVILEGES FOR ROLE "+role+" IN SCHEMA api_version GRANT USAGE ON SEQUENCES TO tnbp_runtime");
                var before=run.guard("snapshot",RELEASE);assertThat(before.code()).as(before.output()).isZero();
                for(String grantor:List.of(one,two)) db.admin.execute("REVOKE "+role+" FROM "+member+" GRANTED BY "+grantor);
                db.admin.execute("ALTER DEFAULT PRIVILEGES FOR ROLE "+role+" IN SCHEMA api_version REVOKE SELECT ON TABLES FROM tnbp_runtime; ALTER DEFAULT PRIVILEGES FOR ROLE "+role+" IN SCHEMA api_version REVOKE USAGE ON SEQUENCES FROM tnbp_runtime");
                for(String grantor:List.of(two,one)) db.admin.execute("GRANT "+role+" TO "+member+" GRANTED BY "+grantor);
                db.admin.execute("ALTER DEFAULT PRIVILEGES FOR ROLE "+role+" IN SCHEMA api_version GRANT USAGE ON SEQUENCES TO tnbp_runtime; ALTER DEFAULT PRIVILEGES FOR ROLE "+role+" IN SCHEMA api_version GRANT SELECT ON TABLES TO tnbp_runtime");
                var after=run.guard("snapshot",RELEASE);assertThat(after.code()).isZero();assertThat(after.output()).isEqualTo(before.output());
            } finally { db.admin.execute("DROP OWNED BY "+role+";DROP ROLE "+member+","+one+","+two+","+role); }
        }
    }
    @Test void verloreneDbSperrverbindungErlaubtKeineFortsetzungMitNeuemKanal() throws Exception {
        try(var db=new VersionDatabase();var run=new Running(db,false)) {
            String driver="""
                import runpy,sys
                m=runpy.run_path(sys.argv[1]);G=m['Guard']
                def lost(self,target):
                    try: self.sql('SELECT pg_terminate_backend(pg_backend_pid())')
                    except RuntimeError: pass
                    self.sql("UPDATE api_version.state SET v1_retired=true")
                G.migrate=lost;sys.argv=sys.argv[1:];sys.exit(m['main']())
                """;
            var denied=run.driver(driver,"start",RELEASE);assertThat(denied.code()).isNotZero();
            assertThat(denied.output()).contains("keine Fortsetzung");
            assertThat(Files.exists(run.folder.resolve("instance.json"))).isFalse();
            assertThat(db.admin.queryForObject("SELECT v1_retired FROM api_version.state",Boolean.class)).isFalse();
            assertThat(db.admin.queryForObject("SELECT bool_and(NOT rolcanlogin) FROM pg_roles WHERE rolname IN ('tnbp_runtime','tnbp_migrator')",Boolean.class)).isTrue();
            run.start(RELEASE);run.finish();
        }
    }
    @Test void statischerUebergangsfehlerStopptErsatzguardSofortUndErlaubtRetry() throws Exception {
        try(var db=new VersionDatabase();var run=new Running(db,false)) {
            run.start(RELEASE);
            var environment=new HashMap<>(run.environment);environment.put("E2E_GUARD_STATE_DIR",run.folder.toString());
            Files.writeString(run.folder.resolve("environment.json"),JSON.writeValueAsString(environment));
            Files.createDirectory(run.folder.resolve("static.next"));
            String driver="""
                import runpy,sys,subprocess
                from pathlib import Path
                module=runpy.run_path(sys.argv[1]);original=subprocess.Popen
                def launch(command,*args,**kwargs):
                    if len(command)>2 and command[2]=='start': command=command+['--ready-url','__ORIGIN__/api/v2/access/csrf']
                    return original(command,*args,**kwargs)
                subprocess.Popen=launch
                module['main'].__globals__['FOLDER']=Path('__FOLDER__')
                module['main']()
                """.replace("__ORIGIN__",run.origin).replace("__FOLDER__",run.folder.toString());
            Path log=run.folder.resolve("failed-static-transition.log");
            var builder=new ProcessBuilder("python3","-c",driver,ROOT.resolve("scripts/e2e-transition.py").toString()).directory(ROOT.toFile()).redirectErrorStream(true).redirectOutput(log.toFile());
            var child=builder.start();assertThat(child.waitFor(90,TimeUnit.SECONDS)).as(Files.readString(log)).isTrue();
            assertThat(child.exitValue()).as(Files.readString(log)).isNotZero();assertThat(Files.readString(log)).contains("IsADirectoryError");
            var record=JSON.readValue(Files.readString(run.folder.resolve("instance.json")),Map.class);
            assertThat(record.get("stopped")).as(Files.readString(run.folder.resolve("retired-api.log"))).isEqualTo(true);assertThat(record.get("containment_stopped")).isEqualTo(true);
            assertThat(db.admin.queryForObject("SELECT active FROM api_version.lifecycle",Boolean.class)).as(run.readLog()).isFalse();
            assertThat(db.admin.queryForObject("SELECT count(*) FROM pg_stat_activity WHERE datname=current_database() AND usename='tnbp_runtime'",Integer.class)).isZero();
            run.finish();run.start(RELEASE);run.finish();
        }
    }
    @Test void laufenderGuardStopptNachEntfernungSeinerOriginalWerkzeugJar() throws Exception {
        try(var db=new VersionDatabase();var run=new Running(db,false)) {
            Path original=run.folder.resolve("tool-original.jar");Files.copy(RELEASE,original);
            run.log=run.folder.resolve("bound-tool.log");
            run.process=run.command("start",RELEASE,"--tool-release",original.toString()).redirectOutput(run.log.toFile()).start();
            await(() -> run.readLog().contains("API über v2 bereit"));
            Files.delete(original);run.finish();
            assertThat(run.readLog()).doesNotContain("NoSuchFileException","FileNotFoundError");
            assertThat(db.admin.queryForObject("SELECT active FROM api_version.lifecycle",Boolean.class)).as(run.readLog()).isFalse();
            assertThat(db.admin.queryForObject("SELECT count(*) FROM pg_stat_activity WHERE datname=current_database() AND usename='tnbp_runtime'",Integer.class)).isZero();
            assertThat(JSON.readValue(Files.readString(run.folder.resolve("instance.json")),Map.class).get("stopped")).isEqualTo(true);
        }
    }
    @Test void erneutesTermSignalUnterbrichtDenBereitsBegonnenenStoppNicht() throws Exception {
        try(var db=new VersionDatabase();var run=new Running(db,false)) {
            String driver="""
                import contextlib,runpy,sys,time
                from pathlib import Path
                m=runpy.run_path(sys.argv[1]);G=m['Guard'];original=G.lock
                @contextlib.contextmanager
                def paused(self):
                    self.lock_calls=getattr(self,'lock_calls',0)+1
                    if self.lock_calls==2:
                        Path('__FOLDER__/cleanup-entered').touch()
                        while not Path('__FOLDER__/continue-cleanup').exists(): time.sleep(.01)
                    with original(self): yield
                G.lock=paused;sys.argv=sys.argv[1:]
                try: sys.exit(m['main']())
                except KeyboardInterrupt: sys.exit(130)
                """.replace("__FOLDER__",run.folder.toString());
            var child=spawn(run,driver,"start",RELEASE);run.process=child.process();run.log=child.log();
            await(() -> run.readLog().contains("API über v2 bereit"));
            run.process.destroy();
            await(() -> Files.exists(run.folder.resolve("cleanup-entered")));
            var signal=new ProcessBuilder("kill","-TERM",Long.toString(run.process.pid())).start();
            assertThat(signal.waitFor(5,TimeUnit.SECONDS)).isTrue();assertThat(signal.exitValue()).isZero();
            Files.createFile(run.folder.resolve("continue-cleanup"));
            assertThat(run.process.waitFor(20,TimeUnit.SECONDS)).as(run.readLog()).isTrue();
            assertThat(run.process.exitValue()).as(run.readLog()).isEqualTo(130);
            assertThat(db.admin.queryForObject("SELECT active FROM api_version.lifecycle",Boolean.class)).as(run.readLog()).isFalse();
            assertThat(JSON.readValue(Files.readString(run.folder.resolve("instance.json")),Map.class).get("stopped")).isEqualTo(true);
            assertThat(db.admin.queryForObject("SELECT count(*) FROM pg_stat_activity WHERE datname=current_database() AND usename='tnbp_runtime'",Integer.class)).isZero();
            run.finish();run.start(RELEASE);run.finish();
        }
    }
    @ParameterizedTest @ValueSource(strings={"database-owner","connect","create","temporary","rule-definition","rule-enable"})
    void datenbankEigentuemerAclUndRewriteRegelnSindTeilDesNachweises(String drift) throws Exception {
        try(var db=new VersionDatabase();var run=new Running(db,false)) {
            db.admin.execute("CREATE TABLE api_version.rule_probe(id integer)");
            if(drift.equals("rule-enable")) db.admin.execute("CREATE RULE block_insert AS ON INSERT TO api_version.rule_probe DO INSTEAD NOTHING");
            run.start(RELEASE);assertThat(run.guard("retire",RELEASE).code()).isZero();run.finish();
            var before=run.guard("snapshot",RELEASE);assertThat(before.code()).isZero();
            db.admin.execute(switch(drift) {
                case "database-owner" -> "ALTER DATABASE "+db.name+" OWNER TO postgres";
                case "connect" -> "REVOKE CONNECT ON DATABASE "+db.name+" FROM PUBLIC";
                case "create" -> "GRANT CREATE ON DATABASE "+db.name+" TO tnbp_runtime";
                case "temporary" -> "REVOKE TEMPORARY ON DATABASE "+db.name+" FROM PUBLIC";
                case "rule-definition" -> "CREATE RULE block_insert AS ON INSERT TO api_version.rule_probe DO INSTEAD NOTHING";
                default -> "ALTER TABLE api_version.rule_probe DISABLE RULE block_insert";
            });
            var after=run.guard("snapshot",RELEASE);assertThat(after.code()).isZero();assertThat(after.output()).isNotEqualTo(before.output());
            var rejected=run.guard("start",RELEASE);assertThat(rejected.code()).isNotZero();assertThat(rejected.output()).contains("Schema-/Rollenzustand weicht");
        }
    }
    @Test void todDesGuardsGibtSperreNichtVorEndeBereitsGestarteterMigrationFrei() throws Exception {
        try(var db=new VersionDatabase();var first=new Running(db,false);var second=new Running(db,false)) {
            String driver="""
                import os,runpy,sys,subprocess
                m=runpy.run_path(sys.argv[1]);original=subprocess.run
                wrapper='''
                import os,sys,time
                from pathlib import Path
                Path('__FOLDER__/migration-child').write_text(str(os.getpid()))
                while not Path('__FOLDER__/continue-admin').exists(): time.sleep(.01)
                os.execv(sys.argv[1],sys.argv[1:])
                '''
                def paused(command,*args,**kwargs):
                    if '--api.version.migrate-only=true' in command:
                        command=[sys.executable,'-c',wrapper,*command]
                    return original(command,*args,**kwargs)
                subprocess.run=paused;sys.argv=sys.argv[1:];sys.exit(m['main']())
                """.replace("__FOLDER__",first.folder.toString());
            Path migrating=first.variant(RELEASE,"parent-death-migration.jar",Map.of("BOOT-INF/classes/db/migration/V11__parent_death.sql",
                "SELECT pg_sleep(2); CREATE TABLE api_version.parent_death_finished(id integer)"));
            var killed=spawn(first,driver,"start",migrating);
            await(() -> Files.exists(first.folder.resolve("migration-child")));
            long migration=Long.parseLong(Files.readString(first.folder.resolve("migration-child")));
            killed.process().destroyForcibly();assertThat(killed.process().waitFor(10,TimeUnit.SECONDS)).isTrue();
            String observer="""
                import runpy,sys
                m=runpy.run_path(sys.argv[1]);G=m['Guard'];original=G.bind_database
                def entered(self):
                    original(self)
                    if m['process_identity'](__PID__) is not None: raise RuntimeError('Migrationskind bei Eintritt noch ausführbar')
                    if self.sql("SELECT to_regclass('api_version.parent_death_finished') IS NOT NULL")!='t':
                        raise RuntimeError('Administrative Migration bei Eintritt nicht abgeschlossen')
                G.bind_database=entered;sys.argv=sys.argv[1:];sys.exit(m['main']())
                """.replace("__PID__",Long.toString(migration));
            var waiting=spawn(second,observer,"snapshot",RELEASE);
            try {
            await(() -> Boolean.TRUE.equals(db.admin.queryForObject("SELECT EXISTS(SELECT FROM pg_stat_activity WHERE application_name LIKE 'tnbp-release-guard-%' AND (wait_event='advisory' OR (state='idle' AND query LIKE '%pg_control_system%')))",Boolean.class)));
            assertThat(Files.exists(second.folder.resolve("database.json"))).isFalse();
            Files.createFile(first.folder.resolve("continue-admin"));
            var completed=waiting.finish();assertThat(completed.code()).as(completed.output()).isZero();
            await(() -> ProcessHandle.of(migration).map(p-> !p.isAlive() || p.info().command().isEmpty()).orElse(true));
            assertThat(Files.exists(first.folder.resolve("instance.json"))).isFalse();
            } finally {
                if(!Files.exists(first.folder.resolve("continue-admin"))) Files.createFile(first.folder.resolve("continue-admin"));
                if(!waiting.process().waitFor(30,TimeUnit.SECONDS)) waiting.process().destroyForcibly();
            }
        }
    }
}
