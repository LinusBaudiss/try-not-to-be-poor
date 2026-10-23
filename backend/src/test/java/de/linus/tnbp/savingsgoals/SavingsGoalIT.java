package de.linus.tnbp.savingsgoals;

import static org.assertj.core.api.Assertions.*;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.*;
import de.linus.tnbp.access.PostgresFixture;
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
class SavingsGoalIT {
    static final Instant NOW = Instant.parse("2026-10-23T10:00:00Z");
    static final byte[] KEY = new byte[32];
    static final MutableClock CLOCK = new MutableClock(NOW);
    static final JsonMapper JSON = JsonMapper.builder().build();
    static final String PATH = "/api/v1/savings-goals";
    @LocalServerPort int port;
    @Autowired DataSource source;
    @Autowired JdbcTemplate jdbc;
    @Autowired SavingsGoalService service;
    UUID first, second;

    @DynamicPropertySource static void properties(DynamicPropertyRegistry registry) {
        PostgresFixture.configure((key, value) -> registry.add(key, () -> value));
        registry.add("access.session.signing-key", () -> Base64.getEncoder().encodeToString(KEY));
        registry.add("access.session.issuer", () -> "savings-test");
        registry.add("access.session.audience", () -> "savings-spa");
        registry.add("access.session.origin", () -> "https://localhost:4200");
    }
    @TestConfiguration static class Time {
        @Bean @Primary Clock savingsClock() { return CLOCK; }
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
        return sign(new JWTClaimsSet.Builder().issuer("savings-test").audience("savings-spa").subject(user.toString())
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
    HttpResponse<String> save(UUID user, long cents) throws Exception {
        return call("POST", "{\"name\":\"  Reise 🧳  \",\"targetAmountCents\":" + cents + "}", token(user));
    }
    int count(UUID user) throws Exception { return JSON.readTree(call("GET", null, token(user)).body()).size(); }

    @Test void eigeneZieleWerdenGetrimmtMitNullFortschrittUndUnveraendertemDatumGespeichert() throws Exception {
        assertThat(call("GET", null, token(first)).body()).isEqualTo("[]");
        var created = call("POST", "{\"name\":\"  Reise 🧳  \",\"targetAmountCents\":9007199254740991,\"targetDate\":\"2000-02-29\"}", token(first));
        assertThat(created.statusCode()).isEqualTo(201);
        var goal = JSON.readTree(created.body());
        assertThat(UUID.fromString(goal.get("id").asText())).isNotNull();
        assertThat(goal.get("name").asText()).isEqualTo("Reise 🧳");
        assertThat(goal.get("targetAmountCents").asLong()).isEqualTo(9007199254740991L);
        assertThat(goal.get("progressCents").asLong()).isZero();
        assertThat(goal.get("targetDate").asText()).isEqualTo("2000-02-29");
        assertThat(save(first, 1).statusCode()).isEqualTo(201);
        assertThat(call("POST", "{\"name\":\"Ohne Datum\",\"targetAmountCents\":1,\"targetDate\":null}", token(first)).statusCode()).isEqualTo(201);
        assertThat(save(second, 987654).statusCode()).isEqualTo(201);
        var list = JSON.readTree(call("GET", null, token(first), "?userId=" + second).body());
        assertThat(list.size()).isEqualTo(3);
        for (int i = 1; i < list.size(); i++) assertThat(list.get(i - 1).get("id").asText()).isLessThan(list.get(i).get("id").asText());
        assertThat(count(second)).isEqualTo(1);
    }

    @Test void akzeptierteKalendergrenzenBleibenBeiAnlageUndAbrufUnveraendert() throws Exception {
        for (String date : List.of("0001-01-01", "9999-12-31")) {
            var created = call("POST", JSON.writeValueAsString(Map.of("name", "Datumsgrenze", "targetAmountCents", 1, "targetDate", date)), token(first));
            assertThat(created.statusCode()).as(date).isEqualTo(201);
            var goal = JSON.readTree(created.body());
            assertThat(goal.get("targetDate").asText()).isEqualTo(date);
            var list = JSON.readTree(call("GET", null, token(first)).body());
            assertThat(list).anySatisfy(saved -> {
                assertThat(saved.get("id").asText()).isEqualTo(goal.get("id").asText());
                assertThat(saved.get("targetDate").asText()).isEqualTo(date);
            });
        }
    }

    @Test void striktesJsonUndUngueltigeFelderErzeugenKeineMutation() throws Exception {
        for (String value : List.of("null", "0", "-1", "9007199254740992", "9223372036854775808", "1.01", "1.0", "1e2", "\"100\"", "true", "[]", "{}")) {
            var rejected = call("POST", "{\"name\":\"Reise\",\"targetAmountCents\":" + value + "}", token(first));
            assertThat(rejected.statusCode()).as(value).isEqualTo(400); fields(rejected, "targetAmountCents");
        }
        for (String value : List.of("null", "\"\"", "\"   \"", "\"\\u00a0\"", "\"Rei\\u0000se\"", "12", "1.5", "true", "[]", "{}")) {
            var rejected = call("POST", "{\"name\":" + value + ",\"targetAmountCents\":1}", token(first));
            assertThat(rejected.statusCode()).as(value).isEqualTo(400); fields(rejected, "name");
        }
        for (String value : List.of("\"2026-02-29\"", "\"1900-02-29\"", "\"2028-02-30\"", "\"2026-04-31\"", "\"2026-1-01\"", "\"2026-01-1\"", "\"2026-01-01T00:00:00Z\"", "\"0000-01-01\"", "\"+10000-01-01\"", "\"\"", "123", "[2028,2,29]", "true", "{}")) {
            var rejected = call("POST", "{\"name\":\"Reise\",\"targetAmountCents\":1,\"targetDate\":" + value + "}", token(first));
            assertThat(rejected.statusCode()).as(value).isEqualTo(400); fields(rejected, "targetDate");
        }
        for (String field : List.of("id", "userId", "user_id", "progressCents"))
            assertThat(call("POST", "{\"name\":\"Reise\",\"targetAmountCents\":1,\"" + field + "\":1}", token(first)).statusCode()).isEqualTo(400);
        for (String body : List.of("{}", "null", "{", "{\"name\":\"Reise\"}", "{\"targetAmountCents\":1}"))
            assertThat(call("POST", body, token(first)).statusCode()).isEqualTo(400);
        assertThat(count(first)).isZero(); assertThat(count(second)).isZero();
    }
    void fields(HttpResponse<String> response, String... expected) {
        var fields = JSON.readTree(response.body()).get("fieldErrors");
        assertThat(fields.size()).as(response.body()).isEqualTo(expected.length);
        for (String field : expected) assertThat(fields.has(field)).as(response.body()).isTrue();
    }

    @Test void beideRoutenPruefenJwtUndCookiesAlleinErteilenKeinenZugang() throws Exception {
        var claims = SignedJWT.parse(token(first)).getJWTClaimsSet();
        byte[] wrong = KEY.clone(); wrong[0] = 1;
        for (String bearer : Arrays.asList(null, "ungueltig", sign(claims, wrong),
            sign(new JWTClaimsSet.Builder(claims).issuer("fremd").build(), KEY),
            sign(new JWTClaimsSet.Builder(claims).audience("fremd").build(), KEY),
            sign(new JWTClaimsSet.Builder(claims).subject("1-1-1-1-1").build(), KEY),
            sign(new JWTClaimsSet.Builder(claims).expirationTime(Date.from(CLOCK.now)).build(), KEY)))
            for (String method : List.of("GET", "POST")) assertThat(call(method, method.equals("POST") ? "{\"name\":\"Reise\",\"targetAmountCents\":1}" : null, bearer).statusCode()).isEqualTo(401);
        var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + PATH)).header("Cookie", "__Host-tnbp-refresh=synthetisch")
            .header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString("{\"name\":\"Reise\",\"targetAmountCents\":1}")).build();
        var rejected = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
        assertThat(rejected.statusCode()).isEqualTo(401); assertThat(rejected.headers().firstValue("Cache-Control")).hasValue("no-store");
        assertThat(save(first, 1).statusCode()).isEqualTo(201);
    }

    @Test void commitFehlerBestaetigtNichtsUndEnthaeltKeineFinanzdaten(CapturedOutput output) throws Exception {
        save(first, 123);
        PostgresFixture.ADMIN.execute("CREATE FUNCTION savings_goals.reject_commit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'GeheimerZielfehler'; RETURN NEW; END $$");
        PostgresFixture.ADMIN.execute("CREATE CONSTRAINT TRIGGER reject_commit AFTER INSERT ON savings_goals.goals DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION savings_goals.reject_commit()");
        try {
            var rejected = save(first, 876543210);
            assertThat(rejected.statusCode()).isEqualTo(500);
            assertThat(rejected.body()).contains("SAVINGS_GOAL_UNAVAILABLE").doesNotContain("GeheimerZielfehler", "876543210", "Reise");
            assertThat(count(first)).isEqualTo(1);
        } finally {
            PostgresFixture.ADMIN.execute("DROP TRIGGER reject_commit ON savings_goals.goals");
            PostgresFixture.ADMIN.execute("DROP FUNCTION savings_goals.reject_commit()");
        }
        assertThat(output.getAll()).contains("Sparzielanfrage fehlgeschlagen; Fehlerkategorie=DATENBANK").doesNotContain("GeheimerZielfehler", "876543210");
    }

    @Test void rlsVerweigertFehlendenOderFremdenKontextUndKontextEndetMitTransaktion() throws Exception {
        save(first, 123);
        var runtime = new DriverManagerDataSource(PostgresFixture.URL, "tnbp_runtime", "runtime-test-only");
        try (Connection connection = runtime.getConnection()) {
            assertThat(count(connection)).isZero(); connection.setAutoCommit(false);
            context(connection, second); assertThat(count(connection)).isZero();
            try (var statement = connection.prepareStatement("INSERT INTO savings_goals.goals (id, user_id, name, target_amount_cents) VALUES (?, ?, 'Fremd', 1)")) {
                statement.setObject(1, UUID.randomUUID()); statement.setObject(2, first);
                assertThatThrownBy(statement::executeUpdate).isInstanceOf(java.sql.SQLException.class);
            }
            connection.rollback(); assertThat(count(connection)).isZero();
            context(connection, first); assertThat(count(connection)).isEqualTo(1);
            connection.commit(); assertThat(count(connection)).isZero();
            context(connection, first); assertThat(count(connection)).isEqualTo(1);
            connection.rollback(); assertThat(count(connection)).isZero();
        }
        service.all(first); service.save(second, "Zweitkonto", 1L, null);
        var connections = new ArrayList<Connection>();
        try {
            for (int i = 0; i < 8; i++) connections.add(source.getConnection());
            for (var connection : connections) assertThat(count(connection)).isZero();
        } finally { for (var connection : connections) connection.close(); }
    }
    long count(Connection connection) throws Exception {
        try (var statement = connection.createStatement(); var result = statement.executeQuery("SELECT count(*) FROM savings_goals.goals")) { result.next(); return result.getLong(1); }
    }
    void context(Connection connection, UUID user) throws Exception {
        try (var statement = connection.prepareStatement("SELECT set_config('app.user_id', ?, true)")) { statement.setString(1, user.toString()); statement.execute(); }
    }
    @Test void forceRlsMinimaleRechteUndConstraintsSindWirksam() {
        var runtime = new JdbcTemplate(new DriverManagerDataSource(PostgresFixture.URL, "tnbp_runtime", "runtime-test-only"));
        assertThat(PostgresFixture.ADMIN.queryForObject("SELECT relrowsecurity AND relforcerowsecurity FROM pg_class WHERE oid = 'savings_goals.goals'::regclass", Boolean.class)).isTrue();
        assertThat(runtime.queryForObject("SELECT rolsuper OR rolbypassrls OR rolcreaterole OR rolcreatedb FROM pg_roles WHERE rolname = current_user", Boolean.class)).isFalse();
        assertThat(runtime.queryForObject("SELECT pg_has_role(current_user, relowner, 'MEMBER') FROM pg_class WHERE oid = 'savings_goals.goals'::regclass", Boolean.class)).isFalse();
        for (String sql : List.of("DELETE FROM savings_goals.goals", "UPDATE savings_goals.goals SET name = name", "ALTER TABLE savings_goals.goals DISABLE ROW LEVEL SECURITY", "CREATE TABLE savings_goals.forbidden (id integer)",
            "INSERT INTO savings_goals.goals (id, user_id, name, target_amount_cents) VALUES ('" + UUID.randomUUID() + "', '" + first + "', 'Kontextlos', 1)"))
            assertThatThrownBy(() -> runtime.execute(sql)).isInstanceOf(DataAccessException.class);
        for (String name : List.of("", " ", "\t", "\n\r", "\u00a0", "\u1680", "\u2003", "\u2007", "\u2028", "\u2029", "\u202f", "\u205f", "\u3000", "\uFEFF"))
            assertThatThrownBy(() -> PostgresFixture.ADMIN.update("INSERT INTO savings_goals.goals (id, user_id, name, target_amount_cents) VALUES (?, ?, ?, 1)", UUID.randomUUID(), first, name)).isInstanceOf(DataAccessException.class);
        for (long value : new long[] {0, -1, 9007199254740992L}) assertThatThrownBy(() -> PostgresFixture.ADMIN.update("INSERT INTO savings_goals.goals (id, user_id, name, target_amount_cents) VALUES (?, ?, 'Ziel', ?)", UUID.randomUUID(), first, value)).isInstanceOf(DataAccessException.class);
        for (long value : new long[] {-1, 9007199254740992L}) assertThatThrownBy(() -> PostgresFixture.ADMIN.update("INSERT INTO savings_goals.goals (id, user_id, name, target_amount_cents, progress_cents) VALUES (?, ?, 'Ziel', 1, ?)", UUID.randomUUID(), first, value)).isInstanceOf(DataAccessException.class);
        assertThatThrownBy(() -> PostgresFixture.ADMIN.update("INSERT INTO savings_goals.goals (id, user_id, name, target_amount_cents) VALUES (?, ?, 'Unbekannt', 1)", UUID.randomUUID(), UUID.randomUUID())).isInstanceOf(DataAccessException.class);
    }
}
