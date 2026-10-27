package de.linus.tnbp.expensebudget;

import static org.assertj.core.api.Assertions.*;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.*;
import de.linus.tnbp.access.PostgresFixture;
import de.linus.tnbp.finance.FinanceApplication;
import de.linus.tnbp.shared.Money;
import de.linus.tnbp.expenses.Expenses;
import java.net.URI;
import java.net.http.*;
import java.sql.Connection;
import java.time.*;
import java.util.*;
import javax.sql.DataSource;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import tools.jackson.databind.json.JsonMapper;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ExtendWith(OutputCaptureExtension.class)
class MonthSummaryIT {
    static final Instant NOW = Instant.parse("2026-10-23T10:00:00Z");
    static final byte[] KEY = new byte[32];
    static final MutableClock CLOCK = new MutableClock(NOW);
    static final JsonMapper JSON = JsonMapper.builder().build();
    static final String PATH = "/api/v1/expense-budget/month-summary";
    @LocalServerPort int port;
    @Autowired DataSource source;
    @Autowired JdbcTemplate jdbc;
    @Autowired FinanceApplication service;
    UUID first, second;

    @DynamicPropertySource static void properties(DynamicPropertyRegistry registry) {
        PostgresFixture.configure((key, value) -> registry.add(key, () -> value));
        registry.add("access.session.signing-key", () -> Base64.getEncoder().encodeToString(KEY));
        registry.add("access.session.issuer", () -> "summary-test");
        registry.add("access.session.audience", () -> "summary-spa");
        registry.add("access.session.origin", () -> "https://localhost:4200");
    }
    @TestConfiguration static class Time {
        @Bean @Primary Clock summaryClock() { return CLOCK; }
    }
    static final class MutableClock extends Clock {
        volatile Instant now;
        MutableClock(Instant now) { this.now = now; }
        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return Clock.fixed(now, zone); }
        @Override public Instant instant() { return now; }
    }
    @BeforeEach void reset() {
        PostgresFixture.ADMIN.execute("TRUNCATE access.accounts CASCADE");
        CLOCK.now = NOW;
        first = UUID.randomUUID(); second = UUID.randomUUID();
        for (UUID user : List.of(first, second)) PostgresFixture.ADMIN.update(
            "INSERT INTO access.accounts VALUES (?, ?, ?, ?)", user, user + "@example.org", "$argon2id$synthetic", NOW.atOffset(ZoneOffset.UTC));
    }
    String token(UUID user) throws Exception {
        return sign(new JWTClaimsSet.Builder().issuer("summary-test").audience("summary-spa").subject(user.toString())
            .issueTime(Date.from(CLOCK.now)).notBeforeTime(Date.from(CLOCK.now)).expirationTime(Date.from(CLOCK.now.plusSeconds(600))).build(), KEY);
    }
    String sign(JWTClaimsSet claims, byte[] key) throws Exception {
        var jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
        jwt.sign(new MACSigner(key)); return jwt.serialize();
    }
    HttpResponse<String> call(String method, String body, String bearer) throws Exception {
        return call(method, body, bearer, "");
    }
    HttpResponse<String> call(String method, String body, String bearer, String query) throws Exception {
        var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + PATH + query));
        if (bearer != null) request.header("Authorization", "Bearer " + bearer);
        if (body != null) request.header("Content-Type", "application/json");
        // Ein fremder Eigentümerheader wird niemals zur Autorisierung verwendet.
        request.header("X-User-Id", second.toString());
        var response = HttpClient.newHttpClient().send(request.method(method, body == null ? HttpRequest.BodyPublishers.noBody()
            : HttpRequest.BodyPublishers.ofString(body)).build(), HttpResponse.BodyHandlers.ofString());
        assertThat(response.headers().firstValue("Cache-Control")).hasValue("no-store");
        return response;
    }
    void budget(UUID user, String month, long cents) {
        PostgresFixture.ADMIN.update("INSERT INTO budget.budgets VALUES (?, ?::date, ?)", user, month, cents);
    }
    void expense(UUID user, String date, long cents) {
        PostgresFixture.ADMIN.update("INSERT INTO expenses.expenses VALUES (?, ?, 'Synthetisch', ?, ?::date)", UUID.randomUUID(), user, cents, date);
    }
    void summary(Long budget, long expenses, Long remaining, String month) throws Exception {
        var response = call("GET", null, token(first), "?userId=" + second);
        assertThat(response.statusCode()).isEqualTo(200);
        var json = JSON.readTree(response.body());
        assertThat(json.get("month").asText()).isEqualTo(month);
        assertThat(json.get("expensesCents").asLong()).isEqualTo(expenses);
        if (budget == null) assertThat(json.get("budgetCents").isNull()).isTrue();
        else assertThat(json.get("budgetCents").asLong()).isEqualTo(budget);
        if (remaining == null) assertThat(json.get("remainingCents").isNull()).isTrue();
        else assertThat(json.get("remainingCents").asLong()).isEqualTo(remaining);
    }
    @Test void matrixUndKontentrennungGebenNurDenAktuellenBerlinMonatZurueck() throws Exception {
        summary(null, 0, null, "2026-10-01");
        budget(first, "2026-09-01", 10000); budget(first, "2026-11-01", 99999); budget(second, "2026-10-01", 99999);
        summary(10000L, 0, 10000L, "2026-10-01");
        expense(first, "2026-09-30", 77777); expense(first, "2026-11-01", 55555); expense(second, "2026-10-23", 99999);
        expense(first, "2026-10-01", 1234);
        summary(10000L, 1234, 8766L, "2026-10-01");
        budget(first, "2026-10-01", 0);
        summary(0L, 1234, -1234L, "2026-10-01");
        CLOCK.now = Instant.parse("2026-10-31T22:59:59Z"); summary(0L, 1234, -1234L, "2026-10-01");
        CLOCK.now = Instant.parse("2026-10-31T23:00:00Z"); summary(99999L, 55555, 44444L, "2026-11-01");
        CLOCK.now = Instant.parse("2026-12-31T23:00:00Z"); summary(99999L, 0, 99999L, "2027-01-01");
    }
    @Test void nullbudgetUndCentgrenzenBleibenExaktUndUngueltigeSummenScheiternSicher(CapturedOutput output) throws Exception {
        budget(first, "2026-10-01", 0);
        summary(0L, 0, 0L, "2026-10-01");
        expense(first, "2026-10-23", Money.MAX_CENTS);
        summary(0L, Money.MAX_CENTS, -Money.MAX_CENTS, "2026-10-01");
        expense(first, "2026-10-23", 1);
        var rejected = call("GET", null, token(first));
        assertThat(rejected.statusCode()).isEqualTo(500);
        assertThat(rejected.body()).contains("MONTH_SUMMARY_UNAVAILABLE").doesNotContain(first.toString(), "9007199254740991", "SELECT");
        assertThat(output.getAll()).doesNotContain("9007199254740991", "SELECT amount_cents");
    }
    @Test void jwtUndCookiesKoennenKeineFremdeOderUngepruefteIdentitaetEinbringen() throws Exception {
        var claims = SignedJWT.parse(token(first)).getJWTClaimsSet();
        byte[] wrongKey = KEY.clone(); wrongKey[0] = 1;
        for (String bearer : Arrays.asList(null, "ungueltig", sign(claims, wrongKey),
                sign(new JWTClaimsSet.Builder(claims).issuer("fremd").build(), KEY),
                sign(new JWTClaimsSet.Builder(claims).audience("fremd").build(), KEY),
                sign(new JWTClaimsSet.Builder(claims).subject("1-1-1-1-1").build(), KEY),
                sign(new JWTClaimsSet.Builder(claims).expirationTime(Date.from(CLOCK.now)).build(), KEY))) {
            var result = call("GET", null, bearer);
            assertThat(result.statusCode()).isEqualTo(401);
            assertThat(result.body()).doesNotContain("budgetCents", first.toString());
        }
        var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + PATH))
            .header("Cookie", "__Host-tnbp-refresh=synthetisch; __Host-tnbp-csrf=synthetisch").GET().build();
        assertThat(HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(401);
    }
    @Test void rlsVerweigertFehlendenUndFalschenKontextAufBeidenProjektionen() {
        budget(first, "2026-10-01", 10000); expense(first, "2026-10-23", 1234);
        var runtime = new JdbcTemplate(new DriverManagerDataSource(PostgresFixture.URL, "tnbp_runtime", "runtime-test-only"));
        for (String table : List.of("budget.budgets", "expenses.expenses")) {
            assertThat(runtime.queryForObject("SELECT count(*) FROM " + table, Integer.class)).isZero();
            var tx = new org.springframework.transaction.support.TransactionTemplate(new org.springframework.jdbc.datasource.DataSourceTransactionManager(runtime.getDataSource()));
            tx.executeWithoutResult(status -> {
                runtime.queryForObject("SELECT set_config('app.user_id', ?, true)", String.class, second.toString());
                assertThat(runtime.queryForObject("SELECT count(*) FROM " + table + " WHERE user_id = ?", Integer.class, first)).isZero();
            });
            assertThat(PostgresFixture.ADMIN.queryForObject("SELECT relrowsecurity AND relforcerowsecurity FROM pg_class WHERE oid = ?::regclass", Boolean.class, table)).isTrue();
        }
        service.currentSummary(first);
        assertThat(runtime.queryForObject("SELECT count(*) FROM budget.budgets", Integer.class)).isZero();
        assertThat(runtime.queryForObject("SELECT rolsuper OR rolbypassrls FROM pg_roles WHERE rolname = current_user", Boolean.class)).isFalse();
    }
    @Test void parallelerCommitZwischenTeilabfragenErgibtKeinenGemischtenDatenstand() throws Exception {
        budget(first, "2026-10-01", 10000); expense(first, "2026-10-23", 1234);
        // Eine restriktive Testpolicy hält die Budget-Teilabfrage an, nachdem der Statement-Snapshot feststeht.
        PostgresFixture.ADMIN.execute("CREATE FUNCTION budget.wait_summary() RETURNS boolean LANGUAGE plpgsql VOLATILE AS $$ BEGIN PERFORM pg_advisory_xact_lock(150015); RETURN true; END $$");
        PostgresFixture.ADMIN.execute("CREATE POLICY summary_barrier ON budget.budgets AS RESTRICTIVE FOR SELECT TO tnbp_runtime USING (budget.wait_summary())");
        try (var executor = java.util.concurrent.Executors.newSingleThreadExecutor()) {
            try (Connection lock = PostgresFixture.ADMIN.getDataSource().getConnection()) {
                lock.setAutoCommit(false);
                try (var st = lock.createStatement()) { st.execute("SELECT pg_advisory_xact_lock(150015)"); }
                String bearer = token(first);
                var pending = executor.submit(() -> call("GET", null, bearer));
                boolean waiting = false;
                long deadline = System.nanoTime() + java.util.concurrent.TimeUnit.SECONDS.toNanos(5);
                while (!waiting && System.nanoTime() < deadline) {
                    waiting = Boolean.TRUE.equals(PostgresFixture.ADMIN.queryForObject("SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE wait_event = 'advisory')", Boolean.class));
                    if (!waiting) Thread.sleep(10);
                }
                assertThat(waiting).isTrue();
                try (Connection writer = PostgresFixture.ADMIN.getDataSource().getConnection()) {
                    writer.setAutoCommit(false);
                    try (var st = writer.prepareStatement("UPDATE budget.budgets SET amount_cents = 20000 WHERE user_id = ?")) { st.setObject(1, first); st.executeUpdate(); }
                    try (var st = writer.prepareStatement("UPDATE expenses.expenses SET amount_cents = 4321 WHERE user_id = ?")) { st.setObject(1, first); st.executeUpdate(); }
                    writer.commit();
                }
                lock.commit();
                var result = JSON.readTree(pending.get(10, java.util.concurrent.TimeUnit.SECONDS).body());
                assertThat(result.get("budgetCents").asLong()).isEqualTo(10000);
                assertThat(result.get("expensesCents").asLong()).isEqualTo(1234);
                assertThat(result.get("remainingCents").asLong()).isEqualTo(8766);
            }
        } finally {
            PostgresFixture.ADMIN.execute("DROP POLICY summary_barrier ON budget.budgets");
            PostgresFixture.ADMIN.execute("DROP FUNCTION budget.wait_summary()");
        }
        summary(20000L, 4321, 15679L, "2026-10-01");
    }
}
