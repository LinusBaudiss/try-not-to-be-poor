package de.linus.tnbp.savingsgoals;

import static org.assertj.core.api.Assertions.*;
import de.linus.tnbp.access.PostgresFixture;
import de.linus.tnbp.finance.FinanceApplication;
import de.linus.tnbp.shared.ApiVersionState;
import de.linus.tnbp.shared.FinanceTransactions;
import de.linus.tnbp.shared.Money;
import java.net.URI;
import java.net.http.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import tools.jackson.databind.json.JsonMapper;

/** Freigegebener realer HTTP-/Persistenzweg; Prozessstilllegung zusätzlich in ReleaseTransitionIT. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@org.junit.jupiter.api.extension.ExtendWith(org.springframework.boot.test.system.OutputCaptureExtension.class)
class SignedProgressIT {
    static final String HASH = "a".repeat(64);
    static final String NAME = "signed_" + UUID.randomUUID().toString().replace("-", "");
    static final String URL = "jdbc:postgresql://localhost:" + PostgresFixture.POSTGRES.getPort() + "/" + NAME;
    static final JdbcTemplate SERVER = new JdbcTemplate(PostgresFixture.POSTGRES.getPostgresDatabase());
    static final JdbcTemplate ADMIN;
    static final JsonMapper JSON = JsonMapper.builder().build();
    static {
        SERVER.execute("CREATE DATABASE " + NAME + " OWNER tnbp_migrator");
        Flyway.configure().dataSource(URL, "tnbp_migrator", "migration-test-only").schemas("access").defaultSchema("access").load().migrate();
        ADMIN = new JdbcTemplate(new DriverManagerDataSource(URL, "postgres", "postgres"));
        ADMIN.execute("SELECT api_version.set_retirement(true,gen_random_uuid(),repeat('a',64),repeat('a',64),repeat('a',64))");
    }
    @LocalServerPort int port;
    @Autowired FinanceApplication application;
    @Autowired FinanceTransactions transactions;
    @Autowired ApiVersionState versions;
    @Autowired SavingsGoals goals;
    @Autowired JdbcTemplate jdbc;
    UUID first, second;
    @DynamicPropertySource static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> URL);
        registry.add("spring.datasource.username", () -> "tnbp_runtime");
        registry.add("spring.datasource.password", () -> "runtime-test-only");
        registry.add("spring.flyway.url", () -> URL);
        registry.add("spring.flyway.user", () -> "tnbp_migrator");
        registry.add("spring.flyway.password", () -> "migration-test-only");
        registry.add("api.version.mode", () -> "retired");
        registry.add("api.version.release-sha256", () -> HASH);
        registry.add("api.version.instance-id", () -> UUID.randomUUID().toString());
        registry.add("api.features.signed-progress", () -> "true");
        registry.add("access.session.signing-key", () -> Base64.getEncoder().encodeToString(new byte[32]));
        registry.add("access.session.issuer", () -> "signed-test");
        registry.add("access.session.audience", () -> "signed-spa");
        registry.add("access.session.origin", () -> "https://localhost:4200");
    }
    @BeforeEach void reset() {
        ADMIN.execute("TRUNCATE access.accounts CASCADE");
        // Ausschließlich isolierte synthetische Testfixture; Produktivtrigger bleibt unverändert monoton.
        ADMIN.execute("ALTER TABLE api_version.state DISABLE TRIGGER monotone_usage; UPDATE api_version.state SET signed_progress_used=false; ALTER TABLE api_version.state ENABLE TRIGGER monotone_usage");
        first=UUID.randomUUID(); second=UUID.randomUUID();
        for (var user : List.of(first,second)) ADMIN.update("INSERT INTO access.accounts VALUES (?,?,'$argon2id$synthetic',now())",user,user+"@example.org");
    }
    @AfterAll static void close() { SERVER.execute("DROP DATABASE " + NAME + " WITH (FORCE)"); }
    String token(UUID user) throws Exception {
        var now=Instant.now();
        var claims=new com.nimbusds.jwt.JWTClaimsSet.Builder().issuer("signed-test").audience("signed-spa").subject(user.toString())
            .issueTime(Date.from(now)).notBeforeTime(Date.from(now)).expirationTime(Date.from(now.plusSeconds(600))).build();
        var jwt=new com.nimbusds.jwt.SignedJWT(new com.nimbusds.jose.JWSHeader(com.nimbusds.jose.JWSAlgorithm.HS256),claims);
        jwt.sign(new com.nimbusds.jose.crypto.MACSigner(new byte[32]));return jwt.serialize();
    }
    HttpResponse<String> call(String method,String path,String body,UUID user) throws Exception {
        var request=HttpRequest.newBuilder(URI.create("http://localhost:"+port+path));
        if(user!=null)request.header("Authorization","Bearer "+token(user));
        if(body!=null)request.header("Content-Type","application/json");
        var result=HttpClient.newHttpClient().send(request.method(method,body==null?HttpRequest.BodyPublishers.noBody():HttpRequest.BodyPublishers.ofString(body)).build(),HttpResponse.BodyHandlers.ofString());
        assertThat(result.headers().firstValue("Cache-Control")).hasValue("no-store");return result;
    }
    UUID goal(UUID user) { return application.saveGoal(user,"Eigenes Ziel",10000L,LocalDate.of(2028,2,29)).id(); }
    HttpResponse<String> progress(UUID id,String cents,UUID user) throws Exception {
        return call("PUT","/api/v2/savings-goals/"+id+"/progress","{\"progressCents\":"+cents+"}",user);
    }
    boolean marked() { return Boolean.TRUE.equals(ADMIN.queryForObject("SELECT signed_progress_used FROM api_version.state",Boolean.class)); }

    @Test void capabilityIstGeschuetztReinLesendUndFailClosedBeiVeraltetemBelegOderSchema() throws Exception {
        assertThat(call("GET","/api/v2/capabilities",null,null).statusCode()).isEqualTo(401);
        assertThat(call("GET","/api/v2/capabilities",null,first).body()).isEqualTo("{\"signedProgressAvailable\":true}");
        assertThat(marked()).isFalse();
        UUID id=goal(first);
        for(String column:List.of("release_sha256","schema_sha256","roles_sha256","stopped_instance","retired_at")) {
            Object before=ADMIN.queryForObject("SELECT "+column+" FROM api_version.state",Object.class);
            String changed=column.equals("stopped_instance")?"gen_random_uuid()":column.equals("retired_at")?"retired_at+interval '1 second'":"repeat('b',64)";
            try {
                ADMIN.execute("UPDATE api_version.state SET "+column+"="+changed);
                assertThat(call("GET","/api/v2/capabilities",null,first).body()).isEqualTo("{\"signedProgressAvailable\":false}");
                assertThat(progress(id,"-3000",first).statusCode()).isEqualTo(409);
                assertThat(progress(id,"7000",first).statusCode()).isEqualTo(200);
                assertThat(marked()).isFalse();
            } finally {ADMIN.update("UPDATE api_version.state SET "+column+"=?",before);}
        }
        var otherConstraints=ADMIN.queryForList("SELECT conname,pg_get_constraintdef(oid),convalidated FROM pg_constraint WHERE conrelid='savings_goals.goals'::regclass AND conname<>'goals_progress_cents_check' ORDER BY conname");
        for(String definition:List.of("CHECK(progress_cents BETWEEN 0 AND 9007199254740991)", "CHECK(true)", "CHECK(progress_cents BETWEEN -9007199254740991 AND 9007199254740991) NOT VALID")) {
            var before=application.allGoals(first);
            try {
                ADMIN.execute("ALTER TABLE savings_goals.goals DROP CONSTRAINT goals_progress_cents_check; ALTER TABLE savings_goals.goals ADD CONSTRAINT goals_progress_cents_check "+definition);
                assertThat(versions.signedProgressAvailable()).isFalse();
                assertThat(call("GET","/api/v2/capabilities",null,first).body()).isEqualTo("{\"signedProgressAvailable\":false}");
                assertThat(progress(id,"-3000",first).statusCode()).isEqualTo(409);
                assertThat(application.allGoals(first)).isEqualTo(before);assertThat(marked()).isFalse();
                assertThat(ADMIN.queryForList("SELECT conname,pg_get_constraintdef(oid),convalidated FROM pg_constraint WHERE conrelid='savings_goals.goals'::regclass AND conname<>'goals_progress_cents_check' ORDER BY conname")).isEqualTo(otherConstraints);
            } finally {ADMIN.execute("ALTER TABLE savings_goals.goals DROP CONSTRAINT goals_progress_cents_check; ALTER TABLE savings_goals.goals ADD CONSTRAINT goals_progress_cents_check CHECK(progress_cents BETWEEN -9007199254740991 AND 9007199254740991)");}
        }
        var proof=ADMIN.queryForMap("SELECT * FROM api_version.state");
        try {
            ADMIN.execute("ALTER TABLE api_version.state DISABLE TRIGGER monotone_usage; DELETE FROM api_version.state; ALTER TABLE api_version.state ENABLE TRIGGER monotone_usage");
            assertThat(call("GET","/api/v2/capabilities",null,first).body()).isEqualTo("{\"signedProgressAvailable\":false}");
            assertThat(progress(id,"-3000",first).statusCode()).isEqualTo(409);
        } finally {
            ADMIN.update("INSERT INTO api_version.state(singleton,v1_retired,signed_progress_used,monthly_effects_used,stopped_instance,release_sha256,schema_sha256,roles_sha256,retired_at) VALUES(true,?,?,?,?,?,?,?,?)",proof.get("v1_retired"),proof.get("signed_progress_used"),proof.get("monthly_effects_used"),proof.get("stopped_instance"),proof.get("release_sha256"),proof.get("schema_sha256"),proof.get("roles_sha256"),proof.get("retired_at"));
        }
        var closed=new ApiVersionState(jdbc,"retired",HASH,UUID.randomUUID().toString(),false);
        assertThat(closed.signedProgressAvailable()).isFalse();
    }
    @ParameterizedTest @ValueSource(strings = {"table", "view", "domain"})
    void temporaereObjekteKoennenWederSchemaFreigebenNochMitDefinerRechtenSchreiben(String attack) throws Exception {
        ADMIN.execute("CREATE TABLE api_version.probe_effects(observed_role text); ALTER TABLE api_version.probe_effects OWNER TO tnbp_migrator; REVOKE ALL ON api_version.probe_effects FROM PUBLIC,tnbp_runtime");
        try (var session = new DriverManagerDataSource(URL,"tnbp_runtime","runtime-test-only").getConnection()) {
            // Dieselbe echte Runtime-Sitzung erzeugt die temporären Objekte und ruft die Definer-Funktion auf.
            var runtime = new JdbcTemplate(new SingleConnectionDataSource(session, true));
            assertThat(runtime.queryForObject("SELECT current_user",String.class)).isEqualTo("tnbp_runtime");
            assertThat(runtime.queryForObject("SELECT has_database_privilege(current_user,current_database(),'TEMP')",Boolean.class)).isTrue();
            var state = new ApiVersionState(runtime,"retired",HASH,UUID.randomUUID().toString(),true);
            assertThat(state.signedProgressAvailable()).isTrue();
            ADMIN.execute("ALTER TABLE savings_goals.goals DROP CONSTRAINT goals_progress_cents_check; ALTER TABLE savings_goals.goals ADD CONSTRAINT goals_progress_cents_check CHECK(true)");
            assertThat(state.signedProgressAvailable()).isFalse();
            if (attack.equals("domain")) {
                runtime.execute("CREATE FUNCTION pg_temp.probe_effect(pg_catalog.regclass) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER AS $$ BEGIN INSERT INTO api_version.probe_effects VALUES(current_user); RETURN true; END $$; GRANT EXECUTE ON FUNCTION pg_temp.probe_effect(pg_catalog.regclass) TO tnbp_migrator");
                assertThatThrownBy(() -> runtime.queryForObject("SELECT pg_temp.probe_effect('savings_goals.goals'::pg_catalog.regclass)",Boolean.class))
                    .isInstanceOf(org.springframework.dao.DataAccessException.class).rootCause().isInstanceOfSatisfying(java.sql.SQLException.class,
                        failure -> assertThat(failure.getSQLState()).isEqualTo("42501"));
                runtime.execute("CREATE DOMAIN pg_temp.regclass AS pg_catalog.regclass CHECK(pg_temp.probe_effect(VALUE))");
            } else {
                runtime.execute("CREATE TEMP TABLE decoy(progress_cents bigint CHECK(progress_cents BETWEEN -9007199254740991 AND 9007199254740991))");
                if (attack.equals("table")) {
                    runtime.execute("CREATE TEMP TABLE pg_constraint(oid oid,conrelid oid,conname name,contype \"char\",convalidated boolean); GRANT SELECT ON pg_temp.pg_constraint TO tnbp_migrator");
                    runtime.execute("INSERT INTO pg_temp.pg_constraint SELECT oid,'savings_goals.goals'::pg_catalog.regclass,'goals_progress_cents_check','c',true FROM pg_catalog.pg_constraint WHERE conrelid='pg_temp.decoy'::pg_catalog.regclass AND contype='c'");
                } else {
                    long decoy = runtime.queryForObject("SELECT oid FROM pg_catalog.pg_constraint WHERE conrelid='pg_temp.decoy'::pg_catalog.regclass AND contype='c'",Long.class);
                    runtime.execute("CREATE FUNCTION pg_temp.probe_effect() RETURNS oid LANGUAGE plpgsql SECURITY INVOKER AS $$ BEGIN INSERT INTO api_version.probe_effects VALUES(current_user); RETURN " + decoy + "; END $$; GRANT EXECUTE ON FUNCTION pg_temp.probe_effect() TO tnbp_migrator");
                    assertThatThrownBy(() -> runtime.queryForObject("SELECT pg_temp.probe_effect()",Long.class))
                        .isInstanceOf(org.springframework.dao.DataAccessException.class).rootCause().isInstanceOfSatisfying(java.sql.SQLException.class,
                            failure -> assertThat(failure.getSQLState()).isEqualTo("42501"));
                    runtime.execute("CREATE TEMP VIEW pg_constraint AS SELECT pg_temp.probe_effect() AS oid,'savings_goals.goals'::pg_catalog.regclass AS conrelid,'goals_progress_cents_check'::name AS conname,'c'::\"char\" AS contype,true AS convalidated; GRANT SELECT ON pg_temp.pg_constraint TO tnbp_migrator");
                }
            }
            assertThat(state.signedProgressAvailable()).as(attack + ": tatsächlich unzureichendes Schema bleibt gesperrt").isFalse();
            assertThat(ADMIN.queryForObject("SELECT count(*) FROM api_version.probe_effects",Integer.class)).isZero();
            ADMIN.execute("ALTER TABLE savings_goals.goals DROP CONSTRAINT goals_progress_cents_check; ALTER TABLE savings_goals.goals ADD CONSTRAINT goals_progress_cents_check CHECK(progress_cents BETWEEN -9007199254740991 AND 9007199254740991)");
            assertThat(state.signedProgressAvailable()).as(attack + ": korrektes Schema bleibt nutzbar").isTrue();
            assertThat(ADMIN.queryForObject("SELECT count(*) FROM api_version.probe_effects",Integer.class)).isZero();
            assertThat(marked()).isFalse();
        } finally {
            ADMIN.execute("ALTER TABLE savings_goals.goals DROP CONSTRAINT goals_progress_cents_check; ALTER TABLE savings_goals.goals ADD CONSTRAINT goals_progress_cents_check CHECK(progress_cents BETWEEN -9007199254740991 AND 9007199254740991); DROP TABLE api_version.probe_effects");
        }
    }
    @Test void fehlgeschlageneCapabilityAbfrageLiefertNurNeutralenLadefehler(org.springframework.boot.test.system.CapturedOutput output) throws Exception {
        UUID id=goal(first);
        try {
            ADMIN.execute("REVOKE EXECUTE ON FUNCTION api_version.signed_progress_available(boolean,uuid,text,text,text,timestamptz) FROM tnbp_runtime");
            var failure=call("GET","/api/v2/capabilities",null,first);
            assertThat(failure.statusCode()).isEqualTo(500);
            assertThat(JSON.readTree(failure.body()).get("code").asText()).isEqualTo("CAPABILITIES_UNAVAILABLE");
            assertThat(failure.body()).doesNotContain("permission", "api_version", "postgres", HASH);
            assertThat(progress(id,"-3000",first).statusCode()).isEqualTo(500);
            assertThat(application.allGoals(first).getFirst().progressCents()).isZero();assertThat(marked()).isFalse();
            assertThat(progress(id,"7000",first).statusCode()).isEqualTo(200);
            assertThat(application.allGoals(first).getFirst().progressCents()).isEqualTo(7000);
            String logs=output.getAll().lines().filter(line->line.contains("CapabilitiesV2Controller")).collect(java.util.stream.Collectors.joining("\n"));
            assertThat(logs).contains("Fehlerkategorie=CAPABILITIES_UNAVAILABLE")
                .doesNotContain("permission", "api_version", "postgres", HASH, "Exception", "SELECT");
            assertThat(marked()).isFalse();
        } finally {ADMIN.execute("GRANT EXECUTE ON FUNCTION api_version.signed_progress_available(boolean,uuid,text,text,text,timestamptz) TO tnbp_runtime");}
    }
    @Test void exakteErsetzungenErhaltenAndereFelderKontenUndMonatsrestUndSperrenRueckfallDauerhaft() throws Exception {
        var id=goal(first);var foreign=goal(second);
        application.saveBudget(first,10000L);application.saveExpense(first,"Ausgabe",2000L);
        var summary=application.currentSummary(first);
        var before=application.allGoals(first);var otherBefore=application.allGoals(second);
        var forbidden=progress(foreign,"-1",first);var missing=progress(UUID.randomUUID(),"-1",first);
        assertThat(forbidden.statusCode()).isEqualTo(404);assertThat(forbidden.body()).isEqualTo(missing.body());
        assertThat(application.allGoals(first)).isEqualTo(before);assertThat(application.allGoals(second)).isEqualTo(otherBefore);assertThat(marked()).isFalse();
        for(long cents:new long[]{-3000,0,7000,15000,-Money.MAX_CENTS,Money.MAX_CENTS,-3000,7000}) {
            for(int repeat=0;repeat<2;repeat++) {
                var saved=progress(id,Long.toString(cents),first);assertThat(saved.statusCode()).as(saved.body()).isEqualTo(200);
                assertThat(JSON.readTree(saved.body()).get("progressCents").asLong()).isEqualTo(cents);
            }
            var result=application.allGoals(first).getFirst();assertThat(result.progressCents()).isEqualTo(cents);
            assertThat(result.name()).isEqualTo("Eigenes Ziel");assertThat(result.targetDate()).isEqualTo(LocalDate.of(2028,2,29));
            assertThat(application.allGoals(second).getFirst().progressCents()).isZero();assertThat(application.currentSummary(first)).isEqualTo(summary);
        }
        assertThat(marked()).isTrue();
        assertThat(application.updateGoal(first,id,"Bearbeitet",1L,null).progressCents()).isEqualTo(7000);
        assertThatThrownBy(()->ADMIN.execute("SELECT api_version.set_retirement(false,gen_random_uuid(),repeat('a',64),repeat('a',64),repeat('a',64))")).hasMessageContaining("Rücknahme nach Nutzung");
        assertThat(call("GET","/api/v1/savings-goals",null,first).statusCode()).isEqualTo(401);
    }
    @Test void ungueltigeTypenGrenzenUndAndereGeldfelderBleibenOhneWirkung() throws Exception {
        var id=goal(first);
        for(String value:List.of("-9007199254740992","9007199254740992","-9223372036854775808","1.5","-1.0","-1e1","\"-1\"","true","null"))
            assertThat(progress(id,value,first).statusCode()).as(value).isEqualTo(400);
        assertThat(call("PUT","/api/v2/budget","{\"amountCents\":-1}",first).statusCode()).isEqualTo(400);
        assertThat(call("POST","/api/v2/expenses","{\"name\":\"X\",\"amountCents\":-1}",first).statusCode()).isEqualTo(400);
        assertThat(call("POST","/api/v2/savings-goals","{\"name\":\"X\",\"targetAmountCents\":-1}",first).statusCode()).isEqualTo(400);
        assertThat(application.allGoals(first).getFirst().progressCents()).isZero();assertThat(marked()).isFalse();
    }
    @Test void fehlerNachMarkerUndBeimCommitRollenBeideWirkungenZurueck() {
        UUID id=goal(first);
        assertThatThrownBy(()->transactions.mutate(first,context->{
            assertThat(versions.lockSignedProgress(context)).isTrue();versions.markSignedProgress(context);goals.signedProgress(context,id,-3000L);
            throw new IllegalStateException("synthetischer Fehler nach Teilzugriff");
        })).isInstanceOf(IllegalStateException.class);
        assertThat(application.allGoals(first).getFirst().progressCents()).isZero();assertThat(marked()).isFalse();
        ADMIN.execute("CREATE FUNCTION savings_goals.reject_signed_commit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetischer Commitfehler'; END $$; CREATE CONSTRAINT TRIGGER reject_signed_commit AFTER UPDATE ON savings_goals.goals DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION savings_goals.reject_signed_commit()");
        try { assertThatThrownBy(()->application.progressGoalV2(first,id,-3000L)).isInstanceOf(RuntimeException.class); }
        finally {ADMIN.execute("DROP TRIGGER reject_signed_commit ON savings_goals.goals; DROP FUNCTION savings_goals.reject_signed_commit()");}
        assertThat(application.allGoals(first).getFirst().progressCents()).isZero();assertThat(marked()).isFalse();
    }
    @Test void versionssperreSerialisiertSigniertenCommitMitRuecknahme() throws Exception {
        UUID id=goal(first);var locked=new CountDownLatch(1);var release=new CountDownLatch(1);
        try(var pool=Executors.newVirtualThreadPerTaskExecutor()) {
            var signed=pool.submit(()->transactions.mutate(first,context->{
                assertThat(versions.lockSignedProgress(context)).isTrue();locked.countDown();
                try {assertThat(release.await(5,TimeUnit.SECONDS)).isTrue();}catch(InterruptedException e){throw new RuntimeException(e);}
                versions.markSignedProgress(context);return goals.signedProgress(context,id,-3000L);
            }));
            assertThat(locked.await(5,TimeUnit.SECONDS)).isTrue();
            var rollback=pool.submit(()->ADMIN.execute("SELECT api_version.set_retirement(false,gen_random_uuid(),repeat('a',64),repeat('a',64),repeat('a',64))"));
            long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(5);
            boolean waiting=false;
            while(!waiting && System.nanoTime()<deadline) {
                waiting=Boolean.TRUE.equals(ADMIN.queryForObject("SELECT EXISTS(SELECT FROM pg_stat_activity WHERE datname=current_database() AND pid<>pg_backend_pid() AND wait_event_type='Lock' AND query LIKE 'SELECT api_version.set_retirement(false%')",Boolean.class));
                if(!waiting)Thread.sleep(10);
            }
            assertThat(waiting).as("tatsächlicher Rücknahmezugriff wartet auf die zuerst erworbene Versionssperre").isTrue();
            assertThat(rollback.isDone()).isFalse();release.countDown();
            assertThat(signed.get(5,TimeUnit.SECONDS).progressCents()).isEqualTo(-3000);
            assertThatThrownBy(()->rollback.get(5,TimeUnit.SECONDS)).hasCauseInstanceOf(org.springframework.dao.DataAccessException.class);
        }
        assertThat(marked()).isTrue();assertThat(versions.signedProgressAvailable()).isTrue();
    }
    @Test void vorherigeRuecknahmesperreVerweigertNegativenHttpCommitOhneMarkerOderTeilmutation() throws Exception {
        UUID id=goal(first);var proof=ADMIN.queryForMap("SELECT * FROM api_version.state");
        try(var pool=Executors.newVirtualThreadPerTaskExecutor();var blocker=ADMIN.getDataSource().getConnection()) {
            blocker.setAutoCommit(false);
            blocker.createStatement().execute("SELECT api_version.set_retirement(false,gen_random_uuid(),repeat('a',64),repeat('a',64),repeat('a',64))");
            var pending=pool.submit(()->progress(id,"-3000",first));
            long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(5);
            boolean waiting=false;
            while(!waiting && System.nanoTime()<deadline) {
                waiting=Boolean.TRUE.equals(ADMIN.queryForObject("SELECT EXISTS(SELECT FROM pg_stat_activity WHERE datname=current_database() AND usename='tnbp_runtime' AND wait_event_type='Lock' AND query LIKE 'SELECT api_version.signed_progress_available%')",Boolean.class));
                if(!waiting)Thread.sleep(10);
            }
            assertThat(waiting).as("negativer HTTP-Vorgang wartet auf die zuerst erworbene Rücknahmesperre").isTrue();
            blocker.commit();
            var rejected=pending.get(5,TimeUnit.SECONDS);
            assertThat(rejected.statusCode()).as(rejected.body()).isEqualTo(409);
            assertThat(JSON.readTree(rejected.body()).get("code").asText()).isEqualTo("FEATURE_NOT_AVAILABLE");
            assertThat(application.allGoals(first).getFirst().progressCents()).isZero();assertThat(marked()).isFalse();
            assertThat(versions.signedProgressAvailable()).isFalse();
            assertThat(progress(id,"7000",first).statusCode()).isEqualTo(200);
        } finally {
            ADMIN.update("UPDATE api_version.state SET v1_retired=?,stopped_instance=?,release_sha256=?,schema_sha256=?,roles_sha256=?,retired_at=?",proof.get("v1_retired"),proof.get("stopped_instance"),proof.get("release_sha256"),proof.get("schema_sha256"),proof.get("roles_sha256"),proof.get("retired_at"));
        }
    }
    @Test void prueffunktionHatFestesSuchschemaUndKeineZusaetzlichenTabellenrechte() {
        assertThat(ADMIN.queryForObject("SELECT proconfig::text FROM pg_proc WHERE oid='api_version.signed_progress_available(boolean,uuid,text,text,text,timestamptz)'::regprocedure",String.class)).contains("search_path=pg_catalog, api_version");
        assertThat(ADMIN.queryForObject("SELECT EXISTS(SELECT FROM pg_proc p,aclexplode(p.proacl) a WHERE p.oid='api_version.signed_progress_available(boolean,uuid,text,text,text,timestamptz)'::regprocedure AND a.grantee=0)",Boolean.class)).isFalse();
        assertThat(jdbc.queryForObject("SELECT has_table_privilege(current_user,'api_version.state','UPDATE') OR has_any_column_privilege(current_user,'api_version.state','UPDATE')",Boolean.class)).isFalse();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM savings_goals.goals",Integer.class)).isZero();
    }
}
