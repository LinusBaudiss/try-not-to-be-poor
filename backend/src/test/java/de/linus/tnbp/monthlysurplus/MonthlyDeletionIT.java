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
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.params.provider.CsvSource;
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
class MonthlyDeletionIT {
    static final String NAME = "deletion_" + UUID.randomUUID().toString().replace("-", "");
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
    static final LocalDate OCT = LocalDate.of(2026,10,1);
    int count() { return ADMIN.queryForObject("SELECT count(*) FROM monthly_surplus.month_records WHERE user_id=?",Integer.class,first); }
    boolean marker() { return ADMIN.queryForObject("SELECT monthly_effects_used FROM api_version.state",Boolean.class); }
    void budget(UUID user,String month,long amount) { ADMIN.update("INSERT INTO budget.budgets VALUES (?,?::date,?)",user,month,amount); }
    void expense(UUID user,String day,long amount) { ADMIN.update("INSERT INTO expenses.expenses VALUES (?,?,'Synthetisch',?,?::date)",UUID.randomUUID(),user,amount,day); }

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
    UUID historical(long amount) { expense(first,"2026-10-01",amount); return application.allExpenses(first).getFirst().id(); }
    void activeDecember() { application.activateMonthlyAutomation(first); CLOCK.now=Instant.parse("2026-12-01T12:00:00Z"); }
    HttpResponse<String> mutation(String method, UUID user, UUID id, Long amount) throws Exception {
        var request=HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api/v2/expenses/"+id));
        if(user!=null)request.header("Authorization","Bearer "+token(user));
        if(amount!=null)request.header("Content-Type","application/json");
        var response=HttpClient.newHttpClient().send(request.method(method,amount==null?HttpRequest.BodyPublishers.noBody():
            HttpRequest.BodyPublishers.ofString("{\"name\":\"Berlin-Fahrt\",\"amountCents\":"+amount+"}")).build(),HttpResponse.BodyHandlers.ofString());
        assertThat(response.headers().firstValue("Cache-Control")).hasValue("no-store"); return response;
    }
    long amount(UUID id) { return ADMIN.queryForObject("SELECT amount_cents FROM expenses.expenses WHERE id=?",Long.class,id); }
    void resetMarker() { ADMIN.execute("ALTER TABLE api_version.state DISABLE TRIGGER monotone_usage; UPDATE api_version.state SET monthly_effects_used=false; ALTER TABLE api_version.state ENABLE TRIGGER monotone_usage"); }

    Map<String,Object> financeState() {
        return Map.of("expenses", application.allExpenses(first), "records", records(),
            "goals", application.allGoals(first), "pending", application.monthlyPending(first),
            "selection", ADMIN.queryForList("SELECT * FROM monthly_surplus.selections WHERE user_id=? ORDER BY effective_month", first),
            "version", ADMIN.queryForMap("SELECT * FROM api_version.state"));
    }
    UUID closeBoundOctober() {
        UUID selected=goal(first,0);
        application.activateMonthlyAutomation(first);application.selectMonthlyGoal(first,selected);
        CLOCK.now=Instant.parse("2026-11-01T12:00:00Z");
        assertThat(application.closeMonthlySurplusMonth(first,OCT)).isTrue();
        return selected;
    }

    HttpResponse<String> delete(UUID user, Object id) throws Exception {
        var request=HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api/v2/savings-goals/"+id));
        if(user!=null)request.header("Authorization","Bearer "+token(user));
        var result=HttpClient.newHttpClient().send(request.DELETE().build(),HttpResponse.BodyHandlers.ofString());
        assertThat(result.headers().firstValue("Cache-Control")).hasValue("no-store");return result;
    }
    List<Map<String,Object>> deleted() { return ADMIN.queryForList("SELECT * FROM monthly_surplus.deleted_goals WHERE user_id=? ORDER BY goal_id",first); }
    Map<String,Object> state() { var result=new LinkedHashMap<>(financeState()); result.put("deleted",deleted());return result; }
    void selection(LocalDate month, UUID goal) { ADMIN.update("INSERT INTO monthly_surplus.selections VALUES (?,?,?)",first,month,goal); }
    @Test void nurNochImNachweisGebundenesZielWirdNachAuswahlueberschreibungDauerhaftVerbraucht() throws Exception {
        CLOCK.now=Instant.parse("2026-07-15T12:00:00Z");
        application.activateMonthlyAutomation(first);application.saveBudget(first,100000L);
        UUID expense=application.saveExpense(first,"Historisch",80000L).id(),a=goal(first,0),b=goal(first,17);
        CLOCK.now=Instant.parse("2026-08-01T12:00:00Z");
        LocalDate july=LocalDate.of(2026,7,1);application.closeMonthlySurplusMonth(first,july);
        application.selectMonthlyGoal(first,a);application.selectMonthlyGoal(first,b);
        assertThat(ADMIN.queryForObject("SELECT count(*) FROM monthly_surplus.selections WHERE user_id=? AND goal_id=?",Integer.class,first,a)).isZero();
        assertThat(records().getFirst()).containsEntry("goal_id",a).containsEntry("consumed",false);
        assertThat(delete(first,a).statusCode()).isEqualTo(204);
        assertThat(deleted()).hasSize(1);assertThat(deleted().getFirst()).containsEntry("goal_id",a);
        assertThat(records().getFirst()).containsEntry("goal_id",a).containsEntry("consumed",true);
        assertThat(application.monthlyOverview(first).selectedGoalId()).isEqualTo(b);
        assertThat(mutation("PUT",first,expense,85000L).statusCode()).isEqualTo(200);
        assertThat(records().getFirst()).containsEntry("goal_id",a).containsEntry("surplus_cents",15000L).containsEntry("consumed",true);
        assertThat(progress(first,b)).isEqualTo(17);assertThat(application.monthlyPending(first)).isZero();
    }
    @ParameterizedTest @ValueSource(longs={-3000,15000,9007199254740991L})
    void aktuelleLoeschungBrauchtWederNachholungNochSummenOderGesamtgate(long progress) throws Exception {
        budget(first,"2026-10-01",100000);UUID a=goal(first,progress),b=goal(first,9007199254740991L);
        application.activateMonthlyAutomation(first);application.selectMonthlyGoal(first,a);
        selection(OCT.plusMonths(1),b);CLOCK.now=Instant.parse("2026-12-01T12:00:00Z");
        // B würde beim Nachholen überlaufen. A ist nur historisch gebunden und bleibt trotzdem löschbar.
        assertThatThrownBy(()->application.selectMonthlyGoal(first,b)).isInstanceOf(ArithmeticException.class);
        READY.open=false;resetMarker();org.mockito.Mockito.clearInvocations(goals,monthly);
        assertThat(delete(first,a).statusCode()).isEqualTo(204);
        org.mockito.Mockito.verify(goals,org.mockito.Mockito.never()).applyDifference(org.mockito.ArgumentMatchers.any(),org.mockito.ArgumentMatchers.any(),org.mockito.ArgumentMatchers.anyLong());
        org.mockito.Mockito.verify(monthly,org.mockito.Mockito.never()).pending(org.mockito.ArgumentMatchers.any());
        assertThat(count()).isZero();assertThat(deleted()).hasSize(1);assertThat(marker()).isTrue();
        assertThat(application.monthlyOverview(first).selectedGoalId()).isEqualTo(b);
        assertThat(application.monthlyActivation(first).activationMonth()).isEqualTo(OCT);
        assertThat(progress(first,b)).isEqualTo(9007199254740991L);
        var before=state();assertThat(delete(first,a).statusCode()).isEqualTo(404);assertThat(state()).isEqualTo(before);
    }
    @ParameterizedTest @ValueSource(longs={80000,100000})
    void echteLoeschungUndFolgekorrekturenVerbrauchenUnverarbeiteteHistorischeMonate(long initial) throws Exception {
        budget(first,"2026-10-01",100000);UUID expense=historical(initial),a=goal(first,20),b=goal(first,17);
        application.activateMonthlyAutomation(first);application.selectMonthlyGoal(first,a);
        selection(OCT.plusMonths(1),b);CLOCK.now=Instant.parse("2026-12-01T12:00:00Z");
        assertThat(delete(first,a).statusCode()).isEqualTo(204);assertThat(count()).isZero();
        assertThat(application.monthlyOverview(first).selectedGoalId()).isEqualTo(b);
        assertThat(mutation("PUT",first,expense,85000L).statusCode()).isEqualTo(200);
        assertThat(records()).hasSize(1);assertThat(records().getFirst()).containsEntry("goal_id",a).containsEntry("consumed",true).containsEntry("surplus_cents",15000L);
        assertThat(application.closeMonthlySurplusMonth(first,OCT)).isFalse();
        assertThat(application.closeMonthlySurplusMonth(first,OCT.plusMonths(1))).isTrue();
        assertThat(progress(first,b)).isEqualTo(100017);
        assertThat(records().get(1)).containsEntry("goal_id",b).containsEntry("consumed",false).containsEntry("surplus_cents",100000L);
        assertThatThrownBy(()->application.selectMonthlyGoal(first,a)).isInstanceOf(de.linus.tnbp.savingsgoals.SavingsGoals.NotFound.class);
        assertThat(application.monthlyOverview(first).selectedGoalId()).isEqualTo(b);
        application.progressGoalV2(first,b,30000L);
        assertThat(mutation("PUT",first,expense,95000L).statusCode()).isEqualTo(200);
        assertThat(mutation("DELETE",first,expense,null).statusCode()).isEqualTo(204);
        assertThat(records().getFirst()).containsEntry("goal_id",a).containsEntry("consumed",true).containsEntry("surplus_cents",100000L);
        assertThat(application.monthlyPending(first)).isZero();assertThat(progress(first,b)).isEqualTo(30000);
        assertThat(application.closeMonthlySurplusMonth(first,OCT)).isFalse();assertThat(application.allGoals(first)).hasSize(1);
        assertThat(application.allGoals(second)).isEmpty();assertThat(application.monthlyPending(second)).isZero();
    }
    @Test void bestehendeBindungUndOffeneNullVormerkungenBleibenNachLetztemZielGetrennt() throws Exception {
        CLOCK.now=Instant.parse("2026-07-01T12:00:00Z");application.activateMonthlyAutomation(first);
        UUID a=goal(first,5000);budget(first,"2026-10-01",0);budget(first,"2026-12-01",10000);
        ADMIN.update("INSERT INTO monthly_surplus.month_records VALUES (?,DATE '2026-07-01',20000,NULL,false),(?,DATE '2026-08-01',10000,NULL,false),(?,DATE '2026-09-01',0,NULL,false)",first,first,first);
        selection(OCT,a);CLOCK.now=Instant.parse("2026-12-01T12:00:00Z");application.closeMonthlySurplusMonth(first,OCT);
        assertThat(delete(first,a).statusCode()).isEqualTo(204);
        var overview=application.monthlyOverview(first);
        assertThat(overview.active()).isTrue();assertThat(overview.activationMonth()).isEqualTo(LocalDate.of(2026,7,1));
        assertThat(overview.selectedGoalId()).isNull();assertThat(overview.pendingCents()).isEqualTo(30000);assertThat(overview.goals()).isEmpty();
        assertThat(records().get(3)).containsEntry("goal_id",a).containsEntry("surplus_cents",0L).containsEntry("consumed",true);
        application.closeMonthlySurplusMonth(first,OCT.plusMonths(1));assertThat(application.monthlyPending(first)).isEqualTo(30000);
        CLOCK.now=Instant.parse("2027-01-01T12:00:00Z");application.closeMonthlySurplusMonth(first,OCT.plusMonths(2));
        assertThat(application.monthlyPending(first)).isEqualTo(40000);
        UUID replacement=goal(first,0);assertThat(replacement).isNotEqualTo(a);assertThat(application.monthlyOverview(first).selectedGoalId()).isNull();
        application.selectMonthlyGoal(first,replacement);assertThat(progress(first,replacement)).isEqualTo(40000);
        assertThat(records().get(2)).containsEntry("goal_id",replacement).containsEntry("consumed",false);
        assertThat(records().get(3)).containsEntry("goal_id",a).containsEntry("consumed",true);
        assertThat(records().get(4)).containsEntry("goal_id",a).containsEntry("consumed",true);
    }
    @ParameterizedTest @ValueSource(strings={"inactive","unbound","before","no-budget"})
    void ohneAktivierungBindungBudgetOderVorAktivierungWirdNichtsErfunden(String kind) throws Exception {
        UUID a=goal(first,0);expense(first,"2026-09-01",1);
        if(!kind.equals("inactive"))application.activateMonthlyAutomation(first);
        if(kind.equals("no-budget"))application.selectMonthlyGoal(first,a);
        CLOCK.now=Instant.parse("2026-11-01T12:00:00Z");assertThat(delete(first,a).statusCode()).isEqualTo(204);
        if(kind.equals("no-budget")) {
            application.closeMonthlySurplusMonth(first,OCT);
            assertThat(records().getFirst()).containsEntry("surplus_cents",null).containsEntry("goal_id",a).containsEntry("consumed",true);
        } else {assertThat(deleted()).isEmpty();assertThat(marker()).isFalse();}
        assertThat(application.closeMonthlySurplusMonth(first,OCT.minusMonths(1))).isFalse();
        assertThat(application.monthlyPending(first)).isZero();
    }
    @Test void aktuellesZielVerbrauchtNachweiseUndLoeschtNurAbOffenemMonat() throws Exception {
        budget(first,"2026-10-01",100000);UUID a=closeBoundOctober();
        assertThat(records().getFirst()).containsEntry("consumed",false);
        var result=delete(first,a);assertThat(result.statusCode()).isEqualTo(204);assertThat(result.body()).isEmpty();
        assertThat(records().getFirst()).containsEntry("goal_id",a).containsEntry("surplus_cents",100000L).containsEntry("consumed",true);
        assertThat(transactions.<UUID>read(first,c->monthly.selected(c,OCT))).isEqualTo(a);
        assertThat(application.monthlyOverview(first).selectedGoalId()).isNull();
        assertThat(transactions.<UUID>read(first,c->monthly.selected(c,OCT.plusMonths(20)))).isNull();
        assertThat(application.monthlyActivation(first).active()).isTrue();
        assertThat(ADMIN.queryForObject("SELECT monthly_effects_used FROM api_version.state",Boolean.class)).isTrue();
    }
    @Test void fremdeFehlendeUngueltigeUndNichtAngemeldeteLoeschungBleibenNeutral() throws Exception {
        UUID a=goal(first,20);application.activateMonthlyAutomation(first);application.selectMonthlyGoal(first,a);
        UUID other=goal(second,37);application.saveBudget(second,3300L);application.saveExpense(second,"Anderes Konto",17L);
        var otherGoals=application.allGoals(second);var otherExpenses=application.allExpenses(second);
        var before=state();var foreign=delete(second,a);var absent=delete(second,UUID.randomUUID());
        assertThat(foreign.statusCode()).isEqualTo(404);assertThat(absent.body()).isEqualTo(foreign.body());
        assertThat(delete(first,"ungueltig").statusCode()).isEqualTo(400);assertThat(delete(null,a).statusCode()).isEqualTo(401);
        assertThat(state()).isEqualTo(before);assertThat(application.monthlyActivation(second).active()).isFalse();
        assertThat(application.allGoals(second)).isEqualTo(otherGoals);assertThat(progress(second,other)).isEqualTo(37);
        assertThat(application.allExpenses(second)).isEqualTo(otherExpenses);assertThat(application.currentBudget(second)).isEqualTo(3300);
    }
    @Test void echterCommitfehlerNachVerbrauchLeerungZielUndNutzungsmarkerRolltAllesZurueck() throws Exception {
        budget(first,"2026-10-01",100000);UUID a=closeBoundOctober();resetMarker();var before=state();
        ADMIN.execute("CREATE FUNCTION monthly_surplus.reject_deletion() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetisch'; END $$; CREATE CONSTRAINT TRIGGER reject_deletion AFTER DELETE ON savings_goals.goals DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION monthly_surplus.reject_deletion()");
        try {var result=delete(first,a);assertThat(result.statusCode()).isEqualTo(500);assertThat(result.body()).contains("SAVINGS_GOAL_UNAVAILABLE","nicht bestätigt");assertThat(state()).isEqualTo(before);}
        finally {ADMIN.execute("DROP TRIGGER reject_deletion ON savings_goals.goals;DROP FUNCTION monthly_surplus.reject_deletion()");}
        assertThat(delete(first,a).statusCode()).isEqualTo(204);
    }
    @Test void filterForceRlsUnveraenderlichkeitUndPoolVerhindernFremdeMarker() throws Exception {
        UUID a=goal(first,0);application.activateMonthlyAutomation(first);application.selectMonthlyGoal(first,a);application.deleteGoal(first,a);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM monthly_surplus.deleted_goals",Integer.class)).isZero();
        transactions.read(second,c->{assertThat(jdbc.queryForList("SELECT * FROM monthly_surplus.deleted_goals WHERE user_id=?",first)).isEmpty();return null;});
        assertThatThrownBy(()->transactions.mutate(second,c->{jdbc.update("INSERT INTO monthly_surplus.deleted_goals VALUES (?,?)",first,UUID.randomUUID());return null;})).isInstanceOf(org.springframework.dao.DataAccessException.class);
        for(String command:List.of("UPDATE monthly_surplus.deleted_goals SET goal_id=gen_random_uuid()","DELETE FROM monthly_surplus.deleted_goals","TRUNCATE monthly_surplus.deleted_goals"))
            assertThatThrownBy(()->jdbc.execute(command)).isInstanceOf(org.springframework.dao.DataAccessException.class);
        assertThatThrownBy(()->transactions.read(first,c->monthly.deleteGoal(c,a))).isInstanceOf(IllegalStateException.class);
        try(var connection=source.getConnection();var statement=connection.createStatement();var result=statement.executeQuery("SELECT NULLIF(current_setting('app.user_id',true),'') IS NULL, (SELECT count(*) FROM monthly_surplus.deleted_goals)")) {
            result.next();assertThat(result.getBoolean(1)).isTrue();assertThat(result.getInt(2)).isZero();
        }
        assertThat(ADMIN.queryForObject("SELECT count(*) FROM pg_constraint WHERE conrelid='monthly_surplus.deleted_goals'::regclass AND confrelid='savings_goals.goals'::regclass",Integer.class)).isZero();
    }
    void awaitWaiter(int holder) throws Exception {
        long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(5);boolean waiting;
        do {
            waiting=Boolean.TRUE.equals(ADMIN.queryForObject("SELECT EXISTS(SELECT FROM pg_stat_activity WHERE wait_event='advisory' AND ? = ANY(pg_blocking_pids(pid)))",Boolean.class,holder));
            if(!waiting)Thread.sleep(10);
        } while(!waiting&&System.nanoTime()<deadline);
        assertThat(waiting).as("zweiter echter Befehl wartet auf Kontosperre").isTrue();
    }
    @ParameterizedTest @CsvSource({"close,true","close,false","select,true","select,false","progress,true","progress,false"})
    void loeschenUndAbschlussAuswahlFortschrittTeilenBeideSperrreihenfolgen(String command,boolean deleteFirst) throws Exception {
        budget(first,"2026-10-01",100000);UUID a=goal(first,0),b=goal(first,0);
        application.activateMonthlyAutomation(first);application.selectMonthlyGoal(first,a);CLOCK.now=Instant.parse("2026-11-01T12:00:00Z");
        var entered=new CountDownLatch(1);var release=new CountDownLatch(1);var holder=new AtomicInteger();
        org.mockito.stubbing.Answer<Object> pause=invocation->{
            holder.set(jdbc.queryForObject("SELECT pg_backend_pid()",Integer.class));entered.countDown();
            assertThat(release.await(5,TimeUnit.SECONDS)).isTrue();return invocation.callRealMethod();
        };
        if(deleteFirst)org.mockito.Mockito.doAnswer(pause).when(monthly).deleteGoal(org.mockito.ArgumentMatchers.any(),org.mockito.ArgumentMatchers.eq(a));
        else if(command.equals("progress"))org.mockito.Mockito.doAnswer(pause).when(goals).signedProgress(org.mockito.ArgumentMatchers.any(),org.mockito.ArgumentMatchers.eq(a),org.mockito.ArgumentMatchers.eq(30000L));
        else org.mockito.Mockito.doAnswer(pause).when(monthly).needsClosing(org.mockito.ArgumentMatchers.any(),org.mockito.ArgumentMatchers.eq(OCT));
        Runnable deletion=()->application.deleteGoal(first,a);
        Runnable other=()->{
            switch(command) {
                case "close" -> application.closeMonthlySurplusMonth(first,OCT);
                case "select" -> application.selectMonthlyGoal(first,b);
                case "progress" -> {
                    if(deleteFirst)assertThatThrownBy(()->application.progressGoalV2(first,a,30000L)).isInstanceOf(de.linus.tnbp.savingsgoals.SavingsGoals.NotFound.class);
                    else application.progressGoalV2(first,a,30000L);
                }
                default -> throw new AssertionError(command);
            }
        };
        try(var pool=Executors.newVirtualThreadPerTaskExecutor()) {
            var firstWork=pool.submit(deleteFirst?deletion:other);assertThat(entered.await(5,TimeUnit.SECONDS)).isTrue();
            var secondWork=pool.submit(deleteFirst?other:deletion);
            try {awaitWaiter(holder.get());} finally {release.countDown();}
            firstWork.get(5,TimeUnit.SECONDS);secondWork.get(5,TimeUnit.SECONDS);
        } finally {release.countDown();org.mockito.Mockito.reset(goals,monthly);}
        assertThat(application.allGoals(first)).extracting(g->g.id()).containsExactly(b);
        assertThat(application.monthlyOverview(first).selectedGoalId()).isEqualTo(command.equals("select")?b:null);
        assertThat(application.monthlyPending(first)).isZero();assertThat(progress(first,b)).isZero();
        if(!command.equals("progress"))assertThat(records().getFirst()).containsEntry("goal_id",a).containsEntry("consumed",true);
        assertThat(deleted()).hasSize(1);
    }
    @Test void loeschzeitpunktLiegtNachKontosperreAuchUeberMonatsgrenze() throws Exception {
        UUID a=goal(first,0);application.activateMonthlyAutomation(first);application.selectMonthlyGoal(first,a);CLOCK.calls.set(0);
        try(var blocker=ADMIN.getDataSource().getConnection();var pool=Executors.newVirtualThreadPerTaskExecutor()) {
            blocker.setAutoCommit(false);int holder;
            try(var statement=blocker.prepareStatement("SELECT pg_advisory_xact_lock(hashtextextended(?,14)),pg_backend_pid()")) {
                statement.setString(1,first.toString());try(var row=statement.executeQuery()){row.next();holder=row.getInt(2);}
            }
            var work=pool.submit(()->application.deleteGoal(first,a));
            try {awaitWaiter(holder);assertThat(CLOCK.calls.get()).isZero();CLOCK.now=Instant.parse("2026-10-31T23:00:00Z");}
            finally {blocker.commit();}
            work.get(5,TimeUnit.SECONDS);assertThat(CLOCK.calls.get()).isEqualTo(1);
        }
        assertThat(transactions.<UUID>read(first,c->monthly.selected(c,OCT))).isEqualTo(a);
        assertThat(application.monthlyOverview(first).selectedGoalId()).isNull();
        assertThat(count()).isZero();
    }
    @Test void alleLoeschschritteTeilenVerbindungKontokontextTransaktionUndZeitpunkt() {
        budget(first,"2026-10-01",100000);UUID a=closeBoundOctober();resetMarker();
        ADMIN.execute("CREATE TABLE public.deletion_probe (pid integer, tx bigint, account text); GRANT INSERT ON public.deletion_probe TO tnbp_runtime,tnbp_migrator");
        ADMIN.execute("CREATE FUNCTION public.deletion_probe() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN INSERT INTO public.deletion_probe VALUES (pg_backend_pid(),txid_current(),current_setting('app.user_id')); RETURN NULL; END $$");
        var tables=List.of("monthly_surplus.deleted_goals","monthly_surplus.month_records","monthly_surplus.selections","savings_goals.goals","api_version.state");
        for(String table:tables)ADMIN.execute("CREATE TRIGGER deletion_probe AFTER INSERT OR UPDATE OR DELETE ON "+table+" FOR EACH ROW EXECUTE FUNCTION public.deletion_probe()");
        CLOCK.calls.set(0);
        try {
            application.deleteGoal(first,a);assertThat(CLOCK.calls.get()).isEqualTo(1);
            var rows=ADMIN.queryForList("SELECT * FROM public.deletion_probe");assertThat(rows).hasSize(5);
            for(String field:List.of("pid","tx","account"))assertThat(rows.stream().map(row->row.get(field)).distinct().toList()).hasSize(1);
            assertThat(rows.getFirst().get("account")).isEqualTo(first.toString());
        } finally {
            for(String table:tables)ADMIN.execute("DROP TRIGGER deletion_probe ON "+table);
            ADMIN.execute("DROP FUNCTION public.deletion_probe();DROP TABLE public.deletion_probe");
        }
    }
}
