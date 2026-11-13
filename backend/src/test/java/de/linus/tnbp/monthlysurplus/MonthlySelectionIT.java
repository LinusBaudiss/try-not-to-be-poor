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
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
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
@ExtendWith(OutputCaptureExtension.class)
class MonthlySelectionIT {
    static final String NAME = "selection_" + UUID.randomUUID().toString().replace("-", "");
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
        registry.add("api.features.signed-progress", () -> "true");
        registry.add("access.session.signing-key", () -> Base64.getEncoder().encodeToString(new byte[32]));
        registry.add("access.session.issuer", () -> "activation-test"); registry.add("access.session.audience", () -> "activation-spa");
        registry.add("access.session.origin", () -> "https://localhost:4200");
    }
    @LocalServerPort int port;
    @Autowired FinanceApplication application;
    @Autowired FinanceTransactions transactions;
    @org.springframework.test.context.bean.override.mockito.MockitoSpyBean MonthlySurplus monthly;
    @org.springframework.test.context.bean.override.mockito.MockitoSpyBean de.linus.tnbp.savingsgoals.SavingsGoals goals;
    @Autowired MonthRecordRepository records;
    @Autowired ApiVersionState versions;
    @Autowired JdbcTemplate jdbc;
    @Autowired DataSource source;
    UUID first, second;
    @BeforeEach void reset() {
        ADMIN.execute("TRUNCATE access.accounts CASCADE");
        ADMIN.execute("ALTER TABLE api_version.state DISABLE TRIGGER monotone_usage; UPDATE api_version.state SET monthly_effects_used=false; ALTER TABLE api_version.state ENABLE TRIGGER monotone_usage");
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
    static final LocalDate OCT = LocalDate.of(2026,10,1);
    HttpResponse<String> pending(UUID user) throws Exception { return request("GET","/api/v2/monthly-surplus/pending",user,null); }
    void activated() { application.activateMonthlyAutomation(first); CLOCK.now=Instant.parse("2026-12-01T00:00:00Z"); }
    int count() { return ADMIN.queryForObject("SELECT count(*) FROM monthly_surplus.month_records WHERE user_id=?",Integer.class,first); }
    boolean marker() { return ADMIN.queryForObject("SELECT monthly_effects_used FROM api_version.state",Boolean.class); }
    void budget(UUID user,String month,long amount) { ADMIN.update("INSERT INTO budget.budgets VALUES (?,?::date,?)",user,month,amount); }
    void expense(UUID user,String day,long amount) { ADMIN.update("INSERT INTO expenses.expenses VALUES (?,?,'Synthetisch',?,?::date)",UUID.randomUUID(),user,amount,day); }

    HttpResponse<String> select(UUID user, String body) throws Exception {
        var request=HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api/v2/monthly-surplus/selection"))
            .header("Content-Type","application/json").PUT(HttpRequest.BodyPublishers.ofString(body));
        if(user!=null)request.header("Authorization","Bearer "+token(user));
        var response=HttpClient.newHttpClient().send(request.build(),HttpResponse.BodyHandlers.ofString());
        assertThat(response.headers().firstValue("Cache-Control")).hasValue("no-store"); return response;
    }
    UUID goal(UUID user,long progress) {
        var goal=application.saveGoal(user,"Berlin-Fahrt",10000L,LocalDate.of(2027,2,28));
        application.progressGoalV2(user,goal.id(),progress); return goal.id();
    }
    long progress(UUID user,UUID id) { return application.allGoals(user).stream().filter(g->g.id().equals(id)).findFirst().orElseThrow().progressCents(); }
    void fixture() {
        budget(first,"2026-09-01",100000); budget(first,"2026-11-01",20000);
        expense(first,"2026-10-01",80000); expense(first,"2026-11-01",10000);
    }
    List<Map<String,Object>> records() { return ADMIN.queryForList("SELECT * FROM monthly_surplus.month_records WHERE user_id=? ORDER BY origin_month",first); }
    @Test void gemeinsamerLesestandIstReinLesendUndNurMitBearerErreichbar() throws Exception {
        var id=goal(first,5000); goal(second,999);
        READY.open=false;
        assertThat(request("GET","/api/v2/monthly-surplus",null,null).statusCode()).isEqualTo(401);
        assertThat(select(null,"{\"goalId\":\""+id+"\"}").statusCode()).isEqualTo(401);
        assertThat(request("GET","/api/v2/monthly-surplus",null,"__Host-tnbp-refresh=synthetisch").statusCode()).isEqualTo(401);
        var response=request("GET","/api/v2/monthly-surplus",first,null);
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).contains("\"active\":false", "\"activationMonth\":null", "\"selectedGoalId\":null", "\"pendingCents\":0", id.toString(), "Berlin-Fahrt").doesNotContain("999");
        assertThat(count()).isZero(); assertThat(marker()).isFalse();
    }
    @Test void dreihundertEuroVollstaendigAufFuenfzigEinmaligUndLueckenChronologisch() throws Exception {
        fixture();var id=goal(first,5000);activated();
        application.closeMonthlySurplusMonth(first,OCT.plusMonths(1)); // Oktoberlücke trotz späterem Nachweis.
        var before=application.monthlyOverview(first);assertThat(before.selectedGoalId()).isNull();assertThat(before.pendingCents()).isEqualTo(10000);
        var response=select(first,"{\"goalId\":\""+id+"\"}"); assertThat(response.statusCode()).isEqualTo(200);
        var state=application.monthlyOverview(first);assertThat(state.pendingCents()).isZero();assertThat(state.selectedGoalId()).isEqualTo(id);assertThat(state.activationMonth()).isEqualTo(OCT);
        assertThat(progress(first,id)).isEqualTo(35000);
        assertThat(ADMIN.queryForList("SELECT surplus_cents FROM monthly_surplus.month_records WHERE user_id=? ORDER BY origin_month",Long.class,first)).containsExactly(20000L,10000L);
        assertThat(ADMIN.queryForList("SELECT goal_id FROM monthly_surplus.month_records WHERE user_id=? ORDER BY origin_month",UUID.class,first)).containsExactly(id,id);
        assertThat(application.selectMonthlyGoal(first,id).pendingCents()).isZero();assertThat(progress(first,id)).isEqualTo(35000);assertThat(count()).isEqualTo(2);
        assertThat(application.monthlyOverview(second).goals()).isEmpty();
        var created=application.saveGoal(first,"Neu",1L,null); assertThat(created.progressCents()).isZero();assertThat(application.monthlyOverview(first).selectedGoalId()).isEqualTo(id);
    }
    @Test void nullmonateWerdenAuchBeiGesamtsummeNullGebundenOhneBudgetBleibtAnders() {
        var id=goal(first,0); activated(); CLOCK.now=Instant.parse("2027-02-01T12:00:00Z");
        budget(first,"2026-11-01",100);expense(first,"2026-11-01",100);expense(first,"2026-12-01",101);budget(first,"2027-01-01",0);
        application.selectMonthlyGoal(first,id);
        var rows=records();assertThat(rows).hasSize(4);assertThat(rows.getFirst().get("surplus_cents")).isNull();assertThat(rows.getFirst().get("goal_id")).isNull();
        for(var row:rows.subList(1,4)){assertThat(row.get("surplus_cents")).isEqualTo(0L);assertThat(row.get("goal_id")).isEqualTo(id);}
        assertThat(progress(first,id)).isZero();assertThat(application.monthlyPending(first)).isZero();
        var other=goal(first,0);application.selectMonthlyGoal(first,other);
        assertThat(ADMIN.queryForList("SELECT goal_id FROM monthly_surplus.month_records WHERE user_id=? AND surplus_cents IS NOT NULL ORDER BY origin_month",UUID.class,first)).containsExactly(id,id,id);
    }
    @Test void historischeAuswahlAUndHeutigeBMitMehrerenWechselnUndSigniertemStand() {
        fixture();UUID a=goal(first,5000),b=goal(first,-3000),c=goal(first,0);
        application.activateMonthlyAutomation(first); application.selectMonthlyGoal(first,a);
        CLOCK.now=Instant.parse("2026-11-01T12:00:00Z"); application.selectMonthlyGoal(first,b); application.selectMonthlyGoal(first,c); application.selectMonthlyGoal(first,b);
        assertThat(progress(first,a)).isEqualTo(25000);assertThat(progress(first,b)).isEqualTo(-3000);
        CLOCK.now=Instant.parse("2026-12-01T12:00:00Z"); application.selectMonthlyGoal(first,b);
        assertThat(progress(first,b)).isEqualTo(7000); assertThat(progress(first,c)).isZero();
        assertThat(ADMIN.queryForList("SELECT goal_id FROM monthly_surplus.month_records WHERE user_id=? ORDER BY origin_month",UUID.class,first)).containsExactly(a,b);
        assertThat(ADMIN.queryForObject("SELECT count(*) FROM monthly_surplus.selections WHERE user_id=? AND effective_month=DATE '2026-11-01'",Integer.class,first)).isEqualTo(1);
        assertThat(application.monthlyActivation(first).activationMonth()).isEqualTo(OCT);
    }
    @Test void historischFehlendesZielWirdVerbrauchtUndNiemalsAufHeuteUmgeleitet() {
        fixture();UUID a=goal(first,5000),b=goal(first,0);application.activateMonthlyAutomation(first);application.selectMonthlyGoal(first,a);
        application.deleteGoal(first,a); // Vollständige Löschkoordination folgt erst in Story 4.5.
        CLOCK.now=Instant.parse("2026-12-01T12:00:00Z");application.selectMonthlyGoal(first,b);
        assertThat(progress(first,b)).isZero();assertThat(application.monthlyPending(first)).isZero();
        for(var row:records()){assertThat(row.get("goal_id")).isEqualTo(a);assertThat(row.get("consumed")).isEqualTo(true);}
    }
    @Test void ungueltigeFremdeFehlendeInaktiveUndGesperrteAuswahlOhneWirkung() throws Exception {
        UUID id=goal(first,0),foreign=goal(second,0); fixture();
        for(var body:List.of("{}","{\"goalId\":null}","{\"goalId\":\"keine-uuid\"}","{\"goalId\":\""+id+"\",\"pendingCents\":1}","{\"goalId\":\""+id+"\",\"userId\":\""+second+"\"}")) assertThat(select(first,body).statusCode()).as(body).isEqualTo(400);
        var missing=select(first,"{\"goalId\":\""+UUID.randomUUID()+"\"}");var other=select(first,"{\"goalId\":\""+foreign+"\"}");assertThat(missing.statusCode()).isEqualTo(404);assertThat(other.body()).isEqualTo(missing.body());
        assertThat(select(first,"{\"goalId\":\""+id+"\"}").body()).contains("AUTOMATION_NOT_ACTIVE");
        activated(); READY.open=false;assertThat(select(first,"{\"goalId\":\""+id+"\"}").body()).contains("FEATURE_NOT_AVAILABLE");
        assertThat(count()).isZero();assertThat(marker()).isFalse();assertThat(progress(first,id)).isZero();
    }
    @Test void spaeterBFehlerRolltFruehereAWirkungAlleNachweiseAuswahlUndMarkerZurueck() throws Exception {
        fixture();UUID a=goal(first,5000),b=goal(first,de.linus.tnbp.shared.Money.MAX_CENTS);application.activateMonthlyAutomation(first);
        // Historische Auswahl ab November, Oktober bleibt offen für die spätere B-Übernahme.
        transactions.mutate(first,context->{monthly.select(context,a);return null;});
        ADMIN.update("UPDATE monthly_surplus.selections SET effective_month=DATE '2026-11-01' WHERE user_id=?",first);
        CLOCK.now=Instant.parse("2026-12-01T12:00:00Z"); var before=application.monthlyOverview(first);var version=ADMIN.queryForMap("SELECT * FROM api_version.state");
        var failed=select(first,"{\"goalId\":\""+b+"\"}");assertThat(failed.statusCode()).isEqualTo(409);assertThat(failed.body()).contains("AMOUNT_LIMIT_EXCEEDED");
        assertThat(application.monthlyOverview(first)).isEqualTo(before);assertThat(records()).isEmpty();assertThat(ADMIN.queryForMap("SELECT * FROM api_version.state")).isEqualTo(version);
        // Unabhängige manuelle Reparatur ohne Nachholen; danach vollständiger Wiederholungscommit.
        application.progressGoalV2(first,b,0L); application.selectMonthlyGoal(first,b);
        assertThat(progress(first,a)).isEqualTo(15000);assertThat(progress(first,b)).isEqualTo(20000);assertThat(count()).isEqualTo(2);
    }
    @Test void commitfehlerVerwirftAuchBereitsGeschriebeneBindungenUndAuswahl(CapturedOutput logs) throws Exception {
        fixture();var id=goal(first,5000);activated();var version=ADMIN.queryForMap("SELECT * FROM api_version.state");
        var before=application.monthlyOverview(first);int logStart=logs.getAll().length();
        ADMIN.execute("CREATE FUNCTION monthly_surplus.reject_selection() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetisch'; END $$; CREATE CONSTRAINT TRIGGER reject_selection AFTER INSERT ON monthly_surplus.selections DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION monthly_surplus.reject_selection()");
        try {
            var failed=select(first,"{\"goalId\":\""+id+"\"}");
            assertThat(failed.statusCode()).isEqualTo(500);
            assertThat(failed.headers().firstValue("Cache-Control")).hasValue("no-store");
            assertThat(failed.body()).isEqualTo("{\"code\":\"MONTHLY_SURPLUS_UNAVAILABLE\",\"message\":\"Die Auswahl wurde nicht bestätigt. Lade die gemeinsame Automatikübersicht vor einem weiteren Versuch.\"}");
            assertThat(logs.getAll().substring(logStart)).contains("Fehlerkategorie=MONTHLY_SURPLUS_UNAVAILABLE").doesNotContain(first.toString(),id.toString(),"synthetisch","INSERT INTO","postgres");
        }
        finally {ADMIN.execute("DROP TRIGGER reject_selection ON monthly_surplus.selections; DROP FUNCTION monthly_surplus.reject_selection()");}
        assertThat(progress(first,id)).isEqualTo(5000);assertThat(records()).isEmpty();assertThat(application.monthlyOverview(first)).isEqualTo(before);
        assertThat(ADMIN.queryForObject("SELECT count(*) FROM monthly_surplus.selections WHERE user_id=?",Integer.class,first)).isZero();
        assertThat(ADMIN.queryForMap("SELECT * FROM api_version.state")).isEqualTo(version);
    }
    @Test void paralleleGleicheAuswahlUndManuellesErsetzenVerlierenKeineWirkung() throws Exception {
        fixture();var id=goal(first,5000);activated();
        try(var pool=Executors.newVirtualThreadPerTaskExecutor()){
            var tasks=new ArrayList<Future<?>>();for(int i=0;i<8;i++)tasks.add(pool.submit(()->application.selectMonthlyGoal(first,id)));
            for(var task:tasks)task.get(10,TimeUnit.SECONDS);
        }
        assertThat(progress(first,id)).isEqualTo(35000);assertThat(count()).isEqualTo(2);
        application.progressGoalV2(first,id,1234L);application.selectMonthlyGoal(first,id);assertThat(progress(first,id)).isEqualTo(1234);
        try(var connection=source.getConnection();var statement=connection.createStatement();var rows=statement.executeQuery("SELECT NULLIF(current_setting('app.user_id',true),'') IS NULL")){rows.next();assertThat(rows.getBoolean(1)).isTrue();}
    }
    @ParameterizedTest @ValueSource(booleans={true,false})
    void auswahlUndFortschrittsersatzUeberlappenInBeidenKontosperrreihenfolgen(boolean selectionFirst) throws Exception {
        fixture();var id=goal(first,5000);activated();
        CountDownLatch locked=new CountDownLatch(1),release=new CountDownLatch(1);
        AtomicInteger lockOwner=new AtomicInteger();
        org.mockito.stubbing.Answer<Object> hold=invocation->{
            if(Thread.currentThread().getName().equals("first-lock-owner")) {
                lockOwner.set(jdbc.queryForObject("SELECT pg_backend_pid()",Integer.class));locked.countDown();
                assertThat(release.await(10,TimeUnit.SECONDS)).isTrue();
            }
            return invocation.callRealMethod();
        };
        if(selectionFirst) org.mockito.Mockito.doAnswer(hold).when(monthly).state(org.mockito.ArgumentMatchers.any());
        else org.mockito.Mockito.doAnswer(hold).when(goals).signedProgress(org.mockito.ArgumentMatchers.any(),org.mockito.ArgumentMatchers.eq(id),org.mockito.ArgumentMatchers.eq(7000L));
        try(var firstPool=Executors.newThreadPerTaskExecutor(Thread.ofVirtual().name("first-lock-owner").factory());
            var secondPool=Executors.newVirtualThreadPerTaskExecutor()) {
            var firstResult=firstPool.submit(()->selectionFirst ? application.selectMonthlyGoal(first,id) : application.progressGoalV2(first,id,7000L));
            assertThat(locked.await(5,TimeUnit.SECONDS)).isTrue();
            var secondResult=secondPool.submit(()->selectionFirst ? application.progressGoalV2(first,id,7000L) : application.selectMonthlyGoal(first,id));
            try {
                long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(5);
                boolean blocked=false;
                while(System.nanoTime()<deadline) {
                    blocked=ADMIN.queryForObject("SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE ? = ANY(pg_blocking_pids(pid)) AND wait_event='advisory')",Boolean.class,lockOwner.get());
                    if(blocked) break;
                    Thread.sleep(10);
                }
                assertThat(blocked).as("Der zweite echte Anwendungsaufruf wartet auf die Kontosperre des ersten").isTrue();
                assertThat(secondResult.isDone()).isFalse();
            } finally { release.countDown(); }
            firstResult.get(10,TimeUnit.SECONDS);secondResult.get(10,TimeUnit.SECONDS);
        } finally {release.countDown();org.mockito.Mockito.reset(monthly,goals);}
        assertThat(progress(first,id)).isEqualTo(selectionFirst ? 7000 : 37000);
        assertThat(application.monthlyOverview(first).pendingCents()).isZero();assertThat(application.monthlyOverview(first).selectedGoalId()).isEqualTo(id);
        assertThat(ADMIN.queryForList("SELECT goal_id FROM monthly_surplus.month_records WHERE user_id=? ORDER BY origin_month",UUID.class,first)).containsExactly(id,id);
        assertThat(ADMIN.queryForList("SELECT surplus_cents FROM monthly_surplus.month_records WHERE user_id=? ORDER BY origin_month",Long.class,first)).containsExactly(20000L,10000L);
        assertThat(count()).isEqualTo(2);
        assertThat(ADMIN.queryForObject("SELECT count(*) FROM monthly_surplus.selections WHERE user_id=?",Integer.class,first)).isEqualTo(1);
    }
    @Test void uebersichtBehaeltEinenSnapshotBeiCommitZwischenTeilabfragen() throws Exception {
        fixture();var id=goal(first,5000);activated();application.closeMonthlySurplusMonth(first,OCT);application.closeMonthlySurplusMonth(first,OCT.plusMonths(1));
        CountDownLatch read=new CountDownLatch(1),release=new CountDownLatch(1);
        org.mockito.Mockito.doAnswer(invocation->{
            var value=invocation.callRealMethod();
            if(Thread.currentThread().getName().equals("overview-probe")){read.countDown();assertThat(release.await(5,TimeUnit.SECONDS)).isTrue();}
            return value;
        }).when(monthly).pending(org.mockito.ArgumentMatchers.any());
        try(var executor=Executors.newThreadPerTaskExecutor(Thread.ofVirtual().name("overview-probe").factory())){
            var old=executor.submit(()->application.monthlyOverview(first));assertThat(read.await(5,TimeUnit.SECONDS)).isTrue();
            application.selectMonthlyGoal(first,id);release.countDown();
            var snapshot=old.get(5,TimeUnit.SECONDS);assertThat(snapshot.pendingCents()).isEqualTo(30000);assertThat(snapshot.selectedGoalId()).isNull();assertThat(snapshot.goals().getFirst().progressCents()).isEqualTo(5000);
            var fresh=application.monthlyOverview(first);assertThat(fresh.pendingCents()).isZero();assertThat(fresh.goals().getFirst().progressCents()).isEqualTo(35000);
        } finally {release.countDown();org.mockito.Mockito.reset(monthly);}
    }
    @Test void echteRlsFilterUndMinimaleAuswahlrechte() {
        fixture();var id=goal(first,5000);activated();application.selectMonthlyGoal(first,id);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM monthly_surplus.selections",Integer.class)).isZero();
        transactions.read(second,context->{assertThat(jdbc.queryForList("SELECT * FROM monthly_surplus.selections WHERE user_id=?",first)).isEmpty();return null;});
        for(String sql:List.of("UPDATE monthly_surplus.selections SET user_id=gen_random_uuid()","UPDATE monthly_surplus.selections SET effective_month=DATE '2026-01-01'","DELETE FROM monthly_surplus.selections","TRUNCATE monthly_surplus.selections")) assertThatThrownBy(()->jdbc.execute(sql)).isInstanceOf(org.springframework.dao.DataAccessException.class);
        assertThatThrownBy(()->transactions.mutate(second,context->{jdbc.update("INSERT INTO monthly_surplus.selections VALUES (?,DATE '2026-12-01',?)",first,id);return null;})).isInstanceOf(org.springframework.dao.DataAccessException.class);
        assertThat(ADMIN.queryForObject("SELECT count(*) FROM pg_constraint WHERE conrelid IN ('monthly_surplus.selections'::regclass,'monthly_surplus.month_records'::regclass) AND confrelid='savings_goals.goals'::regclass",Integer.class)).isZero();
    }
    @Test void auswahlNachholungFortschrittBindungUndMarkerTeilenPhysischeTransaktionUndEinenZeitpunkt() {
        fixture();var id=goal(first,5000);activated();CLOCK.calls.set(0);
        ADMIN.execute("CREATE TABLE public.selection_probe (pid integer, tx bigint, account text); GRANT INSERT ON public.selection_probe TO tnbp_runtime,tnbp_migrator");
        ADMIN.execute("CREATE FUNCTION public.selection_probe() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN INSERT INTO public.selection_probe VALUES (pg_backend_pid(),txid_current(),current_setting('app.user_id')); RETURN NEW; END $$");
        var tables=List.of("monthly_surplus.month_records","monthly_surplus.selections","savings_goals.goals","api_version.state");
        for(var table:tables)ADMIN.execute("CREATE TRIGGER selection_probe AFTER INSERT OR UPDATE ON "+table+" FOR EACH ROW EXECUTE FUNCTION public.selection_probe()");
        try {
            application.selectMonthlyGoal(first,id);
            assertThat(CLOCK.calls.get()).isEqualTo(1);
            var probes=ADMIN.queryForList("SELECT * FROM public.selection_probe");assertThat(probes.size()).isGreaterThanOrEqualTo(7);
            for(String field:List.of("pid","tx","account"))assertThat(probes.stream().map(row->row.get(field)).distinct().toList()).hasSize(1);
            assertThat(probes.getFirst().get("account")).isEqualTo(first.toString());
        } finally {
            for(var table:tables)ADMIN.execute("DROP TRIGGER selection_probe ON "+table);
            ADMIN.execute("DROP FUNCTION public.selection_probe(); DROP TABLE public.selection_probe");
        }
    }

}
