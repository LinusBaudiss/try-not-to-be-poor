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
class MonthlyCorrectionIT {
    static final String NAME = "correction_" + UUID.randomUUID().toString().replace("-", "");
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

    @Test void offeneOktoberkorrekturErsetztNurDiesenMonatUndUebernimmtSpaeterEinmalig250Euro() throws Exception {
        fixture(); UUID id=application.allExpenses(first).stream().filter(e->e.recordedOn().equals(OCT)).findFirst().orElseThrow().id();
        UUID goal=goal(first,5000); activeDecember();
        application.closeMonthlySurplusMonth(first,OCT); application.closeMonthlySurplusMonth(first,OCT.plusMonths(1));
        var november=records().get(1);
        var response=mutation("PUT",first,id,85000L);
        assertThat(response.statusCode()).isEqualTo(200); assertThat(response.body()).contains("\"recordedOn\":\"2026-10-01\"","\"amountCents\":85000");
        assertThat(application.monthlyPending(first)).isEqualTo(25000); assertThat(records().get(1)).isEqualTo(november);
        assertThat(progress(first,goal)).isEqualTo(5000); assertThat(application.monthlyPending(second)).isZero();
        application.selectMonthlyGoal(first,goal); assertThat(progress(first,goal)).isEqualTo(30000);
        application.selectMonthlyGoal(first,goal); assertThat(progress(first,goal)).isEqualTo(30000);
        assertThat(records()).allSatisfy(row->assertThat(row.get("goal_id")).isEqualTo(goal));
    }
    @ParameterizedTest @ValueSource(longs={30000,2000})
    void differenzAmAktuellenStandBleibtAnAUndKannNegativWerden(long manual) throws Exception {
        budget(first,"2026-10-01",100000); UUID expense=historical(80000); UUID a=goal(first,0), b=goal(first,17);
        application.activateMonthlyAutomation(first); application.selectMonthlyGoal(first,a);
        CLOCK.now=Instant.parse("2026-11-01T12:00:00Z"); application.closeMonthlySurplusMonth(first,OCT);
        application.progressGoalV2(first,a,manual); application.selectMonthlyGoal(first,b);
        assertThat(mutation("PUT",first,expense,85000L).statusCode()).isEqualTo(200);
        assertThat(progress(first,a)).isEqualTo(manual-5000); assertThat(progress(first,b)).isEqualTo(17);
        assertThat(records().getFirst()).containsEntry("goal_id",a).containsEntry("surplus_cents",15000L);
        assertThat(mutation("PUT",first,expense,85000L).statusCode()).isEqualTo(200);
        assertThat(progress(first,a)).isEqualTo(manual-5000);
        // Wieder A für den offenen November: +100 € arbeiten am tatsächlichen negativen Stand.
        application.selectMonthlyGoal(first,a); budget(first,"2026-11-01",10000);
        CLOCK.now=Instant.parse("2026-12-01T12:00:00Z"); application.closeMonthlySurplusMonth(first,OCT.plusMonths(1));
        assertThat(progress(first,a)).isEqualTo(manual+5000);
        assertThat(progress(second,goal(second,999))).isEqualTo(999);
    }
    @Test void positiveDifferenzLoeschungWiederholungUndGebundenerNullmonat() throws Exception {
        budget(first,"2026-10-01",100000);UUID id=historical(110000),a=goal(first,0);
        application.activateMonthlyAutomation(first);application.selectMonthlyGoal(first,a);
        CLOCK.now=Instant.parse("2026-11-01T12:00:00Z");application.closeMonthlySurplusMonth(first,OCT);
        assertThat(records().getFirst()).containsEntry("surplus_cents",0L).containsEntry("goal_id",a);
        mutation("PUT",first,id,95000L); assertThat(progress(first,a)).isEqualTo(5000);
        mutation("PUT",first,id,80000L); assertThat(progress(first,a)).isEqualTo(20000);
        assertThat(mutation("DELETE",first,id,null).statusCode()).isEqualTo(204);assertThat(progress(first,a)).isEqualTo(100000);
        var before=records();assertThat(mutation("DELETE",first,id,null).statusCode()).isEqualTo(404);
        assertThat(records()).isEqualTo(before);assertThat(progress(first,a)).isEqualTo(100000);
    }
    @Test void offeneNullUndOhneBudgetMonateBleibenVerschieden() {
        UUID id=historical(80000); activeDecember();
        application.updateExpense(first,id,"Ohne Budget",85000L);
        assertThat(records().getFirst()).containsEntry("surplus_cents",null).containsEntry("goal_id",null);
        assertThat(application.monthlyPending(first)).isZero();
        // Zweites Konto mit echtem budgetiertem Nullmonat, ohne historische Budgetänderung.
        budget(second,"2026-10-01",100000);budget(second,"2026-11-01",0);expense(second,"2026-10-01",100000);
        UUID other=application.allExpenses(second).getFirst().id();
        CLOCK.now=Instant.parse("2026-10-31T22:59:59Z");application.activateMonthlyAutomation(second);
        CLOCK.now=Instant.parse("2026-12-01T12:00:00Z");application.updateExpense(second,other,"Null",110000L);
        assertThat(transactions.<MonthlySurplus.MonthRecord>read(second,ctx->monthly.record(ctx,OCT)))
            .isEqualTo(new MonthlySurplus.MonthRecord(0L,null,false));
        UUID a=goal(second,0);application.selectMonthlyGoal(second,a);
        application.updateExpense(second,other,"Gebunden",90000L);
        assertThat(progress(second,a)).isEqualTo(10000);assertThat(application.monthlyPending(first)).isZero();
    }
    @ParameterizedTest @ValueSource(booleans={false,true})
    void fehlenderErstnachweisVerwendetResultierendeBasisUndHistorischeAuswahl(boolean missingGoal) {
        budget(first,"2026-10-01",100000); UUID id=historical(80000),a=goal(first,0),b=goal(first,7);
        application.activateMonthlyAutomation(first);
        // Modulseigene historische Auswahlfixtures: spätere Auswahl darf Erstabschluss nicht umleiten.
        ADMIN.update("INSERT INTO monthly_surplus.selections VALUES (?,?,?),(?,?,?)",first,OCT,a,first,OCT.plusMonths(1),b);
        CLOCK.now=Instant.parse("2026-12-01T12:00:00Z");
        if(missingGoal) application.deleteGoal(first,a);
        CLOCK.now=Instant.parse("2026-12-01T12:00:00Z");application.updateExpense(first,id,"Korrigiert",85000L);
        assertThat(count()).isEqualTo(1);assertThat(records().getFirst()).containsEntry("goal_id",a).containsEntry("surplus_cents",15000L).containsEntry("consumed",missingGoal);
        assertThat(progress(first,b)).isEqualTo(7);assertThat(application.monthlyPending(first)).isZero();
        if(!missingGoal)assertThat(progress(first,a)).isEqualTo(15000);
    }
    @Test void bestehendeVerbrauchteBindungBleibtVerbrauchtAuchBeiNochVorhandenemZiel() {
        budget(first,"2026-10-01",100000);UUID id=historical(80000),a=goal(first,20000),b=goal(first,9);activeDecember();
        ADMIN.update("INSERT INTO monthly_surplus.month_records VALUES (?,?,?,?,true)",first,OCT,20000,a);
        application.updateExpense(first,id,"Korrektur",85000L);
        assertThat(records().getFirst()).containsEntry("goal_id",a).containsEntry("surplus_cents",15000L).containsEntry("consumed",true);
        assertThat(progress(first,a)).isEqualTo(20000);assertThat(progress(first,b)).isEqualTo(9);assertThat(application.monthlyPending(first)).isZero();
    }
    @Test void keineAktivierungVorAktivierungOffenerMonatUndGleicherBetragHabenKeineMonatswirkung() {
        UUID id=historical(80000);CLOCK.now=Instant.parse("2026-12-01T12:00:00Z");
        application.updateExpense(first,id,"Inaktiv",81000L);assertThat(count()).isZero();
        application.activateMonthlyAutomation(first);application.updateExpense(first,id,"Vor Aktivierung",82000L);assertThat(count()).isZero();
        var current=application.saveExpense(first,"Offen",1L);application.updateExpense(first,current.id(),"Offen",2L);assertThat(count()).isZero();
        ADMIN.update("UPDATE monthly_surplus.activations SET activation_month=? WHERE user_id=?",OCT,first);
        READY.open=false;application.updateExpense(first,id,"Nur Name",82000L);assertThat(count()).isZero();assertThat(marker()).isFalse();
        application.progressGoalV2(first,goal(first,0),30000L); // Unabhängige Reparatur trotz geschlossenem Gesamtgate.
    }
    @ParameterizedTest @ValueSource(strings={"PUT","DELETE"})
    void gesperrteErforderlicheKorrekturRolltBereitsAusgefuehrteMutationSicherZurueck(String method) throws Exception {
        budget(first,"2026-10-01",100000);UUID id=historical(80000);activeDecember();READY.open=false;
        var before=application.allExpenses(first);var response=mutation(method,first,id,method.equals("PUT")?85000L:null);
        assertThat(response.statusCode()).isEqualTo(409);assertThat(response.body()).contains("FEATURE_NOT_AVAILABLE");
        assertThat(application.allExpenses(first)).isEqualTo(before);assertThat(count()).isZero();assertThat(marker()).isFalse();
    }
    @ParameterizedTest @CsvSource({"PUT,false", "PUT,true", "DELETE,false", "DELETE,true"})
    void grenzeNachAusgabenmutationRolltAusgabeNachweisUndMarkerZurueck(String method, boolean existing) throws Exception {
        long max=de.linus.tnbp.shared.Money.MAX_CENTS;
        budget(first,"2026-10-01",max);UUID id=historical(2);activeDecember();CLOCK.now=Instant.parse("2027-01-01T12:00:00Z");
        ADMIN.update("INSERT INTO monthly_surplus.month_records VALUES (?,?,1,NULL,false)",first,OCT.plusMonths(1));
        if(method.equals("PUT"))ADMIN.update("INSERT INTO monthly_surplus.month_records VALUES (?,?,1,NULL,false)",first,OCT.plusMonths(2));
        if(existing)assertThat(application.closeMonthlySurplusMonth(first,OCT)).isTrue();
        resetMarker();
        var before=financeState();
        assertThat(application.monthlyPending(first)).isEqualTo(existing ? method.equals("PUT") ? max : max-1 : method.equals("PUT") ? 2 : 1);
        var response=mutation(method,first,id,method.equals("PUT")?1L:null);
        assertThat(response.statusCode()).isEqualTo(409);assertThat(response.body()).contains("AMOUNT_LIMIT_EXCEEDED");
        assertThat(financeState()).isEqualTo(before);assertThat(marker()).isFalse();
    }
    @ParameterizedTest @CsvSource({"PUT,missing", "DELETE,missing", "PUT,open", "DELETE,open", "PUT,bound", "DELETE,bound"})
    void echterCommitfehlerNachAusgabeNachweisZielUndMarkerBestaetigtGarNichts(String method, String origin, CapturedOutput logs) throws Exception {
        budget(first,"2026-10-01",100000);UUID id=historical(80000),a=goal(first,0);
        application.activateMonthlyAutomation(first);
        if(!origin.equals("open"))application.selectMonthlyGoal(first,a);
        CLOCK.now=Instant.parse("2026-12-01T12:00:00Z");
        if(!origin.equals("missing"))assertThat(application.closeMonthlySurplusMonth(first,OCT)).isTrue();
        resetMarker();
        var before=financeState();
        assertThat(application.monthlyPending(first)).isEqualTo(origin.equals("open")?20000:0);
        if(!origin.equals("missing"))assertThat(records().getFirst()).containsEntry("surplus_cents",20000L)
            .containsEntry("goal_id",origin.equals("bound")?a:null).containsEntry("consumed",false);
        ADMIN.execute("CREATE FUNCTION monthly_surplus.reject_correction_commit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetisch'; END $$; CREATE CONSTRAINT TRIGGER reject_correction_commit AFTER INSERT OR UPDATE ON monthly_surplus.month_records DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION monthly_surplus.reject_correction_commit()");
        try {
            int logStart=logs.getAll().length();
            var response=mutation(method,first,id,method.equals("PUT")?85000L:null);
            assertThat(logs.getAll().substring(logStart)).contains("Fehlerkategorie=DATENBANK")
                .doesNotContain(first.toString(),second.toString(),id.toString(),"85000","80000","Synthetisch","Berlin-Fahrt","Bearer");
            assertThat(response.statusCode()).isEqualTo(500);assertThat(response.body()).contains("EXPENSE_UNAVAILABLE","nicht bestätigt");
            assertThat(financeState()).isEqualTo(before);assertThat(marker()).isFalse();
        } finally {ADMIN.execute("DROP TRIGGER reject_correction_commit ON monthly_surplus.month_records; DROP FUNCTION monthly_surplus.reject_correction_commit()");}
    }
    @ParameterizedTest @ValueSource(strings={"PUT","DELETE"})
    void signierteFortschrittsgrenzenVerwerfenDieSchonAusgefuehrteAusgabenmutation(String method) throws Exception {
        long max=de.linus.tnbp.shared.Money.MAX_CENTS;
        budget(first,"2026-10-01",100000);UUID id=historical(80000),a=goal(first,0);activeDecember();
        application.progressGoalV2(first,a,method.equals("PUT")?-max:max);
        ADMIN.update("INSERT INTO monthly_surplus.month_records VALUES (?,?,?,?,false)",first,OCT,20000,a);
        var before=records();var goalsBefore=application.allGoals(first);
        var response=mutation(method,first,id,method.equals("PUT")?85000L:null);
        assertThat(response.statusCode()).isEqualTo(409);assertThat(response.body()).contains("AMOUNT_LIMIT_EXCEEDED");
        assertThat(amount(id)).isEqualTo(80000);assertThat(records()).isEqualTo(before);
        assertThat(application.allGoals(first)).isEqualTo(goalsBefore);assertThat(marker()).isFalse();
    }
    @Test void fremdeFehlendeUndUnangemeldeteAusgabenBleibenNeutralUndOhneWirkung() throws Exception {
        UUID id=historical(80000);activeDecember();
        for(String method:List.of("PUT","DELETE")) {
            Long value=method.equals("PUT")?85000L:null;
            var foreign=mutation(method,second,id,value);var absent=mutation(method,second,UUID.randomUUID(),value);
            assertThat(foreign.statusCode()).isEqualTo(404);assertThat(absent.statusCode()).isEqualTo(404);assertThat(foreign.body()).isEqualTo(absent.body());
            assertThat(mutation(method,null,id,value).statusCode()).isEqualTo(401);
        }
        assertThat(count()).isZero();assertThat(amount(id)).isEqualTo(80000);assertThat(marker()).isFalse();
    }
    @Test void korrekturProjektionUndSchreibrechteBleibenUnterFilterForceRlsUndVerbindungsbereinigung() throws Exception {
        budget(first,"2026-10-01",100000);UUID id=historical(80000);activeDecember();application.updateExpense(first,id,"Neu",85000L);
        assertThat(transactions.<MonthlySurplus.MonthRecord>read(second,ctx->records.find(first,OCT))).isNull();
        assertThatThrownBy(()->transactions.mutate(second,ctx->{records.correct(first,OCT,1L,false);return null;})).isInstanceOf(IllegalStateException.class);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM monthly_surplus.month_records",Integer.class)).isZero();
        assertThatThrownBy(()->transactions.read(first,ctx->{monthly.correct(ctx,OCT,1L,false);return null;})).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(()->transactions.mutate(first,ctx->{jdbc.execute("UPDATE monthly_surplus.month_records SET origin_month=DATE '2026-09-01'");return null;})).isInstanceOf(org.springframework.dao.DataAccessException.class);
        try(var connection=source.getConnection();var statement=connection.createStatement();var result=statement.executeQuery("SELECT NULLIF(current_setting('app.user_id',true),'') IS NULL, (SELECT count(*) FROM monthly_surplus.month_records)")) {
            result.next();assertThat(result.getBoolean(1)).isTrue();assertThat(result.getInt(2)).isZero();
        }
    }
    @ParameterizedTest @ValueSource(strings={"PUT","DELETE"})
    void geloeschtesUrsprungszielVerbrauchtBestehendeBindungOhneUmleitung(String method) throws Exception {
        budget(first,"2026-10-01",100000);UUID id=historical(80000),a=closeBoundOctober(),b=goal(first,17);
        assertThat(records().getFirst()).containsEntry("goal_id",a).containsEntry("surplus_cents",20000L).containsEntry("consumed",false);
        application.deleteGoal(first,a);
        assertThat(records().getFirst()).containsEntry("consumed",true);
        var goalsBefore=application.allGoals(first);long pendingBefore=application.monthlyPending(first);
        var response=mutation(method,first,id,method.equals("PUT")?85000L:null);
        assertThat(response.statusCode()).isEqualTo(method.equals("PUT")?200:204);
        assertThat(records()).hasSize(1);
        assertThat(records().getFirst()).containsEntry("goal_id",a).containsEntry("consumed",true)
            .containsEntry("surplus_cents",method.equals("PUT")?15000L:100000L);
        assertThat(application.monthlyPending(first)).isEqualTo(pendingBefore);
        assertThat(application.allGoals(first)).isEqualTo(goalsBefore);assertThat(progress(first,b)).isEqualTo(17);
        if(method.equals("PUT"))assertThat(amount(id)).isEqualTo(85000);
        else assertThat(application.allExpenses(first)).isEmpty();
    }
    @ParameterizedTest @ValueSource(strings={"PUT","DELETE"})
    void geaenderterStilllegungsbelegSperrtErforderlicheKorrekturTrotzOffenerBereitschaft(String method) throws Exception {
        budget(first,"2026-10-01",100000);UUID id=historical(80000);closeBoundOctober();resetMarker();
        assertThat(READY.open).isTrue();var before=financeState();
        String proof=ADMIN.queryForObject("SELECT roles_sha256 FROM api_version.state",String.class);
        try {
            ADMIN.update("UPDATE api_version.state SET roles_sha256=?","b".repeat(64));
            var changedProofState=financeState();
            var response=mutation(method,first,id,method.equals("PUT")?85000L:null);
            assertThat(response.statusCode()).isEqualTo(409);assertThat(response.body()).contains("FEATURE_NOT_AVAILABLE");
            assertThat(financeState()).isEqualTo(changedProofState);assertThat(marker()).isFalse();
        } finally {ADMIN.update("UPDATE api_version.state SET roles_sha256=?",proof);}
        assertThat(financeState()).isEqualTo(before);
    }
    @ParameterizedTest @ValueSource(longs={100000,110000})
    void vollstaendigAufgezehrterUeberschussZiehtGenauDenAltenKreditEinmaligAb(long updatedAmount) throws Exception {
        budget(first,"2026-10-01",100000);UUID id=historical(80000),a=closeBoundOctober();
        application.progressGoalV2(first,a,30000L);
        assertThat(mutation("PUT",first,id,updatedAmount).statusCode()).isEqualTo(200);
        assertThat(progress(first,a)).isEqualTo(10000);
        assertThat(records().getFirst()).containsEntry("surplus_cents",0L).containsEntry("goal_id",a).containsEntry("consumed",false);
        assertThat(application.monthlyPending(first)).isZero();
        var after=financeState();
        assertThat(mutation("PUT",first,id,updatedAmount).statusCode()).isEqualTo(200);
        assertThat(financeState()).isEqualTo(after);
    }
    @ParameterizedTest @ValueSource(strings={"inactive","before-activation","current"})
    void loeschenOhneKorrekturpflichtBleibtBeiGeschlossenerBereitschaftMoeglich(String state) throws Exception {
        budget(first,"2026-10-01",100000);UUID id=historical(80000);
        if(!state.equals("current"))CLOCK.now=Instant.parse("2026-12-01T12:00:00Z");
        if(!state.equals("inactive"))application.activateMonthlyAutomation(first);
        READY.open=false;var before=financeState();
        var response=mutation("DELETE",first,id,null);
        assertThat(response.statusCode()).isEqualTo(204);assertThat(response.body()).isEmpty();
        assertThat(application.allExpenses(first)).isEmpty();
        var after=financeState();
        for(String unchanged:List.of("records","goals","pending","selection","version"))assertThat(after.get(unchanged)).isEqualTo(before.get(unchanged));
        assertThat(count()).isZero();assertThat(application.monthlyPending(first)).isZero();assertThat(marker()).isFalse();
    }
    @ParameterizedTest @CsvSource({
        "PUT,PUT,85000,90000,90000,10000,200",
        "PUT,PUT,90000,85000,85000,15000,200",
        "PUT,DELETE,85000,0,0,100000,204",
        "DELETE,PUT,0,85000,0,100000,404"
    })
    void zweiAusgabenkorrekturenVerwendenIhreTatsaechlichSerialisierteBasis(String firstMethod, String secondMethod,
            long firstAmount, long secondAmount, long finalAmount, long finalSurplus, int secondStatus) throws Exception {
        budget(first,"2026-10-01",100000);UUID id=historical(80000),a=closeBoundOctober();
        var entered=new CountDownLatch(1);var release=new CountDownLatch(1);var holder=new AtomicInteger();var calls=new AtomicInteger();
        org.mockito.Mockito.doAnswer(invocation->{
            if(calls.getAndIncrement()==0) {
                holder.set(jdbc.queryForObject("SELECT pg_backend_pid()",Integer.class));entered.countDown();
                assertThat(release.await(5,TimeUnit.SECONDS)).isTrue();
            }
            return invocation.callRealMethod();
        }).when(monthly).record(org.mockito.ArgumentMatchers.any(),org.mockito.ArgumentMatchers.eq(OCT));
        try(var pool=Executors.newVirtualThreadPerTaskExecutor()) {
            var firstWork=pool.submit(()->mutation(firstMethod,first,id,firstMethod.equals("PUT")?firstAmount:null));
            assertThat(entered.await(5,TimeUnit.SECONDS)).isTrue();
            var secondWork=pool.submit(()->mutation(secondMethod,first,id,secondMethod.equals("PUT")?secondAmount:null));
            try {awaitWaiter(holder.get());} finally {release.countDown();}
            assertThat(firstWork.get(5,TimeUnit.SECONDS).statusCode()).isEqualTo(firstMethod.equals("PUT")?200:204);
            assertThat(secondWork.get(5,TimeUnit.SECONDS).statusCode()).isEqualTo(secondStatus);
        } finally {release.countDown();org.mockito.Mockito.reset(monthly);}
        if(finalAmount==0)assertThat(application.allExpenses(first)).isEmpty();
        else {
            var saved=application.allExpenses(first);assertThat(saved).hasSize(1);
            assertThat(saved.getFirst().id()).isEqualTo(id);assertThat(saved.getFirst().recordedOn()).isEqualTo(OCT);
            assertThat(saved.getFirst().amountCents()).isEqualTo(finalAmount);
        }
        assertThat(records()).hasSize(1);
        assertThat(records().getFirst()).containsEntry("goal_id",a).containsEntry("surplus_cents",finalSurplus).containsEntry("consumed",false);
        assertThat(progress(first,a)).isEqualTo(finalSurplus);assertThat(application.monthlyPending(first)).isZero();
    }
    void awaitWaiter(int holder) throws Exception {
        long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(5);boolean waiting;
        do {
            waiting=Boolean.TRUE.equals(ADMIN.queryForObject("SELECT EXISTS(SELECT FROM pg_stat_activity WHERE wait_event='advisory' AND ? = ANY(pg_blocking_pids(pid)))",Boolean.class,holder));
            if(!waiting)Thread.sleep(10);
        } while(!waiting&&System.nanoTime()<deadline);
        assertThat(waiting).as("zweiter echter Modulaufruf wartet auf Kontosperre").isTrue();
    }
    @ParameterizedTest @ValueSource(booleans={true,false})
    void manuellesErsetzenUndKorrekturWerdenInBeidenTatsaechlichenSperrreihenfolgenSerialisiert(boolean manualFirst) throws Exception {
        budget(first,"2026-10-01",100000);UUID id=historical(80000),a=goal(first,0);
        application.activateMonthlyAutomation(first);application.selectMonthlyGoal(first,a);
        CLOCK.now=Instant.parse("2026-11-01T12:00:00Z");application.closeMonthlySurplusMonth(first,OCT);
        var entered=new CountDownLatch(1);var release=new CountDownLatch(1);
        var holder=new AtomicInteger();
        org.mockito.Mockito.doAnswer(invocation->{
            holder.set(jdbc.queryForObject("SELECT pg_backend_pid()",Integer.class));entered.countDown();assertThat(release.await(5,TimeUnit.SECONDS)).isTrue();
            return invocation.callRealMethod();
        }).when(goals).signedProgress(org.mockito.ArgumentMatchers.any(),org.mockito.ArgumentMatchers.eq(a),org.mockito.ArgumentMatchers.eq(30000L));
        org.mockito.Mockito.doAnswer(invocation->{
            holder.set(jdbc.queryForObject("SELECT pg_backend_pid()",Integer.class));entered.countDown();assertThat(release.await(5,TimeUnit.SECONDS)).isTrue();
            return invocation.callRealMethod();
        }).when(monthly).record(org.mockito.ArgumentMatchers.any(),org.mockito.ArgumentMatchers.eq(OCT));
        try(var pool=Executors.newVirtualThreadPerTaskExecutor()) {
            var firstWork=pool.submit(()->{if(manualFirst)application.progressGoalV2(first,a,30000L);else application.updateExpense(first,id,"Korrektur",85000L);});
            assertThat(entered.await(5,TimeUnit.SECONDS)).isTrue();
            var secondWork=pool.submit(()->{if(manualFirst)application.updateExpense(first,id,"Korrektur",85000L);else application.progressGoalV2(first,a,30000L);});
            try {awaitWaiter(holder.get());} finally {release.countDown();}
            firstWork.get(5,TimeUnit.SECONDS);secondWork.get(5,TimeUnit.SECONDS);
        } finally {release.countDown();org.mockito.Mockito.reset(goals,monthly);}
        assertThat(progress(first,a)).isEqualTo(manualFirst?25000:30000);assertThat(records().getFirst()).containsEntry("surplus_cents",15000L);
    }
    @ParameterizedTest @ValueSource(booleans={true,false})
    void auswahlUndKorrekturVerwendenInBeidenReihenfolgenDieFestgelegteHerkunft(boolean correctionFirst) throws Exception {
        budget(first,"2026-10-01",100000);UUID id=historical(80000),a=goal(first,5000);activeDecember();application.closeMonthlySurplusMonth(first,OCT);
        budget(first,"2026-11-01",0);
        var entered=new CountDownLatch(1);var release=new CountDownLatch(1);var holder=new AtomicInteger();
        if(correctionFirst)org.mockito.Mockito.doAnswer(invocation->{holder.set(jdbc.queryForObject("SELECT pg_backend_pid()",Integer.class));entered.countDown();assertThat(release.await(5,TimeUnit.SECONDS)).isTrue();return invocation.callRealMethod();})
            .when(monthly).record(org.mockito.ArgumentMatchers.any(),org.mockito.ArgumentMatchers.eq(OCT));
        else org.mockito.Mockito.doAnswer(invocation->{holder.set(jdbc.queryForObject("SELECT pg_backend_pid()",Integer.class));entered.countDown();assertThat(release.await(5,TimeUnit.SECONDS)).isTrue();return invocation.callRealMethod();})
            .when(monthly).bindOpen(org.mockito.ArgumentMatchers.any(),org.mockito.ArgumentMatchers.eq(a));
        try(var pool=Executors.newVirtualThreadPerTaskExecutor()) {
            var firstWork=pool.submit(()->{if(correctionFirst)application.updateExpense(first,id,"Korrektur",85000L);else application.selectMonthlyGoal(first,a);});
            assertThat(entered.await(5,TimeUnit.SECONDS)).isTrue();
            var secondWork=pool.submit(()->{if(correctionFirst)application.selectMonthlyGoal(first,a);else application.updateExpense(first,id,"Korrektur",85000L);});
            try {awaitWaiter(holder.get());} finally {release.countDown();}
            firstWork.get(5,TimeUnit.SECONDS);secondWork.get(5,TimeUnit.SECONDS);
        } finally {release.countDown();org.mockito.Mockito.reset(monthly);}
        assertThat(progress(first,a)).isEqualTo(20000);assertThat(application.monthlyPending(first)).isZero();
        assertThat(records().getFirst()).containsEntry("goal_id",a).containsEntry("surplus_cents",15000L);
    }
    @Test void wartendeMutationBestimmtKalenderUndQuellenErstNachSperrerwerbUeberMonatsgrenze() throws Exception {
        budget(first,"2026-10-01",100000);UUID id=historical(80000);application.activateMonthlyAutomation(first);CLOCK.calls.set(0);
        try(var blocker=ADMIN.getDataSource().getConnection();var pool=Executors.newVirtualThreadPerTaskExecutor()) {
            blocker.setAutoCommit(false);int holder;
            try(var statement=blocker.prepareStatement("SELECT pg_advisory_xact_lock(hashtextextended(?,14)),pg_backend_pid()")) {
                statement.setString(1,first.toString());try(var row=statement.executeQuery()){row.next();holder=row.getInt(2);}
            }
            var work=pool.submit(()->application.updateExpense(first,id,"Korrektur",85000L));
            try {awaitWaiter(holder);assertThat(CLOCK.calls.get()).isZero();CLOCK.now=Instant.parse("2026-10-31T23:00:00Z");}
            finally {blocker.commit();}
            assertThat(work.get(5,TimeUnit.SECONDS).recordedOn()).isEqualTo(OCT);assertThat(CLOCK.calls.get()).isEqualTo(1);
        }
        assertThat(count()).isEqualTo(1);assertThat(application.monthlyPending(first)).isEqualTo(15000);
    }
    @Test void ausgabeProjektionenZielNachweisUndMarkerHabenDenselbenCommitUndZeitpunkt() {
        budget(first,"2026-10-01",100000);UUID id=historical(80000),a=goal(first,0);
        application.activateMonthlyAutomation(first);application.selectMonthlyGoal(first,a);CLOCK.now=Instant.parse("2026-11-01T12:00:00Z");application.closeMonthlySurplusMonth(first,OCT);
        ADMIN.execute("CREATE TABLE public.correction_probe (pid integer, tx bigint, account text); GRANT INSERT ON public.correction_probe TO tnbp_runtime,tnbp_migrator");
        ADMIN.execute("CREATE FUNCTION public.correction_probe() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN INSERT INTO public.correction_probe VALUES (pg_backend_pid(),txid_current(),current_setting('app.user_id')); RETURN NEW; END $$");
        var tables=List.of("expenses.expenses","savings_goals.goals","monthly_surplus.month_records","api_version.state");
        for(String table:tables)ADMIN.execute("CREATE TRIGGER correction_probe AFTER UPDATE ON "+table+" FOR EACH ROW EXECUTE FUNCTION public.correction_probe()");
        CLOCK.calls.set(0);
        try {
            application.updateExpense(first,id,"Korrektur",85000L);assertThat(CLOCK.calls.get()).isEqualTo(1);
            var rows=ADMIN.queryForList("SELECT * FROM public.correction_probe");assertThat(rows).hasSize(4);
            for(String field:List.of("pid","tx","account"))assertThat(rows.stream().map(row->row.get(field)).distinct().toList()).hasSize(1);
            assertThat(rows.getFirst().get("account")).isEqualTo(first.toString());
        } finally {
            for(String table:tables)ADMIN.execute("DROP TRIGGER correction_probe ON "+table);
            ADMIN.execute("DROP FUNCTION public.correction_probe();DROP TABLE public.correction_probe");
        }
    }
}
