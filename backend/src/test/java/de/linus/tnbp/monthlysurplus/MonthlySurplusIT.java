package de.linus.tnbp.monthlysurplus;

import static org.assertj.core.api.Assertions.*;
import de.linus.tnbp.access.PostgresFixture;
import de.linus.tnbp.finance.FinanceApplication;
import de.linus.tnbp.finance.MonthlyAutomationReadiness;
import de.linus.tnbp.shared.ApiVersionState;
import de.linus.tnbp.shared.FinanceTransactions;
import java.net.URI;
import java.net.http.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

/** Ausschließlich synthetischer Positivkontext: echte Versionsbarriere, Runtime-Rolle und äußerer Commit. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class MonthlySurplusIT {
    static final String NAME = "activation_" + UUID.randomUUID().toString().replace("-", "");
    static final String URL = "jdbc:postgresql://localhost:" + PostgresFixture.POSTGRES.getPort() + "/" + NAME;
    static final String HASH = "a".repeat(64);
    static final JdbcTemplate SERVER = new JdbcTemplate(PostgresFixture.POSTGRES.getPostgresDatabase());
    static final JdbcTemplate ADMIN;
    static final TestClock CLOCK = new TestClock();
    static final Readiness READY = new Readiness();
    static {
        SERVER.execute("CREATE DATABASE " + NAME + " OWNER tnbp_migrator");
        Flyway.configure().dataSource(URL,"tnbp_migrator","migration-test-only").schemas("access").defaultSchema("access").load().migrate();
        ADMIN = new JdbcTemplate(new DriverManagerDataSource(URL,"postgres","postgres"));
        ADMIN.execute("SELECT api_version.set_retirement(true,gen_random_uuid(),repeat('a',64),repeat('a',64),repeat('a',64))");
    }
    @TestConfiguration static class Configuration {
        @Bean @Primary Clock activationClock() { return CLOCK; }
        @Bean @Primary MonthlyAutomationReadiness readiness() { return READY; }
    }
    static class Readiness extends MonthlyAutomationReadiness { volatile boolean open = true; @Override public boolean available() { return open; } }
    static class TestClock extends Clock {
        volatile Instant now = Instant.parse("2026-10-31T22:59:59Z");
        final AtomicInteger calls = new AtomicInteger();
        @Override public ZoneId getZone() { return ZoneId.of("Pacific/Honolulu"); }
        @Override public Clock withZone(ZoneId zone) { return Clock.fixed(now,zone); }
        @Override public Instant instant() { calls.incrementAndGet(); return now; }
    }
    @DynamicPropertySource static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> URL); registry.add("spring.datasource.username", () -> "tnbp_runtime");
        registry.add("spring.datasource.password", () -> "runtime-test-only"); registry.add("spring.flyway.url", () -> URL);
        registry.add("spring.flyway.user", () -> "tnbp_migrator"); registry.add("spring.flyway.password", () -> "migration-test-only");
        registry.add("api.version.mode", () -> "retired"); registry.add("api.version.release-sha256", () -> HASH);
        registry.add("api.version.instance-id", () -> UUID.randomUUID().toString());
        registry.add("api.features.signed-progress", () -> "false");
        registry.add("access.session.signing-key", () -> Base64.getEncoder().encodeToString(new byte[32]));
        registry.add("access.session.issuer", () -> "activation-test"); registry.add("access.session.audience", () -> "activation-spa");
        registry.add("access.session.origin", () -> "https://localhost:4200");
    }
    @LocalServerPort int port;
    @Autowired FinanceApplication application;
    @Autowired FinanceTransactions transactions;
    @Autowired MonthlySurplus monthly;
    @Autowired ActivationRepository repository;
    @Autowired ApiVersionState versions;
    @Autowired JdbcTemplate jdbc;
    @Autowired DataSource source;
    UUID first, second;
    @BeforeEach void reset() {
        ADMIN.execute("TRUNCATE access.accounts CASCADE");
        READY.open = true; CLOCK.now = Instant.parse("2026-10-31T22:59:59Z"); CLOCK.calls.set(0);
        first = UUID.randomUUID(); second = UUID.randomUUID();
        for (var user : List.of(first,second)) ADMIN.update("INSERT INTO access.accounts VALUES (?,?,'$argon2id$synthetic',now())",user,user+"@example.org");
    }
    @AfterAll static void close(@Autowired DataSource source) {
        if (source instanceof com.zaxxer.hikari.HikariDataSource pool) pool.close();
        SERVER.execute("DROP DATABASE " + NAME + " WITH (FORCE)");
    }
    String token(UUID user) throws Exception {
        var now=CLOCK.now;
        var claims=new com.nimbusds.jwt.JWTClaimsSet.Builder().issuer("activation-test").audience("activation-spa").subject(user.toString())
            .issueTime(Date.from(now)).notBeforeTime(Date.from(now)).expirationTime(Date.from(now.plusSeconds(600))).build();
        var jwt=new com.nimbusds.jwt.SignedJWT(new com.nimbusds.jose.JWSHeader(com.nimbusds.jose.JWSAlgorithm.HS256),claims);
        jwt.sign(new com.nimbusds.jose.crypto.MACSigner(new byte[32])); return jwt.serialize();
    }
    HttpResponse<String> call(String method,UUID user) throws Exception { return request(method,"/api/v2/monthly-surplus/activation",user,null); }
    HttpResponse<String> request(String method,String path,UUID user,String cookie) throws Exception {
        var request=HttpRequest.newBuilder(URI.create("http://localhost:"+port+path));
        if(user!=null)request.header("Authorization","Bearer "+token(user));
        if(cookie!=null)request.header("Cookie",cookie);
        var response=HttpClient.newHttpClient().send(request.method(method,HttpRequest.BodyPublishers.noBody()).build(),HttpResponse.BodyHandlers.ofString());
        assertThat(response.headers().firstValue("Cache-Control")).hasValue("no-store"); return response;
    }
    @Test void getIstReinLesendUndNurBearerAutorisiert() throws Exception {
        for (String method:List.of("GET","POST")) {
            assertThat(call(method,null).statusCode()).isEqualTo(401);
            assertThat(request(method,"/api/v2/monthly-surplus/activation",null,"__Host-tnbp-refresh=synthetisch").statusCode()).isEqualTo(401);
            var invalid=HttpClient.newHttpClient().send(HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api/v2/monthly-surplus/activation"))
                .header("Authorization","Bearer ungültig").method(method,HttpRequest.BodyPublishers.noBody()).build(),HttpResponse.BodyHandlers.ofString());
            assertThat(invalid.statusCode()).isEqualTo(401);
        }
        assertThat(call("GET",first).body()).isEqualTo("{\"active\":false,\"activationMonth\":null}");
        assertThat(call("GET",second).body()).isEqualTo(call("GET",first).body());
        assertThat(ADMIN.queryForObject("SELECT count(*) FROM monthly_surplus.activations",Integer.class)).isZero();
    }
    @Test void oktoberstartOhneBudgetOderZielAendertKeineBestandswerteUndBleibtImNovember() throws Exception {
        ADMIN.update("INSERT INTO expenses.expenses VALUES (?,?,'Septemberbestand',123,DATE '2026-09-01')",UUID.randomUUID(),first);
        var before=ADMIN.queryForList("SELECT * FROM expenses.expenses");
        assertThat(application.currentBudget(first)).isNull(); assertThat(application.allGoals(first)).isEmpty();
        assertThat(call("POST",first).body()).isEqualTo("{\"active\":true,\"activationMonth\":\"2026-10-01\"}");
        assertThat(application.monthlyActivation(second).active()).isFalse();
        CLOCK.now=Instant.parse("2026-11-15T12:00:00Z");
        assertThat(call("POST",first).statusCode()).isEqualTo(200);
        assertThat(call("GET",first).body()).contains("2026-10-01");
        assertThat(ADMIN.queryForList("SELECT * FROM expenses.expenses")).isEqualTo(before);
        assertThat(application.currentBudget(first)).isNull(); assertThat(application.allGoals(first)).isEmpty();
        assertThat(ADMIN.queryForObject("SELECT signed_progress_used OR monthly_effects_used FROM api_version.state",Boolean.class)).isFalse();
    }
    @Test void paralleleErstaufrufeUndBeideKontenHabenJeGenauEinenEigenenStart() throws Exception {
        try(var pool=Executors.newVirtualThreadPerTaskExecutor()) {
            var tasks=new ArrayList<Future<MonthlySurplus.Activation>>();
            for(int i=0;i<12;i++)tasks.add(pool.submit(()->application.activateMonthlyAutomation(first)));
            for(var task:tasks)assertThat(task.get(10,TimeUnit.SECONDS).activationMonth()).isEqualTo(LocalDate.of(2026,10,1));
        }
        CLOCK.now=Instant.parse("2026-11-01T12:00:00Z");
        assertThat(application.activateMonthlyAutomation(second).activationMonth()).isEqualTo(LocalDate.of(2026,11,1));
        assertThat(application.monthlyActivation(first).activationMonth()).isEqualTo(LocalDate.of(2026,10,1));
        assertThat(ADMIN.queryForObject("SELECT count(*) FROM monthly_surplus.activations",Integer.class)).isEqualTo(2);
    }
    @Test void aktivierungErhaeltAlleGefuelltenFinanzwerteBeiderKonten() throws Exception {
        for(var user:List.of(first,second)) {
            ADMIN.update("INSERT INTO budget.budgets VALUES (?,DATE '2026-09-01',12000),(?,DATE '2026-10-01',18000)",user,user);
            ADMIN.update("INSERT INTO expenses.expenses VALUES (?,?,'September',3500,DATE '2026-09-30'),(?,?,'Oktober',4200,DATE '2026-10-15')",UUID.randomUUID(),user,UUID.randomUUID(),user);
            for(long progress:new long[]{1700,-3000}) ADMIN.update("INSERT INTO savings_goals.goals VALUES (?,?,'Bestand',10000,?,DATE '2028-02-29')",UUID.randomUUID(),user,progress);
        }
        var before=new LinkedHashMap<String,List<Map<String,Object>>>();
        for(String table:List.of("budget.budgets","expenses.expenses","savings_goals.goals"))
            before.put(table,ADMIN.queryForList("SELECT * FROM "+table+" ORDER BY user_id"+(table.equals("budget.budgets")?", valid_from":", id")));
        for(var user:List.of(first,second)) {
            assertThat(call("POST",user).statusCode()).isEqualTo(200);
            assertThat(call("POST",user).statusCode()).isEqualTo(200);
            before.forEach((table,rows)->assertThat(ADMIN.queryForList("SELECT * FROM "+table+" ORDER BY user_id"+(table.equals("budget.budgets")?", valid_from":", id"))).isEqualTo(rows));
        }
    }
    @Test void echterLesefehlerIstNeutralOhneCacheUndNachWiederherstellungLesbar() throws Exception {
        application.activateMonthlyAutomation(first);
        try {
            ADMIN.execute("REVOKE SELECT ON monthly_surplus.activations FROM tnbp_runtime");
            var result=call("GET",first);
            assertThat(result.statusCode()).isEqualTo(500);
            assertThat(result.body()).contains("MONTHLY_SURPLUS_UNAVAILABLE").doesNotContain("permission","SELECT","postgres","monthly_surplus",first.toString());
        } finally {ADMIN.execute("GRANT SELECT ON monthly_surplus.activations TO tnbp_runtime");}
        assertThat(call("GET",first).body()).isEqualTo("{\"active\":true,\"activationMonth\":\"2026-10-01\"}");
    }
    @Test void behaupteteClientKontenDatenUndGeldwerteAendernDenServerkontextNicht() throws Exception {
        var request=HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api/v2/monthly-surplus/activation"))
            .header("Authorization","Bearer "+token(first)).header("Content-Type","application/json")
            .POST(HttpRequest.BodyPublishers.ofString("{\"userId\":\""+second+"\",\"activationMonth\":\"2026-09-01\",\"budgetCents\":9000,\"goalId\":\""+UUID.randomUUID()+"\"}")).build();
        var result=HttpClient.newHttpClient().send(request,HttpResponse.BodyHandlers.ofString());
        assertThat(result.statusCode()).isEqualTo(200);assertThat(result.body()).contains("2026-10-01");
        assertThat(application.monthlyActivation(second).active()).isFalse();
        assertThat(application.currentBudget(first)).isNull();assertThat(application.allGoals(first)).isEmpty();
    }
    @Test void gesamtgateBleibtOhneProduktionsschalterGeschlossenUndGespeicherterStartLesbar() throws Exception {
        assertThat(new MonthlyAutomationReadiness().available()).isFalse();
        assertThat(versions.signedProgressAvailable()).isFalse();
        assertThat(application.monthlyAutomationAvailable()).isTrue();
        application.activateMonthlyAutomation(first); READY.open=false;
        assertThat(request("GET","/api/v2/capabilities",first,null).body()).isEqualTo("{\"signedProgressAvailable\":false,\"monthlyAutomationAvailable\":false}");
        var rejected=call("POST",second); assertThat(rejected.statusCode()).isEqualTo(409); assertThat(rejected.body()).contains("FEATURE_NOT_AVAILABLE");
        assertThat(call("POST",first).statusCode()).isEqualTo(409);
        assertThat(call("GET",first).body()).contains("2026-10-01");
        assertThat(call("GET",second).body()).contains("\"active\":false");
    }
    @Test void jederVeralteteStilllegungsbelegSchliesstCapabilityUndMutationFrisch() throws Exception {
        for(String column:List.of("release_sha256","schema_sha256","roles_sha256","stopped_instance","retired_at")) {
            Object before=ADMIN.queryForObject("SELECT "+column+" FROM api_version.state",Object.class);
            String value=column.equals("stopped_instance")?"gen_random_uuid()":column.equals("retired_at")?"retired_at+interval '1 second'":"repeat('b',64)";
            try {
                ADMIN.execute("UPDATE api_version.state SET "+column+"="+value);
                assertThat(application.monthlyAutomationAvailable()).isFalse();
                assertThat(call("POST",first).statusCode()).isEqualTo(409);
                assertThat(application.monthlyActivation(first).active()).isFalse();
            } finally { ADMIN.update("UPDATE api_version.state SET "+column+"=?",before); }
        }
        assertThat(new ApiVersionState(jdbc,"retired",HASH,UUID.randomUUID().toString(),false).monthlyAutomationAvailable()).isTrue();
    }
    @Test void filterUndRlsVerweigernFremdenUndFehlendenKontextUndErstmonatIstUnveraenderlich() {
        application.activateMonthlyAutomation(first);
        assertThat(transactions.<LocalDate>read(second,context->repository.month(first))).isNull();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM monthly_surplus.activations",Integer.class)).isZero();
        assertThatThrownBy(()->jdbc.update("INSERT INTO monthly_surplus.activations(user_id,activation_month) VALUES (?,DATE '2026-10-01')",second))
            .isInstanceOf(org.springframework.dao.DataAccessException.class).rootCause().isInstanceOfSatisfying(java.sql.SQLException.class,
                failure->assertThat(failure.getSQLState()).isEqualTo("42501"));
        assertThatThrownBy(()->transactions.mutate(second,context->{repository.insert(first,LocalDate.of(2026,9,1));return null;})).isInstanceOf(org.springframework.dao.DataAccessException.class);
        for(String statement:List.of("UPDATE monthly_surplus.activations SET activation_month=DATE '2026-09-01'", "UPDATE monthly_surplus.activations SET user_id=gen_random_uuid()", "DELETE FROM monthly_surplus.activations", "TRUNCATE monthly_surplus.activations"))
            assertThatThrownBy(()->transactions.mutate(first,context->{jdbc.execute(statement);return null;})).isInstanceOf(org.springframework.dao.DataAccessException.class);
        assertThatThrownBy(()->transactions.mutate(second,context->{repository.insert(second,LocalDate.of(2026,10,2));return null;})).isInstanceOf(org.springframework.dao.DataAccessException.class);
        assertThat(jdbc.queryForObject("SELECT r.rolsuper OR r.rolbypassrls OR pg_has_role(current_user,c.relowner,'MEMBER') FROM pg_roles r,pg_class c WHERE r.rolname=current_user AND c.oid='monthly_surplus.activations'::regclass",Boolean.class)).isFalse();
        assertThat(application.monthlyActivation(first).activationMonth()).isEqualTo(LocalDate.of(2026,10,1));
    }
    @Test void fehlerVorCommitUndEchterCommitfehlerBestaetigenKeineAktivierung() throws Exception {
        assertThatThrownBy(()->transactions.mutate(first,context->{monthly.activate(context);throw new IllegalStateException("synthetisch");})).isInstanceOf(IllegalStateException.class);
        assertThat(application.monthlyActivation(first).active()).isFalse();
        ADMIN.execute("CREATE FUNCTION monthly_surplus.reject_commit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetischer Commitfehler'; END $$; CREATE CONSTRAINT TRIGGER reject_commit AFTER INSERT ON monthly_surplus.activations DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION monthly_surplus.reject_commit()");
        try {
            var failed=call("POST",first); assertThat(failed.statusCode()).isEqualTo(500);
            assertThat(failed.body()).contains("MONTHLY_SURPLUS_UNAVAILABLE").doesNotContain("synthetisch","postgres","SELECT",first.toString());
            assertThat(call("GET",first).body()).contains("\"active\":false");
        } finally {ADMIN.execute("DROP TRIGGER reject_commit ON monthly_surplus.activations; DROP FUNCTION monthly_surplus.reject_commit()");}
        assertThat(call("POST",first).statusCode()).isEqualTo(200);
    }
    @Test void monatUndGenauEinZeitpunktWerdenErstNachKontosperreBestimmt() throws Exception {
        try(var blocker=ADMIN.getDataSource().getConnection();var pool=Executors.newVirtualThreadPerTaskExecutor()) {
            blocker.setAutoCommit(false);
            try(var statement=blocker.prepareStatement("SELECT pg_advisory_xact_lock(hashtextextended(?,14))")) {statement.setString(1,first.toString());statement.execute();}
            CLOCK.calls.set(0);
            var pending=pool.submit(()->application.activateMonthlyAutomation(first));
            awaitLock("%pg_advisory_xact_lock%");
            assertThat(pending.isDone()).isFalse(); assertThat(CLOCK.calls.get()).isZero();
            CLOCK.now=Instant.parse("2026-10-31T23:00:00Z"); blocker.commit();
            assertThat(pending.get(5,TimeUnit.SECONDS).activationMonth()).isEqualTo(LocalDate.of(2026,11,1));
            assertThat(CLOCK.calls.get()).isEqualTo(1);
        }
    }
    @Test void versionssperreWirdBisZumAktivierungscommitGehalten() throws Exception {
        var entered=new CountDownLatch(1); var release=new CountDownLatch(1);
        try(var pool=Executors.newVirtualThreadPerTaskExecutor()) {
            var activation=pool.submit(()->transactions.mutate(first,context->{
                assertThat(versions.lockMonthlyAutomation(context)).isTrue();entered.countDown();
                try { assertThat(release.await(5,TimeUnit.SECONDS)).isTrue(); } catch(InterruptedException failure){throw new RuntimeException(failure);}
                return monthly.activate(context);
            }));
            assertThat(entered.await(5,TimeUnit.SECONDS)).isTrue();
            var change=pool.submit(()->ADMIN.execute("UPDATE api_version.state SET roles_sha256=repeat('b',64)"));
            try {
                awaitLock("UPDATE api_version.state SET roles_sha256%"); assertThat(change.isDone()).isFalse();
            } finally {release.countDown();}
            assertThat(activation.get(5,TimeUnit.SECONDS).active()).isTrue();change.get(5,TimeUnit.SECONDS);
        } finally {ADMIN.execute("UPDATE api_version.state SET roles_sha256=repeat('a',64)");}
    }
    @Test void vorherigeVersionsruecknahmeSperrtAktivierungNachDemWarten() throws Exception {
        var before=ADMIN.queryForMap("SELECT * FROM api_version.state");
        try(var blocker=ADMIN.getDataSource().getConnection();var pool=Executors.newVirtualThreadPerTaskExecutor()) {
            blocker.setAutoCommit(false); blocker.createStatement().execute("SELECT api_version.set_retirement(false,gen_random_uuid(),repeat('a',64),repeat('a',64),repeat('a',64))");
            var pending=pool.submit(()->application.activateMonthlyAutomation(first));
            awaitLock("SELECT api_version.monthly_automation_available%");blocker.commit();
            assertThatThrownBy(()->pending.get(5,TimeUnit.SECONDS)).hasCauseInstanceOf(FinanceApplication.FeatureNotAvailable.class);
            assertThat(application.monthlyActivation(first).active()).isFalse();
        } finally {ADMIN.update("UPDATE api_version.state SET v1_retired=?,stopped_instance=?,release_sha256=?,schema_sha256=?,roles_sha256=?,retired_at=?",before.get("v1_retired"),before.get("stopped_instance"),before.get("release_sha256"),before.get("schema_sha256"),before.get("roles_sha256"),before.get("retired_at"));}
    }
    @Test void wiederverwendeteVerbindungenTragenNachCommitUndRollbackKeinenKontostatus() throws Exception {
        application.activateMonthlyAutomation(first);
        assertThatThrownBy(()->transactions.mutate(second,context->{monthly.activate(context);throw new IllegalStateException();})).isInstanceOf(IllegalStateException.class);
        var connections=new ArrayList<java.sql.Connection>();
        try {
            for(int i=0;i<8;i++)connections.add(source.getConnection());
            for(var connection:connections)try(var statement=connection.createStatement();var rows=statement.executeQuery("SELECT nullif(current_setting('app.user_id',true),'') IS NULL, (SELECT count(*) FROM monthly_surplus.activations)")) {
                rows.next();assertThat(rows.getBoolean(1)).isTrue();assertThat(rows.getInt(2)).isZero();
            }
        } finally {for(var connection:connections)connection.close();}
        assertThat(application.monthlyActivation(second).active()).isFalse();
    }
    void awaitLock(String query) throws Exception {
        long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(5);boolean waiting=false;
        while(!waiting&&System.nanoTime()<deadline) {
            waiting=Boolean.TRUE.equals(ADMIN.queryForObject("SELECT EXISTS(SELECT FROM pg_stat_activity WHERE datname=current_database() AND pid<>pg_backend_pid() AND wait_event_type='Lock' AND query LIKE ?)",Boolean.class,query));
            if(!waiting)Thread.sleep(10);
        }
        assertThat(waiting).as("echter Datenbankzugriff wartet auf die Sperre").isTrue();
    }
}
