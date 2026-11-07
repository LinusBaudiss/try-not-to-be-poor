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
class MonthlyPendingIT {
    static final String NAME = "pending_" + UUID.randomUUID().toString().replace("-", "");
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

    @Test void nurBearerUndReinesLesenAuchBeiGeschlossenemGesamtgate() throws Exception {
        assertThat(pending(null).statusCode()).isEqualTo(401);
        assertThat(request("GET","/api/v2/monthly-surplus/pending",null,"__Host-tnbp-refresh=synthetisch").statusCode()).isEqualTo(401);
        var invalid=HttpClient.newHttpClient().send(HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api/v2/monthly-surplus/pending"))
            .header("Authorization","Bearer ungültig").GET().build(),HttpResponse.BodyHandlers.ofString());
        assertThat(invalid.statusCode()).isEqualTo(401);
        activated(); READY.open=false;
        assertThat(pending(first).body()).isEqualTo("{\"pendingCents\":0}");
        assertThat(pending(second).body()).isEqualTo("{\"pendingCents\":0}");
        assertThat(count()).isZero(); assertThat(marker()).isFalse();
    }
    @Test void zweiHistorischeMonateGetrenntMitLueckeEinmalwirkungUndUnveraendertemZiel() throws Exception {
        budget(first,"2026-09-01",100000); budget(first,"2026-11-01",20000); budget(first,"2026-12-01",999999);
        expense(first,"2026-09-30",90000); expense(first,"2026-10-01",30000); expense(first,"2026-10-30",50000);
        expense(first,"2026-11-15",10000); expense(first,"2026-12-01",777);
        budget(second,"2026-09-01",99999); expense(second,"2026-10-01",99999);
        var goal=application.saveGoal(first,"Vorhanden",100000L,null); application.progressGoal(first,goal.id(),5000L);
        activated();
        assertThat(application.closeMonthlySurplusMonth(first,OCT.plusMonths(1))).isTrue();
        assertThat(application.closeMonthlySurplusMonth(first,OCT)).isTrue();
        for(var month:List.of(OCT.minusMonths(1),OCT.plusMonths(2),OCT.plusMonths(3))) assertThat(application.closeMonthlySurplusMonth(first,month)).isFalse();
        assertThat(application.closeMonthlySurplusMonth(second,OCT)).isFalse();
        // Wiederholung ist keine historische Korrektur und erhält den Erstnachweis.
        ADMIN.update("UPDATE expenses.expenses SET amount_cents=1 WHERE user_id=? AND recorded_on=DATE '2026-10-01'",first);
        assertThat(application.closeMonthlySurplusMonth(first,OCT)).isFalse();
        assertThat(count()).isEqualTo(2); assertThat(application.monthlyPending(first)).isEqualTo(30000);
        assertThat(pending(first).body()).isEqualTo("{\"pendingCents\":30000}");
        assertThat(application.monthlyPending(second)).isZero();
        assertThat(ADMIN.queryForList("SELECT origin_month FROM monthly_surplus.month_records WHERE user_id=? ORDER BY origin_month",LocalDate.class,first)).containsExactly(OCT,OCT.plusMonths(1));
        assertThat(ADMIN.queryForList("SELECT surplus_cents FROM monthly_surplus.month_records WHERE user_id=? ORDER BY origin_month",Long.class,first)).containsExactly(20000L,10000L);
        assertThat(application.allGoals(first).getFirst().progressCents()).isEqualTo(5000); assertThat(marker()).isTrue();
        assertThatThrownBy(()->ADMIN.execute("SELECT api_version.set_retirement(false,gen_random_uuid(),repeat('a',64),repeat('a',64),repeat('a',64))")).isInstanceOf(org.springframework.dao.DataAccessException.class);
    }
    @Test void nullBudgetUndNegativeResteBewahrenUnterschiedlicheHerkunftUndRichtigesMarkerRollback() {
        activated(); CLOCK.now=Instant.parse("2027-02-01T12:00:00Z");
        budget(first,"2026-11-01",100); expense(first,"2026-11-30",100); expense(first,"2026-12-01",200); budget(first,"2027-01-01",0);
        assertThat(application.closeMonthlySurplusMonth(first,OCT)).isTrue(); assertThat(marker()).isTrue();
        for(int n=1;n<4;n++) assertThat(application.closeMonthlySurplusMonth(first,OCT.plusMonths(n))).isTrue();
        assertThat(count()).isEqualTo(4); assertThat(application.monthlyPending(first)).isZero();
        assertThat(ADMIN.queryForObject("SELECT surplus_cents FROM monthly_surplus.month_records WHERE user_id=? AND origin_month=?",Long.class,first,OCT)).isNull();
        assertThat(ADMIN.queryForObject("SELECT count(*) FROM monthly_surplus.month_records WHERE user_id=? AND surplus_cents=0",Integer.class,first)).isEqualTo(3);
        for(int n=0;n<4;n++) assertThat(application.closeMonthlySurplusMonth(first,OCT.plusMonths(n))).isFalse();
    }
    @Test void einzelUndOffeneSummengrenzeSindExaktUndFehlerLassenManuellePflegeZu(CapturedOutput logs) throws Exception {
        activated(); budget(first,"2026-10-01",de.linus.tnbp.shared.Money.MAX_CENTS);
        // Synthetischer gültiger Altbestand ohne vorweggenommenen Marker.
        ADMIN.update("INSERT INTO monthly_surplus.month_records VALUES (?,?,?)",first,OCT,de.linus.tnbp.shared.Money.MAX_CENTS);
        assertThat(application.monthlyPending(first)).isEqualTo(de.linus.tnbp.shared.Money.MAX_CENTS);
        assertThatThrownBy(()->application.closeMonthlySurplusMonth(first,OCT.plusMonths(1))).isInstanceOf(ArithmeticException.class);
        assertThat(count()).isEqualTo(1); assertThat(marker()).isFalse();
        var goal=application.saveGoal(first,"Reparatur",100L,null); application.progressGoal(first,goal.id(),50L);
        assertThat(application.allGoals(first).getFirst().progressCents()).isEqualTo(50);
        // PostgreSQL SUM(bigint) bleibt decimal, auch über long hinaus; GET lehnt neutral ab.
        ADMIN.update("INSERT INTO monthly_surplus.month_records SELECT ?, DATE '0001-01-01'+(n*interval '1 month'), ? FROM generate_series(0,1099) n",first,de.linus.tnbp.shared.Money.MAX_CENTS);
        String access=token(first);
        int logStart=logs.getAll().length();
        var failed=HttpClient.newHttpClient().send(HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api/v2/monthly-surplus/pending"))
            .header("Authorization","Bearer "+access).GET().build(),HttpResponse.BodyHandlers.ofString());
        assertThat(failed.statusCode()).isEqualTo(500); assertThat(failed.headers().firstValue("Cache-Control")).hasValue("no-store");
        assertThat(logs.getAll().substring(logStart)).contains("Fehlerkategorie=MONTHLY_SURPLUS_UNAVAILABLE")
            .doesNotContain(first.toString(),second.toString(),"9007199254740991","90.071.992.547.409,91","Synthetisch","Reparatur",access);
        assertThat(failed.body()).contains("MONTHLY_SURPLUS_UNAVAILABLE","Vormerkung konnte nicht geladen").doesNotContain(first.toString(),"9007199","SELECT","postgres","Synthetisch");
    }
    @Test void echteAbschluesseErreichenExaktDieGrenzeUndEinWeitererCentRolltVollstaendigZurueck() {
        activated(); CLOCK.now=Instant.parse("2027-01-01T12:00:00Z");
        long max=de.linus.tnbp.shared.Money.MAX_CENTS;
        budget(first,"2026-10-01",max-1); budget(first,"2026-11-01",1);
        assertThat(application.closeMonthlySurplusMonth(first,OCT)).isTrue();
        assertThat(application.monthlyPending(first)).isEqualTo(max-1);
        assertThat(application.closeMonthlySurplusMonth(first,OCT.plusMonths(1))).isTrue();
        assertThat(application.monthlyPending(first)).isEqualTo(max); assertThat(marker()).isTrue();
        var beforeRecords=ADMIN.queryForList("SELECT * FROM monthly_surplus.month_records WHERE user_id=? ORDER BY origin_month",first);
        var beforeMarker=ADMIN.queryForMap("SELECT * FROM api_version.state");
        assertThatThrownBy(()->application.closeMonthlySurplusMonth(first,OCT.plusMonths(2))).isInstanceOf(ArithmeticException.class);
        assertThat(ADMIN.queryForList("SELECT * FROM monthly_surplus.month_records WHERE user_id=? ORDER BY origin_month",first)).isEqualTo(beforeRecords);
        assertThat(ADMIN.queryForMap("SELECT * FROM api_version.state")).isEqualTo(beforeMarker);
        assertThat(application.monthlyPending(first)).isEqualTo(max); assertThat(count()).isEqualTo(2);
    }
    @Test void konkurrierendeVerschiedeneMonateKoennenDieOffeneSummengrenzeNichtUeberschreiten() throws Exception {
        activated(); long part=(de.linus.tnbp.shared.Money.MAX_CENTS+1)/2; budget(first,"2026-10-01",part);
        try(var blocker=ADMIN.getDataSource().getConnection();var pool=Executors.newVirtualThreadPerTaskExecutor()) {
            blocker.setAutoCommit(false);int holder;
            try(var statement=blocker.prepareStatement("SELECT pg_advisory_xact_lock(hashtextextended(?,14)),pg_backend_pid()")) {
                statement.setString(1,first.toString());try(var row=statement.executeQuery()){row.next();holder=row.getInt(2);}
            }
            var october=pool.submit(()->application.closeMonthlySurplusMonth(first,OCT));
            var november=pool.submit(()->application.closeMonthlySurplusMonth(first,OCT.plusMonths(1)));
            try {
                long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(5);
                int waiting;
                do {
                    waiting=ADMIN.queryForObject("SELECT count(*) FROM pg_stat_activity WHERE wait_event='advisory' AND ? = ANY(pg_blocking_pids(pid))",Integer.class,holder);
                    if(waiting!=2)Thread.sleep(10);
                } while(waiting!=2&&System.nanoTime()<deadline);
                assertThat(waiting).as("beide Monatsabschluesse warten gleichzeitig auf die Kontosperre").isEqualTo(2);
                assertThat(marker()).isFalse();assertThat(count()).isZero();
            } finally {blocker.commit();}
            int committed=0,rolledBack=0;
            for(var attempt:List.of(october,november)) {
                try {assertThat(attempt.get(5,TimeUnit.SECONDS)).isTrue();committed++;}
                catch(ExecutionException failure) {assertThat(failure.getCause()).isInstanceOf(ArithmeticException.class);rolledBack++;}
            }
            assertThat(committed).isEqualTo(1);assertThat(rolledBack).isEqualTo(1);
        }
        assertThat(count()).isEqualTo(1);assertThat(application.monthlyPending(first)).isEqualTo(part);assertThat(marker()).isTrue();
        var saved=ADMIN.queryForList("SELECT origin_month FROM monthly_surplus.month_records WHERE user_id=?",LocalDate.class,first);
        assertThat(saved).hasSize(1);assertThat(saved.getFirst()).isIn(OCT,OCT.plusMonths(1));
    }
    @ParameterizedTest @CsvSource({"100,100", "100,101", "0,0"})
    void ersterBudgetierterNullmonatSetztDenDauerhaftenMarker(long budgetCents,long expensesCents) {
        activated(); budget(first,"2026-10-01",budgetCents);
        if(expensesCents>0)expense(first,"2026-10-01",expensesCents);
        assertThat(marker()).isFalse();assertThat(count()).isZero();
        assertThat(application.closeMonthlySurplusMonth(first,OCT)).isTrue();
        assertThat(count()).isEqualTo(1);
        assertThat(ADMIN.queryForObject("SELECT surplus_cents FROM monthly_surplus.month_records WHERE user_id=? AND origin_month=?",Long.class,first,OCT)).isZero();
        assertThat(application.monthlyPending(first)).isZero();assertThat(marker()).isTrue();
        assertThatThrownBy(()->ADMIN.execute("SELECT api_version.set_retirement(false,gen_random_uuid(),repeat('a',64),repeat('a',64),repeat('a',64))")).isInstanceOf(org.springframework.dao.DataAccessException.class);
        assertThat(ADMIN.queryForObject("SELECT v1_retired AND monthly_effects_used FROM api_version.state",Boolean.class)).isTrue();
    }
    @Test void konkurrierendeAbschluesseHabenGenauEineWirkung() throws Exception {
        activated(); budget(first,"2026-10-01",10000);
        try(var pool=Executors.newVirtualThreadPerTaskExecutor()) {
            var tasks=new ArrayList<Future<Boolean>>(); for(int i=0;i<12;i++)tasks.add(pool.submit(()->application.closeMonthlySurplusMonth(first,OCT)));
            int created=0;for(var task:tasks)if(task.get(10,TimeUnit.SECONDS))created++;
            assertThat(created).isEqualTo(1);
        }
        assertThat(count()).isEqualTo(1); assertThat(application.monthlyPending(first)).isEqualTo(10000);
    }
    @Test void rlsFilterEindeutigkeitMinimaleRechteUndKontextbereinigung() throws Exception {
        activated(); budget(first,"2026-10-01",10000); application.closeMonthlySurplusMonth(first,OCT);
        assertThat(transactions.<Boolean>read(second,ctx->records.exists(first,OCT))).isFalse();
        assertThat(transactions.<java.math.BigDecimal>read(second,ctx->records.pending(first))).isEqualByComparingTo("0");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM monthly_surplus.month_records",Integer.class)).isZero();
        assertThatThrownBy(()->transactions.mutate(second,ctx->{records.insert(first,OCT.plusMonths(1),1L);return null;})).isInstanceOf(org.springframework.dao.DataAccessException.class);
        assertThatThrownBy(()->transactions.mutate(first,ctx->{records.insert(first,OCT,1L);return null;})).isInstanceOf(org.springframework.dao.DuplicateKeyException.class);
        for(String sql:List.of("UPDATE monthly_surplus.month_records SET surplus_cents=1","UPDATE monthly_surplus.month_records SET user_id=gen_random_uuid()","DELETE FROM monthly_surplus.month_records","TRUNCATE monthly_surplus.month_records"))
            assertThatThrownBy(()->transactions.mutate(first,ctx->{jdbc.execute(sql);return null;})).isInstanceOf(org.springframework.dao.DataAccessException.class);
        for(String month:List.of("2026-10-02","0001-01-02"))assertThatThrownBy(()->transactions.mutate(first,ctx->{records.insert(first,LocalDate.parse(month),1L);return null;})).isInstanceOf(org.springframework.dao.DataAccessException.class);
        for(long amount:new long[]{-1,de.linus.tnbp.shared.Money.MAX_CENTS+1})assertThatThrownBy(()->transactions.mutate(first,ctx->{records.insert(first,OCT.plusMonths(1),amount);return null;})).isInstanceOf(org.springframework.dao.DataAccessException.class);
        var escaped=new java.util.concurrent.atomic.AtomicReference<de.linus.tnbp.shared.FinanceContext>();
        transactions.read(first,ctx->{escaped.set(ctx);return monthly.pending(ctx);});
        assertThatThrownBy(()->monthly.pending(escaped.get())).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(()->transactions.read(first,ctx->monthly.closeMonth(ctx,OCT.plusMonths(1),1L,0))).isInstanceOf(IllegalStateException.class);
        try(var connection=source.getConnection();var statement=connection.createStatement();var result=statement.executeQuery("SELECT NULLIF(current_setting('app.user_id',true),'') IS NULL, (SELECT count(*) FROM monthly_surplus.month_records)")) {
            result.next(); assertThat(result.getBoolean(1)).isTrue(); assertThat(result.getInt(2)).isZero();
        }
    }
    @Test void echterCommitfehlerUndFehlerVorCommitNehmenNachweisUndNutzungsmarkerZurueck() {
        activated(); budget(first,"2026-10-01",10000);
        assertThatThrownBy(()->transactions.mutate(first,ctx->{monthly.closeMonth(ctx,OCT,10000L,0);versions.markMonthlyEffect(ctx);throw new IllegalStateException();})).isInstanceOf(IllegalStateException.class);
        assertThat(count()).isZero(); assertThat(marker()).isFalse();
        ADMIN.execute("CREATE FUNCTION monthly_surplus.reject_pending_commit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetisch'; END $$; CREATE CONSTRAINT TRIGGER reject_pending_commit AFTER INSERT ON monthly_surplus.month_records DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION monthly_surplus.reject_pending_commit()");
        try {
            assertThatThrownBy(()->application.closeMonthlySurplusMonth(first,OCT)).isInstanceOf(RuntimeException.class);
            assertThat(count()).isZero(); assertThat(marker()).isFalse(); assertThat(application.monthlyPending(first)).isZero();
        } finally {ADMIN.execute("DROP TRIGGER reject_pending_commit ON monthly_surplus.month_records; DROP FUNCTION monthly_surplus.reject_pending_commit()");}
        assertThat(application.closeMonthlySurplusMonth(first,OCT)).isTrue(); assertThat(marker()).isTrue();
    }
    @Test void einZeitpunktUndQuellenErstNachSperreAuchUeberMonatswechsel() throws Exception {
        application.activateMonthlyAutomation(first); budget(first,"2026-10-01",10000); CLOCK.calls.set(0);
        try(var blocker=ADMIN.getDataSource().getConnection();var pool=Executors.newVirtualThreadPerTaskExecutor()) {
            blocker.setAutoCommit(false);
            try(var statement=blocker.prepareStatement("SELECT pg_advisory_xact_lock(hashtextextended(?,14))")){statement.setString(1,first.toString());statement.execute();}
            var work=pool.submit(()->application.closeMonthlySurplusMonth(first,OCT));
            long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(5);
            while(!Boolean.TRUE.equals(ADMIN.queryForObject("SELECT EXISTS(SELECT FROM pg_stat_activity WHERE wait_event='advisory' AND query LIKE '%pg_advisory_xact_lock%')",Boolean.class))&&System.nanoTime()<deadline)Thread.sleep(10);
            assertThat(work.isDone()).isFalse();assertThat(CLOCK.calls.get()).isZero();
            try(var statement=blocker.prepareStatement("UPDATE budget.budgets SET amount_cents=20000 WHERE user_id=?")){statement.setObject(1,first);statement.executeUpdate();}
            CLOCK.now=Instant.parse("2026-10-31T23:00:00Z");blocker.commit();
            assertThat(work.get(5,TimeUnit.SECONDS)).isTrue();assertThat(CLOCK.calls.get()).isEqualTo(1);
        }
        assertThat(application.monthlyPending(first)).isEqualTo(20000);
    }
    @Test void sommerzeitUndWinterzeitVerwendenDenGemeinsamenBerlinerKalender() {
        for(String boundary:List.of("2027-03-31T22:00:00Z","2027-10-31T23:00:00Z")) {
            Instant instant=Instant.parse(boundary);LocalDate month=instant.atZone(ZoneId.of("Europe/Berlin")).toLocalDate().withDayOfMonth(1).minusMonths(1);
            CLOCK.now=instant.minusSeconds(1); application.activateMonthlyAutomation(first);
            assertThat(application.closeMonthlySurplusMonth(first,month)).isFalse();
            CLOCK.now=instant;assertThat(application.closeMonthlySurplusMonth(first,month)).isTrue();
        }
    }
    @Test void projektionenNachweisUndMarkerNutzenDieselbePhysischeTransaktion() {
        activated(); budget(first,"2026-10-01",10000);expense(first,"2026-10-01",1000);
        ADMIN.execute("CREATE TABLE public.pending_probe (pid integer, tx bigint, account text); GRANT INSERT ON public.pending_probe TO tnbp_runtime,tnbp_migrator");
        ADMIN.execute("CREATE FUNCTION public.pending_probe() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN INSERT INTO public.pending_probe VALUES (pg_backend_pid(),txid_current(),current_setting('app.user_id')); RETURN NEW; END $$");
        ADMIN.execute("CREATE TRIGGER pending_probe AFTER INSERT ON monthly_surplus.month_records FOR EACH ROW EXECUTE FUNCTION public.pending_probe(); CREATE TRIGGER pending_probe AFTER UPDATE ON api_version.state FOR EACH ROW EXECUTE FUNCTION public.pending_probe()");
        var budgetSpy=org.mockito.Mockito.spy(applicationBudgets());
        var expenseSpy=org.mockito.Mockito.spy(applicationExpenses());
        var snapshots=new ArrayList<Map<String,Object>>();
        org.mockito.Mockito.doAnswer(invocation->{snapshots.add(jdbc.queryForMap("SELECT pg_backend_pid() AS pid,txid_current() AS tx,current_setting('app.user_id') AS account"));return invocation.callRealMethod();})
            .when(budgetSpy).current(org.mockito.ArgumentMatchers.any(),org.mockito.ArgumentMatchers.any());
        org.mockito.Mockito.doAnswer(invocation->{snapshots.add(jdbc.queryForMap("SELECT pg_backend_pid() AS pid,txid_current() AS tx,current_setting('app.user_id') AS account"));return invocation.callRealMethod();})
            .when(expenseSpy).monthTotal(org.mockito.ArgumentMatchers.any(),org.mockito.ArgumentMatchers.any());
        var coordinated=new FinanceApplication(transactions,expenseSpy,budgetSpy,applicationGoals(),versions,monthly,READY);
        try {
            assertThat(coordinated.closeMonthlySurplusMonth(first,OCT)).isTrue();
            snapshots.addAll(ADMIN.queryForList("SELECT * FROM public.pending_probe"));
            assertThat(snapshots).hasSize(4);
            for(String field:List.of("pid","tx","account"))assertThat(snapshots.stream().map(row->row.get(field)).distinct().toList()).hasSize(1);
            assertThat(snapshots.getFirst().get("account")).isEqualTo(first.toString());
        } finally { ADMIN.execute("DROP TRIGGER pending_probe ON monthly_surplus.month_records; DROP TRIGGER pending_probe ON api_version.state; DROP FUNCTION public.pending_probe(); DROP TABLE public.pending_probe"); }
    }
    @Autowired de.linus.tnbp.budget.Budgets budgetModule;
    @Autowired de.linus.tnbp.expenses.Expenses expenseModule;
    @Autowired de.linus.tnbp.savingsgoals.SavingsGoals goalModule;
    de.linus.tnbp.budget.Budgets applicationBudgets() { return budgetModule; }
    de.linus.tnbp.expenses.Expenses applicationExpenses() { return expenseModule; }
    de.linus.tnbp.savingsgoals.SavingsGoals applicationGoals() { return goalModule; }
    @Test void geschlossenesGesamtgateUndVeralteterVersionsbelegVerhindernJedenAbschluss() {
        activated(); budget(first,"2026-10-01",10000);READY.open=false;
        assertThatThrownBy(()->application.closeMonthlySurplusMonth(first,OCT)).isInstanceOf(FinanceApplication.FeatureNotAvailable.class);
        READY.open=true;
        Object hash=ADMIN.queryForObject("SELECT roles_sha256 FROM api_version.state",Object.class);
        try {
            ADMIN.execute("UPDATE api_version.state SET roles_sha256=repeat('b',64)");
            assertThatThrownBy(()->application.closeMonthlySurplusMonth(first,OCT)).isInstanceOf(FinanceApplication.FeatureNotAvailable.class);
            assertThat(count()).isZero();assertThat(marker()).isFalse();
        } finally {ADMIN.update("UPDATE api_version.state SET roles_sha256=?",hash);}
    }
}
