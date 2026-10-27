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
class BudgetIT {
    static final Instant NOW = Instant.parse("2026-10-23T10:00:00Z");
    static final byte[] KEY = new byte[32];
    static final MutableClock CLOCK = new MutableClock(NOW);
    static final JsonMapper JSON = JsonMapper.builder().build();
    static final String PATH = "/api/v1/expense-budget/budget";
    @LocalServerPort int port;
    @Autowired DataSource source;
    @Autowired JdbcTemplate jdbc;
    @Autowired FinanceApplication service;
    UUID first, second;

    @DynamicPropertySource static void properties(DynamicPropertyRegistry registry) {
        PostgresFixture.configure((key, value) -> registry.add(key, () -> value));
        registry.add("access.session.signing-key", () -> Base64.getEncoder().encodeToString(KEY));
        registry.add("access.session.issuer", () -> "budget-test");
        registry.add("access.session.audience", () -> "budget-spa");
        registry.add("access.session.origin", () -> "https://localhost:4200");
    }
    @TestConfiguration static class Time {
        @Bean @Primary Clock budgetClock() { return CLOCK; }
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
        return sign(new JWTClaimsSet.Builder().issuer("budget-test").audience("budget-spa").subject(user.toString())
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
    long amount(HttpResponse<String> result) { return JSON.readTree(result.body()).get("amountCents").asLong(); }
    HttpResponse<String> save(UUID user, long cents) throws Exception { return call("PUT", "{\"amountCents\":" + cents + "}", token(user)); }

    @Test void fehlendesBudgetNullbudgetMaximumUndAendernSindUnterscheidbar() throws Exception {
        var empty = call("GET", null, token(first));
        assertThat(empty.statusCode()).isEqualTo(200); assertThat(empty.body()).isEqualTo("{\"amountCents\":null}");
        for (long cents : new long[] {0, 9007199254740991L, 123456}) {
            var saved = save(first, cents);
            assertThat(saved.statusCode()).isEqualTo(200); assertThat(amount(saved)).isEqualTo(cents);
            assertThat(amount(call("GET", null, token(first)))).isEqualTo(cents);
        }
        assertThat(PostgresFixture.ADMIN.queryForObject("SELECT count(*) FROM budget.budgets", Integer.class)).isEqualTo(1);
    }

    @Test void jsonTypenFehlendeWerteNegativUndUeberlaufWerdenOhneRundungAbgelehnt() throws Exception {
        assertThat(save(first, 7654).statusCode()).isEqualTo(200);
        for (String body : List.of("{}", "{\"amountCents\":null}", "{\"amountCents\":-1}", "{\"amountCents\":9007199254740992}",
                "{\"amountCents\":9223372036854775808}", "{\"amountCents\":1.01}", "{\"amountCents\":1.0}", "{\"amountCents\":1e2}",
                "{\"amountCents\":\"100\"}", "{\"amountCents\":true}", "{\"amountCents\":[]}", "{\"amountCents\":{}}", "{", "null")) {
            var rejected = call("PUT", body, token(first));
            assertThat(rejected.statusCode()).as(body).isEqualTo(400);
            assertThat(JSON.readTree(rejected.body()).path("fieldErrors").has("amountCents")).isTrue();
            assertThat(amount(call("GET", null, token(first)))).isEqualTo(7654);
        }
    }

    @Test void zweiKontenUndManipulierteEigentuemerangabenGebenKeineFremdenWertePreis() throws Exception {
        save(first, 12345);
        assertThat(call("GET", null, token(second), "?userId=" + first).body()).isEqualTo("{\"amountCents\":null}");
        assertThat(call("PUT", "{\"amountCents\":55,\"userId\":\"" + first + "\"}", token(second)).statusCode()).isEqualTo(400);
        assertThat(call("PUT", "{\"amountCents\":55,\"user_id\":\"" + first + "\"}", token(second)).statusCode()).isEqualTo(400);
        assertThat(save(second, 54321).statusCode()).isEqualTo(200);
        assertThat(amount(call("GET", null, token(first), "?userId=" + second))).isEqualTo(12345);
        assertThat(amount(call("GET", null, token(second)))).isEqualTo(54321);
    }

    @Test void budgetGiltFortlaufendUndAenderungenBewahrenFruehereBerlinMonate() throws Exception {
        CLOCK.now = Instant.parse("2026-10-31T22:59:59Z");
        save(first, 100);
        CLOCK.now = Instant.parse("2026-10-31T23:00:00Z");
        assertThat(amount(call("GET", null, token(first)))).isEqualTo(100);
        save(first, 200); save(first, 300);
        assertThat(PostgresFixture.ADMIN.queryForList("SELECT valid_from::text, amount_cents FROM budget.budgets ORDER BY valid_from"))
            .containsExactly(Map.of("valid_from", "2026-10-01", "amount_cents", 100L), Map.of("valid_from", "2026-11-01", "amount_cents", 300L));
        CLOCK.now = Instant.parse("2026-12-31T23:00:00Z");
        assertThat(amount(call("GET", null, token(first)))).isEqualTo(300);
        save(first, 400);
        CLOCK.now = Instant.parse("2026-10-31T22:59:59Z");
        assertThat(amount(call("GET", null, token(first)))).isEqualTo(100);
    }

    @Test void fehlendeAbgelaufeneUndManipulierteJwtErlaubenKeineFinanzzugriffe() throws Exception {
        save(first, 100);
        String valid = token(first);
        var original = SignedJWT.parse(valid).getJWTClaimsSet();
        byte[] wrongKey = KEY.clone(); wrongKey[0] = 1;
        var tokens = new ArrayList<String>(Arrays.asList(null, "ungueltig", valid.substring(0, valid.length() - 4) + "xxxx",
            sign(original, wrongKey), sign(new JWTClaimsSet.Builder(original).issuer("fremd").build(), KEY),
            sign(new JWTClaimsSet.Builder(original).audience("fremd").build(), KEY),
            sign(new JWTClaimsSet.Builder(original).subject("1-1-1-1-1").build(), KEY),
            sign(new JWTClaimsSet.Builder(original).expirationTime(Date.from(CLOCK.now)).build(), KEY)));
        for (String bearer : tokens) {
            for (String method : List.of("GET", "PUT")) {
                var rejected = call(method, method.equals("PUT") ? "{\"amountCents\":1}" : null, bearer);
                assertThat(rejected.statusCode()).isEqualTo(401); assertThat(rejected.body()).doesNotContain("amountCents", first.toString());
            }
        }
        assertThat(amount(call("GET", null, valid))).isEqualTo(100);
    }

    @Test void cookieAlleinErteiltKeinenBudgetzugangUndBearerPutBenoetigtKeinCookieCsrf() throws Exception {
        var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + PATH))
            .header("Cookie", "__Host-tnbp-refresh=synthetisch; __Host-tnbp-csrf=synthetisch")
            .header("Content-Type", "application/json").PUT(HttpRequest.BodyPublishers.ofString("{\"amountCents\":10}")).build();
        assertThat(HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(401);
        assertThat(save(first, 10).statusCode()).isEqualTo(200);
    }

    @Test void commitFehlerBestaetigtKeineSpeicherungUndVeraendertKeinenBestand(CapturedOutput output) throws Exception {
        save(first, 12345);
        PostgresFixture.ADMIN.execute("CREATE FUNCTION budget.reject_budget_commit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'GeheimerBudgetfehler'; RETURN NEW; END $$");
        PostgresFixture.ADMIN.execute("CREATE CONSTRAINT TRIGGER reject_budget_commit AFTER INSERT OR UPDATE ON budget.budgets DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION budget.reject_budget_commit()");
        try {
            var result = save(first, 8912345678901234L);
            assertThat(result.statusCode()).isEqualTo(500);
            assertThat(result.body()).contains("BUDGET_UNAVAILABLE").doesNotContain("GeheimerBudgetfehler", "8912345678901234");
            assertThat(amount(call("GET", null, token(first)))).isEqualTo(12345);
        } finally {
            PostgresFixture.ADMIN.execute("DROP TRIGGER reject_budget_commit ON budget.budgets");
            PostgresFixture.ADMIN.execute("DROP FUNCTION budget.reject_budget_commit()");
        }
        assertThat(output.getAll()).contains("Budgetanfrage fehlgeschlagen; Fehlerkategorie=DATENBANK")
            .doesNotContain("GeheimerBudgetfehler", "8912345678901234", "amount_cents =", "INSERT INTO expense_budget");
        assertThat(save(first, 6789).statusCode()).isEqualTo(200);
    }

    @Test void rlsVerweigertFehlendenUndFalschenKontextUndLaeuftAmTransaktionsendeAus() throws Exception {
        save(first, 123);
        var runtimeSource = new DriverManagerDataSource(PostgresFixture.URL, "tnbp_runtime", "runtime-test-only");
        try (Connection connection = runtimeSource.getConnection()) {
            assertThat(count(connection)).isZero();
            assertThat(updateAmount(connection, first, 456)).isZero();
            assertThat(PostgresFixture.ADMIN.queryForObject("SELECT amount_cents FROM budget.budgets", Long.class)).isEqualTo(123);
            connection.setAutoCommit(false);
            context(connection, second);
            assertThat(count(connection)).isZero();
            assertThat(updateAmount(connection, first, 456)).isZero();
            assertThat(PostgresFixture.ADMIN.queryForObject("SELECT amount_cents FROM budget.budgets", Long.class)).isEqualTo(123);
            try (var statement = connection.prepareStatement("INSERT INTO budget.budgets VALUES (?, DATE '2026-10-01', 1)")) {
                statement.setObject(1, first);
                assertThatThrownBy(statement::executeUpdate).isInstanceOf(java.sql.SQLException.class);
            }
            connection.rollback();
            assertThat(count(connection)).isZero();
            context(connection, first);
            assertThat(count(connection)).isEqualTo(1);
            assertThat(updateAmount(connection, first, 456)).isEqualTo(1);
            connection.commit();
            assertThat(PostgresFixture.ADMIN.queryForObject("SELECT amount_cents FROM budget.budgets", Long.class)).isEqualTo(456);
            assertThat(count(connection)).isZero();
            context(connection, first);
            assertThat(count(connection)).isEqualTo(1);
            connection.rollback();
            assertThat(count(connection)).isZero();
            connection.rollback();
        }
        service.currentBudget(first); service.saveBudget(second, 10L);
        // Prüft alle Poolverbindungen nach echten Anwendungs-Transaktionen, ohne neuen Kontext.
        var connections = new ArrayList<Connection>();
        try {
            for (int i = 0; i < 8; i++) connections.add(source.getConnection());
            for (var connection : connections) assertThat(count(connection)).isZero();
        } finally { for (var connection : connections) connection.close(); }
    }
    int updateAmount(Connection connection, UUID user, long amount) throws Exception {
        try (var statement = connection.prepareStatement("UPDATE budget.budgets SET amount_cents = ? WHERE user_id = ?")) {
            statement.setLong(1, amount); statement.setObject(2, user); return statement.executeUpdate();
        }
    }
    long count(Connection connection) throws Exception {
        try (var statement = connection.createStatement(); var result = statement.executeQuery("SELECT count(*) FROM budget.budgets")) {
            result.next(); return result.getLong(1);
        }
    }
    void context(Connection connection, UUID user) throws Exception {
        try (var statement = connection.prepareStatement("SELECT set_config('app.user_id', ?, true)")) {
            statement.setString(1, user.toString()); statement.execute();
        }
    }

    @Test void minimaleRechteForceRlsUndDatenbankConstraintsSindWirksam() {
        var runtime = new JdbcTemplate(new DriverManagerDataSource(PostgresFixture.URL, "tnbp_runtime", "runtime-test-only"));
        assertThat(PostgresFixture.ADMIN.queryForObject("SELECT relrowsecurity AND relforcerowsecurity FROM pg_class WHERE oid = 'budget.budgets'::regclass", Boolean.class)).isTrue();
        assertThat(runtime.queryForObject("SELECT rolsuper OR rolbypassrls OR rolcreaterole OR rolcreatedb FROM pg_roles WHERE rolname = current_user", Boolean.class)).isFalse();
        assertThat(runtime.queryForObject("SELECT pg_has_role(current_user, relowner, 'MEMBER') FROM pg_class WHERE oid = 'budget.budgets'::regclass", Boolean.class)).isFalse();
        for (String sql : List.of("DELETE FROM budget.budgets", "UPDATE budget.budgets SET user_id = user_id",
                "UPDATE budget.budgets SET valid_from = valid_from", "ALTER TABLE budget.budgets DISABLE ROW LEVEL SECURITY",
                "CREATE TABLE budget.forbidden (id integer)", "INSERT INTO budget.budgets VALUES ('" + first + "', DATE '2026-10-01', 1)")) {
            assertThatThrownBy(() -> runtime.execute(sql)).isInstanceOf(DataAccessException.class);
        }
        for (String values : List.of("DATE '2026-10-01', -1", "DATE '2026-10-01', 9007199254740992", "DATE '2026-10-02', 1")) {
            assertThatThrownBy(() -> PostgresFixture.ADMIN.execute("INSERT INTO budget.budgets VALUES ('" + first + "', " + values + ")"))
                .isInstanceOf(DataAccessException.class);
        }
        assertThatThrownBy(() -> PostgresFixture.ADMIN.execute("INSERT INTO budget.budgets VALUES ('" + UUID.randomUUID() + "', DATE '2026-10-01', 1)"))
            .isInstanceOf(DataAccessException.class);
    }
}
